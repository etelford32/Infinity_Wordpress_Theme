/**
 * 3D category tag globe — distributes the category links over a
 * sphere (Fibonacci lattice) and rotates it continuously; pointer
 * position steers the spin, hover pauses it. Links are real anchors
 * server-rendered in the DOM, so crawlers see them regardless.
 *
 * Pauses off-screen; renders a single static sphere under
 * prefers-reduced-motion.
 */
(function () {
  'use strict';

  var globe = document.getElementById('tag-globe');
  if (!globe) return;

  var items = Array.prototype.slice.call(globe.querySelectorAll('.tag-globe-item'));
  var N = items.length;
  if (N < 3) return;

  var GOLDEN = Math.PI * (3 - Math.sqrt(5));
  var pts = items.map(function (el, i) {
    var y = 1 - (i / (N - 1)) * 2;
    var r = Math.sqrt(Math.max(0, 1 - y * y));
    var th = GOLDEN * i;
    return { el: el, x: Math.cos(th) * r, y: y, z: Math.sin(th) * r, px: 0, py: 0, d: 0 };
  });

  /* Constellation: connect each tag to its 3 nearest neighbours on
     the sphere (computed once) and draw the lines on a canvas each
     frame — a slowly turning star map behind the words. */
  var pairs = [];
  (function () {
    var i, j, dx, dy, dz, dists, seen = {};
    for (i = 0; i < N; i++) {
      dists = [];
      for (j = 0; j < N; j++) {
        if (i === j) continue;
        dx = pts[i].x - pts[j].x;
        dy = pts[i].y - pts[j].y;
        dz = pts[i].z - pts[j].z;
        dists.push([dx * dx + dy * dy + dz * dz, j]);
      }
      dists.sort(function (a, b) { return a[0] - b[0]; });
      for (j = 0; j < Math.min(3, dists.length); j++) {
        var key = Math.min(i, dists[j][1]) + '-' + Math.max(i, dists[j][1]);
        if (!seen[key]) {
          seen[key] = 1;
          pairs.push([i, dists[j][1]]);
        }
      }
    }
  })();

  var lines = document.createElement('canvas');
  lines.className = 'tag-globe-lines';
  lines.setAttribute('aria-hidden', 'true');
  globe.insertBefore(lines, globe.firstChild);
  var lctx = lines.getContext('2d');

  function isLightMode() {
    return document.documentElement.getAttribute('data-mode') === 'light';
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true;
  var hovered = false;
  var raf = null;
  var last = 0;
  var FRAME_MS = 33;

  var rotX = -0.35;
  var rotY = 0;
  var velX = 0.0035;
  var velY = 0.011;
  var targetVelX = velX;
  var targetVelY = velY;

  function radius() {
    return Math.min(globe.clientWidth, globe.clientHeight * 2) * 0.36;
  }

  function render() {
    var R = radius();
    var sy = Math.sin(rotY), cy = Math.cos(rotY);
    var sx = Math.sin(rotX), cx = Math.cos(rotX);

    for (var i = 0; i < N; i++) {
      var p = pts[i];
      var x1 = p.x * cy + p.z * sy;
      var z1 = -p.x * sy + p.z * cy;
      var y1 = p.y * cx - z1 * sx;
      var z2 = p.y * sx + z1 * cx;
      var depth = (z2 + 1) / 2; /* 0 back, 1 front */

      p.px = x1 * R;
      p.py = y1 * R * 0.72;
      p.d = depth;

      var s = p.el.style;
      s.transform = 'translate(-50%, -50%) translate(' + p.px.toFixed(1) + 'px,' + p.py.toFixed(1) + 'px) scale(' + (0.5 + 0.7 * depth).toFixed(3) + ')';
      s.opacity = (0.22 + 0.78 * depth * depth).toFixed(3);
      s.zIndex = Math.round(depth * 100);
      s.pointerEvents = depth > 0.45 ? 'auto' : 'none';
    }

    drawLines();
  }

  function drawLines() {
    var w = globe.clientWidth;
    var h = globe.clientHeight;
    if (!w || !h) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    if (lines.width !== Math.round(w * dpr) || lines.height !== Math.round(h * dpr)) {
      lines.width = Math.round(w * dpr);
      lines.height = Math.round(h * dpr);
    }
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lctx.clearRect(0, 0, w, h);
    var midX = w / 2;
    var midY = h / 2;
    var light = isLightMode();
    for (var k = 0; k < pairs.length; k++) {
      var a = pts[pairs[k][0]];
      var b = pts[pairs[k][1]];
      var d = (a.d + b.d) / 2;
      var alpha = 0.04 + 0.30 * d * d;
      lctx.strokeStyle = light
        ? 'rgba(71, 85, 105, ' + alpha.toFixed(3) + ')'
        : 'rgba(129, 205, 255, ' + (alpha * 0.9).toFixed(3) + ')';
      lctx.lineWidth = 0.5 + 1.0 * d;
      lctx.beginPath();
      lctx.moveTo(midX + a.px, midY + a.py);
      lctx.lineTo(midX + b.px, midY + b.py);
      lctx.stroke();
    }
  }

  function frame(now) {
    raf = null;
    if (now && now - last < FRAME_MS) {
      raf = requestAnimationFrame(frame);
      return;
    }
    last = now || 0;

    var damp = hovered ? 0.06 : 1;
    velX += (targetVelX * damp - velX) * 0.05;
    velY += (targetVelY * damp - velY) * 0.05;
    rotX += velX;
    rotY += velY;

    render();

    if (visible && !reduced) {
      raf = requestAnimationFrame(frame);
    }
  }

  globe.addEventListener('pointermove', function (e) {
    var rect = globe.getBoundingClientRect();
    var nx = (e.clientX - rect.left) / rect.width - 0.5;
    var ny = (e.clientY - rect.top) / rect.height - 0.5;
    targetVelY = 0.011 + nx * 0.02;
    targetVelX = 0.0035 + ny * 0.012;
  });

  globe.addEventListener('pointerenter', function () { hovered = true; });
  globe.addEventListener('pointerleave', function () {
    hovered = false;
    targetVelX = 0.0035;
    targetVelY = 0.011;
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !raf && !reduced) {
        raf = requestAnimationFrame(frame);
      }
    }).observe(globe);
  }

  window.addEventListener('resize', render);
  window.addEventListener('infinity:theme', render);

  if (reduced) {
    render();
  } else {
    raf = requestAnimationFrame(frame);
  }
})();
