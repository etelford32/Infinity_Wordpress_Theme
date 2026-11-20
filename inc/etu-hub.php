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
    return $over ? $over : INFINITY_URI . '/assets/img/etu/hero-megabot-chase.webp';
}

/**
 * The cinematic trailer, served by the game's own site (13 MB, so it is
 * only fetched when someone presses play).
 */
function infinity_etu_trailer_url() {
    $urls = infinity_property_urls();
    return (string) get_option('infinity_etu_trailer_url', trailingslashit($urls['etu']) . 'ETU_Cinematic_Trailer_4K.mp4');
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
 * The free demo's release moment (UTC, ISO 8601). Mirrors
 * DEMO_RELEASE_AT in the ETUWebsite repo (src/lib/campaign.ts); every
 * demo CTA on the hub flips from "sign up for demo day" to "play the
 * free demo" once it passes. Override in the Customizer option
 * infinity_etu_demo_at to move it.
 */
function infinity_etu_demo_at() {
    return (string) get_option('infinity_etu_demo_at', '2026-11-26T18:00:00Z');
}

function infinity_etu_demo_live() {
    $t = strtotime(infinity_etu_demo_at());
    return $t && time() >= $t;
}

/**
 * Absolute URL on ExploreTheUniverse2175.com, GA4/UTM-tagged for a hub
 * placement.
 */
function infinity_etu_site_link($path, $placement, $cta) {
    $urls = infinity_property_urls();
    return infinity_project_href(trailingslashit($urls['etu']) . ltrim($path, '/'), $placement, $cta);
}

/**
 * The official ETU title typography and logo, theme-relative. The words
 * are rendered from the game's sprite font (ETUWebsite
 * scripts/render-title.py, the same glyphs, kerning and spacing as the
 * game site); the logo is the official ETU lettering cut off its black.
 */
function infinity_etu_type($name) {
    return INFINITY_URI . '/assets/img/etu/type/' . $name . '.webp';
}

/** Bundled art, theme-relative. */
function infinity_etu_img($name) {
    return INFINITY_URI . '/assets/img/etu/' . $name;
}

/**
 * The galaxy in four numbers (ETUWebsite src/app/page.tsx NUMBERS).
 */
function infinity_etu_hub_numbers() {
    return apply_filters('infinity_etu_hub_numbers', array(
        array(16, '', __('themed regions', 'infinity')),
        array(3600, '+', __('planets and moons', 'infinity')),
        array(29, '', __('ship abilities', 'infinity')),
        array(4, '', __('pilots, solo or co-op', 'infinity'), '1–'),
    ));
}

/**
 * The pillars (Marketing Kit "The four pillars" plus the site's squad and
 * build cards). Each: icon, title, lead, body.
 */
function infinity_etu_hub_features() {
    return apply_filters('infinity_etu_hub_features', array(
        array('earth', __('A New Galaxy Every Run', 'infinity'), __('Spiral arms, nebulae, pulsars and thousands of worlds.', 'infinity'), __('Generated fresh from a seed every run, across sixteen themed regions, from fungal jungles to the frozen Outer Rim.', 'infinity')),
        array('sun', __('Real Cosmic Danger', 'infinity'), __('Slingshot around black holes. Outrun solar storms.', 'infinity'), __('Flares and coronal mass ejections follow real observations, and no two black holes look or behave the same.', 'infinity')),
        array('spark', __('Quests and a Buried Mystery', 'infinity'), __('Wake ancient stations and earn the trust of strange allies.', 'infinity'), __('Dwarves, bear kings and fungal queens. Follow the Khepri Signal with Cyl to learn why her people, the Lumari, were erased.', 'infinity')),
        array('core', __('Bosses Built to Be Broken', 'infinity'), __('Strip MEGABOT\'s armour plate by plate.', 'infinity'), __('Escape the Null Architect\'s prison rooms. Outlast a new boss every few minutes. MEGABOT remembers what you did to his empire.', 'infinity')),
        array('ship', __('Bring a Squad', 'infinity'), __('Co-op Survival for up to four pilots.', 'infinity'), __('Fill the empty seats with AI wingmates: Vega flies escort, Orion hunts and Lyra patches you up.', 'infinity')),
        array('rocket', __('Build Your Ship', 'infinity'), __('Twenty-nine abilities and three doctrines.', 'infinity'), __('Quantum Lattice, Plasma Furnace or Event Horizon reshape your lasers, missiles, mines, shields and thrusters together.', 'infinity')),
    ));
}

/**
 * Key-art showcase (ETUWebsite SHOWCASE). Each: eyebrow, title, image,
 * alt, two paragraphs, path on the game site, link label. MEGABOT's
 * panel swaps its still for the Evil Eye loop when motion is allowed.
 */
function infinity_etu_hub_showcase() {
    return apply_filters('infinity_etu_hub_showcase', array(
        array(
            'eyebrow' => __('Megastructure boss', 'infinity'),
            'title'   => __('Tear Down the Solar Shade', 'infinity'),
            'image'   => 'solar-shade.webp',
            'alt'     => __('A vast dark triangular sail of hexagonal plate stretched between three stations in front of a blazing star, a small fighter flying beneath it', 'infinity'),
            'text'    => array(
                __('The machines hang a sail across a star, wide enough to put it out. Their waves and their bosses come through the gate at its heart.', 'infinity'),
                __('Break the three Control Nodes, tear the sail and let the light back in.', 'infinity'),
            ),
            'path'    => 'evil-robots#solar-shade',
            'cta'     => __('Meet the Machine Empire', 'infinity'),
            'tone'    => 'sun',
        ),
        array(
            'eyebrow' => __('Final boss', 'infinity'),
            'title'   => __('Run From the Crimson Eye', 'infinity'),
            'image'   => 'megabot-crimson-eye.webp',
            'video'   => 'megabot-eye-loop.mp4',
            'alt'     => __('MEGABOT\'s Crimson Eye: a bladed iris the size of a station burning red in a wall of dark armour plate, a tiny fighter fleeing across the lower corner', 'infinity'),
            'text'    => array(
                __('Every few minutes the Empire sends something bigger. Then MEGABOT comes in person: twenty-five ships tall, fifteen plates of armour, one eye.', 'infinity'),
                __('Missiles shatter the plates. Lasers burn what is underneath. When the Eye opens, move.', 'infinity'),
            ),
            'path'    => 'megabot',
            'cta'     => __('Face MEGABOT', 'infinity'),
            'tone'    => 'red',
        ),
        array(
            'eyebrow' => __('Diplomacy', 'infinity'),
            'title'   => __('Every Alliance Has a Price', 'infinity'),
            'image'   => 'space-dwarves.webp',
            'alt'     => __('A braided, armoured Space Dwarf looks out over a glowing blue crystal mine as a mining barge hauls a load overhead', 'infinity'),
            'text'    => array(
                __('Dwarven clans mine the crystal seams of Yllar and answer to King Arkanvil Starhammer. Earn the guild\'s trust and they trade, mend and fight beside you.', 'infinity'),
                __('Threaten the guild and the whole roster comes for your hull at once.', 'infinity'),
            ),
            'path'    => 'factions/space-dwarves',
            'cta'     => __('Meet the Space Dwarves', 'infinity'),
            'tone'    => 'crystal',
        ),
        array(
            'eyebrow' => __('Twin bosses', 'infinity'),
            'title'   => __('The Hive Is Awake', 'infinity'),
            'image'   => 'mycelari.webp',
            'alt'     => __('A colossal fungal queen with a glowing orange mushroom crown rises over a spore-lit world as a white fighter burns past on cyan engines', 'infinity'),
            'text'    => array(
                __('The Bloom Queen seeds the field with her own children and reaps what grows. The Fungal Lord sleeps until you come too close.', 'infinity'),
                __('Fight them together and they share one life between them.', 'infinity'),
            ),
            'path'    => 'factions/mycelari',
            'cta'     => __('Meet the Mycelari', 'infinity'),
            'tone'    => 'spore',
        ),
    ));
}

/**
 * The Survival boss order (Marketing Kit fact sheet). Each: image, name,
 * one line, order label.
 */
function infinity_etu_hub_bosses() {
    return apply_filters('infinity_etu_hub_bosses', array(
        array('boss-mega-mecha-scout.webp', __('Mega Mecha Scout', 'infinity'), __('Counts its missiles out loud.', 'infinity')),
        array('boss-alpha-robot.webp', __('Alpha Robot', 'infinity'), __('Fights beside a shield with a mind of its own.', 'infinity')),
        array('boss-null-architect.webp', __('Null Architect', 'infinity'), __('Nulls your weapons and closes a holographic cube around you. Twelve seconds. Break a pane or stay forever.', 'infinity')),
        array('boss-megabot.webp', __('MEGABOT', 'infinity'), __('Twenty-five ships tall. Fifteen two-layer plates, a ten-mode eye, and he decides whether to raid or hunt.', 'infinity')),
    ));
}

/**
 * MEGABOT's own lines (ETUWebsite /megabot), cycled in the boss section.
 */
function infinity_etu_hub_megabot_lines() {
    return apply_filters('infinity_etu_hub_megabot_lines', array(
        'I AM MEGABOT. THE EYE OF THE DOMINION CORE. EVERY UNIT YOU HAVE DESTROYED WAS A FINGER. I AM THE HAND.',
        'ORGANIC DETECTED. INITIATING PROTOCOL ZERO.',
        'THE EVIL EYE SEES YOUR HULL, YOUR REACTOR AND THE PATH YOU WILL DODGE ALONG. IT IS USUALLY CORRECT.',
        'RESISTANCE IS... SUBOPTIMAL.',
        'MEGABOT HEARS YOU. MEGABOT IS STILL GOING TO STEP ON YOU.',
        'IMPOSSIBLE. RECALCULATING... RECALCULATING...',
        'YOUR EXISTENCE IS A MATHEMATICAL IMPROBABILITY.',
    ));
}

/**
 * Factions with full profiles on the game site (ETUWebsite FACTIONS).
 * Each: image, focal position, name, kind, blurb, path.
 */
function infinity_etu_hub_factions() {
    return apply_filters('infinity_etu_hub_factions', array(
        array('megabot-crimson-eye.webp', '50% 35%', __('Machine Empire', 'infinity'), __('Evil Robots', 'infinity'), __('MEGABOT, his legion and a sail big enough to shade a star.', 'infinity'), 'factions/megabot'),
        array('mycelari.webp', '50% 30%', __('Mycelari', 'infinity'), __('Fungal Swarm', 'infinity'), __('One mind in a million bodies. Their armour grows back.', 'infinity'), 'factions/mycelari'),
        array('space-dwarves.webp', '40% 30%', __('Space Dwarves', 'infinity'), __('Crystal Masons', 'infinity'), __('Miners, masons and a king who has never paid full price.', 'infinity'), 'factions/space-dwarves'),
        array('wild-clans.webp', '50% 28%', __('Wild Clans', 'infinity'), __('The Woak', 'infinity'), __('Mecha-bears, bee swarms and walking trees. Truce before teeth.', 'infinity'), 'factions/wild'),
        array('cyl.webp', '18% 50%', __('Lumari', 'infinity'), __('Crystal Intelligences', 'infinity'), __('Erased by MEGABOT. Cyl is what is left, and she flies with you.', 'infinity'), 'factions/lumari'),
        array('terran-federation.webp', 'center', __('Terran Federation', 'infinity'), __('Humanity', 'infinity'), __('“Alliances are how humanity survived.”', 'infinity'), 'factions/terran-federation'),
    ));
}

/**
 * Real astrophysics in the game, each paired with the Parker's Physics
 * simulation of the same thing. Each: game fact, sim path, sim title.
 */
function infinity_etu_hub_physics() {
    return apply_filters('infinity_etu_hub_physics', array(
        array('orbit', __('Black holes in three mass classes', 'infinity'), __('Event horizon, innermost stable orbit, accretion disk and radiation zones. Skim one right and you slingshot out faster than you went in.', 'infinity'), 'blackhole-observatory.html', __('Black Hole Observatory', 'infinity')),
        array('sun', __('C, M and X-class flares', 'infinity'), __('Stars flare in real classes and throw coronal mass ejections. Cyl gives you a countdown. Run.', 'infinity'), 'cme-forecast.html', __('CME Forecast', 'infinity')),
        array('planner', __('Kepler orbits and gravity assists', 'infinity'), __('Planets and moons follow real orbital elements, and gravity wells are something you fly, not scenery.', 'infinity'), 'solar-system.html', __('Solar System', 'infinity')),
        array('aurora', __('A seeded spiral galaxy', 'infinity'), __('Three to eight arms, up to 120 star systems, five kinds of nebula with gas pulled by gravity, pulsars and X-ray binaries.', 'infinity'), 'galactic-map.html', __('Galaxy', 'infinity')),
    ));
}

/**
 * FAQ: question => answer. Every answer is backed by the ETU Marketing
 * Kit (ETUWebsite docs/MARKETING_KIT.md). Emitted as FAQPage schema.
 */
function infinity_etu_hub_faq() {
    $demo = infinity_etu_demo_live()
        ? __('The free demo is out now on Steam. Download it and fly.', 'infinity')
        : __('The free demo lands on Steam on Thanksgiving Day, November 26. Steam Playtest sign-ups are open now on the store page, and Early Access follows in 2027.', 'infinity');
    return apply_filters('infinity_etu_hub_faq', array(
        __('What is Explore the Universe 2175?', 'infinity') => __('An open-galaxy space action-RPG from Telford Projects. Every run generates a new spiral galaxy full of quests, bosses and real celestial phenomena, and you explore it with Cyl, a crystal AI companion who learns who you are.', 'infinity'),
        __('When can I play?', 'infinity')                    => $demo,
        __('What platforms?', 'infinity')                     => __('PC: Windows, macOS and Linux, on Steam.', 'infinity'),
        __('Can I play with friends?', 'infinity')            => __('Yes. Co-op Survival takes two to four pilots on Steam, sharing one galaxy. Solo, AI wingmates Vega, Orion and Lyra fill the empty seats.', 'infinity'),
        __('Who is Cyl?', 'infinity')                         => __('The last of the Lumari, a crystal intelligence riding on your hull. She fights beside you, recharges your shields, calls the space weather and teaches you the astronomy behind it. She asks who you are, remembers your answers, and grows into a warrior, a caregiver, a lover or a seeker because of them.', 'infinity'),
        __('Is the physics real?', 'infinity')                => __('The game is made by a computational astrophysicist. Black holes come in three mass classes with real danger zones, flares follow real C, M and X classes, and planets follow Kepler orbits. The same physics runs the free simulations on Parker\'s Physics.', 'infinity'),
        __('Why wishlist?', 'infinity')                       => __('Steam emails you the day it launches, and wishlists are the signal Steam uses to decide which upcoming games to show people. For an independent game, every one counts.', 'infinity'),
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
        'copied'  => __('Link copied', 'infinity'),
        'demoAt'  => infinity_etu_demo_at(),
        'liveTxt' => __('The free demo is out now on Steam', 'infinity'),
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
        '@context'            => 'https://schema.org',
        '@type'               => 'VideoGame',
        'name'                => 'Explore the Universe 2175',
        'url'                 => trailingslashit($urls['etu']),
        'sameAs'              => array($steam, get_permalink()),
        'image'               => infinity_etu_img('hero-megabot-chase.webp'),
        'description'         => __('Explore a new galaxy every run: quests, bosses, black holes and solar storms, with a crystal AI companion who learns who you are.', 'infinity'),
        'genre'               => array('Action RPG', 'Space', 'Exploration', 'Procedural Generation', 'Sci-fi'),
        'gamePlatform'        => array('Windows', 'macOS', 'Linux'),
        'operatingSystem'     => 'Windows, macOS, Linux',
        'applicationCategory' => 'Game',
        'playMode'            => array('SinglePlayer', 'CoOp'),
        'numberOfPlayers'     => array('@type' => 'QuantitativeValue', 'minValue' => 1, 'maxValue' => 4),
        'publisher'           => array('@type' => 'Organization', 'name' => 'Telford Projects'),
        'author'              => array('@type' => 'Person', 'name' => 'Elliot Telford', 'url' => home_url('/')),
        'trailer'             => array(
            '@type'        => 'VideoObject',
            'name'         => 'Explore the Universe 2175 cinematic trailer',
            'description'  => __('A new galaxy every run, real cosmic danger, quests and a buried mystery, and bosses built to be broken.', 'infinity'),
            'contentUrl'   => infinity_etu_trailer_url(),
            'thumbnailUrl' => infinity_etu_img('hero-megabot-chase.webp'),
            'uploadDate'   => '2026-11-01',
        ),
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
        esc_html__('The theme has an Explore the Universe 2175 hub page (trailer, demo countdown, bosses, factions, Cyl, wishlist and sign-up). It isn\'t published yet.', 'infinity'),
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
            'post_excerpt' => __('A new galaxy every run. A companion who remembers you. Explore the Universe 2175 is an open-galaxy space action-RPG with real black holes, solar storms and bosses built to be broken. Free demo on Steam.', 'infinity'),
            'post_content' => "<!-- wp:paragraph -->\n<p>" . esc_html__("Explore the Universe 2175 is the game I'm building at Telford Projects: an open-galaxy space adventure where the black holes, the solar storms and the orbits are real astrophysics. Here's everything in it, and how to fly it first.", 'infinity') . "</p>\n<!-- /wp:paragraph -->",
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
