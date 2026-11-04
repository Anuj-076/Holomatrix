/* Landing page: particle hero, scroll effects, team, custom blocks (the top bar lives in header.js) */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = UI.esc;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let scrubWords = [];

  /* ---------- Brand icons next to every editable link ---------- */
  function decorate(root) {
    (root || document).querySelectorAll('a[data-link]').forEach(a => {
      const old = a.querySelector(':scope > .ico');
      if (old) old.remove();
      const s = document.createElement('span');
      s.className = 'ico';
      s.innerHTML = HoloIcons.svg(HoloIcons.detect(a.getAttribute('href')));
      a.prepend(s);
    });
  }

  /* ---------- Particle hero canvas ---------- */
  function heroCanvas() {
    const cv = $('hero-canvas'); if (!cv) return;
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, pts = [], tick = 0, visible = true;
    const mouse = { x: -9999, y: -9999 };
    const col = { a: '#4de1ff', b: '#8b5cf6' };

    function readColors() {
      const cs = getComputedStyle(document.documentElement);
      col.a = cs.getPropertyValue('--accent').trim() || col.a;
      col.b = cs.getPropertyValue('--accent-2').trim() || col.b;
    }
    function resize() {
      const r = cv.parentElement.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(110, Math.floor((w * h) / 14000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.7 + 0.5, c: Math.random() > 0.5 ? 'a' : 'b'
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (!reduce) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < 140 && d > 0) { p.x += (dx / d) * 1.6; p.y += (dy / d) * 1.6; }
        }
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = col[p.c];
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 120) {
            ctx.globalAlpha = (1 - d / 120) * 0.35;
            ctx.strokeStyle = col.a; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    }
    function frame() {
      if (visible && !document.hidden) { if ((tick++ % 90) === 0) readColors(); draw(); }
      if (!reduce) requestAnimationFrame(frame);
    }
    readColors(); resize(); draw();
    if (!reduce) frame();
    addEventListener('resize', () => { resize(); draw(); });
    document.addEventListener('holo:theme', () => { readColors(); draw(); });
    cv.parentElement.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    cv.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(cv.parentElement);
  }

  /* ---------- Statement: words light up while scrolling ---------- */
  function splitScrub() {
    scrubWords = [];
    document.querySelectorAll('.scrub').forEach(el => {
      const text = el.textContent.trim();
      if (!text) return;
      el.textContent = '';
      const list = [];
      text.split(/\s+/).forEach((word, i, arr) => {
        const s = document.createElement('span');
        s.className = 'w'; s.textContent = word;
        el.appendChild(s);
        if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
        list.push(s);
      });
      scrubWords.push({ el, list });
    });
  }

  function onScroll() {
    const y = scrollY, vh = innerHeight;
    const inner = $('hero-inner');
    if (inner && y < vh * 1.2 && !document.body.classList.contains('editing')) {
      const p = clamp(y / vh, 0, 1);
      inner.style.transform = 'translate3d(0,' + (y * 0.28) + 'px,0) scale(' + (1 - p * 0.07) + ')';
      inner.style.opacity = String(1 - p * 1.15);
    }
    scrubWords.forEach(({ el, list }) => {
      if (!el.isConnected || !list[0] || !list[0].isConnected) return;
      const r = el.getBoundingClientRect();
      const p = clamp((vh * 0.88 - r.top) / (vh * 0.5 + r.height * 0.5), 0, 1);
      const n = Math.round(p * list.length * 1.05);
      list.forEach((s, i) => s.classList.toggle('on', i < n));
    });
  }
  let raf = 0;
  const onScrollRaf = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; onScroll(); }); };

  /* ---------- Team (staff_members table) ---------- */
  function staffLinks(m) {
    let l = Array.isArray(m.links) ? m.links.filter(x => x && x.url) : [];
    if (!l.length) {
      if (m.instagram) l.push({ url: m.instagram });
      if (m.linkedin) l.push({ url: m.linkedin });
    }
    return l;
  }

  async function renderTeam() {
    const box = $('team'), grid = $('team-grid');
    try {
      const { data, error } = await sb.from('staff_members').select('*')
        .eq('visible', true).order('position', { ascending: true }).order('created_at', { ascending: true });
      if (error || !data || !data.length) return;
      grid.innerHTML = data.map((m, i) => {
        const ini = esc((m.name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase());
        const photo = m.photo_url && /^https:\/\//.test(m.photo_url)
          ? '<img src="' + esc(m.photo_url) + '" alt="' + esc(m.name) + '" loading="lazy">'
          : '<span class="initials">' + ini + '</span>';
        const links = staffLinks(m).map(l => {
          const name = HoloIcons.forItem(l);
          return '<a href="' + esc(Site.safeUrl(l.url)) + '" target="_blank" rel="noopener noreferrer" title="' + esc(l.label || HoloIcons.label(name)) + '" aria-label="' + esc(l.label || HoloIcons.label(name)) + '"><span class="ico">' + HoloIcons.svg(name) + '</span></a>';
        });
        const bio = (m.bio || links.length)
          ? '<div class="staff-bio">' + (m.bio ? '<p>' + esc(m.bio) + '</p>' : '') + (links.length ? '<div class="staff-links">' + links.join('') + '</div>' : '') + '</div>'
          : '';
        return '<article class="staff reveal" style="--d:' + (i % 4) * 90 + 'ms" tabindex="0">' +
          '<div class="staff-photo">' + photo + bio + '</div>' +
          '<div class="staff-info"><h4>' + esc(m.name) + '</h4>' + (m.title ? '<p>' + esc(m.title) + '</p>' : '') + '</div></article>';
      }).join('');
      box.hidden = false;
      UI.observe(box);
    } catch (e) { /* team stays hidden */ }
  }

  /* ---------- Custom blocks (site_blocks table) ---------- */
  async function renderBlocks() {
    const sec = $('blocks'), list = $('blocks-list');
    try {
      const { data, error } = await sb.from('site_blocks').select('*')
        .eq('visible', true).order('position', { ascending: true }).order('created_at', { ascending: true });
      if (error || !data || !data.length) return;
      HoloBlocks.ensureFonts(data);
      list.innerHTML = data.map(b => HoloBlocks.render(b)).join('');
      sec.classList.add('has');
      UI.observe(sec);
    } catch (e) { /* blocks stay hidden */ }
  }

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    heroCanvas();
    decorate();
    $('year').textContent = new Date().getFullYear();
    addEventListener('scroll', onScrollRaf, { passive: true });
    addEventListener('resize', onScrollRaf);
    onScroll();
    Site.ready.then(() => { decorate(); splitScrub(); renderTeam(); renderBlocks(); UI.observe(); onScroll(); });
  });
})();
