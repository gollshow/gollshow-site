/** Site chrome on every page: the KR/EN switch and the mobile menu. */

const d = document.documentElement;
export type Lang = 'en' | 'ko';
export const lang = (): Lang => (d.dataset.lang === 'ko' ? 'ko' : 'en');

/** Swap translated attributes (alt, aria-label, title) and the document title. */
export function applyLang(l: Lang = lang()) {
  d.dataset.lang = l;
  d.lang = l;
  const t = d.dataset[l === 'ko' ? 'titleKo' : 'titleEn'];
  if (t) document.title = t;
  for (const [key, attr] of [
    ['alt', 'alt'],
    ['aria', 'aria-label'],
    ['title', 'title'],
  ] as const) {
    document.querySelectorAll<HTMLElement>(`[data-${key}-en]`).forEach((el) => {
      const v = el.getAttribute(`data-${key}-${l}`) || el.getAttribute(`data-${key}-en`);
      if (v) el.setAttribute(attr, v);
    });
  }
}

function setLang(l: Lang) {
  try {
    localStorage.setItem('gollshow:lang', l);
  } catch {}
  applyLang(l);
  window.dispatchEvent(new CustomEvent('langchange', { detail: l }));
}

document.querySelectorAll<HTMLButtonElement>('[data-lang-toggle]').forEach((b) =>
  b.addEventListener('click', () => setLang(lang() === 'ko' ? 'en' : 'ko')),
);
if (lang() === 'ko') applyLang('ko');

/* Mobile menu: a modal dialog (focus stays inside, Esc closes). */
const menu = document.getElementById('menu') as HTMLDialogElement | null;
const opener = document.querySelector<HTMLButtonElement>('[data-menu-open]');
if (menu && opener) {
  opener.addEventListener('click', () => {
    menu.showModal();
    opener.setAttribute('aria-expanded', 'true');
  });
  menu.querySelector('[data-menu-close]')?.addEventListener('click', () => menu.close());
  menu.addEventListener('close', () => opener.setAttribute('aria-expanded', 'false'));
  matchMedia('(min-width: 761px)').addEventListener('change', (e) => e.matches && menu.open && menu.close());
}
