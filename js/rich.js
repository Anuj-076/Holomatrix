/* Holomatrix rich articles: safe text, page blocks → HTML, Contents box, reading time, LaTeX maths (KaTeX), symbol codes.
   Block types: h (heading), p (text), img (image), q (quote), list, eq (equation), note (box), hr (divider). */
(function () {
  'use strict';
  if (window.HoloRich) return;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hex = v => /^#[0-9a-f]{6}$/i.test(String(v || ''));
  const safeUrl = u => { u = String(u || '').trim(); return /^(https?:\/\/|\/|#|mailto:)/i.test(u) ? u : ''; };
  const imgUrl = u => /^(https:\/\/|\/)/i.test(String(u || '')) ? String(u) : '';
  const toHex = c => {
    c = String(c || '').trim(); if (hex(c)) return c.toLowerCase();
    const m = c.match(/^rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)/);
    return m ? '#' + [m[1], m[2], m[3]].map(x => Math.min(255, +x).toString(16).padStart(2, '0')).join('') : '';
  };

  /* ---------- Safe rich text (only these tags survive) ---------- */
  const SKIP = { SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, TEMPLATE: 1, NOSCRIPT: 1, SVG: 1, MATH: 1, FORM: 1, INPUT: 1, BUTTON: 1, TEXTAREA: 1, SELECT: 1 };
  const SIZES = { 'fs-sm': 1, 'fs-lg': 1, 'fs-xl': 1 };
  function walk(src, out) {
    src.childNodes.forEach(n => {
      if (n.nodeType === 3) { out.appendChild(document.createTextNode(n.nodeValue)); return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName;
      if (SKIP[tag]) return;
      if (tag === 'BR') { out.appendChild(document.createElement('br')); return; }
      let el = null;
      if (tag === 'B' || tag === 'STRONG') el = document.createElement('strong');
      else if (tag === 'I' || tag === 'EM') el = document.createElement('em');
      else if (tag === 'U') el = document.createElement('u');
      else if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') el = document.createElement('s');
      else if (tag === 'SUP' || tag === 'SUB' || tag === 'CODE') el = document.createElement(tag.toLowerCase());
      else if (tag === 'MARK') { el = document.createElement('mark'); const bg = toHex(n.style && n.style.backgroundColor); if (bg) el.style.backgroundColor = bg; }
      else if (tag === 'A') {
        const u = safeUrl(n.getAttribute('href'));
        if (u) { el = document.createElement('a'); el.setAttribute('href', u); if (/^https?:\/\//i.test(u) && u.indexOf(location.origin) !== 0) { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); } }
      } else if (tag === 'SPAN' || tag === 'FONT') {
        const col = toHex(tag === 'FONT' ? n.getAttribute('color') : (n.style && n.style.color)), bg = toHex(n.style && n.style.backgroundColor);
        const cls = String(n.className || '').split(/\s+/).filter(c => SIZES[c]);
        if (col || bg || cls.length) { el = document.createElement('span'); if (col) el.style.color = col; if (bg) el.style.backgroundColor = bg; if (cls.length) el.className = cls[0]; }
      }
      if (el) { walk(n, el); out.appendChild(el); }
      else {
        const before = out.childNodes.length; walk(n, out);
        if ((tag === 'DIV' || tag === 'P' || tag === 'LI') && out.childNodes.length > before && n.nextSibling) out.appendChild(document.createElement('br'));
      }
    });
  }
  function sanitize(html) {
    const t = document.createElement('template'); t.innerHTML = String(html || '');
    const out = document.createElement('div'); walk(t.content, out); return out.innerHTML;
  }
  const textOf = html => { const d = document.createElement('div'); d.innerHTML = sanitize(html); return d.textContent || ''; };

  /* ---------- Blocks → text, reading time ---------- */
  function plain(blocks) {
    return (Array.isArray(blocks) ? blocks : []).map(b => {
      if (!b) return '';
      if (b.t === 'h') return String(b.x || '');
      if (b.t === 'p' || b.t === 'note') return textOf(b.x);
      if (b.t === 'q') return textOf(b.x) + (b.by ? ' — ' + b.by : '');
      if (b.t === 'list') return (b.i || []).map(textOf).join('\n');
      if (b.t === 'img') return String(b.c || '');
      return '';
    }).filter(Boolean).join('\n\n');
  }
  const readMin = blocks => Math.max(1, Math.ceil(plain(blocks).split(/\s+/).filter(Boolean).length / 200));

  /* ---------- Blocks → HTML ---------- */
  function render(blocks) {
    const toc = []; let n = 0;
    const html = (Array.isArray(blocks) ? blocks : []).map(b => {
      if (!b) return '';
      const al = ['center', 'right', 'justify'].indexOf(b.al) > -1 ? ' al-' + b.al : '';
      switch (b.t) {
        case 'h': {
          const x = String(b.x || '').trim(); if (!x) return '';
          const l = +b.l === 3 ? 3 : 2, id = 'sec-' + (++n); toc.push({ id, l, x });
          return '<h' + l + ' class="ar-h" id="' + id + '">' + esc(x) + '</h' + l + '>';
        }
        case 'p': return '<p class="ar-p' + al + '">' + sanitize(b.x) + '</p>';
        case 'img': {
          const u = imgUrl(b.u); if (!u) return '';
          const w = Math.min(100, Math.max(20, +b.w || 100)), a = ['left', 'right'].indexOf(b.al) > -1 ? b.al : 'center';
          return '<figure class="ar-fig fa-' + a + '" style="--w:' + w + '%"><img src="' + esc(u) + '" alt="' + esc(b.a || b.c || '') + '" loading="lazy">' + (b.c ? '<figcaption>' + esc(b.c) + '</figcaption>' : '') + '</figure>';
        }
        case 'q': {
          if (!textOf(b.x).trim()) return '';
          return '<blockquote class="ar-q"><div class="ar-q-t">' + sanitize(b.x) + '</div>' + (b.by ? '<footer class="ar-q-by">— <cite>' + esc(b.by) + '</cite>' + (b.src ? '<span>' + esc(b.src) + '</span>' : '') + '</footer>' : '') + '</blockquote>';
        }
        case 'list': {
          const items = (b.i || []).filter(x => textOf(x).trim()); if (!items.length) return '';
          const tag = b.o ? 'ol' : 'ul';
          return '<' + tag + ' class="ar-list">' + items.map(x => '<li>' + sanitize(x) + '</li>').join('') + '</' + tag + '>';
        }
        case 'eq': {
          if (!String(b.x || '').trim()) return '';
          return '<div class="ar-eq"><div class="ar-eq-m" data-tex="' + esc(b.x) + '"></div>' + (b.n ? '<span class="ar-eq-n">' + esc(b.n) + '</span>' : '') + '</div>';
        }
        case 'note': {
          const k = ['warn', 'tip'].indexOf(b.k) > -1 ? b.k : 'info';
          return '<aside class="ar-note k-' + k + '">' + (b.h ? '<b>' + esc(b.h) + '</b>' : '') + '<div>' + sanitize(b.x) + '</div></aside>';
        }
        case 'hr': return '<hr class="ar-hr">';
      }
      return '';
    }).join('');
    return { html, toc, tocHtml: tocHtml(toc) };
  }
  function tocHtml(toc) {
    if (!toc || toc.length < 3) return '';
    let a = 0, b = 0;
    return '<details class="ar-toc" open><summary><span>📖 Contents</span></summary><ol>' + toc.map(t => {
      let num; if (t.l === 2) { a++; b = 0; num = String(a); } else { b++; num = (a || 1) + '.' + b; }
      return '<li class="l' + t.l + '"><a href="#' + t.id + '"><i>' + num + '</i><span>' + esc(t.x) + '</span></a></li>';
    }).join('') + '</ol></details>';
  }

  /* ---------- LaTeX maths with KaTeX (loaded only when a page needs it) ---------- */
  let kp = null;
  function katexReady() {
    if (window.katex && window.renderMathInElement) return Promise.resolve();
    if (kp) return kp;
    kp = new Promise((res, rej) => {
      const B = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/';
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = B + 'katex.min.css'; document.head.appendChild(l);
      const load = (src, cb) => { const s = document.createElement('script'); s.src = src; s.onload = cb; s.onerror = () => rej(new Error('KaTeX did not load')); document.head.appendChild(s); };
      load(B + 'katex.min.js', () => load(B + 'contrib/auto-render.min.js', res));
    });
    return kp;
  }
  const ESC = '\uE000';
  function swap(root, from, to) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentElement && n.parentElement.closest('code,pre,.katex')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT }), list = [];
    while (w.nextNode()) if (w.currentNode.nodeValue.indexOf(from) > -1) list.push(w.currentNode);
    list.forEach(n => { n.nodeValue = n.nodeValue.split(from).join(to); });
  }
  function math(root) {
    root = root || document.body;
    if (!(root.querySelector('[data-tex]') || /\$|\\\(|\\\[/.test(root.textContent || ''))) return Promise.resolve();
    return katexReady().then(() => {
      swap(root, '\\$', ESC);                                   // \$ stays a normal dollar sign
      root.querySelectorAll('[data-tex]').forEach(el => { try { window.katex.render(el.getAttribute('data-tex'), el, { displayMode: el.getAttribute('data-mode') !== 'inline', throwOnError: false }); } catch (e) {} });
      window.renderMathInElement(root, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\[', right: '\\]', display: true }, { left: '$', right: '$', display: false }, { left: '\\(', right: '\\)', display: false }], throwOnError: false });
      swap(root, ESC, '$');
    }).catch(() => {});
  }

  /* ---------- Symbol codes (LaTeX: the standard used by arXiv, Overleaf, Wikipedia, KaTeX, MathJax) ---------- */
  const g = s => s.split(' ').map(n => ['\\' + n, n]);
  const SYM = [
    ['Small Greek letters', g('alpha beta gamma delta epsilon varepsilon zeta eta theta vartheta iota kappa lambda mu nu xi pi rho sigma tau upsilon phi varphi chi psi omega')],
    ['Capital Greek letters', g('Gamma Delta Theta Lambda Xi Pi Sigma Upsilon Phi Psi Omega')],
    ['Operators', [['\\pm', 'plus-minus'], ['\\mp', 'minus-plus'], ['\\times', 'times'], ['\\div', 'divide'], ['\\cdot', 'dot'], ['\\circ', 'circle'], ['\\oplus', 'direct sum'], ['\\otimes', 'tensor product'], ['\\sqrt{x}', 'square root'], ['\\sqrt[3]{x}', 'cube root'], ['\\sum_{i=1}^{n}', 'sum'], ['\\prod_{i=1}^{n}', 'product'], ['\\int_{a}^{b}', 'integral'], ['\\oint', 'closed integral'], ['\\partial', 'partial'], ['\\nabla', 'nabla'], ['\\infty', 'infinity'], ['\\hbar', 'h-bar'], ['\\ell', 'script l'], ['\\lim_{x \\to 0}', 'limit']]],
    ['Relations and logic', [['\\neq', 'not equal'], ['\\approx', 'approximately'], ['\\sim', 'similar'], ['\\simeq', 'similar or equal'], ['\\equiv', 'identical'], ['\\propto', 'proportional'], ['\\leq', 'less or equal'], ['\\geq', 'greater or equal'], ['\\ll', 'much less'], ['\\gg', 'much greater'], ['\\in', 'element of'], ['\\notin', 'not element'], ['\\subset', 'subset'], ['\\subseteq', 'subset or equal'], ['\\cup', 'union'], ['\\cap', 'intersection'], ['\\forall', 'for all'], ['\\exists', 'exists'], ['\\therefore', 'therefore'], ['\\because', 'because']]],
    ['Arrows', [['\\rightarrow', 'right'], ['\\leftarrow', 'left'], ['\\leftrightarrow', 'both ways'], ['\\Rightarrow', 'implies'], ['\\Leftarrow', 'implied by'], ['\\Leftrightarrow', 'if and only if'], ['\\mapsto', 'maps to'], ['\\uparrow', 'up'], ['\\downarrow', 'down']]],
    ['Powers, fractions, accents', [['x^{2}', 'power'], ['x_{i}', 'subscript'], ['x_{i}^{2}', 'both'], ['\\frac{a}{b}', 'fraction'], ['\\dfrac{a}{b}', 'big fraction'], ['\\binom{n}{k}', 'binomial'], ['\\left( \\frac{a}{b} \\right)', 'auto-size brackets'], ['\\overline{x}', 'overline'], ['\\vec{v}', 'vector arrow'], ['\\hat{n}', 'hat'], ['\\bar{x}', 'bar'], ['\\dot{x}', 'dot (time derivative)'], ['\\ddot{x}', 'double dot'], ['\\tilde{x}', 'tilde'], ['\\text{words}', 'normal words'], ['\\mathrm{d}x', 'upright d'], ['\\mathbf{F}', 'bold'], ['\\mathcal{L}', 'calligraphic'], ['\\mathbb{R}', 'blackboard bold']]],
    ['Physics examples', [['E = mc^{2}', 'mass-energy'], ['i\\hbar \\frac{\\partial \\psi}{\\partial t} = \\hat{H}\\psi', 'Schrödinger'], ['\\Delta x \\, \\Delta p \\geq \\frac{\\hbar}{2}', 'uncertainty'], ['\\langle \\psi | \\phi \\rangle', 'bra-ket'], ['| \\psi \\rangle', 'ket'], ['\\hat{a}^{\\dagger}', 'creation operator'], ['\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}', 'Faraday'], ['\\oint \\mathbf{E} \\cdot d\\mathbf{A}', 'flux'], ['F = G \\frac{m_1 m_2}{r^2}', 'gravity'], ['v = H_0 d', 'Hubble'], ['^{\\circ}', 'degree'], ['\\text{\\AA}', 'angstrom']]],
    ['Big layouts', [['\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', 'matrix'], ['\\begin{cases} x & x > 0 \\\\ 0 & x \\leq 0 \\end{cases}', 'cases'], ['\\begin{aligned} a &= b + c \\\\ d &= e \\end{aligned}', 'aligned lines']]],
    ['Spacing and extras', [['a \\, b', 'thin space'], ['a \\quad b', 'wide space'], ['\\ldots', 'dots'], ['\\cdots', 'centred dots'], ['\\vdots', 'vertical dots'], ['\\angle', 'angle'], ['\\perp', 'perpendicular'], ['\\parallel', 'parallel'], ['\\%', 'percent sign'], ['\\$', 'dollar sign (in maths)'], ['\\{ \\}', 'curly brackets']]]
  ];
  const helpHtml = () => '<div class="sym-help"><b>How to write maths</b><ul>' +
    '<li>Inside a sentence, put the code between single dollar signs: <code>$E = mc^{2}$</code></li>' +
    '<li>For a big centred equation use the <b>Equation</b> block (no dollar signs needed), or write <code>$$ … $$</code></li>' +
    '<li>To show a real dollar sign in normal text, type <code>\\$</code></li>' +
    '<li>Codes start with a backslash. Group things with braces: <code>x^{10}</code> (not <code>x^10</code>). Click any code below to copy it.</li></ul></div>';
  const symbolsHtml = () => SYM.map(gr => '<section class="sym-g"><h5>' + esc(gr[0]) + '</h5><div class="sym-grid">' +
    gr[1].map(s => '<button type="button" class="sym-i" data-copy="' + esc(s[0]) + '" data-s="' + esc((s[0] + ' ' + s[1]).toLowerCase()) + '"><span class="sym" data-tex="' + esc(s[0]) + '" data-mode="inline"></span><code>' + esc(s[0]) + '</code><small>' + esc(s[1]) + '</small></button>').join('') + '</div></section>').join('');

  /* wires copy-on-click and search inside any element that holds symbolsHtml() */
  function symbolsWire(el, onInsert) {
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-copy]'); if (!b) return;
      const c = b.getAttribute('data-copy');
      if (navigator.clipboard) navigator.clipboard.writeText(c).catch(() => {});
      UI.toast('Copied: ' + c, 'success', 1800);
      if (onInsert) onInsert(c);
    });
    const q = el.querySelector('.sym-q');
    if (q) q.addEventListener('input', () => {
      const t = q.value.trim().toLowerCase();
      el.querySelectorAll('.sym-i').forEach(i => { i.hidden = !!t && i.getAttribute('data-s').indexOf(t) < 0; });
      el.querySelectorAll('.sym-g').forEach(s => { s.hidden = !s.querySelector('.sym-i:not([hidden])'); });
    });
    return math(el);
  }
  function symbolsDialog(onInsert) {
    const H = window.HoloAdmin; if (!H || !H.dialog) return;
    const d = H.dialog('Symbol codes', helpHtml() + '<input class="input sym-q" placeholder="Search a symbol, e.g. alpha, integral, vector…"><div class="sym-all">' + symbolsHtml() + '</div>', { wide: true });
    symbolsWire(d.el, onInsert);
    return d;
  }

  window.HoloRich = { esc, sanitize, textOf, plain, readMin, render, tocHtml, math, mount: math, symbols: SYM, helpHtml, symbolsHtml, symbolsWire, symbolsDialog };
})();
