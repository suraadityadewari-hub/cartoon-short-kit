// Story timeline for "Tikus Hanoi" (50.68 s, 1520 frames @ 30 fps). Everything is a pure function of the frame.
import * as C from "./cast.js";

export const FPS = 30, TOTAL = 1520;
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

// ---------- timing (from the voiceover, silencedetect + syllable split) ----------
export const T = {
  hook: 0, hasilnya: 127, banyak: 158, tahun: 228, prancis: 286, got: 378, langsung: 452, pemerintah: 529, satuEkor: 586, satuSen: 629,
  bukti: 665, ekor: 728, tapi: 790, hidup: 883, tanpa: 916, ternyata: 967, dipotong: 1002, dilepas: 1041, beranak: 1075,
  makin1: 1110, makin2: 1150, duit: 1189, pinggir: 1235, peternakan: 1315, dihentikan: 1378, tetap: 1411, hilang: 1462, ekornya: 1494, end: 1519,
};
const OZ = -500, AX = -40, RF = 1500, SEW = -60;

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
  { id: 1, a: 0, b: 127, light: "day" },        // hook: official pays the catcher
  { id: 2, a: 127, b: 228, light: "day" },      // pull back: rats flood the street
  { id: 3, a: 228, b: 378, light: "day" },      // aerial 1902 boulevard, crane down to the roadworks
  { id: 4, a: 378, b: 452, light: "sewer" },    // the rat toll road
  { id: 5, a: 452, b: 529, light: "room" },     // rat pops out of the washbasin
  { id: 6, a: 529, b: 728, light: "room" },     // reward poster, tail on the counter
  { id: 7, a: 728, b: 790, light: "room" },     // tails pile up
  { id: 8, a: 790, b: 967, light: "day" },      // rats still around... alive... no tail
  { id: 9, a: 967, b: 1110, light: "night" },   // flashback: snip, release, breed
  { id: 10, a: 1110, b: 1235, light: "golden" },// more rats, more tails, more money
  { id: 11, a: 1235, b: 1355, light: "day" },   // rat farm in the rice fields
  { id: 12, a: 1355, b: 1405, light: "room" },  // poster stamped DIHENTIKAN
  { id: 13, a: 1405, b: TOTAL, light: "golden" },// rats stay, tails gone
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const lightAt = (f) => LIGHTS[shotAt(f).light];
export const flashAt = (f) => {
  let v = 0;
  for (const [a, k] of [[967, 0.9], [1110, 0.7], [1405, 0.4]]) if (f >= a && f < a + 6) v = Math.max(v, k * (1 - (f - a) / 6));
  for (const a of [T.dihentikan]) if (f >= a && f < a + 3) v = Math.max(v, 0.3 * (1 - (f - a) / 3));
  return v;
};

// ---------- cameras: [frame, pos, look, fov, roll] ----------
const CAMS = {
  1: [[0, [-0.1, 2.0, 3.6], [-0.15, 1.5, -2.8], 40, 0], [127, [-0.12, 1.9, 2.5], [-0.15, 1.5, -2.8], 37, 0]],
  2: [[127, [-0.12, 1.9, 2.5], [-0.15, 1.5, -2.8], 37, 0], [228, [0.6, 7.6, 12.5], [0, 0.6, -2.2], 44, 0]],
  3: [[228, [34, 44, 74], [0, 2, -4], 40, 0], [292, [26, 30, 52], [2, 2, -3], 40, 0], [378, [8.6, 3.0, 4.6], [4.4, 1.4, -3.4], 42, 0]],
  4: [[378, [9, SEW + 1.45, 0.3], [-6, SEW + 1.6, -0.1], 50, 0], [452, [5.5, SEW + 1.4, 0.25], [-8, SEW + 1.7, -0.1], 48, -2]],
  5: [[452, [20.9, 1.6, OZ + 2.4], [19.95, 1.25, OZ - 2.2], 42, 0], [529, [20.8, 1.55, OZ + 1.9], [19.95, 1.25, OZ - 2.2], 39, 0]],
  6: [[529, [-2.4, 2.05, OZ - 0.9], [-2.4, 2.05, OZ - 4], 56, 0], [652, [-2.4, 2.05, OZ - 1.1], [-2.4, 2.05, OZ - 4], 54, 0], [690, [1.0, 1.9, OZ + 4.4], [0.4, 1.3, OZ - 1.6], 44, 0], [728, [0.95, 1.85, OZ + 4.0], [0.4, 1.3, OZ - 1.6], 43, 0]],
  7: [[728, [1.0, 2.3, OZ + 5.4], [0.8, 1.7, OZ - 2], 50, 0], [790, [1.0, 2.25, OZ + 4.9], [0.8, 1.75, OZ - 2], 48, 0]],
  8: [[790, [1.9, 1.7, 2.4], [0.5, 1.45, -4.5], 38, 0], [850, [2.0, 1.4, 2.0], [0.9, 1.0, -3.5], 38, 0], [880, [2.1, 0.85, 1.05], [1.5, 0.42, -1.5], 34, 0], [916, [2.1, 0.84, 1.0], [1.5, 0.42, -1.5], 34, 0], [930, [2.3, 0.8, 0.8], [1.85, 0.4, -1.5], 31, 4], [967, [2.3, 0.78, 0.7], [1.85, 0.4, -1.5], 30, 4]],
  9: [[967, [AX + 0.2, 1.45, OZ + 0.7], [AX - 0.55, 1.05, OZ - 3.4], 42, 0], [1030, [AX + 0.2, 1.35, OZ + 0.3], [AX - 0.45, 0.8, OZ - 3.6], 40, 0], [1070, [AX + 0.3, 0.95, OZ - 4.5], [AX - 0.45, 0.45, OZ - 7.1], 38, 0], [1110, [AX + 0.28, 0.92, OZ - 4.7], [AX - 0.45, 0.45, OZ - 7.1], 36, 0]],
  10: [[1110, [AX + 0.2, 1.75, OZ + 2.8], [AX, 1.15, OZ - 3], 48, 0], [1124, [AX + 0.15, 1.7, OZ + 2.5], [AX - 0.2, 1.1, OZ - 3], 46, 0], [1150, [AX + 0.15, 1.7, OZ + 2.4], [AX - 0.2, 1.1, OZ - 3], 46, 0], [1162, [AX + 0.6, 1.65, OZ + 1.6], [AX + 0.4, 1.1, OZ - 3], 44, 0], [1189, [AX + 0.6, 1.62, OZ + 1.5], [AX + 0.4, 1.1, OZ - 3], 44, 0], [1201, [AX + 0.4, 1.45, OZ + 0.9], [AX + 0.25, 0.95, OZ - 3], 44, -2], [1235, [AX + 0.4, 1.42, OZ + 0.7], [AX + 0.25, 0.95, OZ - 3], 43, -2]],
  11: [[1235, [2.4, 1.7, RF + 10.5], [0.2, 1.3, RF + 3.6], 42, 0], [1300, [2.2, 1.75, RF + 8.6], [0.1, 1.3, RF + 2.4], 42, 0], [1338, [3.0, 5.4, RF + 8.6], [0.2, 0.4, RF - 1.2], 44, 0], [1355, [3.0, 5.6, RF + 8.8], [0.2, 0.4, RF - 1.2], 44, 0]],
  12: [[1355, [-2.4, 2.05, OZ - 1.0], [-2.4, 2.05, OZ - 4], 55, 0], [1405, [-2.4, 2.05, OZ - 1.3], [-2.4, 2.05, OZ - 4], 52, 2]],
  13: [[1405, [1.3, 2.7, 4.4], [-0.3, 0.6, -2.0], 44, 0], [1455, [1.2, 2.4, 3.8], [-0.3, 0.6, -2.0], 42, 0], [1484, [0.7, 1.0, 1.5], [-0.45, 0.42, -1.4], 36, 0], [TOTAL, [0.62, 0.95, 1.3], [-0.45, 0.42, -1.4], 34, 0]],
};
const KICKS = [[476, 0.05], [T.dipotong, 0.04], [T.makin1, 0.03], [T.makin2, 0.03], [T.duit, 0.04], [T.peternakan, 0.03], [T.dihentikan, 0.06]];
export const camAt = (f) => {
  const s = shotAt(f), keys = CAMS[s.id], n = keys.length;
  let i = 0;
  while (i < n - 2 && f > keys[i + 1][0]) i++;
  const k0 = keys[i], k1 = keys[Math.min(i + 1, n - 1)];
  const t = k1[0] === k0[0] ? 0 : glide((f - k0[0]) / (k1[0] - k0[0]));
  const pos = lerp3(k0[1], k1[1], t), look = lerp3(k0[2], k1[2], t);
  const crp = 0.012; pos[0] += crp * Math.sin(f * 0.031); pos[1] += crp * Math.sin(f * 0.023 + 1);
  for (const [kf, amp] of KICKS) if (f >= kf && f < kf + 8) { const u = (f - kf) / 8, a = amp * (1 - u) * (1 - u); pos[0] += a * Math.sin(f * 2.9); pos[1] += a * Math.cos(f * 3.7); look[1] += a * 0.6 * Math.sin(f * 4.1); }
  return { pos, look, fov: lerp(k0[3], k1[3], t), roll: lerp(k0[4], k1[4], t) };
};
const dist = (f, p) => { const c = camAt(f).pos; return Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]); };
export const dofAt = (f) => {
  const s = shotAt(f);
  switch (s.id) {
    case 1: return { cInf: 9, focus: dist(f, [-0.2, 1.6, -2.8]) };
    case 2: return { cInf: f < 160 ? 6 : 0, focus: dist(f, [-0.2, 1.4, -2.8]) };
    case 4: return { cInf: 6, focus: dist(f, [0, SEW + 0.6, 0]) };
    case 5: return { cInf: 8, focus: dist(f, [20.1, 1.3, OZ - 2.3]) };
    case 6: return { cInf: f < 655 ? 0 : 6, focus: dist(f, [0.8, 1.4, OZ - 1.2]) };
    case 7: return { cInf: 4, focus: dist(f, [0.4, 1.8, OZ - 1.2]) };
    case 8: return { cInf: f < 860 ? 8 : 11, focus: f < 860 ? dist(f, [0, 1.6, -4.4]) : dist(f, [1.6, 0.42, -1.5]) };
    case 9: return { cInf: 9, focus: f < 1045 ? dist(f, [AX - 0.5, 0.9, OZ - 3.3]) : dist(f, [AX - 0.3, 0.4, OZ - 7]) };
    case 10: return { cInf: 7, focus: dist(f, [AX, 1.2, OZ - 3]) };
    case 11: return { cInf: f < 1300 ? 6 : 0, focus: dist(f, [0.6, 1.3, RF + 3.4]) };
    case 13: return { cInf: f > 1470 ? 9 : 0, focus: dist(f, [-0.4, 0.42, -1.4]) };
    default: return { cInf: 0, focus: 10 };
  }
};
export const shadowAt = (f) => {
  const s = shotAt(f);
  const F = { 1: [[0, 0, -2.6], 8], 2: [[0, 0, -1], 18], 3: [[4, 0, -2], 40], 4: [[0, SEW, 0], 10], 5: [[20, 0, OZ - 2], 6], 6: [[0, 0, OZ - 2], 8], 7: [[0, 0, OZ - 2], 8], 8: [[0, 0, -3], 8], 9: [[AX, 0, OZ - 4], 8], 10: [[AX, 0, OZ - 3], 8], 11: [[0, 0, RF + 1], 14], 12: [[0, 0, OZ - 2], 8], 13: [[0, 0, -2], 10] }[s.id];
  return { focus: F[0], span: F[1] };
};

// ---------- world state ----------
export const worldAt = (f) => ({ works: shotAt(f).id === 3 });

// ---------- cards ----------
const P = (id, outfit, x, z, facing, opts, f, seed, extra = {}) => {
  const i = idle(f, seed);
  return { id, type: "person", outfit, x, z, facing, opts: { seed, bob: i.bob, tilt: i.tilt, headTilt: i.headTilt, blink: blinkAt(f, seed), ...opts }, ...extra };
};
const Q = (o) => { const r = {}; for (const [k, v] of Object.entries(o)) r[k] = typeof v === "number" ? Math.round(v * 20) / 20 : v; return r; };
const fx = (id, type, t, x, y, z, scale, extra = {}) => ({ id, type, t: Math.round(t * 30) / 30, x, y, z, scale, soft: true, shadow: false, blob: false, ...extra });
const FR = C.OFFICIAL_FR, CA = C.CATCHER;
/** screen-facing of a mover: +1 if its velocity points to screen-right */
const faceFor = (f, vx, vz) => { const c = camAt(f), fx_ = c.look[0] - c.pos[0], fz = c.look[2] - c.pos[2]; const rx = -fz, rz = fx_; return vx * rx + vz * rz >= 0 ? 1 : -1; };
/** rat card; walking rats get a phase from distance travelled */
const R = (id, x, z, facing, opts, scale = 0.42, extra = {}) => ({ id, type: "rat", x, z, facing, scale, blobW: 0.7, opts: Q({ blink: 0, ...opts }), ...extra });
const ratPh = (d, scale) => ((d / (0.62 * scale)) % 1 + 1) % 1;

export const cardsAt = (f, camPos) => {
  const s = shotAt(f), out = [];
  const add = (c) => { if (c.opts && c.type !== "rat") c.opts = Q(c.opts); out.push(c); };
  // ---- 1-2: the reward table on the street ----
  if (s.id === 1 || s.id === 2) {
    const pay = f >= 30 && f < 150, scared = f >= T.banyak + 8;
    const up = scared ? smooth((f - T.banyak - 8) / 8) : 0;
    add(P("official", FR, -0.95, -3.25, 1, { expr: scared ? "shock" : f < 30 ? "stern" : "smug", armF: scared ? "up" : pay ? "coin" : "hip", armB: scared ? "up" : "hip", look: 0.7, tilt: scared ? -3 * Math.sin(f * 0.5) : 0 }, f, 3, { y: 0.5 * up }));
    add(P("catcher", CA(0), 0.38, -1.85, -1, { expr: f > 70 ? "grin" : "smug", armF: f < 150 ? "dangle" : "hip", armB: "hang", swing: f * 0.25, look: -0.5 }, f, 5));
    if (s.id === 2) {
      for (let i = 0; i < 46; i++) {
        const side = i % 2 ? 1 : -1, t0 = T.banyak - 14 + (i % 23) * 1.6, sp = 0.05 + 0.03 * rnd(i, 1);
        const d = (f - t0) * sp; if (d < 0) continue;
        const x0 = side * (2.8 + 7 * rnd(i, 2)), x = x0 - side * d, z = -1.4 + 5.6 * rnd(i, 3);
        if (Math.abs(x) > 26) continue;
        add(R("r" + i, x, z, faceFor(f, -side, 0), { walk: 1, phase: ratPh(d, 0.4), expr: rnd(i, 4) > 0.5 ? "happy" : "sly", tail: "long", tw: f * 0.3 + i }, 0.38 + 0.08 * rnd(i, 5)));
      }
      if (f > 196) add(R("rTable", -0.4, -2.55, 1, { expr: "grin", tail: "long", tw: f * 0.2 }, 0.34, { y: 0.9 + 0.12 * back((f - 196) / 8), blob: false }));
    }
  }
  // ---- 3: roadworks, workers digging ----
  if (s.id === 3) {
    for (let i = 0; i < 5; i++) {
      const x = -4 + i * 3.1, dg = Math.sin(f * 0.22 + i * 1.7);
      add(P("w" + i, CA(i), x, -2.95 + 0.25 * (i % 2), i % 2 ? -1 : 1, { expr: "determined", armF: "dig", armB: "dig", tilt: 8 * dg, bob: 6 * dg }, f, 20 + i));
    }
  }
  // ---- 4: the toll road in the sewer ----
  if (s.id === 4) {
    for (let i = 0; i < 26; i++) {
      const lane = i % 2 ? 1.6 : -1.6, sp = 0.11 + 0.03 * rnd(i, 1), d = (f - 360) * sp + 26 * rnd(i, 2);
      const x = 10 - (d % 30);
      add(R("s" + i, x, lane + 0.12 * Math.sin(i), faceFor(f, -1, 0), { walk: 1, phase: ratPh(d, 0.42), expr: i % 3 ? "happy" : "grin", tail: "long", tw: f * 0.4 + i }, 0.5, { y: SEW, blob: false }));
    }
  }
  // ---- 5: bathroom ----
  if (s.id === 5) {
    const pop = f >= 470 ? back((f - 470) / 9) : 0, shock = f >= 476;
    add(P("official", FR, 19.55, OZ - 1.7, 1, { expr: shock ? "shock" : "neutral", armF: shock ? "up" : "hang", armB: shock ? "up" : "hang", look: 0.9, tilt: shock ? -6 * act(f, 476, 10) : 0 }, f, 3, { y: shock ? 0.18 * Math.max(0, Math.sin(Math.min(1, (f - 476) / 10) * Math.PI)) : 0, blob: false }));
    if (pop > 0) add(R("rBasin", 20.3, OZ - 2.3, -1, { expr: "grin", tail: "long", wave: f > 486 ? 1 : 0, k: f * 0.05, face: "cam" }, 0.48 * pop, { y: 0.96, blob: false, shadow: false }));
    if (shock) add(fx("bang", "bang2", clamp01((f - 476) / 10), 19.15, 2.5, OZ - 1.6, 1.0));
  }
  // ---- 6-7, 12: office ----
  if (s.id === 6 || s.id === 7 || s.id === 12) {
    const posterO = { unroll: s.id === 6 ? smooth((f - 532) / 22) : 1, icon: s.id === 6 ? clamp01((f - T.satuEkor + 2) / 8) : 1, coinA: s.id === 6 ? clamp01((f - T.satuSen + 2) / 8) : 1, stamp: s.id === 12 ? clamp01((f - T.dihentikan + 3) / 7) : 0 };
    add({ id: "poster", type: "poster", x: -2.4, y: 0.95, z: OZ - 3.97, yaw: 0, scale: 1.32, blob: false, shadow: false, opts: Q(posterO) });
    if (s.id !== 12) {
      const pileH = s.id === 6 ? (f >= T.bukti + 6 ? 0.08 : 0) : lerp(0.1, 1, easeOut((f - 732) / 46));
      const peek = s.id === 7 && f > 760;
      add(P("official", FR, s.id === 7 ? -0.35 : 0.25, OZ - 1.75, 1, { expr: s.id === 7 ? (peek ? "shock" : "nervous") : f > T.bukti + 8 ? "stern" : "smug", armF: s.id === 6 && f > T.bukti + 8 ? "clip" : "hang", armB: s.id === 7 ? "up" : "hang", look: 0.7 }, f, 3, { y: 0.25 + (peek ? 0.3 * smooth((f - 760) / 8) : 0), blob: false }));
      add(P("catcher", CA(0), 1.35, OZ - 0.1, -1, { expr: "grin", armF: s.id === 6 && f >= T.bukti - 4 && f < T.bukti + 20 ? "reach" : "hip", armB: "hang", look: -0.6 }, f, 5));
      if (s.id === 7) for (let i = 1; i < 4; i++) add(P("q" + i, CA(i), 1.7 + 0.55 * i, OZ - 0.3 + 0.45 * i, -1, { expr: i % 2 ? "grin" : "smug", armF: "coin", look: -0.6 }, f, 5 + i));
      if (pileH > 0) add({ id: "tails", type: "tails", x: s.id === 7 ? 0.95 : 0.75, y: 0.94, z: OZ - 1.05, yaw: 0, scale: s.id === 6 ? 0.5 : 0.62 + 0.9 * pileH, h: Math.round(pileH * 20) / 20, blob: false });
      if (s.id === 6 && f >= T.bukti + 6) add(fx("puff", "puff", clamp01((f - T.bukti - 6) / 14), 0.9, 0.97, OZ - 0.95, 0.5));
    }
  }
  // ---- 8: still around... alive... without a tail ----
  if (s.id === 8) {
    const out_ = smooth((f - 792) / 44);
    add(P("official", FR, 0, lerp(-5.7, -4.3, out_), 1, { expr: f > T.tanpa + 10 ? "shock" : f > 860 ? "nervous" : "smug", armF: f > T.tanpa + 10 ? "up" : "hip", armB: f > T.tanpa + 10 ? "up" : "hip", look: 0.2 }, f, 3));
    for (let i = 0; i < 6; i++) {
      const sp = 0.035, d = (f - 790) * sp + 3 * i, x = 5 - (d % 14), z = 1.0 + 1.0 * (i % 3);
      add(R("bg" + i, x, z, faceFor(f, -1, 0), { walk: 1, phase: ratPh(d, 0.4), expr: "happy", tail: "stump", tw: f * 0.3 }, 0.38));
    }
    const arrive = smooth((f - 846) / 28), hx = lerp(3.4, 1.5, arrive);
    add(R("hero", hx, -1.5, -1, { walk: f < 874 ? 1 : 0, phase: ratPh(3.4 - hx, 0.5), expr: f >= T.hidup ? "grin" : "happy", tail: "stump", tw: f > T.tanpa ? f * 0.5 : 0, face: f >= T.hidup - 3 ? "cam" : "side", wave: f >= T.hidup ? smooth((f - T.hidup) / 6) : 0, k: f * 0.04, fat: 0.7 }, 0.5));
    if (f >= T.tanpa + 6) add(fx("spk", "spark", clamp01((f - T.tanpa - 6) / 14), 1.86, 0.5, -1.45, 0.35));
  }
  // ---- 9: flashback in the alley at night ----
  if (s.id === 9) {
    const snip = f >= T.dipotong, release = f >= T.dilepas;
    const kOpen = f < T.dipotong ? 0.5 + 0.5 * Math.sin(f * 0.35) : Math.max(0, 1 - (f - T.dipotong) / 3);
    add(P("catcher", CA(0), AX - 0.95, OZ - 3.35, 1, { expr: snip ? "grin" : "determined", armF: release ? "reach" : "snip", armB: "hang", k: kOpen, look: 0.6 }, f, 5));
    // rat on the crate, then hops down and runs to the far end
    const rd = release ? easeOut((f - T.dilepas) / 26) : 0, rx = lerp(AX - 0.3, AX - 0.15, rd), rz = lerp(OZ - 3.2, OZ - 6.9, rd), ry = release ? 0.6 * (1 - rd) + 0.18 * Math.sin(Math.min(1, rd * 2) * Math.PI) * (1 - rd) : 0.6;
    add(R("rat", rx, rz, release ? faceFor(f, 0.05, -1) : 1, { expr: snip && !release ? "shock" : release ? "happy" : "sly", tail: snip ? "stump" : "long", walk: release && rd < 1 ? 1 : 0, phase: ratPh(rd * 3.7, 0.42), tw: f * 0.3 }, 0.42, { y: ry, blob: ry < 0.05 }));
    if (snip && f < T.dipotong + 24) { const u = (f - T.dipotong) / 24; add({ id: "cutTail", type: "tails", x: AX - 0.62, y: Math.max(0, 0.6 - 1.4 * u * u), z: OZ - 3.2, scale: 0.12, h: 0.12, blob: false, shadow: false, roll: u * 3 }); }
    if (snip && f < T.dipotong + 10) add(fx("bangS", "bang2", clamp01((f - T.dipotong) / 10), AX - 0.15, 1.15, OZ - 3.2, 0.6));
    if (f >= 1046) add(R("mate", AX - 0.55, OZ - 7.15, 1, { expr: f >= T.beranak ? "content" : "happy", tail: "long", tw: f * 0.2, cheek: 1 }, 0.4));
    if (f >= T.beranak) {
      add(fx("heart", "heart", clamp01((f - T.beranak) / 26), AX - 0.35, 0.85, OZ - 7.0, 1.0));
      for (let i = 0; i < 4; i++) { const t0 = T.beranak + 10 + i * 4; if (f >= t0) add(R("baby" + i, AX - 0.85 + i * 0.3, OZ - 6.7 + 0.08 * (i % 2), i % 2 ? 1 : -1, { expr: "happy", tail: "long", tw: f * 0.5 + i }, 0.22 * back((f - t0) / 7))); }
    }
  }
  // ---- 10: more rats, more tails, more money ----
  if (s.id === 10) {
    add(P("catcher", CA(0), AX - 0.25, OZ - 2.75, -1, { expr: f >= T.duit ? "grin" : "smug", armF: f >= T.duit ? "up" : "hip", armB: f >= T.duit ? "up" : "hip", look: -0.3 }, f, 5));
    for (let i = 0; i < 14; i++) { const t0 = T.makin1 - 2 + i * 2.2; if (f < t0) continue; add(R("m" + i, AX - 1.9 + 0.32 * (i % 4) + 0.1 * rnd(i, 1), OZ - 4.2 + 0.36 * Math.floor(i / 4), i % 2 ? 1 : -1, { expr: i % 3 ? "happy" : "grin", tail: "long", tw: f * 0.3 + i }, 0.3 * back((f - t0) / 6))); }
    if (f >= T.makin2 - 2) add({ id: "tails", type: "tails", x: AX + 0.95, z: OZ - 3.9, scale: 0.4 + 0.5 * easeOut((f - T.makin2 + 2) / 30), h: Math.round(lerp(0.2, 1, easeOut((f - T.makin2 + 2) / 30)) * 20) / 20, blob: false });
    add({ id: "basket", type: "basket", x: AX + 0.45, z: OZ - 2.2, scale: 1.1, fill: Math.round(clamp01((f - T.duit) / 28) * 20) / 20 });
    if (f >= T.duit) for (let i = 0; i < 8; i++) { const t0 = T.duit + i * 3, u = (f - t0) / 14; if (u < 0 || u > 1) continue; add(fx("c" + i, "coin", (f * 0.08 + i * 0.3) % 1, AX + 0.25 + 0.15 * Math.sin(i * 2), 2.2 - 1.6 * u * u, OZ - 2.35, 0.9)); }
  }
  // ---- 11: the rat farm ----
  if (s.id === 11) {
    const walk = smooth((f - 1238) / 70), oz_ = lerp(RF + 6.2, RF + 3.4, walk), found = f >= T.peternakan + 2;
    add(P("official", FR, 0.6, oz_, -1, { expr: found ? "shock" : "stern", armF: "clip", armB: found ? "up" : "clip", mode: walk < 1 && f < 1306 ? "march" : "stand", phase: (oz_ * 0.9) % 1, look: found ? 0.9 : 0.4, tilt: found ? -5 * act(f, T.peternakan + 2, 10) : 0 }, f, 3, { y: 0.32 }));
    add(P("farmer", CA(1), -1.4, RF + 1.0, 1, { expr: "grin", armF: "coin", armB: "hang", look: 0.4 }, f, 7, { y: 0.32 }));
    const pens = [[-3.5, RF - 1.5, 3.2, 2.4], [0.4, RF - 2.6, 3.0, 2.2], [3.9, RF - 1.2, 3.2, 2.4]];
    pens.forEach(([cx, cz, w, d], pi) => { for (let i = 0; i < 8; i++) { const x = cx - w / 2 + 0.3 + (w - 0.6) * rnd(pi * 8 + i, 1), z = cz - d / 2 + 0.25 + (d - 0.5) * rnd(pi * 8 + i, 2); add(R("p" + pi + "_" + i, x + 0.05 * Math.sin(f * 0.2 + i), z, rnd(i, 3) > 0.5 ? 1 : -1, { expr: rnd(i, 4) > 0.6 ? "grin" : "happy", tail: "long", tw: f * 0.3 + i, blink: blinkAt(f, i + pi * 9) }, 0.4, { y: 0.32, blob: false })); } });
    if (found) add(fx("bang", "bang2", clamp01((f - T.peternakan - 2) / 10), 1.05, 2.75, RF + 3.4, 0.9));
  }
  // ---- 13: rats stay, tails gone ----
  if (s.id === 13) {
    add(P("official", FR, -1.3, -3.25, 1, { expr: "tired", armF: "hang", armB: "hang", look: 0.5, headTilt: 6 }, f, 3));
    const lounge = [[-0.4, -2.55, 0.9, 1, "content"], [0.9, -0.9, 0, -1, "sly"], [1.7, -0.1, 0, 1, "content"], [-1.5, -0.5, 0, -1, "happy"], [0.3, 0.6, 0, -1, "sly"], [-0.9, 1.0, 0, 1, "content"], [1.3, 1.3, 0, 1, "grin"], [-2.0, 0.4, 0, -1, "content"]];
    lounge.forEach(([x, z, y, fc, ex], i) => add(R("l" + i, x, z, fc, { expr: ex, tail: "stump", lie: ex === "content", tw: f * 0.25 + i, blink: blinkAt(f, i + 3) }, 0.4, y ? { y, blob: false } : {})));
    const wig = f >= T.ekornya - 4 ? 1.2 * Math.sin((f - T.ekornya) * 0.9) : 0.2 * Math.sin(f * 0.2);
    add(R("hero", -0.35, -1.4, 1, { expr: f >= T.hilang ? "grin" : "content", tail: "stump", tw: wig, fat: 0.7, face: f >= T.hilang + 6 ? "cam" : "side" }, 0.5));
    if (f >= T.ekornya) add(fx("spk", "spark", clamp01((f - T.ekornya) / 14), -0.88, 0.5, -1.35, 0.3));
  }
  return out;
};
