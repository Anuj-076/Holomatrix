/* Shared helpers, lists, default menu and path-based tabs */
(function () {
  'use strict';
  const C = {};

  C.NEWS_CATS = [['all', 'All articles'], ['physics', 'Physics'], ['astronomy', 'Astronomy'], ['biology', 'Biology'], ['chemistry', 'Chemistry'], ['technology', 'Technology'], ['holomatrix', 'Holomatrix'], ['other', 'Other']];
  C.RES_CATS = [['all', 'All researches'], ['physics', 'Physics'], ['chemistry', 'Chemistry'], ['biology', 'Biology'], ['astronomy', 'Astronomy']];
  C.FIELDS = [['physics', 'Physics'], ['biology', 'Biology'], ['chemistry', 'Chemistry'], ['astronomy', 'Astronomy'], ['technology', 'Technology']];
  C.QUALS = ['High school', 'Diploma', 'Associate degree', 'B.Sc', 'B.Tech / B.E.', 'B.A.', 'B.Com', 'BBA', 'B.Pharm', 'MBBS', 'LL.B', 'M.Sc', 'M.Tech / M.E.', 'M.A.', 'M.Com', 'MBA', 'M.Phil', 'Ph.D', 'Postdoctoral researcher', 'Professor', 'Certified professional', 'Self-taught'];
  C.GROUPS = ['Scientists', 'Management', 'Executive team'];

  const sub = (base, list) => list.map(x => ({ label: x[1], href: base + '/' + x[0] }));
  C.DEFAULT_NAV = [
    { id: 'news', label: 'News', href: '/news/all', visible: true, children: sub('/news', C.NEWS_CATS) },
    { id: 'research', label: 'Researches', href: '/research/all', premium: true, visible: true, children: sub('/research', C.RES_CATS) },
    { id: 'about', label: 'About us', href: '/about/holomatrix', visible: true, children: [{ label: 'Holomatrix', href: '/about/holomatrix' }, { label: 'Staff team', href: '/about/staff-team' }] },
    { id: 'clients', label: 'Client', href: '/clients/hire-a-client', visible: true, children: [{ label: 'Hire a client', href: '/clients/hire-a-client' }, { label: 'Become a client', href: '/clients/become-a-client', premium: true }] },
    { id: 'funds', label: 'Funds', href: '/funds/subscribe', visible: true, children: [{ label: 'Subscribe', href: '/funds/subscribe' }, { label: 'Donate', href: '/funds/donate' }] },
    { id: 'contact', label: 'Contact us', href: '/contact/ai-support', visible: true, children: [{ label: 'AI support', href: '/contact/ai-support' }, { label: 'Staff support', href: '/contact/staff-support' }] }
  ];
  C.getNav = () => { const n = window.Site && Site.content && Site.content.nav; return Array.isArray(n) && n.length ? n : C.DEFAULT_NAV; };

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

  /* Client card (list + full profile page) */
  C.clientCard = (c, meId, full) => {
    const esc = UI.esc, ini = esc((c.display_name || '?').trim().charAt(0).toUpperCase());
    const social = [{ url: c.linkedin }].concat(Array.isArray(c.socials) ? c.socials : []).filter(s => s && s.url);
    const links = social.map(s => { const n = HoloIcons.forItem(s); return '<a href="' + esc(Site.safeUrl(s.url)) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(s.label || HoloIcons.label(n)) + '"><span class="ico">' + HoloIcons.svg(n) + '</span></a>'; }).join('');
    const quals = (c.qualifications || []).concat(c.qualification_other ? [c.qualification_other] : []);
    const mine = c.user_id === meId;
    return '<article class="cl' + (full ? ' cl-full' : ' reveal') + '"><div class="cl-top"><div class="cl-av">' + (c.photo_url && /^https:\/\//.test(c.photo_url) ? '<img src="' + esc(c.photo_url) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : ini) + '</div>' +
      '<div><h4>' + esc(c.display_name) + '</h4>' + (c.headline ? '<small>' + esc(c.headline) + '</small>' : '') + '</div></div>' +
      ((c.fields || []).length ? '<div class="tags">' + c.fields.map(f => '<span class="tag2 f">' + esc(C.catLabel(C.FIELDS, f)) + '</span>').join('') + '</div>' : '') +
      (quals.length ? '<div class="tags">' + quals.map(q => '<span class="tag2">🎓 ' + esc(q) + '</span>').join('') + '</div>' : '') +
      (c.experience_years ? '<small style="color:var(--muted)">' + c.experience_years + ' yrs experience</small>' : '') +
      (c.bio ? '<p>' + esc(c.bio) + '</p>' : '') + (c.extra ? '<p>' + esc(c.extra) + '</p>' : '') +
      '<div class="cl-links">' + links +
      (c.portfolio_url ? '<a href="' + esc(Site.safeUrl(c.portfolio_url)) + '" target="_blank" rel="noopener noreferrer"><span class="ico">' + HoloIcons.svg('website') + '</span>Portfolio</a>' : '') +
      (c.contact_email ? '<a href="mailto:' + esc(c.contact_email) + '"><span class="ico">' + HoloIcons.svg('email') + '</span>' + esc(c.contact_email) + '</a>' : '') + '</div>' +
      '<div class="cl-actions">' + (mine ? '<a class="btn btn-ghost btn-sm" href="/clients/become-a-client">Edit my profile</a>' : '<button class="btn btn-primary btn-sm" data-chat="' + c.user_id + '">💬 Chat</button>') +
      (full || !c.uid ? '' : '<a class="btn btn-ghost btn-sm" href="/clients/hire-a-client/' + c.uid + '">View profile</a>') + '</div></article>';
  };

  /* Tabs driven by the address: /news/physics, /clients/become-a-client ... (no page reload) */
  const SLUG = { hire: 'hire-a-client', become: 'become-a-client', staff: 'staff-team' };
  C.tabs = function (o) {
    const parts = () => location.pathname.split('/').filter(Boolean);
    const base = '/' + (parts()[0] || ''), ids = o.items.map(i => i[0]), seg = id => SLUG[id] || id;
    const url = id => base + '/' + seg(id);
    let cur = null;
    const read = () => {
      const s = parts()[1], p = ids.find(id => seg(id) === s); if (p) return p;
      const h = location.hash.slice(1).toLowerCase();
      return ids.find(id => id === h || seg(id) === h) || ids[0];
    };
    const draw = () => {
      o.el.innerHTML = o.items.map(i => '<a href="' + url(i[0]) + '" class="tab' + (i[0] === cur ? ' on' : '') + '" data-id="' + i[0] + '">' + UI.esc(i[1]) + (i[2] ? '<em class="prem">★ Premium</em>' : '') + '</a>').join('');
    };
    o.el.addEventListener('click', e => {
      const a = e.target.closest('a.tab');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      if (a.dataset.id === cur) return;
      history.pushState(null, '', url(a.dataset.id)); cur = a.dataset.id; draw(); o.onChange(cur);
    });
    addEventListener('popstate', () => { const n = read(); if (n !== cur) { cur = n; draw(); o.onChange(n); } });
    cur = read();
    try { history.replaceState(null, '', url(cur)); } catch (e) {}
    draw(); o.onChange(cur);
  };

  window.HoloCommon = C;
})();
