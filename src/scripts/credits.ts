/**
 * The credits roll: 1 px per frame at 24 frames a second. Any scroll, drag,
 * key or touch takes over; the roll resumes after a pause. 멈춤 stops it.
 */
export function initCredits(): (() => void) | undefined {
  const root = document.querySelector<HTMLElement>('[data-credits]');
  if (!root || document.documentElement.classList.contains('still')) return;
  const btn = root.querySelector<HTMLButtonElement>('[data-credits-toggle]')!;
  let stopped = false;
  let holdUntil = performance.now() + 1400; // a beat of black before the roll
  let last = 0;
  let raf = 0;
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (stopped || now < holdUntil || now - last < 41.7) return;
    last = now;
    const end = document.documentElement.scrollHeight - innerHeight;
    if (scrollY >= end - 1) return;
    scrollBy(0, 1);
  };
  raf = requestAnimationFrame(tick);
  const hold = () => (holdUntil = performance.now() + 3500);
  const evs = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
  evs.forEach((e) => addEventListener(e, hold, { passive: true }));
  // grab: drag the roll with the mouse
  let drag: { y: number; sy: number } | null = null;
  const down = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || (e.target as Element).closest('a, button, iframe')) return;
    drag = { y: e.clientY, sy: scrollY };
    root.style.cursor = 'grabbing';
  };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    hold();
    scrollTo(0, drag.sy - (e.clientY - drag.y));
  };
  const up = () => ((drag = null), (root.style.cursor = ''));
  root.addEventListener('pointerdown', down);
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
  const toggle = () => {
    stopped = !stopped;
    btn.setAttribute('aria-pressed', String(stopped));
  };
  btn.addEventListener('click', toggle);
  return () => {
    cancelAnimationFrame(raf);
    evs.forEach((e) => removeEventListener(e, hold));
    root.removeEventListener('pointerdown', down);
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
  };
}
