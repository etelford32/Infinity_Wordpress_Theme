<?php
/**
 * "Follow the E.T. on SoundCloud" band, closing every music page
 *
 * Hidden from visitors until a SoundCloud URL is set in
 * Appearance → Customize → Music Pages; admins see a setup prompt.
 *
 * @package Infinity
 */

$soundcloud_url = get_option('infinity_soundcloud_url', '');

if (!$soundcloud_url && !current_user_can('edit_theme_options')) {
    return;
}
?>

<aside class="soundcloud-cta" aria-labelledby="soundcloud-cta-title">
    <div class="soundcloud-cta-wave" aria-hidden="true">
        <?php for ($i = 0; $i < 48; $i++) : ?><i></i><?php endfor; ?>
    </div>

    <div class="soundcloud-cta-body">
        <span class="soundcloud-cta-icon" aria-hidden="true"><?php infinity_soundcloud_mark(44); ?></span>
        <div class="soundcloud-cta-copy">
            <h2 id="soundcloud-cta-title" class="soundcloud-cta-title"><?php esc_html_e('Follow the E.T. on SoundCloud', 'infinity'); ?></h2>
            <p class="soundcloud-cta-text"><?php esc_html_e('New tracks from the Explore the Universe 2175 sessions land there first, along with works in progress and the older catalogue.', 'infinity'); ?></p>
        </div>

        <?php if ($soundcloud_url) : ?>
            <a class="music-btn music-btn--soundcloud" href="<?php echo esc_url($soundcloud_url); ?>" target="_blank" rel="noopener noreferrer">
                <?php infinity_soundcloud_mark(26); ?>
                <span><?php esc_html_e('Follow', 'infinity'); ?></span>
            </a>
        <?php else : ?>
            <a class="music-btn music-btn--setup" href="<?php echo esc_url(admin_url('customize.php?autofocus[section]=infinity_music_settings')); ?>">
                <?php esc_html_e('Set your SoundCloud URL', 'infinity'); ?>
            </a>
        <?php endif; ?>
    </div>
</aside>
