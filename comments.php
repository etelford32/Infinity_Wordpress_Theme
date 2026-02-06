<?php
/**
 * Comments Template
 *
 * Displays comments and the comment form for posts and pages.
 *
 * @package Infinity
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/*
 * If the current post is protected by a password and the visitor
 * has not yet entered the password, return early without loading comments.
 */
if (post_password_required()) {
    return;
}
?>

<section id="comments" class="comments-area" aria-label="<?php esc_attr_e('Comments', 'infinity'); ?>">

    <?php if (have_comments()) : ?>
        <h2 class="comments-title">
            <?php
            $comment_count = get_comments_number();
            printf(
                /* translators: 1: comment count, 2: post title */
                esc_html(_nx(
                    '%1$s Comment on &ldquo;%2$s&rdquo;',
                    '%1$s Comments on &ldquo;%2$s&rdquo;',
                    $comment_count,
                    'comments title',
                    'infinity'
                )),
                number_format_i18n($comment_count),
                '<span>' . get_the_title() . '</span>'
            );
            ?>
        </h2>

        <ol class="comment-list">
            <?php
            wp_list_comments(array(
                'style'       => 'ol',
                'short_ping'  => true,
                'avatar_size' => 48,
                'callback'    => 'infinity_comment_callback',
            ));
            ?>
        </ol>

        <?php
        the_comments_navigation(array(
            'prev_text' => __('Older comments', 'infinity'),
            'next_text' => __('Newer comments', 'infinity'),
        ));
        ?>

    <?php endif; ?>

    <?php if (!comments_open() && get_comments_number() && post_type_supports(get_post_type(), 'comments')) : ?>
        <p class="no-comments"><?php esc_html_e('Comments are closed.', 'infinity'); ?></p>
    <?php endif; ?>

    <?php
    comment_form(array(
        'title_reply'        => __('Leave a Comment', 'infinity'),
        'title_reply_before' => '<h3 id="reply-title" class="comment-reply-title">',
        'title_reply_after'  => '</h3>',
        'class_form'         => 'comment-form',
        'class_submit'       => 'btn btn-primary',
        'comment_field'      => '<p class="comment-form-comment"><label for="comment">' . esc_html__('Comment', 'infinity') . ' <span class="required" aria-hidden="true">*</span></label><textarea id="comment" name="comment" cols="45" rows="6" required></textarea></p>',
    ));
    ?>

</section>

<style>
.comments-area {
    max-width: 800px;
    margin: var(--spacing-2xl) auto;
    padding: 0 var(--spacing-lg);
}

.comments-title {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-md);
    border-bottom: 2px solid var(--color-bg-tertiary);
}

.comment-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.comment-list .comment {
    padding: var(--spacing-lg) 0;
    border-bottom: 1px solid var(--color-bg-tertiary);
}

.comment-list .comment:last-child {
    border-bottom: none;
}

.comment-list .children {
    list-style: none;
    padding-left: var(--spacing-2xl);
    margin: 0;
    border-left: 2px solid var(--color-bg-tertiary);
}

.comment-body {
    position: relative;
}

.comment-meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
}

.comment-author {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.comment-author img {
    border-radius: var(--radius-full);
}

.comment-author .fn {
    font-weight: 600;
    color: var(--color-text-primary);
    font-style: normal;
}

.comment-metadata {
    font-size: var(--font-size-sm);
}

.comment-metadata a {
    color: var(--color-text-tertiary);
    text-decoration: none;
}

.comment-metadata a:hover {
    color: var(--color-accent-primary);
}

.comment-content {
    color: var(--color-text-secondary);
    line-height: 1.7;
}

.comment-content p:last-child {
    margin-bottom: 0;
}

.reply {
    margin-top: var(--spacing-sm);
}

.reply a {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-accent-primary);
    text-decoration: none;
}

.reply a:hover {
    color: var(--color-accent-secondary);
}

.comment-awaiting-moderation {
    color: var(--color-warning);
    font-size: var(--font-size-sm);
    font-style: italic;
}

.no-comments {
    text-align: center;
    color: var(--color-text-tertiary);
    padding: var(--spacing-xl) 0;
}

/* Comment Form */
.comment-reply-title {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--spacing-lg);
    margin-top: var(--spacing-xl);
}

.comment-form p {
    margin-bottom: var(--spacing-md);
}

.comment-form label {
    display: block;
    font-weight: 500;
    margin-bottom: var(--spacing-xs);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
}

.comment-form input[type="text"],
.comment-form input[type="email"],
.comment-form input[type="url"],
.comment-form textarea {
    width: 100%;
    padding: var(--spacing-md);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-bg-tertiary);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-family: var(--font-family-primary);
    font-size: var(--font-size-base);
    transition: border-color var(--transition-fast);
}

.comment-form input:focus,
.comment-form textarea:focus {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.comment-form textarea {
    resize: vertical;
    min-height: 120px;
}

.comment-form .required {
    color: var(--color-error);
}

.comment-form .btn {
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

.comment-form .btn-primary {
    background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary));
    color: white;
}

.comment-form .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-glow);
}

.comment-navigation {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-lg) 0;
    border-top: 1px solid var(--color-bg-tertiary);
    margin-top: var(--spacing-lg);
}

.comment-navigation a {
    color: var(--color-accent-primary);
    text-decoration: none;
    font-weight: 500;
}

.comment-navigation a:hover {
    color: var(--color-accent-secondary);
}
</style>

<?php
/**
 * Custom comment display callback
 *
 * @param WP_Comment $comment The comment object.
 * @param array      $args    An array of arguments.
 * @param int        $depth   Depth of the current comment.
 */
function infinity_comment_callback($comment, $args, $depth) {
    $tag = ('div' === $args['style']) ? 'div' : 'li';
    ?>
    <<?php echo $tag; ?> id="comment-<?php comment_ID(); ?>" <?php comment_class(empty($args['has_children']) ? '' : 'parent', $comment); ?>>
        <article id="div-comment-<?php comment_ID(); ?>" class="comment-body">
            <footer class="comment-meta">
                <div class="comment-author vcard">
                    <?php
                    if (0 !== $args['avatar_size']) {
                        echo get_avatar($comment, $args['avatar_size']);
                    }
                    printf('<cite class="fn">%s</cite>', get_comment_author_link($comment));
                    ?>
                </div>

                <div class="comment-metadata">
                    <a href="<?php echo esc_url(get_comment_link($comment, $args)); ?>">
                        <time datetime="<?php comment_time('c'); ?>">
                            <?php
                            printf(
                                /* translators: 1: date, 2: time */
                                esc_html__('%1$s at %2$s', 'infinity'),
                                get_comment_date('', $comment),
                                get_comment_time()
                            );
                            ?>
                        </time>
                    </a>
                    <?php edit_comment_link(esc_html__('Edit', 'infinity'), '<span class="edit-link">', '</span>'); ?>
                </div>
            </footer>

            <?php if ('0' === $comment->comment_approved) : ?>
                <em class="comment-awaiting-moderation"><?php esc_html_e('Your comment is awaiting moderation.', 'infinity'); ?></em>
            <?php endif; ?>

            <div class="comment-content">
                <?php comment_text(); ?>
            </div>

            <?php
            comment_reply_link(array_merge($args, array(
                'add_below' => 'div-comment',
                'depth'     => $depth,
                'max_depth' => $args['max_depth'],
                'before'    => '<div class="reply">',
                'after'     => '</div>',
            )));
            ?>
        </article>
    <?php
}
