<?php
/**
 * Lazy loading for what core WordPress leaves eager
 *
 * Core already adds loading="lazy" to post thumbnails, content images
 * and avatars (and skips it for the first, likely-LCP image). This
 * covers the rest:
 *
 * - Videos: a <video> fetches its poster image, and with
 *   preload="metadata" the first bytes of the file, as soon as the page
 *   loads, wherever it sits. Below-the-fold videos now hold both back
 *   (data-poster / data-preload, preload="none") until they come within
 *   about a screen of the viewport; assets/js/post-media.js restores
 *   them. Applies to video blocks, GIF-replacement loops and the
 *   theme's teaser videos. The post header video is left eager.
 * - Iframes in post content: core only lazy-loads iframes that carry
 *   width and height attributes. Every content iframe without a loading
 *   attribute now gets loading="lazy".
 *
 * Filter: infinity_lazy_videos (bool) turns the video part off.
 *
 * @package Infinity
 * @since 3.17.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Rewrite every <video> tag in $html to load lazily. Tags that already
 * carry data-lazy-video or data-eager are left alone.
 *
 * @param string $html
 * @return string
 */
function infinity_lazy_video_html($html) {
    if (false === stripos($html, '<video') || is_feed() || !apply_filters('infinity_lazy_videos', true)) {
        return $html;
    }

    return preg_replace_callback('/<video\b([^>]*)>/i', function ($m) {
        $tag = $m[1];
        if (preg_match('/\sdata-(?:lazy-video|eager)\b/i', $tag)) {
            return $m[0];
        }

        // poster="…" → data-poster="…"
        $tag = preg_replace('/\sposter=("[^"]*"|\'[^\']*\')/i', ' data-poster=$1', $tag);

        // Remember the intended preload, then hold it at none
        $preload = 'metadata';
        if (preg_match('/\spreload=["\']?(none|metadata|auto)["\']?/i', $tag, $p)) {
            $preload = strtolower($p[1]);
            $tag     = preg_replace('/\spreload=["\']?(none|metadata|auto)["\']?/i', '', $tag);
        }
        $tag .= ' preload="none" data-preload="' . esc_attr($preload) . '" data-lazy-video';

        return '<video' . $tag . '>';
    }, $html);
}

/**
 * Video blocks, after inc/post-media.php has dressed them (priority 10).
 */
add_filter('render_block_core/video', function ($content) {
    return infinity_lazy_video_html($content);
}, 20);

/**
 * Content iframes without a loading attribute load lazily. Runs after
 * blocks, shortcodes and oEmbeds have all produced their markup.
 */
function infinity_lazy_content_iframes($content) {
    if (false === stripos($content, '<iframe') || is_feed()) {
        return $content;
    }
    return preg_replace('/<iframe\b(?![^>]*\sloading=)/i', '<iframe loading="lazy"', $content);
}
add_filter('the_content', 'infinity_lazy_content_iframes', 30);
