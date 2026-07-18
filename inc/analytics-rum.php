<?php
/**
 * Real-user monitoring (RUM): page performance + engagement analytics.
 *
 * Cookieless and anonymous — no IPs, no user agents, no PII stored.
 * assets/js/rum.js beacons events to a REST endpoint; this module stores
 * them, prunes them after 90 days, and renders the "Site & Speed" admin
 * dashboard (pageviews, Core Web Vitals p75, scroll depth, engaged time,
 * drop-off/exit rates, subscribe funnel).
 *
 * Event types:
 *   view      — a pageview (sent on load; carries TTFB)
 *   exit      — sent when the page is hidden/left (LCP, CLS, INP, FCP,
 *               max scroll %, engaged seconds)
 *   click     — outbound link or [data-rum] element click
 *   seen      — a tracked element scrolled into view (subscribe band)
 *   subscribe — successful signup through the subscribe form
 *
 * @package Infinity
 * @since 3.1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

define('INFINITY_RUM_DB_VERSION', '1');
define('INFINITY_RUM_RETENTION_DAYS', 90);

function infinity_rum_table() {
    global $wpdb;
    return $wpdb->prefix . 'infinity_rum_events';
}

/**
 * Create/upgrade the events table. Version-checked on admin_init so
 * existing installs pick it up without a theme re-activation.
 */
function infinity_rum_create_table() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    $table   = infinity_rum_table();
    $charset = $wpdb->get_charset_collate();

    dbDelta("CREATE TABLE $table (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        ts DATETIME NOT NULL,
        event VARCHAR(12) NOT NULL,
        session VARCHAR(16) NOT NULL DEFAULT '',
        path VARCHAR(191) NOT NULL DEFAULT '',
        ref VARCHAR(100) NOT NULL DEFAULT '',
        device VARCHAR(8) NOT NULL DEFAULT '',
        target VARCHAR(100) NOT NULL DEFAULT '',
        ttfb SMALLINT UNSIGNED NULL,
        fcp SMALLINT UNSIGNED NULL,
        lcp SMALLINT UNSIGNED NULL,
        cls SMALLINT UNSIGNED NULL,
        inp SMALLINT UNSIGNED NULL,
        scroll_pct TINYINT UNSIGNED NULL,
        engaged SMALLINT UNSIGNED NULL,
        PRIMARY KEY  (id),
        KEY ts (ts),
        KEY event (event, ts),
        KEY path (path),
        KEY session (session)
    ) $charset;");

    update_option('infinity_rum_db_version', INFINITY_RUM_DB_VERSION);
}
add_action('after_switch_theme', 'infinity_rum_create_table');

function infinity_rum_maybe_upgrade() {
    if (get_option('infinity_rum_db_version') !== INFINITY_RUM_DB_VERSION) {
        infinity_rum_create_table();
    }
}
add_action('admin_init', 'infinity_rum_maybe_upgrade');

/**
 * Daily retention prune.
 */
function infinity_rum_schedule_prune() {
    if (!wp_next_scheduled('infinity_rum_prune')) {
        wp_schedule_event(time() + HOUR_IN_SECONDS, 'daily', 'infinity_rum_prune');
    }
}
add_action('init', 'infinity_rum_schedule_prune');

function infinity_rum_do_prune() {
    global $wpdb;
    $table = infinity_rum_table();
    $wpdb->query($wpdb->prepare(
        "DELETE FROM $table WHERE ts < DATE_SUB(NOW(), INTERVAL %d DAY)",
        INFINITY_RUM_RETENTION_DAYS
    ));
}
add_action('infinity_rum_prune', 'infinity_rum_do_prune');

/**
 * Enqueue the collector for visitors only — logged-in users (you,
 * editing) are never tracked, which also keeps admin visits out of
 * the numbers.
 */
function infinity_rum_enqueue() {
    if (is_user_logged_in() || is_admin() || is_preview()) {
        return;
    }
    wp_enqueue_script(
        'infinity-rum',
        INFINITY_URI . '/assets/js/rum.js',
        array(),
        wp_get_theme()->get('Version'),
        array('in_footer' => true, 'strategy' => 'defer')
    );
    wp_localize_script('infinity-rum', 'infinityRum', array(
        'endpoint' => esc_url_raw(rest_url('infinity/v1/rum')),
    ));
}
add_action('wp_enqueue_scripts', 'infinity_rum_enqueue');

/**
 * REST: accept a beacon. sendBeacon posts as text/plain, so parse the
 * raw body rather than relying on the JSON content-type.
 */
function infinity_rum_register_route() {
    register_rest_route('infinity/v1', '/rum', array(
        'methods'             => 'POST',
        'callback'            => 'infinity_rum_ingest',
        'permission_callback' => '__return_true',
    ));
}
add_action('rest_api_init', 'infinity_rum_register_route');

function infinity_rum_ingest(WP_REST_Request $request) {
    // Same-origin guard: browsers always send Origin on cross-origin
    // POSTs, so a mismatched Origin means it isn't our page.
    $origin = $request->get_header('origin');
    if ($origin && wp_parse_url($origin, PHP_URL_HOST) !== wp_parse_url(home_url(), PHP_URL_HOST)) {
        return new WP_REST_Response(null, 204);
    }

    // Rate limit: 120 events/min per IP (never stored, only hashed for
    // the limiter key).
    $ip  = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
    $key = 'inf_rum_' . md5($ip);
    $hits = (int) get_transient($key);
    if ($hits > 120) {
        return new WP_REST_Response(null, 429);
    }
    set_transient($key, $hits + 1, MINUTE_IN_SECONDS);

    $data = json_decode($request->get_body(), true);
    if (!is_array($data)) {
        return new WP_REST_Response(null, 400);
    }

    $event = isset($data['e']) ? (string) $data['e'] : '';
    if (!in_array($event, array('view', 'exit', 'click', 'seen', 'subscribe'), true)) {
        return new WP_REST_Response(null, 400);
    }

    $clamp = function ($v, $max) {
        if (!isset($v) || !is_numeric($v) || $v < 0) {
            return null;
        }
        return (int) min((float) $v, $max);
    };

    $path = isset($data['p']) ? (string) $data['p'] : '';
    $path = wp_parse_url($path, PHP_URL_PATH);
    $path = $path ? substr($path, 0, 191) : '/';

    $ref = isset($data['r']) ? (string) $data['r'] : '';
    $ref = $ref ? (string) wp_parse_url($ref, PHP_URL_HOST) : '';
    if ($ref === wp_parse_url(home_url(), PHP_URL_HOST)) {
        $ref = ''; // internal navigation is not a referrer
    }

    $device = isset($data['d']) ? (string) $data['d'] : '';
    if (!in_array($device, array('mobile', 'tablet', 'desktop'), true)) {
        $device = '';
    }

    global $wpdb;
    $wpdb->insert(infinity_rum_table(), array(
        'ts'         => current_time('mysql'),
        'event'      => $event,
        'session'    => substr(preg_replace('/[^a-z0-9]/i', '', isset($data['s']) ? (string) $data['s'] : ''), 0, 16),
        'path'       => $path,
        'ref'        => substr($ref, 0, 100),
        'device'     => $device,
        'target'     => substr(sanitize_text_field(isset($data['t']) ? (string) $data['t'] : ''), 0, 100),
        'ttfb'       => $clamp(isset($data['ttfb']) ? $data['ttfb'] : null, 65000),
        'fcp'        => $clamp(isset($data['fcp']) ? $data['fcp'] : null, 65000),
        'lcp'        => $clamp(isset($data['lcp']) ? $data['lcp'] : null, 65000),
        'cls'        => $clamp(isset($data['cls']) ? $data['cls'] : null, 65000), // value ×1000
        'inp'        => $clamp(isset($data['inp']) ? $data['inp'] : null, 65000),
        'scroll_pct' => $clamp(isset($data['sc']) ? $data['sc'] : null, 100),
        'engaged'    => $clamp(isset($data['eng']) ? $data['eng'] : null, 7200),
    ));

    return new WP_REST_Response(null, 204);
}

/* -------------------------------------------------------------------------
 * Aggregation helpers
 * ---------------------------------------------------------------------- */

/**
 * p75 of a metric column over the period. $column is internal (never
 * user input).
 */
function infinity_rum_p75($column, $days, $path = '') {
    global $wpdb;
    $table = infinity_rum_table();
    $where = "event = 'exit' AND $column IS NOT NULL AND ts > DATE_SUB(NOW(), INTERVAL %d DAY)";
    $args  = array($days);
    if ('ttfb' === $column) {
        $where = str_replace("'exit'", "'view'", $where);
    }
    if ($path) {
        $where .= ' AND path = %s';
        $args[] = $path;
    }

    $count = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE $where", $args));
    if (!$count) {
        return null;
    }
    $offset = min((int) floor($count * 0.75), $count - 1);
    $args[] = $offset;
    return $wpdb->get_var($wpdb->prepare(
        "SELECT $column FROM $table WHERE $where ORDER BY $column ASC LIMIT 1 OFFSET %d",
        $args
    ));
}

/**
 * Exit counts per page: the last pageview of each session marks where
 * that visitor dropped off.
 */
function infinity_rum_exits_by_path($days) {
    global $wpdb;
    $table = infinity_rum_table();
    $rows  = $wpdb->get_results($wpdb->prepare(
        "SELECT t.path, COUNT(*) AS exits FROM $table t
         INNER JOIN (
             SELECT session, MAX(id) AS last_id FROM $table
             WHERE event = 'view' AND session != '' AND ts > DATE_SUB(NOW(), INTERVAL %d DAY)
             GROUP BY session
         ) last ON last.last_id = t.id
         GROUP BY t.path",
        $days
    ), OBJECT_K);
    return $rows ? $rows : array();
}

/* -------------------------------------------------------------------------
 * Admin dashboard: Analytics → Site & Speed
 * ---------------------------------------------------------------------- */

function infinity_rum_admin_menu() {
    add_submenu_page(
        'infinity-analytics',
        __('Site & Speed', 'infinity'),
        __('Site & Speed', 'infinity'),
        'manage_options',
        'infinity-rum',
        'infinity_rum_render_page'
    );
}
add_action('admin_menu', 'infinity_rum_admin_menu', 20);

function infinity_rum_render_page() {
    global $wpdb;
    $table = infinity_rum_table();
    $days  = isset($_GET['days']) ? max(1, min(90, (int) $_GET['days'])) : 30;

    $views    = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE event='view' AND ts > DATE_SUB(NOW(), INTERVAL %d DAY)", $days));
    $sessions = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(DISTINCT session) FROM $table WHERE event='view' AND session != '' AND ts > DATE_SUB(NOW(), INTERVAL %d DAY)", $days));
    $signups  = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE event='subscribe' AND ts > DATE_SUB(NOW(), INTERVAL %d DAY)", $days));
    $band_seen = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE event='seen' AND target='subscribe-band' AND ts > DATE_SUB(NOW(), INTERVAL %d DAY)", $days));
    $scrolled  = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE event='exit' AND scroll_pct >= 50 AND ts > DATE_SUB(NOW(), INTERVAL %d DAY)", $days));
    $avg_eng   = $wpdb->get_var($wpdb->prepare("SELECT AVG(engaged) FROM $table WHERE event='exit' AND engaged IS NOT NULL AND ts > DATE_SUB(NOW(), INTERVAL %d DAY)", $days));

    $p75 = array(
        'lcp'  => infinity_rum_p75('lcp', $days),
        'inp'  => infinity_rum_p75('inp', $days),
        'cls'  => infinity_rum_p75('cls', $days),
        'ttfb' => infinity_rum_p75('ttfb', $days),
    );

    $daily = $wpdb->get_results($wpdb->prepare(
        "SELECT DATE(ts) AS day, COUNT(*) AS views FROM $table
         WHERE event='view' AND ts > DATE_SUB(NOW(), INTERVAL %d DAY)
         GROUP BY DATE(ts) ORDER BY day ASC",
        $days
    ));
    $daily_max = 0;
    foreach ($daily as $d) {
        $daily_max = max($daily_max, (int) $d->views);
    }

    $exits = infinity_rum_exits_by_path($days);

    $pages = $wpdb->get_results($wpdb->prepare(
        "SELECT path,
                SUM(event='view') AS views,
                AVG(CASE WHEN event='exit' THEN scroll_pct END) AS avg_scroll,
                AVG(CASE WHEN event='exit' THEN engaged END) AS avg_engaged
         FROM $table
         WHERE event IN ('view','exit') AND ts > DATE_SUB(NOW(), INTERVAL %d DAY)
         GROUP BY path HAVING views > 0 ORDER BY views DESC LIMIT 15",
        $days
    ));

    $slow_pages = array();
    foreach (array_slice($pages, 0, 10) as $pg) {
        $lcp = infinity_rum_p75('lcp', $days, $pg->path);
        if (null !== $lcp) {
            $slow_pages[$pg->path] = (int) $lcp;
        }
    }
    arsort($slow_pages);

    $referrers = $wpdb->get_results($wpdb->prepare(
        "SELECT ref, COUNT(*) AS views FROM $table
         WHERE event='view' AND ref != '' AND ts > DATE_SUB(NOW(), INTERVAL %d DAY)
         GROUP BY ref ORDER BY views DESC LIMIT 10",
        $days
    ));

    $devices = $wpdb->get_results($wpdb->prepare(
        "SELECT device, COUNT(*) AS views FROM $table
         WHERE event='view' AND device != '' AND ts > DATE_SUB(NOW(), INTERVAL %d DAY)
         GROUP BY device ORDER BY views DESC",
        $days
    ));

    $clicks = $wpdb->get_results($wpdb->prepare(
        "SELECT target, COUNT(*) AS n FROM $table
         WHERE event='click' AND ts > DATE_SUB(NOW(), INTERVAL %d DAY)
         GROUP BY target ORDER BY n DESC LIMIT 10",
        $days
    ));

    $fmt_ms = function ($v) {
        if (null === $v) {
            return '—';
        }
        $v = (int) $v;
        return $v >= 1000 ? round($v / 1000, 2) . 's' : $v . 'ms';
    };
    $vital_class = function ($metric, $v) {
        if (null === $v) {
            return '';
        }
        $good = array('lcp' => 2500, 'inp' => 200, 'cls' => 100, 'ttfb' => 800);
        $poor = array('lcp' => 4000, 'inp' => 500, 'cls' => 250, 'ttfb' => 1800);
        if ($v <= $good[$metric]) {
            return 'rum-good';
        }
        return $v <= $poor[$metric] ? 'rum-mid' : 'rum-poor';
    };
    ?>
    <div class="wrap">
        <h1><?php esc_html_e('Site & Speed', 'infinity'); ?></h1>
        <p>
            <?php foreach (array(7, 30, 90) as $opt) : ?>
                <a class="button<?php echo $days === $opt ? ' button-primary' : ''; ?>"
                   href="<?php echo esc_url(add_query_arg(array('page' => 'infinity-rum', 'days' => $opt), admin_url('admin.php'))); ?>">
                    <?php printf(esc_html__('%d days', 'infinity'), (int) $opt); ?>
                </a>
            <?php endforeach; ?>
        </p>

        <style>
            .rum-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin:16px 0}
            .rum-card{background:#fff;border:1px solid #dcdcde;border-radius:6px;padding:14px}
            .rum-card h3{margin:0 0 6px;font-size:12px;color:#646970;text-transform:uppercase;letter-spacing:.04em}
            .rum-card .v{font-size:26px;font-weight:600;line-height:1.1}
            .rum-good .v{color:#00801b}.rum-mid .v{color:#b45309}.rum-poor .v{color:#b32d2e}
            .rum-cols{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}
            .rum-bar{display:flex;align-items:flex-end;gap:2px;height:110px;background:#fff;border:1px solid #dcdcde;border-radius:6px;padding:10px}
            .rum-bar i{flex:1;background:#6366f1;border-radius:2px 2px 0 0;min-height:2px}
            .rum-funnel td:first-child{width:220px}
            .rum-meter{background:#e2e4e7;border-radius:4px;height:16px;overflow:hidden}
            .rum-meter i{display:block;height:100%;background:#6366f1}
            table.widefat{margin-top:8px}
        </style>

        <div class="rum-cards">
            <div class="rum-card"><h3><?php esc_html_e('Pageviews', 'infinity'); ?></h3><div class="v"><?php echo esc_html(number_format_i18n($views)); ?></div></div>
            <div class="rum-card"><h3><?php esc_html_e('Sessions', 'infinity'); ?></h3><div class="v"><?php echo esc_html(number_format_i18n($sessions)); ?></div></div>
            <div class="rum-card"><h3><?php esc_html_e('Avg engaged time', 'infinity'); ?></h3><div class="v"><?php echo esc_html($avg_eng ? round($avg_eng) . 's' : '—'); ?></div></div>
            <div class="rum-card"><h3><?php esc_html_e('Signups', 'infinity'); ?></h3><div class="v"><?php echo esc_html(number_format_i18n($signups)); ?></div></div>
            <div class="rum-card <?php echo esc_attr($vital_class('lcp', $p75['lcp'])); ?>"><h3>LCP p75</h3><div class="v"><?php echo esc_html($fmt_ms($p75['lcp'])); ?></div></div>
            <div class="rum-card <?php echo esc_attr($vital_class('inp', $p75['inp'])); ?>"><h3>INP p75</h3><div class="v"><?php echo esc_html($fmt_ms($p75['inp'])); ?></div></div>
            <div class="rum-card <?php echo esc_attr($vital_class('cls', $p75['cls'])); ?>"><h3>CLS p75</h3><div class="v"><?php echo null === $p75['cls'] ? '—' : esc_html(number_format((int) $p75['cls'] / 1000, 3)); ?></div></div>
            <div class="rum-card <?php echo esc_attr($vital_class('ttfb', $p75['ttfb'])); ?>"><h3>TTFB p75</h3><div class="v"><?php echo esc_html($fmt_ms($p75['ttfb'])); ?></div></div>
        </div>

        <h2><?php esc_html_e('Daily pageviews', 'infinity'); ?></h2>
        <div class="rum-bar">
            <?php foreach ($daily as $d) : ?>
                <i style="height:<?php echo esc_attr($daily_max ? max(2, round(100 * (int) $d->views / $daily_max)) : 2); ?>%"
                   title="<?php echo esc_attr($d->day . ': ' . $d->views); ?>"></i>
            <?php endforeach; ?>
            <?php if (!$daily) : ?><em style="align-self:center;margin:auto;color:#646970"><?php esc_html_e('No data yet — check back after the collector has been live for a day.', 'infinity'); ?></em><?php endif; ?>
        </div>

        <h2><?php esc_html_e('Subscribe funnel', 'infinity'); ?></h2>
        <table class="widefat striped rum-funnel">
            <tbody>
            <?php
            $funnel = array(
                array(__('Pageviews', 'infinity'), $views),
                array(__('Scrolled past 50%', 'infinity'), $scrolled),
                array(__('Saw subscribe band', 'infinity'), $band_seen),
                array(__('Subscribed', 'infinity'), $signups),
            );
            foreach ($funnel as $step) :
                $pct = $views ? round(100 * $step[1] / $views, 1) : 0;
                ?>
                <tr>
                    <td><?php echo esc_html($step[0]); ?></td>
                    <td style="width:90px"><strong><?php echo esc_html(number_format_i18n($step[1])); ?></strong></td>
                    <td><div class="rum-meter"><i style="width:<?php echo esc_attr(min(100, $pct)); ?>%"></i></div></td>
                    <td style="width:60px"><?php echo esc_html($pct); ?>%</td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>

        <div class="rum-cols">
            <div>
                <h2><?php esc_html_e('Top pages & drop-off', 'infinity'); ?></h2>
                <table class="widefat striped">
                    <thead><tr>
                        <th><?php esc_html_e('Page', 'infinity'); ?></th>
                        <th><?php esc_html_e('Views', 'infinity'); ?></th>
                        <th><?php esc_html_e('Avg scroll', 'infinity'); ?></th>
                        <th><?php esc_html_e('Engaged', 'infinity'); ?></th>
                        <th><?php esc_html_e('Exit rate', 'infinity'); ?></th>
                    </tr></thead>
                    <tbody>
                    <?php foreach ($pages as $pg) :
                        $n_exits   = isset($exits[$pg->path]) ? (int) $exits[$pg->path]->exits : 0;
                        $exit_rate = $pg->views ? round(100 * $n_exits / (int) $pg->views) : 0;
                        ?>
                        <tr>
                            <td><a href="<?php echo esc_url(home_url($pg->path)); ?>" target="_blank" rel="noopener"><?php echo esc_html($pg->path); ?></a></td>
                            <td><?php echo esc_html(number_format_i18n((int) $pg->views)); ?></td>
                            <td><?php echo null === $pg->avg_scroll ? '—' : esc_html(round($pg->avg_scroll) . '%'); ?></td>
                            <td><?php echo null === $pg->avg_engaged ? '—' : esc_html(round($pg->avg_engaged) . 's'); ?></td>
                            <td><?php echo esc_html($exit_rate); ?>%</td>
                        </tr>
                    <?php endforeach; ?>
                    <?php if (!$pages) : ?><tr><td colspan="5"><?php esc_html_e('No data yet.', 'infinity'); ?></td></tr><?php endif; ?>
                    </tbody>
                </table>

                <h2><?php esc_html_e('Slowest pages (LCP p75)', 'infinity'); ?></h2>
                <table class="widefat striped">
                    <tbody>
                    <?php foreach ($slow_pages as $sp_path => $sp_lcp) : ?>
                        <tr>
                            <td><?php echo esc_html($sp_path); ?></td>
                            <td class="<?php echo esc_attr($vital_class('lcp', $sp_lcp)); ?>"><span class="v"><?php echo esc_html($fmt_ms($sp_lcp)); ?></span></td>
                        </tr>
                    <?php endforeach; ?>
                    <?php if (!$slow_pages) : ?><tr><td><?php esc_html_e('No data yet.', 'infinity'); ?></td></tr><?php endif; ?>
                    </tbody>
                </table>
            </div>
            <div>
                <h2><?php esc_html_e('Referrers', 'infinity'); ?></h2>
                <table class="widefat striped">
                    <tbody>
                    <?php foreach ($referrers as $r) : ?>
                        <tr><td><?php echo esc_html($r->ref); ?></td><td><?php echo esc_html(number_format_i18n((int) $r->views)); ?></td></tr>
                    <?php endforeach; ?>
                    <?php if (!$referrers) : ?><tr><td><?php esc_html_e('No external referrers yet.', 'infinity'); ?></td></tr><?php endif; ?>
                    </tbody>
                </table>

                <h2><?php esc_html_e('Devices', 'infinity'); ?></h2>
                <table class="widefat striped">
                    <tbody>
                    <?php foreach ($devices as $dev) : ?>
                        <tr>
                            <td><?php echo esc_html($dev->device); ?></td>
                            <td><?php echo esc_html(number_format_i18n((int) $dev->views)); ?></td>
                            <td><?php echo esc_html($views ? round(100 * (int) $dev->views / $views) : 0); ?>%</td>
                        </tr>
                    <?php endforeach; ?>
                    <?php if (!$devices) : ?><tr><td><?php esc_html_e('No data yet.', 'infinity'); ?></td></tr><?php endif; ?>
                    </tbody>
                </table>

                <h2><?php esc_html_e('Outbound & CTA clicks', 'infinity'); ?></h2>
                <table class="widefat striped">
                    <tbody>
                    <?php foreach ($clicks as $c) : ?>
                        <tr><td><?php echo esc_html($c->target); ?></td><td><?php echo esc_html(number_format_i18n((int) $c->n)); ?></td></tr>
                    <?php endforeach; ?>
                    <?php if (!$clicks) : ?><tr><td><?php esc_html_e('No clicks tracked yet.', 'infinity'); ?></td></tr><?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <p style="color:#646970;margin-top:20px;">
            <?php
            printf(
                /* translators: %d: retention days */
                esc_html__('Data is anonymous and cookieless (no IPs or user agents stored), collected only from logged-out visitors, and pruned after %d days.', 'infinity'),
                (int) INFINITY_RUM_RETENTION_DAYS
            );
            ?>
        </p>
    </div>
    <?php
}
