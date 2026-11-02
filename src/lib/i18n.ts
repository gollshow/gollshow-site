export type Bi = { ko: string; en?: string };

export const CATEGORY: Record<string, { ko: string; en: string; path: string; unit: Bi }> = {
  painting: { ko: '회화', en: 'Painting', path: '/painting/', unit: { ko: '점', en: 'works' } },
  'conte-pastel': { ko: '콩테 · 파스텔', en: 'Conté & Pastel', path: '/conte-pastel/', unit: { ko: '점', en: 'works' } },
  digital: { ko: '디지털', en: 'Digital', path: '/digital/', unit: { ko: '점', en: 'works' } },
  music: { ko: '음악', en: 'Music', path: '/music/', unit: { ko: '곡', en: 'pieces' } },
  film: { ko: '영화', en: 'Film', path: '/film/', unit: { ko: '편', en: 'films' } },
  etc: { ko: '그 밖의 작업', en: 'Other works', path: '/etc/', unit: { ko: '점', en: 'works' } },
};

/** Rooms always shown (they existed on the old site), even while empty. */
export const CORE_ROOMS = ['painting', 'conte-pastel', 'digital', 'music'];

export const UI = {
  works: { ko: '작품', en: 'Works' },
  music: { ko: '음악', en: 'Music' },
  about: { ko: '소개', en: 'About' },
  menu: { ko: '메뉴', en: 'Menu' },
  close: { ko: '닫기', en: 'Close' },
  hang: { ko: '전시', en: 'Hang' },
  index: { ko: '목록', en: 'Index' },
  rooms: { ko: '전시실', en: 'Rooms' },
  room: { ko: '전시실', en: 'Room' },
  all: { ko: '전체', en: 'All' },
  selected: { ko: '대표작', en: 'Selected works' },
  empty: { ko: '아직 비어 있는 방입니다.', en: 'This room is still empty.' },
  prev: { ko: '이전 작품', en: 'Previous' },
  next: { ko: '다음 작품', en: 'Next' },
  play: { ko: '재생', en: 'Play' },
  pause: { ko: '일시정지', en: 'Pause' },
  listen: { ko: '듣기', en: 'Listen' },
  watch: { ko: '보기', en: 'Watch' },
  view: { ko: '크게 보기', en: 'View' },
  contact: { ko: '연락', en: 'Contact' },
  scroll: { ko: '내려 보기', en: 'Scroll' },
  enter: { ko: 'GO', en: 'GO' },
  back: { ko: '전시실로', en: 'Back to room' },
  cv: { ko: '약력', en: 'Curriculum vitae' },
} satisfies Record<string, Bi>;
