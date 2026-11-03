/** The projection dialog. Opened by the wall and the reels with a list of frames. */
import { capHTML, nameOf, type Cap } from './caption';

export type VItem = { avif?: string; webp?: string; src: string; w: number; h: number; bg?: string; cap: Cap; href: string; video?: boolean };
type Opts = { opener?: HTMLElement | null; onClose?: (index: number) => void };

let dlg: HTMLDialogElement | null = null;
let items: VItem[] = [];
let index = 0;
let opts: Opts = {};
let bound = false;

const $ = <T extends Element>(s: string) => dlg!.querySelector<T>(s)!;
const still = () => document.documentElement.classList.contains('still');
const isEn = () => document.documentElement.dataset.lang === 'en';

function show(i: number, cut = false) {
  if (!items.length) return;
  index = (i + items.length) % items.length;
  const it = items[index];
  const img = $<HTMLImageElement>('[data-pj-img]');
  $<HTMLSourceElement>('[data-pj-avif]').srcset = it.avif ?? '';
  $<HTMLSourceElement>('[data-pj-webp]').srcset = it.webp ?? '';
  img.width = it.w;
  img.height = it.h;
  img.style.background = it.bg ?? '';
  img.src = it.src;
  img.alt = nameOf(it.cap, isEn());
  const halo = $<HTMLImageElement>('[data-pj-halo]');
  halo.width = it.w;
  halo.height = it.h;
  halo.src = it.src;
  // the halo follows whichever source the browser picked
  img.onload = () => (halo.src = img.currentSrc || it.src);

  $<HTMLElement>('[data-pj-count]').innerHTML =
    `<span class="t" lang="ko">${it.cap.room_ko}</span><span class="t" lang="en">${it.cap.room_en}</span> <span>${it.cap.frame} / ${it.cap.total}</span>`;
  $<HTMLElement>('[data-pj-cap]').innerHTML = capHTML(it.cap, { frame: false }) || '';
  if (!it.cap.title) $<HTMLElement>('[data-pj-cap]').insertAdjacentHTML('afterbegin', `<span class="c-room"><span class="t" lang="ko">${it.cap.room_ko}</span><span class="t" lang="en">${it.cap.room_en}</span></span>`);
  const more = $<HTMLAnchorElement>('[data-pj-more]');
  more.hidden = !it.video;
  more.href = it.href + '#video';

  if (cut && !still()) {
    // a hard splice: one frame of light, a splice line somewhere across the frame
    const f = $<HTMLElement>('[data-pj-flash]');
    f.style.setProperty('--splice', `${20 + Math.random() * 60}%`);
    f.classList.add('is-on');
    setTimeout(() => f.classList.remove('is-on'), 42);
  }
  for (const d of [1, -1]) {
    const n = items[(index + d + items.length) % items.length];
    if (n) new Image().src = n.src;
  }
}

function bind() {
  if (!dlg || bound) return;
  bound = true;
  $('[data-pj-close]').addEventListener('click', () => dlg!.close());
  $('[data-pj-prev]').addEventListener('click', () => show(index - 1, true));
  $('[data-pj-next]').addEventListener('click', () => show(index + 1, true));
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(index + 1, true);
    else if (e.key === 'ArrowLeft') show(index - 1, true);
    else return;
    e.preventDefault();
  });
  dlg.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    const f = opts.onClose;
    const op = opts.opener;
    opts = {};
    f?.(index);
    op?.focus({ preventScroll: true });
  });
  // swipe: sideways advances, down closes
  const stage = $<HTMLElement>('[data-pj-stage]');
  let s: { x: number; y: number; id: number } | null = null;
  stage.addEventListener('pointerdown', (e) => (s = { x: e.clientX, y: e.clientY, id: e.pointerId }));
  stage.addEventListener('pointerup', (e) => {
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    s = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) show(index + (dx < 0 ? 1 : -1), true);
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) dlg!.close();
  });
  document.addEventListener('goll:lang', () => dlg?.open && show(index));
}

export function openViewer(list: VItem[], i: number, o: Opts = {}) {
  dlg = document.querySelector<HTMLDialogElement>('[data-viewer]');
  if (!dlg || !list.length) return;
  bound = dlg.dataset.bound === '1';
  if (!bound) ((bound = false), bind(), (dlg.dataset.bound = '1'));
  items = list;
  opts = o;
  show(i);
  dlg.showModal();
  document.documentElement.style.overflow = 'hidden';
  if (!still()) {
    // the projector comes on: two quick frames of light
    const f = $<HTMLElement>('[data-pj-flash]');
    f.style.setProperty('--splice', '-10%');
    f.classList.add('is-on');
    setTimeout(() => f.classList.remove('is-on'), 42);
  }
}
