/* Clients: "Hire a client" (list) and "Become a client" (premium form) */
(function () {
  'use strict';
  const C = HoloCommon, esc = UI.esc;
  const view = document.getElementById('view');
  const $ = (s, r = document) => r.querySelector(s);
  const ini = n => esc((n || '?').trim().charAt(0).toUpperCase());
  let me = null, premium = false, ready = null;

  const loginGate = msg => '<div class="box"><h3>Log in required</h3><p>' + msg + '</p><div class="row"><a class="btn btn-primary btn-sm" href="/login?next=' + encodeURIComponent('/clients' + location.hash) + '">Log in</a><a class="btn btn-ghost btn-sm" href="/signup">Sign up</a></div></div>';

  /* ---------- Hire a client ---------- */
  async function hire() {
    if (!me) { view.innerHTML = loginGate('Log in to see clients you can hire.'); return; }
    view.innerHTML = '<div class="empty">Loading…</div>';
    const { data, error } = await sb.from('client_profiles').select('*').eq('visible', true).eq('status', 'approved').order('created_at', { ascending: false });
    if (error) { view.innerHTML = '<div class="empty">Could not load clients.</div>'; return; }
    const all = data || []; let field = 'all', term = '';
    view.innerHTML = '<div class="filters"><input class="input" id="cs" placeholder="Search name or skills…"><span id="cf"></span></div><div class="cl-grid" id="cg"></div>';
    const chips = () => { $('#cf').innerHTML = [['all', 'All fields']].concat(C.FIELDS).map(f => '<button class="chipf ' + (f[0] === field ? 'on' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>').join(' '); };
    const draw = () => {
      const rows = all.filter(c => (field === 'all' || (c.fields || []).includes(field)) &&
        (!term || (c.display_name + ' ' + (c.headline || '') + ' ' + (c.bio || '')).toLowerCase().includes(term)));
      $('#cg').innerHTML = rows.map(card).join('') || '<div class="empty">No clients found.</div>';
      UI.observe($('#cg'));
    };
    chips(); draw();
    $('#cf').onclick = e => { const b = e.target.closest('[data-f]'); if (b) { field = b.dataset.f; chips(); draw(); } };
    $('#cs').oninput = e => { term = e.target.value.trim().toLowerCase(); draw(); };
  }

  function card(c) {
    const social = [{ url: c.linkedin }].concat(Array.isArray(c.socials) ? c.socials : []).filter(s => s && s.url);
    const links = social.map(s => { const n = HoloIcons.forItem(s); return '<a href="' + esc(Site.safeUrl(s.url)) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(s.label || HoloIcons.label(n)) + '"><span class="ico">' + HoloIcons.svg(n) + '</span></a>'; }).join('');
    const quals = (c.qualifications || []).concat(c.qualification_other ? [c.qualification_other] : []);
    return '<article class="cl reveal"><div class="cl-top"><div class="cl-av">' + (c.photo_url && /^https:\/\//.test(c.photo_url) ? '<img src="' + esc(c.photo_url) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : ini(c.display_name)) + '</div>' +
      '<div><h4>' + esc(c.display_name) + '</h4>' + (c.headline ? '<small>' + esc(c.headline) + '</small>' : '') + '</div></div>' +
      ((c.fields || []).length ? '<div class="tags">' + c.fields.map(f => '<span class="tag2 f">' + esc(C.catLabel(C.FIELDS, f)) + '</span>').join('') + '</div>' : '') +
      (quals.length ? '<div class="tags">' + quals.map(q => '<span class="tag2">🎓 ' + esc(q) + '</span>').join('') + '</div>' : '') +
      (c.experience_years ? '<small style="color:var(--muted)">' + c.experience_years + ' yrs experience</small>' : '') +
      (c.bio ? '<p>' + esc(c.bio) + '</p>' : '') + (c.extra ? '<p>' + esc(c.extra) + '</p>' : '') +
      '<div class="cl-links">' + links +
      (c.portfolio_url ? '<a href="' + esc(Site.safeUrl(c.portfolio_url)) + '" target="_blank" rel="noopener noreferrer"><span class="ico">' + HoloIcons.svg('website') + '</span>Portfolio</a>' : '') +
      (c.contact_email ? '<a href="mailto:' + esc(c.contact_email) + '"><span class="ico">' + HoloIcons.svg('email') + '</span>' + esc(c.contact_email) + '</a>' : '') + '</div></article>';
  }

  /* ---------- Become a client ---------- */
  async function become() {
    if (!me) { view.innerHTML = loginGate('Log in to become a client.'); return; }
    view.innerHTML = '<div class="empty">Loading…</div>';
    const { data: mine } = await sb.from('client_profiles').select('*').eq('user_id', me.user.id).maybeSingle();
    if (!premium && !mine) {
      view.innerHTML = '<div class="box"><h3>🔒 Premium feature</h3><p>Becoming a client is available to subscribers. Choose a pack to unlock it.</p><div class="row"><a class="btn btn-primary btn-sm" href="/funds#subscribe">View packs</a></div></div>';
      return;
    }
    form(mine);
  }

  function form(m) {
    const md = me.user.user_metadata || {};
    const p = m || { display_name: md.full_name || md.name || '', photo_url: md.avatar_url || md.picture || '', fields: [], qualifications: [], socials: [], visible: true };
    let socials = Array.isArray(p.socials) ? JSON.parse(JSON.stringify(p.socials)) : [];
    const opts = (name, list, sel) => '<div class="opts">' + list.map(o => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return '<label class="opt"><input type="checkbox" name="' + name + '" value="' + esc(v) + '"' + (sel.includes(v) ? ' checked' : '') + '><span>' + esc(l) + '</span></label>'; }).join('') + '</div>';
    const srow = (s, i) => '<div class="srow" data-i="' + i + '"><span class="ico">' + HoloIcons.svg(HoloIcons.detect(s.url)) + '</span><input class="input" data-k="label" placeholder="Label (e.g. Instagram)" value="' + esc(s.label || '') + '"><input class="input" data-k="url" placeholder="https://…" value="' + esc(s.url || '') + '"><button type="button" class="ib" data-rm="' + i + '" style="height:38px;border:1px solid var(--border);border-radius:10px">✕</button></div>';

    view.innerHTML = '<div class="form">' +
      (m ? '<div class="switchrow"><div><b>Show my details in “Hire a client”</b><small>Turn off to hide your profile any time.</small></div><label class="sw"><input type="checkbox" id="vis" ' + (p.visible ? 'checked' : '') + '><i></i></label></div>' : '') +
      '<h3>About you</h3><div class="two"><div class="field"><label>Display name *</label><input class="input" id="dn" maxlength="80" value="' + esc(p.display_name) + '"></div>' +
      '<div class="field"><label>Headline</label><input class="input" id="hl" maxlength="120" placeholder="e.g. Astrophysics tutor and researcher" value="' + esc(p.headline || '') + '"></div></div>' +
      '<div class="field"><label>Bio * (at least 30 characters)</label><textarea class="input" id="bio" maxlength="1500">' + esc(p.bio || '') + '</textarea></div>' +
      '<div class="two"><div class="field"><label>Years of experience</label><input class="input" id="exp" type="number" min="0" max="80" value="' + esc(p.experience_years ?? '') + '"></div>' +
      '<div class="field"><label>Public contact email (optional)</label><input class="input" id="ce" type="email" value="' + esc(p.contact_email || '') + '"></div></div>' +
      '<h3>Fields *</h3>' + opts('fields', C.FIELDS, p.fields || []) +
      '<h3>Qualification *</h3>' + opts('quals', C.QUALS, p.qualifications || []) +
      '<div class="field"><label>Other qualification (optional)</label><input class="input" id="qo" maxlength="120" value="' + esc(p.qualification_other || '') + '"></div>' +
      '<h3>Links</h3><div class="field"><label>LinkedIn *</label><input class="input" id="li" placeholder="https://www.linkedin.com/in/…" value="' + esc(p.linkedin || '') + '"></div>' +
      '<div class="field"><label>Portfolio (optional)</label><input class="input" id="pf" placeholder="https://…" value="' + esc(p.portfolio_url || '') + '"></div>' +
      '<label style="font-size:.85rem;color:var(--muted);font-weight:500">Other social media (optional)</label><div id="srows"></div><button type="button" class="ib" id="sadd" style="height:36px;border:1px solid var(--border);border-radius:10px;padding:0 14px;width:max-content;margin-bottom:10px">+ Add link</button>' +
      '<h3>Other details</h3><div class="field"><textarea class="input" id="extra" maxlength="1500" placeholder="Services, languages, availability, projects…">' + esc(p.extra || '') + '</textarea></div>' +
      '<div class="warn-box"><b>⚠ Payments.</b> Holomatrix is not responsible for any payment or agreement between you and the people who hire you. Everyone must choose trusted partners and verify them. If someone is scammed, Holomatrix is not responsible.</div>' +
      (m ? '' : '<label class="chk"><input type="checkbox" id="agree"><span>I agree to the <a href="/terms" target="_blank" rel="noopener">Terms</a> and <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>, and I understand Holomatrix is not responsible for payments between clients and hirers.</span></label>') +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="btn btn-primary" id="save">' + (m ? 'Save changes' : 'Create client profile') + '</button>' + (m ? '<button class="btn btn-danger btn-sm" id="del">Delete profile</button>' : '') + '</div></div>';

    const drawS = () => { $('#srows').innerHTML = socials.map(srow).join(''); };
    drawS();
    view.addEventListener('input', e => { const r = e.target.closest('.srow'); if (r) { const i = +r.dataset.i; socials[i][e.target.dataset.k] = e.target.value; $('.ico', r).innerHTML = HoloIcons.svg(HoloIcons.detect(socials[i].url)); } });
    view.addEventListener('click', e => { const x = e.target.closest('[data-rm]'); if (x) { socials.splice(+x.dataset.rm, 1); drawS(); } });
    $('#sadd').onclick = () => { socials.push({ label: '', url: '' }); drawS(); };

    if (m) $('#vis').onchange = async e => {
      const { error } = await sb.from('client_profiles').update({ visible: e.target.checked }).eq('user_id', me.user.id);
      if (error) { e.target.checked = !e.target.checked; return UI.toast(error.message, 'error'); }
      UI.toast(e.target.checked ? 'Your profile is now visible.' : 'Your profile is hidden.', 'success');
    };
    if (m) $('#del').onclick = async () => {
      if (!(await UI.confirm('Delete your client profile?', 'You can create a new one later.', { confirmText: 'Delete', danger: true }))) return;
      const { error } = await sb.from('client_profiles').delete().eq('user_id', me.user.id);
      if (error) return UI.toast(error.message, 'error'); UI.toast('Profile deleted.', 'success'); become();
    };

    $('#save').onclick = async () => {
      const val = id => $('#' + id).value.trim(), chk = n => Array.from(document.querySelectorAll('input[name="' + n + '"]:checked')).map(i => i.value);
      const name = val('dn'), bio = val('bio'), fields = chk('fields'), quals = chk('quals'), qo = val('qo');
      const li = C.normUrl(val('li')), pf = val('pf') ? C.normUrl(val('pf')) : '';
      if (name.length < 2) return UI.toast('Please enter your display name.', 'warn');
      if (bio.length < 30) return UI.toast('Please write a bio of at least 30 characters.', 'warn');
      if (!fields.length) return UI.toast('Choose at least one field.', 'warn');
      if (!quals.length && !qo) return UI.toast('Choose your qualification.', 'warn');
      if (!li) return UI.toast('Please add a valid LinkedIn link.', 'warn');
      if (val('pf') && !pf) return UI.toast('Portfolio link is not valid.', 'warn');
      if (val('ce') && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('ce'))) return UI.toast('Contact email is not valid.', 'warn');
      if (!m && !$('#agree').checked) return UI.toast('Please accept the Terms, Privacy Policy and payment notice.', 'warn');
      const so = socials.map(s => ({ label: (s.label || '').trim(), url: C.normUrl(s.url) })).filter(s => s.url);
      const row = { display_name: name, headline: val('hl') || null, bio, photo_url: p.photo_url || null, linkedin: li, socials: so, fields, qualifications: quals,
        qualification_other: qo || null, experience_years: val('exp') ? Math.min(80, Math.max(0, +val('exp'))) : null, portfolio_url: pf || null, contact_email: val('ce') || null, extra: val('extra') || null };
      const btn = $('#save'); btn.disabled = true;
      const res = m ? await sb.from('client_profiles').update(row).eq('user_id', me.user.id)
        : await sb.from('client_profiles').insert(Object.assign(row, { user_id: me.user.id, visible: true, accepted_terms_at: new Date().toISOString() }));
      btn.disabled = false;
      if (res.error) return UI.toast(res.error.message, 'error', 6000);
      UI.toast(m ? 'Profile saved.' : 'You are now listed as a client!', 'success'); become();
    };
  }

  ready = (async () => { me = await Auth.access(); premium = me ? await C.premium() : false; })();
  C.tabs({
    el: document.getElementById('tabs'), items: [['hire', 'Hire a client'], ['become', 'Become a client', true]],
    onChange: async id => { await ready; view.innerHTML = '<div class="empty">Loading…</div>'; id === 'hire' ? hire() : become(); }
  });
})();
