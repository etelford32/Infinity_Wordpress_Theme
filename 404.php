<?php
/**
 * 404 Error Page Template
 *
 * @package Infinity
 * @since 1.0.0
 */

get_header();
?>

<section class="error-404 not-found">
    <div class="container">
        <header class="page-header">
            <h1 class="page-title"><?php esc_html_e('Lost in Space', 'infinity'); ?></h1>
        </header>

        <div class="page-content">
            <div class="error-icon" aria-hidden="true">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="60" cy="60" r="50" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                    <circle cx="60" cy="60" r="35" stroke="currentColor" stroke-width="2" opacity="0.5"/>
                    <circle cx="60" cy="60" r="20" fill="currentColor" opacity="0.2"/>
                    <circle cx="45" cy="50" r="3" fill="currentColor"/>
                    <circle cx="75" cy="50" r="3" fill="currentColor"/>
                    <path d="M45 75 Q60 65 75 75" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
                </svg>
            </div>

            <p class="error-message">
                <?php esc_html_e('The page you\'re looking for has drifted beyond our observable universe. It might have been moved, deleted, or perhaps it never existed in this dimension.', 'infinity'); ?>
            </p>

            <div class="error-actions">
                <a href="<?php echo esc_url(home_url('/')); ?>" class="btn btn-primary">
                    <?php esc_html_e('Return to Mission Control', 'infinity'); ?>
                </a>
            </div>

            <div class="error-search">
                <p><?php esc_html_e('Or try searching for what you need:', 'infinity'); ?></p>
                <?php get_search_form(); ?>
            </div>

            <?php
            // Show some simulations to explore
            $recent_simulations = new WP_Query(array(
                'post_type'      => 'simulation',
                'posts_per_page' => 3,
                'post_status'    => 'publish',
            ));

            if ($recent_simulations->have_posts()) :
            ?>
                <div class="error-suggestions">
                    <h2><?php esc_html_e('Explore These Simulations', 'infinity'); ?></h2>
                    <ul class="simulation-list">
                        <?php
                        while ($recent_simulations->have_posts()) :
                            $recent_simulations->the_post();
                        ?>
                            <li>
                                <a href="<?php the_permalink(); ?>">
                                    <?php if (has_post_thumbnail()) : ?>
                                        <?php the_post_thumbnail('simulation-thumbnail'); ?>
                                    <?php endif; ?>
                                    <span class="simulation-title"><?php the_title(); ?></span>
                                </a>
                            </li>
                        <?php endwhile; ?>
                    </ul>
                </div>
            <?php
                wp_reset_postdata();
            endif;
            ?>
        </div>
    </div>
</section>

<style>
.error-404 {
    min-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--spacing-3xl) 0;
}

.error-404 .page-title {
    font-size: var(--font-size-5xl);
    margin-bottom: var(--spacing-lg);
    background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.error-icon {
    color: var(--color-accent-primary);
    margin-bottom: var(--spacing-xl);
}

.error-message {
    font-size: var(--font-size-lg);
    max-width: 600px;
    margin: 0 auto var(--spacing-xl);
    color: var(--color-text-secondary);
}

.error-actions {
    margin-bottom: var(--spacing-2xl);
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

.error-search {
    max-width: 500px;
    margin: 0 auto var(--spacing-2xl);
}

.error-search p {
    margin-bottom: var(--spacing-md);
}

.error-suggestions {
    margin-top: var(--spacing-2xl);
    padding-top: var(--spacing-2xl);
    border-top: 1px solid var(--color-bg-tertiary);
}

.error-suggestions h2 {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--spacing-lg);
}

.simulation-list {
    list-style: none;
    display: flex;
    gap: var(--spacing-lg);
    justify-content: center;
    flex-wrap: wrap;
}

.simulation-list li {
    flex: 0 1 250px;
}

.simulation-list a {
    display: block;
    background: var(--color-bg-secondary);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.simulation-list a:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
}

.simulation-list img {
    width: 100%;
    height: 150px;
    object-fit: cover;
}

.simulation-list .simulation-title {
    display: block;
    padding: var(--spacing-md);
    font-weight: 500;
    color: var(--color-text-primary);
}

@media (max-width: 640px) {
    .simulation-list {
        flex-direction: column;
        align-items: center;
    }
}
</style>

<?php
get_footer();
