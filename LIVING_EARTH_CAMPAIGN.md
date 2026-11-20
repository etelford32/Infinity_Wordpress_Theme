# Living Earth: launch plan for three Parker's Physics simulations

**Goal:** send elliottelford.com readers to three free Parker's Physics
instruments — **Inner Earth**, **Glacier Watch** and **Pollution Lab** —
through an article on the climate as a feedback system, and measure
which placements turn readers into Parker's Physics sign-ups.

| Simulation | Earth layer | Live page |
|---|---|---|
| Inner Earth | Geosphere | https://parkersphysics.com/earth-interior.html |
| Glacier Watch | Cryosphere | https://parkersphysics.com/glacier-watch.html |
| Pollution Lab | Atmosphere | https://parkersphysics.com/pollution.html |
| Earth Volcanoes *(optional 4th)* | Geosphere → atmosphere | https://parkersphysics.com/volcanoes.html |

Earth Volcanoes isn't one of the three, but it's the clearest link from
the inside of the planet to the climate, since it runs a Monte-Carlo of
volcanic forcing. The loop diagram already links to it from arrow 1.

---

## 1. What the theme now does (3.20.0)

All of this is in `inc/parkers-sims.php`. Paste the shortcodes into a
**Shortcode** block in the editor.

| Shortcode | What it renders | Where to use it |
|---|---|---|
| `[climate_loop]` | The feedback-loop diagram: three spheres, five numbered arrows (drives / amplifies + / steadies −), a legend with a "Watch it in…" link for each arrow, and nodes that link to each sim | Near the top, right after the thesis |
| `[parkers_sim id="glacier-watch" embed="1"]` | A full card: image, "Live data" badge, what the sim measures, its role in the loop, and an "Open" button. `embed="1"` adds **Run it here**, which loads the live sim inside the article | One per section, as each sim comes up |
| `[parkers_sims]` | A compact band of all three, plus a "Browse every simulation" link | The end of the article, and any later climate post |

Options:
- `image="123"` (attachment ID) or `image="https://…"` sets a card's image.
  You can also set one per sim under **Customize → Living Earth Simulations**,
  or upload a media file named `glacier-watch.jpg`, `inner-earth.jpg` or
  `pollution-lab.jpg`. Without an image the card draws its icon on a
  gradient. **Real screenshots will convert better; take them.**
- `[parkers_sims ids="inner-earth,volcanoes,glacier-watch,pollution-lab" title="…"]`
  changes the set or the heading.
- `placement="…"` on any shortcode renames the GA4/UTM placement. Give a
  later post its own name (for example `placement="glacier_deep_dive"`).
- **Customize → Living Earth Simulations** sets each sim's URL and image,
  and has a site-wide switch for the "Run it here" embeds.

Also new, with no action needed from you:
- **Homepage and /projects:** the Parker's Physics feature grid now lists
  Glacier Watch, Pollution Lab and Inner Earth with NEW badges.
- **SEO:** any post using the shortcodes adds each featured sim to its
  Article JSON-LD as a free `WebApplication` under `mentions`.
- **Speed:** the stylesheet (about 11 KB minified) loads only on pages that
  use the shortcodes. The embed script loads only when a card has
  `embed="1"`.

---

## 2. Article scaffold

Your words go in the gaps. The science notes are anchors to check or
replace, not copy.

**Working titles** (pick one; keep it under 60 characters for search):
- *The Planet Is a Feedback Loop. Here's How to Watch It Live.*
- *Reading Earth's Vital Signs in Real Time*
- *Ice, Air and Rock: Measuring a Changing Planet as It Happens*

**Slug:** `/climate-feedback-loop-live-earth/`
**Excerpt / meta description** (about 155 characters; it's also the subscriber email teaser):
> Earth's climate is a feedback system. Three free Parker's Physics simulations let you watch the ice, air and rock respond in live data.

**Category:** whichever of your science or physics pillars it fits.
**Tags:** climate, glaciers, air quality, earthquakes, Parker's Physics.

```
[Hook, 1–2 paragraphs] One live number: a glacier's speed this week,
today's PM2.5 somewhere, or the latest earthquake. Then pull back:
none of these move alone.

## The climate is a feedback system
[Thesis] A forcing nudges one part, the response feeds back. Positive
feedback amplifies a change; negative feedback steadies it. The whole
question of climate sensitivity lives in those signs.

[climate_loop]

## Ice: the amplifier  (Glacier Watch)
[Ice–albedo feedback, velocity as an early signal, ITS_LIVE image
pairs, seasonal rhythm against a 40-year record. Name a glacier the
sim tracks: Jakobshavn, Columbia, Aletsch, Khumbu.]

[parkers_sim id="glacier-watch" embed="1"]

## Air: the forcing and the mask  (Pollution Lab)
[CO₂ forces; sulfate aerosols reflect sunlight and hide part of the
warming. Cleaner air unmasks it. Soot carried downwind darkens ice,
which is the link back to the last section. The sim discloses every
constant in its forcing estimate; say why that matters.]

[parkers_sim id="pollution-lab" embed="1"]

## Rock: the slow foundation  (Inner Earth)
[Plates and slabs set where the volcanoes are. Ice loss unloads the
crust (southeast Alaska is rising up to ~3 cm a year), and the load
shift can nudge faults. The live quake feed shows the solid Earth
isn't static on human timescales either.]

[parkers_sim id="inner-earth" embed="1"]

## Measuring instead of guessing
[Why real-time data plus physical models beats a static chart: you
see the response as it happens. How Parker's Physics is built: open
data (NASA, Copernicus/CAMS, USGS), published models, disclosed
assumptions.]

## Watch it yourself
[One-line call to action.]

[parkers_sims]
```

Two details:
- The cards use `<p>` titles, not headings, so they stay out of the
  "On this page" table of contents. Only your `##` headings appear there.
- If you use three `embed="1"` cards, readers will probably only run one
  sim at a time. That's fine, because each one loads only when clicked.

---

## 3. Distribution

**On elliottelford.com**
1. **Feature the article on the homepage.** Set it as the featured article
   in Customize → Front Page so it leads the editorial band for launch week.
2. **Subscriber email.** Publishing automatically emails every active
   subscriber, using the excerpt as the teaser, so write the excerpt as a
   hook.
3. **Header video or GIF.** Screen-record about 6 seconds of each sim
   (glacier velocity map, PM2.5 transport, a seismic wave crossing the
   globe) and set it as the post's header video. The theme serves it as a
   lazy video loop and adds it to the VideoObject schema
   (`inc/post-media.php`).
4. **Featured image = OG card.** Use a 1200×630 still with all three sims.
   It's the share image on every platform.
5. **Internal links.** Link the article from older posts on climate,
   weather, aurora and Earth science. Add `[parkers_sims]` to the end of
   those posts too; each use gets its own placement in GA4.

**On Parker's Physics** (a separate repo; nothing here changes it)
- Add a "Read the story" link from each of the three sim pages back to
  the article. That makes the traffic two-way and gives the article a
  relevant backlink.
- Add the article to the Parker's Physics blog index (`blog.html`), which
  already hosts hindcast write-ups in the same voice.

**Off-site**
- **Short videos** (YouTube Shorts, TikTok, Reels, X): one per sim,
  15–30 seconds, screen capture plus voice-over, ending on the article
  URL. Three sims give you three posts from one article.
- **Communities:** share the specific, data-forward angle rather than
  "check out my site": "I track 48 glaciers' velocity from NASA ITS_LIVE.
  Here's what Jakobshavn did this month." Good fits are r/dataisbeautiful
  (a still image with its source), r/geology and r/glaciology (Inner
  Earth and Glacier Watch), and r/airquality. Read each subreddit's
  self-promotion rules first.
- **Educators:** Parker's Physics has a `for-educators.html` page. A short
  "use these three sims in an Earth-systems lesson" note to teachers and
  science communicators may be the highest-value outreach here.
- **Hacker News "Show HN":** the transparency angle ("every constant
  disclosed", open data, a semi-Lagrangian transport model in the
  browser) suits that audience. Lead with Pollution Lab.

**Follow-up series** (one deep dive per sim, each ending on `[parkers_sims]`):
1. *Why glacier speed is an early warning* (Glacier Watch)
2. *The aerosol mask: why cleaner air can mean faster warming* (Pollution Lab)
3. *The ground under the ice is rising* (Inner Earth + Glacier Watch)

---

## 4. Measuring it

Every link from these components is already tagged:

- **GA4 on elliottelford.com:**
  - `project_click` with `project=parkers`, a `placement`
    (`article`, `article_band`, `article_loop`, or your own) and a `cta`
    naming the sim (`sim_glacier_watch`, `loop_inner_earth`, …).
  - `project_intent` with `intent=sim_run_here` when a reader runs a sim
    inside the article.
  - Block-view events from `data-project-block` give you seen → clicked
    rates for each card.
- **Parker's Physics GA4:** visits arrive with
  `utm_source=elliottelford.com`, `utm_medium=referral`,
  `utm_campaign=<placement>` and `utm_content=<cta>`. The `sign_up`
  outcome on that property then shows which placement produced sign-ups.
  If cross-domain linking is on, the UTMs are skipped and the GA linker
  carries the session instead.
- **The weekly GA rollup** (`tools/ga4-rollup.mjs`) already reports
  `project_click` and Parker's Physics `sign_up`, so the launch shows up
  there without extra setup.

Questions to answer after two weeks:
1. Which sim pulls the most clicks, and which pulls the most sign-ups?
   Lead the follow-up series with the winner.
2. Does **Run it here** beat **Open**? If embedded runs rarely lead to a
   click-through, the embed may be satisfying curiosity on our page. Try
   setting `embed="0"` on one card.
3. Is the loop diagram or the end band the better converter? That
   decides what goes into older posts.
