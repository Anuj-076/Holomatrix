/* Holomatrix page builder for news and research.
   Write tab = block editor.  Preview tab = read-only preview OR "Edit on this page" (type straight into the page, change the size, width and position of each block).
   Selecting words shows a small floating styling bar above them. */
(function () {
  'use strict';
  if (window.HoloArticleEditor) return;
  const esc = UI.esc, clone = x => JSON.parse(JSON.stringify(x)), Z = '\u200b', unz = s => String(s).replace(/\u200b/g, '');
  const TYPES = { h: ['🔠', 'Heading'], p: ['¶', 'Text'], img: ['🖼️', 'Image'], vid: ['▶️', 'Video'], q: ['❝', 'Quote'], list: ['☰', 'List'], tbl: ['▦', 'Table'], eq: ['∑', 'Equation'], note: ['💡', 'Note box'], hr: ['➖', 'Divider line'] };
  const NEW = {
    h: () => ({ t: 'h', l: 2, x: '' }), p: () => ({ t: 'p', x: '', al: 'left' }), img: () => ({ t: 'img', u: '', c: '', a: '', w: 100, al: 'center' }),
    vid: () => ({ t: 'vid', u: '', c: '', w: 100, al: 'center' }), q: () => ({ t: 'q', x: '', by: '', src: '' }), list: () => ({ t: 'list', o: false, i: [''] }),
    tbl: () => ({ t: 'tbl', head: true, c: '', rows: [['', ''], ['', '']] }), eq: () => ({ t: 'eq', x: '', n: '' }), note: () => ({ t: 'note', k: 'info', h: '', x: '' }), hr: () => ({ t: 'hr' })
  };
  const SZ = '.fs-sm,.fs-lg,.fs-xl';
  const FC = ['#4de1ff', '#4169e1', '#ffffff', '#ef4444', '#f97316', '#facc15', '#22c55e', '#ec4899', '#8b5cf6', '#000000'];
  const HLC = ['#ffe066', '#67e8f9', '#86efac', '#f9a8d4', '#fdba74', '#c4b5fd'];
  const PH = { x: 'Type your text…', h: 'Heading', by: 'Name', li: 'List item', c: 'Caption (optional)', cell: 'Type…', title: 'Title', summary: 'Short summary (optional)' };
  const PH_IMG = '<figure class="ar-fig fa-center"><div class="ve-ph" data-vc="pic">🖼️ Click to add a picture</div></figure>';
  const PH_VID = '<figure class="ar-fig fa-center"><div class="ve-ph" data-vc="vlink">▶️ Click to add a video link</div></figure>';
  const fsize = n => !n ? '' : n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
  const need = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.body.appendChild(s); });
  const fromBody = body => { const t = String(body || '').trim(); return t ? t.split(/\n{2,}/).filter(Boolean).map(s => ({ t: 'p', x: esc(s).replace(/\n/g, '<br>'), al: 'left' })) : [{ t: 'p', x: '', al: 'left' }]; };
  const opt = (v, cur, label) => '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + label + '</option>';
  const rtOf = n => { const e = n && (n.nodeType === 3 ? n.parentElement : n); return e && e.closest ? e.closest('.ae-rt,[data-ve]') : null; };
  const empty = el => !el.textContent.replace(/\u200b/g, '').trim();

  const CSS = [
    '.ae-bub{position:fixed;z-index:9600;display:grid;gap:6px;padding:7px;border-radius:14px;background:var(--bg-2);border:1px solid var(--accent);box-shadow:var(--shadow)}.ae-bub[hidden]{display:none}',
    '.ae-bub-row,.ae-bub-pop{display:flex;flex-wrap:wrap;align-items:center;gap:4px;max-width:min(92vw,560px)}.ae-bub-pop{padding-top:6px;border-top:1px solid var(--border)}.ae-bub-pop[hidden]{display:none}',
    '.ae-bub button,.ve-ctl button,.ve-mode button{color:var(--text)}',
    '.ae-bub button{min-width:32px;height:32px;padding:0 9px;border-radius:8px;border:1px solid var(--border);background:var(--surface);font-weight:700;font-size:.82rem}.ae-bub button:hover{border-color:var(--accent)}',
    '.ae-bub button.on{background:var(--accent-grad);color:var(--on-accent);border-color:transparent}.ae-bub i.sep{width:1px;height:22px;background:var(--border);margin:0 2px}',
    '.ae-bub .sw{min-width:24px;width:24px;height:24px;padding:0;border-radius:50%}.ae-pick{position:fixed;left:-100px;top:0;width:1px;height:1px;opacity:0;pointer-events:none}',
    '.ae-hint{font-size:.82rem;color:var(--muted);margin:-4px 0 12px}.ae-opt{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.ae-opt input[type=range]{vertical-align:middle;margin-left:6px;width:130px}',
    '.ae-tbl-s{overflow-x:auto}.ae-tbl{border-collapse:collapse;width:100%}.ae-tbl td{border:1px solid var(--border);padding:3px;min-width:130px;vertical-align:top}.ae-tbl .ae-rt{min-height:2.2em;border:0;padding:6px 8px;background:transparent}',
    '.ve-mode{position:sticky;top:0;z-index:6;display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:10px 12px;margin-bottom:16px;border:1px solid var(--border);border-radius:14px;background:var(--bg-2)}',
    '.ve-mode button{padding:8px 14px;border-radius:999px;border:1px solid var(--border);font-weight:600;font-size:.85rem}.ve-mode button.on{background:var(--accent-grad);color:var(--on-accent);border-color:transparent}.ve-mode span{font-size:.82rem;color:var(--muted)}',
    '.ve-b{position:relative}.ve-edit .ve-b:hover{outline:1px dashed color-mix(in srgb,var(--accent) 70%,transparent);outline-offset:6px;border-radius:6px}',
    '.ve-edit [data-ve]{outline:0;cursor:text}.ve-edit [data-ve]:hover{background:color-mix(in srgb,var(--accent) 7%,transparent)}.ve-edit [data-ve]:focus{background:color-mix(in srgb,var(--accent) 10%,transparent);border-radius:4px}',
    '.ve-e::before{content:attr(data-ph);color:var(--muted);opacity:.55;pointer-events:none}',
    '.ve-ctl{position:absolute;right:6px;top:-16px;z-index:5;display:none;gap:4px;align-items:center;flex-wrap:wrap;padding:5px 7px;border-radius:12px;background:var(--bg-2);border:1px solid var(--accent);box-shadow:var(--shadow);max-width:calc(100% - 12px);font-size:.78rem;font-weight:400;line-height:1.2;text-align:left}',
    '.ve-b:hover>.ve-ctl,.ve-b:focus-within>.ve-ctl{display:flex}',
    '.ve-ctl button{min-width:28px;height:26px;padding:0 7px;border-radius:7px;border:1px solid var(--border);font-weight:700;font-size:.78rem;background:var(--surface)}.ve-ctl button:hover{border-color:var(--accent)}',
    '.ve-ctl button.on{background:var(--accent-grad);color:var(--on-accent);border-color:transparent}.ve-ctl input[type=range]{width:96px}.ve-ctl i.sep{width:1px;height:18px;background:var(--border)}',
    '.ve-ph{padding:26px;text-align:center;border:1px dashed var(--border);border-radius:14px;color:var(--muted);cursor:pointer}'
  ].join('');
  function injectCss() { if (document.getElementById('ae-x-css')) return; const s = document.createElement('style'); s.id = 'ae-x-css'; s.textContent = CSS; document.head.appendChild(s); }

  /* what gets saved: safe text, no empty blocks */
  function clean(b) {
    const R = window.HoloRich, has = h => R.textOf(h).trim(), s = v => String(v || '').trim();
    const bx = o => { if (+b.bw >= 40 && +b.bw < 100) o.bw = Math.round(+b.bw); if (['center', 'right'].indexOf(b.bal) > -1) o.bal = b.bal; if (['sm', 'lg', 'xl'].indexOf(b.sz) > -1) o.sz = b.sz; return o; };
    if (!b) return null;
    if (b.t === 'h') return s(b.x) ? { t: 'h', l: +b.l === 3 ? 3 : 2, x: s(b.x) } : null;
    if (b.t === 'p') return has(b.x) ? bx({ t: 'p', x: R.sanitize(b.x), al: ['center', 'right', 'justify'].indexOf(b.al) > -1 ? b.al : 'left' }) : null;
    if (b.t === 'img') return b.u ? { t: 'img', u: b.u, c: s(b.c), a: s(b.a), w: Math.min(100, Math.max(20, +b.w || 100)), al: ['left', 'right'].indexOf(b.al) > -1 ? b.al : 'center' } : null;
    if (b.t === 'vid') return R.videoId(b.u) ? { t: 'vid', u: s(b.u), c: s(b.c), w: Math.min(100, Math.max(20, +b.w || 100)), al: ['left', 'right'].indexOf(b.al) > -1 ? b.al : 'center' } : null;
    if (b.t === 'q') return has(b.x) ? bx({ t: 'q', x: R.sanitize(b.x), by: s(b.by), src: s(b.src) }) : null;
    if (b.t === 'list') { const i = (b.i || []).map(x => R.sanitize(x)).filter(x => has(x)); return i.length ? bx({ t: 'list', o: !!b.o, i }) : null; }
    if (b.t === 'tbl') {
      const rows = (b.rows || []).map(r => (r || []).map(x => R.sanitize(x))), n = Math.max.apply(null, [0].concat(rows.map(r => r.length)));
      if (!n || !rows.some(r => r.some(x => has(x)))) return null;
      return { t: 'tbl', head: b.head !== false, c: s(b.c), rows: rows.map(r => { const o = r.slice(); while (o.length < n) o.push(''); return o; }) };
    }
    if (b.t === 'eq') return s(b.x) ? bx({ t: 'eq', x: s(b.x), n: s(b.n) }) : null;
    if (b.t === 'note') return (has(b.x) || s(b.h)) ? bx({ t: 'note', k: ['warn', 'tip'].indexOf(b.k) > -1 ? b.k : 'info', h: s(b.h), x: R.sanitize(b.x) }) : null;
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
    injectCss();

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
    blocks.forEach(b => {                                          /* every table row gets the same number of cells */
      if (b.t !== 'tbl') return;
      const rows = b.rows && b.rows.length ? b.rows : [['']], n = Math.max.apply(null, rows.map(r => (r || []).length).concat([1]));
      b.rows = rows.map(r => Array.from({ length: n }, (_, k) => (r || [])[k] || ''));
    });

    let dirty = false, active = -1, lastRange = null, lastRt = null, lastField = null, lastCell = null, tab = 'edit', pmode = false, busy = false, pickerOpen = false, drag = false, picking = '', pop = '', raf = 0;
    const mark = () => { dirty = true; };

    /* ---------- Shell ---------- */
    const addBarHtml = '<div class="ae-add"><b style="align-self:center;color:var(--muted);font-size:.85rem">Add:</b>' + Object.keys(TYPES).map(t => '<button type="button" data-act="add" data-type="' + t + '">' + TYPES[t][0] + ' ' + TYPES[t][1] + '</button>').join('') + '</div>';
    const root = document.createElement('div'); root.className = 'ae-full ed-ui';
    root.innerHTML =
      '<div class="ae-bar"><strong>' + (row.id ? 'Edit ' : 'New ') + (isR ? 'research' : 'article') + '</strong><a class="ae-guide" href="/admin#guide" target="_blank" rel="noopener">📘 Writing guide (opens in a new tab)</a><span class="grow"></span>' +
      '<div class="seg"><button type="button" data-tab="edit" class="on">✏️ Write</button><button type="button" data-tab="prev">👁 Preview</button></div>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-act="sym">Ω Symbol codes</button><button type="button" class="btn btn-ghost btn-sm" data-act="cancel">Close</button><button type="button" class="btn btn-primary btn-sm" data-act="save">Save</button></div>' +
      '<div class="ae-body"><div class="ae-edit"><div class="ae-main">' +
      '<input class="ae-title" data-p="title" maxlength="200" placeholder="Title" value="' + esc(p.title) + '">' +
      '<textarea class="ae-sum" data-p="summary" maxlength="500" placeholder="Short summary (shown on the cards and above the article)">' + esc(p.summary) + '</textarea>' +
      '<p class="ae-hint">Tip: select any words to get the styling bar (bold, colour, link…). Use <b>Preview → Edit on this page</b> to type straight into the finished page.</p>' +
      '<div id="ae-blocks"></div>' + addBarHtml + '</div><aside class="ae-side"></aside></div><div class="ae-prev" hidden></div></div>' +
      '<div class="ae-bub" id="ae-bub" hidden><div class="ae-bub-row">' +
      '<button type="button" data-c="bold" title="Bold"><b>B</b></button><button type="button" data-c="italic" title="Italic"><i>I</i></button><button type="button" data-c="underline" title="Underline"><u>U</u></button><button type="button" data-c="strikeThrough" title="Strikethrough"><s>S</s></button>' +
      '<button type="button" data-c="superscript" title="Superscript">x²</button><button type="button" data-c="subscript" title="Subscript">x₂</button><button type="button" data-c="code" title="Code">&lt;/&gt;</button><i class="sep"></i>' +
      '<button type="button" data-pop="size">Size ▾</button><button type="button" data-pop="color">Colour ▾</button><button type="button" data-pop="hl">Highlight ▾</button><i class="sep"></i>' +
      '<button type="button" data-c="link">Link</button><button type="button" data-c="unlink">Unlink</button><button type="button" data-c="clear" title="Remove all styling">Clear</button></div><div class="ae-bub-pop" hidden></div></div>' +
      '<input type="color" id="ae-pick" class="ae-pick" tabindex="-1">';
    document.body.appendChild(root); document.body.classList.add('no-scroll');
    const $ = s => root.querySelector(s), box = $('#ae-blocks'), bub = $('#ae-bub'), pickEl = $('#ae-pick'), prevEl = $('.ae-prev');

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

    /* ---------- Write tab: the blocks ---------- */
    const rt = (html, attr, ph) => '<div class="ae-rt" contenteditable="true" ' + attr + ' data-ph="' + esc(ph) + '">' + R.sanitize(html) + '</div>';
    const sel = (f, cur, opts, num) => '<select class="input" style="width:auto;max-width:100%" data-f="' + f + '"' + (num ? ' data-num="1"' : '') + '>' + opts.map(x => opt(x[0], cur, x[1])).join('') + '</select>';
    const bx = (b, extra) => '<div class="ae-opt">' + (extra || '') + sel('sz', b.sz || '', [['', 'Normal size'], ['sm', 'Small text'], ['lg', 'Large text'], ['xl', 'Huge text']]) + sel('bal', b.bal || 'left', [['left', 'Box left'], ['center', 'Box centre'], ['right', 'Box right']]) +
      '<label style="font-size:.8rem;color:var(--muted)">Box width <b>' + (b.bw || 100) + '%</b><input type="range" min="40" max="100" data-f="bw" data-num="1" value="' + (b.bw || 100) + '"></label></div>';
    const wp = b => '<div class="two"><div class="field"><label>Width <b>' + (b.w || 100) + '%</b></label><input type="range" min="20" max="100" data-f="w" data-num="1" value="' + (b.w || 100) + '"></div><div class="field"><label>Position</label>' + sel('al', b.al || 'center', [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']]) + '</div></div>';
    function blockHtml(b, i) {
      let c = '';
      if (b.t === 'h') c = sel('l', b.l === 3 ? 3 : 2, [[2, 'Big heading'], [3, 'Small heading']], true) + '<input class="input" data-f="x" maxlength="200" placeholder="Heading text" value="' + esc(b.x) + '">';
      else if (b.t === 'p') c = rt(b.x, 'data-f="x"', 'Write your text here… select words to style them. Use $…$ for maths.') + bx(b, sel('al', b.al || 'left', [['left', 'Align left'], ['center', 'Centre'], ['right', 'Align right'], ['justify', 'Justify']]));
      else if (b.t === 'img') c = '<div class="ae-img">' + (b.u ? '<img src="' + esc(b.u) + '" alt="">' : '<div class="ae-ph">No picture yet</div>') + '<div style="display:flex;gap:6px"><button type="button" class="ib" data-imgup>📷 ' + (b.u ? 'Replace' : 'Upload') + '</button><button type="button" class="ib" data-imgrm>✕</button></div></div>' +
        '<input class="input" data-f="c" maxlength="300" placeholder="Caption (optional)" value="' + esc(b.c) + '"><input class="input" data-f="a" maxlength="200" placeholder="Describe the picture for screen readers (optional)" value="' + esc(b.a) + '">' + wp(b);
      else if (b.t === 'vid') { const v = R.videoId(b.u); c = '<input class="input" data-f="u" placeholder="Paste a YouTube or Vimeo link" value="' + esc(b.u) + '"><div class="hint" style="margin:0">' + (!b.u ? 'Example: https://www.youtube.com/watch?v=…' : v ? '✓ ' + (v.k === 'yt' ? 'YouTube' : 'Vimeo') + ' video recognised' : '⚠️ This link is not recognised') + '</div><input class="input" data-f="c" maxlength="300" placeholder="Caption (optional)" value="' + esc(b.c) + '">' + wp(b); }
      else if (b.t === 'q') c = rt(b.x, 'data-f="x"', 'Type the quote…') + '<div class="two"><input class="input" data-f="by" maxlength="120" placeholder="Name (shown as — Name)" value="' + esc(b.by) + '"><input class="input" data-f="src" maxlength="160" placeholder="Role or source (optional)" value="' + esc(b.src) + '"></div>' + bx(b);
      else if (b.t === 'list') c = sel('o', b.o ? 'ol' : 'ul', [['ul', 'Bullet points'], ['ol', 'Numbered']]) + (b.i || ['']).map((x, k) => '<div class="ae-li"><span>' + (b.o ? (k + 1) + '.' : '•') + '</span>' + rt(x, 'data-li="' + k + '"', 'List item') + '<button type="button" class="ib" data-rmli="' + k + '">✕</button></div>').join('') + '<div><button type="button" class="ib" data-addli>＋ Add item</button></div>' + bx(b);
      else if (b.t === 'tbl') c = '<div class="ae-tbl-s"><table class="ae-tbl">' + b.rows.map((r, ri) => '<tr>' + r.map((x, ci) => '<td>' + rt(x, 'data-cell="' + ri + ':' + ci + '"', ri === 0 && b.head !== false ? 'Header' : 'Cell') + '</td>').join('') + '</tr>').join('') + '</table></div>' +
        '<div class="ae-opt"><button type="button" class="ib" data-tb="ar">＋ Row</button><button type="button" class="ib" data-tb="ac">＋ Column</button><button type="button" class="ib" data-tb="dr">− Row</button><button type="button" class="ib" data-tb="dc">− Column</button><label class="chk" style="margin:0"><input type="checkbox" data-f="head"' + (b.head !== false ? ' checked' : '') + '> First row is a header</label></div>' +
        '<div class="hint" style="margin:0">Click a cell first: the ＋ and − buttons then work on that cell\'s row or column.</div><input class="input" data-f="c" maxlength="300" placeholder="Caption (optional)" value="' + esc(b.c) + '">';
      else if (b.t === 'eq') c = '<textarea class="input ae-code" data-f="x" placeholder="LaTeX code, e.g.  E = mc^{2}   (open Symbol codes for help)">' + esc(b.x) + '</textarea><div class="ae-eqp">Preview appears here</div><input class="input" data-f="n" maxlength="20" placeholder="Label on the right, e.g. (1) (optional)" value="' + esc(b.n) + '">' + bx(b);
      else if (b.t === 'note') c = sel('k', b.k || 'info', [['info', '💡 Info (cyan)'], ['tip', '✅ Tip (green)'], ['warn', '⚠️ Warning (orange)']]) + '<input class="input" data-f="h" maxlength="120" placeholder="Title (optional)" value="' + esc(b.h) + '">' + rt(b.x, 'data-f="x"', 'Write the note…') + bx(b);
      else if (b.t === 'hr') c = '<div class="ae-hr">A divider line is shown here.</div>';
      return '<div class="ae-b' + (i === active ? ' on' : '') + '" data-i="' + i + '" data-t="' + b.t + '"><div class="ae-bh"><span>' + TYPES[b.t][0] + ' ' + TYPES[b.t][1] + '</span><span class="ae-ba"><button type="button" data-mv="-1"' + (i === 0 ? ' disabled' : '') + ' title="Move up">↑</button><button type="button" data-mv="1"' + (i === blocks.length - 1 ? ' disabled' : '') + ' title="Move down">↓</button><button type="button" data-dup title="Duplicate">⧉</button><button type="button" data-del title="Delete">✕</button></span></div><div class="ae-bc">' + c + '</div></div>';
    }
    function eqPreview(bl, tex) {
      const pv = bl.querySelector('.ae-eqp'); if (!pv) return;
      clearTimeout(pv._t);
      pv._t = setTimeout(() => { pv.removeAttribute('data-tex'); pv.innerHTML = ''; if (!String(tex || '').trim()) { pv.textContent = 'Preview appears here'; return; } pv.setAttribute('data-tex', tex); R.math(pv.parentElement, { tex: true }); }, 250);
    }
    function drawBlocks() {
      box.innerHTML = blocks.map(blockHtml).join('') || '<div class="empty">Nothing here yet. Use the Add buttons below.</div>';
      box.querySelectorAll('.ae-b[data-t="eq"]').forEach(bl => eqPreview(bl, blocks[+bl.dataset.i].x));
    }
    const redraw = () => { if (tab === 'prev') drawPage(); else drawBlocks(); };
    function tableOp(b, op, i) {
      const cur = lastCell && lastCell.i === i ? lastCell : null, cols = b.rows[0].length;
      if (op === 'ar') b.rows.splice(cur ? cur.r + 1 : b.rows.length, 0, Array(cols).fill(''));
      else if (op === 'ac') b.rows.forEach(r => r.splice(cur ? cur.c + 1 : cols, 0, ''));
      else if (op === 'dr') { if (b.rows.length > 1) b.rows.splice(cur ? cur.r : b.rows.length - 1, 1); }
      else if (op === 'dc') { if (cols > 1) b.rows.forEach(r => r.splice(cur ? cur.c : cols - 1, 1)); }
      lastCell = null; mark(); redraw();
    }
    const focusBlock = i => { const el = box.querySelector('.ae-b[data-i="' + i + '"] .ae-rt, .ae-b[data-i="' + i + '"] input.input, .ae-b[data-i="' + i + '"] textarea'); if (el) el.focus(); };
    function focusPage(i, k) {
      const w = prevEl.querySelector('.ve-b[data-i="' + i + '"]'); if (!w) return;
      const el = k !== undefined ? w.querySelector('[data-ve="li"][data-k="' + k + '"]') : w.querySelector('[data-ve]'); if (!el) return;
      el.focus(); const s = getSelection(), r = document.createRange(); r.selectNodeContents(el); r.collapse(true); s.removeAllRanges(); s.addRange(r);
    }
    function addBlock(t) {
      const at = active >= 0 && active < blocks.length ? active + 1 : blocks.length;
      blocks.splice(at, 0, NEW[t]()); active = at; mark(); redraw();
      if (tab === 'prev') focusPage(at);
      else { focusBlock(at); const el = box.querySelector('.ae-b[data-i="' + at + '"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }
    function field(el) {
      const bl = el.closest('.ae-b'); if (!bl) return;
      const b = blocks[+bl.dataset.i]; if (!b) return;
      if (el.dataset.li !== undefined) b.i[+el.dataset.li] = el.innerHTML;
      else if (el.dataset.cell) { const rc = el.dataset.cell.split(':'); b.rows[+rc[0]][+rc[1]] = el.innerHTML; }
      else if (el.dataset.f) {
        const f = el.dataset.f; let v = el.type === 'checkbox' ? el.checked : el.isContentEditable ? el.innerHTML : el.value;
        if (el.dataset.num) v = +v; if (f === 'o') v = v === 'ol'; b[f] = v;
        if (b.t === 'eq' && f === 'x') eqPreview(bl, v);
        if (el.type === 'range') { const lb = el.parentElement.querySelector('b'); if (lb) lb.textContent = v + '%'; }
      }
      mark();
    }
    const atEnd = el => { const s = getSelection(); if (!s.rangeCount) return false; const r = s.getRangeAt(0).cloneRange(); r.selectNodeContents(el); r.setStart(s.focusNode, s.focusOffset); return r.toString() === ''; };

    box.addEventListener('input', e => field(e.target));
    box.addEventListener('change', e => { const el = e.target; if (el.tagName === 'SELECT') field(el); if ((el.tagName === 'SELECT' && el.dataset.f === 'o') || el.dataset.f === 'u') drawBlocks(); });
    box.addEventListener('focusin', e => {
      const b = e.target.closest('.ae-b'); if (!b) return;
      active = +b.dataset.i; lastField = e.target;
      if (e.target.dataset && e.target.dataset.cell) { const rc = e.target.dataset.cell.split(':'); lastCell = { i: active, r: +rc[0], c: +rc[1] }; }
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
    const IMG = 'image/png,image/jpeg,image/webp,image/gif';
    box.addEventListener('click', e => {
      const bl = e.target.closest('.ae-b'); if (!bl) return;
      const i = +bl.dataset.i, blk = blocks[i], q = s => e.target.closest(s);
      if (q('[data-mv]')) { const j = i + +q('[data-mv]').dataset.mv; if (blocks[j]) { [blocks[i], blocks[j]] = [blocks[j], blocks[i]]; active = j; mark(); drawBlocks(); } }
      else if (q('[data-dup]')) { blocks.splice(i + 1, 0, clone(blk)); active = i + 1; mark(); drawBlocks(); }
      else if (q('[data-del]')) { blocks.splice(i, 1); active = -1; mark(); drawBlocks(); }
      else if (q('[data-tb]')) tableOp(blk, q('[data-tb]').dataset.tb, i);
      else if (q('[data-addli]')) { blk.i.push(''); mark(); drawBlocks(); const n = box.querySelector('.ae-b[data-i="' + i + '"] .ae-rt[data-li="' + (blk.i.length - 1) + '"]'); if (n) n.focus(); }
      else if (q('[data-rmli]')) { blk.i.splice(+q('[data-rmli]').dataset.rmli, 1); if (!blk.i.length) blk.i.push(''); mark(); drawBlocks(); }
      else if (q('[data-imgup]')) pick(IMG, false, async fs => { const u = await upImg(fs[0]); if (u) { blk.u = u; mark(); drawBlocks(); } });
      else if (q('[data-imgrm]')) { blk.u = ''; mark(); drawBlocks(); }
    });

    /* ---------- Floating styling bar (only while words are selected) ---------- */
    function remember() { const s = getSelection(); if (!s.rangeCount) return; const r = rtOf(s.anchorNode); if (r && root.contains(r)) { lastRt = r; lastRange = s.getRangeAt(0).cloneRange(); } }
    function restore() {
      if (!lastRt || !lastRt.isConnected || !lastRange) { UI.toast('Select some words first.', 'warn'); return null; }
      if (document.activeElement !== lastRt) lastRt.focus();
      const s = getSelection(); s.removeAllRanges(); s.addRange(lastRange); return lastRt;
    }
    const pushed = el => { if (el) el.dispatchEvent(new Event('input', { bubbles: true })); };
    const sched = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(refresh); };
    const done = el => { pushed(el); remember(); sched(); };
    function hide() { bub.hidden = true; pop = ''; const pp = bub.querySelector('.ae-bub-pop'); pp.hidden = true; pp.innerHTML = ''; }
    function place() {
      if (bub.hidden) return; const s = getSelection(); if (!s.rangeCount || s.isCollapsed) return;
      const rc = s.getRangeAt(0).getBoundingClientRect(); if (!rc.width && !rc.height) return;
      const bw = bub.offsetWidth, bh = bub.offsetHeight; let top = rc.top - bh - 10; if (top < 62) top = rc.bottom + 10;
      bub.style.top = Math.max(8, Math.min(innerHeight - bh - 8, top)) + 'px'; bub.style.left = Math.max(8, Math.min(innerWidth - bw - 8, rc.left + rc.width / 2 - bw / 2)) + 'px';
    }
    function refresh() {
      if (pickerOpen || busy) return;
      const s = getSelection(); if (!s.rangeCount) return hide();
      const a = rtOf(s.anchorNode), f = rtOf(s.focusNode), rtb = a || f;
      if (!rtb || !root.contains(rtb)) return hide();
      let r = s.getRangeAt(0);
      if (s.isCollapsed) { lastRt = rtb; lastRange = r.cloneRange(); return hide(); }
      if (a !== f) {                                           /* selection runs outside one text box: keep only the part inside it */
        const nr = document.createRange(); nr.selectNodeContents(rtb);
        if (rtb.contains(r.startContainer)) nr.setStart(r.startContainer, r.startOffset);
        if (rtb.contains(r.endContainer)) nr.setEnd(r.endContainer, r.endOffset);
        r = nr; s.removeAllRanges(); s.addRange(nr);
      }
      lastRt = rtb; lastRange = r.cloneRange();
      if (rtb.dataset.plain || drag) return hide();
      bub.hidden = false;
      ['bold', 'italic', 'underline', 'strikeThrough', 'superscript', 'subscript'].forEach(c => { const b = bub.querySelector('[data-c="' + c + '"]'); if (b) { let on = false; try { on = document.queryCommandState(c); } catch (e) {} b.classList.toggle('on', on); } });
      place();
    }
    function exec(cmd, val) {
      const el = restore(); if (!el) return;
      document.execCommand('styleWithCSS', false, true); document.execCommand(cmd, false, val === undefined ? null : val); done(el);
    }
    /* takes the selected words out of any <selector> that wraps them, and removes <selector> inside them */
    function peel(el, selector) {
      const s = getSelection(); let r = s.getRangeAt(0), removed = false;
      const n0 = r.commonAncestorContainer, anc = (n0.nodeType === 3 ? n0.parentElement : n0).closest(selector);
      if (anc && el.contains(anc)) {
        const pre = document.createRange(); pre.setStart(anc, 0); pre.setEnd(r.startContainer, r.startOffset);
        const post = document.createRange(); post.setStart(r.endContainer, r.endOffset); post.setEnd(anc, anc.childNodes.length);
        const left = pre.extractContents(), right = post.extractContents();
        if (left.textContent) { const c = anc.cloneNode(false); c.appendChild(left); anc.parentNode.insertBefore(c, anc); }
        if (right.textContent) { const c = anc.cloneNode(false); c.appendChild(right); anc.parentNode.insertBefore(c, anc.nextSibling); }
        const kids = Array.from(anc.childNodes);
        if (kids.length) { kids.forEach(k => anc.parentNode.insertBefore(k, anc)); anc.remove(); r = document.createRange(); r.setStartBefore(kids[0]); r.setEndAfter(kids[kids.length - 1]); removed = true; }
      }
      const frag = r.extractContents();
      frag.querySelectorAll(selector).forEach(x => { removed = true; while (x.firstChild) x.parentNode.insertBefore(x.firstChild, x); x.remove(); });
      r.insertNode(frag);
      return { r, removed };
    }
    function wrapSel(tag, cls) {
      const el = restore(); if (!el) return; const s = getSelection(); if (!s.rangeCount || s.isCollapsed) return;
      const { r, removed } = peel(el, tag === 'code' ? 'code' : SZ); let sel = r;
      if (tag && !(tag === 'code' && removed) && (cls || tag === 'code')) { const f = r.extractContents(), n = document.createElement(tag); if (cls) n.className = cls; n.appendChild(f); r.insertNode(n); sel = document.createRange(); sel.selectNodeContents(n); }
      s.removeAllRanges(); s.addRange(sel); done(el);
    }
    function clearFmt() {
      const el = restore(); if (!el) return; document.execCommand('removeFormat');
      const s = getSelection(); if (s.rangeCount && !s.isCollapsed) { const { r } = peel(el, SZ + ',code,a,mark'); s.removeAllRanges(); s.addRange(r); }
      done(el);
    }
    async function addLink() {
      const el = restore(); if (!el) return;
      if (lastRange.collapsed) return UI.toast('Select the words you want to turn into a link.', 'warn');
      const saved = lastRange.cloneRange(); busy = true;
      const url = await UI.prompt('Add a link', 'Paste the web address (or a page on this site like /news/all).', { placeholder: 'https://…' });
      busy = false; lastRange = saved;
      if (!url || !url.trim()) { restore(); return; }
      let u = url.trim(); if (!/^(https?:\/\/|mailto:|\/|#)/i.test(u)) u = 'https://' + u;
      exec('createLink', u);
    }
    function popHtml(k) {
      if (k === 'size') return [['fs-sm', 'Small'], ['', 'Normal'], ['fs-lg', 'Large'], ['fs-xl', 'Huge']].map(x => '<button type="button" data-size="' + x[0] + '">' + x[1] + '</button>').join('');
      if (k === 'color') return FC.map(c => '<button type="button" class="sw" data-col="' + c + '" style="background:' + c + '" title="' + c + '"></button>').join('') + '<button type="button" data-custom="fore">Other…</button>';
      return HLC.map(c => '<button type="button" class="sw" data-hl="' + c + '" style="background:' + c + '"></button>').join('') + '<button type="button" data-hl="none">None</button><button type="button" data-custom="hl">Other…</button>';
    }
    bub.addEventListener('mousedown', e => e.preventDefault());           /* keeps your selection while you click */
    bub.addEventListener('click', e => {
      const bt = e.target.closest('button'); if (!bt) return;
      const d = bt.dataset;
      if (d.pop) { pop = pop === d.pop ? '' : d.pop; const pp = bub.querySelector('.ae-bub-pop'); pp.hidden = !pop; pp.innerHTML = pop ? popHtml(pop) : ''; place(); return; }
      if (d.size !== undefined) { wrapSel('span', d.size); return; }
      if (d.col) return exec('foreColor', d.col);
      if (d.hl) return exec('hiliteColor', d.hl === 'none' ? 'transparent' : d.hl);
      if (d.custom) { picking = d.custom; pickerOpen = true; pickEl.click(); return; }
      if (d.c === 'code') wrapSel('code'); else if (d.c === 'link') addLink(); else if (d.c === 'clear') clearFmt(); else if (d.c) exec(d.c);
    });
    pickEl.addEventListener('change', () => { pickerOpen = false; exec(picking === 'hl' ? 'hiliteColor' : 'foreColor', pickEl.value); });
    root.addEventListener('mousedown', e => { drag = !!(e.target.closest && e.target.closest('.ae-rt,[data-ve]')); if (pickerOpen && !e.target.closest('#ae-pick')) { pickerOpen = false; sched(); } });

    /* ---------- Symbols ---------- */
    function raw(el, t) { const s = el.selectionStart == null ? el.value.length : el.selectionStart, e = el.selectionEnd == null ? s : el.selectionEnd; el.value = el.value.slice(0, s) + t + el.value.slice(e); el.setSelectionRange(s + t.length, s + t.length); el.focus(); el.dispatchEvent(new Event('input', { bubbles: true })); }
    function symbols() {
      R.symbolsDialog(code => {
        if (lastField && lastField.isConnected && /^(TEXTAREA|INPUT)$/.test(lastField.tagName) && lastField.dataset.f && tab === 'edit') { raw(lastField, lastField.tagName === 'TEXTAREA' ? code : '$' + code + '$'); return; }
        if (lastRt && lastRt.isConnected) { const el = restore(); if (el) { document.execCommand('insertText', false, '$' + code + '$'); done(el); } }
      });
    }

    /* ---------- Preview tab: read-only preview or "Edit on this page" ---------- */
    function view() {
      const bl = blocks.map(clean).filter(Boolean);
      return { type: o.kind, title: p.title || 'Untitled', category: p.category, summary: p.summary, cover_url: p.cover_url, author: p.author, date: row.created_at || new Date().toISOString(), read_min: bl.length ? R.readMin(bl) : 0, blocks: bl, files: p.files, toc: p.toc, external_url: p.external_url };
    }
    function ghost(b) {                                          /* empty blocks get an invisible character so they can be clicked and typed in */
      const g = clone(b), blank = h => !R.textOf(h).trim();
      if (g.t === 'h') { if (!String(g.x || '').trim()) g.x = Z; }
      else if (g.t === 'p') { if (blank(g.x)) g.x = Z; }
      else if (g.t === 'q') { if (blank(g.x)) g.x = Z; g.by = g.by || Z; }
      else if (g.t === 'note') { if (blank(g.x)) g.x = Z; g.h = g.h || Z; }
      else if (g.t === 'list') g.i = (g.i && g.i.length ? g.i : ['']).map(x => blank(x) ? Z : x);
      else if (g.t === 'tbl') g.rows = (g.rows && g.rows.length ? g.rows : [['']]).map(r => r.map(x => blank(x) ? Z : x));
      else if (g.t === 'eq') { if (!String(g.x || '').trim()) g.x = '\\text{Click Edit code to write an equation}'; }
      else if (g.t === 'img') g.c = g.c || Z;
      return g;
    }
    const part = i => { const b = blocks[i], h = R.render([ghost(b)]).parts[0]; return h || (b.t === 'img' ? PH_IMG : b.t === 'vid' ? PH_VID : ''); };
    function ctl(b, i) {
      const bt = (a, t, tip, on) => '<button type="button" data-vc="' + a + '"' + (on ? ' class="on"' : '') + ' title="' + tip + '">' + t + '</button>', sep = '<i class="sep"></i>';
      const pos = cur => bt('pos-left', '⬅', 'Left', cur === 'left') + bt('pos-center', '⬌', 'Centre', cur === 'center') + bt('pos-right', '➡', 'Right', cur === 'right');
      let s = bt('up', '↑', 'Move up') + bt('down', '↓', 'Move down') + bt('dup', '⧉', 'Duplicate') + bt('del', '✕', 'Delete');
      if (b.t === 'img' || b.t === 'vid') s += sep + (b.t === 'img' ? bt('pic', '📷', 'Replace picture') : bt('vlink', '✎ Link', 'Change the video link')) + '<input type="range" min="20" max="100" data-vw="w" value="' + (b.w || 100) + '" title="Width">' + pos(b.al || 'center');
      else if (b.t === 'h') s += sep + bt('lv2', 'H2', 'Big heading', b.l !== 3) + bt('lv3', 'H3', 'Small heading', b.l === 3);
      else if (b.t === 'tbl') s += sep + bt('tb-ar', '＋Row', 'Add a row under the cell you clicked') + bt('tb-ac', '＋Col', 'Add a column after the cell you clicked') + bt('tb-dr', '−Row', 'Delete the row of the cell you clicked') + bt('tb-dc', '−Col', 'Delete the column of the cell you clicked') + bt('tb-hd', 'Header', 'First row is a header', b.head !== false);
      else if (b.t !== 'hr') {
        s += sep + [['', 'M'], ['sm', 'S'], ['lg', 'L'], ['xl', 'XL']].map(z => bt('sz-' + z[0], z[1], 'Text size', (b.sz || '') === z[0])).join('') + sep + '<input type="range" min="40" max="100" data-vw="bw" value="' + (b.bw || 100) + '" title="Box width">' + pos(b.bal || 'left');
        if (b.t === 'eq') s += sep + bt('eqc', '✎ Code', 'Edit the LaTeX code');
      }
      return '<div class="ve-ctl" contenteditable="false">' + s + '</div>';
    }
    function armBlock(w) {
      const i = +w.dataset.i, b = blocks[i];
      const mk = (el, f, plainText, k) => { if (!el) return; el.contentEditable = 'true'; el.spellcheck = true; el.dataset.ve = f; if (plainText) el.dataset.plain = '1'; if (k !== undefined) el.dataset.k = k; el.dataset.ph = PH[f] || 'Type here…'; el.classList.toggle('ve-e', empty(el)); };
      if (b.t === 'p') mk(w.querySelector('.ar-p'), 'x');
      else if (b.t === 'h') mk(w.querySelector('.ar-h'), 'x', true);
      else if (b.t === 'q') { mk(w.querySelector('.ar-q-t'), 'x'); mk(w.querySelector('.ar-q-by cite'), 'by', true); }
      else if (b.t === 'list') w.querySelectorAll('.ar-list li').forEach((li, k) => mk(li, 'li', false, k));
      else if (b.t === 'tbl') w.querySelectorAll('.ar-tbl tr').forEach((tr, r) => tr.querySelectorAll('th,td').forEach((cl, c) => { mk(cl, 'cell'); cl.dataset.r = r; cl.dataset.c = c; }));
      else if (b.t === 'note') { mk(w.querySelector('.ar-note > div'), 'x'); mk(w.querySelector('.ar-note > b'), 'h', true); }
      else if (b.t === 'img' || b.t === 'vid') mk(w.querySelector('figcaption'), 'c', true);
    }
    function redrawBlock(i) {
      const w = prevEl.querySelector('.ve-b[data-i="' + i + '"]'); if (!w) return;
      w.querySelector('.ve-c').innerHTML = part(i); armBlock(w); R.math(w, { tex: true });
    }
    function drawPage() {
      const pg = prevEl.querySelector('.ve-page'), y = $('.ae-body').scrollTop;
      pg.innerHTML = HoloArticleView.html(Object.assign(view(), { blocks: blocks.map(ghost), title: p.title || Z, summary: p.summary || Z }));
      pg.classList.add('ve-edit');
      pg.querySelector('.ar-body').innerHTML = blocks.map((b, i) => '<div class="ve-b" data-i="' + i + '" data-t="' + b.t + '"><div class="ve-c">' + part(i) + '</div>' + ctl(b, i) + '</div>').join('') || '<div class="ve-ph">Nothing here yet. Use the Add buttons below.</div>';
      [['.ar-title', 'title'], ['.ar-lead', 'summary']].forEach(x => { const el = pg.querySelector(x[0]); if (el) { el.contentEditable = 'true'; el.spellcheck = true; el.dataset.ve = x[1]; el.dataset.plain = '1'; el.dataset.ph = PH[x[1]]; el.classList.toggle('ve-e', empty(el)); } });
      pg.querySelectorAll('.ve-b').forEach(armBlock);
      R.math(pg, { tex: true });
      $('.ae-body').scrollTop = y;
    }
    function drawPrev() {
      prevEl.innerHTML = '<div class="ve-mode"><button type="button" data-vm="read" class="' + (!pmode ? 'on' : '') + '">👁 Read-only preview</button><button type="button" data-vm="edit" class="' + (pmode ? 'on' : '') + '">✏️ Edit on this page</button><span>' +
        (pmode ? 'Click any text to type. Select words to style them. Hover a block for its size, width and position controls. Maths in text shows as codes while editing.' : 'This is exactly how readers will see it.') + '</span></div><div class="ve-page"></div>' + (pmode ? addBarHtml : '');
      if (pmode) drawPage(); else { const pg = prevEl.querySelector('.ve-page'); pg.innerHTML = HoloArticleView.html(view()); HoloArticleView.mount(pg, { preview: true }); }
    }
    function syncVe(el) {
      const f = el.dataset.ve, val = unz(el.dataset.plain ? el.textContent : el.innerHTML), w = el.closest('.ve-b');
      if (f === 'title') p.title = val; else if (f === 'summary') p.summary = val;
      else if (w) { const b = blocks[+w.dataset.i]; if (f === 'li') b.i[+el.dataset.k] = val; else if (f === 'cell') b.rows[+el.dataset.r][+el.dataset.c] = val; else b[f] = val; }
      el.classList.toggle('ve-e', empty(el)); mark();
    }
    prevEl.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset && t.dataset.vw) {
        const w = t.closest('.ve-b'), i = +w.dataset.i, b = blocks[i]; b[t.dataset.vw] = +t.value; mark();
        if (b.t === 'img' || b.t === 'vid') { const fg = w.querySelector('.ar-fig'); if (fg) fg.style.setProperty('--w', t.value + '%'); } else redrawBlock(i);
        return;
      }
      const el = t.closest && t.closest('[data-ve]'); if (el) syncVe(el);
    });
    prevEl.addEventListener('paste', e => {
      const el = e.target.closest && e.target.closest('[data-ve]'); if (!el) return;
      e.preventDefault(); const cd = e.clipboardData, h = el.dataset.plain ? '' : cd.getData('text/html');
      if (h) document.execCommand('insertHTML', false, R.sanitize(h)); else document.execCommand('insertText', false, cd.getData('text/plain'));
    });
    prevEl.addEventListener('focusin', e => {
      const t = e.target, w = t.closest && t.closest('.ve-b'); if (!w) return;
      active = +w.dataset.i; if (t.dataset && t.dataset.ve === 'cell') lastCell = { i: active, r: +t.dataset.r, c: +t.dataset.c };
    });
    prevEl.addEventListener('keydown', e => {
      const el = e.target.closest && e.target.closest('[data-ve]'); if (!el || e.key !== 'Enter' || e.shiftKey) return;
      e.preventDefault(); if (el.dataset.plain) return;
      const w = el.closest('.ve-b'), i = +w.dataset.i, b = blocks[i];
      if (b.t === 'list' && el.dataset.ve === 'li') { const k = +el.dataset.k; b.i.splice(k + 1, 0, ''); mark(); drawPage(); focusPage(i, k + 1); return; }
      if (b.t === 'p' && atEnd(el)) { blocks.splice(i + 1, 0, NEW.p()); active = i + 1; mark(); drawPage(); focusPage(i + 1); return; }
      document.execCommand('insertLineBreak');
    });
    prevEl.addEventListener('click', async e => {
      const vm = e.target.closest('[data-vm]'); if (vm) { pmode = vm.dataset.vm === 'edit'; drawPrev(); return; }
      const bt = e.target.closest('[data-vc]'), w = e.target.closest('.ve-b'); if (!bt || !w) return;
      const i = +w.dataset.i, b = blocks[i], c = bt.dataset.vc, refreshCtl = () => { const old = w.querySelector('.ve-ctl'); if (old) old.outerHTML = ctl(b, i); };
      if (c === 'up' || c === 'down') { const j = i + (c === 'up' ? -1 : 1); if (blocks[j]) { [blocks[i], blocks[j]] = [blocks[j], blocks[i]]; active = j; mark(); drawPage(); } }
      else if (c === 'dup') { blocks.splice(i + 1, 0, clone(b)); active = i + 1; mark(); drawPage(); }
      else if (c === 'del') { blocks.splice(i, 1); active = -1; mark(); drawPage(); }
      else if (c.indexOf('sz-') === 0) { b.sz = c.slice(3); mark(); redrawBlock(i); refreshCtl(); }
      else if (c.indexOf('pos-') === 0) {
        const v = c.slice(4);
        if (b.t === 'img' || b.t === 'vid') { b.al = v; const fg = w.querySelector('.ar-fig'); if (fg) fg.className = fg.className.replace(/fa-\w+/, 'fa-' + v); } else { b.bal = v; redrawBlock(i); }
        mark(); refreshCtl();
      }
      else if (c === 'lv2' || c === 'lv3') { b.l = c === 'lv3' ? 3 : 2; mark(); redrawBlock(i); refreshCtl(); }
      else if (c.indexOf('tb-') === 0) { if (c === 'tb-hd') { b.head = b.head === false; mark(); redrawBlock(i); refreshCtl(); } else tableOp(b, c.slice(3), i); }
      else if (c === 'pic') pick(IMG, false, async fs => { const u = await upImg(fs[0]); if (u) { b.u = u; mark(); redrawBlock(i); } });
      else if (c === 'vlink') { const v = await UI.prompt('Video link', 'Paste a YouTube or Vimeo link.', { value: b.u || '' }); if (v !== null) { b.u = v.trim(); mark(); redrawBlock(i); } }
      else if (c === 'eqc') { const v = await UI.prompt('Equation (LaTeX code)', 'Type or paste the code. Open Ω Symbol codes for help.', { value: b.x || '' }); if (v !== null) { b.x = v.trim(); mark(); redrawBlock(i); } }
    });

    /* ---------- Sidebar, buttons, tabs ---------- */
    const onP = e => { const el = e.target, k = el.dataset && el.dataset.p; if (!k) return; p[k] = el.type === 'checkbox' ? el.checked : el.value; mark(); };
    root.addEventListener('input', onP); root.addEventListener('change', onP);
    function setTab(t) {
      tab = t; hide();
      root.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
      $('.ae-edit').hidden = t !== 'edit'; prevEl.hidden = t !== 'prev';
      if (t === 'prev') { drawPrev(); $('.ae-body').scrollTop = 0; }
      else { $('.ae-title').value = p.title; $('.ae-sum').value = p.summary; drawBlocks(); drawSide(); }
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
      else if (act === 'cover') pick(IMG, false, async fs => { const u = await upImg(fs[0]); if (u) { p.cover_url = u; mark(); drawSide(); } });
      else if (act === 'covrm') { p.cover_url = ''; mark(); drawSide(); }
      else if (act === 'addfile') pick('', true, async fs => { for (const f of fs) { try { UI.toast('Uploading ' + f.name + '…'); p.files.push(await uploadFile(f)); } catch (er) { H.fail(er); } } mark(); drawSide(); });
      else if (act === 'rmfile') { p.files.splice(+a.dataset.i, 1); mark(); drawSide(); }
      else if (act === 'rmpdf') { p.pdf = ''; mark(); drawSide(); }
    });
    /* links inside the preview must not take you away from the editor */
    root.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('.ae-prev a[href]'); if (!a) return;
      if ((a.getAttribute('href') || '').charAt(0) === '#') return;
      e.preventDefault(); e.stopPropagation();
    }, true);

    /* ---------- Safety: draft autosave, leave warning, Ctrl+S, Ctrl+K ---------- */
    const timer = setInterval(() => { if (dirty) { try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), p, blocks })); } catch (e) {} } }, 4000);
    const guard = e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    const onUp = () => { drag = false; sched(); }, onScrl = () => { if (!bub.hidden) requestAnimationFrame(place); };
    function onKey(e) {
      const k = String(e.key).toLowerCase();
