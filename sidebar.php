<?php
/**
 * Sidebar template
 *
 * Renders the sidebar-1 widget area. When no widgets are configured
 * yet, falls back to the property promo cards so the conversion
 * surface works out of the box.
 *
 * @package Infinity
 * @since 1.2.0
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<aside class="post-sidebar" role="complementary" aria-label="<?php esc_attr_e('Sidebar', 'infinity'); ?>">
    <?php if (is_active_sidebar('sidebar-1')) : ?>
        <?php dynamic_sidebar('sidebar-1'); ?>
    <?php else : ?>
        <?php
        infinity_etu_promo_card();
        infinity_parkers_promo_card();
        infinity_landscaping_promo_card();
        ?>
    <?php endif; ?>
</aside>
