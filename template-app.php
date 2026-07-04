<?php
/**
 * Template Name: Parker's App Shell
 *
 * Mounts the React app (Parker's Physics sandbox, dashboard, pricing)
 * on any WordPress page assigned this template. The app bundle is
 * only enqueued when this template (or the posts-page fallback) is
 * in use — see infinity_enqueue_scripts().
 *
 * @package Infinity
 * @since 1.4.0
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?> <?php infinity_add_theme_attribute(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="skip-link screen-reader-text" href="#main-content">
    <?php esc_html_e('Skip to content', 'infinity'); ?>
</a>

<div id="infinity-root"></div>

<noscript>
    <div style="padding: 2rem; text-align: center; background: #1e293b; color: #f8fafc;">
        <h1><?php esc_html_e('JavaScript Required', 'infinity'); ?></h1>
        <p><?php esc_html_e('This application requires JavaScript to run interactive simulations. Please enable JavaScript in your browser settings.', 'infinity'); ?></p>
    </div>
</noscript>

<?php wp_footer(); ?>
</body>
</html>
