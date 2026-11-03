/* Holomatrix site loader: applies admin edits (theme, texts, images, links, sections) on every page */
(function () {
  'use strict';

  const DEFAULT_THEME = {
    dark:  { bg: '#05070d', bg2: '#0a0f1c', text: '#eaf0ff', muted: '#8b97b5', accent: '#4de1ff', accent2: '#8b5cf6' },
    light: { bg: '#f5f7fc', bg2: '#ffffff', text: '#0c1224', muted: '#5a6685', accent: '#0891b2', accent2: '#6d3df0' },
    fontHead: 'Space Grotesk',
    fontBody: 'Inter'
  };
  const FONTS = ['Space Grotesk', 'Inter', 'Sora', 'Poppins', 'Manrope', 'Outfit', 'Playfair Display', 'Syne', 'DM Sans', 'Montserrat'];
  const BASE_FONTS = ['Space Grotesk', 'Inter'];     // already loaded by every page
  const CACHE = 'holo-content-cache';

  const Site = { DEFAULT_THEME, FONTS, content: {}, ready: null, accessReady: null, access: null };
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  Site.safeUrl = u => { u = String(u || '').trim(); return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(u) ? u : '#'; };
  const safeImg = u => /^(https:\/\/|\/)/i.test(String(u || ''));
  const isHex = v => /^#[0-9a-f]{6}$/i.test(String(v || ''));
  const fontOk = f => FONTS.indexOf(f) > -1;

  /* ---------- Theme ---------- */
  function themeCSS(t) {
    t = t || {};
    const map = { bg: '--bg', bg2: '--bg-2', text: '--text', muted: '--muted', accent: '--accent', accent2: '--accent-2' };
    const block = (sel, o) => {
      o = o || {};
      let s = '';
      Object.keys(map).forEach(k => { if (isHex(o[k])) s += map[k] + ':' + o[k] + ';'; });
      return s ? sel + '{' + s + '}' : '';
    };
    let css = block('html:root[data-theme="dark"]', t.dark) + block('html:root[data-theme="light"]', t.light);
    const fonts = [];
    let fv = '';
    if (fontOk(t.fontHead)) { fv += '--font-head:\'' + t.fontHead + '\',system-ui,sans-serif;'; if (BASE_FONTS.indexOf(t.fontHead) < 0) fonts.push(t.fontHead); }
    if (fontOk(t.fontBody)) { fv += '--font-body:\'' + t.fontBody + '\',system-ui,sans-serif;'; if (BASE_FONTS.indexOf(t.fontBody) < 0) fonts.push(t.fontBody); }
    if (fv) css += 'html:root{' + fv + '}';
    const links = fonts.filter((f, i) => fonts.indexOf(f) === i)
      .map(f => 'https://fonts.googleapis.com/css2?family=' + f.replace(/ /g, '+') + ':wght@400;500;600;700&display=swap');
    return { css, fonts: links };
  }

  Site.applyTheme = function (t) {
    const r = themeCSS(t);
    let s = document.getElementById('holo-theme');
    if (!s) { s = document.createElement('style'); s.id = 'holo-theme'; document.head.appendChild(s); }
    s.textContent = r.css;
    $$('link[data-holo-font]').forEach(l => { if (r.fonts.indexOf(l.href) < 0) l.remove(); });
    r.fonts.forEach(h => {
      if (!$$('link[data-holo-font]').some(l => l.href === h)) {
        const l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = h; l.setAttribute('data-holo-font', '');
        document.head.appendChild(l);
      }
    });
    try {
      localStorage.setItem('holo-theme-css', r.css);
      localStorage.setItem('holo-theme-fonts', JSON.stringify(r.fonts));
    } catch (e) {}
  };

  /* ---------- Texts ---------- */
  Site.applyTexts = function (map) {
    map = map || {};
    $$('[data-t]').forEach(el => {
      const k = el.dataset.t;
      if (!(k in map)) return;
      const v = map[k];
      if (v === '') { el.hidden = true; } else { el.hidden = false; el.textContent = v; }
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
        if (!img) {
          img = document.createElement('img');
          img.dataset.def = '';
          img.alt = slot.dataset.alt || '';
          img.decoding = 'async';
          slot.prepend(img);
        }
        img.src = url;
      } else if (img) {
        if (img.dataset.def) img.src = img.dataset.def; else img.remove();
      }
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

  /* ---------- Sections (order + visibility) ---------- */
  Site.applySections = function (s) {
    s = s || {};
    const order = Array.isArray(s.order) ? s.order : [];
    const hidden = Array.isArray(s.hidden) ? s.hidden : [];
    $$('[data-section]').forEach(el => {
      const n = el.dataset.section, i = order.indexOf(n);
      el.style.order = order.length ? (i >= 0 ? i : 99) : '';
      el.hidden = hidden.indexOf(n) > -1;
    });
    $$('[data-nav]').forEach(el => { el.hidden = hidden.indexOf(el.dataset.nav) > -1; });
  };

  Site.applyAll = function () {
    const c = Site.content || {};
    Site.applyTexts(c.texts);
    Site.applyImages(c.images);
    Site.applyLinks(c.links);
    Site.applySections(c.sections);
    if (c.theme) Site.applyTheme(c.theme);
  };

  Site.saveCache = function () { try { localStorage.setItem(CACHE, JSON.stringify(Site.content)); } catch (e) {} };

  /* ---------- Load from Supabase ---------- */
  function load() {
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE) || 'null'); } catch (e) {}
    if (cached) { Site.content = cached; Site.applyAll(); }

    const fresh = (async () => {
      try {
        const { data, error } = await sb.from('site_content').select('key,value');
        if (error || !data) return;
        const c = {};
        data.forEach(r => { c[r.key] = r.value; });
        Site.content = c;
        Site.saveCache();
        Site.applyAll();
      } catch (e) { /* keep defaults */ }
    })();
    return Promise.race([fresh, new Promise(r => setTimeout(r, 1800))]);
  }

  function loadEditor() {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/css/editor.css';
    document.head.appendChild(l);
    const s = document.createElement('script');
    s.src = '/js/editor.js';
    document.body.appendChild(s);
  }

  Site.ready = load();
  Site.accessReady = Auth.access().catch(() => null).then(a => {
    Site.access = a;
    if (a && a.can('edit_site_content')) loadEditor();
    return a;
  });

  window.Site = Site;
})();
