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
    return { el: el, x: Math.cos(th) * r, y: y, z: Math.sin(th) * r };
  });

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

      var s = p.el.style;
      s.transform = 'translate(-50%, -50%) translate(' + (x1 * R).toFixed(1) + 'px,' + (y1 * R * 0.72).toFixed(1) + 'px) scale(' + (0.5 + 0.7 * depth).toFixed(3) + ')';
      s.opacity = (0.22 + 0.78 * depth * depth).toFixed(3);
      s.zIndex = Math.round(depth * 100);
      s.pointerEvents = depth > 0.45 ? 'auto' : 'none';
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

  if (reduced) {
    render();
  } else {
    raf = requestAnimationFrame(frame);
  }
})();
