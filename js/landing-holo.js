/* Fills the Holomatrix sections on the landing page */
(function () {
  'use strict';
  const R = HoloRender, set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  function render() {
    set('hm-intro', R.hero(true)); set('hm-what', R.whatCards()); set('hm-model', R.model(true));
    set('hm-mv', R.mv()); set('hm-future', R.future()); set('hm-faq', R.faqBlock());
    Site.applyAll(); UI.observe();
  }
  document.addEventListener('DOMContentLoaded', () => { render(); Site.ready.then(() => { Site.applyAll(); UI.observe(); }); });
})();
