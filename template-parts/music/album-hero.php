<?php
/**
 * Featured album hero, shown at the top of the music hub page
 *
 * Copy and art come from Appearance → Customize → Music Pages. Only the
 * top-level music page gets it; child pages (a single album, say) start
 * straight with their own content.
 *
 * @package Infinity
 */

if (!get_option('infinity_album_show', 1) || wp_get_post_parent_id(get_the_ID())) {
    return;
}

$album_title    = get_option('infinity_album_title', 'Explore the Universe 2175');
$album_kicker   = get_option('infinity_album_kicker', __('Next album · In the studio', 'infinity'));
$album_subtitle = get_option('infinity_album_subtitle', __('Original soundtrack by E.T.', 'infinity'));
$album_blurb    = get_option('infinity_album_blurb', __('The score for the game: orbital ambience, battle themes and the sound of a living galaxy, written in Ableton alongside the build. Follow on SoundCloud to hear the tracks as they come out of the studio.', 'infinity'));
$album_status   = get_option('infinity_album_status', __('Coming soon', 'infinity'));
$album_cover    = get_option('infinity_album_cover', '');
$soundcloud_url = get_option('infinity_soundcloud_url', '');
$steam_url      = get_option('infinity_steam_url', 'https://store.steampowered.com/app/4094340/Explore_the_Universe_2175/');
?>

<section class="album-hero" aria-labelledby="album-hero-title">
    <div class="album-hero-backdrop" aria-hidden="true"></div>

    <div class="album-hero-inner">
        <div class="album-hero-art">
            <span class="album-hero-disc" aria-hidden="true"></span>
            <?php if ($album_cover) : ?>
                <img class="album-hero-cover" src="<?php echo esc_url($album_cover); ?>" alt="<?php echo esc_attr(sprintf(__('%s album cover', 'infinity'), $album_title)); ?>" width="600" height="600">
            <?php else : ?>
                <div class="album-hero-cover album-hero-cover--drawn" role="img" aria-label="<?php echo esc_attr(sprintf(__('%s album cover', 'infinity'), $album_title)); ?>">
                    <span class="album-cover-planet"></span>
                    <span class="album-cover-kicker">E.T.</span>
                    <span class="album-cover-title">Explore<br>the Universe</span>
                    <span class="album-cover-year">2175</span>
                </div>
            <?php endif; ?>
        </div>

        <div class="album-hero-copy">
            <?php if ($album_kicker) : ?>
                <p class="album-hero-kicker">
                    <span class="album-hero-pulse" aria-hidden="true"></span>
                    <?php echo esc_html($album_kicker); ?>
                </p>
            <?php endif; ?>

            <h2 id="album-hero-title" class="album-hero-title"><?php echo esc_html($album_title); ?></h2>

            <?php if ($album_subtitle) : ?>
                <p class="album-hero-subtitle"><?php echo esc_html($album_subtitle); ?></p>
            <?php endif; ?>

            <?php if ($album_blurb) : ?>
                <p class="album-hero-blurb"><?php echo esc_html($album_blurb); ?></p>
            <?php endif; ?>

            <?php if ($album_status) : ?>
                <p class="album-hero-status"><?php echo esc_html($album_status); ?></p>
            <?php endif; ?>

            <div class="album-hero-actions">
                <?php if ($soundcloud_url) : ?>
                    <a class="music-btn music-btn--soundcloud" href="<?php echo esc_url($soundcloud_url); ?>" target="_blank" rel="noopener noreferrer">
                        <?php infinity_soundcloud_mark(26); ?>
                        <span><?php esc_html_e('Follow on SoundCloud', 'infinity'); ?></span>
                    </a>
                <?php elseif (current_user_can('edit_theme_options')) : ?>
                    <a class="music-btn music-btn--setup" href="<?php echo esc_url(admin_url('customize.php?autofocus[section]=infinity_music_settings')); ?>">
                        <?php esc_html_e('Add your SoundCloud URL to show the follow button', 'infinity'); ?>
                    </a>
                <?php endif; ?>

                <?php if ($steam_url) : ?>
                    <a class="music-btn music-btn--ghost" href="<?php echo esc_url($steam_url); ?>" target="_blank" rel="noopener noreferrer">
                        <?php esc_html_e('Wishlist the game', 'infinity'); ?>
                    </a>
                <?php endif; ?>
            </div>
        </div>
    </div>
</section>
