import type { APIRoute, GetStaticPaths } from 'astro';
import { getEntry } from 'astro:content';
import { ART } from '../../content.config';
import { bigEnough, detailId, detailRects, renderDetail, type Rect } from '../../lib/details';
import { resolveImage } from '../../lib/media';

/**
 * /detail/<id>.webp — the automatic detail cuts of large originals (see src/lib/details.ts).
 * Works with details uploaded in /admin, hidden works and small originals have none.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const paths: { params: { id: string }; props: { file: string; rect: Rect } }[] = [];
  for (const category of ART) {
    const entry = await getEntry('art', category);
    for (const w of entry?.data.works ?? []) {
      if (w.hidden || w.details.length) continue;
      const m = resolveImage(w.image);
      if (!m || !bigEnough(m)) continue;
      (await detailRects(m)).forEach((rect, n) => paths.push({ params: { id: detailId(category, m, n) }, props: { file: m.file, rect } }));
    }
  }
  return paths;
};

export const GET: APIRoute = async ({ props }) => {
  const { file, rect } = props as { file: string; rect: Rect };
  return new Response(new Uint8Array(await renderDetail(file, rect)), { headers: { 'Content-Type': 'image/webp' } });
};
