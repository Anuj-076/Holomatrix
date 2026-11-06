/* Holomatrix boot: runs before first paint */
(function () {
  var d = document.documentElement;
  d.classList.add('js');

  /* Never let the page be zoomed out or pushed sideways on phones */
  try {
    var vp = document.querySelector('meta[name="viewport"]');
    if (vp) vp.setAttribute('content', 'width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover');
    var fx = document.createElement('style');
    fx.textContent = 'html,body{max-width:100%;overflow-x:hidden}html,body{overflow-x:clip}';
    document.head.appendChild(fx);
  } catch (e) {}

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

  /* ---- Intro (home page, once per session) or curtain (everything else) ---- */
  try {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coming = sessionStorage.getItem('holo-vt');
    var seen = sessionStorage.getItem('holo-seen');
    var introDone = sessionStorage.getItem('holo-intro');
    var onHome = /^\/(landing\/?)?$/.test(location.pathname);
    if (!reduce && onHome && !introDone && !coming) {
      d.classList.add('intro-on');
      setTimeout(function () { d.classList.remove('intro-on'); }, 30000);
    } else if (!reduce && (coming || !seen)) {
      d.classList.add('vt-in');
      setTimeout(function () { d.classList.remove('vt-in'); }, 4500);
    }
    sessionStorage.removeItem('holo-vt');
  } catch (e) {}
})();
