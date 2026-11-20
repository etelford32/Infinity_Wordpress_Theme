/**
 * Explore the Universe 2175 hub (page-explore-the-universe.php):
 * - the teaser plays muted only while on screen, never under
 *   prefers-reduced-motion, with a visible pause control;
 * - "Copy link" shows only where the Clipboard API exists.
 */
(function () {
  'use strict';

  var video = document.querySelector('video[data-etuh-autoplay]');
  var toggle = document.querySelector('.etuh-video-toggle');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (video && toggle) {
    var userPaused = reduce;
    var labelPause = toggle.textContent;
    var labelPlay = toggle.getAttribute('data-play') || 'Play teaser';

    var sync = function () {
      toggle.textContent = video.paused ? labelPlay : labelPause;
      toggle.setAttribute('aria-pressed', video.paused ? 'true' : 'false');
    };

    toggle.hidden = false;
    toggle.addEventListener('click', function () {
      if (video.paused) {
        userPaused = false;
        video.preload = 'auto';
        video.play().catch(function () {});
      } else {
        userPaused = true;
        video.pause();
      }
    });
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    sync();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !userPaused) {
            video.preload = 'auto';
            video.play().catch(function () {});
          } else if (!e.isIntersecting && !video.paused) {
            video.pause();
          }
        });
      }, { threshold: 0.35 }).observe(video);
    }
  }

  var copy = document.querySelector('.etuh-copy');
  var status = document.querySelector('.etuh-copy-status');
  if (copy && navigator.clipboard && window.isSecureContext) {
    copy.hidden = false;
    copy.addEventListener('click', function () {
      navigator.clipboard.writeText(copy.getAttribute('data-url')).then(function () {
        if (status) {
          status.textContent = (window.infinityEtuHub && window.infinityEtuHub.copied) || 'Link copied';
          setTimeout(function () { status.textContent = ''; }, 2500);
        }
      });
    });
  }
})();
