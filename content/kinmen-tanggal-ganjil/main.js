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
export const ground = (x, z) => groundAt(x, z);
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
// ================= Kinmen world =================
// strait: mainland plateau (z 18..160, top 5) with the battery; sea (y 0); Kinmen (beach z -125..-100 at 1.0, plateau z < -125 at 1.6)
// interiors far east: office (x 2000), smithy (x 2100), knife shop + street (x 2200)
const OFX = 2000, SMX = 2100, SHX = 2200;
const groundAt = (x, z) => {
  if (x > 1500) return 0;
  if (z > 18 && Math.abs(x) < 150) return 5;
  if (z < -100 && z > -125 && Math.abs(x) < 150) return 1.0;
  if (z <= -125 && z > -260 && Math.abs(x) < 150) return 1.6;
  return 0;
};
const sandbagTex = () => P.ctex("sandbag", 512, 256, (g, r) => { g.fillStyle = "#cdb98a"; g.fillRect(0, 0, 512, 256); for (let y = 0, row = 0; y < 256; y += 64, row++) for (let x = -(row % 2) * 64; x < 512; x += 128) { const k = 0.9 + r() * 0.2; g.fillStyle = `rgb(${Math.round(214 * k)},${Math.round(196 * k)},${Math.round(150 * k)})`; g.beginPath(); g.ellipse(x + 64, y + 32, 60, 28, 0, 0, 7); g.fill(); g.strokeStyle = "rgba(90,70,40,.5)"; g.lineWidth = 4; g.stroke(); } });
const rockTex = () => P.ctex("rockK", 512, 512, (g, r) => { g.fillStyle = "#9a8f80"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 90; i++) { const k = 0.8 + r() * 0.35; g.fillStyle = `rgb(${Math.round(150 * k)},${Math.round(138 * k)},${Math.round(122 * k)})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 30 + r() * 50, 18 + r() * 30, r() * 3, 0, 7); g.fill(); } });
const sandTex = () => P.ctex("sandK", 512, 512, (g, r) => { g.fillStyle = "#e8d3a2"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 1500; i++) { g.fillStyle = r() > 0.5 ? "rgba(190,160,110,.35)" : "rgba(255,245,215,.4)"; g.fillRect(r() * 512, r() * 512, 3, 3); } });
const seaTex = () => P.ctex("seaK", 512, 512, (g, r) => { g.fillStyle = "#3f93c8"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 70; i++) { const x = r() * 512, y = r() * 512, w = 30 + r() * 60; g.strokeStyle = r() > 0.5 ? "rgba(220,240,255,.55)" : "rgba(40,110,160,.5)"; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 8, x + w, y); g.stroke(); } });
const minnan = (x, y, z, w, d, ry = 0) => {
  // white-washed wall on a red-brick base, red tile roof with an upswept "swallowtail" ridge
  const m4 = (dx, dy, dz, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { const v = new THREE.Vector3(dx, dy, dz).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry); return M4(x + v.x, y + v.y, z + v.z, ry, rx, rz, sx, sy, sz); };
  addB(tboxGeo(w, 1.0, d, 1), toon("mnBrick", { map: UpPaint.brick() }), m4(0, 0.5, 0));
  addB(tboxGeo(w, 1.8, d, 1), toon("mnWall", { color: 0xf1ece0 }), m4(0, 1.9, 0));
  addB(prismGeo(d + 0.5, 1.3, w + 0.3, 2), toon("mnRoof", { map: UpPaint.roofHD("#c8452f") }), m4(0, 2.8, 0, 0, 0).multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2)));
  addB(tboxGeo(w + 0.5, 0.14, 0.16, 1), toon("mnRidge", { color: 0x9a2f22 }), m4(0, 4.12, 0));
  for (const s of [-1, 1]) addB(tboxGeo(0.7, 0.12, 0.14, 1), toon("mnRidge"), m4(s * (w / 2 + 0.45), 4.3, 0, 0, s * 0.6));
  addB(tboxGeo(0.9, 1.5, 0.06, 1), toon("mnDoor", { color: 0x7a2f22 }), m4(0, 1.0 + 0.75, d / 2 + 0.02));
  for (const s of [-1, 1]) addB(tboxGeo(0.6, 0.6, 0.06, 1), toon("mnWin", { color: 0x3a3236 }), m4(s * w * 0.3, 2.2, d / 2 + 0.02));
};
const cannon = (x, y, z, ry = 0) => {
  const gr = new THREE.Group(); gr.position.set(x, y, z); gr.rotation.y = ry;
  const steel = toon("gun", { color: 0x55634a }), dark = toon("gunD", { color: 0x2f3529 }), tyre = toon("tyre", { color: 0x26262c });
  const add = (geo, mat, m4, par = gr) => { const m = new THREE.Mesh(geo, mat); m.applyMatrix4(m4); m.castShadow = m.receiveShadow = true; m.userData.kind = "world"; par.add(m); return m; };
  add(tboxGeo(1.0, 0.5, 1.4, 1), steel, M4(0, 0.75, 0));
  for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(0.55, 0.55, 0.22, 18), tyre, M4(s * 0.7, 0.55, 0.1, 0, 0, Math.PI / 2)); add(new THREE.CylinderGeometry(0.2, 0.2, 0.24, 10), dark, M4(s * 0.7, 0.55, 0.1, 0, 0, Math.PI / 2)); }
  for (const s of [-1, 1]) add(tboxGeo(0.14, 0.14, 2.6, 1), steel, M4(s * 0.35, 0.3, 1.5, s * 0.2, -0.12));
  add(tboxGeo(1.4, 1.0, 0.08, 1), steel, M4(0, 1.15, -0.55, 0, -0.15));
  const piv = new THREE.Group(); piv.position.set(0, 1.15, 0); piv.rotation.x = 0.32; gr.add(piv);
  const bar = new THREE.Group(); piv.add(bar);
  add(new THREE.CylinderGeometry(0.13, 0.17, 3.6, 14), steel, M4(0, 0, -1.6, 0, Math.PI / 2), bar);
  add(new THREE.CylinderGeometry(0.17, 0.17, 0.3, 14), dark, M4(0, 0, -3.35, 0, Math.PI / 2), bar);
  add(tboxGeo(0.5, 0.45, 1.0, 1), dark, M4(0, -0.05, 0.25), bar);
  scene.add(gr); (WORLD.cannons ??= []).push({ gr, bar, piv });
  return gr;
};
const strait = () => {
  const sea = planeXZ(3000, 3000, toon("sea", { map: seaTex(), color: 0xffffff }), 0, 0, 0, 12); sea.userData.kind = "world";
  // mainland plateau + cliff
  box(300, 5, 142, toon("cliff", { map: rockTex() }), 0, 0, 89, 0, 6);
  planeXZ(300, 142, toon("grassK", { map: UpPaint.grassHD(), color: 0xc4d890 }), 0, 5.01, 89, 6);
  // battery: concrete pad, sandbag horseshoes, three guns facing the island (-z)
  planeXZ(30, 10, toon("pad", { map: UpPaint.stoneHD() }), 0, 5.02, 27, 2);
  const sb = toon("sandbag", { map: sandbagTex() });
  for (const gx of [-8, 0, 8]) { box(4.2, 0.8, 0.7, sb, gx, 5, 23.3, 0, 1.4); for (const s of [-1, 1]) box(0.7, 0.8, 3.4, sb, gx + s * 2.1, 5, 25.0, 0, 1.4); cannon(gx, 5, 25.6, 0); }
  box(1.4, 1.0, 1.0, toon("crate", { map: UpPaint.planks() }), 11.5, 5, 29); box(1.0, 0.7, 1.0, toon("crate"), 12.7, 5, 29.4);
  for (let x = -60; x <= 60; x += 9) if (Math.abs(x) > 14) tree(x, 40 + 8 * Math.sin(x), "round", 1.1);
  // Kinmen: beach + plateau
  box(300, 1.0, 25, toon("sand", { map: sandTex() }), 0, 0, -112.5, 0, 4);
  box(300, 1.6, 135, toon("islandG", { map: UpPaint.grassHD(), color: 0xc4d890 }), 0, 0, -192.5, 0, 6);
  // trench wall (sandbags) facing the mainland + bunker
  box(14, 0.9, 0.8, sb, 1, 1.0, -107.6, 0, 1.4);
  box(0.8, 0.9, 3, sb, 8.2, 1.0, -109, 0, 1.4); box(0.8, 0.9, 3, sb, -6.2, 1.0, -109, 0, 1.4);
  const con = toon("concrete", { map: UpPaint.stoneHD("concK", ["#a8a49a", "#9a968c", "#b2aea4", "#a09c92"]) });
  addB(new THREE.CylinderGeometry(3.2, 3.6, 7, 20, 1, false, 0, Math.PI), con, M4(-11, 1.0, -116, Math.PI / 2, 0, Math.PI / 2, 1, 0.8, 1));
  box(7.2, 0.3, 7.6, con, -11, 1.0, -116);
  addB(tboxGeo(1.4, 1.9, 0.5, 1), toon("bunkerIn", { color: 0x1e1c22 }), M4(-11, 1.95, -112.35));
  const door = new THREE.Group(); door.position.set(-11.7, 1.0, -112.0); scene.add(door); WORLD.door = door;
  const dm = new THREE.Mesh(tboxGeo(1.4, 1.9, 0.1, 1), toon("bunkerDoor", { color: 0x5d6b4c })); dm.position.set(0.7, 0.95, 0); dm.castShadow = dm.receiveShadow = true; dm.userData.kind = "world"; door.add(dm);
  sign(2.2, 0.5, ["BUNKER"], { bg: "#2a2d33", fg: "#f2c83a", rim: "#f2c83a", size: 0.5 }, -11, 3.4, -112.6);
  // village behind the beach
  minnan(-2, 1.6, -136, 7, 4.5); minnan(9, 1.6, -139, 6, 4.5); minnan(-15, 1.6, -142, 6, 4.5); minnan(20, 1.6, -137, 6, 4.5);
  for (const [x, z] of [[-24, -132], [4, -131], [14, -131.5], [28, -133], [-30, -140], [32, -145]]) tree(x, z, "round", 0.9);
  // shell heap spot (beach left) + jetty for the boat
  box(3, 0.3, 8, toon("jetty", { map: UpPaint.planks() }), -22, 0.7, -101, 0, 1);
  // the supply boat (dynamic)
  const bt = new THREE.Group(); WORLD.boat = bt; scene.add(bt);
  const ba = (geo, mat, m4) => { const m = new THREE.Mesh(geo, mat); m.applyMatrix4(m4); m.castShadow = m.receiveShadow = true; m.userData.kind = "world"; bt.add(m); return m; };
  ba(tboxGeo(7, 1.2, 2.8, 1), toon("hull", { color: 0x55634a }), M4(0, 0.4, 0));
  ba(new THREE.CylinderGeometry(1.4, 1.4, 1.2, 3), toon("hull"), M4(3.9, 0.4, 0, 0, 0, 0, 0.6, 1, 1));
  ba(tboxGeo(2.2, 1.4, 2.0, 1), toon("cabinB", { color: 0xe8e2d4 }), M4(-2.0, 1.7, 0));
  for (let i = 0; i < 4; i++) ba(tboxGeo(0.9, 0.6, 0.7, 1), toon("sackB", { color: 0xe8d6ac }), M4(0.4 + (i % 2) * 1.1, 1.3 + Math.floor(i / 2) * 0.55, (i % 2 ? -0.4 : 0.45)));
  // Taiwan, far away (aerial shot only)
  box(900, 3, 160, toon("twG", { color: 0x8fbf6a }), 250, 0, -1500, 0, 50);
  for (let i = 0; i < 6; i++) addB(new THREE.ConeGeometry(40 + 10 * (i % 3), 50 + 15 * (i % 2), 6), toon("twM", { color: 0x6f9f5a }), M4(-50 + i * 110, 25, -1520));
  // mainland coast continues far left/right as islands to show "close"
  box(260, 4, 120, toon("cliff"), -380, 0, -60, 0, 6); planeXZ(260, 120, toon("grassK"), -380, 4.01, -60, 6);
};
const office = () => {
  const x0 = OFX, wood = toon("plankF", { map: UpPaint.planksHD() });
  planeXZ(12, 10, wood, x0, 0.01, 0, 2);
  const wall = toon("offW", { color: 0xd9cfb8 });
  box(12, 5, 0.3, wall, x0, 0, -4); box(0.3, 5, 10, wall, x0 - 6, 0, 0); box(0.3, 5, 10, wall, x0 + 6, 0, 0);
  box(12, 0.9, 0.06, toon("offWain", { color: 0x7a5a3a }), x0, 0, -3.83);
  // strait map on the back wall
  const mapT = canvasTex(800, 520, (g) => { g.fillStyle = "#cfe3ef"; g.fillRect(0, 0, 800, 520); g.fillStyle = "#d8c99a"; g.beginPath(); g.moveTo(0, 0); g.lineTo(520, 0); g.bezierCurveTo(500, 120, 430, 160, 380, 260); g.bezierCurveTo(330, 360, 260, 420, 0, 470); g.fill(); g.fillStyle = "#c9e0a0"; g.beginPath(); g.ellipse(470, 310, 60, 34, -0.3, 0, 7); g.fill(); g.strokeStyle = "#241726"; g.lineWidth = 6; g.strokeRect(3, 3, 794, 514); g.strokeStyle = "#d8312d"; g.lineWidth = 6; g.setLineDash([16, 10]); g.beginPath(); g.moveTo(330, 210); g.quadraticCurveTo(420, 200, 460, 290); g.stroke(); g.setLineDash([]); g.fillStyle = "#d8312d"; g.beginPath(); g.arc(470, 310, 12, 0, 7); g.fill(); });
  planeV(3.2, 2.1, toonM({ map: mapT }), x0 - 1.5, 2.8, -3.83);
  // window with daylight
  planeV(1.8, 1.8, new THREE.MeshBasicMaterial({ color: 0xcfe9f5 }), x0 + 3.2, 2.8, -3.83);
  box(1.9, 0.08, 0.1, toon("offWain"), x0 + 3.2, 3.7, -3.8); box(0.08, 1.8, 0.1, toon("offWain"), x0 + 3.2, 1.9, -3.8); box(1.9, 0.08, 0.1, toon("offWain"), x0 + 3.2, 1.9, -3.8);
  // desk + chair + lamp + tea
  const desk = toon("desk", { color: 0x6b4429 });
  box(3.0, 0.1, 1.3, desk, x0, 0.95, -1.4); for (const [dx, dz] of [[-1.4, -0.6], [1.4, -0.6], [-1.4, 0.6], [1.4, 0.6]]) box(0.1, 0.95, 0.1, desk, x0 + dx, 0, -1.4 + dz);
  box(1.1, 0.04, 0.8, toon("paperD", { color: 0xf6efdc }), x0 + 0.2, 1.05, -1.3, 0.1);
  addB(new THREE.CylinderGeometry(0.05, 0.12, 0.6, 8), toon("lampK", { color: 0x2f3b36 }), M4(x0 - 1.1, 1.35, -1.8));
  addB(new THREE.ConeGeometry(0.3, 0.3, 12, 1, true), toon("lampShade", { color: 0x3f7a5a, side: THREE.DoubleSide }), M4(x0 - 1.1, 1.7, -1.8));
  addB(new THREE.CylinderGeometry(0.07, 0.06, 0.12, 10), toon("cup", { color: 0xf4f1e6 }), M4(x0 + 1.1, 1.11, -1.2));
  box(0.9, 1.4, 0.15, desk, x0, 0, -2.6); box(0.9, 0.1, 0.8, desk, x0, 0.55, -2.3);
};
const smithy = () => {
  const x0 = SMX;
  planeXZ(12, 10, toon("smF", { map: UpPaint.stoneHD("smFloor", ["#6a625a", "#5e5650", "#746c62", "#665e56"]) }), x0, 0.01, 0, 2);
  const br = toon("smBrick", { map: UpPaint.brick() });
  box(12, 5, 0.3, br, x0, 0, -4, 0, 2); box(0.3, 5, 10, br, x0 - 6, 0, 0, 0, 2); box(0.3, 5, 10, br, x0 + 6, 0, 0, 0, 2);
  // forge: brick box with glowing coals + hood
  box(2.2, 1.0, 1.6, br, x0 - 2.6, 0, -3.0, 0, 1);
  box(1.6, 0.06, 1.0, new THREE.MeshBasicMaterial({ color: 0xff7a2a }), x0 - 2.6, 1.0, -2.95);
  for (let i = 0; i < 9; i++) addB(new THREE.IcosahedronGeometry(0.12, 0), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffc04a : 0xff5a1a }), M4(x0 - 3.2 + (i % 5) * 0.3, 1.08, -3.2 + Math.floor(i / 5) * 0.4));
  addB(new THREE.CylinderGeometry(0.3, 1.1, 1.0, 4), toon("hood", { color: 0x3a3f4a }), M4(x0 - 2.6, 2.8, -3.0, Math.PI / 4));
  box(0.5, 2.0, 0.5, toon("hood"), x0 - 2.6, 3.3, -3.0);
  // anvil on a stump
  addB(new THREE.CylinderGeometry(0.35, 0.4, 0.7, 12), toon("stump", { color: 0x6b4429 }), M4(x0 + 0.6, 0.35, -1.2));
  const anv = toon("anvil", { color: 0x3a3d44 });
  box(0.7, 0.35, 0.36, anv, x0 + 0.6, 0.7, -1.2); box(0.95, 0.12, 0.42, anv, x0 + 0.6, 1.05, -1.2);
  addB(new THREE.ConeGeometry(0.2, 0.5, 4), anv, M4(x0 + 1.3, 1.11, -1.2, 0, 0, -Math.PI / 2, 1, 1, 0.6));
  // shelves with raw shells along the back wall
  box(4.0, 0.08, 0.6, toon("shelf", { map: UpPaint.planks() }), x0 + 2.4, 1.6, -3.6); box(4.0, 0.08, 0.6, toon("shelf"), x0 + 2.4, 2.6, -3.6);
  for (let i = 0; i < 9; i++) addB(new THREE.CylinderGeometry(0.1, 0.12, 0.5, 10), toon("shellM", { color: i % 3 ? 0x7a7f86 : 0x8a7a5a }), M4(x0 + 0.8 + i * 0.4, 1.95 + (i % 2) * 1.0, -3.55));
  box(0.4, 0.04, 2.6, new THREE.MeshBasicMaterial({ color: 0xffe2a8 }), x0 + 5.7, 4.9, 0);
};
const knifeWallTex = () => canvasTex(1200, 600, (g) => { g.fillStyle = "#6b4429"; g.fillRect(0, 0, 1200, 600); g.strokeStyle = "#4a2e1a"; g.lineWidth = 6; for (let x = 0; x < 1200; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 600); g.stroke(); } for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) { g.save(); g.translate(40 + i * 195, 30 + j * 140); g.scale(0.32, 0.5); C.knife(g); g.restore(); } });
const knifeShop = () => {
  const x0 = SHX;
  planeXZ(60, 30, toon("street", { map: UpPaint.stoneHD("streetK", ["#b8aea0", "#aaa092", "#c2b8aa", "#b0a698"]) }), x0, 0.01, 4, 3);
  // shop: open front facing +z, red-brick sides, counter, knife wall at the back
  const br = toon("smBrick");
  box(10, 4.6, 0.3, br, x0, 0, -4); box(0.4, 4.6, 6, br, x0 - 5, 0, -1); box(0.4, 4.6, 6, br, x0 + 5, 0, -1);
  box(10.4, 0.5, 6.4, toon("mnRoof", { map: UpPaint.roofHD("#c8452f") }), x0, 4.6, -1);
  planeV(7.6, 3.0, toonM({ map: knifeWallTex() }), x0, 2.2, -3.83);
  box(6, 1.0, 0.8, toon("counter", { color: 0x8a5a34 }), x0, 0, 0.8); box(6.2, 0.08, 1.0, toon("counterT", { color: 0xd9c9a0 }), x0, 1.0, 0.8);
  sign(4.2, 0.9, ["PISAU KINMEN"], { bg: "#a8231f", fg: "#f6d36a", rim: "#f6d36a", size: 0.5 }, x0, 5.3, 2.25);
  minnan(x0 - 12, 0, -1.5, 8, 5); minnan(x0 + 12, 0, -1.5, 8, 5); minnan(x0 - 2, 0, 24, 8, 5, Math.PI);
  for (const x of [-20, 20]) tree(x0 + x, 6, "round", 1.0);
};

const buildWorld = () => {
  WORLD.flags = []; WORLD.leafGeos = [];
  strait(); office(); smithy(); knifeShop();
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
  dayCal: (g, s) => C.dayCal(g, s.opts), monthCal: (g, s) => C.monthCal(g, s.opts), letter: (g, s) => C.letter(g, s.opts), goods: (g, s) => C.goods(g, s.opts.kind),
  shell: (g, s) => C.shell(g, s.opts), shellC: (g, s) => C.shell(g, s.opts), leaflet: (g, s) => C.leaflet(g, s.t), knife: (g) => C.knife(g), lantern: (g) => C.lantern(g), pile: (g, s) => C.shellPile(g, s.opts.h),
};
const SIZE = { dayCal: [360, 460, 450], monthCal: [640, 620, 610], letter: [560, 720, 710], goods: [300, 300, 290], shell: [220, 460, 450], shellC: [220, 460, 230], leaflet: [160, 120, 60], knife: [520, 220, 110], lantern: [200, 260, 0], pile: [900, 520, 505], dog: [600, 420, 405], palanquin: [900, 600, 470], bag: [300, 340, 330], rp: [240, 200, 100], cabin: [1500, 560, 280], label: [700, 220, 110], note: [600, 300, 150], scissors: [700, 300, 150], calendar: [360, 460, 450], price: [520, 420, 410], safe: [420, 520, 510], moth: [140, 120, 60], banana: [300, 200, 190], sewing: [560, 440, 425], stamp: [1000, 360, 180], q: [220, 220, 210], plate: [600, 160, 150], rat: [600, 420, 405], coin: [120, 120, 60], tails: [600, 700, 690], basket: [300, 260, 250], poster: [600, 820, 810], heart: [160, 160, 80], bang2: [120, 200, 190], person: [900, 1000, 975], personSide: [900, 1000, 975], pig: [600, 420, 405], potato: [200, 160, 150], grave: [360, 520, 505], flowers: [200, 200, 190], bang: [500, 500, 250], puff: [300, 300, 190], smoke: [400, 300, 160], bird: [160, 100, 50], z: [200, 200, 100], leaf: [80, 80, 40], snow: [64, 64, 32], spark: [200, 200, 100], thud: [500, 300, 220] };
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
  (WORLD.cannons ?? []).forEach((c, i) => { const k = st.guns?.[i] ?? { recoil: 0, elev: 0.32 }; c.bar.position.z = k.recoil; c.piv.rotation.x = k.elev; });
  const bt = st.boat ?? { x: -60, z: -98, rock: 0 }; WORLD.boat.position.set(bt.x, 0, bt.z); WORLD.boat.rotation.z = bt.rock; WORLD.boat.rotation.y = bt.ry ?? 0;
  WORLD.door.rotation.y = st.door ?? -1.4;
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
