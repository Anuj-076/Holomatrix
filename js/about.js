/* About us: Holomatrix + Staff (grouped: Scientists, Management, Executive team) */
(function () {
  'use strict';
  const C = HoloCommon, esc = UI.esc;
  const sections = { holomatrix: document.getElementById('holomatrix'), staff: document.getElementById('staff') };

  function card(m) {
    const ini = esc((m.name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase());
    const links = (Array.isArray(m.links) ? m.links : []).filter(l => l && l.url).map(l => {
      const n = HoloIcons.forItem(l), lab = l.label || HoloIcons.label(n);
      return '<a href="' + esc(Site.safeUrl(l.url)) + '" target="_blank" rel="noopener noreferrer" title="' + esc(lab) + '" aria-label="' + esc(lab) + '"><span class="ico">' + HoloIcons.svg(n) + '</span></a>';
    }).join('');
    return '<article class="se reveal"><div class="se-photo">' +
      (m.photo_url && /^https:\/\//.test(m.photo_url) ? '<img src="' + esc(m.photo_url) + '" alt="' + esc(m.name) + '" loading="lazy">' : '<span class="initials" style="font-family:var(--font-head);font-size:3rem;font-weight:700">' + ini + '</span>') +
      '</div><div class="se-b"><h4>' + esc(m.name) + '</h4>' +
      (m.title ? '<p class="se-role">' + esc(m.title) + '</p>' : '') +
      (m.qualification ? '<p class="se-q">🎓 ' + esc(m.qualification) + '</p>' : '') +
      (m.bio ? '<p class="se-bio">' + esc(m.bio) + '</p>' : '') +
      (links ? '<div class="se-links">' + links + '</div>' : '') + '</div></article>';
  }

  async function loadStaff() {
    const box = document.getElementById('staff-list');
    const { data } = await sb.from('staff_members').select('*').eq('visible', true).order('position').order('created_at');
    const list = data || [];
    box.innerHTML = C.GROUPS.map(g => {
      const rows = list.filter(m => (m.staff_group || 'Management') === g);
      return rows.length ? '<div class="sgroup"><h3>' + esc(g) + '</h3><div class="sgrid">' + rows.map(card).join('') + '</div></div>' : '';
    }).join('') || '<div class="empty">Staff will appear here soon.</div>';
    UI.observe(box);
  }

  C.tabs({
    el: document.getElementById('tabs'), items: [['holomatrix', 'Holomatrix'], ['staff', 'Staff']],
    onChange: id => { Object.keys(sections).forEach(k => { sections[k].hidden = k !== id; }); if (id === 'staff' && !sections.staff.dataset.loaded) { sections.staff.dataset.loaded = 1; loadStaff(); } UI.observe(); }
  });
})();
