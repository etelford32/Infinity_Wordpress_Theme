# Changelog

Versions map to the `Version:` header in `style.css`. Dates are omitted;
entries are in release order, newest first.

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
