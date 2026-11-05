<?php
/**
 * Widget areas, layout options and default widgets
 *
 * Everything that decides where widgets can go and how those areas are
 * laid out lives here:
 *
 *   - Widget areas: Post Sidebar, Page Sidebar and four Footer columns,
 *     all editable in Appearance → Widgets and in the Customizer.
 *   - Customize → Sidebar & Footer: sidebar position, sticky sidebar,
 *     footer column count, the "Telford universe" strip and the
 *     credit line.
 *   - Default widgets: the post sidebar used to print three promo
 *     cards from PHP when it was empty. Those cards were on the site
 *     but invisible in the widget editor, so they could not be moved,
 *     reordered or removed. They are now placed into the sidebar once
 *     as real widgets, so what the editor shows is what the site shows.
 *
 * @package Infinity
 * @since 3.6.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Footer column widget areas, in display order.
 *
 * footer-1 keeps the id the theme's single "Footer" area always had,
 * so widgets already placed there stay put as Footer Column 1.
 */
function infinity_footer_widget_areas() {
    return array('footer-1', 'footer-2', 'footer-3', 'footer-4');
}

/**
 * Register widget areas.
 */
function infinity_widgets_init() {
    $shared = array(
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h2 class="widget-title">',
        'after_title'   => '</h2>',
    );

    register_sidebar(array_merge($shared, array(
        'name'        => esc_html__('Post Sidebar', 'infinity'),
        'id'          => 'sidebar-1',
        'description' => esc_html__('Beside single blog posts. Position (right, left or hidden) is set in Customize → Sidebar & Footer. Leave it empty to hide the sidebar.', 'infinity'),
    )));

    register_sidebar(array_merge($shared, array(
        'name'        => esc_html__('Page Sidebar', 'infinity'),
        'id'          => 'sidebar-page',
        'description' => esc_html__('Beside regular pages. Pages stay full width while this area is empty. Music pages never show it.', 'infinity'),
    )));

    foreach (infinity_footer_widget_areas() as $i => $id) {
        register_sidebar(array_merge($shared, array(
            /* translators: %d: footer column number */
            'name'        => sprintf(esc_html__('Footer Column %d', 'infinity'), $i + 1),
            'id'          => $id,
            'description' => esc_html__('A column in the site footer, above the footer menu. Empty columns are skipped; the column count is set in Customize → Sidebar & Footer.', 'infinity'),
        )));
    }
}
add_action('widgets_init', 'infinity_widgets_init');

/* ==========================================================================
   Default widgets
   ========================================================================== */

/**
 * Place the three property promo widgets into the post sidebar, once.
 *
 * Runs on theme activation and on the first admin load after updating
 * to this version. It only fills the sidebar when it is empty and only
 * ever runs once per site, so a sidebar the owner later clears stays
 * empty.
 */
function infinity_seed_default_widgets() {
    if (get_option('infinity_widgets_seeded')) {
        return;
    }
    update_option('infinity_widgets_seeded', 1);

    $sidebars = wp_get_sidebars_widgets();
    if (!empty($sidebars['sidebar-1'])) {
        return;
    }

    $sidebars['sidebar-1'] = array();
    foreach (array('infinity_etu', 'infinity_parkers', 'infinity_landscaping') as $id_base) {
        $instances = get_option('widget_' . $id_base, array());
        if (!is_array($instances)) {
            $instances = array();
        }

        $numbers = array_filter(array_keys($instances), 'is_int');
        $number  = $numbers ? max($numbers) + 1 : 2;

        $instances[$number]        = array('title' => '');
        $instances['_multiwidget'] = 1;
        update_option('widget_' . $id_base, $instances);

        $sidebars['sidebar-1'][] = $id_base . '-' . $number;
    }

    wp_set_sidebars_widgets($sidebars);
}
add_action('after_switch_theme', 'infinity_seed_default_widgets');
add_action('admin_init', 'infinity_seed_default_widgets');

/**
 * Whether the post sidebar should print the built-in promo cards.
 *
 * Only before the defaults have been seeded as real widgets (a site
 * nobody has opened wp-admin on since updating). After that the
 * widget area is the single source of truth.
 */
function infinity_sidebar_uses_fallback($area) {
    return 'sidebar-1' === $area && !get_option('infinity_widgets_seeded');
}

/* ==========================================================================
   Layout helpers
   ========================================================================== */

/**
 * Which sidebar to show in a context, and on which side.
 *
 * @param string $context 'post' or 'page'.
 * @return array{area:string,position:string}|null Null when there is no sidebar.
 */
function infinity_sidebar_layout($context = 'post') {
    if ('page' === $context) {
        $area     = 'sidebar-page';
        $position = get_theme_mod('infinity_page_sidebar_position', 'right');
        if (function_exists('infinity_is_music_page') && infinity_is_music_page()) {
            return null;
        }
    } else {
        $area     = 'sidebar-1';
        $position = get_theme_mod('infinity_post_sidebar_position', 'right');
    }

    $position = infinity_sanitize_sidebar_position($position);
    if ('none' === $position) {
        return null;
    }

    if (!is_active_sidebar($area) && !infinity_sidebar_uses_fallback($area)) {
        return null;
    }

    return apply_filters('infinity_sidebar_layout', array(
        'area'     => $area,
        'position' => $position,
    ), $context);
}

/**
 * Classes for the content + sidebar wrapper.
 */
function infinity_entry_layout_classes($layout) {
    $classes = array('entry-layout');
    if ($layout) {
        $classes[] = 'has-sidebar';
        $classes[] = 'sidebar-' . $layout['position'];
        if (get_theme_mod('infinity_sticky_sidebar', true)) {
            $classes[] = 'sidebar-sticky';
        }
    } else {
        $classes[] = 'no-sidebar';
    }
    return implode(' ', array_map('sanitize_html_class', $classes));
}

/**
 * Render the footer widget columns.
 */
function infinity_footer_widgets() {
    $active = array_values(array_filter(infinity_footer_widget_areas(), 'is_active_sidebar'));
    if (!$active) {
        return;
    }

    $setting = get_theme_mod('infinity_footer_columns', 'auto');
    $columns = 'auto' === $setting ? count($active) : max(1, min(4, absint($setting)));
    ?>
    <aside class="footer-widgets widget-area footer-widgets-cols-<?php echo esc_attr($columns); ?>" aria-label="<?php esc_attr_e('Footer widgets', 'infinity'); ?>">
        <?php foreach ($active as $id) : ?>
            <div class="footer-widget-column footer-widget-column-<?php echo esc_attr($id); ?>">
                <?php dynamic_sidebar($id); ?>
            </div>
        <?php endforeach; ?>
    </aside>
    <?php
}

/**
 * The credit line at the very bottom of the footer.
 */
function infinity_footer_credit() {
    $credit = trim((string) get_theme_mod('infinity_footer_credit', ''));
    if ('' !== $credit) {
        $credit = str_replace(
            array('{year}', '{site}'),
            array(esc_html(date('Y')), esc_html(get_bloginfo('name'))),
            $credit
        );
        echo '<p>' . wp_kses_post($credit) . '</p>';
        return;
    }
    ?>
    <p>
        &copy; <?php echo esc_html(date('Y')); ?> <?php bloginfo('name'); ?>.
        <?php esc_html_e('Powered by', 'infinity'); ?>
        <a href="<?php echo esc_url(__('https://wordpress.org/', 'infinity')); ?>">WordPress</a>
        <?php esc_html_e('and', 'infinity'); ?>
        <a href="<?php echo esc_url('https://threejs.org/'); ?>">Three.js</a>
    </p>
    <?php
}

/* ==========================================================================
   Customizer: Sidebar & Footer
   ========================================================================== */

function infinity_sanitize_sidebar_position($value) {
    return in_array($value, array('right', 'left', 'none'), true) ? $value : 'right';
}

function infinity_sanitize_footer_columns($value) {
    return in_array((string) $value, array('auto', '1', '2', '3', '4'), true) ? (string) $value : 'auto';
}

function infinity_widgets_customize_register($wp_customize) {
    $wp_customize->add_section('infinity_layout_widgets', array(
        'title'       => esc_html__('Sidebar & Footer', 'infinity'),
        'description' => esc_html__('Where widget areas appear and how they are laid out. Add or edit the widgets themselves under Widgets.', 'infinity'),
        'priority'    => 36,
    ));

    $positions = array(
        'right' => esc_html__('Right', 'infinity'),
        'left'  => esc_html__('Left', 'infinity'),
        'none'  => esc_html__('Hidden', 'infinity'),
    );

    $wp_customize->add_setting('infinity_post_sidebar_position', array(
        'default'           => 'right',
        'sanitize_callback' => 'infinity_sanitize_sidebar_position',
    ));
    $wp_customize->add_control('infinity_post_sidebar_position', array(
        'label'   => esc_html__('Post sidebar', 'infinity'),
        'section' => 'infinity_layout_widgets',
        'type'    => 'radio',
        'choices' => $positions,
    ));

    $wp_customize->add_setting('infinity_page_sidebar_position', array(
        'default'           => 'right',
        'sanitize_callback' => 'infinity_sanitize_sidebar_position',
    ));
    $wp_customize->add_control('infinity_page_sidebar_position', array(
        'label'       => esc_html__('Page sidebar', 'infinity'),
        'description' => esc_html__('Only shown once the Page Sidebar widget area has widgets.', 'infinity'),
        'section'     => 'infinity_layout_widgets',
        'type'        => 'radio',
        'choices'     => $positions,
    ));

    $wp_customize->add_setting('infinity_sticky_sidebar', array(
        'default'           => true,
        'sanitize_callback' => 'rest_sanitize_boolean',
    ));
    $wp_customize->add_control('infinity_sticky_sidebar', array(
        'label'       => esc_html__('Keep the sidebar in view while scrolling', 'infinity'),
        'description' => esc_html__('Turn off if the sidebar is taller than the screen.', 'infinity'),
        'section'     => 'infinity_layout_widgets',
        'type'        => 'checkbox',
    ));

    $wp_customize->add_setting('infinity_footer_columns', array(
        'default'           => 'auto',
        'sanitize_callback' => 'infinity_sanitize_footer_columns',
    ));
    $wp_customize->add_control('infinity_footer_columns', array(
        'label'       => esc_html__('Footer widget columns', 'infinity'),
        'description' => esc_html__('Automatic uses one column per footer area that has widgets.', 'infinity'),
        'section'     => 'infinity_layout_widgets',
        'type'        => 'select',
        'choices'     => array(
            'auto' => esc_html__('Automatic', 'infinity'),
            '1'    => '1',
            '2'    => '2',
            '3'    => '3',
            '4'    => '4',
        ),
    ));

    $wp_customize->add_setting('infinity_footer_family_links', array(
        'default'           => true,
        'sanitize_callback' => 'rest_sanitize_boolean',
    ));
    $wp_customize->add_control('infinity_footer_family_links', array(
        'label'   => esc_html__('Show the "Telford universe" links in the footer', 'infinity'),
        'section' => 'infinity_layout_widgets',
        'type'    => 'checkbox',
    ));

    $wp_customize->add_setting('infinity_footer_credit', array(
        'default'           => '',
        'sanitize_callback' => 'wp_kses_post',
        'transport'         => 'postMessage',
    ));
    $wp_customize->add_control('infinity_footer_credit', array(
        'label'       => esc_html__('Footer credit line', 'infinity'),
        'description' => esc_html__('Leave empty for the default. {year} and {site} are replaced; links are allowed.', 'infinity'),
        'section'     => 'infinity_layout_widgets',
        'type'        => 'textarea',
    ));

    if (isset($wp_customize->selective_refresh)) {
        $wp_customize->selective_refresh->add_partial('infinity_footer_credit', array(
            'selector'            => '.site-info',
            'container_inclusive' => false,
            'render_callback'     => 'infinity_footer_credit',
        ));
    }
}
add_action('customize_register', 'infinity_widgets_customize_register');
