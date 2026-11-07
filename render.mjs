// node render.mjs <outdir> "<frames>"   frames: "0-1201" or "5,40,90"
import { chromium } from "playwright";
import http from "http"; import fs from "fs"; import path from "path";
const [,, outDir, spec] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const frames = [];
for (const part of spec.split(",")) { const [a, b] = part.split("-").map(Number); if (b === undefined) frames.push(a); else for (let f = a; f <= b; f++) frames.push(f); }
const root = path.resolve("web");
const types = { ".js": "text/javascript", ".html": "text/html" };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split("?")[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); r.end(d); }); }).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("console", (m) => { const t = m.text(); if (!t.includes("useLegacyLights") && !t.includes("THREE.WebGLRenderer") && !t.includes("GPU stall") && !t.includes("toNonIndexed")) console.log("console:", t); });
page.on("pageerror", (e) => { console.log("pageerror:", e.message); process.exit(2); });
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
const resume = process.env.RESUME === "1";
let t0 = Date.now(), n = 0;
for (const f of frames) {
  const out = path.join(outDir, `f${String(f).padStart(4, "0")}.jpg`);
  if (resume && fs.existsSync(out) && fs.statSync(out).size > 1000) continue;
  const url = await page.evaluate(([f, d]) => window.renderFrame(f, d), [f, process.env.DBG || ""]);
  fs.writeFileSync(out, Buffer.from(url.split(",")[1], "base64"));
  n++; if (n % 10 === 0 || frames.length < 40) console.log(`frame ${f} done  avg ${((Date.now() - t0) / n / 1000).toFixed(2)} s/f`);
}
await browser.close(); srv.close();
console.log("DONE", n);
