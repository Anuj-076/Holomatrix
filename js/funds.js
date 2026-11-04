/* Funds: Subscribe (Pack 1..5) and Donate. Payments are connected later. */
(function () {
  'use strict';
  const C = HoloCommon, esc = UI.esc;
  const sec = { subscribe: document.getElementById('subscribe'), donate: document.getElementById('donate') };
  let loaded = false;

  const soon = () => UI.alert('Payments are coming soon', 'Online payment is being connected. Until then, message us from the Contact us page and we will help you.');

  async function loadPlans() {
    const [{ data: plans }, a] = await Promise.all([sb.from('plans').select('*').eq('active', true).order('slot'), Auth.access()]);
    let curId = null;
    if (a) {
      const { data: subs } = await sb.from('subscriptions').select('plan_id,expires_at,plans(name)').eq('user_id', a.user.id).eq('status', 'active').order('expires_at', { ascending: false, nullsFirst: true }).limit(5);
      const s = (subs || []).find(x => !x.expires_at || new Date(x.expires_at) > new Date());
      if (s) { curId = s.plan_id; document.getElementById('cur').innerHTML = '<div class="warn-box" style="border-color:var(--success);background:color-mix(in srgb,var(--success) 9%,transparent)"><b style="color:var(--success)">✓ Active:</b> ' + esc((s.plans && s.plans.name) || 'Subscription') + (s.expires_at ? ' until ' + C.date(s.expires_at) : '') + '</div>'; }
    }
    document.getElementById('plans').innerHTML = (plans || []).map(p =>
      '<article class="plan reveal' + (p.id === curId ? ' cur' : '') + '"><h3>' + esc(p.name) + '</h3>' +
      '<div class="price">' + (p.price_text ? esc(p.price_text) : '<small>Price coming soon</small>') + (p.price_text && p.period_text ? ' <small>/ ' + esc(p.period_text) + '</small>' : '') + '</div>' +
      (p.description ? '<p class="d">' + esc(p.description) + '</p>' : '') +
      ((p.features || []).length ? '<ul>' + p.features.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul>' : '<ul></ul>') +
      '<button class="btn ' + (p.id === curId ? 'btn-ghost' : 'btn-primary') + ' btn-sm" data-pay="plan">' + (p.id === curId ? 'Your current pack' : 'Choose ' + esc(p.name)) + '</button></article>').join('') || '<div class="empty">Packs will appear here soon.</div>';
    UI.observe(document.getElementById('plans'));
  }

  document.addEventListener('click', e => { if (e.target.closest('[data-pay]') && !document.body.classList.contains('editing')) soon(); });

  C.tabs({
    el: document.getElementById('tabs'), items: [['subscribe', 'Subscribe'], ['donate', 'Donate']],
    onChange: id => { Object.keys(sec).forEach(k => { sec[k].hidden = k !== id; }); if (id === 'subscribe' && !loaded) { loaded = true; loadPlans(); } }
  });
})();
