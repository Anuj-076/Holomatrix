/* Admin → Banners: create, design and schedule website banners, with a live preview */
(window.HoloAdminExt = window.HoloAdminExt || []).push(function (H) {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), esc = H.esc;
  const hexv = v => /^#[0-9a-f]{6}$/i.test(v || '') ? v : '#ffffff';
  H.addTab({ id: 'banners', label: 'Banners', ico: '🪧', perm: ['edit_site_content'] }, 'announce');
  const PL = { bar: '📏 Top bar', card: '🗂️ Corner card', popup: '🪟 Popup' };
  const KEEP = ['id', 'name', 'on', 'head', 'body', 'icon', 'btn', 'url', 'img', 'from', 'to', 'v', 'pages', 'aud', 'rem', 'close', 'place', 'css'];
  const when = b => { const n = Date.now(); if (b.on === false) return ['Off', 'tag-mut']; if (b.from && n < new Date(b.from)) return ['Scheduled', 'tag-mut']; if (b.to && n > new Date(b.to)) return ['Ended', 'tag-bad']; return ['Live', 'tag-ok']; };

  H.R.banners = async function (v) {
    const c = await H.getContent(['banners']);
    const list = Array.isArray(c.banners) ? c.banners : [];
    const save = async msg => { try { await H.saveContent('banners', list); if (msg) UI.toast(msg, 'success'); return true; } catch (e) { H.fail(e); return false; } };

    function draw() {
      v.innerHTML = '<h2 class="pt">Banners</h2><p class="psub">Announcements shown on the website itself (the Announcements tab sends emails). Pick a type, design it however you like, and watch the live preview while you edit.</p>' +
        '<div class="toolbar"><button class="btn btn-primary btn-sm" data-new="bar">+ Top bar</button><button class="btn btn-primary btn-sm" data-new="card">+ Corner card</button><button class="btn btn-primary btn-sm" data-new="popup">+ Popup</button></div><div id="bnl"></div>';
      $('#bnl', v).innerHTML = list.map((b, i) => { const s = when(b); return '<div class="rowitem ' + (b.on === false ? 'dim' : '') + '"><div class="grow"><b>' + esc(b.name || b.head || 'Banner') + '</b><small><span class="bdg">' + (PL[b.place] || '') + '</span><span class="tag ' + s[1] + '">' + s[0] + '</span> ' + esc(b.head || '') + '</small></div><div class="acts">' +
        '<button class="ib" data-a="up" data-i="' + i + '"' + (i ? '' : ' disabled') + '>↑</button><button class="ib" data-a="dn" data-i="' + i + '"' + (i < list.length - 1 ? '' : ' disabled') + '>↓</button><button class="ib" data-a="on" data-i="' + i + '">' + (b.on === false ? '👁 Show' : '👁 Hide') + '</button><button class="ib" data-a="edit" data-i="' + i + '">Edit</button><button class="ib" data-a="dup" data-i="' + i + '">Copy</button><button class="ib danger" data-a="del" data-i="' + i + '">Delete</button></div></div>'; }).join('') || '<div class="empty">No banners yet. Add one above.</div>';
    }
    v.onclick = async e => {
      const n = e.target.closest('[data-new]'); if (n) return edit(HoloBanners.defaults(n.dataset.new), true, -1);
      const a = e.target.closest('[data-a]'); if (!a) return;
      const i = +a.dataset.i, b = list[i], act = a.dataset.a;
      if (act === 'edit') return edit(JSON.parse(JSON.stringify(b)), false, i);
      if (act === 'on') { b.on = b.on === false; if (await save()) draw(); }
      if (act === 'dup') { const d = JSON.parse(JSON.stringify(b)); d.id = 'b' + Date.now().toString(36); d.v = Date.now(); d.name = (d.name || 'Banner') + ' (copy)'; list.splice(i + 1, 0, d); if (await save('Copied.')) draw(); }
      if (act === 'del') { if (!(await UI.confirm('Delete this banner?', 'It disappears from the website.', { confirmText: 'Delete', danger: true }))) return; list.splice(i, 1); if (await save('Deleted.')) draw(); }
      if (act === 'up' || act === 'dn') { const j = i + (act === 'up' ? -1 : 1); [list[i], list[j]] = [list[j], list[i]]; if (await save()) draw(); }
    };

    function edit(b, isNew, idx) {
      const num = (k, d) => (b[k] === undefined || b[k] === '' ? d : b[k]);
      const T = (k, l, ph) => '<div class="field"><label>' + l + '</label><input class="input" data-k="' + k + '" placeholder="' + esc(ph || '') + '" value="' + esc(b[k] == null ? '' : b[k]) + '"></div>';
      const A = (k, l, ph) => '<div class="field"><label>' + l + '</label><textarea class="input" data-k="' + k + '" placeholder="' + esc(ph || '') + '" style="min-height:90px">' + esc(b[k] || '') + '</textarea></div>';
      const S = (k, l, o) => '<div class="field"><label>' + l + '</label><select class="input" data-k="' + k + '">' + o.map(x => '<option value="' + x[0] + '"' + (String(b[k]) === String(x[0]) ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></div>';
      const Cc = (k, l) => '<div class="field"><label>' + l + '</label><span class="cf"><input type="color" data-k="' + k + '" value="' + hexv(b[k]) + '"></span></div>';
      const Rg = (k, l, mn, mx, u) => '<div class="field"><label>' + l + ': <b data-rv="' + k + '">' + num(k, mn) + u + '</b></label><input type="range" data-k="' + k + '" data-u="' + u + '" min="' + mn + '" max="' + mx + '" value="' + num(k, mn) + '"></div>';
      const K = (k, l) => '<label class="chk"><input type="checkbox" data-k="' + k + '"' + (b[k] ? ' checked' : '') + '> ' + l + '</label>';
      const Dt = (k, l) => '<div class="field"><label>' + l + '</label><input class="input" type="datetime-local" data-k="' + k + '" value="' + esc(b[k] || '') + '"></div>';
      const sec = (t, inner, open) => '<details class="bn-sec"' + (open ? ' open' : '') + '><summary>' + t + '</summary><div>' + inner + '</div></details>';

      const body = '<div class="be"><div>' +
        sec('📝 Content',
          T('name', 'Name (only you see this)') + T('head', 'Heading', 'e.g. We are launching soon') + A('body', 'Text', 'Use **bold**, [link text](https://…) and new lines') +
          '<div class="two">' + T('icon', 'Emoji before the heading (optional)', '📣') + T('btn', 'Button text (optional)', 'Learn more') + '</div>' + T('url', 'Button link', 'https://… or /news/all'), true) +
        sec('🖼️ Picture',
          '<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px"><div class="thumb wide" id="bn-th"></div><button type="button" class="ib" id="bn-up">Upload</button><button type="button" class="ib" id="bn-rm">✕</button></div>' +
          '<div class="two">' + S('ipos', 'Where', [['left', 'Left of the text'], ['right', 'Right of the text'], ['top', 'Above the text'], ['bottom', 'Below the text'], ['bg', 'Behind everything'], ['none', 'Hide the picture']]) + S('ishape', 'Shape', [['rounded', 'Rounded'], ['circle', 'Circle'], ['square', 'Square']]) + '</div>' +
          Rg('isz', 'Picture size', 24, 600, 'px') + '<div class="two">' + S('ifit', 'Fit', [['cover', 'Fill (crop)'], ['contain', 'Show whole picture']]) + Rg('ov', 'Dark layer when behind', 0, 90, '%') + '</div>') +
        sec('🎨 Look',
          S('place', 'Type', [['bar', 'Top bar (under the menu)'], ['card', 'Corner card'], ['popup', 'Popup in the middle']]) + '<button type="button" class="ib" id="bn-def" style="margin-bottom:12px">Use the default look for this type</button>' +
          '<div class="two">' + S('bgm', 'Background', [['gradient', 'Gradient'], ['solid', 'One colour']]) + Rg('ang', 'Gradient angle', 0, 360, '°') + '</div>' +
          '<div class="two">' + Cc('bg', 'Background colour') + Cc('bg2', 'Gradient 2nd colour') + '</div><div class="two">' + Cc('tx', 'Text colour') + Cc('hd', 'Heading colour') + '</div><div class="two">' + Cc('bb', 'Button colour') + Cc('bt', 'Button text colour') + '</div>' +
          '<div class="two">' + Cc('bc', 'Border / glow colour') + Rg('bw', 'Border thickness', 0, 12, 'px') + '</div><div class="two">' + Rg('r', 'Round corners', 0, 60, 'px') + Rg('p', 'Space inside', 4, 80, 'px') + '</div>' +
          Rg('w', 'Width (card, popup) / content width (bar)', 240, 1600, 'px') + '<div class="two">' + Rg('hs', 'Heading size', 12, 60, 'px') + Rg('ts', 'Text size', 11, 32, 'px') + '</div>' +
          '<div class="two">' + S('sh', 'Shadow', [['none', 'None'], ['soft', 'Soft'], ['glow', 'Glow']]) + S('al', 'Text alignment', [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']]) + '</div>' +
          '<div class="two">' + S('ff', 'Font', [['', 'Site default']].concat(HoloBanners.FONTS.map(f => [f, f]))) + S('anim', 'Appears with', [['fade', 'Fade in'], ['slide', 'Slide in'], ['zoom', 'Zoom in'], ['none', 'Nothing']]) + '</div>' +
          K('glow', 'Pulsing glow around the banner') + K('mq', 'Scrolling text (top bar only)') + Rg('mqs', 'Scroll time for one pass', 6, 90, 's')) +
        sec('🗓️ Where and when',
          '<div class="two">' + S('pages', 'Pages', [['all', 'All pages'], ['home', 'Home page only'], ['notHome', 'Every page except home']]) + S('aud', 'Who sees it', [['all', 'Everyone'], ['guest', 'Visitors not logged in'], ['user', 'Logged-in members']]) + '</div>' +
          '<div class="two">' + Dt('from', 'Show from (optional)') + Dt('to', 'Hide after (optional)') + '</div>' + K('stick', 'Top bar stays visible while scrolling') + K('close', 'Let visitors close it (popups can always be closed)') +
          S('rem', 'After a visitor closes it', [['visit', 'Show again next visit'], ['forever', 'Never show again']]) + '<button type="button" class="ib" id="bn-reset">Show again to everyone who closed it</button>') +
        sec('🧩 Advanced', A('css', 'Extra style (CSS declarations)', 'e.g. letter-spacing: 1px; text-transform: uppercase;') + '<p class="hint">Only CSS declarations, no brackets. Example: <code>font-style: italic;</code></p>') +
        K('on', 'Visible on the website') +
        '<div class="dlg-f"><button class="btn btn-ghost btn-sm" id="bn-c">Cancel</button><button class="btn btn-primary btn-sm" id="bn-s">Save banner</button></div></div>' +
        '<div class="prev"><small class="cap">Live preview</small><div id="bn-prev"></div></div></div>';
      const d = H.dialog((isNew ? 'New ' : 'Edit ') + 'banner', body, { wide: true }), el = d.el;
      const prev = () => { $('#bn-prev', el).innerHTML = '<div class="ann-pv">' + HoloBanners.render(b, { preview: true }) + '</div>'; };
      const thumb = () => { $('#bn-th', el).innerHTML = b.img ? '<img src="' + esc(b.img) + '" alt="">' : '—'; };
      prev(); thumb();
      const on = e => {
        const t = e.target, k = t.dataset && t.dataset.k; if (!k) return;
        b[k] = t.type === 'checkbox' ? t.checked : t.type === 'range' ? +t.value : t.value;
        if (t.type === 'range') { const lb = $('[data-rv="' + k + '"]', el); if (lb) lb.textContent = t.value + (t.dataset.u || ''); }
        prev();
      };
      el.addEventListener('input', on); el.addEventListener('change', on);
      $('#bn-up', el).onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/png,image/jpeg,image/webp,image/gif'; inp.onchange = async () => { if (!inp.files[0]) return; UI.toast('Uploading…'); try { b.img = await HoloMedia.upload(inp.files[0], { folder: 'banners', max: 1600 }); if (b.ipos === 'none') b.ipos = 'left'; thumb(); prev(); UI.toast('Picture ready.', 'success'); } catch (er) { H.fail(er); } }; inp.click(); };
      $('#bn-rm', el).onclick = () => { b.img = ''; thumb(); prev(); };
      $('#bn-def', el).onclick = async () => {
        if (!(await UI.confirm('Use the default look?', 'Colours, sizes and style go back to the default for a ' + (PL[b.place] || '').replace(/^\S+ /, '').toLowerCase() + '. Your text and picture stay.', { confirmText: 'Reset look' }))) return;
        const f = HoloBanners.defaults(b.place); Object.keys(f).forEach(k => { if (KEEP.indexOf(k) < 0) b[k] = f[k]; });
        d.close(); edit(b, isNew, idx);
      };
      $('#bn-reset', el).onclick = () => { b.v = Date.now(); UI.toast('Done. Everyone who closed it will see it again after you save.', 'success', 5000); };
      $('#bn-c', el).onclick = d.close;
      $('#bn-s', el).onclick = async () => {
        if (!(b.head || b.body || b.img)) return UI.toast('Add a heading, some text or a picture first.', 'warn');
        b.url = String(b.url || '').trim();
        if (b.url && !/^(\/|#|https?:\/\/|mailto:|tel:)/i.test(b.url)) return UI.toast('The button link must start with / or https://', 'warn', 6000);
        if (isNew) list.push(b); else list[idx] = b;
        if (await save('Banner saved. It is live now.')) { d.close(); draw(); }
      };
    }
    draw();
  };
});
