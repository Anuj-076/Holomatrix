/* Holomatrix UI toolkit: theme, toasts, modals, cookie banner, page-transition fallback */
(function () {
  const root = document.documentElement;
  const UI = {};

  /* ---------- Safety helper ---------- */
  UI.esc = s => String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  /* ---------- Theme (system by default, user can override) ---------- */
  UI.getTheme = () => { try { return localStorage.getItem('holo-theme') || 'system'; } catch (e) { return 'system'; } };

  UI.currentTheme = () =>
    root.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

  UI.setTheme = t => {
    try { localStorage.setItem('holo-theme', t); } catch (e) {}
    if (t === 'system') delete root.dataset.theme; else root.dataset.theme = t;
    UI.refreshThemeIcons();
  };

  UI.toggleTheme = () => UI.setTheme(UI.currentTheme() === 'dark' ? 'light' : 'dark');

  UI.refreshThemeIcons = () => {
    document.querySelectorAll('[data-theme-toggle]').forEach(b => {
      b.textContent = UI.currentTheme() === 'dark' ? '☀️' : '🌙';
      b.setAttribute('aria-label', 'Switch to ' + (UI.currentTheme() === 'dark' ? 'light' : 'dark') + ' theme');
    });
  };

  /* ---------- Toasts ---------- */
  function toastRoot() {
    let r = document.getElementById('toast-root');
    if (!r) { r = document.createElement('div'); r.id = 'toast-root'; document.body.appendChild(r); }
    return r;
  }
  UI.toast = (msg, type = 'info', ms = 4000) => {
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.setAttribute('role', 'status');
    t.textContent = msg;
    toastRoot().appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, ms);
  };

  /* ---------- Modals (return a Promise<boolean>) ---------- */
  UI.modal = ({ title, message, confirmText = 'OK', cancelText = 'Cancel', showCancel = true, danger = false }) =>
    new Promise(resolve => {
      const b = document.createElement('div');
      b.className = 'modal-backdrop';
      b.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true">' +
        '<h3>' + UI.esc(title) + '</h3><p>' + UI.esc(message) + '</p>' +
        '<div class="modal-actions">' +
        (showCancel ? '<button class="btn btn-ghost" data-r="0">' + UI.esc(cancelText) + '</button>' : '') +
        '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" data-r="1">' + UI.esc(confirmText) + '</button>' +
        '</div></div>';

      const onKey = e => { if (e.key === 'Escape') close(false); };
      const close = v => {
        b.classList.remove('show');
        document.removeEventListener('keydown', onKey);
        setTimeout(() => b.remove(), 260);
        resolve(v);
      };
      b.addEventListener('click', e => {
        if (e.target === b) return close(false);
        const r = e.target.closest('[data-r]');
        if (r) close(r.dataset.r === '1');
      });
      document.addEventListener('keydown', onKey);
      document.body.appendChild(b);
      requestAnimationFrame(() => b.classList.add('show'));
      b.querySelector('[data-r="1"]').focus();
    });

  UI.confirm = (title, message, opts = {}) => UI.modal({ title, message, ...opts });
  UI.alert = (title, message) => UI.modal({ title, message, showCancel: false });

  /* ---------- Cookie consent (in-page) ---------- */
  function cookieInit() {
    let saved = null;
    try { saved = localStorage.getItem('holo-cookie'); } catch (e) {}
    if (saved) return;

    const el = document.createElement('div');
    el.className = 'cookie-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie preferences');
    el.innerHTML =
      '<h4>🍪 We use cookies</h4>' +
      '<p>We use essential cookies to keep you logged in and optional ones to improve Holomatrix. ' +
      'Read our <a href="/privacy">Privacy Policy</a>.</p>' +
      '<div class="cookie-actions">' +
      '<button class="btn btn-primary btn-sm" data-c="all">Accept all</button>' +
      '<button class="btn btn-ghost btn-sm" data-c="essential">Essential only</button>' +
      '</div>';

    el.addEventListener('click', e => {
      const b = e.target.closest('[data-c]');
      if (!b) return;
      try { localStorage.setItem('holo-cookie', b.dataset.c); } catch (err) {}
      el.classList.remove('show');
      setTimeout(() => el.remove(), 700);
      UI.toast(b.dataset.c === 'all' ? 'Preferences saved. Thank you!' : 'Only essential cookies will be used.', 'success');
    });

    document.body.appendChild(el);
    setTimeout(() => el.classList.add('show'), 900);
  }

  /* ---------- Page-transition fallback for browsers without View Transitions ---------- */
  if (!('onpagereveal' in window)) {
    root.classList.add('no-vt');
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      let u;
      try { u = new URL(a.href, location.href); } catch (err) { return; }
      if (u.origin !== location.origin) return;
      if (u.pathname === location.pathname && u.search === location.search) return; // same page / anchors
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(() => { location.href = a.href; }, 350);
    });
    window.addEventListener('pageshow', e => { if (e.persisted) document.body.classList.remove('leaving'); });
  }

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-toggle]').forEach(b => b.addEventListener('click', UI.toggleTheme));
    UI.refreshThemeIcons();
    cookieInit();
  });

  window.UI = UI;
})();
