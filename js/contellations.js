/* Hero constellations: Orion, Taurus, Little Dipper, Big Dipper, Cassiopeia.
   Laptop: move the mouse through them and they scatter; left alone for 2.5 minutes they re-form.
   Phone: the constellations just drift gently. */
(function () {
  'use strict';
  const cv = document.getElementById('hero-stars'); if (!cv) return;
  const ctx = cv.getContext('2d'), hero = cv.parentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, coarse = matchMedia('(pointer: coarse)').matches;
  const REFORM_MS = 150000;
  const SH = [
    [[.5, .02], [.3, .14], [.7, .12], [.38, .52], [.5, .5], [.62, .48], [.5, .62], [.5, .74], [.3, .94], [.74, .92]], [[0, 1], [0, 2], [1, 3], [2, 5], [3, 4], [4, 5], [3, 8], [5, 9], [4, 6], [6, 7]],          // Orion
    [[.34, .6], [.24, .48], [.14, .58], [.26, .72], [.62, .36], [.95, .06], [.64, .74], [.9, .9], [.05, .14], [.1, .08], [.13, .16], [.08, .22], [.16, .1]], [[2, 1], [1, 0], [3, 0], [0, 4], [4, 5], [0, 6], [6, 7]], // Taurus + Pleiades
    [[.04, .6], [.18, .55], [.32, .62], [.46, .56], [.64, .44], [.72, .66], [.52, .74]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],                                                               // Little Dipper
    [[.04, .3], [.18, .4], [.32, .46], [.44, .56], [.66, .6], [.7, .82], [.46, .8]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],                                                                   // Big Dipper
    [[.04, .3], [.26, .78], [.5, .42], [.74, .8], [.96, .24]], [[0, 1], [1, 2], [2, 3], [3, 4]]                                                                                                                  // Cassiopeia
  ];
  const BOX_L = [[.64, .12, .28, .52], [.40, .66, .28, .26], [.04, .74, .26, .20], [.38, .05, .26, .22], [.05, .06, .24, .14]];
  const BOX_P = [[.50, .12, .45, .30], [.50, .50, .45, .20], [.05, .74, .50, .14], [.04, .44, .50, .14], [.05, .05, .50, .10]];

  let W = 0, H = 0, stars = [], lines = [], bg = [], mode = 'formed', lastTouch = 0, ret0 = 0, tick = 0, visible = true, spr = null, last = 0;
  const mouse = { x: -9999, y: -9999 }, col = { a: '#4de1ff', t: '#ffffff' };

  function colors() {
    const cs = getComputedStyle(document.documentElement);
    col.a = cs.getPropertyValue('--accent').trim() || col.a; col.t = cs.getPropertyValue('--text').trim() || col.t;
    spr = document.createElement('canvas'); spr.width = spr.height = 48;
    const x = spr.getContext('2d'), g = x.createRadialGradient(24, 24, 0, 24, 24, 24);
    g.addColorStop(0, col.a); g.addColorStop(0.25, col.a + '88'); g.addColorStop(1, col.a + '00');
    x.fillStyle = g; x.fillRect(0, 0, 48, 48);
  }

  function build() {
    const boxes = W < H * 0.9 ? BOX_P : BOX_L, old = stars; stars = []; lines = [];
    for (let gi = 0; gi < 5; gi++) {
      const pts = SH[gi * 2], ed = SH[gi * 2 + 1], b = boxes[gi], base = stars.length;
      pts.forEach((p, i) => {
        const hx = b[0] * W + p[0] * b[2] * W, hy = b[1] * H + p[1] * b[3] * H, o = old[base + i];
        stars.push({ hx, hy, x: o ? o.x : hx, y: o ? o.y : hy, vx: o ? o.vx : 0, vy: o ? o.vy : 0, g: gi, r: i % 3 === 0 ? 2.8 : 1.9, ph: Math.random() * 6.28 });
      });
      ed.forEach(l => lines.push([base + l[0], base + l[1]]));
    }
    if (!bg.length) bg = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.1 + 0.3, p: Math.random() * 6.28 }));
  }
  function resize() {
    const r = hero.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); build();
  }

  function update(now, dt, t) {
    if (!coarse && mouse.x > -999) {
      let hit = false;
      for (const s of stars) { const d = Math.hypot(s.x - mouse.x, s.y - mouse.y); if (d < 130) { hit = true; break; } }
      if (hit) { if (mode !== 'free') mode = 'free'; lastTouch = now; }
    }
    if (mode === 'free' && now - lastTouch > REFORM_MS) { mode = 'ret'; ret0 = now; }
    if (mode === 'ret' && now - ret0 > 7000) mode = 'formed';

    for (const s of stars) {
      const tx = s.hx + Math.sin(t * 0.15 + s.g * 1.7) * 10 + Math.sin(t * 0.8 + s.ph) * 1.5;
      const ty = s.hy + Math.cos(t * 0.12 + s.g * 2.3) * 8 + Math.cos(t * 0.7 + s.ph) * 1.5;
      if (mode === 'formed') { s.x = tx; s.y = ty; s.vx = s.vy = 0; }
      else if (mode === 'ret') { const k = 1 - Math.exp(-dt * 0.9); s.x += (tx - s.x) * k; s.y += (ty - s.y) * k; }
      else {
        s.vx += (Math.random() - 0.5) * 40 * dt; s.vy += (Math.random() - 0.5) * 40 * dt;
        const dx = s.x - mouse.x, dy = s.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 130 && d > 0) { const f = (130 - d) / 130; s.vx += dx / d * f * 600 * dt; s.vy += dy / d * f * 600 * dt; }
        const sp = Math.hypot(s.vx, s.vy); if (sp > 220) { s.vx *= 220 / sp; s.vy *= 220 / sp; }
        s.vx *= Math.pow(0.5, dt); s.vy *= Math.pow(0.5, dt);
        s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.x < 0 || s.x > W) { s.vx *= -1; s.x = Math.min(W, Math.max(0, s.x)); }
        if (s.y < 0 || s.y > H) { s.vy *= -1; s.y = Math.min(H, Math.max(0, s.y)); }
      }
    }
  }

  function draw(now, t) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = col.t;
    bg.forEach(b => { ctx.globalAlpha = 0.15 + 0.3 * Math.abs(Math.sin(t * 0.6 + b.p)); ctx.fillRect(b.x * W, b.y * H, b.r, b.r); });
    const ca = mode === 'formed' ? 1 : mode === 'ret' ? Math.min(1, (now - ret0) / 6000) : 0;
    ctx.lineWidth = 1.2; ctx.strokeStyle = col.a;
    if (ca < 1) {
      for (let i = 0; i < stars.length; i++) for (let j = i + 1; j < stars.length; j++) {
        const d = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y);
        if (d < 105) { ctx.globalAlpha = (1 - d / 105) * 0.3 * (1 - ca); ctx.beginPath(); ctx.moveTo(stars[i].x, stars[i].y); ctx.lineTo(stars[j].x, stars[j].y); ctx.stroke(); }
      }
    }
    if (ca > 0) { ctx.globalAlpha = 0.5 * ca; ctx.beginPath(); lines.forEach(l => { ctx.moveTo(stars[l[0]].x, stars[l[0]].y); ctx.lineTo(stars[l[1]].x, stars[l[1]].y); }); ctx.stroke(); }
    stars.forEach(s => {
      const tw = 0.65 + 0.35 * Math.sin(t * 1.6 + s.ph), z = s.r * 7;
      ctx.globalAlpha = tw; ctx.drawImage(spr, s.x - z, s.y - z, z * 2, z * 2);
      ctx.globalAlpha = 0.95; ctx.fillStyle = col.t; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.75, 0, 6.2832); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (visible && !document.hidden) {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
      if ((tick++ % 120) === 0) colors();
      update(now, dt, now / 1000); draw(now, now / 1000);
    } else last = 0;
    requestAnimationFrame(frame);
  }

  colors(); resize();
  addEventListener('resize', resize);
  document.addEventListener('holo:theme', colors);
  if (reduce) { draw(0, 0); return; }
  if (!coarse) {
    hero.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(hero);
  requestAnimationFrame(frame);
})();
