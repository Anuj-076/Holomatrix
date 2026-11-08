/* Holomatrix extras: Track Record panel (highlighted points, yearly-growing experience figure) + FAQ accordion */
(function () {
  'use strict';
  if (!document.querySelector('link[href="/css/holo3.css"]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/holo3.css'; document.head.appendChild(l); }

  const R = window.HoloRender, e = UI.esc;
  /* 3+ years in 2026; it goes up by one every 1 January */
  const yrs = () => 3 + Math.max(0, new Date().getFullYear() - 2026);

  // ['p', text] = plain, ['h', text] = highlighted, ['y'] = the automatic years figure. Empty list = placeholder for later.
  const TRK = [
    [['p', 'Published a total of'], ['h', '5 Journal Articles']],
    [['y'], ['p', 'of R&D Consulting Experience Across Research Organisations in USA, Europe and NZ']],
    [['p', 'Published'], ['h', '65+ Scientific Blogs'], ['p', 'for Clients']],
    [['p', 'Created'], ['h', '40+ Curated Research Libraries'], ['p', 'for Clients']],
    []
  ];
  const li = (segs, i) => '<li>' + (segs.length
    ? segs.map((s, j) => s[0] === 'y' ? '<span class="hlu">' + yrs() + '+ years</span>' : '<span' + (s[0] === 'h' ? ' class="hlu"' : '') + ' data-t="hm.trk.' + i + '.' + j + '">' + e(s[1]) + '</span>').join(' ')
    : '<span data-t="hm.trk.' + i + '.0" data-ph="Add a new track record point"></span>') + '</li>';
  const trk = () => '<aside class="trk-wrap"><div class="trk-line" aria-hidden="true"></div><div class="trk"><h2 class="trk-h" data-t="hm.trk.h">Track Record</h2><ul class="trk-list">' + TRK.map(li).join('') + '</ul></div></aside>';

  if (R && R.hero) {
    const orig = R.hero;
    R.hero = function (learn) { return orig.call(this, learn).replace(/<div class="hi-img img-slot"[^>]*>[\s\S]*?<\/div>/, trk()); };
  }

  // the Springer Nature link does nothing until an address is added in Edit site
  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('a[data-link="owner.paper"]');
    if (a && (a.getAttribute('href') || '#') === '#') ev.preventDefault();
  });

  // opening one FAQ closes the others
  document.addEventListener('toggle', ev => {
    const d = ev.target;
    if (!d || d.tagName !== 'DETAILS' || !d.open || !d.closest('.faq')) return;
    d.closest('.faq').querySelectorAll('details[open]').forEach(o => { if (o !== d) o.removeAttribute('open'); });
  }, true);
})();
