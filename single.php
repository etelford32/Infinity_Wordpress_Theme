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

        <?php
        // Header video, YouTube, animated GIF or featured image
        // (inc/post-media.php)
        infinity_the_post_header_media();
        ?>

        <?php $infinity_sidebar = infinity_sidebar_layout('post'); ?>
        <div class="<?php echo esc_attr(infinity_entry_layout_classes($infinity_sidebar)); ?> container">
            <div class="entry-content">
                <?php
                the_content();

                wp_link_pages(array(
                    'before' => '<div class="page-links">' . esc_html__('Pages:', 'infinity'),
                    'after'  => '</div>',
                ));
                ?>
            </div>
            <?php
            if ($infinity_sidebar) {
                get_sidebar(null, array('area' => $infinity_sidebar['area']));
            }
            ?>
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

<?php
// Related articles: same category, strong internal linking for SEO
$infinity_rel_cats = wp_get_post_categories(get_the_ID());
if ($infinity_rel_cats) {
    $infinity_rel = new WP_Query(array(
        'category__in'        => $infinity_rel_cats,
        'post__not_in'        => array(get_the_ID()),
        'posts_per_page'      => 3,
        'ignore_sticky_posts' => true,
    ));
    if ($infinity_rel->have_posts()) :
?>
<section class="related-posts container" aria-labelledby="related-heading">
    <h2 id="related-heading" class="related-posts-title"><?php esc_html_e('Keep reading', 'infinity'); ?></h2>
    <div class="fp-grid">
        <?php while ($infinity_rel->have_posts()) : $infinity_rel->the_post(); ?>
            <article class="fp-card">
                <?php if (has_post_thumbnail()) : ?>
                    <a class="fp-card-media" href="<?php the_permalink(); ?>" aria-hidden="true" tabindex="-1">
                        <?php the_post_thumbnail('medium_large', array('loading' => 'lazy', 'decoding' => 'async')); ?>
                    </a>
                <?php endif; ?>
                <div class="fp-card-body">
                    <?php $infinity_rel_cat = get_the_category(); if ($infinity_rel_cat) : ?>
                        <span class="fp-card-cat"><?php echo esc_html($infinity_rel_cat[0]->name); ?></span>
                    <?php endif; ?>
                    <h3 class="fp-card-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                    <time class="fp-card-date" datetime="<?php echo esc_attr(get_the_date('c')); ?>"><?php echo esc_html(get_the_date()); ?></time>
                </div>
            </article>
        <?php endwhile; wp_reset_postdata(); ?>
    </div>
</section>
<?php
    endif;
}

if (comments_open() || get_comments_number()) {
    comments_template();
}

get_footer();
