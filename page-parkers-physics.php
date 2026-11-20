<?php
/**
 * Template Name: Parker's Physics Hub
 *
 * The Parker's Physics hub on elliottelford.com: live readouts, the
 * page's own words, the Living Earth sims, every simulation in the
 * catalog (filterable), who it's for, how it's built, articles that
 * feature it, and sign-up. Used automatically by a page with the slug
 * "parkers-physics". Helpers live in inc/parkers-hub.php.
 *
 * @package Infinity
 * @since 3.21.0
 */

get_header();

$infinity_urls  = infinity_property_urls();
$infinity_pp    = trailingslashit($infinity_urls['parkers']);
$infinity_count = infinity_parkers_catalog_count();
$infinity_cat   = infinity_parkers_catalog();
$infinity_live  = infinity_parkers_live_readouts();

/** Outbound link to a Parker's Physics path, GA4/UTM-tagged. */
$infinity_pp_link = function ($path, $placement, $cta) use ($infinity_pp) {
    return infinity_project_href($infinity_pp . ltrim($path, '/'), $placement, $cta);
};
?>

<article id="post-<?php the_ID(); ?>" <?php post_class('pph'); ?>>
    <?php while (have_posts()) : the_post(); ?>

    <!-- ================= Hero ================= -->
    <header class="pph-hero" data-project-block="parkers" data-placement="hub_hero">
        <div class="container pph-hero-inner">
            <div class="pph-hero-copy">
                <p class="pph-kicker">
                    <?php infinity_brand_mark('parkers', 22); ?>
                    <span><?php esc_html_e('A physics simulation hub', 'infinity'); ?></span>
                </p>
                <?php the_title('<h1 class="pph-title">', '</h1>'); ?>
                <p class="pph-lede">
                    <?php
                    printf(
                        /* translators: %d: number of simulations */
                        esc_html__('%d simulations, one engine. Real physics driven by live NASA, NOAA and USGS data, from the Sun\'s surface to the glaciers, the air we breathe and the black holes at the edges of the map. Free means free: open one and it runs.', 'infinity'),
                        (int) $infinity_count
                    );
                    ?>
                </p>
                <div class="pph-actions">
                    <a class="fp-btn-primary fp-btn-big" href="<?php echo esc_url($infinity_pp_link('signup.html', 'hub_hero', 'signup')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('parkers', 'hub_hero', 'signup'); ?>>
                        <?php esc_html_e('Create a free account', 'infinity'); ?> &rarr;
                    </a>
                    <a class="fp-btn-secondary fp-btn-big" href="#pph-catalog">
                        <?php esc_html_e('Browse the simulations', 'infinity'); ?>
                    </a>
                </div>
            </div>

            <div class="pph-hero-art" aria-hidden="true">
                <?php foreach (array('earthview', 'glacier-watch', 'inner-earth', 'pollution-lab') as $i => $infinity_shot) : ?>
                    <img class="pph-shot pph-shot-<?php echo (int) $i + 1; ?>" src="<?php echo esc_url(INFINITY_URI . '/assets/img/sims/' . $infinity_shot . '.webp'); ?>" alt="" width="1280" height="800" <?php echo 0 === $i ? 'fetchpriority="high"' : 'loading="lazy"'; ?> decoding="async">
                <?php endforeach; ?>
            </div>
        </div>

        <?php if ($infinity_live) : ?>
            <div class="container">
                <section class="pph-live" aria-labelledby="pph-live-heading">
                    <h2 class="pph-live-heading" id="pph-live-heading"><span class="pp-sim-live-dot" aria-hidden="true"></span> <?php esc_html_e('Right now', 'infinity'); ?></h2>
                    <div class="pph-live-grid">
                        <?php foreach ($infinity_live as $r) : ?>
                            <a class="pph-reading pph-tone-<?php echo esc_attr($r['tone']); ?>" href="<?php echo esc_url($infinity_pp_link($r['path'], 'hub_live', $r['cta'])); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('parkers', 'hub_live', $r['cta']); ?>>
                                <span class="pph-reading-label"><?php echo esc_html($r['label']); ?></span>
                                <span class="pph-reading-value"><?php echo esc_html($r['value']); ?><?php if ($r['unit']) : ?> <small><?php echo esc_html($r['unit']); ?></small><?php endif; ?></span>
                                <span class="pph-reading-note"><?php echo esc_html($r['note']); ?></span>
                            </a>
                        <?php endforeach; ?>
                    </div>
                    <p class="pph-live-source"><?php esc_html_e('NOAA SWPC and USGS feeds, refreshed every 10 minutes. Each reading opens the simulation that models it.', 'infinity'); ?></p>
                </section>
            </div>
        <?php endif; ?>
    </header>

    <div class="container pph-body">

        <?php if (trim(get_the_content())) : ?>
            <div class="entry-content pph-intro">
                <?php the_content(); ?>
            </div>
        <?php endif; ?>

        <!-- ================= Living Earth ================= -->
        <section class="pph-section" aria-labelledby="pph-earth-heading">
            <p class="pph-section-kicker"><?php esc_html_e('Featured', 'infinity'); ?></p>
            <h2 class="pph-section-title" id="pph-earth-heading"><?php esc_html_e('Living Earth: the climate as a feedback loop', 'infinity'); ?></h2>
            <p class="pph-section-intro"><?php esc_html_e('Three instruments read three layers of a changing planet: the ice, the air and the ground beneath them. Each one runs on live data.', 'infinity'); ?></p>
            <?php
            echo do_shortcode('[parkers_sims title="' . esc_attr__('Watch the Earth change, live', 'infinity') . '" intro="" placement="hub_living_earth"]'); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped in the shortcode
            ?>
        </section>

        <!-- ================= Catalog ================= -->
        <section class="pph-section pph-catalog" id="pph-catalog" aria-labelledby="pph-catalog-heading" data-project="parkers" data-placement="hub_catalog">
            <p class="pph-section-kicker"><?php esc_html_e('The full catalog', 'infinity'); ?></p>
            <h2 class="pph-section-title" id="pph-catalog-heading">
                <?php
                /* translators: %d: number of simulations */
                printf(esc_html__('All %d simulations', 'infinity'), (int) $infinity_count);
                ?>
            </h2>

            <div class="pph-filter" role="search" hidden>
                <div class="pph-chips" role="group" aria-label="<?php esc_attr_e('Filter by category', 'infinity'); ?>">
                    <button type="button" class="pph-chip" data-filter="all" aria-pressed="true">
                        <?php esc_html_e('All', 'infinity'); ?> <span class="pph-chip-n"><?php echo (int) $infinity_count; ?></span>
                    </button>
                    <?php foreach ($infinity_cat as $section) : ?>
                        <button type="button" class="pph-chip" data-filter="<?php echo esc_attr($section['key']); ?>" aria-pressed="false">
                            <?php echo esc_html($section['title']); ?> <span class="pph-chip-n"><?php echo count($section['sims']); ?></span>
                        </button>
                    <?php endforeach; ?>
                </div>
                <label class="pph-search">
                    <span class="screen-reader-text"><?php esc_html_e('Search simulations', 'infinity'); ?></span>
                    <?php infinity_icon('search', 18); ?>
                    <input type="search" placeholder="<?php esc_attr_e('Search: aurora, black hole, Mars…', 'infinity'); ?>" autocomplete="off">
                </label>
                <p class="pph-filter-status" aria-live="polite"></p>
            </div>

            <?php foreach ($infinity_cat as $section) : ?>
                <div class="pph-cat" data-section="<?php echo esc_attr($section['key']); ?>">
                    <div class="pph-cat-head">
                        <h3 class="pph-cat-title"><?php echo esc_html($section['title']); ?></h3>
                        <?php if ($section['note']) : ?><p class="pph-cat-note"><?php echo esc_html($section['note']); ?></p><?php endif; ?>
                    </div>
                    <div class="pph-grid">
                        <?php foreach ($section['sims'] as $sim) :
                            $infinity_cta = 'sim_' . sanitize_key(str_replace(array('.html', '-'), array('', '_'), basename($sim['path'])));
                            $infinity_tag = strtoupper($sim['badge']);
                            ?>
                            <a class="pph-sim" href="<?php echo esc_url(infinity_project_href($sim['url'], 'hub_catalog', $infinity_cta)); ?>" target="_blank" rel="noopener" data-find="<?php echo esc_attr(strtolower($sim['title'] . ' ' . $sim['blurb'] . ' ' . $section['title'])); ?>" data-cta="<?php echo esc_attr($infinity_cta); ?>"<?php infinity_project_attrs('parkers', 'hub_catalog', $infinity_cta); ?>>
                                <span class="pph-sim-top">
                                    <span class="pph-sim-icon" aria-hidden="true">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" focusable="false"><?php echo $sim['icon']; // phpcs:ignore WordPress.Security.EscapeOutput -- static shape markup, validated by tools/build-parkers-catalog.py ?></svg>
                                    </span>
                                    <?php if ($infinity_tag) : ?>
                                        <span class="pph-badge pph-badge-<?php echo esc_attr(sanitize_title($infinity_tag)); ?>"><?php echo esc_html($infinity_tag); ?></span>
                                    <?php endif; ?>
                                </span>
                                <span class="pph-sim-title"><?php echo esc_html($sim['title']); ?></span>
                                <span class="pph-sim-blurb"><?php echo esc_html($sim['blurb']); ?></span>
                                <?php if ($sim['tier'] && 'free' !== strtolower($sim['tier'])) : ?>
                                    <span class="pph-sim-tier"><?php echo esc_html($sim['tier']); ?></span>
                                <?php endif; ?>
                            </a>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endforeach; ?>

            <p class="pph-empty" hidden><?php esc_html_e('No simulation matches that.', 'infinity'); ?> <button type="button" class="pph-clear"><?php esc_html_e('Clear the filter', 'infinity'); ?></button></p>
        </section>

        <!-- ================= How it's built ================= -->
        <section class="pph-section" aria-labelledby="pph-built-heading">
            <p class="pph-section-kicker"><?php esc_html_e('How it\'s built', 'infinity'); ?></p>
            <h2 class="pph-section-title" id="pph-built-heading"><?php esc_html_e('Measured, not animated', 'infinity'); ?></h2>
            <div class="pph-principles">
                <div class="pph-principle">
                    <span class="pph-principle-icon" aria-hidden="true"><?php infinity_icon('satellite', 26); ?></span>
                    <h3><?php esc_html_e('Live data', 'infinity'); ?></h3>
                    <p><?php esc_html_e('Solar wind from L1, Kp, earthquakes, satellite image pairs, air-quality analyses: the same NASA, NOAA, USGS and Copernicus feeds the professionals watch, as they arrive.', 'infinity'); ?></p>
                </div>
                <div class="pph-principle">
                    <span class="pph-principle-icon" aria-hidden="true"><?php infinity_icon('flask', 26); ?></span>
                    <h3><?php esc_html_e('Published physics', 'infinity'); ?></h3>
                    <p><?php esc_html_e('Models from the literature, cited on the page, with the constants and assumptions disclosed so you can check the work.', 'infinity'); ?></p>
                </div>
                <div class="pph-principle">
                    <span class="pph-principle-icon" aria-hidden="true"><?php infinity_icon('planner', 26); ?></span>
                    <h3><?php esc_html_e('Scored against reality', 'infinity'); ?></h3>
                    <p><?php esc_html_e('Forecasts are locked before the event and scored after it. Real storms, like the May 2024 Gannon G5, are replayed hour by hour against what the models said.', 'infinity'); ?></p>
                </div>
                <div class="pph-principle">
                    <span class="pph-principle-icon" aria-hidden="true"><?php infinity_icon('rocket', 26); ?></span>
                    <h3><?php esc_html_e('Runs in your browser', 'infinity'); ?></h3>
                    <p><?php esc_html_e('WebGL and a Rust/WebAssembly compute engine. Nothing to install, on a laptop, a tablet or a classroom Chromebook.', 'infinity'); ?></p>
                </div>
            </div>
        </section>

        <!-- ================= Who it's for ================= -->
        <section class="pph-section" aria-labelledby="pph-who-heading" data-project="parkers" data-placement="hub_audience">
            <p class="pph-section-kicker"><?php esc_html_e('Who it\'s for', 'infinity'); ?></p>
            <h2 class="pph-section-title" id="pph-who-heading"><?php esc_html_e('Start where you are', 'infinity'); ?></h2>
            <div class="pph-audiences">
                <?php
                $infinity_aud = array(
                    array('sun', __('Curious minds', 'infinity'), __('Will the aurora show tonight? What did that earthquake do? Start with EarthView and the AurOracle.', 'infinity'), 'earth.html', __('Open EarthView', 'infinity'), 'aud_curious'),
                    array('clipboard', __('Educators', 'infinity'), __('Live NASA and NOAA data for the classroom, with per-seat licenses and lesson plans for grades 9–14.', 'infinity'), 'for-educators.html', __('For educators', 'infinity'), 'aud_educators'),
                    array('satellite', __('Satellite operators', 'infinity'), __('Stress a LEO fleet against live or historical-class space weather: decay, conjunctions, propellant and maneuvers, with uncertainty.', 'infinity'), 'for-operators.html', __('For operators', 'infinity'), 'aud_operators'),
                    array('flask', __('Researchers', 'infinity'), __('The evidence surface: storms replayed against the models, the write-ups, and the engine underneath.', 'infinity'), 'research.html', __('Research', 'infinity'), 'aud_research'),
                );
                foreach ($infinity_aud as $a) :
                    ?>
                    <a class="pph-audience" href="<?php echo esc_url($infinity_pp_link($a[3], 'hub_audience', $a[5])); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('parkers', 'hub_audience', $a[5]); ?>>
                        <span class="pph-principle-icon" aria-hidden="true"><?php infinity_icon($a[0], 24); ?></span>
                        <span class="pph-audience-title"><?php echo esc_html($a[1]); ?></span>
                        <span class="pph-audience-text"><?php echo esc_html($a[2]); ?></span>
                        <span class="pph-audience-cta"><?php echo esc_html($a[4]); ?> <span aria-hidden="true">&rarr;</span></span>
                    </a>
                <?php endforeach; ?>
            </div>
        </section>

        <!-- ================= Articles ================= -->
        <?php $infinity_posts = infinity_parkers_articles(6); ?>
        <?php if ($infinity_posts) : ?>
            <section class="pph-section" aria-labelledby="pph-read-heading">
                <p class="pph-section-kicker"><?php esc_html_e('On the blog', 'infinity'); ?></p>
                <h2 class="pph-section-title" id="pph-read-heading"><?php esc_html_e('Writing about the simulations', 'infinity'); ?></h2>
                <div class="pph-posts">
                    <?php foreach ($infinity_posts as $infinity_post) : ?>
                        <a class="pph-post" href="<?php echo esc_url(get_permalink($infinity_post)); ?>">
                            <?php if (has_post_thumbnail($infinity_post)) : ?>
                                <?php echo get_the_post_thumbnail($infinity_post, 'medium_large', array('class' => 'pph-post-img', 'loading' => 'lazy', 'alt' => '')); ?>
                            <?php endif; ?>
                            <span class="pph-post-body">
                                <span class="pph-post-date"><?php echo esc_html(get_the_date('', $infinity_post)); ?></span>
                                <span class="pph-post-title"><?php echo esc_html(get_the_title($infinity_post)); ?></span>
                                <span class="pph-post-excerpt"><?php echo esc_html(wp_trim_words(get_the_excerpt($infinity_post), 22)); ?></span>
                            </span>
                        </a>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php endif; ?>

        <!-- ================= Sign up ================= -->
        <section class="pph-cta" aria-labelledby="pph-cta-heading" data-project="parkers" data-placement="hub_footer" data-project-block="parkers">
            <?php infinity_brand_mark('parkers', 56); ?>
            <h2 class="pph-cta-title" id="pph-cta-heading"><?php esc_html_e('Watch the universe as it happens', 'infinity'); ?></h2>
            <p class="pph-cta-text"><?php esc_html_e('A free account saves your locations, sends aurora and storm alerts, and unlocks the account-only simulations.', 'infinity'); ?></p>
            <div class="pph-actions pph-actions-center">
                <a class="fp-btn-primary fp-btn-big" href="<?php echo esc_url($infinity_pp_link('signup.html', 'hub_footer', 'signup')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('parkers', 'hub_footer', 'signup'); ?>>
                    <?php esc_html_e('Create a free account', 'infinity'); ?> &rarr;
                </a>
                <a class="fp-btn-secondary fp-btn-big" href="<?php echo esc_url($infinity_pp_link('', 'hub_footer', 'home')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('parkers', 'hub_footer', 'home'); ?>>
                    <?php esc_html_e('Go to ParkersPhysics.com', 'infinity'); ?>
                </a>
            </div>
        </section>

        <?php if (get_edit_post_link()) : ?>
            <footer class="entry-footer"><?php edit_post_link(__('Edit this page', 'infinity'), '<span class="edit-link">', '</span>'); ?></footer>
        <?php endif; ?>
    </div>

    <?php endwhile; ?>
</article>

<?php
get_footer();
