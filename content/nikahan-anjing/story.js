// Story timeline for "Nikahan Anjing" (66.2 s, 1985 frames @ 30 fps). Everything is a pure function of the frame.
import * as C from "./cast.js";

export const FPS = 30, TOTAL = 1985;
let G = () => 0;
export const setGround = (fn) => { G = fn; };

// ---------- easing ----------
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const smooth = (x) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (x) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
export const easeOut = (x) => 1 - (1 - clamp01(x)) ** 3;
export const back = (x) => { const u = clamp01(x), c = 1.9; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2; };
export const act = (f, f0, dur, antic = 0.15, a = 0.28) => {
  const u = (f - f0) / dur;
  if (u <= 0) return 0;
  if (u < a) return -antic * Math.sin((Math.PI / 2) * (u / a));
  if (u < 1) return -antic + (1 + antic) * back((u - a) / (1 - a));
  return 1;
};
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const hexLerp = (a, b, t) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
const rnd = (seed, k) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const idle = (f, seed) => ({ bob: 4 * Math.sin(f * 0.11 + seed * 2.1), tilt: 0.8 * Math.sin(f * 0.07 + seed), headTilt: 1.6 * Math.sin(f * 0.09 + seed * 1.7) });
const blinkAt = (f, seed) => { const per = 70 + (seed * 17) % 40, ph = (f + seed * 23) % per; return ph < 2 ? 1 : ph < 4 ? 0.5 : 0; };


// ---------- timing (frames, from the tightened voiceover) ----------
export const T = {
  hook: 0, pengantin: 138, anjing: 169, dia: 203, penguasa: 255, ratusan: 350, tiap: 407, tahun: 501, kesayangan: 565, roshanara: 608,
  nikah: 638, bobby: 755, sutra: 845, diarak: 942, libur: 1024, gubernur: 1130, menolak: 1193, biaya: 1245, konon1: 1283, setara: 1306,
  t1947: 1395, kabur: 1461, harta: 1550, istri: 1585, anjing2: 1605, konon2: 1659, turun: 1683, kursi: 1806, berangkat: 1897, end: 1927,
};
const OZ = -500, RZ = 1500, AZ = 3000;

// ---------- lights ----------
export const LIGHTS = {
  day: { tLit: [1.06, 1.0, 0.9], tShade: [0.5, 0.49, 0.62], tLift: [0.03, 0.04, 0.07], tLambert: 0.35, tSideK: 0.84, tTerm: 0.2, tSat: 1.05, tBounce: [0, 0, 0], cardShadow: 0.64, contrast: 0.22, shTint: [-0.01, 0.0, 0.035], hiTint: [0.02, 0.015, 0.0], sun: "#fff3df", sunI: 0.95, sky: "#cfe8ff", ground: "#8f7f5a", hemiI: 0.62, az: -35, el: 50, skyTop: "#4aa3e4", skyHor: "#d5ecf4", cloud: "#ffffff", cardTint: "#ffffff", sat: 1.08, gain: [1.0, 1.0, 1.0] },
  golden: { tLit: [1.12, 0.9, 0.7], tShade: [0.6, 0.52, 0.6], tLift: [0.03, 0.03, 0.05], tLambert: 0.3, tSideK: 0.86, tTerm: 0.12, tSat: 1.08, tBounce: [0.06, 0.03, 0], contrast: 0.28, shTint: [0.03, -0.01, 0.05], hiTint: [0.04, 0.015, -0.02], cardShadow: 0.6, sun: "#ffc68c", sunI: 1.05, sky: "#ffd7b0", ground: "#6d5e40", hemiI: 0.55, az: -60, el: 22, skyTop: "#6f8ed6", skyHor: "#ffc89c", cloud: "#ffd8b8", cardTint: "#fff0dc", sat: 1.1, gain: [1.03, 0.98, 0.93] },
  room: { tLit: [1.05, 0.95, 0.82], tShade: [0.6, 0.5, 0.46], tLift: [0.03, 0.03, 0.03], tLambert: 0.35, tSideK: 0.86, tTerm: 0.3, tSat: 1.0, tBounce: [0, 0, 0], cardShadow: 0.64, contrast: 0.24, shTint: [0.02, 0.0, 0.02], hiTint: [0.04, 0.02, 0.0], sun: "#ffe9c8", sunI: 0.8, sky: "#ffeed8", ground: "#7a5a40", hemiI: 0.8, az: 40, el: 40, skyTop: "#3a2a24", skyHor: "#3a2a24", cloud: "#ffffff", cardTint: "#fff6ea", sat: 1.08, shadow: false, fogN: 400, fogF: 2000, gain: [1.02, 1.0, 0.97] },
};

// ---------- shots ----------
export const SHOTS = [
  { id: 1, a: 0, b: 203, light: "day" },        // the wedding: bride and groom are dogs
  { id: 2, a: 203, b: 407, light: "room" },     // the Nawab in his durbar hall; hundreds of dogs
  { id: 3, a: 407, b: 501, light: "day" },      // kennels, each with a servant
  { id: 4, a: 501, b: 755, light: "golden" },   // Roshanara meets Bobby
  { id: 5, a: 755, b: 942, light: "day" },      // station: band + 250 dogs in silk
  { id: 6, a: 942, b: 1130, light: "day" },     // silver palanquin, holiday stamp
  { id: 7, a: 1130, b: 1245, light: "room" },   // the Governor General declines
  { id: 8, a: 1245, b: 1395, light: "golden" }, // the cost
  { id: 9, a: 1395, b: 1659, light: "day" },    // 1947: boarding the plane
  { id: 10, a: 1659, b: 1806, light: "day" },   // one wife steps off for the child
  { id: 11, a: 1806, b: 1897, light: "day" },   // her seat goes to two dogs
  { id: 12, a: 1897, b: TOTAL, light: "day" },  // the plane leaves
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const lightAt = (f) => LIGHTS[shotAt(f).light];
const FLASH = [[T.anjing, 0.3], [T.ratusan, 0.25], [T.libur, 0.35], [T.menolak, 0.3], [T.setara, 0.25], [1832, 0.3]];
export const flashAt = (f) => { let v = 0; for (const [a, k] of FLASH) if (f >= a && f < a + 5) v = Math.max(v, k * (1 - (f - a) / 5)); return v; };

// ---------- cameras: [frame, pos, look, fov, roll] ----------
const DX = -4.6, DZ = AZ + 1.25; // plane door
const CAMS = {
  1: [[0, [0, 2.3, 8.6], [0, 1.6, -2.6], 40, 0], [138, [0, 2.1, 7.2], [0, 1.55, -2.6], 40, 0], [138, [0, 1.75, 1.6], [0, 1.35, -2.6], 34, 0], [203, [0, 1.72, 1.2], [0, 1.35, -2.6], 33, 0]],
  2: [[203, [0, 1.6, OZ + 1.2], [0, 1.4, OZ - 3.2], 36, 0], [343, [0, 1.6, OZ + 0.4], [0, 1.4, OZ - 3.2], 34, 0], [350, [0, 1.65, OZ + 0.2], [0, 1.4, OZ - 3.2], 34, 0], [375, [0, 3.6, OZ + 5.4], [0, 0.6, OZ - 2.2], 46, 0], [407, [0, 3.8, OZ + 5.6], [0, 0.6, OZ - 2.2], 46, 0]],
  3: [[407, [19.2, 1.7, 1.6], [26.5, 0.7, -4.0], 40, 0], [501, [20.2, 1.7, 1.2], [28.5, 0.7, -4.0], 40, 0]],
  4: [[501, [-20.3, 1.15, 4.4], [-20.4, 0.75, 1.3], 40, 0], [638, [-20.3, 1.15, 4.0], [-20.4, 0.75, 1.3], 38, 0], [638, [-19.9, 1.35, 6.6], [-19.9, 0.8, 1.3], 42, 0], [755, [-19.9, 1.35, 6.1], [-19.9, 0.8, 1.3], 41, 0]],
  5: [[755, [-1.4, 2.1, RZ + 3.2], [-2.0, 1.75, RZ - 6.0], 42, 0], [845, [-1.6, 2.1, RZ + 2.6], [-2.0, 1.75, RZ - 6.0], 42, 0], [845, [-7.0, 2.3, RZ + 2.6], [-9.0, 1.3, RZ - 3.5], 44, 0], [942, [-7.6, 2.3, RZ + 2.2], [-10.0, 1.3, RZ - 3.5], 44, 0]],
  6: [[942, [-8.5, 1.8, 13.5], [-6, 1.3, 6.8], 42, 0], [1024, [-5.5, 1.8, 13.2], [-3, 1.3, 6.8], 42, 0], [1130, [-2.5, 1.8, 13.0], [0, 1.3, 6.8], 42, 0]],
  7: [[1130, [20.2, 1.55, OZ + 1.9], [20.1, 1.3, OZ - 2.0], 40, 0], [1245, [20.2, 1.55, OZ + 1.3], [20.1, 1.32, OZ - 2.0], 38, 0]],
  8: [[1245, [-20, 1.45, 5.6], [-20, 1.1, 1.4], 40, 0], [1300, [-20, 1.45, 5.0], [-20, 1.15, 1.4], 40, 0], [1395, [-20, 1.6, 6.2], [-20, 1.3, 1.4], 44, 0]],
  9: [[1395, [-1.0, 3.2, AZ + 16], [-2.5, 2.2, AZ], 44, 0], [1461, [-3.0, 1.9, AZ + 10.5], [-4.6, 1.35, AZ + 1.6], 44, 0], [1659, [-3.2, 1.9, AZ + 9.8], [-4.6, 1.35, AZ + 1.8], 44, 0]],
  10: [[1659, [-3.4, 1.8, AZ + 9.6], [-4.9, 1.3, AZ + 2.0], 44, 0], [1806, [-3.8, 1.7, AZ + 10.4], [-5.6, 1.1, AZ + 3.0], 46, 0]],
  11: [[1806, [-0.925, 2.42, AZ + 4.1], [-0.925, 2.42, AZ], 34, 0], [1812, [-0.925, 2.42, AZ + 4.1], [-0.925, 2.42, AZ], 34, 0], [1826, [0.2, 2.42, AZ + 4.1], [0.2, 2.42, AZ], 34, 0], [1858, [0.2, 2.42, AZ + 4.1], [0.2, 2.42, AZ], 34, 0], [1897, [-0.36, 2.42, AZ + 6.6], [-0.36, 2.42, AZ], 34, 0]],
  12: [[1897, [-22, 1.6, AZ + 2.6], [10, 2.4, AZ + 0.2], 44, 0], [TOTAL, [-22.3, 1.6, AZ + 2.6], [10, 3.0, AZ + 0.2], 44, 0]],
};
const KICKS = [[T.anjing, 0.03], [T.ratusan, 0.03], [T.libur, 0.04], [T.menolak, 0.03], [1832, 0.04]];
export const camAt = (f) => {
  const s = shotAt(f);
  if (s.id === 6) { const px = -9 + (f - 942) * 0.045; return { pos: [px + 1.4, 1.95, 12.6], look: [px + 0.3, 1.25, 6.8], fov: 42, roll: 0 }; }
  const keys = CAMS[s.id], n = keys.length;
  let i = 0;
  while (i < n - 2 && f > keys[i + 1][0]) i++;
  const k0 = keys[i], k1 = keys[Math.min(i + 1, n - 1)];
  const t = k1[0] === k0[0] ? 0 : glide((f - k0[0]) / (k1[0] - k0[0]));
  const pos = lerp3(k0[1], k1[1], t), look = lerp3(k0[2], k1[2], t);
  const crp = 0.008; pos[0] += crp * Math.sin(f * 0.031); pos[1] += crp * Math.sin(f * 0.023 + 1);
  for (const [kf, amp] of KICKS) if (f >= kf && f < kf + 8) { const u = (f - kf) / 8, a = amp * (1 - u) * (1 - u); pos[0] += a * Math.sin(f * 2.9); pos[1] += a * Math.cos(f * 3.7); look[1] += a * 0.6 * Math.sin(f * 4.1); }
  return { pos, look, fov: lerp(k0[3], k1[3], t), roll: lerp(k0[4], k1[4], t) };
};
const dist = (f, p) => { const c = camAt(f).pos; return Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]); };
export const dofAt = (f) => {
  const s = shotAt(f);
  const D = { 1: [f < 138 ? 4 : 7, [0, 1.2, -2.6]], 2: [f < 327 ? 6 : 3, [0, 1.3, OZ - 3.0]], 3: [4, [26, 0.6, -4]], 4: [6, [-19.6, 0.8, 1.6]], 5: [4, f < 845 ? [0.5, 1.5, RZ - 1.6] : [-4.5, 1.2, RZ - 2.5]], 6: [4, [-4 + (f - 942) * 0.03, 1.3, 6.8]], 7: [6, [20.1, 1.3, OZ - 1.9]], 8: [6, [-20, 1.0, 1.4]], 9: [3, [DX, 1.2, DZ + 1]], 10: [4, [DX - 1, 1.2, DZ + 1.5]], 11: [3, [0.2, 2.4, AZ + 1.3]], 12: [2, [-16.6, 1.1, AZ + 3]] }[s.id];
  return D ? { cInf: D[0], focus: dist(f, D[1]) } : { cInf: 0, focus: 10 };
};
export const shadowAt = (f) => {
  const s = shotAt(f);
  const F = { 1: [[0, 0, -2], 8], 2: [[0, 0, OZ - 2], 8], 3: [[28, 0, -4], 12], 4: [[-20, 0, 1.6], 7], 5: [[-2, 0, RZ - 2], 16], 6: [[-2, 0, 6.8], 12], 7: [[20, 0, OZ - 1.6], 6], 8: [[-20, 0, 1.4], 7], 9: [[-4, 0, AZ + 2], 16], 10: [[-6, 0, AZ + 3], 12], 11: [[0, 0, AZ], 12], 12: [[-10, 0, AZ + 2], 30] }[s.id];
  return { focus: F[0], span: F[1] };
};
// plane state: parked tail-down until the take-off
export const worldAt = (f) => {
  const spin = f >= 1780 ? (f - 1780) * 0.9 : 0;
  if (f < T.berangkat) return { plane: { x: 0, y: 0, pitch: 0.1, spin, stairs: f < 1790 } };
  const u = f - T.berangkat, x = 0.0075 * u * u, y = Math.max(0, u - 52) * 0.09, pitch = u < 30 ? 0.1 * (1 - u / 30) : u > 48 ? 0.1 * Math.min(1, (u - 48) / 20) : 0;
  return { plane: { x, y, pitch, spin, stairs: false } };
};

// ---------- cards ----------
const P = (id, outfit, x, z, facing, opts, f, seed, extra = {}) => {
  const i = idle(f, seed);
  return { id, type: "person", outfit, x, z, facing, opts: { seed, bob: i.bob, tilt: i.tilt, headTilt: i.headTilt, blink: blinkAt(f, seed), flip: facing === -1, ...opts }, ...extra };
};
const Q = (o) => { const r = {}; for (const [k, v] of Object.entries(o)) r[k] = typeof v === "number" ? Math.round(v * 20) / 20 : v; return r; };
const fx = (id, type, t, x, y, z, scale, extra = {}) => ({ id, type, t: Math.round(t * 30) / 30, x, y, z, scale, soft: true, shadow: false, blob: false, ...extra });
const prop = (id, type, opts, x, y, z, scale, extra = {}) => ({ id, type, opts: Q(opts), x, y, z, scale, blob: false, ...extra });
const DS = 0.55; // dog card scale
const DOGC = [["#e8c48a", "#b8864a"], ["#f4ece0", "#3a2a24"], ["#8a6a4a", "#5a4030"], ["#3a3236", "#2a2226"], ["#d9d2c6", "#7a6a5a"], ["#e8b45a", "#c88a3a"], ["#c9703a", "#7a3a1a"], ["#f2e6c8", "#c8a070"]];
const SILK = ["#d8434a", "#3f6ab0", "#2f8a6a", "#8a3fa0", "#e8963a", "#c8366a"];
const ROSH = { col: "#f4ece0", col2: "#e8c4a0", jewel: true, collar: "#e85a8a" };
const BOBBY = { col: "#e8b45a", col2: "#c88a3a" };
/** dog card. o: dog opts; extra: card fields */
const D = (id, o, x, z, facing, f, seed, extra = {}) => {
  const wag = 18 * Math.sin(f * 0.5 + seed * 1.3);
  return { id, type: "dog", x, z, facing, scale: DS, opts: Q({ tail: wag, blink: blinkAt(f, seed + 3), ...o }), blobW: 0.9, ...extra };
};
const hearts = (out, id, f, f0, x, y, z, n = 3, sc = 0.6) => { for (let i = 0; i < n; i++) { const t = ((f - f0) / 40 + i / n) % 1; out.push(fx(id + i, "heart", t, x + 0.22 * Math.sin(i * 2.1 + f * 0.05), y + 0.4 * t, z, sc)); } };
/** a climber on the plane stairs: walks to the foot (x DX, z DZ+2.3), climbs to the door, then vanishes inside */
const climb = (f, f0, dur) => {
  const u = clamp01((f - f0) / dur);
  const walkIn = clamp01(u / 0.35), up = clamp01((u - 0.35) / 0.55);
  const z = up > 0 ? DZ + 2.25 - 1.95 * up : DZ + 6.5 - 4.25 * walkIn, y = 1.08 * up;
  return { z, y, alpha: 1 - clamp01((u - 0.9) / 0.1), on: f >= f0 - 2 && u < 1, phase: (f - f0) / 16 };
};

export const cardsAt = (f, camPos) => {
  const s = shotAt(f), out = [];
  const add = (c) => { if (!c) return; if (c.opts && c.type === "person") c.opts = Q(c.opts); out.push(c); };
  const MZ = -2.6, stage = 0.53, cush = 1.03;
  // ---- 1: the wedding ----
  if (s.id === 1) {
    const turn = f >= T.anjing;
    const barkK = turn && f < T.anjing + 14 ? 1 - (f - T.anjing) / 14 : 0;
    add(D("rosh", { ...ROSH, outfit: "veil", sit: 1, expr: turn ? "pant" : "love", bark: barkK }, -0.55, MZ + 0.05, 1, f, 1, { y: 0.81, scale: 0.7 }));
    add(D("bobby", { ...BOBBY, outfit: "groom", sit: 1, expr: turn ? "pant" : "love", bark: barkK }, 0.55, MZ + 0.05, -1, f, 2, { y: 0.81, scale: 0.7 }));
    add(P("nawab", C.NAWAB, -1.45, MZ - 0.9, 1, { expr: "grin", armF: "wave", armB: "hip", k: f / 40, look: 0.6 }, f, 3, { y: stage }));
    add(P("raja2", C.RAJA2, 1.45, MZ - 0.9, -1, { expr: "happy", armF: "hang", armB: "hang", look: 0.6 }, f, 4, { y: stage }));
    [[-1.7, 1.6, 1, 0], [1.75, 1.9, -1, 1], [-1.25, 4.6, 1, 2]].forEach(([x, z, fc, v], i) => add(P("g" + i, C.SERVANT(v), x, z, fc, { expr: f > T.anjing + 4 ? "shock" : "happy", armF: i === 2 ? "trumpet" : "hang", look: fc * 0.5 }, f, 5 + i)));
    hearts(out, "h", f, 0, 0, 1.75, MZ + 0.2, 3, 0.55);
    if (turn && f < T.anjing + 16) add(fx("bang", "bang2", clamp01((f - T.anjing) / 12), 0, 2.0, MZ + 0.3, 0.45));
  }
  // ---- 2: the Nawab and hundreds of dogs ----
  if (s.id === 2) {
    const many = f >= T.ratusan;
    add(P("nawab", C.NAWAB, 0, OZ - 3.1, 1, { expr: many ? "grin" : "smug", armF: many ? "up" : "hip", armB: many ? "up" : "hip", look: 0.2 }, f, 3));
    add(D("rosh", { ...ROSH, sit: 1, expr: "happy" }, -0.9, OZ - 2.7, 1, f, 1));
    add(D("d1", { col: DOGC[2][0], col2: DOGC[2][1], sit: 1, expr: "pant", collar: "#3f6ab0" }, 0.95, OZ - 2.7, -1, f, 7));
    if (many) for (let i = 0; i < 46; i++) {
      const pop = back((f - T.ratusan - (i % 12) * 1.5) / 8); if (pop <= 0) continue;
      const row = Math.floor(i / 9), x = -5.6 + (i % 9) * 1.4 + (row % 2) * 0.7, z = OZ - 1.6 + row * 1.15, c = DOGC[i % 8];
      add(D("m" + i, { col: c[0], col2: c[1], sit: (i % 3) === 0 ? 0 : 1, expr: ["pant", "happy", "smug", "pant"][i % 4], patch: i % 5 === 1, collar: SILK[i % 6] }, x, z, i % 2 ? 1 : -1, f, 10 + i, { scale: DS * pop }));
    }
  }
  // ---- 3: kennels, one carer each ----
  if (s.id === 3) {
    for (let i = 0; i < 9; i++) {
      const x = 21 + i * 1.9, c = DOGC[i % 8];
      add(D("k" + i, { col: c[0], col2: c[1], sit: i % 2, expr: i % 3 ? "pant" : "happy", patch: i === 1, collar: SILK[i % 6] }, x - 0.3, -3.55, 1, f, 20 + i, { scale: 0.65 }));
      add(P("c" + i, C.SERVANT(i), x + 0.45, -3.3, -1, { expr: i % 2 ? "happy" : "neutral", armF: "pat", armB: i % 3 === 0 ? "hip" : "hang", k: f / 30 + i * 0.2, look: -0.5 }, f, 30 + i));
    }
  }
  // ---- 4: Roshanara meets Bobby (garden) ----
  if (s.id === 4) {
    const bob = smooth((f - T.nikah) / 50), love = f >= 688;
    add(D("rosh", { ...ROSH, sit: 1, expr: love ? "love" : f >= T.roshanara ? "smug" : "happy" }, -20.6, 1.25, 1, f, 1, { y: 0.25, scale: 0.68 }));
    if (f >= T.nikah - 4) {
      add(D("bobby", { ...BOBBY, collar: "#e8963a", walk: bob < 1 ? 1 : 0, phase: (f - T.nikah) / 14, expr: love ? "love" : "pant" }, -17.0 - 2.3 * bob, 1.75, -1, f, 2, { scale: 0.68 }));
      add(P("raja2", C.RAJA2, -16.0 - 2.4 * bob, 0.5, -1, { expr: "happy", armF: bob < 1 ? "hang" : "wave", k: f / 30, mode: bob < 1 ? "march" : "stand", phase: (f - T.nikah) / 24, look: -0.5 }, f, 4));
    }
    if (love) hearts(out, "h", f, 688, -20.0, 1.3, 1.6, 4, 0.5);
    if (f < T.nikah) for (let i = 0; i < 2; i++) { const t = ((f - 501) / 50 + i / 2) % 1; add(fx("sp" + i, "spark", t, -20.7 + 0.6 * i, 1.0 + 0.3 * i, 1.5, 0.35)); }
  }
  // ---- 5: the station ----
  if (s.id === 5) {
    const pl = 0.9, step = smooth((f - 770) / 40);
    add(D("bobby", { ...BOBBY, outfit: "groom", walk: step > 0 && step < 1 ? 1 : 0, phase: (f - 770) / 14, expr: "pant" }, -3.0 + 1.0 * step, RZ - 6.6 + 2.8 * step, -1, f, 2, { y: pl, scale: 0.78 }));
    [[-3.3, "trumpet", 0], [-3.9, "drum", 1], [-4.5, "trumpet", 2]].forEach(([x, arm, v], i) => add(P("band" + i, C.SEPOY(v), x, RZ - 2.4 - 0.5 * i, 1, { expr: arm === "drum" ? "determined" : "neutral", armF: arm, armB: arm === "drum" ? "drum" : "hang", k: f / 12 + i * 0.3, look: 0.5 }, f, 40 + i, { y: pl })));
    add(P("raja2", C.RAJA2, -1.1, RZ - 4.6, -1, { expr: "happy", armF: "wave", k: f / 30, look: -0.4 }, f, 4, { y: pl }));
    if (f >= T.sutra - 10) for (let i = 0; i < 18; i++) {
      const pop = back((f - T.sutra - i * 1.2) / 8); if (pop <= 0) continue;
      const c = DOGC[i % 8];
      add(D("s" + i, { col: c[0], col2: c[1], outfit: "silk", silk: SILK[i % 6], sit: 1, expr: i % 3 ? "pant" : "smug", patch: i % 4 === 1 }, -6.2 - (i % 9) * 0.95, RZ - 2.0 - Math.floor(i / 9) * 1.6, 1, f, 50 + i, { y: pl, scale: DS * pop }));
    }
  }
  // ---- 6: the silver palanquin ----
  if (s.id === 6) {
    const px = -9 + (f - 942) * 0.045, ph = (f - 942) / 22, sway = 0.03 * Math.sin(ph * Math.PI * 2);
    add(prop("pal", "palanquin", { dog: true, dogOpts: { ...ROSH, outfit: "veil", expr: "smug", tail: 0 } }, px, 1.12 + sway, 6.8, 0.62, { shadow: true }));
    add(P("bear0", C.SERVANT(0), px + 0.62, 6.75, 1, { expr: "tired", mode: "march", phase: ph, armF: "carry", armB: "carry" }, f, 60));
    add(P("bear1", C.SERVANT(1), px - 0.62, 6.75, 1, { expr: "tired", mode: "march", phase: ph + 0.5, armF: "carry", armB: "carry" }, f, 61));
    add(P("nawab", C.NAWAB, px - 1.6, 8.0, 1, { expr: "grin", mode: "march", phase: ph, armF: "wave", k: f / 30 }, f, 3));
    [[-6.5, 5.2, 1], [-3.2, 5.0, -1], [-0.5, 5.3, -1], [2.5, 5.1, 1], [5, 5.2, -1]].forEach(([x, z, fc], i) => add(P("cr" + i, i % 2 ? C.SEPOY(i) : C.SERVANT(i), x, z, fc, { expr: "happy", armF: i % 2 ? "trumpet" : "wave", k: f / 24 + i, look: fc * 0.4 }, f, 70 + i)));
    if (f >= T.libur - 2) add(prop("stamp", "stamp", { text: "LIBUR KERAJAAN", t: clamp01((f - T.libur + 2) / 8) }, camAt(f).look[0] + 0.75, 2.35, 9.6, 0.4, { soft: true, shadow: false }));
  }
  // ---- 7: the Governor General declines ----
  if (s.id === 7) {
    const no = f >= T.menolak;
    add(P("irwin", C.IRWIN, 20.1, OZ - 1.95, 1, { expr: no ? "stern" : "neutral", armF: "card", armB: "hang", look: 0.4, headTilt: no ? 6 * Math.sin((f - T.menolak) * 0.45) * (1 - clamp01((f - T.menolak) / 30)) : 0 }, f, 80));
    if (no) add(prop("stamp", "stamp", { text: "DITOLAK", t: clamp01((f - T.menolak) / 8) }, 20.35, 1.62, OZ - 1.2, 0.3, { soft: true, shadow: false }));
  }
  // ---- 8: the cost ----
  if (s.id === 8) {
    const rain = f >= T.setara;
    add(P("nawab", C.NAWAB, -20.55, 1.3, 1, { expr: f >= T.konon1 ? "grin" : "smug", armF: f < T.konon1 ? "shrug" : "pat", armB: f < T.konon1 ? "shrug" : "hip", k: f / 30, look: 0.5 }, f, 3));
    add(D("rosh", { ...ROSH, sit: 1, expr: "smug" }, -19.6, 1.5, -1, f, 1));
    [[-18.8, 1.0, 1], [-19.2, 0.6, 0.85], [-21.4, 0.8, 0.9]].forEach(([x, z, sc], i) => add(prop("bag" + i, "bag", {}, x, undefined, z, sc * 0.95, { blob: true, blobW: 0.5 })));
    if (rain) for (let i = 0; i < 26; i++) { const t0 = T.setara + 14 * rnd(i, 1), d = (f - t0) * 0.06; if (d < 0) continue; const y = 3.2 - (d % 3.4); add({ id: "coin" + i, type: "coin", t: ((f * 0.07 + i * 0.3) % 1), x: -21.6 + 3.2 * rnd(i, 2), y, z: 0.4 + 1.8 * rnd(i, 3), scale: 0.6, soft: true, shadow: false, blob: false, zwrite: true }); }
    if (rain) for (let i = 0; i < 2; i++) { const t = ((f - T.setara) / 36 + i / 2) % 1; add(fx("rp" + i, "rp", t, -20.9 + 1.4 * i, 1.9 + 0.3 * t, 1.6, 0.45)); }
  }
  // ---- 9: 1947, boarding ----
  if (s.id === 9) {
    const who = [
      ["nawab", C.NAWAB, T.kabur - 30, 90, { expr: "smug", armF: "wave", k: 0.2 }],
      ["sv0", C.SERVANT(0), T.harta - 40, 80, { expr: "tired", armF: "chest", armB: "chest" }],
      ["sv1", C.SERVANT(1), T.harta - 22, 80, { expr: "tired", armF: "chest", armB: "chest" }],
      ["beg0", C.BEGUM, T.istri - 30, 80, { expr: "neutral", armF: "hang" }],
      ["beg1", { ...C.BEGUM, coat: "#c8553d", skirt: "#c8553d", hatCol: "#f3c64a" }, T.istri - 14, 80, { expr: "neutral", armF: "hang" }],
    ];
    who.forEach(([id, o, f0, dur, op], i) => { const c = climb(f, f0, dur); if (!c.on) return; add(P(id, o, DX - 0.12, c.z, -1, { ...op, mode: "march", phase: c.phase, look: -0.5 }, f, 90 + i, { y: c.y, yaw: 0, alpha: c.alpha, soft: c.alpha < 1, zwrite: true })); });
    for (let i = 0; i < 6; i++) { const c = climb(f, T.anjing2 - 34 + i * 6, 48), cc = DOGC[i % 8]; if (!c.on) continue; add(D("pd" + i, { col: cc[0], col2: cc[1], walk: 1, phase: c.phase * 1.6, expr: "pant", collar: SILK[i % 6], patch: i === 1 }, DX + 0.15 * ((i % 2) - 0.5), c.z + 0.1, -1, f, 100 + i, { y: c.y, yaw: 0, alpha: c.alpha, soft: c.alpha < 1, zwrite: true })); }
    if (f < T.kabur - 30) add(P("nawab0", C.NAWAB, DX - 2.2, DZ + 6.8, -1, { expr: "smug", armF: "hip", armB: "hip", look: -0.4 }, f, 90));
  }
  // ---- 10: one wife steps off for the child ----
  if (s.id === 10) {
    const down = smooth((f - T.turun - 12) / 40), run = clamp01((f - T.turun - 52) / 60);
    const z = down < 1 ? DZ + 0.3 + 1.95 * down : DZ + 2.25 + 1.2 * run, y = 1.08 * (1 - down), x = DX - 0.1 - 0.55 * run;
    add(P("beg0", C.BEGUM, x, z, down > 0 ? 1 : -1, { expr: f < T.turun ? "neutral" : f < T.turun + 30 ? "shock" : "nervous", armF: f >= T.turun && f < T.turun + 30 ? "point" : "hang", mode: down > 0 && (down < 1 || run < 1) ? "march" : "stand", phase: (f - T.turun) / 12, look: -0.6 }, f, 93, { y, yaw: down < 1 ? 0 : undefined }));
    add(P("anak", C.ANAK, -5.2, AZ + 4.9, 1, { expr: "nervous", armF: "wave", armB: "up", k: f / 20, look: 0.6 }, f, 110, { scale: 0.62 }));
    if (f >= T.turun - 4 && f < T.turun + 30) add(fx("q", "q", clamp01((f - T.turun + 4) / 10), DX - 0.35, 2.75, DZ + 0.5, 0.55));
  }
  // ---- 11: her seat goes to two dogs ----
  if (s.id === 11) {
    const popT = clamp01((f - 1826) / 10);
    add(prop("cabin", "cabin", { slots: ["nawab", f < 1826 ? "empty" : "pop", "begum"], t: popT, expr: f > 1840 ? "smug" : "neutral", pat: f > 1845, k: f / 30 }, 0.2, 2.42, AZ + 1.32, 1.0, { yaw: 0, shadow: false }));
    if (f >= 1832 && f < 1846) add(fx("bang", "bang2", clamp01((f - 1832) / 12), 0.9, 3.15, AZ + 1.5, 0.35));
  }
  // ---- 12: the plane leaves ----
  if (s.id === 12) {
    const u = f - T.berangkat, run = clamp01(u / 50);
    add(P("beg0", C.BEGUM, -17.0 + 1.2 * run, AZ + 2.95, 1, { expr: u > 40 ? "shock" : "nervous", armF: "wave", armB: "child", k: f / 10, mode: run < 1 ? "march" : "stand", phase: u / 12, look: 0.6 }, f, 93));
    add(P("anak", C.ANAK, -16.5 + 1.2 * run, AZ + 3.35, 1, { expr: "shock", armF: "wave", armB: "up", k: f / 9, mode: run < 1 ? "march" : "stand", phase: u / 9 }, f, 110, { scale: 0.62 }));
    for (let i = 0; i < 2; i++) { const t = ((u) / 26 + i / 2) % 1; if (u > 30) add(fx("pf" + i, "puff", t, -1 + 0.0075 * u * u - 5 * t, 0.7, AZ + (i ? 4.3 : -4.3), 1.2)); }
  }
  return out;
};
