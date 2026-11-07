/* Profile setup (first login) and Edit profile (/welcome?edit=1) */
(function () {
  'use strict';
  const esc = UI.esc, $ = s => document.querySelector(s), q = new URLSearchParams(location.search);
  const edit = q.get('edit') === '1';
  const next = (() => { const n = q.get('next') || '/'; return (n[0] === '/' && n[1] !== '/') ? n : '/'; })();
  const RE = /^[a-z][a-z0-9_.]{2,19}$/;

  (async function () {
    if (!window.sb) return;
    const a = await Auth.access();
    if (!a) { UI.go('/login?next=' + encodeURIComponent('/welcome' + location.search)); return; }
    const uid = a.user.id, md = a.user.user_metadata || {};
    const { data: p } = await sb.from('profiles').select('*').eq('id', uid).maybeSingle();
    const prof = p || {};
    if (prof.profile_completed && !edit) { UI.go(next === '/' ? '/dashboard' : next); return; }

    let avatar = prof.avatar_url || md.avatar_url || md.picture || '';
    const name = prof.full_name || md.full_name || md.name || '';

    $('#wl').innerHTML =
      '<h1>' + (edit ? 'Edit your profile' : 'Set up your profile') + '</h1><p class="sub">' + (edit ? 'Update how you appear on Holomatrix.' : 'Just two details so people know who you are.') + '</p>' +
      '<div class="wl-av"><div class="wl-ph" id="ph"></div><div><button class="btn btn-ghost btn-sm" id="up" type="button">📷 ' + (avatar ? 'Change photo' : 'Add photo') + '</button><input type="file" id="file" accept="image/png,image/jpeg,image/webp" hidden><p style="font-size:.8rem;color:var(--muted);margin-top:6px">Optional</p></div></div>' +
      '<div class="field"><label for="un">Username *</label><input class="input" id="un" maxlength="20" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="e.g. amal.pushp" value="' + esc(prof.username || '') + '"><div class="st wait" id="st">3 to 20 characters: letters, numbers, dot or underscore. Must be unique.</div></div>' +
      '<div class="field"><label for="dn">Display name *</label><input class="input" id="dn" maxlength="60" value="' + esc(name) + '"></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" id="save">' + (edit ? 'Save changes' : 'Continue') + '</button>' + (edit ? '<a class="btn btn-ghost" href="/dashboard">Cancel</a>' : '') + '</div>';

    const drawPh = () => { $('#ph').innerHTML = avatar && /^https:\/\//.test(avatar) ? '<img src="' + esc(avatar) + '" alt="" referrerpolicy="no-referrer">' : esc((name || a.user.email || '?').trim().charAt(0).toUpperCase()); };
    drawPh();
    $('#up').onclick = () => $('#file').click();
    $('#file').onchange = async e => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      UI.toast('Uploading…');
      try { avatar = await HoloMedia.upload(f, { bucket: 'avatars', folder: uid, max: 512 }); drawPh(); UI.toast('Photo ready.', 'success'); } catch (er) { UI.toast(er.message || 'Upload failed.', 'error'); }
    };

    let timer;
    const st = $('#st');
    $('#un').oninput = e => {
      const v = e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '');
      clearTimeout(timer);
      if (!RE.test(v) || /\.\./.test(v) || /\.$/.test(v)) { st.className = 'st bad'; st.textContent = '3 to 20 characters, starting with a letter. Letters, numbers, dot or underscore only.'; return; }
      st.className = 'st wait'; st.textContent = 'Checking…';
      timer = setTimeout(async () => {
        const { data, error } = await sb.rpc('username_available', { p_username: v });
        if (error) { st.className = 'st bad'; st.textContent = 'Could not check right now.'; return; }
        st.className = 'st ' + (data ? 'ok' : 'bad'); st.textContent = data ? '✓ @' + v + ' is available' : 'That username is taken or not allowed.';
      }, 400);
    };

    $('#save').onclick = async () => {
      const un = $('#un').value.trim(), dn = $('#dn').value.trim();
      if (!RE.test(un)) return UI.toast('Please choose a valid username.', 'warn');
      if (dn.length < 2) return UI.toast('Please enter your display name.', 'warn');
      const btn = $('#save'); btn.disabled = true;
      const { error } = await sb.rpc('save_profile', { p_username: un, p_name: dn });
      if (error) { btn.disabled = false; return UI.toast(error.message, 'error', 6000); }
      await sb.from('profiles').update({ avatar_url: avatar || null }).eq('id', uid);
      await sb.auth.updateUser({ data: { full_name: dn, avatar_url: avatar || null } });
      UI.toast(edit ? 'Profile updated.' : 'Welcome to Holomatrix! 🎉', 'success');
      setTimeout(() => UI.go(edit ? '/dashboard' : next), 500);
    };
  })();
})();
