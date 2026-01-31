<?php
/**
 * Single Blueprint Template
 *
 * Displays user-created simulation blueprints.
 *
 * @package Infinity
 * @since 1.0.0
 */

get_header();
?>

<article id="post-<?php the_ID(); ?>" <?php post_class('blueprint-single'); ?>>
    <header class="entry-header container">
        <div class="blueprint-header-content">
            <div class="blueprint-meta-top">
                <?php
                $visibility = get_post_meta(get_the_ID(), 'visibility', true) ?: 'public';
                $visibility_labels = array(
                    'public'   => __('Public', 'infinity'),
                    'private'  => __('Private', 'infinity'),
                    'unlisted' => __('Unlisted', 'infinity'),
                );
                ?>
                <span class="visibility-badge <?php echo esc_attr($visibility); ?>">
                    <?php echo esc_html($visibility_labels[$visibility] ?? $visibility); ?>
                </span>

                <?php
                $base_simulation = get_post_meta(get_the_ID(), 'base_simulation', true);
                if ($base_simulation) :
                    $base_sim_post = get_post($base_simulation);
                    if ($base_sim_post) :
                ?>
                    <span class="base-simulation">
                        <?php esc_html_e('Based on:', 'infinity'); ?>
                        <a href="<?php echo esc_url(get_permalink($base_simulation)); ?>">
                            <?php echo esc_html($base_sim_post->post_title); ?>
                        </a>
                    </span>
                <?php
                    endif;
                endif;
                ?>
            </div>

            <?php the_title('<h1 class="entry-title">', '</h1>'); ?>

            <div class="blueprint-author">
                <?php echo get_avatar(get_the_author_meta('ID'), 40); ?>
                <div class="author-info">
                    <span class="author-name">
                        <?php
                        printf(
                            /* translators: %s: author name */
                            esc_html__('Created by %s', 'infinity'),
                            '<strong>' . get_the_author() . '</strong>'
                        );
                        ?>
                    </span>
                    <time datetime="<?php echo esc_attr(get_the_date('c')); ?>">
                        <?php echo esc_html(get_the_date()); ?>
                    </time>
                </div>
            </div>

            <div class="blueprint-stats">
                <?php
                $vote_count = get_post_meta(get_the_ID(), 'vote_count', true) ?: 0;
                $fork_count = get_post_meta(get_the_ID(), 'fork_count', true) ?: 0;
                ?>
                <div class="stat-item votes">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M10 3L12.5 8H17.5L13.5 11.5L15 17L10 13.5L5 17L6.5 11.5L2.5 8H7.5L10 3Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    </svg>
                    <span><?php echo esc_html(number_format_i18n($vote_count)); ?></span>
                    <span class="stat-label"><?php esc_html_e('votes', 'infinity'); ?></span>
                </div>
                <div class="stat-item forks">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <circle cx="10" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/>
                        <circle cx="5" cy="16" r="2" stroke="currentColor" stroke-width="1.5"/>
                        <circle cx="15" cy="16" r="2" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M10 6V10M10 10L5 14M10 10L15 14" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    <span><?php echo esc_html(number_format_i18n($fork_count)); ?></span>
                    <span class="stat-label"><?php esc_html_e('forks', 'infinity'); ?></span>
                </div>
            </div>
        </div>
    </header>

    <?php if (has_post_thumbnail()) : ?>
        <div class="blueprint-preview container">
            <?php the_post_thumbnail('blueprint-preview'); ?>
        </div>
    <?php endif; ?>

    <div class="blueprint-actions container">
        <?php if (is_user_logged_in()) : ?>
            <button type="button" class="btn btn-primary" id="launch-blueprint" data-blueprint-id="<?php the_ID(); ?>">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <polygon points="5,3 17,10 5,17" fill="currentColor"/>
                </svg>
                <?php esc_html_e('Launch Simulation', 'infinity'); ?>
            </button>

            <button type="button" class="btn btn-secondary" id="vote-blueprint" data-blueprint-id="<?php the_ID(); ?>">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M10 3L12.5 8H17.5L13.5 11.5L15 17L10 13.5L5 17L6.5 11.5L2.5 8H7.5L10 3Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                </svg>
                <?php esc_html_e('Vote', 'infinity'); ?>
            </button>

            <button type="button" class="btn btn-secondary" id="fork-blueprint" data-blueprint-id="<?php the_ID(); ?>">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="10" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="5" cy="16" r="2" stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="15" cy="16" r="2" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M10 6V10M10 10L5 14M10 10L15 14" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <?php esc_html_e('Fork', 'infinity'); ?>
            </button>
        <?php else : ?>
            <p class="login-prompt">
                <a href="<?php echo esc_url(wp_login_url(get_permalink())); ?>">
                    <?php esc_html_e('Log in to interact with this blueprint', 'infinity'); ?>
                </a>
            </p>
        <?php endif; ?>
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

    <?php
    // Show blueprint configuration if available
    $blueprint_config = get_post_meta(get_the_ID(), 'blueprint_config', true);
    if ($blueprint_config) :
    ?>
        <div class="blueprint-config container">
            <h2><?php esc_html_e('Configuration', 'infinity'); ?></h2>
            <pre><code><?php echo esc_html(json_encode(json_decode($blueprint_config), JSON_PRETTY_PRINT)); ?></code></pre>
        </div>
    <?php endif; ?>

    <footer class="entry-footer container">
        <?php
        // Show related blueprints
        $related_blueprints = new WP_Query(array(
            'post_type'      => 'blueprint',
            'posts_per_page' => 3,
            'post__not_in'   => array(get_the_ID()),
            'meta_query'     => array(
                array(
                    'key'   => 'base_simulation',
                    'value' => $base_simulation,
                ),
            ),
        ));

        if ($related_blueprints->have_posts()) :
        ?>
            <div class="related-blueprints">
                <h2><?php esc_html_e('Related Blueprints', 'infinity'); ?></h2>
                <div class="blueprint-grid">
                    <?php
                    while ($related_blueprints->have_posts()) :
                        $related_blueprints->the_post();
                    ?>
                        <a href="<?php the_permalink(); ?>" class="blueprint-card">
                            <?php if (has_post_thumbnail()) : ?>
                                <?php the_post_thumbnail('simulation-thumbnail'); ?>
                            <?php endif; ?>
                            <span class="blueprint-card-title"><?php the_title(); ?></span>
                            <span class="blueprint-card-author"><?php the_author(); ?></span>
                        </a>
                    <?php endwhile; ?>
                </div>
            </div>
        <?php
            wp_reset_postdata();
        endif;
        ?>
    </footer>
</article>

<style>
.blueprint-single {
    padding: var(--spacing-2xl) 0;
}

.blueprint-header-content {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
}

.blueprint-meta-top {
    display: flex;
    justify-content: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
    flex-wrap: wrap;
}

.visibility-badge {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: uppercase;
    border-radius: var(--radius-sm);
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
}

.visibility-badge.public {
    background: var(--color-success);
    color: white;
}

.visibility-badge.private {
    background: var(--color-error);
    color: white;
}

.visibility-badge.unlisted {
    background: var(--color-warning);
    color: #000;
}

.base-simulation {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
}

.base-simulation a {
    color: var(--color-accent-primary);
}

.entry-title {
    font-size: var(--font-size-4xl);
    margin-bottom: var(--spacing-lg);
}

.blueprint-author {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.blueprint-author img {
    border-radius: var(--radius-full);
}

.author-info {
    text-align: left;
}

.author-name {
    display: block;
    color: var(--color-text-secondary);
}

.author-info time {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
}

.blueprint-stats {
    display: flex;
    justify-content: center;
    gap: var(--spacing-xl);
}

.stat-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--color-text-secondary);
}

.stat-item svg {
    color: var(--color-accent-primary);
}

.stat-item span:first-of-type {
    font-weight: 600;
    font-size: var(--font-size-lg);
    color: var(--color-text-primary);
}

.stat-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
}

.blueprint-preview {
    max-width: 800px;
    margin: var(--spacing-xl) auto;
    text-align: center;
}

.blueprint-preview img {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
}

.blueprint-actions {
    display: flex;
    justify-content: center;
    gap: var(--spacing-md);
    margin: var(--spacing-xl) auto;
    max-width: 800px;
    flex-wrap: wrap;
}

.btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-xl);
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: var(--font-size-base);
    font-family: var(--font-family-primary);
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.btn-primary {
    background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary));
    color: white;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-glow);
}

.btn-secondary {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 2px solid var(--color-bg-tertiary);
}

.btn-secondary:hover {
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
}

.login-prompt {
    text-align: center;
}

.login-prompt a {
    color: var(--color-accent-primary);
}

.entry-content {
    max-width: 800px;
    margin: var(--spacing-xl) auto;
}

.blueprint-config {
    max-width: 800px;
    margin: var(--spacing-xl) auto;
}

.blueprint-config h2 {
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-md);
}

.blueprint-config pre {
    background: var(--color-bg-secondary);
    padding: var(--spacing-lg);
    border-radius: var(--radius-md);
    overflow-x: auto;
}

.blueprint-config code {
    background: none;
    padding: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
}

.entry-footer {
    max-width: 800px;
    margin: var(--spacing-2xl) auto 0;
    padding-top: var(--spacing-2xl);
    border-top: 1px solid var(--color-bg-tertiary);
}

.related-blueprints h2 {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--spacing-lg);
    text-align: center;
}

.blueprint-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-lg);
}

.blueprint-card {
    display: block;
    background: var(--color-bg-secondary);
    border-radius: var(--radius-lg);
    overflow: hidden;
    text-decoration: none;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.blueprint-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
}

.blueprint-card img {
    width: 100%;
    height: 120px;
    object-fit: cover;
}

.blueprint-card-title {
    display: block;
    padding: var(--spacing-md) var(--spacing-md) var(--spacing-xs);
    font-weight: 600;
    color: var(--color-text-primary);
}

.blueprint-card-author {
    display: block;
    padding: 0 var(--spacing-md) var(--spacing-md);
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
}

@media (max-width: 640px) {
    .blueprint-actions {
        flex-direction: column;
    }

    .btn {
        justify-content: center;
    }
}
</style>

<?php
if (comments_open() || get_comments_number()) {
    comments_template();
}

get_footer();
