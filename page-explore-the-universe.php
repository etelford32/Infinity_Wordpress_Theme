<?php
/**
 * Template Name: Explore the Universe 2175 Hub
 *
 * The Explore the Universe 2175 hub on elliottelford.com: a cinematic
 * marketing page for the game. Every claim comes from the game's own site
 * and Marketing Kit (etelford32/ETUWebsite docs/MARKETING_KIT.md), and
 * every outbound link is GA4/UTM-tagged with an etu_hub_* placement.
 *
 * Used automatically by a page with the slug "explore-the-universe".
 * Content and helpers: inc/etu-hub.php. Styles: assets/css/etu-hub.css
 * (on top of parkers-hub.css for the shared pph-* blocks). Behaviour:
 * assets/js/etu-hub.js.
 *
 * @package Infinity
 * @since 3.22.0
 */

get_header();

$infinity_urls  = infinity_property_urls();
$infinity_app   = infinity_steam_app_id();
$infinity_live  = infinity_etu_demo_live();
$infinity_music = infinity_etu_music_url();
$infinity_sc    = get_option('infinity_soundcloud_url', 'https://soundcloud.com/elliottelford');
$infinity_pp    = trailingslashit($infinity_urls['parkers']);
$infinity_pph   = function_exists('infinity_parkers_hub_url') ? infinity_parkers_hub_url() : '';

/** Steam store link for a placement (UTM-tagged for Steamworks). */
$infinity_steam = function ($placement) use ($infinity_urls) {
    return infinity_project_href($infinity_urls['steam'], $placement, 'steam');
};

$infinity_signup_path = $infinity_live ? 'demo' : 'login?mode=signup&redirect=%2Fdemo';
?>

<article id="post-<?php the_ID(); ?>" <?php post_class('pph etuh'); ?>>
    <?php while (have_posts()) : the_post(); ?>

    <!-- ================= Hero ================= -->
    <script>
    /* Set before first paint so the intro animations start from their first frame; never under reduced motion */
    if (!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) { document.documentElement.classList.add('etuh-motion'); }
    </script>
    <header class="etuh-hero" data-project-block="etu" data-placement="etu_hub_hero">
        <div class="etuh-hero-bg" aria-hidden="true">
            <img src="<?php echo esc_url(infinity_etu_hub_art()); ?>" alt="" width="1122" height="760" fetchpriority="high" decoding="async">
        </div>
        <div class="etuh-stars" aria-hidden="true"></div>
        <canvas class="etuh-warp" aria-hidden="true"></canvas>
        <div class="etuh-flare" aria-hidden="true"></div>
        <div class="etuh-scan" aria-hidden="true"></div>

        <div class="container etuh-hero-inner">
            <img class="etuh-logo" src="<?php echo esc_url(infinity_etu_type('etu-logo')); ?>" alt="" width="760" height="356" decoding="async">
            <p class="etuh-presents"><?php esc_html_e('Telford Projects presents', 'infinity'); ?></p>
            <?php the_title('<h1 class="etuh-lockup"><span class="screen-reader-text">', '</span>'); ?>
                <span class="etuh-lockup-art" aria-hidden="true">
                    <span class="etuh-word etuh-lockup-explore" style="--m:url('<?php echo esc_url(infinity_etu_type('explore')); ?>')"><img src="<?php echo esc_url(infinity_etu_type('explore')); ?>" alt="" width="1152" height="186" fetchpriority="high" decoding="async"></span>
                    <span class="etuh-lockup-the"><span>The</span></span>
                    <span class="etuh-word etuh-lockup-universe" style="--m:url('<?php echo esc_url(infinity_etu_type('universe')); ?>')"><img src="<?php echo esc_url(infinity_etu_type('universe')); ?>" alt="" width="1201" height="195" fetchpriority="high" decoding="async"></span>
                    <span class="etuh-word etuh-lockup-year" style="--m:url('<?php echo esc_url(infinity_etu_type('2175')); ?>')"><img src="<?php echo esc_url(infinity_etu_type('2175')); ?>" alt="" width="582" height="192" decoding="async"></span>
                </span>
            </h1>
            <p class="etuh-tagline"><?php esc_html_e('A new galaxy every run. A companion who remembers you.', 'infinity'); ?></p>
            <p class="etuh-pitch"><?php esc_html_e('Quests, bosses, black holes and solar storms in an open-galaxy space action-RPG, with Cyl, a crystal AI who learns who you are. Solo, or co-op for up to four pilots.', 'infinity'); ?></p>

            <div class="etuh-demo" data-etuh-countdown data-at="<?php echo esc_attr(infinity_etu_demo_at()); ?>"<?php echo $infinity_live ? ' data-live' : ''; ?>>
                <p class="etuh-demo-label">
                    <span class="etuh-pulse" aria-hidden="true"></span>
                    <span class="etuh-demo-text">
                        <?php
                        echo $infinity_live
                            ? esc_html__('The free demo is out now on Steam', 'infinity')
                            : esc_html__('Free demo lands on Steam · Thanksgiving Day, Nov 26', 'infinity');
                        ?>
                    </span>
                </p>
                <?php if (!$infinity_live) : ?>
                    <div class="etuh-clock" aria-hidden="true" hidden>
                        <span><b data-u="d">0</b><small><?php esc_html_e('days', 'infinity'); ?></small></span>
                        <span><b data-u="h">00</b><small><?php esc_html_e('hrs', 'infinity'); ?></small></span>
                        <span><b data-u="m">00</b><small><?php esc_html_e('min', 'infinity'); ?></small></span>
                        <span><b data-u="s">00</b><small><?php esc_html_e('sec', 'infinity'); ?></small></span>
                    </div>
                <?php endif; ?>
            </div>

            <div class="etuh-hero-actions">
                <?php infinity_etu_wishlist_cta(array('campaign' => 'etu_hub_hero')); ?>
                <a class="etuh-btn etuh-btn-glow" href="<?php echo esc_url(infinity_etu_site_link($infinity_signup_path, 'etu_hub_hero', 'demo_signup')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('etu', 'etu_hub_hero', 'demo_signup'); ?>>
                    <?php echo $infinity_live ? esc_html__('Play the free demo', 'infinity') : esc_html__('Sign up for demo day', 'infinity'); ?> <span aria-hidden="true">&rarr;</span>
                </a>
                <a class="etuh-btn etuh-btn-ghost" href="#etuh-trailer">
                    <span class="etuh-play-dot" aria-hidden="true"></span> <?php esc_html_e('Watch the trailer', 'infinity'); ?>
                </a>
            </div>
        </div>

        <div class="container">
            <ul class="etuh-numbers" aria-label="<?php esc_attr_e('The galaxy in four numbers', 'infinity'); ?>">
                <?php foreach (infinity_etu_hub_numbers() as $n) : ?>
                    <li>
                        <span class="etuh-num"><?php echo esc_html(isset($n[3]) ? $n[3] : ''); ?><b data-count="<?php echo (int) $n[0]; ?>"><?php echo esc_html(number_format_i18n($n[0])); ?></b><?php echo esc_html($n[1]); ?></span>
                        <span class="etuh-num-label"><?php echo esc_html($n[2]); ?></span>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </header>

    <div class="etuh-body">

        <?php if (trim(get_the_content())) : ?>
            <div class="container">
                <div class="entry-content pph-intro etuh-intro"><?php the_content(); ?></div>
            </div>
        <?php endif; ?>

        <!-- ================= Trailer ================= -->
        <section class="etuh-section container" id="etuh-trailer" aria-labelledby="etuh-trailer-heading" data-reveal>
            <p class="etuh-eyebrow"><?php esc_html_e('Cinematic trailer', 'infinity'); ?></p>
            <h2 class="etuh-h2" id="etuh-trailer-heading"><?php esc_html_e('Space is beautiful, and it wants you dead', 'infinity'); ?></h2>
            <div class="etuh-theater" data-trailer="<?php echo esc_url(infinity_etu_trailer_url()); ?>" data-fallback="<?php echo esc_url(infinity_etu_site_link('', 'etu_hub_trailer', 'trailer_fallback')); ?>">
                <img class="etuh-theater-poster" src="<?php echo esc_url(infinity_etu_img('hero-megabot-chase.webp')); ?>" alt="<?php esc_attr_e('A lone white fighter banks away from the colossal MEGABOT in front of a burning star', 'infinity'); ?>" loading="lazy" decoding="async" width="1122" height="760">
                <button type="button" class="etuh-theater-play" data-project="etu" data-placement="etu_hub_trailer" data-cta="play_trailer">
                    <span class="etuh-theater-ring" aria-hidden="true"><svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" focusable="false"><path d="M8 5.5v13l10.5-6.5z"/></svg></span>
                    <span class="etuh-theater-label"><?php esc_html_e('Play the trailer', 'infinity'); ?></span>
                </button>
                <span class="etuh-corner etuh-corner-tl" aria-hidden="true"></span>
                <span class="etuh-corner etuh-corner-tr" aria-hidden="true"></span>
                <span class="etuh-corner etuh-corner-bl" aria-hidden="true"></span>
                <span class="etuh-corner etuh-corner-br" aria-hidden="true"></span>
            </div>
            <ol class="etuh-beats" aria-label="<?php esc_attr_e('What the trailer shows', 'infinity'); ?>">
                <li><?php esc_html_e('A new galaxy every run', 'infinity'); ?></li>
                <li><?php esc_html_e('Real cosmic danger', 'infinity'); ?></li>
                <li><?php esc_html_e('Quests. Factions. A buried mystery.', 'infinity'); ?></li>
                <li><?php esc_html_e('Bosses built to be broken', 'infinity'); ?></li>
            </ol>
        </section>

        <!-- ================= Pillars ================= -->
        <section class="etuh-section container" aria-labelledby="etuh-pillars-heading">
            <p class="etuh-eyebrow" data-reveal><?php esc_html_e('What is in the game', 'infinity'); ?></p>
            <h2 class="etuh-h2" id="etuh-pillars-heading" data-reveal><?php esc_html_e('Chart the unknown. Break what lives there.', 'infinity'); ?></h2>
            <div class="etuh-pillars">
                <?php foreach (infinity_etu_hub_features() as $i => $f) : ?>
                    <div class="etuh-pillar" data-reveal style="--d:<?php echo (int) $i; ?>">
                        <span class="etuh-pillar-n" aria-hidden="true"><?php echo esc_html(sprintf('%02d', $i + 1)); ?></span>
                        <span class="etuh-pillar-icon" aria-hidden="true"><?php infinity_icon($f[0], 26); ?></span>
                        <h3><?php echo esc_html($f[1]); ?></h3>
                        <p class="etuh-pillar-lead"><?php echo esc_html($f[2]); ?></p>
                        <p><?php echo esc_html($f[3]); ?></p>
                    </div>
                <?php endforeach; ?>
            </div>
        </section>

        <!-- ================= Showcase ================= -->
        <section class="etuh-showcase" aria-label="<?php esc_attr_e('In the playtest build today', 'infinity'); ?>">
            <?php foreach (infinity_etu_hub_showcase() as $i => $s) : ?>
                <div class="etuh-panel etuh-tone-<?php echo esc_attr($s['tone']); ?><?php echo $i % 2 ? ' etuh-panel-flip' : ''; ?>" data-reveal>
                    <div class="etuh-panel-media">
                        <?php if (!empty($s['video'])) : ?>
                            <video class="etuh-panel-img" muted loop playsinline preload="none" poster="<?php echo esc_url(infinity_etu_img($s['image'])); ?>" data-etuh-loop aria-label="<?php echo esc_attr($s['alt']); ?>">
                                <source src="<?php echo esc_url(infinity_etu_img($s['video'])); ?>" type="video/mp4">
                            </video>
                        <?php else : ?>
                            <img class="etuh-panel-img" src="<?php echo esc_url(infinity_etu_img($s['image'])); ?>" alt="<?php echo esc_attr($s['alt']); ?>" loading="lazy" decoding="async">
                        <?php endif; ?>
                    </div>
                    <div class="etuh-panel-copy">
                        <p class="etuh-eyebrow"><?php echo esc_html($s['eyebrow']); ?></p>
                        <h2 class="etuh-h2"><?php echo esc_html($s['title']); ?></h2>
                        <?php foreach ($s['text'] as $t) : ?>
                            <p><?php echo esc_html($t); ?></p>
                        <?php endforeach; ?>
                        <a class="etuh-link" href="<?php echo esc_url(infinity_etu_site_link($s['path'], 'etu_hub_showcase', 'showcase_' . sanitize_key($s['tone']))); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('etu', 'etu_hub_showcase', 'showcase_' . sanitize_key($s['tone'])); ?>><?php echo esc_html($s['cta']); ?> <span aria-hidden="true">&rarr;</span></a>
                    </div>
                </div>
            <?php endforeach; ?>
        </section>

        <!-- ================= Cyl ================= -->
        <section class="etuh-cyl" aria-labelledby="etuh-cyl-heading">
            <div class="container etuh-cyl-inner">
                <div class="etuh-cyl-art" data-reveal>
                    <span class="etuh-orbit etuh-orbit-a" aria-hidden="true"></span>
                    <span class="etuh-orbit etuh-orbit-b" aria-hidden="true"></span>
                    <img src="<?php echo esc_url(infinity_etu_img('cyl.webp')); ?>" alt="<?php esc_attr_e('Cyl, a crystal intelligence in a drone harness, glowing violet beside a spiral galaxy', 'infinity'); ?>" loading="lazy" decoding="async" width="1450" height="941">
                    <img class="etuh-cyl-sigil" src="<?php echo esc_url(infinity_etu_img('lumari-sigil.webp')); ?>" alt="" loading="lazy" decoding="async" width="400" height="400">
                </div>
                <div class="etuh-cyl-copy" data-reveal>
                    <p class="etuh-eyebrow"><?php esc_html_e('Your companion', 'infinity'); ?></p>
                    <h2 class="etuh-h2 etuh-typeset" id="etuh-cyl-heading"><span class="screen-reader-text"><?php esc_html_e('Fly with Cyl', 'infinity'); ?></span><span aria-hidden="true"><?php esc_html_e('Fly with', 'infinity'); ?></span> <img src="<?php echo esc_url(infinity_etu_type('cyl')); ?>" alt="" width="489" height="199" loading="lazy" decoding="async" class="etuh-type-cyl"></h2>
                    <blockquote class="etuh-quote">“<?php esc_html_e('Names have power. Tell me yours.', 'infinity'); ?>”</blockquote>
                    <p><?php esc_html_e('Cyl is the last of the Lumari, a crystal intelligence riding on your hull. She fights beside you, recharges your shields, calls the space weather and teaches you the astronomy behind it.', 'infinity'); ?></p>
                    <p><?php esc_html_e('She asks who you are and remembers your answers, growing into a different companion because of them.', 'infinity'); ?></p>
                    <ul class="etuh-archetypes" aria-label="<?php esc_attr_e('Who Cyl can become', 'infinity'); ?>">
                        <li><?php esc_html_e('Warrior', 'infinity'); ?></li>
                        <li><?php esc_html_e('Caregiver', 'infinity'); ?></li>
                        <li><?php esc_html_e('Lover', 'infinity'); ?></li>
                        <li><?php esc_html_e('Seeker', 'infinity'); ?></li>
                    </ul>
                    <dl class="etuh-cyl-stats">
                        <div><dt><?php esc_html_e('Ship shield while docked', 'infinity'); ?></dt><dd>+18/s</dd></div>
                        <div><dt><?php esc_html_e('Ship energy while docked', 'infinity'); ?></dt><dd>+8/s</dd></div>
                        <div><dt><?php esc_html_e('Shield shared between you', 'infinity'); ?></dt><dd>1</dd></div>
                    </dl>
                    <p class="etuh-cyl-talk"><?php esc_html_e('And not just Cyl: type to any named pilot, boss or faction leader and they answer in their own voice. They remember you next run.', 'infinity'); ?></p>
                    <a class="etuh-link" href="<?php echo esc_url(infinity_etu_site_link('cyl', 'etu_hub_cyl', 'cyl')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('etu', 'etu_hub_cyl', 'cyl'); ?>><?php esc_html_e('Everything Cyl can do', 'infinity'); ?> <span aria-hidden="true">&rarr;</span></a>
                </div>
            </div>
        </section>

        <!-- ================= Boss gauntlet ================= -->
        <section class="etuh-gauntlet" aria-labelledby="etuh-boss-heading">
            <span class="etuh-laser" aria-hidden="true"></span>
            <span class="etuh-alarm" aria-hidden="true"></span>
            <div class="container">
                <img class="etuh-type-megabot" src="<?php echo esc_url(infinity_etu_type('megabot')); ?>" alt="" width="1188" height="195" loading="lazy" decoding="async" data-reveal>
                <p class="etuh-eyebrow" data-reveal><?php esc_html_e('Survival', 'infinity'); ?></p>
                <h2 class="etuh-h2" id="etuh-boss-heading" data-reveal><?php esc_html_e('He sends the others first', 'infinity'); ?></h2>
                <p class="etuh-lede" data-reveal><?php esc_html_e('Every robot you destroy, every station you wake and every trade route you open reaches MEGABOT. When he finally moves, he decides: raid the last station you brought online, or hunt you down.', 'infinity'); ?></p>

                <figure class="etuh-transmission" data-reveal>
                    <figcaption><span class="etuh-rec" aria-hidden="true"></span> <?php esc_html_e('Incoming transmission · MEGABOT', 'infinity'); ?></figcaption>
                    <?php $infinity_lines = infinity_etu_hub_megabot_lines(); ?>
                    <blockquote class="etuh-transmission-line" data-lines="<?php echo esc_attr(wp_json_encode($infinity_lines)); ?>" aria-live="off"><?php echo esc_html($infinity_lines[0]); ?></blockquote>
                </figure>

                <ol class="etuh-bosses">
                    <?php foreach (infinity_etu_hub_bosses() as $i => $b) : ?>
                        <li class="etuh-boss<?php echo 3 === $i ? ' etuh-boss-final' : ''; ?>" data-reveal style="--d:<?php echo (int) $i; ?>">
                            <span class="etuh-boss-wave"><?php echo 3 === $i ? esc_html__('Final boss', 'infinity') : esc_html(sprintf(__('Boss %d', 'infinity'), $i + 1)); ?></span>
                            <img src="<?php echo esc_url(infinity_etu_img($b[0])); ?>" alt="" loading="lazy" decoding="async" width="480" height="480">
                            <h3><?php echo esc_html($b[1]); ?></h3>
                            <p><?php echo esc_html($b[2]); ?></p>
                        </li>
                    <?php endforeach; ?>
                </ol>
                <p class="etuh-center" data-reveal>
                    <a class="etuh-btn etuh-btn-red" href="<?php echo esc_url(infinity_etu_site_link('megabot', 'etu_hub_bosses', 'megabot')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('etu', 'etu_hub_bosses', 'megabot'); ?>><?php esc_html_e('Read MEGABOT\'s file', 'infinity'); ?> <span aria-hidden="true">&rarr;</span></a>
                </p>
            </div>
        </section>

        <!-- ================= Factions ================= -->
        <section class="etuh-section container" aria-labelledby="etuh-fac-heading">
            <p class="etuh-eyebrow" data-reveal><?php esc_html_e('Factions', 'infinity'); ?></p>
            <h2 class="etuh-h2" id="etuh-fac-heading" data-reveal><?php esc_html_e('Truce before teeth', 'infinity'); ?></h2>
            <p class="etuh-lede" data-reveal><?php esc_html_e('Send envoys, pay tribute, seal alliances, call ceasefires or go to war. An alliance always angers someone.', 'infinity'); ?></p>
            <div class="etuh-factions">
                <?php foreach (infinity_etu_hub_factions() as $i => $f) : ?>
                    <a class="etuh-faction" data-reveal style="--d:<?php echo (int) $i; ?>" href="<?php echo esc_url(infinity_etu_site_link($f[5], 'etu_hub_factions', 'faction_' . sanitize_key($f[2]))); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('etu', 'etu_hub_factions', 'faction_' . sanitize_key($f[2])); ?>>
                        <img src="<?php echo esc_url(infinity_etu_img($f[0])); ?>" alt="" loading="lazy" decoding="async" style="object-position:<?php echo esc_attr($f[1]); ?>">
                        <span class="etuh-faction-copy">
                            <span class="etuh-faction-kind"><?php echo esc_html($f[3]); ?></span>
                            <span class="etuh-faction-name"><?php echo esc_html($f[2]); ?></span>
                            <span class="etuh-faction-blurb"><?php echo esc_html($f[4]); ?></span>
                        </span>
                    </a>
                <?php endforeach; ?>
            </div>
        </section>

        <!-- ================= Real astrophysics ================= -->
        <section class="etuh-section container etuh-physics" aria-labelledby="etuh-phys-heading" data-project="parkers" data-placement="etu_hub_physics">
            <div class="etuh-physics-head" data-reveal>
                <p class="etuh-eyebrow"><?php esc_html_e('Made by an astrophysicist', 'infinity'); ?></p>
                <h2 class="etuh-h2" id="etuh-phys-heading"><?php esc_html_e('Every star is a story. Every black hole is a gamble.', 'infinity'); ?></h2>
                <p class="etuh-lede"><?php esc_html_e('Telford Projects was founded by a computational astrophysicist. The danger in the game is real physics, and you can try each piece of it right now on Parker\'s Physics.', 'infinity'); ?></p>
            </div>
            <div class="etuh-phys-grid">
                <?php foreach (infinity_etu_hub_physics() as $i => $p) : ?>
                    <div class="etuh-phys" data-reveal style="--d:<?php echo (int) $i; ?>">
                        <span class="etuh-pillar-icon" aria-hidden="true"><?php infinity_icon($p[0], 24); ?></span>
                        <h3><?php echo esc_html($p[1]); ?></h3>
                        <p><?php echo esc_html($p[2]); ?></p>
                        <a href="<?php echo esc_url(infinity_project_href($infinity_pp . $p[3], 'etu_hub_physics', 'sim_' . sanitize_key(basename($p[3], '.html')))); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('parkers', 'etu_hub_physics', 'sim_' . sanitize_key(basename($p[3], '.html'))); ?>>
                            <?php infinity_brand_mark('parkers', 18); ?>
                            <?php
                            /* translators: %s: simulation name */
                            printf(esc_html__('Try it: %s', 'infinity'), esc_html($p[4]));
                            ?> <span aria-hidden="true">&rarr;</span>
                        </a>
                    </div>
                <?php endforeach; ?>
            </div>
            <?php if ($infinity_pph) : ?>
                <p class="etuh-center" data-reveal><a class="etuh-link" href="<?php echo esc_url($infinity_pph); ?>"><?php esc_html_e('See every Parker\'s Physics simulation', 'infinity'); ?> <span aria-hidden="true">&rarr;</span></a></p>
            <?php endif; ?>
        </section>

        <!-- ================= Poster wall ================= -->
        <section class="etuh-section container" aria-labelledby="etuh-art-heading">
            <p class="etuh-eyebrow" data-reveal><?php esc_html_e('Key art', 'infinity'); ?></p>
            <h2 class="etuh-h2" id="etuh-art-heading" data-reveal><?php esc_html_e('Pick a side. Hang it on your wall.', 'infinity'); ?></h2>
            <div class="etuh-posters">
                <?php
                $infinity_posters = array(
                    array('poster-megabot.webp', __('Fleeing the Colossal MEGABOT', 'infinity')),
                    array('poster-mycelari.webp', __('Mycelari: The Hive Is Awake', 'infinity')),
                    array('poster-space-dwarves.webp', __('Space Dwarves: Every Alliance Has a Price', 'infinity')),
                    array('poster-wild.webp', __('The Wild Fights Back', 'infinity')),
                );
                foreach ($infinity_posters as $i => $po) :
                    ?>
                    <a class="etuh-poster" data-reveal style="--d:<?php echo (int) $i; ?>" href="<?php echo esc_url(infinity_etu_site_link('press-kit#key-art', 'etu_hub_posters', 'press_kit')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('etu', 'etu_hub_posters', 'press_kit'); ?>>
                        <img src="<?php echo esc_url(infinity_etu_img($po[0])); ?>" alt="<?php echo esc_attr(sprintf(__('Poster: %s', 'infinity'), $po[1])); ?>" loading="lazy" decoding="async" width="800" height="1000">
                    </a>
                <?php endforeach; ?>
            </div>
            <p class="etuh-center" data-reveal><a class="etuh-link" href="<?php echo esc_url(infinity_etu_site_link('press-kit#key-art', 'etu_hub_posters', 'press_kit_link')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('etu', 'etu_hub_posters', 'press_kit_link'); ?>><?php esc_html_e('Download all the key art from the press kit', 'infinity'); ?> <span aria-hidden="true">&rarr;</span></a></p>
        </section>

        <!-- ================= Demo-day checklist ================= -->
        <section class="etuh-launch" id="etuh-join" aria-labelledby="etuh-join-heading" data-project="etu" data-placement="etu_hub_join">
            <div class="container">
                <p class="etuh-eyebrow" data-reveal><?php echo $infinity_live ? esc_html__('The demo is live', 'infinity') : esc_html__('Demo day: Thanksgiving, November 26', 'infinity'); ?></p>
                <h2 class="etuh-h2" id="etuh-join-heading" data-reveal><?php echo $infinity_live ? esc_html__('Three steps and you are flying', 'infinity') : esc_html__('Three steps and you are ready for demo day', 'infinity'); ?></h2>
                <ol class="etuh-steps">
                    <li class="etuh-step" data-reveal style="--d:0">
                        <span class="etuh-step-n">1</span>
                        <h3><?php esc_html_e('Claim your callsign', 'infinity'); ?></h3>
                        <p><?php esc_html_e('Free, and it takes a minute. Your commander profile and your place on the leaderboard, on ExploreTheUniverse2175.com.', 'infinity'); ?></p>
                        <a class="etuh-btn etuh-btn-glow" href="<?php echo esc_url(infinity_etu_site_link($infinity_signup_path, 'etu_hub_join', 'demo_signup')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('etu', 'etu_hub_join', 'demo_signup'); ?>><?php echo $infinity_live ? esc_html__('Create account', 'infinity') : esc_html__('Sign up for demo day', 'infinity'); ?> <span aria-hidden="true">&rarr;</span></a>
                    </li>
                    <li class="etuh-step" data-reveal style="--d:1">
                        <span class="etuh-step-n">2</span>
                        <h3><?php esc_html_e('Wishlist on Steam', 'infinity'); ?></h3>
                        <p><?php echo $infinity_live ? esc_html__('The best way to support the game. Steam tells you when Early Access launches.', 'infinity') : esc_html__('The best way to support the game. While you are on the store page, request playtest access: sign-ups are open now.', 'infinity'); ?></p>
                        <?php infinity_etu_wishlist_cta(array('size' => 'md', 'campaign' => 'etu_hub_join')); ?>
                    </li>
                    <li class="etuh-step" data-reveal style="--d:2">
                        <span class="etuh-step-n">3</span>
                        <h3><?php echo $infinity_live ? esc_html__('Play the free demo', 'infinity') : esc_html__('Play on November 26', 'infinity'); ?></h3>
                        <p><?php echo $infinity_live ? esc_html__('The demo is out now on Steam. Download it and fly.', 'infinity') : esc_html__('The free demo lands on Steam on Thanksgiving Day. Bring friends: co-op takes up to four pilots.', 'infinity'); ?></p>
                        <a class="etuh-btn etuh-btn-ghost" href="<?php echo esc_url($infinity_steam('etu_hub_join_play')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('etu', 'etu_hub_join', 'steam_store'); ?>><?php esc_html_e('Open the Steam page', 'infinity'); ?> <span aria-hidden="true">&rarr;</span></a>
                    </li>
                </ol>
                <?php if ($infinity_app) : ?>
                    <div class="steam-fit etuh-steam" data-basewidth="646" data-baseheight="190" data-reveal>
                        <iframe class="hero-steam-frame" src="<?php echo esc_url('https://store.steampowered.com/widget/' . $infinity_app . '/?utm_source=elliottelford.com&utm_medium=hub_widget&utm_campaign=etu_hub'); ?>" title="<?php esc_attr_e('Explore the Universe 2175 on Steam', 'infinity'); ?>" loading="lazy"></iframe>
                    </div>
                <?php endif; ?>
            </div>
        </section>

        <div class="container">

            <!-- ================= Soundtrack + community ================= -->
            <section class="etuh-section etuh-duo" aria-label="<?php esc_attr_e('Soundtrack and community', 'infinity'); ?>">
                <div class="etuh-card etuh-ost" data-reveal>
                    <span class="etuh-ost-disc" aria-hidden="true"><?php infinity_icon('music', 34); ?></span>
                    <div>
                        <p class="etuh-eyebrow"><?php echo esc_html(get_option('infinity_album_status', __('Coming soon', 'infinity'))); ?> · <?php esc_html_e('Original soundtrack', 'infinity'); ?></p>
                        <h2 class="etuh-h3"><?php esc_html_e('Hear the galaxy before you fly it', 'infinity'); ?></h2>
                        <p><?php echo esc_html(get_option('infinity_album_blurb', __('The score for the game: orbital ambience, battle themes and the sound of a living galaxy, written in Ableton alongside the build. Follow on SoundCloud to hear the tracks as they come out of the studio.', 'infinity'))); ?></p>
                        <div class="etuh-row">
                            <?php if ($infinity_music) : ?>
                                <a class="etuh-link" href="<?php echo esc_url($infinity_music); ?>"><?php esc_html_e('Listen on the music page', 'infinity'); ?> &rarr;</a>
                            <?php endif; ?>
                            <?php if ($infinity_sc) : ?>
                                <a class="etuh-link" href="<?php echo esc_url($infinity_sc); ?>" target="_blank" rel="noopener" data-project="music" data-placement="etu_hub_ost" data-cta="soundcloud"><?php esc_html_e('Follow on SoundCloud', 'infinity'); ?> &rarr;</a>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
                <div class="etuh-card etuh-community" data-reveal>
                    <p class="etuh-eyebrow"><?php esc_html_e('Signal boost', 'infinity'); ?></p>
                    <h2 class="etuh-h3"><?php esc_html_e('Know a pilot? Send them the coordinates.', 'infinity'); ?></h2>
                    <p><?php esc_html_e('Independent games launch on word of mouth. Join the Discord, follow the devlog, and share this with a friend who loves space games.', 'infinity'); ?></p>
                    <div class="etuh-row">
                        <a class="pph-chip" href="<?php echo esc_url(infinity_etu_site_link('discord', 'etu_hub_share', 'discord')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('etu', 'etu_hub_share', 'discord'); ?>><?php esc_html_e('Join the Discord', 'infinity'); ?></a>
                        <a class="pph-chip" href="<?php echo esc_url(infinity_etu_site_link('devlog', 'etu_hub_share', 'devlog')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('etu', 'etu_hub_share', 'devlog'); ?>><?php esc_html_e('Devlog', 'infinity'); ?></a>
                        <a class="pph-chip" href="<?php echo esc_url(infinity_etu_site_link('roadmap', 'etu_hub_share', 'roadmap')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('etu', 'etu_hub_share', 'roadmap'); ?>><?php esc_html_e('Roadmap', 'infinity'); ?></a>
                    </div>
                    <div class="etuh-row etuh-share-row">
                        <?php
                        $infinity_share_text = __('I\'m an astrophysicist making a space game where every black hole is different. Explore the Universe 2175: free demo on Steam.', 'infinity');
                        foreach (infinity_etu_share_links(get_permalink(), $infinity_share_text) as $infinity_net => $infinity_s) :
                            ?>
                            <a class="pph-chip etuh-share-btn" href="<?php echo esc_url($infinity_s[1]); ?>" target="_blank" rel="noopener" data-project="etu" data-placement="etu_hub_share" data-cta="<?php echo esc_attr('share_' . $infinity_net); ?>"><?php echo esc_html($infinity_s[0]); ?></a>
                        <?php endforeach; ?>
                        <button type="button" class="pph-chip etuh-copy" data-url="<?php echo esc_url(get_permalink()); ?>" data-project="etu" data-placement="etu_hub_share" data-cta="share_copy" hidden><?php esc_html_e('Copy link', 'infinity'); ?></button>
                        <span class="etuh-copy-status" aria-live="polite"></span>
                    </div>
                </div>
            </section>

            <!-- ================= Devlog posts ================= -->
            <?php $infinity_posts = infinity_etu_articles(6); ?>
            <?php if ($infinity_posts) : ?>
                <section class="etuh-section" aria-labelledby="etuh-read-heading">
                    <p class="etuh-eyebrow"><?php esc_html_e('On the blog', 'infinity'); ?></p>
                    <h2 class="etuh-h2" id="etuh-read-heading"><?php esc_html_e('Writing about the game', 'infinity'); ?></h2>
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
            <section class="etuh-section etuh-faq" aria-labelledby="etuh-faq-heading">
                <p class="etuh-eyebrow" data-reveal><?php esc_html_e('Questions', 'infinity'); ?></p>
                <h2 class="etuh-h2" id="etuh-faq-heading" data-reveal><?php esc_html_e('Pre-flight briefing', 'infinity'); ?></h2>
                <div class="etuh-faq-list">
                    <?php foreach (infinity_etu_hub_faq() as $infinity_q => $infinity_a) : ?>
                        <details class="etuh-faq-item">
                            <summary><?php echo esc_html($infinity_q); ?></summary>
                            <p><?php echo esc_html($infinity_a); ?></p>
                        </details>
                    <?php endforeach; ?>
                </div>
            </section>
        </div>

        <!-- ================= Final CTA ================= -->
        <section class="etuh-final" aria-labelledby="etuh-cta-heading" data-project="etu" data-placement="etu_hub_footer" data-project-block="etu">
            <div class="etuh-final-bg" aria-hidden="true"><img src="<?php echo esc_url(infinity_etu_img('solar-shade.webp')); ?>" alt="" loading="lazy" decoding="async"></div>
            <div class="container etuh-final-inner" data-reveal>
                <img class="etuh-logo etuh-logo-final" src="<?php echo esc_url(infinity_etu_type('etu-logo')); ?>" alt="" width="760" height="356" loading="lazy" decoding="async">
                <h2 class="etuh-final-title" id="etuh-cta-heading"><span class="screen-reader-text"><?php esc_html_e('Thrust or bust, flyboy.', 'infinity'); ?></span><img src="<?php echo esc_url(infinity_etu_type('thrust-or-bust')); ?>" alt="" width="1400" height="133" loading="lazy" decoding="async"><span class="etuh-final-sub" aria-hidden="true"><?php esc_html_e('flyboy.', 'infinity'); ?></span></h2>
                <p><?php esc_html_e('The galaxy is new. The machines are not. Wishlist now and fly the free demo on Steam.', 'infinity'); ?></p>
                <div class="etuh-hero-actions">
                    <?php infinity_etu_wishlist_cta(array('campaign' => 'etu_hub_footer')); ?>
                    <a class="etuh-btn etuh-btn-glow" href="<?php echo esc_url(infinity_etu_site_link('', 'etu_hub_footer', 'home')); ?>" target="_blank" rel="noopener"<?php infinity_project_attrs('etu', 'etu_hub_footer', 'home'); ?>><?php esc_html_e('Visit ExploreTheUniverse2175.com', 'infinity'); ?> <span aria-hidden="true">&rarr;</span></a>
                </div>
            </div>
        </section>

        <?php if (get_edit_post_link()) : ?>
            <div class="container"><footer class="entry-footer"><?php edit_post_link(__('Edit this page', 'infinity'), '<span class="edit-link">', '</span>'); ?></footer></div>
        <?php endif; ?>
    </div>

    <?php endwhile; ?>
</article>

<?php
get_footer();
