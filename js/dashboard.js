/* User dashboard: profile, avatar, email preferences, theme */
(function () {
  'use strict';
  const esc = UI.esc;
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
    const pref = HoloTheme.pref();

    $('#dash').innerHTML =
      '<div class="top-line"><a href="/" class="brand"><span class="img-slot logo-slot" style="width:40px;height:40px"><img src="/logo.jpg" alt=""></span><span>Holomatrix</span></a>' +
      '<div style="display:flex;gap:10px;align-items:center"><button class="btn btn-ghost btn-icon" data-theme-toggle aria-label="Toggle theme">🌙</button>' +
      (a.isStaff ? '<a class="btn btn-ghost btn-sm" href="/admin">Admin dashboard</a>' : '') + '<a class="btn btn-ghost btn-sm" href="/">Home</a></div></div>' +
      '<h2 class="pt">My account</h2><p class="psub">' + esc(a.user.email) + '</p>' +

      '<div class="panel"><h4>Profile</h4><div class="prof"><span class="av" id="av"></span><div>' +
      '<button class="btn btn-ghost btn-sm" id="avup">📷 Change photo</button><input type="file" id="avfile" accept="image/png,image/jpeg,image/webp" hidden><p class="hint">Square photos look best (max 2 MB after resizing).</p></div></div>' +
      '<div class="field" style="margin-top:20px;max-width:420px"><label for="nm">Your name</label><input class="input" id="nm" maxlength="80" value="' + esc(name) + '"></div>' +
      '<button class="btn btn-primary btn-sm" id="save">Save profile</button></div>' +

      '<div class="panel"><h4>Email</h4><label class="perm" style="border:0"><div><b>Announcements</b><small>Receive emails from the Holomatrix team. Account emails such as password resets are always sent.</small></div>' +
      '<span class="sw"><input type="checkbox" id="opt" ' + (prof.email_opt_in !== false ? 'checked' : '') + '><i></i></span></label></div>' +

      '<div class="panel"><h4>Appearance</h4><div class="seg" id="themeseg" style="margin:0">' +
      [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(t => '<button data-th="' + t[0] + '" class="' + (pref === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div></div>' +

      '<div class="panel"><h4>Help</h4><button class="btn btn-ghost btn-sm" id="chat">💬 Chat with support</button> <button class="btn btn-danger btn-sm" id="out" style="margin-left:8px">Log out</button></div>';

    const drawAv = () => { $('#av').innerHTML = avatar && /^https:\/\//.test(avatar) ? '<img src="' + esc(avatar) + '" alt="" referrerpolicy="no-referrer">' : esc((name || a.user.email || '?').trim().charAt(0).toUpperCase()); };
    drawAv(); UI.refreshThemeIcons();
    document.querySelectorAll('[data-theme-toggle]').forEach(b => b.addEventListener('click', UI.toggleTheme));

    $('#avup').onclick = () => $('#avfile').click();
    $('#avfile').onchange = async e => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      UI.toast('Uploading…');
      try {
        const url = await HoloMedia.upload(f, { bucket: 'avatars', folder: uid, max: 512 });
        const { error } = await sb.from('profiles').update({ avatar_url: url }).eq('id', uid);
        if (error) throw error;
        await sb.auth.updateUser({ data: { avatar_url: url } });
        avatar = url; drawAv(); UI.toast('Photo updated.', 'success');
      } catch (er) { UI.toast(er.message || 'Upload failed.', 'error'); }
    };
    $('#save').onclick = async () => {
      const v = $('#nm').value.trim();
      if (v.length < 2) return UI.toast('Please enter your name.', 'warn');
      const { error } = await sb.from('profiles').update({ full_name: v }).eq('id', uid);
      if (error) return UI.toast(error.message, 'error');
      await sb.auth.updateUser({ data: { full_name: v } });
      UI.toast('Profile saved.', 'success');
    };
    $('#opt').onchange = async e => {
      const { error } = await sb.from('profiles').update({ email_opt_in: e.target.checked }).eq('id', uid);
      if (error) { e.target.checked = !e.target.checked; return UI.toast(error.message, 'error'); }
      UI.toast(e.target.checked ? 'You will receive announcements.' : 'Announcements turned off.', 'success');
    };
    $('#themeseg').onclick = e => {
      const b = e.target.closest('[data-th]'); if (!b) return;
      UI.setTheme(b.dataset.th);
      document.querySelectorAll('#themeseg button').forEach(x => x.classList.toggle('on', x === b));
    };
    $('#chat').onclick = () => window.HoloSupport && HoloSupport.open();
    $('#out').onclick = () => Auth.signOut();
  })();
})();
