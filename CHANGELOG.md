# Changelog

Versions map to the `Version:` header in `style.css`. Dates are omitted;
entries are in release order, newest first.

## 3.3.0

- **Subscriber email actually arrives** (`inc/mailer.php`): WordPress hands
  every `wp_mail()` to PHP's `mail()`, which on shared hosting is an
  unauthenticated message from an IP the receiving side was never asked to
  trust — it leaves, and it lands in spam, and nothing reports an error. A
  `pre_wp_mail` transport now posts to Resend's HTTP API instead. No call site
  changed: every existing `wp_mail()` keeps working and simply starts
  arriving. With no key configured the filter returns null and WordPress uses
  its own transport, so an unconfigured site behaves exactly as before rather
  than silently sending nothing. Attachments deliberately fall through too —
  the theme sends none, and quietly dropping one is worse than being slow.
  The key comes from `INFINITY_RESEND_API_KEY` in `wp-config.php`, with a
  Customizer field as a fallback; failures are recorded and surfaced on the
  Subscribers screen, because a silent mail failure needs somewhere to be seen.

- **Addresses are confirmed before anything is sent to them**
  (`inc/subscribe.php`): the signup endpoint is public, so it would previously
  mail a welcome to any address anybody typed into it — a way to spend a
  sending domain's reputation on other people's spam complaints. Signup now
  parks the address as `pending` and sends a confirmation link; the welcome
  goes out when that link is clicked. Confirm links are namespaced into the
  HMAC so they cannot be replayed as unsubscribe links or the reverse, and the
  empty namespace still hashes exactly what the old scheme hashed, so every
  unsubscribe link already sitting in an inbox keeps working. If the
  confirmation cannot be delivered the signup is recorded anyway — stranding
  someone behind a link they will never receive is the worse failure.
  `add_filter('infinity_subscribe_double_optin', '__return_false')` restores
  the old behaviour.

- **The subscribe band no longer renders twice on the sign-up page**
  (`inc/subscribe.php`): the footer renders it on every page and the sign-up
  page also carries `[infinity_subscribe]`, so that page showed the identical
  form twice. The `#subscribe` anchor now goes to whichever band renders
  first, so suppressing the footer copy does not take the anchor off the page
  with it, and two shortcodes on one page cannot duplicate the id.

- **`.screen-reader-text` is defined by the theme** (`style.css`): four
  templates use it and none of them defined it. It looks right today only
  because WordPress's block-library stylesheet happens to carry a definition —
  a stylesheet this site's asset optimiser is free to drop, at which point a
  stray "Email address" label appears in the middle of the subscribe form.
  Includes the `:focus` reveal, so skip links behave.

- **Sign-up page and its states** (`inc/subscribe.php`, `assets/js/subscribe.js`,
  `style.css`): the in-content band now answers "what do I get?" — cadence,
  what arrives first, what happens to the address. The three "yes" answers are
  distinguished rather than all reported as "Subscribed", since telling
  somebody they are subscribed when they still need to confirm costs a
  subscriber; re-signing up an address that is already confirmed no longer
  counts as a funnel conversion. Email links land on a banner at the top of
  the body: confirmed, expired-link, and unsubscribed. That last one has been
  redirected to since the feature shipped and never rendered anything, so
  one-click unsubscribe has always dropped people on a home page that gave no
  sign it had worked.

- **Dropped a deprecated call** (`inc/subscribe.php`): subscriber lookup used
  `get_page_by_title()`, deprecated in WordPress 6.2.

## 3.2.0

- **Subject accents on the top level of the navigation** (`style.css`,
  `functions.php`, `inc/icons.php`): each top-level item now carries a
  `nav-tone-*` class naming its subject, which sets a `--nav-accent` the chip,
  its icon, and its whole dropdown panel read from — so hovering Yoga turns
  that branch saffron and the section you are on keeps its colour whether or
  not the pointer is near it. The tone comes from `infinity_nav_icon_for()`
  rather than a second keyword table, so the icon and the colour cannot drift
  apart. Only hover, focus and the open/current states take colour: a nav
  where every chip is permanently coloured has nothing left to say which one
  is active. The panel's pointer arrow and its open-sweep highlight are tinted
  too, since leaving either on the shared accent is what makes a tinted panel
  look mismatched rather than themed.

- **Project, om and music icons** (`inc/icons.php`): Elliot's Projects, Yoga
  and Music all fell through to the default spark, because the keyword map had
  no entry for any of them. Adds a layered-stack project mark, beamed eighth
  notes, and a Devanagari om traced against the real glyph — two bumps facing
  right off a shared spine, the lower bowl much the larger, and the tail
  leaving at mid-height to hook down-right, with the crescent and bindu above
  the tail rather than the bowl. There is deliberately no bare `om` keyword:
  the haystack includes the item's URL and every URL here ends in `.com`,
  which would have handed the whole navigation the same symbol.

- **Steam wishlist card sized for wide screens** (`style.css`): the widget
  lays itself out for 646px and `steam-fit.js` scales it to whatever column it
  is given, so a 500px column was rendering it at 0.72 — small, and soft
  wherever it had been downscaled. The extra width now comes from the section
  rather than from the copy beside it: the hero container opens past its usual
  1280px, so at 1480px the copy column goes 684px to 724px while the widget
  goes 0.72 to 0.91, and at 1700px the widget reaches its native size with the
  copy at 736px. Both columns grow; neither pays for the other.

- **The event horizon is black** (`assets/js/blackhole.js`): the broad bloom
  around the photon ring was commented "outside the silhouette" but was never
  masked by it, so it painted over the void and the hole rendered as a muddy
  brown disc — most visible in light mode, where it sat on a pale page. Masked,
  and the silhouette's opacity raised, the hole is now the black it is supposed
  to be.

- **Gravitational lensing of the background sky** (`assets/js/blackhole.js`):
  stars are sampled at their true angle rather than their apparent one
  (`beta = theta - thetaE^2/theta`), which drags the sky inward and stacks it
  against the photon ring, brightened by the tangential stretch `theta/beta`
  that is what turns those stars into a rim instead of merely moving them.
  The field fades just before `beta` collapses, where neighbouring pixels
  would fall into one hash cell and a magnified star would stop being a point
  and become a visible block. Adds the second-order photon image as well — the
  light that looped the hole once more before escaping, landing just inside
  the primary ring and far thinner, which is what makes the ring read as a
  stack of images rather than a circle somebody drew.

- **The disk is a slab, not a sheet** (`assets/js/blackhole.js`): the disk
  had no vertical extent at all — it was one plane, sampled once. It is now
  integrated over three heights through a scale height that flares with
  radius, so the outer disk is thick and the inner disk is thin. The
  geometry is one line: `squash` is the foreshortening, so `sinE = 1/squash`
  is the sine of the viewing elevation and reading the disk at height `h`
  means sampling the plane at `uv.y - h*cosE`. From ~17 degrees above the
  plane the top of the slab is the near face, so the layers are integrated
  front to back and each absorbs the ones behind it; that self-occlusion is
  what stops the stack reading as three stacked sheets and starts it reading
  as a body. The near/far split widens with the scale height too, or a thick
  disk would still cross the hole on an infinitely thin line.

  Slice count is a quality knob baked into the shader source, since WebGL1
  needs a constant loop bound — three on desktop, two on small screens and
  for the second disk on the Parker's band, matching how the particle swarm
  already scales. `k` stays symmetric about the midplane and the vertical
  weights are normalised from the count, so dropping a slice changes neither
  the disk's tilt nor its brightness.

- **The horizon stays black while feeding** (`assets/js/blackhole.js`): two
  more terms were painting over the silhouette. The shock ring thrown outward
  on a click was unmasked while the jet beside it in the same block was
  masked, and the scene halo was unmasked as well — together they turned the
  hole tan in exactly the state that is meant to be most dramatic. Nothing
  escapes a black hole, including the parts of this scene that are drawn
  after it.

- **The disk tips, precesses and warps** (`assets/js/blackhole.js`): the disk
  plane was fixed, so the only motion in the scene was the pattern flowing
  through it. It now has a real orientation in 3D. The whole map from screen
  to disk plane collapses to *rotate by −phi, then divide one axis by
  sin(elev)* — the old constant `squash` was exactly the `1/sin(elev)` of
  that, with `phi` pinned at 90°, which is why generalising it cost almost
  nothing. `elev` breathes, so the disk opens toward the viewer and closes
  again; `phi` precesses, so the high point of the rim walks around the hole.
  Because Lense-Thirring precession falls off steeply with radius, `phi` is a
  function of `r` as well as `t`: the inner disk leads the outer one and the
  plane twists rather than tipping rigidly — a warp, not a rocking plate.

  Everything keyed to the old fixed axes had to move with it or a turning
  disk would have kept its highlights pinned to the screen: Doppler beaming
  is now measured along the line of nodes, and the near/far split, the
  vertical shading and the lensed far-side arc all key off the tilt azimuth.
  A height above the midplane displaces along that azimuth too, not straight
  up-screen. The jets are deliberately left alone — they ride the hole's spin
  axis, which is the axis the disk precesses around, so the disk wobbles and
  the beams hold still. The scene's own cant is now constant, since rocking
  the frame swung the starfield and the photon ring with it, which is not
  something a precessing disk does to the sky.

- **The far side is lensed over the hole, and the cross-section is a torus**
  (`assets/js/blackhole.js`): the disk's silhouette is now geometry rather
  than decoration. Rays are traced backwards, bent toward the axis at
  closest approach by the weak-field `2Rs/b`, and *then* intersected with the
  disk plane — so the far side, which sits behind the hole, arrives lifted
  and curls up over it and back under, which is what a real accretion disk
  looks like. The bend ramps in only on the far side; on the near side it is
  zero and the whole thing collapses exactly to the previous straight-line
  intersection. Verified against the full ray-plane derivation across three
  inclinations, three azimuths and four deflections: max error 3.5e-13, and
  at zero deflection it reproduces the old projection bit for bit.

  The deflection cap is load-bearing, not cosmetic. `2Rs/b` runs away at the
  photon sphere, and the harder the bend the deeper inside the ISCO the far
  side samples, which opens a dead band between the ring and where the lensed
  disk begins — 0.126 in screen radius at the first value tried, against a
  ring at 0.148. At 0.34 that band is ~0.05, tight enough to read as the
  inner shadow it physically is, while the far side is still compressed from
  a radius of ~0.98 to ~0.33.

  The cross-section changed with it: a slab of constant thickness is not what
  a thick disk looks like, so the half-height now swells in the middle and
  thins toward both edges — an ellipse in the (r, z) plane, skewed fatter
  outward because disks flare. Lifting the far side into view also exposed
  far more of the cool outer disk than the foreshortened version ever did, so
  the colour ramp moved outward to match, and the painted far-side arc is
  back to being a little extra glow on the ring rather than a stand-in for a
  curl the geometry now does itself.

## Unreleased

- **Deploy pipeline gated and verified** (`.github/workflows/deploy.yml`):
  the WP Engine deploy is now three stages — validate, deploy, verify. Nothing
  reaches the server until the tree parses: `php -l` over every PHP file,
  `node --check` over every script, a brace-balance check on `style.css`, and
  a check that `Version:` and `INFINITY_VERSION` agree, since rsync will
  happily ship a parse error and a parse error on a live WordPress install is
  a white screen for every visitor. Changing an asset without bumping the
  version now warns, because assets are enqueued with `?ver=` and returning
  visitors would otherwise keep their cached copies. After deploying, the
  homepage is polled until it actually serves the new version, so a deploy
  that quietly changed nothing can no longer report success. A failed run
  writes a summary naming the fix — the two runs before this both died on
  `Permission denied (publickey)` and said nothing about why. Also adds an
  optional Cloudflare purge when its secrets are present, a `wpe-deploy`
  concurrency group so two deploys can never overlap on the live theme
  directory, an install-name input for `workflow_dispatch`, and
  `actions/checkout@v5` to clear the Node 20 deprecation

## 3.1.0

- **Mobile and touch pass** (`style.css`, `assets/js/blackhole.js`): four
  things were broken on touch and are now fixed. Hover states stuck — a tap
  synthesises a `:hover` that persists until you tap elsewhere, leaving
  buttons floating and chips lit; motion now answers `:active` behind
  `(hover: none)` guards. Dropdown panels were unreachable on a touch tablet,
  where the only way in was hovering; the submenu toggle now appears on any
  coarse pointer and opens the panel by tap. The black hole fired its jets on
  `pointerdown`, so every swipe through the hero triggered a feeding event;
  it now needs a real tap, judged on travel accumulated during the gesture
  rather than on a `pointerup`'s own coordinates. And touch targets were
  under size — the theme toggle was 46x20 and the drawer's submenu toggle
  32x32, both now at least 44px
- **Three mobile-nav bugs fixed**: submenus in the drawer were unopenable
  between 769px and 1024px, because the toggle was still hidden at the old
  breakpoint after the drawer moved to 1024px; with Sticky Header on, the
  drawer's own overlay covered the drawer, since a fixed header with a
  z-index makes a stacking context the nested drawer cannot escape, so every
  tap landed on the scrim; and drawer rows sized themselves to the longest
  label instead of the panel, because the header lays `.main-navigation` out
  as a row and the drawer inherited it
- **Lighter on phones**: the hero's spark swarm drops from 720 points to 170
  below 620px, and backdrop blur — which re-samples everything behind it on
  every frame it moves — is dropped from the sticky header and dropdown
  panels at phone widths, keeping the translucency
- **Sticky header collapses on scroll** (`style.css`,
  `assets/js/navigation.js`): with Sticky Header enabled, the two-row header
  compacts from 149px to 90px past the first inch — the tagline folds away,
  the logo steps down, the theme toggle moves alongside the wordmark and
  every row tightens. It stays two rows; going single-row would mean
  dropping the nav's icons or the buttons' labels. Sustained downward
  scrolling tucks it away entirely and scrolling back up returns it, now
  driven by accumulated travel rather than per-frame deltas so a trackpad
  wobble no longer makes it flicker. It stays pinned while the mobile drawer
  is open or the keyboard is focused inside it. Three stale-measurement bugs
  fixed alongside: the body's top padding was measured once at load, so it
  went wrong on any resize across the 1024px line and after a late webfont;
  anchor jumps offset by the expanded height and so overshot, leaving a gap;
  and the focus call after a smooth scroll dragged the target back under the
  header, because a plain `focus()` scrolls on its own terms
- **Nav items are dropdown triggers** (`functions.php`, `inc/icons.php`,
  `style.css`): every primary-menu item now carries an icon matched to its
  label, and items with children carry a caret. Panels spring down from
  their trigger with a notch tying the two together, rows stagger in behind
  the panel, a highlight sweeps the face once on open, and the trigger sits
  down flat and squares its bottom corners so chip and panel read as one
  surface. Rows grow an accent bar and slide on hover. The gap between chip
  and panel is the panel's own padding, so the pointer never crosses dead
  space on the way down. Items with no children get no caret — a chevron
  over nothing is a promise the nav can't keep
- **Header goes two rows on desktop**: measured, not guessed — five pillar
  labels with icons and carets come to ~900px, branding ~430 and the two
  labelled CTAs ~400, so ~1750px of content cannot share one row on a 1440
  laptop. The nav now owns a full row, which fits it at 1024px with room to
  spare, and both CTAs keep their labels across the whole desktop range
  instead of collapsing at 1360px. A longer menu wraps to a second line
  rather than pushing the header off screen
- **Real Parker's Physics logo** (`inc/icons.php`,
  `inc/property-promos.php`, `assets/img/parkers-physics-logo.png`): the
  drawn stand-in is replaced by the actual mark — the vector transcription
  from that project's own repo for the inline nav icon, and its 256px raster
  bundled for the promo card, which also drops the per-pageview call to
  Google's favicon resolver
- **Navigation rebuilt around the property CTAs** (`header.php`, `style.css`,
  `inc/icons.php`, `assets/js/navigation.js`): the header now reads
  brand | nav | actions, with the CTAs grouped and a Parker's Physics button
  added beside the Explore the Universe one. Both carry a marketing brand
  mark, both are physical buttons — a solid lip under the face, a lift on
  hover and a press down onto the lip on click — and the nav items get a
  quieter version of the same so they read as pressable without competing.
  Two overflow bugs fixed on the way: the header spilled past the viewport
  between 768px and 1024px (the drawer now takes over below 1024px, in step
  with `navigation.js`), and on phones the site tagline made the branding
  wider than the screen, pushing the menu button off it entirely
- **Black hole cursor affordance**: the hero backdrop switches to a
  crosshair once the pointer is close enough for a click to do something.
  Scoped to the bare backdrop, so hero copy stays readable and selectable
  and links still read as links
- **Interactive black hole** (`assets/js/blackhole.js`): the hero scene now
  answers the pointer. Hovering stirs the plasma — a finer turbulence layer
  rides the filaments, the disc puffs up, doppler beaming hardens and
  differential rotation spins up, all ramping with proximity to the hole.
  Clicking anywhere in the hero triggers a feeding event: the disc flares,
  most of the spark swarm drops onto inspiral orbits, a shock ring runs
  outward and collimated relativistic jets fire from both poles, decaying
  over ~4s. Rotation runs off an accumulated `u_spin` clock so rate changes
  never teleport the disc's phase; the hover and jet passes sit behind
  uniform branches so an untouched hero costs what it always did.
  Interaction is skipped under `prefers-reduced-motion`
- **Hero light mode restored** (`style.css`, `assets/js/blackhole.js`,
  `front-page.php`): the front-page black-hole hero was pinned to the dark
  palette in both modes, so the light/dark toggle appeared to do nothing at
  the top of the page. Only the tag globe stays deliberately dark now. The
  hero restages for daylight rather than inverting — the event horizon stays
  black, the shader re-casts the accretion disk as pigment (`u_light`), the
  starfield drops out, sparks composite over the page instead of adding
  light to it, and the wordmark swaps polished chrome for dark metal. The
  Parker's Physics disk sits on its own dark backdrop art and keeps the
  night palette in both modes

- **Site & Speed analytics (RUM)** (`inc/analytics-rum.php`,
  `assets/js/rum.js`): first-party, anonymous, cookieless real-user
  monitoring — pageviews, sessions, Core Web Vitals (LCP/CLS/INP/TTFB/FCP),
  scroll depth, engaged time, per-page exit/drop-off rates, referrers,
  device split, outbound clicks, subscribe funnel. New admin dashboard at
  **Analytics → Site & Speed**; 90-day retention, logged-in users excluded
- **Welcome email** for new (and returning) subscribers — branded HTML with
  recent-post "start here" links and property links; filterable via
  `infinity_welcome_email_subject` / `infinity_welcome_email_body`
- **Sign-up linking**: footer subscribe band now carries the `#subscribe`
  anchor (link any "Sign up" CTA to `/#subscribe`), new
  `[infinity_subscribe]` shortcode embeds the form on any page (e.g.
  `/sign-up/`), subscribe JS handles multiple forms and focuses the email
  field on arrival via anchor
- **SEO cleanup** (from the 2026-07-18 Search Console audit): noindex tag and
  post-format archives; remove tag/format taxonomies and the users provider
  from the XML sitemap; noindex utility pages and drop them from the page
  sitemap; `X-Robots-Tag: noindex, follow` on feeds; 301
  `/subjects/nutrition/ → /nutrition/` and `/subjects/patanjali-2/ →
  /patanjali/`; deduplicate the robots.txt `Sitemap:` line and strip stray
  `Crawl-delay`
- New `tools/audit-links.py` — sitemap + internal-link audit crawler
- Documentation refresh (README, CHANGELOG, install/quickstart corrections)

## 3.0.0

- 3D logo orbit swarm around the header logo
- Automatic light/dark theme switching by local clock, with manual toggle
- Steam widget responsive fit

## 2.9.0

- Parker's Physics stage restack
- Weather-sim marketing content, rotating Earth
- Broader content-pillar slug matching

## 2.8.0

- Cosmic Parker's logo animation
- Rotating, deduplicated homepage sections

## 2.7.0

- Custom icon set (`inc/icons.php`) — hand-drawn stroke icons replacing emoji
- Parker's Physics hologram
- Auroracle + roadmap teasers

## 2.6.0

- Feature highlight grids for Parker's Physics and Telford Landscaping

## 2.5.0

- ETU teaser video in the game band and preview card

## 2.4.0

- Reliable ETU marketing art: CDN cascade with bundled key-art fallback

## 2.3.0

- Built-in blog subscriptions (`inc/subscribe.php`): subscriber CPT,
  rate-limited REST signup, email on publish, footer subscribe band

## 2.2.0

- Earth-sim spotlight band, big CTAs
- 3D category tag globe

## 2.1.0

- Property logos, ETU card fix
- Orbitron display type, hotter racer palette

## 2.0.0

- Orbital particle tails
- Hero Steam widget
- Live property previews

## 1.9.0

- Neon edge tracers on the wordmark
- Mega CTA
- Steam widget + UTM analytics on outbound links

## 1.8.0

- 3D accretion disk with occlusion compositing and GPU spark particles

## 1.7.0

- Data-driven SEO tuning from Search Console

## 1.6.0

- SEO layer: sitemap pointer, canonicals, breadcrumbs, JSON-LD, related posts
- Cinematic beveled wordmark, shader upgrades

## 1.5.0

- Hero wordmark swept into a hot accretion disk

## 1.4.0

- Phased animation for the site logo, performance pass

## 1.3.0

- Black hole hero shader, single animated header logo

## 1.2.0

- Unified property linkage: widgets, post sidebar, dual CTAs

## 1.0.0 – 1.1.x

- Initial platform: WordPress theme + React/Vite frontend for interactive
  astrophysical simulations
- Custom post types (Simulations, Blueprints, Challenges), user roles,
  subscription system with Stripe/WooCommerce, analytics dashboard,
  performance monitoring, Ammo.js physics engine, navigation and UX
  enhancements, editorial light mode
