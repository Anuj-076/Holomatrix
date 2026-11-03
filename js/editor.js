/* Holomatrix on-site editor: edit texts, images, colours, fonts, links and sections right on the page */
(function () {
  'use strict';
  const Site = window.Site, UI = window.UI;
  if (!Site || !UI || document.getElementById('ed-dock')) return;

  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = UI.esc;
  const st = {
    on: false, dirty: false,
    texts: {}, images: {}, links: {},
    theme: null, themeTouched: false,
    sections: null, sectionsTouched: false,
    mode: 'dark'
  };
  let dock, drawer, fileInput, pendingKey = null;

  /* ---------- State helpers ---------- */
  function theme() {
    if (!st.theme) {
      const t = Site.content.theme || {};
      st.theme = { dark: Object.assign({}, t.dark), light: Object.assign({}, t.light), fontHead: t.fontHead || '', fontBody: t.fontBody || '' };
    }
    return st.theme;
  }
  function secState() {
    if (!st.sections) {
      const s = Site.content.sections || {};
      const names = $$('[data-section]').map(e => e.dataset.section);
      let order = names;
      if (Array.isArray(s.order) && s.order.length) {
        order = s.order.filter(n => names.indexOf(n) > -1).concat(names.filter(n => s.order.indexOf(n) < 0));
      }
      st.sections = { order, hidden: (s.hidden || []).slice() };
    }
    return st.sections;
  }
  const touch = () => { st.dirty = true; };

  /* ---------- Dock (bottom-center) ---------- */
  function buildDock() {
    dock = document.createElement('div');
    dock.id = 'ed-dock';
    dock.className = 'ed-ui ed-dock';
    dock.innerHTML =
      '<button class="ed-pill" data-a="start">✏️ Edit site</button>' +
      '<div class="ed-bar" hidden>' +
      '<span class="ed-live">Editing</span>' +
      '<button data-a="design">🎨 Design</button>' +
      '<button class="ed-save" data-a="save">Save</button>' +
      '<button data-a="exit">Exit</button></div>';
    document.body.appendChild(dock);

    drawer = document.createElement('aside');
    drawer.className = 'ed-ui ed-drawer';
    drawer.setAttribute('aria-label', 'Site design');
    document.body.appendChild(drawer);

    fileInput = document.createElement('input');
    fileInput.type = 'file'; fileInput.accept = 'image/png,image/jpeg,image/webp,image/gif'; fileInput.hidden = true;
    document.body.appendChild(fileInput);
    fileInput.addEventListener('change', () => {
      const f = fileInput.files[0]; fileInput.value = '';
      if (f && pendingKey) uploadImage(f, pendingKey);
    });

    dock.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      ({ start: enter, design: toggleDrawer, save: save, exit: exit })[b.dataset.a]();
    });
  }

  /* ---------- Enter / exit ---------- */
  function enter() {
    st.on = true;
    document.body.classList.add('editing');
    $$('.scrub').forEach(el => { el.textContent = el.textContent.replace(/\s+/g, ' ').trim(); });
    $$('[data-t]').forEach(el => {
      el.hidden = false; el.contentEditable = 'true'; el.spellcheck = false;
      if (!el.dataset.ph) el.dataset.ph = el.dataset.t;
    });
    $$('.img-slot').forEach(addImgBtn);
    dock.querySelector('.ed-pill').hidden = true;
    dock.querySelector('.ed-bar').hidden = false;
    UI.toast('Edit mode on. Click any text or picture.', 'success');
  }

  async function exit() {
    if (st.dirty && !(await UI.confirm('Discard changes?', 'You have unsaved edits. Leave without saving?', { confirmText: 'Discard', danger: true }))) return;
    location.reload();
  }

  function toggleDrawer() {
    if (drawer.classList.contains('open')) { drawer.classList.remove('open'); return; }
    renderDrawer();
    drawer.classList.add('open');
  }

  /* ---------- Text editing ---------- */
  document.addEventListener('input', e => {
    if (!st.on) return;
    const el = e.target.closest && e.target.closest('[data-t]');
    if (!el) return;
    const key = el.dataset.t;
    const val = el.innerText.replace(/\u00a0/g, ' ').trim();
    st.texts[key] = val;
    $$('[data-t="' + CSS.escape(key) + '"]').forEach(o => { if (o !== el) o.textContent = val; });
    touch();
  });
  document.addEventListener('keydown', e => {
    if (!st.on || e.key !== 'Enter') return;
    const el = e.target.closest && e.target.closest('[data-t]');
    if (el && el.getAttribute('data-multiline') === null) e.preventDefault();
  });
  document.addEventListener('paste', e => {
    if (!st.on) return;
    const el = e.target.closest && e.target.closest('[data-t]');
    if (!el) return;
    e.preventDefault();
    const txt = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, txt);
  });
  // block navigation / button actions while editing
  document.addEventListener('click', e => {
    if (!st.on || e.target.closest('.ed-ui')) return;
    if (e.target.closest('a, button, summary, label')) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  /* ---------- Images ---------- */
  function addImgBtn(slot) {
    if (slot.querySelector('.ed-img-btn')) return;
    const b = document.createElement('div');
    b.className = 'ed-img-btn ed-ui';
    b.innerHTML = '<button type="button" data-ia="up">📷 Change</button><button type="button" data-ia="rm" title="Use default">✕</button>';
    slot.appendChild(b);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.ed-img-btn [data-ia]');
    if (!b) return;
    const slot = b.closest('.img-slot');
    const key = slot.dataset.img;
    if (b.dataset.ia === 'up') { pendingKey = key; fileInput.click(); }
    else {
      st.images[key] = '';
      Site.applyImages(Object.assign({}, Site.content.images, st.images));
      touch();
      UI.toast('Reverted to default. Press Save to publish.');
    }
  });

  async function shrink(file, max) {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
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
      const out = await shrink(file, 1600);
      const path = 'site/' + key.replace(/[^a-z0-9._-]/gi, '-') + '-' + Date.now() + '.' + out.ext;
      const { error } = await sb.storage.from('site-media').upload(path, out.blob, { contentType: out.type, cacheControl: '31536000' });
      if (error) throw error;
      const { data } = sb.storage.from('site-media').getPublicUrl(path);
      st.images[key] = data.publicUrl;
      Site.applyImages(Object.assign({}, Site.content.images, st.images));
      touch();
      UI.toast('Image ready. Press Save to publish.', 'success');
    } catch (err) {
      UI.toast('Upload failed: ' + (err.message || 'unknown error'), 'error', 6000);
    }
  }

  /* ---------- Design drawer ---------- */
  function renderDrawer() {
    const t = theme(), m = st.mode;
    const pal = Object.assign({}, Site.DEFAULT_THEME[m], t[m] || {});
    const names = { bg: 'Background', bg2: 'Surfaces / menu', text: 'Text', muted: 'Muted text', accent: 'Accent 1', accent2: 'Accent 2' };
    const fontOpts = (sel, def) => Site.FONTS.map(f => '<option' + (((sel || def) === f) ? ' selected' : '') + '>' + esc(f) + '</option>').join('');

    const s = secState();
    const secs = s.order.map((n, i) => {
      const el = document.querySelector('[data-section="' + CSS.escape(n) + '"]');
      const label = (el && el.dataset.label) || n;
      return '<div class="ed-row"><label><input type="checkbox" data-sv="' + esc(n) + '"' + (s.hidden.indexOf(n) < 0 ? ' checked' : '') + '> ' + esc(label) + '</label>' +
        '<span><button data-su="' + i + '" ' + (i === 0 ? 'disabled' : '') + '>↑</button><button data-sd="' + i + '" ' + (i === s.order.length - 1 ? 'disabled' : '') + '>↓</button></span></div>';
    }).join('');

    const seen = {};
    const linkRows = $$('a[data-link]').filter(a => !seen[a.dataset.link] && (seen[a.dataset.link] = 1)).map(a => {
      const k = a.dataset.link;
      const cur = (Site.content.links || {})[k] || st.links[k] || a.dataset.defHref || a.getAttribute('href');
      return '<div class="ed-field"><label>' + esc(a.dataset.label || k) + '</label><input type="text" data-lk="' + esc(k) + '" value="' + esc(cur) + '"></div>';
    }).join('');

    drawer.innerHTML =
      '<div class="ed-dh"><strong>Design</strong><button data-x="close" aria-label="Close">✕</button></div>' +
      '<div class="ed-sec"><h5>Colours</h5>' +
      '<div class="ed-seg"><button data-mode="dark" class="' + (m === 'dark' ? 'on' : '') + '">Dark mode</button><button data-mode="light" class="' + (m === 'light' ? 'on' : '') + '">Light mode</button></div>' +
      Object.keys(names).map(k => '<div class="ed-row"><label>' + names[k] + '</label><span><code>' + esc(pal[k]) + '</code><input type="color" data-c="' + k + '" value="' + esc(pal[k]) + '"></span></div>').join('') +
      '<p class="ed-hint">Tip: switch the site theme with the sun/moon button to preview the other mode.</p>' +
      '<button class="ed-link" data-x="reset-colors">Reset colours to default</button></div>' +
      '<div class="ed-sec"><h5>Fonts</h5>' +
      '<div class="ed-field"><label>Headings</label><select data-f="fontHead">' + fontOpts(t.fontHead, Site.DEFAULT_THEME.fontHead) + '</select></div>' +
      '<div class="ed-field"><label>Body text</label><select data-f="fontBody">' + fontOpts(t.fontBody, Site.DEFAULT_THEME.fontBody) + '</select></div></div>' +
      '<div class="ed-sec"><h5>Sections</h5>' + (secs || '<p class="ed-hint">No sections on this page.</p>') + '</div>' +
      '<div class="ed-sec"><h5>Links on this page</h5>' + (linkRows || '<p class="ed-hint">No editable links on this page.</p>') + '</div>';
  }

  drawer_events();
  function drawer_events() {
    document.addEventListener('input', e => {
      if (!drawer || !drawer.contains(e.target)) return;
      const c = e.target.dataset.c;
      if (c) {
        theme()[st.mode][c] = e.target.value;
        st.themeTouched = true; touch();
        Site.applyTheme(theme());
        const code = e.target.parentElement.querySelector('code'); if (code) code.textContent = e.target.value;
      }
    });
    document.addEventListener('change', e => {
      if (!drawer || !drawer.contains(e.target)) return;
      const t = e.target;
      if (t.dataset.f) { theme()[t.dataset.f] = t.value; st.themeTouched = true; touch(); Site.applyTheme(theme()); }
      if (t.dataset.lk) {
        st.links[t.dataset.lk] = t.value.trim(); touch();
        Site.applyLinks(Object.assign({}, Site.content.links, st.links));
      }
      if (t.dataset.sv) {
        const s = secState(), n = t.dataset.sv;
        s.hidden = s.hidden.filter(x => x !== n);
        if (!t.checked) s.hidden.push(n);
        st.sectionsTouched = true; touch(); Site.applySections(s);
      }
    });
    document.addEventListener('click', e => {
      if (!drawer || !drawer.contains(e.target)) return;
      const b = e.target.closest('button'); if (!b) return;
      const d = b.dataset;
      if (d.x === 'close') drawer.classList.remove('open');
      if (d.x === 'reset-colors') {
        st.theme = { dark: {}, light: {}, fontHead: '', fontBody: '' };
        st.themeTouched = true; touch(); Site.applyTheme(st.theme); renderDrawer();
      }
      if (d.mode) { st.mode = d.mode; renderDrawer(); }
      if (d.su !== undefined || d.sd !== undefined) {
        const s = secState(), i = +(d.su !== undefined ? d.su : d.sd), j = d.su !== undefined ? i - 1 : i + 1;
        if (j >= 0 && j < s.order.length) {
          const tmp = s.order[i]; s.order[i] = s.order[j]; s.order[j] = tmp;
          st.sectionsTouched = true; touch(); Site.applySections(s); renderDrawer();
        }
      }
    });
  }

  /* ---------- Save ---------- */
  async function save() {
    const a = await Site.accessReady;
    if (!a) return UI.toast('Please log in again.', 'error');
    const now = new Date().toISOString(), rows = [];
    const add = (key, value) => rows.push({ key, value, updated_by: a.user.id, updated_at: now });

    if (Object.keys(st.texts).length) add('texts', Object.assign({}, Site.content.texts, st.texts));
    if (Object.keys(st.images).length) {
      const m = Object.assign({}, Site.content.images, st.images);
      Object.keys(m).forEach(k => { if (!m[k]) delete m[k]; });
      add('images', m);
    }
    if (Object.keys(st.links).length) {
      const m = Object.assign({}, Site.content.links, st.links);
      Object.keys(m).forEach(k => { if (!m[k]) delete m[k]; });
      add('links', m);
    }
    if (st.themeTouched) add('theme', theme());
    if (st.sectionsTouched) add('sections', secState());

    if (!rows.length) return UI.toast('Nothing to save yet.');
    const btn = dock.querySelector('.ed-save');
    btn.disabled = true; btn.textContent = 'Saving…';
    const { error } = await sb.from('site_content').upsert(rows, { onConflict: 'key' });
    btn.disabled = false; btn.textContent = 'Save';
    if (error) return UI.toast('Could not save: ' + error.message, 'error', 7000);

    rows.forEach(r => { Site.content[r.key] = r.value; });
    Site.saveCache();
    st.texts = {}; st.images = {}; st.links = {};
    st.themeTouched = false; st.sectionsTouched = false; st.dirty = false;
    UI.toast('Saved. Everyone now sees your changes.', 'success');
  }

  buildDock();
})();
