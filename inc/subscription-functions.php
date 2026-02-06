<?php
/**
 * Subscription Management Functions
 *
 * @package Infinity
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Get Stripe publishable key
 *
 * Prefers wp-config.php constants for security. Falls back to options.
 * To use constants, add to wp-config.php:
 *   define('INFINITY_STRIPE_PUBLISHABLE_KEY', 'pk_...');
 */
function infinity_get_stripe_key() {
    if (defined('INFINITY_STRIPE_PUBLISHABLE_KEY') && INFINITY_STRIPE_PUBLISHABLE_KEY) {
        return INFINITY_STRIPE_PUBLISHABLE_KEY;
    }
    return get_option('infinity_stripe_publishable_key', '');
}

/**
 * Get premium subscription price
 */
function infinity_get_premium_price() {
    return (int) get_option('infinity_premium_price', 20);
}

/**
 * Check if subscriptions are enabled
 */
function infinity_subscriptions_enabled() {
    return !empty(infinity_get_stripe_key());
}

/**
 * Get user's subscription status
 */
function infinity_get_user_subscription_status($user_id = null) {
    if (!$user_id) {
        $user_id = get_current_user_id();
    }

    if (!$user_id) {
        return 'none';
    }

    $subscription_id = get_user_meta($user_id, 'infinity_subscription_id', true);
    $subscription_status = get_user_meta($user_id, 'infinity_subscription_status', true);

    if (!$subscription_id || !$subscription_status) {
        return 'none';
    }

    return $subscription_status; // active, canceled, past_due, etc.
}

/**
 * Check if user has active subscription
 */
function infinity_has_active_subscription($user_id = null) {
    $status = infinity_get_user_subscription_status($user_id);
    return in_array($status, array('active', 'trialing'));
}

/**
 * Update user subscription status
 */
function infinity_update_subscription_status($user_id, $subscription_id, $status) {
    update_user_meta($user_id, 'infinity_subscription_id', sanitize_text_field($subscription_id));
    update_user_meta($user_id, 'infinity_subscription_status', sanitize_text_field($status));
    update_user_meta($user_id, 'infinity_subscription_updated', current_time('mysql'));

    // Update user role based on status
    $user = get_userdata($user_id);
    if (!$user) {
        return false;
    }

    if (in_array($status, array('active', 'trialing'))) {
        $user->add_role('premium_subscriber');
    } else {
        $user->remove_role('premium_subscriber');
    }

    // Log subscription change
    do_action('infinity_subscription_status_changed', $user_id, $status, $subscription_id);

    return true;
}

/**
 * Cancel user subscription
 */
function infinity_cancel_subscription($user_id) {
    $subscription_id = get_user_meta($user_id, 'infinity_subscription_id', true);

    if (!$subscription_id) {
        return new WP_Error('no_subscription', __('No active subscription found.', 'infinity'));
    }

    // This would integrate with Stripe API to cancel
    // For now, just update the local status
    infinity_update_subscription_status($user_id, $subscription_id, 'canceled');

    return true;
}

/**
 * Get subscription analytics
 */
function infinity_get_subscription_analytics() {
    global $wpdb;

    $active_count = $wpdb->get_var(
        "SELECT COUNT(DISTINCT user_id)
        FROM {$wpdb->usermeta}
        WHERE meta_key = 'infinity_subscription_status'
        AND meta_value IN ('active', 'trialing')"
    );

    $total_count = $wpdb->get_var(
        "SELECT COUNT(DISTINCT user_id)
        FROM {$wpdb->usermeta}
        WHERE meta_key = 'infinity_subscription_id'"
    );

    $mrr = $active_count * infinity_get_premium_price();

    return array(
        'active_subscriptions' => (int) $active_count,
        'total_subscriptions'  => (int) $total_count,
        'monthly_revenue'      => $mrr,
        'churn_rate'           => $total_count > 0 ? (($total_count - $active_count) / $total_count) * 100 : 0,
    );
}

/**
 * Track subscription events for analytics
 */
function infinity_track_subscription_event($event_type, $user_id, $data = array()) {
    global $wpdb;

    $table_name = $wpdb->prefix . 'infinity_subscription_events';

    $wpdb->insert(
        $table_name,
        array(
            'user_id'    => $user_id,
            'event_type' => $event_type,
            'event_data' => maybe_serialize($data),
            'created_at' => current_time('mysql'),
        ),
        array('%d', '%s', '%s', '%s')
    );
}

/**
 * Create subscription events table on theme activation
 */
function infinity_create_subscription_tables() {
    global $wpdb;

    $table_name = $wpdb->prefix . 'infinity_subscription_events';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        event_type varchar(50) NOT NULL,
        event_data longtext,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY user_id (user_id),
        KEY event_type (event_type),
        KEY created_at (created_at)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}
add_action('after_switch_theme', 'infinity_create_subscription_tables');
