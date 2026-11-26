/* Article page layout, shared by the public page (read.js) and the editor preview */
(function () {
  'use strict';
  if (window.HoloArticleView) return;
  const esc = UI.esc;
  const fsize = n => !n ? '' : n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB';

  function html(a) {
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
      '<div class="ar-end"><button type="button" class="btn btn-ghost btn-sm" data-share>🔗 Share</button></div></article>';
  }

  function mount(root, opt) {
    opt = opt || {};
    HoloRich.math(root);
    if (root._av) return; root._av = true;
    root.addEventListener('click', async e => {
      if (!e.target.closest('[data-share]')) return;
      if (opt.preview) return UI.toast('Sharing works on the live page.');
      const url = location.href;
      if (navigator.share) { try { await navigator.share({ title: 'Holomatrix', url }); return; } catch (er) { if (er && er.name === 'AbortError') return; } }
      try { await navigator.clipboard.writeText(url); UI.toast('Link copied.', 'success'); } catch (er) { UI.toast(url, 'info', 7000); }
    });
  }

  window.HoloArticleView = { html, mount };
})();
