/* Read an article or research: /news/physics/title-abc123 and /research/physics/title-abc123 (both free) */
(function () {
  'use strict';
  const C = HoloCommon, esc = UI.esc, box = document.getElementById('read');
  const seg = location.pathname.split('/').filter(Boolean);
  const type = seg[0] === 'research' ? 'research' : 'news', key = decodeURIComponent(seg[2] || '');
  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
  const back = '/' + type + '/all';
  const notFound = () => { box.innerHTML = '<div class="box"><h3>Not found</h3><p>This page doesn\'t exist or isn\'t published.</p><a class="btn btn-primary btn-sm" href="' + back + '">Back</a></div>'; };
  const find = t => sb.from(t).select('*').eq(isId ? 'id' : 'slug', key).maybeSingle();

  /* article styles + the shared scripts load only on this page */
  { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/article.css'; document.head.appendChild(l); }
  const need = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src)); document.body.appendChild(s); });
  const libs = need('/js/rich.js').then(() => need('/js/article-view.js'));

  async function related(table, row) {
    const { data } = await sb.from(table).select('id,slug,title,category,cover_url,created_at,read_min').eq('published', true).eq('category', row.category).neq('id', row.id).order('created_at', { ascending: false }).limit(3);
    if (!data || !data.length) return;
    const sec = document.createElement('section'); sec.className = 'ar-rel';
    sec.innerHTML = '<h3>More in ' + esc(C.catLabel(type === 'research' ? C.RES_CATS : C.NEWS_CATS, row.category)) + '</h3><div class="ar-rel-g">' + data.map(x =>
      '<a class="nc" href="/' + type + '/' + esc(x.category) + '/' + esc(x.slug || x.id) + '"><div class="nc-img">' + (x.cover_url && /^https:\/\//.test(x.cover_url) ? '<img src="' + esc(x.cover_url) + '" alt="" loading="lazy">' : (type === 'news' ? '📰' : '🔬')) + '</div><div class="nc-b"><h3>' + esc(x.title) + '</h3><small>' + C.date(x.created_at) + (x.read_min ? ' · ' + x.read_min + ' min read' : '') + '</small></div></a>').join('') + '</div>';
    box.appendChild(sec);
  }

  async function news() {
    const { data } = await find('articles'); if (!data) return notFound();
    await libs;
    box.innerHTML = HoloArticleView.html({ type: 'news', title: data.title, category: data.category, summary: data.summary, cover_url: data.cover_url, author: data.author_name, date: data.created_at, read_min: data.read_min, blocks: data.blocks, legacy: data.body, files: data.files, toc: !(data.opts && data.opts.toc === false) });
    HoloArticleView.mount(box); related('articles', data);
  }

  async function research() {
    const { data: r } = await find('researches'); if (!r) return notFound();
    const { data: c } = await sb.from('research_content').select('*').eq('research_id', r.id).maybeSingle();
    const files = Array.isArray(r.files) ? r.files.slice() : [];
    if (c && c.file_path) { const s = await sb.storage.from('research-files').createSignedUrl(c.file_path, 3600); if (s.data && s.data.signedUrl) files.unshift({ name: 'Research paper (PDF)', url: s.data.signedUrl, size: 0 }); }
    await libs;
    box.innerHTML = HoloArticleView.html({ type: 'research', title: r.title, category: r.category, summary: r.summary, cover_url: r.cover_url, author: r.authors, date: r.created_at, read_min: r.read_min, blocks: c && c.blocks, legacy: c && c.body, files, toc: !(r.opts && r.opts.toc === false), external_url: c && c.external_url });
    HoloArticleView.mount(box); related('researches', r);
  }
  (async function () { if (!key) return notFound(); try { await (type === 'research' ? research() : news()); } catch (e) { notFound(); } })();
})();
