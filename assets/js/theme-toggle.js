/**
 * Light / dark toggle. The initial mode is decided pre-paint by an
 * inline script in <head> (stored preference first, otherwise the
 * visitor's clock: 07:00-18:59 is daytime = light). This file only
 * handles the click and persistence.
 */
(function () {
    'use strict';

    var btn = document.querySelector('[data-theme-toggle]');
    if (!btn) {
        return;
    }
    var root = document.documentElement;
    var cfg = window.infinityThemeCfg || { dark: 'dark-cosmic', light: 'science-light' };

    function apply(mode, persist) {
        root.setAttribute('data-theme', mode === 'light' ? cfg.light : cfg.dark);
        root.setAttribute('data-mode', mode);
        btn.setAttribute('aria-pressed', mode === 'light' ? 'true' : 'false');
        if (persist) {
            try {
                localStorage.setItem('infinityTheme', mode);
            } catch (e) {}
        }
        try {
            window.dispatchEvent(new CustomEvent('infinity:theme', { detail: { mode: mode } }));
        } catch (e) {}
    }

    btn.setAttribute('aria-pressed', root.getAttribute('data-mode') === 'light' ? 'true' : 'false');

    btn.addEventListener('click', function () {
        apply(root.getAttribute('data-mode') === 'light' ? 'dark' : 'light', true);
    });
})();
