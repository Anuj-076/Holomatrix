/* Admin: the team "Group" becomes three tick buttons; "Log out" asks first. */
(function () {
  'use strict';
  if (window.Auth && !Auth._so) {
    Auth._so = true; const so = Auth.signOut.bind(Auth);
    Auth.signOut = async function () {
      const ok = await UI.confirm('Log out?', 'You will need to log in again to use your account.', { confirmText: 'Log out', cancelText: 'Cancel' });
      if (ok) return so();
    };
  }

  const G = [['Scientists', '#1fc8e8', '#04101c'], ['Management', '#d93a3a', '#fff'], ['Consultants', '#8b5a2b', '#fff']];
  const st = document.createElement('style');
  st.textContent = '.gpick{display:flex;gap:8px;flex-wrap:wrap}.gpick label{position:relative;cursor:pointer}.gpick input[type=checkbox]{position:absolute;opacity:0;inset:0;width:100%;height:100%;margin:0;cursor:pointer}' +
    '.gpick span{display:inline-block;padding:8px 16px;border-radius:999px;font-weight:700;font-size:.85rem;border:2px solid var(--c);color:var(--c);background:transparent;transition:all .2s}' +
    '.gpick input:checked+span{background:var(--c);color:var(--t)}.gpick input:focus-visible+span{outline:2px solid var(--text);outline-offset:2px}';
  document.head.appendChild(st);
  const parse = v => {
    const set = [];
    String(v || '').split(/\s*[&,]\s*/).forEach(x => { x = x.trim(); if (x === 'Executive team') x = 'Management'; if (G.some(g => g[0] === x) && set.indexOf(x) < 0) set.push(x); });
    return set.length ? set : ['Management'];
  };

  function upgrade(sel) {
    if (sel.dataset.gp) return; sel.dataset.gp = '1';
    const o = sel.options[sel.selectedIndex], cur = parse(o ? o.text : sel.value);
    const hid = document.createElement('input'); hid.type = 'hidden'; hid.id = 'pg';
    const wrap = document.createElement('div'); wrap.className = 'gpick';
    const sync = () => { hid.value = G.map(g => g[0]).filter(n => cur.indexOf(n) > -1).join(' & '); };
    G.forEach(g => {
      const l = document.createElement('label'); l.style.setProperty('--c', g[1]); l.style.setProperty('--t', g[2]);
      const i = document.createElement('input'); i.type = 'checkbox'; i.checked = cur.indexOf(g[0]) > -1;
      i.onchange = () => {
        if (i.checked) { if (cur.indexOf(g[0]) < 0) cur.push(g[0]); }
        else if (cur.length > 1) cur.splice(cur.indexOf(g[0]), 1);
        else { i.checked = true; return; }       // at least one group
        sync();
      };
      const s = document.createElement('span'); s.textContent = g[0];
      l.append(i, s); wrap.append(l);
    });
    sync(); wrap.append(hid); sel.replaceWith(wrap);
  }
  new MutationObserver(() => { document.querySelectorAll('select#pg').forEach(upgrade); }).observe(document.body, { childList: true, subtree: true });
})();
