/* Holomatrix extras: Track Record cards (all text editable) + FAQ accordion (one open at a time) */
(function () {
  'use strict';
  if (!document.querySelector('link[href="/css/holo3.css"]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/holo3.css'; document.head.appendChild(l); }

  const R = window.HoloRender, e = UI.esc;

  // ['p', text] = plain, ['h', text] = highlighted (cyan, bold, royal-blue underline). Empty list = a card for later.
  const TRK = [
    ['📄', [['p', 'Published a total of'], ['h', '5 Journal Articles']]],
    ['🌍', [['h', '3+ years'], ['p', 'of R&D Consulting Experience Across Research Organisations in USA, Europe and NZ']]],
    ['✍️', [['p', 'Published'], ['h', '65+ Scientific Blogs'], ['p', 'for Clients']]],
    ['📚', [['p', 'Created'], ['h', '40+ Curated Research Libraries'], ['p', 'for Clients']]],
    ['➕', []]
  ];
  const seg = (s, i, j) => '<span' + (s[0] === 'h' ? ' class="hlu"' : '') + ' data-t="hm.trk.' + i + '.' + j + '">' + e(s[1]) + '</span>';
  const card = (c, i) => '<li class="trk-card reveal"><i class="trk-ic" aria-hidden="true">' + c[0] + '</i><div class="trk-tx">' +
    (c[1].length ? c[1].map((s, j) => seg(s, i, j)).join(' ') : '<span data-t="hm.trk.' + i + '.0" data-ph="Add a new track record point"></span>') + '</div></li>';
  const trk = () => '<aside class="trk-wrap"><div class="trk-line" aria-hidden="true"></div><div class="trk"><h2 class="trk-h" data-t="hm.trk.h">Track Record</h2><ul class="trk-list">' + TRK.map(card).join('') + '</ul></div></aside>';

  if (R && R.hero) {
    const orig = R.hero;
    R.hero = function (learn) { return orig.call(this, learn).replace(/<div class="hi-img img-slot"[^>]*>[\s\S]*?<\/div>/, trk()); };
  }

  // a link with no address yet does nothing
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
