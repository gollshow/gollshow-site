export type Bi = { ko: string; en?: string };

export const CATEGORY: Record<string, { ko: string; en: string; path: string }> = {
  painting: { ko: '회화', en: 'Painting', path: '/painting/' },
  'conte-pastel': { ko: '콩테·파스텔', en: 'Conté & pastel', path: '/conte-pastel/' },
  digital: { ko: '디지털', en: 'Digital', path: '/digital/' },
  film: { ko: '영화', en: 'Film', path: '/film/' },
  etc: { ko: '그 밖의 작업', en: 'Other works', path: '/etc/' },
  music: { ko: '음악', en: 'Music', path: '/music/' },
};

/** Reel order, on the wall and in the navigation. */
export const ROOM_ORDER = ['painting', 'conte-pastel', 'digital', 'film', 'etc', 'music'];
/** Rooms whose works hang on the wall. */
export const VISUAL = ['painting', 'conte-pastel', 'digital', 'etc'];

export const UI = {
  about: { ko: '소개', en: 'About' },
  menu: { ko: '메뉴', en: 'Menu' },
  close: { ko: '닫기', en: 'Close' },
  prev: { ko: '이전', en: 'Previous' },
  next: { ko: '다음', en: 'Next' },
  soundOn: { ko: '소리 켜기', en: 'Sound on' },
  soundOff: { ko: '소리 끄기', en: 'Sound off' },
  skip: { ko: '건너뛰기', en: 'Skip' },
  wall: { ko: '벽', en: 'The wall' },
  process: { ko: '작업 과정 영상', en: 'Process video' },
  nextReel: { ko: '다음 릴', en: 'Next reel' },
  play: { ko: '재생', en: 'Play' },
  pause: { ko: '일시정지', en: 'Pause' },
  stop: { ko: '멈춤', en: 'Pause' },
  resume: { ko: '재생', en: 'Play' },
  newWindow: { ko: '새 창', en: 'opens in a new window' },
  toWall: { ko: '벽으로', en: 'To the wall' },
} satisfies Record<string, Bi>;
