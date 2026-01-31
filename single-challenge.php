<?php
/**
 * Single Challenge Template
 *
 * Displays gamification challenges for users to complete.
 *
 * @package Infinity
 * @since 1.0.0
 */

get_header();
?>

<article id="post-<?php the_ID(); ?>" <?php post_class('challenge-single'); ?>>
    <?php
    // Get challenge metadata
    $start_date = get_post_meta(get_the_ID(), 'challenge_start_date', true);
    $end_date = get_post_meta(get_the_ID(), 'challenge_end_date', true);
    $completion_count = get_post_meta(get_the_ID(), 'completion_count', true) ?: 0;
    $attempt_count = get_post_meta(get_the_ID(), 'attempt_count', true) ?: 0;
    $success_criteria = get_post_meta(get_the_ID(), 'success_criteria', true);
    $base_simulation = get_post_meta(get_the_ID(), 'base_simulation', true);

    // Determine challenge status
    $now = current_time('timestamp');
    $status = 'active';
    if ($start_date && strtotime($start_date) > $now) {
        $status = 'upcoming';
    } elseif ($end_date && strtotime($end_date) < $now) {
        $status = 'ended';
    }

    $status_labels = array(
        'active'   => __('Active Now', 'infinity'),
        'upcoming' => __('Coming Soon', 'infinity'),
        'ended'    => __('Challenge Ended', 'infinity'),
    );
    ?>

    <header class="entry-header">
        <div class="container">
            <div class="challenge-badge-row">
                <span class="challenge-status <?php echo esc_attr($status); ?>">
                    <?php echo esc_html($status_labels[$status]); ?>
                </span>

                <?php
                $difficulty = get_the_terms(get_the_ID(), 'difficulty_level');
                if ($difficulty && !is_wp_error($difficulty)) :
                ?>
                    <span class="difficulty-badge"><?php echo esc_html($difficulty[0]->name); ?></span>
                <?php endif; ?>
            </div>

            <?php the_title('<h1 class="entry-title">', '</h1>'); ?>

            <?php if ($start_date || $end_date) : ?>
                <div class="challenge-dates">
                    <?php if ($start_date) : ?>
                        <span class="date-item">
                            <strong><?php esc_html_e('Starts:', 'infinity'); ?></strong>
                            <?php echo esc_html(date_i18n(get_option('date_format'), strtotime($start_date))); ?>
                        </span>
                    <?php endif; ?>
                    <?php if ($end_date) : ?>
                        <span class="date-item">
                            <strong><?php esc_html_e('Ends:', 'infinity'); ?></strong>
                            <?php echo esc_html(date_i18n(get_option('date_format'), strtotime($end_date))); ?>
                        </span>
                    <?php endif; ?>
                </div>
            <?php endif; ?>

            <div class="challenge-stats">
                <div class="stat-card">
                    <span class="stat-value"><?php echo esc_html(number_format_i18n($completion_count)); ?></span>
                    <span class="stat-label"><?php esc_html_e('Completions', 'infinity'); ?></span>
                </div>
                <div class="stat-card">
                    <span class="stat-value"><?php echo esc_html(number_format_i18n($attempt_count)); ?></span>
                    <span class="stat-label"><?php esc_html_e('Attempts', 'infinity'); ?></span>
                </div>
                <?php if ($attempt_count > 0) : ?>
                    <div class="stat-card">
                        <span class="stat-value"><?php echo esc_html(round(($completion_count / $attempt_count) * 100, 1)); ?>%</span>
                        <span class="stat-label"><?php esc_html_e('Success Rate', 'infinity'); ?></span>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </header>

    <?php if (has_post_thumbnail()) : ?>
        <div class="challenge-hero">
            <?php the_post_thumbnail('simulation-hero'); ?>
        </div>
    <?php endif; ?>

    <div class="challenge-content container">
        <div class="challenge-main">
            <section class="challenge-description">
                <h2><?php esc_html_e('Challenge Description', 'infinity'); ?></h2>
                <div class="entry-content">
                    <?php the_content(); ?>
                </div>
            </section>

            <?php if ($success_criteria) : ?>
                <section class="challenge-criteria">
                    <h2><?php esc_html_e('Success Criteria', 'infinity'); ?></h2>
                    <div class="criteria-content">
                        <?php
                        $criteria = json_decode($success_criteria, true);
                        if (is_array($criteria)) :
                        ?>
                            <ul class="criteria-list">
                                <?php foreach ($criteria as $criterion) : ?>
                                    <li>
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
                                            <path d="M6 10L9 13L14 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <span><?php echo esc_html($criterion); ?></span>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php else : ?>
                            <p><?php echo esc_html($success_criteria); ?></p>
                        <?php endif; ?>
                    </div>
                </section>
            <?php endif; ?>

            <?php if ($base_simulation) :
                $sim_post = get_post($base_simulation);
                if ($sim_post) :
            ?>
                <section class="challenge-simulation">
                    <h2><?php esc_html_e('Challenge Simulation', 'infinity'); ?></h2>
                    <a href="<?php echo esc_url(get_permalink($base_simulation)); ?>" class="simulation-link">
                        <?php if (has_post_thumbnail($base_simulation)) : ?>
                            <?php echo get_the_post_thumbnail($base_simulation, 'simulation-thumbnail'); ?>
                        <?php endif; ?>
                        <div class="simulation-link-content">
                            <span class="simulation-link-title"><?php echo esc_html($sim_post->post_title); ?></span>
                            <span class="simulation-link-cta"><?php esc_html_e('Open Simulation', 'infinity'); ?> &rarr;</span>
                        </div>
                    </a>
                </section>
            <?php
                endif;
            endif;
            ?>
        </div>

        <aside class="challenge-sidebar">
            <div class="sidebar-card">
                <h3><?php esc_html_e('Take the Challenge', 'infinity'); ?></h3>

                <?php if ($status === 'active') : ?>
                    <?php if (is_user_logged_in()) : ?>
                        <button type="button" class="btn btn-primary btn-full" id="start-challenge" data-challenge-id="<?php the_ID(); ?>">
                            <?php esc_html_e('Start Challenge', 'infinity'); ?>
                        </button>
                        <?php
                        // Check if user has already completed
                        $user_id = get_current_user_id();
                        $completions = get_user_meta($user_id, 'challenge_completions', true) ?: array();
                        if (in_array(get_the_ID(), $completions)) :
                        ?>
                            <p class="completion-notice">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <circle cx="10" cy="10" r="8" fill="var(--color-success)"/>
                                    <path d="M6 10L9 13L14 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <?php esc_html_e('You\'ve completed this challenge!', 'infinity'); ?>
                            </p>
                        <?php endif; ?>
                    <?php else : ?>
                        <p class="login-prompt">
                            <a href="<?php echo esc_url(wp_login_url(get_permalink())); ?>" class="btn btn-primary btn-full">
                                <?php esc_html_e('Log in to Participate', 'infinity'); ?>
                            </a>
                        </p>
                    <?php endif; ?>
                <?php elseif ($status === 'upcoming') : ?>
                    <p class="status-message"><?php esc_html_e('This challenge hasn\'t started yet. Check back soon!', 'infinity'); ?></p>
                <?php else : ?>
                    <p class="status-message"><?php esc_html_e('This challenge has ended. Stay tuned for new challenges!', 'infinity'); ?></p>
                <?php endif; ?>
            </div>

            <?php
            // Show leaderboard if available
            $leaderboard = get_post_meta(get_the_ID(), 'leaderboard', true);
            if ($leaderboard && is_array($leaderboard)) :
            ?>
                <div class="sidebar-card">
                    <h3><?php esc_html_e('Leaderboard', 'infinity'); ?></h3>
                    <ol class="leaderboard-list">
                        <?php
                        $rank = 1;
                        foreach (array_slice($leaderboard, 0, 5) as $entry) :
                            $user = get_userdata($entry['user_id']);
                            if (!$user) continue;
                        ?>
                            <li class="leaderboard-entry">
                                <span class="rank"><?php echo esc_html($rank); ?></span>
                                <?php echo get_avatar($entry['user_id'], 32); ?>
                                <span class="username"><?php echo esc_html($user->display_name); ?></span>
                                <?php if (isset($entry['time'])) : ?>
                                    <span class="time"><?php echo esc_html($entry['time']); ?>s</span>
                                <?php endif; ?>
                            </li>
                        <?php
                            $rank++;
                        endforeach;
                        ?>
                    </ol>
                </div>
            <?php endif; ?>
        </aside>
    </div>

    <footer class="entry-footer container">
        <?php
        // Related challenges
        $related_challenges = new WP_Query(array(
            'post_type'      => 'challenge',
            'posts_per_page' => 3,
            'post__not_in'   => array(get_the_ID()),
            'meta_query'     => array(
                'relation' => 'OR',
                array(
                    'key'     => 'challenge_end_date',
                    'value'   => date('Y-m-d'),
                    'compare' => '>=',
                    'type'    => 'DATE',
                ),
                array(
                    'key'     => 'challenge_end_date',
                    'compare' => 'NOT EXISTS',
                ),
            ),
        ));

        if ($related_challenges->have_posts()) :
        ?>
            <div class="related-challenges">
                <h2><?php esc_html_e('More Challenges', 'infinity'); ?></h2>
                <div class="challenges-grid">
                    <?php
                    while ($related_challenges->have_posts()) :
                        $related_challenges->the_post();
                    ?>
                        <a href="<?php the_permalink(); ?>" class="challenge-card">
                            <?php if (has_post_thumbnail()) : ?>
                                <?php the_post_thumbnail('simulation-thumbnail'); ?>
                            <?php endif; ?>
                            <div class="challenge-card-content">
                                <span class="challenge-card-title"><?php the_title(); ?></span>
                                <?php
                                $card_completions = get_post_meta(get_the_ID(), 'completion_count', true) ?: 0;
                                ?>
                                <span class="challenge-card-meta">
                                    <?php printf(esc_html__('%s completions', 'infinity'), number_format_i18n($card_completions)); ?>
                                </span>
                            </div>
                        </a>
                    <?php endwhile; ?>
                </div>
            </div>
        <?php
            wp_reset_postdata();
        endif;
        ?>
    </footer>
</article>

<style>
.challenge-single {
    padding-bottom: var(--spacing-2xl);
}

.entry-header {
    text-align: center;
    padding: var(--spacing-2xl) 0;
    background: linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 100%);
}

.challenge-badge-row {
    display: flex;
    justify-content: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
}

.challenge-status {
    display: inline-block;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    text-transform: uppercase;
    border-radius: var(--radius-full);
}

.challenge-status.active {
    background: var(--color-success);
    color: white;
    animation: pulse 2s infinite;
}

.challenge-status.upcoming {
    background: var(--color-accent-tertiary);
    color: white;
}

.challenge-status.ended {
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.difficulty-badge {
    display: inline-block;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    border-radius: var(--radius-full);
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
}

.entry-title {
    font-size: var(--font-size-5xl);
    margin-bottom: var(--spacing-md);
}

.challenge-dates {
    display: flex;
    justify-content: center;
    gap: var(--spacing-xl);
    margin-bottom: var(--spacing-lg);
    color: var(--color-text-secondary);
    flex-wrap: wrap;
}

.date-item strong {
    color: var(--color-text-primary);
}

.challenge-stats {
    display: flex;
    justify-content: center;
    gap: var(--spacing-lg);
    flex-wrap: wrap;
}

.stat-card {
    background: var(--color-bg-primary);
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    text-align: center;
    min-width: 120px;
}

.stat-value {
    display: block;
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--color-accent-primary);
}

.stat-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
}

.challenge-hero {
    margin: 0 auto;
    max-width: 1200px;
}

.challenge-hero img {
    width: 100%;
    height: auto;
    max-height: 400px;
    object-fit: cover;
}

.challenge-content {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: var(--spacing-2xl);
    margin-top: var(--spacing-2xl);
}

.challenge-main section {
    margin-bottom: var(--spacing-2xl);
}

.challenge-main h2 {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-sm);
    border-bottom: 2px solid var(--color-bg-tertiary);
}

.criteria-list {
    list-style: none;
}

.criteria-list li {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-sm);
}

.criteria-list svg {
    flex-shrink: 0;
    color: var(--color-success);
}

.simulation-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-lg);
    overflow: hidden;
    text-decoration: none;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.simulation-link:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.simulation-link img {
    width: 200px;
    height: 150px;
    object-fit: cover;
}

.simulation-link-content {
    padding: var(--spacing-lg);
}

.simulation-link-title {
    display: block;
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);
}

.simulation-link-cta {
    color: var(--color-accent-primary);
    font-weight: 500;
}

.challenge-sidebar {
    position: sticky;
    top: var(--spacing-lg);
    height: fit-content;
}

.sidebar-card {
    background: var(--color-bg-secondary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}

.sidebar-card h3 {
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-md);
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-xl);
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: var(--font-size-base);
    font-family: var(--font-family-primary);
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.btn-full {
    width: 100%;
}

.btn-primary {
    background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary));
    color: white;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-glow);
}

.completion-notice {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-md);
    padding: var(--spacing-md);
    background: rgba(16, 185, 129, 0.1);
    border-radius: var(--radius-md);
    color: var(--color-success);
    font-size: var(--font-size-sm);
}

.status-message {
    text-align: center;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
}

.leaderboard-list {
    list-style: none;
    counter-reset: none;
}

.leaderboard-entry {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--color-bg-tertiary);
}

.leaderboard-entry:last-child {
    border-bottom: none;
}

.leaderboard-entry .rank {
    font-weight: 700;
    width: 24px;
    color: var(--color-accent-primary);
}

.leaderboard-entry img {
    border-radius: var(--radius-full);
}

.leaderboard-entry .username {
    flex: 1;
    font-weight: 500;
}

.leaderboard-entry .time {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    font-family: var(--font-family-mono);
}

.entry-footer {
    margin-top: var(--spacing-2xl);
    padding-top: var(--spacing-2xl);
    border-top: 1px solid var(--color-bg-tertiary);
}

.related-challenges h2 {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--spacing-lg);
    text-align: center;
}

.challenges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-lg);
}

.challenge-card {
    display: block;
    background: var(--color-bg-secondary);
    border-radius: var(--radius-lg);
    overflow: hidden;
    text-decoration: none;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.challenge-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
}

.challenge-card img {
    width: 100%;
    height: 150px;
    object-fit: cover;
}

.challenge-card-content {
    padding: var(--spacing-lg);
}

.challenge-card-title {
    display: block;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-xs);
}

.challenge-card-meta {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
}

@media (max-width: 900px) {
    .challenge-content {
        grid-template-columns: 1fr;
    }

    .challenge-sidebar {
        position: static;
    }
}

@media (max-width: 640px) {
    .simulation-link {
        flex-direction: column;
    }

    .simulation-link img {
        width: 100%;
        height: 200px;
    }
}
</style>

<?php
if (comments_open() || get_comments_number()) {
    comments_template();
}

get_footer();
