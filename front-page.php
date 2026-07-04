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
?>

<div class="front-page">

    <!-- ================= Hero: black hole ================= -->
    <section class="fp-hero fp-hero-blackhole">
        <canvas id="fp-blackhole" aria-hidden="true"></canvas>
        <div class="container">
            <div class="fp-hero-inner">
                <div class="fp-hero-copy">
                    <h1 class="fp-hero-title"><?php bloginfo('name'); ?></h1>
                    <p class="fp-hero-tagline">
                        <?php
                        $tagline = get_bloginfo('description');
                        echo esc_html($tagline ? $tagline : __('Anatomy, science, and stories from the field — plus a universe to explore.', 'infinity'));
                        ?>
                    </p>
                    <nav class="fp-pillar-nav" aria-label="<?php esc_attr_e('Site sections', 'infinity'); ?>">
                        <a href="#health-anatomy"><?php esc_html_e('Health & Anatomy', 'infinity'); ?></a>
                        <a href="#science"><?php esc_html_e('Science', 'infinity'); ?></a>
                        <a href="#travel"><?php esc_html_e('Travel & Experiences', 'infinity'); ?></a>
                        <a href="#explore-the-universe"><?php esc_html_e('The Game', 'infinity'); ?></a>
                        <a href="#landscaping"><?php esc_html_e('Landscaping', 'infinity'); ?></a>
                    </nav>
                </div>
            </div>
        </div>
    </section>

    <!-- ================= Property strip ================= -->
    <section class="fp-section fp-properties" aria-label="<?php esc_attr_e('The Telford universe', 'infinity'); ?>">
        <div class="container">
            <div class="property-strip">
                <a class="property-card property-card-parkers" href="<?php echo esc_url($parkers_url); ?>" target="_blank" rel="noopener">
                    <span class="property-card-kicker"><?php esc_html_e('Play with physics', 'infinity'); ?></span>
                    <span class="property-card-name"><?php esc_html_e("Parker's Physics", 'infinity'); ?></span>
                    <span class="property-card-cta"><?php esc_html_e('Launch the sandbox', 'infinity'); ?> &rarr;</span>
                </a>
                <a class="property-card property-card-etu" href="<?php echo esc_url($etu_site_url); ?>" target="_blank" rel="noopener">
                    <span class="property-card-kicker"><?php esc_html_e('The space game', 'infinity'); ?></span>
                    <span class="property-card-name"><?php esc_html_e('Explore the Universe 2175', 'infinity'); ?></span>
                    <span class="property-card-cta"><?php esc_html_e('Sign up free', 'infinity'); ?> &rarr;</span>
                </a>
                <a class="property-card property-card-landscaping" href="<?php echo esc_url($landscaping_url); ?>" target="_blank" rel="noopener">
                    <span class="property-card-kicker"><?php esc_html_e('The analog craft', 'infinity'); ?></span>
                    <span class="property-card-name"><?php esc_html_e('Telford Landscaping', 'infinity'); ?></span>
                    <span class="property-card-cta"><?php esc_html_e('See the work', 'infinity'); ?> &rarr;</span>
                </a>
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
    if ($featured_query->have_posts()) :
        while ($featured_query->have_posts()) : $featured_query->the_post();
    ?>
    <section class="fp-section fp-featured" aria-labelledby="fp-featured-heading">
        <div class="container">
            <p class="fp-kicker" id="fp-featured-heading"><?php esc_html_e('Featured', 'infinity'); ?></p>
            <article class="fp-featured-card">
                <?php if (has_post_thumbnail()) : ?>
                    <a class="fp-featured-media" href="<?php the_permalink(); ?>" aria-hidden="true" tabindex="-1">
                        <?php the_post_thumbnail('large', array('loading' => 'eager')); ?>
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
            'title'  => __('Health & Anatomy', 'infinity'),
            'intro'  => __('Osteology, nutrition, and how the human body is put together.', 'infinity'),
            'slugs'  => get_option('infinity_pillar_health_slugs', 'anatomy,osteology,health,nutrition'),
            'count'  => 4,
        ),
        array(
            'id'     => 'science',
            'title'  => __('Science & Discovery', 'infinity'),
            'intro'  => __('Recent research, big ideas, and the occasional world-eating fungus.', 'infinity'),
            'slugs'  => get_option('infinity_pillar_science_slugs', 'science'),
            'count'  => 3,
        ),
        array(
            'id'     => 'travel',
            'title'  => __('Travel & Experiences', 'infinity'),
            'intro'  => __('Field notes, journeys, and stories from the road.', 'infinity'),
            'slugs'  => get_option('infinity_pillar_travel_slugs', 'travel,experiences'),
            'count'  => 3,
        ),
    );

    foreach ($pillars as $pillar) :
        $pillar_query = infinity_fp_query($pillar['slugs'], $pillar['count']);
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
                <?php while ($pillar_query->have_posts()) : $pillar_query->the_post(); ?>
                    <article class="fp-card">
                        <?php if (has_post_thumbnail()) : ?>
                            <a class="fp-card-media" href="<?php the_permalink(); ?>" aria-hidden="true" tabindex="-1">
                                <?php the_post_thumbnail('medium_large', array('loading' => 'lazy')); ?>
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
                <div class="fp-band-media">
                    <img
                        src="https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4094340/header.jpg"
                        alt="<?php echo esc_attr(sprintf(__('%s key art', 'infinity'), $steam_label)); ?>"
                        loading="lazy"
                        onerror="this.closest('.fp-band-media').classList.add('fp-media-fallback'); this.remove();"
                    >
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
                        <?php esc_html_e('Real orbital mechanics you can bend with your hands. Spin up a solar system, throw a moon at it, and watch what gravity decides — no install, no login, right in your browser. This is the sandbox I\'m building for you, and it\'s the engine room behind Explore the Universe 2175.', 'infinity'); ?>
                    </p>
                    <div class="fp-band-actions">
                        <a class="fp-btn-primary" href="<?php echo esc_url($parkers_url); ?>" target="_blank" rel="noopener">
                            <?php esc_html_e('Launch Parker\'s Physics', 'infinity'); ?> &rarr;
                        </a>
                        <a class="fp-btn-secondary" href="<?php echo esc_url(home_url('/simulations/')); ?>">
                            <?php esc_html_e('Browse simulations here', 'infinity'); ?>
                        </a>
                    </div>
                </div>
                <div class="fp-band-media fp-media-sandbox" aria-hidden="true">
                    <span class="cosmic-logo" style="--logo-size: 140px;">
                        <span class="cosmic-logo-monogram">ET</span>
                        <span class="cosmic-orbit cosmic-orbit-a"><span class="cosmic-orbit-ring"></span><span class="cosmic-orbiter"></span></span>
                        <span class="cosmic-orbit cosmic-orbit-b"><span class="cosmic-orbit-ring"></span><span class="cosmic-orbiter"></span></span>
                        <span class="cosmic-logo-sparkle"></span>
                    </span>
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
                        <a class="fp-btn-secondary" href="<?php echo esc_url($landscaping_url); ?>" target="_blank" rel="noopener">
                            <?php esc_html_e('Visit TelfordLandscaping.com', 'infinity'); ?> &rarr;
                        </a>
                    </div>
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

</div>

<?php get_footer(); ?>
