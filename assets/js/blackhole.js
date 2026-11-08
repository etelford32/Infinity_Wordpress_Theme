/**
 * Black hole accretion disk — WebGL backdrop for the front-page hero.
 *
 * Two passes, no dependencies:
 *  1. Disk pass: tilted accretion disk with seam-free plasma
 *     filaments, differential rotation, doppler beaming and
 *     relativistic color shift, a lensed far-side arc, photon ring,
 *     starfield — composited in 3D: the near side of the disk passes
 *     IN FRONT of the event horizon, the far side is occluded by it.
 *  2. Particle pass: ~220 additive spark particles on inspiral
 *     trajectories, heating white as they fall in.
 *
 * ~30fps cap, DPR cap, pauses off-screen, static frame under
 * prefers-reduced-motion, CSS fallback when WebGL is missing.
 *
 * With cfg.followTheme the scene tracks the site's light/dark toggle:
 * u_light crossfades the whole palette from incandescent-on-black to
 * ink-on-paper — deep ember disk, gold photon ring, no starfield, and
 * sparks that composite over the page instead of adding light to it.
 * Instances sitting on their own dark backdrop (Parker's stage) leave
 * followTheme off and stay in the night palette.
 *
 * With cfg.interactive the scene answers the pointer. Hovering stirs
 * the plasma — finer turbulence, a thicker disk, harder doppler
 * beaming and faster differential rotation, ramping with proximity to
 * the hole. Clicking anywhere in the section triggers a feeding event:
 * the disk flares white-hot, most of the swarm drops onto inspiral
 * orbits, a shock ring runs outward and relativistic jets fire from
 * both poles, all decaying over ~4s. Rotation runs off u_spin, an
 * accumulated clock, so those rate changes never teleport the phase.
 * Interaction is skipped under prefers-reduced-motion, where the scene
 * is a single static frame.
 */

/* The pre-paint boot script in <head> owns data-mode; the toggle keeps
   it in sync and announces changes on the infinity:theme event. */
function infinityThemeIsLight() {
  'use strict';
  return document.documentElement.getAttribute('data-mode') === 'light';
}

function infinityBlackhole(canvas, cfg) {
  'use strict';

  var gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) {
    canvas.classList.add('fp-blackhole-fallback');
    return;
  }

  /* ---------- shared ---------- */

  /* How many heights the disk is integrated over. The vertical
     structure is the expensive half of this shader — each slice is a
     seam-blended fbm pair, so three slices is three times the noise of
     a flat disk — and WebGL1 needs a constant loop bound, so the count
     is baked into the source rather than passed as a uniform.

     k must stay symmetric about the midplane at any count, and the
     weights must sum to the same total, or dropping a slice would both
     tilt the disk and change how bright it is. */
  var SLICES = Math.max(1, (cfg && cfg.slices) || 3);
  var K_EXPR = (SLICES > 1)
    ? (1 / (SLICES - 1) * 2).toFixed(4) + ' * (' + ((SLICES - 1) / 2).toFixed(4) + ' - float(i))'
    : '0.0';
  var SLICE_NORM = (function () {
    var sum = 0;
    for (var i = 0; i < SLICES; i++) {
      var k = (SLICES > 1) ? (2 / (SLICES - 1)) * ((SLICES - 1) / 2 - i) : 0;
      sum += Math.exp(-k * k * 0.95);
    }
    return (1.49 / sum).toFixed(4);
  })();

  /* Einstein radius of the lensed background galaxy, shared by the
     shader and the JS that back-traces the cursor through the lens to
     let visitors grab it. */
  var GAL_THETA = 0.40;

  var QUAD_VERT = [
    'attribute vec2 a_pos;',
    'void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n');

  var DISK_FRAG = [
    'precision highp float;',
    'uniform vec2 u_res;',
    'uniform float u_time;',
    'uniform vec2 u_center;',
    'uniform float u_zoom;',
    'uniform float u_variant;',
    'uniform float u_light;', /* 0 = night sky, 1 = ink on paper */
    'uniform float u_spin;',  /* warped rotation clock, not wall time */
    'uniform float u_hover;', /* 0..1 pointer proximity to the hole */
    'uniform float u_feed;',  /* 1 on a feeding event, decaying to 0 */
    'uniform vec3 u_probe;',  /* pointer lens: xy in hole-relative uv, z strength */
    'uniform vec4 u_tint;',   /* pillar grade: rgb hue, a amount (0 = none) */
    'uniform float u_elev;',  /* camera elevation above the disk plane (rad) */
    'uniform float u_phi;',   /* precession azimuth of the disk normal (rad) */
    'uniform float u_kerr;',  /* dimensionless spin a* = a/M, 0..0.998 */
    'uniform vec2 u_gal;',    /* lensed galaxy\'s true (source-plane) position */
    'uniform sampler2D u_plasma;', /* particle-driven heat (r) and turbulence (g), polar */
    'uniform float u_plasmaOn;',
    '',
    'float hash(vec2 p) {',
    '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);',
    '}',
    '',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),',
    '             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);',
    '}',
    '',
    'float fbm(vec2 p) {',
    '  float v = 0.0;',
    '  float a = 0.55;',
    '  for (int i = 0; i < 3; i++) {',
    '    v += a * noise(p);',
    '    p = p * 2.1 + vec2(17.3, 9.1);',
    '    a *= 0.5;',
    '  }',
    '  return v;',
    '}',
    '',
    '/* Pillar grade. Recolours toward a hue while keeping each pixel\'s',
    '   luminance, so the filaments, beaming and hot inner edge all',
    '   survive - a multiply cannot turn ember into teal, this can. */',
    'vec3 grade(vec3 c) {',
    '  float l = dot(c, vec3(0.299, 0.587, 0.114));',
    '  /* on paper the ramp is dark pigment, where a luminance grade',
    '     reads as grey; there it only leans toward the hue */',
    '  return mix(c, l * u_tint.rgb * 1.12, u_tint.a * (1.0 - 0.6 * u_light));',
    '}',
    '',
    '/* Relativistic jets. One beam per pole, mirrored through the disk',
    '   plane: a narrow throat opening into a cone, internal shocks',
    '   riding outward, and a slow helical wobble from the twisted',
    '   field lines. Returns emission, not color. */',
    'float jetBeam(vec2 uv, float spin, float feed, float wide) {',
    '  float along = abs(uv.y);',
    '  float wob = 0.02 * sin(along * 9.0 - spin * 2.6) * smoothstep(0.12, 0.8, along);',
    '  float across = abs(uv.x - wob);',
    '  float w = (0.011 + 0.016 * along + 0.05 * along * along) * wide;',
    '  float q = across / w;',
    '  float core = exp(-q * q);',
    '  float sheath = exp(-q * q * 0.28) * 0.18;',
    '  /* clears the horizon before it lights up, and punches further',
    '     out the harder the hole is feeding */',
    '  float launch = smoothstep(0.10, 0.26, along);',
    '  float reach = 1.0 - smoothstep(0.30 + 0.55 * feed, 0.55 + 0.85 * feed, along);',
    '  /* internal shocks: beads along the beam, not blobs — shallow',
    '     modulation at a high enough rate to read as structure */',
    '  float knots = 0.74 + 0.26 * sin(along * 27.0 - spin * 5.5);',
    '  return (core * knots + sheath) * launch * reach;',
    '}',
    '',
    'void main() {',
    '  vec2 uv = (gl_FragCoord.xy - u_center * u_res) / u_res.y;',
    '  uv *= u_zoom;',
    '  /* A small fixed cant to the whole frame. The motion that used to',
    '     live here now lives in the disk plane itself, where it belongs —',
    '     rocking the frame swung the starfield and the photon ring too,',
    '     which is not a thing a precessing disk does to the sky. */',
    '  float tilt = -0.10;',
    '  uv = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * uv;',
    '',
    '  /* ---- The disk is a slab, not a sheet ----',
    '',
    '     Inclination first. squash is the foreshortening, so sinE = 1/squash',
    '     is the sine of the viewing elevation above the disk plane and cosE',
    '     falls out of it. A point sitting h above the midplane lands at',
    '     screen-y  Y*sinE + h*cosE, so reading the disk AT height h is just',
    '     sampling the plane at (uv.y - h*cosE). The whole third dimension is',
    '     that one shift.',
    '',
    '     Three heights through the scale height, integrated front to back.',
    '     From ~17 degrees above the plane the TOP of the slab is the near',
    '     face, so k runs +1 -> -1 and every layer absorbs the ones behind',
    '     it. That self-occlusion is what stops the stack reading as three',
    '     stacked sheets and starts it reading as a body.',
    '',
    '     The disk flares: H grows with radius, so the outer disk is thick',
    '     and the inner disk is thin. True of real disks, and the reason the',
    '     near edge cuts a solid silhouette across the hole instead of a',
    '     ribbon. Stirring and feeding puff it further. */',
    '  /* ---- Orientation: the disk tips and precesses ----',
    '',
    '     The plane is not fixed any more. Its normal is tipped from the',
    '     view axis and that tilt points along azimuth phi, and the whole',
    '     map from screen to disk plane collapses to: rotate by -phi, then',
    '     divide one axis by sin(elev). The old constant squash was exactly',
    '     the 1/sin(elev) of that, with phi pinned at 90 degrees.',
    '',
    '     elev breathes, so the disk opens toward the viewer and closes',
    '     again — that is the vertical revolve. phi precesses, so the high',
    '     point of the rim walks around the hole — that is the wobble. Both',
    '     are slow, on purpose: this sits behind a wordmark someone is',
    '     trying to read.',
    '',
    '     Lense-Thirring precession falls off steeply with radius, so phi is',
    '     a function of r as well as t: the inner disk leads the outer one',
    '     and the plane twists rather than tipping rigidly. A warp, not a',
    '     rocking plate — and the twist is the part that reads as depth.',
    '',
    '     The jets are deliberately NOT rotated by any of this. They ride',
    '     the hole spin axis, which is the axis the disk precesses around,',
    '     so the disk wobbles and the beams hold still. */',
    '  /* The camera now lives in JS (u_elev), so a drag can tilt it and',
    '     scrolling can lay the disk edge-on; the breathing, stir and feed',
    '     terms that used to be summed here are summed there instead. */',
    '  float elev = u_elev;',
    '  float sinE = max(sin(elev), 0.12);',
    '  float squash = 1.0 / sinE;',
    '  float cosE = sqrt(max(1.0 - sinE * sinE, 0.0));',
    '',
    '  /* Provisional radius off the unprecessed plane, used only to drive',
    '     the radial term of the warp: the warp cannot depend on itself. */',
    '  float r0 = length(vec2(uv.x, uv.y * squash));',
    '  float lag = 0.80 / (0.55 + r0 * r0 * 4.0);',
    '  float phi = u_phi + lag * 0.30 * sin(u_time * 0.147 + 0.7);',
    '',
    '  float cp = cos(phi);',
    '  float sp = sin(phi);',
    '',
    '  /* a: along the tilt azimuth — the axis the disk foreshortens on.',
    '     b: along the line of nodes, where it keeps its true width. */',
    '  float a0 =  uv.x * cp + uv.y * sp;',
    '  float b0 = -uv.x * sp + uv.y * cp;',
    '',
    '  vec2 p = vec2(b0, -a0 * squash);',
    '  float r = length(p);',
    '  float ang = atan(p.y, p.x);',
    '',
    '  /* ---- Kerr shadow ----',
    '     A spinning hole\'s shadow is not a circle. Photons orbiting with',
    '     the spin (prograde) can skim much closer than those orbiting',
    '     against it, so seen from near the equator the shadow is flattened',
    '     on the approaching side - the side the disk beams toward us,',
    '     +b0 here - and bulges slightly on the receding one: the Kerr "D".',
    '     How much depends on a*^2 and on how edge-on we sit (cosE), which',
    '     is why winding the spin up visibly squares one side off.',
    '',
    '     Every ring, arc and the horizon itself are measured off rc, so',
    '     reshaping rc here bends all of them into the D together. */',
    '  vec2 nodeDir = vec2(-sp, cp);',
    '  float rc0 = length(uv * vec2(1.0, 1.12));',
    '  float cosA = dot(uv, nodeDir) / max(length(uv), 1e-4);',
    '  float kEdge = u_kerr * u_kerr * cosE;',
    '  float flatSide = 0.30 * kEdge * pow(max(cosA, 0.0), 3.0);',
    '  float bulge = 0.07 * kEdge * max(-cosA, 0.0);',
    '  float rc = rc0 / max(1.0 - flatSide, 0.5) * (1.0 - bulge);',
    '  float rsky = length(uv);',
    '  /* Radius remap. A small 1/r pull so the hot inner annulus crowds',
    '     toward the hole. It used to be 0.05/r, which pushed the disk\'s',
    '     inner edge out to ~2.6x the shadow radius and left dark gaps either',
    '     side of the hole - the "eye" look. In a real Schwarzschild image',
    '     the ISCO (6M) sits just outside the shadow (~5.2M), so at 0.02 the',
    '     disk nearly touches the shadow at the line of nodes, as it should. */',
    '  float rr = r - 0.02 / max(r, 0.06);',
    '',
    '  /* Meridional cross-section. A slab of constant thickness is not',
    '     what a thick disk looks like: the half-height swells in the middle',
    '     and thins toward both edges, which is an ellipse in the (r, z)',
    '     plane — the torus cross-section a real thick disk has, skewed',
    '     fatter outward because disks flare. */',
    '  float tq = clamp((rr - 0.50) / 0.46, -1.0, 1.0);',
    '  float H = (0.082 + 0.042 * u_hover + 0.072 * u_feed)',
    '          * sqrt(max(1.0 - tq * tq, 0.0)) * (0.60 + 0.70 * clamp(rr, 0.0, 1.0));',
    '',
    '  /* The ISCO moves in as the spin rises (6M at a* = 0, ~1.2M at',
    '     0.998 for prograde orbits), so the inner edge of the disk follows',
    '     u_kerr and creeps toward the shadow as the hole is wound up. */',
    '  float iscoK = mix(1.14, 0.80, u_kerr);',
    '',
    '  float bright = 0.0;',
    '  float trans = 1.0;',
    '  float heatAcc = 0.0;',
    '  float topFace = 0.0;',
    '',
    '  for (int i = 0; i < ' + SLICES + '; i++) {',
    '    float k = ' + K_EXPR + ';',
    '    /* A height h above the plane displaces on screen along the tilt',
    '       azimuth by h*cosE — direction (cp, sp), not straight up. */',
    '    vec2 sxy = uv - (k * H * cosE) * vec2(cp, sp);',
    '    float aS =  sxy.x * cp + sxy.y * sp;',
    '    float bS = -sxy.x * sp + sxy.y * cp;',
    '    float rho = max(length(sxy), 1e-4);',
    '',
    '    /* ---- Light bends, so intersect a bent ray ----',
    '',
    '       The near side of the disk sits in front of the hole: the ray',
    '       reaching us from it never went past the hole, so it travels',
    '       straight. The far side is behind, and what arrives from there',
    '       has swung around the hole and comes in lifted — which is why a',
    '       real accretion disk appears to curl up over its own black hole',
    '       and back under it. Here that curl is the geometry doing it, not',
    '       an arc painted on at a fixed radius.',
    '',
    '       Trace backwards: straight out to closest approach, bend toward',
    '       the axis by the weak-field 2Rs/b, then intersect the disk',
    '       plane. Capped near the photon sphere, where 2Rs/b runs away and',
    '       the weak-field form stops meaning anything. The bend ramps in',
    '       only on the far side (aS > 0); on the near side it is zero and',
    '       this collapses exactly to the straight-line intersection. */',
    '    /* The cap is not cosmetic. 2Rs/b runs away at the photon sphere,',
    '       and the harder the bend near the hole the deeper inside the ISCO',
    '       the far side samples — which opens a dead band between the ring',
    '       and where the lensed disk starts. At 0.34 that band is ~0.05 in',
    '       screen radius, tight enough to read as an inner shadow rather',
    '       than a hole in the picture, and the far side is still compressed',
    '       from a radius of ~0.98 down to ~0.33: strong lensing, not a',
    '       shear. */',
    '    float defl = min(0.145 / max(rho, 0.125), 0.34) * smoothstep(-0.01, 0.10, aS);',
    '    float ca = cos(defl);',
    '    float sa = sin(defl);',
    '    float den = max(ca * sinE + sa * aS * cosE / rho, 0.02);',
    '    float uu = (aS * cosE) / den;',
    '    float mm = 1.0 - uu * sa / rho;',
    '    vec2 ps = vec2(mm * bS, -sinE * mm * aS - cosE * uu * ca);',
    '    float rs = length(ps);',
    '    float as = atan(ps.y, ps.x);',
    '    /* what the particles have done to the gas here: heat and stirring',
    '       from the plasma field, in the same polar disk coordinates */',
    '    vec2 pl = u_plasmaOn > 0.5 ? texture2D(u_plasma, vec2(as / 6.2831853, rs)).rg : vec2(0.0);',
    '    float rrs = rs - 0.02 / max(rs, 0.06);',
    '',
    '    /* Differential rotation. Driven by u_spin, an accumulated clock',
    '       the JS warps on hover — scaling wall time here instead would',
    '       teleport the phase every time the rate changed. */',
    '    float sw = as - u_spin * 0.55 - 1.4 / (0.25 + rrs * rrs);',
    '    /* stirred gas: the filaments are pushed about where turbulence is */',
    '    sw += pl.g * 1.1 * sin(rs * 70.0 + as * 5.0 + u_time * 2.6) * sin(as * 13.0 - rs * 31.0 + u_time * 1.3);',
    '',
    '    /* Seam-free filaments: blend across the atan wrap at +-PI */',
    '    float wSeam = smoothstep(2.4, 3.14159, abs(as)) * 0.5;',
    '    float sA = fbm(vec2(sw * 2.3, rrs * 10.0 - u_spin * 0.1));',
    '    float sB = fbm(vec2((sw - sign(as) * 6.2831853) * 2.3, rrs * 10.0 - u_spin * 0.1));',
    '    float streakS = pow(mix(sA, sB, wSeam), 1.6);',
    '',
    '    float diskS = smoothstep(0.155 * iscoK, 0.26 * iscoK, rrs) * (1.0 - smoothstep(0.5, 0.95, rrs));',
    '    float e = diskS * (0.24 + 1.3 * streakS) * exp(-k * k * 0.95);',
    '    /* heated gas glows: wakes burn brighter along the particle paths */',
    '    e *= 1.0 + 4.0 * pl.r;',
    '    heatAcc += pl.r * trans * exp(-k * k);',
    '',
    '    /* Orbiting hot spot: a compact flare just outside the ISCO, the',
    '       kind seen circling Sgr A* in the infrared. It orbits faster than',
    '       the filament pattern, is sheared into an arc along its orbit,',
    '       and waxes and wanes on a slow cycle. Doppler beaming is applied',
    '       to the whole column afterwards, so it blazes on the approaching',
    '       side and fades on the receding one. Feeding makes it flare. */',
    '    float spotAng = u_spin * 0.95 + 1.3;',
    '    float dAng = mod(as - spotAng + 3.14159265, 6.2831853) - 3.14159265;',
    '    float dR = rrs - 0.235;',
    '    float spot = exp(-(dR * dR) / 0.0011 - (dAng * dAng * rrs * rrs) / 0.0075);',
    '    spot *= (0.55 + 0.45 * sin(u_time * 0.23)) * (1.0 + 1.6 * u_feed);',
    '    e += spot * 1.5 * exp(-k * k * 1.6);',
    '',
    '    /* Spiral density waves: a two-armed logarithmic spiral, the m = 2',
    '       mode that tidal and magnetorotational turbulence excite in real',
    '       disks. Its pattern turns at about half the gas speed, so the gas',
    '       streams through the arms and they shear rather than ride along. */',
    '    float arms = 0.72 + 0.28 * cos(2.0 * (as - u_spin * 0.28) + 7.5 * log(max(rrs, 0.05)));',
    '',
    '    /* Accretion ripples: density rings drifting inward - phase constant',
    '       along decreasing radius as time runs - the slow radial inflow',
    '       that feeds the hole, made visible. */',
    '    float ripple = 1.0 + 0.10 * sin(rrs * 58.0 + u_spin * 2.4);',
    '    e *= arms * ripple;',
    '',
    '    bright += e * trans;',
    '    topFace += e * trans * max(k, 0.0);',
    '    trans *= 1.0 - clamp(e * 0.62, 0.0, 0.80);',
    '  }',
    '',
    '  /* The stack sums brighter than one sheet did, by exactly the sum',
    '     of its vertical weights — so the correction is computed from the',
    '     slice count, not guessed per quality level. */',
    '  bright *= ' + SLICE_NORM + ';',
    '',
    '  /* The upper face is what the light leaves by, so it reads brighter',
    '     than the column beneath it — the cue that says "this has a top". */',
    '  bright += topFace * 0.20;',
    '',
    '  /* Quasi-periodic oscillations: the inner disk breathes at two',
    '     incommensurate frequencies, as the X-ray light curves of accreting',
    '     holes do (a fast high-frequency QPO and a slow low-frequency one),',
    '     fading out by mid-disk where the oscillation modes live no longer. */',
    '  bright *= 1.0 + (0.09 * sin(u_time * 2.9) + 0.06 * sin(u_time * 0.71 + 1.0)) * smoothstep(0.52, 0.20, rr);',
    '',
    '  /* Radial profile of the midplane, still wanted for the inner rim */',
    '  float disk = smoothstep(0.155 * iscoK, 0.26 * iscoK, rr) * (1.0 - smoothstep(0.5, 0.95, rr));',
    '',
    '  /* Hover churns the plasma: a finer turbulence layer rides on the',
    '     filaments and the contrast between them sharpens. Applied to the',
    '     integrated column rather than per slice — one noise() instead of',
    '     three, and over one scale height the layers churn together anyway. */',
    '  if (u_hover > 0.002) {',
    '    float swirl = ang - u_spin * 0.55 - 1.4 / (0.25 + rr * rr);',
    '    float fine = noise(vec2(swirl * 7.5, rr * 26.0 - u_spin * 0.7));',
    '    bright = mix(bright, bright * (0.5 + 1.05 * fine), u_hover * 0.9);',
    '  }',
    '',
    '  /* Doppler beaming, harder when the disk is spun up. Measured along',
    '     the line of nodes, so the bright limb travels with the disk',
    '     instead of staying pinned to the left of the screen. */',
    '  float doppler = 1.0 + (0.55 + 0.3 * u_hover) * (b0 / max(r, 0.001));',
    '  bright *= doppler;',
    '  bright *= 1.0 + 0.5 * u_hover + 0.85 * u_feed;',
    '',
    '  /* 3D shading: lit from above, near side in shadow. Along the tilt',
    '     azimuth, since that is which way "near" now points. */',
    '  float vshade = 0.78 + 0.5 * smoothstep(-0.3, 0.35, a0);',
    '  bright *= vshade;',
    '  bright *= 1.0 + 0.35 * u_variant;',
    '',
    '  /* Emissivity falls steeply with radius. A thin disk radiates as',
    '     T^4 with T ~ r^-3/4, so the inner annulus should own the picture',
    '     and the outer disk fade into the sky instead of ending at a',
    '     painted edge. A softened version of that: full strength inside',
    '     the ISCO region, down to about a third at the rim. */',
    '  bright *= mix(1.12, 0.36, smoothstep(0.28, 0.92, rr));',
    '',
    '  /* Photon ring + lensed far-side arc (soft lower boundary).',
    '     The ring is made of disk light, so it is beamed like the disk:',
    '     brighter on the approaching limb, dimmer on the receding one.',
    '     A ring of uniform brightness is the tell of one drawn by hand. */',
    '  float ringDop = clamp((-uv.x * sp + uv.y * cp) / max(rc, 0.001), -1.0, 1.0);',
    '  float ringBeam = 1.0 + 0.55 * ringDop;',
    '  float photon = exp(-pow((rc - 0.148) * 105.0, 2.0)) * (1.0 + 1.4 * u_feed) * ringBeam;',
    '',
    '  /* Second-order image: light that looped the hole once more before',
    '     escaping, landing just inside the primary ring and far thinner.',
    '     It is what makes the ring read as a stack of images of the disk',
    '     rather than a circle somebody drew. */',
    '  float photon2 = exp(-pow((rc - 0.1335) * 250.0, 2.0)) * (0.5 + 1.0 * u_feed) * ringBeam;',
    '',
    '  /* Photon-ring echoes. Light from the hot spot that loops the hole',
    '     once more before escaping lands on the photon ring, on the far',
    '     side and late by the extra orbit - so a bright knot circulates the',
    '     ring half a turn behind the spot itself, brightest in the thinner',
    '     second-order ring. The ring shows what the horizon hides: this is',
    '     the observable face of the region around the singularity. */',
    '  float echoAng = u_spin * 0.95 + 1.3 - 0.85 + 3.14159;',
    '  vec2 echoDir = normalize(cos(echoAng) * nodeDir - sin(echoAng) * sinE * vec2(cp, sp) + 1e-5);',
    '  float echoCos = dot(uv / max(length(uv), 1e-4), echoDir);',
    '  float echo = exp((echoCos - 1.0) * 9.0) * (0.55 + 0.45 * sin(u_time * 0.23)) * (1.0 + 1.6 * u_feed);',
    '  photon *= 1.0 + 1.3 * echo;',
    '  photon2 *= 1.0 + 2.4 * echo;',
    '  float arc = exp(-pow((rc - 0.185) * 34.0, 2.0)) * smoothstep(-0.3, 0.55, a0 / max(rc, 0.001));',
    '  arc *= 0.55 + 0.45 * fbm(vec2(atan(uv.y, uv.x) * 2.5 - u_spin * 0.35, rc * 18.0));',
    '',
    '  /* The underside of the disk. Light leaving the bottom face of the',
    '     far disk is bent under the hole and arrives as a thin arc hugging',
    '     the bottom of the shadow - the counterpart of the curl over the',
    '     top, and the half of the picture that makes it read as a lens',
    '     rather than a disk with a hole punched in it. It sits in the gap',
    '     between the shadow and the near disk, so it is composited with',
    '     the far side and the near disk still crosses in front of it. */',
    '  float skyAng = atan(uv.y, uv.x);',
    '  float under = exp(-pow((rc - 0.166) * 62.0, 2.0)) * smoothstep(0.30, -0.65, a0 / max(rc, 0.001));',
    '  under *= 0.55 + 0.45 * noise(vec2(skyAng * 6.0 + u_spin * 0.55, rc * 24.0));',
    '  under *= ringBeam * (1.0 + 0.9 * u_feed);',
    '',
    '  /* The far inner disk, lensed over the top of the shadow. The bent',
    '     ray above samples the outer far disk well; it does not reach the',
    '     hot inner annulus, which at this inclination projects behind the',
    '     horizon and survives only as the image wrapped over the top. That',
    '     image is laid in here directly: each screen radius just outside',
    '     the ring shows a disk radius out from the ISCO, compressed about',
    '     2.6x, carrying the same differential rotation and filaments as the',
    '     disk itself so the two read as one body. The angle is measured',
    '     with its seam straight down, under the shadow, where the arc is',
    '     masked off anyway. */',
    '  float upper = smoothstep(-0.22, 0.52, a0 / max(rc, 0.001));',
    '  float rArc = 0.19 + max(rc - 0.150, 0.0) * 2.6;',
    '  float arcProf = smoothstep(0.142, 0.160, rc) * (1.0 - smoothstep(0.19, 0.30, rc));',
    '  float arcAng = atan(-uv.x, uv.y);',
    '  float arcSw = arcAng - u_spin * 0.55 - 1.4 / (0.25 + rArc * rArc);',
    '  float arcS = pow(fbm(vec2(arcSw * 2.3, rArc * 10.0 - u_spin * 0.1)), 1.6);',
    '  float farImg = arcProf * upper * (0.30 + 1.15 * arcS) * (0.75 + 0.25 * ringBeam);',
    '  farImg *= 1.0 + 0.5 * u_hover + 0.85 * u_feed;',
    '',
    '  /* Event horizon silhouette */',
    '  float horizon = 1.0 - smoothstep(0.118, 0.138, rc);',
    '',
    '  /* Near/far split: below passes in front, above goes behind */',
    '  float nearMask = smoothstep(0.06 + H * cosE, -0.06 - H * cosE, a0);',
    '  float farMask = 1.0 - nearMask;',
    '',
    '  /* Incandescent color ramp. In light mode the same ramp is',
    '     re-cast as pigment: darker and more saturated, so the disk',
    '     prints against a pale page instead of washing out. */',
    '  vec3 hot   = mix(vec3(1.0, 0.98, 0.93), vec3(1.0, 0.86, 0.52), u_light);',
    '  vec3 gold  = mix(vec3(1.0, 0.78, 0.40), vec3(0.93, 0.52, 0.10), u_light);',
    '  vec3 ember = mix(vec3(0.98, 0.42, 0.14), vec3(0.68, 0.18, 0.04), u_light);',
    '  /* The cool outer disk: a dusky rose that cools toward violet,',
    '     not a saturated purple band - it should read as gas thinning',
    '     out, not as a second ring. */',
    '  vec3 viol  = mix(vec3(0.62, 0.26, 0.48), vec3(0.62, 0.26, 0.20), u_light);',
    '  vec3 col = mix(hot, gold, smoothstep(0.17, 0.34, rr));',
    '  col = mix(col, ember, smoothstep(0.34, 0.60, rr));',
    '  col = mix(col, viol, smoothstep(0.72, 1.06, rr));',
    '  /* heated wakes run whiter than the gas around them */',
    '  col = mix(col, hot, clamp(heatAcc * 0.8, 0.0, 0.7));',
    '',
    '  /* Relativistic color shift */',
    '  float dop = clamp(b0 / max(r, 0.001), -1.0, 1.0);',
    '  col = mix(col, col * vec3(0.85, 0.92, 1.35) + vec3(0.12), clamp(dop, 0.0, 1.0) * 0.4);',
    '  col = mix(col, col * vec3(1.25, 0.62, 0.42), clamp(-dop, 0.0, 1.0) * 0.45);',
    '',
    '  /* Variant 1 (Parker\'s): binary-logo palette — hard blue/orange split */',
    '  if (u_variant > 0.5) {',
    '    col = mix(col, col * vec3(0.5, 0.75, 1.9) + vec3(0.04, 0.1, 0.3), clamp(dop, 0.0, 1.0) * 0.5);',
    '    col = mix(col, col * vec3(1.6, 0.7, 0.3), clamp(-dop, 0.0, 1.0) * 0.45);',
    '  }',
    '',
    '  /* Pillar grade: the lead article\'s section nudges the palette -',
    '     teal for anatomy, green for science, violet for mind, gold for',
    '     travel; space keeps the native ramp. Feeding still mixes toward',
    '     white-hot afterwards, so a flare reads the same in every pillar. */',
    '  col = grade(col);',
    '',
    '  /* Feeding drives the whole ramp toward the white-hot end */',
    '  col = mix(col, hot, u_feed * 0.28);',
    '',
    '  /* Hot inner rim facing the viewer on the near side */',
    '  float rim = smoothstep(0.30, 0.17, rr) * smoothstep(0.14, 0.20, rr) * nearMask * disk;',
    '  col += hot * rim * (0.6 + 0.6 * u_feed);',
    '',
    '  /* ---- composite back-to-front ---- */',
    '  vec3 c = vec3(0.0);',
    '  float alpha = 0.0;',
    '',
    '  /* Stars (behind everything, hidden by the hole), gravitationally',
    '     lensed. A star behind the hole is seen further out than it',
    '     truly lies: apparent angle theta and true angle beta relate by',
    '     beta = theta - thetaE^2/theta. Sampling the field at beta',
    '     instead of theta drags the whole sky inward and stacks it',
    '     against the photon ring. The tangential stretch theta/beta is',
    '     what turns those stars into a bright rim instead of merely',
    '     moving them somewhere else. */',
    '  /* A second, much weaker point lens riding the pointer: as if a',
    '     small dark mass were drifting across the sky. Same thin-lens map',
    '     as the hole\'s (beta = theta - thetaE^2/theta), applied first, so',
    '     the cursor bends the starfield and nebula and then the hole bends',
    '     the result. It touches only the sky lookup - the disk, ring and',
    '     horizon are untouched - and the JS fades it out near the hole so',
    '     the two lenses never fight over the photon ring. */',
    '  vec2 skyUv = uv;',
    '  float probeRing = 0.0;',
    '  if (u_probe.z > 0.002) {',
    '    vec2 pp = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * u_probe.xy;',
    '    vec2 dP = uv - pp;',
    '    float rP2 = max(dot(dP, dP), 0.0009);',
    '    float tP = 0.085;',
    '    skyUv = uv - dP * min(tP * tP * u_probe.z / rP2, 1.4);',
    '    /* Diffuse background light (the nebula, unresolved stars) is',
    '       piled up at the Einstein radius into a faint ring - the one',
    '       visible sign of a lens with nothing bright behind it. */',
    '    probeRing = exp(-pow((sqrt(rP2) - tP) / 0.014, 2.0)) * u_probe.z * (1.0 - u_light);',
    '    /* lumpy, as the light behind it is: arcs, not a drawn circle */',
    '    probeRing *= 0.4 + 0.6 * noise(vec2(atan(dP.y, dP.x) * 2.2 + 5.0, u_time * 0.35));',
    '  }',
    '  /* Frame dragging twists the sky. A spinning lens does not just pull',
    '     background light inward, it drags it round with the spin, more',
    '     steeply the closer the ray passes - so the starfield and nebula',
    '     near the hole are swirled, and winding the spin up visibly twists',
    '     them. The twist ~ a / b^2 is a stylised version of the Kerr',
    '     lensing asymmetry; it is static for a steady spin, as a',
    '     stationary spacetime should be. */',
    '  float rTw = length(skyUv);',
    '  float twist = min(u_kerr * 0.0062 / (rTw * rTw + 0.0022), 1.6);',
    '  skyUv = mat2(cos(twist), sin(twist), -sin(twist), cos(twist)) * skyUv;',
    '  float rskyL = max(length(skyUv), 1e-4);',
    '',
    '  float thetaE = 0.175;',
    '  float lensR = max(rskyL - thetaE * thetaE / max(rskyL, 0.05), 0.012);',
    '  vec2 sky = (skyUv / rskyL) * lensR;',
    '  vec2 cell = floor(sky * u_res.y * 0.5 + 256.0);',
    '  float star = pow(hash(cell), 220.0) * smoothstep(0.132, 0.30, rsky);',
    '  star *= 0.55 + 0.45 * sin(u_time * 2.2 + hash(cell + 7.0) * 44.0);',
    '  /* Where beta collapses, neighbouring pixels land in the same hash',
    '     cell and a magnified star stops being a point and becomes a',
    '     visible block. Fade the field out just before that happens and',
    '     let the photon ring carry the rim it was already drawing. */',
    '  star *= smoothstep(0.018, 0.055, lensR);',
    '  star *= clamp(rskyL / max(lensR, 0.03), 1.0, 3.5);',
    '  star *= 1.0 - u_light; /* white pinpricks have nothing to show on white */',
    '  c += vec3(0.75, 0.82, 1.0) * star * 1.4 * (1.0 - horizon);',
    '  alpha += star * 1.2 * (1.0 - horizon);',
    '',
    '  /* A second, sparser layer of larger warm stars on a coarser grid,',
    '     so the field has depth instead of one even dusting. */',
    '  vec2 cell2 = floor(sky * u_res.y * 0.18 + 91.0);',
    '  float star2 = pow(hash(cell2), 420.0) * smoothstep(0.14, 0.34, rsky) * smoothstep(0.03, 0.08, lensR);',
    '  star2 *= 0.7 + 0.3 * sin(u_time * 1.3 + hash(cell2 + 3.0) * 40.0);',
    '  star2 *= (1.0 - u_light) * (1.0 - horizon);',
    '  c += vec3(1.0, 0.88, 0.72) * star2 * 1.6;',
    '  alpha += star2 * 1.2;',
    '',
    '  /* Background nebula, sampled through the same lens map as the',
    '     stars, so the sky visibly bends and piles up around the shadow -',
    '     the cue that sells the hole as a mass and not a decal. A diagonal',
    '     band with patchy dust, kept very faint: there is a headline and an',
    '     article card on top of it. Night only; on paper it would be grime. */',
    '  if (u_light < 0.999) {',
    '    float nb = fbm(sky * 2.4 + vec2(3.1, 7.7) + u_time * 0.004);',
    '    float band = exp(-pow((sky.y * 0.92 - sky.x * 0.38) * 1.6, 2.0));',
    '    float neb = smoothstep(0.38, 0.92, nb) * (0.30 + 0.70 * band);',
    '    neb *= smoothstep(0.02, 0.07, lensR) * (1.0 - horizon) * (1.0 - u_light);',
    '    vec3 nebCol = mix(vec3(0.20, 0.26, 0.55), vec3(0.50, 0.24, 0.46), noise(sky * 1.7 + 11.0));',
    '    c += nebCol * neb * 0.9;',
    '    alpha += neb * 0.10;',
    '  }',
    '',
    '  /* A background galaxy drifting behind the hole, imaged by inverse',
    '     ray-shooting: every pixel asks where its ray came from in the',
    '     source plane and samples the galaxy there. Nothing is drawn as an',
    '     arc - the arcs, the counter-image inside the Einstein radius on',
    '     the far side, their magnification and, at near-perfect alignment,',
    '     the full Einstein ring all fall out of the lens equation. The',
    '     unclamped map beta = theta (1 - thetaE^2 / theta^2) is used here,',
    '     unlike the starfield\'s, because the secondary image lives exactly',
    '     where that clamp cuts. Night only. */',
    '  /* The Einstein radius grows with how far behind the lens a source',
    '     sits, thetaE^2 ~ 4GM D_ls / (c^2 D_l D_s), and for anything truly',
    '     distant it dwarfs the shadow. The galaxy is the most distant thing',
    '     in the picture, so it gets the widest ring, out in dark sky beyond',
    '     the disk, where its arcs can be seen. */',
    '  if (u_light < 0.999) {',
    '    float thetaG = ' + GAL_THETA.toFixed(3) + ';',
    '    vec2 srcG = skyUv * (1.0 - thetaG * thetaG / max(rskyL * rskyL, 1e-4));',
    '    /* where the galaxy truly sits; JS drifts it, and visitors can',
    '       grab and drag it (see the galaxy section of the input code) */',
    '    vec2 gd = srcG - u_gal;',
    '    float gc = cos(0.6), gs = sin(0.6);',
    '    gd = vec2(gc * gd.x - gs * gd.y, gs * gd.x + gc * gd.y);',
    '    float galCore = exp(-(gd.x * gd.x / 0.0011 + gd.y * gd.y / 0.00035));',
    '    float galDisk = exp(-(gd.x * gd.x / 0.009 + gd.y * gd.y / 0.0024)) * 0.42;',
    '    float gal = (galCore + galDisk) * (1.0 - horizon) * (1.0 - u_light);',
    '    /* a warm bulge in a cool disk, kept below white so it reads as a',
    '       galaxy rather than a moon; magnified arcs still blaze */',
    '    c += mix(vec3(0.55, 0.68, 1.0), vec3(1.0, 0.86, 0.66), galCore / (gal + 1e-4)) * gal * 1.0;',
    '    alpha += gal * 0.62;',
    '  }',
    '',
    '  c += vec3(0.62, 0.72, 1.0) * probeRing * 1.3 * (1.0 - horizon);',
    '  alpha += probeRing * 0.6 * (1.0 - horizon);',
    '',
    '  /* Far side of the disk: occluded by the event horizon */',
    '  c += col * bright * farMask * (1.0 - horizon);',
    '  alpha += bright * 1.5 * farMask * (1.0 - horizon);',
    '',
    '  /* Underside image, lensed beneath the shadow */',
    '  c += grade(mix(vec3(1.0, 0.82, 0.55), vec3(0.92, 0.48, 0.10), u_light)) * under * 0.75 * (1.0 - horizon);',
    '  alpha += under * 0.62 * (1.0 - horizon);',
    '',
    '  /* Far inner disk, wrapped over the top of the shadow */',
    '  vec3 farCol = grade(mix(hot, gold, smoothstep(0.17, 0.34, rArc)));',
    '  c += farCol * farImg * 0.8 * (1.0 - horizon);',
    '  alpha += farImg * 1.25 * (1.0 - horizon);',
    '',
    '  /* The black hole itself: an opaque void. Nothing escapes it, so',
    '     nothing is allowed to be drawn over it either. */',
    '  alpha += horizon * 0.985;',
    '',
    '  /* Photon ring, lensed arc, bloom (outside the silhouette) */',
    '  c += mix(vec3(1.0, 0.94, 0.82), vec3(1.0, 0.72, 0.18), u_light) * photon * 0.9 * (1.0 - horizon);',
    '  /* The lensed far side is real geometry now, so this is back to',
    '     being what it should always have been: a little extra glow on the',
    '     ring, not a stand-in for the curl. */',
    '  c += mix(vec3(1.0, 0.91, 0.725), vec3(0.98, 0.60, 0.12), u_light) * arc * 0.26 * (1.0 - horizon);',
    '  c += mix(vec3(1.0, 0.94, 0.82), vec3(1.0, 0.78, 0.24), u_light) * photon2 * 0.7 * (1.0 - horizon);',
    '  float bloom = exp(-pow((rc - 0.148) * 13.0, 2.0)) * (1.0 - horizon);',
    '  c += mix(vec3(1.0, 0.8, 0.5), vec3(0.95, 0.55, 0.12), u_light) * bloom * 0.16;',
    '  alpha += (photon * 0.8 + photon2 * 0.55 + arc * 0.21) * (1.0 - horizon) + bloom * 0.12;',
    '',
    '  /* Jets and shock ring, drawn after the horizon so they emerge',
    '     from behind it and the near disk still crosses in front. The',
    '     branch is on a uniform, so every fragment takes it together',
    '     and idle frames never pay for the jet math. */',
    '  if (u_feed > 0.002) {',
    '    float jet = jetBeam(uv, u_spin, u_feed, mix(1.0, 1.5, u_light)) * u_feed;',
    '    c += mix(vec3(0.62, 0.82, 1.0), vec3(0.16, 0.28, 0.76), u_light) * jet * 1.15 * (1.0 - horizon);',
    '    /* pre-divided by the paper coverage gain below, which would',
    '       otherwise paint the beams on as flat opaque columns */',
    '    alpha += jet * mix(1.0, 0.5, u_light) * 1.05 * (1.0 - horizon);',
    '',
    '    /* The event throws a shock outward. Radius tracks the decay of',
    '       u_feed, so it leaves the horizon, slows and fades — and a',
    '       fresh click restarts it from the hole. */',
    '    float sr = 0.16 + (1.0 - u_feed) * 0.85;',
    '    float shock = exp(-pow((rc - sr) * mix(7.0, 20.0, u_feed), 2.0)) * pow(u_feed, 0.55);',
    '    shock *= 1.0 - horizon;',
    '    c += mix(vec3(1.0, 0.86, 0.62), vec3(0.95, 0.55, 0.10), u_light) * shock * 1.2;',
    '    alpha += shock * mix(1.0, 0.55, u_light) * 0.9;',
    '  }',
    '',
    '  /* Near side of the disk: drawn OVER the hole — the depth cue */',
    '  c += col * bright * nearMask;',
    '  alpha += bright * 1.5 * nearMask;',
    '',
    '  /* Coverage gain for paper: the canvas composites over a pale',
    '     section, so the disk needs to be near-opaque to read at all. */',
    '  alpha *= mix(1.0, 3.0, u_light);',
    '',
    '  /* Faint warm halo at night; on paper a soft slate shade so the',
    '     scene sits in the page rather than floating on it. Added after',
    '     the gain — tripled, it would smear a grey blob over the hero. */',
    '  float halo = (1.0 - smoothstep(0.0, mix(0.9, 0.6, u_light), rc)) * (1.0 - horizon);',
    '  c += mix(ember * 0.045, vec3(0.30, 0.34, 0.50) * 0.05, u_light) * halo;',
    '  alpha += mix(0.04, 0.13, u_light) * halo;',
    '',
    '  /* Corona: hot, thin gas above and below the inner disk scatters a',
    '     little cool light into a haze around it. Night only, very faint -',
    '     it adds depth around the hole without greying the sky. */',
    '  float corona = exp(-pow(rc / 0.34, 2.0)) * (1.0 - horizon) * (1.0 - u_light);',
    '  corona *= 1.0 + 0.6 * u_hover + 1.2 * u_feed;',
    '  c += grade(vec3(0.55, 0.62, 1.0)) * corona * 0.18;',
    '  alpha += corona * 0.035;',
    '',
    '  /* Filmic shoulder. With the disk hugging the hole, the inner',
    '     annulus, ring and hot spot stack well past 1.0 and clip to a flat',
    '     white blob. 1 - exp(-k L) is near-linear in the shadows and rolls',
    '     highlights off smoothly, so the filaments survive in the core.',
    '     Applied to luminance and the colour rescaled, not per channel -',
    '     per channel drains the fire to beige. Night only: on paper these',
    '     are pigments, not light. */',
    '  float lumIn = dot(c, vec3(0.299, 0.587, 0.114));',
    '  float lumOut = 1.0 - exp(-lumIn * 1.9);',
    '  c = mix(c * (lumOut / max(lumIn, 1e-4)), c, u_light);',
    '',
    '  /* Dither: +-half a step of 8-bit noise breaks up the banding the',
    '     long, dark halo and corona gradients otherwise show. */',
    '  float dith = hash(gl_FragCoord.xy + fract(u_time * 7.0) * 61.0) - 0.5;',
    '  gl_FragColor = vec4(c + dith / 255.0, clamp(alpha + dith / 255.0, 0.0, 1.0));',
    '}'
  ].join('\n');

  /* ---------- particle pass: infalling sparks ---------- */

  /* ---------- shared 3D projection for the geometry passes ----------

     World space: x, y in the disk plane, z up the spin axis, in the
     disk pass's own units. projectDisk() reproduces that pass's camera
     exactly - foreshortening by sin(elev) along the precession azimuth,
     height lifting along it by cos(elev), then undoing the frame's
     fixed cant - so sparks and twistor lines sit IN the disk rather
     than floating over a picture of it. z of the result is depth along
     the view ray, positive beyond the hole.

     lensBehind() is the point-lens primary image, theta = (beta +
     sqrt(beta^2 + 4 thetaE^2)) / 2, switched on only for points behind
     the hole. Anything passing behind is pushed out around the shadow
     instead of being drawn across it, and lines bend into arcs as they
     go round - the same lensing the disk pass ray-traces, applied per
     vertex. */
  var PROJ_GLSL = [
    'uniform float u_elev;',
    'uniform float u_phi;',
    'vec3 projectDisk(vec3 w) {',
    '  float sE = max(sin(u_elev), 0.12);',
    '  float cE = sqrt(max(1.0 - sE * sE, 0.0));',
    '  vec2 f = vec2(cos(u_phi), sin(u_phi));',
    '  vec2 n = vec2(-f.y, f.x);',
    '  vec2 uvR = w.x * n + (-w.y * sE + w.z * cE) * f;',
    '  float t = 0.10;',
    '  vec2 uvS = mat2(cos(t), -sin(t), sin(t), cos(t)) * uvR;',
    '  return vec3(uvS, -w.y * cE - w.z * sE);',
    '}',
    'vec2 lensBehind(vec2 sc, float depth) {',
    '  float b = length(sc);',
    '  float tE = 0.168 * smoothstep(0.0, 0.06, depth);',
    '  float th = 0.5 * (b + sqrt(b * b + 4.0 * tE * tE));',
    '  return sc * (th / max(b, 1e-4));',
    '}',
    'vec4 toClip(vec2 sc, vec2 res, vec2 center, float zoom) {',
    '  return vec4(sc / zoom * vec2(res.y / res.x, 1.0) * 2.0 + (center * 2.0 - 1.0), 0.0, 1.0);',
    '}'
  ].join('\n');

  /* One spark's orbit, shared by the spark pass and the plasma
     splats, so what deposits heat in the disk is exactly what is drawn.
     Returns (theta, r, fade, heat) in the disk plane; the including
     shader declares u_spin and u_feed. */
  var SPARK_FN = [
    'vec4 sparkOrbit(float pt, float seg) {',
    '  float seed = pt * 123.717;',
    '  /* Keplerian orbit params per particle */',
    '  float aAxis = mix(0.3, 0.95, fract(seed * 0.731));',
    '  float ecc   = mix(0.04, 0.42, fract(seed * 0.567));',
    '  float peri  = seed * 6.2831853;',
    '  float n     = 0.5 / pow(aAxis, 1.5); /* mean motion: inner = faster */',
    '  /* a fifth of the swarm is on doomed inspiral orbits, most of it',
    '     once the hole starts feeding */',
    '  float doomed = step(0.8 - 0.5 * u_feed, fract(seed * 0.293));',
    '  float cycle = fract(u_spin * 0.05 / aAxis + fract(seed * 3.137));',
    '  /* tail: the same orbit at an earlier phase, spaced near the sprite',
    '     size so a tail reads as a streak rather than a row of dots */',
    '  float theta = peri + u_spin * n - seg * 0.048;',
    '  float shrink = mix(1.0, mix(1.0, 0.16 / aAxis, pow(cycle, 1.6)), doomed);',
    '  float r = aAxis * shrink * (1.0 - ecc * ecc) / (1.0 + ecc * cos(theta - peri));',
    '  r = max(r, 0.125);',
    '  float heat = clamp((0.22 + 0.12 * u_feed) / r - 0.15, 0.0, 1.0) * (1.0 - seg * 0.08);',
    '  float tailFade = 1.0 - seg / 8.0;',
    '  float doomFade = mix(1.0, sin(cycle * 3.14159), doomed);',
    '  return vec4(theta, r, tailFade * tailFade * doomFade, heat);',
    '}'
  ].join('\n');

  var PART_VERT = [
    'precision highp float;',
    'attribute vec2 a_pt; /* x: particle seed, y: tail segment */',
    'uniform vec2 u_res;',
    'uniform vec2 u_center;',
    'uniform float u_zoom;',
    'uniform float u_spin;',
    'uniform float u_feed;',
    'varying float v_heat;',
    'varying float v_fade;',
    PROJ_GLSL,
    SPARK_FN,
    '',
    'void main() {',
    '  vec4 o = sparkOrbit(a_pt.x, a_pt.y);',
    '  /* the disk\'s own camera; sparks behind the hole are lensed round it */',
    '  vec3 pr = projectDisk(vec3(cos(o.x) * o.y, sin(o.x) * o.y, 0.0));',
    '  gl_Position = toClip(lensBehind(pr.xy, pr.z), u_res, u_center, u_zoom);',
    '  v_fade = o.z;',
    '  v_heat = o.w;',
    '  gl_PointSize = max(u_res.y * (0.011 + 0.004 * u_feed - a_pt.y * 0.0011), 1.0);',
    '}'
  ].join('\n');

  var PART_FRAG = [
    'precision mediump float;',
    'uniform float u_light;',
    'uniform vec4 u_tint;',
    'varying float v_heat;',
    'varying float v_fade;',
    '',
    'void main() {',
    '  float d = length(gl_PointCoord - 0.5);',
    '  float a = smoothstep(0.5, 0.0, d);',
    '  a *= a * v_fade;',
    '  vec3 cool = mix(vec3(1.0, 0.58, 0.24), vec3(0.72, 0.24, 0.04), u_light);',
    '  vec3 hotc = mix(vec3(1.0, 0.97, 0.9), vec3(0.95, 0.62, 0.12), u_light);',
    '  vec3 col = mix(cool, hotc, v_heat);',
    '  col = mix(col, dot(col, vec3(0.299, 0.587, 0.114)) * u_tint.rgb * 1.12, u_tint.a * (1.0 - 0.6 * u_light));',
    '  /* Night: premultiplied, drawn additively. Paper: straight color',
    '     under source-over, so a spark darkens the page instead of',
    '     brightening it (adding light to white does nothing). */',
    '  gl_FragColor = vec4(mix(col * a, col, u_light), a * mix(0.9, 1.0, u_light));',
    '}'
  ].join('\n');

  /* ---------- twistor pass: the Robinson congruence ----------

     Penrose's picture of a spinning field in twistor terms is a
     Robinson congruence: a family of twisting light rays which, at an
     instant, lie on nested tori as linked circles - every one threaded
     through every other - wrapped around a central ring, with the
     symmetry axis running through the middle. By the Kerr theorem the
     principal null congruence of a Kerr black hole is exactly such a
     shear-free, twisting congruence, wrapped around the ring of radius
     a. So this is not decoration laid over the hole: it is the hole's
     own null geometry, drawn.

     Construction: Hopf fibres. A point of S^3 is (z1, z2) with
       z1 = cos(th/2) e^{i psi},  z2 = sin(th/2) e^{i (psi + ph)}
     Fixing (th, ph) and sweeping psi traces one great circle (fibre);
     th picks the torus, ph the fibre on it. Stereographic projection
     (x1, x2, x3) / (1 - x4) carries the fibres to R^3 as linked
     circles: th = 0 is the core ring in the disk plane, th -> pi the
     spin axis. The ring radius tracks a*, as Kerr's ring does.

     Motion: the whole congruence is frame-dragged about the axis at a
     rate that rises with spin; light pulses run along every fibre (the
     rays are null, so this is what "flowing along the congruence"
     means); and the tori breathe slightly. Lines are 1px threads,
     additive at night, ink on paper. */
  /* th / pi for each torus. Fat tori: seen from near the disk plane,
     thin ones collapse into the disk band and vanish against it, while
     these loop up over and under the disk along the axis, into sky. */
  var TW_TORI = [0.42, 0.58, 0.72];
  var TW_FIBRES = 14;
  var TW_SEGS = 128;

  /* One point of the congruence in world space, shared by the line
     pass and the particles that ride it, so the two can never drift
     apart. Returns xyz; w is the fade for far-flung arcs. */
  var TW_FN = [
    'uniform float u_time;',
    'uniform float u_spin;',
    'uniform float u_kerr;',
    'vec4 twistorPoint(float th, float ph, float ps) {',
    '  float h = 0.5 * th + 0.04 * sin(u_time * 0.31 + ph * 2.0);',
    '  vec4 q = vec4(cos(h) * cos(ps), cos(h) * sin(ps), sin(h) * cos(ps + ph), sin(h) * sin(ps + ph));',
    '  float den = 1.0 - q.w;',
    '  vec3 P = q.xyz / max(den, 0.06);',
    '  float fade = smoothstep(0.06, 0.32, den) / (1.0 + 0.10 * dot(P, P));',
    '  P *= 0.13 + 0.12 * u_kerr;',
    '  float g = u_spin * (0.08 + 0.42 * u_kerr);',
    '  P.xy = mat2(cos(g), sin(g), -sin(g), cos(g)) * P.xy;',
    '  return vec4(P, fade);',
    '}'
  ].join('\n');

  var TW_VERT = [
    'precision highp float;',
    'attribute vec3 a_tw; /* th, ph, psi */',
    'uniform vec2 u_res;',
    'uniform vec2 u_center;',
    'uniform float u_zoom;',
    'uniform float u_feed;',
    'varying float v_a;',
    'varying float v_pulse;',
    'varying float v_depth;',
    'varying float v_torus;',
    PROJ_GLSL,
    TW_FN,
    '',
    'void main() {',
    '  float th = a_tw.x;',
    '  float ph = a_tw.y;',
    '  float ps = a_tw.z;',
    '  /* The ring radius tracks a*, as Kerr\'s ring does, but is drawn',
    '     out at the inner disk rather than at its true size (inside the',
    '     horizon), where the structure can be seen; the congruence is',
    '     frame-dragged about the axis; far-flung arcs fade. */',
    '  vec4 tp = twistorPoint(th, ph, ps);',
    '  vec3 P = tp.xyz;',
    '  v_a = tp.w;',
    '',
    '  vec3 pr = projectDisk(P);',
    '  v_depth = pr.z;',
    '  vec2 scr = lensBehind(pr.xy, pr.z);',
    '  gl_Position = toClip(scr, u_res, u_center, u_zoom);',
    '  /* threads crossing in front of the shadow are real, but additive',
    '     light on pure black reads as scribble: let them through dimmed */',
    '  v_a *= mix(0.3, 1.0, smoothstep(0.11, 0.19, length(scr * vec2(1.0, 1.12))));',
    '',
    '  /* two pulses per fibre, staggered fibre to fibre, racing harder',
    '     as the hole spins up and when it feeds */',
    '  float run = u_time * (1.1 + 1.8 * u_kerr + 3.0 * u_feed);',
    '  v_pulse = pow(0.5 + 0.5 * cos(2.0 * ps - run + ph * 3.0 + th * 5.0), 22.0);',
    '  v_torus = a_tw.x;',
    '}'
  ].join('\n');

  var TW_FRAG = [
    'precision mediump float;',
    'uniform float u_tw;',
    'uniform float u_light;',
    'uniform highp float u_feed; /* shared with the vertex stage: precisions must match */',
    'uniform vec4 u_tint;',
    'varying float v_a;',
    'varying float v_pulse;',
    'varying float v_depth;',
    'varying float v_torus;',
    '',
    'void main() {',
    '  /* inner tori cool blue, outer violet; pulses run white-gold */',
    '  /* saturated and cool on purpose: the disk is warm and bright, so',
    '     the congruence has to separate from it by hue, not by brightness */',
    '  vec3 base = mix(vec3(0.20, 0.78, 1.0), vec3(0.62, 0.40, 1.0), smoothstep(1.3, 2.3, v_torus));',
    '  vec3 hot = vec3(0.80, 0.97, 1.0);',
    '  vec3 col = mix(base, hot, v_pulse);',
    '  col = mix(col, dot(col, vec3(0.299, 0.587, 0.114)) * u_tint.rgb * 1.12, u_tint.a * 0.5);',
    '  /* depth cue: the far half of the congruence sits back */',
    '  float depthK = mix(1.0, 0.45, smoothstep(0.0, 0.25, v_depth));',
    '  float a = u_tw * v_a * depthK * (0.20 + 1.25 * v_pulse) * (1.0 + 1.2 * u_feed);',
    '  vec3 ink = mix(vec3(0.16, 0.20, 0.52), vec3(0.62, 0.30, 0.06), v_pulse);',
    '  gl_FragColor = vec4(mix(col, ink, u_light), clamp(a * mix(1.0, 0.8, u_light), 0.0, 1.0));',
    '}'
  ].join('\n');

  /* ---------- twistor particles: plasma riding the congruence ----------

     Charged plasma in a black-hole magnetosphere is tied to the field
     and streams along it, so these sparks travel along the Hopf fibres
     themselves - the null flow of the congruence - frame-dragged with
     it. Over a slow cycle each one also drifts across the tori, and
     which way decides its fate:
       circulate (most) - stay on their torus, looping the hole
       jet       - drift onto the near-axis fibres, which stereographic
                   projection stretches up the spin axis, and are flung
                   out along it: jet launching, in the Blandford-Znajek
                   spirit
       plunge    - drift onto the core ring and spiral in, heating
     Feeding tips the balance toward the jet and speeds everything up,
     as does spin. Stateless like the spark pass: every position is a
     function of time and a seed, and a tail is the same path sampled
     a little earlier. */
  /* One twistor-borne particle, shared by its draw pass and its
     plasma splat. Returns world position and life/far fade; kind is
     0 circulate, 1 jet, 2 plunge; heat rises as plungers fall. */
  var TWP_FN = [
    'uniform float u_feed;',
    'vec4 twParticle(float pt, float seg, out float kind, out float heat) {',
    '  float sd = pt * 97.31;',
    '  float pick = fract(sd * 0.173);',
    '  float jetCut = 0.62 - 0.30 * u_feed;',
    '  kind = pick < jetCut ? 0.0 : (pick < 0.86 ? 1.0 : 2.0);',
    '  float pace = 1.0 + 0.7 * u_kerr + 2.2 * u_feed;',
    '  float cyc = fract(u_time * (0.030 + 0.025 * fract(sd * 0.61)) * pace + fract(sd * 0.37));',
    '  cyc = max(cyc - seg * 0.0035, 0.0);',
    '  float th0 = mix(0.36, 0.70, fract(sd * 0.53)) * 3.14159265;',
    '  float ph = fract(sd * 0.917) * 6.2831853;',
    '  float drift = smoothstep(0.0, 1.0, cyc);',
    '  float th = th0;',
    '  if (kind > 0.5 && kind < 1.5) { th = mix(th0, 0.975 * 3.14159265, drift); }',
    '  if (kind > 1.5) { th = mix(th0, 0.05 * 3.14159265, pow(cyc, 1.4)); }',
    '  /* along the fibre: the null flow, racing with spin and feeding */',
    '  float ps = fract(sd * 0.29) * 6.2831853 + u_time * (0.55 + 0.9 * u_kerr + 1.8 * u_feed) - seg * 0.034;',
    '  vec4 tp = twistorPoint(th, ph, ps);',
    '  vec3 P = tp.xyz;',
    '  /* plungers are swallowed: pulled in toward the hole as they go */',
    '  if (kind > 1.5) { P *= mix(1.0, 0.30, pow(cyc, 3.0)); }',
    '  /* jets keep their far-flung light: they are meant to leave */',
    '  float far = kind > 0.5 && kind < 1.5 ? max(tp.w, 0.35 * smoothstep(0.4, 1.0, drift)) : tp.w;',
    '  heat = kind > 1.5 ? pow(cyc, 1.5) : 0.0;',
    '  return vec4(P, sin(3.14159265 * cyc) * clamp(far * 3.0, 0.0, 1.0));',
    '}'
  ].join('\n');

  var TWP_VERT = [
    'precision highp float;',
    'attribute vec2 a_tp; /* x: seed, y: tail segment */',
    'uniform vec2 u_res;',
    'uniform vec2 u_center;',
    'uniform float u_zoom;',
    'uniform float u_tail;',
    'varying float v_fade;',
    'varying float v_kind;',
    'varying float v_heat;',
    PROJ_GLSL,
    TW_FN,
    TWP_FN,
    '',
    'void main() {',
    '  float kind;',
    '  float heat;',
    '  vec4 q = twParticle(a_tp.x, a_tp.y, kind, heat);',
    '  vec3 pr = projectDisk(q.xyz);',
    '  vec2 scr = lensBehind(pr.xy, pr.z);',
    '  gl_Position = toClip(scr, u_res, u_center, u_zoom);',
    '  float tail = 1.0 - a_tp.y / u_tail;',
    '  v_fade = q.w * tail * tail;',
    '  v_fade *= mix(0.35, 1.0, smoothstep(0.11, 0.19, length(scr * vec2(1.0, 1.12))));',
    '  v_kind = kind;',
    '  v_heat = heat;',
    '  gl_PointSize = max(u_res.y * (0.0085 + 0.003 * u_feed - a_tp.y * 0.0007), 1.0);',
    '}'
  ].join('\n');

  /* ---------- the plasma field: particles that move the disk ----------

     The sparks and twistor plasma used to fly through the disk without
     touching it. Now they deposit into a field the disk reads back:
     a 512 x 128 texture in the disk's own polar coordinates (angle
     across, radius up), ping-ponged every frame.

       R  heat        - brightens and whitens the gas where it lies
       G  turbulence  - warps the filaments, so the plasma visibly
                        bends round a particle's path

     Each frame the field is advected with the gas: Keplerian
     differential rotation, Omega = 0.5 r^-3/2 on the spin clock (the
     sparks' own orbital law), which on a polar grid is simply a shift
     in angle that depends on radius. A wake therefore shears into a
     trailing spiral by itself, the way a disturbance in a real disk
     does. It also drifts slowly inward with the accretion flow and
     decays over a couple of seconds. The cursor stirs it too.

     RGBA8 is renderable everywhere WebGL1 runs; decay subtracts a
     fraction of a step as well, so small values never get stuck at
     one quantum. */
  var PLASMA_W = 512;
  var PLASMA_H = 128;

  var PLASMA_UPDATE_FRAG = [
    'precision highp float;',
    'uniform sampler2D u_prev;',
    'uniform vec2 u_size;',
    'uniform float u_dspin;',
    'uniform float u_dt;',
    'uniform vec3 u_stir;',
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / u_size;',
    '  float r = uv.y;',
    '  float om = 0.5 / pow(max(r, 0.13), 1.5);',
    '  vec2 src = vec2(uv.x - om * u_dspin / 6.2831853, uv.y + 0.006 * u_dspin);',
    '  vec2 v = texture2D(u_prev, src).rg;',
    '  v = max(v * exp(-u_dt / 2.4) - 0.6 / 255.0, 0.0);',
    '  if (u_stir.z > 0.001) {',
    '    float a = uv.x * 6.2831853;',
    '    vec2 d = r * vec2(cos(a), sin(a)) - u_stir.xy;',
    '    float g = exp(-dot(d, d) / 0.0030) * u_stir.z * min(u_dt, 0.05) * 7.0;',
    '    v += vec2(0.7, 1.0) * g;',
    '  }',
    '  gl_FragColor = vec4(min(v, 1.0), 0.0, 1.0);',
    '}'
  ].join('\n');

  /* splats land at (angle, radius) in the field; additive */
  var SPLAT_SPARK_VERT = [
    'precision highp float;',
    'attribute vec2 a_pt;',
    'uniform float u_spin;',
    'uniform float u_feed;',
    'varying float v_w;',
    'varying float v_turb;',
    SPARK_FN,
    'void main() {',
    '  vec4 o = sparkOrbit(a_pt.x, a_pt.y);',
    '  gl_Position = vec4(fract(o.x / 6.2831853) * 2.0 - 1.0, clamp(o.y, 0.0, 1.0) * 2.0 - 1.0, 0.0, 1.0);',
    '  v_w = o.z * (0.35 + 0.65 * o.w);',
    '  v_turb = o.z;',
    '  gl_PointSize = 5.0;',
    '}'
  ].join('\n');

  var SPLAT_TWP_VERT = [
    'precision highp float;',
    'attribute vec2 a_tp;',
    'varying float v_w;',
    'varying float v_turb;',
    TW_FN,
    TWP_FN,
    'void main() {',
    '  float kind;',
    '  float heat;',
    '  vec4 q = twParticle(a_tp.x, a_tp.y, kind, heat);',
    '  /* only where a particle threads the disk plane does it touch gas */',
    '  float plane = exp(-pow(q.z / 0.05, 2.0));',
    '  float ang = atan(q.y, q.x);',
    '  gl_Position = vec4(fract(ang / 6.2831853) * 2.0 - 1.0, clamp(length(q.xy), 0.0, 1.0) * 2.0 - 1.0, 0.0, 1.0);',
    '  v_w = q.w * plane * (0.6 + 1.4 * heat);',
    '  v_turb = q.w * plane * 1.4;',
    '  gl_PointSize = 4.0;',
    '}'
  ].join('\n');

  var SPLAT_FRAG = [
    'precision mediump float;',
    'uniform float u_gain;',
    'varying float v_w;',
    'varying float v_turb;',
    'void main() {',
    '  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));',
    '  gl_FragColor = vec4(a * v_w * u_gain * 0.20, a * v_turb * u_gain * 0.07, 0.0, 1.0);',
    '}'
  ].join('\n');

  var TWP_FRAG = [
    'precision mediump float;',
    'uniform float u_light;',
    'uniform float u_tw;',
    'varying float v_fade;',
    'varying float v_kind;',
    'varying float v_heat;',
    '',
    'void main() {',
    '  float d = length(gl_PointCoord - 0.5);',
    '  float a = smoothstep(0.5, 0.0, d);',
    '  a *= a * v_fade * clamp(u_tw * 1.6, 0.0, 1.0);',
    '  /* circulating: electric cyan; jet: blue-white; plunging: heats',
    '     from cyan through gold as it falls */',
    '  vec3 col = v_kind < 0.5 ? vec3(0.35, 0.86, 1.0)',
    '          : (v_kind < 1.5 ? vec3(0.78, 0.90, 1.0) : mix(vec3(0.40, 0.85, 1.0), vec3(1.0, 0.78, 0.40), v_heat));',
    '  vec3 ink = v_kind < 1.5 ? vec3(0.10, 0.26, 0.62) : mix(vec3(0.10, 0.30, 0.62), vec3(0.70, 0.30, 0.04), v_heat);',
    '  /* straight colour: the blend (SRC_ALPHA, ONE at night) applies a',
    '     once. Premultiplying here as well squared it - a 0.25 core came',
    '     out at 0.06 and the swarm all but vanished. */',
    '  gl_FragColor = vec4(mix(col, ink, u_light), clamp(a * 1.5, 0.0, 1.0));',
    '}'
  ].join('\n');

  /* ---------- GL plumbing ---------- */

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }

  function program(vsSrc, fsSrc) {
    var vs = compile(gl.VERTEX_SHADER, vsSrc);
    var fs = compile(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;
    var p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    return p;
  }

  var diskProg = program(QUAD_VERT, DISK_FRAG);
  var partProg = program(PART_VERT, PART_FRAG);
  if (!diskProg) {
    canvas.classList.add('fp-blackhole-fallback');
    return;
  }

  /* Quad */
  var quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var diskPos = gl.getAttribLocation(diskProg, 'a_pos');

  var dRes = gl.getUniformLocation(diskProg, 'u_res');
  var dTime = gl.getUniformLocation(diskProg, 'u_time');
  var dCenter = gl.getUniformLocation(diskProg, 'u_center');
  var dZoom = gl.getUniformLocation(diskProg, 'u_zoom');
  var dVariant = gl.getUniformLocation(diskProg, 'u_variant');
  var dLight = gl.getUniformLocation(diskProg, 'u_light');
  var dSpin = gl.getUniformLocation(diskProg, 'u_spin');
  var dHover = gl.getUniformLocation(diskProg, 'u_hover');
  var dFeed = gl.getUniformLocation(diskProg, 'u_feed');
  var dProbe = gl.getUniformLocation(diskProg, 'u_probe');
  var dTint = gl.getUniformLocation(diskProg, 'u_tint');
  var tint = cfg.tint || [1, 1, 1, 0];
  var dElev = gl.getUniformLocation(diskProg, 'u_elev');
  var dPhi = gl.getUniformLocation(diskProg, 'u_phi');
  var dKerr = gl.getUniformLocation(diskProg, 'u_kerr');
  var dGal = gl.getUniformLocation(diskProg, 'u_gal');
  var dPlasma = gl.getUniformLocation(diskProg, 'u_plasma');
  var dPlasmaOn = gl.getUniformLocation(diskProg, 'u_plasmaOn');

  /* Particles: each has a head + tail segments along its orbit */
  var PART_N = cfg.particles.n;
  var TAIL = cfg.particles.tail;
  var PART_COUNT = PART_N * TAIL;
  var pts = new Float32Array(PART_COUNT * 2);
  for (var i = 0; i < PART_N; i++) {
    for (var s = 0; s < TAIL; s++) {
      var k = (i * TAIL + s) * 2;
      pts[k] = (i + 0.5) / PART_N;
      pts[k + 1] = s;
    }
  }
  var partBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, partBuf);
  gl.bufferData(gl.ARRAY_BUFFER, pts, gl.STATIC_DRAW);
  var partSeed = partProg ? gl.getAttribLocation(partProg, 'a_pt') : -1;
  var pRes = partProg ? gl.getUniformLocation(partProg, 'u_res') : null;
  var pTime = partProg ? gl.getUniformLocation(partProg, 'u_time') : null;
  var pCenter = partProg ? gl.getUniformLocation(partProg, 'u_center') : null;
  var pZoom = partProg ? gl.getUniformLocation(partProg, 'u_zoom') : null;
  var pLight = partProg ? gl.getUniformLocation(partProg, 'u_light') : null;
  var pSpin = partProg ? gl.getUniformLocation(partProg, 'u_spin') : null;
  var pFeed = partProg ? gl.getUniformLocation(partProg, 'u_feed') : null;
  var pTint = partProg ? gl.getUniformLocation(partProg, 'u_tint') : null;
  var pElev = partProg ? gl.getUniformLocation(partProg, 'u_elev') : null;
  var pPhi = partProg ? gl.getUniformLocation(partProg, 'u_phi') : null;

  /* Twistor congruence: one GL_LINES pair per fibre segment */
  var twProg = cfg.twistor ? program(TW_VERT, TW_FRAG) : null;
  var twCount = 0;
  var twBuf = null;
  var twLoc = {};
  if (twProg) {
    var twData = [];
    for (var ti = 0; ti < TW_TORI.length; ti++) {
      var th = TW_TORI[ti] * Math.PI;
      for (var fi = 0; fi < TW_FIBRES; fi++) {
        /* stagger each torus's fibres so they interleave, not stack */
        var ph = (fi + ti * 0.37) / TW_FIBRES * Math.PI * 2;
        for (var si = 0; si < TW_SEGS; si++) {
          var p0 = si / TW_SEGS * Math.PI * 2;
          var p1 = (si + 1) / TW_SEGS * Math.PI * 2;
          twData.push(th, ph, p0, th, ph, p1);
        }
      }
    }
    twCount = twData.length / 3;
    twBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, twBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(twData), gl.STATIC_DRAW);
    ['u_res', 'u_center', 'u_zoom', 'u_time', 'u_spin', 'u_kerr', 'u_feed', 'u_elev', 'u_phi',
     'u_tw', 'u_light', 'u_tint'].forEach(function (n) {
      twLoc[n] = gl.getUniformLocation(twProg, n);
    });
    twLoc.attr = gl.getAttribLocation(twProg, 'a_tw');
  }

  /* Particles riding the congruence */
  var twpProg = (twProg && cfg.twistorParticles) ? program(TWP_VERT, TWP_FRAG) : null;
  var twpCount = 0;
  var twpBuf = null;
  var twpLoc = {};
  var TWP_TAIL = 1;
  if (twpProg) {
    var TWP_N = cfg.twistorParticles.n;
    TWP_TAIL = cfg.twistorParticles.tail;
    var tpts = new Float32Array(TWP_N * TWP_TAIL * 2);
    for (var tq = 0; tq < TWP_N; tq++) {
      for (var ts = 0; ts < TWP_TAIL; ts++) {
        var tk = (tq * TWP_TAIL + ts) * 2;
        tpts[tk] = (tq + 0.5) / TWP_N;
        tpts[tk + 1] = ts;
      }
    }
    twpCount = TWP_N * TWP_TAIL;
    twpBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, twpBuf);
    gl.bufferData(gl.ARRAY_BUFFER, tpts, gl.STATIC_DRAW);
    ['u_res', 'u_center', 'u_zoom', 'u_time', 'u_spin', 'u_kerr', 'u_feed', 'u_elev', 'u_phi',
     'u_tw', 'u_light', 'u_tail'].forEach(function (n) {
      twpLoc[n] = gl.getUniformLocation(twpProg, n);
    });
    twpLoc.attr = gl.getAttribLocation(twpProg, 'a_tp');
  }

  /* Plasma field: two RGBA8 targets, ping-ponged. Any failure (no
     programs, incomplete framebuffer) just leaves it off and the disk
     renders as before. */
  function makePlasma() {
    var upd = program(QUAD_VERT, PLASMA_UPDATE_FRAG);
    var spk = partProg ? program(SPLAT_SPARK_VERT, SPLAT_FRAG) : null;
    var twp = twpProg ? program(SPLAT_TWP_VERT, SPLAT_FRAG) : null;
    if (!upd || !spk) {
      return null;
    }
    var tex = [];
    var fbo = [];
    for (var pi = 0; pi < 2; pi++) {
      var tx = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, PLASMA_W, PLASMA_H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      /* angle wraps seamlessly (power-of-two width); radius clamps */
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      var fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tx, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return null;
      }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      tex.push(tx);
      fbo.push(fb);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    function locs(prog, names) {
      var o = {};
      names.forEach(function (n) { o[n] = gl.getUniformLocation(prog, n); });
      return o;
    }
    return {
      tex: tex,
      fbo: fbo,
      cur: 0,
      upd: upd,
      updPos: gl.getAttribLocation(upd, 'a_pos'),
      updLoc: locs(upd, ['u_prev', 'u_size', 'u_dspin', 'u_dt', 'u_stir']),
      spk: spk,
      spkAttr: gl.getAttribLocation(spk, 'a_pt'),
      spkLoc: locs(spk, ['u_spin', 'u_feed', 'u_gain']),
      twp: twp,
      twpAttr: twp ? gl.getAttribLocation(twp, 'a_tp') : -1,
      twpLoc: twp ? locs(twp, ['u_time', 'u_spin', 'u_kerr', 'u_feed', 'u_gain']) : null
    };
  }
  var plasma = null;

  gl.enable(gl.BLEND);

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* a single static frame has no history to evolve */
  plasma = (cfg.plasma && !reduced) ? makePlasma() : null;
  var visible = true;
  var raf = null;

  /* Palette crossfade: 0 = night, 1 = paper. Instances that do not
     follow the theme are pinned to night for the life of the page. */
  var follow = !!cfg.followTheme;
  var lightTarget = (follow && infinityThemeIsLight()) ? 1 : 0;
  var lightCur = lightTarget;

  /* Interaction. hoverCur eases toward pointer proximity; feedCur
     spikes to 1 on a click and decays. spin is an accumulated rotation
     clock — scaling wall time instead would teleport the disk's phase
     every time the rate changed. */
  var interactive = !!cfg.interactive && !reduced;
  var hoverTarget = 0;
  var hoverCur = 0;
  var feedCur = 0;
  var spin = 0;
  var prevT = 0;

  /* Analytics hook: cfg.onAction(name) hears what the visitor does to
     the scene itself. Each one-off action reports once per page. */
  var reported = {};
  function emit(name, once) {
    if (once) {
      if (reported[name]) {
        return;
      }
      reported[name] = true;
    }
    if (typeof cfg.onAction === 'function') {
      cfg.onAction(name);
    }
  }
  var lensHeld = 0;

  /* Pointer lens: target position in the shader's hole-relative uv
     (y up, before the frame tilt) and a strength that fades in over
     the open sky and out near the hole. The position is eased too, so
     the lens glides after the cursor instead of snapping to it. */
  var probeTX = 0;
  var probeTY = 0;
  var probeX = 0;
  var probeY = 0;
  var probeTarget = 0;
  var probeCur = 0;

  /* Spin and camera. kerr is a* (0..0.998); a horizontal drag winds it
     toward kerrTarget, and when let go it relaxes back to the resting
     spin over ~20s, slowly, like a flywheel. dragElev is the vertical
     drag's tilt, which springs back in a couple of seconds. scrollTilt
     lays the disk toward edge-on as the hero scrolls away. twCur is the
     twistor field's visibility. */
  var KERR_REST = (typeof cfg.kerr === 'number') ? cfg.kerr : 0.6;
  var kerr = KERR_REST;
  var kerrTarget = KERR_REST;
  var dragElev = 0;
  var dragging = false;
  var scrollTilt = 0;
  var twCur = cfg.twistor ? 0.4 : 0;
  var elevNow = 0.31;
  var stateAt = 0;

  /* ---- the lensed galaxy ----
     galX/galY is its true position in the source plane (shader uv
     units, relative to the hole). Left alone it drifts left to right
     and wraps; it starts just short of the hole so the first visit
     catches the arcs forming. A visitor can grab it (mouse / pen),
     throw it, tap it into alignment (touch) or press G on the feed
     button. Released near alignment, it parks for a while so the
     Einstein ring can be admired. */
  /* Cursor stirring of the plasma: disk-plane position and a strength
     that follows how fast the pointer moves over the disk, decaying
     when it stops. phiNowS mirrors the frame's precession angle so the
     pointer can be mapped onto the disk plane between frames. */
  var stirX = 0;
  var stirY = 0;
  var stirS = 0;
  var phiNowS = Math.PI / 2;
  var stirLast = 0;
  var stirLX = 0;
  var stirLY = 0;

  var GAL_DRIFT = 0.04;
  var galX = -0.36;
  var galY = 0.035;
  var galVX = GAL_DRIFT;
  var galVY = 0;
  var galDrag = false;
  var galId = -1;
  var galOffX = 0;
  var galOffY = 0;
  var galParkUntil = 0;
  var galAlign = false;
  var galLastT = 0;

  function settling() {
    return lightCur !== lightTarget || hoverCur !== hoverTarget || feedCur > 0 || probeCur !== probeTarget ||
      kerr !== kerrTarget || dragElev !== 0 || dragging;
  }

  /* cfg.zoom is either a constant or a function of the canvas size,
     for layouts where the hole should keep a size relative to its
     column rather than to the section height. */
  function zoomFor(w, h) {
    return (typeof cfg.zoom === 'function') ? cfg.zoom(w, h) : cfg.zoom;
  }

  var start = performance.now();
  var last = 0;
  var FRAME_MS = 33;

  function frame(now) {
    raf = null;
    if (!reduced && now && now - last < FRAME_MS) {
      raf = requestAnimationFrame(frame);
      return;
    }
    last = now || 0;
    resize();

    var t = (performance.now() - start) / 1000;
    var dt = Math.min(Math.max(t - prevT, 0), 0.1);
    prevT = t;

    /* Ease toward the new palette; snap once it is close enough that
       the remaining difference cannot be seen, so the loop can stop. */
    lightCur += (lightTarget - lightCur) * 0.18;
    if (Math.abs(lightTarget - lightCur) < 0.004) {
      lightCur = lightTarget;
    }

    /* Hover eases both ways; a feeding event spikes and decays over
       roughly four seconds, then snaps off so the loop can idle. */
    hoverCur += (hoverTarget - hoverCur) * Math.min(1, dt * 6.0);
    if (Math.abs(hoverTarget - hoverCur) < 0.004) {
      hoverCur = hoverTarget;
    }
    if (feedCur > 0) {
      feedCur *= Math.exp(-dt * 1.15);
      if (feedCur < 0.004) {
        feedCur = 0;
      }
    }

    if (probeCur === 0 && probeTarget > 0) {
      /* fading in from nothing: start where the pointer already is */
      probeX = probeTX;
      probeY = probeTY;
    }
    probeX += (probeTX - probeX) * Math.min(1, dt * 9.0);
    probeY += (probeTY - probeY) * Math.min(1, dt * 9.0);
    probeCur += (probeTarget - probeCur) * Math.min(1, dt * 5.0);
    /* the lens counts as used once it has been held over open sky for
       a second and a half, not when the cursor merely crosses it */
    if (probeCur > 0.5 && !reported.lens) {
      /* wall clock, not summed frame dt: dt is capped per frame, so a
         slow device would otherwise need far longer than 1.5s */
      var nowMs = performance.now();
      if (!lensHeld) {
        lensHeld = nowMs;
      } else if (nowMs - lensHeld > 1500) {
        emit('lens', true);
      }
    } else if (probeCur <= 0.5) {
      lensHeld = 0;
    }
    if (Math.abs(probeTarget - probeCur) < 0.004) {
      probeCur = probeTarget;
    }

    /* Spin: follows the drag briskly, relaxes to rest slowly */
    if (!dragging) {
      kerrTarget += (KERR_REST - kerrTarget) * Math.min(1, dt / 20);
      dragElev += (0 - dragElev) * Math.min(1, dt * 1.4);
      if (Math.abs(dragElev) < 0.002) {
        dragElev = 0;
      }
      if (Math.abs(kerrTarget - KERR_REST) < 0.002) {
        kerrTarget = KERR_REST;
      }
    }
    kerr += (kerrTarget - kerr) * Math.min(1, dt * 5);
    if (Math.abs(kerrTarget - kerr) < 0.001) {
      kerr = kerrTarget;
    }

    /* Camera. Breathing, stir and feed open the disk toward us as they
       always did; a vertical drag tilts it further either way; scroll
       lays it toward edge-on. */
    var elev = 0.310 + 0.086 * Math.sin(t * 0.055) + 0.075 * hoverCur + 0.105 * feedCur +
      dragElev - 0.17 * scrollTilt;
    elev = Math.max(0.09, Math.min(0.98, elev));
    elevNow = elev;
    var phiNow = Math.PI / 2 + 0.20 * Math.sin(t * 0.083);

    /* Stirring spins the disk up, feeding makes it race, and the
       hole's own spin sets the base rate: frame dragging */
    var spinBefore = spin;
    spin += dt * (1.0 + 0.9 * hoverCur + 2.4 * feedCur) * (0.55 + 0.75 * kerr);
    phiNowS = phiNow;
    stirS *= Math.exp(-dt * 3.5);
    if (stirS < 0.002) {
      stirS = 0;
    }

    /* Twistor field: always faintly there, brightening as the pointer
       comes close, while dragging and when the hole feeds; a faster
       hole draws a brighter, wider congruence */
    var twTarget = cfg.twistor
      ? Math.min(1, (0.50 + 0.35 * hoverCur + (dragging ? 0.55 : 0) + 0.5 * feedCur) * (0.55 + 0.45 * kerr))
      : 0;
    twCur += (twTarget - twCur) * Math.min(1, dt * 4);

    if (cfg.galaxy && !galDrag) {
      var nowG = performance.now();
      if (galAlign) {
        /* flying into alignment: ease the source onto the axis */
        galX += (0 - galX) * Math.min(1, dt * 2.4);
        galY += (0 - galY) * Math.min(1, dt * 2.4);
        if (galX * galX + galY * galY < 0.00004) {
          galAlign = false;
          galX = 0;
          galY = 0;
          galVX = 0;
          galVY = 0;
          galParkUntil = nowG + 10000;
        }
      } else if (nowG >= galParkUntil) {
        /* coast: a throw decays into the slow drift */
        galVX += (GAL_DRIFT - galVX) * Math.min(1, dt / 3);
        galVY += (0 - galVY) * Math.min(1, dt / 3);
        galX += galVX * dt;
        galY += galVY * dt;
        galY += (0.035 - galY) * Math.min(1, dt / 14);
        galY = Math.max(-1.1, Math.min(1.1, galY));
        if (galX > 1.05) {
          galX = -1.35;
          galY = 0.035 + 0.08 * (Math.random() - 0.5);
        } else if (galX < -1.8) {
          galX = 1.0;
        }
      }
    }

    if (typeof cfg.onState === 'function' && (t - stateAt > 0.1 || reduced)) {
      stateAt = t;
      /* u = beta / thetaE: how far the galaxy is from alignment */
      var gu = Math.sqrt(galX * galX + galY * galY) / GAL_THETA;
      cfg.onState({
        kerr: kerr, elev: elev, dragging: dragging || galDrag, hover: hoverCur, feed: feedCur,
        galU: (cfg.galaxy && !lightTarget) ? gu : null
      });
    }

    var c = cfg.center(canvas.clientWidth, canvas.clientHeight);
    var cx = c[0];
    var cy = c[1];
    var zoom = zoomFor(canvas.clientWidth, canvas.clientHeight);

    /* Plasma field: advect + decay + stir into the other target, then
       splat this frame's particles on top, then hand it to the disk */
    if (plasma) {
      var nxt = 1 - plasma.cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, plasma.fbo[nxt]);
      gl.viewport(0, 0, PLASMA_W, PLASMA_H);
      gl.disable(gl.BLEND);
      gl.useProgram(plasma.upd);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(plasma.updPos);
      gl.vertexAttribPointer(plasma.updPos, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, plasma.tex[plasma.cur]);
      gl.uniform1i(plasma.updLoc.u_prev, 0);
      gl.uniform2f(plasma.updLoc.u_size, PLASMA_W, PLASMA_H);
      gl.uniform1f(plasma.updLoc.u_dspin, spin - spinBefore);
      gl.uniform1f(plasma.updLoc.u_dt, dt);
      gl.uniform3f(plasma.updLoc.u_stir, stirX, stirY, stirS);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(plasma.updPos);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(plasma.spk);
      gl.bindBuffer(gl.ARRAY_BUFFER, partBuf);
      gl.enableVertexAttribArray(plasma.spkAttr);
      gl.vertexAttribPointer(plasma.spkAttr, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(plasma.spkLoc.u_spin, spin);
      gl.uniform1f(plasma.spkLoc.u_feed, feedCur);
      gl.uniform1f(plasma.spkLoc.u_gain, 1.0 + 1.5 * feedCur);
      gl.drawArrays(gl.POINTS, 0, PART_COUNT);
      gl.disableVertexAttribArray(plasma.spkAttr);

      if (plasma.twp) {
        gl.useProgram(plasma.twp);
        gl.bindBuffer(gl.ARRAY_BUFFER, twpBuf);
        gl.enableVertexAttribArray(plasma.twpAttr);
        gl.vertexAttribPointer(plasma.twpAttr, 2, gl.FLOAT, false, 0, 0);
        gl.uniform1f(plasma.twpLoc.u_time, t);
        gl.uniform1f(plasma.twpLoc.u_spin, spin);
        gl.uniform1f(plasma.twpLoc.u_kerr, kerr);
        gl.uniform1f(plasma.twpLoc.u_feed, feedCur);
        gl.uniform1f(plasma.twpLoc.u_gain, 1.6 + 2.0 * feedCur);
        gl.drawArrays(gl.POINTS, 0, twpCount);
        gl.disableVertexAttribArray(plasma.twpAttr);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      plasma.cur = nxt;
    }

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    /* Disk pass */
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(diskProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.enableVertexAttribArray(diskPos);
    gl.vertexAttribPointer(diskPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(dRes, canvas.width, canvas.height);
    gl.uniform1f(dTime, t);
    gl.uniform2f(dCenter, cx, cy);
    gl.uniform1f(dZoom, zoom);
    gl.uniform1f(dVariant, cfg.variant);
    gl.uniform1f(dLight, lightCur);
    gl.uniform1f(dSpin, spin);
    gl.uniform1f(dHover, hoverCur);
    gl.uniform1f(dFeed, feedCur);
    gl.uniform3f(dProbe, probeX, probeY, probeCur);
    gl.uniform4f(dTint, tint[0], tint[1], tint[2], tint[3]);
    gl.uniform1f(dElev, elev);
    gl.uniform1f(dPhi, phiNow);
    gl.uniform1f(dKerr, kerr);
    gl.uniform2f(dGal, cfg.galaxy ? galX : 99, cfg.galaxy ? galY : 99);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, plasma ? plasma.tex[plasma.cur] : null);
    gl.uniform1i(dPlasma, 0);
    gl.uniform1f(dPlasmaOn, plasma ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* Twistor pass, between the disk and the sparks */
    if (twProg && twCur > 0.003) {
      gl.blendFunc(gl.SRC_ALPHA, lightCur > 0.5 ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
      gl.useProgram(twProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, twBuf);
      gl.enableVertexAttribArray(twLoc.attr);
      gl.vertexAttribPointer(twLoc.attr, 3, gl.FLOAT, false, 0, 0);
      gl.uniform2f(twLoc.u_res, canvas.width, canvas.height);
      gl.uniform2f(twLoc.u_center, cx, cy);
      gl.uniform1f(twLoc.u_zoom, zoom);
      gl.uniform1f(twLoc.u_time, t);
      gl.uniform1f(twLoc.u_spin, spin);
      gl.uniform1f(twLoc.u_kerr, kerr);
      gl.uniform1f(twLoc.u_feed, feedCur);
      gl.uniform1f(twLoc.u_elev, elev);
      gl.uniform1f(twLoc.u_phi, phiNow);
      gl.uniform1f(twLoc.u_tw, twCur);
      gl.uniform1f(twLoc.u_light, lightCur);
      gl.uniform4f(twLoc.u_tint, tint[0], tint[1], tint[2], tint[3]);
      gl.drawArrays(gl.LINES, 0, twCount);
      gl.disableVertexAttribArray(twLoc.attr);
    }

    if (twpProg && twCur > 0.003) {
      gl.blendFunc(gl.SRC_ALPHA, lightCur > 0.5 ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
      gl.useProgram(twpProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, twpBuf);
      gl.enableVertexAttribArray(twpLoc.attr);
      gl.vertexAttribPointer(twpLoc.attr, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(twpLoc.u_res, canvas.width, canvas.height);
      gl.uniform2f(twpLoc.u_center, cx, cy);
      gl.uniform1f(twpLoc.u_zoom, zoom);
      gl.uniform1f(twpLoc.u_time, t);
      gl.uniform1f(twpLoc.u_spin, spin);
      gl.uniform1f(twpLoc.u_kerr, kerr);
      gl.uniform1f(twpLoc.u_feed, feedCur);
      gl.uniform1f(twpLoc.u_elev, elev);
      gl.uniform1f(twpLoc.u_phi, phiNow);
      gl.uniform1f(twpLoc.u_tw, twCur);
      gl.uniform1f(twpLoc.u_light, lightCur);
      gl.uniform1f(twpLoc.u_tail, TWP_TAIL);
      gl.drawArrays(gl.POINTS, 0, twpCount);
      gl.disableVertexAttribArray(twpLoc.attr);
    }

    /* Particle pass: sparks add light at night, ink on paper */
    if (partProg) {
      gl.blendFunc(gl.SRC_ALPHA, lightCur > 0.5 ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
      gl.useProgram(partProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, partBuf);
      gl.enableVertexAttribArray(partSeed);
      gl.vertexAttribPointer(partSeed, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(pRes, canvas.width, canvas.height);
      gl.uniform1f(pTime, t);
      gl.uniform2f(pCenter, cx, cy);
      gl.uniform1f(pZoom, zoom);
      gl.uniform1f(pLight, lightCur);
      gl.uniform1f(pSpin, spin);
      gl.uniform1f(pFeed, feedCur);
      gl.uniform4f(pTint, tint[0], tint[1], tint[2], tint[3]);
      gl.uniform1f(pElev, elev);
      gl.uniform1f(pPhi, phiNow);
      gl.drawArrays(gl.POINTS, 0, PART_COUNT);
    }

    if ((!reduced && visible) || settling()) {
      raf = requestAnimationFrame(frame);
    }
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !raf && !reduced) {
        raf = requestAnimationFrame(frame);
      }
    }).observe(canvas);
  }

  window.addEventListener('resize', function () {
    if (reduced && !raf) raf = requestAnimationFrame(frame);
  });

  if (follow) {
    window.addEventListener('infinity:theme', function () {
      lightTarget = infinityThemeIsLight() ? 1 : 0;
      /* No crossfade to ride when motion is reduced: land on the new
         palette and let the next frame paint it once. */
      if (reduced) {
        lightCur = lightTarget;
      }
      if (!raf) {
        raf = requestAnimationFrame(frame);
      }
    });
  }

  /* ---------- pointer: stir the disk, feed the hole ---------- */

  var host = canvas.parentNode;
  var hostRect = null;
  var armed = false;

  function dropRect() {
    hostRect = null;
  }

  /* The backdrop only advertises itself as clickable once the pointer
     is close enough for a click to visibly do something. */
  function arm(on) {
    if (on === armed || !host || !host.classList) {
      return;
    }
    armed = on;
    host.classList.toggle('bh-armed', on);
  }

  function smooth(a, b, x) {
    var k = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return k * k * (3.0 - 2.0 * k);
  }

  /* Proximity is measured in the shader's own uv units, so the falloff
     tracks the hole itself rather than the pixel size of the section.
     The rect is cached because pointermove fires far more often than
     the layout actually moves. */
  function onPointerMove(ev) {
    /* Proximity is a mouse idea. A finger only generates pointermove
       while it is down — that is a scroll, not a hover — and there is
       no pointerleave to end it, so the disk would stir on every swipe
       and stay stirred afterwards. */
    if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
      return;
    }
    if (!hostRect) {
      hostRect = canvas.getBoundingClientRect();
    }
    var rc = hostRect;
    if (!rc.width || !rc.height ||
        ev.clientX < rc.left || ev.clientX > rc.right ||
        ev.clientY < rc.top || ev.clientY > rc.bottom) {
      hoverTarget = 0;
      probeTarget = 0;
      arm(false);
      return;
    }
    /* cfg.center is in the shader's bottom-up normalized space */
    var ctr = cfg.center(rc.width, rc.height);
    var z = zoomFor(rc.width, rc.height);
    var dx = (ev.clientX - (rc.left + ctr[0] * rc.width)) / rc.height * z;
    var dy = (ev.clientY - (rc.top + (1 - ctr[1]) * rc.height)) / rc.height * z;
    /* full response over the hole, easing down to a floor across the
       rest of the section so the disk stays alive to the pointer */
    var dist = Math.sqrt(dx * dx + dy * dy);
    var near = 1 - smooth(0.22, 1.25, dist);
    hoverTarget = Math.max(0.18, near, stirFloor);
    probeTX = dx;
    probeTY = -dy;
    probeTarget = (cfg.probe && !lightTarget) ? smooth(0.32, 0.62, dist) : 0;
    if (cfg.galaxy && host && host.classList) {
      var onGal = galDrag || overGalaxy(ev.clientX, ev.clientY);
      host.classList.toggle('bh-over-galaxy', onGal && !galDrag);
      /* the cursor's own lens would bend the very galaxy being reached
         for into a little ring; it steps aside while you hold it */
      if (onGal) {
        probeTarget = 0;
      }
    }

    /* Stir the plasma: map the pointer onto the disk plane (the frame's
       own foreshortening and precession) and inject in proportion to
       how fast it is moving there. A resting cursor stirs nothing. */
    if (plasma && !galDrag) {
      var pu = pointerUv(ev.clientX, ev.clientY);
      var nowS = performance.now();
      if (pu) {
        var cpS = Math.cos(phiNowS);
        var spS = Math.sin(phiNowS);
        var a0S = pu.x * cpS + pu.y * spS;
        var b0S = -pu.x * spS + pu.y * cpS;
        var dX = b0S;
        var dY = -a0S / Math.max(Math.sin(elevNow), 0.12);
        var rS = Math.sqrt(dX * dX + dY * dY);
        var dtS = Math.max((nowS - stirLast) / 1000, 0.008);
        var vS = Math.sqrt((ev.clientX - stirLX) * (ev.clientX - stirLX) + (ev.clientY - stirLY) * (ev.clientY - stirLY)) / dtS;
        if (rS > 0.14 && rS < 1.0 && stirLast) {
          stirX = dX;
          stirY = dY;
          stirS = Math.max(stirS, Math.min(1, vS / 900));
        }
      }
      stirLast = nowS;
      stirLX = ev.clientX;
      stirLY = ev.clientY;
    }
    arm(near > 0.5);
    if (near > 0.5) {
      emit('stir', true);
    }
    if (!raf) {
      raf = requestAnimationFrame(frame);
    }
  }

  /* Content can lean on the hole: hovering or focusing an element
     marked data-bh-stir (the lead article card) holds the disk at a
     gentle stir, so the backdrop visibly notices what the reader is
     about to open. A floor under the proximity response, not a
     replacement for it. */
  var stirFloor = 0;

  function setStir(on) {
    stirFloor = on ? 0.6 : 0;
    hoverTarget = on ? Math.max(hoverTarget, stirFloor) : Math.min(hoverTarget, 0.18);
    if (!raf) {
      raf = requestAnimationFrame(frame);
    }
  }

  /* A press on a link, the Steam widget, the article card or a form
     control is the reader using the page, not poking the hole. */
  function isControl(el) {
    return !!(el && el.closest && el.closest('a, button, input, select, textarea, label, iframe, [data-bh-stir], .hero-steam-card'));
  }

  function feed(strength) {
    feedCur = Math.max(feedCur, (typeof strength === 'number') ? strength : 1);
    if (!raf) {
      raf = requestAnimationFrame(frame);
    }
  }

  /* pointerdown fires the moment a finger lands, which is also the
     moment a scroll starts — feeding the hole on every swipe through
     the hero. A mouse press is unambiguous and fires immediately; a
     touch has to prove it was a tap.

     Travel is accumulated from the moves themselves rather than
     compared between the down and up points. Two reasons: a drag that
     wanders away and comes back would read as a tap on the endpoints
     alone, and a pointerup's own coordinates are not something to lean
     on — they vary with how the gesture ended. Timing likewise runs off
     performance.now() rather than event.timeStamp, whose origin is not
     consistent across browsers. */
  var TAP_SLOP = 12;
  var TAP_MS = 450;
  var tapX = 0;
  var tapY = 0;
  var tapAt = 0;
  var tapMoved = 0;
  var tapId = -1;

  /* ---- drag: wind the spin, tilt the camera ----
     Mouse and pen only; on touch a drag is a scroll and stays one.
     A press that doesn't travel is still a click and still feeds, now
     on release, so a drag never fires a feed by accident. Presses on
     text are left alone, so the copy can still be selected. */
  var DRAG_SLOP = 5;
  var dragId = -1;
  var dragLX = 0;
  var dragLY = 0;
  var dragTravel = 0;

  function isText(el) {
    return !!(el && el.closest && el.closest('p, h1, h2, h3, li, svg, .fp-hero-latest-label'));
  }

  /* Cursor -> the shader's own uv for that pixel: hole-relative,
     y up, zoom applied, then the frame's fixed cant - exactly what the
     fragment shader computes, so the back-trace below is the shader's. */
  function pointerUv(clientX, clientY) {
    var rc = canvas.getBoundingClientRect();
    if (!rc.width || !rc.height) {
      return null;
    }
    var ctr = cfg.center(rc.width, rc.height);
    var z = zoomFor(rc.width, rc.height);
    var x = (clientX - (rc.left + ctr[0] * rc.width)) / rc.height * z;
    var y = -(clientY - (rc.top + (1 - ctr[1]) * rc.height)) / rc.height * z;
    var c0 = Math.cos(-0.10);
    var s0 = Math.sin(-0.10);
    return { x: c0 * x + s0 * y, y: -s0 * x + c0 * y };
  }

  /* Trace the ray under the cursor back to the source plane: the
     frame-dragging twist, then the galaxy's lens equation, unclamped.
     The pointer lens is centred on the cursor itself, so it does not
     deflect the ray through the cursor's own pixel. */
  function backTrace(u) {
    var r2 = u.x * u.x + u.y * u.y;
    var tw = Math.min(kerr * 0.0062 / (r2 + 0.0022), 1.6);
    var x = Math.cos(tw) * u.x - Math.sin(tw) * u.y;
    var y = Math.sin(tw) * u.x + Math.cos(tw) * u.y;
    var k = 1 - GAL_THETA * GAL_THETA / Math.max(x * x + y * y, 1e-4);
    return { x: x * k, y: y * k };
  }

  /* Is the cursor over any image of the galaxy - primary, counter-image
     or arc? Equivalent to: does the ray under it land on the galaxy?
     The shadow itself never counts: nothing comes back from there. */
  function overGalaxy(clientX, clientY) {
    if (!cfg.galaxy || lightTarget) {
      return false;
    }
    var u = pointerUv(clientX, clientY);
    if (!u || u.x * u.x + u.y * u.y < 0.16 * 0.16) {
      return false;
    }
    var b = backTrace(u);
    var dx = b.x - galX;
    var dy = b.y - galY;
    return dx * dx + dy * dy < 0.075 * 0.075;
  }

  function alignGalaxy() {
    if (!cfg.galaxy) {
      return;
    }
    galAlign = true;
    emit('galaxy', true);
  }

  function onGalaxyMove(ev) {
    if (ev.pointerId !== galId) {
      return;
    }
    var u = pointerUv(ev.clientX, ev.clientY);
    if (!u) {
      return;
    }
    /* keep the held ray out of the shadow, where the map is meaningless */
    var r = Math.sqrt(u.x * u.x + u.y * u.y);
    if (r < 0.165) {
      var sc = 0.165 / Math.max(r, 1e-4);
      u = { x: u.x * sc, y: u.y * sc };
    }
    var b = backTrace(u);
    var nx = b.x + galOffX;
    var ny = b.y + galOffY;
    var now = performance.now();
    var dts = Math.max((now - galLastT) / 1000, 0.008);
    /* smoothed velocity, kept for the throw */
    galVX += ((nx - galX) / dts - galVX) * 0.35;
    galVY += ((ny - galY) / dts - galVY) * 0.35;
    galLastT = now;
    galX = nx;
    galY = ny;
    if (!raf) {
      raf = requestAnimationFrame(frame);
    }
  }

  function onGalaxyEnd(ev) {
    if (ev.pointerId !== galId) {
      return;
    }
    galId = -1;
    galDrag = false;
    host.classList.remove('bh-grab-galaxy');
    var speed = Math.sqrt(galVX * galVX + galVY * galVY);
    var cap = 0.6;
    if (speed > cap) {
      galVX *= cap / speed;
      galVY *= cap / speed;
      speed = cap;
    }
    /* let go gently, near alignment: park it on the ring */
    if (Math.sqrt(galX * galX + galY * galY) < 0.07 && speed < 0.18) {
      galVX = 0;
      galVY = 0;
      galParkUntil = performance.now() + 10000;
    }
  }

  function onDragMove(ev) {
    if (ev.pointerId !== dragId) {
      return;
    }
    var dx = ev.clientX - dragLX;
    var dy = ev.clientY - dragLY;
    dragLX = ev.clientX;
    dragLY = ev.clientY;
    dragTravel += Math.abs(dx) + Math.abs(dy);
    if (!dragging && dragTravel > DRAG_SLOP) {
      dragging = true;
      host.classList.add('bh-dragging');
      emit('orbit', true);
    }
    if (dragging) {
      kerrTarget = Math.max(0, Math.min(0.998, kerrTarget + dx * 0.0032));
      dragElev = Math.max(-0.22, Math.min(0.68, dragElev - dy * 0.0042));
      if (!raf) {
        raf = requestAnimationFrame(frame);
      }
    }
  }

  function onDragEnd(ev) {
    if (ev.pointerId !== dragId) {
      return;
    }
    dragId = -1;
    if (!dragging && ev.type === 'pointerup') {
      feed(1);
      emit('feed');
    }
    dragging = false;
    host.classList.remove('bh-dragging');
    if (!raf) {
      raf = requestAnimationFrame(frame);
    }
  }

  function onPointerDown(ev) {
    if (isControl(ev.target)) {
      tapId = -1;
      return;
    }
    if (ev.pointerType === 'mouse' || ev.pointerType === 'pen') {
      if (isText(ev.target)) {
        /* a press on the copy: no drag, but the old click-to-feed */
        feed(1);
        emit('feed');
        return;
      }
      if (overGalaxy(ev.clientX, ev.clientY)) {
        /* grabbed the galaxy: hold the ray under the cursor */
        var u = pointerUv(ev.clientX, ev.clientY);
        var b = backTrace(u);
        galOffX = galX - b.x;
        galOffY = galY - b.y;
        galId = ev.pointerId;
        galDrag = true;
        galAlign = false;
        galParkUntil = 0;
        galVX = 0;
        galVY = 0;
        galLastT = performance.now();
        host.classList.add('bh-grab-galaxy');
        emit('galaxy', true);
        return;
      }
      dragId = ev.pointerId;
      dragLX = ev.clientX;
      dragLY = ev.clientY;
      dragTravel = 0;
      return;
    }
    tapId = ev.pointerId;
    tapX = ev.clientX;
    tapY = ev.clientY;
    tapAt = performance.now();
    tapMoved = 0;
  }

  function onTapMove(ev) {
    if (ev.pointerId !== tapId) {
      return;
    }
    tapMoved = Math.max(tapMoved, Math.abs(ev.clientX - tapX), Math.abs(ev.clientY - tapY));
  }

  function onPointerUp(ev) {
    if (ev.pointerId !== tapId) {
      return;
    }
    tapId = -1;
    if (performance.now() - tapAt <= TAP_MS && tapMoved <= TAP_SLOP) {
      if (overGalaxy(tapX, tapY)) {
        /* a finger can't drag it without scrolling: a tap sends it
           behind the hole instead */
        alignGalaxy();
      } else {
        feed(1);
        emit('feed');
      }
    }
  }

  function onPointerCancel() {
    tapId = -1;
  }

  function onPointerGone() {
    hoverTarget = 0;
    probeTarget = 0;
    arm(false);
  }

  /* Scroll lays the disk toward edge-on as the hero leaves the
     screen, so the hole closes like an eye behind the reader. */
  if (cfg.scrollTilt && !reduced) {
    var onScrollTilt = function () {
      var r = canvas.getBoundingClientRect();
      scrollTilt = r.height ? Math.max(0, Math.min(1, -r.top / r.height)) : 0;
    };
    window.addEventListener('scroll', onScrollTilt, { passive: true });
    onScrollTilt();
  }

  if (interactive) {
    window.addEventListener('scroll', dropRect, { passive: true });
    window.addEventListener('resize', dropRect);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerGone);
    window.addEventListener('blur', onPointerGone);
    if (host) {
      /* on the section, not the canvas: the canvas is pointer-events:
         none so the hero's own links keep working untouched */
      host.addEventListener('pointerdown', onPointerDown, { passive: true });
      host.addEventListener('pointermove', onTapMove, { passive: true });
      host.addEventListener('pointerup', onPointerUp, { passive: true });
      host.addEventListener('pointercancel', onPointerCancel, { passive: true });
      window.addEventListener('pointermove', onDragMove, { passive: true });
      window.addEventListener('pointermove', onGalaxyMove, { passive: true });
      window.addEventListener('pointerup', onGalaxyEnd, { passive: true });
      window.addEventListener('pointercancel', onGalaxyEnd, { passive: true });
      window.addEventListener('pointerup', onDragEnd, { passive: true });
      window.addEventListener('pointercancel', onDragEnd, { passive: true });
      /* stop a backdrop drag from starting a text selection */
      host.addEventListener('mousedown', function (ev) {
        if (ev.button === 0 && !isControl(ev.target) && !isText(ev.target)) {
          ev.preventDefault();
        }
      });
      Array.prototype.forEach.call(host.querySelectorAll('[data-bh-stir]'), function (el) {
        el.addEventListener('mouseenter', function () { setStir(true); });
        el.addEventListener('mouseleave', function () { setStir(false); });
        el.addEventListener('focusin', function () { setStir(true); });
        el.addEventListener('focusout', function () { setStir(false); });
      });
    }
  }

  raf = requestAnimationFrame(frame);

  /* A small handle for page code (the hero's feed button and read
     transition). hole() reports where the hole is on screen right now,
     in client pixels, with the disk's outer radius. */
  return {
    interactive: interactive,
    feed: function (strength) {
      if (interactive) {
        feed(strength);
      }
    },
    /* keyboard route to the drag: spin by dk, tilt by de */
    nudge: function (dk, de) {
      if (!interactive) {
        return;
      }
      kerrTarget = Math.max(0, Math.min(0.998, kerrTarget + (dk || 0)));
      dragElev = Math.max(-0.22, Math.min(0.68, dragElev + (de || 0)));
      emit('orbit', true);
      if (!raf) {
        raf = requestAnimationFrame(frame);
      }
    },
    alignGalaxy: function () {
      if (interactive) {
        alignGalaxy();
      }
    },
    /* Where the galaxy's primary image is on screen right now, in
       client pixels: the lens equation solved forward, theta+ =
       (beta + sqrt(beta^2 + 4 thetaE^2)) / 2 along the source direction,
       then the sky twist and frame cant undone. */
    galaxyImage: function () {
      var b = Math.sqrt(galX * galX + galY * galY);
      var th = 0.5 * (b + Math.sqrt(b * b + 4 * GAL_THETA * GAL_THETA));
      var ux = b > 1e-6 ? galX / b * th : th;
      var uy = b > 1e-6 ? galY / b * th : 0;
      var tw = Math.min(kerr * 0.0062 / (th * th + 0.0022), 1.6);
      var x = Math.cos(tw) * ux + Math.sin(tw) * uy;
      var y = -Math.sin(tw) * ux + Math.cos(tw) * uy;
      var c0 = Math.cos(-0.10);
      var s0 = Math.sin(-0.10);
      var sx = c0 * x - s0 * y;
      var sy = s0 * x + c0 * y;
      var rc = canvas.getBoundingClientRect();
      var ctr = cfg.center(rc.width, rc.height);
      var z = zoomFor(rc.width, rc.height);
      return {
        x: rc.left + ctr[0] * rc.width + sx * rc.height / z,
        y: rc.top + (1 - ctr[1]) * rc.height - sy * rc.height / z,
        source: { x: galX, y: galY }
      };
    },
    galaxyEnabled: function () {
      return !!cfg.galaxy && !lightTarget;
    },
    spinTarget: function () {
      return kerrTarget;
    },
    hole: function () {
      var rc = canvas.getBoundingClientRect();
      var ctr = cfg.center(rc.width, rc.height);
      var z = zoomFor(rc.width, rc.height);
      return {
        x: rc.left + ctr[0] * rc.width,
        y: rc.top + (1 - ctr[1]) * rc.height,
        r: 0.95 * rc.height / z
      };
    }
  };
}

/* Pillar grades for the hero disk, keyed by the lead article's
   section (front-page.php prints it as data-bh-tint on the canvas).
   Space is the native incandescent ramp. */
/* [r, g, b, amount]: the hue to grade toward and how far */
var INFINITY_BH_TINTS = {
  space:   [1.00, 1.00, 1.00, 0.00],
  health:  [0.30, 0.95, 1.10, 0.60],
  science: [0.55, 1.05, 0.62, 0.50],
  mind:    [0.75, 0.50, 1.25, 0.55],
  travel:  [1.15, 0.85, 0.40, 0.45]
};

/* ---------- hero analytics ----------

   What visitors do in the hero is pushed onto window.infinityHeroQ.
   This file knows nothing about analytics: rum.js (loaded only for
   logged-out visitors, and deferred, so usually after this runs)
   drains whatever is queued and swaps in a live push. Nothing is
   recorded when the collector is absent. Every entry carries the
   session's experiment arm, so the dashboard can split by it. */
var infinityHeroVariant = '';
var infinityHeroStart = 0;

function infinityHeroTrack(action, extra) {
  'use strict';
  var entry = { action: action, variant: infinityHeroVariant };
  if (extra) {
    for (var k in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, k)) {
        entry[k] = extra[k];
      }
    }
  }
  (window.infinityHeroQ = window.infinityHeroQ || []).push(entry);
}

/* The experiment arm for this tab. A holdout share of sessions
   (Customizer, data-bh-holdout) gets the calm hero: the same animated
   black hole with none of its interactions. The random roll, not the
   arm, is what sessionStorage keeps, so the arm stays put for the life
   of the tab and a changed holdout share reassigns consistently.
   Visitors who could not get the interactive hero anyway (reduced
   motion, no WebGL) are 'static' and sit outside the comparison. */
function infinityHeroArm(canvas) {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'static';
  }
  var holdout = parseInt(canvas.getAttribute('data-bh-holdout'), 10) || 0;
  if (holdout <= 0) {
    return 'fx';
  }
  var roll = NaN;
  try {
    roll = parseFloat(sessionStorage.getItem('infHeroRoll'));
    if (!(roll >= 0 && roll < 100)) {
      roll = Math.random() * 100;
      sessionStorage.setItem('infHeroRoll', String(roll));
    }
  } catch (e) {
    /* no storage: a fresh roll per page view still splits fairly */
    roll = Math.random() * 100;
  }
  return roll < holdout ? 'calm' : 'fx';
}

/* Where clicks inside the hero go. Runs in every arm, including the
   calm and static ones, because it is the outcome being compared. */
function infinityHeroClicks(section) {
  'use strict';
  var MAP = [
    ['.fp-lead-title a, .fp-lead-media', 'lead-click'],
    ['.fp-lead-cat', 'lead-cat'],
    ['.fp-hero-latest-pill', 'also-new'],
    ['.fp-pillar-nav a', 'pillar-nav'],
    ['.hero-steam-card a', 'wishlist']
  ];

  function onClick(ev) {
    /* left clicks, plus middle clicks via auxclick (new-tab opens) */
    if (ev.type === 'auxclick' && ev.button !== 1) {
      return;
    }
    var t = ev.target;
    if (!t || !t.closest) {
      return;
    }
    for (var i = 0; i < MAP.length; i++) {
      if (t.closest(MAP[i][0])) {
        var extra = null;
        if (MAP[i][1] === 'lead-click' && infinityHeroStart) {
          extra = { sec: (performance.now() - infinityHeroStart) / 1000 };
        }
        infinityHeroTrack(MAP[i][1], extra);
        return;
      }
    }
  }

  /* capture: recorded before the read transition takes over the click */
  section.addEventListener('click', onClick, true);
  section.addEventListener('auxclick', onClick, true);
}

var infinityHeroBh = null;
var infinityGalTag = null;
var infinityGalTagIntro = 0;

/* A small "drag me" tag on the lensed galaxy's primary image, so the
   galaxy can be found: shown for a few seconds as the hero arrives,
   and again while the pointer is near the hole. Hidden while dragging,
   near alignment (it is the ring by then), off the section, on narrow
   screens and in paper mode. Decorative, so aria-hidden. */
function infinityHeroHud(st) {
  'use strict';
  var bh = infinityHeroBh;
  if (!bh || !bh.interactive || window.innerWidth < 1100 || !bh.galaxyEnabled()) {
    if (infinityGalTag) {
      infinityGalTag.classList.remove('is-on');
    }
    return;
  }
  var now = performance.now();
  if (!infinityGalTag) {
    var section = document.getElementById('fp-blackhole');
    section = section && section.parentNode;
    if (!section) {
      return;
    }
    infinityGalTag = document.createElement('div');
    infinityGalTag.className = 'bh-gal-tag';
    infinityGalTag.setAttribute('aria-hidden', 'true');
    infinityGalTag.innerHTML = '<span class="bh-gal-ring"></span><span class="bh-gal-label">\u2726 galaxy \u00B7 drag me</span>';
    section.appendChild(infinityGalTag);
    infinityGalTagIntro = now + 4500;
  }
  var gi = bh.galaxyImage();
  var pr = infinityGalTag.parentNode.getBoundingClientRect();
  var gx = gi.x - pr.left;
  var gy = gi.y - pr.top;
  var show = (now < infinityGalTagIntro || st.hover > 0.35) && !st.dragging &&
    st.galU !== null && st.galU > 0.55 &&
    gx > 20 && gx < pr.width - 20 && gy > 20 && gy < pr.height - 20;
  infinityGalTag.classList.toggle('is-on', show);
  if (show) {
    infinityGalTag.style.transform = 'translate(' + Math.round(gx) + 'px,' + Math.round(gy) + 'px)';
  }
}

/* Hero furniture that drives the black hole: the accessible feed
   button and the read transition on the lead card. */
function infinityHeroControls(section, bh) {
  'use strict';
  if (!section || !bh || !bh.interactive) {
    return;
  }

  var WIDE = 1100;

  /* ---- Feed button + live region ----
     The backdrop click is pointer-only and invisible to assistive
     tech; this is the same event for everyone else. On wide screens it
     is placed beside the hole itself, below the two-column breakpoint
     it stays in the copy column's flow. */
  var btn = section.querySelector('[data-bh-feed]');
  var live = section.querySelector('[data-bh-live]');
  var liveTimer = null;

  function place() {
    if (!btn) {
      return;
    }
    if (window.innerWidth < WIDE || !btn.offsetParent) {
      btn.style.left = '';
      btn.style.top = '';
      btn.classList.remove('is-floating');
      return;
    }
    btn.classList.add('is-floating');
    var parent = btn.offsetParent.getBoundingClientRect();
    var h = bh.hole();
    var bw = btn.offsetWidth;
    var bhgt = btn.offsetHeight;
    /* centred over the hole, just above the top of the disk, which is
       open sky on every wide layout; never allowed down onto the Steam
       card if the hole ever sits that low */
    var x = h.x - parent.left - bw / 2;
    var y = h.y - parent.top - h.r * 0.52 - bhgt;
    var steam = section.querySelector('.hero-steam-card');
    var maxY = parent.height - bhgt - 8;
    if (steam) {
      maxY = Math.min(maxY, steam.getBoundingClientRect().top - parent.top - bhgt - 10);
    }
    x = Math.max(8, Math.min(x, parent.width - bw - 8));
    y = Math.max(8, Math.min(y, maxY));
    btn.style.left = Math.round(x) + 'px';
    btn.style.top = Math.round(y) + 'px';
  }

  if (btn) {
    btn.hidden = false;
    btn.addEventListener('click', function () {
      bh.feed(1);
      infinityHeroTrack('feed-btn');
      btn.classList.remove('is-pulsing');
      void btn.offsetWidth; /* restart the ring animation */
      btn.classList.add('is-pulsing');
      if (live) {
        live.textContent = '';
        clearTimeout(liveTimer);
        /* a fresh node change, so a repeat press is announced again */
        setTimeout(function () {
          live.textContent = live.getAttribute('data-msg') || '';
        }, 30);
        liveTimer = setTimeout(function () { live.textContent = ''; }, 4500);
      }
    });
    /* Arrow keys on the focused button do what a drag does: left and
       right wind the spin down and up, up and down tilt the camera. The
       new spin is announced once the keys go quiet. */
    var spinTimer = null;
    btn.addEventListener('keydown', function (ev) {
      var dk = 0;
      var de = 0;
      if ((ev.key === 'g' || ev.key === 'G') && bh.galaxyEnabled()) {
        ev.preventDefault();
        bh.alignGalaxy();
        if (live) {
          live.textContent = '';
          setTimeout(function () {
            live.textContent = 'Galaxy moving behind the black hole: its light is bent into an Einstein ring.';
          }, 30);
        }
        return;
      }
      if (ev.key === 'ArrowRight') { dk = 0.05; }
      else if (ev.key === 'ArrowLeft') { dk = -0.05; }
      else if (ev.key === 'ArrowUp') { de = 0.06; }
      else if (ev.key === 'ArrowDown') { de = -0.06; }
      else { return; }
      ev.preventDefault();
      bh.nudge(dk, de);
      if (live && dk) {
        clearTimeout(spinTimer);
        spinTimer = setTimeout(function () {
          live.textContent = 'Black hole spin ' + bh.spinTarget().toFixed(2) + '.';
        }, 700);
      }
    });
    place();
    window.addEventListener('resize', place);
    window.addEventListener('load', place);
  }

  /* ---- Read transition: the card falls in ----
     A plain left-click on the lead article's title or image feeds the
     hole and pulls the card toward it - stretched along the line to
     the hole and squeezed across it, which is what a tidal field does -
     then navigates. Capped at 340ms so it never reads as lag; modified
     clicks, middle clicks and new-tab links are left entirely alone. */
  var card = section.querySelector('.fp-lead');
  var FALL_MS = 340;

  function onReadClick(ev) {
    var link = ev.currentTarget;
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey ||
        ev.shiftKey || ev.altKey || (link.target && link.target !== '_self')) {
      return;
    }
    var href = link.href;
    if (!href || card.classList.contains('is-falling')) {
      return;
    }
    ev.preventDefault();
    try {
      var h = bh.hole();
      var r = card.getBoundingClientRect();
      var dx = h.x - (r.left + r.width / 2);
      var dy = h.y - (r.top + r.height / 2);
      card.style.setProperty('--bh-dx', Math.round(dx * 0.45) + 'px');
      card.style.setProperty('--bh-dy', Math.round(dy * 0.45) + 'px');
      card.style.setProperty('--bh-ang', Math.atan2(dy, dx).toFixed(3) + 'rad');
      card.classList.add('is-falling');
      bh.feed(0.8);
      infinityHeroTrack('read-fall');
    } catch (e) {
      window.location.assign(href);
      return;
    }
    setTimeout(function () { window.location.assign(href); }, FALL_MS);
  }

  if (card) {
    Array.prototype.forEach.call(card.querySelectorAll('.fp-lead-title a, .fp-lead-media'), function (a) {
      a.addEventListener('click', onReadClick);
    });
    /* Back button with bfcache: the page comes back mid-fall unless
       the card is reset. */
    window.addEventListener('pageshow', function () {
      card.classList.remove('is-falling');
    });
  }
}

/* Hero: incandescent disk anchored at the wordmark */
(function () {
  var hero = document.getElementById('fp-blackhole');
  if (hero) {
    /* The swarm is the expensive half of the scene: every particle is
       a point per tail segment, every frame. A phone is drawing this
       on a fraction of the pixels and a fraction of the power budget,
       so it gets a proportionally smaller one — at that size the
       difference is invisible, and it is the difference between the
       hero costing a phone something and costing it nothing. */
    var small = Math.min(window.innerWidth, window.innerHeight) < 620;
    /* Layout v2: the copy column (wordmark + lead article) is on the
       left, so on wide screens the hole is the centrepiece of the right
       column, above the Steam card. Below the two-column breakpoint it
       rides high behind the wordmark and the article card sits on it.

       Zoom is solved for a target disk radius in CSS pixels. The disk
       spans ~0.95 shader units and a shader unit is height/zoom pixels,
       so zoom = 0.95 * h / radius. Sizing it off the column width keeps
       the disk inside its column at every aspect, where a fixed zoom let
       it grow with the section height - huge on a tall phone hero. */
    var WIDE = 1100;
    infinityHeroStart = performance.now();
    infinityHeroVariant = infinityHeroArm(hero);
    var heroBh = infinityBlackhole(hero, {
      onAction: function (name) { infinityHeroTrack(name); },
      onState: function (st) { infinityHeroHud(st); },
      twistor: true,
      /* plasma on the congruence: the phone budget gets the smaller swarm */
      twistorParticles: small ? { n: 36, tail: 6 } : { n: 110, tail: 9 },
      scrollTilt: true,
      galaxy: true,
      /* particles heat and stir the disk through the plasma field */
      plasma: true,
      tint: INFINITY_BH_TINTS[hero.getAttribute('data-bh-tint')] || INFINITY_BH_TINTS.space,
      probe: true,
      zoom: function (w, h) {
        var radius = (w >= WIDE) ? Math.min(w * 0.26, h * 0.6, 520) : Math.min(w * 0.62, 420);
        return 0.95 * h / Math.max(radius, 120);
      },
      variant: 0,
      followTheme: true,
      /* the calm arm keeps the animation, loses the interactions */
      interactive: infinityHeroVariant === 'fx',
      particles: small ? { n: 34, tail: 5 } : { n: 90, tail: 8 },
      slices: small ? 2 : 3,
      center: function (w, h) {
        if (w >= WIDE) {
          return [0.735, 0.64];
        }
        /* ~170px below the top edge, whatever the hero's height */
        return [0.62, 1 - Math.min(170 / Math.max(h, 1), 0.4)];
      }
    });
    infinityHeroBh = heroBh || null;
    if (!heroBh) {
      /* no WebGL: the CSS fallback can't be interactive either */
      infinityHeroVariant = 'static';
    }
    infinityHeroTrack('impression');
    infinityHeroClicks(hero.parentNode);
    infinityHeroControls(hero.parentNode, heroBh);
  }

  /* Parker's band: centered binary-palette disk behind the logo. It is
     screened over its own dark backdrop art, not the page, so it keeps
     the night palette in both modes. */
  var pp = document.getElementById('pp-blackhole');
  if (pp) {
    infinityBlackhole(pp, {
      zoom: 1.3,
      variant: 1,
      particles: (Math.min(window.innerWidth, window.innerHeight) < 620)
        ? { n: 22, tail: 5 }
        : { n: 56, tail: 7 },
      /* a second disk on the same page: it carries the cheaper column */
      slices: 2,
      center: function () { return [0.5, 0.5]; }
    });
  }
})();
