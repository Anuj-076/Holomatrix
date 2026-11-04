/* User dashboard: Overview (/dashboard) and Settings (/dashboard#settings) */
(function () {
  'use strict';
  const esc = UI.esc, C = HoloCommon;
  const $ = s => document.querySelector(s);

  (async function () {
    if (!window.sb) return;
    const a = await Auth.access();
    if (!a) { UI.go('/login?next=/dashboard'); return; }

    const uid = a.user.id;
    const { data: p } = await sb.from('profiles').select('*').eq('id', uid).maybeSingle();
    const prof = p || { full_name: '', avatar_url: '', email_opt_in: true };
    const md = a.user.user_metadata || {};
    let avatar = prof.avatar_url || md.avatar_url || md.picture || '';
    const name = prof.full_name || md.full_name || md.name || '';
    const premium = await C.premium();
    const { data: subs } = await sb.from('subscriptions').select('expires_at,plans(name)').eq('user_id', uid).eq('status', 'active').order('expires_at', { ascending: false, nullsFirst: true }).limit(5);
    const sub = (subs || []).find(s => !s.expires_at || new Date(s.expires_at) > new Date());
    const { data: cp } = await sb.from('client_profiles').select('visible,status').eq('user_id', uid).maybeSingle();

    const overview = () =>
      '<h2 class="pt">Welcome, ' + esc((name || a.user.email).split(' ')[0]) + ' 👋</h2><p class="psub">' + esc(a.user.email) + '</p>' +
      '<div class="cards">' +
      '<div class="card stat-c"><span>⭐</span><div class="n gradient-text" style="font-size:1.6rem">' + (sub ? esc((sub.plans && sub.plans.name) || 'Active') : (premium ? 'Admin' : 'Free')) + '</div><small>' + (sub && sub.expires_at ? 'Until ' + C.date(sub.expires_at) : 'Your plan') + '</small></div>' +
      '<div class="card stat-c"><span>🧑‍💼</span><div class="n gradient-text" style="font-size:1.6rem">' + (cp ? (cp.status === 'suspended' ? 'Suspended' : (cp.visible ? 'Visible' : 'Hidden')) : 'None') + '</div><small>Client profile</small></div></div>' +
      '<div class="panel"><h4>Quick links</h4><div style="display:flex;gap:10px;flex-wrap:wrap">' +
      '<a class="btn btn-ghost btn-sm" href="/funds#subscribe">View packs</a><a class="btn btn-ghost btn-sm" href="/clients#become">' + (cp ? 'Edit client profile' : 'Become a client') + '</a>' +
      '<a class="btn btn-ghost btn-sm" href="/contact">💬 Contact us</a>' + (a.isStaff ? '<a class="btn btn-primary btn-sm" href="/admin">Admin dashboard</a>' : '') + '</div></div>';

    const settings = () =>
      '<h2 class="pt">Settings</h2><p class="psub">Manage your profile and preferences.</p>' +
      '<div class="panel"><h4>Profile</h4><div class="prof"><span class="av" id="av"></span><div><button class="btn btn-ghost btn-sm" id="avup">📷 Change photo</button><input type="file" id="avfile" accept="image/png,image/jpeg,image/webp" hidden><p class="hint">Square photos look best.</p></div></div>' +
      '<div class="field" style="margin-top:20px;max-width:420px"><label for="nm">Your name</label><input class="input" id="nm" maxlength="80" value="' + esc(name) + '"></div><button class="btn btn-primary btn-sm" id="save">Save profile</button></div>' +
      '<div class="panel"><h4>Email</h4><label class="perm" style="border:0"><div><b>Announcements</b><small>Receive emails from the Holomatrix team. Account emails such as password resets are always sent.</small></div><span class="sw"><input type="checkbox" id="opt" ' + (prof.email_opt_in !== false ? 'checked' : '') + '><i></i></span></label></div>' +
      '<div class="panel"><h4>Password</h4><div class="field" style="max-width:420px"><label for="pw">New password</label><input class="input" id="pw" type="password" autocomplete="new-password" placeholder="8+ characters, letters and numbers"></div><button class="btn btn-ghost btn-sm" id="pwsave">Change password</button></div>' +
      '<div class="panel"><h4>Appearance</h4><div class="seg" id="themeseg" style="margin:0">' + [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(t => '<button data-th="' + t[0] + '" class="' + (HoloTheme.pref() === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div></div>' +
      '<div class="panel"><button class="btn btn-danger btn-sm" id="out">Log out</button></div>';

    const render = () => {
      const tab = location.hash === '#settings' ? 'settings' : 'overview';
      $('#dash').innerHTML = '<div class="seg"><a href="#overview" class="' + (tab === 'overview' ? 'on' : '') + '">Dashboard</a><a href="#settings" class="' + (tab === 'settings' ? 'on' : '') + '">Settings</a></div><div class="view-in">' + (tab === 'settings' ? settings() : overview()) + '</div>';
      if (tab === 'settings') bind();
    };

    function bind() {
      const drawAv = () => { $('#av').innerHTML = avatar && /^https:\/\//.test(avatar) ? '<img src="' + esc(avatar) + '" alt="" referrerpolicy="no-referrer">' : esc((name || a.user.email || '?').trim().charAt(0).toUpperCase()); };
      drawAv();
      $('#avup').onclick = () => $('#avfile').click();
      $('#avfile').onchange = async e => {
        const f = e.target.files[0]; e.target.value = ''; if (!f) return;
        UI.toast('Uploading…');
        try {
          const url = await HoloMedia.upload(f, { bucket: 'avatars', folder: uid, max: 512 });
          const { error } = await sb.from('profiles').update({ avatar_url: url }).eq('id', uid); if (error) throw error;
          await sb.auth.updateUser({ data: { avatar_url: url } });
          avatar = url; drawAv(); UI.toast('Photo updated. Refresh to see it in the top bar.', 'success');
        } catch (er) { UI.toast(er.message || 'Upload failed.', 'error'); }
      };
      $('#save').onclick = async () => {
        const v = $('#nm').value.trim(); if (v.length < 2) return UI.toast('Please enter your name.', 'warn');
        const { error } = await sb.from('profiles').update({ full_name: v }).eq('id', uid); if (error) return UI.toast(error.message, 'error');
        await sb.auth.updateUser({ data: { full_name: v } }); UI.toast('Profile saved.', 'success');
      };
      $('#opt').onchange = async e => {
        const { error } = await sb.from('profiles').update({ email_opt_in: e.target.checked }).eq('id', uid);
        if (error) { e.target.checked = !e.target.checked; return UI.toast(error.message, 'error'); }
        UI.toast(e.target.checked ? 'You will receive announcements.' : 'Announcements turned off.', 'success');
      };
      $('#pwsave').onclick = async () => {
        const v = $('#pw').value; if (v.length < 8 || !/[A-Za-z]/.test(v) || !/\d/.test(v)) return UI.toast('Password needs 8+ characters with a letter and a number.', 'warn', 5500);
        const { error } = await sb.auth.updateUser({ password: v }); if (error) return UI.toast(error.message, 'error');
        $('#pw').value = ''; UI.toast('Password changed.', 'success');
      };
      $('#themeseg').onclick = e => { const b = e.target.closest('[data-th]'); if (!b) return; UI.setTheme(b.dataset.th); document.querySelectorAll('#themeseg button').forEach(x => x.classList.toggle('on', x === b)); };
      $('#out').onclick = () => Auth.signOut();
    }

    addEventListener('hashchange', render);
    render();
  })();
})();
