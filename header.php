<!DOCTYPE html>
<html <?php language_attributes(); ?> <?php infinity_add_theme_attribute(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="skip-link screen-reader-text" href="#main-content">
    <?php esc_html_e('Skip to content', 'infinity'); ?>
</a>

<div id="page" class="site">
    <header id="masthead" class="site-header<?php echo get_theme_mod('infinity_sticky_header', false) ? ' sticky-header' : ''; ?>" role="banner">
        <div class="container">
            <div class="site-branding">
                <?php
                if (has_custom_logo()) {
                    the_custom_logo();
                } else {
                    ?>
                    <h1 class="site-title">
                        <a href="<?php echo esc_url(home_url('/')); ?>" rel="home">
                            <?php bloginfo('name'); ?>
                        </a>
                    </h1>
                    <?php
                }
                ?>
            </div>

            <button
                type="button"
                class="mobile-menu-toggle"
                aria-controls="site-navigation"
                aria-expanded="false"
                aria-label="<?php esc_attr_e('Toggle navigation menu', 'infinity'); ?>"
            >
                <span class="hamburger-icon">
                    <span class="hamburger-line"></span>
                    <span class="hamburger-line"></span>
                    <span class="hamburger-line"></span>
                </span>
            </button>

            <nav id="site-navigation" class="main-navigation" role="navigation" aria-label="<?php esc_attr_e('Primary Menu', 'infinity'); ?>">
                <?php
                wp_nav_menu(array(
                    'theme_location' => 'primary',
                    'menu_id'        => 'primary-menu',
                    'menu_class'     => 'nav-menu',
                    'container'      => false,
                    'fallback_cb'    => false,
                ));
                ?>
            </nav>
        </div>
    </header>

    <?php
    // Display breadcrumbs on appropriate pages
    if (!is_front_page() && get_theme_mod('infinity_show_breadcrumbs', true)) {
        infinity_breadcrumbs();
    }
    ?>

    <main id="main-content" class="site-main" role="main">
