<?php
/**
 * Reading tools for single posts: table of contents, heading anchors,
 * reading progress bar
 *
 * - Every h2/h3 in the post body gets a stable id (kept if the author
 *   set one) and a small link-to-section button. Clicking it copies the
 *   section's URL; without JavaScript it is a plain #anchor link.
 * - Posts with at least three such headings get an "On this page" list:
 *   collapsible at the top of the post, and also pinned at the top of
 *   the sticky sidebar on wide screens when the post has one. The
 *   current section is highlighted as you read.
 * - A thin bar along the top of the viewport tracks progress through the
 *   post body (not the comments and footer under it).
 *
 * All of it is server-rendered: the content filter adds ids and anchors,
 * so links to #sections work before (and without) any script, and
 * assets/js/reading-tools.js only adds copy-on-click, the section
 * highlight and the progress bar.
 *
 * Filters:
 *   infinity_toc_enabled      (bool, WP_Post) show the TOC on this post
 *   infinity_toc_min_headings (int)  headings needed for a TOC, default 3
 *
 * @package Infinity
 * @since 3.18.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Headings collected from the post body while the content filter runs,
 * for the TOC that single.php prints. Each is
 * array('id' => string, 'text' => string, 'level' => 2|3).
 *
 * @param array|null $set Replace the stored list.
 * @return array
 */
function infinity_toc_headings($set = null) {
    static $headings = array();
    if (null !== $set) {
        $headings = $set;
    }
    return $headings;
}

/**
 * Is this the main single-post body, where the reading tools belong?
 */
function infinity_reading_tools_context() {
    return is_singular('post') && in_the_loop() && is_main_query() && !is_feed() && !is_embed()
        && !(defined('REST_REQUEST') && REST_REQUEST);
}

/**
 * Ids already used by the page around the post body (header, comments,
 * subscribe band, related posts), so a heading never takes one of them.
 *
 * @return string[]
 */
function infinity_toc_reserved_ids() {
    return array('page', 'masthead', 'site-navigation', 'primary-menu', 'main-content', 'comments', 'respond',
        'reply-title', 'commentform', 'subscribe', 'related-heading', 'colophon', 'quick-search', 'post-toc');
}

/**
 * Add ids and section-link buttons to the h2/h3 headings in the post
 * body, and remember them for the TOC.
 *
 * Runs after blocks, autop and shortcodes (priority 20) so it sees the
 * final markup.
 *
 * @param string $content
 * @return string
 */
function infinity_toc_filter_content($content) {
    if (!infinity_reading_tools_context() || false === stripos($content, '<h')) {
        return $content;
    }

    $used     = array_fill_keys(infinity_toc_reserved_ids(), true);
    $headings = array();

    // Ids authors set by hand anywhere in the body stay theirs
    if (preg_match_all('/\sid=(["\'])([^"\']+)\1/i', $content, $ids)) {
        foreach ($ids[2] as $id) {
            $used[$id] = true;
        }
    }

    $content = preg_replace_callback(
        '/<h([23])(\s[^>]*)?>(.*?)<\/h\1>/is',
        function ($m) use (&$used, &$headings) {
            $level = (int) $m[1];
            $attrs = isset($m[2]) ? $m[2] : '';
            $inner = $m[3];
            $text  = trim(preg_replace('/\s+/u', ' ', html_entity_decode(wp_strip_all_tags($inner), ENT_QUOTES | ENT_HTML5, 'UTF-8')));

            // Opt-out class, or an empty heading: leave it untouched
            if ('' === $text || preg_match('/class=(["\'])[^"\']*\bno-toc\b/i', $attrs)) {
                return $m[0];
            }

            if (preg_match('/\sid=(["\'])([^"\']+)\1/i', $attrs, $idm)) {
                $id = $idm[2];
            } else {
                $base = sanitize_title($text);
                if ('' === $base || is_numeric($base)) {
                    $base = 'section-' . (count($headings) + 1);
                }
                $base = substr($base, 0, 60);
                $id   = $base;
                for ($n = 2; isset($used[$id]); $n++) {
                    $id = $base . '-' . $n;
                }
                $used[$id] = true;
                $attrs    .= ' id="' . esc_attr($id) . '"';
            }

            $headings[] = array('id' => $id, 'text' => $text, 'level' => $level);

            $anchor = sprintf(
                '<a class="heading-anchor" href="#%1$s" aria-label="%2$s" data-copy-label="%3$s"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg></a>',
                esc_attr($id),
                // Short on purpose: it is read as part of the heading
                esc_attr__('Copy link to this section', 'infinity'),
                esc_attr__('Link copied', 'infinity')
            );

            return '<h' . $level . $attrs . '>' . $inner . $anchor . '</h' . $level . '>';
        },
        $content
    );

    infinity_toc_headings($headings);
    return $content;
}
add_filter('the_content', 'infinity_toc_filter_content', 20);

/**
 * Whether the current post gets a TOC (call after the content filter ran).
 */
function infinity_toc_should_show() {
    $min  = (int) apply_filters('infinity_toc_min_headings', 3);
    $show = count(infinity_toc_headings()) >= max(1, $min);
    return (bool) apply_filters('infinity_toc_enabled', $show, get_post());
}

/**
 * Print the table of contents.
 *
 * @param string $variant 'inline' (top of the post, collapsible) or
 *                        'sidebar' (desktop, top of the sticky sidebar).
 */
function infinity_the_toc($variant = 'inline') {
    if (!infinity_toc_should_show()) {
        return;
    }
    $headings = infinity_toc_headings();
    $minutes  = function_exists('infinity_reading_minutes') ? infinity_reading_minutes() : 0;
    $is_inline = 'inline' === $variant;
    ?>
    <nav class="post-toc post-toc-<?php echo esc_attr($variant); ?>" aria-label="<?php esc_attr_e('On this page', 'infinity'); ?>" data-post-toc>
        <details<?php echo $is_inline ? ' class="post-toc-details"' : ' open'; ?>>
            <summary class="post-toc-summary">
                <span class="post-toc-title"><?php esc_html_e('On this page', 'infinity'); ?></span>
                <?php if ($minutes) : ?>
                    <span class="post-toc-meta">
                        <?php
                        /* translators: %d: minutes */
                        echo esc_html(sprintf(_n('%d min read', '%d min read', $minutes, 'infinity'), $minutes));
                        ?>
                    </span>
                <?php endif; ?>
            </summary>
            <ol class="post-toc-list">
                <?php
                // h3s nest under the h2 before them; an h3 with no h2
                // above it is listed at the top level.
                $li_open  = false;
                $sub_open = false;
                foreach ($headings as $h) {
                    $link = sprintf('<a href="#%1$s">%2$s</a>', esc_attr($h['id']), esc_html($h['text']));
                    if (3 === $h['level'] && $li_open) {
                        if (!$sub_open) {
                            echo '<ol class="post-toc-sub">';
                            $sub_open = true;
                        }
                        echo '<li class="post-toc-item post-toc-h3">' . $link . '</li>';
                        continue;
                    }
                    if ($sub_open) {
                        echo '</ol>';
                        $sub_open = false;
                    }
                    if ($li_open) {
                        echo '</li>';
                    }
                    echo '<li class="post-toc-item post-toc-h' . (int) $h['level'] . '">' . $link;
                    $li_open = true;
                }
                if ($sub_open) {
                    echo '</ol>';
                }
                if ($li_open) {
                    echo '</li>';
                }
                ?>
            </ol>
        </details>
    </nav>
    <?php
}

/**
 * The sidebar copy: printed at the top of sidebar.php on single posts.
 *
 * @param string $area Widget area id.
 */
function infinity_toc_in_sidebar($area) {
    if ('sidebar-1' === $area && is_singular('post')) {
        infinity_the_toc('sidebar');
    }
}
add_action('infinity_sidebar_top', 'infinity_toc_in_sidebar');

/**
 * Reading progress bar markup (single posts).
 */
function infinity_the_reading_progress() {
    echo '<div class="reading-progress" aria-hidden="true" data-reading-progress hidden><span class="reading-progress-bar"></span></div>' . "\n";
}

/**
 * Script for copy-link, section highlight and progress.
 */
function infinity_reading_tools_assets() {
    if (!is_singular('post')) {
        return;
    }
    wp_enqueue_script(
        'infinity-reading-tools',
        INFINITY_URI . '/assets/js/reading-tools.js',
        array(),
        INFINITY_VERSION,
        array('in_footer' => true, 'strategy' => 'defer')
    );
}
add_action('wp_enqueue_scripts', 'infinity_reading_tools_assets');
