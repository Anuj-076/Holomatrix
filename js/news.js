/* News list: /news/all, /news/physics ... */
(function () {
  'use strict';
  const C = HoloCommon, esc = UI.esc, grid = document.getElementById('list');
  let all = [];
  function draw(cat) {
    const rows = all.filter(a => cat === 'all' || a.category === cat);
    grid.innerHTML = rows.map(a =>
      '<a class="nc reveal" href="/news/' + a.category + '/' + (a.slug || a.id) + '"><div class="nc-img">' + (a.cover_url ? '<img src="' + esc(a.cover_url) + '" alt="" loading="lazy">' : '📰') + '</div>' +
      '<div class="nc-b"><span class="badge">' + esc(C.catLabel(C.NEWS_CATS, a.category)) + '</span><h3>' + esc(a.title) + '</h3>' + (a.summary ? '<p>' + esc(a.summary) + '</p>' : '') +
      '<small>' + C.date(a.created_at) + (a.author_name ? ' · ' + esc(a.author_name) : '') + '</small></div></a>').join('') || '<div class="empty">No articles here yet.</div>';
    UI.observe(grid);
  }
  (async function () {
    const { data } = await sb.from('articles').select('id,slug,title,category,summary,cover_url,author_name,created_at').eq('published', true).order('created_at', { ascending: false });
    all = data || [];
    C.tabs({ el: document.getElementById('tabs'), items: C.NEWS_CATS, onChange: draw });
  })();
})();
