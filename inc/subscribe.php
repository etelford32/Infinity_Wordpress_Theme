<?php
/**
 * Blog subscriptions — lightweight, no-plugin email updates.
 *
 * Subscribers are stored as a private CPT (visible in wp-admin under
 * "Subscribers"). A public REST endpoint accepts signups with
 * honeypot + rate limiting; publishing a post emails every active
 * subscriber a notification with a signed one-click unsubscribe link.
 *
 * @package Infinity
 * @since 2.3.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Subscriber storage: private CPT, admin list = your subscriber list.
 */
function infinity_register_subscriber_cpt() {
    register_post_type('inf_subscriber', array(
        'labels' => array(
            'name'          => __('Subscribers', 'infinity'),
            'singular_name' => __('Subscriber', 'infinity'),
        ),
        'public'       => false,
        'show_ui'      => true,
        'menu_icon'    => 'dashicons-email-alt',
        'supports'     => array('title'),
        'capabilities' => array('create_posts' => 'do_not_allow'),
        'map_meta_cap' => true,
    ));
}
add_action('init', 'infinity_register_subscriber_cpt');

/**
 * Signed token so unsubscribe links can't be forged.
 */
function infinity_subscribe_token($email) {
    return substr(hash_hmac('sha256', strtolower(trim($email)), wp_salt('auth')), 0, 20);
}

/**
 * REST: subscribe + unsubscribe.
 */
function infinity_register_subscribe_routes() {
    register_rest_route('infinity/v1', '/subscribe', array(
        'methods'             => 'POST',
        'callback'            => 'infinity_handle_subscribe',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('infinity/v1', '/unsubscribe', array(
        'methods'             => 'GET',
        'callback'            => 'infinity_handle_unsubscribe',
        'permission_callback' => '__return_true',
    ));
}
add_action('rest_api_init', 'infinity_register_subscribe_routes');

/**
 * Handle a signup.
 */
function infinity_handle_subscribe(WP_REST_Request $request) {
    // Honeypot: real users never fill this
    if ('' !== (string) $request->get_param('website')) {
        return new WP_REST_Response(array('ok' => true), 200);
    }

    // Light rate limit per IP
    $ip  = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : '';
    $key = 'inf_sub_' . md5($ip);
    if (get_transient($key)) {
        return new WP_REST_Response(array('ok' => false, 'message' => __('Please wait a moment and try again.', 'infinity')), 429);
    }
    set_transient($key, 1, 30);

    $email = sanitize_email((string) $request->get_param('email'));
    if (!is_email($email)) {
        return new WP_REST_Response(array('ok' => false, 'message' => __('That email doesn\'t look right.', 'infinity')), 400);
    }

    $existing = get_page_by_title($email, OBJECT, 'inf_subscriber');
    if ($existing) {
        if ('publish' !== $existing->post_status) {
            wp_update_post(array('ID' => $existing->ID, 'post_status' => 'publish'));
        }
        return new WP_REST_Response(array('ok' => true, 'message' => __('You\'re on the list!', 'infinity')), 200);
    }

    wp_insert_post(array(
        'post_type'   => 'inf_subscriber',
        'post_title'  => $email,
        'post_status' => 'publish',
    ));

    return new WP_REST_Response(array('ok' => true, 'message' => __('You\'re on the list — see you at the next article!', 'infinity')), 200);
}

/**
 * Handle one-click unsubscribe.
 */
function infinity_handle_unsubscribe(WP_REST_Request $request) {
    $email = sanitize_email((string) $request->get_param('e'));
    $token = sanitize_text_field((string) $request->get_param('t'));

    if ($email && hash_equals(infinity_subscribe_token($email), $token)) {
        $existing = get_page_by_title($email, OBJECT, 'inf_subscriber');
        if ($existing) {
            wp_update_post(array('ID' => $existing->ID, 'post_status' => 'draft'));
        }
    }

    wp_safe_redirect(add_query_arg('unsubscribed', '1', home_url('/')));
    exit;
}

/**
 * Email every active subscriber when a post is published.
 */
function infinity_notify_subscribers($new_status, $old_status, $post) {
    if ('publish' !== $new_status || 'publish' === $old_status || 'post' !== $post->post_type) {
        return;
    }

    $subscribers = get_posts(array(
        'post_type'      => 'inf_subscriber',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'fields'         => 'ids',
    ));
    if (!$subscribers) {
        return;
    }

    $site    = get_bloginfo('name');
    $title   = get_the_title($post);
    $link    = get_permalink($post);
    $excerpt = wp_trim_words(get_the_excerpt($post), 40);
    $subject = sprintf('[%s] %s', $site, $title);
    $headers = array('Content-Type: text/html; charset=UTF-8');

    foreach ($subscribers as $sub_id) {
        $email = get_the_title($sub_id);
        if (!is_email($email)) {
            continue;
        }
        $unsub = add_query_arg(array(
            'e' => rawurlencode($email),
            't' => infinity_subscribe_token($email),
        ), rest_url('infinity/v1/unsubscribe'));

        $body = sprintf(
            '<h2 style="font-family:Arial,sans-serif;">%1$s</h2>
            <p style="font-family:Arial,sans-serif;color:#444;">%2$s</p>
            <p><a href="%3$s" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-family:Arial,sans-serif;">Read the article &rarr;</a></p>
            <p style="font-family:Arial,sans-serif;color:#999;font-size:12px;">You subscribed to updates from %4$s. <a href="%5$s" style="color:#999;">Unsubscribe</a></p>',
            esc_html($title),
            esc_html($excerpt),
            esc_url($link),
            esc_html($site),
            esc_url($unsub)
        );

        wp_mail($email, $subject, $body, $headers);
    }
}
add_action('transition_post_status', 'infinity_notify_subscribers', 10, 3);

/**
 * Render the footer subscribe band.
 */
function infinity_subscribe_band() {
    ?>
    <div class="subscribe-band">
        <div class="container subscribe-band-inner">
            <div class="subscribe-band-copy">
                <p class="fp-kicker"><?php esc_html_e('Stay in orbit', 'infinity'); ?></p>
                <h2 class="subscribe-band-title"><?php esc_html_e('New articles, straight to your inbox', 'infinity'); ?></h2>
                <p class="subscribe-band-sub"><?php esc_html_e('Anatomy, space, simulations, and the occasional world-eating fungus. No spam, unsubscribe in one click.', 'infinity'); ?></p>
            </div>
            <form class="subscribe-form" data-endpoint="<?php echo esc_url(rest_url('infinity/v1/subscribe')); ?>">
                <label class="screen-reader-text" for="subscribe-email"><?php esc_html_e('Email address', 'infinity'); ?></label>
                <input id="subscribe-email" class="subscribe-input" type="email" name="email" placeholder="<?php esc_attr_e('you@example.com', 'infinity'); ?>" required>
                <input class="subscribe-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
                <button class="subscribe-btn" type="submit"><?php esc_html_e('Subscribe', 'infinity'); ?></button>
                <p class="subscribe-note" role="status" aria-live="polite"></p>
            </form>
        </div>
    </div>
    <?php
}
