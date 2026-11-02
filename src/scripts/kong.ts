/**
 * 空 opens.
 * At rest: the character in ink, breathing — its strokes swell and settle like
 * ink soaking into hanji. On scroll: the ink turns into a painting seen through
 * the strokes, the strokes bleed outward while we travel into the pillar of 工,
 * and the work finally settles on the wall with its label.
 *
 * Canvas 2D: the glyph outline is filled and *stroked* (stroking = dilation),
 * the painting is composited `source-atop`. Only runs while visible.
 */
type HeroWork = { src: string; w: number; h: number; title?: string; title_en?: string; meta?: string; href?: string; avif?: string; webp?: string };
type Data = { d: string; bbox: { x1: number; y1: number; x2: number; y2: number }; focal: { x: number; y: number }; works: HeroWork[] };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

const Z_END = 7;
const P_COVER = 0.6; // window fully open
const P_SETTLE = 0.9; // work framed

let stop: (() => void) | null = null;

export function initKong() {
  stop?.();
  stop = null;
  const root = document.querySelector<HTMLElement>('[data-kong]');
  if (!root) return;
  const dataEl = root.querySelector('[data-kong-data]');
  if (!dataEl) return;
  const data: Data = JSON.parse(dataEl.textContent || '{}');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx || reduce.matches || typeof Path2D === 'undefined') {
    root.classList.add('is-static');
    return;
  }

  const stage = root.querySelector<HTMLElement>('[data-kong-stage]')!;
  const fig = root.querySelector<HTMLElement>('[data-kong-work]')!;
  const figImg = fig.querySelector<HTMLImageElement>('img');
  const fades = root.querySelectorAll<HTMLElement>('[data-kong-fade]');
  const label = root.querySelector<HTMLElement>('[data-kong-label]');
  const path = new Path2D(data.d);
  const bb = data.bbox;
  const gw = bb.x2 - bb.x1;
  const gh = bb.y2 - bb.y1;
  const gcx = (bb.x1 + bb.x2) / 2;
  const gcy = (bb.y1 + bb.y2) / 2;

  // choose today's work (stable for a day, different across days)
  const works = data.works.filter((w) => w.src);
  const day = Math.floor(Date.now() / 864e5);
  const pick = works.length ? works[day % works.length] : undefined;
  let art: HTMLImageElement | null = null;
  let artReady = false;
  if (pick) {
    art = new Image();
    art.decoding = 'async';
    art.src = pick.src;
    art.decode().then(() => (artReady = true)).catch(() => (artReady = art!.complete));
    if (figImg && fig.dataset.src !== pick.src) {
      // swap the framed DOM image to the same work
      const pic = figImg.closest('picture');
      pic?.querySelectorAll('source').forEach((s) => s.remove());
      figImg.srcset = '';
      figImg.src = pick.src;
      figImg.width = pick.w;
      figImg.height = pick.h;
      figImg.alt = pick.title ?? '';
    }
    root.querySelectorAll<HTMLElement>('[data-kong-title]').forEach((el) => {
      const en = el.getAttribute('lang') === 'en';
      el.textContent = (en ? pick.title_en || pick.title : pick.title) ?? '';
    });
    const meta = root.querySelector<HTMLElement>('[data-kong-meta]');
    if (meta) meta.textContent = pick.meta ?? '';
    const link = root.querySelector<HTMLAnchorElement>('[data-kong-link]');
    if (link && pick.href) link.href = pick.href;
  }

  let W = 0;
  let H = 0;
  let dpr = 1;
  let G = 0; // glyph px width at rest
  let k = 0; // px per glyph unit at rest
  let contain = { x: 0, y: 0, w: 0, h: 0 };
  let cover = { x: 0, y: 0, w: 0, h: 0 };

  const measure = () => {
    W = stage.clientWidth;
    H = stage.clientHeight;
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    G = Math.min(W * 0.74, H * 0.58 * (gw / gh), 640);
    k = G / gw;
    if (pick) {
      const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) + 20 || 84;
      const side = Math.max(20, Math.min(88, W * 0.05));
      const bottom = W < 640 ? 112 : 104;
      const aw = W - side * 2;
      const ah = H - top - bottom;
      const cs = Math.min(aw / pick.w, ah / pick.h);
      contain = { w: pick.w * cs, h: pick.h * cs, x: 0, y: 0 };
      contain.x = (W - contain.w) / 2;
      contain.y = top + (ah - contain.h) / 2;
      const vs = Math.max(W / pick.w, H / pick.h);
      cover = { w: pick.w * vs, h: pick.h * vs, x: 0, y: 0 };
      cover.x = (W - cover.w) / 2;
      cover.y = (H - cover.h) / 2;
      Object.assign(fig.style, { left: `${contain.x}px`, top: `${contain.y}px`, width: `${contain.w}px`, height: `${contain.h}px` });
      label?.style.setProperty('--label-top', `${contain.y + contain.h + 16}px`);
      label?.style.setProperty('--label-left', `${contain.x}px`);
    }
  };

  const progress = () => {
    const r = root.getBoundingClientRect();
    const dist = r.height - H;
    return dist > 0 ? clamp01(-r.top / dist) : 0;
  };

  let ink = '#1a1a18';
  const readInk = () => (ink = getComputedStyle(root).getPropertyValue('--ink').trim() || ink);
  readInk();

  let raf = 0;
  let visible = true;
  let lastP = -1;
  const t0 = performance.now();

  const draw = (now: number) => {
    raf = 0;
    const p = progress();
    const zp = ease(range(p, 0, P_COVER));
    const breathe = (1 - range(p, 0, 0.08)) * (0.5 - 0.5 * Math.cos(((now - t0) / 7000) * Math.PI * 2));
    const mix = easeOut(range(p, 0.015, 0.22));

    if (p < P_COVER + 0.02) {
      const z = Math.exp(Math.log(Z_END) * zp);
      // where the focal point sits on screen: from its resting place to the centre
      const restX = W / 2 + (data.focal.x - gcx) * k;
      const restY = H * 0.48 + (data.focal.y - gcy) * k;
      const px = lerp(restX, W / 2, zp);
      const py = lerp(restY, H / 2, zp);
      // dilation needed to cover the screen at the end of the zoom
      const need = (Math.hypot(W, H) / 2 / (k * Z_END) - 24) * 2 * 1.12;
      const grow = Math.pow(range(p, 0.02, P_COVER), 2.4);
      const lw = breathe * 7 + grow * need;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(k * z, k * z);
      ctx.translate(-data.focal.x, -data.focal.y);
      ctx.fillStyle = ink;
      ctx.strokeStyle = ink;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.fill(path);
      if (lw > 0.05) {
        ctx.lineWidth = lw;
        ctx.stroke(path);
      }
      ctx.restore();
      if (art && artReady && mix > 0) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = mix;
        ctx.drawImage(art, cover.x, cover.y, cover.w, cover.h);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    // phase 2: the framed DOM work takes over and settles from cover to contain
    const settle = ease(range(p, P_COVER, P_SETTLE));
    const handover = p >= P_COVER && artReady;
    canvas.style.opacity = handover ? '0' : '1';
    fig.style.opacity = handover ? '1' : '0';
    if (pick && contain.w) {
      const sc = lerp(cover.w / contain.w, 1, settle);
      const dx = lerp(cover.x + cover.w / 2 - (contain.x + contain.w / 2), 0, settle);
      const dy = lerp(cover.y + cover.h / 2 - (contain.y + contain.h / 2), 0, settle);
      fig.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${sc})`;
    }
    const meta = 1 - range(p, 0.0, 0.07);
    fades.forEach((el) => (el.style.opacity = String(meta)));
    if (label) label.style.opacity = String(range(p, 0.84, 0.95));
    root.classList.toggle('is-open', p > 0.02);

    lastP = p;
    // keep breathing while at rest and visible
    if (visible && (p < 0.08 || p !== lastP)) schedule();
  };

  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(draw);
  };

  const onScroll = () => schedule();
  const onResize = () => {
    measure();
    schedule();
  };
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) schedule();
  });
  io.observe(root);
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const onTheme = () => (readInk(), schedule());
  mq.addEventListener('change', onTheme);
  const themeObs = new MutationObserver(onTheme);
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Tap 空 (or press "open") to play the opening as a guided scroll.
  let auto = 0;
  const cancelAuto = () => auto && (cancelAnimationFrame(auto), (auto = 0));
  const play = () => {
    cancelAuto();
    const r = root.getBoundingClientRect();
    const from = scrollY;
    const to = scrollY + r.top + (r.height - H) * 0.93;
    const t1 = performance.now();
    const dur = 3200;
    const step = (now: number) => {
      const t = clamp01((now - t1) / dur);
      scrollTo(0, lerp(from, to, ease(t)));
      auto = t < 1 ? requestAnimationFrame(step) : 0;
    };
    auto = requestAnimationFrame(step);
  };
  const trigger = root.querySelector<HTMLElement>('[data-kong-play]');
  trigger?.addEventListener('click', play);
  addEventListener('wheel', cancelAuto, { passive: true });
  addEventListener('touchstart', cancelAuto, { passive: true });
  addEventListener('keydown', cancelAuto);

  measure();
  root.classList.add('is-live');
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  if (art) art.addEventListener('load', () => ((artReady = true), schedule()));
  schedule();

  stop = () => {
    cancelAnimationFrame(raf);
    cancelAuto();
    io.disconnect();
    themeObs.disconnect();
    mq.removeEventListener('change', onTheme);
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onResize);
    removeEventListener('wheel', cancelAuto);
    removeEventListener('touchstart', cancelAuto);
    removeEventListener('keydown', cancelAuto);
  };
  document.addEventListener('astro:before-swap', () => stop?.(), { once: true });
}
