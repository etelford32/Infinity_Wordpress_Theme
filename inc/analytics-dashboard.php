<?php
/**
 * Analytics Dashboard
 *
 * Comprehensive analytics tracking and reporting for the Infinity theme.
 * Includes simulation sessions, user activity, and admin dashboard.
 *
 * @package Infinity
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Create analytics tables on theme activation
 */
function infinity_create_analytics_tables() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();

    // Simulation sessions table
    $sessions_table = $wpdb->prefix . 'infinity_simulation_sessions';
    $sql_sessions = "CREATE TABLE IF NOT EXISTS $sessions_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL DEFAULT 0,
        simulation_id bigint(20) NOT NULL,
        session_start datetime NOT NULL,
        session_end datetime DEFAULT NULL,
        duration_seconds int(11) DEFAULT 0,
        avg_fps decimal(5,2) DEFAULT NULL,
        min_fps int(11) DEFAULT NULL,
        max_fps int(11) DEFAULT NULL,
        body_count int(11) DEFAULT NULL,
        parameters_used longtext,
        ip_address varchar(45) DEFAULT NULL,
        user_agent varchar(255) DEFAULT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY user_id (user_id),
        KEY simulation_id (simulation_id),
        KEY session_start (session_start),
        KEY created_at (created_at)
    ) $charset_collate;";

    // User activity table (general activity feed)
    $activity_table = $wpdb->prefix . 'infinity_user_activity';
    $sql_activity = "CREATE TABLE IF NOT EXISTS $activity_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        activity_type varchar(50) NOT NULL,
        object_type varchar(50) DEFAULT NULL,
        object_id bigint(20) DEFAULT NULL,
        object_title varchar(255) DEFAULT NULL,
        activity_data longtext,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY user_id (user_id),
        KEY activity_type (activity_type),
        KEY object_type (object_type),
        KEY created_at (created_at)
    ) $charset_collate;";

    // Daily analytics aggregates (for faster dashboard queries)
    $daily_table = $wpdb->prefix . 'infinity_daily_analytics';
    $sql_daily = "CREATE TABLE IF NOT EXISTS $daily_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        date date NOT NULL,
        metric_type varchar(50) NOT NULL,
        metric_value bigint(20) DEFAULT 0,
        metric_data longtext,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY date_metric (date, metric_type),
        KEY date (date),
        KEY metric_type (metric_type)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql_sessions);
    dbDelta($sql_activity);
    dbDelta($sql_daily);
}
add_action('after_switch_theme', 'infinity_create_analytics_tables');

/**
 * Log a simulation session
 */
function infinity_log_simulation_session($data) {
    global $wpdb;
    $table = $wpdb->prefix . 'infinity_simulation_sessions';

    $defaults = array(
        'user_id'          => get_current_user_id(),
        'simulation_id'    => 0,
        'session_start'    => current_time('mysql'),
        'session_end'      => null,
        'duration_seconds' => 0,
        'avg_fps'          => null,
        'min_fps'          => null,
        'max_fps'          => null,
        'body_count'       => null,
        'parameters_used'  => null,
        'ip_address'       => infinity_get_client_ip(),
        'user_agent'       => isset($_SERVER['HTTP_USER_AGENT']) ? substr($_SERVER['HTTP_USER_AGENT'], 0, 255) : null,
    );

    $data = wp_parse_args($data, $defaults);

    if (!empty($data['parameters_used']) && is_array($data['parameters_used'])) {
        $data['parameters_used'] = wp_json_encode($data['parameters_used']);
    }

    $result = $wpdb->insert($table, $data);

    if ($result) {
        return $wpdb->insert_id;
    }

    return false;
}

/**
 * Update a simulation session (when it ends)
 */
function infinity_update_simulation_session($session_id, $data) {
    global $wpdb;
    $table = $wpdb->prefix . 'infinity_simulation_sessions';

    return $wpdb->update(
        $table,
        $data,
        array('id' => $session_id),
        null,
        array('%d')
    );
}

/**
 * Log user activity
 */
function infinity_log_activity($user_id, $activity_type, $object_type = null, $object_id = null, $data = array()) {
    global $wpdb;
    $table = $wpdb->prefix . 'infinity_user_activity';

    $object_title = null;
    if ($object_id && $object_type) {
        $post = get_post($object_id);
        if ($post) {
            $object_title = $post->post_title;
        }
    }

    return $wpdb->insert(
        $table,
        array(
            'user_id'       => $user_id,
            'activity_type' => $activity_type,
            'object_type'   => $object_type,
            'object_id'     => $object_id,
            'object_title'  => $object_title,
            'activity_data' => !empty($data) ? wp_json_encode($data) : null,
            'created_at'    => current_time('mysql'),
        ),
        array('%d', '%s', '%s', '%d', '%s', '%s', '%s')
    );
}

/**
 * Get user activity feed
 */
function infinity_get_user_activity($user_id, $limit = 20, $offset = 0) {
    global $wpdb;
    $table = $wpdb->prefix . 'infinity_user_activity';

    $results = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM $table WHERE user_id = %d ORDER BY created_at DESC LIMIT %d OFFSET %d",
        $user_id,
        $limit,
        $offset
    ));

    // Format activity for display
    $formatted = array();
    foreach ($results as $row) {
        $formatted[] = array(
            'id'           => (int) $row->id,
            'type'         => $row->activity_type,
            'objectType'   => $row->object_type,
            'objectId'     => (int) $row->object_id,
            'objectTitle'  => $row->object_title,
            'data'         => $row->activity_data ? json_decode($row->activity_data, true) : null,
            'createdAt'    => $row->created_at,
            'timeAgo'      => human_time_diff(strtotime($row->created_at), current_time('timestamp')),
            'icon'         => infinity_get_activity_icon($row->activity_type),
            'description'  => infinity_get_activity_description($row),
        );
    }

    return $formatted;
}

/**
 * Get activity icon based on type
 */
function infinity_get_activity_icon($type) {
    $icons = array(
        'simulation_started'   => 'play',
        'simulation_completed' => 'check-circle',
        'blueprint_created'    => 'file-plus',
        'blueprint_forked'     => 'git-branch',
        'blueprint_voted'      => 'thumbs-up',
        'challenge_started'    => 'flag',
        'challenge_completed'  => 'award',
        'subscription_started' => 'credit-card',
        'subscription_canceled'=> 'x-circle',
        'login'                => 'log-in',
    );

    return $icons[$type] ?? 'activity';
}

/**
 * Get activity description
 */
function infinity_get_activity_description($activity) {
    $descriptions = array(
        'simulation_started'   => __('Started simulation: %s', 'infinity'),
        'simulation_completed' => __('Completed simulation: %s', 'infinity'),
        'blueprint_created'    => __('Created blueprint: %s', 'infinity'),
        'blueprint_forked'     => __('Forked blueprint: %s', 'infinity'),
        'blueprint_voted'      => __('Voted on blueprint: %s', 'infinity'),
        'challenge_started'    => __('Started challenge: %s', 'infinity'),
        'challenge_completed'  => __('Completed challenge: %s', 'infinity'),
        'subscription_started' => __('Started premium subscription', 'infinity'),
        'subscription_canceled'=> __('Canceled subscription', 'infinity'),
        'login'                => __('Logged in', 'infinity'),
    );

    $template = $descriptions[$activity->activity_type] ?? __('Activity: %s', 'infinity');

    if ($activity->object_title) {
        return sprintf($template, $activity->object_title);
    }

    return str_replace(': %s', '', $template);
}

/**
 * Get client IP address
 */
function infinity_get_client_ip() {
    $ip_keys = array('HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR');

    foreach ($ip_keys as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = $_SERVER[$key];
            // Handle comma-separated IPs
            if (strpos($ip, ',') !== false) {
                $ip = trim(explode(',', $ip)[0]);
            }
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }

    return '0.0.0.0';
}

/**
 * Update daily analytics aggregate
 */
function infinity_update_daily_metric($metric_type, $increment = 1, $data = null) {
    global $wpdb;
    $table = $wpdb->prefix . 'infinity_daily_analytics';
    $date = current_time('Y-m-d');

    $existing = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table WHERE date = %s AND metric_type = %s",
        $date,
        $metric_type
    ));

    if ($existing) {
        $new_value = $existing->metric_value + $increment;
        $wpdb->update(
            $table,
            array('metric_value' => $new_value),
            array('id' => $existing->id),
            array('%d'),
            array('%d')
        );
    } else {
        $wpdb->insert(
            $table,
            array(
                'date'         => $date,
                'metric_type'  => $metric_type,
                'metric_value' => $increment,
                'metric_data'  => $data ? wp_json_encode($data) : null,
            ),
            array('%s', '%s', '%d', '%s')
        );
    }
}

/**
 * Get analytics dashboard data
 */
function infinity_get_analytics_dashboard($date_range = 30) {
    global $wpdb;

    $start_date = date('Y-m-d', strtotime("-{$date_range} days"));
    $end_date = current_time('Y-m-d');

    // Get simulation stats
    $sessions_table = $wpdb->prefix . 'infinity_simulation_sessions';
    $simulation_stats = $wpdb->get_row($wpdb->prepare(
        "SELECT
            COUNT(*) as total_sessions,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(DISTINCT simulation_id) as simulations_played,
            SUM(duration_seconds) as total_duration,
            AVG(duration_seconds) as avg_duration,
            AVG(avg_fps) as avg_fps
        FROM $sessions_table
        WHERE created_at >= %s",
        $start_date
    ));

    // Get daily session counts for chart
    $daily_sessions = $wpdb->get_results($wpdb->prepare(
        "SELECT DATE(created_at) as date, COUNT(*) as count
        FROM $sessions_table
        WHERE created_at >= %s
        GROUP BY DATE(created_at)
        ORDER BY date ASC",
        $start_date
    ));

    // Get subscription stats
    $subscription_stats = infinity_get_subscription_analytics();

    // Get subscription events for chart
    $events_table = $wpdb->prefix . 'infinity_subscription_events';
    $subscription_events = $wpdb->get_results($wpdb->prepare(
        "SELECT DATE(created_at) as date, event_type, COUNT(*) as count
        FROM $events_table
        WHERE created_at >= %s
        GROUP BY DATE(created_at), event_type
        ORDER BY date ASC",
        $start_date
    ));

    // Get top simulations
    $top_simulations = $wpdb->get_results($wpdb->prepare(
        "SELECT simulation_id, COUNT(*) as play_count,
            AVG(duration_seconds) as avg_duration,
            COUNT(DISTINCT user_id) as unique_users
        FROM $sessions_table
        WHERE created_at >= %s
        GROUP BY simulation_id
        ORDER BY play_count DESC
        LIMIT 10",
        $start_date
    ));

    // Add simulation titles
    foreach ($top_simulations as &$sim) {
        $post = get_post($sim->simulation_id);
        $sim->title = $post ? $post->post_title : __('Unknown', 'infinity');
        $sim->permalink = $post ? get_permalink($post) : '#';
    }

    // Get user stats
    $total_users = count_users();
    $premium_users = $wpdb->get_var(
        "SELECT COUNT(DISTINCT user_id) FROM {$wpdb->usermeta}
        WHERE meta_key = 'infinity_subscription_status' AND meta_value IN ('active', 'trialing')"
    );

    // Get new users in date range
    $new_users = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->users} WHERE user_registered >= %s",
        $start_date
    ));

    // Get activity breakdown
    $activity_table = $wpdb->prefix . 'infinity_user_activity';
    $activity_breakdown = $wpdb->get_results($wpdb->prepare(
        "SELECT activity_type, COUNT(*) as count
        FROM $activity_table
        WHERE created_at >= %s
        GROUP BY activity_type
        ORDER BY count DESC",
        $start_date
    ));

    return array(
        'dateRange'          => array(
            'start' => $start_date,
            'end'   => $end_date,
            'days'  => $date_range,
        ),
        'simulations'        => array(
            'totalSessions'     => (int) ($simulation_stats->total_sessions ?? 0),
            'uniqueUsers'       => (int) ($simulation_stats->unique_users ?? 0),
            'simulationsPlayed' => (int) ($simulation_stats->simulations_played ?? 0),
            'totalDuration'     => (int) ($simulation_stats->total_duration ?? 0),
            'avgDuration'       => round($simulation_stats->avg_duration ?? 0, 1),
            'avgFps'            => round($simulation_stats->avg_fps ?? 0, 1),
        ),
        'dailySessions'      => array_map(function($row) {
            return array('date' => $row->date, 'count' => (int) $row->count);
        }, $daily_sessions),
        'subscriptions'      => $subscription_stats,
        'subscriptionEvents' => $subscription_events,
        'topSimulations'     => $top_simulations,
        'users'              => array(
            'total'      => $total_users['total_users'],
            'premium'    => (int) $premium_users,
            'free'       => $total_users['total_users'] - (int) $premium_users,
            'newInRange' => (int) $new_users,
        ),
        'activityBreakdown'  => $activity_breakdown,
    );
}

/**
 * Get user stats for dashboard
 */
function infinity_get_user_dashboard_stats($user_id) {
    global $wpdb;

    // Get simulation session stats
    $sessions_table = $wpdb->prefix . 'infinity_simulation_sessions';
    $session_stats = $wpdb->get_row($wpdb->prepare(
        "SELECT
            COUNT(*) as total_sessions,
            SUM(duration_seconds) as total_duration,
            COUNT(DISTINCT simulation_id) as unique_simulations,
            MAX(created_at) as last_session
        FROM $sessions_table
        WHERE user_id = %d",
        $user_id
    ));

    // Get blueprints count
    $blueprints_count = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'blueprint' AND post_author = %d AND post_status = 'publish'",
        $user_id
    ));

    // Get completed challenges
    $completed_challenges = get_user_meta($user_id, 'infinity_completed_challenges', true);
    $completed_count = is_array($completed_challenges) ? count($completed_challenges) : 0;

    // Calculate streak (consecutive days with activity)
    $activity_table = $wpdb->prefix . 'infinity_user_activity';
    $streak = infinity_calculate_user_streak($user_id);

    // Get today's simulation count
    $simulations_today = infinity_get_user_simulation_count($user_id);
    $remaining_today = infinity_get_remaining_simulations($user_id);

    // Get subscription status
    $subscription_status = infinity_get_user_subscription_status($user_id);
    $is_premium = infinity_has_active_subscription($user_id);

    return array(
        'totalSimulations'    => (int) ($session_stats->total_sessions ?? 0),
        'totalDuration'       => (int) ($session_stats->total_duration ?? 0),
        'totalDurationFormatted' => infinity_format_duration($session_stats->total_duration ?? 0),
        'uniqueSimulations'   => (int) ($session_stats->unique_simulations ?? 0),
        'lastSession'         => $session_stats->last_session ?? null,
        'blueprintsCreated'   => (int) $blueprints_count,
        'challengesCompleted' => $completed_count,
        'currentStreak'       => $streak,
        'simulationsToday'    => $simulations_today,
        'remainingToday'      => $remaining_today,
        'subscriptionStatus'  => $subscription_status,
        'isPremium'           => $is_premium,
    );
}

/**
 * Calculate user activity streak
 */
function infinity_calculate_user_streak($user_id) {
    global $wpdb;
    $activity_table = $wpdb->prefix . 'infinity_user_activity';

    // Get distinct activity dates for user
    $dates = $wpdb->get_col($wpdb->prepare(
        "SELECT DISTINCT DATE(created_at) as activity_date
        FROM $activity_table
        WHERE user_id = %d
        ORDER BY activity_date DESC
        LIMIT 365",
        $user_id
    ));

    if (empty($dates)) {
        return 0;
    }

    $streak = 0;
    $today = current_time('Y-m-d');
    $yesterday = date('Y-m-d', strtotime('-1 day', strtotime($today)));

    // Check if user was active today or yesterday
    if ($dates[0] !== $today && $dates[0] !== $yesterday) {
        return 0;
    }

    $expected_date = $dates[0];
    foreach ($dates as $date) {
        if ($date === $expected_date) {
            $streak++;
            $expected_date = date('Y-m-d', strtotime('-1 day', strtotime($expected_date)));
        } else {
            break;
        }
    }

    return $streak;
}

/**
 * Format duration in human-readable format
 */
function infinity_format_duration($seconds) {
    if ($seconds < 60) {
        return sprintf(__('%d seconds', 'infinity'), $seconds);
    }

    $hours = floor($seconds / 3600);
    $minutes = floor(($seconds % 3600) / 60);

    if ($hours > 0) {
        return sprintf(__('%dh %dm', 'infinity'), $hours, $minutes);
    }

    return sprintf(__('%d minutes', 'infinity'), $minutes);
}

/**
 * Register analytics REST API routes
 */
function infinity_register_analytics_routes() {
    // User stats endpoint
    register_rest_route('infinity/v1', '/users/stats', array(
        'methods'             => 'GET',
        'callback'            => 'infinity_api_get_user_dashboard_stats',
        'permission_callback' => 'is_user_logged_in',
    ));

    // User activity endpoint
    register_rest_route('infinity/v1', '/users/activity', array(
        'methods'             => 'GET',
        'callback'            => 'infinity_api_get_user_activity',
        'permission_callback' => 'is_user_logged_in',
        'args'                => array(
            'limit'  => array(
                'default'           => 20,
                'sanitize_callback' => 'absint',
            ),
            'offset' => array(
                'default'           => 0,
                'sanitize_callback' => 'absint',
            ),
        ),
    ));

    // Start simulation session
    register_rest_route('infinity/v1', '/simulation/(?P<id>\d+)/session/start', array(
        'methods'             => 'POST',
        'callback'            => 'infinity_api_start_simulation_session',
        'permission_callback' => '__return_true',
        'args'                => array(
            'id' => array(
                'required'          => true,
                'validate_callback' => function($param) {
                    return is_numeric($param);
                },
            ),
        ),
    ));

    // End simulation session
    register_rest_route('infinity/v1', '/simulation/session/(?P<session_id>\d+)/end', array(
        'methods'             => 'POST',
        'callback'            => 'infinity_api_end_simulation_session',
        'permission_callback' => '__return_true',
        'args'                => array(
            'session_id' => array(
                'required'          => true,
                'validate_callback' => function($param) {
                    return is_numeric($param);
                },
            ),
        ),
    ));

    // Admin analytics dashboard
    register_rest_route('infinity/v1', '/admin/analytics', array(
        'methods'             => 'GET',
        'callback'            => 'infinity_api_get_admin_analytics',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        },
        'args'                => array(
            'days' => array(
                'default'           => 30,
                'sanitize_callback' => 'absint',
            ),
        ),
    ));

    // Admin simulation analytics
    register_rest_route('infinity/v1', '/admin/analytics/simulations', array(
        'methods'             => 'GET',
        'callback'            => 'infinity_api_get_simulation_analytics',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        },
    ));
}
add_action('rest_api_init', 'infinity_register_analytics_routes');

/**
 * API: Get user stats
 *
 * Named distinctly from infinity_api_get_user_stats() in
 * api-endpoints.php — both files load on every request, so a shared
 * name is a fatal redeclaration.
 */
function infinity_api_get_user_dashboard_stats(WP_REST_Request $request) {
    $user_id = get_current_user_id();
    $stats = infinity_get_user_dashboard_stats($user_id);

    return new WP_REST_Response($stats, 200);
}

/**
 * API: Get user activity
 */
function infinity_api_get_user_activity(WP_REST_Request $request) {
    $user_id = get_current_user_id();
    $limit = $request->get_param('limit');
    $offset = $request->get_param('offset');

    $activity = infinity_get_user_activity($user_id, $limit, $offset);

    return new WP_REST_Response(array(
        'activity' => $activity,
        'limit'    => $limit,
        'offset'   => $offset,
    ), 200);
}

/**
 * API: Start simulation session
 */
function infinity_api_start_simulation_session(WP_REST_Request $request) {
    $simulation_id = (int) $request->get_param('id');
    $user_id = get_current_user_id();
    $params = $request->get_json_params();

    $session_id = infinity_log_simulation_session(array(
        'user_id'         => $user_id,
        'simulation_id'   => $simulation_id,
        'parameters_used' => $params['parameters'] ?? null,
        'body_count'      => $params['bodyCount'] ?? null,
    ));

    if (!$session_id) {
        return new WP_REST_Response(array(
            'error' => __('Failed to start session', 'infinity'),
        ), 500);
    }

    // Log activity
    if ($user_id) {
        infinity_log_activity($user_id, 'simulation_started', 'simulation', $simulation_id);
    }

    // Update daily metric
    infinity_update_daily_metric('simulation_starts');

    return new WP_REST_Response(array(
        'sessionId' => $session_id,
    ), 200);
}

/**
 * API: End simulation session
 */
function infinity_api_end_simulation_session(WP_REST_Request $request) {
    $session_id = (int) $request->get_param('session_id');
    $params = $request->get_json_params();

    $update_data = array(
        'session_end'      => current_time('mysql'),
        'duration_seconds' => (int) ($params['duration'] ?? 0),
    );

    if (isset($params['avgFps'])) {
        $update_data['avg_fps'] = (float) $params['avgFps'];
    }
    if (isset($params['minFps'])) {
        $update_data['min_fps'] = (int) $params['minFps'];
    }
    if (isset($params['maxFps'])) {
        $update_data['max_fps'] = (int) $params['maxFps'];
    }
    if (isset($params['bodyCount'])) {
        $update_data['body_count'] = (int) $params['bodyCount'];
    }

    $result = infinity_update_simulation_session($session_id, $update_data);

    if ($result === false) {
        return new WP_REST_Response(array(
            'error' => __('Failed to end session', 'infinity'),
        ), 500);
    }

    // Get session to find simulation ID and user ID
    global $wpdb;
    $table = $wpdb->prefix . 'infinity_simulation_sessions';
    $session = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table WHERE id = %d",
        $session_id
    ));

    if ($session) {
        // Update simulation aggregate stats
        infinity_increment_play_count($session->simulation_id);
        if ($update_data['duration_seconds'] > 0) {
            infinity_update_avg_session_duration($session->simulation_id, $update_data['duration_seconds']);
        }

        // Log activity
        if ($session->user_id) {
            infinity_log_activity($session->user_id, 'simulation_completed', 'simulation', $session->simulation_id, array(
                'duration' => $update_data['duration_seconds'],
            ));

            // Increment user simulation count
            infinity_increment_simulation_count($session->user_id);
        }

        // Update daily metric
        infinity_update_daily_metric('simulation_completions');
        infinity_update_daily_metric('simulation_duration', $update_data['duration_seconds']);
    }

    return new WP_REST_Response(array(
        'success' => true,
    ), 200);
}

/**
 * API: Get admin analytics dashboard
 */
function infinity_api_get_admin_analytics(WP_REST_Request $request) {
    $days = $request->get_param('days');
    $data = infinity_get_analytics_dashboard($days);

    return new WP_REST_Response($data, 200);
}

/**
 * API: Get simulation analytics
 */
function infinity_api_get_simulation_analytics(WP_REST_Request $request) {
    global $wpdb;

    $simulations = get_posts(array(
        'post_type'      => 'simulation',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
    ));

    $sessions_table = $wpdb->prefix . 'infinity_simulation_sessions';

    $data = array();
    foreach ($simulations as $sim) {
        $stats = $wpdb->get_row($wpdb->prepare(
            "SELECT
                COUNT(*) as total_sessions,
                COUNT(DISTINCT user_id) as unique_users,
                SUM(duration_seconds) as total_duration,
                AVG(duration_seconds) as avg_duration,
                AVG(avg_fps) as avg_fps
            FROM $sessions_table
            WHERE simulation_id = %d",
            $sim->ID
        ));

        $data[] = array(
            'id'              => $sim->ID,
            'title'           => $sim->post_title,
            'permalink'       => get_permalink($sim),
            'isPremium'       => get_post_meta($sim->ID, 'is_premium', true) ? true : false,
            'totalSessions'   => (int) ($stats->total_sessions ?? 0),
            'uniqueUsers'     => (int) ($stats->unique_users ?? 0),
            'totalDuration'   => (int) ($stats->total_duration ?? 0),
            'avgDuration'     => round($stats->avg_duration ?? 0, 1),
            'avgFps'          => round($stats->avg_fps ?? 0, 1),
        );
    }

    // Sort by total sessions
    usort($data, function($a, $b) {
        return $b['totalSessions'] - $a['totalSessions'];
    });

    return new WP_REST_Response($data, 200);
}

/**
 * Add admin menu page for analytics
 */
function infinity_add_analytics_menu() {
    add_menu_page(
        __('Infinity Analytics', 'infinity'),
        __('Analytics', 'infinity'),
        'manage_options',
        'infinity-analytics',
        'infinity_render_analytics_page',
        'dashicons-chart-area',
        30
    );
}
add_action('admin_menu', 'infinity_add_analytics_menu');

/**
 * Render analytics admin page
 */
function infinity_render_analytics_page() {
    $analytics = infinity_get_analytics_dashboard(30);
    ?>
    <div class="wrap infinity-analytics-dashboard">
        <h1><?php esc_html_e('Infinity Analytics Dashboard', 'infinity'); ?></h1>

        <div class="analytics-date-range">
            <label for="date-range"><?php esc_html_e('Date Range:', 'infinity'); ?></label>
            <select id="date-range" onchange="infinityLoadAnalytics(this.value)">
                <option value="7"><?php esc_html_e('Last 7 days', 'infinity'); ?></option>
                <option value="30" selected><?php esc_html_e('Last 30 days', 'infinity'); ?></option>
                <option value="90"><?php esc_html_e('Last 90 days', 'infinity'); ?></option>
                <option value="365"><?php esc_html_e('Last year', 'infinity'); ?></option>
            </select>
        </div>

        <!-- Overview Cards -->
        <div class="analytics-cards">
            <div class="analytics-card">
                <h3><?php esc_html_e('Total Sessions', 'infinity'); ?></h3>
                <div class="card-value" id="total-sessions"><?php echo esc_html($analytics['simulations']['totalSessions']); ?></div>
                <div class="card-label"><?php esc_html_e('Simulation plays', 'infinity'); ?></div>
            </div>

            <div class="analytics-card">
                <h3><?php esc_html_e('Unique Users', 'infinity'); ?></h3>
                <div class="card-value" id="unique-users"><?php echo esc_html($analytics['simulations']['uniqueUsers']); ?></div>
                <div class="card-label"><?php esc_html_e('Active players', 'infinity'); ?></div>
            </div>

            <div class="analytics-card">
                <h3><?php esc_html_e('Avg. Duration', 'infinity'); ?></h3>
                <div class="card-value" id="avg-duration"><?php echo esc_html(round($analytics['simulations']['avgDuration'] / 60, 1)); ?>m</div>
                <div class="card-label"><?php esc_html_e('Per session', 'infinity'); ?></div>
            </div>

            <div class="analytics-card">
                <h3><?php esc_html_e('Premium Users', 'infinity'); ?></h3>
                <div class="card-value" id="premium-users"><?php echo esc_html($analytics['users']['premium']); ?></div>
                <div class="card-label"><?php esc_html_e('Active subscribers', 'infinity'); ?></div>
            </div>

            <div class="analytics-card">
                <h3><?php esc_html_e('Monthly Revenue', 'infinity'); ?></h3>
                <div class="card-value" id="monthly-revenue">$<?php echo esc_html($analytics['subscriptions']['monthly_revenue']); ?></div>
                <div class="card-label"><?php esc_html_e('MRR', 'infinity'); ?></div>
            </div>

            <div class="analytics-card">
                <h3><?php esc_html_e('New Users', 'infinity'); ?></h3>
                <div class="card-value" id="new-users"><?php echo esc_html($analytics['users']['newInRange']); ?></div>
                <div class="card-label"><?php esc_html_e('In date range', 'infinity'); ?></div>
            </div>
        </div>

        <!-- Sessions Chart -->
        <div class="analytics-section">
            <h2><?php esc_html_e('Daily Sessions', 'infinity'); ?></h2>
            <div class="chart-container">
                <canvas id="sessions-chart" height="300"></canvas>
            </div>
        </div>

        <!-- Top Simulations -->
        <div class="analytics-section">
            <h2><?php esc_html_e('Top Simulations', 'infinity'); ?></h2>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php esc_html_e('Simulation', 'infinity'); ?></th>
                        <th><?php esc_html_e('Sessions', 'infinity'); ?></th>
                        <th><?php esc_html_e('Unique Users', 'infinity'); ?></th>
                        <th><?php esc_html_e('Avg. Duration', 'infinity'); ?></th>
                    </tr>
                </thead>
                <tbody id="top-simulations-table">
                    <?php foreach ($analytics['topSimulations'] as $sim): ?>
                    <tr>
                        <td><a href="<?php echo esc_url($sim->permalink); ?>"><?php echo esc_html($sim->title); ?></a></td>
                        <td><?php echo esc_html($sim->play_count); ?></td>
                        <td><?php echo esc_html($sim->unique_users); ?></td>
                        <td><?php echo esc_html(round($sim->avg_duration / 60, 1)); ?>m</td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <!-- User Stats -->
        <div class="analytics-section analytics-two-col">
            <div class="analytics-col">
                <h2><?php esc_html_e('User Breakdown', 'infinity'); ?></h2>
                <div class="user-stats">
                    <div class="stat-row">
                        <span class="stat-label"><?php esc_html_e('Total Users', 'infinity'); ?></span>
                        <span class="stat-value"><?php echo esc_html($analytics['users']['total']); ?></span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label"><?php esc_html_e('Premium Users', 'infinity'); ?></span>
                        <span class="stat-value"><?php echo esc_html($analytics['users']['premium']); ?></span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label"><?php esc_html_e('Free Users', 'infinity'); ?></span>
                        <span class="stat-value"><?php echo esc_html($analytics['users']['free']); ?></span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label"><?php esc_html_e('Conversion Rate', 'infinity'); ?></span>
                        <span class="stat-value"><?php
                            $rate = $analytics['users']['total'] > 0
                                ? round(($analytics['users']['premium'] / $analytics['users']['total']) * 100, 1)
                                : 0;
                            echo esc_html($rate) . '%';
                        ?></span>
                    </div>
                </div>
            </div>

            <div class="analytics-col">
                <h2><?php esc_html_e('Subscription Health', 'infinity'); ?></h2>
                <div class="user-stats">
                    <div class="stat-row">
                        <span class="stat-label"><?php esc_html_e('Active Subscriptions', 'infinity'); ?></span>
                        <span class="stat-value"><?php echo esc_html($analytics['subscriptions']['active_subscriptions']); ?></span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label"><?php esc_html_e('Total All-Time', 'infinity'); ?></span>
                        <span class="stat-value"><?php echo esc_html($analytics['subscriptions']['total_subscriptions']); ?></span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label"><?php esc_html_e('Monthly Revenue', 'infinity'); ?></span>
                        <span class="stat-value">$<?php echo esc_html($analytics['subscriptions']['monthly_revenue']); ?></span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label"><?php esc_html_e('Churn Rate', 'infinity'); ?></span>
                        <span class="stat-value"><?php echo esc_html(round($analytics['subscriptions']['churn_rate'], 1)); ?>%</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <style>
    .infinity-analytics-dashboard {
        max-width: 1400px;
    }
    .analytics-date-range {
        margin: 20px 0;
    }
    .analytics-date-range select {
        padding: 8px 16px;
        font-size: 14px;
    }
    .analytics-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin: 20px 0;
    }
    .analytics-card {
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
    }
    .analytics-card h3 {
        margin: 0 0 10px;
        font-size: 14px;
        color: #666;
    }
    .card-value {
        font-size: 32px;
        font-weight: 600;
        color: #1e1e1e;
    }
    .card-label {
        font-size: 12px;
        color: #888;
        margin-top: 5px;
    }
    .analytics-section {
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
    }
    .analytics-section h2 {
        margin: 0 0 20px;
        font-size: 18px;
    }
    .chart-container {
        position: relative;
        height: 300px;
    }
    .analytics-two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
    }
    .analytics-col {
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
    }
    .analytics-col h2 {
        margin: 0 0 15px;
        font-size: 16px;
    }
    .user-stats .stat-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #eee;
    }
    .user-stats .stat-row:last-child {
        border-bottom: none;
    }
    .stat-label {
        color: #666;
    }
    .stat-value {
        font-weight: 600;
    }
    @media (max-width: 782px) {
        .analytics-two-col {
            grid-template-columns: 1fr;
        }
    }
    </style>

    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        var ctx = document.getElementById('sessions-chart');
        if (ctx) {
            var dailyData = <?php echo wp_json_encode($analytics['dailySessions']); ?>;
            var labels = dailyData.map(function(d) { return d.date; });
            var values = dailyData.map(function(d) { return d.count; });

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Sessions',
                        data: values,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    });

    function infinityLoadAnalytics(days) {
        fetch('<?php echo esc_url(rest_url('infinity/v1/admin/analytics')); ?>?days=' + days, {
            headers: {
                'X-WP-Nonce': '<?php echo wp_create_nonce('wp_rest'); ?>'
            }
        })
        .then(function(response) { return response.json(); })
        .then(function(data) {
            document.getElementById('total-sessions').textContent = data.simulations.totalSessions;
            document.getElementById('unique-users').textContent = data.simulations.uniqueUsers;
            document.getElementById('avg-duration').textContent = Math.round(data.simulations.avgDuration / 60 * 10) / 10 + 'm';
            document.getElementById('premium-users').textContent = data.users.premium;
            document.getElementById('monthly-revenue').textContent = '$' + data.subscriptions.monthly_revenue;
            document.getElementById('new-users').textContent = data.users.newInRange;
        });
    }
    </script>
    <?php
}

/**
 * Hook into existing tracking to log activity
 */
add_action('infinity_simulation_completed', function($simulation_id, $user_id, $duration) {
    // Already handled in session end
}, 10, 3);

add_action('infinity_subscription_status_changed', function($user_id, $status, $subscription_id) {
    $activity_type = $status === 'active' ? 'subscription_started' : 'subscription_' . $status;
    infinity_log_activity($user_id, $activity_type, null, null, array(
        'subscription_id' => $subscription_id,
        'status'          => $status,
    ));
}, 10, 3);

add_action('wp_login', function($user_login, $user) {
    infinity_log_activity($user->ID, 'login');
}, 10, 2);
