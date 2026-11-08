<?php
/**
 * Admin post list UX
 *
 * Makes the wp-admin post list tables (Posts, Pages, Simulations,
 * Blueprints, Challenges and any other post type with a list screen)
 * easier to work with:
 *
 * - Column headers can be resized (drag the right edge of a header,
 *   double-click it to reset) and reordered (drag a header onto another).
 *   Layout is saved per user, per screen, in user meta, and printed
 *   server-side so the table renders at the right widths with no flash.
 * - Screen Options gains "Compact rows" and "Reset column layout".
 * - Extra columns: featured image, word count + reading time, last
 *   modified (with who modified it) and post ID. ID is hidden by default;
 *   all of them can be toggled in Screen Options.
 * - Duplicate as draft: row action and bulk action.
 * - Copy link row action, author filter dropdown, coloured status edge on
 *   drafts / pending / scheduled / private rows, sticky table header.
 * - Keyboard shortcuts on list screens: "/" search, "n" add new.
 * - Dashboard widget "Content pipeline": drafts, pending review and
 *   scheduled posts at a glance.
 *
 * @package Infinity
 * @since 3.7.0
 */

if (!defined('ABSPATH')) {
    exit;
}

const INFINITY_LIST_LAYOUT_META = 'infinity_list_layout';

/**
 * Is this screen a post list table (edit.php)?
 *
 * @param WP_Screen|null $screen Screen, defaults to the current one.
 * @return bool
 */
function infinity_admin_is_list_screen($screen = null) {
    if (null === $screen && function_exists('get_current_screen')) {
        $screen = get_current_screen();
    }
    return $screen instanceof WP_Screen && 'edit' === $screen->base && !empty($screen->post_type);
}

/* -------------------------------------------------------------------------
 * Saved layout (widths, order, density)
 * ---------------------------------------------------------------------- */

/**
 * Get the saved layout for one screen.
 *
 * @param string $screen_id Screen id, e.g. "edit-post".
 * @return array{widths: array<string,int>, order: string[], compact: bool}
 */
function infinity_get_list_layout($screen_id) {
    $all    = get_user_meta(get_current_user_id(), INFINITY_LIST_LAYOUT_META, true);
    $layout = (is_array($all) && isset($all[$screen_id]) && is_array($all[$screen_id])) ? $all[$screen_id] : array();

    return array(
        'widths'  => isset($layout['widths']) && is_array($layout['widths']) ? $layout['widths'] : array(),
        'order'   => isset($layout['order']) && is_array($layout['order']) ? $layout['order'] : array(),
        'compact' => !empty($layout['compact']),
    );
}

/**
 * Sanitize a layout coming from the browser.
 *
 * @param array $raw Raw layout.
 * @return array
 */
function infinity_sanitize_list_layout($raw) {
    $clean = array('widths' => array(), 'order' => array(), 'compact' => false);

    if (isset($raw['widths']) && is_array($raw['widths'])) {
        foreach ($raw['widths'] as $col => $px) {
            $col = sanitize_key($col);
            $px  = (int) $px;
            if ('' !== $col && 'cb' !== $col && $px > 0) {
                $clean['widths'][$col] = max(40, min(1600, $px));
            }
        }
    }

    if (isset($raw['order']) && is_array($raw['order'])) {
        foreach ($raw['order'] as $col) {
            $col = sanitize_key($col);
            if ('' !== $col && 'cb' !== $col && !in_array($col, $clean['order'], true)) {
                $clean['order'][] = $col;
            }
        }
        $clean['order'] = array_slice($clean['order'], 0, 60);
    }

    $clean['compact'] = !empty($raw['compact']);

    return $clean;
}

/**
 * AJAX: save (or reset) the layout of one list screen.
 */
function infinity_ajax_save_list_layout() {
    check_ajax_referer('infinity_list_layout', 'nonce');

    if (!current_user_can('edit_posts')) {
        wp_send_json_error(array('message' => 'forbidden'), 403);
    }

    $screen_id = isset($_POST['screen']) ? sanitize_key(wp_unslash($_POST['screen'])) : '';
    if (0 !== strpos($screen_id, 'edit-')) {
        wp_send_json_error(array('message' => 'bad screen'), 400);
    }

    $user_id = get_current_user_id();
    $all     = get_user_meta($user_id, INFINITY_LIST_LAYOUT_META, true);
    $all     = is_array($all) ? $all : array();

    if (!empty($_POST['reset'])) {
        unset($all[$screen_id]);
    } else {
        $raw = isset($_POST['layout']) ? json_decode(wp_unslash($_POST['layout']), true) : null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized below.
        if (!is_array($raw)) {
            wp_send_json_error(array('message' => 'bad layout'), 400);
        }
        $all[$screen_id] = infinity_sanitize_list_layout($raw);
    }

    update_user_meta($user_id, INFINITY_LIST_LAYOUT_META, $all);
    wp_send_json_success();
}
add_action('wp_ajax_infinity_save_list_layout', 'infinity_ajax_save_list_layout');

/**
 * Apply the saved column order. Runs last so columns added by plugins are
 * known; anything not in the saved order keeps its place after the saved
 * ones, and the checkbox column always stays first.
 *
 * @param array $columns Column key => label.
 * @return array
 */
function infinity_apply_column_order($columns) {
    $screen = get_current_screen();
    if (!$screen) {
        return $columns;
    }

    $order = infinity_get_list_layout($screen->id)['order'];
    if (empty($order)) {
        return $columns;
    }

    $sorted = array();
    if (isset($columns['cb'])) {
        $sorted['cb'] = $columns['cb'];
    }
    foreach ($order as $key) {
        if (isset($columns[$key])) {
            $sorted[$key] = $columns[$key];
        }
    }
    foreach ($columns as $key => $label) {
        if (!isset($sorted[$key])) {
            $sorted[$key] = $label;
        }
    }

    return $sorted;
}

/**
 * Hook the per-screen filters once the screen is known.
 *
 * @param WP_Screen $screen Current screen.
 */
function infinity_admin_list_screen_hooks($screen) {
    if (!infinity_admin_is_list_screen($screen)) {
        return;
    }

    add_filter("manage_{$screen->id}_columns", 'infinity_apply_column_order', PHP_INT_MAX);
    add_filter("manage_{$screen->id}_sortable_columns", 'infinity_admin_sortable_columns');
    add_filter("bulk_actions-{$screen->id}", 'infinity_register_duplicate_bulk_action');
    add_filter("handle_bulk_actions-{$screen->id}", 'infinity_handle_duplicate_bulk_action', 10, 3);
    add_action('admin_head', 'infinity_print_list_layout_css');
    infinity_admin_list_help_tab($screen);
}
add_action('current_screen', 'infinity_admin_list_screen_hooks');

/**
 * Print saved widths as CSS so the first paint is already right. Widths
 * only apply on desktop: below 783px WordPress stacks rows into cards.
 */
function infinity_print_list_layout_css() {
    $screen = get_current_screen();
    $widths = infinity_get_list_layout($screen->id)['widths'];

    echo '<style id="infinity-list-layout-css">';
    if ($widths) {
        echo '@media screen and (min-width:783px){';
        foreach ($widths as $col => $px) {
            printf('table.wp-list-table .column-%1$s{width:%2$dpx}', esc_attr(sanitize_html_class($col)), (int) $px);
        }
        echo '}';
    }
    echo '</style>';
}

/**
 * Screen Options additions: compact rows, reset layout.
 *
 * @param string    $settings Existing screen settings HTML.
 * @param WP_Screen $screen   Screen.
 * @return string
 */
function infinity_list_screen_settings($settings, $screen) {
    if (!infinity_admin_is_list_screen($screen)) {
        return $settings;
    }

    $layout = infinity_get_list_layout($screen->id);

    ob_start();
    ?>
    <fieldset class="metabox-prefs infinity-list-prefs">
        <legend><?php esc_html_e('Table layout', 'infinity'); ?></legend>
        <label for="infinity-compact-rows">
            <input type="checkbox" id="infinity-compact-rows" <?php checked($layout['compact']); ?> />
            <?php esc_html_e('Compact rows', 'infinity'); ?>
        </label>
        <button type="button" class="button button-small" id="infinity-reset-layout">
            <?php esc_html_e('Reset column widths & order', 'infinity'); ?>
        </button>
        <p class="description">
            <?php esc_html_e('Drag a column header\'s right edge to resize it (double-click the edge to reset that column). Drag a header onto another to reorder.', 'infinity'); ?>
        </p>
    </fieldset>
    <?php
    return $settings . ob_get_clean();
}
add_filter('screen_settings', 'infinity_list_screen_settings', 10, 2);

/**
 * Contextual help tab describing the list tools.
 *
 * @param WP_Screen $screen Screen.
 */
function infinity_admin_list_help_tab($screen) {
    $screen->add_help_tab(array(
        'id'      => 'infinity-list-tools',
        'title'   => __('Infinity list tools', 'infinity'),
        'content' =>
            '<p><strong>' . esc_html__('Columns', 'infinity') . '</strong> — ' .
            esc_html__('drag the right edge of a header to resize, double-click the edge to reset it, drag a header onto another to reorder. Your layout is remembered per screen. Show or hide columns and reset the layout from Screen Options.', 'infinity') . '</p>' .
            '<p><strong>' . esc_html__('Duplicate', 'infinity') . '</strong> — ' .
            esc_html__('"Duplicate" in a row\'s actions (or the bulk actions menu) makes a draft copy with the same content, terms, featured image and custom fields. Counters such as plays and votes start from zero.', 'infinity') . '</p>' .
            '<p><strong>' . esc_html__('Shortcuts', 'infinity') . '</strong> — ' .
            esc_html__('/ focuses search, n adds a new item, Esc leaves the search box.', 'infinity') . '</p>',
    ));
}

/* -------------------------------------------------------------------------
 * Extra columns
 * ---------------------------------------------------------------------- */

/**
 * Add the theme's columns to every post list table.
 *
 * @param array  $columns   Columns.
 * @param string $post_type Post type (absent for the pages filter).
 * @return array
 */
function infinity_admin_add_columns($columns, $post_type = 'page') {
    $out = array();
    foreach ($columns as $key => $label) {
        if ('title' === $key && post_type_supports($post_type, 'thumbnail')) {
            $out['infinity_thumb'] = '<span class="dashicons dashicons-format-image" aria-hidden="true"></span><span class="screen-reader-text">' . esc_html__('Featured image', 'infinity') . '</span>';
        }
        $out[$key] = $label;
        if ('title' === $key && post_type_supports($post_type, 'editor')) {
            $out['infinity_words'] = esc_html__('Length', 'infinity');
        }
    }

    $out['infinity_modified'] = esc_html__('Last modified', 'infinity');
    $out['infinity_id']       = esc_html__('ID', 'infinity');

    return $out;
}
add_filter('manage_posts_columns', 'infinity_admin_add_columns', 20, 2);
add_filter('manage_pages_columns', 'infinity_admin_add_columns', 20);

/**
 * Render the theme's columns.
 *
 * @param string $column  Column key.
 * @param int    $post_id Post ID.
 */
function infinity_admin_render_column($column, $post_id) {
    switch ($column) {
        case 'infinity_thumb':
            $thumb = get_the_post_thumbnail($post_id, array(60, 60), array('class' => 'infinity-list-thumb', 'loading' => 'lazy'));
            if ($thumb && current_user_can('edit_post', $post_id)) {
                printf('<a href="%s">%s</a>', esc_url(get_edit_post_link($post_id)), $thumb); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core markup.
            } elseif ($thumb) {
                echo $thumb; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core markup.
            } else {
                echo '<span class="infinity-list-thumb is-empty" aria-label="' . esc_attr__('No featured image', 'infinity') . '"></span>';
            }
            break;

        case 'infinity_words':
            $text  = wp_strip_all_tags(strip_shortcodes(get_post_field('post_content', $post_id)));
            $words = preg_match_all('/[\p{L}\p{N}][\p{L}\p{N}\'’-]*/u', $text);
            $words = $words ? $words : 0;
            if (0 === $words) {
                echo '<span aria-hidden="true">—</span><span class="screen-reader-text">' . esc_html__('Empty', 'infinity') . '</span>';
                break;
            }
            $minutes = max(1, (int) round($words / 225));
            printf(
                '<span class="infinity-words">%1$s</span><br><span class="infinity-muted">%2$s</span>',
                /* translators: %s: number of words */
                esc_html(sprintf(_n('%s word', '%s words', $words, 'infinity'), number_format_i18n($words))),
                /* translators: %d: minutes */
                esc_html(sprintf(_n('%d min read', '%d min read', $minutes, 'infinity'), $minutes))
            );
            break;

        case 'infinity_modified':
            $post     = get_post($post_id);
            $time     = get_post_modified_time('U', true, $post);
            $editor   = (int) get_post_meta($post_id, '_edit_last', true);
            $user     = $editor ? get_userdata($editor) : null;
            $relative = (time() - $time) < WEEK_IN_SECONDS
                /* translators: %s: human time difference */
                ? sprintf(__('%s ago', 'infinity'), human_time_diff($time))
                : get_post_modified_time(get_option('date_format'), false, $post, true);

            printf(
                '<time datetime="%1$s" title="%2$s">%3$s</time>',
                esc_attr(gmdate('c', $time)),
                esc_attr(get_post_modified_time(get_option('date_format') . ' ' . get_option('time_format'), false, $post, true)),
                esc_html($relative)
            );
            if ($user) {
                /* translators: %s: user display name */
                echo '<br><span class="infinity-muted">' . esc_html(sprintf(__('by %s', 'infinity'), $user->display_name)) . '</span>';
            }
            break;

        case 'infinity_id':
            echo '<code>' . (int) $post_id . '</code>';
            break;
    }
}
add_action('manage_posts_custom_column', 'infinity_admin_render_column', 10, 2);
add_action('manage_pages_custom_column', 'infinity_admin_render_column', 10, 2);

/**
 * Make Last modified and ID sortable (both are native WP_Query orderby).
 *
 * @param array $columns Sortable columns.
 * @return array
 */
function infinity_admin_sortable_columns($columns) {
    $columns['infinity_modified'] = array('modified', true);
    $columns['infinity_id']       = array('ID', true);
    return $columns;
}

/**
 * Hide the ID column until the user turns it on.
 *
 * @param string[]  $hidden Hidden columns.
 * @param WP_Screen $screen Screen.
 * @return string[]
 */
function infinity_admin_default_hidden_columns($hidden, $screen) {
    if (infinity_admin_is_list_screen($screen)) {
        $hidden[] = 'infinity_id';
    }
    return $hidden;
}
add_filter('default_hidden_columns', 'infinity_admin_default_hidden_columns', 10, 2);

/* -------------------------------------------------------------------------
 * Author filter
 * ---------------------------------------------------------------------- */

/**
 * Author dropdown above the table, for people who can see others' posts.
 *
 * @param string $post_type Post type.
 */
function infinity_admin_author_filter($post_type) {
    $pto = get_post_type_object($post_type);
    if (!$pto || !post_type_supports($post_type, 'author') || !current_user_can($pto->cap->edit_others_posts)) {
        return;
    }

    $selected = isset($_GET['author']) ? (int) $_GET['author'] : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only filter.

    echo '<label class="screen-reader-text" for="infinity-filter-author">' . esc_html__('Filter by author', 'infinity') . '</label>';
    wp_dropdown_users(array(
        'name'            => 'author',
        'id'              => 'infinity-filter-author',
        'selected'        => $selected,
        'show_option_all' => __('All authors', 'infinity'),
        'capability'      => array($pto->cap->edit_posts),
        'orderby'         => 'display_name',
    ));
}
add_action('restrict_manage_posts', 'infinity_admin_author_filter');

/* -------------------------------------------------------------------------
 * Row actions: duplicate, copy link
 * ---------------------------------------------------------------------- */

/**
 * Can the current user duplicate this post?
 *
 * @param WP_Post $post Post.
 * @return bool
 */
function infinity_can_duplicate_post($post) {
    $pto = get_post_type_object($post->post_type);
    return $pto
        && 'trash' !== $post->post_status
        && current_user_can('edit_post', $post->ID)
        && current_user_can($pto->cap->create_posts);
}

/**
 * Add Duplicate and Copy link to row actions.
 *
 * @param string[] $actions Row actions.
 * @param WP_Post  $post    Post.
 * @return string[]
 */
function infinity_admin_row_actions($actions, $post) {
    if (infinity_can_duplicate_post($post)) {
        $url = wp_nonce_url(
            admin_url('admin-post.php?action=infinity_duplicate_post&post=' . $post->ID),
            'infinity_duplicate_' . $post->ID
        );
        $actions['infinity_duplicate'] = sprintf(
            '<a href="%1$s" aria-label="%2$s">%3$s</a>',
            esc_url($url),
            /* translators: %s: post title */
            esc_attr(sprintf(__('Duplicate “%s” as a draft', 'infinity'), _draft_or_post_title($post))),
            esc_html__('Duplicate', 'infinity')
        );
    }

    if ('publish' === $post->post_status && is_post_type_viewable($post->post_type)) {
        $actions['infinity_copy_link'] = sprintf(
            '<button type="button" class="button-link infinity-copy-link" data-url="%1$s">%2$s</button>',
            esc_url(get_permalink($post)),
            esc_html__('Copy link', 'infinity')
        );
    }

    return $actions;
}
add_filter('post_row_actions', 'infinity_admin_row_actions', 10, 2);
add_filter('page_row_actions', 'infinity_admin_row_actions', 10, 2);

/**
 * Meta keys that are not copied to a duplicate: edit bookkeeping and the
 * engagement counters, which belong to the original.
 *
 * @return string[]
 */
function infinity_duplicate_skipped_meta() {
    return apply_filters('infinity_duplicate_skipped_meta', array(
        '_edit_lock',
        '_edit_last',
        '_wp_old_slug',
        '_wp_old_date',
        '_wp_trash_meta_status',
        '_wp_trash_meta_time',
        '_wp_desired_post_slug',
        '_encloseme',
        '_pingme',
        'play_count',
        'vote_count',
        'fork_count',
        'completion_count',
        'attempt_count',
        'avg_session_duration',
    ));
}

/**
 * Make a draft copy of a post owned by the current user.
 *
 * @param int $post_id Source post ID.
 * @return int|WP_Error New post ID.
 */
function infinity_duplicate_post($post_id) {
    $post = get_post($post_id);
    if (!$post || !infinity_can_duplicate_post($post)) {
        return new WP_Error('infinity_duplicate_forbidden', __('You cannot duplicate this item.', 'infinity'));
    }

    $new_id = wp_insert_post(wp_slash(array(
        'post_type'      => $post->post_type,
        'post_status'    => 'draft',
        'post_author'    => get_current_user_id(),
        /* translators: %s: original title */
        'post_title'     => sprintf(__('%s (copy)', 'infinity'), $post->post_title),
        'post_content'   => $post->post_content,
        'post_excerpt'   => $post->post_excerpt,
        'post_parent'    => $post->post_parent,
        'menu_order'     => $post->menu_order,
        'comment_status' => $post->comment_status,
        'ping_status'    => $post->ping_status,
        'post_password'  => $post->post_password,
    )), true);

    if (is_wp_error($new_id)) {
        return $new_id;
    }

    foreach (get_object_taxonomies($post->post_type) as $taxonomy) {
        $terms = wp_get_object_terms($post->ID, $taxonomy, array('fields' => 'ids'));
        if (!is_wp_error($terms) && $terms) {
            wp_set_object_terms($new_id, $terms, $taxonomy);
        }
    }

    $skip = infinity_duplicate_skipped_meta();
    foreach (get_post_meta($post->ID) as $key => $values) {
        if (in_array($key, $skip, true)) {
            continue;
        }
        foreach ($values as $value) {
            add_post_meta($new_id, $key, wp_slash(maybe_unserialize($value)));
        }
    }

    do_action('infinity_post_duplicated', $new_id, $post->ID);

    return $new_id;
}

/**
 * admin-post.php handler for the row action.
 */
function infinity_handle_duplicate_request() {
    $post_id = isset($_GET['post']) ? absint($_GET['post']) : 0;
    check_admin_referer('infinity_duplicate_' . $post_id);

    $new_id = infinity_duplicate_post($post_id);
    if (is_wp_error($new_id)) {
        wp_die(esc_html($new_id->get_error_message()), '', array('response' => 403, 'back_link' => true));
    }

    wp_safe_redirect(add_query_arg('infinity_duplicated', 1, get_edit_post_link($new_id, 'raw')));
    exit;
}
add_action('admin_post_infinity_duplicate_post', 'infinity_handle_duplicate_request');

/**
 * @param array $actions Bulk actions.
 * @return array
 */
function infinity_register_duplicate_bulk_action($actions) {
    $actions['infinity_duplicate'] = __('Duplicate as draft', 'infinity');
    return $actions;
}

/**
 * @param string $redirect Redirect URL.
 * @param string $action   Bulk action.
 * @param int[]  $ids      Selected post IDs.
 * @return string
 */
function infinity_handle_duplicate_bulk_action($redirect, $action, $ids) {
    if ('infinity_duplicate' !== $action) {
        return $redirect;
    }

    $done = 0;
    foreach (array_slice(array_map('absint', (array) $ids), 0, 50) as $id) {
        if (!is_wp_error(infinity_duplicate_post($id))) {
            $done++;
        }
    }

    return add_query_arg('infinity_duplicated', $done, remove_query_arg('infinity_duplicated', $redirect));
}

/**
 * Notices after duplicating.
 */
function infinity_duplicate_notice() {
    if (!isset($_GET['infinity_duplicated'])) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display only.
        return;
    }
    $count  = absint($_GET['infinity_duplicated']); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
    $screen = get_current_screen();

    if ($screen && 'post' === $screen->base) {
        $message = __('This is a draft copy. Edit it and publish when ready.', 'infinity');
    } else {
        /* translators: %s: number of items */
        $message = sprintf(_n('%s item duplicated as a draft.', '%s items duplicated as drafts.', $count, 'infinity'), number_format_i18n($count));
    }

    printf('<div class="notice notice-success is-dismissible"><p>%s</p></div>', esc_html($message));
}
add_action('admin_notices', 'infinity_duplicate_notice');

/* -------------------------------------------------------------------------
 * Assets
 * ---------------------------------------------------------------------- */

/**
 * Enqueue list-screen CSS and JS.
 *
 * @param string $hook Admin page hook.
 */
function infinity_admin_posts_assets($hook) {
    if ('edit.php' !== $hook || !infinity_admin_is_list_screen()) {
        return;
    }

    $screen = get_current_screen();
    $layout = infinity_get_list_layout($screen->id);

    wp_enqueue_style('infinity-admin-posts', INFINITY_URI . '/assets/css/admin-posts.css', array(), INFINITY_VERSION);
    wp_enqueue_script('infinity-admin-posts', INFINITY_URI . '/assets/js/admin-posts.js', array(), INFINITY_VERSION, true);
    wp_localize_script('infinity-admin-posts', 'infinityListTable', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('infinity_list_layout'),
        'screen'  => $screen->id,
        'layout'  => $layout,
        'i18n'    => array(
            'copied'      => __('Link copied', 'infinity'),
            'copyFailed'  => __('Copy failed', 'infinity'),
            'resize'      => __('Resize column', 'infinity'),
            'confirmReset'=> __('Reset column widths and order for this screen?', 'infinity'),
        ),
    ));
}
add_action('admin_enqueue_scripts', 'infinity_admin_posts_assets');

/**
 * Compact class on <body> from the first paint.
 *
 * @param string $classes Admin body classes.
 * @return string
 */
function infinity_admin_body_class($classes) {
    $screen = get_current_screen();
    if (infinity_admin_is_list_screen($screen) && infinity_get_list_layout($screen->id)['compact']) {
        $classes .= ' infinity-compact-rows';
    }
    return $classes;
}
add_filter('admin_body_class', 'infinity_admin_body_class');

/* -------------------------------------------------------------------------
 * Dashboard widget: content pipeline
 * ---------------------------------------------------------------------- */

/**
 * Register the dashboard widget.
 */
function infinity_register_pipeline_widget() {
    if (current_user_can('edit_posts')) {
        wp_add_dashboard_widget('infinity_content_pipeline', __('Content pipeline', 'infinity'), 'infinity_render_pipeline_widget');
    }
}
add_action('wp_dashboard_setup', 'infinity_register_pipeline_widget');

/**
 * Render the dashboard widget: per-type counts, then upcoming scheduled
 * posts and the current user's latest drafts.
 */
function infinity_render_pipeline_widget() {
    $types    = get_post_types(array('show_ui' => true, 'show_in_menu' => true), 'objects');
    $statuses = array(
        'draft'   => __('Drafts', 'infinity'),
        'pending' => __('Pending review', 'infinity'),
        'future'  => __('Scheduled', 'infinity'),
    );

    echo '<table class="widefat striped infinity-pipeline"><thead><tr><th>' . esc_html__('Type', 'infinity') . '</th>';
    foreach ($statuses as $label) {
        echo '<th class="num">' . esc_html($label) . '</th>';
    }
    echo '</tr></thead><tbody>';

    $rows = 0;
    foreach ($types as $type) {
        if ('attachment' === $type->name || !current_user_can($type->cap->edit_posts)) {
            continue;
        }
        $counts = wp_count_posts($type->name, 'readable');
        $total  = 0;
        foreach (array_keys($statuses) as $status) {
            $total += isset($counts->$status) ? (int) $counts->$status : 0;
        }
        if (!$total) {
            continue;
        }
        $rows++;
        echo '<tr><td>' . esc_html($type->labels->name) . '</td>';
        foreach (array_keys($statuses) as $status) {
            $n = isset($counts->$status) ? (int) $counts->$status : 0;
            $url = admin_url('edit.php?post_type=' . $type->name . '&post_status=' . $status);
            echo '<td class="num">' . ($n ? '<a href="' . esc_url($url) . '">' . esc_html(number_format_i18n($n)) . '</a>' : '<span class="infinity-muted">0</span>') . '</td>';
        }
        echo '</tr>';
    }
    if (!$rows) {
        echo '<tr><td colspan="4">' . esc_html__('Nothing in progress. Everything is published.', 'infinity') . '</td></tr>';
    }
    echo '</tbody></table>';

    $type_names = array_keys(array_filter($types, function ($t) {
        return 'attachment' !== $t->name;
    }));

    $scheduled = get_posts(array(
        'post_type'      => $type_names,
        'post_status'    => 'future',
        'posts_per_page' => 5,
        'orderby'        => 'date',
        'order'          => 'ASC',
    ));
    if ($scheduled) {
        echo '<h3>' . esc_html__('Coming up', 'infinity') . '</h3><ul class="infinity-pipeline-list">';
        foreach ($scheduled as $p) {
            printf(
                '<li><a href="%1$s">%2$s</a> <span class="infinity-muted">%3$s</span></li>',
                esc_url(get_edit_post_link($p->ID)),
                esc_html(_draft_or_post_title($p)),
                esc_html(get_the_date(get_option('date_format') . ' ' . get_option('time_format'), $p))
            );
        }
        echo '</ul>';
    }

    $drafts = get_posts(array(
        'post_type'      => $type_names,
        'post_status'    => 'draft',
        'author'         => get_current_user_id(),
        'posts_per_page' => 5,
        'orderby'        => 'modified',
        'order'          => 'DESC',
    ));
    if ($drafts) {
        echo '<h3>' . esc_html__('Your recent drafts', 'infinity') . '</h3><ul class="infinity-pipeline-list">';
        foreach ($drafts as $p) {
            $pto = get_post_type_object($p->post_type);
            printf(
                '<li><a href="%1$s">%2$s</a> <span class="infinity-muted">%3$s · %4$s</span></li>',
                esc_url(get_edit_post_link($p->ID)),
                esc_html(_draft_or_post_title($p)),
                esc_html($pto ? $pto->labels->singular_name : $p->post_type),
                /* translators: %s: human time difference */
                esc_html(sprintf(__('%s ago', 'infinity'), human_time_diff(get_post_modified_time('U', true, $p))))
            );
        }
        echo '</ul>';
    }
    ?>
    <style>
        .infinity-pipeline th.num, .infinity-pipeline td.num { text-align: right; width: 22%; }
        .infinity-pipeline-list li { display: flex; justify-content: space-between; gap: 8px; }
        #infinity_content_pipeline h3 { margin: 14px 0 6px; font-weight: 600; }
        #infinity_content_pipeline .infinity-muted { color: #646970; }
    </style>
    <?php
}
