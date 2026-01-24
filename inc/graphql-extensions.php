<?php
/**
 * WPGraphQL Extensions
 *
 * @package Infinity
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register custom GraphQL fields for simulations
 */
function infinity_register_graphql_fields() {
    // Add canAccess field to simulations
    register_graphql_field('Simulation', 'canAccess', array(
        'type'        => 'Boolean',
        'description' => 'Whether the current user can access this simulation',
        'resolve'     => function($post) {
            $user_id = get_current_user_id();
            $is_premium = get_post_meta($post->ID, 'is_premium', true);

            if (!$is_premium) {
                return true;
            }

            return infinity_can_access_premium($user_id);
        },
    ));

    // Add playCount field
    register_graphql_field('Simulation', 'playCount', array(
        'type'        => 'Integer',
        'description' => 'Number of times this simulation has been played',
        'resolve'     => function($post) {
            return (int) get_post_meta($post->ID, 'play_count', true);
        },
    ));

    // Add avgSessionDuration field
    register_graphql_field('Simulation', 'avgSessionDuration', array(
        'type'        => 'Integer',
        'description' => 'Average session duration in seconds',
        'resolve'     => function($post) {
            return (int) get_post_meta($post->ID, 'avg_session_duration', true);
        },
    ));

    // Add userVote field to blueprints
    register_graphql_field('Blueprint', 'userVote', array(
        'type'        => 'String',
        'description' => 'Current user\'s vote on this blueprint',
        'resolve'     => function($post) {
            $user_id = get_current_user_id();
            if (!$user_id) {
                return null;
            }

            $user_votes = get_user_meta($user_id, 'infinity_blueprint_votes', true) ?: array();
            return isset($user_votes[$post->ID]) ? $user_votes[$post->ID] : null;
        },
    ));

    // Add isCompleted field to challenges
    register_graphql_field('Challenge', 'isCompleted', array(
        'type'        => 'Boolean',
        'description' => 'Whether the current user has completed this challenge',
        'resolve'     => function($post) {
            $user_id = get_current_user_id();
            if (!$user_id) {
                return false;
            }

            $completed = get_user_meta($user_id, 'infinity_completed_challenges', true) ?: array();
            return in_array($post->ID, $completed);
        },
    ));

    // Add viewer stats
    register_graphql_field('RootQuery', 'viewerStats', array(
        'type'        => 'ViewerStats',
        'description' => 'Statistics for the current viewer',
        'resolve'     => function() {
            $user_id = get_current_user_id();

            if (!$user_id) {
                return array(
                    'simulationsToday'   => 0,
                    'remainingToday'     => 2,
                    'isPremium'          => false,
                    'blueprintsCreated'  => 0,
                    'challengesCompleted' => 0,
                );
            }

            global $wpdb;

            $blueprint_count = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->posts}
                WHERE post_type = 'blueprint'
                AND post_author = %d
                AND post_status = 'publish'",
                $user_id
            ));

            $completed_challenges = get_user_meta($user_id, 'infinity_completed_challenges', true) ?: array();

            return array(
                'simulationsToday'    => infinity_get_user_simulation_count($user_id),
                'remainingToday'      => infinity_get_remaining_simulations($user_id),
                'isPremium'           => infinity_is_premium_user($user_id),
                'subscriptionStatus'  => infinity_get_user_subscription_status($user_id),
                'blueprintsCreated'   => (int) $blueprint_count,
                'challengesCompleted' => count($completed_challenges),
            );
        },
    ));
}
add_action('graphql_register_types', 'infinity_register_graphql_fields');

/**
 * Register ViewerStats type
 */
function infinity_register_graphql_types() {
    register_graphql_object_type('ViewerStats', array(
        'description' => 'Statistics for the current viewer',
        'fields'      => array(
            'simulationsToday' => array(
                'type'        => 'Integer',
                'description' => 'Number of simulations run today',
            ),
            'remainingToday' => array(
                'type'        => 'Integer',
                'description' => 'Remaining simulation runs for today (-1 for unlimited)',
            ),
            'isPremium' => array(
                'type'        => 'Boolean',
                'description' => 'Whether the user is a premium subscriber',
            ),
            'subscriptionStatus' => array(
                'type'        => 'String',
                'description' => 'Subscription status (active, canceled, none, etc.)',
            ),
            'blueprintsCreated' => array(
                'type'        => 'Integer',
                'description' => 'Number of blueprints created by user',
            ),
            'challengesCompleted' => array(
                'type'        => 'Integer',
                'description' => 'Number of challenges completed by user',
            ),
        ),
    ));
}
add_action('graphql_register_types', 'infinity_register_graphql_types');

/**
 * Add custom mutation for voting on blueprints
 */
function infinity_register_graphql_mutations() {
    register_graphql_mutation('voteBlueprint', array(
        'inputFields' => array(
            'blueprintId' => array(
                'type'        => array('non_null' => 'ID'),
                'description' => 'The ID of the blueprint to vote on',
            ),
            'vote' => array(
                'type'        => array('non_null' => 'String'),
                'description' => 'Vote type: up, down, or remove',
            ),
        ),
        'outputFields' => array(
            'blueprint' => array(
                'type'        => 'Blueprint',
                'description' => 'The updated blueprint',
                'resolve'     => function($payload) {
                    return get_post($payload['blueprintId']);
                },
            ),
            'voteCount' => array(
                'type'        => 'Integer',
                'description' => 'The new vote count',
                'resolve'     => function($payload) {
                    return $payload['voteCount'];
                },
            ),
        ),
        'mutateAndGetPayload' => function($input) {
            $blueprint_id = absint($input['blueprintId']);
            $vote = sanitize_text_field($input['vote']);
            $user_id = get_current_user_id();

            if (!$user_id) {
                throw new \GraphQL\Error\UserError(__('You must be logged in to vote', 'infinity'));
            }

            $blueprint = get_post($blueprint_id);
            if (!$blueprint || $blueprint->post_type !== 'blueprint') {
                throw new \GraphQL\Error\UserError(__('Blueprint not found', 'infinity'));
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
                'blueprintId' => $blueprint_id,
                'voteCount'   => max(0, $current_count),
            );
        },
    ));
}
add_action('graphql_register_types', 'infinity_register_graphql_mutations');
