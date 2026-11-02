/** Per-page UI: header on scroll, mobile menu, reveals, image settle, hang/index mode. */
let cleanup: (() => void)[] = [];
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initChrome() {
  cleanup.forEach((f) => f());
  cleanup = [];

  // Header: veil once scrolled, hide while scrolling down, return on scroll up.
  const hd = document.querySelector<HTMLElement>('[data-header]');
  if (hd) {
    let last = scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = scrollY;
        hd.classList.toggle('is-scrolled', y > 8);
        if (Math.abs(y - last) > 6) {
          hd.classList.toggle('is-hidden', y > last && y > 240 && !document.querySelector('[data-menu]:not([hidden])'));
          last = y;
        }
        ticking = false;
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    cleanup.push(() => removeEventListener('scroll', onScroll));
  }

  // Mobile menu
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  if (menu && openBtn) {
    const open = () => {
      menu.hidden = false;
      openBtn.setAttribute('aria-expanded', 'true');
      document.documentElement.style.overflow = 'hidden';
      menu.querySelector<HTMLElement>('a, button')?.focus();
    };
    const close = () => {
      menu.hidden = true;
      openBtn.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !menu.hidden && (close(), openBtn.focus());
    openBtn.addEventListener('click', open);
    menu.querySelector('[data-menu-close]')?.addEventListener('click', () => (close(), openBtn.focus()));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
    addEventListener('keydown', onKey);
    cleanup.push(() => (removeEventListener('keydown', onKey), close()));
  }

  // Images: settle from LQIP once decoded
  document.querySelectorAll<HTMLElement>('.art:not(.is-loaded)').forEach((art) => {
    const img = art.querySelector('img');
    if (!img) return;
    const done = () => art.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) done();
    else img.addEventListener('load', done, { once: true });
  });

  // Reveals (once)
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)');
  if (reduce() || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
    );
    els.forEach((el) => io.observe(el));
    cleanup.push(() => io.disconnect());
  }

  // Room mode: hang (전시) / index (목록) — remembered
  const room = document.querySelector<HTMLElement>('[data-room]');
  if (room) {
    const setMode = (m: string) => {
      room.dataset.mode = m;
      document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
      try {
        localStorage.setItem('goll:mode', m);
      } catch {}
    };
    let saved = 'hang';
    try {
      saved = localStorage.getItem('goll:mode') || 'hang';
    } catch {}
    setMode(saved);
    document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode!)));
  }
}
