/* Intro fix: size the intro to the real screen, show /landing in the address bar,
   and run the end-of-intro slide with correct timing (the last strip now fully covers before the reveal). */
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

  if (window.UI) {
    UI.playReveal = function () {
      try { sessionStorage.setItem('holo-intro', '1'); } catch (e) {}
      toLanding();
      d.classList.add('vt-cover');                       // strips rise over the white screen
      setTimeout(function () {                           // wait until the LAST strip has fully covered
        d.classList.remove('intro-on');
        requestAnimationFrame(function () {
          d.classList.add('vt-out'); d.classList.remove('vt-cover');   // strips lift away, page revealed
          setTimeout(function () {
            if (window.__holoReady) return;
            window.__holoReady = true; document.body.classList.add('is-ready'); document.dispatchEvent(new Event('holo:ready'));
          }, 450);
          setTimeout(function () { d.classList.remove('vt-out'); }, 1250);
        });
      }, 1150);
    };
  }
  if (!d.classList.contains('intro-on')) toLanding();
})();
