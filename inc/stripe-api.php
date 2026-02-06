<?php
/**
 * Stripe API Integration
 *
 * Handles Stripe webhooks, checkout sessions, and subscription management.
 *
 * @package Infinity
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Get Stripe secret key
 *
 * Prefers wp-config.php constants for security. Falls back to options.
 * To use constants, add to wp-config.php:
 *   define('INFINITY_STRIPE_SECRET_KEY', 'sk_...');
 */
function infinity_get_stripe_secret_key() {
    if (defined('INFINITY_STRIPE_SECRET_KEY') && INFINITY_STRIPE_SECRET_KEY) {
        return INFINITY_STRIPE_SECRET_KEY;
    }
    return get_option('infinity_stripe_secret_key', '');
}

/**
 * Get Stripe webhook secret
 *
 * Prefers wp-config.php constants for security. Falls back to options.
 * To use constants, add to wp-config.php:
 *   define('INFINITY_STRIPE_WEBHOOK_SECRET', 'whsec_...');
 */
function infinity_get_stripe_webhook_secret() {
    if (defined('INFINITY_STRIPE_WEBHOOK_SECRET') && INFINITY_STRIPE_WEBHOOK_SECRET) {
        return INFINITY_STRIPE_WEBHOOK_SECRET;
    }
    return get_option('infinity_stripe_webhook_secret', '');
}

/**
 * Get Stripe price ID for a billing period
 */
function infinity_get_stripe_price_id($period = 'monthly') {
    if ($period === 'yearly') {
        return get_option('infinity_stripe_price_yearly', '');
    }
    return get_option('infinity_stripe_price_monthly', '');
}

/**
 * Check if Stripe is fully configured
 */
function infinity_stripe_configured() {
    $publishable = infinity_get_stripe_key();
    $secret = infinity_get_stripe_secret_key();
    return !empty($publishable) && !empty($secret);
}

/**
 * Get or create Stripe customer ID for a user
 */
function infinity_get_stripe_customer_id($user_id) {
    return get_user_meta($user_id, 'infinity_stripe_customer_id', true);
}

/**
 * Save Stripe customer ID for a user
 */
function infinity_save_stripe_customer_id($user_id, $customer_id) {
    update_user_meta($user_id, 'infinity_stripe_customer_id', sanitize_text_field($customer_id));
}

/**
 * Make a Stripe API request
 *
 * @param string $endpoint API endpoint (e.g., 'customers', 'checkout/sessions')
 * @param array $data Request data
 * @param string $method HTTP method
 * @return array|WP_Error Response data or error
 */
function infinity_stripe_request($endpoint, $data = array(), $method = 'POST') {
    $secret_key = infinity_get_stripe_secret_key();

    if (empty($secret_key)) {
        return new WP_Error('stripe_not_configured', __('Stripe is not configured.', 'infinity'));
    }

    $url = 'https://api.stripe.com/v1/' . $endpoint;

    $args = array(
        'method'  => $method,
        'headers' => array(
            'Authorization' => 'Bearer ' . $secret_key,
            'Content-Type'  => 'application/x-www-form-urlencoded',
        ),
        'timeout' => 30,
    );

    if (!empty($data) && in_array($method, array('POST', 'PUT', 'PATCH'))) {
        $args['body'] = http_build_query($data);
    }

    $response = wp_remote_request($url, $args);

    if (is_wp_error($response)) {
        return $response;
    }

    $body = wp_remote_retrieve_body($response);
    $decoded = json_decode($body, true);

    if (isset($decoded['error'])) {
        return new WP_Error(
            'stripe_error',
            $decoded['error']['message'] ?? __('Stripe API error', 'infinity'),
            $decoded['error']
        );
    }

    return $decoded;
}

/**
 * Create or retrieve Stripe customer for WordPress user
 */
function infinity_create_stripe_customer($user_id) {
    $existing_customer_id = infinity_get_stripe_customer_id($user_id);

    if ($existing_customer_id) {
        // Verify customer still exists in Stripe
        $customer = infinity_stripe_request('customers/' . $existing_customer_id, array(), 'GET');
        if (!is_wp_error($customer) && !isset($customer['deleted'])) {
            return $existing_customer_id;
        }
    }

    $user = get_userdata($user_id);
    if (!$user) {
        return new WP_Error('invalid_user', __('User not found.', 'infinity'));
    }

    $customer = infinity_stripe_request('customers', array(
        'email'    => $user->user_email,
        'name'     => $user->display_name,
        'metadata' => array(
            'wordpress_user_id' => $user_id,
            'wordpress_username' => $user->user_login,
        ),
    ));

    if (is_wp_error($customer)) {
        return $customer;
    }

    infinity_save_stripe_customer_id($user_id, $customer['id']);

    return $customer['id'];
}

/**
 * Register REST API routes for Stripe
 */
function infinity_register_stripe_routes() {
    // Webhook endpoint (public, no auth required)
    register_rest_route('infinity/v1', '/stripe/webhook', array(
        'methods'             => 'POST',
        'callback'            => 'infinity_handle_stripe_webhook',
        'permission_callback' => '__return_true',
    ));

    // Checkout session endpoint
    register_rest_route('infinity/v1', '/subscriptions/checkout', array(
        'methods'             => 'POST',
        'callback'            => 'infinity_create_checkout_session',
        'permission_callback' => 'is_user_logged_in',
        'args'                => array(
            'priceId' => array(
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    ));

    // Cancel subscription endpoint
    register_rest_route('infinity/v1', '/subscriptions/cancel', array(
        'methods'             => 'POST',
        'callback'            => 'infinity_cancel_subscription_endpoint',
        'permission_callback' => 'is_user_logged_in',
    ));

    // Reactivate subscription endpoint
    register_rest_route('infinity/v1', '/subscriptions/reactivate', array(
        'methods'             => 'POST',
        'callback'            => 'infinity_reactivate_subscription_endpoint',
        'permission_callback' => 'is_user_logged_in',
    ));

    // Update payment method endpoint
    register_rest_route('infinity/v1', '/subscriptions/update-payment-method', array(
        'methods'             => 'POST',
        'callback'            => 'infinity_update_payment_method_endpoint',
        'permission_callback' => 'is_user_logged_in',
    ));

    // Get subscription details endpoint
    register_rest_route('infinity/v1', '/subscriptions/current', array(
        'methods'             => 'GET',
        'callback'            => 'infinity_get_subscription_details',
        'permission_callback' => 'is_user_logged_in',
    ));
}
add_action('rest_api_init', 'infinity_register_stripe_routes');

/**
 * Handle Stripe webhook events
 */
function infinity_handle_stripe_webhook(WP_REST_Request $request) {
    $payload = $request->get_body();
    $sig_header = $request->get_header('stripe-signature');
    $webhook_secret = infinity_get_stripe_webhook_secret();

    // Verify webhook signature if secret is configured
    if (!empty($webhook_secret) && !empty($sig_header)) {
        $verified = infinity_verify_webhook_signature($payload, $sig_header, $webhook_secret);
        if (!$verified) {
            return new WP_REST_Response(array(
                'error' => 'Invalid signature',
            ), 400);
        }
    }

    $event = json_decode($payload, true);

    if (!$event || !isset($event['type'])) {
        return new WP_REST_Response(array(
            'error' => 'Invalid payload',
        ), 400);
    }

    // Log the webhook event
    infinity_log_webhook_event($event);

    // Handle event types
    $result = false;
    switch ($event['type']) {
        case 'customer.subscription.created':
            $result = infinity_handle_subscription_created($event['data']['object']);
            break;

        case 'customer.subscription.updated':
            $result = infinity_handle_subscription_updated($event['data']['object']);
            break;

        case 'customer.subscription.deleted':
            $result = infinity_handle_subscription_deleted($event['data']['object']);
            break;

        case 'invoice.payment_succeeded':
            $result = infinity_handle_payment_succeeded($event['data']['object']);
            break;

        case 'invoice.payment_failed':
            $result = infinity_handle_payment_failed($event['data']['object']);
            break;

        case 'checkout.session.completed':
            $result = infinity_handle_checkout_completed($event['data']['object']);
            break;

        default:
            // Acknowledge unhandled events
            $result = true;
    }

    if ($result === false) {
        return new WP_REST_Response(array(
            'error' => 'Failed to process event',
        ), 500);
    }

    return new WP_REST_Response(array(
        'received' => true,
        'type'     => $event['type'],
    ), 200);
}

/**
 * Verify Stripe webhook signature
 */
function infinity_verify_webhook_signature($payload, $sig_header, $webhook_secret) {
    // Parse signature header
    $parts = explode(',', $sig_header);
    $timestamp = null;
    $signatures = array();

    foreach ($parts as $part) {
        list($key, $value) = explode('=', trim($part), 2);
        if ($key === 't') {
            $timestamp = (int) $value;
        } elseif ($key === 'v1') {
            $signatures[] = $value;
        }
    }

    if (!$timestamp || empty($signatures)) {
        return false;
    }

    // Check timestamp tolerance (5 minutes)
    $tolerance = 300;
    if (abs(time() - $timestamp) > $tolerance) {
        return false;
    }

    // Compute expected signature
    $signed_payload = $timestamp . '.' . $payload;
    $expected_signature = hash_hmac('sha256', $signed_payload, $webhook_secret);

    // Constant-time comparison
    foreach ($signatures as $signature) {
        if (hash_equals($expected_signature, $signature)) {
            return true;
        }
    }

    return false;
}

/**
 * Log webhook event to database
 */
function infinity_log_webhook_event($event) {
    global $wpdb;

    $table_name = $wpdb->prefix . 'infinity_subscription_events';

    $wpdb->insert(
        $table_name,
        array(
            'user_id'    => 0, // Will be updated when we identify the user
            'event_type' => 'webhook_' . $event['type'],
            'event_data' => wp_json_encode($event),
            'created_at' => current_time('mysql'),
        ),
        array('%d', '%s', '%s', '%s')
    );
}

/**
 * Find WordPress user by Stripe customer ID
 */
function infinity_get_user_by_stripe_customer($customer_id) {
    global $wpdb;

    $user_id = $wpdb->get_var($wpdb->prepare(
        "SELECT user_id FROM {$wpdb->usermeta}
        WHERE meta_key = 'infinity_stripe_customer_id'
        AND meta_value = %s
        LIMIT 1",
        $customer_id
    ));

    return $user_id ? (int) $user_id : null;
}

/**
 * Handle subscription created event
 */
function infinity_handle_subscription_created($subscription) {
    $customer_id = $subscription['customer'];
    $user_id = infinity_get_user_by_stripe_customer($customer_id);

    if (!$user_id) {
        // Try to find user by email from customer object
        $customer = infinity_stripe_request('customers/' . $customer_id, array(), 'GET');
        if (!is_wp_error($customer) && isset($customer['email'])) {
            $user = get_user_by('email', $customer['email']);
            if ($user) {
                $user_id = $user->ID;
                infinity_save_stripe_customer_id($user_id, $customer_id);
            }
        }
    }

    if (!$user_id) {
        error_log('[Infinity Stripe] Could not find user for customer: ' . $customer_id);
        return false;
    }

    $status = $subscription['status'];
    infinity_update_subscription_status($user_id, $subscription['id'], $status);

    // Store additional subscription data
    update_user_meta($user_id, 'infinity_subscription_current_period_end', $subscription['current_period_end']);
    update_user_meta($user_id, 'infinity_subscription_cancel_at_period_end', $subscription['cancel_at_period_end'] ? '1' : '0');

    // Track event
    infinity_track_subscription_event('subscription_created', $user_id, array(
        'subscription_id' => $subscription['id'],
        'status'          => $status,
    ));

    // Trigger action for other integrations
    do_action('infinity_subscription_created', $user_id, $subscription);

    return true;
}

/**
 * Handle subscription updated event
 */
function infinity_handle_subscription_updated($subscription) {
    $customer_id = $subscription['customer'];
    $user_id = infinity_get_user_by_stripe_customer($customer_id);

    if (!$user_id) {
        return false;
    }

    $status = $subscription['status'];
    infinity_update_subscription_status($user_id, $subscription['id'], $status);

    // Update period end and cancellation status
    update_user_meta($user_id, 'infinity_subscription_current_period_end', $subscription['current_period_end']);
    update_user_meta($user_id, 'infinity_subscription_cancel_at_period_end', $subscription['cancel_at_period_end'] ? '1' : '0');

    // Track event
    infinity_track_subscription_event('subscription_updated', $user_id, array(
        'subscription_id' => $subscription['id'],
        'status'          => $status,
        'cancel_at_period_end' => $subscription['cancel_at_period_end'],
    ));

    do_action('infinity_subscription_updated', $user_id, $subscription);

    return true;
}

/**
 * Handle subscription deleted event
 */
function infinity_handle_subscription_deleted($subscription) {
    $customer_id = $subscription['customer'];
    $user_id = infinity_get_user_by_stripe_customer($customer_id);

    if (!$user_id) {
        return false;
    }

    infinity_update_subscription_status($user_id, $subscription['id'], 'canceled');

    // Track event
    infinity_track_subscription_event('subscription_deleted', $user_id, array(
        'subscription_id' => $subscription['id'],
    ));

    do_action('infinity_subscription_deleted', $user_id, $subscription);

    return true;
}

/**
 * Handle successful payment event
 */
function infinity_handle_payment_succeeded($invoice) {
    $customer_id = $invoice['customer'];
    $user_id = infinity_get_user_by_stripe_customer($customer_id);

    if (!$user_id) {
        return true; // Not critical
    }

    // Track event
    infinity_track_subscription_event('payment_succeeded', $user_id, array(
        'invoice_id'      => $invoice['id'],
        'amount_paid'     => $invoice['amount_paid'],
        'subscription_id' => $invoice['subscription'] ?? null,
    ));

    do_action('infinity_payment_succeeded', $user_id, $invoice);

    return true;
}

/**
 * Handle failed payment event
 */
function infinity_handle_payment_failed($invoice) {
    $customer_id = $invoice['customer'];
    $user_id = infinity_get_user_by_stripe_customer($customer_id);

    if (!$user_id) {
        return true;
    }

    // Update subscription status to past_due if this is a subscription invoice
    if (!empty($invoice['subscription'])) {
        infinity_update_subscription_status($user_id, $invoice['subscription'], 'past_due');
    }

    // Track event
    infinity_track_subscription_event('payment_failed', $user_id, array(
        'invoice_id'      => $invoice['id'],
        'subscription_id' => $invoice['subscription'] ?? null,
        'attempt_count'   => $invoice['attempt_count'] ?? 1,
    ));

    do_action('infinity_payment_failed', $user_id, $invoice);

    return true;
}

/**
 * Handle checkout session completed event
 */
function infinity_handle_checkout_completed($session) {
    $customer_id = $session['customer'];
    $user_id = infinity_get_user_by_stripe_customer($customer_id);

    if (!$user_id && !empty($session['client_reference_id'])) {
        $user_id = (int) $session['client_reference_id'];
        infinity_save_stripe_customer_id($user_id, $customer_id);
    }

    if (!$user_id) {
        return false;
    }

    // Track event
    infinity_track_subscription_event('checkout_completed', $user_id, array(
        'session_id'      => $session['id'],
        'subscription_id' => $session['subscription'] ?? null,
    ));

    do_action('infinity_checkout_completed', $user_id, $session);

    return true;
}

/**
 * Create Stripe Checkout Session
 */
function infinity_create_checkout_session(WP_REST_Request $request) {
    if (!infinity_stripe_configured()) {
        return new WP_REST_Response(array(
            'error' => __('Stripe is not configured.', 'infinity'),
        ), 400);
    }

    $user_id = get_current_user_id();
    $price_id = $request->get_param('priceId');

    // Validate price ID
    $valid_prices = array(
        infinity_get_stripe_price_id('monthly'),
        infinity_get_stripe_price_id('yearly'),
    );

    if (!in_array($price_id, $valid_prices) || empty($price_id)) {
        return new WP_REST_Response(array(
            'error' => __('Invalid price ID.', 'infinity'),
        ), 400);
    }

    // Check if user already has active subscription
    if (infinity_has_active_subscription($user_id)) {
        return new WP_REST_Response(array(
            'error' => __('You already have an active subscription.', 'infinity'),
        ), 400);
    }

    // Get or create Stripe customer
    $customer_id = infinity_create_stripe_customer($user_id);

    if (is_wp_error($customer_id)) {
        return new WP_REST_Response(array(
            'error' => $customer_id->get_error_message(),
        ), 500);
    }

    // Create checkout session
    $session = infinity_stripe_request('checkout/sessions', array(
        'mode'                 => 'subscription',
        'customer'             => $customer_id,
        'client_reference_id'  => $user_id,
        'line_items'           => array(
            array(
                'price'    => $price_id,
                'quantity' => 1,
            ),
        ),
        'success_url'          => home_url('/dashboard/?subscription=success'),
        'cancel_url'           => home_url('/pricing/?subscription=canceled'),
        'subscription_data'    => array(
            'metadata' => array(
                'wordpress_user_id' => $user_id,
            ),
        ),
        'allow_promotion_codes' => 'true',
    ));

    if (is_wp_error($session)) {
        return new WP_REST_Response(array(
            'error' => $session->get_error_message(),
        ), 500);
    }

    return new WP_REST_Response(array(
        'checkoutUrl' => $session['url'],
        'sessionId'   => $session['id'],
    ), 200);
}

/**
 * Cancel subscription endpoint
 */
function infinity_cancel_subscription_endpoint(WP_REST_Request $request) {
    if (!infinity_stripe_configured()) {
        return new WP_REST_Response(array(
            'error' => __('Stripe is not configured.', 'infinity'),
        ), 400);
    }

    $user_id = get_current_user_id();
    $subscription_id = get_user_meta($user_id, 'infinity_subscription_id', true);

    if (empty($subscription_id)) {
        return new WP_REST_Response(array(
            'error' => __('No active subscription found.', 'infinity'),
        ), 400);
    }

    // Cancel at period end (don't immediately revoke access)
    $subscription = infinity_stripe_request('subscriptions/' . $subscription_id, array(
        'cancel_at_period_end' => 'true',
    ));

    if (is_wp_error($subscription)) {
        return new WP_REST_Response(array(
            'error' => $subscription->get_error_message(),
        ), 500);
    }

    // Update local status
    update_user_meta($user_id, 'infinity_subscription_cancel_at_period_end', '1');

    // Track event
    infinity_track_subscription_event('subscription_cancel_requested', $user_id, array(
        'subscription_id' => $subscription_id,
    ));

    return new WP_REST_Response(array(
        'success'       => true,
        'message'       => __('Subscription will be canceled at the end of the billing period.', 'infinity'),
        'cancel_at'     => $subscription['cancel_at'],
        'current_period_end' => $subscription['current_period_end'],
    ), 200);
}

/**
 * Reactivate subscription endpoint
 */
function infinity_reactivate_subscription_endpoint(WP_REST_Request $request) {
    if (!infinity_stripe_configured()) {
        return new WP_REST_Response(array(
            'error' => __('Stripe is not configured.', 'infinity'),
        ), 400);
    }

    $user_id = get_current_user_id();
    $subscription_id = get_user_meta($user_id, 'infinity_subscription_id', true);

    if (empty($subscription_id)) {
        return new WP_REST_Response(array(
            'error' => __('No subscription found.', 'infinity'),
        ), 400);
    }

    // Check if subscription is set to cancel
    $cancel_at_period_end = get_user_meta($user_id, 'infinity_subscription_cancel_at_period_end', true);

    if ($cancel_at_period_end !== '1') {
        return new WP_REST_Response(array(
            'error' => __('Subscription is not set to cancel.', 'infinity'),
        ), 400);
    }

    // Reactivate by removing cancel_at_period_end
    $subscription = infinity_stripe_request('subscriptions/' . $subscription_id, array(
        'cancel_at_period_end' => 'false',
    ));

    if (is_wp_error($subscription)) {
        return new WP_REST_Response(array(
            'error' => $subscription->get_error_message(),
        ), 500);
    }

    // Update local status
    update_user_meta($user_id, 'infinity_subscription_cancel_at_period_end', '0');

    // Track event
    infinity_track_subscription_event('subscription_reactivated', $user_id, array(
        'subscription_id' => $subscription_id,
    ));

    return new WP_REST_Response(array(
        'success' => true,
        'message' => __('Subscription has been reactivated.', 'infinity'),
    ), 200);
}

/**
 * Update payment method endpoint (redirect to Stripe Billing Portal)
 */
function infinity_update_payment_method_endpoint(WP_REST_Request $request) {
    if (!infinity_stripe_configured()) {
        return new WP_REST_Response(array(
            'error' => __('Stripe is not configured.', 'infinity'),
        ), 400);
    }

    $user_id = get_current_user_id();
    $customer_id = infinity_get_stripe_customer_id($user_id);

    if (empty($customer_id)) {
        return new WP_REST_Response(array(
            'error' => __('No customer record found.', 'infinity'),
        ), 400);
    }

    // Create Billing Portal session
    $portal = infinity_stripe_request('billing_portal/sessions', array(
        'customer'   => $customer_id,
        'return_url' => home_url('/dashboard/'),
    ));

    if (is_wp_error($portal)) {
        return new WP_REST_Response(array(
            'error' => $portal->get_error_message(),
        ), 500);
    }

    return new WP_REST_Response(array(
        'portalUrl' => $portal['url'],
    ), 200);
}

/**
 * Get current subscription details
 */
function infinity_get_subscription_details(WP_REST_Request $request) {
    $user_id = get_current_user_id();
    $subscription_id = get_user_meta($user_id, 'infinity_subscription_id', true);
    $status = infinity_get_user_subscription_status($user_id);

    if (empty($subscription_id) || $status === 'none') {
        return new WP_REST_Response(array(
            'hasSubscription' => false,
            'status'          => 'none',
        ), 200);
    }

    $data = array(
        'hasSubscription'       => true,
        'subscriptionId'        => $subscription_id,
        'status'                => $status,
        'currentPeriodEnd'      => (int) get_user_meta($user_id, 'infinity_subscription_current_period_end', true),
        'cancelAtPeriodEnd'     => get_user_meta($user_id, 'infinity_subscription_cancel_at_period_end', true) === '1',
    );

    // Get additional details from Stripe if configured
    if (infinity_stripe_configured()) {
        $subscription = infinity_stripe_request('subscriptions/' . $subscription_id, array(
            'expand' => array('default_payment_method'),
        ), 'GET');

        if (!is_wp_error($subscription)) {
            $data['plan'] = array(
                'interval' => $subscription['items']['data'][0]['price']['recurring']['interval'] ?? 'month',
                'amount'   => ($subscription['items']['data'][0]['price']['unit_amount'] ?? 0) / 100,
                'currency' => $subscription['items']['data'][0]['price']['currency'] ?? 'usd',
            );

            if (!empty($subscription['default_payment_method'])) {
                $pm = $subscription['default_payment_method'];
                if (isset($pm['card'])) {
                    $data['paymentMethod'] = array(
                        'brand'    => $pm['card']['brand'],
                        'last4'    => $pm['card']['last4'],
                        'expMonth' => $pm['card']['exp_month'],
                        'expYear'  => $pm['card']['exp_year'],
                    );
                }
            }
        }
    }

    return new WP_REST_Response($data, 200);
}

/**
 * Add subscription data to user stats endpoint
 */
function infinity_add_subscription_to_stats($stats, $user_id) {
    $stats['subscription'] = array(
        'status'              => infinity_get_user_subscription_status($user_id),
        'isPremium'           => infinity_has_active_subscription($user_id),
        'currentPeriodEnd'    => (int) get_user_meta($user_id, 'infinity_subscription_current_period_end', true),
        'cancelAtPeriodEnd'   => get_user_meta($user_id, 'infinity_subscription_cancel_at_period_end', true) === '1',
    );

    return $stats;
}
add_filter('infinity_user_stats', 'infinity_add_subscription_to_stats', 10, 2);

/**
 * Add Stripe config to frontend data
 */
function infinity_add_stripe_frontend_data($data) {
    $data['stripe'] = array(
        'enabled'      => infinity_stripe_configured(),
        'publishableKey' => infinity_get_stripe_key(),
        'prices'       => array(
            'monthly' => infinity_get_stripe_price_id('monthly'),
            'yearly'  => infinity_get_stripe_price_id('yearly'),
        ),
        'premiumPrice' => infinity_get_premium_price(),
    );

    return $data;
}
add_filter('infinity_frontend_data', 'infinity_add_stripe_frontend_data');
