/**
 * Steam widget fitter. The Steam store widget lays itself out for a
 * 646x190 frame; anything narrower and the game title starts clipping.
 * So: render the iframe at its natural size and scale the whole thing
 * down to the container width — every pixel of the widget stays visible
 * at any column width.
 */
(function () {
    'use strict';

    var wraps = [].slice.call(document.querySelectorAll('.steam-fit'));
    if (!wraps.length) {
        return;
    }

    function fit(wrap) {
        var frame = wrap.querySelector('iframe');
        if (!frame) {
            return;
        }
        var bw = parseFloat(wrap.getAttribute('data-basewidth')) || 646;
        var bh = parseFloat(wrap.getAttribute('data-baseheight')) || 190;
        var w = wrap.clientWidth;
        if (!w) {
            return;
        }
        var s = Math.min(w / bw, 1);
        frame.style.width = bw + 'px';
        frame.style.height = bh + 'px';
        frame.style.transformOrigin = 'top left';
        frame.style.transform = 'scale(' + s + ')';
        wrap.style.height = Math.round(bh * s) + 'px';
    }

    function fitAll() {
        wraps.forEach(fit);
    }

    fitAll();
    window.addEventListener('load', fitAll);
    if (window.ResizeObserver) {
        var ro = new ResizeObserver(fitAll);
        wraps.forEach(function (w) {
            ro.observe(w);
        });
    } else {
        window.addEventListener('resize', fitAll);
    }
})();
