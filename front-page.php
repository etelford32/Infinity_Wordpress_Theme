<?php
/**
 * Front Page — content-first homepage
 *
 * Server-rendered for SEO. Surfaces the site's real content pillars
 * (health & anatomy, science, travel) plus the three showcased
 * destinations: Explore the Universe 2175 (Steam), Parker's Physics
 * (the interactive sandbox), and Telford Landscaping.
 *
 * Section categories are configurable under
 * Appearance → Customize → Homepage Content.
 *
 * @package Infinity
 * @since 1.1.0
 */

get_header();

$property_urls   = infinity_property_urls();
$steam_url       = $property_urls['steam'];
$etu_site_url    = $property_urls['etu'];
$parkers_url     = $property_urls['parkers'];
$landscaping_url = $property_urls['landscaping'];
$steam_label     = get_option('infinity_steam_label', 'Explore the Universe');

/*
 * ETU marketing art: Customizer-uploaded official art wins; otherwise
 * walk Steam's CDN URL variants; the theme-bundled key art is the
 * final link in the chain, so the band can never render empty.
 */
$infinity_etu_app   = infinity_steam_app_id();
$infinity_etu_local = INFINITY_URI . '/assets/img/etu-key-art.jpg';
$infinity_etu_over  = get_option('infinity_etu_band_art', '');
if ($infinity_etu_over) {
    $infinity_etu_art   = $infinity_etu_over;
    $infinity_etu_chain = array($infinity_etu_local);
} elseif ($infinity_etu_app) {
    $infinity_etu_art   = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/' . $infinity_etu_app . '/header.jpg';
    $infinity_etu_chain = array(
        'https://cdn.akamai.steamstatic.com/steam/apps/' . $infinity_etu_app . '/header.jpg',
        'https://cdn.cloudflare.steamstatic.com/steam/apps/' . $infinity_etu_app . '/header.jpg',
        'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/' . $infinity_etu_app . '/capsule_616x353.jpg',
        $infinity_etu_local,
    );
} else {
    $infinity_etu_art   = $infinity_etu_local;
    $infinity_etu_chain = array();
}
$infinity_etu_onerror = "var q=(this.dataset.alt||'').split('|').filter(Boolean);if(q.length){this.dataset.alt=q.slice(1).join('|');this.src=q[0];}else{this.remove();}";
$infinity_etu_video   = infinity_etu_video_url();
?>

<div class="front-page">

    <!-- ================= Hero: black hole ================= -->
    <section class="fp-hero fp-hero-blackhole">
        <canvas id="fp-blackhole" aria-hidden="true"></canvas>
        <div class="container">
            <div class="fp-hero-inner">
                <div class="fp-hero-copy">
                    <?php
                    // Display wordmark: capitalize the inner T. Rendered as
                    // layered SVG text: giant soft shadow, dark extrusion,
                    // beveled metal face, then three neon tracer layers whose
                    // dashed strokes roll along the glyph outlines - light
                    // balls with trails that mix where the colors cross.
                    $infinity_wordmark = str_ireplace('elliottelford', 'ElliotTelford', get_bloginfo('name'));
                    $infinity_wm_len   = 964;
                    ?>
                    <h1 class="fp-hero-title fp-hero-title-svg">
                        <svg class="fp-wordmark" viewBox="0 0 1000 150" preserveAspectRatio="xMinYMid meet" role="img" aria-label="<?php echo esc_attr($infinity_wordmark); ?>">
                            <defs>
                                <linearGradient id="wm-face-grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0" stop-color="#ffffff"/>
                                    <stop offset="0.26" stop-color="#f0f2ff"/>
                                    <stop offset="0.5" stop-color="#ccd2f4"/>
                                    <stop offset="0.72" stop-color="#9aa2d6"/>
                                    <stop offset="1" stop-color="#4a5288"/>
                                </linearGradient>
                                <linearGradient id="wm-face-grad-light" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0" stop-color="#2a3150"/>
                                    <stop offset="0.3" stop-color="#1a2038"/>
                                    <stop offset="0.55" stop-color="#0d1226"/>
                                    <stop offset="0.78" stop-color="#060a18"/>
                                    <stop offset="1" stop-color="#02040c"/>
                                </linearGradient>
                                <filter id="wm-blur-huge" x="-20%" y="-40%" width="140%" height="200%">
                                    <feGaussianBlur stdDeviation="11"/>
                                </filter>
                                <filter id="wm-blur-soft" x="-20%" y="-40%" width="140%" height="200%">
                                    <feGaussianBlur stdDeviation="2.4"/>
                                </filter>
                                <filter id="wm-blur-wake" x="-25%" y="-50%" width="150%" height="220%">
                                    <feGaussianBlur stdDeviation="5.5"/>
                                </filter>
                                <filter id="wm-blur-ground" x="-20%" y="-40%" width="140%" height="200%">
                                    <feGaussianBlur stdDeviation="4.5"/>
                                </filter>
                                <filter id="wm-bevel" x="-20%" y="-40%" width="140%" height="200%">
                                    <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="blur"/>
                                    <feSpecularLighting in="blur" surfaceScale="4" specularConstant="0.85" specularExponent="19" lighting-color="#ffffff" result="spec">
                                        <feDistantLight azimuth="235" elevation="45"/>
                                    </feSpecularLighting>
                                    <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
                                    <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="1.15" k4="0"/>
                                </filter>
                                <filter id="wm-bevel-light" x="-20%" y="-40%" width="140%" height="200%">
                                    <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="blur"/>
                                    <feSpecularLighting in="blur" surfaceScale="3.4" specularConstant="0.55" specularExponent="17" lighting-color="#e6ecff" result="spec">
                                        <feDistantLight azimuth="235" elevation="45"/>
                                    </feSpecularLighting>
                                    <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
                                    <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.8" k4="0"/>
                                </filter>
                            </defs>
                            <text class="wm-shadow" x="18" y="127" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs" filter="url(#wm-blur-huge)"><?php echo esc_html($infinity_wordmark); ?></text>
                            <text class="wm-ground" x="11" y="124" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs" filter="url(#wm-blur-ground)"><?php echo esc_html($infinity_wordmark); ?></text>
                            <text class="wm-depth wm-depth-3" x="16" y="120.5" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs"><?php echo esc_html($infinity_wordmark); ?></text>
                            <text class="wm-depth wm-depth-2" x="14.5" y="117.5" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs"><?php echo esc_html($infinity_wordmark); ?></text>
                            <text class="wm-depth" x="13" y="115" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs"><?php echo esc_html($infinity_wordmark); ?></text>
                            <text class="wm-face" filter="url(#wm-bevel)" x="8" y="110" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs"><?php echo esc_html($infinity_wordmark); ?></text>
                            <g class="wm-traces" aria-hidden="true">
                                <text class="wm-wake wm-wake-c" x="8" y="110" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs" filter="url(#wm-blur-wake)"><?php echo esc_html($infinity_wordmark); ?></text>
                                <text class="wm-trail2 wm-trail2-c" x="8" y="110" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs" filter="url(#wm-blur-soft)"><?php echo esc_html($infinity_wordmark); ?></text>
                                <text class="wm-trail wm-trail-c" x="8" y="110" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs" filter="url(#wm-blur-soft)"><?php echo esc_html($infinity_wordmark); ?></text>
                                <text class="wm-halo wm-halo-c" x="8" y="110" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs" filter="url(#wm-blur-wake)"><?php echo esc_html($infinity_wordmark); ?></text>
                                <text class="wm-ball wm-ball-c" x="8" y="110" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs"><?php echo esc_html($infinity_wordmark); ?></text>
                                <text class="wm-wake wm-wake-m" x="8" y="110" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs" filter="url(#wm-blur-wake)"><?php echo esc_html($infinity_wordmark); ?></text>
                                <text class="wm-trail2 wm-trail2-m" x="8" y="110" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs" filter="url(#wm-blur-soft)"><?php echo esc_html($infinity_wordmark); ?></text>
                                <text class="wm-trail wm-trail-m" x="8" y="110" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs" filter="url(#wm-blur-soft)"><?php echo esc_html($infinity_wordmark); ?></text>
                                <text class="wm-halo wm-halo-m" x="8" y="110" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs" filter="url(#wm-blur-wake)"><?php echo esc_html($infinity_wordmark); ?></text>
                                <text class="wm-ball wm-ball-m" x="8" y="110" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs"><?php echo esc_html($infinity_wordmark); ?></text>
                                <text class="wm-wake wm-wake-a" x="8" y="110" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs" filter="url(#wm-blur-wake)"><?php echo esc_html($infinity_wordmark); ?></text>
                                <text class="wm-trail2 wm-trail2-a" x="8" y="110" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs" filter="url(#wm-blur-soft)"><?php echo esc_html($infinity_wordmark); ?></text>
                                <text class="wm-trail wm-trail-a" x="8" y="110" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs" filter="url(#wm-blur-soft)"><?php echo esc_html($infinity_wordmark); ?></text>
                                <text class="wm-halo wm-halo-a" x="8" y="110" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs" filter="url(#wm-blur-wake)"><?php echo esc_html($infinity_wordmark); ?></text>
                                <text class="wm-ball wm-ball-a" x="8" y="110" textLength="<?php echo (int) $infinity_wm_len; ?>" lengthAdjust="spacingAndGlyphs"><?php echo esc_html($infinity_wordmark); ?></text>
                            </g>
                        </svg>
                    </h1>
                    <p class="fp-hero-tagline">
                        <?php
                        $tagline = get_bloginfo('description');
                        echo esc_html($tagline ? $tagline : __('Anatomy, science, and stories from the field — plus a universe to explore.', 'infinity'));
                        ?>
                    </p>
                    <nav class="fp-pillar-nav" aria-label="<?php esc_attr_e('Site sections', 'infinity'); ?>">
                        <a href="#health-anatomy"><?php esc_html_e('Health & Anatomy', 'infinity'); ?></a>
                        <a href="#space-simulations"><?php esc_html_e('Space & Simulations', 'infinity'); ?></a>
                        <a href="#mind-philosophy"><?php esc_html_e('Mind & Philosophy', 'infinity'); ?></a>
                        <a href="#travel"><?php esc_html_e('Travel & Experiences', 'infinity'); ?></a>
                        <a href="#explore-the-universe"><?php esc_html_e('The Game', 'infinity'); ?></a>
                        <a href="#landscaping"><?php esc_html_e('Landscaping', 'infinity'); ?></a>
                    </nav>
                    <?php
                    // Push readers straight into the freshest writing
                    $infinity_hero_latest = new WP_Query(array(
                        'posts_per_page'      => 3,
                        'ignore_sticky_posts' => true,
                    ));
                    if ($infinity_hero_latest->have_posts()) :
                    ?>
                        <div class="fp-hero-latest">
                            <span class="fp-hero-latest-label"><?php esc_html_e('Fresh articles', 'infinity'); ?></span>
                            <?php while ($infinity_hero_latest->have_posts()) : $infinity_hero_latest->the_post(); ?>
                                <a class="fp-hero-latest-pill" href="<?php the_permalink(); ?>"><?php echo esc_html(wp_trim_words(get_the_title(), 7, '…')); ?></a>
                            <?php endwhile; wp_reset_postdata(); ?>
                        </div>
                    <?php endif; ?>
                </div>

                <?php $infinity_hero_app = infinity_steam_app_id(); if ($infinity_hero_app) : ?>
                <aside class="hero-steam-card" aria-label="<?php esc_attr_e('Explore the Universe 2175 on Steam', 'infinity'); ?>">
                    <p class="hero-steam-card-kicker"><?php esc_html_e('Now on Steam — Wishlist', 'infinity'); ?></p>
                    <div class="steam-fit" data-basewidth="646" data-baseheight="190">
                        <iframe
                            class="hero-steam-frame"
                            src="<?php echo esc_url('https://store.steampowered.com/widget/' . $infinity_hero_app . '/?utm_source=elliottelford.com&utm_medium=hero_widget&utm_campaign=homepage'); ?>"
                            title="<?php esc_attr_e('Explore the Universe 2175 on Steam', 'infinity'); ?>"
                        ></iframe>
                    </div>
                    <p class="hero-steam-card-note"><?php esc_html_e('Every wishlist boosts launch visibility', 'infinity'); ?></p>
                </aside>
                <?php endif; ?>
            </div>
        </div>
    </section>

    <!-- ================= Property strip ================= -->
    <section class="fp-section fp-properties" aria-label="<?php esc_attr_e('The Telford universe', 'infinity'); ?>">
        <div class="container">
            <div class="property-strip property-strip-live">
                <?php
                $infinity_app_for_art = infinity_steam_app_id();
                $infinity_properties  = array(
                    array(
                        'key'    => 'parkers',
                        'url'    => $parkers_url,
                        'kicker' => __('Play with physics', 'infinity'),
                        'name'   => __("Parker's Physics", 'infinity'),
                        'cta'    => __('Launch the sandbox', 'infinity'),
                        'mono'   => 'PP',
                        'art'    => '',
                        'embed'  => true,
                    ),
                    array(
                        'key'    => 'etu',
                        'url'    => $etu_site_url,
                        'kicker' => __('The space game', 'infinity'),
                        'name'   => __('Explore the Universe 2175', 'infinity'),
                        'cta'    => __('Sign up free', 'infinity'),
                        'mono'   => '2175',
                        // The game's site refuses embedding, so its card shows
                        // the Steam key art until infinity_etu_embed is enabled
                        'art'    => $infinity_etu_art,
                        'embed'  => (bool) get_option('infinity_etu_embed', 0),
                    ),
                    array(
                        'key'    => 'landscaping',
                        'url'    => $landscaping_url,
                        'kicker' => __('The analog craft', 'infinity'),
                        'name'   => __('Telford Landscaping', 'infinity'),
                        'cta'    => __('See the work', 'infinity'),
                        'mono'   => 'TL',
                        'art'    => '',
                        'embed'  => true,
                    ),
                );
                foreach ($infinity_properties as $infinity_prop) :
                    $infinity_logo = infinity_property_logo_url($infinity_prop['key'], $infinity_prop['url']);
                ?>
                <a class="property-card property-card-<?php echo esc_attr($infinity_prop['key']); ?> property-live"
                   href="<?php echo esc_url($infinity_prop['url']); ?>" target="_blank" rel="noopener"
                   <?php if ($infinity_prop['embed']) : ?>data-preview="<?php echo esc_url($infinity_prop['url']); ?>"<?php endif; ?>>
                    <span class="property-live-screen">
                        <span class="property-live-placeholder">
                            <span class="property-live-mono"><?php echo esc_html($infinity_prop['mono']); ?></span>
                            <?php if ('etu' === $infinity_prop['key'] && $infinity_etu_video) : ?>
                                <video class="property-live-art property-live-video" muted loop playsinline preload="none" poster="<?php echo esc_url($infinity_etu_art); ?>">
                                    <source src="<?php echo esc_url($infinity_etu_video); ?>" type="video/mp4">
                                </video>
                            <?php elseif ($infinity_prop['art']) : ?>
                                <img class="property-live-art" src="<?php echo esc_url($infinity_prop['art']); ?>" data-alt="<?php echo esc_attr(implode('|', $infinity_etu_chain)); ?>" alt="" loading="lazy" decoding="async" onerror="<?php echo esc_attr($infinity_etu_onerror); ?>">
                            <?php endif; ?>
                            <?php if ($infinity_logo) : ?>
                                <img class="property-live-logo" src="<?php echo esc_url($infinity_logo); ?>" alt="" loading="lazy" decoding="async" onerror="this.remove();">
                            <?php endif; ?>
                        </span>
                    </span>
                    <span class="property-card-body">
                        <span class="property-card-kicker"><?php echo esc_html($infinity_prop['kicker']); ?></span>
                        <span class="property-card-name"><?php echo esc_html($infinity_prop['name']); ?></span>
                        <span class="property-card-cta"><?php echo esc_html($infinity_prop['cta']); ?> &rarr;</span>
                    </span>
                </a>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <!-- ================= Featured article ================= -->
    <?php
    $featured_id    = (int) get_option('infinity_featured_post_id', 0);
    $featured_query = new WP_Query(array(
        'post_type'           => 'post',
        'posts_per_page'      => 1,
        'ignore_sticky_posts' => false,
        'post__in'            => $featured_id ? array($featured_id) : array(),
        'orderby'             => $featured_id ? 'post__in' : 'date',
    ));
    $infinity_shown_ids = array();
    if ($featured_query->have_posts()) :
        while ($featured_query->have_posts()) : $featured_query->the_post();
            $infinity_shown_ids[] = get_the_ID();
    ?>
    <section class="fp-section fp-featured" aria-labelledby="fp-featured-heading">
        <div class="container">
            <p class="fp-kicker" id="fp-featured-heading"><?php esc_html_e('Featured', 'infinity'); ?></p>
            <article class="fp-featured-card">
                <?php if (has_post_thumbnail()) : ?>
                    <a class="fp-featured-media" href="<?php the_permalink(); ?>" aria-hidden="true" tabindex="-1">
                        <?php the_post_thumbnail('large', array('loading' => 'eager', 'decoding' => 'async', 'fetchpriority' => 'high')); ?>
                    </a>
                <?php endif; ?>
                <div class="fp-featured-body">
                    <?php $cats = get_the_category(); if ($cats) : ?>
                        <a class="fp-card-cat" href="<?php echo esc_url(get_category_link($cats[0])); ?>">
                            <?php echo esc_html($cats[0]->name); ?>
                        </a>
                    <?php endif; ?>
                    <h2 class="fp-featured-title">
                        <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                    </h2>
                    <p class="fp-featured-excerpt"><?php echo esc_html(wp_trim_words(get_the_excerpt(), 40)); ?></p>
                    <a class="fp-readmore" href="<?php the_permalink(); ?>">
                        <?php esc_html_e('Read the article', 'infinity'); ?> &rarr;
                    </a>
                </div>
            </article>
        </div>
    </section>
    <?php
        endwhile;
        wp_reset_postdata();
    endif;
    ?>

    <!-- ================= Content pillars ================= -->
    <?php
    $pillars = array(
        array(
            'id'     => 'health-anatomy',
            'rotate' => false,
            'title'  => __('Health & Anatomy', 'infinity'),
            'intro'  => __('Osteology, nutrition, and how the human body is put together.', 'infinity'),
            'slugs'  => get_option('infinity_pillar_health_slugs', 'anatomy,osteology,health,nutrition,fitness,medicine,wellness,body'),
            'count'  => 4,
        ),
        array(
            'id'     => 'space-simulations',
            'rotate' => false,
            'title'  => __('Space & Simulations', 'infinity'),
            'intro'  => __('Black holes, orbital mechanics, and simulations you can run yourself.', 'infinity'),
            'slugs'  => get_option('infinity_pillar_space_slugs', 'space,astronomy,astrophysics,simulations,physics,cosmos,universe,satellites,black-holes'),
            'count'  => 3,
        ),
        array(
            'id'     => 'mind-philosophy',
            'rotate' => true,
            'title'  => __('Mind & Philosophy', 'infinity'),
            'intro'  => __('Eastern philosophy, contemplative practice, and the big questions.', 'infinity'),
            'slugs'  => get_option('infinity_pillar_mind_slugs', 'philosophy,religion,buddhism,hinduism,yoga,mind,meditation,spirituality,psychology'),
            'count'  => 3,
        ),
        array(
            'id'     => 'science',
            'rotate' => true,
            'title'  => __('Science & Discovery', 'infinity'),
            'intro'  => __('Recent research, big ideas, and the occasional world-eating fungus.', 'infinity'),
            'slugs'  => get_option('infinity_pillar_science_slugs', 'science,biology,nature,technology,research,mushrooms,fungi,discovery'),
            'count'  => 3,
        ),
        array(
            'id'     => 'travel',
            'rotate' => true,
            'title'  => __('Travel & Experiences', 'infinity'),
            'intro'  => __('Field notes, journeys, and stories from the road.', 'infinity'),
            'slugs'  => get_option('infinity_pillar_travel_slugs', 'travel,experiences,adventures,journeys,field-notes,life,blog'),
            'count'  => 3,
        ),
    );

    foreach ($pillars as $pillar) :
        $pillar_query = infinity_fp_query($pillar['slugs'], $pillar['count'], $infinity_shown_ids, !empty($pillar['rotate']));
        if (!$pillar_query->have_posts()) {
            continue;
        }
        $pillar_link = infinity_fp_first_category_link($pillar['slugs']);
    ?>
    <section class="fp-section" id="<?php echo esc_attr($pillar['id']); ?>" aria-labelledby="<?php echo esc_attr($pillar['id']); ?>-heading">
        <div class="container">
            <header class="fp-section-header">
                <div>
                    <h2 class="fp-section-title" id="<?php echo esc_attr($pillar['id']); ?>-heading"><?php echo esc_html($pillar['title']); ?></h2>
                    <p class="fp-section-intro"><?php echo esc_html($pillar['intro']); ?></p>
                </div>
                <?php if ($pillar_link) : ?>
                    <a class="fp-section-all" href="<?php echo esc_url($pillar_link); ?>">
                        <?php esc_html_e('View all', 'infinity'); ?> &rarr;
                    </a>
                <?php endif; ?>
            </header>
            <div class="fp-grid fp-grid-<?php echo (int) $pillar['count']; ?>">
                <?php while ($pillar_query->have_posts()) : $pillar_query->the_post(); $infinity_shown_ids[] = get_the_ID(); ?>
                    <article class="fp-card">
                        <?php if (has_post_thumbnail()) : ?>
                            <a class="fp-card-media" href="<?php the_permalink(); ?>" aria-hidden="true" tabindex="-1">
                                <?php the_post_thumbnail('medium_large', array('loading' => 'lazy', 'decoding' => 'async')); ?>
                            </a>
                        <?php endif; ?>
                        <div class="fp-card-body">
                            <?php $cats = get_the_category(); if ($cats) : ?>
                                <span class="fp-card-cat"><?php echo esc_html($cats[0]->name); ?></span>
                            <?php endif; ?>
                            <h3 class="fp-card-title">
                                <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                            </h3>
                            <time class="fp-card-date" datetime="<?php echo esc_attr(get_the_date('c')); ?>">
                                <?php echo esc_html(get_the_date()); ?>
                            </time>
                        </div>
                    </article>
                <?php endwhile; wp_reset_postdata(); ?>
            </div>
        </div>
    </section>
    <?php endforeach; ?>

    <!-- ================= Explore the Universe 2175 ================= -->
    <section class="fp-section fp-band fp-band-steam" id="explore-the-universe" aria-labelledby="fp-steam-heading">
        <div class="container">
            <div class="fp-band-inner">
                <div class="fp-band-media<?php echo $infinity_etu_video ? ' fp-band-media-video' : ''; ?>">
                    <?php if ($infinity_etu_video) : ?>
                        <video
                            class="fp-etu-video"
                            muted
                            loop
                            playsinline
                            preload="metadata"
                            poster="<?php echo esc_url($infinity_etu_art); ?>"
                            aria-label="<?php echo esc_attr(sprintf(__('%s teaser video', 'infinity'), $steam_label)); ?>"
                        >
                            <source src="<?php echo esc_url($infinity_etu_video); ?>" type="video/mp4">
                        </video>
                        <span class="fp-video-badge" aria-hidden="true">&#9654; <?php esc_html_e('Teaser', 'infinity'); ?></span>
                    <?php else : ?>
                        <img
                            src="<?php echo esc_url($infinity_etu_art); ?>"
                            data-alt="<?php echo esc_attr(implode('|', $infinity_etu_chain)); ?>"
                            alt="<?php echo esc_attr(sprintf(__('%s key art', 'infinity'), $steam_label)); ?>"
                            loading="lazy"
                            decoding="async"
                            onerror="<?php echo esc_attr($infinity_etu_onerror); ?>"
                        >
                    <?php endif; ?>
                </div>
                <div class="fp-band-copy">
                    <p class="fp-kicker"><?php esc_html_e('Now on Steam', 'infinity'); ?></p>
                    <h2 class="fp-section-title" id="fp-steam-heading"><?php echo esc_html($steam_label); ?> 2175</h2>
                    <p class="fp-section-intro">
                        <?php esc_html_e('The year is 2175 and the frontier is open. Command your own ship in a living galaxy built on real orbital mechanics — the same physics running in the simulations on this site. Wishlist it on Steam, then create a free account to follow development and fly with the first wave of pilots.', 'infinity'); ?>
                    </p>
                    <div class="fp-band-actions">
                        <a class="header-steam-cta" href="<?php echo esc_url($steam_url); ?>" target="_blank" rel="noopener noreferrer">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.6"/>
                                <circle cx="15.5" cy="8.5" r="3.1" fill="currentColor"/>
                                <circle cx="7.5" cy="16.5" r="2.1" fill="currentColor"/>
                                <path d="M9.2 15.1l4.1-4.1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                            </svg>
                            <span><?php esc_html_e('Wishlist on Steam', 'infinity'); ?></span>
                        </a>
                        <a class="fp-btn-secondary" href="<?php echo esc_url($etu_site_url); ?>" target="_blank" rel="noopener">
                            <?php esc_html_e('Sign up at ExploreTheUniverse2175.com', 'infinity'); ?>
                        </a>
                    </div>
                    <p class="fp-steam-hype">
                        <?php esc_html_e('Every wishlist moves the launch algorithm — if the simulations on this site light you up, this is the button that funds more of them.', 'infinity'); ?>
                    </p>

                </div>
            </div>
        </div>
    </section>

    <!-- ================= Parker's Physics ================= -->
    <section class="fp-section fp-band fp-band-sandbox" id="parkers-physics" aria-labelledby="fp-sandbox-heading">
        <div class="container">
            <div class="fp-band-inner fp-band-reverse">
                <div class="fp-band-copy">
                    <p class="fp-kicker"><?php esc_html_e('The sandbox', 'infinity'); ?></p>
                    <h2 class="fp-section-title" id="fp-sandbox-heading"><?php esc_html_e("Parker's Physics", 'infinity'); ?></h2>
                    <p class="fp-section-intro">
                        <?php esc_html_e('A real-time Earth weather simulation: live cloud layers, precipitation rates, temperature and wind analysis, barometrics, storm fronts, and the aurora itself — with predictive analytics reaching two weeks out. All riding real physics, right in your browser.', 'infinity'); ?>
                    </p>
                    <div class="fp-band-actions">
                        <a class="fp-btn-primary fp-btn-big" href="<?php echo esc_url($parkers_url); ?>" target="_blank" rel="noopener">
                            <?php esc_html_e('Explore Earth Weather in Real-Time', 'infinity'); ?> &rarr;
                        </a>
                        <a class="fp-btn-secondary fp-btn-big" href="<?php echo esc_url(home_url('/simulations/')); ?>">
                            <?php esc_html_e('Browse simulations here', 'infinity'); ?>
                        </a>
                    </div>
                    <?php infinity_render_feature_grid('parkers', __("Parker's Physics features", 'infinity')); ?>
                </div>
                <?php $infinity_pp_logo = infinity_parkers_logo_big(); ?>
                <div class="fp-band-media pp-stage<?php echo $infinity_pp_logo ? '' : ' pp-no-logo'; ?>" aria-hidden="true">
                    <?php if ($infinity_pp_logo) : ?>
                        <img class="pp-backdrop" src="<?php echo esc_url($infinity_pp_logo); ?>" alt="" loading="lazy" decoding="async" onerror="this.closest('.pp-stage').classList.add('pp-no-logo'); this.remove();">
                    <?php endif; ?>
                    <canvas id="pp-blackhole"></canvas>
                    <span class="pp-holo-mono">PP</span>
                </div>
            </div>
        </div>
    </section>

    <!-- ================= Telford Landscaping ================= -->
    <section class="fp-section fp-band fp-band-landscaping" id="landscaping" aria-labelledby="fp-landscaping-heading">
        <div class="container">
            <div class="fp-band-inner">
                <div class="fp-band-copy">
                    <p class="fp-kicker"><?php esc_html_e('Off screen', 'infinity'); ?></p>
                    <h2 class="fp-section-title" id="fp-landscaping-heading"><?php esc_html_e('Telford Landscaping', 'infinity'); ?></h2>
                    <p class="fp-section-intro">
                        <?php esc_html_e('The analog side of the operation — real dirt, real stone, real results. Project write-ups will land here on the blog.', 'infinity'); ?>
                    </p>
                    <div class="fp-band-actions">
                        <a class="fp-btn-secondary fp-btn-big" href="<?php echo esc_url($landscaping_url); ?>" target="_blank" rel="noopener">
                            <?php esc_html_e('Visit TelfordLandscaping.com', 'infinity'); ?> &rarr;
                        </a>
                    </div>
                    <?php infinity_render_feature_grid('landscaping', __('Telford Landscaping features', 'infinity')); ?>
                </div>
            </div>
        </div>
    </section>

    <!-- ================= Latest posts ================= -->
    <?php
    $latest = new WP_Query(array(
        'post_type'      => 'post',
        'posts_per_page' => 6,
    ));
    if ($latest->have_posts()) :
    ?>
    <section class="fp-section" id="latest" aria-labelledby="fp-latest-heading">
        <div class="container">
            <header class="fp-section-header">
                <h2 class="fp-section-title" id="fp-latest-heading"><?php esc_html_e('Latest from the blog', 'infinity'); ?></h2>
                <a class="fp-section-all" href="<?php echo esc_url(get_permalink(get_option('page_for_posts')) ?: home_url('/blog/')); ?>">
                    <?php esc_html_e('All posts', 'infinity'); ?> &rarr;
                </a>
            </header>
            <ul class="fp-latest-list">
                <?php while ($latest->have_posts()) : $latest->the_post(); ?>
                    <li>
                        <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                        <time datetime="<?php echo esc_attr(get_the_date('c')); ?>"><?php echo esc_html(get_the_date()); ?></time>
                    </li>
                <?php endwhile; wp_reset_postdata(); ?>
            </ul>
        </div>
    </section>
    <?php endif; ?>

    <!-- ================= Category + tag globe ================= -->
    <?php
    // Top 100 terms across BOTH taxonomies, sized by how much writing
    // lives under each. Fetch extra so case-insensitive name dedupe
    // (a "Yoga" category vs a "yoga" tag) still leaves a full 100.
    $infinity_globe_cats = get_terms(array(
        'taxonomy'   => array('category', 'post_tag'),
        'orderby'    => 'count',
        'order'      => 'DESC',
        'number'     => 140,
        'hide_empty' => true,
    ));
    if (is_wp_error($infinity_globe_cats)) {
        $infinity_globe_cats = array();
    }
    $infinity_globe_seen = array();
    $infinity_globe_cats = array_values(array_filter($infinity_globe_cats, function ($t) use (&$infinity_globe_seen) {
        $k = function_exists('mb_strtolower') ? mb_strtolower($t->name) : strtolower($t->name);
        if (isset($infinity_globe_seen[$k])) {
            return false;
        }
        $infinity_globe_seen[$k] = true;
        return true;
    }));
    $infinity_globe_cats = array_slice($infinity_globe_cats, 0, 100);
    if (count($infinity_globe_cats) >= 5) :
        $infinity_total_posts = (int) wp_count_posts()->publish;
        $infinity_max_count   = max(array_map(function ($c) { return (int) $c->count; }, $infinity_globe_cats));
        // Sphere positions follow DOM order — shuffle so the headline
        // terms scatter across the globe instead of pooling at one pole
        shuffle($infinity_globe_cats);
    ?>
    <section class="fp-section fp-tagverse" id="explore-everything" aria-labelledby="fp-tagverse-heading">
        <div class="container">
            <header class="fp-section-header fp-tagverse-header">
                <div>
                    <p class="fp-kicker"><?php esc_html_e('The archive runs deep', 'infinity'); ?></p>
                    <h2 class="fp-section-title" id="fp-tagverse-heading"><?php esc_html_e("Explore Elliot's Writing", 'infinity'); ?></h2>
                    <p class="fp-section-intro">
                        <?php printf(esc_html__('%1$s articles across %2$s worlds of interest — grab the cloud, give it a spin, pick a door.', 'infinity'), number_format_i18n($infinity_total_posts), number_format_i18n(count($infinity_globe_cats))); ?>
                    </p>
                </div>
            </header>
            <div class="tag-globe" id="tag-globe" aria-label="<?php esc_attr_e('Browse categories and tags', 'infinity'); ?>">
                <?php foreach ($infinity_globe_cats as $infinity_gi => $infinity_gcat) :
                    // sqrt curve: a 4-article tag still reads, a 90-article
                    // pillar dominates without drowning everything else
                    $infinity_weight = $infinity_max_count > 0 ? sqrt((int) $infinity_gcat->count / $infinity_max_count) : 0.5;
                    $infinity_glink  = get_term_link($infinity_gcat);
                    if (is_wp_error($infinity_glink)) {
                        continue;
                    }
                ?>
                    <a class="tag-globe-item tag-globe-hue-<?php echo (int) ($infinity_gi % 4); ?>"
                       style="--w: <?php echo esc_attr(round($infinity_weight, 3)); ?>;"
                       href="<?php echo esc_url($infinity_glink); ?>">
                        <?php echo esc_html($infinity_gcat->name); ?><span class="tag-globe-count"><?php echo (int) $infinity_gcat->count; ?></span>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    </section>
    <?php endif; ?>

</div>

<?php get_footer(); ?>
