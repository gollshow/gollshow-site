import path from 'node:path';
import sharp from 'sharp';
import type { Media } from './media';

/**
 * Colours taken from the works themselves (at build time):
 *  - swatches(m): the main colours of one image (a small k-means over its pixels)
 *  - accentOf(m): its most telling colour, for the soft glow it casts in the index
 *  - pigmentsOf(m): four pigments from it, for the page head while that work is open
 */
type RGB = [number, number, number];
export type Swatch = { rgb: RGB; n: number };

const cache = new Map<string, Promise<Swatch[]>>();

export function swatches(m: Media, k = 5): Promise<Swatch[]> {
  if (!cache.has(m.file)) {
    cache.set(
      m.file,
      (async () => {
        try {
          const { data, info } = await sharp(path.join(process.cwd(), m.file), { failOn: 'none' })
            .rotate()
            .resize(48, 48, { fit: 'inside' })
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
          const px: RGB[] = [];
          for (let i = 0; i < info.width * info.height; i++) px.push([data[i * 3], data[i * 3 + 1], data[i * 3 + 2]]);
          // k-means, seeded deterministically across the image
          let c: RGB[] = Array.from({ length: k }, (_, j) => px[Math.floor(((j + 0.5) / k) * px.length)]);
          let lab = new Array(px.length).fill(0);
          for (let it = 0; it < 12; it++) {
            lab = px.map((p) => {
              let best = 0, bd = Infinity;
              c.forEach((q, j) => {
                const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
                if (d < bd) (bd = d), (best = j);
              });
              return best;
            });
            c = c.map((q, j) => {
              const mem = px.filter((_, i) => lab[i] === j);
              if (!mem.length) return q;
              return [0, 1, 2].map((ch) => mem.reduce((s, p) => s + p[ch], 0) / mem.length) as RGB;
            });
          }
          return c.map((rgb, j) => ({ rgb, n: lab.filter((l) => l === j).length / px.length })).sort((a, b) => b.n - a.n);
        } catch {
          return [];
        }
      })(),
    );
  }
  return cache.get(m.file)!;
}

const hsl = ([r, g, b]: RGB) => {
  (r /= 255), (g /= 255), (b /= 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
};
const hex = (h: number, s: number, l: number) => {
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};
// A colour as a pigment: a little richer, never washed out or muddy.
const pigment = ([h, s, l]: number[]) => hex(h, Math.min(0.78, Math.max(0.38, s * 1.12)), Math.min(0.58, Math.max(0.32, l)));

/** The work's most telling colour: weighted by how much of it there is and how alive it is. */
export async function accentOf(m: Media): Promise<string> {
  const sw = await swatches(m);
  const best = sw
    .map((x) => ({ x, c: hsl(x.rgb) }))
    .filter(({ c }) => c[2] > 0.12 && c[2] < 0.9)
    .sort((a, b) => b.x.n * (0.15 + b.c[1]) ** 1.6 - a.x.n * (0.15 + a.c[1]) ** 1.6)[0];
  return best ? pigment(best.c) : '#8A8580';
}

/** Four pigments from one work: its strongest colours that are far enough apart. */
export async function pigmentsOf(m: Media, fallback: string[]): Promise<string[]> {
  const cands = (await swatches(m))
    .map((x) => ({ c: hsl(x.rgb), score: x.n * (0.3 + hsl(x.rgb)[1]) }))
    .filter(({ c }) => c[2] > 0.13 && c[2] < 0.9)
    .sort((a, b) => b.score - a.score);
  const out: number[][] = [];
  for (const { c } of cands) {
    const far = out.every((o) => Math.min(Math.abs(o[0] - c[0]), 360 - Math.abs(o[0] - c[0])) > 18 || Math.abs(o[2] - c[2]) > 0.18);
    if (far) out.push(c);
    if (out.length === 4) break;
  }
  if (!out.length) return fallback;
  const res = out.map(pigment);
  while (res.length < 4) res.push(res[res.length % out.length]);
  return res;
}
