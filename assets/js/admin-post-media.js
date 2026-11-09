/**
 * "Header media" box: pick a video from the media library into a URL field.
 */
(function ($) {
  'use strict';

  $(document).on('click', '.infinity-media-pick', function (e) {
    e.preventDefault();
    var $btn = $(this);
    var target = document.getElementById($btn.data('target'));
    if (!target || !window.wp || !wp.media) return;

    var frame = wp.media({
      title: $btn.text(),
      library: { type: $btn.data('type') || 'video' },
      multiple: false,
      button: { text: $btn.text() }
    });

    frame.on('select', function () {
      var file = frame.state().get('selection').first().toJSON();
      target.value = file.url;
      $(target).trigger('change');
    });

    frame.open();
  });
})(jQuery);
