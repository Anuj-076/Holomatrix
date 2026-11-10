/* Holomatrix extras: Track Record cards, Founder message (home page only), bottom buttons, FAQ accordion */
(function () {
  'use strict';
  if (!document.querySelector('link[href="/css/holo3.css"]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/holo3.css'; document.head.appendChild(l); }

  const R = window.HoloRender, e = UI.esc;

  /* ---------- Track Record (the 5th point comes later) ---------- */
  const TRK = [
    ['📄', [['p', 'Published a total of'], ['h', '5 Journal Articles']]],
    ['🌍', [['h', '3+ years'], ['p', 'of R&D Consulting Experience Across Research Organisations in USA, Europe and NZ']]],
    ['✍️', [['p', 'Published'], ['h', '65+ Scientific Blogs'], ['p', 'for Clients']]],
    ['📚', [['p', 'Created'], ['h', '40+ Curated Research Libraries'], ['p', 'for Clients']]]
  ];
  const seg = (s, i, j) => '<span' + (s[0] === 'h' ? ' class="hlu"' : '') + ' data-t="hm.trk.' + i + '.' + j + '">' + e(s[1]) + '</span>';
  const card = (c, i) => '<li class="trk-card reveal"><i class="trk-ic" aria-hidden="true">' + c[0] + '</i><div class="trk-tx">' + c[1].map((s, j) => seg(s, i, j)).join(' ') + '</div></li>';
  const trk = () => '<aside class="trk-wrap"><div class="trk-line" aria-hidden="true"></div><div class="trk"><h2 class="trk-h" data-t="hm.trk.h">Track Record</h2><ul class="trk-list">' + TRK.map(card).join('') + '</ul></div></aside>';

  if (R && R.hero) {
    const orig = R.hero;
    R.hero = function (learn) { return orig.call(this, learn).replace(/<div class="hi-img img-slot"[^>]*>[\s\S]*?<\/div>/, trk()); };
  }

  /* ---------- Message from Founder (home page card) ----------
     p = plain, b = bold + royal-blue underline, c = cyan, bc = both. A third value 1 means: no space before it. */
  const FM = [
    [['p', 'Every great discovery begins with'], ['b', 'a question'], ['p', ',', 1], ['b', 'a moment of curiosity'], ['p', ', or', 1], ['b', 'the courage to challenge what we think we know'], ['p', '.', 1]],
    [['bc', 'That spirit is what inspired me to build Holomatrix.']],
    [['p', 'I envision'], ['c', 'Holomatrix'], ['p', 'as more than an organisation. I want it to become'], ['b', 'a thriving ecosystem'], ['p', 'that brings curious minds together to'], ['b', 'learn, explore ideas, conduct research'], ['p', 'and'], ['b', 'turn knowledge into meaningful contributions'], ['p', '.', 1]],
    [['p', 'Whether you are a student taking your first steps into research, an independent researcher pursuing an unconventional question, or an organisation looking for new perspectives, there will be a place'], ['b', 'for you here'], ['p', '.', 1]],
    [['p', 'We believe in'], ['b', 'asking better questions'], ['p', ',', 1], ['b', 'thinking independently'], ['p', ',', 1], ['b', 'embracing scientific integrity'], ['p', 'and'], ['b', 'keeping the pursuit of knowledge'], ['b', 'open to everyone'], ['p', '. We are at the beginning of this journey, and there is much to explore, discover and build.', 1]],
    [['p', "I invite you to be part of it. Let's learn, question, discover and push the boundaries of what we know — together."]],
    [['p', 'If this vision resonates with you, your support would be invaluable in helping us build and sustain this ecosystem. Every contribution brings us one step closer to making this vision a reality.']]
  ];
  const CL = { p: '', b: 'fb', c: 'fc', bc: 'fb fc' };
  const fmHtml = () => FM.map((P, i) => '<p>' + P.map((s, j) => (j && !s[2] ? ' ' : '') + '<span' + (CL[s[0]] ? ' class="' + CL[s[0]] + '"' : '') + ' data-t="fd.m.' + i + '.' + j + '">' + e(s[1]) + '</span>').join('') + '</p>').join('') +
    '<a class="btn btn-primary fd-cta" href="/contribute/donate"><span data-t="fd.m.cta">Contribute</span></a><p class="fd-sig" data-t="fd.m.sig">— Amal Pushp</p>';

  const home = document.getElementById('fd-msg-body');
  if (home) { home.innerHTML = fmHtml(); if (window.Site && Site.applyAll) Site.applyAll(); }

  /* ---------- the three buttons at the bottom ---------- */
  if (R && R.future) {
    const of = R.future;
    R.future = function () {
      return of.apply(this, arguments)
        .replace('href="/research/all"', 'href="/contact/jobs"')                                                                       // Explore Opportunities → Jobs
        .replace(/href="\/contact\/staff-support"><span data-t="hm.cta1"/, 'href="#" data-nolink="1"><span data-t="hm.cta1"');       // Collaborate with Us → nowhere (for now)
    };
  }
  document.addEventListener('click', ev => { const a = ev.target.closest && ev.target.closest('a[data-nolink]'); if (a) ev.preventDefault(); });

  /* a link with no address yet does nothing */
  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('a[data-link="owner.paper"]');
    if (a && (a.getAttribute('href') || '#') === '#') ev.preventDefault();
  });

  /* ---------- opening one FAQ closes the others ---------- */
  document.addEventListener('toggle', ev => {
    const d = ev.target;
    if (!d || d.tagName !== 'DETAILS' || !d.open || !d.closest('.faq')) return;
    d.closest('.faq').querySelectorAll('details[open]').forEach(o => { if (o !== d) o.removeAttribute('open'); });
  }, true);
})();
