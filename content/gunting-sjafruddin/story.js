// Story timeline for "Gunting Sjafruddin" (56.5 s, 1695 frames @ 30 fps). Everything is a pure function of the frame.
import * as C from "./cast.js";

export const FPS = 30, TOTAL = 1695;
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

// ---------- timing (from the voiceover, silencedetect + character split) ----------
export const T = {
  hook: 0, gunting1: 82, dua: 118, beneran: 148, gunting2: 176, tahun: 221, uang: 283, harga: 353, kas: 416, menteri: 475, ide: 516,
  kertas: 560, potong: 631, namanya: 664, gs: 692, kiri: 745, tapi: 824, sepuluh: 900, lima: 941, kanan: 977, ditukar: 1013,
  dilunasi: 1076, konon: 1181, korban: 1204, istri: 1243, perdana: 1294, tabungan: 1347, setengah: 1405, rahmi: 1449, kenapa: 1497,
  jawaban: 1564, rahasia: 1609, end: 1656,
};
const OZ = -500, MX = 20, LX = 40, WX = -5.2, WZ = -1.6;

// ---------- lights ----------
export const LIGHTS = {
  day: { tLit: [1.06, 1.0, 0.9], tShade: [0.5, 0.49, 0.62], tLift: [0.03, 0.04, 0.07], tLambert: 0.35, tSideK: 0.84, tTerm: 0.2, tSat: 1.05, tBounce: [0, 0, 0], cardShadow: 0.64, contrast: 0.22, shTint: [-0.01, 0.0, 0.035], hiTint: [0.02, 0.015, 0.0], sun: "#fff3df", sunI: 0.95, sky: "#cfe8ff", ground: "#8f7f5a", hemiI: 0.62, az: -35, el: 50, skyTop: "#4aa3e4", skyHor: "#d5ecf4", cloud: "#ffffff", cardTint: "#ffffff", sat: 1.08, gain: [1.0, 1.0, 1.0] },
  golden: { tLit: [1.12, 0.9, 0.7], tShade: [0.6, 0.52, 0.6], tLift: [0.03, 0.03, 0.05], tLambert: 0.3, tSideK: 0.86, tTerm: 0.12, tSat: 1.08, tBounce: [0.06, 0.03, 0], contrast: 0.28, shTint: [0.03, -0.01, 0.05], hiTint: [0.04, 0.015, -0.02], cardShadow: 0.6, sun: "#ffc68c", sunI: 1.05, sky: "#ffd7b0", ground: "#6d5e40", hemiI: 0.55, az: -60, el: 18, skyTop: "#6f8ed6", skyHor: "#ffc89c", cloud: "#ffd8b8", cardTint: "#fff0dc", sat: 1.1, gain: [1.03, 0.98, 0.93] },
  night: { tLit: [0.46, 0.52, 0.86], tShade: [0.2, 0.22, 0.42], tLift: [0.03, 0.03, 0.07], tLambert: 0.35, tSideK: 0.84, tTerm: 0.2, tSat: 0.95, tBounce: [0.05, 0.02, 0], contrast: 0.2, shTint: [0.0, 0.01, 0.06], hiTint: [0.04, 0.01, 0.0], cardShadow: 0.7, sun: "#b8c4ff", sunI: 0.45, sky: "#6f7fc0", ground: "#3a2c30", hemiI: 0.38, az: 30, el: 55, skyTop: "#121a40", skyHor: "#3d4c86", cloud: "#8a96c8", cardTint: "#c4cbea", sat: 1.0, gain: [0.97, 0.98, 1.06], fogN: 30, fogF: 160 },
  sewer: { tLit: [0.72, 0.9, 0.8], tShade: [0.32, 0.4, 0.38], tLift: [0.03, 0.05, 0.04], tLambert: 0.4, tSideK: 0.8, tTerm: 0.2, tSat: 0.95, tBounce: [0, 0, 0], contrast: 0.22, shTint: [0.0, 0.03, 0.02], hiTint: [0.03, 0.03, 0.0], cardShadow: 0.7, sun: "#e8ffe8", sunI: 0.55, sky: "#cfe8d8", ground: "#3a4a40", hemiI: 0.85, az: 10, el: 80, skyTop: "#1d2a24", skyHor: "#1d2a24", cloud: "#ffffff", cardTint: "#d6eadc", sat: 1.02, shadow: false, fogN: 4, fogF: 34, gain: [0.98, 1.02, 0.98] },
  room: { tLit: [1.05, 0.95, 0.82], tShade: [0.6, 0.5, 0.46], tLift: [0.03, 0.03, 0.03], tLambert: 0.35, tSideK: 0.86, tTerm: 0.3, tSat: 1.0, tBounce: [0, 0, 0], cardShadow: 0.64, contrast: 0.24, shTint: [0.02, 0.0, 0.02], hiTint: [0.04, 0.02, 0.0], sun: "#ffe9c8", sunI: 0.8, sky: "#ffeed8", ground: "#7a5a40", hemiI: 0.8, az: 40, el: 40, skyTop: "#3a2a24", skyHor: "#3a2a24", cloud: "#ffffff", cardTint: "#fff6ea", sat: 1.08, shadow: false, fogN: 400, fogF: 2000, gain: [1.02, 1.0, 0.97] },
};

// ---------- shots ----------
export const SHOTS = [
  { id: 1, a: 0, b: 221, light: "day" },        // hook: a note snipped in two
  { id: 2, a: 221, b: 353, light: "day" },      // Jakarta 1950, money rains
  { id: 3, a: 353, b: 416, light: "day" },      // price board climbs
  { id: 4, a: 416, b: 475, light: "room" },     // the state safe: empty, a moth
  { id: 5, a: 475, b: 745, light: "room" },     // the minister's idea, the stamp
  { id: 6, a: 745, b: 977, light: "day" },      // shopping with the left half
  { id: 7, a: 977, b: 1181, light: "room" },    // bank: right half -> bond, 40 years
  { id: 8, a: 1181, b: 1294, light: "day" },    // Ibu Rahmi and the sewing machine
  { id: 9, a: 1294, b: 1347, light: "room" },   // Bung Hatta, prime minister
  { id: 10, a: 1347, b: 1449, light: "day" },   // savings cut, machine halves
  { id: 11, a: 1449, b: 1564, light: "room" },  // she protests
  { id: 12, a: 1564, b: TOTAL, light: "room" }, // "state secret"
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const lightAt = (f) => LIGHTS[shotAt(f).light];
const FLASH = [[T.gunting1 + 2, 0.35], [T.gunting2 + 2, 0.3], [T.ide, 0.3], [T.potong + 1, 0.3], [T.gs, 0.45], [T.lima, 0.2], [T.setengah - 6, 0.35], [1650, 0.45]];
export const flashAt = (f) => { let v = 0; for (const [a, k] of FLASH) if (f >= a && f < a + 5) v = Math.max(v, k * (1 - (f - a) / 5)); return v; };

// ---------- cameras: [frame, pos, look, fov, roll] ----------
const CAMS = {
  1: [[0, [-4.78, 1.42, 1.5], [-4.9, 1.33, -1.6], 36, 0], [140, [-4.82, 1.42, 1.15], [-4.9, 1.33, -1.6], 35, 0], [221, [-4.85, 1.44, 0.75], [-4.92, 1.36, -1.6], 34, 0]],
  2: [[221, [2.2, 4.6, 12.5], [0, 3.6, -5], 44, 0], [353, [1.4, 3.6, 9.5], [0, 3.1, -5], 44, 0]],
  3: [[353, [-6.85, 1.5, 0.5], [-6.9, 1.3, -3.0], 38, 0], [416, [-6.85, 1.45, 0.1], [-6.9, 1.3, -3.0], 37, 0]],
  4: [[416, [21.6, 1.5, OZ + 1.9], [21.95, 1.1, OZ - 2.0], 42, 0], [475, [21.65, 1.45, OZ + 1.5], [21.95, 1.1, OZ - 2.0], 41, 0]],
  5: [[475, [19.95, 1.55, OZ + 2.4], [20.0, 1.35, OZ - 1.4], 44, 0], [660, [20.0, 1.6, OZ + 1.55], [20.05, 1.38, OZ - 1.4], 42, 0], [745, [20.0, 1.62, OZ + 1.45], [20.05, 1.4, OZ - 1.4], 41, 0]],
  6: [[745, [-5.45, 1.62, 1.1], [-5.8, 1.25, -3.0], 48, 0], [888, [-5.45, 1.6, 0.75], [-5.8, 1.25, -3.0], 47, 0], [918, [-5.72, 1.2, -0.65], [-5.82, 1.14, -2.2], 36, 0], [977, [-5.73, 1.2, -0.8], [-5.82, 1.14, -2.2], 35, 0]],
  7: [[977, [2.4, 1.65, OZ + 2.7], [0.8, 1.35, OZ - 1.0], 44, 0], [1076, [2.3, 1.65, OZ + 2.4], [0.8, 1.35, OZ - 1.0], 43, 0], [1076, [-1.25, 2.2, OZ - 1.35], [-1.6, 2.15, OZ - 3.96], 38, 0], [1130, [-1.3, 2.2, OZ - 1.6], [-1.6, 2.15, OZ - 3.96], 36, 0], [1130, [2.3, 1.62, OZ + 2.2], [1.0, 1.35, OZ - 0.8], 40, 0], [1181, [2.25, 1.6, OZ + 1.9], [1.0, 1.35, OZ - 0.8], 39, 0]],
  8: [[1181, [9.3, 1.55, 0.3], [10.6, 1.25, -4.1], 40, 0], [1294, [9.4, 1.52, -0.3], [10.6, 1.25, -4.1], 39, 0]],
  9: [[1294, [20.4, 1.6, OZ + 1.4], [20.3, 1.35, OZ - 2.0], 40, 0], [1347, [20.4, 1.6, OZ + 1.1], [20.3, 1.38, OZ - 2.0], 38, 0]],
  10: [[1347, [9.65, 1.45, -0.3], [10.45, 1.15, -4.0], 42, 0], [1449, [9.7, 1.45, -0.7], [10.45, 1.15, -4.0], 41, 0]],
  11: [[1449, [40.27, 1.6, OZ + 3.3], [40.27, 1.3, OZ - 1.4], 46, 0], [1564, [40.27, 1.6, OZ + 2.85], [40.27, 1.32, OZ - 1.4], 45, 0]],
  12: [[1564, [40.65, 1.62, OZ + 0.95], [40.83, 1.45, OZ - 1.7], 38, 0], [1636, [40.62, 1.62, OZ + 0.75], [40.83, 1.47, OZ - 1.7], 37, 0], [1636, [40.27, 1.62, OZ + 3.2], [40.27, 1.38, OZ - 1.4], 46, 0], [TOTAL, [40.27, 1.62, OZ + 2.95], [40.27, 1.38, OZ - 1.4], 45, 0]],
};
const KICKS = [[T.gunting1 + 2, 0.03], [T.gunting2 + 2, 0.03], [T.potong + 1, 0.03], [T.gs, 0.05], [T.setengah - 6, 0.04], [1650, 0.05]];
export const camAt = (f) => {
  const s = shotAt(f), keys = CAMS[s.id], n = keys.length;
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
  const D = { 1: [7, [WX + 0.3, 1.3, WZ]], 3: [6, [-7.2, 1.3, -2.95]], 4: [6, [22.3, 1.0, OZ - 2.2]], 5: [5, [20, 1.4, OZ - 1.0]], 6: [f < 900 ? 4 : 7, f < 900 ? [-5.8, 1.2, -3] : [-5.82, 1.14, -2.2]], 7: [5, f >= 1076 && f < 1130 ? [-1.6, 2.15, OZ - 3.96] : [1.2, 1.35, OZ - 0.4]], 8: [6, [10.3, 1.2, -3.6]], 9: [5, [20.3, 1.4, OZ - 2.2]], 10: [6, [10.3, 1.0, -3.6]], 11: [4, [40.3, 1.3, OZ - 1.4]], 12: [f < 1636 ? 7 : 4, f < 1636 ? [40.85, 1.5, OZ - 1.7] : [40.3, 1.4, OZ - 1.4]] }[s.id];
  return D ? { cInf: D[0], focus: dist(f, D[1]) } : { cInf: 0, focus: 10 };
};
export const shadowAt = (f) => {
  const s = shotAt(f);
  const F = { 1: [[WX, 0, WZ], 6], 2: [[0, 0, 0], 22], 3: [[-6.5, 0, -3.5], 6], 4: [[22, 0, OZ - 2], 6], 5: [[20, 0, OZ - 1.4], 6], 6: [[-5.6, 0, -3], 7], 7: [[0.6, 0, OZ - 1], 8], 8: [[10.5, 0, -4], 6], 9: [[20.3, 0, OZ - 2], 6], 10: [[10.5, 0, -4], 6], 11: [[40.3, 0, OZ - 1.4], 6], 12: [[40.5, 0, OZ - 1.5], 6] }[s.id];
  return { focus: F[0], span: F[1] };
};
export const worldAt = (f) => ({ works: false });

// ---------- cards ----------
const P = (id, outfit, x, z, facing, opts, f, seed, extra = {}) => {
  const i = idle(f, seed);
  return { id, type: "person", outfit, x, z, facing, opts: { seed, bob: i.bob, tilt: i.tilt, headTilt: i.headTilt, blink: blinkAt(f, seed), flip: facing === -1, ...opts }, ...extra };
};
const Q = (o) => { const r = {}; for (const [k, v] of Object.entries(o)) r[k] = typeof v === "number" ? Math.round(v * 20) / 20 : v; return r; };
const fx = (id, type, t, x, y, z, scale, extra = {}) => ({ id, type, t: Math.round(t * 30) / 30, x, y, z, scale, soft: true, shadow: false, blob: false, ...extra });
const prop = (id, type, opts, x, y, z, scale, extra = {}) => ({ id, type, opts: Q(opts), x, y, z, scale, blob: false, ...extra });
const W_ = C.WARGA, KK = C.KAKEK, PD = C.PEDAGANG, SY = C.SYAFRUDDIN, HT = C.HATTA, RH = C.RAHMI, TL = C.TELLER;
const NS = 0.426; // scale of a note card that matches a note held in hand
/** scissors snipping at world point (cx, cy): card mirrored so the blades point left, cut point lands on (cx, cy) */
const snipAt = (id, f, f0, cx, cy, z, sc = 0.6) => {
  const enter = easeOut((f - (f0 - 24)) / 18), leave = smooth((f - f0 - 12) / 14);
  if (enter <= 0 || leave >= 1) return null;
  const k = f < f0 ? 0.85 + 0.15 * Math.sin(f * 0.6) : Math.max(0, 1 - (f - f0) / 3);
  return { id, type: "scissors", opts: { k: Math.round(k * 20) / 20 }, x: cx + 0.38 * sc + 1.4 * (1 - enter) + 1.2 * leave, y: cy - 0.0, z, scale: sc, facing: -1, soft: true, shadow: false, blob: false, alpha: 1 - leave, zwrite: true };
};

export const cardsAt = (f, camPos) => {
  const s = shotAt(f), out = [];
  const add = (c) => { if (!c) return; if (c.opts && c.type === "person") c.opts = Q(c.opts); out.push(c); };
  // ---- 1: hook ----
  if (s.id === 1) {
    const cut = f >= T.gunting1 + 2, beneran = f >= T.beneran;
    add(P("warga", W_, WX, WZ, 1, { expr: beneran ? "shock" : cut ? "shock" : f > 40 ? "nervous" : "happy", armF: "note", note: cut ? "left" : "full", val: 10, armB: beneran ? "up" : "hang", look: beneran ? 0 : 0.6, tilt: cut && f < T.gunting1 + 14 ? -4 * act(f, T.gunting1 + 2, 10) : 0 }, f, 2));
    add(snipAt("sc1", f, T.gunting1, WX + 0.57, 1.14, WZ + 0.12, 0.6));
    if (cut && f < T.gunting1 + 60) { const u = (f - T.gunting1 - 2) / 40; add(prop("half", "note", { part: "right", val: 10 }, WX + 0.72 + 0.5 * u, Math.max(0.05, 1.14 - 1.3 * u * u), WZ + 0.06, NS, { soft: true, shadow: false, roll: 1.8 * u, zwrite: true })); }
    add(snipAt("sc2", f, T.gunting2, -4.86, 1.18, WZ + 1.15, 0.3));
    if (f >= T.gunting2 + 1 && f < T.gunting2 + 14) add(fx("bang", "bang2", clamp01((f - T.gunting2 - 1) / 12), -4.72, 1.6, WZ + 1.1, 0.3));
    if (cut && f < T.gunting1 + 16) add(fx("bang1", "bang2", clamp01((f - T.gunting1 - 2) / 12), WX + 0.8, 1.6, WZ + 0.1, 0.55));
  }
  // ---- 2: Jakarta 1950, money everywhere ----
  if (s.id === 2) {
    const ppl = [[-3.2, 1.0, 1, 3], [1.4, 2.4, -1, 4], [4.2, -0.6, -1, 6], [-0.8, -2.6, 1, 8]];
    ppl.forEach(([x, z, fc, sd], i) => add(P("p" + i, { ...W_, skin: C.SKINS[i % 4], coat: ["#f4f1e6", "#e8d6ac", "#cfe0ea", "#f4f1e6"][i] }, x, z, fc, { expr: f > 250 + i * 6 ? "grin" : "shock", armF: "up", armB: f > 240 ? "up" : "hang", look: fc > 0 ? 0.3 : -0.3 }, f, sd)));
    for (let i = 0; i < 46; i++) {
      const t0 = 160 + 70 * rnd(i, 1), sp = 0.045 + 0.025 * rnd(i, 2), d = (f - t0) * sp; if (d < 0) continue;
      const y = 8.5 - (d % 9), x = -6 + 12 * rnd(i, 3) + 0.4 * Math.sin(f * 0.07 + i), z = -3.5 + 9 * rnd(i, 4);
      add(prop("m" + i, "note", { part: "full", val: [5, 10, 25][i % 3] }, x, y, z, 0.7, { soft: true, shadow: false, roll: Math.sin(f * 0.09 + i * 1.7) * 0.9, zwrite: true }));
    }
  }
  // ---- 3: the price climbs ----
  if (s.id === 3) {
    const steps = [1, 2, 3, 5, 8, 12, 20, 35], k = Math.min(steps.length - 1, Math.max(0, Math.floor((f - 357) / 7)));
    add(prop("price", "price", { price: steps[k], up: ((f - 357) % 7) / 7 }, -7.25, 1.02, -2.9, 0.82, { yaw: 0, shadow: false }));
    add(P("ped", PD, -6.45, -3.95, -1, { expr: f > 390 ? "nervous" : "neutral", armF: f > 392 ? "shrug" : "point", armB: f > 392 ? "shrug" : "hang", look: -0.6 }, f, 5));
  }
  // ---- 4: the empty state safe ----
  if (s.id === 4) {
    const op = smooth((f - 418) / 12);
    add(prop("safe", "safe", { open: op }, 22.35, undefined, OZ - 2.35, 1.0, { blob: true, blobW: 0.9 }));
    add(P("sy", SY, 21.45, OZ - 1.55, 1, { expr: f > 432 ? "shock" : "neutral", armF: f < 434 ? "reach" : "hang", armB: f > 440 ? "up" : "hang", look: 0.8, tilt: f > 432 ? -4 * act(f, 432, 10) : 0 }, f, 7));
    if (f >= 430) { const u = (f - 430) / 45; add(fx("moth", "moth", (f % 30) / 30, 22.35 - 0.6 * u + 0.12 * Math.sin(f * 0.4), 0.75 + 1.3 * u, OZ - 2.3 + 2.2 * u, 0.6)); }
  }
  // ---- 5: the minister's idea ----
  if (s.id === 5) {
    const idea = f >= T.ide, showNote = f >= T.kertas && f < 612, snip = f >= 612 && f < T.namanya, proud = f >= T.namanya;
    add(P("sy", SY, 19.85, OZ - 1.0, 1, { expr: proud ? "grin" : snip ? "determined" : idea ? "grin" : "tired", armF: proud ? "hip" : snip ? "snipUp" : showNote ? "note" : idea ? "idea" : "cross", armB: proud ? "hip" : "cross", note: "full", val: f < 586 ? 5 : 10, k: snip ? (f < T.potong ? 0.55 + 0.45 * Math.sin(f * 0.5) : Math.max(0, 1 - (f - T.potong) / 3)) : 0, look: 0.2 }, f, 7));
    if (idea && f < T.ide + 20) add(fx("idea", "bang2", clamp01((f - T.ide) / 12), 20.2, 2.22, OZ - 0.95, 0.7));
    if (f >= 616 && f < 700) {
      const pop = back((f - 616) / 8), cut = f >= T.potong + 1, u = cut ? easeOut((f - T.potong - 1) / 22) : 0;
      if (!cut) add(prop("bn", "note", { part: "full", val: 10 }, 20.55, 1.32, OZ - 0.7, 0.42 * pop, { soft: true, shadow: false, zwrite: true }));
      else { add(prop("bnL", "note", { part: "left", val: 10 }, 20.55 - 0.35 * u, 1.32 - 0.25 * u * u, OZ - 0.7, 0.42, { soft: true, shadow: false, roll: 0.35 * u, zwrite: true })); add(prop("bnR", "note", { part: "right", val: 10 }, 20.55 + 0.35 * u, 1.32 - 0.25 * u * u, OZ - 0.7, 0.42, { soft: true, shadow: false, roll: -0.35 * u, zwrite: true })); }
    }
    if (f >= T.potong + 1 && f < T.potong + 14) add(fx("bangP", "bang2", clamp01((f - T.potong - 1) / 12), 20.6, 1.75, OZ - 0.65, 0.5));
    if (f >= T.gs - 2) add(prop("stamp", "stamp", { text: "GUNTING SYAFRUDDIN", t: clamp01((f - T.gs + 2) / 8) }, 20.04, 1.18, OZ + 0.2, 0.2, { soft: true, shadow: false }));
  }
  // ---- 6: shopping with the left half ----
  if (s.id === 6) {
    const took = f >= 838, five = f >= T.lima;
    add(P("warga", W_, -5.25, -2.2, -1, { expr: five ? "nervous" : took ? "shock" : "happy", armF: "note", note: "left", val: five ? 5 : 10, armB: took && f < 900 ? "up" : "hang", look: -0.5 }, f, 2));
    add(P("ped", PD, -6.4, -3.95, 1, { expr: took ? "smug" : "happy", armF: f > 800 && f < 838 ? "reach" : took ? "shrug" : "hang", armB: took ? "shrug" : "hang", look: 0.5 }, f, 5));
    add(prop("ban", "banana", { n: took ? 1 : 2 }, -6.0, 0.98, -3.12, 0.7, { yaw: 0 }));
    if (took && f < 870) add(prop("ban2", "banana", { n: 1 }, -6.45 - 0.3 * easeOut((f - 838) / 14), 1.0 + 0.3 * Math.sin(clamp01((f - 838) / 14) * Math.PI), -3.4, 0.55, { yaw: 0, soft: true, shadow: false, alpha: 1 - clamp01((f - 852) / 10) }));
    if (five && f < T.lima + 18) add(fx("spk", "spark", clamp01((f - T.lima) / 16), -5.95, 1.3, -2.1, 0.35));
  }
  // ---- 7: the bank ----
  if (s.id === 7) {
    const a = smooth((f - 1080) / 66), got = f >= 1046;
    const year = 1950 + Math.round(40 * clamp01((f - 1084) / 52));
    add(prop("cal", "calendar", { year }, -1.6, 1.82, OZ - 3.95, 0.8, { yaw: 0, shadow: false }));
    add(P("teller", TL, 0.35, OZ - 1.75, 1, { expr: a > 0.6 ? "sleep" : f >= T.ditukar && !got ? "smug" : "neutral", armF: f >= T.ditukar && f < 1046 ? "note" : f < T.ditukar ? "reach" : "hang", note: "obli", beard: a, beardCol: "#d8d4cc", look: 0.6 }, f, 9));
    add(P("warga", a > 0.5 ? KK : W_, 1.45, OZ - 0.25, -1, { expr: a > 0.3 ? "tired" : got ? "nervous" : "neutral", armF: "note", note: got ? "obli" : "right", val: 10, beard: a, beardCol: "#f1f0ea", tilt: 7 * a, headTilt: -4 * a, look: -0.5 }, f, 2));
    if (a > 0.6) add(fx("zz", "z", (f % 40) / 40, 0.55, 2.35, OZ - 1.6, 0.6));
  }
  // ---- 8 & 10: Ibu Rahmi at the tailor's display case ----
  if (s.id === 8 || s.id === 10) {
    const cutF = T.setengah - 6, cut = s.id === 10 && f >= cutF, half = s.id === 10 ? clamp01((f - cutF - 2) / 22) : 0;
    add(prop("sew", "sewing", { half }, 11.0, 0.96, -4.7, 0.72, {}));
    const tinS = s.id === 8 ? "closed" : cut ? "cut" : "open";
    add(P("rahmi", RH, 9.95, -3.35, 1, { expr: s.id === 8 ? "happy" : cut ? (f > cutF + 18 ? "angry" : "shock") : "grin", armF: "tin", armB: "tin", tin: tinS, look: 0.7, tilt: cut && f < cutF + 12 ? -4 * act(f, cutF, 10) : 0 }, f, 11));
    if (s.id === 8) for (let i = 0; i < 3; i++) { const t = ((f - 1181) / 40 + i / 3) % 1; add(fx("h" + i, "heart", t, 10.1 + 0.25 * Math.sin(i * 2 + f * 0.05), 2.1 + 0.4 * t, -3.3, 0.7)); }
    if (s.id === 10) { add(snipAt("scR", f, cutF, 10.04, 0.86, -3.15, 0.5)); if (cut && f < cutF + 14) add(fx("bangR", "bang2", clamp01((f - cutF) / 12), 10.5, 1.45, -3.2, 0.5)); }
  }
  // ---- 9: Bung Hatta, prime minister ----
  if (s.id === 9) {
    add(P("hatta", HT, 20.3, OZ - 2.45, 1, { expr: "neutral", armF: "scroll", armB: "hang", look: 0.3 }, f, 13));
    add(prop("plate", "plate", { text: "PERDANA MENTERI" }, 20.3, 0.79, OZ - 1.42, 0.5, { yaw: 0, shadow: false }));
  }
  // ---- 11-12: the living room ----
  if (s.id === 11 || s.id === 12) {
    const low = s.id === 12 ? smooth((f - 1568) / 20) : 0, shh = f >= T.rahasia, deadpan = f >= 1646;
    add(P("hatta", HT, 40.85, OZ - 1.7, -1, { expr: shh ? "smug" : s.id === 12 ? "neutral" : "neutral", armF: shh ? "shh" : "read", armB: shh ? "hang" : "read", k: low, look: s.id === 12 ? -0.3 : 0 }, f, 13));
    add(P("rahmi", RH, 39.7, OZ - 1.1, 1, { expr: deadpan ? "tired" : "angry", armF: f >= T.kenapa && f < 1550 ? "point" : "hip", armB: "hip", look: 0.6, bob: s.id === 11 ? 6 * Math.abs(Math.sin(f * 0.45)) : 0 }, f, 11));
    if (s.id === 11 && f >= 1453 && f < 1500) add(fx("q", "q", clamp01((f - 1453) / 10), 39.95, 2.3, OZ - 1.05, 0.75));
    if (f >= 1648) add(prop("stamp", "stamp", { text: "RAHASIA NEGARA", t: clamp01((f - 1648) / 8) }, 40.27, 1.95, OZ + 0.6, 0.36, { soft: true, shadow: false }));
  }
  return out;
};
