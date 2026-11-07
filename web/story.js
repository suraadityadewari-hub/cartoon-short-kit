// Story timeline for "Perang Babi" (40.05 s, 1202 frames @ 30 fps). Everything is a pure function of the frame.
import * as C from "./cast.js";

export const FPS = 30, TOTAL = 1202;
let G = () => 1.6;
export const setGround = (fn) => { G = fn; };

// ---------- easing ----------
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const smooth = (x) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (x) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
export const easeOut = (x) => 1 - (1 - clamp01(x)) ** 3;
export const back = (x) => { const u = clamp01(x), c = 1.9; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2; };
export const spring = (x) => { const u = Math.max(0, x); return 1 - Math.exp(-6 * u) * Math.cos(11 * u); };
/** action curve: dips to -antic first (anticipation), then shoots past 1 and settles (overshoot). 0 before f0, 1 after. */
export const act = (f, f0, dur, antic = 0.15, a = 0.28) => {
  const u = (f - f0) / dur;
  if (u <= 0) return 0;
  if (u < a) return -antic * Math.sin((Math.PI / 2) * (u / a));
  if (u < 1) return -antic + (1 + antic) * back((u - a) / (1 - a));
  return 1;
};
const ramp = (f, a, b) => clamp01((f - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const hexLerp = (a, b, t) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
const idle = (f, seed) => ({ bob: 4 * Math.sin(f * 0.11 + seed * 2.1), tilt: 0.8 * Math.sin(f * 0.07 + seed), headTilt: 1.6 * Math.sin(f * 0.09 + seed * 1.7) });
const blinkAt = (f, seed) => { const per = 70 + (seed * 17) % 40, ph = (f + seed * 23) % per; return ph < 2 ? 1 : ph < 4 ? 0.5 : 0; };

// ---------- timing (from the voiceover) ----------
// phrase starts/ends in frames
export const T = {
  hookA: 0, babi1: 122, abad: 150, pulau: 191, duaNegara: 236, babiMilik: 274, petaniAm: 340, makan: 388, siPetani: 431, bang: 452, mati: 474,
  inggris: 517, amerika: 589, membalas: 650, tiga: 690, semua: 734, satuBabi: 778, tapi: 807, nggak: 827, duaBelas: 896, kaisar: 961, wasit: 1000,
  pulaunya: 1028, jatuhAm: 1060, korban: 1094, tetap: 1133, siBabi: 1174, end: 1201,
};

// ---------- lights ----------
export const LIGHTS = {
  day: { tLit: [1.06, 1.0, 0.9], tShade: [0.5, 0.49, 0.62], tLift: [0.03, 0.04, 0.07], tLambert: 0.35, tSideK: 0.84, tTerm: 0.2, tSat: 1.05, tBounce: [0, 0, 0], cardShadow: 0.64, contrast: 0.22, shTint: [-0.01, 0.0, 0.035], hiTint: [0.02, 0.015, 0.0], sun: "#fff3df", sunI: 0.95, sky: "#cfe8ff", ground: "#6f8f4a", hemiI: 0.62, az: -35, el: 48, skyTop: "#4aa3e4", skyHor: "#cfeaf6", cloud: "#ffffff", cardTint: "#ffffff", sat: 1.08, gain: [1.0, 1.0, 1.0] },
  golden: { tLit: [1.12, 0.9, 0.7], tShade: [0.6, 0.52, 0.6], tLift: [0.03, 0.03, 0.05], tLambert: 0.3, tSideK: 0.86, tTerm: 0.12, tSat: 1.08, tBounce: [0.06, 0.03, 0], contrast: 0.28, shTint: [0.03, -0.01, 0.05], hiTint: [0.04, 0.015, -0.02], cardShadow: 0.6, sun: "#ffc68c", sunI: 1.05, sky: "#ffd7b0", ground: "#6d5e40", hemiI: 0.55, az: -70, el: 16, skyTop: "#6f8ed6", skyHor: "#ffc89c", cloud: "#ffd8b8", cardTint: "#fff0dc", sat: 1.1, gain: [1.03, 0.98, 0.93] },
  dusk: { tLit: [1.0, 0.8, 0.78], tShade: [0.56, 0.48, 0.6], tLift: [0.03, 0.03, 0.05], tLambert: 0.3, tSideK: 0.86, tTerm: 0.12, tSat: 1.0, tBounce: [0.04, 0.02, 0.02], contrast: 0.25, shTint: [0.03, 0.0, 0.06], hiTint: [0.03, 0.0, 0.0], cardShadow: 0.62, sun: "#ffa8a0", sunI: 0.8, sky: "#c9a8e0", ground: "#4a3f55", hemiI: 0.6, az: -80, el: 9, skyTop: "#3d4a8f", skyHor: "#f2a99a", cloud: "#f6b8b0", cardTint: "#f5dee0", sat: 1.06, gain: [1.0, 0.96, 1.0] },
  night: { tLit: [0.55, 0.62, 0.95], tShade: [0.22, 0.26, 0.46], tLift: [0.02, 0.03, 0.06], tLambert: 0.35, tSideK: 0.84, tTerm: 0.2, tSat: 0.9, tBounce: [0, 0, 0], contrast: 0.2, shTint: [0.0, 0.01, 0.06], hiTint: [0.0, 0.0, 0.02], cardShadow: 0.7, sun: "#a9b8ff", sunI: 0.55, sky: "#6f7fc0", ground: "#283048", hemiI: 0.55, az: 40, el: 40, skyTop: "#14204a", skyHor: "#4d5d98", cloud: "#8a96c8", cardTint: "#b4bfe6", sat: 1.0, gain: [0.95, 0.98, 1.08] },
  hall: { tLit: [1.05, 0.94, 0.8], tShade: [0.55, 0.44, 0.42], tLift: [0.02, 0.02, 0.02], tLambert: 0.35, tSideK: 0.86, tTerm: 0.3, tSat: 1.0, tBounce: [0, 0, 0], cardShadow: 0.64, contrast: 0.26, shTint: [0.02, 0.0, 0.02], hiTint: [0.04, 0.02, 0.0], sun: "#ffe9c8", sunI: 0.75, sky: "#ffe6c4", ground: "#6a3d2a", hemiI: 0.75, az: 20, el: 35, skyTop: "#3a2a24", skyHor: "#3a2a24", cloud: "#ffffff", cardTint: "#fff4e6", sat: 1.08, shadow: false, fogN: 400, fogF: 2000, gain: [1.02, 1.0, 0.97] },
};
const lerpLight = (a, b, t) => {
  const o = {};
  for (const k of Object.keys(a)) {
    const va = a[k], vb = b[k];
    if (typeof va === "string" && va[0] === "#") o[k] = hexLerp(va, vb, t);
    else if (typeof va === "number") o[k] = lerp(va, vb, t);
    else if (Array.isArray(va)) o[k] = va.map((x, i) => lerp(x, vb[i], t));
    else o[k] = t < 0.5 ? va : vb;
  }
  return o;
};

// ---------- shots ----------
export const SHOTS = [
  { id: 1, a: 0, b: 148, light: "day" },     // hook: two soldiers nose to nose, tilt down to the pig
  { id: 2, a: 148, b: 268, light: "day" },   // aerial island, two flags pop
  { id: 3, a: 268, b: 388, light: "day" },   // pig trots into the garden
  { id: 15, a: 388, b: 425, light: "day" },  // insert: munching
  { id: 4, a: 425, b: 462, light: "day" },   // farmer CU, bang
  { id: 5, a: 462, b: 510, light: "day" },   // garden wide: birds, ghost rises
  { id: 6, a: 510, b: 586, light: "day" },   // official threatens at the cabin door
  { id: 7, a: 586, b: 648, light: "day" },   // US troops march in
  { id: 8, a: 648, b: 730, light: "golden" },// three warships glide in
  { id: 9, a: 730, b: 800, light: "golden" },// insert: the bitten potato, armies behind
  { id: 10, a: 800, b: 890, light: "golden" },// standoff, nobody shoots
  { id: 11, a: 890, b: 960, light: "cycle" }, // twelve years pass
  { id: 12, a: 960, b: 1090, light: "hall" }, // the Kaiser arbitrates
  { id: 13, a: 1090, b: TOTAL, light: "dusk" },// grave + ghost pig
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

export const lightAt = (f) => {
  const s = shotAt(f);
  if (s.light === "cycle") {
    const seq = ["golden", "night", "day", "golden", "night", "day"], u = clamp01((f - s.a) / (s.b - s.a)) * (seq.length - 1);
    const i = Math.min(seq.length - 2, Math.floor(u)); return lerpLight(LIGHTS[seq[i]], LIGHTS[seq[i + 1]], smooth(u - i));
  }
  if (s.id === 10) return lerpLight(LIGHTS.golden, LIGHTS.dusk, smooth((f - 800) / 90) * 0.6);
  return LIGHTS[s.light];
};
export const flashAt = (f) => {
  let v = 0;
  for (const a of [890, 960, 1090]) if (f >= a && f < a + 7) v = Math.max(v, 1 - (f - a) / 7);
  if (f >= T.bang && f < T.bang + 3) v = Math.max(v, 0.55 * (1 - (f - T.bang) / 3));
  if (f >= 1058 && f < 1061) v = Math.max(v, 0.25);
  return v;
};

// ---------- cameras ----------
// keys: [frame, pos, look, fov, roll]
const CAMS = {
  1: [[0, [0.05, 2.85, 21.2], [0, 2.78, 26], 38, 0], [92, [-0.02, 2.82, 21.45], [0, 2.72, 26], 37.5, 0], [124, [0, 2.3, 21.9], [0, 2.05, 25.8], 37, 0], [148, [0.02, 2.26, 22.2], [0, 2.03, 25.8], 36, 0]],
  2: [[148, [70, 105, 160], [0, 0, 8], 44, 0], [268, [26, 58, 96], [0, 2, 14], 44, 0]],
  3: [[268, [9.6, 3.0, 7.2], [8.5, 2.0, 2.6], 36, 0], [318, [8.6, 3.9, 9.0], [6.0, 2.1, 2.6], 38, 0], [372, [3.6, 4.6, 10.5], [1.6, 2.5, -3], 42, 0], [388, [3.6, 4.6, 10.4], [1.6, 2.5, -3], 42, 0]],
  15: [[388, [1.75, 2.28, 3.88], [2.95, 1.98, 2.6], 42, 0], [425, [1.9, 2.22, 3.82], [2.95, 1.97, 2.6], 38, 0]],
  4: [[425, [-4.95, 3.05, -1.25], [-3.3, 2.8, -5.45], 36, 0], [462, [-4.7, 3.0, -1.85], [-3.3, 2.8, -5.45], 34, 1.5]],
  5: [[462, [5.8, 4.0, 9.5], [2.6, 3.1, 1.5], 44, 0], [510, [5.6, 4.6, 9.2], [2.8, 4.1, 1.8], 42, 0]],
  6: [[510, [-0.8, 3.25, -3.6], [-3.5, 2.75, -8.8], 46, 0], [586, [-1.2, 3.15, -4.3], [-3.5, 2.75, -8.8], 43, 0]],
  7: [[586, [15.6, 3.1, 36.2], [22.6, 2.5, 40.2], 41, 0], [648, [12.9, 3.1, 36.3], [20.0, 2.5, 40.2], 41, 0]],
  8: [[648, [0, 2.9, 48.6], [2, 6.5, 100], 50, 0], [730, [0, 3.0, 49.6], [3, 7, 100], 48, 0]],
  9: [[730, [0.4, 2.14, 11.3], [0.4, 1.95, 14.0], 34, 0], [800, [0.42, 2.02, 12.0], [0.4, 1.8, 14.0], 30, 0]],
  10: [[800, [0, 3.0, 19.0], [0, 2.6, 26], 40, 0], [883, [0, 2.85, 22.6], [0, 2.72, 26], 36, -3], [890, [0, 2.84, 22.7], [0, 2.72, 26], 36, -3]],
  11: [[890, [0, 3.5, 19.0], [0, 2.7, 26], 42, 0], [960, [0, 3.35, 19.9], [0, 2.7, 26], 41, 0]],
  12: [[960, [-0.85, 2.15, -498.3], [-1.15, 2.05, -502.6], 40, 0], [1018, [-0.9, 2.2, -498.6], [-1.15, 2.1, -502.6], 39, 0], [1046, [-0.9, 3.0, -495.0], [-1.0, 3.15, -503], 42, 0], [1090, [-0.9, 2.95, -495.6], [-1.0, 3.2, -503], 40, 0]],
  13: [[1090, [7.5, 6.8, 16.5], [2.5, 2.4, 3], 44, 0], [1128, [7.0, 6.2, 15.6], [2.7, 2.4, 3.5], 43, 0], [1170, [3.9, 2.55, 9.6], [3.4, 2.2, 6.2], 36, 0], [TOTAL, [3.85, 2.5, 9.3], [3.45, 2.3, 6.2], 34, 0]],
};
/** shots whose camera keys are joined with a Catmull-Rom curve; the others glide straight between keys */
export const CURVED = new Set([]);
const KICKS = [[T.bang, 0.06], [1060, 0.05], [T.tetap, 0.02]];
export const camAt = (f) => {
  const s = shotAt(f), keys = CAMS[s.id], n = keys.length;
  let i = 0;
  while (i < n - 2 && f > keys[i + 1][0]) i++;
  const k0 = keys[i], k1 = keys[Math.min(i + 1, n - 1)];
  const t = k1[0] === k0[0] ? 0 : glide((f - k0[0]) / (k1[0] - k0[0]));
  const P = (j) => keys[Math.max(0, Math.min(n - 1, j))];
  const cr = (idx) => { // Catmull-Rom through the key points: curved, continuous moves
    const p0 = P(i - 1)[idx], p1 = P(i)[idx], p2 = P(i + 1)[idx], p3 = P(i + 2)[idx], t2 = t * t, t3 = t2 * t;
    return [0, 1, 2].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3));
  };
  const curved = CURVED.has(s.id) && n > 2;
  const pos = curved ? cr(1) : lerp3(k0[1], k1[1], t), look = curved ? cr(2) : lerp3(k0[2], k1[2], t);
  // creep + kicks
  const crp = 0.015; pos[0] += crp * Math.sin(f * 0.031); pos[1] += crp * Math.sin(f * 0.023 + 1);
  for (const [kf, amp] of KICKS) if (f >= kf && f < kf + 8) { const u = (f - kf) / 8, a = amp * (1 - u) * (1 - u); pos[0] += a * Math.sin(f * 2.9); pos[1] += a * Math.cos(f * 3.7); look[1] += a * 0.6 * Math.sin(f * 4.1); }
  return { pos, look, fov: lerp(k0[3], k1[3], t), roll: lerp(k0[4], k1[4], t) };
};
export const dofAt = (f) => {
  const s = shotAt(f), cam = camAt(f), d = (p) => Math.hypot(p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]);
  switch (s.id) {
    case 1: return { cInf: 9, focus: lerp(d([0, 2.9, 26]), d([0, 2.0, 25.8]), smooth((f - 100) / 20)) };
    case 3: return { cInf: f < 330 ? 7 : 3, focus: d([pigX(f), 2.0, 2.6]) };
    case 15: return { cInf: 11, focus: d([2.9, 2.0, 2.6]) };
    case 4: return { cInf: 10, focus: d([-3.75, 2.9, -5.6]) };
    case 6: return { cInf: 7, focus: d([-3.3, 2.8, -8.7]) };
    case 7: return { cInf: 5, focus: d([x7(f) + 1.5, 2.6, 40]) };
    case 9: return { cInf: 14, focus: lerp(d([0, 2.6, 26]), d([0.4, 1.75, 14.0]), smooth((f - 762) / 16)) };
    case 10: return { cInf: 8, focus: d([0, 2.9, 26]) };
    case 12: return { cInf: f < 1030 ? 7 : 3, focus: d([-1.2, 1.9, -502.6]) };
    case 13: return { cInf: f > 1140 ? 9 : 0, focus: d([3.3, 2.1, 6.2]) };
    default: return { cInf: 0, focus: 10 };
  }
};
export const shadowAt = (f) => {
  const s = shotAt(f);
  const F = { 1: [[0, 1.6, 26], 10], 2: [[0, 1.6, 14], 70], 3: [[4, 1.6, 1], 14], 4: [[-3.75, 1.6, -5.6], 8], 5: [[2, 1.6, 0], 18], 6: [[-3.4, 1.6, -9], 10], 7: [[18, 1.6, 40], 14], 8: [[0, 1.6, 54], 10], 9: [[0.5, 1.6, 17], 14], 10: [[0, 1.6, 26], 10], 11: [[0, 1.6, 24], 14], 12: [[0, 0, -501], 10], 13: [[3, 1.6, 5], 12], 15: [[3, 1.6, 2.6], 6] }[s.id];
  return { focus: F[0], span: F[1] };
};

// ---------- world state ----------
const shipX = (f, i) => { const a = 655 + i * 14, fin = [-24, 6, 32][i]; return lerp(-150, fin, easeOut((f - a) / 46)); };
export const worldAt = (f) => {
  const s = shotAt(f);
  const ships = [0, 1, 2].map((i) => ({ vis: f >= 648, x: f >= 648 ? shipX(f, i) : [-24, 6, 32][i], z: [92, 104, 88][i] }));
  const flagPop = s.id === 2 ? back((f - 222) / 14) : 1;
  let leafCol = "#5aa548";
  if (s.id === 11) { const u = (f - 890) / 70; leafCol = u < 0.33 ? hexLerp("#5aa548", "#e08a2c", smooth(u / 0.33)) : u < 0.66 ? hexLerp("#e08a2c", "#eef2f6", smooth((u - 0.33) / 0.33)) : hexLerp("#eef2f6", "#6cbf4f", smooth((u - 0.66) / 0.34)); }
  if (s.id === 13) leafCol = "#5aa548";
  const mapWin = f < 1060 ? 0 : Math.min(1, Math.round(back((f - 1060) / 12) * 20) / 20);
  return { ships, flagPop, leafCol, mapWin };
};

// ---------- the pig's path ----------
const x7 = (f) => 21 - 0.043 * (f - 586);
export const pigX = (f) => lerp(8.8, 3.35, smooth((f - 268) / 106));
const pigWalk = (f) => (f < 374 ? 1 : 0);

// ---------- cards ----------
const US = (v) => C.US_SOLDIER(v), UK = (v) => C.UK_SOLDIER(v);
const P = (id, outfit, x, z, facing, opts, f, seed) => {
  const i = idle(f, seed);
  return { id, type: "person", outfit, x, z, facing, opts: { seed, bob: i.bob, tilt: i.tilt, headTilt: i.headTilt, blink: blinkAt(f, seed), ...opts } };
};
const Q = (o) => { // quantize opts so card textures redraw only on visible change
  const r = {}; for (const [k, v] of Object.entries(o)) r[k] = typeof v === "number" ? Math.round(v * 20) / 20 : v; return r;
};
const fx = (id, type, t, x, y, z, scale, extra = {}) => ({ id, type, t: Math.round(t * 30) / 30, x, y, z, scale, soft: true, shadow: false, blob: false, ...extra });

export const cardsAt = (f, camPos) => {
  const s = shotAt(f), out = [];
  const add = (c) => { if (c.opts) c.opts = Q(c.opts); out.push(c); };
  if (s.id === 1 || s.id === 10) {
    const tense = s.id === 10, aim = { armF: "aim", armB: "aim", rifle: true };
    const look = tense ? (Math.sin(f * 0.25) > 0 ? 0.9 : -0.6) : 0.6;
    const sw = tense ? clamp01((f - 812) / 60) : 0;
    add(P("us0", US(0), 0.55, 26, 1, { ...aim, expr: tense ? "nervous" : "angry", look, sweat: sw, tilt: tense ? 4 * act(f, T.tapi - 4, 10) : 0 }, f, 3));
    add(P("uk0", UK(0), -0.55, 26.2, -1, { ...aim, expr: tense ? "scared" : "angry", look, sweat: sw, tilt: tense ? 4 * act(f, T.tapi - 2, 10) : 0 }, f, 5));
    if (tense) {
      for (let i = 1; i < 3; i++) {
        add(P("us" + i, US(i), 0.6 + 1.5 * i, 26.8 + 0.6 * i, 1, { ...aim, expr: i % 2 ? "nervous" : "stern", sweat: sw * 0.7 }, f, 10 + i));
        add(P("uk" + i, UK(i), -0.6 - 1.5 * i, 27 + 0.6 * i, -1, { ...aim, expr: i % 2 ? "nervous" : "determined", sweat: sw * 0.7 }, f, 20 + i));
      }
    } else {
      // the pig between them, munching; looks up at the camera on "babi"
      const look = f >= T.babi1 - 4;
      const chew = look ? 0 : 0.5 + 0.5 * Math.sin(f * 0.8);
      add({ id: "pig", type: "pig", x: 0.15, z: 25.75, facing: -1, scale: 1.0, opts: { expr: look ? "content" : "munch", chew, cheek: look ? 0 : 1, bandana: true, spud: look ? -1 : 0.6, dip: 0.25 - 0.4 * act(f, T.babi1 - 6, 9), earW: look ? Math.sin(f * 0.6) : 0, tail: f * 9 } });
      if (look) add(fx("sp1", "spark", ((f - T.babi1) % 18) / 18, 0.95, 2.5, 25.6, 0.45));
    }
  }
  if (s.id === 2 && f >= 222) {
    for (const [x, id] of [[14, "a"], [-14, "b"]]) add(fx("pop" + id, "spark", clamp01((f - 222) / 20), x, 1.6 + 11, 21, 5));
  }
  if (s.id === 3 || s.id === 15) {
    const x = pigX(f), walking = f < 374, munch = f >= T.makan, stepPh = ((8.8 - x) / (0.00225 * 1.1) / 160) % 1;
    const chew = munch ? 0.5 + 0.5 * Math.sin((f - T.makan) * 0.85) : 0;
    add({ id: "pig", type: "pig", x, z: 2.6, facing: -1, scale: 1.1, opts: { phase: stepPh, walk: walking ? 1 : 0, expr: munch ? "munch" : "happy", chew, dip: munch ? 0.5 + 0.1 * Math.sin(f * 0.4) : 0, cheek: munch ? 1 : 0, bandana: true, spud: munch ? clamp01((f - T.makan) / 30) : -1, tail: f * 11, blink: blinkAt(f, 2) } });
    if (munch) add(fx("dirt", "puff", ((f - T.makan) % 14) / 14, x - 0.7, 1.75, 2.75, 0.8));
  }
  if (s.id === 4) {
    const up = smooth((f - 432) / 8);
    add(P("farmer", C.FARMER, -3.75, -5.6, 1, { expr: f < 436 ? "stern" : "angry", armF: up > 0.5 ? "aim" : "hip", armB: up > 0.5 ? "aim" : "hang", rifle: up > 0.5, look: 0.8, tilt: -3 * act(f, 428, 10) + (f >= T.bang ? -7 * Math.exp(-(f - T.bang) / 5) : 0) }, f, 7));
    if (f >= T.bang) {
      add(fx("bang", "bang", clamp01((f - T.bang) / 7), -3.75, 2.68, -5.6, 1.2, { glow: true, roll: 0 }));
      add(fx("smoke", "smoke", clamp01((f - T.bang) / 16), -3.75, 2.55, -5.5, 1.6));
    }
    // muzzle offset: place bang at the muzzle along the camera's right vector
    out.forEach((c) => { if (c.id === "bang" || c.id === "smoke") { const r = rightVec(camPos, [-3.75, 0, -5.6]); c.x += r[0] * (c.id === "bang" ? 0.98 : 1.4); c.z += r[2] * (c.id === "bang" ? 0.98 : 1.4); } });
  }
  if (s.id === 5) {
    add({ id: "potato", type: "potato", x: 3.0, z: 2.75, bite: 0.6, scale: 1.4, blob: false });
    const u = clamp01((f - 470) / 40);
    add({ id: "ghost", type: "pig", x: 3.35, y: 1.7 + 2.4 * smooth(u), z: 2.6, facing: -1, scale: 1.1, soft: true, shadow: false, blob: false, alpha: smooth((f - 466) / 8) * 0.95, opts: { ghost: true, halo: smooth((f - 474) / 10), expr: "content", wing: (f * 0.09) % 1, tail: f * 6 } });
    for (let i = 0; i < 7; i++) {
      const t0 = 452 + i * 2, u2 = (f - t0) / 40, bx = -1 + i * 1.1, bz = -9 + (i % 3);
      if (u2 > 0) add(fx("bird" + i, "bird", ((f * 0.13 + i * 0.3) % 1), bx + (i - 3) * 2.5 * u2, 5.5 + 7 * u2 + (i % 2) * 0.6, bz - 2 * u2, 1.4, { soft: false }));
    }
  }
  if (s.id === 6) {
    const shout = f >= T.inggris && f < 578;
    add(P("farmer", C.FARMER, -4.5, -8.9, 1, { expr: "nervous", armF: "hang", armB: "hang", sweat: clamp01((f - 525) / 30), look: 0.9 }, f, 7));
    add(P("official", C.UK_OFFICIAL, -2.5, -8.3, -1, { expr: shout ? (Math.floor(f / 6) % 2 ? "shout" : "angry") : "stern", armF: "scroll", armB: f > 540 ? "point" : "hang", tilt: -5 * act(f, T.inggris - 4, 10) * (f < 580 ? 1 : 0) }, f, 9));
  }
  if (s.id === 7) {
    // a column marching toward the garden, side view with planted feet (upstream bodySide), receding into depth
    const speed = 0.043, x0 = 21 - speed * (f - 586), step = 0.65;
    for (let i = 0; i < 5; i++) {
      const x = x0 + 1.45 * i, dist = speed * (f - 586) + 7;
      add({ id: "m" + i, type: "personSide", x, z: 40 + 0.15 * i, facing: 1,
        outfit: { jacket: "#33467a", pants: "#7d93c4", boots: "#241726", hat: "cap", cap: "#2a3866", buttons: "#e8c45a", rifle: true, belt: null, skin: C.SKINS[i % 4], moustache: i % 3 === 1 ? "#4a3426" : undefined },
        opts: { phase: ((dist / (2 * step)) + i * 0.5) % 1, mode: "march", expr: i === 0 ? "stern" : "neutral", stride: step / 0.83, seed: 30 + i, blink: blinkAt(f, 30 + i) } });
    }
  }
  if (s.id === 8) {
    const sh = f >= T.tiga - 6;
    add(P("b1", US(1), 0.75, 53.6, 1, { expr: sh ? "shock" : "stern", armF: "order", rifle: true, look: -1 }, f, 41));
    add(P("b2", US(2), -0.8, 54.0, -1, { expr: sh ? "shock" : "neutral", armF: sh ? "point" : "hang", look: -1 }, f, 42));
  }
  if (s.id === 9) {
    add({ id: "potato", type: "potato", x: 0.4, z: 14.0, bite: 0.6, scale: 1.0, blob: false });
    for (let i = 0; i < 3; i++) {
      add(P("us" + i, US(i), 0.6 + 1.5 * i, 26 + 0.6 * i, 1, { armF: "aim", armB: "aim", rifle: true, expr: "stern" }, f, 3 + i));
      add(P("uk" + i, UK(i), -0.6 - 1.5 * i, 26.2 + 0.6 * i, -1, { armF: "aim", armB: "aim", rifle: true, expr: "stern" }, f, 5 + i));
    }
  }
  if (s.id === 11) {
    const u = (f - 890) / 70, beard = smooth(u);
    const sleep = f > 932;
    add(P("us0", US(0), 1.0, 26, 1, { armF: "order", rifle: true, expr: sleep ? "sleep" : "tired", beard, headTilt: sleep ? 9 : 0 }, f, 3));
    add(P("uk0", UK(0), -1.0, 26.2, -1, { armF: "order", rifle: true, expr: u > 0.5 ? "tired" : "stern", beard: beard * 0.9 }, f, 5));
    if (sleep) add(fx("zz", "z", ((f - 932) % 30) / 30, 0.7, 4.1, 26, 0.9));
    for (let i = 0; i < 14; i++) {
      const kind = u < 0.36 ? "leaf" : u < 0.7 ? "snow" : null;
      if (!kind) continue;
      const ph = ((f * 0.012 + i * 0.137) % 1), x = -4 + ((i * 2.71) % 8), z = 23 + ((i * 1.3) % 5);
      add(fx("p" + i, kind, 0, x + 0.4 * Math.sin(f * 0.1 + i), 6.5 - 5 * ph, z, kind === "leaf" ? 2.2 : 1.8, { col: ["#e08a2c", "#d9542f", "#e8b23a"][i % 3], roll: f * 0.05 + i }));
    }
    if (u > 0.72) for (let i = 0; i < 4; i++) add({ id: "fl" + i, type: "flowers", x: -3 + i * 2, z: 28.5, col: ["#ffd84a", "#f27f9e"][i % 2], seed: i, scale: 2.2 * smooth((u - 0.72) / 0.2), blob: false, shadow: false });
  }
  if (s.id === 12) {
    const k = f < 990 ? 1 - smooth((f - 970) / 20) : f < 1050 ? 0.02 * Math.sin(f * 0.3) + 0.02 : 0.02 + 0.98 * act(f, 1050, 11, 0.35, 0.55);
    const expr = f < 1062 ? "stern" : "smug";
    add({ ...P("kaiser", C.KAISER, -1.2, -502.6, 1, { armF: "gavel", k: f < 970 ? 1 : k, expr, look: f > 1030 ? 1 : 0.3 }, f, 51), y: 0.55, blob: false });
    if (f >= 1060) add(fx("thud", "thud", clamp01((f - 1060) / 10), -0.55, 1.25, -501.5, 1.3));
    if (f >= 1062) add(fx("msp", "spark", clamp01((f - 1062) / 16), -0.6, 4.6, -505.5, 2.4, { glow: true }));
  }
  if (s.id === 13) {
    add({ id: "grave", type: "grave", x: 3.3, z: 6.2, scale: 0.85, blob: true, blobW: 0.5 });
    add({ id: "potato", type: "potato", x: 3.05, z: 6.55, bite: 0.6, scale: 0.8, blob: false });
    for (let i = 0; i < 3; i++) add({ id: "fl" + i, type: "flowers", x: 2.85 + i * 0.42, z: 6.45 + 0.1 * (i % 2), col: ["#ffd84a", "#f27f9e", "#ffffff"][i], seed: i + 4, scale: 0.7, blob: false });
    if (f >= T.siBabi - 4) {
      const u = (f - (T.siBabi - 4)) / 10;
      add({ id: "ghost", type: "pig", x: 3.95, y: 1.95 + 0.1 * Math.sin(f * 0.18), z: 6.35, facing: -1, scale: 0.85 * back(u), soft: true, shadow: false, blob: false, alpha: 0.95, opts: { ghost: true, halo: 1, expr: f > T.siBabi + 6 ? "content" : "happy", wing: (f * 0.1) % 1, tail: f * 8 } });
      add(fx("gsp", "spark", clamp01(u / 1.6), 4.3, 2.9, 6.3, 0.5, { glow: true }));
    }
  }
  return out;
};
const rightVec = (cam, p) => { const fx_ = p[0] - cam.x, fz = p[2] - cam.z, l = Math.hypot(fx_, fz) || 1; return [-fz / l, 0, fx_ / l]; };
