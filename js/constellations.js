/* Hero constellations: Orion (from the reference picture), Taurus, Canis Major, both Dippers, Cassiopeia. No names or labels.
   Dark mode: white stars, cyan lines.  Light mode: cyan stars, near-black lines.
   Laptop: move the mouse through them and they scatter. Stars that drift near the black hole are pulled in and swallowed.
   Left alone for 90 seconds they re-form, and the swallowed stars come back out of the black hole.
   Phone: they just drift gently. */
(function () {
  'use strict';
  const cv = document.getElementById('hero-stars'); if (!cv) return;
  const ctx = cv.getContext('2d'), hero = cv.parentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, coarse = matchMedia('(pointer: coarse)').matches;
  const REFORM_MS = 90000;

  const CONS = [
    { p: [[78, 116, 0.5], [127, 121, 1.6], [110, 100, 3.4], [97, 173, 1.8], [107, 167, 1.7], [117, 161, 2.2], [90, 218, 2.1], [143, 210, 0.2],
          [68, 98, 4.2], [56, 72, 4.0], [71, 70, 4.2], [68, 37, 4.4], [83, 37, 4.4],
          [175, 97, 4.3], [184, 106, 4.4], [183, 118, 3.6], [181, 133, 4.3], [168, 151, 4.6]],
      l: [[2, 0], [2, 1], [0, 3], [1, 5], [3, 4], [4, 5], [3, 6], [5, 7], [6, 7], [0, 8], [8, 9], [9, 11], [9, 10], [10, 12], [1, 15], [13, 14], [14, 15], [15, 16], [16, 17]] },
    { c: [4.4, 18],  // Taurus with the Pleiades
      s: [[4.599, 16.509, 0.9], [5.438, 28.608, 1.7], [5.627, 21.143, 3.0], [4.330, 15.628, 3.6], [4.382, 17.543, 3.8], [4.477, 19.180, 3.5], [4.478, 15.871, 3.4], [4.700, 22.957, 4.3],
          [4.011, 12.490, 3.4], [3.453, 9.733, 3.7], [3.414, 9.029, 3.6],
          [3.791, 24.105, 2.9], [3.819, 24.053, 3.6], [3.748, 24.113, 3.7], [3.763, 24.368, 3.9], [3.772, 23.948, 4.2], [3.753, 24.467, 4.3]],
      l: [[5, 4], [4, 3], [3, 6], [6, 0], [0, 2], [5, 7], [7, 1], [3, 8], [8, 9], [9, 10], [16, 14], [14, 13], [13, 11], [11, 12], [11, 15]] },
    { c: [6.95, -23],  // Canis Major
      s: [[6.752, -16.716, -1.5], [6.378, -17.956, 2.0], [7.063, -15.633, 4.1], [7.140, -26.393, 1.8], [6.977, -28.972, 1.5], [7.402, -29.303, 2.4], [6.338, -30.063, 3.0], [7.032, -23.833, 3.0]],
      l: [[1, 0], [0, 2], [0, 7], [7, 3], [3, 5], [3, 4], [4, 6]] },
    { c: [12.3, 56],  // Ursa Major: the Big Dipper
      s: [[11.062, 61.751, 1.8], [11.031, 56.382, 2.4], [11.897, 53.695, 2.4], [12.257, 57.033, 3.3], [12.900, 55.960, 1.8], [13.399, 54.925, 2.2], [13.792, 49.313, 1.9]],
      l: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]] },
    { c: [16, 82],  // Ursa Minor: the Little Dipper
      s: [[2.530, 89.264, 2.0], [17.537, 86.586, 4.4], [16.766, 82.037, 4.2], [15.734, 77.795, 4.3], [16.292, 75.755, 5.0], [15.345, 71.834, 3.0], [14.845, 74.156, 2.1]],
      l: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
    { c: [1.0, 60],  // Cassiopeia
      s: [[0.153, 59.150, 2.3], [0.675, 56.537, 2.2], [0.945, 60.717, 2.5], [1.430, 60.235, 2.7], [1.907, 63.670, 3.4]],
      l: [[0, 1], [1, 2], [2, 3], [3, 4]] }
  ];
  // boxes [x, y, w, h] as fractions of the hero. Order: Orion, Taurus, Canis Major, Big Dipper, Little Dipper, Cassiopeia.
  const BOX_L = [[.02, .13, .10, .27], [.03, .72, .27, .23], [.34, .69, .11, .27], [.15, .13, .22, .18], [.40, .125, .10, .26], [.575, .125, .15, .075]];
  const BOX_P = [[.04, .73, .20, .24], [.27, .80, .40, .15], [.70, .73, .26, .22], [.03, .085, .40, .07], [.76, .09, .20, .09], [.46, .09, .28, .05]];

  let W = 0, H = 0, stars = [], lines = [], bg = [], mode = 'formed', lastTouch = 0, ret0 = 0, tick = 0, visible = true, spr = null, last = 0, light = false;
  const mouse = { x: -9999, y: -9999 }, col = { line: '#4de1ff', dot: '#ffffff', glow: '#4de1ff', rim: null };

  function bh() {
    const c = document.querySelector('.bh-core'); if (!c) return null;
    const hr = hero.getBoundingClientRect(), cr = c.getBoundingClientRect(); if (!cr.width) return null;
    return { x: cr.left - hr.left + cr.width / 2, y: cr.top - hr.top + cr.height / 2, r: cr.width / 2 };
  }

  function project(cn) {
    if (cn.p) return cn.p.map(s => ({ x: s[0], y: -s[1], mag: s[2] }));
    const R = Math.PI / 180, a0 = cn.c[0] * 15 * R, d0 = cn.c[1] * R;
    return cn.s.map(s => {
      const a = s[0] * 15 * R, d = s[1] * R, da = a - a0;
      const k = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(da);
      return { x: -(Math.cos(d) * Math.sin(da)) / k, y: (Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(da)) / k, mag: s[2] };
    });
  }

  function colors() {
    const cs = getComputedStyle(document.documentElement), hex = v => /^#[0-9a-f]{6}$/i.test(v);
    light = document.documentElement.getAttribute('data-theme') === 'light';
    const acc = cs.getPropertyValue('--accent').trim(), txt = cs.getPropertyValue('--text').trim();
    if (light) { col.line = hex(txt) ? txt : '#0c1224'; col.dot = '#06b6d4'; col.glow = '#22d3ee'; col.rim = '#0e7490'; }
    else { col.line = hex(acc) ? acc : '#4de1ff'; col.dot = hex(txt) ? txt : '#ffffff'; col.glow = hex(acc) ? acc : '#4de1ff'; col.rim = null; }
    spr = document.createElement('canvas'); spr.width = spr.height = 48;
    const x = spr.getContext('2d'), g = x.createRadialGradient(24, 24, 0, 24, 24, 24);
    g.addColorStop(0, col.glow + 'aa'); g.addColorStop(0.3, col.glow + '44'); g.addColorStop(1, col.glow + '00');
    x.fillStyle = g; x.fillRect(0, 0, 48, 48);
  }

  function build() {
    const boxes = W < H * 0.9 ? BOX_P : BOX_L, old = stars; stars = []; lines = [];
    CONS.forEach((cn, gi) => {
      const pts = project(cn), b = boxes[gi], base = stars.length;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      pts.forEach(p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
      const w = x1 - x0 || 1, h = y1 - y0 || 1, bw = b[2] * W, bh2 = b[3] * H, k = Math.min(bw / w, bh2 / h);
      const ox = b[0] * W + (bw - w * k) / 2, oy = b[1] * H + (bh2 - h * k) / 2;
      pts.forEach((p, i) => {
        const hx = ox + (p.x - x0) * k, hy = oy + (y1 - p.y) * k, o = old[base + i];
        stars.push({ hx, hy, x: o ? o.x : hx, y: o ? o.y : hy, vx: o ? o.vx : 0, vy: o ? o.vy : 0, g: gi, dead: o ? o.dead : false, fade: o ? o.fade : 1, r: Math.max(1.5, Math.min(5, 1.7 + (4.6 - p.mag) * 0.55)), ph: Math.random() * 6.28 });
      });
      cn.l.forEach(l => lines.push([base + l[0], base + l[1]]));
    });
    if (!bg.length) bg = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + 0.3, p: Math.random() * 6.28 }));
  }
  function resize() {
    const r = hero.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); build();
  }

  function update(now, dt, t) {
    const B = bh();
    if (!coarse && mouse.x > -999) {
      let hit = false;
      for (const s of stars) { if (!s.dead && Math.hypot(s.x - mouse.x, s.y - mouse.y) < 130) { hit = true; break; } }
      if (hit) { mode = 'free'; lastTouch = now; }
    }
    if (mode === 'free' && now - lastTouch > REFORM_MS) {
      mode = 'ret'; ret0 = now;
      stars.forEach(s => { if (s.dead) { s.dead = false; s.fade = 0; s.vx = s.vy = 0; if (B) { s.x = B.x; s.y = B.y; } else s.fade = 1; } });
    }
    if (mode === 'ret' && now - ret0 > 7000) mode = 'formed';

    for (const s of stars) {
      if (s.dead) continue;
      const tx = s.hx + Math.sin(t * 0.15 + s.g * 1.7) * 8 + Math.sin(t * 0.8 + s.ph) * 1.2;
      const ty = s.hy + Math.cos(t * 0.12 + s.g * 2.3) * 6 + Math.cos(t * 0.7 + s.ph) * 1.2;
      if (mode === 'formed') { s.x = tx; s.y = ty; s.vx = s.vy = 0; s.fade = 1; }
      else if (mode === 'ret') { const k = 1 - Math.exp(-dt * 0.9); s.x += (tx - s.x) * k; s.y += (ty - s.y) * k; s.fade = Math.min(1, s.fade + dt * 0.6); }
      else {
        s.vx += (Math.random() - 0.5) * 40 * dt; s.vy += (Math.random() - 0.5) * 40 * dt;
        const dx = s.x - mouse.x, dy = s.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 130 && d > 0) { const f = (130 - d) / 130; s.vx += dx / d * f * 600 * dt; s.vy += dy / d * f * 600 * dt; }
        const sp = Math.hypot(s.vx, s.vy); if (sp > 220) { s.vx *= 220 / sp; s.vy *= 220 / sp; }
        s.vx *= Math.pow(0.5, dt); s.vy *= Math.pow(0.5, dt);

        if (B) {
          const gx = B.x - s.x, gy = B.y - s.y, dd = Math.hypot(gx, gy) || 1, gr = B.r * 3.0, k = B.r / 60;
          if (dd < gr) {
            const a = k * (900 * Math.pow(1 - dd / gr, 1.2) + 4000 * Math.pow(B.r / Math.max(dd, B.r * 0.5), 2));
            s.vx += (gx / dd) * a * dt + (-gy / dd) * a * 0.35 * dt;
            s.vy += (gy / dd) * a * dt + (gx / dd) * a * 0.35 * dt;
            const v = Math.hypot(s.vx, s.vy); if (v > 900 * k) { s.vx *= 900 * k / v; s.vy *= 900 * k / v; }
            s.fade = Math.max(0, Math.min(1, (dd - B.r * 0.8) / (B.r * 1.1)));
            if (dd < B.r * 0.92) { s.dead = true; window.dispatchEvent(new Event('holo:bh-eat')); continue; }
          } else s.fade = Math.min(1, s.fade + dt * 2);
        }
        s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.x < 0 || s.x > W) { s.vx *= -1; s.x = Math.min(W, Math.max(0, s.x)); }
        if (s.y < 0 || s.y > H) { s.vy *= -1; s.y = Math.min(H, Math.max(0, s.y)); }
      }
    }
  }

  function draw(now, t) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = light ? col.dot : col.dot;
    bg.forEach(b => { ctx.globalAlpha = (light ? 0.25 : 0.15) + 0.3 * Math.abs(Math.sin(t * 0.6 + b.p)); ctx.fillRect(b.x * W, b.y * H, b.r, b.r); });
    const ca = mode === 'formed' ? 1 : mode === 'ret' ? Math.min(1, (now - ret0) / 6000) : 0;
    ctx.lineWidth = 1.3; ctx.strokeStyle = col.line;
    if (ca < 1) {
      for (let i = 0; i < stars.length; i++) { if (stars[i].dead) continue; for (let j = i + 1; j < stars.length; j++) {
        if (stars[j].dead) continue;
        const d = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y);
        if (d < 120) { ctx.globalAlpha = (1 - d / 120) * 0.3 * (1 - ca) * Math.min(stars[i].fade, stars[j].fade); ctx.beginPath(); ctx.moveTo(stars[i].x, stars[i].y); ctx.lineTo(stars[j].x, stars[j].y); ctx.stroke(); }
      } }
    }
    if (ca > 0) {
      ctx.lineWidth = 1.6;
      lines.forEach(l => {
        const a = stars[l[0]], b = stars[l[1]]; if (a.dead || b.dead) return;
        ctx.globalAlpha = (light ? 0.7 : 0.65) * ca * Math.min(a.fade, b.fade); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
    }
    stars.forEach(s => {
      if (s.dead) return;
      const tw = 0.7 + 0.3 * Math.sin(t * 1.6 + s.ph), z = s.r * 3.6 * s.fade;
      ctx.globalAlpha = (light ? 0.45 : 0.5) * tw * s.fade; ctx.drawImage(spr, s.x - z, s.y - z, z * 2, z * 2);
      ctx.globalAlpha = 0.98 * s.fade; ctx.fillStyle = col.dot; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.75 * s.fade, 0, 6.2832); ctx.fill();
      if (col.rim) { ctx.strokeStyle = col.rim; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.75 * s.fade, 0, 6.2832); ctx.stroke(); ctx.strokeStyle = col.line; }
    });
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (visible && !document.hidden) {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
      if ((tick++ % 60) === 0) colors();
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
