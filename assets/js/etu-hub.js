/**
 * Explore the Universe 2175 hub (page-explore-the-universe.php).
 *
 * Content behaviour (always on):
 * - demo countdown, flipping to "out now" at release;
 * - the 13 MB trailer loads only when someone presses play;
 * - "Copy link" where the Clipboard API exists.
 *
 * Motion (never under prefers-reduced-motion; the CSS intro is gated by
 * the .etuh-motion class an inline script sets before first paint):
 * - hero warp drive: a canvas starfield that arrives at warp speed and
 *   settles to a drift, steered by the pointer, with engine sparks
 *   trailing the cursor; paused whenever the hero is off screen;
 * - hero parallax on pointer and scroll;
 * - scroll reveals, heading text decode, numbers that count up;
 * - 3D tilt with a cursor spotlight on every card;
 * - showcase art that wipes in and drifts with scroll;
 * - MEGABOT's alarm, laser sweep and typed transmission;
 * - glitching countdown digits and spark bursts on clicked buttons.
 *
 * Without JS the page is complete and static.
 */
(function () {
  'use strict';

  var root = document.querySelector('.etuh');
  if (!root) return;

  var cfg = window.infinityEtuHub || {};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var motion = !reduce;

  function onView(els, cb, opts) {
    if (!hasIO) {
      els.forEach(cb);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          io.unobserve(e.target);
          cb(e.target);
        }
      });
    }, opts || { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
  }

  function $$(sel, ctx) { return [].slice.call((ctx || root).querySelectorAll(sel)); }

  /* ================= Scroll reveal ================= */
  if (motion && hasIO) {
    root.classList.add('etuh-js');
    onView($$('[data-reveal]'), function (el) { el.classList.add('is-in'); }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }

  /* ================= Hero: warp drive + sparks + parallax ================= */
  var hero = root.querySelector('.etuh-hero');
  var canvas = root.querySelector('.etuh-warp');
  var heroOn = true;
  var pointer = { x: 0, y: 0, tx: 0, ty: 0, inside: false, cx: 0, cy: 0 };

  if (hero && motion) {
    // Parallax: lerp pointer toward its target every frame the hero is visible
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      pointer.cx = e.clientX - r.left;
      pointer.cy = e.clientY - r.top;
      pointer.inside = true;
      if (finePointer) emitSparks(pointer.cx, pointer.cy, 2);
    });
    hero.addEventListener('pointerleave', function () {
      pointer.tx = 0;
      pointer.ty = 0;
      pointer.inside = false;
    });

    var setScroll = function () {
      var h = hero.offsetHeight || 1;
      var sy = Math.min(1, Math.max(0, window.scrollY / h));
      hero.style.setProperty('--sy', sy.toFixed(3));
    };
    window.addEventListener('scroll', setScroll, { passive: true });
    setScroll();

    if (hasIO) {
      new IntersectionObserver(function (es) { heroOn = es[0].isIntersecting; if (heroOn) kick(); }).observe(hero);
    }
  }

  // ---- Canvas starfield ----
  var ctx = canvas && motion && canvas.getContext ? canvas.getContext('2d') : null;
  var W = 0;
  var H = 0;
  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  var stars = [];
  var sparks = [];
  var t0 = performance.now();
  var running = false;

  function resize() {
    if (!ctx) return;
    W = hero.clientWidth;
    H = hero.clientHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var n = Math.min(520, Math.round((W * H) / 2600));
    while (stars.length < n) stars.push(newStar(true));
    stars.length = n;
  }

  function newStar(anyDepth) {
    return {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: anyDepth ? Math.random() * 0.95 + 0.05 : 1,
      hue: Math.random() < 0.18 ? (Math.random() < 0.5 ? 290 : 30) : 190,
      pz: 0
    };
  }

  function emitSparks(x, y, n) {
    if (!ctx) return;
    for (var i = 0; i < n; i++) {
      if (sparks.length > 160) sparks.shift();
      var a = Math.random() * Math.PI * 2;
      var sp = 0.4 + Math.random() * 1.6;
      sparks.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp + 0.3, life: 1, size: 1 + Math.random() * 2.2, hue: Math.random() < 0.8 ? 188 : 28 });
    }
  }

  function frame(now) {
    if (!running) return;
    if (!heroOn || document.hidden) {
      running = false;
      return;
    }

    // Arrive at warp, settle to a drift; the pointer nudges the vanishing point
    var age = (now - t0) / 1000;
    var warp = age < 0.9 ? 1 : Math.max(0, 1 - (age - 0.9) / 1.4);
    var speed = 0.0018 + warp * warp * 0.055;

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    hero.style.setProperty('--px', pointer.x.toFixed(3));
    hero.style.setProperty('--py', pointer.y.toFixed(3));

    var cx = W / 2 - pointer.x * W * 0.06;
    var cy = H * 0.45 - pointer.y * H * 0.06;
    var f = Math.max(W, H) * 0.55;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.pz = s.z;
      s.z -= speed;
      if (s.z <= 0.02) {
        stars[i] = newStar(false);
        continue;
      }
      var x = cx + (s.x / s.z) * f;
      var y = cy + (s.y / s.z) * f;
      if (x < -50 || x > W + 50 || y < -50 || y > H + 50) {
        stars[i] = newStar(false);
        continue;
      }
      var px = cx + (s.x / s.pz) * f;
      var py = cy + (s.y / s.pz) * f;
      var near = 1 - s.z;
      var alpha = Math.min(1, 0.25 + near * 1.2) * (0.75 + warp * 0.25);
      ctx.strokeStyle = 'hsla(' + s.hue + ', 90%, ' + (72 + near * 24) + '%, ' + alpha.toFixed(3) + ')';
      ctx.lineWidth = 0.9 + near * (1.8 + warp * 1.2);
      ctx.beginPath();
      // At warp the streak is the whole travelled path; at drift, a dot
      var stretch = warp > 0.02 ? 1 + warp * 3 : 1;
      ctx.moveTo(x + (px - x) * stretch, y + (py - y) * stretch);
      ctx.lineTo(x + 0.4, y + 0.4);
      ctx.stroke();
    }

    // Engine sparks trailing the cursor
    for (var j = sparks.length - 1; j >= 0; j--) {
      var p = sparks[j];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy = p.vy * 0.96 + 0.02;
      p.life -= 0.022;
      if (p.life <= 0) {
        sparks.splice(j, 1);
        continue;
      }
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
      g.addColorStop(0, 'hsla(' + p.hue + ', 100%, 85%, ' + p.life + ')');
      g.addColorStop(1, 'hsla(' + p.hue + ', 100%, 60%, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }

  function kick() {
    if (!ctx || running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  if (ctx) {
    hero.classList.add('has-warp');
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
    kick();
  } else if (hero && motion) {
    // No canvas: still drive the parallax variables
    (function loop() {
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      hero.style.setProperty('--px', pointer.x.toFixed(3));
      hero.style.setProperty('--py', pointer.y.toFixed(3));
      requestAnimationFrame(loop);
    })();
  }

  /* ================= Countdown ================= */
  var cd = root.querySelector('[data-etuh-countdown]');
  if (cd && !cd.hasAttribute('data-live')) {
    var at = Date.parse(cd.getAttribute('data-at'));
    var clock = cd.querySelector('.etuh-clock');
    var units = {};
    $$('[data-u]', cd).forEach(function (b) { units[b.getAttribute('data-u')] = b; });
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var put = function (el, v) {
      v = String(v);
      if (el.textContent === v) return;
      el.textContent = v;
      if (motion) {
        el.classList.remove('is-tick');
        void el.offsetWidth;
        el.classList.add('is-tick');
      }
    };
    var tick = function () {
      if (isNaN(at)) return;
      var left = at - Date.now();
      if (left <= 0) {
        cd.setAttribute('data-live', '');
        if (clock) clock.hidden = true;
        var txt = cd.querySelector('.etuh-demo-text');
        if (txt && cfg.liveTxt) txt.textContent = cfg.liveTxt;
        return;
      }
      var s = Math.floor(left / 1000);
      put(units.d, Math.floor(s / 86400));
      put(units.h, pad(Math.floor(s / 3600) % 24));
      put(units.m, pad(Math.floor(s / 60) % 60));
      put(units.s, pad(s % 60));
      setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    if (clock && units.d) {
      clock.hidden = false;
      tick();
    }
  }

  /* ================= Count-up numbers ================= */
  if (motion) {
    var fmt = window.Intl ? new Intl.NumberFormat() : null;
    onView($$('[data-count]'), function (b) {
      var end = parseInt(b.getAttribute('data-count'), 10);
      if (end < 10) {
        b.classList.add('is-done');
        return;
      }
      var start = Math.max(performance.now(), t0 + 2300); // after the hero intro lands, never later
      var dur = 1500;
      var step = function (t) {
        var p = Math.max(0, Math.min(1, (t - start) / dur));
        var v = Math.round(end * (1 - Math.pow(1 - p, 4)));
        b.textContent = fmt ? fmt.format(v) : v;
        if (p < 1) requestAnimationFrame(step);
        else b.classList.add('is-done');
      };
      b.textContent = '0';
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
  }

  /* ================= Heading decode ================= */
  if (motion) {
    var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/\\';
    onView($$('.etuh-h2:not(.etuh-typeset)'), function (h) {
      var final = h.textContent;
      h.setAttribute('aria-label', final.trim());
      h.classList.add('is-decoding');
      var start = performance.now();
      var dur = 650 + final.length * 14;
      var step = function (t) {
        var p = Math.min(1, (t - start) / dur);
        var solved = Math.floor(final.length * p);
        var out = '';
        for (var i = 0; i < final.length; i++) {
          var c = final.charAt(i);
          out += i < solved || c === ' ' || c === '\n' ? c : GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
        }
        h.textContent = out;
        if (p < 1) requestAnimationFrame(step);
        else {
          h.textContent = final;
          h.classList.remove('is-decoding');
          h.removeAttribute('aria-label');
        }
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
  }

  /* ================= Hero tagline rotor ================= */
  var rotor = root.querySelector('.etuh-tagline-rotor');
  if (rotor) {
    var tags = [];
    try { tags = JSON.parse(rotor.getAttribute('data-lines')) || []; } catch (e) {}
    if (tags.length > 1) {
      var ti = 0;
      var CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/';
      var threat = function (t) { return /megabot|robot/i.test(t); };
      var show = function (text) {
        rotor.classList.toggle('is-threat', threat(text));
        if (!motion) {
          rotor.textContent = text;
          return;
        }
        var from = rotor.textContent;
        var len = Math.max(from.length, text.length);
        var start = performance.now();
        var dur = 700;
        rotor.classList.add('is-decoding');
        var step = function (t) {
          var p = Math.min(1, (t - start) / dur);
          var solved = Math.floor(len * p);
          var out = '';
          for (var i = 0; i < len; i++) {
            var c = text.charAt(i);
            if (i < solved) out += c;
            else if (c === ' ') out += ' ';
            else if (i < text.length || Math.random() > p) out += CH.charAt((Math.random() * CH.length) | 0);
          }
          rotor.textContent = out;
          if (p < 1) requestAnimationFrame(step);
          else {
            rotor.textContent = text;
            rotor.classList.remove('is-decoding');
          }
        };
        requestAnimationFrame(step);
      };
      var cycle = function () {
        // Only advance while the hero is on screen and the tab is visible
        if (heroOn && !document.hidden) {
          ti = (ti + 1) % tags.length;
          show(tags[ti]);
        }
        setTimeout(cycle, 3400);
      };
      setTimeout(cycle, motion ? 4200 : 4000); // let the intro land first
    }
  }

  /* ================= Card tilt + spotlight ================= */
  if (motion && finePointer) {
    $$('.etuh-pillar, .etuh-phys, .etuh-step, .etuh-boss, .etuh-card').forEach(function (c) {
      var max = c.classList.contains('etuh-card') ? 4 : 9;
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        c.style.setProperty('--ry', ((x - 0.5) * max).toFixed(2) + 'deg');
        c.style.setProperty('--rx', ((0.5 - y) * max).toFixed(2) + 'deg');
        c.classList.add('is-hot');
      });
      c.addEventListener('pointerleave', function () {
        c.classList.remove('is-hot');
        c.style.removeProperty('--rx');
        c.style.removeProperty('--ry');
      });
    });
  }

  /* ================= Showcase drift ================= */
  var panels = $$('.etuh-panel');
  if (motion && panels.length) {
    var visible = new Set();
    var ticking = false;
    var drift = function () {
      ticking = false;
      var vh = window.innerHeight;
      visible.forEach(function (p) {
        var r = p.getBoundingClientRect();
        var prog = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1..1
        p.style.setProperty('--p', Math.max(-1, Math.min(1, prog)).toFixed(3));
      });
    };
    var request = function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(drift);
      }
    };
    if (hasIO) {
      var pio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); });
        request();
      });
      panels.forEach(function (p) { pio.observe(p); });
    }
    window.addEventListener('scroll', request, { passive: true });
  }

  /* ================= MEGABOT: alarm + laser + transmission ================= */
  var gauntlet = root.querySelector('.etuh-gauntlet');
  if (gauntlet && motion) {
    var setH = function () { gauntlet.style.setProperty('--h', gauntlet.offsetHeight + 'px'); };
    setH();
    window.addEventListener('resize', setH);
    onView([gauntlet], function () {
      gauntlet.classList.add('is-alarm');
      setTimeout(function () { gauntlet.classList.remove('is-alarm'); }, 2000);
    }, { threshold: 0.25 });
  }

  var line = root.querySelector('.etuh-transmission-line');
  if (line && motion && hasIO) {
    var lines = [];
    try { lines = JSON.parse(line.getAttribute('data-lines')) || []; } catch (e) {}
    if (lines.length > 1) {
      var idx = 0;
      var typing = false;
      var lineVisible = false;
      var timer = 0;
      var type = function () {
        if (!lineVisible || typing) return;
        typing = true;
        var text = lines[idx];
        var i = 0;
        line.classList.add('is-typing');
        line.textContent = '';
        var next = function () {
          line.textContent = text.slice(0, ++i);
          if (i < text.length) {
            setTimeout(next, 26 + Math.random() * 34);
          } else {
            line.classList.remove('is-typing');
            typing = false;
            idx = (idx + 1) % lines.length;
            timer = setTimeout(type, 3200);
          }
        };
        next();
      };
      new IntersectionObserver(function (es) {
        lineVisible = es[0].isIntersecting;
        if (lineVisible) {
          clearTimeout(timer);
          type();
        }
      }).observe(line);
    }
  }

  /* ================= Trailer: click to load ================= */
  var theater = root.querySelector('.etuh-theater');
  if (theater) {
    var play = theater.querySelector('.etuh-theater-play');
    play.addEventListener('click', function () {
      var v = document.createElement('video');
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.poster = theater.querySelector('.etuh-theater-poster').src;
      v.src = theater.getAttribute('data-trailer');
      v.setAttribute('aria-label', play.textContent.trim());
      v.addEventListener('error', function () {
        // The trailer lives on the game's site; if it can't be reached, go there
        window.open(theater.getAttribute('data-fallback'), '_blank', 'noopener');
        theater.classList.remove('is-playing');
        v.remove();
      });
      theater.insertBefore(v, theater.firstChild);
      theater.classList.add('is-playing');
      v.focus();
      var pr = v.play();
      if (pr && pr.catch) pr.catch(function () {});
    });
  }

  /* ================= Evil Eye loop: play only on screen ================= */
  $$('video[data-etuh-loop]').forEach(function (v) {
    if (!motion || !hasIO) return;
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) {
        v.preload = 'auto';
        var pr = v.play();
        if (pr && pr.catch) pr.catch(function () {});
      } else {
        v.pause();
      }
    }, { threshold: 0.3 }).observe(v);
  });

  /* ================= Poster tilt ================= */
  if (motion && finePointer) {
    $$('.etuh-poster').forEach(function (p) {
      p.addEventListener('pointermove', function (e) {
        var r = p.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        p.style.setProperty('--ry', (x * 16).toFixed(2) + 'deg');
        p.style.setProperty('--rx', (-y * 16).toFixed(2) + 'deg');
      });
      p.addEventListener('pointerleave', function () {
        p.style.removeProperty('--ry');
        p.style.removeProperty('--rx');
      });
    });
  }

  /* ================= Spark burst on CTA clicks ================= */
  if (motion && document.body.animate) {
    root.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.etuh-btn, .etu-wishlist, .etuh-theater-play');
      if (!btn) return;
      var x = e.clientX;
      var y = e.clientY;
      if (!x && !y) {
        var r = btn.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }
      for (var i = 0; i < 18; i++) {
        var s = document.createElement('span');
        s.className = 'etuh-spark';
        s.style.left = x + 'px';
        s.style.top = y + 'px';
        document.body.appendChild(s);
        var a = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
        var d = 40 + Math.random() * 70;
        s.animate(
          [
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: 'translate(' + Math.cos(a) * d + 'px,' + Math.sin(a) * d + 'px) scale(0.2)', opacity: 0 }
          ],
          { duration: 550 + Math.random() * 300, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
        ).onfinish = (function (el) { return function () { el.remove(); }; })(s);
      }
    });
  }

  /* ================= Copy link ================= */
  var copy = root.querySelector('.etuh-copy');
  var status = root.querySelector('.etuh-copy-status');
  if (copy && navigator.clipboard && window.isSecureContext) {
    copy.hidden = false;
    copy.addEventListener('click', function () {
      navigator.clipboard.writeText(copy.getAttribute('data-url')).then(function () {
        if (status) {
          status.textContent = cfg.copied || 'Link copied';
          setTimeout(function () { status.textContent = ''; }, 2500);
        }
      });
    });
  }
})();
