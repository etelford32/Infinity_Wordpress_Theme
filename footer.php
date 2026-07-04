    </main>

    <footer id="colophon" class="site-footer" role="contentinfo">
        <div class="container">
            <?php if (is_active_sidebar('footer-1')) : ?>
                <aside class="footer-widgets">
                    <?php dynamic_sidebar('footer-1'); ?>
                </aside>
            <?php endif; ?>

            <nav class="footer-navigation" role="navigation" aria-label="<?php esc_attr_e('Footer Menu', 'infinity'); ?>">
                <?php
                wp_nav_menu(array(
                    'theme_location' => 'footer',
                    'menu_id'        => 'footer-menu',
                    'menu_class'     => 'footer-menu',
                    'container'      => false,
                    'depth'          => 1,
                    'fallback_cb'    => false,
                ));
                ?>
            </nav>

            <?php $footer_urls = infinity_property_urls(); ?>
            <nav class="footer-sites" aria-label="<?php esc_attr_e('More from Elliot Telford', 'infinity'); ?>">
                <span class="footer-sites-label"><?php esc_html_e('The Telford universe:', 'infinity'); ?></span>
                <a href="<?php echo esc_url($footer_urls['parkers']); ?>" target="_blank" rel="noopener"><?php esc_html_e("Parker's Physics", 'infinity'); ?></a>
                <a href="<?php echo esc_url($footer_urls['etu']); ?>" target="_blank" rel="noopener"><?php esc_html_e('Explore the Universe 2175', 'infinity'); ?></a>
                <a href="<?php echo esc_url($footer_urls['steam']); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('The game on Steam', 'infinity'); ?></a>
                <a href="<?php echo esc_url($footer_urls['landscaping']); ?>" target="_blank" rel="noopener"><?php esc_html_e('Telford Landscaping', 'infinity'); ?></a>
            </nav>

            <div class="site-info">
                <p>
                    &copy; <?php echo esc_html(date('Y')); ?> <?php bloginfo('name'); ?>.
                    <?php esc_html_e('Powered by', 'infinity'); ?>
                    <a href="<?php echo esc_url(__('https://wordpress.org/', 'infinity')); ?>">WordPress</a>
                    <?php esc_html_e('and', 'infinity'); ?>
                    <a href="<?php echo esc_url('https://threejs.org/'); ?>">Three.js</a>
                </p>
            </div>
        </div>
    </footer>

    <!-- Back to Top Button -->
    <button
        type="button"
        id="back-to-top"
        class="back-to-top"
        aria-label="<?php esc_attr_e('Back to top', 'infinity'); ?>"
        title="<?php esc_attr_e('Back to top', 'infinity'); ?>"
    >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </button>
</div>

<?php wp_footer(); ?>
</body>
</html>
