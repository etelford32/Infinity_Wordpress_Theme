<?php
/**
 * Dashboard Widget
 *
 * Adds a custom dashboard widget with theme stats and quick actions.
 *
 * @package Infinity
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Infinity_Dashboard_Widget
 */
class Infinity_Dashboard_Widget {

    /**
     * Constructor
     */
    public function __construct() {
        add_action('wp_dashboard_setup', array($this, 'register_widget'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_styles'));
    }

    /**
     * Register the dashboard widget
     */
    public function register_widget() {
        wp_add_dashboard_widget(
            'infinity_dashboard_widget',
            __('Infinity Theme', 'infinity'),
            array($this, 'render_widget'),
            null,
            null,
            'normal',
            'high'
        );
    }

    /**
     * Enqueue admin styles on dashboard
     */
    public function enqueue_styles($hook) {
        if ('index.php' !== $hook) {
            return;
        }

        wp_enqueue_style(
            'infinity-admin-dashboard',
            INFINITY_URI . '/assets/css/admin.css',
            array(),
            INFINITY_VERSION
        );
    }

    /**
     * Render the widget content
     */
    public function render_widget() {
        // Get stats
        $simulations_count = wp_count_posts('simulation')->publish;
        $blueprints_count = wp_count_posts('blueprint')->publish;
        $challenges_count = wp_count_posts('challenge')->publish;

        // Get total plays (sum of all simulation play counts)
        $total_plays = 0;
        $simulations = get_posts(array(
            'post_type'      => 'simulation',
            'posts_per_page' => -1,
            'fields'         => 'ids',
        ));
        foreach ($simulations as $sim_id) {
            $total_plays += (int) get_post_meta($sim_id, 'play_count', true);
        }

        // Get subscription stats if available
        $premium_users = 0;
        $premium_role = get_role('premium_subscriber');
        if ($premium_role) {
            $user_query = new WP_User_Query(array(
                'role'   => 'premium_subscriber',
                'fields' => 'ID',
            ));
            $premium_users = $user_query->get_total();
        }
        ?>
        <div class="infinity-dashboard-widget">
            <div class="infinity-dashboard-header">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2"/>
                    <circle cx="16" cy="16" r="8" stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="16" cy="16" r="3" fill="currentColor"/>
                </svg>
                <h3><?php esc_html_e('Theme Overview', 'infinity'); ?></h3>
            </div>

            <div class="infinity-stats-grid">
                <div class="infinity-stat">
                    <span class="infinity-stat-value"><?php echo esc_html(number_format_i18n($simulations_count)); ?></span>
                    <span class="infinity-stat-label"><?php esc_html_e('Simulations', 'infinity'); ?></span>
                </div>
                <div class="infinity-stat">
                    <span class="infinity-stat-value"><?php echo esc_html(number_format_i18n($blueprints_count)); ?></span>
                    <span class="infinity-stat-label"><?php esc_html_e('Blueprints', 'infinity'); ?></span>
                </div>
                <div class="infinity-stat">
                    <span class="infinity-stat-value"><?php echo esc_html($this->format_number($total_plays)); ?></span>
                    <span class="infinity-stat-label"><?php esc_html_e('Total Plays', 'infinity'); ?></span>
                </div>
            </div>

            <div class="infinity-quick-links">
                <a href="<?php echo esc_url(admin_url('post-new.php?post_type=simulation')); ?>" class="infinity-quick-link">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="8" cy="8" r="6"/>
                        <line x1="8" y1="5" x2="8" y2="11"/>
                        <line x1="5" y1="8" x2="11" y2="8"/>
                    </svg>
                    <?php esc_html_e('New Simulation', 'infinity'); ?>
                </a>

                <a href="<?php echo esc_url(admin_url('post-new.php?post_type=challenge')); ?>" class="infinity-quick-link">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 2L10 6L14 6.5L11 9.5L12 14L8 12L4 14L5 9.5L2 6.5L6 6L8 2Z"/>
                    </svg>
                    <?php esc_html_e('New Challenge', 'infinity'); ?>
                </a>

                <a href="<?php echo esc_url(admin_url('edit.php?post_type=simulation')); ?>" class="infinity-quick-link">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="3" width="12" height="10" rx="1"/>
                        <line x1="5" y1="6" x2="11" y2="6"/>
                        <line x1="5" y1="9" x2="9" y2="9"/>
                    </svg>
                    <?php esc_html_e('Manage Simulations', 'infinity'); ?>
                </a>

                <a href="<?php echo esc_url(admin_url('customize.php')); ?>" class="infinity-quick-link">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="8" cy="8" r="2"/>
                        <path d="M13.4 10a1.1 1.1 0 0 0 .2 1.2l.04.04a1.33 1.33 0 1 1-1.88 1.88l-.04-.04a1.1 1.1 0 0 0-1.2-.2 1.1 1.1 0 0 0-.67 1V14a1.33 1.33 0 1 1-2.67 0v-.06A1.1 1.1 0 0 0 6.5 13a1.1 1.1 0 0 0-1.2.2l-.04.04a1.33 1.33 0 1 1-1.88-1.88l.04-.04a1.1 1.1 0 0 0 .2-1.2 1.1 1.1 0 0 0-1-0.67H2a1.33 1.33 0 1 1 0-2.67h.06A1.1 1.1 0 0 0 3 6.5a1.1 1.1 0 0 0-.2-1.2l-.04-.04a1.33 1.33 0 1 1 1.88-1.88l.04.04a1.1 1.1 0 0 0 1.2.2h.05a1.1 1.1 0 0 0 .67-1V2a1.33 1.33 0 0 1 2.67 0v.06a1.1 1.1 0 0 0 .67 1 1.1 1.1 0 0 0 1.2-.2l.04-.04a1.33 1.33 0 1 1 1.88 1.88l-.04.04a1.1 1.1 0 0 0-.2 1.2v.05a1.1 1.1 0 0 0 1 .67H14a1.33 1.33 0 0 1 0 2.67h-.06a1.1 1.1 0 0 0-1 .67z"/>
                    </svg>
                    <?php esc_html_e('Customize Theme', 'infinity'); ?>
                </a>

                <a href="<?php echo esc_url(admin_url('themes.php?page=infinity-welcome')); ?>" class="infinity-quick-link">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="8" cy="8" r="6"/>
                        <path d="M8 5v3l2 1"/>
                    </svg>
                    <?php esc_html_e('Theme Dashboard', 'infinity'); ?>
                </a>
            </div>

            <?php $this->render_recent_activity(); ?>
        </div>
        <?php
    }

    /**
     * Render recent activity section
     */
    private function render_recent_activity() {
        $recent_simulations = get_posts(array(
            'post_type'      => 'simulation',
            'posts_per_page' => 3,
            'orderby'        => 'modified',
            'order'          => 'DESC',
        ));

        if (empty($recent_simulations)) {
            return;
        }
        ?>
        <div class="infinity-recent-activity" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <h4 style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                <?php esc_html_e('Recently Updated', 'infinity'); ?>
            </h4>
            <ul style="margin: 0; padding: 0; list-style: none;">
                <?php foreach ($recent_simulations as $sim) : ?>
                    <li style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                        <a href="<?php echo esc_url(get_edit_post_link($sim->ID)); ?>" style="color: #1e293b; text-decoration: none; font-size: 13px;">
                            <?php echo esc_html($sim->post_title); ?>
                        </a>
                        <span style="font-size: 11px; color: #94a3b8;">
                            <?php echo esc_html(human_time_diff(strtotime($sim->post_modified), current_time('timestamp')) . ' ' . __('ago', 'infinity')); ?>
                        </span>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
        <?php
    }

    /**
     * Format large numbers
     */
    private function format_number($number) {
        if ($number >= 1000000) {
            return round($number / 1000000, 1) . 'M';
        } elseif ($number >= 1000) {
            return round($number / 1000, 1) . 'K';
        }
        return number_format_i18n($number);
    }
}

// Initialize
new Infinity_Dashboard_Widget();
