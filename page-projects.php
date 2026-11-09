<?php
/**
 * Template Name: Projects Funnel
 *
 * The /projects/ page (picked up automatically by its slug, or chosen
 * from the Template dropdown on any page). Built as a funnel into the
 * three project sites:
 *
 *   1. Intent tiles  — "what are you here for?" → straight to the site
 *   2. Project blocks — pitch, proof, one primary + one secondary CTA
 *   3. Editor content — anything written on the page in the editor
 *   4. Subscribe      — the catch-all for visitors not ready to click out
 *
 * Every outbound link carries data-project / data-placement / data-cta
 * for the GA4 event layer (inc/ga-events.php) and UTM tags for the
 * destination's own analytics.
 *
 * Copy and order are filterable through `infinity_projects`.
 *
 * @package Infinity
 * @since 3.15.0
 */

get_header();

$infinity_urls      = infinity_property_urls();
$infinity_etu_video = infinity_etu_video_url();
$infinity_etu_art   = get_option('infinity_etu_band_art', '') ?: INFINITY_URI . '/assets/img/etu-key-art.jpg';
$infinity_pp_art    = infinity_parkers_logo_big() ?: INFINITY_URI . '/assets/img/parkers-physics-logo.png';
$infinity_ls_art    = infinity_media_search_image('landscaping');

$infinity_projects = apply_filters('infinity_projects', array(
    'etu' => array(
        'name'      => __('Explore the Universe 2175', 'infinity'),
        'kicker'    => __('The game', 'infinity'),
        'status'    => __('Wishlist open on Steam', 'infinity'),
        'icon'      => 'rocket',
        'intent'    => __('I want to play', 'infinity'),
        'intent_sub'=> __('A 2D space sci-fi game with adaptive AI', 'infinity'),
        'pitch'     => __('Command your own ship in a living galaxy. The year is 2175, the frontier is open, and the ships, factions and pirates learn how you play and adapt to it.', 'infinity'),
        'proof'     => array(
            __('Real orbital mechanics: the same physics that runs the simulations on this site', 'infinity'),
            __('Machine-learning opponents that change their tactics to counter yours', 'infinity'),
            __('Every wishlist pushes the launch up Steam’s discovery queue', 'infinity'),
        ),
        'primary'   => 'wishlist',
        'secondary' => array(
            'label' => __('Join the first wave at ExploreTheUniverse2175.com', 'infinity'),
            'url'   => $infinity_urls['etu'],
        ),
        'media'     => array('type' => $infinity_etu_video ? 'video' : 'img', 'src' => $infinity_etu_video ?: $infinity_etu_art, 'poster' => $infinity_etu_art),
        'features'  => false,
    ),
    'parkers' => array(
        'name'      => __("Parker's Physics", 'infinity'),
        'kicker'    => __('The sandbox', 'infinity'),
        'status'    => __('Live, free, runs in your browser', 'infinity'),
        'icon'      => 'orbit',
        'intent'    => __('I want to explore real physics', 'infinity'),
        'intent_sub'=> __('Live Earth weather, aurora forecasts, orbits', 'infinity'),
        'pitch'     => __('A physics simulation hub built on real data: live cloud layers, wind, storm fronts and the aurora, with forecasts reaching two weeks out. No install, no account.', 'infinity'),
        'proof'     => array(
            __('Driven by live observational data, not canned animations', 'infinity'),
            __('Aurora and space-weather forecasts from a computational astrophysicist', 'infinity'),
            __('Opens instantly on desktop or phone', 'infinity'),
        ),
        'primary'   => array(
            'label' => __("Launch Parker's Physics", 'infinity'),
            'url'   => $infinity_urls['parkers'],
        ),
        'secondary' => array(
            'label' => __('Try the Auroracle forecast', 'infinity'),
            'url'   => trailingslashit($infinity_urls['parkers']) . 'auroracle.html',
        ),
        'media'     => array('type' => 'img', 'src' => $infinity_pp_art, 'contain' => true),
        'features'  => true,
    ),
    'landscaping' => array(
        'name'      => __('Telford Landscaping', 'infinity'),
        'kicker'    => __('Off screen', 'infinity'),
        'status'    => __('Booking consultations · Sacramento foothills', 'infinity'),
        'icon'      => 'leaf',
        'intent'    => __('I want a yard designed', 'infinity'),
        'intent_sub'=> __('Estate-scale design-build with a live 3D preview', 'infinity'),
        'pitch'     => __('Stone, soil and honest work. Preview your yard in 3D, watch it grow over 30 years in the simulator, then have it built properly.', 'infinity'),
        'proof'     => array(
            __('See the design in 3D before a shovel hits the ground', 'infinity'),
            __('A 30-year growth simulation, so the planting still works in 2055', 'infinity'),
            __('A curated library of 60+ California species', 'infinity'),
        ),
        'primary'   => array(
            'label' => __('Request a consultation', 'infinity'),
            'url'   => $infinity_urls['landscaping'],
        ),
        'secondary' => array(
            'label' => __('Open the Design Studio', 'infinity'),
            'url'   => $infinity_urls['landscaping'],
        ),
        'media'     => $infinity_ls_art ? array('type' => 'img', 'src' => $infinity_ls_art) : array('type' => 'icon'),
        'features'  => true,
    ),
));

/**
 * The project's primary CTA: the wishlist button for the game, a big
 * gradient button for everything else.
 */
$infinity_primary_cta = function ($key, $p, $placement) {
    if ('wishlist' === $p['primary']) {
        infinity_etu_wishlist_cta(array('campaign' => $placement));
        return;
    }
    ?>
    <a class="fp-btn-primary fp-btn-big" href="<?php echo esc_url(infinity_project_href($p['primary']['url'], $placement, 'primary')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs($key, $placement, 'primary'); ?>>
        <?php echo esc_html($p['primary']['label']); ?> <span aria-hidden="true">&rarr;</span>
    </a>
    <?php
};
?>

<div class="projects-page">
<?php while (have_posts()) : the_post(); ?>

    <!-- ================= Hero: pick a door ================= -->
    <section class="pj-hero" aria-labelledby="pj-title">
        <div class="container">
            <p class="fp-kicker"><?php esc_html_e('What I’m building', 'infinity'); ?></p>
            <?php the_title('<h1 class="pj-title" id="pj-title">', '</h1>'); ?>
            <p class="pj-lede">
                <?php
                echo has_excerpt()
                    ? esc_html(get_the_excerpt())
                    : esc_html__('A game, a physics lab and a landscaping studio — three projects, one obsession with getting the physics right. Pick the one you came for.', 'infinity');
                ?>
            </p>

            <ul class="pj-intents" data-placement="projects_hero">
                <?php foreach ($infinity_projects as $key => $p) :
                    $intent_url = 'wishlist' === $p['primary'] ? $infinity_urls['steam'] : $p['primary']['url'];
                ?>
                    <li class="pj-intent pj-intent-<?php echo esc_attr($key); ?>" data-intent="<?php echo esc_attr($key); ?>" data-project="<?php echo esc_attr($key); ?>">
                        <a class="pj-intent-go" href="<?php echo esc_url(infinity_project_href($intent_url, 'projects_hero', 'intent')); ?>" target="_blank" rel="noopener" data-cta="intent" data-rum="<?php echo esc_attr('projects_hero:' . $key . ':intent'); ?>">
                            <span class="pj-intent-icon" aria-hidden="true"><?php infinity_icon($p['icon'], 28); ?></span>
                            <span class="pj-intent-text">
                                <span class="pj-intent-label"><?php echo esc_html($p['intent']); ?></span>
                                <span class="pj-intent-sub"><?php echo esc_html($p['intent_sub']); ?></span>
                                <span class="pj-intent-name"><?php echo esc_html($p['name']); ?> <span aria-hidden="true">&nearr;</span></span>
                            </span>
                        </a>
                        <a class="pj-intent-more" href="#project-<?php echo esc_attr($key); ?>">
                            <?php esc_html_e('Details', 'infinity'); ?> <span aria-hidden="true">&darr;</span>
                        </a>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </section>

    <!-- ================= Project blocks ================= -->
    <?php $infinity_i = 0; foreach ($infinity_projects as $key => $p) :
        $placement = 'projects_' . $key;
        $media     = $p['media'];
        $band      = array('etu' => 'fp-band-steam', 'parkers' => 'fp-band-sandbox', 'landscaping' => 'fp-band-landscaping');
    ?>
    <section class="fp-section fp-band <?php echo esc_attr(isset($band[$key]) ? $band[$key] : ''); ?> pj-project pj-project-<?php echo esc_attr($key); ?>" id="project-<?php echo esc_attr($key); ?>"
             aria-labelledby="pj-<?php echo esc_attr($key); ?>-title"
             data-project-block="<?php echo esc_attr($key); ?>" data-placement="<?php echo esc_attr($placement); ?>">
        <div class="container">
            <div class="fp-band-inner<?php echo ($infinity_i++ % 2) ? ' fp-band-reverse' : ''; ?>">
                <div class="fp-band-media pj-media<?php echo !empty($media['contain']) ? ' pj-media-contain' : ''; ?><?php echo 'icon' === $media['type'] ? ' pj-media-icon' : ''; ?>">
                    <?php if ('video' === $media['type']) : ?>
                        <video class="fp-etu-video" muted loop playsinline preload="metadata" poster="<?php echo esc_url($media['poster']); ?>" aria-label="<?php echo esc_attr(sprintf(__('%s teaser video', 'infinity'), $p['name'])); ?>">
                            <source src="<?php echo esc_url($media['src']); ?>" type="video/mp4">
                        </video>
                    <?php elseif ('img' === $media['type']) : ?>
                        <img src="<?php echo esc_url($media['src']); ?>" alt="<?php echo esc_attr($p['name']); ?>" loading="<?php echo 1 === $infinity_i ? 'eager' : 'lazy'; ?>" decoding="async">
                    <?php else : ?>
                        <span aria-hidden="true"><?php infinity_icon($p['icon'], 96); ?></span>
                    <?php endif; ?>
                </div>

                <div class="fp-band-copy">
                    <p class="fp-kicker"><?php echo esc_html($p['kicker']); ?></p>
                    <h2 class="fp-section-title" id="pj-<?php echo esc_attr($key); ?>-title"><?php echo esc_html($p['name']); ?></h2>
                    <p class="pj-status"><span class="pj-status-dot" aria-hidden="true"></span><?php echo esc_html($p['status']); ?></p>
                    <p class="fp-section-intro"><?php echo esc_html($p['pitch']); ?></p>

                    <?php if (!empty($p['proof'])) : ?>
                        <ul class="pj-proof">
                            <?php foreach ($p['proof'] as $line) : ?>
                                <li><?php echo esc_html($line); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    <?php endif; ?>

                    <div class="fp-band-actions pj-actions">
                        <?php $infinity_primary_cta($key, $p, $placement); ?>
                        <?php if (!empty($p['secondary'])) : ?>
                            <a class="fp-btn-secondary fp-btn-big" href="<?php echo esc_url(infinity_project_href($p['secondary']['url'], $placement, 'secondary')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs($key, $placement, 'secondary'); ?>>
                                <?php echo esc_html($p['secondary']['label']); ?>
                            </a>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <?php if (!empty($p['features'])) : ?>
                <?php infinity_render_feature_grid($key, sprintf(__('%s features', 'infinity'), $p['name']), $placement); ?>
            <?php endif; ?>
        </div>
    </section>
    <?php endforeach; ?>

    <!-- ================= Anything written in the editor ================= -->
    <?php if ('' !== trim((string) get_the_content())) : ?>
    <section class="fp-section pj-notes" aria-labelledby="pj-notes-title">
        <div class="container">
            <h2 class="fp-section-title" id="pj-notes-title"><?php esc_html_e('From the workshop', 'infinity'); ?></h2>
            <div class="entry-content">
                <?php the_content(); ?>
            </div>
        </div>
    </section>
    <?php endif; ?>

    <!-- ================= Not ready to click out? ================= -->
    <section class="fp-section pj-close" aria-labelledby="pj-close-title">
        <div class="container">
            <h2 class="fp-section-title" id="pj-close-title"><?php esc_html_e('Still deciding?', 'infinity'); ?></h2>
            <p class="fp-section-intro"><?php esc_html_e('Each one takes under a minute to try. Or get build updates by email and come back when something ships.', 'infinity'); ?></p>
            <div class="pj-close-links" data-placement="projects_close">
                <?php foreach ($infinity_projects as $key => $p) :
                    $u = 'wishlist' === $p['primary'] ? $infinity_urls['steam'] : $p['primary']['url'];
                    $l = 'wishlist' === $p['primary'] ? __('Wishlist on Steam', 'infinity') : $p['primary']['label'];
                ?>
                    <a class="pj-close-link pj-close-<?php echo esc_attr($key); ?>" href="<?php echo esc_url(infinity_project_href($u, 'projects_close', 'primary')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs($key, 'projects_close', 'primary'); ?>>
                        <span aria-hidden="true"><?php infinity_icon($p['icon'], 20); ?></span>
                        <span><strong><?php echo esc_html($p['name']); ?></strong> <?php echo esc_html($l); ?> &rarr;</span>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <?php
    if (function_exists('infinity_subscribe_band')) {
        infinity_subscribe_band('projects-page');
    }
    ?>

    <?php if (get_edit_post_link()) : ?>
        <div class="container"><?php edit_post_link(__('Edit page', 'infinity'), '<p class="edit-link">', '</p>'); ?></div>
    <?php endif; ?>

<?php endwhile; ?>
</div>

<?php
get_footer();
