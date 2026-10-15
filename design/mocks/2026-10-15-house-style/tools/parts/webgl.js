/* ---------- WebGL: dither.glsl modes (progress frontier) + mosaic.glsl port (mode 5) ---------- */
const VERT="attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
const FRAG=`
precision highp float;
uniform vec2 u_resolution;uniform float u_pixel;uniform float u_block;
uniform vec3 u_colA;uniform vec3 u_colB;uniform vec3 u_colC;uniform float u_accent;
uniform float u_cloud;uniform float u_gradient;uniform float u_progress;uniform float u_frontier;
uniform float u_seed;uniform float u_alpha;uniform float u_mode;uniform float u_time;uniform float u_shimmer;
uniform float u_dir;uniform float u_dot;uniform float u_edge;uniform float u_soft;uniform float u_rough;
uniform vec3 u_lit;uniform vec3 u_dark;uniform float u_dots;uniform float u_reveal;
float bayer2(vec2 a){a=floor(a);return fract(a.x/2.0+a.y*a.y*0.75);}
float bayer4(vec2 a){return bayer2(0.5*a)*0.25+bayer2(a);}
float bayer8(vec2 a){return bayer4(0.5*a)*0.25+bayer2(a);}
float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
void main(){
  vec2 frag=gl_FragCoord.xy;
  if(u_mode>4.5){
    vec2 uv=frag/u_resolution;
    vec2 bc=floor(frag/u_block);
    vec2 buv=(bc+0.5)*u_block/u_resolution;
    float t;
    if(u_dir<0.5)t=buv.x;
    else if(u_dir<1.5)t=1.0-buv.y;
    else if(u_dir<2.5)t=length((buv-0.5)*vec2(u_resolution.x/u_resolution.y,1.0))*1.4;
    else t=1.0-buv.x;
    float n=hash12(bc+u_seed)-0.5;
    float n2=hash12(floor(bc/2.0)+u_seed+17.0)-0.5;
    float v=(u_edge-t)/u_soft+0.5+(n*0.8+n2*0.6)*u_rough*2.0;
    v=clamp(v,0.0,1.0);
    v=floor(v*5.0+0.5)/5.0;
    vec3 base=mix(u_dark,u_lit,v);
    vec2 dc=fract(frag/u_dot)-0.5;
    float dotMask=1.0-smoothstep(0.18,0.3,length(dc));
    vec3 against=v>0.5?u_dark:u_lit;
    vec3 col=mix(base,against,dotMask*u_dots*(0.35+0.65*abs(v-0.5)*2.0));
    float a=u_alpha*(u_reveal>0.5?(1.0-v):1.0);
    gl_FragColor=vec4(col,a);
    return;
  }
  float d=bayer8(frag/u_pixel);
  float v;
  if(u_mode>0.5&&u_mode<1.5){
    float x=frag.x/u_resolution.x;
    float band=max(u_frontier,u_pixel)/u_resolution.x;
    v=clamp((u_progress-x)/band+0.5,0.0,1.0);
  }else{
    v=frag.y/u_resolution.y;
  }
  float on=step(d,v);
  vec3 col=mix(u_colB,u_colA,on);
  gl_FragColor=vec4(col,u_alpha);
}`;
function hex(h){const n=parseInt(h.slice(1),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
const live=[];
const UN=["u_resolution","u_pixel","u_block","u_colA","u_colB","u_colC","u_accent","u_cloud","u_gradient","u_progress","u_frontier","u_seed","u_alpha","u_mode","u_time","u_shimmer","u_dir","u_dot","u_edge","u_soft","u_rough","u_lit","u_dark","u_dots","u_reveal"];
function dither(canvas,opts){
  const o=Object.assign({pixel:4,block:34,colA:"#82B09A",colB:"#E8E4DC",colC:"#82B09A",accent:0,gradient:0,progress:0,frontier:28,seed:7,alpha:1,mode:5,shimmer:0,cloud:0,dir:2,dot:4,edge:.42,soft:.5,rough:.45,lit:"#82B09A",dark:"#242424",dots:.45,reveal:0},opts);
  const gl=canvas.getContext("webgl",{alpha:true,antialias:false,premultipliedAlpha:false});
  if(!gl)return null;
  const sh=(t,s)=>{const h=gl.createShader(t);gl.shaderSource(h,s);gl.compileShader(h);return h;};
  const pr=gl.createProgram();
  gl.attachShader(pr,sh(gl.VERTEX_SHADER,VERT));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FRAG));
  gl.linkProgram(pr);gl.useProgram(pr);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,"p");gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const U={};for(const n of UN)U[n]=gl.getUniformLocation(pr,n);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  const st={gl,U,o,canvas,dead:false};
  st.set=(k,v)=>{o[k]=v;};
  canvas._st=st;live.push(st);
  return st;
}
const DPR=Math.min(window.devicePixelRatio||1,2);
function frame(t){
  for(let i=live.length-1;i>=0;i--){const s=live[i];if(!s.canvas.isConnected){s.dead=true;try{s.gl.getExtension('WEBGL_lose_context')?.loseContext()}catch(e){}live.splice(i,1)}}
  for(const s of live){
    const w=s.canvas.clientWidth*DPR,h=s.canvas.clientHeight*DPR;
    if(!w||!h)continue;
    if(s.canvas.width!==w||s.canvas.height!==h){s.canvas.width=w;s.canvas.height=h;s.gl.viewport(0,0,w,h);}
    const{gl,U,o}=s;
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.u_resolution,w,h);
    gl.uniform1f(U.u_pixel,o.pixel*DPR);gl.uniform1f(U.u_block,o.block*DPR);gl.uniform1f(U.u_dot,o.dot*DPR);
    gl.uniform3fv(U.u_colA,hex(o.colA));gl.uniform3fv(U.u_colB,hex(o.colB));gl.uniform3fv(U.u_colC,hex(o.colC));
    gl.uniform3fv(U.u_lit,hex(o.lit));gl.uniform3fv(U.u_dark,hex(o.dark));
    gl.uniform1f(U.u_progress,o.progress);gl.uniform1f(U.u_frontier,o.frontier*DPR);gl.uniform1f(U.u_seed,o.seed);
    gl.uniform1f(U.u_alpha,o.alpha);gl.uniform1f(U.u_mode,o.mode);gl.uniform1f(U.u_dir,o.dir);gl.uniform1f(U.u_edge,o.edge);
    gl.uniform1f(U.u_soft,o.soft);gl.uniform1f(U.u_rough,o.rough);gl.uniform1f(U.u_dots,o.dots);gl.uniform1f(U.u_reveal,o.reveal);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
const emap=e=>-0.6+e*2.9;
