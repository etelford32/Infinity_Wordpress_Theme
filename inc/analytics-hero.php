<?php
/**
 * Homepage hero analytics: Analytics → Homepage Hero.
 *
 * Built on the RUM events table (inc/analytics-rum.php). The hero
 * script records what visitors do in the black-hole hero as `hero`
 * events, one row per action, tagged with the session's experiment
 * arm:
 *
 *   fx     — the full interactive hero
 *   calm   — the holdout: same animated black hole, no interactions
 *            (Customize → Homepage Content → Hero experiment)
 *   static — no WebGL or reduced motion; outside the experiment
 *
 * The question this page answers is the one the effects have to earn
 * their place by: does the interactive hero send more people into the
 * lead article than the calm one? Everything is counted in sessions,
 * not clicks, so one visitor hammering the hole or reopening the
 * article does not move the numbers.
 *
 * @package Infinity
 * @since 3.10.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/** Actions that count as playing with the hole, as opposed to reading. */
function infinity_hero_play_actions() {
    return array('stir', 'lens', 'feed', 'feed-btn');
}

/** Actions that take the visitor into content from the hero. */
function infinity_hero_content_actions() {
    return array('lead-click', 'lead-cat', 'also-new', 'pillar-nav', 'wishlist');
}

/** Minimum sessions per arm before the comparison is reported. */
function infinity_hero_min_sessions() {
    return (int) apply_filters('infinity_hero_min_sessions', 100);
}

/**
 * Standard normal CDF via the Abramowitz–Stegun 7.1.26 erf
 * approximation (absolute error < 1.5e-7), plenty for a p-value.
 */
function infinity_hero_norm_cdf($z) {
    $x = abs($z) / M_SQRT2;
    $t = 1 / (1 + 0.3275911 * $x);
    $y = 1 - (((((1.061405429 * $t - 1.453152027) * $t) + 1.421413741) * $t - 0.284496736) * $t + 0.254829592) * $t * exp(-$x * $x);
    return $z >= 0 ? 0.5 * (1 + $y) : 0.5 * (1 - $y);
}

/**
 * Two-proportion z-test of arm A against arm B.
 *
 * Returns the difference in rates (A − B), its 95% confidence interval
 * (unpooled standard error), the relative lift, and the two-sided
 * p-value (pooled standard error), or null when either arm is empty.
 */
function infinity_hero_compare($hits_a, $n_a, $hits_b, $n_b) {
    if ($n_a < 1 || $n_b < 1) {
        return null;
    }
    $pa   = $hits_a / $n_a;
    $pb   = $hits_b / $n_b;
    $pool = ($hits_a + $hits_b) / ($n_a + $n_b);
    $se0  = sqrt($pool * (1 - $pool) * (1 / $n_a + 1 / $n_b));
    $se   = sqrt($pa * (1 - $pa) / $n_a + $pb * (1 - $pb) / $n_b);
    $z    = $se0 > 0 ? ($pa - $pb) / $se0 : 0.0;
    return array(
        'diff'  => $pa - $pb,
        'lo'    => $pa - $pb - 1.96 * $se,
        'hi'    => $pa - $pb + 1.96 * $se,
        'lift'  => $pb > 0 ? ($pa - $pb) / $pb : null,
        'z'     => $z,
        'p'     => 2 * (1 - infinity_hero_norm_cdf(abs($z))),
    );
}

/**
 * Median of a list of numbers, or null when empty.
 */
function infinity_hero_median($values) {
    $values = array_values(array_filter(array_map('floatval', (array) $values), 'is_finite'));
    $n      = count($values);
    if (!$n) {
        return null;
    }
    sort($values);
    $mid = (int) floor($n / 2);
    return $n % 2 ? $values[$mid] : ($values[$mid - 1] + $values[$mid]) / 2;
}

/**
 * Everything the page shows, for a window of $days.
 */
function infinity_hero_stats($days) {
    global $wpdb;
    $table = infinity_rum_table();
    $since = $wpdb->prepare('ts > DATE_SUB(NOW(), INTERVAL %d DAY)', $days);
    $base  = "event = 'hero' AND session != '' AND $since";

    $in = function ($list) {
        return "'" . implode("','", array_map('esc_sql', $list)) . "'";
    };
    $play    = $in(infinity_hero_play_actions());
    $content = $in(infinity_hero_content_actions());

    /* Per arm: sessions that saw the hero, played with it, opened the
       lead article, or went anywhere from it. One row per session
       first, then summed, so every rate is sessions over sessions. */
    $arms = $wpdb->get_results(
        "SELECT variant,
                COUNT(*) AS sessions,
                SUM(played) AS played,
                SUM(lead) AS lead,
                SUM(content) AS content,
                SUM(fell) AS fell
         FROM (
             SELECT session, MAX(variant) AS variant,
                    MAX(target IN ($play)) AS played,
                    MAX(target = 'lead-click') AS lead,
                    MAX(target IN ($content)) AS content,
                    MAX(target = 'read-fall') AS fell
             FROM $table
             WHERE $base
             GROUP BY session
             HAVING SUM(target = 'impression') > 0
         ) s
         GROUP BY variant",
        OBJECT_K
    );

    /* Within the interactive arm: did the people who played click
       through more or less than those who didn't? Self-selected, so
       this is a description, not an effect. */
    $split = $wpdb->get_results(
        "SELECT played, COUNT(*) AS sessions, SUM(lead) AS lead
         FROM (
             SELECT session,
                    MAX(target IN ($play)) AS played,
                    MAX(target = 'lead-click') AS lead
             FROM $table
             WHERE $base AND variant = 'fx'
             GROUP BY session
             HAVING SUM(target = 'impression') > 0
         ) s
         GROUP BY played",
        OBJECT_K
    );

    $actions = $wpdb->get_results(
        "SELECT target, COUNT(*) AS events, COUNT(DISTINCT session) AS sessions
         FROM $table WHERE $base
         GROUP BY target ORDER BY events DESC"
    );

    /* Seconds from the hero appearing to the first lead click */
    $ttc = $wpdb->get_col(
        "SELECT MIN(engaged) FROM $table
         WHERE $base AND target = 'lead-click' AND engaged IS NOT NULL
         GROUP BY session LIMIT 20000"
    );

    $daily = $wpdb->get_results(
        "SELECT DATE(ts) AS day,
                COUNT(DISTINCT CASE WHEN target = 'impression' THEN session END) AS seen,
                COUNT(DISTINCT CASE WHEN target = 'lead-click' THEN session END) AS lead
         FROM $table WHERE $base
         GROUP BY DATE(ts) ORDER BY day ASC"
    );

    $arm = function ($key) use ($arms) {
        $row = isset($arms[$key]) ? $arms[$key] : null;
        return array(
            'sessions' => $row ? (int) $row->sessions : 0,
            'played'   => $row ? (int) $row->played : 0,
            'lead'     => $row ? (int) $row->lead : 0,
            'content'  => $row ? (int) $row->content : 0,
            'fell'     => $row ? (int) $row->fell : 0,
        );
    };

    $fx   = $arm('fx');
    $calm = $arm('calm');

    return array(
        'arms'    => array('fx' => $fx, 'calm' => $calm, 'static' => $arm('static')),
        'lead'    => infinity_hero_compare($fx['lead'], $fx['sessions'], $calm['lead'], $calm['sessions']),
        'content' => infinity_hero_compare($fx['content'], $fx['sessions'], $calm['content'], $calm['sessions']),
        'split'   => array(
            'played' => isset($split['1']) ? array((int) $split['1']->sessions, (int) $split['1']->lead) : array(0, 0),
            'idle'   => isset($split['0']) ? array((int) $split['0']->sessions, (int) $split['0']->lead) : array(0, 0),
        ),
        'actions' => $actions ? $actions : array(),
        'ttc'     => infinity_hero_median($ttc),
        'daily'   => $daily ? $daily : array(),
    );
}

function infinity_hero_admin_menu() {
    add_submenu_page(
        'infinity-analytics',
        __('Homepage Hero', 'infinity'),
        __('Homepage Hero', 'infinity'),
        'manage_options',
        'infinity-hero',
        'infinity_hero_render_page'
    );
}
add_action('admin_menu', 'infinity_hero_admin_menu', 21);

function infinity_hero_render_page() {
    $days    = isset($_GET['days']) ? max(1, min(90, (int) $_GET['days'])) : 30;
    $st      = infinity_hero_stats($days);
    $fx      = $st['arms']['fx'];
    $calm    = $st['arms']['calm'];
    $static  = $st['arms']['static'];
    $holdout = (int) get_option('infinity_hero_holdout', 0);
    $min     = infinity_hero_min_sessions();
    $seen    = $fx['sessions'] + $calm['sessions'] + $static['sessions'];

    $pct = function ($hits, $n, $dp = 1) {
        return $n ? number_format_i18n(100 * $hits / $n, $dp) . '%' : '—';
    };
    $pp = function ($v) {
        return (($v >= 0) ? '+' : '−') . number_format_i18n(abs(100 * $v), 1);
    };
    $labels = array(
        'impression' => __('Hero shown', 'infinity'),
        'stir'       => __('Stirred the disk (pointer reached the hole)', 'infinity'),
        'lens'       => __('Held the pointer lens over the sky', 'infinity'),
        'feed'       => __('Fed the hole (backdrop click / tap)', 'infinity'),
        'feed-btn'   => __('Fed the hole (button)', 'infinity'),
        'read-fall'  => __('Read transition played', 'infinity'),
        'lead-click' => __('Opened the lead article', 'infinity'),
        'lead-cat'   => __('Lead article category link', 'infinity'),
        'also-new'   => __('"Also new" link', 'infinity'),
        'pillar-nav' => __('Section link', 'infinity'),
        'wishlist'   => __('Steam wishlist CTA', 'infinity'),
    );

    /* Verdict on the lead-article comparison */
    $ready = $fx['sessions'] >= $min && $calm['sessions'] >= $min;
    $cmp   = $st['lead'];
    if (!$calm['sessions'] && !$holdout) {
        $verdict = __('The experiment is off. Set a holdout under Customize → Homepage Content → Hero experiment to compare the interactive hero against a calm one.', 'infinity');
        $vclass  = '';
    } elseif (!$ready) {
        /* translators: %d: minimum sessions per arm */
        $verdict = sprintf(__('Collecting data: each arm needs at least %d sessions before the comparison means anything.', 'infinity'), $min);
        $vclass  = '';
    } elseif ($cmp['p'] < 0.05) {
        $verdict = $cmp['diff'] > 0
            ? __('The interactive hero sends more people into the lead article than the calm one, and the difference is statistically significant.', 'infinity')
            : __('The interactive hero sends fewer people into the lead article than the calm one, and the difference is statistically significant. The effects are costing clicks.', 'infinity');
        $vclass  = $cmp['diff'] > 0 ? 'rum-good' : 'rum-poor';
    } else {
        $verdict = __('No significant difference yet between the interactive and calm hero in lead-article clicks. Keep collecting, or treat the effects as neutral.', 'infinity');
        $vclass  = 'rum-mid';
    }
    ?>
    <div class="wrap">
        <h1><?php esc_html_e('Homepage Hero', 'infinity'); ?></h1>
        <p>
            <?php foreach (array(7, 30, 90) as $opt) : ?>
                <a class="button<?php echo $days === $opt ? ' button-primary' : ''; ?>"
                   href="<?php echo esc_url(add_query_arg(array('page' => 'infinity-hero', 'days' => $opt), admin_url('admin.php'))); ?>">
                    <?php printf(esc_html__('%d days', 'infinity'), (int) $opt); ?>
                </a>
            <?php endforeach; ?>
            <span style="margin-left:12px;color:#646970">
                <?php
                /* translators: %d: holdout percentage */
                printf(esc_html__('Current holdout: %d%% of sessions get the calm hero.', 'infinity'), (int) $holdout);
                ?>
            </span>
        </p>

        <style>
            .rum-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin:16px 0}
            .rum-card{background:#fff;border:1px solid #dcdcde;border-radius:6px;padding:14px}
            .rum-card h3{margin:0 0 6px;font-size:12px;color:#646970;text-transform:uppercase;letter-spacing:.04em}
            .rum-card .v{font-size:26px;font-weight:600;line-height:1.1}
            .rum-card small{display:block;color:#646970;margin-top:4px}
            .rum-good .v,.rum-good strong{color:#00801b}.rum-mid .v,.rum-mid strong{color:#b45309}.rum-poor .v,.rum-poor strong{color:#b32d2e}
            .hero-verdict{background:#fff;border:1px solid #dcdcde;border-left-width:4px;border-radius:6px;padding:12px 16px;margin:16px 0;font-size:14px}
            .hero-verdict.rum-good{border-left-color:#00801b}.hero-verdict.rum-mid{border-left-color:#b45309}.hero-verdict.rum-poor{border-left-color:#b32d2e}
            .rum-bar{display:flex;align-items:flex-end;gap:2px;height:110px;background:#fff;border:1px solid #dcdcde;border-radius:6px;padding:10px}
            .rum-bar i{flex:1;background:#6366f1;border-radius:2px 2px 0 0;min-height:2px}
            .rum-cols{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}
            @media (max-width:960px){.rum-cols{grid-template-columns:1fr}}
            table.widefat{margin-top:8px}
            .hero-num{font-variant-numeric:tabular-nums}
        </style>

        <div class="rum-cards">
            <div class="rum-card"><h3><?php esc_html_e('Sessions that saw the hero', 'infinity'); ?></h3><div class="v hero-num"><?php echo esc_html(number_format_i18n($seen)); ?></div></div>
            <div class="rum-card"><h3><?php esc_html_e('Lead article CTR', 'infinity'); ?></h3><div class="v hero-num"><?php echo esc_html($pct($fx['lead'] + $calm['lead'] + $static['lead'], $seen)); ?></div><small><?php esc_html_e('sessions that opened it / sessions that saw it', 'infinity'); ?></small></div>
            <div class="rum-card"><h3><?php esc_html_e('Played with the hole', 'infinity'); ?></h3><div class="v hero-num"><?php echo esc_html($pct($fx['played'], $fx['sessions'])); ?></div><small><?php esc_html_e('of interactive sessions', 'infinity'); ?></small></div>
            <div class="rum-card"><h3><?php esc_html_e('Median time to open', 'infinity'); ?></h3><div class="v hero-num"><?php echo null === $st['ttc'] ? '—' : esc_html(number_format_i18n($st['ttc'], 0) . 's'); ?></div><small><?php esc_html_e('from the hero appearing', 'infinity'); ?></small></div>
        </div>

        <h2><?php esc_html_e('Experiment: interactive vs calm hero', 'infinity'); ?></h2>
        <div class="hero-verdict <?php echo esc_attr($vclass); ?>"><?php echo esc_html($verdict); ?></div>
        <table class="widefat striped hero-num">
            <thead><tr>
                <th><?php esc_html_e('Arm', 'infinity'); ?></th>
                <th><?php esc_html_e('Sessions', 'infinity'); ?></th>
                <th><?php esc_html_e('Opened lead article', 'infinity'); ?></th>
                <th><?php esc_html_e('Any click from the hero', 'infinity'); ?></th>
                <th><?php esc_html_e('Played with the hole', 'infinity'); ?></th>
            </tr></thead>
            <tbody>
            <?php
            $rows = array(
                array(__('Interactive (fx)', 'infinity'), $fx),
                array(__('Calm holdout', 'infinity'), $calm),
                array(__('Static: no WebGL or reduced motion (not in the test)', 'infinity'), $static),
            );
            foreach ($rows as $r) : ?>
                <tr>
                    <td><?php echo esc_html($r[0]); ?></td>
                    <td><?php echo esc_html(number_format_i18n($r[1]['sessions'])); ?></td>
                    <td><?php echo esc_html($pct($r[1]['lead'], $r[1]['sessions'])); ?> <span style="color:#646970">(<?php echo esc_html(number_format_i18n($r[1]['lead'])); ?>)</span></td>
                    <td><?php echo esc_html($pct($r[1]['content'], $r[1]['sessions'])); ?></td>
                    <td><?php echo $r[1] === $fx ? esc_html($pct($r[1]['played'], $r[1]['sessions'])) : '—'; ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>

        <?php if ($ready && $cmp) : ?>
            <table class="widefat hero-num" style="max-width:820px">
                <thead><tr>
                    <th><?php esc_html_e('Metric (interactive − calm)', 'infinity'); ?></th>
                    <th><?php esc_html_e('Difference', 'infinity'); ?></th>
                    <th><?php esc_html_e('95% interval', 'infinity'); ?></th>
                    <th><?php esc_html_e('Relative lift', 'infinity'); ?></th>
                    <th><?php esc_html_e('p-value', 'infinity'); ?></th>
                </tr></thead>
                <tbody>
                <?php foreach (array(__('Opened lead article', 'infinity') => $st['lead'], __('Any click from the hero', 'infinity') => $st['content']) as $label => $c) :
                    $cls = $c['p'] < 0.05 ? ($c['diff'] > 0 ? 'rum-good' : 'rum-poor') : 'rum-mid'; ?>
                    <tr class="<?php echo esc_attr($cls); ?>">
                        <td><?php echo esc_html($label); ?></td>
                        <td><strong><?php echo esc_html($pp($c['diff'])); ?> pts</strong></td>
                        <td><?php echo esc_html($pp($c['lo']) . ' to ' . $pp($c['hi'])); ?> pts</td>
                        <td><?php echo null === $c['lift'] ? '—' : esc_html($pp($c['lift']) . '%'); ?></td>
                        <td><?php echo esc_html($c['p'] < 0.001 ? '< 0.001' : number_format_i18n($c['p'], 3)); ?></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
            <p style="color:#646970;max-width:820px"><?php esc_html_e('Two-proportion z-test on sessions. Sessions are assigned to an arm at random and keep it for the life of the tab, so this comparison is causal. Peeking often and stopping at the first p < 0.05 overstates certainty; decide a sample size up front and judge it then.', 'infinity'); ?></p>
        <?php endif; ?>

        <div class="rum-cols">
            <div>
                <h2><?php esc_html_e('What visitors did', 'infinity'); ?></h2>
                <table class="widefat striped hero-num">
                    <thead><tr>
                        <th><?php esc_html_e('Action', 'infinity'); ?></th>
                        <th><?php esc_html_e('Events', 'infinity'); ?></th>
                        <th><?php esc_html_e('Sessions', 'infinity'); ?></th>
                        <th><?php esc_html_e('Per 100 sessions', 'infinity'); ?></th>
                    </tr></thead>
                    <tbody>
                    <?php foreach ($st['actions'] as $a) : ?>
                        <tr>
                            <td><?php echo esc_html(isset($labels[$a->target]) ? $labels[$a->target] : $a->target); ?></td>
                            <td><?php echo esc_html(number_format_i18n((int) $a->events)); ?></td>
                            <td><?php echo esc_html(number_format_i18n((int) $a->sessions)); ?></td>
                            <td><?php echo $seen ? esc_html(number_format_i18n(100 * (int) $a->sessions / $seen, 1)) : '—'; ?></td>
                        </tr>
                    <?php endforeach; ?>
                    <?php if (!$st['actions']) : ?><tr><td colspan="4"><?php esc_html_e('No hero data yet. It appears once logged-out visitors reach the homepage.', 'infinity'); ?></td></tr><?php endif; ?>
                    </tbody>
                </table>
                <p style="color:#646970"><?php esc_html_e('Feeding is capped at 10 events per pageview and one-off actions at one, so a single enthusiastic visitor cannot dominate the counts.', 'infinity'); ?></p>
            </div>
            <div>
                <h2><?php esc_html_e('Players vs non-players (interactive arm)', 'infinity'); ?></h2>
                <table class="widefat striped hero-num">
                    <thead><tr>
                        <th></th>
                        <th><?php esc_html_e('Sessions', 'infinity'); ?></th>
                        <th><?php esc_html_e('Opened lead article', 'infinity'); ?></th>
                    </tr></thead>
                    <tbody>
                        <tr><td><?php esc_html_e('Played with the hole', 'infinity'); ?></td><td><?php echo esc_html(number_format_i18n($st['split']['played'][0])); ?></td><td><?php echo esc_html($pct($st['split']['played'][1], $st['split']['played'][0])); ?></td></tr>
                        <tr><td><?php esc_html_e('Did not', 'infinity'); ?></td><td><?php echo esc_html(number_format_i18n($st['split']['idle'][0])); ?></td><td><?php echo esc_html($pct($st['split']['idle'][1], $st['split']['idle'][0])); ?></td></tr>
                    </tbody>
                </table>
                <p style="color:#646970"><?php esc_html_e('Descriptive only: visitors choose whether to play, and the curious ones may click more anyway. Use the experiment above for cause and effect.', 'infinity'); ?></p>

                <h2><?php esc_html_e('Read transition', 'infinity'); ?></h2>
                <p class="hero-num">
                    <?php
                    printf(
                        /* translators: 1: sessions with the read transition, 2: sessions that opened the lead article */
                        esc_html__('Played in %1$s of %2$s interactive sessions that opened the lead article (the rest used a modified or middle click, which skips it).', 'infinity'),
                        esc_html(number_format_i18n($fx['fell'])),
                        esc_html(number_format_i18n($fx['lead']))
                    );
                    ?>
                </p>
            </div>
        </div>

        <h2><?php esc_html_e('Daily lead-article CTR', 'infinity'); ?></h2>
        <div class="rum-bar">
            <?php
            $max_ctr = 0;
            foreach ($st['daily'] as $d) {
                if ((int) $d->seen) {
                    $max_ctr = max($max_ctr, (int) $d->lead / (int) $d->seen);
                }
            }
            foreach ($st['daily'] as $d) :
                $ctr = (int) $d->seen ? (int) $d->lead / (int) $d->seen : 0;
                ?>
                <i style="height:<?php echo esc_attr($max_ctr ? max(2, round(100 * $ctr / $max_ctr)) : 2); ?>%"
                   title="<?php echo esc_attr($d->day . ': ' . round(100 * $ctr, 1) . '% (' . (int) $d->lead . ' / ' . (int) $d->seen . ')'); ?>"></i>
            <?php endforeach; ?>
            <?php if (!$st['daily']) : ?><em style="align-self:center;margin:auto;color:#646970"><?php esc_html_e('No data yet.', 'infinity'); ?></em><?php endif; ?>
        </div>

        <p style="color:#646970;margin-top:20px;">
            <?php esc_html_e('Same privacy rules as Site & Speed: anonymous, cookieless, logged-out visitors only. The arm lives in sessionStorage and ends with the tab.', 'infinity'); ?>
        </p>
    </div>
    <?php
}
