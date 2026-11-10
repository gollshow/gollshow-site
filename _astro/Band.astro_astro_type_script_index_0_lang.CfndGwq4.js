var e={stroke:0,pool:1,diagonal:2,veil:3,ring:4,pour:5},t=`precision highp float;
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
}`,n=e=>{let t=parseInt(e.replace(`#`,``),16);return[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]};function r(r){let i=r.querySelector(`canvas`),a=()=>r.classList.add(`is-static`),o=i.getContext(`webgl`,{antialias:!1,alpha:!1});if(!o)return a();let s=matchMedia(`(prefers-reduced-motion: reduce)`).matches,c=(e,t)=>{let n=o.createShader(e);return o.shaderSource(n,t),o.compileShader(n),o.getShaderParameter(n,o.COMPILE_STATUS)?n:(console.error(o.getShaderInfoLog(n)),null)},l=c(o.VERTEX_SHADER,`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`),u=c(o.FRAGMENT_SHADER,t);if(!l||!u)return a();let d=o.createProgram();if(o.attachShader(d,l),o.attachShader(d,u),o.bindAttribLocation(d,0,`p`),o.linkProgram(d),!o.getProgramParameter(d,o.LINK_STATUS))return a();o.useProgram(d);let f=e=>o.getUniformLocation(d,e);o.bindBuffer(o.ARRAY_BUFFER,o.createBuffer()),o.bufferData(o.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),o.STATIC_DRAW),o.enableVertexAttribArray(0),o.vertexAttribPointer(0,2,o.FLOAT,!1,0,0);let p=(r.dataset.pigments||`#1C2B94,#DB3821,#0A6B5C,#F2B833`).split(`,`).map(n),m=p.map(e=>e.slice()),h=p,g=Number(r.dataset.seed||0);o.uniform1f(f(`S`),g),o.uniform1f(f(`K`),e[r.dataset.shape||`stroke`]??0),o.uniform1f(f(`D`),+(document.documentElement.dataset.bg===`black`));let _=f(`R`),v=f(`T`),y=f(`DR[0]`),b=[0,1,2,3].map(e=>f(`C`+e)),x=[],S=new Float32Array(16),C=g*3,w=0;function T(){let e=.6*Math.min(window.devicePixelRatio||1,1.5),t=r.clientWidth,n=r.clientHeight,a=t*e*n*e/9e5;a>1&&(e/=Math.sqrt(a));let s=Math.max(2,Math.round(t*e)),c=Math.max(2,Math.round(n*e));(i.width!==s||i.height!==c)&&(i.width=s,i.height=c),o.viewport(0,0,s,c)}function E(){o.uniform2f(_,i.width,i.height),o.uniform1f(v,C);for(let e=0;e<4;e++)o.uniform3f(b[e],m[e][0],m[e][1],m[e][2]);for(let e=0;e<4;e++){let t=x[e];S[e*4]=t?t.x:0,S[e*4+1]=t?t.y:0,S[e*4+2]=t?C-t.t:-1,S[e*4+3]=t?t.k:0}o.uniform4fv(y,S),o.drawArrays(o.TRIANGLES,0,3)}T(),E(),requestAnimationFrame(()=>r.classList.add(`is-gl`)),addEventListener(`pigments`,e=>{let t=e.detail;h=t&&t.length===4?t.map(n):p,s&&(h.forEach((e,t)=>m[t]=e.slice()),E())});let D=0;addEventListener(`resize`,()=>{clearTimeout(D),D=window.setTimeout(()=>{T(),E()},120)}),i.addEventListener(`webglcontextlost`,e=>{e.preventDefault(),cancelAnimationFrame(O),r.classList.remove(`is-gl`),a()});let O=0;if(s)return;r.addEventListener(`click`,e=>{if(e.target.closest(`a, button`))return;let t=r.getBoundingClientRect();x.push({x:(e.clientX-t.left-t.width/2)/t.height,y:(t.top+t.height/2-e.clientY)/t.height,t:C,k:w++%4}),x.length>4&&x.shift()});let k=!0,A=performance.now(),j=!1;function M(e){if(O=requestAnimationFrame(M),j=!j,j)return;let t=Math.min(.1,(e-A)/1e3);A=e,C+=t;for(let e=0;e<4;e++)for(let t=0;t<3;t++)m[e][t]+=(h[e][t]-m[e][t])*.06;for(let e=x.length-1;e>=0;e--)C-x[e].t>10&&x.splice(e,1);E()}let N=()=>{cancelAnimationFrame(O),k&&!document.hidden&&(A=performance.now(),O=requestAnimationFrame(M))};new IntersectionObserver(e=>{k=e.some(e=>e.isIntersecting),N()}).observe(r),document.addEventListener(`visibilitychange`,N),N()}document.querySelectorAll(`[data-band]`).forEach(e=>{try{r(e)}catch(t){console.error(t),e.classList.add(`is-static`)}});