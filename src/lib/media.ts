import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import path from 'node:path';

/**
 * Every image the owner uploads (through /admin or by hand) lives in
 * src/assets/media/. Content files reference them by path; we resolve by file
 * name so that "/src/assets/media/a.jpg", "../../assets/media/a.jpg" and
 * "a.jpg" all work, and a missing file is skipped instead of breaking the build.
 */
const files = import.meta.glob<ImageMetadata>('/src/assets/media/**/*.{jpg,jpeg,png,webp,avif,gif,tif,tiff,JPG,JPEG,PNG,WEBP,AVIF,GIF,TIF,TIFF}', {
  eager: true,
  import: 'default',
});

const norm = (s: string) => {
  let n = s.split('?')[0].split('#')[0].split('/').pop() || '';
  try {
    n = decodeURIComponent(n);
  } catch {}
  return n.normalize('NFC').toLowerCase();
};

export type Media = { meta: ImageMetadata; file: string; name: string };
const byName = new Map<string, Media>();
const byPath = new Map<string, Media>();
for (const [file, meta] of Object.entries(files)) {
  const m = { meta, file, name: path.basename(file) };
  byPath.set(file.normalize('NFC').toLowerCase(), m);
  if (!byName.has(norm(file))) byName.set(norm(file), m);
}

export function resolveImage(ref?: string | null): Media | undefined {
  if (!ref) return undefined;
  const p = ref.split('?')[0].normalize('NFC').toLowerCase();
  return byPath.get(p.startsWith('/') ? p : '/' + p) ?? byName.get(norm(ref));
}

export type Pic = {
  w: number; // natural size
  h: number;
  src: string; // a mid-size WebP
  srcset: string; // WebP widths, never wider than the original
  large: string; // the largest WebP
};

const cache = new Map<string, Promise<Pic>>();
const WIDTHS = [360, 540, 720, 1080, 1600, 2400];

/** WebP srcset for one image (memoised per build). Never upscaled: widths stop at the original's width. */
export function pic(m: Media): Promise<Pic> {
  if (!cache.has(m.file)) {
    cache.set(
      m.file,
      (async () => {
        const nat = m.meta.width;
        const widths = WIDTHS.filter((x) => x < nat * 0.92);
        widths.push(Math.min(nat, WIDTHS[WIDTHS.length - 1]));
        const img = await getImage({ src: m.meta, widths: [...new Set(widths)], format: 'webp', quality: 82 });
        const vals = img.srcSet.values;
        const mid = vals.find((v) => Number(v.descriptor?.replace('w', '')) >= 720) ?? vals[vals.length - 1];
        return {
          w: m.meta.width,
          h: m.meta.height,
          src: mid?.url ?? img.src,
          srcset: img.srcSet.attribute,
          large: vals[vals.length - 1]?.url ?? img.src,
        };
      })(),
    );
  }
  return cache.get(m.file)!;
}

export const withBase = (p?: string) => {
  if (!p) return p;
  if (/^(https?:)?\/\//.test(p) || p.startsWith('data:') || p.startsWith('mailto:')) return p;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + (p.startsWith('/') ? p : '/' + p);
};
