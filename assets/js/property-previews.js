/**
 * Live property previews — lazily embeds a scaled-down iframe of each
 * external property (Parker's Physics, ETU 2175, Telford Landscaping)
 * into its homepage card once the card scrolls near the viewport.
 *
 * The branded monogram placeholder stays visible until the frame
 * loads, and remains if the remote site refuses to be embedded
 * (X-Frame-Options / frame-ancestors), since that failure mode keeps
 * the card looking intentional either way.
 */
(function () {
  'use strict';

  var cards = document.querySelectorAll('.property-live[data-preview]');
  if (!cards.length || !('IntersectionObserver' in window)) return;

  var FRAME_W = 1280;

  function scaleFrame(card, frame) {
    var screen = card.querySelector('.property-live-screen');
    if (!screen) return;
    var scale = screen.clientWidth / FRAME_W;
    frame.style.transform = 'scale(' + scale + ')';
  }

  function embed(card) {
    var screen = card.querySelector('.property-live-screen');
    if (!screen || card.dataset.embedded) return;
    card.dataset.embedded = '1';

    var frame = document.createElement('iframe');
    frame.setAttribute('tabindex', '-1');
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('loading', 'lazy');
    frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    frame.src = card.dataset.preview;

    frame.addEventListener('load', function () {
      // Give the remote page a beat to paint before the crossfade
      setTimeout(function () {
        card.classList.add('is-live');
      }, 650);
    });

    screen.appendChild(frame);
    scaleFrame(card, frame);

    window.addEventListener('resize', function () {
      scaleFrame(card, frame);
    });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        embed(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '200px 0px' });

  cards.forEach(function (card) {
    io.observe(card);
  });
})();
