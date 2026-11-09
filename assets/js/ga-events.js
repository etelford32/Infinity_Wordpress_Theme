/**
 * GA4 funnel events on top of Site Kit's gtag.js.
 *
 * Site Kit owns the tag and the pageview; this only sends events, and
 * only when gtag (or its dataLayer) is actually on the page — Site Kit
 * leaves it off for logged-in admins, so your own visits stay out.
 *
 * Append ?ga_debug=1 to any URL to flag events for GA4 DebugView.
 */
(function () {
  'use strict';

  var cfg = window.infinityGa || {};
  var hosts = cfg.hosts || {};
  var context = cfg.context || 'other';
  var debug = /[?&]ga_debug=1\b/.test(location.search);

  function send(name, params) {
    params = params || {};
    params.page_context = context;
    if (debug) params.debug_mode = true;
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    } else if (Array.isArray(window.dataLayer)) {
      // Same shape gtag() pushes, for setups that define it late
      window.dataLayer.push(['event', name, params]);
    }
  }

  function projectForLink(a) {
    var tagged = a.closest('[data-project]');
    if (tagged) return tagged.getAttribute('data-project');
    var host = (a.hostname || '').toLowerCase().replace(/^www\./, '');
    if (hosts[host]) return hosts[host];
    if (host === 'store.steampowered.com' && cfg.steamApp && a.pathname.indexOf('/app/' + cfg.steamApp) === 0) {
      return 'etu';
    }
    return '';
  }

  function placementFor(el) {
    var p = el.closest('[data-placement]');
    if (p) return p.getAttribute('data-placement');
    var sec = el.closest('section[id], [id].widget, aside[id]');
    return context + (sec ? '_' + sec.id : '');
  }

  // Visible label only: decorative layers (aria-hidden) are skipped so
  // stacked type effects don't repeat the label three times
  function text(el) {
    var label = el.getAttribute('aria-label');
    if (!label) {
      label = '';
      var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (walk.nextNode()) {
        if (!walk.currentNode.parentElement.closest('[aria-hidden="true"]')) label += ' ' + walk.currentNode.nodeValue;
      }
    }
    return label.replace(/\s+/g, ' ').trim().slice(0, 100);
  }

  /* ---- Clicks through to a project -------------------------------- */

  addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;

    var intent = a.closest('[data-intent]');
    if (intent) {
      send('project_intent', {
        project: intent.getAttribute('data-project') || '',
        intent: intent.getAttribute('data-intent')
      });
    }

    // In-page anchors are navigation, not conversions
    if (a.host === location.host) return;

    var project = projectForLink(a);
    if (!project) return;

    var ctaEl = a.closest('[data-cta]');
    var params = {
      project: project,
      placement: placementFor(a),
      cta: ctaEl ? ctaEl.getAttribute('data-cta') : 'link',
      link_url: a.href.split('?')[0],
      link_text: text(a),
      outbound: true
    };
    send('project_click', params);

    if (a.hostname === 'store.steampowered.com') {
      send('wishlist_click', params);
    }
  }, { capture: true, passive: true });

  /* ---- Project blocks seen (the top of the funnel) ---------------- */

  // Counted once the block's top reaches the upper 60% of the screen —
  // a ratio threshold would never fire for blocks taller than the
  // viewport, which on phones is all of them.

  var blocks = document.querySelectorAll('[data-project-block]');
  if (blocks.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        send('project_impression', {
          project: el.getAttribute('data-project-block'),
          placement: placementFor(el)
        });
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -40% 0px' });
    Array.prototype.forEach.call(blocks, function (el) { io.observe(el); });
  }

  /* ---- Newsletter -------------------------------------------------- */

  document.addEventListener('infinity:subscribe', function (e) {
    send('sign_up', {
      method: 'email',
      source: (e.detail && e.detail.source) || 'subscribe-form'
    });
  });
})();
