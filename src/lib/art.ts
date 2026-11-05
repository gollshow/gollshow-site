import { getEntry } from 'astro:content';
import { pic, resolveImage, type Pic } from './media';
import { CATEGORY_WORD, sizeOf } from './site';
import { embedFor } from './embed';

export type ViewerItem = {
  src: string;
  srcset: string;
  w: number;
  h: number;
  alt: { en: string; ko: string };
  title?: { en?: string; ko?: string };
  meta: string[]; // year, material, size, note — only the filled ones
  process?: string;
};

export type Work = ViewerItem & { pic: Pic; display: 'S' | 'M' | 'L'; focus?: string };

const key = (s: string) => s.split('?')[0].normalize('NFC').toLowerCase();

/** The visible works of one category, in the order set in /admin. */
export async function getWorks(category: string): Promise<Work[]> {
  const entry = await getEntry('art', category);
  const listed = entry?.data.works ?? [];
  const seen = new Set(listed.map((w) => key(w.image!)));
  // Images still sitting in the "drop many" field (if the admin's save hook didn't move them) are shown after the list.
  const extra = (entry?.data.bulk ?? [])
    .filter((i) => !seen.has(key(i)) && seen.add(key(i)))
    .map((image) => ({ image, display: 'M' as const, hidden: false }) as (typeof listed)[number]);
  const word = CATEGORY_WORD[category] ?? { en: 'work', ko: '작품' };
  const out: Work[] = [];
  for (const w of [...listed, ...extra]) {
    if (w.hidden) continue;
    const m = resolveImage(w.image);
    if (!m) {
      console.warn(`[art] ${category}: image not found, skipped: ${w.image}`);
      continue;
    }
    const p = await pic(m);
    const tEn = w.title_en ?? w.title_ko;
    const tKo = w.title_ko ?? w.title_en;
    out.push({
      pic: p,
      display: w.display,
      focus: w.focus,
      src: p.src,
      srcset: p.srcset,
      w: p.w,
      h: p.h,
      alt: {
        en: tEn ? `${tEn}${w.year ? `, ${w.year}` : ''}` : `Untitled, ${word.en}`,
        ko: tKo ? `${tKo}${w.year ? `, ${w.year}` : ''}` : `무제, ${word.ko}`,
      },
      title: tEn || tKo ? { en: tEn, ko: tKo } : undefined,
      meta: [w.year, w.material, sizeOf(w.size), w.note].filter((x): x is string => !!x),
      // A YouTube/Vimeo page link becomes a player URL; embed URLs (Adobe…) are used as given.
      process: w.process ? (embedFor(w.process)?.src ?? w.process) : undefined,
    });
  }
  return out;
}

/** Strip the heavy bits before the list goes into the page as JSON for the viewer. */
export const viewerData = (items: ViewerItem[]): ViewerItem[] =>
  items.map(({ src, srcset, w, h, alt, title, meta, process }) => ({ src, srcset, w, h, alt, title, meta, process }));

/** Film stills (or any list of image paths) as viewer items. */
export async function stillsToItems(paths: string[], title: { en?: string; ko?: string }): Promise<(ViewerItem & { pic: Pic })[]> {
  const out: (ViewerItem & { pic: Pic })[] = [];
  let n = 0;
  for (const ref of paths) {
    const m = resolveImage(ref);
    if (!m) {
      console.warn(`[film] still not found, skipped: ${ref}`);
      continue;
    }
    const p = await pic(m);
    n++;
    const en = `${title.en ?? title.ko ?? 'Film'}, still ${n}`;
    const ko = `${title.ko ?? title.en ?? '영화'}, 스틸 ${n}`;
    out.push({ pic: p, src: p.src, srcset: p.srcset, w: p.w, h: p.h, alt: { en, ko }, title: undefined, meta: [], process: undefined });
  }
  return out;
}
