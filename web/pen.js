// Small 2D drawing kit for flat cartoon cards: plum ink outlines, soft crescent shading.
export const INK = "#241726";
export const WHITE = "#ffffff";
export const rad = (d) => (d * Math.PI) / 180;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const hexMul = (c, k) => {
  const n = parseInt(c.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
};
export const mix = (a, b, t) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
export const rnd = (seed, k) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

export const ellPts = (cx, cy, rx, ry, a0 = 0, a1 = 360, rot = 0, n = 48) => {
  const r = rad(rot), out = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n), x = rx * Math.cos(a), y = ry * Math.sin(a);
    out.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return out;
};
/** superellipse bean: separate top/bottom exponents, egg taper, side bulge */
export const bean = (cx, cy, a, b, o = {}) => {
  const { nTop = 2.0, nBot = 2.4, egg = 0, asym = 0, rot = 0, n = 64 } = o, out = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / (s < 0 ? nTop : nBot);
    let X = Math.sign(c) * Math.abs(c) ** e;
    const Y = Math.sign(s) * Math.abs(s) ** e;
    X *= (1 + egg * Y) * (1 + asym * Math.sign(X));
    const x = a * X, y = b * Y, r = rad(rot);
    out.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return out;
};
export const rrect = (x0, y0, x1, y1, r, n = 6) => {
  const out = [];
  for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]])
    for (let i = 0; i <= n; i++) out.push([cx + r * Math.cos(rad(a + (90 * i) / n)), cy + r * Math.sin(rad(a + (90 * i) / n))]);
  return out;
};
/** quadratic curve through (near) k */
export const curve = (a, k, b, n = 12) => {
  const c = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, s = 1 - t;
    out.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]);
  }
  return out;
};
export const rotPts = (pts, ang, cx, cy) => pts.map(([x, y]) => [cx + (x - cx) * Math.cos(ang) - (y - cy) * Math.sin(ang), cy + (x - cx) * Math.sin(ang) + (y - cy) * Math.cos(ang)]);

export class Pen {
  constructor(g) { this.g = g; this.ol = 10; }
  path(pts, close) {
    const g = this.g; g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    if (close) g.closePath();
  }
  poly(pts, fill, ol) {
    const g = this.g, w = ol ?? this.ol;
    this.path(pts, true);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (w) { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(); }
  }
  ell(cx, cy, rx, ry, fill, ol, a0 = 0, a1 = 360, rot = 0) { this.poly(ellPts(cx, cy, rx, ry, a0, a1, rot), fill, ol); }
  stroke(pts, w, col = INK, cap = "round") {
    const g = this.g; g.lineCap = cap; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = col; g.lineWidth = w; g.stroke();
  }
  /** limb: ink rim + colour core */
  limb(pts, w, col, rim = 7) { this.stroke(pts, w + 2 * rim); this.stroke(pts, w, col); }
  band(pts, fill, w, rim = 3, cap = "round") { this.stroke(pts, w + 2 * rim, INK, cap); this.stroke(pts, w, fill, cap); }
  arc(cx, cy, rx, ry, a0, a1, w, col = INK) {
    const pts = []; for (let i = 0; i <= 24; i++) { const a = rad(a0 + ((a1 - a0) * i) / 24); pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    this.stroke(pts, w, col);
  }
  dot(x, y, r, col = INK) { const g = this.g; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = col; g.fill(); }
  clip(pts, fn) { const g = this.g; g.save(); this.path(pts, true); g.clip(); fn(); g.restore(); }
  /** flat fill + soft crescent away from the light (light angle = where light comes FROM, canvas radians) */
  shaded(pts, base, shadow, light = rad(-130), R = 100, shift = 0.45) {
    const g = this.g, n = pts.length; let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const gx = cx + Math.cos(light) * shift * R, gy = cy + Math.sin(light) * shift * R;
    const gr = g.createRadialGradient(gx, gy, 0, gx, gy, 1.3 * R);
    gr.addColorStop(0, base); gr.addColorStop(0.8, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  /** linear light-to-shadow fill across a shape */
  grad(pts, base, shadow, light = rad(-130), flat = 0.3) {
    const g = this.g, dx = Math.cos(light), dy = Math.sin(light), n = pts.length;
    let cx = 0, cy = 0, lo = Infinity, hi = -Infinity;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; const d = x * dx + y * dy; lo = Math.min(lo, d); hi = Math.max(hi, d); }
    const dc = cx * dx + cy * dy;
    const gr = g.createLinearGradient(cx + dx * (hi - dc), cy + dy * (hi - dc), cx + dx * (lo - dc), cy + dy * (lo - dc));
    gr.addColorStop(0, base); gr.addColorStop(flat, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  /** thick-thin outline: thicker away from the light, toward the ground */
  ring(pts, w0, light = rad(-130), k = 0.5) {
    const n = pts.length; let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const thick = Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));
    const out = [], inn = [];
    pts.forEach((q, i) => {
      const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
      let nx = b[1] - a[1], ny = a[0] - b[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
      out.push([q[0] + nx * h, q[1] + ny * h]); inn.push([q[0] - nx * h, q[1] - ny * h]);
    });
    const g = this.g; g.beginPath();
    const tr = (r) => { r.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    tr(out); tr(inn.reverse()); g.fillStyle = INK; g.fill("evenodd");
  }
  /** shaded shape + ring in one call */
  form(pts, base, k = 0.72, w = 10, light = rad(-130), R) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    this.shaded(pts, base, hexMul(base, k), light, R ?? 0.5 * Math.max(x1 - x0, y1 - y0));
    this.ring(pts, w, light);
  }
}
