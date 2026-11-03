/** A reel page: the frame crossing the middle of the screen is in the gate. */
import { capHTML, type Cap } from './caption';
import { openViewer, type VItem } from './viewer';

export function initReel(): (() => void) | undefined {
  const root = document.querySelector<HTMLElement>('[data-reel]');
  if (!root) return;
  const frames = [...root.querySelectorAll<HTMLElement>('[data-frame]')];
  const caps: Cap[] = frames.map((f) => JSON.parse(f.dataset.cap || '{}'));
  const capEl = root.querySelector<HTMLElement>('[data-reel-cap]')!;
  let cur = -1;
  const gate = (i: number) => {
    if (i === cur || i < 0) return;
    frames[cur]?.classList.remove('is-gate');
    cur = i;
    frames[i].classList.add('is-gate');
    capEl.innerHTML = capHTML(caps[i]);
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) gate(frames.indexOf(e.target as HTMLElement));
    },
    { rootMargin: '-49% 0px -49% 0px', threshold: 0 },
  );
  frames.forEach((f) => io.observe(f));
  gate(0);

  const items = (): VItem[] =>
    frames.map((f, i) => {
      const img = f.querySelector('img');
      return {
        avif: f.querySelector<HTMLSourceElement>('source[type="image/avif"]')?.srcset,
        webp: f.querySelector<HTMLSourceElement>('source[type="image/webp"]')?.srcset,
        src: img?.getAttribute('src') ?? '',
        w: img?.width ?? 4,
        h: img?.height ?? 5,
        bg: img?.style.background,
        cap: caps[i],
        href: f.dataset.href!,
        video: f.dataset.video === '1',
      };
    });
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('[data-reel-open]');
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const n = Number(a.dataset.reelOpen);
    openViewer(items(), n, {
      opener: a,
      onClose: (j) => {
        frames[j]?.scrollIntoView({ block: 'center' });
        gate(j);
      },
    });
  };
  root.addEventListener('click', onClick);
  return () => {
    io.disconnect();
    root.removeEventListener('click', onClick);
  };
}
