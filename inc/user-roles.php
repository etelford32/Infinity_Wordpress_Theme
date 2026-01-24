<?php
/**
 * User Roles and Capabilities
 *
 * @package Infinity
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Add custom user roles and capabilities
 */
function infinity_add_custom_roles() {
    // Premium Subscriber Role
    add_role(
        'premium_subscriber',
        __('Premium Subscriber', 'infinity'),
        array(
            'read'                   => true,
            'edit_posts'             => false,
            'delete_posts'           => false,
            'publish_posts'          => false,
            'upload_files'           => true,
            'create_blueprints'      => true,
            'edit_blueprints'        => true,
            'delete_blueprints'      => true,
            'publish_blueprints'     => true,
            'access_premium_content' => true,
            'unlimited_simulations'  => true,
            'download_configs'       => true,
            'post_in_forum'          => true,
            'upload_to_gallery'      => true,
        )
    );

    // Free User Capabilities (subscriber role enhancement)
    $subscriber = get_role('subscriber');
    if ($subscriber) {
        $subscriber->add_cap('read_simulations');
        $subscriber->add_cap('comment_on_simulations');
        $subscriber->add_cap('limited_simulation_runs');
    }

    // Add capabilities to administrator
    $admin = get_role('administrator');
    if ($admin) {
        $admin->add_cap('manage_simulations');
        $admin->add_cap('moderate_blueprints');
        $admin->add_cap('manage_challenges');
        $admin->add_cap('view_analytics');
    }
}
add_action('after_switch_theme', 'infinity_add_custom_roles');

/**
 * Check if user is premium subscriber
 */
function infinity_is_premium_user($user_id = null) {
    if (!$user_id) {
        $user_id = get_current_user_id();
    }

    if (!$user_id) {
        return false;
    }

    $user = get_userdata($user_id);

    return $user && (
        in_array('premium_subscriber', $user->roles) ||
        in_array('administrator', $user->roles)
    );
}

/**
 * Check if user can access premium content
 */
function infinity_can_access_premium($user_id = null) {
    if (!$user_id) {
        $user_id = get_current_user_id();
    }

    return user_can($user_id, 'access_premium_content') ||
           user_can($user_id, 'manage_options');
}

/**
 * Get user's daily simulation count
 */
function infinity_get_user_simulation_count($user_id = null) {
    if (!$user_id) {
        $user_id = get_current_user_id();
    }

    if (!$user_id) {
        // For guests, use IP-based tracking
        $user_id = 'guest_' . md5($_SERVER['REMOTE_ADDR']);
    }

    $transient_key = 'infinity_sim_count_' . $user_id;
    $count = get_transient($transient_key);

    return $count ? (int) $count : 0;
}

/**
 * Increment user's simulation count
 */
function infinity_increment_simulation_count($user_id = null) {
    if (!$user_id) {
        $user_id = get_current_user_id();
    }

    if (!$user_id) {
        $user_id = 'guest_' . md5($_SERVER['REMOTE_ADDR']);
    }

    // Premium users have unlimited runs
    if (is_numeric($user_id) && infinity_is_premium_user($user_id)) {
        return true;
    }

    $transient_key = 'infinity_sim_count_' . $user_id;
    $count = infinity_get_user_simulation_count($user_id);
    $new_count = $count + 1;

    // Set transient to expire at midnight
    $seconds_until_midnight = strtotime('tomorrow') - time();
    set_transient($transient_key, $new_count, $seconds_until_midnight);

    return true;
}

/**
 * Check if user can run simulation (not over daily limit)
 */
function infinity_can_run_simulation($user_id = null) {
    if (!$user_id) {
        $user_id = get_current_user_id();
    }

    // Premium users can always run
    if ($user_id && infinity_is_premium_user($user_id)) {
        return true;
    }

    // Free users get 2 runs per day
    $count = infinity_get_user_simulation_count($user_id);
    $daily_limit = apply_filters('infinity_free_simulation_limit', 2);

    return $count < $daily_limit;
}

/**
 * Get remaining simulations for today
 */
function infinity_get_remaining_simulations($user_id = null) {
    if (!$user_id) {
        $user_id = get_current_user_id();
    }

    if ($user_id && infinity_is_premium_user($user_id)) {
        return -1; // Unlimited
    }

    $count = infinity_get_user_simulation_count($user_id);
    $daily_limit = apply_filters('infinity_free_simulation_limit', 2);

    return max(0, $daily_limit - $count);
}
