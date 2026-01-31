<?php
/**
 * Archive Template
 *
 * Displays archive pages for posts, custom post types, and taxonomies.
 *
 * @package Infinity
 * @since 1.0.0
 */

get_header();
?>

<section class="archive-page">
    <div class="container">
        <header class="archive-header">
            <?php
            the_archive_title('<h1 class="archive-title">', '</h1>');
            the_archive_description('<div class="archive-description">', '</div>');
            ?>

            <?php
            // Show filter options for simulations
            if (is_post_type_archive('simulation') || is_tax('simulation_category') || is_tax('physics_engine') || is_tax('difficulty_level')) :
            ?>
                <div class="archive-filters">
                    <?php
                    // Difficulty filter
                    $difficulties = get_terms(array(
                        'taxonomy'   => 'difficulty_level',
                        'hide_empty' => true,
                    ));

                    if (!empty($difficulties) && !is_wp_error($difficulties)) :
                    ?>
                        <div class="filter-group">
                            <label for="difficulty-filter"><?php esc_html_e('Difficulty:', 'infinity'); ?></label>
                            <select id="difficulty-filter" onchange="if(this.value) window.location.href=this.value;">
                                <option value=""><?php esc_html_e('All Levels', 'infinity'); ?></option>
                                <?php foreach ($difficulties as $difficulty) : ?>
                                    <option value="<?php echo esc_url(get_term_link($difficulty)); ?>" <?php selected(is_tax('difficulty_level', $difficulty->slug)); ?>>
                                        <?php echo esc_html($difficulty->name); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    <?php endif; ?>

                    <?php
                    // Physics engine filter
                    $engines = get_terms(array(
                        'taxonomy'   => 'physics_engine',
                        'hide_empty' => true,
                    ));

                    if (!empty($engines) && !is_wp_error($engines)) :
                    ?>
                        <div class="filter-group">
                            <label for="engine-filter"><?php esc_html_e('Engine:', 'infinity'); ?></label>
                            <select id="engine-filter" onchange="if(this.value) window.location.href=this.value;">
                                <option value=""><?php esc_html_e('All Engines', 'infinity'); ?></option>
                                <?php foreach ($engines as $engine) : ?>
                                    <option value="<?php echo esc_url(get_term_link($engine)); ?>" <?php selected(is_tax('physics_engine', $engine->slug)); ?>>
                                        <?php echo esc_html($engine->name); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </header>

        <?php if (have_posts()) : ?>
            <div class="archive-grid">
                <?php
                while (have_posts()) :
                    the_post();
                    $post_type = get_post_type();
                ?>
                    <article id="post-<?php the_ID(); ?>" <?php post_class('archive-item'); ?>>
                        <a href="<?php the_permalink(); ?>" class="archive-item-link">
                            <?php if (has_post_thumbnail()) : ?>
                                <div class="item-thumbnail">
                                    <?php the_post_thumbnail('simulation-thumbnail'); ?>
                                    <?php
                                    // Overlay badges
                                    if ($post_type === 'simulation') :
                                        $is_premium = get_post_meta(get_the_ID(), 'is_premium', true);
                                        if ($is_premium) :
                                    ?>
                                            <span class="premium-overlay"><?php esc_html_e('Premium', 'infinity'); ?></span>
                                    <?php
                                        endif;
                                    endif;
                                    ?>
                                </div>
                            <?php else : ?>
                                <div class="item-thumbnail placeholder">
                                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                        <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" opacity="0.5"/>
                                        <circle cx="24" cy="24" r="8" fill="currentColor" opacity="0.3"/>
                                    </svg>
                                </div>
                            <?php endif; ?>

                            <div class="item-content">
                                <h2 class="item-title"><?php the_title(); ?></h2>

                                <?php if ($post_type === 'simulation') : ?>
                                    <div class="item-meta">
                                        <?php
                                        $difficulty = get_the_terms(get_the_ID(), 'difficulty_level');
                                        if ($difficulty && !is_wp_error($difficulty)) :
                                        ?>
                                            <span class="difficulty-badge"><?php echo esc_html($difficulty[0]->name); ?></span>
                                        <?php endif; ?>

                                        <?php
                                        $play_count = get_post_meta(get_the_ID(), 'play_count', true);
                                        if ($play_count) :
                                        ?>
                                            <span class="play-count">
                                                <?php printf(esc_html__('%s plays', 'infinity'), number_format_i18n($play_count)); ?>
                                            </span>
                                        <?php endif; ?>
                                    </div>
                                <?php elseif ($post_type === 'blueprint') : ?>
                                    <div class="item-meta">
                                        <?php
                                        $vote_count = get_post_meta(get_the_ID(), 'vote_count', true);
                                        if ($vote_count) :
                                        ?>
                                            <span class="vote-count">
                                                <?php printf(esc_html__('%s votes', 'infinity'), number_format_i18n($vote_count)); ?>
                                            </span>
                                        <?php endif; ?>
                                    </div>
                                <?php elseif ($post_type === 'challenge') : ?>
                                    <div class="item-meta">
                                        <?php
                                        $completion_count = get_post_meta(get_the_ID(), 'completion_count', true);
                                        if ($completion_count) :
                                        ?>
                                            <span class="completion-count">
                                                <?php printf(esc_html__('%s completions', 'infinity'), number_format_i18n($completion_count)); ?>
                                            </span>
                                        <?php endif; ?>
                                    </div>
                                <?php else : ?>
                                    <div class="item-meta">
                                        <time datetime="<?php echo esc_attr(get_the_date('c')); ?>">
                                            <?php echo esc_html(get_the_date()); ?>
                                        </time>
                                    </div>
                                <?php endif; ?>

                                <div class="item-excerpt">
                                    <?php echo wp_trim_words(get_the_excerpt(), 15); ?>
                                </div>
                            </div>
                        </a>
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
            <div class="no-posts">
                <p><?php esc_html_e('No items found. Check back later for new content!', 'infinity'); ?></p>
                <a href="<?php echo esc_url(home_url('/')); ?>" class="btn btn-primary">
                    <?php esc_html_e('Return Home', 'infinity'); ?>
                </a>
            </div>
        <?php endif; ?>
    </div>
</section>

<style>
.archive-page {
    padding: var(--spacing-2xl) 0;
    min-height: 60vh;
}

.archive-header {
    text-align: center;
    margin-bottom: var(--spacing-2xl);
}

.archive-title {
    font-size: var(--font-size-4xl);
    margin-bottom: var(--spacing-md);
}

.archive-description {
    max-width: 600px;
    margin: 0 auto var(--spacing-lg);
    color: var(--color-text-secondary);
}

.archive-filters {
    display: flex;
    gap: var(--spacing-lg);
    justify-content: center;
    flex-wrap: wrap;
    padding: var(--spacing-lg);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-lg);
    max-width: 600px;
    margin: 0 auto;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.filter-group label {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
}

.filter-group select {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-primary);
    color: var(--color-text-primary);
    background-color: var(--color-bg-tertiary);
    border: 1px solid var(--color-bg-tertiary);
    border-radius: var(--radius-md);
    cursor: pointer;
}

.filter-group select:focus {
    outline: none;
    border-color: var(--color-accent-primary);
}

.archive-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-lg);
}

.archive-item {
    background: var(--color-bg-secondary);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.archive-item:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
}

.archive-item-link {
    display: block;
    color: inherit;
    text-decoration: none;
}

.item-thumbnail {
    position: relative;
    height: 180px;
    overflow: hidden;
}

.item-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition-base);
}

.archive-item:hover .item-thumbnail img {
    transform: scale(1.05);
}

.item-thumbnail.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-tertiary);
    color: var(--color-text-tertiary);
}

.premium-overlay {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
    font-weight: 600;
    background: linear-gradient(135deg, var(--color-star), var(--color-warning));
    color: #000;
    border-radius: var(--radius-sm);
}

.item-content {
    padding: var(--spacing-lg);
}

.item-title {
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-sm);
    color: var(--color-text-primary);
}

.item-meta {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
    margin-bottom: var(--spacing-sm);
}

.difficulty-badge,
.play-count,
.vote-count,
.completion-count {
    font-size: var(--font-size-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
}

.item-excerpt {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    line-height: 1.5;
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

.no-posts {
    text-align: center;
    padding: var(--spacing-3xl) 0;
}

.no-posts p {
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-xl);
}

.btn {
    display: inline-block;
    padding: var(--spacing-md) var(--spacing-xl);
    border-radius: var(--radius-md);
    font-weight: 600;
    text-decoration: none;
    transition: all var(--transition-fast);
}

.btn-primary {
    background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary));
    color: white;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-glow);
    color: white;
}

@media (max-width: 640px) {
    .archive-filters {
        flex-direction: column;
        align-items: stretch;
    }

    .filter-group {
        justify-content: space-between;
    }

    .filter-group select {
        flex: 1;
    }
}
</style>

<?php
get_footer();
