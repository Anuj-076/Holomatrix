/* Interstellar-style black hole, ray-traced on the GPU (WebGL).
   For every pixel a light ray is followed backwards through a Schwarzschild black hole (units: horizon radius = 1).
   Where it crosses the thin accretion disk, light is added (Doppler beaming, gravitational redshift, streaky dust texture).
   The whole texture turns with the disk, so the bent light above and below the logo moves too.
   The shadow (captured rays) is transparent, so the logo underneath is the black circle in the middle.
   Tuning numbers are the #defines at the top of the shader; rotation speed is "0.24 * uTime" in diskShade. */
(function () {
  'use strict';
  const box = document.getElementById('bh'), cv = document.getElementById('bh-gl');
  if (!box || !cv) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, coarse = matchMedia('(pointer: coarse)').matches;

  const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';
  const FS = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uRpx;
uniform float uFlare;
uniform float uRoll;

#define D 30.0        /* camera distance from the black hole */
#define R_IN 3.0      /* inner edge of the disk */
#define R_OUT 12.5    /* outer edge of the disk */
#define EL 0.075      /* camera height above the disk plane (radians): more = more curved front band */
#define EXPOSURE 2.6  /* overall brightness */

float hash3(vec3 p){
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float vnoise(vec3 x){
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash3(i);
  float b = hash3(i + vec3(1.0, 0.0, 0.0));
  float c = hash3(i + vec3(0.0, 1.0, 0.0));
  float d = hash3(i + vec3(1.0, 1.0, 0.0));
  float e = hash3(i + vec3(0.0, 0.0, 1.0));
  float f1 = hash3(i + vec3(1.0, 0.0, 1.0));
  float g = hash3(i + vec3(0.0, 1.0, 1.0));
  float h = hash3(i + vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, f1, f.x), mix(g, h, f.x), f.y), f.z);
}
float fbm(vec3 p){
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 3; i++){
    s += a * vnoise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return s / 0.875;
}
float fbm2(vec3 p){
  float s = 0.5 * vnoise(p);
  p = p * 2.03 + vec3(1.7, 9.2, 3.1);
  s += 0.25 * vnoise(p);
  return s / 0.75;
}

/* white-hot -> cream -> peach -> orange -> rust -> dark brown */
vec3 palette(float t){
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(0.10, 0.05, 0.04);
  vec3 c1 = vec3(0.42, 0.20, 0.11);
  vec3 c2 = vec3(0.80, 0.38, 0.18);
  vec3 c3 = vec3(0.98, 0.66, 0.38);
  vec3 c4 = vec3(1.00, 0.87, 0.70);
  vec3 c5 = vec3(1.00, 0.98, 0.94);
  if (t < 0.2) return mix(c0, c1, t / 0.2);
  if (t < 0.4) return mix(c1, c2, (t - 0.2) / 0.2);
  if (t < 0.6) return mix(c2, c3, (t - 0.4) / 0.2);
  if (t < 0.8) return mix(c3, c4, (t - 0.6) / 0.2);
  return mix(c4, c5, (t - 0.8) / 0.2);
}

/* light emitted by the disk where a ray crosses it. pos = point in the disk plane, nPh = direction the photon travels (towards the camera) */
vec4 diskShade(vec3 pos, vec3 nPh){
  float r = length(pos.xz);
  float th = atan(pos.z, pos.x);
  vec3 vdir = normalize(vec3(pos.z, 0.0, -pos.x));
  float beta = min(sqrt(0.5 / max(r - 1.0, 0.2)), 0.75);
  float gam = 1.0 / sqrt(1.0 - beta * beta);
  float dop = 1.0 / (gam * (1.0 - beta * dot(vdir, nPh)));
  float grav = sqrt(max(1.0 - 1.0 / r, 0.05));
  float g = dop * pow(grav, 0.6);

  /* the texture turns with the disk (rigid rotation + a slow sliding wobble, so it never winds up) */
  float ang = th + 0.24 * uTime + 0.35 * sin(0.21 * uTime + r * 0.75);
  vec3 q1 = vec3(cos(ang) * 5.2, sin(ang) * 5.2, r * 2.0);
  vec3 q2 = vec3(cos(ang + 1.3) * 10.0, sin(ang + 1.3) * 10.0, r * 5.5 + 7.3);
  float n1 = fbm(q1);
  float n2 = fbm2(q2);
  float ln = 0.5 + 0.5 * sin(r * 26.0 + n1 * 9.0 - uTime * 0.6);   /* thin rings, drifting inward */
  float wv = 0.80 + 0.30 * sin(3.0 * ang + r * 1.3);               /* soft arms of light that travel around */
  float tex = (0.30 + 1.0 * n1) * (0.50 + 0.70 * n2) * (0.62 + 0.55 * ln) * wv;

  float ro = R_OUT * (0.80 + 0.32 * n2);
  float eIn = smoothstep(R_IN, R_IN + 0.3, r);
  float eOut = 1.0 - smoothstep(ro * 0.5, ro, r);
  float prof = pow(R_IN / r, 1.45);
  float boost = clamp(pow(g, 2.0), 0.45, 2.1);
  float t = clamp(pow(R_IN / r, 0.72) * pow(g, 0.35), 0.0, 1.0);

  vec3 col = palette(t) * prof * tex * boost * EXPOSURE;
  float grey = smoothstep(0.62, 0.92, n2);
  col = mix(col, vec3(dot(col, vec3(0.3333))) * 1.12, grey * 0.30);
  col *= 1.0 + uFlare * 0.7 * (1.0 - smoothstep(3.0, 8.0, r));

  float dens = eIn * eOut * clamp(0.22 + tex * 0.95, 0.0, 1.0);
  float al = clamp(dens * 0.95, 0.0, 0.96);
  return vec4(col * eIn * eOut, al);
}

void main(){
  /* p = position in units of the shadow radius (the logo circle has radius 1) */
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRpx;
  float cr = cos(uRoll);
  float sr = sin(uRoll);
  vec2 q = vec2(cr * p.x - sr * p.y, sr * p.x + cr * p.y);

  vec3 cam = vec3(0.0, D * sin(EL), D * cos(EL));
  vec3 fw = -normalize(cam);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  float sinTs = (2.598076 / D) * sqrt(1.0 - 1.0 / D);
  float ts = sinTs / sqrt(1.0 - sinTs * sinTs);
  vec3 d = normalize(fw + ts * (q.x * rt + q.y * up));

  /* the ray lives in a plane: spanned by e1 (towards the camera) and e2 */
  vec3 e1 = normalize(cam);
  float cp = dot(d, e1);
  vec3 tg = d - e1 * cp;
  float sp = length(tg);
  vec3 e2 = (sp > 0.00001) ? tg / sp : normalize(cross(e1, vec3(0.0, 1.0, 0.0)));

  /* u = 1/r, bent by gravity: u'' = -u + 1.5 u^2 */
  float u = 1.0 / D;
  float b = max(D * sp / sqrt(1.0 - u), 0.001);
  float v = -sign(cp) * sqrt(max(0.0, 1.0 / (b * b) - u * u + u * u * u));

  vec3 col = vec3(0.0);
  float T = 1.0;
  float phi = 0.0;
  vec3 pPrev = cam;

  for (int i = 0; i < 260; i++){
    float r = 1.0 / u;
    float h = clamp(0.03 * r, 0.014, 0.07);
    float a1 = -u + 1.5 * u * u;
    float un = u + v * h + 0.5 * a1 * h * h;
    if (un >= 1.0) break;
    if (un <= 0.0) break;
    float a2 = -un + 1.5 * un * un;
    float vn = v + 0.5 * (a1 + a2) * h;
    float phin = phi + h;
    float rn = 1.0 / un;
    vec3 pN = rn * (cos(phin) * e1 + sin(phin) * e2);

    if (pPrev.y * pN.y < 0.0){
      float tt = pPrev.y / (pPrev.y - pN.y);
      float um = mix(u, un, tt);
      float vm = mix(v, vn, tt);
      float rm = 1.0 / um;
      float ph = mix(phi, phin, tt);
      vec3 radial = cos(ph) * e1 + sin(ph) * e2;
      vec3 tang = -sin(ph) * e1 + cos(ph) * e2;
      vec3 hit = rm * radial;
      float rr = length(hit.xz);
      if (rr > R_IN && rr < R_OUT){
        vec3 trav = normalize((-vm / (um * um)) * radial + rm * tang);
        vec4 s = diskShade(hit, -trav);
        col += T * s.rgb * s.a;
        T *= (1.0 - s.a);
        if (T < 0.03) break;
      }
    }
    phi = phin;
    u = un;
    v = vn;
    pPrev = pN;
    if (v < 0.0 && u < 1.0 / (R_OUT + 1.5)) break;
  }

  /* thin bright photon ring hugging the shadow + a very soft warm haze */
  float rp = length(p);
  float x1 = (rp - 1.0) / 0.017;
  float x2 = (rp - 1.0) / 0.085;
  col += vec3(1.0, 0.97, 0.92) * exp(-x1 * x1) * 0.95;
  col += vec3(1.0, 0.62, 0.30) * exp(-x2 * x2) * 0.12;
  col += vec3(1.0, 0.55, 0.26) * 0.035 * exp(-max(rp - 1.0, 0.0) * 1.2) * step(1.0, rp);
  col *= 1.0 + uFlare * 0.35;

  /* fade out towards the edges of the canvas */
  vec2 uv = gl_FragCoord.xy / uRes;
  float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y) * 1.6);
  col *= smoothstep(0.0, 0.14, edge);

  col = vec3(1.0) - exp(-col * 1.55);
  float a = max(col.r, max(col.g, col.b));
  gl_FragColor = vec4(col, a);
}`;

  let gl = null, prog = null, raf = 0, visible = true, flare = 0, scale = coarse ? 0.5 : 0.7, lastDraw = 0, frames = 0, slow = 0;
  const U = {}, t0 = performance.now();

  function fail() { box.classList.add('nogl'); }

  function init() {
    gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' }) || cv.getContext('experimental-webgl');
    if (!gl) return false;
    const hp = gl.getShaderPrecisionFormat && gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    if (!hp || !hp.precision) return false;
    const mk = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('Black hole shader:', gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const vs = mk(gl.VERTEX_SHADER, VS), fs = mk(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return false;
    prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn('Black hole link:', gl.getProgramInfoLog(prog)); return false; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['uRes', 'uTime', 'uRpx', 'uFlare', 'uRoll'].forEach(n => { U[n] = gl.getUniformLocation(prog, n); });
    gl.clearColor(0, 0, 0, 0);
    return true;
  }

  function size() {
    if (!gl) return;
    const cw = box.clientWidth || 600, ch = box.clientHeight || cw / 1.6;
    cv.width = Math.max(64, Math.round(cw * scale)); cv.height = Math.max(40, Math.round(ch * scale));
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(U.uRes, cv.width, cv.height);
    gl.uniform1f(U.uRpx, cv.width * 0.115);     // the logo circle is 23% of the box width, so its radius is 11.5%
    gl.uniform1f(U.uRoll, 0.1);                  // slight tilt: right side lower, like the reference
  }

  function draw(t) {
    if (!gl || gl.isContextLost()) return;
    gl.uniform1f(U.uTime, t); gl.uniform1f(U.uFlare, flare);
    gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) { lastDraw = 0; return; }
    if (lastDraw && now - lastDraw < 30) return;           // 30 fps is plenty for slow motion
    const dt = lastDraw ? (now - lastDraw) / 1000 : 0.033;
    if (lastDraw) { frames++; if (now - lastDraw > 55) slow++; }
    lastDraw = now; flare = Math.max(0, flare - dt * 1.2);
    draw((now - t0) / 1000);
    if (frames >= 24) { if (slow > 14 && scale > 0.34) { scale *= 0.82; size(); } frames = 0; slow = 0; }   // slow GPU: lower the resolution
  }

  if (!init()) { fail(); return; }
  box.classList.remove('nogl');
  size();

  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(raf); });
  cv.addEventListener('webglcontextrestored', () => { if (init()) { size(); if (reduce) draw(0); else raf = requestAnimationFrame(frame); } else fail(); });
  window.addEventListener('holo:bh-eat', () => { flare = Math.min(1.4, flare + 0.7); });     // a star fell in: the ring flashes

  if ('ResizeObserver' in window) new ResizeObserver(() => { size(); if (reduce) draw(0); }).observe(box);
  else addEventListener('resize', () => { size(); if (reduce) draw(0); });

  if (reduce) { draw(0); return; }
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(box);
  raf = requestAnimationFrame(frame);
})();
