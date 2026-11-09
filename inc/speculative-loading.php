<?php
/**
 * Speculative loading: prerender internal links before they're clicked
 *
 * WordPress 6.8+ prints a <script type="speculationrules"> on every
 * front-end page, set to prefetch on pointerdown ("conservative"). This
 * upgrades it to prerender with moderate eagerness: Chromium starts
 * loading and rendering a same-site link once the pointer has rested
 * on it for ~200 ms (or on pointerdown on touch screens), so by the
 * time the click lands the page is already painted and the navigation
 * is close to instant. Browsers without the Speculation Rules API
 * (Firefox, Safari today) ignore the script; nothing changes for them.
 *
 * Core already never speculates wp-admin, wp-login, uploads, theme and
 * plugin files, any URL with a query string, rel="nofollow" links, or
 * links inside .no-prerender / .no-prefetch. Added here: pages with
 * side effects or per-visitor state (checkout, account, cart, sign-up)
 * and feeds.
 *
 * Analytics: a prerendered page that is never opened must not count as
 * a view. assets/js/rum.js waits for activation (prerenderingchange)
 * and measures vitals from activationStart; Site Kit's gtag.js already
 * defers hits until activation. Animation loops (black hole, logo
 * orbits) run on requestAnimationFrame, which a hidden prerendered page
 * does not get, so they cost nothing until the page is shown.
 *
 * Filter: infinity_speculation (array|null) — return null to switch
 * speculative loading off, or change mode/eagerness.
 *
 * @package Infinity
 * @since 3.18.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Prerender, moderate eagerness, for visitors. Core passes null for
 * logged-in users and sites without pretty permalinks, and that is
 * kept: editors browsing with the admin bar shouldn't fire off
 * background renders of pages they are about to edit.
 *
 * @param array|null $config
 * @return array|null
 */
function infinity_speculation_config($config) {
    if (null === $config) {
        return null;
    }
    return apply_filters('infinity_speculation', array(
        'mode'      => 'prerender',
        'eagerness' => 'moderate',
    ));
}
add_filter('wp_speculation_rules_configuration', 'infinity_speculation_config');

/**
 * Paths never to speculate, as URL patterns relative to the home URL.
 *
 * @return string[]
 */
function infinity_speculation_exclude_paths() {
    return array(
        '/checkout/*',
        '/cart/*',
        '/my-account/*',
        '/your-account/*',
        '/sign-up/*',
        '/feed/*',
        '/*/feed/*',
        '/wp-json/*',
        '/graphql',
    );
}

/**
 * @param string[] $paths
 * @return string[]
 */
function infinity_speculation_exclude($paths) {
    return array_merge((array) $paths, infinity_speculation_exclude_paths());
}
add_filter('wp_speculation_rules_href_exclude_paths', 'infinity_speculation_exclude');

/**
 * Before WordPress 6.8 core prints no rules at all; print the same ones
 * ourselves so the theme behaves the same on an older install.
 */
function infinity_speculation_fallback() {
    if (function_exists('wp_get_speculation_rules_configuration') || is_user_logged_in() || !get_option('permalink_structure')) {
        return;
    }
    $config = infinity_speculation_config(array());
    if (!$config) {
        return;
    }
    $home    = wp_parse_url(home_url('/'), PHP_URL_PATH);
    $home    = $home ? rtrim($home, '/') : '';
    $exclude = array('/wp-*.php', '/wp-admin/*', '/wp-content/*', '/*\\?(.+)');
    foreach (infinity_speculation_exclude_paths() as $p) {
        $exclude[] = $home . $p;
    }
    $rules = array(
        $config['mode'] => array(array(
            'source'    => 'document',
            'where'     => array('and' => array(
                array('href_matches' => $home . '/*'),
                array('not' => array('href_matches' => $exclude)),
                array('not' => array('selector_matches' => 'a[rel~="nofollow"]')),
                array('not' => array('selector_matches' => '.no-prerender, .no-prerender a, .no-prefetch, .no-prefetch a')),
            )),
            'eagerness' => $config['eagerness'],
        )),
    );
    echo '<script type="speculationrules">' . wp_json_encode($rules, JSON_UNESCAPED_SLASHES) . "</script>\n";
}
add_action('wp_footer', 'infinity_speculation_fallback');
