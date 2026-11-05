/**
 * The "latest works" strip: the works run slowly to the left like film through a gate,
 * in a seamless loop (the list is written twice). It stops while the pointer is over it,
 * while it has focus, and while it is off screen or the tab is hidden; it can be dragged
 * with the mouse, swiped on touch, or scrolled sideways. Reduced motion: no drift.
 */
const SPEED = 26; // px per second

document.querySelectorAll<HTMLElement>('[data-strip]').forEach((el) => {
  const a = el.querySelector<HTMLElement>('[data-set="a"]');
  const b = el.querySelector<HTMLElement>('[data-set="b"]');
  if (!a || !b) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let setW = 0;
  const measure = () => (setW = b.offsetLeft - a.offsetLeft);
  measure();
  addEventListener('resize', measure);
  addEventListener('load', measure);

  let pos = el.scrollLeft, hover = false, focus = false, visible = true, drag = false, resumeAt = 0, raf = 0, last = performance.now();
  const hold = (ms = 2200) => (resumeAt = performance.now() + ms);

  function tick(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!hover && !focus && !drag && now > resumeAt && setW > 0) {
      pos += SPEED * dt;
      if (pos >= setW) pos -= setW;
      el.scrollLeft = pos;
    }
    raf = requestAnimationFrame(tick);
  }
  const run = () => {
    cancelAnimationFrame(raf);
    if (calm || !visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  // Keep the loop seamless when the visitor scrolls it by hand, and follow their position.
  el.addEventListener(
    'scroll',
    () => {
      if (setW > 0 && el.scrollLeft >= setW) el.scrollLeft -= setW;
      if (Math.abs(el.scrollLeft - pos) > 2) {
        pos = el.scrollLeft;
        hold();
      }
    },
    { passive: true },
  );
  el.addEventListener('wheel', () => hold(), { passive: true });
  el.addEventListener('touchstart', () => hold(4000), { passive: true });
  el.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && (hover = true));
  el.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') {
      hover = false;
      hold(600);
    }
  });
  el.addEventListener('focusin', () => (focus = true));
  el.addEventListener('focusout', () => {
    focus = false;
    hold();
  });

  // Mouse drag; a drag must not also open the viewer.
  let sx = 0, sl = 0, moved = false;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    sx = e.clientX;
    sl = el.scrollLeft;
    moved = false;
    drag = true;
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 4) {
      moved = true;
      el.classList.add('is-drag');
    }
    if (moved) {
      el.scrollLeft = sl - dx;
      pos = el.scrollLeft;
    }
  });
  addEventListener('pointerup', () => {
    if (!drag) return;
    drag = false;
    el.classList.remove('is-drag');
    hold(1500);
  });
  el.addEventListener(
    'click',
    (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    },
    true,
  );
  el.addEventListener('dragstart', (e) => e.preventDefault());

  new IntersectionObserver((en) => {
    visible = en.some((x) => x.isIntersecting);
    run();
  }).observe(el);
  document.addEventListener('visibilitychange', run);
  run();
});
