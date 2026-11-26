/* Holomatrix admin dashboard */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = UI.esc, HC = HoloCommon;
  const fmt = d => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  const ini = n => (n || '?').trim().charAt(0).toUpperCase();
  const fail = e => UI.toast((e && e.message) || 'Something went wrong.', 'error', 6500);
  const hexv = v => /^#[0-9a-f]{6}$/i.test(v || '') ? v : '';
  const clone = o => JSON.parse(JSON.stringify(o));
  let A = null, myTop = 9999, channel = null, tick = null;
  const can = p => A.can(p);
  const C = { roles: [], nm: null };
  const R = {};

  const PERMS = {
    administrator: ['Administrator', 'Every permission, including giving the Founder role. Give this only to people you fully trust.'],
    view_dashboard: ['View dashboard', 'Open the admin dashboard.'],
    manage_users: ['Manage users', 'See the user list.'],
    ban_users: ['Ban users', 'Ban or unban members ranked below you.'],
    manage_roles: ['Manage roles', 'Create, edit, reorder and delete roles.'],
    assign_roles: ['Assign roles', 'Give or remove roles from users.'],
    send_announcements: ['Send announcements', 'Email announcements to members.'],
    edit_site_content: ['Edit website', 'Edit text, menu, people, blocks, banners, images and links.'],
    manage_content: ['Manage news & research', 'Write, edit and delete articles and research papers.'],
    manage_clients: ['Manage clients', 'Hide, suspend or delete client requests.'],
    find_clients: ['Find clients', 'See the Find a client page, read open requests and chat with clients (helpers).'],
    manage_subscriptions: ['Manage subscriptions', 'Not used for now (packs are switched off).'],
    view_support: ['View support chats', 'Read member conversations.'],
    reply_support: ['Reply to support', 'Answer and close chats.'],
    view_analytics: ['View analytics', 'Reserved for analytics.'],
    view_logs: ['View audit logs', 'See who changed what.']
  };
  const GROUPS = [
    ['Special', ['administrator']],
    ['General', ['view_dashboard', 'view_analytics', 'view_logs']],
    ['People', ['manage_users', 'ban_users', 'manage_roles', 'assign_roles']],
    ['Content', ['edit_site_content', 'manage_content', 'send_announcements']],
    ['Members', ['manage_clients', 'find_clients']],
    ['Support', ['view_support', 'reply_support']]
  ];
  const TABS = [
    { id: 'overview', label: 'Overview', ico: '📊' },
    { id: 'users', label: 'Users', ico: '👥', perm: ['manage_users', 'assign_roles'] },
    { id: 'roles', label: 'Roles', ico: '🛡️', perm: ['manage_roles'] },
    { id: 'support', label: 'Support', ico: '💬', perm: ['view_support'] },
    { id: 'content', label: 'News & Research', ico: '📰', perm: ['manage_content'] },
    { id: 'clients', label: 'Clients', ico: '🧑‍💼', perm: ['manage_clients'] },
    { id: 'website', label: 'Website', ico: '🌐', perm: ['edit_site_content'] },
    { id: 'announce', label: 'Announcements', ico: '📣', perm: ['send_announcements'] },
    { id: 'logs', label: 'Audit logs', ico: '📜', perm: ['view_logs'] }
  ];
  const allowed = t => !t.perm || t.perm.some(can);

  /* ---------- Helpers ---------- */
  function dialog(title, html, o) {
    o = o || {};
    const b = document.createElement('div'); b.className = 'modal-backdrop';
    b.innerHTML = '<div class="modal dlg' + (o.wide ? ' wide' : '') + '" role="dialog" aria-modal="true"><div class="dlg-h"><h3>' + esc(title) + '</h3><button class="dlg-x" aria-label="Close">✕</button></div><div class="dlg-b">' + html + '</div></div>';
    const k = e => { if (e.key === 'Escape') close(); };
    const close = () => { b.classList.remove('show'); document.removeEventListener('keydown', k); setTimeout(() => b.remove(), 260); };
    b.addEventListener('mousedown', e => { if (e.target === b) close(); });
    b.querySelector('.dlg-x').onclick = close;
    document.addEventListener('keydown', k); document.body.appendChild(b);
    requestAnimationFrame(() => b.classList.add('show'));
    return { el: b.querySelector('.dlg-b'), close };
  }
  const avatar = u => '<span class="av">' + (u && u.avatar_url && /^https:\/\//.test(u.avatar_url) ? '<img src="' + esc(u.avatar_url) + '" alt="" referrerpolicy="no-referrer">' : esc(ini((u && (u.full_name || u.email)) || '?'))) + '</span>';
  const chip = r => '<span class="chip" style="--c:' + esc(hexv(r.color) || '#8b5cf6') + '">' + esc(r.name) + '</span>';
  const myName = () => { const md = A.user.user_metadata || {}; return md.full_name || md.name || A.user.email; };
  const isFounder = () => A.isAdmin && myTop === 0;

  async function saveContent(key, value) {
    const { error } = await sb.from('site_content').upsert({ key, value, updated_by: A.user.id, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;
  }
  async function getContent(keys) {
    const { data } = await sb.from('site_content').select('key,value').in('key', keys);
    const o = {}; (data || []).forEach(r => { o[r.key] = r.value || {}; }); return o;
  }
  async function names() {
    if (C.nm) return C.nm;
    const nm = { roles: {}, users: {} };
    const r = await sb.from('roles').select('id,name'); (r.data || []).forEach(x => { nm.roles[x.id] = x.name; });
    try { const p = await sb.from('profiles').select('id,full_name,email'); (p.data || []).forEach(x => { nm.users[x.id] = x.full_name || x.email; }); } catch (e) {}
    C.nm = nm; return nm;
  }
  function describe(l) {
    const d = l.details || {}, a = l.action || '', nm = C.nm || { roles: {}, users: {} };
    const rn = id => nm.roles[id] || 'a role', un = id => nm.users[id] || 'a user';
    const verb = { insert: 'Created', update: 'Edited', delete: 'Deleted' }[a.split('.')[1]] || 'Changed';
    if (a === 'user_roles.insert') return 'Gave role “' + rn(d.role_id) + '” to ' + un(d.user_id);
    if (a === 'user_roles.delete') return 'Removed role “' + rn(d.role_id) + '” from ' + un(d.user_id);
    if (a === 'user.ban') return 'Banned ' + un(d.user_id);
    if (a === 'user.unban') return 'Unbanned ' + un(d.user_id);
    if (a.indexOf('roles.') === 0) return verb + ' role “' + (d.name || '') + '”';
    if (a.indexOf('site_content.') === 0) return 'Updated site content “' + (d.key || '') + '”';
    if (a.indexOf('site_blocks.') === 0) return verb + ' block “' + (d.title || d.type || '') + '”';
    if (a.indexOf('staff_members.') === 0) return verb + ' team member “' + (d.name || '') + '”';
    if (a.indexOf('articles.') === 0) return verb + ' article “' + (d.title || '') + '”';
    if (a.indexOf('researches.') === 0) return verb + ' research “' + (d.title || '') + '”';
    if (a.indexOf('plans.') === 0) return 'Edited plan “' + (d.name || '') + '”';
    if (a === 'subscriptions.insert') return 'Granted a subscription to ' + un(d.user_id);
    if (a === 'subscriptions.update') return 'Changed a subscription of ' + un(d.user_id) + ' (' + (d.status || '') + ')';
    if (a === 'subscriptions.delete') return 'Deleted a subscription of ' + un(d.user_id);
    if (a === 'announcement.send') return 'Sent announcement “' + (d.subject || '') + '” to ' + (d.recipients || 0) + ' people';
    return l.target || '';
  }

  /* ---------- Shell + router ---------- */
  function buildShell() {
    $('#nav').innerHTML = TABS.filter(allowed).map(t => '<a class="nav-i" href="#' + t.id + '" data-tab="' + t.id + '"><span>' + t.ico + '</span>' + t.label + '</a>').join('');
    $('#who').innerHTML = '<div><b>' + esc(myName()) + '</b>' + A.roles.map(chip).join('') + '</div><button class="btn btn-ghost btn-sm" id="out">Log out</button>';
    $('#out').onclick = () => Auth.signOut();
    $('#burger').onclick = () => document.body.classList.toggle('side-open');
    $('#scrim').onclick = () => document.body.classList.remove('side-open');
  }
  function cleanup() { if (channel) { sb.removeChannel(channel); channel = null; } if (tick) { clearInterval(tick); tick = null; } }
  async function route() {
    cleanup();
    const parts = (location.hash || '#overview').slice(1).split('/');
    const t = TABS.find(x => x.id === parts[0] && allowed(x) && R[x.id]) || TABS[0];
    $$('.nav-i').forEach(a => a.classList.toggle('active', a.dataset.tab === t.id));
    $('#crumb').textContent = t.label; document.body.classList.remove('side-open');
    const v = $('#view'); v.classList.remove('view-in'); void v.offsetWidth; v.classList.add('view-in');
    v.innerHTML = '<div class="loading">Loading…</div>';
    try { await R[t.id](v, parts[1]); } catch (e) { v.innerHTML = '<div class="empty">Could not load this page.<br><small>' + esc(e.message || '') + '</small></div>'; }
  }

  /* ================= OVERVIEW ================= */
  R.overview = async v => {
    const cnt = async (t, f) => { let q = sb.from(t).select('id', { count: 'exact', head: true }); if (f) q = f(q); const r = await q; return r.count || 0; };
    const jobs = [
      ['Members', '👥', can('manage_users') && (() => cnt('profiles'))],
      ['Open support chats', '💬', can('view_support') && (() => cnt('support_conversations', q => q.eq('status', 'open')))],
      ['Articles', '📰', can('manage_content') && (() => cnt('articles'))],
      ['Researches', '🔬', can('manage_content') && (() => cnt('researches'))],
      ['Client requests', '🧑‍💼', can('manage_clients') && (() => cnt('client_profiles'))],
      ['Team members', '🧑‍🔬', can('edit_site_content') && (() => cnt('staff_members'))],
      ['Custom blocks', '🧱', can('edit_site_content') && (() => cnt('site_blocks'))],
      ['Announcements sent', '📣', can('send_announcements') && (() => cnt('announcements'))]
    ].filter(j => j[2]);
    const nums = await Promise.all(jobs.map(j => j[2]()));
    let logs = '';
    if (can('view_logs')) {
      await names();
      const { data } = await sb.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(8);
      logs = '<div class="panel"><h4>Recent activity</h4>' + ((data || []).map(l => '<div class="rowitem"><div class="grow"><b>' + esc(describe(l)) + '</b><small>' + esc(l.actor_email || 'system') + ' · ' + fmt(l.created_at) + '</small></div></div>').join('') || '<div class="empty">Nothing yet.</div>') + '</div>';
    }
    v.innerHTML = '<h2 class="pt">Welcome, ' + esc(myName().split(' ')[0]) + ' 👋</h2><p class="psub">Your roles: ' + A.roles.map(chip).join('') + '</p>' +
      '<div class="cards">' + jobs.map((j, i) => '<div class="card stat-c"><span>' + j[1] + '</span><div class="n gradient-text">' + nums[i] + '</div><small>' + j[0] + '</small></div>').join('') + '</div>' + logs;
  };

  /* ================= USERS ================= */
  R.users = async v => {
    const [p, ur, r] = await Promise.all([
      sb.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000),
      sb.from('user_roles').select('user_id,role_id'), sb.from('roles').select('*').order('position')
    ]);
    if (p.error) throw p.error;
    const users = p.data || []; C.roles = r.data || [];
    const rid = Object.fromEntries(C.roles.map(x => [x.id, x]));
    const map = {}; (ur.data || []).forEach(x => { (map[x.user_id] = map[x.user_id] || []).push(x.role_id); });
    const topOf = u => Math.min(9999, ...(map[u.id] || []).map(i => rid[i] ? rid[i].position : 9999));
    // Founder can give or remove ANY role, including Founder
    const assignable = role => can('assign_roles') && (isFounder() || (role.position > myTop && (A.isAdmin || (role.permissions.indexOf('administrator') < 0 && role.permissions.every(can)))));

    function draw(q) {
      q = (q || '').toLowerCase();
      const rows = users.filter(u => !q || (u.email || '').toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q));
      $('#utb').innerHTML = rows.map(u => {
        const rs = (map[u.id] || []).map(i => rid[i]).filter(Boolean).sort((a, b) => a.position - b.position);
        const self = u.id === A.user.id, canBan = can('ban_users') && !self && topOf(u) > myTop;
        return '<tr><td><div class="who">' + avatar(u) + '<div><b>' + esc(u.full_name || '—') + (self ? ' (you)' : '') + '</b><small>' + (u.username ? '@' + esc(u.username) + ' · ' : '') + esc(u.email || '') + '</small></div></div></td>' +
          '<td>' + (rs.map(chip).join('') || '<span class="tag tag-mut">Member</span>') + '</td><td>' + new Date(u.created_at).toLocaleDateString() + '</td>' +
          '<td>' + (u.is_banned ? '<span class="tag tag-bad">Banned</span>' : '<span class="tag tag-ok">Active</span>') + '</td>' +
          '<td><div class="acts">' + (can('assign_roles') ? '<button class="ib" data-act="roles" data-id="' + u.id + '">Roles</button>' : '') +
          (can('ban_users') ? '<button class="ib danger" data-act="ban" data-id="' + u.id + '" ' + (canBan ? '' : 'disabled') + '>' + (u.is_banned ? 'Unban' : 'Ban') + '</button>' : '') + '</div></td></tr>';
      }).join('') || '<tr><td colspan="5"><div class="empty">No users found.</div></td></tr>';
    }
    v.innerHTML = '<h2 class="pt">Users</h2><p class="psub">' + users.length + ' members. ' + (isFounder() ? 'As Founder you can give or remove any role, including Founder.' : 'You can only manage roles ranked below yours.') + '</p>' +
      '<div class="toolbar"><input class="input" id="usearch" placeholder="Search name, username or email…"></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>User</th><th>Roles</th><th>Joined</th><th>Status</th><th></th></tr></thead><tbody id="utb"></tbody></table></div>';
    draw(); $('#usearch').oninput = e => draw(e.target.value);

    $('#utb').onclick = async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const u = users.find(x => x.id === b.dataset.id);
      if (b.dataset.act === 'ban') {
        const ban = !u.is_banned;
        if (!(await UI.confirm((ban ? 'Ban ' : 'Unban ') + (u.full_name || u.email) + '?', ban ? 'They will be unable to log in.' : 'They will be able to log in again.', { confirmText: ban ? 'Ban' : 'Unban', danger: ban }))) return;
        const { error } = await sb.rpc('admin_set_ban', { target: u.id, banned: ban });
        if (error) return fail(error);
        u.is_banned = ban; draw($('#usearch').value); UI.toast(ban ? 'User banned.' : 'User unbanned.', 'success');
      } else {
        const d = dialog('Roles for ' + (u.full_name || u.email),
          '<p class="hint" style="margin-bottom:14px">' + (isFounder() ? 'You can give or remove any role. The site always keeps at least one Founder.' : 'Greyed-out roles are ranked at or above yours, or contain permissions you don\'t have.') + '</p>' +
          C.roles.map(role => { const on = (map[u.id] || []).indexOf(role.id) > -1; return '<div class="perm"><div><b>' + chip(role) + '</b></div><label class="sw"><input type="checkbox" data-rid="' + role.id + '" ' + (on ? 'checked' : '') + ' ' + (assignable(role) ? '' : 'disabled') + '><i></i></label></div>'; }).join(''));
        d.el.onchange = async ev => {
          const cb = ev.target; if (!cb.dataset.rid) return;
          const res = cb.checked ? await sb.from('user_roles').insert({ user_id: u.id, role_id: cb.dataset.rid, assigned_by: A.user.id }) : await sb.from('user_roles').delete().eq('user_id', u.id).eq('role_id', cb.dataset.rid);
          if (res.error) { cb.checked = !cb.checked; return fail(res.error); }
          map[u.id] = map[u.id] || [];
          if (cb.checked) map[u.id].push(cb.dataset.rid); else map[u.id] = map[u.id].filter(x => x !== cb.dataset.rid);
          draw($('#usearch').value);
        };
      }
    };
  };

  /* ================= ROLES (Discord-style) ================= */
  R.roles = async v => {
    let roles = [], counts = {}, sel = null, draft = null;
    async function load() {
      const [r, ur] = await Promise.all([sb.from('roles').select('*').order('position'), sb.from('user_roles').select('role_id')]);
      if (r.error) throw r.error;
      roles = r.data || []; C.roles = roles; counts = {};
      (ur.data || []).forEach(x => { counts[x.role_id] = (counts[x.role_id] || 0) + 1; });
    }
    const editable = r => can('manage_roles') && r.position > myTop;
    async function draw() {
      const role = roles.find(x => x.id === sel) || roles[0]; sel = role && role.id;
      if (!draft || draft.id !== sel) draft = role ? { id: role.id, name: role.name, color: role.color, permissions: role.permissions.slice() } : null;
      const ed = role && editable(role), idx = roles.indexOf(role);
      v.innerHTML = '<h2 class="pt">Roles</h2><p class="psub">Like Discord: higher roles (closer to the top) manage the ones below. Click a role to edit what it can do.</p>' +
        '<div class="split"><div><button class="btn btn-primary btn-sm" id="newrole" style="margin-bottom:14px">+ New role</button><div class="rlist">' +
        roles.map(r => '<button class="ritem ' + (r.id === sel ? 'on' : '') + '" data-id="' + r.id + '"><span class="dot" style="background:' + esc(hexv(r.color) || '#8b5cf6') + '"></span><span class="grow"><b>' + esc(r.name) + '</b><small>' + (counts[r.id] || 0) + ' member' + (counts[r.id] === 1 ? '' : 's') + (r.is_system ? ' · system' : '') + '</small></span></button>').join('') + '</div></div>' +
        (role ? '<div class="panel"><div class="toolbar"><h4 class="grow" style="margin:0">' + esc(role.name) + '</h4><button class="ib" id="rup" ' + (ed && idx > 0 && roles[idx - 1].position > myTop ? '' : 'disabled') + '>↑ Rank up</button><button class="ib" id="rdn" ' + (ed && idx < roles.length - 1 ? '' : 'disabled') + '>↓ Rank down</button></div>' +
          (ed ? '' : '<p class="hint" style="margin-bottom:12px">🔒 You can\'t edit this role because it is ranked at or above your highest role.</p>') +
          '<div class="two"><div class="field"><label>Name</label><input class="input" id="rname" value="' + esc(draft.name) + '" ' + (ed && !role.is_system ? '' : 'disabled') + '></div>' +
          '<div class="field"><label>Colour</label><span class="cf"><input type="color" id="rcolor" value="' + esc(hexv(draft.color) || '#8b5cf6') + '" ' + (ed ? '' : 'disabled') + '></span></div></div>' +
          GROUPS.map(g => '<div class="permg"><h5>' + g[0] + '</h5>' + g[1].map(p => {
            const dis = !ed || (!A.isAdmin && (p === 'administrator' || !can(p)));
            return '<div class="perm ' + (p === 'administrator' ? 'adm' : '') + '"><div><b>' + PERMS[p][0] + '</b><small>' + PERMS[p][1] + '</small></div><label class="sw"><input type="checkbox" data-p="' + p + '" ' + (draft.permissions.indexOf(p) > -1 ? 'checked' : '') + ' ' + (dis ? 'disabled' : '') + '><i></i></label></div>';
          }).join('') + '</div>').join('') +
          (ed ? '<div class="dlg-f"><button class="btn btn-danger btn-sm" id="rdel" ' + (role.is_system ? 'disabled' : '') + '>Delete role</button><button class="btn btn-primary btn-sm" id="rsave">Save changes</button></div>' : '') + '</div>' : '') + '</div>';
      bind(role);
    }
    function bind(role) {
      $$('.ritem', v).forEach(b => b.onclick = () => { sel = b.dataset.id; draft = null; draw(); });
      $('#newrole').onclick = async () => {
        if (!can('manage_roles')) return UI.toast('You can\'t create roles.', 'warn');
        const name = await UI.prompt('New role', 'Give the role a name.', { placeholder: 'e.g. Helper' });
        if (!name || !name.trim()) return;
        const palette = ['#ff6b8a', '#4de1ff', '#3ddc97', '#ffb84d', '#8b5cf6', '#f472b6'];
        const pos = Math.max(myTop + 1, ...roles.map(r => r.position + 1));
        const { data, error } = await sb.from('roles').insert({ name: name.trim(), color: palette[roles.length % palette.length], position: pos, permissions: ['view_dashboard'] }).select().single();
        if (error) return fail(error);
        UI.toast('Role created.', 'success'); sel = data.id; draft = null; await load(); draw();
      };
      if (!role) return;
      v.onchange = e => { const p = e.target.dataset && e.target.dataset.p; if (p) { draft.permissions = draft.permissions.filter(x => x !== p); if (e.target.checked) draft.permissions.push(p); } };
      const rn = $('#rname'), rc = $('#rcolor');
      if (rn) rn.oninput = () => { draft.name = rn.value; };
      if (rc) rc.oninput = () => { draft.color = rc.value; };
      const sv = $('#rsave');
      if (sv) sv.onclick = async () => {
        const upd = { color: draft.color, permissions: draft.permissions };
        if (!role.is_system) upd.name = draft.name.trim() || role.name;
        const { error } = await sb.from('roles').update(upd).eq('id', role.id);
        if (error) return fail(error);
        UI.toast('Role saved.', 'success'); draft = null; await load(); draw();
      };
      const dl = $('#rdel');
      if (dl) dl.onclick = async () => {
        if (!(await UI.confirm('Delete “' + role.name + '”?', 'Members lose this role. This cannot be undone.', { confirmText: 'Delete', danger: true }))) return;
        const { error } = await sb.from('roles').delete().eq('id', role.id);
        if (error) return fail(error);
        UI.toast('Role deleted.', 'success'); sel = null; draft = null; await load(); draw();
      };
      const move = async dir => {
        const i = roles.indexOf(role), o = roles[i + dir]; if (!o) return;
        let pa = role.position, pb = o.position; if (pa === pb) pb = pa + dir;
        const a = await sb.from('roles').update({ position: pb }).eq('id', role.id), b = await sb.from('roles').update({ position: pa }).eq('id', o.id);
        if (a.error || b.error) return fail(a.error || b.error);
        await load(); draw();
      };
      if ($('#rup')) $('#rup').onclick = () => move(-1);
      if ($('#rdn')) $('#rdn').onclick = () => move(1);
    }
    await load(); await draw();
  };

  /* ================= SUPPORT ================= */
  R.support = async v => {
    let convs = [], cur = null, msgs = [];
    const canReply = can('reply_support'), EDIT_MS = 15 * 60 * 1000, DEL_MS = 24 * 60 * 60 * 1000;
    const seenKey = id => 'holo-seen-' + id, age = m => Date.now() - new Date(m.created_at).getTime();
    v.innerHTML = '<h2 class="pt">Support</h2><p class="psub">Live conversations from the Contact us page. The first admin who replies is shown to the member as their helper.</p><div class="chat"><div class="clist" id="clist"></div><div class="cview" id="cview"><div class="empty">Select a conversation.</div></div></div>';

    async function loadConvs() {
      const { data, error } = await sb.from('support_conversations').select('*, profiles(full_name,email,avatar_url)').order('last_message_at', { ascending: false }).limit(100);
      if (error) return fail(error);
      convs = (data || []).sort((a, b) => (a.status === b.status ? 0 : a.status === 'open' ? -1 : 1));
      if (cur) { const f = convs.find(c => c.id === cur.id); if (f) { const changed = f.status !== cur.status || f.assigned_name !== cur.assigned_name; cur = f; if (changed) drawChat(); } }
      drawList();
    }
    function drawList() {
      $('#clist').innerHTML = convs.map(c => {
        const u = c.profiles || {};
        const isNew = (!cur || cur.id !== c.id) && (+localStorage.getItem(seenKey(c.id)) || 0) < new Date(c.last_message_at).getTime();
        return '<button class="citem ' + (cur && cur.id === c.id ? 'on' : '') + '" data-id="' + c.id + '">' + avatar(u) + '<span class="grow"><b>' + esc(u.full_name || u.email || 'Member') + '</b><small>' + (c.status === 'closed' ? 'Closed · ' : '') + (c.assigned_name ? '👤 ' + esc(c.assigned_name) + ' · ' : '') + fmt(c.last_message_at) + '</small></span>' + (isNew ? '<span class="newdot"></span>' : '') + '</button>';
      }).join('') || '<div class="empty">No conversations yet.</div>';
    }
    function bubble(m) {
      const mine = m.sender_id === A.user.id && m.sender_type === 'staff';
      const acts = mine ? (age(m) < EDIT_MS ? '<button class="lk" data-edit="' + m.id + '">Edit</button>' : '') + (age(m) < DEL_MS ? '<button class="lk" data-del="' + m.id + '">Delete</button>' : '') : '';
      return '<div class="bub ' + (m.sender_type === 'user' ? 'user' : 'staff') + '">' + (m.sender_type === 'staff' ? '<span class="sn">' + esc(m.sender_name || 'Staff') + '</span>' : '') + esc(m.body) + '<small>' + fmt(m.created_at) + (m.edited_at ? ' · edited' : '') + '</small>' + (acts ? '<div class="macts">' + acts + '</div>' : '') + '</div>';
    }
    const drawMsgs = scroll => { const box = $('#msgs'); if (!box) return; box.innerHTML = msgs.map(bubble).join(''); if (scroll) box.scrollTop = box.scrollHeight; };
    function drawChat() {
      const u = cur.profiles || {};
      $('#cview').innerHTML = '<div class="chead"><div class="who">' + avatar(u) + '<div><b>' + esc(u.full_name || 'Member') + '</b><small>' + esc(u.email || '') + '</small>' + (cur.assigned_name ? '<small class="assist">✓ Assisted by ' + esc(cur.assigned_name) + '</small>' : '<small>Unassigned</small>') + '</div></div>' +
        (canReply ? '<div class="acts">' + (cur.assigned_to !== A.user.id && cur.status === 'open' ? '<button class="ib" id="cassign">Assign to me</button>' : '') + '<button class="ib" id="ctog">' + (cur.status === 'open' ? 'Close chat' : 'Reopen') + '</button></div>' : '') + '</div>' +
        '<div class="msgs" id="msgs"></div>' + (canReply && cur.status === 'open' ? '<form class="cform" id="cform" autocomplete="off"><input class="input" id="cin" placeholder="Write a reply…" maxlength="1000" required><button class="btn btn-primary btn-sm">Send</button></form>' : '');
      drawMsgs(true);
      if ($('#cassign')) $('#cassign').onclick = async () => { const { error } = await sb.from('support_conversations').update({ assigned_to: A.user.id }).eq('id', cur.id); if (error) return fail(error); UI.toast('You are now assisting this member.', 'success'); loadConvs(); };
      if ($('#ctog')) $('#ctog').onclick = async () => { const st = cur.status === 'open' ? 'closed' : 'open'; const { error } = await sb.from('support_conversations').update({ status: st }).eq('id', cur.id); if (error) return fail(error); cur.status = st; drawChat(); loadConvs(); };
      if ($('#cform')) $('#cform').onsubmit = async e => {
        e.preventDefault(); const inp = $('#cin'), text = inp.value.trim(); if (!text) return; inp.value = '';
        const { data, error } = await sb.from('support_messages').insert({ conversation_id: cur.id, sender_type: 'staff', sender_id: A.user.id, body: text }).select().single();
        if (error) { inp.value = text; return fail(error); } addMsg(data); loadConvs();
      };
      $('#msgs').onclick = async e => {
        const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
        if (ed) {
          const m = msgs.find(x => x.id === ed.dataset.edit); if (!m) return;
          const val = await UI.prompt('Edit message', 'You can edit for 15 minutes after sending.', { value: m.body });
          if (val === null || !val.trim() || val.trim() === m.body) return;
          const { data, error } = await sb.from('support_messages').update({ body: val.trim().slice(0, 1000) }).eq('id', m.id).select();
          if (error || !data || !data.length) return UI.toast('This message can no longer be edited.', 'error'); Object.assign(m, data[0]); drawMsgs();
        }
        if (dl) {
          const m = msgs.find(x => x.id === dl.dataset.del); if (!m) return;
          if (!(await UI.confirm('Delete this message?', 'It will be removed for the member too.', { confirmText: 'Delete', danger: true }))) return;
          const { data, error } = await sb.from('support_messages').delete().eq('id', m.id).select();
          if (error || !data || !data.length) return UI.toast('Messages can only be deleted within 1 day.', 'error'); msgs = msgs.filter(x => x.id !== m.id); drawMsgs();
        }
      };
    }
    function addMsg(m) { if (!cur || m.conversation_id !== cur.id || msgs.some(x => x.id === m.id)) return; msgs.push(m); drawMsgs(true); localStorage.setItem(seenKey(cur.id), Date.now()); }
    $('#clist').onclick = async e => {
      const b = e.target.closest('[data-id]'); if (!b) return;
      cur = convs.find(c => c.id === b.dataset.id);
      const { data, error } = await sb.from('support_messages').select('*').eq('conversation_id', cur.id).order('created_at');
      if (error) return fail(error);
      msgs = data || []; localStorage.setItem(seenKey(cur.id), Date.now()); drawChat(); drawList();
    };
    await loadConvs();
    channel = sb.channel('admin-support')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, p => { addMsg(p.new); loadConvs(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_messages' }, p => { const i = msgs.findIndex(x => x.id === p.new.id); if (i > -1) { msgs[i] = p.new; drawMsgs(); } })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'support_messages' }, p => { if (p.old && msgs.some(x => x.id === p.old.id)) { msgs = msgs.filter(x => x.id !== p.old.id); drawMsgs(); } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations' }, () => loadConvs())
      .subscribe();
    tick = setInterval(() => drawMsgs(), 30000);
  };

  /* ================= NEWS & RESEARCH (the page builder lives in js/article-editor.js) ================= */
  function openEditor(kind, row, content, done) {
    if (!window.HoloArticleEditor) return UI.toast('Upload the editor files first: js/article-editor.js, js/rich.js and css/article.css.', 'warn', 7000);
    HoloArticleEditor.open({ kind, row, content, done });
  }
  R.content = async (v, sub) => {
    sub = sub === 'research' ? 'research' : 'news';
    v.innerHTML = '<h2 class="pt">News &amp; Research</h2><p class="psub">Write articles and research papers with the page builder. Everything is free to read. ' + (R.guide ? '<a href="#guide" style="color:var(--accent);text-decoration:underline">📘 Open the writing guide</a>' : '') + '</p><div class="seg"><a href="#content/news" class="' + (sub === 'news' ? 'on' : '') + '">📰 News</a><a href="#content/research" class="' + (sub === 'research' ? 'on' : '') + '">🔬 Researches</a></div><div id="cbox"><div class="loading">Loading…</div></div>';
    await (sub === 'news' ? contentNews : contentResearch)($('#cbox'));
  };
  async function contentNews(box) {
    const { data, error } = await sb.from('articles').select('id,title,category,published,created_at,author_name,read_min').order('created_at', { ascending: false });
    if (error) throw error;
    const list = data || [];
    box.innerHTML = '<div class="toolbar"><button class="btn btn-primary btn-sm" id="anew">+ New article</button></div><div id="alist"></div>';
    $('#alist').innerHTML = list.map(a => '<div class="rowitem ' + (a.published ? '' : 'dim') + '"><div class="grow"><b>' + esc(a.title) + '</b><small><span class="bdg">' + esc(HC.catLabel(HC.NEWS_CATS, a.category)) + '</span>' + fmt(a.created_at) + (a.author_name ? ' · ' + esc(a.author_name) : '') + (a.read_min ? ' · ' + a.read_min + ' min read' : '') + (a.published ? '' : ' · draft') + '</small></div><div class="acts"><button class="ib" data-e="' + a.id + '">Edit</button><button class="ib danger" data-d="' + a.id + '">Delete</button></div></div>').join('') || '<div class="empty">No articles yet.</div>';
    const reload = () => contentNews(box);
    $('#anew').onclick = () => openEditor('news', null, null, reload);
    $('#alist').onclick = async e => {
      const ed = e.target.closest('[data-e]'), dl = e.target.closest('[data-d]');
      if (ed) { const { data: a } = await sb.from('articles').select('*').eq('id', ed.dataset.e).single(); openEditor('news', a, null, reload); }
      if (dl) { if (!(await UI.confirm('Delete this article?', 'It is removed from the website.', { confirmText: 'Delete', danger: true }))) return; const { error } = await sb.from('articles').delete().eq('id', dl.dataset.d); if (error) return fail(error); reload(); }
    };
  }
  async function contentResearch(box) {
    const { data, error } = await sb.from('researches').select('id,title,category,published,created_at,authors,read_min').order('created_at', { ascending: false });
    if (error) throw error;
    const list = data || [];
    box.innerHTML = '<div class="toolbar"><button class="btn btn-primary btn-sm" id="rnew">+ New research</button></div><div id="rlist2"></div>';
    $('#rlist2').innerHTML = list.map(r => '<div class="rowitem ' + (r.published ? '' : 'dim') + '"><div class="grow"><b>' + esc(r.title) + '</b><small><span class="bdg">' + esc(HC.catLabel(HC.RES_CATS, r.category)) + '</span>' + fmt(r.created_at) + (r.authors ? ' · ' + esc(r.authors) : '') + (r.read_min ? ' · ' + r.read_min + ' min read' : '') + (r.published ? '' : ' · draft') + '</small></div><div class="acts"><button class="ib" data-e="' + r.id + '">Edit</button><button class="ib danger" data-d="' + r.id + '">Delete</button></div></div>').join('') || '<div class="empty">No researches yet.</div>';
    const reload = () => contentResearch(box);
    $('#rnew').onclick = () => openEditor('research', null, null, reload);
    $('#rlist2').onclick = async e => {
      const ed = e.target.closest('[data-e]'), dl = e.target.closest('[data-d]');
      if (ed) { const [r, c] = await Promise.all([sb.from('researches').select('*').eq('id', ed.dataset.e).single(), sb.from('research_content').select('*').eq('research_id', ed.dataset.e).maybeSingle()]); openEditor('research', r.data, c.data, reload); }
      if (dl) {
        if (!(await UI.confirm('Delete this research?', 'The paper and its file are removed.', { confirmText: 'Delete', danger: true }))) return;
        const c = await sb.from('research_content').select('file_path').eq('research_id', dl.dataset.d).maybeSingle();
        const { error } = await sb.from('researches').delete().eq('id', dl.dataset.d); if (error) return fail(error);
        if (c.data && c.data.file_path) sb.storage.from('research-files').remove([c.data.file_path]);
        reload();
      }
    };
  }

  /* ================= CLIENTS ================= */
  R.clients = async v => {
    const { data, error } = await sb.from('client_profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const list = data || [];
    v.innerHTML = '<h2 class="pt">Client requests</h2><p class="psub">Requests posted from “Become a client”. Suspend one to remove it from “Find a client”. Give the <b>Find clients</b> permission to a role (Roles tab) to let helpers see them.</p><div class="toolbar"><input class="input" id="csearch" placeholder="Search name or request…"></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Client</th><th>Fields</th><th>Status</th><th>Created</th><th></th></tr></thead><tbody id="ctb"></tbody></table></div>';
    const draw = q => {
      q = (q || '').toLowerCase();
      $('#ctb').innerHTML = list.filter(c => !q || (c.display_name + ' ' + (c.headline || '')).toLowerCase().includes(q)).map(c =>
        '<tr><td><div class="who"><span class="av">' + (c.photo_url && /^https:\/\//.test(c.photo_url) ? '<img src="' + esc(c.photo_url) + '" alt="" referrerpolicy="no-referrer">' : esc(ini(c.display_name))) + '</span><div><b>' + esc(c.display_name) + '</b><small>' + esc(c.headline || '') + '</small></div></div></td>' +
        '<td>' + (c.fields || []).map(f => '<span class="bdg">' + esc(HC.catLabel(HC.FIELDS, f)) + '</span>').join('') + '</td>' +
        '<td>' + (c.status === 'suspended' ? '<span class="tag tag-bad">Suspended</span>' : (c.request_status === 'closed' ? '<span class="tag tag-mut">Closed</span>' : '<span class="tag tag-ok">Open</span>')) + '</td><td>' + new Date(c.created_at).toLocaleDateString() + '</td>' +
        '<td><div class="acts"><button class="ib" data-s="' + c.id + '">' + (c.status === 'suspended' ? 'Restore' : 'Suspend') + '</button><button class="ib danger" data-d="' + c.id + '">Delete</button></div></td></tr>').join('') || '<tr><td colspan="5"><div class="empty">No client requests yet.</div></td></tr>';
    };
    draw(); $('#csearch').oninput = e => draw(e.target.value);
    $('#ctb').onclick = async e => {
      const s = e.target.closest('[data-s]'), dl = e.target.closest('[data-d]');
      if (s) { const c = list.find(x => x.id === s.dataset.s), st = c.status === 'suspended' ? 'approved' : 'suspended'; const { error } = await sb.from('client_profiles').update({ status: st }).eq('id', c.id); if (error) return fail(error); c.status = st; draw($('#csearch').value); UI.toast(st === 'suspended' ? 'Request suspended.' : 'Request restored.', 'success'); }
      if (dl) { const c = list.find(x => x.id === dl.dataset.d); if (!(await UI.confirm('Delete “' + c.display_name + '”?', 'The request is removed. The member can post a new one.', { confirmText: 'Delete', danger: true }))) return; const { error } = await sb.from('client_profiles').delete().eq('id', c.id); if (error) return fail(error); list.splice(list.indexOf(c), 1); draw($('#csearch').value); }
    };
  };

  /* ================= WEBSITE ================= */
  const ICON_OPTS = '<option value="auto">Auto-detect</option>' + HoloIcons.names.map(n => '<option value="' + n + '">' + HoloIcons.label(n) + '</option>').join('');
  function linkRowHtml(it, i) {
    return '<div class="lrow" data-i="' + i + '"><span class="ico">' + HoloIcons.svg(HoloIcons.forItem(it)) + '</span>' +
      '<input class="input l-label" data-k="label" placeholder="Label (optional)" value="' + esc(it.label || '') + '"><input class="input l-url" data-k="url" placeholder="https://… (leave empty for a placeholder)" value="' + esc(it.url || '') + '">' +
      '<select class="input l-icon" data-k="icon">' + ICON_OPTS.replace('value="' + (it.icon || 'auto') + '"', 'value="' + (it.icon || 'auto') + '" selected') + '</select><button type="button" class="ib danger" data-rm="' + i + '">✕</button></div>';
  }
  R.website = async (v, sub) => {
    sub = sub || 'people';
    const subs = [['people', '🧑‍💼 Holomatrix Team'], ['blocks', '🧱 Blocks'], ['menu', '☰ Menu'], ['media', '🖼️ Images & links'], ['pages', '📄 Pages']];
    v.innerHTML = '<h2 class="pt">Website</h2><p class="psub">Everything here updates the live site for everyone.</p><div class="seg">' + subs.map(s => '<a href="#website/' + s[0] + '" class="' + (s[0] === sub ? 'on' : '') + '">' + s[1] + '</a>').join('') + '</div><div id="wbox"><div class="loading">Loading…</div></div>';
    await ({ people: webPeople, blocks: webBlocks, menu: webMenu, media: webMedia, pages: webPages }[sub] || webPeople)($('#wbox'));
  };

  async function webPeople(box) {
    const { data, error } = await sb.from('staff_members').select('*').order('position').order('created_at');
    if (error) throw error;
    const list = data || [];
    box.innerHTML = '<div class="toolbar"><button class="btn btn-primary btn-sm" id="addp">+ Add team member</button><span class="hint">Shown on About us → Holomatrix Team, grouped as Scientists, Management and Executive team. Use “coming soon” for a member whose details you don\'t have yet.</span></div><div id="plist"></div>';
    $('#plist').innerHTML = list.map((m, i) =>
      '<div class="rowitem ' + (m.visible ? '' : 'dim') + '"><div class="thumb">' + (m.photo_url ? '<img src="' + esc(m.photo_url) + '" alt="">' : esc(ini(m.name))) + '</div>' +
      '<div class="grow"><b>' + esc(m.name) + '</b><small><span class="bdg">' + esc(m.staff_group || 'Management') + '</span>' + (m.placeholder ? '🕒 coming soon · ' : '') + esc(m.title || 'No role') + (m.visible ? '' : ' · hidden') + '</small></div>' +
      '<div class="acts"><button class="ib" data-a="up" data-i="' + i + '" ' + (i === 0 ? 'disabled' : '') + '>↑</button><button class="ib" data-a="dn" data-i="' + i + '" ' + (i === list.length - 1 ? 'disabled' : '') + '>↓</button><button class="ib" data-a="edit" data-i="' + i + '">Edit</button><button class="ib danger" data-a="del" data-i="' + i + '">Delete</button></div></div>').join('') || '<div class="empty">No team members yet. Click “Add team member”.</div>';
    const reload = () => webPeople(box);
    $('#addp').onclick = () => personDialog(null, list, reload);
    $('#plist').onclick = async e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const i = +b.dataset.i, m = list[i];
      if (b.dataset.a === 'edit') personDialog(m, list, reload);
      if (b.dataset.a === 'del') { if (!(await UI.confirm('Delete ' + m.name + '?', 'This removes them from the website.', { confirmText: 'Delete', danger: true }))) return; const { error } = await sb.from('staff_members').delete().eq('id', m.id); if (error) return fail(error); reload(); }
      if (b.dataset.a === 'up' || b.dataset.a === 'dn') {
        const j = i + (b.dataset.a === 'up' ? -1 : 1), order = list.slice(); [order[i], order[j]] = [order[j], order[i]];
        const res = await Promise.all(order.map((x, k) => sb.from('staff_members').update({ position: k }).eq('id', x.id)));
        const bad = res.find(r => r.error); if (bad) return fail(bad.error); reload();
      }
    };
  }
  function personDialog(m, list, done) {
    const p = m ? clone(m) : { name: '', title: '', bio: '', photo_url: '', visible: true, links: [], staff_group: 'Management', qualification: '', placeholder: false };
    let links = Array.isArray(p.links) && p.links.length ? clone(p.links) : [];
    if (!links.length) { if (p.instagram) links.push({ url: p.instagram }); if (p.linkedin) links.push({ url: p.linkedin }); }
    const d = dialog(m ? 'Edit team member' : 'Add team member',
      '<label class="chk" style="margin-bottom:16px"><input type="checkbox" id="pph2" ' + (p.placeholder ? 'checked' : '') + '> 🕒 “Coming soon” placeholder (shows a card without photo or details)</label>' +
      '<div class="prof" style="margin-bottom:18px"><div class="thumb" id="pph" style="width:96px;height:96px;font-size:1.6rem"></div><div><button type="button" class="btn btn-ghost btn-sm" id="pup">📷 Upload photo</button> <button type="button" class="ib" id="prm">Remove</button><p class="hint">Portrait or square photos work best.</p></div></div><input type="file" id="pfile" accept="image/png,image/jpeg,image/webp,image/gif" hidden>' +
      '<div class="two"><div class="field"><label>Name *</label><input class="input" id="pn" value="' + esc(p.name) + '" maxlength="80"></div><div class="field"><label>Company role</label><input class="input" id="pt" value="' + esc(p.title || '') + '" maxlength="80"></div></div>' +
      '<div class="two"><div class="field"><label>Group *</label><select class="input" id="pg">' + HC.GROUPS.map(g => '<option' + ((p.staff_group || 'Management') === g ? ' selected' : '') + '>' + g + '</option>').join('') + '</select></div><div class="field"><label>Qualification</label><input class="input" id="pq" value="' + esc(p.qualification || '') + '" maxlength="120" placeholder="e.g. Ph.D in Physics"></div></div>' +
      '<div class="field"><label>Bio / details</label><textarea class="input" id="pb" maxlength="800">' + esc(p.bio || '') + '</textarea></div>' +
      '<label class="field" style="margin-bottom:8px"><span style="font-size:.85rem;color:var(--muted);font-weight:500">Social links (icon is detected from the address; empty ones are not shown)</span></label><div id="plinks"></div><button type="button" class="ib" id="padd">+ Add link</button>' +
      '<label class="chk" style="margin-top:18px"><input type="checkbox" id="pv" ' + (p.visible ? 'checked' : '') + '> Visible on the website</label>' +
      '<div class="dlg-f"><button class="btn btn-ghost btn-sm" id="pcancel">Cancel</button><button class="btn btn-primary btn-sm" id="psave">Save</button></div>');
    const el = d.el, photo = () => { $('#pph', el).innerHTML = p.photo_url ? '<img src="' + esc(p.photo_url) + '" alt="">' : esc(ini(p.name)); }, drawLinks = () => { $('#plinks', el).innerHTML = links.map(linkRowHtml).join(''); };
    photo(); drawLinks();
    el.addEventListener('input', e => { const t = e.target, row = t.closest('.lrow'); if (row) { const i = +row.dataset.i; links[i][t.dataset.k] = t.value; $('.ico', row).innerHTML = HoloIcons.svg(HoloIcons.forItem(links[i])); } if (t.id === 'pn') { p.name = t.value; photo(); } });
    el.addEventListener('click', e => { const rm = e.target.closest('[data-rm]'); if (rm) { links.splice(+rm.dataset.rm, 1); drawLinks(); } });
    $('#padd', el).onclick = () => { links.push({ label: '', url: '', icon: 'auto' }); drawLinks(); };
    $('#pup', el).onclick = () => $('#pfile', el).click();
    $('#prm', el).onclick = () => { p.photo_url = ''; photo(); };
    $('#pfile', el).onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; UI.toast('Uploading…'); try { p.photo_url = await HoloMedia.upload(f, { folder: 'staff', max: 1200 }); photo(); UI.toast('Photo ready.', 'success'); } catch (er) { fail(er); } };
    $('#pcancel', el).onclick = d.close;
    $('#psave', el).onclick = async () => {
      const ph = $('#pph2', el).checked, name = $('#pn', el).value.trim() || (ph ? 'New member' : '');
      if (!name) return UI.toast('Please enter a name.', 'warn');
      const row = { name, title: $('#pt', el).value.trim() || null, bio: $('#pb', el).value.trim() || null, photo_url: p.photo_url || null, staff_group: $('#pg', el).value, qualification: $('#pq', el).value.trim() || null, visible: $('#pv', el).checked, placeholder: ph,
        links: links.filter(l => l.url && l.url.trim()).map(l => ({ label: (l.label || '').trim(), url: l.url.trim(), icon: l.icon || 'auto' })) };
      const res = m ? await sb.from('staff_members').update(row).eq('id', m.id) : await sb.from('staff_members').insert(Object.assign(row, { position: list.length ? Math.max(...list.map(x => x.position)) + 1 : 0 }));
      if (res.error) return fail(res.error);
      UI.toast('Saved.', 'success'); d.close(); done();
    };
  }

  async function webBlocks(box) {
    const { data, error } = await sb.from('site_blocks').select('*').order('position').order('created_at');
    if (error) throw error;
    const list = data || [], TL = { text: '📝 Text', links: '🔗 Links', photos: '🖼️ Photos' };
    box.innerHTML = '<div class="toolbar"><span class="hint">Blocks appear on the landing page after the sections, in this order. To add small items on any other page, use <b>Edit site → Design → Add to this page</b>.</span></div>' +
      '<div class="toolbar"><button class="btn btn-primary btn-sm" data-new="text">+ Text block</button><button class="btn btn-primary btn-sm" data-new="links">+ Links block</button><button class="btn btn-primary btn-sm" data-new="photos">+ Photos block</button></div><div id="blist"></div>';
    $('#blist').innerHTML = list.map((b, i) => '<div class="rowitem ' + (b.visible ? '' : 'dim') + '"><div class="grow"><b>' + esc(b.title || (b.data && b.data.heading) || 'Untitled block') + '</b><small>' + TL[b.type] + (b.visible ? '' : ' · hidden') + '</small></div><div class="acts"><button class="ib" data-a="up" data-i="' + i + '" ' + (i === 0 ? 'disabled' : '') + '>↑</button><button class="ib" data-a="dn" data-i="' + i + '" ' + (i === list.length - 1 ? 'disabled' : '') + '>↓</button><button class="ib" data-a="vis" data-i="' + i + '">' + (b.visible ? '👁 Hide' : '👁 Show') + '</button><button class="ib" data-a="edit" data-i="' + i + '">Edit</button><button class="ib danger" data-a="del" data-i="' + i + '">Delete</button></div></div>').join('') || '<div class="empty">No blocks yet. Add one above.</div>';
    const reload = () => webBlocks(box);
    box.onclick = async e => {
      const n = e.target.closest('[data-new]'); if (n) return blockDialog(null, n.dataset.new, list, reload);
      const b = e.target.closest('[data-a]'); if (!b) return;
      const i = +b.dataset.i, blk = list[i];
      if (b.dataset.a === 'edit') blockDialog(blk, blk.type, list, reload);
      if (b.dataset.a === 'vis') { const { error } = await sb.from('site_blocks').update({ visible: !blk.visible }).eq('id', blk.id); if (error) return fail(error); reload(); }
      if (b.dataset.a === 'del') { if (!(await UI.confirm('Delete this block?', 'It disappears from the website.', { confirmText: 'Delete', danger: true }))) return; const { error } = await sb.from('site_blocks').delete().eq('id', blk.id); if (error) return fail(error); reload(); }
      if (b.dataset.a === 'up' || b.dataset.a === 'dn') {
        const j = i + (b.dataset.a === 'up' ? -1 : 1), order = list.slice(); [order[i], order[j]] = [order[j], order[i]];
        const res = await Promise.all(order.map((x, k) => sb.from('site_blocks').update({ position: k }).eq('id', x.id)));
        const bad = res.find(r => r.error); if (bad) return fail(bad.error); reload();
      }
    };
  }

  function blockDialog(existing, type, list, done) {
    const b = existing ? clone(existing) : { type, title: '', data: {}, style: {}, visible: true };
    b.data = b.data || {}; b.style = b.style || {};
    if (type === 'links' && !b.data.items) b.data.items = [{ label: '', url: '', icon: 'auto' }];
    if (type === 'photos' && !b.data.items) b.data.items = [{ url: '', caption: '', link: '' }];
    const fonts = '<option value="">Site default</option>' + HoloBlocks.FONTS.map(f => '<option' + (b.style.font === f ? ' selected' : '') + '>' + f + '</option>').join('');
    const col = (k, label) => '<div class="field"><label>' + label + '</label><span class="cf"><input type="color" data-s="' + k + '" value="' + (hexv(b.style[k]) || '#ffffff') + '"><button type="button" class="ib" data-clr="' + k + '">Default</button></span></div>';
    const px = (k, label, min, max, def) => '<div class="field"><label>' + label + ': <b data-pv="' + k + '">' + (b.style[k] ? b.style[k] + 'px' : 'auto') + '</b></label><span class="cf"><input type="range" min="' + min + '" max="' + max + '" value="' + (b.style[k] || def) + '" data-s="' + k + '" style="flex:1"><button type="button" class="ib" data-clr="' + k + '">Auto</button></span></div>';
    const sel = (k, opts, cur) => '<select class="input" data-s="' + k + '">' + opts.map(o => '<option value="' + o[0] + '"' + (cur === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>';
    const photoRows = () => b.data.items.map((it, i) => '<div class="prow" data-i="' + i + '"><div class="thumb" style="width:64px;height:64px">' + (it.url ? '<img src="' + esc(it.url) + '" alt="">' : '📷') + '</div><input class="input" data-k="caption" placeholder="Caption" value="' + esc(it.caption || '') + '"><input class="input p-link" data-k="link" placeholder="Link when clicked (optional)" value="' + esc(it.link || '') + '"><span class="acts"><button type="button" class="ib" data-up="' + i + '">Upload</button><button type="button" class="ib danger" data-rm="' + i + '">✕</button></span></div>').join('');
    const items = () => type === 'links' ? b.data.items.map(linkRowHtml).join('') : photoRows();

    const body = '<div class="be"><div>' +
      '<div class="field"><label>Block name (only you see this)</label><input class="input" data-t="1" value="' + esc(b.title || '') + '" maxlength="80"></div>' +
      '<div class="field"><label>Heading</label><input class="input" data-d="heading" value="' + esc(b.data.heading || '') + '" maxlength="120"></div>' +
      (type === 'text' ? '<div class="field"><label>Message</label><textarea class="input" data-d="body" style="min-height:150px">' + esc(b.data.body || '') + '</textarea></div>' : '') +
      (type === 'links' ? '<div class="field"><label>Layout</label><select class="input" data-d="layout"><option value="pills"' + (b.data.layout !== 'cards' ? ' selected' : '') + '>Pills</option><option value="cards"' + (b.data.layout === 'cards' ? ' selected' : '') + '>Big cards</option></select></div>' : '') +
      (type === 'photos' ? '<div class="two"><div class="field"><label>Columns</label><select class="input" data-d="cols">' + [2, 3, 4].map(n => '<option' + (+b.data.cols === n || (!b.data.cols && n === 3) ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></div><div class="field"><label>Shape</label><select class="input" data-d="shape">' + [['rounded', 'Rounded'], ['circle', 'Circle'], ['square', 'Square']].map(o => '<option value="' + o[0] + '"' + ((b.data.shape || 'rounded') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div></div>' : '') +
      (type !== 'text' ? '<label class="field" style="margin-bottom:8px"><span style="font-size:.85rem;color:var(--muted);font-weight:500">' + (type === 'links' ? 'Links (the site logo is added automatically)' : 'Photos (empty ones are placeholders)') + '</span></label><div id="bitems">' + items() + '</div><button type="button" class="ib" id="badd">+ Add ' + (type === 'links' ? 'link' : 'photo') + '</button><label class="chk" style="margin-top:14px"><input type="checkbox" data-d="showEmpty" ' + (b.data.showEmpty ? 'checked' : '') + '> Show empty placeholders on the public site</label>' : '') +
      '<h4 style="margin:18px 0 10px">Style</h4><div class="two">' + col('color', 'Text colour') + col('headingColor', 'Heading colour') + '</div>' +
      '<div class="two">' + px('fontPx', 'Text size', 12, 40, 18) + px('headPx', 'Heading size', 18, 90, 34) + '</div>' +
      '<div class="two">' + col('bg', 'Background colour') + '<div class="field"><label>Font</label><select class="input" data-s="font">' + fonts + '</select></div></div>' +
      '<div class="two"><div class="field"><label>Alignment</label>' + sel('align', [['left', 'Left'], ['center', 'Center'], ['right', 'Right']], b.style.align || 'left') + '</div><div class="field"><label>Preset size (used when sliders say auto)</label>' + sel('size', [['s', 'Small'], ['m', 'Medium'], ['l', 'Large'], ['xl', 'Extra large']], b.style.size || 'm') + '</div></div>' +
      '<label class="chk"><input type="checkbox" data-s="card" ' + (b.style.card ? 'checked' : '') + '> Show as a card (border + padding)</label><label class="chk"><input type="checkbox" id="bvis" ' + (b.visible ? 'checked' : '') + '> Visible on the website</label>' +
      '<div class="dlg-f"><button class="btn btn-ghost btn-sm" id="bcancel">Cancel</button><button class="btn btn-primary btn-sm" id="bsave">Save block</button></div></div>' +
      '<div class="prev"><small class="cap">Live preview</small><div id="bprev"></div></div></div>';
    const d = dialog((existing ? 'Edit ' : 'New ') + type + ' block', body, { wide: true });
    const el = d.el;
    const prev = () => { HoloBlocks.ensureFonts([b]); $('#bprev', el).innerHTML = HoloBlocks.render(b, { preview: true }); };
    const redraw = () => { const bi = $('#bitems', el); if (bi) bi.innerHTML = items(); prev(); };
    const pxLabel = k => { const l = $('[data-pv="' + k + '"]', el); if (l) l.textContent = b.style[k] ? b.style[k] + 'px' : 'auto'; };
    prev();
    el.addEventListener('input', e => {
      const t = e.target, row = t.closest('[data-i]');
      if (t.dataset.s !== undefined) { b.style[t.dataset.s] = t.type === 'checkbox' ? t.checked : t.value; if (t.type === 'range') pxLabel(t.dataset.s); }
      else if (t.dataset.d !== undefined) b.data[t.dataset.d] = t.type === 'checkbox' ? t.checked : t.value;
      else if (t.dataset.t !== undefined) b.title = t.value;
      else if (t.dataset.k !== undefined && row) { const i = +row.dataset.i; b.data.items[i][t.dataset.k] = t.value; const ic = $('.ico', row); if (ic) ic.innerHTML = HoloIcons.svg(HoloIcons.forItem(b.data.items[i])); }
      prev();
    });
    el.addEventListener('click', e => {
      const c = e.target.closest('[data-clr]'); if (c) { b.style[c.dataset.clr] = ''; pxLabel(c.dataset.clr); prev(); }
      const r = e.target.closest('[data-rm]'); if (r) { b.data.items.splice(+r.dataset.rm, 1); redraw(); }
      const u = e.target.closest('[data-up]');
      if (u) {
        const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/png,image/jpeg,image/webp,image/gif';
        inp.onchange = async () => { if (!inp.files[0]) return; UI.toast('Uploading…'); try { b.data.items[+u.dataset.up].url = await HoloMedia.upload(inp.files[0], { folder: 'blocks', max: 1600 }); redraw(); UI.toast('Photo ready.', 'success'); } catch (er) { fail(er); } };
        inp.click();
      }
    });
    const add = $('#badd', el);
    if (add) add.onclick = () => { b.data.items.push(type === 'links' ? { label: '', url: '', icon: 'auto' } : { url: '', caption: '', link: '' }); redraw(); };
    $('#bcancel', el).onclick = d.close;
    $('#bsave', el).onclick = async () => {
      const s = {}; Object.keys(b.style).forEach(k => { if (b.style[k] !== '' && b.style[k] !== false) s[k] = b.style[k]; });
      const row = { type: b.type, title: b.title || null, data: b.data, style: s, visible: $('#bvis', el).checked };
      const res = existing ? await sb.from('site_blocks').update(row).eq('id', existing.id) : await sb.from('site_blocks').insert(Object.assign(row, { position: list.length ? Math.max(...list.map(x => x.position)) + 1 : 0 }));
      if (res.error) return fail(res.error);
      UI.toast('Block saved.', 'success'); d.close(); done();
    };
  }

  async function webMenu(box) {
    const c = await getContent(['nav']);
    let nav = Array.isArray(c.nav) && c.nav.length ? clone(c.nav) : clone(HC.DEFAULT_NAV);
    const row = (it, i, j) => {
      const idx = j === undefined ? 'data-i="' + i + '"' : 'data-i="' + i + '" data-j="' + j + '"';
      return '<div class="mrow" ' + idx + '><input class="input" data-k="label" placeholder="Name" value="' + esc(it.label || '') + '"><input class="input" data-k="href" placeholder="/page/section" value="' + esc(it.href || '') + '">' +
        '<label class="chk"><input type="checkbox" data-k="visible" ' + (it.visible !== false ? 'checked' : '') + '> Show</label>' +
        '<span class="acts"><button class="ib" data-mv="-1" ' + idx + '>↑</button><button class="ib" data-mv="1" ' + idx + '>↓</button><button class="ib danger" data-del ' + idx + '>✕</button></span></div>';
    };
    const draw = () => {
      box.innerHTML = '<p class="hint" style="margin-bottom:14px">Items in the top bar. Items with sub-items get a dropdown arrow. Sub-items marked with a permission (like Find a client) only show to people who have it.</p><div id="mtree">' +
        nav.map((it, i) => '<div class="mtop">' + row(it, i) + '<div class="mkids">' + (it.children || []).map((k, j) => row(k, i, j)).join('') + '<button class="ib" data-addk="' + i + '">+ Add sub-item</button></div></div>').join('') + '</div>' +
        '<div class="toolbar"><button class="ib" id="maddt">+ Add menu item</button><span class="grow"></span><button class="btn btn-ghost btn-sm" id="mreset">Reset to default</button><button class="btn btn-primary btn-sm" id="msave">Save menu</button></div>';
    };
    draw();
    box.oninput = e => { const r = e.target.closest('.mrow'); if (!r || !e.target.dataset.k) return; const i = +r.dataset.i, it = r.dataset.j !== undefined ? nav[i].children[+r.dataset.j] : nav[i]; it[e.target.dataset.k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; };
    box.onclick = async e => {
      const t = e.target;
      if (t.id === 'maddt') { nav.push({ id: 'item' + Date.now(), label: 'New item', href: '/', visible: true, children: [] }); return draw(); }
      if (t.dataset.addk !== undefined) { (nav[+t.dataset.addk].children = nav[+t.dataset.addk].children || []).push({ label: 'New link', href: '/' }); return draw(); }
      if (t.dataset.mv) { const i = +t.dataset.i, j = t.dataset.j !== undefined ? +t.dataset.j : null, d = +t.dataset.mv, arr = j === null ? nav : nav[i].children, k = j === null ? i : j; if (arr[k + d]) { [arr[k], arr[k + d]] = [arr[k + d], arr[k]]; draw(); } return; }
      if (t.hasAttribute && t.hasAttribute('data-del')) { const i = +t.dataset.i; if (t.dataset.j !== undefined) nav[i].children.splice(+t.dataset.j, 1); else nav.splice(i, 1); return draw(); }
      if (t.id === 'mreset') { if (!(await UI.confirm('Reset the menu?', 'Your changes are replaced by the default menu. Press Save to publish it.', { confirmText: 'Reset' }))) return; nav = clone(HC.DEFAULT_NAV); return draw(); }
      if (t.id === 'msave') {
        const okUrl = u => /^(\/|#|https?:\/\/|mailto:)/i.test(String(u || '').trim());
        for (const it of nav) {
          if (!String(it.label || '').trim()) return UI.toast('Every menu item needs a name.', 'warn');
          if (!okUrl(it.href)) return UI.toast('“' + it.label + '” needs a valid link (start with / or https://).', 'warn', 6000);
          for (const k of (it.children || [])) { if (!String(k.label || '').trim() || !okUrl(k.href)) return UI.toast('Check the sub-items of “' + it.label + '”.', 'warn', 6000); }
        }
        try { await saveContent('nav', nav); UI.toast('Menu saved. It is live for everyone.', 'success'); } catch (er) { fail(er); }
      }
    };
  }

  const IMG_SLOTS = [['brand.logo', 'Logo (header, hero, loading, login)', '/logo.jpg'], ['owner.photo', 'Founder & CEO photo', ''], ['landing.intro', 'Landing page: intro image (next to the Holomatrix text)', '']];
  const LINK_KEYS = [
    ['social.instagram', 'Holomatrix Instagram (top bar + footer)', 'https://www.instagram.com/holomatrix_consulting/'],
    ['social.linkedin', 'Holomatrix LinkedIn (top bar + footer)', 'https://www.linkedin.com/company/holomatrixconsulting'],
    ['owner.linkedin', 'Founder: LinkedIn', 'https://www.linkedin.com/in/frasamalpushp/'],
    ['owner.x', 'Founder: X', 'https://x.com/AmalPushp4'],
    ['owner.instagram', 'Founder: Instagram', 'https://www.instagram.com/amalpjha2701/'],
    ['owner.linktree', 'Founder: Linktree', 'https://linktr.ee/amalpushp']
  ];
  async function webMedia(box) {
    const c = await getContent(['images', 'links']), images = c.images || {}, links = c.links || {};
    box.innerHTML = '<div class="panel"><h4>Images</h4>' + IMG_SLOTS.map(s => { const cur = images[s[0]] || s[2]; return '<div class="rowitem"><div class="thumb">' + (cur ? '<img src="' + esc(cur) + '" alt="">' : '—') + '</div><div class="grow"><b>' + s[1] + '</b><small>' + (images[s[0]] ? 'Custom image' : 'Default') + '</small></div><div class="acts"><button class="ib" data-up="' + s[0] + '">Upload</button><button class="ib" data-rs="' + s[0] + '" ' + (images[s[0]] ? '' : 'disabled') + '>Reset</button></div></div>'; }).join('') + '<p class="hint">The browser tab icon and email logo come from the file <b>logo.jpg</b> in your GitHub repo.</p></div>' +
      '<div class="panel"><h4>Links</h4>' + LINK_KEYS.map(k => '<div class="field"><label>' + k[1] + '</label><div style="display:flex;gap:8px"><span class="ico" style="margin-top:9px">' + HoloIcons.svg(HoloIcons.detect(links[k[0]] || k[2])) + '</span><input class="input" data-lk="' + k[0] + '" value="' + esc(links[k[0]] || k[2]) + '"></div></div>').join('') + '<div class="dlg-f"><button class="btn btn-primary btn-sm" id="lsave">Save links</button></div></div>';
    box.onclick = async e => {
      const u = e.target.closest('[data-up]'), r = e.target.closest('[data-rs]');
      if (u) { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/png,image/jpeg,image/webp,image/gif'; inp.onchange = async () => { if (!inp.files[0]) return; UI.toast('Uploading…'); try { const url = await HoloMedia.upload(inp.files[0], { folder: 'site', max: 1600 }); images[u.dataset.up] = url; await saveContent('images', images); UI.toast('Image updated.', 'success'); webMedia(box); } catch (er) { fail(er); } }; inp.click(); }
      if (r) { delete images[r.dataset.rs]; try { await saveContent('images', images); UI.toast('Reset to default.', 'success'); webMedia(box); } catch (er) { fail(er); } }
    };
    $('#lsave', box).onclick = async () => {
      const out = Object.assign({}, links);
      $$('[data-lk]', box).forEach(i => { const k = i.dataset.lk, def = (LINK_KEYS.find(x => x[0] === k) || [])[2], val = i.value.trim(); if (!val || val === def) delete out[k]; else out[k] = val; });
      try { await saveContent('links', out); UI.toast('Links saved.', 'success'); webMedia(box); } catch (er) { fail(er); }
    };
  }

  async function webPages(box) {
    box.innerHTML = '<div class="pcards">' +
      [['/', 'Landing page', 'Headings, founder info, buttons, colours, fonts, section order, extra items.'], ['/news', 'News', 'Page title and intro.'], ['/research', 'Researches', 'Page title and intro.'], ['/about/holomatrix', 'About Holomatrix', 'All Holomatrix text, FAQ answers and links.'], ['/about/holomatrix-team', 'Holomatrix Team', 'Heading and extra items. Add members in the Holomatrix Team tab.'],
        ['/clients/become-a-client', 'Clients', 'Title, intro and the payment warning text.'], ['/contribute/donate', 'Contribute → Donate', 'Edit the donation note and button labels.'], ['/contact/ai-support', 'Contact us', 'Title, intro and the AI knowledge box.'], ['/privacy', 'Privacy Policy', 'Click the text and edit it.'], ['/terms', 'Terms of Service', 'Click the text and edit it.']]
        .map(p => '<a class="card" href="' + p[0] + '"><h4>' + p[1] + '</h4><p>' + p[2] + '</p></a>').join('') + '</div>' +
      '<div class="panel" style="margin-top:20px"><h4>How the visual editor works</h4><p class="psub" style="margin:0">Open a page above while logged in, then click <b>✏️ Edit site</b> at the bottom. Click any text to type (a small bar above it changes its <b>colour and size</b>), click a picture to change it, and use <b>🎨 Design</b> to add text or image placeholders and social-link blocks, change colours, fonts, links and section order. Press <b>Save</b> and everyone sees it.</p></div>';
  }

  /* ================= ANNOUNCEMENTS ================= */
  async function api(payload) {
    const s = await Auth.session();
    const r = await fetch('/api/announce', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.access_token }, body: JSON.stringify(payload) });
    let j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error(j.error || ('Server error ' + r.status));
    return j;
  }
  R.announce = async v => {
    const [roles, hist] = await Promise.all([sb.from('roles').select('id,name').order('position'), sb.from('announcements').select('*').order('created_at', { ascending: false }).limit(20)]);
    v.innerHTML = '<h2 class="pt">Announcements</h2><p class="psub">Emails go out with the Holomatrix logo, only to verified, non-banned members who haven\'t opted out. For a banner on the website itself, use the Banners tab.</p>' +
      '<div class="panel"><div class="field"><label>Subject</label><input class="input" id="asub" maxlength="150"></div><div class="field"><label>Message (blank line = new paragraph)</label><textarea class="input" id="abody" style="min-height:180px" maxlength="5000"></textarea></div>' +
      '<div class="field"><label>Send to</label><select class="input" id="aaud"><option value="all">All members</option>' + (roles.data || []).map(r => '<option value="role:' + r.id + '">Role: ' + esc(r.name) + '</option>').join('') + '</select></div>' +
      '<div class="dlg-f"><button class="btn btn-ghost btn-sm" id="aprev">Preview email</button><button class="btn btn-primary btn-sm" id="asend">Send…</button></div><p class="hint">Brevo\'s free plan allows about 300 emails a day. Sends over 290 recipients are refused.</p></div>' +
      '<div class="panel"><h4>History</h4>' + ((hist.data || []).map(a => '<div class="rowitem"><div class="grow"><b>' + esc(a.subject) + '</b><small>' + fmt(a.created_at) + ' · ' + a.recipients_count + ' sent' + (a.failed_count ? ' · ' + a.failed_count + ' failed' : '') + '</small></div></div>').join('') || '<div class="empty">Nothing sent yet.</div>') + '</div>';
    const get = () => ({ subject: $('#asub').value.trim(), body: $('#abody').value.trim(), audience: $('#aaud').value });
    const valid = p => { if (!p.subject || !p.body) { UI.toast('Add a subject and a message first.', 'warn'); return false; } return true; };
    $('#aprev').onclick = async () => { const p = get(); if (!valid(p)) return; try { const j = await api(Object.assign({ mode: 'preview' }, p)); const d = dialog('Email preview', '<iframe class="frame" id="pf"></iframe>', { wide: true }); $('#pf', d.el).srcdoc = j.html; } catch (e) { fail(e); } };
    $('#asend').onclick = async () => {
      const p = get(); if (!valid(p)) return;
      try {
        const c = await api(Object.assign({ mode: 'count' }, p));
        if (!c.count) return UI.toast('No eligible recipients for that audience.', 'warn');
        if (!(await UI.confirm('Send to ' + c.count + ' people?', 'This emails “' + p.subject + '” right now and cannot be undone.', { confirmText: 'Send now' }))) return;
        const j = await api(Object.assign({ mode: 'send' }, p));
        UI.toast('Sent to ' + j.sent + (j.failed ? ' (' + j.failed + ' failed)' : '') + '.', 'success', 6000); R.announce(v);
      } catch (e) { fail(e); }
    };
  };

  /* ================= AUDIT LOGS ================= */
  R.logs = async v => {
    await names();
    const PS = 50; let rows = [], done = false;
    v.innerHTML = '<h2 class="pt">Audit logs</h2><p class="psub">Every change to roles, team, content and more, recorded automatically.</p><div class="toolbar"><input class="input" id="lsearch" placeholder="Filter by person or action…"></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead><tbody id="ltb"></tbody></table></div><div class="toolbar" style="margin-top:16px;justify-content:center"><button class="btn btn-ghost btn-sm" id="lmore">Load more</button></div>';
    const draw = () => {
      const q = ($('#lsearch').value || '').toLowerCase();
      $('#ltb').innerHTML = rows.filter(l => !q || (l.actor_email || '').toLowerCase().includes(q) || describe(l).toLowerCase().includes(q)).map(l => '<tr><td class="mono">' + fmt(l.created_at) + '</td><td>' + esc(l.actor_email || 'system') + '</td><td>' + esc(describe(l)) + '</td></tr>').join('') || '<tr><td colspan="3"><div class="empty">No entries.</div></td></tr>';
      $('#lmore').hidden = done;
    };
    const load = async () => { const { data, error } = await sb.from('audit_logs').select('*').order('created_at', { ascending: false }).range(rows.length, rows.length + PS - 1); if (error) return fail(error); rows = rows.concat(data || []); if (!data || data.length < PS) done = true; draw(); };
    $('#lsearch').oninput = draw; $('#lmore').onclick = load;
    await load();
  };

  /* ================= EXTENSIONS (Banners, Writing guide, ...) plug in here ================= */
  window.HoloAdmin = {
    R, TABS, dialog, fail, saveContent, getContent, can, esc, avatar, myName,
    get user() { return A && A.user; },
    addTab(tab, after) { const i = TABS.findIndex(x => x.id === after); TABS.splice(i < 0 ? TABS.length : i + 1, 0, tab); }
  };
  const ext = window.HoloAdminExt = window.HoloAdminExt || [];
  const runExt = f => { try { f(window.HoloAdmin); } catch (e) { console.warn('Admin extension failed:', e); } return 1; };
  ext.splice(0).forEach(runExt); ext.push = runExt;

  /* ================= BOOT ================= */
  (async function boot() {
    if (!window.sb) return;
    A = await Auth.access();
    if (!A) { UI.go('/login?next=/admin'); return; }
    if (!A.isStaff) { $('#gate').hidden = false; return; }
    myTop = Math.min(...A.roles.map(r => r.position));
    $('#app').hidden = false; buildShell();
    addEventListener('hashchange', route); route();
  })();
})();
