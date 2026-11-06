/* Intro fix: size the intro to the real screen, and show /landing in the address bar */
(function () {
  'use strict';
  var d = document.documentElement, el = document.getElementById('intro');
  var vw = function () { return Math.round(window.visualViewport ? visualViewport.width : innerWidth); };
  var vh = function () { return Math.round(window.visualViewport ? visualViewport.height : innerHeight); };

  if (el) {
    Object.defineProperty(el, 'clientWidth', { get: vw, configurable: true });
    Object.defineProperty(el, 'clientHeight', { get: vh, configurable: true });
    var size = function () { el.style.width = vw() + 'px'; el.style.height = vh() + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto'; };
    size(); addEventListener('resize', size);
    if (window.visualViewport) visualViewport.addEventListener('resize', size);
  }

  var toLanding = function () {
    if (location.pathname.replace(/\/$/, '') === '') { try { history.replaceState(null, '', '/landing' + location.search + location.hash); } catch (e) {} }
  };
  if (window.UI && UI.playReveal) { var orig = UI.playReveal; UI.playReveal = function () { toLanding(); return orig.apply(this, arguments); }; }
  if (!d.classList.contains('intro-on')) toLanding();
})();
