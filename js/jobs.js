/* Jobs (Contact us → Jobs, /contact/jobs). Only Administrators can post, edit, close or delete roles. */
(function () {
  'use strict';
  ['/css/holo2.css', '/css/holo3.css', '/css/clients.css'].forEach(h => { if (!document.querySelector('link[href="' + h + '"]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; document.head.appendChild(l); } });   // card, tag and empty-state styles

  const C = HoloCommon, e = UI.esc, $ = (s, r = document) => r.querySelector(s);
  const TYPES = ['Consultant', 'Scientist', 'Management', 'Other'], TAG = { Consultant: 'g-con', Scientist: 'g-sci', Management: 'g-man', Other: 'g-oth' };
  let view = null, isAdm = false, rows = [];

  const lines = t => String(t || '').split('\n').map(x => x.trim()).filter(Boolean);
  const ul = (h, t) => lines(t).length ? '<h5>' + h + '</h5><ul class="list">' + lines(t).map(x => '<li>' + e(x) + '</li>').join('') + '</ul>' : '';

  function card(o) {
    const meta = [o.mode && '🧭 ' + o.mode, o.location && '📍 ' + o.location, o.deadline && '⏳ Apply by ' + C.date(o.deadline)].filter(Boolean).map(x => '<span class="bd">' + e(x) + '</span>').join('');
    return '<article class="op reveal' + (o.is_open ? '' : ' closed') + '"><div class="op-top"><span class="gtag ' + (TAG[o.role_type] || 'g-oth') + '">' + e(o.role_type) + '</span>' + (o.is_open ? '' : '<span class="gtag g-oth">Closed</span>') + '</div>' +
      '<h3>' + e(o.title) + '</h3>' + (o.summary ? '<p class="op-s">' + e(o.summary) + '</p>' : '') + (meta ? '<div class="op-meta">' + meta + '</div>' : '') +
      ul('What you will do', o.responsibilities) + ul('What we look for', o.requirements) +
      '<div class="op-act">' + (o.is_open ? '<button class="btn btn-primary btn-sm" data-apply="' + o.id + '">Apply</button>' : '') +
      (isAdm ? '<button class="btn btn-ghost btn-sm" data-edit="' + o.id + '">Edit</button><button class="btn btn-ghost btn-sm" data-tog="' + o.id + '">' + (o.is_open ? 'Close role' : 'Reopen') + '</button><button class="btn btn-danger btn-sm" data-del="' + o.id + '">Delete</button>' : '') + '</div></article>';
  }

  async function list() {
    view.innerHTML = '<div class="empty">Loading…</div>';
    const { data, error } = await sb.from('openings').select('*').order('created_at', { ascending: false });
    if (error) { view.innerHTML = '<div class="empty">Could not load the jobs.</div>'; return; }
    rows = data || [];
    view.innerHTML = (isAdm ? '<div class="op-adm"><button class="btn btn-primary btn-sm" id="opnew">＋ Post a job</button> <small style="color:var(--muted)">Only Administrators see this.</small></div>' : '') +
      (rows.length ? '<div class="op-grid">' + rows.map(card).join('') + '</div>' : '<div class="cl-empty"><div><div class="ce-ico">💼</div><h3>No jobs right now</h3><p>When Holomatrix posts a job, it will appear here. Please check back soon.</p></div></div>');
    UI.observe(view);
  }

  function dlg(title, html) {
    const b = document.createElement('div'); b.className = 'modal-backdrop';
    b.innerHTML = '<div class="modal ed-ui" role="dialog" aria-modal="true" style="width:min(620px,100%);max-height:92vh;overflow:auto"><h3>' + e(title) + '</h3>' + html + '</div>';
    const close = () => { b.classList.remove('show'); setTimeout(() => b.remove(), 260); };
    b.addEventListener('mousedown', ev => { if (ev.target === b) close(); });
    document.body.appendChild(b); requestAnimationFrame(() => b.classList.add('show'));
    return { el: b, close };
  }

  function form(o) {
    const p = o || { title: '', role_type: 'Consultant', summary: '', responsibilities: '', requirements: '', mode: '', location: '', deadline: '', is_open: true };
    const d = dlg(o ? 'Edit job' : 'Post a job',
      '<div class="op-form"><div class="field"><label>Job title *</label><input class="input" id="f-t" maxlength="120" value="' + e(p.title) + '"></div>' +
      '<div class="field"><label>Type *</label><select class="input" id="f-r">' + TYPES.map(x => '<option' + (p.role_type === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Short summary</label><textarea class="input" id="f-s" maxlength="600">' + e(p.summary || '') + '</textarea></div>' +
      '<div class="field"><label>What you will do (one point per line)</label><textarea class="input" id="f-a" maxlength="1500">' + e(p.responsibilities || '') + '</textarea></div>' +
      '<div class="field"><label>What we look for (one point per line)</label><textarea class="input" id="f-q" maxlength="1500">' + e(p.requirements || '') + '</textarea></div>' +
      '<div class="two"><div class="field"><label>Mode (e.g. Remote)</label><input class="input" id="f-m" maxlength="60" value="' + e(p.mode || '') + '"></div><div class="field"><label>Location (optional)</label><input class="input" id="f-l" maxlength="80" value="' + e(p.location || '') + '"></div></div>' +
      '<div class="field"><label>Apply by (optional)</label><input class="input" id="f-d" type="date" value="' + e(p.deadline || '') + '"></div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" id="f-c">Cancel</button><button class="btn btn-primary" id="f-ok">' + (o ? 'Save changes' : 'Post job') + '</button></div></div>');
    const el = d.el, v = id => $('#' + id, el).value.trim();
    $('#f-c', el).onclick = d.close;
    $('#f-ok', el).onclick = async () => {
      if (v('f-t').length < 3) return UI.toast('Please enter a job title.', 'warn');
      const row = { title: v('f-t'), role_type: v('f-r'), summary: v('f-s') || null, responsibilities: v('f-a') || null, requirements: v('f-q') || null, mode: v('f-m') || null, location: v('f-l') || null, deadline: v('f-d') || null };
      const res = o ? await sb.from('openings').update(row).eq('id', o.id) : await sb.from('openings').insert(row);
      if (res.error) return UI.toast(res.error.message, 'error', 6000);
      UI.toast(o ? 'Job saved.' : 'Job posted.', 'success'); d.close(); list();
    };
  }

  async function onClick(ev) {
    const t = ev.target.closest('button'); if (!t) return;
    if (t.id === 'opnew') return form(null);
    const find = id => rows.find(x => x.id === id);
    if (t.dataset.apply) return UI.alert('Applications open soon', 'The application form for this job is being prepared. Please check back soon, or ask the team through Staff support.');
    if (!isAdm) return;
    if (t.dataset.edit) return form(find(t.dataset.edit));
    if (t.dataset.tog) { const o = find(t.dataset.tog), { error } = await sb.from('openings').update({ is_open: !o.is_open }).eq('id', o.id); if (error) return UI.toast(error.message, 'error'); list(); }
    if (t.dataset.del) {
      const o = find(t.dataset.del);
      if (!(await UI.confirm('Delete “' + o.title + '”?', 'The job is removed completely.', { confirmText: 'Delete', danger: true }))) return;
      const { error } = await sb.from('openings').delete().eq('id', o.id); if (error) return UI.toast(error.message, 'error'); list();
    }
  }

  window.HoloJobs = {
    async show(el) {
      view = el; view.onclick = onClick;
      const a = await Auth.access(); isAdm = !!(a && a.can('administrator'));
      list();
    }
  };
})();
