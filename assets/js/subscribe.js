/**
 * Subscribe forms — post to the theme's REST endpoint and swap in a
 * friendly status line. No page reload. Handles every form on the page
 * (footer band + [infinity_subscribe] shortcode) and announces
 * successful signups as an `infinity:subscribe` event so the RUM
 * collector can count funnel conversions.
 */
(function () {
  'use strict';

  document.querySelectorAll('.subscribe-form').forEach(function (form) {
    var note = form.querySelector('.subscribe-note');
    var btn = form.querySelector('.subscribe-btn');
    var input = form.querySelector('.subscribe-input');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!input.value) return;

      btn.disabled = true;
      btn.textContent = '…';

      fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: input.value,
          website: form.querySelector('.subscribe-hp').value
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          note.textContent = data.message || (data.ok ? 'You’re on the list!' : 'Something went wrong — try again.');
          form.classList.toggle('subscribe-success', !!data.ok);
          if (data.ok) {
            input.value = '';
            btn.textContent = '✓ Subscribed';
            document.dispatchEvent(new CustomEvent('infinity:subscribe', {
              detail: { source: form.dataset.source || 'subscribe-form' }
            }));
          } else {
            btn.disabled = false;
            btn.textContent = 'Subscribe';
          }
        })
        .catch(function () {
          note.textContent = 'Network hiccup — please try again.';
          btn.disabled = false;
          btn.textContent = 'Subscribe';
        });
    });
  });

  // "Sign up" links point at /#subscribe — after the browser scrolls
  // to the band, put the cursor in the email field.
  function focusSubscribe() {
    if (location.hash !== '#subscribe') return;
    var band = document.getElementById('subscribe');
    var input = band && band.querySelector('.subscribe-input');
    if (input) input.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', focusSubscribe);
  focusSubscribe();
})();
