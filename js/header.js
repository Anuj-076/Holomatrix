/* Shared top bar + footer. Menu items come from Admin → Website → Menu (or the defaults). */
(function () {
  'use strict';
  const host = document.getElementById('site-header');
  const C = HoloCommon, esc = UI.esc, safe = u => Site.safeUrl(u);
  const $ = (s, r = document) => r.querySelector(s);
  const CARET = '<svg viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l4 4 4-4"/></svg>';
  let access = null, lastType = 'mouse', navSig = '', inboxRes;
  const timers = new Map();
  window.HoloInboxReady = new Promise(r => { inboxRes = r; });

  if (!document.querySelector('link[href="/css/extras.css"]')) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/extras.css'; document.head.appendChild(l);
  }

  const seg = h => '/' + (String(h || '').split('#')[0].split('?')[0].split('/').filter(Boolean)[0] || '');
  const prem = p => p ? '<em class="prem">★ Premium</em>' : '';
  const socials = () => {
    const l = (Site.content && Site.content.links) || {};
    return [l['social.instagram'] || 'https://www.instagram.com/holomatrix_consulting/', l['social.linkedin'] || 'https://www.linkedin.com/company/holomatrixconsulting'];
  };
  const socHtml = () => socials().map(u => '<a href="' + esc(safe(u)) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(HoloIcons.label(HoloIcons.detect(u))) + '"><span class="ico">' + HoloIcons.svg(HoloIcons.detect(u)) + '</span></a>').join('');

  if (host) {
    const onTabs = location.pathname.replace(/\/$/, '') === '/tabs';
    host.innerHTML =
      '<header class="hdr" id="hdr"><div class="hdr-in">' +
      '<a href="/" class="hdr-brand" aria-label="Holomatrix home"><span class="img-slot logo-slot" data-img="brand.logo" data-alt="Holomatrix logo"><img src="/logo.jpg" alt="Holomatrix logo"></span><span data-t="brand.name">Holomatrix</span></a>' +
      '<nav class="hdr-nav" id="hdr-nav" aria-label="Main"></nav>' +
      '<div class="hdr-r"><div class="hdr-soc" id="hdr-soc"></div>' +
      '<button class="btn btn-ghost btn-icon" data-theme-toggle aria-label="Toggle theme">🌙</button><div id="hdr-pm"></div>' +
      '<a class="hdr-burger' + (onTabs ? ' x' : '') + '" id="hdr-burger" href="' + (onTabs ? '/' : '/tabs') + '" aria-label="' + (onTabs ? 'Close menu' : 'Open menu') + '"><span></span><span></span></a></div>' +
      '</div></header>';
    Site.applyAll();
  }

  function renderNav() {
    const nav = C.getNav().filter(i => i.visible !== false), sig = JSON.stringify(nav);
    if (sig === navSig) return; navSig = sig;
    $('#hdr-nav').innerHTML = nav.map((it, idx) => {
      const kids = (it.children || []).filter(c => c.visible !== false), right = idx >= nav.length - 2 ? ' r' : '';
      return '<div class="hn-item"><a class="hn-top' + (seg(it.href) === seg(location.pathname) && seg(it.href) !== '/' ? ' cur' : '') + '" href="' + esc(safe(it.href)) + '"' + (kids.length ? ' aria-haspopup="true" aria-expanded="false"' : '') + '><span>' + esc(it.label) + '</span>' + prem(it.premium) + (kids.length ? CARET : '') + '</a>' +
        (kids.length ? '<div class="hn-drop' + right + '"><div class="hn-card">' + kids.map(c => '<a href="' + esc(safe(c.href)) + '"><span>' + esc(c.label) + '</span>' + prem(c.premium) + '</a>').join('') + '</div></div>' : '') + '</div>';
    }).join('');
  }

  function renderProfile() {
    const box = $('#hdr-pm');
    if (!access) { box.innerHTML = '<a class="btn btn-primary btn-sm" href="/login"><span>Log in</span></a>'; return; }
    const u = access.user, md = u.user_metadata || {}, name = md.full_name || md.name || u.email || '', pic = md.avatar_url || md.picture;
    const av = pic && /^https:\/\//.test(pic) ? '<img src="' + esc(pic) + '" alt="" referrerpolicy="no-referrer">' : esc((name || '?').trim().charAt(0).toUpperCase());
    box.innerHTML = '<div class="pm"><button class="pm-btn" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">' + av + '</button>' +
      '<div class="pm-drop"><div class="hn-card"><div class="pm-name"><b>' + esc(name) + '</b><small>' + esc(u.email || '') + '</small></div>' +
      '<a href="/dashboard"><span>Dashboard</span></a><a href="/dashboard#settings"><span>Settings</span></a>' +
      (access.isStaff ? '<a href="/admin"><span>Admin dashboard</span></a>' : '') + '<button data-logout><span>Log out</span></button></div></div></div>';
  }

  function setOpen(it, on) { it.classList.toggle('open', on); const a = it.querySelector('[aria-haspopup]'); if (a) a.setAttribute('aria-expanded', on); }
  function openIt(it) { clearTimeout(timers.get(it)); closeAll(it); setOpen(it, true); }
  function closeAll(except) { document.querySelectorAll('.hn-item.open, .pm.open').forEach(x => { if (x !== except) setOpen(x, false); }); }

  if (host) {
    host.addEventListener('pointerdown', e => { lastType = e.pointerType || 'mouse'; });
    host.addEventListener('pointerover', e => { if (e.pointerType !== 'mouse') return; const it = e.target.closest('.hn-item, .pm'); if (it && it.querySelector('[aria-haspopup]')) openIt(it); });
    host.addEventListener('pointerout', e => { if (e.pointerType !== 'mouse') return; const it = e.target.closest('.hn-item, .pm'); if (it && !it.contains(e.relatedTarget)) timers.set(it, setTimeout(() => setOpen(it, false), 170)); });
    host.addEventListener('focusin', e => { const it = e.target.closest('.hn-item, .pm'); if (it && it.querySelector('[aria-haspopup]')) openIt(it); });
    host.addEventListener('click', e => {
      const top = e.target.closest('.hn-top[aria-haspopup]');
      if (top && lastType !== 'mouse') { e.preventDefault(); const it = top.parentElement; if (it.classList.contains('open')) setOpen(it, false); else openIt(it); return; }
      const pb = e.target.closest('.pm-btn');
      if (pb) { const it = pb.parentElement; if (it.classList.contains('open') && lastType !== 'mouse') setOpen(it, false); else openIt(it); }
    });
    document.addEventListener('click', e => { if (!host.contains(e.target)) closeAll(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
    document.addEventListener('click', e => { if (e.target.closest('[data-logout]')) Auth.signOut(); });

    const onScroll = () => $('#hdr').classList.toggle('scrolled', scrollY > 20);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    $('#hdr-soc').innerHTML = socHtml();
    renderNav(); renderProfile();
    Site.ready.then(() => { navSig = ''; $('#hdr-soc').innerHTML = socHtml(); renderNav(); });
    Site.accessReady.then(a => {
      access = a; renderProfile();
      document.querySelectorAll('[data-guest]').forEach(el => { el.hidden = !!a; });
      document.querySelectorAll('[data-user]').forEach(el => { el.hidden = !a; });
      document.querySelectorAll('[data-editor]').forEach(el => { el.hidden = !(a && a.can('edit_site_content')); });
      if (a) {
        const s = document.createElement('script'); s.src = '/js/inbox.js';
        s.onload = () => inboxRes(window.HoloInbox || null); s.onerror = () => inboxRes(null);
        document.body.appendChild(s);
      } else inboxRes(null);
    });
  }

  const foot = document.getElementById('site-footer');
  if (foot) {
    foot.innerHTML = '<footer class="sf"><div class="wide"><div class="sf-row"><span>© ' + new Date().getFullYear() + ' <span data-t="brand.name">Holomatrix</span></span>' +
      '<div class="sf-links"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a></div><div class="sf-soc">' + socHtml() + '</div></div></div></footer>';
    Site.applyAll();
  }
})();
