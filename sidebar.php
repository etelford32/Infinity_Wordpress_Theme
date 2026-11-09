<?php
/**
 * Sidebar template
 *
 * Renders one sidebar widget area. Pass the area id through
 * get_sidebar(null, array('area' => 'sidebar-page')); it defaults to
 * the Post Sidebar (sidebar-1).
 *
 * The built-in promo cards print only on a site whose default widgets
 * have not been placed yet (see infinity_seed_default_widgets()); after
 * that, the widget area is exactly what Appearance → Widgets shows.
 *
 * @package Infinity
 * @since 1.2.0
 */

if (!defined('ABSPATH')) {
    exit;
}

$infinity_area = (isset($args['area']) && is_string($args['area'])) ? $args['area'] : 'sidebar-1';
?>

<aside class="post-sidebar widget-area" id="secondary-<?php echo esc_attr($infinity_area); ?>" role="complementary" aria-label="<?php esc_attr_e('Sidebar', 'infinity'); ?>">
    <?php
    // Single posts pin their table of contents here (inc/reading-tools.php)
    do_action('infinity_sidebar_top', $infinity_area);
    ?>
    <?php if (is_active_sidebar($infinity_area)) : ?>
        <?php dynamic_sidebar($infinity_area); ?>
    <?php elseif (infinity_sidebar_uses_fallback($infinity_area)) : ?>
        <?php
        infinity_etu_promo_card();
        infinity_parkers_promo_card();
        infinity_landscaping_promo_card();
        ?>
    <?php endif; ?>
</aside>
