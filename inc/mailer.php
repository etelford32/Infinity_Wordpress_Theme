<?php
/**
 * Outbound mail via Resend.
 *
 * WordPress hands every wp_mail() to PHP's mail(), which on shared
 * hosting means an unauthenticated message from an IP the receiving
 * side has never been asked to trust. It usually leaves, and it
 * usually lands in spam — which is the worst failure mode there is,
 * because nothing reports an error.
 *
 * So this intercepts wp_mail at `pre_wp_mail` and posts to Resend's
 * HTTP API instead. Nothing else in the theme changes: every existing
 * wp_mail() call keeps working and simply starts arriving. With no key
 * configured the filter returns null and WordPress falls through to
 * its own transport, so an unconfigured site behaves exactly as before
 * rather than silently sending nothing.
 *
 * The key belongs in wp-config.php:
 *
 *     define('INFINITY_RESEND_API_KEY', 're_...');
 *     define('INFINITY_MAIL_FROM', 'Elliot Telford <hello@elliottelford.com>');
 *
 * A Customizer field is offered as a fallback for people who cannot
 * edit wp-config, but the constant is better: options live in the
 * database, and the database is what ends up in backups, exports and
 * staging clones.
 *
 * @package Infinity
 * @since 3.3.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * The API key, constant first. Never echo this, never log it.
 */
function infinity_resend_key() {
    if (defined('INFINITY_RESEND_API_KEY') && INFINITY_RESEND_API_KEY) {
        return (string) INFINITY_RESEND_API_KEY;
    }

    return (string) get_option('infinity_resend_api_key', '');
}

/**
 * Whether Resend is configured well enough to send.
 */
function infinity_resend_ready() {
    return '' !== infinity_resend_key();
}

/**
 * Default From. Resend will only send from a domain verified on the
 * account, so this defaults to the site's own host rather than to
 * anything clever.
 */
function infinity_mail_from() {
    if (defined('INFINITY_MAIL_FROM') && INFINITY_MAIL_FROM) {
        $from = (string) INFINITY_MAIL_FROM;
    } else {
        $from = (string) get_option('infinity_mail_from', '');
    }

    if ('' === $from) {
        $host = wp_parse_url(home_url(), PHP_URL_HOST);
        $host = preg_replace('/^www\./i', '', (string) $host);
        $from = sprintf('%s <noreply@%s>', get_bloginfo('name'), $host);
    }

    return apply_filters('infinity_mail_from', $from);
}

/**
 * Pull one header's value out of wp_mail's headers, which may arrive
 * as an array of "Key: value" strings or as one newline-joined blob.
 */
function infinity_mail_header($headers, $name) {
    if (!is_array($headers)) {
        $headers = array((string) $headers);
    }

    /*
     * wp_mail() accepts headers three ways: one newline-joined blob, an
     * array of "Key: value" strings, or an array whose elements are
     * themselves multi-line. Only the first two are obvious, and missing
     * the third loses whatever followed the first newline — a Reply-To,
     * usually. Flatten to one line per entry before matching anything.
     */
    $lines = array();
    foreach ($headers as $chunk) {
        foreach (explode("\n", str_replace("\r\n", "\n", (string) $chunk)) as $line) {
            $lines[] = $line;
        }
    }

    foreach ($lines as $line) {
        if (false === strpos($line, ':')) {
            continue;
        }
        list($key, $value) = explode(':', $line, 2);
        if (strtolower(trim($key)) === strtolower($name)) {
            return trim($value);
        }
    }

    return '';
}

/**
 * Normalise wp_mail's `to` into a list. It accepts a bare string, a
 * comma-separated string, or an array.
 */
function infinity_mail_recipients($to) {
    if (!is_array($to)) {
        $to = explode(',', (string) $to);
    }

    $out = array();
    foreach ($to as $one) {
        $one = trim((string) $one);
        if ('' !== $one) {
            $out[] = $one;
        }
    }

    return $out;
}

/**
 * Send through Resend instead of PHP mail().
 *
 * Returning null leaves WordPress to its own transport; returning a
 * bool short-circuits wp_mail() with that result. Attachments fall
 * through deliberately — the theme sends none, and quietly dropping
 * one would be worse than using the slower path that supports it.
 *
 * @param null|bool $short_circuit Non-null to bypass wp_mail().
 * @param array     $atts          to, subject, message, headers, attachments.
 * @return null|bool
 */
function infinity_resend_pre_wp_mail($short_circuit, $atts) {
    $key = infinity_resend_key();
    if ('' === $key) {
        return $short_circuit;
    }

    if (!empty($atts['attachments'])) {
        return $short_circuit;
    }

    $to = infinity_mail_recipients(isset($atts['to']) ? $atts['to'] : '');
    if (empty($to)) {
        return $short_circuit;
    }

    $headers = isset($atts['headers']) ? $atts['headers'] : array();
    $type    = strtolower(infinity_mail_header($headers, 'Content-Type'));
    $is_html = (false !== strpos($type, 'text/html'));
    $message = isset($atts['message']) ? (string) $atts['message'] : '';

    $payload = array(
        'from'    => infinity_mail_from(),
        'to'      => $to,
        'subject' => isset($atts['subject']) ? (string) $atts['subject'] : '',
    );
    $payload[$is_html ? 'html' : 'text'] = $message;

    // A plain-text alternative next to the HTML: some clients prefer it,
    // and a message with only one part scores worse with spam filters.
    if ($is_html) {
        $payload['text'] = trim(wp_strip_all_tags(str_replace(array('</p>', '<br>', '<br/>', '<br />'), "\n", $message)));
    }

    $reply_to = infinity_mail_header($headers, 'Reply-To');
    if ('' !== $reply_to) {
        $payload['reply_to'] = $reply_to;
    }

    $from_header = infinity_mail_header($headers, 'From');
    if ('' !== $from_header) {
        $payload['from'] = $from_header;
    }

    $payload = apply_filters('infinity_resend_payload', $payload, $atts);

    $response = wp_remote_post('https://api.resend.com/emails', array(
        'timeout' => 15,
        'headers' => array(
            'Authorization' => 'Bearer ' . $key,
            'Content-Type'  => 'application/json',
        ),
        'body'    => wp_json_encode($payload),
    ));

    if (is_wp_error($response)) {
        infinity_mail_record_error($response->get_error_message());
        return false;
    }

    $code = (int) wp_remote_retrieve_response_code($response);
    if ($code < 200 || $code >= 300) {
        // Resend answers failures with a JSON message. Keep it: "550
        // domain not verified" is a fixable problem and a bare 4xx is not.
        $body    = json_decode(wp_remote_retrieve_body($response), true);
        $detail  = is_array($body) && isset($body['message']) ? (string) $body['message'] : '';
        infinity_mail_record_error(sprintf('HTTP %d %s', $code, $detail));
        return false;
    }

    delete_option('infinity_mail_last_error');

    return true;
}
add_filter('pre_wp_mail', 'infinity_resend_pre_wp_mail', 10, 2);

/**
 * Remember why the last send failed, so a silent mail failure has
 * somewhere to be seen. Stores the reason only — never the key, which
 * is not in any of these strings and must not be.
 */
function infinity_mail_record_error($reason) {
    update_option('infinity_mail_last_error', array(
        'reason' => substr((string) $reason, 0, 300),
        'when'   => time(),
    ), false);

    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('[infinity] Resend send failed: ' . $reason);
    }
}

/**
 * Send a test email to whoever is asking.
 *
 * The signup flow is a poor way to test a mail transport: with confirmed
 * opt-in the first message is a confirmation rather than a welcome, an
 * address that is already subscribed is deliberately sent nothing at
 * all, and neither of those looks any different from a broken API key.
 * This exercises the transport on its own and reports what happened.
 */
function infinity_mail_send_test() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You are not allowed to do that.', 'infinity'));
    }
    check_admin_referer('infinity_mail_test');

    $user = wp_get_current_user();
    $to   = $user ? $user->user_email : '';

    if (!is_email($to)) {
        $result = 'noaddress';
    } else {
        delete_option('infinity_mail_last_error');

        $sent = wp_mail(
            $to,
            sprintf(__('[%s] Mail test', 'infinity'), get_bloginfo('name')),
            '<p>' . esc_html__('If you are reading this, subscriber email is working.', 'infinity') . '</p>'
                . '<p style="color:#666;font-size:13px;">' . esc_html(sprintf(
                    /* translators: %s: the From address messages are sent as. */
                    __('Sent as %s.', 'infinity'),
                    infinity_mail_from()
                )) . '</p>',
            array('Content-Type: text/html; charset=UTF-8')
        );

        $result = $sent ? 'sent' : 'failed';
    }

    wp_safe_redirect(add_query_arg(
        'infinity_mail_test',
        $result,
        admin_url('edit.php?post_type=inf_subscriber')
    ));
    exit;
}
add_action('admin_post_infinity_mail_test', 'infinity_mail_send_test');

/**
 * Surface mail trouble where the subscriber list is, which is the one
 * screen where someone is already thinking about email.
 */
function infinity_mail_admin_notice() {
    $screen = function_exists('get_current_screen') ? get_current_screen() : null;
    if (!$screen || 'inf_subscriber' !== $screen->post_type) {
        return;
    }
    if (!current_user_can('manage_options')) {
        return;
    }

    $result = isset($_GET['infinity_mail_test']) ? sanitize_key(wp_unslash($_GET['infinity_mail_test'])) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

    if ('sent' === $result) {
        printf(
            '<div class="notice notice-success"><p><strong>%s</strong> %s</p></div>',
            esc_html__('Test email sent.', 'infinity'),
            esc_html(sprintf(
                /* translators: %s: the admin's own email address. */
                __('Resend accepted it for %s. If it does not arrive, the delivery status is in Resend under Logs.', 'infinity'),
                wp_get_current_user()->user_email
            ))
        );
    } elseif ('failed' === $result) {
        $why = get_option('infinity_mail_last_error');
        printf(
            '<div class="notice notice-error"><p><strong>%s</strong> %s</p></div>',
            esc_html__('Test email failed.', 'infinity'),
            esc_html(is_array($why) && !empty($why['reason']) ? $why['reason'] : __('No reason was recorded.', 'infinity'))
        );
    } elseif ('noaddress' === $result) {
        printf(
            '<div class="notice notice-error"><p>%s</p></div>',
            esc_html__('Your user account has no valid email address to send a test to.', 'infinity')
        );
    }

    if (infinity_resend_ready()) {
        printf(
            '<div class="notice notice-info"><p>%s <a class="button button-secondary" href="%s">%s</a></p></div>',
            esc_html(sprintf(
                /* translators: %s: the From address messages are sent as. */
                __('Subscriber email is sent through Resend as %s.', 'infinity'),
                infinity_mail_from()
            )),
            esc_url(wp_nonce_url(admin_url('admin-post.php?action=infinity_mail_test'), 'infinity_mail_test')),
            esc_html__('Send me a test email', 'infinity')
        );
    }

    if (!infinity_resend_ready()) {
        printf(
            '<div class="notice notice-warning"><p><strong>%s</strong> %s <code>%s</code></p></div>',
            esc_html__('Subscriber email is not configured.', 'infinity'),
            esc_html__('Welcome and new-post emails are going out through PHP mail, which usually lands in spam. Add your Resend API key to wp-config.php:', 'infinity'),
            "define('INFINITY_RESEND_API_KEY', 're_...');"
        );
        return;
    }

    $error = get_option('infinity_mail_last_error');
    if (is_array($error) && !empty($error['reason'])) {
        printf(
            '<div class="notice notice-error"><p><strong>%s</strong> %s</p></div>',
            esc_html__('The last email failed to send.', 'infinity'),
            esc_html($error['reason'])
        );
    }
}
add_action('admin_notices', 'infinity_mail_admin_notice');
