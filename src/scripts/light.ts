/**
 * The beam. One full-screen triangle (OGL), no textures. The canvas is
 * composited with mix-blend-mode: multiply over the wall, so what you see is
 * paint × light: ambient darkness, a tungsten disc tinted by the work under it,
 * and the work's bounce colour spilling onto the plaster around it.
 */
import { Renderer } from 'ogl/src/core/Renderer.js';
import { Program } from 'ogl/src/core/Program.js';
import { Mesh } from 'ogl/src/core/Mesh.js';
import { Triangle } from 'ogl/src/extras/Triangle.js';

export type LightState = {
  bx: number; by: number; // beam centre, CSS px
  r: number; // radius, CSS px
  open: number; // 0..1 opening (iris)
  light: [number, number, number]; // beam colour 0..1
  bounce: [number, number, number];
  bounceAmt: number;
  rect: [number, number, number, number]; // lit work, CSS px (x0, y0, x1, y1)
  frame: number; // 0 a round beam … 1 the shutters closed onto the lit work
  ambient: number;
  flick: number; // shutter flicker multiplier
  level: number; // audio level 0..1
  time: number;
};

const vertex = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform vec2 uBeam;
uniform float uR;
uniform float uOpen;
uniform vec3 uLight;
uniform vec3 uBounce;
uniform float uBounceAmt;
uniform vec4 uRect;
uniform float uFrame;
uniform float uAmbient;
uniform float uFlick;
uniform float uLevel;
uniform float uTime;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 d = p - uBeam;
  d.y *= 1.06;
  float r = length(d);
  float R = max(uR * uOpen * (1.0 + uLevel * 0.08), 0.001);
  // an even disc with a soft penumbra, a gentle hotspot, and the lens's slow unevenness
  float disc = 1.0 - smoothstep(R * 0.42, R, r);
  disc *= disc;
  float hot = exp(-(r * r) / (R * R * 0.16)) * 0.22;
  float lens = 0.93 + 0.07 * noise(p / 70.0 + vec2(uTime * 0.03, -uTime * 0.02));
  // framing: like a gallery's framing projector, the shutters close onto the canvas
  vec2 fc = (uRect.xy + uRect.zw) * 0.5;
  vec2 fh = max((uRect.zw - uRect.xy) * 0.5, vec2(1.0)) + vec2(6.0);
  vec2 fq = abs(p - fc) - fh;
  float fsd = length(max(fq, 0.0)) + min(max(fq.x, fq.y), 0.0);
  float framed = 1.0 - smoothstep(-4.0, 18.0, fsd);
  float shape = mix(disc + hot, framed * 1.02 + hot * 0.25 * framed, uFrame);
  float beam = shape * lens * uFlick;
  // warm fringe at the rim (the lens is not perfect)
  float rim = smoothstep(R * 0.7, R * 0.95, r) * (1.0 - smoothstep(R * 0.95, R * 1.15, r));
  vec3 light = uLight * beam + vec3(0.05, 0.015, -0.01) * rim * uOpen * (1.0 - uFrame);
  // bounce: the lit work throws its colour onto the wall around it
  vec2 c = (uRect.xy + uRect.zw) * 0.5;
  vec2 h = max((uRect.zw - uRect.xy) * 0.5, vec2(1.0));
  vec2 q = abs(p - c) - h;
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  float spill = uBounceAmt * exp(-max(sd, 0.0) / (min(h.x, h.y) * 0.9 + 20.0)) * step(0.0, sd);
  vec3 col = vec3(uAmbient) + light + uBounce * spill;
  col += (hash(p + fract(uTime)) - 0.5) / 255.0; // dither: no banding in the dark
  gl_FragColor = vec4(col, 1.0);
}
`;

export function createLight(canvas: HTMLCanvasElement) {
  let renderer: Renderer;
  try {
    renderer = new Renderer({ canvas, dpr: Math.min(1, devicePixelRatio || 1), alpha: false, antialias: false, depth: false, powerPreference: 'low-power', premultipliedAlpha: false, preserveDrawingBuffer: false });
    if (!renderer.gl) return null;
  } catch {
    return null;
  }
  const gl = renderer.gl;
  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uRes: { value: [1, 1] },
      uBeam: { value: [0, 0] },
      uR: { value: 100 },
      uOpen: { value: 1 },
      uLight: { value: [0.96, 0.9, 0.78] },
      uBounce: { value: [0, 0, 0] },
      uBounceAmt: { value: 0 },
      uRect: { value: [0, 0, 0, 0] },
      uFrame: { value: 0 },
      uAmbient: { value: 0.05 },
      uFlick: { value: 1 },
      uLevel: { value: 0 },
      uTime: { value: 0 },
    },
  });
  const mesh = new Mesh(gl, { geometry, program });
  let w = 0;
  let h = 0;
  const resize = () => {
    // OGL sets an inline 300×150 size on creation: measure the stage, not the canvas
    const box = canvas.parentElement ?? canvas;
    w = box.clientWidth || innerWidth;
    h = box.clientHeight || innerHeight;
    // the light is soft: render at a fraction of the screen and let the browser
    // upscale it (≈ 0.25 MP whatever the screen; it stays smooth)
    renderer.dpr = Math.min(0.5, Math.sqrt(250000 / Math.max(1, w * h)));
    renderer.setSize(w, h);
  };
  resize();
  const draw = (s: LightState) => {
    const k = 1; // uniforms in CSS px; the shader uses vUv × uRes in CSS px
    const u = program.uniforms;
    u.uRes.value = [w * k, h * k];
    u.uBeam.value = [s.bx, s.by];
    u.uR.value = s.r;
    u.uOpen.value = s.open;
    u.uLight.value = s.light;
    u.uBounce.value = s.bounce;
    u.uBounceAmt.value = s.bounceAmt;
    u.uRect.value = s.rect;
    u.uFrame.value = s.frame;
    u.uAmbient.value = s.ambient;
    u.uFlick.value = s.flick;
    u.uLevel.value = s.level;
    u.uTime.value = s.time;
    renderer.render({ scene: mesh });
  };
  const lost = (e: Event) => e.preventDefault();
  canvas.addEventListener('webglcontextlost', lost);
  return {
    draw,
    resize,
    destroy() {
      canvas.removeEventListener('webglcontextlost', lost);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
