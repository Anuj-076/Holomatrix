/* My dashboard: profile, plan, preferences and security in one page */
(function () {
  'use strict';
  const esc = UI.esc, C = HoloCommon, $ = s => document.querySelector(s);

  (async function () {
    if (!window.sb) return;
    const a = await Auth.access();
    if (!a) { UI.go('/login?next=/dashboard'); return; }
    const uid = a.user.id;
    const { data: p } = await sb.from('profiles').select('*').eq('id', uid).maybeSingle();
    const prof = p || {}, md = a.user.user_metadata || {};
    if (p && p.profile_completed === false) { UI.go('/welcome?next=/dashboard'); return; }
    const name = prof.full_name || md.full_name || md.name || '', avatar = prof.avatar_url || md.avatar_url || md.picture || '';
    const premium = await C.premium();
    const { data: subs } = await sb.from('subscriptions').select('expires_at,plans(name)').eq('user_id', uid).eq('status', 'active').order('expires_at', { ascending: false, nullsFirst: true }).limit(5);
    const sub = (subs || []).find(s => !s.expires_at || new Date(s.expires_at) > new Date());
    const { data: cp } = await sb.from('client_profiles').select('request_status,status').eq('user_id', uid).maybeSingle();
    const bday = prof.birthday ? new Date(prof.birthday + 'T00:00:00').toLocaleDateString([], { dateStyle: 'long' }) : '—';

    $('#dash').innerHTML =
      '<div class="panel"><div class="prof"><span class="av" style="width:92px;height:92px;font-size:2rem">' + (avatar && /^https:\/\//.test(avatar) ? '<img src="' + esc(avatar) + '" alt="" referrerpolicy="no-referrer">' : esc((name || '?').trim().charAt(0).toUpperCase())) + '</span>' +
      '<div style="flex:1;min-width:200px"><h2 class="pt" style="margin:0">' + esc(name) + '</h2><p class="psub" style="margin:2px 0 6px">@' + esc(prof.username || '—') + '</p><small style="color:var(--muted)">' + esc(a.user.email) + ' · Birthday: ' + esc(bday) + '</small></div>' +
      '<a class="btn btn-primary btn-sm" href="/welcome?edit=1">Edit profile</a></div></div>' +

      '<div class="cards">' +
      '<div class="card stat-c"><span>⭐</span><div class="n gradient-text" style="font-size:1.6rem">' + (sub ? esc((sub.plans && sub.plans.name) || 'Active') : (premium ? 'Admin' : 'Free')) + '</div><small>' + (sub && sub.expires_at ? 'Until ' + C.date(sub.expires_at) : 'Your plan') + '</small></div>' +
      '<div class="card stat-c"><span>🙋</span><div class="n gradient-text" style="font-size:1.6rem">' + (cp ? (cp.status === 'suspended' ? 'Suspended' : (cp.request_status === 'open' ? 'Open' : 'Closed')) : 'None') + '</div><small>My client request</small></div></div>' +

      '<div class="panel"><h4>Quick links</h4><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-ghost btn-sm" href="/clients/become-a-client">' + (cp ? 'Manage my request' : 'Become a client') + '</a><a class="btn btn-ghost btn-sm" href="/contact/staff-support">💬 Contact us</a>' + (a.isStaff ? '<a class="btn btn-primary btn-sm" href="/admin">Admin dashboard</a>' : '') + '</div></div>' +

      '<div class="panel"><h4>Preferences</h4><label class="perm" style="border:0"><div><b>Announcement emails</b><small>Receive emails from the Holomatrix team. Account emails such as password resets are always sent.</small></div><span class="sw"><input type="checkbox" id="opt" ' + (prof.email_opt_in !== false ? 'checked' : '') + '><i></i></span></label>' +
      '<div style="margin-top:14px"><b style="display:block;margin-bottom:8px">Appearance</b><div class="seg" id="themeseg" style="margin:0">' + [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(t => '<button data-th="' + t[0] + '" class="' + (HoloTheme.pref() === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div></div></div>' +

      '<div class="panel"><h4>Security</h4><div class="field" style="max-width:420px"><label for="pw">New password</label><input class="input" id="pw" type="password" autocomplete="new-password" placeholder="8+ characters, letters and numbers"></div><button class="btn btn-ghost btn-sm" id="pwsave">Change password</button></div>' +
      '<div class="panel"><button class="btn btn-danger btn-sm" id="out">Log out</button></div>';

    $('#opt').onchange = async e => {
      const { error } = await sb.from('profiles').update({ email_opt_in: e.target.checked }).eq('id', uid);
      if (error) { e.target.checked = !e.target.checked; return UI.toast(error.message, 'error'); }
      UI.toast(e.target.checked ? 'You will receive announcements.' : 'Announcements turned off.', 'success');
    };
    $('#themeseg').onclick = e => { const b = e.target.closest('[data-th]'); if (!b) return; UI.setTheme(b.dataset.th); document.querySelectorAll('#themeseg button').forEach(x => x.classList.toggle('on', x === b)); };
    $('#pwsave').onclick = async () => {
      const v = $('#pw').value; if (v.length < 8 || !/[A-Za-z]/.test(v) || !/\d/.test(v)) return UI.toast('Password needs 8+ characters with a letter and a number.', 'warn', 5500);
      const { error } = await sb.auth.updateUser({ password: v }); if (error) return UI.toast(error.message, 'error');
      $('#pw').value = ''; UI.toast('Password changed.', 'success');
    };
    $('#out').onclick = () => Auth.signOut();
  })();
})();
