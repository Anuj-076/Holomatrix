/* Admin: team "Group" = three tick buttons, new "Nationality" field, "Log out" asks first. */
(function () {
  'use strict';
  if (window.Auth && !Auth._so) {
    Auth._so = true; const so = Auth.signOut.bind(Auth);
    Auth.signOut = async function () {
      const ok = await UI.confirm('Log out?', 'You will need to log in again to use your account.', { confirmText: 'Log out', cancelText: 'Cancel' });
      if (ok) return so();
    };
  }

  /* the Nationality value rides along whenever a team member is saved */
  if (window.sb && !sb._natPatched) {
    sb._natPatched = true;
    const of = sb.from.bind(sb);
    sb.from = function (t) {
      const q = of(t);
      if (t !== 'staff_members') return q;
      const patch = row => {
        const el = document.getElementById('pnat');
        if (!el || !row || typeof row !== 'object' || Array.isArray(row) || !('staff_group' in row)) return row;
        return Object.assign({}, row, { nationality: el.value.trim() || null });
      };
      const ins = q.insert.bind(q), upd = q.update.bind(q);
      q.insert = (row, ...a) => ins(patch(row), ...a);
      q.update = (row, ...a) => upd(patch(row), ...a);
      return q;
    };
  }

  const COUNTRIES = 'Afghanistan,Albania,Algeria,Andorra,Angola,Antigua and Barbuda,Argentina,Armenia,Australia,Austria,Azerbaijan,Bahamas,Bahrain,Bangladesh,Barbados,Belarus,Belgium,Belize,Benin,Bhutan,Bolivia,Bosnia and Herzegovina,Botswana,Brazil,Brunei,Bulgaria,Burkina Faso,Burundi,Cabo Verde,Cambodia,Cameroon,Canada,Central African Republic,Chad,Chile,China,Colombia,Comoros,Congo,Costa Rica,Croatia,Cuba,Cyprus,Czechia,Denmark,Djibouti,Dominica,Dominican Republic,DR Congo,Ecuador,Egypt,El Salvador,Equatorial Guinea,Eritrea,Estonia,Eswatini,Ethiopia,Fiji,Finland,France,Gabon,Gambia,Georgia,Germany,Ghana,Greece,Grenada,Guatemala,Guinea,Guinea-Bissau,Guyana,Haiti,Honduras,Hungary,Iceland,India,Indonesia,Iran,Iraq,Ireland,Israel,Italy,Ivory Coast,Jamaica,Japan,Jordan,Kazakhstan,Kenya,Kiribati,Kosovo,Kuwait,Kyrgyzstan,Laos,Latvia,Lebanon,Lesotho,Liberia,Libya,Liechtenstein,Lithuania,Luxembourg,Madagascar,Malawi,Malaysia,Maldives,Mali,Malta,Marshall Islands,Mauritania,Mauritius,Mexico,Micronesia,Moldova,Monaco,Mongolia,Montenegro,Morocco,Mozambique,Myanmar,Namibia,Nauru,Nepal,Netherlands,New Zealand,Nicaragua,Niger,Nigeria,North Korea,North Macedonia,Norway,Oman,Pakistan,Palau,Palestine,Panama,Papua New Guinea,Paraguay,Peru,Philippines,Poland,Portugal,Qatar,Romania,Russia,Rwanda,Saint Kitts and Nevis,Saint Lucia,Saint Vincent and the Grenadines,Samoa,San Marino,Sao Tome and Principe,Saudi Arabia,Senegal,Serbia,Seychelles,Sierra Leone,Singapore,Slovakia,Slovenia,Solomon Islands,Somalia,South Africa,South Korea,South Sudan,Spain,Sri Lanka,Sudan,Suriname,Sweden,Switzerland,Syria,Taiwan,Tajikistan,Tanzania,Thailand,Timor-Leste,Togo,Tonga,Trinidad and Tobago,Tunisia,Turkey,Turkmenistan,Tuvalu,Uganda,Ukraine,United Arab Emirates,United Kingdom,United States,Uruguay,Uzbekistan,Vanuatu,Vatican City,Venezuela,Vietnam,Yemen,Zambia,Zimbabwe'.split(',');
  if (!document.getElementById('nat-list')) {
    const dl = document.createElement('datalist'); dl.id = 'nat-list';
    dl.innerHTML = COUNTRIES.map(c => '<option value="' + c + '"></option>').join(''); document.body.appendChild(dl);
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
        else { i.checked = true; return; }
        sync();
      };
      const s = document.createElement('span'); s.textContent = g[0];
      l.append(i, s); wrap.append(l);
    });
    sync(); wrap.append(hid); sel.replaceWith(wrap);

    /* Nationality field, right under the group / qualification row */
    const row = wrap.closest('.two');
    if (row && !document.getElementById('pnat')) {
      const f = document.createElement('div'); f.className = 'field';
      f.innerHTML = '<label>Nationality (country)</label><input class="input" id="pnat" list="nat-list" maxlength="60" autocomplete="off" placeholder="Choose or type a country (empty = Unknown)">';
      row.insertAdjacentElement('afterend', f);
      const nm = (document.getElementById('pn') || {}).value || '';
      if (nm) sb.from('staff_members').select('name,nationality').then(r => {      // editing: fill in the saved country
        const hit = (r.data || []).find(x => x.name === nm), el = document.getElementById('pnat');
        if (hit && hit.nationality && el && !el.value) el.value = hit.nationality;
      });
    }
  }
  new MutationObserver(() => { document.querySelectorAll('select#pg').forEach(upgrade); }).observe(document.body, { childList: true, subtree: true });
})();
