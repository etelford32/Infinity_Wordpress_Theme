<?php
/**
 * Explore the Universe 2175 hub page.
 *
 * A page with the slug "explore-the-universe" (or any page using the
 * "Explore the Universe 2175 Hub" template) renders
 * page-explore-the-universe.php: the game's pitch, trailer, the adaptive
 * AI, the physics underneath, the soundtrack, the two ways in (Steam
 * wishlist and a pilot account on ExploreTheUniverse2175.com), share
 * links, devlog posts and an FAQ.
 *
 * This file holds the helpers the template uses, plus the wiring that
 * points the rest of the site at the hub. Modeled on inc/parkers-hub.php.
 *
 * @package Infinity
 * @since 3.22.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * The hub page, or null when it hasn't been created yet.
 */
function infinity_etu_hub_page() {
    static $page = false;
    if (false !== $page) {
        return $page;
    }
    $page = get_page_by_path('explore-the-universe');
    if (!$page || 'publish' !== $page->post_status) {
        $ids  = get_posts(array(
            'post_type'      => 'page',
            'post_status'    => 'publish',
            'meta_key'       => '_wp_page_template',
            'meta_value'     => 'page-explore-the-universe.php',
            'posts_per_page' => 1,
            'fields'         => 'ids',
        ));
        $page = $ids ? get_post($ids[0]) : null;
    }
    return $page;
}

/**
 * Hub URL, or '' when the page doesn't exist.
 */
function infinity_etu_hub_url() {
    $page = infinity_etu_hub_page();
    return $page ? get_permalink($page) : '';
}

/**
 * Whether the current request is the hub.
 */
function infinity_is_etu_hub() {
    return is_page('explore-the-universe') || is_page_template('page-explore-the-universe.php');
}

/**
 * The game's key art, best available source: Customizer override, then
 * the bundled art.
 */
function infinity_etu_hub_art() {
    $over = get_option('infinity_etu_band_art', '');
    return $over ? $over : INFINITY_URI . '/assets/img/etu-key-art.jpg';
}

/**
 * The music page (any published page whose slug contains "music"), for
 * the soundtrack band. '' when there isn't one.
 */
function infinity_etu_music_url() {
    $page = get_page_by_path('music');
    if ($page && 'publish' === $page->post_status) {
        return get_permalink($page);
    }
    return '';
}

/**
 * The pitch, as feature cards. Each: icon, title, text. Filterable so
 * the copy can grow with the game.
 */
function infinity_etu_hub_features() {
    return apply_filters('infinity_etu_hub_features', array(
        array('ship', __('Your ship, your call', 'infinity'), __('Command your own ship on an open frontier. Trade, run, fight or explore: where you go and who you make enemies of is up to you.', 'infinity')),
        array('spark', __('Opponents that learn you', 'infinity'), __('Ships, factions and pirates run on machine learning. They watch how you fly and change their tactics to counter yours, so the same trick never works forever.', 'infinity')),
        array('orbit', __('Real orbital mechanics', 'infinity'), __('Gravity is not a backdrop. The galaxy runs on the same physics as the simulations on Parker\'s Physics, so a good burn and a slingshot are real advantages.', 'infinity')),
        array('earth', __('A living galaxy', 'infinity'), __('Factions rise, rivalries shift and the frontier keeps moving whether you are watching or not. The year is 2175, and the map is not finished.', 'infinity')),
        array('music', __('An original score', 'infinity'), __('Orbital ambience and battle themes, written in the studio alongside the build by the same person who writes the code.', 'infinity')),
        array('rocket', __('Built in the open', 'infinity'), __('One developer, a public devlog and a community of first-wave pilots who shape what ships next.', 'infinity')),
    ));
}

/**
 * FAQ: question => answer. Kept to what is true today; edit via the
 * filter as launch details firm up. Emitted as FAQPage schema too.
 */
function infinity_etu_hub_faq() {
    return apply_filters('infinity_etu_hub_faq', array(
        __('What kind of game is it?', 'infinity')                 => __('A 2D space sci-fi game set in the year 2175. You command your own ship in a living galaxy where the opponents use machine learning to adapt to how you play.', 'infinity'),
        __('Where can I get it?', 'infinity')                      => __('Explore the Universe 2175 is on Steam. Wishlist it there and Steam will tell you the moment it launches.', 'infinity'),
        __('Why does wishlisting matter?', 'infinity')             => __('Wishlists are the signal Steam uses to decide which upcoming games to show people. For an independent game, every one of them moves the launch up the discovery queue.', 'infinity'),
        __('What is the account on ExploreTheUniverse2175.com?', 'infinity') => __('A free pilot account. It signs you up for development news and puts you in the first wave of pilots.', 'infinity'),
        __('How is it connected to Parker\'s Physics?', 'infinity') => __('Same developer, same physics. The orbital mechanics in the game come from the work behind the simulations on Parker\'s Physics.', 'infinity'),
    ));
}

/**
 * Posts about the game: tagged explore-the-universe / etu-2175, or
 * mentioning it in the title or linking to the game's sites.
 */
function infinity_etu_flag_post($post_id, $post) {
    if (wp_is_post_revision($post_id) || 'post' !== $post->post_type) {
        return;
    }
    $c = (string) $post->post_content;
    if (false !== stripos($c, 'exploretheuniverse2175.com') || false !== stripos($c, '/app/4094340')) {
        update_post_meta($post_id, '_infinity_features_etu', 1);
    } else {
        delete_post_meta($post_id, '_infinity_features_etu');
    }
}
add_action('save_post', 'infinity_etu_flag_post', 10, 2);

function infinity_etu_articles($count = 6) {
    $base = array(
        'post_type'      => 'post',
        'posts_per_page' => $count,
        'fields'         => 'ids',
        'no_found_rows'  => true,
    );
    $flagged = get_posts($base + array('meta_key' => '_infinity_features_etu'));
    $tagged  = get_posts($base + array('tag' => 'explore-the-universe,etu-2175,explore-the-universe-2175'));
    $titled  = get_posts($base + array('s' => 'Explore the Universe', 'search_columns' => array('post_title')));
    $ids     = array_values(array_unique(array_merge($flagged, $tagged, $titled)));
    if (!$ids) {
        return array();
    }
    return get_posts(array(
        'post_type'      => 'post',
        'post__in'       => $ids,
        'orderby'        => 'date',
        'posts_per_page' => $count,
        'no_found_rows'  => true,
    ));
}

/**
 * Share links for the hub, so visitors can spread the word.
 */
function infinity_etu_share_links($url, $text) {
    return array(
        'x'       => array(__('Post on X', 'infinity'), add_query_arg(array('text' => rawurlencode($text), 'url' => rawurlencode($url)), 'https://twitter.com/intent/tweet')),
        'reddit'  => array(__('Share on Reddit', 'infinity'), add_query_arg(array('url' => rawurlencode($url), 'title' => rawurlencode($text)), 'https://www.reddit.com/submit')),
        'bluesky' => array(__('Post on Bluesky', 'infinity'), add_query_arg('text', rawurlencode($text . ' ' . $url), 'https://bsky.app/intent/compose')),
    );
}

/**
 * Assets, only on the hub. The shared section styles come from
 * parkers-hub.css (pph-*); etu-hub.css re-colors them and adds the
 * game's own blocks.
 */
function infinity_etu_hub_assets() {
    if (!infinity_is_etu_hub()) {
        return;
    }
    wp_enqueue_style('infinity-parkers-hub', infinity_css_url('assets/css/parkers-hub.css'), array('infinity-style'), INFINITY_VERSION);
    wp_enqueue_style('infinity-etu-hub', infinity_css_url('assets/css/etu-hub.css'), array('infinity-parkers-hub'), INFINITY_VERSION);
    wp_enqueue_script('infinity-etu-hub', INFINITY_URI . '/assets/js/etu-hub.js', array(), INFINITY_VERSION, array('in_footer' => true, 'strategy' => 'defer'));
    wp_localize_script('infinity-etu-hub', 'infinityEtuHub', array(
        'copied' => __('Link copied', 'infinity'),
    ));
    if (infinity_steam_app_id()) {
        wp_enqueue_script('infinity-steam-fit', INFINITY_URI . '/assets/js/steam-fit.js', array(), INFINITY_VERSION, true);
    }
}
add_action('wp_enqueue_scripts', 'infinity_etu_hub_assets', 21);

/**
 * schema.org for the hub: the game as a VideoGame, plus the FAQ.
 */
function infinity_etu_hub_schema() {
    if (!infinity_is_etu_hub() || defined('WPSEO_VERSION') || class_exists('RankMath') || defined('AIOSEO_VERSION')) {
        return;
    }
    $urls  = infinity_property_urls();
    $steam = get_option('infinity_steam_url', 'https://store.steampowered.com/app/4094340/Explore_the_Universe_2175/');
    $game  = array(
        '@context'       => 'https://schema.org',
        '@type'          => 'VideoGame',
        'name'           => 'Explore the Universe 2175',
        'url'            => trailingslashit($urls['etu']),
        'sameAs'         => array($steam, get_permalink()),
        'image'          => infinity_etu_hub_art(),
        'description'    => __('A 2D space sci-fi game set in 2175: command your own ship in a living galaxy built on real orbital mechanics, against ships, factions and pirates that learn how you play.', 'infinity'),
        'genre'          => array('Space', 'Sci-fi', 'Action', 'Simulation'),
        'gamePlatform'   => 'PC',
        'playMode'       => 'SinglePlayer',
        'author'         => array('@type' => 'Person', 'name' => get_bloginfo('name'), 'url' => home_url('/')),
        'offers'         => array('@type' => 'Offer', 'url' => $steam, 'availability' => 'https://schema.org/PreOrder'),
    );
    $faq = array(
        '@context'   => 'https://schema.org',
        '@type'      => 'FAQPage',
        'mainEntity' => array(),
    );
    foreach (infinity_etu_hub_faq() as $q => $a) {
        $faq['mainEntity'][] = array(
            '@type'          => 'Question',
            'name'           => $q,
            'acceptedAnswer' => array('@type' => 'Answer', 'text' => $a),
        );
    }
    foreach (array($game, $faq) as $schema) {
        printf('<script type="application/ld+json">%s</script>' . "\n", wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }
}
add_action('wp_head', 'infinity_etu_hub_schema', 7);

/**
 * Social cards: the hub shares with the key art, not the theme
 * screenshot, when no featured image is set.
 */
function infinity_etu_hub_og_image($image) {
    if (infinity_is_etu_hub() && !has_post_thumbnail()) {
        return infinity_etu_hub_art();
    }
    return $image;
}
add_filter('infinity_og_image', 'infinity_etu_hub_og_image');

/**
 * Admin: offer to create the hub page in one click.
 */
function infinity_etu_hub_notice() {
    if (!current_user_can('publish_pages') || infinity_etu_hub_page()) {
        return;
    }
    $screen = get_current_screen();
    if (!$screen || !in_array($screen->id, array('dashboard', 'edit-page', 'themes'), true)) {
        return;
    }
    $url = wp_nonce_url(admin_url('admin-post.php?action=infinity_create_etu_hub'), 'infinity_create_etu_hub');
    printf(
        '<div class="notice notice-info"><p>%1$s <a class="button button-primary" href="%2$s">%3$s</a></p></div>',
        esc_html__('The theme has an Explore the Universe 2175 hub page (trailer, features, wishlist and pilot sign-up, FAQ). It isn\'t published yet.', 'infinity'),
        esc_url($url),
        esc_html__('Create the game hub page', 'infinity')
    );
}
add_action('admin_notices', 'infinity_etu_hub_notice');

function infinity_etu_create_hub() {
    if (!current_user_can('publish_pages') || !check_admin_referer('infinity_create_etu_hub')) {
        wp_die(esc_html__('Not allowed.', 'infinity'));
    }
    $page = infinity_etu_hub_page();
    if (!$page) {
        $id = wp_insert_post(array(
            'post_type'    => 'page',
            'post_status'  => 'publish',
            'post_title'   => 'Explore the Universe 2175',
            'post_name'    => 'explore-the-universe',
            'post_excerpt' => __('A 2D space sci-fi game with adaptive AI. Command your own ship in a living galaxy built on real orbital mechanics. Wishlist on Steam and join the first wave of pilots.', 'infinity'),
            'post_content' => "<!-- wp:paragraph -->\n<p>" . esc_html__("Explore the Universe 2175 is the game I'm building: a 2D space sci-fi game where the physics is real and the opponents learn. It grew out of the same code as Parker's Physics. Here's what it is, how to follow it, and how to help it launch.", 'infinity') . "</p>\n<!-- /wp:paragraph -->",
            'meta_input'   => array('_wp_page_template' => 'page-explore-the-universe.php'),
        ), true);
        if (is_wp_error($id)) {
            wp_die(esc_html($id->get_error_message()));
        }
        $page = get_post($id);
    }
    wp_safe_redirect(get_edit_post_link($page->ID, 'url'));
    exit;
}
add_action('admin_post_infinity_create_etu_hub', 'infinity_etu_create_hub');
