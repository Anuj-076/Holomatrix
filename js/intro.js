/* Holomatrix brain intro: neurons → 9 thoughts → Holomatrix → thoughts return → shake → explosion → white → curtain */
(function () {
  'use strict';
  const root = document.documentElement;
  const el = document.getElementById('intro');
  if (!el || !root.classList.contains('intro-on')) return;

  const cv = document.getElementById('intro-cv'), ctx = cv.getContext('2d');
  const wrap = document.getElementById('intro-th');
  const flash = el.querySelector('.flash'), dim = el.querySelector('.dim');
  const skipBtn = document.getElementById('intro-skip');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIn = t => t * t * t;
  const backOut = t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

  const THOUGHTS = [
    ['E = mc<sup>2</sup>', 'Mass–energy equivalence'],
    ['F = G·m<sub>1</sub>m<sub>2</sub> / r<sup>2</sup>', 'Gravity'],
    ['iħ ∂ψ/∂t = Ĥψ', 'Schrödinger equation'],
    ['∇ × E = −∂B/∂t', 'Faraday’s law'],
    ['Δx · Δp ≥ ħ/2', 'Uncertainty principle'],
    ['PV = nRT', 'Ideal gas law'],
    ['e<sup>iπ</sup> + 1 = 0', 'Euler’s identity'],
    ['A–T · G–C', 'DNA base pairing'],
    ['v = H<sub>0</sub> · d', 'Hubble’s law']
  ];
  const ORDER = [0, 4, 1, 5, 2, 6, 3, 7, 8];
  const T_FIRST = 1.5, GAP = 0.62, T_BIG = 7.5, T_RET = 9.7, T_SHAKE = 10.5, T_EXP = 11.9;

  const brain = new Path2D('M 92 246 C 52 232, 36 186, 54 146 C 70 104, 122 70, 180 58 C 238 45, 306 42, 360 62 C 412 82, 452 126, 454 176 C 456 218, 432 246, 406 258 C 424 276, 418 306, 384 318 C 350 330, 316 314, 310 292 L 300 300 C 298 330, 294 352, 284 368 L 258 366 C 266 338, 268 316, 258 298 C 232 306, 190 296, 166 276 C 142 288, 108 276, 92 246 Z');
  const SULCI = [
    'M 112 238 C 170 226, 226 214, 300 178', 'M 252 54 C 244 96, 262 126, 238 176', 'M 340 62 C 330 100, 350 130, 336 168',
    'M 70 170 C 100 150, 118 178, 150 156 C 176 140, 190 104, 220 100', 'M 96 214 C 126 198, 150 214, 182 196 C 206 184, 214 150, 244 146',
    'M 180 262 C 214 250, 250 258, 286 246', 'M 372 118 C 396 132, 392 160, 420 172', 'M 360 210 C 390 206, 404 226, 430 222',
    'M 150 84 C 176 96, 196 78, 226 86', 'M 280 70 C 296 88, 320 80, 346 94', 'M 330 290 C 350 296, 372 290, 396 296', 'M 334 304 C 352 310, 370 306, 388 306'
  ].map(d => new Path2D(d));

  const hit = document.createElement('canvas'); hit.width = 500; hit.height = 400;
  const hctx = hit.getContext('2d');
  const nodes = [];
  for (let tries = 0; nodes.length < 70 && tries < 8000; tries++) {
    const x = 40 + Math.random() * 420, y = 40 + Math.random() * 340;
    if (!hctx.isPointInPath(brain, x, y)) continue;
    if (nodes.some(n => Math.hypot(n.x - x, n.y - y) < 24)) continue;
    nodes.push({ x, y, e: 0 });
  }
  const edges = [], adj = nodes.map(() => []), seen = new Set();
  nodes.forEach((a, i) => {
    nodes.map((b, j) => [j, Math.hypot(a.x - b.x, a.y - b.y)]).filter(p => p[0] !== i).sort((p, q) => p[1] - q[1]).slice(0, 3).forEach(p => {
      const k = i < p[0] ? i + '-' + p[0] : p[0] + '-' + i;
      if (p[1] > 90 || seen.has(k)) return;
      seen.add(k); edges.push([i, p[0]]); adj[i].push(p[0]); adj[p[0]].push(i);
    });
  });
  const pulses = [];
  const stars = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.3, p: Math.random() * 6.28 }));

  function sprite(r, g, b) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',1)');
    gr.addColorStop(0.3, 'rgba(' + r + ',' + g + ',' + b + ',0.45)');
    gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c;
  }
  const SPR = [sprite(130, 225, 255), sprite(190, 130, 255), sprite(255, 130, 210)];

  const boxes = THOUGHTS.map((t, i) => {
    const d = document.createElement('div');
    d.className = 'th';
    d.innerHTML = '<div class="f">' + t[0] + '</div><div class="c">' + t[1] + '</div>';
    wrap.appendChild(d);
    return { el: d, i, x: 0, y: 0, w: 0, h: 0, cx: 0, cy: 0, ap: 0, vis: 0 };
  });
  const bigEl = document.createElement('div');
  bigEl.className = 'th big';
  bigEl.innerHTML = '<img src="/logo.jpg" alt=""><span class="rainbow">Holomatrix</span>';
  wrap.appendChild(bigEl);
  boxes.push({ el: bigEl, i: 9, x: 0, y: 0, w: 0, h: 0, cx: 0, cy: 0, ap: 0, vis: 0 });

  let W = 0, H = 0, DPR = 1, bx = 0, by = 0, bwid = 300, bs = 0.6;
  function layout() {
    W = el.clientWidth; H = el.clientHeight; DPR = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const portrait = W < H * 0.85, m = Math.min(W, H);
    el.style.setProperty('--fs', (portrait ? clamp(W * 0.037, 11, 17) : clamp(m * 0.034 + 5, 12, 24)) + 'px');
    boxes.forEach(b => { b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; });
    const nine = boxes.slice(0, 9), half = Math.max.apply(null, nine.map(b => b.w)) / 2, bh1 = Math.max.apply(null, nine.map(b => b.h));
    const big = boxes[9], keepX = x => clamp(x, half + 8, W - half - 8);

    if (!portrait) {
      bwid = Math.min(W * 0.36, H * 0.6 * 1.25); bx = W / 2; by = H * 0.54;
      const ys = [0.22, 0.4, 0.58, 0.76], extra = [0, 0.06 * W, 0.06 * W, 0], inner = bwid / 2 + half + 16;
      for (let k = 0; k < 4; k++) {
        boxes[k].x = keepX(bx - inner - extra[k]); boxes[k].y = H * ys[k];
        boxes[4 + k].x = keepX(bx + inner + extra[k]); boxes[4 + k].y = H * ys[k];
      }
      boxes[8].x = bx; boxes[8].y = Math.min(H - bh1 / 2 - 12, by + bwid * 0.8 * 0.42 + bh1 * 0.8);
      big.x = bx; big.y = clamp(by - bwid * 0.4 - big.h * 0.9, big.h * 0.7, H);
    } else {
      bwid = Math.min(W * 0.58, H * 0.27 * 1.25); bx = W / 2; by = H * 0.52;
      const ys = [0.2, 0.3, 0.74, 0.84];
      for (let k = 0; k < 4; k++) {
        boxes[k].x = keepX(W * 0.24); boxes[k].y = H * ys[k];
        boxes[4 + k].x = keepX(W * 0.76); boxes[4 + k].y = H * ys[k];
      }
      boxes[8].x = bx; boxes[8].y = Math.min(H - bh1 / 2 - 8, H * 0.93);
      big.x = bx; big.y = Math.max(big.h * 0.8, H * 0.085);
    }
    bs = bwid / 500;
  }

  function spawn(a) {
    if (pulses.length > 46 || !nodes.length) return;
    a = a === undefined ? Math.floor(Math.random() * nodes.length) : a;
    const nb = adj[a]; if (!nb.length) return;
    pulses.push({ a, b: nb[Math.floor(Math.random() * nb.length)], t: 0, sp: 1.1 + Math.random() * 1.4 });
    nodes[a].e = Math.max(nodes[a].e, 0.8);
  }

  function drawBrain(t, dt, alpha, shake, rate) {
    ctx.save();
    ctx.translate(bx + (Math.random() - 0.5) * shake, by + (Math.random() - 0.5) * shake);
    ctx.scale(bs, bs); ctx.translate(-250, -200);
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(0, 40, 0, 370);
    g.addColorStop(0, 'rgba(70,130,255,0.24)'); g.addColorStop(1, 'rgba(160,80,255,0.13)');
    ctx.fillStyle = g; ctx.fill(brain);
    ctx.lineWidth = 2.4; ctx.strokeStyle = 'rgba(130,210,255,0.75)'; ctx.shadowColor = 'rgba(80,190,255,0.9)'; ctx.shadowBlur = 20; ctx.stroke(brain); ctx.shadowBlur = 0;
    ctx.save(); ctx.clip(brain);
    ctx.strokeStyle = 'rgba(150,210,255,0.27)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    SULCI.forEach(p => ctx.stroke(p));
    ctx.restore();
    ctx.strokeStyle = 'rgba(120,200,255,0.17)'; ctx.lineWidth = 1; ctx.beginPath();
    edges.forEach(e => { ctx.moveTo(nodes[e[0]].x, nodes[e[0]].y); ctx.lineTo(nodes[e[1]].x, nodes[e[1]].y); });
    ctx.stroke();

    if (Math.random() < rate * dt) spawn();
    ctx.globalCompositeOperation = 'lighter';
    nodes.forEach(n => { const s = 10 + n.e * 28; ctx.globalAlpha = alpha * (0.3 + n.e * 0.7); ctx.drawImage(SPR[0], n.x - s / 2, n.y - s / 2, s, s); n.e *= Math.pow(0.12, dt); });
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i]; p.t += dt * p.sp;
      const A = nodes[p.a], B = nodes[p.b];
      if (p.t >= 1) {
        B.e = 1; pulses.splice(i, 1);
        if (Math.random() < 0.8) { const nb = adj[p.b].filter(k => k !== p.a); if (nb.length) pulses.push({ a: p.b, b: nb[Math.floor(Math.random() * nb.length)], t: 0, sp: p.sp }); }
        continue;
      }
      const x = lerp(A.x, B.x, p.t), y = lerp(A.y, B.y, p.t);
      ctx.globalAlpha = alpha; ctx.drawImage(SPR[(i % 2) + 1], x - 11, y - 11, 22, 22);
    }
    ctx.restore();
  }

  function drawStars(t) {
    ctx.save(); ctx.fillStyle = '#cfe6ff';
    stars.forEach(s => { ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 0.8 + s.p)); ctx.fillRect(s.x * W, s.y * H, s.r, s.r); });
    ctx.restore();
  }

  function tethers(t) {
    ctx.save(); ctx.lineWidth = 1.3; ctx.setLineDash([3, 7]); ctx.lineDashOffset = -t * 30;
    for (let i = 0; i < 9; i++) {
      const b = boxes[i]; if (b.ap <= 0 || b.vis <= 0.02) continue;
      const dx = b.cx - bx, dy = b.cy - by, len = Math.hypot(dx, dy) || 1;
      const sx = bx + dx / len * bwid * 0.2, sy = by + dy / len * bwid * 0.15;
      const ex = lerp(sx, b.cx, b.ap), ey = lerp(sy, b.cy, b.ap);
      ctx.strokeStyle = 'rgba(110,210,255,' + (0.55 * b.vis) + ')';
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      const u = (t * 0.55 + i * 0.23) % 1;
      ctx.save(); ctx.setLineDash([]); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = b.vis;
      ctx.drawImage(SPR[i % 3], lerp(sx, ex, u) - 11, lerp(sy, ey, u) - 11, 22, 22); ctx.restore();
    }
    ctx.restore();
  }

  function updateBoxes(t) {
    const dimf = t < T_BIG ? 1 : 1 - 0.62 * clamp((t - T_BIG) / 0.4, 0, 1);
    ORDER.forEach((bi, k) => {
      const b = boxes[bi];
      const ap = clamp((t - (T_FIRST + k * GAP)) / 0.55, 0, 1), rp = clamp((t - T_RET - k * 0.04) / 0.8, 0, 1);
      let x = b.x + Math.sin(t * 1.2 + bi) * 4, y = b.y + Math.cos(t * 1.0 + bi * 1.7) * 4;
      let sc = ap < 1 ? backOut(ap) : 1, op = ap * dimf;
      if (rp > 0) { const e = easeIn(rp); x = lerp(x, bx, e); y = lerp(y, by, e); sc = lerp(1, 0.15, e); op *= 1 - e; }
      b.ap = ap; b.vis = op; b.cx = x; b.cy = y;
      b.el.style.opacity = op;
      b.el.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%) scale(' + sc + ')';
    });
    const g = boxes[9];
    const ap = clamp((t - T_BIG) / 0.9, 0, 1), rp = clamp((t - T_RET - 0.4) / 0.8, 0, 1);
    let x = g.x, y = g.y, sc = ap < 1 ? backOut(ap) * 1.25 : 1.25 + 0.04 * Math.sin(t * 6), op = ap;
    if (rp > 0) { const e = easeIn(rp); x = lerp(x, bx, e); y = lerp(y, by, e); sc = lerp(sc, 0.12, e); op = 1 - e; }
    g.el.style.opacity = op;
    g.el.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%) scale(' + sc + ')';
    dim.style.opacity = t < T_BIG ? 0 : (t < T_RET ? 0.55 * clamp((t - T_BIG) / 0.5, 0, 1) : 0.55 * (1 - clamp((t - T_RET) / 0.6, 0, 1)));
  }

  const parts = []; let exploded = false;
  function burst() {
    exploded = true;
    const n = W * H > 600000 ? 260 : 160;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, v = (0.25 + Math.random() * 0.9) * Math.max(W, H);
      parts.push({ x: bx + (Math.random() - 0.5) * bwid * 0.5, y: by + (Math.random() - 0.5) * bwid * 0.35, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.9 + Math.random() * 0.9, age: 0, s: 14 + Math.random() * 38, c: SPR[i % 3] });
    }
  }
  function drawBurst(te, dt) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    parts.forEach(p => {
      p.age += dt; if (p.age >= p.life) return;
      const drag = Math.pow(0.05, dt); p.vx *= drag; p.vy *= drag; p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.globalAlpha = 1 - p.age / p.life; ctx.drawImage(p.c, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    });
    ctx.globalAlpha = 1;
    for (let i = 0; i < 3; i++) {
      const r = te * (900 + i * 320) * (W / 1000 + 0.4), a = clamp(1 - te / 0.7, 0, 1);
      ctx.strokeStyle = 'rgba(' + [200, 230, 255][i % 3] + ',230,255,' + a * 0.8 + ')'; ctx.lineWidth = 10 - i * 3;
      ctx.beginPath(); ctx.arc(bx, by, r, 0, 6.283); ctx.stroke();
    }
    ctx.restore();
  }

  let raf = 0, done = false, t0 = 0, last = 0, whiteAt = 0;
  function finish() {
    if (done) return; done = true;
    cancelAnimationFrame(raf); removeEventListener('resize', layout);
    UI.playReveal();
  }
  function frame(now) {
    if (done) return;
    if (!t0) { t0 = last = now; }
    const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, W, H);
    drawStars(t);

    if (t < T_EXP) {
      const fade = clamp(t / 1.3, 0, 1), alpha = easeIn(fade) * 0.4 + fade * 0.6;
      const shake = t > T_SHAKE ? ((t - T_SHAKE) / (T_EXP - T_SHAKE)) * 16 : 0;
      const rate = t < T_FIRST ? 5 : t < T_BIG ? 12 : t < T_RET ? 22 : t < T_SHAKE ? 10 : 34;
      const s0 = bs; bs = s0 * (0.88 + 0.12 * fade);
      drawBrain(t, dt, alpha, shake, rate);
      bs = s0;
    } else if (!exploded) { burst(); }

    updateBoxes(t);
    tethers(t);
    if (exploded) drawBurst(t - T_EXP, dt);

    const fp = clamp((t - T_EXP) / 0.35, 0, 1);
    flash.style.opacity = fp;
    if (fp >= 1) { if (!whiteAt) whiteAt = now; if (now - whiteAt >= 1500) return finish(); }
    raf = requestAnimationFrame(frame);
  }

  try {
    layout();
    addEventListener('resize', layout);
    skipBtn.addEventListener('click', finish);
    addEventListener('keydown', e => { if (e.key === 'Escape') finish(); });
    raf = requestAnimationFrame(frame);
  } catch (err) { finish(); }
})();
