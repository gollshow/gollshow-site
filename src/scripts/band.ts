/**
 * Inner pages: a single watercolour wash laid across the top of the sheet, made from
 * the same four pigments as the home motion. The page's name gathers out of it as
 * ink (2.4 s), the wash dries with a darker rim at its edges, and then the drawing
 * stops — the works below sit on a calm ground. Reduced motion: the dried frame at
 * once. No WebGL: a CSS wash with the name in ink.
 */

const INTRO = 2.4;

const FS = `precision highp float;
uniform vec2 R; uniform float T; uniform float I; uniform float D; uniform sampler2D TX;
uniform vec3 C0; uniform vec3 C1; uniform vec3 C2; uniform vec3 C3; uniform float S;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return s;}
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
void main(){
 vec2 uv=gl_FragCoord.xy/R;
 vec2 p0=(gl_FragCoord.xy-.5*R)/R.y;
 float e=I*I*(3.-2.*I);
 vec2 c=vec2(.28*R.x/R.y,0.);
 vec2 p=rot((1.-e)*1.6*exp(-dot(p0-c,p0-c)*1.4))*(p0-c)+c+vec2(S*7.13,S*3.7);
 float t=T*.035;
 vec2 q=vec2(fbm(p*1.3+vec2(0.,t)),fbm(p*1.3+vec2(5.2,1.3)-t));
 vec2 r=vec2(fbm(p*1.3+3.2*q+vec2(1.7,9.2)+t*1.4),fbm(p*1.3+3.2*q+vec2(8.3,2.8)-t));
 float f=fbm(p*1.3+3.2*r);
 vec4 tx=texture2D(TX,vec2(uv.x,1.-uv.y)); float w=tx.r, wb=tx.g;
 float nz=fbm(p0*5.+3.1+S);
 // the wash: one stroke across the sheet, ragged where it soaked into the paper
 float en=fbm(vec2(uv.x*2.6+S,1.3))-.5, en2=fbm(vec2(uv.x*2.2-S,7.9))-.5;
 float lo=.14+en*.22, hi=.86+en2*.2;
 float y=uv.y+(nz-.5)*.07;
 float stroke=smoothstep(lo,lo+.07,y)*(1.-smoothstep(hi-.07,hi,y));
 float rim=stroke*(1.-stroke)*4.;
 float body=smoothstep(.2,.9,f+.15*length(r));
 float wash=(.34+.5*body)*stroke+rim*.2*e;
 wash*=mix(.9,1.,D);
 // the name grows from its spine
 float th=1.15-e*1.35;
 float rev=smoothstep(th,th+.15,wb+(nz-.5)*.5);
 float wet=1.-smoothstep(.55,1.,I);
 float wr=mix(w,smoothstep(.15,.85,wb),wet*.65)*rev;
 vec3 ground=mix(vec3(.949,.941,.922),vec3(.047,.047,.051),D);
 vec3 washC=mix(C0,C1,smoothstep(.25,.75,q.x));
 washC=mix(washC,C2,smoothstep(.4,.9,r.y)*.75);
 washC=mix(washC,C3,smoothstep(.6,.95,f)*.55);
 washC=mix(washC,washC*1.15+.04,D);
 vec3 inkA=mix(vec3(.118,.112,.105),vec3(.93,.91,.87),D), inkB=mix(vec3(.235,.222,.205),vec3(.78,.76,.72),D);
 vec3 inkC=mix(inkA,inkB,smoothstep(.35,.85,q.x)*.6);
 float pool=smoothstep(.1,.5,f+.3)*.98;
 vec3 col=mix(ground,washC,clamp(wash,0.,1.)*(1.-wr));
 col=mix(col,inkC,pool*wr);
 col+=(h(floor(gl_FragCoord.xy)+fract(T*7.)*61.)-.5)*mix(.03,.026,D);
 col=mix(col*(1.-.05*n(gl_FragCoord.xy*.35)),col+.02*n(gl_FragCoord.xy*.35),D);
 gl_FragColor=vec4(col,1.);
}`;

const rgb = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
};
const lang = () => (document.documentElement.dataset.lang === 'ko' ? 'ko' : 'en');

function run(band: HTMLElement) {
  const cv = band.querySelector('canvas')!;
  const fallback = () => band.classList.add('is-static');
  const gl = cv.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return fallback();
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pig = (band.dataset.pigments || '#1C2B94,#DB3821,#0A6B5C,#F2B833').split(',').map(rgb);
  const seed = Number(band.dataset.seed || 0);
  const css = getComputedStyle(document.documentElement);
  const font = css.getPropertyValue('--f-display').trim() || 'Georgia, serif';
  const gutter = () => parseFloat(getComputedStyle(band.querySelector('.band__word')!).paddingLeft) || 16;
  const word = () => (lang() === 'ko' ? band.dataset.ko : band.dataset.en) || band.dataset.en || '';

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
  const fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return fallback();
  const pr = gl.createProgram()!;
  gl.attachShader(pr, vs);
  gl.attachShader(pr, fs);
  gl.bindAttribLocation(pr, 0, 'p');
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return fallback();
  gl.useProgram(pr);
  const u: Record<string, WebGLUniformLocation | null> = {};
  ['R', 'T', 'I', 'D', 'TX', 'C0', 'C1', 'C2', 'C3', 'S'].forEach((k) => (u[k] = gl.getUniformLocation(pr, k)));
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  for (const k of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  pig.forEach((c, i) => gl.uniform3f(u['C' + i], c[0], c[1], c[2]));
  gl.uniform1f(u.S, seed);
  gl.uniform1f(u.D, document.documentElement.dataset.bg === 'black' ? 1 : 0);

  let k = 1; // canvas px per CSS px
  const tc = document.createElement('canvas');
  // The page name, set left on the gutter like a title written across the top of a sheet.
  function drawWord() {
    const w = cv.width, h = cv.height;
    tc.width = w;
    tc.height = h;
    const c = tc.getContext('2d')!;
    const text = word();
    const left = gutter() * k;
    let fsz = Math.round(Math.min(h * 0.44, w * 0.15));
    c.font = `400 ${fsz}px ${font}`;
    const tw = c.measureText(text).width;
    if (tw > w - left * 2) fsz = Math.floor((fsz * (w - left * 2)) / tw);
    c.fillStyle = '#000';
    c.fillRect(0, 0, w, h);
    c.font = `400 ${fsz}px ${font}`;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    const y = h * 0.7;
    if ('filter' in c) c.filter = `blur(${Math.max(2, Math.round(fsz * 0.07))}px)`;
    c.fillStyle = '#0f0';
    c.fillText(text, left, y);
    c.filter = 'none';
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = '#f00';
    c.fillText(text, left, y);
    c.globalCompositeOperation = 'source-over';
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, tc);
  }
  function size() {
    const cw = band.clientWidth, ch = band.clientHeight;
    k = 0.6 * Math.min(window.devicePixelRatio || 1, 1.5);
    const over = (cw * k * ch * k) / 0.9e6;
    if (over > 1) k /= Math.sqrt(over);
    const w = Math.max(2, Math.round(cw * k)), h = Math.max(2, Math.round(ch * k));
    if (cv.width === w && cv.height === h) return false;
    cv.width = w;
    cv.height = h;
    gl!.viewport(0, 0, w, h);
    drawWord();
    return true;
  }
  let T = 4 + seed * 3, I = calm ? 1 : 0;
  function draw() {
    gl!.uniform2f(u.R, cv.width, cv.height);
    gl!.uniform1f(u.T, T);
    gl!.uniform1f(u.I, I);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.uniform1i(u.TX, 0);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }
  size();
  band.classList.add('is-gl');
  const still = () => {
    size();
    drawWord();
    draw();
  };
  const fontReady = document.fonts?.load ? document.fonts.load(`400 100px ${font}`, word()) : Promise.resolve();
  fontReady.then(() => (I >= 1 ? still() : drawWord()), () => {});
  addEventListener('resize', () => size() && I >= 1 && draw());
  addEventListener('langchange', () => {
    const f = document.fonts?.load ? document.fonts.load(`400 100px ${font}`, word()) : Promise.resolve();
    f.then(still, still);
  });
  cv.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    band.classList.remove('is-gl');
    fallback();
  });
  if (calm) return still();

  let last = performance.now(), raf = 0;
  function frame(now: number) {
    const raw = Math.min(0.1, (now - last) / 1000);
    last = now;
    T += Math.min(0.05, raw);
    I = Math.min(1, I + raw / INTRO);
    draw();
    if (I < 1) raf = requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (I < 1) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  });
  raf = requestAnimationFrame(frame);
}

document.querySelectorAll<HTMLElement>('[data-band]').forEach((b) => {
  try {
    run(b);
  } catch (err) {
    console.error(err);
    b.classList.add('is-static');
  }
});
