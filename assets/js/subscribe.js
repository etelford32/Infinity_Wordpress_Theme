/**
 * Footer subscribe form — posts to the theme's REST endpoint and
 * swaps in a friendly status line. No page reload.
 */
(function () {
  'use strict';

  var form = document.querySelector('.subscribe-form');
  if (!form) return;

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
})();
