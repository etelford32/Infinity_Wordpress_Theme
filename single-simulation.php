<?php
/**
 * Single Simulation Template
 *
 * @package Infinity
 * @since 1.0.0
 */

get_header();
?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
    <header class="entry-header container">
        <?php the_title('<h1 class="entry-title">', '</h1>'); ?>

        <div class="simulation-meta">
            <?php
            // Get simulation metadata
            $physics_engine = get_post_meta(get_the_ID(), 'physics_engine', true);
            $is_premium = get_post_meta(get_the_ID(), 'is_premium', true);
            $play_count = get_post_meta(get_the_ID(), 'play_count', true);

            // Display difficulty level
            $difficulty = get_the_terms(get_the_ID(), 'difficulty_level');
            if ($difficulty && !is_wp_error($difficulty)) {
                echo '<span class="difficulty-badge">' . esc_html($difficulty[0]->name) . '</span>';
            }

            // Display physics engine
            if ($physics_engine) {
                $engine_names = array(
                    'cannon' => __('Cannon.js', 'infinity'),
                    'ammo'   => __('Ammo.js', 'infinity'),
                    'gpu'    => __('GPU Compute', 'infinity'),
                );
                echo '<span class="physics-engine">' . esc_html($engine_names[$physics_engine] ?? $physics_engine) . '</span>';
            }

            // Display premium badge
            if ($is_premium) {
                echo '<span class="premium-badge">' . __('Premium', 'infinity') . '</span>';
            }

            // Display play count
            if ($play_count) {
                printf(
                    '<span class="play-count">%s</span>',
                    sprintf(_n('%s play', '%s plays', $play_count, 'infinity'), number_format_i18n($play_count))
                );
            }
            ?>
        </div>
    </header>

    <div class="simulation-wrapper container-full">
        <div id="simulation-mount-point"
             data-simulation-id="<?php the_ID(); ?>"
             data-config="<?php echo esc_attr(get_post_meta(get_the_ID(), 'simulation_config', true)); ?>"
             data-physics-engine="<?php echo esc_attr($physics_engine); ?>">

            <!-- React will mount the simulation here -->
            <div class="simulation-loading">
                <p><?php _e('Loading simulation...', 'infinity'); ?></p>
            </div>
        </div>
    </div>

    <div class="entry-content container">
        <?php
        the_content();

        wp_link_pages(array(
            'before' => '<div class="page-links">' . esc_html__('Pages:', 'infinity'),
            'after'  => '</div>',
        ));
        ?>
    </div>

    <footer class="entry-footer container">
        <?php
        // Display categories and tags
        $categories = get_the_terms(get_the_ID(), 'simulation_category');
        if ($categories && !is_wp_error($categories)) {
            echo '<div class="simulation-categories">';
            echo '<strong>' . __('Categories:', 'infinity') . '</strong> ';
            $category_links = array();
            foreach ($categories as $category) {
                $category_links[] = '<a href="' . get_term_link($category) . '">' . esc_html($category->name) . '</a>';
            }
            echo implode(', ', $category_links);
            echo '</div>';
        }
        ?>
    </footer>
</article>

<?php
if (comments_open() || get_comments_number()) {
    comments_template();
}

get_footer();
