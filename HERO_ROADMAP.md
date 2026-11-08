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
| Theme crossfade | Night ↔ paper palette follows the site toggle. |

## Phase 1: small, high-value (≈1–2 days)

1. **Accessible "Feed the black hole" button.** A small ghost button in
   the hero corner that calls the same `feed()`, for keyboard and
   screen-reader users who can't click the bare backdrop. A visually
   hidden live region reads out one line ("Accretion flare: 4 seconds").
   Hidden under reduced motion.
2. **Read → spaghettify transition.** Clicking the lead card fires a
   short feed (≈350 ms) and pulls the card's content toward the hole
   with a CSS transform before navigating. Uses the View Transitions
   API where supported and plain navigation everywhere else. It must
   never delay navigation by more than 400 ms, and the transition is
   skipped for modifier-clicks and middle-clicks.
3. **Category tint.** Pass the lead article's pillar (Health, Space,
   Mind, Travel) to the shader as a uniform that shifts the disk palette
   slightly: teal for anatomy, ember for space, violet for mind, gold
   for travel. One `uniform vec3`, no extra cost.
4. **Pointer gravitational lens on the sky.** A second, weak lens
   centred on the cursor that bends the starfield and nebula as it
   passes, as if a small mass is moving across the sky. Only the
   background lookup changes, so the cost is the existing lens maths
   once more. Mouse only, not touch.

## Phase 2: "play with it" (≈3–5 days)

5. **Drag to orbit.** Dragging on the empty backdrop changes the
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
12. **Engagement metrics.** Send hover-stir, feed, drag and panel-open
    counts plus lead-card click-through through the existing RUM
    pipeline (`assets/js/rum.js`, `inc/analytics-rum.php`), to find out
    whether the interactions help or hurt article clicks before
    expanding them.

## Suggested order

Phase 1 items 1 and 2 first: they are about accessibility and the
article funnel. Next, item 12, so every later item can be measured. Then
items 5 and 8, which are the most "Parker's Physics" in spirit. Item 9
only if the spin slider ships.
