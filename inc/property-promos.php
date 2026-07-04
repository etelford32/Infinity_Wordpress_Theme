<?php
/**
 * Property promo cards & widgets
 *
 * Shared renderers for the three external properties —
 * Explore the Universe 2175, Parker's Physics, and Telford
 * Landscaping — plus WordPress widgets wrapping each card so they
 * can be placed in any widget area from Appearance → Widgets.
 *
 * @package Infinity
 * @since 1.2.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * URLs for the property family, filterable in one place.
 */
function infinity_property_urls() {
    $steam = get_option('infinity_steam_url', 'https://store.steampowered.com/app/4094340/Explore_the_Universe_2175/');

    // UTM tags so clicks appear in Steamworks traffic analytics
    $steam = add_query_arg(array(
        'utm_source'   => 'elliottelford.com',
        'utm_medium'   => 'website',
        'utm_campaign' => 'site_cta',
    ), $steam);

    return apply_filters('infinity_property_urls', array(
        'steam'       => $steam,
        'etu'         => get_option('infinity_etu_site_url', 'https://exploretheuniverse2175.com'),
        'parkers'     => get_option('infinity_parkers_url', 'https://parkersphysics.com'),
        'landscaping' => get_option('infinity_landscaping_url', 'https://telfordlandscaping.com'),
    ));
}

/**
 * Logo URL for a property: the Customizer-uploaded logo when set,
 * otherwise the site's favicon via Google's resolver (works for
 * virtually every live site; cards fall back to a monogram if even
 * that fails to load).
 */
function infinity_property_logo_url($key, $site_url) {
    $custom = get_option('infinity_' . $key . '_logo', '');
    if ($custom) {
        return $custom;
    }
    $host = wp_parse_url($site_url, PHP_URL_HOST);
    return $host ? 'https://www.google.com/s2/favicons?domain=' . rawurlencode($host) . '&sz=128' : '';
}

/**
 * ETU teaser video: Customizer URL wins; otherwise auto-detect the
 * newest video in the media library whose name starts with ETU_Vid
 * (e.g. ETU_Vid1.mp4 uploaded to the media folder).
 */
function infinity_etu_video_url() {
    $custom = get_option('infinity_etu_video', '');
    if ($custom) {
        return $custom;
    }

    $cached = get_transient('infinity_etu_video_url');
    if (false !== $cached) {
        return $cached;
    }

    $found = get_posts(array(
        'post_type'      => 'attachment',
        'post_status'    => 'inherit',
        'post_mime_type' => 'video',
        's'              => 'ETU_Vid',
        'orderby'        => 'date',
        'order'          => 'DESC',
        'posts_per_page' => 1,
        'fields'         => 'ids',
    ));

    $url = $found ? (string) wp_get_attachment_url($found[0]) : '';
    set_transient('infinity_etu_video_url', $url, 6 * HOUR_IN_SECONDS);
    return $url;
}

// New uploads should be picked up promptly
function infinity_clear_etu_video_cache() {
    delete_transient('infinity_etu_video_url');
    delete_transient('infinity_media_img_parkersphysics');
    delete_transient('infinity_media_img_parkers');
}
add_action('add_attachment', 'infinity_clear_etu_video_cache');

/**
 * Find an image in the media library by name fragment (cached).
 */
function infinity_media_search_image($needle) {
    $key    = 'infinity_media_img_' . sanitize_key($needle);
    $cached = get_transient($key);
    if (false !== $cached) {
        return $cached;
    }

    $found = get_posts(array(
        'post_type'      => 'attachment',
        'post_status'    => 'inherit',
        'post_mime_type' => 'image',
        's'              => $needle,
        'orderby'        => 'date',
        'order'          => 'DESC',
        'posts_per_page' => 1,
        'fields'         => 'ids',
    ));

    $url = $found ? (string) wp_get_attachment_image_url($found[0], 'large') : '';
    set_transient($key, $url, 6 * HOUR_IN_SECONDS);
    return $url;
}

/**
 * The Parker's Physics logo, best available source: Customizer
 * upload, else auto-detected from the media library, else empty.
 */
function infinity_parkers_logo_big() {
    $custom = get_option('infinity_parkers_logo', '');
    if ($custom) {
        return $custom;
    }
    $url = infinity_media_search_image('parkersphysics');
    if (!$url) {
        $url = infinity_media_search_image('parkers');
    }
    return $url;
}

/**
 * Feature highlight lists for the property bands. Stored as editable
 * "Label|Description|URL" lines in the Customizer; defaults reflect
 * each site's real navigation and fall back to the site root.
 */
function infinity_property_features($key) {
    $urls = infinity_property_urls();

    $defaults = array(
        'parkers' => array(
            array('earth', 'Real-Time Earth Weather', 'A live planetary weather simulation with predictive analytics', $urls['parkers'], 'LIVE'),
            array('aurora', 'The Auroracle', 'Aurora forecasts before the sky knows', trailingslashit($urls['parkers']) . 'auroracle.html', 'NEW'),
            array('satellite', 'LEO Drag Forecasts', 'Space-weather forecasts that hold up during the storm', $urls['parkers'], 'LIVE'),
            array('orbit', 'Solar System Live', 'Every planet exactly where it really is, right now', $urls['parkers'], 'SOON'),
            array('planner', 'Mission Planner', 'Plot real transfers across the real solar system', $urls['parkers'], 'SOON'),
            array('ship', 'Satellite & Ship Designer', 'Build it, fly it, watch physics judge it', $urls['parkers'], 'SOON'),
        ),
        'landscaping' => array(
            array('palette', 'Design Studio', 'Live 3D preview of your yard', $urls['landscaping'], ''),
            array('tree', '30-Year Growth Sim', 'See your yard in 2055 — watch plants mature', $urls['landscaping'], ''),
            array('leaf', 'Plant Library', '60+ California species, curated', $urls['landscaping'], ''),
            array('wall', 'Hardscape Tools', 'Patios, walls, and structures that outlast us', $urls['landscaping'], ''),
            array('clipboard', 'Request a Consultation', 'Estate-scale design-build, Sacramento foothills', $urls['landscaping'], ''),
        ),
    );

    $stored = trim((string) get_option('infinity_' . $key . '_features', ''));
    if ('' === $stored) {
        return isset($defaults[$key]) ? $defaults[$key] : array();
    }

    $features = array();
    foreach (explode("\n", $stored) as $line) {
        $parts = array_map('trim', explode('|', $line));
        if (count($parts) >= 4) {
            $features[] = array($parts[0], $parts[1], $parts[2], $parts[3], isset($parts[4]) ? $parts[4] : '');
        } elseif (count($parts) === 3) {
            $features[] = array('spark', $parts[0], $parts[1], $parts[2], '');
        }
    }
    return $features;
}

/**
 * Render a band feature grid.
 */
function infinity_render_feature_grid($key, $aria_label) {
    $features = infinity_property_features($key);
    if (!$features) {
        return;
    }
    ?>
    <nav class="band-features" aria-label="<?php echo esc_attr($aria_label); ?>">
        <?php foreach ($features as $f) : $badge = isset($f[4]) ? strtoupper($f[4]) : ''; ?>
            <a class="band-feature" href="<?php echo esc_url($f[3]); ?>" target="_blank" rel="noopener">
                <span class="band-feature-icon" aria-hidden="true"><?php
                if (function_exists('infinity_is_icon_token') && infinity_is_icon_token($f[0])) {
                    infinity_icon($f[0]);
                } else {
                    echo esc_html($f[0]);
                }
                ?></span>
                <span class="band-feature-text">
                    <span class="band-feature-label"><?php echo esc_html($f[1]); ?><?php if ($badge) : ?><span class="band-feature-badge band-feature-badge-<?php echo esc_attr(strtolower($badge)); ?>"><?php echo esc_html($badge); ?></span><?php endif; ?></span>
                    <span class="band-feature-desc"><?php echo esc_html($f[2]); ?></span>
                </span>
            </a>
        <?php endforeach; ?>
    </nav>
    <?php
}

/**
 * Steam app id parsed from the configured store URL (for the widget).
 */
function infinity_steam_app_id() {
    $url = get_option('infinity_steam_url', 'https://store.steampowered.com/app/4094340/Explore_the_Universe_2175/');
    if (preg_match('#/app/(\d+)#', $url, $m)) {
        return $m[1];
    }
    return '';
}

/**
 * Explore the Universe 2175 promo card.
 */
function infinity_etu_promo_card() {
    $urls = infinity_property_urls();
    ?>
    <div class="promo-card promo-card-etu">
        <p class="promo-kicker"><?php esc_html_e('The Game', 'infinity'); ?></p>
        <div class="promo-title-row">
            <img class="promo-logo" src="<?php echo esc_url(infinity_property_logo_url('etu', $urls['etu'])); ?>" alt="" loading="lazy" decoding="async" onerror="this.remove();">
            <h3 class="promo-title"><?php esc_html_e('Explore the Universe 2175', 'infinity'); ?></h3>
        </div>
        <p class="promo-copy">
            <?php esc_html_e('Command your own ship in a living galaxy. The year is 2175 — the frontier is open, and the first wave of pilots is signing up now.', 'infinity'); ?>
        </p>
        <a class="promo-btn promo-btn-steam" href="<?php echo esc_url($urls['steam']); ?>" target="_blank" rel="noopener noreferrer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.6"/><circle cx="15.5" cy="8.5" r="3.1" fill="currentColor"/><circle cx="7.5" cy="16.5" r="2.1" fill="currentColor"/><path d="M9.2 15.1l4.1-4.1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
            <?php esc_html_e('Wishlist on Steam', 'infinity'); ?>
        </a>
        <a class="promo-btn promo-btn-outline" href="<?php echo esc_url($urls['etu']); ?>" target="_blank" rel="noopener">
            <?php esc_html_e('Sign up free — join the first wave', 'infinity'); ?>
        </a>
    </div>
    <?php
}

/**
 * Parker's Physics promo card.
 */
function infinity_parkers_promo_card() {
    $urls = infinity_property_urls();
    ?>
    <div class="promo-card promo-card-parkers">
        <p class="promo-kicker"><?php esc_html_e('The Sandbox', 'infinity'); ?></p>
        <div class="promo-title-row">
            <img class="promo-logo" src="<?php echo esc_url(infinity_property_logo_url('parkers', $urls['parkers'])); ?>" alt="" loading="lazy" decoding="async" onerror="this.remove();">
            <h3 class="promo-title"><?php esc_html_e("Parker's Physics", 'infinity'); ?></h3>
        </div>
        <p class="promo-copy">
            <?php esc_html_e('Real orbital mechanics you can bend with your hands. Spin up a solar system, break it, fix it, share it — no install, right in your browser.', 'infinity'); ?>
        </p>
        <a class="promo-btn promo-btn-primary" href="<?php echo esc_url($urls['parkers']); ?>" target="_blank" rel="noopener">
            <?php esc_html_e('Launch the simulation', 'infinity'); ?> &rarr;
        </a>
    </div>
    <?php
}

/**
 * Telford Landscaping promo card.
 */
function infinity_landscaping_promo_card() {
    $urls = infinity_property_urls();
    ?>
    <div class="promo-card promo-card-landscaping">
        <p class="promo-kicker"><?php esc_html_e('Off Screen', 'infinity'); ?></p>
        <div class="promo-title-row">
            <img class="promo-logo" src="<?php echo esc_url(infinity_property_logo_url('landscaping', $urls['landscaping'])); ?>" alt="" loading="lazy" decoding="async" onerror="this.remove();">
            <h3 class="promo-title"><?php esc_html_e('Telford Landscaping', 'infinity'); ?></h3>
        </div>
        <p class="promo-copy">
            <?php esc_html_e('Stone, soil, and honest work — the analog side of the operation.', 'infinity'); ?>
        </p>
        <a class="promo-btn promo-btn-outline" href="<?php echo esc_url($urls['landscaping']); ?>" target="_blank" rel="noopener">
            <?php esc_html_e('Visit TelfordLandscaping.com', 'infinity'); ?> &rarr;
        </a>
    </div>
    <?php
}

/**
 * Widget wrapper: shared base for the three property widgets.
 */
abstract class Infinity_Property_Widget extends WP_Widget {

    public function widget($args, $instance) {
        echo $args['before_widget'];
        if (!empty($instance['title'])) {
            echo $args['before_title'] . esc_html($instance['title']) . $args['after_title'];
        }
        $this->render_card();
        echo $args['after_widget'];
    }

    abstract protected function render_card();

    public function form($instance) {
        $title = isset($instance['title']) ? $instance['title'] : '';
        ?>
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('title')); ?>"><?php esc_html_e('Title (optional):', 'infinity'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('title')); ?>" name="<?php echo esc_attr($this->get_field_name('title')); ?>" type="text" value="<?php echo esc_attr($title); ?>">
        </p>
        <p class="description"><?php esc_html_e('Links and copy come from Appearance → Customize → Steam Promotion.', 'infinity'); ?></p>
        <?php
    }

    public function update($new_instance, $old_instance) {
        return array('title' => sanitize_text_field($new_instance['title'] ?? ''));
    }
}

class Infinity_ETU_Widget extends Infinity_Property_Widget {
    public function __construct() {
        parent::__construct('infinity_etu', esc_html__('Infinity: Explore the Universe 2175', 'infinity'), array(
            'description' => esc_html__('Promo card for the game — Steam wishlist + sign-up link.', 'infinity'),
        ));
    }
    protected function render_card() {
        infinity_etu_promo_card();
    }
}

class Infinity_Parkers_Widget extends Infinity_Property_Widget {
    public function __construct() {
        parent::__construct('infinity_parkers', esc_html__("Infinity: Parker's Physics", 'infinity'), array(
            'description' => esc_html__('Promo card driving visitors into the simulation sandbox.', 'infinity'),
        ));
    }
    protected function render_card() {
        infinity_parkers_promo_card();
    }
}

class Infinity_Landscaping_Widget extends Infinity_Property_Widget {
    public function __construct() {
        parent::__construct('infinity_landscaping', esc_html__('Infinity: Telford Landscaping', 'infinity'), array(
            'description' => esc_html__('Promo card linking to TelfordLandscaping.com.', 'infinity'),
        ));
    }
    protected function render_card() {
        infinity_landscaping_promo_card();
    }
}

/**
 * Register the property widgets.
 */
function infinity_register_property_widgets() {
    register_widget('Infinity_ETU_Widget');
    register_widget('Infinity_Parkers_Widget');
    register_widget('Infinity_Landscaping_Widget');
}
add_action('widgets_init', 'infinity_register_property_widgets');
