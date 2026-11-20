/**
 * Explore the Universe 2175 hub (page-explore-the-universe.php).
 *
 * - Demo countdown to the free demo's release; flips to "out now".
 * - The galaxy's numbers count up when they come into view.
 * - The 13 MB trailer is only fetched when someone presses play.
 * - Sections rise in as they scroll into view.
 * - MEGABOT's transmission types out his lines, one after another.
 * - The Evil Eye loop plays only while on screen.
 * - Posters tilt toward the pointer.
 * - "Copy link" appears where the Clipboard API exists.
 *
 * Everything degrades to a complete static page: without JS, nothing is
 * hidden. Under prefers-reduced-motion, nothing animates or autoplays.
 */
(function () {
  'use strict';

  var root = document.querySelector('.etuh');
  if (!root) return;

  var cfg = window.infinityEtuHub || {};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

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

  /* ---- Scroll reveal ---- */
  var reveals = [].slice.call(root.querySelectorAll('[data-reveal]'));
  if (!reduce && hasIO) {
    root.classList.add('etuh-js');
    onView(reveals, function (el) { el.classList.add('is-in'); }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }

  /* ---- Countdown ---- */
  var cd = root.querySelector('[data-etuh-countdown]');
  if (cd && !cd.hasAttribute('data-live')) {
    var at = Date.parse(cd.getAttribute('data-at'));
    var clock = cd.querySelector('.etuh-clock');
    var units = {};
    [].forEach.call(cd.querySelectorAll('[data-u]'), function (b) { units[b.getAttribute('data-u')] = b; });
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var tick = function () {
      var left = at - Date.now();
      if (isNaN(at)) return;
      if (left <= 0) {
        cd.setAttribute('data-live', '');
        if (clock) clock.hidden = true;
        var txt = cd.querySelector('.etuh-demo-text');
        if (txt && cfg.liveTxt) txt.textContent = cfg.liveTxt;
        return;
      }
      var s = Math.floor(left / 1000);
      units.d.textContent = Math.floor(s / 86400);
      units.h.textContent = pad(Math.floor(s / 3600) % 24);
      units.m.textContent = pad(Math.floor(s / 60) % 60);
      units.s.textContent = pad(s % 60);
      setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    if (clock && units.d) {
      clock.hidden = false;
      tick();
    }
  }

  /* ---- Count-up numbers ---- */
  var nums = [].slice.call(root.querySelectorAll('[data-count]'));
  if (!reduce) {
    var fmt = window.Intl ? new Intl.NumberFormat() : null;
    onView(nums, function (b) {
      var end = parseInt(b.getAttribute('data-count'), 10);
      if (end < 10) return;
      var t0 = performance.now();
      var dur = 1400;
      var step = function (t) {
        var p = Math.min(1, (t - t0) / dur);
        var v = Math.round(end * (1 - Math.pow(1 - p, 3)));
        b.textContent = fmt ? fmt.format(v) : v;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
  }

  /* ---- Trailer: click to load ---- */
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
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    });
  }

  /* ---- MEGABOT transmission ---- */
  var line = root.querySelector('.etuh-transmission-line');
  if (line && !reduce) {
    var lines = [];
    try { lines = JSON.parse(line.getAttribute('data-lines')) || []; } catch (e) {}
    if (lines.length > 1) {
      var idx = 0;
      var typing = false;
      var visible = false;
      var type = function () {
        if (!visible || typing) return;
        typing = true;
        var text = lines[idx];
        var i = 0;
        line.classList.add('is-typing');
        line.textContent = '';
        var next = function () {
          line.textContent = text.slice(0, ++i);
          if (i < text.length) {
            setTimeout(next, 28 + Math.random() * 30);
          } else {
            line.classList.remove('is-typing');
            typing = false;
            idx = (idx + 1) % lines.length;
            setTimeout(type, 3200);
          }
        };
        next();
      };
      if (hasIO) {
        new IntersectionObserver(function (es) {
          visible = es[0].isIntersecting;
          if (visible) type();
        }).observe(line);
      }
    }
  }

  /* ---- Evil Eye loop: play only on screen ---- */
  [].forEach.call(root.querySelectorAll('video[data-etuh-loop]'), function (v) {
    if (reduce || !hasIO) return;
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) {
        v.preload = 'auto';
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        v.pause();
      }
    }, { threshold: 0.3 }).observe(v);
  });

  /* ---- Poster tilt ---- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    [].forEach.call(root.querySelectorAll('.etuh-poster'), function (p) {
      p.addEventListener('pointermove', function (e) {
        var r = p.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        p.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
        p.style.setProperty('--rx', (-y * 14).toFixed(2) + 'deg');
      });
      p.addEventListener('pointerleave', function () {
        p.style.removeProperty('--ry');
        p.style.removeProperty('--rx');
      });
    });
  }

  /* ---- Copy link ---- */
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
