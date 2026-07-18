/**
 * RUM collector — pageviews, Core Web Vitals, scroll depth, engaged
 * time, outbound clicks, subscribe funnel. Anonymous and cookieless:
 * the session id lives in sessionStorage and dies with the tab.
 *
 * Beacons JSON to /wp-json/infinity/v1/rum. Keys are terse to keep
 * beacons under the sendBeacon size limit: e=event, p=path, r=referrer,
 * d=device, s=session, t=target, sc=scroll %, eng=engaged seconds.
 */
(function () {
  'use strict';

  if (!window.infinityRum || !window.infinityRum.endpoint) return;
  var endpoint = window.infinityRum.endpoint;

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
  if (nav && nav.responseStart > 0) ttfb = Math.round(nav.responseStart);

  function observe(type, cb, opts) {
    try {
      var po = new PerformanceObserver(function (list) { list.getEntries().forEach(cb); });
      po.observe(Object.assign({ type: type, buffered: true }, opts || {}));
      return po;
    } catch (e) { return null; }
  }

  observe('paint', function (entry) {
    if (entry.name === 'first-contentful-paint') fcp = Math.round(entry.startTime);
  });

  observe('largest-contentful-paint', function (entry) {
    lcp = Math.round(entry.startTime);
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

  /* ---- Beacons ----------------------------------------------------- */

  // Pageview straight away (TTFB rides along)
  send({ e: 'view', d: device, r: document.referrer || '', ttfb: ttfb });

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
})();
