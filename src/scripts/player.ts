/**
 * The horizon player. One <audio> inside a transition:persist element, so it
 * keeps playing across client-side navigation. Any element with
 * data-play='{"src","title","title_en","href"}' starts a track.
 */
type Track = { src: string; title: string; title_en?: string; href?: string; art?: string };

let root: HTMLElement | null = null;
let audio: HTMLAudioElement | null = null;
let current: Track | null = null;

const q = <T extends Element>(s: string) => root?.querySelector<T>(s) ?? null;
const fmt = (s: number) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');
const lang = () => document.documentElement.dataset.lang;
const titleOf = (t: Track) => (lang() === 'en' && t.title_en ? t.title_en : t.title);

function bind() {
  const el = document.querySelector<HTMLElement>('[data-player]');
  if (!el || el === root) return;
  root = el;
  audio = q<HTMLAudioElement>('[data-player-audio]');
  if (!audio) return;
  const bar = q<HTMLElement>('[data-player-bar]');
  const time = q<HTMLElement>('[data-player-time]');
  audio.addEventListener('timeupdate', () => {
    const d = audio!.duration;
    bar?.style.setProperty('--p', d ? String(audio!.currentTime / d) : '0');
    if (time) time.textContent = d ? `${fmt(audio!.currentTime)} / ${fmt(d)}` : fmt(audio!.currentTime);
  });
  const sync = () => {
    const playing = !!audio && !audio.paused;
    root!.classList.toggle('is-playing', playing);
    q('[data-player-toggle]')?.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    markButtons();
  };
  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);
  audio.addEventListener('ended', () => {
    sync();
    bar?.style.setProperty('--p', '0');
  });
  q('[data-player-toggle]')?.addEventListener('click', () => (audio!.paused ? audio!.play() : audio!.pause()));
  q('[data-player-close]')?.addEventListener('click', () => {
    audio!.pause();
    audio!.removeAttribute('src');
    audio!.load();
    current = null;
    root!.hidden = true;
    markButtons();
  });
}

function markButtons() {
  document.querySelectorAll<HTMLElement>('[data-play]').forEach((b) => {
    let src = '';
    try {
      src = JSON.parse(b.dataset.play || '{}').src;
    } catch {}
    const on = !!current && current.src === src && !!audio && !audio.paused;
    b.classList.toggle('is-playing', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

function renderTitle() {
  const a = q<HTMLAnchorElement>('[data-player-title]');
  if (!a || !current) return;
  a.textContent = titleOf(current);
  if (current.href) a.href = current.href;
  else a.removeAttribute('href');
}

export function play(t: Track) {
  bind();
  if (!audio || !root) return;
  if (current?.src === t.src) {
    audio.paused ? audio.play() : audio.pause();
    return;
  }
  current = t;
  audio.src = t.src;
  root.hidden = false;
  renderTitle();
  audio.play().catch(() => {});
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: titleOf(t),
      artist: 'goll',
      artwork: t.art ? [{ src: t.art, sizes: '512x512' }] : [],
    });
  }
}

export function initPlayer() {
  bind();
  document.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-play]');
    if (!b) return;
    e.preventDefault();
    try {
      play(JSON.parse(b.dataset.play || '{}'));
    } catch {}
  });
  document.addEventListener('astro:page-load', () => (bind(), markButtons()));
  document.addEventListener('goll:lang', renderTitle);
}
