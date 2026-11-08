/* Black hole behind the logo: bent light above and below, a tilted glowing disk, a thin bright ring.
   The logo is the black circle in the middle. Colours follow the reference: white-hot → cream → orange → copper → brown.
   Stars swallowed by the black hole (see constellations.js) make the ring flash. */
(function () {
  'use strict';
  const box = document.getElementById('bh'); if (!box) return;
  const bk = document.getElementById('bh-back'), fr = document.getElementById('bh-front');
  const bx = bk.getContext('2d'), fx = fr.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2, TILT = 0.1;
  let S = 0, R = 0, cx = 0, cy = 0, dpr = 1, visible = true, flare = 0, last = 0, GB = [], GF = [];
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  const PAL = [[0, [255, 252, 246]], [0.22, [255, 226, 190]], [0.5, [238, 160, 100]], [0.78, [176, 98, 58]], [1, [96, 56, 40]]];
  const pal = u => { u = Math.max(0, Math.min(1, u)); for (let i = 1; i < PAL.length; i++) if (u <= PAL[i][0]) { const a = PAL[i - 1], b = PAL[i], k = (u - a[0]) / (b[0] - a[0]); return [0, 1, 2].map(j => Math.round(a[1][j] + (b[1][j] - a[1][j]) * k)); } return PAL[PAL.length - 1][1]; };
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';

  const UP = [], LO = [], RB = [];
  for (let i = 0; i < 46; i++) { const u = i / 45; UP.push({ u, w: 0.7 + rnd() * 1.9, a: (0.12 + Math.pow(1 - u, 1.15) * 0.85) * (0.55 + rnd() * 0.45), d: [10 + rnd() * 70, 3 + rnd() * 34], sp: 10 + rnd() * 26, ph: rnd() * 200, ext: 0.1 + u * 0.4 }); }
  for (let i = 0; i < 20; i++) { const u = i / 19; LO.push({ u, w: 0.7 + rnd() * 1.4, a: (0.1 + Math.pow(1 - u, 1.3) * 0.5) * (0.5 + rnd() * 0.5), d: [8 + rnd() * 50, 4 + rnd() * 30], sp: 8 + rnd() * 18, ph: rnd() * 200 }); }
  for (let j = 0; j < 32; j++) { const v = -1 + 2 * (j / 31) + (rnd() - 0.5) * 0.05; RB.push({ v, w: 0.6 + rnd() * 1.5, a: 0.3 + rnd() * 0.65, d: [18 + rnd() * 100, 4 + rnd() * 56], sp: 16 + rnd() * 70, ph: rnd() * 300, pts: [] }); }

  // the glowing disk: a tapered band tilted slightly, brightest next to the hole, whiter on the left
  function bandGrad(c, v) {
    const g = c.createLinearGradient(cx - 3.4 * R, 0, cx + 3.4 * R, 0), m = Math.pow(Math.abs(v), 1.1), brown = [120, 66, 44];
    const mix = col => col.map((x, i) => Math.round(x + (brown[i] - x) * m));
    [[0, [120, 70, 48], 0], [0.1, [186, 110, 70], 0.35], [0.24, [255, 196, 140], 0.85], [0.36, [255, 244, 232], 1], [0.5, [255, 250, 244], 1], [0.64, [255, 232, 206], 0.92], [0.76, [244, 168, 108], 0.7], [0.9, [160, 92, 58], 0.3], [1, [100, 60, 44], 0]]
      .forEach(s => g.addColorStop(s[0], rgba(mix(s[1]), s[2] * (1 - 0.35 * m))));
    return g;
  }

  function resize() {
    S = box.clientWidth || 300; dpr = Math.min(devicePixelRatio || 1, 2); R = S * 0.12; cx = cy = S / 2;
    [bk, fr].forEach(c => { c.width = Math.round(S * dpr); c.height = Math.round(S * dpr); });
    bx.setTransform(dpr, 0, 0, dpr, 0, 0); fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    GB = RB.map(r => bandGrad(bx, r.v)); GF = RB.map(r => bandGrad(fx, r.v));
    RB.forEach(r => {
      r.pts = [];
      for (let k = 0; k <= 56; k++) {
        const x = cx - 3.4 * R + (k / 56) * 6.8 * R, dx = Math.abs(x - cx), h = 0.2 * R * Math.exp(-Math.pow(dx / (1.55 * R), 1.25)) + 0.02 * R;
        r.pts.push([x, cy + 0.8 * R + (x - cx) * TILT + r.v * h]);
      }
    });
  }

  function drawBand(c, G, t) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    RB.forEach((r, j) => {
      c.beginPath(); r.pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
      c.strokeStyle = G[j]; c.lineWidth = r.w;
      c.setLineDash([]); c.globalAlpha = r.a * 0.28 * (1 + flare * 0.6); c.stroke();                     // smooth base
      c.setLineDash(r.d.map(x => x * R / 60)); c.lineDashOffset = -(t * r.sp + r.ph) * R / 60;            // flowing texture
      c.globalAlpha = Math.min(1, r.a * (1 + flare * 0.8)); c.stroke();
    });
    c.setLineDash([]); c.globalAlpha = 1;
  }

  function drawBack(t) {
    bx.clearRect(0, 0, S, S); bx.globalCompositeOperation = 'lighter';
    const gl = bx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 3.1);
    gl.addColorStop(0, 'rgba(255,170,100,' + (0.1 + 0.08 * flare) + ')'); gl.addColorStop(1, 'rgba(255,170,100,0)');
    bx.fillStyle = gl; bx.fillRect(0, 0, S, S);

    UP.forEach(s => {                                           // light bent over the top of the hole
      const r = R * (1.045 + Math.pow(s.u, 1.55) * 0.98), col = rgba(pal(s.u), 1);
      bx.beginPath(); bx.arc(cx, cy, r, Math.PI - s.ext, TAU + s.ext);
      bx.strokeStyle = col; bx.lineWidth = s.w; bx.setLineDash(s.d.map(x => x * R / 60)); bx.lineDashOffset = -(t * s.sp + s.ph) * R / 60;
      bx.globalAlpha = Math.min(1, s.a * (1 + flare * 0.5)); bx.stroke();
      if (s.u < 0.22) { bx.setLineDash([]); bx.lineWidth = 6; bx.globalAlpha = 0.05 + flare * 0.05; bx.stroke(); }
    });
    LO.forEach(s => {                                           // fainter light bent under the hole
      const r = R * (1.06 + Math.pow(s.u, 1.3) * 0.55);
      bx.beginPath(); bx.ellipse(cx, cy + 0.04 * R, r, r * 0.8, 0, 0.05, Math.PI - 0.05);
      bx.strokeStyle = rgba(pal(0.25 + s.u * 0.75), 1); bx.lineWidth = s.w; bx.setLineDash(s.d.map(x => x * R / 60)); bx.lineDashOffset = (t * s.sp + s.ph) * R / 60;
      bx.globalAlpha = Math.min(1, s.a * (1 + flare * 0.5)); bx.stroke();
    });
    bx.setLineDash([]); bx.globalAlpha = 1;
    drawBand(bx, GB, t);
  }

  function drawFront(t) {
    fx.clearRect(0, 0, S, S); fx.globalCompositeOperation = 'lighter';
    fx.save(); fx.beginPath(); fx.arc(cx, cy, R, 0, TAU); fx.clip(); drawBand(fx, GF, t); fx.restore();   // disk crosses the logo's lower edge

    const g = fx.createLinearGradient(0, cy - R, 0, cy + R);                                              // thin bright ring hugging the logo
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,248,236,0.85)'); g.addColorStop(1, 'rgba(255,214,170,0.25)');
    fx.beginPath(); fx.arc(cx, cy, R * 1.012, 0, TAU);
    fx.strokeStyle = g; fx.lineWidth = Math.max(1.4, R * 0.03); fx.globalAlpha = Math.min(1, 0.9 + flare * 0.1); fx.stroke();
    fx.strokeStyle = 'rgb(255,215,170)'; fx.lineWidth = R * 0.12; fx.globalAlpha = 0.1 + 0.12 * flare; fx.stroke();
    fx.globalAlpha = 1;
  }

  function frame(now) {
    if (visible && !document.hidden) {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
      flare = Math.max(0, flare - dt * 1.2);
      drawBack(now / 1000); drawFront(now / 1000);
    } else last = 0;
    requestAnimationFrame(frame);
  }

  resize();
  addEventListener('resize', () => { resize(); if (reduce) { drawBack(0); drawFront(0); } });
  window.addEventListener('holo:bh-eat', () => { flare = Math.min(1.4, flare + 0.7); });   // a star fell in
  if (reduce) { drawBack(0); drawFront(0); return; }
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(box);
  requestAnimationFrame(frame);
})();
