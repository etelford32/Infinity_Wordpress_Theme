/**
 * Parker's Physics hub: category chips and search over the catalog
 * (page-parkers-physics.php). Without JS the whole catalog shows and the
 * filter bar stays hidden.
 */
(function () {
  'use strict';

  var root = document.getElementById('pph-catalog');
  if (!root) return;

  var bar = root.querySelector('.pph-filter');
  var chips = Array.prototype.slice.call(root.querySelectorAll('.pph-chip'));
  var input = root.querySelector('.pph-search input');
  var status = root.querySelector('.pph-filter-status');
  var empty = root.querySelector('.pph-empty');
  var cats = Array.prototype.slice.call(root.querySelectorAll('.pph-cat'));
  var current = 'all';
  var timer;

  bar.hidden = false;

  function apply() {
    var q = (input.value || '').trim().toLowerCase();
    var words = q ? q.split(/\s+/) : [];
    var shown = 0;

    cats.forEach(function (cat) {
      var inCat = current === 'all' || cat.getAttribute('data-section') === current;
      var n = 0;
      Array.prototype.forEach.call(cat.querySelectorAll('.pph-sim'), function (card) {
        var hay = card.getAttribute('data-find') || '';
        var ok = inCat && words.every(function (w) { return hay.indexOf(w) !== -1; });
        card.hidden = !ok;
        if (ok) n++;
      });
      cat.hidden = n === 0;
      shown += n;
    });

    empty.hidden = shown !== 0;
    status.textContent = (q || current !== 'all') ? shown + (shown === 1 ? ' simulation' : ' simulations') : '';
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      current = chip.getAttribute('data-filter');
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      apply();
    });
  });

  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(apply, 120);
  });

  root.querySelector('.pph-clear').addEventListener('click', function () {
    input.value = '';
    current = 'all';
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-filter') === 'all' ? 'true' : 'false'); });
    apply();
    input.focus();
  });
})();
