<?php
/**
 * Living Earth: Parker's Physics simulations inside articles.
 *
 * Three shortcodes for writing about the climate as a feedback system
 * with the live Parker's Physics instruments beside the words:
 *
 *   [parkers_sim id="glacier-watch"]   one simulation as a rich card;
 *                                      embed="1" adds "Run it here"
 *   [parkers_sims]                     the trio as a compact band
 *                                      (ids="a,b,c" title="..." to vary)
 *   [climate_loop]                     the feedback-loop diagram that ties
 *                                      the three together, nodes linking out
 *   [parkers_next]                     "Next stop" banner (EarthView by
 *                                      default); [parkers_sims] ends with it
 *
 * Every outbound link carries the GA4 project_click attributes
 * (data-project="parkers", placement "article") and UTM tags through
 * infinity_project_href(), so the funnel shows which article and which
 * card sent each visitor. Posts using any of the shortcodes also gain
 * schema.org "mentions" of the simulations as WebApplications.
 *
 * Stylesheet and script load only on pages whose content uses them.
 *
 * @package Infinity
 * @since 3.20.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * The simulation registry.
 *
 * Each entry: title, sphere (the Earth-system layer it watches),
 * tagline, measures (what it reads live), loop (its part in the
 * feedback system), icon (inc/icons.php), accent, path on
 * parkersphysics.com. URLs can be overridden per sim in the Customizer
 * (Living Earth Simulations) or with the infinity_living_earth_sims
 * filter.
 */
function infinity_living_earth_sims() {
    $sims = array(
        'inner-earth' => array(
            'title'    => __('Inner Earth', 'infinity'),
            'sphere'   => __('Geosphere', 'infinity'),
            'tagline'  => __('Live earthquakes sending seismic waves across a true-radius Earth, with the planet\'s structure and electrical conductivity drawn from the published models.', 'infinity'),
            'measures' => array(
                __('Live USGS earthquakes at true depth', 'infinity'),
                __('52 tectonic plates and subducting slabs', 'infinity'),
                __('PREM structure and the geoelectric field', 'infinity'),
            ),
            'loop'     => __('The slow foundation. Plates feed the volcanoes that vent carbon, and the crust rebounds and shifts as the ice above it melts.', 'infinity'),
            'icon'     => 'core',
            'accent'   => '#f97316',
            'path'     => 'earth-interior.html',
        ),
        'glacier-watch' => array(
            'title'    => __('Glacier Watch', 'infinity'),
            'sphere'   => __('Cryosphere', 'infinity'),
            'tagline'  => __('48 of the best-studied glaciers on Earth, tracked from orbit every few days and set against their own seasons and four decades of record.', 'infinity'),
            'measures' => array(
                __('Ice velocity from NASA ITS_LIVE image pairs', 'infinity'),
                __('Field mass balance and river gauges', 'infinity'),
                __('Daily weather at glacier altitude', 'infinity'),
            ),
            'loop'     => __('The amplifier. Bright ice reflects sunlight; as it shrinks, darker ground soaks up more heat and the melt speeds up.', 'infinity'),
            'icon'     => 'glacier',
            'accent'   => '#38bdf8',
            'path'     => 'glacier-watch.html',
        ),
        'pollution-lab' => array(
            'title'    => __('Pollution Lab', 'infinity'),
            'sphere'   => __('Atmosphere', 'infinity'),
            'tagline'  => __('Live PM2.5 over about 105 cities, machine-learning hotspot detection, wind-driven transport and an aerosol climate-forcing estimate with every constant disclosed.', 'infinity'),
            'measures' => array(
                __('Live CAMS air quality, hour by hour', 'infinity'),
                __('k-means pollution hotspots', 'infinity'),
                __('Aerosol radiative forcing', 'infinity'),
            ),
            'loop'     => __('The forcing and the mask. What we emit warms the planet, while the haze we breathe reflects sunlight and hides part of that warming.', 'infinity'),
            'icon'     => 'smoke',
            'accent'   => '#a3e635',
            'path'     => 'pollution.html',
        ),
        // The next destination after the trio ([parkers_next]): the
        // whole planet on one globe
        'earthview' => array(
            'title'    => __('EarthView', 'infinity'),
            'sphere'   => __('The whole planet', 'infinity'),
            'tagline'  => __('Live weather, aurora odds, ISS passes and this week\'s best night for your location, on a 3D Earth wrapped in its magnetosphere and the solar wind.', 'infinity'),
            'measures' => array(
                __('Global weather and storm fronts', 'infinity'),
                __('Aurora odds from NOAA SWPC', 'infinity'),
                __('Magnetosphere and solar wind', 'infinity'),
            ),
            'loop'     => __('Where the layers meet: the air, the ice and the ground under one sky, and the space weather above it.', 'infinity'),
            'icon'     => 'earth',
            'accent'   => '#818cf8',
            'path'     => 'earth.html',
        ),
        // Not in the default trio; [parkers_sim id="volcanoes"] or
        // [parkers_sims ids="inner-earth,volcanoes,..."] brings it in
        'volcanoes' => array(
            'title'    => __('Earth Volcanoes', 'infinity'),
            'sphere'   => __('Geosphere to atmosphere', 'infinity'),
            'tagline'  => __('All 2,661 volcanoes in the Smithsonian GVP catalogue, with live eruption status, eruption odds and a Monte-Carlo of volcanic climate forcing.', 'infinity'),
            'measures' => array(
                __('Live eruption status', 'infinity'),
                __('Eruption probabilities', 'infinity'),
                __('Volcanic forcing, Monte-Carlo', 'infinity'),
            ),
            'loop'     => __('Where the inside of the planet reaches the sky: carbon dioxide that warms, sulfate that cools for a year or two.', 'infinity'),
            'icon'     => 'spark',
            'accent'   => '#ef4444',
            'path'     => 'volcanoes.html',
        ),
    );

    $base = trailingslashit(get_option('infinity_parkers_url', 'https://parkersphysics.com'));
    foreach ($sims as $id => &$sim) {
        $sim['id']     = $id;
        $custom        = get_option('infinity_sim_' . str_replace('-', '_', $id) . '_url', '');
        $sim['url']    = $custom ? $custom : $base . $sim['path'];
        $sim['poster'] = get_option('infinity_sim_' . str_replace('-', '_', $id) . '_poster', '');
        // Screenshots of the live pages bundled with the theme
        // (assets/img/sims/<id>.webp), used when nothing else is set
        $sim['bundled'] = file_exists(INFINITY_DIR . '/assets/img/sims/' . $id . '.webp') ? INFINITY_URI . '/assets/img/sims/' . $id . '.webp' : '';
    }
    unset($sim);

    return apply_filters('infinity_living_earth_sims', $sims);
}

/**
 * The ids shown by default in [parkers_sims] and the loop diagram.
 */
function infinity_living_earth_trio() {
    return apply_filters('infinity_living_earth_trio', array('inner-earth', 'glacier-watch', 'pollution-lab'));
}

/**
 * Look up one simulation, or null.
 */
function infinity_living_earth_sim($id) {
    $sims = infinity_living_earth_sims();
    $id   = sanitize_key($id);
    return isset($sims[$id]) ? $sims[$id] : null;
}

/**
 * Poster image for a card: shortcode attribute (attachment id or URL),
 * then the Customizer, then a media-library file named after the sim
 * (e.g. glacier-watch.jpg), then the screenshot bundled with the theme.
 * Empty means the drawn fallback art.
 */
function infinity_living_earth_poster($sim, $override = '') {
    if ($override) {
        if (ctype_digit((string) $override)) {
            $url = wp_get_attachment_image_url((int) $override, 'large');
            if ($url) {
                return $url;
            }
        } else {
            return esc_url_raw($override);
        }
    }
    if (!empty($sim['poster'])) {
        return $sim['poster'];
    }
    $found = function_exists('infinity_media_search_image') ? infinity_media_search_image($sim['id']) : '';
    return $found ? $found : (isset($sim['bundled']) ? $sim['bundled'] : '');
}

/**
 * Whether live embeds are allowed (Customizer). Parker's Physics sends
 * no frame-blocking headers today; the switch exists so embeds can be
 * turned off site-wide in one place if that ever changes.
 */
function infinity_living_earth_embeds_enabled() {
    return (bool) get_option('infinity_parkers_embed', 1);
}

/**
 * Outbound link + GA attributes for a sim.
 */
function infinity_living_earth_href($sim, $placement, $cta) {
    return function_exists('infinity_project_href') ? infinity_project_href($sim['url'], $placement, $cta) : $sim['url'];
}

function infinity_living_earth_link_attrs($placement, $cta) {
    if (function_exists('infinity_project_attrs')) {
        infinity_project_attrs('parkers', $placement, $cta);
    }
}

/**
 * Render one simulation card. Returns markup.
 *
 * @param array $sim  Registry entry.
 * @param array $args compact (bool), embed (bool), image, placement.
 */
function infinity_living_earth_card($sim, $args = array()) {
    $args = wp_parse_args($args, array(
        'compact'   => false,
        'embed'     => false,
        'image'     => '',
        'placement' => 'article',
    ));

    $placement = sanitize_key($args['placement']);
    $cta       = 'sim_' . str_replace('-', '_', $sim['id']);
    $href      = infinity_living_earth_href($sim, $placement, $cta);
    $poster    = infinity_living_earth_poster($sim, $args['image']);
    $embed     = $args['embed'] && infinity_living_earth_embeds_enabled();
    $classes   = 'pp-sim pp-sim--' . $sim['id'] . ($args['compact'] ? ' pp-sim--compact' : '');

    if ($embed) {
        // The embed script is only needed once a card offers it
        wp_enqueue_script('infinity-parkers-sims');
    }

    ob_start();
    ?>
    <figure class="<?php echo esc_attr($classes); ?>" style="--sim-accent: <?php echo esc_attr($sim['accent']); ?>" data-project="parkers" data-placement="<?php echo esc_attr($placement); ?>" data-cta="<?php echo esc_attr($cta); ?>" data-project-block="parkers">
        <div class="pp-sim-stage"<?php if ($embed) : ?> data-sim-embed="<?php echo esc_url($sim['url']); ?>" data-sim-title="<?php echo esc_attr($sim['title']); ?>"<?php endif; ?>>
            <?php
            // The picture links back to the live page too. The title and
            // the button already give keyboard and screen-reader users
            // that link, so this one stays out of the tab order.
            ?>
            <a class="pp-sim-stage-link" href="<?php echo esc_url(infinity_living_earth_href($sim, $placement, $cta . '_image')); ?>" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true"<?php infinity_living_earth_link_attrs($placement, $cta . '_image'); ?>>
                <?php if ($poster) : ?>
                    <img class="pp-sim-poster" src="<?php echo esc_url($poster); ?>" alt="" width="1280" height="800" loading="lazy" decoding="async">
                <?php else : ?>
                    <span class="pp-sim-art"><?php infinity_icon($sim['icon'], 64); ?></span>
                <?php endif; ?>
            </a>
            <span class="pp-sim-live"><span class="pp-sim-live-dot" aria-hidden="true"></span><?php esc_html_e('Live data', 'infinity'); ?></span>
            <?php if ($embed) : ?>
                <button type="button" class="pp-sim-run">
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.6v14.8L19.4 12z" fill="currentColor"/></svg>
                    <?php
                    /* translators: %s: simulation name */
                    printf(esc_html__('Run %s here', 'infinity'), esc_html($sim['title']));
                    ?>
                </button>
            <?php endif; ?>
        </div>
        <figcaption class="pp-sim-body">
            <p class="pp-sim-kicker"><?php echo esc_html($sim['sphere']); ?> <span aria-hidden="true">·</span> <?php esc_html_e("Parker's Physics", 'infinity'); ?></p>
            <p class="pp-sim-title"><a href="<?php echo esc_url($href); ?>" target="_blank" rel="noopener"<?php infinity_living_earth_link_attrs($placement, $cta); ?>><?php echo esc_html($sim['title']); ?></a></p>
            <p class="pp-sim-tagline"><?php echo esc_html($sim['tagline']); ?></p>
            <?php if (!$args['compact']) : ?>
                <ul class="pp-sim-measures" aria-label="<?php esc_attr_e('What it measures', 'infinity'); ?>">
                    <?php foreach ($sim['measures'] as $m) : ?>
                        <li><?php echo esc_html($m); ?></li>
                    <?php endforeach; ?>
                </ul>
                <p class="pp-sim-loop"><strong><?php esc_html_e('In the loop:', 'infinity'); ?></strong> <?php echo esc_html($sim['loop']); ?></p>
            <?php endif; ?>
            <a class="pp-sim-cta" href="<?php echo esc_url($href); ?>" target="_blank" rel="noopener"<?php infinity_living_earth_link_attrs($placement, $cta); ?>>
                <?php
                /* translators: %s: simulation name */
                printf(esc_html__('Open %s', 'infinity'), esc_html($sim['title']));
                ?>
                <span aria-hidden="true">&rarr;</span>
            </a>
        </figcaption>
    </figure>
    <?php
    return trim(ob_get_clean());
}

/**
 * [parkers_sim id="glacier-watch" embed="1" image="123" placement="article"]
 */
function infinity_shortcode_parkers_sim($atts) {
    $atts = shortcode_atts(array(
        'id'        => 'glacier-watch',
        'embed'     => '0',
        'image'     => '',
        'compact'   => '0',
        'placement' => 'article',
    ), $atts, 'parkers_sim');

    $sim = infinity_living_earth_sim($atts['id']);
    if (!$sim) {
        return current_user_can('edit_posts')
            ? '<p class="pp-sim-error">' . esc_html(sprintf(__('Unknown simulation "%s". Try inner-earth, glacier-watch, pollution-lab, earthview or volcanoes.', 'infinity'), $atts['id'])) . '</p>'
            : '';
    }

    return infinity_living_earth_card($sim, array(
        'embed'     => wp_validate_boolean($atts['embed']),
        'compact'   => wp_validate_boolean($atts['compact']),
        'image'     => $atts['image'],
        'placement' => $atts['placement'],
    ));
}
add_shortcode('parkers_sim', 'infinity_shortcode_parkers_sim');

/**
 * The "next stop" banner: where to send a reader who has seen the
 * trio. EarthView by default, the whole planet on one live globe.
 */
function infinity_living_earth_next($id = 'earthview', $args = array()) {
    $sim = infinity_living_earth_sim($id);
    if (!$sim) {
        return '';
    }
    $args = wp_parse_args($args, array(
        'title'     => __('Next stop: the whole planet at once', 'infinity'),
        'text'      => '',
        'placement' => 'article_next',
    ));
    $placement = sanitize_key($args['placement']);
    $cta       = 'next_' . str_replace('-', '_', $sim['id']);
    $href      = infinity_living_earth_href($sim, $placement, $cta);
    $poster    = infinity_living_earth_poster($sim);
    $text      = $args['text'] ? $args['text'] : $sim['tagline'];

    ob_start();
    ?>
    <aside class="pp-next" style="--sim-accent: <?php echo esc_attr($sim['accent']); ?>" aria-label="<?php echo esc_attr($args['title']); ?>" data-project="parkers" data-placement="<?php echo esc_attr($placement); ?>" data-cta="<?php echo esc_attr($cta); ?>" data-project-block="parkers">
        <a class="pp-next-media" href="<?php echo esc_url($href); ?>" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true"<?php infinity_living_earth_link_attrs($placement, $cta . '_image'); ?>>
            <?php if ($poster) : ?>
                <img src="<?php echo esc_url($poster); ?>" alt="" width="1280" height="800" loading="lazy" decoding="async">
            <?php else : ?>
                <span class="pp-sim-art"><?php infinity_icon($sim['icon'], 64); ?></span>
            <?php endif; ?>
        </a>
        <div class="pp-next-body">
            <p class="pp-next-kicker"><?php echo esc_html($args['title']); ?></p>
            <p class="pp-next-title"><a href="<?php echo esc_url($href); ?>" target="_blank" rel="noopener"<?php infinity_living_earth_link_attrs($placement, $cta); ?>><?php echo esc_html($sim['title']); ?></a></p>
            <p class="pp-next-text"><?php echo esc_html($text); ?></p>
            <a class="pp-sim-cta" href="<?php echo esc_url($href); ?>" target="_blank" rel="noopener"<?php infinity_living_earth_link_attrs($placement, $cta); ?>>
                <?php
                /* translators: %s: simulation name */
                printf(esc_html__('Go to %s', 'infinity'), esc_html($sim['title']));
                ?>
                <span aria-hidden="true">&rarr;</span>
            </a>
        </div>
    </aside>
    <?php
    return trim(ob_get_clean());
}

/**
 * [parkers_next id="earthview" title="..." text="..."]
 */
function infinity_shortcode_parkers_next($atts) {
    $atts = shortcode_atts(array(
        'id'        => 'earthview',
        'title'     => __('Next stop: the whole planet at once', 'infinity'),
        'text'      => '',
        'placement' => 'article_next',
    ), $atts, 'parkers_next');
    return infinity_living_earth_next($atts['id'], $atts);
}
add_shortcode('parkers_next', 'infinity_shortcode_parkers_next');

/**
 * [parkers_sims ids="inner-earth,glacier-watch,pollution-lab" title="..."]
 */
function infinity_shortcode_parkers_sims($atts) {
    $atts = shortcode_atts(array(
        'ids'       => implode(',', infinity_living_earth_trio()),
        'title'     => __('Watch the Earth change, live', 'infinity'),
        'intro'     => __('Three free instruments on Parker\'s Physics, each reading a different layer of the planet from live data.', 'infinity'),
        'placement' => 'article_band',
        'next'      => 'earthview',
    ), $atts, 'parkers_sims');

    $cards = array();
    foreach (array_filter(array_map('trim', explode(',', $atts['ids']))) as $id) {
        $sim = infinity_living_earth_sim($id);
        if ($sim) {
            $cards[] = infinity_living_earth_card($sim, array('compact' => true, 'placement' => $atts['placement']));
        }
    }
    if (!$cards) {
        return '';
    }

    // "Browse every simulation" stays on this site when the hub page
    // exists (inc/parkers-hub.php); otherwise it goes to the catalog on
    // Parker's Physics
    $hub = function_exists('infinity_parkers_hub_url') ? infinity_parkers_hub_url() : '';
    if ($hub && function_exists('infinity_is_parkers_hub') && infinity_is_parkers_hub()) {
        $hub = ''; // already on the hub: link out to Parker's Physics
    }
    if ($hub) {
        $all = $hub . '#pph-catalog';
    } else {
        $urls = function_exists('infinity_property_urls') ? infinity_property_urls() : array('parkers' => 'https://parkersphysics.com');
        $all  = trailingslashit($urls['parkers']) . 'simulations.html';
        $all  = function_exists('infinity_project_href') ? infinity_project_href($all, sanitize_key($atts['placement']), 'all_sims') : $all;
    }

    ob_start();
    ?>
    <aside class="pp-sims" aria-label="<?php echo esc_attr($atts['title']); ?>" data-project="parkers" data-placement="<?php echo esc_attr(sanitize_key($atts['placement'])); ?>">
        <div class="pp-sims-head">
            <span class="pp-sims-mark" aria-hidden="true"><?php if (function_exists('infinity_brand_mark')) { infinity_brand_mark('parkers', 34); } ?></span>
            <div>
                <p class="pp-sims-title"><?php echo esc_html($atts['title']); ?></p>
                <?php if ($atts['intro']) : ?><p class="pp-sims-intro"><?php echo esc_html($atts['intro']); ?></p><?php endif; ?>
            </div>
        </div>
        <div class="pp-sims-grid"><?php echo implode('', $cards); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped in infinity_living_earth_card() ?></div>
        <?php
        if ($atts['next']) {
            echo infinity_living_earth_next($atts['next'], array('placement' => sanitize_key($atts['placement']))); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped in infinity_living_earth_next()
        }
        ?>
        <a class="pp-sims-all" href="<?php echo esc_url($all); ?>"<?php if (!$hub) : ?> target="_blank" rel="noopener"<?php infinity_living_earth_link_attrs(sanitize_key($atts['placement']), 'all_sims'); endif; ?>><?php esc_html_e('Browse every Parker\'s Physics simulation', 'infinity'); ?> <span aria-hidden="true">&rarr;</span></a>
    </aside>
    <?php
    return trim(ob_get_clean());
}
add_shortcode('parkers_sims', 'infinity_shortcode_parkers_sims');

/**
 * The links in the climate loop, drawn between the three spheres.
 *
 * kind: drives (a push from one layer into another), amplifies
 * (a positive feedback: the change feeds itself), steadies (a negative
 * feedback: the change pushes back on itself). "where" names the sims
 * in which each link can be watched.
 */
function infinity_climate_loop_links() {
    return apply_filters('infinity_climate_loop_links', array(
        array(
            'kind'  => 'drives',
            'title' => __('Volcanoes vent the inside of the planet', 'infinity'),
            'text'  => __('Plate boundaries feed volcanoes that release carbon dioxide, which warms over centuries, and sulfur dioxide, which forms a haze that cools for a year or two.', 'infinity'),
            'where' => array('inner-earth', 'volcanoes'),
        ),
        array(
            'kind'  => 'drives',
            'title' => __('Warm, dirty air reaches the ice', 'infinity'),
            'text'  => __('Warmer air speeds the melt, and soot carried downwind settles on the ice and darkens it.', 'infinity'),
            'where' => array('pollution-lab', 'glacier-watch'),
        ),
        array(
            'kind'  => 'amplifies',
            'title' => __('Ice–albedo feedback', 'infinity'),
            'text'  => __('Fresh snow reflects most of the sunlight that hits it; bare ice and rock reflect far less. Every retreat leaves a darker surface that absorbs more heat, so the melt speeds itself up.', 'infinity'),
            'where' => array('glacier-watch'),
        ),
        array(
            'kind'  => 'drives',
            'title' => __('The crust rebounds', 'infinity'),
            'text'  => __('As ice thins, the land beneath it rises. In southeast Alaska it is rising by up to about 3 cm a year, among the fastest uplift measured anywhere, and the changing load can nudge faults.', 'infinity'),
            'where' => array('glacier-watch', 'inner-earth'),
        ),
        array(
            'kind'  => 'steadies',
            'title' => __('The aerosol mask', 'infinity'),
            'text'  => __('Sulfate haze reflects sunlight back to space and cools the surface, hiding part of the greenhouse warming. Clean the air and the mask comes off.', 'infinity'),
            'where' => array('pollution-lab'),
        ),
    ));
}

/**
 * Inner markup of an icon, for drawing inside the diagram's own SVG.
 */
function infinity_climate_loop_icon($name) {
    $paths = infinity_icon_paths();
    return isset($paths[$name]) ? $paths[$name] : $paths['spark'];
}

/**
 * [climate_loop title="..." placement="article_loop"]
 */
function infinity_shortcode_climate_loop($atts) {
    static $instance = 0;
    $instance++;

    $atts = shortcode_atts(array(
        'title'     => __('Earth\'s climate is a feedback loop', 'infinity'),
        'caption'   => __('Each arrow is a link you can watch in live data. Numbers match the list below.', 'infinity'),
        'placement' => 'article_loop',
    ), $atts, 'climate_loop');

    $p     = sanitize_key($atts['placement']);
    $uid   = 'cl' . $instance;
    $links = infinity_climate_loop_links();

    $atmo    = infinity_living_earth_sim('pollution-lab');
    $ice     = infinity_living_earth_sim('glacier-watch');
    $ground  = infinity_living_earth_sim('inner-earth');
    if (!$atmo || !$ice || !$ground) {
        return '';
    }

    // Node positions in a 640 x 470 box: atmosphere on top, solid
    // Earth bottom left, ice bottom right
    $nodes = array(
        array('sim' => $atmo,   'x' => 320, 'y' => 124, 'label_x' => 382, 'label_y' => 108, 'anchor' => 'start'),
        array('sim' => $ground, 'x' => 120, 'y' => 360, 'label_x' => 120, 'label_y' => 436, 'anchor' => 'middle'),
        array('sim' => $ice,    'x' => 520, 'y' => 360, 'label_x' => 520, 'label_y' => 436, 'anchor' => 'middle'),
    );

    // Edge geometry, in the same order as infinity_climate_loop_links():
    // path, then the badge position (the curve's midpoint)
    $edges = array(
        array('M150 322Q180 204 278 144', 197, 218),  // ground -> atmosphere
        array('M362 144Q460 204 490 322', 443, 218),  // atmosphere -> ice
        array('M478 342Q410 272 352 164', 412, 262),  // ice -> atmosphere
        array('M474 380Q320 444 166 380', 320, 412),  // ice -> ground
        array('M300 80C268 12 372 12 340 80', 320, 29), // atmosphere -> itself
    );

    $kinds = array(
        'drives'    => __('drives', 'infinity'),
        'amplifies' => __('amplifies (+)', 'infinity'),
        'steadies'  => __('steadies (−)', 'infinity'),
    );

    ob_start();
    ?>
    <figure class="climate-loop" data-project="parkers" data-placement="<?php echo esc_attr($p); ?>" data-project-block="parkers">
        <p class="climate-loop-title"><?php echo esc_html($atts['title']); ?></p>
        <svg class="climate-loop-svg" viewBox="0 0 640 470" role="img" aria-labelledby="<?php echo esc_attr($uid); ?>-t <?php echo esc_attr($uid); ?>-d">
            <title id="<?php echo esc_attr($uid); ?>-t"><?php echo esc_html($atts['title']); ?></title>
            <desc id="<?php echo esc_attr($uid); ?>-d"><?php esc_html_e('Three linked layers of the Earth system: the atmosphere (Pollution Lab), the solid Earth (Inner Earth) and the ice (Glacier Watch), joined by five numbered arrows described in the list that follows.', 'infinity'); ?></desc>
            <defs>
                <linearGradient id="<?php echo esc_attr($uid); ?>-g" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#67e8f9"/><stop offset="0.55" stop-color="#818cf8"/><stop offset="1" stop-color="#c084fc"/></linearGradient>
                <?php foreach (array_keys($kinds) as $k) : ?>
                    <marker id="<?php echo esc_attr($uid . '-m-' . $k); ?>" class="cl-head cl-<?php echo esc_attr($k); ?>" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker>
                <?php endforeach; ?>
            </defs>

            <?php foreach ($edges as $i => $e) : $kind = isset($links[$i]) ? $links[$i]['kind'] : 'drives'; ?>
                <path class="cl-edge cl-<?php echo esc_attr($kind); ?>" d="<?php echo esc_attr($e[0]); ?>" marker-end="url(#<?php echo esc_attr($uid . '-m-' . $kind); ?>)"/>
            <?php endforeach; ?>

            <?php foreach ($nodes as $n) : $s = $n['sim']; $cta = 'loop_' . str_replace('-', '_', $s['id']); ?>
                <a class="cl-node" href="<?php echo esc_url(infinity_living_earth_href($s, $p, $cta)); ?>" target="_blank" rel="noopener" aria-label="<?php echo esc_attr(sprintf(__('Open %s on Parker\'s Physics', 'infinity'), $s['title'])); ?>" style="--sim-accent: <?php echo esc_attr($s['accent']); ?>"<?php infinity_living_earth_link_attrs($p, $cta); ?>>
                    <circle class="cl-node-ring" cx="<?php echo (int) $n['x']; ?>" cy="<?php echo (int) $n['y']; ?>" r="46"/>
                    <g transform="translate(<?php echo (int) $n['x'] - 20; ?> <?php echo (int) $n['y'] - 20; ?>) scale(1.6667)" fill="none" stroke="url(#<?php echo esc_attr($uid); ?>-g)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                        <?php echo infinity_climate_loop_icon($s['icon']); // phpcs:ignore WordPress.Security.EscapeOutput -- static markup from infinity_icon_paths() ?>
                    </g>
                    <text class="cl-node-label" x="<?php echo (int) $n['label_x']; ?>" y="<?php echo (int) $n['label_y']; ?>" text-anchor="<?php echo esc_attr($n['anchor']); ?>"><?php echo esc_html($s['title']); ?></text>
                    <text class="cl-node-sphere" x="<?php echo (int) $n['label_x']; ?>" y="<?php echo (int) $n['label_y'] + 20; ?>" text-anchor="<?php echo esc_attr($n['anchor']); ?>"><?php echo esc_html(strtoupper($s['sphere'])); ?></text>
                </a>
            <?php endforeach; ?>

            <?php foreach ($edges as $i => $e) : $kind = isset($links[$i]) ? $links[$i]['kind'] : 'drives'; ?>
                <g class="cl-badge cl-<?php echo esc_attr($kind); ?>" aria-hidden="true">
                    <circle cx="<?php echo (int) $e[1]; ?>" cy="<?php echo (int) $e[2]; ?>" r="13"/>
                    <text x="<?php echo (int) $e[1]; ?>" y="<?php echo (int) $e[2] + 5; ?>" text-anchor="middle"><?php echo (int) ($i + 1); ?></text>
                </g>
            <?php endforeach; ?>
        </svg>

        <figcaption class="climate-loop-caption">
            <p class="climate-loop-key">
                <?php echo esc_html($atts['caption']); ?>
                <span class="cl-key cl-drives"><?php echo esc_html($kinds['drives']); ?></span>
                <span class="cl-key cl-amplifies"><?php echo esc_html($kinds['amplifies']); ?></span>
                <span class="cl-key cl-steadies"><?php echo esc_html($kinds['steadies']); ?></span>
            </p>
            <ol class="climate-loop-links">
                <?php foreach ($links as $i => $l) : ?>
                    <li class="cl-<?php echo esc_attr($l['kind']); ?>">
                        <strong><?php echo esc_html($l['title']); ?></strong>
                        <span class="cl-kind"><?php echo esc_html(isset($kinds[$l['kind']]) ? $kinds[$l['kind']] : $l['kind']); ?></span>
                        <?php echo esc_html($l['text']); ?>
                        <?php
                        $where = array();
                        foreach ((array) $l['where'] as $wid) {
                            $ws = infinity_living_earth_sim($wid);
                            if ($ws) {
                                $wcta    = 'loop_link_' . str_replace('-', '_', $wid);
                                $where[] = sprintf(
                                    '<a href="%1$s" target="_blank" rel="noopener" data-project="parkers" data-placement="%2$s" data-cta="%3$s" data-rum="%4$s">%5$s</a>',
                                    esc_url(infinity_living_earth_href($ws, $p, $wcta)),
                                    esc_attr($p),
                                    esc_attr($wcta),
                                    esc_attr($p . ':parkers:' . $wcta),
                                    esc_html($ws['title'])
                                );
                            }
                        }
                        if ($where) {
                            /* translators: %s: list of simulation links */
                            echo '<span class="cl-where">' . sprintf(esc_html__('Watch it in %s.', 'infinity'), implode(esc_html__(' and ', 'infinity'), $where)) . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput -- built from escaped parts above
                        }
                        ?>
                    </li>
                <?php endforeach; ?>
            </ol>
        </figcaption>
    </figure>
    <?php
    return trim(ob_get_clean());
}
add_shortcode('climate_loop', 'infinity_shortcode_climate_loop');

/**
 * Which Living Earth sims a post's content refers to (by shortcode).
 */
function infinity_living_earth_sims_in($content) {
    $ids = array();
    if (!$content || false === strpos($content, '[')) {
        return $ids;
    }
    if (has_shortcode($content, 'climate_loop')) {
        $ids = array_merge($ids, array('pollution-lab', 'glacier-watch', 'inner-earth'));
    }
    if (has_shortcode($content, 'parkers_sims')) {
        $ids = array_merge($ids, infinity_living_earth_trio());
        if (preg_match_all('/\[parkers_sims[^\]]*\bids="([^"]+)"/', $content, $m)) {
            foreach ($m[1] as $list) {
                $ids = array_merge($ids, array_map('trim', explode(',', $list)));
            }
        }
    }
    if (has_shortcode($content, 'parkers_next')) {
        $ids[] = 'earthview';
        if (preg_match_all('/\[parkers_next[^\]]*\bid="([^"]+)"/', $content, $m)) {
            $ids = array_merge($ids, $m[1]);
        }
    }
    if (has_shortcode($content, 'parkers_sims') && false === strpos($content, 'next=""')) {
        $ids[] = 'earthview';
    }
    if (preg_match_all('/\[parkers_sim\b[^\]]*?\bid="([^"]+)"/', $content, $m)) {
        $ids = array_merge($ids, $m[1]);
    } elseif (has_shortcode($content, 'parkers_sim')) {
        $ids[] = 'glacier-watch';
    }
    return array_values(array_unique(array_map('sanitize_key', $ids)));
}

/**
 * Load the stylesheet only where the shortcodes are used.
 */
function infinity_living_earth_assets() {
    wp_register_script(
        'infinity-parkers-sims',
        INFINITY_URI . '/assets/js/parkers-sims.js',
        array(),
        INFINITY_VERSION,
        array('in_footer' => true, 'strategy' => 'defer')
    );

    if (!is_singular()) {
        return;
    }
    $post = get_post();
    if (!$post || !infinity_living_earth_sims_in($post->post_content)) {
        return;
    }
    wp_enqueue_style('infinity-parkers-sims', infinity_css_url('assets/css/parkers-sims.css'), array('infinity-style'), INFINITY_VERSION);
}
add_action('wp_enqueue_scripts', 'infinity_living_earth_assets', 20);

/**
 * schema.org: the simulations an article features, as WebApplications.
 * Read by infinity_seo_json_ld() in functions.php.
 */
function infinity_living_earth_schema_mentions($post = null) {
    $post = get_post($post);
    if (!$post) {
        return array();
    }
    $out = array();
    foreach (infinity_living_earth_sims_in($post->post_content) as $id) {
        $sim = infinity_living_earth_sim($id);
        if (!$sim) {
            continue;
        }
        $out[] = array(
            '@type'               => 'WebApplication',
            'name'                => $sim['title'] . " · Parker's Physics",
            'url'                 => $sim['url'],
            'description'         => $sim['tagline'],
            'applicationCategory' => 'EducationalApplication',
            'operatingSystem'     => 'Any (web browser)',
            'isAccessibleForFree' => true,
            'offers'              => array('@type' => 'Offer', 'price' => '0', 'priceCurrency' => 'USD'),
            'publisher'           => array('@type' => 'Organization', 'name' => "Parker's Physics", 'url' => trailingslashit(get_option('infinity_parkers_url', 'https://parkersphysics.com'))),
        );
    }
    return $out;
}

/**
 * Customizer: URLs, posters and the embed switch.
 */
function infinity_living_earth_customize_register($wp_customize) {
    $wp_customize->add_section('infinity_living_earth', array(
        'title'       => esc_html__('Living Earth Simulations', 'infinity'),
        'description' => esc_html__("Parker's Physics simulations used by the [parkers_sim], [parkers_sims] and [climate_loop] shortcodes. Leave a URL empty to use the page on the Parker's Physics URL set under Steam Promotion.", 'infinity'),
        'priority'    => 36,
    ));

    $wp_customize->add_setting('infinity_parkers_embed', array(
        'type'              => 'option',
        'default'           => 1,
        'sanitize_callback' => 'absint',
    ));
    $wp_customize->add_control('infinity_parkers_embed', array(
        'label'       => esc_html__('Allow "Run it here" live embeds', 'infinity'),
        'description' => esc_html__('Cards written with embed="1" offer to run the simulation inside the article. Turn off to make every card link out instead.', 'infinity'),
        'section'     => 'infinity_living_earth',
        'type'        => 'checkbox',
    ));

    foreach (infinity_living_earth_sims() as $id => $sim) {
        $key = 'infinity_sim_' . str_replace('-', '_', $id);

        $wp_customize->add_setting($key . '_url', array(
            'type'              => 'option',
            'default'           => '',
            'sanitize_callback' => 'esc_url_raw',
        ));
        $wp_customize->add_control($key . '_url', array(
            /* translators: %s: simulation name */
            'label'       => sprintf(esc_html__('%s URL', 'infinity'), $sim['title']),
            'description' => esc_html($sim['url']),
            'section'     => 'infinity_living_earth',
            'type'        => 'url',
        ));

        $wp_customize->add_setting($key . '_poster', array(
            'type'              => 'option',
            'default'           => '',
            'sanitize_callback' => 'esc_url_raw',
        ));
        $wp_customize->add_control(new WP_Customize_Image_Control($wp_customize, $key . '_poster', array(
            /* translators: %s: simulation name */
            'label'       => sprintf(esc_html__('%s card image', 'infinity'), $sim['title']),
            /* translators: %s: media file name */
            'description' => sprintf(esc_html__('Or upload a media file named %s.jpg. Without one the card draws its icon.', 'infinity'), $id),
            'section'     => 'infinity_living_earth',
        )));
    }
}
add_action('customize_register', 'infinity_living_earth_customize_register');
