    </main>

    <footer id="colophon" class="site-footer" role="contentinfo">
        <div class="container">
            <?php if (is_active_sidebar('footer-1')) : ?>
                <aside class="footer-widgets">
                    <?php dynamic_sidebar('footer-1'); ?>
                </aside>
            <?php endif; ?>

            <nav class="footer-navigation" role="navigation">
                <?php
                wp_nav_menu(array(
                    'theme_location' => 'footer',
                    'menu_id'        => 'footer-menu',
                    'depth'          => 1,
                    'fallback_cb'    => false,
                ));
                ?>
            </nav>

            <div class="site-info">
                <p>
                    &copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>.
                    <?php esc_html_e('Powered by', 'infinity'); ?>
                    <a href="<?php echo esc_url(__('https://wordpress.org/', 'infinity')); ?>">WordPress</a>
                    <?php esc_html_e('and', 'infinity'); ?>
                    <a href="<?php echo esc_url('https://threejs.org/'); ?>">Three.js</a>
                </p>
            </div>
        </div>
    </footer>
</div>

<?php wp_footer(); ?>
</body>
</html>
