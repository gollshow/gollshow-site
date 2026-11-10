/**
 * The banner of the art pages: the latest works stand side by side across the full width
 * like the panels of a folding screen. One panel is open at its work's own proportions;
 * the others wait as narrow, dim panels showing the middle of their work. Every 5.5 s the
 * next one opens (the pictures themselves never move or scale: more of them is uncovered).
 * A click on a narrow panel opens it; a click on the open one opens the viewer.
 * The page head's pigment takes the open work's colours ("pigments" event).
 * Pauses on hover, on focus, off screen, in a hidden tab and while the viewer is open.
 * Reduced motion: no auto-advance. Phones show the first five panels.
 */
const HOLD = 5500;

document.querySelectorAll<HTMLElement>('[data-screen]').forEach((root) => {
  const pans = [...root.querySelectorAll<HTMLButtonElement>('.pan')];
  if (!pans.length) return;
  const cap = root.querySelector<HTMLElement>('.kcap');
  const capEn = root.querySelector<HTMLElement>('[data-cap-en]');
  const capKo = root.querySelector<HTMLElement>('[data-cap-ko]');
  const capMeta = root.querySelector<HTMLElement>('[data-cap-meta]');
  const count = root.querySelector<HTMLElement>('[data-count]');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = matchMedia('(max-width: 700px)');
  const n = () => (narrow.matches ? Math.min(5, pans.length) : pans.length);
  let open = 0, timer = 0, swap = 0, hover = false, focus = false, visible = true;

  function caption(i: number) {
    const p = pans[i];
    if (capEn) capEn.textContent = p.dataset.titleEn || '';
    if (capKo) capKo.textContent = p.dataset.titleKo || p.dataset.titleEn || '';
    if (capMeta) capMeta.textContent = p.dataset.meta || '';
    if (count) count.textContent = `${i + 1} / ${n()}`;
  }
  function setOpen(i: number, instant = false) {
    open = i;
    pans.forEach((p, k) => {
      p.classList.toggle('is-open', k === i);
      p.setAttribute('aria-pressed', String(k === i));
    });
    const pig = (pans[i].dataset.pig || '').split(',').filter(Boolean);
    dispatchEvent(new CustomEvent('pigments', { detail: pig.length === 4 ? pig : null }));
    clearTimeout(swap);
    if (instant || calm || !cap) caption(i);
    else {
      cap.classList.add('is-swap');
      swap = window.setTimeout(() => {
        caption(i);
        cap.classList.remove('is-swap');
      }, 420);
    }
    restart();
  }
  function restart() {
    clearTimeout(timer);
    if (calm || hover || focus || !visible || document.hidden || document.querySelector('dialog[open]')) return;
    timer = window.setTimeout(() => setOpen((open + 1) % n()), HOLD);
  }
  const view = (from?: HTMLElement) => dispatchEvent(new CustomEvent('view-open', { detail: { index: open, from } }));

  pans.forEach((p, i) => p.addEventListener('click', () => (i === open ? view(p) : setOpen(i))));
  root.querySelector('[data-prev]')?.addEventListener('click', () => setOpen((open - 1 + n()) % n()));
  root.querySelector('[data-next]')?.addEventListener('click', () => setOpen((open + 1) % n()));
  root.querySelector<HTMLElement>('[data-open]')?.addEventListener('click', (e) => view(e.currentTarget as HTMLElement));

  const screen = root.querySelector<HTMLElement>('.screen')!;
  screen.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') {
      hover = true;
      restart();
    }
  });
  screen.addEventListener('pointerleave', () => {
    hover = false;
    restart();
  });
  root.addEventListener('focusin', () => {
    focus = true;
    restart();
  });
  root.addEventListener('focusout', () => {
    focus = false;
    restart();
  });
  new IntersectionObserver((en) => {
    visible = en.some((x) => x.isIntersecting);
    restart();
  }).observe(root);
  document.addEventListener('visibilitychange', restart);
  // the viewer closing lets the screen move on again
  document.querySelector('dialog.viewer')?.addEventListener('close', restart);
  narrow.addEventListener('change', () => setOpen(Math.min(open, n() - 1), true));
  setOpen(0, true);
});
