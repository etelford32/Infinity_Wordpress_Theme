<?php
/**
 * Post media: animated GIFs, video loops, YouTube embeds and header video
 *
 * What this module changes on blog posts:
 *
 * - GIFs stay animated. WordPress resizes a GIF into static first-frame
 *   copies, so a GIF inserted at "Large" (and a GIF featured image shown
 *   at the hero size) used to freeze. In post content and in the post
 *   header the original file is now served, with a still frame for
 *   visitors who prefer reduced motion and a pause button for everyone.
 * - A GIF can be swapped for a video. If an MP4 or WebM with the same
 *   file name sits next to the GIF in the uploads folder, or one is set
 *   in the GIF's "Loop video" field in the media library, the theme
 *   serves that video as a silent loop instead. A video loop is usually
 *   5–20× smaller than the GIF it replaces.
 * - Video blocks: every video gets playsinline and a sensible preload.
 *   Videos set to autoplay, and videos given the "GIF-style loop" block
 *   style, play only while on screen, never autoplay for reduced-motion
 *   visitors, and get a pause button.
 * - YouTube embeds load as a thumbnail with a play button. The YouTube
 *   player (about 1 MB of script) loads only when the visitor clicks,
 *   from youtube-nocookie.com.
 * - Header video: a "Header media" box on the post screen sets a video
 *   (media library file or a YouTube link) shown in place of the featured
 *   image, as a silent ambient loop or as a player with controls. It is
 *   also added to the Open Graph tags and to the Article structured data.
 *
 * Filters: infinity_youtube_facade (bool), infinity_gif_video_twin (array).
 *
 * @package Infinity
 * @since 3.16.0
 */

if (!defined('ABSPATH')) {
    exit;
}

const INFINITY_HEADER_VIDEO_META  = '_infinity_header_video';
const INFINITY_HEADER_WEBM_META   = '_infinity_header_video_webm';
const INFINITY_HEADER_MODE_META   = '_infinity_header_video_mode';
const INFINITY_HEADER_LAYOUT_META = '_infinity_header_layout';
const INFINITY_GIF_VIDEO_META     = '_infinity_gif_video';

/* -------------------------------------------------------------------------
 * Assets
 * ---------------------------------------------------------------------- */

function infinity_post_media_assets() {
    wp_enqueue_style(
        'infinity-post-media',
        INFINITY_URI . '/assets/css/post-media.css',
        array('infinity-style'),
        INFINITY_VERSION
    );
    wp_enqueue_script(
        'infinity-post-media',
        INFINITY_URI . '/assets/js/post-media.js',
        array(),
        INFINITY_VERSION,
        array('in_footer' => true, 'strategy' => 'defer')
    );
    wp_localize_script('infinity-post-media', 'infinityMedia', array(
        'pause'    => __('Pause animation', 'infinity'),
        'play'     => __('Play animation', 'infinity'),
        'playWith' => __('Play video: %s', 'infinity'),
    ));
}
add_action('wp_enqueue_scripts', 'infinity_post_media_assets');

/* -------------------------------------------------------------------------
 * GIF helpers
 * ---------------------------------------------------------------------- */

/**
 * @param int $attachment_id
 * @return bool
 */
function infinity_is_gif($attachment_id) {
    return $attachment_id && 'image/gif' === get_post_mime_type($attachment_id);
}

/**
 * A static frame of a GIF: the largest resized copy WordPress made.
 * Resized GIFs keep only the first frame, which is what we want here.
 *
 * @param int $attachment_id
 * @return string URL, or '' when the GIF was too small to be resized.
 */
function infinity_gif_still_url($attachment_id) {
    foreach (array('large', 'medium_large', 'medium') as $size) {
        $src = image_get_intermediate_size($attachment_id, $size);
        if ($src && !empty($src['url'])) {
            return $src['url'];
        }
    }
    return '';
}

/**
 * The video that replaces a GIF, if there is one.
 *
 * Explicit "Loop video" field first, then an .mp4 / .webm with the same
 * name in the same uploads folder (upload kepler.gif and kepler.mp4).
 *
 * @param int $attachment_id
 * @return array{mp4?: string, webm?: string}
 */
function infinity_gif_video_twin($attachment_id) {
    $twin = array();

    $explicit = trim((string) get_post_meta($attachment_id, INFINITY_GIF_VIDEO_META, true));
    if ($explicit) {
        $url = ctype_digit($explicit) ? (string) wp_get_attachment_url((int) $explicit) : esc_url_raw($explicit);
        if ($url) {
            $ext        = strtolower(pathinfo(wp_parse_url($url, PHP_URL_PATH) ?: '', PATHINFO_EXTENSION));
            $key        = 'webm' === $ext ? 'webm' : 'mp4';
            $twin[$key] = $url;
        }
    }

    $file = get_attached_file($attachment_id);
    $url  = wp_get_attachment_url($attachment_id);
    if ($file && $url) {
        foreach (array('webm', 'mp4') as $ext) {
            if (isset($twin[$ext])) {
                continue;
            }
            $sibling = preg_replace('/\.gif$/i', '.' . $ext, $file);
            if ($sibling !== $file && file_exists($sibling)) {
                $twin[$ext] = preg_replace('/\.gif$/i', '.' . $ext, $url);
            }
        }
    }

    return apply_filters('infinity_gif_video_twin', $twin, $attachment_id);
}

/**
 * <source> tags, WebM first (smaller), then MP4 (plays everywhere).
 *
 * @param array $sources ['webm' => url, 'mp4' => url]
 * @return string
 */
function infinity_video_sources_html($sources) {
    $html = '';
    foreach (array('webm' => 'video/webm', 'mp4' => 'video/mp4') as $key => $type) {
        if (!empty($sources[$key])) {
            $html .= sprintf('<source src="%s" type="%s">', esc_url($sources[$key]), esc_attr($type));
        }
    }
    return $html;
}

/**
 * Markup for an animated GIF that keeps animating.
 *
 * @param int    $attachment_id
 * @param array  $args {
 *     @type string $class   Extra classes for the <img> / <video>.
 *     @type string $alt     Alt text; defaults to the attachment's.
 *     @type int    $width   Display width attribute; defaults to full width.
 *     @type int    $height  Display height attribute.
 *     @type string $loading lazy|eager.
 *     @type bool   $priority Hint the browser to fetch it early (hero).
 * }
 * @return string
 */
function infinity_gif_markup($attachment_id, $args = array()) {
    $meta = wp_get_attachment_metadata($attachment_id);
    $args = wp_parse_args($args, array(
        'class'    => '',
        'alt'      => (string) get_post_meta($attachment_id, '_wp_attachment_image_alt', true),
        'width'    => isset($meta['width']) ? (int) $meta['width'] : 0,
        'height'   => isset($meta['height']) ? (int) $meta['height'] : 0,
        'loading'  => 'lazy',
        'priority' => false,
    ));

    $full  = (string) wp_get_attachment_url($attachment_id);
    $still = infinity_gif_still_url($attachment_id);
    $dims  = ($args['width'] && $args['height'])
        ? sprintf(' width="%d" height="%d"', $args['width'], $args['height'])
        : '';

    $twin = infinity_gif_video_twin($attachment_id);
    if ($twin) {
        $label = $args['alt'] ? sprintf(' aria-label="%s"', esc_attr($args['alt'])) : ' aria-hidden="true"';
        $html  = sprintf(
            '<span class="infinity-loop-wrap infinity-gif-video"><video class="infinity-loop %1$s" data-infinity-loop muted loop playsinline preload="%2$s"%3$s%4$s%5$s>%6$s</video></span>',
            esc_attr($args['class']),
            $args['priority'] ? 'auto' : 'none',
            $still ? ' poster="' . esc_url($still) . '"' : '',
            $dims,
            $label,
            infinity_video_sources_html($twin)
        );
        // Hero loops load now; loops further down wait (inc/lazy-load.php)
        return ($args['priority'] || !function_exists('infinity_lazy_video_html')) ? $html : infinity_lazy_video_html($html);
    }

    $img = sprintf(
        '<img class="infinity-gif-img %1$s" src="%2$s" alt="%3$s"%4$s loading="%5$s" decoding="async"%6$s>',
        esc_attr($args['class']),
        esc_url($full),
        esc_attr($args['alt']),
        $dims,
        $args['priority'] ? 'eager' : esc_attr($args['loading']),
        $args['priority'] ? ' fetchpriority="high"' : ''
    );

    // Reduced-motion visitors get the still frame without downloading the GIF
    $source = $still
        ? sprintf('<source media="(prefers-reduced-motion: reduce)" srcset="%s">', esc_url($still))
        : '';

    return sprintf(
        '<span class="infinity-gif" data-gif-src="%1$s"><picture>%2$s%3$s</picture></span>',
        esc_url($full),
        $source,
        $img
    );
}

/**
 * GIFs in post content: swap the frozen resized copy for the animated
 * original (or its video twin). Runs on images core recognises as
 * attachments (they carry a wp-image-{id} class).
 */
function infinity_content_gif_tag($filtered_image, $context, $attachment_id) {
    if ('the_content' !== $context || !infinity_is_gif($attachment_id) || is_feed()) {
        return $filtered_image;
    }

    $attr = array();
    foreach (array('class', 'alt', 'width', 'height', 'loading') as $name) {
        if (preg_match('/\s' . $name . '="([^"]*)"/i', $filtered_image, $m)) {
            $attr[$name] = html_entity_decode($m[1], ENT_QUOTES);
        }
    }

    $args = array('class' => isset($attr['class']) ? $attr['class'] : '');
    foreach (array('alt', 'width', 'height', 'loading') as $name) {
        if (isset($attr[$name])) {
            $args[$name] = $attr[$name];
        }
    }

    return infinity_gif_markup($attachment_id, $args);
}
add_filter('wp_content_img_tag', 'infinity_content_gif_tag', 10, 3);

/**
 * Never let the big-image threshold replace a large GIF with a static
 * "-scaled" copy; that would freeze it everywhere.
 */
add_filter('big_image_size_threshold', function ($threshold, $imagesize) {
    return (isset($imagesize['mime']) && 'image/gif' === $imagesize['mime']) ? false : $threshold;
}, 10, 2);

/**
 * Cards (archives, related posts, homepage) keep the small still frame,
 * and animate on hover or focus: the GIF is fetched only then.
 */
function infinity_gif_thumbnail_hover($html, $post_id, $thumb_id, $size) {
    if (is_admin() || is_feed() || 'full' === $size || !infinity_is_gif($thumb_id) || false === strpos($html, '<img')) {
        return $html;
    }
    $full = wp_get_attachment_url($thumb_id);
    return preg_replace('/<img\s/i', '<img data-gif-hover="' . esc_url($full) . '" ', $html, 1);
}
add_filter('post_thumbnail_html', 'infinity_gif_thumbnail_hover', 10, 4);

/* -------------------------------------------------------------------------
 * Video blocks
 * ---------------------------------------------------------------------- */

function infinity_register_media_block_styles() {
    if (function_exists('register_block_style')) {
        register_block_style('core/video', array(
            'name'  => 'gif-loop',
            'label' => __('GIF-style loop', 'infinity'),
        ));
    }
}
add_action('init', 'infinity_register_media_block_styles');

/**
 * Core video block: playsinline everywhere, metadata preload by default,
 * and loops handed to post-media.js so they play only while on screen.
 */
function infinity_render_video_block($content, $block) {
    if (false === strpos($content, '<video')) {
        return $content;
    }

    $attrs     = isset($block['attrs']) ? $block['attrs'] : array();
    $class     = isset($attrs['className']) ? $attrs['className'] : '';
    $is_loop   = false !== strpos($class, 'is-style-gif-loop') || !empty($attrs['autoplay']);

    $content = preg_replace_callback('/<video\b([^>]*)>/i', function ($m) use ($is_loop) {
        $tag = $m[1];
        if (!preg_match('/\splaysinline\b/i', $tag)) {
            $tag .= ' playsinline';
        }
        if (!preg_match('/\spreload=/i', $tag)) {
            $tag .= ' preload="metadata"';
        }
        if ($is_loop) {
            // The script starts it when it scrolls into view (and not at
            // all for reduced motion); autoplay would start it off screen.
            $tag = preg_replace('/\sautoplay\b(="[^"]*")?/i', '', $tag);
            $tag = preg_replace('/\spreload="[^"]*"/i', ' preload="none"', $tag);
            foreach (array('muted', 'loop') as $flag) {
                if (!preg_match('/\s' . $flag . '\b/i', $tag)) {
                    $tag .= ' ' . $flag;
                }
            }
            $tag .= ' data-infinity-loop';
        }
        return '<video' . $tag . '>';
    }, $content, 1);

    if ($is_loop) {
        $content = preg_replace('/class="wp-block-video/', 'class="wp-block-video infinity-loop-wrap', $content, 1);
    }

    return $content;
}
add_filter('render_block_core/video', 'infinity_render_video_block', 10, 2);

/* -------------------------------------------------------------------------
 * YouTube: click-to-load facade
 * ---------------------------------------------------------------------- */

/**
 * @param string $url Any YouTube watch / share / shorts / embed URL.
 * @return string 11-character video id, or ''.
 */
function infinity_youtube_id($url) {
    if (preg_match('~(?:youtu\.be/|youtube(?:-nocookie)?\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/|live/|v/))([A-Za-z0-9_-]{11})~', (string) $url, $m)) {
        return $m[1];
    }
    return '';
}

/**
 * Facade markup: a real link to the video (works without JS), dressed as
 * a player. post-media.js swaps in the privacy-enhanced iframe on click.
 *
 * @param string $id    YouTube video id.
 * @param string $title Accessible title.
 * @param bool   $eager Load the thumbnail eagerly (post header).
 * @return string
 */
function infinity_youtube_facade_html($id, $title = '', $eager = false) {
    $title = $title ?: __('YouTube video', 'infinity');
    return sprintf(
        '<a class="infinity-yt" href="%1$s" data-yt="%2$s" data-title="%3$s" target="_blank" rel="noopener">'
        . '<img src="https://i.ytimg.com/vi/%2$s/hqdefault.jpg" srcset="https://i.ytimg.com/vi/%2$s/mqdefault.jpg 320w, https://i.ytimg.com/vi/%2$s/hqdefault.jpg 480w" sizes="(max-width: 640px) 100vw, 800px" alt="" width="480" height="360" loading="%4$s" decoding="async">'
        . '<span class="infinity-yt-play" aria-hidden="true"><svg viewBox="0 0 68 48" width="68" height="48"><path class="infinity-yt-play-bg" d="M66.5 7.7c-.8-2.9-2.5-5.4-5.4-6.2C55.8.1 34 0 34 0S12.2.1 6.9 1.6c-3 .7-4.6 3.2-5.4 6.1C.1 13 0 24 0 24s.1 11 1.5 16.3c.8 2.9 2.5 5.4 5.4 6.2C12.2 47.9 34 48 34 48s21.8-.1 27.1-1.6c2.9-.7 4.6-3.2 5.4-6.1C67.9 35 68 24 68 24s-.1-11-1.5-16.3z"/><path fill="#fff" d="M45 24 27 14v20z"/></svg></span>'
        . '<span class="infinity-yt-title">%5$s</span>'
        . '<span class="screen-reader-text">%6$s</span>'
        . '</a>',
        esc_url('https://www.youtube.com/watch?v=' . $id),
        esc_attr($id),
        esc_attr($title),
        $eager ? 'eager' : 'lazy',
        esc_html($title),
        esc_html(sprintf(__('Play video: %s', 'infinity'), $title))
    );
}

/**
 * Swap YouTube oEmbed iframes for the facade. embed_oembed_html runs for
 * embed blocks (old and new), bare URLs in classic content, and cached
 * oEmbed results alike. The editor's preview (a REST request) keeps the
 * real player.
 */
function infinity_youtube_oembed_facade($html, $url) {
    if (is_admin() || is_feed() || (defined('REST_REQUEST') && REST_REQUEST)) {
        return $html;
    }
    if (!apply_filters('infinity_youtube_facade', true, $url)) {
        return $html;
    }
    $id = infinity_youtube_id($url);
    if (!$id || false === stripos($html, '<iframe')) {
        return $html;
    }
    $title = '';
    if (preg_match('/<iframe[^>]*\stitle="([^"]*)"/i', $html, $m)) {
        $title = html_entity_decode($m[1], ENT_QUOTES);
    }
    return infinity_youtube_facade_html($id, $title);
}
add_filter('embed_oembed_html', 'infinity_youtube_oembed_facade', 20, 2);

/* -------------------------------------------------------------------------
 * Post header media
 * ---------------------------------------------------------------------- */

function infinity_register_header_media_meta() {
    $string = array(
        'type'              => 'string',
        'single'            => true,
        'show_in_rest'      => true,
        'sanitize_callback' => 'esc_url_raw',
        'auth_callback'     => function () {
            return current_user_can('edit_posts');
        },
    );
    register_post_meta('post', INFINITY_HEADER_VIDEO_META, $string);
    register_post_meta('post', INFINITY_HEADER_WEBM_META, $string);

    $choice = $string;
    $choice['sanitize_callback'] = 'sanitize_key';
    register_post_meta('post', INFINITY_HEADER_MODE_META, $choice);
    register_post_meta('post', INFINITY_HEADER_LAYOUT_META, $choice);
}
add_action('init', 'infinity_register_header_media_meta');

/**
 * Header media settings for a post.
 *
 * @param int|null $post_id
 * @return array{video: string, webm: string, youtube: string, mode: string, layout: string}
 */
function infinity_header_media($post_id = null) {
    $post_id = $post_id ?: get_the_ID();
    $video   = (string) get_post_meta($post_id, INFINITY_HEADER_VIDEO_META, true);
    $youtube = infinity_youtube_id($video);
    $mode    = get_post_meta($post_id, INFINITY_HEADER_MODE_META, true);
    $layout  = get_post_meta($post_id, INFINITY_HEADER_LAYOUT_META, true);

    return array(
        'video'   => $youtube ? '' : $video,
        'webm'    => $youtube ? '' : (string) get_post_meta($post_id, INFINITY_HEADER_WEBM_META, true),
        'youtube' => $youtube,
        'mode'    => in_array($mode, array('loop', 'player'), true) ? $mode : 'loop',
        'layout'  => in_array($layout, array('contained', 'wide'), true) ? $layout : 'contained',
    );
}

/**
 * Poster for the header video: the featured image (its still frame if
 * the featured image is a GIF).
 */
function infinity_header_poster_url($post_id) {
    $thumb_id = get_post_thumbnail_id($post_id);
    if (!$thumb_id) {
        return '';
    }
    if (infinity_is_gif($thumb_id)) {
        return infinity_gif_still_url($thumb_id) ?: (string) wp_get_attachment_url($thumb_id);
    }
    return (string) get_the_post_thumbnail_url($post_id, 'simulation-hero');
}

/**
 * Render the post header media: header video, YouTube, animated GIF, or
 * the featured image. Echoes nothing when the post has none of them.
 *
 * @param int|null $post_id
 */
function infinity_the_post_header_media($post_id = null) {
    $post_id  = $post_id ?: get_the_ID();
    $media    = infinity_header_media($post_id);
    $thumb_id = get_post_thumbnail_id($post_id);
    $inner    = '';
    $kind     = '';

    if ($media['youtube']) {
        $kind  = 'youtube';
        $inner = infinity_youtube_facade_html($media['youtube'], get_the_title($post_id), true);
    } elseif ($media['video']) {
        $kind      = 'video';
        $video_id  = attachment_url_to_postid($media['video']);
        $vmeta     = $video_id ? wp_get_attachment_metadata($video_id) : array();
        $ext       = strtolower(pathinfo(wp_parse_url($media['video'], PHP_URL_PATH) ?: '', PATHINFO_EXTENSION));
        $sources   = array('webm' === $ext ? 'webm' : 'mp4' => $media['video']);
        if ($media['webm']) {
            $sources['webm'] = $media['webm'];
        }
        $dims = (!empty($vmeta['width']) && !empty($vmeta['height']))
            ? sprintf(' width="%d" height="%d"', $vmeta['width'], $vmeta['height'])
            : '';
        $poster = infinity_header_poster_url($post_id);

        if ('player' === $media['mode']) {
            $attrs = 'controls playsinline preload="metadata" data-eager';
        } else {
            $attrs = 'class="infinity-loop" data-infinity-loop muted loop playsinline preload="auto" aria-hidden="true" data-eager';
        }
        $inner = sprintf(
            '<video %1$s%2$s%3$s>%4$s</video>',
            $attrs,
            $poster ? ' poster="' . esc_url($poster) . '"' : '',
            $dims,
            infinity_video_sources_html($sources)
        );
    } elseif ($thumb_id && infinity_is_gif($thumb_id)) {
        $kind  = 'gif';
        $inner = infinity_gif_markup($thumb_id, array('priority' => true));
    } elseif ($thumb_id) {
        $kind  = 'image';
        $inner = get_the_post_thumbnail($post_id, 'simulation-hero', array('fetchpriority' => 'high', 'loading' => 'eager'));
    }

    if (!$inner) {
        return;
    }

    $classes = array('entry-thumbnail', 'entry-hero-media', 'entry-hero-' . $kind, 'container');
    if ('wide' === $media['layout']) {
        $classes[] = 'entry-hero-wide';
    }
    if ('video' === $kind && 'loop' === $media['mode']) {
        $classes[] = 'infinity-loop-wrap';
    }

    // Already escaped piecewise above
    echo '<figure class="' . esc_attr(implode(' ', $classes)) . '">' . $inner . '</figure>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

/**
 * Open Graph video tags for posts with a header video. Hooked after the
 * theme's own OG tags (priority 5) and skipped alongside them when an
 * SEO plugin owns the head.
 */
function infinity_header_video_og() {
    if (!is_singular('post') || defined('WPSEO_VERSION') || class_exists('RankMath') || defined('AIOSEO_VERSION')) {
        return;
    }
    $media = infinity_header_media();
    if ($media['youtube']) {
        printf('<meta property="og:video" content="%s">' . "\n", esc_url('https://www.youtube.com/embed/' . $media['youtube']));
        echo '<meta property="og:video:type" content="text/html">' . "\n";
    } elseif ($media['video']) {
        printf('<meta property="og:video" content="%s">' . "\n", esc_url($media['video']));
        printf('<meta property="og:video:type" content="%s">' . "\n", esc_attr(wp_check_filetype($media['video'])['type'] ?: 'video/mp4'));
    }
}
add_action('wp_head', 'infinity_header_video_og', 5);

/**
 * VideoObject for the Article structured data (see infinity_seo_json_ld).
 *
 * @return array|null
 */
function infinity_header_video_schema($post_id = null) {
    $post_id = $post_id ?: get_the_ID();
    $media   = infinity_header_media($post_id);
    if (!$media['video'] && !$media['youtube']) {
        return null;
    }

    $thumb = $media['youtube']
        ? 'https://i.ytimg.com/vi/' . $media['youtube'] . '/hqdefault.jpg'
        : infinity_header_poster_url($post_id);

    $schema = array(
        '@type'        => 'VideoObject',
        'name'         => get_the_title($post_id),
        'description'  => wp_strip_all_tags(get_the_excerpt($post_id)) ?: get_the_title($post_id),
        'uploadDate'   => get_the_date('c', $post_id),
        'thumbnailUrl' => $thumb ?: get_template_directory_uri() . '/screenshot.png',
    );
    if ($media['youtube']) {
        $schema['embedUrl'] = 'https://www.youtube.com/embed/' . $media['youtube'];
    } else {
        $schema['contentUrl'] = $media['video'];
    }
    return $schema;
}

/* -------------------------------------------------------------------------
 * Admin: header media box and GIF fields
 * ---------------------------------------------------------------------- */

function infinity_header_media_meta_box() {
    add_meta_box(
        'infinity-header-media',
        __('Header media', 'infinity'),
        'infinity_render_header_media_box',
        'post',
        'side',
        'default'
    );
}
add_action('add_meta_boxes', 'infinity_header_media_meta_box');

function infinity_render_header_media_box($post) {
    wp_nonce_field('infinity_header_media', 'infinity_header_media_nonce');
    $video  = get_post_meta($post->ID, INFINITY_HEADER_VIDEO_META, true);
    $webm   = get_post_meta($post->ID, INFINITY_HEADER_WEBM_META, true);
    $mode   = get_post_meta($post->ID, INFINITY_HEADER_MODE_META, true) ?: 'loop';
    $layout = get_post_meta($post->ID, INFINITY_HEADER_LAYOUT_META, true) ?: 'contained';
    ?>
    <p class="description"><?php esc_html_e('Shown above the article in place of the featured image. The featured image becomes the poster frame. GIF featured images animate on their own.', 'infinity'); ?></p>

    <p>
        <label for="infinity-header-video"><strong><?php esc_html_e('Video (MP4, WebM or YouTube link)', 'infinity'); ?></strong></label>
        <input type="url" class="widefat" id="infinity-header-video" name="infinity_header_video" value="<?php echo esc_attr($video); ?>" placeholder="https://">
        <button type="button" class="button infinity-media-pick" data-target="infinity-header-video" data-type="video"><?php esc_html_e('Choose from library', 'infinity'); ?></button>
    </p>

    <p>
        <label for="infinity-header-webm"><?php esc_html_e('Optional WebM version (smaller, tried first)', 'infinity'); ?></label>
        <input type="url" class="widefat" id="infinity-header-webm" name="infinity_header_video_webm" value="<?php echo esc_attr($webm); ?>" placeholder="https://">
        <button type="button" class="button infinity-media-pick" data-target="infinity-header-webm" data-type="video/webm"><?php esc_html_e('Choose WebM', 'infinity'); ?></button>
    </p>

    <fieldset>
        <legend><strong><?php esc_html_e('Playback', 'infinity'); ?></strong></legend>
        <label><input type="radio" name="infinity_header_video_mode" value="loop" <?php checked($mode, 'loop'); ?>> <?php esc_html_e('Ambient loop (silent, like a GIF)', 'infinity'); ?></label><br>
        <label><input type="radio" name="infinity_header_video_mode" value="player" <?php checked($mode, 'player'); ?>> <?php esc_html_e('Player with sound and controls', 'infinity'); ?></label>
    </fieldset>

    <fieldset style="margin-top:8px">
        <legend><strong><?php esc_html_e('Width', 'infinity'); ?></strong></legend>
        <label><input type="radio" name="infinity_header_layout" value="contained" <?php checked($layout, 'contained'); ?>> <?php esc_html_e('Contained', 'infinity'); ?></label><br>
        <label><input type="radio" name="infinity_header_layout" value="wide" <?php checked($layout, 'wide'); ?>> <?php esc_html_e('Full width (cinematic)', 'infinity'); ?></label>
    </fieldset>
    <?php
}

function infinity_save_header_media($post_id) {
    if (!isset($_POST['infinity_header_media_nonce'])
        || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['infinity_header_media_nonce'])), 'infinity_header_media')
        || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)
        || !current_user_can('edit_post', $post_id)) {
        return;
    }

    $urls = array(
        INFINITY_HEADER_VIDEO_META => 'infinity_header_video',
        INFINITY_HEADER_WEBM_META  => 'infinity_header_video_webm',
    );
    foreach ($urls as $key => $field) {
        $value = isset($_POST[$field]) ? esc_url_raw(wp_unslash($_POST[$field])) : '';
        if ($value) {
            update_post_meta($post_id, $key, $value);
        } else {
            delete_post_meta($post_id, $key);
        }
    }

    $mode = isset($_POST['infinity_header_video_mode']) ? sanitize_key(wp_unslash($_POST['infinity_header_video_mode'])) : 'loop';
    update_post_meta($post_id, INFINITY_HEADER_MODE_META, in_array($mode, array('loop', 'player'), true) ? $mode : 'loop');

    $layout = isset($_POST['infinity_header_layout']) ? sanitize_key(wp_unslash($_POST['infinity_header_layout'])) : 'contained';
    update_post_meta($post_id, INFINITY_HEADER_LAYOUT_META, in_array($layout, array('contained', 'wide'), true) ? $layout : 'contained');
}
add_action('save_post_post', 'infinity_save_header_media');

function infinity_header_media_admin_assets($hook) {
    if (!in_array($hook, array('post.php', 'post-new.php'), true) || 'post' !== get_current_screen()->post_type) {
        return;
    }
    wp_enqueue_media();
    wp_enqueue_script(
        'infinity-admin-post-media',
        INFINITY_URI . '/assets/js/admin-post-media.js',
        array('jquery'),
        INFINITY_VERSION,
        true
    );
}
add_action('admin_enqueue_scripts', 'infinity_header_media_admin_assets');

/**
 * Media library: on GIFs, show the file size with a nudge toward a video
 * loop, and a "Loop video" field to pair one.
 */
function infinity_gif_attachment_fields($fields, $post) {
    if (!infinity_is_gif($post->ID)) {
        return $fields;
    }

    $file  = get_attached_file($post->ID);
    $bytes = ($file && file_exists($file)) ? filesize($file) : 0;
    $twin  = infinity_gif_video_twin($post->ID);

    if ($twin) {
        $status = __('Served as a video loop on posts.', 'infinity');
    } elseif ($bytes > 2 * MB_IN_BYTES) {
        $status = sprintf(
            /* translators: %s: file size */
            __('This GIF is %s. An MP4 of the same clip is typically 5–20× smaller: upload it with the same file name, or pick it below.', 'infinity'),
            size_format($bytes, 1)
        );
    } else {
        $status = sprintf(__('%s. Animates in posts.', 'infinity'), size_format($bytes, 1));
    }

    $fields['infinity_gif_video'] = array(
        'label' => __('Loop video', 'infinity'),
        'input' => 'text',
        'value' => (string) get_post_meta($post->ID, INFINITY_GIF_VIDEO_META, true),
        'helps' => __('MP4/WebM URL or attachment ID to serve instead of this GIF.', 'infinity') . ' ' . $status,
    );
    return $fields;
}
add_filter('attachment_fields_to_edit', 'infinity_gif_attachment_fields', 10, 2);

function infinity_gif_attachment_save($post, $attachment) {
    if (isset($attachment['infinity_gif_video']) && infinity_is_gif($post['ID'])) {
        $value = trim((string) $attachment['infinity_gif_video']);
        $value = ctype_digit($value) ? $value : esc_url_raw($value);
        if ($value) {
            update_post_meta($post['ID'], INFINITY_GIF_VIDEO_META, $value);
        } else {
            delete_post_meta($post['ID'], INFINITY_GIF_VIDEO_META);
        }
    }
    return $post;
}
add_filter('attachment_fields_to_save', 'infinity_gif_attachment_save', 10, 2);
