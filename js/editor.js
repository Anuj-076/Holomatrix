/* Holomatrix on-site editor: texts (colour + size), images, colours, fonts, links, sections and extra items */
(function () {
  'use strict';
  const Site = window.Site, UI = window.UI;
  if (!Site || !UI || document.getElementById('ed-dock')) return;

  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = UI.esc, clone = o => JSON.parse(JSON.stringify(o || {}));
  const isHex = v => /^#[0-9a-f]{6}$/i.test(String(v || ''));
  const st = { on: false, dirty: false, texts: {}, images: {}, links: {}, styles: {}, theme: null, themeTouched: false, sections: null, sectionsTouched: false, extras: null, extrasTouched: false, mode: 'dark' };
  let dock, drawer, fileInput, pendingKey = null, tb, curEl = null;
  const pk = () => Site.pageKey();
  const touch = () => { st.dirty = true; };

  function theme() {
    if (!st.theme) { const t = Site.content.theme || {}; st.theme = { dark: Object.assign({}, t.dark), light: Object.assign({}, t.light), fontHead: t.fontHead || '', fontBody: t.fontBody || '' }; }
    return st.theme;
  }
  function secState() {
    if (!st.sections) {
      const s = Site.content.sections || {}, names = $$('[data-section]').map(e => e.dataset.section);
      let order = names;
      if (Array.isArray(s.order) && s.order.length) order = s.order.filter(n => names.indexOf(n) > -1).concat(names.filter(n => s.order.indexOf(n) < 0));
      st.sections = { order, hidden: (s.hidden || []).slice() };
    }
    return st.sections;
  }
  const mStyles = () => Object.assign({}, Site.content.styles, st.styles);
  const exAll = () => st.extras || (st.extras = clone(Site.content.extras));
  const exList = () => exAll()[pk()] || (exAll()[pk()] = []);
  const ov = () => ({
    texts: Object.assign({}, Site.content.texts, st.texts), images: Object.assign({}, Site.content.images, st.images),
    links: Object.assign({}, Site.content.links, st.links), styles: mStyles(), extras: st.extras || Site.content.extras,
    theme: st.themeTouched ? st.theme : Site.content.theme, sections: st.sectionsTouched ? st.sections : Site.content.sections
  });

  function arm() {
    if (!st.on) return;
    $$('[data-t]').forEach(el => { el.hidden = false; el.contentEditable = 'true'; el.spellcheck = false; if (!el.dataset.ph) el.dataset.ph = el.dataset.t; });
    $$('.img-slot').forEach(addImgBtn);
  }
  const refresh = () => { Site.applyAll(ov()); arm(); };

  /* ---------- Dock ---------- */
  function buildDock() {
    dock = document.createElement('div'); dock.id = 'ed-dock'; dock.className = 'ed-ui ed-dock';
    dock.innerHTML = '<button class="ed-pill" data-a="start">✏️ Edit site</button><div class="ed-bar" hidden><span class="ed-live">Editing</span><button data-a="design">🎨 Design</button><button class="ed-save" data-a="save">Save</button><button data-a="exit">Exit</button></div>';
    document.body.appendChild(dock);
    drawer = document.createElement('aside'); drawer.className = 'ed-ui ed-drawer'; drawer.setAttribute('aria-label', 'Site design'); document.body.appendChild(drawer);
    fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = 'image/png,image/jpeg,image/webp,image/gif'; fileInput.hidden = true; document.body.appendChild(fileInput);
    fileInput.addEventListener('change', () => { const f = fileInput.files[0]; fileInput.value = ''; if (f && pendingKey) uploadImage(f, pendingKey); });
    dock.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) ({ start: enter, design: toggleDrawer, save: save, exit: exit })[b.dataset.a](); });
    buildTb();
  }

  function enter() {
    st.on = true; document.body.classList.add('editing');
    $$('.scrub').forEach(el => { el.textContent = el.textContent.replace(/\s+/g, ' ').trim(); });
    refresh();
    dock.querySelector('.ed-pill').hidden = true; dock.querySelector('.ed-bar').hidden = false;
    UI.toast('Edit mode on. Click any text or picture.', 'success');
  }
  async function exit() {
    if (st.dirty && !(await UI.confirm('Discard changes?', 'You have unsaved edits. Leave without saving?', { confirmText: 'Discard', danger: true }))) return;
    location.reload();
  }
  function toggleDrawer() { if (drawer.classList.contains('open')) { drawer.classList.remove('open'); return; } renderDrawer(); drawer.classList.add('open'); }

  /* ---------- Text editing ---------- */
  document.addEventListener('input', e => {
    if (!st.on) return;
    const el = e.target.closest && e.target.closest('[data-t]'); if (!el) return;
    const key = el.dataset.t, val = el.innerText.replace(/\u00a0/g, ' ').trim();
    st.texts[key] = val;
    $$('[data-t="' + CSS.escape(key) + '"]').forEach(o => { if (o !== el) o.textContent = val; });
    touch();
  });
  document.addEventListener('keydown', e => {
    if (!st.on) return;
    if (e.key === 'Escape') hideTb();
    if (e.key !== 'Enter') return;
    const el = e.target.closest && e.target.closest('[data-t]');
    if (el && el.getAttribute('data-multiline') === null) e.preventDefault();
  });
  document.addEventListener('paste', e => {
    if (!st.on) return;
    const el = e.target.closest && e.target.closest('[data-t]'); if (!el) return;
    e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
  });
  document.addEventListener('click', e => {
    if (!st.on || e.target.closest('.ed-ui')) return;
    if (e.target.closest('a, button, summary, label')) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  /* ---------- Text colour + size bar ---------- */
  const rgbToHex = s => { if (!s || /rgba\(0, 0, 0, 0\)|transparent/.test(s)) return '#ffffff'; const m = s.match(/\d+/g); return '#' + m.slice(0, 3).map(x => (+x).toString(16).padStart(2, '0')).join(''); };
  function buildTb() {
    tb = document.createElement('div'); tb.className = 'ed-tb ed-ui'; tb.hidden = true;
    tb.innerHTML = '<input type="color" id="tbc" title="Text colour"><button type="button" data-s="-1" title="Smaller">A−</button><input type="number" id="tbn" min="10" max="160" title="Size in px"><button type="button" data-s="1" title="Bigger">A+</button><button type="button" data-r="1" title="Reset">↺</button>';
    document.body.appendChild(tb);
    tb.addEventListener('mousedown', e => { if (e.target.tagName !== 'INPUT') e.preventDefault(); });
    const cur = () => { const k = curEl.dataset.t; return st.styles[k] || (st.styles[k] = Object.assign({}, (Site.content.styles || {})[k])); };
    const apply = () => { touch(); Site.applyStyles(mStyles()); };
    tb.addEventListener('input', e => {
      if (!curEl) return; const s = cur();
      if (e.target.id === 'tbc') s.color = e.target.value;
      if (e.target.id === 'tbn') s.size = Math.max(10, Math.min(160, +e.target.value || 0));
      apply();
    });
    tb.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || !curEl) return; const s = cur(), n = $$('#tbn', tb)[0];
      if (b.dataset.s) { s.size = Math.max(10, Math.min(160, (+n.value || 16) + (+b.dataset.s) * 2)); n.value = s.size; }
      if (b.dataset.r) { s.color = ''; s.size = ''; showTb(curEl); }
      apply();
    });
  }
  function showTb(el) {
    curEl = el; const k = el.dataset.t, s = mStyles()[k] || {}, cs = getComputedStyle(el);
    tb.querySelector('#tbc').value = isHex(s.color) ? s.color : rgbToHex(cs.color);
    tb.querySelector('#tbn').value = s.size || Math.round(parseFloat(cs.fontSize));
    tb.hidden = false;
    const r = el.getBoundingClientRect(), top = r.top > 130 ? r.top - 54 : r.bottom + 8;
    tb.style.top = Math.max(76, Math.min(innerHeight - 60, top)) + 'px'; tb.style.left = Math.max(8, Math.min(innerWidth - 290, r.left)) + 'px';
  }
  function hideTb() { if (tb) tb.hidden = true; curEl = null; }
  document.addEventListener('focusin', e => { if (!st.on) return; const el = e.target.closest && e.target.closest('[data-t]'); if (el) showTb(el); });
  document.addEventListener('mousedown', e => { if (st.on && !e.target.closest('.ed-tb') && !e.target.closest('[data-t]')) hideTb(); });

  /* ---------- Images ---------- */
  function addImgBtn(slot) {
    if (slot.querySelector('.ed-img-btn')) return;
    const b = document.createElement('div'); b.className = 'ed-img-btn ed-ui';
    b.innerHTML = '<button type="button" data-ia="up">📷 Change</button><button type="button" data-ia="rm" title="Use default">✕</button>';
    slot.appendChild(b);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.ed-img-btn [data-ia]'); if (!b) return;
    const key = b.closest('.img-slot').dataset.img;
    if (b.dataset.ia === 'up') { pendingKey = key; fileInput.click(); }
    else { st.images[key] = ''; Site.applyImages(ov().images); touch(); UI.toast('Reverted to default. Press Save to publish.'); }
  });
  async function shrink(file, max) {
    const bmp = await createImageBitmap(file), s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    let blob = await new Promise(r => c.toBlob(r, 'image/webp', 0.88));
    if (!blob || blob.type !== 'image/webp') blob = await new Promise(r => c.toBlob(r, 'image/png'));
    return { blob, type: blob.type, ext: blob.type === 'image/webp' ? 'webp' : 'png' };
  }
  async function uploadImage(file, key) {
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return UI.toast('Please choose a PNG, JPG, WEBP or GIF image.', 'error');
    if (file.size > 15 * 1024 * 1024) return UI.toast('That image is too large (max 15 MB).', 'error');
    UI.toast('Uploading…');
    try {
      const out = await shrink(file, 1600), path = 'site/' + key.replace(/[^a-z0-9._-]/gi, '-') + '-' + Date.now() + '.' + out.ext;
      const { error } = await sb.storage.from('site-media').upload(path, out.blob, { contentType: out.type, cacheControl: '31536000' });
      if (error) throw error;
      st.images[key] = sb.storage.from('site-media').getPublicUrl(path).data.publicUrl;
      Site.applyImages(ov().images); touch(); UI.toast('Image ready. Press Save to publish.', 'success');
    } catch (err) { UI.toast('Upload failed: ' + (err.message || 'unknown error'), 'error', 6000); }
  }

  /* ---------- Design drawer ---------- */
  function renderDrawer() {
    const t = theme(), m = st.mode, pal = Object.assign({}, Site.DEFAULT_THEME[m], t[m] || {});
    const names = { bg: 'Background', bg2: 'Surfaces / menu', text: 'Text', muted: 'Muted text', accent: 'Accent 1', accent2: 'Accent 2' };
    const fontOpts = (sel, def) => Site.FONTS.map(f => '<option' + (((sel || def) === f) ? ' selected' : '') + '>' + esc(f) + '</option>').join('');
    const s = secState();
    const secs = s.order.map((n, i) => {
      const el = document.querySelector('[data-section="' + CSS.escape(n) + '"]'), label = (el && el.dataset.label) || n;
      return '<div class="ed-row"><label><input type="checkbox" data-sv="' + esc(n) + '"' + (s.hidden.indexOf(n) < 0 ? ' checked' : '') + '> ' + esc(label) + '</label><span><button data-su="' + i + '" ' + (i === 0 ? 'disabled' : '') + '>↑</button><button data-sd="' + i + '" ' + (i === s.order.length - 1 ? 'disabled' : '') + '>↓</button></span></div>';
    }).join('');
    const seen = {};
    const linkRows = $$('a[data-link]').filter(a => !seen[a.dataset.link] && (seen[a.dataset.link] = 1)).map(a => {
      const k = a.dataset.link, cur = (Site.content.links || {})[k] || st.links[k] || a.dataset.defHref || a.getAttribute('href');
      return '<div class="ed-field"><label>' + esc(a.dataset.label || k) + '</label><input type="text" data-lk="' + esc(k) + '" value="' + esc(cur) + '"></div>';
    }).join('');
    const icons = n => '<option value="auto"' + (!n || n === 'auto' ? ' selected' : '') + '>Auto</option>' + HoloIcons.names.map(k => '<option value="' + k + '"' + (k === n ? ' selected' : '') + '>' + HoloIcons.label(k) + '</option>').join('');
    const XL = { text: '📝 Text placeholder', image: '🖼️ Image placeholder', social: '🔗 Social links' };
    const ex = exList().map((x, i) => {
      const body = x.type === 'social'
        ? (x.items || []).map((it, j) => '<div class="ed-sr"><select data-xs="' + i + ':' + j + '" data-k="icon">' + icons(it.icon) + '</select><input type="text" data-xs="' + i + ':' + j + '" data-k="url" placeholder="https://…" value="' + esc(it.url || '') + '"><button data-xrmi="' + i + ':' + j + '">✕</button></div>').join('') + '<button class="ed-link" data-xadd="' + i + '">+ Add link</button>'
        : '<p class="ed-hint">Click it on the page to fill it in.</p>';
      return '<div class="ed-ex"><div class="ed-row"><b>' + XL[x.type] + '</b><span><button data-xu="' + i + '" ' + (i === 0 ? 'disabled' : '') + '>↑</button><button data-xd="' + i + '">↓</button><button data-xdel="' + i + '">✕</button></span></div>' + body + '</div>';
    }).join('');

    drawer.innerHTML =
      '<div class="ed-dh"><strong>Design</strong><button data-x="close" aria-label="Close">✕</button></div>' +
      '<div class="ed-sec"><h5>Add to this page</h5><div class="ed-add"><button data-xnew="text">📝 Text placeholder</button><button data-xnew="image">🖼️ Image placeholder</button><button data-xnew="social">🔗 Social links block</button></div>' + (ex || '<p class="ed-hint">Items you add appear at the bottom of this page. They stay hidden from visitors until you fill them in.</p>') + '</div>' +
      '<div class="ed-sec"><h5>Text colour and size</h5><p class="ed-hint">Click any text on the page and use the small bar above it.</p></div>' +
      '<div class="ed-sec"><h5>Colours</h5><div class="ed-seg"><button data-mode="dark" class="' + (m === 'dark' ? 'on' : '') + '">Dark mode</button><button data-mode="light" class="' + (m === 'light' ? 'on' : '') + '">Light mode</button></div>' +
      Object.keys(names).map(k => '<div class="ed-row"><label>' + names[k] + '</label><span><code>' + esc(pal[k]) + '</code><input type="color" data-c="' + k + '" value="' + esc(pal[k]) + '"></span></div>').join('') +
      '<button class="ed-link" data-x="reset-colors">Reset colours to default</button></div>' +
      '<div class="ed-sec"><h5>Fonts</h5><div class="ed-field"><label>Headings</label><select data-f="fontHead">' + fontOpts(t.fontHead, Site.DEFAULT_THEME.fontHead) + '</select></div><div class="ed-field"><label>Body text</label><select data-f="fontBody">' + fontOpts(t.fontBody, Site.DEFAULT_THEME.fontBody) + '</select></div></div>' +
      '<div class="ed-sec"><h5>Sections</h5>' + (secs || '<p class="ed-hint">No sections on this page.</p>') + '</div>' +
      '<div class="ed-sec"><h5>Links on this page</h5>' + (linkRows || '<p class="ed-hint">No editable links on this page.</p>') + '</div>';
  }

  const inDrawer = e => drawer && drawer.contains(e.target);
  document.addEventListener('input', e => {
    if (!inDrawer(e)) return; const t = e.target;
    if (t.dataset.c) { theme()[st.mode][t.dataset.c] = t.value; st.themeTouched = true; touch(); Site.applyTheme(theme()); const c = t.parentElement.querySelector('code'); if (c) c.textContent = t.value; }
    if (t.dataset.xs) { const [i, j] = t.dataset.xs.split(':').map(Number), it = (exList()[i] || {}).items; if (it && it[j]) { it[j][t.dataset.k] = t.value; st.extrasTouched = true; touch(); refresh(); } }
  });
  document.addEventListener('change', e => {
    if (!inDrawer(e)) return; const t = e.target;
    if (t.dataset.f) { theme()[t.dataset.f] = t.value; st.themeTouched = true; touch(); Site.applyTheme(theme()); }
    if (t.dataset.lk) { st.links[t.dataset.lk] = t.value.trim(); touch(); Site.applyLinks(ov().links); }
    if (t.dataset.sv) { const s = secState(), n = t.dataset.sv; s.hidden = s.hidden.filter(x => x !== n); if (!t.checked) s.hidden.push(n); st.sectionsTouched = true; touch(); Site.applySections(s); }
    if (t.dataset.xs && t.tagName === 'SELECT') { const [i, j] = t.dataset.xs.split(':').map(Number), it = (exList()[i] || {}).items; if (it && it[j]) { it[j][t.dataset.k] = t.value; st.extrasTouched = true; touch(); refresh(); } }
  });
  const exChanged = () => { st.extrasTouched = true; touch(); refresh(); renderDrawer(); };
  const removeExtra = i => { exList().splice(i, 1); exChanged(); };
  document.addEventListener('click', e => {
    const rmb = e.target.closest && e.target.closest('[data-xrm]');
    if (rmb && st.on) { const i = exList().findIndex(x => x.id === rmb.dataset.xrm); if (i > -1) removeExtra(i); return; }
    if (!inDrawer(e)) return; const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.x === 'close') drawer.classList.remove('open');
    if (d.x === 'reset-colors') { st.theme = { dark: {}, light: {}, fontHead: '', fontBody: '' }; st.themeTouched = true; touch(); Site.applyTheme(st.theme); renderDrawer(); }
    if (d.mode) { st.mode = d.mode; renderDrawer(); }
    if (d.su !== undefined || d.sd !== undefined) {
      const s = secState(), i = +(d.su !== undefined ? d.su : d.sd), j = d.su !== undefined ? i - 1 : i + 1;
      if (j >= 0 && j < s.order.length) { const tmp = s.order[i]; s.order[i] = s.order[j]; s.order[j] = tmp; st.sectionsTouched = true; touch(); Site.applySections(s); renderDrawer(); }
    }
    if (d.xnew) {
      const id = Math.random().toString(36).slice(2, 8), type = d.xnew;
      exList().push(type === 'social' ? { id, type, items: [{ icon: 'instagram', url: '' }, { icon: 'linkedin', url: '' }, { icon: 'x', url: '' }] } : { id, type });
      exChanged(); UI.toast('Added at the bottom of the page. Click it to fill it in.', 'success');
      setTimeout(() => { const el = document.querySelector('[data-xid="' + id + '"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 80);
    }
    if (d.xdel !== undefined) removeExtra(+d.xdel);
    if (d.xu !== undefined || d.xd !== undefined) {
      const l = exList(), i = +(d.xu !== undefined ? d.xu : d.xd), j = d.xu !== undefined ? i - 1 : i + 1;
      if (j >= 0 && j < l.length) { const tmp = l[i]; l[i] = l[j]; l[j] = tmp; exChanged(); }
    }
    if (d.xadd !== undefined) { (exList()[+d.xadd].items = exList()[+d.xadd].items || []).push({ icon: 'auto', url: '' }); exChanged(); }
    if (d.xrmi !== undefined) { const [i, j] = d.xrmi.split(':').map(Number); exList()[i].items.splice(j, 1); exChanged(); }
  });

  /* ---------- Save ---------- */
  async function save() {
    const a = await Site.accessReady; if (!a) return UI.toast('Please log in again.', 'error');
    const now = new Date().toISOString(), rows = [], add = (key, value) => rows.push({ key, value, updated_by: a.user.id, updated_at: now });
    const clean = (base, extra) => { const m = Object.assign({}, base, extra); Object.keys(m).forEach(k => { if (!m[k]) delete m[k]; }); return m; };
    if (Object.keys(st.texts).length) add('texts', Object.assign({}, Site.content.texts, st.texts));
    if (Object.keys(st.images).length) add('images', clean(Site.content.images, st.images));
    if (Object.keys(st.links).length) add('links', clean(Site.content.links, st.links));
    if (Object.keys(st.styles).length) { const m = Object.assign({}, Site.content.styles, st.styles); Object.keys(m).forEach(k => { if (!m[k] || (!m[k].color && !m[k].size)) delete m[k]; }); add('styles', m); }
    if (st.themeTouched) add('theme', theme());
    if (st.sectionsTouched) add('sections', secState());
    if (st.extrasTouched) add('extras', exAll());
    if (!rows.length) return UI.toast('Nothing to save yet.');
    const btn = dock.querySelector('.ed-save'); btn.disabled = true; btn.textContent = 'Saving…';
    const { error } = await sb.from('site_content').upsert(rows, { onConflict: 'key' });
    btn.disabled = false; btn.textContent = 'Save';
    if (error) return UI.toast('Could not save: ' + error.message, 'error', 7000);
    rows.forEach(r => { Site.content[r.key] = r.value; }); Site.saveCache();
    st.texts = {}; st.images = {}; st.links = {}; st.styles = {}; st.themeTouched = false; st.sectionsTouched = false; st.extrasTouched = false; st.dirty = false;
    UI.toast('Saved. Everyone now sees your changes.', 'success');
  }

  buildDock();
})();
