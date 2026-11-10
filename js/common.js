/* Shared helpers, lists, default menu, client cards and path-based tabs */
(function () {
  'use strict';
  const C = {};

  C.NEWS_CATS = [['all', 'All articles'], ['physics', 'Physics'], ['astronomy', 'Astronomy'], ['holomatrix', 'Holomatrix'], ['other', 'Other']];
  C.RES_CATS = [['all', 'All researches'], ['physics', 'Physics'], ['astronomy', 'Astronomy']];
  C.FIELDS = [['physics', 'Physics'], ['astronomy', 'Astronomy'], ['other', 'Other']];
  C.HELP_TYPES = [['tutoring', 'Tutoring / teaching'], ['research', 'Research guidance'], ['project', 'Project help'], ['review', 'Paper / report review'], ['tech', 'Technical / software help'], ['advice', 'Consultation / advice'], ['mentor', 'Mentorship'], ['other', 'Other']];
  C.URGENCY = [['flexible', 'Flexible'], ['month', 'Within a month'], ['week', 'Within a week'], ['urgent', 'Urgent (1–2 days)']];
  C.BUDGET = [['paid', 'Paid'], ['free', 'Free / volunteer'], ['discuss', 'Open to discuss']];
  C.MODES = [['online', 'Online'], ['inperson', 'In person'], ['either', 'Online or in person']];
  C.QUALS = ['High school', 'Diploma', 'Associate degree', 'B.Sc', 'B.Tech / B.E.', 'B.A.', 'B.Com', 'BBA', 'B.Pharm', 'MBBS', 'LL.B', 'M.Sc', 'M.Tech / M.E.', 'M.A.', 'M.Com', 'MBA', 'M.Phil', 'Ph.D', 'Postdoctoral researcher', 'Professor', 'Certified professional', 'Self-taught'];
  /* Team groups: Scientists, Management, Consultants. A person can have one, two or all three (stored like "Scientists & Management"). */
  C.SECTIONS = ['Scientists', 'Management', 'Consultants'];
  C.GROUPS = ['Scientists', 'Management', 'Consultants', 'Management & Scientists', 'Scientists & Consultants', 'Management & Consultants'];

  const sub = (base, list) => list.map(x => ({ label: x[1], href: base + '/' + x[0] }));
  const JOBS = { label: 'Jobs', href: '/contact/jobs' };
  C.DEFAULT_NAV = [
    { id: 'news', label: 'News', href: '/news/all', visible: true, children: sub('/news', C.NEWS_CATS) },
    { id: 'research', label: 'Researches', href: '/research/all', premium: true, visible: true, children: sub('/research', C.RES_CATS) },
    { id: 'about', label: 'About us', href: '/about/holomatrix', visible: true, children: [{ label: 'About Holomatrix', href: '/about/holomatrix' }, { label: 'Holomatrix Team', href: '/about/holomatrix-team' }] },
    { id: 'clients', label: 'Client', href: '/clients/become-a-client', visible: true, children: [{ label: 'Find a client', href: '/clients/find-a-client', perm: 'find_clients' }, { label: 'Become a client', href: '/clients/become-a-client' }] },
    { id: 'funds', label: 'Contribute', href: '/funds/subscribe', visible: true, children: [{ label: 'Subscribe', href: '/funds/subscribe' }, { label: 'Donate', href: '/funds/donate' }] },
    { id: 'contact', label: 'Contact us', href: '/contact/ai-support', visible: true, children: [{ label: 'AI support', href: '/contact/ai-support' }, { label: 'Staff support', href: '/contact/staff-support' }, JOBS] }
  ];
  /* A menu saved earlier in Admin is upgraded on the fly: "Funds" shows as "Contribute", Jobs is added under Contact us, the old Orbit item is dropped. */
  C.getNav = () => {
    const n = window.Site && Site.content && Site.content.nav;
    if (!(Array.isArray(n) && n.length)) return C.DEFAULT_NAV;
    return n.filter(i => !(i && (i.id === 'orbit' || /^\/orbit/.test(i.href || '')))).map(i => {
      if (!i) return i;
      let o = i;
      if (i.id === 'funds' && i.label === 'Funds') o = Object.assign({}, o, { label: 'Contribute' });
      if (i.id === 'contact' && !(i.children || []).some(k => /\/contact\/jobs/.test(k.href || ''))) o = Object.assign({}, o, { children: (i.children || []).concat([JOBS]) });
      return o;
    });
  };

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

  /* A client = a person who needs help. Card for lists and for the full request page. */
  C.clientCard = (c, meId, full) => {
    const esc = UI.esc, L = (l, id) => esc(C.catLabel(l, id));
    const social = [{ url: c.linkedin }].concat(Array.isArray(c.socials) ? c.socials : []).filter(s => s && s.url);
    const links = social.map(s => { const n = HoloIcons.forItem(s); return '<a href="' + esc(Site.safeUrl(s.url)) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(s.label || HoloIcons.label(n)) + '"><span class="ico">' + HoloIcons.svg(n) + '</span></a>'; }).join('');
    const quals = (c.qualifications || []).concat(c.qualification_other ? [c.qualification_other] : []);
    const meta = [];
    if (c.urgency) meta.push('<span class="bd u-' + esc(c.urgency) + '">⏱ ' + L(C.URGENCY, c.urgency) + '</span>');
    if (c.budget_type) meta.push('<span class="bd">💰 ' + L(C.BUDGET, c.budget_type) + (c.budget_text ? ' · ' + esc(c.budget_text) : '') + '</span>');
    if (c.mode) meta.push('<span class="bd">📍 ' + L(C.MODES, c.mode) + (c.location ? ' · ' + esc(c.location) : '') + '</span>');
    if (c.languages) meta.push('<span class="bd">🗣 ' + esc(c.languages) + '</span>');
    const mine = c.user_id === meId, n = c.helpers_count || 0;
    return '<article class="cl' + (full ? ' cl-full' : ' reveal') + '"><div class="cl-top"><div class="cl-av">' + (c.photo_url && /^https:\/\//.test(c.photo_url) ? '<img src="' + esc(c.photo_url) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : esc((c.display_name || '?').trim().charAt(0).toUpperCase())) + '</div>' +
      '<div><small class="by">Request by</small><h4>' + esc(c.display_name) + '</h4><small class="by">' + C.date(c.created_at) + '</small></div></div>' +
      '<h4 class="need">' + esc(c.headline || 'Needs help') + '</h4>' +
      '<div class="tags">' + (c.fields || []).map(f => '<span class="tag2 f">' + L(C.FIELDS, f) + '</span>').join('') + (c.help_types || []).map(h => '<span class="tag2">' + L(C.HELP_TYPES, h) + '</span>').join('') + '</div>' +
      (meta.length ? '<div class="cl-meta">' + meta.join('') + '</div>' : '') +
      (c.bio ? '<p class="cl-prob">' + esc(c.bio) + '</p>' : '') +
      (quals.length ? '<div class="tags"><small class="by">Preferred helper:</small>' + quals.map(q => '<span class="tag2">🎓 ' + esc(q) + '</span>').join('') + '</div>' : '') +
      (full && c.extra ? '<p>' + esc(c.extra) + '</p>' : '') + (links ? '<div class="cl-links">' + links + '</div>' : '') +
      (n ? '<div class="cl-foot">💬 ' + n + ' helper' + (n > 1 ? 's' : '') + ' already talking to this person</div>' : '') +
      '<div class="cl-actions">' + (mine ? '<a class="btn btn-ghost btn-sm" href="/clients/become-a-client">Manage my request</a>' : '<button class="btn btn-primary btn-sm" data-chat="' + c.user_id + '">💬 Offer help</button>') +
      (full || !c.uid ? '' : '<a class="btn btn-ghost btn-sm" href="/clients/find-a-client/' + c.uid + '">View request</a>') + '</div></article>';
  };

  /* Tabs driven by the address: /news/physics, /about/holomatrix-team, /contact/jobs ... (no page reload) */
  const SLUG = { find: 'find-a-client', become: 'become-a-client', staff: 'holomatrix-team' };
  const LEGACY = { 'staff-team': 'staff', 'hire-a-client': 'find' };
  C.tabs = function (o) {
    const parts = () => location.pathname.split('/').filter(Boolean);
    const base = '/' + (parts()[0] || ''), ids = o.items.map(i => i[0]), seg = id => SLUG[id] || id;
    const url = id => base + '/' + seg(id);
    let cur = null;
    const read = () => {
      let s = parts()[1]; if (LEGACY[s]) s = seg(LEGACY[s]);
      const p = ids.find(id => seg(id) === s); if (p) return p;
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
    try { history.replaceState(null, '', url(cur) + (location.hash && !ids.includes(location.hash.slice(1)) ? location.hash : '')); } catch (e) {}
    draw(); o.onChange(cur);
  };

  window.HoloCommon = C;
})();
