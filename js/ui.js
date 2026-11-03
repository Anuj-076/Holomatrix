/* Holomatrix UI toolkit: theme, toasts, modals, cookie banner, curtain transitions, cursor, reveal */
(function () {
  'use strict';
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const UI = {};

  UI.esc = s => String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  /* ---------- Ready signal (fires after the intro curtain lifts) ---------- */
  UI.onReady = fn => { if (window.__holoReady) fn(); else document.addEventListener('holo:ready', fn, { once: true }); };
  function ready() {
    if (window.__holoReady) return;
    window.__holoReady = true;
    document.body.classList.add('is-ready');
    document.dispatchEvent(new Event('holo:ready'));
  }

  /* ---------- Theme ---------- */
  UI.currentTheme = () => root.getAttribute('data-theme') || 'dark';
  UI.setTheme = t => { HoloTheme.set(t); UI.refreshThemeIcons(); document.dispatchEvent(new Event('holo:theme')); };
  UI.toggleTheme = () => UI.setTheme(UI.currentTheme() === 'dark' ? 'light' : 'dark');
  UI.refreshThemeIcons = () => {
    document.querySelectorAll('[data-theme-toggle]').forEach(b => {
      const dark = UI.currentTheme() === 'dark';
      b.textContent = dark ? '☀️' : '🌙';
      b.setAttribute('aria-label', 'Switch to ' + (dark ? 'light' : 'dark') + ' theme');
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

  /* ---------- Modals. With `input`, resolves to the typed string (or null). Otherwise true/false ---------- */
  UI.modal = ({ title, message = '', confirmText = 'OK', cancelText = 'Cancel', showCancel = true, danger = false, input = null }) =>
    new Promise(resolve => {
      const b = document.createElement('div');
      b.className = 'modal-backdrop';
      b.innerHTML =
        '<div class="modal ed-ui" role="dialog" aria-modal="true"><h3>' + UI.esc(title) + '</h3>' +
        (message ? '<p>' + UI.esc(message) + '</p>' : '') +
        (input ? '<input class="input" id="m-in" value="' + UI.esc(input.value || '') + '" placeholder="' + UI.esc(input.placeholder || '') + '">' : '') +
        '<div class="modal-actions">' +
        (showCancel ? '<button class="btn btn-ghost" data-r="0">' + UI.esc(cancelText) + '</button>' : '') +
        '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" data-r="1">' + UI.esc(confirmText) + '</button>' +
        '</div></div>';
      const field = () => b.querySelector('#m-in');
      const done = ok => {
        const v = input ? (ok ? field().value : null) : ok;
        b.classList.remove('show');
        document.removeEventListener('keydown', onKey);
        setTimeout(() => b.remove(), 260);
        resolve(v);
      };
      const onKey = e => {
        if (e.key === 'Escape') done(false);
        if (e.key === 'Enter' && input) done(true);
      };
      b.addEventListener('click', e => {
        if (e.target === b) return done(false);
        const r = e.target.closest('[data-r]');
        if (r) done(r.dataset.r === '1');
      });
      document.addEventListener('keydown', onKey);
      document.body.appendChild(b);
      requestAnimationFrame(() => b.classList.add('show'));
      (input ? field() : b.querySelector('[data-r="1"]')).focus();
    });
  UI.confirm = (title, message, opts = {}) => UI.modal({ title, message, ...opts });
  UI.alert = (title, message) => UI.modal({ title, message, showCancel: false });
  UI.prompt = (title, message, input = {}) => UI.modal({ title, message, input, confirmText: 'Save' });

  /* ---------- Scroll reveal ---------- */
  let io;
  UI.observe = (scope = document) => {
    const els = scope.querySelectorAll('.reveal:not(.in), .reveal-clip:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    io = io || new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
  };

  /* ---------- Curtain page transitions ---------- */
  function buildCurtain() {
    const v = document.createElement('div');
    v.id = 'vt'; v.setAttribute('aria-hidden', 'true');
    let h = '';
    for (let i = 0; i < 6; i++) h += '<i class="vt-col" style="--i:' + i + '"></i>';
    v.innerHTML = h + '<img class="vt-logo" src="/logo.jpg" alt="">';
    document.body.appendChild(v);
  }

  function arrive() {
    try { sessionStorage.setItem('holo-seen', '1'); } catch (e) {}
    if (!root.classList.contains('vt-in')) { ready(); return; }
    setTimeout(() => {
      root.classList.add('vt-out');
      root.classList.remove('vt-in');
      setTimeout(ready, 450);
      setTimeout(() => root.classList.remove('vt-out'), 1100);
    }, 650);
  }

  UI.go = url => {
    if (reduce) { location.href = url; return; }
    try { sessionStorage.setItem('holo-vt', '1'); } catch (e) {}
    root.classList.add('vt-cover');
    setTimeout(() => { location.href = url; }, 800);
  };

  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    let u;
    try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.origin !== location.origin) return;
    if (u.pathname === location.pathname && u.search === location.search) {
      if (!u.hash) { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); }
      return; // hash links scroll normally
    }
    e.preventDefault();
    UI.go(a.href);
  });
  addEventListener('pageshow', e => { if (e.persisted) root.classList.remove('vt-cover'); });

  /* ---------- Cursor ring ---------- */
  function cursor() {
    if (reduce || !matchMedia('(pointer: fine)').matches) return;
    const r = document.createElement('div');
    r.className = 'cursor-ring';
    document.body.appendChild(r);
    let x = -100, y = -100, cx = -100, cy = -100;
    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY; r.classList.add('on');
      const t = e.target.closest && e.target.closest('a, button, summary, [role="button"], .card');
      r.classList.toggle('hot', !!t);
    }, { passive: true });
    root.addEventListener('mouseleave', () => r.classList.remove('on'));
    (function loop() {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      r.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Cookie consent (in-page) ---------- */
  function cookieInit() {
    let saved = null;
    try { saved = localStorage.getItem('holo-cookie'); } catch (e) {}
    if (saved || document.querySelector('.cookie-banner')) return;
    const el = document.createElement('div');
    el.className = 'cookie-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie preferences');
    el.innerHTML =
      '<h4>🍪 Cookies</h4>' +
      '<p>We use essential cookies to keep you logged in and optional ones to improve the site. See our <a href="/privacy">Privacy Policy</a>.</p>' +
      '<div class="cookie-actions">' +
      '<button class="btn btn-primary btn-sm" data-c="all">Accept all</button>' +
      '<button class="btn btn-ghost btn-sm" data-c="essential">Essential only</button></div>';
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-c]');
      if (!b) return;
      try { localStorage.setItem('holo-cookie', b.dataset.c); } catch (err) {}
      el.classList.remove('show');
      setTimeout(() => el.remove(), 700);
      UI.toast(b.dataset.c === 'all' ? 'Preferences saved. Thank you!' : 'Only essential cookies will be used.', 'success');
    });
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('show'), 80);
  }

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-toggle]').forEach(b => b.addEventListener('click', UI.toggleTheme));
    UI.refreshThemeIcons();
    buildCurtain();
    cursor();
    UI.observe();
    arrive();
    UI.onReady(() => setTimeout(cookieInit, 1200));
  });

  window.UI = UI;
})();
