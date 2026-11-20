/**
 * "Run it here" for Parker's Physics simulation cards
 * (inc/parkers-sims.php, [parkers_sim embed="1"]).
 *
 * The card ships as a poster with a button; the simulation (a full
 * WebGL page) loads only when the reader asks for it. The click is
 * reported to GA4 as project_intent so in-article runs show up next to
 * the click-throughs in the funnel.
 */
(function () {
  'use strict';

  function send(params) {
    params.page_context = (window.infinityGa && window.infinityGa.context) || 'other';
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'project_intent', params);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(['event', 'project_intent', params]);
    }
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.pp-sim-run') : null;
    if (!btn) return;

    var stage = btn.closest('[data-sim-embed]');
    var card = btn.closest('.pp-sim');
    if (!stage || !card || card.classList.contains('is-running')) return;

    var frame = document.createElement('iframe');
    frame.src = stage.getAttribute('data-sim-embed');
    frame.title = stage.getAttribute('data-sim-title') || 'Simulation';
    frame.className = 'pp-sim-frame';
    frame.setAttribute('allow', 'fullscreen; accelerometer; gyroscope; geolocation');
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');

    stage.textContent = '';
    stage.appendChild(frame);
    card.classList.add('is-running');
    frame.focus();

    send({
      project: 'parkers',
      intent: 'sim_run_here',
      placement: card.getAttribute('data-placement') || 'article',
      cta: card.getAttribute('data-cta') || ''
    });
  });
})();
