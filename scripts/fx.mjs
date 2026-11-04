#!/usr/bin/env node
/**
 * Generates the small graphic files the site uses (run by hand, output is committed):
 *   public/fx/wash.webp  — 16-frame noise "ink wash" mask sprite, used by the page
 *                          transition and the viewer's ink-bleed reveal
 *   public/favicon.svg, favicon-32.png, apple-touch-icon.png, icon-512.png — a pigment drop
 *   node scripts/fx.mjs
 */
import sharp from 'sharp';

/* ── value noise + fbm (same recipe as the home shader) ── */
const fract = (x) => x - Math.floor(x);
const hash = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
const noise = (x, y) => {
  const ix = Math.floor(x), iy = Math.floor(y);
  let fx = x - ix, fy = y - iy;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};
const fbm = (x, y) => { let s = 0, a = 0.5; for (let i = 0; i < 5; i++) { s += a * noise(x, y); x = x * 2.02 + 1.7; y = y * 2.02 + 9.2; a *= 0.5; } return s; };
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

/* ── wash sprite ── */
const FW = 192, FH = 120, N = 16;
const field = new Float32Array(FW * FH);
for (let y = 0; y < FH; y++)
  for (let x = 0; x < FW; x++) {
    const u = x / FW, v = y / FH;
    // domain-warped fbm, plus a gentle pull from the lower left so the wash travels
    const qx = fbm(u * 3.2, v * 2.2), qy = fbm(u * 3.2 + 5.2, v * 2.2 + 1.3);
    const f = fbm(u * 3.2 + 2.4 * qx, v * 2.2 + 2.4 * qy);
    field[y * FW + x] = 0.72 * f + 0.28 * (1 - (u * 0.6 + (1 - v) * 0.4));
  }
let lo = Infinity, hi = -Infinity;
for (const f of field) { lo = Math.min(lo, f); hi = Math.max(hi, f); }
const px = Buffer.alloc(FW * N * FH * 4);
for (let k = 0; k < N; k++) {
  const t = 1.08 - (k / (N - 1)) * 1.16; // threshold falls from above the max to below the min
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const f = (field[y * FW + x] - lo) / (hi - lo);
      const a = k === 0 ? 0 : k === N - 1 ? 1 : smooth(t - 0.05, t + 0.05, f);
      const i = (y * FW * N + k * FW + x) * 4;
      px[i] = px[i + 1] = px[i + 2] = 255;
      px[i + 3] = Math.round(a * 255);
    }
}
await sharp(px, { raw: { width: FW * N, height: FH, channels: 4 } }).webp({ quality: 70, alphaQuality: 70, effort: 6 }).toFile('public/fx/wash.webp');

/* ── favicon: a drop of the four pigments ── */
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs>
<radialGradient id="a" cx="38%" cy="36%" r="60%"><stop offset="0" stop-color="#F2B833"/><stop offset=".45" stop-color="#DB3821"/><stop offset="1" stop-color="#DB3821" stop-opacity="0"/></radialGradient>
<radialGradient id="b" cx="66%" cy="68%" r="58%"><stop offset="0" stop-color="#1C2B94"/><stop offset=".6" stop-color="#1C2B94" stop-opacity=".85"/><stop offset="1" stop-color="#1C2B94" stop-opacity="0"/></radialGradient>
<radialGradient id="c" cx="30%" cy="74%" r="40%"><stop offset="0" stop-color="#0A6B5C"/><stop offset="1" stop-color="#0A6B5C" stop-opacity="0"/></radialGradient>
</defs>
<rect width="64" height="64" rx="14" fill="#F2F0EB"/>
<circle cx="32" cy="32" r="22" fill="url(#b)"/><circle cx="32" cy="32" r="22" fill="url(#c)"/><circle cx="32" cy="32" r="22" fill="url(#a)"/>
</svg>`;
const fs = await import('node:fs');
fs.writeFileSync('public/favicon.svg', svg);
for (const [file, size] of [['public/favicon-32.png', 32], ['public/apple-touch-icon.png', 180], ['public/icon-512.png', 512]])
  await sharp(Buffer.from(svg), { density: Math.ceil((size / 64) * 72 * 2) }).resize(size, size).png().toFile(file);
console.log('fx done');
