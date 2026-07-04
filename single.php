<?php
/**
 * Single Post Template
 *
 * Generic template for single posts (standard blog posts).
 * Custom post types use their own templates (single-simulation.php, etc.).
 *
 * @package Infinity
 * @since 1.0.0
 */

get_header();
?>

<article id="post-<?php the_ID(); ?>" <?php post_class('single-post'); ?>>
    <?php
    while (have_posts()) :
        the_post();
    ?>
        <header class="entry-header container">
            <div class="entry-meta-top">
                <?php
                $categories = get_the_category();
                if ($categories) :
                ?>
                    <span class="post-categories">
                        <?php
                        $cat_links = array();
                        foreach ($categories as $category) {
                            $cat_links[] = '<a href="' . esc_url(get_category_link($category->term_id)) . '">' . esc_html($category->name) . '</a>';
                        }
                        echo implode(', ', $cat_links);
                        ?>
                    </span>
                <?php endif; ?>
            </div>

            <?php the_title('<h1 class="entry-title">', '</h1>'); ?>

            <div class="entry-meta">
                <div class="meta-author">
                    <?php echo get_avatar(get_the_author_meta('ID'), 40); ?>
                    <div class="meta-author-info">
                        <span class="author-name"><?php the_author(); ?></span>
                        <time datetime="<?php echo esc_attr(get_the_date('c')); ?>">
                            <?php echo esc_html(get_the_date()); ?>
                        </time>
                    </div>
                </div>
            </div>
        </header>

        <?php if (has_post_thumbnail()) : ?>
            <div class="entry-thumbnail container">
                <?php the_post_thumbnail('simulation-hero'); ?>
            </div>
        <?php endif; ?>

        <div class="entry-layout container">
            <div class="entry-content">
                <?php
                the_content();

                wp_link_pages(array(
                    'before' => '<div class="page-links">' . esc_html__('Pages:', 'infinity'),
                    'after'  => '</div>',
                ));
                ?>
            </div>
            <?php get_sidebar(); ?>
        </div>

        <footer class="entry-footer container">
            <?php
            $tags = get_the_tags();
            if ($tags) :
            ?>
                <div class="post-tags">
                    <span class="tags-label"><?php esc_html_e('Tags:', 'infinity'); ?></span>
                    <?php
                    foreach ($tags as $tag) {
                        echo '<a href="' . esc_url(get_tag_link($tag->term_id)) . '" class="tag-link">' . esc_html($tag->name) . '</a>';
                    }
                    ?>
                </div>
            <?php endif; ?>

            <?php
            // Post navigation
            the_post_navigation(array(
                'prev_text' => '<span class="nav-subtitle">' . esc_html__('Previous:', 'infinity') . '</span> <span class="nav-title">%title</span>',
                'next_text' => '<span class="nav-subtitle">' . esc_html__('Next:', 'infinity') . '</span> <span class="nav-title">%title</span>',
            ));
            ?>

            <?php if (get_edit_post_link()) : ?>
                <?php
                edit_post_link(
                    sprintf(
                        wp_kses(
                            /* translators: %s: post title */
                            __('Edit <span class="sr-only">%s</span>', 'infinity'),
                            array('span' => array('class' => array()))
                        ),
                        get_the_title()
                    ),
                    '<span class="edit-link">',
                    '</span>'
                );
                ?>
            <?php endif; ?>
        </footer>
    <?php endwhile; ?>
</article>

<style>
.single-post {
    padding: var(--spacing-2xl) 0;
}

.entry-meta-top {
    margin-bottom: var(--spacing-md);
}

.post-categories a {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-accent-primary);
    color: white;
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: uppercase;
    border-radius: var(--radius-sm);
    text-decoration: none;
    transition: background-color var(--transition-fast);
}

.post-categories a:hover {
    background: var(--color-accent-secondary);
    color: white;
}

.single-post .entry-title {
    font-size: var(--font-size-4xl);
    margin-bottom: var(--spacing-lg);
    max-width: 800px;
}

.entry-meta {
    margin-bottom: var(--spacing-xl);
}

.meta-author {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
}

.meta-author img {
    border-radius: var(--radius-full);
}

.meta-author-info {
    display: flex;
    flex-direction: column;
}

.meta-author .author-name {
    font-weight: 600;
    color: var(--color-text-primary);
}

.meta-author time {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
}

.entry-thumbnail {
    margin-bottom: var(--spacing-2xl);
    max-width: 960px;
}

.entry-thumbnail img {
    width: 100%;
    height: auto;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
}

.entry-layout {
    display: grid;
    grid-template-columns: minmax(0, 800px) 340px;
    gap: var(--spacing-2xl);
    align-items: start;
}

.entry-layout .post-sidebar {
    position: sticky;
    top: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
}

@media (max-width: 1024px) {
    .entry-layout {
        grid-template-columns: 1fr;
    }

    .entry-layout .post-sidebar {
        position: static;
        max-width: 480px;
    }
}

.single-post .entry-content {
    max-width: 800px;
    font-size: var(--font-size-lg);
    line-height: 1.8;
}

.single-post .entry-content p {
    margin-bottom: var(--spacing-lg);
}

.single-post .entry-content img {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-md);
}

.single-post .entry-content blockquote {
    border-left: 4px solid var(--color-accent-primary);
    padding: var(--spacing-md) var(--spacing-lg);
    margin: var(--spacing-xl) 0;
    background: var(--color-bg-secondary);
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.single-post .entry-content blockquote p {
    margin-bottom: 0;
    font-style: italic;
    color: var(--color-text-secondary);
}

.single-post .entry-footer {
    max-width: 800px;
    margin-top: var(--spacing-2xl);
    padding-top: var(--spacing-xl);
    border-top: 1px solid var(--color-bg-tertiary);
}

.post-tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xl);
}

.tags-label {
    font-weight: 600;
    color: var(--color-text-secondary);
}

.tag-link {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    border-radius: var(--radius-sm);
    text-decoration: none;
    border: 1px solid var(--color-bg-tertiary);
    transition: all var(--transition-fast);
}

.tag-link:hover {
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
}

.post-navigation {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-lg);
    margin-top: var(--spacing-xl);
}

.post-navigation a {
    display: block;
    padding: var(--spacing-lg);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.post-navigation a:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.nav-subtitle {
    display: block;
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    font-weight: 600;
    color: var(--color-text-tertiary);
    margin-bottom: var(--spacing-xs);
}

.nav-title {
    color: var(--color-text-primary);
    font-weight: 500;
}

.edit-link {
    display: inline-block;
    margin-top: var(--spacing-lg);
}

.edit-link a {
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
    text-decoration: none;
}

.edit-link a:hover {
    color: var(--color-accent-primary);
}

@media (max-width: 640px) {
    .post-navigation {
        grid-template-columns: 1fr;
    }
}
</style>

<?php
if (comments_open() || get_comments_number()) {
    comments_template();
}

get_footer();
