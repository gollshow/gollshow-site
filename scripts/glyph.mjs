#!/usr/bin/env node
/**
 * Extracts the 空 glyph from Noto Serif KR (OFL) and writes:
 *   src/generated/kong.json   – outline path, bbox, a focal point deep inside a stroke
 *   public/favicon.svg, public/favicon-32.png, public/apple-touch-icon.png, public/icon-512.png
 * Run once (or when the glyph/weight changes): node scripts/glyph.mjs
 */
import fs from 'node:fs';
import opentype from 'opentype.js';
import sharp from 'sharp';

import { createRequire } from 'node:module';
import path from 'node:path';
const FONT_DIR = path.dirname(createRequire(import.meta.url).resolve('@expo-google-fonts/noto-serif-kr/package.json'));
const load = (k) => {
  const buf = fs.readFileSync(`${FONT_DIR}/${k}/NotoSerifKR_${k}.ttf`);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};

function glyph(font) {
  const p = font.charToGlyph('空').getPath(0, 0, 1000);
  const bb = p.getBoundingBox();
  return { d: p.toPathData(1), bb };
}

const light = glyph(load('300Light'));
const bold = glyph(load('600SemiBold'));
const regular = glyph(load('400Regular'));

// Focal point: the pixel deepest inside the (bold) glyph — where the zoom travels.
const N = 600;
const pad = 20;
const scale = (N - pad * 2) / 1000;
const svgFor = (d, fill = '#000', bg = '#fff') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${N}" height="${N}" viewBox="0 0 ${N} ${N}"><rect width="${N}" height="${N}" fill="${bg}"/><g transform="translate(${pad} ${pad}) scale(${scale}) translate(0 880)"><path d="${d}" fill="${fill}"/></g></svg>`;
const { data } = await sharp(Buffer.from(svgFor(bold.d))).greyscale().raw().toBuffer({ resolveWithObject: true });
const INF = 1e9;
const dist = new Float64Array(N * N);
for (let i = 0; i < N * N; i++) dist[i] = data[i] < 128 ? INF : 0;
// two-pass chamfer distance transform
const at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? 0 : dist[y * N + x]);
for (let y = 0; y < N; y++)
  for (let x = 0; x < N; x++) {
    const i = y * N + x;
    if (!dist[i]) continue;
    dist[i] = Math.min(dist[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.414, at(x + 1, y - 1) + 1.414);
  }
for (let y = N - 1; y >= 0; y--)
  for (let x = N - 1; x >= 0; x--) {
    const i = y * N + x;
    if (!dist[i]) continue;
    dist[i] = Math.min(dist[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.414, at(x - 1, y + 1) + 1.414);
  }
let best = 0;
let bi = 0;
for (let i = 0; i < N * N; i++) if (dist[i] > best) ((best = dist[i]), (bi = i));
const fx = (bi % N - pad) / scale;
const fy = (Math.floor(bi / N) - pad) / scale - 880;

fs.mkdirSync('src/generated', { recursive: true });
fs.writeFileSync(
  'src/generated/kong.json',
  JSON.stringify(
    {
      note: '空 from Noto Serif KR (SIL OFL 1.1). Units: 1000/em, baseline at y=0.',
      light: light.d,
      regular: regular.d,
      bbox: light.bb,
      // the zoom travels into the pillar of 工 (bottom centre); deepest point kept for reference
      focal: { x: 498, y: -150 },
      deepest: { x: Math.round(fx), y: Math.round(fy) },
    },
    null,
    0,
  ),
);

// Icons
const iconSvg = (d, fg, bg, r = 0) => {
  const b = light.bb;
  const w = b.x2 - b.x1;
  const h = b.y2 - b.y1;
  const size = Math.max(w, h) * 1.36;
  const x = b.x1 - (size - w) / 2;
  const y = b.y1 - (size - h) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x.toFixed(0)} ${y.toFixed(0)} ${size.toFixed(0)} ${size.toFixed(0)}">${bg ? `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${size.toFixed(0)}" height="${size.toFixed(0)}" rx="${r}" fill="${bg}"/>` : ''}<path d="${d}" fill="${fg}"/></svg>`;
};
// favicon.svg adapts to the browser theme
const fav = (() => {
  const b = regular.bb;
  const w = b.x2 - b.x1;
  const h = b.y2 - b.y1;
  const size = Math.max(w, h) * 1.12;
  const x = b.x1 - (size - w) / 2;
  const y = b.y1 - (size - h) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x.toFixed(0)} ${y.toFixed(0)} ${size.toFixed(0)} ${size.toFixed(0)}"><style>path{fill:#1a1a18}@media (prefers-color-scheme:dark){path{fill:#ece9e2}}</style><path d="${regular.d}"/></svg>`;
})();
fs.writeFileSync('public/favicon.svg', fav);
await sharp(Buffer.from(iconSvg(regular.d, '#1a1a18', '#f4f2ed'))).resize(32, 32).png().toFile('public/favicon-32.png');
await sharp(Buffer.from(iconSvg(light.d, '#1a1a18', '#f4f2ed'))).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(iconSvg(light.d, '#1a1a18', '#f4f2ed'))).resize(512, 512).png().toFile('public/icon-512.png');
console.log('focal', Math.round(fx), Math.round(fy), 'depth', (best / scale).toFixed(1));
