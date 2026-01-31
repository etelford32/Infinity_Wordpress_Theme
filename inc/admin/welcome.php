<?php
/**
 * Theme Welcome/Onboarding Page
 *
 * Displays a welcome dashboard when the theme is activated,
 * providing quick start guides and feature overview.
 *
 * @package Infinity
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Infinity_Admin_Welcome
 *
 * Handles the welcome page functionality.
 */
class Infinity_Admin_Welcome {

    /**
     * Theme version
     *
     * @var string
     */
    private $theme_version;

    /**
     * Constructor
     */
    public function __construct() {
        $theme = wp_get_theme();
        $this->theme_version = $theme->get('Version');

        add_action('admin_menu', array($this, 'register_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_styles'));
        add_action('after_switch_theme', array($this, 'redirect_to_welcome'));
        add_action('admin_init', array($this, 'handle_redirect'));
    }

    /**
     * Register admin menu page
     */
    public function register_menu() {
        add_theme_page(
            __('Infinity Theme', 'infinity'),
            __('Infinity Theme', 'infinity'),
            'edit_theme_options',
            'infinity-welcome',
            array($this, 'render_welcome_page')
        );
    }

    /**
     * Enqueue admin styles
     */
    public function enqueue_styles($hook) {
        if ('appearance_page_infinity-welcome' !== $hook) {
            return;
        }

        wp_enqueue_style(
            'infinity-admin-welcome',
            INFINITY_URI . '/assets/css/admin.css',
            array(),
            $this->theme_version
        );
    }

    /**
     * Set redirect flag on theme activation
     */
    public function redirect_to_welcome() {
        set_transient('infinity_activation_redirect', true, 30);
    }

    /**
     * Handle redirect after activation
     */
    public function handle_redirect() {
        if (!get_transient('infinity_activation_redirect')) {
            return;
        }

        delete_transient('infinity_activation_redirect');

        if (is_network_admin() || isset($_GET['activate-multi'])) {
            return;
        }

        wp_safe_redirect(admin_url('themes.php?page=infinity-welcome'));
        exit;
    }

    /**
     * Render the welcome page
     */
    public function render_welcome_page() {
        $current_tab = isset($_GET['tab']) ? sanitize_key($_GET['tab']) : 'welcome';
        ?>
        <div class="wrap infinity-welcome-wrap">
            <div class="infinity-welcome-header">
                <div class="infinity-welcome-header-content">
                    <div class="infinity-logo">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="24" cy="24" r="22" stroke="url(#gradient)" stroke-width="3"/>
                            <circle cx="24" cy="24" r="12" stroke="url(#gradient)" stroke-width="2"/>
                            <circle cx="24" cy="24" r="4" fill="url(#gradient)"/>
                            <defs>
                                <linearGradient id="gradient" x1="0" y1="0" x2="48" y2="48">
                                    <stop offset="0%" stop-color="#6366f1"/>
                                    <stop offset="100%" stop-color="#8b5cf6"/>
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div class="infinity-welcome-title">
                        <h1><?php esc_html_e('Welcome to Infinity', 'infinity'); ?></h1>
                        <p class="infinity-version">
                            <?php printf(esc_html__('Version %s', 'infinity'), esc_html($this->theme_version)); ?>
                        </p>
                    </div>
                </div>
                <p class="infinity-welcome-description">
                    <?php esc_html_e('Create stunning interactive astrophysical simulations with Three.js, React, and WordPress.', 'infinity'); ?>
                </p>
            </div>

            <nav class="infinity-welcome-tabs">
                <a href="<?php echo esc_url(admin_url('themes.php?page=infinity-welcome&tab=welcome')); ?>"
                   class="infinity-tab <?php echo $current_tab === 'welcome' ? 'active' : ''; ?>">
                    <?php esc_html_e('Getting Started', 'infinity'); ?>
                </a>
                <a href="<?php echo esc_url(admin_url('themes.php?page=infinity-welcome&tab=features')); ?>"
                   class="infinity-tab <?php echo $current_tab === 'features' ? 'active' : ''; ?>">
                    <?php esc_html_e('Features', 'infinity'); ?>
                </a>
                <a href="<?php echo esc_url(admin_url('themes.php?page=infinity-welcome&tab=setup')); ?>"
                   class="infinity-tab <?php echo $current_tab === 'setup' ? 'active' : ''; ?>">
                    <?php esc_html_e('Setup Wizard', 'infinity'); ?>
                </a>
                <a href="<?php echo esc_url(admin_url('themes.php?page=infinity-welcome&tab=support')); ?>"
                   class="infinity-tab <?php echo $current_tab === 'support' ? 'active' : ''; ?>">
                    <?php esc_html_e('Support', 'infinity'); ?>
                </a>
            </nav>

            <div class="infinity-welcome-content">
                <?php
                switch ($current_tab) {
                    case 'features':
                        $this->render_features_tab();
                        break;
                    case 'setup':
                        $this->render_setup_tab();
                        break;
                    case 'support':
                        $this->render_support_tab();
                        break;
                    default:
                        $this->render_welcome_tab();
                        break;
                }
                ?>
            </div>
        </div>
        <?php
    }

    /**
     * Render welcome tab content
     */
    private function render_welcome_tab() {
        ?>
        <div class="infinity-quick-actions">
            <h2><?php esc_html_e('Quick Actions', 'infinity'); ?></h2>
            <div class="infinity-action-grid">
                <a href="<?php echo esc_url(admin_url('customize.php')); ?>" class="infinity-action-card">
                    <div class="action-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                    </div>
                    <div class="action-content">
                        <h3><?php esc_html_e('Customize Theme', 'infinity'); ?></h3>
                        <p><?php esc_html_e('Adjust colors, typography, and layout options.', 'infinity'); ?></p>
                    </div>
                </a>

                <a href="<?php echo esc_url(admin_url('post-new.php?post_type=simulation')); ?>" class="infinity-action-card">
                    <div class="action-icon accent">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="16"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                    </div>
                    <div class="action-content">
                        <h3><?php esc_html_e('Create Simulation', 'infinity'); ?></h3>
                        <p><?php esc_html_e('Build your first interactive 3D simulation.', 'infinity'); ?></p>
                    </div>
                </a>

                <a href="<?php echo esc_url(admin_url('nav-menus.php')); ?>" class="infinity-action-card">
                    <div class="action-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="12" x2="21" y2="12"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                    </div>
                    <div class="action-content">
                        <h3><?php esc_html_e('Setup Menus', 'infinity'); ?></h3>
                        <p><?php esc_html_e('Configure navigation menus for your site.', 'infinity'); ?></p>
                    </div>
                </a>

                <a href="<?php echo esc_url(admin_url('widgets.php')); ?>" class="infinity-action-card">
                    <div class="action-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                        </svg>
                    </div>
                    <div class="action-content">
                        <h3><?php esc_html_e('Manage Widgets', 'infinity'); ?></h3>
                        <p><?php esc_html_e('Add widgets to sidebar and footer areas.', 'infinity'); ?></p>
                    </div>
                </a>
            </div>
        </div>

        <div class="infinity-checklist">
            <h2><?php esc_html_e('Setup Checklist', 'infinity'); ?></h2>
            <div class="infinity-checklist-items">
                <?php
                $checklist = array(
                    array(
                        'id'       => 'logo',
                        'label'    => __('Upload your logo', 'infinity'),
                        'done'     => has_custom_logo(),
                        'action'   => admin_url('customize.php?autofocus[control]=custom_logo'),
                    ),
                    array(
                        'id'       => 'menu',
                        'label'    => __('Create a navigation menu', 'infinity'),
                        'done'     => has_nav_menu('primary'),
                        'action'   => admin_url('nav-menus.php'),
                    ),
                    array(
                        'id'       => 'simulation',
                        'label'    => __('Create your first simulation', 'infinity'),
                        'done'     => wp_count_posts('simulation')->publish > 0,
                        'action'   => admin_url('post-new.php?post_type=simulation'),
                    ),
                    array(
                        'id'       => 'theme',
                        'label'    => __('Choose your theme variant', 'infinity'),
                        'done'     => get_theme_mod('infinity_theme_mode', 'dark-cosmic') !== 'dark-cosmic' || get_option('infinity_theme_configured'),
                        'action'   => admin_url('customize.php?autofocus[section]=infinity_theme_mode'),
                    ),
                    array(
                        'id'       => 'homepage',
                        'label'    => __('Set up your homepage', 'infinity'),
                        'done'     => get_option('show_on_front') === 'page' && get_option('page_on_front'),
                        'action'   => admin_url('options-reading.php'),
                    ),
                );

                foreach ($checklist as $item) :
                    $status_class = $item['done'] ? 'complete' : 'pending';
                ?>
                    <div class="checklist-item <?php echo esc_attr($status_class); ?>">
                        <span class="checklist-status">
                            <?php if ($item['done']) : ?>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <circle cx="10" cy="10" r="10" fill="#10b981"/>
                                    <path d="M6 10L9 13L14 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            <?php else : ?>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <circle cx="10" cy="10" r="9" stroke="#64748b" stroke-width="2"/>
                                </svg>
                            <?php endif; ?>
                        </span>
                        <span class="checklist-label"><?php echo esc_html($item['label']); ?></span>
                        <?php if (!$item['done']) : ?>
                            <a href="<?php echo esc_url($item['action']); ?>" class="checklist-action">
                                <?php esc_html_e('Do this', 'infinity'); ?>
                            </a>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <div class="infinity-resources">
            <h2><?php esc_html_e('Resources', 'infinity'); ?></h2>
            <div class="infinity-resource-grid">
                <div class="infinity-resource-card">
                    <h3><?php esc_html_e('Documentation', 'infinity'); ?></h3>
                    <p><?php esc_html_e('Learn how to set up and customize your theme with our comprehensive documentation.', 'infinity'); ?></p>
                    <a href="https://github.com/etelford32/Infinity_Wordpress_Theme/wiki" target="_blank" rel="noopener">
                        <?php esc_html_e('Read Docs', 'infinity'); ?> &rarr;
                    </a>
                </div>
                <div class="infinity-resource-card">
                    <h3><?php esc_html_e('Video Tutorials', 'infinity'); ?></h3>
                    <p><?php esc_html_e('Watch step-by-step video guides to get the most out of Infinity.', 'infinity'); ?></p>
                    <a href="#" target="_blank" rel="noopener">
                        <?php esc_html_e('Watch Videos', 'infinity'); ?> &rarr;
                    </a>
                </div>
                <div class="infinity-resource-card">
                    <h3><?php esc_html_e('Community', 'infinity'); ?></h3>
                    <p><?php esc_html_e('Join our community to share simulations and get help from other users.', 'infinity'); ?></p>
                    <a href="https://github.com/etelford32/Infinity_Wordpress_Theme/discussions" target="_blank" rel="noopener">
                        <?php esc_html_e('Join Community', 'infinity'); ?> &rarr;
                    </a>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * Render features tab content
     */
    private function render_features_tab() {
        $features = array(
            array(
                'icon'        => '<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="16" r="4" fill="currentColor"/></svg>',
                'title'       => __('3D Simulations', 'infinity'),
                'description' => __('Create stunning interactive astrophysical simulations using Three.js and React with multiple physics engine support.', 'infinity'),
            ),
            array(
                'icon'        => '<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="4" y="4" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/><rect x="18" y="4" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/><rect x="4" y="18" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/><rect x="18" y="18" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/></svg>',
                'title'       => __('Block Patterns', 'infinity'),
                'description' => __('Pre-designed layouts for simulation showcases, hero sections, feature grids, and more.', 'infinity'),
            ),
            array(
                'icon'        => '<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 4L4 10V22L16 28L28 22V10L16 4Z" stroke="currentColor" stroke-width="2"/><path d="M4 10L16 16M16 16L28 10M16 16V28" stroke="currentColor" stroke-width="2"/></svg>',
                'title'       => __('User Blueprints', 'infinity'),
                'description' => __('Let users create and share their own simulation configurations with voting and forking.', 'infinity'),
            ),
            array(
                'icon'        => '<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M8 28V18M16 28V12M24 28V4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
                'title'       => __('Gamification', 'infinity'),
                'description' => __('Engage users with challenges, achievements, and leaderboards.', 'infinity'),
            ),
            array(
                'icon'        => '<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="10" r="6" stroke="currentColor" stroke-width="2"/><path d="M6 28C6 22.477 10.477 18 16 18C21.523 18 26 22.477 26 28" stroke="currentColor" stroke-width="2"/></svg>',
                'title'       => __('Subscriptions', 'infinity'),
                'description' => __('Built-in subscription management with Stripe and WooCommerce integration.', 'infinity'),
            ),
            array(
                'icon'        => '<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="4" y="8" width="24" height="16" rx="2" stroke="currentColor" stroke-width="2"/><path d="M10 14H22M10 18H18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
                'title'       => __('REST & GraphQL APIs', 'infinity'),
                'description' => __('Comprehensive APIs for headless setups and custom integrations.', 'infinity'),
            ),
        );
        ?>
        <div class="infinity-features-grid">
            <?php foreach ($features as $feature) : ?>
                <div class="infinity-feature-card">
                    <div class="feature-icon"><?php echo $feature['icon']; ?></div>
                    <h3><?php echo esc_html($feature['title']); ?></h3>
                    <p><?php echo esc_html($feature['description']); ?></p>
                </div>
            <?php endforeach; ?>
        </div>

        <div class="infinity-theme-variants">
            <h2><?php esc_html_e('Theme Variants', 'infinity'); ?></h2>
            <p><?php esc_html_e('Choose from four professionally designed color schemes:', 'infinity'); ?></p>
            <div class="infinity-variants-grid">
                <div class="variant-card dark-cosmic">
                    <div class="variant-preview"></div>
                    <span class="variant-name"><?php esc_html_e('Dark Cosmic', 'infinity'); ?></span>
                </div>
                <div class="variant-card light-playful">
                    <div class="variant-preview"></div>
                    <span class="variant-name"><?php esc_html_e('Light Playful', 'infinity'); ?></span>
                </div>
                <div class="variant-card science-light">
                    <div class="variant-preview"></div>
                    <span class="variant-name"><?php esc_html_e('Science Light', 'infinity'); ?></span>
                </div>
                <div class="variant-card science-dark">
                    <div class="variant-preview"></div>
                    <span class="variant-name"><?php esc_html_e('Science Dark', 'infinity'); ?></span>
                </div>
            </div>
            <a href="<?php echo esc_url(admin_url('customize.php?autofocus[section]=infinity_theme_mode')); ?>" class="infinity-btn infinity-btn-primary">
                <?php esc_html_e('Change Theme Variant', 'infinity'); ?>
            </a>
        </div>
        <?php
    }

    /**
     * Render setup wizard tab content
     */
    private function render_setup_tab() {
        ?>
        <div class="infinity-setup-wizard">
            <div class="wizard-intro">
                <h2><?php esc_html_e('Setup Wizard', 'infinity'); ?></h2>
                <p><?php esc_html_e('Get your site up and running in minutes with our guided setup process.', 'infinity'); ?></p>
            </div>

            <div class="wizard-steps">
                <?php
                $steps = array(
                    array(
                        'number'      => 1,
                        'title'       => __('Site Identity', 'infinity'),
                        'description' => __('Set your site title, tagline, and upload your logo.', 'infinity'),
                        'action'      => admin_url('customize.php?autofocus[section]=title_tagline'),
                        'button'      => __('Configure', 'infinity'),
                    ),
                    array(
                        'number'      => 2,
                        'title'       => __('Theme Appearance', 'infinity'),
                        'description' => __('Choose your color scheme and customize the look.', 'infinity'),
                        'action'      => admin_url('customize.php?autofocus[section]=infinity_theme_mode'),
                        'button'      => __('Customize', 'infinity'),
                    ),
                    array(
                        'number'      => 3,
                        'title'       => __('Navigation Setup', 'infinity'),
                        'description' => __('Create menus and configure navigation options.', 'infinity'),
                        'action'      => admin_url('customize.php?autofocus[section]=infinity_navigation'),
                        'button'      => __('Setup', 'infinity'),
                    ),
                    array(
                        'number'      => 4,
                        'title'       => __('Create Content', 'infinity'),
                        'description' => __('Add your first simulation and start building.', 'infinity'),
                        'action'      => admin_url('post-new.php?post_type=simulation'),
                        'button'      => __('Create', 'infinity'),
                    ),
                    array(
                        'number'      => 5,
                        'title'       => __('Homepage Setup', 'infinity'),
                        'description' => __('Configure your homepage and reading settings.', 'infinity'),
                        'action'      => admin_url('options-reading.php'),
                        'button'      => __('Configure', 'infinity'),
                    ),
                );

                foreach ($steps as $step) :
                ?>
                    <div class="wizard-step">
                        <div class="step-number"><?php echo esc_html($step['number']); ?></div>
                        <div class="step-content">
                            <h3><?php echo esc_html($step['title']); ?></h3>
                            <p><?php echo esc_html($step['description']); ?></p>
                        </div>
                        <a href="<?php echo esc_url($step['action']); ?>" class="infinity-btn infinity-btn-secondary">
                            <?php echo esc_html($step['button']); ?>
                        </a>
                    </div>
                <?php endforeach; ?>
            </div>

            <div class="wizard-plugins">
                <h3><?php esc_html_e('Recommended Plugins', 'infinity'); ?></h3>
                <p><?php esc_html_e('These plugins enhance your Infinity experience:', 'infinity'); ?></p>

                <div class="plugins-grid">
                    <?php
                    $plugins = array(
                        array(
                            'name'        => 'WooCommerce',
                            'description' => __('For subscription and payment management.', 'infinity'),
                            'slug'        => 'woocommerce',
                            'installed'   => class_exists('WooCommerce'),
                        ),
                        array(
                            'name'        => 'WPGraphQL',
                            'description' => __('For headless WordPress with GraphQL API.', 'infinity'),
                            'slug'        => 'wp-graphql',
                            'installed'   => function_exists('graphql'),
                        ),
                        array(
                            'name'        => 'Advanced Custom Fields',
                            'description' => __('For extended simulation metadata fields.', 'infinity'),
                            'slug'        => 'advanced-custom-fields',
                            'installed'   => class_exists('ACF'),
                        ),
                    );

                    foreach ($plugins as $plugin) :
                        $status_class = $plugin['installed'] ? 'installed' : 'not-installed';
                    ?>
                        <div class="plugin-card <?php echo esc_attr($status_class); ?>">
                            <div class="plugin-info">
                                <strong><?php echo esc_html($plugin['name']); ?></strong>
                                <p><?php echo esc_html($plugin['description']); ?></p>
                            </div>
                            <div class="plugin-status">
                                <?php if ($plugin['installed']) : ?>
                                    <span class="status-badge active"><?php esc_html_e('Active', 'infinity'); ?></span>
                                <?php else : ?>
                                    <a href="<?php echo esc_url(admin_url('plugin-install.php?s=' . $plugin['slug'] . '&tab=search&type=term')); ?>" class="infinity-btn infinity-btn-small">
                                        <?php esc_html_e('Install', 'infinity'); ?>
                                    </a>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * Render support tab content
     */
    private function render_support_tab() {
        ?>
        <div class="infinity-support">
            <div class="support-grid">
                <div class="support-card">
                    <div class="support-icon">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <path d="M24 4V44M4 24H44" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <h3><?php esc_html_e('GitHub Issues', 'infinity'); ?></h3>
                    <p><?php esc_html_e('Report bugs and request features on our GitHub repository.', 'infinity'); ?></p>
                    <a href="https://github.com/etelford32/Infinity_Wordpress_Theme/issues" target="_blank" rel="noopener" class="infinity-btn infinity-btn-secondary">
                        <?php esc_html_e('Open Issue', 'infinity'); ?>
                    </a>
                </div>

                <div class="support-card">
                    <div class="support-icon">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <path d="M8 12H40V36H8V12Z" stroke="currentColor" stroke-width="2"/>
                            <path d="M8 12L24 26L40 12" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <h3><?php esc_html_e('Email Support', 'infinity'); ?></h3>
                    <p><?php esc_html_e('Contact us directly for premium support inquiries.', 'infinity'); ?></p>
                    <a href="mailto:support@infinity-theme.com" class="infinity-btn infinity-btn-secondary">
                        <?php esc_html_e('Send Email', 'infinity'); ?>
                    </a>
                </div>

                <div class="support-card">
                    <div class="support-icon">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <path d="M4 40L8 24L24 4L40 8L44 24L40 40H4Z" stroke="currentColor" stroke-width="2"/>
                            <circle cx="24" cy="24" r="8" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <h3><?php esc_html_e('Documentation', 'infinity'); ?></h3>
                    <p><?php esc_html_e('Browse our comprehensive docs and tutorials.', 'infinity'); ?></p>
                    <a href="https://github.com/etelford32/Infinity_Wordpress_Theme/wiki" target="_blank" rel="noopener" class="infinity-btn infinity-btn-secondary">
                        <?php esc_html_e('View Docs', 'infinity'); ?>
                    </a>
                </div>
            </div>

            <div class="system-info">
                <h3><?php esc_html_e('System Information', 'infinity'); ?></h3>
                <table class="system-info-table">
                    <tr>
                        <th><?php esc_html_e('Theme Version', 'infinity'); ?></th>
                        <td><?php echo esc_html($this->theme_version); ?></td>
                    </tr>
                    <tr>
                        <th><?php esc_html_e('WordPress Version', 'infinity'); ?></th>
                        <td><?php echo esc_html(get_bloginfo('version')); ?></td>
                    </tr>
                    <tr>
                        <th><?php esc_html_e('PHP Version', 'infinity'); ?></th>
                        <td>
                            <?php echo esc_html(PHP_VERSION); ?>
                            <?php if (version_compare(PHP_VERSION, '8.0', '<')) : ?>
                                <span class="warning"><?php esc_html_e('(Upgrade recommended)', 'infinity'); ?></span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <th><?php esc_html_e('Memory Limit', 'infinity'); ?></th>
                        <td><?php echo esc_html(WP_MEMORY_LIMIT); ?></td>
                    </tr>
                    <tr>
                        <th><?php esc_html_e('WooCommerce', 'infinity'); ?></th>
                        <td><?php echo class_exists('WooCommerce') ? '<span class="success">' . esc_html__('Active', 'infinity') . '</span>' : '<span class="inactive">' . esc_html__('Not Active', 'infinity') . '</span>'; ?></td>
                    </tr>
                    <tr>
                        <th><?php esc_html_e('WPGraphQL', 'infinity'); ?></th>
                        <td><?php echo function_exists('graphql') ? '<span class="success">' . esc_html__('Active', 'infinity') . '</span>' : '<span class="inactive">' . esc_html__('Not Active', 'infinity') . '</span>'; ?></td>
                    </tr>
                </table>
            </div>
        </div>
        <?php
    }
}

// Initialize
new Infinity_Admin_Welcome();
