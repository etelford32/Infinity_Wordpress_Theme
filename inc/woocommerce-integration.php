<?php
/**
 * WooCommerce Integration
 *
 * @package Infinity
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Add WooCommerce support
 */
function infinity_woocommerce_support() {
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
}
add_action('after_setup_theme', 'infinity_woocommerce_support');

/**
 * Create subscription products on theme activation
 */
function infinity_create_subscription_products() {
    if (!class_exists('WC_Product_Subscription')) {
        return; // WooCommerce Subscriptions not active
    }

    // Check if products already exist
    $existing = get_posts(array(
        'post_type'   => 'product',
        'meta_key'    => '_infinity_subscription_product',
        'meta_value'  => '1',
        'post_status' => 'any',
    ));

    if (!empty($existing)) {
        return; // Already created
    }

    // Create Premium Monthly Subscription
    $premium_price = infinity_get_premium_price();

    $product_id = wp_insert_post(array(
        'post_title'   => __('Premium Membership', 'infinity'),
        'post_content' => __('Get unlimited access to all simulations, blueprint creator, code tutorials, and more!', 'infinity'),
        'post_status'  => 'publish',
        'post_type'    => 'product',
    ));

    if ($product_id) {
        wp_set_object_terms($product_id, 'subscription', 'product_type');

        update_post_meta($product_id, '_price', $premium_price);
        update_post_meta($product_id, '_regular_price', $premium_price);
        update_post_meta($product_id, '_subscription_price', $premium_price);
        update_post_meta($product_id, '_subscription_period', 'month');
        update_post_meta($product_id, '_subscription_period_interval', '1');
        update_post_meta($product_id, '_subscription_length', '0'); // Never expires
        update_post_meta($product_id, '_infinity_subscription_product', '1');
    }
}
add_action('after_switch_theme', 'infinity_create_subscription_products');

/**
 * Handle subscription activation
 */
function infinity_subscription_activated($subscription) {
    $user_id = $subscription->get_user_id();

    if ($user_id) {
        infinity_update_subscription_status($user_id, $subscription->get_id(), 'active');
    }
}
add_action('woocommerce_subscription_status_active', 'infinity_subscription_activated');

/**
 * Handle subscription cancellation
 */
function infinity_subscription_cancelled($subscription) {
    $user_id = $subscription->get_user_id();

    if ($user_id) {
        infinity_update_subscription_status($user_id, $subscription->get_id(), 'canceled');
    }
}
add_action('woocommerce_subscription_status_cancelled', 'infinity_subscription_cancelled');
add_action('woocommerce_subscription_status_expired', 'infinity_subscription_cancelled');
