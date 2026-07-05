/**
 * Header logo orbital system, v2 — a miniature accretion disk.
 *
 * 12 particles ride TRUE elliptical Kepler orbits with the logo at the
 * focus: they whip through periapsis (closest pass) and cruise the far
 * arc, so orbital speed visibly changes all the time. Eight of them
 * share a coherent disk plane tilted to match the logo's own ring;
 * four fly eccentric inclined orbits for depth. Two stacked canvases
 * (behind / in front of the logo) split every point by z each frame,
 * so the swarm genuinely circles the logo in 3D.
 *
 * Trails are duotone: each comet fades from its head color to a second
 * color along the tail. Dark mode renders additive neon; light mode
 * switches to a separate white-star treatment — white four-ray star
 * cores inside tinted halos, built for whitespace.
 *
 * Hover / focus: orbits contract toward the logo, speed ramps ~3x,
 * tails stretch longer, twinkle doubles, and the palette inverts.
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
        'attribute float a_age;',
        'varying vec4 v_col;',
        'varying float v_age;',
        'void main() {',
        '  gl_Position = vec4(a_pos, 0.0, 1.0);',
        '  gl_PointSize = a_size;',
        '  v_col = a_col;',
        '  v_age = a_age;',
        '}'
    ].join('\n');

    var FRAG = [
        'precision mediump float;',
        'varying vec4 v_col;',
        'varying float v_age;',
        'uniform float u_invert;',
        'uniform float u_light;',
        'uniform float u_heat;',
        'void main() {',
        '  vec2 p = gl_PointCoord * 2.0 - 1.0;',
        '  float d = dot(p, p);',
        '  if (d > 1.0) discard;',
        '  float glow = exp(-3.0 * d);',
        '  float core = exp(-16.0 * d);',
        // four-ray diffraction spikes, strongest at the comet head
        '  float ray = exp(-9.0 * min(abs(p.x), abs(p.y))) * exp(-2.1 * d) * (1.0 - v_age);',
        '  vec3 col = v_col.rgb;',
        '  col = mix(col, vec3(1.05) - col, u_invert);',
        '  float a = v_col.a * glow;',
        // DARK: additive neon — colored glow, white-hot core, faint rays
        '  vec3 neon = col * (1.0 + 0.45 * u_heat) + vec3(0.9) * core + col * ray * 0.5;',
        // LIGHT: white star — tight vivid halo, white core and rays.
        // Squaring nudges saturation up so halos stay neon, never muddy.
        '  vec3 tint = col * col * 0.85;',
        '  vec3 star = mix(tint, vec3(1.07), clamp(core * 1.5 + ray * (0.95 + 0.4 * u_heat), 0.0, 1.0));',
        '  float glowL = exp(-5.0 * d);',
        '  float aL = min(1.0, v_col.a * 2.4) * glowL * (0.5 + 0.5 * (1.0 - v_age));',
        '  vec3 outCol = mix(neon, star, u_light);',
        '  float outA = mix(a, aL, u_light);',
        '  gl_FragColor = vec4(outCol * outA, outA);',
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
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        var aPos  = gl.getAttribLocation(prog, 'a_pos');
        var aSize = gl.getAttribLocation(prog, 'a_size');
        var aCol  = gl.getAttribLocation(prog, 'a_col');
        var aAge  = gl.getAttribLocation(prog, 'a_age');
        gl.enableVertexAttribArray(aPos);
        gl.enableVertexAttribArray(aSize);
        gl.enableVertexAttribArray(aCol);
        gl.enableVertexAttribArray(aAge);
        var STRIDE = 8 * 4;
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, STRIDE, 0);
        gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, STRIDE, 8);
        gl.vertexAttribPointer(aCol, 4, gl.FLOAT, false, STRIDE, 12);
        gl.vertexAttribPointer(aAge, 1, gl.FLOAT, false, STRIDE, 28);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);
        return {
            canvas: canvas,
            gl: gl,
            uInvert: gl.getUniformLocation(prog, 'u_invert'),
            uLight: gl.getUniformLocation(prog, 'u_light'),
            uHeat: gl.getUniformLocation(prog, 'u_heat')
        };
    }

    var layerBack  = makeLayer(back);
    var layerFront = makeLayer(front);
    if (!layerBack || !layerFront) {
        return; // no WebGL: logo stays as-is, quietly
    }

    /* ---------- the swarm ---------- */

    var N = 12;
    var TRAIL = 26;
    // Duotone pairs: [head color, tail color]
    var DUO = [
        [[0.40, 0.93, 1.00], [0.55, 0.42, 1.00]], // cyan -> violet
        [[0.80, 0.48, 1.00], [1.00, 0.36, 0.72]], // violet -> hot pink
        [[1.00, 0.42, 0.66], [1.00, 0.62, 0.20]], // pink -> ember
        [[0.48, 0.55, 1.00], [0.30, 0.95, 1.00]], // indigo -> cyan
        [[0.30, 1.00, 0.72], [0.20, 0.75, 1.00]], // mint -> sky
        [[1.00, 0.66, 0.22], [1.00, 0.90, 0.45]]  // ember -> gold
    ];

    function rng(seed) {
        var s = seed * 2654435761 % 4294967296;
        return function () {
            s = (s * 1664525 + 1013904223) % 4294967296;
            return s / 4294967296;
        };
    }

    function basisFromNormal(nx, ny, nz) {
        var ux = ny, uy = -nx, uz = 0;
        var len = Math.sqrt(ux * ux + uy * uy);
        if (len < 0.001) { ux = 1; uy = 0; uz = 0; len = 1; }
        ux /= len; uy /= len; uz /= len;
        return {
            u: [ux, uy, uz],
            v: [ny * uz - nz * uy, nz * ux - nx * uz, nx * uy - ny * ux]
        };
    }

    var parts = [];
    (function () {
        // Shared accretion-disk plane, tilted like the logo's own ring:
        // mostly edge-on (a flat ellipse) rotated ~ -24 degrees on screen.
        var diskTilt = 1.12;   // from face-on; bigger = flatter ellipse
        var diskRoll = -0.42;  // ~ -24deg screen rotation
        var i, rnd, disk, tilt, roll, nx, ny, nz, b, a, e;
        for (i = 0; i < N; i++) {
            rnd = rng(i * 131 + 17);
            disk = i < 8; // 8 disk riders, 4 eccentric outliers
            if (disk) {
                tilt = diskTilt + (rnd() - 0.5) * 0.3;
                roll = diskRoll + (rnd() - 0.5) * 0.22;
            } else {
                tilt = 0.35 + rnd() * 1.9;
                roll = rnd() * Math.PI * 2;
            }
            nx = Math.sin(tilt) * Math.cos(roll);
            ny = Math.sin(tilt) * Math.sin(roll);
            nz = Math.cos(tilt);
            b = basisFromNormal(nx, ny, nz);
            a = disk ? 0.58 + rnd() * 0.34 : 0.55 + rnd() * 0.42;
            e = disk ? 0.14 + rnd() * 0.26 : 0.30 + rnd() * 0.28;
            parts.push({
                u: b.u,
                v: b.v,
                a: a,
                e: e,
                // mean rate; Kepler weighting makes the real rate swing
                w: (disk ? 0.9 : 0.75) * (0.8 + rnd() * 0.5) / Math.pow(a, 1.5) * (disk ? 1 : (rnd() > 0.5 ? 1 : -1)),
                th: rnd() * Math.PI * 2,
                duo: DUO[i % DUO.length],
                sparkF: 4.5 + rnd() * 5,
                sph: rnd() * Math.PI * 2,
                trail: new Float32Array(TRAIL * 3),
                filled: 0
            });
        }
    })();

    var wall = 0;
    var speedCur = 1, speedTarget = 1;      // orbital tempo
    var invertCur = 0, invertTarget = 0;    // hover palette flip
    var lightCur = 0, lightTarget = 0;      // dark neon <-> white star
    var heatCur = 0, heatTarget = 0;        // hover intensity
    var squeezeCur = 1, squeezeTarget = 1;  // hover orbit contraction
    var burst = null;                       // click: collapse -> slingshot
    var burstFade = 1;

    function themeIsLight() {
        return document.documentElement.getAttribute('data-mode') === 'light';
    }
    lightTarget = themeIsLight() ? 1 : 0;
    lightCur = lightTarget;

    function stepSim(dt) {
        if (burst) {
            burst.t += dt;
            if (burst.phase === 'in') {
                // event-horizon feeding frenzy: everything spirals in
                speedCur   += (8.0 - speedCur) * Math.min(1, dt * 10);
                squeezeCur += (0.12 - squeezeCur) * Math.min(1, dt * 9);
                heatCur    += (1 - heatCur) * Math.min(1, dt * 8);
                invertCur  += (1 - invertCur) * Math.min(1, dt * 6);
                if (burst.t >= 0.26) {
                    burst.phase = 'out';
                    var bi, bp, bx, by, bz, bl, brnd;
                    for (bi = 0; bi < N; bi++) {
                        bp = parts[bi];
                        bx = bp.trail[0]; by = bp.trail[1]; bz = bp.trail[2];
                        bl = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
                        brnd = 0.75 + ((bi * 2654435761 % 97) / 97) * 0.9;
                        bp.bv = [bx / bl * 2.8 * brnd, by / bl * 2.8 * brnd, bz / bl * 2.8 * brnd];
                    }
                }
            } else {
                burstFade = Math.max(0, 1 - (burst.t - 0.26) / 0.5);
            }
        } else {
            speedCur   += (speedTarget - speedCur) * Math.min(1, dt * 2.0);
            invertCur  += (invertTarget - invertCur) * Math.min(1, dt * 1.8);
            heatCur    += (heatTarget - heatCur) * Math.min(1, dt * 2.0);
            squeezeCur += (squeezeTarget - squeezeCur) * Math.min(1, dt * 1.6);
        }
        lightCur += (lightTarget - lightCur) * Math.min(1, dt * 6.0);
        wall += dt;
        var i, p, r, x, y, z, t, cs, sn, rate, eject;
        eject = burst && burst.phase === 'out';
        for (i = 0; i < N; i++) {
            p = parts[i];
            if (eject) {
                // relativistic slingshot: fly the captured direction, accelerating
                p.bv[0] *= 1 + 2.4 * dt; p.bv[1] *= 1 + 2.4 * dt; p.bv[2] *= 1 + 2.4 * dt;
                x = p.trail[0] + p.bv[0] * dt;
                y = p.trail[1] + p.bv[1] * dt;
                z = p.trail[2] + p.bv[2] * dt;
            } else {
                // Kepler's second law: sweep faster when closer to the focus
                r = p.a * (1 - p.e * p.e) / (1 + p.e * Math.cos(p.th));
                rate = p.w * Math.pow(p.a / r, 2);
                p.th += dt * speedCur * rate;
                cs = Math.cos(p.th);
                sn = Math.sin(p.th);
                r = p.a * (1 - p.e * p.e) / (1 + p.e * cs) * squeezeCur;
                x = r * (cs * p.u[0] + sn * p.v[0]);
                y = r * (cs * p.u[1] + sn * p.v[1]);
                z = r * (cs * p.u[2] + sn * p.v[2]);
            }
            p.sph += dt * p.sparkF * (1 + 1.1 * heatCur);
            t = p.trail;
            t.copyWithin(3, 0, (TRAIL - 1) * 3);
            t[0] = x; t[1] = y; t[2] = z;
            if (p.filled < TRAIL) { p.filled++; }
        }
    }

    /* ---------- projection + render ---------- */

    var F = 2.0; // strong perspective: near passes loom, far arcs shrink

    var MAXPTS = N * TRAIL;
    var vBack  = new Float32Array(MAXPTS * 8);
    var vFront = new Float32Array(MAXPTS * 8);

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
        var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        var dim = sizeLayer(layerBack, dpr);
        sizeLayer(layerFront, dpr);
        var w = dim[0], h = dim[1];
        var R = Math.min(w, h) * 0.5 * 0.72;
        var tailK = 1.9 - 0.85 * heatCur; // hover: tails reach further back
        var nb = 0, nf = 0;
        var i, j, p, t, x, y, z, scale, fog, cx, cy, size, alpha, age, spark, mixk, arr, o;

        for (i = 0; i < N; i++) {
            p = parts[i];
            t = p.trail;
            spark = 0.78 + 0.34 * Math.sin(p.sph);
            for (j = 0; j < p.filled; j++) {
                x = t[j * 3]; y = t[j * 3 + 1]; z = t[j * 3 + 2];
                scale = F / (F + z);
                fog = 0.45 + 0.55 * Math.min(1, Math.max(0, (1 - z) * 0.5)); // near bright, far dim
                cx = (x * scale * R) / (w * 0.5);
                cy = -(y * scale * R) / (h * 0.5);
                age = j / TRAIL;
                if (j === 0) {
                    size = (9.0 + 3.2 * spark) * scale * dpr * (1 + 0.22 * heatCur);
                    alpha = 0.72 * fog;
                } else {
                    size = (6.4 * (1 - age) + 1.4) * scale * dpr;
                    alpha = 0.46 * Math.pow(1 - age, tailK) * spark * fog;
                }
                mixk = age; // duotone: head color -> tail color
                alpha *= burstFade;
                if (z < 0) { arr = vBack; o = nb * 8; nb++; }
                else       { arr = vFront; o = nf * 8; nf++; }
                arr[o] = cx; arr[o + 1] = cy;
                arr[o + 2] = size;
                arr[o + 3] = p.duo[0][0] + (p.duo[1][0] - p.duo[0][0]) * mixk;
                arr[o + 4] = p.duo[0][1] + (p.duo[1][1] - p.duo[0][1]) * mixk;
                arr[o + 5] = p.duo[0][2] + (p.duo[1][2] - p.duo[0][2]) * mixk;
                arr[o + 6] = alpha;
                arr[o + 7] = age;
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
        gl.uniform1f(layer.uHeat, heatCur);
        gl.bufferData(gl.ARRAY_BUFFER, arr.subarray(0, n * 8), gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.POINTS, 0, n);
    }

    /* ---------- interaction ---------- */

    function engage() {
        speedTarget = 3.0;
        invertTarget = 1;
        heatTarget = 1;
        squeezeTarget = 0.84; // gravitational pull-in
        poke();
    }
    function release() {
        speedTarget = 1;
        invertTarget = 0;
        heatTarget = 0;
        squeezeTarget = 1;
        poke();
    }
    link.addEventListener('mouseenter', engage);
    link.addEventListener('mouseleave', release);
    link.addEventListener('focusin', engage);
    link.addEventListener('focusout', release);

    window.addEventListener('infinity:theme', function () {
        lightTarget = themeIsLight() ? 1 : 0;
        poke();
    });

    // Click: the whole swarm gets eaten. Orbits collapse into the
    // horizon (0.26s feeding frenzy), the logo implodes and flashes,
    // a shockwave ring detonates, and every particle slingshots out
    // along its own escape vector — then we actually navigate.
    link.addEventListener('click', function (e) {
        if (reduced || burst) { return; }
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
        var href = link.getAttribute('href');
        if (!href) { return; }
        e.preventDefault();
        burst = { phase: 'in', t: 0 };
        burstFade = 1;
        stage.classList.add('bh-burst');
        setTimeout(function () {
            window.location.href = href;
        }, 700);
    });

    /* ---------- loop ---------- */

    var last = 0;
    var staticTimer = null;
    var FRAME_MS = 21; /* ~45fps is plenty for a 52px stage */

    function frame(ts) {
        if (ts && ts - last < FRAME_MS) {
            requestAnimationFrame(frame);
            return;
        }
        var dt = last ? Math.min((ts - last) / 1000, 0.05) : 1 / 60;
        last = ts;
        stepSim(dt);
        render();
        requestAnimationFrame(frame);
    }

    // Reduced motion: settle the swarm into a still, redraw briefly on
    // interaction so hover/theme feedback still lands — colors only.
    function staticSettle() {
        var k;
        for (k = 0; k < TRAIL + 6; k++) { stepSim(1 / 30); }
        render();
    }
    function poke() {
        if (!reduced) { return; }
        var n = 0;
        if (staticTimer) { clearInterval(staticTimer); }
        staticTimer = setInterval(function () {
            invertCur += (invertTarget - invertCur) * 0.25;
            lightCur += (lightTarget - lightCur) * 0.4;
            heatCur += (heatTarget - heatCur) * 0.3;
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
