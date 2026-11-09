/**
 * Post media: loop videos, animated GIFs and the YouTube facade.
 * Markup comes from inc/post-media.php.
 *
 * - Loop videos ([data-infinity-loop]) play only while at least a
 *   quarter of them is on screen, never start for reduced-motion
 *   visitors, and get a pause/play button.
 * - Animated GIFs (.infinity-gif) get the same button. Pausing freezes
 *   the current frame on a canvas; reduced-motion visitors start on the
 *   still frame and can press play to load the GIF.
 * - Card thumbnails with [data-gif-hover] animate on hover or focus.
 * - YouTube facades (.infinity-yt) become the privacy-enhanced player
 *   on click.
 * - Lazy videos ([data-lazy-video]) get their poster and preload back
 *   when they come within a screen of the viewport.
 */
(function () {
  'use strict';

  var i18n = window.infinityMedia || {};
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;

  var ICON_PAUSE = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';

  /**
   * Pause/play button, pinned to the media itself. When the media is
   * wrapped in a link the button moves to the link's parent, so it is
   * never nested inside the link.
   */
  function addToggle(wrap, playing, onToggle) {
    var link = wrap.closest('a');
    var host = link ? link.parentNode : wrap;
    if (host.querySelector(':scope > .infinity-media-toggle')) return null;
    host.classList.add('infinity-media-host');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'infinity-media-toggle';

    function render(isPlaying) {
      btn.innerHTML = isPlaying ? ICON_PAUSE : ICON_PLAY;
      btn.setAttribute('aria-label', isPlaying ? (i18n.pause || 'Pause animation') : (i18n.play || 'Play animation'));
      btn.setAttribute('aria-pressed', isPlaying ? 'false' : 'true');
      host.classList.toggle('is-paused', !isPlaying);
    }

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      render(onToggle());
    });

    render(playing);
    host.appendChild(btn);
    return render;
  }

  /* ---------------------------------------------------------------
   * Lazy videos (inc/lazy-load.php): poster and preload are held back
   * until the video is about a screen away from the viewport.
   * ------------------------------------------------------------- */

  function wake(v) {
    if (v._woke) return;
    v._woke = true;
    var poster = v.getAttribute('data-poster');
    if (poster) v.setAttribute('poster', poster);
    var preload = v.getAttribute('data-preload');
    if (preload && preload !== 'none' && v.preload === 'none') v.preload = preload;
  }

  var lazyVids = document.querySelectorAll('video[data-lazy-video]');
  if (lazyVids.length) {
    if ('IntersectionObserver' in window) {
      var lazyIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            wake(entry.target);
            lazyIo.unobserve(entry.target);
          }
        });
      }, { rootMargin: '100% 0px' });
      Array.prototype.forEach.call(lazyVids, function (v) {
        lazyIo.observe(v);
        // Anything that starts playback first wakes it too
        v.addEventListener('play', function () { wake(v); }, { once: true });
      });
    } else {
      Array.prototype.forEach.call(lazyVids, wake);
    }
  }

  /* ---------------------------------------------------------------
   * Loop videos
   * ------------------------------------------------------------- */

  var loops = document.querySelectorAll('video[data-infinity-loop]');
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var v = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
        if (!v._userPaused) start(v);
      } else if (!v.paused) {
        v.pause();
      }
    });
  }, { threshold: [0, 0.25] }) : null;

  function start(v) {
    wake(v);
    if (v.preload === 'none') v.preload = 'auto';
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* blocked; button still works */ });
  }

  Array.prototype.forEach.call(loops, function (v) {
    // Muted must be set as a property for autoplay policies to allow play()
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.removeAttribute('controls');
    v._userPaused = reduced;

    var render = addToggle(v.closest('.infinity-loop-wrap') || v.parentNode, !reduced, function () {
      if (v.paused) {
        v._userPaused = false;
        start(v);
        return true;
      }
      v._userPaused = true;
      v.pause();
      return false;
    });

    if (render) {
      v.addEventListener('play', function () { render(true); });
      v.addEventListener('pause', function () { if (v._userPaused) render(false); });
    }

    if (io) io.observe(v);
    else if (!reduced) start(v);
  });

  /* ---------------------------------------------------------------
   * Animated GIFs
   * ------------------------------------------------------------- */

  Array.prototype.forEach.call(document.querySelectorAll('.infinity-gif'), function (wrap) {
    var img = wrap.querySelector('img');
    if (!img) return;
    var gifSrc = wrap.getAttribute('data-gif-src');
    var source = wrap.querySelector('source');
    var canvas = null;

    // Reduced motion with no still frame available: freeze on load
    var startsPaused = reduced;

    function freeze() {
      if (!img.complete || !img.naturalWidth) return;
      canvas = document.createElement('canvas');
      canvas.className = 'infinity-gif-freeze';
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      try {
        canvas.getContext('2d').drawImage(img, 0, 0);
      } catch (e) { /* cross-origin: still hide the motion below */ }
      canvas.setAttribute('aria-hidden', 'true');
      wrap.appendChild(canvas);
      wrap.classList.add('is-frozen');
    }

    function thaw() {
      // Reduced-motion still frame: drop it and load the GIF itself
      if (source) {
        source.parentNode.removeChild(source);
        source = null;
        img.src = gifSrc;
      }
      if (canvas) {
        canvas.parentNode.removeChild(canvas);
        canvas = null;
      }
      wrap.classList.remove('is-frozen');
    }

    var playing = !startsPaused;
    addToggle(wrap, playing, function () {
      if (playing) freeze();
      else thaw();
      playing = !playing;
      return playing;
    });

    if (startsPaused && !source) {
      if (img.complete) freeze();
      else img.addEventListener('load', freeze, { once: true });
    }
  });

  /* ---------------------------------------------------------------
   * GIF thumbnails on cards: animate on hover / focus
   * ------------------------------------------------------------- */

  if (!reduced) {
    Array.prototype.forEach.call(document.querySelectorAll('img[data-gif-hover]'), function (img) {
      var card = img.closest('article, .fp-card, a') || img;
      var still = { src: img.getAttribute('src'), srcset: img.getAttribute('srcset') };

      function on() {
        img.removeAttribute('srcset');
        img.src = img.getAttribute('data-gif-hover');
      }
      function off() {
        img.src = still.src;
        if (still.srcset) img.setAttribute('srcset', still.srcset);
      }

      if (canHover) {
        card.addEventListener('mouseenter', on);
        card.addEventListener('mouseleave', off);
      }
      card.addEventListener('focusin', on);
      card.addEventListener('focusout', off);
    });
  }

  /* ---------------------------------------------------------------
   * YouTube facade
   * ------------------------------------------------------------- */

  var warmed = false;
  function warm() {
    if (warmed) return;
    warmed = true;
    ['https://www.youtube-nocookie.com', 'https://www.google.com', 'https://i.ytimg.com'].forEach(function (href) {
      var l = document.createElement('link');
      l.rel = 'preconnect';
      l.href = href;
      document.head.appendChild(l);
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('.infinity-yt[data-yt]'), function (a) {
    a.addEventListener('pointerover', warm, { once: true });
    a.addEventListener('focus', warm, { once: true });
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // new tab
      e.preventDefault();
      var id = a.getAttribute('data-yt');
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&playsinline=1';
      frame.title = a.getAttribute('data-title') || 'YouTube video';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.allowFullscreen = true;
      frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      frame.className = 'infinity-yt-frame';

      var holder = document.createElement('div');
      holder.className = 'infinity-yt is-playing';
      holder.appendChild(frame);
      a.parentNode.replaceChild(holder, a);
      frame.focus();
    });
  });
})();
