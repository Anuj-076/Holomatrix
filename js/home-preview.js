/* Home page: the 3 latest news and the 3 latest researches (both free to read). Only title + thumbnail are shown. */
(function () {
  'use strict';
  const C = HoloCommon, e = UI.esc, $ = id => document.getElementById(id);

  const thumb = (u, ico) => (u && /^https:\/\//.test(u) ? '<img src="' + e(u) + '" alt="" loading="lazy">' : ico);
  const card = (x, type) => '<a class="nc reveal" href="/' + type + '/' + e(x.category) + '/' + e(x.slug || x.id) + '"><div class="nc-img">' + thumb(x.cover_url, type === 'news' ? '📰' : '🔬') + '</div>' +
    '<div class="nc-b"><span class="badge">' + e(C.catLabel(type === 'research' ? C.RES_CATS : C.NEWS_CATS, x.category)) + '</span><h3>' + e(x.title) + '</h3><small>' + C.date(x.created_at) + '</small></div></a>';

  function mount(boxId, secId, list, type) {
    const box = $(boxId), sec = $(secId); if (!box) return;
    box.innerHTML = list.map(x => card(x, type)).join('');
    if (sec) sec.hidden = !list.length;
    UI.observe(box);
  }

  async function run() {
    const cols = 'id,slug,title,category,cover_url,created_at';
    const [n, r] = await Promise.all([
      sb.from('articles').select(cols).eq('published', true).order('created_at', { ascending: false }).limit(3),
      sb.from('researches').select(cols).eq('published', true).order('created_at', { ascending: false }).limit(3)
    ]);
    mount('lp-news', 'news', n.data || [], 'news');
    mount('lp-research', 'research', r.data || [], 'research');
  }

  Site.ready.then(() => setTimeout(run, 300));
})();
