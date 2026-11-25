/* My dashboard: profile, client request, preferences and security in one page */
(function () {
  'use strict';
  const esc = UI.esc, $ = s => document.querySelector(s);

  (async function () {
    if (!window.sb) return;
    const a = await Auth.access();
    if (!a) { UI.go('/login?next=/dashboard'); return; }
    const uid = a.user.id;
    const { data: p } = await sb.from('profiles').select('*').eq('id', uid).maybeSingle();
    const prof = p || {}, md = a.user.user_metadata || {};
    if (p && p.profile_completed === false) { UI.go('/welcome?next=/dashboard'); return; }
    const name = prof.full_name || md.full_name || md.name || '', avatar = prof.avatar_url || md.avatar_url || md.picture || '';
    const { data: cp } = await sb.from('client_profiles').select('request_status,status').eq('user_id', uid).maybeSingle();

    $('#dash').innerHTML =
      '<div class="panel"><div class="prof"><span class="av" style="width:92px;height:92px;font-size:2rem">' + (avatar && /^https:\/\//.test(avatar) ? '<img src="' + esc(avatar) + '" alt="" referrerpolicy="no-referrer">' : esc((name || '?').trim().charAt(0).toUpperCase())) + '</span>' +
      '<div style="flex:1;min-width:200px"><h2 class="pt" style="margin:0">' + esc(name) + '</h2><p class="psub" style="margin:2px 0 6px">@' + esc(prof.username || '—') + '</p><small style="color:var(--muted)">' + esc(a.user.email) + '</small></div>' +
      '<a class="btn btn-primary btn-sm" href="/welcome?edit=1">Edit profile</a></div></div>' +

      '<div class="cards">' +
      '<div class="card stat-c"><span>🙋</span><div class="n gradient-text" style="font-size:1.6rem">' + (cp ? (cp.status === 'suspended' ? 'Suspended' : (cp.request_status === 'open' ? 'Open' : 'Closed')) : 'None') + '</div><small>My client request</small></div></div>' +

      '<div class="panel"><h4>Quick links</h4><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-ghost btn-sm" href="/clients/become-a-client">' + (cp ? 'Manage my request' : 'Become a client') + '</a><a class="btn btn-ghost btn-sm" href="/contact/staff-support">💬 Contact us</a>' + (a.isStaff ? '<a class="btn btn-primary btn-sm" href="/admin">Admin dashboard</a>' : '') + '</div></div>' +

      '<div class="panel"><h4>Preferences</h4><label class="perm" style="border:0"><div><b>Announcement emails</b><small>Receive emails from the Holomatrix team. Account emails such as password resets are always sent.</small></div><span class="sw"><input type="checkbox" id="opt" ' + (prof.email_opt_in !== false ? 'checked' : '') + '><i></i></span></label>' +
      '<div style="margin-top:14px"><b style="display:block;margin-bottom:8px">Appearance</b><div class="seg" id="themeseg" style="margin:0">' + [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(t => '<button data-th="' + t[0] + '" class="' + (HoloTheme.pref() === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div></div></div>' +

      '<div class="panel"><h4>Change password</h4>' +
      '<div class="field" style="max-width:420px"><label for="pw">Change password</label><input class="input" id="pw" type="password" autocomplete="new-password" placeholder="New password (8+ characters, letters and numbers)"></div>' +
      '<div class="field" style="max-width:420px"><label for="pw2">Confirm new password</label><input class="input" id="pw2" type="password" autocomplete="new-password" placeholder="Type the same password again"></div>' +
      '<div class="hint" id="pwst" style="margin:-6px 0 12px">Type the new password twice. When both match, a button appears to email you a code.</div>' +
      '<button class="btn btn-ghost btn-sm" id="pwsend" hidden>Send verification email</button>' +
      '<div id="pwcode" hidden style="margin-top:18px;max-width:420px"><div class="field"><label for="pwc">Verification code from your email</label><input class="input" id="pwc" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="6-digit code"></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary btn-sm" id="pwok">Confirm and change password</button><button class="btn btn-ghost btn-sm" id="pwre" type="button" disabled>Resend code</button></div></div></div>' +
      '<div class="panel"><button class="btn btn-danger btn-sm" id="out">Log out</button></div>';

    $('#opt').onchange = async e => {
      const { error } = await sb.from('profiles').update({ email_opt_in: e.target.checked }).eq('id', uid);
      if (error) { e.target.checked = !e.target.checked; return UI.toast(error.message, 'error'); }
      UI.toast(e.target.checked ? 'You will receive announcements.' : 'Announcements turned off.', 'success');
    };
    $('#themeseg').onclick = e => { const b = e.target.closest('[data-th]'); if (!b) return; UI.setTheme(b.dataset.th); document.querySelectorAll('#themeseg button').forEach(x => x.classList.toggle('on', x === b)); };

    /* ---- Change password: two matching boxes → button appears → email code → confirm ---- */
    const pw = $('#pw'), pw2 = $('#pw2'), st = $('#pwst'), send = $('#pwsend'), box = $('#pwcode'), re = $('#pwre');
    const strong = v => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);
    const HINT = 'Type the new password twice. When both match, a button appears to email you a code.';
    let cool = 0, timer = null, sentFor = '';
    const check = () => {
      const a1 = pw.value, a2 = pw2.value, ok = strong(a1) && a1 === a2;
      if (!a1 && !a2) { st.style.color = ''; st.textContent = HINT; }
      else if (!strong(a1)) { st.style.color = 'var(--danger)'; st.textContent = 'Use 8+ characters with at least one letter and one number.'; }
      else if (a1 !== a2) { st.style.color = 'var(--danger)'; st.textContent = a2 ? 'The two passwords do not match.' : 'Now confirm the new password.'; }
      else { st.style.color = 'var(--success)'; st.textContent = '✓ Passwords match.'; }
      send.hidden = !ok || !box.hidden;                        // the button only exists while both boxes match (and no code is pending)
      if (!box.hidden && a1 !== sentFor) { box.hidden = true; send.hidden = !ok; }   // password changed after sending: start again
    };
    pw.oninput = check; pw2.oninput = check;
    const startCool = () => { cool = 60; clearInterval(timer); const tick = () => { re.disabled = cool > 0; re.textContent = cool > 0 ? 'Resend in ' + cool + 's' : 'Resend code'; if (cool-- <= 0) clearInterval(timer); }; tick(); timer = setInterval(tick, 1000); };
    const sendCode = async btn => {
      if (!strong(pw.value) || pw.value !== pw2.value) return UI.toast('The two passwords must match first.', 'warn');
      btn.disabled = true;
      const { error } = await sb.auth.reauthenticate();
      btn.disabled = false;
      if (error) return UI.toast(error.message || 'Could not send the email. Please try again.', 'error', 6000);
      sentFor = pw.value; box.hidden = false; send.hidden = true; startCool(); $('#pwc').focus();
      UI.toast('We emailed you a code. Check your inbox (and spam).', 'success', 6000);
    };
    send.onclick = () => sendCode(send);
    re.onclick = () => { if (cool <= 0) sendCode(re); };
    $('#pwok').onclick = async () => {
      const code = $('#pwc').value.trim();
      if (!code) return UI.toast('Enter the code from your email.', 'warn');
      if (pw.value !== pw2.value || !strong(pw.value)) return UI.toast('The two passwords must match.', 'warn');
      const btn = $('#pwok'); btn.disabled = true;
      const { error } = await sb.auth.updateUser({ password: pw.value, nonce: code });
      btn.disabled = false;
      if (error) return UI.toast(/nonce|reauth|invalid|expired/i.test(error.message) ? 'That code is wrong or expired. Request a new one.' : error.message, 'error', 6000);
      pw.value = pw2.value = ''; $('#pwc').value = ''; box.hidden = true; check();
      UI.toast('Password changed. 🎉', 'success', 6000);
    };
    $('#out').onclick = () => Auth.signOut();
  })();
})();
