/**
 * The wall and the beam (home). Scrolling the page travels along the wall
 * (native scroll, so inertia, keys and scroll restoration are the browser's);
 * the pointer is the projector's beam; on touch the beam stays in the centre.
 */
import type { LightState, createLight as CreateLight } from './light';
import { level } from './sound';
import { capHTML, type Cap } from './caption';
import { openViewer, type VItem } from './viewer';

type W = Cap & { x: number; y: number; w: number; h: number; room: string; a: string; d: string; l: number; href: string; video: boolean };
type Data = { len: number; wallH: number; rooms: { key: string; start: number; end: number; ko: string; en: string }[]; works: W[] };

const TUNGSTEN: [number, number, number] = [246 / 255, 231 / 255, 200 / 255];
const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
/** the beam: tungsten pulled toward the work's most saturated colour, kept bright */
function beamOf(accent: string): [number, number, number] {
  const a = rgb(accent);
  const m = Math.max(...a, 0.001);
  const n = a.map((v) => v / m);
  const mix = TUNGSTEN.map((t, i) => t * 0.7 + n[i] * TUNGSTEN[i] * 0.3);
  const k = 1 / Math.max(...mix);
  return mix.map((v) => Math.min(1, v * k * 0.98)) as [number, number, number];
}
function bounceOf(dom: string, lum: number): [number, number, number] {
  const d = rgb(dom);
  const m = Math.max(...d, 0.001);
  return d.map((v) => (v / m) * (0.35 + lum * 0.5)) as [number, number, number];
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function initWall(): (() => void) | undefined {
  const root = document.querySelector<HTMLElement>('[data-wall]');
  if (!root) return;
  const data: Data = JSON.parse(root.querySelector('[data-wall-data]')!.textContent || '{}');
  const works = data.works;
  const html = document.documentElement;
  const stage = root.querySelector<HTMLElement>('[data-stage]')!;
  const track = root.querySelector<HTMLElement>('[data-track]')!;
  const probe = root.querySelector<HTMLElement>('[data-probe]')!;
  const canvas = root.querySelector<HTMLCanvasElement>('[data-light]')!;
  const cssLight = root.querySelector<HTMLElement>('[data-light-css]')!;
  const cap = root.querySelector<HTMLElement>('[data-cap]')!;
  const dot = root.querySelector<HTMLElement>('[data-dot]')!;
  const marks = [...root.querySelectorAll<HTMLButtonElement>('[data-goto]')];
  const links = [...root.querySelectorAll<HTMLAnchorElement>('[data-work]')];
  const still = html.classList.contains('still');
  const coarse = matchMedia('(hover: none)').matches;
  const off: (() => void)[] = [];
  const on = <K extends keyof WindowEventMap>(t: Window | Document | HTMLElement, type: K | string, f: (e: any) => void, o?: AddEventListenerOptions) => {
    t.addEventListener(type, f, o);
    off.push(() => t.removeEventListener(type, f, o));
  };

  html.classList.add('p-wall-html');
  // The CSS light holds the room; the WebGL beam takes over at the first sign of
  // a visitor (pointer, scroll, touch, key), so loading the page costs nothing.
  let light: ReturnType<typeof CreateLight> = null;
  if (!still) html.classList.add('no-gl');
  let glTried = false;
  let gone = false;
  const wakeGL = () => {
    if (glTried || still) return;
    glTried = true;
    // OGL is loaded only now, so the first visit downloads none of it
    import('./light')
      .then(({ createLight }) => {
        if (gone) return;
        light = createLight(canvas);
        if (light) {
          html.classList.remove('no-gl');
          dirty = true;
          schedule();
        }
      })
      .catch(() => {});
  };
  const WAKE = ['pointermove', 'pointerdown', 'wheel', 'touchstart', 'keydown'];
  for (const t of WAKE) addEventListener(t, wakeGL, { once: true, passive: true });
  off.push(() => WAKE.forEach((t) => removeEventListener(t, wakeGL)));

  // ── geometry ───────────────────────────────────────────────────────────
  let u = 1, vw = 1, vh = 1, eyeY = 1, maxTx = 0, scrollMax = 1;
  const measure = () => {
    u = probe.offsetWidth / data.wallH || 1;
    vw = innerWidth;
    vh = stage.clientHeight;
    eyeY = (parseFloat(getComputedStyle(root).getPropertyValue('--eye')) / 100) * vh;
    maxTx = Math.max(0, data.len * u - vw);
    scrollMax = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    light?.resize();
  };
  // On touch, scrolling settles with a column of works under the fixed beam:
  // invisible snap points in the page, at the scroll offsets of each column.
  const snaps: HTMLElement[] = [];
  const placeSnaps = () => {
    if (!coarse || still) return;
    const xs: number[] = [];
    for (const w of works) {
      const c = w.x + w.w / 2;
      if (!xs.some((x) => Math.abs(x - c) < 60)) xs.push(c);
    }
    while (snaps.length < xs.length) {
      const el = document.createElement('i');
      el.className = 'wall__snap';
      el.setAttribute('aria-hidden', 'true');
      root.append(el);
      snaps.push(el);
    }
    xs.forEach((c, k) => (snaps[k].style.top = `${Math.round(syOf(c * u - vw / 2))}px`));
    html.classList.add('wall-snap');
  };
  measure();
  const txOf = (sy: number) => Math.min(maxTx, Math.max(0, (sy / scrollMax) * maxTx));
  const syOf = (tx: number) => (Math.min(maxTx, Math.max(0, tx)) / (maxTx || 1)) * scrollMax;
  const travelTo = (wallX: number, smooth = true) => scrollTo({ top: syOf(wallX * u - vw / 2), behavior: smooth && !still ? 'smooth' : 'auto' });
  placeSnaps();

  // ── state ──────────────────────────────────────────────────────────────
  let tx = -1;
  const R = () => (coarse ? Math.min(vw * 0.44, vh * 0.27) : Math.min(vw, vh) * 0.25);
  let bx = vw / 2, by = eyeY, tbx = bx, tby = by;
  let mode: 'pointer' | 'key' | 'centre' = coarse ? 'centre' : 'pointer';
  let keyIdx = -1;
  let hit = -2;
  let lc = [...TUNGSTEN] as [number, number, number];
  let bc: [number, number, number] = [0, 0, 0];
  let bAmt = 0;
  let rect: [number, number, number, number] = [0, 0, 0, 0];
  let open = html.classList.contains('opening') ? 0 : 1;
  let openFrom = -1;
  let rMul = 1;
  let narrowing: { i: number; t0: number } | null = null;
  let flick = 1;
  let frameAmt = 0;
  let lastMove = 0;
  let lastTx = 0;
  let lastTxAt = 0;
  let lastFlick = 0;
  let raf = 0;
  let running = false;
  let dirty = true;

  // ── caption + position ─────────────────────────────────────────────────
  const setCap = (i: number) => {
    if (i === hit) return;
    hit = i;
    // only a work has a caption; bare wall says nothing (the reel line shows where you are)
    cap.innerHTML = i >= 0 ? capHTML(works[i]) : '';
  };

  const hitTest = () => {
    const wx = (bx + tx) / u;
    const wy = (by - eyeY) / u;
    let best = -1;
    let bd = Infinity;
    const reach = (R() * 0.55) / u;
    for (let i = 0; i < works.length; i++) {
      const w = works[i];
      if (w.x > wx + reach || w.x + w.w < wx - reach) continue;
      const dx = Math.max(w.x - wx, 0, wx - (w.x + w.w));
      const dy = Math.max(w.y - wy, 0, wy - (w.y + w.h));
      const d = Math.hypot(dx, dy);
      if (d < bd) ((bd = d), (best = i));
    }
    return bd <= reach ? best : -1;
  };

  // load what is coming before the beam gets there (sources are attached by
  // script, after first paint, so the opening is not slowed by 100 paintings)
  const warmed = new Set<number>();
  let canLoad = false;
  const load = (i: number) => {
    const pic = links[i]?.querySelector('picture');
    if (!pic) return;
    pic.querySelectorAll<HTMLSourceElement>('source[data-srcset]').forEach((s) => (s.srcset = s.dataset.srcset!));
    const img = pic.querySelector<HTMLImageElement>('img[data-src]');
    if (img && !img.getAttribute('src')) img.src = img.dataset.src!;
  };
  const warm = () => {
    if (!canLoad) return;
    const a = (tx - vw * 0.5) / u;
    const b = (tx + vw * 2.5) / u;
    for (let i = 0; i < works.length; i++) {
      if (warmed.has(i)) continue;
      const w = works[i];
      if (w.x + w.w >= a && w.x <= b) {
        load(i);
        warmed.add(i);
      }
    }
  };
  const startLoading = () => {
    if (canLoad) return;
    canLoad = true;
    warm();
  };
  if (document.readyState === 'complete') setTimeout(startLoading, 60);
  else on(window, 'load', () => setTimeout(startLoading, 60));
  setTimeout(startLoading, 1200); // in case "load" waits on something slow

  // ── frame ──────────────────────────────────────────────────────────────
  const frame = (now: number) => {
    raf = 0;
    if (!running) return;
    const ntx = txOf(scrollY);
    if (ntx !== tx) {
      tx = ntx;
      track.style.transform = `translate3d(${-tx}px,0,0)`;
      dot.style.setProperty('--p', String(Math.min(1, (tx + vw / 2) / (data.len * u))));
      const wx = (tx + vw / 2) / u;
      marks.forEach((m, i) => m.classList.toggle('is-here', wx >= data.rooms[i].start - 1100 && wx < (data.rooms[i + 1]?.start ?? Infinity) - 1100));
      warm();
      dirty = true;
    }

    if (narrowing) {
      const w = works[narrowing.i];
      tbx = (w.x + w.w / 2) * u - tx;
      tby = eyeY + (w.y + w.h / 2) * u;
    } else if (mode === 'centre') {
      tbx = vw / 2;
      tby = eyeY;
    } else if (mode === 'key' && keyIdx >= 0) {
      const w = works[keyIdx];
      tbx = (w.x + w.w / 2) * u - tx;
      tby = eyeY + (w.y + w.h / 2) * u;
    }
    // the projector head has weight
    const k = still ? 1 : 0.16;
    const nbx = lerp(bx, tbx, k);
    const nby = lerp(by, tby, k);
    if (Math.abs(nbx - bx) + Math.abs(nby - by) > 0.05) ((bx = nbx), (by = nby), (dirty = true));

    // opening: the iris opens onto the wall
    if (openFrom >= 0) {
      const t = Math.min(1, (now - openFrom) / 900);
      open = 1 - (1 - t) ** 3;
      dirty = true;
      if (t >= 1) openFrom = -1;
    }
    // narrowing onto a clicked work, then projecting it
    if (narrowing) {
      const w = works[narrowing.i];
      const t = Math.min(1, (now - narrowing.t0) / 260);
      rMul = lerp(1, Math.max(0.25, (Math.max(w.w, w.h) * u * 0.62) / R()), t);
      dirty = true;
      if (t >= 1) {
        const i = narrowing.i;
        narrowing = null;
        project(i);
        return;
      }
    } else if (rMul !== 1) {
      rMul = lerp(rMul, 1, 0.2);
      if (Math.abs(rMul - 1) < 0.002) rMul = 1;
      dirty = true;
    }

    const i = hitTest();
    setCap(i);
    // the beam rests on a work: close the shutters onto it
    if (tx !== lastTx) ((lastTx = tx), (lastTxAt = now));
    let inside = false;
    if (i >= 0) {
      const w = works[i];
      const wx = (bx + tx) / u;
      const wy = (by - eyeY) / u;
      inside = wx >= w.x && wx <= w.x + w.w && (mode === 'centre' ? Math.abs(wy - Math.min(Math.max(wy, w.y), w.y + w.h)) < 120 : wy >= w.y && wy <= w.y + w.h);
    }
    const resting = !narrowing && inside && now - lastTxAt > 380 && (mode !== 'pointer' || now - lastMove > 420) && Math.abs(tbx - bx) + Math.abs(tby - by) < 2;
    const nf = lerp(frameAmt, resting ? 1 : 0, resting ? 0.09 : 0.22);
    if (Math.abs(nf - frameAmt) > 0.001) ((frameAmt = nf), (dirty = true));
    else frameAmt = resting ? 1 : nf < 0.002 ? 0 : nf;
    const tl = i >= 0 ? beamOf(works[i].a) : TUNGSTEN;
    const tb = i >= 0 ? bounceOf(works[i].d, works[i].l) : ([0, 0, 0] as [number, number, number]);
    const ta = i >= 0 ? 0.22 : 0;
    for (let c = 0; c < 3; c++) {
      const a = lerp(lc[c], tl[c], 0.08);
      const b = lerp(bc[c], tb[c], 0.08);
      if (Math.abs(a - lc[c]) + Math.abs(b - bc[c]) > 0.0005) dirty = true;
      lc[c] = a;
      bc[c] = b;
    }
    const na = lerp(bAmt, ta, 0.08);
    if (Math.abs(na - bAmt) > 0.0005) dirty = true;
    bAmt = na;
    if (i >= 0) {
      const w = works[i];
      rect = [w.x * u - tx, eyeY + w.y * u, (w.x + w.w) * u - tx, eyeY + (w.y + w.h) * u];
    }

    // the shutter: a tiny flicker, 12 times a second (every other frame of film)
    if (open > 0 && now - lastFlick > 83.4) {
      lastFlick = now;
      flick = 1 + (Math.random() - 0.5) * 0.035 - (Math.random() < 0.006 ? 0.08 : 0);
      dirty = true;
    }
    const lv = level();

    if (dirty) {
      dirty = false;
      const r = R() * rMul;
      const s: LightState = { bx, by, r, open, light: lc, bounce: bc, bounceAmt: bAmt * open, rect, frame: frameAmt * open, ambient: 0.06, flick, level: lv, time: now / 1000 };
      if (light) light.draw(s);
      else if (!still) {
        const st = cssLight.style;
        st.setProperty('--bx', `${bx}px`);
        st.setProperty('--by', `${by}px`);
        st.setProperty('--r', `${Math.max(1, r * open)}px`);
        st.setProperty('--lc', `rgb(${lc.map((v) => Math.round(v * 255 * flick)).join(' ')})`);
        const a = bAmt * open;
        st.setProperty('--bc', `rgb(${bc.map((v) => Math.round((0.05 + v * a) * 255)).join(' ')})`);
        st.setProperty('--cx', `${(rect[0] + rect[2]) / 2}px`);
        st.setProperty('--cy', `${(rect[1] + rect[3]) / 2}px`);
        st.setProperty('--bw', `${(rect[2] - rect[0]) * 0.95 + 60}px`);
        st.setProperty('--bh', `${(rect[3] - rect[1]) * 0.95 + 60}px`);
      }
    }
    schedule();
  };
  const schedule = () => {
    if (running && !raf) raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (running) return;
    running = true;
    dirty = true;
    schedule();
  };
  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  // ── projecting a work ──────────────────────────────────────────────────
  const items = (): VItem[] =>
    works.map((w, i) => {
      const pic = links[i].querySelector('picture')!;
      const img = pic.querySelector('img')!;
      return {
        avif: pic.querySelector<HTMLSourceElement>('source[type="image/avif"]')?.dataset.srcset,
        webp: pic.querySelector<HTMLSourceElement>('source[type="image/webp"]')?.dataset.srcset,
        src: img.dataset.src!,
        w: img.width,
        h: img.height,
        bg: img.style.background,
        cap: w,
        href: w.href,
        video: w.video,
      };
    });
  const project = (i: number) => {
    stop();
    openViewer(items(), i, {
      opener: links[i],
      onClose: (j) => {
        const w = works[j];
        travelTo(w.x + w.w / 2, false);
        if (mode !== 'centre') ((mode = 'key'), (keyIdx = j));
        start();
      },
    });
  };

  // ── input ──────────────────────────────────────────────────────────────
  if (!coarse) {
    on(window, 'pointermove', (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      mode = 'pointer';
      keyIdx = -1;
      tbx = e.clientX;
      tby = e.clientY;
      lastMove = performance.now();
      schedule();
    }, { passive: true });
  }
  on(window, 'scroll', schedule, { passive: true });
  on(window, 'resize', () => (measure(), placeSnaps(), (dirty = true), schedule()));

  // horizontal wheel (trackpads) travels too
  on(window, 'wheel', (e: WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && maxTx) scrollBy({ top: (e.deltaX * scrollMax) / maxTx, behavior: 'auto' });
  }, { passive: true });

  // drag the wall (mouse, pen, and sideways swipes on touch)
  let drag: { x: number; y: number; sy: number; moved: number; id: number; vx: number; t: number; touch: boolean } | null = null;
  let glide = 0;
  on(stage, 'pointerdown', (e: PointerEvent) => {
    if (e.button !== 0) return;
    cancelAnimationFrame(glide);
    drag = { x: e.clientX, y: e.clientY, sy: scrollY, moved: 0, id: e.pointerId, vx: 0, t: performance.now(), touch: e.pointerType === 'touch' };
  });
  on(window, 'pointermove', (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (drag.touch && Math.abs(dy) > Math.abs(dx)) return; // vertical swipes scroll natively
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    if (drag.moved < 4) return;
    stage.classList.add('is-dragging');
    const now = performance.now();
    const target = drag.sy - (dx * scrollMax) / (maxTx || 1);
    drag.vx = (target - scrollY) / Math.max(1, now - drag.t);
    drag.t = now;
    scrollTo({ top: target, behavior: 'auto' });
  });
  const endDrag = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    stage.classList.remove('is-dragging');
    if (d.moved > 6) {
      // a little inertia, like a pushed dolly
      let v = d.vx * 16;
      const step = () => {
        if (Math.abs(v) < 0.5) return;
        scrollBy({ top: v, behavior: 'auto' });
        v *= 0.92;
        glide = requestAnimationFrame(step);
      };
      if (!still) glide = requestAnimationFrame(step);
      const swallow = (ev: Event) => (ev.preventDefault(), ev.stopPropagation());
      stage.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => stage.removeEventListener('click', swallow, { capture: true }), 50);
    }
  };
  on(window, 'pointerup', endDrag);
  on(window, 'pointercancel', endDrag);

  on(window, 'keydown', (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open]')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollBy({ top: ((e.key === 'ArrowRight' ? 1 : -1) * vw * 0.45 * scrollMax) / (maxTx || 1), behavior: still ? 'auto' : 'smooth' });
    }
  });

  // keyboard focus moves the beam from work to work
  links.forEach((a, i) =>
    on(a, 'focus', () => {
      if (a.matches(':focus-visible')) {
        const w = works[i];
        travelTo(w.x + w.w / 2, false);
        if (mode !== 'centre') ((mode = 'key'), (keyIdx = i));
        schedule();
      }
    }),
  );
  // a click projects the work (modified clicks open the page as usual)
  links.forEach((a, i) =>
    on(a, 'click', (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (still) return project(i);
      narrowing = { i, t0: performance.now() };
      schedule();
    }),
  );
  marks.forEach((m) => on(m, 'click', () => travelTo(Number(m.dataset.goto) + 900)));

  // the opening hands over to the beam
  const opened = () => {
    if (open < 1 && openFrom < 0) openFrom = performance.now();
    html.classList.add('lit');
    schedule();
  };
  if (open < 1) on(document, 'goll:opened', opened);
  else html.classList.add('lit');

  on(document, 'visibilitychange', () => (document.hidden ? stop() : start()));
  on(document, 'goll:lang', () => ((hit = -2), (dirty = true), schedule()));

  start();
  return () => {
    gone = true;
    stop();
    off.forEach((f) => f());
    light?.destroy();
    html.classList.remove('p-wall-html', 'lit', 'no-gl', 'wall-snap');
    snaps.forEach((el) => el.remove());
  };
}
