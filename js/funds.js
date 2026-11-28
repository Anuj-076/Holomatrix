/* Contribute: Donate only (packs removed). The three payment buttons open links you paste with Edit site → Design → Links on this page. */
(function () {
  'use strict';
  const C = HoloCommon, tabs = document.getElementById('tabs'), donate = document.getElementById('donate');

  const soon = () => UI.alert('Donations are coming soon', 'This way of donating is being connected. Until then, message us from the Contact us page and we will help you.');
  /* a button with no link yet shows the message (capture phase, so the page does not jump to the top) */
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[data-pay]');
    if (!a || document.body.classList.contains('editing')) return;
    if ((a.getAttribute('href') || '#') === '#') { e.preventDefault(); e.stopPropagation(); soon(); }
  }, true);

  /* one page only: /contribute/subscribe and /funds/... open /contribute/donate */
  C.tabs({ el: tabs, items: [['donate', 'Donate']], onChange: () => { donate.hidden = false; } });
  tabs.hidden = true;
})();
