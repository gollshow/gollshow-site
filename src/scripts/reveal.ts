/**
 * Ink reveal: elements with [data-reveal] get .is-in the first time they come into view
 * (an image waits until it has loaded), then .is-done once their animation ends. The
 * look is in global.css: "bleed" develops through the noise-wash mask, "rise" lifts in.
 * Reduced motion, or no IntersectionObserver: everything is shown at once.
 */
const els = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

function show(el: HTMLElement) {
  const img = el instanceof HTMLImageElement ? el : el.querySelector('img');
  const go = () => {
    el.classList.add('is-in');
    const done = () => el.classList.add('is-done');
    el.addEventListener('animationend', (e) => e.target === el && done());
    setTimeout(done, 1600 + Number(el.style.getPropertyValue('--d') || 0));
  };
  // Wait for an image only if it is actually shown (a hidden lazy image never loads), and never long.
  if (img && !img.complete && img.getClientRects().length > 0) {
    let done = false;
    const once = () => !done && ((done = true), go());
    img.addEventListener('load', once, { once: true });
    img.addEventListener('error', once, { once: true });
    setTimeout(once, 1500);
  } else go();
}

if (calm || !('IntersectionObserver' in window)) {
  els.forEach((e) => e.classList.add('is-in', 'is-done'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries)
        if (e.isIntersecting) {
          io.unobserve(e.target);
          show(e.target as HTMLElement);
        }
    },
    { threshold: 0.12, rootMargin: '0px 0px -4% 0px' },
  );
  els.forEach((e) => io.observe(e));
}
