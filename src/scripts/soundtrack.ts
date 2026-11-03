/**
 * The optical soundtrack: a bilateral variable-area track printed along the
 * film. The film runs downward; each new row is as wide as the sound at that
 * instant. Silence prints a thin bias line. Only real sound is drawn: the
 * projector hum or an uploaded track, and only while sound is on.
 */
import { waveform, onSound, soundOn, trackPlaying } from './sound';

export function initSoundtrack(): (() => void) | undefined {
  const c = document.querySelector<HTMLCanvasElement>('[data-soundtrack]');
  if (!c) return;
  const g = c.getContext('2d')!;
  const still = document.documentElement.classList.contains('still');
  let w = 0;
  let h = 0;
  let dpr = 1;
  let raf = 0;
  const TUNG = '#f6e7c8';

  const frameMarks = () => {
    // perforations along the outer edge of the track
    g.fillStyle = '#24201b';
    const step = 22 * dpr;
    for (let y = 0; y < h; y += step) g.fillRect(2 * dpr, y + 5 * dpr, 6 * dpr, 12 * dpr);
  };
  const reset = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    w = c.width = Math.round(c.clientWidth * dpr);
    h = c.height = Math.round(c.clientHeight * dpr);
    g.fillStyle = '#0b0907';
    g.fillRect(0, 0, w, h);
    bias(0, h);
  };
  const lane = () => ({ x0: 14 * dpr, x1: w - 6 * dpr });
  const bias = (y0: number, y1: number) => {
    const { x0, x1 } = lane();
    const mid = (x0 + x1) / 2;
    g.fillStyle = '#0b0907';
    g.fillRect(x0 - 2, y0, x1 - x0 + 4, y1 - y0);
    g.fillStyle = TUNG;
    g.globalAlpha = 0.85;
    g.fillRect(mid - 0.75 * dpr, y0, 1.5 * dpr, y1 - y0);
    g.globalAlpha = 1;
    frameMarks();
  };

  const roll = () => {
    raf = 0;
    const data = waveform();
    if (!data) return bias(0, h);
    const rows = Math.round(5 * dpr); // the film moves 5 px a frame
    // move the printed film down
    g.drawImage(c, 0, 0, w, h - rows, 0, rows, w, h - rows);
    const { x0, x1 } = lane();
    const mid = (x0 + x1) / 2;
    const half = (x1 - x0) / 2;
    g.fillStyle = '#0b0907';
    g.fillRect(0, 0, w, rows);
    g.fillStyle = TUNG;
    const chunk = Math.floor(data.length / rows);
    const gain = trackPlaying() ? 2.2 : 6; // music is loud, the hum is a whisper
    for (let r = 0; r < rows; r++) {
      let peak = 0;
      for (let i = r * chunk; i < (r + 1) * chunk; i++) peak = Math.max(peak, Math.abs(data[i]));
      const a = Math.min(half, 0.75 * dpr + peak * half * gain);
      g.fillRect(mid - a, rows - 1 - r, a * 2, 1);
    }
    g.fillStyle = '#24201b';
    for (let y = 0; y < rows; y++) if ((performance.now() / 16 + y) % 22 < 12) g.fillRect(2 * dpr, y, 6 * dpr, 1);
    raf = requestAnimationFrame(roll);
  };

  const start = () => {
    if (still) return bias(0, h);
    if (!raf && soundOn()) raf = requestAnimationFrame(roll);
  };
  reset();
  start();
  const offSound = onSound((on) => (on ? start() : (cancelAnimationFrame(raf), (raf = 0), bias(0, h))));
  const onPlay = () => setTimeout(start, 50);
  document.addEventListener('play', onPlay, true);
  const onResize = () => reset();
  addEventListener('resize', onResize);
  return () => {
    cancelAnimationFrame(raf);
    offSound();
    document.removeEventListener('play', onPlay, true);
    removeEventListener('resize', onResize);
  };
}
