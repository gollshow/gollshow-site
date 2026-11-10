/**
 * Inner pages: a watercolour shape at the top of the sheet in four pigments. Each page
 * has its own shape (a stroke, a pool, a diagonal, a veil, a ring, a pour) and seed.
 * The pigment flows very slowly; a click or tap on it lets one drop fall (a ripple and
 * a bloom of colour). The colours can be changed from outside with a "pigments" event
 * (the art pages send the open work's colours). It only draws while it is on screen and
 * the tab is visible; reduced motion gets one still frame. No WebGL: a CSS wash.
 */

const SHAPES: Record<string, number> = { stroke: 0, pool: 1, diagonal: 2, veil: 3, ring: 4, pour: 5 };

const FS = `precision highp float;
uniform vec2 R; uniform float T; uniform float D; uniform float S; uniform float K;
uniform vec3 C0; uniform vec3 C1; uniform vec3 C2; uniform vec3 C3;
uniform vec4 DR[4];
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return s;}
void main(){
 float asp=R.x/R.y;
 vec2 p0=(gl_FragCoord.xy-.5*R)/R.y;
 vec2 disp=vec2(0.);
 for(int i=0;i<4;i++){vec4 dr=DR[i];if(dr.z>=0.){vec2 v=p0-dr.xy;float l=length(v)+.0001;float rr=dr.z*.5;
  float ring=exp(-pow((l-rr)/.09,2.))*exp(-dr.z*.5);disp+=v/l*ring*.035*sin((l-rr)*30.);}}
 vec2 pd=p0+disp;
 vec2 uv=gl_FragCoord.xy/R+disp*vec2(1./asp,1.);
 vec2 p=pd+vec2(S*7.13,S*3.7);
 float t=T*.03;
 vec2 q=vec2(fbm(p*1.3+vec2(0.,t)),fbm(p*1.3+vec2(5.2,1.3)-t));
 vec2 r=vec2(fbm(p*1.3+3.2*q+vec2(1.7,9.2)+t*1.4),fbm(p*1.3+3.2*q+vec2(8.3,2.8)-t));
 float f=fbm(p*1.3+3.2*r);
 float nz=fbm(p0*5.+3.1+S)-.5;
 float e1=fbm(vec2(uv.x*2.6+S,1.3))-.5, e2=fbm(vec2(uv.x*2.2-S,7.9))-.5, e3=fbm(vec2(uv.y*2.4+S,4.1))-.5;
 float m=0.;
 if(K<.5){ // a stroke across the sheet
  float y=uv.y+nz*.07; float lo=.16+e1*.22, hi=.84+e2*.2;
  m=smoothstep(lo,lo+.07,y)*(1.-smoothstep(hi-.07,hi,y));
 } else if(K<1.5){ // a pool on the right
  vec2 d=(uv-vec2(.72,.5))*vec2(asp,1.); float rr=length(d)/max(1.,asp*.42)+nz*.16+e1*.1;
  m=1.-smoothstep(.38,.45,rr);
 } else if(K<2.5){ // a diagonal sweep
  float y=uv.y-(1.05-uv.x*.95)+nz*.08; float w=.24+e1*.08;
  m=smoothstep(-w-.06,-w,y)*(1.-smoothstep(w,w+.06,y));
 } else if(K<3.5){ // a veil coming in from the right
  float x=uv.x+nz*.22+e3*.18;
  m=smoothstep(.34,.7,x)*smoothstep(.04,.16,uv.y+nz*.05)*(1.-smoothstep(.86,.97,uv.y+nz*.05));
 } else if(K<4.5){ // a ring, like a drop landing on water
  vec2 d=(uv-vec2(.74,.5))*vec2(asp,1.); float rr=length(d)/max(1.,asp*.42)+nz*.06;
  m=smoothstep(.2,.24,rr)*(1.-smoothstep(.34,.38,rr))+ (1.-smoothstep(.06,.09,rr+nz*.05))*.9;
 } else { // a pour down the right side, with drips
  float x=uv.x+nz*.05; float col=smoothstep(.58,.62,x+e3*.06)*(1.-smoothstep(.84,.88,x+e3*.06));
  float drip=.1+(fbm(vec2(uv.x*9.+S,2.))-.5)*.5;
  m=col*smoothstep(drip,drip+.05,uv.y);
 }
 m=clamp(m,0.,1.);
 float rim=m*(1.-m)*4.;
 float body=smoothstep(.2,.9,f+.15*length(r));
 float wash=clamp((.34+.5*body)*m+rim*.2,0.,1.)*mix(.92,1.,D);
 vec3 ground=mix(vec3(.949,.941,.922),vec3(.047,.047,.051),D);
 vec3 c=mix(C0,C1,smoothstep(.25,.75,q.x));
 c=mix(c,C2,smoothstep(.4,.9,r.y)*.75);
 c=mix(c,C3,smoothstep(.6,.95,f)*.55);
 c=mix(c,c*1.15+.04,D);
 vec3 col=mix(ground,c,wash);
 float dn=fbm(pd*6.+1.7);
 for(int i=0;i<4;i++){vec4 dr=DR[i];if(dr.z>=0.){float l=length(pd-dr.xy);float rad=.07+dr.z*.09;
  float b=exp(-l*l/(rad*rad))*exp(-dr.z*.3)*smoothstep(0.,.25,dr.z)*(.55+.45*dn);
  vec3 dc=dr.w<.5?C0:(dr.w<1.5?C1:(dr.w<2.5?C2:C3));dc=mix(dc,dc*1.2+.05,D);
  col=mix(col,dc,clamp(b*.85,0.,1.));
  float rr=dr.z*.5;col+=exp(-pow((l-rr)/.014,2.))*exp(-dr.z*.9)*mix(-.06,.1,D);}}
 col+=(h(floor(gl_FragCoord.xy)+S*61.)-.5)*mix(.03,.026,D);
 col=mix(col*(1.-.05*n(gl_FragCoord.xy*.35)),col+.02*n(gl_FragCoord.xy*.35),D);
 gl_FragColor=vec4(col,1.);
}`;

const rgb = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

function paint(band: HTMLElement) {
  const cv = band.querySelector('canvas')!;
  const fallback = () => band.classList.add('is-static');
  const gl = cv.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return fallback();
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  const u = (k: string) => gl.getUniformLocation(pr, k);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const base = (band.dataset.pigments || '#1C2B94,#DB3821,#0A6B5C,#F2B833').split(',').map(rgb);
  const pal = base.map((c) => c.slice());
  let target = base;
  const seed = Number(band.dataset.seed || 0);
  gl.uniform1f(u('S'), seed);
  gl.uniform1f(u('K'), SHAPES[band.dataset.shape || 'stroke'] ?? 0);
  gl.uniform1f(u('D'), document.documentElement.dataset.bg === 'black' ? 1 : 0);
  const uR = u('R'), uT = u('T'), uDR = u('DR[0]'), uC = [0, 1, 2, 3].map((i) => u('C' + i));

  const drops: { x: number; y: number; t: number; k: number }[] = [];
  const DRA = new Float32Array(16);
  let T = seed * 3, dk = 0;

  function size() {
    let k = 0.6 * Math.min(window.devicePixelRatio || 1, 1.5);
    const cw = band.clientWidth, ch = band.clientHeight;
    const over = (cw * k * ch * k) / 0.9e6;
    if (over > 1) k /= Math.sqrt(over);
    const w = Math.max(2, Math.round(cw * k)), h = Math.max(2, Math.round(ch * k));
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
    }
    gl!.viewport(0, 0, w, h);
  }
  function draw() {
    gl!.uniform2f(uR, cv.width, cv.height);
    gl!.uniform1f(uT, T);
    for (let i = 0; i < 4; i++) gl!.uniform3f(uC[i], pal[i][0], pal[i][1], pal[i][2]);
    for (let i = 0; i < 4; i++) {
      const d = drops[i];
      DRA[i * 4] = d ? d.x : 0;
      DRA[i * 4 + 1] = d ? d.y : 0;
      DRA[i * 4 + 2] = d ? T - d.t : -1;
      DRA[i * 4 + 3] = d ? d.k : 0;
    }
    gl!.uniform4fv(uDR, DRA);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }
  size();
  draw();
  requestAnimationFrame(() => band.classList.add('is-gl'));

  // the open work's colours (art pages); null goes back to the page's own
  addEventListener('pigments', (e) => {
    const d = (e as CustomEvent<string[] | null>).detail;
    target = d && d.length === 4 ? d.map(rgb) : base;
    if (calm) {
      target.forEach((c, i) => (pal[i] = c.slice()));
      draw();
    }
  });
  let rt = 0;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = window.setTimeout(() => {
      size();
      draw();
    }, 120);
  });
  cv.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    band.classList.remove('is-gl');
    fallback();
  });
  let raf = 0;
  if (calm) return;

  band.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a, button')) return;
    const r = band.getBoundingClientRect();
    drops.push({ x: (e.clientX - r.left - r.width / 2) / r.height, y: (r.top + r.height / 2 - e.clientY) / r.height, t: T, k: dk++ % 4 });
    if (drops.length > 4) drops.shift();
  });

  let visible = true, last = performance.now(), odd = false;
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    // about 30 frames a second is plenty for something this slow
    odd = !odd;
    if (odd) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    T += dt;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) pal[i][j] += (target[i][j] - pal[i][j]) * 0.06;
    for (let i = drops.length - 1; i >= 0; i--) if (T - drops[i].t > 10) drops.splice(i, 1);
    draw();
  }
  const run = () => {
    cancelAnimationFrame(raf);
    if (!visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  new IntersectionObserver((en) => {
    visible = en.some((x) => x.isIntersecting);
    run();
  }).observe(band);
  document.addEventListener('visibilitychange', run);
  run();
}

document.querySelectorAll<HTMLElement>('[data-band]').forEach((b) => {
  try {
    paint(b);
  } catch (err) {
    console.error(err);
    b.classList.add('is-static');
  }
});
