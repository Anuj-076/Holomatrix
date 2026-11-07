/* One request: /clients/find-a-client/<13-digit UID> (people with "Find clients", or the owner) */
(function () {
  'use strict';
  const C = HoloCommon, box = document.getElementById('cp');
  const uid = location.pathname.split('/').filter(Boolean)[2] || '';
  (async function () {
    const me = await Auth.access();
    if (!me) { box.innerHTML = '<div class="box cl-gate"><h3>Log in required</h3><p>Log in to continue.</p><div class="row"><a class="btn btn-primary btn-sm" href="/login?next=' + encodeURIComponent(location.pathname) + '">Log in</a></div></div>'; return; }
    if (!/^\d{13}$/.test(uid)) { box.innerHTML = '<div class="empty">Request not found.</div>'; return; }
    const { data } = await sb.from('client_profiles').select('*').eq('uid', uid).maybeSingle();
    if (!data) { box.innerHTML = '<div class="empty">This request doesn\'t exist, is closed, or you don\'t have access to it.</div>'; return; }
    box.innerHTML = C.clientCard(data, me.user.id, true);
    box.addEventListener('click', async e => {
      const b = e.target.closest('[data-chat]'); if (!b) return;
      const ib = await window.HoloInboxReady;
      if (!ib) return UI.toast('Please log in to chat.', 'warn');
      ib.startWith(b.dataset.chat);
    });
  })();
})();
