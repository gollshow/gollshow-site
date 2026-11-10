import path from 'node:path';
import sharp from 'sharp';
import type { Media } from './media';

/**
 * Detail cuts made automatically from large originals (at build time).
 * A work whose original is big enough gets two close-ups, cut where the picture has the
 * most going on (the strongest brushwork and edges), never overlapping. Works with
 * details uploaded in /admin use those instead, and small originals get none: a crop of
 * a 500 px image would show nothing new.
 */
export type Rect = { left: number; top: number; width: number; height: number };

/** Big enough for a close-up to show more than the fitted view does. */
export const bigEnough = (m: Media) => Math.max(m.meta.width, m.meta.height) >= 2400 && Math.min(m.meta.width, m.meta.height) >= 1700;

const cache = new Map<string, Promise<Rect[]>>();

export function detailRects(m: Media, count = 2): Promise<Rect[]> {
  if (!cache.has(m.file)) {
    cache.set(
      m.file,
      (async () => {
        try {
          const W = m.meta.width, H = m.meta.height;
          const gw = 56, gh = Math.max(8, Math.round((gw * H) / W));
          const { data } = await sharp(path.join(process.cwd(), m.file), { failOn: 'none' })
            .rotate()
            .greyscale()
            .resize(gw, gh, { fit: 'fill' })
            .raw()
            .toBuffer({ resolveWithObject: true });
          // how much is going on in each cell: the local change in tone
          const e = new Float32Array(gw * gh);
          for (let y = 1; y < gh - 1; y++)
            for (let x = 1; x < gw - 1; x++) {
              const i = y * gw + x;
              e[i] = Math.abs(data[i + 1] - data[i - 1]) + Math.abs(data[i + gw] - data[i - gw]);
            }
          // summed-area table
          const S = new Float64Array((gw + 1) * (gh + 1));
          for (let y = 0; y < gh; y++)
            for (let x = 0; x < gw; x++) S[(y + 1) * (gw + 1) + x + 1] = e[y * gw + x] + S[y * (gw + 1) + x + 1] + S[(y + 1) * (gw + 1) + x] - S[y * (gw + 1) + x];
          const sum = (x: number, y: number, w: number, h: number) => S[(y + h) * (gw + 1) + x + w] - S[y * (gw + 1) + x + w] - S[(y + h) * (gw + 1) + x] + S[y * (gw + 1) + x];
          // a 3:2 window, 42% of the picture's width
          const cw = Math.max(4, Math.round(gw * 0.42));
          const ch = Math.max(3, Math.min(gh - 2, Math.round((cw * (W / gw) * (2 / 3)) / (H / gh))));
          const cands: { x: number; y: number; s: number }[] = [];
          // keep a small margin: edges of a photographed canvas, signatures in corners
          for (let y = 1; y + ch < gh - 1; y++) for (let x = 1; x + cw < gw - 1; x++) cands.push({ x, y, s: sum(x, y, cw, ch) });
          cands.sort((a, b) => b.s - a.s);
          const picked: { x: number; y: number }[] = [];
          for (const c of cands) {
            if (picked.every((p) => Math.max(0, Math.min(p.x, c.x) + cw - Math.max(p.x, c.x)) * Math.max(0, Math.min(p.y, c.y) + ch - Math.max(p.y, c.y)) < cw * ch * 0.08)) picked.push(c);
            if (picked.length === count) break;
          }
          // top to bottom, like reading the picture
          return picked
            .sort((a, b) => a.y - b.y)
            .map((p) => {
              const width = Math.round((cw / gw) * W);
              const height = Math.round((width * 2) / 3);
              return {
                left: Math.min(W - width, Math.round((p.x / gw) * W)),
                top: Math.min(H - height, Math.round((p.y / gh) * H)),
                width,
                height,
              };
            });
        } catch {
          return [];
        }
      })(),
    );
  }
  return cache.get(m.file)!;
}

/** The cut itself (WebP, at most 1600 px wide), for the /detail/<id>.webp route. */
export async function renderDetail(file: string, rect: Rect): Promise<Buffer> {
  return sharp(path.join(process.cwd(), file), { failOn: 'none' })
    .rotate()
    .extract(rect)
    .resize({ width: Math.min(rect.width, 1600), withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

/** What the page needs to show an automatic cut. */
export const outSize = (r: Rect) => {
  const w = Math.min(r.width, 1600);
  return { w, h: Math.round((w * r.height) / r.width) };
};
export const detailId = (category: string, m: Media, n: number) =>
  `${category}-${m.name.replace(/\.[^.]+$/, '').normalize('NFC').toLowerCase().replace(/[^a-z0-9ㄱ-힝]+/g, '-').replace(/^-|-$/g, '')}-${n + 1}`;
