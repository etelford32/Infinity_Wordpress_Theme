<?php
/**
 * Infinity icon set — custom "emojis from the future".
 *
 * Hand-drawn 24x24 stroke icons with a cyan→violet gradient and a
 * soft glow (via the .inf-icon CSS class). Used anywhere the theme
 * previously leaned on stock emoji. infinity_icon('earth') echoes an
 * inline SVG; unknown names fall back to a spark.
 *
 * @package Infinity
 * @since 2.7.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Icon path library. Each entry is inner SVG markup for a 24x24
 * viewBox, stroke-based, drawn for stroke-width 1.6.
 */
function infinity_icon_paths() {
    return array(
        'earth' => '<circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8"/><g class="inf-earth-rotor"><path d="M12 3a14.2 14.2 0 0 1 0 18M12 3a14.2 14.2 0 0 0 0 18"/><path d="M12 3v18"/></g>',
        'aurora' => '<path d="M4 15.5c1.6-1.2 2.4-4.5 2.4-8.5M9.6 17c1.2-1.6 2-5.5 2-11M15.2 17.5c1-1.8 1.6-5 1.6-9.5M20 15c.6-1.4 1-3.5 1-6"/><path d="M3 19.5h18"/><circle cx="18.6" cy="4.4" r="0.9" fill="currentColor" stroke="none"/>',
        'orbit' => '<circle cx="12" cy="12" r="2.1"/><ellipse cx="12" cy="12" rx="9.5" ry="4.1"/><ellipse cx="12" cy="12" rx="9.5" ry="4.1" transform="rotate(62 12 12)"/><circle cx="20.6" cy="9.8" r="1.15" fill="currentColor" stroke="none"/><circle cx="6.4" cy="17.6" r="0.95" fill="currentColor" stroke="none"/>',
        'rocket' => '<path d="M12 2.6c2.9 1.9 4.4 5 4.4 8.9 0 1.5-.2 2.9-.6 4.2H8.2a15 15 0 0 1-.6-4.2c0-3.9 1.5-7 4.4-8.9z"/><circle cx="12" cy="9.4" r="1.9"/><path d="M8.2 15.7 5.6 19c-.3.5 0 1.1.6 1.1h3M15.8 15.7l2.6 3.3c.3.5 0 1.1-.6 1.1h-3"/><path d="M12 17v4.4"/>',
        'satellite' => '<rect x="9.4" y="9.4" width="5.2" height="5.2" rx="0.8" transform="rotate(45 12 12)"/><path d="M4.2 7.4l3.2 3.2M16.6 13.4l3.2 3.2"/><rect x="1.6" y="4.8" width="5.2" height="3.6" rx="0.7" transform="rotate(45 4.2 6.6)"/><rect x="17.2" y="15.6" width="5.2" height="3.6" rx="0.7" transform="rotate(45 19.8 17.4)"/><path d="M14.6 5.2a6.4 6.4 0 0 1 4.2 4.2M15.6 2.4a9.4 9.4 0 0 1 6 6"/>',
        'ship' => '<path d="M12 3.2 18.6 17a1 1 0 0 1-1.2 1.4L12 16.6l-5.4 1.8A1 1 0 0 1 5.4 17L12 3.2z"/><path d="M9.4 19.6c.6 1 1.2 1.6 2.6 1.6s2-.6 2.6-1.6"/><circle cx="12" cy="11.6" r="1.5"/>',
        'flask' => '<path d="M9.6 3h4.8M10.6 3v5.2L5.4 17.6A2 2 0 0 0 7.2 20.6h9.6a2 2 0 0 0 1.8-3L13.4 8.2V3"/><path d="M7.6 14.6h8.8"/><circle cx="10.6" cy="17.4" r="0.8" fill="currentColor" stroke="none"/><circle cx="13.8" cy="16.6" r="0.6" fill="currentColor" stroke="none"/>',
        'planner' => '<rect x="3.4" y="4.4" width="17.2" height="16" rx="2"/><path d="M3.4 9h17.2M8.2 2.6v3.6M15.8 2.6v3.6"/><path d="M7 13.4l2.4 4.2M9.4 17.6l5.2-5.2M14.6 12.4l2.6 2.2" stroke-dasharray="1.6 2"/><circle cx="7" cy="13.4" r="1" fill="currentColor" stroke="none"/><circle cx="17.2" cy="14.6" r="1" fill="currentColor" stroke="none"/>',
        'palette' => '<path d="M12 3a9 9 0 1 0 .4 18c1.3 0 1.9-.8 1.9-1.7 0-.8-.5-1.3-.5-2 0-1 .8-1.7 1.9-1.7h2.1A3.2 3.2 0 0 0 21 12.3C20.8 7.1 16.9 3 12 3z"/><circle cx="7.8" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="7.4" r="1.1" fill="currentColor" stroke="none"/><circle cx="16.2" cy="10" r="1.1" fill="currentColor" stroke="none"/>',
        'tree' => '<path d="M12 21.4v-6.2"/><path d="M12 2.8l4.6 6h-2.4l3.6 4.6h-2.6l3 4H5.8l3-4H6.2l3.6-4.6H7.4l4.6-6z"/>',
        'leaf' => '<path d="M19.8 4.2C12 4.6 6.4 7.6 5.2 13.2c-.7 3.2 1 6 4.2 6.6 5.6 1 9.6-4.6 10.4-15.6z"/><path d="M5.8 20.2C9 15 13 11 17.6 7.8"/>',
        'wall' => '<path d="M3 6.4h18v12H3z"/><path d="M3 10.4h18M3 14.4h18M8 6.4v4M14 6.4v4M6 10.4v4M12 10.4v4M18 10.4v4M9 14.4v4M15 14.4v4"/>',
        'clipboard' => '<rect x="5" y="4.4" width="14" height="16.6" rx="2"/><path d="M9 4.4a3 3 0 0 1 6 0"/><path d="M8.6 11l2.2 2.2 4.6-4.6M8.6 16.6h6.8"/>',
        'spark' => '<path d="M12 2.8c.7 4.4 2.6 6.3 7 7-4.4.7-6.3 2.6-7 7-.7-4.4-2.6-6.3-7-7 4.4-.7 6.3-2.6 7-7z"/><circle cx="19" cy="17.6" r="0.9" fill="currentColor" stroke="none"/>',
        'sun' => '<circle cx="12" cy="12" r="4.4"/><path d="M12 2.6v2.8M12 18.6v2.8M2.6 12h2.8M18.6 12h2.8M5.2 5.2l2 2M16.8 16.8l2 2M18.8 5.2l-2 2M7.2 16.8l-2 2"/>',
        'moon' => '<path d="M20.4 13.4A8.4 8.4 0 1 1 10.6 3.6a6.8 6.8 0 0 0 9.8 9.8z"/><circle cx="17.6" cy="5.8" r="0.8" fill="currentColor" stroke="none"/>',
    );
}

/**
 * Render a futuristic icon. Unknown names get the spark.
 */
function infinity_icon($name, $size = 22) {
    static $instance = 0;
    $instance++;

    $paths = infinity_icon_paths();
    $inner = isset($paths[$name]) ? $paths[$name] : $paths['spark'];
    $gid   = 'infg-' . $instance;

    printf(
        '<svg class="inf-icon inf-icon-%1$s" width="%2$d" height="%2$d" viewBox="0 0 24 24" fill="none" stroke="url(#%3$s)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><defs><linearGradient id="%3$s" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#67e8f9"/><stop offset="0.55" stop-color="#818cf8"/><stop offset="1" stop-color="#c084fc"/></linearGradient></defs>%4$s</svg>',
        esc_attr($name),
        (int) $size,
        esc_attr($gid),
        $inner // phpcs:ignore WordPress.Security.EscapeOutput -- static markup from infinity_icon_paths()
    );
}

/**
 * Whether a feature icon token refers to a custom icon.
 */
function infinity_is_icon_token($token) {
    return (bool) preg_match('/^[a-z][a-z0-9-]*$/', $token) && array_key_exists($token, infinity_icon_paths());
}

/**
 * Marketing brand marks for the sibling properties.
 *
 * These are full-colour marks, not members of the stroke icon set
 * above: each property owns its palette, so they carry their own
 * gradients rather than the shared cyan→violet one.
 *
 * They are theme-drawn stand-ins built from each property's existing
 * palette in this repo — Parker's Physics as the blue/orange binary
 * (the same split the `#pp-blackhole` variant shader uses), Explore
 * the Universe 2175 as a ringed world under a plotted transfer. To
 * use the real artwork instead, set the matching logo option
 * (`infinity_parkers_logo` / `infinity_etu_logo`) to an image URL and
 * infinity_brand_mark() will render that image in its place.
 *
 * @since 3.1.0
 */
function infinity_brand_mark_svg($key, $size = 20) {
    static $instance = 0;
    $instance++;
    $gid = 'infbm-' . $instance;

    $size = (int) $size;
    $open = sprintf(
        '<svg class="inf-brand-mark inf-brand-mark-%1$s" width="%2$d" height="%2$d" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">',
        esc_attr($key),
        $size
    );

    if ('parkers' === $key) {
        // Binary system: two bodies sharing one inclined orbit around a
        // common barycentre — blue primary, orange companion.
        return $open
            . '<defs>'
            . '<linearGradient id="' . esc_attr($gid) . '-a" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">'
            . '<stop offset="0" stop-color="#7cc4ff"/><stop offset="1" stop-color="#3b82f6"/></linearGradient>'
            . '<linearGradient id="' . esc_attr($gid) . '-b" x1="4" y1="20" x2="20" y2="6" gradientUnits="userSpaceOnUse">'
            . '<stop offset="0" stop-color="#ffb765"/><stop offset="1" stop-color="#f97316"/></linearGradient>'
            . '</defs>'
            . '<ellipse cx="12" cy="12" rx="10" ry="5.6" transform="rotate(-24 12 12)" stroke="url(#' . esc_attr($gid) . '-a)" stroke-width="1.5" opacity="0.75"/>'
            . '<circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.55"/>'
            . '<circle cx="4.6" cy="15.6" r="3.1" fill="url(#' . esc_attr($gid) . '-a)"/>'
            . '<circle cx="19.4" cy="8.4" r="2.2" fill="url(#' . esc_attr($gid) . '-b)"/>'
            . '</svg>';
    }

    // Explore the Universe 2175: a ringed world with a plotted transfer
    // arc climbing off it, and the star it is departing.
    return $open
        . '<defs>'
        . '<linearGradient id="' . esc_attr($gid) . '-a" x1="4" y1="6" x2="18" y2="21" gradientUnits="userSpaceOnUse">'
        . '<stop offset="0" stop-color="#8fd6ff"/><stop offset="1" stop-color="#1b6ec2"/></linearGradient>'
        . '</defs>'
        . '<circle cx="10.4" cy="13.6" r="5.6" fill="url(#' . esc_attr($gid) . '-a)"/>'
        . '<ellipse cx="10.4" cy="13.6" rx="9.4" ry="3.2" transform="rotate(-21 10.4 13.6)" stroke="#66c0f4" stroke-width="1.4" opacity="0.85"/>'
        . '<path d="M3.4 9.2C7 3.6 14.4 2 20.6 4.4" stroke="#ffd7a1" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3.4 2.6" opacity="0.95"/>'
        . '<circle cx="20.6" cy="4.4" r="1.9" fill="#ffd166"/>'
        . '</svg>';
}

/**
 * Echo a property's brand mark, preferring a real uploaded logo when
 * the site owner has set one.
 */
function infinity_brand_mark($key, $size = 20) {
    $logo = get_option('infinity_' . $key . '_logo', '');
    if ($logo) {
        printf(
            '<img class="inf-brand-mark inf-brand-mark-img" src="%1$s" width="%2$d" height="%2$d" alt="" loading="lazy" decoding="async">',
            esc_url($logo),
            (int) $size
        );
        return;
    }

    echo infinity_brand_mark_svg($key, $size); // phpcs:ignore WordPress.Security.EscapeOutput -- static markup built above
}
