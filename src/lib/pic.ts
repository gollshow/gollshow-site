import { getImage } from 'astro:assets';
import { placeholder, widthsFor, type Media } from './media';

export type Pic = {
  w: number;
  h: number;
  avif: string;
  webp: string;
  fallback: string; // a mid-size WebP URL
  large: string; // the largest WebP URL
  small: string; // the smallest WebP URL
  color: string;
  lqip: string;
};

const cache = new Map<string, Promise<Pic>>();
const Q = 80;

/** AVIF + WebP srcsets for one image (memoised per build). */
export function pic(m: Media, max = 2560): Promise<Pic> {
  const key = m.file + '@' + max;
  if (!cache.has(key)) {
    cache.set(
      key,
      (async () => {
        const widths = widthsFor(m.meta).filter((w) => w <= max);
        if (!widths.length) widths.push(Math.min(m.meta.width, max));
        const [avif, webp, ph] = await Promise.all([
          getImage({ src: m.meta, widths, format: 'avif', quality: Q - 18 }),
          getImage({ src: m.meta, widths, format: 'webp', quality: Q }),
          placeholder(m),
        ]);
        const vals = webp.srcSet.values;
        const mid = vals.find((v) => Number(v.descriptor?.replace('w', '')) >= 1024) ?? vals[vals.length - 1];
        return {
          w: m.meta.width,
          h: m.meta.height,
          avif: avif.srcSet.attribute,
          webp: webp.srcSet.attribute,
          fallback: mid?.url ?? webp.src,
          large: vals[vals.length - 1]?.url ?? webp.src,
          small: vals[0]?.url ?? webp.src,
          color: ph.color,
          lqip: ph.lqip,
        };
      })(),
    );
  }
  return cache.get(key)!;
}
