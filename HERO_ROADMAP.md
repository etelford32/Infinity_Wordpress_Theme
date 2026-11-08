# Homepage hero: interactive roadmap

The hero (`front-page.php`, `assets/js/blackhole.js`, style.css §18–19)
now leads with the newest article, with the black hole as the visual
centrepiece on the right. This is the plan for making that area more
interactive. Every item is scoped to fit the current constraints:

- **The article stays the point.** Effects support the lead card. They
  never cover it or slow it down. The LCP element is the lead thumbnail,
  so nothing here may block it.
- **Cheap when idle.** ~30 fps cap, pauses off-screen, smaller particle
  swarm and fewer disk slices on phones. A new effect that costs GPU time
  every frame has to earn it, or run only while it is active.
- **Reduced motion is respected.** Under `prefers-reduced-motion` the
  scene is a single static frame and every feature below is either off
  or replaced by a static equivalent.
- **No dependencies.** Plain WebGL1 + vanilla JS, as now.

## Already shipped

| Interaction | Behaviour |
| --- | --- |
| Hover stir | Pointer proximity churns the plasma, thickens the disk, spins it up. |
| Click / tap to feed | Disk flares, swarm drops into the hole, shock ring, polar jets (~4 s). |
| Article-aware stir (new) | Hovering or focusing the lead card holds the disk at a gentle stir. |
| Controls never feed (new) | Pressing a link, the card, or the Steam widget no longer triggers a feeding event. |
| Phase 1 (3.9.0) | Feed button + live region, read transition, pillar tint, pointer lens. See below. |
| Twistor dynamics (3.11.0) | Robinson-congruence field, drag to spin/tilt, Kerr shadow and ISCO, live Kerr readout, scroll tilt. See below. |
| Physics round 3 (3.12.0) | Plasma on the congruence (circulate / jet / plunge), spiral density waves, ripples, QPOs, lensed background galaxy, frame-drag sky twist, photon-ring echoes. |
| Draggable galaxy (3.13.0) | Grab any image of the lensed galaxy (back-traced through the lens), drag it into an Einstein ring, throw it, or park it; tap or G on touch/keyboard. |
| Plasma field (3.14.0) | Particles and the cursor heat and stir the disk through a Keplerian-advected polar field; wakes shear into trailing spirals. Kerr readout panel removed. |
| Theme crossfade | Night ↔ paper palette follows the site toggle. |

## Phase 1: shipped in 3.9.0

1. **Accessible "Feed the black hole" button.** `[data-bh-feed]` in
   the hero calls the same feed event as the backdrop click, and a
   polite live region (`[data-bh-live]`) announces "Accretion flare: the
   black hole is feeding." Stays hidden unless the scene is interactive
   (WebGL available and motion allowed). On screens 1100px and wider it
   floats just above the hole and never drops onto the Steam card; on
   narrower screens it sits in the copy column under the section links.
2. **Read → spaghettify transition.** A plain left-click on the lead
   card's title or image feeds the hole at 0.8 strength and pulls the
   card toward it, stretched along the line to the hole and squeezed
   across it, then navigates after 340 ms. Modifier clicks, middle
   clicks and new-tab links are not intercepted, and returning through
   the back/forward cache resets the card.
3. **Category tint.** `infinity_post_pillar()` maps the lead post's
   categories to a pillar, which is printed as `data-bh-tint` on the
   canvas. The disk, lensed arcs and sparks are graded toward a hue
   (teal for health, green for science, violet for mind, gold for
   travel; space keeps the native ramp) while each pixel keeps its
   luminance. The grade is gentler in paper mode, so dark pigment
   doesn't turn grey.
4. **Pointer gravitational lens on the sky.** A weak point lens follows
   the mouse (eased, not snapped), bends the starfield and nebula, and
   shows a faint, lumpy Einstein ring. It fades out near the hole so the
   two lenses never meet at the photon ring. Night mode and mouse only.

## Twistor dynamics: shipped in 3.11.0

- **The Robinson congruence**, drawn as a live field of linked, twisting
  light rays on nested tori around the spin axis: the hole's own
  shear-free principal null congruence (Kerr theorem), built from
  stereographically projected Hopf fibres. It's frame-dragged at a
  rate set by the spin, light pulses run along every fibre, and threads
  passing behind the hole are lensed around the shadow.
- **Drag to spin and tilt** (this was item 5): horizontal drag winds a*
  from 0 to 0.998 and vertical drag tilts the camera. A click still
  feeds. Arrow keys on the feed button do the same, with a spoken
  summary. The spin relaxes back to rest over ~20s; the tilt springs
  back in about 2s.
- **Spin-dependent geometry** (a first pass at item 9): an approximate
  Kerr "D" shadow, flattened on the approaching side, scaled by a*² and
  by how edge-on the view is. The ISCO moves inward with spin, and the
  disk spins faster as the hole does.
- **Live Kerr readout** (the readout part of item 8): a*, inclination,
  r₊, prograde r_ph and r_isco, and thin-disk efficiency η, from the
  exact formulas. *(Removed in 3.14.0.)*
- **Scroll tilt** (item 7): the disk lays toward edge-on as the hero
  scrolls away.
- **3D sparks**: the swarm now uses the disk's exact camera, and sparks
  behind the hole are lensed instead of drawn across the shadow.

## Phase 2: "play with it" (≈3–5 days)

5. **Drag to orbit.** *(Shipped in 3.11.0 as drag to spin and tilt.)* Dragging on the empty backdrop changes the
   disk's inclination and precession angle (`elev`, `phi`) with inertia
   and an elastic return to the resting pose. Both values already drive
   the shader, so this only needs two uniforms in place of the current
   time-driven terms. Touch needs a deliberate long-press, so vertical
   scrolling on phones isn't hijacked.
6. **Tidal disruption on long-press.** Hold for ~600 ms on the
   backdrop: a star appears at the pointer and is pulled into a thin
   stream that wraps the hole and joins the disk, then a feeding flare.
   Done as a particle-pass mode (each particle's orbit seeded from the
   press point). No new shader pass.
7. **Scroll-linked camera.** As the reader scrolls past the hero, the
   camera tips toward edge-on and the disk thins to a line that leads
   the eye into the first content section. Uses an IntersectionObserver
   ratio, not scroll events, and freezes once the hero is off-screen.
8. **"Tweak the hole" mini panel → Parker's Physics.** A collapsible
   chip under the Steam card with three sliders: spin *a\**,
   inclination, and accretion rate. It shows live readouts (event
   horizon, photon sphere, and ISCO radius for the chosen spin). The CTA
   "Open the full simulation" deep-links to Parker's Physics with the
   same parameters in the query string, which turns the hero into a
   funnel to the sandbox.

## Phase 3: bigger bets (scope separately)

9. **Real Kerr shadow.** Replace the circular shadow and photon ring
   with the spin-dependent D-shaped Kerr shadow, using the analytic
   Bardeen boundary curve. It pairs with slider 8 and makes the spin
   slider visibly change the silhouette.
10. **ETU tie-in: "spotted in 2175".** On a feeding event there's a
    small chance that a ship sprite from Explore the Universe 2175 is
    caught in the swarm, with a toast: "Ship lost to Sgr A*. Wishlist
    to get it back." Rate-limited per visit, and never shown on a first
    visit.
11. **Ambient sonification.** Off by default, behind a speaker toggle.
    A low drone pitched by disk spin, with a chirp on feeding. Web Audio
    only, and nothing loads until the toggle is pressed.
12. **Engagement metrics. Shipped in 3.10.0.** Hero actions (impression,
    stir, lens, feed, feed button, read transition, lead click, category,
    "Also new", section links, wishlist) go through the existing RUM
    pipeline as `hero` events, with an optional interactive-vs-calm
    holdout experiment and an Analytics → Homepage Hero report. See
    "Measuring it" below.

## Measuring it

- **Turn the experiment on** under Customize → Homepage Content → Hero
  experiment: holdout % (try 20–30). Holdout sessions get the animated
  black hole with none of its interactions.
- **Decide the sample size before looking.** For a baseline lead CTR
  around 20%, detecting a 3-point change at 80% power needs roughly
  2,900 sessions per arm. The report holds back the comparison until
  each arm has at least 100 sessions (filter
  `infinity_hero_min_sessions`), but 100 only catches large effects.
- **Read the experiment table, not the players table.** Visitors choose
  whether to play with the hole, so "players click more" is
  self-selection. The holdout comparison is randomised.
- **Set the holdout back to 0** once there's an answer.

## Suggested order

Phase 1 and the metrics (item 12) are done. Run the holdout experiment
to a decided sample size before building Phase 2, so we know whether
interactivity is helping article clicks. Then items 5 and 8, which are
the most "Parker's Physics" in spirit. Item 9 only if the spin slider
ships.
