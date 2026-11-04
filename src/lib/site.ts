import { getCollection, getEntry } from 'astro:content';

export type Bi = { en?: string; ko?: string };

export async function getSettings() {
  const e = await getEntry('settings', 'site');
  if (!e) throw new Error('src/content/settings/site.yml is missing');
  return e.data;
}
export type Settings = Awaited<ReturnType<typeof getSettings>>;

/** The wordmark text, used by the home motion and the small top-left mark. */
export const wordmarkOf = (s: Settings) => s.wordmark || 'gollshow';

export const NAV = [
  { key: 'painting', path: '/painting/', en: 'Painting', ko: '회화', m: 'painting' },
  { key: 'conte-pastel', path: '/conte-pastel/', en: 'Conté & Pastel', ko: '콩테·파스텔', m: 'conte' },
  { key: 'digital', path: '/digital/', en: 'Digital', ko: '디지털', m: 'digital' },
  { key: 'film', path: '/film/', en: 'Film', ko: '영화', m: 'film' },
  { key: 'music', path: '/music/', en: 'Music', ko: '음악', m: 'music' },
  { key: 'about', path: '/about/', en: 'About', ko: '소개', m: 'about' },
] as const;
export type NavKey = (typeof NAV)[number]['key'];

/** Menu items with the labels set in /admin (사이트 설정 → 메뉴 이름), falling back to the defaults. */
export function navItems(s: Settings) {
  const m = s.menu as Record<string, string | undefined>;
  return NAV.map((n) => ({ key: n.key, path: n.path, en: m[`${n.m}_en`] || n.en, ko: m[`${n.m}_ko`] || n.ko }));
}

/** Interface words (not content). */
export const UI = {
  menu: { en: 'Menu', ko: '메뉴' },
  close: { en: 'Close', ko: '닫기' },
  prev: { en: 'Previous', ko: '이전' },
  next: { en: 'Next', ko: '다음' },
  process: { en: 'Process', ko: '과정' },
  work: { en: 'Work', ko: '작품' },
  skip: { en: 'Skip to content', ko: '본문으로 건너뛰기' },
  mainNav: { en: 'Main', ko: '주 메뉴' },
  toKo: { en: '한국어로 보기', ko: '한국어로 보기' },
  toEn: { en: 'View in English', ko: 'View in English' },
  home: { en: 'gollshow, home', ko: 'gollshow, 처음으로' },
  filmsSoon: { en: 'Films are on their way.', ko: '영화를 준비하고 있어요.' },
  trailer: { en: 'Trailer', ko: '예고편' },
  play: { en: 'Play', ko: '재생' },
  playTrailer: { en: 'Play the trailer', ko: '예고편 재생' },
  synopsis: { en: 'Synopsis', ko: '시놉시스' },
  stills: { en: 'Stills', ko: '스틸' },
  credits: { en: 'Credits', ko: '크레딧' },
  festivals: { en: 'Festivals & awards', ko: '영화제·수상' },
  links: { en: 'Links', ko: '링크' },
  min: { en: 'min', ko: '분' },
  draft: { en: 'Draft — not published. Visible only on the local preview.', ko: '초안 — 공개 전입니다. 로컬 미리보기에서만 보입니다.' },
  allFilms: { en: 'All films', ko: '영화 목록' },
  listen: { en: 'Listen', ko: '듣기' },
  loadPlayer: { en: 'Load the Spotify player', ko: 'Spotify 플레이어 열기' },
  contact: { en: 'Contact', ko: '연락' },
  lost: { en: 'This page is not here.', ko: '이 페이지는 없습니다.' },
  backHome: { en: 'Back to the start', ko: '처음으로' },
} satisfies Record<string, Bi>;

export const CATEGORY_WORD: Record<string, Bi> = {
  painting: { en: 'painting', ko: '회화' },
  'conte-pastel': { en: 'conté & pastel', ko: '콩테·파스텔' },
  digital: { en: 'digital work', ko: '디지털 작업' },
  film: { en: 'film still', ko: '영화 스틸' },
};

/** "98" → "98 min" / "98분"; anything else is shown as typed. */
export function runtimeOf(r?: string): Bi | undefined {
  if (!r) return;
  const n = r.match(/^\s*(\d+)\s*$/)?.[1];
  return n ? { en: `${n} min`, ko: `${n}분` } : { en: r, ko: r };
}

/** Normalise a size like "1200x870mm" or "596×896㎜" to "1200 × 870 mm". */
export function sizeOf(s?: string) {
  if (!s) return s;
  return s
    .replace(/㎜/g, 'mm')
    .replace(/㎝/g, 'cm')
    .replace(/\s*[x×X*]\s*/g, ' × ')
    .replace(/(\d)\s*(mm|cm|in)\b/gi, (_, d, u) => `${d} ${u.toLowerCase()}`);
}

export async function publishedFilms() {
  const all = await getCollection('films');
  const show = import.meta.env.DEV ? all : all.filter((f) => f.data.published);
  return show.sort((a, b) => a.data.order - b.data.order || String(b.data.year ?? '').localeCompare(String(a.data.year ?? '')));
}
