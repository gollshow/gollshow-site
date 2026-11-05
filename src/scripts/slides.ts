/**
 * The banner at the top of the art pages: the latest works, each enlarged to fill one
 * wide frame, one at a time. Every 6.5 s the next slides in calmly from the right while
 * the current image drifts in very slowly. Stops on hover, on focus, off screen and in a
 * hidden tab; ←/→ when focused, swipe on touch, Previous / Next buttons. Reduced motion:
 * no autoplay, no movement. A click opens the full-screen viewer at that work.
 */
const DUR = 6500;

document.querySelectorAll<HTMLElement>('[data-slides]').forEach((root) => {
  const track = root.querySelector<HTMLElement>('.feat__track')!;
  const slides = [...track.children] as HTMLElement[]; // n works + a copy of the first
  const n = slides.length - 1;
  if (n < 1) return;
  const capEn = root.querySelector<HTMLElement>('[data-cap-en]');
  const capKo = root.querySelector<HTMLElement>('[data-cap-ko]');
  const year = root.querySelector<HTMLElement>('[data-cap-year]');
  const count = root.querySelector<HTMLElement>('[data-count]');
  const bar = root.querySelector<HTMLElement>('.feat__bar i');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = 0, timer = 0, hover = false, focus = false, visible = true;

  function caption() {
    const s = slides[i % n];
    if (capEn) capEn.textContent = s.dataset.titleEn || '';
    if (capKo) capKo.textContent = s.dataset.titleKo || s.dataset.titleEn || '';
    if (year) year.textContent = s.dataset.year || '';
    if (count) count.textContent = `${(i % n) + 1} / ${n}`;
    slides.forEach((x, k) => {
      x.classList.toggle('is-on', k === i);
      x.setAttribute('aria-hidden', k === i ? 'false' : 'true');
      x.querySelector('a')?.setAttribute('tabindex', k === i ? '0' : '-1');
    });
  }
  function go(k: number, animate = !calm) {
    i = k;
    track.style.transition = animate ? '' : 'none';
    track.style.transform = `translateX(${-i * 100}%)`;
    if (!animate) void track.offsetWidth;
    caption();
    restart();
  }
  track.addEventListener('transitionend', (e) => {
    if (e.target === track && i === n) go(0, false); // the copy of the first: jump back unseen
  });
  const next = () => go(i + 1);
  const prev = () => {
    if (i === 0) go(n, false);
    go(i - 1);
  };

  function restart() {
    clearTimeout(timer);
    if (bar) {
      bar.style.animation = 'none';
      void bar.offsetWidth;
      bar.style.animation = '';
    }
    const running = !calm && !hover && !focus && visible && !document.hidden;
    root.classList.toggle('is-paused', !running);
    if (running) timer = window.setTimeout(next, DUR);
  }

  root.querySelector('[data-next]')?.addEventListener('click', next);
  root.querySelector('[data-prev]')?.addEventListener('click', prev);
  const frame = root.querySelector<HTMLElement>('.feat__frame')!;
  frame.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    }
  });
  frame.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') {
      hover = true;
      restart();
    }
  });
  frame.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') {
      hover = false;
      restart();
    }
  });
  root.addEventListener('focusin', () => {
    focus = true;
    restart();
  });
  root.addEventListener('focusout', () => {
    focus = false;
    restart();
  });

  // Swipe; a swipe must not also open the viewer.
  let sx = 0, sy = 0, swiped = false;
  frame.addEventListener('pointerdown', (e) => {
    sx = e.clientX;
    sy = e.clientY;
    swiped = false;
  });
  frame.addEventListener('pointerup', (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      swiped = true;
      dx < 0 ? next() : prev();
    }
  });
  frame.addEventListener(
    'click',
    (e) => {
      if (swiped) {
        e.preventDefault();
        e.stopPropagation();
        swiped = false;
      }
    },
    true,
  );
  frame.addEventListener('dragstart', (e) => e.preventDefault());

  new IntersectionObserver((en) => {
    visible = en.some((x) => x.isIntersecting);
    restart();
  }).observe(root);
  document.addEventListener('visibilitychange', restart);
  go(0, false);
});
