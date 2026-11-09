// Story timeline for "Perang Tanggal Ganjil" (Kinmen 1958-1979), 1940 frames @ 30 fps. Pure function of the frame.
import * as C from "./cast.js";

export const FPS = 30, TOTAL = 1940;
let G = () => 0;
export const setGround = (fn) => { G = fn; };

// ---------- easing ----------
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const smooth = (x) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (x) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
export const easeOut = (x) => 1 - (1 - clamp01(x)) ** 3;
export const back = (x) => { const u = clamp01(x), c = 1.9; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2; };
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rnd = (seed, k) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const idle = (f, seed) => ({ bob: 4 * Math.sin(f * 0.11 + seed * 2.1), tilt: 0.8 * Math.sin(f * 0.07 + seed), headTilt: 1.6 * Math.sin(f * 0.09 + seed * 1.7) });
const blinkAt = (f, seed) => { const per = 70 + (seed * 17) % 40, ph = (f + seed * 23) % per; return ph < 2 ? 1 : ph < 4 ? 0.5 : 0; };
const pop = (f, f0, d = 8) => back((f - f0) / d);

// ---------- timing (frames, from the tightened voiceover) ----------
export const T = {
  hook: 0, jadwal: 113, ganjil: 153, nama: 203, dikuasai: 251, padahal: 290, agustus: 389, menghujani: 455, selama: 553, lalu: 610, kira: 711,
  genap: 774, kami: 802, silakan: 847, sayur: 889, jadi: 957, kapal: 996, ganjil2: 1058, bunker: 1091, imlek: 1141, libur: 1160, lama: 1199,
  banyak: 1228, isinya: 1308, jadwal2: 1371, totalnya: 1482, hampir: 1508, sekarang: 1593, besi: 1621, satu: 1707, yang: 1785, rombongan: 1851, end: 1895,
};
const OFX = 2000, SMX = 2100, SHX = 2200;
const GUNX = [-8, 0, 8], GZ = 25.6, MUZ = (i) => [GUNX[i], 7.2, 22.3];

// ---------- lights ----------
const DAY = { tLit: [1.06, 1.0, 0.9], tShade: [0.5, 0.49, 0.62], tLift: [0.03, 0.04, 0.07], tLambert: 0.35, tSideK: 0.84, tTerm: 0.2, tSat: 1.05, tBounce: [0, 0, 0], cardShadow: 0.64, contrast: 0.22, shTint: [-0.01, 0.0, 0.035], hiTint: [0.02, 0.015, 0.0], sun: "#fff3df", sunI: 0.95, sky: "#cfe8ff", ground: "#8f7f5a", hemiI: 0.62, az: -35, el: 50, skyTop: "#4aa3e4", skyHor: "#d5ecf4", cloud: "#ffffff", cardTint: "#ffffff", sat: 1.08, gain: [1.0, 1.0, 1.0] };
export const LIGHTS = {
  day: DAY,
  aerial: { ...DAY, fogN: 900, fogF: 4000, el: 58 },
  room: { tLit: [1.05, 0.95, 0.82], tShade: [0.6, 0.5, 0.46], tLift: [0.03, 0.03, 0.03], tLambert: 0.35, tSideK: 0.86, tTerm: 0.3, tSat: 1.0, tBounce: [0, 0, 0], cardShadow: 0.64, contrast: 0.24, shTint: [0.02, 0.0, 0.02], hiTint: [0.04, 0.02, 0.0], sun: "#ffe9c8", sunI: 0.8, sky: "#ffeed8", ground: "#7a5a40", hemiI: 0.8, az: 40, el: 40, skyTop: "#3a2a24", skyHor: "#3a2a24", cloud: "#ffffff", cardTint: "#fff6ea", sat: 1.08, shadow: false, fogN: 400, fogF: 2000, gain: [1.02, 1.0, 0.97] },
  forge: { tLit: [1.15, 0.9, 0.7], tShade: [0.55, 0.45, 0.48], tLift: [0.04, 0.02, 0.02], tLambert: 0.35, tSideK: 0.86, tTerm: 0.3, tSat: 1.05, tBounce: [0.06, 0.02, 0], cardShadow: 0.64, contrast: 0.26, shTint: [0.03, 0.0, 0.02], hiTint: [0.05, 0.02, -0.01], sun: "#ffc890", sunI: 0.85, sky: "#ffd6b0", ground: "#6a4a30", hemiI: 0.75, az: -50, el: 35, skyTop: "#2a201c", skyHor: "#2a201c", cloud: "#ffffff", cardTint: "#fff0e0", sat: 1.1, shadow: false, fogN: 400, fogF: 2000, gain: [1.04, 0.99, 0.94] },
};

// ---------- shots ----------
export const SHOTS = [
  { id: 1, a: 0, b: 203, light: "day" },        // battery fires; the firing calendar
  { id: 2, a: 203, b: 389, light: "aerial" },   // where Kinmen is
  { id: 3, a: 389, b: 610, light: "day" },      // the 44-day barrage
  { id: 4, a: 610, b: 957, light: "room" },     // the defence minister's letter
  { id: 5, a: 957, b: 1058, light: "day" },     // even day: the supply boat
  { id: 6, a: 1058, b: 1141, light: "day" },    // odd day: into the bunker
  { id: 7, a: 1141, b: 1199, light: "day" },    // Lunar New Year: no shooting
  { id: 8, a: 1199, b: 1371, light: "day" },    // a dud full of leaflets
  { id: 9, a: 1371, b: 1593, light: "day" },    // 1959..1979, the heap of shells
  { id: 10, a: 1593, b: 1785, light: "forge" }, // the blacksmith
  { id: 11, a: 1785, b: TOTAL, light: "room" }, // the knife shop and the tour group
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const lightAt = (f) => LIGHTS[shotAt(f).light];

// gun fire events [frame, gun]
const FIRE = [[18, 2], [42, 1], [66, 2], [90, 2], ...Array.from({ length: 8 }, (_, k) => [1378 + k * 13, k % 2 ? 1 : 2])];
// impacts on the beach during the barrage (shot 3) and the odd day (shot 6)
const IMPACTS = [...Array.from({ length: 14 }, (_, k) => 440 + k * 12 + Math.round(5 * rnd(k, 3))), 1128, 1136];
const FLASH = [[18, 0.2], [T.ganjil, 0.15], [455, 0.25], [T.isinya, 0.3], [T.rombongan + 10, 0.18], [T.rombongan + 34, 0.16], [T.rombongan + 58, 0.14]];
export const flashAt = (f) => { let v = 0; for (const [a, k] of FLASH) if (f >= a && f < a + 5) v = Math.max(v, k * (1 - (f - a) / 5)); return v; };

// ---------- cameras: [frame, pos, look, fov, roll] ----------
const CAMS = {
  1: [[0, [8.9, 7.7, 31.2], [5.5, 3.6, -80], 40, 0], [113, [8.8, 7.6, 30.4], [5.5, 3.6, -80], 40, 0], [113, [2.5, 6.6, 33.6], [2.5, 6.1, 28], 40, 0], [203, [2.5, 6.6, 33.1], [2.5, 6.1, 28], 39, 0]],
  2: [[203, [0, 95, -25], [0, 0, -150], 40, 0], [251, [0, 88, -32], [0, 0, -150], 40, 0], [251, [3.2, 2.7, -101], [0.6, 2.2, -109.5], 40, 0], [290, [3.4, 2.7, -100.6], [0.6, 2.2, -109.5], 40, 0], [290, [0, 95, -25], [0, 0, -150], 40, 0], [389, [0, 300, 330], [0, 0, -150], 50, 0]],
  3: [[389, [8, 4.2, -96], [-2, 1.4, -112], 44, 0], [553, [7.6, 4.1, -96.6], [-2, 1.4, -112], 44, 0], [610, [7.3, 4.1, -96.9], [-2, 1.5, -112], 44, 0]],
  4: [[610, [OFX + 0.4, 2.0, 2.6], [OFX, 1.7, -2], 40, 0], [711, [OFX + 0.3, 2.0, 2.2], [OFX, 1.75, -2], 38, 0], [774, [OFX + 0.3, 2.0, 2.1], [OFX, 1.75, -2], 38, 0], [774, [OFX, 1.4, 2.6], [OFX, 1.25, -1], 40, 0], [847, [OFX, 1.4, 2.5], [OFX, 1.25, -1], 40, 0], [870, [OFX, 1.4, 3.4], [OFX, 1.25, -1], 42, 0], [957, [OFX, 1.4, 3.2], [OFX, 1.25, -1], 42, 0]],
  5: [[957, [-21, 6.4, -85], [-11, 1.2, -110], 44, 0], [1058, [-20.6, 6.3, -85.8], [-11, 1.2, -110], 44, 0]],
  6: [[1058, [-20.6, 6.3, -85.8], [-11, 1.2, -110], 44, 0], [1141, [-20.2, 6.2, -86.6], [-11, 1.2, -110], 44, 0]],
  7: [[1141, [-1.6, 7.0, 32.0], [-0.2, 6.6, 24.5], 42, 0], [1199, [-1.5, 6.95, 31.6], [-0.2, 6.6, 24.5], 41, 0]],
  8: [[1199, [3.6, 2.5, -98.2], [0, 1.4, -105], 42, 0], [1308, [3.1, 2.3, -99.0], [0, 1.5, -105], 40, 0], [1371, [3.0, 2.3, -99.2], [-0.2, 1.6, -105], 40, 0]],
  9: [[1371, [8.9, 7.7, 31.2], [5.5, 3.6, -80], 40, 0], [1482, [8.8, 7.6, 30.6], [5.5, 3.6, -80], 40, 0], [1482, [-12.5, 3.4, -95.5], [-21, 2.2, -106], 42, 0], [1593, [-11.8, 3.8, -94.5], [-21, 2.6, -106], 44, 0]],
  10: [[1593, [SMX + 1.9, 1.95, 3.0], [SMX + 0.3, 1.35, -1.2], 40, 0], [1707, [SMX + 1.7, 1.9, 2.6], [SMX + 0.3, 1.35, -1.2], 40, 0], [1707, [SMX + 0.62, 1.9, 3.8], [SMX + 0.62, 1.8, -1.3], 42, 0], [1785, [SMX + 0.62, 1.9, 3.6], [SMX + 0.62, 1.8, -1.3], 42, 0]],
  11: [[1785, [SHX, 2.2, 12.6], [SHX, 2.7, -1], 48, 0], [1851, [SHX, 2.2, 12.2], [SHX, 2.7, -1], 48, 0], [TOTAL, [SHX, 2.3, 13.8], [SHX, 2.7, -1], 50, 0]],
};
const KICKS = [...FIRE.map(([f]) => [f, 0.05]), ...IMPACTS.map((f) => [f, 0.04]), [T.banyak, 0.03], [T.isinya, 0.03]];
export const camAt = (f) => {
  const s = shotAt(f), keys = CAMS[s.id], n = keys.length;
  let i = 0;
  while (i < n - 2 && f >= keys[i + 1][0]) i++;
  const k0 = keys[i], k1 = keys[Math.min(i + 1, n - 1)];
  const t = k1[0] === k0[0] ? 0 : glide((f - k0[0]) / (k1[0] - k0[0]));
  const pos = lerp3(k0[1], k1[1], t), look = lerp3(k0[2], k1[2], t);
  const crp = 0.008; pos[0] += crp * Math.sin(f * 0.031); pos[1] += crp * Math.sin(f * 0.023 + 1);
  for (const [kf, amp] of KICKS) if (f >= kf && f < kf + 8 && shotAt(kf) === s) { const u = (f - kf) / 8, a = amp * (1 - u) * (1 - u); pos[0] += a * Math.sin(f * 2.9); pos[1] += a * Math.cos(f * 3.7); look[1] += a * 0.6 * Math.sin(f * 4.1); }
  return { pos, look, fov: lerp(k0[3], k1[3], t), roll: lerp(k0[4], k1[4], t) };
};
const dist = (f, p) => { const c = camAt(f).pos; return Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]); };
export const dofAt = (f) => {
  const s = shotAt(f);
  const D = { 1: f < 113 ? [0, [0, 6, 20]] : [4, [2.4, 6.3, 28]], 2: [0, [0, 0, 0]], 3: [3, [0.5, 1.6, -109.5]], 4: f < 774 ? [4, [OFX, 1.5, -2]] : [3, [OFX, 1.3, 0.4]], 5: [2, [-4, 1.5, -104]], 6: [2, [-6, 1.5, -108]], 7: [4, [0, 6.4, 27]], 8: [4, [0, 1.3, -110]], 9: f < 1482 ? [0, [0, 6, 20]] : [3, [-21, 1.8, -106]], 10: [4, [SMX + 0.4, 1.2, -1.2]], 11: [3, [SHX, 1.5, 0.5]] }[s.id];
  return D && D[0] ? { cInf: D[0], focus: dist(f, D[1]) } : { cInf: 0, focus: 10 };
};
export const shadowAt = (f) => {
  const s = shotAt(f);
  const F = { 1: [[0, 5, 20], 30], 2: [[0, 0, -110], 120], 3: [[0, 1, -110], 14], 4: [[OFX, 0, -1], 6], 5: [[-4, 1, -104], 24], 6: [[-6, 1, -108], 24], 7: [[0, 5, 26], 10], 8: [[0, 1, -110], 8], 9: f < 1482 ? [[0, 5, 20], 30] : [[-21, 1, -106], 12], 10: [[SMX, 0, -1], 6], 11: [[SHX, 0, 0], 12] }[s.id];
  return { focus: F[0], span: F[1] };
};
// world state: gun recoil, boat, bunker door
export const worldAt = (f) => {
  const guns = GUNX.map((_, i) => {
    let r = 0; for (const [ff, g] of FIRE) if (g === i && f >= ff && f < ff + 30) r = Math.max(r, 0.7 * Math.exp(-(f - ff) / 5));
    return { recoil: r, elev: 0.32 };
  });
  let boat = { x: -400, z: -98, rock: 0 };
  if (f >= T.jadi && f < T.imlek) { const u = glide((f - T.jadi) / 55); boat = { x: lerp(40, -18, u), z: -98.5, rock: 0.03 * Math.sin(f * 0.15), ry: 0 }; }
  const door = f < 1118 ? -1.4 : lerp(-1.4, 0, easeOut((f - 1118) / 7));
  return { guns, boat, door };
};

// ---------- cards ----------
const P = (id, outfit, x, z, facing, opts, f, seed, extra = {}) => {
  const i = idle(f, seed);
  return { id, type: "person", outfit, x, z, facing, opts: { seed, bob: i.bob, tilt: i.tilt, headTilt: i.headTilt, blink: blinkAt(f, seed), flip: facing === -1, ...opts }, ...extra };
};
const Q = (o) => { const r = {}; for (const [k, v] of Object.entries(o)) r[k] = typeof v === "number" ? Math.round(v * 20) / 20 : v; return r; };
const fx = (id, type, t, x, y, z, scale, extra = {}) => ({ id, type, t: Math.round(t * 30) / 30, x, y, z, scale, soft: true, shadow: false, blob: false, ...extra });
const prop = (id, type, opts, x, y, z, scale, extra = {}) => ({ id, type, opts: Q(opts), x, y, z, scale, blob: false, ...extra });
/** a shell in flight from a to b over dur frames, arc height h */
const flight = (out, id, f, f0, a, b, dur, h, sc) => {
  const u = (f - f0) / dur; if (u < 0 || u > 1) return;
  const x = lerp(a[0], b[0], u), z = lerp(a[2], b[2], u), y = lerp(a[1], b[1], u) + h * 4 * u * (1 - u);
  const vy = (b[1] - a[1]) + h * 4 * (1 - 2 * u), vh = Math.hypot(b[0] - a[0], b[2] - a[2]);
  out.push({ id, type: "shellC", opts: { col: "#5a5f66" }, x, y, z, scale: sc, roll: -Math.PI / 2 + Math.atan2(vy, vh) * 0.9, soft: true, shadow: false, blob: false });
};
const boom = (out, id, f, f0, x, y, z, sc) => {
  if (f < f0 || f >= f0 + 22) return;
  const t = (f - f0) / 22;
  if (t < 0.55) out.push(fx(id + "b", "bang", t / 0.55, x, y + 0.6 * sc, z, sc));
  out.push(fx(id + "p", "puff", t, x, y, z + 0.1, sc * 1.6));
};
const muzzle = (out, f) => {
  for (const [ff, g] of FIRE) {
    if (f < ff || f >= ff + 26) continue;
    const m = MUZ(g), t = (f - ff) / 26;
    if (f < ff + 6) out.push(fx("mz" + ff, "bang", (f - ff) / 6, m[0], m[1], m[2] - 0.6, 1.2));
    out.push(fx("sm" + ff, "smoke", t, m[0] + 0.4, m[1] + 0.4 * t, m[2], 2.2));
  }
};
const dayCalCard = (id, o, x, y, z, sc, f, f0, extra = {}) => prop(id, "dayCal", o, x, y, z, sc * pop(f, f0), { soft: true, shadow: false, ...extra });

export const cardsAt = (f, camPos) => {
  const s = shotAt(f), out = [];
  const add = (c) => { if (!c) return; if (c.opts && c.type === "person") c.opts = Q(c.opts); out.push(c); };
  // ---- 1: the battery; the firing calendar ----
  if (s.id === 1) {
    if (f < 113) GUNX.forEach((gx, i) => add(P("g" + i, C.PLA(i), gx - 1.45, GZ + 0.3, 1, { expr: "determined", armF: "cover", armB: "cover", look: 0.4 }, f, 10 + i)));
    muzzle(out, f);
    for (const [ff, g] of FIRE) if (ff < 200) { const m = MUZ(g), b = [GUNX[g] * 3 + 8 * (rnd(ff, 1) - 0.5), 1.6, -128]; flight(out, "sf" + ff, f, ff, m, b, 34, 22, 1.6); boom(out, "ib" + ff, f, ff + 34, b[0], 1.6, b[2], 9); }
    if (f >= 113) {
      add(P("cmd", C.PLA(3), 1.85, 28.4, 1, { expr: f < T.ganjil ? "determined" : "smug", armF: f < T.ganjil ? "point" : "hip", armB: "hip", look: 0.6 }, f, 31));
      add(prop("mcal", "monthCal", { t: clamp01((f - T.ganjil) / 40) }, 3.0, 5.25, 28.2, 0.72, { shadow: true, y: 5.25 }));
    }
  }
  // ---- 2: where Kinmen is ----
  if (s.id === 2) {
    if (f < T.dikuasai) add(fx("lk", "label", 0, 0, 14, -150, 18 * pop(f, T.nama + 6), { opts: { text: "KINMEN" } }));
    if (f >= T.dikuasai && f < T.padahal) {
      add(P("roc", C.ROC(0), 0.6, -109.6, 1, { expr: "happy", armF: "wave", armB: "hip", k: f / 12 }, f, 41));
      add(fx("lt", "label", 0, 0.5, 3.75, -109.8, 0.9 * pop(f, T.dikuasai + 4), { opts: { text: "TAIWAN", col: "#7ad0ff" } }));
    }
    if (f >= T.padahal) {
      add(fx("lk2", "label", 0, 0, 22, -160, 40, { opts: { text: "KINMEN" } }));
      add(fx("lc", "label", 0, 0, 30, 90, 50 * pop(f, T.padahal + 20), { opts: { text: "CHINA", col: "#ff8a7a" } }));
      add(fx("ltw", "label", 0, 150, 20, -1480, 200 * pop(f, T.padahal + 55), { opts: { text: "TAIWAN", col: "#7ad0ff" } }));
    }
  }
  // ---- 3: the barrage ----
  if (s.id === 3) {
    const scared = f >= 440;
    [[-3.0, 0], [0.6, 1], [4.2, 2]].forEach(([x, v], i) => add(P("r" + i, C.ROC(v), x, -109.6, i === 2 ? -1 : 1, { expr: scared ? (i === 1 ? "scared" : "shock") : "neutral", armF: scared ? "cover" : "hang", armB: scared ? "cover" : "hang", look: 0.5 }, f, 50 + i, { y: scared ? 0.72 + 0.04 * Math.sin(f * 0.9 + i) : 0.95 })));
    IMPACTS.forEach((ff, k) => { if (k >= 14) return; const x = -10 + 20 * rnd(k, 1), z = -114 - 8 * rnd(k, 2); boom(out, "im" + k, f, ff, x, 1.6, z, 3.2); flight(out, "if" + k, f, ff - 10, [x + 6, 26, -60], [x, 1.6, z], 10, 0, 0.8); });
    if (f >= T.selama) {
      const n = Math.min(44, 1 + Math.floor((f - T.selama - 6) * 0.9));
      add(dayCalCard("cal44", { n, head: "HARI KE-", col: "#d8312d", big: 170 }, 5.7, 3.25, -99.6, 0.55, f, T.selama, { y: 3.25 }));
    }
  }
  // ---- 4: the letter ----
  if (s.id === 4) {
    if (f < T.genap) {
      const writing = f < T.kira;
      add(P("peng", C.PENG, OFX, -2.0, 1, { expr: writing ? "determined" : "smug", armF: writing ? "write" : "scroll", armB: writing ? "hang" : "hip", k: f / 18, look: writing ? 0.7 : 0.2 }, f, 61, { y: 0.22 }));
    } else {
      add(prop("let", "letter", { t: clamp01((f - T.genap) / 40) }, OFX, 0.62, 0.15, 0.62, { shadow: false, y: 0.62 }));
      const G_ = [["beras", T.silakan, -0.42, 0.56], ["sayur", T.sayur, 0.0, 0.5], ["minyak", T.sayur + 18, 0.42, 0.56]];
      for (const [kind, f0, dx, y] of G_) if (f >= f0) add(prop("gd" + kind, "goods", { kind }, OFX + dx, y, 0.75, 0.5 * pop(f, f0), { shadow: false, y }));
      if (f >= T.sayur + 40) add(fx("tok", "label", 0, OFX, 2.0, 0.6, 0.6 * pop(f, T.sayur + 40), { opts: { text: "→ KINMEN" } }));
    }
  }
  // ---- 5: even day: the boat ----
  if (s.id === 5) {
    add(dayCalCard("calE", { n: 2 }, -18.2, 5.7, -90.0, 0.55, f, T.jadi + 2, { y: 5.7 }));
    const land = f >= T.kapal + 18;
    [[0, -12.5], [1, -10.8], [2, -9.2]].forEach(([v, x0], i) => {
      if (!land) { add(P("w" + i, C.ROC(v), x0, -103.2 - i * 0.9, -1, { expr: "happy", armF: "wave", k: f / 10, look: -0.3 }, f, 70 + i)); return; }
      const u = ((f - T.kapal - 18) / 50 + i * 0.33) % 1;
      add(P("w" + i, C.ROC(v), lerp(-17.0, -11.4, u), lerp(-101, -111.6, u), 1, { expr: "happy", armF: "sack", armB: "sack", mode: "march", phase: (f + i * 7) / 14, look: 0.2 }, f, 70 + i));
    });
    add(P("vil", C.WARGA_K(0), -8.2, -106.5, -1, { expr: "happy", armF: "wave", k: f / 9 }, f, 75));
  }
  // ---- 6: odd day: into the bunker ----
  if (s.id === 6) {
    add(dayCalCard("calO", { n: 3 }, -18.2, 5.7, -90.0, 0.55, f, T.ganjil2, { y: 5.7 }));
    const run = (f - T.bunker) / 30;
    [[0, -14.2, -102.5], [1, -12.4, -104], [2, -9.4, -105], [3, -7.6, -107]].forEach(([v, x0, z0], i) => {
      const u = clamp01(run - i * 0.18); if (u >= 1) return;
      const x = lerp(x0, -11, smooth(u)), z = lerp(z0, -112.6, smooth(u));
      add(P("b" + i, i === 3 ? C.WARGA_K(1) : C.ROC(v), x, z, -1, { expr: f < T.bunker ? "shock" : "scared", armF: f < T.bunker ? "hang" : "cover", armB: "cover", mode: f < T.bunker ? "stand" : "march", phase: f / 6 + i, look: -0.6 }, f, 80 + i));
    });
    for (const ff of IMPACTS.slice(14)) { boom(out, "o" + ff, f, ff, -14 + (ff % 7), 1.0, -106 - (ff % 3), 3.0); flight(out, "of" + ff, f, ff - 10, [-8, 26, -60], [-14 + (ff % 7), 1.0, -106], 10, 0, 0.8); }
  }
  // ---- 7: Lunar New Year ----
  if (s.id === 7) {
    add(dayCalCard("calI", { n: 0, head: "IMLEK", text: "LIBUR", col: "#d8312d", big: 110 }, -1.3, 7.02, 29.6, 0.38, f, T.imlek + 2, { y: 7.02 }));
    add(P("e0", C.PLA(0), 1.2, 27.4, -1, { expr: "grin", armF: "bowl", armB: "bowl", k: f / 14, look: -0.3 }, f, 91));
    add(P("e1", C.PLA(2), -1.4, 27.8, 1, { expr: "happy", armF: "bowl", armB: "bowl", k: f / 16 + 0.3, look: 0.3 }, f, 92));
    for (let i = 0; i < 3; i++) { const t = ((f - T.imlek) / 20 + i / 3) % 1; add(fx("fw" + i, "spark", t, -2 + i * 2, 9 + 0.5 * i, 22 - i, 1.2)); }
  }
  // ---- 8: the dud ----
  if (s.id === 8) {
    const land = T.banyak, opened = clamp01((f - T.isinya) / 8);
    if (f >= land - 8 && f < land) flight(out, "dud", f, land - 8, [5, 14, -88], [0.5, 1.0, -104.6], 8, 0, 0.5);
    if (f >= land) {
      add({ id: "dud", type: "shell", opts: { col: "#6a6f76", open: opened }, x: 0.5, y: 0.92, z: -104.6, scale: 0.75, roll: opened > 0 ? 0 : -0.35, blob: false });
      if (f < land + 14) add(fx("th", "thud", (f - land) / 14, 0.5, 1.05, -104.5, 1.2));
      if (f < land + 20) add(fx("tp", "puff", (f - land) / 20, 0.5, 1.0, -104.4, 1.4));
    }
    const near = clamp01((f - land - 30) / 50);
    const reading = f >= T.isinya + 22;
    add(P("rd", C.ROC(1), lerp(-2.6, -0.7, smooth(near)), -104.3, 1, { expr: reading ? "nervous" : f < land + 30 ? "shock" : "nervous", armF: reading ? "read" : near > 0 && near < 1 ? "hang" : "point", armB: reading ? "read" : "hang", paper: "PROPAGANDA", paperTop: "SELEBARAN", k: 1, mode: near > 0 && near < 1 ? "march" : "stand", phase: f / 14, look: 0.6 }, f, 101, { y: 1.0 }));
    if (f >= T.isinya) for (let i = 0; i < 16; i++) {
      const t = (f - T.isinya) / 60, up = Math.min(t, 0.25) / 0.25, a = rnd(i, 1) * Math.PI * 2;
      const x = 0.5 + Math.cos(a) * (0.4 + 1.6 * rnd(i, 2)) * Math.min(1, t * 3), z = -104.6 + Math.sin(a) * 0.6;
      const y = 1.6 + 2.2 * up * (0.6 + 0.6 * rnd(i, 3)) - Math.max(0, t - 0.25) * 1.4;
      if (y < 1.05) continue;
      add({ ...fx("lf" + i, "leaflet", (f * 0.03 + rnd(i, 4)) % 1, x, y, z, 0.7), roll: 0.6 * Math.sin(f * 0.1 + i) });
    }
  }
  // ---- 9: twenty years; the heap ----
  if (s.id === 9) {
    if (f < T.totalnya) {
      GUNX.forEach((gx, i) => add(P("g" + i, C.PLA(i), gx - 1.45, GZ + 0.3, 1, { expr: "tired", armF: "cover", armB: "cover", look: 0.4 }, f, 10 + i)));
      muzzle(out, f);
      const yr = Math.min(1979, 1959 + Math.floor(Math.max(0, f - T.jadwal2 - 8) / 4));
      add(dayCalCard("yr", { n: 0, head: "TAHUN", text: String(yr), col: "#3a4a5a", big: 104 }, 8.95, 7.9, 28.2, 0.42, f, T.jadwal2 + 2, { y: 7.85 }));
    } else {
      const h = 0.15 + 0.85 * smooth((f - T.totalnya) / 70);
      add(prop("pile", "pile", { h: Math.round(h * 9) / 9 }, -21, 1.0, -106, 0.4 + 1.6 * h, { shadow: true }));
      add(P("pw", C.ROC(2), -17.2, -104.6, -1, { expr: f > T.hampir ? "shock" : "nervous", armF: "hip", armB: "hip", look: -0.5 }, f, 111));
      if (f >= T.hampir + 6) add(fx("mil", "label", 0, -20.4, 4.9, -104.5, 2.4 * pop(f, T.hampir + 6), { opts: { text: "± 1.000.000" } }));
    }
  }
  // ---- 10: the blacksmith ----
  if (s.id === 10) {
    const hk = (f % 18) / 18, k = hk < 0.7 ? hk / 0.7 : 1 - (hk - 0.7) / 0.3, hit = hk >= 0.66 && hk < 0.78;
    const hammering = f < T.satu + 10;
    add(P("smith", C.PANDAI, SMX - 0.2, -1.05, 1, { expr: hammering ? "determined" : "grin", armF: hammering ? "gavel" : "point", armB: "hip", k: hammering ? k : 0, look: 0.7 }, f, 121));
    if (f < T.satu) add({ id: "hot", type: "shell", opts: { col: "#e8783a" }, x: SMX + 0.62, y: 1.22, z: -1.15, scale: 0.28, roll: -Math.PI / 2, blob: false, shadow: false, glow: true });
    if (hit && hammering && f < T.satu) for (let i = 0; i < 3; i++) add(fx("sp" + i, "spark", (hk - 0.66) / 0.12, SMX + 0.55 + 0.25 * (i - 1), 1.3 + 0.1 * i, -1.05, 0.5));
    if (f >= T.satu - 4) {
      add({ id: "src", type: "shell", opts: { col: "#7a7f86" }, x: SMX + 0.62, y: 1.17, z: -1.15, scale: 0.36, blob: false, shadow: false });
      for (let i = 0; i < 18; i++) {
        const f0 = T.satu + 4 + i * 2.6; if (f < f0) continue;
        const a = (-80 + i * (160 / 17)) * Math.PI / 180, r = 0.95 + 0.25 * (i % 2);
        add({ id: "kn" + i, type: "knife", x: SMX + 0.62 + Math.sin(a) * r, y: 1.75 + Math.cos(a) * r * 0.75, z: -1.0, scale: 0.42 * pop(f, f0, 6), roll: -a, soft: true, shadow: false, blob: false });
      }
    }
  }
  // ---- 11: the knife shop and the tour group ----
  if (s.id === 11) {
    const busy = f >= T.rombongan;
    add(P("smith", C.PANDAI, SHX + 0.1, 2.3, 1, { expr: busy ? (f < T.rombongan + 30 ? "shock" : "grin") : "happy", armF: busy ? "wave" : "hip", armB: "hip", k: f / 12, look: 0.2 }, f, 121));
    if (busy) {
      const arr = (i) => clamp01((f - T.rombongan - i * 5) / 30);
      add(P("guide", C.PEMANDU, lerp(SHX + 7, SHX + 1.3, smooth(arr(0))), 3.3, -1, { expr: "grin", armF: "flag", armB: "hip", k: f / 16, mode: arr(0) < 1 ? "march" : "stand", phase: f / 12, look: -0.3 }, f, 130));
      const spots = [[-2.3, 4.4], [2.3, 4.6], [-1.5, 5.6], [1.5, 5.8], [-0.9, 7.0], [0.9, 7.2], [-2.6, 6.6]];
      spots.forEach(([dx, z], i) => {
        const u = arr(i + 1), fromL = i % 2 === 0, x0 = SHX + (fromL ? -8 : 8), x1 = SHX + dx;
        const snap = u >= 1 && i % 2 === 1;
        add(P("t" + i, C.TURIS(i), lerp(x0, x1, smooth(u)), z, fromL ? 1 : -1, { expr: snap ? "happy" : "grin", armF: snap ? "camera" : i === 4 ? "point" : "hang", armB: snap ? "camera" : "hang", mode: u < 1 ? "march" : "stand", phase: f / 11 + i, look: fromL ? 0.4 : -0.4 }, f, 140 + i));
        if (snap) for (const ff of [T.rombongan + 10, T.rombongan + 34, T.rombongan + 58]) if (f >= ff + i * 2 && f < ff + i * 2 + 5) add(fx("fl" + i, "spark", (f - ff - i * 2) / 5, x1 + (fromL ? 0.25 : -0.25), 1.75, z + 0.1, 0.8));
      });
    }
  }
  return out;
};
