// Engine + world for "Nikahan Anjing" (Junagadh, 1920s-1947). Pure function of the frame: window.renderFrame(f) -> JPEG data URL.
import * as THREE from "./three.module.js";
import { mergeGeometries } from "./BufferGeometryUtils.js";
import * as P from "./paint.js";
import * as C from "./cast.js";
import * as UP from "./toon_up.js";
import * as PP from "postprocessing";
import * as UpInk from "./up_ink.js";
import * as UpLens from "./up_lensblur.js";
import * as UpGrade from "./up_grade.js";
import * as UpPaint from "./up_paint.js";
import * as UpShade from "./up_shade.js";
import * as S from "./story.js";

const W = 1080, H = 1920, FAR = 2600;
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.useLegacyLights = true;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, FAR);
scene.fog = new THREE.Fog(0xcfe9f5, 120, 900);

// ---------- toon materials ----------
const gm = new THREE.DataTexture(new Uint8Array([150, 150, 150, 255, 205, 205, 205, 255, 255, 255, 255, 255]), 3, 1);
gm.minFilter = gm.magFilter = THREE.NearestFilter; gm.needsUpdate = true;
const MAT = new Map();
const toon = (key, o = {}) => {
  if (MAT.has(key)) return MAT.get(key);
  // world materials: Lambert + upstream two-tone shading (lit colour vs bluish shade colour, soft terminator, real sun shadows)
  const m = UpShade.twoTone(new THREE.MeshLambertMaterial({ color: o.color ?? 0xffffff, map: o.map ?? null, side: o.side ?? THREE.FrontSide, vertexColors: !!o.vc }));
  MAT.set(key, m); return m;
};
const toonM = (o) => UpShade.twoTone(new THREE.MeshLambertMaterial(o));

// ---------- geometry helpers / batching ----------
const BATCH = new Map(); // material -> geometries
const addB = (geo, mat, m4) => { const g = geo.index ? geo.toNonIndexed() : geo.clone(); if (m4) g.applyMatrix4(m4); for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k); if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); if (!BATCH.has(mat)) BATCH.set(mat, []); BATCH.get(mat).push(g); };
const M4 = (x, y, z, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new THREE.Vector3(sx, sy, sz));
/** textured box with world-scaled UVs (tile = metres per texture repeat) */
const tboxGeo = (w, h, d, tile = 1) => {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, (uv.getX(k) * dims[f][0]) / tile, (uv.getY(k) * dims[f][1]) / tile); }
  return g;
};
const box = (w, h, d, mat, x, y, z, ry = 0, tile = 1) => addB(tboxGeo(w, h, d, tile), mat, M4(x, y + h / 2, z, ry));
/** triangular prism (roof / tent): width w across the ridge, depth d along the ridge, height h */
const prismGeo = (w, h, d, tile = 1) => {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2);
  const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / tile, uv.getY(i) / tile);
  g.computeVertexNormals(); return g;
};
const flush = () => {
  for (const [mat, gs] of BATCH) {
    const geo = mergeGeometries(gs, false); geo.computeBoundingSphere();
    const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; m.userData.kind = "world"; scene.add(m);
  }
  BATCH.clear();
};
const mesh = (geo, mat, kind = "world", shadow = true) => { const m = new THREE.Mesh(geo, mat); m.userData.kind = kind; m.castShadow = m.receiveShadow = shadow; scene.add(m); return m; };

// ---------- world ----------
export const ground = () => 0;
S.setGround(ground);
const WORLD = {};
const canvasTex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const planeXZ = (w, d, mat, x, y, z, tile = 1, kind = "world") => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tile, (uv.getY(i) * d) / tile); const m = mesh(g, mat, kind, false); m.receiveShadow = true; m.position.set(x, y, z); return m; };
const planeV = (w, h, mat, x, y, z, ry = 0) => { const m = mesh(new THREE.PlaneGeometry(w, h), mat, "world", false); m.receiveShadow = true; m.position.set(x, y, z); m.rotation.y = ry; return m; };
const sign = (w, h, lines, o, x, y, z, ry = 0) => { const pw = Math.round(w * 200), ph = Math.round(h * 200); return planeV(w, h, toonM({ map: canvasTex(pw, ph, (g) => C.signBoard(g, pw, ph, lines, o)) }), x, y, z, ry); };
// extra painters
const tiles = (a, b, n = 8) => P.ctex("tile" + a + b, 512, 512, (g) => { const s = 512 / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? a : b; g.fillRect(i * s, j * s, s, s); g.strokeStyle = "rgba(60,60,80,.35)"; g.lineWidth = 3; g.strokeRect(i * s, j * s, s, s); } });
const weave = () => P.ctex("weave", 256, 256, (g) => { g.fillStyle = "#c9a35e"; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 16) for (let x = 0; x < 256; x += 32) { g.fillStyle = (y / 16) % 2 ? "#b88f4a" : "#d8b571"; g.fillRect(x + ((y / 16) % 2) * 16, y, 16, 16); } g.strokeStyle = "rgba(90,60,30,.4)"; for (let y = 0; y < 256; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } });
const thatch = () => P.ctex("thatch", 512, 512, (g, r) => { g.fillStyle = "#c8a45a"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 1400; i++) { const x = r() * 512, y = r() * 512; g.strokeStyle = r() > 0.5 ? "#a8843e" : "#e0c07a"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 8, y + 26 + r() * 20); g.stroke(); } });
const brickDark = () => P.ctex("brickDark", 512, 512, (g, r) => { g.fillStyle = "#4a3f3a"; g.fillRect(0, 0, 512, 512); for (let y = 0, row = 0; y < 512; y += 32, row++) for (let x = -(row % 2) * 32; x < 512; x += 64) { const k = 0.85 + r() * 0.3; g.fillStyle = `rgb(${Math.round(132 * k)},${Math.round(88 * k)},${Math.round(70 * k)})`; g.fillRect(x + 3, y + 3, 58, 26); } for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(70,110,80,${0.1 + r() * 0.15})`; g.beginPath(); g.ellipse(r() * 512, 300 + r() * 212, 40 + r() * 60, 12 + r() * 20, 0, 0, 7); g.fill(); } });

const tree = (x, z, kind, s = 1) => {
  if (kind === "palm") {
    addB(new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 5 * s, 6), toon("trunk", { color: 0x8a6a48 }), M4(x, 2.5 * s, z, 0, 0, 0.06));
    for (let i = 0; i < 6; i++) addB(new THREE.BoxGeometry(3 * s, 0.08, 0.7 * s), toon("palmLeaf", { color: 0x3f8f3f }), M4(x + Math.cos(i) * 1.3 * s, 5 * s - 0.3, z + Math.sin(i) * 1.3 * s, -i, 0, -0.35));
    return;
  }
  addB(new THREE.CylinderGeometry(0.22 * s, 0.34 * s, 2.6 * s, 6), toon("trunk", { color: 0x6b4429 }), M4(x, 1.3 * s, z));
  const g = new THREE.IcosahedronGeometry(2.1 * s, 1);
  WORLD.leafGeos.push((g.index ? g.toNonIndexed() : g).applyMatrix4(M4(x, 4.0 * s, z, x, 0, 0, 1.25, 0.9, 1.25)));
};
const flagPole = (x, y, z, h, size) => {
  addB(new THREE.CylinderGeometry(0.06 * size, 0.08 * size, h, 8), toon("pole", { color: 0xe8e2d4 }), M4(x, y + h / 2, z));
  addB(new THREE.SphereGeometry(0.14 * size, 8, 6), toon("gold", { color: 0xe8c45a }), M4(x, y + h + 0.1, z));
  const t = canvasTex(330, 220, (g) => C.flagID(g, 0, 0, 330, 220));
  const geo = new THREE.PlaneGeometry(1.5 * size, 1.0 * size, 14, 8); geo.translate(0.75 * size, 0, 0);
  const m = mesh(geo, toonM({ map: t, side: THREE.DoubleSide }), "world", true);
  m.position.set(x + 0.07 * size, y + h - 0.5 * size, z); m.userData.base = geo.attributes.position.array.slice(); m.userData.size = size;
  WORLD.flags.push(m); return m;
};
// ================= Junagadh world =================
const OZ = -500;
// palace facade painter: cream wall, two storeys of cusped arches with dark recess + jali, string courses
const palaceTex = (key, wm, hm, o = {}) => P.ctex("pal" + key, Math.round(wm * 48), Math.round(hm * 48), (g) => {
  const W = Math.round(wm * 48), Hh = Math.round(hm * 48), m = (v) => v * 48;
  g.fillStyle = o.wall ?? "#f1e2c4"; g.fillRect(0, 0, W, Hh);
  const r = P.rng(wm * 7 + hm); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(160,120,70,${0.03 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * W, r() * Hh, m(0.5 + r()), m(0.3 + r() * 0.6), 0, 0, 7); g.fill(); }
  const floors = o.floors ?? 2, bw = m(o.bay ?? 2.4);
  const n = Math.max(1, Math.floor(W / bw)), off = (W - n * bw) / 2;
  for (let fl = 0; fl < floors; fl++) {
    const y1 = Hh - m(0.5) - fl * (Hh - m(1.2)) / floors, ah = (Hh - m(1.6)) / floors * 0.78, y0 = y1 - ah;
    g.fillStyle = o.band ?? "#c98a5a"; g.fillRect(0, y1, W, m(0.22));
    for (let i = 0; i < n; i++) {
      const cx = off + (i + 0.5) * bw, aw = bw * 0.62, door = fl === 0 && (o.door ?? true) && i === Math.floor(n / 2);
      const top = y0 + aw * 0.5;
      const arch = () => { g.beginPath(); g.moveTo(cx - aw / 2, y1); g.lineTo(cx - aw / 2, top); for (let k = 0; k <= 6; k++) { const a = Math.PI + (k / 6) * Math.PI; g.quadraticCurveTo(cx + Math.cos(a - Math.PI / 12) * aw * 0.58, top + Math.sin(a - Math.PI / 12) * aw * 0.62, cx + Math.cos(a) * aw / 2, top + Math.sin(a) * aw * 0.55); } g.lineTo(cx + aw / 2, y1); g.closePath(); };
      g.fillStyle = o.trim ?? "#e3c9a0"; g.save(); g.translate(cx, y1); g.scale(1.16, 1.06); g.translate(-cx, -y1); arch(); g.fill(); g.restore();
      arch(); g.fillStyle = door ? "#5a2e1e" : "#3a2a3a"; g.fill(); g.lineWidth = m(0.06); g.strokeStyle = "#2a1a20"; g.stroke();
      if (!door) { g.save(); arch(); g.clip(); g.strokeStyle = "rgba(240,215,170,0.55)"; g.lineWidth = m(0.035); for (let k = -10; k < 10; k++) { g.beginPath(); g.moveTo(cx + k * m(0.18) - aw, y1); g.lineTo(cx + k * m(0.18) + aw, y1 - 2 * aw); g.stroke(); g.beginPath(); g.moveTo(cx + k * m(0.18) + aw, y1); g.lineTo(cx + k * m(0.18) - aw, y1 - 2 * aw); g.stroke(); } g.restore(); }
      else { g.fillStyle = "#c9962a"; for (let k = 0; k < 5; k++) for (let j = 0; j < 2; j++) { g.beginPath(); g.arc(cx + (j - 0.5) * aw * 0.4, y1 - m(0.4) - k * m(0.45), m(0.06), 0, 7); g.fill(); } }
    }
  }
  g.fillStyle = o.band ?? "#c98a5a"; g.fillRect(0, 0, W, m(0.3));
  for (let x = 0; x < W; x += m(0.6)) { g.fillStyle = o.trim ?? "#e3c9a0"; g.beginPath(); g.moveTo(x, m(0.3)); g.lineTo(x + m(0.3), m(0.62)); g.lineTo(x + m(0.6), m(0.3)); g.fill(); }
});
const marigold = (x0, y0, z0, x1, y1, z1, sag = 0.5, n = 18) => {
  const a = toon("mg0", { color: 0xf29a2a }), b = toon("mg1", { color: 0xf7c43a });
  for (let i = 0; i <= n; i++) { const t = i / n; addB(new THREE.IcosahedronGeometry(0.075, 0), i % 2 ? a : b, M4(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - sag * 4 * t * (1 - t), z0 + (z1 - z0) * t)); }
};
const dome = (x, y, z, r, mat, gold) => {
  addB(new THREE.CylinderGeometry(r * 0.92, r * 0.92, r * 0.5, 16), mat, M4(x, y + r * 0.25, z));
  addB(new THREE.SphereGeometry(r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat, M4(x, y + r * 0.5, z, 0, 0, 0, 1, 1.15, 1));
  addB(new THREE.ConeGeometry(r * 0.12, r * 0.6, 8), gold, M4(x, y + r * 1.65 + 0.3 * r, z));
  addB(new THREE.SphereGeometry(r * 0.12, 8, 6), gold, M4(x, y + r * 1.62, z));
};
const chhatri = (x, y, z, s, mat, gold) => {
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) addB(new THREE.CylinderGeometry(0.08 * s, 0.08 * s, 1.2 * s, 6), mat, M4(x + dx * 0.55 * s, y + 0.6 * s, z + dz * 0.55 * s));
  box(1.5 * s, 0.12 * s, 1.5 * s, mat, x, y + 1.2 * s, z);
  dome(x, y + 1.3 * s, z, 0.65 * s, mat, gold);
};
const flagUKPole = (x, y, z, h, size) => {
  addB(new THREE.CylinderGeometry(0.03 * size, 0.04 * size, h, 8), toon("pole", { color: 0xe8e2d4 }), M4(x, y + h / 2, z));
  const t = canvasTex(330, 220, (g) => C.flagUK(g, 0, 0, 330, 220));
  const geo = new THREE.PlaneGeometry(1.5 * size, 1.0 * size, 14, 8); geo.translate(0.75 * size, 0, 0);
  const m = mesh(geo, toonM({ map: t, side: THREE.DoubleSide }), "world", true);
  m.position.set(x + 0.04 * size, y + h - 0.5 * size, z); m.userData.base = geo.attributes.position.array.slice(); m.userData.size = size; WORLD.flags.push(m);
};
// ---- palace courtyard (origin): palace along x at z = -8, wedding mandap at x 0, kennels at x 26 ----
const palace = () => {
  const earthM = toon("earth", { map: P.soil(), color: 0xe9d9bc }); earthM.polygonOffset = true; earthM.polygonOffsetFactor = 4; earthM.polygonOffsetUnits = 8;
  planeXZ(5000, 5000, earthM, 0, -0.05, 0, 6);
  planeXZ(120, 22, toon("paving", { map: UpPaint.stoneHD("paveHD", ["#e6cfa6", "#dcc196", "#ecd8b2", "#d6b98c"]) }), 0, 0.01, 2, 2.2);
  const wall = toon("palW", { color: 0xf1e2c4 }), trim = toon("palT", { color: 0xe3c9a0 }), gold = toon("gold", { color: 0xe8c45a }), sand = toon("palS", { color: 0xd9a978 });
  // main block + wings
  for (const [x, w, h] of [[0, 24, 11], [-24, 22, 8], [24, 22, 8], [-46, 20, 7], [46, 20, 7]]) {
    box(w, h, 10, wall, x, 0, -13, 0, 3);
    planeV(w, h, toonM({ map: palaceTex("f" + x, w, h, { floors: h > 9 ? 3 : 2, door: x === 0 }) }), x, h / 2, -7.99);
    box(w + 0.4, 0.5, 0.6, trim, x, h, -8.1);
  }
  for (const x of [-11, 11]) { box(2.4, 13, 2.4, sand, x, 0, -8.6); chhatri(x, 13, -8.6, 1.4, wall, gold); }
  dome(0, 11, -12, 4.2, wall, gold);
  for (const x of [-6, 6]) chhatri(x, 11, -9.2, 1.0, wall, gold);
  for (const x of [-35, -13.5, 13.5, 35]) chhatri(x, x < 0 ? (x < -20 ? 7 : 8) : (x > 20 ? 7 : 8), -9, 0.9, wall, gold);
  for (const x of [-56, 56]) { addB(new THREE.CylinderGeometry(0.9, 1.1, 16, 12), wall, M4(x, 8, -9)); dome(x, 16, -9, 1.1, wall, gold); }
  flagPole(0, 16.8, -12, 5, 1.8);
  // garden: palms, low hedges, fountain pool
  for (let x = -50; x <= 50; x += 8) if (Math.abs(x) > 5) tree(x, -6.3, "palm", 0.9);
  for (let x = -54; x <= 54; x += 9) tree(x, 13.5, "palm", 1.0 + 0.1 * Math.sin(x));
  for (const z of [-6.8, 11.5]) box(110, 0.5, 0.6, toon("hedge", { color: 0x4f8a45 }), 0, 0, z);
  // red carpet toward the mandap + along the procession path
  planeXZ(2.4, 9, toon("carpetR", { map: P.carpet(), color: 0xd04040 }), 0, 0.03, 1.0, 2);
  planeXZ(90, 1.8, toon("carpetR"), 0, 0.025, 6.8, 2);
  // mandap (wedding canopy) at x 0, z -2.6
  const mz = -2.6, pink = toon("mandapC", { color: 0xe85a8a }), wood = toon("mandW", { color: 0xe8c45a });
  box(6.4, 0.45, 4.2, toon("stage", { color: 0xf4ece0 }), 0, 0, mz);
  box(6.6, 0.08, 4.4, toon("stageT", { map: P.carpet(), color: 0xc8362f }), 0, 0.45, mz);
  for (const [dx, dz] of [[-2.9, -1.8], [2.9, -1.8], [-2.9, 1.8], [2.9, 1.8]]) { addB(new THREE.CylinderGeometry(0.12, 0.14, 3.6, 10), wood, M4(dx, 0.45 + 1.8, mz + dz)); }
  box(6.4, 0.25, 4.2, pink, 0, 4.05, mz);
  addB(prismGeo(4.6, 1.2, 6.8, 2), pink, M4(0, 4.3, mz, Math.PI / 2));
  for (const [x0, x1] of [[-2.9, -1.0], [-1.0, 1.0], [1.0, 2.9]]) marigold(x0, 3.95, mz + 1.85, x1, 3.95, mz + 1.85, 0.45, 12);
  for (const dx of [-2.9, 2.9]) for (let i = 0; i < 3; i++) marigold(dx, 3.95, mz + 1.85, dx, 0.6 + i * 0.1, mz + 1.85 - i * 0.02, 0.0, 14);
  box(0.9, 0.28, 0.7, toon("cushion", { color: 0xd8434a }), -0.6, 0.53, mz); box(0.9, 0.28, 0.7, toon("cushion"), 0.6, 0.53, mz);
  // garden corner (x -20): low gaddi + bolsters + potted palms
  box(1.2, 0.2, 0.8, toon("cushion"), -20.6, 0, 1.25); box(1.24, 0.05, 0.84, toon("gaddiT", { color: 0xe8c45a }), -20.6, 0.2, 1.25);
  planeXZ(4, 3, toon("carpetR"), -20, 0.03, 1.6, 2);
  for (const x of [-22.6, -17.4]) { addB(new THREE.CylinderGeometry(0.3, 0.22, 0.5, 12), toon("pot", { color: 0xb8643a }), M4(x, 0.25, 0.4)); tree(x, 0.4, "palm", 0.35); }
  // musicians' & guests' carpets, lamps
  for (const x of [-5, 5]) { addB(new THREE.CylinderGeometry(0.05, 0.08, 1.6, 8), gold, M4(x, 0.8, -1.2)); addB(new THREE.SphereGeometry(0.2, 10, 8), toon("lampG", { color: 0xfff1c4 }), M4(x, 1.7, -1.2)); }
  // kennels row at x 22..36, z -4.5
  const kw = toon("kenW", { color: 0xf2e3bd }), kr = [toon("kenR0", { color: 0xc8553d }), toon("kenR1", { color: 0x3f6ab0 }), toon("kenR2", { color: 0x3f8a5a })];
  for (let i = 0; i < 9; i++) {
    const x = 21 + i * 1.9;
    box(1.3, 1.0, 1.2, kw, x, 0, -4.6);
    addB(prismGeo(1.6, 0.6, 1.4, 1), kr[i % 3], M4(x, 1.0, -4.6, Math.PI / 2));
    box(0.55, 0.65, 0.02, toon("kenDoor", { color: 0x3a2a24 }), x, 0.0, -3.99);
    const nt = canvasTex(240, 80, (g) => C.signBoard(g, 240, 80, [["MOTI", "RANI", "BOBY", "SHERU", "LALI", "RAJA", "PERI", "TIGER", "BULBUL"][i]], { bg: "#e8c45a", fg: "#241726", rim: "#7a4a2a", size: 0.5 }));
    planeV(0.6, 0.2, toonM({ map: nt }), x, 0.85, -3.98);
  }
};
// ---- durbar hall (x 0, z -500) + governor general's office (x 20) ----
const interiors = () => {
  const oz = OZ, hall = toon("hallW", { map: palaceTex("hall", 14, 6, { wall: "#f4e4c8", floors: 1, bay: 2.8, door: false, band: "#b8643a" }) });
  box(16, 0.1, 12, toon("marble", { map: tiles("#f4efe6", "#d9cfc0", 8) }), 0, -0.1, oz, 0, 3);
  box(14, 6, 0.3, toon("hallB", { color: 0xf4e4c8 }), 0, 0, oz - 5.15);
  planeV(14, 6, toonM({ map: palaceTex("hallF", 14, 6, { wall: "#f4e4c8", floors: 1, bay: 2.8, door: false, band: "#b8643a" }) }), 0, 3, oz - 4.99);
  for (const s of [-1, 1]) { box(0.3, 6, 12, toon("hallB"), s * 7, 0, oz); planeV(12, 6, toonM({ map: palaceTex("hallS", 12, 6, { wall: "#f4e4c8", floors: 1, bay: 2.8, door: false, band: "#b8643a" }) }), s * 6.84, 3, oz, -s * Math.PI / 2); }
  box(14, 0.3, 12, toon("ceilH", { color: 0xe8d4b0 }), 0, 6, oz);
  planeXZ(3, 10, toon("carpetR"), 0, 0.01, oz - 0.5, 2);
  const gold = toon("gold"), red = toon("cushion");
  box(2.2, 0.5, 1.4, gold, 0, 0, oz - 4.0); box(1.6, 1.8, 0.3, gold, 0, 0.5, oz - 4.6); box(1.5, 0.3, 1.1, red, 0, 0.5, oz - 4.0); box(1.3, 1.4, 0.1, red, 0, 0.7, oz - 4.42);
  for (const x of [-4.5, -2.4, 2.4, 4.5]) addB(new THREE.CylinderGeometry(0.22, 0.26, 6, 12), toon("palT"), M4(x, 3, oz - 3.6));
  for (const x of [-2.6, 2.6]) { addB(new THREE.CylinderGeometry(0.01, 0.01, 1.2, 4), toon("iron", { color: 0x2f3b36 }), M4(x, 5.4, oz - 1.5)); for (let i = 0; i < 8; i++) addB(new THREE.SphereGeometry(0.1, 8, 6), toon("lampG"), M4(x + 0.4 * Math.cos(i), 4.75, oz - 1.5 + 0.4 * Math.sin(i))); addB(new THREE.TorusGeometry(0.42, 0.03, 6, 20), gold, M4(x, 4.75, oz - 1.5, 0, Math.PI / 2)); }
  // GG office (x 20): dark panelling, desk, union flag, portrait
  const mx = 20, mWall = toon("ggW", { map: P.wallpaper ? P.wallpaper() : P.plaster("#d8d0bc") }), floor = toon("offF", { map: UpPaint.planksHD(), color: 0xb08060 });
  box(8, 0.1, 7, floor, mx, -0.1, oz, 0, 1.6);
  box(8, 4, 0.3, mWall, mx, 0, oz - 3.1, 0, 3); box(0.3, 4, 7, mWall, mx - 4, 0, oz, 0, 3); box(0.3, 4, 7, mWall, mx + 4, 0, oz, 0, 3);
  box(8, 0.3, 7, toon("ceil", { color: 0xf3ead6 }), mx, 4, oz);
  box(8, 1.2, 0.34, toon("wainsB", { color: 0x4a2a1a }), mx, 0, oz - 3.08);
  const dw = toon("deskW", { map: UpPaint.planksHD(), color: 0x5a321e });
  box(2.4, 0.76, 1.0, dw, mx, 0, oz - 1.6, 0, 1); box(2.5, 0.05, 1.1, toon("deskTop", { color: 0x2f5a3a }), mx, 0.76, oz - 1.6);
  box(0.7, 1.3, 0.6, toon("chairW", { color: 0x7a2f35 }), mx, 0, oz - 2.5, 0, 1);
  addB(new THREE.CylinderGeometry(0.05, 0.07, 0.24, 8), toon("inkw", { color: 0x1d1c22 }), M4(mx + 0.8, 0.93, oz - 1.7));
  flagUKPole(mx - 2.4, 0, oz - 2.6, 2.6, 0.7);
  const frm = canvasTex(300, 400, (g) => { g.fillStyle = "#c9a24a"; g.fillRect(0, 0, 300, 400); g.fillStyle = "#3a3a4a"; g.fillRect(24, 24, 252, 352); g.fillStyle = "#e9c3a3"; g.beginPath(); g.ellipse(150, 160, 60, 70, 0, 0, 7); g.fill(); g.fillStyle = "#c8362f"; g.fillRect(70, 240, 160, 136); g.fillStyle = "#e8c45a"; g.fillRect(100, 70, 100, 40); });
  planeV(1.0, 1.33, toonM({ map: frm }), mx + 1.6, 2.4, oz - 2.92);
  box(1.4, 1.6, 0.1, new THREE.MeshBasicMaterial({ color: 0xfff3d2 }), mx - 0.6, 1.5, oz - 2.95);
};
// ---- railway station (z 1500) ----
const RZ = 1500;
const station = () => {
  planeXZ(300, 60, toon("gravel", { map: P.soil(), color: 0xc9b08a }), 0, 0.02, RZ, 4);
  const plat = toon("plat", { map: UpPaint.stoneHD() });
  box(80, 0.9, 6, plat, 0, 0, RZ - 4, 0, 1.6);
  box(80, 0.06, 0.4, toon("platEdge", { color: 0xf4e3a0 }), 0, 0.9, RZ - 6.8);
  const rail = toon("rail", { color: 0x6a6a72 }), sleeper = toon("sleeper", { color: 0x6b4429 });
  for (const z of [RZ - 9.33, RZ - 7.87]) box(200, 0.14, 0.1, rail, 0, 0.12, z);
  for (let x = -100; x <= 100; x += 0.7) box(0.25, 0.1, 2.6, sleeper, x, 0.02, RZ - 8.6);
  // canopy
  const iron = toon("iron", { color: 0x2f3b36 });
  for (let x = -24; x <= 24; x += 6) addB(new THREE.CylinderGeometry(0.1, 0.12, 4.2, 8), iron, M4(x, 0.9 + 2.1, RZ - 2.4));
  addB(tboxGeo(52, 0.15, 5.6, 2), toon("canopy", { map: UpPaint.roofHD("#b5523b") }), M4(0, 5.2, RZ - 4.2, 0, -0.08));
  // station building
  box(30, 6, 4, toon("stW", { color: 0xf1e2c4 }), 0, 0, RZ - 15);
  planeV(30, 6, toonM({ map: palaceTex("st", 30, 6, { floors: 1, bay: 2.6, door: true, band: "#a8543a" }) }), 0, 3, RZ - 12.99);
  sign(5, 0.9, ["JUNAGADH"], { bg: "#f4ecd6", fg: "#7a2f35", rim: "#7a2f35", size: 0.5 }, 0, 4.4, RZ - 2.6);
  // locomotive + carriages (stopped on the near track, facing +x)
  const blk = toon("loco", { color: 0x2a2d33 }), red = toon("locoR", { color: 0xb8362f }), brass = toon("brass", { color: 0xc9a24a });
  const lx = 9, tz = RZ - 8.6;
  addB(new THREE.CylinderGeometry(1.0, 1.0, 6, 18), blk, M4(lx, 2.0, tz, 0, 0, Math.PI / 2));
  addB(new THREE.CylinderGeometry(1.02, 1.02, 0.15, 18), brass, M4(lx + 1, 2.0, tz, 0, 0, Math.PI / 2));
  addB(new THREE.CylinderGeometry(0.32, 0.25, 1.4, 12), blk, M4(lx + 2.2, 3.4, tz));
  addB(new THREE.SphereGeometry(0.45, 12, 8), brass, M4(lx + 0.3, 3.0, tz));
  box(2.4, 2.9, 2.6, red, lx - 4.0, 0.9, tz); box(2.7, 0.2, 2.9, blk, lx - 4.0, 3.8, tz);
  box(8.6, 0.5, 2.4, red, lx - 1.2, 0.5, tz);
  for (const x of [lx - 2.4, lx - 0.6, lx + 1.2]) for (const s of [-1, 1]) addB(new THREE.CylinderGeometry(0.62, 0.62, 0.12, 16), red, M4(x, 0.72, tz + s * 1.15, 0, Math.PI / 2));
  addB(new THREE.ConeGeometry(0.9, 1.0, 4), red, M4(lx + 3.4, 0.6, tz, Math.PI / 4, 0, -Math.PI / 2, 1, 1, 0.6));
  const car = toon("car", { color: 0x7a2f35 }), carT = toon("carT", { color: 0xe8d6ac });
  for (const cx of [lx - 12, lx - 22.5]) { box(10, 2.8, 2.8, car, cx, 0.8, tz, 0, 1); box(10.2, 0.25, 3.0, carT, cx, 3.6, tz); for (let i = -4; i <= 4; i++) box(0.7, 0.8, 0.02, new THREE.MeshBasicMaterial({ color: 0xfff1cc }), cx + i * 1.05, 2.0, tz + 1.41); for (const x of [cx - 3.5, cx + 3.5]) for (const s of [-1, 1]) addB(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 14), blk, M4(x, 0.55, tz + s * 1.15, 0, Math.PI / 2)); }
  for (const x of [-18, -6, 20]) { addB(new THREE.CylinderGeometry(0.06, 0.09, 3.4, 6), iron, M4(x, 0.9 + 1.7, RZ - 1.6)); box(0.4, 0.5, 0.4, toon("lampG"), x, 4.2, RZ - 1.6); }
  for (const x of [-30, -16, 24, 34]) tree(x, RZ - 20, "round", 1.2);
};
// ---- airfield (z 3000) + the Dakota (dynamic group) ----
const AZ = 3000;
const airfield = () => {
  planeXZ(600, 300, toon("grassA", { map: UpPaint.grassHD(), color: 0xb9d88a }), 0, 0.02, AZ, 6);
  planeXZ(400, 16, toon("tarmac", { map: UpPaint.stoneHD("tarHD", ["#8a8a86", "#7e7e7a", "#94948e", "#86847e"]) }), 60, 0.04, AZ + 4, 3);
  for (let x = -120; x < 240; x += 8) box(4, 0.01, 0.3, toon("lane", { color: 0xf4f1e4 }), x, 0.05, AZ + 4);
  planeXZ(30, 20, toon("tarmac"), -6, 0.035, AZ - 8, 3);
  // terminal + hangar
  box(14, 4.2, 6, toon("termW", { color: 0xf1e2c4 }), -14, 0, AZ - 18, 0, 3);
  planeV(14, 4.2, toonM({ map: palaceTex("term", 14, 4.2, { floors: 1, bay: 2.4, door: true, band: "#a8543a" }) }), -14, 2.1, AZ - 14.99);
  box(3, 2.4, 3, toon("termW"), -14, 4.2, AZ - 18); box(3.4, 0.3, 3.4, toon("palS", { color: 0xd9a978 }), -14, 6.6, AZ - 18);
  addB(new THREE.CylinderGeometry(9, 9, 22, 20, 1, false, 0, Math.PI), toon("hangar", { color: 0x9aa2ad }), M4(16, 0, AZ - 26, 0, 0, Math.PI / 2, 1, 1, 0.8));
  box(22, 0.2, 18, toon("hangarF", { color: 0x6a6a72 }), 16, 0, AZ - 26);
  addB(new THREE.CylinderGeometry(0.05, 0.06, 5, 6), toon("iron"), M4(4, 2.5, AZ - 12));
  addB(new THREE.ConeGeometry(0.4, 1.8, 10, 1, true), toon("sock", { color: 0xf29a2a, side: THREE.DoubleSide }), M4(4.9, 4.8, AZ - 12, 0, 0, Math.PI / 2));
  for (let x = -60; x <= 60; x += 11) tree(x, AZ - 40 - 6 * Math.sin(x), "round", 1.2);
  // the plane: built as a group, moved by worldAt(f).plane
  const pl = new THREE.Group(); WORLD.plane = pl;
  const al = toon("alu", { color: 0xcfd6de }), dark = toon("aluD", { color: 0x8a96a4 }), blk = toon("tyre", { color: 0x26262c }), stripe = toon("stripe", { color: 0x2f6b48 });
  const add = (geo, mat, m4) => { const m = new THREE.Mesh(geo, mat); m.applyMatrix4(m4); m.castShadow = m.receiveShadow = true; m.userData.kind = "world"; pl.add(m); return m; };
  const body = new THREE.Group(); body.position.set(0, 2.1, 0); pl.add(body); WORLD.planeBody = body;
  const addb = (geo, mat, m4) => { const m = new THREE.Mesh(geo, mat); m.applyMatrix4(m4); m.castShadow = m.receiveShadow = true; m.userData.kind = "world"; body.add(m); return m; };
  addb(new THREE.CylinderGeometry(1.2, 1.2, 10, 20), al, M4(0, 0, 0, 0, 0, Math.PI / 2));
  addb(new THREE.SphereGeometry(1.2, 20, 12), al, M4(5, 0, 0, 0, 0, 0, 1.6, 1, 1));
  addb(new THREE.CylinderGeometry(1.2, 0.35, 6, 20), al, M4(-8, 0.35, 0, 0, 0, Math.PI / 2 + 0.06));
  addb(new THREE.CylinderGeometry(1.21, 1.21, 10, 20, 1, true), stripe, M4(0, 0, 0, 0, 0, Math.PI / 2, 1, 0.12, 1.0)).position.y = -0.12;
  addb(tboxGeo(3.2, 0.25, 22, 1), al, M4(1.0, -0.65, 0));
  addb(tboxGeo(1.8, 2.6, 0.18, 1), al, M4(-10.2, 1.5, 0, 0, 0, -0.35));
  addb(tboxGeo(1.6, 0.16, 7, 1), al, M4(-10.3, 0.5, 0));
  for (const s of [-1, 1]) {
    addb(new THREE.CylinderGeometry(0.62, 0.55, 2.6, 16), dark, M4(2.1, -0.45, s * 4.3, 0, 0, Math.PI / 2));
    addb(new THREE.SphereGeometry(0.22, 8, 6), blk, M4(3.45, -0.45, s * 4.3));
    const prop = new THREE.Group(); prop.position.set(3.5, -0.45, s * 4.3); body.add(prop); (WORLD.props ??= []).push(prop);
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.7, 0.18), blk); b.position.y = 0.85; const h = new THREE.Group(); h.rotation.x = (i * Math.PI * 2) / 3; h.add(b); b.userData.kind = "world"; prop.add(h); }
  }
  // windows (left side, facing -z? camera side is +z) + door at rear
  const win = new THREE.MeshBasicMaterial({ color: 0x2a3a4a });
  for (let i = 0; i < 7; i++) addb(new THREE.CircleGeometry(0.28, 14), win, M4(3.2 - i * 1.15, 0.35, 1.2 + 0.01));
  addb(new THREE.PlaneGeometry(1.0, 1.9), toon("door", { color: 0x3a3f4a }), M4(-4.6, -0.1, 1.21));
  addb(new THREE.PlaneGeometry(0.9, 0.5), new THREE.MeshBasicMaterial({ color: 0x223040 }), M4(5.7, 0.55, 0.98, 0.7, -0.3));
  // landing gear: two mains under engines + tail wheel (on the root group so they stay on the ground)
  for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6), dark, M4(2.4, 1.0, s * 4.3)); add(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 16), blk, M4(2.4, 0.5, s * 4.3, 0, Math.PI / 2)); }
  add(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 10), blk, M4(-10, 0.2, 0, 0, Math.PI / 2));
  pl.position.set(0, 0, AZ); scene.add(pl);
  // boarding stairs at the door (static, removed when the plane moves)
  const stairs = new THREE.Group(); WORLD.stairs = stairs;
  const sm = toon("stairs", { color: 0xe8e2d4 });
  for (let i = 0; i < 6; i++) { const st = new THREE.Mesh(tboxGeo(1.0, 0.08, 0.38, 1), sm); st.position.set(-4.6, 0.18 * (i + 1) - 0.04, AZ + 1.42 + (5 - i) * 0.32); st.castShadow = st.receiveShadow = true; st.userData.kind = "world"; stairs.add(st); }
  for (const s of [-1, 1]) { const r = new THREE.Mesh(tboxGeo(0.06, 0.06, 2.4, 1), toon("iron")); r.position.set(-4.6 + s * 0.5, 1.15, AZ + 2.25); r.rotation.x = -0.5; r.userData.kind = "world"; stairs.add(r); }
  scene.add(stairs);
};

const buildWorld = () => {
  WORLD.flags = []; WORLD.leafGeos = [];
  palace(); interiors(); station(); airfield();
  flush();
  const lg = mergeGeometries(WORLD.leafGeos, false);
  WORLD.leaf = mesh(lg, toonM({ color: 0x5aa548 }), "world", true);
};

// ---------- sky + clouds ----------
const skyU = { top: { value: new THREE.Color("#4ea8e6") }, hor: { value: new THREE.Color("#cfe9f5") } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(2200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
  fragmentShader: "uniform vec3 top, hor; varying vec3 vP; void main(){ float h = clamp(normalize(vP).y*2.2, 0., 1.); gl_FragColor = vec4(mix(hor, top, pow(h, 0.7)), 1.); }",
}));
sky.userData.kind = "sky"; sky.renderOrder = -10; scene.add(sky);
const clouds = [];
const makeClouds = () => {
  const r = P.rng(5);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + r() * 0.3, d = 700 + r() * 300;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), new THREE.MeshBasicMaterial({ map: UpPaint.cloudHD(i % 6), transparent: true, depthWrite: false, fog: false }));
    const s = 140 + r() * 120; m.scale.set(s, s, 1); m.position.set(Math.cos(a) * d, 90 + r() * 120, Math.sin(a) * d);
    m.userData.kind = "soft"; m.userData.cloud = true; scene.add(m); clouds.push(m);
  }
};

// ---------- lights ----------
const sun = new THREE.DirectionalLight(0xffffff, 1); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
scene.add(sun); scene.add(sun.target);
const hemi = new THREE.HemisphereLight(0xffffff, 0x666666, 0.5); scene.add(hemi);
const applyLight = (L, focus, span) => {
  sun.color.set(L.sun); sun.intensity = L.sunI; hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemiI;
  const az = (L.az * Math.PI) / 180, el = (L.el * Math.PI) / 180;
  const d = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
  sun.target.position.set(...focus); sun.position.copy(sun.target.position).addScaledVector(d, 120);
  const sc = sun.shadow.camera; sc.left = sc.bottom = -span; sc.right = sc.top = span; sc.near = 1; sc.far = 260; sc.updateProjectionMatrix();
  sun.castShadow = L.shadow !== false;
  CARDU.uSunDir.value.copy(d);
  const r = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0); r.y = 0; r.normalize();
  const dh = new THREE.Vector3(d.x, 0, d.z).normalize();
  CARDU.uLightX.value = L.shadow === false ? 0.5 : r.dot(dh);
  CARDU.uShadowK.value = L.cardShadow ?? 0.64;
  const T = UpShade.TONE;
  T.uLitCol.value.set(...L.tLit); T.uShadeCol.value.set(...L.tShade); T.uShadeLift.value.set(...L.tLift);
  T.uLambert.value = L.tLambert; T.uSideK.value = L.tSideK; T.uTerm.value = L.tTerm; T.uBounce.value.set(...L.tBounce); T.uSat.value = L.tSat;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); scene.fog.color.set(L.skyHor); scene.fog.near = L.fogN ?? 140; scene.fog.far = L.fogF ?? 1100;
  for (const c of clouds) c.material.color.set(L.cloud ?? "#ffffff");
};

// ---------- cards ----------
const SU = 0.00225; // metres per design unit
const cards = new Map();
const blobMat = new THREE.MeshBasicMaterial({ map: P.blobTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
const cardND = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map }, far: { value: FAR } }, side: THREE.DoubleSide,
  vertexShader: "varying vec2 vUv; varying float vZ; void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.); vZ = -mv.z; gl_Position = projectionMatrix*mv; }",
  fragmentShader: "uniform sampler2D map; uniform float far; varying vec2 vUv; varying float vZ; void main(){ if (texture2D(map, vUv).a < 0.5) discard; gl_FragColor = vec4(0.,0.,0., vZ/far); }",
});
const DRAW = {
  person: (g, s) => { g.translate(150, 0); C.person(g, s.outfit, s.opts); },
  personSide: (g, s) => { g.translate(150, 0); UP.bodySide(new UP.Pen(g), s.outfit, s.opts); },
  rat: (g, s) => C.rat(g, s.opts), coin: (g, s) => C.coin(g, s.t), tails: (g, s) => C.tails(g, s.h ?? 1, s.seed ?? 4), basket: (g, s) => C.basket(g, s.fill ?? 0),
  poster: (g, s) => C.poster(g, s.opts), heart: (g, s) => C.fxHeart(g, s.t), bang2: (g, s) => C.fxBang2(g, s.t),
  pig: (g, s) => C.pig(g, s.opts),
  dog: (g, s) => C.dog(g, s.opts), palanquin: (g, s) => C.palanquin(g, s.opts), bag: (g, s) => C.moneyBag(g, s.opts?.label), rp: (g, s) => C.fxDollar(g, s.t),
  cabin: (g, s) => C.cabinWin(g, s.opts.slots, s.opts), label: (g, s) => C.label(g, s.opts.text, s.opts.col),
  note: (g, s) => C.banknote(g, s.opts.part, s.opts.val), scissors: (g, s) => C.scissors(g, s.opts.k), calendar: (g, s) => C.calendar(g, s.opts.year),
  price: (g, s) => C.priceBoard(g, s.opts.price, s.opts.up), safe: (g, s) => C.safeBox(g, s.opts.open), moth: (g, s) => C.moth(g, s.t), banana: (g, s) => C.banana(g, s.opts.n),
  sewing: (g, s) => C.sewing(g, s.opts.half), stamp: (g, s) => C.stamp(g, s.opts.text, s.opts.t), q: (g, s) => C.fxQ(g, s.t),
  plate: (g, s) => C.signBoard(g, 600, 160, [s.opts.text], { bg: "#2a2420", fg: "#e8c45a", rim: "#e8c45a", size: 0.5 }),
  potato: (g, s) => C.potato(g, s.bite ?? 0),
  grave: (g) => C.grave(g),
  flowers: (g, s) => C.flowers(g, s.col, s.seed),
  bang: (g, s) => C.fxBang(g, s.t), puff: (g, s) => C.fxPuff(g, s.t), smoke: (g, s) => C.fxSmoke(g, s.t), bird: (g, s) => C.fxBird(g, s.t),
  z: (g, s) => C.fxZ(g, s.t), leaf: (g, s) => C.fxLeaf(g, s.col), snow: (g) => C.fxSnow(g), spark: (g, s) => C.fxSpark(g, s.t), thud: (g, s) => C.fxThud(g, s.t),
};
const SIZE = { dog: [600, 420, 405], palanquin: [900, 600, 470], bag: [300, 340, 330], rp: [240, 200, 100], cabin: [1500, 560, 280], label: [700, 220, 110], note: [600, 300, 150], scissors: [700, 300, 150], calendar: [360, 460, 450], price: [520, 420, 410], safe: [420, 520, 510], moth: [140, 120, 60], banana: [300, 200, 190], sewing: [560, 440, 425], stamp: [1000, 360, 180], q: [220, 220, 210], plate: [600, 160, 150], rat: [600, 420, 405], coin: [120, 120, 60], tails: [600, 700, 690], basket: [300, 260, 250], poster: [600, 820, 810], heart: [160, 160, 80], bang2: [120, 200, 190], person: [900, 1000, 975], personSide: [900, 1000, 975], pig: [600, 420, 405], potato: [200, 160, 150], grave: [360, 520, 505], flowers: [200, 200, 190], bang: [500, 500, 250], puff: [300, 300, 190], smoke: [400, 300, 160], bird: [160, 100, 50], z: [200, 200, 100], leaf: [80, 80, 40], snow: [64, 64, 32], spark: [200, 200, 100], thud: [500, 300, 220] };
const CARDU = { uLightX: { value: 0 }, uShadowK: { value: 0.64 }, uSide: { value: 0.14 }, uFoot: { value: 0.88 }, uSunDir: { value: new THREE.Vector3(0, 1, 0) } };
/** card material: flat paint x tint, darkened by the sun's shadow map, a soft far-side falloff and a little foot shade */
const cardMat = (tex) => {
  const m = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, CARDU);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform vec3 uSunDir;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\n#ifdef USE_SHADOWMAP\n  worldPosition.xyz += uSunDir * 0.35;\n#endif");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform float uLightX, uShadowK, uSide, uFoot;")
      .replace("#include <shadowmap_pars_fragment>", "#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>")
      .replace("#include <opaque_fragment>", `float smk = getShadowMask();
  float ux = uLightX >= 0.0 ? vMapUv.x : 1.0 - vMapUv.x;
  float side = 1.0 - uSide * abs(uLightX) * (1.0 - smoothstep(0.2, 0.9, ux));
  float foot = mix(uFoot, 1.0, smoothstep(0.0, 0.3, vMapUv.y));
  outgoingLight = diffuseColor.rgb * mix(uShadowK, 1.0, smk) * side * foot;
#include <opaque_fragment>`);
  };
  return m;
};
const getCard = (id, type, soft) => {
  let c = cards.get(id);
  if (c && c.type === type) return c;
  const [dw, dh, ay] = SIZE[type];
  const cv = document.createElement("canvas"); cv.width = 4; cv.height = 4;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.minFilter = THREE.LinearMipmapLinearFilter;
  const geo = new THREE.PlaneGeometry(dw * SU, dh * SU); geo.translate(0, (ay - dh / 2) * SU, 0);
  // origin at the anchor point: plane centre sits (dh/2 - ay) units above... shift so anchor is at y=0
  geo.translate(0, 0, 0);
  const mat = soft ? new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.02, transparent: true, depthWrite: false, side: THREE.DoubleSide }) : cardMat(tex);
  const m = new THREE.Mesh(geo, mat); m.userData.kind = soft ? "soft" : "card"; m.userData.nd = cardND(tex);
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  scene.add(m);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), blobMat); blob.userData.kind = "blob"; scene.add(blob);
  c = { id, type, cv, tex, mesh: m, blob, key: "", dw, dh, ay, k: 0 };
  cards.set(id, c); return c;
};
const qk = (k) => [0.5, 0.75, 1, 1.5, 2, 2.5, 3].find((v) => v >= k) ?? 3;
const updateCards = (specs, tint) => {
  const seen = new Set();
  for (const s of specs) {
    const c = getCard(s.id, s.type, s.soft); seen.add(s.id);
    const sc = s.scale ?? 1;
    const y = s.y ?? ground(s.x, s.z);
    c.mesh.visible = true; c.mesh.position.set(s.x, y, s.z); c.mesh.scale.set(sc, sc, sc);
    // yaw: face the camera unless fixed
    c.mesh.rotation.set(0, s.yaw ?? Math.atan2(camera.position.x - s.x, camera.position.z - s.z), s.roll ?? 0);
    // resolution from screen size
    const d = Math.max(0.5, camera.position.distanceTo(c.mesh.position));
    const px = (c.dh * SU * sc) / (2 * d * Math.tan((camera.fov * Math.PI) / 360)) * H;
    const k = qk(Math.max(0.35, (1.3 * px) / c.dh) * (s.res ?? 1));
    const key = JSON.stringify([s.type, s.outfit ?? 0, s.opts ?? 0, s.t ?? 0, s.bite ?? 0, s.facing ?? 1, k, s.col ?? 0, s.h ?? 0, s.fill ?? 0]);
    if (key !== c.key) {
      c.key = key;
      const w = Math.round(c.dw * k), h = Math.round(c.dh * k);
      if (c.cv.width !== w || c.cv.height !== h) { c.cv.width = w; c.cv.height = h; c.tex.dispose(); }
      const g = c.cv.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h);
      if (s.facing === -1) g.setTransform(-k, 0, 0, k, w, 0); else g.setTransform(k, 0, 0, k, 0, 0);
      DRAW[s.type](g, s);
      c.tex.needsUpdate = true;
    }
    c.mesh.material.color.set(s.glow ? "#ffffff" : tint);
    c.mesh.material.opacity = s.alpha ?? 1;
    if (s.soft) { const zw = !!s.zwrite && (s.alpha ?? 1) > 0.5; if (c.mesh.material.depthWrite !== zw) c.mesh.material.depthWrite = zw; c.mesh.material.alphaTest = s.zwrite ? 0.5 : 0.02; }
    c.mesh.castShadow = s.shadow !== false && !s.soft; c.mesh.receiveShadow = !s.soft;
    c.blob.visible = s.blob !== false && !s.soft && s.y === undefined;
    if (c.blob.visible) { const bw = (s.blobW ?? (s.type === "pig" || s.type === "dog" ? 1.0 : 0.75)) * sc; c.blob.scale.set(bw, 1, bw * 0.55); c.blob.position.set(s.x, ground(s.x, s.z) + 0.02, s.z); c.blob.rotation.y = c.mesh.rotation.y; }
  }
  for (const [id, c] of cards) if (!seen.has(id)) { c.mesh.visible = false; c.blob.visible = false; }
};
// fix card geometry anchor: translate after creation so the anchor (ay) sits at the origin
const _gc = getCard;

// ---------- post ----------
const rtCol = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const rtND = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const rtPost = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const ndMat = new THREE.ShaderMaterial({
  uniforms: { far: { value: FAR } }, side: THREE.DoubleSide,
  vertexShader: `#include <common>
varying vec3 vN; varying float vZ;
void main(){
#include <beginnormal_vertex>
#include <defaultnormal_vertex>
#include <begin_vertex>
#include <project_vertex>
vN = normalize(transformedNormal); vZ = -mvPosition.z; }`,
  fragmentShader: "uniform float far; varying vec3 vN; varying float vZ; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*0.5+0.5, vZ/far); }",
});
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quad = (frag, uniforms) => { const m = new THREE.ShaderMaterial({ uniforms, vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }", fragmentShader: frag, depthTest: false, depthWrite: false }); const s = new THREE.Scene(); s.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m)); return { scene: s, u: uniforms }; };
const inkQ = quad(`uniform sampler2D tCol, tND; uniform vec2 px; uniform float far, inkR, flash, sat, vig, contrast; uniform vec3 inkCol, gain, lift, shTint, hiTint;
varying vec2 vUv;
float isCard(vec4 nd){ return step(nd.r+nd.g+nd.b, 0.02) * step(nd.a, 0.999); }
void main(){
  vec4 c = texture2D(tCol, vUv); vec4 n0 = texture2D(tND, vUv); float d0 = n0.a*far; float ink = 0.;
  if (isCard(n0) < 0.5 && n0.a < 0.999) {
    vec3 N0 = n0.rgb*2.-1.;
    for (int i=0;i<8;i++){
      float a = float(i)*0.785398; vec2 o = vec2(cos(a), sin(a))*px*inkR;
      vec4 nn = texture2D(tND, vUv+o); if (isCard(nn) > 0.5) continue;
      float dn = nn.a*far, th = 0.03*d0 + 0.05;
      if (dn - d0 > th) ink = 1.;
      else if (nn.a < 0.999 && abs(dn-d0) < th*2. && dot(N0, nn.rgb*2.-1.) < 0.72) ink = max(ink, 0.8);
    }
    ink *= 1. - smoothstep(70., 220., d0);
  }
  vec3 col = mix(c.rgb, inkCol, ink);
  float l = dot(col, vec3(0.2126,0.7152,0.0722)); col = mix(vec3(l), col, sat);
  col = col*gain + lift;
  vec3 dd = pow(max(col, 0.), vec3(1./2.2));
  dd = mix(dd, dd*dd*(3.-2.*dd), contrast);
  float ld = dot(dd, vec3(0.2126,0.7152,0.0722));
  dd += shTint*(1.-ld)*(1.-ld) + hiTint*ld*ld;
  col = pow(max(dd, 0.), vec3(2.2));
  vec2 q = (vUv-0.5)*vec2(1.,0.62); col *= 1. - vig*dot(q,q)*2.6;
  col = mix(col, vec3(1.), flash);
  gl_FragColor = vec4(col, 1.);
}`, { tCol: { value: rtCol.texture }, tND: { value: rtND.texture }, px: { value: new THREE.Vector2(1 / W, 1 / H) }, far: { value: FAR }, inkR: { value: 2.5 }, flash: { value: 0 }, sat: { value: 1.1 }, vig: { value: 0.22 }, inkCol: { value: new THREE.Color("#241726").convertSRGBToLinear() }, gain: { value: new THREE.Vector3(1, 1, 1) }, lift: { value: new THREE.Vector3(0, 0, 0) }, contrast: { value: 0.2 }, shTint: { value: new THREE.Vector3() }, hiTint: { value: new THREE.Vector3() } });
const dofQ = quad(`uniform sampler2D tIn, tND; uniform vec2 px; uniform float far, focus, cInf;
varying vec2 vUv;
float coc(float d){ return clamp(cInf * abs(1. - focus/max(d,0.01)), 0., cInf); }
void main(){
  vec4 n0 = texture2D(tND, vUv); float d0 = n0.a*far, c0 = coc(d0);
  vec3 acc = texture2D(tIn, vUv).rgb; float w = 1.;
  if (cInf > 0.5) for (int i=0;i<40;i++){
    float fi = float(i)+0.5, r = sqrt(fi/40.)*cInf, a = fi*2.39996;
    vec2 o = vec2(cos(a), sin(a))*r*px;
    float ds = texture2D(tND, vUv+o).a*far, cs = coc(ds);
    float wt = ds < d0 - 0.05 ? step(r, cs + 0.5) : step(r, min(cs, c0) + 0.5);
    acc += texture2D(tIn, vUv+o).rgb*wt; w += wt;
  }
  gl_FragColor = vec4(acc/w, 1.);
  #include <colorspace_fragment>
}`, { tIn: { value: rtPost.texture }, tND: { value: rtND.texture }, px: { value: new THREE.Vector2(1 / W, 1 / H) }, far: { value: FAR }, focus: { value: 10 }, cInf: { value: 0 } });

const swapND = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const k = o.userData.kind;
    if (on) {
      o.userData._m = o.material; o.userData._v = o.visible;
      if (k === "card") o.material = o.userData.nd;
      else if (k === "sky" || k === "soft" || k === "blob") o.visible = false;
      else o.material = ndMat;
    } else { o.material = o.userData._m; o.visible = o.userData._v; }
  });
};

// ---------- upstream post chain (mromidev/claude-animated-shorts, MIT): world ink -> lens blur pre + main -> grade + flash ----------
const composer = new PP.EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType, multisampling: 4 });
const inkUp = new UpInk.InkPass(scene, camera);
const lensUp = new UpLens.LensBlur({ maxCoC: 24, nearScale: 1.2 });
const gradeUp = new UpGrade.GradeEffect(UpGrade.GRADES.day, 1);
class FlashEffect extends PP.Effect {
  constructor() { super("FlashEffect", "uniform float flash; void mainImage(const in vec4 c, const in vec2 uv, out vec4 o) { o = vec4(mix(c.rgb, vec3(1.0), flash), c.a); }", { uniforms: new Map([["flash", new THREE.Uniform(0)]]) }); }
}
const flashUp = new FlashEffect();
composer.addPass(new PP.RenderPass(scene, camera));
composer.addPass(inkUp);
composer.addPass(new PP.EffectPass(camera, lensUp.pre));
composer.addPass(new PP.EffectPass(camera, lensUp.main));
composer.addPass(new PP.EffectPass(camera, gradeUp, flashUp));
composer.setSize(W, H);
sun.shadow.camera.layers.enable(UpInk.NOINK); // cards live on the NOINK layer but still cast shadows
const GMAP = { day: "day", golden: "golden", dusk: "golden", night: "day", hall: "golden", room: "golden", sewer: "day", cycle: "day" };
const noInkLayers = () => scene.traverse((o) => { if (o.isMesh && ["card", "soft", "blob", "sky"].includes(o.userData.kind)) o.layers.set(UpInk.NOINK); });
window.GRADE_AMT = 0.5; // upstream presets were fitted to a darker world; half strength keeps our colours alive
const fwdV = new THREE.Vector3();

// ---------- per-frame ----------
const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const waveFlags = (f) => {
  for (const m of WORLD.flags) {
    const p = m.geometry.attributes.position, b = m.userData.base, s = m.userData.size;
    for (let i = 0; i < p.count; i++) {
      const x = b[i * 3], y = b[i * 3 + 1], u = Math.abs(x) / (1.5 * s);
      p.setZ(i, s * 0.09 * u * Math.sin(u * 7 - f * 0.32 + y * 0.6) + s * 0.03 * u * Math.sin(f * 0.17 + u * 3));
      p.setY(i, y - s * 0.04 * u * u);
    }
    p.needsUpdate = true; m.geometry.computeVertexNormals();
  }
};
let built = false;
window.renderFrame = (f, dbg = "") => {
  if (!built) { buildWorld(); makeClouds(); built = true; }
  const cam = S.camAt(f);
  camera.position.copy(v3(cam.pos)); camera.fov = cam.fov; camera.up.set(0, 1, 0); camera.lookAt(v3(cam.look));
  if (cam.roll) camera.rotateZ((cam.roll * Math.PI) / 180);
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const L = S.lightAt(f), sh = S.shadowAt(f);
  applyLight(L, sh.focus, sh.span);
  sky.position.copy(camera.position);
  for (const c of clouds) { if (!c.userData.base) c.userData.base = c.position.clone(); c.position.set(c.userData.base.x + camera.position.x, c.userData.base.y, c.userData.base.z + camera.position.z); c.lookAt(camera.position); }
  // world state
  const st = S.worldAt(f);
  waveFlags(f);
  const pl = st.plane ?? { x: 0, y: 0, pitch: 0, spin: 0 };
  WORLD.plane.position.set(pl.x, pl.y, AZ); WORLD.plane.rotation.z = 0; WORLD.planeBody.rotation.z = pl.pitch;
  for (const pr of WORLD.props) pr.rotation.x = pl.spin;
  WORLD.stairs.visible = pl.stairs !== false;
  updateCards(S.cardsAt(f, camera.position), L.cardTint);
  // grade
  inkQ.u.flash.value = S.flashAt(f); inkQ.u.sat.value = L.sat ?? 1.08; inkQ.u.contrast.value = L.contrast ?? 0.2; inkQ.u.shTint.value.set(...(L.shTint ?? [0, 0, 0])); inkQ.u.hiTint.value.set(...(L.hiTint ?? [0, 0, 0]));
  inkQ.u.gain.value.set(...(L.gain ?? [1, 1, 1])); inkQ.u.lift.value.set(...(L.lift ?? [0, 0, 0]));
  const dof = S.dofAt(f); dofQ.u.focus.value = dof.focus; dofQ.u.cInf.value = dof.cInf;
  if (dbg !== "old") {
    noInkLayers();
    const sid = S.shotAt(f), gl = GMAP[sid.light] ?? "day";
    if (gradeUp._light !== gl) { gradeUp.set(UpGrade.GRADES[gl]); gradeUp._light = gl; }
    gradeUp.amount = dbg.startsWith("amt=") ? parseFloat(dbg.slice(4)) : (window.GRADE_AMT ?? 1);
    flashUp.uniforms.get("flash").value = S.flashAt(f);
    lensUp.focus = Math.max(0.3, dof.focus); lensUp.cInf = dof.cInf;
    composer.render();
    return renderer.domElement.toDataURL("image/jpeg", 0.93);
  }
  // passes (old in-house chain, kept for A/B: DBG=old)
  renderer.autoClear = true;
  renderer.setRenderTarget(rtCol); renderer.setClearColor(0x000000, 1); renderer.render(scene, camera);
  swapND(true); const fog = scene.fog; scene.fog = null; const shOn = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false;
  renderer.setRenderTarget(rtND); renderer.setClearColor(new THREE.Color(0.5, 0.5, 1.0), 1.0); renderer.clear(); renderer.render(scene, camera);
  swapND(false); scene.fog = fog; renderer.shadowMap.enabled = shOn;
  if (dbg === "col") { dofQ.u.tIn.value = rtCol.texture; dofQ.u.cInf.value = 0; } else if (dbg === "nd") { dofQ.u.tIn.value = rtND.texture; dofQ.u.cInf.value = 0; } else dofQ.u.tIn.value = rtPost.texture;
  renderer.setRenderTarget(rtPost); renderer.render(inkQ.scene, quadCam);
  renderer.setRenderTarget(null); renderer.render(dofQ.scene, quadCam);
  return renderer.domElement.toDataURL("image/jpeg", 0.93);
};
window.ready = true;
