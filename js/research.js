/* Researches list: /research/all, /research/physics ... (free for everyone) */
(function () {
  'use strict';
  const C = HoloCommon, esc = UI.esc, grid = document.getElementById('list');
  let all = [];
  function draw(cat) {
    const rows = all.filter(a => cat === 'all' || a.category === cat);
    grid.innerHTML = rows.map(a =>
      '<a class="nc reveal" href="/research/' + a.category + '/' + (a.slug || a.id) + '"><div class="nc-img">' + (a.cover_url ? '<img src="' + esc(a.cover_url) + '" alt="" loading="lazy">' : '🔬') + '</div>' +
      '<div class="nc-b"><span class="badge">' + esc(C.catLabel(C.RES_CATS, a.category)) + '</span><h3>' + esc(a.title) + '</h3>' + (a.summary ? '<p>' + esc(a.summary) + '</p>' : '') +
      '<small>' + C.date(a.created_at) + (a.authors ? ' · ' + esc(a.authors) : '') + '</small></div></a>').join('') || '<div class="empty">No researches here yet.</div>';
    UI.observe(grid);
  }
  (async function () {
    const { data } = await sb.from('researches').select('id,slug,title,category,summary,authors,cover_url,created_at').eq('published', true).order('created_at', { ascending: false });
    all = data || [];
    C.tabs({ el: document.getElementById('tabs'), items: C.RES_CATS, onChange: draw });
  })();
})();
