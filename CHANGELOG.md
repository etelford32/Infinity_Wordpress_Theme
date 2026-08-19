# Changelog

Versions map to the `Version:` header in `style.css`. Dates are omitted;
entries are in release order, newest first.

## 3.1.0

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
