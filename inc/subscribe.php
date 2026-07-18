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
            infinity_send_welcome_email($email); // welcome back
        }
        return new WP_REST_Response(array('ok' => true, 'message' => __('You\'re on the list!', 'infinity')), 200);
    }

    wp_insert_post(array(
        'post_type'   => 'inf_subscriber',
        'post_title'  => $email,
        'post_status' => 'publish',
    ));

    infinity_send_welcome_email($email);

    return new WP_REST_Response(array('ok' => true, 'message' => __('You\'re on the list — see you at the next article!', 'infinity')), 200);
}

/**
 * Welcome email — sent once on signup (and again on resubscribe).
 * Subject and body are filterable via infinity_welcome_email_subject /
 * infinity_welcome_email_body.
 */
function infinity_send_welcome_email($email) {
    $site  = get_bloginfo('name');
    $unsub = add_query_arg(array(
        'e' => rawurlencode($email),
        't' => infinity_subscribe_token($email),
    ), rest_url('infinity/v1/unsubscribe'));

    // Three recent posts as a "start here" list
    $recent      = get_posts(array('numberposts' => 3, 'post_status' => 'publish'));
    $recent_html = '';
    foreach ($recent as $r) {
        $recent_html .= sprintf(
            '<li style="margin:0 0 10px;"><a href="%1$s" style="color:#6366f1;text-decoration:none;font-weight:600;">%2$s</a></li>',
            esc_url(get_permalink($r)),
            esc_html(get_the_title($r))
        );
    }

    $steam_url   = get_option('infinity_steam_url', '');
    $parkers_url = get_option('infinity_parkers_url', '');
    $links_html  = '';
    if ($steam_url) {
        $links_html .= sprintf(
            '<li style="margin:0 0 10px;"><a href="%s" style="color:#6366f1;text-decoration:none;">Explore the Universe 2175 — the game, on Steam</a></li>',
            esc_url($steam_url)
        );
    }
    if ($parkers_url) {
        $links_html .= sprintf(
            '<li style="margin:0 0 10px;"><a href="%s" style="color:#6366f1;text-decoration:none;">Parker&#8217;s Physics — interactive physics playground</a></li>',
            esc_url($parkers_url)
        );
    }

    $subject = apply_filters(
        'infinity_welcome_email_subject',
        sprintf(__('Welcome aboard — you\'re in orbit around %s', 'infinity'), $site),
        $email
    );

    $body = sprintf(
        '<div style="max-width:560px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#1f2430;">
            <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6366f1;margin:24px 0 6px;">Stay in orbit</p>
            <h1 style="font-size:26px;margin:0 0 14px;">Welcome aboard 🌌</h1>
            <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 14px;">
                Thanks for subscribing to <strong>%1$s</strong>. Whenever a new article
                lands — anatomy, space, simulations, and the occasional world-eating
                fungus — you&#8217;ll get it straight to this inbox. No spam, no schedule
                pressure, and every email has a one-click unsubscribe.
            </p>
            %2$s
            %3$s
            <p style="font-size:15px;line-height:1.6;color:#444;margin:18px 0 24px;">
                See you at the next article,<br>Elliot
            </p>
            <p style="font-size:12px;color:#999;border-top:1px solid #eee;padding-top:14px;">
                You subscribed to updates from %1$s.
                <a href="%4$s" style="color:#999;">Unsubscribe</a>
            </p>
        </div>',
        esc_html($site),
        $recent_html ? '<p style="font-size:15px;color:#444;margin:18px 0 8px;"><strong>Start here — recent favorites:</strong></p><ul style="font-size:15px;line-height:1.5;padding-left:20px;margin:0;">' . $recent_html . '</ul>' : '',
        $links_html ? '<p style="font-size:15px;color:#444;margin:18px 0 8px;"><strong>Elsewhere in this universe:</strong></p><ul style="font-size:15px;line-height:1.5;padding-left:20px;margin:0;">' . $links_html . '</ul>' : '',
        esc_url($unsub)
    );
    $body = apply_filters('infinity_welcome_email_body', $body, $email);

    wp_mail($email, $subject, $body, array('Content-Type: text/html; charset=UTF-8'));
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
 * Render the subscribe band. The footer instance carries the
 * #subscribe anchor so any "Sign up" link can point to /#subscribe
 * (the band is on every page); the shortcode instance identifies
 * itself as source "signup-page" in the analytics funnel.
 */
function infinity_subscribe_band($source = 'footer-band') {
    $is_footer = ('footer-band' === $source);
    ?>
    <div class="subscribe-band"<?php echo $is_footer ? ' id="subscribe"' : ''; ?> data-source="<?php echo esc_attr($source); ?>">
        <div class="container subscribe-band-inner">
            <div class="subscribe-band-copy">
                <p class="fp-kicker"><?php esc_html_e('Stay in orbit', 'infinity'); ?></p>
                <h2 class="subscribe-band-title"><?php esc_html_e('New articles, straight to your inbox', 'infinity'); ?></h2>
                <p class="subscribe-band-sub"><?php esc_html_e('Anatomy, space, simulations, and the occasional world-eating fungus. No spam, unsubscribe in one click.', 'infinity'); ?></p>
            </div>
            <form class="subscribe-form" data-endpoint="<?php echo esc_url(rest_url('infinity/v1/subscribe')); ?>" data-source="<?php echo esc_attr($source); ?>">
                <label class="screen-reader-text" for="subscribe-email-<?php echo esc_attr($source); ?>"><?php esc_html_e('Email address', 'infinity'); ?></label>
                <input id="subscribe-email-<?php echo esc_attr($source); ?>" class="subscribe-input" type="email" name="email" placeholder="<?php esc_attr_e('you@example.com', 'infinity'); ?>" required>
                <input class="subscribe-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
                <button class="subscribe-btn" type="submit"><?php esc_html_e('Subscribe', 'infinity'); ?></button>
                <p class="subscribe-note" role="status" aria-live="polite"></p>
            </form>
        </div>
    </div>
    <?php
}

/**
 * [infinity_subscribe] — embed the subscribe form in any page or post
 * (use it on the /sign-up/ page so sign-up links have a real target).
 */
function infinity_subscribe_shortcode() {
    ob_start();
    infinity_subscribe_band('signup-page');
    return ob_get_clean();
}
add_shortcode('infinity_subscribe', 'infinity_subscribe_shortcode');
