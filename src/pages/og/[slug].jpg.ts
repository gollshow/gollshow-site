import type { APIRoute, GetStaticPaths } from 'astro';
import path from 'node:path';
import sharp from 'sharp';
import kong from '../../generated/kong.json';
import { getWorks, getSettings } from '../../lib/works';
import { resolveImage, type Media } from '../../lib/media';
import { CATEGORY } from '../../lib/i18n';
import { textPath, SERIF, SERIF_LIGHT, SANS } from '../../lib/glyphs';

const W = 1200;
const H = 630;
const PAPER = '#f4f2ed';
const INK = '#1a1a18';
const INK2 = '#6b6964';

export const getStaticPaths: GetStaticPaths = async () => {
  const works = await getWorks();
  return [{ params: { slug: 'site' } }, ...works.map((w) => ({ params: { slug: w.slug } }))];
};

async function placed(m: Media | undefined, boxW: number, boxH: number) {
  if (!m) return undefined;
  const buf = await sharp(path.join(process.cwd(), m.file), { failOn: 'none' })
    .rotate()
    .resize(boxW, boxH, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true });
  return buf;
}

export const GET: APIRoute = async ({ params }) => {
  const s = await getSettings();
  const layers: sharp.OverlayOptions[] = [];
  let svg = '';

  if (params.slug === 'site') {
    // 空 on the left, the landing work on the right
    const b = kong.bbox;
    const gh = 360;
    const k = gh / (b.y2 - b.y1);
    const gx = 120 - b.x1 * k;
    const gy = (H - gh) / 2 - 20 - b.y1 * k;
    svg += `<path transform="translate(${gx} ${gy}) scale(${k})" d="${kong.light}" fill="${INK}"/>`;
    const t = textPath('goll show', SERIF, 34, 120, H - 74);
    svg += `<path d="${t.d}" fill="${INK}"/>`;
    const r = s.roles_en ? textPath(s.roles_en.toUpperCase(), SANS, 13, 120 + t.width + 24, H - 78, { tracking: 0.2 }) : undefined;
    if (r) svg += `<path d="${r.d}" fill="${INK2}"/>`;
    const img = await placed(resolveImage(s.hero_image), 420, 470);
    if (img) layers.push({ input: img.data, left: Math.round(W - 120 - img.info.width), top: Math.round((H - img.info.height) / 2) });
  } else {
    const w = (await getWorks()).find((x) => x.slug === params.slug)!;
    const img = await placed(w.cover, 640, 510);
    const left = 60;
    if (img) layers.push({ input: img.data, left: left + Math.round((640 - img.info.width) / 2), top: Math.round((H - img.info.height) / 2) });
    const x = 760;
    const cat = CATEGORY[w.data.category];
    const c = textPath(`${cat.en.toUpperCase()}`, SANS, 13, x, 150, { tracking: 0.2 });
    svg += `<path d="${c.d}" fill="${INK2}"/>`;
    const t = textPath(w.data.title, SERIF_LIGHT, 46, x, 236, { maxWidth: W - x - 60 });
    svg += `<path d="${t.d}" fill="${INK}"/>`;
    let y = 236 + 52;
    if (w.data.title_en && w.data.title_en !== w.data.title) {
      const e = textPath(w.data.title_en, SERIF, 24, x, y, { maxWidth: W - x - 60 });
      svg += `<path d="${e.d}" fill="${INK2}"/>`;
      y += 44;
    }
    const meta = [w.data.year, w.data.medium_en ?? w.data.medium].filter(Boolean).join(' · ');
    if (meta) svg += `<path d="${textPath(meta, SANS, 17, x, y + 8, { maxWidth: W - x - 60 }).d}" fill="${INK2}"/>`;
    const b = kong.bbox;
    const k = 40 / (b.y2 - b.y1);
    svg += `<path transform="translate(${x - b.x1 * k} ${H - 110 - b.y1 * k}) scale(${k})" d="${kong.regular}" fill="${INK}"/>`;
    svg += `<path d="${textPath('goll show', SERIF, 22, x + 58, H - 80).d}" fill="${INK}"/>`;
  }

  const out = await sharp({ create: { width: W, height: H, channels: 3, background: PAPER } })
    .composite([...layers, { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg}</svg>`), left: 0, top: 0 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(out), { headers: { 'Content-Type': 'image/jpeg' } });
};
