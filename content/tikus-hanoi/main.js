// Engine + world for "Tikus Hanoi". Pure function of the frame: window.renderFrame(f) -> JPEG data URL.
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
const SEW = -60; // sewer floor level (underground set)
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
  const t = canvasTex(330, 220, (g) => C.flagFR(g, 0, 0, 330, 220));
  const geo = new THREE.PlaneGeometry(1.5 * size, 1.0 * size, 14, 8); geo.translate(0.75 * size, 0, 0);
  const m = mesh(geo, toonM({ map: t, side: THREE.DoubleSide }), "world", true);
  m.position.set(x + 0.07 * size, y + h - 0.5 * size, z); m.userData.base = geo.attributes.position.array.slice(); m.userData.size = size;
  WORLD.flags.push(m); return m;
};
// ---- street (origin), runs along x; colonial row on the north side (front faces at z = -6) ----
const ROW = [[-46, 10, 8, "#e9b44c"], [-35, 10, 9, "#f0c95a"], [-23.5, 11, 7.5, "#e8bf63"], [-11, 12, 8.5, "#f2cf6e"], [0, 12, 10, "#f4e2ad"], [12, 11, 8, "#efc35a"], [24, 11, 9, "#e9b44c"], [35.5, 10, 7.5, "#f2cf6e"], [46, 9, 8.5, "#e8bf63"]];
const street = () => {
  planeXZ(5000, 5000, toon("earth", { map: P.soil(), color: 0xe9d9bc }), 0, 0, 0, 6);
  planeXZ(260, 8, toon("road", { map: UpPaint.cobbleHD() }), 0, 0.01, 0, 3);
  const walk = toon("walk", { map: UpPaint.stoneHD() });
  box(260, 0.16, 2, walk, 0, 0, -5, 0, 1.5); box(260, 0.16, 2, walk, 0, 0, 5, 0, 1.5);
  const roofM = toon("roofR", { map: UpPaint.roofHD("#b5523b") }), trim = toon("trim", { color: 0xf6f0e2 }), green = toon("shutG", { color: 0x3f7a52 });
  for (const [x, w, h, col] of ROW) {
    const office = x === 0, wall = toon("pl" + col, { map: P.plaster(col) });
    box(w, h, 8, wall, x, 0, -10, 0, 3);
    planeV(w, h, toonM({ map: UpPaint.facadeHD("hn" + x, w, h, { wall: col, shutter: office ? "#2f6b48" : "#4f8a5b", door: true }) }), x, h / 2, -5.99);
    addB(prismGeo(8.8, 2.6, w + 0.5, 2), roofM, M4(x, h, -10, Math.PI / 2));
    box(w + 0.3, 0.35, 0.5, trim, x, h - 0.35, -5.9);           // cornice
    if (!office && x % 2 === 0) { box(w * 0.6, 0.14, 0.9, trim, x, 3.1, -5.5); box(w * 0.6, 0.7, 0.05, green, x, 3.24, -5.06); }
  }
  // city blocks behind the row (aerial filler)
  for (const [dz, dx] of [[-20, 5], [-38, -3], [-56, 8]]) for (const [x, w, h, col] of ROW) { const hh = h * (0.8 + 0.3 * Math.sin(x + dz)); const ww = w * 0.95; box(ww, hh, 9, toon("pl" + col), x + dx, 0, -10 + dz, 0, 3); addB(prismGeo(9.6, 2.4, ww + 0.4, 2), roofM, M4(x + dx, hh, -10 + dz, Math.PI / 2)); }
  for (let i = 0; i < 40; i++) { const x = -70 + (i * 37) % 140, z = -18 - ((i * 23) % 60); tree(x, z, "round", 1.1); }
  // the town hall: white columns, pediment, sign, flag
  for (const cx of [-4.2, -2.1, 2.1, 4.2]) addB(new THREE.CylinderGeometry(0.22, 0.26, 7.6, 10), trim, M4(cx, 3.8, -5.55));
  box(10.2, 0.5, 1.2, trim, 0, 7.6, -5.6);
  addB(prismGeo(10.4, 1.7, 1.0, 2), trim, M4(0, 8.1, -5.6));
  sign(3.4, 0.7, ["MAIRIE"], { bg: "#2f6b48", size: 0.5 }, 0, 6.6, -5.0);
  flagPole(0, 12, -9, 5, 1.8);
  // south side: trees, railing, the lake with a red bridge to a small island temple
  for (let x = -49; x <= 49; x += 7) if (Math.abs(x) > 6) tree(x, 7.6, "round", 1.05 + 0.15 * Math.sin(x));
  for (let x = -60; x <= 60; x += 1.6) box(0.12, 0.8, 0.12, toon("rail", { color: 0x2f4f3a }), x, 0, 10.2);
  box(120, 0.08, 0.08, toon("rail"), 0, 0.72, 10.2);
  const lakeT = P.water(); lakeT.repeat.set(1, 1); WORLD.lake = lakeT;
  planeXZ(160, 100, toon("lake", { map: lakeT, color: 0xbfe2ee }), 0, -0.25, 61, 8);
  box(160, 0.5, 0.6, toon("quay", { map: UpPaint.stoneHD() }), 0, -0.5, 10.8, 0, 1.5);
  const red = toon("redBr", { color: 0xd23a36 });
  for (let i = 0; i <= 14; i++) { const t = i / 14, y = 0.2 + 1.6 * Math.sin(Math.PI * t), z = 11 + 18 * t; box(2.2, 0.16, 1.35, red, 14, y, z); box(0.1, 0.8, 0.1, red, 13.05, y, z); box(0.1, 0.8, 0.1, red, 14.95, y, z); }
  addB(new THREE.SphereGeometry(6, 16, 8), toon("isle", { color: 0x6fae47 }), M4(14, -3.8, 33, 0, 0, 0, 1.4, 1, 1));
  box(4, 2.6, 3, toon("templeW", { map: P.plaster("#f0d9a8") }), 14, 2.0, 34); addB(prismGeo(5, 1.6, 4.4, 2), roofM, M4(14, 4.6, 34, Math.PI / 2));
  tree(10.5, 33, "round", 1.0); tree(17.5, 35, "round", 0.9);
  for (const [x, z] of [[-30, 40], [-12, 70], [34, 62], [-50, 84], [50, 90]]) tree(x, z, "round", 1.3);
  // lamp posts + manholes
  const iron = toon("iron", { color: 0x2f3b36 });
  for (let x = -54; x <= 54; x += 12) for (const z of [-4.6, 4.6]) { if (z > 0 && Math.abs(x + 6) < 13) continue; addB(new THREE.CylinderGeometry(0.07, 0.11, 4.2, 6), iron, M4(x + (z > 0 ? 6 : 0), 2.1, z)); box(0.42, 0.55, 0.42, toon("lampG", { color: 0xfff1c4 }), x + (z > 0 ? 6 : 0), 4.15, z); }
  for (const x of [-24, -12, 0, 12, 24]) addB(new THREE.CylinderGeometry(0.48, 0.48, 0.05, 20), iron, M4(x + 3, 0.03, 1.4));
  // the reward table outside the hall
  const wood = toon("tableW", { map: UpPaint.planksHD(), color: 0x9a6a48 });
  box(1.9, 0.86, 0.9, wood, -0.6, 0, -2.6, 0, 1); box(2.0, 0.06, 1.0, toon("cloth", { color: 0xf4efe2 }), -0.6, 0.86, -2.6);
  for (let i = 0; i < 5; i++) addB(new THREE.CylinderGeometry(0.07, 0.07, 0.03 * (3 + i), 12), toon("gold"), M4(-1.3 + i * 0.12, 0.9 + 0.015 * (3 + i), -2.4));
  box(0.5, 0.06, 0.36, toon("ledger", { color: 0x7a2f35 }), -0.1, 0.89, -2.65);
  box(0.6, 0.5, 0.6, wood, -0.6, 0, -3.5); box(0.6, 0.9, 0.08, wood, -0.6, 0.5, -3.78);
  // shot 3 roadworks (toggled): trench, dirt, pipes, sign
  const tg = new THREE.Group(); WORLD.works = tg;
  const add = (geo, mat, m4) => { const m = new THREE.Mesh(geo, mat); m.applyMatrix4(m4); m.castShadow = m.receiveShadow = true; m.userData.kind = "world"; tg.add(m); };
  add(tboxGeo(44, 0.04, 1.4), toon("trench", { color: 0x3a2a22 }), M4(0, 0.03, -2.4));
  for (let x = -20; x <= 20; x += 2.2) add(new THREE.SphereGeometry(0.75, 10, 6), toon("dirt", { map: P.soil(), color: 0xc9a07a }), M4(x, 0, -3.5, x, 0, 0, 1.1, 0.55, 0.8));
  for (const [x, z, r] of [[-6, 2.2, 0], [-2.5, 2.4, 0.1], [7, 2.1, -0.1], [10, 2.5, 0], [-12, 2.3, 0.2]]) add(new THREE.CylinderGeometry(0.42, 0.42, 3, 14, 1, true), toon("pipe", { color: 0x8d949c, side: THREE.DoubleSide }), M4(x, 0.42, z, r, 0, Math.PI / 2));
  const sp = (x, z) => add(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), toon("pole"), M4(x, 1.1, z));
  sp(3.6, -3.9); sp(6.4, -3.9);
  const st = canvasTex(560, 240, (g) => C.signBoard(g, 560, 240, ["GOT BARU", "1902"], { bg: "#f4ecd6", fg: "#7a2f35", rim: "#7a2f35", size: 0.62 }));
  const sm_ = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.2), toonM({ map: st })); sm_.position.set(5, 1.8, -3.88); sm_.userData.kind = "world"; tg.add(sm_);
  for (const x of [-16, 15]) { add(tboxGeo(1.6, 0.18, 0.08), toon("barR", { color: 0xd23a36 }), M4(x, 0.8, -1.4)); add(tboxGeo(0.08, 0.8, 0.08), toon("pole"), M4(x - 0.7, 0.4, -1.4)); add(tboxGeo(0.08, 0.8, 0.08), toon("pole"), M4(x + 0.7, 0.4, -1.4)); }
  tg.visible = false; scene.add(tg);
};
// ---- sewer (underground, along x) ----
const sewer = () => {
  const y0 = SEW;
  const tg = new THREE.CylinderGeometry(3.0, 3.0, 70, 28, 1, true); tg.rotateZ(Math.PI / 2);
  const uv = tg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 5, uv.getY(i) * 22);
  const tm = mesh(tg, toon("sewerW", { map: brickDark(), side: THREE.BackSide }), "world", false); tm.position.set(0, y0 + 1.1, 0); tm.receiveShadow = true;
  const ledge = toon("ledge", { map: UpPaint.stoneHD(), color: 0xa9a49a });
  box(70, 0.5, 1.5, ledge, 0, y0 - 0.5, -1.6, 0, 1.4); box(70, 0.5, 1.5, ledge, 0, y0 - 0.5, 1.6, 0, 1.4);
  box(70, 0.3, 4.8, ledge, 0, y0 - 1.9, 0, 0, 2);
  const wt = P.water(); WORLD.sewerW = wt;
  planeXZ(70, 1.8, toon("sewW", { map: wt, color: 0x7fa88a }), 0, y0 - 0.45, 0, 3);
  const white = toon("lane", { color: 0xf4f1e4 });
  for (let x = -34; x < 34; x += 2.4) { box(1.1, 0.01, 0.09, white, x, y0, -1.6); box(1.1, 0.01, 0.09, white, x, y0, 1.6); }
  for (const x of [-26, -8, 12]) { const m = mesh(new THREE.CircleGeometry(0.6, 16), new THREE.MeshBasicMaterial({ color: 0xfff4c8 }), "soft", false); m.position.set(x, y0 + 4.08, 0); m.rotation.x = Math.PI / 2; }
  sign(3.4, 1.1, ["TOL TIKUS"], { bg: "#1f7a4a", size: 0.4 }, -6, y0 + 2.75, 0, Math.PI / 2);
  addB(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 4), toon("iron"), M4(-6, y0 + 3.7, -1.0)); addB(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 4), toon("iron"), M4(-6, y0 + 3.7, 1.0));
  sign(1.3, 0.55, ["KE RUMAH", "PRANCIS"], { bg: "#1f7a4a", size: 0.5 }, 9, y0 + 1.3, -2.25, 0);
};
// ---- interiors (z = -500): office at x 0, bathroom at x 20 ----
const interiors = () => {
  const oz = -500, wall = toon("offW", { map: P.plaster("#efe2c4") }), wains = toon("wains", { color: 0x3f6b55 }), floor = toon("offF", { map: UpPaint.planksHD(), color: 0xb08060 });
  box(13, 0.1, 10, floor, 0, -0.1, oz, 0, 1.6);
  box(13, 4.6, 0.3, wall, 0, 0, oz - 4.15, 0, 3); box(0.3, 4.6, 10, wall, -6.5, 0, oz, 0, 3); box(0.3, 4.6, 10, wall, 6.5, 0, oz, 0, 3);
  box(13, 0.3, 10, toon("ceil", { color: 0xf3ead6 }), 0, 4.6, oz);
  box(13, 1.1, 0.34, wains, 0, 0, oz - 4.12); box(0.34, 1.1, 10, wains, -6.45, 0, oz); box(0.34, 1.1, 10, wains, 6.45, 0, oz);
  box(0.12, 2.2, 1.8, new THREE.MeshBasicMaterial({ color: 0xfff1cc }), 6.33, 1.4, oz - 1.5);
  const wood = toon("cntW", { map: UpPaint.planksHD(), color: 0x7a4a30 });
  box(4.6, 0.92, 0.9, wood, 0.6, 0, oz - 1.0, 0, 1); box(4.8, 0.08, 1.05, toon("cntTop", { color: 0x3a2418 }), 0.6, 0.92, oz - 1.0); box(4.6, 0.25, 1.4, wood, 0.6, 0, oz - 2.0, 0, 1);
  for (let i = 0; i < 3; i++) { box(2.4, 0.08, 0.5, wood, 3.6, 1.0 + i * 0.75, oz - 3.75); for (let j = 0; j < 7; j++) box(0.16, 0.5, 0.36, toon("book" + (j % 3), { color: [0x7a2f35, 0x2c3b63, 0x5a7a3a][j % 3] }), 2.6 + j * 0.28, 1.08 + i * 0.75, oz - 3.75); }
  const fl = canvasTex(330, 220, (g) => C.flagFR(g, 0, 0, 330, 220)); planeV(1.2, 0.8, toonM({ map: fl }), -4.6, 3.2, oz - 3.98);
  const fan = new THREE.Group(); fan.position.set(0.6, 4.2, oz - 1.6); for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.03, 0.22), toon("fan", { color: 0x5a3a24 })); b.position.set(Math.cos(i * Math.PI / 2) * 0.65, 0, Math.sin(i * Math.PI / 2) * 0.65); b.rotation.y = -i * Math.PI / 2; b.userData.kind = "world"; fan.add(b); } scene.add(fan); WORLD.fan = fan;
  // bathroom
  const bx = 20, tileW = toon("tileW", { map: tiles("#f4f6f8", "#dfe8f2", 6) }), tileF = toon("tileF", { map: tiles("#f2f0ea", "#2a2a33", 8) });
  box(6, 0.1, 6, tileF, bx, -0.1, oz, 0, 1.2);
  box(6, 3.6, 0.3, tileW, bx, 0, oz - 3.1, 0, 1); box(0.3, 3.6, 6, tileW, bx - 3, 0, oz, 0, 1); box(0.3, 3.6, 6, tileW, bx + 3, 0, oz, 0, 1);
  box(6, 0.3, 6, toon("ceil"), bx, 3.6, oz);
  box(6, 0.14, 0.32, toon("tileBand", { color: 0x3a6fb0 }), bx, 1.2, oz - 3.05);
  const por = toon("porc", { color: 0xfbfbf6 });
  addB(new THREE.CylinderGeometry(0.16, 0.24, 0.82, 16), por, M4(bx + 0.3, 0.41, oz - 2.45));
  addB(new THREE.CylinderGeometry(0.46, 0.3, 0.2, 20), por, M4(bx + 0.3, 0.92, oz - 2.45));
  addB(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), toon("gold"), M4(bx + 0.3, 1.1, oz - 2.8, 0, 0.5));
  box(1.2, 0.95, 0.06, toon("gold"), bx + 0.3, 1.5, oz - 2.93); planeV(1.05, 0.8, toonM({ color: 0xbfe0f0 }), bx + 0.3, 1.97, oz - 2.89);
  box(0.9, 0.04, 0.04, toon("gold"), bx - 1.7, 1.3, oz - 2.9); box(0.6, 0.7, 0.04, toon("towel", { color: 0x9fc4e8 }), bx - 1.7, 0.62, oz - 2.88);
  box(0.12, 1.4, 1.2, new THREE.MeshBasicMaterial({ color: 0xfff6dc }), bx + 2.83, 1.5, oz - 1.0);
};
// ---- alley (night flashback, then the catcher's courtyard) at x -40, z -500 ----
const alley = () => {
  const ax = -40, oz = -500;
  planeXZ(10, 30, toon("alleyF", { map: UpPaint.cobbleHD() }), ax, 0.02, oz, 3);
  for (const s of [-1, 1]) { const x = ax + s * 2.8, col = s < 0 ? "#d9b98a" : "#cfae7a"; box(0.4, 8, 30, toon("alW" + s, { map: P.plaster(col) }), x + s * 0.2, 0, oz, 0, 3); planeV(30, 8, toonM({ map: UpPaint.facadeHD("al" + s, 30, 8, { wall: col, shutter: "#7a5a3a", door: true }) }), x, 4, oz, s < 0 ? Math.PI / 2 : -Math.PI / 2); }
  box(6, 8, 0.4, toon("alEnd", { map: P.plaster("#c9a678") }), ax, 0, oz - 13);
  const crate = toon("crate", { map: UpPaint.planksHD(), color: 0xc29a6a });
  for (const [x, z, sz] of [[-2, -503, 0.8], [-1.95, -502.1, 0.6], [1.9, -506, 0.9], [2.0, -497, 0.7], [-0.3, -503.25, 0.6]]) box(sz, sz, sz, crate, ax + x, 0, z, 0.3, 0.8);
  for (const [x, z] of [[-1.9, -499], [1.8, -501.5]]) addB(new THREE.CylinderGeometry(0.32, 0.26, 0.5, 14), toon("weaveB", { map: weave() }), M4(ax + x, 0.25, z));
  addB(new THREE.CylinderGeometry(0.012, 0.012, 5.6, 4), toon("iron"), M4(ax, 4.6, oz - 4, 0, 0, Math.PI / 2));
  for (const [x, z] of [[-1.2, -504], [1.0, -504], [0, -509]]) { const m = mesh(new THREE.SphereGeometry(0.26, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff6a3a }), "world", false); m.position.set(ax + x, 4.2, z); m.scale.y = 1.3; }
};
// ---- rice fields with the rat farm (z = 1500) ----
const RF = 1500;
const fields = () => {
  const wt = P.water(); WORLD.paddy = wt;
  planeXZ(400, 400, toon("paddy", { map: wt, color: 0x9fd0a8 }), 0, 0.03, RF, 10);
  const dike = toon("dike", { map: P.soil(), color: 0xc9a77e });
  for (let x = -96; x <= 96; x += 16) box(0.9, 0.3, 200, dike, x, 0, RF + 40, 0, 2);
  for (let z = RF - 56; z <= RF + 140; z += 14) box(200, 0.3, 0.9, dike, 0, 0, z, 0, 2);
  box(14, 0.32, 12, dike, 0, 0, RF, 0, 3); // dry yard for the farm
  const rice = toon("rice", { color: 0x6fbf4a }), r = P.rng(9);
  for (let i = 0; i < 2600; i++) { const x = (r() - 0.5) * 190, z = RF - 50 + r() * 180; if (Math.abs(x) < 8.5 && Math.abs(z - RF) < 7.5) continue; if (Math.abs(((x + 200) % 16) - 8) > 7 || Math.abs(((z - RF + 300) % 14) - 7) > 6.2) continue; addB(new THREE.ConeGeometry(0.26, 0.75 + r() * 0.3, 5), rice, M4(x, 0.38, z, r() * 3)); }
  // bamboo pens
  const bam = toon("bamboo", { color: 0xb7a35a }), wv = toon("weave", { map: weave() });
  for (const [cx, cz, w, d] of [[-3.5, RF - 1.5, 3.2, 2.4], [0.4, RF - 2.6, 3.0, 2.2], [3.9, RF - 1.2, 3.2, 2.4]]) {
    for (const [px, pz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2], [0, -d / 2], [0, d / 2]]) addB(new THREE.CylinderGeometry(0.06, 0.07, 1.25, 6), bam, M4(cx + px, 0.62 + 0.32, cz + pz));
    box(w, 0.62, 0.06, wv, cx, 0.32, cz - d / 2, 0, 1); box(0.06, 0.62, d, wv, cx - w / 2, 0.32, cz, 0, 1); box(0.06, 0.62, d, wv, cx + w / 2, 0.32, cz, 0, 1);
    box(w, 0.36, 0.06, wv, cx, 0.32, cz + d / 2, 0, 1);
  }
  // thatched hut
  box(4, 2.4, 3, toon("hutW", { map: weave() }), -6.5, 0.32, RF - 4.5, 0.2, 1.2);
  addB(prismGeo(4.6, 2.0, 5.0, 2), toon("thatch", { map: thatch() }), M4(-6.5, 2.72, RF - 4.5, Math.PI / 2 + 0.2));
  for (const [x, z, s] of [[-14, RF - 8, 1.2], [12, RF - 9, 1.1], [-20, RF + 4, 1.0], [16, RF + 2, 1.3], [-9, RF - 14, 1.0]]) tree(x, z, "palm", s);
  // karst hills
  const hill = toon("karst", { color: 0x5f8f6a });
  for (const [x, z, r, h] of [[-120, RF + 260, 40, 110], [-40, RF + 300, 55, 140], [60, RF + 280, 45, 120], [150, RF + 240, 38, 100], [-200, RF + 220, 50, 90], [230, RF + 300, 60, 130]]) { addB(new THREE.CylinderGeometry(r * 0.55, r, h, 10), hill, M4(x, h / 2 - 4, z)); addB(new THREE.SphereGeometry(r * 0.56, 10, 6), hill, M4(x, h - 4, z, 0, 0, 0, 1, 0.5, 1)); }
};

const buildWorld = () => {
  WORLD.flags = []; WORLD.leafGeos = [];
  street(); sewer(); interiors(); alley(); fields();
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
  potato: (g, s) => C.potato(g, s.bite ?? 0),
  grave: (g) => C.grave(g),
  flowers: (g, s) => C.flowers(g, s.col, s.seed),
  bang: (g, s) => C.fxBang(g, s.t), puff: (g, s) => C.fxPuff(g, s.t), smoke: (g, s) => C.fxSmoke(g, s.t), bird: (g, s) => C.fxBird(g, s.t),
  z: (g, s) => C.fxZ(g, s.t), leaf: (g, s) => C.fxLeaf(g, s.col), snow: (g) => C.fxSnow(g), spark: (g, s) => C.fxSpark(g, s.t), thud: (g, s) => C.fxThud(g, s.t),
};
const SIZE = { rat: [600, 420, 405], coin: [120, 120, 60], tails: [600, 700, 690], basket: [300, 260, 250], poster: [600, 820, 810], heart: [160, 160, 80], bang2: [120, 200, 190], person: [900, 1000, 975], personSide: [900, 1000, 975], pig: [600, 420, 405], potato: [200, 160, 150], grave: [360, 520, 505], flowers: [200, 200, 190], bang: [500, 500, 250], puff: [300, 300, 190], smoke: [400, 300, 160], bird: [160, 100, 50], z: [200, 200, 100], leaf: [80, 80, 40], snow: [64, 64, 32], spark: [200, 200, 100], thud: [500, 300, 220] };
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
    if (c.blob.visible) { const bw = (s.blobW ?? (s.type === "pig" ? 1.0 : 0.75)) * sc; c.blob.scale.set(bw, 1, bw * 0.55); c.blob.position.set(s.x, ground(s.x, s.z) + 0.02, s.z); c.blob.rotation.y = c.mesh.rotation.y; }
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
  WORLD.lake.offset.set((f * 0.0008) % 1, (f * 0.0005) % 1);
  WORLD.sewerW.offset.set((-f * 0.004) % 1, 0); WORLD.paddy.offset.set((f * 0.0004) % 1, 0);
  waveFlags(f);
  WORLD.works.visible = st.works;
  WORLD.fan.rotation.y = f * 0.05;
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
