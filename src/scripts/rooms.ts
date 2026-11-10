/**
 * Home: the list of rooms under the pigment. Each name comes into focus, one after
 * another, as it scrolls into view (the look is in index.astro). Pointing at a room
 * tells the pigment (src/scripts/hero.ts) to flood the ground with that room's colours.
 */
import { stir } from './stir';

const rooms = [...document.querySelectorAll<HTMLElement>('.room')];
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rgb = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

if (calm || !('IntersectionObserver' in window)) {
  rooms.forEach((r) => r.classList.add('is-go', 'is-settled'));
} else {
  let next = 0;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const el = e.target as HTMLElement;
        // one after another, never all at once
        const now = performance.now();
        const at = Math.max(now, next);
        next = at + 190;
        setTimeout(() => {
          el.classList.add('is-go');
          setTimeout(() => el.classList.add('is-settled'), 2200);
        }, at - now);
      }
    },
    { threshold: 0.2, rootMargin: '0px 0px -6% 0px' },
  );
  rooms.forEach((r) => io.observe(r));
}

rooms.forEach((r) => {
  const a = r.querySelector('a');
  const pal = (r.dataset.pal || '').split(',').filter(Boolean).map(rgb);
  if (!a || pal.length !== 4) return;
  const on = () => {
    stir.hover = true;
    stir.hoverPal = pal;
  };
  const off = () => {
    stir.hover = false;
    stir.hoverPal = null;
  };
  a.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && on());
  a.addEventListener('pointerleave', off);
  a.addEventListener('focus', on);
  a.addEventListener('blur', off);
});
