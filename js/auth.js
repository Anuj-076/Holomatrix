/* Login / signup / forgot / reset logic (Supabase Auth) */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const params = new URLSearchParams(location.search);

  if (!window.sb) { UI.toast('Could not reach the login service. Please refresh.', 'error', 8000); return; }

  const next = (function () {
    const n = params.get('next') || '/';
    return (n.charAt(0) === '/' && n.charAt(1) !== '/' && n.indexOf('\\') < 0) ? n : '/';
  })();

  let mode = 'login';
  let recovery = params.get('mode') === 'reset';
  let leaving = false;
  let sentKind = 'verify', sentEmail = '', cooldown = 0, cdTimer = null;

  const redirectBase = location.origin + '/login' + (next !== '/' ? '?next=' + encodeURIComponent(next) : '');

  /* ---------- Helpers ---------- */
  const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const pwdScore = p => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p) || p.length >= 14) s++;
    return s;
  };
  const pwdOk = p => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

  function busy(btn, on) {
    btn.classList.toggle('loading', on);
    btn.disabled = on;
  }

  function friendly(err) {
    const m = (err && err.message || '').toLowerCase();
    if (m.includes('invalid login')) return 'Wrong email or password.';
    if (m.includes('not confirmed')) return 'Please confirm your email first. Check your inbox.';
    if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Please wait a moment and try again.';
    if (m.includes('same password') || m.includes('different from the old')) return 'Choose a password different from your old one.';
    if (m.includes('weak') || m.includes('password should')) return 'That password is too weak. Use 8+ characters with letters and numbers.';
    if (m.includes('network') || m.includes('fetch')) return 'Network problem. Check your connection and try again.';
    return (err && err.message) || 'Something went wrong. Please try again.';
  }

  /* ---------- Modes ---------- */
  function setMode(m) {
    mode = m;
    $$('.pane').forEach(p => {
      const on = p.dataset.pane === m;
      p.hidden = !on;
      if (on) { p.classList.remove('pane-in'); void p.offsetWidth; p.classList.add('pane-in'); }
    });
    const tabs = $('#tabs');
    const isTab = m === 'login' || m === 'signup';
    tabs.hidden = !isTab;
    if (isTab) {
      tabs.dataset.active = m;
      $$('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    }
    const q = new URLSearchParams();
    if (next !== '/') q.set('next', next);
    if (m === 'forgot' || m === 'reset') q.set('mode', m);
    try { history.replaceState(null, '', (m === 'signup' ? '/signup' : '/login') + (q.toString() ? '?' + q : '')); } catch (e) {}
    const f = $('.pane[data-pane="' + m + '"] input:not(.hp)');
    if (f && !matchMedia('(pointer: coarse)').matches) setTimeout(() => f.focus(), 400);
  }

  $$('[data-go]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); setMode(el.dataset.go); }));
  $$('#tabs button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

  /* show / hide password */
  $$('[data-eye]').forEach(b => b.addEventListener('click', () => {
    const i = document.getElementById(b.dataset.eye);
    const show = i.type === 'password';
    i.type = show ? 'text' : 'password';
    b.textContent = show ? 'Hide' : 'Show';
  }));

  /* strength meters */
  [['s-pass', 'meter-s'], ['r-pass', 'meter-r']].forEach(([i, m]) => {
    document.getElementById(i).addEventListener('input', e => { document.getElementById(m).dataset.score = pwdScore(e.target.value); });
  });

  /* ---------- After a successful login ---------- */
  async function afterLogin(session) {
    if (leaving) return;
    leaving = true;
    try {
      const { data } = await sb.from('profiles').select('is_banned').eq('id', session.user.id).maybeSingle();
      if (data && data.is_banned) {
        await sb.auth.signOut();
        leaving = false;
        UI.alert('Account suspended', 'This account has been suspended.');
        return;
      }
    } catch (e) { /* continue */ }
    UI.toast('Welcome!', 'success');
    setTimeout(() => UI.go(next), 500);
  }

  /* ---------- Email + password: login ---------- */
  $('#f-login').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#l-email').value.trim().toLowerCase(), pass = $('#l-pass').value;
    if (!validEmail(email)) return UI.toast('Enter a valid email address.', 'warn');
    if (!pass) return UI.toast('Enter your password.', 'warn');
    const btn = e.submitter || $('#f-login button[type="submit"]');
    busy(btn, true);
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    busy(btn, false);
    if (error) {
      if ((error.message || '').toLowerCase().includes('not confirmed')) {
        sentKind = 'verify'; sentEmail = email; showSent();
        UI.toast('Please confirm your email first.', 'warn');
        return;
      }
      return UI.toast(friendly(error), 'error');
    }
    afterLogin(data.session);
  });

  /* ---------- Email + password: signup ---------- */
  $('#f-signup').addEventListener('submit', async e => {
    e.preventDefault();
    if ($('#s-hp').value) return; // bot trap
    const name = $('#s-name').value.trim(), email = $('#s-email').value.trim().toLowerCase();
    const p1 = $('#s-pass').value, p2 = $('#s-pass2').value;
    if (name.length < 2) return UI.toast('Please enter your name.', 'warn');
    if (!validEmail(email)) return UI.toast('Enter a valid email address.', 'warn');
    if (!pwdOk(p1)) return UI.toast('Password needs 8+ characters with at least one letter and one number.', 'warn', 5500);
    if (p1 !== p2) return UI.toast('Passwords do not match.', 'warn');
    if (!$('#s-terms').checked) return UI.toast('Please accept the Terms and Privacy Policy.', 'warn');

    const btn = e.submitter || $('#f-signup button[type="submit"]');
    busy(btn, true);
    const { data, error } = await sb.auth.signUp({
      email, password: p1,
      options: { data: { full_name: name }, emailRedirectTo: redirectBase }
    });
    busy(btn, false);
    if (error) return UI.toast(friendly(error), 'error');
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      UI.toast('An account with this email already exists. Try logging in.', 'warn', 6000);
      return setMode('login');
    }
    if (data.session) return afterLogin(data.session); // if email confirmation is switched off
    sentKind = 'verify'; sentEmail = email; showSent();
  });

  /* ---------- Forgot password ---------- */
  $('#f-forgot').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#fg-email').value.trim().toLowerCase();
    if (!validEmail(email)) return UI.toast('Enter a valid email address.', 'warn');
    const btn = e.submitter || $('#f-forgot button[type="submit"]');
    busy(btn, true);
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/login?mode=reset' });
    busy(btn, false);
    if (error && /rate|too many/i.test(error.message)) return UI.toast(friendly(error), 'error');
    sentKind = 'reset'; sentEmail = email; showSent();
  });

  /* ---------- Reset password (arrives from the email link) ---------- */
  $('#f-reset').addEventListener('submit', async e => {
    e.preventDefault();
    const p1 = $('#r-pass').value, p2 = $('#r-pass2').value;
    if (!pwdOk(p1)) return UI.toast('Password needs 8+ characters with at least one letter and one number.', 'warn', 5500);
    if (p1 !== p2) return UI.toast('Passwords do not match.', 'warn');
    const s = await Auth.session();
    if (!s) return UI.alert('Link expired', 'This reset link is no longer valid. Please request a new one.').then(() => setMode('forgot'));
    const btn = e.submitter || $('#f-reset button[type="submit"]');
    busy(btn, true);
    const { error } = await sb.auth.updateUser({ password: p1 });
    busy(btn, false);
    if (error) return UI.toast(friendly(error), 'error');
    UI.toast('Password updated!', 'success');
    recovery = false;
    afterLogin(s);
  });

  /* ---------- "Check your email" pane + resend ---------- */
  function showSent() {
    const t = $('#sent-text');
    t.textContent = sentKind === 'verify'
      ? 'We sent a confirmation link to ' + sentEmail + '. Click it to activate your account. Check your spam folder too.'
      : 'If an account exists for ' + sentEmail + ', a password reset link is on its way. Check your spam folder too.';
    setMode('sent');
    startCooldown(60);
  }
  function startCooldown(sec) {
    const b = $('#resend-btn');
    cooldown = sec; clearInterval(cdTimer);
    const tick = () => {
      b.disabled = cooldown > 0;
      b.textContent = cooldown > 0 ? 'Resend in ' + cooldown + 's' : 'Resend email';
      if (cooldown-- <= 0) clearInterval(cdTimer);
    };
    tick(); cdTimer = setInterval(tick, 1000);
  }
  $('#resend-btn').addEventListener('click', async () => {
    if (cooldown > 0 || !sentEmail) return;
    const { error } = sentKind === 'verify'
      ? await sb.auth.resend({ type: 'signup', email: sentEmail, options: { emailRedirectTo: redirectBase } })
      : await sb.auth.resetPasswordForEmail(sentEmail, { redirectTo: location.origin + '/login?mode=reset' });
    if (error) return UI.toast(friendly(error), 'error');
    UI.toast('Email sent again.', 'success');
    startCooldown(60);
  });

  /* ---------- Google / LinkedIn ---------- */
  $$('[data-oauth]').forEach(b => b.addEventListener('click', async () => {
    busy(b, true);
    const { error } = await sb.auth.signInWithOAuth({ provider: b.dataset.oauth, options: { redirectTo: redirectBase } });
    if (error) { busy(b, false); UI.toast(friendly(error), 'error'); }
  }));

  /* ---------- Auth events ---------- */
  sb.auth.onAuthStateChange((ev, session) => {
    if (ev === 'PASSWORD_RECOVERY') { recovery = true; setMode('reset'); }
    else if (ev === 'SIGNED_IN' && session && !recovery) afterLogin(session);
  });

  /* ---------- Start ---------- */
  (async function init() {
    // errors coming back from Google / LinkedIn / email links
    const h = new URLSearchParams(location.hash.replace(/^#/, ''));
    const errMsg = params.get('error_description') || h.get('error_description');
    if (errMsg) setTimeout(() => UI.toast(errMsg, 'error', 8000), 900);

    const start = location.pathname.indexOf('/signup') === 0 ? 'signup' : (params.get('mode') === 'forgot' ? 'forgot' : 'login');
    setMode(params.get('mode') === 'reset' ? 'reset' : start);

    const s = await Auth.session();
    if (s && !recovery) afterLogin(s);
    if (params.get('mode') === 'reset' && !s) {
      setTimeout(() => UI.toast('This reset link is invalid or expired. Request a new one.', 'warn', 7000), 900);
      setMode('forgot');
    }
  })();
})();
