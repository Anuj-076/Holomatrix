/* Shared top bar + footer. Menu items come from Admin → Website → Menu (or the defaults). */
(function () {
  'use strict';
  const host = document.getElementById('site-header');
  const C = HoloCommon, esc = UI.esc, safe = u => Site.safeUrl(u);
  const $ = (s, r = document) => r.querySelector(s);
  const CARET = '<svg viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l4 4 4-4"/></svg>';
  let access = null, lastType = 'mouse', navSig = '';
  const timers = new Map();

  const getNav = () => { const n = Site.content && Site.content.nav; return Array.isArray(n) && n.length ? n : C.DEFAULT_NAV; };
  const socials = () => {
    const l = (Site.content && Site.content.links) || {};
    return [l['social.instagram'] || 'https://www.instagram.com/holomatrix_consulting/', l['social.linkedin'] || 'https://www.linkedin.com/company/holomatrixconsulting'];
  };
  const prem = p => p ? '<em class="prem">★ Premium</em>' : '';
  const path = h => String(h || '').split('#')[0].split('?')[0];
  const socHtml = () => socials().map(u => '<a href="' + esc(safe(u)) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(HoloIcons.label(HoloIcons.detect(u))) + '"><span class="ico">' + HoloIcons.svg(HoloIcons.detect(u)) + '</span></a>').join('');

  /* ---------- Build the static shell once ---------- */
  if (host) {
    host.innerHTML =
      '<header class="hdr" id="hdr"><div class="hdr-in">' +
      '<a href="/" class="hdr-brand" aria-label="Holomatrix home"><span class="img-slot logo-slot" data-img="brand.logo" data-alt="Holomatrix logo"><img src="/logo.jpg" alt="Holomatrix logo"></span><span data-t="brand.name">Holomatrix</span></a>' +
      '<nav class="hdr-nav" id="hdr-nav" aria-label="Main"></nav>' +
      '<div class="hdr-r"><div class="hdr-soc" id="hdr-soc"></div>' +
      '<button class="btn btn-ghost btn-icon" data-theme-toggle aria-label="Toggle theme">🌙</button>' +
      '<div id="hdr-pm"></div>' +
      '<button class="hdr-burger" id="hdr-burger" aria-label="Menu" aria-expanded="false"><span></span><span></span></button></div>' +
      '</div><div class="hdr-m" id="hdr-m"></div></header>';
    Site.applyAll();
  }

  /* ---------- Renderers ---------- */
  function renderNav() {
    const nav = getNav().filter(i => i.visible !== false);
    const sig = JSON.stringify(nav);
    if (sig === navSig) return; navSig = sig;
    $('#hdr-nav').innerHTML = nav.map((it, idx) => {
      const kids = (it.children || []).filter(c => c.visible !== false);
      const right = idx >= nav.length - 2 ? ' r' : '';
      return '<div class="hn-item"><a class="hn-top' + (path(it.href) === location.pathname ? ' cur' : '') + '" href="' + esc(safe(it.href)) + '"' + (kids.length ? ' aria-haspopup="true" aria-expanded="false"' : '') + '><span>' + esc(it.label) + '</span>' + prem(it.premium) + (kids.length ? CARET : '') + '</a>' +
        (kids.length ? '<div class="hn-drop' + right + '"><div class="hn-card">' + kids.map(c => '<a href="' + esc(safe(c.href)) + '"><span>' + esc(c.label) + '</span>' + prem(c.premium) + '</a>').join('') + '</div></div>' : '') + '</div>';
    }).join('');
    renderMobile(nav);
  }

  function renderMobile(nav) {
    const m = $('#hdr-m');
    let h = nav.map(it => {
      const kids = (it.children || []).filter(c => c.visible !== false);
      if (!kids.length) return '<div class="hm-grp"><a class="hm-link" href="' + esc(safe(it.href)) + '"><span>' + esc(it.label) + '</span>' + prem(it.premium) + '</a></div>';
      return '<div class="hm-grp"><button class="hm-btn" aria-expanded="false"><span>' + esc(it.label) + ' ' + prem(it.premium) + '</span>' + CARET + '</button><div class="hm-sub">' +
        kids.map(c => '<a href="' + esc(safe(c.href)) + '"><span>' + esc(c.label) + '</span>' + prem(c.premium) + '</a>').join('') + '</div></div>';
    }).join('');
    if (access) {
      h += '<div class="hm-grp"><a class="hm-link" href="/dashboard">Dashboard</a></div><div class="hm-grp"><a class="hm-link" href="/dashboard#settings">Settings</a></div>' +
        (access.isStaff ? '<div class="hm-grp"><a class="hm-link" href="/admin">Admin dashboard</a></div>' : '') +
        '<div class="hm-grp"><button class="hm-link" data-logout>Log out</button></div>';
    } else h += '<div class="hm-grp"><a class="hm-link" href="/login">Log in</a></div><div class="hm-grp"><a class="hm-link" href="/signup">Sign up</a></div>';
    m.innerHTML = h + '<div class="hm-soc">' + socHtml().replace(/<a /g, '<a class="hdr-soc-a" ') + '</div>';
  }

  function renderProfile() {
    const box = $('#hdr-pm');
    if (!access) { box.innerHTML = '<a class="btn btn-primary btn-sm" href="/login"><span>Log in</span></a>'; return; }
    const u = access.user, md = u.user_metadata || {}, name = md.full_name || md.name || u.email || '';
    const pic = md.avatar_url || md.picture;
    const av = pic && /^https:\/\//.test(pic) ? '<img src="' + esc(pic) + '" alt="" referrerpolicy="no-referrer">' : esc((name || '?').trim().charAt(0).toUpperCase());
    box.innerHTML = '<div class="pm"><button class="pm-btn" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">' + av + '</button>' +
      '<div class="pm-drop"><div class="hn-card"><div class="pm-name"><b>' + esc(name) + '</b><small>' + esc(u.email || '') + '</small></div>' +
      '<a href="/dashboard"><span>Dashboard</span></a><a href="/dashboard#settings"><span>Settings</span></a>' +
      (access.isStaff ? '<a href="/admin"><span>Admin dashboard</span></a>' : '') +
      '<button data-logout><span>Log out</span></button></div></div></div>';
  }

  /* ---------- Open / close ---------- */
  function setOpen(it, on) {
    it.classList.toggle('open', on);
    const a = it.querySelector('[aria-haspopup]'); if (a) a.setAttribute('aria-expanded', on);
  }
  function openIt(it) { clearTimeout(timers.get(it)); closeAll(it); setOpen(it, true); }
  function closeAll(except) { document.querySelectorAll('.hn-item.open, .pm.open').forEach(x => { if (x !== except) setOpen(x, false); }); }

  if (host) {
    host.addEventListener('pointerdown', e => { lastType = e.pointerType || 'mouse'; });
    host.addEventListener('pointerover', e => {
      if (e.pointerType !== 'mouse') return;
      const it = e.target.closest('.hn-item, .pm'); if (it && it.querySelector('[aria-haspopup]')) openIt(it);
    });
    host.addEventListener('pointerout', e => {
      if (e.pointerType !== 'mouse') return;
      const it = e.target.closest('.hn-item, .pm');
      if (it && !it.contains(e.relatedTarget)) timers.set(it, setTimeout(() => setOpen(it, false), 170));
    });
    host.addEventListener('focusin', e => { const it = e.target.closest('.hn-item, .pm'); if (it && it.querySelector('[aria-haspopup]')) openIt(it); });
    host.addEventListener('click', e => {
      const top = e.target.closest('.hn-top[aria-haspopup]');
      if (top && lastType !== 'mouse') { e.preventDefault(); const it = top.parentElement; if (it.classList.contains('open')) setOpen(it, false); else openIt(it); return; }
      const pb = e.target.closest('.pm-btn');
      if (pb) { const it = pb.parentElement; if (it.classList.contains('open') && lastType !== 'mouse') setOpen(it, false); else openIt(it); return; }
      const mb = e.target.closest('.hm-btn');
      if (mb) { const g = mb.parentElement, o = !g.classList.contains('open'); g.classList.toggle('open', o); mb.setAttribute('aria-expanded', o); return; }
      if (e.target.closest('#hdr-burger')) {
        const h = $('#hdr'), o = !h.classList.contains('m-open');
        h.classList.toggle('m-open', o); document.body.classList.toggle('no-scroll', o); $('#hdr-burger').setAttribute('aria-expanded', o); return;
      }
      if (e.target.closest('.hdr-m a')) { $('#hdr').classList.remove('m-open'); document.body.classList.remove('no-scroll'); }
    });
    document.addEventListener('click', e => { if (!host.contains(e.target)) closeAll(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAll(); $('#hdr').classList.remove('m-open'); document.body.classList.remove('no-scroll'); } });
    document.addEventListener('click', e => { if (e.target.closest('[data-logout]')) Auth.signOut(); });

    const onScroll = () => $('#hdr').classList.toggle('scrolled', scrollY > 20);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    $('#hdr-soc').innerHTML = socHtml();
    renderNav(); renderProfile();
    Site.ready.then(() => { navSig = ''; $('#hdr-soc').innerHTML = socHtml(); renderNav(); });
    Site.accessReady.then(a => {
      access = a; navSig = ''; renderNav(); renderProfile();
      if (a) {
        document.querySelectorAll('[data-guest]').forEach(el => { el.hidden = true; });
        document.querySelectorAll('[data-user]').forEach(el => { el.hidden = false; });
      }
    });
  }

  /* ---------- Footer for inner pages ---------- */
  const foot = document.getElementById('site-footer');
  if (foot) {
    foot.innerHTML = '<footer class="sf"><div class="wide"><div class="sf-row"><span>© ' + new Date().getFullYear() + ' <span data-t="brand.name">Holomatrix</span></span>' +
      '<div class="sf-links"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a></div><div class="sf-soc">' + socHtml() + '</div></div></div></footer>';
    Site.applyAll();
  }
})();
