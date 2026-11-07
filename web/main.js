// Engine + world for "Perang Babi". Pure function of the frame: window.renderFrame(f) -> JPEG data URL.
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
export const ISL = { a: 98, b: 64 };
const sm = (x) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
const islE = (x, z) => { const ang = Math.atan2(z, x); return Math.hypot(x / ISL.a, z / ISL.b) * (1 + 0.05 * Math.sin(ang * 5 + 1) + 0.035 * Math.sin(ang * 9 + 2)); };
export const ground = (x, z) => {
  const e = islE(x, z);
  if (z < -300) return 0; // hall
  let h = e < 0.82 ? 1.6 : e < 1 ? 1.6 - ((e - 0.82) / 0.18) * 1.45 : 0.15 - (e - 1) * 12;
  const d = Math.hypot(x * 0.8, z - 12);
  const hill = (3.2 * Math.sin(x * 0.055 + 1) * Math.cos(z * 0.07) + 2.4 * Math.sin(x * 0.09 + z * 0.05 + 2) + 2.5) * sm((d - 42) / 22) * sm((0.86 - e) / 0.2);
  return h + Math.max(0, hill);
};
S.setGround(ground);

const buildTerrain = () => {
  const geo = new THREE.PlaneGeometry(240, 170, 240, 170); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, col = new Float32Array(p.count * 3), uv = geo.attributes.uv;
  const G = new THREE.Color("#86c255"), G2 = new THREE.Color("#6fae47"), SA = new THREE.Color("#f2dca2"), WET = new THREE.Color("#c9b27e");
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = ground(x, z), e = islE(x, z);
    p.setY(i, y); uv.setXY(i, x / 6, z / 6);
    const c = G.clone().lerp(G2, 0.5 + 0.5 * Math.sin(x * 0.11) * Math.cos(z * 0.13));
    if (e > 0.84) c.lerp(SA, sm((e - 0.84) / 0.05));
    if (e > 0.97) c.lerp(WET, sm((e - 0.97) / 0.04));
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const m = mesh(geo, toon("terrain", { map: P.grassDetail(), vc: true }), "world", false); m.receiveShadow = true;
};
const buildSea = () => {
  const t = P.water(); t.repeat.set(220, 220);
  const geo = new THREE.PlaneGeometry(5000, 5000); geo.rotateX(-Math.PI / 2);
  const m = mesh(geo, toon("sea", { map: t, color: 0xffffff }), "world", false); m.receiveShadow = true; m.position.y = 0;
  WORLD.sea = t;
  // shallow ring
  const rg = new THREE.RingGeometry(0.95, 1.18, 96, 1); rg.rotateX(-Math.PI / 2);
  const rm = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0xbfeaf2, transparent: true, opacity: 0.55, depthWrite: false }));
  rm.scale.set(ISL.a, 1, ISL.b); rm.position.y = 0.05; rm.userData.kind = "soft"; scene.add(rm);
};
const WORLD = {};
const tree = (x, z, kind, s = 1) => {
  const y = ground(x, z);
  if (kind === "pine") {
    addB(new THREE.CylinderGeometry(0.22 * s, 0.3 * s, 2 * s, 6), toon("trunk", { color: 0x6b4429 }), M4(x, y + s, z));
    for (let i = 0; i < 3; i++) addB(new THREE.ConeGeometry((2.4 - i * 0.6) * s, 3 * s, 7), toon("pine", { color: 0x2f6e43 }), M4(x, y + (2.6 + i * 1.6) * s, z, i));
  } else {
    addB(new THREE.CylinderGeometry(0.2 * s, 0.32 * s, 2.4 * s, 6), toon("trunk", { color: 0x6b4429 }), M4(x, y + 1.2 * s, z));
    const g = new THREE.IcosahedronGeometry(1.9 * s, 1);
    WORLD.leafGeos.push((g.index ? g.toNonIndexed() : g).applyMatrix4(M4(x, y + 3.6 * s, z, x, 0, 0, 1.1, 0.95, 1.1)));
  }
};
const fence = () => {
  const post = toon("post", { map: UpPaint.planksHD(), color: 0xe6cdb6 });
  const pts = []; const X0 = -6, X1 = 6, Z0 = -4, Z1 = 4;
  for (let x = X0; x <= X1 + 0.01; x += 1.5) { pts.push([x, Z0]); pts.push([x, Z1]); }
  for (let z = Z0 + 1.6; z < Z1; z += 1.6) { pts.push([X0, z]); if (z < 1.5 || z > 3.7) pts.push([X1, z]); }
  for (const [x, z] of pts) box(0.14, 1.15, 0.14, post, x, 1.6, z, 0, 1.6);
  const rail = (ax, az, bx, bz, y) => { const l = Math.hypot(bx - ax, bz - az); box(l, 0.1, 0.06, post, (ax + bx) / 2, y, (az + bz) / 2, -Math.atan2(bz - az, bx - ax), 1.6); };
  for (const y of [1.6 + 0.45, 1.6 + 0.9]) {
    rail(X0, Z0, X1, Z0, y); rail(X0, Z1, X1, Z1, y); rail(X0, Z0, X0, Z1, y);
    rail(X1, Z0, X1, 1.6, y);
  }
  // broken rail hanging at the gap
  box(1.4, 0.1, 0.06, post, X1 + 0.35, 1.6, 2.6, 1.2, 1); box(0.14, 1.15, 0.14, post, X1, 1.6, 4, 0, 0.5);
};
const garden = () => {
  const s = P.soil(); const sg = new THREE.PlaneGeometry(11.4, 7.4); sg.rotateX(-Math.PI / 2);
  const sm_ = mesh(sg, toon("soil", { map: s }), "world", false); sm_.position.set(0, 1.615, 0); sm_.receiveShadow = true;
  const leaf = toon("plant", { color: 0x4f9a3f }), mound = toon("mound", { map: s, color: 0xd9c0a8 });
  for (const z of [-2.9, -1.5, -0.1, 1.3]) {
    box(10.4, 0.16, 0.7, mound, 0, 1.6, z, 0, 2);
    for (let x = -4.8; x <= 4.8; x += 1.2) {
      const g = new THREE.IcosahedronGeometry(0.42, 0);
      addB(g, leaf, M4(x + 0.15 * Math.sin(z * 7 + x), 1.95, z, x * 3, 0, 0, 1.1, 0.75, 1.1));
      addB(new THREE.IcosahedronGeometry(0.3, 0), toon("plant2", { color: 0x5fae4a }), M4(x + 0.25, 2.12, z + 0.12, x, 0, 0, 1, 0.8, 1));
    }
  }
  fence();
};
const cabin = (x, z) => {
  const y = ground(x, z), logs = toon("logs", { map: P.logs() }), roofM = toon("roof", { map: UpPaint.roofHD("#9a5a44") }), dark = toon("dark", { color: 0x2a1c1a });
  box(7, 3.2, 5, logs, x, y, z, 0, 2.4);
  const r = new THREE.Mesh(); // roof prism along x
  addB(prismGeo(6, 2.2, 7.8, 2), roofM, M4(x, y + 3.2, z, Math.PI / 2, 0, 0, 1.0, 1, 1));
  box(1.1, 2.0, 0.12, toon("door", { map: P.planks("#7d5234", "doorw") }), x - 1.2, y, z + 2.52, 0, 0.6);
  box(1.0, 0.9, 0.1, toon("win", { color: 0x8fd3ff }), x + 1.6, y + 1.3, z + 2.52);
  box(1.2, 0.12, 0.2, logs, x + 1.6, y + 1.2, z + 2.6, 0, 1);
  box(0.8, 4.2, 0.8, toon("stone", { map: UpPaint.stoneHD() }), x + 2.6, y + 1.4, z - 1.2, 0, 1.2);
  box(1.6, 0.12, 1.1, toon("porch", { map: UpPaint.planksHD() }), x - 1.2, y, z + 3.0, 0, 1.6);
};
const tent = (x, z, ry, col) => { const y = ground(x, z); addB(prismGeo(2.8, 2.2, 3.4, 1.4), toon("tent" + col, { map: P.canvasCloth(col) }), M4(x, y, z, ry)); };
const sentry = (x, z, ry, col) => {
  const y = ground(x, z), m = toon("sentry" + col, { map: P.planks(col, "sent" + col) });
  box(1.4, 2.4, 1.4, m, x, y, z, ry, 1); addB(prismGeo(1.8, 0.7, 1.8, 1), toon("roof"), M4(x, y + 2.4, z, ry));
};
const flagPole = (x, z, h, kind, size) => {
  const y = ground(x, z);
  addB(new THREE.CylinderGeometry(0.07 * size, 0.1 * size, h, 8), toon("pole", { color: 0xe8e2d4 }), M4(x, y + h / 2, z));
  addB(new THREE.SphereGeometry(0.16 * size, 8, 6), toon("gold", { color: 0xe8c45a }), M4(x, y + h + 0.1, z));
  const c = document.createElement("canvas"); c.width = 330; c.height = 210; const g = c.getContext("2d");
  (kind === "us" ? C.flagUS : C.flagUK)(g, 0, 0, 330, 210);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(1.5 * size, 1.0 * size, 14, 8); geo.translate(0.75 * size, 0, 0);
  const m = mesh(geo, toonM({ map: t, side: THREE.DoubleSide }), "world", true);
  m.position.set(x + 0.08 * size, y + h - 0.5 * size, z);
  m.userData.base = geo.attributes.position.array.slice(); m.userData.size = size;
  WORLD.flags.push(m); return m;
};
const ship = (x, z, ry) => {
  const g = new THREE.Group(); g.userData.kind = "group";
  const hull = new THREE.Shape(); // side profile, length 24 (x), height 5
  hull.moveTo(-11, 1.2); hull.lineTo(10, 1.0); hull.quadraticCurveTo(13.5, 2.6, 13, 5); hull.lineTo(-12.2, 5.4); hull.quadraticCurveTo(-12.6, 3, -11, 1.2);
  const hg = new THREE.ExtrudeGeometry(hull, { depth: 6, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.4, bevelSegments: 2 }); hg.translate(0, -1.4, -3);
  const uv = hg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 24 + 0.5, uv.getY(i) / 6 + 0.1);
  const ht = P.hullTex(); ht.wrapT = THREE.ClampToEdgeWrapping;
  const add = (geo, mat, m4) => { const m = new THREE.Mesh(geo, mat); if (m4) m.applyMatrix4(m4); m.castShadow = m.receiveShadow = true; m.userData.kind = "world"; g.add(m); };
  add(hg, toon("hull", { map: ht }));
  add(tboxGeo(24, 0.3, 6.4, 1.6), toon("deck", { map: UpPaint.planksHD() }), M4(0, 3.95, 0));
  const sail = toon("sail", { map: P.canvasCloth("#f4ecd6"), side: THREE.DoubleSide });
  for (const [mx, mh] of [[-6, 17], [1, 20], [8, 15]]) {
    add(new THREE.CylinderGeometry(0.22, 0.32, mh, 8), toon("mast", { color: 0x6b4429 }), M4(mx, 4 + mh / 2, 0));
    for (const [sy, sw, sh] of [[0.28, 9, 5], [0.58, 7, 4.2], [0.82, 5, 3]]) {
      const sg = new THREE.PlaneGeometry(sw, sh, 6, 4); const sp = sg.attributes.position;
      for (let i = 0; i < sp.count; i++) { const u = sp.getX(i) / (sw / 2), v = sp.getY(i) / (sh / 2); sp.setZ(i, 0.8 * (1 - u * u) * (1 - 0.3 * v * v)); }
      sg.computeVertexNormals();
      add(sg, sail, M4(mx + 0.4, 4 + mh * sy + sh / 2, 0.2, Math.PI / 2 - 0.75));
      add(new THREE.CylinderGeometry(0.1, 0.1, sw + 0.6, 6), toon("mast"), M4(mx + 0.4, 4 + mh * sy + sh, 0.2, -0.75, Math.PI / 2, 0));
    }
  }
  add(new THREE.CylinderGeometry(0.09, 0.09, 12, 6), toon("mast"), M4(15, 7, 0, 0, 0, -1.1)); // bowsprit
  // ensign at the stern
  const c = document.createElement("canvas"); c.width = 330; c.height = 210; C.flagUK(c.getContext("2d"), 0, 0, 330, 210);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const fgeo = new THREE.PlaneGeometry(4.2, 2.8, 12, 6); fgeo.translate(-2.1, 0, 0);
  const fm = new THREE.Mesh(fgeo, toonM({ map: t, side: THREE.DoubleSide }));
  fm.position.set(-12.6, 9, 0); fm.rotation.y = Math.PI / 2 * 0; fm.userData.kind = "world"; fm.userData.base = fgeo.attributes.position.array.slice(); fm.userData.size = 2.8; fm.userData.dir = -1;
  g.add(fm); WORLD.flags.push(fm);
  add(new THREE.CylinderGeometry(0.08, 0.08, 6, 6), toon("pole"), M4(-12.4, 7.5, 0));
  g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  return g;
};
const mountains = () => {
  const m = toon("mtn", { color: 0x6d86b4 }), snow = toon("snow", { color: 0xf4f7fb });
  const pk = [[-520, 900, 170, 120], [-160, 1050, 240, 175], [240, 950, 160, 110], [560, 880, 130, 90], [-650, -900, 180, 110], [100, -1050, 230, 160], [600, -880, 150, 100], [-1100, 0, 170, 120], [1100, 120, 190, 140]];
  for (const [x, z, r, h] of pk) {
    addB(new THREE.ConeGeometry(r, h, 9), m, M4(x, h / 2 - 10, z, x));
    addB(new THREE.ConeGeometry(r * 0.36, h * 0.36, 9), snow, M4(x, h - 10 - h * 0.18 + 0.5, z, x));
  }
  const isl = toon("farisl", { color: 0x5f8f55 });
  for (const [x, z, s] of [[-260, 260, 60], [300, 330, 45], [-380, -200, 70], [260, -300, 55], [420, 40, 40]]) addB(new THREE.SphereGeometry(s, 12, 8), isl, M4(x, -s * 0.8, z, 0, 0, 0, 1.8, 1, 1));
};
const rocks = () => {
  const r = toon("rock", { map: UpPaint.stoneHD() });
  for (let i = 0; i < 26; i++) { const a = i * 2.39, e = 0.96 + 0.04 * Math.sin(i * 3.3), x = Math.cos(a) * ISL.a * e, z = Math.sin(a) * ISL.b * e; if (Math.abs(x) < 25 && z > 40) continue; addB(new THREE.DodecahedronGeometry(1 + (i % 3) * 0.7, 0), r, M4(x, ground(x, z) + 0.2, z, i, i * 0.7)); }
};
const hall = () => {
  const ox = 0, oz = -500, wpM = toon("wall", { map: P.wallpaper() }), wood = toon("wood", { map: P.planks("#7a4a2a", "floorw") });
  box(18, 0.2, 14, wood, ox, -0.2, oz, 0, 2);                    // floor
  box(18, 9, 0.4, wpM, ox, 0, oz - 6, 0, 3);                      // back wall
  box(0.4, 9, 14, wpM, ox - 8.5, 0, oz, 0, 3); box(0.4, 9, 14, wpM, ox + 8.5, 0, oz, 0, 3);
  box(18, 1.2, 0.5, toon("wains", { map: P.planks("#5a3420", "wainw") }), ox, 0, oz - 5.8, 0, 1);
  const carpetT = P.carpet(); const cg = new THREE.PlaneGeometry(3, 12); cg.rotateX(-Math.PI / 2);
  const cm = mesh(cg, toon("carpet", { map: carpetT }), "world", false); cm.position.set(ox, 0.02, oz + 1);
  for (const x of [-5.5, 5.5]) { // tall windows with light
    box(2.4, 5, 0.1, new THREE.MeshBasicMaterial({ color: 0xfff1cc }), ox + x, 2, oz - 5.75);
    box(2.8, 0.25, 0.3, toon("gold"), ox + x, 7, oz - 5.7);
    box(0.25, 5, 0.3, toon("wains"), ox + x, 2, oz - 5.7);
  }
  for (const x of [-8, 8]) box(1, 9, 1, toon("col", { color: 0xe6dcc8 }), ox + x * 0.82, 0, oz - 5, 0);
  // desk
  const desk = toon("desk", { map: UpPaint.planksHD(), color: 0x8a5a40 });
  box(4.2, 1.05, 1.6, desk, ox - 1.2, 0, oz - 1.4, 0, 1);
  box(4.5, 0.12, 1.9, toon("deskTop", { color: 0x3a2418 }), ox - 1.2, 1.05, oz - 1.4);
  box(5.5, 0.55, 2.4, toon("dais", { map: P.planks("#5a3420", "daisw") }), ox - 1.2, 0, oz - 3.0, 0, 1);
  // map framed on the back wall
  const c = document.createElement("canvas"); c.width = 900; c.height = 640;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const mm = mesh(new THREE.PlaneGeometry(2.9, 2.06), new THREE.MeshBasicMaterial({ map: t }), "world", false); mm.position.set(ox - 0.9, 4.25, oz - 5.74);
  box(3.2, 2.36, 0.08, toon("gold"), ox - 0.9, 4.25 - 1.18, oz - 5.82);
  WORLD.map = { c, t, win: -1 };
  // banners
  for (const x of [-4.6, 2.8]) box(1.4, 3.6, 0.08, toon("banner", { color: 0x2c3b63 }), ox + x, 3.4, oz - 5.75);
};

const buildWorld = () => {
  WORLD.flags = []; WORLD.leafGeos = [];
  buildTerrain(); buildSea(); garden(); cabin(-3, -12);
  // camps
  for (const [x, z, r] of [[30, 18, -0.3], [34, 24, -0.2], [27, 27, 0.1], [36, 31, -0.4]]) tent(x, z, r, "#f1ead8");
  for (const [x, z, r] of [[-30, 18, 0.3], [-34, 24, 0.2], [-27, 27, -0.1], [-36, 31, 0.4]]) tent(x, z, r, "#efe2c8");
  sentry(9, 22, -0.4, "#5a6f9a"); sentry(-9, 22, 0.4, "#b5463c");
  WORLD.usFlag = flagPole(14, 21, 9, "us", 3); WORLD.ukFlag = flagPole(-14, 21, 9, "uk", 3);
  WORLD.cabinFlag = flagPole(1.4, -9.2, 5, "us", 1.2);
  WORLD.hookUS = flagPole(3.4, 31, 5, "us", 1.6); WORLD.hookUK = flagPole(-3.4, 31, 5, "uk", 1.6);
  // trees (avoid action areas)
  const r = P.rng(77);
  let n = 0;
  while (n < 90) {
    const x = (r() - 0.5) * 190, z = (r() - 0.5) * 125, e = islE(x, z);
    if (e > 0.8) continue;
    if (Math.hypot(x, z) < 13 || (x > 4 && x < 20 && z > -2 && z < 8) || (Math.abs(x) < 16 && z > 12 && z < 48) || Math.hypot(x + 3, z + 12) < 8 || (Math.abs(x) > 22 && Math.abs(x) < 40 && z > 13 && z < 36) || (x > 6 && x < 60 && z > 32 && z < 50) || (x > 1 && x < 15 && z > 7 && z < 22)) continue;
    tree(x, z, r() < 0.55 ? "pine" : "round", 0.8 + r() * 0.6); n++;
  }
  for (const [x, z] of [[-9, -2], [9.5, -6], [-10, 7], [11, 9], [-16, -14], [7, -16]]) tree(x, z, "round", 1.1);
  for (const [x, z] of [[-20, 6], [19, 2], [-14, 40], [-22, 44], [-8, 46]]) tree(x, z, "pine", 1.2);
  rocks(); mountains(); hall();
  flush();
  const lg = mergeGeometries(WORLD.leafGeos, false);
  WORLD.leaf = mesh(lg, toonM({ color: 0x5aa548 }), "world", true);
  // ships
  WORLD.ships = [ship(-24, 92, 0.42), ship(6, 104, 0.35), ship(32, 88, 0.5)];
  // grave set
  WORLD.season = 0;
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
  pig: (g, s) => C.pig(g, s.opts),
  potato: (g, s) => C.potato(g, s.bite ?? 0),
  grave: (g) => C.grave(g),
  flowers: (g, s) => C.flowers(g, s.col, s.seed),
  bang: (g, s) => C.fxBang(g, s.t), puff: (g, s) => C.fxPuff(g, s.t), smoke: (g, s) => C.fxSmoke(g, s.t), bird: (g, s) => C.fxBird(g, s.t),
  z: (g, s) => C.fxZ(g, s.t), leaf: (g, s) => C.fxLeaf(g, s.col), snow: (g) => C.fxSnow(g), spark: (g, s) => C.fxSpark(g, s.t), thud: (g, s) => C.fxThud(g, s.t),
};
const SIZE = { person: [900, 1000, 975], personSide: [900, 1000, 975], pig: [600, 420, 405], potato: [200, 160, 150], grave: [360, 520, 505], flowers: [200, 200, 190], bang: [500, 500, 250], puff: [300, 300, 190], smoke: [400, 300, 160], bird: [160, 100, 50], z: [200, 200, 100], leaf: [80, 80, 40], snow: [64, 64, 32], spark: [200, 200, 100], thud: [500, 300, 220] };
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
    const key = JSON.stringify([s.type, s.outfit ?? 0, s.opts ?? 0, s.t ?? 0, s.bite ?? 0, s.facing ?? 1, k, s.col ?? 0]);
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
const GMAP = { day: "day", golden: "golden", dusk: "golden", night: "day", hall: "golden", cycle: "day" };
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
  for (const c of clouds) c.lookAt(camera.position);
  // world state
  const st = S.worldAt(f);
  WORLD.sea.offset.set((f * 0.0012) % 1, (f * 0.0007) % 1);
  waveFlags(f);
  WORLD.ships.forEach((s, i) => { const sp = st.ships[i]; s.visible = sp.vis; s.position.set(sp.x, 0.2 * Math.sin(f * 0.08 + i * 2), sp.z); s.rotation.y = [0.42, 0.35, 0.5][i]; s.rotation.z = 0.02 * Math.sin(f * 0.06 + i); s.rotation.x = 0.015 * Math.sin(f * 0.05 + i * 3); });
  for (const [fl, k] of [[WORLD.usFlag, "us"], [WORLD.ukFlag, "uk"]]) { const sc = st.flagPop; fl.scale.setScalar(Math.max(0.001, sc)); }
  WORLD.leaf.material.color.set(st.leafCol);
  if (WORLD.map.win !== st.mapWin) { WORLD.map.win = st.mapWin; const g = WORLD.map.c.getContext("2d"); g.clearRect(0, 0, 900, 640); C.islandMap(g, st.mapWin); WORLD.map.t.needsUpdate = true; }
  updateCards(S.cardsAt(f, camera.position), L.cardTint);
  // grade
  inkQ.u.flash.value = S.flashAt(f); inkQ.u.sat.value = L.sat ?? 1.08; inkQ.u.contrast.value = L.contrast ?? 0.2; inkQ.u.shTint.value.set(...(L.shTint ?? [0, 0, 0])); inkQ.u.hiTint.value.set(...(L.hiTint ?? [0, 0, 0]));
  inkQ.u.gain.value.set(...(L.gain ?? [1, 1, 1])); inkQ.u.lift.value.set(...(L.lift ?? [0, 0, 0]));
  const dof = S.dofAt(f); dofQ.u.focus.value = dof.focus; dofQ.u.cInf.value = dof.cInf;
  if (dbg !== "old") {
    noInkLayers();
    const sid = S.shotAt(f), gl = GMAP[sid.id === 10 ? "golden" : sid.light] ?? "day";
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
