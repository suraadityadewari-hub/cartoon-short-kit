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
export const KAISER = { skin: "#ffe0bf", coat: "#2c3b63", pants: "#22283c", boots: INK, hat: "pickel", hatCol: "#1d1f26", whiskers: "#f1f0ea", moustache: "#f1f0ea", build: "stout", epaulettes: "#e8c45a", buttons: "#e8c45a", sash: "#e8b23a" };

const BUILD = { adult: { a: 112, torso: 1.08, legs: 1.36, tw: 0.82 }, stout: { a: 114, torso: 1.12, legs: 1.26, tw: 0.98 } };

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
  if (o.hat === "kepi") {
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
  } else if (o.hair) {
    const pts = [];
    for (const [x, y] of ellPts(cx - 4 * u, hc - 0.18 * B, A * 1.04, B * 0.9, 180, 360)) pts.push([x, y]);
    p.form(pts, o.hair, 0.75, 5 * u, L, A);
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
    beard = 0, seed = 1, bob = 0, chew = 0 } = opts;
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
      case "salute": return side > 0 ? { e: [S[0] + 0.42 * AL, S[1] - 0.05 * AL], h: [tcx + 0.65 * ta, chin - 0.55 * HH] } : { e: [S[0] - 0.12 * AL, S[1] + 0.45 * AL], h: [S[0] - 0.14 * AL, S[1] + 0.85 * AL] };
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
  drawArm(1, F);
  // ---- head ----
  const hc = chin - Bh * 0.86;
  g.save();
  if (headTilt) { g.translate(300, chin); g.rotate(rad(headTilt)); g.translate(-300, -chin); }
  const hp = bean(300 + 2 * u, hc, A, Bh, { nTop: 1.8, nBot: 2.3, egg: -0.1, asym: 0.07, rot: rad(4 * (rnd(seed, 3) - 0.5)) });
  p.shaded(hp, skin, hexMul(skin, 0.88), L, A);
  // whiskers / beard behind face features
  const fx = 300 + 10 * u, F_ = FACE[expr] || FACE.neutral;
  if (o.beard || beard > 0) {
    const bl = o.beard ? 1 : beard, bc = o.beard || "#5a3a24";
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
  if (sweat > 0) for (const [dx, dy, s] of [[-0.95, -0.55, 1], [1.02, -0.2, 0.8]]) {
    const x = 300 + dx * A, y = hc + dy * Bh + 18 * u * sweat;
    p.poly([[x, y - 12 * u * s], [x + 6 * u * s, y + 2 * u], [x, y + 8 * u * s], [x - 6 * u * s, y + 2 * u]], "#9fd4ff", 2.4 * u);
  }
  hat(p, o, 300 + 2 * u, hc, A, Bh, u);
  g.restore();
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
