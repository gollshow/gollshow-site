/**
 * Sound: off by default. "소리 켜기" starts a quiet synthesized projector
 * (motor, fan, the 24 fps clatter of the intermittent movement). Uploaded
 * tracks played by the mini-player run through the same graph, and the hum
 * steps back while they play. level() feeds the beam and the soundtrack.
 */
let ctx: AudioContext | null = null;
let master: GainNode;
let humBus: GainNode;
let trackBus: GainNode;
let analyser: AnalyserNode;
let buf: Float32Array<ArrayBuffer>;
let on = false;
let ducked = false;
let smooth = 0;
const media = new WeakSet<HTMLMediaElement>();
const subs = new Set<(on: boolean) => void>();

function noise(c: AudioContext, seconds = 2) {
  const b = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.04 * white) / 1.04; // a little brown: softer, like a fan
    d[i] = white * 0.35 + last * 2.2;
  }
  const s = c.createBufferSource();
  s.buffer = b;
  s.loop = true;
  return s;
}

function build() {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  buf = new Float32Array(analyser.fftSize);
  master.connect(analyser);
  analyser.connect(ctx.destination);

  humBus = ctx.createGain();
  humBus.gain.value = 0.55;
  humBus.connect(master);
  trackBus = ctx.createGain();
  trackBus.connect(master);

  // motor
  const motor = ctx.createOscillator();
  motor.type = 'sawtooth';
  motor.frequency.value = 50;
  const motorLp = ctx.createBiquadFilter();
  motorLp.type = 'lowpass';
  motorLp.frequency.value = 240;
  const motorG = ctx.createGain();
  motorG.gain.value = 0.05;
  motor.connect(motorLp).connect(motorG).connect(humBus);
  // fan
  const fan = noise(ctx);
  const fanLp = ctx.createBiquadFilter();
  fanLp.type = 'lowpass';
  fanLp.frequency.value = 650;
  const fanG = ctx.createGain();
  fanG.gain.value = 0.05;
  fan.connect(fanLp).connect(fanG).connect(humBus);
  // the intermittent movement: filtered noise gated 24 times a second
  const clat = noise(ctx);
  const clatBp = ctx.createBiquadFilter();
  clatBp.type = 'bandpass';
  clatBp.frequency.value = 2300;
  clatBp.Q.value = 1.4;
  const clatG = ctx.createGain();
  clatG.gain.value = 0.02;
  const lfo = ctx.createOscillator();
  lfo.type = 'square';
  lfo.frequency.value = 24;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 0.02;
  lfo.connect(lfoG).connect(clatG.gain);
  clat.connect(clatBp).connect(clatG).connect(humBus);
  motor.start();
  fan.start();
  clat.start();
  lfo.start();
  return ctx;
}

function emit() {
  subs.forEach((f) => f(on));
  document.querySelectorAll('[data-sound-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(on)));
}

export function setSound(next: boolean) {
  if (next === on) return;
  const c = build();
  if (!c) return;
  on = next;
  const t = c.currentTime;
  master.gain.cancelScheduledValues(t);
  if (on) {
    c.resume();
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0.5, t + 1.2);
  } else {
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0, t + 0.4);
    document.querySelectorAll<HTMLMediaElement>('audio').forEach((a) => a.pause());
  }
  emit();
}

export const soundOn = () => on;
export const onSound = (f: (on: boolean) => void) => (subs.add(f), () => subs.delete(f));

/** Route an <audio> element through the graph (so the beam and the soundtrack can follow it). */
export function attachMedia(el: HTMLMediaElement) {
  const c = build();
  if (!c || media.has(el)) return;
  media.add(el);
  try {
    c.createMediaElementSource(el).connect(trackBus);
  } catch {}
  const duck = () => {
    ducked = !el.paused;
    const t = c.currentTime;
    humBus.gain.cancelScheduledValues(t);
    humBus.gain.setValueAtTime(humBus.gain.value, t);
    humBus.gain.linearRampToValueAtTime(ducked ? 0 : 0.55, t + 0.8);
  };
  el.addEventListener('play', () => {
    if (!on) setSound(true);
    c.resume();
    duck();
  });
  el.addEventListener('pause', duck);
  el.addEventListener('ended', duck);
}

/** Smoothed loudness 0..1 of whatever is playing. */
export function level() {
  if (!ctx || !on) return (smooth *= 0.9);
  analyser.getFloatTimeDomainData(buf);
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  const rms = Math.sqrt(s / buf.length);
  const v = Math.min(1, rms * (ducked ? 4 : 9));
  smooth += (v - smooth) * (v > smooth ? 0.35 : 0.08);
  return smooth;
}

/** True while an uploaded track (not the hum) is what you hear. */
export const trackPlaying = () => ducked;

/** The raw waveform (for the optical soundtrack). */
export function waveform(): Float32Array | null {
  if (!ctx || !on) return null;
  analyser.getFloatTimeDomainData(buf);
  return buf;
}

export function initSound() {
  document.addEventListener('click', (e) => {
    if ((e.target as Element).closest('[data-sound-toggle]')) setSound(!on);
  });
  document.addEventListener('astro:page-load', emit);
}
