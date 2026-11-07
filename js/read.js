/* Read an article or research: /news/physics/title-abc123 and /research/physics/title-abc123 */
(function () {
  'use strict';
  const C = HoloCommon, esc = UI.esc, box = document.getElementById('read');
  const seg = location.pathname.split('/').filter(Boolean);
  const type = seg[0] === 'research' ? 'research' : 'news', key = decodeURIComponent(seg[2] || '');
  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
  const back = '/' + type + '/all';
  const notFound = () => { box.innerHTML = '<div class="box"><h3>Not found</h3><p>This page doesn\'t exist or isn\'t published.</p><a class="btn btn-primary btn-sm" href="' + back + '">Back</a></div>'; };
  const find = t => sb.from(t).select('*').eq(isId ? 'id' : 'slug', key).maybeSingle();

  async function news() {
    const { data } = await find('articles'); if (!data) return notFound();
    box.innerHTML = '<a href="/news/' + esc(data.category) + '" style="color:var(--muted)">← ' + esc(C.catLabel(C.NEWS_CATS, data.category)) + '</a><h1>' + esc(data.title) + '</h1><div class="meta">' + C.date(data.created_at) + (data.author_name ? ' · ' + esc(data.author_name) : '') + '</div>' +
      (data.cover_url ? '<img class="cover" src="' + esc(data.cover_url) + '" alt="">' : '') + '<div class="read-body">' + C.paras(data.body || data.summary) + '</div>';
  }

  async function research() {
    const { data: r } = await find('researches'); if (!r) return notFound();
    const a = await Auth.access(), ok = (await C.premium()) || (a && a.can('manage_content'));
    const head = '<a href="/research/' + esc(r.category) + '" style="color:var(--muted)">← ' + esc(C.catLabel(C.RES_CATS, r.category)) + '</a><h1>' + esc(r.title) + '</h1><div class="meta">' + C.date(r.created_at) + (r.authors ? ' · ' + esc(r.authors) : '') + '</div>';
    if (!ok) {   // brief only: no photo, no links, no PDF
      box.innerHTML = head + (r.summary ? '<div class="read-body"><p>' + esc(r.summary) + '</p></div>' : '') +
        '<div class="box"><h3>🔒 Full research is for subscribers</h3><p>' + (a ? 'Subscribe to read the full paper, its images, links and files.' : 'Log in and subscribe to read the full paper, its images, links and files.') + '</p><div class="row">' +
        (a ? '' : '<a class="btn btn-ghost btn-sm" href="/login?next=' + encodeURIComponent(location.pathname) + '">Log in</a>') + '<a class="btn btn-primary btn-sm" href="/funds/subscribe">See subscription packs</a></div></div>';
      return;
    }
    let html = head + (r.cover_url ? '<img class="cover" src="' + esc(r.cover_url) + '" alt="">' : '') + (r.summary ? '<div class="read-body"><p><b>' + esc(r.summary) + '</b></p></div>' : '');
    const { data: c } = await sb.from('research_content').select('*').eq('research_id', r.id).maybeSingle();
    if (c) {
      html += '<div class="read-body">' + C.paras(c.body) + '</div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">';
      if (c.file_path) { const s = await sb.storage.from('research-files').createSignedUrl(c.file_path, 3600); if (s.data && s.data.signedUrl) html += '<a class="btn btn-primary btn-sm" href="' + esc(s.data.signedUrl) + '" target="_blank" rel="noopener noreferrer">📄 Open PDF</a>'; }
      if (c.external_url && /^https?:\/\//i.test(c.external_url)) html += '<a class="btn btn-ghost btn-sm" href="' + esc(c.external_url) + '" target="_blank" rel="noopener noreferrer">🔗 Original source</a>';
      html += '</div>';
    } else html += '<div class="empty">No content added yet.</div>';
    box.innerHTML = html;
  }
  (async function () { if (!key) return notFound(); try { await (type === 'research' ? research() : news()); } catch (e) { notFound(); } })();
})();
