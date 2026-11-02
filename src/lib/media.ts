import type { ImageMetadata } from 'astro';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Every image the owner uploads (through /admin or by hand) lives in
 * src/assets/media/. Content files reference them by path; we resolve by file
 * name so that "/src/assets/media/a.jpg", "../../assets/media/a.jpg" and
 * "a.jpg" all work, and a missing file degrades to an empty frame instead of
 * breaking the build.
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
for (const [file, meta] of Object.entries(files)) byName.set(norm(file), { meta, file, name: path.basename(file) });

export function resolveImage(ref?: string | null): Media | undefined {
  if (!ref) return undefined;
  return byName.get(norm(ref));
}

export const missing = new Set<string>();
export function resolveOrNote(ref?: string | null) {
  const m = resolveImage(ref);
  if (ref && !m) missing.add(ref);
  return m;
}

type Placeholder = { lqip: string; color: string };
const cache = new Map<string, Promise<Placeholder>>();

/** Tiny blurred preview (inline SVG wrapping a 16px WebP) + dominant colour. */
export function placeholder(m: Media): Promise<Placeholder> {
  if (!cache.has(m.file)) {
    cache.set(
      m.file,
      (async () => {
        const abs = path.join(process.cwd(), m.file);
        try {
          const img = sharp(abs, { failOn: 'none' }).rotate();
          const { dominant } = await img.clone().stats();
          const tiny = await img.clone().resize(16, 16, { fit: 'inside' }).webp({ quality: 50 }).toBuffer({ resolveWithObject: true });
          const { width: w, height: h } = tiny.info;
          const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' preserveAspectRatio='none'><filter id='b' color-interpolation-filters='sRGB'><feGaussianBlur stdDeviation='1.2'/><feComponentTransfer><feFuncA type='discrete' tableValues='1 1'/></feComponentTransfer></filter><image width='100%' height='100%' preserveAspectRatio='none' filter='url(%23b)' href='data:image/webp;base64,${tiny.data.toString('base64')}'/></svg>`;
          const hex = '#' + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('');
          return { lqip: `url("data:image/svg+xml;charset=utf-8,${svg.replace(/"/g, "'").replace(/</g, '%3C').replace(/>/g, '%3E')}")`, color: hex };
        } catch {
          return { lqip: 'none', color: 'var(--paper-2)' };
        }
      })(),
    );
  }
  return cache.get(m.file)!;
}

/** Widths we generate; never upscale. */
export function widthsFor(meta: ImageMetadata, wanted = [480, 800, 1200, 1800, 2560]) {
  const w = wanted.filter((x) => x < meta.width);
  if (!w.length || w[w.length - 1] < meta.width) w.push(Math.min(meta.width, wanted[wanted.length - 1]));
  return [...new Set(w)];
}

export const withBase = (p?: string) => {
  if (!p) return p;
  if (/^(https?:)?\/\//.test(p) || p.startsWith('data:') || p.startsWith('mailto:')) return p;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + (p.startsWith('/') ? p : '/' + p);
};
