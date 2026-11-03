import { getCollection, type CollectionEntry } from 'astro:content';
import { resolveOrNote, type Media } from './media';
import { palette, type Palette } from './palette';
import { parseSize } from './size';
import { CATEGORY, ROOM_ORDER, VISUAL } from './i18n';

export type Work = CollectionEntry<'works'> & {
  slug: string;
  href: string;
  image?: Media; // what hangs on the wall and in the reel: the first image, else the cover
  cover?: Media; // share image / poster: the cover, else the first image
  gallery: { media?: Media; ref: string; caption?: string; caption_en?: string }[];
  ratio: number;
  area?: number; // physical area in mm², when `size` is known
  no: number; // frame number within its reel, 1-based
  total: number; // frames in its reel
  color: Palette;
};

const yearNum = (y?: string) => {
  const m = y?.match(/\d{4}/g);
  return m ? Math.max(...m.map(Number)) : 0;
};

let memo: Promise<Work[]> | undefined;

/** All published works, in reel order: `order` ascending, then newest first, then title. */
export function getWorks(): Promise<Work[]> {
  memo ??= (async () => {
    const list = (await getCollection('works')).filter((w) => !w.data.draft);
    list.sort(
      (a, b) =>
        ROOM_ORDER.indexOf(a.data.category) - ROOM_ORDER.indexOf(b.data.category) ||
        a.data.order - b.data.order ||
        yearNum(b.data.year) - yearNum(a.data.year) ||
        (a.data.title ?? '').localeCompare(b.data.title ?? '', 'ko') ||
        a.id.localeCompare(b.id),
    );
    const counters: Record<string, number> = {};
    const out = await Promise.all(
      list.map(async (w) => {
        const gallery = w.data.images.map((i) => ({ media: resolveOrNote(i.image), ref: i.image, caption: i.caption, caption_en: i.caption_en }));
        const first = gallery.find((g) => g.media)?.media;
        const cov = resolveOrNote(w.data.cover);
        const image = first ?? cov;
        counters[w.data.category] = (counters[w.data.category] ?? 0) + 1;
        return Object.assign(w, {
          slug: w.id,
          href: `/works/${w.id}/`,
          image,
          cover: cov ?? first,
          gallery,
          ratio: image ? image.meta.width / image.meta.height : 4 / 5,
          area: parseSize(w.data.size)?.area,
          no: counters[w.data.category],
          total: 0,
          color: image ? await palette(image.file) : { dominant: '#4a443d', accent: '#f6e7c8', lum: 0.4 },
        });
      }),
    );
    for (const w of out) w.total = counters[w.data.category];
    return out;
  })();
  return memo;
}

export type Room = { key: string; ko: string; en: string; path: string; works: Work[] };

/** Rooms (reels) that have works, in reel order. Music is always there: it holds the platform links. */
export async function getRooms(): Promise<Room[]> {
  const works = await getWorks();
  return ROOM_ORDER.map((key) => ({ key, ...CATEGORY[key], works: works.filter((w) => w.data.category === key) })).filter(
    (r) => r.works.length || r.key === 'music',
  );
}

/** Works that hang on the wall: everything visual with an image. */
export async function getWallWorks() {
  return (await getWorks()).filter((w) => VISUAL.includes(w.data.category) && w.image);
}

export async function getSettings() {
  const s = (await getCollection('settings'))[0]?.data;
  return s ?? ({} as NonNullable<typeof s>);
}

export async function getPage(id: 'about' | 'music') {
  return (await getCollection('pages')).find((e) => e.id === id)?.data;
}

export const pad3 = (n: number) => String(n).padStart(3, '0');

/** Audio path stored by the CMS (e.g. /media/audio/x.mp3) or a full URL. */
export const isAudioFile = (s?: string) => !!s && /\.(mp3|m4a|aac|ogg|oga|wav|flac|webm)(\?|$)/i.test(s);

/**
 * The caption of a work: only real data. Size and medium are joined with one
 * space, which gives back the old site's text exactly ("1200x870mm Oil").
 */
export function caption(w: Work) {
  const d = w.data;
  const room = CATEGORY[d.category];
  return {
    title: d.title,
    title_en: d.title_en ?? d.title,
    year: d.year,
    sm: [d.size, d.medium].filter(Boolean).join(' ') || undefined,
    sm_en: [d.size, d.medium_en ?? d.medium].filter(Boolean).join(' ') || undefined,
    room_ko: room.ko,
    room_en: room.en,
    frame: pad3(w.no),
    total: pad3(w.total),
  };
}

/** A name for any work, titled or not: "gogo", or "회화 017" / "Painting 017". */
export function nameOf(w: Work, lang: 'ko' | 'en' = 'ko') {
  const c = caption(w);
  if (lang === 'en') return c.title_en ?? `${c.room_en} ${c.frame}`;
  return c.title ?? `${c.room_ko} ${c.frame}`;
}
