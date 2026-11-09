/* Auto highlight + ↗ on links.
   1) Important phrases → cyan, bold, royal-blue underline (once per phrase per block). Skipped while editing.
   2) Every text link (also those that stay inside the site) gets the ↗ link style.
      Not on: "Learn more", the top menu, buttons, pills, tabs, cards, tiles, icon-only links. */
(function () {
  'use strict';
  const KEYS = ['real research', 'research integrity', 'scientific integrity', 'intellectual honesty', 'methodological rigour', 'interdisciplinary', 'independent thinkers',
    'publication support', 'manuscript development', 'literature review', 'scientific writing', 'self-reinforcing', 'cannot guarantee', 'does not guarantee', 'no single fee',
    'Staff support', 'Contact us', 'Become a client', 'Find a client', 'Offer help', '13-digit', '6-digit code', 'unique username', 'approved helpers', 'subscribers',
    'close your request', 'Privacy Policy', 'Terms of Service', 'admin team', 'Message from Founder', 'Track Record', 'peer review', 'Orbit'];
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pat = KEYS.slice().sort((a, b) => b.length - a.length).map(esc).join('|');
  const rxTest = new RegExp('(?:^|[^A-Za-z0-9])(' + pat + ')(?![A-Za-z0-9])', 'i');
  const SEL = '.faq .a, .hm-p, .hm-sub, .wd .list li, .vals p, .mv p, .who .card, .lg-p, .dom p, .legal-body, .pg-sub';
  const SKIP = 'a, .em, .hlu, .key, .ahl, button, script, style, [contenteditable="true"]';
  const NOARROW = '.hdr, .hn-card, .hn-top, .btn, .pill, .learn, .tab, .cat-tabs, .nc, .pv-tile, .card, .se, .cl-actions, .sf-soc, .socials, .xs-a, .blk-link, .ed-ui, .mx-panel, .mx-fab, .hdr-brand, .scroll-cue, .footer-word, .tb, .tb-main, .tb-sub, .modal, .toast';
  let busy = false;

  /* ---------- 1. phrases ---------- */
  function wrapBlock(block) {
    const used = new Set(), nodes = [];
    const w = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentElement && n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : (rxTest.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)) });
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(node => {
      const text = node.nodeValue, rx = new RegExp('(^|[^A-Za-z0-9])(' + pat + ')(?![A-Za-z0-9])', 'gi');
      const frag = document.createDocumentFragment(); let last = 0, m, did = false;
      while ((m = rx.exec(text))) {
        const key = m[2].toLowerCase(); if (used.has(key)) { rx.lastIndex = m.index + m[0].length; continue; }
        used.add(key); did = true;
        const start = m.index + m[1].length;
        frag.append(text.slice(last, start));
        const sp = document.createElement('span'); sp.className = 'hlu ahl'; sp.textContent = m[2]; frag.append(sp);
        last = start + m[2].length; rx.lastIndex = last;
      }
      if (did) { frag.append(text.slice(last)); node.replaceWith(frag); }
    });
  }
  function phrases(root) {
    if (document.body.classList.contains('editing')) return;
    (root || document).querySelectorAll(SEL).forEach(b => {
      const t = b.textContent;
      if (b._ahlText === t && !(b._ahlHad && !b.querySelector('.ahl'))) return;
      wrapBlock(b); b._ahlText = b.textContent; b._ahlHad = !!b.querySelector('.ahl');
    });
  }
  function unwrap() {
    document.querySelectorAll('.ahl').forEach(s => s.replaceWith(document.createTextNode(s.textContent)));
    document.querySelectorAll(SEL).forEach(b => { b.normalize(); b._ahlText = null; b._ahlHad = false; });
  }

  /* ---------- 2. ↗ on links ---------- */
  function arrows(root) {
    (root || document).querySelectorAll('main a[href], .pg a[href], .page a[href], footer a[href], .sf a[href], .faq a[href]').forEach(a => {
      if (a.classList.contains('hlink') || a.closest(NOARROW) || a.querySelector('.ico, img, svg')) return;
      if (!a.textContent.trim()) return;
      a.classList.add('hlink');
    });
  }

  function run() {
    if (busy) return; busy = true; obs.disconnect();
    try { phrases(); arrows(); } catch (e) {}
    obs.observe(document.body, { childList: true, subtree: true });
    busy = false;
  }
  let timer = 0;
  const obs = new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(run, 250); });

  new MutationObserver(() => { if (document.body.classList.contains('editing')) unwrap(); else run(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('holo:ready', run);
  run(); setTimeout(run, 1200); setTimeout(run, 3000);
})();
