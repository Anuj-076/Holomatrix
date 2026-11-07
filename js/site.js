/* Holomatrix site loader: applies admin edits (theme, texts, text styles, images, links, sections, extra items) on every page */
(function () {
  'use strict';

  const DEFAULT_THEME = {
    dark:  { bg: '#05070d', bg2: '#0a0f1c', text: '#eaf0ff', muted: '#8b97b5', accent: '#4de1ff', accent2: '#8b5cf6' },
    light: { bg: '#f5f7fc', bg2: '#ffffff', text: '#0c1224', muted: '#5a6685', accent: '#0891b2', accent2: '#6d3df0' },
    fontHead: 'Space Grotesk',
    fontBody: 'Inter'
  };
  const FONTS = ['Space Grotesk', 'Inter', 'Sora', 'Poppins', 'Manrope', 'Outfit', 'Playfair Display', 'Syne', 'DM Sans', 'Montserrat'];
  const BASE_FONTS = ['Space Grotesk', 'Inter'];
  const CACHE = 'holo-content-cache';

  const Site = { DEFAULT_THEME, FONTS, content: {}, ready: null, accessReady: null, access: null };
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  Site.safeUrl = u => { u = String(u || '').trim(); return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(u) ? u : '#'; };
  const safeImg = u => /^(https:\/\/|\/)/i.test(String(u || ''));
  const isHex = v => /^#[0-9a-f]{6}$/i.test(String(v || ''));
  const fontOk = f => FONTS.indexOf(f) > -1;
  const esc = s => (window.UI ? UI.esc(s) : String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));

  /* ---------- Theme ---------- */
  function themeCSS(t) {
    t = t || {};
    const map = { bg: '--bg', bg2: '--bg-2', text: '--text', muted: '--muted', accent: '--accent', accent2: '--accent-2' };
    const block = (sel, o) => { o = o || {}; let s = ''; Object.keys(map).forEach(k => { if (isHex(o[k])) s += map[k] + ':' + o[k] + ';'; }); return s ? sel + '{' + s + '}' : ''; };
    let css = block('html:root[data-theme="dark"]', t.dark) + block('html:root[data-theme="light"]', t.light);
    const fonts = []; let fv = '';
    if (fontOk(t.fontHead)) { fv += '--font-head:\'' + t.fontHead + '\',system-ui,sans-serif;'; if (BASE_FONTS.indexOf(t.fontHead) < 0) fonts.push(t.fontHead); }
    if (fontOk(t.fontBody)) { fv += '--font-body:\'' + t.fontBody + '\',system-ui,sans-serif;'; if (BASE_FONTS.indexOf(t.fontBody) < 0) fonts.push(t.fontBody); }
    if (fv) css += 'html:root{' + fv + '}';
    const links = fonts.filter((f, i) => fonts.indexOf(f) === i).map(f => 'https://fonts.googleapis.com/css2?family=' + f.replace(/ /g, '+') + ':wght@400;500;600;700&display=swap');
    return { css, fonts: links };
  }
  Site.applyTheme = function (t) {
    const r = themeCSS(t);
    let s = document.getElementById('holo-theme');
    if (!s) { s = document.createElement('style'); s.id = 'holo-theme'; document.head.appendChild(s); }
    s.textContent = r.css;
    $$('link[data-holo-font]').forEach(l => { if (r.fonts.indexOf(l.href) < 0) l.remove(); });
    r.fonts.forEach(h => {
      if (!$$('link[data-holo-font]').some(l => l.href === h)) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; l.setAttribute('data-holo-font', ''); document.head.appendChild(l); }
    });
    try { localStorage.setItem('holo-theme-css', r.css); localStorage.setItem('holo-theme-fonts', JSON.stringify(r.fonts)); } catch (e) {}
  };

  /* ---------- Texts ---------- */
  Site.applyTexts = function (map) {
    map = map || {};
    $$('[data-t]').forEach(el => {
      const k = el.dataset.t; if (!(k in map)) return;
      const v = map[k];
      if (v === '') { el.hidden = true; } else { el.hidden = false; el.textContent = v; }
    });
  };

  /* ---------- Text style: colour, size, bold, underline (royal blue) ---------- */
  Site.applyStyles = function (map) {
    map = map || {};
    $$('[data-t]').forEach(el => {
      const s = map[el.dataset.t] || null, n = s ? +s.size : 0;
      el.style.color = (s && isHex(s.color)) ? s.color : '';
      el.style.fontSize = (n >= 10 && n <= 160) ? n + 'px' : '';
      el.style.fontWeight = (s && s.bold) ? '700' : '';
      if (s && s.ul) { el.style.textDecoration = 'underline'; el.style.textDecorationColor = 'var(--ul, #4169e1)'; el.style.textDecorationThickness = '2px'; el.style.textUnderlineOffset = '5px'; }
      else { el.style.textDecoration = ''; el.style.textDecorationColor = ''; el.style.textDecorationThickness = ''; el.style.textUnderlineOffset = ''; }
    });
  };

  /* ---------- Images ---------- */
  Site.applyImages = function (map) {
    map = map || {};
    $$('.img-slot').forEach(slot => {
      const url = map[slot.dataset.img];
      let img = slot.querySelector(':scope > img');
      if (img && img.dataset.def === undefined) img.dataset.def = img.getAttribute('src') || '';
      if (url && safeImg(url)) {
        if (!img) { img = document.createElement('img'); img.dataset.def = ''; img.alt = slot.dataset.alt || ''; img.decoding = 'async'; slot.prepend(img); }
        img.src = url;
      } else if (img) { if (img.dataset.def) img.src = img.dataset.def; else img.remove(); }
      slot.classList.toggle('has-img', !!slot.querySelector(':scope > img'));
    });
  };

  /* ---------- Links ---------- */
  Site.applyLinks = function (map) {
    map = map || {};
    $$('a[data-link]').forEach(a => {
      if (!a.dataset.defHref) a.dataset.defHref = a.getAttribute('href') || '#';
      const v = map[a.dataset.link];
      a.setAttribute('href', v ? Site.safeUrl(v) : a.dataset.defHref);
    });
  };

  /* ---------- Sections ---------- */
  Site.applySections = function (s) {
    s = s || {};
    const order = Array.isArray(s.order) ? s.order : [], hidden = Array.isArray(s.hidden) ? s.hidden : [];
    $$('[data-section]').forEach(el => {
      const n = el.dataset.section, i = order.indexOf(n);
      el.style.order = order.length ? (i >= 0 ? i : 99) : '';
      el.hidden = hidden.indexOf(n) > -1;
    });
    $$('[data-nav]').forEach(el => { el.hidden = hidden.indexOf(el.dataset.nav) > -1; });
  };

  /* ---------- Extra items (text / image placeholders, social link blocks) with their own sizes ---------- */
  Site.pageKey = () => (location.pathname.split('/').filter(Boolean)[0] || 'home');
  const XCSS = '.xtra{padding:40px 0;position:relative;z-index:2}body[data-hdr="over"] .xtra{background:var(--bg-2)}.xtra .wide{display:grid;gap:34px}.xt,.xs,.xi{position:relative;max-width:900px;width:100%}.xh{font-size:clamp(1.6rem,3.4vw,2.6rem);letter-spacing:-.03em;margin-bottom:10px}.xp{color:var(--muted);white-space:pre-wrap;line-height:1.8}.xim{aspect-ratio:16/9;border-radius:22px;border:1px solid var(--border);background:var(--surface-2);display:grid;place-items:center;color:var(--muted)}.xi figcaption{margin-top:10px;color:var(--muted);font-size:.92rem;text-align:center}.xs-row{display:flex;flex-wrap:wrap;gap:10px}.xs-a{display:inline-flex;align-items:center;gap:10px;padding:10px 18px;border:1px solid var(--border);border-radius:999px;background:var(--surface);transition:transform .25s,border-color .25s;font-size:max(.85rem,calc(var(--xs,20px)*.7))}a.xs-a:hover{transform:translateY(-3px);border-color:var(--accent)}.xs-a.ph{opacity:.5;border-style:dashed}.xs-a .ico{width:var(--xs,20px);height:var(--xs,20px);display:inline-block}.xs-a .ico svg{width:100%;height:100%;display:block;border-radius:5px}.xrm{position:absolute;top:-6px;right:0;z-index:6;padding:6px 12px;border-radius:999px;background:var(--bg-2);border:1px solid var(--danger);color:var(--danger);font-size:.78rem;font-weight:600}';
  const xvis = (x, c) => {
    const t = c.texts || {}, im = c.images || {};
    return x.type === 'text' ? !!(t['x.' + x.id + '.h'] || t['x.' + x.id + '.p']) : x.type === 'image' ? !!im['x.' + x.id + '.img'] : (x.items || []).some(i => i && i.url);
  };
  const xbox = x => (+x.w >= 30 && +x.w <= 100 ? 'width:' + (+x.w) + '%;' : '') + (x.al === 'center' ? 'margin-inline:auto;' : x.al === 'right' ? 'margin-left:auto;' : '');
  function xhtml(x, editing) {
    const id = esc(x.id), rm = editing ? '<button type="button" class="ed-ui xrm" data-xrm="' + id + '">🗑 Remove</button>' : '';
    if (x.type === 'text') return '<div class="xt" data-xid="' + id + '" style="' + xbox(x) + '">' + rm + '<h3 class="xh" data-t="x.' + id + '.h" data-ph="Heading">Heading</h3><div class="xp" data-t="x.' + id + '.p" data-multiline>Write your text here…</div></div>';
    if (x.type === 'image') return '<figure class="xi" data-xid="' + id + '" style="' + xbox(x) + '">' + rm + '<div class="xim img-slot" data-img="x.' + id + '.img" style="' + (+x.h > 0 ? 'height:' + (+x.h) + 'px;aspect-ratio:auto;' : '') + '"><span>📷 Click to add an image</span></div><figcaption data-t="x.' + id + '.cap" data-ph="Caption (optional)"></figcaption></figure>';
    const items = (x.items || []).filter(i => i && (i.url || editing)).map(i => {
      const ic = window.HoloIcons ? '<span class="ico">' + HoloIcons.svg(HoloIcons.forItem(i)) + '</span>' : '';
      const lab = esc(i.label || (window.HoloIcons ? HoloIcons.label(HoloIcons.forItem(i)) : 'Link'));
      return i.url ? '<a class="xs-a" href="' + esc(Site.safeUrl(i.url)) + '" target="_blank" rel="noopener noreferrer">' + ic + '<span>' + lab + '</span></a>' : '<span class="xs-a ph">' + ic + '<span>' + lab + '</span></span>';
    }).join('');
    const just = x.al === 'center' ? 'center' : x.al === 'right' ? 'flex-end' : 'flex-start';
    return '<div class="xs" data-xid="' + id + '" style="' + xbox(x) + '--xs:' + (+x.s >= 14 && +x.s <= 48 ? +x.s : 20) + 'px">' + rm + '<h3 class="xh" data-t="x.' + id + '.h" data-ph="Heading (optional)"></h3><div class="xs-row" style="justify-content:' + just + '">' + items + '</div></div>';
  }
  Site.renderExtras = function (all, c) {
    c = c || Site.content || {};
    const list = ((all || c.extras || {})[Site.pageKey()]) || [], main = document.querySelector('main');
    if (!main) return;
    const editing = document.body.classList.contains('editing');
    const shown = list.filter(x => editing || xvis(x, c));
    const sig = JSON.stringify([shown, editing]);
    let wrap = document.getElementById('xtra-wrap');
    if (wrap && wrap.dataset.sig === sig) return;
    if (wrap) wrap.remove();
    if (!shown.length) return;
    if (!document.getElementById('xtra-css')) { const s = document.createElement('style'); s.id = 'xtra-css'; s.textContent = XCSS; document.head.appendChild(s); }
    wrap = document.createElement('section'); wrap.id = 'xtra-wrap'; wrap.className = 'xtra'; wrap.dataset.sig = sig;
    wrap.innerHTML = '<div class="wide">' + shown.map(x => xhtml(x, editing)).join('') + '</div>';
    main.appendChild(wrap);
  };

  Site.applyAll = function (o) {
    const c = Object.assign({}, Site.content || {}, o || {});
    Site.renderExtras(c.extras, c);
    Site.applyTexts(c.texts);
    Site.applyImages(c.images);
    Site.applyLinks(c.links);
    Site.applySections(c.sections);
    Site.applyStyles(c.styles);
    if (c.theme) Site.applyTheme(c.theme);
  };

  Site.saveCache = function () { try { localStorage.setItem(CACHE, JSON.stringify(Site.content)); } catch (e) {} };

  function load() {
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE) || 'null'); } catch (e) {}
    if (cached) { Site.content = cached; Site.applyAll(); }
    const fresh = (async () => {
      try {
        const { data, error } = await sb.from('site_content').select('key,value');
        if (error || !data) return;
        const c = {}; data.forEach(r => { c[r.key] = r.value; });
        Site.content = c; Site.saveCache(); Site.applyAll();
      } catch (e) { /* keep defaults */ }
    })();
    return Promise.race([fresh, new Promise(r => setTimeout(r, 1800))]);
  }

  function loadEditor() {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/editor.css'; document.head.appendChild(l);
    const s = document.createElement('script'); s.src = '/js/editor.js'; document.body.appendChild(s);
  }

  Site.ready = load();
  Site.accessReady = Auth.access().catch(() => null).then(a => {
    Site.access = a;
    if (a && a.can('edit_site_content')) loadEditor();
    return a;
  });

  window.Site = Site;
})();
