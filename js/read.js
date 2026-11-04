/* Read a news article or (premium) research paper */
(function () {
  'use strict';
  const C = HoloCommon, esc = UI.esc;
  const box = document.getElementById('read');
  const q = new URLSearchParams(location.search);
  const type = q.get('type') === 'research' ? 'research' : 'news', id = q.get('id');
  const back = type === 'research' ? '/research' : '/news';

  const notFound = () => { box.innerHTML = '<div class="box"><h3>Not found</h3><p>This page doesn\'t exist or isn\'t published.</p><a class="btn btn-primary btn-sm" href="' + back + '">Back</a></div>'; };

  async function news() {
    const { data } = await sb.from('articles').select('*').eq('id', id).maybeSingle();
    if (!data) return notFound();
    box.innerHTML = '<a class="back-l" href="/news#' + esc(data.category) + '" style="color:var(--muted)">← ' + esc(C.catLabel(C.NEWS_CATS, data.category)) + '</a>' +
      '<h1>' + esc(data.title) + '</h1><div class="meta">' + C.date(data.created_at) + (data.author_name ? ' · ' + esc(data.author_name) : '') + '</div>' +
      (data.cover_url ? '<img class="cover" src="' + esc(data.cover_url) + '" alt="">' : '') + '<div class="read-body">' + C.paras(data.body || data.summary) + '</div>';
  }

  async function research() {
    const { data: r } = await sb.from('researches').select('*').eq('id', id).maybeSingle();
    if (!r) return notFound();
    const a = await Auth.access();
    const ok = (await C.premium()) || (a && a.can('manage_content'));
    let html = '<a href="/research#' + esc(r.category) + '" style="color:var(--muted)">← ' + esc(C.catLabel(C.RES_CATS, r.category)) + '</a>' +
      '<h1>' + esc(r.title) + '</h1><div class="meta">' + C.date(r.created_at) + (r.authors ? ' · ' + esc(r.authors) : '') + '</div>' +
      (r.cover_url ? '<img class="cover" src="' + esc(r.cover_url) + '" alt="">' : '') + (r.summary ? '<div class="read-body"><p><b>' + esc(r.summary) + '</b></p></div>' : '');

    if (!ok) {
      html += '<div class="box"><h3>🔒 Premium research</h3><p>' + (a ? 'The full paper is available to subscribers.' : 'Log in and subscribe to read the full paper.') + '</p><div class="row">' +
        (a ? '' : '<a class="btn btn-ghost btn-sm" href="/login?next=' + encodeURIComponent(location.pathname + location.search) + '">Log in</a>') +
        '<a class="btn btn-primary btn-sm" href="/funds#subscribe">See subscription packs</a></div></div>';
      box.innerHTML = html; return;
    }
    const { data: c } = await sb.from('research_content').select('*').eq('research_id', id).maybeSingle();
    if (c) {
      html += '<div class="read-body">' + C.paras(c.body) + '</div><div class="row" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">';
      if (c.file_path) {
        const s = await sb.storage.from('research-files').createSignedUrl(c.file_path, 3600);
        if (s.data && s.data.signedUrl) html += '<a class="btn btn-primary btn-sm" href="' + esc(s.data.signedUrl) + '" target="_blank" rel="noopener noreferrer">📄 Open PDF</a>';
      }
      if (c.external_url && /^https?:\/\//i.test(c.external_url)) html += '<a class="btn btn-ghost btn-sm" href="' + esc(c.external_url) + '" target="_blank" rel="noopener noreferrer">🔗 Original source</a>';
      html += '</div>';
    } else html += '<div class="empty">No content added yet.</div>';
    box.innerHTML = html;
  }

  (async function () { if (!id) return notFound(); try { await (type === 'research' ? research() : news()); } catch (e) { notFound(); } })();
})();
