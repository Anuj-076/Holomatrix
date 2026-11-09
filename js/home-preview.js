/* Home page: the 3 latest news and the 3 latest researches.
   Only title + thumbnail are fetched (no summary, no PDF, no links), so there is nothing to find in the page.
   Researches are locked for people without an active pack: a click shows "Subscribers only" and offers the Subscribe page. */
(function () {
  'use strict';
  const C = HoloCommon, e = UI.esc, $ = id => document.getElementById(id);
  const mounts = {};

  const thumb = (u, ico) => (u && /^https:\/\//.test(u) ? '<img src="' + e(u) + '" alt="" loading="lazy">' : ico);
  const body = x => '<div class="nc-b"><span class="badge">' + e(C.catLabel(x.res ? C.RES_CATS : C.NEWS_CATS, x.category)) + '</span><h3>' + e(x.title) + '</h3><small>' + C.date(x.created_at) + '</small></div>';
  const open = (x, type) => '<a class="nc reveal" href="/' + type + '/' + e(x.category) + '/' + e(x.id) + '"><div class="nc-img">' + thumb(x.cover_url, type === 'news' ? '📰' : '🔬') + '</div>' + body(Object.assign({ res: type === 'research' }, x)) + '</a>';
  const locked = x => '<button type="button" class="nc nc-lock reveal" data-lock="1"><div class="nc-img"><span class="nc-lockb">🔒 Subscribers</span>' + thumb(x.cover_url, '🔬') + '</div>' + body(Object.assign({ res: true }, x)) + '</button>';

  function mount(boxId, secId, html, count) {
    const box = $(boxId), sec = $(secId); if (!box) return;
    mounts[boxId] = html;
    if (box.innerHTML !== html) box.innerHTML = html;
    if (sec) sec.hidden = !count;
    UI.observe(box);
    if (!box._hp) {                                   // if another script redraws the box, put ours back
      box._hp = true;
      new MutationObserver(() => { if (box.innerHTML !== mounts[boxId]) box.innerHTML = mounts[boxId]; }).observe(box, { childList: true });
    }
  }

  async function run() {
    const a = await Site.accessReady;
    const ok = !!a && ((await C.premium()) || a.can('manage_content'));
    const cols = 'id,title,category,cover_url,created_at';
    const [n, r] = await Promise.all([
      sb.from('articles').select(cols).eq('published', true).order('created_at', { ascending: false }).limit(3),
      sb.from('researches').select(cols).eq('published', true).order('created_at', { ascending: false }).limit(3)
    ]);
    const nl = n.data || [], rl = r.data || [];
    mount('lp-news', 'news', nl.map(x => open(x, 'news')).join(''), nl.length);
    mount('lp-research', 'research', rl.map(x => ok ? open(x, 'research') : locked(x)).join(''), rl.length);
  }

  document.addEventListener('click', async ev => {
    const b = ev.target.closest && ev.target.closest('[data-lock]');
    if (!b || document.body.classList.contains('editing')) return;
    ev.preventDefault();
    const yes = await UI.confirm('Subscribers only', 'This research is for subscribers. Subscribe to a pack to read the full paper, its images, links and files.', { confirmText: 'See subscription packs', cancelText: 'Not now' });
    if (yes) UI.go('/funds/subscribe');
  });

  Site.ready.then(() => setTimeout(run, 300));
})();
