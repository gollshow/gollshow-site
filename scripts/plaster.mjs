#!/usr/bin/env node
/**
 * The studio wall's plaster: a 384 px tileable texture (fine grit over slow
 * stains), dark specks with alpha, laid over the wall colour. Pre-rendered so
 * the browser does not rasterize an SVG filter on the main thread.
 *   node scripts/plaster.mjs  → public/wall/plaster.webp
 */
import sharp from 'sharp';

const N = 384;
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
// periodic value noise: lattice of size p wraps around the tile
function layer(p) {
  const g = Array.from({ length: p * p }, rnd);
  const at = (x, y) => g[((y % p) + p) % p * p + (((x % p) + p) % p)];
  const s = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = (x / N) * p;
    const fy = (y / N) * p;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = s(fx - ix);
    const ty = s(fy - iy);
    const a = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * tx;
    const b = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * tx;
    return a + (b - a) * ty;
  };
}
const stains = [layer(3), layer(6), layer(12)];
const grit = [layer(96), layer(192)];
const px = Buffer.alloc(N * N * 4);
for (let y = 0; y < N; y++)
  for (let x = 0; x < N; x++) {
    const st = stains[0](x, y) * 0.55 + stains[1](x, y) * 0.3 + stains[2](x, y) * 0.15;
    const gr = grit[0](x, y) * 0.5 + grit[1](x, y) * 0.5;
    const a = Math.max(0, (st - 0.45) * 0.4) + Math.max(0, (gr - 0.55) * 0.3);
    const i = (y * N + x) * 4;
    const light = gr > 0.86 ? 1 : 0; // a few pale grains catch the light
    px[i] = px[i + 1] = px[i + 2] = light ? 235 : 0;
    px[i + 3] = Math.round(Math.min(1, light ? 0.08 : a) * 255);
  }
await sharp(px, { raw: { width: N, height: N, channels: 4 } }).webp({ quality: 50, alphaQuality: 40, effort: 6 }).toFile('public/wall/plaster.webp');
console.log('plaster.webp written');
