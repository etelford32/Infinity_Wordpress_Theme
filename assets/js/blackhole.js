/**
 * Black hole accretion disk — WebGL fragment shader backdrop for the
 * front-page hero title.
 *
 * Self-contained, no dependencies. Renders a tilted accretion disk
 * with differential rotation, doppler beaming, a photon ring, and a
 * dark event horizon. Respects prefers-reduced-motion (renders a
 * single static frame) and pauses off-screen via IntersectionObserver.
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

  var VERT = [
    'attribute vec2 a_pos;',
    'void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform vec2 u_res;',
    'uniform float u_time;',
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
    '  vec2 uv = (gl_FragCoord.xy - vec2(0.5, 0.60) * u_res) / u_res.y;',
    '  float tilt = -0.10;',
    '  uv = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * uv;',
    '',
    '  /* Disk plane: strong tilt so we see a thin ellipse */',
    '  vec2 p = vec2(uv.x, uv.y * 3.4);',
    '  float r = length(p);',
    '  float ang = atan(p.y, p.x);',
    '',
    '  /* Photon sphere radius in screen space (nearly circular) */',
    '  float rc = length(uv * vec2(1.0, 1.12));',
    '',
    '  /* Gravitational pull: drag coordinates inward near the hole */',
    '  float rr = r - 0.05 / max(r, 0.06);',
    '',
    '  /* Differential rotation: inner orbits faster */',
    '  float swirl = ang - u_time * 0.55 - 1.4 / (0.25 + rr * rr);',
    '  float streaks = fbm(vec2(swirl * 2.3, rr * 10.0 - u_time * 0.1));',
    '  streaks = pow(streaks, 1.6);',
    '',
    '  /* Radial profile of the disk */',
    '  float disk = smoothstep(0.155, 0.26, rr) * (1.0 - smoothstep(0.5, 0.95, rr));',
    '',
    '  /* Doppler beaming: approaching side glows brighter */',
    '  float doppler = 1.0 + 0.55 * (-uv.x / max(r, 0.001));',
    '',
    '  float bright = disk * (0.28 + 1.15 * streaks) * doppler;',
    '',
    '  /* Photon ring: thin, hot, just outside the horizon */',
    '  float photon = exp(-pow((rc - 0.148) * 95.0, 2.0));',
    '',
    '  /* Event horizon: everything goes dark inside */',
    '  float horizon = 1.0 - smoothstep(0.118, 0.138, rc);',
    '',
    '  /* Color ramp: white-hot inner, indigo mid, violet outer */',
    '  vec3 hot   = vec3(1.0, 0.97, 0.90);',
    '  vec3 indig = vec3(0.44, 0.44, 0.97);',
    '  vec3 viol  = vec3(0.58, 0.37, 0.96);',
    '  vec3 col = mix(hot, indig, smoothstep(0.20, 0.42, rr));',
    '  col = mix(col, viol, smoothstep(0.42, 0.85, rr));',
    '',
    '  vec3 c = col * bright + vec3(1.0, 0.96, 0.88) * photon * 0.85;',
    '',
    '  /* Faint ambient halo so the hole reads against the page */',
    '  c += indig * 0.05 * (1.0 - smoothstep(0.0, 0.9, rc));',
    '',
    '  c *= 1.0 - horizon;',
    '  float alpha = clamp(bright * 1.5 + photon * 0.8 + 0.04 * (1.0 - smoothstep(0.0, 0.9, rc)), 0.0, 1.0);',
    '  alpha *= 1.0 - horizon * 0.35;',
    '',
    '  gl_FragColor = vec4(c, alpha);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) {
    canvas.classList.add('fp-blackhole-fallback');
    return;
  }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, 'u_res');
  var uTime = gl.getUniformLocation(prog, 'u_time');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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
  var FRAME_MS = 33; // ~30fps is plenty for a slow accretion swirl

  function frame(now) {
    raf = null;
    if (!reduced && now && now - last < FRAME_MS) {
      raf = requestAnimationFrame(frame);
      return;
    }
    last = now || 0;
    resize();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (performance.now() - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
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
