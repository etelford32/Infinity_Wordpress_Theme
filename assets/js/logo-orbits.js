/**
 * Header logo orbital system — 12 particles on true 3D orbits around
 * the site logo, rendered with WebGL point sprites. Each particle drags
 * a flashy neon tail; particles pass in FRONT of and BEHIND the logo
 * (two stacked canvases, split per-point by depth each frame).
 *
 * Hover / focus on the logo link: orbital speed ramps up smoothly and
 * the palette inverts (shader-side, u_invert). Light mode (u_light)
 * trades additive neon for darker, more opaque ink so the trails stay
 * visible on a pale header.
 *
 * No spin, no pulse — the logo itself stays still; only the swarm moves.
 */
(function () {
    'use strict';

    var stage = document.querySelector('.bh-logo');
    if (!stage) {
        return;
    }
    var back  = stage.querySelector('.bh-orbits-back');
    var front = stage.querySelector('.bh-orbits-front');
    if (!back || !front) {
        return;
    }
    var link = stage.closest('.site-logo-link') || stage;

    var reduced = false;
    try {
        reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {}

    var VERT = [
        'attribute vec2 a_pos;',
        'attribute float a_size;',
        'attribute vec4 a_col;',
        'varying vec4 v_col;',
        'void main() {',
        '  gl_Position = vec4(a_pos, 0.0, 1.0);',
        '  gl_PointSize = a_size;',
        '  v_col = a_col;',
        '}'
    ].join('\n');

    var FRAG = [
        'precision mediump float;',
        'varying vec4 v_col;',
        'uniform float u_invert;',
        'uniform float u_light;',
        'void main() {',
        '  vec2 p = gl_PointCoord * 2.0 - 1.0;',
        '  float d = dot(p, p);',
        '  if (d > 1.0) discard;',
        '  float glow = exp(-3.2 * d);',
        '  float core = exp(-15.0 * d);',
        '  vec3 col = v_col.rgb;',
        '  col = mix(col, vec3(1.04) - col, u_invert);', // hover: inverted schema
        '  col += vec3(0.9) * core;',                     // white-hot core
        '  float a = v_col.a * glow;',
        '  col = mix(col, col * 0.5, u_light);',          // light mode: ink, not neon
        '  a = mix(a, min(1.0, a * 2.7), u_light);',
        '  gl_FragColor = vec4(col * a, a);',             // premultiplied
        '}'
    ].join('\n');

    function makeLayer(canvas) {
        var gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true });
        if (!gl) {
            return null;
        }
        function sh(type, src) {
            var s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return s;
        }
        var prog = gl.createProgram();
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            return null;
        }
        gl.useProgram(prog);
        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        var aPos  = gl.getAttribLocation(prog, 'a_pos');
        var aSize = gl.getAttribLocation(prog, 'a_size');
        var aCol  = gl.getAttribLocation(prog, 'a_col');
        gl.enableVertexAttribArray(aPos);
        gl.enableVertexAttribArray(aSize);
        gl.enableVertexAttribArray(aCol);
        var STRIDE = 7 * 4;
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, STRIDE, 0);
        gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, STRIDE, 8);
        gl.vertexAttribPointer(aCol, 4, gl.FLOAT, false, STRIDE, 12);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);
        return {
            canvas: canvas,
            gl: gl,
            uInvert: gl.getUniformLocation(prog, 'u_invert'),
            uLight: gl.getUniformLocation(prog, 'u_light')
        };
    }

    var layerBack  = makeLayer(back);
    var layerFront = makeLayer(front);
    if (!layerBack || !layerFront) {
        return; // no WebGL: logo stays as-is, quietly
    }

    /* ---------- the swarm ---------- */

    var N = 12;
    var TRAIL = 20;
    var PALETTE = [
        [0.40, 0.91, 1.00], // neon cyan
        [0.51, 0.55, 0.98], // indigo
        [0.78, 0.50, 1.00], // violet
        [0.96, 0.45, 0.75], // hot pink
        [0.99, 0.60, 0.22], // ember orange
        [0.30, 1.00, 0.72]  // aurora mint
    ];

    function rng(seed) {
        // tiny deterministic PRNG so every load looks identical
        var s = seed * 2654435761 % 4294967296;
        return function () {
            s = (s * 1664525 + 1013904223) % 4294967296;
            return s / 4294967296;
        };
    }

    var parts = [];
    (function () {
        var i, r, rnd, node, tilt, nx, ny, nz, ux, uy, uz, vx, vy, vz, len;
        for (i = 0; i < N; i++) {
            rnd = rng(i + 7);
            node = (i / N) * Math.PI * 2 + rnd() * 0.5;
            tilt = 0.55 + rnd() * 1.05;
            // orbit-plane normal
            nx = Math.sin(tilt) * Math.cos(node);
            ny = Math.sin(tilt) * Math.sin(node);
            nz = Math.cos(tilt);
            // in-plane basis u = n x Z (fallback n x X), v = n x u
            ux = ny; uy = -nx; uz = 0;
            len = Math.sqrt(ux * ux + uy * uy);
            if (len < 0.001) { ux = 0; uy = 1; uz = 0; len = 1; }
            ux /= len; uy /= len; uz /= len;
            vx = ny * uz - nz * uy;
            vy = nz * ux - nx * uz;
            vz = nx * uy - ny * ux;
            r = 0.60 + rnd() * 0.38;
            parts.push({
                u: [ux, uy, uz],
                v: [vx, vy, vz],
                r: r,
                w: (0.85 + rnd() * 0.5) / Math.pow(r, 1.5) * (rnd() > 0.28 ? 1 : -1),
                th0: rnd() * Math.PI * 2,
                col: PALETTE[i % PALETTE.length],
                sparkF: 5 + rnd() * 5,
                sparkP: rnd() * Math.PI * 2,
                trail: new Float32Array(TRAIL * 3),
                filled: 0
            });
        }
    })();

    var warped = 0;          // speed-warped orbital clock
    var wall = 0;            // real seconds, for sparkle
    var speedCur = 1, speedTarget = 1;
    var invertCur = 0, invertTarget = 0;
    var lightCur = 0, lightTarget = 0;

    function themeIsLight() {
        return document.documentElement.getAttribute('data-mode') === 'light';
    }
    lightTarget = themeIsLight() ? 1 : 0;
    lightCur = lightTarget;

    function stepSim(dt) {
        speedCur  += (speedTarget - speedCur) * Math.min(1, dt * 2.0);
        invertCur += (invertTarget - invertCur) * Math.min(1, dt * 1.8);
        lightCur  += (lightTarget - lightCur) * Math.min(1, dt * 6.0);
        warped += dt * speedCur;
        wall += dt;
        var i, p, th, x, y, z, t;
        for (i = 0; i < N; i++) {
            p = parts[i];
            th = p.th0 + p.w * warped;
            x = p.r * (Math.cos(th) * p.u[0] + Math.sin(th) * p.v[0]);
            y = p.r * (Math.cos(th) * p.u[1] + Math.sin(th) * p.v[1]);
            z = p.r * (Math.cos(th) * p.u[2] + Math.sin(th) * p.v[2]);
            // shift history down, newest at 0
            t = p.trail;
            t.copyWithin(3, 0, (TRAIL - 1) * 3);
            t[0] = x; t[1] = y; t[2] = z;
            if (p.filled < TRAIL) { p.filled++; }
        }
    }

    /* ---------- projection + render ---------- */

    var F = 2.6; // perspective strength

    var MAXPTS = N * (TRAIL + 1);
    var vBack  = new Float32Array(MAXPTS * 7);
    var vFront = new Float32Array(MAXPTS * 7);

    function sizeLayer(layer, dpr) {
        var c = layer.canvas;
        var w = Math.max(2, Math.round(c.clientWidth * dpr));
        var h = Math.max(2, Math.round(c.clientHeight * dpr));
        if (c.width !== w || c.height !== h) {
            c.width = w;
            c.height = h;
        }
        layer.gl.viewport(0, 0, w, h);
        return [w, h];
    }

    function render() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var dimB = sizeLayer(layerBack, dpr);
        var dimF = sizeLayer(layerFront, dpr);
        var w = dimB[0], h = dimB[1];
        var R = Math.min(w, h) * 0.5 * 0.74; // orbit radius in device px
        var nb = 0, nf = 0;
        var i, j, p, t, x, y, z, scale, cx, cy, size, alpha, age, spark, arr, o;

        for (i = 0; i < N; i++) {
            p = parts[i];
            t = p.trail;
            spark = 0.8 + 0.3 * Math.sin(wall * p.sparkF + p.sparkP);
            for (j = 0; j < p.filled; j++) {
                x = t[j * 3]; y = t[j * 3 + 1]; z = t[j * 3 + 2];
                scale = F / (F + z);
                cx = (x * scale * R) / (w * 0.5);
                cy = -(y * scale * R) / (h * 0.5);
                age = j / TRAIL;
                if (j === 0) {
                    size = (8.0 + 2.6 * spark) * scale * dpr;
                    alpha = 0.62;
                } else {
                    size = (5.6 * (1 - age) + 1.3) * scale * dpr;
                    alpha = 0.4 * Math.pow(1 - age, 1.7) * spark;
                }
                if (z < 0) { arr = vBack; o = nb * 7; nb++; }
                else       { arr = vFront; o = nf * 7; nf++; }
                arr[o] = cx; arr[o + 1] = cy;
                arr[o + 2] = size;
                arr[o + 3] = p.col[0]; arr[o + 4] = p.col[1]; arr[o + 5] = p.col[2];
                arr[o + 6] = alpha;
            }
        }

        drawLayer(layerBack, vBack, nb);
        drawLayer(layerFront, vFront, nf);
    }

    function drawLayer(layer, arr, n) {
        var gl = layer.gl;
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (!n) { return; }
        gl.uniform1f(layer.uInvert, invertCur);
        gl.uniform1f(layer.uLight, lightCur);
        gl.bufferData(gl.ARRAY_BUFFER, arr.subarray(0, n * 7), gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.POINTS, 0, n);
    }

    /* ---------- interaction ---------- */

    function engage() { speedTarget = 2.9; invertTarget = 1; poke(); }
    function release() { speedTarget = 1; invertTarget = 0; poke(); }
    link.addEventListener('mouseenter', engage);
    link.addEventListener('mouseleave', release);
    link.addEventListener('focusin', engage);
    link.addEventListener('focusout', release);

    window.addEventListener('infinity:theme', function () {
        lightTarget = themeIsLight() ? 1 : 0;
        poke();
    });

    /* ---------- loop ---------- */

    var last = 0;
    var staticTimer = null;

    function frame(ts) {
        var dt = last ? Math.min((ts - last) / 1000, 0.05) : 1 / 60;
        last = ts;
        stepSim(dt);
        render();
        requestAnimationFrame(frame);
    }

    // Reduced motion: settle the swarm, draw stills; re-draw briefly on
    // interaction so hover feedback (invert) still happens, without a loop.
    function staticSettle() {
        var k;
        for (k = 0; k < TRAIL + 4; k++) { stepSim(1 / 30); }
        render();
    }
    function poke() {
        if (!reduced) { return; }
        var n = 0;
        if (staticTimer) { clearInterval(staticTimer); }
        staticTimer = setInterval(function () {
            invertCur += (invertTarget - invertCur) * 0.25;
            lightCur += (lightTarget - lightCur) * 0.4;
            render();
            if (++n > 20) { clearInterval(staticTimer); staticTimer = null; }
        }, 40);
    }

    if (reduced) {
        staticSettle();
    } else {
        requestAnimationFrame(frame);
    }
})();
