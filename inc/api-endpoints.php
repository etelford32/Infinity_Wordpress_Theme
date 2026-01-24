<?php
/**
 * Custom REST API Endpoints
 *
 * @package Infinity
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register custom REST API routes
 */
function infinity_register_api_routes() {
    // Check simulation access
    register_rest_route('infinity/v1', '/simulation/(?P<id>\d+)/access', array(
        'methods'             => 'GET',
        'callback'            => 'infinity_api_check_simulation_access',
        'permission_callback' => '__return_true',
        'args'                => array(
            'id' => array(
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ),
        ),
    ));

    // Track simulation run
    register_rest_route('infinity/v1', '/simulation/(?P<id>\d+)/track', array(
        'methods'             => 'POST',
        'callback'            => 'infinity_api_track_simulation',
        'permission_callback' => '__return_true',
        'args'                => array(
            'id' => array(
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ),
            'duration' => array(
                'required'          => false,
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ),
        ),
    ));

    // Get user stats
    register_rest_route('infinity/v1', '/user/stats', array(
        'methods'             => 'GET',
        'callback'            => 'infinity_api_get_user_stats',
        'permission_callback' => 'is_user_logged_in',
    ));

    // Vote on blueprint
    register_rest_route('infinity/v1', '/blueprint/(?P<id>\d+)/vote', array(
        'methods'             => 'POST',
        'callback'            => 'infinity_api_vote_blueprint',
        'permission_callback' => 'is_user_logged_in',
        'args'                => array(
            'id' => array(
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ),
            'vote' => array(
                'required'          => true,
                'validate_callback' => function($param) {
                    return in_array($param, array('up', 'down', 'remove'));
                }
            ),
        ),
    ));

    // Fork blueprint
    register_rest_route('infinity/v1', '/blueprint/(?P<id>\d+)/fork', array(
        'methods'             => 'POST',
        'callback'            => 'infinity_api_fork_blueprint',
        'permission_callback' => 'infinity_can_create_blueprints',
        'args'                => array(
            'id' => array(
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ),
        ),
    ));

    // Submit challenge attempt
    register_rest_route('infinity/v1', '/challenge/(?P<id>\d+)/submit', array(
        'methods'             => 'POST',
        'callback'            => 'infinity_api_submit_challenge',
        'permission_callback' => 'is_user_logged_in',
        'args'                => array(
            'id' => array(
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ),
            'result_data' => array(
                'required' => true,
            ),
        ),
    ));

    // Get theme configuration
    register_rest_route('infinity/v1', '/config', array(
        'methods'             => 'GET',
        'callback'            => 'infinity_api_get_config',
        'permission_callback' => '__return_true',
    ));
}
add_action('rest_api_init', 'infinity_register_api_routes');

/**
 * Check if user can access simulation
 */
function infinity_api_check_simulation_access($request) {
    $simulation_id = $request['id'];
    $user_id = get_current_user_id();

    // Check if simulation exists
    $simulation = get_post($simulation_id);
    if (!$simulation || $simulation->post_type !== 'simulation') {
        return new WP_Error('not_found', 'Simulation not found', array('status' => 404));
    }

    // Check if premium
    $is_premium = get_post_meta($simulation_id, 'is_premium', true);

    $can_access = true;
    $reason = '';

    if ($is_premium && !infinity_can_access_premium($user_id)) {
        $can_access = false;
        $reason = 'premium_required';
    }

    // Check daily limit for free users
    if (!infinity_can_run_simulation($user_id)) {
        $can_access = false;
        $reason = 'daily_limit_reached';
    }

    return array(
        'can_access'            => $can_access,
        'reason'                => $reason,
        'is_premium'            => (bool) $is_premium,
        'is_user_premium'       => infinity_is_premium_user($user_id),
        'remaining_simulations' => infinity_get_remaining_simulations($user_id),
    );
}

/**
 * Track simulation run
 */
function infinity_api_track_simulation($request) {
    $simulation_id = $request['id'];
    $duration = isset($request['duration']) ? (int) $request['duration'] : 0;
    $user_id = get_current_user_id();

    // Increment play count
    infinity_increment_play_count($simulation_id);

    // Update average duration if provided
    if ($duration > 0) {
        infinity_update_avg_session_duration($simulation_id, $duration);
    }

    // Increment user's simulation count
    infinity_increment_simulation_count($user_id);

    // Track event
    do_action('infinity_simulation_completed', $simulation_id, $user_id, $duration);

    return array(
        'success'               => true,
        'remaining_simulations' => infinity_get_remaining_simulations($user_id),
    );
}

/**
 * Get user statistics
 */
function infinity_api_get_user_stats($request) {
    $user_id = get_current_user_id();

    global $wpdb;

    // Count user's blueprints
    $blueprint_count = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->posts}
        WHERE post_type = 'blueprint'
        AND post_author = %d
        AND post_status = 'publish'",
        $user_id
    ));

    // Count completed challenges
    $completed_challenges = get_user_meta($user_id, 'infinity_completed_challenges', true) ?: array();

    // Get total votes received
    $total_votes = $wpdb->get_var($wpdb->prepare(
        "SELECT SUM(meta_value)
        FROM {$wpdb->postmeta} pm
        INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
        WHERE pm.meta_key = 'vote_count'
        AND p.post_author = %d
        AND p.post_type = 'blueprint'",
        $user_id
    ));

    return array(
        'user_id'             => $user_id,
        'is_premium'          => infinity_is_premium_user($user_id),
        'subscription_status' => infinity_get_user_subscription_status($user_id),
        'blueprints_created'  => (int) $blueprint_count,
        'challenges_completed' => count($completed_challenges),
        'total_votes'         => (int) $total_votes,
        'simulations_today'   => infinity_get_user_simulation_count($user_id),
        'remaining_today'     => infinity_get_remaining_simulations($user_id),
    );
}

/**
 * Vote on blueprint
 */
function infinity_api_vote_blueprint($request) {
    $blueprint_id = $request['id'];
    $vote = $request['vote'];
    $user_id = get_current_user_id();

    // Check if blueprint exists
    $blueprint = get_post($blueprint_id);
    if (!$blueprint || $blueprint->post_type !== 'blueprint') {
        return new WP_Error('not_found', 'Blueprint not found', array('status' => 404));
    }

    // Get user's previous vote
    $user_votes = get_user_meta($user_id, 'infinity_blueprint_votes', true) ?: array();
    $previous_vote = isset($user_votes[$blueprint_id]) ? $user_votes[$blueprint_id] : null;

    // Update vote count
    $current_count = (int) get_post_meta($blueprint_id, 'vote_count', true);

    if ($vote === 'remove' && $previous_vote === 'up') {
        $current_count--;
        unset($user_votes[$blueprint_id]);
    } elseif ($vote === 'up' && $previous_vote !== 'up') {
        $current_count++;
        $user_votes[$blueprint_id] = 'up';
    }

    update_post_meta($blueprint_id, 'vote_count', max(0, $current_count));
    update_user_meta($user_id, 'infinity_blueprint_votes', $user_votes);

    return array(
        'success'    => true,
        'vote_count' => max(0, $current_count),
        'user_vote'  => isset($user_votes[$blueprint_id]) ? $user_votes[$blueprint_id] : null,
    );
}

/**
 * Fork blueprint
 */
function infinity_api_fork_blueprint($request) {
    $blueprint_id = $request['id'];
    $user_id = get_current_user_id();

    // Get original blueprint
    $original = get_post($blueprint_id);
    if (!$original || $original->post_type !== 'blueprint') {
        return new WP_Error('not_found', 'Blueprint not found', array('status' => 404));
    }

    // Create forked blueprint
    $forked_id = wp_insert_post(array(
        'post_title'   => $original->post_title . ' (Fork)',
        'post_content' => $original->post_content,
        'post_type'    => 'blueprint',
        'post_status'  => 'draft',
        'post_author'  => $user_id,
    ));

    if (is_wp_error($forked_id)) {
        return $forked_id;
    }

    // Copy meta
    $config = get_post_meta($blueprint_id, 'blueprint_config', true);
    $base_sim = get_post_meta($blueprint_id, 'base_simulation_id', true);

    update_post_meta($forked_id, 'blueprint_config', $config);
    update_post_meta($forked_id, 'base_simulation_id', $base_sim);
    update_post_meta($forked_id, 'forked_from', $blueprint_id);
    update_post_meta($forked_id, 'visibility', 'private');

    // Increment fork count on original
    $fork_count = (int) get_post_meta($blueprint_id, 'fork_count', true);
    update_post_meta($blueprint_id, 'fork_count', $fork_count + 1);

    return array(
        'success'    => true,
        'forked_id'  => $forked_id,
        'edit_url'   => admin_url('post.php?post=' . $forked_id . '&action=edit'),
    );
}

/**
 * Submit challenge attempt
 */
function infinity_api_submit_challenge($request) {
    $challenge_id = $request['id'];
    $result_data = $request['result_data'];
    $user_id = get_current_user_id();

    // Get challenge
    $challenge = get_post($challenge_id);
    if (!$challenge || $challenge->post_type !== 'challenge') {
        return new WP_Error('not_found', 'Challenge not found', array('status' => 404));
    }

    // Increment attempt count
    $attempt_count = (int) get_post_meta($challenge_id, 'attempt_count', true);
    update_post_meta($challenge_id, 'attempt_count', $attempt_count + 1);

    // Check success criteria
    $success_criteria = json_decode(get_post_meta($challenge_id, 'success_criteria', true), true);
    $is_successful = infinity_evaluate_challenge_success($success_criteria, $result_data);

    if ($is_successful) {
        // Increment completion count
        $completion_count = (int) get_post_meta($challenge_id, 'completion_count', true);
        update_post_meta($challenge_id, 'completion_count', $completion_count + 1);

        // Mark as completed for user
        $completed = get_user_meta($user_id, 'infinity_completed_challenges', true) ?: array();
        if (!in_array($challenge_id, $completed)) {
            $completed[] = $challenge_id;
            update_user_meta($user_id, 'infinity_completed_challenges', $completed);
        }
    }

    return array(
        'success'     => true,
        'completed'   => $is_successful,
        'result_data' => $result_data,
    );
}

/**
 * Evaluate challenge success
 */
function infinity_evaluate_challenge_success($criteria, $result_data) {
    // Simple evaluation logic - can be expanded
    // Criteria example: {"min_score": 100, "max_time": 300}

    if (!is_array($criteria) || !is_array($result_data)) {
        return false;
    }

    foreach ($criteria as $key => $required_value) {
        if (!isset($result_data[$key])) {
            return false;
        }

        $actual_value = $result_data[$key];

        // Handle different comparison types
        if (strpos($key, 'min_') === 0 && $actual_value < $required_value) {
            return false;
        }
        if (strpos($key, 'max_') === 0 && $actual_value > $required_value) {
            return false;
        }
    }

    return true;
}

/**
 * Get theme configuration
 */
function infinity_api_get_config($request) {
    return array(
        'theme_mode'              => get_option('infinity_theme_mode', 'dark-cosmic'),
        'premium_price'           => infinity_get_premium_price(),
        'free_simulation_limit'   => apply_filters('infinity_free_simulation_limit', 2),
        'subscriptions_enabled'   => infinity_subscriptions_enabled(),
        'site_name'               => get_bloginfo('name'),
        'site_description'        => get_bloginfo('description'),
    );
}

/**
 * Permission callback for blueprint creation
 */
function infinity_can_create_blueprints() {
    $user_id = get_current_user_id();
    return $user_id && (
        infinity_is_premium_user($user_id) ||
        current_user_can('publish_posts')
    );
}
