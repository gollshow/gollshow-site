/**
 * Home: an optional sound for the pigment, off until the visitor asks for it.
 * A soft open chord breathes slowly; stirring the pigment opens its tone and adds a
 * faint watery texture; every drop that falls on the pigment plays one note, higher
 * the higher it lands.
 * Fades out when switched off; pauses in a hidden tab.
 */
import { stir } from './stir';

const btn = document.querySelector<HTMLButtonElement>('[data-sound]');
let ctx: AudioContext | undefined;
let master: GainNode, filter: BiquadFilterNode, pan: StereoPannerNode, waterGain: GainNode, waterBand: BiquadFilterNode;
let on = false, raf = 0;

const NOTES = [146.83, 220, 329.63, 369.99]; // D3 A3 E4 F#4
const DROPS = [587.33, 659.25, 739.99, 880, 987.77]; // D5 E5 F#5 A5 B5

function build() {
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0;
  pan = ctx.createStereoPanner();
  filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 520;
  filter.Q.value = 0.5;
  filter.connect(pan).connect(master).connect(ctx.destination);
  // the chord: two slightly detuned oscillators per note, each breathing at its own pace
  NOTES.forEach((f, i) => {
    const g = ctx!.createGain();
    g.gain.value = 0.16;
    const lfo = ctx!.createOscillator();
    const lfoAmp = ctx!.createGain();
    lfo.frequency.value = 0.05 + i * 0.023;
    lfoAmp.gain.value = 0.09;
    lfo.connect(lfoAmp).connect(g.gain);
    lfo.start();
    for (const [type, cents] of [['sine', -4], ['triangle', 5]] as const) {
      const o = ctx!.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = cents;
      o.connect(g);
      o.start();
    }
    g.connect(filter);
  });
  // water: soft noise through a moving band, louder only while the pigment is stirred
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  noise.loop = true;
  waterBand = ctx.createBiquadFilter();
  waterBand.type = 'bandpass';
  waterBand.Q.value = 0.9;
  waterGain = ctx.createGain();
  waterGain.gain.value = 0;
  noise.connect(waterBand).connect(waterGain).connect(pan);
  noise.start();
}

function drop(y = 0, quiet = true) {
  if (!ctx || !on) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  const f = DROPS[Math.max(0, Math.min(DROPS.length - 1, Math.floor((y + 0.5) * DROPS.length)))];
  o.frequency.setValueAtTime(f * 1.5, t);
  o.frequency.exponentialRampToValueAtTime(f, t + 0.09);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(quiet ? 0.05 : 0.11, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
  o.connect(g).connect(pan);
  o.start(t);
  o.stop(t + 3.3);
}

function follow() {
  if (!ctx || !on) return;
  const t = ctx.currentTime;
  filter.frequency.setTargetAtTime(480 + stir.v * 2000 + stir.y * 260, t, 0.35);
  pan.pan.setTargetAtTime((stir.x - 0.5) * 0.6, t, 0.5);
  waterBand.frequency.setTargetAtTime(520 + stir.v * 1500, t, 0.3);
  waterGain.gain.setTargetAtTime(Math.min(0.05, stir.v * 0.07), t, 0.25);
  raf = requestAnimationFrame(follow);
}

async function set(v: boolean) {
  on = v;
  btn?.setAttribute('aria-pressed', String(v));
  if (v) {
    if (!ctx) build();
    await ctx!.resume();
    master.gain.cancelScheduledValues(ctx!.currentTime);
    master.gain.setTargetAtTime(0.11, ctx!.currentTime, 0.8);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(follow);
  } else if (ctx) {
    cancelAnimationFrame(raf);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    setTimeout(() => !on && ctx?.suspend(), 1200);
  }
}

stir.onDrop = drop;

if (btn && 'AudioContext' in window) {
  btn.hidden = false;
  btn.addEventListener('click', () => set(!on));
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !on) return;
    if (document.hidden) ctx.suspend();
    else {
      ctx.resume();
      raf = requestAnimationFrame(follow);
    }
  });
}
