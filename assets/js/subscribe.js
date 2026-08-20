/**
 * Subscribe forms — post to the theme's REST endpoint and swap in a
 * friendly status line. No page reload. Handles every form on the page
 * (footer band + [infinity_subscribe] shortcode) and announces
 * successful signups as an `infinity:subscribe` event so the RUM
 * collector can count funnel conversions.
 */
(function () {
  'use strict';

  var LABELS = {
    pending: '✓ Check your inbox',
    subscribed: '✓ Subscribed',
    already: '✓ Already in'
  };

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
            // The button is the thing people look at, so it has to say
            // which of the three "yes" answers this was. "Subscribed"
            // on a signup that still needs confirming is a lie that
            // costs a subscriber.
            btn.textContent = LABELS[data.state] || LABELS.subscribed;

            // 'already' is not a conversion; counting it would inflate
            // the funnel every time somebody signs up twice.
            if (data.state !== 'already') {
              document.dispatchEvent(new CustomEvent('infinity:subscribe', {
                detail: {
                  source: form.dataset.source || 'subscribe-form',
                  state: data.state || 'subscribed'
                }
              }));
            }
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

  // The banner shown after confirming or unsubscribing. Dismissing it
  // also strips the query flag, so a refresh or a shared URL does not
  // announce somebody's subscription again.
  var flash = document.querySelector('.subscribe-flash');
  if (flash) {
    var close = flash.querySelector('.subscribe-flash-close');
    if (close) {
      close.addEventListener('click', function () {
        flash.remove();
        if (window.history && history.replaceState) {
          var url = new URL(window.location.href);
          ['subscribed', 'confirm_failed', 'unsubscribed'].forEach(function (k) {
            url.searchParams.delete(k);
          });
          history.replaceState({}, '', url.pathname + url.search + url.hash);
        }
      });
    }
  }
})();
