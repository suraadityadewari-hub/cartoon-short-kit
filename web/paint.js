// Painted canvas textures: flat colour with darker seams and a few strokes.
import * as THREE from "./three.module.js";
import { hexMul, mix } from "./pen.js";

export const rng = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const cache = new Map();
export const ctex = (key, w, h, draw, rep = [1, 1]) => {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"); draw(g, rng(key.length * 7919 + w));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
  cache.set(key, t); return t;
};
const jit = (r, hex, dv = 0.08) => hexMul(hex, 1 + (r() - 0.5) * 2 * dv);

/** near-white detail for terrain: hue comes from vertex colours */
export const grassDetail = () => ctex("grassD", 512, 512, (g, r) => {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) {
    const x = r() * 512, y = r() * 512, l = 6 + r() * 10, a = -0.3 + r() * 0.6;
    g.strokeStyle = r() < 0.5 ? "rgba(70,110,40,0.22)" : "rgba(255,255,220,0.35)"; g.lineWidth = 2 + r() * 2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * l, y - Math.cos(a) * l); g.stroke();
  }
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(90,130,60,0.12)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 40, 10 + r() * 20, r() * 3, 0, 7); g.fill(); }
});
export const soil = () => ctex("soil", 512, 512, (g, r) => {
  g.fillStyle = "#8a5a36"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? "rgba(60,36,20,0.35)" : "rgba(180,130,90,0.3)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 2 + r() * 6, 1 + r() * 4, r() * 3, 0, 7); g.fill(); }
  for (let y = 0; y < 512; y += 64) { g.fillStyle = "rgba(60,36,20,0.25)"; g.fillRect(0, y + 28, 512, 8); }
});
export const sand = () => ctex("sand", 512, 512, (g, r) => {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? "rgba(150,120,80,0.18)" : "rgba(255,255,255,0.5)"; g.fillRect(r() * 512, r() * 512, 2 + r() * 3, 2 + r() * 3); }
});
export const logs = () => ctex("logs", 512, 512, (g, r) => {
  const n = 8, h = 512 / n;
  for (let i = 0; i < n; i++) {
    const c = jit(r, "#9a6438");
    const gr = g.createLinearGradient(0, i * h, 0, (i + 1) * h); gr.addColorStop(0, hexMul(c, 1.12)); gr.addColorStop(0.6, c); gr.addColorStop(1, hexMul(c, 0.62));
    g.fillStyle = gr; g.fillRect(0, i * h, 512, h);
    g.strokeStyle = "#3d2414"; g.lineWidth = 5; g.beginPath(); g.moveTo(0, (i + 1) * h - 2); g.lineTo(512, (i + 1) * h - 2); g.stroke();
    for (let k = 0; k < 4; k++) { g.strokeStyle = "rgba(60,30,15,0.35)"; g.lineWidth = 2; const y = i * h + 8 + r() * (h - 16), x = r() * 400; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40 + r() * 80, y + (r() - 0.5) * 4); g.stroke(); }
  }
});
export const planks = (col = "#a8744a", key = "planks") => ctex(key, 512, 512, (g, r) => {
  const n = 6, w = 512 / n;
  for (let i = 0; i < n; i++) {
    g.fillStyle = jit(r, col); g.fillRect(i * w, 0, w, 512);
    g.fillStyle = "#3d2414"; g.fillRect(i * w, 0, 4, 512);
    for (let k = 0; k < 5; k++) { g.strokeStyle = "rgba(60,30,15,0.3)"; g.lineWidth = 2; const x = i * w + 8 + r() * (w - 16), y = r() * 400; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y + 60 + r() * 80); g.stroke(); }
    if (r() < 0.6) { g.fillStyle = "#3d2414"; g.beginPath(); g.arc(i * w + w / 2, 30 + r() * 450, 4, 0, 7); g.fill(); }
  }
});
export const shingles = (col = "#7a4a3a") => ctex("shingles" + col, 512, 512, (g, r) => {
  const rows = 10, h = 512 / rows;
  for (let j = 0; j < rows; j++) {
    const off = (j % 2) * 32;
    for (let x = -64 + off; x < 512; x += 64) {
      const c = jit(r, col, 0.1); g.fillStyle = c; g.fillRect(x, j * h, 64, h);
      g.fillStyle = hexMul(c, 0.7); g.fillRect(x, j * h + h - 8, 64, 8);
      g.fillStyle = "#2a1a16"; g.fillRect(x, j * h, 3, h);
    }
  }
});
export const canvasCloth = (col = "#f1ead8") => ctex("cloth" + col, 256, 256, (g, r) => {
  g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4; i++) { g.fillStyle = "rgba(120,100,70,0.25)"; g.fillRect(i * 64, 0, 3, 256); }
  for (let i = 0; i < 300; i++) { g.fillStyle = "rgba(150,130,100,0.08)"; g.fillRect(r() * 256, r() * 256, 3, 3); }
});
export const hullTex = () => ctex("hull", 1024, 256, (g, r) => {
  g.fillStyle = "#3a2a24"; g.fillRect(0, 0, 1024, 256);
  for (let y = 0; y < 256; y += 32) { g.fillStyle = jit(r, "#3a2a24", 0.15); g.fillRect(0, y, 1024, 30); }
  g.fillStyle = "#e8c45a"; g.fillRect(0, 70, 1024, 46);
  g.fillStyle = "#1a1210"; for (let x = 30; x < 1024; x += 78) g.fillRect(x, 78, 36, 30);
  g.fillStyle = "#f1efe6"; g.fillRect(0, 200, 1024, 10);
});
export const plaster = (col = "#e9dcc0") => ctex("plaster" + col, 512, 512, (g, r) => {
  g.fillStyle = col; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(120,100,70,${0.04 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 30 + r() * 60, 20 + r() * 40, r() * 3, 0, 7); g.fill(); }
});
export const wallpaper = () => ctex("wallpaper", 512, 512, (g, r) => {
  g.fillStyle = "#7a2f35"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(232,196,90,0.35)";
  for (let y = 32; y < 512; y += 96) for (let x = 32 + ((y / 96) % 2) * 48; x < 512; x += 96) { g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x + 12, y); g.lineTo(x, y + 16); g.lineTo(x - 12, y); g.closePath(); g.fill(); }
  g.fillStyle = "#5a1e24"; g.fillRect(0, 0, 4, 512);
});
export const carpet = () => ctex("carpet", 256, 512, (g) => {
  g.fillStyle = "#9c2a2a"; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#e8c45a"; g.fillRect(14, 0, 10, 512); g.fillRect(232, 0, 10, 512);
});
export const water = () => ctex("water", 512, 512, (g, r) => {
  g.fillStyle = "#3f9fd6"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) {
    const x = r() * 512, y = r() * 512, l = 14 + r() * 30;
    g.strokeStyle = r() < 0.7 ? "rgba(220,245,255,0.75)" : "rgba(30,90,150,0.5)"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 4, x + l, y); g.stroke();
  }
});
export const cloud = (seed, lit = "#ffffff", shade = "#d7def0") => ctex("cloud" + seed + lit, 512, 256, (g, r) => {
  const blobs = [[140, 170, 70], [230, 130, 92], [330, 140, 84], [410, 175, 60], [270, 180, 80]];
  for (const [x, y, rr] of blobs) {
    const gr = g.createRadialGradient(x - rr * 0.3, y - rr * 0.4, rr * 0.2, x, y, rr);
    gr.addColorStop(0, lit); gr.addColorStop(0.8, lit); gr.addColorStop(1, shade);
    g.fillStyle = gr; g.beginPath(); g.ellipse(x + (r() - 0.5) * 20, y, rr, rr * 0.82, 0, 0, 7); g.fill();
  }
  g.fillStyle = shade; g.beginPath(); g.ellipse(270, 215, 200, 30, 0, 0, 7); g.fill();
}, [1, 1]);
export const blobTex = () => ctex("blob", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(30,20,40,0.55)"); gr.addColorStop(0.55, "rgba(30,20,40,0.35)"); gr.addColorStop(1, "rgba(30,20,40,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
export const stoneTex = () => ctex("stone", 256, 256, (g, r) => {
  g.fillStyle = "#b8b2a6"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(80,70,60,${0.1 + r() * 0.1})`; g.beginPath(); g.ellipse(r() * 256, r() * 256, 10 + r() * 20, 6 + r() * 12, r() * 3, 0, 7); g.fill(); }
});
