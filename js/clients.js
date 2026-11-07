/* Clients: /clients/find-a-client (only people with the "Find clients" permission) and /clients/become-a-client (free for everyone) */
(function () {
  'use strict';
  const C = HoloCommon, esc = UI.esc;
  const view = document.getElementById('view'), $ = (s, r = document) => r.querySelector(s);
  let me = null, canFind = false;

  const loginGate = msg => '<div class="box cl-gate"><h3>Log in required</h3><p>' + msg + '</p><div class="row"><a class="btn btn-primary btn-sm" href="/login?next=' + encodeURIComponent(location.pathname) + '">Log in</a><a class="btn btn-ghost btn-sm" href="/signup">Sign up</a></div></div>';

  view.addEventListener('click', async e => {
    const b = e.target.closest('[data-chat]'); if (!b) return;
    const ib = await window.HoloInboxReady;
    if (!ib) return UI.toast('Please log in to chat.', 'warn');
    ib.startWith(b.dataset.chat);
  });

  /* ---------- Find a client ---------- */
  async function find() {
    if (!me) { view.innerHTML = loginGate('Log in to continue.'); return; }
    view.innerHTML = '<div class="empty">Loading…</div>';
    const { data, error } = await sb.from('client_profiles').select('*').eq('visible', true).eq('status', 'approved').eq('request_status', 'open').order('created_at', { ascending: false });
    if (error) { view.innerHTML = '<div class="empty">Could not load requests.</div>'; return; }
    const all = (data || []).filter(c => c.user_id !== me.user.id);
    if (!all.length) {
      view.innerHTML = '<div class="cl-empty"><div><div class="ce-ico">🛟</div><h3>No client requests right now</h3><p>When people who need help post a request, it will appear here. Please check back soon.</p></div></div>';
      return;
    }
    let field = 'all', urg = 'all', term = '';
    view.innerHTML = '<div class="filters"><input class="input" id="cs" placeholder="Search requests…"><select class="input" id="cu" style="max-width:200px"><option value="all">Any urgency</option>' + C.URGENCY.map(u => '<option value="' + u[0] + '">' + u[1] + '</option>').join('') + '</select><span id="cf"></span></div><div class="cl-grid" id="cg"></div>';
    const chips = () => { $('#cf').innerHTML = [['all', 'All fields']].concat(C.FIELDS).map(f => '<button class="chipf ' + (f[0] === field ? 'on' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>').join(' '); };
    const draw = () => {
      const rows = all.filter(c => (field === 'all' || (c.fields || []).includes(field)) && (urg === 'all' || c.urgency === urg) && (!term || (c.headline + ' ' + c.bio + ' ' + c.display_name).toLowerCase().includes(term)));
      $('#cg').innerHTML = rows.map(c => C.clientCard(c, me.user.id, false)).join('') || '<div class="empty">No requests match your filters.</div>';
      UI.observe($('#cg'));
    };
    chips(); draw();
    $('#cf').onclick = e => { const b = e.target.closest('[data-f]'); if (b) { field = b.dataset.f; chips(); draw(); } };
    $('#cu').onchange = e => { urg = e.target.value; draw(); };
    $('#cs').oninput = e => { term = e.target.value.trim().toLowerCase(); draw(); };
  }

  /* ---------- Become a client (free for everyone) ---------- */
  async function become() {
    if (!me) { view.innerHTML = loginGate('Log in to post a request.'); return; }
    view.innerHTML = '<div class="empty">Loading…</div>';
    const { data: mine } = await sb.from('client_profiles').select('*').eq('user_id', me.user.id).maybeSingle();
    form(mine);
  }

  function form(m) {
    const md = me.user.user_metadata || {};
    const p = m || { display_name: md.full_name || md.name || '', photo_url: md.avatar_url || md.picture || '', fields: [], help_types: [], qualifications: [], socials: [], urgency: 'flexible', budget_type: 'discuss', mode: 'online' };
    let socials = Array.isArray(p.socials) ? JSON.parse(JSON.stringify(p.socials)) : [];
    const pick = (type, name, list, sel) => '<div class="opts">' + list.map(o => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; const on = Array.isArray(sel) ? sel.includes(v) : sel === v; return '<label class="opt"><input type="' + type + '" name="' + name + '" value="' + esc(v) + '"' + (on ? ' checked' : '') + '><span>' + esc(l) + '</span></label>'; }).join('') + '</div>';
    const srow = (s, i) => '<div class="srow" data-i="' + i + '"><span class="ico">' + HoloIcons.svg(HoloIcons.detect(s.url)) + '</span><input class="input" data-k="label" placeholder="Label (e.g. Instagram)" value="' + esc(s.label || '') + '"><input class="input" data-k="url" placeholder="https://…" value="' + esc(s.url || '') + '"><button type="button" data-rm="' + i + '" style="height:38px;border:1px solid var(--border);border-radius:10px">✕</button></div>';
    const open = m && m.request_status !== 'closed';

    view.innerHTML = '<div class="form">' +
      (m ? '<div class="rq ' + (open ? 'open' : 'closed') + '"><div><b>' + (open ? '✅ Your request is open' : 'Your request is closed') + '</b><small>' + (open ? (m.helpers_count ? m.helpers_count + ' helper' + (m.helpers_count > 1 ? 's are' : ' is') + ' already talking to you. ' : '') + 'Approved helpers can see it. Once you have found help, close it so others are not confused.' : 'Helpers cannot see it. Reopen it if you still need help.') + '</small>' + (m.uid ? '<small>Your request link: <a style="color:var(--accent)" href="/clients/find-a-client/' + esc(m.uid) + '">/clients/find-a-client/' + esc(m.uid) + '</a></small>' : '') + '</div><button class="btn ' + (open ? 'btn-primary' : 'btn-ghost') + ' btn-sm" id="toggle">' + (open ? 'I found help — close my request' : 'Reopen my request') + '</button></div>' : '') +

      '<div class="fsec"><h3>1. What do you need?</h3><p class="hint">Describe your need in one short line.</p>' +
      '<div class="field"><label>What do you need? *</label><input class="input" id="need" maxlength="120" placeholder="e.g. Guidance for my physics research paper" value="' + esc(p.headline || '') + '"></div>' +
      '<div class="field"><label>Define your problem * (at least 40 characters)</label><textarea class="input" id="prob" maxlength="1500" placeholder="What is the situation? What have you tried? What result do you want?">' + esc(p.bio || '') + '</textarea><p class="hint">Do not write phone numbers, addresses, ID numbers, passwords or private medical, legal or money details here. Share them only in chat, and only with people you trust.</p></div></div>' +

      '<div class="fsec"><h3>2. Field and kind of help</h3><label class="hint">Field(s) *</label>' + pick('checkbox', 'fields', C.FIELDS, p.fields || []) + '<label class="hint">Type of help you need *</label>' + pick('checkbox', 'help', C.HELP_TYPES, p.help_types || []) + '</div>' +

      '<div class="fsec"><h3>3. Timeline, budget and place</h3><label class="hint">How soon do you need help? *</label>' + pick('radio', 'urg', C.URGENCY, p.urgency || 'flexible') +
      '<label class="hint">Payment *</label>' + pick('radio', 'bud', C.BUDGET, p.budget_type || 'discuss') +
      '<div class="field"><label>Budget (optional)</label><input class="input" id="budt" maxlength="60" placeholder="e.g. ₹2,000 in total" value="' + esc(p.budget_text || '') + '"></div>' +
      '<label class="hint">Where? *</label>' + pick('radio', 'mode', C.MODES, p.mode || 'online') +
      '<div class="two"><div class="field"><label>City / country (optional)</label><input class="input" id="loc" maxlength="80" value="' + esc(p.location || '') + '"></div><div class="field"><label>Languages (optional)</label><input class="input" id="lang" maxlength="80" placeholder="e.g. English, Hindi" value="' + esc(p.languages || '') + '"></div></div></div>' +

      '<div class="fsec"><h3>4. Who can help you best? (optional)</h3><p class="hint">Tick qualifications you would like in a helper.</p>' + pick('checkbox', 'quals', C.QUALS, p.qualifications || []) +
      '<div class="field"><label>Other (optional)</label><input class="input" id="qo" maxlength="120" value="' + esc(p.qualification_other || '') + '"></div></div>' +

      '<div class="fsec"><h3>5. About you</h3>' +
      '<div class="field"><label>Display name *</label><input class="input" id="dn" maxlength="80" value="' + esc(p.display_name) + '"></div>' +
      '<div class="field"><label>LinkedIn (optional)</label><input class="input" id="li" placeholder="https://www.linkedin.com/in/…" value="' + esc(p.linkedin || '') + '"></div>' +
      '<label class="hint">Other social media (optional)</label><div id="srows"></div><button type="button" id="sadd" style="height:36px;border:1px solid var(--border);border-radius:10px;padding:0 14px;width:max-content;margin:4px 0 14px">+ Add link</button>' +
      '<div class="field"><label>Anything else helpers should know (optional)</label><textarea class="input" id="extra" maxlength="1500">' + esc(p.extra || '') + '</textarea></div></div>' +

      '<div class="warn-box"><b>⚠ Before you post.</b>\nYour request is visible to approved helpers while it is open. Holomatrix is not responsible for any payment, agreement, quality of help, advice, loss or scam. We do not verify helpers, so check them yourself. Never pay strangers in advance and never share passwords, one-time codes or bank details. When you have found help, close your request. Requests that are illegal, harmful, or ask someone to cheat or break rules will be removed.</div>' +
      (m ? '' : '<label class="chk"><input type="checkbox" id="agree"><span>I agree to the <a href="/terms" target="_blank" rel="noopener">Terms</a> and <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>, and I understand Holomatrix is not responsible for payments or agreements between clients and helpers.</span></label>') +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="btn btn-primary" id="save">' + (m ? 'Save changes' : 'Post my request') + '</button>' + (m ? '<button class="btn btn-danger btn-sm" id="del">Delete request</button>' : '') + '</div></div>';

    const drawS = () => { $('#srows').innerHTML = socials.map(srow).join(''); };
    drawS();
    view.oninput = e => { const r = e.target.closest('.srow'); if (r) { const i = +r.dataset.i; socials[i][e.target.dataset.k] = e.target.value; $('.ico', r).innerHTML = HoloIcons.svg(HoloIcons.detect(socials[i].url)); } };
    $('#srows').onclick = e => { const x = e.target.closest('[data-rm]'); if (x) { socials.splice(+x.dataset.rm, 1); drawS(); } };
    $('#sadd').onclick = () => { socials.push({ label: '', url: '' }); drawS(); };

    if (m) $('#toggle').onclick = async () => {
      const o = m.request_status !== 'closed';
      if (o && !(await UI.confirm('Close your request?', 'Helpers will no longer see it. You can reopen it later if you still need help.', { confirmText: 'Yes, I found help' }))) return;
      const { error } = await sb.from('client_profiles').update({ request_status: o ? 'closed' : 'open', visible: !o }).eq('user_id', me.user.id);
      if (error) return UI.toast(error.message, 'error');
      UI.toast(o ? 'Request closed. Glad you found help! 🎉' : 'Your request is open again.', 'success'); become();
    };
    if (m) $('#del').onclick = async () => {
      if (!(await UI.confirm('Delete your request?', 'It is removed completely. You can post a new one later.', { confirmText: 'Delete', danger: true }))) return;
      const { error } = await sb.from('client_profiles').delete().eq('user_id', me.user.id);
      if (error) return UI.toast(error.message, 'error'); UI.toast('Request deleted.', 'success'); become();
    };

    $('#save').onclick = async () => {
      const val = id => $('#' + id).value.trim(), chk = n => Array.from(document.querySelectorAll('input[name="' + n + '"]:checked')).map(i => i.value), one = n => { const i = document.querySelector('input[name="' + n + '"]:checked'); return i ? i.value : ''; };
      const need = val('need'), prob = val('prob'), fields = chk('fields'), helps = chk('help'), li = val('li') ? C.normUrl(val('li')) : '';
      if (need.length < 8) return UI.toast('Please say what you need (at least 8 characters).', 'warn');
      if (prob.length < 40) return UI.toast('Please define your problem in at least 40 characters.', 'warn');
      if (!fields.length) return UI.toast('Choose at least one field.', 'warn');
      if (!helps.length) return UI.toast('Choose the type of help you need.', 'warn');
      if (val('dn').length < 2) return UI.toast('Please enter your display name.', 'warn');
      if (val('li') && !li) return UI.toast('The LinkedIn link is not valid.', 'warn');
      if (!m && !$('#agree').checked) return UI.toast('Please accept the Terms, Privacy Policy and payment notice.', 'warn');
      const row = { display_name: val('dn'), headline: need, bio: prob, photo_url: p.photo_url || null, fields, help_types: helps, urgency: one('urg') || 'flexible', budget_type: one('bud') || 'discuss', budget_text: val('budt') || null,
        mode: one('mode') || 'online', location: val('loc') || null, languages: val('lang') || null, qualifications: chk('quals'), qualification_other: val('qo') || null, linkedin: li || null,
        socials: socials.map(s => ({ label: (s.label || '').trim(), url: C.normUrl(s.url) })).filter(s => s.url), extra: val('extra') || null };
      const btn = $('#save'); btn.disabled = true;
      const res = m ? await sb.from('client_profiles').update(row).eq('user_id', me.user.id)
        : await sb.from('client_profiles').insert(Object.assign(row, { user_id: me.user.id, visible: true, request_status: 'open', accepted_terms_at: new Date().toISOString() }));
      btn.disabled = false;
      if (res.error) return UI.toast(res.error.message, 'error', 6000);
      UI.toast(m ? 'Request saved.' : 'Your request is live. Helpers can now find you!', 'success'); become();
    };
  }

  (async () => {
    me = await Auth.access(); canFind = !!(me && me.can('find_clients'));
    const items = canFind ? [['find', 'Find a client'], ['become', 'Become a client']] : [['become', 'Become a client']];
    C.tabs({ el: document.getElementById('tabs'), items, onChange: id => { view.innerHTML = '<div class="empty">Loading…</div>'; id === 'find' ? find() : become(); } });
  })();
})();
