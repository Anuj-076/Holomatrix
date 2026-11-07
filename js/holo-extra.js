/* Holomatrix extras: Track Record panel (replaces the image slot) + FAQ accordion (one open at a time) */
(function () {
  'use strict';
  const R = window.HoloRender;
  if (R && R.hero) {
    const TRK = '<aside class="trk-wrap"><div class="trk-line" aria-hidden="true"></div><div class="trk"><h2 class="trk-h" data-t="hm.trk.h">Track Record</h2><ul class="trk-list">' +
      [0, 1, 2, 3, 4, 5].map(i => '<li data-t="hm.trk.' + i + '" data-ph="Track record point ' + (i + 1) + '"></li>').join('') + '</ul></div></aside>';
    const orig = R.hero;
    R.hero = function (learn) { return orig.call(this, learn).replace(/<div class="hi-img img-slot"[^>]*>[\s\S]*?<\/div>/, TRK); };
  }
  // opening one FAQ closes the others ("toggle" does not bubble, so listen in the capture phase)
  document.addEventListener('toggle', e => {
    const d = e.target;
    if (!d || d.tagName !== 'DETAILS' || !d.open || !d.closest('.faq')) return;
    d.closest('.faq').querySelectorAll('details[open]').forEach(o => { if (o !== d) o.removeAttribute('open'); });
  }, true);
})();
