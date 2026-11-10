/** Full-screen viewer: see src/components/Viewer.astro. */
import type { ViewerItem } from '../lib/art';

const dlg = document.querySelector<HTMLDialogElement>('dialog.viewer');

if (dlg) {
  const items: ViewerItem[] = JSON.parse(dlg.querySelector('.viewer__data')?.textContent || '[]');
  const stage = dlg.querySelector<HTMLElement>('.viewer__stage')!;
  const fig = dlg.querySelector<HTMLElement>('.viewer__fig')!;
  const img = dlg.querySelector<HTMLImageElement>('.viewer__img')!;
  const video = dlg.querySelector<HTMLElement>('.viewer__video')!;
  const cap = dlg.querySelector<HTMLElement>('.viewer__cap')!;
  const count = dlg.querySelector<HTMLElement>('.viewer__count')!;
  const det = dlg.querySelector<HTMLElement>('.viewer__details')!;
  const more = dlg.querySelector<HTMLButtonElement>('.viewer__more')!;
  const proc = dlg.querySelector<HTMLButtonElement>('[data-process]')!;
  const procA = dlg.querySelector<HTMLElement>('.viewer__process-a')!;
  const procB = dlg.querySelector<HTMLElement>('.viewer__process-b')!;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const lang = () => (document.documentElement.dataset.lang === 'ko' ? 'ko' : 'en');
  let i = 0;
  let opener: HTMLElement | null = null;
  let token = 0;
  let playing = false;

  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

  function box() {
    const r = stage.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(stage).paddingLeft) || 16;
    return { W: Math.max(100, r.width - pad * 2), H: Math.max(100, r.height - 8) };
  }

  /** Fit to the viewport, but never more than 1.5× the image's natural size (in CSS pixels). */
  function fit() {
    const it = items[i];
    if (!it) return;
    const { W, H } = box();
    const k = Math.min(W / it.w, H / it.h, 1.5);
    const w = Math.round(it.w * k), h = Math.round(it.h * k);
    fig.style.width = `${w}px`;
    fig.style.height = `${h}px`;
    img.sizes = `${w}px`;
    if (playing) {
      const vw = Math.min(W, (H * 16) / 9);
      video.style.width = `${Math.round(vw)}px`;
      video.style.height = `${Math.round((vw * 9) / 16)}px`;
    }
  }

  function caption() {
    const it = items[i];
    const l = lang();
    const t = it.title?.[l] ?? it.title?.en ?? it.title?.ko;
    cap.innerHTML =
      (t ? `<p class="viewer__title"${l === 'ko' && it.title?.ko ? ' lang="ko"' : ''}>${esc(t)}</p>` : '') +
      (it.meta.length ? `<p class="viewer__meta">${it.meta.map(esc).join(' · ')}</p>` : '');
    img.alt = it.alt[l];
    count.textContent = `${i + 1} / ${items.length}`;
  }

  function stopVideo() {
    playing = false;
    video.hidden = true;
    video.innerHTML = '';
    fig.hidden = false;
    procA.hidden = false;
    procB.hidden = true;
  }

  async function show(n: number) {
    i = (n + items.length) % items.length;
    const it = items[i];
    const my = ++token;
    stopVideo();
    proc.hidden = !it.process;
    caption();
    details();
    dlg!.scrollTop = 0;
    fig.classList.remove('is-bleed');
    fig.classList.add('is-wait');
    img.removeAttribute('src');
    img.srcset = it.srcset;
    fit();
    img.src = it.src;
    try {
      await img.decode();
    } catch {}
    if (my !== token) return;
    fig.classList.remove('is-wait');
    if (!calm.matches) {
      void fig.offsetWidth; // restart the bleed for every image
      fig.classList.add('is-bleed');
    }
    if (dlg!.open) history.replaceState(null, '', `#${i + 1}`);
    // Warm the neighbours.
    [items[(i + 1) % items.length], items[(i - 1 + items.length) % items.length]].forEach((x) => {
      const p = new Image();
      p.sizes = img.sizes;
      p.srcset = x.srcset;
    });
  }

  // The detail cuts of the work, one under another below the first screen; each comes into focus as it is reached.
  const dio =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (en) =>
            en.forEach((e) => {
              if (!e.isIntersecting) return;
              dio!.unobserve(e.target);
              e.target.classList.add('is-in');
            }),
          { threshold: 0.12 },
        )
      : null;
  function moreText(n: number) {
    more.textContent = lang() === 'ko' ? `아래에 디테일 ${n}장` : `${n} ${n === 1 ? 'detail' : 'details'} below`;
  }
  function details() {
    const it = items[i];
    const d = it.details ?? [];
    det.replaceChildren();
    det.hidden = more.hidden = !d.length;
    if (!d.length) return;
    moreText(d.length);
    const l = lang();
    d.forEach((x, k) => {
      const f = document.createElement('figure');
      f.className = 'viewer__det';
      f.style.maxWidth = `${Math.round(x.w * 1.5)}px`; // never more than 1.5× its natural size
      const im = document.createElement('img');
      if (x.srcset) {
        im.srcset = x.srcset;
        im.sizes = '(max-width: 1100px) 100vw, 1100px';
      }
      im.src = x.src;
      im.width = x.w;
      im.height = x.h;
      im.loading = 'lazy';
      im.decoding = 'async';
      im.alt = l === 'ko' ? `${it.alt.ko}, 디테일 ${k + 1}` : `${it.alt.en}, detail ${k + 1}`;
      f.append(im);
      det.append(f);
      if (dio && !calm.matches) dio.observe(f);
      else f.classList.add('is-in');
    });
  }
  more.addEventListener('click', () => det.scrollIntoView({ behavior: calm.matches ? 'auto' : 'smooth', block: 'start' }));

  function open(n: number, from?: HTMLElement | null) {
    opener = from ?? null;
    if (!dlg!.open) dlg!.showModal();
    show(n);
  }

  function close() {
    if (dlg!.open) dlg!.close();
  }

  dlg.addEventListener('close', () => {
    stopVideo();
    token++;
    history.replaceState(null, '', location.pathname + location.search);
    opener?.focus({ preventScroll: true });
  });

  function process() {
    const it = items[i];
    if (!it.process) return;
    if (playing) return show(i);
    const ground = getComputedStyle(document.documentElement).getPropertyValue('--ground').trim() || '#f2f0eb';
    let src = it.process;
    try {
      const u = new URL(src);
      if (u.searchParams.has('bgcolor')) u.searchParams.set('bgcolor', ground);
      src = u.href;
    } catch {}
    const f = document.createElement('iframe');
    f.src = src;
    f.allow = 'autoplay; fullscreen; picture-in-picture';
    f.allowFullscreen = true;
    f.title = lang() === 'ko' ? '작업 과정 영상' : 'Process video';
    video.replaceChildren(f);
    playing = true;
    fig.hidden = true;
    video.hidden = false;
    procA.hidden = true;
    procB.hidden = false;
    fit();
  }

  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLElement>('[data-view]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || (e as MouseEvent).button > 0) return;
    e.preventDefault();
    open(Number(a.dataset.view), a);
    if (a.hasAttribute('data-process-open')) process();
  });
  dlg.querySelector('[data-close]')!.addEventListener('click', close);
  dlg.querySelectorAll('[data-prev]').forEach((b) => b.addEventListener('click', () => show(i - 1)));
  dlg.querySelectorAll('[data-next]').forEach((b) => b.addEventListener('click', () => show(i + 1)));
  proc.addEventListener('click', process);
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      show(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      show(i + 1);
    }
  });

  // Swipe
  let sx = 0, sy = 0, st = 0;
  stage.addEventListener('pointerdown', (e) => {
    sx = e.clientX;
    sy = e.clientY;
    st = e.timeStamp;
  });
  stage.addEventListener('pointerup', (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4 && e.timeStamp - st < 900) show(i + (dx < 0 ? 1 : -1));
  });
  // A swipe must not also count as a tap on a prev/next zone.
  stage.querySelectorAll<HTMLElement>('.viewer__zone').forEach((z) =>
    z.addEventListener('click', (e) => {
      if (Math.abs(e.clientX - sx) > 10) e.stopImmediatePropagation();
    }, true),
  );

  addEventListener('resize', () => dlg.open && fit());
  addEventListener('langchange', () => {
    if (!dlg.open) return;
    caption();
    if (items[i].details?.length) moreText(items[i].details!.length);
  });
  // the banner opens a work by its index
  addEventListener('view-open', (e) => {
    const d = (e as CustomEvent<{ index: number; from?: HTMLElement }>).detail;
    if (d && d.index >= 0 && d.index < items.length) open(d.index, d.from);
  });

  // Deep link: /painting/#12 opens the twelfth work.
  const m = location.hash.match(/^#(\d+)$/);
  if (m && items.length) {
    const n = Number(m[1]) - 1;
    if (n >= 0 && n < items.length) open(n, document.querySelector<HTMLElement>(`[data-view="${n}"]`));
  }
}
