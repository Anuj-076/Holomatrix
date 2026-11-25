/* Contribute: Donate only for now (packs removed). Payments are connected later. */
(function () {
  'use strict';
  const C = HoloCommon, tabs = document.getElementById('tabs'), donate = document.getElementById('donate');

  const soon = () => UI.alert('Donations are coming soon', 'Online donation is being connected. Until then, message us from the Contact us page and we will help you.');
  document.addEventListener('click', e => { if (e.target.closest('[data-pay]') && !document.body.classList.contains('editing')) soon(); });

  /* one page only: /contribute/subscribe and /funds/... open /contribute/donate */
  C.tabs({ el: tabs, items: [['donate', 'Donate']], onChange: () => { donate.hidden = false; } });
  tabs.hidden = true;
})();
