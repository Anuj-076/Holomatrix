/* Holomatrix boot: runs before first paint */
(function () {
  var d = document.documentElement;
  d.classList.add('js');

  /* ---- Theme (system by default, user can override) ---- */
  var KEY = 'holo-theme';
  var mq = window.matchMedia('(prefers-color-scheme: light)');
  function pref() { try { return localStorage.getItem(KEY) || 'system'; } catch (e) { return 'system'; } }
  function resolve(p) { p = p || pref(); return p === 'system' ? (mq.matches ? 'light' : 'dark') : p; }
  d.setAttribute('data-theme', resolve());
  function onChange() { if (pref() === 'system') d.setAttribute('data-theme', resolve()); }
  if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);

  window.HoloTheme = {
    pref: pref,
    resolve: resolve,
    set: function (p) {
      try { localStorage.setItem(KEY, p); } catch (e) {}
      d.setAttribute('data-theme', resolve(p));
    }
  };

  /* ---- Cached admin theme overrides (colours + fonts) ---- */
  try {
    var css = localStorage.getItem('holo-theme-css');
    if (css) {
      var s = document.createElement('style');
      s.id = 'holo-theme';
      s.textContent = css;
      document.head.appendChild(s);
    }
    var fonts = JSON.parse(localStorage.getItem('holo-theme-fonts') || '[]');
    fonts.forEach(function (h) {
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = h; l.setAttribute('data-holo-font', '');
      document.head.appendChild(l);
    });
  } catch (e) {}

  /* ---- Page-transition curtain: show it immediately when arriving ---- */
  try {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coming = sessionStorage.getItem('holo-vt');
    var seen = sessionStorage.getItem('holo-seen');
    if (!reduce && (coming || !seen)) {
      d.classList.add('vt-in');
      setTimeout(function () { d.classList.remove('vt-in'); }, 4500); // safety net
    }
    sessionStorage.removeItem('holo-vt');
  } catch (e) {}
})();
