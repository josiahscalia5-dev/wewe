// Renders the interim art layers into /art by driving the three.js studio in headless
// Chromium (WebGL via SwiftShader). usage: node render.mjs [layer-name-or-prefix ...]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../../art');
const exe = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const filters = process.argv.slice(2);
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.ttf': 'font/ttf', '.json': 'application/json', '.png': 'image/png' };

const browser = await chromium.launch({
  executablePath: exe,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.route('http://studio.local/**', async (route) => {
  const url = new URL(route.request().url());
  const file = path.join(here, decodeURIComponent(url.pathname));
  if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: 'nf' });
  route.fulfill({ status: 200, body: fs.readFileSync(file), contentType: types[path.extname(file)] || 'application/octet-stream' });
});
await page.goto('http://studio.local/studio/index.html');
await page.waitForFunction(() => window.studioReady === true, null, { timeout: 120000 });
const names = await page.evaluate(() => window.layerNames());
const todo = names.filter((n) => filters.length === 0 || filters.some((f) => n === f || n.startsWith(f)));
fs.mkdirSync(outDir, { recursive: true });
for (const name of todo) {
  const t0 = Date.now();
  const dataUrl = await page.evaluate(async (n) => await window.renderLayer(n), name);
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  fs.writeFileSync(path.join(outDir, name + '.png'), buf);
  console.log(`${name}.png  ${(buf.length / 1024).toFixed(0)} KB  ${Date.now() - t0} ms`);
}
await browser.close();
