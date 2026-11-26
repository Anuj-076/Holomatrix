/* Website banners: top bar, corner card or popup. Designed in Admin → Banners (stored in site_content key "banners"). */
(function () {
  'use strict';
  if (window.HoloBanners) return;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const FONTS = ['Space Grotesk', 'Inter', 'Sora', 'Poppins', 'Manrope', 'Outfit', 'Playfair Display', 'Syne', 'DM Sans', 'Montserrat'];
  const hex = (v, d) => /^#[0-9a-f]{6}$/i.test(String(v || '')) ? v : d;
  const num = (v, a, z, d) => { v = +v; return v >= a && v <= z ? v : d; };
  const safeUrl = u => { u = String(u || '').trim(); return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(u) ? u : ''; };
  const imgOk = u => /^(https:\/\/|\/)/i.test(String(u || ''));
  /* **bold**, [text](link) and new lines */
  const fmt = (s, inline) => {
    const h = esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|mailto:)[^)\s]*)\)/g, (m, t, u) => '<a href="' + u + '"' + (/^https?:/i.test(u) && u.indexOf(location.origin) !== 0 ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + t + '</a>');
    return inline ? h.replace(/\n+/g, ' · ') : h.replace(/\n/g, '<br>');
  };
  const font = f => {
    if (!f || FONTS.indexOf(f) < 0 || f === 'Space Grotesk' || f === 'Inter' || document.querySelector('link[data-ann-font="' + f + '"]')) return;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + f.replace(/ /g, '+') + ':wght@400;600;700&display=swap'; l.setAttribute('data-ann-font', f); document.head.appendChild(l);
  };

  const CSS = [
    '.ann-bars{position:absolute;top:68px;left:0;right:0;z-index:999;display:flex;flex-direction:column;pointer-events:none}.ann-bars.fix{position:fixed}',
    '.ann-cards{position:fixed;top:84px;right:16px;z-index:998;display:flex;flex-direction:column;gap:12px;width:min(480px,calc(100vw - 24px));pointer-events:none;max-height:calc(100vh - 100px);overflow:auto}',
    '.ann{position:relative;pointer-events:auto;color:var(--a-tx);font-family:var(--a-ff,inherit);text-align:var(--a-al,left);background:var(--a-bg);border:var(--a-bw,1px) solid var(--a-bc);border-radius:var(--a-r,16px);box-shadow:var(--a-sh,none);padding:var(--a-p,18px);overflow:hidden;line-height:1.55}',
    '.ann *{box-sizing:border-box}.ann-bar{width:100%;border-left:0;border-right:0;padding-right:calc(var(--a-p,18px) + 38px)}',
    '.ann-card{width:100%;max-width:var(--a-w,380px);margin-left:auto}.ann-popup{width:100%;max-width:var(--a-w,560px);max-height:90vh;overflow:auto}',
    '.ann-in{display:flex;align-items:center;gap:16px}.ann-bar .ann-in{max-width:var(--a-w,1200px);margin:0 auto}',
    '.ip-left .ann-in{flex-direction:row}.ip-right .ann-in{flex-direction:row-reverse}.ip-top .ann-in{flex-direction:column;align-items:stretch}.ip-bottom .ann-in{flex-direction:column-reverse;align-items:stretch}',
    '.ann-im{flex:none;overflow:hidden}.ip-left .ann-im,.ip-right .ann-im{width:var(--a-is,64px);height:var(--a-is,64px)}.ip-top .ann-im,.ip-bottom .ann-im{width:100%;height:var(--a-is,160px)}',
    '.ann-im img{width:100%;height:100%;object-fit:var(--a-fit,cover);display:block}.ish-rounded .ann-im{border-radius:14px}.ish-circle .ann-im{border-radius:50%}.ish-square .ann-im{border-radius:0}',
    '.ish-circle.ip-top .ann-im,.ish-circle.ip-bottom .ann-im{width:var(--a-is,160px);margin:0 auto}',
    '.ip-bg{background:linear-gradient(rgba(0,0,0,var(--a-ov,.45)),rgba(0,0,0,var(--a-ov,.45))),var(--a-img) center/cover,var(--a-bg)}',
    '.ann-tx{flex:1;min-width:0}.ann-h{font-size:var(--a-hs,20px);line-height:1.25;color:var(--a-hd);margin-bottom:4px}.ann-p{font-size:var(--a-ts,15px)}.ann-p a{color:inherit;text-decoration:underline}',
    '.ann-btn{display:inline-block;margin-top:10px;padding:9px 18px;border-radius:999px;background:var(--a-bb);color:var(--a-bt);font-weight:700;font-size:.9em;transition:transform .2s}.ann-btn:hover{transform:translateY(-2px)}.ann-bar .ann-btn{margin-top:0;flex:none}',
    '.ann-x{position:absolute;top:8px;right:10px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.32);color:#fff;font-size:.8rem;z-index:2}.ann-x:hover{background:rgba(0,0,0,.55)}',
    '.ann-bar .ann-x{top:50%;transform:translateY(-50%)}',
    '.ann-mq{flex:1;min-width:0;overflow:hidden;white-space:nowrap;font-size:var(--a-ts,15px)}.ann-mqt{display:inline-block;padding-left:100%;animation:annmq var(--a-mqs,18s) linear infinite}@keyframes annmq{to{transform:translateX(-100%)}}',
    '.ann-pop{position:fixed;inset:0;z-index:9000;display:grid;place-items:center;padding:20px;background:rgba(2,4,10,.62);backdrop-filter:blur(5px);transition:opacity .3s}.ann-pop.out{opacity:0}',
    '.an-fade{animation:annfade .6s both}.an-slide{animation:annslide .6s cubic-bezier(.2,.8,.2,1) both}.an-zoom{animation:annzoom .5s cubic-bezier(.2,.9,.3,1.2) both}',
    '@keyframes annfade{from{opacity:0}}@keyframes annslide{from{opacity:0;transform:translateY(-18px)}}@keyframes annzoom{from{opacity:0;transform:scale(.85)}}',
    '.ann.out{opacity:0;transform:translateY(-8px) scale(.97);transition:all .28s}',
    '.ann-glow::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;box-shadow:0 0 0 0 var(--a-bc);animation:annpulse 2.2s infinite}@keyframes annpulse{70%{box-shadow:0 0 0 14px transparent}100%{box-shadow:0 0 0 0 transparent}}',
    '@media(max-width:640px){.ip-left .ann-in,.ip-right .ann-in,.ann-bar .ann-in{flex-direction:column;align-items:flex-start}.ip-left .ann-im,.ip-right .ann-im{width:var(--a-is,64px)}}',
    'body.editing .ann-bars,body.editing .ann-cards,body.editing .ann-pop{display:none}',
    '.ann-pv .ann{position:relative;margin:0 auto;animation:none;max-width:100%;width:100%}.ann-pv .ann-card,.ann-pv .ann-popup{max-width:var(--a-w,380px)}.ann-pv .ann-x{pointer-events:none}'
  ].join('');
  const inject = () => { if (!document.getElementById('ann-css')) { const s = document.createElement('style'); s.id = 'ann-css'; s.textContent = CSS; document.head.appendChild(s); } };

  const D = { name: 'New banner', on: true, place: 'bar', head: '', body: '', icon: '', btn: '', url: '', img: '', ipos: 'left', isz: 48, ishape: 'rounded', ifit: 'cover', ov: 45,
    bgm: 'gradient', bg: '#0e2a5c', bg2: '#2b1d6e', ang: 135, tx: '#eaf0ff', hd: '#ffffff', bb: '#4de1ff', bt: '#04101c', bc: '#4de1ff', bw: 1, r: 0, p: 12, w: 1200, hs: 16, ts: 14,
    sh: 'none', ff: '', al: 'left', anim: 'fade', glow: false, mq: false, mqs: 18, close: true, rem: 'visit', pages: 'all', aud: 'all', from: '', to: '', stick: false, css: '' };
  function defaults(place) {
    const d = Object.assign({}, D, { id: 'b' + Date.now().toString(36), v: Date.now(), place: place || 'bar' });
    if (place === 'card') Object.assign(d, { r: 18, p: 18, w: 380, hs: 20, ts: 15, isz: 140, ipos: 'top', sh: 'soft' });
    if (place === 'popup') Object.assign(d, { r: 22, p: 26, w: 560, hs: 26, ts: 16, isz: 200, ipos: 'top', sh: 'glow', al: 'center', anim: 'zoom', rem: 'forever' });
    return d;
  }

  /* returns the HTML of one banner */
  function render(b, o) {
    o = o || {}; inject();
    const place = ['bar', 'card', 'popup'].indexOf(b.place) > -1 ? b.place : 'bar';
    const hasImg = imgOk(b.img) && b.ipos !== 'none', ip = hasImg ? (['left', 'right', 'top', 'bottom', 'bg'].indexOf(b.ipos) > -1 ? b.ipos : 'left') : 'none';
    const bc = hex(b.bc, '#4de1ff');
    const bgv = b.bgm === 'solid' ? hex(b.bg, '#0a0f1c') : 'linear-gradient(' + num(b.ang, 0, 360, 135) + 'deg,' + hex(b.bg, '#0e2a5c') + ',' + hex(b.bg2, '#2b1d6e') + ')';
    const shv = b.sh === 'none' ? 'none' : b.sh === 'glow' ? '0 0 38px -8px ' + bc : '0 18px 50px -18px rgba(0,0,0,.6)';
    let css = '--a-bg:' + bgv + ';--a-tx:' + hex(b.tx, '#eaf0ff') + ';--a-hd:' + hex(b.hd, '#ffffff') + ';--a-bb:' + hex(b.bb, '#4de1ff') + ';--a-bt:' + hex(b.bt, '#04101c') + ';--a-bc:' + bc +
      ';--a-bw:' + num(b.bw, 0, 12, 1) + 'px;--a-r:' + num(b.r, 0, 60, 16) + 'px;--a-p:' + num(b.p, 4, 80, 18) + 'px;--a-w:' + num(b.w, 240, 1600, place === 'bar' ? 1200 : place === 'popup' ? 560 : 380) +
      'px;--a-hs:' + num(b.hs, 12, 60, 20) + 'px;--a-ts:' + num(b.ts, 11, 32, 15) + 'px;--a-sh:' + shv + ';--a-al:' + (['left', 'center', 'right'].indexOf(b.al) > -1 ? b.al : 'left') +
      ';--a-is:' + num(b.isz, 24, 600, 64) + 'px;--a-fit:' + (b.ifit === 'contain' ? 'contain' : 'cover') + ';--a-ov:' + (num(b.ov, 0, 90, 45) / 100) + ';--a-mqs:' + num(b.mqs, 6, 90, 18) + 's;';
    if (FONTS.indexOf(b.ff) > -1) { css += "--a-ff:'" + b.ff + "',system-ui,sans-serif;"; font(b.ff); }
    if (ip === 'bg') css += "--a-img:url('" + String(b.img).replace(/['"()\s\\]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')) + "');";
    css += String(b.css || '').replace(/[<>]/g, '').replace(/@import|expression\s*\(|javascript:|behavior/gi, '');

    const url = safeUrl(b.url), ext = /^https?:\/\//i.test(url) && url.indexOf(location.origin) !== 0;
    const btn = b.btn && url ? '<a class="ann-btn" href="' + esc(url) + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(b.btn) + '</a>' : '';
    const icon = b.icon ? '<span class="ann-ic">' + esc(b.icon) + '</span> ' : '';
    const marquee = !!b.mq && place === 'bar';
    const img = ip !== 'none' && ip !== 'bg' ? '<div class="ann-im"><img src="' + esc(b.img) + '" alt=""></div>' : '';
    const text = marquee
      ? '<div class="ann-mq"><span class="ann-mqt">' + icon + (b.head ? '<strong>' + esc(b.head) + '</strong>' : '') + (b.head && b.body ? ' — ' : '') + fmt(b.body, true) + '</span></div>' + btn
      : '<div class="ann-tx">' + (b.head ? '<h4 class="ann-h">' + icon + esc(b.head) + '</h4>' : '') + (b.body ? '<div class="ann-p">' + fmt(b.body) + '</div>' : '') + btn + '</div>';
    const closable = place === 'popup' || b.close !== false;
    return '<div class="ann ann-' + place + ' ip-' + ip + ' ish-' + (['circle', 'square'].indexOf(b.ishape) > -1 ? b.ishape : 'rounded') + (['fade', 'slide', 'zoom'].indexOf(b.anim) > -1 ? ' an-' + b.anim : '') + (b.glow ? ' ann-glow' : '') + '" data-ann="' + esc(b.id) + '" style="' + esc(css) + '">' +
      (closable ? '<button type="button" class="ann-x" aria-label="Close">✕</button>' : '') + '<div class="ann-in">' + img + text + '</div></div>';
  }

  /* ---------- on the live site ---------- */
  const KEY = 'holo-ann', kOf = b => b.id + ':' + (b.v || 0);
  const read = s => { try { return JSON.parse(s.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const isClosed = b => !!(read(localStorage)[kOf(b)] || read(sessionStorage)[kOf(b)]);
  const setClosed = b => { const s = b.rem === 'forever' ? localStorage : sessionStorage, o = read(s); o[kOf(b)] = 1; try { s.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  function visible(b, ctx) {
    if (!b || b.on === false) return false;
    const now = Date.now();
    if (b.from && now < new Date(b.from).getTime()) return false;
    if (b.to && now > new Date(b.to).getTime()) return false;
    if (b.pages === 'home' && !ctx.home) return false;
    if (b.pages === 'notHome' && ctx.home) return false;
    if (b.aud === 'guest' && ctx.user) return false;
    if (b.aud === 'user' && !ctx.user) return false;
    return !isClosed(b);
  }
  function mount() {
    const list = window.Site && Site.content && Site.content.banners; if (!Array.isArray(list) || !list.length) return;
    const ctx = { home: /^\/(landing\/?)?$/.test(location.pathname), user: !!Site.access };
    const shown = list.filter(b => visible(b, ctx)); if (!shown.length) return;
    const mk = cls => { const d = document.createElement('div'); d.className = cls; document.body.appendChild(d); return d; };
    let abs = null, fix = null, cards = null; const pops = [];
    const dismiss = (b, el) => { setClosed(b); el.classList.add('out'); setTimeout(() => el.remove(), 300); };
    shown.forEach(b => {
      const t = document.createElement('div'); t.innerHTML = render(b); const el = t.firstElementChild; if (!el) return;
      if (b.place === 'popup') { pops.push([b, el]); return; }
      const x = el.querySelector('.ann-x'); if (x) x.onclick = () => dismiss(b, el);
      if (b.place === 'card') { cards = cards || mk('ann-cards'); cards.appendChild(el); }
      else if (b.stick) { fix = fix || mk('ann-bars fix'); fix.appendChild(el); }
      else { abs = abs || mk('ann-bars'); abs.appendChild(el); }
    });
    const pad = () => { if (abs) abs.style.top = (68 + (fix ? fix.offsetHeight : 0)) + 'px'; };
    pad(); addEventListener('resize', pad);
    (function showPop() {
      const it = pops.shift(); if (!it) return;
      const b = it[0], el = it[1], w = document.createElement('div'); w.className = 'ann-pop'; w.appendChild(el); document.body.appendChild(w);
      const end = () => { setClosed(b); document.removeEventListener('keydown', k); w.classList.add('out'); setTimeout(() => { w.remove(); showPop(); }, 300); };
      const k = e => { if (e.key === 'Escape') end(); };
      document.addEventListener('keydown', k);
      w.addEventListener('mousedown', e => { if (e.target === w) end(); });
      const x = el.querySelector('.ann-x'); if (x) x.onclick = end;
    })();
  }
  function boot() {
    if (!window.Site || !window.UI || !document.getElementById('site-header')) return;
    Promise.all([Site.ready, Site.accessReady]).then(() => UI.onReady(() => setTimeout(mount, 350)));
  }

  window.HoloBanners = { render, defaults, FONTS };
  boot();
})();
