/* Mobile / narrow-screen menu page (/tabs). Wide screens go back to the home page. */
(function () {
  'use strict';
  if (innerWidth > 1100) { location.replace('/'); return; }
  const C = HoloCommon, esc = UI.esc, safe = u => Site.safeUrl(u);
  const list = document.getElementById('tabs-list'), acc = document.getElementById('tabs-acc');
  let access = null;
  const shown = c => c.visible !== false && (!c.perm || (access && access.can(c.perm)));

  function draw() {
    list.innerHTML = C.getNav().filter(shown).map((it, i) => {
      const kids = (it.children || []).filter(shown);
      return '<section class="tb reveal" style="--d:' + i * 50 + 'ms"><a class="tb-main" href="' + esc(safe(it.href)) + '"><span>' + esc(it.label) + '</span><i>→</i></a>' +
        (it.premium ? '<div class="hint" style="padding:0 20px 6px;color:var(--accent);font-weight:700;letter-spacing:.06em">★ PREMIUM FEATURES</div>' : '') +
        (kids.length ? '<div class="tb-sub">' + kids.map(c => '<a href="' + esc(safe(c.href)) + '"><span>' + esc(c.label) + '</span></a>').join('') + '</div>' : '') + '</section>';
    }).join('');
    UI.observe(list);
  }
  draw(); Site.ready.then(draw);
  Site.accessReady.then(a => {
    access = a; draw();
    acc.innerHTML = a
      ? '<a class="btn btn-ghost" href="/dashboard">Dashboard</a>' + (a.isStaff ? '<a class="btn btn-ghost" href="/admin">Admin dashboard</a>' : '') + '<button class="btn btn-danger" data-logout>Log out</button>'
      : '<a class="btn btn-primary" href="/login">Log in</a><a class="btn btn-ghost" href="/signup">Sign up</a>';
  });
})();
