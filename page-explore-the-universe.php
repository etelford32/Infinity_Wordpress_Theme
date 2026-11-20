<?php
/**
 * Template Name: Explore the Universe 2175 Hub
 *
 * The Explore the Universe 2175 hub on elliottelford.com: the pitch,
 * the trailer, the adaptive AI, the physics underneath, the soundtrack,
 * the two ways in (Steam wishlist, pilot account), share links, devlog
 * posts and an FAQ. Used automatically by a page with the slug
 * "explore-the-universe". Helpers live in inc/etu-hub.php; the layout
 * reuses the Parker's Physics hub's section styles (pph-*).
 *
 * @package Infinity
 * @since 3.22.0
 */

get_header();

$infinity_urls   = infinity_property_urls();
$infinity_etu    = trailingslashit($infinity_urls['etu']);
$infinity_pp     = trailingslashit($infinity_urls['parkers']);
$infinity_art    = infinity_etu_hub_art();
$infinity_video  = infinity_etu_video_url();
$infinity_app    = infinity_steam_app_id();
$infinity_music  = infinity_etu_music_url();
$infinity_sc     = get_option('infinity_soundcloud_url', 'https://soundcloud.com/elliottelford');

/** Outbound link to the game's site, GA4/UTM-tagged. */
$infinity_etu_link = function ($path, $placement, $cta) use ($infinity_etu) {
    return infinity_project_href($infinity_etu . ltrim($path, '/'), $placement, $cta);
};
?>

<article id="post-<?php the_ID(); ?>" <?php post_class('pph etuh'); ?>>
    <?php while (have_posts()) : the_post(); ?>

    <!-- ================= Hero ================= -->
    <header class="pph-hero etuh-hero" data-project-block="etu" data-placement="etu_hub_hero">
        <div class="etuh-stars" aria-hidden="true"></div>
        <div class="container pph-hero-inner">
            <div class="pph-hero-copy">
                <p class="pph-kicker">
                    <?php infinity_brand_mark('etu', 22); ?>
                    <span><?php esc_html_e('A 2D space sci-fi game · Wishlist open on Steam', 'infinity'); ?></span>
                </p>
                <?php the_title('<h1 class="pph-title etuh-title">', '</h1>'); ?>
                <p class="pph-lede">
                    <?php esc_html_e('The year is 2175 and the frontier is open. Command your own ship in a living galaxy built on real orbital mechanics, against ships, factions and pirates that learn how you fly and adapt to beat you.', 'infinity'); ?>
                </p>
                <div class="pph-actions etuh-actions">
                    <?php infinity_etu_wishlist_cta(array('campaign' => 'etu_hub_hero')); ?>
                    <a class="fp-btn-secondary fp-btn-big" href="<?php echo esc_url($infinity_etu_link('', 'etu_hub_hero', 'pilot_signup')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('etu', 'etu_hub_hero', 'pilot_signup'); ?>>
                        <?php esc_html_e('Join the first wave of pilots', 'infinity'); ?> &rarr;
                    </a>
                </div>
                <p class="etuh-hero-note"><?php esc_html_e('Wishlisting is free and takes one click. It is the single biggest thing you can do to help an independent game launch.', 'infinity'); ?></p>
            </div>

            <div class="etuh-viewport">
                <span class="etuh-corner etuh-corner-tl" aria-hidden="true"></span>
                <span class="etuh-corner etuh-corner-tr" aria-hidden="true"></span>
                <span class="etuh-corner etuh-corner-bl" aria-hidden="true"></span>
                <span class="etuh-corner etuh-corner-br" aria-hidden="true"></span>
                <?php if ($infinity_video) : ?>
                    <video class="etuh-media" muted loop playsinline preload="none" poster="<?php echo esc_url($infinity_art); ?>" data-etuh-autoplay aria-label="<?php esc_attr_e('Explore the Universe 2175 teaser video', 'infinity'); ?>">
                        <source src="<?php echo esc_url($infinity_video); ?>" type="video/mp4">
                    </video>
                    <button type="button" class="etuh-video-toggle" hidden aria-pressed="false" data-play="<?php esc_attr_e('Play teaser', 'infinity'); ?>"><?php esc_html_e('Pause teaser', 'infinity'); ?></button>
                <?php else : ?>
                    <img class="etuh-media" src="<?php echo esc_url($infinity_art); ?>" alt="<?php esc_attr_e('Explore the Universe 2175 key art', 'infinity'); ?>" fetchpriority="high" decoding="async">
                <?php endif; ?>
                <span class="etuh-hud" aria-hidden="true">YEAR 2175 · SECTOR OPEN · SIGNAL LIVE</span>
            </div>
        </div>

        <div class="container">
            <ul class="etuh-specs" aria-label="<?php esc_attr_e('At a glance', 'infinity'); ?>">
                <li><span class="etuh-spec-k"><?php esc_html_e('Setting', 'infinity'); ?></span><span class="etuh-spec-v"><?php esc_html_e('The frontier, 2175', 'infinity'); ?></span></li>
                <li><span class="etuh-spec-k"><?php esc_html_e('Genre', 'infinity'); ?></span><span class="etuh-spec-v"><?php esc_html_e('2D space sci-fi', 'infinity'); ?></span></li>
                <li><span class="etuh-spec-k"><?php esc_html_e('Opponents', 'infinity'); ?></span><span class="etuh-spec-v"><?php esc_html_e('Machine-learning AI', 'infinity'); ?></span></li>
                <li><span class="etuh-spec-k"><?php esc_html_e('Physics', 'infinity'); ?></span><span class="etuh-spec-v"><?php esc_html_e('Real orbital mechanics', 'infinity'); ?></span></li>
                <li><span class="etuh-spec-k"><?php esc_html_e('Platform', 'infinity'); ?></span><span class="etuh-spec-v"><?php esc_html_e('PC, on Steam', 'infinity'); ?></span></li>
            </ul>
        </div>
    </header>

    <div class="container pph-body">

        <?php if (trim(get_the_content())) : ?>
            <div class="entry-content pph-intro">
                <?php the_content(); ?>
            </div>
        <?php endif; ?>

        <!-- ================= The pitch ================= -->
        <section class="pph-section" aria-labelledby="etuh-pitch-heading">
            <p class="pph-section-kicker"><?php esc_html_e('The game', 'infinity'); ?></p>
            <h2 class="pph-section-title" id="etuh-pitch-heading"><?php esc_html_e('A galaxy that plays back', 'infinity'); ?></h2>
            <p class="pph-section-intro"><?php esc_html_e('Most space games give you a map and scripted enemies. This one gives you real gravity and opponents that study you.', 'infinity'); ?></p>
            <div class="pph-principles etuh-features">
                <?php foreach (infinity_etu_hub_features() as $f) : ?>
                    <div class="pph-principle">
                        <span class="pph-principle-icon" aria-hidden="true"><?php infinity_icon($f[0], 26); ?></span>
                        <h3><?php echo esc_html($f[1]); ?></h3>
                        <p><?php echo esc_html($f[2]); ?></p>
                    </div>
                <?php endforeach; ?>
            </div>
        </section>

        <!-- ================= Adaptive AI ================= -->
        <section class="pph-section etuh-ai" aria-labelledby="etuh-ai-heading">
            <div class="etuh-split">
                <div>
                    <p class="pph-section-kicker"><?php esc_html_e('Adaptive AI', 'infinity'); ?></p>
                    <h2 class="pph-section-title" id="etuh-ai-heading"><?php esc_html_e('The pirates are taking notes', 'infinity'); ?></h2>
                    <p class="pph-section-intro"><?php esc_html_e('Every encounter is training data. The ships you fight learn your habits: the angle you attack from, when you run, which bait you take. Then they change their tactics to counter you. Win the same way twice and the galaxy notices.', 'infinity'); ?></p>
                    <ol class="etuh-loop-steps">
                        <li><strong><?php esc_html_e('You fly.', 'infinity'); ?></strong> <?php esc_html_e('Your choices in a fight, a chase or a trade run.', 'infinity'); ?></li>
                        <li><strong><?php esc_html_e('They watch.', 'infinity'); ?></strong> <?php esc_html_e('Ships, factions and pirates pick up your patterns.', 'infinity'); ?></li>
                        <li><strong><?php esc_html_e('They adapt.', 'infinity'); ?></strong> <?php esc_html_e('New tactics aimed at the way you play.', 'infinity'); ?></li>
                        <li><strong><?php esc_html_e('You adapt back.', 'infinity'); ?></strong> <?php esc_html_e('No fixed difficulty curve. An arms race with a mind of its own.', 'infinity'); ?></li>
                    </ol>
                </div>
                <figure class="etuh-loop" aria-hidden="true">
                    <svg viewBox="-70 0 460 320" width="460" height="320" focusable="false">
                        <defs>
                            <linearGradient id="etuh-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#e879f9"/></linearGradient>
                            <marker id="etuh-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#22d3ee"/></marker>
                        </defs>
                        <circle cx="160" cy="160" r="112" fill="none" stroke="url(#etuh-g)" stroke-width="2" stroke-dasharray="6 8" class="etuh-orbit"/>
                        <path d="M160 48 A112 112 0 0 1 272 160" fill="none" stroke="#22d3ee" stroke-width="2.4" marker-end="url(#etuh-arrow)"/>
                        <path d="M272 160 A112 112 0 0 1 160 272" fill="none" stroke="#818cf8" stroke-width="2.4" marker-end="url(#etuh-arrow)"/>
                        <path d="M160 272 A112 112 0 0 1 48 160" fill="none" stroke="#c084fc" stroke-width="2.4" marker-end="url(#etuh-arrow)"/>
                        <path d="M48 160 A112 112 0 0 1 160 48" fill="none" stroke="#e879f9" stroke-width="2.4" marker-end="url(#etuh-arrow)"/>
                        <g class="etuh-loop-labels" font-size="13" font-weight="700" text-anchor="middle">
                            <text x="160" y="30">YOU FLY</text>
                            <text x="284" y="164" text-anchor="start">THEY WATCH</text>
                            <text x="160" y="302">THEY ADAPT</text>
                            <text x="36" y="164" text-anchor="end">YOU ADAPT</text>
                        </g>
                        <circle cx="160" cy="160" r="34" fill="none" stroke="url(#etuh-g)" stroke-width="2"/>
                        <text x="160" y="166" text-anchor="middle" font-size="16" font-weight="800" class="etuh-loop-core">2175</text>
                    </svg>
                </figure>
            </div>
        </section>

        <!-- ================= Physics / Parker's Physics ================= -->
        <section class="pph-section etuh-physics" aria-labelledby="etuh-physics-heading" data-project="parkers" data-placement="etu_hub_physics">
            <p class="pph-section-kicker"><?php esc_html_e('Under the hood', 'infinity'); ?></p>
            <h2 class="pph-section-title" id="etuh-physics-heading"><?php esc_html_e('Gravity you can feel', 'infinity'); ?></h2>
            <p class="pph-section-intro"><?php esc_html_e('The game is built by a computational astrophysicist, on the same orbital mechanics that power Parker\'s Physics. Want a taste before launch? These run in your browser today.', 'infinity'); ?></p>
            <div class="pph-audiences">
                <?php
                $infinity_tries = array(
                    array('ship', __('Space Ship Designer', 'infinity'), __('Assemble a rocket stage by stage and fly it to orbit in 3D.', 'infinity'), 'spaceship-designer.html', 'try_ship_designer'),
                    array('orbit', __('Solar System', 'infinity'), __('31 moons and a live Galilean N-body integration.', 'infinity'), 'solar-system.html', 'try_solar_system'),
                );
                foreach ($infinity_tries as $t) :
                    ?>
                    <a class="pph-audience" href="<?php echo esc_url(infinity_project_href($infinity_pp . $t[3], 'etu_hub_physics', $t[4])); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('parkers', 'etu_hub_physics', $t[4]); ?>>
                        <span class="pph-principle-icon" aria-hidden="true"><?php infinity_icon($t[0], 24); ?></span>
                        <span class="pph-audience-title"><?php echo esc_html($t[1]); ?></span>
                        <span class="pph-audience-text"><?php echo esc_html($t[2]); ?></span>
                        <span class="pph-audience-cta"><?php esc_html_e('Open it', 'infinity'); ?> <span aria-hidden="true">&rarr;</span></span>
                    </a>
                <?php endforeach; ?>
                <?php $infinity_pph = function_exists('infinity_parkers_hub_url') ? infinity_parkers_hub_url() : ''; ?>
                <a class="pph-audience" href="<?php echo esc_url($infinity_pph ?: infinity_project_href($infinity_pp, 'etu_hub_physics', 'parkers_home')); ?>"<?php echo $infinity_pph ? '' : ' target="_blank" rel="noopener"'; ?><?php infinity_project_attrs('parkers', 'etu_hub_physics', 'parkers_hub'); ?>>
                    <?php infinity_brand_mark('parkers', 28); ?>
                    <span class="pph-audience-title"><?php esc_html_e('Every simulation', 'infinity'); ?></span>
                    <span class="pph-audience-text"><?php esc_html_e('Space weather, orbits, the solar system and deep space, all free on Parker\'s Physics.', 'infinity'); ?></span>
                    <span class="pph-audience-cta"><?php esc_html_e('Browse the hub', 'infinity'); ?> <span aria-hidden="true">&rarr;</span></span>
                </a>
            </div>
        </section>

        <!-- ================= Soundtrack ================= -->
        <section class="pph-section etuh-ost" aria-labelledby="etuh-ost-heading">
            <div class="etuh-ost-inner">
                <span class="etuh-ost-disc" aria-hidden="true"><?php infinity_icon('music', 40); ?></span>
                <div>
                    <p class="pph-section-kicker"><?php echo esc_html(get_option('infinity_album_status', __('Coming soon', 'infinity'))); ?> · <?php esc_html_e('Original soundtrack', 'infinity'); ?></p>
                    <h2 class="pph-section-title" id="etuh-ost-heading"><?php esc_html_e('Hear the galaxy before you fly it', 'infinity'); ?></h2>
                    <p class="pph-section-intro"><?php echo esc_html(get_option('infinity_album_blurb', __('The score for the game: orbital ambience, battle themes and the sound of a living galaxy, written in Ableton alongside the build. Follow on SoundCloud to hear the tracks as they come out of the studio.', 'infinity'))); ?></p>
                    <div class="pph-actions">
                        <?php if ($infinity_music) : ?>
                            <a class="fp-btn-primary" href="<?php echo esc_url($infinity_music); ?>"><?php esc_html_e('Listen on the music page', 'infinity'); ?> &rarr;</a>
                        <?php endif; ?>
                        <?php if ($infinity_sc) : ?>
                            <a class="fp-btn-secondary" href="<?php echo esc_url($infinity_sc); ?>" target="_blank" rel="noopener" data-project="music" data-placement="etu_hub_ost" data-cta="soundcloud"><?php esc_html_e('Follow on SoundCloud', 'infinity'); ?></a>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </section>

        <!-- ================= Two ways in ================= -->
        <section class="pph-section" id="etuh-join" aria-labelledby="etuh-join-heading" data-project="etu" data-placement="etu_hub_join">
            <p class="pph-section-kicker"><?php esc_html_e('Get on board', 'infinity'); ?></p>
            <h2 class="pph-section-title" id="etuh-join-heading"><?php esc_html_e('Two ways in. Do both.', 'infinity'); ?></h2>
            <div class="etuh-ways">
                <div class="etuh-way etuh-way-steam">
                    <p class="etuh-way-step">01</p>
                    <h3><?php esc_html_e('Wishlist on Steam', 'infinity'); ?></h3>
                    <p><?php esc_html_e('Steam emails you the day it launches, and every wishlist pushes the game up Steam\'s discovery queue for everyone else.', 'infinity'); ?></p>
                    <?php if ($infinity_app) : ?>
                        <div class="steam-fit etuh-steam" data-basewidth="646" data-baseheight="190">
                            <iframe class="hero-steam-frame" src="<?php echo esc_url('https://store.steampowered.com/widget/' . $infinity_app . '/?utm_source=elliottelford.com&utm_medium=hub_widget&utm_campaign=etu_hub'); ?>" title="<?php esc_attr_e('Explore the Universe 2175 on Steam', 'infinity'); ?>" loading="lazy"></iframe>
                        </div>
                    <?php endif; ?>
                    <?php infinity_etu_wishlist_cta(array('size' => 'md', 'campaign' => 'etu_hub_join')); ?>
                </div>
                <div class="etuh-way etuh-way-site">
                    <p class="etuh-way-step">02</p>
                    <h3><?php esc_html_e('Create a pilot account', 'infinity'); ?></h3>
                    <p><?php esc_html_e('A free account on ExploreTheUniverse2175.com puts you in the first wave of pilots: development news, early looks and a say in what ships next.', 'infinity'); ?></p>
                    <ul class="etuh-checks">
                        <li><?php esc_html_e('Devlog updates as features land', 'infinity'); ?></li>
                        <li><?php esc_html_e('First word on playtests', 'infinity'); ?></li>
                        <li><?php esc_html_e('Free, and it takes a minute', 'infinity'); ?></li>
                    </ul>
                    <a class="fp-btn-primary fp-btn-big" href="<?php echo esc_url($infinity_etu_link('', 'etu_hub_join', 'pilot_signup')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('etu', 'etu_hub_join', 'pilot_signup'); ?>>
                        <?php esc_html_e('Go to ExploreTheUniverse2175.com', 'infinity'); ?> &rarr;
                    </a>
                </div>
            </div>
        </section>

        <!-- ================= Spread the word ================= -->
        <section class="pph-section etuh-share" aria-labelledby="etuh-share-heading">
            <p class="pph-section-kicker"><?php esc_html_e('Signal boost', 'infinity'); ?></p>
            <h2 class="pph-section-title" id="etuh-share-heading"><?php esc_html_e('Know a pilot? Send them the coordinates.', 'infinity'); ?></h2>
            <p class="pph-section-intro"><?php esc_html_e('Independent games launch on word of mouth. One share to a friend who loves space games is worth more than any ad.', 'infinity'); ?></p>
            <div class="etuh-share-row">
                <?php
                $infinity_share_text = __('Explore the Universe 2175: a 2D space sci-fi game with real orbital mechanics and AI that learns how you fly. Wishlist it on Steam.', 'infinity');
                foreach (infinity_etu_share_links(get_permalink(), $infinity_share_text) as $infinity_net => $infinity_s) :
                    ?>
                    <a class="pph-chip etuh-share-btn" href="<?php echo esc_url($infinity_s[1]); ?>" target="_blank" rel="noopener" data-project="etu" data-placement="etu_hub_share" data-cta="<?php echo esc_attr('share_' . $infinity_net); ?>"><?php echo esc_html($infinity_s[0]); ?></a>
                <?php endforeach; ?>
                <button type="button" class="pph-chip etuh-copy" data-url="<?php echo esc_url(get_permalink()); ?>" data-project="etu" data-placement="etu_hub_share" data-cta="share_copy" hidden><?php esc_html_e('Copy link', 'infinity'); ?></button>
                <span class="etuh-copy-status" aria-live="polite"></span>
            </div>
        </section>

        <!-- ================= Devlog ================= -->
        <?php $infinity_posts = infinity_etu_articles(6); ?>
        <?php if ($infinity_posts) : ?>
            <section class="pph-section" aria-labelledby="etuh-read-heading">
                <p class="pph-section-kicker"><?php esc_html_e('From the devlog', 'infinity'); ?></p>
                <h2 class="pph-section-title" id="etuh-read-heading"><?php esc_html_e('Writing about the game', 'infinity'); ?></h2>
                <div class="pph-posts">
                    <?php foreach ($infinity_posts as $infinity_post) : ?>
                        <a class="pph-post" href="<?php echo esc_url(get_permalink($infinity_post)); ?>">
                            <?php if (has_post_thumbnail($infinity_post)) : ?>
                                <?php echo get_the_post_thumbnail($infinity_post, 'medium_large', array('class' => 'pph-post-img', 'loading' => 'lazy', 'alt' => '')); ?>
                            <?php endif; ?>
                            <span class="pph-post-body">
                                <span class="pph-post-date"><?php echo esc_html(get_the_date('', $infinity_post)); ?></span>
                                <span class="pph-post-title"><?php echo esc_html(get_the_title($infinity_post)); ?></span>
                                <span class="pph-post-excerpt"><?php echo esc_html(wp_trim_words(get_the_excerpt($infinity_post), 22)); ?></span>
                            </span>
                        </a>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php endif; ?>

        <!-- ================= FAQ ================= -->
        <section class="pph-section etuh-faq" aria-labelledby="etuh-faq-heading">
            <p class="pph-section-kicker"><?php esc_html_e('Questions', 'infinity'); ?></p>
            <h2 class="pph-section-title" id="etuh-faq-heading"><?php esc_html_e('Pre-flight briefing', 'infinity'); ?></h2>
            <div class="etuh-faq-list">
                <?php foreach (infinity_etu_hub_faq() as $infinity_q => $infinity_a) : ?>
                    <details class="etuh-faq-item">
                        <summary><?php echo esc_html($infinity_q); ?></summary>
                        <p><?php echo esc_html($infinity_a); ?></p>
                    </details>
                <?php endforeach; ?>
            </div>
        </section>

        <!-- ================= Final CTA ================= -->
        <section class="pph-cta etuh-cta" aria-labelledby="etuh-cta-heading" data-project="etu" data-placement="etu_hub_footer" data-project-block="etu">
            <?php infinity_brand_mark('etu', 56); ?>
            <h2 class="pph-cta-title" id="etuh-cta-heading"><?php esc_html_e('The frontier is open. Claim your ship.', 'infinity'); ?></h2>
            <p class="pph-cta-text"><?php esc_html_e('Wishlist on Steam so you know the day it launches, then sign up to fly with the first wave.', 'infinity'); ?></p>
            <div class="pph-actions pph-actions-center">
                <?php infinity_etu_wishlist_cta(array('campaign' => 'etu_hub_footer')); ?>
                <a class="fp-btn-secondary fp-btn-big" href="<?php echo esc_url($infinity_etu_link('', 'etu_hub_footer', 'home')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('etu', 'etu_hub_footer', 'home'); ?>>
                    <?php esc_html_e('Visit ExploreTheUniverse2175.com', 'infinity'); ?>
                </a>
            </div>
        </section>

        <?php if (get_edit_post_link()) : ?>
            <footer class="entry-footer"><?php edit_post_link(__('Edit this page', 'infinity'), '<span class="edit-link">', '</span>'); ?></footer>
        <?php endif; ?>
    </div>

    <?php endwhile; ?>
</article>

<?php
get_footer();
