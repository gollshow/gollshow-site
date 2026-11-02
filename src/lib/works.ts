import { getCollection, type CollectionEntry } from 'astro:content';
import { resolveOrNote, type Media } from './media';
import { CATEGORY, CORE_ROOMS } from './i18n';

export type Work = CollectionEntry<'works'> & {
  slug: string;
  href: string;
  cover?: Media;
  gallery: { media?: Media; ref: string; caption?: string; caption_en?: string }[];
  ratio: number;
  no: number; // number within its room, 1-based
};

const yearNum = (y?: string) => {
  const m = y?.match(/\d{4}/g);
  return m ? Math.max(...m.map(Number)) : 0;
};

let memo: Promise<Work[]> | undefined;

/** All published works, in curated order: `order` ascending, then newest first. */
export function getWorks(): Promise<Work[]> {
  memo ??= (async () => {
    const list = (await getCollection('works')).filter((w) => !w.data.draft);
    list.sort(
      (a, b) =>
        a.data.order - b.data.order ||
        yearNum(b.data.year) - yearNum(a.data.year) ||
        a.data.title.localeCompare(b.data.title, 'ko'),
    );
    const counters: Record<string, number> = {};
    return list.map((w) => {
      const gallery = w.data.images.map((i) => ({ media: resolveOrNote(i.image), ref: i.image, caption: i.caption, caption_en: i.caption_en }));
      const cover = resolveOrNote(w.data.cover) ?? gallery.find((g) => g.media)?.media;
      counters[w.data.category] = (counters[w.data.category] ?? 0) + 1;
      const slug = w.id;
      return Object.assign(w, {
        slug,
        href: `/works/${slug}/`,
        cover,
        gallery,
        ratio: cover ? cover.meta.width / cover.meta.height : 4 / 5,
        no: counters[w.data.category],
      });
    });
  })();
  return memo;
}

export async function getRooms() {
  const works = await getWorks();
  const keys = [...new Set([...CORE_ROOMS, ...works.map((w) => w.data.category)])];
  return keys.map((key, i) => ({
    key,
    no: i + 1,
    ...CATEGORY[key],
    works: works.filter((w) => w.data.category === key),
  }));
}

export async function getSettings() {
  const s = (await getCollection('settings'))[0]?.data;
  return s ?? ({} as NonNullable<typeof s>);
}

export async function getAbout() {
  const p = (await getCollection('pages')).find((e) => e.id === 'about');
  return p?.data;
}

export const pad = (n: number) => String(n).padStart(2, '0');

/** Audio path stored by the CMS (e.g. /media/audio/x.mp3) or a full URL. */
export const isAudioFile = (s?: string) => !!s && /\.(mp3|m4a|aac|ogg|oga|wav|flac|webm)(\?|$)/i.test(s);
