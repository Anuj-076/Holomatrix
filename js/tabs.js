/* Mobile / narrow-screen menu page (/tabs). Wide screens go back to the home page. */
(function () {
  'use strict';
  if (innerWidth > 1100) { location.replace('/'); return; }
  const C = HoloCommon, esc = UI.esc, safe = u => Site.safeUrl(u);
  const list = document.getElementById('tabs-list'), acc = document.getElementById('tabs-acc');
  const prem = p => p ? '<em class="prem">★ Premium</em>' : '';

  function draw() {
    list.innerHTML = C.getNav().filter(i => i.visible !== false).map((it, i) => {
      const kids = (it.children || []).filter(c => c.visible !== false);
      return '<section class="tb reveal" style="--d:' + i * 50 + 'ms"><a class="tb-main" href="' + esc(safe(it.href)) + '"><span>' + esc(it.label) + ' ' + prem(it.premium) + '</span><i>→</i></a>' +
        (kids.length ? '<div class="tb-sub">' + kids.map(c => '<a href="' + esc(safe(c.href)) + '"><span>' + esc(c.label) + '</span>' + prem(c.premium) + '</a>').join('') + '</div>' : '') + '</section>';
    }).join('');
    UI.observe(list);
  }
  draw();
  Site.ready.then(draw);
  Site.accessReady.then(a => {
    acc.innerHTML = a
      ? '<a class="btn btn-ghost" href="/dashboard">Dashboard</a><a class="btn btn-ghost" href="/dashboard#settings">Settings</a>' + (a.isStaff ? '<a class="btn btn-ghost" href="/admin">Admin dashboard</a>' : '') + '<button class="btn btn-danger" data-logout>Log out</button>'
      : '<a class="btn btn-primary" href="/login">Log in</a><a class="btn btn-ghost" href="/signup">Sign up</a>';
  });
})();
