/* Admin-only "Test AI providers" button on /contact/ai-support */
(function () {
  'use strict';
  const btn = document.getElementById('aitest'), out = document.getElementById('aitest-out');
  if (!btn) return;
  btn.onclick = async () => {
    btn.disabled = true; out.innerHTML = '<p class="hint">Testing every provider… up to 15 seconds.</p>';
    try {
      const s = await Auth.session();
      const r = await fetch('/api/ai-test', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (s ? s.access_token : '') }, body: '{}' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { out.innerHTML = '<p class="hint">' + UI.esc(j.error || 'Test failed (' + r.status + '). Is the Worker deployed?') + '</p>'; }
      else {
        const rows = (j.results || []).map(x => '<div class="rowitem"><div class="grow"><b>' + (x.ok ? '✅' : '❌') + ' ' + UI.esc(x.provider) + ' · ' + UI.esc(x.model) + '</b><small>' + (x.ok ? x.ms + ' ms · replied “' + UI.esc(x.sample) + '”' : UI.esc(x.error || 'no reply')) + '</small></div></div>').join('');
        out.innerHTML = (rows || '<p class="hint">No providers are active. Add at least one API key as a Secret.</p>') +
          '<p class="hint">Cloudflare AI: ' + (j.cloudflare ? 'connected ✅' : 'not connected (check the "ai" part of wrangler.jsonc)') + '</p>' +
          ((j.missing || []).length ? '<p class="hint">Keys not added: ' + j.missing.map(UI.esc).join(', ') + '</p>' : '');
      }
    } catch (e) { out.innerHTML = '<p class="hint">Could not reach the server.</p>'; }
    btn.disabled = false;
  };
})();
