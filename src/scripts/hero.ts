/**
 * Home: pigment flow. WebGL1, one full-screen triangle, a fragment shader with
 * domain-warped fbm pigment (four colours from 사이트 설정) that swirls and settles
 * while the wordmark gathers out of it as ink ("gather" intro, 3.6 s). The letters
 * grow from their spines via a texture: red = the sharp word, green = a blurred copy.
 * The pointer stirs the pigment; when idle the stir point drifts on its own.
 * A click or tap lets one drop fall: a ring ripples outwards (the letters sway with it)
 * and a bloom of one of the four pigments spreads and fades. Left alone, a drop falls
 * now and then by itself. Pointing at a room in the list below floods the ground with
 * that room's colours.
 *
 * Ported from the approved motion draft. Renders at 0.6× (DPR capped), pauses when
 * the tab is hidden, shows the settled final frame for prefers-reduced-motion, and
 * falls back to a static ground + ink wordmark + CSS pigment wash without WebGL.
 */

import { stir } from './stir';

const INTRO = 3.6;

const FS = `precision highp float;
uniform vec2 R; uniform float T; uniform vec2 M; uniform float V; uniform float I; uniform float D; uniform float F; uniform float G; uniform sampler2D TX;
uniform vec3 C0; uniform vec3 C1; uniform vec3 C2; uniform vec3 C3;
uniform vec4 DR[5];
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return s;}
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
void main(){
 vec2 uv=gl_FragCoord.xy/R;
 vec2 p0=(gl_FragCoord.xy-.5*R)/R.y;
 float e=I*I*(3.-2.*I);
 float sa=R.x/R.y;
 vec2 disp=vec2(0.);
 for(int i=0;i<5;i++){vec4 dr=DR[i];if(dr.z>=0.){vec2 v=p0-dr.xy;float l=length(v)+.0001;float rr=dr.z*.42;
  float ring=exp(-pow((l-rr)/.075,2.))*exp(-dr.z*.5);disp+=v/l*ring*.03*sin((l-rr)*36.);}}
 vec2 pd=p0+disp;
 vec2 p=rot((1.-e)*2.4*exp(-dot(pd,pd)*1.2))*pd;
 vec2 m=(M-.5)*vec2(sa,1.);
 vec2 pr=p-m; float d=length(pr);
 p=rot(exp(-d*d*5.)*(.8+V*7.))*pr+m;
 float t=T*.035;
 vec2 q=vec2(fbm(p*1.5+vec2(0.,t)),fbm(p*1.5+vec2(5.2,1.3)-t));
 vec2 r=vec2(fbm(p*1.5+3.5*q+vec2(1.7,9.2)+t*1.4),fbm(p*1.5+3.5*q+vec2(8.3,2.8)-t));
 float f=fbm(p*1.5+3.5*r);
 vec2 tu=uv+disp*vec2(1./sa,1.);
 vec4 tx=texture2D(TX,vec2(tu.x,1.-tu.y)); float w=tx.r, wb=tx.g;
 float nz=fbm(p0*5.+3.1);
 float th=1.15-e*1.35;
 float rev=smoothstep(th,th+.15,wb+(nz-.5)*.5);
 float wet=1.-smoothstep(.55,1.,I);
 float wr=mix(w,smoothstep(.15,.85,wb),wet*.65)*rev*(1.-F);
 vec3 ground=mix(vec3(.949,.941,.922),vec3(.047,.047,.051),D);
 vec3 washC=mix(C0,C1,smoothstep(.25,.75,q.x));
 washC=mix(washC,C2,smoothstep(.4,.9,r.y)*.75);
 washC=mix(washC,C3,smoothstep(.6,.95,f)*.55);
 washC=mix(washC,washC*1.15+.04,D);
 vec3 inkA=mix(vec3(.118,.112,.105),vec3(.93,.91,.87),D), inkB=mix(vec3(.235,.222,.205),vec3(.78,.76,.72),D);
 vec3 inkC=mix(inkA,inkB,smoothstep(.35,.85,q.x)*.8);
 float wash=smoothstep(.45,.95,f+.2*length(r)-.1)*mix(.62,.66,D);
 wash=mix(smoothstep(.25,.75,f)*.88,wash,e);
 wash=mix(wash,smoothstep(.3,.85,f+.1)*.8,G*.6);
 float pool=smoothstep(.1,.5,f+.25)*.97;
 vec3 col=mix(ground,washC,wash*(1.-wr)*(1.-.62*F*(1.-.75*G)));
 float dn=fbm(pd*6.+1.7);
 for(int i=0;i<5;i++){vec4 dr=DR[i];if(dr.z>=0.){float l=length(pd-dr.xy);float rad=.05+dr.z*.07;
  float b=exp(-l*l/(rad*rad))*exp(-dr.z*.3)*smoothstep(0.,.25,dr.z)*(.55+.45*dn);
  vec3 dc=dr.w<.5?C0:(dr.w<1.5?C1:(dr.w<2.5?C2:C3));dc=mix(dc,dc*1.2+.05,D);
  col=mix(col,dc,clamp(b*.9,0.,1.)*(1.-wr)*(1.-.5*F));
  float rr=dr.z*.42;col+=exp(-pow((l-rr)/.012,2.))*exp(-dr.z*.9)*mix(-.06,.1,D);}}
 col=mix(col,inkC,pool*wr);
 col+=(h(floor(gl_FragCoord.xy)+fract(T*7.)*61.)-.5)*mix(.035,.03,D);
 col=mix(col*(1.-.06*n(gl_FragCoord.xy*.35)),col+.025*n(gl_FragCoord.xy*.35),D);
 gl_FragColor=vec4(col,1.);
}`;

const hero = document.querySelector<HTMLElement>('[data-hero]');
const cv = hero?.querySelector<HTMLCanvasElement>('canvas');
const top = document.getElementById('top');

const showMenu = () => {
  top?.classList.add('is-on');
  hero?.classList.add('is-ready');
};
const fallback = () => {
  hero?.classList.add('is-static');
  showMenu();
};

const rgb = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
};

function start() {
  if (!hero || !cv) return;
  const gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: 'default' });
  if (!gl) return fallback();
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const word = hero.dataset.word || 'gollshow';
  const pig = (hero.dataset.pigments || '#1C2B94,#DB3821,#0A6B5C,#F2B833').split(',').map(rgb);
  // The wordmark font lives in ONE CSS variable (--f-mark); the text canvas reads it from there.
  const markFont = getComputedStyle(document.documentElement).getPropertyValue('--f-mark').trim() || 'Georgia, serif';
  const markFamily = markFont.split(',')[0].trim();

  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const vs = shader(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
  const fs = shader(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return fallback();
  const pr = gl.createProgram()!;
  gl.attachShader(pr, vs);
  gl.attachShader(pr, fs);
  gl.bindAttribLocation(pr, 0, 'p');
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return fallback();
  gl.useProgram(pr);
  const u: Record<string, WebGLUniformLocation | null> = {};
  ['R', 'T', 'M', 'V', 'I', 'D', 'F', 'G', 'TX', 'C0', 'C1', 'C2', 'C3'].forEach((k) => (u[k] = gl.getUniformLocation(pr, k)));
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  u.DR = gl.getUniformLocation(pr, 'DR[0]');
  // the four pigments ease towards a room's colours while that room is pointed at
  const pal = pig.map((c) => [c[0], c[1], c[2]]);

  const tc = document.createElement('canvas');
  // red = the letters, green = a soft blur of them (lets the letters grow from their spines)
  function drawWord() {
    const w = cv!.width, h = cv!.height;
    tc.width = w;
    tc.height = h;
    const c = tc.getContext('2d')!;
    let fsz = Math.round(Math.min(w * 0.215, h * 0.34));
    c.font = `400 ${fsz}px ${markFont}`;
    const tw = c.measureText(word).width;
    if (tw > w * 0.84) fsz = Math.floor((fsz * w * 0.84) / tw);
    c.fillStyle = '#000';
    c.fillRect(0, 0, w, h);
    c.font = `400 ${fsz}px ${markFont}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    const y = h / 2 + fsz * 0.2;
    if ('filter' in c) c.filter = `blur(${Math.max(2, Math.round(fsz * 0.07))}px)`;
    c.fillStyle = '#0f0';
    c.fillText(word, w / 2, y);
    c.filter = 'none';
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = '#f00';
    c.fillText(word, w / 2, y);
    c.globalCompositeOperation = 'source-over';
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, tc);
  }

  // 0.6× resolution, DPR capped at 1.5, and never more than ~1.3 megapixels.
  function size() {
    const cw = hero!.clientWidth, ch = hero!.clientHeight;
    const k = 0.6 * Math.min(window.devicePixelRatio || 1, 1.5);
    let w = cw * k, h = ch * k;
    const over = (w * h) / 1.3e6;
    if (over > 1) {
      w /= Math.sqrt(over);
      h /= Math.sqrt(over);
    }
    w = Math.max(2, Math.round(w));
    h = Math.max(2, Math.round(h));
    if (cv!.width !== w || cv!.height !== h) {
      cv!.width = w;
      cv!.height = h;
      gl!.viewport(0, 0, w, h);
      drawWord();
      return true;
    }
    return false;
  }

  const dark = document.documentElement.dataset.bg === 'black' ? 1 : 0;
  // Scrolling down dissolves the wordmark back into the pigment, which sinks into the ground.
  const fade = () => Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.85)));
  let introT = calm ? INTRO : 0;
  const tm = { x: 0.5, y: 0.5 }, mm = { x: 0.5, y: 0.5 };
  let vel = 0, idle = 99, T = calm ? 14 : 0, last = performance.now(), raf = 0, G = 0;
  // drops: position in the shader's space (x right, y up, in screen heights), birth time, pigment index
  const drops: { x: number; y: number; t: number; k: number }[] = [];
  const DRA = new Float32Array(20);
  let dk = 0, autoT = 4, firstDrop = false;
  function addDrop(x: number, y: number, quiet = false) {
    drops.push({ x, y, t: T, k: dk++ % 4 });
    if (drops.length > 5) drops.shift();
    stir.onDrop?.(y, quiet);
  }

  function draw(I: number) {
    gl!.uniform2f(u.R, cv!.width, cv!.height);
    gl!.uniform1f(u.T, T);
    gl!.uniform2f(u.M, mm.x, mm.y);
    gl!.uniform1f(u.V, vel * Math.min(1, I * 1.5));
    gl!.uniform1f(u.I, I);
    gl!.uniform1f(u.D, dark);
    gl!.uniform1f(u.F, fade());
    gl!.uniform1f(u.G, G);
    for (let i = 0; i < 4; i++) gl!.uniform3f(u['C' + i], pal[i][0], pal[i][1], pal[i][2]);
    for (let i = 0; i < 5; i++) {
      const d = drops[i];
      DRA[i * 4] = d ? d.x : 0;
      DRA[i * 4 + 1] = d ? d.y : 0;
      DRA[i * 4 + 2] = d ? T - d.t : -1;
      DRA[i * 4 + 3] = d ? d.k : 0;
    }
    gl!.uniform4fv(u.DR, DRA);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.uniform1i(u.TX, 0);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  size();
  hero.classList.add('is-gl');
  const fontReady = document.fonts?.load ? document.fonts.load(`400 120px ${markFamily}`, word) : Promise.resolve();

  if (calm) {
    // Reduced motion: the settled final frame, no swirl, no stirring.
    showMenu();
    const still = () => {
      size();
      draw(1);
    };
    still();
    fontReady.then(() => {
      drawWord();
      still();
    }, () => {});
    addEventListener('resize', still);
    addEventListener('scroll', () => requestAnimationFrame(() => draw(1)), { passive: true });
    return;
  }

  fontReady.then(drawWord, () => {});
  addEventListener('resize', size);
  addEventListener('pointermove', (e) => {
    tm.x = e.clientX / innerWidth;
    tm.y = 1 - e.clientY / innerHeight;
    idle = 0;
  });
  // One drop where the visitor clicks or taps (not on links and buttons).
  addEventListener('click', (e) => {
    if ((e.target as Element).closest('a, button, dialog')) return;
    addDrop((e.clientX - innerWidth / 2) / innerHeight, (innerHeight / 2 - e.clientY) / innerHeight);
    idle = 0;
    autoT = 6;
  });

  let skip = 0;
  function frame(now: number) {
    // Once the page has scrolled past the motion, draw it at a third of the rate.
    if (fade() > 0.98 && !stir.hover && G < 0.02 && skip++ % 3) {
      raf = requestAnimationFrame(frame);
      return;
    }
    const raw = (now - last) / 1000;
    const dt = Math.min(0.05, raw);
    last = now;
    T += dt;
    // The intro keeps (close to) wall-clock time even on slow devices.
    introT = Math.min(INTRO, introT + Math.min(0.1, raw));
    const I = introT / INTRO;
    if (I > 0.88) showMenu();
    idle += dt;
    if (idle > 2.5) {
      tm.x = 0.5 + 0.26 * Math.cos(T * 0.31);
      tm.y = 0.5 + 0.2 * Math.sin(T * 0.43);
    }
    const px = mm.x, py = mm.y;
    mm.x += (tm.x - mm.x) * 0.08;
    mm.y += (tm.y - mm.y) * 0.08;
    vel += (Math.min(1, Math.hypot(mm.x - px, mm.y - py) * 40) - vel) * 0.1;
    stir.x = mm.x;
    stir.y = mm.y;
    stir.v = idle > 2.5 ? vel * 0.35 : vel; // the idle drift stirs only gently
    stir.intro = I;
    // drops: one as the wordmark settles, then one now and then while nobody touches the page
    if (!firstDrop && I >= 0.97) {
      firstDrop = true;
      addDrop(0.16, 0.02, true);
    }
    autoT -= dt;
    if (autoT <= 0 && I >= 1 && idle > 3 && fade() < 0.6) {
      addDrop((Math.random() - 0.5) * Math.min(1.4, (innerWidth / innerHeight) * 0.8), (Math.random() - 0.5) * 0.6, true);
      autoT = 5 + Math.random() * 4;
    }
    for (let i = drops.length - 1; i >= 0; i--) if (T - drops[i].t > 10) drops.splice(i, 1);
    // a room pointed at in the list floods the ground with its colours
    const target = stir.hoverPal ?? pig;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) pal[i][j] += (target[i][j] - pal[i][j]) * 0.045;
    G += ((stir.hover ? 0.8 : 0) - G) * 0.06;
    draw(I);
    raf = requestAnimationFrame(frame);
  }
  const run = () => {
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  // Pause drawing while the tab is hidden.
  document.addEventListener('visibilitychange', () => (document.hidden ? cancelAnimationFrame(raf) : run()));
  cv.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    hero.classList.remove('is-gl');
    fallback();
  });
  run();
}

try {
  start();
} catch (err) {
  console.error(err);
  fallback();
}
