/**
 * Reading tools for single posts (markup from inc/reading-tools.php):
 *
 * - Section links: clicking the link icon beside a heading still jumps
 *   to it, and also copies the section's URL, with a "Link copied"
 *   bubble and a screen-reader announcement.
 * - Table of contents: the entry for the section being read is marked
 *   aria-current="location" (styled in single.css), in every copy of
 *   the TOC on the page.
 * - Progress bar: tracks how far through the post body the reader is,
 *   from the top of the body reaching the top of the screen to its end
 *   reaching the bottom. Only shown on posts longer than ~1.5 screens.
 *
 * One passive scroll listener and one requestAnimationFrame per frame
 * at most; all layout reads happen in that frame, then all writes.
 */
(function () {
  'use strict';

  var body = document.querySelector('.single-post .entry-content');
  if (!body) return;

  /* ---- Section links ------------------------------------------------ */

  var live = document.createElement('div');
  live.className = 'screen-reader-text';
  live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);

  function copied(anchor) {
    anchor.classList.add('is-copied');
    live.textContent = anchor.getAttribute('data-copy-label') || '';
    clearTimeout(anchor._copyTimer);
    anchor._copyTimer = setTimeout(function () {
      anchor.classList.remove('is-copied');
      live.textContent = '';
    }, 1600);
  }

  body.addEventListener('click', function (e) {
    var anchor = e.target.closest ? e.target.closest('.heading-anchor') : null;
    if (!anchor) return;
    // The browser follows the #link as usual; copying rides along
    var url = location.href.split('#')[0] + anchor.getAttribute('href');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { copied(anchor); }, function () {});
    }
  });

  /* ---- TOC highlight + progress ------------------------------------- */

  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('[data-post-toc] a[href^="#"]'));
  var headings = [];
  var seen = {};
  tocLinks.forEach(function (a) {
    var id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (seen[id]) return;
    var el = document.getElementById(id);
    if (el) {
      seen[id] = true;
      headings.push(el);
    }
  });

  var progress = document.querySelector('[data-reading-progress]');
  var bar = progress && progress.querySelector('.reading-progress-bar');

  var current = null;
  var ticking = false;

  function update() {
    ticking = false;

    // Reads
    var vh = window.innerHeight;
    var rect = body.getBoundingClientRect();
    var line = Math.min(160, vh * 0.25); // a heading above this line has "started"
    var active = null;
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].getBoundingClientRect().top <= line) active = headings[i];
      else break;
    }

    // Writes
    if (bar) {
      var long = rect.height > vh * 1.5;
      progress.hidden = !long;
      if (long) {
        var p = (0 - rect.top) / Math.max(1, rect.height - vh);
        p = Math.max(0, Math.min(1, p));
        bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      }
    }

    if (active !== current) {
      current = active;
      var id = active ? active.id : '';
      tocLinks.forEach(function (a) {
        if (id && a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    }
  }

  function schedule() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  if (headings.length || bar) {
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    // Late-loading images and embeds change the body's height
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(body);
    schedule();
  }
})();
