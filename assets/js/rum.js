/**
 * RUM collector — pageviews, Core Web Vitals, scroll depth, engaged
 * time, outbound clicks, subscribe funnel. Anonymous and cookieless:
 * the session id lives in sessionStorage and dies with the tab.
 *
 * Beacons JSON to /wp-json/infinity/v1/rum. Keys are terse to keep
 * beacons under the sendBeacon size limit: e=event, p=path, r=referrer,
 * d=device, s=session, t=target, sc=scroll %, eng=engaged seconds,
 * v=hero experiment arm. A view's t is 'prerender' when the page was
 * prerendered by the speculation rules before the visitor opened it.
 */
(function () {
  'use strict';

  if (!window.infinityRum || !window.infinityRum.endpoint) return;
  var endpoint = window.infinityRum.endpoint;

  // A page prerendered by the speculation rules (inc/speculative-loading.php)
  // may never be shown: hovering a link is not visiting it. Start nothing
  // until the page is activated, and time paint metrics from activation,
  // the moment the visitor actually navigated, not from when the
  // background render began.
  if (document.prerendering) {
    document.addEventListener('prerenderingchange', start, { once: true });
  } else {
    start();
  }

  function start() {
    var session = '';
    try {
      session = sessionStorage.getItem('infRum') || '';
      if (!session) {
        session = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
        sessionStorage.setItem('infRum', session);
      }
    } catch (e) { /* storage blocked — events still count, sessions won't */ }

    var device = window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';

    function send(data) {
      data.s = session;
      data.p = location.pathname;
      var body = JSON.stringify(data);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, body);
      } else {
        fetch(endpoint, { method: 'POST', body: body, keepalive: true }).catch(function () {});
      }
    }

    /* ---- Vitals ------------------------------------------------------ */

    var lcp = null, cls = 0, inp = null, fcp = null, ttfb = null;

    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    // activationStart > 0 only on a prerendered page; everything before it
    // happened while the visitor was still on the previous page.
    var act = (nav && nav.activationStart) || 0;
    var prerendered = act > 0;
    function sinceActivation(t) { return Math.round(Math.max(0, t - act)); }
    if (nav && nav.responseStart > 0) ttfb = sinceActivation(nav.responseStart);

    function observe(type, cb, opts) {
      try {
        var po = new PerformanceObserver(function (list) { list.getEntries().forEach(cb); });
        po.observe(Object.assign({ type: type, buffered: true }, opts || {}));
        return po;
      } catch (e) { return null; }
    }

    observe('paint', function (entry) {
      if (entry.name === 'first-contentful-paint') fcp = sinceActivation(entry.startTime);
    });

    observe('largest-contentful-paint', function (entry) {
      lcp = sinceActivation(entry.startTime);
    });

    // CLS with the standard session-window logic (5s windows, 1s gaps)
    var clsWin = 0, clsEntries = [];
    observe('layout-shift', function (entry) {
      if (entry.hadRecentInput) return;
      var first = clsEntries[0], last = clsEntries[clsEntries.length - 1];
      if (clsWin && last && entry.startTime - last.startTime < 1000 && entry.startTime - first.startTime < 5000) {
        clsWin += entry.value;
        clsEntries.push(entry);
      } else {
        clsWin = entry.value;
        clsEntries = [entry];
      }
      if (clsWin > cls) cls = clsWin;
    });

    // INP approximation: worst interaction duration on the page
    observe('event', function (entry) {
      if (entry.interactionId && (inp === null || entry.duration > inp)) {
        inp = Math.round(entry.duration);
      }
    }, { durationThreshold: 40 });

    /* ---- Engagement -------------------------------------------------- */

    var maxScroll = 0, engaged = 0, lastActivity = Date.now();

    function onActivity() { lastActivity = Date.now(); }
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
      addEventListener(ev, onActivity, { passive: true, capture: true });
    });

    addEventListener('scroll', function () {
      lastActivity = Date.now();
      var doc = document.documentElement;
      var height = Math.max(1, doc.scrollHeight - window.innerHeight);
      var pct = Math.round(100 * Math.min(1, (window.scrollY || doc.scrollTop) / height));
      if (pct > maxScroll) maxScroll = pct;
    }, { passive: true });

    setInterval(function () {
      if (document.visibilityState === 'visible' && Date.now() - lastActivity < 15000) {
        engaged++;
      }
    }, 1000);

    /* ---- Clicks ------------------------------------------------------ */

    addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('a[href], [data-rum]') : null;
      if (!el) return;
      var label = el.getAttribute('data-rum');
      if (!label && el.host && el.host !== location.host) label = el.host;
      if (label) send({ e: 'click', d: device, t: label });
    }, { capture: true, passive: true });

    // Subscribe funnel: band scrolled into view + successful signup
    var band = document.getElementById('subscribe');
    if (band && 'IntersectionObserver' in window) {
      var seen = false;
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !seen) {
            seen = true;
            send({ e: 'seen', d: device, t: 'subscribe-band' });
            obs.disconnect();
          }
        });
      }, { threshold: 0.4 }).observe(band);
    }

    document.addEventListener('infinity:subscribe', function (e) {
      send({ e: 'subscribe', d: device, t: (e.detail && e.detail.source) || 'subscribe-form' });
    });

    /* ---- Homepage hero ----------------------------------------------- */

    // blackhole.js queues hero actions on window.infinityHeroQ (it may
    // run before this deferred script). Drain the queue, then replace it
    // with a live push. Per-pageview caps keep a visitor hammering the
    // hole, or re-opening the lead article, from swamping the table.
    var HERO_CAP = { feed: 10, 'feed-btn': 10, 'lead-click': 3, 'lead-cat': 3, 'also-new': 5, 'pillar-nav': 5, wishlist: 3 };
    var heroCount = {};
    function hero(item) {
      if (!item || typeof item.action !== 'string') return;
      var a = item.action;
      heroCount[a] = (heroCount[a] || 0) + 1;
      if (heroCount[a] > (HERO_CAP[a] || 1)) return;
      var data = { e: 'hero', d: device, t: a, v: item.variant || '' };
      if (typeof item.sec === 'number' && isFinite(item.sec)) data.eng = Math.round(item.sec);
      send(data);
    }
    var heroQueued = window.infinityHeroQ;
    window.infinityHeroQ = { push: hero };
    if (heroQueued && heroQueued.length) heroQueued.forEach(hero);

    /* ---- Beacons ----------------------------------------------------- */

    // Pageview straight away (TTFB rides along). Prerendered views are
    // tagged so the dashboard can show how often prerendering hit.
    send({ e: 'view', d: device, r: document.referrer || '', ttfb: ttfb, t: prerendered ? 'prerender' : '' });

    // Exit beacon once, on first hide/leave — carries the vitals that
    // only settle at end of page life
    var exited = false;
    function onExit() {
      if (exited) return;
      exited = true;
      send({
        e: 'exit',
        d: device,
        lcp: lcp,
        cls: Math.round(cls * 1000),
        inp: inp,
        fcp: fcp,
        sc: maxScroll,
        eng: engaged
      });
    }
    addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') onExit();
    });
    addEventListener('pagehide', onExit);
  }
})();
