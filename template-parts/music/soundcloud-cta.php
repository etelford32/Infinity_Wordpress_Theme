<?php
/**
 * "Follow the E.T." band, closing every music page
 *
 * SoundCloud leads when its URL is set (Appearance → Customize → Music
 * Pages); Spotify and YouTube sit beside it. Any platform without a URL
 * is left out, and the band disappears if none are set. Admins see a
 * setup prompt in place of a missing SoundCloud link.
 *
 * @package Infinity
 */

$links = array();
foreach (array_keys(infinity_music_platforms()) as $platform) {
    $url = infinity_music_platform_url($platform);
    if ($url) {
        $links[$platform] = $url;
    }
}

$show_setup = !isset($links['soundcloud']) && current_user_can('edit_theme_options');

if (!$links && !$show_setup) {
    return;
}

$primary   = isset($links['soundcloud']) ? 'soundcloud' : null;
$secondary = array_diff_key($links, array('soundcloud' => true));
?>

<aside class="soundcloud-cta" aria-labelledby="soundcloud-cta-title">
    <div class="soundcloud-cta-wave" aria-hidden="true">
        <?php for ($i = 0; $i < 48; $i++) : ?><i></i><?php endfor; ?>
    </div>

    <div class="soundcloud-cta-body">
        <span class="soundcloud-cta-icon" aria-hidden="true"><?php infinity_music_platform_mark($primary ? 'soundcloud' : 'spotify', $primary ? 44 : 34); ?></span>

        <div class="soundcloud-cta-copy">
            <h2 id="soundcloud-cta-title" class="soundcloud-cta-title">
                <?php echo $primary ? esc_html__('Follow the E.T. on SoundCloud', 'infinity') : esc_html__('Follow the E.T.', 'infinity'); ?>
            </h2>
            <p class="soundcloud-cta-text">
                <?php
                echo $primary
                    ? esc_html__('New tracks from the Explore the Universe 2175 sessions land there first, along with works in progress and the older catalogue. Also streaming on Spotify, with videos on YouTube.', 'infinity')
                    : esc_html__('New tracks from the Explore the Universe 2175 sessions, the full catalogue on Spotify, and videos on YouTube.', 'infinity');
                ?>
            </p>
        </div>

        <div class="soundcloud-cta-actions">
            <?php if ($primary) : ?>
                <a class="music-btn music-btn--soundcloud" href="<?php echo esc_url($links['soundcloud']); ?>" target="_blank" rel="noopener noreferrer">
                    <?php infinity_music_platform_mark('soundcloud', 26); ?>
                    <span><?php esc_html_e('Follow', 'infinity'); ?></span>
                </a>
            <?php elseif ($show_setup) : ?>
                <a class="music-btn music-btn--setup" href="<?php echo esc_url(admin_url('customize.php?autofocus[section]=infinity_music_settings')); ?>">
                    <?php esc_html_e('Set your SoundCloud URL', 'infinity'); ?>
                </a>
            <?php endif; ?>

            <?php if ($secondary) : ?>
                <div class="soundcloud-cta-more">
                    <?php foreach ($secondary as $platform => $url) : ?>
                        <a class="music-chip music-chip--<?php echo esc_attr($platform); ?>" href="<?php echo esc_url($url); ?>" target="_blank" rel="noopener noreferrer">
                            <?php infinity_music_platform_mark($platform, 18); ?>
                            <span><?php echo esc_html(infinity_music_platforms()[$platform]['label']); ?></span>
                        </a>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</aside>
