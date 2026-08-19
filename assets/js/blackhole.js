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
    '  float tilt = -0.10 + 0.03 * sin(u_time * 0.09);',
    '  uv = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * uv;',
    '',
    '  /* Disk plane: strong inclination, breathing slightly. Stirring',
    '     it puffs the disk up — a smaller squash is a thicker disk. */',
    '  vec2 p = vec2(uv.x, uv.y * (3.4 - 0.5 * u_hover - 0.55 * u_feed + 0.35 * sin(u_time * 0.07)));',
    '  float r = length(p);',
    '  float ang = atan(p.y, p.x);',
    '',
    '  float rc = length(uv * vec2(1.0, 1.12));',
    '  float rr = r - 0.05 / max(r, 0.06);',
    '',
    '  /* Differential rotation. Driven by u_spin, an accumulated clock',
    '     the JS warps on hover — scaling wall time here instead would',
    '     teleport the phase every time the rate changed. */',
    '  float swirl = ang - u_spin * 0.55 - 1.4 / (0.25 + rr * rr);',
    '',
    '  /* Seam-free filaments: blend across the atan wrap at +-PI */',
    '  float wSeam = smoothstep(2.4, 3.14159, abs(ang)) * 0.5;',
    '  float sA = fbm(vec2(swirl * 2.3, rr * 10.0 - u_spin * 0.1));',
    '  float sB = fbm(vec2((swirl - sign(ang) * 6.2831853) * 2.3, rr * 10.0 - u_spin * 0.1));',
    '  float streaks = pow(mix(sA, sB, wSeam), 1.6);',
    '',
    '  /* Hover churns the plasma: a finer turbulence layer rides on the',
    '     filaments and the contrast between them sharpens. One noise()',
    '     rather than a fourth fbm, and behind a uniform branch, so an',
    '     untouched hero costs exactly what it did before. */',
    '  if (u_hover > 0.002) {',
    '    float fine = noise(vec2(swirl * 7.5, rr * 26.0 - u_spin * 0.7));',
    '    streaks = mix(streaks, streaks * (0.5 + 1.05 * fine), u_hover * 0.9);',
    '  }',
    '',
    '  /* Radial profile */',
    '  float disk = smoothstep(0.155, 0.26, rr) * (1.0 - smoothstep(0.5, 0.95, rr));',
    '',
    '  /* Doppler beaming, harder when the disk is spun up */',
    '  float doppler = 1.0 + (0.55 + 0.3 * u_hover) * (-uv.x / max(r, 0.001));',
    '  float bright = disk * (0.24 + 1.3 * streaks) * doppler;',
    '  bright *= 1.0 + 0.5 * u_hover + 0.85 * u_feed;',
    '',
    '  /* 3D shading: lit from above, near (lower) side in shadow */',
    '  float vshade = 0.78 + 0.5 * smoothstep(-0.3, 0.35, uv.y);',
    '  bright *= vshade;',
    '  bright *= 1.0 + 0.35 * u_variant;',
    '',
    '  /* Photon ring + lensed far-side arc (soft lower boundary) */',
    '  float photon = exp(-pow((rc - 0.148) * 95.0, 2.0)) * (1.0 + 1.4 * u_feed);',
    '  float arc = exp(-pow((rc - 0.185) * 34.0, 2.0)) * smoothstep(-0.3, 0.55, uv.y / max(rc, 0.001));',
    '  arc *= 0.55 + 0.45 * fbm(vec2(atan(uv.y, uv.x) * 2.5 - u_spin * 0.35, rc * 18.0));',
    '',
    '  /* Event horizon silhouette */',
    '  float horizon = 1.0 - smoothstep(0.118, 0.138, rc);',
    '',
    '  /* Near/far split: below passes in front, above goes behind */',
    '  float nearMask = smoothstep(0.06, -0.06, uv.y);',
    '  float farMask = 1.0 - nearMask;',
    '',
    '  /* Incandescent color ramp. In light mode the same ramp is',
    '     re-cast as pigment: darker and more saturated, so the disk',
    '     prints against a pale page instead of washing out. */',
    '  vec3 hot   = mix(vec3(1.0, 0.98, 0.93), vec3(1.0, 0.86, 0.52), u_light);',
    '  vec3 gold  = mix(vec3(1.0, 0.78, 0.40), vec3(0.93, 0.52, 0.10), u_light);',
    '  vec3 ember = mix(vec3(0.98, 0.42, 0.14), vec3(0.68, 0.18, 0.04), u_light);',
    '  vec3 viol  = mix(vec3(0.55, 0.32, 0.85), vec3(0.26, 0.14, 0.45), u_light);',
    '  vec3 col = mix(hot, gold, smoothstep(0.17, 0.34, rr));',
    '  col = mix(col, ember, smoothstep(0.34, 0.60, rr));',
    '  col = mix(col, viol, smoothstep(0.62, 0.95, rr));',
    '',
    '  /* Relativistic color shift */',
    '  float dop = clamp(-uv.x / max(r, 0.001), -1.0, 1.0);',
    '  col = mix(col, col * vec3(0.85, 0.92, 1.35) + vec3(0.12), clamp(dop, 0.0, 1.0) * 0.4);',
    '  col = mix(col, col * vec3(1.25, 0.62, 0.42), clamp(-dop, 0.0, 1.0) * 0.45);',
    '',
    '  /* Variant 1 (Parker\'s): binary-logo palette — hard blue/orange split */',
    '  if (u_variant > 0.5) {',
    '    col = mix(col, col * vec3(0.5, 0.75, 1.9) + vec3(0.04, 0.1, 0.3), clamp(dop, 0.0, 1.0) * 0.5);',
    '    col = mix(col, col * vec3(1.6, 0.7, 0.3), clamp(-dop, 0.0, 1.0) * 0.45);',
    '  }',
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
    '  /* Stars (behind everything, hidden by the hole) */',
    '  vec2 cell = floor(gl_FragCoord.xy / 2.0);',
    '  float star = pow(hash(cell), 220.0) * smoothstep(0.45, 0.85, rc);',
    '  star *= 0.55 + 0.45 * sin(u_time * 2.2 + hash(cell + 7.0) * 44.0);',
    '  star *= 1.0 - u_light; /* white pinpricks have nothing to show on white */',
    '  c += vec3(0.75, 0.82, 1.0) * star * 1.4 * (1.0 - horizon);',
    '  alpha += star * 1.2 * (1.0 - horizon);',
    '',
    '  /* Far side of the disk: occluded by the event horizon */',
    '  c += col * bright * farMask * (1.0 - horizon);',
    '  alpha += bright * 1.5 * farMask * (1.0 - horizon);',
    '',
    '  /* The black hole itself: an opaque void */',
    '  alpha += horizon * 0.92;',
    '',
    '  /* Photon ring, lensed arc, bloom (outside the silhouette) */',
    '  c += mix(vec3(1.0, 0.94, 0.82), vec3(1.0, 0.72, 0.18), u_light) * photon * 0.9 * (1.0 - horizon);',
    '  c += mix(vec3(1.0, 0.91, 0.725), vec3(0.98, 0.60, 0.12), u_light) * arc * 0.75 * (1.0 - horizon);',
    '  c += mix(vec3(1.0, 0.8, 0.5), vec3(0.95, 0.55, 0.12), u_light) * exp(-pow((rc - 0.148) * 13.0, 2.0)) * 0.16;',
    '  alpha += (photon * 0.8 + arc * 0.6) * (1.0 - horizon) + exp(-pow((rc - 0.148) * 13.0, 2.0)) * 0.12;',
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
    '  float halo = 1.0 - smoothstep(0.0, mix(0.9, 0.6, u_light), rc);',
    '  c += mix(ember * 0.045, vec3(0.30, 0.34, 0.50) * 0.05, u_light) * halo;',
    '  alpha += mix(0.04, 0.13, u_light) * halo;',
    '',
    '  gl_FragColor = vec4(c, clamp(alpha, 0.0, 1.0));',
    '}'
  ].join('\n');

  /* ---------- particle pass: infalling sparks ---------- */

  var PART_VERT = [
    'precision highp float;',
    'attribute vec2 a_pt; /* x: particle seed, y: tail segment */',
    'uniform vec2 u_res;',
    'uniform float u_time;',
    'uniform vec2 u_center;',
    'uniform float u_zoom;',
    'uniform float u_spin;',
    'uniform float u_feed;',
    'varying float v_heat;',
    'varying float v_fade;',
    '',
    'void main() {',
    '  float seed = a_pt.x * 123.717;',
    '  float seg = a_pt.y; /* 0 = head, grows toward tail */',
    '',
    '  /* Keplerian orbit params per particle */',
    '  float aAxis = mix(0.3, 0.95, fract(seed * 0.731));',
    '  float ecc   = mix(0.04, 0.42, fract(seed * 0.567));',
    '  float peri  = seed * 6.2831853;',
    '  float n     = 0.5 / pow(aAxis, 1.5); /* mean motion: inner = faster */',
    '',
    '  /* A fifth of the swarm is on doomed inspiral orbits — most of it',
    '     once the hole starts feeding */',
    '  float doomed = step(0.8 - 0.5 * u_feed, fract(seed * 0.293));',
    '  float cycle = fract(u_spin * 0.05 / aAxis + fract(seed * 3.137));',
    '',
    '  /* Tail: sample the SAME orbit at earlier phase. On the warped',
    '     clock, so the swarm speeds up with the disk. */',
    '  float theta = peri + u_spin * n - seg * 0.085;',
    '',
    '  /* Conic section radius; inspiral shrinks the whole orbit */',
    '  float shrink = mix(1.0, mix(1.0, 0.16 / aAxis, pow(cycle, 1.6)), doomed);',
    '  float r = aAxis * shrink * (1.0 - ecc * ecc) / (1.0 + ecc * cos(theta - peri));',
    '  r = max(r, 0.125);',
    '',
    '  vec2 p = vec2(cos(theta), sin(theta)) * r;',
    '  p.y /= 3.3; /* disk inclination */',
    '',
    '  float tilt = 0.10;',
    '  p = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * p;',
    '  p /= u_zoom; /* match disk zoom */',
    '',
    '  vec2 clip = p * vec2(u_res.y / u_res.x, 1.0) * 2.0 + (u_center * 2.0 - 1.0);',
    '  gl_Position = vec4(clip, 0.0, 1.0);',
    '',
    '  /* Heat rises as radius falls; head hotter than tail */',
    '  v_heat = clamp((0.22 + 0.12 * u_feed) / r - 0.15, 0.0, 1.0) * (1.0 - seg * 0.08);',
    '',
    '  /* Tail fades along its length; doomed ones flare then vanish */',
    '  float tailFade = 1.0 - seg / 8.0;',
    '  float doomFade = mix(1.0, sin(cycle * 3.14159), doomed);',
    '  v_fade = tailFade * tailFade * doomFade;',
    '',
    '  gl_PointSize = max(u_res.y * (0.011 + 0.004 * u_feed - seg * 0.0011), 1.0);',
    '}'
  ].join('\n');

  var PART_FRAG = [
    'precision mediump float;',
    'uniform float u_light;',
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
    '  /* Night: premultiplied, drawn additively. Paper: straight color',
    '     under source-over, so a spark darkens the page instead of',
    '     brightening it (adding light to white does nothing). */',
    '  gl_FragColor = vec4(mix(col * a, col, u_light), a * mix(0.9, 1.0, u_light));',
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

  function settling() {
    return lightCur !== lightTarget || hoverCur !== hoverTarget || feedCur > 0;
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

    /* Stirring spins the disk up; feeding makes it race */
    spin += dt * (1.0 + 0.9 * hoverCur + 2.4 * feedCur);

    var c = cfg.center(canvas.clientWidth);
    var cx = c[0];
    var cy = c[1];

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
    gl.uniform1f(dZoom, cfg.zoom);
    gl.uniform1f(dVariant, cfg.variant);
    gl.uniform1f(dLight, lightCur);
    gl.uniform1f(dSpin, spin);
    gl.uniform1f(dHover, hoverCur);
    gl.uniform1f(dFeed, feedCur);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

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
      gl.uniform1f(pZoom, cfg.zoom);
      gl.uniform1f(pLight, lightCur);
      gl.uniform1f(pSpin, spin);
      gl.uniform1f(pFeed, feedCur);
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
    if (!hostRect) {
      hostRect = canvas.getBoundingClientRect();
    }
    var rc = hostRect;
    if (!rc.width || !rc.height ||
        ev.clientX < rc.left || ev.clientX > rc.right ||
        ev.clientY < rc.top || ev.clientY > rc.bottom) {
      hoverTarget = 0;
      arm(false);
      return;
    }
    /* cfg.center is in the shader's bottom-up normalized space */
    var ctr = cfg.center(rc.width);
    var dx = (ev.clientX - (rc.left + ctr[0] * rc.width)) / rc.height * cfg.zoom;
    var dy = (ev.clientY - (rc.top + (1 - ctr[1]) * rc.height)) / rc.height * cfg.zoom;
    /* full response over the hole, easing down to a floor across the
       rest of the section so the disk stays alive to the pointer */
    var near = 1 - smooth(0.22, 1.25, Math.sqrt(dx * dx + dy * dy));
    hoverTarget = Math.max(0.18, near);
    arm(near > 0.5);
    if (!raf) {
      raf = requestAnimationFrame(frame);
    }
  }

  function onFeed() {
    feedCur = 1;
    if (!raf) {
      raf = requestAnimationFrame(frame);
    }
  }

  function onPointerGone() {
    hoverTarget = 0;
    arm(false);
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
      host.addEventListener('pointerdown', onFeed);
    }
  }

  raf = requestAnimationFrame(frame);
}

/* Hero: incandescent disk anchored at the wordmark */
(function () {
  var hero = document.getElementById('fp-blackhole');
  if (hero) {
    infinityBlackhole(hero, {
      zoom: 1.55,
      variant: 0,
      followTheme: true,
      interactive: true,
      particles: { n: 90, tail: 8 },
      center: function (w) { return [w > 900 ? 0.195 : 0.5, 0.42]; }
    });
  }

  /* Parker's band: centered binary-palette disk behind the logo. It is
     screened over its own dark backdrop art, not the page, so it keeps
     the night palette in both modes. */
  var pp = document.getElementById('pp-blackhole');
  if (pp) {
    infinityBlackhole(pp, {
      zoom: 1.3,
      variant: 1,
      particles: { n: 56, tail: 7 },
      center: function () { return [0.5, 0.5]; }
    });
  }
})();
