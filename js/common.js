/* Shared helpers, lists and the default menu (the menu can be edited in Admin → Website → Menu) */
(function () {
  'use strict';
  const C = {};

  C.NEWS_CATS = [['all', 'All articles'], ['physics', 'Physics'], ['astronomy', 'Astronomy'], ['biology', 'Biology'], ['chemistry', 'Chemistry'], ['technology', 'Technology'], ['holomatrix', 'Holomatrix'], ['other', 'Other']];
  C.RES_CATS = [['all', 'All researches'], ['physics', 'Physics'], ['chemistry', 'Chemistry'], ['biology', 'Biology'], ['astronomy', 'Astronomy']];
  C.FIELDS = [['physics', 'Physics'], ['biology', 'Biology'], ['chemistry', 'Chemistry'], ['astronomy', 'Astronomy'], ['technology', 'Technology']];
  C.QUALS = ['High school', 'Diploma', 'Associate degree', 'B.Sc', 'B.Tech / B.E.', 'B.A.', 'B.Com', 'BBA', 'B.Pharm', 'MBBS', 'LL.B', 'M.Sc', 'M.Tech / M.E.', 'M.A.', 'M.Com', 'MBA', 'M.Phil', 'Ph.D', 'Postdoctoral researcher', 'Professor', 'Certified professional', 'Self-taught'];
  C.GROUPS = ['Scientists', 'Management', 'Executive team'];

  C.DEFAULT_NAV = [
    { id: 'news', label: 'News', href: '/news#all', visible: true, children: [
      { label: 'All articles', href: '/news#all' }, { label: 'Physics', href: '/news#physics' }, { label: 'Astronomy', href: '/news#astronomy' },
      { label: 'Biology', href: '/news#biology' }, { label: 'Chemistry', href: '/news#chemistry' }, { label: 'Technology', href: '/news#technology' },
      { label: 'Holomatrix', href: '/news#holomatrix' }, { label: 'Other', href: '/news#other' }] },
    { id: 'research', label: 'Researches', href: '/research#all', premium: true, visible: true, children: [
      { label: 'All Researches', href: '/research#all' }, { label: 'Physics', href: '/research#physics' }, { label: 'Chemistry', href: '/research#chemistry' },
      { label: 'Biology', href: '/research#biology' }, { label: 'Astronomy', href: '/research#astronomy' }] },
    { id: 'about', label: 'About us', href: '/about#holomatrix', visible: true, children: [
      { label: 'Holomatrix', href: '/about#holomatrix' }, { label: 'Staff', href: '/about#staff' }] },
    { id: 'clients', label: 'Client', href: '/clients#hire', visible: true, children: [
      { label: 'Hire a client', href: '/clients#hire' }, { label: 'Become a client', href: '/clients#become', premium: true }] },
    { id: 'funds', label: 'Funds', href: '/funds#subscribe', visible: true, children: [
      { label: 'Subscribe', href: '/funds#subscribe' }, { label: 'Donate', href: '/funds#donate' }] },
    { id: 'contact', label: 'Contact us', href: '/contact', visible: true, children: [] }
  ];

  C.date = d => new Date(d).toLocaleDateString([], { dateStyle: 'medium' });
  C.time = d => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  C.catLabel = (list, id) => (list.find(c => c[0] === id) || [0, id])[1];
  C.premium = async () => { try { const { data, error } = await sb.rpc('has_premium'); return !error && data === true; } catch (e) { return false; } };
  C.paras = t => String(t || '').split(/\n{2,}/).filter(Boolean).map(p => '<p>' + UI.esc(p).replace(/\n/g, '<br>') + '</p>').join('');
  C.normUrl = u => {
    u = String(u || '').trim(); if (!u) return '';
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    try { const x = new URL(u); return /^https?:$/.test(x.protocol) && x.hostname.includes('.') ? x.href : ''; } catch (e) { return ''; }
  };

  /* Tab bar driven by the URL hash (e.g. /news#physics) */
  C.tabs = function (o) {
    let cur = null;
    const read = () => { const h = location.hash.slice(1).toLowerCase(); return o.items.some(i => i[0] === h) ? h : o.items[0][0]; };
    const draw = () => {
      o.el.innerHTML = o.items.map(i => '<a href="#' + i[0] + '" class="tab' + (i[0] === cur ? ' on' : '') + '">' + UI.esc(i[1]) + (i[2] ? '<em class="prem">★ Premium</em>' : '') + '</a>').join('');
    };
    const go = () => { const n = read(); if (n === cur) return; cur = n; draw(); o.onChange(n); };
    addEventListener('hashchange', go);
    go();
  };

  window.HoloCommon = C;
})();
