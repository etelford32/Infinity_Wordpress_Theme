<?php
/**
 * Search Results Template
 *
 * @package Infinity
 * @since 1.0.0
 */

get_header();
?>

<section class="search-results">
    <div class="container">
        <header class="page-header">
            <?php if (have_posts()) : ?>
                <h1 class="page-title">
                    <?php
                    printf(
                        /* translators: %s: search query */
                        esc_html__('Search Results for: %s', 'infinity'),
                        '<span class="search-query">' . get_search_query() . '</span>'
                    );
                    ?>
                </h1>
                <p class="results-count">
                    <?php
                    global $wp_query;
                    printf(
                        /* translators: %d: number of results */
                        esc_html(_n('%d result found', '%d results found', $wp_query->found_posts, 'infinity')),
                        $wp_query->found_posts
                    );
                    ?>
                </p>
            <?php else : ?>
                <h1 class="page-title"><?php esc_html_e('No Results Found', 'infinity'); ?></h1>
            <?php endif; ?>
        </header>

        <div class="search-form-wrapper">
            <?php get_search_form(); ?>
        </div>

        <?php if (have_posts()) : ?>
            <div class="search-results-list">
                <?php
                while (have_posts()) :
                    the_post();
                    $post_type = get_post_type();
                    $post_type_obj = get_post_type_object($post_type);
                ?>
                    <article id="post-<?php the_ID(); ?>" <?php post_class('search-result-item'); ?>>
                        <?php if (has_post_thumbnail()) : ?>
                            <div class="result-thumbnail">
                                <a href="<?php the_permalink(); ?>">
                                    <?php the_post_thumbnail('simulation-thumbnail'); ?>
                                </a>
                            </div>
                        <?php endif; ?>

                        <div class="result-content">
                            <div class="result-meta">
                                <span class="post-type-badge <?php echo esc_attr($post_type); ?>">
                                    <?php echo esc_html($post_type_obj->labels->singular_name); ?>
                                </span>
                                <time datetime="<?php echo esc_attr(get_the_date('c')); ?>">
                                    <?php echo esc_html(get_the_date()); ?>
                                </time>
                            </div>

                            <h2 class="result-title">
                                <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                            </h2>

                            <div class="result-excerpt">
                                <?php the_excerpt(); ?>
                            </div>

                            <?php if ($post_type === 'simulation') : ?>
                                <div class="result-details">
                                    <?php
                                    $physics_engine = get_post_meta(get_the_ID(), 'physics_engine', true);
                                    $is_premium = get_post_meta(get_the_ID(), 'is_premium', true);

                                    if ($physics_engine) :
                                        $engine_names = array(
                                            'cannon' => __('Cannon.js', 'infinity'),
                                            'ammo'   => __('Ammo.js', 'infinity'),
                                            'gpu'    => __('GPU Compute', 'infinity'),
                                        );
                                    ?>
                                        <span class="physics-engine"><?php echo esc_html($engine_names[$physics_engine] ?? $physics_engine); ?></span>
                                    <?php endif; ?>

                                    <?php if ($is_premium) : ?>
                                        <span class="premium-badge"><?php esc_html_e('Premium', 'infinity'); ?></span>
                                    <?php endif; ?>
                                </div>
                            <?php endif; ?>
                        </div>
                    </article>
                <?php endwhile; ?>
            </div>

            <nav class="pagination">
                <?php
                the_posts_pagination(array(
                    'mid_size'  => 2,
                    'prev_text' => __('&larr; Previous', 'infinity'),
                    'next_text' => __('Next &rarr;', 'infinity'),
                ));
                ?>
            </nav>

        <?php else : ?>
            <div class="no-results">
                <p><?php esc_html_e('Sorry, no results matched your search. Try different keywords or browse our simulations.', 'infinity'); ?></p>

                <div class="no-results-suggestions">
                    <h2><?php esc_html_e('Popular Simulations', 'infinity'); ?></h2>
                    <?php
                    $popular_simulations = new WP_Query(array(
                        'post_type'      => 'simulation',
                        'posts_per_page' => 4,
                        'meta_key'       => 'play_count',
                        'orderby'        => 'meta_value_num',
                        'order'          => 'DESC',
                    ));

                    if ($popular_simulations->have_posts()) :
                    ?>
                        <ul class="simulation-grid">
                            <?php
                            while ($popular_simulations->have_posts()) :
                                $popular_simulations->the_post();
                            ?>
                                <li>
                                    <a href="<?php the_permalink(); ?>">
                                        <?php if (has_post_thumbnail()) : ?>
                                            <?php the_post_thumbnail('simulation-thumbnail'); ?>
                                        <?php endif; ?>
                                        <span><?php the_title(); ?></span>
                                    </a>
                                </li>
                            <?php endwhile; ?>
                        </ul>
                    <?php
                        wp_reset_postdata();
                    endif;
                    ?>
                </div>
            </div>
        <?php endif; ?>
    </div>
</section>

<style>
.search-results {
    padding: var(--spacing-2xl) 0;
    min-height: 60vh;
}

.search-results .page-header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
}

.search-results .page-title {
    font-size: var(--font-size-4xl);
    margin-bottom: var(--spacing-sm);
}

.search-query {
    color: var(--color-accent-primary);
}

.results-count {
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
}

.search-form-wrapper {
    max-width: 600px;
    margin: 0 auto var(--spacing-2xl);
}

.search-results-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
}

.search-result-item {
    display: flex;
    gap: var(--spacing-lg);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.search-result-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.result-thumbnail {
    flex-shrink: 0;
    width: 200px;
}

.result-thumbnail img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: var(--radius-md);
}

.result-content {
    flex: 1;
}

.result-meta {
    display: flex;
    gap: var(--spacing-md);
    align-items: center;
    margin-bottom: var(--spacing-sm);
}

.post-type-badge {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: uppercase;
    border-radius: var(--radius-sm);
    background: var(--color-accent-primary);
    color: white;
}

.post-type-badge.simulation {
    background: var(--color-accent-primary);
}

.post-type-badge.blueprint {
    background: var(--color-accent-secondary);
}

.post-type-badge.challenge {
    background: var(--color-accent-tertiary);
}

.result-meta time {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
}

.result-title {
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-sm);
}

.result-title a {
    color: var(--color-text-primary);
}

.result-title a:hover {
    color: var(--color-accent-primary);
}

.result-excerpt {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-sm);
}

.result-details {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
}

.physics-engine,
.premium-badge {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
    border-radius: var(--radius-sm);
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
}

.premium-badge {
    background: linear-gradient(135deg, var(--color-star), var(--color-warning));
    color: #000;
}

.pagination {
    margin-top: var(--spacing-2xl);
    display: flex;
    justify-content: center;
}

.pagination .nav-links {
    display: flex;
    gap: var(--spacing-sm);
}

.pagination a,
.pagination span {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    transition: all var(--transition-fast);
}

.pagination a:hover {
    background: var(--color-accent-primary);
    color: white;
}

.pagination .current {
    background: var(--color-accent-primary);
    color: white;
}

.no-results {
    text-align: center;
    padding: var(--spacing-2xl) 0;
}

.no-results > p {
    font-size: var(--font-size-lg);
    max-width: 500px;
    margin: 0 auto var(--spacing-2xl);
}

.no-results-suggestions h2 {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--spacing-lg);
}

.simulation-grid {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-lg);
    max-width: 900px;
    margin: 0 auto;
}

.simulation-grid li a {
    display: block;
    background: var(--color-bg-secondary);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: transform var(--transition-fast);
}

.simulation-grid li a:hover {
    transform: translateY(-4px);
}

.simulation-grid img {
    width: 100%;
    height: 120px;
    object-fit: cover;
}

.simulation-grid span {
    display: block;
    padding: var(--spacing-md);
    font-weight: 500;
    color: var(--color-text-primary);
}

@media (max-width: 768px) {
    .search-result-item {
        flex-direction: column;
    }

    .result-thumbnail {
        width: 100%;
    }

    .result-thumbnail img {
        height: 200px;
    }
}
</style>

<?php
get_footer();
