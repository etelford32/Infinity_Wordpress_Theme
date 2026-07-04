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
 */
(function () {
  'use strict';

  var canvas = document.getElementById('fp-blackhole');
  if (!canvas) return;

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
    'void main() {',
    '  vec2 uv = (gl_FragCoord.xy - u_center * u_res) / u_res.y;',
    '  uv *= 1.55;',
    '  float tilt = -0.10 + 0.03 * sin(u_time * 0.09);',
    '  uv = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * uv;',
    '',
    '  /* Disk plane: strong inclination, breathing slightly */',
    '  vec2 p = vec2(uv.x, uv.y * (3.4 + 0.35 * sin(u_time * 0.07)));',
    '  float r = length(p);',
    '  float ang = atan(p.y, p.x);',
    '',
    '  float rc = length(uv * vec2(1.0, 1.12));',
    '  float rr = r - 0.05 / max(r, 0.06);',
    '',
    '  /* Differential rotation */',
    '  float swirl = ang - u_time * 0.55 - 1.4 / (0.25 + rr * rr);',
    '',
    '  /* Seam-free filaments: blend across the atan wrap at +-PI */',
    '  float wSeam = smoothstep(2.4, 3.14159, abs(ang)) * 0.5;',
    '  float sA = fbm(vec2(swirl * 2.3, rr * 10.0 - u_time * 0.1));',
    '  float sB = fbm(vec2((swirl - sign(ang) * 6.2831853) * 2.3, rr * 10.0 - u_time * 0.1));',
    '  float streaks = pow(mix(sA, sB, wSeam), 1.6);',
    '',
    '  /* Radial profile */',
    '  float disk = smoothstep(0.155, 0.26, rr) * (1.0 - smoothstep(0.5, 0.95, rr));',
    '',
    '  /* Doppler beaming */',
    '  float doppler = 1.0 + 0.55 * (-uv.x / max(r, 0.001));',
    '  float bright = disk * (0.24 + 1.3 * streaks) * doppler;',
    '',
    '  /* 3D shading: lit from above, near (lower) side in shadow */',
    '  float vshade = 0.78 + 0.5 * smoothstep(-0.3, 0.35, uv.y);',
    '  bright *= vshade;',
    '',
    '  /* Photon ring + lensed far-side arc (soft lower boundary) */',
    '  float photon = exp(-pow((rc - 0.148) * 95.0, 2.0));',
    '  float arc = exp(-pow((rc - 0.185) * 34.0, 2.0)) * smoothstep(-0.3, 0.55, uv.y / max(rc, 0.001));',
    '  arc *= 0.55 + 0.45 * fbm(vec2(atan(uv.y, uv.x) * 2.5 - u_time * 0.35, rc * 18.0));',
    '',
    '  /* Event horizon silhouette */',
    '  float horizon = 1.0 - smoothstep(0.118, 0.138, rc);',
    '',
    '  /* Near/far split: below passes in front, above goes behind */',
    '  float nearMask = smoothstep(0.06, -0.06, uv.y);',
    '  float farMask = 1.0 - nearMask;',
    '',
    '  /* Incandescent color ramp */',
    '  vec3 hot   = vec3(1.0, 0.98, 0.93);',
    '  vec3 gold  = vec3(1.0, 0.78, 0.40);',
    '  vec3 ember = vec3(0.98, 0.42, 0.14);',
    '  vec3 viol  = vec3(0.55, 0.32, 0.85);',
    '  vec3 col = mix(hot, gold, smoothstep(0.17, 0.34, rr));',
    '  col = mix(col, ember, smoothstep(0.34, 0.60, rr));',
    '  col = mix(col, viol, smoothstep(0.62, 0.95, rr));',
    '',
    '  /* Relativistic color shift */',
    '  float dop = clamp(-uv.x / max(r, 0.001), -1.0, 1.0);',
    '  col = mix(col, col * vec3(0.85, 0.92, 1.35) + vec3(0.12), clamp(dop, 0.0, 1.0) * 0.4);',
    '  col = mix(col, col * vec3(1.25, 0.62, 0.42), clamp(-dop, 0.0, 1.0) * 0.45);',
    '',
    '  /* Hot inner rim facing the viewer on the near side */',
    '  float rim = smoothstep(0.30, 0.17, rr) * smoothstep(0.14, 0.20, rr) * nearMask * disk;',
    '  col += hot * rim * 0.6;',
    '',
    '  /* ---- composite back-to-front ---- */',
    '  vec3 c = vec3(0.0);',
    '  float alpha = 0.0;',
    '',
    '  /* Stars (behind everything, hidden by the hole) */',
    '  vec2 cell = floor(gl_FragCoord.xy / 2.0);',
    '  float star = pow(hash(cell), 220.0) * smoothstep(0.45, 0.85, rc);',
    '  star *= 0.55 + 0.45 * sin(u_time * 2.2 + hash(cell + 7.0) * 44.0);',
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
    '  c += vec3(1.0, 0.94, 0.82) * photon * 0.9 * (1.0 - horizon);',
    '  c += mix(vec3(1.0, 0.85, 0.55), vec3(1.0, 0.97, 0.9), 0.5) * arc * 0.75 * (1.0 - horizon);',
    '  c += vec3(1.0, 0.8, 0.5) * exp(-pow((rc - 0.148) * 13.0, 2.0)) * 0.16;',
    '  alpha += (photon * 0.8 + arc * 0.6) * (1.0 - horizon) + exp(-pow((rc - 0.148) * 13.0, 2.0)) * 0.12;',
    '',
    '  /* Near side of the disk: drawn OVER the hole — the depth cue */',
    '  c += col * bright * nearMask;',
    '  alpha += bright * 1.5 * nearMask;',
    '',
    '  /* Faint warm halo */',
    '  c += ember * 0.045 * (1.0 - smoothstep(0.0, 0.9, rc));',
    '  alpha += 0.04 * (1.0 - smoothstep(0.0, 0.9, rc));',
    '',
    '  gl_FragColor = vec4(c, clamp(alpha, 0.0, 1.0));',
    '}'
  ].join('\n');

  /* ---------- particle pass: infalling sparks ---------- */

  var PART_VERT = [
    'precision highp float;',
    'attribute float a_seed;',
    'uniform vec2 u_res;',
    'uniform float u_time;',
    'uniform vec2 u_center;',
    'varying float v_heat;',
    'varying float v_fade;',
    '',
    'void main() {',
    '  float seed = a_seed * 123.717;',
    '  float r0 = mix(0.95, 0.4, fract(seed * 0.731));',
    '  float speed = mix(0.035, 0.09, fract(seed * 0.417));',
    '  float t = fract(u_time * speed + fract(seed * 3.137));',
    '  float r = mix(r0, 0.115, pow(t, 1.5));',
    '',
    '  /* Faster orbits closer in */',
    '  float ang = seed * 6.2831853 + u_time * (0.5 + 1.6 / (0.2 + r * r));',
    '  vec2 p = vec2(cos(ang), sin(ang)) * r;',
    '  p.y /= 3.3; /* disk inclination */',
    '',
    '  float tilt = 0.10; /* clip y points up: mirror of fragment tilt */',
    '  p = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * p;',
    '  p /= 1.55; /* match disk zoom */',
    '',
    '  vec2 clip = p * vec2(u_res.y / u_res.x, 1.0) * 2.0 + (u_center * 2.0 - 1.0);',
    '  gl_Position = vec4(clip, 0.0, 1.0);',
    '',
    '  v_heat = t;',
    '  v_fade = sin(t * 3.14159);',
    '  gl_PointSize = max(u_res.y * 0.012 * (1.4 - t), 1.5);',
    '}'
  ].join('\n');

  var PART_FRAG = [
    'precision mediump float;',
    'varying float v_heat;',
    'varying float v_fade;',
    '',
    'void main() {',
    '  float d = length(gl_PointCoord - 0.5);',
    '  float a = smoothstep(0.5, 0.0, d);',
    '  a *= a * v_fade;',
    '  vec3 cool = vec3(1.0, 0.62, 0.28);',
    '  vec3 hotc = vec3(1.0, 0.97, 0.9);',
    '  vec3 col = mix(cool, hotc, v_heat * v_heat);',
    '  gl_FragColor = vec4(col * a, a);',
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

  /* Particles */
  var PART_COUNT = 220;
  var seeds = new Float32Array(PART_COUNT);
  for (var i = 0; i < PART_COUNT; i++) seeds[i] = (i + 0.5) / PART_COUNT;
  var partBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, partBuf);
  gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
  var partSeed = partProg ? gl.getAttribLocation(partProg, 'a_seed') : -1;
  var pRes = partProg ? gl.getUniformLocation(partProg, 'u_res') : null;
  var pTime = partProg ? gl.getUniformLocation(partProg, 'u_time') : null;
  var pCenter = partProg ? gl.getUniformLocation(partProg, 'u_center') : null;

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
    var cx = canvas.clientWidth > 900 ? 0.195 : 0.5;
    var cy = 0.42; /* measured from top in fragment coords */

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
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* Particle pass: additive sparks */
    if (partProg) {
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.useProgram(partProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, partBuf);
      gl.enableVertexAttribArray(partSeed);
      gl.vertexAttribPointer(partSeed, 1, gl.FLOAT, false, 0, 0);
      gl.uniform2f(pRes, canvas.width, canvas.height);
      gl.uniform1f(pTime, t);
      gl.uniform2f(pCenter, cx, cy);
      gl.drawArrays(gl.POINTS, 0, PART_COUNT);
    }

    if (!reduced && visible) {
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

  raf = requestAnimationFrame(frame);
})();
