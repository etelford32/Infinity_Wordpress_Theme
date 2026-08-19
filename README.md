# 🌌 Infinity WordPress Theme

**Version:** 3.0.0
**Author:** Elliot Telford
**License:** GPL v2 or later
**Live site:** [elliottelford.com](https://elliottelford.com)

Infinity is the custom WordPress theme powering elliottelford.com. It started
as a distributable theme for interactive astrophysical simulations and has
grown into a full site experience: a cinematic Three.js/WebGL front page, a
cross-promotion hub for the Telford properties, a fast classic-PHP blog with a
hand-rolled SEO layer, built-in email subscriptions, and an optional headless
React frontend for running physics simulations.

## ✨ What the theme does today

### Front page experience
- 🕳️ **Black hole hero** — WebGL accretion-disk shader with occlusion
  compositing and GPU spark particles (`assets/js/blackhole.js`), a beveled
  SVG wordmark with neon edge tracers, and a 3D logo orbit swarm
  (`assets/js/logo-orbits.js`). Follows the light/dark toggle, and answers
  the pointer: hovering stirs the disc, clicking triggers a feeding event
  that fires relativistic jets from both poles
- 🛰️ **Property strip** — live preview cards for the three external
  properties: *Explore the Universe 2175* (Steam game), *Parker's Physics*,
  and *Telford Landscaping*, with logos, key art, and an ETU teaser video
  (CDN cascade with bundled fallback art in `assets/img/`)
- 📰 **Editorial bands** — featured article, rotating deduplicated content
  pillars, latest posts
- 🎮 **Steam integration** — hero Steam store widget (auto-fit via
  `assets/js/steam-fit.js`), header CTA, and UTM-tagged outbound links
- 🌐 **3D category tag globe** — rotating globe of site categories
  (`assets/js/tag-globe.js`)

### Site-wide
- 🌗 **Four visual modes** — Dark Cosmic (default), Light Playful, Science
  Mode light/dark — plus automatic light/dark switching by local clock with a
  manual toggle in the header (`assets/js/theme-toggle.js`)
- 🎛️ **Property CTAs in the header** — Parker's Physics and Explore the
  Universe 2175 as raised buttons with their own brand marks, lifting on
  hover and pressing down on click (`infinity_brand_mark()` in
  `inc/icons.php`; set `infinity_parkers_logo` / `infinity_etu_logo` to use
  real artwork instead of the drawn marks)
- ✒️ **Custom icon set** — hand-drawn 24×24 stroke icons with a cyan→violet
  gradient and soft glow, replacing stock emoji (`inc/icons.php`,
  `infinity_icon('earth')`)
- 📧 **Built-in blog subscriptions** — no plugin needed. Subscribers are a
  private CPT, signups go through a rate-limited REST endpoint with a
  honeypot, new subscribers get a branded welcome email, publishing a post
  emails every active subscriber, and the subscribe band renders in the
  footer (`#subscribe` anchor) or anywhere via the `[infinity_subscribe]`
  shortcode (`inc/subscribe.php`)
- 📈 **Site & Speed analytics (RUM)** — anonymous, cookieless real-user
  monitoring: pageviews, sessions, Core Web Vitals (LCP/CLS/INP/TTFB/FCP),
  scroll depth, engaged time, exit/drop-off rates per page, referrers,
  device split, outbound clicks, and a subscribe funnel — all first-party,
  no external service, with a dashboard under **Analytics → Site & Speed**
  and 90-day retention (`inc/analytics-rum.php`, `assets/js/rum.js`)
- 🧭 **Navigation options** — sticky header, breadcrumbs, back-to-top button
  (all toggleable in the Customizer)

### SEO layer (no SEO plugin required)
- Meta description + Open Graph tags, JSON-LD structured data (WebSite,
  Article, BreadcrumbList), and canonical URLs for archive views — all of
  which stand down automatically if Yoast, RankMath, or AIOSEO is active
- `noindex, follow` on thin views: date/author/search/attachment pages, tag
  and post-format archives
- Attachment pages disabled entirely; legacy attachment URLs 301 to the file
- Slimmed XML sitemap (`inc/seo-cleanup.php`): tag/post-format taxonomies and
  the users provider removed, utility pages (checkout, account, sign-up, …)
  excluded and noindexed
- `X-Robots-Tag: noindex, follow` on all feeds
- 301 redirects for known duplicate pages
  (`/subjects/nutrition/ → /nutrition/`, `/subjects/patanjali-2/ → /patanjali/`)
- robots.txt hygiene: single `Sitemap:` line, stray `Crawl-delay` stripped
- `tools/audit-links.py` — stdlib Python crawler that checks every sitemap
  URL and internal link, reporting non-200s with their source pages:

  ```bash
  python3 tools/audit-links.py https://elliottelford.com --out audit-report
  ```

### Simulations platform (optional)
The original headless simulation stack is still here and activates
progressively:
- 🎮 **Custom post types** — Simulations, Blueprints, Challenges, with
  difficulty/category/engine taxonomies and JSON config meta
- 🔌 **REST API** — `/wp-json/infinity/v1/` endpoints for access checks, run
  tracking, user stats, blueprint voting and forking
- 💎 **Subscriptions** — free tier with daily simulation limits, premium via
  Stripe (keys in the Customizer, webhook handlers in `inc/stripe-api.php`);
  WooCommerce integration loads automatically if WooCommerce is active
- 📊 **Analytics dashboard** — simulation sessions, user activity, and
  admin reporting (`inc/analytics-dashboard.php`)
- ⚛️ **React frontend** — Vite + React 18 + TypeScript + React Three Fiber
  app in `frontend/`, with Cannon.js/Ammo.js physics; WPGraphQL extensions
  load automatically if WPGraphQL is active

## 📋 Requirements

- **WordPress:** 6.0 or higher
- **PHP:** 8.0 or higher
- **Plugins:** none required. Optional integrations light up automatically:
  - **WooCommerce** (+ Subscriptions) — e-commerce subscription flow
  - **WPGraphQL** — headless GraphQL API for the React frontend
  - **Yoast / RankMath / AIOSEO** — if present, the theme's canonical,
    breadcrumb, and JSON-LD output defers to them
- **Node.js 18+** — only if you build the optional React frontend

## 🚀 Installation

```bash
git clone https://github.com/etelford32/Infinity_Wordpress_Theme.git
mv Infinity_Wordpress_Theme /path/to/wordpress/wp-content/themes/infinity
```

Or zip the repo and upload via **Appearance → Themes → Add New → Upload
Theme**, then activate **Infinity**. Activation registers the custom post
types, user roles, and analytics tables.

The classic theme is fully functional with no build step. To build the
optional React frontend:

```bash
cd frontend
npm install
npm run build   # outputs to frontend/dist/, auto-enqueued when present
```

Detailed walkthroughs: [INSTALLATION.md](INSTALLATION.md) (full guide),
[QUICKSTART.md](QUICKSTART.md) (30-minute path).

## ⚙️ Configuration (Appearance → Customize)

| Section | Settings |
|---|---|
| Theme Mode | Dark Cosmic / Light Playful / Science light / Science dark |
| Steam & Properties | Steam store URL + label, ETU site URL, Parker's Physics URL, live-preview embed toggle, ETU band art override, ETU teaser video URL |
| Stripe | Publishable/secret/webhook keys, monthly & yearly price IDs, premium price |
| Navigation | Sticky header, breadcrumbs, back-to-top |
| Front Page | Band content sources (category slugs, counts, rotation) |

Menus: **Primary** (header) and **Footer**. Widget areas: Sidebar and Footer,
plus property-promo widgets (`inc/property-promos.php`) you can drop anywhere.

## 📁 Structure

```
Infinity_Wordpress_Theme/
├── style.css                  # Theme header + all classic CSS (4 visual modes)
├── functions.php              # Setup, enqueues, CPTs, Customizer, SEO layer
├── front-page.php             # The cinematic homepage (hero → bands → globe)
├── header.php / footer.php    # Animated logo, theme toggle, subscribe band
├── single.php, archive.php, page.php, search.php, 404.php, …
├── single-{simulation,blueprint,challenge}.php
├── template-app.php           # Full-screen React app template
├── inc/
│   ├── analytics-rum.php      # Site & Speed dashboard + RUM ingest
│   ├── seo-cleanup.php        # Sitemap slimming, noindex rules, 301s
│   ├── subscribe.php          # Built-in email subscriptions
│   ├── property-promos.php    # Property cards + widgets
│   ├── icons.php              # Custom icon set
│   ├── analytics-dashboard.php
│   ├── api-endpoints.php      # /wp-json/infinity/v1/*
│   ├── stripe-api.php         # Checkout sessions + webhooks
│   ├── subscription-functions.php
│   ├── simulation-meta.php    # Simulation CPT meta boxes (no ACF needed)
│   ├── user-roles.php
│   ├── woocommerce-integration.php  # loaded only if WooCommerce active
│   └── graphql-extensions.php       # loaded only if WPGraphQL active
├── assets/
│   ├── js/                    # blackhole, logo-orbits, tag-globe, theme-toggle,
│   │                          # property-previews, steam-fit, subscribe, rum, navigation
│   └── img/                   # bundled key art fallbacks
├── frontend/                  # Optional Vite + React + R3F simulation app
└── tools/
    └── audit-links.py         # Sitemap + internal-link audit crawler
```

## 🔌 REST API

Base URL: `/wp-json/infinity/v1/`

| Endpoint | Method | Purpose |
|---|---|---|
| `/simulation/{id}/access` | GET | Can the current user run this simulation? |
| `/simulation/{id}/track` | POST | Record a run + duration |
| `/user/stats` | GET | Premium status, usage, remaining runs |
| `/blueprint/{id}/vote` | POST | Upvote/downvote a blueprint |
| `/blueprint/{id}/fork` | POST | Fork a blueprint config |

The subscribe endpoint (`inc/subscribe.php`) accepts public signups with
honeypot and rate limiting; `/rum` (`inc/analytics-rum.php`) ingests
anonymous performance/engagement beacons from `assets/js/rum.js`.

## 🌐 Deployment (elliottelford.com)

The live site runs on **WP Engine** behind **Cloudflare** with a minification
plugin. Deploy flow:

1. Merge to the default branch, deploy the theme to WP Engine.
2. **Purge all three cache layers** — minification plugin, WP Engine, and
   Cloudflare. Meta/robots changes are invisible until all three are purged.
3. Verify with the checks in `tools/audit-links.py` and spot-check curls
   (tag archives noindexed, feeds carry `X-Robots-Tag`, redirects fire,
   robots.txt has one `Sitemap:` line).

The React frontend (if used standalone) deploys to Vercel — see
[INSTALLATION.md](INSTALLATION.md).

## 🛠️ Development

```bash
# PHP: lint before committing
php -l functions.php && for f in inc/*.php; do php -l "$f"; done

# Frontend
cd frontend
npm run dev         # hot-reload dev server
npm run type-check  # TypeScript
npm run lint        # ESLint
npm run build       # production build
```

## 📖 Documentation

| File | What it covers |
|---|---|
| [QUICKSTART.md](QUICKSTART.md) | Fastest path to a running install |
| [INSTALLATION.md](INSTALLATION.md) | Full backend + frontend install guide |
| [STYLING_GUIDE.md](STYLING_GUIDE.md) | Colors, fonts, CSS variables, per-band styling |
| [CHANGELOG.md](CHANGELOG.md) | Version-by-version history |
| [PRODUCT_OUTLINE.md](PRODUCT_OUTLINE.md) | Original product vision (historical) |

## 📝 License

GNU General Public License v2 or later. Use it to make something cool, have
fun, and share what you've learned with others.

## 🙏 Credits

- **Three.js / React Three Fiber** — 3D rendering
- **Cannon.js / Ammo.js** — physics engines
- **WordPress** — CMS platform
- Built by Elliot Telford with Claude (Anthropic)

## 💬 Support

- **Issues:** [GitHub Issues](https://github.com/etelford32/Infinity_Wordpress_Theme/issues)
