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
function infinity_subscribe_token($email, $purpose = '') {
    $email = strtolower(trim($email));

    /*
     * The empty purpose deliberately hashes exactly what the previous
     * version hashed, so every unsubscribe link already sitting in
     * somebody's inbox keeps working. New purposes are namespaced, so a
     * confirm link can never be replayed as an unsubscribe or vice versa.
     */
    $data = ('' === $purpose) ? $email : $purpose . '|' . $email;

    return substr(hash_hmac('sha256', $data, wp_salt('auth')), 0, 20);
}

/**
 * Look a subscriber up by address.
 *
 * Subscriber status carries the whole state machine:
 *   pending  signed up, has not clicked the confirm link yet
 *   publish  confirmed, receives new-post email
 *   draft    unsubscribed
 *
 * get_page_by_title() did this until WordPress 6.2 deprecated it.
 */
function infinity_find_subscriber($email) {
    $found = new WP_Query(array(
        'post_type'              => 'inf_subscriber',
        'title'                  => $email,
        'post_status'            => array('publish', 'pending', 'draft'),
        'posts_per_page'         => 1,
        'no_found_rows'          => true,
        'update_post_meta_cache' => false,
        'update_post_term_cache' => false,
    ));

    return $found->posts ? $found->posts[0] : null;
}

/**
 * Whether a new address must click a link before it is mailed anything
 * else. On by default, and worth understanding before turning off:
 * without it this endpoint will send mail to any address anybody types,
 * which is a way to get a sending domain blocked by way of other
 * people's spam complaints. Disable with:
 *
 *     add_filter('infinity_subscribe_double_optin', '__return_false');
 */
function infinity_subscribe_double_optin() {
    return (bool) apply_filters('infinity_subscribe_double_optin', true);
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

    register_rest_route('infinity/v1', '/confirm', array(
        'methods'             => 'GET',
        'callback'            => 'infinity_handle_confirm',
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

    $confirm  = infinity_subscribe_double_optin();
    $existing = infinity_find_subscriber($email);

    // Already confirmed. Say so rather than mailing them again — a
    // second welcome for an address that never left reads as a bug.
    if ($existing && 'publish' === $existing->post_status) {
        return new WP_REST_Response(array(
            'ok'      => true,
            'state'   => 'already',
            'message' => __('You\'re already on the list — nothing to do.', 'infinity'),
        ), 200);
    }

    if ($existing) {
        $id = $existing->ID;
    } else {
        $id = wp_insert_post(array(
            'post_type'   => 'inf_subscriber',
            'post_title'  => $email,
            'post_status' => $confirm ? 'pending' : 'publish',
        ));

        if (is_wp_error($id) || !$id) {
            return new WP_REST_Response(array('ok' => false, 'message' => __('Could not save that just now — try again shortly.', 'infinity')), 500);
        }
    }

    if (!$confirm) {
        wp_update_post(array('ID' => $id, 'post_status' => 'publish'));
        infinity_send_welcome_email($email);

        return new WP_REST_Response(array(
            'ok'      => true,
            'state'   => 'subscribed',
            'message' => __('You\'re on the list — see you at the next article!', 'infinity'),
        ), 200);
    }

    wp_update_post(array('ID' => $id, 'post_status' => 'pending'));

    if (infinity_send_confirm_email($email)) {
        return new WP_REST_Response(array(
            'ok'      => true,
            'state'   => 'pending',
            'message' => __('Almost there — check your inbox for a confirmation link.', 'infinity'),
        ), 200);
    }

    /*
     * The confirmation could not be delivered. Stranding someone behind
     * a link they will never receive is the worse failure, so record the
     * signup and move on; infinity_mail_record_error() has already put
     * the reason on the Subscribers screen for whoever can fix it.
     */
    wp_update_post(array('ID' => $id, 'post_status' => 'publish'));

    return new WP_REST_Response(array(
        'ok'      => true,
        'state'   => 'subscribed',
        'message' => __('You\'re on the list — see you at the next article!', 'infinity'),
    ), 200);
}

/**
 * Confirm an address, then send the welcome that used to go out on
 * signup. This is the point at which the address becomes a subscriber.
 */
function infinity_handle_confirm(WP_REST_Request $request) {
    $email = sanitize_email((string) $request->get_param('e'));
    $token = sanitize_text_field((string) $request->get_param('t'));
    $ok    = false;

    if ($email && hash_equals(infinity_subscribe_token($email, 'confirm'), $token)) {
        $existing = infinity_find_subscriber($email);
        if ($existing) {
            if ('publish' !== $existing->post_status) {
                wp_update_post(array('ID' => $existing->ID, 'post_status' => 'publish'));
                infinity_send_welcome_email($email);
            }
            $ok = true;
        }
    }

    $target = apply_filters(
        'infinity_subscribe_confirm_redirect',
        add_query_arg($ok ? 'subscribed' : 'confirm_failed', '1', home_url('/')),
        $email,
        $ok
    );

    wp_safe_redirect($target);
    exit;
}

/**
 * Confirmation email. Deliberately short: it has exactly one job, and
 * every extra line is something between the reader and the button.
 * Returns whether it was accepted for delivery.
 */
function infinity_send_confirm_email($email) {
    $site = get_bloginfo('name');
    $link = add_query_arg(array(
        'e' => rawurlencode($email),
        't' => infinity_subscribe_token($email, 'confirm'),
    ), rest_url('infinity/v1/confirm'));

    $subject = apply_filters(
        'infinity_confirm_email_subject',
        sprintf(__('Confirm your subscription to %s', 'infinity'), $site),
        $email
    );

    $body = sprintf(
        '<div style="max-width:560px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#1f2430;">
            <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6366f1;margin:24px 0 6px;">One more step</p>
            <h1 style="font-size:24px;margin:0 0 14px;">Confirm your subscription</h1>
            <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px;">
                Tap the button and you&#8217;re in. If you didn&#8217;t ask to subscribe to
                <strong>%1$s</strong>, ignore this email — nothing further will be sent.
            </p>
            <p style="margin:0 0 26px;">
                <a href="%2$s" style="display:inline-block;padding:13px 26px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">Confirm subscription</a>
            </p>
            <p style="font-size:12px;color:#999;border-top:1px solid #eee;padding-top:14px;word-break:break-all;">
                Button not working? Paste this into your browser:<br>%3$s
            </p>
        </div>',
        esc_html($site),
        esc_url($link),
        esc_url($link)
    );
    $body = apply_filters('infinity_confirm_email_body', $body, $email);

    return (bool) wp_mail($email, $subject, $body, array('Content-Type: text/html; charset=UTF-8'));
}

/**
 * Welcome email — sent once the address is confirmed.
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

    return (bool) wp_mail($email, $subject, $body, array('Content-Type: text/html; charset=UTF-8'));
}

/**
 * Handle one-click unsubscribe.
 */
function infinity_handle_unsubscribe(WP_REST_Request $request) {
    $email = sanitize_email((string) $request->get_param('e'));
    $token = sanitize_text_field((string) $request->get_param('t'));

    if ($email && hash_equals(infinity_subscribe_token($email), $token)) {
        $existing = infinity_find_subscriber($email);
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
 * The banner someone lands on after clicking a link in an email.
 *
 * Rendered at the top of the body rather than inside the band, because
 * these links land on the home page and the band is at the bottom of
 * it — a confirmation nobody scrolls to is a confirmation nobody sees.
 *
 * `unsubscribed` has been redirected to since this feature shipped and
 * has never rendered anything, so one-click unsubscribe has always
 * dropped people on a home page that gave no sign it had worked.
 */
function infinity_subscribe_notice() {
    if (!empty($_GET['subscribed'])) {                       // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $tone = 'is-good';
        $text = __('You\'re in — subscription confirmed. See you at the next article.', 'infinity');
    } elseif (!empty($_GET['confirm_failed'])) {              // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $tone = 'is-warn';
        $text = __('That confirmation link has expired or was already used. Sign up again and we\'ll send a fresh one.', 'infinity');
    } elseif (!empty($_GET['unsubscribed'])) {               // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $tone = 'is-good';
        $text = __('You\'re unsubscribed — no more emails. No hard feelings.', 'infinity');
    } else {
        return;
    }
    ?>
    <div class="subscribe-flash <?php echo esc_attr($tone); ?>" role="status">
        <div class="container subscribe-flash-inner">
            <span class="subscribe-flash-text"><?php echo esc_html($text); ?></span>
            <button class="subscribe-flash-close" type="button" aria-label="<?php esc_attr_e('Dismiss', 'infinity'); ?>">&times;</button>
        </div>
    </div>
    <?php
}
add_action('wp_body_open', 'infinity_subscribe_notice');

/**
 * Has an in-content subscribe band already been rendered on this
 * request? Call with true to record that one has.
 */
function infinity_subscribe_band_rendered($set = null) {
    static $rendered = false;

    if (true === $set) {
        $rendered = true;
    }

    return $rendered;
}

/**
 * Render the subscribe band. The footer instance carries the
 * #subscribe anchor so any "Sign up" link can point to /#subscribe
 * (the band is on every page); the shortcode instance identifies
 * itself as source "signup-page" in the analytics funnel.
 */
function infinity_subscribe_band($source = 'footer-band') {
    $is_footer = ('footer-band' === $source);

    /*
     * The footer renders this on every page, and the sign-up page also
     * carries [infinity_subscribe] so that "Sign up" links have a real
     * target — which put the identical form on that page twice. The
     * shortcode runs while the_content is filtered, well before the
     * footer, so by the time the footer asks, this already knows.
     */
    if ($is_footer && infinity_subscribe_band_rendered()) {
        return;
    }

    /*
     * The #subscribe anchor goes to whichever band renders first, not
     * to the footer by definition — suppressing the footer copy on the
     * sign-up page would otherwise take the anchor off that page with
     * it, and a second shortcode on one page would duplicate the id.
     */
    $anchor = !infinity_subscribe_band_rendered();

    if (!$is_footer) {
        infinity_subscribe_band_rendered(true);
    }
    ?>
    <div class="subscribe-band"<?php echo $anchor ? ' id="subscribe"' : ''; ?> data-source="<?php echo esc_attr($source); ?>">
        <div class="container subscribe-band-inner">
            <div class="subscribe-band-copy">
                <p class="fp-kicker"><?php esc_html_e('Stay in orbit', 'infinity'); ?></p>
                <h2 class="subscribe-band-title"><?php esc_html_e('New articles, straight to your inbox', 'infinity'); ?></h2>
                <p class="subscribe-band-sub"><?php esc_html_e('Anatomy, space, simulations, and the occasional world-eating fungus. No spam, unsubscribe in one click.', 'infinity'); ?></p>

                <?php if (!$is_footer) : ?>
                    <ul class="subscribe-points">
                        <li><?php esc_html_e('One email per article — no digests, no drip sequence, no schedule to keep up with.', 'infinity'); ?></li>
                        <li><?php esc_html_e('Simulations and write-ups first, before they go anywhere else.', 'infinity'); ?></li>
                        <li><?php esc_html_e('Your address is used for these emails and nothing else, ever.', 'infinity'); ?></li>
                    </ul>
                <?php endif; ?>
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
