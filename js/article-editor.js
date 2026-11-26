/* Holomatrix page builder for news and research: full-screen editor with blocks, text styling, maths, files, preview and draft autosave */
(function () {
  'use strict';
  if (window.HoloArticleEditor) return;
  const esc = UI.esc, clone = x => JSON.parse(JSON.stringify(x));
  const TYPES = { h: ['🔠', 'Heading'], p: ['¶', 'Text'], img: ['🖼️', 'Image'], q: ['❝', 'Quote'], list: ['☰', 'List'], eq: ['∑', 'Equation'], note: ['💡', 'Note box'], hr: ['➖', 'Divider line'] };
  const NEW = {
    h: () => ({ t: 'h', l: 2, x: '' }), p: () => ({ t: 'p', x: '', al: 'left' }), img: () => ({ t: 'img', u: '', c: '', a: '', w: 100, al: 'center' }),
    q: () => ({ t: 'q', x: '', by: '', src: '' }), list: () => ({ t: 'list', o: false, i: [''] }), eq: () => ({ t: 'eq', x: '', n: '' }),
    note: () => ({ t: 'note', k: 'info', h: '', x: '' }), hr: () => ({ t: 'hr' })
  };
  const fsize = n => !n ? '' : n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
  const need = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.body.appendChild(s); });
  const fromBody = body => { const t = String(body || '').trim(); return t ? t.split(/\n{2,}/).filter(Boolean).map(s => ({ t: 'p', x: esc(s).replace(/\n/g, '<br>'), al: 'left' })) : [{ t: 'p', x: '', al: 'left' }]; };
  const opt = (v, cur, label) => '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + label + '</option>';

  /* what gets saved: safe text, no empty blocks */
  function clean(b) {
    const R = window.HoloRich, has = h => R.textOf(h).trim(), s = v => String(v || '').trim();
    if (!b) return null;
    if (b.t === 'h') return s(b.x) ? { t: 'h', l: +b.l === 3 ? 3 : 2, x: s(b.x) } : null;
    if (b.t === 'p') return has(b.x) ? { t: 'p', x: R.sanitize(b.x), al: ['center', 'right', 'justify'].indexOf(b.al) > -1 ? b.al : 'left' } : null;
    if (b.t === 'img') return b.u ? { t: 'img', u: b.u, c: s(b.c), a: s(b.a), w: Math.min(100, Math.max(20, +b.w || 100)), al: ['left', 'right'].indexOf(b.al) > -1 ? b.al : 'center' } : null;
    if (b.t === 'q') return has(b.x) ? { t: 'q', x: R.sanitize(b.x), by: s(b.by), src: s(b.src) } : null;
    if (b.t === 'list') { const i = (b.i || []).map(x => R.sanitize(x)).filter(x => has(x)); return i.length ? { t: 'list', o: !!b.o, i } : null; }
    if (b.t === 'eq') return s(b.x) ? { t: 'eq', x: s(b.x), n: s(b.n) } : null;
    if (b.t === 'note') return (has(b.x) || s(b.h)) ? { t: 'note', k: ['warn', 'tip'].indexOf(b.k) > -1 ? b.k : 'info', h: s(b.h), x: R.sanitize(b.x) } : null;
    if (b.t === 'hr') return { t: 'hr' };
    return null;
  }

  async function uploadFile(f) {
    if (f.size > 25 * 1024 * 1024) throw new Error(f.name + ' is bigger than 25 MB.');
    const path = 'files/' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) + '-' + f.name.replace(/[^a-z0-9._-]/gi, '-').slice(-80);
    const { error } = await sb.storage.from('article-files').upload(path, f, { contentType: f.type || 'application/octet-stream', cacheControl: '31536000' });
    if (error) throw error;
    return { name: f.name, url: sb.storage.from('article-files').getPublicUrl(path).data.publicUrl, size: f.size };
  }

  async function open(o) {
    const R = window.HoloRich, H = window.HoloAdmin, HC = window.HoloCommon;
    if (!R || !H) return UI.toast('js/rich.js is missing.', 'error');
    try { if (!window.HoloArticleView) await need('/js/article-view.js'); } catch (e) {}
    if (!window.HoloArticleView) return UI.toast('Upload js/article-view.js first.', 'error', 6000);

    const isR = o.kind === 'research', row = o.row || {}, ct = o.content || {};
    const key = 'holo-draft-' + o.kind + '-' + (row.id || 'new');
    const cats = (isR ? HC.RES_CATS : HC.NEWS_CATS).filter(c => c[0] !== 'all');
    const srcBlocks = isR ? ct.blocks : row.blocks;
    let p = {
      title: row.title || '', category: row.category || 'physics', summary: row.summary || '', cover_url: row.cover_url || '', published: row.published !== false,
      author: isR ? (row.authors || '') : (row.author_name || (row.id ? '' : H.myName())), external_url: ct.external_url || '', toc: !(row.opts && row.opts.toc === false),
      files: Array.isArray(row.files) ? row.files.slice() : [], pdf: ct.file_path || ''
    };
    let blocks = Array.isArray(srcBlocks) && srcBlocks.length ? clone(srcBlocks) : fromBody(isR ? ct.body : row.body);

    let dr = null; try { dr = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
    if (dr && dr.p && Array.isArray(dr.blocks)) {
      if (await UI.confirm('Restore your unsaved draft?', 'We found unsaved work on this ' + (isR ? 'research' : 'article') + ' from ' + new Date(dr.at).toLocaleString() + '.', { confirmText: 'Restore draft', cancelText: 'Start fresh' })) { p = Object.assign(p, dr.p); blocks = dr.blocks; }
      else { try { localStorage.removeItem(key); } catch (e) {} }
    }

    let dirty = false, active = -1, lastRange = null, lastRt = null, lastField = null;
    const mark = () => { dirty = true; };

    /* ---------- Shell ---------- */
    const root = document.createElement('div'); root.className = 'ae-full ed-ui';
    root.innerHTML =
      '<div class="ae-bar"><strong>' + (row.id ? 'Edit ' : 'New ') + (isR ? 'research' : 'article') + '</strong><a class="ae-guide" href="/admin#guide" target="_blank" rel="noopener">📘 Writing guide (opens in a new tab)</a><span class="grow"></span>' +
      '<div class="seg"><button type="button" data-tab="edit" class="on">✏️ Write</button><button type="button" data-tab="prev">👁 Preview</button></div>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-act="sym">Ω Symbol codes</button><button type="button" class="btn btn-ghost btn-sm" data-act="cancel">Close</button><button type="button" class="btn btn-primary btn-sm" data-act="save">Save</button></div>' +
      '<div class="ae-body"><div class="ae-edit"><div class="ae-main">' +
      '<input class="ae-title" data-p="title" maxlength="200" placeholder="Title" value="' + esc(p.title) + '">' +
      '<textarea class="ae-sum" data-p="summary" maxlength="500" placeholder="Short summary (shown on the cards and above the article)">' + esc(p.summary) + '</textarea>' +
      '<div class="ae-fmt"><button type="button" data-c="bold" title="Bold (Ctrl+B)"><b>B</b></button><button type="button" data-c="italic" title="Italic (Ctrl+I)"><i>I</i></button><button type="button" data-c="underline" title="Underline (Ctrl+U)"><u>U</u></button><button type="button" data-c="strikeThrough" title="Strikethrough"><s>S</s></button>' +
      '<button type="button" data-c="superscript" title="Superscript">x²</button><button type="button" data-c="subscript" title="Subscript">x₂</button><button type="button" data-c="code" title="Code">&lt;/&gt;</button><i class="sep"></i>' +
      '<select title="Text size"><option value="">Size</option><option value="fs-sm">Small</option><option value="n">Normal</option><option value="fs-lg">Large</option><option value="fs-xl">Huge</option></select><i class="sep"></i>' +
      '<button type="button" class="sw-c" data-col="#4de1ff" style="background:#4de1ff" title="Cyan"></button><button type="button" class="sw-c" data-col="#4169e1" style="background:#4169e1" title="Royal blue"></button><input type="color" id="ae-col" value="#ff6b8a" title="Any text colour"><i class="sep"></i>' +
      '<button type="button" data-c="hl" title="Highlight with the colour on the right">Highlight</button><input type="color" id="ae-hl" value="#ffe066" title="Highlight colour"><button type="button" data-c="nohl" title="Remove highlight">✕</button><i class="sep"></i>' +
      '<button type="button" data-c="link">Link</button><button type="button" data-c="unlink">Unlink</button><button type="button" data-c="clear" title="Clear all styling">Clear</button><button type="button" data-c="sym" title="Symbol codes">Ω</button></div>' +
      '<div id="ae-blocks"></div>' +
      '<div class="ae-add"><b style="align-self:center;color:var(--muted);font-size:.85rem">Add:</b>' + Object.keys(TYPES).map(t => '<button type="button" data-act="add" data-type="' + t + '">' + TYPES[t][0] + ' ' + TYPES[t][1] + '</button>').join('') + '</div>' +
      '</div><aside class="ae-side"></aside></div><div class="ae-prev" hidden></div></div>';
    document.body.appendChild(root); document.body.classList.add('no-scroll');
    const $ = s => root.querySelector(s), box = $('#ae-blocks');

    const side = () =>
      '<div class="field"><label>Category</label><select class="input" data-p="category">' + cats.map(c => opt(c[0], p.category, esc(c[1]))).join('') + '</select></div>' +
      '<div class="field"><label>' + (isR ? 'Authors' : 'Author') + '</label><input class="input" data-p="author" maxlength="200" value="' + esc(p.author) + '"></div>' +
      '<div class="field"><label>Cover image</label><div class="ae-cov">' + (p.cover_url ? '<img src="' + esc(p.cover_url) + '" alt="">' : '<span>No cover yet</span>') + '</div><div style="display:flex;gap:6px;margin-top:8px"><button type="button" class="ib" data-act="cover">📷 Upload</button><button type="button" class="ib" data-act="covrm">✕</button></div></div>' +
      (isR ? '<div class="field"><label>Original source link (optional)</label><input class="input" data-p="external_url" placeholder="https://…" value="' + esc(p.external_url) + '"></div>' : '') +
      '<div class="field"><label>PDF or extra files (25 MB each)</label>' + (p.pdf ? '<div class="ae-f"><span>📄 Earlier PDF attached</span><button type="button" class="ib" data-act="rmpdf">✕</button></div>' : '') +
      p.files.map((f, i) => '<div class="ae-f"><span>📎 ' + esc(f.name) + ' <small>' + fsize(f.size) + '</small></span><button type="button" class="ib" data-act="rmfile" data-i="' + i + '">✕</button></div>').join('') + '<button type="button" class="ib" data-act="addfile">＋ Add files</button></div>' +
      '<label class="chk"><input type="checkbox" data-p="toc"' + (p.toc ? ' checked' : '') + '> Show the Contents box (needs 3+ headings)</label>' +
      '<label class="chk"><input type="checkbox" data-p="published"' + (p.published ? ' checked' : '') + '> Published (untick to keep as a draft)</label>';
    const drawSide = () => { $('.ae-side').innerHTML = side(); };

    /* ---------- Blocks ---------- */
    const rt = (html, attr, ph) => '<div class="ae-rt" contenteditable="true" ' + attr + ' data-ph="' + esc(ph) + '">' + R.sanitize(html) + '</div>';
    const sel = (f, cur, opts, num) => '<select class="input" style="width:auto;max-width:100%" data-f="' + f + '"' + (num ? ' data-num="1"' : '') + '>' + opts.map(x => opt(x[0], cur, x[1])).join('') + '</select>';
    function blockHtml(b, i) {
      let c = '';
      if (b.t === 'h') c = sel('l', b.l === 3 ? 3 : 2, [[2, 'Big heading'], [3, 'Small heading']], true) + '<input class="input" data-f="x" maxlength="200" placeholder="Heading text" value="' + esc(b.x) + '">';
      else if (b.t === 'p') c = rt(b.x, 'data-f="x"', 'Write your text here… select words to style them. Use $…$ for maths.') + sel('al', b.al || 'left', [['left', 'Align left'], ['center', 'Centre'], ['right', 'Align right'], ['justify', 'Justify']]);
      else if (b.t === 'img') c = '<div class="ae-img">' + (b.u ? '<img src="' + esc(b.u) + '" alt="">' : '<div class="ae-ph">No picture yet</div>') + '<div style="display:flex;gap:6px"><button type="button" class="ib" data-imgup>📷 ' + (b.u ? 'Replace' : 'Upload') + '</button><button type="button" class="ib" data-imgrm>✕</button></div></div>' +
        '<input class="input" data-f="c" maxlength="300" placeholder="Caption (optional)" value="' + esc(b.c) + '"><input class="input" data-f="a" maxlength="200" placeholder="Describe the picture for screen readers (optional)" value="' + esc(b.a) + '">' +
        '<div class="two"><div class="field"><label>Width <b>' + (b.w || 100) + '%</b></label><input type="range" min="20" max="100" data-f="w" data-num="1" value="' + (b.w || 100) + '"></div><div class="field"><label>Position</label>' + sel('al', b.al || 'center', [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']]) + '</div></div>';
      else if (b.t === 'q') c = rt(b.x, 'data-f="x"', 'Type the quote…') + '<div class="two"><input class="input" data-f="by" maxlength="120" placeholder="Name (shown as — Name)" value="' + esc(b.by) + '"><input class="input" data-f="src" maxlength="160" placeholder="Role or source (optional)" value="' + esc(b.src) + '"></div>';
      else if (b.t === 'list') c = sel('o', b.o ? 'ol' : 'ul', [['ul', 'Bullet points'], ['ol', 'Numbered']]) + (b.i || ['']).map((x, k) => '<div class="ae-li"><span>' + (b.o ? (k + 1) + '.' : '•') + '</span>' + rt(x, 'data-li="' + k + '"', 'List item') + '<button type="button" class="ib" data-rmli="' + k + '">✕</button></div>').join('') + '<div><button type="button" class="ib" data-addli>＋ Add item</button></div>';
      else if (b.t === 'eq') c = '<textarea class="input ae-code" data-f="x" placeholder="LaTeX code, e.g.  E = mc^{2}   (open Symbol codes for help)">' + esc(b.x) + '</textarea><div class="ae-eqp">Preview appears here</div><input class="input" data-f="n" maxlength="20" placeholder="Label on the right, e.g. (1) (optional)" value="' + esc(b.n) + '">';
      else if (b.t === 'note') c = sel('k', b.k || 'info', [['info', '💡 Info (cyan)'], ['tip', '✅ Tip (green)'], ['warn', '⚠️ Warning (orange)']]) + '<input class="input" data-f="h" maxlength="120" placeholder="Title (optional)" value="' + esc(b.h) + '">' + rt(b.x, 'data-f="x"', 'Write the note…');
      else if (b.t === 'hr') c = '<div class="ae-hr">A divider line is shown here.</div>';
      return '<div class="ae-b' + (i === active ? ' on' : '') + '" data-i="' + i + '" data-t="' + b.t + '"><div class="ae-bh"><span>' + TYPES[b.t][0] + ' ' + TYPES[b.t][1] + '</span><span class="ae-ba"><button type="button" data-mv="-1"' + (i === 0 ? ' disabled' : '') + ' title="Move up">↑</button><button type="button" data-mv="1"' + (i === blocks.length - 1 ? ' disabled' : '') + ' title="Move down">↓</button><button type="button" data-dup title="Duplicate">⧉</button><button type="button" data-del title="Delete">✕</button></span></div><div class="ae-bc">' + c + '</div></div>';
    }
    function eqPreview(bl, tex) {
      const pv = bl.querySelector('.ae-eqp'); if (!pv) return;
      clearTimeout(pv._t);
      pv._t = setTimeout(() => { pv.removeAttribute('data-tex'); pv.innerHTML = ''; if (!String(tex || '').trim()) { pv.textContent = 'Preview appears here'; return; } pv.setAttribute('data-tex', tex); R.math(pv.parentElement); }, 250);
    }
    function drawBlocks() {
      box.innerHTML = blocks.map(blockHtml).join('') || '<div class="empty">Nothing here yet. Use the Add buttons below.</div>';
      box.querySelectorAll('.ae-b[data-t="eq"]').forEach(bl => eqPreview(bl, blocks[+bl.dataset.i].x));
    }
    const focusBlock = i => { const el = box.querySelector('.ae-b[data-i="' + i + '"] .ae-rt, .ae-b[data-i="' + i + '"] input.input, .ae-b[data-i="' + i + '"] textarea'); if (el) el.focus(); };
    function addBlock(t) {
      const at = active >= 0 && active < blocks.length ? active + 1 : blocks.length;
      blocks.splice(at, 0, NEW[t]()); active = at; mark(); drawBlocks(); focusBlock(at);
      const el = box.querySelector('.ae-b[data-i="' + at + '"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    function field(el) {
      const bl = el.closest('.ae-b'); if (!bl) return;
      const b = blocks[+bl.dataset.i]; if (!b) return;
      if (el.dataset.li !== undefined) b.i[+el.dataset.li] = el.innerHTML;
      else if (el.dataset.f) {
        const f = el.dataset.f; let v = el.isContentEditable ? el.innerHTML : el.value;
        if (el.dataset.num) v = +v; if (f === 'o') v = v === 'ol'; b[f] = v;
        if (b.t === 'eq' && f === 'x') eqPreview(bl, v);
        if (el.type === 'range') { const lb = el.parentElement.querySelector('b'); if (lb) lb.textContent = v + '%'; }
      }
      mark();
    }
    const atEnd = el => { const s = getSelection(); if (!s.rangeCount) return false; const r = s.getRangeAt(0).cloneRange(); r.selectNodeContents(el); r.setStart(s.focusNode, s.focusOffset); return r.toString() === ''; };

    box.addEventListener('input', e => field(e.target));
    box.addEventListener('change', e => { const el = e.target; if (el.tagName === 'SELECT') { field(el); if (el.dataset.f === 'o') drawBlocks(); } });
    box.addEventListener('focusin', e => {
      const b = e.target.closest('.ae-b'); if (!b) return;
      active = +b.dataset.i; lastField = e.target;
      box.querySelectorAll('.ae-b.on').forEach(x => x.classList.remove('on')); b.classList.add('on');
    });
    box.addEventListener('paste', e => {
      const el = e.target.closest && e.target.closest('.ae-rt'); if (!el) return;
      e.preventDefault(); const h = e.clipboardData.getData('text/html');
      if (h) document.execCommand('insertHTML', false, R.sanitize(h)); else document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
    });
    box.addEventListener('keydown', e => {
      const el = e.target; if (!el.classList || !el.classList.contains('ae-rt') || e.key !== 'Enter' || e.shiftKey) return;
      const i = +el.closest('.ae-b').dataset.i, blk = blocks[i];
      e.preventDefault();
      if (blk.t === 'list' && el.dataset.li !== undefined) { const k = +el.dataset.li; blk.i.splice(k + 1, 0, ''); mark(); drawBlocks(); const n = box.querySelector('.ae-b[data-i="' + i + '"] .ae-rt[data-li="' + (k + 1) + '"]'); if (n) n.focus(); return; }
      if (blk.t === 'p' && atEnd(el)) { blocks.splice(i + 1, 0, NEW.p()); active = i + 1; mark(); drawBlocks(); focusBlock(i + 1); return; }
      document.execCommand('insertLineBreak');
    });
    function pick(accept, multiple, cb) { const inp = document.createElement('input'); inp.type = 'file'; if (accept) inp.accept = accept; inp.multiple = !!multiple; inp.onchange = () => { if (inp.files.length) cb(Array.from(inp.files)); }; inp.click(); }
    async function upImg(f) { UI.toast('Uploading…'); try { const u = await HoloMedia.upload(f, { folder: 'articles', max: 1800 }); UI.toast('Picture ready.', 'success'); return u; } catch (er) { H.fail(er); return ''; } }
    box.addEventListener('click', e => {
      const bl = e.target.closest('.ae-b'); if (!bl) return;
      const i = +bl.dataset.i, blk = blocks[i], q = s => e.target.closest(s);
      if (q('[data-mv]')) { const j = i + +q('[data-mv]').dataset.mv; if (blocks[j]) { [blocks[i], blocks[j]] = [blocks[j], blocks[i]]; active = j; mark(); drawBlocks(); } }
      else if (q('[data-dup]')) { blocks.splice(i + 1, 0, clone(blk)); active = i + 1; mark(); drawBlocks(); }
      else if (q('[data-del]')) { blocks.splice(i, 1); active = -1; mark(); drawBlocks(); }
      else if (q('[data-addli]')) { blk.i.push(''); mark(); drawBlocks(); const n = box.querySelector('.ae-b[data-i="' + i + '"] .ae-rt[data-li="' + (blk.i.length - 1) + '"]'); if (n) n.focus(); }
      else if (q('[data-rmli]')) { blk.i.splice(+q('[data-rmli]').dataset.rmli, 1); if (!blk.i.length) blk.i.push(''); mark(); drawBlocks(); }
      else if (q('[data-imgup]')) pick('image/png,image/jpeg,image/webp,image/gif', false, async fs => { const u = await upImg(fs[0]); if (u) { blk.u = u; mark(); drawBlocks(); } });
      else if (q('[data-imgrm]')) { blk.u = ''; mark(); drawBlocks(); }
    });

    /* ---------- Text styling (works on the selected words) ---------- */
    function selChange() {
      const s = getSelection(); if (!s.rangeCount) return;
      const r = s.getRangeAt(0), n = r.commonAncestorContainer, el = n.nodeType === 3 ? n.parentElement : n, rtb = el && el.closest && el.closest('.ae-rt');
      if (rtb && root.contains(rtb)) { lastRange = r.cloneRange(); lastRt = rtb; }
    }
    function useRange() {
      if (!lastRt || !lastRt.isConnected) { UI.toast('Click inside a text box and select some words first.', 'warn'); return null; }
      lastRt.focus(); const s = getSelection(); s.removeAllRanges(); if (lastRange) s.addRange(lastRange); return lastRt;
    }
    const pushed = el => { if (el) el.dispatchEvent(new Event('input', { bubbles: true })); };
    function exec(cmd, val) { const el = useRange(); if (!el) return; document.execCommand('styleWithCSS', false, true); document.execCommand(cmd, false, val === undefined ? null : val); pushed(el); selChange(); }
    function wrap(tag, cls, size) {
      const el = useRange(); if (!el) return;
      const s = getSelection(); if (!s.rangeCount || s.isCollapsed) return UI.toast('Select some words first.', 'warn');
      const r = s.getRangeAt(0), frag = r.extractContents();
      if (size) frag.querySelectorAll('.fs-sm,.fs-lg,.fs-xl').forEach(x => { while (x.firstChild) x.parentNode.insertBefore(x.firstChild, x); x.remove(); });
      if (tag && (cls || tag !== 'span')) { const n = document.createElement(tag); if (cls) n.className = cls; n.appendChild(frag); r.insertNode(n); } else r.insertNode(frag);
      pushed(el); selChange();
    }
    async function addLink() {
      const el = useRange(); if (!el) return;
      if (getSelection().isCollapsed) return UI.toast('Select the words you want to turn into a link.', 'warn');
      const saved = lastRange.cloneRange();
      const url = await UI.prompt('Add a link', 'Paste the web address (or a page on this site like /news/all).', { placeholder: 'https://…' });
      if (!url || !url.trim()) return;
      let u = url.trim(); if (!/^(https?:\/\/|mailto:|\/|#)/i.test(u)) u = 'https://' + u;
      lastRange = saved; exec('createLink', u);
    }
    function raw(el, t) { const s = el.selectionStart == null ? el.value.length : el.selectionStart, e = el.selectionEnd == null ? s : el.selectionEnd; el.value = el.value.slice(0, s) + t + el.value.slice(e); el.setSelectionRange(s + t.length, s + t.length); el.focus(); el.dispatchEvent(new Event('input', { bubbles: true })); }
    function symbols() {
      R.symbolsDialog(code => {
        if (lastField && lastField.isConnected && /^(TEXTAREA|INPUT)$/.test(lastField.tagName) && lastField.dataset.f) { raw(lastField, lastField.tagName === 'TEXTAREA' ? code : '$' + code + '$'); return; }
        if (lastRt && lastRt.isConnected) { const el = useRange(); if (el) { document.execCommand('insertText', false, '$' + code + '$'); pushed(el); selChange(); } }
      });
    }
    const bar = $('.ae-fmt');
    bar.addEventListener('mousedown', e => { if (!e.target.closest('select, input')) e.preventDefault(); });
    bar.addEventListener('click', e => {
      const bt = e.target.closest('button'); if (!bt) return;
      if (bt.dataset.col) return exec('foreColor', bt.dataset.col);
      const c = bt.dataset.c; if (!c) return;
      if (c === 'code') wrap('code'); else if (c === 'hl') exec('hiliteColor', $('#ae-hl').value); else if (c === 'nohl') exec('hiliteColor', 'transparent');
      else if (c === 'link') addLink(); else if (c === 'clear') exec('removeFormat'); else if (c === 'sym') symbols(); else exec(c);
    });
    $('#ae-col').addEventListener('change', e => exec('foreColor', e.target.value));
    bar.querySelector('select').addEventListener('change', e => { const v = e.target.value; e.target.value = ''; if (v) wrap('span', v === 'n' ? '' : v, true); });

    /* ---------- Sidebar, buttons, tabs ---------- */
    const onP = e => { const el = e.target, k = el.dataset && el.dataset.p; if (!k) return; p[k] = el.type === 'checkbox' ? el.checked : el.value; mark(); };
    root.addEventListener('input', onP); root.addEventListener('change', onP);
    function view() {
      const bl = blocks.map(clean).filter(Boolean);
      return { type: o.kind, title: p.title || 'Untitled', category: p.category, summary: p.summary, cover_url: p.cover_url, author: p.author, date: row.created_at || new Date().toISOString(), read_min: bl.length ? R.readMin(bl) : 0, blocks: bl, files: p.files, toc: p.toc, external_url: p.external_url };
    }
    function setTab(t) {
      root.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
      $('.ae-edit').hidden = t !== 'edit'; const pv = $('.ae-prev'); pv.hidden = t !== 'prev';
      if (t === 'prev') { pv.innerHTML = HoloArticleView.html(view()); HoloArticleView.mount(pv, { preview: true }); $('.ae-body').scrollTop = 0; }
    }
    async function close() {
      if (dirty && !(await UI.confirm('Close without saving?', 'You have changes that are not saved yet. A draft stays in this browser.', { confirmText: 'Close', danger: true, cancelText: 'Keep writing' }))) return;
      shut();
    }
    async function save(btn) {
      const title = p.title.trim(); if (title.length < 3) return UI.toast('Please write a title (at least 3 letters).', 'warn');
      const bl = blocks.map(clean).filter(Boolean); if (!bl.length && !p.summary.trim()) return UI.toast('Add some content first.', 'warn');
      let ext = ''; if (isR && p.external_url.trim()) { ext = HC.normUrl(p.external_url); if (!ext) return UI.toast('The source link is not valid.', 'warn'); }
      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        const base = { title, category: p.category, summary: p.summary.trim() || null, cover_url: p.cover_url || null, published: p.published, files: p.files, read_min: bl.length ? R.readMin(bl) : null, opts: { toc: p.toc } };
        const body = R.plain(bl) || null;
        if (!isR) {
          const r = Object.assign(base, { blocks: bl, body, author_name: p.author.trim() || null, updated_at: new Date().toISOString() });
          const res = row.id ? await sb.from('articles').update(r).eq('id', row.id) : await sb.from('articles').insert(Object.assign(r, { author_id: H.user.id }));
          if (res.error) throw res.error;
        } else {
          const r = Object.assign(base, { authors: p.author.trim() || null });
          let id = row.id;
          if (id) { const res = await sb.from('researches').update(r).eq('id', id); if (res.error) throw res.error; }
          else { const res = await sb.from('researches').insert(r).select().single(); if (res.error) throw res.error; id = res.data.id; }
          const cr = await sb.from('research_content').upsert({ research_id: id, body, blocks: bl, external_url: ext || null, file_path: p.pdf || null }, { onConflict: 'research_id' });
          if (cr.error) throw cr.error;
        }
      } catch (er) { btn.disabled = false; btn.textContent = 'Save'; return H.fail(er); }
      try { localStorage.removeItem(key); } catch (e) {}
      dirty = false; UI.toast('Saved.', 'success'); shut(); if (o.done) o.done();
    }
    root.addEventListener('click', e => {
      const t = e.target.closest('[data-tab]'); if (t) return setTab(t.dataset.tab);
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act;
      if (act === 'save') save(a); else if (act === 'cancel') close(); else if (act === 'sym') symbols(); else if (act === 'add') addBlock(a.dataset.type);
      else if (act === 'cover') pick('image/png,image/jpeg,image/webp,image/gif', false, async fs => { const u = await upImg(fs[0]); if (u) { p.cover_url = u; mark(); drawSide(); } });
      else if (act === 'covrm') { p.cover_url = ''; mark(); drawSide(); }
      else if (act === 'addfile') pick('', true, async fs => { for (const f of fs) { try { UI.toast('Uploading ' + f.name + '…'); p.files.push(await uploadFile(f)); } catch (er) { H.fail(er); } } mark(); drawSide(); });
      else if (act === 'rmfile') { p.files.splice(+a.dataset.i, 1); mark(); drawSide(); }
      else if (act === 'rmpdf') { p.pdf = ''; mark(); drawSide(); }
    });

    /* ---------- Safety: draft autosave, leave warning, Ctrl+S ---------- */
    const timer = setInterval(() => { if (dirty) { try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), p, blocks })); } catch (e) {} } }, 4000);
    const guard = e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    function onKey(e) { if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 's') { e.preventDefault(); save($('[data-act="save"]')); } }
    function shut() { clearInterval(timer); removeEventListener('beforeunload', guard); document.removeEventListener('selectionchange', selChange); document.removeEventListener('keydown', onKey, true); root.remove(); document.body.classList.remove('no-scroll'); }
    addEventListener('beforeunload', guard); document.addEventListener('selectionchange', selChange); document.addEventListener('keydown', onKey, true);

    drawBlocks(); drawSide(); if (!row.id) $('.ae-title').focus();
  }

  window.HoloArticleEditor = { open };
})();
