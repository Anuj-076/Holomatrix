/* About us: /about/holomatrix (About Holomatrix) and /about/holomatrix-team (one card per person) */
(function () {
  'use strict';
  const C = HoloCommon, esc = UI.esc;
  const sections = { holomatrix: document.getElementById('holomatrix'), staff: document.getElementById('staff') };
  let target = location.hash.slice(1), rendered = false;
  const TAG = { Scientists: ['g-sci', 'Scientist'], Management: ['g-man', 'Management'], Consultants: ['g-con', 'Consultant'] };

  /* "Management & Scientists" → ['Scientists','Management'] in the fixed order; the old "Executive team" counts as Management */
  const groupsOf = m => {
    const set = [];
    String(m.staff_group || 'Management').split(/\s*[&,]\s*/).forEach(x => { x = x.trim(); if (x === 'Executive team') x = 'Management'; if (C.SECTIONS.includes(x) && !set.includes(x)) set.push(x); });
    const out = C.SECTIONS.filter(g => set.includes(g));
    return out.length ? out : ['Management'];
  };

  function card(m) {
    if (m.placeholder) return '<article class="se ph reveal"><div class="se-photo"><span>➕</span></div><div class="se-b"><h4>' + esc(m.name || 'New member') + '</h4><p class="se-role">' + esc(m.title || 'Coming soon') + '</p><p class="se-bio">Details will be added soon.</p></div></article>';
    const ini = esc((m.name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase());
    const links = (Array.isArray(m.links) ? m.links : []).filter(l => l && l.url).map(l => {
      const n = HoloIcons.forItem(l), lab = l.label || HoloIcons.label(n);
      return '<a href="' + esc(Site.safeUrl(l.url)) + '" target="_blank" rel="noopener noreferrer" title="' + esc(lab) + '" aria-label="' + esc(lab) + '"><span class="ico">' + HoloIcons.svg(n) + '</span></a>';
    }).join('');
    const tags = groupsOf(m).map(g => '<span class="gtag ' + TAG[g][0] + '">' + TAG[g][1] + '</span>').join('');
    return '<article class="se reveal"><div class="se-photo">' +
      (m.photo_url && /^https:\/\//.test(m.photo_url) ? '<img src="' + esc(m.photo_url) + '" alt="' + esc(m.name) + '" loading="lazy">' : '<span style="font-family:var(--font-head);font-size:3rem;font-weight:700">' + ini + '</span>') +
      '</div><div class="se-b"><div class="gtags">' + tags + '</div><h4>' + esc(m.name) + '</h4>' + (m.title ? '<p class="se-role">' + esc(m.title) + '</p>' : '') + (m.qualification ? '<p class="se-q">🎓 ' + esc(m.qualification) + '</p>' : '') +
      (m.bio ? '<p class="se-bio">' + esc(m.bio) + '</p>' : '') + (links ? '<div class="se-links">' + links + '</div>' : '') + '</div></article>';
  }

  async function loadStaff() {
    const box = document.getElementById('staff-list');
    const [{ data }, a] = await Promise.all([sb.from('staff_members').select('*').eq('visible', true).order('position').order('created_at'), Site.accessReady]);
    const canEdit = !!(a && a.can('edit_site_content'));
    const rank = m => C.SECTIONS.indexOf(groupsOf(m)[0]);
    const list = (data || []).map((m, i) => ({ m, i })).sort((x, y) => rank(x.m) - rank(y.m) || x.i - y.i).map(x => x.m);   // Scientists first, then Management, then Consultants; each person once
    const add = canEdit ? '<a class="se ph add" href="/admin#website/people"><div class="se-photo"><span>＋</span></div><div class="se-b"><h4>Add team member</h4><p class="se-bio">Add a new member, or a "coming soon" placeholder. Only admins see this card.</p></div></a>' : '';
    box.innerHTML = (list.length ? '<div class="sgrid">' + list.map(card).join('') + '</div>' : '<div class="empty">The Holomatrix Team will appear here soon.</div>') + (add ? '<div class="sgroup"><h3>Admin</h3><div class="sgrid">' + add + '</div></div>' : '');
    UI.observe(box);
  }

  function showHolo() {
    if (!rendered) { rendered = true; sections.holomatrix.innerHTML = HoloRender.aboutPage(); Site.applyAll(); }
    UI.observe();
    if (target) { const id = target; target = ''; setTimeout(() => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 500); }
  }

  C.tabs({
    el: document.getElementById('tabs'), items: [['holomatrix', 'About Holomatrix'], ['staff', 'Holomatrix Team']],
    onChange: id => {
      Object.keys(sections).forEach(k => { sections[k].hidden = k !== id; });
      if (id === 'holomatrix') showHolo();
      if (id === 'staff' && !sections.staff.dataset.loaded) { sections.staff.dataset.loaded = 1; loadStaff(); }
      UI.observe();
    }
  });
})();
