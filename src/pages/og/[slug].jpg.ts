import type { APIRoute, GetStaticPaths } from 'astro';
import path from 'node:path';
import sharp from 'sharp';
import kong from '../../generated/kong.json';
import { getWorks, caption } from '../../lib/works';
import { type Media } from '../../lib/media';
import { textPath, HAHMLET } from '../../lib/glyphs';

/** Share images: the work projected in the dark room, with its real caption. */
const W = 1200;
const H = 630;
const SCREEN = '#eceae4';
const ASH = '#8a847c';

export const getStaticPaths: GetStaticPaths = async () => {
  const works = await getWorks();
  return [{ params: { slug: 'site' } }, ...works.map((w) => ({ params: { slug: w.slug } }))];
};

async function fit(m: Media, boxW: number, boxH: number) {
  return sharp(path.join(process.cwd(), m.file), { failOn: 'none' }).rotate().resize(boxW, boxH, { fit: 'inside' }).toBuffer({ resolveWithObject: true });
}

export const GET: APIRoute = async ({ params }) => {
  const layers: sharp.OverlayOptions[] = [];
  let svg = '';

  if (params.slug === 'site') {
    // the opening title card: a lit gate and 空
    svg += `<defs><radialGradient id="g" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#1d1913"/><stop offset=".7" stop-color="#120f0b"/><stop offset="1" stop-color="#080705"/></radialGradient>
      <filter id="h" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter></defs>`;
    const gw = 760;
    const gh = gw / 1.375;
    const gx = (W - gw) / 2;
    const gy = (H - gh) / 2 - 10;
    svg += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="16" fill="url(#g)"/>`;
    const b = kong.bbox;
    const kh = 330;
    const k = kh / (b.y2 - b.y1);
    const kx = W / 2 - ((b.x1 + b.x2) / 2) * k;
    const ky = gy + gh / 2 - ((b.y1 + b.y2) / 2) * k;
    svg += `<path transform="translate(${kx} ${ky}) scale(${k})" d="${kong.regular}" fill="#ff9a5a" opacity=".35" filter="url(#h)"/>`;
    svg += `<path transform="translate(${kx} ${ky}) scale(${k})" d="${kong.regular}" fill="#f4ead6"/>`;
    svg += `<path d="${textPath('goll', HAHMLET, 30, gx, H - 28).d}" fill="${SCREEN}"/>`;
  } else {
    const w = (await getWorks()).find((x) => x.slug === params.slug)!;
    const c = caption(w);
    const m = w.cover ?? w.image;
    if (m) {
      const img = await fit(m, 980, 470);
      const left = Math.round((W - img.info.width) / 2);
      const top = Math.round(40 + (470 - img.info.height) / 2);
      // halation: a warm, blurred copy behind the work
      const halo = await sharp(img.data).blur(26).modulate({ brightness: 1.1, saturation: 1.6 }).tint('#ffb27a').toBuffer();
      layers.push({ input: halo, left, top, blend: 'screen' });
      layers.push({ input: img.data, left, top });
    }
    const y = H - 52;
    const name = c.title ?? `${c.room_ko} ${c.frame}`;
    const t = textPath(name, HAHMLET, 30, 60, y, { maxWidth: 640 });
    svg += `<path d="${t.d}" fill="${SCREEN}"/>`;
    const meta = [c.year, c.sm].filter(Boolean).join('   ');
    if (meta) svg += `<path d="${textPath(meta, HAHMLET, 18, 60 + t.width + 24, y, { maxWidth: W - 60 - t.width - 260 }).d}" fill="${ASH}"/>`;
    const right = `${c.room_en} ${c.frame} / ${c.total}`;
    const r = textPath(right, HAHMLET, 18, 0, 0);
    svg += `<path d="${textPath(right, HAHMLET, 18, W - 60 - r.width, y).d}" fill="${ASH}"/>`;
  }

  const out = await sharp({ create: { width: W, height: H, channels: 3, background: '#000000' } })
    .composite([...layers, { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg}</svg>`), left: 0, top: 0 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(out), { headers: { 'Content-Type': 'image/jpeg' } });
};
