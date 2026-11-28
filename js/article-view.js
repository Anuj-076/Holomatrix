/* Article page layout, shared by the public page (read.js) and the editor preview */
(function () {
  'use strict';
  if (window.HoloArticleView) return;
  const esc = UI.esc;
  const fsize = n => !n ? '' : n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
  let cssIn = false;
  function inject() {
    if (cssIn) return; cssIn = true;
    const s = document.createElement('style'); s.id = 'ar-share-css';
    s.textContent = '.ar-share{margin-top:30px;padding:20px;border:1px solid var(--border);border-radius:20px;background:var(--surface);display:grid;gap:12px}.ar-share>b{font-family:var(--font-head);font-size:1.1rem}' +
      '.ar-share-b{display:flex;flex-wrap:wrap;gap:8px}.ar-sb{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:999px;border:1px solid var(--border);background:var(--surface);font-weight:600;font-size:.88rem;color:var(--text);transition:transform .2s,border-color .2s}' +
      '.ar-sb:hover{transform:translateY(-2px);border-color:var(--ul,var(--accent))}.ar-sb .ico{width:18px;height:18px;display:inline-block;flex:none}.ar-sb .ico svg{width:100%;height:100%;display:block;border-radius:5px}';
    document.head.appendChild(s);
  }
  const ico = n => window.HoloIcons ? '<span class="ico">' + HoloIcons.svg(n) + '</span>' : '';
  const sbtn = (k, icon, label) => '<button type="button" class="ar-sb" data-sh="' + k + '">' + icon + label + '</button>';

  function html(a) {
    inject();
    const C = HoloCommon, R = HoloRich, isR = a.type === 'research';
    const lists = isR ? C.RES_CATS : C.NEWS_CATS, base = '/' + (isR ? 'research' : 'news') + '/' + esc(a.category), label = esc(C.catLabel(lists, a.category));
    const has = Array.isArray(a.blocks) && a.blocks.length;
    const out = has ? R.render(a.blocks) : { html: C.paras(a.legacy), tocHtml: '' };
    const files = (a.files || []).filter(f => f && /^https:\/\//.test(f.url || ''));
    return '<article class="ar">' +
      '<a class="ar-back" href="' + base + '">← ' + label + '</a>' +
      '<div class="ar-tags"><a class="ar-tag c-' + esc(a.category) + '" href="' + base + '">' + label + '</a></div>' +
      '<h1 class="ar-title">' + esc(a.title) + '</h1>' +
      (a.summary ? '<p class="ar-lead">' + esc(a.summary) + '</p>' : '') +
      '<div class="ar-meta"><span>🗓 ' + C.date(a.date) + '</span>' + (a.author ? '<span>✍️ ' + esc(a.author) + '</span>' : '') + (a.read_min ? '<span>⏱ ' + a.read_min + ' min read</span>' : '') + '</div>' +
      (a.cover_url && /^https:\/\//.test(a.cover_url) ? '<figure class="ar-cover"><img src="' + esc(a.cover_url) + '" alt=""></figure>' : '') +
      (a.toc !== false ? out.tocHtml : '') +
      '<div class="ar-body">' + out.html + '</div>' +
      (files.length ? '<section class="ar-files"><h3>📎 Downloads</h3>' + files.map(f => '<a class="ar-file" href="' + esc(f.url) + '" target="_blank" rel="noopener noreferrer"><span>' + esc(f.name || 'File') + '</span><small>' + fsize(f.size) + '</small></a>').join('') + '</section>' : '') +
      (a.external_url && /^https?:\/\//i.test(a.external_url) ? '<p class="ar-src"><a href="' + esc(a.external_url) + '" target="_blank" rel="noopener noreferrer">🔗 Original source</a></p>' : '') +
      '<div class="ar-share" data-title="' + esc(a.title) + '"><b>Share this ' + (isR ? 'research' : 'article') + '</b><div class="ar-share-b">' +
      '<button type="button" class="ar-sb" data-sh="native" hidden>📲 Share…</button>' + sbtn('copy', '🔗 ', 'Copy link') + sbtn('wa', ico('whatsapp'), 'WhatsApp') + sbtn('tg', '✈️ ', 'Telegram') + sbtn('x', ico('x'), 'X') + sbtn('li', ico('linkedin'), 'LinkedIn') + sbtn('fb', ico('facebook'), 'Facebook') + sbtn('em', ico('email'), 'Email') +
      '</div></div></article>';
  }

  function mount(root, opt) {
    opt = opt || {};
    HoloRich.math(root);
    root.querySelectorAll('[data-sh="native"]').forEach(b => { if (navigator.share) b.hidden = false; });
    if (root._av) return; root._av = true;
    root.addEventListener('click', async e => {
      const b = e.target.closest('[data-sh]'); if (!b) return;
      if (opt.preview) return UI.toast('Share buttons work on the live page.');
      const title = b.closest('.ar-share').dataset.title, url = location.origin + location.pathname, k = b.dataset.sh;   // the article's own address
      const T = encodeURIComponent(title), U = encodeURIComponent(url);
      const L = { wa: 'https://wa.me/?text=' + encodeURIComponent(title + ' ' + url), tg: 'https://t.me/share/url?url=' + U + '&text=' + T, x: 'https://x.com/intent/post?url=' + U + '&text=' + T,
        li: 'https://www.linkedin.com/sharing/share-offsite/?url=' + U, fb: 'https://www.facebook.com/sharer/sharer.php?u=' + U, em: 'mailto:?subject=' + T + '&body=' + U };
      if (k === 'copy') { try { await navigator.clipboard.writeText(url); UI.toast('Link copied.', 'success'); } catch (er) { UI.toast(url, 'info', 7000); } }
      else if (k === 'native') { try { await navigator.share({ title, url }); } catch (er) {} }
      else if (k === 'em') location.href = L.em;
      else if (L[k]) window.open(L[k], '_blank', 'noopener,noreferrer');
    });
  }

  window.HoloArticleView = { html, mount };
})();
