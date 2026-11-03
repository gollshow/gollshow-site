/** Hands the opening over to the wall: at 2.2 s (or on skip) the beam opens. */
export function initOpening(): (() => void) | undefined {
  const d = document.documentElement;
  const op = document.querySelector<HTMLElement>('[data-opening]');
  if (!op || !d.classList.contains('opening')) return;
  let done = false;
  const remember = () => {
    try {
      sessionStorage.setItem('goll:opened', '1');
    } catch {}
  };
  const hand = () => {
    if (done) return;
    done = true;
    remember();
    document.dispatchEvent(new Event('goll:opened'));
  };
  const finish = () => {
    hand();
    op.hidden = true;
    d.classList.remove('opening');
  };
  const skip = () => {
    if (op.hidden) return;
    d.classList.add('op-skip');
    hand();
    setTimeout(finish, 280);
  };
  remember();
  const t1 = setTimeout(hand, 2200);
  const t2 = setTimeout(finish, 3050);
  const keys = (e: KeyboardEvent) => !e.metaKey && !e.ctrlKey && skip();
  op.querySelector('[data-opening-skip]')?.addEventListener('click', skip);
  op.addEventListener('pointerdown', skip);
  addEventListener('keydown', keys);
  addEventListener('wheel', skip, { passive: true, once: true });
  addEventListener('touchmove', skip, { passive: true, once: true });
  return () => {
    clearTimeout(t1);
    clearTimeout(t2);
    removeEventListener('keydown', keys);
    removeEventListener('wheel', skip);
    removeEventListener('touchmove', skip);
    if (!done) finish();
  };
}
