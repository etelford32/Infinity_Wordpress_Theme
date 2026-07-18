<?php
/**
 * SEO cleanup: slim the XML sitemap, keep thin/utility pages out of the
 * index, and 301 known duplicate pages to their canonical versions.
 *
 * Written from the 2026-07-18 GSC audit: 1,256 "duplicate without
 * user-selected canonical" (tag archives), 13k "crawled not indexed"
 * (feeds + date archives), plus two live duplicate page pairs.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Utility/checkout-style pages that should never rank.
 */
function infinity_seo_noindex_page_slugs() {
    return array(
        'search',
        'checkout',
        'your-account',
        'sign-up',
        'this-page-is-under-construction',
        'private',
        'ms-download-page',
    );
}

/**
 * Sitemap: drop tag and post-format taxonomy providers (1,052 tag +
 * 3 format archives were bloating it); keep categories.
 */
function infinity_seo_sitemap_taxonomies($taxonomies) {
    unset($taxonomies['post_tag'], $taxonomies['post_format']);
    return $taxonomies;
}
add_filter('wp_sitemaps_taxonomies', 'infinity_seo_sitemap_taxonomies');

/**
 * Sitemap: drop the author (users) provider entirely.
 */
function infinity_seo_sitemap_providers($provider, $name) {
    if ('users' === $name) {
        return false;
    }
    return $provider;
}
add_filter('wp_sitemaps_add_provider', 'infinity_seo_sitemap_providers', 10, 2);

/**
 * Noindex the utility pages (checkout, account, etc.).
 */
function infinity_seo_noindex_utility_pages($robots) {
    if (is_page(infinity_seo_noindex_page_slugs())) {
        $robots['noindex'] = true;
        $robots['follow']  = true;
    }
    return $robots;
}
add_filter('wp_robots', 'infinity_seo_noindex_utility_pages');

/**
 * Keep those same utility pages out of the page sitemap.
 */
function infinity_seo_sitemap_exclude_pages($args, $post_type) {
    if ('page' !== $post_type) {
        return $args;
    }
    $exclude = array();
    foreach (infinity_seo_noindex_page_slugs() as $slug) {
        $page = get_page_by_path($slug);
        if ($page) {
            $exclude[] = $page->ID;
        }
    }
    if ($exclude) {
        $args['post__not_in'] = array_merge(
            isset($args['post__not_in']) ? (array) $args['post__not_in'] : array(),
            $exclude
        );
    }
    return $args;
}
add_filter('wp_sitemaps_posts_query_args', 'infinity_seo_sitemap_exclude_pages', 10, 2);

/**
 * Feeds can't carry a meta robots tag, so send the header instead.
 */
function infinity_seo_noindex_feeds() {
    if (is_feed()) {
        header('X-Robots-Tag: noindex, follow');
    }
}
add_action('template_redirect', 'infinity_seo_noindex_feeds', 5);

/**
 * 301 known duplicate pages to their canonical versions.
 */
function infinity_seo_duplicate_redirects() {
    $map = array(
        '/subjects/nutrition/'   => '/nutrition/',
        '/subjects/patanjali-2/' => '/patanjali/',
    );
    $path = wp_parse_url(add_query_arg(array()), PHP_URL_PATH);
    if (!$path) {
        return;
    }
    $path = trailingslashit($path);
    if (isset($map[$path])) {
        wp_safe_redirect(home_url($map[$path]), 301);
        exit;
    }
}
add_action('template_redirect', 'infinity_seo_duplicate_redirects', 1);
