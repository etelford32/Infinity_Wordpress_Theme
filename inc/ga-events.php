<?php
/**
 * GA4 conversion events for the project funnel.
 *
 * Site Kit already prints the gtag.js snippet and the GA4 config; this
 * file only adds the events on top of it, so nothing here creates a
 * second tag or a second pageview. Events (mark the ones you care
 * about as Key events in GA4 → Admin → Events):
 *
 *   project_click       — any click through to a project site
 *                         (project, placement, cta, link_url, link_text)
 *   wishlist_click      — the Steam wishlist subset of project_click
 *   project_impression  — a project block was at least half on screen
 *   project_intent      — a "where do you want to start" tile was used
 *   sign_up             — newsletter signup (GA4 recommended event)
 *
 * @package Infinity
 * @since 3.15.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Hostname → project key, for links that carry no data-project of
 * their own (homepage cards, links typed into posts and pages).
 */
function infinity_ga_project_hosts() {
    $urls  = infinity_property_urls();
    $hosts = array();
    foreach (array('etu', 'parkers', 'landscaping') as $key) {
        $host = wp_parse_url($urls[$key], PHP_URL_HOST);
        if ($host) {
            $hosts[preg_replace('/^www\./', '', strtolower($host))] = $key;
        }
    }
    return apply_filters('infinity_ga_project_hosts', $hosts);
}

/**
 * Whether the project sites share this site's GA4 property, in which
 * case gtag's cross-domain linker carries the visitor across instead of
 * the click starting a brand-new user over there.
 */
function infinity_ga_linker_enabled() {
    return (bool) get_option('infinity_ga_linker', 0);
}

/**
 * Where a page sits in the funnel, sent with every event so GA reports
 * can be split by "homepage vs projects page vs article".
 */
function infinity_ga_context() {
    if (is_front_page()) {
        return 'home';
    }
    if (infinity_is_projects_page()) {
        return 'projects';
    }
    if (is_singular('post')) {
        return 'article';
    }
    if (is_page()) {
        return 'page';
    }
    if (is_archive() || is_home()) {
        return 'archive';
    }
    return 'other';
}

/**
 * True on the projects page (the page-projects.php template, whether
 * picked up by slug or chosen from the Template dropdown).
 */
function infinity_is_projects_page() {
    return is_page('projects') || is_page_template('page-projects.php');
}

function infinity_ga_enqueue() {
    if (is_admin()) {
        return;
    }
    wp_enqueue_script(
        'infinity-ga-events',
        INFINITY_URI . '/assets/js/ga-events.js',
        array(),
        INFINITY_VERSION,
        array('in_footer' => true, 'strategy' => 'defer')
    );
    wp_localize_script('infinity-ga-events', 'infinityGa', array(
        'hosts'   => infinity_ga_project_hosts(),
        'steamApp'=> infinity_steam_app_id(),
        'context' => infinity_ga_context(),
    ));
}
add_action('wp_enqueue_scripts', 'infinity_ga_enqueue');

/**
 * Cross-domain linker, through Site Kit's own gtag config filter so it
 * rides on the tag Site Kit already prints. Off unless enabled in the
 * Customizer: it only helps when the other sites use the same GA4
 * property (Steam never does, so it is never in the list).
 */
function infinity_ga_linker($opt) {
    if (!infinity_ga_linker_enabled()) {
        return $opt;
    }
    $domains = array_keys(infinity_ga_project_hosts());
    $self    = wp_parse_url(home_url(), PHP_URL_HOST);
    if ($self) {
        $domains[] = preg_replace('/^www\./', '', $self);
    }
    $opt = is_array($opt) ? $opt : array();
    $opt['linker'] = array('domains' => array_values(array_unique($domains)));
    return $opt;
}
add_filter('googlesitekit_gtag_opt', 'infinity_ga_linker');

/**
 * Customizer: the linker toggle, beside the project URLs.
 */
function infinity_ga_customize_register($wp_customize) {
    $wp_customize->add_setting('infinity_ga_linker', array(
        'type'              => 'option',
        'default'           => 0,
        'sanitize_callback' => 'absint',
    ));
    $wp_customize->add_control('infinity_ga_linker', array(
        'label'       => esc_html__('Project sites share this GA4 property', 'infinity'),
        'description' => esc_html__("Turn on only if Parker's Physics / ETU / Landscaping report into the same GA4 property as this site. Enables cross-domain linking and drops the UTM tags on those links (UTMs would otherwise restart the session).", 'infinity'),
        'section'     => 'infinity_steam_settings',
        'type'        => 'checkbox',
    ));
}
add_action('customize_register', 'infinity_ga_customize_register', 20);

/**
 * Outbound URL for a project link, tagged so the destination's own
 * analytics can see which placement sent the visitor.
 *
 * @param string $url       Destination.
 * @param string $placement Where on this site the link sits (utm_campaign).
 * @param string $cta       Which button (utm_content).
 */
function infinity_project_href($url, $placement, $cta = '') {
    $host = preg_replace('/^www\./', '', strtolower((string) wp_parse_url($url, PHP_URL_HOST)));

    // Steam links already carry their UTM set from infinity_property_urls()
    if ('store.steampowered.com' === $host) {
        return add_query_arg('utm_campaign', sanitize_key($placement), $url);
    }

    $hosts = infinity_ga_project_hosts();
    if (isset($hosts[$host]) && infinity_ga_linker_enabled()) {
        return $url;
    }

    return add_query_arg(array_filter(array(
        'utm_source'   => 'elliottelford.com',
        'utm_medium'   => 'referral',
        'utm_campaign' => sanitize_key($placement),
        'utm_content'  => $cta ? sanitize_key($cta) : '',
    )), $url);
}

/**
 * data-* attributes the event layer reads off a link.
 */
function infinity_project_attrs($project, $placement, $cta) {
    printf(
        ' data-project="%1$s" data-placement="%2$s" data-cta="%3$s" data-rum="%4$s"',
        esc_attr($project),
        esc_attr($placement),
        esc_attr($cta),
        esc_attr($placement . ':' . $project . ':' . $cta)
    );
}
