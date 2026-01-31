<?php
/**
 * Block Patterns
 *
 * Registers custom block patterns for the Gutenberg editor.
 *
 * @package Infinity
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register block pattern category
 */
function infinity_register_pattern_category() {
    register_block_pattern_category(
        'infinity',
        array(
            'label'       => __('Infinity Theme', 'infinity'),
            'description' => __('Patterns designed for the Infinity simulation theme.', 'infinity'),
        )
    );

    register_block_pattern_category(
        'infinity-hero',
        array(
            'label'       => __('Hero Sections', 'infinity'),
            'description' => __('Full-width hero sections for landing pages.', 'infinity'),
        )
    );

    register_block_pattern_category(
        'infinity-features',
        array(
            'label'       => __('Features', 'infinity'),
            'description' => __('Feature grids and showcases.', 'infinity'),
        )
    );

    register_block_pattern_category(
        'infinity-cta',
        array(
            'label'       => __('Call to Action', 'infinity'),
            'description' => __('Call to action sections.', 'infinity'),
        )
    );
}
add_action('init', 'infinity_register_pattern_category');

/**
 * Register block patterns
 */
function infinity_register_block_patterns() {

    // Hero Section - Cosmic
    register_block_pattern(
        'infinity/hero-cosmic',
        array(
            'title'       => __('Hero - Cosmic', 'infinity'),
            'description' => __('A dark, space-themed hero section with gradient background.', 'infinity'),
            'categories'  => array('infinity', 'infinity-hero'),
            'keywords'    => array('hero', 'header', 'cosmic', 'space'),
            'blockTypes'  => array('core/cover', 'core/group'),
            'content'     => '<!-- wp:cover {"dimRatio":90,"overlayColor":"black","minHeight":600,"minHeightUnit":"px","isDark":false,"style":{"spacing":{"padding":{"top":"var:preset|spacing|80","bottom":"var:preset|spacing|80"}}}} -->
<div class="wp-block-cover is-light" style="padding-top:var(--wp--preset--spacing--80);padding-bottom:var(--wp--preset--spacing--80);min-height:600px"><span aria-hidden="true" class="wp-block-cover__background has-black-background-color has-background-dim-90 has-background-dim"></span><div class="wp-block-cover__inner-container"><!-- wp:group {"style":{"spacing":{"blockGap":"24px"}},"layout":{"type":"constrained","contentSize":"800px"}} -->
<div class="wp-block-group"><!-- wp:heading {"textAlign":"center","level":1,"style":{"typography":{"fontSize":"56px","fontWeight":"700"},"elements":{"link":{"color":{"text":"#ffffff"}}}},"textColor":"white"} -->
<h1 class="wp-block-heading has-text-align-center has-white-color has-text-color has-link-color" style="font-size:56px;font-weight:700">' . esc_html__('Explore the Universe', 'infinity') . '</h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"20px"},"elements":{"link":{"color":{"text":"#b8c0d4"}}}},"textColor":"cyan-bluish-gray"} -->
<p class="has-text-align-center has-cyan-bluish-gray-color has-text-color has-link-color" style="font-size:20px">' . esc_html__('Create stunning interactive astrophysical simulations with our cutting-edge physics engines. Experience the cosmos like never before.', 'infinity') . '</p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"margin":{"top":"32px"}}}} -->
<div class="wp-block-buttons" style="margin-top:32px"><!-- wp:button {"style":{"border":{"radius":"8px"},"spacing":{"padding":{"left":"32px","right":"32px","top":"16px","bottom":"16px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" style="border-radius:8px;padding-top:16px;padding-right:32px;padding-bottom:16px;padding-left:32px">' . esc_html__('Start Exploring', 'infinity') . '</a></div>
<!-- /wp:button -->

<!-- wp:button {"className":"is-style-outline","style":{"border":{"radius":"8px"},"spacing":{"padding":{"left":"32px","right":"32px","top":"16px","bottom":"16px"}}}} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" style="border-radius:8px;padding-top:16px;padding-right:32px;padding-bottom:16px;padding-left:32px">' . esc_html__('Learn More', 'infinity') . '</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group --></div></div>
<!-- /wp:cover -->',
        )
    );

    // Hero Section - Gradient
    register_block_pattern(
        'infinity/hero-gradient',
        array(
            'title'       => __('Hero - Gradient', 'infinity'),
            'description' => __('A vibrant gradient hero section.', 'infinity'),
            'categories'  => array('infinity', 'infinity-hero'),
            'keywords'    => array('hero', 'header', 'gradient'),
            'content'     => '<!-- wp:cover {"dimRatio":0,"minHeight":550,"minHeightUnit":"px","gradient":"vivid-cyan-blue-to-vivid-purple","isDark":false,"style":{"spacing":{"padding":{"top":"var:preset|spacing|80","bottom":"var:preset|spacing|80"}}}} -->
<div class="wp-block-cover is-light" style="padding-top:var(--wp--preset--spacing--80);padding-bottom:var(--wp--preset--spacing--80);min-height:550px"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-0 has-background-dim has-background-gradient has-vivid-cyan-blue-to-vivid-purple-gradient-background"></span><div class="wp-block-cover__inner-container"><!-- wp:group {"style":{"spacing":{"blockGap":"20px"}},"layout":{"type":"constrained","contentSize":"700px"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"14px","fontWeight":"600","letterSpacing":"2px","textTransform":"uppercase"}},"textColor":"white"} -->
<p class="has-text-align-center has-white-color has-text-color" style="font-size:14px;font-weight:600;letter-spacing:2px;text-transform:uppercase">' . esc_html__('Welcome to Infinity', 'infinity') . '</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"textAlign":"center","level":1,"style":{"typography":{"fontSize":"48px","fontWeight":"700"}},"textColor":"white"} -->
<h1 class="wp-block-heading has-text-align-center has-white-color has-text-color" style="font-size:48px;font-weight:700">' . esc_html__('Your Gateway to the Stars', 'infinity') . '</h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"18px"}},"textColor":"white"} -->
<p class="has-text-align-center has-white-color has-text-color" style="font-size:18px">' . esc_html__('Interactive 3D simulations powered by cutting-edge physics engines. Designed for educators, researchers, and space enthusiasts.', 'infinity') . '</p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"margin":{"top":"28px"}}}} -->
<div class="wp-block-buttons" style="margin-top:28px"><!-- wp:button {"backgroundColor":"white","textColor":"black","style":{"border":{"radius":"8px"},"spacing":{"padding":{"left":"28px","right":"28px","top":"14px","bottom":"14px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-black-color has-white-background-color has-text-color has-background wp-element-button" style="border-radius:8px;padding-top:14px;padding-right:28px;padding-bottom:14px;padding-left:28px">' . esc_html__('Get Started Free', 'infinity') . '</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group --></div></div>
<!-- /wp:cover -->',
        )
    );

    // Feature Grid - 3 Column
    register_block_pattern(
        'infinity/feature-grid-3col',
        array(
            'title'       => __('Feature Grid - 3 Columns', 'infinity'),
            'description' => __('A three-column feature grid with icons.', 'infinity'),
            'categories'  => array('infinity', 'infinity-features'),
            'keywords'    => array('features', 'grid', 'services'),
            'content'     => '<!-- wp:group {"style":{"spacing":{"padding":{"top":"80px","bottom":"80px"}}},"layout":{"type":"constrained","contentSize":"1200px"}} -->
<div class="wp-block-group" style="padding-top:80px;padding-bottom:80px"><!-- wp:heading {"textAlign":"center","style":{"spacing":{"margin":{"bottom":"16px"}}}} -->
<h2 class="wp-block-heading has-text-align-center" style="margin-bottom:16px">' . esc_html__('Why Choose Infinity?', 'infinity') . '</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"spacing":{"margin":{"bottom":"48px"}},"typography":{"fontSize":"18px"}}} -->
<p class="has-text-align-center" style="margin-bottom:48px;font-size:18px">' . esc_html__('Everything you need to create amazing space simulations.', 'infinity') . '</p>
<!-- /wp:paragraph -->

<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"32px"}}}} -->
<div class="wp-block-columns"><!-- wp:column {"style":{"spacing":{"padding":{"top":"32px","bottom":"32px","left":"24px","right":"24px"}},"border":{"radius":"12px"}},"backgroundColor":"tertiary"} -->
<div class="wp-block-column has-tertiary-background-color has-background" style="border-radius:12px;padding-top:32px;padding-right:24px;padding-bottom:32px;padding-left:24px"><!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"48px"}}} -->
<p class="has-text-align-center" style="font-size:48px">🚀</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"textAlign":"center","level":3,"style":{"typography":{"fontSize":"20px"},"spacing":{"margin":{"top":"16px","bottom":"8px"}}}} -->
<h3 class="wp-block-heading has-text-align-center" style="margin-top:16px;margin-bottom:8px;font-size:20px">' . esc_html__('Real-Time Physics', 'infinity') . '</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"15px"}}} -->
<p class="has-text-align-center" style="font-size:15px">' . esc_html__('Multiple physics engines including Cannon.js, Ammo.js, and GPU compute shaders for accurate simulations.', 'infinity') . '</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"style":{"spacing":{"padding":{"top":"32px","bottom":"32px","left":"24px","right":"24px"}},"border":{"radius":"12px"}},"backgroundColor":"tertiary"} -->
<div class="wp-block-column has-tertiary-background-color has-background" style="border-radius:12px;padding-top:32px;padding-right:24px;padding-bottom:32px;padding-left:24px"><!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"48px"}}} -->
<p class="has-text-align-center" style="font-size:48px">🎮</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"textAlign":"center","level":3,"style":{"typography":{"fontSize":"20px"},"spacing":{"margin":{"top":"16px","bottom":"8px"}}}} -->
<h3 class="wp-block-heading has-text-align-center" style="margin-top:16px;margin-bottom:8px;font-size:20px">' . esc_html__('Interactive Controls', 'infinity') . '</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"15px"}}} -->
<p class="has-text-align-center" style="font-size:15px">' . esc_html__('User-friendly parameter controls let visitors customize simulations in real-time.', 'infinity') . '</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"style":{"spacing":{"padding":{"top":"32px","bottom":"32px","left":"24px","right":"24px"}},"border":{"radius":"12px"}},"backgroundColor":"tertiary"} -->
<div class="wp-block-column has-tertiary-background-color has-background" style="border-radius:12px;padding-top:32px;padding-right:24px;padding-bottom:32px;padding-left:24px"><!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"48px"}}} -->
<p class="has-text-align-center" style="font-size:48px">🏆</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"textAlign":"center","level":3,"style":{"typography":{"fontSize":"20px"},"spacing":{"margin":{"top":"16px","bottom":"8px"}}}} -->
<h3 class="wp-block-heading has-text-align-center" style="margin-top:16px;margin-bottom:8px;font-size:20px">' . esc_html__('Gamification', 'infinity') . '</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"15px"}}} -->
<p class="has-text-align-center" style="font-size:15px">' . esc_html__('Challenges, achievements, and leaderboards to engage and motivate your community.', 'infinity') . '</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->',
        )
    );

    // Simulation Showcase
    register_block_pattern(
        'infinity/simulation-showcase',
        array(
            'title'       => __('Simulation Showcase', 'infinity'),
            'description' => __('A grid for showcasing featured simulations.', 'infinity'),
            'categories'  => array('infinity'),
            'keywords'    => array('simulation', 'showcase', 'gallery'),
            'content'     => '<!-- wp:group {"style":{"spacing":{"padding":{"top":"80px","bottom":"80px"}}},"layout":{"type":"constrained","contentSize":"1200px"}} -->
<div class="wp-block-group" style="padding-top:80px;padding-bottom:80px"><!-- wp:heading {"textAlign":"center","style":{"spacing":{"margin":{"bottom":"12px"}}}} -->
<h2 class="wp-block-heading has-text-align-center" style="margin-bottom:12px">' . esc_html__('Featured Simulations', 'infinity') . '</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"spacing":{"margin":{"bottom":"40px"}}}} -->
<p class="has-text-align-center" style="margin-bottom:40px">' . esc_html__('Explore our most popular interactive experiences.', 'infinity') . '</p>
<!-- /wp:paragraph -->

<!-- wp:query {"queryId":1,"query":{"perPage":"3","pages":0,"offset":0,"postType":"simulation","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
<div class="wp-block-query"><!-- wp:post-template {"style":{"spacing":{"blockGap":"24px"}},"layout":{"type":"grid","columnCount":3}} -->
<!-- wp:group {"style":{"spacing":{"padding":{"top":"0","bottom":"24px","left":"0","right":"0"}},"border":{"radius":"12px"}},"backgroundColor":"tertiary"} -->
<div class="wp-block-group has-tertiary-background-color has-background" style="border-radius:12px;padding-top:0;padding-right:0;padding-bottom:24px;padding-left:0"><!-- wp:post-featured-image {"isLink":true,"aspectRatio":"16/9","style":{"border":{"radius":{"topLeft":"12px","topRight":"12px"}}}} /-->

<!-- wp:group {"style":{"spacing":{"padding":{"left":"20px","right":"20px","top":"16px"}}}} -->
<div class="wp-block-group" style="padding-top:16px;padding-right:20px;padding-left:20px"><!-- wp:post-title {"level":3,"isLink":true,"style":{"typography":{"fontSize":"18px","fontWeight":"600"},"spacing":{"margin":{"bottom":"8px"}}}} /-->

<!-- wp:post-excerpt {"moreText":"","excerptLength":15,"style":{"typography":{"fontSize":"14px"}}} /--></div>
<!-- /wp:group --></div>
<!-- /wp:group -->
<!-- /wp:post-template -->

<!-- wp:query-no-results -->
<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center">' . esc_html__('No simulations found. Create your first simulation to see it here!', 'infinity') . '</p>
<!-- /wp:paragraph -->
<!-- /wp:query-no-results --></div>
<!-- /wp:query -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"margin":{"top":"40px"}}}} -->
<div class="wp-block-buttons" style="margin-top:40px"><!-- wp:button {"className":"is-style-outline"} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" href="/simulations/">' . esc_html__('View All Simulations', 'infinity') . '</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->',
        )
    );

    // CTA Section
    register_block_pattern(
        'infinity/cta-premium',
        array(
            'title'       => __('CTA - Premium Upgrade', 'infinity'),
            'description' => __('A call-to-action section for premium subscriptions.', 'infinity'),
            'categories'  => array('infinity', 'infinity-cta'),
            'keywords'    => array('cta', 'premium', 'subscription'),
            'content'     => '<!-- wp:cover {"dimRatio":90,"gradient":"vivid-cyan-blue-to-vivid-purple","minHeight":400,"minHeightUnit":"px","style":{"spacing":{"padding":{"top":"60px","bottom":"60px"}}}} -->
<div class="wp-block-cover" style="padding-top:60px;padding-bottom:60px;min-height:400px"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-90 has-background-dim has-background-gradient has-vivid-cyan-blue-to-vivid-purple-gradient-background"></span><div class="wp-block-cover__inner-container"><!-- wp:group {"layout":{"type":"constrained","contentSize":"700px"}} -->
<div class="wp-block-group"><!-- wp:heading {"textAlign":"center","style":{"typography":{"fontSize":"36px"}},"textColor":"white"} -->
<h2 class="wp-block-heading has-text-align-center has-white-color has-text-color" style="font-size:36px">' . esc_html__('Unlock Unlimited Simulations', 'infinity') . '</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"18px"},"spacing":{"margin":{"top":"16px","bottom":"24px"}}},"textColor":"white"} -->
<p class="has-text-align-center has-white-color has-text-color" style="margin-top:16px;margin-bottom:24px;font-size:18px">' . esc_html__('Go premium for unlimited access to all simulations, advanced physics engines, and exclusive challenges.', 'infinity') . '</p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"white","textColor":"black","style":{"border":{"radius":"8px"},"spacing":{"padding":{"left":"32px","right":"32px","top":"16px","bottom":"16px"}},"typography":{"fontWeight":"600"}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-black-color has-white-background-color has-text-color has-background wp-element-button" style="border-radius:8px;padding-top:16px;padding-right:32px;padding-bottom:16px;padding-left:32px;font-weight:600">' . esc_html__('Start Free Trial', 'infinity') . '</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->

<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"14px"},"spacing":{"margin":{"top":"16px"}}},"textColor":"white"} -->
<p class="has-text-align-center has-white-color has-text-color" style="margin-top:16px;font-size:14px">' . esc_html__('No credit card required. Cancel anytime.', 'infinity') . '</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div></div>
<!-- /wp:cover -->',
        )
    );

    // Stats Section
    register_block_pattern(
        'infinity/stats-section',
        array(
            'title'       => __('Stats Section', 'infinity'),
            'description' => __('A section displaying key statistics.', 'infinity'),
            'categories'  => array('infinity'),
            'keywords'    => array('stats', 'numbers', 'metrics'),
            'content'     => '<!-- wp:group {"style":{"spacing":{"padding":{"top":"60px","bottom":"60px"}}},"backgroundColor":"tertiary","layout":{"type":"constrained","contentSize":"1000px"}} -->
<div class="wp-block-group has-tertiary-background-color has-background" style="padding-top:60px;padding-bottom:60px"><!-- wp:columns -->
<div class="wp-block-columns"><!-- wp:column {"style":{"spacing":{"padding":{"top":"20px","bottom":"20px"}}}} -->
<div class="wp-block-column" style="padding-top:20px;padding-bottom:20px"><!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"48px","fontWeight":"700"}}} -->
<p class="has-text-align-center" style="font-size:48px;font-weight:700">50+</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"14px","textTransform":"uppercase","letterSpacing":"1px"}}} -->
<p class="has-text-align-center" style="font-size:14px;letter-spacing:1px;text-transform:uppercase">' . esc_html__('Simulations', 'infinity') . '</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"style":{"spacing":{"padding":{"top":"20px","bottom":"20px"}}}} -->
<div class="wp-block-column" style="padding-top:20px;padding-bottom:20px"><!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"48px","fontWeight":"700"}}} -->
<p class="has-text-align-center" style="font-size:48px;font-weight:700">10k+</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"14px","textTransform":"uppercase","letterSpacing":"1px"}}} -->
<p class="has-text-align-center" style="font-size:14px;letter-spacing:1px;text-transform:uppercase">' . esc_html__('Active Users', 'infinity') . '</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"style":{"spacing":{"padding":{"top":"20px","bottom":"20px"}}}} -->
<div class="wp-block-column" style="padding-top:20px;padding-bottom:20px"><!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"48px","fontWeight":"700"}}} -->
<p class="has-text-align-center" style="font-size:48px;font-weight:700">1M+</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"14px","textTransform":"uppercase","letterSpacing":"1px"}}} -->
<p class="has-text-align-center" style="font-size:14px;letter-spacing:1px;text-transform:uppercase">' . esc_html__('Simulation Runs', 'infinity') . '</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"style":{"spacing":{"padding":{"top":"20px","bottom":"20px"}}}} -->
<div class="wp-block-column" style="padding-top:20px;padding-bottom:20px"><!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"48px","fontWeight":"700"}}} -->
<p class="has-text-align-center" style="font-size:48px;font-weight:700">4.9</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"14px","textTransform":"uppercase","letterSpacing":"1px"}}} -->
<p class="has-text-align-center" style="font-size:14px;letter-spacing:1px;text-transform:uppercase">' . esc_html__('User Rating', 'infinity') . '</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->',
        )
    );

    // Testimonial Section
    register_block_pattern(
        'infinity/testimonials',
        array(
            'title'       => __('Testimonials', 'infinity'),
            'description' => __('A testimonial section with user quotes.', 'infinity'),
            'categories'  => array('infinity'),
            'keywords'    => array('testimonial', 'review', 'quote'),
            'content'     => '<!-- wp:group {"style":{"spacing":{"padding":{"top":"80px","bottom":"80px"}}},"layout":{"type":"constrained","contentSize":"1200px"}} -->
<div class="wp-block-group" style="padding-top:80px;padding-bottom:80px"><!-- wp:heading {"textAlign":"center","style":{"spacing":{"margin":{"bottom":"48px"}}}} -->
<h2 class="wp-block-heading has-text-align-center" style="margin-bottom:48px">' . esc_html__('What Our Users Say', 'infinity') . '</h2>
<!-- /wp:heading -->

<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns"><!-- wp:column {"style":{"spacing":{"padding":{"top":"32px","bottom":"32px","left":"28px","right":"28px"}},"border":{"radius":"12px","width":"1px"}},"borderColor":"cyan-bluish-gray"} -->
<div class="wp-block-column has-border-color has-cyan-bluish-gray-border-color" style="border-width:1px;border-radius:12px;padding-top:32px;padding-right:28px;padding-bottom:32px;padding-left:28px"><!-- wp:paragraph {"style":{"typography":{"fontSize":"16px","lineHeight":"1.7"}}} -->
<p style="font-size:16px;line-height:1.7">"' . esc_html__('Infinity has transformed how I teach astronomy. My students are completely engaged with the interactive simulations.', 'infinity') . '"</p>
<!-- /wp:paragraph -->

<!-- wp:group {"style":{"spacing":{"margin":{"top":"20px"}}},"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group" style="margin-top:20px"><!-- wp:paragraph {"style":{"typography":{"fontWeight":"600","fontSize":"14px"}}} -->
<p style="font-size:14px;font-weight:600">' . esc_html__('Dr. Sarah Chen', 'infinity') . '</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"typography":{"fontSize":"14px"}}} -->
<p style="font-size:14px">' . esc_html__('Physics Professor', 'infinity') . '</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column {"style":{"spacing":{"padding":{"top":"32px","bottom":"32px","left":"28px","right":"28px"}},"border":{"radius":"12px","width":"1px"}},"borderColor":"cyan-bluish-gray"} -->
<div class="wp-block-column has-border-color has-cyan-bluish-gray-border-color" style="border-width:1px;border-radius:12px;padding-top:32px;padding-right:28px;padding-bottom:32px;padding-left:28px"><!-- wp:paragraph {"style":{"typography":{"fontSize":"16px","lineHeight":"1.7"}}} -->
<p style="font-size:16px;line-height:1.7">"' . esc_html__('The physics accuracy is impressive. Finally a simulation platform that researchers can actually use for visualization.', 'infinity') . '"</p>
<!-- /wp:paragraph -->

<!-- wp:group {"style":{"spacing":{"margin":{"top":"20px"}}},"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group" style="margin-top:20px"><!-- wp:paragraph {"style":{"typography":{"fontWeight":"600","fontSize":"14px"}}} -->
<p style="font-size:14px;font-weight:600">' . esc_html__('James Miller', 'infinity') . '</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"typography":{"fontSize":"14px"}}} -->
<p style="font-size:14px">' . esc_html__('Astrophysicist', 'infinity') . '</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column {"style":{"spacing":{"padding":{"top":"32px","bottom":"32px","left":"28px","right":"28px"}},"border":{"radius":"12px","width":"1px"}},"borderColor":"cyan-bluish-gray"} -->
<div class="wp-block-column has-border-color has-cyan-bluish-gray-border-color" style="border-width:1px;border-radius:12px;padding-top:32px;padding-right:28px;padding-bottom:32px;padding-left:28px"><!-- wp:paragraph {"style":{"typography":{"fontSize":"16px","lineHeight":"1.7"}}} -->
<p style="font-size:16px;line-height:1.7">"' . esc_html__('I spent hours exploring the galaxy simulations. The gamification features make learning addictive!', 'infinity') . '"</p>
<!-- /wp:paragraph -->

<!-- wp:group {"style":{"spacing":{"margin":{"top":"20px"}}},"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group" style="margin-top:20px"><!-- wp:paragraph {"style":{"typography":{"fontWeight":"600","fontSize":"14px"}}} -->
<p style="font-size:14px;font-weight:600">' . esc_html__('Emily Rodriguez', 'infinity') . '</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"typography":{"fontSize":"14px"}}} -->
<p style="font-size:14px">' . esc_html__('Space Enthusiast', 'infinity') . '</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->',
        )
    );

    // FAQ Section
    register_block_pattern(
        'infinity/faq-section',
        array(
            'title'       => __('FAQ Section', 'infinity'),
            'description' => __('Frequently asked questions with expandable answers.', 'infinity'),
            'categories'  => array('infinity'),
            'keywords'    => array('faq', 'questions', 'answers'),
            'content'     => '<!-- wp:group {"style":{"spacing":{"padding":{"top":"80px","bottom":"80px"}}},"layout":{"type":"constrained","contentSize":"800px"}} -->
<div class="wp-block-group" style="padding-top:80px;padding-bottom:80px"><!-- wp:heading {"textAlign":"center","style":{"spacing":{"margin":{"bottom":"48px"}}}} -->
<h2 class="wp-block-heading has-text-align-center" style="margin-bottom:48px">' . esc_html__('Frequently Asked Questions', 'infinity') . '</h2>
<!-- /wp:heading -->

<!-- wp:details {"style":{"spacing":{"margin":{"bottom":"12px"}}}} -->
<details class="wp-block-details" style="margin-bottom:12px"><summary>' . esc_html__('What physics engines does Infinity support?', 'infinity') . '</summary><!-- wp:paragraph {"style":{"spacing":{"margin":{"top":"12px"}}}} -->
<p style="margin-top:12px">' . esc_html__('Infinity supports multiple physics engines including Cannon.js for general physics, Ammo.js for advanced rigid body dynamics, and GPU compute shaders for particle-heavy simulations like galaxy formation.', 'infinity') . '</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"style":{"spacing":{"margin":{"bottom":"12px"}}}} -->
<details class="wp-block-details" style="margin-bottom:12px"><summary>' . esc_html__('Can I create my own simulations?', 'infinity') . '</summary><!-- wp:paragraph {"style":{"spacing":{"margin":{"top":"12px"}}}} -->
<p style="margin-top:12px">' . esc_html__('Yes! With our Blueprint system, you can create custom simulation configurations, share them with the community, and even fork existing blueprints to make your own versions.', 'infinity') . '</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"style":{"spacing":{"margin":{"bottom":"12px"}}}} -->
<details class="wp-block-details" style="margin-bottom:12px"><summary>' . esc_html__('Is Infinity suitable for education?', 'infinity') . '</summary><!-- wp:paragraph {"style":{"spacing":{"margin":{"top":"12px"}}}} -->
<p style="margin-top:12px">' . esc_html__('Absolutely! Infinity is designed with educators in mind. It includes difficulty levels, tutorial overlays, and challenge modes that make it perfect for classroom use from middle school to university level.', 'infinity') . '</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"style":{"spacing":{"margin":{"bottom":"12px"}}}} -->
<details class="wp-block-details" style="margin-bottom:12px"><summary>' . esc_html__('What\'s included in the premium subscription?', 'infinity') . '</summary><!-- wp:paragraph {"style":{"spacing":{"margin":{"top":"12px"}}}} -->
<p style="margin-top:12px">' . esc_html__('Premium subscribers get unlimited simulation runs, access to all physics engines, exclusive simulations, priority support, and the ability to create private blueprints.', 'infinity') . '</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details --></div>
<!-- /wp:group -->',
        )
    );
}
add_action('init', 'infinity_register_block_patterns');
