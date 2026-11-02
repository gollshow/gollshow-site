/** The dark room: full-screen viewer with pinch / wheel / double-tap zoom, pan, swipe and keys. */
import { navigate } from 'astro:transitions/client';

type Item = { avif: string; webp: string; src: string; large: string; w: number; h: number; title: string; title_en?: string; meta?: string; meta_en?: string; href: string };

let items: Item[] = [];
let index = 0;
let dlg: HTMLDialogElement | null = null;
let opener: HTMLElement | null = null;
let s = 1;
let tx = 0;
let ty = 0;
let bound = false;

const $ = <T extends Element>(sel: string) => dlg!.querySelector<T>(sel)!;
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const isEn = () => document.documentElement.dataset.lang === 'en';

function apply(animate = false) {
  const pan = $<HTMLElement>('[data-viewer-pan]');
  pan.style.transition = animate && !reduce() ? 'transform 360ms cubic-bezier(.22,1,.36,1)' : 'none';
  pan.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;
  dlg!.classList.toggle('is-zoomed', s > 1.01);
}

function clamp() {
  if (s <= 1) {
    s = 1;
    tx = 0;
    ty = 0;
    return;
  }
  // The pan layer is viewport-sized; keep it covering the screen.
  tx = Math.min(0, Math.max(innerWidth - innerWidth * s, tx));
  ty = Math.min(0, Math.max(innerHeight - innerHeight * s, ty));
}

function maxScale() {
  const img = $<HTMLImageElement>('[data-viewer-img]');
  const it = items[index];
  const shown = img.getBoundingClientRect().width / s || 1;
  return Math.min(6, Math.max(2.5, (it.w / shown) * 1.25));
}

function zoomAt(px: number, py: number, next: number, animate = false) {
  next = Math.min(maxScale(), Math.max(1, next));
  tx = px - ((px - tx) * next) / s;
  ty = py - ((py - ty) * next) / s;
  s = next;
  clamp();
  apply(animate);
}

function reset(animate = false) {
  s = 1;
  tx = 0;
  ty = 0;
  apply(animate);
}

function show(i: number) {
  if (!items.length) return;
  index = (i + items.length) % items.length;
  const it = items[index];
  reset();
  const img = $<HTMLImageElement>('[data-viewer-img]');
  dlg!.classList.add('is-loading');
  $<HTMLSourceElement>('[data-viewer-avif]').srcset = it.avif;
  $<HTMLSourceElement>('[data-viewer-webp]').srcset = it.webp;
  $<HTMLSourceElement>('[data-viewer-avif]').sizes = '100vw';
  $<HTMLSourceElement>('[data-viewer-webp]').sizes = '100vw';
  img.width = it.w;
  img.height = it.h;
  img.src = it.src;
  img.alt = isEn() && it.title_en ? it.title_en : it.title;
  const done = () => dlg!.classList.remove('is-loading');
  if (img.complete) done();
  else img.addEventListener('load', done, { once: true });

  const en = isEn();
  const cap = $<HTMLElement>('[data-viewer-cap]');
  cap.innerHTML = '';
  const b = document.createElement('b');
  b.textContent = en && it.title_en ? it.title_en : it.title;
  cap.append(b);
  const meta = en && it.meta_en ? it.meta_en : it.meta;
  if (meta) cap.append(Object.assign(document.createElement('span'), { textContent: meta }));
  $<HTMLElement>('[data-viewer-count]').textContent = `${String(index + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
  const single = items.length < 2;
  $<HTMLButtonElement>('[data-viewer-prev]').disabled = single;
  $<HTMLButtonElement>('[data-viewer-next]').disabled = single;

  // warm neighbours
  for (const d of [1, -1]) {
    const n = items[(index + d + items.length) % items.length];
    if (n) new Image().src = n.large;
  }
}

function open(i: number, from?: HTMLElement) {
  if (!dlg || !items.length) return;
  opener = from ?? null;
  dlg.showModal();
  document.documentElement.style.overflow = 'hidden';
  show(i);
}

function close() {
  if (!dlg?.open) return;
  dlg.close();
}

function bindDialog() {
  if (!dlg || bound) return;
  bound = true;
  const stage = $<HTMLElement>('[data-viewer-stage]');
  const pointers = new Map<number, { x: number; y: number }>();
  let start = { x: 0, y: 0, tx: 0, ty: 0, s: 1, dist: 0, mx: 0, my: 0, t: 0 };
  let lastTap = 0;
  let moved = false;

  dlg.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    const it = items[index];
    const here = location.pathname.replace(/\/?$/, '/');
    if (it && it.href && it.href !== here) navigate(it.href);
    else opener?.focus();
  });
  $('[data-viewer-close]').addEventListener('click', close);
  $('[data-viewer-prev]').addEventListener('click', () => show(index - 1));
  $('[data-viewer-next]').addEventListener('click', () => show(index + 1));
  dlg.querySelectorAll<HTMLButtonElement>('[data-viewer-zoom]').forEach((b) =>
    b.addEventListener('click', () => zoomAt(innerWidth / 2, innerHeight / 2, s * (b.dataset.viewerZoom === '1' ? 1.6 : 1 / 1.6), true)),
  );
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(index + 1);
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === '+' || e.key === '=') zoomAt(innerWidth / 2, innerHeight / 2, s * 1.6, true);
    else if (e.key === '-') zoomAt(innerWidth / 2, innerHeight / 2, s / 1.6, true);
    else if (e.key === '0') reset(true);
    else return;
    e.preventDefault();
  });

  stage.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022));
      zoomAt(e.clientX, e.clientY, s * k);
    },
    { passive: false },
  );
  stage.addEventListener('dblclick', (e) => {
    if (s > 1.01) reset(true);
    else zoomAt(e.clientX, e.clientY, 2.5, true);
  });

  stage.addEventListener('pointerdown', (e) => {
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
    if (pointers.size === 1) {
      start = { ...start, x: e.clientX, y: e.clientY, tx, ty, s, t: performance.now() };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      start = { ...start, dist: Math.hypot(a.x - b.x, a.y - b.y), s, tx, ty, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const next = Math.min(maxScale(), Math.max(1, (start.s * d) / (start.dist || d)));
      // zoom around the initial midpoint, then follow the fingers
      tx = start.mx - ((start.mx - start.tx) * next) / start.s + (mx - start.mx);
      ty = start.my - ((start.my - start.ty) * next) / start.s + (my - start.my);
      s = next;
      clamp();
      apply();
      moved = true;
      return;
    }
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) > 6) moved = true;
    if (s > 1.01) {
      dlg!.classList.add('is-dragging');
      tx = start.tx + dx;
      ty = start.ty + dy;
      clamp();
      apply();
    } else if (Math.abs(dx) > Math.abs(dy)) {
      tx = dx * 0.5;
      apply();
    }
  });
  const end = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    dlg!.classList.remove('is-dragging');
    if (pointers.size === 1) {
      const [p] = [...pointers.values()];
      start = { ...start, x: p.x, y: p.y, tx, ty, s };
      return;
    }
    if (pointers.size) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (s <= 1.01) {
      if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.2) return show(index + (dx < 0 ? 1 : -1));
      if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5 && e.pointerType === 'touch') return close();
      reset(true);
    }
    // double-tap (touch) toggles zoom
    if (!moved && e.pointerType === 'touch') {
      const now = performance.now();
      if (now - lastTap < 300) {
        s > 1.01 ? reset(true) : zoomAt(e.clientX, e.clientY, 2.5, true);
        lastTap = 0;
      } else lastTap = now;
    }
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  addEventListener('resize', () => dlg?.open && reset());
  document.addEventListener('goll:lang', () => dlg?.open && show(index));
}

export function initViewer() {
  const d = document.querySelector<HTMLDialogElement>('[data-viewer]');
  if (d !== dlg) {
    dlg = d;
    bound = false;
  }
  bindDialog();
  const data = document.querySelector('[data-viewer-items]');
  items = data ? JSON.parse(data.textContent || '[]') : [];
  document.querySelectorAll<HTMLElement>('[data-view]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      open(Number(el.dataset.view) || 0, el);
    });
  });
}
