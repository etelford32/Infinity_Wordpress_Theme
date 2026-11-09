/**
 * Quick search dialog (markup and endpoint: inc/quick-search.php).
 *
 * Opens from [data-search-open] (the header button, a plain link to the
 * search page without JS), from "/" when not typing in a field, and
 * from Ctrl/⌘+K. Results are fetched as you type, debounced, with the
 * previous request cancelled and answers cached per query. The input
 * is an ARIA combobox: ↑/↓ move through the options, Enter opens the
 * highlighted one, and Enter with nothing highlighted submits the form
 * to the full search page.
 */
(function () {
  'use strict';

  var cfg = window.infinitySearch;
  var dialog = document.getElementById('quick-search');
  if (!cfg || !dialog || typeof dialog.showModal !== 'function') return;

  var input = dialog.querySelector('#qs-input');
  var list = dialog.querySelector('#qs-results');
  var status = dialog.querySelector('[data-qs-status]');
  var empty = dialog.querySelector('[data-qs-empty]');
  var defaults = dialog.querySelector('[data-qs-default]');
  var form = dialog.querySelector('form');
  var t = cfg.i18n || {};

  var cache = {};
  var timer = null;
  var inflight = null;
  var active = -1;
  var options = [];
  var lastQuery = '';

  /* ---- Open / close ------------------------------------------------- */

  function open() {
    if (dialog.open) return;
    dialog.showModal();
    document.documentElement.classList.add('qs-open');
    input.focus();
    input.select();
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  dialog.addEventListener('close', function () {
    document.documentElement.classList.remove('qs-open');
  });

  document.addEventListener('click', function (e) {
    var opener = e.target.closest ? e.target.closest('[data-search-open]') : null;
    if (opener) {
      e.preventDefault();
      open();
    }
  });

  dialog.querySelector('[data-search-close]').addEventListener('click', close);

  // A click on the backdrop lands on the <dialog> element itself
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) close();
  });

  function typing(el) {
    if (!el) return false;
    var tag = el.tagName;
    return el.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented) return;
    var k = e.key;
    if ((k === 'k' || k === 'K') && (e.metaKey || e.ctrlKey) && !e.altKey) {
      e.preventDefault();
      if (dialog.open) close(); else open();
    } else if (k === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !typing(document.activeElement)) {
      e.preventDefault();
      open();
    }
  });

  /* ---- Rendering ---------------------------------------------------- */

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Text with the query's words wrapped in <mark>, built as DOM nodes
  // so nothing from the server is ever parsed as HTML
  function highlighted(text, query) {
    var frag = document.createDocumentFragment();
    var words = query.split(/\s+/).filter(function (w) { return w.length > 1; }).map(escapeRe);
    if (!words.length) {
      frag.appendChild(document.createTextNode(text));
      return frag;
    }
    var re = new RegExp('(' + words.join('|') + ')', 'ig');
    var last = 0;
    text.replace(re, function (m, _g, idx) {
      if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)));
      var mark = document.createElement('mark');
      mark.textContent = m;
      frag.appendChild(mark);
      last = idx + m.length;
      return m;
    });
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    return frag;
  }

  function setActive(i) {
    if (active >= 0 && options[active]) options[active].setAttribute('aria-selected', 'false');
    active = i;
    if (i >= 0 && options[i]) {
      options[i].setAttribute('aria-selected', 'true');
      input.setAttribute('aria-activedescendant', options[i].id);
      options[i].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function showDefaults() {
    list.hidden = true;
    list.textContent = '';
    empty.hidden = true;
    defaults.hidden = false;
    options = [];
    setActive(-1);
    input.setAttribute('aria-expanded', 'false');
    status.textContent = '';
  }

  function render(query, data) {
    list.textContent = '';
    options = [];
    active = -1;
    input.removeAttribute('aria-activedescendant');
    defaults.hidden = true;

    var rows = (data && data.results) || [];
    rows.forEach(function (r, i) {
      var li = document.createElement('li');
      li.id = 'qs-opt-' + i;
      li.className = 'qs-option qs-kind-' + String(r.kind || '').replace(/[^a-z0-9_-]/gi, '');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');

      var a = document.createElement('a');
      a.className = 'qs-link';
      a.href = r.url;
      a.tabIndex = -1;
      a.setAttribute('data-rum', 'quick-search:result');

      var title = document.createElement('span');
      title.className = 'qs-title';
      title.appendChild(highlighted(r.title || '', query));
      a.appendChild(title);

      if (r.meta) {
        var meta = document.createElement('span');
        meta.className = 'qs-meta';
        meta.textContent = r.meta;
        a.appendChild(meta);
      }

      li.appendChild(a);
      li.addEventListener('mousemove', function () { if (active !== i) setActive(i); });
      list.appendChild(li);
      options.push(li);
    });

    if (rows.length) {
      // Last row: the full results page
      var li = document.createElement('li');
      li.id = 'qs-opt-all';
      li.className = 'qs-option qs-all';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      var a = document.createElement('a');
      a.className = 'qs-link';
      a.href = data.all;
      a.tabIndex = -1;
      a.textContent = (t.all || 'See all results for “%s”').replace('%s', query);
      li.appendChild(a);
      var idx = options.length;
      li.addEventListener('mousemove', function () { if (active !== idx) setActive(idx); });
      list.appendChild(li);
      options.push(li);
    }

    list.hidden = !rows.length;
    empty.hidden = !!rows.length;
    if (!rows.length) empty.textContent = (t.none || '').replace('%s', query);
    input.setAttribute('aria-expanded', rows.length ? 'true' : 'false');
    status.textContent = rows.length === 1 ? (t.one || '') : (t.results || '%d').replace('%d', rows.length);
    if (rows.length) setActive(0);
  }

  /* ---- Fetching ----------------------------------------------------- */

  function search(query) {
    lastQuery = query;
    if (cache[query]) {
      render(query, cache[query]);
      return;
    }
    if (inflight) inflight.abort();
    inflight = 'AbortController' in window ? new AbortController() : null;
    dialog.classList.add('is-loading');
    fetch(cfg.endpoint + (cfg.endpoint.indexOf('?') > -1 ? '&' : '?') + 'q=' + encodeURIComponent(query), {
      headers: { Accept: 'application/json' },
      signal: inflight ? inflight.signal : undefined
    })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        cache[query] = data;
        if (query === lastQuery) render(query, data);
      })
      .catch(function (err) {
        if (err && err.name === 'AbortError') return;
        if (query === lastQuery) {
          list.hidden = true;
          defaults.hidden = true;
          empty.hidden = false;
          empty.textContent = t.error || '';
        }
      })
      .then(function () { dialog.classList.remove('is-loading'); });
  }

  input.addEventListener('input', function () {
    var q = input.value.trim();
    clearTimeout(timer);
    if (q.length < 2) {
      lastQuery = '';
      if (inflight) inflight.abort();
      showDefaults();
      return;
    }
    timer = setTimeout(function () { search(q); }, 140);
  });

  /* ---- Keys and choosing -------------------------------------------- */

  function track(query) {
    if (typeof window.gtag === 'function' && query) {
      window.gtag('event', 'search', { search_term: query });
    }
  }

  input.addEventListener('keydown', function (e) {
    // In a search field with text, Escape would only clear the text;
    // here it should close, as it does everywhere else in the dialog
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown' && options.length) {
      e.preventDefault();
      setActive((active + 1) % options.length);
    } else if (e.key === 'ArrowUp' && options.length) {
      e.preventDefault();
      setActive(active <= 0 ? options.length - 1 : active - 1);
    } else if (e.key === 'Enter' && active >= 0 && options[active]) {
      e.preventDefault();
      options[active].querySelector('a').click(); // tracked by the list's click handler
    }
  });

  list.addEventListener('click', function () { track(input.value.trim()); });

  form.addEventListener('submit', function (e) {
    if (!input.value.trim()) {
      e.preventDefault();
      return;
    }
    track(input.value.trim());
  });

  // Leaving through a result: close first, so going Back returns to the
  // page rather than to a page with the dialog still open over it
  dialog.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (a && !e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
      setTimeout(close, 0);
    }
  });
})();
