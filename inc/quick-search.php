<?php
/**
 * Quick search: a search box over every page, opened from the header,
 * with "/" or with Ctrl/⌘+K
 *
 * Results appear as you type (posts, pages, projects and matching
 * topics) and the arrow keys and Enter pick one. Before anything is
 * typed it offers recent posts and the biggest topics. Enter with no
 * result picked goes to the full search page, and so does the header
 * button without JavaScript: it is a link to /?s=, so nothing depends
 * on the script.
 *
 * Pieces:
 *   infinity_quick_search_button()  header.php, in the actions group
 *   infinity_quick_search_dialog()  wp_footer: the <dialog> itself
 *   GET /wp-json/infinity/v1/search?q=  the results, cacheable 5 min
 *   assets/js/quick-search.js      opening, typing, keys
 *   style.css 24.0                  styles (every page has the button)
 *
 * @package Infinity
 * @since 3.18.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Search button. A real link to the search page; quick-search.js turns
 * it into the dialog opener. Printed twice: in the header actions
 * ('search-toggle') and at the top of the mobile menu drawer
 * ('nav-search'); CSS shows whichever has room.
 *
 * @param string $class
 */
function infinity_quick_search_button($class = 'search-toggle') {
    ?>
    <a class="<?php echo esc_attr($class); ?>" href="<?php echo esc_url(home_url('/?s=')); ?>" data-search-open aria-haspopup="dialog" aria-keyshortcuts="/ Control+K Meta+K">
        <?php infinity_icon('search', 18); ?>
        <span class="search-toggle-label"><?php esc_html_e('Search', 'infinity'); ?></span>
        <kbd class="search-toggle-kbd" aria-hidden="true">/</kbd>
    </a>
    <?php
}

/**
 * Post types the quick search looks in: everything public that WordPress
 * search covers, minus attachments.
 *
 * @return string[]
 */
function infinity_quick_search_post_types() {
    $types = get_post_types(array('public' => true, 'exclude_from_search' => false));
    unset($types['attachment']);
    return array_values(apply_filters('infinity_quick_search_post_types', $types));
}

/**
 * Utility pages (checkout, account, ...) that search should never offer.
 *
 * @return int[]
 */
function infinity_quick_search_excluded_ids() {
    $ids = array();
    if (function_exists('infinity_seo_noindex_page_slugs')) {
        foreach (infinity_seo_noindex_page_slugs() as $slug) {
            $page = get_page_by_path($slug);
            if ($page) {
                $ids[] = (int) $page->ID;
            }
        }
    }
    return $ids;
}

/**
 * Plain-text title, entities decoded (the JS sets it as textContent).
 *
 * @param int|WP_Post $post
 * @return string
 */
function infinity_quick_search_title($post) {
    return html_entity_decode(wp_strip_all_tags(get_the_title($post)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

/**
 * One result row for a post.
 *
 * @param WP_Post $post
 * @return array
 */
function infinity_quick_search_row($post) {
    $type  = get_post_type_object($post->post_type);
    $label = $type ? $type->labels->singular_name : '';
    $meta  = array();

    if ('post' === $post->post_type) {
        $cats = get_the_category($post->ID);
        if ($cats) {
            $meta[] = $cats[0]->name;
        }
        $meta[] = get_the_date('', $post);
    } elseif ($label) {
        $meta[] = $label;
    }

    return array(
        'title' => infinity_quick_search_title($post),
        'url'   => get_permalink($post),
        'meta'  => html_entity_decode(implode(' · ', array_filter($meta)), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
        'kind'  => $post->post_type,
    );
}

/**
 * REST: GET /infinity/v1/search?q=
 */
function infinity_quick_search_register_route() {
    register_rest_route('infinity/v1', '/search', array(
        'methods'             => 'GET',
        'callback'            => 'infinity_quick_search_endpoint',
        'permission_callback' => '__return_true',
        'args'                => array(
            'q' => array(
                'type'              => 'string',
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    ));
}
add_action('rest_api_init', 'infinity_quick_search_register_route');

/**
 * @param WP_REST_Request $request
 * @return WP_REST_Response
 */
function infinity_quick_search_endpoint(WP_REST_Request $request) {
    $q = trim((string) $request->get_param('q'));
    if (function_exists('mb_substr')) {
        $q = mb_substr($q, 0, 80);
    } else {
        $q = substr($q, 0, 80);
    }

    $results = array();
    if (strlen($q) >= 2) {
        // Topics first: a category whose name matches is usually the
        // best door into a subject
        $terms = get_terms(array(
            'taxonomy'   => 'category',
            'name__like' => $q,
            'hide_empty' => true,
            'number'     => 3,
            'orderby'    => 'count',
            'order'      => 'DESC',
        ));
        if (!is_wp_error($terms)) {
            foreach ($terms as $term) {
                $results[] = array(
                    'title' => html_entity_decode($term->name, ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                    'url'   => get_term_link($term),
                    /* translators: %d: number of posts */
                    'meta'  => sprintf(_n('Topic · %d post', 'Topic · %d posts', (int) $term->count, 'infinity'), (int) $term->count),
                    'kind'  => 'topic',
                );
            }
        }

        $query = new WP_Query(array(
            's'                      => $q,
            'post_type'              => infinity_quick_search_post_types(),
            'post_status'            => 'publish',
            'has_password'           => false,
            'post__not_in'           => infinity_quick_search_excluded_ids(),
            'posts_per_page'         => 8,
            'no_found_rows'          => true,
            'ignore_sticky_posts'    => true,
            'update_post_meta_cache' => false,
        ));
        foreach ($query->posts as $post) {
            $results[] = infinity_quick_search_row($post);
        }
    }

    $response = new WP_REST_Response(array(
        'q'       => $q,
        'results' => $results,
        'all'     => add_query_arg('s', rawurlencode($q), home_url('/')),
    ));
    // The same for every visitor, so let browsers and the CDN keep it
    if (!is_user_logged_in()) {
        $response->header('Cache-Control', 'public, max-age=300');
    }
    return $response;
}

/**
 * What the dialog offers before anything is typed: the newest posts and
 * the biggest topics. Cached; cleared whenever a post is saved.
 *
 * @return array{recent: array, topics: array}
 */
function infinity_quick_search_defaults() {
    $cached = get_transient('infinity_qs_defaults');
    if (is_array($cached)) {
        return $cached;
    }

    $recent = array();
    $query  = new WP_Query(array(
        'post_type'              => 'post',
        'post_status'            => 'publish',
        'has_password'           => false,
        'posts_per_page'         => 5,
        'no_found_rows'          => true,
        'ignore_sticky_posts'    => true,
        'update_post_meta_cache' => false,
    ));
    foreach ($query->posts as $post) {
        $recent[] = infinity_quick_search_row($post);
    }

    $topics = array();
    $terms  = get_terms(array(
        'taxonomy'   => 'category',
        'hide_empty' => true,
        'number'     => 10,
        'orderby'    => 'count',
        'order'      => 'DESC',
        'exclude'    => array((int) get_option('default_category')),
    ));
    if (!is_wp_error($terms)) {
        foreach ($terms as $term) {
            $topics[] = array(
                'title' => html_entity_decode($term->name, ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                'url'   => get_term_link($term),
            );
        }
    }

    $data = array('recent' => $recent, 'topics' => $topics);
    set_transient('infinity_qs_defaults', $data, 12 * HOUR_IN_SECONDS);
    return $data;
}

function infinity_quick_search_flush_defaults() {
    delete_transient('infinity_qs_defaults');
}
add_action('save_post', 'infinity_quick_search_flush_defaults');
add_action('deleted_post', 'infinity_quick_search_flush_defaults');
add_action('edited_category', 'infinity_quick_search_flush_defaults');

/**
 * The dialog, once per page, closed until opened.
 */
function infinity_quick_search_dialog() {
    if (is_admin()) {
        return;
    }
    $defaults = infinity_quick_search_defaults();
    ?>
    <dialog id="quick-search" class="quick-search" aria-label="<?php esc_attr_e('Search the site', 'infinity'); ?>">
        <form class="qs-form" role="search" method="get" action="<?php echo esc_url(home_url('/')); ?>">
            <label class="screen-reader-text" for="qs-input"><?php esc_html_e('Search the site', 'infinity'); ?></label>
            <span class="qs-icon" aria-hidden="true"><?php infinity_icon('search', 20); ?></span>
            <input id="qs-input" class="qs-input" type="search" name="s" autocomplete="off" spellcheck="false"
                placeholder="<?php esc_attr_e('Search posts, projects, music…', 'infinity'); ?>"
                role="combobox" aria-expanded="false" aria-controls="qs-results" aria-autocomplete="list">
            <button type="button" class="qs-close" data-search-close>
                <span class="screen-reader-text"><?php esc_html_e('Close search', 'infinity'); ?></span>
                <kbd aria-hidden="true">Esc</kbd>
            </button>
        </form>

        <div class="qs-body">
            <p class="qs-status screen-reader-text" aria-live="polite" data-qs-status></p>
            <ul id="qs-results" class="qs-results" role="listbox" aria-label="<?php esc_attr_e('Results', 'infinity'); ?>" hidden></ul>
            <p class="qs-empty" data-qs-empty hidden></p>

            <div class="qs-default" data-qs-default>
                <?php if ($defaults['recent']) : ?>
                    <h2 class="qs-heading"><?php esc_html_e('Latest', 'infinity'); ?></h2>
                    <ul class="qs-list">
                        <?php foreach ($defaults['recent'] as $row) : ?>
                            <li><a class="qs-link" href="<?php echo esc_url($row['url']); ?>" data-rum="quick-search:latest">
                                <span class="qs-title"><?php echo esc_html($row['title']); ?></span>
                                <span class="qs-meta"><?php echo esc_html($row['meta']); ?></span>
                            </a></li>
                        <?php endforeach; ?>
                    </ul>
                <?php endif; ?>
                <?php if ($defaults['topics']) : ?>
                    <h2 class="qs-heading"><?php esc_html_e('Topics', 'infinity'); ?></h2>
                    <ul class="qs-chips">
                        <?php foreach ($defaults['topics'] as $topic) : ?>
                            <li><a class="qs-chip" href="<?php echo esc_url($topic['url']); ?>" data-rum="quick-search:topic"><?php echo esc_html($topic['title']); ?></a></li>
                        <?php endforeach; ?>
                    </ul>
                <?php endif; ?>
            </div>
        </div>

        <footer class="qs-foot" aria-hidden="true">
            <span><kbd>↑</kbd><kbd>↓</kbd> <?php esc_html_e('move', 'infinity'); ?></span>
            <span><kbd>Enter</kbd> <?php esc_html_e('open', 'infinity'); ?></span>
            <span><kbd>Esc</kbd> <?php esc_html_e('close', 'infinity'); ?></span>
        </footer>
    </dialog>
    <?php
}
add_action('wp_footer', 'infinity_quick_search_dialog', 5);

function infinity_quick_search_assets() {
    wp_enqueue_script(
        'infinity-quick-search',
        INFINITY_URI . '/assets/js/quick-search.js',
        array(),
        INFINITY_VERSION,
        array('in_footer' => true, 'strategy' => 'defer')
    );
    wp_localize_script('infinity-quick-search', 'infinitySearch', array(
        'endpoint' => esc_url_raw(rest_url('infinity/v1/search')),
        'i18n'     => array(
            /* translators: %d: number of results */
            'results' => __('%d results', 'infinity'),
            'one'     => __('1 result', 'infinity'),
            /* translators: %s: search terms */
            'none'    => __('Nothing matches “%s”. Press Enter to search everything.', 'infinity'),
            /* translators: %s: search terms */
            'all'     => __('See all results for “%s”', 'infinity'),
            'error'   => __('Search is unavailable right now. Press Enter to search.', 'infinity'),
        ),
    ));
}
add_action('wp_enqueue_scripts', 'infinity_quick_search_assets');
