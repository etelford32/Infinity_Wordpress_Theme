<?php
/**
 * ETU 2175 title typography, server-rendered.
 *
 * The letters are the official Explore the Universe 2175 title artwork
 * cut into a sprite font in that project's repo (etelford32/ETUWebsite,
 * public/brand/etu-glyphs.webp + etu-glyphs.json, built by
 * scripts/extract-title-glyphs.py). This is the static half of its
 * <EtuTitle> component: same metrics, same layout maths, no motion.
 *
 * The atlas bundled here is a quarter-resolution copy (64KB instead of
 * 636KB). Metrics stay in the source atlas's pixels — the CSS sizes
 * the background from them, so the bitmap's own resolution never
 * enters the layout. A quarter still carries a 43px letter, which is
 * 2x for anything up to a ~27px font size; past that, bundle a larger
 * copy.
 *
 * @package Infinity
 * @since 3.4.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Sprite metrics, decoded once per request.
 */
function infinity_etu_font() {
    static $font = null;
    if (null === $font) {
        $json = file_get_contents(INFINITY_DIR . '/assets/img/etu-glyphs.json'); // phpcs:ignore WordPress.WP.AlternativeFunctions -- bundled theme file
        $font = $json ? json_decode($json, true) : array();
    }
    return $font;
}

/**
 * Markup for $text set in the ETU title face.
 *
 * The visible letters are aria-hidden sprites; the words themselves
 * ride along in a .sr-only span so the accessible name is unchanged.
 * Characters the artwork has no glyph for fall back to Orbitron, so a
 * custom label never loses a letter.
 *
 * Mirrors layoutWord() in the source repo's src/lib/etuTitle/layout.ts:
 * uppercase, then each glyph carries the kerning to its right-hand
 * neighbour.
 */
function infinity_etu_type($text, $class = '') {
    $font = infinity_etu_font();
    $text = trim((string) $text);
    if ('' === $text || empty($font['glyphs'])) {
        return '<span class="' . esc_attr(trim('etu-type-fallback ' . $class)) . '">' . esc_html($text) . '</span>';
    }

    $glyphs  = $font['glyphs'];
    $kerning = isset($font['kerning']) ? $font['kerning'] : array();
    $upper   = function_exists('mb_strtoupper') ? mb_strtoupper($text, 'UTF-8') : strtoupper($text);
    $words   = preg_split('/\s+/u', $upper, -1, PREG_SPLIT_NO_EMPTY);

    $style = sprintf(
        '--etu-art:url(%1$s);--etu-aw:%2$d;--etu-ah:%3$d;--etu-frame:%4$d;--etu-margin:%5$d;--etu-depth:%6$d',
        esc_url(INFINITY_URI . '/assets/img/etu-glyphs.webp'),
        (int) $font['width'],
        (int) $font['height'],
        (int) $font['frameHeight'],
        (int) $font['margin'],
        (int) $font['depth']
    );

    $out = '';
    foreach ($words as $word) {
        $chars = preg_split('//u', $word, -1, PREG_SPLIT_NO_EMPTY);
        $out  .= '<span class="etu-type__word">';
        foreach ($chars as $i => $char) {
            if (!isset($glyphs[$char])) {
                $out .= '<span class="etu-type__char">' . esc_html($char) . '</span>';
                continue;
            }
            $g    = $glyphs[$char];
            $next = isset($chars[$i + 1]) ? $chars[$i + 1] : '';
            $kern = ('' !== $next && isset($kerning[$char . $next])) ? (int) $kerning[$char . $next] : 0;
            $out .= sprintf(
                '<span class="etu-glyph" style="--gx:%d;--gy:%d;--gw:%d;--ga:%d;--kern:%d"></span>',
                (int) $g['x'],
                (int) $g['y'],
                (int) $g['w'],
                (int) $g['advance'],
                $kern
            );
        }
        $out .= '</span>';
    }

    return sprintf(
        '<span class="%1$s" style="%2$s"><span class="sr-only">%3$s</span><span class="etu-type__body" aria-hidden="true">%4$s</span></span>',
        esc_attr(trim('etu-type ' . $class)),
        esc_attr($style),
        esc_html($text),
        $out
    );
}
