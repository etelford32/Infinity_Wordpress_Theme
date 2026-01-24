<?php
/**
 * Simulation Custom Fields and Meta
 *
 * @package Infinity
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register simulation meta fields
 */
function infinity_register_simulation_meta() {
    // Simulation Configuration (JSON)
    register_post_meta('simulation', 'simulation_config', array(
        'type'              => 'string',
        'description'       => 'JSON configuration for the simulation',
        'single'            => true,
        'show_in_rest'      => true,
        'sanitize_callback' => 'infinity_sanitize_json',
    ));

    // Physics Engine
    register_post_meta('simulation', 'physics_engine', array(
        'type'         => 'string',
        'description'  => 'Physics engine used (cannon, ammo, gpu)',
        'single'       => true,
        'show_in_rest' => true,
        'default'      => 'cannon',
    ));

    // Minimum FPS Target
    register_post_meta('simulation', 'min_fps', array(
        'type'         => 'integer',
        'description'  => 'Minimum target FPS',
        'single'       => true,
        'show_in_rest' => true,
        'default'      => 30,
    ));

    // Particle Count
    register_post_meta('simulation', 'particle_count', array(
        'type'         => 'integer',
        'description'  => 'Number of particles/objects in simulation',
        'single'       => true,
        'show_in_rest' => true,
        'default'      => 10,
    ));

    // Is Premium Content
    register_post_meta('simulation', 'is_premium', array(
        'type'         => 'boolean',
        'description'  => 'Whether this simulation requires premium access',
        'single'       => true,
        'show_in_rest' => true,
        'default'      => false,
    ));

    // Allow Parameter Control
    register_post_meta('simulation', 'allow_parameter_control', array(
        'type'         => 'boolean',
        'description'  => 'Allow users to modify simulation parameters',
        'single'       => true,
        'show_in_rest' => true,
        'default'      => true,
    ));

    // Tutorial Overlay Enabled
    register_post_meta('simulation', 'tutorial_enabled', array(
        'type'         => 'boolean',
        'description'  => 'Show tutorial overlay for first-time users',
        'single'       => true,
        'show_in_rest' => true,
        'default'      => false,
    ));

    // Play Count
    register_post_meta('simulation', 'play_count', array(
        'type'         => 'integer',
        'description'  => 'Number of times this simulation has been run',
        'single'       => true,
        'show_in_rest' => true,
        'default'      => 0,
    ));

    // Average Session Duration (seconds)
    register_post_meta('simulation', 'avg_session_duration', array(
        'type'         => 'integer',
        'description'  => 'Average time users spend in this simulation',
        'single'       => true,
        'show_in_rest' => true,
        'default'      => 0,
    ));
}
add_action('init', 'infinity_register_simulation_meta');

/**
 * Register blueprint meta fields
 */
function infinity_register_blueprint_meta() {
    // Blueprint Configuration (JSON)
    register_post_meta('blueprint', 'blueprint_config', array(
        'type'              => 'string',
        'description'       => 'JSON configuration for the user-created blueprint',
        'single'            => true,
        'show_in_rest'      => true,
        'sanitize_callback' => 'infinity_sanitize_json',
    ));

    // Based on Simulation ID
    register_post_meta('blueprint', 'base_simulation_id', array(
        'type'         => 'integer',
        'description'  => 'ID of the simulation this blueprint is based on',
        'single'       => true,
        'show_in_rest' => true,
    ));

    // Visibility
    register_post_meta('blueprint', 'visibility', array(
        'type'         => 'string',
        'description'  => 'Visibility setting (public, private, unlisted)',
        'single'       => true,
        'show_in_rest' => true,
        'default'      => 'private',
    ));

    // Vote Count
    register_post_meta('blueprint', 'vote_count', array(
        'type'         => 'integer',
        'description'  => 'Number of upvotes',
        'single'       => true,
        'show_in_rest' => true,
        'default'      => 0,
    ));

    // Fork Count
    register_post_meta('blueprint', 'fork_count', array(
        'type'         => 'integer',
        'description'  => 'Number of times this blueprint has been forked',
        'single'       => true,
        'show_in_rest' => true,
        'default'      => 0,
    ));

    // Forked From
    register_post_meta('blueprint', 'forked_from', array(
        'type'         => 'integer',
        'description'  => 'Blueprint ID this was forked from',
        'single'       => true,
        'show_in_rest' => true,
    ));
}
add_action('init', 'infinity_register_blueprint_meta');

/**
 * Register challenge meta fields
 */
function infinity_register_challenge_meta() {
    // Challenge Configuration
    register_post_meta('challenge', 'challenge_config', array(
        'type'              => 'string',
        'description'       => 'JSON configuration for the challenge',
        'single'            => true,
        'show_in_rest'      => true,
        'sanitize_callback' => 'infinity_sanitize_json',
    ));

    // Success Criteria
    register_post_meta('challenge', 'success_criteria', array(
        'type'              => 'string',
        'description'       => 'JSON defining what counts as successful completion',
        'single'            => true,
        'show_in_rest'      => true,
        'sanitize_callback' => 'infinity_sanitize_json',
    ));

    // Start Date
    register_post_meta('challenge', 'start_date', array(
        'type'         => 'string',
        'description'  => 'Challenge start date',
        'single'       => true,
        'show_in_rest' => true,
    ));

    // End Date
    register_post_meta('challenge', 'end_date', array(
        'type'         => 'string',
        'description'  => 'Challenge end date',
        'single'       => true,
        'show_in_rest' => true,
    ));

    // Completion Count
    register_post_meta('challenge', 'completion_count', array(
        'type'         => 'integer',
        'description'  => 'Number of users who completed this challenge',
        'single'       => true,
        'show_in_rest' => true,
        'default'      => 0,
    ));

    // Attempt Count
    register_post_meta('challenge', 'attempt_count', array(
        'type'         => 'integer',
        'description'  => 'Number of attempts across all users',
        'single'       => true,
        'show_in_rest' => true,
        'default'      => 0,
    ));
}
add_action('init', 'infinity_register_challenge_meta');

/**
 * Sanitize JSON input
 */
function infinity_sanitize_json($value) {
    if (empty($value)) {
        return '';
    }

    // Check if valid JSON
    json_decode($value);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return '';
    }

    return wp_kses_post($value);
}

/**
 * Increment simulation play count
 */
function infinity_increment_play_count($post_id) {
    $current = (int) get_post_meta($post_id, 'play_count', true);
    update_post_meta($post_id, 'play_count', $current + 1);
}

/**
 * Update average session duration
 */
function infinity_update_avg_session_duration($post_id, $duration_seconds) {
    $current_avg = (int) get_post_meta($post_id, 'avg_session_duration', true);
    $play_count = (int) get_post_meta($post_id, 'play_count', true);

    if ($play_count === 0) {
        $new_avg = $duration_seconds;
    } else {
        // Running average calculation
        $new_avg = (($current_avg * $play_count) + $duration_seconds) / ($play_count + 1);
    }

    update_post_meta($post_id, 'avg_session_duration', round($new_avg));
}

/**
 * Add meta boxes for simulations
 */
function infinity_add_simulation_meta_boxes() {
    add_meta_box(
        'infinity_simulation_config',
        __('Simulation Configuration', 'infinity'),
        'infinity_simulation_config_meta_box',
        'simulation',
        'normal',
        'high'
    );

    add_meta_box(
        'infinity_simulation_stats',
        __('Simulation Statistics', 'infinity'),
        'infinity_simulation_stats_meta_box',
        'simulation',
        'side',
        'default'
    );
}
add_action('add_meta_boxes', 'infinity_add_simulation_meta_boxes');

/**
 * Render simulation config meta box
 */
function infinity_simulation_config_meta_box($post) {
    wp_nonce_field('infinity_simulation_config', 'infinity_simulation_config_nonce');

    $config = get_post_meta($post->ID, 'simulation_config', true);
    $physics_engine = get_post_meta($post->ID, 'physics_engine', true) ?: 'cannon';
    $is_premium = get_post_meta($post->ID, 'is_premium', true);
    $allow_params = get_post_meta($post->ID, 'allow_parameter_control', true);

    ?>
    <p>
        <label for="physics_engine"><strong><?php _e('Physics Engine:', 'infinity'); ?></strong></label><br>
        <select name="physics_engine" id="physics_engine" style="width: 100%;">
            <option value="cannon" <?php selected($physics_engine, 'cannon'); ?>>Cannon.js (Balanced)</option>
            <option value="ammo" <?php selected($physics_engine, 'ammo'); ?>>Ammo.js (Realistic)</option>
            <option value="gpu" <?php selected($physics_engine, 'gpu'); ?>>GPU Compute Shaders (Massive Scale)</option>
        </select>
    </p>

    <p>
        <label for="is_premium">
            <input type="checkbox" name="is_premium" id="is_premium" value="1" <?php checked($is_premium, 1); ?>>
            <?php _e('Premium Content (requires subscription)', 'infinity'); ?>
        </label>
    </p>

    <p>
        <label for="allow_parameter_control">
            <input type="checkbox" name="allow_parameter_control" id="allow_parameter_control" value="1" <?php checked($allow_params, 1); ?>>
            <?php _e('Allow users to modify parameters', 'infinity'); ?>
        </label>
    </p>

    <p>
        <label for="simulation_config"><strong><?php _e('Configuration JSON:', 'infinity'); ?></strong></label><br>
        <textarea name="simulation_config" id="simulation_config" rows="10" style="width: 100%; font-family: monospace;"><?php echo esc_textarea($config); ?></textarea>
        <span class="description"><?php _e('Enter simulation configuration as JSON', 'infinity'); ?></span>
    </p>
    <?php
}

/**
 * Render simulation stats meta box
 */
function infinity_simulation_stats_meta_box($post) {
    $play_count = get_post_meta($post->ID, 'play_count', true) ?: 0;
    $avg_duration = get_post_meta($post->ID, 'avg_session_duration', true) ?: 0;
    $avg_minutes = floor($avg_duration / 60);
    $avg_seconds = $avg_duration % 60;

    ?>
    <p>
        <strong><?php _e('Play Count:', 'infinity'); ?></strong><br>
        <?php echo number_format($play_count); ?>
    </p>
    <p>
        <strong><?php _e('Avg. Session:', 'infinity'); ?></strong><br>
        <?php printf(__('%d min %d sec', 'infinity'), $avg_minutes, $avg_seconds); ?>
    </p>
    <?php
}

/**
 * Save simulation meta
 */
function infinity_save_simulation_meta($post_id) {
    // Verify nonce
    if (!isset($_POST['infinity_simulation_config_nonce']) ||
        !wp_verify_nonce($_POST['infinity_simulation_config_nonce'], 'infinity_simulation_config')) {
        return;
    }

    // Check autosave
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    // Check permissions
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    // Save physics engine
    if (isset($_POST['physics_engine'])) {
        update_post_meta($post_id, 'physics_engine', sanitize_text_field($_POST['physics_engine']));
    }

    // Save premium status
    update_post_meta($post_id, 'is_premium', isset($_POST['is_premium']) ? 1 : 0);

    // Save parameter control
    update_post_meta($post_id, 'allow_parameter_control', isset($_POST['allow_parameter_control']) ? 1 : 0);

    // Save config JSON
    if (isset($_POST['simulation_config'])) {
        $config = infinity_sanitize_json($_POST['simulation_config']);
        update_post_meta($post_id, 'simulation_config', $config);
    }
}
add_action('save_post_simulation', 'infinity_save_simulation_meta');
