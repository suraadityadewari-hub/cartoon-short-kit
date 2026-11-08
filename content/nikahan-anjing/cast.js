// Cast for "Perang Babi": people (3/4 view facing right), the pig, props and 2D effects.
// People: design space 600 x 1000, soles at y = 975. Pig: 600 x 420, soles at y = 405.
import { Pen, INK, WHITE, rad, clamp, lerp, hexMul, mix, rnd, ellPts, bean, rrect, curve, rotPts } from "./pen.js";

export const SKINS = ["#ffe0bf", "#f2c49c", "#e9c3a3", "#c99068"];
const MOUTH = "#5a1e28", TONGUE = "#e86e78";
const L = rad(-130); // key light from upper-left on canvas

// ---------------- outfits ----------------
export const FARMER = { skin: "#f2c49c", coat: "#c8553d", pants: "#3f5f9a", boots: "#5a3b2a", hat: "straw", beard: "#7a4a2a", overalls: true };
export const US_SOLDIER = (v = 0) => ({ skin: SKINS[v % 4], coat: "#33467a", pants: "#7d93c4", boots: INK, hat: "kepi", hatCol: "#2a3866", belt: "#2b2220", buttons: "#e8c45a", moustache: v % 3 === 1 ? "#4a3426" : null });
export const UK_SOLDIER = (v = 0) => ({ skin: SKINS[(v + 1) % 4], coat: "#c9362f", pants: "#2e3140", boots: INK, hat: "shako", hatCol: "#26262e", belt: "#f1efe6", cross: true, buttons: "#e8c45a", moustache: v % 3 === 2 ? "#5a3a22" : null });
export const UK_OFFICIAL = { skin: "#ffe0bf", coat: "#2f3d3a", pants: "#4b4a52", boots: INK, hat: "top", hatCol: "#26232e", moustache: "#8a5a34", build: "stout", vest: "#c9a24a" };
export const OFFICIAL_FR = { skin: "#ffe0bf", coat: "#f1ede2", pants: "#e3dccb", boots: "#6b4429", hat: "pith", hatCol: "#f4efe0", band: "#b8955a", moustache: "#6a4426", whiskers: null, build: "stout", buttons: "#e8c45a", belt: "#7a5a3a" };
export const CATCHER = (v = 0) => ({ skin: ["#e2b17f", "#d9a372", "#e8bd8c"][v % 3], coat: ["#8a5a3a", "#5a6a8a", "#7a6a4a"][v % 3], pants: ["#2b2b33", "#3a3328", "#2e3340"][v % 3], boots: ["#e2b17f", "#d9a372", "#e8bd8c"][v % 3], hat: "nonla", hatCol: "#e9d39a" });
export const KAISER = { skin: "#ffe0bf", coat: "#2c3b63", pants: "#22283c", boots: INK, hat: "pickel", hatCol: "#1d1f26", whiskers: "#f1f0ea", moustache: "#f1f0ea", build: "stout", epaulettes: "#e8c45a", buttons: "#e8c45a", sash: "#e8b23a" };

// ---- Gunting Sjafruddin (Jakarta 1950) ----
export const WARGA = { skin: "#d9a372", coat: "#f4f1e6", pants: "#5a5348", boots: "#6b4429", hat: "peci", hatCol: "#1d1c22", collar: true, pocket: true };
export const KAKEK = { ...WARGA, brow: "#f1f0ea", moustache: "#f1f0ea" };
export const PEDAGANG = { skin: "#c99068", coat: "#e9e3d2", pants: "#3a5a7a", boots: "#c99068", hat: "iket", hatCol: "#8a4a2a", sarong: "#5a7a4a" };
export const SYAFRUDDIN = { skin: "#e9c3a3", coat: "#6f7480", pants: "#636874", boots: INK, hat: "peci", hatCol: "#1d1c22", glasses: "rect", lapels: true, tie: "#2c3b63" };
export const HATTA = { skin: "#f2c49c", coat: "#efe9da", pants: "#e2dccb", boots: "#3a2a22", hat: "peci", hatCol: "#1d1c22", glasses: "round", lapels: true, tie: "#7a2f35", build: "slight" };
export const RAHMI = { skin: "#f2c49c", coat: "#f6d3de", pants: "#7a4a2a", boots: "#c98a6a", hair: "#221a1e", bun: true, kebaya: true, inner: "#e98aa6", skirt: "#7a4a2a", skirtB: "#e8c47a", blush: true, lash: true, build: "slim" };
export const TELLER = { skin: "#e9c3a3", coat: "#f4f1e6", pants: "#3a3f4a", boots: INK, hat: "visor", hatCol: "#3f8a5a", hair: "#2a2224", collar: true, tie: "#2c3b63", moustache: "#3a2a22" };

// ---- Nikahan Anjing (Junagadh 1920s-1947) ----
export const NAWAB = { skin: "#e2b07f", coat: "#f2e3bd", pants: "#f6f1e4", boots: "#c9962a", hat: "pagri", hatCol: "#e89a32", kalgi: true, moustache: "#2a2224", beard: "#2f2626", build: "stout", coatLong: 0.55, trim: "#c9962a", buttons: "#e8c45a", pearls: true };
export const RAJA2 = { skin: "#d9a372", coat: "#a9d6c4", pants: "#f6f1e4", boots: "#c9962a", hat: "pagri", hatCol: "#d8434a", kalgi: true, moustache: "#2a2224", coatLong: 0.5, trim: "#e8c45a", buttons: "#e8c45a" };
export const SERVANT = (v = 0) => ({ skin: ["#d9a372", "#c99068", "#e2b07f"][v % 3], coat: "#f4f1e6", pants: "#f4f1e6", boots: ["#d9a372", "#c99068", "#e2b07f"][v % 3], hat: "pagri", hatCol: ["#f4f1e6", "#e9d6a8", "#f4f1e6"][v % 3], moustache: v % 2 ? "#2a2224" : null, coatLong: 0.4, collar: true });
export const SEPOY = (v = 0) => ({ skin: ["#d9a372", "#c99068", "#e2b07f"][v % 3], coat: "#c8362f", pants: "#f4f1e6", boots: INK, hat: "pagri", hatCol: "#f4f1e6", belt: "#f4f1e6", buttons: "#e8c45a", moustache: "#2a2224" });
export const IRWIN = { skin: "#ffe0bf", coat: "#2c2c36", pants: "#5a5a64", boots: INK, lapels: true, tie: "#7a2f35", build: "slim", brow: "#7a6a58" };
export const BEGUM = { skin: "#e9c3a3", coat: "#2f8a8a", pants: "#2f8a8a", boots: "#c98a6a", hat: "dupatta", hatCol: "#ef7a9a", hair: "#221a1e", skirt: "#2f8a8a", skirtB: "#e8c45a", blush: true, lash: true, build: "slim", pearls: true };
export const ANAK = { skin: "#e9c3a3", coat: "#f6d36a", pants: "#f6f1e4", boots: "#c98a6a", hair: "#221a1e" };

const BUILD = { adult: { a: 112, torso: 1.08, legs: 1.36, tw: 0.82 }, stout: { a: 114, torso: 1.12, legs: 1.26, tw: 0.98 }, slight: { a: 110, torso: 1.04, legs: 1.32, tw: 0.78 }, slim: { a: 106, torso: 1.0, legs: 1.36, tw: 0.72 } };

// ---------------- faces ----------------
const FACE = {
  neutral: { eye: "lid", brow: [0, -1], mouth: "dash" },
  stern: { eye: "lid", brow: [5, -2], mouth: "frown" },
  angry: { eye: "slit", brow: [8, -4], mouth: "teeth" },
  shock: { eye: "shock", brow: [-7, -6], mouth: "O" },
  nervous: { eye: "small", brow: [-4, 3], mouth: "wave" },
  scared: { eye: "shock", brow: [-6, 2], mouth: "teeth" },
  grin: { eye: "happy", brow: [-3, -3], mouth: "grin" },
  smug: { eye: "lid", brow: [2, -5], mouth: "smirk" },
  happy: { eye: "happy", brow: [-2, -2], mouth: "smile" },
  sleep: { eye: "dash", brow: [0, 0], mouth: "o" },
  tired: { eye: "slit", brow: [-2, 3], mouth: "dash" },
  shout: { eye: "lid", brow: [7, -3], mouth: "O" },
  determined: { eye: "dot", brow: [6, -1], mouth: "frown" },
};

const eye = (p, kind, x, ey, u, look) => {
  const lx = x + look * 3 * u, lw = 3.8 * u;
  switch (kind) {
    case "dot": p.ell(lx, ey, 4.4 * u, 6.2 * u, INK, 0); break;
    case "small": p.ell(lx, ey, 3.2 * u, 4.6 * u, INK, 0); break;
    case "lid": p.ell(lx, ey - u, 7 * u, 6.4 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey - u], [x + 9 * u, ey - u]], lw); break;
    case "slit": p.ell(lx, ey, 7 * u, 2.8 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey], [x + 9 * u, ey]], lw); break;
    case "happy": p.arc(x, ey + 3 * u, 8 * u, 6 * u, 200, 340, lw); break;
    case "dash": p.stroke([[x - 8.5 * u, ey], [x + 8.5 * u, ey]], lw); break;
    case "shock": p.ell(x, ey, 11.5 * u, 11.5 * u, WHITE, 2.6 * u); p.dot(lx, ey + 1.5 * u, 3.4 * u); break;
  }
};
const mouthDraw = (p, kind, mx, my, u, chew = 0) => {
  const mw = 4 * u;
  switch (kind) {
    case "dash": p.stroke([[mx - 6 * u, my], [mx + 6 * u, my - 0.8 * u]], mw); break;
    case "frown": p.arc(mx, my + 3 * u, 7 * u, 3.6 * u, 200, 340, mw); break;
    case "smirk": p.arc(mx + 2 * u, my - 3 * u, 7 * u, 4 * u, 10, 150, mw); break;
    case "smile": p.arc(mx, my - 3 * u, 8.5 * u, 5 * u, 20, 160, mw); break;
    case "grin":
      p.ell(mx, my - u, 12 * u, 8 * u, MOUTH, 0, 0, 180);
      p.clip(ellPts(mx, my - u, 12 * u, 8 * u, 0, 180), () => p.ell(mx, my - u, 12 * u, 3 * u, WHITE, 0));
      p.ell(mx, my - u, 12 * u, 8 * u, null, 3 * u, 0, 180); break;
    case "o": p.ell(mx + 2 * u, my + u, 3.5 * u, 4.2 * u, MOUTH, 2.8 * u); break;
    case "O": p.ell(mx, my + 3 * u, 8.5 * u, 11 * u * (0.7 + 0.3 * (1 - chew)), MOUTH, 3.2 * u); break;
    case "wave": { const s = []; for (let i = 0; i <= 12; i++) s.push([mx - 9 * u + i * 1.5 * u, my + 1.6 * u * Math.sin(i * 1.3)]); p.stroke(s, 3 * u); break; }
    case "teeth":
      p.poly([[mx - 11 * u, my - 4 * u], [mx + 11 * u, my - 4 * u], [mx + 10 * u, my + 4 * u], [mx - 10 * u, my + 4 * u]], WHITE, 3 * u);
      for (const j of [-1, 0, 1]) p.stroke([[mx + j * 5.5 * u, my - 4 * u], [mx + j * 5.5 * u, my + 4 * u]], 1.5 * u);
      break;
  }
};
const taper = (p, a, b, wa, wb, col = INK) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  p.poly([[a[0] + nx * wa / 2, a[1] + ny * wa / 2], [b[0] + nx * wb / 2, b[1] + ny * wb / 2], [b[0] - nx * wb / 2, b[1] - ny * wb / 2], [a[0] - nx * wa / 2, a[1] - ny * wa / 2]], col, 0);
  p.dot(a[0], a[1], wa / 2, col); p.dot(b[0], b[1], wb / 2, col);
};

// ---------------- hats ----------------
const hat = (p, o, cx, hc, A, B, u) => {
  const crown = hc - B, W = 2 * A;
  const col = o.hatCol || "#333";
  if (o.hair && (!o.hat || o.hat === "visor")) {
    if (o.bun) { p.form(ellPts(cx - 0.98 * A, hc - 0.2 * B, 0.36 * A, 0.34 * B), o.hair, 0.7, 5 * u, L, 0.4 * A); p.dot(cx - 0.8 * A, hc - 0.46 * B, 5 * u, "#e8c45a"); }
    p.form(ellPts(cx - 4 * u, hc - 0.18 * B, A * 1.04, B * 0.9, 180, 360), o.hair, 0.75, 5 * u, L, A);
    if (o.bun) p.stroke([[cx + 0.1 * A, hc - 1.02 * B], [cx + 0.55 * A, hc - 0.45 * B]], 2.4 * u, hexMul(o.hair, 1.8));
  }
  if (o.hat === "pagri") {
    const yb = crown + 0.5 * B, ht = 0.78 * B;
    const tp = [[cx - 0.98 * A, yb + 2 * u], [cx - 1.04 * A, yb - 0.55 * ht], [cx - 0.6 * A, yb - ht], [cx + 0.2 * A, yb - 1.08 * ht], [cx + 0.86 * A, yb - 0.8 * ht], [cx + 1.04 * A, yb - 0.2 * ht], [cx + 0.98 * A, yb + 4 * u]];
    p.form(tp, col, 0.72, 5 * u, L, A);
    p.clip(tp, () => { for (let i = 0; i < 4; i++) { const t = 0.2 + i * 0.2; p.stroke(curve([cx - 1.0 * A, yb - t * ht + 10 * u], [cx, yb - t * ht - 0.1 * ht], [cx + 1.0 * A, yb - (t + 0.15) * ht]), 2.4 * u, hexMul(col, 0.7)); } });
    p.ring(tp, 5 * u, L);
    if (o.kalgi) { p.ell(cx + 0.1 * A, yb - 0.62 * ht, 10 * u, 12 * u, "#d8434a", 2.6 * u); p.dot(cx + 0.1 * A, yb - 0.62 * ht, 4 * u, "#ffffff"); p.form([[cx + 0.04 * A, yb - 0.72 * ht], [cx - 0.18 * A, yb - 1.25 * ht], [cx - 0.42 * A, yb - 1.55 * ht], [cx - 0.12 * A, yb - 1.45 * ht], [cx + 0.18 * A, yb - 0.78 * ht]], "#f4f1e6", 0.8, 3 * u, L, 30 * u); }
  } else if (o.hat === "dupatta") {
    p.form(ellPts(cx - 4 * u, hc - 0.16 * B, A * 1.04, B * 0.9, 180, 360), o.hair || "#221a1e", 0.75, 5 * u, L, A);
    const dp = [[cx - 1.1 * A, hc + 1.05 * B], [cx - 1.18 * A, hc - 0.2 * B], [cx - 0.7 * A, hc - 1.0 * B], [cx + 0.2 * A, hc - 1.12 * B], [cx + 0.85 * A, hc - 0.85 * B], [cx + 0.55 * A, hc - 0.62 * B], [cx - 0.3 * A, hc - 0.78 * B], [cx - 0.75 * A, hc - 0.2 * B], [cx - 0.6 * A, hc + 1.15 * B]];
    p.form(dp, col, 0.74, 5 * u, L, A);
    for (let i = 0; i < 7; i++) p.dot(cx + 0.82 * A - i * 0.2 * A, hc - 0.8 * B - 0.25 * B * Math.sin(i * 0.5), 3.2 * u, "#e8c45a");
  } else if (o.hat === "peci") {
    const yb = crown + 0.4 * B, ht = 0.52 * B;
    p.form([[cx - 0.86 * A, yb + 3 * u], [cx - 0.8 * A, yb - ht], [cx + 0.86 * A, yb - ht - 4 * u], [cx + 0.94 * A, yb + 1 * u]], col, 0.7, 5 * u, L, A);
    p.ell(cx + 0.03 * A, yb - ht - 2 * u, 0.83 * A, 0.1 * B, hexMul(col, 1.7), 3.5 * u);
    p.stroke([[cx - 0.6 * A, yb - 0.35 * ht], [cx + 0.7 * A, yb - 0.38 * ht]], 1.6 * u, hexMul(col, 2.1));
  } else if (o.hat === "iket") {
    p.form(ellPts(cx - 3 * u, hc - 0.2 * B, A * 1.04, B * 0.88, 180, 360), col, 0.72, 5 * u, L, A);
    for (let i = -3; i <= 3; i++) p.dot(cx + i * 0.26 * A, hc - 0.62 * B + 4 * u * Math.abs(i % 2), 4 * u, "#e8c47a");
    p.band([[cx - 1.0 * A, hc - 0.36 * B], [cx + 1.02 * A, hc - 0.42 * B]], hexMul(col, 0.8), 12 * u, 2.5 * u, "butt");
    p.poly([[cx - 0.95 * A, hc - 0.42 * B], [cx - 1.45 * A, hc - 0.85 * B], [cx - 1.2 * A, hc - 0.3 * B]], hexMul(col, 0.9), 3 * u);
  } else if (o.hat === "visor") {
    p.band([[cx - 0.96 * A, crown + 0.4 * B], [cx + 0.96 * A, crown + 0.36 * B]], "#2f6a46", 8 * u, 2.2 * u, "butt");
    p.poly([[cx + 0.15 * A, crown + 0.34 * B], [cx + 1.32 * A, crown + 0.5 * B], [cx + 1.26 * A, crown + 0.64 * B], [cx + 0.1 * A, crown + 0.48 * B]], "rgba(80,175,120,0.82)", 3 * u);
  } else if (o.hat === "kepi") {
    // soft forage cap, top tilting forward (to +x), short dark visor
    const yb = crown + 0.3 * B;
    const pts = [[cx - 0.9 * A, yb + 4 * u], [cx - 0.82 * A, crown - 0.1 * B], [cx - 0.3 * A, crown - 0.32 * B], [cx + 0.75 * A, crown - 0.5 * B], [cx + 0.98 * A, crown - 0.36 * B], [cx + 0.92 * A, yb]];
    p.form(pts, col, 0.7, 5 * u, L, A);
    p.band([[cx - 0.86 * A, yb + 2 * u], [cx + 0.94 * A, yb - 2 * u]], hexMul(col, 0.8), 8 * u, 2 * u, "butt");
    p.poly([[cx + 0.35 * A, yb + 2 * u], [cx + 1.12 * A, yb + 8 * u], [cx + 1.06 * A, yb + 13 * u], [cx + 0.3 * A, yb + 8 * u]], "#17171c", 3 * u);
    p.ell(cx + 0.25 * A, yb - 0.18 * B, 7 * u, 6 * u, "#e8c45a", 2 * u);
  } else if (o.hat === "shako") {
    const yb = crown + 0.3 * B, ht = 0.95 * B;
    const pts = [[cx - 0.82 * A, yb + 3 * u], [cx - 0.72 * A, yb - ht], [cx + 0.86 * A, yb - ht - 4 * u], [cx + 0.94 * A, yb + 2 * u]];
    p.form(pts, col, 0.66, 5 * u, L, A);
    p.band([[cx - 0.8 * A, yb - 6 * u], [cx + 0.92 * A, yb - 8 * u]], "#c9362f", 7 * u, 2 * u, "butt");
    p.poly([[cx + 0.25 * A, yb], [cx + 1.08 * A, yb + 7 * u], [cx + 1.03 * A, yb + 12 * u], [cx + 0.2 * A, yb + 8 * u]], "#141418", 3 * u);
    p.ell(cx + 0.2 * A, yb - 0.5 * ht, 8 * u, 9 * u, "#e8c45a", 2.2 * u);
    p.ell(cx + 0.02 * A, yb - ht - 7 * u, 9 * u, 8 * u, WHITE, 2.4 * u);
  } else if (o.hat === "straw") {
    const yb = crown + 0.4 * B;
    p.ell(cx + 0.06 * A, crown + 0.02 * B, 0.72 * A, 0.5 * B, "#e6c66a", 4 * u, 180, 360);
    p.form(ellPts(cx + 0.06 * A, crown + 0.02 * B, 0.72 * A, 0.5 * B, 180, 360), "#e6c66a", 0.82, 4.5 * u, L, A);
    p.band([[cx - 0.62 * A, crown + 0.0 * B], [cx + 0.76 * A, crown - 0.02 * B]], "#b4442f", 9 * u, 1.8 * u, "butt");
    p.form(ellPts(cx + 0.05 * A, yb - 0.14 * B, 1.42 * A, 0.2 * B, 0, 360, -3), "#ecd27e", 0.82, 4.5 * u, L, A);
    for (let i = -3; i <= 3; i++) p.stroke([[cx + i * 0.32 * A - 6 * u, yb - 0.2 * B], [cx + i * 0.38 * A, yb - 0.08 * B]], 1.4 * u, "#c9a54c");
  } else if (o.hat === "top") {
    const yb = crown + 0.3 * B, ht = 1.35 * B;
    p.form([[cx - 0.62 * A, yb], [cx - 0.68 * A, yb - ht], [cx + 0.72 * A, yb - ht], [cx + 0.66 * A, yb]], col, 0.7, 5 * u, L, A);
    p.band([[cx - 0.64 * A, yb - 0.25 * B], [cx + 0.68 * A, yb - 0.25 * B]], "#5a3b2a", 12 * u, 1.8 * u, "butt");
    p.form(ellPts(cx + 0.04 * A, yb + 2 * u, 1.08 * A, 0.12 * B), hexMul(col, 0.85), 0.8, 4.5 * u, L, A);
  } else if (o.hat === "pickel") {
    const yb = crown + 0.32 * B;
    p.form(ellPts(cx + 0.02 * A, yb, 0.94 * A, 0.78 * B, 180, 360), col, 0.6, 5 * u, L, A);
    p.poly([[cx - 0.06 * A, crown - 0.3 * B], [cx + 0.04 * A, crown - 0.95 * B], [cx + 0.14 * A, crown - 0.3 * B]], "#e8c45a", 3 * u);
    p.ell(cx + 0.04 * A, crown - 0.28 * B, 16 * u, 6 * u, "#e8c45a", 3 * u);
    p.poly([[cx + 0.1 * A, yb - 0.1 * B], [cx + 0.45 * A, yb - 0.55 * B], [cx + 0.75 * A, yb - 0.1 * B], [cx + 0.45 * A, yb + 0.02 * B]], "#e8c45a", 2.6 * u);
    p.poly([[cx + 0.2 * A, yb], [cx + 1.12 * A, yb + 9 * u], [cx + 1.08 * A, yb + 15 * u], [cx + 0.15 * A, yb + 9 * u]], "#141418", 3 * u);
  } else if (o.hat === "pith") {
    const yb = crown + 0.34 * B;
    p.form(ellPts(cx + 0.06 * A, yb + 4 * u, 1.22 * A, 0.16 * B), hexMul(col, 0.9), 0.82, 4.5 * u, L, A);
    p.form(ellPts(cx + 0.04 * A, yb, 0.86 * A, 0.86 * B, 180, 360), col, 0.78, 5 * u, L, A);
    p.band([[cx - 0.84 * A, yb - 0.1 * B], [cx + 0.9 * A, yb - 0.12 * B]], o.band || "#a8874a", 8 * u, 2 * u, "butt");
    p.ell(cx + 0.04 * A, crown - 0.5 * B, 7 * u, 5 * u, col, 2.5 * u);
  } else if (o.hat === "nonla") {
    const yb = crown + 0.42 * B, apex = [cx + 0.04 * A, crown - 0.62 * B];
    const cone = [[cx - 1.5 * A, yb + 6 * u], apex, [cx + 1.58 * A, yb + 2 * u], [cx + 0.04 * A, yb + 0.16 * B]];
    p.form(cone, col, 0.78, 5 * u, L, 1.4 * A);
    for (let i = 1; i < 5; i++) { const t = i / 5; p.stroke([[lerp(apex[0], cx - 1.5 * A, t), lerp(apex[1], yb + 6 * u, t)], [lerp(apex[0], cx + 1.58 * A, t), lerp(apex[1], yb + 2 * u, t)]], 1.8 * u, hexMul(col, 0.72)); }
  }
};

// ---------------- people ----------------
/**
 * opts: expr, mode ("stand"|"march"|"sit"), phase, blink(0..1), look, tilt (deg body lean), headTilt (deg),
 * armF / armB: "hang"|"hip"|"point"|"up"|"wave"|"aim"|"port"|"order"|"scroll"|"gavel"|"cross"|"reach"|"salute"|"bang",
 * k: pose amount 0..1 (gavel swing, wave), sweat (0..1), beard (0..1 growth for stubble), seed, bob (design units)
 */
export const person = (g, o, opts = {}) => {
  const p = new Pen(g);
  const { expr = "neutral", mode = "stand", phase = 0, blink = 0, look = 0.4, tilt = 0, headTilt = 0, armF = "hang", armB = "hang", k = 0, sweat = 0,
    beard = 0, seed = 1, bob = 0, chew = 0, note = "full", val = 10, tin = "closed", paper = "UANG DIGUNTING!" } = opts;
  const Bd = BUILD[o.build || "adult"], skin = o.skin || SKINS[0];
  const A = Bd.a * (1 + 0.04 * (rnd(seed, 1) - 0.5)), Bh = A * 0.95, HH = 2 * Bh, u = (2 * A) / 100;
  const two = Math.PI * 2, sole = 975;
  const march = mode === "march";
  const bb = (march ? 0.02 * 1000 * Math.cos(2 * two * phase) : 0) + bob;
  const torsoBot = sole - Bd.legs * HH + bb, chin = torsoBot - Bd.torso * HH, hipY = torsoBot - 0.1 * HH;
  const legCol = mix(o.pants, INK, 0.45), armCol = mix(o.coat, INK, 0.42);
  const legW = 6.6 * u, footW = 8.5 * u; // slim single-stroke limbs (proportions after the upstream toon.ts cast)
  // ---- legs ----
  const Lft = march ? 70 : 0;
  for (const [side, ph] of [[-1, 0], [1, 0.5]]) {
    const up = Math.max(0, Math.sin(two * (phase + ph))) * Lft;
    const fwd = march ? 18 * u * Math.cos(two * (phase + ph)) : 0;
    const hx = 300 + side * 16 * u, fx = 300 + side * 20 * u + fwd, fy = sole - 6 * u - up;
    p.stroke(curve([hx, hipY], [(hx + fx) / 2 + 3 * u, (hipY + fy) / 2 - up * 0.1], [fx, fy]), legW, side < 0 ? hexMul(legCol, 0.8) : legCol);
    if (o.boots === INK) p.stroke([[fx - 3 * u, fy], [fx + 12 * u, fy + 0.5 * u]], footW, INK); else p.limb([[fx - 3 * u, fy], [fx + 12 * u, fy + 0.5 * u]], footW, o.boots, 1.6 * u);
  }
  if (o.skirt) {
    const sk = [[300 - 34 * u, hipY - 0.16 * HH], [300 + 40 * u, hipY - 0.16 * HH], [300 + 36 * u, sole - 16 * u], [300 - 30 * u, sole - 16 * u]];
    p.poly(sk, o.skirt, 4.5 * u);
    p.clip(sk, () => { for (let yy = hipY - 0.1 * HH; yy < sole; yy += 26 * u) for (let xx = 300 - 40 * u; xx < 300 + 46 * u; xx += 24 * u) { p.ell(xx + ((yy / u) % 2) * 6 * u, yy, 6 * u, 4 * u, o.skirtB || "#e8c47a", 0); p.dot(xx + 12 * u, yy + 13 * u, 2.4 * u, hexMul(o.skirt, 0.6)); } });
    p.poly(sk, null, 4.5 * u);
  }
  if (o.coatLong) {
    const ly = hipY + o.coatLong * (sole - hipY);
    const cl = [[300 - 36 * u, hipY - 0.2 * HH], [300 + 44 * u, hipY - 0.2 * HH], [300 + 46 * u, ly], [300 - 36 * u, ly]];
    p.grad(cl, o.coat, hexMul(o.coat, 0.7), L); p.poly(cl, null, 4.5 * u);
    if (o.trim) { p.stroke([[300 - 34 * u, ly - 4 * u], [300 + 44 * u, ly - 4 * u]], 5 * u, o.trim); p.stroke([[300 + 12 * u, hipY - 0.1 * HH], [300 + 13 * u, ly - 6 * u]], 4 * u, o.trim); }
  }
  // ---- upper body: rotate about hips ----
  g.save();
  if (tilt) { g.translate(300, hipY); g.rotate(rad(tilt)); g.translate(-300, -hipY); }
  const ta = (Bd.tw / 2) * 2 * A, tb = 0.5 * (torsoBot + 8 * u - (chin - 0.22 * HH));
  const tcx = 300 + 4 * u, tcy = torsoBot + 8 * u - tb;
  const tp = bean(tcx, tcy, ta, tb, { nTop: 2.1, nBot: 2.7, egg: o.build === "stout" ? 0.18 : 0.1, asym: 0.03 });
  const sh = (side) => [tcx + side * 0.78 * ta, chin + 0.16 * HH];
  const AL = 1.0 * HH; // arm reach
  // hand targets
  const handFor = (pose, side) => {
    const S = sh(side), s = side;
    switch (pose) {
      case "hip": return { e: [S[0] + s * 0.42 * AL, S[1] + 0.3 * AL], h: [tcx + s * 0.75 * ta, torsoBot - 0.25 * HH] };
      case "point": return { e: [S[0] + 0.45 * AL, S[1] - 0.02 * AL], h: [S[0] + 0.95 * AL, S[1] - 0.12 * AL] };
      case "up": return { e: [S[0] + s * 0.25 * AL, S[1] - 0.42 * AL], h: [S[0] + s * 0.35 * AL, S[1] - 0.9 * AL] };
      case "wave": { const w = Math.sin(k * two * 2) * 0.12; return { e: [S[0] + s * 0.35 * AL, S[1] - 0.3 * AL], h: [S[0] + s * (0.5 + w) * AL, S[1] - 0.78 * AL] }; }
      case "aim": return side > 0 ? { e: [S[0] + 0.32 * AL, S[1] + 0.22 * AL], h: [S[0] + 0.78 * AL, S[1] - 0.02 * AL] } : { e: [S[0] + 0.25 * AL, S[1] + 0.32 * AL], h: [S[0] + 0.45 * AL, S[1] + 0.06 * AL] };
      case "port": return side > 0 ? { e: [S[0] + 0.2 * AL, S[1] + 0.42 * AL], h: [tcx + 0.25 * ta, chin + 0.62 * HH] } : { e: [S[0] - 0.05 * AL, S[1] + 0.4 * AL], h: [tcx - 0.2 * ta, chin + 0.25 * HH] };
      case "order": return { e: [S[0] + s * 0.2 * AL, S[1] + 0.45 * AL], h: [S[0] + s * 0.32 * AL, S[1] + 0.82 * AL] };
      case "scroll": return { e: [S[0] + 0.35 * AL, S[1] + 0.35 * AL], h: [S[0] + 0.75 * AL, S[1] + 0.25 * AL] };
      case "gavel": { const a = lerp(-0.95, 0.1, k); return { e: [S[0] + 0.32 * AL, S[1] - 0.15 * AL + 0.3 * AL * k], h: [S[0] + (0.45 + 0.25 * k) * AL, S[1] + a * AL * 0.7] }; }
      case "cross": return { e: [S[0] + s * 0.18 * AL, S[1] + 0.5 * AL], h: [tcx - s * 0.35 * ta, chin + 0.62 * HH] };
      case "reach": return { e: [S[0] + 0.45 * AL, S[1] + 0.2 * AL], h: [S[0] + 0.9 * AL, S[1] + 0.35 * AL] };
      case "coin": return { e: [S[0] + 0.42 * AL, S[1] + 0.12 * AL], h: [S[0] + 0.86 * AL, S[1] + 0.02 * AL] };
      case "dangle": return { e: [S[0] + 0.38 * AL, S[1] + 0.02 * AL], h: [S[0] + 0.72 * AL, S[1] - 0.32 * AL] };
      case "snip": { const c = side > 0 ? 0 : 0.08; return { e: [S[0] + (0.36 - c) * AL, S[1] + 0.3 * AL], h: [S[0] + (0.8 - c) * AL, S[1] + 0.12 * AL] }; }
      case "clip": return side > 0 ? { e: [S[0] + 0.3 * AL, S[1] + 0.4 * AL], h: [S[0] + 0.6 * AL, S[1] + 0.3 * AL] } : { e: [S[0] + 0.2 * AL, S[1] + 0.42 * AL], h: [S[0] + 0.5 * AL, S[1] + 0.42 * AL] };
      case "shrug": return { e: [S[0] + s * 0.42 * AL, S[1] + 0.25 * AL], h: [S[0] + s * 0.62 * AL, S[1] - 0.05 * AL] };
      case "dig": return side > 0 ? { e: [S[0] + 0.3 * AL, S[1] + 0.35 * AL], h: [S[0] + 0.62 * AL, S[1] + 0.5 * AL] } : { e: [S[0] + 0.15 * AL, S[1] + 0.3 * AL], h: [S[0] + 0.32 * AL, S[1] + 0.22 * AL] };
      case "salute": return side > 0 ? { e: [S[0] + 0.42 * AL, S[1] - 0.05 * AL], h: [tcx + 0.65 * ta, chin - 0.55 * HH] } : { e: [S[0] - 0.12 * AL, S[1] + 0.45 * AL], h: [S[0] - 0.14 * AL, S[1] + 0.85 * AL] };
      case "note": return { e: [S[0] + 0.4 * AL, S[1] + 0.22 * AL], h: [S[0] + 0.82 * AL, S[1] + 0.1 * AL] };
      case "read": { const hy = chin + 0.35 * HH - (1 - k) * 0.5 * HH; return side > 0 ? { e: [S[0] + 0.32 * AL, S[1] + 0.45 * AL], h: [tcx + 0.85 * ta, hy] } : { e: [S[0] + 0.05 * AL, S[1] + 0.45 * AL], h: [tcx - 0.5 * ta, hy] }; }
      case "shh": return { e: [S[0] + 0.3 * AL, S[1] + 0.42 * AL], h: [300 + 22 * u, chin - 0.38 * Bh] };
      case "tin": return side > 0 ? { e: [S[0] + 0.3 * AL, S[1] + 0.5 * AL], h: [tcx + 0.72 * ta, torsoBot - 0.3 * HH] } : { e: [S[0] + 0.02 * AL, S[1] + 0.5 * AL], h: [tcx - 0.2 * ta, torsoBot - 0.3 * HH] };
      case "idea": return { e: [S[0] + 0.34 * AL, S[1] + 0.02 * AL], h: [S[0] + 0.42 * AL, S[1] - 0.48 * AL] };
      case "trumpet": return { e: [S[0] + 0.28 * AL, S[1] + 0.12 * AL], h: [300 + 30 * u, chin - 0.2 * Bh] };
      case "drum": return side > 0 ? { e: [S[0] + 0.32 * AL, S[1] + 0.36 * AL], h: [S[0] + 0.62 * AL, S[1] + 0.22 * AL + 0.06 * AL * Math.sin(k * two * 2)] } : { e: [S[0] + 0.12 * AL, S[1] + 0.42 * AL], h: [S[0] + 0.38 * AL, S[1] + 0.36 * AL - 0.06 * AL * Math.sin(k * two * 2)] };
      case "carry": return { e: [S[0] + s * 0.1 * AL + 0.12 * AL, S[1] + 0.05 * AL], h: [S[0] + 0.2 * AL, S[1] - 0.12 * AL] };
      case "card": return { e: [S[0] + 0.4 * AL, S[1] + 0.25 * AL], h: [S[0] + 0.75 * AL, S[1] + 0.05 * AL] };
      case "chest": return side > 0 ? { e: [S[0] + 0.32 * AL, S[1] + 0.4 * AL], h: [tcx + 0.85 * ta, torsoBot - 0.25 * HH] } : { e: [S[0] + 0.05 * AL, S[1] + 0.45 * AL], h: [tcx - 0.15 * ta, torsoBot - 0.25 * HH] };
      case "pat": return { e: [S[0] + 0.42 * AL, S[1] + 0.32 * AL], h: [S[0] + 0.85 * AL, S[1] + 0.55 * AL + 0.04 * AL * Math.sin(k * two * 2)] };
      case "child": return { e: [S[0] + 0.3 * AL, S[1] + 0.42 * AL], h: [S[0] + 0.62 * AL, S[1] + 0.6 * AL] };
      case "snipUp": return { e: [S[0] + 0.36 * AL, S[1] - 0.12 * AL], h: [S[0] + 0.5 * AL, S[1] - 0.6 * AL] };
      default: { // hang, swing when marching
        const sw = march ? Math.sin(two * phase) * s : 0;
        return { e: [S[0] + s * 0.14 * AL + sw * 0.1 * AL, S[1] + 0.48 * AL], h: [S[0] + s * 0.16 * AL + sw * 0.28 * AL, S[1] + 0.92 * AL] };
      }
    }
  };
  const B = handFor(armB, -1), F = handFor(armF, 1);
  const drawArm = (side, hd) => {
    const S = sh(side);
    p.stroke(curve(S, hd.e, hd.h), 6 * u, side < 0 ? hexMul(armCol, 0.82) : armCol);
    p.dot(hd.h[0], hd.h[1], 6 * u, INK);
  };
  // rifle geometry
  const rifle = (a, b) => { p.band([a, b], "#7a4b2a", 6 * u, 1.8 * u); p.band([lerp2(a, b, 0.55), b], "#8d949c", 3 * u, 1.4 * u); };
  const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  let rifleAB = null;
  if (o.rifle !== false && (armF === "aim" || armF === "port" || armF === "order") && opts.rifle) {
    if (armF === "aim") { const s = sh(1); rifleAB = [[s[0] - 0.05 * AL, s[1] + 0.12 * AL], [s[0] + 1.55 * AL, s[1] - 0.12 * AL]]; }
    else if (armF === "port") rifleAB = [[tcx + 0.55 * ta, torsoBot + 0.05 * HH], [tcx - 0.55 * ta, chin - 0.75 * HH]];
    else rifleAB = [[sh(1)[0] + 0.3 * AL, sole - 12 * u], [sh(1)[0] + 0.36 * AL, chin - 0.95 * HH]];
  }
  if (rifleAB && armF === "order") rifle(rifleAB[0], rifleAB[1]);
  drawArm(-1, B);
  // torso
  p.grad(tp, o.coat, hexMul(o.coat, 0.66), L);
  p.clip(tp, () => {
    if (o.overalls) {
      p.poly([[tcx - 0.62 * ta, tcy - 0.1 * tb], [tcx + 0.66 * ta, tcy - 0.12 * tb], [tcx + ta * 1.2, torsoBot + 40], [tcx - ta * 1.2, torsoBot + 40]], o.pants, 0);
      p.stroke([[tcx - 0.62 * ta, tcy - 0.1 * tb], [tcx + 0.66 * ta, tcy - 0.12 * tb]], 3 * u);
      for (const s of [-1, 1]) { p.band([[tcx + s * 0.5 * ta, chin - 0.1 * HH], [tcx + s * 0.55 * ta, tcy - 0.05 * tb]], o.pants, 7 * u, 2 * u, "butt"); p.dot(tcx + s * 0.55 * ta, tcy - 0.12 * tb, 4 * u, "#e8c45a"); }
    }
    if (o.vest) { p.poly([[tcx - 0.3 * ta, chin], [tcx + 0.4 * ta, chin], [tcx + 0.34 * ta, torsoBot], [tcx - 0.24 * ta, torsoBot]], o.vest, 3 * u); }
    if (o.cross) for (const s of [-1, 1]) p.band([[tcx - s * 0.8 * ta, chin - 0.05 * HH], [tcx + s * 0.85 * ta, torsoBot - 0.05 * HH]], o.belt, 9 * u, 2 * u, "butt");
    if (o.belt && !o.cross) p.band([[tcx - 1.2 * ta, torsoBot - 0.22 * HH], [tcx + 1.2 * ta, torsoBot - 0.22 * HH]], o.belt, 12 * u, 2 * u, "butt");
    if (o.sash) p.band([[tcx - 0.9 * ta, chin + 0.05 * HH], [tcx + 0.9 * ta, torsoBot - 0.15 * HH]], o.sash, 14 * u, 2 * u, "butt");
    if (o.lapels) {
      p.poly([[tcx - 0.08 * ta, chin - 2 * u], [tcx + 0.55 * ta, chin - 2 * u], [tcx + 0.24 * ta, chin + 0.44 * HH]], "#f6f3ea", 0);
      if (o.tie) p.poly([[tcx + 0.19 * ta, chin + 0.03 * HH], [tcx + 0.29 * ta, chin + 0.03 * HH], [tcx + 0.31 * ta, chin + 0.34 * HH], [tcx + 0.24 * ta, chin + 0.4 * HH], [tcx + 0.17 * ta, chin + 0.34 * HH]], o.tie, 2 * u);
      p.stroke([[tcx - 0.1 * ta, chin - 2 * u], [tcx + 0.24 * ta, chin + 0.44 * HH], [tcx + 0.58 * ta, chin - 2 * u]], 3.2 * u, hexMul(o.coat, 0.55));
      for (const yy of [0.52, 0.66]) { p.dot(tcx + 0.24 * ta, chin + yy * HH, 3.6 * u, INK); p.dot(tcx + 0.24 * ta, chin + yy * HH, 2.4 * u, hexMul(o.coat, 0.75)); }
      p.stroke([[tcx - 0.62 * ta, chin + 0.4 * HH], [tcx - 0.3 * ta, chin + 0.4 * HH]], 2.6 * u, hexMul(o.coat, 0.6));
    }
    if (o.collar) {
      p.poly([[tcx + 0.02 * ta, chin - 2 * u], [tcx + 0.26 * ta, chin + 0.1 * HH], [tcx + 0.24 * ta, chin - 2 * u]], hexMul(o.coat, 0.94), 2.4 * u);
      p.poly([[tcx + 0.46 * ta, chin - 2 * u], [tcx + 0.28 * ta, chin + 0.1 * HH], [tcx + 0.3 * ta, chin - 2 * u]], hexMul(o.coat, 0.94), 2.4 * u);
      if (o.tie) p.poly([[tcx + 0.22 * ta, chin + 0.06 * HH], [tcx + 0.31 * ta, chin + 0.06 * HH], [tcx + 0.33 * ta, chin + 0.36 * HH], [tcx + 0.265 * ta, chin + 0.42 * HH], [tcx + 0.2 * ta, chin + 0.36 * HH]], o.tie, 2 * u);
      else for (let i = 0; i < 4; i++) { p.dot(tcx + 0.27 * ta, chin + (0.16 + 0.17 * i) * HH, 2.8 * u, hexMul(o.coat, 0.6)); }
      if (o.pocket) p.poly([[tcx + 0.42 * ta, chin + 0.2 * HH], [tcx + 0.72 * ta, chin + 0.19 * HH], [tcx + 0.7 * ta, chin + 0.36 * HH], [tcx + 0.44 * ta, chin + 0.37 * HH]], null, 2.4 * u);
    }
    if (o.sarong) p.band([[tcx - 0.9 * ta, chin + 0.02 * HH], [tcx + 0.95 * ta, torsoBot - 0.1 * HH]], o.sarong, 15 * u, 2 * u, "butt");
    if (o.kebaya) {
      p.poly([[tcx - 0.02 * ta, chin - 2 * u], [tcx + 0.5 * ta, chin - 2 * u], [tcx + 0.24 * ta, chin + 0.5 * HH]], o.inner, 0);
      p.stroke([[tcx - 0.05 * ta, chin - 2 * u], [tcx + 0.24 * ta, chin + 0.5 * HH], [tcx + 0.2 * ta, torsoBot + 10 * u]], 3 * u, hexMul(o.coat, 0.7));
      for (const yy of [0.16, 0.3, 0.44]) { p.dot(tcx + 0.3 * ta, chin + yy * HH, 5 * u, "#b8892a"); p.dot(tcx + 0.3 * ta, chin + yy * HH, 3.2 * u, "#f2d06a"); }
      for (let i = 0; i < 26; i++) p.dot(tcx + (rnd(i, 7) - 0.5) * 1.8 * ta, chin + rnd(i, 8) * (torsoBot - chin), 2.6 * u, "rgba(255,255,255,0.75)");
    }
    if (o.trim) { p.stroke([[tcx + 0.2 * ta, chin], [tcx + 0.22 * ta, torsoBot + 20 * u]], 5 * u, o.trim); p.stroke([[tcx - 0.5 * ta, chin + 2 * u], [tcx + 0.7 * ta, chin + 2 * u]], 6 * u, o.trim); }
    if (o.pearls) for (const [r, n] of [[0.38, 13], [0.52, 15]]) for (let i = 0; i <= n; i++) { const a = Math.PI * (0.12 + 0.76 * i / n); p.dot(tcx + 0.15 * ta + Math.cos(a) * 0.62 * ta, chin + Math.sin(a) * r * HH - 0.04 * HH, 4.2 * u, "#f8f4ea"); p.dot(tcx + 0.15 * ta + Math.cos(a) * 0.62 * ta - 1.2 * u, chin + Math.sin(a) * r * HH - 0.04 * HH - 1.2 * u, 1.6 * u, "#ffffff"); }
    if (o.buttons && !o.overalls) for (let i = 0; i < 4; i++) { const y = chin + 0.14 * HH + i * 0.2 * HH; p.dot(tcx + 8 * u, y, 3.4 * u, INK); p.dot(tcx + 8 * u, y, 2.4 * u, o.buttons); }
  });
  p.ring(tp, 5 * u, L);
  if (o.epaulettes) for (const s of [-1, 1]) { const S = sh(s); p.ell(S[0], S[1] - 2 * u, 16 * u, 7 * u, o.epaulettes, 2.5 * u, 0, 360, s * 12); for (let i = -2; i <= 2; i++) p.stroke([[S[0] + i * 5 * u, S[1] + 4 * u], [S[0] + i * 5.5 * u, S[1] + 11 * u]], 2.2 * u, o.epaulettes); }
  if (rifleAB && armF !== "order") rifle(rifleAB[0], rifleAB[1]);
  // props in the front hand
  if (armF === "scroll") {
    const [hx, hy] = F.h;
    p.poly([[hx - 10 * u, hy - 50 * u], [hx + 60 * u, hy - 56 * u], [hx + 66 * u, hy + 40 * u], [hx - 4 * u, hy + 46 * u]], "#f3e6c4", 3 * u);
    for (let i = 0; i < 5; i++) p.stroke([[hx + 4 * u, hy - 34 * u + i * 15 * u], [hx + 52 * u, hy - 38 * u + i * 15 * u]], 2.4 * u, "#9c8a6a");
    p.dot(hx + 46 * u, hy + 30 * u, 9 * u, "#b02a2a"); p.ell(hx + 46 * u, hy + 30 * u, 9 * u, 9 * u, null, 2 * u);
    p.ell(hx - 8 * u, hy - 2 * u, 7 * u, 50 * u, "#e8d6ac", 3 * u);
  }
  if (armF === "gavel") {
    const [hx, hy] = F.h, ang = rad(lerp(-60, 20, k));
    const R = (pts) => rotPts(pts, ang, hx, hy);
    p.band(R([[hx, hy + 10 * u], [hx, hy - 52 * u]]), "#6b3f22", 7 * u, 2 * u);
    p.poly(R([[hx - 22 * u, hy - 72 * u], [hx + 22 * u, hy - 72 * u], [hx + 22 * u, hy - 46 * u], [hx - 22 * u, hy - 46 * u]]), "#8a5530", 3 * u);
  }
  if (armF === "coin") { const [hx, hy] = F.h; p.ell(hx + 10 * u, hy - 12 * u, 11 * u, 11 * u, "#f0c040", 3 * u); p.ell(hx + 10 * u, hy - 12 * u, 6 * u, 6 * u, null, 1.6 * u); }
  if (armF === "snip") {
    const [hx, hy] = F.h, op = rad(4 + 26 * (opts.k ?? 0));
    for (const sg of [-1, 1]) { const R = (pts) => rotPts(pts, sg * op, hx, hy); p.band(R([[hx, hy], [hx + 70 * u, hy - 4 * u * sg]]), "#c9ced6", 5 * u, 2 * u); p.ell(...R([[hx - 12 * u, hy + 8 * u * sg]])[0], 9 * u, 7 * u, "#c8312d", 3 * u); }
  }
  if (armF === "clip") { const [hx, hy] = F.h; p.poly([[hx - 8 * u, hy - 60 * u], [hx + 50 * u, hy - 64 * u], [hx + 54 * u, hy + 14 * u], [hx - 4 * u, hy + 18 * u]], "#a8744a", 3 * u); p.poly([[hx - 2 * u, hy - 54 * u], [hx + 44 * u, hy - 57 * u], [hx + 47 * u, hy + 8 * u], [hx + 2 * u, hy + 11 * u]], "#f6f1e4", 2 * u); for (let i = 0; i < 4; i++) p.stroke([[hx + 6 * u, hy - 42 * u + i * 12 * u], [hx + 38 * u, hy - 44 * u + i * 12 * u]], 2 * u, "#9c8a6a"); }
  if (armF === "dig") { const a = F.h, b = [B.h[0] - 30 * u, B.h[1] - 60 * u]; p.band([[a[0] + 30 * u, a[1] + 70 * u], b], "#8a5a34", 6 * u, 2 * u); p.poly([[a[0] + 18 * u, a[1] + 66 * u], [a[0] + 52 * u, a[1] + 64 * u], [a[0] + 48 * u, a[1] + 100 * u], [a[0] + 30 * u, a[1] + 106 * u], [a[0] + 14 * u, a[1] + 96 * u]], "#9aa2ad", 3 * u); }
  if (armF === "tin") tinAt(p, g, (F.h[0] + B.h[0]) / 2, F.h[1] - 8 * u, u, tin);
  if (armF === "snipUp") {
    const [hx, hy] = F.h, op = rad(4 + 26 * (opts.k ?? 0)), base = rad(-78), sc = 1.35;
    for (const sg of [-1, 1]) { const R = (pts) => rotPts(rotPts(pts, sg * op, hx, hy), base, hx, hy); p.band(R([[hx, hy], [hx + 70 * u * sc, hy - 4 * u * sg]]), "#c9ced6", 6 * u, 2 * u); p.ell(...R([[hx - 13 * u, hy + 9 * u * sg]])[0], 10 * u, 8 * u, "#c8312d", 3 * u); }
  }
  if (armF === "drum") { const cxd = tcx + 0.55 * ta, cyd = torsoBot - 0.18 * HH; p.form(rrect(cxd - 46 * u, cyd - 30 * u, cxd + 46 * u, cyd + 34 * u, 10 * u), "#e8c45a", 0.75, 4 * u, L, 50 * u); for (let i = 0; i < 6; i++) p.stroke([[cxd - 44 * u + i * 17 * u, cyd - 28 * u], [cxd - 36 * u + i * 17 * u + 8 * u, cyd + 32 * u]], 2.4 * u, "#c8362f"); p.ell(cxd, cyd - 30 * u, 46 * u, 10 * u, "#f6f1e4", 3 * u); }
  if (armF === "chest") { const cxd = (F.h[0] + B.h[0]) / 2, cyd = F.h[1] - 6 * u; p.form(rrect(cxd - 52 * u, cyd - 40 * u, cxd + 52 * u, cyd + 30 * u, 6 * u), "#8a4a2a", 0.72, 4 * u, L, 50 * u); p.ell(cxd, cyd - 40 * u, 52 * u, 14 * u, "#9a5a32", 3.5 * u, 180, 360); for (const dx of [-30, 30]) p.stroke([[cxd + dx * u, cyd - 50 * u], [cxd + dx * u, cyd + 30 * u]], 5 * u, "#e8c45a"); p.ell(cxd, cyd - 14 * u, 8 * u, 9 * u, "#e8c45a", 2.4 * u); for (let i = 0; i < 4; i++) p.dot(cxd - 30 * u + i * 20 * u, cyd - 52 * u - 4 * u * (i % 2), 7 * u, "#f3c64a"); }
  if (armF === "card") { const [hx, hy] = F.h; g.save(); g.translate(hx + 30 * u, hy - 20 * u); g.rotate(rad(-8)); p.poly(rrect(-42 * u, -56 * u, 42 * u, 56 * u, 4 * u), "#fbf3dc", 3 * u); p.poly(rrect(-34 * u, -48 * u, 34 * u, 48 * u, 3 * u), null, 2 * u); pawAt(p, 0, 6 * u, 14 * u, "#c9962a"); p.stroke([[-20 * u, -32 * u], [20 * u, -32 * u]], 3 * u, "#c9962a"); g.restore(); }
  if (armF === "note") noteAt(g, F.h[0] + 4 * u, F.h[1] - 18 * u, 0.19 * u, note, val, -8, opts.flip);
  drawArm(1, F);
  if (armF === "tin") p.dot(B.h[0], B.h[1], 6 * u, INK);
  if (armF === "trumpet") { const [hx, hy] = F.h; p.band([[hx - 4 * u, hy + 2 * u], [hx + 70 * u, hy - 4 * u]], "#e8c45a", 7 * u, 2.4 * u); p.poly([[hx + 64 * u, hy - 6 * u], [hx + 100 * u, hy - 26 * u], [hx + 104 * u, hy + 18 * u], [hx + 64 * u, hy + 4 * u]], "#e8c45a", 3 * u); }
  if (armF === "idea") { const [hx, hy] = F.h; p.stroke([[hx, hy], [hx + 2 * u, hy - 24 * u]], 5.5 * u, INK); }
  if (armF === "dangle") { const [hx, hy] = F.h; g.save(); g.translate(hx, hy + 4 * u); g.rotate(rad(90 + 14 * Math.sin(opts.swing ?? 0))); g.scale(0.52, 0.52); g.translate(70, -300); rat(g, { expr: "shock", tail: "long", dangle: true }); g.restore(); }
  // ---- head ----
  const hc = chin - Bh * 0.86;
  g.save();
  if (headTilt) { g.translate(300, chin); g.rotate(rad(headTilt)); g.translate(-300, -chin); }
  const hp = bean(300 + 2 * u, hc, A, Bh, { nTop: 1.8, nBot: 2.3, egg: -0.1, asym: 0.07, rot: rad(4 * (rnd(seed, 3) - 0.5)) });
  p.shaded(hp, skin, hexMul(skin, 0.88), L, A);
  // whiskers / beard behind face features
  const fx = 300 + 10 * u, F_ = FACE[expr] || FACE.neutral;
  if (o.beard || beard > 0) {
    const bl = o.beard ? 1 : beard, bc = opts.beardCol || o.beard || "#5a3a24";
    if (bl > 0.05) {
      const bp = bean(fx - 2 * u, hc + 0.62 * Bh + 8 * u * bl, 0.72 * A, (0.22 + 0.24 * bl) * Bh, { nTop: 3.4, nBot: 2.0, egg: 0.3 });
      p.clip(bp, () => { p.path(bp, true); g.fillStyle = bc; g.globalAlpha = bl < 0.4 ? 0.45 + bl : 1; g.fill(); g.globalAlpha = 1; });
      if (bl > 0.35) p.ring(bp, 3.5 * u, L);
    }
  }
  if (o.whiskers) for (const s of [-1, 1]) {
    const w = bean(fx + s * (s > 0 ? 34 : 40) * u, hc + 0.5 * Bh, 15 * u, 22 * u, { nTop: 2, nBot: 1.6, egg: 0.35, rot: rad(-s * 18) });
    p.form(w, o.whiskers, 0.86, 3 * u, L, 20 * u);
  }
  p.ring(hp, 5 * u, L);
  // face
  const ex = 14 * u, ey = hc + 0.02 * Bh;
  const ek = blink >= 1 && F_.eye !== "happy" ? "dash" : blink > 0.4 && F_.eye !== "happy" ? "slit" : F_.eye;
  for (const s of [-1, 1]) {
    const x = fx + s * ex;
    eye(p, ek, x, ey, u * (s < 0 ? 0.92 : 1), look);
    const [dI, dO] = F_.brow, by = ey - (o.hat && o.hat !== "straw" ? 18 : 21) * u;
    if (ek === "shock") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [x - s * 8.5 * u, by + dI * u], [x + s * 8.5 * u, by + dO * u], 5 * u, 2.6 * u, o.brow || INK);
  }
  const mx = fx + 4 * u, my = hc + 0.42 * Bh;
  if (o.moustache) for (const s of [-1, 1]) taper(p, [mx + s * 2 * u, my - 7 * u], [mx + s * (o.whiskers ? 24 : 17) * u, my - (o.whiskers ? 2 : 3) * u], 6.5 * u, 2.4 * u, o.moustache);
  mouthDraw(p, F_.mouth, mx, my + (o.moustache ? 3 * u : 0), u, chew);
  if (o.blush) for (const s of [-1, 1]) p.ell(fx + s * 22 * u, ey + 17 * u, 8 * u, 4.5 * u, "rgba(240,120,140,0.45)", 0);
  if (o.lash && ek !== "shock") p.stroke([[fx + ex + 7 * u, ey - 3 * u], [fx + ex + 12 * u, ey - 8 * u]], 2.6 * u);
  if (o.glasses) {
    const gl = (x) => o.glasses === "round" ? ellPts(x, ey, 11.5 * u, 11.5 * u) : rrect(x - 12.5 * u, ey - 9 * u, x + 12.5 * u, ey + 9 * u, 4 * u);
    for (const s of [-1, 1]) p.poly(gl(fx + s * ex), "rgba(225,240,255,0.22)", 3 * u);
    p.stroke([[fx - ex + 11 * u, ey - 2 * u], [fx + ex - 11 * u, ey - 2 * u]], 2.6 * u);
    p.stroke([[fx - ex - 11.5 * u, ey - 2 * u], [300 - 0.88 * A, ey - 6 * u]], 2.6 * u);
  }
  if (sweat > 0) for (const [dx, dy, s] of [[-0.95, -0.55, 1], [1.02, -0.2, 0.8]]) {
    const x = 300 + dx * A, y = hc + dy * Bh + 18 * u * sweat;
    p.poly([[x, y - 12 * u * s], [x + 6 * u * s, y + 2 * u], [x, y + 8 * u * s], [x - 6 * u * s, y + 2 * u]], "#9fd4ff", 2.4 * u);
  }
  hat(p, o, 300 + 2 * u, hc, A, Bh, u);
  g.restore();
  if (armF === "read") { paperAt(p, g, B.h, F.h, HH, u, paper, opts.flip); p.dot(B.h[0], B.h[1], 6 * u, INK); p.dot(F.h[0], F.h[1], 6 * u, INK); }
  if (armF === "shh") { const [hx, hy] = F.h; p.dot(hx, hy + 6 * u, 7 * u, INK); p.stroke([[hx - 2 * u, hy + 6 * u], [hx - 3 * u, hy - 20 * u]], 5.5 * u, INK); }
  g.restore();
  return { hc, chin, A, Bh };
};

// ---------------- the pig ----------------
const PIG = "#f6a9bd", PIG_SH = "#d98099", SNOUT = "#f08aa6", HOOF = "#7a4656";
/** pig side view facing right on a 600 x 420 canvas, soles at y = 405.
 *  opts: phase (walk), walk (0..1 stride), expr ("happy"|"munch"|"shock"|"content"|"sleep"), chew (0..1), dip (head down 0..1),
 *  blink, tail (wiggle angle), ghost (bool), halo (0..1), wing (flap) */
export const pig = (g, opts = {}) => {
  const p = new Pen(g);
  const { phase = 0, walk = 0, expr = "happy", chew = 0, dip = 0, blink = 0, tail = 0, ghost = false, halo = 0, wing = 0, cheek = 0, bandana = false, spud = -1, earW = 0 } = opts;
  const two = Math.PI * 2, u = 3.0, sole = 405;
  const base = ghost ? "#fbeef6" : PIG, sh = ghost ? "#d9c9ea" : PIG_SH, sn = ghost ? "#f7d3e3" : SNOUT, hoof = ghost ? "#b9a8c8" : HOOF;
  const bob = walk ? 5 * (0.5 + 0.5 * Math.cos(4 * Math.PI * phase)) * walk : 0;
  const by = 252 - bob;
  // wings (ghost) behind
  if (ghost) for (const s of [1, 0]) {
    const a = rad(-25 * Math.sin(wing * two)) - s * 0.25, wx = 300 - s * 30, wy = by - 80;
    const R = (pts) => rotPts(pts, a, wx, wy);
    const w = R([[wx, wy], [wx - 30, wy - 60], [wx - 85, wy - 92], [wx - 140, wy - 84], [wx - 120, wy - 58], [wx - 138, wy - 40], [wx - 110, wy - 20], [wx - 118, wy - 2], [wx - 60, wy + 10]]);
    p.poly(w, s ? "#e9e4f7" : "#ffffff", 7);
  }
  // far legs
  const legs = [[200, 0.5, true], [355, 0, true], [222, 0, false], [378, 0.5, false]];
  // planted feet: the stance foot slides back at body speed (phase comes from distance), the swing foot arcs forward
  const legPts = (x, ph) => {
    if (!walk) return [[x, by + 70], [x, sole - 12]];
    const S = 80 * walk, c = (((phase + ph) % 1) + 1) % 1;
    let fx, up;
    if (c < 0.5) { const s = c / 0.5; fx = S / 2 - S * s; up = 0; }
    else { const s = (c - 0.5) / 0.5; fx = -S / 2 + S * s - (S / Math.PI) * Math.sin(2 * Math.PI * s); up = 16 * walk * Math.sin(Math.PI * s); }
    return [[x + fx * 0.25, by + 70], [x + fx, sole - 12 - up]];
  };
  for (const [x, ph, far] of legs) if (far) { const [a, b] = legPts(x, ph); p.limb([a, b], 30, hexMul(base, 0.84), 6); p.limb([[b[0] - 4, b[1]], [b[0] + 4, b[1] + 4]], 26, hoof, 5); }
  // tail
  const tx = 92, ty = by - 30, ta = rad(tail);
  const tp = []; for (let i = 0; i <= 30; i++) { const t = i / 30, r = 26 * (1 - t * 0.6), a = t * two * 1.3 + ta; tp.push([tx - 12 - r * Math.cos(a) - t * 14, ty - 8 + r * Math.sin(a) - t * 20]); }
  p.stroke(tp, 15); p.stroke(tp, 8, base);
  // body
  const bp = bean(268, by, 176, 118, { nTop: 2.3, nBot: 2.5, egg: 0.06 });
  p.shaded(bp, base, sh, L, 160);
  p.clip(bp, () => { p.ell(270, by + 70, 120, 40, mix(base, "#ffffff", 0.35), 0); });
  if (!ghost) for (const [sx, sy] of [[190, by - 40], [215, by - 18]]) p.ell(sx, sy, 6, 4, hexMul(base, 0.9), 0);
  p.ring(bp, 11, L);
  // near legs
  for (const [x, ph, far] of legs) if (!far) { const [a, b] = legPts(x, ph); p.limb([a, b], 32, base, 6); p.limb([[b[0] - 4, b[1]], [b[0] + 5, b[1] + 4]], 28, hoof, 5); }
  // head
  const hx = 436, hy = by - 46 + dip * 70;
  g.save(); g.translate(hx, hy); g.rotate(rad(dip * 22)); g.translate(-hx, -hy);
  const ear = (s) => { const ex = hx - 30 + s * 40, ey = hy - 72 - (s ? earW * 8 : 0); p.poly([[ex - 26, ey + 22], [ex + 4 + s * 4, ey - 34], [ex + 30, ey + 18]], s ? base : hexMul(base, 0.85), 8); p.poly([[ex - 12, ey + 14], [ex + 4, ey - 14], [ex + 16, ey + 12]], ghost ? "#f1dcea" : "#e8789a", 0); };
  ear(0);
  const hp = bean(hx, hy, 98 + cheek * 8, 90 + cheek * 4, { nTop: 2.0, nBot: 2.4, egg: -0.05 });
  p.shaded(hp, base, sh, L, 90);
  p.ring(hp, 10, L);
  ear(1);
  // snout
  const sx = hx + 78, sy = hy + 22;
  p.form(ellPts(sx, sy, 34, 40), sn, 0.85, 8, L, 36);
  p.ell(sx + 2, sy - 10, 6, 9, hexMul(sn, 0.55), 0); p.ell(sx + 4, sy + 12, 6, 9, hexMul(sn, 0.55), 0);
  // eye
  const exx = hx + 22, eyy = hy - 22;
  if (expr === "shock") { p.ell(exx, eyy, 17, 17, WHITE, 6); p.dot(exx + 4, eyy + 2, 6); }
  else if (expr === "content" || expr === "sleep" || blink >= 1) p.arc(exx, eyy + (expr === "content" ? 4 : 0), 13, 9, expr === "content" ? 200 : 20, expr === "content" ? 340 : 160, 6);
  else if (expr === "munch" && chew > 0.5) p.arc(exx, eyy + 4, 13, 9, 200, 340, 6);
  else { p.ell(exx, eyy, 9, 12, INK, 0); p.dot(exx + 3, eyy - 4, 3, "#ffffff"); }
  p.stroke([[exx - 14, eyy - 22], [exx + 12, eyy - 26]], 6);
  // cheek blush + mouth
  if (!ghost) p.ell(hx + 12, hy + 28, 16, 10, "#f27f9e", 0);
  const mx = hx + 46, my = hy + 52;
  if (expr === "munch") {
    const o = chew;
    p.ell(mx, my, 20, 6 + 12 * o, MOUTH, 5);
    if (o > 0.3) p.ell(mx + 2, my + 4 + 6 * o, 8, 4 * o, TONGUE, 0);
  } else if (expr === "shock") p.ell(mx, my + 4, 12, 16, MOUTH, 5);
  else p.arc(mx - 4, my - 10, 24, 14, 25, 155, 6);
  g.restore();
  if (bandana) {
    const nx = 352, ny = by - 10;
    const band = [[nx - 18, ny - 70], [nx + 26, ny - 76], [nx + 40, ny + 30], [nx + 4, ny + 64], [nx - 14, ny + 28]];
    g.save(); p.path(band, true); g.clip(); flagUK(g, nx - 30, ny - 80, 90, 150); g.restore(); p.poly(band, null, 7);
    p.poly([[nx + 4, ny + 60], [nx + 30, ny + 96], [nx - 10, ny + 82]], "#c8312d", 6);
  }
  if (spud >= 0) { g.save(); g.translate(hx + 64 + dip * 30, hy + 64 + dip * 44); g.scale(0.62, 0.62); g.rotate(rad(-18)); g.translate(-100, -92); potato(g, spud); g.restore(); }
  if (halo > 0) {
    g.globalAlpha = Math.min(1, halo) * (ghost ? 0.95 : 1);
    p.ell(hx - 10, hy - 140 - 6 * Math.sin(halo * 6), 62, 15, null, 0);
    g.lineWidth = 13; g.strokeStyle = INK; p.path(ellPts(hx - 10, hy - 140, 62, 15), true); g.stroke();
    g.lineWidth = 8; g.strokeStyle = "#ffd84a"; p.path(ellPts(hx - 10, hy - 140, 62, 15), true); g.stroke();
  }
  g.globalAlpha = 1;
};

// ---------------- props ----------------
/** potato on a 200 x 160 canvas; bite 0..1 */
export const potato = (g, bite = 0, seed = 3) => {
  const p = new Pen(g);
  const pts = bean(100, 92, 74, 52, { nTop: 2.2, nBot: 2.0, egg: 0.08, rot: rad(-8) }).map(([x, y], i) => [x + 3 * Math.sin(i * 1.7 + seed), y + 3 * Math.cos(i * 2.3 + seed)]);
  p.shaded(pts, "#c8955a", "#9a6a3a", L, 70);
  for (const [x, y] of [[70, 80], [118, 70], [130, 108], [86, 112]]) p.arc(x, y, 5, 3, 200, 340, 3, "#7a4f2a");
  p.ring(pts, 8, L);
  if (bite > 0) {
    const r = 30 * bite;
    p.ell(168, 70, r, r * 1.1, "#f3dfa0", 7, 90, 270);
    for (let i = 0; i < 3; i++) p.arc(168 - r * 0.6, 60 + i * r * 0.45, r * 0.22, r * 0.22, 90, 270, 4, "#c8955a");
  }
};
/** grave marker with a carved pig silhouette (no text) on a 360 x 520 canvas, ground at 505 */
export const grave = (g) => {
  const p = new Pen(g);
  const top = [[60, 505], [60, 170], [80, 110], [180, 70], [280, 110], [300, 170], [300, 505]];
  p.form(top, "#a8744a", 0.72, 12, L, 140);
  for (const y of [190, 260, 330, 400, 460]) p.stroke([[80, y + 6], [180, y], [282, y + 8]], 3, "#7d5234");
  // carved pig silhouette
  const c = "#5b3a24";
  p.ell(180, 250, 70, 46, c, 0); p.ell(245, 232, 36, 34, c, 0); p.ell(276, 240, 14, 16, c, 0);
  p.poly([[226, 205], [240, 176], [254, 206]], c, 0);
  for (const x of [135, 160, 200, 225]) p.stroke([[x, 280], [x, 318]], 14, c);
  p.arc(102, 232, 14, 14, 60, 330, 7, c);
};
/** flower tuft on a 200 x 200 canvas, ground at 190 */
export const flowers = (g, col = "#ffd84a", seed = 1) => {
  const p = new Pen(g);
  for (let i = 0; i < 5; i++) { const x = 30 + i * 35 + 10 * rnd(seed, i), y = 120 - 40 * rnd(seed, i + 9); p.stroke([[x, 190], [x + 4, y]], 6, "#3f7a3a"); }
  for (let i = 0; i < 5; i++) {
    const x = 34 + i * 35 + 10 * rnd(seed, i), y = 120 - 40 * rnd(seed, i + 9), c = i % 2 ? col : "#f2f2f2";
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; p.ell(x + 11 * Math.cos(a), y + 11 * Math.sin(a), 9, 9, c, 4); }
    p.ell(x, y, 7, 7, "#e8892a", 3);
  }
};
/** map of the island on a 900 x 640 canvas; flag 0 = both, 1 = US wins */
export const islandMap = (g, win = 0, seed = 2) => {
  const p = new Pen(g);
  p.poly(rrect(10, 10, 890, 630, 26), "#f2e2b8", 12);
  g.fillStyle = "#cfe3ea"; p.path(rrect(40, 40, 860, 600, 18), true); g.fill();
  for (let i = 0; i < 8; i++) p.arc(450 + 300 * Math.cos(i), 320 + 200 * Math.sin(i * 1.3), 26, 8, 200, 340, 4, "#9cc4d2");
  const isl = bean(450, 330, 250, 170, { nTop: 2.0, nBot: 1.8, egg: -0.15, rot: rad(-18) }).map(([x, y], i) => [x + 18 * Math.sin(i * 0.9 + seed), y + 14 * Math.cos(i * 1.4)]);
  p.form(isl, "#a9c66a", 0.82, 9, L, 200);
  for (const [x, y] of [[380, 300], [470, 360], [540, 290], [420, 390]]) p.ell(x, y, 22, 14, "#7fa64f", 0);
  // pins
  const pin = (x, y, kind, s = 1) => {
    p.stroke([[x, y], [x, y - 120 * s]], 9);
    const fy = y - 120 * s;
    if (kind === "us") flagUS(g, x, fy, 110 * s, 70 * s);
    else flagUK(g, x, fy, 110 * s, 70 * s);
    p.poly([[x, fy], [x + 110 * s, fy], [x + 110 * s, fy + 70 * s], [x, fy + 70 * s]], null, 6);
    p.ell(x, y, 12, 6, INK, 0);
  };
  if (win < 1) { pin(330, 400, "us", 1 - win); pin(590, 280, "uk", 1 - win); }
  if (win > 0) pin(460, 340, "us", Math.min(1.25, win * 1.25));
};
/** US flag (1850s style: stripes + canton of stars) drawn in a box */
export const flagUS = (g, x, y, w, h) => {
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? "#f4f1e8" : "#c8312d"; g.fillRect(x, y + (i * h) / 13, w, h / 13 + 0.5); }
  g.fillStyle = "#2c3e7a"; g.fillRect(x, y, w * 0.42, h * (7 / 13));
  g.fillStyle = "#f4f1e8";
  const cw = w * 0.42, ch = h * (7 / 13);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) { g.beginPath(); g.arc(x + cw * (c + 0.5 + (r % 2) * 0.25) / 6.3, y + ch * (r + 0.6) / 5.4, Math.max(1, h * 0.022), 0, Math.PI * 2); g.fill(); }
};
/** Union flag drawn in a box */
export const flagUK = (g, x, y, w, h) => {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = "#24387a"; g.fillRect(x, y, w, h);
  const d = (w0, col) => { g.strokeStyle = col; g.lineWidth = w0; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + h); g.moveTo(x + w, y); g.lineTo(x, y + h); g.stroke(); };
  d(h * 0.2, "#f4f1e8"); d(h * 0.08, "#c8312d");
  g.fillStyle = "#f4f1e8"; g.fillRect(x + w * 0.42, y, w * 0.16, h); g.fillRect(x, y + h * 0.36, w, h * 0.28);
  g.fillStyle = "#c8312d"; g.fillRect(x + w * 0.455, y, w * 0.09, h); g.fillRect(x, y + h * 0.41, w, h * 0.18);
  g.restore();
};

// ---------------- effects ----------------
/** bang star on 500 x 500, t 0..1 */
export const fxBang = (g, t) => {
  const p = new Pen(g), c = 250, e = 1 - (1 - t) ** 3, n = 11, pts = [], inn = [];
  for (let i = 0; i < 2 * n; i++) {
    const a = rad((i * 180) / n + 6 * Math.sin(i * 3.1)), r = (i % 2 ? 70 : 150 + 60 * (i % 4 === 0)) * (0.35 + 0.65 * e);
    pts.push([c + r * Math.cos(a), c + r * Math.sin(a)]); inn.push([c + 0.55 * r * Math.cos(a), c + 0.55 * r * Math.sin(a)]);
  }
  g.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1;
  p.poly(pts, "#ffd23a", 10); p.poly(inn, "#fff6c8", 0);
  g.globalAlpha = 1;
};
/** dirt / dust puff on 300 x 300 */
export const fxPuff = (g, t, col = [214, 190, 150]) => {
  const p = new Pen(g);
  for (let i = 0; i < 6; i++) {
    const a = rad(170 + i * 40), d = 30 + 80 * t, r = (30 + 18 * (i % 2)) * (1 - 0.55 * t);
    p.ell(150 + d * Math.cos(a), 190 + d * 0.5 * Math.sin(a), r, r * 0.8, `rgba(${col[0]},${col[1]},${col[2]},${(1 - t).toFixed(3)})`, 0);
  }
};
/** smoke from a gun on 400 x 300 */
export const fxSmoke = (g, t) => {
  const p = new Pen(g);
  for (let i = 0; i < 7; i++) {
    const x = 60 + i * 42 + 40 * t, y = 160 - 30 * t - 10 * Math.sin(i * 1.7), r = (22 + 10 * (i % 3)) * (0.6 + 0.8 * t);
    p.ell(x, y, r, r * 0.85, `rgba(240,238,232,${(0.95 * (1 - t)).toFixed(3)})`, 0);
  }
};
/** small bird on 160 x 100, flap phase */
export const fxBird = (g, ph) => {
  const p = new Pen(g), w = 30 * Math.sin(ph * Math.PI * 2);
  p.stroke([[20, 50 - w], [62, 58], [80, 64], [98, 58], [140, 50 - w]], 9);
  p.ell(80, 64, 9, 7, INK, 0);
};
/** "Z" letters for snoring on 200 x 200 */
export const fxZ = (g, t) => {
  const p = new Pen(g);
  for (let i = 0; i < 3; i++) {
    const s = 0.5 + 0.25 * i, x = 40 + i * 50, y = 160 - i * 55 - 10 * t, a = Math.max(0, Math.min(1, t * 3 - i * 0.6));
    if (a <= 0) continue;
    g.globalAlpha = a;
    p.stroke([[x, y], [x + 30 * s, y], [x, y + 30 * s], [x + 30 * s, y + 30 * s]], 12 * s + 6);
    p.stroke([[x, y], [x + 30 * s, y], [x, y + 30 * s], [x + 30 * s, y + 30 * s]], 8 * s, "#ffffff");
  }
  g.globalAlpha = 1;
};
/** falling leaf on 80 x 80 */
export const fxLeaf = (g, col = "#e08a2c") => { const p = new Pen(g); p.poly(bean(40, 40, 30, 16, { nTop: 1.6, nBot: 1.6, rot: rad(30) }), col, 5); p.stroke([[16, 54], [64, 26]], 3, hexMul(col, 0.6)); };
/** snowflake blob on 64 x 64 */
export const fxSnow = (g) => { const p = new Pen(g); p.ell(32, 32, 18, 18, "#ffffff", 4); };
/** sparkle on 200 x 200 */
export const fxSpark = (g, t) => {
  const p = new Pen(g), s = Math.sin(t * Math.PI);
  p.poly([[100, 100 - 80 * s], [112, 88], [100 + 80 * s, 100], [112, 112], [100, 100 + 80 * s], [88, 112], [100 - 80 * s, 100], [88, 88]], "#fff3b0", 6);
};
/** impact ring for the gavel on 500 x 300 */
export const fxThud = (g, t) => {
  const p = new Pen(g);
  for (let i = 0; i < 6; i++) {
    const a = rad(200 + i * 28), r0 = 60 + 60 * t, r1 = r0 + 70 * (1 - t);
    p.stroke([[250 + r0 * Math.cos(a), 220 + r0 * 0.6 * Math.sin(a)], [250 + r1 * Math.cos(a), 220 + r1 * 0.6 * Math.sin(a)]], 14 * (1 - t) + 3);
  }
};

// ---------------- Tikus Hanoi: rats + props ----------------
const RAT = "#a7a2b6", RAT_SH = "#7b7690", RAT_BELLY = "#d9d5e2", RPINK = "#f2a3b4", RPINK_D = "#d77d93";
/** rat, side view facing right on a 600 x 420 canvas, soles at y = 405.
 *  opts: phase, walk (0..1), expr ("happy"|"sly"|"shock"|"content"|"wink"|"grin"), blink, tail ("long"|"stump"|"none"), tw (tail wiggle),
 *  wave (0..1 paw wave amount, k = wave phase), face ("side"|"cam"), fat (0..1), lie (bool), dangle (bool), cheek (0..1) */
export const rat = (g, opts = {}) => {
  const p = new Pen(g);
  const { phase = 0, walk = 0, expr = "happy", blink = 0, tail = "long", tw = 0, wave = 0, k = 0, face = "side", fat = 0, lie = false, dangle = false, cheek = 0, heart = false } = opts;
  const two = Math.PI * 2, sole = 405, F = 1 + 0.28 * fat;
  const bob = walk ? 6 * (0.5 + 0.5 * Math.cos(4 * Math.PI * phase)) * walk : 0;
  const by = (lie ? 318 : 292) - bob;
  const bx = 270;
  // tail first (behind)
  const tx = bx - 138 * F, ty = by + 22;
  if (tail === "long") {
    const pts = []; for (let i = 0; i <= 36; i++) { const t = i / 36; pts.push([tx - 190 * t, ty - 10 + 60 * Math.sin(t * 3.2 + tw) * t - 40 * t * t]); }
    p.stroke(pts, 18); p.stroke(pts, 10, RPINK);
  } else if (tail === "stump") {
    const a = [tx + 8, ty], b = [tx - 34, ty - 6 + 4 * Math.sin(tw)];
    p.stroke([a, b], 26); p.stroke([a, b], 16, RPINK);
    // bandage: white wrap with a red cross
    p.poly([[b[0] - 6, b[1] - 16], [b[0] + 18, b[1] - 18], [b[0] + 20, b[1] + 16], [b[0] - 4, b[1] + 18]], "#fbf7ee", 6);
    p.stroke([[b[0] + 7, b[1] - 8], [b[0] + 7, b[1] + 8]], 5, "#d9343a"); p.stroke([[b[0] - 1, b[1]], [b[0] + 15, b[1]]], 5, "#d9343a");
  }
  // legs
  const legPts = (x, ph) => {
    if (dangle) return [[x, by + 40], [x + 14 * Math.sin(ph * 6), by + 96]];
    if (lie) return [[x, by + 40], [x + 40, sole - 8]];
    if (!walk) return [[x, by + 50], [x + 4, sole - 10]];
    const S = 64 * walk, c = (((phase + ph) % 1) + 1) % 1;
    let fx, up;
    if (c < 0.5) { const s = c / 0.5; fx = S / 2 - S * s; up = 0; }
    else { const s = (c - 0.5) / 0.5; fx = -S / 2 + S * s - (S / Math.PI) * Math.sin(2 * Math.PI * s); up = 16 * walk * Math.sin(Math.PI * s); }
    return [[x + fx * 0.25, by + 50], [x + fx, sole - 10 - up]];
  };
  const legs = [[bx - 95 * F, 0.5, true], [bx + 70 * F, 0, true], [bx - 70 * F, 0, false], [bx + 95 * F, 0.5, false]];
  const foot = (b) => p.ell(b[0] + 10, b[1] + 2, 20, 11, RPINK, 5);
  for (const [x, ph, far] of legs) if (far) { const [a, b] = legPts(x, ph); p.limb([a, b], 18, hexMul(RAT, 0.82), 5); foot(b); }
  // body
  const bp = bean(bx, by, 150 * F, (lie ? 82 : 96) * F, { nTop: 2.2, nBot: 2.6, egg: 0.08 });
  p.shaded(bp, RAT, RAT_SH, L, 140 * F);
  p.clip(bp, () => p.ell(bx + 20, by + 70 * F, 110 * F, 40 * F, RAT_BELLY, 0));
  p.ring(bp, 10, L);
  for (const [x, ph, far] of legs) if (!far) { const [a, b] = legPts(x, ph); p.limb([a, b], 20, RAT, 5); foot(b); }
  // head: teardrop with a pointed snout
  const hx = bx + 150 * F, hy = by - 44;
  const head = []; for (let i = 0; i < 64; i++) { const t = (i / 64) * two, c = Math.cos(t); head.push([hx + 78 * c * (1 + 0.62 * Math.max(0, c) ** 3), hy + 62 * Math.sin(t) * (1 - 0.38 * Math.max(0, c) ** 2)]); }
  // ear (far, then near)
  p.ell(hx - 44, hy - 58, 30, 34, hexMul(RAT, 0.85), 7);
  p.shaded(head, RAT, RAT_SH, L, 80);
  if (cheek > 0) p.ell(hx + 20, hy + 26, 18, 11, "#f3a1b2", 0);
  p.ring(head, 9, L);
  p.ell(hx - 18, hy - 66, 40, 44, RAT, 8); p.ell(hx - 16, hy - 62, 25, 29, RPINK, 0);
  // nose, teeth, whiskers
  const nx = hx + 124, ny = hy + 2;
  p.ell(nx, ny, 14, 12, "#e5647f", 5);
  p.poly([[nx - 34, hy + 34], [nx - 18, hy + 33], [nx - 19, hy + 54], [nx - 33, hy + 55]], WHITE, 4);
  p.stroke([[nx - 26, hy + 34], [nx - 26, hy + 54]], 2.5);
  for (const [dy, l] of [[-8, 70], [4, 76], [16, 66]]) p.stroke([[nx - 22, ny + dy * 0.5], [nx - 22 + l * 0.8, ny + dy * 2.2 - 6]], 3.5);
  // eyes
  const eyeAt = (ex, ey, s) => {
    if (blink >= 1 || expr === "content") p.arc(ex, ey + 4, 13 * s, 9 * s, 200, 340, 6);
    else if (expr === "shock") { p.ell(ex, ey, 18 * s, 18 * s, WHITE, 5); p.dot(ex + 3, ey + 2, 6 * s); }
    else if (expr === "sly") { p.ell(ex, ey + 2, 10 * s, 7 * s, INK, 0); p.stroke([[ex - 14 * s, ey - 4], [ex + 14 * s, ey - 2]], 6); }
    else if (expr === "wink" && s < 1) p.arc(ex, ey + 4, 12 * s, 8 * s, 200, 340, 6);
    else { p.ell(ex, ey, 10 * s, 13 * s, INK, 0); p.dot(ex + 3, ey - 5, 3.5 * s, WHITE); }
  };
  if (face === "cam") { eyeAt(hx + 6, hy - 14, 0.92); eyeAt(hx + 46, hy - 16, 1); }
  else eyeAt(hx + 36, hy - 16, 1);
  const bw = expr === "shock" ? [-6, 6] : expr === "sly" ? [6, -2] : [-2, -4];
  p.stroke([[hx + 22, hy - 40 + bw[0]], [hx + 50, hy - 44 + bw[1]]], 6);
  // mouth
  if (expr === "shock") p.ell(nx - 30, hy + 44, 9, 12, MOUTH, 4);
  else if (expr === "grin") { p.ell(nx - 40, hy + 34, 22, 12, MOUTH, 5, 0, 180); }
  else p.arc(nx - 44, hy + 22, 18, 12, 25, 150, 5);
  // waving front paw
  if (wave > 0) {
    const s0 = [hx - 4, by + 26], ang = rad(-30 - 40 * wave + 16 * Math.sin(k * two * 2));
    const e = [s0[0] + 92 * Math.cos(ang), s0[1] + 92 * Math.sin(ang)];
    p.limb([s0, e], 18, RAT, 5); p.ell(e[0], e[1], 16, 16, RPINK, 5);
  }
  if (heart) heartAt(p, hx + 20, hy - 120, 1);
};
const heartAt = (p, x, y, s) => {
  const pts = []; for (let i = 0; i < 48; i++) { const t = (i / 48) * Math.PI * 2; pts.push([x + s * 16 * Math.sin(t) ** 3 * 2.2, y - s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 2.2]); }
  p.poly(pts, "#ff5c7a", 6 * s);
};
/** heart fx on 160 x 160, t 0..1 (pop + float) */
export const fxHeart = (g, t) => { const p = new Pen(g); g.globalAlpha = t > 0.75 ? (1 - t) / 0.25 : 1; heartAt(p, 80, 92 - 20 * t, 0.9 + 0.3 * Math.sin(Math.min(1, t * 3) * Math.PI)); g.globalAlpha = 1; };
/** coin on 120 x 120, t = spin phase */
export const coin = (g, t = 0) => {
  const p = new Pen(g), c = Math.cos(t * Math.PI * 2), w = Math.max(0.12, Math.abs(c));
  p.ell(60, 60, 46 * w, 46, c > 0 ? "#f3c64a" : "#d9a531", 6);
  if (w > 0.4) { p.ell(60, 60, 30 * w, 30, null, 3); p.stroke([[60, 42], [60, 78]], 5 * w, "#a8781e"); }
};
/** "!" shock mark on 120 x 200 */
export const fxBang2 = (g, t) => { const p = new Pen(g), s = 0.6 + 0.4 * Math.min(1, t * 4); g.save(); g.translate(60, 190); g.scale(s, s); g.translate(-60, -190); p.poly([[44, 20], [80, 16], [70, 130], [52, 132]], "#ffd23a", 7); p.ell(62, 165, 15, 15, "#ffd23a", 7); g.restore(); };
const tailCurl = (p, x, y, a, l, s = 1) => {
  const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([x + Math.cos(a + 1.4 * t) * l * t, y + Math.sin(a + 1.4 * t) * l * t * 0.6]); }
  p.stroke(pts, 13 * s); p.stroke(pts, 7 * s, RPINK);
};
/** heap of cut tails on 600 x 700 (ground at 690); h 0..1 fills the canvas */
export const tails = (g, h = 1, seed = 4) => {
  const p = new Pen(g), top = 690 - 640 * h, n = Math.round(30 + 260 * h);
  if (h <= 0.01) return;
  const heap = []; for (let i = 0; i <= 32; i++) { const t = i / 32, x = 40 + 520 * t; heap.push([x, 690 - (690 - top) * Math.sin(Math.PI * t) ** 0.6]); }
  heap.push([560, 690], [40, 690]);
  p.poly(heap, RPINK_D, 8);
  p.clip(heap, () => { for (let i = 0; i < n; i++) { const x = 30 + 540 * rnd(seed, i), y = top + (690 - top) * rnd(seed, i + 500); tailCurl(p, x, y, rnd(seed, i + 900) * 6.28, 60 + 50 * rnd(seed, i + 77)); } });
  for (let i = 0; i < 14; i++) { const t = (i + 0.5) / 14, x = 40 + 520 * t, y = 690 - (690 - top) * Math.sin(Math.PI * t) ** 0.6; tailCurl(p, x - 20, y + 8, -1.2 - rnd(seed, i) * 1.5, 70); }
};
/** woven basket of coins on 300 x 260 (ground at 250); fill 0..1 */
export const basket = (g, fill = 0, seed = 2) => {
  const p = new Pen(g);
  const body = [[30, 70], [270, 70], [240, 250], [60, 250]];
  if (fill > 0) for (let i = 0; i < Math.round(8 + 40 * fill); i++) { const x = 60 + 180 * rnd(seed, i), y = 78 - 70 * fill * rnd(seed, i + 40) ** 0.5; p.ell(x, y, 22, 12, "#f3c64a", 4); }
  p.form(body, "#c99a52", 0.75, 9, L, 140);
  for (let y = 100; y < 250; y += 30) p.stroke([[34 + (y - 70) / 6, y], [266 - (y - 70) / 6, y]], 3, "#8a6430");
  for (let x = 60; x < 260; x += 34) p.stroke([[x, 76], [x + (150 - x) * 0.12, 246]], 2.5, "#8a6430");
};
/** reward poster on 600 x 820 (bottom at 810): unroll, icon, coin, stamp (0..1) */
export const poster = (g, o = {}) => {
  const p = new Pen(g), { unroll = 1, icon = 1, coinA = 1, stamp = 0 } = o;
  const h = 780 * unroll, y0 = 810 - 780;
  if (unroll <= 0.01) return;
  g.save(); g.beginPath(); g.rect(0, y0 - 10, 600, h + 20); g.clip();
  p.poly([[30, y0], [570, y0], [574, 810], [26, 810]], "#f3e6c4", 10);
  g.fillStyle = "#7a2f35"; g.font = "900 78px sans-serif"; g.textAlign = "center"; g.fillText("SAYEMBARA", 300, y0 + 120);
  p.stroke([[80, y0 + 150], [520, y0 + 150]], 6, "#7a2f35");
  if (icon > 0) { g.save(); g.translate(300, y0 + 330); const s = 0.62 * back_(icon); g.scale(s, s); g.translate(-330, -300); rat(g, { expr: "sly", tail: "long" }); g.restore(); }
  g.fillStyle = INK; g.font = "900 70px sans-serif"; g.fillText("1 EKOR", 300, y0 + 560);
  if (coinA > 0) { g.globalAlpha = Math.min(1, coinA * 2); g.font = "900 70px sans-serif"; g.fillStyle = "#b07a1e"; g.fillText("= 1 SEN", 300, y0 + 650); g.save(); g.translate(490, y0 + 628); g.scale(0.6 * back_(coinA), 0.6 * back_(coinA)); g.translate(-60, -60); coin(g, 0); g.restore(); g.globalAlpha = 1; }
  if (stamp > 0) {
    g.save(); g.translate(300, y0 + 420); g.rotate(rad(-14)); const s = 1 + 1.4 * (1 - Math.min(1, stamp * 1.6)); g.scale(s, s); g.globalAlpha = Math.min(1, stamp * 3);
    g.strokeStyle = "#d42a2a"; g.lineWidth = 16; g.strokeRect(-250, -70, 500, 140);
    g.fillStyle = "#d42a2a"; g.font = "900 82px sans-serif"; g.textAlign = "center"; g.fillText("DIHENTIKAN", 0, 30); g.restore(); g.globalAlpha = 1;
  }
  g.restore();
  if (unroll < 1) { p.ell(300, y0 + h, 280, 22, "#e8d6ac", 8); }
};
const back_ = (x) => { const u = Math.max(0, Math.min(1, x)), c = 1.9; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2; };
/** French tricolour in a box */
export const flagFR = (g, x, y, w, h) => { for (const [i, c] of ["#2c4a9a", "#f4f1e8", "#d23a36"].entries()) { g.fillStyle = c; g.fillRect(x + (i * w) / 3, y, w / 3 + 0.5, h); } };
/** painted sign texture: text on a board */
export const signBoard = (g, w, h, lines, o = {}) => {
  g.fillStyle = o.bg ?? "#2f6b48"; g.fillRect(0, 0, w, h);
  g.strokeStyle = o.rim ?? "#f4f1e8"; g.lineWidth = Math.round(h * 0.05); g.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12);
  g.fillStyle = o.fg ?? "#f4f1e8"; g.textAlign = "center"; g.textBaseline = "middle";
  lines.forEach((t, i) => { let px = Math.round(h * (o.size ?? 0.42) / lines.length * 1.6); g.font = `900 ${px}px sans-serif`; const mw = g.measureText(t).width, lim = w - h * 0.3; if (mw > lim) { px = Math.floor(px * lim / mw); g.font = `900 ${px}px sans-serif`; } g.fillText(t, w / 2, h * (i + 0.55) / lines.length); });
};

// ================= Gunting Sjafruddin props =================
const NOTE_R = "#c9443a", NOTE_L = "#efa08f", NOTE_I = "#fbe6d6";
/** banknote in design space 600 x 300 (centre 300,150). part: full|left|right|obli (certificate) */
export const banknote = (g, part = "full", val = 10, o = {}) => {
  const p = new Pen(g);
  if (part === "obli") { certificate(g); return; }
  const body = [[20, 20], [580, 20], [580, 280], [20, 280]];
  const zig = []; for (let i = 0; i <= 10; i++) zig.push([300 + (i % 2 ? 12 : -12), 20 + i * 26]);
  const shape = part === "left" ? [[20, 20], ...zig, [20, 280]] : part === "right" ? [[580, 20], [580, 280], ...zig.slice().reverse()] : body;
  p.poly(shape, NOTE_R, 9);
  p.clip(shape, () => {
    p.poly(rrect(44, 44, 556, 256, 20), NOTE_L, 0);
    for (let i = 0; i < 18; i++) p.ell(300, 150, 60 + i * 14, 34 + i * 7, null, 1.6, 0, 360, 0);
    g.globalAlpha = 0.9; p.ell(300, 150, 78, 78, NOTE_I, 5); g.globalAlpha = 1;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.ell(300 + 46 * Math.cos(a), 150 + 46 * Math.sin(a), 12, 6, NOTE_R, 0, 0, 360, (a * 180) / Math.PI); }
    p.dot(300, 150, 16, NOTE_R);
    g.fillStyle = "#fff6ea"; g.strokeStyle = "#7a1f22"; g.lineWidth = 10; g.lineJoin = "round"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 96px sans-serif";
    for (const x of [118, 482]) { g.strokeText(String(val), x, 150); g.fillText(String(val), x, 150); }
    g.font = "900 26px sans-serif"; g.fillStyle = "#7a1f22"; g.fillText("RUPIAH", 300, 250);
  });
  p.poly(shape, null, 9);
};
const certificate = (g) => {
  const p = new Pen(g);
  p.poly([[60, 0], [540, 0], [540, 300], [60, 300]], "#f6ecd2", 9);
  p.poly(rrect(78, 16, 522, 284, 10), null, 4);
  g.fillStyle = "#2c3b63"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 54px sans-serif"; g.fillText("OBLIGASI", 300, 78);
  g.font = "800 30px sans-serif"; g.fillStyle = "#7a2f35"; g.fillText("1950", 300, 126);
  for (let i = 0; i < 4; i++) p.stroke([[130, 168 + i * 24], [400, 168 + i * 24]], 5, "#b7a88a");
  p.dot(462, 228, 36, "#c8312d"); p.ell(462, 228, 36, 36, null, 5); p.ell(462, 228, 24, 24, null, 3, 0, 360);
};
/** draw a held note around (x,y) at scale s (design units), rotation deg */
const noteAt = (g, x, y, s, part, val, rot = 0, flip = false) => { g.save(); g.translate(x, y); g.rotate(rad(rot)); g.scale(flip ? -s : s, s); g.translate(-300, -150); if (flip && (part === "left" || part === "right")) part = part === "left" ? "right" : "left"; banknote(g, part, val); g.restore(); };
const tinAt = (p, g, x, y, u, state) => {
  const w = 62 * u, h = 52 * u;
  if (state !== "closed") {
    for (let i = 0; i < 5; i++) { g.save(); g.translate(x - 30 * u + i * 15 * u, y - h * 0.5 - 6 * u); g.rotate(rad(-14 + i * 7)); g.scale(0.11 * u, 0.11 * u); g.translate(-300, -150); banknote(g, state === "cut" ? (i % 2 ? "left" : "right") : "full", 10); g.restore(); }
  }
  p.poly([[x - w, y - h * 0.5], [x + w, y - h * 0.5], [x + w, y + h * 0.5], [x - w, y + h * 0.5]], "#8fb3c9", 4 * u);
  p.ell(x, y + h * 0.5, w, 10 * u, "#6f93a9", 4 * u, 0, 180);
  p.ell(x, y - h * 0.5, w, 10 * u, state === "closed" ? "#a9c9dd" : "#3a4a55", 4 * u);
  p.band([[x - w, y], [x + w, y]], "#d9a63a", 7 * u, 1.6 * u, "butt");
};
const paperAt = (p, g, a, b, HH, u, head, flip = false) => {
  const x0 = a[0] - 46 * u, x1 = b[0] + 52 * u, top = Math.min(a[1], b[1]) - 0.4 * HH, bot = Math.max(a[1], b[1]) + 0.62 * HH;
  const pts = [[x0, top + 6 * u], [x1, top], [x1 + 4 * u, bot], [x0 - 4 * u, bot + 6 * u]];
  p.poly(pts, "#f1ede2", 4.5 * u);
  p.clip(pts, () => {
    const W_ = x1 - x0, cxp = (x0 + x1) / 2;
    if (flip) { g.translate(cxp, 0); g.scale(-1, 1); g.translate(-cxp, 0); }
    g.fillStyle = INK; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `900 ${Math.round(W_ * 0.15)}px serif`; g.fillText("HARIAN", (x0 + x1) / 2, top + W_ * 0.12);
    p.stroke([[x0 + 8 * u, top + W_ * 0.22], [x1 - 8 * u, top + W_ * 0.21]], 2.4 * u);
    g.font = `900 ${Math.round(W_ * 0.085)}px sans-serif`; g.fillStyle = "#b02a2a"; g.fillText(head, (x0 + x1) / 2, top + W_ * 0.31);
    for (let c = 0; c < 3; c++) for (let i = 0; i < 9; i++) p.stroke([[x0 + 12 * u + c * W_ * 0.32, top + W_ * 0.42 + i * 9 * u], [x0 + c * W_ * 0.32 + W_ * 0.27, top + W_ * 0.42 + i * 9 * u]], 2.6 * u, "#a8a294");
  });
  p.stroke([[(x0 + x1) / 2, top + 3 * u], [(x0 + x1) / 2 + 2 * u, bot + 3 * u]], 2 * u, "#c9c2b0");
};
export const scissors = (g, k = 0.5) => { // 700 x 300, pivot at (300,150), blades to +x
  const p = new Pen(g), op = rad(4 + 26 * k);
  for (const sg of [-1, 1]) {
    const R = (pts) => rotPts(pts, sg * op, 300, 150);
    p.poly(R([[300, 150 - 14 * sg], [660, 150 - 4 * sg], [664, 150], [300, 150 + 10 * sg]]), "#d5dae2", 7);
    p.stroke(R([[330, 150 - 4 * sg], [620, 150]]), 4, "#ffffff");
    p.poly(R(ellPts(180, 150 + 70 * sg, 92, 50, 0, 360, 0)), "#c8312d", 8);
    p.poly(R(ellPts(180, 150 + 70 * sg, 52, 24, 0, 360, 0)), "rgba(0,0,0,0)", 6);
    p.band(R([[250, 150 + 34 * sg], [300, 150]]), "#c8312d", 22, 6);
  }
  p.dot(300, 150, 12, "#8d949c"); p.ell(300, 150, 12, 12, null, 4);
};
export const calendar = (g, year = 1950) => { // 360 x 460
  const p = new Pen(g);
  p.poly([[20, 40], [340, 40], [340, 450], [20, 450]], "#fbf8f0", 8);
  p.poly([[20, 40], [340, 40], [340, 130], [20, 130]], "#c8312d", 8);
  for (const x of [90, 180, 270]) { p.ell(x, 40, 12, 22, null, 6, 180, 360); }
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 48px sans-serif"; g.fillText("TAHUN", 180, 88);
  g.fillStyle = INK; g.font = "900 120px sans-serif"; g.fillText(String(year), 180, 290);
};
export const priceBoard = (g, price = 1, up = 0) => { // 520 x 420
  const p = new Pen(g);
  p.poly([[20, 20], [500, 20], [500, 400], [20, 400]], "#8a5a34", 9);
  p.poly(rrect(44, 44, 476, 376, 10), "#2d3a32", 5);
  g.fillStyle = "#f4f1e6"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 64px sans-serif"; g.fillText("BERAS", 260, 104);
  p.stroke([[110, 150], [410, 150]], 5, "#f4f1e6");
  g.font = "900 120px sans-serif"; g.fillStyle = "#ffe07a"; g.fillText("Rp " + price, 240, 262);
  if (up > 0) { g.save(); g.translate(430, 300 - 40 * up); g.globalAlpha = Math.min(1, up * 2); p.poly([[0, -60], [40, 0], [16, 0], [16, 50], [-16, 50], [-16, 0], [-40, 0]], "#e3453a", 6); g.restore(); }
};
export const safeBox = (g, open = 1) => { // 420 x 520
  const p = new Pen(g);
  p.poly(rrect(30, 40, 390, 510, 18), "#3d5a4a", 9);
  p.poly(rrect(66, 76, 354, 474, 10), "#1d2420", 6);
  p.stroke([[80, 280], [340, 280]], 6, "#33403a");
  for (const [x, y] of [[100, 110], [320, 110], [100, 440], [320, 440]]) p.stroke([[x, y], [x + (x < 200 ? 40 : -40), y + (y < 200 ? 30 : -30)]], 2, "rgba(220,220,220,0.5)");
  const dw = 288 * (1 - 0.86 * open);
  p.poly([[354, 76], [354 + dw * 0.28, 60], [354 + dw * 0.28, 494], [354, 474]], "#4d6f5c", 7);
  p.ell(354 + dw * 0.16, 270, 14 * (1 - open * 0.6) + 6, 22, "#d8c27a", 5);
  p.poly([[60, 500], [100, 500], [100, 520], [60, 520]], INK, 0); p.poly([[320, 500], [360, 500], [360, 520], [320, 520]], INK, 0);
};
export const moth = (g, t = 0) => { // 140 x 120, centre
  const p = new Pen(g), fl = Math.sin(t * Math.PI * 16);
  for (const s of [-1, 1]) p.poly(ellPts(70 + s * 26, 56 - 6 * fl, 26, 18 + 10 * fl, 0, 360, s * -20), "#b9ad9a", 5);
  p.ell(70, 64, 9, 22, "#7a6e5e", 5);
  p.stroke([[66, 44], [56, 26]], 3); p.stroke([[74, 44], [84, 26]], 3);
};
export const banana = (g, n = 2) => { // 260 x 200
  const p = new Pen(g);
  for (let i = 0; i < n; i++) {
    const dx = i * 52, c = curve([70 + dx, 170], [70 + dx, 70], [190 + dx, 50], 16);
    p.stroke(c, 46); p.stroke(c, 32, "#f4cf3e"); p.stroke(curve([74 + dx, 160], [76 + dx, 80], [180 + dx, 58], 12), 8, "#fbe58a");
    p.dot(196 + dx, 50, 9, "#5a4a2a"); p.dot(70 + dx, 176, 12, "#7a8a3a");
  }
};
export const sewing = (g, half = 0) => { // 560 x 440, soles at 425
  const p = new Pen(g);
  const draw = () => {
    p.poly([[40, 330], [520, 330], [520, 380], [40, 380]], "#7a4a2a", 8);
    p.poly([[110, 330], [110, 150], [150, 110], [430, 110], [460, 150], [460, 210], [420, 210], [420, 170], [170, 170], [170, 330]], "#1f1d22", 8);
    p.poly([[380, 210], [470, 210], [470, 250], [380, 250]], "#1f1d22", 7);
    p.stroke([[440, 250], [440, 300]], 6, "#c9ced6");
    p.ell(90, 220, 50, 50, "#c9ced6", 7); p.ell(90, 220, 18, 18, "#1f1d22", 4);
    for (let i = 0; i < 9; i++) p.dot(190 + i * 28, 140 + 6 * Math.sin(i), 6, "#e8c45a");
    p.stroke([[190, 128], [400, 128]], 3, "#e8c45a");
    p.ell(300, 105, 14, 8, "#e8e2d4", 5);
    p.poly([[60, 380], [80, 425], [100, 380]], "#5a3a22", 6); p.poly([[460, 380], [480, 425], [500, 380]], "#5a3a22", 6);
  };
  if (half <= 0) { draw(); return; }
  g.save(); g.beginPath(); g.rect(0, 0, 280, 440); g.clip(); draw(); g.restore();
  g.save(); g.globalAlpha = Math.max(0, 1 - half * 1.6); g.translate(40 * half, 120 * half * half); g.rotate(rad(18 * half)); g.beginPath(); g.rect(280, 0, 300, 440); g.clip(); draw(); g.restore();
  g.setLineDash([16, 12]); g.strokeStyle = "rgba(36,23,38,0.6)"; g.lineWidth = 5; g.strokeRect(282, 100, 238, 290); g.setLineDash([]);
};
export const stamp = (g, text = "RAHASIA NEGARA", t = 1) => { // 1000 x 360
  if (t <= 0) return;
  g.save(); g.translate(500, 180); g.rotate(rad(-8)); const s = 1 + 1.2 * (1 - Math.min(1, t * 1.6)); g.scale(s, s); g.globalAlpha = Math.min(1, t * 3);
  g.font = "900 104px sans-serif"; const w = Math.min(900, g.measureText(text).width + 90);
  g.strokeStyle = "#d42a2a"; g.lineWidth = 18; g.strokeRect(-w / 2, -90, w, 180); g.lineWidth = 6; g.strokeRect(-w / 2 + 18, -72, w - 36, 144);
  g.fillStyle = "#d42a2a"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 0, 6, w - 70); g.restore();
};
export const fxQ = (g, t) => { // "?!" 220 x 220
  const p = new Pen(g), s = 0.6 + 0.4 * Math.min(1, t * 4);
  g.save(); g.translate(110, 200); g.scale(s, s); g.translate(-110, -200);
  g.font = "900 150px sans-serif"; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.lineWidth = 14; g.strokeStyle = INK; g.lineJoin = "round";
  g.strokeText("?!", 110, 180); g.fillStyle = "#ffd23a"; g.fillText("?!", 110, 180); g.restore();
};
export const label = (g, text, col = "#ffd23a") => { // 700 x 220
  g.font = "900 120px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 18; g.lineJoin = "round"; g.strokeStyle = INK;
  g.strokeText(text, 350, 110, 680); g.fillStyle = col; g.fillText(text, 350, 110, 680);
};
export const flagID = (g, x, y, w, h) => { g.fillStyle = "#d8252c"; g.fillRect(x, y, w, h / 2 + 0.5); g.fillStyle = "#f6f4ee"; g.fillRect(x, y + h / 2, w, h / 2); };

// ================= Nikahan Anjing =================
export const pawAt = (p, x, y, s, col = INK) => { p.ell(x, y + 0.35 * s, 0.62 * s, 0.5 * s, col, 0); for (const [dx, dy] of [[-0.62, -0.32], [-0.22, -0.68], [0.22, -0.68], [0.62, -0.32]]) p.ell(x + dx * s, y + dy * s, 0.22 * s, 0.27 * s, col, 0); };
/** dog, side view facing right on 600 x 420, soles at y = 405.
 *  opts: col, col2 (ears/patch), expr ("happy"|"pant"|"shock"|"smug"|"sleep"|"love"), sit (0..1), phase, walk (0..1), tail (deg wag),
 *  blink, outfit ("veil"|"groom"|"silk"|null), silk (colour), collar (colour), jewel (bool), garland (bool), bark (0..1) */
export const dog = (g, opts = {}) => {
  const p = new Pen(g);
  const { col = "#e8c48a", col2 = "#b8864a", expr = "happy", sit = 0, phase = 0, walk = 0, tail = 0, blink = 0, outfit = null, silk = "#d8434a", collar = null, jewel = false, garland = false, bark = 0, look = 0 } = opts;
  const two = Math.PI * 2, sole = 405, sh = hexMul(col, 0.8);
  const bob = walk ? 5 * Math.abs(Math.cos(two * phase)) * walk : 0;
  const by = 268 - bob - 30 * sit;
  const bodyRot = rad(-38 * sit);
  // legs (planted / walking)
  const legPts = (x, ph, front) => {
    let fx = 0, up = 0;
    if (walk) { const S = 70 * walk, c = (((phase + ph) % 1) + 1) % 1; if (c < 0.5) fx = S / 2 - S * (c / 0.5); else { const t = (c - 0.5) / 0.5; fx = -S / 2 + S * t; up = 22 * walk * Math.sin(Math.PI * t); } }
    if (!front && sit > 0) return null;
    const top = [x + (front ? 0 : 0), by + 30 - (front ? 40 * sit : 0)];
    return [top, [x + fx + (front ? 14 * sit : 0), sole - 14 - up]];
  };
  const legs = [[205, 0.5, false, true], [350, 0, true, true], [228, 0, false, false], [372, 0.5, true, false]];
  for (const [x, ph, fr, far] of legs) if (far) { const L_ = legPts(x, ph, fr); if (L_) { p.limb(L_, 24, hexMul(col, 0.78), 6); p.ell(L_[1][0] + 8, L_[1][1] + 2, 17, 10, hexMul(col, 0.78), 5); } }
  // tail
  const ta = rad(-55 + tail), tx0 = sit ? 190 : 165, ty0 = sit ? by + 70 : by - 20;
  const tp = []; for (let i = 0; i <= 12; i++) { const t = i / 12, a = ta - 0.5 * t; tp.push([tx0 - 80 * t * Math.cos(a) * 0.9, ty0 + 80 * t * Math.sin(a)]); }
  p.stroke(tp, 30); p.stroke(tp, 18, col);
  // body
  const bcx = 285 - 20 * sit, bcy = by + 10 * sit;
  let bp = bean(bcx, bcy, 135, 70, { nTop: 2.2, nBot: 2.4, egg: 0.05 }); if (sit) bp = rotPts(bp, bodyRot, bcx, bcy);
  p.shaded(bp, col, sh, L, 130);
  p.clip(bp, () => { p.ell(bcx + 20, bcy + 52, 110, 34, mix(col, "#ffffff", 0.35), 0); if (col2 && opts.patch) p.ell(bcx - 40, bcy - 30, 50, 34, col2, 0); });
  if (outfit === "silk") {
    const cp = sit ? rotPts(bean(bcx - 4, bcy - 6, 112, 60, { nTop: 2.4, nBot: 3 }), bodyRot, bcx, bcy) : bean(bcx - 4, bcy - 8, 112, 60, { nTop: 2.4, nBot: 3 });
    p.clip(bp, () => { p.grad(cp, silk, hexMul(silk, 0.7), L); for (let i = 0; i < 18; i++) p.dot(bcx - 100 + (i % 6) * 40, bcy - 50 + Math.floor(i / 6) * 36 + (i % 2) * 10, 6, "#f3c64a"); });
    p.poly(cp, null, 5);
  }
  if (sit) p.form(ellPts(bcx - 60, sole - 52, 70, 46), col, 0.82, 9, L, 70); // haunch
  p.ring(bp, 10, L);
  for (const [x, ph, fr, far] of legs) if (!far) { const L_ = legPts(x, ph, fr); if (L_) { p.limb(L_, 26, col, 6); p.ell(L_[1][0] + 9, L_[1][1] + 2, 18, 11, col, 5); } }
  if (sit) { p.ell(bcx - 30, sole - 8, 26, 10, col, 5); }
  // head
  const hx = 432 - 30 * sit, hy = by - 62 - 64 * sit + (bark ? -6 * bark : 0);
  const earF = (front) => { const ex = hx - 52 + (front ? 6 : -10), ey = hy - 46; const ep = [[ex - 8, ey], [ex + 26, ey - 8], [ex + 20, ey + 56], [ex + 2, ey + 82], [ex - 22, ey + 56]]; p.form(ep, front ? col2 : hexMul(col2, 0.8), 0.78, 8, L, 50); };
  earF(false);
  const hp = bean(hx, hy, 76, 66, { nTop: 2.0, nBot: 2.3, egg: -0.08 });
  p.shaded(hp, col, sh, L, 70);
  // muzzle
  const mz = bean(hx + 64, hy + 26, 52, 34, { nTop: 2.2, nBot: 2.2 });
  p.shaded(mz, mix(col, "#ffffff", 0.3), col, L, 40);
  p.ring(hp, 10, L); p.ring(mz, 8, L);
  p.clip(hp, () => p.ell(hx + 40, hy + 20, 10, 8, mix(col, "#ffffff", 0.3), 0));
  p.ell(hx + 112, hy + 12, 15, 12, INK, 0); p.dot(hx + 108, hy + 8, 4, "#ffffff");
  // eye
  const ex = hx + 26 + look * 4, ey = hy - 14;
  if (expr === "shock") { p.ell(hx + 26, ey, 16, 16, WHITE, 5); p.dot(ex + 3, ey + 2, 5.5); }
  else if (expr === "sleep" || blink >= 1 || expr === "love") { if (expr === "love") heartAt(p, hx + 26, ey + 4, 0.42); else p.arc(hx + 26, ey + 2, 12, 8, 20, 160, 5.5); }
  else if (expr === "happy" || expr === "pant") p.arc(hx + 26, ey + 6, 12, 10, 200, 340, 6);
  else { p.ell(ex, ey, 9, 11, INK, 0); p.dot(ex + 3, ey - 4, 3, "#ffffff"); }
  if (expr === "smug") p.stroke([[hx + 12, ey - 10], [hx + 40, ey - 12]], 5);
  if (expr === "shock") p.arc(hx + 26, ey - 22, 13, 4, 200, 340, 5);
  // mouth
  const mx = hx + 82, my = hy + 46;
  if (expr === "pant" || bark > 0.2) {
    const o = Math.max(bark, 0.5);
    p.ell(mx, my, 22, 10 + 10 * o, MOUTH, 5);
    p.form(rrect(mx - 6, my + 4, mx + 14, my + 36 + 10 * (expr === "pant" ? 1 : 0), 10), TONGUE, 0.8, 4, L, 16);
  } else if (expr === "shock") p.ell(mx, my + 2, 10, 13, MOUTH, 5);
  else if (expr === "smug") p.arc(mx - 4, my - 8, 18, 10, 20, 120, 5);
  else p.arc(mx - 6, my - 10, 22, 12, 25, 155, 5);
  earF(true);
  // accessories
  if (collar || jewel || outfit === "veil") {
    const cx0 = hx - 52, cy0 = hy + 46;
    p.band([[cx0 - 10, cy0 - 26], [cx0 + 6, cy0 + 4], [cx0 + 30, cy0 + 26]], collar || "#d8434a", 14, 3);
    if (jewel || outfit === "veil") for (let i = 0; i < 5; i++) { p.dot(cx0 - 4 + i * 8, cy0 - 10 + i * 8, 8, INK); p.dot(cx0 - 4 + i * 8, cy0 - 10 + i * 8, 6, i === 2 ? "#5ad0e0" : "#f3c64a"); }
  }
  if (garland || outfit === "groom") {
    const cx0 = hx - 52, cy0 = hy + 50;
    for (let i = 0; i < 9; i++) { const t = i / 8; const x = cx0 - 18 + 50 * t, y = cy0 - 40 + 70 * t + 10 * Math.sin(t * Math.PI); p.ell(x, y, 13, 13, i % 2 ? "#f29a2a" : "#f7c43a", 4); }
  }
  if (outfit === "veil") {
    g.save(); g.globalAlpha = 0.72;
    const vp = [[hx - 26, hy - 72], [hx + 24, hy - 76], [hx + 4, hy - 44], [hx - 40, hy - 10], [hx - 70, hy + 50]]; for (let i = 0; i <= 6; i++) vp.push([hx - 70 - i * 14, hy + 50 + 10 * Math.sin(i * 1.6) - i * 4]); vp.push([hx - 150, hy - 10], [hx - 90, hy - 56]);
    p.poly(vp, "#ffffff", 0); g.globalAlpha = 1; p.poly(vp, null, 4);
    g.restore();
    for (let i = 0; i < 5; i++) p.dot(hx - 22 + i * 12, hy - 72 - 8 * Math.sin(i / 4 * Math.PI), 6, "#f3c64a");
    p.dot(hx + 4, hy - 82, 7, "#e85a8a");
  }
  if (outfit === "groom") {
    const yb = hy - 52, tp2 = [[hx - 60, yb + 6], [hx - 62, yb - 30], [hx - 20, yb - 56], [hx + 30, yb - 52], [hx + 52, yb - 24], [hx + 50, yb + 4]];
    p.form(tp2, "#e89a32", 0.72, 6, L, 60);
    for (let i = 0; i < 3; i++) p.stroke(curve([hx - 60, yb - 6 - i * 14], [hx, yb - 20 - i * 14], [hx + 50, yb - 10 - i * 14]), 3, "#b86a1a");
    p.ell(hx - 2, yb - 26, 9, 11, "#d8434a", 3); p.form([[hx - 6, yb - 34], [hx - 22, yb - 92], [hx - 6, yb - 100], [hx + 8, yb - 36]], "#f4f1e6", 0.8, 3, L, 30);
  }
};
/** silver palanquin carried on a pole; 900 x 600, pole line at y = 470. opts: dog (bool), sway */
export const palanquin = (g, opts = {}) => {
  const p = new Pen(g), SIL = "#d6dbe2";
  p.band([[20, 470], [880, 470]], "#8a5a30", 16, 5);
  // cabin
  const x0 = 260, x1 = 640, y0 = 230, y1 = 470;
  p.form(ellPts(450, y0 + 6, 210, 120, 180, 360), SIL, 0.72, 8, L, 220);
  p.dot(450, y0 - 120, 16, "#e8c45a"); p.stroke([[450, y0 - 104], [450, y0 - 116]], 6);
  p.poly([[x0 - 30, y0], [x1 + 30, y0], [x1 + 20, y0 + 22], [x0 - 20, y0 + 22]], "#e8c45a", 5);
  for (const x of [x0, x1 - 26]) p.form(rrect(x, y0 + 22, x + 26, y1, 6), SIL, 0.72, 6, L, 40);
  p.poly([[x0 + 26, y0 + 22], [x1 - 26, y0 + 22], [x1 - 26, y1], [x0 + 26, y1]], "#7a2f35", 0);
  if (opts.dog) { g.save(); g.translate(300, 140); g.scale(0.62, 0.62); dog(g, { ...opts.dogOpts, sit: 1 }); g.restore(); }
  for (const s of [0, 1]) { const cx = s ? x1 - 26 : x0 + 26; const cp = [[cx, y0 + 22], [cx + (s ? -60 : 60), y0 + 22], [cx + (s ? -24 : 24), y0 + 150], [cx, y0 + 160]]; p.poly(cp, "#e85a8a", 4); }
  p.form(rrect(x0 - 20, y1 - 30, x1 + 20, y1 + 16, 8), SIL, 0.7, 7, L, 200);
  for (let i = 0; i < 9; i++) p.dot(x0 + i * 47, y1 - 7, 7, "#e8c45a");
  for (let i = 0; i < 7; i++) { const x = x0 - 10 + i * 66; p.stroke([[x, y0 + 22], [x + 6, y0 + 60]], 4, "#f29a2a"); p.dot(x + 6, y0 + 64, 8, "#f7c43a"); }
};
/** money sack 300 x 340, soles at 330 */
export const moneyBag = (g, label = "Rp") => {
  const p = new Pen(g);
  const bp = bean(150, 220, 120, 110, { nTop: 1.8, nBot: 2.6, egg: 0.25 });
  p.form(bp, "#d9b97a", 0.72, 8, L, 120);
  p.form([[110, 112], [190, 112], [215, 62], [180, 76], [150, 50], [120, 76], [85, 62]], "#d9b97a", 0.75, 7, L, 60);
  p.band([[104, 118], [196, 118]], "#7a4a2a", 10, 3);
  g.font = "900 80px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#7a4a2a"; g.fillText(label, 150, 238);
};
/** kennel doghouse front view 500 x 460, soles at 450 */
export const kennel = (g, col = "#c8553d", name = "") => {
  const p = new Pen(g);
  p.form([[40, 200], [460, 200], [460, 450], [40, 450]], "#f2e3bd", 0.8, 8, L, 250);
  p.form([[10, 210], [250, 30], [490, 210], [450, 230], [250, 80], [50, 230]], col, 0.75, 8, L, 250);
  p.poly(rrect(170, 260, 330, 452, 70), "#3a2a24", 6);
  if (name) { p.poly(rrect(160, 205, 340, 250, 8), "#e8c45a", 4); g.font = "900 34px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = INK; g.fillText(name, 250, 229, 170); }
};
/** the plane window (cabin), 600 x 600 */
export const fxDollar = (g, t) => { g.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1; g.font = "900 150px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 16; g.lineJoin = "round"; g.strokeStyle = INK; g.strokeText("Rp", 120, 100); g.fillStyle = "#f3c64a"; g.fillText("Rp", 120, 100); g.globalAlpha = 1; };
/** fuselage side with round windows and who sits behind them; 1500 x 560, centre anchor. slots: array of "nawab"|"empty"|"dogs"|"begum"|"pop" (dogs popping in, t) */
export const cabinWin = (g, slots = [], o = {}) => {
  const p = new Pen(g);
  g.fillStyle = "#cfd6de"; g.fillRect(0, 0, 1500, 560);
  const gr = g.createLinearGradient(0, 0, 0, 560); gr.addColorStop(0, "rgba(255,255,255,0.35)"); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(40,50,70,0.35)"); g.fillStyle = gr; g.fillRect(0, 0, 1500, 560);
  g.fillStyle = "#2f6b48"; g.fillRect(0, 440, 1500, 34);
  for (let x = 40; x < 1500; x += 120) for (const y of [24, 536]) p.dot(x, y, 5, "#8a96a4");
  for (const x of [250, 750, 1250]) p.stroke([[x, 0], [x, 560]], 3, "rgba(80,90,110,0.5)");
  slots.forEach((k, i) => {
    const wx = 750 + (i - (slots.length - 1) / 2) * 500, wy = 250, R = 150;
    const win = ellPts(wx, wy, R, R * 1.08);
    p.poly(win, "#b9d6ea", 0);
    p.clip(win, () => {
      g.fillStyle = "#e8dcc4"; g.fillRect(wx - R, wy - R * 1.1, 2 * R, 2.2 * R);
      g.fillStyle = "#7a2f35"; g.fillRect(wx - R, wy + 20, 2 * R, R); // seat back
      if (k === "nawab" || k === "begum") { g.save(); g.translate(wx - 300 * 0.95, wy + 50 - 365 * 0.95); g.scale(0.95, 0.95); person(g, k === "nawab" ? NAWAB : BEGUM, { expr: o.expr ?? "smug", armF: k === "nawab" ? (o.pat ? "pat" : "hang") : "hang", k: o.k ?? 0, look: 0.6, seed: 3 }); g.restore(); }
      if (k === "dogs" || k === "pop") {
        const t = k === "pop" ? Math.min(1, o.t ?? 0) : 1, up = (1 - t) * 260;
        for (const [dx, dy, sc, c, c2, ex] of [[-349, -96, 0.72, "#e8b45a", "#c88a3a", "pant"], [-200, -58, 0.66, "#f4ece0", "#3a2a24", "happy"]]) { g.save(); g.translate(wx + dx, wy + dy + up); g.scale(sc, sc); dog(g, { col: c, col2: c2, expr: ex, sit: 1, patch: c === "#f4ece0", collar: "#d8434a", jewel: true }); g.restore(); }
      }
      g.fillStyle = "rgba(255,255,255,0.28)"; g.beginPath(); g.ellipse(wx - 50, wy - 70, 40, 80, -0.5, 0, 7); g.fill();
    });
    p.poly(win, null, 14); p.poly(ellPts(wx, wy, R + 22, R * 1.08 + 22), null, 6);
  });
};
