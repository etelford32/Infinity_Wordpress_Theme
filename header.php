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
                <?php if (has_custom_logo()) : ?>
                    <?php
                    // The user's own logo, orbited by a 12-particle 3D
                    // swarm (WebGL): back canvas behind the logo, front
                    // canvas above, so particles genuinely circle it.
                    $infinity_logo_id  = get_theme_mod('custom_logo');
                    $infinity_logo_src = wp_get_attachment_image_url($infinity_logo_id, 'medium');
                    ?>
                    <a class="site-logo-link" href="<?php echo esc_url(home_url('/')); ?>" rel="home">
                        <span class="bh-logo" aria-hidden="true">
                            <canvas class="bh-orbits bh-orbits-back"></canvas>
                            <span class="bh-logo-photon"></span>
                            <img class="bh-logo-img" src="<?php echo esc_url($infinity_logo_src); ?>" alt="<?php echo esc_attr(get_bloginfo('name')); ?>">
                            <canvas class="bh-orbits bh-orbits-front"></canvas>
                        </span>
                        <span class="site-title-group">
                            <span class="site-title"><?php echo esc_html(str_ireplace('elliottelford', 'ElliotTelford', get_bloginfo('name'))); ?></span>
                            <span class="site-tagline"><?php bloginfo('description'); ?></span>
                        </span>
                    </a>
                <?php else : ?>
                    <a class="site-logo-link" href="<?php echo esc_url(home_url('/')); ?>" rel="home">
                        <span class="cosmic-logo" aria-hidden="true">
                            <span class="cosmic-logo-monogram">ET</span>
                            <span class="cosmic-orbit cosmic-orbit-a">
                                <span class="cosmic-orbit-ring"></span>
                                <span class="cosmic-orbiter"></span>
                            </span>
                            <span class="cosmic-orbit cosmic-orbit-b">
                                <span class="cosmic-orbit-ring"></span>
                                <span class="cosmic-orbiter"></span>
                            </span>
                            <span class="cosmic-logo-sparkle"></span>
                        </span>
                        <span class="site-title-group">
                            <span class="site-title"><?php echo esc_html(str_ireplace('elliottelford', 'ElliotTelford', get_bloginfo('name'))); ?></span>
                            <span class="site-tagline"><?php bloginfo('description'); ?></span>
                        </span>
                    </a>
                <?php endif; ?>
                <button type="button" class="theme-toggle" data-theme-toggle aria-label="<?php esc_attr_e('Toggle light and dark mode', 'infinity'); ?>">
                    <span class="theme-toggle-icon theme-toggle-moon"><?php infinity_icon('moon', 11); ?></span>
                    <span class="theme-toggle-icon theme-toggle-sun"><?php infinity_icon('sun', 11); ?></span>
                    <span class="theme-toggle-knob"></span>
                </button>
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

            <?php $infinity_steam_url = get_option('infinity_steam_url', 'https://store.steampowered.com/app/4094340/Explore_the_Universe_2175/'); ?>
            <?php if ($infinity_steam_url) : ?>
                <a class="header-steam-cta" href="<?php echo esc_url($infinity_steam_url); ?>" target="_blank" rel="noopener noreferrer">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.6"/>
                        <circle cx="15.5" cy="8.5" r="3.1" fill="currentColor"/>
                        <circle cx="7.5" cy="16.5" r="2.1" fill="currentColor"/>
                        <path d="M9.2 15.1l4.1-4.1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                    </svg>
                    <span class="header-steam-cta-label"><?php echo esc_html(get_option('infinity_steam_label', 'Explore the Universe')); ?></span>
                </a>
            <?php endif; ?>
        </div>
    </header>

    <?php
    // Display breadcrumbs on appropriate pages
    if (!is_front_page() && get_theme_mod('infinity_show_breadcrumbs', true)) {
        infinity_breadcrumbs();
    }
    ?>

    <main id="main-content" class="site-main" role="main">
