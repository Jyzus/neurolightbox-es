(() => {
'use strict';
const CH = {bg:'#ffffff', grid:'rgba(12,22,27,.07)', axis:'rgba(12,22,27,.22)', ink:'#0c161b', ink2:'#4a6a8a', muted:'rgba(61,76,83,.8)', acc:'#0050ff'};

// Injected data and shader bindings from modular assets
const MODS = window.MODS;
const VESSELS = window.VESSELS;
const PLAQUES = window.PLAQUES;
const STATES = window.STATES;
const FINDINGS = window.FINDINGS;
const MRS = window.MRS;
const MRS_LABELS = window.MRS_LABELS;
const TCD = window.TCD;
const REGION_INFO = window.REGION_INFO;
const GROUP_COLORS = window.GROUP_COLORS;
const GROUP_ORDER = window.GROUP_ORDER;
const SOMATO = window.SOMATO;
const PART_LABEL = window.PART_LABEL;
const stimEffect = window.stimEffect;
const cap = window.cap;
const GLSL_NOISE = window.GLSL_NOISE;
const VS_FULL = window.VS_FULL;
const FS_SLICE = window.FS_SLICE;
const VS_MESH = window.VS_MESH;
const FS_MESH = window.FS_MESH;
const LAB = window.LAB;
const METHOD_CARD = window.METHOD_CARD;
const CASES = window.CASES;
const CHAPTERS = window.CHAPTERS;

const $ = s => document.querySelector(s);
const v3 = {
  add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],
  mul:(a,s)=>[a[0]*s,a[1]*s,a[2]*s], dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  norm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];}, len:a=>Math.hypot(a[0],a[1],a[2])
};
const q4 = {
  norm:q=>{const l=Math.hypot(...q)||1;return q.map(v=>v/l);},
  mul:(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1], a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0], a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3], a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]],
  axis:(ax,ang)=>{const s=Math.sin(ang/2);return [ax[0]*s,ax[1]*s,ax[2]*s,Math.cos(ang/2)];},
  rot:(q,v)=>{const [x,y,z,w]=q;const tx=2*(y*v[2]-z*v[1]),ty=2*(z*v[0]-x*v[2]),tz=2*(x*v[1]-y*v[0]);return [v[0]+w*tx+(y*tz-z*ty),v[1]+w*ty+(z*tx-x*tz),v[2]+w*tz+(x*ty-y*tx)];},
  fromBasis:(r,u,f)=>{
    const m00=r[0],m10=r[1],m20=r[2],m01=u[0],m11=u[1],m21=u[2],m02=f[0],m12=f[1],m22=f[2];
    const tr=m00+m11+m22; let x,y,z,w;
    if(tr>0){const s=Math.sqrt(tr+1)*2;w=.25*s;x=(m21-m12)/s;y=(m02-m20)/s;z=(m10-m01)/s;}
    else if(m00>m11&&m00>m22){const s=Math.sqrt(1+m00-m11-m22)*2;w=(m21-m12)/s;x=.25*s;y=(m01+m10)/s;z=(m02+m20)/s;}
    else if(m11>m22){const s=Math.sqrt(1+m11-m00-m22)*2;w=(m02-m20)/s;x=(m01+m10)/s;y=.25*s;z=(m12+m21)/s;}
    else {const s=Math.sqrt(1+m22-m00-m11)*2;w=(m10-m01)/s;x=(m02+m20)/s;y=(m12+m21)/s;z=.25*s;}
    return q4.norm([x,y,z,w]);
  },
  slerp:(a,b,t)=>{ let d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3]; if(d<0){b=b.map(v=>-v);d=-d;} if(d>0.9995) return q4.norm(a.map((v,i)=>v+(b[i]-v)*t)); const th=Math.acos(d),s=Math.sin(th),wa=Math.sin((1-t)*th)/s,wb=Math.sin(t*th)/s; return a.map((v,i)=>v*wa+b[i]*wb); }
};
function basisLook(f, up){ f = v3.norm(f); const r = v3.norm(v3.cross(f, up)); const u = v3.cross(r, f); return [r,u,f]; }
const qFromLook = (r,u,f) => q4.fromBasis(r, u, v3.mul(f,-1));
function basisQ(q){ return [q4.rot(q,[1,0,0]), q4.rot(q,[0,1,0]), v3.mul(q4.rot(q,[0,0,1]),-1)]; }
function mul4(a,b){ const o=new Array(16); for(let c=0;c<4;c++) for(let r=0;r<4;r++){ let s=0; for(let k=0;k<4;k++) s+=a[k*4+r]*b[c*4+k]; o[c*4+r]=s; } return o; }

const PLANES = {
  axial:   {f:[0,0,1],  up:[0,1,0], axis:[0,0,1], tag:'AX',  name:'Axial'},
  coronal: {f:[0,-1,0], up:[0,0,1], axis:[0,1,0], tag:'COR', name:'Coronal'},
  sagittal:{f:[1,0,0],  up:[0,0,1], axis:[1,0,0], tag:'SAG', name:'Sagital'},
  top:     {f:[0,0,-1], up:[0,1,0], axis:[0,0,1], tag:'TOP', name:'Superior'},
};
const TARGET = [0,-16,10], DIST = 540; let TAN = 0.28;
const qPlane = name => { const P = PLANES[name]; return qFromLook(...basisLook(P.f, P.up)); };
const worldToSlice = (plane, w) => { const P = PLANES[plane]; return v3.dot(P.f, v3.sub(v3.mul(P.axis, w), TARGET)); };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- state ---------- */
const S = {
  tab:'scans', mod:'mri', sub:'t1', state:'normal', plane:'free', slice:0,
  q: qFromLook(...basisLook(v3.mul([-0.72,0.6,0.36],-1),[0,0,1])),
  glass:{x:0,y:0,size:360,placed:false}, panel:false, lastSub:{}, lastState:{},
  findings:true, labels:false, compare:false, sub2:'flair', split:0.5,
  dsaInj:'ICA-L', dsaPlay:true, hover:-1, labScan:'none',
};
let MESHRAW = null;
let VIEW = 'home', heroVisible = true; const HERO = {glass:false}; const BG = [0.945, 0.957, 0.961];
const ALL_SUBS = MODS.flatMap(m=>m.subs.map(s=>({...s, mod:m.id})));
const subById = id => ALL_SUBS.find(s=>s.id===id);
const modObj = id => MODS.find(m=>m.id===(id||S.mod));
const subObj = () => subById(S.sub);
const stObj = k => STATES[k||S.state];

const stageEl=$('#stage'), canvas=$('#gl'), glassEl=$('#glass'), rail=$('#rail'), subbar=$('#subbar');
let stage = stageEl;
const sliceIn=$('#slice'), sliceOut=$('#sliceOut'), sliceWrap=$('#sliceWrap'), planesEl=$('#planes');
const panel=$('#panel'), statesBtn=$('#statesBtn'), legendEl=$('#legend'), hint=$('#hint'), tip=$('#tip'), fcard=$('#fcard');
const chart=$('#chart'), chartCv=$('#chartCv');

/* ---------- WebGL ---------- */
// Some embedded previews refuse a context with particular attributes, so fall back step by step before giving up.
const GL_TRIES = [{antialias:true, alpha:false, depth:true, powerPreference:'high-performance'}, {antialias:false, alpha:false, depth:true}, {}];
let glTried = [];
const gl = (()=>{ for (const o of GL_TRIES){ let c = null; try { c = canvas.getContext('webgl2', o); } catch(e){ glTried.push('threw: ' + e.message); } glTried.push(JSON.stringify(o) + ' → ' + (c ? 'ok' : 'null')); if (c) return c; } return null; })();
canvas.addEventListener('webglcontextlost', e=>{ e.preventDefault(); console.error('Contexto WebGL perdido'); try { setPreviewNotice('El controlador gráfico reinició la vista 3D. Recargue la página para restaurarla.', rendererDiagnostics()); } catch(err){} });
let META = null, VOL = null, ready = false, dirty = true, sliceAvailable = false;
const TEX = {};
function failMsg(m){ $("#loading").innerHTML = `<div class="box"><div style="margin:0;color:var(--ink-2)">${m}</div></div>`; }

const shaderReports = [];
// Shaders are compiled in two phases so a slow driver (e.g. Windows/Direct3D, where the
// large scan shader can take many seconds) does not freeze the page: startProgram() queues
// the work, waitPrograms() polls KHR_parallel_shader_compile while the data downloads, and
// finishProgram() reads the results only once the driver reports it is done.
const parallelCompile = gl ? gl.getExtension('KHR_parallel_shader_compile') : null;
function startProgram(label, vs, fs){
  const mk = (type, source) => { const sh = gl.createShader(type); if (sh){ gl.shaderSource(sh, source); gl.compileShader(sh); } return sh; };
  const v = mk(gl.VERTEX_SHADER, vs), f = mk(gl.FRAGMENT_SHADER, fs), p = gl.createProgram();
  if (!p) return {_label:label, _vs:v, _fs:f, _noProgram:true, _u:{}};
  if (v) gl.attachShader(p, v);
  if (f) gl.attachShader(p, f);
  gl.linkProgram(p);
  p._label = label; p._vs = v; p._fs = f; p._u = {};
  return p;
}
async function waitPrograms(ps){
  if (!parallelCompile) return;
  const done = p => p._noProgram || gl.isContextLost() || gl.getProgramParameter(p, parallelCompile.COMPLETION_STATUS_KHR);
  while (!ps.every(done)) await new Promise(r=>setTimeout(r, 40));
}
function finishProgram(p){
  const info = sh => sh ? {ok:gl.getShaderParameter(sh, gl.COMPILE_STATUS) === true, log:gl.getShaderInfoLog(sh) || ''} : {ok:false, log:'gl.createShader returned null'};
  const v = info(p._vs), f = info(p._fs);
  p._vertexOK = v.ok; p._fragmentOK = f.ok; p._vertexLog = v.log; p._fragmentLog = f.log;
  if (p._noProgram){ p._linkOK = false; p._linkLog = 'gl.createProgram returned null'; }
  else { p._linkOK = gl.getProgramParameter(p, gl.LINK_STATUS) === true; p._linkLog = gl.getProgramInfoLog(p) || ''; }
  p._glError = gl.getError();
  return p;
}
function compile(label, vs, fs){ return finishProgram(startProgram(label, vs, fs)); }
function linked(p){
  const report = [
    `${p?._label || 'desconocido'}: COMPILE_STATUS de vértices=${!!p?._vertexOK}, COMPILE_STATUS de fragmentos=${!!p?._fragmentOK}, LINK_STATUS=${!!p?._linkOK}`,
    `  registro de vértices: ${p?._vertexLog || '(vacío)'}`,
    `  registro de fragmentos: ${p?._fragmentLog || '(vacío)'}`,
    `  registro del programa: ${p?._linkLog || '(vacío)'}`,
    `  error de GL tras el enlace: ${p?._glError == null ? 'no disponible' : '0x' + p._glError.toString(16)}`
  ].join('\n');
  shaderReports.push(report);
  const ok = !!p && p._vertexOK && p._fragmentOK && p._linkOK;
  if (!ok) console.error('Error de shader', report);
  return ok;
}
function gpuName(){ try { const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); } catch(e){ return 'desconocido'; } }
function escapeHtml(value){ return String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function rendererDiagnostics(){
  const param = key => { try { return gl.getParameter(key); } catch(e){ return 'no disponible'; } };
  return [
    `GPU: ${gpuName()}`,
    `Proveedor de GL: ${param(gl.VENDOR)}`,
    `Renderizador de GL: ${param(gl.RENDERER)}`,
    `Versión de GL: ${param(gl.VERSION)}`,
    `Contexto WebGL perdido: ${gl.isContextLost()}`,
    `Vectores uniformes de fragmentos: ${param(gl.MAX_FRAGMENT_UNIFORM_VECTORS)}`,
    `Unidades de imagen de textura: ${param(gl.MAX_TEXTURE_IMAGE_UNITS)}`,
    `Límite de tamaño de textura 3D: ${param(gl.MAX_3D_TEXTURE_SIZE)}`,
    `Navegador: ${navigator.userAgent}`,
    `Intentos de contexto: ${glTried.join(' | ')}`,
    `En iframe: ${window.top !== window}`,
    ...shaderReports
  ].join('\n');
}
function showRendererFailure(){
  failMsg(`El renderizador 3D del encéfalo no pudo inicializarse en este dispositivo.<details style="margin-top:10px;text-align:left"><summary>Detalles técnicos</summary><pre style="white-space:pre-wrap;font-size:11px;max-height:220px;overflow:auto;user-select:text">${escapeHtml(rendererDiagnostics())}</pre></details>`);
  const hl = $('#heroLoad');
  if (hl){ hl.classList.remove('done'); $('#heroLoadMsg').textContent = 'La vista 3D no pudo iniciarse en este dispositivo. Abra cualquier pestaña de exploración para ver los detalles técnicos.'; }
}
const ul = (p,n) => (n in p._u) ? p._u[n] : (p._u[n] = gl.getUniformLocation(p, n));
const u1i=(p,n,v)=>gl.uniform1i(ul(p,n),v), u1f=(p,n,v)=>gl.uniform1f(ul(p,n),v), u2f=(p,n,a,b)=>gl.uniform2f(ul(p,n),a,b);
const u3=(p,n,v)=>gl.uniform3fv(ul(p,n),v), u4=(p,n,v)=>gl.uniform4fv(ul(p,n),v), u1fv=(p,n,v)=>gl.uniform1fv(ul(p,n),v);
let progSlice, progMesh, vao, emptyVao, brainCount = 0, scalpStart = 0, scalpCount = 0;
let regData = new Float32Array(128*4*4), regTex, vesTex, nVes = 0;
let pickFbo = null, pickSize = [0,0], thumbFbo, TH = 256;

/* ---------- loading ---------- */
async function fetchBin(url, onp){
  const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status);
  const reader = r.body.getReader(); const chunks = []; let got = 0;
  for(;;){ const {done, value} = await reader.read(); if (done) break; chunks.push(value); got += value.length; onp(got); }
  let blob = new Blob(chunks);
  if (url.endsWith('.png')){ // gzip bytes stored losslessly in PNG pixels (RGB, 8-byte header)
    const bmp = await createImageBitmap(blob, {colorSpaceConversion:'none', premultiplyAlpha:'none'});
    const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
    const ctx = c.getContext('2d', {willReadFrequently:true}); ctx.drawImage(bmp, 0, 0);
    const px = ctx.getImageData(0, 0, c.width, c.height).data, n = c.width*c.height, out = new Uint8Array(n*3);
    const CHUNK = 262144;
    for (let i = 0, j = 0; i < n; i++, j += 4){
      out[i*3] = px[j]; out[i*3+1] = px[j+1]; out[i*3+2] = px[j+2];
      if (i > 0 && (i & (CHUNK - 1)) === 0) await new Promise(r => setTimeout(r, 0));
    }
    const len = out[0] | (out[1] << 8) | (out[2] << 16) | (out[3] << 24);
    if (String.fromCharCode(out[4], out[5], out[6], out[7]) !== 'NLB1') throw new Error('la cabecera de la imagen de datos no coincide');
    blob = new Blob([out.subarray(8, 8 + len)]);
  }
  const head = new Uint8Array(await blob.slice(0,2).arrayBuffer());
  if (head[0] === 0x1f && head[1] === 0x8b){
    if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador no puede descomprimir los datos (requiere DecompressionStream).');
    return new Uint8Array(await new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  }
  return new Uint8Array(await blob.arrayBuffer());
}
async function load(){
  if (!gl){ await loadCompatibilityPreview('Contexto WebGL 2 no disponible.\nIntentos de contexto: ' + glTried.join(' | ') + '\nEn iframe: ' + (window.top !== window) + '\nNavegador: ' + navigator.userAgent); return; }
  // Compile the surface renderer first so the brain can still be shown if a
  // device-specific failure is limited to the more complex scan shader.
  progMesh = startProgram('malla del encéfalo', VS_MESH, FS_MESH);
  progSlice = startProgram('superposición de la exploración', VS_FULL, FS_SLICE);
  // Download the brain while the GPU driver compiles.
  const metaP = fetch('data/meta.json').then(r=>{ if (!r.ok) throw new Error('data/meta.json ' + r.status); return r.json(); });
  const binsP = metaP.then(meta=>{
    META = meta;
    const total = META.bytes.vol + META.bytes.mesh; let gv = 0, gm = 0;
    const prog = () => { const f = (gv + gm)/total; $('#loadBar').style.width = (f*100).toFixed(1) + '%'; $('#loadPct').textContent = Math.round(f*100) + '%'; onLoadProgress(f); };
    return Promise.all([fetchBin('data/vol.png', g=>{gv=g;prog();}), fetchBin('data/mesh.png', g=>{gm=g;prog();}), fetchBin('data/jue.png', ()=>{})]);
  });
  binsP.catch(()=>{});
  await waitPrograms([progMesh, progSlice]);
  finishProgram(progMesh); finishProgram(progSlice);
  const okM = linked(progMesh), okS = linked(progSlice);
  sliceAvailable = okS;
  if (gl.isContextLost() || !okM){ await loadCompatibilityPreview(rendererDiagnostics()); return; }
  if (!okS){
    const hl = $('#heroLoad');
    if (hl){ hl.classList.remove('done'); $('#heroLoadMsg').textContent = 'Encéfalo 3D disponible; las superposiciones de exploración no están disponibles en este dispositivo.'; }
    setPreviewNotice('El encéfalo 3D está disponible, pero las superposiciones de exploración están desactivadas porque falló el shader del escáner.', shaderReports.join('\n\n'));
  }
  const [vol, mesh, jue] = await binsP;
  $('#loadMsg').textContent = 'Construyendo el encéfalo'; $('#loadPct').textContent = '';
  await new Promise(r=>setTimeout(r,30));
  const [w,h,d] = META.dims, n = w*h*d;
  VOL = {A: vol.subarray(0, n*4), B: vol.subarray(n*4, n*8), C: vol.subarray(n*8, n*12), J: jue, dims:[w,h,d], lo:META.lo};
  const mk3 = (data, unit, linear) => {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_3D, t);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA8, w, h, d, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    if (linear){ gl.generateMipmap(gl.TEXTURE_3D); gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); }
    else { gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); }
    for (const p of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T, gl.TEXTURE_WRAP_R]) gl.texParameteri(gl.TEXTURE_3D, p, gl.CLAMP_TO_EDGE);
    return t;
  };
  TEX.A = mk3(VOL.A, 0, true); TEX.B = mk3(VOL.B, 1, true); TEX.C = mk3(VOL.C, 2, false);
  // region + vessel data textures
  const mk2 = (unit, w2, h2) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w2, h2, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); return t; };
  regTex = mk2(4, 128, 4); vesTex = mk2(3, 200, 2);
  buildMesh(mesh);
  emptyVao = gl.createVertexArray();
  // thumbnail target
  const tt = gl.createTexture(); gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, tt);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, TH, TH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  thumbFbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, thumbFbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tt, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  initRegions();
  buildVessels();
  ready = true; dirty = true;
  $('#loading').classList.add('gone');
  setTimeout(()=>$('#loading').remove(), 600);
  onReady();
  if (!sliceAvailable){
    const hl = $('#heroLoad');
    if (hl){ hl.classList.remove('done'); $('#heroLoadMsg').textContent = 'Encéfalo 3D listo; las superposiciones de exploración no están disponibles en este dispositivo.'; }
  }
}

function buildMesh(buf){
  const pcs = META.pieces; let nv = 0, nf = 0;
  for (const p of pcs){ nv += p.nv; nf += p.nf; }
  const pos = new Int16Array(nv*3), nrm = new Int8Array(nv*4), reg = new Uint8Array(nv), idx = new Uint32Array(nf*3);
  let vo = 0, fo = 0;
  for (const p of pcs){
    pos.set(new Int16Array(buf.buffer, buf.byteOffset + p.pos, p.nv*3), vo*3);
    nrm.set(new Int8Array(buf.buffer, buf.byteOffset + p.nrm, p.nv*4), vo*4);
    reg.fill(p.id, vo, vo + p.nv);
    const src = new Uint32Array(buf.buffer.slice(buf.byteOffset + p.idx, buf.byteOffset + p.idx + p.nf*12));
    for (let i = 0; i < src.length; i++) idx[fo*3 + i] = src[i] + vo;
    if (p.id === 0){ scalpStart = fo*3; scalpCount = p.nf*3; } else brainCount = (fo + p.nf)*3;
    vo += p.nv; fo += p.nf;
  }
  // keep the raw arrays so the immersive three.js scenes can show the same brain
  const scalpPiece = pcs.find(p=>p.id === 0); MESHRAW = {pos, nrm, reg, idx, brainCount, nv: nv - (scalpPiece ? scalpPiece.nv : 0)};
  vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const vb = (data, loc, size, type, norm, stride) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, type, norm, stride, 0); };
  vb(pos, 0, 3, gl.SHORT, false, 6); vb(nrm, 1, 4, gl.BYTE, true, 4); vb(reg, 2, 1, gl.UNSIGNED_BYTE, false, 1);
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  gl.bindVertexArray(null);
}

/* ---------- regions (colour, visibility, explode offset) ---------- */
let REG = []; // index by id
function initRegions(){
  REG = [];
  for (const r of META.regions) REG[r.id] = {...r, visible:true, off:[0,0,0]};
  uploadRegions();
}
function regionColor(r){
  const mode = (typeof LAB !== 'undefined') ? LAB.colorBy : 'lobe';
  let c = GROUP_COLORS[r.group] || [0.7,0.7,0.7];
  if (mode === 'region'){ const h = (r.id*0.61803)%1; const k = 0.82 + 0.18*((r.id*7)%3)/2; c = c.map((v,i)=>Math.min(1, v*k*(0.85 + 0.3*Math.sin(h*6.28 + i*2.1)))); }
  if (r.hemi === 'R' && mode === 'lobe') c = c.map(v=>v*0.9);
  return c;
}
function uploadRegions(){
  regData.fill(0);
  for (let id = 1; id < 128; id++){
    const r = REG[id]; if (!r) continue;
    const c = regionColor(r);
    regData.set([c[0],c[1],c[2], r.visible ? 1 : 0], id*4);
    regData.set([r.off[0], r.off[1], r.off[2], 0], (128 + id)*4);
  }
  regData.set([0.8,0.75,0.7,1], 0);
  gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, regTex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 128, 4, gl.RGBA, gl.FLOAT, regData);
  dirty = true;
}

/* ---------- vessels ---------- */
function vesselSegments(opts){
  const segs = [];
  const st = opts.state || {};
  const add = (a, b, r, type) => segs.push([a, b, r, type]);
  let seed = 1;
  const rnd = () => { seed = (seed*16807) % 2147483647; return seed/2147483647 - 0.5; };
  const poly = (pts, r, type, mirror, grp, flag) => {
    for (const side of mirror ? [-1, 1] : [1]){
      if (opts.inject){
        const g = grp === 'ICA' ? (side < 0 ? 'ICA-L' : 'ICA-R') : grp === 'POST' ? 'VERT' : grp;
        if (grp !== 'VEIN' && g !== opts.inject && !(flag === 'mid' && opts.inject.startsWith('ICA') && grp === 'ICA')) continue;
      }
      const P = pts.map(p => side < 0 ? p.slice() : [-p[0], p[1], p[2]]);
      if (st.vessels && st.vessels.occl === 'MCA' && side < 0 && flag === 'MCA') continue;
      if (opts.noFlow && grp !== 'VEIN'){ // contrast stops at the skull base
        const cut = []; for (const p of P){ if (p[2] > -32) break; cut.push(p); } if (cut.length < 2) continue; P.length = 0; P.push(...cut);
      }
      if (opts.noFlow && grp === 'VEIN') continue;
      for (let i = 0; i < P.length - 1; i++){
        const a = P[i], b = P[i+1], n = Math.max(1, Math.round(v3.len(v3.sub(b, a))/7));
        let prev = a;
        for (let k = 1; k <= n; k++){
          const t = k/n; let q = v3.add(a, v3.mul(v3.sub(b, a), t));
          if (k < n && r < 2.6){ const j = r < 1.2 ? 1.6 : 1.0; q = v3.add(q, [rnd()*j, rnd()*j, rnd()*j]); }
          add(prev, q, r*(1 - 0.12*t*(i/(P.length))), type); prev = q;
        }
      }
    }
  };
  for (const [name, grp, type, r, pts, flag] of VESSELS){
    let P = pts;
    if (name === 'SSS') P = META.landmarks.sss.map(p=>p.slice()).reverse().concat([[0,-104,8]]);
    const mirror = flag !== 'mid' && !(grp === 'VEIN' && (name === 'SSS' || name === 'SS'));
    poly(P, r, type, mirror, grp, flag);
  }
  if (st.vessels && st.vessels.aneurysm && !opts.noFlow){ const a = st.vessels.aneurysm; add(a.c, a.c, a.r, 0); }
  if (st.vessels && st.vessels.spot && !opts.inject){ add(st.vessels.spot, st.vessels.spot, 1.5, 0); }
  if (st.vessels && st.vessels.avm && !opts.noFlow && (!opts.inject || opts.inject === 'ICA-R')){
    const c = st.vessels.avm.c, R = st.vessels.avm.r;
    for (let i = 0; i < 26; i++){ const a = v3.add(c, [rnd()*R*1.4, rnd()*R*1.4, rnd()*R*1.4]); const b = v3.add(a, [rnd()*9, rnd()*9, rnd()*9]); add(a, b, 1.1, 2); }
    add([40,-20,30], c, 1.6, 2); // enlarged MCA feeder
    add(c, [10,-52,66], 2.4, 2); add([10,-52,66], [0,-50,70], 2.6, 2); // early draining vein to the SSS
  }
  return segs.slice(0, 200);
}
function uploadVessels(segs){
  const d = new Float32Array(200*2*4);
  segs.forEach((s, i) => { d.set([s[0][0], s[0][1], s[0][2], s[2]], i*4); d.set([s[1][0], s[1][1], s[1][2], s[3]], (200 + i)*4); });
  gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, vesTex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 200, 2, gl.RGBA, gl.FLOAT, d);
  return segs.length;
}
let vesKey = '';
function buildVessels(sub, stKey){
  sub = sub || activeSub(); stKey = stKey || activeStateKey();
  const st = STATES[stKey] || {};
  const inject = sub.code === 60 ? S.dsaInj : null;
  const key = [stKey, inject].join('|');
  if (key === vesKey) return; vesKey = key;
  nVes = uploadVessels(vesselSegments({state:st, inject, noFlow:!!st.noFlow}));
  dirty = true;
}

/* ---------- camera ---------- */
function camera(W, H){
  const [r,u,f] = basisQ(S.q);
  const pos = v3.sub(TARGET, v3.mul(f, DIST));
  const m = Math.min(W, H), tx = TAN*W/m, ty = TAN*H/m;
  const V = [r[0],u[0],-f[0],0, r[1],u[1],-f[1],0, r[2],u[2],-f[2],0, -v3.dot(r,pos), -v3.dot(u,pos), v3.dot(f,pos), 1];
  const n = 150, fa = 900;
  const P = [1/tx,0,0,0, 0,1/ty,0,0, -2*viewShift/stageW,0,-(fa+n)/(fa-n),-1, 0,0,-2*fa*n/(fa-n),0];
  return {r,u,f,pos,VP:mul4(P,V)};
}
function project(p, cam){ const v = cam.VP; const x = v[0]*p[0]+v[4]*p[1]+v[8]*p[2]+v[12], y = v[1]*p[0]+v[5]*p[1]+v[9]*p[2]+v[13], w = v[3]*p[0]+v[7]*p[1]+v[11]*p[2]+v[15]; return [(x/w*0.5 + 0.5)*stageW, (1 - (y/w*0.5 + 0.5))*stageH, w]; }
function rayAt(cx, cy){ // client coords relative to stage -> world ray
  const [r,u,f] = basisQ(S.q);
  const m = Math.min(stageW, stageH);
  const ux = (cx - stageW/2 - viewShift)/(m/2), uy = -(cy - stageH/2)/(m/2);
  const rd = v3.norm(v3.add(v3.add(v3.mul(r, ux*TAN), v3.mul(u, uy*TAN)), f));
  return {ro: v3.sub(TARGET, v3.mul(f, DIST)), rd, r, u, f};
}
function slicePoint(cx, cy){
  const R = rayAt(cx, cy); const P0 = v3.add(TARGET, v3.mul(R.f, S.slice));
  const t = v3.dot(v3.sub(P0, R.ro), R.f)/v3.dot(R.rd, R.f);
  return v3.add(R.ro, v3.mul(R.rd, t));
}

/* ---------- volume lookups on the CPU ---------- */
function voxel(p){
  const [w,h,d] = VOL.dims, lo = VOL.lo;
  const i = Math.round(90 - p[0]) - lo[0], j = Math.round(p[1] + 126) - lo[1], k = Math.round(p[2] + 72) - lo[2];
  if (i < 0 || j < 0 || k < 0 || i >= w || j >= h || k >= d) return null;
  const o = ((k*h + j)*w + i)*4;
  return {A:VOL.A.subarray(o, o+4), B:VOL.B.subarray(o, o+4), C:VOL.C.subarray(o, o+4), J:VOL.J[o/4]};
}
const HEMI = {L:'izquierdo', R:'derecho', M:''};
const GROUP_ES = {'Frontal lobe':'Lóbulo frontal', 'Parietal lobe':'Lóbulo parietal', 'Temporal lobe':'Lóbulo temporal', 'Occipital lobe':'Lóbulo occipital', 'Limbic lobe':'Lóbulo límbico', 'Insula & operculum':'Ínsula y opérculo', 'Deep grey matter':'Sustancia gris profunda', 'Ventricles':'Ventrículos', 'Cerebellum':'Cerebelo', 'Brainstem':'Tronco del encéfalo'};
const groupEs = g => GROUP_ES[g] || g;
function describePoint(p){
  const v = voxel(p); if (!v) return null;
  const [t1, gm, wm, csf] = v.A, [bone, , , air] = v.B, [lab, , yeo, jhu] = v.C, jue = v.J;
  if (lab > 0){
    const id = lab >= 128 ? lab - 128 : lab; const r = REG[id];
    if (lab >= 128){
      const tr = META.jhu[jhu];
      return {name: tr ? tr.name + (tr.hemi !== 'M' ? ' (' + HEMI[tr.hemi] + ')' : '') : 'Sustancia blanca', sub: tr ? 'tracto de sustancia blanca' : 'por debajo de ' + r.name.toLowerCase(), region:r};
    }
    const ju = META.juelich[jue];
    return {name: r.name + (r.hemi !== 'M' ? ' (' + HEMI[r.hemi] + ')' : ''), sub: (ju ? ju.name.replace(/_/g,' ') + ' · ' : '') + groupEs(r.group).toLowerCase(), region:r};
  }
  if (csf > 150) return {name:'Líquido cefalorraquídeo', sub:'espacio subaracnoideo'};
  if (gm + wm > 200) return {name:'Encéfalo', sub:'sin etiquetar'};
  if (bone > 60) return {name:'Cráneo', sub: bone > 200 ? 'hueso cortical' : 'diploe (médula ósea)'};
  if (air > 120) return {name:'Aire', sub:'seno paranasal o vía aérea'};
  if (t1 > 190) return {name:'Grasa', sub:'cuero cabelludo u órbita'};
  if (t1 > 25) return {name:'Tejido blando', sub:'cuero cabelludo, músculo o cara'};
  return null;
}

/* ---------- active sub/state (lab can override) ---------- */
function activeSub(){ if (S.tab === 'lab' && typeof LAB !== 'undefined') return LAB.scanSub(); return subObj(); }
function activeStateKey(){ if (S.tab === 'lab' && typeof LAB !== 'undefined') return LAB.stateKey(); return S.state; }
function activeState(){ if (S.tab === 'lab' && typeof LAB !== 'undefined') return LAB.state(); return stObj(); }

const FIND_MODS = {
  infarct:['t1','t1gd','t2','flair','dwi','dti','asl','ctb','fdg','hmpao','bold','mrs'], clot:['ctb','swi','flair','mra','cta','dsa'],
  haem:['t1','t1gd','t2','flair','dwi','swi','dti','ctb','cta','fdg'], sah:['flair','ctb'], aneur_rupt:['mra','cta'],
  sdh:['ctb','t1','t2','flair'], edh:['ctb','t2'], fracture:['ctbone','ctb'], gbm:['t1','t1gd','t2','flair','dwi','swi','dti','asl','mrs','ctb','fdg'],
  met:['t1gd','t2','flair','ctb'], abscess:['t1gd','t2','dwi','swi','mrs','dti','t1'], plaque:['t1','t2','flair','swi','dti','mrs'], active:['t1gd','dwi','flair','t2','mrs'],
  hippo:['t1','t2','flair','ctb'], tp:['fdg','hmpao','asl'], mts:['t1','t2','flair'], tle_pet:['fdg'], tle_spect:['hmpao'], hydro:['t1','t2','flair','ctb','cus'],
  dat_loss:['dat'], aneur:['mra','cta','dsa'], avm:['t1gd','t2','mra','cta','dsa'], ivh:['cus'], pvl:['cus'], uws:['fdg'],
};
function stateLesions(st, sub){
  const L = (st.lesions || []).map(l=>({...l}));
  const blobs = st.met && st.met[sub.id];
  if (blobs && st.metFind && st.metFind[sub.id]) for (const b of blobs) L.push({k:20, c:b.c, r:[b.s*1.25,b.s*1.25,b.s*1.25], f:st.metFind[sub.id]});
  return L.slice(0, 12);
}
function lesionVisible(l, sub){ return !!(l.f && FIND_MODS[l.f] && FIND_MODS[l.f].includes(sub.id)); }

/* ---------- set the per-state uniforms ---------- */
let simT = 6, uBold = 1, dsaT = 0.22;
function setStateUniforms(p, sub, st, forThumb){
  const id = sub.id;
  u1i(p,'uMod', sub.code);
  const Ls = stateLesions(st, sub);
  const LC = new Float32Array(48), LR = new Float32Array(48), LP = new Float32Array(48), LS = new Float32Array(12);
  Ls.forEach((l, i) => { LC.set([l.c[0], l.c[1], l.c[2], l.k], i*4); LR.set([l.r[0], l.r[1], l.r[2], 0], i*4); const pp = l.p || []; LP.set([pp[0]||0, pp[1]||0, pp[2]||0, 0], i*4); LS[i] = lesionVisible(l, sub) ? 1 : 0; });
  u1i(p,'uNL', Ls.length); u4(p,'uLC', LC); u4(p,'uLR', LR); u4(p,'uLP', LP); u1fv(p,'uLShow', LS);
  u1i(p,'uHover', forThumb ? -1 : S.hover);
  u1f(p,'uAtrophy', st.atrophy || 0); u1f(p,'uHydro', st.hydro || 0);
  let metG = st.metG ?? 1;
  if (id === 'asl' && st.asl) metG = st.asl.g;
  if (id === 'amy') metG = st.amyloid ? 2 : 1;
  if (id === 'dat') metG = st.pd ? -1 : 1;
  u1f(p,'uMetG', metG);
  const yg = new Float32Array(8).fill(1); if (st.yeo) for (const k in st.yeo) yg[+k] = st.yeo[k]; u1fv(p,'uYeoG', yg);
  const blobs = (st.met && st.met[id]) || []; const MB = new Float32Array(24), MBG = new Float32Array(6);
  blobs.slice(0,6).forEach((b,i)=>{ MB.set([b.c[0],b.c[1],b.c[2],b.s], i*4); MBG[i] = b.g; });
  u1i(p,'uNMB', Math.min(6, blobs.length)); u4(p,'uMB', MB); u1fv(p,'uMBG', MBG);
  const act = st.act || []; const AC = new Float32Array(32), AA = new Float32Array(8);
  act.slice(0,8).forEach((a,i)=>{ AC.set([a.c[0],a.c[1],a.c[2],a.s], i*4); AA[i] = a.a; });
  u1i(p,'uNAct', Math.min(8, act.length)); u4(p,'uAct', AC); u1fv(p,'uActA', AA); u1i(p,'uActYeo', st.yeoAct || 0);
  u1f(p,'uBold', forThumb ? 1 : (st.yeoAct ? 0.85 + 0.15*Math.sin(simT*0.5) : uBold));
  u1i(p,'uNoFlow', st.noFlow ? 1 : 0);
  const probe = sub.code === 51 ? [-74, -4, -6, 1] : [0, 12, 92, 0];
  u4(p,'uProbe', probe);
  u4(p,'uBox', st.box || [-28,-20,32,9]);
  u1f(p,'uFindings', (S.findings && !forThumb) ? 1 : 0);
  u1f(p,'uDsa', forThumb ? 0.22 : dsaT);
}
function bindVolumes(p){
  u1i(p,'uA',0); u1i(p,'uB',1); u1i(p,'uC',2); u1i(p,'uVes',3); u1i(p,'uReg',4);
  u3(p,'uLo', META.lo); u3(p,'uDims', META.dims); u3(p,'uCal', [META.calib.csf, META.calib.gm, META.calib.wm]);
  u1i(p,'uNVes', nVes); u3(p,'uTarget', TARGET); u3(p,'uBg', [0.039,0.062,0.078]);
}

/* ---------- glass + sizes ---------- */
// Touch screens draw a little under full retina when still and well under it while moving or animating,
// so turning the brain and the live EEG / MEG / fMRI views stay smooth on a phone GPU.
const TOUCH = matchMedia('(pointer: coarse)').matches;
const BASE_SCALE = Math.min(window.devicePixelRatio || 1, TOUCH ? 1.75 : 2);
let renderScale = BASE_SCALE, motionScale = TOUCH ? Math.min(BASE_SCALE, 1.15) : BASE_SCALE, lastMotion = 0, stageW = 1, stageH = 1, viewShift = 0;
function updateShift(){ const lp = $('#labPanel'); const cp = $('#caseP'); viewShift = (S.tab === 'lab' && stageW > 820 && !lp.hidden) ? -lp.offsetWidth/2 : (S.caseMode && cp && !cp.hidden && stageW > 820) ? -cp.offsetWidth/2 : 0; dirty = true; }
function resize(){
  const r = stage.getBoundingClientRect(); stageW = Math.max(1, r.width); stageH = Math.max(1, r.height);
  const w = Math.round(stageW*renderScale), h = Math.round(stageH*renderScale);
  if (canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
  resizeCompatibilityPreview(w, h);
  updateShift();
  if (!S.glass.placed){
    const narrow = stageW < 640;
    S.glass.size = Math.round(Math.max(190, Math.min(stageW*(narrow ? 0.6 : 0.42), stageH*0.62)));
    S.glass.x = Math.round(stageW*(narrow ? 0.62 : 0.56) - S.glass.size/2); S.glass.y = Math.round(stageH*0.52 - S.glass.size/2);
    S.glass.placed = true;
  }
  clampGlass(); layoutGlass(); dirty = true;
}
const RO = new ResizeObserver(()=>resize()); RO.observe(stageEl); RO.observe($('#heroStage'));
function clampGlass(){
  const g = S.glass;
  g.size = Math.max(150, Math.min(g.size, Math.min(stageW, stageH) - 16));
  g.x = Math.min(Math.max(g.x, -g.size*0.5), stageW - g.size*0.5);
  g.y = Math.min(Math.max(g.y, 6), stageH - g.size*0.5);
}
function layoutGlass(){
  const g = S.glass;
  glassEl.style.transform = `translate(${g.x}px,${g.y}px)`;
  glassEl.style.width = glassEl.style.height = g.size + 'px';
  glassEl.classList.toggle('compact', g.size < 320);
  $('#gSplit').style.left = (S.split*100) + '%';
  $('#gL1').style.left = '10px'; $('#gL2').style.right = '10px';
  updateAnnotations();
}
function glassVisible(){ if (!sliceAvailable) return false; if (VIEW === 'home') return HERO.glass; return S.tab === 'scans' || (S.tab === 'lab' && S.labScan !== 'none'); }

/* ---------- render ---------- */
function drawBrain(cam, look, opts = {}){
  gl.useProgram(progMesh); gl.bindVertexArray(vao);
  const p = progMesh;
  gl.uniformMatrix4fv(ul(p,'uVP'), false, cam.VP);
  u3(p,'uCamPos', cam.pos); gl.uniformMatrix3fv(ul(p,'uCamRot'), false, [...cam.r, ...cam.u, ...cam.f]);
  u1i(p,'uReg',4); u1i(p,'uB',1); u3(p,'uLo', META.lo); u3(p,'uDims', META.dims); u1i(p,'uLook', look); u1f(p,'uTime', performance.now()/1000);
  u1i(p,'uScalp', opts.scalp ? 1 : 0);
  const clip = (S.tab === 'lab' && typeof LAB !== 'undefined') ? LAB.clipPlane() : null;
  u1i(p,'uClipOn', clip && !opts.scalp && look !== 2 && look !== 3 ? 1 : 0); u4(p,'uClip', clip || [0,0,1,0]);
  const lab = (S.tab === 'lab' && typeof LAB !== 'undefined');
  u1i(p,'uHoverR', lab ? LAB.hoverR : -1); u1i(p,'uSelR', lab ? LAB.selR : -1);
  const st = activeState(), sub = activeSub();
  const showAct = (look === 0 || look === 1) && (sub.code === 30 || (lab && LAB.actOnSurface())) && st.act;
  const act = showAct ? st.act : [];
  const AC = new Float32Array(32), AA = new Float32Array(8); act.slice(0,8).forEach((a,i)=>{ AC.set([a.c[0],a.c[1],a.c[2],a.s], i*4); AA[i] = a.a; });
  u1i(p,'uNAct', act.length); u4(p,'uAct', AC); u1fv(p,'uActA', AA); u1f(p,'uBold', lab ? 1 : uBold);
  const stim = lab ? LAB.stimUniform() : [0,0,0,0]; u4(p,'uStim', stim);
  u1i(p,'uGlassOnly', opts.glassOnly ? 1 : 0);
  if (opts.glassOnly) setGlassUniforms(p);
  if (look === 2 || look === 3) setSurfaceUniforms(p, look);
  if (opts.scalp) gl.drawElements(gl.TRIANGLES, scalpCount, gl.UNSIGNED_INT, scalpStart*4);
  else gl.drawElements(gl.TRIANGLES, brainCount, gl.UNSIGNED_INT, 0);
}
function setGlassUniforms(p){
  const sc = canvas.width/stageW, g = S.glass, half = g.size/2;
  u4(p,'uGlass', [(g.x + half)*sc, (stageH - (g.y + half))*sc, half*sc, half*sc]); u1f(p,'uGlassR', 12*sc);
}
function drawGlass(cam){
  if (!sliceAvailable) return;
  const sub = activeSub(), st = activeState();
  gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(progSlice); gl.bindVertexArray(emptyVao);
  const p = progSlice; bindVolumes(p);
  u2f(p,'uRes', canvas.width, canvas.height); u3(p,'uCamPos', cam.pos);
  gl.uniformMatrix3fv(ul(p,'uCamRot'), false, [...cam.r, ...cam.u, ...cam.f]); u1f(p,'uTan', TAN);
  setGlassUniforms(p); u1f(p,'uSlice', S.slice); u1f(p,'uShift', viewShift*canvas.width/stageW);
  setStateUniforms(p, sub, st, false);
  const sc = canvas.width/stageW;
  const splitOn = S.compare && S.tab === 'scans' && VIEW === 'scans' && !sub.surface;
  u1f(p,'uSplit', splitOn ? (S.glass.x + S.glass.size*S.split)*sc : -1);
  u1i(p,'uMod2', subById(S.sub2).code);
  if (sub.surface){
    u1i(p,'uMode', 3); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.clear(gl.DEPTH_BUFFER_BIT);
    drawBrain(cam, sub.code === 40 ? 2 : 3, {scalp:true, glassOnly:true});
  } else {
    u1i(p,'uMode', 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST);
}
function drawCap(cam){
  if (!sliceAvailable) return;
  const clip = LAB.clipPlane(); if (!clip) return;
  gl.useProgram(progSlice); gl.bindVertexArray(emptyVao);
  const p = progSlice; bindVolumes(p);
  u2f(p,'uRes', canvas.width, canvas.height); u3(p,'uCamPos', cam.pos);
  gl.uniformMatrix3fv(ul(p,'uCamRot'), false, [...cam.r, ...cam.u, ...cam.f]); u1f(p,'uTan', TAN);
  gl.uniformMatrix4fv(ul(p,'uVP'), false, cam.VP); u4(p,'uClip', clip); u1i(p,'uMode', 2); u1f(p,'uShift', viewShift*canvas.width/stageW);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
let surfaceState = {src:[], elec:[], dip:[]};
function setSurfaceUniforms(p, look){
  const E = META.landmarks.electrodes, names = Object.keys(E);
  const el = new Float32Array(57); names.forEach((n,i)=>el.set(E[n], i*3)); gl.uniform3fv(ul(p,'uElec'), el); u1i(p,'uShowElec', look === 2 ? 1 : 0);
  const src = surfaceState.src, S4 = new Float32Array(40), SA = new Float32Array(10);
  src.slice(0,10).forEach((s,i)=>{ S4.set([s.p[0],s.p[1],s.p[2],s.s], i*4); SA[i] = s.a; });
  u1i(p,'uNSrc', Math.min(10, src.length)); u4(p,'uSrc', S4); u1fv(p,'uSrcA', SA);
  const dp = surfaceState.dip, D = new Float32Array(12), DQ = new Float32Array(12);
  dp.slice(0,3).forEach((d,i)=>{ D.set([d.p[0],d.p[1],d.p[2],0], i*4); DQ.set([d.q[0],d.q[1],d.q[2],d.a], i*4); });
  u1i(p,'uNDip', Math.min(3, dp.length)); u4(p,'uDip', D); u4(p,'uDipQ', DQ);
}
function render(){
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(BG[0], BG[1], BG[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.BLEND);
  const cam = camera(canvas.width, canvas.height);
  drawBrain(cam, S.tab === 'lab' ? 1 : 0);
  if (S.tab === 'lab' && LAB.clipPlane()) drawCap(cam);
  if (glassVisible()) drawGlass(cam);
  afterRender(cam);
}
function pickAt(cx, cy){
  if (!ready) return null;
  const W = canvas.width, H = canvas.height;
  if (!pickFbo || pickSize[0] !== W || pickSize[1] !== H){
    if (pickFbo){ gl.deleteFramebuffer(pickFbo.f); gl.deleteTexture(pickFbo.t); gl.deleteRenderbuffer(pickFbo.d); }
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const d = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, d); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, W, H);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, d);
    pickFbo = {f, t, d}; pickSize = [W, H];
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, pickFbo.f); gl.viewport(0, 0, W, H);
  const px = Math.round(cx*W/stageW), py = Math.round(H - cy*H/stageH);
  gl.enable(gl.SCISSOR_TEST); gl.scissor(px, py, 1, 1);
  gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
  drawBrain(camera(W, H), 4);
  const out = new Uint8Array(4); gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, out);
  gl.disable(gl.SCISSOR_TEST); gl.bindFramebuffer(gl.FRAMEBUFFER, null); dirty = true;
  if (!out[0]) return null;
  return {id: out[0], p: [90 - out[1], out[2] - 126, out[3] - 72]};
}

/* ---------- thumbnails ---------- */
const thumbCache = new Map(); let thumbQueue = [];
var thumbLast = 0;
function renderThumb(job){
  if (TOUCH && (drag || performance.now() - thumbLast < 90)){ thumbQueue.unshift(job); return; }
  thumbLast = performance.now();
  const sub = job.sub, st = STATES[job.state];
  if (sub.surface || sub.spectrum){ drawThumb2D(job); return; }
  if (!sliceAvailable){ drawUnavailableThumb(job); return; }
  buildVessels(sub, job.state);
  const plane = (st.plane && sub.code === 30) ? st.plane : sub.plane;
  const [r,u,f] = basisLook(PLANES[plane].f, PLANES[plane].up);
  const pb = st.posBySub && st.posBySub[sub.id];
  const w = (pb && pb[plane] !== undefined) ? pb[plane] : (st.pos && st.pos[plane] !== undefined && !sub.mip) ? st.pos[plane] : sub.at;
  gl.bindFramebuffer(gl.FRAMEBUFFER, thumbFbo); gl.viewport(0, 0, TH, TH);
  gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
  gl.useProgram(progSlice); gl.bindVertexArray(emptyVao);
  const p = progSlice; bindVolumes(p);
  setStateUniforms(p, sub, st, true);
  u2f(p,'uRes', TH, TH); u1i(p,'uMode', 1); u1f(p,'uHalf', 108);
  u3(p,'uTR', r); u3(p,'uTU', u); u3(p,'uTF', f); u1f(p,'uSlice', worldToSlice(plane, w)); u1f(p,'uSplit', -1);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  const buf = new Uint8Array(TH*TH*4); gl.readPixels(0, 0, TH, TH, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const img = new ImageData(TH, TH);
  for (let y = 0; y < TH; y++) img.data.set(buf.subarray((TH - 1 - y)*TH*4, (TH - y)*TH*4), y*TH*4);
  thumbCache.set(job.key, img); paintThumb(job.key);
  vesKey = ''; dirty = true;
}
function paintThumb(key){
  if (!thumbCache.has(key)) return; const v = thumbCache.get(key);
  document.querySelectorAll(`canvas[data-key="${key}"]`).forEach(c=>{ if (v instanceof ImageData) c.getContext('2d').putImageData(v, 0, 0); else c.getContext('2d').drawImage(v, 0, 0); });
}
function drawThumb2D(job){
  const c = document.createElement('canvas'); c.width = c.height = TH; const ctx = c.getContext('2d');
  ctx.fillStyle = CH.bg; ctx.fillRect(0, 0, TH, TH);
  const st = STATES[job.state];
  if (job.sub.code === 40) drawEEG(ctx, TH, TH, st.eeg, 6, true);
  else if (job.sub.code === 41) drawMEG(ctx, TH, TH, st.meg, true);
  else if (job.sub.code === 9) drawMRS(ctx, TH, TH, st.mrs || 'normal', true);
  else if (job.sub.code === 51) drawTCD(ctx, TH, TH, st.tcd || 'normal', true);
  thumbCache.set(job.key, c); paintThumb(job.key);
}
function drawUnavailableThumb(job){
  const c = document.createElement('canvas'); c.width = c.height = TH;
  const ctx = c.getContext('2d');
  ctx.fillStyle = CH.bg; ctx.fillRect(0, 0, TH, TH);
  ctx.fillStyle = '#64717a'; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('Vista previa de la exploración', TH/2, TH/2 - 7);
  ctx.fillText('no disponible', TH/2, TH/2 + 9);
  thumbCache.set(job.key, c); paintThumb(job.key);
}

/* ---------- frame loop ---------- */
let tween = null, drag = null, last = performance.now(), frameTimes = [], lastScaleChange = 0, lastRender = 0;
function frame(now){
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last)/1000); last = now;
  if (!ready){
    if (fallbackReady){
      const anim = stepTween(now);
      if (VIEW === 'learn' || (VIEW === 'home' && !heroVisible)){
        if (thumbQueue.length) renderThumb(thumbQueue.shift());
        return;
      }
      if (dirty || anim){ renderCompatibilityPreview(); dirty = false; }
      else if (thumbQueue.length) renderThumb(thumbQueue.shift());
    }
    return;
  }
  let anim = stepTween(now);
  const sub = activeSub();
  const live = !reduceMotion && (sub.code === 30 || sub.code === 40 || sub.code === 41 || sub.code === 51 || sub.code === 60 || (S.tab === 'lab' && LAB.animating()));
  if (live){
    simT += dt; if (sub.code === 60 && S.dsaPlay) dsaT = (dsaT + dt/6) % 1;
    uBold = boldAt(simT);
    tickCharts(dt);
    anim = true;
  } else if (sub.code === 30) uBold = 1;
  if (VIEW === 'learn' || (VIEW === 'home' && !heroVisible)){ if (thumbQueue.length) renderThumb(thumbQueue.shift()); return; }
  // Continuous animations (fMRI, EEG, MEG, Doppler, DSA, Brain Lab) are capped at ~30 fps
  // to halve GPU load on slower laptops; dragging, tweens and edits still draw every frame.
  const liveOnly = live && !dirty && !drag && !tween;
  if (liveOnly && now - lastRender < 32) return;
  // Adaptive resolution: while things move on a slow GPU, draw fewer pixels (motionScale);
  // as soon as the picture is still, redraw once at full resolution so scans stay crisp.
  const moving = anim || drag;
  if (moving){ lastMotion = now; if (renderScale !== motionScale){ renderScale = motionScale; resize(); } }
  else if (renderScale !== BASE_SCALE && now - lastMotion > 220){ renderScale = BASE_SCALE; resize(); dirty = true; }
  if (dirty || anim){
    const renderDt = Math.min(0.25, (now - lastRender)/1000); lastRender = now;
    buildVessels();
    render(); dirty = false;
    if (moving){ frameTimes.push(renderDt); if (frameTimes.length > 16){ const avg = frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length; frameTimes = []; if (avg > (TOUCH ? 0.045 : 0.055) && motionScale > (TOUCH ? 0.6 : 0.75) && now - lastScaleChange > (TOUCH ? 500 : 1200)){ motionScale = Math.max(TOUCH ? 0.6 : 0.75, motionScale*0.85); renderScale = motionScale; lastScaleChange = now; resize(); } } }
  } else if (thumbQueue.length) renderThumb(thumbQueue.shift());
}
requestAnimationFrame(frame);
function stepTween(now){
  if (!tween) return false;
  const k = Math.min(1, (now - tween.t0)/tween.dur), e = k < 0.5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3)/2;
  S.q = q4.slerp(tween.q0, tween.q1, e); S.slice = tween.s0 + (tween.s1 - tween.s0)*e; sliceIn.value = S.slice;
  updateAnnotations(); if (k >= 1) tween = null; return true;
}
function animateTo(plane, slice){
  const q1 = plane === 'free' ? S.q : qPlane(plane);
  S.plane = plane; syncPlaneButtons();
  if (reduceMotion){ S.q = q1; S.slice = slice; sliceIn.value = slice; dirty = true; updateAnnotations(); return; }
  tween = {q0:S.q, q1, s0:S.slice, s1:slice, t0:performance.now(), dur:1100};
}

/* ---------- interaction ---------- */
glassEl.addEventListener('pointerdown', e=>{
  e.stopPropagation(); e.preventDefault(); glassEl.setPointerCapture(e.pointerId);
  const mode = e.target.id === 'gResize' ? 'resize' : e.target.id === 'gSplit' ? 'split' : 'glass';
  drag = {type:mode, sx:e.clientX, sy:e.clientY, gx:S.glass.x, gy:S.glass.y, gs:S.glass.size, moved:false};
  glassEl.classList.add('dragging'); hint.classList.add('gone'); hideTip();
});
glassEl.addEventListener('pointermove', e=>{
  const sr = stage.getBoundingClientRect(), cx = e.clientX - sr.left, cy = e.clientY - sr.top;
  if (!drag){ hoverGlass(cx, cy); return; }
  if (drag.type === 'orbit') return;
  const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
  if (Math.hypot(dx, dy) > 3) drag.moved = true;
  if (drag.type === 'glass'){ S.glass.x = drag.gx + dx; S.glass.y = drag.gy + dy; }
  else if (drag.type === 'resize') S.glass.size = drag.gs + Math.max(dx, dy);
  else { S.split = Math.min(0.95, Math.max(0.05, (cx - S.glass.x)/S.glass.size)); }
  clampGlass(); layoutGlass(); dirty = true;
});
glassEl.addEventListener('pointerup', e=>{
  if (drag && drag.type === 'glass' && !drag.moved){ const sr = stage.getBoundingClientRect(); clickGlass(e.clientX - sr.left, e.clientY - sr.top); }
  if (drag && drag.type !== 'orbit'){ drag = null; glassEl.classList.remove('dragging'); }
});
glassEl.addEventListener('pointercancel', ()=>{ drag = null; glassEl.classList.remove('dragging'); });
glassEl.addEventListener('pointerleave', ()=>{ if (!drag){ hideTip(); if (S.hover !== -1){ S.hover = -1; dirty = true; } } });
glassEl.addEventListener('keydown', e=>{
  const step = e.shiftKey ? 40 : 10; let used = true;
  if (e.key === 'ArrowLeft') S.glass.x -= step; else if (e.key === 'ArrowRight') S.glass.x += step;
  else if (e.key === 'ArrowUp') S.glass.y -= step; else if (e.key === 'ArrowDown') S.glass.y += step;
  else if (e.key === 'PageUp') nudgeSlice(1); else if (e.key === 'PageDown') nudgeSlice(-1); else used = false;
  if (used){ e.preventDefault(); clampGlass(); layoutGlass(); dirty = true; }
});
canvas.addEventListener('pointerdown', e=>{
  canvas.setPointerCapture(e.pointerId);
  drag = {type:'orbit', lx:e.clientX, ly:e.clientY, sx:e.clientX, sy:e.clientY, moved:false};
  canvas.classList.add('dragging'); hint.classList.add('gone'); tween = null;
});
canvas.addEventListener('pointermove', e=>{
  const sr = stage.getBoundingClientRect(), cx = e.clientX - sr.left, cy = e.clientY - sr.top;
  if (!drag){ if (S.tab === 'lab') LAB.hover(cx, cy, e.clientX, e.clientY); return; }
  if (drag.type !== 'orbit') return;
  const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly; drag.lx = e.clientX; drag.ly = e.clientY;
  if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4) drag.moved = true;
  const [r,u] = basisQ(S.q);
  S.q = q4.norm(q4.mul(q4.axis(u, -dx*0.007), S.q)); S.q = q4.norm(q4.mul(q4.axis(r, -dy*0.007), S.q));
  if (S.plane !== 'free' && drag.moved){ S.plane = 'free'; syncPlaneButtons(); }
  dirty = true; updateAnnotations();
});
canvas.addEventListener('pointerup', e=>{
  if (drag && drag.type === 'orbit'){ const sr = stage.getBoundingClientRect(); if (!drag.moved && S.tab === 'lab') LAB.click(e.clientX - sr.left, e.clientY - sr.top); drag = null; canvas.classList.remove('dragging'); }
});
canvas.addEventListener('pointercancel', ()=>{ drag = null; canvas.classList.remove('dragging'); });
canvas.addEventListener('pointerleave', ()=>{ if (S.tab === 'lab') LAB.hover(-1, -1); });
stageEl.addEventListener('wheel', e=>{
  if (panel.contains(e.target) || fcard.contains(e.target) || $('#labPanel').contains(e.target) || chart.contains(e.target)) return;
  e.preventDefault(); nudgeSlice(-Math.sign(e.deltaY)); hint.classList.add('gone');
}, {passive:false});
function nudgeSlice(mm){ if (activeSub().mip || activeSub().surface) return; S.slice = Math.max(-90, Math.min(90, S.slice + mm)); sliceIn.value = S.slice; tween = null; dirty = true; updateAnnotations(); }
sliceIn.addEventListener('input', ()=>{ S.slice = parseFloat(sliceIn.value); tween = null; dirty = true; updateAnnotations(); });

/* ---------- hover + findings ---------- */
function hideTip(){ tip.hidden = true; }
function findingAt(p, cx, cy){
  const sub = activeSub(), st = activeState(); if (!st) return null;
  const Ls = stateLesions(st, sub);
  let best = null, bd = 1e9;
  Ls.forEach((l, i) => {
    if (!lesionVisible(l, sub)) return;
    let d;
    if (sub.mip){ const pc = project(l.c, camera(stageW, stageH)); d = Math.hypot(pc[0] - cx, pc[1] - cy)/(Math.max(...l.r)*1.2*(Math.min(stageW,stageH)/2)/(TAN*DIST)); }
    else {
      d = Math.hypot((p[0]-l.c[0])/l.r[0], (p[1]-l.c[1])/l.r[1], (p[2]-l.c[2])/l.r[2]);
      if (l.k === 5 || l.k === 6){ const v = voxel(p); if (!v || v.B[1]*25/255 > (l.p[0] + 2) || v.A[1] + v.A[2] + v.A[3] < 60) d = 9; }
      if (l.k === 4) d /= 1.15;
    }
    if (d < 1 && d < bd){ bd = d; best = {i, l}; }
  });
  return best;
}
let hoverRAF = 0;
function hoverGlass(cx, cy){
  if (!ready || S.tab !== 'scans') { if (S.tab === 'lab') hideTip(); return; }
  cancelAnimationFrame(hoverRAF);
  hoverRAF = requestAnimationFrame(()=>{
    const sub = activeSub();
    const p = slicePoint(cx, cy);
    const f = S.findings ? findingAt(p, cx, cy) : null;
    const nh = f ? f.i : -1;
    if (nh !== S.hover){ S.hover = nh; dirty = true; }
    glassEl.classList.toggle('probe', !!f);
    let html = '';
    if (f){ const F = FINDINGS[f.l.f]; html += `<b class="f">${F.title}</b><span>Pulse para saber más</span>`; }
    if (S.labels && !sub.surface && !sub.mip){ const d = describePoint(p); if (d) html += (html ? '<br>' : '') + `<b>${d.name}</b><span>${d.sub}</span>`; }
    if (!html){ hideTip(); return; }
    tip.innerHTML = html; tip.hidden = false;
    const tx = Math.min(cx + 16, stageW - 270), ty = Math.min(cy + 14, stageH - 70);
    tip.style.left = tx + 'px'; tip.style.top = ty + 'px';
  });
}
function clickGlass(cx, cy){
  if (S.tab !== 'scans') return;
  if (S.caseMode && typeof caseClick === 'function' && caseClick(cx, cy)) return;
  const p = slicePoint(cx, cy); const f = S.findings ? findingAt(p, cx, cy) : null;
  if (f) openFinding(f.l.f, cx, cy);
}
function openFinding(fid, cx, cy){
  const F = FINDINGS[fid]; if (!F) return;
  const sub = activeSub(), st = activeState();
  const on = (st.text && (st.text[sub.id] || st.text._)) || '';
  fcard.innerHTML = `<button type="button" class="x" aria-label="Cerrar hallazgo">✕</button>
    <span class="eb">Hallazgo · ${sub.name}</span><h4 id="fTitle">${F.title}</h4><p>${F.what}</p>
    <div class="on"><b>En esta exploración</b>${on}</div>
    <p><b style="color:var(--ink)">Por qué se ve así.</b> ${F.why}</p>
    <ul>${F.teach.map(t=>`<li>${t}</li>`).join('')}</ul>
    <p style="font-size:12.5px"><b style="color:var(--ink)">Puede parecerse a:</b> ${F.mimics}</p>`;
  fcard.hidden = false;
  const w = Math.min(360, stageW - 32);
  let x = cx + 20; if (x + w > stageW - 16) x = Math.max(16, cx - w - 20);
  fcard.style.left = x + 'px'; fcard.style.top = Math.max(16, Math.min(cy - 60, stageH - fcard.offsetHeight - 16)) + 'px';
  fcard.querySelector('.x').addEventListener('click', ()=>{ fcard.hidden = true; });
  hideTip();
}
document.addEventListener('keydown', e=>{ if (e.key === 'Escape'){ if (!fcard.hidden) fcard.hidden = true; else if (S.panel) openPanel(false); } });

/* ---------- UI: rail ---------- */
const planeTag = s => s.mip ? (s.code === 60 ? 'XA' : 'MIP') : s.surface ? 'MAP' : s.spectrum ? (s.code === 9 ? 'SPEC' : 'DOP') : s.code === 30 ? 'TASK' : PLANES[s.plane].tag;
function buildRail(){
  rail.innerHTML = `<button type="button" class="crumb" data-crumb>Cómo funciona</button>` + MODS.map(m=>`
    <section class="mod" data-mod="${m.id}">
      <button class="mod-head" type="button" aria-expanded="false"><span class="abbr">${m.abbr}</span><span class="full">${m.name}</span><span class="chev" aria-hidden="true"></span></button>
      <ul class="subs">${m.subs.map(s=>`<li><button class="sub" type="button" data-sub="${s.id}"><span>${s.name}</span><span class="ptag">${planeTag(s)}</span></button></li>`).join('')}</ul>
    </section>`).join('') +
    `<div class="rail-foot"><b>Cómo usarlo</b><br>Elija un método para abrir sus comparaciones de estados cerebrales. Arrastre la lente sobre el encéfalo, arrastre el encéfalo para girarlo y desplácese para cambiar de corte. Los contornos ámbar marcan anomalías: pase el cursor y pulse sobre ellas.</div>`;
  rail.addEventListener('click', e=>{
    const head = e.target.closest('.mod-head'), sb = e.target.closest('.sub');
    if (e.target.closest('[data-crumb]')){ go(S.mod); return; }
    if (sb){ selectSub(sb.closest('.mod').dataset.mod, sb.dataset.sub, {rotate:true}); return; }
    if (head){
      const id = head.closest('.mod').dataset.mod;
      if (id === S.mod){ const sec = head.closest('.mod'); sec.classList.toggle('open'); head.setAttribute('aria-expanded', sec.classList.contains('open')); openPanel(true); return; }
      selectSub(id, S.lastSub[id] || modObj(id).subs[0].id, {rotate:true}); openPanel(true);
    }
  });
}
function syncRail(){
  rail.querySelectorAll('.mod').forEach(sec=>{
    const on = sec.dataset.mod === S.mod;
    sec.classList.toggle('active', on); sec.classList.toggle('open', on);
    sec.querySelector('.mod-head').setAttribute('aria-expanded', on);
    sec.querySelectorAll('.sub').forEach(b=>b.setAttribute('aria-current', on && b.dataset.sub === S.sub ? 'true' : 'false'));
  });
  const m = modObj();
  subbar.innerHTML = m.subs.map(s=>`<button class="chip" type="button" data-sub="${s.id}" aria-pressed="${s.id===S.sub}">${s.name}</button>`).join('');
}
subbar.addEventListener('click', e=>{ const b = e.target.closest('.chip'); if (b) selectSub(S.mod, b.dataset.sub, {rotate:true}); });

function viewPlane(plane){ const sub = activeSub(); return (sub.surface && plane === 'axial') ? 'top' : plane; }
function standardPlane(){ const st = activeState(), sub = activeSub(); if (sub.surface) return 'top'; return (st.plane && sub.code === 30) ? st.plane : sub.plane; }
function sliceFor(plane){
  const st = activeState(), sub = activeSub();
  if (sub.surface || sub.mip) return 0;
  const pl = plane === 'top' ? 'axial' : plane;
  const pb = st.posBySub && st.posBySub[sub.id];
  if (pb && pb[pl] !== undefined) return worldToSlice(plane, pb[pl]);
  if (st.pos && st.pos[pl] !== undefined) return worldToSlice(plane, st.pos[pl]);
  if (pl === sub.plane) return worldToSlice(plane, sub.at);
  return worldToSlice(plane, pl === 'axial' ? 14 : pl === 'coronal' ? -18 : -1);
}
function selectSub(modId, subId, opts={}){
  S.mod = modId; S.sub = subId; S.lastSub[modId] = subId;
  const sub = subObj();
  const remembered = S.lastState[subId];
  if (!sub.states.includes(S.state)) S.state = remembered && sub.states.includes(remembered) ? remembered : (sub.defaultState || sub.states[0]);
  if (S.sub2 === subId) S.sub2 = ALL_SUBS.find(s=>s.mod === modId && s.id !== subId && !s.surface && !s.mip && !s.spectrum)?.id || 'flair';
  fcard.hidden = true; S.hover = -1;
  syncRail(); syncHud(); buildCmpSelect();
  if (opts.rotate){ const pl = standardPlane(); animateTo(pl, sliceFor(pl)); }
  if (S.panel) renderPanel();
  resetCharts(); dirty = true;
}
function setState(key){
  S.state = key; S.lastState[S.sub] = key; fcard.hidden = true; S.hover = -1;
  const st = stObj(), sub = subObj();
  if (sub.code === 60){ S.dsaInj = st.dsaInj || 'ICA-L'; vesKey = ''; }
  if (st.plane && sub.code === 30 && st.plane !== S.plane) animateTo(st.plane, sliceFor(st.plane));
  else if (S.plane !== 'free') animateTo(S.plane, sliceFor(S.plane));
  document.querySelectorAll('#pGroups .card').forEach(c=>c.setAttribute('aria-pressed', c.dataset.state === key));
  renderFindingChips();
  syncHud(); resetCharts(); dirty = true;
}
function syncPlaneButtons(){
  const std = standardPlane(), sub = activeSub();
  const labels = sub.surface ? {axial:'Superior', coronal:'Frontal', sagittal:'Lateral'} : {axial:'Axial', coronal:'Coronal', sagittal:'Sagital'};
  if (sub.code === 60) Object.assign(labels, {coronal:'AP', sagittal:'Lateral'});
  planesEl.querySelectorAll('button').forEach(b=>{ const pl = viewPlane(b.dataset.plane); b.textContent = labels[b.dataset.plane]; b.setAttribute('aria-pressed', pl === S.plane); b.classList.toggle('std', pl === std); });
}
planesEl.addEventListener('click', e=>{ const b = e.target.closest('button'); if (!b) return; const pl = viewPlane(b.dataset.plane); animateTo(pl, sliceFor(pl)); });
$('#snapBtn').addEventListener('click', ()=>{ if (S.tab === 'lab' && LAB.snap()) return; const pl = standardPlane(); animateTo(pl, sliceFor(pl)); });
$('#findBtn').addEventListener('click', e=>{ S.findings = !S.findings; e.currentTarget.setAttribute('aria-pressed', S.findings); dirty = true; });
$('#labelBtn').addEventListener('click', e=>{ S.labels = !S.labels; e.currentTarget.setAttribute('aria-pressed', S.labels); });
$('#cmpBtn').addEventListener('click', e=>{ S.compare = !S.compare; e.currentTarget.setAttribute('aria-pressed', S.compare); syncHud(); dirty = true; });
function buildCmpSelect(){
  const sel = $('#cmpSel');
  sel.innerHTML = MODS.map(m=>`<optgroup label="${m.abbr}">${m.subs.filter(s=>!s.surface && !s.spectrum && s.code !== 60).map(s=>`<option value="${s.id}" ${s.id===S.sub2?'selected':''}>${s.name}</option>`).join('')}</optgroup>`).join('');
}
$('#cmpSel').addEventListener('change', e=>{ S.sub2 = e.target.value; syncHud(); dirty = true; });

function syncHud(){
  const sub = activeSub(), st = activeState(), m = modObj(sub.mod);
  $('#nowMod').textContent = S.tab === 'lab' ? 'Laboratorio cerebral' : m.abbr;
  const hideDx = S.caseMode && !S.caseMode.revealed;
  $('#nowSub').textContent = S.tab === 'lab' ? LAB.subtitle() : sub.name + ' · ' + (hideDx ? 'Caso ' + String(S.caseMode.c.id).padStart(2, '0') + ' · diagnóstico oculto' : st.name);
  sliceWrap.classList.toggle('mip', !!(sub.mip || sub.surface));
  sliceWrap.hidden = S.tab === 'lab' && S.labScan === 'none'; $('#snapBtn').hidden = S.tab === 'lab';
  syncPlaneButtons();
  const cmpOn = S.compare && S.tab === 'scans' && VIEW === 'scans' && !sub.surface;
  glassEl.classList.toggle('split', cmpOn); $('#cmpWrap').hidden = !cmpOn;
  $('#gL1').textContent = sub.name; $('#gL2').textContent = subById(S.sub2).name;
  let lg = '';
  if (sub.code === 20) lg = `<span>SUV</span><span class="ramp" style="background:linear-gradient(90deg,#000,#b40000,#ff7a00,#ffd000,#fff)"></span><span>high</span>`;
  else if (sub.code === 22 || sub.code === 23 || sub.code === 8) lg = `<span>low</span><span class="ramp" style="background:linear-gradient(90deg,#000,#1a2cff,#00c8ff,#3dff6a,#ffe600,#ff3a00)"></span><span>high</span>`;
  else if (sub.code === 21) lg = `<span>SUVR</span><span class="ramp" style="background:linear-gradient(90deg,#000,#fff)"></span><span>high</span>`;
  else if (sub.code === 6) lg = `<span class="key"><span><i style="background:#e5484d"></i>L–R</span><span><i style="background:#3fbf5f"></i>A–P</span><span><i style="background:#4a7dff"></i>S–I</span></span>`;
  else if (sub.code === 30) lg = `<span>z</span><span class="ramp" style="background:linear-gradient(90deg,#dc1a0a,#ff8a20,#fff26a)"></span><span>8</span>`;
  else if (sub.code === 40 || sub.code === 41) lg = `<span>${sub.code === 40 ? '−µV' : 'dentro'}</span><span class="ramp" style="background:linear-gradient(90deg,#2154bf,#f4f4f6,#c72629)"></span><span>${sub.code === 40 ? '+µV' : 'fuera'}</span>`;
  else if (sub.code === 51) lg = `<span class="key"><span><i style="background:#f23a20"></i>hacia el transductor</span><span><i style="background:#2659f2"></i>alejándose</span></span>`;
  else if (sub.win && (sub.code >= 10 && sub.code < 20)) lg = `<span>${sub.win}</span>`;
  legendEl.innerHTML = lg; legendEl.hidden = !lg || S.tab === 'lab';
  const showScanBtns = S.tab === 'scans';
  for (const id of ['#findBtn','#labelBtn','#cmpBtn','#statesBtn','#shareBtn']) if ($(id)) $(id).hidden = !showScanBtns || (!!S.caseMode && id !== '#labelBtn');
  glassEl.hidden = !glassVisible();
  setupChart();
  updateAnnotations();
}
function oriLetter(v){
  const ax = [['L','R'],['P','A'],['I','S']];
  const order = [0,1,2].sort((i,j)=>Math.abs(v[j]) - Math.abs(v[i]));
  let s = ax[order[0]][v[order[0]] > 0 ? 1 : 0];
  if (Math.abs(v[order[1]]) > 0.35) s += ax[order[1]][v[order[1]] > 0 ? 1 : 0];
  return s;
}
function sliceLabel(){
  const sub = activeSub();
  if (sub.surface) return 'Superficie del cuero cabelludo';
  if (sub.mip) return sub.code === 60 ? (S.plane === 'sagittal' ? 'Proyección lateral' : S.plane === 'coronal' ? 'Proyección AP' : 'Proyección') : 'MIP de volumen completo';
  const [, , f] = basisQ(S.q); const P0 = v3.add(TARGET, v3.mul(f, S.slice));
  if (S.plane === 'free') return `Oblicuo ${S.slice.toFixed(1)} mm`;
  const P = PLANES[S.plane], w = v3.dot(P.axis, P0);
  const L = {axial:['I','S'], top:['I','S'], coronal:['P','A'], sagittal:['L','R']}[S.plane];
  return `${L[w >= 0 ? 1 : 0]} ${Math.abs(w).toFixed(1)} mm`;
}
function updateAnnotations(){
  if (!META) return;
  const sub = activeSub(), st = activeState(), m = modObj(sub.mod);
  const [r,u] = basisQ(S.q);
  $('#oR').textContent = oriLetter(r); $('#oL').textContent = oriLetter(v3.mul(r,-1));
  $('#oT').textContent = oriLetter(u); $('#oB').textContent = oriLetter(v3.mul(u,-1));
  const sl = sliceLabel(); sliceOut.textContent = sl;
  const planeTxt = sub.surface ? 'SURF' : sub.mip ? (sub.code === 60 ? 'XA' : 'MIP') : (S.plane === 'free' ? 'OBL' : PLANES[S.plane].tag);
  $('#gTL').innerHTML = `<span class="hi">${sub.label} · ${sub.seq}</span><span class="x"><br>${sub.params}<br>${sub.vox}</span>`;
  $('#gTR').innerHTML = (S.caseMode && !S.caseMode.revealed) ? `<span class="x">COLIN 27 · ADULTO<br></span>Caso ${String(S.caseMode.c.id).padStart(2, '0')}<span class="x"><br>Desconocido</span>` : `<span class="x">COLIN 27 · ADULTO<br></span>${st.name}<span class="x"><br>${st.tag}</span>`;
  const px = (Math.min(stageW, stageH)/2)/(TAN*(DIST + S.slice)), bar = Math.round(20*px);
  $('#gBL').innerHTML = `${planeTxt} · ${sl}${sub.surface ? '' : `<div class="g-scale"><i style="width:${bar}px"></i>2 cm</div>`}`;
  $('#gBR').innerHTML = `${sub.win}<br>${m.abbr}`;
}

/* ---------- states panel ---------- */
function openPanel(on){
  S.panel = on; panel.classList.toggle('open', on); panel.setAttribute('aria-hidden', !on);
  statesBtn.setAttribute('aria-expanded', on); statesBtn.textContent = on ? 'Ocultar estados' : 'Estados cerebrales';
  if (on) renderPanel();
}
statesBtn.addEventListener('click', ()=>openPanel(!S.panel));
$('#pClose').addEventListener('click', ()=>openPanel(false));
const CAT_NAMES = {disease:'Enfermedad y lesión', physio:'Estados fisiológicos', task:'Tareas y redes'};
function renderPanel(){
  const m = modObj(), sub = subObj();
  $('#pEyebrow').textContent = m.abbr; $('#pTitle').textContent = m.name; $('#pHow').textContent = m.how;
  $('#pSubs').innerHTML = m.subs.map(s=>`<button class="chip" type="button" data-sub="${s.id}" aria-pressed="${s.id===S.sub}">${s.name}</button>`).join('');
  const std = sub.surface ? 'Mostrado en el cuero cabelludo' : sub.mip ? (sub.code === 60 ? 'Proyección: AP o lateral' : 'Proyección de máxima intensidad') : sub.code === 30 ? 'El plano sigue la tarea' : `Plano estándar: ${PLANES[sub.plane].name}`;
  $('#pSeq').innerHTML = `<span class="k">${sub.seq} · ${sub.params}</span><span class="k">${std}</span><p>${sub.note}</p>`;
  const groups = {};
  for (const k of sub.states){ const c = STATES[k].cat || 'disease'; (groups[c] = groups[c] || []).push(k); }
  let html = '<div id="findChips"></div>';
  for (const c of ['disease','physio','task']){
    if (!groups[c]) continue;
    html += `<h3 class="p-h3"><span style="font-weight:600;letter-spacing:.12em;text-transform:uppercase">${CAT_NAMES[c]}</span><span>${c === 'task' ? 'mismo sujeto' : 'misma exploración, pacientes distintos'}</span></h3><div class="cards">` +
      groups[c].map(k=>{ const st = STATES[k], key = sub.id + '|' + k, fd = (st.text && (st.text[sub.id] || st.text._)) || '';
        return `<button class="card" type="button" data-state="${k}" aria-pressed="${k===S.state}"><canvas width="${TH}" height="${TH}" data-key="${key}" aria-hidden="true"></canvas><span class="meta"><span class="nm">${st.name}</span><span class="tg">${st.tag}</span><span class="fd">${fd}</span></span></button>`; }).join('') + '</div>';
  }
  $('#pGroups').innerHTML = html;
  renderFindingChips();
  thumbQueue = [];
  sub.states.forEach(k=>{ const key = sub.id + '|' + k; if (thumbCache.has(key)) paintThumb(key); else thumbQueue.push({key, sub, state:k}); });
}
function renderFindingChips(){
  const el = $('#findChips'); if (!el) return;
  const sub = subObj(), st = stObj();
  const ids = [...new Set(stateLesions(st, sub).filter(l=>lesionVisible(l, sub)).map(l=>l.f))];
  if (st.noFlow && ['hmpao','cta','dsa','asl'].includes(sub.id)) ids.push('nofill');
  el.innerHTML = ids.length ? `<h3 class="p-h3" style="margin-top:0"><span style="font-weight:600;letter-spacing:.12em;text-transform:uppercase">Hallazgos en esta exploración</span></h3><div class="p-subs">${ids.map(f=>`<button class="chip fd" type="button" data-f="${f}">${FINDINGS[f].title}</button>`).join('')}</div>` : '';
}
$('#pSubs').addEventListener('click', e=>{ const b = e.target.closest('.chip'); if (b) selectSub(S.mod, b.dataset.sub, {rotate:true}); });
$('#pGroups').addEventListener('click', e=>{
  const c = e.target.closest('.card'); if (c){ setState(c.dataset.state); return; }
  const f = e.target.closest('[data-f]'); if (f){ const g = S.glass; openFinding(f.dataset.f, g.x + g.size*0.6, g.y + 40); }
});

/* ---------- tabs ---------- */
function setTab(t){
  if (!ready) return;
  S.tab = t;
  rail.hidden = t !== 'scans'; subbar.hidden = t !== 'scans'; $('#labRail').hidden = t !== 'lab'; $('#labPanel').hidden = t !== 'lab';
  if (t === 'lab'){ openPanel(false); fcard.hidden = true; hideTip(); LAB.enter(); } else LAB.leave();
  canvas.classList.toggle('pointing', t === 'lab'); updateShift();
  vesKey = ''; syncHud(); resetCharts(); dirty = true;
}


/* 2D reference preview for browsers that cannot initialize the WebGL brain renderer. */
const compatCanvas = $('#brainPreview');
let fallbackReady = false;
let compatCtx = compatCanvas.getContext('2d', {alpha:true});
const compatSliceCache = new Map();

function setPreviewNotice(message, details=''){
  const notice = $('#compatNotice');
  if (!notice) return;
  $('#compatMessage').textContent = message;
  $('#compatDetails').textContent = details;
  $('#compatDetailsWrap').hidden = !details;
  notice.hidden = false;
}

function resizeCompatibilityPreview(w, h){
  if (compatCanvas.width !== w) compatCanvas.width = w;
  if (compatCanvas.height !== h) compatCanvas.height = h;
}

async function loadCompatibilityPreview(details){
  sliceAvailable = false;
  compatCanvas.hidden = false;
  if (stage) stage.prepend(compatCanvas);
  canvas.style.opacity = '0';
  canvas.style.pointerEvents = 'none';
  $('#hint').textContent = 'Elija Axial, Coronal o Sagital; utilice el control de corte para recorrer la anatomía de referencia.';
  setPreviewNotice(
    gl
      ? 'El renderizador GPU del encéfalo no pudo iniciarse. Se muestran tres cortes T1 de referencia.'
      : 'WebGL 2 no está disponible en esta vista previa. Se muestran tres cortes T1 de referencia.',
    details
  );
  $('#loadMsg').textContent = 'Cargando el encéfalo de referencia';
  $('#loadPct').textContent = '0%';
  $('#loadSub').textContent = 'Vista previa de compatibilidad · tres cortes T1 ortogonales';

  const metaResponse = await fetch('data/meta.json');
  if (!metaResponse.ok) throw new Error(`data/meta.json ${metaResponse.status}`);
  META = await metaResponse.json();
  const packed = await fetchBin('data/vol.png', got=>{
    const fraction = Math.min(1, got / META.bytes.vol);
    $('#loadBar').style.width = (fraction*100).toFixed(1) + '%';
    $('#loadPct').textContent = Math.round(fraction*100) + '%';
    onLoadProgress(fraction);
  });
  const [w,h,d] = META.dims, voxels = w*h*d, firstVolumeBytes = voxels*4;
  if (packed.byteLength < firstVolumeBytes) throw new Error('El volumen de referencia es más corto que las dimensiones de sus metadatos.');
  VOL = {A:packed.slice(0, firstVolumeBytes), dims:META.dims, lo:META.lo};
  compatSliceCache.clear();
  fallbackReady = true;
  $('#loading').classList.add('gone');
  $('#loading').style.display = 'none';
  setTimeout(()=>$('#loading').remove(), 600);
  $('#heroLoad').classList.add('done');
  $('#heroLoadMsg').textContent = 'Vista previa de referencia lista';
  onReady();
  dirty = true;
}

function compatPlanePosition(plane){
  const [w,h,d] = META.dims, lo = META.lo;
  const activePlane = S.plane === 'top' ? 'axial' : S.plane;
  const offset = activePlane === plane ? S.slice : 0;
  if (plane === 'axial') return Math.max(0, Math.min(d-1, Math.round(TARGET[2] + offset + 72) - lo[2]));
  if (plane === 'coronal') return Math.max(0, Math.min(h-1, Math.round(TARGET[1] - offset + 126) - lo[1]));
  return Math.max(0, Math.min(w-1, Math.round(90 - TARGET[0] - offset) - lo[0]));
}

function compatibilitySlice(plane, index){
  const [w,h,d] = META.dims;
  const dims = plane === 'axial' ? [w,h] : plane === 'coronal' ? [w,d] : [h,d];
  const key = `${plane}:${index}`;
  if (compatSliceCache.has(key)) return compatSliceCache.get(key);
  const [sw,sh] = dims, image = compatCtx.createImageData(sw,sh), pixels = image.data, A = VOL.A;
  for (let y=0; y<sh; y++) for (let x=0; x<sw; x++){
    let i,j,k;
    if (plane === 'axial'){ i=x; j=h-1-y; k=index; }
    else if (plane === 'coronal'){ i=x; j=index; k=d-1-y; }
    else { i=w-1-index; j=h-1-x; k=d-1-y; }
    const src = ((k*h+j)*w+i)*4, dst = (y*sw+x)*4;
    const tissue = A[src+1] + A[src+2] + A[src+3];
    if (tissue < 8) continue;
    const gray = Math.max(14, Math.min(248, Math.round(18 + 230*Math.pow(A[src]/255, .82))));
    pixels[dst] = gray;
    pixels[dst+1] = Math.min(250, gray+2);
    pixels[dst+2] = Math.min(255, gray+5);
    pixels[dst+3] = Math.min(255, Math.round(tissue*2.5));
  }
  const tile = document.createElement('canvas');
  tile.width = sw; tile.height = sh;
  tile.getContext('2d').putImageData(image,0,0);
  compatSliceCache.set(key,tile);
  if (compatSliceCache.size > 18) compatSliceCache.delete(compatSliceCache.keys().next().value);
  return tile;
}

function renderCompatibilityPreview(){
  if (!fallbackReady || !compatCtx) return;
  const scale = compatCanvas.width/stageW;
  compatCtx.setTransform(scale,0,0,scale,0,0);
  compatCtx.clearRect(0,0,stageW,stageH);
  const activePlane = S.plane === 'top' ? 'axial' : ['axial','coronal','sagittal'].includes(S.plane) ? S.plane : 'axial';
  const panes = stageW < 640
    ? [{key:activePlane, title:activePlane.toUpperCase()}]
    : [{key:'axial',title:'AXIAL'},{key:'coronal',title:'CORONAL'},{key:'sagittal',title:'SAGITAL'}];
  const gap = 12;
  const cardW = stageW < 640 ? Math.min(420,stageW-32) : Math.min(300,(stageW-48-gap*2)/3);
  const chartVisible = !$('#chart').hidden;
  const cardH = chartVisible
    ? Math.min(stageW < 640 ? 230 : 270,Math.max(170,stageH-260))
    : Math.min(stageW < 640 ? 430 : 360,stageH-150);
  const totalW = panes.length*cardW + (panes.length-1)*gap;
  const x0 = (stageW-totalW)/2, y0 = chartVisible ? 66 : Math.max(64,(stageH-cardH)/2+8);

  compatCtx.textAlign='center';
  compatCtx.fillStyle='#0c161b';
  compatCtx.font='600 13px system-ui, sans-serif';
  compatCtx.fillText(stageW < 640 ? `${activePlane.toUpperCase()} · T1` : 'COLIN 27 · CORTES T1 DE REFERENCIA',stageW/2,y0-22);
  compatCtx.fillStyle='#76858c';
  compatCtx.font='11px system-ui, sans-serif';
  compatCtx.fillText('Anatomía de referencia · ' + (gl ? 'el renderizador 3D falló en este dispositivo (abra una pestaña de exploración → Detalles del renderizador)' : 'esta vista no proporcionó WebGL 2 (pruebe a abrir la página en su propia pestaña del navegador)'),stageW/2,y0-6);

  const indices = {axial:compatPlanePosition('axial'),coronal:compatPlanePosition('coronal'),sagittal:compatPlanePosition('sagittal')};
  const [w,h,d] = META.dims, lo=META.lo;
  const coordinates = {
    axial:`S ${indices.axial+lo[2]-72} mm`,
    coronal:`A ${indices.coronal+lo[1]-126} mm`,
    sagittal:`R ${90-indices.sagittal-lo[0]} mm`
  };
  panes.forEach((pane,n)=>{
    const x=x0+n*(cardW+gap), y=y0, tile=compatibilitySlice(pane.key,indices[pane.key]);
    compatCtx.fillStyle='rgba(255,255,255,.94)'; compatCtx.fillRect(x,y,cardW,cardH);
    compatCtx.strokeStyle='#d2d9dc'; compatCtx.lineWidth=1; compatCtx.strokeRect(x+.5,y+.5,cardW-1,cardH-1);
    compatCtx.textAlign='left'; compatCtx.fillStyle='#0c161b'; compatCtx.font='600 10px ui-monospace,monospace';
    compatCtx.fillText(pane.title,x+10,y+17);
    compatCtx.textAlign='right'; compatCtx.fillStyle='#76858c'; compatCtx.font='10px ui-monospace,monospace';
    compatCtx.fillText(coordinates[pane.key],x+cardW-10,y+17);
    const pad=10, top=y+27, availW=cardW-pad*2, availH=cardH-38;
    const fit=Math.min(availW/tile.width,availH/tile.height);
    const iw=tile.width*fit, ih=tile.height*fit, ix=x+(cardW-iw)/2, iy=top+(availH-ih)/2;
    compatCtx.fillStyle='#04070a'; compatCtx.fillRect(ix,iy,iw,ih);
    compatCtx.imageSmoothingEnabled=true; compatCtx.imageSmoothingQuality='high';
    compatCtx.drawImage(tile,ix,iy,iw,ih);
  });
}

/* =====================================================================
   Live charts: BOLD, EEG, MEG, MRS, TCD, DSA timeline; plus overlay markers.
   ===================================================================== */
const PERIOD = 30, BDT = 0.25;
const BOLD = (()=>{
  const kern = []; for (let t = 0; t < 32; t += BDT) kern.push(t <= 0 ? 0 : Math.pow(t,5)*Math.exp(-t)/120 - Math.pow(t,15)*Math.exp(-t)/1.307674368e12/6);
  const N = PERIOD/BDT, arr = new Float32Array(N);
  for (let j = 0; j < N; j++){ let s = 0; for (let i = 0; i < kern.length; i++){ const tt = (((j - i)*BDT)%PERIOD + PERIOD)%PERIOD; s += kern[i]*(tt < 15 ? 1 : 0); } arr[j] = s; }
  let mn = Infinity, mx = -Infinity; arr.forEach(v=>{mn=Math.min(mn,v);mx=Math.max(mx,v);});
  return arr.map(v=>(v - mn)/(mx - mn));
})();
function boldAt(t){ return BOLD[Math.floor((((t%PERIOD)+PERIOD)%PERIOD)/BDT)]; }

/* ---------- EEG generator model ---------- */
const MONTAGE = [['Fp1','F7'],['F7','T7'],['T7','P7'],['P7','O1'],['Fp2','F8'],['F8','T8'],['T8','P8'],['P8','O2'],['Fp1','F3'],['F3','C3'],['C3','P3'],['P3','O1'],['Fp2','F4'],['F4','C4'],['C4','P4'],['P4','O2'],['Fz','Cz'],['Cz','Pz']];
const g1 = (t, c, w) => Math.exp(-(((t - c)/w)**2));
const nz = (t, k) => Math.sin(t*7.31 + k*1.7) + 0.7*Math.sin(t*13.7 + k*3.1) + 0.5*Math.sin(t*23.3 + k*0.7) + 0.4*Math.sin(t*41.9 + k*2.3);
function eegSources(key, t){
  const E = META.landmarks.electrodes, out = [];
  const src = (n, a, s=48) => out.push({p:E[n], s, a});
  const sn = (f, ph=0) => Math.sin(2*Math.PI*f*t + ph);
  switch (key){
    case 'alpha': { const env = 0.62 + 0.38*Math.sin(2*Math.PI*0.21*t); const a = 46*env*sn(10.1); src('O1', a); src('O2', a*0.93); src('Pz', a*0.55, 55); src('Fz', 5*sn(19.5)); break; }
    case 'beta': { src('Fz', 6*sn(19.3) + 4*sn(23.1, 1)); src('Cz', 5*sn(17.2, 2)); src('O1', 7*sn(10.1)*0.25 + 4*nz(t, 2)); src('O2', 4*nz(t, 3));
      const bt = t % 4.2; const blink = 160*g1(bt, 0.25, 0.09)*(bt < 0.6 ? 1 : 0); src('Fp1', blink, 30); src('Fp2', blink, 30); break; }
    case 'n1': { src('Cz', 18*sn(5.6) + 8*nz(t, 1), 75); const vt = t % 2.8; src('Cz', -75*g1(vt, 0.5, 0.06) + 30*g1(vt, 0.66, 0.08), 45); break; }
    case 'n2': { src('Cz', 16*sn(5.1) + 9*nz(t, 4), 80);
      const sp = t % 5.3; const env = sp < 1.0 ? Math.sin(Math.PI*sp)**2 : 0; src('Cz', 28*env*sn(13.2), 55); src('C3', 18*env*sn(13.2), 40); src('C4', 18*env*sn(13.2), 40);
      const kt = t % 9.1; src('Fz', -115*g1(kt, 3.2, 0.14) + 60*g1(kt, 3.65, 0.22), 70); break; }
    case 'n3': { src('Fz', 85*sn(0.92) + 40*sn(1.6, 1) + 10*nz(t, 5), 85); src('Pz', 30*sn(0.92, 0.6), 70); break; }
    case 'rem': { src('Cz', 11*nz(t*0.6, 1) + 6*sn(6.3), 80); const sw = (t % 6) < 1.6 ? 1 : 0; src('Cz', sw*24*(((t*2.6)%1) - 0.5)*2, 50);
      const sac = Math.sign(Math.sin(t*1.9) + 0.4*Math.sin(t*4.7)); src('F7', 70*sac, 28); src('F8', -70*sac, 28); src('Fp1', 30*sac, 26); src('Fp2', -30*sac, 26); break; }
    case 'anaes': { const fa = 34*sn(10.4); src('Fz', fa, 50); src('F3', fa*0.8, 40); src('F4', fa*0.8, 40); src('Cz', 60*sn(0.7) + 10*nz(t, 6), 90); break; }
    case 'burst': { const bt = t % 5.4; const on = bt < 1.5 ? Math.sin(Math.PI*bt/1.5) : 0; src('Cz', on*(85*sn(1.7) + 40*sn(5.2, 1) + 30*nz(t*2, 3)), 90); src('Fz', on*50*sn(3.3, 2), 60); src('Cz', 1.5*nz(t, 9), 90); break; }
    case 'absence': { const ct = t % 14; const on = ct > 3 && ct < 9;
      if (on){ const ph = ((ct - 3)*3) % 1; const w = -1.7*g1(ph, 0.08, 0.035) + 0.45*g1(ph, 0.22, 0.07) - 0.95*g1(ph, 0.58, 0.16); src('Fz', 150*w, 80); src('Cz', 120*w, 70); src('Pz', 70*w, 60); }
      else { const a = 32*sn(10.1); src('O1', a); src('O2', a); } break; }
    case 'focal': { const ct = t % 24;
      if (ct < 4){ const a = 30*sn(10.1); src('O1', a); src('O2', a); }
      else if (ct < 18){ const k = (ct - 4)/14; const f = 7 - 3*k; const amp = 20 + 110*Math.min(1, k*1.4); const ph = 2*Math.PI*(7*(ct-4) - 1.5*(ct-4)*(ct-4)/14);
        src('T7', amp*Math.sin(ph), 38); src('F7', amp*0.7*Math.sin(ph), 34); src('P7', amp*0.55*Math.sin(ph), 34);
        if (k > 0.45){ src('C3', amp*0.5*(k - 0.45)*2*Math.sin(ph + 0.4), 45); src('F3', amp*0.4*(k - 0.45)*2*Math.sin(ph + 0.3), 45); } }
      else { src('T7', 60*sn(1.0), 50); src('F7', 35*sn(1.0), 40); } break; }
    case 'uws': { src('Cz', 22*sn(3.8) + 30*sn(1.4, 1) + 6*nz(t, 2), 90); break; }
    case 'bd': default: break;
  }
  return out;
}
function eegElectrodes(key, t){
  const E = META.landmarks.electrodes, names = Object.keys(E), srcs = eegSources(key, t), V = {};
  names.forEach((n, k) => { let v = 0; for (const s of srcs){ const d = v3.sub(E[n], s.p); v += s.a*Math.exp(-v3.dot(d,d)/(2*s.s*s.s)); } v += (key === 'bd' ? 0.6 : 2.2)*nz(t*1.3, k + 1); V[n] = v; });
  return V;
}
let eegBuf = null, eegT = 0;
const EEG_FS = 128, EEG_WIN = 10;
function eegTick(key){
  if (!META?.landmarks?.electrodes) return;
  const N = EEG_FS*EEG_WIN;
  if (!eegBuf) { eegBuf = MONTAGE.map(()=>new Float32Array(N)); eegT = simT - EEG_WIN; for (let i = 0; i < N; i++){ const V = eegElectrodes(key, eegT + i/EEG_FS); MONTAGE.forEach((m, c)=>{ eegBuf[c][i] = V[m[0]] - V[m[1]]; }); } eegT = simT; eegBuf.head = 0; }
  while (eegT < simT){ const V = eegElectrodes(key, eegT); const h = eegBuf.head; MONTAGE.forEach((m, c)=>{ eegBuf[c][h] = V[m[0]] - V[m[1]]; }); eegBuf.head = (h + 1) % N; eegT += 1/EEG_FS; }
  surfaceState.src = eegSources(key, simT).map(s=>({p:s.p, s:s.s*1.15, a:s.a/55}));
}
function drawEEG(ctx, W, H, key, nch, thumb){
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = CH.bg; ctx.fillRect(0, 0, W, H);
  const chans = thumb ? [3, 7, 11, 15, 16, 1, 5, 9].slice(0, nch) : MONTAGE.map((_, i)=>i);
  const lw = thumb ? 0 : 54, rows = chans.length, rh = (H - 14)/rows, scale = rh/(thumb ? 140 : 120);
  ctx.strokeStyle = CH.grid; ctx.lineWidth = 1;
  for (let s = 1; s < 10; s++){ const x = lw + (W - lw)*s/10; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H - 14); ctx.stroke(); }
  ctx.font = `${thumb ? 14 : 15}px "Azeret Mono", monospace`;
  chans.forEach((c, r) => {
    const y0 = rh*(r + 0.5);
    if (!thumb){ ctx.fillStyle = CH.muted; ctx.fillText(MONTAGE[c][0] + '-' + MONTAGE[c][1], 2, y0 + 5); }
    ctx.strokeStyle = c >= 16 ? CH.acc : (c % 8 < 4 ? CH.ink : CH.ink2); ctx.lineWidth = thumb ? 1.4 : 1.2; ctx.beginPath();
    const N = thumb ? 640 : EEG_FS*EEG_WIN;
    for (let i = 0; i < N; i += thumb ? 1 : 1){
      let v;
      if (thumb){ const t = 3 + i*5/N; const V = eegElectrodes(key, t); v = V[MONTAGE[c][0]] - V[MONTAGE[c][1]]; }
      else v = eegBuf[c][(eegBuf.head + i) % N];
      const x = lw + (W - lw)*i/N, y = y0 - v*scale;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  });
  if (!thumb){ ctx.fillStyle = CH.muted; ctx.fillText('1 s', W - 34, H - 2); ctx.fillText('100 µV', lw + 4, H - 2); ctx.fillText('negativo arriba', W - 160, H - 2); }
}

/* ---------- MEG ---------- */
function megDipoles(key, t){
  switch (key){
    case 'alpha': { const a = (0.6 + 0.4*Math.sin(2*Math.PI*0.21*t))*Math.sin(2*Math.PI*10.1*t); return [{p:[-14,-92,10], q:[0,0,1], a:a*1.1}, {p:[16,-92,10], q:[0,0,1], a:a}]; }
    case 'aep': { const tau = t % 1.2; const r = 0.3*g1(tau, 0.05, 0.012) - 1.0*g1(tau, 0.1, 0.022) + 0.4*g1(tau, 0.19, 0.03); return [{p:[-48,-22,8], q:[0,0,1], a:r}, {p:[50,-20,8], q:[0,0,1], a:r*0.95}]; }
    case 'sep': { const tau = t % 0.8; const r = -1.0*g1(tau, 0.02, 0.004) + 0.6*g1(tau, 0.035, 0.007) - 0.3*g1(tau, 0.06, 0.01); return [{p:[-38,-27,54], q:[0,1,0], a:r*1.2}]; }
    case 'spike': { const tau = t % 2.5; const r = -1.2*g1(tau, 0.3, 0.025) + 0.5*g1(tau, 0.4, 0.08); return [{p:[-50,-8,-18], q:[0,0,1], a:r}]; }
  }
  return [];
}
let megSensors = null;
function megField(dips, p){ const n = v3.norm(v3.sub(p, [0,-18,5])); let b = 0; for (const d of dips){ const r = v3.sub(p, d.p), L = v3.len(r); b += v3.dot(v3.cross(d.q, r), n)/(L*L*L)*d.a; } return b*9000; }
function ensureSensors(){
  if (!META?.landmarks?.electrodes) return;
  if (megSensors) return; const E = META.landmarks.electrodes, c = [0,-18,5]; megSensors = [];
  const names = Object.keys(E);
  for (const n of names) megSensors.push(v3.add(E[n], v3.mul(v3.norm(v3.sub(E[n], c)), 18)));
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++){ const a = E[names[i]], b = E[names[j]]; if (v3.len(v3.sub(a, b)) < 62){ const m = v3.mul(v3.add(a, b), 0.5); megSensors.push(v3.add(c, v3.mul(v3.norm(v3.sub(m, c)), v3.len(v3.sub(a, c)) + 18))); } }
}
let megBuf = null;
function megTick(key){
  if (!META?.landmarks?.electrodes) return;
  ensureSensors(); const N = 512, win = 2.0;
  if (!megBuf){ megBuf = megSensors.map(()=>new Float32Array(N)); megBuf.head = 0; megBuf.t = simT - win; }
  while (megBuf.t < simT){ const d = megDipoles(key, megBuf.t); megSensors.forEach((s, k)=>{ megBuf[k][megBuf.head] = megField(d, s); }); megBuf.head = (megBuf.head + 1) % N; megBuf.t += win/N; }
  const peak = {aep:0.1, sep:0.02, spike:0.3}[key];
  const tt = peak !== undefined ? peak : simT, pulse = peak !== undefined ? 0.85 + 0.15*Math.sin(simT*3) : 1;
  surfaceState.dip = megDipoles(key, tt).map(d=>({p:d.p, q:d.q, a:d.a*7000*pulse}));
}
function drawMEG(ctx, W, H, key, thumb){
  ensureSensors(); ctx.clearRect(0, 0, W, H); ctx.fillStyle = CH.bg; ctx.fillRect(0, 0, W, H);
  const N = 512, y0 = H*0.5, sc = H*0.36;
  ctx.strokeStyle = CH.axis; ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y0); ctx.stroke();
  megSensors.forEach((s, k) => {
    ctx.strokeStyle = `hsla(${200 + (k*29)%90},60%,${30 + (k*13)%30}%,.5)`; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i < N; i++){
      const v = thumb ? megField(megDipoles(key, 1 + i*2/N), s) : megBuf[k][(megBuf.head + i) % N];
      const x = W*i/N, y = y0 - Math.max(-1.4, Math.min(1.4, v))*sc; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  });
  if (!thumb){ ctx.fillStyle = CH.muted; ctx.font = '15px "Azeret Mono", monospace'; ctx.fillText(`${megSensors.length} sensores · gráfico en mariposa · 2 s` + (key !== 'alpha' ? ' · el mapa de cuero cabelludo muestra el pico' : ''), 6, H - 6); }
}

/* ---------- MRS ---------- */
function drawMRS(ctx, W, H, key, thumb){
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = CH.bg; ctx.fillRect(0, 0, W, H);
  const peaks = MRS[key] || MRS.normal, x = ppm => (4.2 - ppm)/(4.2 - 0.5)*(W - 20) + 10, base = H - (thumb ? 26 : 34), sc = (H - 70)*0.82;
  ctx.strokeStyle = CH.axis; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(10, base); ctx.lineTo(W - 10, base); ctx.stroke();
  ctx.fillStyle = CH.muted; ctx.font = `${thumb ? 13 : 14}px "Azeret Mono", monospace`;
  for (const t of [4, 3, 2, 1]) { ctx.fillText(t.toFixed(0), x(t) - 4, base + 16); }
  if (!thumb) ctx.fillText('ppm', W - 40, base + 16);
  ctx.strokeStyle = CH.ink; ctx.lineWidth = thumb ? 1.6 : 1.6; ctx.beginPath();
  let seed = 7; const rn = () => { seed = (seed*16807) % 2147483647; return seed/2147483647 - 0.5; };
  for (let i = 0; i <= 600; i++){
    const ppm = 4.2 - i*(3.7/600); let v = 0;
    for (const [c, h, w] of peaks) v += h/(1 + ((ppm - c)/w)**2);
    v += rn()*0.03;
    const px = x(ppm), py = base - v*sc; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
  if (!thumb){ ctx.fillStyle = CH.acc; for (const [c, nm] of MRS_LABELS){ const pk = peaks.find(p=>Math.abs(p[0] - c) < 0.08); if (!pk || pk[1] < 0.12) continue; const v = peaks.reduce((s,[cc,h,w])=>s + h/(1 + ((c - cc)/w)**2), 0); ctx.fillText(nm, x(c) - 12, base - v*sc - 8); } }
}

/* ---------- TCD ---------- */
function tcdVel(key, t){
  const P = TCD[key] || TCD.normal, ph = (((t % 0.85) + 0.85) % 0.85)/0.85;
  if (P.osc) return P.psv*g1(ph, 0.12, 0.06) + P.edv*g1(ph, 0.5, 0.2);
  if (!P.psv) return 0;
  const sys = g1(ph, 0.12, 0.07) + 0.35*g1(ph, 0.32, 0.06);
  return P.edv + (P.psv - P.edv)*Math.min(1, sys + (1 - ph)*0.12*(ph > 0.4 ? 1 : 0));
}
function drawTCD(ctx, W, H, key, thumb){
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = CH.bg; ctx.fillRect(0, 0, W, H);
  const P = TCD[key] || TCD.normal, base = H*0.68, sc = (H*0.6)/250, win = thumb ? 3 : 4, t1 = thumb ? 3 : simT;
  ctx.strokeStyle = CH.axis; ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(W, base); ctx.stroke();
  for (let i = 0; i < W; i += 2){
    const t = t1 - win + win*i/W, v = tcdVel(key, t), h = v*sc;
    const grd = ctx.createLinearGradient(0, base, 0, base - h);
    grd.addColorStop(0, 'rgba(12,22,27,.06)'); grd.addColorStop(0.75, 'rgba(12,22,27,.4)'); grd.addColorStop(1, 'rgba(12,22,27,.92)');
    ctx.fillStyle = grd; ctx.fillRect(i, Math.min(base, base - h), 2, Math.abs(h));
  }
  ctx.fillStyle = CH.muted; ctx.font = `${thumb ? 13 : 14}px "Azeret Mono", monospace`;
  if (!P.psv){ ctx.fillText('No se detecta flujo', 10, base - 30); return; }
  const mfv = P.osc ? 0 : (P.psv + 2*P.edv)/3, pi = P.osc ? 0 : (P.psv - P.edv)/mfv;
  if (!thumb){ ctx.fillText(P.osc ? 'Flujo oscilante · neto anterógrado ≈ 0' : `PSV ${P.psv}  EDV ${P.edv}  MFV ${mfv.toFixed(0)} cm/s  PI ${pi.toFixed(2)}`, 8, H - 8); ctx.fillText('100', 4, base - 100*sc + 4); }
}

/* ---------- chart card wiring ---------- */
const chartCtx = chartCv.getContext('2d');
function setupChart(){
  const sub = activeSub(), st = activeState();
  let show = S.tab === 'scans' || (S.tab === 'lab' && S.labScan === 'fmri');
  let title = '', subt = '', chips = '';
  if (sub.code === 30){ title = 'Señal BOLD · ' + (st.roi || 'ROI'); subt = st.yeoAct ? 'fluctuación en reposo' : 'diseño de bloques 15 s encendido/apagado'; }
  else if (sub.code === 40){ title = 'EEG · bipolar longitudinal'; subt = st.name; }
  else if (sub.code === 41){ title = 'Sensores MEG'; subt = st.name; }
  else if (sub.code === 9){ title = 'Espectro · PRESS TE 30'; subt = st.name; }
  else if (sub.code === 51){ title = 'Doppler espectral · ' + (TCD[st.tcd || 'normal'] || TCD.normal).label; subt = st.name; }
  else if (sub.code === 60){ title = 'Serie angiográfica'; subt = '';
    chips = ['ICA-L','ICA-R','VERT'].map(k=>`<button class="mini" type="button" data-inj="${k}" aria-pressed="${S.dsaInj===k}">${k === 'VERT' ? 'Vertebral' : (k === 'ICA-L' ? 'ACI izquierda' : 'ACI derecha')}</button>`).join('') + `<button class="mini" type="button" data-play aria-pressed="${S.dsaPlay}">${S.dsaPlay ? 'Pausar' : 'Reproducir'}</button>`; }
  else show = false;
  if (S.tab === 'lab' && S.labScan === 'fmri'){ title = 'Señal BOLD · sitio estimulado'; subt = 'diseño de bloques'; }
  chart.hidden = !show; if (!show) return;
  $('#chartTitle').textContent = title; $('#chartSub').textContent = subt; $('#chartChips').innerHTML = chips;
  const big = sub.code === 40;
  if (innerWidth <= 820){   // phones: full width, height kept in proportion and capped so the brain stays in view
    const cw = Math.max(200, Math.min(innerWidth - 54, 560)), ch = Math.round(Math.max(96, Math.min(cw*(big ? 0.62 : 0.4), innerHeight*(big ? 0.3 : 0.19))));
    chartCv.style.width = '100%'; chartCv.style.height = ch + 'px'; chartCv.width = Math.round(cw*2); chartCv.height = ch*2;
  } else {
    chartCv.style.width = big ? '420px' : '340px'; chartCv.style.height = big ? '300px' : '150px';
    chartCv.width = big ? 840 : 680; chartCv.height = big ? 600 : 300;
  }
  chartShown();
  drawChartStatic();
}
$('#chartChips').addEventListener('click', e=>{
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.inj){ S.dsaInj = b.dataset.inj; vesKey = ''; dsaT = 0; }
  if ('play' in b.dataset) S.dsaPlay = !S.dsaPlay;
  setupChart(); dirty = true;
});
function resetCharts(){ eegBuf = null; megBuf = null; surfaceState = {src:[], elec:[], dip:[]}; const sub = activeSub(); if (sub.code === 40) eegTick(activeState().eeg || 'alpha'); if (sub.code === 41) megTick(activeState().meg || 'alpha'); setupChart(); }
function drawChartStatic(){
  const sub = activeSub(), st = activeState(), W = chartCv.width, H = chartCv.height;
  if (sub.code === 9) drawMRS(chartCtx, W, H, st.mrs || 'normal', false);
  else if (sub.code === 40 && eegBuf) drawEEG(chartCtx, W, H, st.eeg || 'alpha', 18, false);
  else if (sub.code === 30 || (S.tab === 'lab' && S.labScan === 'fmri')) drawBold();
  else if (sub.code === 51) drawTCD(chartCtx, W, H, st.tcd || 'normal', false);
  else if (sub.code === 60) drawDsaTimeline();
}
let chartAcc = 0;
function tickCharts(dt){
  const sub = activeSub(), st = activeState();
  if (sub.code === 40) eegTick(st.eeg || 'alpha');
  if (sub.code === 41) megTick(st.meg || 'alpha');
  chartAcc += dt; if (chartAcc < 1/24) return; chartAcc = 0;
  if (chart.hidden || chartTucked) return;
  const W = chartCv.width, H = chartCv.height;
  if (sub.code === 40) drawEEG(chartCtx, W, H, st.eeg || 'alpha', 18, false);
  else if (sub.code === 41) drawMEG(chartCtx, W, H, st.meg || 'alpha', false);
  else if (sub.code === 30 || (S.tab === 'lab' && S.labScan === 'fmri')) drawBold();
  else if (sub.code === 51) drawTCD(chartCtx, W, H, st.tcd || 'normal', false);
  else if (sub.code === 60) drawDsaTimeline();
}
function drawBold(){
  const ctx = chartCtx, W = chartCv.width, H = chartCv.height; ctx.clearRect(0, 0, W, H);
  const win = 60, t1 = simT, t0 = t1 - win, rest = !!activeState().yeoAct, X = t => (t - t0)/win*W;
  const f = t => rest ? 0.5 + 0.28*Math.sin(t*0.42) + 0.18*Math.sin(t*1.13 + 1.7) : boldAt(t);
  if (!rest){ ctx.fillStyle = 'rgba(0,80,255,0.08)'; for (let b = Math.floor(t0/PERIOD)*PERIOD; b < t1; b += PERIOD){ const a = Math.max(b, t0), z = Math.min(b + 15, t1); if (z > a) ctx.fillRect(X(a), 0, X(z) - X(a), H); } }
  ctx.strokeStyle = CH.axis; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, H - 24); ctx.lineTo(W, H - 24); ctx.stroke();
  ctx.strokeStyle = CH.ink; ctx.lineWidth = 3.5; ctx.beginPath();
  for (let i = 0; i <= 200; i++){ const t = t0 + win*i/200, y = H - 24 - f(t)*(H - 50); i ? ctx.lineTo(X(t), y) : ctx.moveTo(X(t), y); }
  ctx.stroke(); ctx.fillStyle = CH.acc; ctx.beginPath(); ctx.arc(W - 7, H - 24 - f(t1)*(H - 50), 8, 0, 7); ctx.fill();
  ctx.fillStyle = CH.muted; ctx.font = '24px "Azeret Mono", monospace'; ctx.fillText('60 s', 6, H - 2); ctx.fillText(rest ? 'r' : '+2%', 6, 26);
}
function drawDsaTimeline(){
  const ctx = chartCtx, W = chartCv.width, H = chartCv.height; ctx.clearRect(0, 0, W, H);
  const segs = [['Arterial', 0, 0.42, '#d9412b'], ['Capilar', 0.38, 0.72, '#8a5cf6'], ['Venosa', 0.62, 1.0, '#0050ff']];
  ctx.font = '24px "Figtree", sans-serif';
  segs.forEach(([n, a, b, c], i) => { const y = 30 + i*56; ctx.fillStyle = CH.grid; ctx.fillRect(20, y, W - 40, 26); ctx.fillStyle = c; ctx.fillRect(20 + (W - 40)*a, y, (W - 40)*(b - a), 26); ctx.fillStyle = CH.ink; ctx.fillText(n, 28 + (W - 40)*a, y + 52); });
  const x = 20 + (W - 40)*dsaT; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x, H - 30); ctx.stroke();
  ctx.fillStyle = CH.muted; ctx.font = '22px "Azeret Mono", monospace'; ctx.fillText((dsaT*6).toFixed(1) + ' s tras la inyección', 20, H - 6);
}

/* ---------- DOM overlay: electrode labels, dipole arrows, projection findings ---------- */
const layer = $('#elecLayer');
function afterRender(cam){
  const sub = activeSub(); let html = '';
  const g = S.glass, inG = (p) => p[0] > g.x + 8 && p[0] < g.x + g.size - 8 && p[1] > g.y + 8 && p[1] < g.y + g.size - 8;
  const cv = camera(stageW, stageH);
  if (glassVisible() && sub.code === 40){
    const E = META.landmarks.electrodes;
    for (const n in E){ const e = E[n], nrm = v3.norm(v3.sub(e, [0,-18,5])); if (v3.dot(nrm, cv.f) > -0.15) continue; const p = project(v3.add(e, v3.mul(nrm, 3)), cv); if (inG(p)) html += `<span class="elec-lbl" style="left:${p[0]}px;top:${p[1]}px">${n}</span>`; }
  }
  if (glassVisible() && sub.code === 41){
    for (const d of surfaceState.dip){ const a = project(d.p, cv), b = project(v3.add(d.p, v3.mul(d.q, 22*Math.sign(d.a || 1))), cv); if (!inG(a)) continue; const op = Math.min(1, Math.abs(d.a)/15 + 0.15);
      html += `<svg class="dip" style="left:0;top:0;width:${stageW}px;height:${stageH}px;opacity:${op}" viewBox="0 0 ${stageW} ${stageH}"><circle cx="${a[0]}" cy="${a[1]}" r="5" fill="#0c161b" stroke="#fff"/><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#0c161b" stroke-width="2.5"/><circle cx="${b[0]}" cy="${b[1]}" r="2.5" fill="#0c161b"/></svg>`; }
  }
  if (glassVisible() && sub.mip && S.findings && S.tab === 'scans'){
    const st = activeState();
    stateLesions(st, sub).forEach((l, i) => { if (!lesionVisible(l, sub)) return; const p = project(l.c, cv); if (!inG(p)) return; const rad = Math.max(...l.r)*1.3*(Math.min(stageW,stageH)/2)/(TAN*DIST);
      html += `<svg class="dip" style="left:0;top:0;width:${stageW}px;height:${stageH}px" viewBox="0 0 ${stageW} ${stageH}"><circle cx="${p[0]}" cy="${p[1]}" r="${rad}" fill="none" stroke="#f3b04e" stroke-width="${S.hover === i ? 2.5 : 1.5}" stroke-dasharray="5 4"/></svg>`; });
  }
  if (layer._h !== html){ layer.innerHTML = html; layer._h = html; }
}

/* =====================================================================
   Brain Lab: stimulate + dissect
   ===================================================================== */

function labApplyRegions(){
  const groupC = {}, cnt = {};
  for (const r of META.regions){ if (!r.centroid) continue; const k = r.group + r.hemi; groupC[k] = v3.add(groupC[k] || [0,0,0], r.centroid); cnt[k] = (cnt[k] || 0) + 1; }
  for (const k in groupC) groupC[k] = v3.mul(groupC[k], 1/cnt[k]);
  const center = [0,-18,12];
  for (const r of META.regions){
    const R = REG[r.id];
    const gOn = LAB.groups[r.group] !== false, hOn = r.hemi === 'M' ? (LAB.hemi.L || LAB.hemi.R) : LAB.hemi[r.hemi];
    R.visible = gOn && hOn && !R.hidden;
    const gc = groupC[r.group + r.hemi] || r.centroid || center;
    let dir = v3.sub(gc, center);
    if (r.group === 'Deep grey matter' || r.group === 'Ventricles') dir = v3.mul(dir, 0.35);
    if (r.group === 'Cerebellum') dir = v3.add(dir, [0,-20,-30]);
    if (r.group === 'Brainstem') dir = [0,0,-40];
    if (r.hemi !== 'M' && r.group !== 'Deep grey matter' && r.group !== 'Ventricles') dir = v3.add(dir, [r.hemi === 'L' ? -25 : 25, 0, 0]);
    R.off = v3.mul(v3.norm(dir), LAB.explode*48);
  }
  uploadRegions();
}

/* ---------- body figure ---------- */
function limb(id, x1, y1, x2, y2, w){ return `<line class="bl" data-p="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${w}"/>`; }
function side(s){ // s = 'r' (patient right, viewer left) or 'l'
  const X = x => s === 'r' ? x : 240 - x;
  const o = (x, y) => `transform-box:view-box;transform-origin:${X(x)}px ${y}px`;
  return `
  <g id="thigh-${s}" style="${o(104,236)}">${limb('hip-'+s, X(104), 236, X(100), 334, 26)}
    <g id="leg-${s}" style="${o(100,334)}">${limb('leg-'+s, X(100), 334, X(98), 426, 20)}
      <g id="foot-${s}" style="${o(98,428)}">${limb('foot-'+s, X(98), 430, X(86), 446, 12)}<circle class="bp" data-p="toes-${s}" cx="${X(79)}" cy="449" r="5.5"/></g></g></g>
  <g id="arm-${s}" style="${o(86,104)}">${limb('shoulder-'+s, X(90), 100, X(80), 112, 22)}${limb('arm-'+s, X(82), 106, X(68), 186, 19)}
    <g id="fore-${s}" style="${o(68,186)}">${limb('fore-'+s, X(68), 186, X(58), 262, 16)}
      <g id="hand-${s}" style="${o(58,264)}"><ellipse class="bp" data-p="hand-${s}" cx="${X(56)}" cy="279" rx="10" ry="14"/>
        <g data-p="fingers-${s}">${[48,53,58,63].map((x,i)=>limb('fingers-'+s, X(x+ (i-1.5)*0.6), 290, X(x - 1 + (i-1.5)*1.4), 309 - Math.abs(i-1.5)*2, 4.2)).join('')}</g>
        <g id="thumb-${s}" style="${o(64,276)}">${limb('thumb-'+s, X(64), 276, X(70), 291, 5)}</g></g></g></g>`;
}
function bodySVG(){
  return `<svg viewBox="0 0 240 480" id="bodySvg" role="img" aria-label="Figura corporal de frente; el lado derecho del paciente queda a su izquierda">
    <style>.bl{stroke:#c5cfd4;stroke-linecap:round;transition:stroke .25s}.bl.hot,.bp.hot{stroke:#0050ff;fill:#0050ff}.bl.feel{stroke:#00a389}.bp.feel{fill:#00a389}
      .bp{fill:#c5cfd4;stroke:none;transition:fill .25s}.skin{fill:#e8edf0;stroke:#a9b6bc;stroke-width:1.2}</style>
    <defs><radialGradient id="glowG"><stop offset="0" stop-color="#0050ff" stop-opacity=".85"/><stop offset="1" stop-color="#0050ff" stop-opacity="0"/></radialGradient>
      <radialGradient id="glowB"><stop offset="0" stop-color="#00a389" stop-opacity=".85"/><stop offset="1" stop-color="#00a389" stop-opacity="0"/></radialGradient></defs>
    <g id="ghost" opacity="0" transform="translate(30,-34)"><path d="M120 18 a28 28 0 1 1 -0.1 0 M84 96 Q120 86 156 96 L150 232 Q120 244 90 232 Z M100 236 L98 430 M140 236 L142 430 M84 104 L58 262 M156 104 L182 262" fill="none" stroke="#0050ff" stroke-width="3" stroke-dasharray="4 4"/></g>
    ${side('r')}${side('l')}
    <path id="trunk" class="skin bp" data-p="trunk" d="M84 96 Q120 86 156 96 L150 232 Q120 244 90 232 Z"/>
    <ellipse id="gut" cx="120" cy="178" rx="22" ry="18" fill="url(#glowG)" opacity="0"/>
    <g id="neckG">${limb('neck', 120, 74, 120, 94, 18)}</g>
    <g id="headG" style="transform-box:view-box;transform-origin:120px 76px">
      <circle class="skin bp" data-p="face" cx="120" cy="46" r="29"/>
      <path id="brows" d="M106 34 l8 -2 M126 32 l8 2" stroke="#7d8e95" stroke-width="2" stroke-linecap="round"/>
      <g id="eyes"><circle cx="109" cy="44" r="4" fill="#0c161b"/><circle cx="131" cy="44" r="4" fill="#0c161b"/>
        <circle id="pupR" cx="109" cy="44" r="1.8" fill="#ffffff"/><circle id="pupL" cx="131" cy="44" r="1.8" fill="#ffffff"/></g>
      <path id="mouth" class="mth" d="M110 60 Q120 66 130 60" stroke="#7d8e95" stroke-width="2.4" fill="none" stroke-linecap="round" style="transform-box:view-box;transform-origin:120px 62px"/>
      <ellipse id="tongue" cx="120" cy="66" rx="5" ry="0" fill="#d77a9d"/>
      <path id="earR" d="M90 40 q-6 6 0 14" stroke="#a9b6bc" stroke-width="2" fill="none"/><path id="earL" d="M150 40 q6 6 0 14" stroke="#a9b6bc" stroke-width="2" fill="none"/>
    </g>
    <g id="fx"></g>
    <text x="40" y="474" fill="#7d8e95" font-size="11" font-family="Azeret Mono, monospace">R</text><text x="194" y="474" fill="#7d8e95" font-size="11" font-family="Azeret Mono, monospace">L</text>
  </svg>`;
}
const PART_TARGET = { // part -> [group to animate, animation, parts to colour]
  toes:['foot','tw',['toes','foot']], foot:['foot','tw',['foot','toes']], leg:['leg','tw',['leg']], hip:['thigh','tw',['hip']], trunk:[null,null,['trunk']],
  shoulder:['arm','tw',['shoulder','arm']], arm:['arm','tw',['arm','fore']], hand:['hand','flex',['hand','fingers']], fingers:['hand','flex',['fingers','hand']], thumb:['thumb','tw',['thumb']],
  neck:['headG','tw',['neck']], face:['mouth','tw',['face']], lips:['mouth','tw',['face']], tongue:['tongue','tongue',['face']], throat:[null,null,['neck']],
};
function resetBody(){
  const svg = $('#bodySvg'); if (!svg) return;
  svg.querySelectorAll('.hot,.feel').forEach(e=>e.classList.remove('hot','feel'));
  svg.querySelectorAll('.tw-l,.tw-r,.flexing,.glow').forEach(e=>e.classList.remove('tw-l','tw-r','flexing','glow'));
  $('#fx').innerHTML = ''; $('#ghost').setAttribute('opacity', 0); $('#gut').setAttribute('opacity', 0);
  $('#tongue').setAttribute('ry', 0); $('#pupR').setAttribute('cx', 109); $('#pupL').setAttribute('cx', 131);
  $('#mouth').setAttribute('d', 'M110 60 Q120 66 130 60'); $('#brows').setAttribute('d', 'M106 34 l8 -2 M126 32 l8 2');
}
function animateBody(eff){
  resetBody(); const svg = $('#bodySvg'); if (!svg) return;
  void svg.getBoundingClientRect();
  const sides = eff.side === 'both' ? ['r','l'] : [eff.side === 'right' ? 'r' : 'l'];
  const colour = (parts, cls) => { for (const s of sides) for (const p of parts){ svg.querySelectorAll(`[data-p="${p}-${s}"], [data-p="${p}-${s}"] *`).forEach(e=>e.classList.add(cls)); } for (const p of parts) svg.querySelectorAll(`[data-p="${p}"]`).forEach(e=>e.classList.add(cls)); };
  const fx = $('#fx');
  const glowAt = (x, y, r, blue) => { fx.insertAdjacentHTML('beforeend', `<circle class="glow" cx="${x}" cy="${y}" r="${r}" fill="url(#${blue ? 'glowB' : 'glowG'})"/>`); };
  const centre = (sel) => { const e = svg.querySelector(sel); if (!e) return null; const b = e.getBBox(); return [b.x + b.width/2, b.y + b.height/2]; };
  if (eff.kind === 'move' || eff.kind === 'feel'){
    const T = PART_TARGET[eff.part] || [null, null, []];
    colour(T[2], eff.kind === 'move' ? 'hot' : 'feel');
    for (const s of sides){
      const c = centre(`[data-p="${T[2][0]}-${s}"]`) || centre(`[data-p="${T[2][0]}"]`); if (c) glowAt(c[0], c[1], eff.kind === 'feel' ? 22 : 16, eff.kind === 'feel');
      if (eff.kind !== 'move') continue;
      if (T[1] === 'tw'){ const g = T[0] === 'headG' ? $('#headG') : T[0] === 'mouth' ? $('#mouth') : $(`#${T[0]}-${s}`); if (g) g.classList.add(s === 'r' ? 'tw-r' : 'tw-l'); }
      if (T[1] === 'flex'){ const g = $(`#${T[0]}-${s}`); if (g) g.classList.add('flexing'); }
      if (T[1] === 'tongue'){ $('#tongue').setAttribute('ry', 7); }
    }
  } else if (eff.part === 'posture'){
    for (const s of ['r','l']){ const g = $(`#arm-${s}`); g.classList.add(s === 'r' ? 'tw-r' : 'tw-l'); }
    $('#headG').classList.add('tw-l'); colour(['arm','shoulder','fore'], 'hot');
  } else if (eff.kind === 'eyes'){
    const dx = eff.side === 'right' ? -3 : 3; $('#pupR').setAttribute('cx', 109 + dx); $('#pupL').setAttribute('cx', 131 + dx); $('#headG').classList.add(eff.side === 'right' ? 'tw-r' : 'tw-l'); glowAt(120, 44, 20);
  } else if (eff.kind === 'speech'){
    fx.insertAdjacentHTML('beforeend', `<g class="glow"><path d="M150 18 h66 a8 8 0 0 1 8 8 v22 a8 8 0 0 1 -8 8 h-50 l-12 10 l2 -10 h-6 a8 8 0 0 1 -8 -8 v-22 a8 8 0 0 1 8 -8z" fill="#ffffff" stroke="#0050ff"/><text x="186" y="42" text-anchor="middle" fill="#0050ff" font-size="13" font-family="Figtree, sans-serif">${/habla/i.test(eff.title) ? 'uno, dos, tre…' : 'a… ¿lápiz? no…'}</text></g>`);
    $('#mouth').setAttribute('d', 'M112 61 L128 61');
  } else if (eff.kind === 'hear'){
    for (const s of sides){ const x = s === 'r' ? 84 : 156, d = s === 'r' ? -1 : 1; fx.insertAdjacentHTML('beforeend', `<g class="glow" stroke="#0050ff" fill="none" stroke-width="2">${[8,14,20].map(r=>`<path d="M${x} ${47 - r} a${r} ${r} 0 0 ${d > 0 ? 1 : 0} 0 ${2*r}" transform="translate(${d*4},0)"/>`).join('')}</g>`); }
  } else if (eff.kind === 'memory' || eff.kind === 'self' || eff.kind === 'emotion'){
    if (eff.kind === 'self') $('#ghost').setAttribute('opacity', 0.8);
    if (eff.kind === 'memory') fx.insertAdjacentHTML('beforeend', `<g class="glow"><circle cx="160" cy="14" r="14" fill="#ffffff" stroke="#c08ac9"/><circle cx="146" cy="32" r="3" fill="#c08ac9"/><circle cx="152" cy="26" r="4" fill="#c08ac9"/><text x="160" y="18" text-anchor="middle" fill="#c08ac9" font-size="10" font-family="Figtree, sans-serif">déjà vu</text></g>`);
    if (eff.kind === 'emotion'){ $('#brows').setAttribute('d', /miedo/i.test(eff.title) ? 'M106 30 l8 4 M126 34 l8 -4' : 'M106 33 l8 -3 M126 30 l8 3'); $('#mouth').setAttribute('d', /miedo/i.test(eff.title) ? 'M112 63 Q120 58 128 63' : 'M108 58 Q120 70 132 58'); glowAt(120, 46, 26); if (/epigástric|náusea/i.test(eff.title)) $('#gut').setAttribute('opacity', 1); }
  } else if (eff.kind === 'gut'){ $('#gut').setAttribute('opacity', 1); $('#gut').classList.add('glow'); glowAt(120, 64, 12); }
  else if (eff.kind === 'see'){ glowAt(120, 44, 22); }
  else if (eff.kind === 'quiet' && /temblor/i.test(eff.title)){ colour(['hand','fingers'], 'feel'); }
}
function visualField(f){
  if (!f) return '';
  const q = (path, on) => `<path d="${path}" fill="${on ? '#f2b705' : '#e8edf0'}" class="${on ? 'flash' : ''}" stroke="#a9b6bc"/>`;
  if (f.face) return `<div class="vf"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" fill="#e8edf0" stroke="#a9b6bc"/><g class="flash"><ellipse cx="60" cy="60" rx="20" ry="26" fill="none" stroke="#f2b705" stroke-width="2"/><path d="M50 52 q4 -4 8 0 M64 50 q4 4 8 -1 M52 72 q8 6 16 -2" stroke="#f2b705" stroke-width="2" fill="none"/></g></svg><p class="lab-tip">El rostro a la vista parece deformarse.</p></div>`;
  const L = f.side === 'left', up = f.upper;
  const ul = q('M60 60 L60 4 A56 56 0 0 0 4 60 Z', !f.central && L && up), ur = q('M60 60 L116 60 A56 56 0 0 0 60 4 Z', !f.central && !L && up);
  const ll = q('M60 60 L4 60 A56 56 0 0 0 60 116 Z', !f.central && L && !up), lr = q('M60 60 L60 116 A56 56 0 0 0 116 60 Z', !f.central && !L && !up);
  return `<div class="vf"><svg viewBox="0 0 120 120" aria-label="Campo visual tal como lo ve el paciente">${ul}${ur}${ll}${lr}<circle cx="60" cy="60" r="12" fill="${f.central ? '#f2b705' : '#e8edf0'}" class="${f.central ? 'flash' : ''}" stroke="#a9b6bc"/><text x="6" y="116" fill="#7d8e95" font-size="9">I</text><text x="108" y="116" fill="#7d8e95" font-size="9">D</text></svg><p class="lab-tip">Campo visual tal como lo ve el paciente.<br>La luz aparece donde parpadea.</p></div>`;
}

/* ---------- panels ---------- */
function labRailHTML(){
  const groups = GROUP_ORDER.map(g=>{ const c = GROUP_COLORS[g].map(v=>Math.round(v*255)); return `<label class="grp"><input type="checkbox" data-g="${g}" ${LAB.groups[g] !== false ? 'checked' : ''}><i style="background:rgb(${c})"></i>${groupEs(g)}</label>`; }).join('');
  return `
  <div class="lab-sec"><h3>Herramienta</h3><div class="seg2" id="labTool"><button type="button" data-t="stim" aria-pressed="${LAB.tool==='stim'}">Estimular</button><button type="button" data-t="dissect" aria-pressed="${LAB.tool==='dissect'}">Diseccionar</button></div>
    <p class="hint-s">${LAB.tool === 'stim' ? 'Pulse en cualquier punto de la corteza para aplicar un tren de pulsos de 50 Hz, como hacen los cirujanos al mapear a un paciente despierto.' : 'Pulse una estructura para conocerla. Oculte grupos, separe los lóbulos o seccione el encéfalo.'}</p></div>
  <div class="lab-sec"><h3>Hemisferios</h3><div class="row"><button type="button" class="mini" data-h="L" aria-pressed="${LAB.hemi.L}">Izquierdo</button><button type="button" class="mini" data-h="R" aria-pressed="${LAB.hemi.R}">Derecho</button></div></div>
  <div class="lab-sec"><h3>Estructuras</h3>${groups}<div class="row"><button type="button" class="mini" id="labAll">Mostrar todo</button><button type="button" class="mini" id="labDeep">Revelar estructuras profundas</button></div></div>
  <div class="lab-sec"><h3>Separar</h3><div class="row"><label>Explosión<input type="range" id="labExplode" min="0" max="1" step="0.01" value="${LAB.explode}"></label></div></div>
  <div class="lab-sec"><h3>Corte</h3>
    <div class="row"><button type="button" class="mini" id="labCutOn" aria-pressed="${LAB.cut.on}">${LAB.cut.on ? 'Cortando' : 'Abrir corte'}</button>
      <select id="labCutAxis" aria-label="Plano de corte">${[['axial','Axial'],['coronal','Coronal'],['sagittal','Sagital']].map(([a,t])=>`<option value="${a}" ${a===LAB.cut.axis?'selected':''}>${t}</option>`).join('')}</select>
      <button type="button" class="mini" id="labCutFlip">Invertir lado</button></div>
    <div class="row"><label>Profundidad<input type="range" id="labCutPos" min="-80" max="80" step="1" value="${LAB.cut.pos}"></label></div>
    <p class="hint-s" id="labCutNote" ${LAB.explode > 0.01 && LAB.cut.on ? '' : 'hidden'}>Ajuste la explosión a cero para ver el corte.</p></div>
  <div class="lab-sec" style="border:0"><h3>Color</h3><div class="seg2" id="labColor"><button type="button" data-c="lobe" aria-pressed="${LAB.colorBy==='lobe'}">Por lóbulo</button><button type="button" data-c="region" aria-pressed="${LAB.colorBy==='region'}">Por región</button></div></div>`;
}
function renderLabRail(){
  const el = $('#labRail'); el.innerHTML = `<button type="button" class="crumb" data-go="lab">Acerca del Laboratorio cerebral</button>` + labRailHTML();
}
function renderLabPanel(){
  const el = $('#labPanel');
  if (LAB.tool === 'stim'){
    const s = LAB.stim;
    const use3d = typeof lbBuild === 'function' && !!lbBuild();
    el.innerHTML = `<div class="lh"><span class="eb">Mapeo por estimulación cortical</span><h2>${s ? s.effect.title : 'Toque el encéfalo'}</h2></div>
      <div class="lb">
        <div class="lab-fb">
        ${s ? `<div class="stim-res"><div class="sr-top"><span class="k">Sitio de estimulación</span><span class="sr-mni">MNI ${s.p.map(v=>v.toFixed(0)).join(', ')}</span></div>
          <b class="sr-reg">${s.region.name}</b><span class="sr-hemi">${s.region.hemi !== 'M' ? 'hemisferio ' + HEMI[s.region.hemi] : 'línea media'}${s.effect.side && s.effect.side !== 'both' && s.region.hemi !== 'M' ? ' → lado ' + (s.effect.side === 'right' ? 'derecho' : 'izquierdo') + ' del cuerpo' : ''}</span>
          <p>${s.effect.text}</p></div>` : `<p class="lab-intro">Pulse un punto de la corteza. La estimulación de la corteza motora mueve el lado opuesto del cuerpo; la sensitiva lo hace hormiguear; la visual produce destellos de luz en el campo visual opuesto; las áreas del lenguaje detienen el habla. La figura está de frente, así que la derecha del paciente queda a su izquierda.</p>`}
        ${use3d ? '<div class="lab-body" id="labBody"></div>' : `<div class="body-wrap">${bodySVG()}</div>`}
        </div>
        ${s && s.effect.field ? visualField(s.effect.field) : ''}
        <div class="row"><label>Añadir una exploración<select id="labScan" aria-label="Exploración que añadir">${[['none','Ninguna'],['fmri','Activación por RMf'],['fdg','PET con FDG'],['t1','Anatomía T1'],['dti','Tractos DTI']].map(([v,n])=>`<option value="${v}" ${v===LAB.scan?'selected':''}>${n}</option>`).join('')}</select></label></div>
        ${LAB.log.length ? `<div class="log"><b>Reciente</b>${LAB.log.map(l=>`<div><span>${l.where}</span><b>${l.what}</b></div>`).join('')}</div>` : ''}
      </div>`;
    if (use3d) lbMount($('#labBody'), s); else if (s) requestAnimationFrame(()=>animateBody(s.effect));
  } else {
    const r = LAB.selR > 0 ? REG[LAB.selR] : null, info = r ? (REGION_INFO[r.name] || {}) : null;
    el.innerHTML = `<div class="lh"><span class="eb">${r ? groupEs(r.group) + (r.hemi !== 'M' ? ' · ' + HEMI[r.hemi] : '') : 'Disección'}</span><h2>${r ? r.name : 'Elija una estructura'}</h2></div>
      <div class="lb">${r ? `<dl><dt>Función</dt><dd>${info.fn || '—'}</dd><dt>Si se lesiona</dt><dd>${info.clin || '—'}</dd><dt>Irrigación</dt><dd>${info.supply || '—'}</dd></dl>
        <div class="row"><button type="button" class="mini" id="labHide">Ocultar esta</button><button type="button" class="mini" id="labIso">Aislar</button><button type="button" class="mini" id="labAll2">Mostrar todo</button></div>`
        : `<p>Pulse cualquier estructura para ver qué hace, qué ocurre cuando se lesiona y qué arteria la irriga. Desactive los cuatro lóbulos para revelar el tálamo, los ganglios basales, el hipocampo y los ventrículos subyacentes.</p>`}
        <p class="lab-tip">Atlas: Harvard-Oxford cortical y subcortical (FSL), cerebelo según AAL. Los fragmentos gíricos incluyen la sustancia blanca situada bajo cada circunvolución.</p></div>`;
  }
}

/* ---------- events ---------- */
$('#labRail').addEventListener('click', e=>{
  const t = e.target.closest('[data-t]'); if (t){ LAB.tool = t.dataset.t; LAB.selR = -1; renderLabRail(); renderLabPanel(); syncHud(); dirty = true; return; }
  const h = e.target.closest('[data-h]'); if (h){ LAB.hemi[h.dataset.h] = !LAB.hemi[h.dataset.h]; renderLabRail(); labApplyRegions(); return; }
  const c = e.target.closest('[data-c]'); if (c){ LAB.colorBy = c.dataset.c; renderLabRail(); uploadRegions(); return; }
  if (e.target.id === 'labAll'){ LAB.groups = {}; LAB.hemi = {L:true, R:true}; for (const r of META.regions) REG[r.id].hidden = false; renderLabRail(); labApplyRegions(); return; }
  if (e.target.id === 'labDeep'){ for (const g of ['Frontal lobe','Parietal lobe','Temporal lobe','Occipital lobe','Insula & operculum']) LAB.groups[g] = false; LAB.groups['Limbic lobe'] = true; for (const r of META.regions) if (r.group === 'Limbic lobe' && !/Hippocampus|Amygdala/.test(r.name)) REG[r.id].hidden = true; renderLabRail(); labApplyRegions(); return; }
  if (e.target.id === 'labCutOn'){ LAB.cut.on = !LAB.cut.on; renderLabRail(); dirty = true; return; }
  if (e.target.id === 'labCutFlip'){ LAB.cut.flip = !LAB.cut.flip; dirty = true; return; }
});
$('#labRail').addEventListener('change', e=>{
  const g = e.target.dataset.g; if (g){ LAB.groups[g] = e.target.checked; labApplyRegions(); return; }
  if (e.target.id === 'labCutAxis'){ LAB.cut.axis = e.target.value; dirty = true; }
});
$('#labRail').addEventListener('input', e=>{
  if (e.target.id === 'labExplode'){ LAB.explode = parseFloat(e.target.value); labApplyRegions(); const n = $('#labCutNote'); if (n) n.hidden = !(LAB.explode > 0.01 && LAB.cut.on); }
  if (e.target.id === 'labCutPos'){ LAB.cut.pos = parseFloat(e.target.value); if (!LAB.cut.on){ LAB.cut.on = true; $('#labCutOn').setAttribute('aria-pressed', true); $('#labCutOn').textContent = 'Cortando'; } dirty = true; }
});
$('#labPanel').addEventListener('change', e=>{
  if (e.target.id === 'labScan'){ LAB.scan = e.target.value; S.labScan = LAB.scan; if (LAB.stim) centreSliceOn(LAB.stim.p); placeLabGlass(); syncHud(); vesKey = ''; dirty = true; }
});
$('#labPanel').addEventListener('click', e=>{
  const r = REG[LAB.selR];
  if (e.target.id === 'labHide' && r){ r.hidden = true; LAB.selR = -1; labApplyRegions(); renderLabPanel(); }
  if (e.target.id === 'labIso' && r){ for (const x of META.regions) REG[x.id].hidden = x.id !== r.id; LAB.groups = {}; LAB.hemi = {L:true, R:true}; renderLabRail(); labApplyRegions(); }
  if (e.target.id === 'labAll2'){ for (const x of META.regions) REG[x.id].hidden = false; LAB.groups = {}; LAB.hemi = {L:true, R:true}; renderLabRail(); labApplyRegions(); }
});
function placeLabGlass(){
  const lp = $('#labPanel'), free = stageW > 820 ? stageW - lp.offsetWidth : stageW;
  const g = S.glass; g.size = Math.round(Math.max(170, Math.min(free*0.48, stageH*0.55)));
  g.x = Math.round(free*0.62 - g.size/2); g.y = Math.round(stageH*0.12);
  clampGlass(); layoutGlass();
}
function centreSliceOn(p){ const [, , f] = basisQ(S.q); S.slice = v3.dot(f, v3.sub(p, TARGET)); sliceIn.value = S.slice; updateAnnotations(); }

let labHoverT = 0;
LAB.hover = function(cx, cy, clientX, clientY){
  if (cx < 0){ if (this.hoverR !== -1){ this.hoverR = -1; dirty = true; } tip.hidden = true; return; }
  const now = performance.now(); if (now - labHoverT < 60) return; labHoverT = now;
  const hit = pickAt(cx, cy);
  const id = hit ? hit.id : -1;
  if (id !== this.hoverR){ this.hoverR = id; dirty = true; }
  if (hit && REG[hit.id]){ const r = REG[hit.id]; tip.innerHTML = `<b>${r.name}${r.hemi !== 'M' ? ' (' + HEMI[r.hemi] + ')' : ''}</b><span>${groupEs(r.group)}${this.tool === 'stim' ? ' · pulse para estimular' : ' · pulse para ver detalles'}</span>`; tip.hidden = false;
    tip.style.left = Math.min(cx + 16, stageW - 270) + 'px'; tip.style.top = Math.min(cy + 14, stageH - 60) + 'px'; }
  else tip.hidden = true;
};
LAB.click = function(cx, cy){
  const hit = pickAt(cx, cy); if (!hit || !REG[hit.id]) return;
  const r = REG[hit.id];
  if (this.tool === 'dissect'){ this.selR = hit.id; renderLabPanel(); dirty = true; return; }
  const eff = stimEffect(r, hit.p);
  this.stim = {p:hit.p, region:r, effect:eff, t0:performance.now()};
  this.log.unshift({where:`${r.name}${r.hemi !== 'M' ? ' (' + r.hemi + ')' : ''}`, what:eff.title}); this.log = this.log.slice(0, 5);
  if (this.scan !== 'none') centreSliceOn(hit.p);
  renderLabPanel(); vesKey = ''; dirty = true; syncHud();
};
LAB.enter = function(){
  this.scan = S.labScan = this.scan || 'none';
  renderLabRail(); renderLabPanel(); labApplyRegions();
  if (S.plane !== 'free' && S.plane !== 'sagittal') animateTo('free', S.slice);
};
LAB.leave = function(){
  for (const r of META.regions){ REG[r.id].visible = true; REG[r.id].off = [0,0,0]; }
  if (ready) uploadRegions();
  this.hoverR = -1; tip.hidden = true;
};

/* ---------- boot ---------- */
buildRail(); syncRail(); buildCmpSelect();
let loadTriggered = false;
function triggerLoad(){
  if (loadTriggered) return;
  loadTriggered = true;
  load().catch(err=>{ console.error(err); failMsg('No se pudieron cargar los datos cerebrales: ' + err.message); });
}

// Lazy trigger: scroll, interaction, intersection with reveal section, or idle fallback
window.addEventListener('scroll', triggerLoad, {once:true, passive:true});
window.addEventListener('pointerdown', triggerLoad, {once:true, passive:true});
window.addEventListener('touchstart', triggerLoad, {once:true, passive:true});

if (typeof IntersectionObserver !== 'undefined' && $('#reveal')){
  const _io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting){ triggerLoad(); _io.disconnect(); }
  }, {rootMargin: '400px'});
  _io.observe($('#reveal'));
}

if (typeof requestIdleCallback !== 'undefined'){
  requestIdleCallback(() => triggerLoad(), {timeout: 1200});
} else {
  setTimeout(triggerLoad, 400);
}

/* =====================================================================
   Chapter content: how each machine works
   ===================================================================== */
const ORDER = ['mri','ct','pet','spect','fmri','eeg','meg','us','dsa'];
const TAB_NAMES = {mri:'MRI', ct:'CT', pet:'PET', spect:'SPECT', fmri:'fMRI', eeg:'EEG', meg:'MEG', us:'Ecografía', dsa:'Angiografía', lab:'Laboratorio cerebral'};

/* =====================================================================
   Scenes: one drawing per chapter step, in a 1000 × 1000 unit box.
   G.u = canvas units per CSS pixel (for line widths and text).
   ===================================================================== */
const G = {u:1, ctx:null, t:0, env:null};
const KC = {ink:'#0c161b', ink2:'#3d4c53', muted:'#7d8b91', line:'#cdd5d9', soft:'#eef2f4', soft2:'#dfe6e9', sig:'#0050ff', sigSoft:'rgba(0,80,255,.12)',
  red:'#d9412b', redSoft:'rgba(217,65,43,.18)', amber:'#e8962a', teal:'#00a389', paper:'#ffffff', film:'#04070a', skin:'#f2e2d9', deoxy:'#6b2a4f'};
const TAU = Math.PI*2;
const narrowScene = () => innerWidth <= 820;

/* ---------- drawing kit ---------- */
function _st(c, w, dash){ const x = G.ctx; x.strokeStyle = c; x.lineWidth = w*G.u; x.setLineDash(dash ? dash.map(d=>d*G.u) : []); }
function ln(x1, y1, x2, y2, c = KC.ink2, w = 1.2, dash){ const x = G.ctx; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); _st(c, w, dash); x.stroke(); x.setLineDash([]); }
function circ(cx, cy, r, fill, stroke, w = 1.2, dash){ const x = G.ctx; x.beginPath(); x.arc(cx, cy, Math.max(0.01, r), 0, TAU); if (fill){ x.fillStyle = fill; x.fill(); } if (stroke){ _st(stroke, w, dash); x.stroke(); x.setLineDash([]); } }
function ell(cx, cy, rx, ry, fill, stroke, w = 1.2, dash, rot = 0){ const x = G.ctx; x.beginPath(); x.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); if (fill){ x.fillStyle = fill; x.fill(); } if (stroke){ _st(stroke, w, dash); x.stroke(); x.setLineDash([]); } }
function rr(x0, y0, w, h, r, fill, stroke, lw = 1.2, dash){ const x = G.ctx; x.beginPath(); x.roundRect ? x.roundRect(x0, y0, w, h, r) : x.rect(x0, y0, w, h); if (fill){ x.fillStyle = fill; x.fill(); } if (stroke){ _st(stroke, lw, dash); x.stroke(); x.setLineDash([]); } }
function poly(pts, fill, stroke, lw = 1.2, close = true, dash){ const x = G.ctx; x.beginPath(); pts.forEach((p, i)=> i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); if (close) x.closePath(); if (fill){ x.fillStyle = fill; x.fill(); } if (stroke){ _st(stroke, lw, dash); x.stroke(); x.setLineDash([]); } }
function curve(fn, x0, x1, n, stroke, lw = 1.6, dash){ const x = G.ctx; x.beginPath(); for (let i = 0; i <= n; i++){ const u = x0 + (x1 - x0)*i/n, [px, py] = fn(u); i ? x.lineTo(px, py) : x.moveTo(px, py); } _st(stroke, lw, dash); x.stroke(); x.setLineDash([]); }
function arrow(x1, y1, x2, y2, c = KC.ink, w = 1.6, hs = 9){
  ln(x1, y1, x2, y2, c, w); const a = Math.atan2(y2 - y1, x2 - x1), h = hs*G.u;
  poly([[x2, y2], [x2 - h*Math.cos(a - 0.42), y2 - h*Math.sin(a - 0.42)], [x2 - h*Math.cos(a + 0.42), y2 - h*Math.sin(a + 0.42)]], c);
}
function fontOf(kind, size, weight){ const px = size*(narrowScene() ? 0.9 : 1)*G.u; return kind === 'body' ? `${weight || 500} ${px}px "Instrument Sans", system-ui, sans-serif` : kind === 'disp' ? `${weight || 600} ${px}px Archivo, Arial, sans-serif` : `${weight || 400} ${px}px "Azeret Mono", ui-monospace, monospace`; }
function txt(s, x, y, o = {}){
  const c = G.ctx; c.font = fontOf(o.font || 'mono', o.size || 11, o.weight); c.fillStyle = o.color || KC.ink2; c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic';
  if (!o.maxW){ c.fillText(s, x, y); return 1; }
  const words = String(s).split(' '), lh = (o.size || 11)*1.35*G.u*(narrowScene() ? 0.9 : 1); let line = '', n = 0;
  for (const w of words){ const tt = line ? line + ' ' + w : w; if (c.measureText(tt).width > o.maxW && line){ c.fillText(line, x, y + n*lh); n++; line = w; } else line = tt; }
  c.fillText(line, x, y + n*lh); return n + 1;
}
function label(s, x, y, o = {}){ return txt(s, x, y, {size:11, color:KC.ink2, ...o}); }
function head(s, x, y, o = {}){ return txt(s.toUpperCase(), x, y, {size:10.5, color:KC.muted, ...o}); }
function callout(x, y, tx, ty, s, o = {}){
  circ(x, y, 3.2*G.u, o.color || KC.ink); ln(x, y, tx, ty, o.color || KC.ink2, 0.9);
  const right = tx >= x; ln(tx, ty, tx + (right ? 14 : -14)*G.u, ty, o.color || KC.ink2, 0.9);
  txt(s, tx + (right ? 20 : -20)*G.u, ty + 4*G.u, {size:11, color:o.color || KC.ink, align:right ? 'left' : 'right', maxW:o.maxW, font:o.font, weight:o.weight});
}
function fade(a, fn){ if (a <= 0.002) return; const c = G.ctx; c.save(); c.globalAlpha *= Math.min(1, a); fn(); c.restore(); }
function clip(fn, draw){ const c = G.ctx; c.save(); c.beginPath(); fn(c); c.clip(); draw(); c.restore(); }
function box(x, y, w, h, title, o = {}){ rr(x, y, w, h, 3, o.fill || null, o.stroke || KC.line, 1); if (title) head(title, x, y - 10*G.u); }
function img(cv, x, y, w, h, a = 1){ if (!cv) { rr(x, y, w, h, 3, KC.film); return; } fade(a, ()=>{ const c = G.ctx; c.imageSmoothingEnabled = true; c.drawImage(cv, x, y, w, h); }); }
function placeholder(x, y, w, h, s = 'Cargando el encéfalo…'){ rr(x, y, w, h, 3, KC.soft, KC.line, 1); txt(s, x + w/2, y + h/2, {align:'center', color:KC.muted, size:10.5}); }
const rnd = seed => () => { seed = (seed*16807) % 2147483647; return (seed - 1)/2147483646; };
const hashf = i => { const s = Math.sin(i*127.1 + 311.7)*43758.5453; return s - Math.floor(s); };

/* ---------- images from the real volume ---------- */

const SCANCV = new Map();
function scanCanvas(subId, state){
  if (!ready) return null;
  const key = subId + '|' + state;
  if (SCANCV.has(key)) return SCANCV.get(key);
  if (!thumbCache.has(key)) renderThumb({key, sub:subById(subId), state});
  const v = thumbCache.get(key); if (!v) return null;
  let c = v;
  if (v instanceof ImageData){ c = document.createElement('canvas'); c.width = v.width; c.height = v.height; c.getContext('2d').putImageData(v, 0, 0); }
  SCANCV.set(key, c); return c;
}
const GRAY = new Map();
function grayOf(subId, state, n = 128){
  const key = subId + '|' + state + '|' + n; if (GRAY.has(key)) return GRAY.get(key);
  const cv = scanCanvas(subId, state); if (!cv) return null;
  const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d', {willReadFrequently:true}); x.drawImage(cv, 0, 0, n, n);
  const d = x.getImageData(0, 0, n, n).data, g = new Float32Array(n*n);
  for (let i = 0; i < n*n; i++) g[i] = (d[i*4] + d[i*4 + 1] + d[i*4 + 2])/765;
  GRAY.set(key, g); return g;
}
function bufCanvas(buf, n, cmap, norm){
  const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'), im = x.createImageData(n, n);
  let mx = norm || 0; if (!norm) for (let i = 0; i < buf.length; i++) if (buf[i] > mx) mx = buf[i];
  mx = mx || 1;
  for (let i = 0; i < n*n; i++){ const v = Math.max(0, Math.min(1, buf[i]/mx)), [r, g, b] = cmap(v); im.data[i*4] = r; im.data[i*4 + 1] = g; im.data[i*4 + 2] = b; im.data[i*4 + 3] = 255; }
  x.putImageData(im, 0, 0); return c;
}
const CM = {
  gray: v => [v*255, v*255, v*255],
  hot: v => [Math.min(1, v*3)*255, Math.min(1, Math.max(0, v*3 - 1))*255, Math.min(1, Math.max(0, v*3 - 2))*255],
  spect: v => { const st = [[0,[0,0,0]],[0.2,[26,44,255]],[0.4,[0,200,255]],[0.6,[61,255,106]],[0.8,[255,230,0]],[1,[255,58,0]]]; for (let i = 1; i < st.length; i++) if (v <= st[i][0]){ const [a, ca] = st[i - 1], [b, cb] = st[i], k = (v - a)/(b - a); return ca.map((q, j)=>q + (cb[j] - q)*k); } return [255,58,0]; },
};

/* ---------- FFT ---------- */
function fft1(re, im, inv){
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++){ let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j){ let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2; len <= n; len <<= 1){
    const ang = TAU/len*(inv ? 1 : -1), wr = Math.cos(ang), wi = Math.sin(ang), h = len >> 1;
    for (let i = 0; i < n; i += len){ let cr = 1, ci = 0;
      for (let j = 0; j < h; j++){ const a = i + j, b = a + h, br = re[b]*cr - im[b]*ci, bi = re[b]*ci + im[b]*cr; re[b] = re[a] - br; im[b] = im[a] - bi; re[a] += br; im[a] += bi; const t = cr*wr - ci*wi; ci = cr*wi + ci*wr; cr = t; } }
  }
  if (inv) for (let i = 0; i < n; i++){ re[i] /= n; im[i] /= n; }
}
function fft2(re, im, n, inv){
  const r = new Float64Array(n), c = new Float64Array(n);
  for (let y = 0; y < n; y++){ for (let x = 0; x < n; x++){ r[x] = re[y*n + x]; c[x] = im[y*n + x]; } fft1(r, c, inv); for (let x = 0; x < n; x++){ re[y*n + x] = r[x]; im[y*n + x] = c[x]; } }
  for (let x = 0; x < n; x++){ for (let y = 0; y < n; y++){ r[y] = re[y*n + x]; c[y] = im[y*n + x]; } fft1(r, c, inv); for (let y = 0; y < n; y++){ re[y*n + x] = r[y]; im[y*n + x] = c[y]; } }
}
function kspace(){
  const E = G.env; if (E.K) return E.K;
  const g = grayOf('t1', 'normal', 128); if (!g) return null;
  const n = 128, re = Float64Array.from(g), im = new Float64Array(n*n); fft2(re, im, n, false);
  const mag = new Float32Array(n*n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++){ const sy = (y + n/2) % n, sx = (x + n/2) % n; mag[sy*n + sx] = Math.log(1 + Math.hypot(re[y*n + x], im[y*n + x])); }
  E.K = {re, im, n, kcv:bufCanvas(mag, n, CM.gray), cache:new Map()}; return E.K;
}
function kRecon(m){
  const K = kspace(); if (!K) return null; if (K.cache.has(m)) return K.cache.get(m);
  const n = K.n, re = new Float64Array(n*n), im = new Float64Array(n*n);
  for (let y = 0; y < n; y++){ const ky = y < n/2 ? y : y - n; if (Math.abs(ky) > m) continue; for (let x = 0; x < n; x++){ re[y*n + x] = K.re[y*n + x]; im[y*n + x] = K.im[y*n + x]; } }
  fft2(re, im, n, true);
  const out = new Float32Array(n*n); for (let i = 0; i < n*n; i++) out[i] = Math.hypot(re[i], im[i]);
  const c = bufCanvas(out, n, CM.gray, 1); K.cache.set(m, c); return c;
}

/* ---------- Radon / back-projection (CT, SPECT) ---------- */
function tomo(subId, state){
  const key = 'tomo' + subId + state, E = G.env; if (E[key]) return E[key];
  const g = grayOf(subId, state, 128); if (!g) return null;
  const n = 128, nA = 180, c = (n - 1)/2, sino = new Float32Array(nA*n);
  for (let a = 0; a < nA; a++){ const th = a*Math.PI/nA, co = Math.cos(th), si = Math.sin(th);
    for (let d = 0; d < n; d++){ const s = d - c; let sum = 0;
      for (let k = 0; k < n; k++){ const tt = k - c, x = Math.round(s*co - tt*si + c), y = Math.round(s*si + tt*co + c); if (x >= 0 && y >= 0 && x < n && y < n) sum += g[y*n + x]; }
      sino[a*n + d] = sum; } }
  const filt = new Float32Array(nA*n), h = new Float32Array(n);
  for (let k = 0; k < n; k++) h[k] = k === 0 ? 0.25 : (k % 2 ? -1/(Math.PI*Math.PI*k*k) : 0);
  for (let a = 0; a < nA; a++) for (let d = 0; d < n; d++){ let s = 0; for (let j = 0; j < n; j++) s += sino[a*n + j]*h[Math.abs(d - j)]; filt[a*n + d] = s; }
  let smx = 0; for (const v of sino) if (v > smx) smx = v;
  const T = E[key] = {n, nA, sino, filt, sinoCv:bufCanvas(sino, n === 128 ? 128 : n, CM.gray, smx), accF:new Float32Array(n*n), accB:new Float32Array(n*n), done:0};
  // sinogram canvas: rows = angle, cols = detector
  const sc = document.createElement('canvas'); sc.width = n; sc.height = nA; const sx = sc.getContext('2d'), im = sx.createImageData(n, nA);
  for (let i = 0; i < nA*n; i++){ const v = sino[i]/smx*255; im.data[i*4] = im.data[i*4 + 1] = im.data[i*4 + 2] = v; im.data[i*4 + 3] = 255; }
  sx.putImageData(im, 0, 0); T.sinoCv = sc;
  return T;
}
function tomoTo(T, k){
  const n = T.n, c = (n - 1)/2;
  if (k < T.done){ T.accF.fill(0); T.accB.fill(0); T.done = 0; }
  for (let a = T.done; a < k; a++){ const th = a*Math.PI/T.nA, co = Math.cos(th), si = Math.sin(th);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++){ const s = (x - c)*co + (y - c)*si + c, i0 = Math.floor(s), f = s - i0;
      if (i0 < 0 || i0 >= n - 1) continue; const o = a*n + i0;
      T.accF[y*n + x] += T.filt[o]*(1 - f) + T.filt[o + 1]*f; T.accB[y*n + x] += T.sino[o]*(1 - f) + T.sino[o + 1]*f; } }
  T.done = k;
}

/* ---------- PET events ---------- */
function petSampler(){
  const E = G.env; if (E.petS) return E.petS;
  const g = grayOf('fdg', 'normal', 128); if (!g) return null;
  const n = 128, cdf = new Float32Array(n*n); let s = 0; for (let i = 0; i < n*n; i++){ s += Math.pow(g[i], 1.6); cdf[i] = s; }
  const R = rnd(7);
  const sample = () => { const u = R()*s; let lo = 0, hi = n*n - 1; while (lo < hi){ const m = (lo + hi) >> 1; if (cdf[m] < u) lo = m + 1; else hi = m; } return [(lo % n) + R() - 0.5, Math.floor(lo/n) + R() - 0.5]; };
  return E.petS = {sample, R, acc:new Float32Array(n*n), count:0, n};
}
function petAdd(P, k){
  const n = P.n;
  while (P.count < k){ const [px, py] = P.sample(), a = P.R()*Math.PI, co = Math.cos(a), si = Math.sin(a);
    for (let t = -90; t <= 90; t++){ const x = Math.round(px + t*co), y = Math.round(py + t*si); if (x >= 0 && y >= 0 && x < n && y < n) P.acc[y*n + x] += 1; }
    P.count++; }
}


/* ---------- slices synthesised from the real tissue maps (hands-on controls) ---------- */
function volSliceAxial(zmm){
  const E = G.env, key = 'ax' + zmm; if (E[key]) return E[key];
  if (!ready || !VOL || !VOL.B) return null;
  const [w, h, d] = VOL.dims, lo = VOL.lo, k = Math.round(zmm + 72) - lo[2];
  if (k < 0 || k >= d) return null;
  const n = w*h, f = {w, h, t1:new Float32Array(n), gm:new Float32Array(n), wm:new Float32Array(n), csf:new Float32Array(n), bone:new Float32Array(n), air:new Float32Array(n), ic:new Float32Array(n)};
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++){
    const o = ((k*h + j)*w + i)*4, q = (h - 1 - j)*w + i;   // anterior at the top, patient's right on the left
    f.t1[q] = VOL.A[o]/255; f.gm[q] = VOL.A[o + 1]/255; f.wm[q] = VOL.A[o + 2]/255; f.csf[q] = VOL.A[o + 3]/255;
    f.bone[q] = VOL.B[o]/255; f.ic[q] = VOL.B[o + 1] > 0 ? 1 : 0; f.air[q] = VOL.B[o + 3]/255;
  }
  return E[key] = f;
}
// spin-echo signal from tissue fractions: S = Σ f·PD·(1 − e^(−TR/T1))·e^(−TE/T2), 3 T relaxation times
const TISSUE_3T = {wm:[840, 75, 0.70], gm:[1350, 95, 0.80], csf:[4200, 2000, 1.0], fat:[380, 110, 0.90], soft:[1400, 40, 0.72]};
function gauss2(q){ const u = hashf(q*1.37 + 0.5) || 1e-6, v = hashf(q*2.11 + 9.1); return Math.sqrt(-2*Math.log(Math.max(1e-6, u)))*Math.cos(TAU*v); }
function synthMR(F, TR, TE){
  const sig = k => { const [t1, t2, pd] = TISSUE_3T[k]; return pd*(1 - Math.exp(-TR/t1))*Math.exp(-TE/t2); };
  const sW = sig('wm'), sG = sig('gm'), sC = sig('csf'), sF = sig('fat'), sS = sig('soft');
  const n = F.w*F.h, out = new Float32Array(n); let mx = 1e-6;
  for (let q = 0; q < n; q++){
    const brain = Math.min(1, F.gm[q] + F.wm[q] + F.csf[q]);
    const rest = Math.max(0, 1 - brain - F.bone[q] - F.air[q]), t = F.t1[q];
    const fat = rest*Math.min(1, Math.max(0, (t - 0.62)/0.2)), soft = rest*(t > 0.07 ? 1 : 0)*(1 - Math.min(1, Math.max(0, (t - 0.62)/0.2)));
    const v = F.wm[q]*sW + F.gm[q]*sG + F.csf[q]*sC + fat*sF + soft*sS;
    out[q] = v; if (v > mx) mx = v;
  }
  // window to the brain (as a scanner's auto-scaling does), so scalp fat may clip; then add receiver noise
  const br = []; for (let q = 0; q < n; q++) if (F.gm[q] + F.wm[q] + F.csf[q] > 0.6) br.push(out[q]);
  br.sort((x, y)=>x - y); const ref = (br.length ? br[Math.floor(br.length*0.995)] : mx)*1.08;
  for (let q = 0; q < n; q++){ const a = out[q] + ref*0.018*gauss2(q), b = ref*0.018*gauss2(q + 7919*n); out[q] = Math.sqrt(a*a + b*b); }  // Rician magnitude
  return {buf:out, ref};
}
function synthCT(F){
  const n = F.w*F.h, hu = new Float32Array(n);
  for (let q = 0; q < n; q++){
    const brain = F.gm[q] + F.wm[q] + F.csf[q], t = F.t1[q];
    let v = brain > 0.02 ? (F.gm[q]*37 + F.wm[q]*27 + F.csf[q]*6)/Math.max(brain, 1e-3) : (t > 0.07 ? (t > 0.66 ? -95 : 45) : -1000);
    if (F.ic[q] && brain < 0.02) v = 6;
    v = v*(1 - F.bone[q]) + 1350*F.bone[q];
    v = v*(1 - F.air[q]) - 1000*F.air[q];
    hu[q] = v + (F.air[q] > 0.5 ? 0 : 4.5*gauss2(q*3 + 11));   // quantum noise, ≈ 4–5 HU in a routine head CT
  }
  return hu;
}
function floatCanvas(F, buf, map){
  const c = document.createElement('canvas'); c.width = F.w; c.height = F.h; const x = c.getContext('2d'), im = x.createImageData(F.w, F.h);
  for (let q = 0; q < F.w*F.h; q++){ const g = Math.max(0, Math.min(255, map(buf[q]))); im.data[q*4] = im.data[q*4 + 1] = im.data[q*4 + 2] = g; im.data[q*4 + 3] = 255; }
  x.putImageData(im, 0, 0); return c;
}
function imgFit(cv, x, y, w, h){ // draw keeping aspect, film behind
  rr(x, y, w, h, 3, KC.film); if (!cv) return;
  const s = Math.min(w/cv.width, h/cv.height), dw = cv.width*s, dh = cv.height*s; const c = G.ctx; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(cv, x + (w - dw)/2, y + (h - dh)/2, dw, dh);
}

/* =====================================================================
   MRI
   ===================================================================== */
const T1 = {wm:840, gm:1350, csf:4200}, T2 = {wm:75, gm:95, csf:2000}, PD = {wm:0.7, gm:0.8, csf:1};
const TIS = [['wm','Sustancia blanca',KC.ink],['gm','Sustancia gris','#8b9aa1'],['csf','LCR',KC.sig]];
function mriMagnet(p, t, opts = {}){
  const a = smooth(0, 0.4, p);
  // field lines: through the bore, returning outside the magnet
  fade(0.25 + 0.75*a, ()=>{
    const c = G.ctx;
    [[470, 150], [440, 205], [530, 850], [560, 795]].forEach(([yb, yo], i)=>{
      c.beginPath(); c.moveTo(110, yb); c.lineTo(890, yb); c.bezierCurveTo(1000, yb, 1000, yo, 890, yo); c.lineTo(110, yo); c.bezierCurveTo(0, yo, 0, yb, 110, yb);
      _st(KC.sig, 1.1, [6, 7]); c.lineDashOffset = -t*26*G.u*(1); c.globalAlpha *= 0.55; c.stroke(); c.globalAlpha /= 0.55; c.setLineDash([]); c.lineDashOffset = 0; });
    for (const yb of [500]){ c.beginPath(); c.moveTo(110, yb); c.lineTo(890, yb); _st(KC.sig, 1.4, [6, 7]); c.lineDashOffset = -t*26*G.u; c.stroke(); c.setLineDash([]); c.lineDashOffset = 0; }
  });
  // housing
  for (const y of [255, 615]){ rr(170, y, 660, 130, 30, KC.paper, KC.ink2, 1.4); rr(186, y + 14, 628, 102, 20, null, KC.line, 1, [3, 4]); }
  for (let i = 0; i < 9; i++) for (const y of [320, 680]){ circ(232 + i*67, y, 15, KC.soft, KC.ink2, 1); fade(a, ()=>circ(232 + i*67, y, 15, KC.sig)); fade(a, ()=>txt(y === 320 ? '⊙' : '⊗', 232 + i*67, y + 5*G.u, {align:'center', color:'#fff', size:12})); }
  // patient
  rr(60, 592, 880, 14, 4, KC.soft2);
  rr(470, 528, 400, 62, 28, KC.soft, KC.ink2, 1.2); circ(432, 552, 38, KC.soft, KC.ink2, 1.2);
  if (opts.bare) return;
  fade(smooth(0.05, 0.3, p), ()=>{
    callout(299, 320, 380, 160, 'bobina superconductora, 4 K', {maxW:420});
    txt('B₀ = 3 T', 630, 488, {color:KC.sig, size:13, weight:500});
    arrow(560, 470, 760, 470, KC.sig, 1.6);
  });
  fade(smooth(0.3, 0.6, p), ()=>{
    ln(905, 385, 905, 615, KC.ink2, 1); ln(895, 385, 915, 385, KC.ink2, 1); ln(895, 615, 915, 615, KC.ink2, 1);
    txt('70 cm', 920, 505, {size:11});
    callout(440, 575, 520, 880, 'cabeza en el centro del campo', {maxW:420});
  });
}
const mriSpins = (()=>{ const R = rnd(11), s = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) s.push({x:150 + c*86, y:270 + r*105, a0:R()*TAU, ph:R()*TAU, anti:R() < 0.12}); return s; })();
const SCENES = {
mri:[
  (p, t)=>mriMagnet(p, t),
  (p, t)=>{
    const a = smooth(0.08, 0.6, p), tilt = 0.42, L = 48;
    arrow(70, 800, 70, 230, KC.sig, 2, 12); txt('B₀', 82, 250, {color:KC.sig, size:14, weight:500});
    for (const s of mriSpins){
      const ph = s.ph + t*2.6, up = s.anti ? 1 : -1;
      const ax = Math.sin(tilt)*Math.cos(ph)*L, ay = up*Math.cos(tilt)*L + Math.sin(tilt)*Math.sin(ph)*L*0.3;
      const rx = Math.cos(s.a0)*L, ry = Math.sin(s.a0)*L;
      const dx = lerp(rx, ax, a), dy = lerp(ry, ay, a);
      fade(a*0.6, ()=>ell(s.x, s.y + up*Math.cos(tilt)*L, Math.sin(tilt)*L, Math.sin(tilt)*L*0.3, null, KC.line, 1, [2, 3]));
      arrow(s.x, s.y, s.x + dx, s.y + dy, s.anti ? KC.muted : KC.ink, 1.6, 7);
      circ(s.x, s.y, 7, KC.paper, KC.ink2, 1.2);
    }
    const M = 230*a;
    fade(a, ()=>{ arrow(840, 700, 840, 700 - M, KC.sig, 4.5, 16); txt('M', 862, 700 - M*0.55, {color:KC.sig, size:16, weight:500}); label('magnetización neta', 840, 740, {align:'center', color:KC.ink2}); });
    fade(smooth(0.5, 0.8, p), ()=>{ rr(150, 820, 510, 92, 4, KC.soft); txt('f = γB₀', 172, 856, {size:15, color:KC.ink, weight:500}); txt('= 42.58 MHz/T × 3 T ≈ 128 MHz', 172, 890, {size:11.5}); });
    fade(1 - a, ()=>txt('Sin campo: los espines apuntan en cualquier dirección', 410, 820, {align:'center', color:KC.muted, size:11}));
  },
  (p, t, E)=>{
    const al = E.ctl && E.ctl.flip != null ? E.ctl.flip*Math.PI/180 : Math.PI/2*smooth(0.12, 0.62, p), ph = t*2.4, O = [380, 560], R = 220, c30 = Math.cos(Math.PI/6), s30 = 0.5;
    E.cur = Object.assign(E.cur || {}, {flip:Math.round(al*180/Math.PI)});
    const P = (x, y, z) => [O[0] + (y - x)*R*c30, O[1] + (x + y)*R*s30 - z*R];
    // axes and transverse plane
    curve(u=>P(Math.cos(u), Math.sin(u), 0), 0, TAU, 72, KC.line, 1, [4, 4]);
    arrow(...P(0,0,0), ...P(0,0,1.25), KC.ink2, 1.3); txt('z (B₀)', ...P(0,0,1.32), {size:11, align:'center'});
    arrow(...P(0,0,0), ...P(1.25,0,0), KC.ink2, 1.1); txt('x', ...P(1.36,0,0), {size:11});
    arrow(...P(0,0,0), ...P(0,1.25,0), KC.ink2, 1.1); txt('y', ...P(0,1.36,0), {size:11});
    // precession path at the current flip angle
    curve(u=>P(Math.sin(al)*Math.cos(u), Math.sin(al)*Math.sin(u), Math.cos(al)), 0, TAU, 72, KC.sig, 1, [3, 4]);
    // flip arc
    fade(al > 0.05 ? 1 : 0, ()=>curve(u=>P(Math.sin(u)*Math.cos(ph), Math.sin(u)*Math.sin(ph), Math.cos(u)), 0, al, 24, KC.amber, 1.4));
    const tip = P(Math.sin(al)*Math.cos(ph), Math.sin(al)*Math.sin(ph), Math.cos(al));
    arrow(...P(0,0,0), ...tip, KC.sig, 4, 15); txt('M', tip[0] + 14, tip[1] - 8, {color:KC.sig, size:15, weight:500});
    txt(`flip angle ${Math.round(al*180/Math.PI)}°`, 120, 880, {size:12, color:KC.amber});
    // RF pulse panel
    const fx = 640, fw = 300, pr = smooth(0.1, 0.62, p);
    box(fx, 170, fw, 150, 'Pulso de RF · 128 MHz');
    curve(u=>{ const x = (u - 0.5)*12, env = Math.abs(x) < 1e-3 ? 1 : Math.sin(x)/x; return [fx + 12 + u*(fw - 24), 245 - 58*env*Math.sin(u*90)*(u <= pr ? 1 : 0)]; }, 0, 1, 260, KC.ink, 1.1);
    // FID panel
    box(fx, 640, fw, 150, 'Señal en la bobina receptora');
    const amp = Math.abs(Math.sin(al));
    curve(u=>[fx + 12 + u*(fw - 24), 715 - 58*amp*Math.exp(-u*3)*Math.cos(u*60 - t*6)], 0, 1, 240, KC.sig, 1.3);
    fade(1 - amp*2, ()=>txt(al > 2.5 ? 'invertida · aún sin señal' : 'sin M transversal · sin señal', fx + fw/2, 720, {align:'center', color:KC.muted, size:10.5}));
    txt(`signal ∝ sin α = ${amp.toFixed(2)}`, fx, 820, {size:11, color:KC.ink});
  },
  (p, t, E)=>{
    const w = smooth(0.3, 0.75, p);
    const TR = E.ctl && E.ctl.tr != null ? E.ctl.tr : lerp(500, 4000, w), TE = E.ctl && E.ctl.te != null ? E.ctl.te : lerp(10, 100, w);
    E.cur = Object.assign(E.cur || {}, {tr:Math.round(TR), te:Math.round(TE)});
    const g1 = {x:60, y:150, w:300, h:200}, g2 = {x:60, y:420, w:300, h:200};
    box(g1.x, g1.y, g1.w, g1.h, 'Recuperación T1 · Mz'); box(g2.x, g2.y, g2.w, g2.h, 'Decaimiento T2 · Mxy');
    for (const [k, , col] of TIS){
      curve(u=>[g1.x + u/5000*g1.w, g1.y + g1.h - 10 - PD[k]*(1 - Math.exp(-u/T1[k]))*(g1.h - 30)], 0, 5000, 80, col, 1.6);
      const mz = PD[k]*(1 - Math.exp(-TR/T1[k]));
      curve(u=>[g2.x + u/300*g2.w, g2.y + g2.h - 10 - mz*Math.exp(-u/T2[k])*(g2.h - 30)], 0, 300, 80, col, 1.6);
      circ(g1.x + Math.min(TR, 5000)/5000*g1.w, g1.y + g1.h - 10 - mz*(g1.h - 30), 5, col);
      circ(g2.x + Math.min(TE, 300)/300*g2.w, g2.y + g2.h - 10 - mz*Math.exp(-TE/T2[k])*(g2.h - 30), 5, col);
    }
    const trx = g1.x + Math.min(TR, 5000)/5000*g1.w, tex = g2.x + Math.min(TE, 300)/300*g2.w;
    ln(trx, g1.y, trx, g1.y + g1.h, KC.amber, 1.4, [4, 3]); txt(`TR ${Math.round(TR)}`, trx + 6, g1.y + 18, {color:KC.amber, size:10.5});
    ln(tex, g2.y, tex, g2.y + g2.h, KC.amber, 1.4, [4, 3]); txt(`TE ${Math.round(TE)}`, tex + 6, g2.y + 18, {color:KC.amber, size:10.5});
    TIS.forEach(([k, nm, col], i)=>{ const y = 660 + i*34; rr(g1.x, y, 12, 12, 2, col); const S = PD[k]*(1 - Math.exp(-TR/T1[k]))*Math.exp(-TE/T2[k]); txt(`${nm}  ${S.toFixed(2)}`, g1.x + 20, y + 11, {size:10.5, color:KC.ink}); });
    // the image itself: computed from this brain's grey/white/CSF maps with the spin-echo equation
    const F = volSliceAxial(10), X = 400, Y = 150, S = 540;
    if (!F){ placeholder(X, Y, S, S); return; }
    const key = Math.round(TR/10) + '|' + Math.round(TE);
    if (E.mrKey !== key){ E.mrKey = key; const r = synthMR(F, TR, TE); E.mrCv = floatCanvas(F, r.buf, v=>255*Math.pow(v/r.ref, 0.9)); }
    imgFit(E.mrCv, X, Y, S, S);
    const kind = TR > 1800 && TE > 60 ? ['Ponderada en T2', 'LCR hiperintenso · sustancia blanca más oscura que la gris'] : TR < 900 && TE < 30 ? ['Ponderada en T1', 'LCR hipointenso · sustancia blanca más brillante que la gris'] : TR > 1800 && TE < 35 ? ['Ponderada en densidad protónica', 'el contraste sigue el contenido de agua'] : ['Ponderación mixta', 'ni T1 ni T2 predomina'];
    txt(kind[0], X, Y + S + 32, {size:13, color:KC.ink, font:'body', weight:600}); txt(kind[1], X, Y + S + 56, {size:10.5});
    head(`Eco de espín · TR ${Math.round(TR)} ms · TE ${Math.round(TE)} ms`, X, Y - 12);
  },
  (p, t)=>{
    const n = 128, m = Math.round(smooth(0.04, 0.92, p)*64), K = kspace();
    const A = {x:80, y:250, s:390}, B = {x:530, y:250, s:390};
    box(A.x, A.y, A.s, A.s, 'espacio k (datos crudos)'); box(B.x, B.y, B.s, B.s, 'Imagen = FFT inversa');
    if (!K){ placeholder(A.x, A.y, A.s, A.s); placeholder(B.x, B.y, B.s, B.s); return; }
    rr(A.x, A.y, A.s, A.s, 3, KC.film);
    const row = A.s/n;
    clip(c=>c.rect(A.x, A.y + (n/2 - m)*row, A.s, (2*m + 1)*row), ()=>img(K.kcv, A.x, A.y, A.s, A.s));
    if (m < 64){ const flick = (Math.floor(t*12) % 2) ? 1 : 0, yy = flick ? A.y + (n/2 - m)*row : A.y + (n/2 + m + 1)*row; ln(A.x, yy, A.x + A.s, yy, KC.sig, 2.5); }
    img(kRecon(m), B.x, B.y, B.s, B.s);
    txt(`${2*m + 1} de ${n} líneas`, A.x, A.y + A.s + 30, {size:11.5, color:KC.ink});
    txt('rellenado desde el centro hacia fuera', A.x, A.y + A.s + 54, {size:10.5});
    txt(m < 10 ? 'Solo el centro: contraste, sin detalle' : m < 40 ? 'Los bordes añaden detalle fino' : 'Todas las líneas: resolución completa', B.x, B.y + B.s + 30, {size:11.5, color:KC.ink});
    // gradient coils
    const gx = 80; head('Gradientes', gx, 160);
    [['Gz','corte'],['Gy','fase'],['Gx','frecuencia']].forEach(([g, w], i)=>{ const x = gx + 140 + i*230, on = Math.floor(t*2 + i) % 3 === 0;
      poly([[x, 175], [x + 46, 140], [x + 46, 175]], on ? KC.sig : KC.soft2); txt(g, x + 56, 165, {size:12, color:KC.ink, weight:500}); txt(w, x + 56, 182, {size:10}); });
  },
],

/* =====================================================================
   CT
   ===================================================================== */
ct:[
  (p, t, E)=>{
    const pr3 = mini3d('ct', 40, 110, 920, 800, t, p, E);
    if (pr3){
      const tp = pr3('tube'), dt = pr3('det'), tb = pr3('table'), a3 = smooth(0, 0.3, p);
      fade(a3, ()=>{ if (tp) callout(tp[0], tp[1], tp[0] < 500 ? 250 : 750, 170, 'Tubo de rayos X', {maxW:160}); if (dt) callout(dt[0], dt[1], dt[0] < 500 ? 250 : 750, 840, 'Arco de detectores', {maxW:160}); if (tb) callout(tb[0], tb[1], 800, 900, 'Camilla del paciente', {maxW:160}); });
      fade(smooth(0.25, 0.55, p), ()=>{ txt('una vuelta ≈ 0.3 s', 40, 70, {size:12, color:KC.ink}); txt('ralentizado aquí · arrastre para girar', 40, 94, {size:10.5}); txt('120 kV · 64–320 filas', 960, 70, {size:12, color:KC.ink, align:'right'}); });
      return;
    }
    const a = smooth(0, 0.3, p), th = t*1.5, C = [500, 500];
    circ(C[0], C[1], 440, KC.paper, KC.ink2, 1.4); circ(C[0], C[1], 255, KC.bg || '#f1f4f5', KC.ink2, 1.4);
    circ(C[0], C[1], 350, null, KC.line, 1, [3, 5]);
    const tp = [C[0] + 350*Math.sin(th), C[1] - 350*Math.cos(th)], dA = th + Math.PI;
    const d1 = [C[0] + 350*Math.sin(dA - 0.45), C[1] - 350*Math.cos(dA - 0.45)], d2 = [C[0] + 350*Math.sin(dA + 0.45), C[1] - 350*Math.cos(dA + 0.45)];
    fade(0.3 + 0.7*a, ()=>poly([tp, d1, d2], 'rgba(0,80,255,.10)', 'rgba(0,80,255,.35)', 1));
    ell(C[0], C[1], 120, 150, KC.soft2, KC.ink2, 1.2); ell(C[0], C[1], 104, 134, KC.soft, null);
    rr(380, 655, 240, 14, 3, KC.soft2);
    for (let k = -7; k <= 7; k++){ const ang = dA + k*0.06; const x = C[0] + 350*Math.sin(ang), y = C[1] - 350*Math.cos(ang); const c = G.ctx; c.save(); c.translate(x, y); c.rotate(ang); rr(-9, -16, 18, 32, 2, KC.sig); c.restore(); }
    { const c = G.ctx; c.save(); c.translate(...tp); c.rotate(th); rr(-34, -26, 68, 52, 6, KC.ink); circ(0, 10, 6, KC.amber); c.restore(); }
    fade(a, ()=>{ txt('Tubo de rayos X', tp[0], tp[1] + (Math.cos(th) > 0 ? -44 : 58), {align:'center', size:11, color:KC.ink}); txt('Detectores', (d1[0] + d2[0])/2, (d1[1] + d2[1])/2 + (Math.cos(dA) > 0 ? -40 : 50), {align:'center', size:11, color:KC.sig}); });
    fade(smooth(0.25, 0.55, p), ()=>{ txt('una vuelta ≈ 0.3 s', 40, 70, {size:12, color:KC.ink}); txt('ralentizado aquí', 40, 94, {size:10.5}); txt('120 kV · 64–320 filas', 960, 70, {size:12, color:KC.ink, align:'right'}); });
  },
  (p, t)=>{
    const C = [330, 520], y = 480, a = smooth(0, 0.6, p);
    ell(C[0], C[1], 190, 235, KC.soft2, KC.ink2, 1.2); ell(C[0], C[1], 168, 213, KC.soft, null);
    ell(C[0] - 22, C[1] - 10, 22, 50, '#dbe7f5', null); ell(C[0] + 22, C[1] - 10, 22, 50, '#dbe7f5', null);
    rr(30, y - 26, 50, 52, 6, KC.ink); rr(600, y - 60, 22, 120, 3, KC.sig);
    const xs = [80, 145, 165, 495, 515, 600], I = [1, 1, 0.62, 0.42, 0.26, 0.26];
    for (let i = 0; i < xs.length - 1; i++) ln(xs[i], y, xs[i + 1], y, KC.sig, 1 + 7*I[i]);
    for (let k = 0; k < 14; k++){ const u = ((t*0.45 + k/14) % 1), x = 80 + u*520, alive = hashf(k) < (x < 155 ? 1 : x < 505 ? 0.62 : 0.3); if (alive) circ(x, y, 5, KC.sig); }
    txt('I = I₀ · e^(−μx)', 330, 410, {align:'center', size:14, color:KC.ink, weight:500});
    txt('el hueso absorbe la mayor parte', 155, 560, {align:'center', size:10.5}); ln(155, 500, 155, 540, KC.line, 1);
    // HU table
    const rows = [['Aire', -1000], ['Grasa', -100], ['Agua', 0], ['Sustancia blanca', 25], ['Sustancia gris', 35], ['Sangre fresca', 70], ['Hueso', 1000]];
    head('Unidades Hounsfield', 680, 200); head('tal como se ven en una ventana cerebral', 680, 222, {color:KC.muted});
    rows.forEach(([nm, hu], i)=>{ const yy = 260 + i*82, show = smooth(i/rows.length*0.8, i/rows.length*0.8 + 0.12, p);
      fade(show, ()=>{ const g = Math.round(Math.max(0, Math.min(1, hu/80))*255); rr(680, yy, 52, 52, 2, `rgb(${g},${g},${g})`, KC.line, 1);
        txt(nm, 750, yy + 22, {size:12, font:'body', color:KC.ink}); txt((hu > 0 ? '+' : hu < 0 ? '−' : '') + Math.abs(hu) + ' HU', 750, yy + 44, {size:10.5}); }); });
  },
  (p, t)=>{
    const T = tomo('ctb', 'normal'), ang = Math.PI*smooth(0, 0.95, p), C = [250, 500], R = 190;
    circ(C[0], C[1], R + 30, KC.paper, KC.line, 1); ell(C[0], C[1], 70, 88, KC.soft2, KC.ink2, 1); ell(C[0], C[1], 60, 78, KC.soft, null);
    const tp = [C[0] - R*Math.cos(ang), C[1] - R*Math.sin(ang)], dp = [C[0] + R*Math.cos(ang), C[1] + R*Math.sin(ang)], nx = -Math.sin(ang)*95, ny = Math.cos(ang)*95;
    poly([tp, [dp[0] + nx, dp[1] + ny], [dp[0] - nx, dp[1] - ny]], 'rgba(0,80,255,.08)');
    ln(dp[0] + nx, dp[1] + ny, dp[0] - nx, dp[1] - ny, KC.sig, 5); circ(tp[0], tp[1], 13, KC.ink);
    G.ctx.beginPath(); G.ctx.arc(C[0], C[1], R + 48, Math.PI, Math.PI + ang); _st(KC.amber, 2); G.ctx.stroke();
    txt(`${Math.round(ang*180/Math.PI)}°`, C[0], C[1] - R - 66, {align:'center', size:13, color:KC.amber, weight:500});
    const S = {x:520, y:200, w:400, h:620};
    box(S.x, S.y, S.w, S.h, 'Sinograma');
    if (!T){ placeholder(S.x, S.y, S.w, S.h); return; }
    rr(S.x, S.y, S.w, S.h, 3, KC.film);
    const rows = ang/Math.PI;
    clip(c=>c.rect(S.x, S.y, S.w, S.h*rows), ()=>img(T.sinoCv, S.x, S.y, S.w, S.h));
    ln(S.x, S.y + S.h*rows, S.x + S.w, S.y + S.h*rows, KC.sig, 2);
    txt('posición del detector →', S.x, S.y + S.h + 26, {size:10.5}); txt('ángulo ↓', S.x + S.w, S.y + S.h + 26, {size:10.5, align:'right'});
  },
  (p, t)=>{
    const T = tomo('ctb', 'normal'), k = Math.round(smooth(0.03, 0.9, p)*180);
    const A = {x:80, y:260, s:390}, B = {x:530, y:260, s:390};
    box(A.x, A.y, A.s, A.s, 'Solo retroproyección'); box(B.x, B.y, B.s, B.s, 'Retroproyección con filtro de rampa');
    if (!T){ placeholder(A.x, A.y, A.s, A.s); placeholder(B.x, B.y, B.s, B.s); return; }
    tomoTo(T, k);
    if (G.env.ctK !== k){ G.env.ctK = k; G.env.ctA = bufCanvas(T.accB, T.n, CM.gray); const f = Float32Array.from(T.accF, v=>Math.max(0, v)); G.env.ctB = bufCanvas(f, T.n, CM.gray, k ? undefined : 1); }
    img(G.env.ctA, A.x, A.y, A.s, A.s); img(G.env.ctB, B.x, B.y, B.s, B.s);
    const ang = (k - 1)*Math.PI/180;
    for (const P of [A, B]) if (k > 0 && k < 180){ const cx = P.x + P.s/2, cy = P.y + P.s/2, r = P.s*0.5; ln(cx - Math.sin(ang)*r, cy + Math.cos(ang)*r, cx + Math.sin(ang)*r, cy - Math.cos(ang)*r, 'rgba(0,80,255,.7)', 1.5, [5, 4]); }
    txt(`${k} de 180 ángulos`, A.x, A.y + A.s + 32, {size:11.5, color:KC.ink});
    txt('los perfiles difuminados se acumulan como un desenfoque 1/r', A.x, A.y + A.s + 56, {size:10.5, maxW:A.s});
    txt('el filtro de rampa restaura los bordes', B.x, B.y + B.s + 32, {size:11.5, color:KC.ink, maxW:B.s});
  },
  (p, t, E)=>{
    const W = E.ctl && E.ctl.ww != null ? E.ctl.ww : (p < 0.5 ? 80 : 2000), L = E.ctl && E.ctl.wl != null ? E.ctl.wl : (p < 0.5 ? 40 : 500);
    E.cur = Object.assign(E.cur || {}, {ww:W, wl:L});
    const F = volSliceAxial(4), X = 70, Y = 150, S = 560;
    head(`Ventana ${Math.round(W)} · Nivel ${Math.round(L)} HU`, X, Y - 12);
    if (!F){ placeholder(X, Y, S, S); return; }
    if (!E.hu) E.hu = synthCT(F);
    const key = Math.round(W) + '|' + Math.round(L);
    if (E.ctKey !== key){ E.ctKey = key; const lo = L - W/2; E.ctCv = floatCanvas(F, E.hu, v=>(v - lo)/W*255); }
    imgFit(E.ctCv, X, Y, S, S);
    // the grey ramp: which HU values map to black and white
    const gx = 680, gy = 150, gh = 560;
    for (let i = 0; i < 112; i++){ const hu = 1400 - i*25, g = Math.max(0, Math.min(255, (hu - (L - W/2))/W*255)); rr(gx, gy + i*5, 26, 5, 0, `rgb(${g},${g},${g})`); }
    // tissue markers; labels are spread apart when the scale squeezes them together
    let lastY = -1e9;
    [['Hueso', 1000], ['Sangre fresca', 70], ['Sustancia gris', 37], ['Sustancia blanca', 27], ['LCR', 6], ['Grasa', -95], ['Aire', -1000]].forEach(([nm, hu])=>{
      const y = gy + (1400 - hu)/25*5; if (y < gy || y > gy + gh) return; const ly = Math.max(y, lastY + 17); lastY = ly;
      ln(gx + 28, y, gx + 36, y, KC.ink2, 1); ln(gx + 36, y, gx + 44, ly, KC.ink2, 0.8); txt(`${nm} ${hu > 0 ? '+' : ''}${hu}`, gx + 48, ly + 4, {size:10.5, color:KC.ink}); });
    const wy0 = gy + (1400 - (L + W/2))/25*5, wy1 = gy + (1400 - (L - W/2))/25*5;
    rr(gx - 10, Math.max(gy, wy0), 4, Math.max(2, Math.min(gy + gh, wy1) - Math.max(gy, wy0)), 1, KC.sig);
    txt('Solo esta banda de HU se reparte del negro al blanco', X, Y + S + 32, {size:11, color:KC.ink, maxW:S});
  },
],

/* =====================================================================
   PET
   ===================================================================== */
pet:[
  (p, t)=>{
    const C = [290, 470], r = 110, V = [-60, 0, 60, 120, 180, 240].map(d=>[C[0] + r*Math.cos(d*Math.PI/180), C[1] + r*Math.sin(d*Math.PI/180)]);
    for (let i = 0; i < 6; i++){ const a = V[i], b = V[(i + 1) % 6]; if (i === 5 || i === 0){ const m = 0.22; const A = i === 0 ? [a[0] + (b[0] - a[0])*m, a[1] + (b[1] - a[1])*m] : a, B = i === 5 ? [b[0] + (a[0] - b[0])*m, b[1] + (a[1] - b[1])*m] : b; ln(A[0], A[1], B[0], B[1], KC.ink, 2.2); } else ln(a[0], a[1], b[0], b[1], KC.ink, 2.2); }
    txt('O', V[0][0], V[0][1] + 6*G.u, {align:'center', size:15, color:KC.ink, font:'body', weight:600});
    const sub = (v, dx, dy, s, col = KC.ink, hl) => { const e = [v[0] + dx, v[1] + dy]; ln(v[0], v[1], e[0] - dx*0.25, e[1] - dy*0.25, col, 1.8); if (hl){ circ(e[0] + dx*0.25, e[1] + dy*0.25, 30 + 6*Math.sin(t*4), 'rgba(0,80,255,.14)'); } txt(s, e[0] + dx*0.25, e[1] + dy*0.25 + 6*G.u, {align:'center', size:14, color:col, font:'body', weight:600}); };
    sub(V[1], 80, 0, 'OH'); sub(V[2], 60, 70, '¹⁸F', KC.sig, true); sub(V[3], -60, 70, 'OH'); sub(V[4], -84, 0, 'HO'); sub(V[5], -60, -76, 'CH₂OH');
    txt('FDG', C[0], 760, {align:'center', size:16, color:KC.ink, font:'disp'}); txt('2-desoxi-2-[¹⁸F]fluoro-D-glucosa', C[0], 790, {align:'center', size:10.5});
    // decay curve
    const g = {x:570, y:250, w:360, h:330}; box(g.x, g.y, g.w, g.h, 'Actividad restante · semivida 110 min');
    const X = m => g.x + m/360*g.w, Y = v => g.y + g.h - 12 - v*(g.h - 36);
    fade(1, ()=>{ G.ctx.fillStyle = 'rgba(0,80,255,.08)'; G.ctx.fillRect(X(30), g.y, X(60) - X(30), g.h); G.ctx.fillStyle = 'rgba(232,150,42,.16)'; G.ctx.fillRect(X(60), g.y, X(80) - X(60), g.h); });
    const pr = smooth(0.05, 0.7, p);
    curve(m=>[X(m), Y(Math.exp(-Math.LN2*m/110))], 0, 360*pr, 90, KC.sig, 2);
    fade(smooth(0.3, 0.6, p), ()=>{ ln(X(110), Y(0.5), X(110), g.y + g.h, KC.ink2, 1, [3, 3]); ln(g.x, Y(0.5), X(110), Y(0.5), KC.ink2, 1, [3, 3]); txt('50 %', g.x + 6, Y(0.5) - 6, {size:10}); txt('110 min', X(110) + 6, g.y + g.h - 8, {size:10}); });
    txt('captación', X(45), g.y + 18, {align:'center', size:9.5, color:KC.sig}); txt('adquisición', X(70) + 4, g.y + 36, {align:'center', size:9.5, color:KC.amber});
    txt('0', g.x, g.y + g.h + 18, {size:9.5, color:KC.muted}); txt('6 h', g.x + g.w, g.y + g.h + 18, {size:9.5, color:KC.muted, align:'right'});
    fade(smooth(0.5, 0.8, p), ()=>txt('Atrapado como FDG-6-fosfato en el interior celular', g.x, g.y + g.h + 60, {size:11.5, color:KC.ink, maxW:g.w}));
  },
  (p, t)=>{
    const T = 3.4, u = (t % T)/T, N = [250, 540], M = [540, 470];
    const R = rnd(5), pts = [N]; for (let i = 1; i <= 9; i++){ const k = i/9; pts.push([lerp(N[0], M[0], k) + (i < 9 ? (R() - 0.5)*70 : 0), lerp(N[1], M[1], k) + (i < 9 ? (R() - 0.5)*70 : 0)]); }
    for (let i = 0; i < 12; i++){ const a = i*2.4, rr2 = 16*Math.sqrt(i); circ(N[0] + Math.cos(a)*rr2, N[1] + Math.sin(a)*rr2, 15, i % 2 ? '#c9d2d6' : '#9fadb3', KC.paper, 1); }
    txt('núcleo de ¹⁸F', N[0], N[1] + 90, {align:'center', size:11, color:KC.ink});
    const k1 = smooth(0, 0.42, u);
    if (u < 0.48){ const c = G.ctx; c.beginPath(); const nSeg = k1*(pts.length - 1); for (let i = 0; i <= Math.floor(nSeg); i++) i ? c.lineTo(...pts[i]) : c.moveTo(...pts[i]);
      const i0 = Math.floor(nSeg), f = nSeg - i0, q = i0 < pts.length - 1 ? [lerp(pts[i0][0], pts[i0 + 1][0], f), lerp(pts[i0][1], pts[i0 + 1][1], f)] : pts[pts.length - 1]; c.lineTo(...q); _st(KC.sig, 1.2, [3, 4]); c.stroke(); c.setLineDash([]);
      circ(q[0], q[1], 13, KC.sig); txt('+', q[0], q[1] + 5*G.u, {align:'center', color:'#fff', size:13, weight:600});
      const e = [M[0] + 30*Math.sin(t*3), M[1] - 20 + 14*Math.cos(t*2)]; circ(e[0], e[1], 13, KC.ink); txt('−', e[0], e[1] + 5*G.u, {align:'center', color:'#fff', size:13, weight:600});
      txt('positrón e⁺', 330, 380, {size:11, color:KC.sig}); txt('electrón e⁻', M[0] + 40, M[1] - 50, {size:11, color:KC.ink}); }
    if (u >= 0.44 && u < 0.62){ const f = smooth(0.44, 0.62, u); circ(M[0], M[1], 20 + 90*f, `rgba(232,150,42,${0.55*(1 - f)})`); }
    if (u >= 0.48){ const f = smooth(0.48, 1, u), ang = -0.32, L = 60 + 520*f;
      for (const sgn of [1, -1]){ const dx = Math.cos(ang)*sgn, dy = Math.sin(ang)*sgn, nx = -dy, ny = dx;
        curve(s=>[M[0] + dx*s + nx*12*Math.sin(s*0.22 - t*20), M[1] + dy*s + ny*12*Math.sin(s*0.22 - t*20)], Math.max(0, L - 170), L, 60, KC.amber, 2.2);
        txt('511 keV', M[0] + dx*L + (sgn > 0 ? -40 : 40), M[1] + dy*L - 26, {align:'center', size:12, color:KC.amber, weight:500}); }
      fade(f, ()=>txt('separados ≈ 180°', M[0], M[1] + 70, {align:'center', size:11, color:KC.ink})); }
    ln(N[0], 760, M[0], 760, KC.ink2, 1); ln(N[0], 750, N[0], 770, KC.ink2, 1); ln(M[0], 750, M[0], 770, KC.ink2, 1); txt('≈ 0.6 mm en tejido', (N[0] + M[0])/2, 795, {align:'center', size:10.5});
  },
  (p, t, E)=>{
    const pr3 = mini3d('pet', 40, 110, 920, 800, t, p, E);
    if (pr3){
      const rg = pr3('ring'), hd = pr3('head');
      fade(smooth(0, 0.3, p), ()=>{ if (rg) callout(rg[0], rg[1], 760, 860, 'Anillos de detectores de cristal', {maxW:180}); if (hd) callout(hd[0], hd[1], 250, 860, 'Aniquilación en el encéfalo', {maxW:180}); });
      txt(`${(E.petN || 0).toLocaleString('es-ES')} coincidencias`, 40, 70, {size:12, color:KC.ink}); txt('cada línea une dos detectores alcanzados en ≈ 4 ns', 40, 94, {size:10.5, maxW:420});
      txt('arrastre para girar', 960, 70, {size:10.5, align:'right'});
      return;
    }
    const C = [500, 500], R = 380, nB = 64, P = petSampler();
    const fdg = scanCanvas('fdg', 'normal');
    clip(c=>c.ellipse(C[0], C[1], 150, 190, 0, 0, TAU), ()=>{ rr(C[0] - 230, C[1] - 230, 460, 460, 0, KC.film); img(fdg, C[0] - 230, C[1] - 230, 460, 460, 0.55); });
    ell(C[0], C[1], 150, 190, null, KC.ink2, 1.2);
    E.ev = E.ev || []; E.lit = E.lit || new Float32Array(nB); E.n = E.n || 0; E.last = E.last || t;
    if (P && t - E.last > 0.035){ E.last = t; const [px, py] = P.sample(), x = C[0] + (px/128 - 0.5)*460, y = C[1] + (py/128 - 0.5)*460, a = P.R()*Math.PI, dx = Math.cos(a), dy = Math.sin(a);
      const ox = x - C[0], oy = y - C[1], b = ox*dx + oy*dy, cc = ox*ox + oy*oy - R*R, s = Math.sqrt(b*b - cc), t1 = -b + s, t2 = -b - s;
      const A = [x + dx*t1, y + dy*t1], B = [x + dx*t2, y + dy*t2]; E.ev.push({A, B, at:t, x, y}); E.n++; if (typeof sndClick === 'function') sndClick(0.7);
      for (const Q of [A, B]){ const ang = (Math.atan2(Q[1] - C[1], Q[0] - C[0]) + TAU) % TAU; E.lit[Math.floor(ang/TAU*nB) % nB] = 1; } }
    E.ev = E.ev.filter(e=>t - e.at < 0.9);
    for (const e of E.ev){ const f = 1 - (t - e.at)/0.9; fade(f, ()=>{ ln(e.A[0], e.A[1], e.B[0], e.B[1], KC.sig, 1.2); circ(e.x, e.y, 6, KC.amber); }); }
    for (let i = 0; i < nB; i++){ const ang = (i + 0.5)/nB*TAU, c = G.ctx; c.save(); c.translate(C[0] + Math.cos(ang)*(R + 22), C[1] + Math.sin(ang)*(R + 22)); c.rotate(ang); rr(-22, -15, 44, 30, 2, KC.paper, KC.ink2, 1); if (E.lit[i] > 0.02) rr(-22, -15, 44, 30, 2, `rgba(0,80,255,${E.lit[i]})`); c.restore(); E.lit[i] *= 0.9; }
    txt(`${E.n.toLocaleString('en-GB')} coincidences`, 40, 60, {size:12, color:KC.ink}); txt('coincidence window ≈ 4 ns', 960, 60, {size:10.5, align:'right'});
    if (!P) txt('Cargando el encéfalo…', C[0], C[1], {align:'center', color:KC.muted});
  },
  (p, t, E)=>{
    const P = petSampler(), A = {x:80, y:260, s:390}, B = {x:530, y:260, s:390};
    box(A.x, A.y, A.s, A.s, 'Líneas de respuesta, retroproyectadas'); box(B.x, B.y, B.s, B.s, 'Tras la reconstrucción OSEM');
    if (!P){ placeholder(A.x, A.y, A.s, A.s); placeholder(B.x, B.y, B.s, B.s); return; }
    const target = Math.round(smooth(0, 0.8, p)*60000);
    if (target < P.count){ P.acc.fill(0); P.count = 0; }
    petAdd(P, Math.min(target, P.count + 2500));
    if (E.petN !== P.count){ E.petN = P.count; E.petCv = bufCanvas(P.acc, P.n, CM.hot); }
    rr(A.x, A.y, A.s, A.s, 3, KC.film); img(E.petCv, A.x, A.y, A.s, A.s);
    rr(B.x, B.y, B.s, B.s, 3, KC.film); img(scanCanvas('fdg', 'normal'), B.x, B.y, B.s, B.s, smooth(0.55, 0.9, p));
    txt(`${P.count.toLocaleString('es-ES')} eventos`, A.x, A.y + A.s + 32, {size:11.5, color:KC.ink}); txt('una exploración real recoge decenas de millones', A.x, A.y + A.s + 56, {size:10.5, maxW:A.s});
    txt('iterativa, con corrección de atenuación', B.x, B.y + B.s + 32, {size:11.5, color:KC.ink, maxW:B.s});
  },
],

/* =====================================================================
   SPECT
   ===================================================================== */
spect:[
  (p, t)=>{
    const g = {x:90, y:230, w:830, h:420}, xs = [0, 0.16, 0.4, 0.64, 1], lab = ['0', '2 min', '1 h', '2 h', '6 h'];
    box(g.x, g.y, g.w, g.h, 'Tras una inyección (tiempo no a escala)');
    const X = u => g.x + u*g.w, Y = v => g.y + g.h - 20 - v*(g.h - 60);
    xs.forEach((u, i)=>{ ln(X(u), g.y + g.h, X(u), g.y + g.h + 8, KC.ink2, 1); txt(lab[i], X(u), g.y + g.h + 26, {align:'center', size:10}); });
    const pr = smooth(0.05, 0.7, p);
    curve(u=>[X(u), Y(u < 0.02 ? 0.25 : u < 0.1 ? 0.25 + 0.7*smooth(0.02, 0.06, u) - 0.3*smooth(0.07, 0.12, u) : 0.3 + 0.05*Math.sin(u*40))], 0, Math.min(1, pr*1.2), 200, KC.ink2, 1.4, [4, 3]);
    curve(u=>[X(u), Y(0.82*smooth(0.01, 0.16, u)*Math.exp(-0.45*Math.max(0, u - 0.16)))], 0, pr, 160, KC.sig, 2.4);
    fade(smooth(0.1, 0.3, p), ()=>{ circ(X(0.03), Y(0.95), 8, KC.amber); txt('Inyectar durante una crisis epiléptica', X(0.03) + 16, Y(0.95) + 4, {size:11, color:KC.ink}); });
    txt('flujo sanguíneo', X(0.86), Y(0.34) - 10, {size:10.5, color:KC.ink2}); fade(pr, ()=>txt('trazador retenido en el encéfalo', X(0.5), Y(0.86) - 12, {size:11, color:KC.sig}));
    fade(smooth(0.45, 0.75, p), ()=>{ G.ctx.fillStyle = 'rgba(232,150,42,.15)'; G.ctx.fillRect(X(0.4), g.y, X(0.64) - X(0.4), g.h); txt('adquisición', X(0.52), g.y + 22, {align:'center', size:10.5, color:KC.amber}); });
    fade(smooth(0.6, 0.9, p), ()=>txt('La imagen sigue mostrando el flujo en el momento de la inyección.', 90, 770, {size:12, color:KC.ink, maxW:820}));
  },
  (p, t, E)=>{
    for (let i = 0; i < 7; i++) circ(170 + i*110, 170, 42, KC.soft, KC.ink2, 1);
    txt('tubos fotomultiplicadores', 500, 110, {align:'center', size:10.5});
    rr(110, 220, 780, 48, 2, 'rgba(0,80,255,.10)', KC.sig, 1); txt('cristal de NaI', 900, 252, {size:10.5, color:KC.sig});
    for (let x = 110; x <= 890; x += 18) ln(x, 270, x, 380, KC.ink2, 2);
    txt('colimador de plomo', 900, 330, {size:10.5, color:KC.ink});
    ell(500, 720, 280, 170, KC.soft, KC.line, 1);
    const src = [[420, 690], [560, 740], [480, 780], [620, 680], [380, 760]];
    E.ph = E.ph || []; E.last = E.last || t; E.em = E.em || 0; E.pass = E.pass || 0; E.flash = E.flash || [];
    while (t - E.last > 0.03){ E.last += 0.03; const s = src[Math.floor(Math.random()*src.length)], straight = Math.random() < 0.18, a = straight ? (Math.random() - 0.5)*0.04 : (Math.random() - 0.5)*1.6; E.ph.push({s, a, t0:t}); E.em++; }
    E.ph = E.ph.filter(ph=>t - ph.t0 < 1.1);
    for (const ph of E.ph){ const d = (t - ph.t0)*900, dx = Math.sin(ph.a), dy = -Math.cos(ph.a); const pass = Math.abs(ph.a) < 0.03; const stopY = pass ? 268 : 380;
      const tot = (ph.s[1] - stopY)/-dy, L = Math.min(d, tot), x = ph.s[0] + dx*L, y = ph.s[1] + dy*L;
      ln(ph.s[0] + dx*Math.max(0, L - 90), ph.s[1] + dy*Math.max(0, L - 90), x, y, pass ? KC.amber : 'rgba(61,76,83,.45)', pass ? 2 : 1.2);
      if (d >= tot && !ph.hit){ ph.hit = true; if (pass){ E.pass++; E.flash.push({x, t0:t}); } }
      if (ph.hit && !pass) fade(1 - (t - ph.t0 - tot/900)*3, ()=>{ ln(x - 6, y - 6, x + 6, y + 6, KC.ink2, 1.4); ln(x - 6, y + 6, x + 6, y - 6, KC.ink2, 1.4); }); }
    E.flash = E.flash.filter(f=>t - f.t0 < 0.5); for (const f of E.flash) circ(f.x, 244, 26*(1 - (t - f.t0)*2) + 4, `rgba(0,80,255,${0.6*(1 - (t - f.t0)*2)})`);
    for (const s of src) circ(s[0], s[1], 7, KC.amber);
    txt('⁹⁹ᵐTc en el encéfalo · 140 keV', 500, 925, {align:'center', size:11, color:KC.ink});
    txt('Solo los fotones que viajan en vertical alcanzan el cristal', 500, 430, {align:'center', size:11, color:KC.ink, maxW:700});
  },
  (p, t, E)=>{
    const pr3 = mini3d('spect', 40, 110, 920, 800, t, p, E);
    if (pr3){
      const k3 = Math.round(smooth(0, 0.92, p)*120), h0 = pr3('head0');
      fade(smooth(0, 0.3, p), ()=>{ if (h0) callout(h0[0], h0[1], h0[0] < 500 ? 250 : 750, 180, 'Cabezal de cámara gamma', {maxW:170}); });
      txt(`${k3} de 120 vistas`, 40, 70, {size:12, color:KC.ink}); txt('separadas 3° · tres cabezales girando juntos', 40, 94, {size:10.5});
      txt('arrastre para girar', 960, 70, {size:10.5, align:'right'});
      fade(smooth(0.3, 0.6, p), ()=>txt('Solo se cuentan los fotones que viajan en línea recta por un orificio del colimador', 500, 930, {align:'center', size:11, color:KC.ink, maxW:700}));
      return;
    }
    const C = [500, 520], th = t*0.45, k = Math.round(smooth(0, 0.92, p)*120);
    for (let i = 0; i < 120; i++){ const a = i/120*TAU; ln(C[0] + Math.cos(a)*400, C[1] + Math.sin(a)*400, C[0] + Math.cos(a)*(i < k ? 430 : 412), C[1] + Math.sin(a)*(i < k ? 430 : 412), i < k ? KC.sig : KC.line, i < k ? 2 : 1); }
    ell(C[0], C[1], 140, 170, KC.soft2, KC.ink2, 1.2); ell(C[0], C[1], 124, 154, KC.soft, null);
    for (let h = 0; h < 3; h++){ const a = th + h*TAU/3, c = G.ctx; c.save(); c.translate(C[0] + Math.cos(a)*290, C[1] + Math.sin(a)*290); c.rotate(a + Math.PI/2); rr(-120, -32, 240, 64, 4, KC.paper, KC.ink2, 1.3); rr(-110, 18, 220, 10, 1, KC.sig); c.restore(); }
    txt(`${k} de 120 vistas`, 40, 70, {size:12, color:KC.ink}); txt('separadas 3°', 40, 94, {size:10.5}); txt('tres cabezales', 960, 70, {size:10.5, align:'right'});
  },
  (p, t, E)=>{
    const T = tomo('hmpao', 'normal'), k = Math.round(smooth(0.03, 0.8, p)*180), A = {x:70, y:250, s:440};
    box(A.x, A.y, A.s, A.s, 'Perfusión con HMPAO, reconstruyendo');
    if (!T) placeholder(A.x, A.y, A.s, A.s);
    else { tomoTo(T, k); if (E.spK !== k){ E.spK = k; const f = Float32Array.from(T.accF, v=>Math.max(0, v)); E.spCv = bufCanvas(f, T.n, CM.spect, k ? undefined : 1); }
      rr(A.x, A.y, A.s, A.s, 3, KC.film); img(E.spCv, A.x, A.y, A.s, A.s); img(scanCanvas('hmpao', 'normal'), A.x, A.y, A.s, A.s, smooth(0.8, 0.98, p)); }
    txt(`${k} de 180 ángulos`, A.x, A.y + A.s + 32, {size:11.5, color:KC.ink});
    const d1 = scanCanvas('dat', 'normal'), d2 = scanCanvas('dat', 'pd');
    fade(smooth(0.3, 0.6, p), ()=>{ head('DaTscan', 560, 240); d1 ? img(d1, 560, 250, 180, 180) : placeholder(560, 250, 180, 180, '…'); d2 ? img(d2, 760, 250, 180, 180) : placeholder(760, 250, 180, 180, '…');
      txt('normal: dos comas', 560, 456, {size:10.5, maxW:180}); txt('Parkinson: puntos finales', 760, 456, {size:10.5, maxW:180}); });
    fade(smooth(0.5, 0.8, p), ()=>txt('Los lectores interpretan el patrón. Los bordes permanecen suaves con 8–10 mm de resolución.', 560, 560, {size:11.5, color:KC.ink, maxW:380}));
  },
],

/* =====================================================================
   fMRI
   ===================================================================== */
fmri:[
  (p, t, E)=>{
    const a = smooth(0.15, 0.6, p), S = [320, 360];
    ln(S[0], S[1], S[0] - 90, 170, KC.ink2, 2); ln(S[0], S[1], S[0] + 80, 160, KC.ink2, 2); ln(S[0] - 50, 260, S[0] - 140, 230, KC.ink2, 1.4); ln(S[0] + 45, 255, S[0] + 140, 210, KC.ink2, 1.4);
    ln(S[0], S[1], S[0] + 10, 560, KC.ink2, 2.4);
    poly([[S[0], S[1] - 44], [S[0] - 40, S[1] + 26], [S[0] + 40, S[1] + 26]], KC.paper, KC.ink, 1.6);
    const rate = lerp(0.8, 7, a); E.sp = E.sp || []; E.lt = E.lt || t; while (t - E.lt > 1/rate){ E.lt += 1/rate; E.sp.push(t); } E.sp = E.sp.filter(s=>t - s < 0.7);
    for (const s of E.sp){ const f = (t - s)/0.7; circ(S[0], S[1], 40 + 120*f, null, `rgba(0,80,255,${0.7*(1 - f)})`, 1.6); }
    txt('Descarga neuronal', S[0] + 70, S[1] + 10, {size:11, color:KC.sig});
    const r = lerp(40, 60, a), cy = 700;
    G.ctx.fillStyle = 'rgba(217,65,43,.06)'; G.ctx.fillRect(60, cy - r, 880, 2*r); ln(60, cy - r, 940, cy - r, KC.red, 2); ln(60, cy + r, 940, cy + r, KC.red, 2);
    const v = lerp(70, 170, a), fo = lerp(0.5, 0.92, a);
    for (let i = 0; i < 16; i++){ const x = 60 + (((i*61 + t*v) % 900) + 900) % 900, ox = hashf(i + Math.floor((i*61 + t*v)/900)*17) < fo; if (x > 940) continue; ell(x, cy + (hashf(i*3) - 0.5)*r, 18, 12, ox ? KC.red : KC.deoxy); }
    txt('Capilar', 60, cy - r - 16, {size:11, color:KC.ink});
    fade(a, ()=>{ txt('widens', 940, cy - r - 16, {size:11, align:'right', color:KC.red}); arrow(900, cy - 40, 900, cy - r + 2, KC.red, 1.4, 7); });
    fade(smooth(0.35, 0.7, p), ()=>{ rr(560, 230, 360, 150, 4, KC.soft); txt('flujo sanguíneo  +30–50 %', 584, 285, {size:12.5, color:KC.ink}); txt('consumo de oxígeno  +5–20 %', 584, 325, {size:12.5, color:KC.ink}); txt('→ excedente de sangre rica en oxígeno', 584, 360, {size:10.5}); });
    ell(140, 860, 14, 10, KC.red); txt('oxigenada', 164, 864, {size:10.5}); ell(340, 860, 14, 10, KC.deoxy); txt('desoxigenada', 364, 864, {size:10.5});
  },
  (p, t)=>{
    const sides = [[270, 'Reposo', 0.55, 40], [730, 'Activo', 0.15, 46]], a = smooth(0, 0.4, p);
    for (const [cx, nm, fd, t2s] of sides){
      head(nm, cx, 170, {align:'center', color:KC.ink});
      circ(cx, 330, 130, 'rgba(217,65,43,.05)', KC.red, 1.6);
      for (let i = 0; i < 16; i++){ const ang = i*2.4 + t*0.3, rad = 30 + (i % 4)*24, x = cx + Math.cos(ang)*rad, y = 330 + Math.sin(ang)*rad, de = hashf(i + cx) < fd;
        if (de) fade(a, ()=>circ(x, y, 24 + 3*Math.sin(t*3 + i), null, 'rgba(107,42,79,.45)', 1, [2, 3])); circ(x, y, 12, de ? KC.deoxy : KC.red); }
      const g = {x:cx - 190, y:540, w:380, h:220}; box(g.x, g.y, g.w, g.h, 'Decaimiento T2*');
      curve(u=>[g.x + u/100*g.w, g.y + g.h - 10 - Math.exp(-u/t2s)*(g.h - 30)], 0, 100, 80, nm === 'Reposo' ? KC.ink2 : KC.sig, 2);
      const te = 30, sv = Math.exp(-te/t2s); ln(g.x + te/100*g.w, g.y, g.x + te/100*g.w, g.y + g.h, KC.amber, 1.2, [4, 3]);
      circ(g.x + te/100*g.w, g.y + g.h - 10 - sv*(g.h - 30), 6, nm === 'Reposo' ? KC.ink2 : KC.sig); txt('TE 30 ms', g.x + te/100*g.w + 8, g.y + 20, {size:10, color:KC.amber});
    }
    fade(smooth(0.4, 0.7, p), ()=>{ txt('más señal en TE cuando se elimina la desoxihemoglobina', 500, 830, {align:'center', size:12, color:KC.ink, maxW:820}); txt('cambio real ≈ 1–3 %, exagerado aquí', 500, 858, {align:'center', size:10.5}); });
  },
  (p, t)=>{
    const g = {x:100, y:240, w:800, h:440}, X = s => g.x + s/30*g.w, Y = v => g.y + g.h*0.72 - v*g.h*0.62;
    const gam = (x, k) => x <= 0 ? 0 : Math.pow(x, k - 1)*Math.exp(-x);
    const raw = s => gam(s, 6)/120 - gam(s, 16)/(1.3076744e12*6); let mx = 0; for (let s = 0; s < 30; s += 0.1) mx = Math.max(mx, raw(s)); const h = s => raw(s)/mx;
    box(g.x, g.y, g.w, g.h, 'Respuesta BOLD a un estímulo de 1 s');
    ln(g.x, Y(0), g.x + g.w, Y(0), KC.line, 1);
    for (let s = 0; s <= 30; s += 2){ ln(X(s), g.y + g.h, X(s), g.y + g.h - (s % 10 ? 6 : 12), KC.ink2, 1); if (s % 10 === 0) txt(s + ' s', X(s), g.y + g.h + 22, {align:'center', size:10}); }
    rr(X(0), g.y + g.h - 34, X(1) - X(0), 20, 1, KC.amber); txt('estímulo', X(1) + 8, g.y + g.h - 19, {size:10, color:KC.amber});
    const pr = smooth(0.05, 0.7, p);
    curve(s=>[X(s), Y(h(s))], 0, 30*pr, 200, KC.sig, 2.4);
    fade(smooth(0.3, 0.5, p), ()=>{ circ(X(5), Y(1), 6, KC.sig); txt('pico ≈ 5–6 s', X(5) + 14, Y(1) - 8, {size:11, color:KC.ink}); });
    fade(smooth(0.55, 0.75, p), ()=>{ circ(X(15.5), Y(h(15.5)), 6, KC.ink2); txt('undershoot', X(15.5), Y(h(15.5)) + 30, {size:11, align:'center'}); });
    const tp = (t*4) % 30; fade(pr > 0.99 ? 1 : 0, ()=>{ ln(X(tp), g.y, X(tp), g.y + g.h, 'rgba(0,80,255,.3)', 1); circ(X(tp), Y(h(tp)), 5, KC.sig); });
    txt('marcas: un volumen cerebral cada 2 s (TR)', g.x, g.y + g.h + 54, {size:10.5});
    fade(smooth(0.6, 0.9, p), ()=>txt('Las neuronas responden en milisegundos; la sangre tarda segundos.', g.x, 170, {size:12, color:KC.ink, maxW:800}));
  },
  (p, t, E)=>{
    const g = {x:80, y:170, w:840, h:90}, N = 240, X = i => g.x + i/N*g.w;
    head('Diseño de la tarea · bloques de 15 s', g.x, g.y - 12);
    for (let b = 0; b < 8; b++) if (b % 2) { G.ctx.fillStyle = 'rgba(0,80,255,.08)'; G.ctx.fillRect(X(b*30), g.y, X(30) - X(0), g.h + 170); txt('golpeo', X(b*30 + 15), g.y + 20, {align:'center', size:10, color:KC.sig}); }
    if (!E.ts){ const R = rnd(3), box = Array.from({length:N}, (_, i)=>Math.floor(i/30) % 2), hrf = Array.from({length:24}, (_, k)=>{ const s = k*0.5; return Math.pow(s, 5)*Math.exp(-s)/120 - Math.pow(s, 15)*Math.exp(-s)/(1.3e12*6); });
      const m = box.map((_, i)=>{ let s = 0; for (let k = 0; k < 24; k++) if (i - k >= 0) s += box[i - k]*hrf[k]; return s; }), mm = Math.max(...m);
      E.ts = m.map(v=>v/mm); E.noisy = E.ts.map(v=>v + (R() + R() + R() - 1.5)*0.45); }
    const pr = smooth(0.05, 0.6, p), yb = g.y + g.h + 140;
    curve(i=>[X(i), yb - E.noisy[Math.min(N - 1, Math.round(i))]*90], 0, (N - 1)*pr, Math.max(2, Math.round(N*pr)), KC.ink2, 1.2);
    fade(smooth(0.3, 0.6, p), ()=>curve(i=>[X(i), yb - E.ts[Math.round(i)]*90], 0, N - 1, N, KC.sig, 2, [5, 3]));
    txt('un vóxel en la corteza motora izquierda', g.x, yb + 40, {size:10.5}); fade(smooth(0.3, 0.6, p), ()=>txt('modelo (tarea ⊗ HRF)', g.x + g.w, yb + 40, {size:10.5, color:KC.sig, align:'right'}));
    const cv = scanCanvas('bold', 'motor'), s = 380, x = 500 - s/2, y = 520;
    fade(smooth(0.45, 0.8, p), ()=>{ cv ? img(cv, x, y, s, s) : placeholder(x, y, s, s); txt('mapa z sobre la anatomía', x + s + 20, y + 30, {size:11.5, color:KC.ink}); txt('golpeo con la mano derecha', x + s + 20, y + 56, {size:10.5}); txt('→ corteza motora izquierda', x + s + 20, y + 78, {size:10.5}); });
  },
],

/* =====================================================================
   EEG
   ===================================================================== */
eeg:[
  (p, t)=>{
    const a = smooth(0.12, 0.6, p);
    const bands = [['Cuero cabelludo', 150, 215, KC.skin], ['Cráneo', 215, 285, '#e4e7e8'], ['LCR', 285, 315, '#dfeaff'], ['Corteza', 315, 640, '#f1ebe8'], ['Sustancia blanca', 640, 760, KC.paper]];
    for (const [nm, y0, y1, col] of bands){ G.ctx.fillStyle = col; G.ctx.fillRect(40, y0, 920, y1 - y0); ln(40, y1, 960, y1, KC.line, 1); txt(nm, 52, y0 + 22, {size:10, color:KC.muted}); }
    for (let i = 0; i < 50; i++) circ(60 + hashf(i)*880, 228 + hashf(i + 9)*44, 3 + hashf(i + 3)*4, '#d0d6d8');
    const xs = [230, 330, 430, 530, 630, 730, 830];
    xs.forEach((x, i)=>{ const ph = (t*1.4 + (1 - a)*hashf(i)*3) % 1;
      ln(x, 560, x, 330, KC.ink2, 2); ln(x, 420, x - 40, 370, KC.ink2, 1.2); ln(x, 450, x + 40, 400, KC.ink2, 1.2); ln(x, 572, x - 40, 620, KC.ink2, 1.2); ln(x, 572, x + 40, 620, KC.ink2, 1.2);
      poly([[x, 532], [x - 22, 584], [x + 22, 584]], KC.paper, KC.ink, 1.4);
      const y = 560 - ph*220; circ(x, y, 6, KC.sig); });
    fade(a, ()=>{ arrow(900, 560, 900, 340, KC.sig, 3, 14); txt('+', 918, 350, {size:16, color:KC.sig}); txt('−', 918, 572, {size:16, color:KC.sig}); txt('dipolo', 900, 600, {align:'center', size:10.5, color:KC.sig}); });
    rr(470, 120, 60, 26, 13, KC.ink); ln(500, 120, 500, 60, KC.ink, 2); txt('electrodo', 540, 100, {size:11, color:KC.ink});
    const amp = lerp(0.15, 1, a); curve(u=>[80 + u*840, 860 - amp*55*Math.sin(u*40 - t*9)*(0.6 + 0.4*Math.sin(u*7))], 0, 1, 200, KC.ink, 1.5);
    txt('señal de cuero cabelludo', 80, 800, {size:10.5}); txt(a > 0.6 ? 'células en fase: las señales se suman' : 'células desfasadas: las señales se cancelan', 920, 800, {size:10.5, align:'right', color:a > 0.6 ? KC.sig : KC.muted});
  },
  (p, t)=>{
    const C = [500, 540], R = 330;
    poly([[C[0] - 40, C[1] - R + 6], [C[0], C[1] - R - 50], [C[0] + 40, C[1] - R + 6]], KC.paper, KC.ink2, 1.4);
    ell(C[0] - R - 6, C[1], 22, 60, KC.paper, KC.ink2, 1.4); ell(C[0] + R + 6, C[1], 22, 60, KC.paper, KC.ink2, 1.4);
    circ(C[0], C[1], R, KC.paper, KC.ink2, 1.6);
    ln(C[0], C[1] - R, C[0], C[1] + R, KC.line, 1, [4, 4]); ln(C[0] - R, C[1], C[0] + R, C[1], KC.line, 1, [4, 4]);
    const E = [['Fz',0.4,0],['Cz',0,0],['Pz',0.4,180],['C3',0.4,-90],['C4',0.4,90],['F3',0.51,-39],['F4',0.51,39],['P3',0.51,-141],['P4',0.51,141],
      ['Fp1',0.8,-18],['Fp2',0.8,18],['F7',0.8,-54],['F8',0.8,54],['T7',0.8,-90],['T8',0.8,90],['P7',0.8,-126],['P8',0.8,126],['O1',0.8,-162],['O2',0.8,162],['A1',1.06,-90],['A2',1.06,90]];
    const k = Math.ceil(smooth(0, 0.75, p)*E.length);
    fade(1 - smooth(0.2, 0.5, p), ()=>{ [[0.1,'10 %'],[0.3,'20 %'],[0.5,'20 %'],[0.7,'20 %'],[0.9,'20 %']].forEach(([f, s], i)=>{ const y = C[1] - R + f*2*R; ln(C[0] - 10, y, C[0] + 10, y, KC.ink2, 1); }); txt('nasión → inión, en pasos del 10 % y del 20 %', C[0] + 20, C[1] - R + 80, {size:10.5}); });
    E.slice(0, k).forEach(([nm, r, d], i)=>{ const x = C[0] + R*r*Math.sin(d*Math.PI/180), y = C[1] - R*r*Math.cos(d*Math.PI/180), ref = nm[0] === 'A', fresh = i === k - 1;
      circ(x, y, 26, ref ? KC.soft : KC.paper, fresh ? KC.sig : KC.ink, fresh ? 2.4 : 1.4); txt(nm, x, y + 4*G.u, {align:'center', size:10.5, color:ref ? KC.muted : KC.ink, weight:500}); });
    txt('nariz', C[0], C[1] - R - 64, {align:'center', size:10}); txt('L', C[0] - R - 70, C[1] + 6, {size:12, align:'center', color:KC.ink}); txt('R', C[0] + R + 70, C[1] + 6, {size:12, align:'center', color:KC.ink});
    fade(smooth(0.6, 0.9, p), ()=>txt('impares = izquierda · pares = derecha · z = línea media', C[0], C[1] + R + 60, {align:'center', size:11, color:KC.ink}));
  },
  (p, t)=>{
    const hum = u => Math.sin(u*120 - t*30)*28, sig = u => Math.sin(u*28 - t*9)*16*(0.7 + 0.3*Math.sin(u*5 - t));
    [[260, 'Fp1', 1], [640, 'F7', 0.3]].forEach(([y, nm, w])=>{ circ(120, y, 32, KC.paper, KC.ink, 1.6); txt(nm, 120, y + 5*G.u, {align:'center', size:11, color:KC.ink, weight:500});
      box(190, y - 70, 220, 140); curve(u=>[200 + u*200, y + hum(u) + sig(u)*w], 0, 1, 160, KC.ink2, 1.1);
      ln(410, y, 470, y, KC.ink2, 1.4); ln(470, y, 470, y < 450 ? 400 : 500, KC.ink2, 1.4); ln(470, y < 450 ? 400 : 500, 520, y < 450 ? 400 : 500, KC.ink2, 1.4); });
    poly([[520, 330], [520, 570], [700, 450]], KC.paper, KC.ink, 2); txt('+', 536, 408, {size:16, color:KC.ink}); txt('−', 536, 508, {size:16, color:KC.ink});
    ln(700, 450, 740, 450, KC.ink2, 1.4);
    box(740, 360, 220, 180, 'Fp1 − F7'); curve(u=>[750 + u*200, 450 + sig(u)*0.7*3], 0, 1, 160, KC.sig, 1.6);
    fade(smooth(0.2, 0.5, p), ()=>{ txt('zumbido de red en ambas entradas', 300, 160, {align:'center', size:10.5, color:KC.ink2}); txt('se cancela en la diferencia', 850, 610, {align:'center', size:11, color:KC.sig}); });
    fade(smooth(0.45, 0.8, p), ()=>{ ln(760, 700, 760, 760, KC.ink, 1.4); txt('50 µV', 772, 736, {size:10.5}); ln(760, 790, 860, 790, KC.ink, 1.4); txt('1 s', 810, 815, {size:10.5, align:'center'}); txt('ganancia ≈ 10.000–100.000', 120, 820, {size:11, color:KC.ink}); });
  },
  (p, t)=>{
    const B = [['Delta', '< 4 Hz', 'sueño profundo', 2, 1, 1], ['Theta', '4–8 Hz', 'somnolencia', 6, 0.7, 0.9], ['Alfa', '8–13 Hz', 'ojos cerrados, relajado', 10, 0.6, 0.8], ['Beta', '13–30 Hz', 'alerta, pensando', 20, 0.35, 0.9], ['Gamma', '> 30 Hz', 'integración, atención', 40, 0.2, 1]];
    const hi = Math.min(4, Math.floor(smooth(0, 1, p)*5));
    B.forEach(([nm, hz, st, f, a, irr], i)=>{ const y = 220 + i*150, on = i === hi;
      fade(on ? 1 : 0.42, ()=>{ txt(nm, 60, y - 12, {size:15, color:on ? KC.sig : KC.ink, font:'disp'}); txt(hz, 60, y + 14, {size:10.5}); txt(st, 60, y + 36, {size:10.5, color:KC.ink2, maxW:240});
        curve(u=>{ const tt = u*2.5 + t*0.8; const env = nm === 'Alfa' ? 0.6 + 0.4*Math.sin(tt*1.4) : 1; return [330 + u*620, y + 6 - 52*a*env*(Math.sin(TAU*f*tt*0.35) + 0.3*irr*Math.sin(TAU*f*tt*0.53 + 1))]; }, 0, 1, 360, on ? KC.sig : KC.ink2, on ? 1.8 : 1.1); }); });
    txt('1 s', 950, 950, {size:10, align:'right'});
  },
],

/* =====================================================================
   MEG
   ===================================================================== */
meg:[
  (p, t)=>{
    const C = [300, 520], a = smooth(0, 0.4, p);
    for (let k = 1; k <= 4; k++) fade(a*(1.1 - k*0.18), ()=>{ const c = G.ctx; c.beginPath(); c.ellipse(C[0], C[1], 24*k, 70*k, 0, 0, TAU); _st(KC.sig, 1.3, [8, 6]); c.lineDashOffset = -t*24*G.u; c.stroke(); c.setLineDash([]); c.lineDashOffset = 0; });
    arrow(C[0] - 120, C[1], C[0] + 120, C[1], KC.amber, 5, 18);
    txt('current', C[0], C[1] + 96, {align:'center', size:11, color:KC.amber}); txt('el campo magnético lo rodea', C[0], C[1] - 320, {align:'center', size:11, color:KC.sig});
    const x = 700, y0 = 860, y1 = 160, dec = v => Math.log10(v), Y = v => y0 - (dec(v) - dec(1e-15))/(dec(1e-4) - dec(1e-15))*(y0 - y1);
    ln(x, y0, x, y1, KC.ink2, 1.6);
    [[1e-15,'1 fT'],[1e-12,'1 pT'],[1e-9,'1 nT'],[1e-6,'1 µT']].forEach(([v, s])=>{ ln(x - 8, Y(v), x, Y(v), KC.ink2, 1.2); txt(s, x - 14, Y(v) + 4, {size:10, align:'right'}); });
    const M = [[50e-6,'Tierra',KC.ink],[1e-6,'Tráfico urbano',KC.ink2],[50e-12,'Corazón',KC.ink2],[1e-12,'Ritmo alfa',KC.sig],[100e-15,'Respuesta evocada',KC.sig],[3e-15,'Ruido del sensor',KC.muted]];
    M.forEach(([v, s, col], i)=>fade(smooth(i*0.1, i*0.1 + 0.2, p), ()=>{ circ(x, Y(v), 6, col); ln(x + 6, Y(v), x + 30, Y(v), col, 1); txt(s, x + 38, Y(v) + 4, {size:11, color:col, font:'body'}); }));
    head('Intensidad del campo', x - 60, y1 - 30);
  },
  (p, t)=>{
    for (let k = 0; k < 3; k++) rr(40 + k*16, 110 + k*16, 920 - k*32, 820 - k*32, 4, null, k ? KC.line : KC.ink2, k ? 1 : 2);
    txt('sala blindada magnéticamente', 72, 168, {size:10.5});
    const C = [500, 610];
    G.ctx.beginPath(); G.ctx.arc(C[0], C[1], 260, Math.PI*1.08, Math.PI*1.92); G.ctx.arc(C[0], C[1], 196, Math.PI*1.92, Math.PI*1.08, true); G.ctx.closePath(); G.ctx.fillStyle = 'rgba(0,80,255,.09)'; G.ctx.fill(); _st(KC.ink2, 1.4); G.ctx.stroke();
    rr(440, 170, 120, 190, 10, 'rgba(0,80,255,.09)', KC.ink2, 1.4);
    for (let i = 0; i < 17; i++){ const a = Math.PI*(1.1 + i*0.8/16), x = C[0] + Math.cos(a)*210, y = C[1] + Math.sin(a)*210, on = 0.5 + 0.5*Math.sin(t*3 + i);
      const c = G.ctx; c.save(); c.translate(x, y); c.rotate(a + Math.PI/2); rr(-9, -9, 18, 18, 2, `rgba(0,80,255,${0.35 + 0.5*on})`); c.restore(); }
    circ(C[0], C[1] + 20, 150, KC.soft, KC.ink2, 1.4); poly([[C[0] - 150, C[1] + 30], [C[0] - 178, C[1] + 60], [C[0] - 146, C[1] + 70]], KC.soft, KC.ink2, 1.2);
    rr(C[0] - 60, C[1] + 160, 120, 140, 20, KC.soft, KC.ink2, 1.2);
    fade(smooth(0.1, 0.4, p), ()=>{ callout(C[0] + 200, C[1] - 120, 760, 300, 'sensores SQUID', {maxW:200}); callout(C[0] - 210, C[1] - 150, 230, 300, 'helio líquido, 4 K', {maxW:220}); });
    fade(smooth(0.4, 0.7, p), ()=>txt('306 canales · 102 posiciones', 500, 850, {align:'center', size:11.5, color:KC.ink}));
  },
  (p, t, E)=>{
    const C = [500, 520], R = 330, n = 180, ang = E.ctl && E.ctl.ori != null ? E.ctl.ori*Math.PI/180 : lerp(0.2, 2.6, smooth(0, 1, p)), src = E.src || [0.12, 0.08], d = E.ctl && E.ctl.depth != null ? E.ctl.depth/100 : 0.32;
    E.cur = Object.assign(E.cur || {}, {ori:Math.round(ang*180/Math.PI) % 360, depth:Math.round(d*100)});
    E.drag = {cx:C[0], cy:C[1], r:R, set:(x, y)=>{ const m = Math.hypot(x, y); E.src = m > 0.8 ? [x/m*0.8, y/m*0.8] : [x, y]; }};
    const key = Math.round(ang*60) + '|' + src.map(v=>v.toFixed(3)).join(',') + '|' + d.toFixed(2);
    if (E.mk !== key){ E.mk = key; const c = E.mcv || (E.mcv = document.createElement('canvas')); c.width = c.height = n; const x = c.getContext('2d'), im = x.createImageData(n, n);
      const qx = Math.cos(ang), qy = Math.sin(ang); let mx = 0; const B = new Float32Array(n*n);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){ const X = (i + 0.5)/n*2 - 1, Y = (j + 0.5)/n*2 - 1, dx = X - src[0], dy = Y - src[1], r3 = Math.pow(dx*dx + dy*dy + d*d, 1.5), b = (qx*dy - qy*dx)/r3; B[j*n + i] = b; mx = Math.max(mx, Math.abs(b)); }
      for (let k = 0; k < n*n; k++){ const v = B[k]/mx, iso = Math.abs(((v*6 % 1) + 1) % 1 - 0.5) < 0.035 ? 0.8 : 1;
        const col = v >= 0 ? [255 - 55*v, 255 - 215*v, 255 - 215*v] : [255 + 222*v, 255 + 170*v, 255 + 64*v]; im.data[k*4] = col[0]*iso; im.data[k*4 + 1] = col[1]*iso; im.data[k*4 + 2] = col[2]*iso; im.data[k*4 + 3] = 255; }
      x.putImageData(im, 0, 0); }
    poly([[C[0] - 36, C[1] - R + 6], [C[0], C[1] - R - 46], [C[0] + 36, C[1] - R + 6]], KC.paper, KC.ink2, 1.4);
    clip(c=>c.arc(C[0], C[1], R, 0, TAU), ()=>img(E.mcv, C[0] - R, C[1] - R, 2*R, 2*R));
    circ(C[0], C[1], R, null, KC.ink2, 1.6);
    const sx = C[0] + src[0]*R, sy = C[1] + src[1]*R, L = 90; arrow(sx - Math.cos(ang)*L, sy - Math.sin(ang)*L, sx + Math.cos(ang)*L, sy + Math.sin(ang)*L, KC.ink, 4, 16);
    const ox = -Math.sin(ang), oy = Math.cos(ang);
    txt('campo saliente', sx + ox*190, sy + oy*190, {align:'center', size:11, color:'#b2271f', weight:500}); txt('campo entrante', sx - ox*190, sy - oy*190, {align:'center', size:11, color:'#1c3fbf', weight:500});
    txt('fuente', sx, sy + 130, {align:'center', size:10.5, color:KC.ink});
    txt('visto desde arriba, nariz arriba · arrastre la fuente', C[0], C[1] + R + 50, {align:'center', size:10.5});
  },
  (p, t)=>{
    const panes = [['Pulso en la muñeca derecha', 20, 'N20m · 20 ms', 0.9, 6], ['Tono en ambos oídos', 100, 'M100 · 100 ms', 1, 22]];
    panes.forEach(([nm, pk, lab, amp, w], i)=>{ const g = {x:90, y:200 + i*360, w:820, h:250}, X = ms => g.x + ms/250*g.w, Y = v => g.y + g.h/2 - v*g.h*0.4;
      box(g.x, g.y, g.w, g.h, nm); ln(g.x, Y(0), g.x + g.w, Y(0), KC.line, 1);
      ln(X(0), g.y, X(0), g.y + g.h, KC.amber, 1.6); txt('estímulo', X(0) + 6, g.y + 18, {size:10, color:KC.amber});
      const pr = smooth(i*0.3, i*0.3 + 0.45, p);
      for (let k = 0; k < 8; k++){ const s = (hashf(k + i*10) - 0.5)*2; curve(ms=>[X(ms), Y(s*amp*(Math.exp(-(((ms - pk)/w)**2)) - (i ? 0.45*Math.exp(-(((ms - 190)/40)**2)) : 0.5*Math.exp(-(((ms - pk - 13)/6)**2))) + 0.05*Math.sin(ms*0.3 + k)))], 0, 250*pr, 200, `hsla(${210 + k*8},60%,${30 + k*4}%,.6)`, 1.2); }
      fade(smooth(i*0.3 + 0.25, i*0.3 + 0.45, p), ()=>{ ln(X(pk), g.y, X(pk), g.y + g.h, KC.sig, 1.2, [4, 3]); txt(lab, X(pk) + 8, g.y + g.h - 12, {size:11.5, color:KC.sig, weight:500}); });
      for (const ms of [0, 50, 100, 150, 200, 250]) txt(ms + ' ms', X(ms), g.y + g.h + 20, {align:'center', size:9.5, color:KC.muted});
    });
  },
],

/* =====================================================================
   Ultrasound
   ===================================================================== */
us:[
  (p, t)=>{
    rr(440, 50, 120, 140, 20, KC.paper, KC.ink2, 1.4); rr(415, 180, 170, 30, 6, KC.ink);
    for (let x = 425; x <= 575; x += 12) ln(x, 186, x, 204, KC.sig, 2);
    G.ctx.fillStyle = KC.skin; G.ctx.fillRect(60, 212, 880, 36); G.ctx.fillStyle = '#f5f1ef'; G.ctx.fillRect(60, 248, 880, 680);
    G.ctx.fillStyle = '#dfeaff'; G.ctx.fillRect(60, 640, 880, 120); ln(60, 640, 940, 640, KC.ink2, 2);
    txt('tejido', 80, 290, {size:10.5, color:KC.muted}); txt('líquido (LCR)', 80, 700, {size:10.5, color:KC.muted});
    const T = 1.4, u = (t % T)/T, d = u*900;
    if (d < 430) for (let k = 0; k < 3; k++){ const y = 210 + d - k*14; if (y > 210) fade(1 - k*0.3, ()=>{ G.ctx.beginPath(); G.ctx.arc(500, 210, y - 210, Math.PI*0.18, Math.PI*0.82); _st(KC.sig, 2); G.ctx.stroke(); }); }
    else { const back = d - 430; for (let k = 0; k < 3; k++){ const r = back - k*14; if (r > 0 && r < 430) fade((1 - k*0.3)*(1 - r/500), ()=>{ G.ctx.beginPath(); G.ctx.arc(500, 640, r, Math.PI*1.2, Math.PI*1.8); _st(KC.amber, 2, [6, 4]); G.ctx.stroke(); }); }
      if (back > 400) circ(500, 196, 30, 'rgba(232,150,42,.35)'); }
    fade(smooth(0.1, 0.4, p), ()=>{ txt('pulso emitido', 620, 360, {size:11, color:KC.sig}); txt('eco de retorno', 620, 560, {size:11, color:KC.amber}); callout(575, 195, 760, 120, 'cristales piezoeléctricos', {maxW:200}); });
    fade(smooth(0.4, 0.7, p), ()=>{ txt('c ≈ 1540 m/s en tejido blando', 500, 880, {align:'center', size:12, color:KC.ink}); txt('2–15 MHz', 500, 906, {align:'center', size:10.5}); });
  },
  (p, t)=>{
    const ax = 150, top = 170, depth = 640, echoes = [[0.12, 0.7], [0.34, 0.35], [0.52, 0.9], [0.66, 0.25], [0.84, 0.55]];
    rr(ax - 40, top - 40, 80, 30, 6, KC.ink); ln(ax, top, ax, top + depth, KC.ink2, 1.2);
    echoes.forEach(([dd, a])=>{ const y = top + dd*depth; poly([[ax, y - 8], [ax + a*120, y], [ax, y + 8]], KC.ink); });
    head('Línea A', ax - 40, top + depth + 34);
    for (let i = 0; i < 40; i++){ const y = top + i/40*depth; let v = 0; for (const [dd, a] of echoes) v += a*Math.exp(-((((i/40) - dd)/0.025)**2)); const g = Math.round(255 - Math.min(1, v)*235); rr(330, y, 30, depth/40, 0, `rgb(${g},${g},${g})`); }
    head('brillo', 300, top + depth + 34); arrow(280, top + depth/2, 318, top + depth/2, KC.ink2, 1.2, 7);
    const cv = scanCanvas('cus', 'normal'), X = 420, Y = 170, S = 520, sw = smooth(0.08, 0.9, p);
    if (cv){ rr(X, Y, S, S, 3, KC.film); clip(c=>{ c.moveTo(X + S/2, Y + S*0.02); c.arc(X + S/2, Y + S*0.02, S*1.2, Math.PI/2 + 1.2, Math.PI/2 + 1.2 - 2.4*sw, true); c.closePath(); }, ()=>img(cv, X, Y, S, S)); }
    else placeholder(X, Y, S, S);
    head('Modo B: muchas líneas en abanico', X, Y - 12);
    fade(smooth(0.4, 0.75, p), ()=>{ txt('profundidad = c × t ÷ 2', 420, 760, {size:13, color:KC.ink, weight:500}); txt('13 µs por cm, es decir 100+ líneas por imagen a 30 imágenes/s', 420, 790, {size:10.5, maxW:520}); });
  },
  (p, t)=>{
    const L = [260, 540], Rt = [740, 540];
    head('Recién nacido', L[0], 200, {align:'center', color:KC.ink}); head('Adulto', Rt[0], 200, {align:'center', color:KC.ink});
    G.ctx.beginPath(); G.ctx.arc(L[0], L[1], 170, -Math.PI/2 + 0.2, -Math.PI/2 - 0.2 + TAU); _st(KC.ink2, 10); G.ctx.stroke();
    ell(L[0], L[1], 160, 160, KC.soft); ell(L[0] - 30, L[1] + 10, 20, 46, '#dfeaff');
    fade(smooth(0, 0.3, p), ()=>{ poly([[L[0], L[1] - 168], [L[0] - 110, L[1] + 120], [L[0] + 110, L[1] + 120]], 'rgba(0,80,255,.12)'); rr(L[0] - 24, L[1] - 210, 48, 40, 6, KC.ink); txt('fontanela anterior', L[0] + 40, L[1] - 196, {size:10.5, color:KC.ink, maxW:180}); });
    circ(Rt[0], Rt[1], 170, KC.soft, KC.ink2, 14);
    G.ctx.beginPath(); G.ctx.arc(Rt[0], Rt[1], 170, Math.PI - 0.12, Math.PI + 0.12); _st('#c9d2d6', 7); G.ctx.stroke();
    fade(smooth(0.3, 0.6, p), ()=>{ rr(Rt[0] - 230, Rt[1] - 22, 44, 44, 6, KC.ink); ln(Rt[0] - 186, Rt[1], Rt[0] - 10, Rt[1] + 4, KC.sig, 5); circ(Rt[0], Rt[1] + 6, 14, null, KC.red, 3); txt('MCA', Rt[0] + 22, Rt[1] + 12, {size:10.5, color:KC.red}); txt('hueso temporal delgado', Rt[0] - 200, Rt[1] + 220, {size:10.5, color:KC.ink, maxW:260}); });
    txt('5–8 MHz', L[0], L[1] + 230, {align:'center', size:11}); txt('2 MHz', Rt[0], Rt[1] + 260, {align:'center', size:11});
  },
  (p, t, E)=>{
    const vy = 360, vh = 90;
    G.ctx.fillStyle = 'rgba(217,65,43,.06)'; G.ctx.fillRect(60, vy - vh/2, 880, vh); ln(60, vy - vh/2, 940, vy - vh/2, KC.red, 2); ln(60, vy + vh/2, 940, vy + vh/2, KC.red, 2);
    for (let i = 0; i < 12; i++){ const x = 60 + ((i*77 + t*220) % 880); ell(x, vy + (hashf(i) - 0.5)*50, 16, 11, KC.red); }
    arrow(700, vy + vh/2 + 30, 860, vy + vh/2 + 30, KC.red, 1.6); txt('flow', 780, vy + vh/2 + 56, {align:'center', size:10.5, color:KC.red});
    // θ = angle between the beam and the flow; the probe sits up-stream-right so flow comes toward it
    const th = E.ctl && E.ctl.theta != null ? E.ctl.theta*Math.PI/180 : lerp(75, 35, smooth(0.05, 0.9, p))*Math.PI/180;
    E.cur = Object.assign(E.cur || {}, {theta:Math.round(th*180/Math.PI)});
    const dx = -Math.cos(th), dy = Math.sin(th), ang = Math.atan2(dy, dx), Ls = (vy - 140)/dy, P = [500 - dx*Ls, 140];
    { const c = G.ctx; c.save(); c.translate(...P); c.rotate(ang - Math.PI/2); rr(-30, -60, 60, 70, 8, KC.ink); c.restore(); }
    curve(s=>[P[0] + dx*s - dy*10*Math.sin(s*0.18 - t*12), P[1] + dy*s + dx*10*Math.sin(s*0.18 - t*12)], 40, Ls, 120, KC.sig, 1.8);
    curve(s=>[P[0] + dx*s + 26*dy - dy*8*Math.sin(s*0.26 + t*12), P[1] + dy*s - 26*dx + dx*8*Math.sin(s*0.26 + t*12)], 40, Ls - 30, 120, KC.amber, 1.6);
    { const G2 = G.ctx; G2.beginPath(); G2.arc(500, vy, 70, -th, 0, false); _st(KC.ink2, 1.2, [3, 3]); G2.stroke();
      txt('θ', 500 + 90*Math.cos(-th/2), vy + 90*Math.sin(-th/2) + 5, {align:'center', size:13, color:KC.ink, weight:500}); }
    const mid = Ls*0.55; txt('emitido: f₀', P[0] + dx*mid + 40, P[1] + dy*mid - 6, {size:11, color:KC.sig}); txt('eco: f₀ + Δf', P[0] + dx*mid - 150, P[1] + dy*mid + 30, {size:11, color:KC.amber});
    const cosT = Math.cos(th), df = 2*2e6*0.62*cosT/1540;
    txt('Δf = 2·f₀·v·cosθ / c', 90, 110, {size:14, color:KC.ink, weight:500});
    txt(`θ = ${Math.round(th*180/Math.PI)}°  ·  Δf = ${Math.round(df)} Hz  ·  un equipo sin corrección lee ${Math.round(62*cosT)} cm/s de un valor real de 62`, 90, 138, {size:10.5, color:KC.ink2, maxW:420});
    const g = {x:90, y:560, w:820, h:300}; box(g.x, g.y, g.w, g.h, 'Doppler transcraneal · arteria cerebral media');
    const base = g.y + g.h - 30, sc = (g.h - 70)/120;
    for (let i = 0; i < g.w; i += 3){ const tt = t - 4 + 4*i/g.w, v = tcdVel('normal', tt)*Math.max(0, cosT), h = v*sc;
      const grd = G.ctx.createLinearGradient(0, base, 0, base - h); grd.addColorStop(0, 'rgba(12,22,27,.05)'); grd.addColorStop(0.8, 'rgba(12,22,27,.45)'); grd.addColorStop(1, 'rgba(12,22,27,.9)'); G.ctx.fillStyle = grd; G.ctx.fillRect(g.x + i, base - h, 3, h); }
    ln(g.x, base, g.x + g.w, base, KC.ink2, 1); ln(g.x, base - 100*sc, g.x + g.w, base - 100*sc, KC.line, 1, [3, 3]); txt('100 cm/s', g.x + 8, base - 100*sc - 6, {size:10});
    fade(smooth(0.4, 0.7, p), ()=>txt('pico en sístole, flujo estable en diástole', g.x + g.w - 10, g.y + 24, {size:10.5, align:'right'}));
  },
],

/* =====================================================================
   DSA
   ===================================================================== */
dsa:[
  (p, t)=>{
    circ(500, 130, 58, KC.soft, KC.ink2, 1.2); rr(470, 186, 60, 40, 8, KC.soft, KC.ink2, 1.2);
    rr(390, 222, 220, 330, 50, KC.soft, KC.ink2, 1.2);
    rr(318, 240, 64, 290, 30, KC.soft, KC.ink2, 1.2); rr(618, 240, 64, 290, 30, KC.soft, KC.ink2, 1.2);
    rr(410, 530, 82, 400, 34, KC.soft, KC.ink2, 1.2); rr(508, 530, 82, 400, 34, KC.soft, KC.ink2, 1.2);
    const path = [[460, 640], [470, 560], [492, 520], [500, 420], [500, 300], [486, 262], [470, 262], [476, 220], [484, 170], [488, 120]];
    poly(path, null, 'rgba(217,65,43,.35)', 9, false);
    poly([[500, 300], [530, 262], [560, 300], [645, 420]], null, 'rgba(217,65,43,.22)', 7, false);
    const f = smooth(0.05, 0.9, p), segs = path.length - 1, pos = f*segs, i0 = Math.min(segs - 1, Math.floor(pos)), fr = pos - i0;
    const tip = [lerp(path[i0][0], path[i0 + 1][0], fr), lerp(path[i0][1], path[i0 + 1][1], fr)];
    poly([...path.slice(0, i0 + 1), tip], null, KC.ink, 2.6, false); circ(tip[0], tip[1], 8, KC.sig); circ(tip[0], tip[1], 16 + 4*Math.sin(t*5), 'rgba(0,80,255,.15)');
    fade(smooth(0, 0.2, p), ()=>callout(462, 630, 250, 760, 'arteria femoral', {maxW:200}));
    fade(smooth(0.3, 0.55, p), ()=>callout(490, 280, 760, 330, 'arco aórtico', {maxW:200}));
    fade(smooth(0.7, 0.9, p), ()=>callout(482, 190, 760, 170, 'arteria carótida', {maxW:200}));
    fade(smooth(0.1, 0.35, p), ()=>callout(650, 480, 800, 560, 'o la arteria radial en la muñeca', {maxW:170}));
  },
  (p, t)=>{
    const T = 8, ph = (t*0.9) % T, F = {x:250, y:150, s:500};
    rr(F.x, F.y, F.s, F.s, 4, KC.paper, KC.line, 1);
    angio(F.x, F.y, F.s, ph/T, true);
    head(`${ph.toFixed(1)} s tras la inyección`, F.x, F.y - 12);
    const g = {x:100, y:740, w:800, h:40}, X = s => g.x + s/T*g.w;
    [['Arterial', 0, 3, KC.red], ['Capilar', 2.6, 5.4, '#8a5cf6'], ['Venosa', 5, 8, KC.sig]].forEach(([n, a, b, c], i)=>{ rr(X(a), g.y + i*12, X(b) - X(a), 8, 2, c); txt(n, X(a), g.y + 70 + i*0, {size:10.5, color:c}); });
    for (let s = 0; s <= T; s += 1/3) ln(X(s), g.y - 10, X(s), g.y - 2, KC.ink2, 1);
    ln(X(ph), g.y - 20, X(ph), g.y + 44, KC.ink, 2);
    txt('marcas: 3 imágenes por segundo', g.x + g.w, g.y + 70, {size:10.5, align:'right'});
  },
  (p, t)=>{
    const s = 270, y = 330, xs = [50, 365, 680];
    const a = smooth(0.1, 0.6, p);
    rr(xs[0], y, s, s, 4, '#e9ecee'); angioSkull(xs[0], y, s); head('Máscara, antes del contraste', xs[0], y - 12);
    rr(xs[1], y, s, s, 4, '#e9ecee'); angioSkull(xs[1], y, s); angio(xs[1], y, s, 0.22, false); head('Imagen con contraste', xs[1], y - 12);
    rr(xs[2], y, s, s, 4, KC.paper, KC.line, 1); fade(a, ()=>angio(xs[2], y, s, 0.22, true)); head('Sustraída', xs[2], y - 12);
    txt('−', (xs[0] + s + xs[1])/2, y + s/2 + 10, {align:'center', size:30, color:KC.ink}); txt('=', (xs[1] + s + xs[2])/2, y + s/2 + 10, {align:'center', size:30, color:KC.ink});
    fade(smooth(0.5, 0.8, p), ()=>txt('El hueso es idéntico en ambas imágenes, así que se cancela. Solo queda el contraste.', 500, 700, {align:'center', size:12, color:KC.ink, maxW:820}));
  },
  (p, t, E)=>{
    const B = [500, 560];
    poly([[B[0] - 40, 960], [B[0] - 30, B[1] + 40], [B[0] - 260, B[1] - 150], [B[0] - 220, B[1] - 190], [B[0], B[1] - 20], [B[0] + 220, B[1] - 190], [B[0] + 260, B[1] - 150], [B[0] + 30, B[1] + 40], [B[0] + 40, 960]], 'rgba(217,65,43,.14)', KC.red, 1.6);
    const sac = [B[0], B[1] - 150], f = smooth(0.1, 0.92, p);
    circ(sac[0], sac[1], 120, `rgba(217,65,43,${0.14*(1 - f) + 0.02})`, KC.red, 1.6);
    fade(f, ()=>circ(sac[0], sac[1], 118, 'rgba(125,139,145,.22)'));
    poly([[B[0] + 8, 960], [B[0] + 6, B[1]], [sac[0] + 4, sac[1] + 60]], null, KC.ink, 2.6, false);
    if (!E.coil){ const R = rnd(21), pts = []; let x = 0, y = 40, a = -1.2; for (let i = 0; i < 700; i++){ a += (R() - 0.5)*0.9; x += Math.cos(a)*9; y += Math.sin(a)*9; const d = Math.hypot(x, y); if (d > 96){ x *= 96/d; y *= 96/d; a += Math.PI*0.7; } pts.push([x, y]); } E.coil = pts; }
    const k = Math.floor(f*E.coil.length);
    if (k > 1) poly(E.coil.slice(0, k).map(([x, y])=>[sac[0] + x, sac[1] + y]), null, '#6f7d84', 2.6, false);
    txt('aneurisma', sac[0] + 140, sac[1] - 90, {size:11, color:KC.red}); txt('espiral de platino', sac[0] - 260, sac[1] - 60, {size:11, color:KC.ink});
    txt('microcatéter', B[0] + 30, 900, {size:10.5});
    fade(smooth(0.7, 0.95, p), ()=>txt('El saco empaquetado coagula y queda aislado de la circulación.', 500, 920 - 840, {align:'center', size:12, color:KC.ink, maxW:820}));
  },
],

/* =====================================================================
   Brain Lab
   ===================================================================== */
lab:[
  (p, t)=>{
    const C = [520, 760], rx = 330, ry = 560, W = {toes:2,foot:2,leg:3,hip:2,trunk:3,shoulder:2,arm:3,hand:5,fingers:6,thumb:4,neck:2,face:5,lips:5,tongue:4,throat:3};
    const parts = SOMATO.map(s=>s[0]), tot = parts.reduce((s, k)=>s + W[k], 0);
    G.ctx.beginPath(); G.ctx.moveTo(C[0], C[1] - ry + 40); G.ctx.ellipse(C[0], C[1], rx, ry, 0, -Math.PI/2, -0.05); _st(KC.ink2, 2); G.ctx.stroke();
    ln(C[0], C[1] - ry, C[0], C[1] - ry + 220, KC.ink2, 2, [3, 0]);
    txt('línea media', C[0] - 12, C[1] - ry + 240, {size:10, align:'right'}); txt('lateral', C[0] + rx + 10, C[1] - 10, {size:10});
    const hi = Math.min(parts.length - 1, Math.floor(smooth(0, 0.98, p)*parts.length));
    const pos = (u) => { // u 0..1 along medial wall then arc
      const med = 0.12; if (u < med){ const k = u/med; return {x:C[0], y:C[1] - ry + 220 - k*210, nx:-1, ny:0}; }
      const a = -Math.PI/2 + (u - med)/(1 - med)*(Math.PI/2 - 0.12), x = C[0] + rx*Math.cos(a), y = C[1] + ry*Math.sin(a), nx = Math.cos(a)/rx, ny = Math.sin(a)/ry, l = Math.hypot(nx, ny); return {x, y, nx:nx/l, ny:ny/l}; };
    let acc = 0;
    parts.forEach((k, i)=>{ const u = (acc + W[k]/2)/tot; acc += W[k]; const P = pos(u), L = 30 + W[k]*16, on = i === hi;
      ln(P.x, P.y, P.x + P.nx*L, P.y + P.ny*L, on ? KC.sig : KC.soft2, on ? 9 : 7);
      const LD = L + 14 + (i % 2)*26; txt(PART_LABEL[k] || k, P.x + P.nx*LD, P.y + P.ny*LD + 4, {size:on ? 12 : 10.5, color:on ? KC.sig : KC.ink2, align:P.nx < -0.3 ? 'right' : 'left', weight:on ? 600 : 400, font:'body'});
      if (on){ circ(P.x, P.y, 10, KC.sig); circ(P.x, P.y, 18 + 6*Math.sin(t*8), 'rgba(0,80,255,.18)'); } });
    head('Banda motora · un hemisferio, coronal', 60, 120);
  },
  (p, t, E)=>{
    if (!META){ placeholder(100, 200, 800, 600); return; }
    const regs = E.regs || (E.regs = META.regions.filter(r=>r.group && GROUP_COLORS[r.group]).map((r, i)=>({g:r.group, k:hashf(i*7.3)})).sort((a, b)=>a.k - b.k));
    const e = smooth(0.12, 0.7, p), cols = 12, sz = 46, gap = 6;
    const groups = GROUP_ORDER.filter(g=>regs.some(r=>r.g === g)), cnt = {};
    const gx = (gi) => 70 + (gi % 3)*300, gy = (gi) => 180 + Math.floor(gi/3)*190;
    regs.forEach((r, i)=>{ const x0 = 500 - (cols*(sz + gap))/2 + (i % cols)*(sz + gap), y0 = 220 + Math.floor(i/cols)*(sz + gap);
      const gi = groups.indexOf(r.g), j = cnt[r.g] = (cnt[r.g] || 0) + 1, x1 = gx(gi) + ((j - 1) % 8)*30, y1 = gy(gi) + 30 + Math.floor((j - 1)/8)*30;
      const x = lerp(x0, x1, e), y = lerp(y0, y1, e), s = lerp(sz, 26, e), c = GROUP_COLORS[r.g].map(v=>Math.round(v*255));
      rr(x, y, s, s, 2, `rgb(${c})`); });
    fade(smooth(0.6, 0.85, p), ()=>groups.forEach((g, gi)=>txt(g, gx(gi), gy(gi) + 16, {size:11, color:KC.ink, font:'body', weight:600, maxW:280})));
    txt(`${regs.length} regiones del atlas`, 70, 120, {size:12, color:KC.ink});
  },
],
};

/* ---------- angiogram drawing ---------- */
const ANG = (()=>{
  const R = rnd(42), A = [], V = [];
  const br = (x, y, a, len, w, depth, arr) => { if (depth <= 0 || len < 0.02) return; const x2 = x + Math.cos(a)*len, y2 = y + Math.sin(a)*len; arr.push([x, y, x2, y2, w]);
    br(x2, y2, a + (R() - 0.3)*0.7, len*0.78, w*0.72, depth - 1, arr); if (R() < 0.85) br(x2, y2, a - (R() - 0.2)*0.9, len*0.7, w*0.65, depth - 1, arr); };
  // ICA with siphon (lateral view, face to the left)
  const ica = [[0.56, 1.0], [0.55, 0.82], [0.5, 0.7], [0.44, 0.66], [0.46, 0.6], [0.52, 0.58], [0.5, 0.52]];
  for (let i = 0; i < ica.length - 1; i++) A.push([...ica[i], ...ica[i + 1], 0.022]);
  br(0.5, 0.52, -1.9, 0.12, 0.016, 6, A); // ACA forward/up
  br(0.5, 0.52, -0.9, 0.14, 0.017, 6, A); br(0.5, 0.52, -0.45, 0.13, 0.015, 6, A); // MCA branches up/back
  br(0.56, 0.72, -0.2, 0.12, 0.012, 5, A); // posterior communicating / PCA hint
  // venous: SSS arc, straight + transverse sinus, cortical veins
  for (let i = 0; i < 24; i++){ const a1 = Math.PI*(1.05 + i/24*0.9), a2 = Math.PI*(1.05 + (i + 1)/24*0.9); V.push([0.5 + 0.42*Math.cos(a1), 0.55 + 0.42*Math.sin(a1), 0.5 + 0.42*Math.cos(a2), 0.55 + 0.42*Math.sin(a2), 0.02]); }
  V.push([0.92, 0.55, 0.88, 0.7, 0.02], [0.88, 0.7, 0.72, 0.78, 0.018], [0.72, 0.78, 0.66, 0.95, 0.018], [0.55, 0.45, 0.88, 0.5, 0.012]);
  for (let i = 0; i < 9; i++){ const a = Math.PI*(1.15 + i*0.08); const x = 0.5 + 0.42*Math.cos(a), y = 0.55 + 0.42*Math.sin(a); V.push([x, y, x + (0.5 - x)*0.35 + (R() - 0.5)*0.05, y + (0.55 - y)*0.35, 0.008]); }
  return {A, V};
})();
function angio(x0, y0, s, ph, clean){
  const art = 1 - smooth(0.32, 0.5, ph), cap = smooth(0.25, 0.45, ph)*(1 - smooth(0.6, 0.8, ph)), ven = smooth(0.55, 0.72, ph)*(1 - smooth(0.95, 1, ph)*0.5);
  const c = G.ctx; c.save(); c.lineCap = 'round';
  if (cap > 0.01){ const grd = c.createRadialGradient(x0 + s*0.55, y0 + s*0.42, s*0.05, x0 + s*0.55, y0 + s*0.42, s*0.4); grd.addColorStop(0, `rgba(12,22,27,${0.3*cap})`); grd.addColorStop(1, 'rgba(12,22,27,0)'); c.fillStyle = grd; c.fillRect(x0, y0, s, s); }
  for (const [ax, ay, bx, by, w] of ANG.A) if (art > 0.01){ c.beginPath(); c.moveTo(x0 + ax*s, y0 + ay*s); c.lineTo(x0 + bx*s, y0 + by*s); c.strokeStyle = `rgba(12,22,27,${0.9*art})`; c.lineWidth = w*s; c.stroke(); }
  for (const [ax, ay, bx, by, w] of ANG.V) if (ven > 0.01){ c.beginPath(); c.moveTo(x0 + ax*s, y0 + ay*s); c.lineTo(x0 + bx*s, y0 + by*s); c.strokeStyle = `rgba(12,22,27,${0.85*ven})`; c.lineWidth = w*s; c.stroke(); }
  c.restore();
}
function angioSkull(x0, y0, s){
  const c = G.ctx; c.save();
  c.beginPath(); c.ellipse(x0 + s*0.52, y0 + s*0.5, s*0.44, s*0.4, 0, 0, TAU); c.strokeStyle = 'rgba(80,92,98,.55)'; c.lineWidth = s*0.04; c.stroke();
  c.beginPath(); c.moveTo(x0 + s*0.1, y0 + s*0.58); c.quadraticCurveTo(x0 + s*0.12, y0 + s*0.95, x0 + s*0.42, y0 + s*0.96); c.lineWidth = s*0.03; c.stroke();
  c.fillStyle = 'rgba(80,92,98,.25)'; c.beginPath(); c.ellipse(x0 + s*0.62, y0 + s*0.78, s*0.12, s*0.06, -0.3, 0, TAU); c.fill();
  c.restore();
}

/* =====================================================================
   Immersive chapters: a scroll-driven three.js scene that opens a chapter.
   Scroll position (0..1 through the .imm section) drives the camera and
   every animation stage. MRI is the first; others plug into IMMERSIVE.
   three.js r128 is loaded from cdnjs in the page head; if it is missing or
   WebGL fails, the section collapses and the chapter works as before.
   ===================================================================== */
const IMM = {r:null, visible:false};
if (location.hostname === 'localhost') window.__IMM = IMM;
const ismooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
const ilerp = (a, b, t) => a + (b - a)*t;
const imix = (a, b, t) => a.map((v, i)=>v + (b[i] - v)*t);

/* ---------- shared helpers ---------- */
function immCanvasTex(w, h, draw){ const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; }
function immGlowTex(){ return immCanvasTex(128, 128, (x, w)=>{ const g = x.createRadialGradient(w/2, w/2, 0, w/2, w/2, w/2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }); }
function immRoundRect(w, h, r){ const s = new THREE.Shape(), x = -w/2, y = -h/2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
function immStudioEnv(renderer, o = {}){
  // a soft studio: bright top, light grey floor, two light panels — gives white plastic real reflections
  const env = new THREE.Scene();
  const g = new THREE.SphereGeometry(500, 48, 24), col = [];
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++){ const y = p.getY(i)/500, v = y > 0 ? (o.top ?? 0.98)*(1 - (o.horizon ?? 0)*Math.pow(1 - y, 6)) : (o.floor ?? 0.78) + 0.2*(1 + y); col.push(v, v, v*1.01); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  env.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({side:THREE.BackSide, vertexColors:true})));
  const panel = (x, y, z, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color:new THREE.Color(o.panel ?? 1, o.panel ?? 1, o.panel ?? 1), side:THREE.DoubleSide})); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); };
  panel(0, 420, 0, 520, 260); panel(-380, 120, 260, 220, 320); panel(380, 160, -200, 200, 260);
  const pm = new THREE.PMREMGenerator(renderer); const tex = pm.fromScene(env, 0.035).texture; pm.dispose();
  g.dispose(); return tex;
}

/* ---------- section lifecycle ---------- */
function immMarkup(id){
  const D = IMMERSIVE[id]; if (!D) return '';
  return `<section class="imm" id="imm" style="height:${D.height}vh" aria-label="${D.label}">
    <div class="imm-pin" id="immPin">
      <canvas id="immCv" aria-hidden="true"></canvas>
      <div class="imm-labels" id="immLabels" aria-hidden="true"></div>
      <div class="imm-caps" id="immCaps">${D.caps.map(c=>`<p class="imm-cap" data-a="${c[0]}" data-b="${c[1]}"><b>${c[2]}</b>${c[3]}</p>`).join('')}</div>
      <div class="imm-hud"><span id="immStage">${D.caps[0][2]}</span></div>
      <button type="button" class="imm-cue" id="immCue" title="Saltar a la siguiente etapa" aria-label="${D.hud || 'Desplácese para avanzar por el escáner'}. Pulse para saltar a la siguiente etapa.">
        <span class="cue-ico" aria-hidden="true"><span class="cue-mouse"><i></i></span>
          <svg class="cue-ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" class="cr-bg"/><circle cx="18" cy="18" r="16" class="cr-fg" id="immCueRing"/></svg><span class="cue-mini"></span></span>
        <span class="cue-txt">${D.hud || 'Desplácese para avanzar por el escáner'}</span>
        <span class="cue-chev" aria-hidden="true"><i></i><i></i></span>
      </button>
      <div class="imm-msg" id="immMsg" hidden></div>
      <i class="imm-prog" id="immProg"></i>
    </div>
  </section>
  <div class="deep-head"><p class="eb">La física en detalle</p><h2>${D.deepTitle}</h2></div>`;
}
function immStart(id){
  immStop();
  const D = IMMERSIVE[id], sec = $('#imm'); if (!D || !sec) return;
  const fail = msg => { const m = $('#immMsg'); m.textContent = msg; m.hidden = false; sec.classList.add('imm-off'); };
  if (typeof THREE === 'undefined'){ fail('El recorrido 3D necesita la biblioteca three.js, que no se cargó. La explicación paso a paso que figura abajo sigue funcionando.'); return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas:$('#immCv'), antialias:true, powerPreference:'high-performance'}); }
  catch(e){ fail('Este dispositivo no pudo iniciar el recorrido 3D. La explicación paso a paso que figura abajo sigue funcionando.'); return; }
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
  renderer.setClearColor(0x0d1519, 1);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38, 1, 0.5, 5000);
  const R = {id, D, renderer, scene, camera, p:0, raf:0, pr:Math.min(window.devicePixelRatio || 1, TOUCH ? 1.35 : 1.5), times:[], last:performance.now(), labels:[]};
  R.tier = /[?&#]q=low/.test(location.href) ? 0 : /[?&#]q=mid/.test(location.href) ? 1 : 2;
  R.fixedTier = /[?&#]q=(low|mid|high)/.test(location.href);
  if (TOUCH && !R.fixedTier) R.tier = Math.min(R.tier, 1);
  R.world = D.build(scene, renderer, R);
  R.post = immPost(R);
  R.caps = [...sec.querySelectorAll('.imm-cap')];
  { const cue = $('#immCue');
    if (cue){ if (matchMedia('(hover: none)').matches){ cue.classList.add('touch'); const tx = cue.querySelector('.cue-txt'); tx.textContent = tx.textContent.replace(/^Desplácese/i, 'Deslice hacia arriba'); }
      cue.addEventListener('click', immJump); } }
  IMM.r = R;
  R.io = new IntersectionObserver(es=>{ IMM.visible = es[0].isIntersecting; }); R.io.observe(sec);
  immResize(); immTick();
  const loop = now => {
    R.raf = requestAnimationFrame(loop);
    if (!IMM.visible || VIEW !== 'learn') return;
    const dt = Math.max(0, Math.min(0.1, (now - R.last)/1000)); R.last = Math.max(R.last, now);
    R.times.push(dt); if (R.times.length > 30){ const avg = R.times.reduce((a, b)=>a + b, 0)/R.times.length; R.times = [];
      if (avg > 0.034 && !R.fixedTier){ if (R.tier > 1) R.tier--; else if (R.pr > 0.7){ R.pr *= 0.85; immResize(); } else if (R.tier > 0) R.tier--; } }
    immResize();
    R.world.update(R.p, now/1000, dt);
    if (R.post && R.tier > 0){ R.post.sao && (R.post.sao.enabled = R.tier > 1 && !!R.saoOn); R.post.fin.uniforms.time.value = now/1000; R.post.composer.render(); }
    else renderer.render(scene, camera);
    immLabels();
  };
  R.raf = requestAnimationFrame(loop);
}
function immStop(){
  const R = IMM.r; if (!R) return;
  cancelAnimationFrame(R.raf); R.io && R.io.disconnect();
  R.scene.traverse(o=>{ if (o.geometry) o.geometry.dispose(); if (o.material){ (Array.isArray(o.material) ? o.material : [o.material]).forEach(m=>{ for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); }); } });
  if (R.scene.environment) R.scene.environment.dispose();
  if (R.post){ try { R.post.composer.renderTarget1.dispose(); R.post.composer.renderTarget2.dispose(); } catch(e){} }
  R.renderer.dispose(); try { R.renderer.forceContextLoss(); } catch(e){}
  IMM.r = null;
}
function immResize(){
  const R = IMM.r; if (!R) return;
  const cv = R.renderer.domElement, w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
  if (R.renderer.getPixelRatio() !== R.pr) R.renderer.setPixelRatio(R.pr);
  const sz = R.renderer.getSize(new THREE.Vector2());
  if (sz.x !== w || sz.y !== h){ R.renderer.setSize(w, h, false); R.camera.aspect = w/h; R.camera.updateProjectionMatrix(); }
  if (R.post && (R.post.w !== w || R.post.h !== h || R.post.pr !== R.pr)){ R.post.w = w; R.post.h = h; R.post.pr = R.pr; R.post.composer.setPixelRatio(R.pr); R.post.composer.setSize(w, h); R.post.fin.uniforms.res.value.set(w*R.pr, h*R.pr); }
}
function immTick(){
  const R = IMM.r; if (!R) return;
  const sec = $('#imm'), r = sec.getBoundingClientRect(), pinH = $('#immPin').offsetHeight;
  R.p = Math.min(1, Math.max(0, -r.top/Math.max(1, r.height - pinH)));
  $('#immProg').style.setProperty('--p', R.p.toFixed(4));
  let stage = R.D.caps[0][2];
  R.caps.forEach(c=>{ const a = +c.dataset.a, b = +c.dataset.b, fi = ismooth(a, a + 0.012, R.p), fo = 1 - ismooth(b - 0.012, b, R.p), o = Math.min(fi, fo);
    c.style.opacity = o.toFixed(3); c.style.transform = `translateY(${((1 - fi)*14 - (1 - fo)*10).toFixed(1)}px)`; if (R.p >= a) stage = c.querySelector('b').textContent; });
  { const el = $('#immStage'); if (el.textContent !== stage) el.textContent = stage; }
  const cue = $('#immCue');
  if (cue){ if (R.p > 0.006) R.cueMin = true; cue.classList.toggle('min', !!R.cueMin); cue.classList.toggle('done', R.p > 0.99);
    const ring = $('#immCueRing'); if (ring) ring.style.strokeDashoffset = (100.53*(1 - R.p)).toFixed(2); }
}
// the cue is also a button: it scrolls to the next stage of the walkthrough
function immJump(){
  const R = IMM.r, sec = $('#imm'); if (!R || !sec) return;
  const r = sec.getBoundingClientRect(), pinH = $('#immPin').offsetHeight, span = Math.max(1, r.height - pinH), top = window.scrollY + r.top;
  const nx = R.D.caps.find(c=>c[0] > R.p + 0.004);
  const y = nx ? top + (nx[0] + Math.min(0.02, (nx[1] - nx[0])*0.3))*span : top + r.height - 40;
  window.scrollTo({top:y, behavior:reduceMotion ? 'auto' : 'smooth'});
}
function immLabels(){
  const R = IMM.r, layer = $('#immLabels'); if (!R || !layer) return;
  const L = R.world.labels ? R.world.labels(R.p) : [];
  const w = layer.clientWidth, h = layer.clientHeight, v = new THREE.Vector3();
  while (layer.children.length < L.length){ const d = document.createElement('div'); d.className = 'imm-lbl'; d.innerHTML = '<i></i><span></span>'; layer.appendChild(d); }
  [...layer.children].forEach((el, i)=>{
    const l = L[i]; if (!l || l.a < 0.01){ el.style.opacity = 0; return; }
    v.copy(l.pos).project(R.camera);
    const x = (v.x*0.5 + 0.5)*w, y = (-v.y*0.5 + 0.5)*h;
    if (v.z > 1 || x < 0 || x > w || y < 0 || y > h){ el.style.opacity = 0; return; }
    el.style.opacity = l.a.toFixed(3); el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    el.classList.toggle('left', !!l.left); const s = el.querySelector('span'); if (s.textContent !== l.text) s.textContent = l.text;
  });
}

/* buildMRI lives in imm_mri.js */

/* ---------- film finish: MSAA half-float target → (SAO) → sRGB, vignette, grain, slight lens fringing ---------- */
function immPost(R){
  const T = THREE;
  if (!T.EffectComposer || !T.RenderPass || !T.ShaderPass) return null;
  try {
    const rt = new (T.WebGLMultisampleRenderTarget || T.WebGLRenderTarget)(4, 4, {type:T.HalfFloatType, format:T.RGBAFormat});
    if (rt.samples !== undefined) rt.samples = 4;
    const composer = new T.EffectComposer(R.renderer, rt);
    composer.addPass(new T.RenderPass(R.scene, R.camera));
    let sao = null;
    if (T.SAOPass && T.SAOShader && T.DepthLimitedBlurShader && T.UnpackDepthRGBAShader){
      sao = new T.SAOPass(R.scene, R.camera, false, true);
      Object.assign(sao.params, {saoBias:0.6, saoIntensity:0.012, saoScale:6, saoKernelRadius:28, saoMinResolution:0, saoBlur:true, saoBlurRadius:6, saoBlurStdDev:3.5, saoBlurDepthCutoff:0.008});
      composer.addPass(sao);
    }
    const fin = new T.ShaderPass({
      uniforms:{tDiffuse:{value:null}, res:{value:new T.Vector2(1, 1)}, time:{value:0}, vig:{value:0.2}, grain:{value:0.016}, ca:{value:0.0011}},
      vertexShader:'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }',
      fragmentShader:`uniform sampler2D tDiffuse; uniform vec2 res; uniform float time, vig, grain, ca; varying vec2 vUv;
        vec3 toSRGB(vec3 c){ c = max(c, 0.0); return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }
        void main(){
          vec2 d = vUv - 0.5; float r2 = dot(d, d); vec2 off = d*ca*r2*4.0;
          vec3 c = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
          c = toSRGB(c);
          c *= 1.0 - vig*smoothstep(0.08, 0.5, r2);
          float n = fract(sin(dot(floor(vUv*res) + floor(time*24.0)*vec2(17.0, 31.0), vec2(12.9898, 78.233)))*43758.5453) - 0.5;
          c += n*grain*(0.6 + 0.4*(1.0 - dot(c, vec3(0.333))));
          gl_FragColor = vec4(c, 1.0);
        }`});
    composer.addPass(fin);
    return {composer, sao, fin, w:0, h:0, pr:0};
  } catch(e){ console.warn('post-processing unavailable', e); return null; }
}
// three r128 treats hex colours as linear; convert our sRGB design colours once so they render as specified
function immLinearize(scene){
  const seen = new Set();
  const fix = m => { if (!m || seen.has(m) || m.userData.linear) return; seen.add(m); if (m.color) m.color.convertSRGBToLinear(); if (m.emissive) m.emissive.convertSRGBToLinear(); if (m.map && !m.map.isCompressedTexture) m.map.encoding = THREE.sRGBEncoding; };
  scene.traverse(o=>{ if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(fix); });
  if (scene.background && scene.background.isColor) scene.background.convertSRGBToLinear();
  if (scene.fog) scene.fog.color.convertSRGBToLinear();
  scene.userData.fixMaterial = fix;
}

const IMMERSIVE = {
  mri:{ label:'Recorrido por un escáner de RM', height:1100, build:buildMRI, deepTitle:'Del imán a la imagen, paso a paso',
    caps:[
      [0.005, 0.10, 'Un escáner de 3 teslas', 'El imán es superconductor y permanece encendido día y noche. La línea naranja del suelo marca dónde su campo cae a 5 gauss.'],
      [0.11, 0.225, 'Primero la cabeza', 'La camilla introduce al paciente hasta que la cabeza queda en el isocentro, donde el campo es más uniforme.'],
      [0.245, 0.385, 'Dentro de la coraza', 'Con un cuarto seccionado. Las bobinas de niobio-titanio bañadas en helio líquido a 4 K generan el campo principal; las bobinas de gradiente y la bobina de radiofrecuencia quedan más cerca del orificio.'],
      [0.395, 0.52, 'B₀ = 3 tesla', 'El campo recorre recto el orificio y retorna por fuera del imán. Es 60.000 veces el campo terrestre.'],
      [0.535, 0.655, 'Hacia el orificio', 'El orificio mide unos 70 cm de diámetro. Una bobina de cabeza próxima al cráneo capta la señal tenue.'],
      [0.67, 0.745, 'Protones de hidrógeno', 'Cada protón es un pequeño imán. En B₀ se alinean con el campo y precesan a su alrededor a 128 MHz.'],
      [0.75, 0.79, 'Pulso de radiofrecuencia', 'La bobina de RF transmite exactamente a 128 MHz. Los protones se inclinan y giran juntos, en fase.'],
      [0.795, 0.845, 'El eco', 'Al relajarse y perder la fase, la magnetización giratoria emite una señal de radio. La bobina de cabeza la registra.'],
      [0.85, 0.9, 'Los gradientes seleccionan un corte', 'Las bobinas de gradiente hacen variar el campo a lo ancho de la cabeza, de modo que solo resuena una loseta y la señal codifica la posición.'],
      [0.905, 0.962, 'espacio k', 'Cada eco llena una línea de datos crudos, desde el centro hacia fuera. El centro aporta el contraste; las líneas externas, el detalle fino.'],
      [0.966, 1.01, 'La imagen', 'Una transformada de Fourier 2D inversa convierte el espacio k en el corte: este encéfalo, ponderado en T1. Siga desplazándose para ver la física en detalle.'],
    ]},
};

/* =====================================================================
   A smooth, featureless mannequin built from turned (lathe) segments.
   Shared by the MRI walkthrough (supine patient) and Brain Lab (posed,
   articulated). Units: centimetres, standing on y = 0, facing +z.
   Every joint is a THREE.Group, so poses are plain rotations:
     M.j.shoulderL.rotation.z = …,  M.j.elbowR.rotation.x = …,  etc.
   ===================================================================== */
function buildMannequin(T, opts = {}){
  const mat = opts.material || new T.MeshPhysicalMaterial({color:new T.Color(0xc4cacf).convertSRGBToLinear(), roughness:0.42, metalness:0, clearcoat:0.35, clearcoatRoughness:0.35});
  const seg = opts.segments || 40;
  mat.userData.linear = true;   // colour already converted to linear
  const M = {group:new T.Group(), j:{}, mat, meshes:[]};
  const add = (parent, geo) => { const m = new T.Mesh(geo, mat); m.castShadow = !!opts.shadows; m.receiveShadow = !!opts.shadows; parent.add(m); M.meshes.push(m); return m; };
  const joint = (name, parent, x, y, z) => { const g = new T.Group(); g.position.set(x, y, z); parent.add(g); M.j[name] = g; return g; };
  // a smooth tapered limb along -y from the joint: radius r0 → r1 over length len, with rounded ends
  const limb = (r0, r1, len, bulge = 0) => {
    const pts = [], n = 18;
    for (let i = 0; i <= 6; i++){ const a = i/6*Math.PI/2; pts.push(new T.Vector2(Math.sin(a)*r1, -len - Math.cos(a)*r1*0.7)); }   // rounded tip
    for (let i = 1; i < n; i++){ const u = 1 - i/n; pts.push(new T.Vector2(r0 + (r1 - r0)*u + bulge*Math.sin(Math.PI*u)*(1 - u*0.4), -u*len)); }
    for (let i = 0; i <= 6; i++){ const a = i/6*Math.PI/2; pts.push(new T.Vector2(Math.cos(a)*r0, Math.sin(a)*r0*0.7)); }        // rounded top
    return new T.LatheGeometry(pts, seg);
  };
  const ellipsoid = (rx, ry, rz) => { const g = new T.SphereGeometry(1, seg, Math.round(seg*0.7)); g.scale(rx, ry, rz); return g; };

  // pelvis and torso: one turned profile, flattened front-to-back
  const root = joint('root', M.group, 0, 0, 0);
  const pelvis = joint('pelvis', root, 0, 96, 0);
  const torsoPts = [[0, -12], [9, -11.6], [15, -8], [16.6, -2], [15.4, 4], [13.6, 11], [13.4, 16], [14.8, 24], [16.4, 32], [16.6, 37], [15.4, 42], [12.4, 46.5], [8.4, 49.6], [5.6, 51.4], [0, 52.2]];
  const torsoG = new T.LatheGeometry(torsoPts.map(([r, y])=>new T.Vector2(r, y)), seg); torsoG.scale(1, 1, 0.64);
  const spine = joint('spine', pelvis, 0, 0, 0); add(spine, torsoG);
  // neck and head (egg shape, no features: a smooth blank face)
  const neck = joint('neck', spine, 0, 51, 0);
  const ng = limb(4.6, 5.3, 7); ng.rotateX(Math.PI); add(neck, ng);
  const head = joint('head', neck, 0, 6.5, 0.8);
  const headG = ellipsoid(7.6, 11.2, 9.6); headG.translate(0, 10.5, 0.8);
  // gentle jaw taper: pull the lower front of the head inward
  const hp = headG.attributes.position; for (let i = 0; i < hp.count; i++){ const y = hp.getY(i) - 10.5; if (y < -2){ const k = Math.min(1, (-2 - y)/9); hp.setX(i, hp.getX(i)*(1 - 0.22*k)); hp.setZ(i, hp.getZ(i)*(1 - 0.12*k) + (hp.getZ(i) > 0 ? -0.8*k : 0)); } }
  headG.computeVertexNormals(); add(head, headG);
  // arms
  for (const s of [1, -1]){
    const L = s > 0 ? 'L' : 'R';   // L = the mannequin's left (+x)
    const sh = joint('shoulder' + L, spine, 15.6*s, 43.5, 0);
    add(sh, ellipsoid(5.4, 5.6, 5.4));
    add(sh, limb(4.9, 3.7, 28, 0.5));
    const el = joint('elbow' + L, sh, 0, -29, 0);
    add(el, limb(3.8, 2.7, 25, 0.6));
    const wr = joint('wrist' + L, el, 0, -26, 0);
    const pg = limb(2.7, 2.2, 9.5); pg.scale(1.45, 1, 0.62); add(wr, pg);
    const fing = joint('fingers' + L, wr, 0, -10.5, 0); const fg = limb(3.1, 2.4, 6.5); fg.scale(1.15, 1, 0.42); add(fing, fg);
    const th = joint('thumb' + L, wr, 2.8*s, -3, 1.2); th.rotation.z = 0.45*s; const tg = limb(1.3, 1.05, 5.4); add(th, tg);
  }
  // legs
  for (const s of [1, -1]){
    const L = s > 0 ? 'L' : 'R';
    const hip = joint('hip' + L, pelvis, 9.2*s, -4, 0);
    add(hip, limb(8.0, 5.1, 43, 0.9));
    const kn = joint('knee' + L, hip, 0, -44, 0);
    add(kn, limb(5.0, 3.5, 41, 0.9));
    const an = joint('ankle' + L, kn, 0, -42, 0);
    const fg = ellipsoid(4.0, 3.0, 11.6); fg.translate(0, -2.4, 5.4);
    const fp = fg.attributes.position; for (let i = 0; i < fp.count; i++){ if (fp.getY(i) < -2.4) fp.setY(i, -2.4 - (-2.4 - fp.getY(i))*0.35); } fg.computeVertexNormals(); add(an, fg);
  }
  return M;
}
// supine on a table: lying along -z (head toward the scanner), face up
function poseSupine(M){
  M.j.root.rotation.x = -Math.PI/2;
  for (const s of ['L', 'R']){ const k = s === 'L' ? 1 : -1;
    M.j['shoulder' + s].rotation.z = 0.14*k; M.j['elbow' + s].rotation.x = 0.08; M.j['wrist' + s].rotation.y = -0.9*k;
    M.j['hip' + s].rotation.z = 0.035*k; M.j['ankle' + s].rotation.x = -0.25; }
  return M;
}

/* =====================================================================
   MRI walkthrough, product-film version (direction A: white clinical).
   One continuous camera move driven by scroll:
     0.00 suite · 0.10 table slides in · 0.24 quarter-section cutaway
     0.39 B0 field · 0.53 into the bore · 0.66 protons · 0.75 RF
     0.80 echo · 0.85 gradients select a slice · 0.90 k-space → image
   Units: centimetres. Bore axis = Z (patient's feet toward +Z).
   ===================================================================== */
function buildMRI(scene, renderer, R){
  const W = {}, T = THREE;
  const LIN = h => new T.Color(h);   // immLinearize converts every material colour once at the end
  // studio backdrop: a soft radial falloff, like a cyclorama lit from the front
  const bg = immCanvasTex(512, 512, (x, w, h)=>{ const g = x.createRadialGradient(w*0.5, h*0.42, 0, w*0.5, h*0.5, w*0.75); g.addColorStop(0, '#26323b'); g.addColorStop(0.55, '#172128'); g.addColorStop(1, '#0a1014'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  bg.encoding = T.sRGBEncoding; scene.background = bg;
  scene.fog = new T.Fog(0x10181d, 1200, 3400);
  scene.environment = immStudioEnv(renderer, {top:0.55, floor:0.22, horizon:0.6, panel:2.6});
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  scene.add(new T.HemisphereLight(0xffffff, 0xb9c3c9, 0.18));
  const key = new T.DirectionalLight(0xfff8f0, 1.6); key.position.set(-380, 520, 460); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, {left:-330, right:330, top:330, bottom:-330, near:100, far:1600});
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.6; scene.add(key); W.key = key;
  const rim = new T.DirectionalLight(0xdfe9ff, 0.6); rim.position.set(420, 260, -360); scene.add(rim);
  const fill = new T.DirectionalLight(0xe8f0ff, 0.25); fill.position.set(500, 120, 300); scene.add(fill);
  const glowTex = immGlowTex();
  const SIG = 0x0050ff, FLOOR = -124;

  /* ---------- clipping: a wedge cut out of the magnet (quarter section) ---------- */
  W.clipA = new T.Plane(new T.Vector3(1, 0, 0), 0); W.clipB = new T.Plane(new T.Vector3(-1, 0, 0), 0);
  const cutMats = [];
  const clipMat = m => { m.clippingPlanes = [W.clipA, W.clipB]; m.clipIntersection = true; m.clipShadows = true; cutMats.push(m); return m; };
  const setWedge = (a0, a1) => { W.clipA.normal.set(Math.sin(a0), -Math.cos(a0), 0); W.clipB.normal.set(-Math.sin(a1), Math.cos(a1), 0); };

  /* ---------- materials ---------- */
  const M = {
    shell: clipMat(new T.MeshPhysicalMaterial({color:LIN(0xf3f5f6), roughness:0.24, metalness:0, clearcoat:0.85, clearcoatRoughness:0.1, side:T.DoubleSide})),
    trim: clipMat(new T.MeshPhysicalMaterial({color:LIN(0xdde3e6), roughness:0.32, clearcoat:0.5, side:T.DoubleSide})),
    seam: clipMat(new T.MeshStandardMaterial({color:LIN(0x3a454b), roughness:0.6, side:T.DoubleSide})),
    plinth: new T.MeshStandardMaterial({color:LIN(0x56636a), roughness:0.45, metalness:0.2}),
    steel: clipMat(new T.MeshStandardMaterial({color:LIN(0xaeb8be), roughness:0.26, metalness:0.92, side:T.DoubleSide})),
    copper: clipMat(new T.MeshStandardMaterial({color:LIN(0xb8692f), roughness:0.38, metalness:0.75, side:T.DoubleSide, emissive:LIN(0x1f5cff), emissiveIntensity:0})),
    helium: clipMat(new T.MeshPhysicalMaterial({color:LIN(0xb8dcff), roughness:0.05, metalness:0, transparent:true, opacity:0.2, side:T.DoubleSide, depthWrite:false})),
    grad: clipMat(new T.MeshStandardMaterial({color:LIN(0xffffff), roughness:0.45, metalness:0.35, side:T.DoubleSide, emissive:LIN(0xff6a1a), emissiveIntensity:0})),
    rf: clipMat(new T.MeshStandardMaterial({color:LIN(0xd6a648), roughness:0.25, metalness:0.95, emissive:LIN(0x3a7dff), emissiveIntensity:0})),
    liner: clipMat(new T.MeshStandardMaterial({color:LIN(0xd9dfe3), roughness:0.6, side:T.DoubleSide, emissive:LIN(0x3a6dff), emissiveIntensity:0, envMapIntensity:0.55})),
    cut: new T.MeshStandardMaterial({color:LIN(0x7d8a92), roughness:0.7, side:T.DoubleSide}),
    glass: new T.MeshPhysicalMaterial({color:LIN(0x0d1418), roughness:0.12, metalness:0.1, clearcoat:1, clearcoatRoughness:0.05}),
  };
  W.M = M;
  // the gradient coil: copper "fingerprint" windings on dark resin
  const fp = immCanvasTex(1024, 512, (x, w, h)=>{ x.fillStyle = '#2a2420'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c8823f'; x.lineWidth = 3.2;
    for (const [cx, cy] of [[w*0.25, h*0.3], [w*0.25, h*0.7], [w*0.75, h*0.3], [w*0.75, h*0.7]]) for (let k = 1; k < 13; k++){ x.beginPath(); x.ellipse(cx, cy, k*9.5, k*6.2, 0, 0, Math.PI*2); x.stroke(); } });
  M.grad.map = fp; fp.wrapS = T.RepeatWrapping;
  // coils: fine circumferential windings on the outside, packed wire ends on the cut face
  const wind = immCanvasTex(64, 64, (x, w, h)=>{ x.fillStyle = '#c8783c'; x.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++){ const g = x.createLinearGradient(0, i*8, 0, i*8 + 8); g.addColorStop(0, 'rgba(60,24,6,.55)'); g.addColorStop(0.5, 'rgba(255,214,160,.25)'); g.addColorStop(1, 'rgba(60,24,6,.55)'); x.fillStyle = g; x.fillRect(0, i*8, w, 8); } });
  wind.wrapS = wind.wrapT = T.RepeatWrapping; wind.repeat.set(1/40, 1/1.6); M.copper.map = wind;
  W.wireEnds = immCanvasTex(64, 64, (x, w, h)=>{ x.fillStyle = '#5a3218'; x.fillRect(0, 0, w, h); for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++){ const g = x.createRadialGradient(i*16 + 8, j*16 + 8, 1, i*16 + 8, j*16 + 8, 7.5); g.addColorStop(0, '#f2b47a'); g.addColorStop(0.7, '#b8692f'); g.addColorStop(1, '#3a1e0c'); x.fillStyle = g; x.beginPath(); x.arc(i*16 + 8, j*16 + 8, 7.4, 0, Math.PI*2); x.fill(); } });
  W.wireEnds.wrapS = W.wireEnds.wrapT = T.RepeatWrapping;

  /* ---------- room ---------- */
  // the floor fades into the backdrop instead of meeting it at a horizon line
  const floorFade = immCanvasTex(512, 512, (x, w)=>{ const g = x.createRadialGradient(w/2, w/2, 0, w/2, w/2, w/2); g.addColorStop(0, '#fff'); g.addColorStop(0.55, '#fff'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
  const floor = new T.Mesh(new T.CircleGeometry(1500, 96), new T.MeshPhysicalMaterial({color:LIN(0x1c252c), roughness:0.75, clearcoat:0.08, envMapIntensity:0.35, clearcoatRoughness:0.35, alphaMap:floorFade, transparent:true, depthWrite:false}));
  floor.rotation.x = -Math.PI/2; floor.position.y = FLOOR; floor.receiveShadow = true; scene.add(floor);
  const gauss = new T.Mesh(new T.RingGeometry(278, 281.5, 160), new T.MeshBasicMaterial({color:LIN(0xe8962a), transparent:true, opacity:0.6}));
  gauss.rotation.x = -Math.PI/2; gauss.position.set(0, FLOOR + 0.3, 10); gauss.scale.set(1, 1.32, 1); scene.add(gauss);
  const ao = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({map:immCanvasTex(256, 256, (x, w)=>{ const g = x.createRadialGradient(w/2, w/2, 0, w/2, w/2, w/2); g.addColorStop(0, 'rgba(20,30,36,.55)'); g.addColorStop(0.45, 'rgba(20,30,36,.22)'); g.addColorStop(1, 'rgba(20,30,36,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }), transparent:true, depthWrite:false}));
  ao.rotation.x = -Math.PI/2; ao.position.set(0, FLOOR + 0.4, 10); ao.scale.set(330, 300, 1); scene.add(ao);
  const ao2 = ao.clone(); ao2.position.set(0, FLOOR + 0.45, 225); ao2.scale.set(130, 260, 1); scene.add(ao2);

  /* ---------- magnet exterior ---------- */
  const mag = new T.Group(); scene.add(mag); W.mag = mag;
  const shadow = m => { m.castShadow = true; m.receiveShadow = true; return m; };
  const ringShape = (w, h, r, hole) => { const s = immRoundRect(w, h, r); const p = new T.Path(); p.absarc(0, 0, hole, 0, Math.PI*2, true); s.holes.push(p); return s; };
  // main body between the covers
  const body = shadow(new T.Mesh(new T.ExtrudeGeometry(ringShape(232, 236, 58, 64), {depth:128, bevelEnabled:true, bevelThickness:6, bevelSize:6, bevelSegments:8, curveSegments:72}), M.shell));
  body.geometry.translate(0, 0, -64); mag.add(body); W.body = body;
  // seams: a dark recessed band on each side of the body
  for (const z of [-71.5, 71.5]){ const s = new T.Mesh(new T.ExtrudeGeometry(ringShape(226, 230, 55, 62), {depth:3, bevelEnabled:false, curveSegments:64}), M.seam); s.position.z = z - 1.5; mag.add(s); }
  // front and rear covers with a bell-mouth flare into the bore
  const coverGeo = new T.ExtrudeGeometry(ringShape(238, 242, 60, 57), {depth:16, bevelEnabled:true, bevelThickness:5, bevelSize:5, bevelSegments:10, curveSegments:80});
  const flarePts = []; for (let i = 0; i <= 24; i++){ const u = i/24, r = 36.5 + 21*Math.pow(u, 2.2); flarePts.push(new T.Vector2(r, -28 + 28*Math.pow(u, 0.8))); }
  const flareGeo = new T.LatheGeometry(flarePts, 128); flareGeo.rotateX(Math.PI/2);   // lathe around z: radius in xy, depth along -z
  W.covers = [];
  for (const side of [1, -1]){
    const g = new T.Group(); g.position.z = 77*side; mag.add(g); W.covers.push(g);
    const c = shadow(new T.Mesh(coverGeo, M.shell)); c.position.z = side > 0 ? 0 : -16; g.add(c);
    const f = new T.Mesh(flareGeo, M.shell); f.scale.z = side; f.position.z = side > 0 ? 21 : -21; g.add(f); f.receiveShadow = true;
    // the trim ring and the light ring around the bore
    const trim = new T.Mesh(new T.TorusGeometry(60, 2.4, 24, 160), M.trim); trim.position.z = side > 0 ? 21.5 : -21.5; g.add(trim);
    if (side > 0){
      W.ringMat = clipMat(new T.MeshStandardMaterial({color:SIG, emissive:SIG, emissiveIntensity:1.4, roughness:0.4}));
      const ring = new T.Mesh(new T.TorusGeometry(64.5, 0.75, 12, 200), W.ringMat); ring.position.z = 21.6; g.add(ring); W.ring = ring;
      const halo = new T.Sprite(new T.SpriteMaterial({map:glowTex, color:0x4d86ff, transparent:true, opacity:0.16, depthWrite:false, blending:T.AdditiveBlending}));
      halo.scale.set(175, 175, 1); halo.position.z = 22; g.add(halo); W.halo = halo;
      // two small glass touch panels beside the bore
      for (const sx of [-1, 1]){
        const tex = immCanvasTex(512, 320, (x, w, h)=>{ x.fillStyle = '#0d1418'; x.fillRect(0, 0, w, h); x.fillStyle = '#5f8dff'; x.font = '500 30px monospace'; x.fillText(sx < 0 ? 'CABEZA PRIMERO · SUPINO' : '3.0 T', 30, 62);
          x.fillStyle = '#c8d4da'; x.font = '400 24px monospace'; x.fillText(sx < 0 ? 'Rutina cerebral' : 'He 98 %  ·  4.2 K', 30, 120); x.fillText(sx < 0 ? 'T1 MPRAGE  04:12' : 'Camilla 0 mm', 30, 162);
          x.strokeStyle = '#2a63ff'; x.lineWidth = 4; x.beginPath(); x.moveTo(30, 250); x.lineTo(w - 30, 250); x.stroke(); x.strokeStyle = '#5f8dff'; x.beginPath(); x.moveTo(30, 250); x.lineTo(30 + (w - 60)*(sx < 0 ? 0.62 : 0.98), 250); x.stroke(); });
        const scr = new T.Mesh(new T.PlaneGeometry(26, 16.25), clipMat(new T.MeshBasicMaterial({map:tex, toneMapped:false})));
        scr.position.set(sx*86, 58, 21.4); scr.rotation.y = -sx*0.18; g.add(scr);
        const bez = new T.Mesh(new T.BoxGeometry(28, 18.2, 1.2), clipMat(M.glass)); bez.position.set(sx*86, 58, 20.6); bez.rotation.y = -sx*0.18; g.add(bez);
      }
      // a quiet name plate
      const plate = new T.Mesh(new T.PlaneGeometry(56, 9), clipMat(new T.MeshBasicMaterial({transparent:true, map:immCanvasTex(512, 82, (x, w, h)=>{ x.fillStyle = '#7d8b92'; x.font = '500 34px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('N E U R O · 3 T', w/2, h/2 + 2); })})));
      plate.position.set(0, 96, 21.6); g.add(plate);
    }
  }
  // plinth
  const plinth = shadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(212, 150, 14), {depth:16, bevelEnabled:true, bevelThickness:2, bevelSize:2, bevelSegments:3}), M.plinth));
  plinth.rotation.x = -Math.PI/2; plinth.position.set(0, FLOOR, 75); mag.add(plinth);
  // bore liner, light strip, and a soft darkening deep inside
  const linerTex = immCanvasTex(16, 512, (x, w, h)=>{ const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#aeb9c0'); g.addColorStop(1, '#ffffff'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  M.liner.map = linerTex;
  const liner = new T.Mesh(new T.CylinderGeometry(36.5, 36.5, 176, 128, 1, true), M.liner); liner.rotation.x = Math.PI/2; liner.receiveShadow = true; mag.add(liner);
  const strip = new T.Mesh(new T.CylinderGeometry(36.1, 36.1, 168, 32, 1, true, -0.16, 0.32), clipMat(new T.MeshBasicMaterial({color:0xffffff, side:T.BackSide, toneMapped:false}))); strip.rotation.x = Math.PI/2; mag.add(strip);

  /* ---------- inside the magnet (revealed by the cutaway) ---------- */
  const inner = new T.Group(); mag.add(inner); W.inner = inner;
  const tube = (r0, r1, len, mat, z = 0) => {   // a thick-walled cylinder with flat annular ends
    const s = new T.Shape(); s.absarc(0, 0, r1, 0, Math.PI*2, false); const h = new T.Path(); h.absarc(0, 0, r0, 0, Math.PI*2, true); s.holes.push(h);
    const g = new T.ExtrudeGeometry(s, {depth:len, bevelEnabled:false, curveSegments:128}); g.translate(0, 0, -len/2 + z);
    const m = new T.Mesh(g, mat); inner.add(m); return m; };
  tube(98, 101, 150, M.steel);  tube(52, 55, 150, M.steel);            // vacuum vessel walls
  for (const z of [-73.5, 73.5]) tube(52, 101, 3, M.steel, z);       // its end plates
  W.he = tube(57, 95, 140, M.helium);                                  // liquid-helium vessel
  [[-58, 12], [-32, 16], [-9, 14], [9, 14], [32, 16], [58, 12]].forEach(([z, w])=>tube(64, 72, w, M.copper, z));   // main NbTi coils
  for (const z of [-60, 60]) tube(86, 92, 16, M.copper, z);           // active-shield coils
  const gc = tube(44, 48.5, 140, M.grad);                              // gradient coil tube
  // RF birdcage: 16 rungs and two end rings
  for (let i = 0; i < 16; i++){ const a = i/16*Math.PI*2, b = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 66, 10), M.rf); b.rotation.x = Math.PI/2; b.position.set(40.2*Math.cos(a), 40.2*Math.sin(a), 0); inner.add(b); }
  for (const z of [-33, 33]){ const m = new T.Mesh(new T.TorusGeometry(40.2, 1.1, 10, 128), M.rf); m.position.z = z; inner.add(m); }
  // section faces where the wedge is cut: flat grey caps make the cut read as solid
  W.caps = new T.Group(); mag.add(W.caps);
  const capFor = (r0, r1, z0, z1) => { const g = new T.PlaneGeometry(r1 - r0, z1 - z0); g.translate((r0 + r1)/2, 0, 0); g.rotateX(Math.PI/2); g.translate(0, 0, (z0 + z1)/2); return g; };
  W.capA = new T.Group(); W.capB = new T.Group(); W.caps.add(W.capA, W.capB);
  const capSpecs = [[98, 101, -75, 75], [52, 55, -75, 75], [57, 95, -70, 70, M.helium], [44, 48.5, -70, 70, M.grad], [36.5, 37.5, -88, 88]];
  [[-58, 12], [-32, 16], [-9, 14], [9, 14], [32, 16], [58, 12]].forEach(([z, w])=>capSpecs.push([64, 72, z - w/2, z + w/2, M.copper]));
  for (const pivot of [W.capA, W.capB]) for (const [r0, r1, z0, z1, mat] of capSpecs){ const mm = (mat || M.cut).clone(); mm.clippingPlanes = null; mm.clipShadows = false; mm.map = null;
    if (mat === M.copper){ const t = W.wireEnds.clone(); t.needsUpdate = true; t.repeat.set((r1 - r0)/1.6, (z1 - z0)/1.6); mm.map = t; mm.color.set(0xffffff); mm.metalness = 0.5; }
    else if (mat && mat !== M.helium) mm.color.multiplyScalar(0.8);
    pivot.add(new T.Mesh(capFor(r0, r1, z0, z1), mm)); }
  // outer shell section (covers + body) as one band, so the cut edge of the white shell looks solid
  for (const pivot of [W.capA, W.capB]){ const m = new T.Mesh(capFor(101, 121, -88, 88), new T.MeshStandardMaterial({color:LIN(0xb7c1c7), roughness:0.6, side:T.DoubleSide})); pivot.add(m); }
  W.caps.visible = false;

  /* ---------- B0 field lines ---------- */
  const stripe = immCanvasTex(256, 8, (x, w, h)=>{ const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  stripe.wrapS = stripe.wrapT = T.RepeatWrapping; stripe.repeat.set(14, 1);
  W.fieldMat = new T.MeshBasicMaterial({color:0x1f5cff, alphaMap:stripe, transparent:true, opacity:0, depthWrite:false, side:T.DoubleSide});
  const field = new T.Group(); scene.add(field); W.field = field; W.stripe = stripe;
  for (let k = 0; k < 12; k++){
    const phi = k/12*Math.PI*2 + 0.3, rin = k % 2 ? 12 : 26, rout = k % 2 ? 236 : 182, L = k % 2 ? 310 : 260;
    const P = (r, z) => new T.Vector3(r*Math.cos(phi), r*Math.sin(phi), z);
    const curve = new T.CatmullRomCurve3([P(rin, -L), P(rin, -L/2), P(rin, 0), P(rin, L/2), P(rin, L), P(rout*0.6, L*1.25), P(rout, L*0.6), P(rout*1.04, 0), P(rout, -L*0.6), P(rout*0.6, -L*1.25)], true, 'centripetal');
    field.add(new T.Mesh(new T.TubeGeometry(curve, 260, k % 2 ? 0.7 : 1.0, 6, true), W.fieldMat));
  }

  /* ---------- patient table and patient ---------- */
  const tblMat = new T.MeshPhysicalMaterial({color:LIN(0xf6f8f9), roughness:0.26, clearcoat:0.7, clearcoatRoughness:0.12});
  const ped = shadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(58, 96, 12), {depth:170, bevelEnabled:true, bevelThickness:4, bevelSize:4, bevelSegments:6}), tblMat));
  ped.position.set(0, -76, 140); scene.add(ped);
  const pedBase = shadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(66, 176, 10), {depth:6, bevelEnabled:true, bevelThickness:2, bevelSize:2, bevelSegments:3}), M.plinth));
  pedBase.rotation.x = -Math.PI/2; pedBase.position.set(0, FLOOR, 226); scene.add(pedBase);
  const table = new T.Group(); scene.add(table); W.table = table;
  const top = shadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(54, 6, 3), {depth:240, bevelEnabled:true, bevelThickness:2, bevelSize:1.2, bevelSegments:4, curveSegments:12}), tblMat)); top.geometry.translate(0, -4, -12); table.add(top);
  for (const sx of [-1, 1]){ const rail = shadow(new T.Mesh(new T.BoxGeometry(1.6, 2.4, 232), M.steel.clone())); rail.material.clippingPlanes = null; rail.material.clipShadows = false; rail.position.set(sx*28.4, -3, 108); table.add(rail); }
  const pad = shadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(48, 5, 2.4), {depth:226, bevelEnabled:true, bevelThickness:1.6, bevelSize:1.2, bevelSegments:4}), new T.MeshStandardMaterial({color:LIN(0x9fb1bc), roughness:0.85})));
  pad.position.set(0, 1.6, -4); table.add(pad);
  W.patient = buildMannequin(T, {shadows:true}); poseSupine(W.patient);
  // lying head toward the magnet: rotate so the head points to -z, then lift onto the pad
  W.patient.group.position.set(0, 18.6, 181); table.add(W.patient.group);
  W.patMat = W.patient.mat;
  const blanket = shadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(42, 12, 6), {depth:90, bevelEnabled:true, bevelThickness:4, bevelSize:2, bevelSegments:8, curveSegments:16}), new T.MeshStandardMaterial({color:LIN(0xbfcdd6), roughness:0.95})));
  blanket.position.set(0, 20.5, 92); table.add(blanket);
  // head coil: a lower cradle and a ribbed upper cage with a mirror
  const hcMat = new T.MeshPhysicalMaterial({color:LIN(0xf8f9fa), roughness:0.28, clearcoat:0.7, transparent:true, side:T.DoubleSide}); W.hcMat = hcMat;
  const hc = new T.Group(); hc.position.set(0, 19, 16); table.add(hc); W.headCoil = hc;
  const cradle = shadow(new T.Mesh(new T.CylinderGeometry(15.5, 15.5, 32, 64, 1, true, -Math.PI*0.5, Math.PI), hcMat)); cradle.rotation.x = Math.PI/2; hc.add(cradle);
  for (const z of [-15, -5, 5, 15]){ const r = new T.Mesh(new T.TorusGeometry(15.5, 1.1, 10, 64, Math.PI), hcMat); r.position.z = z; hc.add(r); }
  for (const a of [0.25, 0.5, 0.75].map(f=>f*Math.PI)){ const b = new T.Mesh(new T.BoxGeometry(2.2, 2.2, 32), hcMat); b.position.set(15.5*Math.cos(a), 15.5*Math.sin(a), 0); hc.add(b); }
  const mirror = new T.Mesh(new T.PlaneGeometry(9, 5), new T.MeshPhysicalMaterial({color:LIN(0xcfd8de), roughness:0.02, metalness:1, transparent:true})); mirror.position.set(0, 17.5, 4); mirror.rotation.x = -Math.PI/2 + 0.6; hc.add(mirror); W.mirror = mirror;
  W.hcParts = []; hc.traverse(o=>{ if (o.isMesh) W.hcParts.push(o); });

  /* ---------- the real brain (Colin 27 surface) ---------- */
  W.brainGroup = new T.Group(); scene.add(W.brainGroup);
  W.brainMat = new T.MeshStandardMaterial({vertexColors:true, roughness:0.5, metalness:0, transparent:true, opacity:0, depthWrite:false});
  W.tryBrain = () => {
    if (W.brain || typeof MESHRAW === 'undefined' || !MESHRAW) return;
    const Mr = MESHRAW, n = Mr.nv, g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(Mr.pos.subarray(0, n*3), 3));
    const nr = new Int8Array(n*3), col = new Uint8Array(n*3);
    for (let i = 0; i < n; i++){ nr[i*3] = Mr.nrm[i*4]; nr[i*3 + 1] = Mr.nrm[i*4 + 1]; nr[i*3 + 2] = Mr.nrm[i*4 + 2];
      const c = Math.max(0, Math.min(1, (Mr.nrm[i*4 + 3]/127 + 0.1)/0.95)), r = Mr.reg[i], vent = (r >= 97 && r <= 98) || r >= 117;
      const lin = v => 255*Math.pow(v/255, 2.2);
      if (vent){ col[i*3] = lin(70); col[i*3 + 1] = lin(120); col[i*3 + 2] = 255; } else { const k = 0.42 + 0.58*c; col[i*3] = lin(232*k); col[i*3 + 1] = lin(206*k); col[i*3 + 2] = lin(198*k + 14*(1 - c)); } }
    g.setAttribute('normal', new T.BufferAttribute(nr, 3, true)); g.setAttribute('color', new T.BufferAttribute(col, 3, true));
    g.setIndex(new T.BufferAttribute(Mr.idx.subarray(0, Mr.brainCount), 1));
    W.brain = new T.Mesh(g, W.brainMat);
    W.brain.scale.set(-1/640, 1/640, -1/640); W.brain.position.set(0, 1.8, 1.0);   // MNI mm → scanner cm, supine head-first
    W.brainGroup.add(W.brain);
  };

  /* ---------- protons in a voxel ---------- */
  const N = 5, cnt = N*N*N;
  const arrowGeo = new T.LatheGeometry([new T.Vector2(0, 0), new T.Vector2(0.18, 0), new T.Vector2(0.18, 0.7), new T.Vector2(0.42, 0.7), new T.Vector2(0, 1.12)], 14);
  W.spinMat = new T.MeshStandardMaterial({color:LIN(0x1d4fe0), roughness:0.35, metalness:0.1, emissive:LIN(0x0a2a99), emissiveIntensity:0.35, transparent:true, opacity:0});
  W.spins = new T.InstancedMesh(arrowGeo, W.spinMat, cnt);
  W.nucMat = new T.MeshStandardMaterial({color:LIN(0xdfe6ff), roughness:0.3, emissive:LIN(0x6f8fff), emissiveIntensity:0.25, transparent:true, opacity:0});
  W.nuclei = new T.InstancedMesh(new T.SphereGeometry(0.16, 16, 12), W.nucMat, cnt);
  W.spinData = []; const rr = rnd(9);
  for (let i = 0; i < cnt; i++){ const ix = i % N, iy = Math.floor(i/N) % N, iz = Math.floor(i/(N*N)), u = rr()*2 - 1, th = rr()*Math.PI*2, s = Math.sqrt(1 - u*u);
    W.spinData.push({p:new T.Vector3((ix - 2)*1.7 + (rr() - 0.5)*0.35, (iy - 2)*1.7 + (rr() - 0.5)*0.35, (iz - 2)*1.7 + (rr() - 0.5)*0.35), rand:new T.Vector3(s*Math.cos(th), s*Math.sin(th), u), ph:rr()*Math.PI*2, anti:rr() < 0.12, tilt:0.32 + rr()*0.2, w:0.9 + rr()*0.2}); }
  W.spinGroup = new T.Group(); W.spinGroup.add(W.spins, W.nuclei); W.spinGroup.scale.setScalar(0.55); scene.add(W.spinGroup);
  W.spins.renderOrder = 3; W.nuclei.renderOrder = 3;
  W.voxMat = new T.LineBasicMaterial({color:SIG, transparent:true, opacity:0});
  W.vox = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(9.2, 9.2, 9.2)), W.voxMat); W.spinGroup.add(W.vox);
  W.mMat = new T.MeshStandardMaterial({color:LIN(0xe8962a), emissive:LIN(0xe8962a), emissiveIntensity:0.6, transparent:true, opacity:0});
  W.mVec = new T.Mesh(new T.LatheGeometry([new T.Vector2(0, 0), new T.Vector2(0.35, 0), new T.Vector2(0.35, 4.2), new T.Vector2(0.9, 4.2), new T.Vector2(0, 5.6)], 20), W.mMat); W.spinGroup.add(W.mVec);
  W.waves = []; for (let i = 0; i < 4; i++){ const m = new T.Mesh(new T.TorusGeometry(1, 0.05, 8, 96), new T.MeshBasicMaterial({color:0xe8962a, transparent:true, opacity:0, depthWrite:false})); W.spinGroup.add(m); W.waves.push(m); }

  /* ---------- gradient slab, then k-space and the image ---------- */
  const sg = new T.PlaneGeometry(21.6, 21.6); sg.applyMatrix4(new T.Matrix4().makeBasis(new T.Vector3(0, -1, 0), new T.Vector3(0, 0, -1), new T.Vector3(1, 0, 0)));
  W.slabMat = new T.MeshBasicMaterial({color:0x2f6bff, transparent:true, opacity:0, side:T.DoubleSide, depthWrite:false});
  W.slab = new T.Mesh(sg, W.slabMat); W.slab.scale.set(1.15, 1.15, 1); W.slab.renderOrder = 4; scene.add(W.slab);
  W.edgeMat = new T.LineBasicMaterial({color:SIG, transparent:true, opacity:0});
  W.edge = new T.LineSegments(new T.EdgesGeometry(sg), W.edgeMat); scene.add(W.edge);
  // two presentation panels that hang in front of the camera: k-space filling, image forming
  const panel = (label) => {
    const g = new T.Group(), n = 256;
    const cv = document.createElement('canvas'); cv.width = cv.height = n; const tex = new T.CanvasTexture(cv); tex.encoding = T.sRGBEncoding; tex.minFilter = T.LinearFilter;
    const face = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({map:tex, transparent:true, opacity:0, toneMapped:false, depthTest:false}));
    const frame = new T.LineSegments(new T.EdgesGeometry(new T.PlaneGeometry(1.03, 1.03)), new T.LineBasicMaterial({color:SIG, transparent:true, opacity:0, depthTest:false}));
    const lab = new T.Mesh(new T.PlaneGeometry(1, 0.09), new T.MeshBasicMaterial({transparent:true, opacity:0, depthTest:false, toneMapped:false, map:immCanvasTex(512, 46, (x, w, h)=>{ x.fillStyle = '#9db8ff'; x.font = '500 26px monospace'; x.fillText(label, 0, 32); })}));
    lab.position.y = 0.58; face.renderOrder = frame.renderOrder = lab.renderOrder = 10;
    g.add(face, frame, lab); scene.add(g);
    return {g, cv, ctx:cv.getContext('2d'), tex, mats:[face.material, frame.material, lab.material]};
  };
  W.kPanel = panel('ESPACIO K · DATOS CRUDOS'); W.iPanel = panel('IMAGEN · FFT 2D INVERSA');
  W.kspace = () => {
    if (W.K) return W.K; if (typeof grayOf !== 'function') return null;
    const g = grayOf('t1', 'normal', 256); if (!g) return null;
    const n = 256, re = Float64Array.from(g), im = new Float64Array(n*n); fft2(re, im, n, false);
    const mag = new Float32Array(n*n); let mx = 0;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++){ const sy = (y + n/2) % n, sx = (x + n/2) % n, v = Math.log(1 + Math.hypot(re[y*n + x], im[y*n + x])); mag[sy*n + sx] = v; if (v > mx) mx = v; }
    const kc = document.createElement('canvas'); kc.width = kc.height = n; const kx = kc.getContext('2d'), kd = kx.createImageData(n, n);
    for (let i = 0; i < n*n; i++){ const v = Math.pow(mag[i]/mx, 1.6); kd.data[i*4] = 40 + 200*v; kd.data[i*4 + 1] = 70 + 185*v; kd.data[i*4 + 2] = 120 + 135*v; kd.data[i*4 + 3] = 255; }
    kx.putImageData(kd, 0, 0);
    W.K = {re, im, n, kc, cache:new Map(), m:-1}; return W.K;
  };
  W.recon = m => {   // image from the central 2m+1 lines of k-space
    const K = W.K; if (K.cache.has(m)) return K.cache.get(m);
    const n = K.n, re = new Float64Array(n*n), im = new Float64Array(n*n);
    for (let y = 0; y < n; y++){ const ky = y < n/2 ? y : y - n; if (Math.abs(ky) > m) continue; for (let x = 0; x < n; x++){ re[y*n + x] = K.re[y*n + x]; im[y*n + x] = K.im[y*n + x]; } }
    fft2(re, im, n, true);
    const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'), d = x.createImageData(n, n); let mx = 1e-9;
    const mg = new Float32Array(n*n); for (let i = 0; i < n*n; i++){ mg[i] = Math.hypot(re[i], im[i]); if (mg[i] > mx) mx = mg[i]; }
    for (let i = 0; i < n*n; i++){ const v = Math.min(1, mg[i]/mx*1.05)*255; d.data[i*4] = d.data[i*4 + 1] = d.data[i*4 + 2] = v; d.data[i*4 + 3] = 255; }
    x.putImageData(d, 0, 0); K.cache.set(m, c); return c;
  };

  /* ---------- camera path ---------- */
  const K = [
    [0.00, [-520, 120, 640], [0, -14, 60]],
    [0.09, [-430, 70, 520], [0, -14, 50]],
    [0.20, [-330, 30, 330], [0, -20, 90]],
    [0.28, [-250, 200, 400], [0, 0, 10]],
    [0.36, [-290, 250, 250], [0, 0, 0]],
    [0.47, [-260, 420, 520], [0, 0, 0]],
    [0.545, [0, 32, 330], [0, 4, 0]],
    [0.60, [0, 24, 140], [0, 6, 0]],
    [0.65, [0, 21, 42], [0, 0, 0]],
    [0.70, [0, 19, 12], [0, -3, 0]],
    [0.78, [3, 10, 6], [0, -3, 0]],
    [0.845, [12, 15, 12], [0, -3, 0]],
    [0.885, [29, 8, 10], [0, -3, 0]],
    [0.93, [34, 4, 6], [0, -3, 0]],
    [1.00, [36, 2, 2], [0, -3, 0]],
  ];
  const posCurve = new T.CatmullRomCurve3(K.map(k=>new T.Vector3(...k[1])), false, 'centripetal');
  const keyT = K.map((k, i)=>i/(K.length - 1));
  const pathU = p => { let i = 0; while (i < K.length - 2 && p > K[i + 1][0]) i++; const f = Math.min(1, Math.max(0, (p - K[i][0])/(K[i + 1][0] - K[i][0]))); const e = f*f*(3 - 2*f); return [keyT[i] + (keyT[i + 1] - keyT[i])*e, i, e]; };
  W.tmpQ = new T.Quaternion(); W.Y = new T.Vector3(0, 1, 0); W.d = new T.Vector3(); W.m4 = new T.Matrix4(); W.sc = new T.Vector3(1, 1, 1);
  const camPos = new T.Vector3(), camTgt = new T.Vector3(), headC = new T.Vector3(0, -3, 0);
  const fwd = new T.Vector3(), right = new T.Vector3(), up = new T.Vector3();

  W.update = (p, t, dt) => {
    W.tryBrain();
    const cam = R.camera;
    const [u, i, e] = pathU(p);
    posCurve.getPoint(u, camPos); camTgt.set(...imix(K[i][2], K[i + 1][2], e));
    const drift = p < 0.1 ? Math.sin(t*0.22)*14 : 0;
    cam.position.set(camPos.x + drift, camPos.y, camPos.z); cam.lookAt(camTgt);
    const portrait = cam.aspect < 0.95 ? Math.min(1.75, 1.05/Math.max(0.45, cam.aspect)) : 1;
    const fov = Math.min(88, ilerp(34, 50, ismooth(0.58, 0.68, p))*portrait); if (Math.abs(cam.fov - fov) > 0.01){ cam.fov = fov; cam.updateProjectionMatrix(); }
    const near = p < 0.6 ? 6 : 0.3; if (cam.near !== near){ cam.near = near; cam.updateProjectionMatrix(); }
    R.saoOn = p < 0.235;   // SAO's depth pass ignores clipping, so it is off once the cutaway starts
    // table
    W.table.position.set(0, -22, ilerp(205, -16, ismooth(0.10, 0.22, p)));
    // quarter-section cutaway: a wedge opens over the upper-left quadrant facing the camera, then closes
    const cut = ismooth(0.245, 0.31, p)*(1 - ismooth(0.50, 0.545, p));
    const a0 = Math.PI*0.5, a1 = a0 + Math.PI*0.5*cut;
    setWedge(a0, a1);
    W.capA.rotation.z = a0; W.capB.rotation.z = a1; W.caps.visible = cut > 0.004;
    W.inner.visible = cut > 0.004;
    const energise = ismooth(0.30, 0.37, p);
    M.copper.emissiveIntensity = 0.5*energise*(0.85 + 0.15*Math.sin(t*2));
    M.grad.emissiveIntensity = 0.7*ismooth(0.33, 0.36, p)*(0.5 + 0.5*Math.max(0, Math.sin(t*9)));
    M.rf.emissiveIntensity = 0.8*ismooth(0.355, 0.38, p)*(0.5 + 0.5*Math.sin(t*18));
    // field lines
    const fA = ismooth(0.39, 0.44, p)*(1 - ismooth(0.50, 0.535, p));
    W.fieldMat.opacity = 0.85*fA; W.field.visible = fA > 0.01; W.stripe.offset.x -= dt*0.6;
    // the ring breathes; brighter during the scan
    const scanning = ismooth(0.22, 0.25, p);
    W.ringMat.emissiveIntensity = 1.2 + 0.8*scanning + 0.3*Math.sin(t*2.2);
    const glowA = (1 - ismooth(0.53, 0.565, p))*(1 - Math.min(1, cut*8)); W.halo.material.opacity = (0.1 + 0.14*scanning)*glowA; W.halo.visible = glowA > 0.01;
    // inside: the patient turns translucent, brain appears, head coil fades
    const inside = ismooth(0.56, 0.64, p);
    const fading = inside > 0.01; if (W.patMat.transparent !== fading){ W.patMat.transparent = fading; W.patMat.needsUpdate = true; }
    W.patMat.opacity = 1 - 0.9*inside; W.patMat.depthWrite = !fading; W.patient.group.visible = inside < 0.99;
    const hcA = 1 - inside; W.hcMat.opacity = hcA; W.hcMat.depthWrite = hcA > 0.98; W.headCoil.visible = hcA > 0.02; W.mirror.material.opacity = hcA;
    const spinsA = ismooth(0.665, 0.70, p)*(1 - ismooth(0.845, 0.87, p));
    const brainA = inside*(1 - 0.82*spinsA)*(1 - 0.6*ismooth(0.9, 0.95, p));
    W.brainMat.opacity = brainA; const solid = brainA > 0.985;
    if (W.brainMat.transparent === solid){ W.brainMat.transparent = !solid; W.brainMat.depthWrite = solid; W.brainMat.needsUpdate = true; }
    if (W.brain) W.brain.visible = brainA > 0.01;
    W.brainGroup.position.copy(headC);
    // protons
    W.spinGroup.position.copy(headC); W.spinGroup.visible = spinsA > 0.01;
    W.spinMat.opacity = spinsA; W.nucMat.opacity = spinsA; W.voxMat.opacity = 0.6*spinsA;
    const align = ismooth(0.69, 0.735, p), tip = ismooth(0.75, 0.785, p), relax = ismooth(0.795, 0.84, p), coh = tip*(1 - relax);
    let mx = 0, my = 0, mz = 0;
    if (W.spinGroup.visible) W.spinData.forEach((s, k)=>{
      const theta = ilerp(s.tilt, Math.PI/2*0.98, tip)*(1 - relax) + s.tilt*relax, ph = s.ph*(1 - coh) + t*3.2*s.w*(0.25 + 0.75*align);
      let dx = Math.sin(theta)*Math.cos(ph), dy = Math.sin(theta)*Math.sin(ph), dz = -Math.cos(theta); if (s.anti && tip < 0.5) dz = -dz;
      W.d.set(ilerp(s.rand.x, dx, align), ilerp(s.rand.y, dy, align), ilerp(s.rand.z, dz, align)).normalize(); mx += W.d.x; my += W.d.y; mz += W.d.z;
      W.tmpQ.setFromUnitVectors(W.Y, W.d); W.m4.compose(s.p, W.tmpQ, W.sc); W.spins.setMatrixAt(k, W.m4);
      W.m4.compose(s.p, W.tmpQ.identity(), W.sc); W.nuclei.setMatrixAt(k, W.m4); });
    W.spins.instanceMatrix.needsUpdate = true; W.nuclei.instanceMatrix.needsUpdate = true;
    const ml = Math.hypot(mx, my, mz)/W.spinData.length; W.d.set(mx, my, mz).normalize(); W.tmpQ.setFromUnitVectors(W.Y, W.d);
    W.mVec.quaternion.copy(W.tmpQ); W.mVec.scale.setScalar(0.4 + 1.3*ml); W.mMat.opacity = spinsA*align*Math.min(1, ml*3);
    const rf = ismooth(0.75, 0.758, p)*(1 - ismooth(0.782, 0.79, p)); M.liner.emissiveIntensity = 0.55*rf*(0.6 + 0.4*Math.sin(t*30));
    W.waves.forEach((m, k)=>{ const ph = ((t*0.6 + k/4) % 1); m.scale.setScalar(3 + ph*14); m.material.opacity = spinsA*(coh > 0.05 ? coh : 0)*(1 - ph)*0.9; m.lookAt(cam.position); m.position.set(0, 0, 0); });
    // gradients pick a slice
    const slabA = ismooth(0.845, 0.86, p)*(1 - ismooth(0.90, 0.93, p)), sx = ilerp(-6.5, 0.7, ismooth(0.85, 0.89, p));
    const cen = new T.Vector3(0, 0.2, 0).add(headC);
    W.slab.position.set(cen.x + sx, cen.y, cen.z); W.slabMat.opacity = 0.22*slabA;
    W.edge.position.copy(W.slab.position); W.edgeMat.opacity = slabA*0.9;
    // k-space fills line by line from the centre out; the image sharpens beside it; then the image takes the screen
    const kA = ismooth(0.895, 0.915, p), fill = ismooth(0.905, 0.965, p), hand = ismooth(0.965, 0.995, p);
    const show = kA > 0.001 && W.kspace();
    W.kPanel.g.visible = W.iPanel.g.visible = !!show;
    if (show){
      const Kd = W.K, n = Kd.n, m = Math.round(fill*n/2);
      if (Kd.m !== m){ Kd.m = m;
        const kx = W.kPanel.ctx; kx.fillStyle = '#0a1016'; kx.fillRect(0, 0, n, n);
        const y0 = n/2 - m, h = Math.min(n, 2*m + 1); if (h > 0) kx.drawImage(Kd.kc, 0, y0, n, h, 0, y0, n, h);
        if (m < n/2){ kx.fillStyle = 'rgba(95,141,255,.95)'; kx.fillRect(0, Math.max(0, y0 - 2), n, 2); kx.fillRect(0, Math.min(n - 2, y0 + h), n, 2); }
        W.kPanel.tex.needsUpdate = true;
        const ic = W.iPanel.ctx; ic.fillStyle = '#000'; ic.fillRect(0, 0, n, n); if (m > 0) ic.drawImage(W.recon(m), 0, 0); W.iPanel.tex.needsUpdate = true; }
      cam.getWorldDirection(fwd); right.crossVectors(fwd, cam.up).normalize(); up.crossVectors(right, fwd).normalize();
      const dist = 20, hgt = 2*dist*Math.tan(cam.fov*Math.PI/360), size = hgt*ilerp(0.42, 0.86, hand), gap = size*0.58*(1 - hand);
      const place = (P, side, extra) => { P.g.position.copy(cam.position).addScaledVector(fwd, dist).addScaledVector(right, side*gap + extra).addScaledVector(up, -hgt*0.02*(1 - hand)); P.g.quaternion.copy(cam.quaternion); P.g.scale.setScalar(size); };
      place(W.kPanel, -1, -size*0.3*hand); place(W.iPanel, 1, -gap*hand);
      const ka = kA*(1 - hand), ia = kA;
      const lab = Math.pow(1 - hand, 3);
      W.kPanel.mats.forEach((mm, j)=>mm.opacity = ka*(j === 1 ? 0.9 : j === 2 ? lab : 1)); W.iPanel.mats.forEach((mm, j)=>mm.opacity = ia*(j === 1 ? 0.9 : j === 2 ? lab : 1));
    }
  };
  W.labels = p => {
    const a = ismooth(0.29, 0.31, p)*(1 - ismooth(0.385, 0.40, p));
    const b = ismooth(0.11, 0.14, p)*(1 - ismooth(0.21, 0.235, p));
    const c = ismooth(0.62, 0.645, p)*(1 - ismooth(0.665, 0.68, p));
    const at = (r, ang, z) => new T.Vector3(r*Math.cos(ang), r*Math.sin(ang), z);
    return [
      {pos:at(68, Math.PI*0.62, 30), text:'Bobinas superconductoras · NbTi a 4 K', a},
      {pos:at(80, Math.PI*0.86, -20), text:'Helio líquido', a, left:true},
      {pos:at(100, Math.PI*0.7, -60), text:'Vaso de vacío', a},
      {pos:at(46, Math.PI*0.95, 50), text:'Bobinas de gradiente (x, y, z)', a, left:true},
      {pos:at(40, Math.PI*0.75, 20), text:'Bobina corporal de RF (jaula de pájaros)', a},
      {pos:new T.Vector3(0, 0, 85), text:'Isocentro', a:b},
      {pos:new T.Vector3(0, 6, 14), text:'Bobina de cabeza', a:b, left:true},
      {pos:new T.Vector3(0, 2, 0), text:'Encéfalo Colin 27', a:c},
    ];
  };
  immLinearize(scene);
  return W;
}


/* =====================================================================
   Walkthroughs for the other eight methods. Same contract as buildMRI:
   build(scene, renderer, R) → {update(p, t, dt), labels(p)}.
   Units are centimetres; the isocentre of each machine is the origin.
   Anatomy (brain, scalp, vessels, electrodes) lives in an "MNI frame":
   a group whose children are in MNI millimetres, mapped into the scene
   for a supine (head-first) or an upright patient.
   ===================================================================== */
const iclamp = x => Math.min(1, Math.max(0, x));
const iwin = (p, a, b, c, d) => ismooth(a, b, p)*(1 - ismooth(c, d, p));
const iwrap = a => { a = (a + Math.PI) % (2*Math.PI); if (a < 0) a += 2*Math.PI; return a - Math.PI; };

/* ---------- studio: backdrop, lights, floor (shared look with the MRI film) ---------- */
function immStudio(scene, renderer, o = {}){
  const T = THREE, S = {FLOOR:o.floor ?? -124};
  const bg = immCanvasTex(512, 512, (x, w, h)=>{ const g = x.createRadialGradient(w*0.5, h*0.42, 0, w*0.5, h*0.5, w*0.75); g.addColorStop(0, '#26323b'); g.addColorStop(0.55, '#172128'); g.addColorStop(1, '#0a1014'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  bg.encoding = T.sRGBEncoding; scene.background = bg;
  scene.fog = new T.Fog(0x10181d, o.fogNear || 1200, o.fogFar || 3400);
  scene.environment = immStudioEnv(renderer, {top:0.55, floor:0.22, horizon:0.6, panel:2.6});
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  scene.add(new T.HemisphereLight(0xffffff, 0xb9c3c9, 0.2));
  const key = new T.DirectionalLight(0xfff8f0, 1.6); key.position.set(-380, 520, 460); key.castShadow = true;
  const sr = o.shadow || 330;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, {left:-sr, right:sr, top:sr, bottom:-sr, near:100, far:1600});
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.6; scene.add(key); S.key = key;
  if (o.target){ key.target.position.set(...o.target); scene.add(key.target); key.position.add(new T.Vector3(...o.target)); }
  const rim = new T.DirectionalLight(0xdfe9ff, 0.6); rim.position.set(420, 260, -360); scene.add(rim);
  const fill = new T.DirectionalLight(0xe8f0ff, 0.25); fill.position.set(500, 120, 300); scene.add(fill);
  const fade = immCanvasTex(512, 512, (x, w)=>{ const g = x.createRadialGradient(w/2, w/2, 0, w/2, w/2, w/2); g.addColorStop(0, '#fff'); g.addColorStop(0.55, '#fff'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
  const floor = new T.Mesh(new T.CircleGeometry(1500, 96), new T.MeshPhysicalMaterial({color:new T.Color(0x1c252c), roughness:0.75, clearcoat:0.08, envMapIntensity:0.35, clearcoatRoughness:0.35, alphaMap:fade, transparent:true, depthWrite:false}));
  floor.rotation.x = -Math.PI/2; floor.position.y = S.FLOOR; floor.receiveShadow = true; scene.add(floor);
  const aoTex = immCanvasTex(256, 256, (x, w)=>{ const g = x.createRadialGradient(w/2, w/2, 0, w/2, w/2, w/2); g.addColorStop(0, 'rgba(20,30,36,.55)'); g.addColorStop(0.45, 'rgba(20,30,36,.22)'); g.addColorStop(1, 'rgba(20,30,36,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
  S.blob = (x, z, sx, sz) => { const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({map:aoTex, transparent:true, depthWrite:false})); m.rotation.x = -Math.PI/2; m.position.set(x, S.FLOOR + 0.4, z); m.scale.set(sx, sz, 1); scene.add(m); return m; };
  S.glow = immGlowTex();
  return S;
}
const ishadow = m => { m.castShadow = true; m.receiveShadow = true; return m; };
const iring = (w, h, r, hole) => { const s = immRoundRect(w, h, r); const p = new THREE.Path(); p.absarc(0, 0, hole, 0, Math.PI*2, true); s.holes.push(p); return s; };
// a lathe that flares from the bore out to the face of a cover, along z
function iflare(r0, r1, depth, seg = 128){ const pts = []; for (let i = 0; i <= 20; i++){ const u = i/20; pts.push(new THREE.Vector2(r0 + (r1 - r0)*Math.pow(u, 2.2), -depth + depth*Math.pow(u, 0.8))); } const g = new THREE.LatheGeometry(pts, seg); g.rotateX(Math.PI/2); return g; }
// a small glass touch screen with text, like the ones on the MRI covers
function iscreen(lines, w = 26, h = 16.25, prog = 0.6){
  const T = THREE, tex = immCanvasTex(512, 320, (x, W, H)=>{ x.fillStyle = '#0d1418'; x.fillRect(0, 0, W, H); x.fillStyle = '#5f8dff'; x.font = '500 30px monospace'; x.fillText(lines[0], 30, 62);
    x.fillStyle = '#c8d4da'; x.font = '400 24px monospace'; lines.slice(1).forEach((l, i)=>x.fillText(l, 30, 120 + i*42));
    x.strokeStyle = '#2a63ff'; x.lineWidth = 4; x.beginPath(); x.moveTo(30, 250); x.lineTo(W - 30, 250); x.stroke(); x.strokeStyle = '#5f8dff'; x.beginPath(); x.moveTo(30, 250); x.lineTo(30 + (W - 60)*prog, 250); x.stroke(); });
  const g = new T.Group();
  g.add(new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({map:tex, toneMapped:false})));
  const bez = new T.Mesh(new T.BoxGeometry(w + 2, h + 2, 1.2), new T.MeshPhysicalMaterial({color:0x0d1418, roughness:0.12, metalness:0.1, clearcoat:1})); bez.position.z = -0.8; g.add(bez);
  return g;
}
function iplate(text, w = 56, h = 9){ return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({transparent:true, map:immCanvasTex(512, 82, (x, W, H)=>{ x.fillStyle = '#7d8b92'; x.font = '500 34px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, W/2, H/2 + 2); })})); }
// fade a material between solid and see-through without sorting artefacts
function ifade(m, a, floor = 0){ const op = floor + (1 - floor)*a, tr = op < 0.995; if (m.transparent !== tr){ m.transparent = tr; m.needsUpdate = true; } m.opacity = op; m.depthWrite = !tr; return op; }

/* ---------- camera: a keyframed path, exactly like the MRI film ---------- */
function immCamPath(R, K, o = {}){
  const T = THREE, n = K.length - 1, curve = new T.CatmullRomCurve3(K.map(k=>new T.Vector3(...k[1])), false, 'centripetal');
  const pos = new T.Vector3(), tgt = new T.Vector3();
  return (p, t, fovBase = 38, near = 6) => {
    let i = 0; while (i < n - 1 && p > K[i + 1][0]) i++;
    const f = iclamp((p - K[i][0])/(K[i + 1][0] - K[i][0])), e = f*f*(3 - 2*f);
    curve.getPoint((i + e)/n, pos); tgt.set(...imix(K[i][2], K[i + 1][2], e));
    const cam = R.camera, d = o.drift ? Math.sin(t*0.22)*14*(1 - ismooth(0, o.drift, p)) : 0;
    cam.position.set(pos.x + d, pos.y, pos.z); cam.lookAt(tgt);
    const portrait = cam.aspect < 0.95 ? Math.min(1.75, 1.05/Math.max(0.45, cam.aspect)) : 1;
    const fov = Math.min(88, fovBase*portrait);
    if (Math.abs(cam.fov - fov) > 0.01 || cam.near !== near){ cam.fov = fov; cam.near = near; cam.updateProjectionMatrix(); }
    return {pos, tgt};
  };
}

/* ---------- presentation panels that hang in front of the camera ---------- */
function immPanels(scene){
  const T = THREE, fwd = new T.Vector3(), right = new T.Vector3(), up = new T.Vector3();
  const make = (label, w = 256, h = 256) => {
    const g = new T.Group(), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const tex = new T.CanvasTexture(cv); tex.encoding = T.sRGBEncoding; tex.minFilter = T.LinearFilter;
    const asp = h/w;
    const face = new T.Mesh(new T.PlaneGeometry(1, asp), new T.MeshBasicMaterial({map:tex, transparent:true, opacity:0, toneMapped:false, depthTest:false}));
    const frame = new T.LineSegments(new T.EdgesGeometry(new T.PlaneGeometry(1.03, asp + 0.03)), new T.LineBasicMaterial({color:0x0050ff, transparent:true, opacity:0, depthTest:false}));
    const lab = new T.Mesh(new T.PlaneGeometry(1, 0.09), new T.MeshBasicMaterial({transparent:true, opacity:0, depthTest:false, toneMapped:false, map:immCanvasTex(512, 46, (x)=>{ x.fillStyle = '#9db8ff'; x.font = '500 26px monospace'; x.fillText(label, 0, 32); })}));
    lab.position.y = asp/2 + 0.075; face.renderOrder = frame.renderOrder = lab.renderOrder = 10;
    face.material.userData.linear = frame.material.userData.linear = lab.material.userData.linear = true;
    g.add(face, frame, lab); g.visible = false; scene.add(g);
    return {g, cv, ctx:cv.getContext('2d'), tex, asp, lab,
      show(a, la = a){ g.visible = a > 0.002; face.material.opacity = a; frame.material.opacity = 0.9*a; lab.material.opacity = la; },
      dirty(){ tex.needsUpdate = true; }};
  };
  // x, y: offsets of the panel centre from the view centre, in view heights; size: panel width in view heights
  const place = (P, cam, x, y, size, dist = 20) => {
    size = Math.min(size, cam.aspect*0.92);   // never wider than the screen
    cam.getWorldDirection(fwd); right.crossVectors(fwd, cam.up).normalize(); up.crossVectors(right, fwd).normalize();
    const H = 2*dist*Math.tan(cam.fov*Math.PI/360);
    P.g.position.copy(cam.position).addScaledVector(fwd, dist).addScaledVector(right, x*H).addScaledVector(up, y*H);
    P.g.quaternion.copy(cam.quaternion); P.g.scale.setScalar(size*H);
  };
  // two panels side by side that merge into one large one as `hand` goes 0 → 1 (portrait: stacked)
  const pair = (A, B, cam, hand, aA = 1, aB = 1) => {
    const asp = cam.aspect, land = asp >= 1.05;
    if (land){ const s = ilerp(0.42, 0.84, hand), w = Math.min(s, asp*0.5), gap = w*0.56*(1 - hand), dx = ilerp(0.06, 0, hand)*Math.min(1, asp - 1);
      place(A, cam, dx - gap - w*0.3*hand, 0.04*(1 - hand), w); place(B, cam, dx + gap, 0.04*(1 - hand), w); }
    else { const w = ilerp(0.36, 0.62, hand)*Math.min(1, asp*1.5), gap = w*0.56*(1 - hand);
      place(A, cam, 0, 0.14 + gap*0.95, w); place(B, cam, 0, 0.14 - gap*0.95 + 0.06*hand, w); }
    const lab = Math.pow(1 - hand, 3);
    A.show(aA*(1 - hand), aA*lab*(1 - hand)); B.show(aB, aB*(B.keepLab ? 1 : lab));
  };
  return {make, place, pair};
}

/* ---------- MNI frame: children in MNI mm, mapped into the scene ---------- */
// supine head-first: right → −x, anterior → +y, superior → −z.  upright, facing +z: right → −x, superior → +y, anterior → +z
function immMNIFrame(kind, centre = [0, -18, 12], at = [0, 0, 0]){
  const T = THREE, g = new T.Group(), B = new T.Matrix4();
  if (kind === 'upright') B.makeBasis(new T.Vector3(-1, 0, 0), new T.Vector3(0, 0, 1), new T.Vector3(0, 1, 0));
  else B.makeBasis(new T.Vector3(-1, 0, 0), new T.Vector3(0, 1, 0), new T.Vector3(0, 0, -1));
  const c = new T.Vector3(...centre).applyMatrix4(B).multiplyScalar(0.1);
  g.matrix.copy(B).scale(new T.Vector3(0.1, 0.1, 0.1)).setPosition(at[0] - c.x, at[1] - c.y, at[2] - c.z);
  g.matrixAutoUpdate = false; g.matrixWorldNeedsUpdate = true;
  return g;
}
const mniV = p => new THREE.Vector3(p[0], p[1], p[2]);

/* ---------- shader overlays on the brain / scalp (positions are MNI mm × 64 in the raw mesh) ---------- */
function immOverlay(mat, o){
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, o.uniforms);
    sh.vertexShader = 'varying vec3 vMni;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vMni = position*' + (o.scale || '1.0/64.0') + ';');
    sh.fragmentShader = 'varying vec3 vMni;\n' + (o.decl || '') + '\n' + sh.fragmentShader
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + (o.code || ''))
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + (o.emit || ''));
  };
  mat.customProgramCacheKey = () => 'imm-' + o.key;
}
const GLSL_RAMPS = `
vec3 iHot(float x){ x = clamp(x, 0.0, 1.0); return vec3(clamp(x*2.6, 0.0, 1.0), clamp(x*2.6 - 0.9, 0.0, 1.0), clamp(x*3.0 - 2.0, 0.0, 1.0)); }
vec3 iRdBu(float x){ x = clamp(x, -1.0, 1.0); vec3 n = mix(vec3(0.96,0.96,0.97), vec3(0.13,0.33,0.75), smoothstep(0.0, 1.0, -x)); vec3 p = mix(vec3(0.96,0.96,0.97), vec3(0.78,0.15,0.16), smoothstep(0.0, 1.0, x)); return x < 0.0 ? n : p; }
vec3 iAct(float z){ return mix(vec3(0.86,0.1,0.04), vec3(1.0,0.95,0.38), smoothstep(0.32, 0.9, z)); }
vec3 iSpect(float v){ v = clamp(v, 0.0, 1.0); vec3 c0 = vec3(0.0), c1 = vec3(0.1,0.17,1.0), c2 = vec3(0.0,0.78,1.0), c3 = vec3(0.24,1.0,0.42), c4 = vec3(1.0,0.9,0.0), c5 = vec3(1.0,0.23,0.0);
  return v < 0.2 ? mix(c0, c1, v/0.2) : v < 0.4 ? mix(c1, c2, (v - 0.2)/0.2) : v < 0.6 ? mix(c2, c3, (v - 0.4)/0.2) : v < 0.8 ? mix(c3, c4, (v - 0.6)/0.2) : mix(c4, c5, (v - 0.8)/0.2); }
`;

/* ---------- the real brain surface (Colin 27), built once the mesh data has loaded ---------- */
function immBrain(frame, o = {}){
  const T = THREE, B = {mesh:null};
  B.mat = new T.MeshStandardMaterial({vertexColors:true, roughness:0.5, metalness:0, transparent:true, opacity:0, depthWrite:false, emissive:new T.Color(0x000000)});
  B.mat.userData.linear = true;
  if (o.overlay) immOverlay(B.mat, o.overlay);
  B.build = () => {
    if (B.mesh) return true; if (typeof MESHRAW === 'undefined' || !MESHRAW) return false;
    const Mr = MESHRAW, n = Mr.nv, g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(Mr.pos.subarray(0, n*3), 3));
    const nr = new Int8Array(n*3), col = new Uint8Array(n*3), lin = v => 255*Math.pow(v/255, 2.2);
    for (let i = 0; i < n; i++){ nr[i*3] = Mr.nrm[i*4]; nr[i*3 + 1] = Mr.nrm[i*4 + 1]; nr[i*3 + 2] = Mr.nrm[i*4 + 2];
      const c = Math.max(0, Math.min(1, (Mr.nrm[i*4 + 3]/127 + 0.1)/0.95)), r = Mr.reg[i], vent = (r >= 97 && r <= 98) || r >= 117;
      if (vent){ col[i*3] = lin(70); col[i*3 + 1] = lin(120); col[i*3 + 2] = 255; } else { const k = 0.42 + 0.58*c; col[i*3] = lin(232*k); col[i*3 + 1] = lin(206*k); col[i*3 + 2] = lin(198*k + 14*(1 - c)); } }
    g.setAttribute('normal', new T.BufferAttribute(nr, 3, true)); g.setAttribute('color', new T.BufferAttribute(col, 3, true));
    g.setIndex(new T.BufferAttribute(Mr.idx.subarray(0, Mr.brainCount), 1));
    g.boundingSphere = new T.Sphere(new T.Vector3(0, -18*64, 12*64), 120*64);
    B.mesh = new T.Mesh(g, B.mat); B.mesh.scale.setScalar(1/64); B.mesh.renderOrder = o.order || 0; frame.add(B.mesh);
    return true;
  };
  B.set = a => { const solid = a > 0.985; if (B.mat.transparent === solid){ B.mat.transparent = !solid; B.mat.depthWrite = solid; B.mat.needsUpdate = true; } B.mat.opacity = a; if (B.mesh) B.mesh.visible = a > 0.01; };
  return B;
}
/* the scalp surface from the same MRI (the last mesh piece); optional cut keeps only the triangles above a line */
function immScalp(frame, mat, o = {}){
  const T = THREE, S = {mesh:null, mat};
  S.build = () => {
    if (S.mesh) return true; if (typeof MESHRAW === 'undefined' || !MESHRAW) return false;
    const Mr = MESHRAW, v0 = Mr.nv, nv = Mr.pos.length/3 - v0, all = Mr.idx.subarray(Mr.brainCount);
    const pos = new Float32Array(nv*3), nrm = new Float32Array(nv*3), c = o.centre || [0, -18, 5];
    for (let i = 0; i < nv; i++){
      let x = Mr.pos[(v0 + i)*3]/64, y = Mr.pos[(v0 + i)*3 + 1]/64, z = Mr.pos[(v0 + i)*3 + 2]/64;
      const nx = Mr.nrm[(v0 + i)*4]/127, ny = Mr.nrm[(v0 + i)*4 + 1]/127, nz = Mr.nrm[(v0 + i)*4 + 2]/127;
      if (o.offset){ x += nx*o.offset; y += ny*o.offset; z += nz*o.offset; }
      if (o.shrink){ x = c[0] + (x - c[0])*o.shrink; y = c[1] + (y - c[1])*o.shrink; z = c[2] + (z - c[2])*o.shrink; }
      pos.set([x, y, z], i*3); nrm.set([nx, ny, nz], i*3);
    }
    const keep = o.keep || null, idx = [];
    for (let k = 0; k < all.length; k += 3){ const a = all[k] - v0, b = all[k + 1] - v0, d = all[k + 2] - v0;
      if (keep && !(keep(pos, a) && keep(pos, b) && keep(pos, d))) continue; idx.push(a, b, d); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nrm, 3)); g.setIndex(idx);
    if (o.flip){ const ia = g.index.array; for (let k = 0; k < ia.length; k += 3){ const t = ia[k + 1]; ia[k + 1] = ia[k + 2]; ia[k + 2] = t; } }
    g.computeBoundingSphere();
    S.mesh = new T.Mesh(g, mat); S.mesh.renderOrder = o.order || 0; S.mesh.castShadow = !!o.shadow; frame.add(S.mesh);
    return true;
  };
  return S;
}
// the cap / helmet region of the head: above a line from the brow over the ears to the inion
const icapKeep = (zc = -6, slope = 0.12) => (P, i) => P[i*3 + 2] > zc - slope*Math.max(0, -P[i*3 + 1]);

/* ---------- a supine patient on a sliding table (same build as the MRI film) ---------- */
function immTable(scene, o = {}){
  const T = THREE, P = {}, FLOOR = o.floor ?? -124;
  const tblMat = new T.MeshPhysicalMaterial({color:new T.Color(0xf6f8f9), roughness:0.26, clearcoat:0.7, clearcoatRoughness:0.12});
  const plinth = new T.MeshStandardMaterial({color:new T.Color(0x56636a), roughness:0.45, metalness:0.2});
  const steel = new T.MeshStandardMaterial({color:new T.Color(0xaeb8be), roughness:0.26, metalness:0.92});
  const z0 = o.pedZ ?? 140;
  const ped = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(58, 96, 12), {depth:170, bevelEnabled:true, bevelThickness:4, bevelSize:4, bevelSegments:6}), tblMat)); ped.position.set(0, -76, z0); scene.add(ped);
  const base = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(66, 176, 10), {depth:6, bevelEnabled:true, bevelThickness:2, bevelSize:2, bevelSegments:3}), plinth)); base.rotation.x = -Math.PI/2; base.position.set(0, FLOOR, z0 + 86); scene.add(base);
  P.table = new T.Group(); scene.add(P.table);
  const top = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(54, 6, 3), {depth:240, bevelEnabled:true, bevelThickness:2, bevelSize:1.2, bevelSegments:4, curveSegments:12}), tblMat)); top.geometry.translate(0, -4, -12); P.table.add(top);
  for (const sx of [-1, 1]){ const rail = ishadow(new T.Mesh(new T.BoxGeometry(1.6, 2.4, 232), steel)); rail.position.set(sx*28.4, -3, 108); P.table.add(rail); }
  const pad = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(48, 5, 2.4), {depth:226, bevelEnabled:true, bevelThickness:1.6, bevelSize:1.2, bevelSegments:4}), new T.MeshStandardMaterial({color:new T.Color(0x9fb1bc), roughness:0.85}))); pad.position.set(0, 1.6, -4); P.table.add(pad);
  P.man = buildMannequin(T, {shadows:true}); poseSupine(P.man); P.man.group.position.set(0, 18.6, 181); P.table.add(P.man.group);
  P.mat = P.man.mat;
  if (o.blanket !== false){ P.blanket = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(42, 12, 6), {depth:90, bevelEnabled:true, bevelThickness:4, bevelSize:2, bevelSegments:8, curveSegments:16}), new T.MeshStandardMaterial({color:new T.Color(0xbfcdd6), roughness:0.95, transparent:true}))); P.blanket.position.set(0, 20.5, 92); P.table.add(P.blanket); }
  // anatomy anchor: the brain centre (MNI 0, −18, 12) inside the mannequin's head
  P.mni = immMNIFrame('supine', [0, -18, 12], [0, 20, 15.5]); P.table.add(P.mni);
  const tblParts = [tblMat, pad.material];
  P.fadeTable = a => { for (const m of tblParts) ifade(m, 1 - a); };
  P.fadeBody = a => { const f = a > 0.01; if (P.mat.transparent !== f){ P.mat.transparent = f; P.mat.needsUpdate = true; } P.mat.opacity = 1 - a; P.mat.depthWrite = !f; P.man.group.visible = a < 0.995;
    if (P.blanket){ P.blanket.material.opacity = 1 - a; P.blanket.material.depthWrite = !f; P.blanket.visible = a < 0.995; } };
  return P;
}
// the mannequin sitting upright on a chair (EEG, MEG); the pelvis sits at y = seat + 8
function poseSeated(M, seat = 46){
  M.j.root.position.y = seat + 8 - 96;
  for (const s of ['L', 'R']){ const k = s === 'L' ? 1 : -1;
    M.j['hip' + s].rotation.x = -Math.PI/2; M.j['hip' + s].rotation.z = 0.06*k; M.j['knee' + s].rotation.x = Math.PI/2 - 0.08; M.j['ankle' + s].rotation.x = 0.08;
    M.j['shoulder' + s].rotation.x = -0.32; M.j['shoulder' + s].rotation.z = 0.1*k; M.j['elbow' + s].rotation.x = -1.05; M.j['wrist' + s].rotation.y = -0.4*k; }
  return M;
}
// upright MNI frame on the mannequin's head joint, with its egg head swapped for the real scalp
function immSeatedHead(M){
  const head = M.j.head; head.children.forEach(c=>{ if (c.isMesh) c.visible = false; });
  const F = immMNIFrame('upright', [0, -15, -5], [0, 10.5, 1.6]); head.add(F);
  return F;
}
function ichair(T, mat, seat = 46){
  const g = new T.Group(), dark = new T.MeshStandardMaterial({color:new T.Color(0x3a454b), roughness:0.55, metalness:0.3});
  const s = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(50, 46, 8), {depth:6, bevelEnabled:true, bevelThickness:2, bevelSize:2, bevelSegments:4}), mat)); s.rotation.x = -Math.PI/2; s.position.set(0, seat - 6, 23); g.add(s);
  const b = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(48, 52, 10), {depth:5, bevelEnabled:true, bevelThickness:2, bevelSize:2, bevelSegments:4}), mat)); b.rotation.x = 0.12; b.position.set(0, seat + 30, -26); g.add(b);
  const col = ishadow(new T.Mesh(new T.CylinderGeometry(2.4, 2.4, seat - 8, 20), dark)); col.position.set(0, (seat - 8)/2, 0); g.add(col);
  for (let i = 0; i < 5; i++){ const a = i/5*Math.PI*2, leg = ishadow(new T.Mesh(new T.BoxGeometry(3, 2.4, 30), dark)); leg.position.set(Math.sin(a)*14, 1.4, Math.cos(a)*14); leg.rotation.y = a; g.add(leg); }
  const post = ishadow(new T.Mesh(new T.BoxGeometry(4, 34, 3), dark)); post.position.set(0, seat + 6, -26); g.add(post);
  return g;
}
// a wavy photon / sound track along a straight line from a to b
function iwiggle(T, color, n = 80){
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(n*3), 3));
  const L = new T.Line(g, new T.LineBasicMaterial({color, transparent:true, opacity:0, depthWrite:false})); L.frustumCulled = false; L.renderOrder = 6;
  const a = new T.Vector3(), d = new T.Vector3(), nrm = new T.Vector3(), q = new T.Vector3();
  L.userData.set = (A, B, amp, waves, phase, s0 = 0, s1 = 1, up = new T.Vector3(0, 1, 0)) => {
    a.copy(A); d.copy(B).sub(A); nrm.crossVectors(d, up); if (nrm.lengthSq() < 1e-6) nrm.set(1, 0, 0); nrm.normalize();
    const arr = g.attributes.position.array;
    for (let i = 0; i < n; i++){ const s = s0 + (s1 - s0)*i/(n - 1); q.copy(a).addScaledVector(d, s).addScaledVector(nrm, amp*Math.sin(s*waves*Math.PI*2 - phase)); arr.set([q.x, q.y, q.z], i*3); }
    g.attributes.position.needsUpdate = true;
  };
  return L;
}

/* a scan image from the viewer's own renderer, for subs whose thumbnail is a chart (TCD has a spectrum thumbnail) */
const IMM_THUMBS = new Map();
function immScanImage(subId, state = 'normal'){
  const key = subId + '|' + state; if (IMM_THUMBS.has(key)) return IMM_THUMBS.get(key);
  if (!ready || !sliceAvailable || !gl) return null;
  const sub = subById(subId), st = STATES[state];
  buildVessels(sub, state);
  const plane = sub.plane, [r, u, f] = basisLook(PLANES[plane].f, PLANES[plane].up);
  gl.bindFramebuffer(gl.FRAMEBUFFER, thumbFbo); gl.viewport(0, 0, TH, TH); gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
  gl.useProgram(progSlice); gl.bindVertexArray(emptyVao);
  const p = progSlice; bindVolumes(p); setStateUniforms(p, sub, st, true);
  u2f(p, 'uRes', TH, TH); u1i(p, 'uMode', 1); u1f(p, 'uHalf', 108);
  u3(p, 'uTR', r); u3(p, 'uTU', u); u3(p, 'uTF', f); u1f(p, 'uSlice', worldToSlice(plane, sub.at)); u1f(p, 'uSplit', -1);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  const buf = new Uint8Array(TH*TH*4); gl.readPixels(0, 0, TH, TH, gl.RGBA, gl.UNSIGNED_BYTE, buf); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const c = document.createElement('canvas'); c.width = c.height = TH; const x = c.getContext('2d'), img = x.createImageData(TH, TH);
  for (let y = 0; y < TH; y++) img.data.set(buf.subarray((TH - 1 - y)*TH*4, (TH - y)*TH*4), y*TH*4);
  x.putImageData(img, 0, 0); vesKey = ''; dirty = true;
  IMM_THUMBS.set(key, c); return c;
}


/* =====================================================================
   CT walkthrough
     0.00 suite · 0.10 table in · 0.24 cover clears, the drum inside
     0.38 helical scan · 0.52 into the gantry, fan through the head
     0.63 detector profile · 0.73 sinogram · 0.84 back-projection · 0.94 the slice
   ===================================================================== */
function buildCT(scene, renderer, R){
  const T = THREE, W = {}, SIG = 0x0050ff;
  const S = immStudio(scene, renderer);
  const M = {
    shell: new T.MeshPhysicalMaterial({color:0xf3f5f6, roughness:0.24, clearcoat:0.85, clearcoatRoughness:0.1, side:T.DoubleSide}),
    trim: new T.MeshPhysicalMaterial({color:0xdde3e6, roughness:0.32, clearcoat:0.5}),
    dark: new T.MeshStandardMaterial({color:0x2c363c, roughness:0.45, metalness:0.35}),
    steel: new T.MeshStandardMaterial({color:0xaeb8be, roughness:0.28, metalness:0.9, side:T.DoubleSide}),
    plinth: new T.MeshStandardMaterial({color:0x56636a, roughness:0.45, metalness:0.2}),
    det: new T.MeshStandardMaterial({color:0xffffff, roughness:0.35, metalness:0.3}),
    liner: new T.MeshStandardMaterial({color:0xe4e9ec, roughness:0.55, side:T.DoubleSide}),
  };
  /* ---------- gantry: a short ring, 74 cm bore ---------- */
  const GW = 200, GH = 206, GD = 62, BORE = 37;
  const gan = new T.Group(); scene.add(gan); W.gan = gan;
  const body = ishadow(new T.Mesh(new T.ExtrudeGeometry(iring(GW, GH, 64, BORE + 6), {depth:GD, bevelEnabled:true, bevelThickness:6, bevelSize:6, bevelSegments:8, curveSegments:80}), M.shell));
  body.geometry.translate(0, 0, -GD/2); gan.add(body);
  const shellParts = [body];
  for (const s of [1, -1]){ const f = new T.Mesh(iflare(BORE, BORE + 9, 9), M.shell); f.scale.z = s; f.position.z = s*(GD/2 + 6); gan.add(f); shellParts.push(f); }
  const liner = new T.Mesh(new T.CylinderGeometry(BORE, BORE, GD + 14, 96, 1, true), M.liner); liner.rotation.x = Math.PI/2; gan.add(liner); shellParts.push(liner);
  W.ringMat = new T.MeshStandardMaterial({color:SIG, emissive:SIG, emissiveIntensity:1.4, roughness:0.4});
  const ring = new T.Mesh(new T.TorusGeometry(BORE + 10.5, 0.7, 12, 200), W.ringMat); ring.position.z = GD/2 + 6.3; gan.add(ring);
  W.halo = new T.Sprite(new T.SpriteMaterial({map:S.glow, color:0x4d86ff, transparent:true, opacity:0.16, depthWrite:false, blending:T.AdditiveBlending})); W.halo.scale.set(120, 120, 1); W.halo.position.z = GD/2 + 7; gan.add(W.halo);
  const scr = iscreen(['CABEZA · HELICOIDAL', 'Rutina cerebral', '120 kV  250 mAs'], 22, 13.75, 0.4); scr.position.set(-62, 44, GD/2 + 6.4); scr.rotation.y = 0.16; gan.add(scr); shellParts.push(...scr.children);
  const plate = iplate('N E U R O · C T', 50, 8); plate.position.set(0, 78, GD/2 + 6.4); gan.add(plate); shellParts.push(plate);
  const stand = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(150, 40, 10), {depth:24, bevelEnabled:true, bevelThickness:3, bevelSize:3, bevelSegments:4}), M.plinth));
  stand.rotation.x = -Math.PI/2; stand.position.set(0, S.FLOOR, 12); scene.add(stand);
  const foot = ishadow(new T.Mesh(new T.BoxGeometry(110, S.FLOOR*-1 - GH/2 - 2, 40), M.trim)); foot.position.set(0, (S.FLOOR + (-GH/2 - 4))/2 + 4, 0); scene.add(foot);
  S.blob(0, 10, 300, 200);

  /* ---------- the rotating drum (revealed when the cover clears) ---------- */
  const drum = new T.Group(); gan.add(drum); W.drum = drum;
  const slip = new T.Mesh(new T.CylinderGeometry(88, 88, 30, 128, 1, true), M.steel); slip.rotation.x = Math.PI/2; drum.add(slip);
  const disc = new T.Mesh(new T.RingGeometry(BORE + 4, 88, 128), new T.MeshStandardMaterial({color:0x8d999f, roughness:0.4, metalness:0.7, side:T.DoubleSide})); disc.position.z = -15; drum.add(disc);
  for (let i = 0; i < 6; i++){ const a = i/6*Math.PI*2 + 0.5, b = new T.Mesh(new T.BoxGeometry(22, 12, 18), i % 2 ? M.dark : M.plinth); b.position.set(74*Math.cos(a), 74*Math.sin(a), -4); b.rotation.z = a; if (Math.abs(Math.sin(a) - 1) > 0.3 && Math.abs(Math.sin(a) + 1) > 0.3) drum.add(b); }
  const tube = new T.Group(); tube.position.set(0, 64, 0); drum.add(tube); W.tube = tube;
  const tb = new T.Mesh(new T.CylinderGeometry(10, 10, 38, 40), M.dark); tb.rotation.z = Math.PI/2; tube.add(tb);
  for (const s of [-1, 1]){ const cap = new T.Mesh(new T.CylinderGeometry(10.6, 10.6, 3, 40), M.steel); cap.rotation.z = Math.PI/2; cap.position.x = s*19; tube.add(cap); }
  const coll = new T.Mesh(new T.BoxGeometry(14, 8, 14), M.steel); coll.position.y = -12; tube.add(coll);
  W.focal = new T.Sprite(new T.SpriteMaterial({map:S.glow, color:0xffb24a, transparent:true, opacity:0.95, depthWrite:false})); W.focal.scale.set(9, 9, 1); W.focal.position.y = -17; tube.add(W.focal);
  // detector arc: 72 modules on a 118 cm radius about the focal spot (focal at y = 47)
  const FY = 47, RF = 118, ND = 72, A0 = 0.43;
  W.det = new T.InstancedMesh(new T.BoxGeometry(3.4, 3.6, 5.2), M.det, ND); const m4 = new T.Matrix4(), q = new T.Quaternion(), col = new T.Color();
  for (let i = 0; i < ND; i++){ const a = -A0 + 2*A0*(i + 0.5)/ND; q.setFromAxisAngle(new T.Vector3(0, 0, 1), a); m4.compose(new T.Vector3(RF*Math.sin(a), FY - RF*Math.cos(a), 0), q, new T.Vector3(1, 1, 1)); W.det.setMatrixAt(i, m4); W.det.setColorAt(i, col.setRGB(0.05, 0.12, 0.35)); }
  drum.add(W.det);
  const das = new T.Mesh(new T.BoxGeometry(70, 8, 16), M.dark); das.position.set(0, FY - RF - 6, -2); drum.add(das);
  W.detC = new T.Object3D(); W.detC.position.set(0, FY - RF, 0); drum.add(W.detC);
  // the fan beam: a thin wedge, 4 cm thick (64 rows × 0.625 mm)
  const fan = new T.Shape(); fan.moveTo(0, FY); for (let i = 0; i <= 32; i++){ const a = -A0 + 2*A0*i/32; fan.lineTo((RF - 2)*Math.sin(a), FY - (RF - 2)*Math.cos(a)); } fan.lineTo(0, FY);
  W.fanMat = new T.MeshBasicMaterial({color:0x3d7bff, transparent:true, opacity:0, depthWrite:false, side:T.DoubleSide});
  W.fan = new T.Mesh(new T.ExtrudeGeometry(fan, {depth:4, bevelEnabled:false, curveSegments:4}), W.fanMat); W.fan.position.z = -2; W.fan.renderOrder = 5; drum.add(W.fan);
  W.rays = []; for (let i = 0; i < 9; i++){ const a = -A0*0.9 + 1.8*A0*i/8, g = new T.BufferGeometry().setFromPoints([new T.Vector3(0, FY, 0), new T.Vector3((RF - 3)*Math.sin(a), FY - (RF - 3)*Math.cos(a), 0)]);
    const l = new T.Line(g, new T.LineBasicMaterial({color:0x0050ff, transparent:true, opacity:0, depthWrite:false})); l.renderOrder = 6; drum.add(l); W.rays.push(l); }
  W.inner = [drum];
  drum.visible = false;

  /* ---------- patient, scalp, skull and brain ---------- */
  W.P = immTable(scene);
  const skin = new T.MeshPhysicalMaterial({color:0xc9d6de, roughness:0.35, clearcoat:0.4, transparent:true, opacity:0, depthWrite:false});
  W.scalp = immScalp(W.P.mni, skin, {order:4});
  W.boneMat = new T.MeshStandardMaterial({color:0xf2ead8, roughness:0.6, transparent:true, opacity:0, depthWrite:false, side:T.DoubleSide});
  W.skull = immScalp(W.P.mni, W.boneMat, {shrink:0.93, order:3});
  W.brain = immBrain(W.P.mni, {order:2});
  // helix: the path of the beam through the head during a helical scan (5 turns, 4 cm per turn)
  const hp = []; for (let i = 0; i <= 600; i++){ const u = i/600, a = u*5*Math.PI*2; hp.push(new T.Vector3(16*Math.sin(a), 20 + 16*Math.cos(a), 26 - u*20)); }
  W.helix = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(hp), 900, 0.32, 6), new T.MeshBasicMaterial({color:SIG, transparent:true, opacity:0.9})); W.helix.renderOrder = 6; W.P.table.add(W.helix); W.helix.visible = false;
  W.helixN = W.helix.geometry.index.count;

  /* ---------- panels: detector profile, sinogram, reconstruction ---------- */
  const PN = immPanels(scene);
  W.prof = PN.make('LECTURA DEL DETECTOR · UN ÁNGULO', 512, 256);
  W.sino = PN.make('SINOGRAMA · ÁNGULO ↓', 256, 256);
  W.recon = PN.make('RETROPROYECCIÓN FILTRADA', 256, 256);
  W.env = {};
  W.T = () => { if (W.TT) return W.TT; const o = G.env; G.env = W.env; try { W.TT = tomo('ctb', 'normal'); } finally { G.env = o; } return W.TT; };

  const cam = immCamPath(R, [
    [0.00, [-470, 120, 560], [0, -14, 40]],
    [0.09, [-400, 70, 470], [0, -14, 40]],
    [0.20, [-300, 30, 300], [0, -18, 60]],
    [0.29, [-250, 170, 330], [0, 0, 0]],
    [0.37, [-70, 40, 300], [0, 0, 0]],
    [0.47, [-200, 110, 230], [0, 0, 10]],
    [0.56, [-70, 46, 118], [0, -2, 0]],
    [0.63, [-46, 30, 62], [0, -2, 0]],
    [0.70, [-16, 24, 60], [0, -1, 0]],
    [0.76, [-10, 20, 58], [0, -1, 0]],
    [0.86, [-6, 14, 50], [0, -1, 0]],
    [1.00, [0, 10, 44], [0, -1, 0]],
  ], {drift:0.09});

  let phase = 0;
  W.update = (p, t, dt) => {
    const P = W.P;
    W.brain.build(); W.scalp.build(); W.skull.build();
    cam(p, t, ilerp(34, 46, ismooth(0.52, 0.64, p)), p < 0.55 ? 6 : 1);
    R.saoOn = false;
    // table: in, then a helical pass from skull base to vertex, then back to centre the slice on the brain
    const zIn = ilerp(205, -24.5, ismooth(0.10, 0.22, p)), zHel = ilerp(-24.5, -4.5, ismooth(0.40, 0.50, p)), zBack = ilerp(-4.5, -15.5, ismooth(0.52, 0.60, p));
    P.table.position.set(0, -22, p < 0.38 ? zIn : p < 0.51 ? zHel : zBack);
    // cover clears to show the drum; it stays faint while we are inside
    const clear = ismooth(0.25, 0.31, p);
    for (const m of [M.shell, M.liner]) ifade(m, 1 - clear, 0.06);
    scr.visible = plate.visible = clear < 0.5;
    drum.visible = clear > 0.01;
    W.halo.material.opacity = 0.16*(1 - clear); W.halo.visible = clear < 0.99;
    W.ringMat.emissiveIntensity = 1.2 + 0.8*ismooth(0.22, 0.25, p) + 0.3*Math.sin(t*2.2);
    // drum speed: slow while revealed, fast during the helical scan, then parked and driven by scroll
    const w = 1.1*iwin(p, 0.25, 0.3, 0.38, 0.4) + 3.6*iwin(p, 0.38, 0.41, 0.53, 0.58) + 1.0*iwin(p, 0.5, 0.53, 0.6, 0.62);
    phase += w*dt;
    const sweep = ismooth(0.73, 0.83, p), scrollA = -Math.PI*sweep, mix = ismooth(0.6, 0.66, p);
    const ang = scrollA + (1 - mix)*iwrap(phase - scrollA);
    drum.rotation.z = ang;
    const beam = ismooth(0.33, 0.38, p)*(1 - ismooth(0.93, 0.97, p));
    W.fanMat.opacity = (0.16 - 0.08*ismooth(0.62, 0.7, p))*beam*(0.8 + 0.2*Math.sin(t*20)); W.fan.visible = beam > 0.01;
    W.focal.material.opacity = 0.3 + 0.65*beam;
    // helix grows as the table moves
    const hel = ismooth(0.40, 0.50, p), helA = iwin(p, 0.39, 0.41, 0.53, 0.58);
    W.helix.visible = helA > 0.01; W.helix.material.opacity = 0.9*helA; W.helix.geometry.setDrawRange(0, Math.floor(W.helixN*hel/6)*6);
    // inside: body clears, scalp and skull glass, brain
    const inside = ismooth(0.53, 0.62, p);
    P.fadeBody(inside); P.fadeTable(0.7*inside);
    skin.opacity = 0.22*inside; W.scalp.mesh && (W.scalp.mesh.visible = inside > 0.01);
    W.boneMat.opacity = 0.28*inside; W.skull.mesh && (W.skull.mesh.visible = inside > 0.01);
    W.brain.set(inside*0.95);
    // detector profile: transmitted intensity from the real CT slice, for the current angle
    const TT = inside > 0.2 ? W.T() : null;
    let row = null;
    if (TT){ let th = (-ang) % (2*Math.PI); if (th < 0) th += 2*Math.PI; const flip = th >= Math.PI; if (flip) th -= Math.PI;
      const a = Math.min(TT.nA - 1, Math.round(th/Math.PI*TT.nA)), n = TT.n; row = new Float32Array(n); let mx = 1e-6; for (let d = 0; d < n; d++){ const v = TT.sino[a*n + (flip ? n - 1 - d : d)]; row[d] = v; if (v > mx) mx = v; }
      for (let d = 0; d < n; d++) row[d] = Math.exp(-1.3*row[d]/mx); W.rowA = a; }
    const detA = beam;
    for (let i = 0; i < ND; i++){ const a = -A0 + 2*A0*(i + 0.5)/ND, s = 470*Math.tan(a)/(216/128) + 64; let v = 1;
      if (row && inside > 0.2){ const d = Math.round(s); v = d >= 0 && d < 128 ? row[d] : 1; } else v = 0.9 + 0.1*Math.sin(i*0.7 + t*6);
      W.det.setColorAt(i, col.setRGB(0.05 + 0.25*v*detA, 0.12 + 0.55*v*detA, 0.35 + 0.65*v*detA)); }
    W.det.instanceColor.needsUpdate = true;
    const rayA = iwin(p, 0.6, 0.64, 0.72, 0.76); W.rays.forEach(l=>{ l.visible = rayA > 0.01; l.material.opacity = 0.7*rayA; });
    // panels
    const camO = R.camera;
    const profA = iwin(p, 0.635, 0.66, 0.73, 0.75);
    if (profA > 0.002 && row){ const c = W.prof.ctx, Wd = 512, H = 256; c.fillStyle = '#0a1016'; c.fillRect(0, 0, Wd, H);
      c.strokeStyle = 'rgba(95,141,255,.25)'; c.lineWidth = 1; for (let k = 1; k < 4; k++){ c.beginPath(); c.moveTo(0, H*k/4); c.lineTo(Wd, H*k/4); c.stroke(); }
      c.strokeStyle = '#7fa6ff'; c.lineWidth = 3; c.beginPath(); for (let d = 0; d < 128; d++){ const x = 16 + d/127*(Wd - 32), y = H - 24 - row[d]*(H - 56); d ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      c.fillStyle = '#c8d4da'; c.font = '20px monospace'; c.fillText('I/I₀', 16, 28); c.fillText('detector →', Wd - 140, H - 4); W.prof.dirty(); }
    if (profA > 0.002) PN.place(W.prof, camO, camO.aspect > 1.05 ? 0.18*Math.min(1, camO.aspect - 0.8) : 0, camO.aspect > 1.05 ? 0.19 : 0.26, camO.aspect > 1.05 ? 0.62 : 0.6*camO.aspect);
    W.prof.show(profA);
    const pA = ismooth(0.725, 0.75, p), hand = ismooth(0.93, 0.97, p);
    W.sino.g.visible = W.recon.g.visible = pA > 0.002;
    if (pA > 0.002 && TT){
      const k = Math.round(sweep*TT.nA);
      if (W.k !== k){ W.k = k; const c = W.sino.ctx; c.fillStyle = '#0a1016'; c.fillRect(0, 0, 256, 256); if (k > 0) c.drawImage(TT.sinoCv, 0, 0, 128, k, 0, 0, 256, 256*k/TT.nA);
        if (k < TT.nA){ c.fillStyle = 'rgba(95,141,255,.95)'; c.fillRect(0, 256*k/TT.nA, 256, 2); } W.sino.dirty(); }
      const kr = Math.round(ismooth(0.84, 0.93, p)*TT.nA);
      if (W.kr !== kr){ W.kr = kr; tomoTo(TT, kr); const f = Float32Array.from(TT.accF, v=>Math.max(0, v)); W.reconCv = bufCanvas(f, TT.n, CM.gray, kr ? undefined : 1); W.handK = -1; }
      const hk = Math.round(hand*40);
      if (W.handK !== hk){ W.handK = hk; const c = W.recon.ctx; c.globalAlpha = 1; c.fillStyle = '#000'; c.fillRect(0, 0, 256, 256); c.drawImage(W.reconCv, 0, 0, 256, 256);
        const fin = hk ? scanCanvas('ctb', 'normal') : null; if (fin){ c.globalAlpha = hk/40; c.drawImage(fin, 0, 0, 256, 256); c.globalAlpha = 1; } W.recon.dirty(); }
      PN.pair(W.sino, W.recon, camO, hand, pA, ismooth(0.83, 0.85, p));
    } else { W.sino.show(0); W.recon.show(0); }
  };
  W.labels = p => {
    const a = iwin(p, 0.3, 0.32, 0.37, 0.385), b = iwin(p, 0.12, 0.15, 0.21, 0.235), c = iwin(p, 0.54, 0.57, 0.62, 0.635);
    const wp = o => o.getWorldPosition(new T.Vector3());
    return [
      {pos:wp(W.tube), text:'Tubo de rayos X', a},
      {pos:wp(W.detC), text:'Matriz de detectores', a, left:true},
      {pos:new T.Vector3(-62, 62, 16), text:'Anillo colector: alimentación en giro', a, left:true},
      {pos:new T.Vector3(0, 0, 40), text:'Isocentro', a:b},
      {pos:new T.Vector3(0, BORE + 10, GD/2 + 6), text:'El láser marca el primer corte', a:b, left:true},
      {pos:new T.Vector3(0, -12, 0), text:'Haz en abanico a través de la cabeza', a:c},
    ];
  };
  immLinearize(scene);
  return W;
}


/* a white ring gantry with a bore (CT, PET): shell, bell mouths, liner, light ring, screen, name plate */
function immBoreGantry(scene, S, o){
  const T = THREE, M = o.M, G = {gan:new T.Group()}; scene.add(G.gan);
  const {w, h, d, bore} = o;
  const body = ishadow(new T.Mesh(new T.ExtrudeGeometry(iring(w, h, o.corner || 62, bore + 6), {depth:d, bevelEnabled:true, bevelThickness:6, bevelSize:6, bevelSegments:8, curveSegments:80}), M.shell));
  body.geometry.translate(0, 0, -d/2); G.gan.add(body);
  for (const s of [1, -1]){ const f = new T.Mesh(iflare(bore, bore + 9, 9), M.shell); f.scale.z = s; f.position.z = s*(d/2 + 6); G.gan.add(f); }
  const liner = new T.Mesh(new T.CylinderGeometry(bore, bore, d + 14, 96, 1, true), M.liner); liner.rotation.x = Math.PI/2; G.gan.add(liner);
  G.ringMat = new T.MeshStandardMaterial({color:0x0050ff, emissive:0x0050ff, emissiveIntensity:1.4, roughness:0.4});
  const ring = new T.Mesh(new T.TorusGeometry(bore + 10.5, 0.7, 12, 200), G.ringMat); ring.position.z = d/2 + 6.3; G.gan.add(ring);
  G.halo = new T.Sprite(new T.SpriteMaterial({map:S.glow, color:0x4d86ff, transparent:true, opacity:0.16, depthWrite:false, blending:T.AdditiveBlending})); G.halo.scale.set(118, 118, 1); G.halo.position.z = d/2 + 7; G.gan.add(G.halo);
  G.scr = iscreen(o.screen, 22, 13.75, 0.5); G.scr.position.set(-w*0.31, h*0.21, d/2 + 6.4); G.scr.rotation.y = 0.16; G.gan.add(G.scr);
  G.plate = iplate(o.plate, 50, 8); G.plate.position.set(0, h*0.38, d/2 + 6.4); G.gan.add(G.plate);
  const stand = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(w*0.75, d*0.7, 10), {depth:24, bevelEnabled:true, bevelThickness:3, bevelSize:3, bevelSegments:4}), M.plinth));
  stand.rotation.x = -Math.PI/2; stand.position.set(0, S.FLOOR, 12); scene.add(stand);
  const fh = -S.FLOOR - h/2 - 2, foot = ishadow(new T.Mesh(new T.BoxGeometry(w*0.55, fh, d*0.6), M.trim)); foot.position.set(0, S.FLOOR + 3 + fh/2, 0); scene.add(foot);
  S.blob(0, 10, w*1.5, d*3.2);
  G.clear = (c, floor = 0.06) => { for (const m of [M.shell, M.liner]) ifade(m, 1 - c, floor); G.scr.visible = G.plate.visible = c < 0.5; G.halo.material.opacity = 0.16*(1 - c); G.halo.visible = c < 0.99; };
  return G;
}
function immScanMats(){
  const T = THREE;
  return {
    shell: new T.MeshPhysicalMaterial({color:0xf3f5f6, roughness:0.24, clearcoat:0.85, clearcoatRoughness:0.1, side:T.DoubleSide}),
    trim: new T.MeshPhysicalMaterial({color:0xdde3e6, roughness:0.32, clearcoat:0.5}),
    dark: new T.MeshStandardMaterial({color:0x2c363c, roughness:0.45, metalness:0.35}),
    steel: new T.MeshStandardMaterial({color:0xaeb8be, roughness:0.28, metalness:0.9, side:T.DoubleSide}),
    plinth: new T.MeshStandardMaterial({color:0x56636a, roughness:0.45, metalness:0.2}),
    liner: new T.MeshStandardMaterial({color:0xe4e9ec, roughness:0.55, side:T.DoubleSide}),
  };
}
// FDG uptake painted on the cortex: the cavity-shaded base colour stands in for grey-matter density
const PET_OVERLAY = () => ({key:'pet', uniforms:{uHot:{value:0}, uGlow:{value:0}}, decl:'uniform float uHot, uGlow;' + GLSL_RAMPS,
  code:`float cHot = clamp((dot(vColor.rgb, vec3(0.333)) - 0.08)/0.62, 0.0, 1.0); vec3 hotC = iHot(0.18 + 0.58*pow(cHot, 1.3)); diffuseColor.rgb = mix(diffuseColor.rgb, hotC*0.85, uHot);`,
  emit:`totalEmissiveRadiance += hotC*uHot*uGlow*0.6;`});

/* =====================================================================
   PET walkthrough
     0.00 scanner · 0.11 tracer and uptake · 0.25 into the ring · 0.35 detector ring
     0.48 one decay (magnified) · 0.61 coincidence · 0.72 millions of lines · 0.84 reconstruction · 0.94 image
   ===================================================================== */
function buildPET(scene, renderer, R){
  const T = THREE, W = {}, M = immScanMats();
  const S = immStudio(scene, renderer);
  const BORE = 36, RR = 44;
  const GT = immBoreGantry(scene, S, {M, w:196, h:204, d:86, bore:BORE, screen:['PET · ENCÉFALO', '¹⁸F-FDG  185 MBq', 'Captación 45 min'], plate:'N E U R O · P E T'});
  /* ---------- detector ring: 4 rings × 48 blocks of LSO crystals, SiPMs and electronics behind ---------- */
  const inner = new T.Group(); GT.gan.add(inner); inner.visible = false;
  const nB = 48, nR = 4, cryTex = immCanvasTex(64, 64, (x, w)=>{ x.fillStyle = '#e9eef0'; x.fillRect(0, 0, w, w); x.strokeStyle = '#9aa6ad'; x.lineWidth = 2; for (let i = 0; i <= 8; i++){ x.beginPath(); x.moveTo(i*8, 0); x.lineTo(i*8, w); x.stroke(); x.beginPath(); x.moveTo(0, i*8); x.lineTo(w, i*8); x.stroke(); } });
  W.blocks = new T.InstancedMesh(new T.BoxGeometry(5.5, 3.0, 4.6), new T.MeshStandardMaterial({color:0xffffff, map:cryTex, roughness:0.35, metalness:0.2}), nB*nR);
  const m4 = new T.Matrix4(), q = new T.Quaternion(), col = new T.Color();
  for (let r = 0; r < nR; r++) for (let i = 0; i < nB; i++){ const a = (i + 0.5)/nB*Math.PI*2; q.setFromAxisAngle(new T.Vector3(0, 0, 1), a + Math.PI/2);
    m4.compose(new T.Vector3((RR + 1.5)*Math.cos(a), (RR + 1.5)*Math.sin(a), (r - 1.5)*4.9), q, new T.Vector3(1, 1, 1)); W.blocks.setMatrixAt(r*nB + i, m4); W.blocks.setColorAt(r*nB + i, col.setRGB(0.75, 0.78, 0.8)); }
  inner.add(W.blocks); W.lit = new Float32Array(nB*nR);
  const sipm = new T.Mesh(new T.CylinderGeometry(RR + 7, RR + 7, 22, 96, 1, true), new T.MeshStandardMaterial({color:0x22313a, roughness:0.4, metalness:0.5, side:T.DoubleSide})); sipm.rotation.x = Math.PI/2; inner.add(sipm);
  const shield = new T.Mesh(new T.RingGeometry(BORE + 2, RR + 12, 96), new T.MeshStandardMaterial({color:0x6f7b82, roughness:0.4, metalness:0.7, side:T.DoubleSide})); for (const z of [-13, 13]){ const s = shield.clone(); s.position.z = z; inner.add(s); }

  /* ---------- patient: a glowing head, the syringe and the tracer ---------- */
  W.P = immTable(scene);
  const headMesh = W.P.man.j.head.children.find(c=>c.isMesh); W.headMat = W.P.mat.clone(); W.headMat.emissive = new T.Color(0xff6a1a); W.headMat.emissiveIntensity = 0; W.headMat.userData.linear = true; headMesh.material = W.headMat;
  W.P.table.position.set(0, -22, 205); scene.updateMatrixWorld(true);
  const toTable = j => W.P.table.worldToLocal(W.P.man.j[j].getWorldPosition(new T.Vector3()));
  const wr = toTable('wristR'), el = toTable('elbowR'), sh = toTable('shoulderR'), nk = toTable('neck'), hd = toTable('head').add(new T.Vector3(0, 4, -6));
  W.flow = new T.CatmullRomCurve3([wr, el, sh, nk.clone().add(new T.Vector3(0, 2, 0)), hd]);
  W.syr = new T.Group(); W.syr.position.copy(wr).add(new T.Vector3(-9, 6, -4)); W.syr.rotation.set(0.2, 0, 0.9); W.P.table.add(W.syr);
  const tung = new T.Mesh(new T.CylinderGeometry(2.1, 2.1, 9, 32), M.dark); W.syr.add(tung);
  const barrel = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 5, 20), new T.MeshPhysicalMaterial({color:0xffffff, roughness:0.05, transmission:0, transparent:true, opacity:0.4})); barrel.position.y = 6.5; W.syr.add(barrel);
  W.liq = new T.Mesh(new T.CylinderGeometry(0.75, 0.75, 4.2, 20), new T.MeshStandardMaterial({color:0xffa53a, emissive:0xff7a1a, emissiveIntensity:1.2})); W.liq.position.y = 6.3; W.syr.add(W.liq);
  const needle = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 6, 8), M.steel); needle.position.y = -7.5; W.syr.add(needle);
  W.drops = []; for (let i = 0; i < 36; i++){ const s = new T.Sprite(new T.SpriteMaterial({map:S.glow, color:0xff8a2a, transparent:true, opacity:0, depthWrite:false})); s.scale.setScalar(2.2); s.renderOrder = 7; W.P.table.add(s); W.drops.push(s); }
  W.headGlow = new T.Sprite(new T.SpriteMaterial({map:S.glow, color:0xff7a2a, transparent:true, opacity:0, depthWrite:false, blending:T.AdditiveBlending})); W.headGlow.scale.setScalar(40); W.headGlow.position.copy(hd); W.P.table.add(W.headGlow);

  /* ---------- the brain with FDG uptake, and a see-through scalp ---------- */
  W.ov = PET_OVERLAY();
  W.brain = immBrain(W.P.mni, {overlay:W.ov, order:2});
  const skin = new T.MeshPhysicalMaterial({color:0xc9d6de, roughness:0.35, clearcoat:0.4, transparent:true, opacity:0, depthWrite:false});
  W.scalp = immScalp(W.P.mni, skin, {order:4});

  /* ---------- one decay, magnified: nucleus, positron track, electron, flash, two photons ---------- */
  W.D = W.P.mni.localToWorld(new T.Vector3(-22, 46, 38));   // just under the surface of the left frontal cortex (table not yet moved: recomputed below)
  const dec = new T.Group(); scene.add(dec); W.dec = dec;
  const nuc = new T.Group(); dec.add(nuc); const rr = rnd(5);
  for (let i = 0; i < 18; i++){ const u = rr()*2 - 1, th = rr()*Math.PI*2, r = 0.32*Math.cbrt(rr()), s = Math.sqrt(1 - u*u);
    const b = new T.Mesh(new T.SphereGeometry(0.17, 16, 12), new T.MeshStandardMaterial({color:i % 2 ? 0x9fadb3 : 0xd9412b, roughness:0.4, transparent:true})); b.position.set(r*s*Math.cos(th), r*s*Math.sin(th), r*u); nuc.add(b); }
  const track = []; let tp = new T.Vector3(0, 0, 0); const dir = new T.Vector3(0.6, 0.5, 0.4).normalize();
  for (let i = 0; i < 12; i++){ track.push(tp.clone()); tp = tp.clone().addScaledVector(dir, 0.34).add(new T.Vector3((rr() - 0.5)*0.5, (rr() - 0.5)*0.5, (rr() - 0.5)*0.5)); }
  track.push(tp.clone()); W.A = tp.clone();
  W.track = new T.Line(new T.BufferGeometry().setFromPoints(new T.CatmullRomCurve3(track).getPoints(120)), new T.LineDashedMaterial({color:0x0050ff, dashSize:0.12, gapSize:0.08, transparent:true}));
  W.track.computeLineDistances(); dec.add(W.track);
  W.trackCurve = new T.CatmullRomCurve3(track);
  W.pos = new T.Mesh(new T.SphereGeometry(0.13, 20, 14), new T.MeshStandardMaterial({color:0x2f6bff, emissive:0x0050ff, emissiveIntensity:0.8, transparent:true})); dec.add(W.pos);
  W.ele = new T.Mesh(new T.SphereGeometry(0.13, 20, 14), new T.MeshStandardMaterial({color:0x0c161b, roughness:0.3, transparent:true})); dec.add(W.ele);
  W.flash = new T.Sprite(new T.SpriteMaterial({map:S.glow, color:0xffb24a, transparent:true, opacity:0, depthWrite:false})); W.flash.position.copy(W.A); dec.add(W.flash);
  W.ph = [iwiggle(T, 0xe8962a, 400), iwiggle(T, 0xe8962a, 400)]; W.ph.forEach(l=>{ l.material.linewidth = 2; scene.add(l); });
  W.lor = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]), new T.LineBasicMaterial({color:0x0050ff, transparent:true, opacity:0, depthWrite:false})); W.lor.renderOrder = 6; W.lor.frustumCulled = false; scene.add(W.lor);
  W.hitA = new T.Sprite(new T.SpriteMaterial({map:S.glow, color:0x4d86ff, transparent:true, opacity:0, depthWrite:false})); W.hitB = W.hitA.clone(); W.hitB.material = W.hitA.material.clone(); W.hitA.scale.setScalar(9); W.hitB.scale.setScalar(9); scene.add(W.hitA, W.hitB);

  /* ---------- many coincidences ---------- */
  W.maxL = 90; const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(new Float32Array(W.maxL*6), 3)); lg.setAttribute('color', new T.BufferAttribute(new Float32Array(W.maxL*6), 3));
  W.lines = new T.LineSegments(lg, new T.LineBasicMaterial({vertexColors:true, transparent:true, opacity:0.85, depthWrite:false})); W.lines.renderOrder = 6; W.lines.frustumCulled = false; scene.add(W.lines);
  W.flashes = []; for (let i = 0; i < 14; i++){ const s = new T.Sprite(new T.SpriteMaterial({map:S.glow, color:0xffa53a, transparent:true, opacity:0, depthWrite:false})); s.scale.setScalar(2.2); s.renderOrder = 7; scene.add(s); W.flashes.push(s); }
  W.ev = []; W.n = 0; W.last = 0; W.rand = rnd(17);
  const hitRing = (o, d) => { const A = d.x*d.x + d.y*d.y, B = 2*(o.x*d.x + o.y*d.y), C = o.x*o.x + o.y*o.y - RR*RR, s = (-B + Math.sqrt(B*B - 4*A*C))/(2*A); return o.clone().addScaledVector(d, s); };
  const lightAt = P => { if (Math.abs(P.z) > 9.8) return; const ang = (Math.atan2(P.y, P.x) + Math.PI*2) % (Math.PI*2), i = Math.floor(ang/(Math.PI*2)*nB) % nB, r = Math.max(0, Math.min(nR - 1, Math.floor((P.z + 9.8)/4.9))); W.lit[r*nB + i] = 1; };
  W.vtmp = new T.Vector3();
  const sampleBrain = () => { const Mr = MESHRAW; if (!Mr) return null; for (let k = 0; k < 8; k++){ const i = Math.floor(W.rand()*Mr.nv), rg = Mr.reg[i]; if ((rg >= 97 && rg <= 98) || rg >= 117) continue; if (Mr.nrm[i*4 + 3] < 0) continue;
      return W.P.mni.localToWorld(W.vtmp.set(Mr.pos[i*3]/64, Mr.pos[i*3 + 1]/64, Mr.pos[i*3 + 2]/64).clone()); } return null; };

  /* ---------- reconstruction panels ---------- */
  const PN = immPanels(scene); W.lorP = PN.make('LÍNEAS RETROPROYECTADAS'); W.imgP = PN.make('TRAS OSEM');
  W.env = {}; const withEnv = f => { const o = G_ENV_SWAP(W.env); try { return f(); } finally { G.env = o; } };

  const cam = immCamPath(R, [
    [0.00, [-470, 120, 560], [0, -14, 40]],
    [0.09, [-360, 90, 520], [0, -10, 140]],
    [0.14, [-120, 50, 330], [0, -2, 215]],
    [0.23, [-95, 34, 290], [0, -2, 205]],
    [0.31, [-300, 60, 300], [0, -10, 60]],
    [0.39, [-240, 160, 300], [0, 0, 0]],
    [0.46, [-90, 40, 250], [0, 0, 0]],
    [0.52, [-24, 22, 70], [2, 3, -3]],
    [0.58, [-6, 10, 6], [2, 4.4, -3.2]],
    [0.62, [-8, 16, 34], [2, 3, -3]],
    [0.68, [0, 16, 86], [0, 0, -3]],
    [0.72, [-6, 18, 88], [0, 0, -3]],
    [0.80, [-26, 24, 88], [0, 0, 0]],
    [0.90, [-14, 16, 76], [0, 0, 0]],
    [1.00, [0, 12, 68], [0, 0, 0]],
  ], {drift:0.09});
  const wp = new T.Vector3();
  W.update = (p, t, dt) => {
    const P = W.P; W.brain.build(); W.scalp.build();
    const near = p < 0.5 ? 6 : p < 0.66 ? 0.05 : 1;
    cam(p, t, ilerp(34, 44, ismooth(0.48, 0.56, p)), near);
    R.saoOn = false;
    const zt = ilerp(205, -16, ismooth(0.26, 0.34, p)); P.table.position.set(0, -22, zt);
    // tracer: syringe, droplets flowing up the arm to the head, the head warming up
    const inj = iwin(p, 0.10, 0.13, 0.235, 0.26), flow = ismooth(0.12, 0.22, p);
    W.syr.visible = inj > 0.01; W.liq.scale.y = Math.max(0.05, 1 - flow); W.liq.position.y = 6.3 - 2.1*flow;
    W.drops.forEach((s, i)=>{ const u = ((t*0.22 + i/W.drops.length) % 1), live = inj*ismooth(0.12, 0.14, p)*(1 - ismooth(0.21, 0.235, p)); s.position.copy(W.flow.getPoint(u)); s.material.opacity = live*Math.sin(Math.PI*u)*0.9; s.visible = live > 0.01; });
    const uptake = ismooth(0.15, 0.23, p);
    W.headMat.emissiveIntensity = 0.55*uptake*(1 - ismooth(0.3, 0.36, p)); W.headGlow.material.opacity = 0.35*uptake*(1 - ismooth(0.28, 0.34, p)); W.headGlow.visible = W.headGlow.material.opacity > 0.01;
    // ring revealed
    const clear = ismooth(0.36, 0.42, p); GT.clear(clear); inner.visible = clear > 0.01;
    GT.ringMat.emissiveIntensity = 1.2 + 0.8*ismooth(0.32, 0.35, p) + 0.3*Math.sin(t*2.2);
    // inside: body clears, brain glows
    const inside = ismooth(0.45, 0.52, p);
    P.fadeBody(inside); P.fadeTable(0.7*inside);
    for (const m of [W.headMat]){ const f = inside > 0.01; if (m.transparent !== f){ m.transparent = f; m.needsUpdate = true; } m.opacity = 1 - inside; m.depthWrite = !f; }
    skin.opacity = 0.18*inside*(1 - 0.6*ismooth(0.5, 0.56, p)); if (W.scalp.mesh) W.scalp.mesh.visible = skin.opacity > 0.005;
    W.brain.set(inside*(1 - 0.75*iwin(p, 0.53, 0.56, 0.6, 0.64)));
    W.ov.uniforms.uHot.value = inside; W.ov.uniforms.uGlow.value = 0.25 + 0.15*Math.sin(t*1.7);
    // the decay site follows the table
    P.table.updateMatrixWorld(true); P.mni.localToWorld(W.D.set(-22, 46, 38)); dec.position.copy(W.D);
    const u1 = ismooth(0.53, 0.585, p), u2 = ismooth(0.585, 0.68, p), decA = iwin(p, 0.5, 0.53, 0.66, 0.7);
    dec.visible = decA > 0.01;
    dec.traverse(o=>{ if (o.material && o !== W.flash && o.material.transparent !== undefined){ o.material.transparent = true; o.material.opacity = decA*(o === W.track ? 0.9 : 1); } });
    const run = Math.min(1, u1/0.85);
    W.track.geometry.setDrawRange(0, Math.floor(121*run)); W.trackCurve.getPoint(run, W.pos.position); W.pos.visible = u1 < 0.9;
    W.ele.position.copy(W.A).add(new T.Vector3(0.28*Math.cos(t*3), 0.2*Math.sin(t*2.3), 0.15)).lerp(W.A, ismooth(0.6, 0.85, u1)); W.ele.visible = u1 < 0.9;
    const fl = u1 > 0.82 ? Math.max(0, 1 - Math.abs(u1 - 0.95)/0.13) : 0; W.flash.material.opacity = Math.max(fl, u2 > 0 ? 0.6*(1 - ismooth(0, 0.3, u2)) : 0)*decA; W.flash.scale.setScalar(0.6 + 2.4*ismooth(0.82, 1, u1) + 6*u2);
    // two 511 keV photons fly apart across the transverse plane and hit the ring
    const A0 = dec.localToWorld(W.A.clone()), pd = new T.Vector3(Math.cos(0.62), Math.sin(0.62), 0.04).normalize(), HA = hitRing(A0, pd), HB = hitRing(A0, pd.clone().negate());
    const phA = (u1 > 0.97 ? 1 : 0)*iwin(p, 0.585, 0.59, 0.71, 0.74);
    W.ph.forEach((l, k)=>{ l.visible = phA > 0.01; l.material.opacity = phA; const H = k ? HB : HA, L = A0.distanceTo(H), lead = Math.min(1, u2*1.02), tail = Math.max(0, lead - 0.55);
      l.userData.set(A0, H, 0.18 + 0.004*L*0, L/1.1, t*24, tail, lead, new T.Vector3(0, 0, 1)); });
    const hit = ismooth(0.66, 0.69, p)*(1 - ismooth(0.72, 0.75, p));
    W.hitA.position.copy(HA); W.hitB.position.copy(HB); W.hitA.material.opacity = W.hitB.material.opacity = hit; W.hitA.visible = W.hitB.visible = hit > 0.01;
    W.lor.geometry.attributes.position.array.set([HA.x, HA.y, HA.z, HB.x, HB.y, HB.z]); W.lor.geometry.attributes.position.needsUpdate = true; W.lor.material.opacity = ismooth(0.665, 0.69, p)*(1 - ismooth(0.74, 0.77, p)); W.lor.visible = W.lor.material.opacity > 0.01;
    if (hit > 0.5){ lightAt(HA); lightAt(HB); }
    // a stream of coincidences
    const many = iwin(p, 0.72, 0.74, 0.86, 0.9);
    if (W.last > t) W.last = t;
    for (let kk = 0; many > 0.05 && MESHRAW && t - W.last > 0.035 && kk < 4; kk++){ W.last += 0.035; if (t - W.last > 0.5) W.last = t;
      const o = sampleBrain(); if (o){ const a = W.rand()*Math.PI*2, d = new T.Vector3(Math.cos(a), Math.sin(a), (W.rand() - 0.5)*0.2).normalize(), A = hitRing(o, d), B = hitRing(o, d.clone().negate());
        W.ev.push({A, B, o, at:t}); if (W.ev.length > W.maxL) W.ev.shift(); W.n++; lightAt(A); lightAt(B); if (IMM.visible) sndClick(0.6); } }
    W.ev = W.ev.filter(e=>t - e.at < 0.9 && t >= e.at);
    const pa = W.lines.geometry.attributes.position, ca = W.lines.geometry.attributes.color;
    for (let i = 0; i < W.maxL; i++){ const e = W.ev[i]; if (!e || many < 0.05){ for (let k = 0; k < 6; k++){ pa.array[i*6 + k] = 0; ca.array[i*6 + k] = 0; } continue; }
      const f = (1 - (t - e.at)/0.9)*many; pa.array.set([e.A.x, e.A.y, e.A.z, e.B.x, e.B.y, e.B.z], i*6); const r = 0.94 - 0.9*f, g2 = 0.95 - 0.66*f; ca.array.set([r, g2, 0.98, r, g2, 0.98], i*6); }
    pa.needsUpdate = true; ca.needsUpdate = true; W.lines.visible = many > 0.01;
    W.flashes.forEach((s, i)=>{ const e = W.ev[W.ev.length - 1 - i]; if (!e || many < 0.05){ s.material.opacity = 0; s.visible = false; return; } const f = 1 - (t - e.at)/0.35; s.visible = f > 0; s.material.opacity = Math.max(0, f)*many; s.position.copy(e.o); });
    const base = new T.Color(0.75, 0.78, 0.8), hot = new T.Color(0.18, 0.42, 1.0);
    for (let k = 0; k < W.lit.length; k++){ W.blocks.setColorAt(k, col.copy(base).lerp(hot, W.lit[k])); W.lit[k] *= Math.pow(0.04, dt); }
    W.blocks.instanceColor.needsUpdate = true;
    // reconstruction
    const pA = ismooth(0.835, 0.86, p), hand = ismooth(0.93, 0.97, p), camO = R.camera;
    if (pA > 0.002){
      const Ps = withEnv(()=>petSampler());
      if (Ps){ const target = Math.round(ismooth(0.84, 0.92, p)*60000); if (target < Ps.count){ Ps.acc.fill(0); Ps.count = 0; } withEnv(()=>petAdd(Ps, Math.min(target, Ps.count + 4000)));
        if (W.pc !== Ps.count){ W.pc = Ps.count; const c = W.lorP.ctx; c.fillStyle = '#000'; c.fillRect(0, 0, 256, 256); c.drawImage(bufCanvas(Ps.acc, Ps.n, CM.hot), 0, 0, 256, 256); W.lorP.dirty(); }
        const ia = Math.round(ismooth(0.88, 0.93, p)*30) + 31*Math.round(hand*30);
        if (W.ia !== ia){ W.ia = ia; const c = W.imgP.ctx; c.fillStyle = '#000'; c.fillRect(0, 0, 256, 256); const fdg = scanCanvas('fdg', 'normal'); if (fdg){ c.globalAlpha = ismooth(0.88, 0.93, p); c.drawImage(fdg, 0, 0, 256, 256); c.globalAlpha = 1; } W.imgP.dirty(); } }
      PN.pair(W.lorP, W.imgP, camO, hand, pA, pA);
    } else { W.lorP.show(0); W.imgP.show(0); }
  };
  W.labels = p => {
    const a = iwin(p, 0.4, 0.42, 0.46, 0.48), b = iwin(p, 0.135, 0.15, 0.22, 0.24), c = iwin(p, 0.54, 0.555, 0.6, 0.62), d = iwin(p, 0.665, 0.68, 0.72, 0.74), e = iwin(p, 0.745, 0.76, 0.84, 0.86);
    const ang = -0.7, onRing = new T.Vector3((RR + 2)*Math.cos(ang), (RR + 2)*Math.sin(ang), 9);
    const tw = v => W.P.table.localToWorld(v.clone());
    const A0 = dec.localToWorld(W.A.clone());
    return [
      {pos:onRing, text:'Bloques de cristal LSO · 4 anillos', a},
      {pos:new T.Vector3(-(RR + 8), 6, 11), text:'Fotomultiplicadores de silicio', a, left:true},
      {pos:tw(W.syr.position), text:'¹⁸F-FDG en un blindaje de tungsteno', a:b},
      {pos:tw(W.flow.getPoint(1)), text:'El trazador se acumula en el encéfalo', a:b, left:true},
      {pos:dec.localToWorld(new T.Vector3(0, 0, 0)), text:'núcleo de ¹⁸F', a:c, left:true},
      {pos:dec.localToWorld(W.trackCurve.getPoint(0.45)), text:'positrón · alcance ≈ 0.6 mm (ampliado)', a:c},
      {pos:A0.clone().add(new T.Vector3(0, 0, 0)), text:'aniquilación → 2 × 511 keV', a:d},
      {pos:new T.Vector3(0, RR + 2, -2), text:`${W.n.toLocaleString('en-GB')} coincidences`, a:e},
    ];
  };
  immLinearize(scene);
  return W;
}
const G_ENV_SWAP = env => { const o = G.env; G.env = env; return o; };


const SPECT_OVERLAY = () => ({key:'spect', uniforms:{uHot:{value:0}, uGlow:{value:0}}, decl:'uniform float uHot, uGlow;' + GLSL_RAMPS,
  code:`float cSp = clamp((dot(vColor.rgb, vec3(0.333)) - 0.08)/0.62, 0.0, 1.0); vec3 spC = iSpect(0.3 + 0.62*cSp); diffuseColor.rgb = mix(diffuseColor.rgb, spC*0.85, uHot);`,
  emit:`totalEmissiveRadiance += spC*uHot*uGlow;`});

/* =====================================================================
   SPECT walkthrough
     0.00 camera · 0.11 tracer · 0.26 heads close in · 0.38 inside a head
     0.50 only straight photons · 0.63 step and shoot · 0.77 reconstruction · 0.94 image
   ===================================================================== */
function buildSPECT(scene, renderer, R){
  const T = THREE, W = {}, M = immScanMats(), m4 = new T.Matrix4();
  const S = immStudio(scene, renderer);
  /* ---------- gantry ring the heads ride on ---------- */
  const gz = -52;
  const ringG = ishadow(new T.Mesh(new T.ExtrudeGeometry(iring(214, 214, 107, 80), {depth:22, bevelEnabled:true, bevelThickness:5, bevelSize:5, bevelSegments:8, curveSegments:120}), M.shell));
  ringG.position.z = gz - 11; scene.add(ringG);
  const lightR = new T.Mesh(new T.TorusGeometry(91, 0.7, 12, 200), new T.MeshStandardMaterial({color:0x0050ff, emissive:0x0050ff, emissiveIntensity:1.3})); lightR.position.z = gz + 16.3; scene.add(lightR); W.lightR = lightR;
  const base = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(170, 70, 12), {depth:24, bevelEnabled:true, bevelThickness:3, bevelSize:3, bevelSegments:4}), M.plinth)); base.rotation.x = -Math.PI/2; base.position.set(0, S.FLOOR, gz + 10); scene.add(base);
  const foot = ishadow(new T.Mesh(new T.BoxGeometry(120, -S.FLOOR - 104, 46), M.trim)); foot.position.set(0, S.FLOOR + 3 + (-S.FLOOR - 104)/2, gz); scene.add(foot);
  const plate = iplate('N E U R O · S P E C T', 60, 9); plate.position.set(0, 96, gz + 16.4); scene.add(plate);
  S.blob(0, gz + 20, 320, 200);
  /* ---------- three gamma-camera heads ---------- */
  const colTex = immCanvasTex(512, 512, (x, w)=>{ x.fillStyle = '#56636a'; x.fillRect(0, 0, w, w); x.fillStyle = '#c7d0d5'; for (let j = 0; j < 46; j++) for (let i = 0; i < 40; i++){ const cx = i*12.8 + (j % 2)*6.4, cy = j*11.1; x.beginPath(); for (let k = 0; k < 6; k++){ const a = k/6*Math.PI*2 + Math.PI/6; x.lineTo(cx + 4.6*Math.cos(a), cy + 4.6*Math.sin(a)); } x.fill(); } });
  colTex.wrapS = colTex.wrapT = T.RepeatWrapping; colTex.repeat.set(2, 1.6);
  const headMat = new T.MeshPhysicalMaterial({color:0xd8e0e4, roughness:0.3, clearcoat:0.6});
  W.rot = new T.Group(); W.rot.position.z = 0; scene.add(W.rot); W.heads = [];
  for (let k = 0; k < 3; k++){
    const g = new T.Group(); g.rotation.z = Math.PI/2 + k*Math.PI*2/3; W.rot.add(g);   // local +x points at the patient's head from outside
    const hb = new T.Group(); g.add(hb);
    const body = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(24, 54, 5), {depth:42, bevelEnabled:true, bevelThickness:2, bevelSize:2, bevelSegments:4}), headMat)); body.geometry.translate(12, 0, -21); hb.add(body);
    const face = new T.Mesh(new T.PlaneGeometry(42, 50), new T.MeshStandardMaterial({map:colTex, roughness:0.5, metalness:0.4})); face.rotation.y = -Math.PI/2; face.position.x = -2.2; hb.add(face);
    const edge = new T.Mesh(new T.BoxGeometry(1.2, 55, 43), new T.MeshStandardMaterial({color:0x0050ff, emissive:0x0050ff, emissiveIntensity:0.5})); edge.position.x = -1.2; hb.add(edge);
    const post = ishadow(new T.Mesh(new T.BoxGeometry(10, 12, 24), M.trim)); post.position.set(19, 0, -32); hb.add(post);
    const arm = ishadow(new T.Mesh(new T.BoxGeometry(1, 12, 8), M.trim)); arm.position.set(0, 0, -40); hb.add(arm); hb.userData.arm = arm;
    W.heads.push(hb);
  }
  W.setRadius = r => W.heads.forEach(hb=>{ hb.position.x = r; const L = 92 - (r + 24); hb.userData.arm.scale.x = Math.max(1, L); hb.userData.arm.position.x = 24 + L/2; });
  W.top = new T.Object3D(); W.heads[0].add(W.top); W.top.position.set(14, 0, 0);

  /* ---------- patient, brain, scalp ---------- */
  W.P = immTable(scene);
  const headMesh = W.P.man.j.head.children.find(c=>c.isMesh); W.headMat = W.P.mat.clone(); W.headMat.emissive = new T.Color(0x3dff9a); W.headMat.emissiveIntensity = 0; W.headMat.userData.linear = true; headMesh.material = W.headMat;
  W.ov = SPECT_OVERLAY(); W.brain = immBrain(W.P.mni, {overlay:W.ov, order:2});
  const skin = new T.MeshPhysicalMaterial({color:0xc9d6de, roughness:0.35, clearcoat:0.4, transparent:true, opacity:0, depthWrite:false});
  W.scalp = immScalp(W.P.mni, skin, {order:4});

  /* ---------- inside a camera head, magnified: collimator, crystal, photomultipliers ---------- */
  const ins = new T.Group(); ins.position.set(0, 47, 34); scene.add(ins); W.ins = ins; ins.visible = false;
  const lead = new T.MeshStandardMaterial({color:0x6f7b82, roughness:0.45, metalness:0.6, transparent:true});
  const hexG = new T.CylinderGeometry(0.52, 0.52, 3, 6, 1, true); const NH = 15*9;
  const hex = new T.InstancedMesh(hexG, new T.MeshStandardMaterial({color:0x56636a, roughness:0.5, metalness:0.6, side:T.DoubleSide, transparent:true}), NH);
  let k = 0; for (let j = 0; j < 9; j++) for (let i = 0; i < 15; i++){ m4.compose(new T.Vector3((i - 7)*0.9 + (j % 2)*0.45, 1.5, (j - 4)*0.78), new T.Quaternion(), new T.Vector3(1, 1, 1)); hex.setMatrixAt(k++, m4); }
  ins.add(hex);
  const slab = (w, h, d, y, mat) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.y = y; ins.add(m); return m; };
  W.cry = slab(14.4, 0.9, 7.6, 3.5, new T.MeshPhysicalMaterial({color:0x9ec4ff, roughness:0.1, transparent:true, opacity:0.55, emissive:0x2f6bff, emissiveIntensity:0}));
  slab(14.4, 0.6, 7.6, 4.3, new T.MeshPhysicalMaterial({color:0xffffff, roughness:0.05, transparent:true, opacity:0.25}));
  W.pmts = []; for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++){ const g = new T.Group(); g.position.set((i - 2)*2.8, 4.6, (j - 0.5)*3.4); ins.add(g);
    const tubeM = new T.MeshStandardMaterial({color:0x2c363c, roughness:0.4, metalness:0.4, emissive:0x2f6bff, emissiveIntensity:0, transparent:true});
    const tb = new T.Mesh(new T.CylinderGeometry(1.15, 1.15, 3.6, 24), tubeM); tb.position.y = 1.8; g.add(tb);
    const dome = new T.Mesh(new T.SphereGeometry(1.15, 24, 12, 0, Math.PI*2, 0, Math.PI/2), new T.MeshPhysicalMaterial({color:0xd8f0ff, roughness:0.05, transparent:true, opacity:0.5})); dome.rotation.x = Math.PI; g.add(dome);
    W.pmts.push(tubeM); }
  slab(15, 0.6, 8.2, 8.6, new T.MeshStandardMaterial({color:0x1d6a4a, roughness:0.5, transparent:true}));
  // the source: tracer in the brain below, magnified
  W.src = []; const rs = rnd(31); for (let i = 0; i < 9; i++){ const s = new T.Sprite(new T.SpriteMaterial({map:S.glow, color:0xffa53a, transparent:true, opacity:0, depthWrite:false})); s.scale.setScalar(1.2); s.position.set((rs() - 0.5)*12, -7 - rs()*2, (rs() - 0.5)*5); ins.add(s); W.src.push(s); }
  W.NP = 40; const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(new Float32Array(W.NP*6), 3)); pg.setAttribute('color', new T.BufferAttribute(new Float32Array(W.NP*6), 3));
  W.phL = new T.LineSegments(pg, new T.LineBasicMaterial({vertexColors:true, transparent:true, depthWrite:false})); W.phL.frustumCulled = false; W.phL.renderOrder = 7; ins.add(W.phL);
  W.sparks = []; for (let i = 0; i < 10; i++){ const s = new T.Sprite(new T.SpriteMaterial({map:S.glow, color:0x4d86ff, transparent:true, opacity:0, depthWrite:false})); s.scale.setScalar(2.6); s.renderOrder = 8; ins.add(s); W.sparks.push({s, t0:-9}); }
  W.phs = []; W.rp = rnd(77); W.lastPh = 0; W.counts = {em:0, pass:0};

  /* ---------- panels ---------- */
  const PN = immPanels(scene); W.sinoP = PN.make('PROYECCIONES · UNA FILA POR VISTA'); W.recP = PN.make('RECONSTRUIDO · PERFUSIÓN HMPAO');
  W.env = {}; const withEnv = f => { const o = G.env; G.env = W.env; try { return f(); } finally { G.env = o; } };

  const cam = immCamPath(R, [
    [0.00, [-460, 140, 520], [0, -14, 20]],
    [0.09, [-340, 90, 450], [0, -10, 90]],
    [0.15, [-130, 50, 340], [0, -2, 215]],
    [0.24, [-110, 40, 300], [0, -2, 205]],
    [0.33, [-280, 80, 280], [0, -6, 30]],
    [0.40, [-150, 90, 180], [0, 30, 10]],
    [0.47, [-26, 52, 70], [0, 49, 34]],
    [0.58, [-20, 48, 64], [0, 48, 34]],
    [0.66, [-190, 120, 230], [0, 0, 0]],
    [0.76, [-70, 40, 170], [0, 0, 0]],
    [0.86, [-30, 24, 110], [0, 0, 0]],
    [1.00, [0, 14, 90], [0, 0, 0]],
  ], {drift:0.09});
  W.update = (p, t, dt) => {
    const P = W.P; W.brain.build(); W.scalp.build();
    cam(p, t, ilerp(34, 40, ismooth(0.44, 0.5, p)), p < 0.42 ? 6 : 1);
    R.saoOn = false;
    P.table.position.set(0, -22, ilerp(205, -16, ismooth(0.26, 0.34, p)));
    W.setRadius(ilerp(66, 44, ismooth(0.3, 0.37, p)));
    lightR.material.emissiveIntensity = 1.1 + 0.3*Math.sin(t*2.2);
    // tracer: the head glows as HMPAO is trapped
    const up = ismooth(0.13, 0.2, p);
    W.headMat.emissiveIntensity = 0.45*up*(1 - ismooth(0.3, 0.36, p));
    // step and shoot: 40 steps of 3° (three heads → 120 views)
    const s = ismooth(0.64, 0.76, p), x = s*40, stepped = Math.floor(x) + ismooth(0.65, 1, x - Math.floor(x));
    W.rot.rotation.z = -stepped*3*Math.PI/180;
    // inside view: inset visible, body fades
    const insA = iwin(p, 0.42, 0.46, 0.6, 0.63); ins.visible = insA > 0.01;
    ins.traverse(o=>{ if (o.isMesh && o.material && o.material.transparent){ o.material.opacity = (o.material.userData.base ?? (o.material.userData.base = o.material.opacity))*insA; } });
    hex.material.opacity = insA; lead.opacity = insA;
    const inside = ismooth(0.62, 0.7, p);
    P.fadeBody(Math.max(inside, 0.85*insA)); P.fadeTable(0.6*inside);
    { const m = W.headMat, a = Math.max(inside, 0.85*insA), f = a > 0.01; if (m.transparent !== f){ m.transparent = f; m.needsUpdate = true; } m.opacity = 1 - a; m.depthWrite = !f; }
    skin.opacity = 0.18*inside; if (W.scalp.mesh) W.scalp.mesh.visible = skin.opacity > 0.005;
    W.brain.set(inside*0.95); W.ov.uniforms.uHot.value = inside; W.ov.uniforms.uGlow.value = 0.22 + 0.1*Math.sin(t*1.5);
    // photons in the magnified head: most hit the lead septa, a few go straight through to the crystal
    const phOn = iwin(p, 0.49, 0.51, 0.6, 0.62);
    W.src.forEach((sp, i)=>{ sp.material.opacity = insA*(0.6 + 0.4*Math.sin(t*3 + i)); });
    if (phOn > 0.05 && (t - W.lastPh > 0.06 || W.lastPh > t)){ W.lastPh = t;
      const sp = W.src[Math.floor(W.rp()*W.src.length)], straight = W.rp() < 0.18, a = straight ? (W.rp() - 0.5)*0.03 : (W.rp() < 0.5 ? -1 : 1)*(0.12 + W.rp()*0.5), b = (W.rp() - 0.5)*0.4;
      const d = new T.Vector3(Math.sin(a), Math.cos(a), straight ? 0 : Math.sin(b)).normalize();
      const stopY = straight ? 3.2 : 0.2 + W.rp()*1.2; W.phs.push({o:sp.position.clone(), d, stop:(stopY - sp.position.y)/d.y, t0:t, pass:straight}); W.counts.em++; if (W.phs.length > W.NP) W.phs.shift(); }
    const pa = W.phL.geometry.attributes.position, ca = W.phL.geometry.attributes.color, v = new T.Vector3();
    W.phs = W.phs.filter(f=>t - f.t0 < 1.4);
    for (let i = 0; i < W.NP; i++){ const f = W.phs[i]; if (!f || phOn < 0.05){ for (let k2 = 0; k2 < 6; k2++){ pa.array[i*6 + k2] = 0; ca.array[i*6 + k2] = 0; } continue; }
      const L = Math.min(f.stop, (t - f.t0)*22), L0 = Math.max(0, L - 2.2), A = f.o.clone().addScaledVector(f.d, L0), B = f.o.clone().addScaledVector(f.d, L);
      const age = (t - f.t0)*22 - f.stop, fadeK = age > 0 ? Math.max(0, 1 - age/6) : 1;
      if (age > 0 && !f.hit){ f.hit = true; if (f.pass){ W.counts.pass++; const sk = W.sparks.find(q=>t - q.t0 > 0.5) || W.sparks[0]; sk.t0 = t; sk.s.position.copy(B); } }
      pa.array.set([A.x, A.y, A.z, B.x, B.y, B.z], i*6); const c = f.pass ? [1, 0.6, 0.15] : [0.5, 0.56, 0.6]; ca.array.set([c[0]*fadeK*phOn, c[1]*fadeK*phOn, c[2]*fadeK*phOn, c[0]*fadeK*phOn, c[1]*fadeK*phOn, c[2]*fadeK*phOn], i*6); }
    pa.needsUpdate = ca.needsUpdate = true; W.phL.visible = phOn > 0.01; W.phL.material.opacity = phOn;
    let glow = 0; W.sparks.forEach(q=>{ const f = 1 - (t - q.t0)/0.5; q.s.material.opacity = Math.max(0, f)*phOn; q.s.visible = f > 0; glow = Math.max(glow, f); });
    W.cry.material.emissiveIntensity = 0.8*Math.max(0, glow)*phOn; W.pmts.forEach((m, i)=>{ m.emissiveIntensity = 0.9*Math.max(0, glow)*phOn*(0.5 + 0.5*Math.sin(i*1.7)); });
    // panels: projections fill as the heads step round, then reconstruction
    const camO = R.camera, TT = p > 0.6 ? withEnv(()=>tomo('hmpao', 'normal')) : null;
    const sA = ismooth(0.645, 0.67, p), rA = ismooth(0.77, 0.79, p), hand = ismooth(0.93, 0.97, p);
    if (TT && sA > 0.002){
      const kk = Math.round(s*TT.nA);
      if (W.k !== kk){ W.k = kk; const c = W.sinoP.ctx; c.fillStyle = '#0a1016'; c.fillRect(0, 0, 256, 256); if (kk > 0) c.drawImage(TT.sinoCv, 0, 0, 128, kk, 0, 0, 256, 256*kk/TT.nA); if (kk < TT.nA){ c.fillStyle = 'rgba(95,141,255,.95)'; c.fillRect(0, 256*kk/TT.nA, 256, 2); } W.sinoP.dirty(); }
      const kr = Math.round(ismooth(0.78, 0.9, p)*TT.nA);
      if (W.kr !== kr){ W.kr = kr; withEnv(()=>tomoTo(TT, kr)); const f = Float32Array.from(TT.accF, v=>Math.max(0, v)); W.recCv = bufCanvas(f, TT.n, CM.spect, kr ? undefined : 1); W.hk = -1; }
      const hk = Math.round(ismooth(0.9, 0.94, p)*30);
      if (W.hk !== hk){ W.hk = hk; const c = W.recP.ctx; c.globalAlpha = 1; c.fillStyle = '#000'; c.fillRect(0, 0, 256, 256); c.drawImage(W.recCv, 0, 0, 256, 256); const fin = hk ? scanCanvas('hmpao', 'normal') : null; if (fin){ c.globalAlpha = hk/30; c.drawImage(fin, 0, 0, 256, 256); c.globalAlpha = 1; } W.recP.dirty(); }
      if (rA < 0.002){ const land = camO.aspect >= 1.05; PN.place(W.sinoP, camO, land ? 0.3 : 0, land ? 0.06 : 0.18, land ? 0.46 : 0.5*Math.min(1, camO.aspect*1.4)); W.sinoP.show(sA); W.recP.show(0); }
      else PN.pair(W.sinoP, W.recP, camO, hand, sA, rA);
    } else { W.sinoP.show(0); W.recP.show(0); }
  };
  W.labels = p => {
    const a = iwin(p, 0.465, 0.48, 0.55, 0.57), b = iwin(p, 0.34, 0.36, 0.4, 0.42), c = iwin(p, 0.15, 0.17, 0.23, 0.25), d = iwin(p, 0.52, 0.53, 0.6, 0.615);
    const L = v => ins.localToWorld(v.clone());
    return [
      {pos:L(new T.Vector3(-6.8, 1.5, 3)), text:'Colimador de plomo · orificios hexagonales', a, left:true},
      {pos:L(new T.Vector3(7.2, 3.5, 2)), text:'Cristal de yoduro de sodio', a},
      {pos:L(new T.Vector3(5.6, 6.5, 1.7)), text:'Tubos fotomultiplicadores', a},
      {pos:W.top.getWorldPosition(new T.Vector3()), text:'Cabezal de cámara gamma', a:b},
      {pos:W.P.table.localToWorld(new T.Vector3(0, 22, 14)), text:'⁹⁹ᵐTc-HMPAO atrapado por el flujo sanguíneo', a:c, left:true},
      {pos:L(new T.Vector3(0, -8, 0)), text:`${W.counts.pass} de ${W.counts.em} fotones contados`, a:d},
    ];
  };
  immLinearize(scene);
  return W;
}


// motor-task activation painted on the cortex (same blobs as the viewer's finger-tapping state)
const ACT_OVERLAY = () => ({key:'act', uniforms:{uAct:{value:STATES.motor.act.map(a=>new THREE.Vector4(a.c[0], a.c[1], a.c[2], a.s))}, uActA:{value:STATES.motor.act.map(a=>a.a)}, uBold:{value:0}},
  decl:'uniform vec4 uAct[5]; uniform float uActA[5]; uniform float uBold;' + GLSL_RAMPS,
  code:`float aF = 0.0; for (int i = 0; i < 5; i++){ vec3 dd = vMni - uAct[i].xyz; aF += uActA[i]*exp(-dot(dd, dd)/(2.0*uAct[i].w*uAct[i].w)); }
    aF *= uBold; vec3 aC = iAct(aF); float aM = smoothstep(0.24, 0.36, aF)*0.92; diffuseColor.rgb = mix(diffuseColor.rgb, aC, aM);`,
  emit:`totalEmissiveRadiance += aC*aM*0.4;`});

/* =====================================================================
   fMRI walkthrough
     0.00 the same magnet · 0.11 task on a screen · 0.235 the mirror · 0.355 motor cortex
     0.47 neurons fire · 0.57 blood rushes in · 0.67 deoxyhaemoglobin washed out
     0.76 the BOLD signal · 0.86 a volume every 2 s · 0.945 the map
   ===================================================================== */
function buildFMRI(scene, renderer, R){
  const T = THREE, W = {}, M = immScanMats(), SIG = 0x0050ff;
  const S = immStudio(scene, renderer);
  /* ---------- magnet (the MRI film's shape, without the cutaway) ---------- */
  const mag = new T.Group(); scene.add(mag);
  const body = ishadow(new T.Mesh(new T.ExtrudeGeometry(iring(232, 236, 58, 64), {depth:128, bevelEnabled:true, bevelThickness:6, bevelSize:6, bevelSegments:8, curveSegments:72}), M.shell)); body.geometry.translate(0, 0, -64); mag.add(body);
  const seam = new T.MeshStandardMaterial({color:0x3a454b, roughness:0.6, transparent:true});
  for (const z of [-71.5, 71.5]){ const s = new T.Mesh(new T.ExtrudeGeometry(iring(226, 230, 55, 62), {depth:3, bevelEnabled:false, curveSegments:64}), seam); s.position.z = z - 1.5; mag.add(s); }
  const coverGeo = new T.ExtrudeGeometry(iring(238, 242, 60, 57), {depth:16, bevelEnabled:true, bevelThickness:5, bevelSize:5, bevelSegments:10, curveSegments:80});
  for (const side of [1, -1]){ const g = new T.Group(); g.position.z = 77*side; mag.add(g);
    const c = ishadow(new T.Mesh(coverGeo, M.shell)); c.position.z = side > 0 ? 0 : -16; g.add(c);
    const f = new T.Mesh(iflare(36.5, 57.5, 28), M.shell); f.scale.z = side; f.position.z = side > 0 ? 21 : -21; g.add(f);
    const trim = new T.Mesh(new T.TorusGeometry(60, 2.4, 24, 160), M.trim); trim.position.z = side > 0 ? 21.5 : -21.5; g.add(trim);
    if (side > 0){ W.ringMat = new T.MeshStandardMaterial({color:SIG, emissive:SIG, emissiveIntensity:1.4, roughness:0.4, transparent:true}); const ring = new T.Mesh(new T.TorusGeometry(64.5, 0.75, 12, 200), W.ringMat); ring.position.z = 21.6; g.add(ring);
      W.scr = iscreen(['CABEZA PRIMERO · SUPINO', 'Tarea motora · bloques de 15 s', 'EPI BOLD  TR 2000'], 26, 16.25, 0.3); W.scr.position.set(-86, 58, 21.4); W.scr.rotation.y = 0.18; g.add(W.scr);
      W.plate = iplate('N E U R O · 3 T'); W.plate.position.set(0, 96, 21.6); g.add(W.plate); } }
  const plinth = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(212, 150, 14), {depth:16, bevelEnabled:true, bevelThickness:2, bevelSize:2, bevelSegments:3}), M.plinth)); plinth.rotation.x = -Math.PI/2; plinth.position.set(0, S.FLOOR, 75); scene.add(plinth);
  const liner = new T.Mesh(new T.CylinderGeometry(36.5, 36.5, 176, 128, 1, true), M.liner); liner.rotation.x = Math.PI/2; mag.add(liner);
  S.blob(0, 10, 330, 300);
  /* ---------- the task: a screen behind the magnet, a projector, a mirror on the head coil ---------- */
  W.taskCv = document.createElement('canvas'); W.taskCv.width = 512; W.taskCv.height = 384; W.taskTex = new T.CanvasTexture(W.taskCv); W.taskTex.encoding = T.sRGBEncoding;
  const screen = new T.Mesh(new T.PlaneGeometry(48, 36), new T.MeshBasicMaterial({map:W.taskTex, toneMapped:false})); screen.position.set(0, 6, -132); scene.add(screen); W.screen = screen;
  const frame = new T.Mesh(new T.BoxGeometry(52, 40, 1.5), M.dark); frame.position.set(0, 6, -133.2); scene.add(frame);
  const stand = new T.Mesh(new T.CylinderGeometry(1.6, 1.6, 6 - 20 - S.FLOOR, 16), M.steel); stand.position.set(0, (S.FLOOR + 6 - 20)/2, -134); scene.add(stand);
  const proj = new T.Group(); proj.position.set(0, 18, -300); scene.add(proj);
  proj.add(ishadow(new T.Mesh(new T.BoxGeometry(40, 16, 34), M.trim)));
  const lens = new T.Mesh(new T.CylinderGeometry(4, 4.4, 4, 24), M.dark); lens.rotation.x = Math.PI/2; lens.position.set(0, 0, 18.5); proj.add(lens);
  const pstand = new T.Mesh(new T.CylinderGeometry(2, 2, 18 - S.FLOOR - 8, 16), M.steel); pstand.position.set(0, (S.FLOOR - 8 + 18)/2 - 18, 0); proj.add(pstand);
  const beamG = new T.BufferGeometry(); const apex = [0, 18, -279.5], cs = [[-24, -12], [24, -12], [24, 24], [-24, 24]].map(([x, y])=>[x, 6 + y*0.0 + (y < 0 ? -18 : 18), -133.5]);
  beamG.setAttribute('position', new T.Float32BufferAttribute([...apex, ...cs[0], ...cs[1], ...apex, ...cs[1], ...cs[2], ...apex, ...cs[2], ...cs[3], ...apex, ...cs[3], ...cs[0]], 3));
  W.beam = new T.Mesh(beamG, new T.MeshBasicMaterial({color:0xdfe9ff, transparent:true, opacity:0.12, depthWrite:false, side:T.DoubleSide, blending:T.AdditiveBlending})); scene.add(W.beam);
  /* ---------- patient, head coil with mirror ---------- */
  W.P = immTable(scene);
  const hcMat = new T.MeshPhysicalMaterial({color:0xf8f9fa, roughness:0.28, clearcoat:0.7, transparent:true, side:T.DoubleSide}); W.hcMat = hcMat;
  const hc = new T.Group(); hc.position.set(0, 19, 16); W.P.table.add(hc); W.hc = hc;
  const cradle = ishadow(new T.Mesh(new T.CylinderGeometry(15.5, 15.5, 32, 64, 1, true, -Math.PI*0.5, Math.PI), hcMat)); cradle.rotation.x = Math.PI/2; hc.add(cradle);
  for (const z of [-15, -5, 5, 15]){ const r = new T.Mesh(new T.TorusGeometry(15.5, 1.1, 10, 64, Math.PI), hcMat); r.position.z = z; hc.add(r); }
  for (const a of [0.25, 0.5, 0.75].map(f=>f*Math.PI)){ const b = new T.Mesh(new T.BoxGeometry(2.2, 2.2, 32), hcMat); b.position.set(15.5*Math.cos(a), 15.5*Math.sin(a), 0); hc.add(b); }
  const mtex = W.taskTex.clone(); mtex.needsUpdate = true; mtex.wrapS = T.RepeatWrapping; mtex.repeat.x = -1; mtex.offset.x = 1; W.mtex = mtex;
  W.mirror = new T.Mesh(new T.PlaneGeometry(10, 6), new T.MeshBasicMaterial({map:mtex, toneMapped:false, transparent:true})); W.mirror.position.set(0, 17.5, 4); W.mirror.rotation.x = -Math.PI/2 + 0.6; hc.add(W.mirror);
  const mframe = new T.Mesh(new T.BoxGeometry(11, 7, 0.6), hcMat); mframe.position.set(0, 17.5, 4); mframe.rotation.x = -Math.PI/2 + 0.6; mframe.translateZ(-0.35); hc.add(mframe);
  const btn = new T.Mesh(new T.BoxGeometry(5, 3, 9), new T.MeshStandardMaterial({color:0x2c363c, roughness:0.4})); W.P.man.j.wristR.add(btn); btn.position.set(0, -8, 1.5);
  /* ---------- brain with activation, and a scalp ---------- */
  W.ov = ACT_OVERLAY(); W.brain = immBrain(W.P.mni, {overlay:W.ov, order:2});
  const skin = new T.MeshPhysicalMaterial({color:0xc9d6de, roughness:0.35, clearcoat:0.4, transparent:true, opacity:0, depthWrite:false});
  W.scalp = immScalp(W.P.mni, skin, {order:4});
  /* ---------- neurovascular unit, magnified, floating just outside the hand knob ---------- */
  W.P.table.position.set(0, -22, -16); scene.updateMatrixWorld(true);
  const knob = W.P.mni.localToWorld(new T.Vector3(-38, -22, 58)), knobIn = W.P.mni.localToWorld(new T.Vector3(-28, -20, 40));
  const N = knob.clone().sub(knobIn).normalize(), U = new T.Vector3(0, 1, 0).sub(N.clone().multiplyScalar(N.y)).normalize(), V = new T.Vector3().crossVectors(U, N).normalize();
  const C = knob.clone().addScaledVector(N, 13);
  const nvu = new T.Group(); nvu.position.copy(C); nvu.rotation.set(0, Math.PI/2, 0); scene.add(nvu); W.nvu = nvu; nvu.visible = false;
  // local: x along the vessel, y = out of the brain, z across
  const slabMat = new T.MeshPhysicalMaterial({color:0xe8d6d0, roughness:0.6, transparent:true, opacity:0.35, depthWrite:false});
  const slabM = new T.Mesh(new T.BoxGeometry(10, 4, 6), slabMat); slabM.position.y = -2; nvu.add(slabM);
  const surf = new T.Mesh(new T.PlaneGeometry(10, 6), new T.MeshStandardMaterial({color:0xd9b6ae, roughness:0.7, transparent:true, opacity:0.5, side:T.DoubleSide, depthWrite:false})); surf.rotation.x = -Math.PI/2; nvu.add(surf);
  W.vesMat = new T.MeshPhysicalMaterial({color:0xd9412b, roughness:0.25, transparent:true, opacity:0.32, depthWrite:false, side:T.DoubleSide});
  W.vessel = new T.Mesh(new T.CylinderGeometry(1, 1, 10.4, 40, 1, true), W.vesMat); W.vessel.rotation.z = Math.PI/2; W.vessel.position.y = 0.7; nvu.add(W.vessel);
  const capMat = new T.MeshStandardMaterial({color:0xc4513e, roughness:0.4, transparent:true, opacity:0.8});
  for (let i = 0; i < 4; i++){ const x = -3.6 + i*2.4, pts = [new T.Vector3(x, 0.5, 0), new T.Vector3(x + 0.4, -1, 0.8*(i % 2 ? 1 : -1)), new T.Vector3(x - 0.2, -2.6, 0.2), new T.Vector3(x + 0.6, -3.6, -0.6)];
    nvu.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, 0.09, 6), capMat)); }
  W.neur = []; const nMat = () => new T.MeshStandardMaterial({color:0x8fa0a8, roughness:0.5, emissive:0x2f6bff, emissiveIntensity:0, transparent:true});
  for (let i = 0; i < 5; i++){ const g = new T.Group(); g.position.set(-3.8 + i*1.9, -3.1, (i % 2 ? 1.6 : -1.6)); nvu.add(g); const m = nMat();
    const soma = new T.Mesh(new T.ConeGeometry(0.32, 0.8, 16), m); g.add(soma);
    const ap = new T.Mesh(new T.CylinderGeometry(0.06, 0.1, 2.5, 8), m); ap.position.y = 1.6; g.add(ap);
    for (const s of [-1, 1]){ const bd = new T.Mesh(new T.CylinderGeometry(0.04, 0.06, 0.8, 6), m); bd.position.set(s*0.35, -0.55, 0); bd.rotation.z = s*0.9; g.add(bd); }
    W.neur.push({g, m, ph:i*0.37}); }
  W.NC = 34; W.cells = new T.InstancedMesh(new T.SphereGeometry(0.22, 14, 10), new T.MeshStandardMaterial({color:0xffffff, roughness:0.4}), W.NC); nvu.add(W.cells);
  W.cellD = Array.from({length:W.NC}, (_, i)=>({x:-5 + 10*i/W.NC, r:hashf(i*3.1)*0.6, a:hashf(i*7.7)*Math.PI*2, d:hashf(i*1.9)}));
  const ringTex = immCanvasTex(64, 64, (x, w)=>{ x.strokeStyle = 'rgba(107,42,79,.9)'; x.lineWidth = 3; x.setLineDash([4, 4]); x.beginPath(); x.arc(w/2, w/2, w*0.4, 0, Math.PI*2); x.stroke(); });
  W.halos = []; for (let i = 0; i < W.NC; i++){ const s = new T.Sprite(new T.SpriteMaterial({map:ringTex, transparent:true, opacity:0, depthWrite:false})); s.scale.setScalar(1.1); nvu.add(s); W.halos.push(s); }
  /* ---------- EPI slices sweeping through the head ---------- */
  W.slabs = []; for (let i = 0; i < 7; i++){ const m = new T.Mesh(new T.BoxGeometry(19, 22, 0.32), new T.MeshBasicMaterial({color:0x2f6bff, transparent:true, opacity:0, depthWrite:false})); m.renderOrder = 6; scene.add(m); W.slabs.push(m); }
  W.headC = W.P.mni.localToWorld(new T.Vector3(0, -18, 12));
  /* ---------- panels ---------- */
  const PN = immPanels(scene); W.boldP = PN.make('SEÑAL BOLD · ÁREA DE LA MANO IZQUIERDA', 512, 256); W.mapP = PN.make('MAPA Z SOBRE ANATOMÍA'); W.mapP.keepLab = true;
  // camera: computed around the magnified unit
  const k = (v) => [v.x, v.y, v.z], vS = C.clone().add(new T.Vector3(16, 3.5, 0)), vT = C.clone().add(new T.Vector3(0, -1, 0));
  const above = W.headC.clone().add(new T.Vector3(8, 16, -30)), beyond = W.headC.clone().addScaledVector(N, 34).add(new T.Vector3(0, 6, 0));
  const cam = immCamPath(R, [
    [0.00, [-480, 130, 560], [0, -10, 0]],
    [0.10, [-60, 34, 430], [0, 4, -110]],
    [0.20, [-26, 30, 250], [0, 6, -130]],
    [0.28, [0, 26, 70], [0, 12, -2]],
    [0.34, [0, 22, 32], [0, 14.5, 4]],
    [0.40, k(above), k(W.headC.clone().add(new T.Vector3(2, 0, -5)))],
    [0.46, k(beyond), k(knob)],
    [0.53, k(vS), k(vT)],
    [0.66, k(C.clone().add(new T.Vector3(14, 6, -4))), k(vT)],
    [0.74, k(C.clone().add(new T.Vector3(15, 2, 3))), k(vT)],
    [0.82, k(W.headC.clone().add(new T.Vector3(34, 22, -46))), k(W.headC)],
    [0.90, k(W.headC.clone().add(new T.Vector3(48, 12, -8))), k(W.headC)],
    [1.00, k(W.headC.clone().add(new T.Vector3(30, 20, -40))), k(W.headC.clone().add(new T.Vector3(0, 0, -3)))],
  ], {drift:0.08});
  W.drawTask = (on, t) => { const c = W.taskCv.getContext('2d'), w = 512, h = 384; c.fillStyle = '#0a0d10'; c.fillRect(0, 0, w, h);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (on){ c.fillStyle = '#ffffff'; c.font = '600 64px Archivo, Arial, sans-serif'; c.fillText('GOLPEE', w/2, h/2 - 34); c.font = '400 26px Archivo, Arial, sans-serif'; c.fillStyle = '#9fb6ff'; c.fillText('dedos derechos, a tiempo', w/2, h/2 + 30);
      const b = (Math.floor(t*3) % 2) ? 1 : 0.35; c.fillStyle = `rgba(95,141,255,${b})`; c.beginPath(); c.arc(w/2, h/2 + 92, 14, 0, Math.PI*2); c.fill(); }
    else { c.fillStyle = '#c8d4da'; c.font = '300 90px Archivo, Arial, sans-serif'; c.fillText('+', w/2, h/2 - 6); c.font = '400 24px Archivo, Arial, sans-serif'; c.fillStyle = '#76858c'; c.fillText('reposo', w/2, h/2 + 70); }
    W.taskTex.needsUpdate = true; W.mtex.needsUpdate = true; };
  const m4 = new T.Matrix4(), q0 = new T.Quaternion(), sc = new T.Vector3(1, 0.42, 1), col = new T.Color(), oxy = new T.Color(0xd9412b).convertSRGBToLinear(), deo = new T.Color(0x6b2a4f).convertSRGBToLinear();
  W.update = (p, t, dt) => {
    const P = W.P; W.brain.build(); W.scalp.build();
    cam(p, t, ilerp(34, 46, ismooth(0.28, 0.36, p)), p < 0.26 ? 6 : 0.3);
    R.saoOn = false;
    P.table.position.set(0, -22, ilerp(205, -16, ismooth(0.1, 0.24, p)));
    // task blocks, 15 s on / 15 s off (shown 3× faster)
    const tau = t*3, on = (tau % 30) < 15;
    const tk = (on ? 1 : 0) + Math.floor(t*3)*2; if (W.tk !== tk){ W.tk = tk; W.drawTask(on, t); }
    // inside: the magnet turns to glass, coil fades, brain appears
    const inside = ismooth(0.355, 0.4, p), deep = ismooth(0.36, 0.42, p);
    for (const m of [M.shell, M.liner, M.trim]) ifade(m, 1 - deep, 0.05); seam.opacity = 1 - deep; W.ringMat.opacity = 1 - 0.9*deep; W.scr.visible = W.plate.visible = deep < 0.5;
    P.fadeBody(ismooth(0.3, 0.37, p)); P.fadeTable(0.75*inside);
    const hcA = 1 - ismooth(0.34, 0.39, p); hcMat.opacity = hcA; hcMat.depthWrite = hcA > 0.98; W.hc.visible = hcA > 0.02; W.mirror.material.opacity = hcA;
    skin.opacity = 0.16*inside; if (W.scalp.mesh) W.scalp.mesh.visible = skin.opacity > 0.005;
    const nvA = iwin(p, 0.46, 0.5, 0.745, 0.77);
    W.brain.set(inside*(1 - 0.7*nvA));
    // activation follows the task during "into the motor cortex", then the statistical map holds still
    const live = boldAt(tau), mapHold = ismooth(0.93, 0.96, p);
    W.ov.uniforms.uBold.value = inside*(ilerp(0.25 + 0.85*live, 1.0, mapHold));
    // neurons fire during the task, vessel widens, oxygenated blood washes out deoxyhaemoglobin
    nvu.visible = nvA > 0.01;
    nvu.traverse(o=>{ if (o.material && o.material.transparent && o !== W.vessel){ o.material.opacity = (o.material.userData.b ?? (o.material.userData.b = o.material.opacity))*nvA; } });
    W.vesMat.opacity = 0.32*nvA;
    const fire = ismooth(0.48, 0.52, p), dil = ismooth(0.57, 0.64, p), wash = ismooth(0.6, 0.7, p);
    W.neur.forEach(n=>{ const r = ilerp(0.6, 6, fire), ph = (t*r + n.ph) % 1; n.m.emissiveIntensity = (ph < 0.18 ? 1.6*(1 - ph/0.18) : 0)*nvA; });
    const R0 = ilerp(0.75, 1.1, dil); W.vessel.scale.set(R0, 1, R0);
    const speed = ilerp(0.8, 2.4, dil), fDeoxy = ilerp(0.55, 0.12, wash);
    W.cellD.forEach((c, i)=>{ c.x += speed*dt*(0.9 + 0.2*hashf(i)); if (c.x > 5) { c.x -= 10; c.d = hashf(i*13.3 + t); }
      const rr = c.r*R0*0.8, y = 0.7 + rr*Math.sin(c.a), z = rr*Math.cos(c.a); q0.setFromAxisAngle(new T.Vector3(0, 0, 1), c.x*0.6 + i);
      m4.compose(new T.Vector3(c.x, y, z), q0, sc); W.cells.setMatrixAt(i, m4); const de = c.d < fDeoxy; W.cells.setColorAt(i, col.copy(de ? deo : oxy));
      const h = W.halos[i]; h.position.set(c.x, y, z); h.material.opacity = de ? 0.75*nvA*iwin(p, 0.66, 0.69, 0.76, 0.78) : 0; h.visible = h.material.opacity > 0.01; });
    W.cells.instanceMatrix.needsUpdate = true; if (W.cells.instanceColor) W.cells.instanceColor.needsUpdate = true;
    W.cells.material.opacity = nvA; W.cells.material.transparent = nvA < 0.99; W.cells.visible = nvA > 0.01;
    // EPI: slices acquired one after another through the head
    const epi = iwin(p, 0.855, 0.87, 0.93, 0.95);
    W.slabs.forEach((s, i)=>{ const idx = (Math.floor(t*14) - i), z = ((idx % 30) + 30) % 30; s.position.copy(W.headC); s.position.z += -9 + z*0.62; s.material.opacity = epi*(i ? 0.32*(1 - i/7) : 0.55); s.visible = epi > 0.01; });
    // panels
    const camO = R.camera, bA = iwin(p, 0.765, 0.79, 0.85, 0.87);
    if (bA > 0.002){ const c = W.boldP.ctx, w = 512, h = 256, win = 60, t1 = tau, t0 = t1 - win, X = s => (s - t0)/win*w;
      c.fillStyle = '#0a1016'; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(0,80,255,0.22)'; for (let b = Math.floor(t0/30)*30; b < t1; b += 30){ const a0 = Math.max(b, t0), z0 = Math.min(b + 15, t1); if (z0 > a0) c.fillRect(X(a0), 0, X(z0) - X(a0), h); }
      c.strokeStyle = 'rgba(200,212,218,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, h - 30); c.lineTo(w, h - 30); c.stroke();
      c.strokeStyle = '#7fa6ff'; c.lineWidth = 4; c.beginPath(); for (let i = 0; i <= 200; i++){ const s = t0 + win*i/200, y = h - 30 - boldAt(s)*(h - 70); i ? c.lineTo(X(s), y) : c.moveTo(X(s), y); } c.stroke();
      c.fillStyle = '#c8d4da'; c.font = '20px monospace'; c.fillText('tap', 8, 24); c.fillText('+2 %', w - 64, 24); c.fillText('60 s', 8, h - 6); W.boldP.dirty();
      const land = camO.aspect >= 1.05; PN.place(W.boldP, camO, land ? 0.22 : 0, land ? 0.18 : 0.25, land ? 0.62 : 0.62*camO.aspect*1.3); }
    W.boldP.show(bA);
    const mA = ismooth(0.945, 0.97, p);
    if (mA > 0.002){ if (!W.mapDrawn){ const cv = scanCanvas('bold', 'motor'); if (cv){ W.mapP.ctx.drawImage(cv, 0, 0, 256, 256); W.mapP.dirty(); W.mapDrawn = true; } }
      const land = camO.aspect >= 1.05; PN.place(W.mapP, camO, land ? Math.min(0.44, camO.aspect/2 - 0.3) : 0, land ? 0.03 : 0.2, land ? 0.52 : 0.6*Math.min(1, camO.aspect*1.4)); }
    W.mapP.show(mA);
  };
  W.labels = p => {
    const a = iwin(p, 0.12, 0.14, 0.2, 0.22), b = iwin(p, 0.29, 0.31, 0.34, 0.35), c = iwin(p, 0.4, 0.42, 0.455, 0.47), d = iwin(p, 0.5, 0.52, 0.56, 0.575), e = iwin(p, 0.58, 0.6, 0.66, 0.675), f = iwin(p, 0.68, 0.7, 0.75, 0.765);
    const L = v => nvu.localToWorld(v.clone());
    return [
      {pos:new T.Vector3(-24, 24, -132), text:'Pantalla detrás del imán', a, left:true},
      {pos:W.P.table.localToWorld(new T.Vector3(0, 36.5, 20)), text:'Espejo en la bobina de cabeza', a:b},
      {pos:W.P.mni.localToWorld(new T.Vector3(-38, -22, 58)), text:'Corteza motora izquierda: área de la mano', a:c},
      {pos:L(new T.Vector3(-3.8, -3.1, -1.6)), text:'Neuronas piramidales descargando', a:d, left:true},
      {pos:L(new T.Vector3(3.5, 1.6, 0)), text:'La arteriola se dilata, el flujo aumenta', a:e},
      {pos:L(new T.Vector3(-2, 1.8, 0)), text:'La desoxihemoglobina distorsiona el campo', a:f, left:true},
    ];
  };
  immLinearize(scene);
  return W;
}


// scalp potential (EEG) painted on the cap, plus a knitted-net look from a 3D grid
const EEG_CAP_OVERLAY = () => ({key:'eegcap', scale:'1.0', uniforms:{uSrc:{value:Array.from({length:6}, ()=>new THREE.Vector4(0, 0, 0, 40))}, uSrcA:{value:new Array(6).fill(0)}, uMap:{value:0}},
  decl:'uniform vec4 uSrc[6]; uniform float uSrcA[6]; uniform float uMap;' + GLSL_RAMPS,
  code:`float vE = 0.0; for (int i = 0; i < 6; i++){ vec3 dd = vMni - uSrc[i].xyz; vE += uSrcA[i]*exp(-dot(dd, dd)/(2.0*uSrc[i].w*uSrc[i].w)); }
    vec3 gq = abs(fract(vMni/8.0) - 0.5); float net = smoothstep(0.42, 0.5, max(gq.x, max(gq.y, gq.z)));
    vec3 mapC = iRdBu(vE); float iso = abs(fract(vE*5.0 + 0.5) - 0.5); float isoL = 1.0 - smoothstep(0.0, fwidth(vE*5.0)*1.4 + 1e-4, iso);
    diffuseColor.rgb = mix(diffuseColor.rgb*(1.0 - 0.3*net), mix(mapC, mapC*0.6, isoL*0.6), uMap);`});
// a glowing generator on the cortex (EEG and MEG)
const SRC_OVERLAY = (key) => ({key, uniforms:{uGen:{value:new THREE.Vector4(0, -92, 10, 14)}, uGenA:{value:0}, uGen2:{value:new THREE.Vector4(0, -92, 10, 14)}, uGen2A:{value:0}},
  decl:'uniform vec4 uGen, uGen2; uniform float uGenA, uGen2A;' + GLSL_RAMPS,
  code:`vec3 g1 = vMni - uGen.xyz, g2 = vMni - uGen2.xyz; float gv = uGenA*exp(-dot(g1, g1)/(2.0*uGen.w*uGen.w)) + uGen2A*exp(-dot(g2, g2)/(2.0*uGen2.w*uGen2.w));
    vec3 gC = mix(vec3(0.18,0.42,1.0), vec3(0.6,0.85,1.0), clamp(abs(gv) - 0.6, 0.0, 1.0)); float gM = clamp(abs(gv), 0.0, 1.0); diffuseColor.rgb = mix(diffuseColor.rgb, gC, gM*0.85);`,
  emit:`totalEmissiveRadiance += gC*gM*0.6;`});
function iarrow(T, len, r, color, o = {}){
  const g = new T.Group(), m = new T.MeshStandardMaterial({color, emissive:color, emissiveIntensity:o.glow ?? 0.5, roughness:0.4, transparent:true});
  const sh = new T.Mesh(new T.CylinderGeometry(r, r, len*0.72, 16), m); sh.position.y = len*0.36; g.add(sh);
  const hd = new T.Mesh(new T.ConeGeometry(r*2.6, len*0.28, 20), m); hd.position.y = len*0.86; g.add(hd);
  g.userData.mat = m; return g;
}

/* =====================================================================
   EEG walkthrough
     0.00 no scanner · 0.12 the 10–20 cap · 0.26 a core sample under C3 · 0.39 pyramidal cells in step
     0.53 millions together · 0.67 the skull smears it · 0.80 amplify the difference · 0.92 the trace
   ===================================================================== */
function buildEEG(scene, renderer, R){
  const T = THREE, W = {}, M = immScanMats();
  const S = immStudio(scene, renderer, {floor:0, shadow:220, target:[0, 60, 0]});
  /* ---------- a seated volunteer in a chair, real head, cap ---------- */
  const chairMat = new T.MeshPhysicalMaterial({color:0xe9eef0, roughness:0.35, clearcoat:0.5});
  scene.add(ichair(T, chairMat)); S.blob(0, 6, 120, 130);
  W.man = buildMannequin(T, {shadows:true}); poseSeated(W.man); scene.add(W.man.group);
  W.F = immSeatedHead(W.man);
  W.headMat = W.man.mat.clone(); W.headMat.userData.linear = true; W.headMat.side = T.FrontSide;
  W.scalp = immScalp(W.F, W.headMat, {order:1, shadow:true});
  W.capOv = EEG_CAP_OVERLAY();
  W.capMat = new T.MeshStandardMaterial({color:0x2a3d66, roughness:0.85, metalness:0, transparent:true, opacity:1}); immOverlay(W.capMat, W.capOv);
  W.cap = immScalp(W.F, W.capMat, {keep:icapKeep(-6, 0.12), offset:1.6, order:3});
  W.genOv = SRC_OVERLAY('eeggen'); W.brain = immBrain(W.F, {overlay:W.genOv, order:2});
  /* ---------- amplifier and monitor on a side table ---------- */
  const side = new T.Group(); side.position.set(78, 0, -10); side.rotation.y = -0.5; scene.add(side); W.side = side;
  const tTop = ishadow(new T.Mesh(new T.BoxGeometry(70, 3, 46), chairMat)); tTop.position.y = 72; side.add(tTop);
  for (const [x, z] of [[-31, -19], [31, -19], [-31, 19], [31, 19]]){ const l = ishadow(new T.Mesh(new T.CylinderGeometry(1.4, 1.4, 70, 12), M.steel)); l.position.set(x, 35, z); side.add(l); }
  W.amp = ishadow(new T.Mesh(new T.BoxGeometry(22, 7, 16), M.dark)); W.amp.position.set(-18, 77.5, 6); side.add(W.amp);
  W.leds = []; for (let i = 0; i < 8; i++){ const l = new T.Mesh(new T.BoxGeometry(1.2, 0.8, 0.4), new T.MeshStandardMaterial({color:0x2f6bff, emissive:0x2f6bff, emissiveIntensity:0.8})); l.position.set(-25 + i*2, 78, 14.2); side.add(l); W.leds.push(l); }
  W.monCv = document.createElement('canvas'); W.monCv.width = 640; W.monCv.height = 400; W.monTex = new T.CanvasTexture(W.monCv); W.monTex.encoding = T.sRGBEncoding;
  const mon = new T.Group(); mon.position.set(12, 74, -4); side.add(mon); W.mon = mon;
  const scrM = new T.Mesh(new T.PlaneGeometry(44, 27.5), new T.MeshBasicMaterial({map:W.monTex, toneMapped:false})); scrM.position.set(0, 22, 0.8); mon.add(scrM);
  mon.add(ishadow(new T.Mesh(new T.BoxGeometry(46, 29.5, 1.4), M.dark))); mon.children[1].position.set(0, 22, 0);
  const neck = new T.Mesh(new T.BoxGeometry(4, 8, 2), M.steel); neck.position.set(0, 4, -1); mon.add(neck);
  W.monScr = scrM;
  /* ---------- a core sample through the head under C3, magnified ---------- */
  const core = new T.Group(); W.core = core; core.visible = false; W.F.add(core);
  const lay = (y0, y1, mat, r = 9) => { const m = new T.Mesh(new T.CylinderGeometry(r, r, y0 - y1, 48), mat); m.position.y = (y0 + y1)/2; core.add(m); return m; };
  const LM = c => new T.MeshPhysicalMaterial({color:c, roughness:0.5, transparent:true});
  lay(6, 2.2, new T.MeshStandardMaterial({color:0xdfe6ea, roughness:0.25, metalness:0.6, transparent:true}), 6.5);
  W.gel = lay(2.2, 0, new T.MeshPhysicalMaterial({color:0x7fd4ff, roughness:0.05, transparent:true, opacity:0.6}), 7);
  lay(0, -6, LM(0xe9cfc0)); const boneTex = immCanvasTex(128, 128, (x, w)=>{ x.fillStyle = '#efe6d2'; x.fillRect(0, 0, w, w); x.fillStyle = '#d9cba9'; for (let i = 0; i < 90; i++){ x.beginPath(); x.arc(Math.random()*w, 30 + Math.random()*68, 2 + Math.random()*4, 0, 7); x.fill(); } });
  const bm = LM(0xffffff); bm.map = boneTex; lay(-6, -13, bm);
  lay(-13, -16, new T.MeshPhysicalMaterial({color:0xbfe0ff, roughness:0.1, transparent:true, opacity:0.5}));
  W.gm = lay(-16, -23, new T.MeshPhysicalMaterial({color:0xd9b8b0, roughness:0.6, transparent:true, opacity:0.4, depthWrite:false}));
  lay(-23, -31, LM(0xf3ece4));
  W.cells = []; const nm = new T.MeshStandardMaterial({color:0x6f7f88, roughness:0.45, emissive:0x2f6bff, emissiveIntensity:0, transparent:true});
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++){ const g = new T.Group(); g.position.set(i*4.6 + j*0.8, -21.6, j*4.2); core.add(g);
    const so = new T.Mesh(new T.ConeGeometry(0.9, 1.7, 14), nm); g.add(so); const ap = new T.Mesh(new T.CylinderGeometry(0.16, 0.26, 4.6, 8), nm); ap.position.y = 3.1; g.add(ap);
    for (const s of [-1, 1]){ const bd = new T.Mesh(new T.CylinderGeometry(0.1, 0.16, 1.6, 6), nm); bd.position.set(s*0.75, -1.1, 0); bd.rotation.z = s*0.85; g.add(bd); }
    const dots = []; for (let k = 0; k < 3; k++){ const d = new T.Mesh(new T.SphereGeometry(0.28, 10, 8), new T.MeshBasicMaterial({color:0x2f6bff, transparent:true, opacity:0})); g.add(d); dots.push(d); }
    W.cells.push({g, dots, ph:hashf(i*3 + j*7 + 11)}); }
  W.cellMat = nm;
  W.dip = iarrow(T, 9, 0.45, 0x0050ff, {glow:0.8}); W.dip.position.set(6.8, -22.8, 0); core.add(W.dip);
  /* ---------- the generator at the back of the brain (alpha) ---------- */
  W.gen = iarrow(T, 28, 1.2, 0x0050ff, {glow:0.9}); W.F.add(W.gen); W.gen.visible = false;
  W.gen.position.set(0, -86, 12); W.gen.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(0, -1, 0.15).normalize());
  /* ---------- electrodes and wires (built once the brain data has loaded) ---------- */
  W.elec = []; W.lazy = () => {
    if (W.elecBuilt || !META || !META.landmarks) return; W.elecBuilt = true;
    const E = META.landmarks.electrodes, c = new T.Vector3(0, -18, 5), house = new T.MeshPhysicalMaterial({color:0xf4f6f7, roughness:0.3, clearcoat:0.6}), rim = new T.MeshStandardMaterial({color:0x0050ff, emissive:0x0050ff, emissiveIntensity:0.4});
    const back = new T.Vector3(0, -118, -42), wireMats = [0xd9412b, 0xe8962a, 0x1d6a4a, 0x0050ff, 0x3d4c53].map(c=>new T.MeshStandardMaterial({color:c, roughness:0.5}));
    Object.entries(E).forEach(([nm, p], i)=>{ const e = mniV(p), n = e.clone().sub(c).normalize();
      const g = new T.Group(); g.position.copy(e).addScaledVector(n, 2.6); g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), n); W.F.add(g);
      const h = ishadow(new T.Mesh(new T.CylinderGeometry(5.2, 5.8, 4.2, 28), house)); h.position.y = 2.1; g.add(h);
      const r = new T.Mesh(new T.TorusGeometry(5.6, 0.45, 8, 32), rim); r.rotation.x = Math.PI/2; r.position.y = 0.8; g.add(r);
      const pts = [e.clone().addScaledVector(n, 7), e.clone().addScaledVector(n, 22).lerp(back, 0.25), e.clone().addScaledVector(n, 18).lerp(back, 0.7), back];
      const wire = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.75, 5), wireMats[i % 5]); W.F.add(wire);
      W.elec.push({nm, pos:e.clone().addScaledVector(n, 7), g}); });
    // the bundled cable from the back of the head to the amplifier
    W.F.updateMatrixWorld(true); scene.updateMatrixWorld(true);
    const a = W.F.localToWorld(back.clone()), b = W.amp.getWorldPosition(new T.Vector3()).add(new T.Vector3(-4, 0, -8));
    const cable = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([a, a.clone().add(new T.Vector3(4, -26, -10)), new T.Vector3(a.x + 20, 84, a.z - 12), b]), 60, 0.9, 8), new T.MeshStandardMaterial({color:0x2c363c, roughness:0.5}));
    scene.add(cable);
    // core sample placement: C3, along its outward normal
    const e3 = mniV(E.C3); W.n3 = e3.clone().sub(c).normalize(); W.e3 = e3;
    core.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), W.n3);
  };
  /* ---------- panel: the trace ---------- */
  const PN = immPanels(scene); W.trP = PN.make('EEG · 8 CANALES · BIPOLAR', 512, 320); W.trP.keepLab = true;
  W.trace = (ctx, w, h, t, nch, dark) => {
    const ch = [3, 7, 11, 15, 16, 17, 1, 5].slice(0, nch), rows = ch.length, rh = (h - 26)/rows, sc = rh/120, N = 260, win = 4;
    ctx.fillStyle = dark ? '#0a1016' : '#ffffff'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = dark ? 'rgba(95,141,255,.18)' : 'rgba(12,22,27,.07)'; ctx.lineWidth = 1; for (let s = 1; s < 4; s++){ const x = 70 + (w - 70)*s/4; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h - 26); ctx.stroke(); }
    ctx.font = '15px monospace';
    ch.forEach((c, r)=>{ const y0 = rh*(r + 0.5) + 4; ctx.fillStyle = dark ? '#8d9ba1' : '#76858c'; ctx.fillText(MONTAGE[c][0] + '-' + MONTAGE[c][1], 6, y0 + 5);
      ctx.strokeStyle = dark ? (c >= 16 ? '#7fa6ff' : '#c8d4da') : (c >= 16 ? '#0050ff' : '#0c161b'); ctx.lineWidth = 1.6; ctx.beginPath();
      for (let i = 0; i < N; i++){ const tt = t - win + win*i/N, V = eegElectrodes('alpha', tt), v = V[MONTAGE[c][0]] - V[MONTAGE[c][1]], x = 70 + (w - 70)*i/N, y = y0 - v*sc; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); });
    ctx.fillStyle = dark ? '#8d9ba1' : '#76858c'; ctx.fillText('1 s', w - 40, h - 6); ctx.fillText('ojos cerrados · alfa ≈ 10 Hz', 72, h - 6);
  };
  const H = new T.Vector3(0, 122, 1.6);
  const cam = immCamPath(R, [
    [0.00, [-250, 160, 330], [20, 82, 0]],
    [0.10, [-170, 150, 250], [16, 96, 0]],
    [0.17, [-46, 178, 70], [0, 122, 0]],
    [0.24, [26, 176, -46], [0, 122, 0]],
    [0.30, [-6, 148, 50], [10, 132, 2]],
    [0.37, [2, 138, 24], [10.8, 133.4, 2]],
    [0.44, [8, 135, 19], [9.4, 132.1, 2]],
    [0.51, [7, 134, 17], [9.4, 132.1, 2]],
    [0.58, [-26, 134, -46], [0, 121, -4]],
    [0.64, [-34, 140, -42], [0, 122, -3]],
    [0.74, [-40, 166, -50], [0, 124, -2]],
    [0.84, [10, 116, 72], [72, 88, -10]],
    [1.00, [20, 112, 62], [75, 92, -9]],
  ], {drift:0.08});
  W.update = (p, t, dt) => {
    W.scalp.build(); W.cap.build(); W.brain.build(); W.lazy();
    cam(p, t, ilerp(34, 40, ismooth(0.3, 0.4, p)), p < 0.3 ? 6 : 0.5);
    R.saoOn = false;
    // the core pops out of the head under C3 and grows
    const pop = ismooth(0.27, 0.34, p)*(1 - ismooth(0.52, 0.56, p)), coreA = iwin(p, 0.265, 0.29, 0.53, 0.56);
    core.visible = coreA > 0.01 && !!W.e3;
    if (W.e3){ core.position.copy(W.e3).addScaledVector(W.n3, 4 + 86*pop); core.scale.setScalar(ilerp(1, 2.6, pop)); }
    core.traverse(o=>{ if (o.material && o.material.transparent && o !== W.gm){ o.material.opacity = (o.material.userData.b ?? (o.material.userData.b = o.material.opacity))*coreA; } });
    W.gm.material.opacity = 0.4*coreA*(1 - 0.5*ismooth(0.4, 0.44, p));
    // pyramidal cells: out of step, then in step; currents run up the apical dendrites and a dipole appears
    const sync = ismooth(0.43, 0.48, p), zoomA = iwin(p, 0.385, 0.41, 0.52, 0.545);
    W.cells.forEach(c=>{ const ph = (t*1.6 + (1 - sync)*c.ph*3) % 1; c.dots.forEach((d, k)=>{ const u = (ph + k/3) % 1; d.position.y = -0.6 + u*5.4; d.material.opacity = zoomA*Math.sin(Math.PI*u)*0.95; d.visible = zoomA > 0.01; }); });
    W.cellMat.emissiveIntensity = 0.5*zoomA*(0.5 + 0.5*Math.sin(t*6)*sync);
    const dA = zoomA*ismooth(0.46, 0.5, p); W.dip.visible = dA > 0.01; W.dip.userData.mat.opacity = dA; W.dip.scale.y = 0.7 + 0.3*Math.abs(Math.sin(t*3));
    // millions together: the head clears, a patch of occipital cortex oscillates at 10 Hz
    const clear = iwin(p, 0.54, 0.58, 0.655, 0.69);
    ifade(W.headMat, 1 - clear, 0.12); W.capMat.opacity = 1 - 0.75*clear; W.capMat.depthWrite = clear < 0.01;
    W.elec.forEach(e=>{ e.g.visible = clear < 0.6; });
    W.brain.set(clear);
    const alpha = Math.sin(t*2*Math.PI*1.25)*(0.62 + 0.38*Math.sin(t*0.9));   // shown at 1.25 Hz so the eye can follow; real alpha is ~10 Hz
    W.genOv.uniforms.uGen.value.set(-14, -94, 10, 13); W.genOv.uniforms.uGen2.value.set(16, -94, 10, 13);
    W.genOv.uniforms.uGenA.value = W.genOv.uniforms.uGen2A.value = 1.4*alpha*clear;
    W.gen.visible = clear > 0.05; W.gen.userData.mat.opacity = clear; W.gen.scale.y = Math.max(0.05, Math.abs(alpha));
    W.gen.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(0, alpha >= 0 ? -1 : 1, alpha >= 0 ? 0.15 : -0.15).normalize());
    // the scalp map: broad and blurred, the same pattern the viewer shows
    const mapA = ismooth(0.64, 0.69, p)*(1 - ismooth(0.93, 0.97, p));
    if (mapA > 0.01 && META){ const src = eegSources('alpha', t*0.125 + 3); const U = W.capOv.uniforms;
      for (let i = 0; i < 6; i++){ const s = src[i]; if (s){ U.uSrc.value[i].set(s.p[0], s.p[1], s.p[2], s.s*1.15); U.uSrcA.value[i] = s.a/55; } else U.uSrcA.value[i] = 0; } }
    W.capOv.uniforms.uMap.value = mapA;
    W.leds.forEach((l, i)=>{ l.material.emissiveIntensity = 0.3 + 0.7*(0.5 + 0.5*Math.sin(t*9 + i)); });
    // monitor and final panel
    if (!W.lastMon || t - W.lastMon > 1/15){ W.lastMon = t; if (META){ W.trace(W.monCv.getContext('2d'), 640, 400, t, 8, true); W.monTex.needsUpdate = true; } }
    const camO = R.camera, fA = ismooth(0.92, 0.95, p);
    if (fA > 0.002 && META){ W.trace(W.trP.ctx, 512, 320, t, 8, false); W.trP.dirty(); const land = camO.aspect >= 1.05; PN.place(W.trP, camO, land ? 0.2*Math.min(1, camO.aspect - 0.6) : 0, land ? 0.06 : 0.2, land ? 0.66 : 0.82*camO.aspect*1.2); }
    W.trP.show(fA);
  };
  W.labels = p => {
    const a = iwin(p, 0.13, 0.15, 0.245, 0.26), L = v => W.F.localToWorld(v.clone());
    const out = W.elec.map(e=>({pos:L(e.pos), text:e.nm, a:a*(['C3','Cz','C4','Fz','Pz','O1','O2','F3','F4','P3','P4','T7','T8','Fp1','Fp2','F7','F8','P7','P8'].includes(e.nm) ? 1 : 0)}));
    const b = iwin(p, 0.31, 0.33, 0.38, 0.395), C = y => W.e3 ? core.localToWorld(new T.Vector3(9.5, y, 0)) : new T.Vector3();
    const c = iwin(p, 0.42, 0.45, 0.51, 0.53), d = iwin(p, 0.6, 0.62, 0.69, 0.72), e = iwin(p, 0.82, 0.84, 0.9, 0.92);
    out.push({pos:C(1.1), text:'Gel', a:b}, {pos:C(-3), text:'Cuero cabelludo', a:b}, {pos:C(-9.5), text:'Cráneo', a:b}, {pos:C(-14.5), text:'LCR', a:b}, {pos:C(-19.5), text:'Sustancia gris', a:b}, {pos:C(-27), text:'Sustancia blanca', a:b});
    out.push({pos:W.e3 ? core.localToWorld(new T.Vector3(6.8, -14, 0)) : new T.Vector3(), text:'Dipolo: corrientes en fase', a:c});
    out.push({pos:L(new T.Vector3(0, -100, 14)), text:'Corteza visual, generador alfa', a:d, left:true});
    out.push({pos:W.amp.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 4, 0)), text:'Amplificador diferencial', a:e, left:true});
    return out;
  };
  immLinearize(scene);
  return W;
}


// the magnetic field of current dipoles, read on a surface (same formula as the viewer's MEG map)
const MEG_OVERLAY = () => ({key:'megmap', scale:'1.0', uniforms:{uDip:{value:new THREE.Vector4(-38, -27, 54, 0)}, uDipQ:{value:new THREE.Vector4(0, 1, 0, 0)}, uMap:{value:0}},
  decl:'uniform vec4 uDip, uDipQ; uniform float uMap;' + GLSL_RAMPS,
  code:`vec3 nrM = normalize(vMni - vec3(0.0, -18.0, 5.0)); vec3 dM = vMni - uDip.xyz; float rM = length(dM); float vM = dot(cross(uDipQ.xyz, dM), nrM)/(rM*rM*rM)*uDipQ.w;
    vec3 mC = iRdBu(vM); float isoM = abs(fract(vM*5.0 + 0.5) - 0.5); float isoL = 1.0 - smoothstep(0.0, fwidth(vM*5.0)*1.4 + 1e-4, isoM);
    diffuseColor.rgb = mix(diffuseColor.rgb, mix(mC, mC*0.6, isoL*0.6), uMap);`});

/* =====================================================================
   MEG walkthrough
     0.00 shielded room · 0.12 head in the helmet · 0.245 inside the dewar · 0.37 SQUID sensors
     0.485 a current in a sulcus · 0.615 out on one side, in on the other · 0.745 millisecond timing · 0.87 the source
   ===================================================================== */
function buildMEG(scene, renderer, R){
  const T = THREE, W = {}, M = immScanMats();
  const S = immStudio(scene, renderer, {floor:0, shadow:260, target:[0, 80, -40]});
  /* ---------- the shielded room: aluminium and mu-metal panels ---------- */
  const panTex = immCanvasTex(256, 256, (x, w)=>{ const g = x.createLinearGradient(0, 0, w, w); g.addColorStop(0, '#e8ecee'); g.addColorStop(1, '#d6dde0'); x.fillStyle = g; x.fillRect(0, 0, w, w); x.strokeStyle = '#aeb8be'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, w - 3, w - 3); x.fillStyle = '#9aa6ad'; for (const [a, b] of [[14, 14], [w - 14, 14], [14, w - 14], [w - 14, w - 14]]){ x.beginPath(); x.arc(a, b, 3, 0, 7); x.fill(); } });
  panTex.wrapS = panTex.wrapT = T.RepeatWrapping;
  const wallMat = (rx, ry) => { const t = panTex.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return new T.MeshStandardMaterial({color:0xffffff, map:t, roughness:0.45, metalness:0.35}); };
  const back = ishadow(new T.Mesh(new T.BoxGeometry(330, 250, 6), wallMat(5.5, 4.2))); back.position.set(0, 125, -150); scene.add(back);
  const left = ishadow(new T.Mesh(new T.BoxGeometry(6, 250, 260), wallMat(4.3, 4.2))); left.position.set(-165, 125, -20); scene.add(left);
  const floorP = new T.Mesh(new T.BoxGeometry(330, 2, 260), wallMat(5.5, 4.3)); floorP.position.set(0, 1, -20); floorP.receiveShadow = true; scene.add(floorP);
  const door = ishadow(new T.Mesh(new T.BoxGeometry(110, 230, 18), wallMat(1.8, 3.8))); door.position.set(196, 116, 64); door.rotation.y = -0.55; scene.add(door);
  /* ---------- MEG gantry, dewar and helmet ---------- */
  const shellM = new T.MeshPhysicalMaterial({color:0xf3f5f6, roughness:0.24, clearcoat:0.85, clearcoatRoughness:0.1, side:T.DoubleSide}); W.shellM = shellM;
  const col = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(46, 220, 14), {depth:30, bevelEnabled:true, bevelThickness:4, bevelSize:4, bevelSegments:6}), M.trim)); col.position.set(0, 112, -98); scene.add(col);
  const baseP = ishadow(new T.Mesh(new T.BoxGeometry(110, 8, 70), M.plinth)); baseP.position.set(0, 6, -86); scene.add(baseP);
  const arm = ishadow(new T.Mesh(new T.BoxGeometry(30, 22, 70), M.trim)); arm.position.set(0, 200, -58); scene.add(arm);
  const dew = new T.Group(); dew.position.set(0, 0, 2.4); scene.add(dew); W.dew = dew;
  const prof = []; const top = 236, cyl0 = 162, rC = 30;
  prof.push(new T.Vector2(0, top + 6)); for (let i = 0; i <= 8; i++){ const a = i/8*Math.PI/2; prof.push(new T.Vector2(rC - 6 + 6*Math.sin(a), top - 6 + 6*Math.cos(a))); }
  prof.push(new T.Vector2(rC, cyl0)); for (let i = 1; i <= 14; i++){ const u = i/14; prof.push(new T.Vector2(rC - (rC - 14)*Math.pow(u, 0.7), cyl0 - 26*u)); }
  const dewBody = ishadow(new T.Mesh(new T.LatheGeometry(prof, 96), shellM)); dew.add(dewBody);
  const cap = new T.Mesh(new T.CylinderGeometry(9, 9, 6, 32), M.steel); cap.position.y = top + 8; dew.add(cap);
  W.he = new T.Mesh(new T.CylinderGeometry(rC - 5, rC - 5, 52, 64), new T.MeshPhysicalMaterial({color:0x9fd0ff, roughness:0.05, transparent:true, opacity:0, depthWrite:false, emissive:0x3a7dff, emissiveIntensity:0.15})); W.he.position.y = 196; dew.add(W.he);
  /* ---------- seated volunteer, real head ---------- */
  const chairMat = new T.MeshPhysicalMaterial({color:0xe9eef0, roughness:0.35, clearcoat:0.5});
  scene.add(ichair(T, chairMat)); S.blob(0, 6, 120, 130);
  W.man = buildMannequin(T, {shadows:true}); poseSeated(W.man); scene.add(W.man.group);
  W.F = immSeatedHead(W.man);
  W.headMat = W.man.mat.clone(); W.headMat.userData.linear = true;
  W.scalp = immScalp(W.F, W.headMat, {order:1, shadow:true});
  W.helmetOut = immScalp(W.F, shellM, {keep:icapKeep(-22, 0.16), offset:52, order:5});
  W.helmetIn = immScalp(W.F, new T.MeshStandardMaterial({color:0x56636a, roughness:0.6, side:T.BackSide}), {keep:icapKeep(-22, 0.16), offset:18, order:5});
  W.mapOv = MEG_OVERLAY(); W.mapMat = new T.MeshStandardMaterial({color:0xf4f4f6, roughness:0.6, transparent:true, opacity:0, depthWrite:false}); immOverlay(W.mapMat, W.mapOv);
  W.mapShell = immScalp(W.F, W.mapMat, {keep:icapKeep(-18, 0.14), offset:5, order:4});
  W.genOv = SRC_OVERLAY('meggen'); W.brain = immBrain(W.F, {overlay:W.genOv, order:2});
  /* ---------- sensors on the helmet: ~100 positions, coloured by the field ---------- */
  W.sens = []; W.lazy = () => {
    if (W.sensBuilt || !MESHRAW) return; W.sensBuilt = true;
    const Mr = MESHRAW, v0 = Mr.nv, nv = Mr.pos.length/3 - v0, c = new T.Vector3(0, -18, 5), keep = icapKeep(-20, 0.16), cand = [];
    for (let i = 0; i < nv; i += 7){ const p = new T.Vector3(Mr.pos[(v0 + i)*3]/64, Mr.pos[(v0 + i)*3 + 1]/64, Mr.pos[(v0 + i)*3 + 2]/64); if (!keep([p.x, p.y, p.z], 0)) continue; if (p.y > 70 && p.z < 30) continue; cand.push(p); }
    const rr = rnd(8); cand.sort(()=>rr() - 0.5);
    for (const p of cand){ const n = p.clone().sub(c).normalize(), q = p.clone().addScaledVector(n, 30); if (W.sens.every(s=>s.p.distanceTo(q) > 27)) W.sens.push({p:q, n}); if (W.sens.length >= 102) break; }
    W.sI = new T.InstancedMesh(new T.BoxGeometry(9, 3.4, 9), new T.MeshStandardMaterial({color:0xffffff, roughness:0.4, metalness:0.3}), W.sens.length);
    const m4 = new T.Matrix4(), qq = new T.Quaternion(); W.sens.forEach((s, i)=>{ qq.setFromUnitVectors(new T.Vector3(0, 1, 0), s.n); m4.compose(s.p, qq, new T.Vector3(1, 1, 1)); W.sI.setMatrixAt(i, m4); W.sI.setColorAt(i, new T.Color(0.18, 0.42, 1)); });
    W.F.add(W.sI); W.sI.visible = false;
  };
  /* ---------- one sensor triplet, magnified ---------- */
  const trip = new T.Group(); trip.position.set(-36, 156, 26); trip.rotation.set(0.5, 0.6, 0.2); scene.add(trip); W.trip = trip; trip.visible = false;
  const cu = new T.MeshStandardMaterial({color:0xc8783c, roughness:0.35, metalness:0.8, transparent:true}), chipM = new T.MeshStandardMaterial({color:0x1d2630, roughness:0.3, metalness:0.5, transparent:true});
  const plateM = new T.MeshPhysicalMaterial({color:0xdfe6ea, roughness:0.2, clearcoat:0.8, transparent:true, opacity:0.9});
  const plate = new T.Mesh(new T.BoxGeometry(22, 0.6, 22), plateM); trip.add(plate);
  const loop = (pts, y) => { const c = new T.CatmullRomCurve3(pts.map(([x, z])=>new T.Vector3(x, y, z)), true, 'catmullrom', 0.02); return new T.Mesh(new T.TubeGeometry(c, 160, 0.28, 6, true), cu); };
  trip.add(loop([[-9, -9], [9, -9], [9, 9], [-9, 9]], 0.6));
  trip.add(loop([[-8, -8], [-0.6, -8], [-0.6, 8], [-8, 8]], 1.1)); trip.add(loop([[0.6, -8], [8, -8], [8, 8], [0.6, 8]], 1.1));
  trip.add(loop([[-7, -7], [7, -7], [7, -0.6], [-7, -0.6]], 1.7)); trip.add(loop([[-7, 0.6], [7, 0.6], [7, 7], [-7, 7]], 1.7));
  W.chips = []; for (let i = 0; i < 3; i++){ const ch = new T.Mesh(new T.BoxGeometry(2.6, 0.8, 2.6), chipM); ch.position.set(-6 + i*6, 2.4, 11.6); trip.add(ch); W.chips.push(ch); }
  W.tripMats = [cu, chipM, plateM];
  /* ---------- current dipole in the left hand area, and its field ---------- */
  W.dip = iarrow(T, 26, 1.3, 0xe8962a, {glow:0.8}); W.dip.position.set(-38, -27 - 13, 54); W.dip.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(0, 1, 0)); W.F.add(W.dip); W.dip.visible = false;
  // MNI y is the current direction; in the head frame the arrow's own +y already maps to MNI +y
  W.rings = []; const dashT = immCanvasTex(256, 8, (x, w)=>{ for (let i = 0; i < 16; i++){ x.fillStyle = i % 2 ? 'rgba(255,255,255,0)' : '#ffffff'; x.fillRect(i*16, 0, 16, 8); } }); dashT.wrapS = T.RepeatWrapping;
  for (let k = 0; k < 4; k++){ const r = 7 + k*7, m = new T.MeshBasicMaterial({color:0x2f6bff, alphaMap:dashT, transparent:true, opacity:0, depthWrite:false, side:T.DoubleSide});
    const ring = new T.Mesh(new T.TorusGeometry(r, 0.8, 6, 120), m); ring.rotation.x = Math.PI/2; ring.position.set(-38, -27, 54); W.F.add(ring); W.rings.push(ring); }
  /* ---------- panel: evoked field, all sensors ---------- */
  const PN = immPanels(scene); W.bfP = PN.make('MEG · 102 SENSORES · PULSO EN MUÑECA DERECHA', 512, 300); W.bfP.keepLab = true;
  W.field = (dips, p, n) => { let b = 0; for (const d of dips){ const r = p.clone().sub(mniV(d.p)), L = r.length(); b += new T.Vector3().crossVectors(mniV(d.q), r).dot(n)/(L*L*L)*d.a; } return b; };
  W.butterfly = (ctx, w, h, tau) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); const X = ms => 30 + (w - 50)*ms/250, Y = v => h*0.48 - Math.max(-1.4, Math.min(1.4, v))*h*0.3;
    ctx.strokeStyle = 'rgba(12,22,27,.22)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(250), Y(0)); ctx.stroke();
    ctx.strokeStyle = '#e8962a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(0), 10); ctx.lineTo(X(0), h - 40); ctx.stroke();
    const S = W.sens.length ? W.sens.slice(0, 60) : [];
    S.forEach((s, k)=>{ ctx.strokeStyle = `hsla(${200 + (k*29)%90},60%,${30 + (k*13)%30}%,.55)`; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let i = 0; i <= 120; i++){ const ms = i/120*250, d = megDipoles('sep', ms/1000), v = W.field(d, s.p, s.n)*16000; const x = X(ms), y = Y(v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); });
    ctx.strokeStyle = '#0050ff'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(X(20), 10); ctx.lineTo(X(20), h - 40); ctx.stroke(); ctx.setLineDash([]);
    const cx = X(Math.min(250, tau*1000)); ctx.fillStyle = 'rgba(0,80,255,.12)'; ctx.fillRect(cx - 2, 10, 4, h - 50);
    ctx.fillStyle = '#76858c'; ctx.font = '16px monospace'; for (const ms of [0, 50, 100, 150, 200, 250]) ctx.fillText(ms + ' ms', X(ms) - 18, h - 14);
    ctx.fillStyle = '#0050ff'; ctx.fillText('N20m', X(20) + 6, 26); ctx.fillStyle = '#965400'; ctx.fillText('pulso', X(0) + 6, h - 46);
  };
  const cam = immCamPath(R, [
    [0.00, [-290, 200, 370], [0, 110, -30]],
    [0.11, [-220, 175, 270], [0, 125, -10]],
    [0.18, [-150, 150, 175], [0, 132, 0]],
    [0.26, [-140, 176, 140], [0, 142, -4]],
    [0.34, [-96, 156, 104], [0, 136, 0]],
    [0.40, [-62, 168, 70], [-36, 156, 26]],
    [0.47, [-66, 170, 56], [-36, 156, 26]],
    [0.53, [40, 150, 42], [3.8, 128, 1.2]],
    [0.59, [24, 140, 26], [3.8, 128, 1.2]],
    [0.67, [30, 151, 30], [2, 129, 0]],
    [0.75, [26, 150, 42], [2, 129, 0]],
    [0.86, [12, 152, 72], [2, 127, 0]],
    [1.00, [2, 147, 66], [2, 127, 0]],
  ], {drift:0.08});
  const ccol = new T.Color();
  W.update = (p, t, dt) => {
    W.scalp.build(); W.helmetOut.build(); W.helmetIn.build(); W.mapShell.build(); W.brain.build(); W.lazy();
    cam(p, t, ilerp(36, 40, ismooth(0.48, 0.55, p)), p < 0.36 ? 6 : 0.5);
    R.saoOn = false;
    // the dewar turns to glass: helium and the sensor array inside
    const clear = ismooth(0.25, 0.31, p);
    ifade(shellM, 1 - clear, 0.08); W.he.material.opacity = 0.35*clear*(1 - ismooth(0.6, 0.66, p)); W.he.visible = W.he.material.opacity > 0.01;
    if (W.sI) W.sI.visible = clear > 0.01;
    if (W.helmetIn.mesh) W.helmetIn.mesh.visible = clear < 0.5;
    // a sensor triplet, magnified
    const tA = iwin(p, 0.37, 0.4, 0.47, 0.49); trip.visible = tA > 0.01; W.tripMats.forEach(m=>{ m.opacity = tA*(m === W.tripMats[2] ? 0.9 : 1); });
    // the current source: head clears, brain shows the active patch
    const deep = iwin(p, 0.485, 0.52, 0.86, 0.9), see = ismooth(0.485, 0.52, p);
    ifade(W.headMat, 1 - see, 0.14);
    W.brain.set(deep*(1 - 0.45*iwin(p, 0.5, 0.54, 0.6, 0.64)));
    const dips = megDipoles('sep', 0.02), pk = 0.85 + 0.15*Math.sin(t*3);
    const tau = (t*0.08) % 0.25, live = ismooth(0.745, 0.77, p), dLive = megDipoles('sep', tau)[0].a;
    const amp = ilerp(-1.0*pk, dLive, live);     // the evoked response, slowed down ~12× in the timing step
    W.genOv.uniforms.uGen.value.set(-38, -27, 54, 9); W.genOv.uniforms.uGenA.value = Math.abs(amp)*deep*1.2; W.genOv.uniforms.uGen2A.value = 0;
    const dA = iwin(p, 0.5, 0.53, 0.98, 1.01)*see; W.dip.visible = dA > 0.01; W.dip.userData.mat.opacity = dA; W.dip.scale.setScalar(Math.max(0.1, Math.abs(amp)));
    W.dip.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(0, amp < 0 ? -1 : 1, 0)); W.dip.position.set(-38, -27 - 13*Math.sign(amp || 1)*Math.max(0.1, Math.abs(amp)), 54);
    const rA = iwin(p, 0.51, 0.54, 0.7, 0.74)*see;
    W.rings.forEach((r, k)=>{ r.material.opacity = rA*(1 - k*0.18); r.visible = rA > 0.01; r.material.alphaMap.offset.x = (t*0.25*Math.sign(amp || 1)) % 1; });
    // the field map on the head and the sensor colours
    const mapA = ismooth(0.62, 0.67, p);
    const mo = ifade(W.mapMat, mapA*(1 - ismooth(0.95, 0.99, p))); if (W.mapShell.mesh) W.mapShell.mesh.visible = mo > 0.01;
    W.mapOv.uniforms.uDip.value.set(-38, -27, 54, 0); W.mapOv.uniforms.uDipQ.value.set(0, 1, 0, 7000*amp); W.mapOv.uniforms.uMap.value = 1;
    if (W.sI){ const d0 = [{p:[-38, -27, 54], q:[0, 1, 0], a:amp}], blueC = new T.Color(0.2, 0.42, 1); W.sens.forEach((s, i)=>{ const v = W.field(d0, s.p, s.n)*16000; v >= 0 ? ccol.setRGB(0.92, 0.92 - 0.8*Math.min(1, v), 0.92 - 0.8*Math.min(1, v)) : ccol.setRGB(0.92 + 0.8*Math.max(-1, v), 0.92 + 0.55*Math.max(-1, v), 0.96); W.sI.setColorAt(i, ccol.lerp(blueC, 1 - mapA)); }); W.sI.instanceColor.needsUpdate = true; }
    // the evoked response over time
    const camO = R.camera, bA = ismooth(0.75, 0.78, p);
    if (bA > 0.002 && W.sens.length){ if (!W.bfT || t - W.bfT > 1/12){ W.bfT = t; W.butterfly(W.bfP.ctx, 512, 300, tau); W.bfP.dirty(); }
      const land = camO.aspect >= 1.05; PN.place(W.bfP, camO, land ? 0.2*Math.min(1, camO.aspect - 0.6) : 0, land ? 0.12 : 0.22, land ? 0.6 : 0.8*Math.min(1, camO.aspect*1.25)); }
    W.bfP.show(bA);
  };
  W.labels = p => {
    const a = iwin(p, 0.02, 0.04, 0.09, 0.105), b = iwin(p, 0.27, 0.29, 0.35, 0.365), c = iwin(p, 0.4, 0.42, 0.465, 0.48), d = iwin(p, 0.53, 0.55, 0.6, 0.615), e = iwin(p, 0.88, 0.9, 0.98, 1.01);
    const L = v => trip.localToWorld(v.clone()), H = v => W.F.localToWorld(v.clone());
    return [
      {pos:new T.Vector3(-100, 210, -147), text:'Paredes de mu-metal y aluminio', a},
      {pos:new T.Vector3(0, 214, 2.4 - 28), text:'Helio líquido, 4 K', a:b, left:true},
      {pos:H(new T.Vector3(-70, -10, 95)), text:'102 posiciones de sensores · 306 canales', a:b},
      {pos:L(new T.Vector3(9, 0.6, -9)), text:'Bucle magnetómetro', a:c},
      {pos:L(new T.Vector3(-8, 1.1, 0)), text:'Dos gradiómetros planares', a:c, left:true},
      {pos:L(new T.Vector3(0, 2.4, 11.6)), text:'SQUID', a:c},
      {pos:H(new T.Vector3(-38, -14, 56)), text:'Corriente por la pared del surco central', a:d},
      {pos:H(new T.Vector3(-38, -27, 54)), text:'Dipolo ajustado: área de la mano izquierda, 20 ms', a:e},
    ];
  };
  immLinearize(scene);
  return W;
}


/* =====================================================================
   Ultrasound walkthrough (transcranial Doppler through the temporal window)
     0.00 at the bedside · 0.12 the probe · 0.27 a window in the skull · 0.40 pulse out, echo back
     0.54 echo time becomes depth · 0.67 moving blood shifts the pitch · 0.81 the spectrum · 0.93 beat by beat
   ===================================================================== */
function buildUS(scene, renderer, R){
  const T = THREE, W = {}, M = immScanMats();
  const S = immStudio(scene, renderer);
  W.P = immTable(scene); W.P.table.position.set(0, -22, -16);
  /* ---------- the ultrasound cart ---------- */
  const cart = new T.Group(); cart.position.set(82, 0, -26); cart.rotation.y = -0.75; scene.add(cart); W.cart = cart;
  const F0 = S.FLOOR;
  const cb = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(56, 66, 10), {depth:8, bevelEnabled:true, bevelThickness:2, bevelSize:2, bevelSegments:3}), M.plinth)); cb.rotation.x = -Math.PI/2; cb.position.y = F0 + 8; cart.add(cb);
  for (const [x, z] of [[-22, -26], [22, -26], [-22, 26], [22, 26]]){ const w = new T.Mesh(new T.CylinderGeometry(4, 4, 3, 20), M.dark); w.rotation.z = Math.PI/2; w.position.set(x, F0 + 4, z); cart.add(w); }
  const colm = ishadow(new T.Mesh(new T.BoxGeometry(16, 74, 16), M.trim)); colm.position.set(0, F0 + 52, -8); cart.add(colm);
  const cons = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(60, 46, 8), {depth:6, bevelEnabled:true, bevelThickness:2, bevelSize:2, bevelSegments:4}), M.shell)); cons.rotation.x = -Math.PI/2 + 0.18; cons.position.set(0, F0 + 92, 4); cart.add(cons);
  const keys = new T.Mesh(new T.PlaneGeometry(40, 18), new T.MeshStandardMaterial({color:0x2c363c, roughness:0.5})); keys.rotation.x = -Math.PI/2 + 0.18; keys.position.set(0, F0 + 100.4, 8); cart.add(keys);
  const mArm = new T.Mesh(new T.BoxGeometry(5, 34, 5), M.steel); mArm.position.set(0, F0 + 118, -14); cart.add(mArm);
  W.monCv = document.createElement('canvas'); W.monCv.width = 640; W.monCv.height = 420; W.monTex = new T.CanvasTexture(W.monCv); W.monTex.encoding = T.sRGBEncoding;
  const mon = new T.Group(); mon.position.set(0, F0 + 152, -12); mon.rotation.x = -0.08; cart.add(mon); W.mon = mon;
  mon.add(ishadow(new T.Mesh(new T.BoxGeometry(58, 39, 3), M.dark)));
  const ms = new T.Mesh(new T.PlaneGeometry(54, 35.4), new T.MeshBasicMaterial({map:W.monTex, toneMapped:false})); ms.position.z = 1.6; mon.add(ms);
  const holder = new T.Mesh(new T.BoxGeometry(10, 8, 6), M.trim); holder.position.set(30, F0 + 96, 10); cart.add(holder);
  S.blob(82, -26, 120, 120);
  /* ---------- the probe on the left temple (MNI frame, millimetres) ---------- */
  const F = W.P.mni, apex = new T.Vector3(-74, -4, -12);
  const probe = new T.Group(); probe.position.set(-77, -4, -9); probe.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(-1, 0, 0.05).normalize()); F.add(probe); W.probe = probe;
  const pMat = new T.MeshPhysicalMaterial({color:0xe9eef0, roughness:0.3, clearcoat:0.6, transparent:true});
  const prof = [[0, 0], [10.5, 0], [11, 3], [12.5, 18], [14, 46], [13, 70], [8, 92], [5, 98], [0, 99]].map(([r, y])=>new T.Vector2(r, y));
  W.probeShell = new T.Mesh(new T.LatheGeometry(prof, 40), pMat); probe.add(W.probeShell); W.pMat = pMat;
  const lensM = new T.Mesh(new T.CylinderGeometry(10.2, 10.2, 1.5, 32), new T.MeshStandardMaterial({color:0x56636a, roughness:0.4})); lensM.position.y = 0.6; probe.add(lensM);
  // inside the probe: 32 piezo elements, a matching layer and a backing block
  W.elems = []; for (let i = 0; i < 24; i++){ const m = new T.Mesh(new T.BoxGeometry(0.55, 4, 14), new T.MeshStandardMaterial({color:0xb8692f, roughness:0.3, metalness:0.7, emissive:0x2f6bff, emissiveIntensity:0})); m.position.set(-7.4 + i*0.64, 4.2, 0); probe.add(m); W.elems.push(m); }
  const back = new T.Mesh(new T.BoxGeometry(16.4, 10, 15), new T.MeshStandardMaterial({color:0x2c363c, roughness:0.6})); back.position.y = 11.6; probe.add(back);
  const match = new T.Mesh(new T.BoxGeometry(16.4, 1.2, 15), new T.MeshStandardMaterial({color:0x9ec4ff, roughness:0.2, transparent:true, opacity:0.8})); match.position.y = 1.7; probe.add(match);
  W.inner = [back, match, ...W.elems]; W.inner.forEach(m=>{ m.visible = false; });
  W.gel = new T.Mesh(new T.SphereGeometry(13, 24, 12, 0, Math.PI*2, 0, Math.PI/2), new T.MeshPhysicalMaterial({color:0xa9dcff, roughness:0.05, transparent:true, opacity:0.45})); W.gel.scale.y = 0.25; W.gel.rotation.x = Math.PI; probe.add(W.gel);
  W.cableBuilt = false;
  /* ---------- head: scalp, skull with its thin temporal window, brain, the MCA ---------- */
  const skin = new T.MeshPhysicalMaterial({color:0xc9d6de, roughness:0.35, clearcoat:0.4, transparent:true, opacity:0, depthWrite:false});
  W.scalp = immScalp(F, skin, {order:4});
  W.boneMat = new T.MeshStandardMaterial({color:0xf2ead8, roughness:0.6, transparent:true, opacity:0, depthWrite:false, side:T.DoubleSide});
  W.skull = immScalp(F, W.boneMat, {shrink:0.93, order:3});
  W.brain = immBrain(F, {order:2});
  W.win = new T.Mesh(new T.CircleGeometry(14, 40), new T.MeshBasicMaterial({color:0x2f6bff, transparent:true, opacity:0, depthWrite:false, side:T.DoubleSide})); W.win.position.set(-70.5, -4, -8); W.win.rotation.y = -Math.PI/2; W.win.renderOrder = 5; F.add(W.win);
  const mcaPts = [[-14, 2, -14], [-20, 3, -13], [-26, 3, -12], [-34, 4, -9], [-38, 8, 0]].map(mniV);
  W.mcaC = new T.CatmullRomCurve3(mcaPts);
  W.mca = new T.Mesh(new T.TubeGeometry(W.mcaC, 60, 1.7, 16), new T.MeshPhysicalMaterial({color:0xd9412b, roughness:0.25, transparent:true, opacity:0, depthWrite:false, side:T.DoubleSide})); W.mca.renderOrder = 5; F.add(W.mca);
  const icaPts = [[-24, -10, -78], [-22, -13, -44], [-18, -6, -38], [-16, 4, -25], [-14, 2, -14]].map(mniV);
  W.ica = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(icaPts), 50, 2.2, 12), W.mca.material); F.add(W.ica);
  W.NC = 26; W.rbc = new T.InstancedMesh(new T.SphereGeometry(0.75, 12, 8), new T.MeshStandardMaterial({color:0xd9412b, roughness:0.4}), W.NC); F.add(W.rbc); W.rbcU = Array.from({length:W.NC}, (_, i)=>({u:i/W.NC, r:hashf(i*2.3)*0.9, a:hashf(i*5.1)*Math.PI*2}));
  /* ---------- the beam: a fan in the axial plane through the MCA, pulses and echoes ---------- */
  const A = 0.62;
  W.fanMat = new T.MeshBasicMaterial({color:0x3d7bff, transparent:true, opacity:0, depthWrite:false, side:T.DoubleSide});
  W.fan = new T.Mesh(new T.CircleGeometry(150, 48, -A, 2*A), W.fanMat); W.fan.position.copy(apex); W.fan.renderOrder = 5; F.add(W.fan);
  W.pulses = []; for (let i = 0; i < 3; i++){ const m = new T.Mesh(new T.RingGeometry(0.97, 1, 48, 1, -A, 2*A), new T.MeshBasicMaterial({color:0x0050ff, transparent:true, opacity:0, depthWrite:false, side:T.DoubleSide})); m.position.copy(apex); m.renderOrder = 6; F.add(m); W.pulses.push(m); }
  W.echoes = []; for (let i = 0; i < 3; i++){ const m = new T.Mesh(new T.RingGeometry(0.96, 1, 48, 1, Math.PI - 0.5, 1.0), new T.MeshBasicMaterial({color:0xe8962a, transparent:true, opacity:0, depthWrite:false, side:T.DoubleSide})); m.position.set(apex.x + 48, apex.y + 7, apex.z); m.renderOrder = 6; F.add(m); W.echoes.push(m); }
  // the B-mode / colour Doppler image from the viewer, revealed line by line across the fan
  W.imgCv = document.createElement('canvas'); W.imgCv.width = W.imgCv.height = 256; W.imgTex = new T.CanvasTexture(W.imgCv); W.imgTex.encoding = T.sRGBEncoding;
  W.alCv = document.createElement('canvas'); W.alCv.width = W.alCv.height = 256; W.alTex = new T.CanvasTexture(W.alCv);
  for (const t of [W.imgTex, W.alTex]){ t.wrapS = T.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; }
  W.img = new T.Mesh(new T.PlaneGeometry(216, 216), new T.MeshBasicMaterial({map:W.imgTex, alphaMap:W.alTex, transparent:true, opacity:0, depthWrite:false, side:T.DoubleSide, toneMapped:false}));
  W.img.position.set(0, -16, -12); W.img.renderOrder = 7; F.add(W.img); W.img.material.userData.linear = true;
  // waves at the vessel: sent (blue) and returned at a higher frequency (amber)
  W.wSent = iwiggle(T, 0x0050ff, 160); W.wBack = iwiggle(T, 0xe8962a, 160); F.add(W.wSent, W.wBack);
  /* ---------- panel: the Doppler spectrum ---------- */
  const PN = immPanels(scene); W.spP = PN.make('DOPPLER ESPECTRAL · ACM IZQUIERDA', 512, 280); W.spP.keepLab = true;
  W.spectrum = (ctx, w, h, t, dark) => {
    ctx.fillStyle = dark ? '#0a1016' : '#ffffff'; ctx.fillRect(0, 0, w, h);
    const base = h*0.74, sc = (h*0.62)/140;
    for (let i = 0; i < w; i += 2){ const tt = t - 4 + 4*i/w, v = tcdVel('normal', tt), hh = v*sc;
      const g = ctx.createLinearGradient(0, base, 0, base - hh); g.addColorStop(0, dark ? 'rgba(200,212,218,.06)' : 'rgba(12,22,27,.06)'); g.addColorStop(0.75, dark ? 'rgba(200,212,218,.45)' : 'rgba(12,22,27,.4)'); g.addColorStop(1, dark ? 'rgba(233,238,240,.95)' : 'rgba(12,22,27,.92)'); ctx.fillStyle = g; ctx.fillRect(i, base - hh, 2, hh); }
    ctx.strokeStyle = dark ? 'rgba(200,212,218,.4)' : 'rgba(12,22,27,.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(w, base); ctx.stroke();
    ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(0, base - 100*sc); ctx.lineTo(w, base - 100*sc); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = dark ? '#8d9ba1' : '#76858c'; ctx.font = '16px monospace'; ctx.fillText('100 cm/s', 6, base - 100*sc - 6); ctx.fillText('PSV 100  EDV 45  MFV 63 cm/s  PI 0.87', 6, h - 10);
  };
  W.drawMon = (t) => { const c = W.monCv.getContext('2d'); c.fillStyle = '#05080b'; c.fillRect(0, 0, 640, 420); const img = immScanImage('tcd', 'normal'); if (img) c.drawImage(img, 192, 4, 256, 256);
    c.save(); c.translate(0, 262); W.spectrum(c, 640, 158, t, true); c.restore(); c.fillStyle = '#5f8dff'; c.font = '16px monospace'; c.fillText('TCD · temporal izq. · 2 MHz', 10, 22); W.monTex.needsUpdate = true; };
  W.revealImg = f => {
    const img = immScanImage('tcd', 'normal'); if (!img) return;
    if (!W.imgDrawn){ W.imgDrawn = true; W.imgCv.getContext('2d').drawImage(img, 0, 0, 256, 256); W.imgTex.needsUpdate = true;
      const d = W.imgCv.getContext('2d').getImageData(0, 0, 256, 256).data; W.lum = new Float32Array(256*256); W.ang = new Float32Array(256*256);
      for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++){ const k = j*256 + i, mx = 108 - (i + 0.5)/256*216, my = 92 - (j + 0.5)/256*216;
        W.lum[k] = Math.max(d[k*4], d[k*4 + 1], d[k*4 + 2])/255; W.ang[k] = Math.atan2(my - apex.y, mx - apex.x); } }
    const key = Math.round(f*64); if (W.revK === key) return; W.revK = key;
    const c = W.alCv.getContext('2d'), im = c.createImageData(256, 256), cut = -A + 2*A*f;
    for (let k = 0; k < 256*256; k++){ const v = W.ang[k] <= cut ? Math.min(1, W.lum[k]*3.2 + 0.06*(W.lum[k] > 0.02)) : 0, g = Math.round(v*255); im.data[k*4] = im.data[k*4 + 1] = im.data[k*4 + 2] = g; im.data[k*4 + 3] = 255; }
    c.putImageData(im, 0, 0); W.alTex.needsUpdate = true;
  };
  const cam = immCamPath(R, [
    [0.00, [-330, 150, 420], [24, -24, 20]],
    [0.10, [-210, 110, 280], [30, -10, 0]],
    [0.17, [26, 12, 26], [12.5, -0.5, 1.6]],
    [0.25, [22, 8, 22], [11.5, -0.5, 1.6]],
    [0.32, [34, 52, 34], [4, -1, 1]],
    [0.39, [22, 46, 40], [3, -1, 1]],
    [0.46, [6, 10, 46], [2.6, -1, 1.9]],
    [0.60, [3, 2, 36], [2.2, -1, 1.9]],
    [0.68, [4.6, 2.6, 7.5], [2.7, 0.1, 1.9]],
    [0.78, [4.2, 1.8, 6.4], [2.7, 0.1, 1.9]],
    [0.86, [10, 20, 54], [2, -1, 2]],
    [1.00, [-14, 26, 70], [26, 4, -12]],
  ], {drift:0.09});
  const m4 = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), tan = new T.Vector3(), sc = new T.Vector3(1, 0.45, 1);
  W.update = (p, t, dt) => {
    const P = W.P; W.brain.build(); W.scalp.build(); W.skull.build();
    if (!W.cableBuilt && W.monTex){ W.cableBuilt = true; scene.updateMatrixWorld(true);
      const a = probe.localToWorld(new T.Vector3(0, 99, 0)), b = holder.getWorldPosition(new T.Vector3());
      scene.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([a, a.clone().add(new T.Vector3(8, 10, 2)), new T.Vector3((a.x + b.x)/2, -40, (a.z + b.z)/2 + 10), b]), 80, 0.45, 8), new T.MeshStandardMaterial({color:0x56636a, roughness:0.5}))); }
    cam(p, t, ilerp(36, 42, ismooth(0.44, 0.5, p)), p < 0.15 ? 6 : 0.2);
    R.saoOn = false;
    // the probe opens to show its crystals; they fire in sequence
    const pOpen = iwin(p, 0.15, 0.19, 0.25, 0.28); ifade(pMat, 1 - pOpen, 0.15); W.inner.forEach(m=>{ m.visible = pOpen > 0.01; });
    W.elems.forEach((m, i)=>{ const ph = (t*1.6 - i/24) % 1; m.material.emissiveIntensity = pOpen*(ph < 0.12 ? 2 : 0.1); });
    W.gel.visible = p > 0.12;
    // the head turns to glass; the temporal window glows
    const glass = ismooth(0.27, 0.33, p);
    P.fadeBody(glass); P.fadeTable(0.7*ismooth(0.4, 0.46, p));
    skin.opacity = 0.2*glass; if (W.scalp.mesh) W.scalp.mesh.visible = glass > 0.01;
    W.boneMat.opacity = 0.32*glass*(1 - 0.4*ismooth(0.5, 0.56, p)); if (W.skull.mesh) W.skull.mesh.visible = glass > 0.01;
    W.win.material.opacity = 0.55*iwin(p, 0.29, 0.32, 0.4, 0.44)*(0.75 + 0.25*Math.sin(t*4));
    W.brain.set(0.9*glass*(1 - 0.55*ismooth(0.62, 0.68, p)));
    // pulses out and echoes back
    const pe = iwin(p, 0.39, 0.42, 0.53, 0.56);
    W.fanMat.opacity = 0.1*Math.max(pe, iwin(p, 0.53, 0.55, 0.66, 0.7)); W.fan.visible = W.fanMat.opacity > 0.005;
    const cyc = (t*0.7) % 1;
    W.pulses.forEach((m, i)=>{ const u = cyc*1.4 - i*0.05; const r = 6 + u*60; m.scale.setScalar(Math.max(0.01, r)); m.material.opacity = pe*(u > 0 && u < 0.85 ? 0.9 - i*0.25 : 0); m.visible = m.material.opacity > 0.01; });
    W.echoes.forEach((m, i)=>{ const u = (cyc - 0.6)*2.2 - i*0.06; const r = 2 + u*46; m.scale.setScalar(Math.max(0.01, r)); m.material.opacity = pe*(u > 0 && u < 0.95 ? 0.95 - i*0.25 : 0); m.visible = m.material.opacity > 0.01; });
    // echo time becomes depth: the fan fills, line by line
    const fill = ismooth(0.55, 0.65, p), imgA = iwin(p, 0.54, 0.56, 0.78, 0.83);
    if (imgA > 0.002) W.revealImg(fill);
    W.img.material.opacity = imgA*(1 - 0.7*iwin(p, 0.67, 0.7, 0.8, 0.84)); W.img.visible = imgA > 0.01 && !!W.imgDrawn;
    // Doppler: red cells in the MCA flow toward the probe; the echo comes back compressed
    const dop = iwin(p, 0.66, 0.69, 0.8, 0.84); W.mca.material.opacity = 0.35*Math.max(dop, 0.5*imgA*0); W.mca.visible = W.ica.visible = dop > 0.01;
    W.rbc.visible = dop > 0.01;
    const vel = tcdVel('normal', t);
    W.rbcU.forEach((c, i)=>{ c.u = (c.u + dt*vel/100*0.22) % 1; if (!(c.u >= 0 && c.u < 1)) c.u = 0; W.mcaC.getPointAt(c.u, v); W.mcaC.getTangentAt(c.u, tan);
      const off = new T.Vector3(Math.cos(c.a), Math.sin(c.a), 0).multiplyScalar(c.r); v.add(off); q.setFromUnitVectors(new T.Vector3(0, 1, 0), tan); m4.compose(v, q, sc); W.rbc.setMatrixAt(i, m4); });
    W.rbc.instanceMatrix.needsUpdate = true;
    const tgt = W.mcaC.getPoint(0.55);
    W.wSent.visible = W.wBack.visible = dop > 0.01; W.wSent.material.opacity = W.wBack.material.opacity = dop;
    W.wSent.userData.set(apex.clone().add(new T.Vector3(4, 0, 0)), tgt.clone().add(new T.Vector3(0, 3, 0)), 1.1, 9, t*14, 0, 1, new T.Vector3(0, 0, 1));
    W.wBack.userData.set(tgt.clone().add(new T.Vector3(0, -3, 0)), apex.clone().add(new T.Vector3(4, -6, 0)), 1.1, 12, -t*14, 0, 1, new T.Vector3(0, 0, 1));
    // monitor and panel
    if (!W.monT || t - W.monT > 1/12){ W.monT = t; W.drawMon(t); }
    const camO = R.camera, sA = ismooth(0.81, 0.84, p);
    if (sA > 0.002){ W.spectrum(W.spP.ctx, 512, 280, t, false); W.spP.dirty(); const land = camO.aspect >= 1.05; PN.place(W.spP, camO, land ? 0.2*Math.min(1, camO.aspect - 0.6) : 0, land ? 0.12 : 0.22, land ? 0.62 : 0.84*Math.min(1, camO.aspect*1.25)); }
    W.spP.show(sA);
  };
  W.labels = p => {
    const a = iwin(p, 0.02, 0.04, 0.09, 0.105), b = iwin(p, 0.18, 0.2, 0.25, 0.265), c = iwin(p, 0.3, 0.32, 0.38, 0.395), d = iwin(p, 0.43, 0.45, 0.52, 0.535), e = iwin(p, 0.7, 0.72, 0.79, 0.81);
    const L = v => F.localToWorld(v.clone()), PR = v => probe.localToWorld(v.clone());
    return [
      {pos:W.mon.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 22, 0)), text:'Ecógrafo', a},
      {pos:PR(new T.Vector3(7.5, 4.2, 0)), text:'Elementos piezoeléctricos', a:b},
      {pos:PR(new T.Vector3(-8, 11.6, 0)), text:'Bloque de respaldo', a:b, left:true},
      {pos:PR(new T.Vector3(0, 0, 0)), text:'Gel: sin aire entre sonda y piel', a:b, left:true},
      {pos:L(new T.Vector3(-70, -4, 6)), text:'Ventana temporal: hueso delgado', a:c},
      {pos:L(new T.Vector3(-30, 40, -12)), text:'Pulsos emitidos (azul), ecos de vuelta (ámbar)', a:d},
      {pos:L(W.mcaC.getPoint(0.4)), text:'Arteria cerebral media: flujo hacia la sonda', a:e},
    ];
  };
  immLinearize(scene);
  return W;
}


const BLUSH_OVERLAY = () => ({key:'blush', uniforms:{uBlush:{value:0}}, decl:'uniform float uBlush;',
  code:`float sideB = smoothstep(4.0, -4.0, vMni.x); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.3, 0.32, 0.38), uBlush*sideB*0.6);`});

/* =====================================================================
   Angiography walkthrough
     0.00 the suite · 0.11 in at the groin · 0.23 up the aorta · 0.37 into the carotid
     0.49 contrast in · 0.61 capillaries then veins · 0.72 X-ray frames · 0.83 subtraction · 0.94 the angiogram
   Body vessels are drawn in the mannequin's standing coordinates (cm, y up, facing +z);
   the head's vessels in MNI millimetres, from the same tree the viewer uses.
   ===================================================================== */
function buildDSA(scene, renderer, R){
  const T = THREE, W = {}, M = immScanMats(), F0 = -124;
  const S = immStudio(scene, renderer);
  W.P = immTable(scene); W.P.table.position.set(0, -22, -16);
  const root = W.P.man.j.root;
  /* ---------- the C-arm, floor-mounted at the head end ---------- */
  const carm = new T.Group(); scene.add(carm); W.carm = carm;
  const base = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(80, 90, 12), {depth:12, bevelEnabled:true, bevelThickness:2, bevelSize:2, bevelSegments:3}), M.plinth)); base.rotation.x = -Math.PI/2; base.position.set(0, F0, -170); scene.add(base);
  const colm = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(46, 96, 12), {depth:46, bevelEnabled:true, bevelThickness:3, bevelSize:3, bevelSegments:4}), M.shell)); colm.position.set(0, F0 + 60, -195); scene.add(colm);
  const larm = ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(34, 30, 10), {depth:84, bevelEnabled:true, bevelThickness:3, bevelSize:3, bevelSegments:4}), M.shell)); larm.position.set(0, -6, -190); scene.add(larm);
  const RC = 84, cpts = []; for (let i = 0; i <= 40; i++){ const a = -1.38 + 2.76*i/40; cpts.push(new T.Vector3(0, RC*Math.sin(a), -RC*Math.cos(a))); }
  const cshape = immRoundRect(14, 7, 3);
  const C = ishadow(new T.Mesh(new T.ExtrudeGeometry(cshape, {steps:80, extrudePath:new T.CatmullRomCurve3(cpts), bevelEnabled:false}), M.shell)); carm.add(C);
  const pivot = ishadow(new T.Mesh(new T.CylinderGeometry(12, 12, 16, 40), M.trim)); pivot.rotation.x = Math.PI/2; pivot.position.set(0, 0, -RC - 10); carm.add(pivot);
  const tubeH = new T.Group(); tubeH.position.set(0, -66, -6); carm.add(tubeH); W.tubeH = tubeH;
  tubeH.add(ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(30, 22, 8), {depth:34, bevelEnabled:true, bevelThickness:2, bevelSize:2, bevelSegments:4}), M.shell)).translateZ(-17));
  const colli = new T.Mesh(new T.BoxGeometry(16, 6, 16), M.dark); colli.position.y = 13; tubeH.add(colli);
  const tbr = ishadow(new T.Mesh(new T.BoxGeometry(12, 14, 16), M.shell)); tbr.position.set(0, -78, -16); carm.add(tbr);
  const det = new T.Group(); det.position.set(0, 58, -2); carm.add(det); W.det = det;
  det.add(ishadow(new T.Mesh(new T.ExtrudeGeometry(immRoundRect(48, 48, 6), {depth:9, bevelEnabled:true, bevelThickness:2, bevelSize:2, bevelSegments:4}), M.shell)).rotateX(Math.PI/2).translateZ(-4.5));
  const detFace = new T.Mesh(new T.PlaneGeometry(42, 42), new T.MeshStandardMaterial({color:0x2c363c, roughness:0.4, metalness:0.3})); detFace.rotation.x = Math.PI/2; detFace.position.y = -7; det.add(detFace);
  const dbr = ishadow(new T.Mesh(new T.BoxGeometry(12, 14, 20), M.shell)); dbr.position.set(0, 78, -18); carm.add(dbr);
  W.beamMat = new T.MeshBasicMaterial({color:0x3d7bff, transparent:true, opacity:0, depthWrite:false, side:T.DoubleSide});
  W.beam = new T.Mesh(new T.ConeGeometry(20, 118, 4, 1, true), W.beamMat); W.beam.rotation.y = Math.PI/4; W.beam.position.set(0, -6, -2); W.beam.renderOrder = 6; carm.add(W.beam);
  S.blob(0, -170, 140, 140);
  /* ---------- ceiling monitors ---------- */
  W.monCv = document.createElement('canvas'); W.monCv.width = 1024; W.monCv.height = 512; W.monTex = new T.CanvasTexture(W.monCv); W.monTex.encoding = T.sRGBEncoding;
  const mons = new T.Group(); mons.position.set(78, 44, 18); mons.rotation.y = -0.95; scene.add(mons); W.mons = mons;
  mons.add(ishadow(new T.Mesh(new T.BoxGeometry(124, 64, 4), M.dark)));
  const msc = new T.Mesh(new T.PlaneGeometry(120, 60), new T.MeshBasicMaterial({map:W.monTex, toneMapped:false})); msc.position.z = 2.1; mons.add(msc);
  const boom = new T.Mesh(new T.CylinderGeometry(2.5, 2.5, 150, 16), M.steel); boom.position.set(0, 107, -6); mons.add(boom);
  /* ---------- vessels of the body (standing coordinates) ---------- */
  const red = new T.MeshPhysicalMaterial({color:0xd9412b, roughness:0.3, transparent:true, opacity:0, depthWrite:false}); W.red = red;
  const blue = new T.MeshPhysicalMaterial({color:0x3d6bdc, roughness:0.3, transparent:true, opacity:0, depthWrite:false}); W.blue = blue;
  const V3 = a => new T.Vector3(...a), tube = (pts, r, mat, seg = 60) => { const m = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(V3), false, 'centripetal'), seg, r, 10), mat); m.renderOrder = 3; root.add(m); return m; };
  const aorta = [[-1, 136, 3], [-1.8, 140, 3.5], [-1.5, 145, 3], [0, 146.6, 1.2], [1.8, 145.4, -1.2], [2, 141, -2.5], [1.8, 134, -2.4], [1.2, 126, -1], [0.6, 116, 0.6], [0, 108, 1.5]];
  tube(aorta, 1.2, red, 120);
  tube([[0, 108, 1.5], [-4.5, 103, 2.5], [-8, 95, 4], [-9.5, 86, 5.5], [-9.8, 76, 5]], 0.6, red);
  tube([[0, 108, 1.5], [4.5, 103, 2.5], [8, 95, 4], [9.5, 86, 5.5], [9.8, 76, 5]], 0.6, red);
  tube([[-0.8, 146.4, 2.0], [-2.6, 149, 2.3]], 0.55, red, 10);
  tube([[-2.6, 149, 2.3], [-3.2, 154, 2.2], [-2.6, 157.2, 2.1]], 0.33, red, 24);
  tube([[-2.6, 149, 2.3], [-6, 149.5, 1.5], [-12, 147.5, 0.5]], 0.38, red, 24);
  tube([[0.3, 146.8, 1.4], [1.6, 149.5, 1.6], [2.6, 153, 1.9], [2.4, 156.7, 2.1]], 0.35, red, 30);
  tube([[1.4, 146.2, -0.3], [5, 148, 0], [12, 147.5, 0.5]], 0.38, red, 24);
  // the catheter: in at the right femoral artery, up the aorta, over the arch, into the left common carotid
  const cath = [[-10.2, 74, 7.5], [-9.8, 78, 5.2], [-9.5, 86, 5.5], [-8, 95, 4], [-4.5, 103, 2.5], [0, 108, 1.5], [0.6, 116, 0.6], [1.2, 126, -1], [1.8, 134, -2.4], [2, 141, -2.5], [1.8, 145.4, -1.2], [0.7, 146.5, 0.4], [0.35, 147.2, 1.4], [1.6, 149.6, 1.6], [2.6, 153, 1.9], [2.5, 155.6, 2.0]];
  W.cathC = new T.CatmullRomCurve3(cath.map(V3), false, 'centripetal');
  W.cath = new T.Mesh(new T.TubeGeometry(W.cathC, 400, 0.13, 8), new T.MeshStandardMaterial({color:0x1d2630, roughness:0.35, metalness:0.2})); W.cath.renderOrder = 4; root.add(W.cath); W.cathN = W.cath.geometry.index.count;
  W.tip = new T.Sprite(new T.SpriteMaterial({map:S.glow, color:0x2f6bff, transparent:true, opacity:0, depthWrite:false})); W.tip.scale.setScalar(4); root.add(W.tip);
  const sheath = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 5, 16), new T.MeshStandardMaterial({color:0x0050ff, roughness:0.4})); sheath.position.set(-10.3, 72.4, 9); sheath.rotation.x = 0.9; root.add(sheath);
  /* ---------- the head: brain and the cerebral vessels (MNI frame on the mannequin's head) ---------- */
  const HF = immMNIFrame('upright', [0, -15, -5], [0, 164, 1.6]); root.add(HF); W.HF = HF;
  W.blushOv = BLUSH_OVERLAY(); W.brain = immBrain(HF, {overlay:W.blushOv, order:2});
  W.ink = new T.MeshPhysicalMaterial({color:0x121a24, roughness:0.25, clearcoat:0.6, transparent:true});
  W.cv = []; W.base = [];
  const gen = {ICA:[0, 0.26], M1:[0.22, 0.38], M1d:[0.32, 0.44], A1:[0.24, 0.38], PCom:[0.26, 0.4], ACom:[0.34, 0.44], M2s:[0.32, 0.42], M2i:[0.32, 0.42], A2:[0.3, 0.41], M3a:[0.36, 0.45], M3b:[0.36, 0.45], M3c:[0.36, 0.45], M3d:[0.36, 0.45], peri:[0.35, 0.44], callosomarg:[0.36, 0.45]};
  W.lazyV = () => {
    if (W.vBuilt || !META || !META.landmarks) return; W.vBuilt = true;
    for (const [name, grp, type, r, pts0, flag] of VESSELS){
      let pts = pts0; if (name === 'SSS') pts = META.landmarks.sss.map(p=>p.slice()).reverse().concat([[0, -104, 8]]);
      const mirror = flag !== 'mid' && !(grp === 'VEIN' && (name === 'SSS' || name === 'SS'));
      for (const side of mirror ? [-1, 1] : [1]){
        const P = pts.map(p=>side < 0 || !mirror ? p.slice() : [-p[0], p[1], p[2]]);
        const curve = new T.CatmullRomCurve3(P.map(mniV), false, 'centripetal'), seg = Math.max(12, P.length*14);
        const b = new T.Mesh(new T.TubeGeometry(curve, seg, r*0.92, 8), type ? blue : red); b.renderOrder = 3; HF.add(b); W.base.push(b);
        const left = side < 0 || !mirror, art = !type;
        if ((art && grp === 'ICA' && left) || type){
          const c = new T.Mesh(new T.TubeGeometry(curve, seg, r, 10), W.ink); c.renderOrder = 4; c.geometry.setDrawRange(0, 0); HF.add(c);
          W.cv.push({m:c, n:c.geometry.index.count, curve, r, art, win:art ? (gen[name] || [0.34, 0.45]) : (name === 'ICV' ? [0.6, 0.74] : name === 'SSS' ? [0.62, 0.8] : name === 'SS' ? [0.7, 0.82] : [0.72, 0.86])});
        }
      }
    }
  };
  /* ---------- panels: mask, live frame, subtracted ---------- */
  const PN = immPanels(scene); W.maskP = PN.make('MÁSCARA · ANTES DEL CONTRASTE'); W.liveP = PN.make('IMAGEN CON CONTRASTE'); W.subP = PN.make('SUSTRAÍDA'); W.subP.keepLab = true;
  W.skull = (c, s, ox = 0, oy = 0) => {   // a stylised skull in the frontal (AP) projection
    const X = x => ox + (90 - x)/180*s, Y = z => oy + (100 - z)/200*s;
    c.save(); c.fillStyle = '#d7dcdf'; c.fillRect(ox, oy, s, s);
    const g = c.createRadialGradient(X(0), Y(20), s*0.1, X(0), Y(20), s*0.42); g.addColorStop(0, 'rgba(70,80,86,.25)'); g.addColorStop(0.82, 'rgba(70,80,86,.35)'); g.addColorStop(0.92, 'rgba(40,48,52,.75)'); g.addColorStop(1, 'rgba(70,80,86,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(X(0), Y(14), s*0.4, s*0.46, 0, 0, Math.PI*2); c.fill();
    c.fillStyle = 'rgba(40,48,52,.35)'; for (const sx of [-1, 1]){ c.beginPath(); c.ellipse(X(sx*32), Y(-38), s*0.08, s*0.07, 0, 0, Math.PI*2); c.fill(); c.beginPath(); c.ellipse(X(sx*42), Y(-62), s*0.12, s*0.025, sx*0.3, 0, Math.PI*2); c.fill(); }
    c.fillStyle = 'rgba(40,48,52,.25)'; c.beginPath(); c.ellipse(X(0), Y(-92), s*0.22, s*0.06, 0, 0, Math.PI); c.fill(); c.restore();
  };
  W.vessels2D = (c, s, ph, ox = 0, oy = 0) => {
    const X = x => ox + (90 - x)/180*s, Y = z => oy + (100 - z)/200*s, pxmm = s/180;
    const art = 1 - ismooth(0.45, 0.62, ph), ven = ismooth(0.6, 0.72, ph)*(1 - 0.6*ismooth(0.92, 1, ph)), blush = ismooth(0.44, 0.56, ph)*(1 - ismooth(0.66, 0.82, ph));
    c.save(); c.lineCap = 'round';
    if (blush > 0.01){ const g = c.createRadialGradient(X(-38), Y(20), s*0.04, X(-38), Y(20), s*0.32); g.addColorStop(0, `rgba(12,22,27,${0.22*blush})`); g.addColorStop(1, 'rgba(12,22,27,0)'); c.fillStyle = g; c.fillRect(ox, oy, s, s); }
    for (const v of W.cv){ const f = iclamp((ph - v.win[0])/(v.win[1] - v.win[0])), a = v.art ? art : ven; if (f <= 0 || a <= 0.01) continue;
      const n = 30, k = Math.max(2, Math.round(n*f)); c.strokeStyle = `rgba(12,22,27,${0.88*a})`; c.lineWidth = Math.max(1, 2*v.r*pxmm); c.beginPath();
      for (let i = 0; i < k; i++){ const q = v.curve.getPoint(i/(n - 1)); i ? c.lineTo(X(q.x), Y(q.z)) : c.moveTo(X(q.x), Y(q.z)); } c.stroke(); }
    c.restore();
  };
  // where things are, in the world (the patient never moves here)
  scene.updateMatrixWorld(true);
  const wpt = f => root.localToWorld(W.cathC.getPoint(f)), K = v => [v.x, v.y, v.z];
  const g0 = wpt(0.06), aM = wpt(0.45), arch = wpt(0.74), neck = wpt(0.97), headC = HF.localToWorld(new T.Vector3(0, -18, 12));
  W.headC = headC;
  const cam = immCamPath(R, [
    [0.00, [-360, 160, 400], [0, -30, -20]],
    [0.10, [-210, 110, 240], [0, -10, 20]],
    [0.16, K(g0.clone().add(new T.Vector3(-46, 40, 30))), K(g0)],
    [0.22, K(g0.clone().add(new T.Vector3(-40, 34, 10))), K(g0.clone().add(new T.Vector3(3, 0, -10)))],
    [0.30, K(aM.clone().add(new T.Vector3(-46, 40, 6))), K(aM)],
    [0.36, K(arch.clone().add(new T.Vector3(-36, 30, 18))), K(arch)],
    [0.43, K(neck.clone().add(new T.Vector3(-30, 24, 16))), K(neck)],
    [0.50, K(headC.clone().add(new T.Vector3(-22, 24, 17))), K(headC)],
    [0.60, K(headC.clone().add(new T.Vector3(-26, 20, 9))), K(headC)],
    [0.70, K(headC.clone().add(new T.Vector3(-20, 27, -13))), K(headC)],
    [0.78, [-170, 70, 150], [10, 0, 0]],
    [0.86, [-120, 40, 120], [0, 0, 0]],
    [1.00, [-80, 30, 100], [0, 0, 0]],
  ], {drift:0.09});
  W.vec = new T.Vector3();
  W.update = (p, t, dt) => {
    const P = W.P; W.brain.build(); W.lazyV();
    cam(p, t, ilerp(36, 42, ismooth(0.12, 0.2, p)), p < 0.12 ? 6 : 1);
    R.saoOn = false;
    // the body turns to glass to show the route
    const glass = ismooth(0.11, 0.16, p)*(1 - 0.35*ismooth(0.74, 0.8, p));
    P.fadeBody(0.88*glass); P.fadeTable(0.3*glass);
    red.opacity = 0.32*glass; blue.opacity = 0.22*glass*ismooth(0.5, 0.6, p);
    W.brain.set(0.85*ismooth(0.42, 0.5, p));
    // the catheter advances
    const f = 0.18*ismooth(0.12, 0.22, p) + 0.54*ismooth(0.23, 0.36, p) + 0.28*ismooth(0.37, 0.47, p);
    W.cath.geometry.setDrawRange(0, Math.floor(W.cathN*f/6)*6); W.cath.visible = f > 0.002;
    W.cathC.getPoint(Math.max(0.001, f), W.tip.position); W.tip.material.opacity = 0.9*iwin(p, 0.11, 0.13, 0.46, 0.5); W.tip.visible = W.tip.material.opacity > 0.01;
    // the run: arterial → capillary → venous; later it loops for the X-ray frames, then holds in the arterial phase
    let ph = ismooth(0.49, 0.71, p);
    if (p > 0.72) ph = ilerp((t/6) % 1, 0.45, ismooth(0.82, 0.85, p));
    W.ph = ph;
    const art = 1 - ismooth(0.45, 0.62, ph), ven = ismooth(0.6, 0.72, ph)*(1 - 0.6*ismooth(0.92, 1, ph));
    W.cv.forEach(v=>{ const fr = iclamp((ph - v.win[0])/(v.win[1] - v.win[0])); v.m.geometry.setDrawRange(0, Math.floor(v.n*fr/6)*6); v.m.visible = fr > 0 && (v.art ? art : ven) > 0.02 && p > 0.48; });
    W.ink.opacity = 1; W.blushOv.uniforms.uBlush.value = ismooth(0.3, 0.45, ph)*(1 - ismooth(0.62, 0.8, ph));
    // X-ray beam on during the frames
    const xr = iwin(p, 0.72, 0.75, 0.82, 0.85); W.beamMat.opacity = 0.14*xr*(0.8 + 0.2*Math.sin(t*18)); W.beam.visible = xr > 0.01;
    // monitors: live fluoroscopy and the subtracted run
    if (!W.monT || t - W.monT > 1/10){ W.monT = t; const c = W.monCv.getContext('2d'); c.fillStyle = '#05080b'; c.fillRect(0, 0, 1024, 512);
      W.skull(c, 480, 16, 16); W.vessels2D(c, 480, ph, 16, 16); c.fillStyle = '#ffffff'; c.fillRect(528, 16, 480, 480); W.vessels2D(c, 480, ph, 528, 16);
      c.fillStyle = '#5f8dff'; c.font = '20px monospace'; c.fillText('EN VIVO', 28, 44); c.fillText('ASD · ACI IZQUIERDA', 540, 44); W.monTex.needsUpdate = true; }
    // panels
    const camO = R.camera, pA = ismooth(0.83, 0.86, p), hand = ismooth(0.93, 0.97, p);
    if (pA > 0.002){ const key = Math.round(ph*200); if (W.pk !== key){ W.pk = key;
        W.maskP.ctx.fillStyle = '#000'; W.skull(W.maskP.ctx, 256); W.maskP.dirty();
        W.skull(W.liveP.ctx, 256); W.vessels2D(W.liveP.ctx, 256, ph); W.liveP.dirty();
        W.subP.ctx.fillStyle = '#f4f6f7'; W.subP.ctx.fillRect(0, 0, 256, 256); W.vessels2D(W.subP.ctx, 256, ph); W.subP.dirty(); }
      const land = camO.aspect >= 1.05;
      if (land){ const w = ilerp(0.3, 0.8, hand), gap = (1 - hand)*0.34; PN.place(W.maskP, camO, -gap*1.02 + 0.06, 0.06*(1 - hand), w); PN.place(W.liveP, camO, 0.06, 0.06*(1 - hand), w); PN.place(W.subP, camO, gap*1.02 + 0.06 - 0.06*hand, 0.06*(1 - hand), w); }
      else { const w = ilerp(0.22, 0.6, hand)*Math.min(1, camO.aspect*1.6), gap = (1 - hand)*w*1.14; PN.place(W.maskP, camO, 0, 0.12 + gap, w); PN.place(W.liveP, camO, 0, 0.12, w); PN.place(W.subP, camO, 0, 0.12 - gap + 0.04*hand, w); }
      const lab = Math.pow(1 - hand, 3); W.maskP.show(pA*(1 - hand), pA*lab*(1 - hand)); W.liveP.show(pA*(1 - hand), pA*lab*(1 - hand)); W.subP.show(pA, pA);
    } else { W.maskP.show(0); W.liveP.show(0); W.subP.show(0); }
  };
  W.labels = p => {
    const a = iwin(p, 0.02, 0.04, 0.09, 0.105), b = iwin(p, 0.15, 0.17, 0.21, 0.225), c = iwin(p, 0.33, 0.35, 0.36, 0.37), d = iwin(p, 0.42, 0.44, 0.47, 0.49), e = iwin(p, 0.54, 0.56, 0.6, 0.61), f = iwin(p, 0.66, 0.68, 0.71, 0.72), g = iwin(p, 0.75, 0.77, 0.81, 0.83);
    const RW = v => root.localToWorld(new T.Vector3(...v)), H = v => HF.localToWorld(new T.Vector3(...v));
    return [
      {pos:new T.Vector3(0, 0, -RC - 6), text:'Brazo en C', a, left:true},
      {pos:W.mons.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 36, 0)), text:'Imágenes en directo en los monitores del techo', a},
      {pos:RW([-9.8, 78, 5.2]), text:'Arteria femoral derecha', a:b, left:true},
      {pos:RW([0, 146.6, 1.2]), text:'Arco aórtico', a:c, left:true},
      {pos:RW([2.6, 153, 1.9]), text:'Arteria carótida común izquierda', a:d},
      {pos:H([-34, 4, -9]), text:'Arteria cerebral media', a:e},
      {pos:H([-3, 36, 24]), text:'Arteria cerebral anterior', a:e, left:true},
      {pos:H([0, -60, 72]), text:'Seno sagital superior', a:f},
      {pos:W.tubeH.getWorldPosition(new T.Vector3()), text:'Tubo de rayos X bajo la mesa', a:g, left:true},
      {pos:W.det.getWorldPosition(new T.Vector3()), text:'Detector de panel plano', a:g},
    ];
  };
  immLinearize(scene);
  return W;
}

/* =====================================================================
   Brain Lab feedback: a 3D mannequin that answers cortical stimulation.
   Replaces the flat SVG figure (kept only as a fallback without WebGL).
   The figure faces the reader, so the patient's right is on the reader's
   left; stimulating one hemisphere lights and moves the opposite side.
   Joints come from buildMannequin: xL = the mannequin's left (+x).
   ===================================================================== */
const LB = {r:null, failed:false, raf:0, yaw:0, pitch:0.05, plan:null, evT0:null, evKey:null, dist:0, drag:null};
if (location.hostname === 'localhost') window.__LB = {LB, LAB, stimEffect, renderLabPanel, lbPose, lbPlan};
const LB_PART = {
  toes:{lit:['ankle'], mv:'ankle'}, foot:{lit:['ankle'], mv:'ankle'}, leg:{lit:['knee', 'ankle'], mv:'knee'}, hip:{lit:['hip'], mv:'hip'},
  trunk:{lit:['spine'], mv:'trunk'}, shoulder:{lit:['shoulder'], mv:'shoulder'}, arm:{lit:['shoulder', 'elbow'], mv:'elbow'},
  hand:{lit:['wrist', 'fingers', 'thumb'], mv:'hand'}, fingers:{lit:['fingers', 'thumb'], mv:'fingers'}, thumb:{lit:['thumb'], mv:'thumb'},
  neck:{lit:['neck'], mv:'neck'}, face:{lit:['cheek', 'lips', 'brow', 'eye'], mv:'face', face:true}, lips:{lit:['lips'], mv:'lips', face:true},
  tongue:{lit:['tongue'], mv:'tongue', face:true}, throat:{lit:['neck', 'lips'], mv:'throat', face:true},
};
const LB_MID = new Set(['spine', 'neck', 'head', 'tongue', 'nose']);
const LB_FACEKEYS = ['browL', 'browR', 'eyeL', 'eyeR', 'lidL', 'lidR', 'cheekL', 'cheekR', 'lipsL', 'lipsR', 'tongue', 'nose', 'earL', 'earR'];
const LB_KIND = {move:'Respuesta motora', feel:'Sensación', see:'Visual', hear:'Auditiva', speech:'Lenguaje', eyes:'Movimiento ocular', memory:'Experiencial', self:'Experiencial', emotion:'Límbico', gut:'Visceral', quiet:'Sin movimiento visible'};
const LB_COL = {move:0x2f6bff, feel:0x00a389, see:0xe0a01c, hear:0x00a389, speech:0x2f6bff, eyes:0x2f6bff, memory:0x8a5cf6, self:0x8a5cf6, emotion:0xe8962a, gut:0xe8962a, quiet:0x00a389};

// what lights up, what moves, what floats above the body
function lbPlan(e){
  const sides = e.side === 'both' ? ['L', 'R'] : [e.side === 'right' ? 'R' : 'L'];
  const J = names => { const out = []; for (const n of names){ if (LB_MID.has(n)) out.push(n); else for (const s of sides) out.push(n + s); } return [...new Set(out)]; };
  const P = {lit:[], col:LB_COL[e.kind] || 0x2f6bff, mv:null, sides, bubble:null, glow:[], ghost:false, kind:e.kind};
  const k = e.kind;
  if ((k === 'move' || k === 'feel') && LB_PART[e.part]){ const d = LB_PART[e.part]; P.lit = J(d.lit); P.mv = k === 'move' ? d.mv : 'feel'; P.glow = d.face ? [] : J([d.lit[0]]); P.face = !!d.face; }
  else if (e.part === 'posture'){ P.sides = ['L', 'R']; P.lit = ['shoulderL', 'shoulderR', 'elbowL', 'elbowR', 'neck']; P.mv = 'posture'; P.glow = ['shoulderL', 'shoulderR']; }
  else if (k === 'eyes'){ P.lit = ['eyeL', 'eyeR']; P.mv = 'eyes'; P.face = true; }
  else if (k === 'speech'){ P.lit = ['lipsL', 'lipsR', 'tongue']; P.mv = 'speech'; P.face = true; P.bubble = /habla/i.test(e.title) ? 'uno, dos, tre…' : 'a… ¿lápiz? no…'; }
  else if (k === 'hear'){ P.lit = sides.map(s=>'ear' + s); P.mv = 'hear'; P.face = true; P.glow = sides.map(s=>'ear' + s); }
  else if (k === 'see'){ P.lit = ['eyeL', 'eyeR']; P.mv = 'see'; P.face = true; P.glow = ['eyes']; }
  else if (k === 'memory'){ P.lit = ['head']; P.mv = 'dream'; P.face = true; P.bubble = 'déjà vu'; }
  else if (k === 'self'){ P.lit = ['head']; P.mv = 'dream'; P.ghost = true; }
  else if (k === 'emotion'){
    if (/epigástric|náusea/i.test(e.title)){ P.lit = ['head', 'spine']; P.glow = ['gut']; P.mv = 'fear'; }
    else { P.face = true; P.lit = ['head']; P.mv = /sonrisa/i.test(e.title) ? 'smile' : /ánimo/i.test(e.title) ? 'mood' : /impulso/i.test(e.title) ? 'urge' : 'fear'; } }
  else if (k === 'gut'){ P.lit = ['spine', 'neck']; P.glow = ['gut']; P.mv = 'nausea'; }
  else if (k === 'quiet' && /temblor/i.test(e.title)){ P.lit = J(['wrist', 'fingers', 'thumb']); P.mv = 'tremor'; }
  if (P.lit.includes('head')) P.lit.push(...LB_FACEKEYS);
  return P;
}
function lbTag(e){
  const nm = {toes:'toes', foot:'foot', leg:'leg', hip:'hip', trunk:'trunk', shoulder:'shoulder', arm:'arm', hand:'hand', fingers:'fingers', thumb:'thumb', neck:'neck', face:'face', lips:'lips', tongue:'tongue', throat:'throat'}[e.part];
  const side = e.side === 'both' ? 'ambos lados' : (e.side === 'right' ? 'derecho' : e.side === 'left' ? 'izquierdo' : e.side);
  if ((e.kind === 'move' || e.kind === 'feel') && nm) return `${LB_KIND[e.kind]} · ${e.side === 'both' ? PART_LABEL[nm] + ', ambos lados' : side + ' ' + PART_LABEL[nm]}`;
  if (e.kind === 'eyes') return `${LB_KIND.eyes} · hacia el lado ${side}`;
  return LB_KIND[e.kind] || 'Respuesta';
}

function lbBuild(){
  if (LB.r || LB.failed) return LB.r;
  if (typeof THREE === 'undefined' || typeof buildMannequin !== 'function'){ LB.failed = true; return null; }
  try {
    const T = THREE, cv = document.createElement('canvas');
    cv.className = 'lb-cv'; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Cuerpo 3D que muestra la respuesta a la estimulación. Arrástrelo para girarlo; pulse para repetir.');
    const r = new T.WebGLRenderer({canvas:cv, antialias:true, alpha:true, powerPreference:'high-performance'});
    r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 0.8; r.setClearColor(0xffffff, 0);
    const sc = new T.Scene(); sc.environment = immStudioEnv(r, {top:0.7, floor:0.32, horizon:0.3, panel:1.1});
    sc.add(new T.HemisphereLight(0xffffff, 0xb9c4ca, 0.22));
    const key = new T.DirectionalLight(0xffffff, 1.15); key.position.set(-190, 300, 260); sc.add(key);
    const rim = new T.DirectionalLight(0xd6e4ff, 0.75); rim.position.set(240, 210, -280); sc.add(rim);
    const lin = h => new T.Color(h).convertSRGBToLinear();
    // platform: a white plinth with a thin signal-blue edge light and a soft contact shadow
    const disc = new T.Mesh(new T.CylinderGeometry(38, 41, 3, 96), new T.MeshPhysicalMaterial({color:lin(0xf3f5f6), roughness:0.3, clearcoat:0.6})); disc.position.y = -1.6; sc.add(disc);
    LB.ringMat = new T.MeshStandardMaterial({color:lin(0x0050ff), emissive:lin(0x0050ff), emissiveIntensity:1.1});
    const ring = new T.Mesh(new T.TorusGeometry(38.4, 0.45, 8, 160), LB.ringMat); ring.rotation.x = Math.PI/2; ring.position.y = 0.05; sc.add(ring);
    const sh = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({map:immCanvasTex(128, 128, (x, w)=>{ const g = x.createRadialGradient(w/2, w/2, 0, w/2, w/2, w/2); g.addColorStop(0, 'rgba(20,30,36,.32)'); g.addColorStop(1, 'rgba(20,30,36,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }), transparent:true, depthWrite:false}));
    sh.rotation.x = -Math.PI/2; sh.position.y = 0.15; sh.scale.set(56, 32, 1); sc.add(sh);
    // the body: one material per segment so each part can light up on its own
    const base = new T.MeshPhysicalMaterial({color:lin(0xbcc6cc), roughness:0.42, metalness:0, clearcoat:0.45, clearcoatRoughness:0.3});
    const M = buildMannequin(T, {material:base, segments:48}); sc.add(M.group);
    M.j.shoulderL.rotation.z = 0.2; M.j.shoulderR.rotation.z = -0.2;       // anatomical position: arms a little out, palms forward
    M.j.elbowL.rotation.x = M.j.elbowR.rotation.x = -0.06;
    const jname = new Map(Object.entries(M.j).map(([k, g])=>[g, k]));
    LB.parts = {};
    for (const m of M.meshes){ const jn = jname.get(m.parent); m.material = base.clone(); m.userData.h = 0; m.userData.base = m.material.color.clone(); m.geometry.computeBoundingSphere(); (LB.parts[jn] = LB.parts[jn] || []).push(m); }
    LB.base = Object.fromEntries(Object.entries(M.j).map(([k, g])=>[k, g.rotation.clone()]));
    // soft halos over the responding part
    LB.glowTex = immGlowTex(); LB.glows = [];
    for (let i = 0; i < 4; i++){ const s = new T.Sprite(new T.SpriteMaterial({map:LB.glowTex, color:0x2f6bff, transparent:true, opacity:0, depthWrite:false, depthTest:false})); s.scale.set(44, 44, 1); s.renderOrder = 5; sc.add(s); LB.glows.push(s); }
    // out-of-body experience: a translucent copy floating face-down above
    LB.ghostMat = new T.MeshBasicMaterial({color:lin(0x8a5cf6), transparent:true, opacity:0, depthWrite:false});
    const gw = new T.Group(), gh = M.group.clone(true); gh.traverse(o=>{ if (o.isMesh) o.material = LB.ghostMat; }); gh.rotation.y = -Math.PI/2; gw.add(gh);
    gw.rotation.z = Math.PI/2; gw.scale.setScalar(0.5); gw.position.set(44, 190, -12); gw.visible = false; sc.add(gw); LB.ghost = gw;
    lbFace(T, M.j.head, base, lin);
    LB.r = r; LB.cv = cv; LB.scene = sc; LB.M = M; LB.cam = new T.PerspectiveCamera(24, 1, 10, 4000); LB.hi = new T.Color(); LB.hiD = new T.Color(); LB.v = new T.Vector3();
    // drag to turn, click to replay, double-click to face front
    cv.addEventListener('pointerdown', e=>{ LB.drag = {x:e.clientX, y:e.clientY, yaw:LB.yaw, pitch:LB.pitch, moved:false}; cv.setPointerCapture(e.pointerId); cv.classList.add('dragging'); });
    cv.addEventListener('pointermove', e=>{ const d = LB.drag; if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.hypot(dx, dy) > 4) d.moved = true; LB.yaw = d.yaw - dx*0.012; LB.pitch = Math.max(-0.12, Math.min(0.55, d.pitch + dy*0.004)); LB.yawHome = false; });
    const up = () => { const d = LB.drag; if (!d) return; LB.drag = null; cv.classList.remove('dragging'); if (!d.moved && LB.plan) LB.evT0 = performance.now(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('dblclick', ()=>{ LB.yawHome = true; });
  } catch(err){ console.warn('Cuerpo 3D no disponible', err); LB.failed = true; LB.r = null; }
  return LB.r;
}

function lbMount(host, s){
  if (!lbBuild() || !host) return false;
  host.innerHTML = `<span class="lb-tag"></span><span class="lb-side" data-s="R" title="Derecha del paciente">R</span><span class="lb-side" data-s="L" title="Izquierda del paciente">L</span><span class="lb-bub" hidden></span><span class="lb-hint">De frente · arrastre para girar · pulse para repetir</span><button type="button" class="lb-view">Cara</button>`;
  host.prepend(LB.cv); LB.host = host;
  LB.sideR = host.querySelector('[data-s="R"]'); LB.sideL = host.querySelector('[data-s="L"]'); LB.bub = host.querySelector('.lb-bub');
  const tag = host.querySelector('.lb-tag');
  LB.viewBtn = host.querySelector('.lb-view');
  LB.viewBtn.addEventListener('click', ()=>{ LB.view = (LB.fz ?? 0) > 0.5 ? 'body' : 'face'; });
  if (s){
    if (LB.evKey !== s.t0){ LB.evKey = s.t0; LB.evT0 = performance.now(); LB.plan = lbPlan(s.effect); LB.yawHome = true; LB.view = null; }
    tag.textContent = lbTag(s.effect); tag.style.setProperty('--c', '#' + new THREE.Color(LB.plan.col).getHexString());
    if (LB.plan.bubble){ LB.bub.textContent = LB.plan.bubble; LB.bub.hidden = false; }
  } else { LB.plan = null; LB.evKey = null; tag.textContent = 'Esperando estimulación'; tag.classList.add('idle'); }
  if (!LB.raf) LB.raf = requestAnimationFrame(lbFrame);
  return true;
}

/* ---------- the face: sculpted features on the blank head, each one a separate part that can light and move ---------- */
// the head's own surface (buildMannequin's egg with its jaw taper), so features sit flush on it
const lbHeadZ = (x, y) => { const yy = y - 10.5, k = yy < -2 ? Math.min(1, (-2 - yy)/9) : 0, x0 = Math.abs(x)/(1 - 0.22*k), q = 1 - (x0/7.6)**2 - (yy/11.2)**2; return (0.8 + 9.6*Math.sqrt(Math.max(0, q)))*(1 - 0.12*k) - 0.8*k; };
function lbFace(T, head, base, lin){
  const F = LB.F = {eye:{}, lid:{}, brow:{}, cheek:{}, lips:{}, key:''};
  const reg = (m, key) => { m.userData.part = key; m.userData.h = 0; m.userData.base = m.material.color.clone(); m.geometry.computeBoundingSphere(); (LB.parts[key] = LB.parts[key] || []).push(m); return m; };
  const mat = (hex, o = {}) => { const m = base.clone(); m.color = lin(hex); Object.assign(m, o); return m; };
  const ell = (rx, ry, rz, seg = 28) => { const g = new T.SphereGeometry(1, seg, Math.round(seg*0.7)); g.scale(rx, ry, rz); return g; };
  const skin = 0xbcc6cc;
  for (const s of ['L', 'R']){
    const sg = s === 'L' ? 1 : -1;
    // eye: a ball that turns (with iris and pupil) under an eyelid that closes
    const E = new T.Group(); E.position.set(sg*2.75, 12.2, lbHeadZ(2.75, 12.2) - 0.72); head.add(E);
    const ball = new T.Group(); E.add(ball); F.eye[s] = ball;
    ball.add(reg(new T.Mesh(ell(1.12, 1.12, 1.12, 32), mat(0xe8ecee, {roughness:0.18, clearcoat:1})), 'eye' + s));
    const iris = new T.Mesh(new T.CircleGeometry(0.56, 32), new T.MeshStandardMaterial({color:lin(0x4d5c64), roughness:0.3})); iris.position.z = 1.115; ball.add(iris);
    const pupil = new T.Mesh(new T.CircleGeometry(0.25, 24), new T.MeshBasicMaterial({color:lin(0x141b20)})); pupil.position.z = 1.125; ball.add(pupil);
    const lid = new T.Mesh(new T.SphereGeometry(1.24, 32, 12, 0, Math.PI*2, 0, 1.05), mat(skin, {side:T.DoubleSide})); E.add(lid); F.lid[s] = reg(lid, 'lid' + s);
    // brow ridge
    const brow = new T.Mesh(ell(1.85, 0.34, 0.55), mat(0xa4aeb4)); brow.position.set(sg*2.9, 14.55, lbHeadZ(2.9, 14.55) + 0.05); brow.rotation.set(0, sg*0.32, -sg*0.12); head.add(brow);
    brow.userData.p0 = brow.position.clone(); brow.userData.r0 = brow.rotation.z; F.brow[s] = reg(brow, 'brow' + s);
    // cheek pad
    const ck = new T.Mesh(ell(1.55, 1.05, 0.95), mat(skin)); ck.position.set(sg*4.1, 8.8, lbHeadZ(4.1, 8.8) - 0.6); ck.rotation.y = sg*0.5; head.add(ck);
    ck.userData.p0 = ck.position.clone(); F.cheek[s] = reg(ck, 'cheek' + s);
    // ear
    const ear = new T.Mesh(ell(0.62, 2.3, 1.45), mat(skin)); ear.position.set(sg*7.4, 11, 0.5); ear.rotation.y = -sg*0.25; head.add(ear); reg(ear, 'ear' + s);
    // lips: an upper and a lower half-lip on this side plus the corner; rebuilt as the mouth moves
    const lm = mat(0xb1a6a5, {roughness:0.35});
    F.lips[s] = {up:new T.Mesh(new T.BufferGeometry(), lm), lo:new T.Mesh(new T.BufferGeometry(), lm.clone()), co:new T.Mesh(new T.SphereGeometry(0.32, 16, 12), lm.clone())};
    for (const k of ['up', 'lo', 'co']){ head.add(F.lips[s][k]); }
  }
  // nose: bridge, tip and the two wings
  const nm = mat(skin);
  const nose = new T.Mesh(ell(0.7, 2.2, 0.95), nm); nose.position.set(0, 10.35, lbHeadZ(0, 10.35) - 0.12); nose.rotation.x = -0.22; head.add(nose); reg(nose, 'nose');
  const tip = new T.Mesh(ell(0.66, 0.58, 0.62), nm.clone()); tip.position.set(0, 8.8, lbHeadZ(0, 8.8) + 0.6); head.add(tip); reg(tip, 'nose');
  for (const sg of [1, -1]){ const w = new T.Mesh(ell(0.48, 0.38, 0.42), nm.clone()); w.position.set(sg*0.78, 8.6, lbHeadZ(0.78, 8.6) + 0.18); head.add(w); reg(w, 'nose'); }
  // inside of the mouth and the tongue
  F.mouth = new T.Mesh(new T.CircleGeometry(1, 40), new T.MeshBasicMaterial({color:lin(0x242b30)})); head.add(F.mouth);
  F.tongue = reg(new T.Mesh(ell(1.2, 0.5, 2.0), mat(0xb39494, {roughness:0.45})), 'tongue'); head.add(F.tongue);
  // register the lip meshes once their geometry exists
  lbMouth({open:0, cx:{L:0, R:0}, cy:{L:0, R:0}});
  for (const s of ['L', 'R']) for (const k of ['up', 'lo', 'co']) reg(F.lips[s][k], 'lips' + s);
}
// rebuild the lips for this mouth shape (only when it actually changes)
function lbMouth(X){
  const F = LB.F, T = THREE, V = T.Vector3;
  const key = [X.open, X.cx.L, X.cx.R, X.cy.L, X.cy.R].map(v=>Math.round(v*40)).join(',');
  if (key === F.key) return; F.key = key;
  const yU = 6.32 + X.open*0.12, yL = 5.68 - X.open*1.3;
  for (const s of ['L', 'R']){
    const sg = s === 'L' ? 1 : -1, xc = sg*(2.05 + X.cx[s]), yc = 6.0 + X.cy[s] - X.open*0.45, zc = lbHeadZ(xc, yc) + 0.22;
    const L = F.lips[s];
    for (const up of [true, false]){
      const ym = up ? yU : yL, zm = lbHeadZ(0, ym) + (up ? 0.38 : 0.3);
      const c = new T.QuadraticBezierCurve3(new V(-sg*0.14, ym, zm), new V(sg*1.2, ym*0.62 + yc*0.38 + (up ? 0.1 : -0.12), (zm + zc)/2 + 0.22), new V(xc, yc, zc));
      const m = up ? L.up : L.lo; m.geometry.dispose(); m.geometry = new T.TubeGeometry(c, 14, up ? 0.3 : 0.36, 8, false); m.geometry.computeBoundingSphere();
    }
    L.co.position.set(xc, yc, zc);
  }
  const gap = Math.max(0, (yU - yL) - 0.75), my = (yU + yL)/2;
  F.mouth.visible = gap > 0.04; F.mouth.position.set(0, my, lbHeadZ(0, my) + 0.06); F.mouth.scale.set(1.75 + 0.25*(X.cx.L + X.cx.R)/2, Math.max(0.01, gap/2), 1);
  F.mouthY = my;
}
function lbFaceApply(X, t){
  const F = LB.F; if (!F) return;
  // a natural blink every few seconds
  const bt = (t + 1.3) % 4.3, blink = Math.max(0, 1 - Math.abs(bt - 0.09)/0.09);
  for (const s of ['L', 'R']){
    const sg = s === 'L' ? 1 : -1, e = Math.max(0, Math.min(1.3, X.eye[s]*(1 - blink)));
    F.lid[s].rotation.x = 1.5 - 1.25*e;
    F.eye[s].rotation.set(-0.4*X.gazeY, 0.62*X.gaze, 0);
    const b = F.brow[s]; b.position.copy(b.userData.p0); b.position.y += 0.75*X.brow[s] - 0.2*X.browIn; b.position.x -= sg*0.25*X.browIn; b.rotation.z = b.userData.r0 + sg*0.3*X.browIn;
    const c = F.cheek[s]; c.position.copy(c.userData.p0); c.position.y += 0.55*X.cheek[s]; c.position.z += 0.2*X.cheek[s];
  }
  lbMouth(X);
  const tg = F.tongue, out = X.tongue;
  tg.visible = out > 0.01 || X.open > 0.1; tg.position.set(X.tongueX, (F.mouthY || 6) - 0.35*out, lbHeadZ(0, 6) - 1.4 + 3.9*out); tg.rotation.set(0.25*out, 0.3*X.tongueX, 0);
}

function lbPose(t, k){
  const J = LB.M.j, P = LB.plan, TAU = Math.PI*2;
  for (const n in J) J[n].rotation.copy(LB.base[n]);
  J.spine.rotation.x += 0.01*Math.sin(t*1.3); J.neck.rotation.x += 0.008*Math.sin(t*1.3 + 0.6);     // breathing
  const X = {open:0, cx:{L:0, R:0}, cy:{L:0, R:0}, brow:{L:0, R:0}, browIn:0, eye:{L:1, R:1}, gaze:0, gazeY:0, cheek:{L:0, R:0}, tongue:0, tongueX:0};
  if (P && P.mv) lbMove(P, J, X, k, TAU);
  lbFaceApply(X, t);
}
function lbMove(P, J, X, k, TAU){
  const env = ismooth(0, 0.06, k)*(1 - ismooth(2.4, 3.0, k));
  const flex = Math.pow(Math.max(0, Math.sin(TAU*1.8*k)), 1.5)*env;     // brief contractions, about two a second… then rest
  const jerk = Math.sin(TAU*3.2*k)*env, hold = ismooth(0, 0.45, k)*(1 - ismooth(4.2, 5.2, k));
  const one = P.sides.length === 1, sg0 = P.sides[0] === 'L' ? 1 : -1, both = f => { for (const s of ['L', 'R']) f(s, s === 'L' ? 1 : -1); };
  switch (P.mv){
    case 'trunk': J.spine.rotation.z += 0.07*(one ? flex*sg0 : jerk); J.spine.rotation.y += 0.05*jerk; return;
    case 'neck': J.neck.rotation.y += one ? 0.45*flex*sg0 : 0.25*jerk; return;
    case 'face':   // the lower face on that side pulls: mouth corner up and out, cheek rises, eye narrows, brow dips
      for (const s of P.sides){ X.cx[s] += 0.4*flex; X.cy[s] += 0.6*flex; X.cheek[s] += 0.6*flex; X.eye[s] -= 0.5*flex; X.brow[s] -= 0.25*flex; }
      X.open += 0.1*flex; J.head.rotation.z += 0.03*jerk; return;
    case 'lips':   // the corner of the mouth twitches; the lips purse and part
      for (const s of P.sides){ X.cx[s] += 0.35*flex; X.cy[s] += 0.45*flex; }
      both(s=>{ X.cx[s] -= 0.18*Math.abs(jerk); }); X.open += 0.18*flex; return;
    case 'tongue': { const h2 = ismooth(0, 0.3, k)*(1 - ismooth(2.7, 3.2, k));
      X.open = 0.8*h2; X.tongue = h2*(0.8 + 0.2*flex); X.tongueX = (one ? sg0*0.8*h2 : 0) + 0.3*jerk; return; }
    case 'throat': J.neck.rotation.x += 0.07*flex; J.head.rotation.x -= 0.06*flex; both(s=>{ X.cx[s] -= 0.15*flex; X.cy[s] -= 0.08*flex; }); return;   // a swallow
    case 'eyes': J.neck.rotation.y += 0.25*hold*sg0; J.head.rotation.y += 0.08*hold*sg0; X.gaze = 0.75*hold*sg0; return;
    case 'speech': X.open = k < 0.7 ? 0.22 + 0.22*Math.max(0, Math.sin(TAU*5.5*k)) : 0.3*hold; J.head.rotation.x += 0.02*Math.sin(TAU*4*k)*(1 - ismooth(0.5, 0.8, k)); return;
    case 'hear': X.gaze = 0.45*hold*sg0*(one ? 1 : 0); both(s=>{ X.brow[s] += 0.35*hold; }); J.head.rotation.y += 0.12*hold*(one ? sg0 : 0); return;
    case 'see': { const fl = Math.max(0, Math.sin(TAU*2.4*k))*env; X.gaze = 0.4*hold*(one ? sg0 : 0); both(s=>{ X.eye[s] -= 0.45*fl; X.brow[s] += 0.2*hold; }); return; }
    case 'dream': both(s=>{ X.eye[s] = 1 - 0.6*hold; X.cy[s] += 0.12*hold; }); X.gazeY = 0.35*hold; J.head.rotation.x -= 0.06*hold; return;
    case 'fear': both(s=>{ X.brow[s] += 0.85*hold; X.eye[s] = 1 + 0.3*hold; X.cy[s] -= 0.28*hold; X.cx[s] += 0.1*hold; }); X.browIn = 0.35*hold; X.open = 0.45*hold; J.head.rotation.x -= 0.05*hold; return;
    case 'smile': both(s=>{ X.cy[s] += 0.75*hold; X.cx[s] += 0.4*hold; X.cheek[s] += 0.6*hold; X.eye[s] -= 0.3*hold; }); X.open = 0.12*hold; return;
    case 'mood': both(s=>{ X.cy[s] += 0.4*hold; X.cx[s] += 0.18*hold; X.cheek[s] += 0.3*hold; X.brow[s] += 0.15*hold; }); return;
    case 'urge': both(s=>{ X.brow[s] -= 0.3*hold; X.cx[s] -= 0.12*hold; X.cy[s] -= 0.08*hold; }); X.browIn = 0.65*hold; J.head.rotation.x += 0.06*flex; return;
    case 'nausea': both(s=>{ X.cy[s] -= 0.3*hold; X.eye[s] -= 0.25*hold; }); X.browIn = 0.4*hold; J.spine.rotation.x += 0.05*hold; return;
    case 'posture':
      for (const s of ['L', 'R']){ const sg = s === 'L' ? 1 : -1; J['shoulder' + s].rotation.z += sg*(s === 'R' ? 1.3 : 0.55)*hold; J['shoulder' + s].rotation.x -= 0.25*hold; J['elbow' + s].rotation.x -= (s === 'R' ? 0.35 : 0.9)*hold; }
      J.neck.rotation.y += -0.5*hold; X.gaze = -0.5*hold; return;
  }
  for (const s of P.sides){
    const g = n => J[n + s], sg = s === 'L' ? 1 : -1;
    switch (P.mv){
      case 'ankle': g('ankle').rotation.x += 0.6*flex; break;
      case 'knee': g('knee').rotation.x += 0.75*flex; g('hip').rotation.x -= 0.3*flex; break;
      case 'hip': g('hip').rotation.x -= 0.55*flex; g('knee').rotation.x += 0.4*flex; break;
      case 'shoulder': g('shoulder').rotation.z += 0.5*flex*sg; break;
      case 'elbow': g('elbow').rotation.x -= 1.05*flex; g('shoulder').rotation.x -= 0.18*flex; break;
      case 'hand': g('wrist').rotation.x -= 0.5*flex; g('fingers').rotation.x -= 1.2*flex; g('thumb').rotation.x -= 0.7*flex; break;
      case 'fingers': g('fingers').rotation.x -= 1.3*flex; break;
      case 'thumb': g('thumb').rotation.x -= 0.9*flex; g('thumb').rotation.z -= 0.45*flex*sg; break;
      case 'tremor': { const a = 0.2*Math.sin(TAU*5.2*k)*(1 - ismooth(0.8, 2.8, k))*ismooth(0, 0.1, k); g('wrist').rotation.x += a; g('fingers').rotation.x += a*0.6; break; }
    }
  }
}
function lbAnchor(n, v){
  const J = LB.M.j;
  if (n === 'eyes') return J.head.localToWorld(v.set(0, 12.2, 10.6));
  if (n === 'earL' || n === 'earR') return J.head.localToWorld(v.set(n === 'earL' ? 8.2 : -8.2, 11, 0.6));
  if (n === 'gut') return J.spine.localToWorld(v.set(0, 10, 10));
  const ms = LB.parts[n]; if (!ms) return null; const m = ms[0]; return m.localToWorld(v.copy(m.geometry.boundingSphere.center));
}
function lbFrame(now){
  LB.raf = 0;
  const cv = LB.cv, lp = $('#labPanel');
  if (!cv || !cv.isConnected || S.tab !== 'lab' || !lp || lp.hidden) return;
  LB.raf = requestAnimationFrame(lbFrame);
  const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
  const r = LB.r, pr = Math.min(window.devicePixelRatio || 1, TOUCH ? 1.5 : 2);
  if (r.getPixelRatio() !== pr) r.setPixelRatio(pr);
  if (cv.width !== Math.round(w*pr) || cv.height !== Math.round(h*pr)) r.setSize(w, h, false);
  const dt = Math.min(0.1, Math.max(0, (now - (LB.lastT || now))/1000)); LB.lastT = now;
  const t = now/1000, P = LB.plan, k = LB.debugK != null ? LB.debugK : LB.evT0 != null ? (performance.now() - LB.evT0)/1000 : 99, cam = LB.cam;
  // frame the whole figure (and the ghost above it), or close in on the face for facial responses
  const wantFace = LB.view ? LB.view === 'face' : !!(P && P.face);
  LB.fz = LB.fz == null ? (wantFace ? 1 : 0) : LB.fz + ((wantFace ? 1 : 0) - LB.fz)*(1 - Math.exp(-dt*4.5)); const fz = ismooth(0, 1, LB.fz);
  const topB = P && P.ghost ? 204 : 186, botB = -18, tf = Math.tan(12*Math.PI/180);
  const cy = ilerp((topB + botB)/2, 162.5, fz), half = ilerp((topB - botB)/2*1.05, 15.5, fz), halfW = ilerp(64, 13, fz);
  const want = Math.max(half/tf, halfW/(tf*w/h)); LB.dist = LB.dist ? LB.dist + (want - LB.dist)*(1 - Math.exp(-dt*8)) : want;
  if (LB.yawHome && !LB.drag){ LB.yaw *= Math.exp(-dt*9); LB.pitch += (0.05 - LB.pitch)*(1 - Math.exp(-dt*9)); if (Math.abs(LB.yaw) < 0.002) LB.yawHome = false; }
  cam.aspect = w/h; cam.near = Math.max(1, LB.dist*0.2); cam.updateProjectionMatrix();
  const tz = ilerp(0, 3, fz);
  cam.position.set(Math.sin(LB.yaw)*Math.cos(LB.pitch)*LB.dist, cy + Math.sin(LB.pitch)*LB.dist, tz + Math.cos(LB.yaw)*Math.cos(LB.pitch)*LB.dist); cam.lookAt(0, cy, tz);
  if (LB.viewBtn){ const lab = fz > 0.5 ? 'Cuerpo completo' : 'Cara'; if (LB.viewBtn.textContent !== lab) LB.viewBtn.textContent = lab; }
  lbPose(t, k);
  LB.scene.updateMatrixWorld(true);
  // light the responding segments, fade the rest back to clinical grey
  const pulse = 0.72 + 0.28*Math.sin(t*4.2);
  LB.hi.set(P ? P.col : 0x2f6bff).convertSRGBToLinear(); LB.hiD.copy(LB.hi).multiplyScalar(0.32);
  for (const jn in LB.parts){ const on = P && P.lit.includes(jn) ? 1 : 0;
    for (const m of LB.parts[jn]){ m.userData.h += (on - m.userData.h)*(1 - Math.exp(-dt*9)); const hh = m.userData.h; if (hh < 0.002 && !on){ m.material.color.copy(m.userData.base); m.material.emissive.setRGB(0, 0, 0); continue; }
      m.material.color.copy(m.userData.base).lerp(LB.hiD, 0.95*hh); m.material.emissive.copy(LB.hi).multiplyScalar(0.32*hh*pulse); } }
  const fin = ismooth(0, 0.3, k);
  LB.glows.forEach((s, i)=>{ const a = P && P.glow[i]; if (!a || !lbAnchor(a, s.position)){ s.material.opacity = 0; return; } s.material.color.set(P.col); s.material.opacity = 0.5*pulse*fin; s.scale.setScalar(ilerp(44, 8, fz)); });
  LB.ghost.visible = !!(P && P.ghost); if (LB.ghost.visible){ LB.ghostMat.opacity = 0.3*ismooth(0.2, 1.4, k); LB.ghost.position.y = 190 + 2*Math.sin(t*1.4); }
  LB.ringMat.emissiveIntensity = 0.9 + 0.5*(P ? fin*pulse : 0.3);
  r.render(LB.scene, cam);
  // overlay: R / L at the patient's hands, speech bubble over the head
  const v = LB.v, put = (el, p, ox, oy) => { if (!el) return; v.copy(p).project(cam); el.style.transform = `translate(${((v.x*0.5 + 0.5)*w + ox).toFixed(1)}px,${((-v.y*0.5 + 0.5)*h + oy).toFixed(1)}px)`; el.style.opacity = v.z < 1 ? 1 : 0; };
  const J = LB.M.j, tmp = new THREE.Vector3();
  if (fz > 0.5){ put(LB.sideR, J.head.localToWorld(tmp.set(-11.5, 10, 1)), 0, 0); put(LB.sideL, J.head.localToWorld(tmp.set(11.5, 10, 1)), 0, 0); }
  else { put(LB.sideR, J.wristR.localToWorld(tmp.set(0, -24, 0)), 0, 0); put(LB.sideL, J.wristL.localToWorld(tmp.set(0, -24, 0)), 0, 0); }
  if (LB.bub && !LB.bub.hidden) put(LB.bub, J.head.localToWorld(tmp.set(fz > 0.5 ? 6 : 0, fz > 0.5 ? 4 : 25, 10)), fz > 0.5 ? 70 : 0, 0);
}

/* ---------- register the walkthroughs ---------- */
Object.assign(IMMERSIVE, {
  ct:{ label:'Recorrido por un escáner de TC', height:1000, build:buildCT, deepTitle:'De los rayos X al corte, paso a paso',
    caps:[
      [0.005, 0.10, 'Un escáner de TC', 'Un anillo corto, de unos 70 cm de diámetro. En su interior, un tubo de rayos X y una fila curva de detectores se enfrentan a través del paciente.'],
      [0.11, 0.225, 'Primero la cabeza', 'La camilla introduce la cabeza en el anillo. Una línea láser marca dónde se tomará el primer corte.'],
      [0.245, 0.375, 'Dentro de la carcasa', 'El tubo, los detectores y su electrónica giran sobre un mismo tambor. Un anillo colector transmite la alimentación, de modo que el tambor puede girar sin que los cables se enrollen.'],
      [0.39, 0.515, 'Una hélice a través de la cabeza', 'El tambor gira unas tres veces por segundo mientras la camilla avanza, de forma que el haz traza una espiral desde la base del cráneo hasta la cima de la cabeza. Aquí, ralentizado.'],
      [0.53, 0.625, 'Un abanico de rayos X', 'El tubo emite un abanico fino de rayos X, 120 kV, a través de la cabeza. El cráneo y el encéfalo absorben parte de ellos camino de los detectores.'],
      [0.635, 0.72, 'Lo que logra atravesar', 'Cada detector mide cuánto sobrevivió de su rayo: I = I₀·e^(−μx). Los rayos que cruzan más hueso llegan más atenuados, por lo que la lectura cae.'],
      [0.73, 0.83, 'Cada ángulo', 'Una lectura por ángulo. Apiladas de 0° a 180° forman un sinograma, en el que cada punto de la cabeza traza una sinusoide.'],
      [0.84, 0.935, 'Retroproyección', 'Cada perfil filtrado se proyecta de vuelta sobre la imagen en la dirección en que se midió. Ángulo a ángulo, aparece el corte.'],
      [0.945, 1.01, 'El corte', 'Cada píxel es una unidad Hounsfield, mostrada aquí en ventana cerebral: sustancia gris y blanca, LCR oscuro, cráneo brillante. Siga desplazándose para ver la física en detalle.'],
    ]},
  pet:{ label:'Recorrido por un escáner de PET', height:1050, build:buildPET, deepTitle:'Del trazador a la imagen, paso a paso',
    caps:[
      [0.005, 0.10, 'Un escáner de PET', 'Tras la carcasa hay un anillo de cristales detectores. El escáner no introduce nada en el cuerpo: todo lo que registra procede del paciente.'],
      [0.11, 0.245, 'Un trazador de glucosa', 'Se inyecta FDG, glucosa marcada con flúor-18, en una vena. Durante 45 minutos el paciente reposa mientras las células activas, sobre todo las del encéfalo, la captan y la retienen.'],
      [0.26, 0.345, 'Hacia el anillo', 'La camilla sitúa la cabeza en el centro del anillo de detectores.'],
      [0.36, 0.475, 'Anillos de cristales', 'Miles de pequeños cristales de LSO, agrupados en bloques, recubren el anillo. Un fotón gamma que impacta en uno lo hace destellar; los sensores de luz situados detrás convierten el destello en un pulso.'],
      [0.49, 0.585, 'Una desintegración', 'Dentro de una célula cerebral, un núcleo de ¹⁸F emite un positrón. Recorre aproximadamente medio milímetro (aquí ampliado) antes de encontrarse con un electrón.'],
      [0.595, 0.66, 'Dos fotones, espalda con espalda', 'El positrón y el electrón se aniquilan. Su masa se convierte en dos fotones gamma de 511 keV que salen despedidos en direcciones opuestas.'],
      [0.67, 0.735, 'Coincidencia', 'Dos cristales destellan en pocos nanosegundos. La desintegración ocurrió en algún punto de la línea que los une: una línea de respuesta.'],
      [0.745, 0.83, 'Millones de líneas', 'Cada coincidencia añade una línea. Donde el trazador se concentra, las líneas se cruzan con más frecuencia.'],
      [0.84, 0.935, 'Reconstrucción', 'La retroproyección de las líneas produce un mapa borroso del trazador. La reconstrucción iterativa (OSEM), con correcciones de atenuación y dispersión, lo nitidiza.'],
      [0.945, 1.01, 'La imagen', 'Consumo de glucosa en todo el encéfalo: alto en la corteza y la sustancia gris profunda, bajo en la sustancia blanca. Siga desplazándose para ver la física en detalle.'],
    ]},
  spect:{ label:'Recorrido por una cámara gamma SPECT', height:950, build:buildSPECT, deepTitle:'Del fotón gamma a la imagen, paso a paso',
    caps:[
      [0.005, 0.10, 'Una cámara SPECT', 'Dos o tres cámaras gamma sobre un anillo. Cada una es un detector plano del tamaño de un libro grande, orientado hacia el paciente.'],
      [0.11, 0.25, 'Un trazador congelado en el tiempo', 'Se inyecta ⁹⁹ᵐTc-HMPAO en una vena y queda atrapado en el tejido cerebral en uno o dos minutos, en proporción al flujo sanguíneo de ese momento.'],
      [0.265, 0.375, 'Los cabezales se acercan', 'La camilla introduce la cabeza en el anillo y los cabezales se aproximan todo lo posible. Más cerca significa más nitidez.'],
      [0.39, 0.485, 'Dentro de un cabezal de cámara', 'Un colimador de plomo, un cristal de yoduro de sodio y una fila de tubos fotomultiplicadores, mostrados ampliados.'],
      [0.495, 0.61, 'Solo cuentan los fotones rectos', 'Un fotón gamma sale en cualquier dirección. Los orificios de plomo solo dejan pasar los fotones que viajan en línea recta; el resto se detiene en el plomo. Se cuenta aproximadamente 1 de cada 10.000.'],
      [0.625, 0.755, 'Paso a paso', 'Los cabezales giran 3° cada vez y registran una proyección en cada parada: 120 vistas en unos 20 minutos. Apiladas, las vistas forman un sinograma.'],
      [0.77, 0.935, 'Reconstrucción', 'Las proyecciones se retroproyectan como en la TC. Con una resolución de 8–10 mm, los lectores interpretan el patrón global más que los bordes nítidos.'],
      [0.945, 1.01, 'La imagen', 'Flujo sanguíneo en el momento de la inyección: homogéneo en la corteza, máximo en el cerebelo. Siga desplazándose para ver la física en detalle.'],
    ]},
  fmri:{ label:'Recorrido por un experimento de RMf', height:1000, build:buildFMRI, deepTitle:'De las neuronas al mapa, paso a paso', hud:'Desplácese para seguir la señal',
    caps:[
      [0.005, 0.10, 'El mismo escáner', 'La RMf utiliza un escáner de RM convencional. Lo que cambia es la secuencia y la tarea que realiza la persona en su interior.'],
      [0.11, 0.225, 'Una tarea en una pantalla', 'Un proyector muestra las instrucciones en una pantalla situada detrás del imán: golpear con los dedos derechos durante 15 segundos y luego descansar 15.'],
      [0.235, 0.345, 'Un espejo en la bobina de cabeza', 'Tumbado en el orificio, el voluntario ve la pantalla en un pequeño espejo fijado a la bobina de cabeza y pulsa una caja de botones.'],
      [0.355, 0.46, 'Se activa el área de la mano', 'Durante el golpeteo se activan la corteza motora izquierda (área de la mano), el área motora suplementaria y el cerebelo derecho.'],
      [0.47, 0.56, 'Las neuronas descargan', 'En la zona activa, las neuronas piramidales descargan más rápido. La RMf no lo ve directamente: ve lo que hace la sangre después.'],
      [0.57, 0.66, 'La sangre afluye', 'En uno o dos segundos, las arteriolas cercanas se dilatan. El flujo sanguíneo aumenta un 30–50 %, mucho más que el oxígeno adicional que consumen las neuronas.'],
      [0.67, 0.755, 'Desoxihemoglobina arrastrada', 'La desoxihemoglobina es magnética y distorsiona el campo alrededor de los vasos, atenuando la señal de RM. Al inundarse de sangre oxigenada, la zona se vuelve algo más brillante.'],
      [0.765, 0.85, 'Una señal pequeña y lenta', 'La señal BOLD solo aumenta un 1–3 % y alcanza su pico 5–6 s después de la descarga neuronal. Sigue los bloques de la tarea.'],
      [0.86, 0.935, 'Un encéfalo completo cada 2 segundos', 'La imagen eco-planar rápida adquiere unos 36 cortes por volumen, un volumen cada 2 segundos, durante varios minutos. Ese es el golpeteo rápido que se oye.'],
      [0.945, 1.01, 'La estadística dibuja el mapa', 'Para cada vóxel, un modelo evalúa en qué medida su señal sigue la tarea. Los vóxeles que superan la prueba se colorean sobre la anatomía. Siga desplazándose para ver la física en detalle.'],
    ]},
  eeg:{ label:'Recorrido por un registro de EEG', height:950, build:buildEEG, deepTitle:'De las neuronas al trazado, paso a paso', hud:'Desplácese para seguir la señal',
    caps:[
      [0.005, 0.11, 'Sin escáner alguno', 'El EEG necesita un gorro de electrodos, un poco de gel y un amplificador. El voluntario puede estar sentado en una silla o encamado durante días.'],
      [0.12, 0.255, 'El sistema 10–20', 'Los electrodos se sitúan en pasos del 10 % y del 20 % entre puntos de referencia fijos del cráneo. Los números impares van a la izquierda, los pares a la derecha y la z en la línea media.'],
      [0.265, 0.38, 'Del electrodo a la corteza', 'Un cilindro de tejido bajo C3, ampliado: gel, cuero cabelludo, cráneo, LCR y después sustancia gris y blanca. La señal debe atravesarlo todo.'],
      [0.39, 0.52, 'Células piramidales en fase', 'En la corteza, las células piramidales se disponen unas junto a otras. Cuando las corrientes sinápticas recorren miles de ellas a la vez, sus diminutos campos se suman en un dipolo.'],
      [0.535, 0.665, 'Millones a la vez', 'Un ritmo requiere varios centímetros cuadrados de corteza trabajando en fase. Con los ojos cerrados, la corteza visual posterior genera el ritmo alfa.'],
      [0.675, 0.79, 'Difuminado por el cráneo', 'El hueso conduce mal, así que el potencial se dispersa camino del cuero cabelludo. La cronología del EEG es exacta al milisegundo; su localización espacial es de centímetros.'],
      [0.80, 0.91, 'Amplificar la diferencia', 'Cada canal es la diferencia entre dos electrodos, amplificada unas 10.000 veces. El zumbido de la red, que llega a ambos, se cancela.'],
      [0.92, 1.01, 'El ritmo en la pantalla', 'Alfa en torno a 10 Hz en la parte posterior de la cabeza, máximo en O1 y O2 (ralentizado en la cabeza de arriba). Siga desplazándose para ver la física en detalle.'],
    ]},
  meg:{ label:'Recorrido por un registro de MEG', height:950, build:buildMEG, deepTitle:'De las corrientes a la fuente, paso a paso',
    caps:[
      [0.005, 0.11, 'Una sala blindada', 'Los campos cerebrales son mil millones de veces más débiles que el terrestre. La MEG funciona en una sala revestida de aluminio y mu-metal que mantiene fuera los campos externos.'],
      [0.12, 0.235, 'La cabeza en el casco', 'El voluntario se sienta con la cabeza dentro de un hueco en forma de casco en la base de un gran criostato. Nada toca la cabeza.'],
      [0.245, 0.36, 'Dentro del criostato', 'El helio líquido a −269 °C mantiene unos 300 sensores superconductores. Están en una envoltura a solo un par de centímetros del cuero cabelludo.'],
      [0.37, 0.475, 'Sensores SQUID', 'Cada posición tiene un bucle magnetómetro y dos gradiómetros en forma de ocho, leídos por SQUID: anillos superconductores que detectan campos de femtoteslas.'],
      [0.485, 0.605, 'Una corriente en un surco', 'Un pulso en la muñeca derecha activa el área de la mano izquierda. La corriente fluye por la pared del surco central y un campo magnético la rodea.'],
      [0.615, 0.735, 'Sale por un lado, entra por el otro', 'El campo sale de la cabeza por un lado de la fuente y vuelve a entrar por el otro. El cráneo no lo difumina, así que ambos polos permanecen nítidos.'],
      [0.745, 0.86, 'Cronología de milisegundos', 'Promediada sobre muchos pulsos, la respuesta alcanza su pico 20 ms después del estímulo (N20m), ralentizada aquí unas doce veces.'],
      [0.87, 1.01, 'Localizar la fuente', 'La fuente se sitúa a mitad de camino entre los polos, perpendicular a la línea que los une. Un ajuste dipolar la sitúa en el área de la mano con precisión milimétrica. Siga desplazándose para ver la física en detalle.'],
    ]},
  us:{ label:'Recorrido por un Doppler transcraneal', height:950, build:buildUS, deepTitle:'De los ecos al flujo sanguíneo, paso a paso', hud:'Desplácese para seguir el sonido',
    caps:[
      [0.005, 0.11, 'A pie de cama', 'Sin túnel ni radiación: un carro con pantalla y una sonda manual. La exploración se realiza donde esté el paciente.'],
      [0.12, 0.26, 'La sonda', 'Dentro de la sonda, una fila de cristales piezoeléctricos vibra al recibir un pulso de tensión y emite un tren de sonido. Los mismos cristales escuchan los ecos.'],
      [0.27, 0.39, 'Una ventana en el cráneo', 'El hueso bloquea el sonido, pero sobre la oreja el hueso temporal es lo bastante fino para dejar pasar un haz de 2 MHz. En los recién nacidos, la fontanela abierta es una ventana mucho mayor.'],
      [0.40, 0.53, 'Pulso emitido, eco de vuelta', 'El sonido viaja por el tejido a unos 1540 m/s. En cada interfase, parte se refleja de vuelta a la sonda.'],
      [0.54, 0.665, 'El tiempo del eco se convierte en profundidad', 'Profundidad = velocidad × tiempo ÷ 2. Emitiendo líneas en abanico y representando la intensidad del eco como brillo se construye la imagen, unas 30 veces por segundo.'],
      [0.675, 0.80, 'La sangre en movimiento cambia el tono', 'Los hematíes de la arteria cerebral media fluyen hacia la sonda, por lo que su eco regresa con una frecuencia ligeramente mayor: el desplazamiento Doppler.'],
      [0.81, 0.92, 'El espectro', 'El desplazamiento proporciona la velocidad de la sangre, representada latido a latido: rápida en sístole, más lenta en diástole.'],
      [0.93, 1.01, 'Latido a latido', 'La velocidad media en la ACM es de unos 60 cm/s. El vasoespasmo, la presión elevada y una arteria ocluida modifican la onda. Siga desplazándose para ver la física en detalle.'],
    ]},
  dsa:{ label:'Recorrido por una angiografía cerebral', height:1000, build:buildDSA, deepTitle:'Del catéter a la angiografía, paso a paso', hud:'Desplácese para seguir el catéter',
    caps:[
      [0.005, 0.10, 'Una sala de angiografía', 'Un tubo de rayos X y un detector plano sobre un brazo en C que gira alrededor del paciente, con pantallas para observar en directo.'],
      [0.11, 0.22, 'Entrada por la ingle', 'Con anestesia local, un catéter fino entra en la arteria femoral por la ingle (o en la arteria radial en la muñeca).'],
      [0.23, 0.36, 'Ascenso por la aorta', 'Guiado por radioscopia en directo, el catéter asciende por la aorta hasta el arco, la curva donde nacen las arterias del cuello.'],
      [0.37, 0.475, 'Hacia la carótida', 'La punta se dirige a la arteria carótida común izquierda y asciende por el cuello.'],
      [0.49, 0.60, 'Entrada del contraste', 'Se inyectan unos mililitros de contraste yodado. Rellena la carótida interna y después las arterias cerebrales media y anterior en menos de dos segundos.'],
      [0.61, 0.71, 'Capilares y después venas', 'Las arterias se vacían, el encéfalo se ruboriza al cruzar el contraste los capilares y luego se llenan las venas y los senos venosos. La serie completa dura unos ocho segundos.'],
      [0.72, 0.82, 'Imágenes, varias por segundo', 'El brazo en C adquiere 2–6 imágenes de rayos X por segundo durante toda la serie.'],
      [0.83, 0.935, 'Sustraer la máscara', 'A cada imagen posterior se le resta una tomada antes de que llegue el contraste. El cráneo es idéntico en ambas, así que se cancela y solo quedan los vasos.'],
      [0.945, 1.01, 'La angiografía', 'Una serie en fase arterial de la carótida interna izquierda: el estándar de referencia para aneurismas, MAV y arterias ocluidas. Siga desplazándose para ver la física en detalle.'],
    ]},
});

/* =====================================================================
   Small 3D views inside the 2D chapter scenes (CT gantry, PET ring,
   SPECT heads), in the same studio style as the MRI walkthrough.
   One shared three.js renderer draws offscreen; the scene step copies
   the picture into its 2D canvas with drawImage and adds labels on top.
   Returns false when three.js or WebGL is unavailable, so the caller
   keeps its flat drawing.  Units: centimetres, Y up, bore axis = Z.
   ===================================================================== */
const MINI = {r:null, kinds:{}, failed:false, yaw:0, pitch:0, held:false};
if (location.hostname === 'localhost') window.__MINI = MINI;

function miniRenderer(){
  if (MINI.r || MINI.failed) return MINI.r;
  if (typeof THREE === 'undefined'){ MINI.failed = true; return null; }
  try {
    const r = new THREE.WebGLRenderer({canvas:document.createElement('canvas'), antialias:true, alpha:true, preserveDrawingBuffer:true, powerPreference:'high-performance'});
    r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 0.88; r.setClearColor(0xffffff, 0);
    MINI.r = r; MINI.env = immStudioEnv(r); MINI.glow = immGlowTex();
  } catch(e){ MINI.failed = true; }
  return MINI.r;
}
function miniDispose(){
  for (const k in MINI.kinds){ const K = MINI.kinds[k]; K.scene.traverse(o=>{ if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m=>{ for (const q in m) if (m[q] && m[q].isTexture && m[q] !== MINI.env && m[q] !== MINI.glow) m[q].dispose(); m.dispose(); }); }); }
  MINI.kinds = {};
  if (MINI.r){ MINI.env && MINI.env.dispose(); MINI.glow && MINI.glow.dispose(); MINI.r.dispose(); try { MINI.r.forceContextLoss(); } catch(e){} MINI.r = null; }
  MINI.yaw = 0; MINI.pitch = 0;
}

/* Draw kind into the current 2D scene at (x, y, w, h) scene units. Returns a projector or false. */
function mini3d(kind, x, y, w, h, t, p, E){
  const r = miniRenderer(); if (!r) return false;
  let K = MINI.kinds[kind];
  if (!K){ try { K = MINI.kinds[kind] = miniBuild(kind); } catch(e){ console.error(e); MINI.failed = true; return false; } }
  const s = 1/G.u*Math.min(window.devicePixelRatio || 1, 2);       // device px per scene unit
  const pw = Math.max(64, Math.min(1400, Math.round(w*s))), ph = Math.max(64, Math.min(1400, Math.round(h*s*pw/(w*s))));
  if (r.domElement.width !== pw || r.domElement.height !== ph){ r.setPixelRatio(1); r.setSize(pw, ph, false); }
  K.camera.aspect = pw/ph; K.camera.updateProjectionMatrix();
  // slow turntable plus whatever the reader dragged
  const az = K.az0 + 0.32*Math.sin(t*0.16) + MINI.yaw, el = Math.max(-0.1, Math.min(0.9, K.el0 + MINI.pitch));
  K.camera.position.set(K.target.x + K.dist*Math.cos(el)*Math.sin(az), K.target.y + K.dist*Math.sin(el), K.target.z + K.dist*Math.cos(el)*Math.cos(az));
  K.camera.lookAt(K.target);
  K.update(t, p, E);
  r.render(K.scene, K.camera);
  G.ctx.drawImage(r.domElement, x, y, w, h);
  E.drag3d = {x, y, w, h};
  const v = new THREE.Vector3();
  return name => { const o = K.anchors[name]; if (!o) return null; (o.isObject3D ? o.getWorldPosition(v) : v.copy(o)).project(K.camera); return v.z > 1 ? null : [x + (v.x*0.5 + 0.5)*w, y + (-v.y*0.5 + 0.5)*h]; };
}

function miniStage(K, opts){
  const T = THREE, sc = K.scene = new T.Scene();
  sc.environment = MINI.env;
  sc.add(new T.HemisphereLight(0xffffff, 0xd9e0e3, 0.55));
  const key = new T.DirectionalLight(0xffffff, 0.85); key.position.set(260, 420, 360); sc.add(key);
  const rim = new T.DirectionalLight(0xdfe9ff, 0.4); rim.position.set(-380, 180, -300); sc.add(rim);
  const sh = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({map:immCanvasTex(256, 256, (x, w)=>{ const g = x.createRadialGradient(w/2, w/2, 0, w/2, w/2, w/2); g.addColorStop(0, 'rgba(20,30,36,.30)'); g.addColorStop(0.6, 'rgba(20,30,36,.08)'); g.addColorStop(1, 'rgba(20,30,36,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }), transparent:true, depthWrite:false}));
  sh.rotation.x = -Math.PI/2; sh.position.y = opts.floor; sh.scale.set(opts.shadow[0], opts.shadow[1], 1); sc.add(sh);
  K.camera = new T.PerspectiveCamera(opts.fov || 30, 1, 1, 4000);
  K.target = new T.Vector3(...opts.target); K.dist = opts.dist; K.az0 = opts.az; K.el0 = opts.el;
  K.anchors = {};
}
const MAT = {
  shell: () => new THREE.MeshPhysicalMaterial({color:0xf2f4f6, roughness:0.26, clearcoat:0.7, clearcoatRoughness:0.18}),
  glassShell: () => new THREE.MeshPhysicalMaterial({color:0xf4f6f8, roughness:0.2, clearcoat:0.6, transparent:true, opacity:0.22, depthWrite:false, side:THREE.DoubleSide}),
  trim: () => new THREE.MeshPhysicalMaterial({color:0xdfe5e8, roughness:0.35, clearcoat:0.5}),
  dark: () => new THREE.MeshStandardMaterial({color:0x2c363c, roughness:0.45, metalness:0.35}),
  metal: () => new THREE.MeshStandardMaterial({color:0x9aa7b0, roughness:0.3, metalness:0.85}),
  skin: () => new THREE.MeshPhysicalMaterial({color:0xe9d2c4, roughness:0.55, clearcoat:0.15}),
  pad: () => new THREE.MeshStandardMaterial({color:0x8a99a2, roughness:0.75}),
};
function miniTable(K, len, y, z0){
  const T = THREE, g = new T.Group();
  const top = new T.Mesh(new T.BoxGeometry(44, 5, len), MAT.shell()); top.position.set(0, y, z0 + len/2); g.add(top);
  const pad = new T.Mesh(new T.BoxGeometry(38, 3, len - 20), MAT.pad()); pad.position.set(0, y + 4, z0 + len/2 + 6); g.add(pad);
  const ph = 88 + y, ped = new T.Mesh(new T.ExtrudeGeometry(immRoundRect(34, ph, 8), {depth:60, bevelEnabled:true, bevelThickness:3, bevelSize:3, bevelSegments:3}), MAT.shell());
  ped.position.set(0, y - 3 - ph/2, z0 + len - 80); g.add(ped);
  K.scene.add(g); return g;
}
function miniHead(K, y, z, opacity){
  const T = THREE, g = new T.Group();
  const m = MAT.skin(); if (opacity < 1){ m.transparent = true; m.opacity = opacity; m.depthWrite = false; }
  const head = new T.Mesh(new T.SphereGeometry(1, 48, 32), m); head.scale.set(8, 9, 10); g.add(head);
  const body = new T.Mesh(T.CapsuleGeometry ? new T.CapsuleGeometry(14, 60, 8, 24) : new T.CylinderGeometry(15, 15, 80, 32), m.clone()); body.rotation.x = Math.PI/2; body.position.set(0, -4, 60); body.scale.set(1.25, 0.62, 1); g.add(body);
  g.position.set(0, y, z); K.scene.add(g); return g;
}

function miniBuild(kind){
  const K = {}, T = THREE, SIG = 0x0050ff;
  if (kind === 'ct'){
    miniStage(K, {floor:-95, shadow:[330, 340], target:[0, -6, 22], dist:590, az:0.72, el:0.2});
    // gantry: an opaque back half and a see-through front cover, so the rotating drum shows
    const front = immRoundRect(190, 200, 40), hole = new T.Path(); hole.absarc(0, 0, 41, 0, Math.PI*2, true); front.holes.push(hole);
    const back = new T.Mesh(new T.ExtrudeGeometry(front, {depth:26, bevelEnabled:true, bevelThickness:5, bevelSize:5, bevelSegments:6, curveSegments:64}), MAT.shell());
    back.position.set(0, 5, -36); K.scene.add(back);
    const cover = new T.Mesh(new T.ExtrudeGeometry(front, {depth:28, bevelEnabled:true, bevelThickness:5, bevelSize:5, bevelSegments:6, curveSegments:64}), MAT.glassShell());
    cover.position.set(0, 5, -8); cover.renderOrder = 3; K.scene.add(cover);
    const ring = new T.Mesh(new T.TorusGeometry(38.5, 0.8, 12, 140), new T.MeshStandardMaterial({color:SIG, emissive:SIG, emissiveIntensity:1.2})); ring.position.set(0, 5, 25.5); K.scene.add(ring);
    const base = new T.Mesh(new T.BoxGeometry(150, 14, 60), MAT.trim()); base.position.set(0, -88, -8); K.scene.add(base);
    // rotating drum: slip ring, tube, detector arc, fan beam
    const drum = new T.Group(); drum.position.set(0, 5, 2); K.scene.add(drum); K.drum = drum;
    const slip = new T.Mesh(new T.CylinderGeometry(78, 78, 22, 96, 1, true), new T.MeshStandardMaterial({color:0x9aa7b0, metalness:0.8, roughness:0.32, side:T.DoubleSide})); slip.rotation.x = Math.PI/2; drum.add(slip);
    const inner = new T.Mesh(new T.CylinderGeometry(46, 46, 24, 96, 1, true), MAT.trim()); inner.material.side = T.DoubleSide; inner.rotation.x = Math.PI/2; K.scene.add(inner); inner.position.set(0, 5, 2);
    const tube = new T.Group(); tube.position.set(0, 62, 0); drum.add(tube);
    const tb = new T.Mesh(new T.CylinderGeometry(9, 9, 34, 32), MAT.dark()); tb.rotation.z = Math.PI/2; tube.add(tb);
    const tc = new T.Mesh(new T.BoxGeometry(14, 8, 14), MAT.metal()); tc.position.y = -9; tube.add(tc);
    const focal = new T.Sprite(new T.SpriteMaterial({map:MINI.glow, color:0xffb24a, transparent:true, opacity:0.9, depthWrite:false})); focal.scale.set(10, 10, 1); focal.position.y = -13; tube.add(focal);
    K.anchors.tube = tube;
    // detector arc opposite the tube: 24 modules on a 1 m-radius arc about the focal spot
    const detG = new T.Group(); drum.add(detG); const dm = new T.MeshStandardMaterial({color:0x163a8a, metalness:0.3, roughness:0.35, emissive:SIG, emissiveIntensity:0.25});
    for (let i = -12; i < 12; i++){ const a = (i + 0.5)*0.034, R = 122, m = new T.Mesh(new T.BoxGeometry(4.6, 3, 20), dm); m.position.set(R*Math.sin(a), 49 - R*Math.cos(a), 0); m.rotation.z = a; detG.add(m); }
    K.anchors.det = new T.Vector3(0, 49 - 122, 0); K.detObj = new T.Object3D(); K.detObj.position.copy(K.anchors.det); drum.add(K.detObj); K.anchors.det = K.detObj;
    // fan beam: a thin wedge from the focal spot to the detector arc
    const fan = new T.Shape(); fan.moveTo(0, 49); for (let i = 0; i <= 24; i++){ const a = -0.41 + 0.82*i/24; fan.lineTo(119*Math.sin(a), 49 - 119*Math.cos(a)); } fan.lineTo(0, 49);
    const fanM = new T.Mesh(new T.ExtrudeGeometry(fan, {depth:2, bevelEnabled:false}), new T.MeshBasicMaterial({color:0x3d7bff, transparent:true, opacity:0.16, depthWrite:false, side:T.DoubleSide}));
    fanM.position.z = -1; fanM.renderOrder = 2; drum.add(fanM); K.fanM = fanM;
    miniTable(K, 190, -14, -20);
    miniHead(K, 1, 0, 1);
    K.anchors.table = new T.Vector3(0, -12, 130);
    K.update = (t, p)=>{ K.drum.rotation.z = -t*1.5; K.fanM.material.opacity = 0.1 + 0.08*(0.5 + 0.5*Math.sin(t*9)); };
  }
  if (kind === 'pet'){
    miniStage(K, {floor:-92, shadow:[300, 320], target:[0, -4, 20], dist:540, az:0.62, el:0.24});
    const front = immRoundRect(176, 184, 40), hole = new T.Path(); hole.absarc(0, 0, 38, 0, Math.PI*2, true); front.holes.push(hole);
    const back = new T.Mesh(new T.ExtrudeGeometry(front, {depth:16, bevelEnabled:true, bevelThickness:4, bevelSize:4, bevelSegments:5, curveSegments:64}), MAT.shell()); back.position.set(0, 5, -34); K.scene.add(back);
    const cover = new T.Mesh(new T.ExtrudeGeometry(front, {depth:30, bevelEnabled:true, bevelThickness:4, bevelSize:4, bevelSegments:5, curveSegments:64}), MAT.glassShell()); cover.material.opacity = 0.12; cover.position.set(0, 5, -14); cover.renderOrder = 3; K.scene.add(cover);
    const base = new T.Mesh(new T.BoxGeometry(140, 14, 52), MAT.trim()); base.position.set(0, -85, -10); K.scene.add(base);
    // detector ring: 4 rings x 48 blocks of LSO crystals
    const nB = 48, nR = 4, R = 44, geo = new T.BoxGeometry(5.4, 3.2, 4.4), mat = new T.MeshStandardMaterial({color:0xffffff, roughness:0.35, metalness:0.25, emissive:0x000000});
    const ib = new T.InstancedMesh(geo, mat, nB*nR), M4 = new T.Matrix4(), q = new T.Quaternion(), col = new T.Color();
    for (let r = 0; r < nR; r++) for (let i = 0; i < nB; i++){ const a = (i + 0.5)/nB*Math.PI*2; q.setFromAxisAngle(new T.Vector3(0, 0, 1), a + Math.PI/2);
      M4.compose(new T.Vector3(R*Math.cos(a), 5 + R*Math.sin(a), (r - 1.5)*4.8), q, new T.Vector3(1, 1, 1)); ib.setMatrixAt(r*nB + i, M4); ib.setColorAt(r*nB + i, col.setHex(0x2c363c)); }
    K.scene.add(ib); K.ib = ib; K.lit = new Float32Array(nB*nR); K.nB = nB; K.nR = nR; K.R = R;
    miniTable(K, 190, -14, -25);
    const head = miniHead(K, 1, 0, 0.32); head.children[1].visible = false;   // head only, see-through
    // brain glow inside the head
    const brain = new T.Mesh(new T.SphereGeometry(1, 40, 24), new T.MeshBasicMaterial({color:0xff7a2a, transparent:true, opacity:0.18, depthWrite:false})); brain.scale.set(6.4, 5.6, 8.2); brain.position.set(0, 3, -1); K.scene.add(brain);
    K.anchors.ring = new T.Vector3(R*Math.cos(-0.7), 5 + R*Math.sin(-0.7), 10); K.anchors.head = new T.Vector3(0, 3, 0);
    // lines of response and annihilation flashes
    K.maxL = 60; const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(new Float32Array(K.maxL*6), 3)); lg.setAttribute('color', new T.BufferAttribute(new Float32Array(K.maxL*6), 3));
    K.lines = new T.LineSegments(lg, new T.LineBasicMaterial({vertexColors:true, transparent:true, opacity:0.9, depthWrite:false})); K.lines.renderOrder = 4; K.lines.frustumCulled = false; K.scene.add(K.lines);
    K.flash = []; for (let i = 0; i < 12; i++){ const s = new T.Sprite(new T.SpriteMaterial({map:MINI.glow, color:0xffa53a, transparent:true, opacity:0, depthWrite:false})); s.scale.set(5, 5, 1); s.renderOrder = 5; K.scene.add(s); K.flash.push(s); }
    K.ev = []; K.last = 0; K.n = 0; K.rand = rnd(17);
    K.update = (t, p, E)=>{
      if (t - K.last > 0.05 || K.last > t){ K.last = t;
        const R2 = K.rand, o = new T.Vector3((R2() - 0.5)*10, 3 + (R2() - 0.5)*9, (R2() - 0.5)*13);
        const a = R2()*Math.PI*2, z = (R2() - 0.5)*0.25, d = new T.Vector3(Math.cos(a), Math.sin(a), z).normalize();
        // intersect both directions with the detector cylinder (axis z, centre y = 5)
        const hit = sgn => { const dx = d.x*sgn, dy = d.y*sgn, ox = o.x, oy = o.y - 5, A = dx*dx + dy*dy, B = 2*(ox*dx + oy*dy), C = ox*ox + oy*oy - K.R*K.R, s = (-B + Math.sqrt(B*B - 4*A*C))/(2*A); return new T.Vector3(o.x + dx*s, o.y + dy*s, o.z + d.z*sgn*s); };
        const A = hit(1), B = hit(-1); K.ev.push({A, B, o, at:t}); if (K.ev.length > K.maxL) K.ev.shift(); K.n++; if (typeof sndClick === 'function' && SC.id === 'pet') sndClick(0.7);
        for (const P of [A, B]) if (Math.abs(P.z) < 9.6){ const ang = (Math.atan2(P.y - 5, P.x) + Math.PI*2) % (Math.PI*2), i = Math.floor(ang/(Math.PI*2)*K.nB) % K.nB, r = Math.max(0, Math.min(K.nR - 1, Math.floor((P.z + 9.6)/4.8))); K.lit[r*K.nB + i] = 1; }
      }
      K.ev = K.ev.filter(e=>t - e.at < 0.8 && t >= e.at);
      const pa = K.lines.geometry.attributes.position, ca = K.lines.geometry.attributes.color;
      for (let i = 0; i < K.maxL; i++){ const e = K.ev[i];
        if (!e){ for (let k = 0; k < 6; k++){ pa.array[i*6 + k] = 0; ca.array[i*6 + k] = 0; } continue; }
        const f = 1 - (t - e.at)/0.8; pa.array.set([e.A.x, e.A.y, e.A.z, e.B.x, e.B.y, e.B.z], i*6); ca.array.set([0.1*f + (1 - f), 0.35*f + (1 - f), 1, 0.1*f + (1 - f), 0.35*f + (1 - f), 1], i*6); }
      pa.needsUpdate = true; ca.needsUpdate = true; K.lines.geometry.setDrawRange(0, K.maxL*2);
      K.flash.forEach((s, i)=>{ const e = K.ev[K.ev.length - 1 - i]; if (!e){ s.material.opacity = 0; return; } const f = 1 - (t - e.at)/0.35; s.material.opacity = Math.max(0, f); s.position.copy(e.o); });
      const c = new T.Color(), base = new T.Color(0x2c363c), hot = new T.Color(0x2f6bff);
      for (let k = 0; k < K.lit.length; k++){ K.ib.setColorAt(k, c.copy(base).lerp(hot, K.lit[k])); K.lit[k] *= 0.88; }
      K.ib.instanceColor.needsUpdate = true;
      E.petN = K.n;
    };
  }
  if (kind === 'spect'){
    miniStage(K, {floor:-92, shadow:[320, 340], target:[0, -12, 20], dist:570, az:0.7, el:0.22});
    // gantry ring the heads ride on
    const ringS = new T.Shape(); ringS.absarc(0, 0, 98, 0, Math.PI*2, false); const h2 = new T.Path(); h2.absarc(0, 0, 74, 0, Math.PI*2, true); ringS.holes.push(h2);
    const gantry = new T.Mesh(new T.ExtrudeGeometry(ringS, {depth:18, bevelEnabled:true, bevelThickness:4, bevelSize:4, bevelSegments:5, curveSegments:96}), MAT.shell()); gantry.position.set(0, -6, -46); K.scene.add(gantry);
    const ringL = new T.Mesh(new T.TorusGeometry(86, 0.8, 10, 160), new T.MeshStandardMaterial({color:SIG, emissive:SIG, emissiveIntensity:1.1})); ringL.position.set(0, -6, -23.5); K.scene.add(ringL);
    const base = new T.Mesh(new T.BoxGeometry(170, 14, 60), MAT.trim()); base.position.set(0, -85, -38); K.scene.add(base);
    // three gamma-camera heads on arms
    const rot = new T.Group(); rot.position.set(0, -6, 0); K.scene.add(rot); K.rot = rot;
    const colTex = immCanvasTex(256, 256, (x, w)=>{ x.fillStyle = '#5f6d75'; x.fillRect(0, 0, w, w); x.fillStyle = '#c7d0d5'; for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++){ x.beginPath(); x.arc(i*8 + 4 + (j % 2)*4, j*8 + 4, 2.6, 0, Math.PI*2); x.fill(); } });
    colTex.wrapS = colTex.wrapT = T.RepeatWrapping; colTex.repeat.set(3, 2);
    K.heads = [];
    for (let k = 0; k < 3; k++){
      const g = new T.Group(), a = k*Math.PI*2/3; g.rotation.z = a; rot.add(g);
      const body = new T.Mesh(new T.BoxGeometry(46, 14, 34), new T.MeshPhysicalMaterial({color:0xd3dce1, roughness:0.3, clearcoat:0.6})); body.position.y = 38; g.add(body);
      const face = new T.Mesh(new T.PlaneGeometry(42, 30), new T.MeshStandardMaterial({map:colTex, roughness:0.5, metalness:0.4})); face.rotation.x = Math.PI/2; face.position.y = 30.9; g.add(face);
      const edge = new T.Mesh(new T.BoxGeometry(46.4, 1.2, 34.4), new T.MeshStandardMaterial({color:SIG, emissive:SIG, emissiveIntensity:0.6})); edge.position.y = 31.4; g.add(edge);
      const arm = new T.Mesh(new T.BoxGeometry(10, 36, 8), MAT.trim()); arm.position.set(0, 62, -22); g.add(arm);
      K.heads.push(g);
    }
    K.anchors.head0 = new T.Object3D(); K.heads[0].add(K.anchors.head0); K.anchors.head0.position.set(0, 46, 0);
    miniTable(K, 190, -25, -25);
    miniHead(K, -10, 0, 1);
    // gamma photons: straight lines from the head into a camera face
    K.ph = []; for (let i = 0; i < 18; i++){ const s = new T.Sprite(new T.SpriteMaterial({map:MINI.glow, color:0xffa53a, transparent:true, opacity:0, depthWrite:false})); s.scale.set(3.2, 3.2, 1); s.renderOrder = 5; K.scene.add(s); K.ph.push({s, t0:-9}); }
    K.rand = rnd(29); K.last = 0;
    K.update = (t, p, E)=>{
      const th = t*0.45; K.rot.rotation.z = th; E.spAng = th;
      if (t - K.last > 0.09 || K.last > t){ K.last = t; const ph = K.ph.find(q=>t - q.t0 > 0.7); if (ph){ ph.t0 = t; ph.k = Math.floor(K.rand()*3); ph.o = new T.Vector3((K.rand() - 0.5)*9, (K.rand() - 0.5)*9 - 10, (K.rand() - 0.5)*12); } }
      for (const ph of K.ph){ const f = (t - ph.t0)/0.7; if (f < 0 || f > 1 || !ph.o){ ph.s.material.opacity = 0; continue; }
        const a = th + ph.k*Math.PI*2/3 + Math.PI/2, dir = new T.Vector3(Math.cos(a), Math.sin(a), 0), dist = 31 - ((ph.o.x)*dir.x + (ph.o.y + 6)*dir.y);
        ph.s.position.copy(ph.o).addScaledVector(dir, Math.min(1, f*1.4)*dist); ph.s.material.opacity = f < 0.7 ? 1 : (1 - f)/0.3; }
    };
  }
  immLinearize(K.scene);
  return K;
}

/* =====================================================================
   Story: routing, nav tabs, home reveal, methods index, chapters
   ===================================================================== */
const navEl = $('#nav'), tabsEl = $('#tabs'), homeEl = $('#home'), chapEl = $('#chapter'), viewerEl = $('#viewer');
const heroStage = $('#heroStage'), revealEl = $('#reveal');
const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a)*t;
const smooth = (a, b, x) => { const t = clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };
const easeOut = t => 1 - Math.pow(1 - t, 3);
let curToken = null, pendingSub = null, skipHash = null;

/* ---------- nav tabs ---------- */
tabsEl.innerHTML = ORDER.map(id=>`<button type="button" class="tab" data-go="${id}">${TAB_NAMES[id]}</button>`).join('') + `<button type="button" class="tab lab" data-go="lab">Laboratorio cerebral</button>`;
function markTab(id){ tabsEl.querySelectorAll('.tab').forEach(b=>{ const on = b.dataset.go === id; b.setAttribute('aria-current', on ? 'true' : 'false'); if (on && b.scrollIntoView) b.scrollIntoView({block:'nearest', inline:'nearest'}); }); }
function updateNav(){ navEl.dataset.show = (VIEW !== 'home' || window.scrollY > innerHeight*0.55) ? 'true' : 'false'; }
document.addEventListener('click', e=>{
  const b = e.target.closest('[data-go]'); if (!b) return;
  e.preventDefault(); go(b.dataset.go, b.dataset.sub);
});
$('#brand').addEventListener('click', ()=>go('top'));

/* ---------- routing ---------- */
function go(token, sub){
  pendingSub = sub || null;
  route(token);
  try { if (location.hash.slice(1) !== token){ skipHash = token; location.hash = token; } } catch(e){}
}
window.addEventListener('hashchange', ()=>{
  const t = location.hash.slice(1) || 'top';
  if (t === skipHash){ skipHash = null; return; }
  route(t);
});
const veil = document.createElement('div'); veil.className = 'veil'; document.body.appendChild(veil);
function route(token){
  const first = curToken === null;
  if (token === curToken && !pendingSub) return;
  curToken = token;
  if (first || reduceMotion){ applyRoute(token); return; }
  veil.classList.add('on');
  setTimeout(()=>{ applyRoute(token); requestAnimationFrame(()=>veil.classList.remove('on')); }, 260);
}
function applyRoute(token){
  if (typeof practiceRoute === 'function' && practiceRoute(token)) return;
  const [id, mode] = token.split('-');
  if (token === 'top' || token === 'methods' || !(ORDER.includes(id) || id === 'lab')) showHome(token === 'methods' ? 'methods' : 'top');
  else if (mode === 'scans' || mode === 'open') showViewer(id);
  else showChapter(id);
}

function mountCanvas(host){
  if (host === heroStage){ heroStage.prepend(canvas); heroStage.prepend(compatCanvas); heroStage.appendChild(glassEl); stage = heroStage; }
  else { stageEl.prepend(canvas); stageEl.prepend(compatCanvas); stageEl.insertBefore(glassEl, canvas.nextSibling); stage = stageEl; }
  canvas.style.opacity = fallbackReady ? '0' : '';
  canvas.style.pointerEvents = fallbackReady ? 'none' : '';
  compatCanvas.style.opacity = '';
  resize();
}
function showViews(v){ if (v === 'learn' && canvas.parentNode !== heroStage) mountCanvas(heroStage);  // park the GL canvas in the (hidden) home stage
  homeEl.hidden = v !== 'home'; chapEl.hidden = v !== 'learn'; viewerEl.hidden = v !== 'scans' && v !== 'lab'; document.body.classList.toggle('locked', v === 'scans' || v === 'lab'); }

function showHome(anchor){
  stopScene();
  if (S.tab === 'lab' && ready) setTab('scans');
  VIEW = 'home'; showViews('home'); markTab(null); heroKey = ''; fcard.hidden = true; hideTip(); glassEl.classList.remove('split', 'probe');
  mountCanvas(heroStage);
  if (anchor === 'methods') $('#methods').scrollIntoView(); else window.scrollTo(0, 0);
  heroLast = -1; updateNav(); heroTick();
}
function showChapter(id){
  VIEW = 'learn'; showViews('learn'); markTab(id); updateNav();
  buildChapter(id); window.scrollTo(0, 0); startScene(id);
}
let lastViewerId = 'mri';
function showViewer(id){
  stopScene(); lastViewerId = id;
  VIEW = id === 'lab' ? 'lab' : 'scans'; showViews(VIEW); markTab(id); updateNav();
  TAN = 0.28; HERO.glass = false; S.glass.placed = false;
  mountCanvas(stageEl);
  $('#rail .crumb').textContent = 'Cómo funciona ' + TAB_NAMES[id === 'lab' ? S.mod : id];
  if (ready) enterViewer(id);
}
function enterViewer(id){
  if (id === 'lab'){ if (S.tab !== 'lab') setTab('lab'); else { renderLabRail(); renderLabPanel(); } placeLabGlass(); }
  else {
    if (S.tab === 'lab') setTab('scans');
    const m = modObj(id), sub = pendingSub && m.subs.find(s=>s.id === pendingSub) ? pendingSub : (S.lastSub[id] || m.subs[0].id);
    S.state = 'normal';
    selectSub(id, sub, {rotate:true});
    $('#rail .crumb').textContent = 'Cómo funciona ' + TAB_NAMES[id];
  }
  pendingSub = null; resize(); dirty = true;
  if (id !== 'lab' && typeof practiceEnterViewer === 'function') practiceEnterViewer();
}

/* ---------- loading hooks (called from app.js) ---------- */
function onLoadProgress(f){ $('#heroLoadBar').style.width = (f*100).toFixed(1) + '%'; }
function onReady(){
  $('#heroLoad').classList.add('done'); $('#heroLoadMsg').textContent = fallbackReady ? 'Vista previa de referencia lista' : 'Listo';
  queueMethodThumbs();
  if (VIEW === 'scans' || VIEW === 'lab') enterViewer(lastViewerId);
  if (VIEW === 'home'){ heroLast = -1; heroTick(); }
}

/* ---------- home: scroll-driven reveal ---------- */
const capEls = [...document.querySelectorAll('#caps .cap')];
const Q34 = qFromLook(...basisLook(v3.mul([-0.72,0.6,0.36],-1),[0,0,1]));
const QSAG = qPlane('sagittal');
const HERO_CYCLE = [[0,'mri','t1','normal'],[0.5,'ct','ctb','normal'],[0.58,'pet','fdg','normal'],[0.66,'mri','dti','normal'],[0.74,'fmri','bold','visual']];
let heroLast = -1, heroRAF = 0, heroKey = '';
const heroIO = new IntersectionObserver(es=>{ heroVisible = es[0].isIntersecting; if (heroVisible) dirty = true; }); heroIO.observe(revealEl);
function heroProgress(){ const r = revealEl.getBoundingClientRect(); return clamp(-r.top/Math.max(1, r.height - innerHeight), 0, 1); }
function heroTick(){ cancelAnimationFrame(heroRAF); heroRAF = requestAnimationFrame(()=>{ const p = heroProgress(); if (p !== heroLast){ heroLast = p; heroApply(p); } }); }
window.addEventListener('scroll', ()=>{ if (VIEW === 'home'){ updateNav(); heroTick(); } else if (VIEW === 'learn') chapTick(); }, {passive:true});
window.addEventListener('resize', ()=>{ if (VIEW === 'home'){ heroLast = -1; heroTick(); } });
function heroApply(p){
  capEls.forEach(c=>{
    const a = +c.dataset.a, b = +c.dataset.b, fi = smooth(a, a + 0.025, p), fo = 1 - smooth(b - 0.025, b, p), o = Math.min(fi, fo);
    c.style.opacity = o.toFixed(3); c.style.transform = `translateY(${((1 - fi)*16 - (1 - fo)*12).toFixed(1)}px)`;
  });
  if (!ready && !fallbackReady) return;
  const a = smooth(0.0, 0.16, p);
  if (fallbackReady){ canvas.style.opacity = '0'; compatCanvas.style.opacity = a.toFixed(3); }
  else canvas.style.opacity = a.toFixed(3);
  TAN = 0.66 - 0.36*easeOut(a);
  const spin = (1 - smooth(0, 0.27, p))*-1.7;
  let q = q4.norm(q4.mul(q4.axis([0,0,1], spin), Q34));
  const turn = smooth(0.25, 0.38, p); if (turn > 0) q = q4.slerp(q, QSAG, turn);
  const back = smooth(0.86, 1.0, p); if (back > 0) q = q4.slerp(q, Q34, back);
  S.q = q; S.plane = turn > 0.99 && back < 0.01 ? 'sagittal' : 'free';
  S.slice = worldToSlice('sagittal', -7) * turn;
  // glass travels in from the right, sweeps, and leaves to the left
  const narrow = stageW < 640;
  const size = Math.round(narrow ? Math.min(stageW*0.74, stageH*0.42) : Math.min(stageW*0.34, stageH*0.6));
  const gIn = smooth(0.36, 0.45, p), gOut = smooth(0.84, 0.9, p), sweep = smooth(0.45, 0.84, p);
  HERO.glass = gIn > 0.001 && gOut < 0.999;
  const xA = stageW*(narrow ? 0.5 : 0.42) - size/2, xB = stageW*(narrow ? 0.5 : 0.56) - size/2;
  let x = gIn < 1 ? lerp(stageW + 30, xA, easeOut(gIn)) : lerp(xA, xB, sweep);
  if (gOut > 0) x = lerp(xB, stageW + 40, gOut*gOut);
  S.glass.size = size; S.glass.x = Math.round(x); S.glass.y = Math.round(stageH*(narrow ? 0.4 : 0.47) - size/2); S.glass.placed = true;
  glassEl.hidden = !HERO.glass || !sliceAvailable; layoutGlass();
  // which method sits under the glass
  let cyc = HERO_CYCLE[0]; for (const c of HERO_CYCLE) if (p >= c[0]) cyc = c;
  const key = cyc.slice(1).join('|');
  if (key !== heroKey){
    heroKey = key; S.mod = cyc[1]; S.sub = cyc[2]; S.state = cyc[3]; vesKey = ''; S.hover = -1;
    if (HERO.glass){ const sw = $('#heroSweep'); sw.style.left = (S.glass.x + size) + 'px'; sw.animate?.([{opacity:0.9, transform:'translateX(0)'},{opacity:0, transform:`translateX(${-size}px)`}], {duration:reduceMotion ? 0 : 650, easing:'cubic-bezier(.2,.7,.2,1)'}); }
  }
  updateAnnotations(); dirty = true;
}

/* ---------- home: methods ---------- */
$('#mGrid').innerHTML = ORDER.map(id=>{
  const m = modObj(id), c = METHOD_CARD[id], [sid, st] = c.thumb;
  return `<button type="button" class="m-card" data-go="${id}"><canvas width="${TH}" height="${TH}" data-key="${sid}|${st}" aria-hidden="true"></canvas>
    <span class="t"><span class="ab">${TAB_NAMES[id]}</span><span class="nm">${m.name}</span><span class="ds">${c.ds}</span>
    <span class="tg"><span class="pill ${c.kind === 'Función' ? 'fn' : ''}">${c.kind}</span><span class="pill">${c.res}</span><span class="pill">${c.time}</span></span></span></button>`;
}).join('');
function queueMethodThumbs(){
  for (const id of ORDER){ const [sid, st] = METHOD_CARD[id].thumb, key = sid + '|' + st; if (thumbCache.has(key)) paintThumb(key); else thumbQueue.push({key, sub:subById(sid), state:st}); }
}
(function resolutionFigure(){
  const W = 900, H = 430, L = 74, R = 20, T = 18, B = 56;
  const tx = v => L + (Math.log10(v) + 3)/(Math.log10(3600) + 3)*(W - L - R);
  const sy = v => H - B - (Math.log10(v) + 1)/3*(H - T - B);
  const boxes = [
    ['EEG','eeg',0.001,0.1,10,80,1],['MEG','meg',0.001,0.1,3,25,1],['Ecografía','us',0.01,0.05,0.3,2,0],['DSA','dsa',0.15,0.5,0.15,0.4,0],
    ['CT','ct',0.3,10,0.4,1,0],['fMRI','fmri',1,10,1.5,4,1],['MRI','mri',120,600,0.5,1.5,0],['SPECT','spect',60,1800,7,15,1],['PET','pet',600,3600,3.5,6.5,1]];
  let g = '';
  const xt = [[0.001,'1 ms'],[0.01,'10 ms'],[0.1,'100 ms'],[1,'1 s'],[10,'10 s'],[60,'1 min'],[600,'10 min'],[3600,'1 h']];
  const yt = [[0.1,'0.1 mm'],[1,'1 mm'],[10,'1 cm'],[100,'10 cm']];
  for (const [v, l] of xt) g += `<line x1="${tx(v)}" x2="${tx(v)}" y1="${T}" y2="${H - B}" stroke="#e2e7e9"/><text x="${tx(v)}" y="${H - B + 20}" text-anchor="middle" fill="#76858c" font-size="11" font-family="Azeret Mono, monospace">${l}</text>`;
  for (const [v, l] of yt) g += `<line x1="${L}" x2="${W - R}" y1="${sy(v)}" y2="${sy(v)}" stroke="#e2e7e9"/><text x="${L - 10}" y="${sy(v) + 4}" text-anchor="end" fill="#76858c" font-size="11" font-family="Azeret Mono, monospace">${l}</text>`;
  g += `<text x="${(L + W - R)/2}" y="${H - 10}" text-anchor="middle" fill="#3d4c53" font-size="12" font-family="Instrument Sans, sans-serif">Resolución temporal</text>`;
  g += `<text transform="translate(16 ${(T + H - B)/2}) rotate(-90)" text-anchor="middle" fill="#3d4c53" font-size="12" font-family="Instrument Sans, sans-serif">Resolución espacial</text>`;
  for (const [n, id, t0, t1, s0, s1, fn] of boxes){
    const x0 = tx(t0), x1 = tx(t1), y0 = sy(s1), y1 = sy(s0), wide = x1 - x0 > 60;
    g += `<g class="rbox" data-go="${id}" style="cursor:pointer"><rect x="${x0}" y="${y0}" width="${Math.max(8, x1 - x0)}" height="${y1 - y0}" rx="2" fill="${fn ? 'rgba(0,80,255,.12)' : 'rgba(12,22,27,.07)'}" stroke="${fn ? '#0050ff' : '#3d4c53'}" stroke-width="1"/>
      <text x="${wide ? (x0 + x1)/2 : x1 + 6}" y="${wide ? (y0 + y1)/2 + 4 : (y0 + y1)/2 + 4}" text-anchor="${wide ? 'middle' : 'start'}" fill="${fn ? '#0040cc' : '#0c161b'}" font-size="12.5" font-weight="600" font-family="Instrument Sans, sans-serif">${n}</text></g>`;
  }
  g += `<g font-size="11" font-family="Instrument Sans, sans-serif"><rect x="${W - R - 190}" y="${T + 6}" width="10" height="10" fill="rgba(12,22,27,.07)" stroke="#3d4c53"/><text x="${W - R - 174}" y="${T + 15}" fill="#3d4c53">Estructura</text>
    <rect x="${W - R - 100}" y="${T + 6}" width="10" height="10" fill="rgba(0,80,255,.12)" stroke="#0050ff"/><text x="${W - R - 84}" y="${T + 15}" fill="#3d4c53">Función</text></g>`;
  const svg = $('#resSvg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = g;
})();

/* ---------- chapters ---------- */
const pad2 = n => String(n).padStart(2, '0');
function buildChapter(id){
  const C = CHAPTERS[id], n = C.steps.length, isLab = id === 'lab';
  const next = isLab ? 'mri' : (ORDER[ORDER.indexOf(id) + 1] || 'lab');
  const subs = isLab ? '' : `<div class="cta-subs">${modObj(id).subs.map(s=>`<button type="button" data-go="${id}-scans" data-sub="${s.id}"><b>${s.name}</b><span>${s.seq}</span></button>`).join('')}</div>`;
  chapEl.innerHTML = `
  <header class="chap-head">
    <p class="eb">Cómo funciona · ${C.full}</p>
    <h1 class="chap-title ${C.long ? 'long' : ''}">${C.title}</h1>
    <p class="chap-lede">${C.lede}</p>
    <dl class="chap-meta">${C.meta.map(([k, v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    <button type="button" class="chap-skip" data-go="${id}-${isLab ? 'open' : 'scans'}">${isLab ? 'Ir directo al laboratorio' : 'Saltar a las exploraciones'} →</button>
  </header>
  ${typeof immMarkup === 'function' ? immMarkup(id) : ''}
  <div class="chap-body">
    <div class="chap-pin"><canvas id="sceneCv" aria-hidden="true"></canvas>
      <div class="pin-hud"><span id="pinStep">Paso 01 / ${pad2(n)}</span><span id="pinTag">${C.steps[0].tag}</span></div><i class="pin-prog" id="pinProg"></i></div>
    <ol class="steps">${C.steps.map((s, i)=>`<li class="step${i ? '' : ' on'}" data-i="${i}"><div class="stc">
      <span class="n">Paso ${pad2(i + 1)} / ${pad2(n)} · ${s.tag}</span><h3>${s.h}</h3><p>${s.p}</p>
      ${s.facts ? `<dl class="facts">${s.facts.map(([k, v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>` : ''}${ctlMarkup(id, i)}</div></li>`).join('')}</ol>
  </div>
  <section class="chap-cta">
    <p class="eb">${isLab ? 'Laboratorio cerebral' : 'Visor de ' + TAB_NAMES[id]}</p>
    <h2>${C.ctaTitle}</h2>
    <p>${C.ctaText}</p>
    ${subs}
    <div class="cta-row"><button type="button" class="btn-big" data-go="${id}-${isLab ? 'open' : 'scans'}">${isLab ? 'Abrir el Laboratorio cerebral' : 'Ver exploraciones de ' + TAB_NAMES[id]}</button>
      <button type="button" class="next-link" data-go="${next}">Siguiente: cómo funciona ${TAB_NAMES[next] === 'Laboratorio cerebral' ? 'el Laboratorio cerebral' : TAB_NAMES[next]} →</button></div>
  </section>`;
}

/* ---------- hands-on controls: the reader drives the physics on the pinned scene ---------- */
const SCENE_CTRL = {
  mri:{
    2:{note:'Ajuste usted mismo el ángulo de inclinación', inputs:[{k:'flip', l:'Ángulo de inclinación α', min:0, max:180, step:1, f:v=>v + '°'}],
       presets:[['30° · eco de gradiente rápido', {flip:30}], ['90° · eco de espín', {flip:90}], ['180° · inversión', {flip:180}]]},
    3:{note:'Elija TR y TE. El corte se recalcula a partir de este encéfalo con la ecuación del eco de espín.', inputs:[
        {k:'tr', l:'TR · tiempo de repetición', min:100, max:5000, step:10, f:v=>v + ' ms'},
        {k:'te', l:'TE · tiempo de eco', min:5, max:150, step:1, f:v=>v + ' ms'}],
       presets:[['T1', {tr:500, te:15}], ['Densidad protónica', {tr:3000, te:20}], ['T2', {tr:4000, te:100}]]}
  },
  ct:{
    4:{note:'Ventane el mismo corte de TC como lo haría un radiólogo', inputs:[
        {k:'ww', l:'Anchura de ventana', min:1, max:4000, log:true, f:v=>Math.round(v) + ' HU'},
        {k:'wl', l:'Nivel de ventana', min:-600, max:1200, step:1, f:v=>Math.round(v) + ' HU'}],
       presets:[['Encéfalo', {ww:80, wl:40}], ['Subdural', {ww:200, wl:75}], ['Ictus', {ww:40, wl:35}], ['Tejido blando', {ww:400, wl:40}], ['Hueso', {ww:2000, wl:500}]]}
  },
  meg:{
    2:{note:'Arrastre la fuente en el mapa o gírela aquí', drag:true, inputs:[
        {k:'ori', l:'Dirección de la corriente', min:0, max:359, step:1, f:v=>v + '°'},
        {k:'depth', l:'Profundidad de la fuente', min:15, max:80, step:1, f:v=>Math.round(v*0.9) + ' mm'}]}
  },
  us:{
    3:{note:'Incline la sonda: solo la parte del flujo paralela al haz desplaza la frecuencia', inputs:[
        {k:'theta', l:'Ángulo de insonación θ', min:30, max:90, step:1, f:v=>v + '°'}],
       presets:[['60°', {theta:60}], ['30°', {theta:30}], ['90°', {theta:90}]]}
  }
};
const ctlSpec = (id, i) => (SCENE_CTRL[id] || {})[i];
const LOGR = (inp, v) => inp.log ? Math.log(v/inp.min)/Math.log(inp.max/inp.min)*1000 : v;
const LOGV = (inp, r) => inp.log ? inp.min*Math.pow(inp.max/inp.min, r/1000) : r;
function ctlMarkup(id, i){
  const c = ctlSpec(id, i); if (!c) return '';
  return `<div class="ctl" data-step="${i}"><p class="ctl-h"><span>Pruébelo</span><button type="button" class="ctl-reset" data-ctl-reset="${i}">Seguir el desplazamiento</button></p><p class="ctl-note">${c.note}</p>
    ${c.inputs.map(inp=>`<label class="ctl-row"><span class="ctl-l">${inp.l}</span><output data-out="${inp.k}">–</output>
      <input type="range" data-k="${inp.k}" min="${inp.log ? 0 : inp.min}" max="${inp.log ? 1000 : inp.max}" step="${inp.log ? 1 : inp.step}"></label>`).join('')}
    ${c.presets ? `<div class="ctl-pre">${c.presets.map(([nm], j)=>`<button type="button" data-pre="${j}">${nm}</button>`).join('')}</div>` : ''}</div>`;
}
function ctlWire(){
  chapEl.querySelectorAll('.ctl').forEach(box=>{
    const i = +box.dataset.step, c = ctlSpec(SC.id, i);
    const set = (k, v)=>{ (SC.env.ctl || (SC.env.ctl = {}))[k] = v; box.classList.add('live'); };
    box.querySelectorAll('input[type=range]').forEach(el=>{ const inp = c.inputs.find(x=>x.k === el.dataset.k);
      el.addEventListener('input', ()=>{ set(inp.k, Math.round(LOGV(inp, +el.value)*10)/10); ctlSync(true); }); });
    box.querySelectorAll('[data-pre]').forEach(b=>b.addEventListener('click', ()=>{ const v = c.presets[+b.dataset.pre][1]; for (const k in v) set(k, v[k]); ctlSync(true); }));
    box.querySelector('[data-ctl-reset]').addEventListener('click', ()=>{ if (SC.env.ctl) c.inputs.forEach(inp=>delete SC.env.ctl[inp.k]); if (c.drag) delete SC.env.src; box.classList.remove('live'); });
  });
  // drag on the scene itself (MEG source)
  const cv = SC.cv; let dragging = false;
  const toScene = e => { const r = cv.getBoundingClientRect(), w = r.width, h = r.height, s = Math.min(w, h)/1000; return [(e.clientX - r.left - (w - 1000*s)/2)/s, (e.clientY - r.top - (h - 1000*s)/2)/s]; };
  const canDrag = () => { const c = ctlSpec(SC.id, SC.i); return c && c.drag && SC.env.drag; };
  const move = e => { const d = SC.env.drag, [x, y] = toScene(e); d.set((x - d.cx)/d.r, (y - d.cy)/d.r); chapEl.querySelector(`.ctl[data-step="${SC.i}"]`)?.classList.add('live'); };
  const MINI_STEPS = {ct:0, pet:2, spect:2}; let orb = null;
  cv.addEventListener('pointerdown', e=>{ const r3 = SC.env.drag3d; if (MINI_STEPS[SC.id] !== SC.i || !r3 || typeof MINI === 'undefined') return; const [x, y] = toScene(e);
    if (x < r3.x || x > r3.x + r3.w || y < r3.y || y > r3.y + r3.h) return; orb = {x:e.clientX, y:e.clientY, yaw:MINI.yaw, pitch:MINI.pitch}; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; e.preventDefault(); });
  cv.addEventListener('pointermove', e=>{ if (!orb) return; MINI.yaw = orb.yaw - (e.clientX - orb.x)*0.008; MINI.pitch = Math.max(-0.35, Math.min(0.6, orb.pitch + (e.clientY - orb.y)*0.006)); });
  const orbEnd = ()=>{ if (orb){ orb = null; cv.style.cursor = ''; } }; cv.addEventListener('pointerup', orbEnd); cv.addEventListener('pointercancel', orbEnd);
  cv.addEventListener('pointerdown', e=>{ if (!canDrag()) return; const d = SC.env.drag, [x, y] = toScene(e); if (Math.hypot(x - d.cx, y - d.cy) > d.r*1.05) return;
    dragging = true; cv.setPointerCapture(e.pointerId); move(e); e.preventDefault(); });
  cv.addEventListener('pointermove', e=>{ if (dragging) move(e); else if (!orb) cv.style.cursor = (canDrag() || (MINI_STEPS[SC.id] === SC.i && SC.env.drag3d)) ? 'grab' : ''; });
  const up = ()=>{ dragging = false; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
}
// keep each slider showing the value the scene is actually using (scroll-driven until touched)
function ctlSync(force){
  const box = chapEl.querySelector(`.ctl[data-step="${SC.i}"]`); if (!box) return;
  const c = ctlSpec(SC.id, SC.i), cur = Object.assign({}, SC.env.cur || {}, SC.env.ctl || {});
  c.inputs.forEach(inp=>{ const v = cur[inp.k]; if (v == null) return; const el = box.querySelector(`input[data-k="${inp.k}"]`), out = box.querySelector(`[data-out="${inp.k}"]`);
    if (force || document.activeElement !== el) el.value = LOGR(inp, v); out.textContent = inp.f(v); });
  SC.cv.style.touchAction = c.drag ? 'none' : '';
}

const SC = {id:null, raf:0, cv:null, ctx:null, i:0, p:0, prevI:-1, switchT:0, env:{}, W:0, H:0, dpr:1, prog:0};
function startScene(id){
  stopScene();
  SC.id = id; SC.cv = $('#sceneCv'); SC.ctx = SC.cv.getContext('2d'); SC.i = 0; SC.p = 0; SC.prevI = -1; SC.env = {};
  SC.steps = [...chapEl.querySelectorAll('.step')];
  if (typeof immStart === 'function') immStart(id);
  ctlWire();
  chapTick();
  const loop = now => { SC.raf = requestAnimationFrame(loop); drawScene(now/1000); };
  SC.raf = requestAnimationFrame(loop);
}
function stopScene(){ cancelAnimationFrame(SC.raf); SC.raf = 0; SC.id = null; if (typeof immStop === 'function') immStop(); if (typeof miniDispose === 'function') miniDispose(); }
function chapTick(){
  if (!SC.id) return;
  if (typeof immTick === 'function') immTick();
  const pin = chapEl.querySelector('.chap-pin'), pr = pin.getBoundingClientRect();
  const narrow = innerWidth <= 820;
  const anchor = narrow ? pr.bottom + (innerHeight - pr.bottom)*0.35 : innerHeight*0.55;
  let i = 0, p = 0;
  SC.steps.forEach((el, k)=>{ const r = el.getBoundingClientRect(); if (r.top <= anchor){ i = k; p = clamp((anchor - r.top)/r.height, 0, 1); } });
  const first = SC.steps[0].getBoundingClientRect(); if (first.top > anchor) p = 0;
  if (i !== SC.i){ SC.prevI = SC.i; SC.switchT = performance.now()/1000; SC.i = i; }
  SC.p = p;
  SC.steps.forEach((el, k)=>el.classList.toggle('on', k === i));
  { const a = `Paso ${pad2(i + 1)} / ${pad2(SC.steps.length)}`, b = CHAPTERS[SC.id].steps[i].tag, ea = $('#pinStep'), eb = $('#pinTag');
    if (ea.textContent !== a) ea.textContent = a; if (eb.textContent !== b) eb.textContent = b; }
  const last = SC.steps[SC.steps.length - 1].getBoundingClientRect(), tot = (last.bottom - first.top) || 1;
  $('#pinProg').style.setProperty('--p', clamp((anchor - first.top)/tot, 0, 1).toFixed(4));
}
function drawScene(t){
  const cv = SC.cv; if (!cv || !cv.isConnected) return;
  const vr = cv.getBoundingClientRect(); if (vr.bottom < 0 || vr.top > innerHeight) return;  // off-screen: skip
  const dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(cv.clientWidth*dpr), h = Math.round(cv.clientHeight*dpr);
  if (!w || !h) return;
  if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
  const ctx = SC.ctx, sc = SCENES[SC.id]; if (!sc) return;
  ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0, 0, w, h);
  const k = clamp((t - SC.switchT)/0.35, 0, 1);
  const p = reduceMotion ? 1 : SC.p;
  if (SC.prevI >= 0 && k < 1){ ctx.globalAlpha = 1 - k; sceneStep(ctx, w, h, dpr, sc, SC.prevI, 1, t); ctx.globalAlpha = k; }
  else ctx.globalAlpha = 1;
  sceneStep(ctx, w, h, dpr, sc, SC.i, p, t);
  ctx.globalAlpha = 1;
  if (ctlSpec(SC.id, SC.i) && (t - (SC.lastSync || 0)) > 0.1){ SC.lastSync = t; ctlSync(false); }
}
function sceneStep(ctx, w, h, dpr, sc, i, p, t){
  const s = Math.min(w, h)/1000;
  ctx.save(); ctx.setTransform(s, 0, 0, s, (w - 1000*s)/2, (h - 1000*s)/2);
  G.u = dpr/s; G.ctx = ctx; G.t = t; G.env = SC.env;
  try { sc[i](p, t, SC.env); } catch(err){ console.error(err); }
  ctx.restore();
}

/* first route: at the end of practice.js, once every route handler exists */

/* =====================================================================
   Practice: "Read the scan" cases, "Which scan first?" pathways,
   and shareable links to an exact view.
   Routes:  #practice · #case-<n> · #path-<id> · #<mod>-scans/<view params>
   ===================================================================== */

/* ---------------- content ---------------- */

const MOD_LABEL = id => TAB_NAMES[id] || id.toUpperCase();
/* case progress: declared before the first route may run on load */
let pendingView = null, pendingCase = null;
const PRAC = {done:{}};
try { PRAC.done = JSON.parse(localStorage.getItem('nl-cases') || '{}') || {}; } catch(e){ PRAC.done = {}; }
function pracSave(){ try { localStorage.setItem('nl-cases', JSON.stringify(PRAC.done)); } catch(e){} }
function showPractice(){
  stopScene(); if (S.tab === 'lab' && ready) setTab('scans');
  VIEW = 'learn'; showViews('learn'); markTab('practice'); updateNav();
  const done = Object.keys(PRAC.done).length, right = Object.values(PRAC.done).filter(v=>v === 'right').length;
  chapEl.innerHTML = `
  <header class="chap-head prac-head">
    <p class="eb">Práctica</p>
    <h1 class="chap-title long">Léalo.<br>Pídelo.</h1>
    <p class="chap-lede">Casos desconocidos para interpretar en el encéfalo y decisiones paso a paso sobre qué exploración solicitar a continuación. Todo se abre en el mismo visor, de modo que puede desplazarse, girar el encéfalo y comparar secuencias como en una estación de trabajo real.</p>
  </header>
  <section class="prac-sec">
    <div class="prac-sh"><div><p class="eb">Lea la exploración</p><h2>Casos desconocidos</h2><p>Cada caso ofrece una historia breve. Localice la anomalía en el corte, elija un diagnóstico y compare su respuesta con el informe.</p></div>
      <p class="prac-score">${done ? `${right} de ${done} respondidos correctamente` : `${CASES.length} casos`}</p></div>
    <div class="prac-grid">${CASES.map(c=>{ const st = PRAC.done[c.id];
      return `<button type="button" class="pcase" data-go="case-${c.id}"><span class="pc-top"><span class="pc-n">Caso ${String(c.id).padStart(2, '0')}</span><span class="pc-m">${c.subs.map(s=>subById(s).name).slice(0, 2).join(' · ')}</span>${st ? `<span class="pc-st ${st}">${st === 'right' ? 'Correcto' : 'Revisado'}</span>` : ''}</span>
        <span class="pc-hx">${c.hx}</span><span class="pc-lvl">${c.lvl}</span></button>`; }).join('')}</div>
  </section>
  <section class="prac-sec">
    <div class="prac-sh"><div><p class="eb">¿Qué exploración primero?</p><h2>Itinerarios clínicos</h2><p>Parta del paciente que tiene delante. En cada paso, elija qué solicitar y vea por qué, y después observe lo que muestra esa exploración.</p></div></div>
    <div class="prac-grid paths">${(typeof PATHWAYS === 'undefined' ? [] : PATHWAYS).map(P=>`<button type="button" class="ppath" data-go="path-${P.id}"><canvas width="${TH}" height="${TH}" data-key="${P.steps[0].res.sub}|${P.steps[0].res.state}" aria-hidden="true"></canvas>
      <span class="pp-t"><span class="pp-h">${P.title}</span><span class="pp-v">${P.vignette}</span><span class="pp-n">${P.steps.length} pasos</span></span></button>`).join('')}</div>
  </section>`;
  window.scrollTo(0, 0);
  queueCanvasThumbs(chapEl);
}
function queueCanvasThumbs(root){
  root.querySelectorAll('canvas[data-key]').forEach(cv=>{ const key = cv.dataset.key, [sid, st] = key.split('|');
    if (thumbCache.has(key)) paintThumb(key); else if (!thumbQueue.some(j=>j.key === key)) thumbQueue.push({key, sub:subById(sid), state:st}); });
}

/* ---------------- pathway page ---------------- */
function showPathway(P){
  stopScene(); if (S.tab === 'lab' && ready) setTab('scans');
  VIEW = 'learn'; showViews('learn'); markTab('practice'); updateNav();
  chapEl.innerHTML = `
  <header class="chap-head path-head">
    <button type="button" class="crumb2" data-go="practice">← Práctica</button>
    <p class="eb">¿Qué exploración primero? · ${P.tag}</p>
    <h1 class="chap-title long">${P.title}</h1>
    <div class="vignette"><b>El paciente</b><p>${P.vignette}</p></div>
  </header>
  <ol class="path-steps" id="pathSteps"></ol>
  <section class="path-end" id="pathEnd" hidden><p class="eb">Puntos clave</p><ul>${P.key.map(k=>`<li>${k}</li>`).join('')}</ul>
    <div class="cta-row"><button type="button" class="btn-big" data-go="practice">Más práctica</button></div></section>`;
  window.scrollTo(0, 0);
  const list = $('#pathSteps');
  const addStep = i => {
    const s = P.steps[i], li = document.createElement('li'); li.className = 'pstep';
    const opts = s.opts.map((o, k)=>({...o, k})).sort((a, b)=>hashf(a.k*7 + i*3 + P.id.length) - hashf(b.k*7 + i*3 + P.id.length));
    li.innerHTML = `<span class="ps-n">Paso ${i + 1} de ${P.steps.length}</span><h3>${s.q}</h3>
      <div class="ps-opts">${opts.map(o=>`<button type="button" class="ps-opt" data-k="${o.k}">${o.t}</button>`).join('')}</div>
      <p class="ps-why" hidden></p><div class="ps-res" hidden></div>`;
    list.appendChild(li);
    li.querySelectorAll('.ps-opt').forEach(b=>b.addEventListener('click', ()=>{
      if (li.classList.contains('solved')) return;
      const o = s.opts[+b.dataset.k], why = li.querySelector('.ps-why');
      b.classList.add(o.ok ? 'right' : 'wrong'); why.hidden = false; why.className = 'ps-why ' + (o.ok ? 'right' : 'wrong');
      why.innerHTML = `<b>${o.ok ? 'Sí.' : 'No es la primera.'}</b> ${o.why}`;
      if (!o.ok) return;
      li.classList.add('solved');
      const r = s.res, sub = subById(r.sub), res = li.querySelector('.ps-res'), key = r.sub + '|' + r.state;
      res.innerHTML = `<canvas width="${TH}" height="${TH}" data-key="${key}" aria-hidden="true"></canvas>
        <div class="pr-t"><span class="pr-k">${sub.name} · ${STATES[r.state].name}</span><p class="pr-cap">${r.cap}</p><p class="pr-note">${r.note}</p>
        <button type="button" class="btn primary" data-open="1">Abrir esta exploración en el visor →</button></div>`;
      res.hidden = false; queueCanvasThumbs(res);
      res.querySelector('[data-open]').addEventListener('click', ()=>go(`${sub.mod}-scans/` + new URLSearchParams({s:r.sub, st:r.state}).toString()));
      if (i + 1 < P.steps.length) setTimeout(()=>{ addStep(i + 1); }, 250);
      else $('#pathEnd').hidden = false;
    }));
  };
  addStep(0);
}

/* ---------------- case mode in the viewer ---------------- */
function caseEnter(c){
  S.caseMode = {c, phase:c.find ? 'find' : 'dx', tries:0, found:false, pick:-1, revealed:false};
  openPanel(false); fcard.hidden = true; hideTip();
  S.compare = false; $('#cmpBtn').setAttribute('aria-pressed', false);
  S.findings = false; $('#findBtn').setAttribute('aria-pressed', false);
  S.state = c.state; selectSub(c.mod, c.sub, {rotate:true}); S.state = c.state;
  rail.hidden = true; subbar.hidden = true; viewerEl.classList.add('casing'); resize();
  let el = $('#caseP'); if (!el){ el = document.createElement('aside'); el.className = 'casep'; el.id = 'caseP'; $('#stage').appendChild(el); }
  el.hidden = false; caseRender(); updateShift(); syncHud(); dirty = true;
}
function caseExit(){
  if (!S.caseMode) return;
  S.caseMode = null; S.findings = true; $('#findBtn').setAttribute('aria-pressed', true);
  const el = $('#caseP'); if (el) el.hidden = true;
  document.querySelectorAll('.cmark').forEach(m=>m.remove());
  rail.hidden = S.tab !== 'scans'; subbar.hidden = S.tab !== 'scans'; viewerEl.classList.remove('casing'); if (ready) resize();
  updateShift(); if (ready) syncHud(); dirty = true;
}
function caseRender(){
  const M = S.caseMode, c = M.c, el = $('#caseP'); if (!M || !el) return;
  const order = c.dx.map((t, k)=>({t, k})).sort((a, b)=>hashf(a.k*13 + c.id) - hashf(b.k*13 + c.id));
  const idx = CASES.indexOf(c), next = CASES[(idx + 1) % CASES.length];
  const st = STATES[c.state];
  el.innerHTML = `
    <div class="cp-h"><button type="button" class="crumb2" data-go="practice">← Todos los casos</button><span class="cp-n">Caso ${String(c.id).padStart(2, '0')} de ${CASES.length}</span></div>
    <div class="cp-b">
      <div class="vignette"><b>Anamnesis</b><p>${c.hx}</p></div>
      ${c.subs.length > 1 ? `<div class="cp-seq"><span>Secuencias</span>${c.subs.map(s=>`<button type="button" class="chip" data-sub="${s}" aria-pressed="${s === S.sub}">${subById(s).name}</button>`).join('')}</div>` : ''}
      ${c.find ? `<section class="cp-step ${M.found || M.revealed ? 'done' : ''}"><h3><i>1</i>Localícela</h3>
        <p>${M.found ? 'Encontrada. Esa es la anomalía.' : M.revealed ? 'Mostrada en el corte en ámbar.' : M.tries ? `Ahí no está${M.tries >= 3 ? '' : ', inténtelo de nuevo'}. Recorra los cortes y gire el encéfalo si lo necesita.` : 'Pulse la anomalía en el corte. Desplácese para recorrer los cortes.'}</p>
        ${!M.found && !M.revealed && M.tries >= 3 ? '<button type="button" class="mini" data-act="show">Muéstremela</button>' : ''}</section>` : ''}
      <section class="cp-step ${M.pick >= 0 ? 'done' : ''}"><h3><i>${c.find ? 2 : 1}</i>Diagnóstico</h3>
        <div class="cp-dx">${order.map(o=>`<button type="button" class="ps-opt ${M.pick === o.k ? (o.k === 0 ? 'right' : 'wrong') : (M.pick >= 0 && o.k === 0 ? 'right' : '')}" data-dx="${o.k}" ${M.pick >= 0 ? 'disabled' : ''}>${o.t}</button>`).join('')}</div></section>
      ${M.revealed ? `<section class="cp-ans"><p class="eb">${M.pick === 0 ? 'Correcto' : 'Respuesta'}</p><h3>${st.name}</h3>
        <div class="cp-rep"><b>Informe</b><p>${c.report}</p></div>
        <ul>${c.teach.map(t=>`<li>${t}</li>`).join('')}</ul>
        <div class="cta-row"><button type="button" class="btn primary" data-go="case-${next.id}">Caso siguiente →</button><button type="button" class="btn" data-act="states">Comparar con otros pacientes</button></div></section>` : ''}
    </div>`;
  el.querySelectorAll('[data-sub]').forEach(b=>b.addEventListener('click', ()=>{ const s = subById(b.dataset.sub); S.state = c.state; selectSub(s.mod, s.id, {rotate:true}); S.state = c.state; caseRender(); syncHud(); }));
  el.querySelectorAll('[data-dx]').forEach(b=>b.addEventListener('click', ()=>{ if (M.pick >= 0) return; M.pick = +b.dataset.dx; caseReveal(); }));
  const sh = el.querySelector('[data-act="show"]'); if (sh) sh.addEventListener('click', ()=>{ S.findings = true; M.revealed = false; M.shown = true; $('#findBtn').setAttribute('aria-pressed', true); M.found = false; M.tries = 3; caseRender(); dirty = true; });
  const cs = el.querySelector('[data-act="states"]'); if (cs) cs.addEventListener('click', ()=>{ const c0 = S.caseMode.c; caseExit(); S.state = c0.state; syncHud(); openPanel(true); try { history.replaceState(null, '', '#' + viewEncode()); curToken = viewEncode(); } catch(e){} });
}
function caseReveal(){
  const M = S.caseMode; M.revealed = true; M.phase = 'done';
  S.findings = true; $('#findBtn').setAttribute('aria-pressed', true);
  PRAC.done[M.c.id] = M.pick === 0 ? 'right' : 'seen'; pracSave();
  caseRender(); syncHud(); dirty = true;
}
function caseClick(cx, cy){
  const M = S.caseMode; if (!M) return false;
  if (M.revealed || !M.c.find || M.found){ // after the reveal, clicking a finding opens its explanation as usual
    if (M.revealed){ const f = findingAt(slicePoint(cx, cy), cx, cy); if (f) openFinding(f.l.f, cx, cy); }
    return true;
  }
  const f = findingAt(slicePoint(cx, cy), cx, cy);
  const mk = document.createElement('div'); mk.className = 'cmark ' + (f ? 'hit' : 'miss'); mk.style.left = cx + 'px'; mk.style.top = cy + 'px'; $('#stage').appendChild(mk);
  if (f){ M.found = true; S.hover = f.i; } else M.tries++;
  setTimeout(()=>mk.remove(), f ? 2600 : 1400);
  caseRender(); dirty = true; return true;
}

/* ---------- first route (moved here from story.js so practice routes exist) ---------- */
markTab(null);

/* =====================================================================
   Touch gestures: swipe the signal panel aside, swipe the findings card away,
   drag the Brain states sheet down, pinch the scan slide.
   ===================================================================== */
var chartTucked = false, chartHinted = false;
function chartShown(){
  if (!chart.querySelector('.chart-tab')){
    const tab = document.createElement('button'); tab.type = 'button'; tab.className = 'chart-tab'; tab.setAttribute('aria-label', 'Mostrar el panel de señal');
    tab.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M2 12h3l2-6 3 12 3-9 2 5 2-2h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><i aria-hidden="true"></i>';
    tab.addEventListener('click', e=>{ e.stopPropagation(); chartTuck(0); });
    const grip = document.createElement('div'); grip.className = 'chart-grip'; grip.setAttribute('aria-hidden', 'true'); grip.innerHTML = '<i></i><b></b><i></i>';
    chart.append(tab, grip);
  }
  // the first time the panel appears on a touch screen, nudge it once so the swipe is discoverable
  if (TOUCH && !chartHinted && !chartTucked && !reduceMotion){ chartHinted = true; chart.classList.add('nudge'); setTimeout(()=>chart.classList.remove('nudge'), 1700); }
}
function chartTuck(dir){
  chartTucked = !!dir;
  chart.classList.remove('nudge');
  chart.classList.toggle('tuck-l', dir < 0); chart.classList.toggle('tuck-r', dir > 0); chart.classList.toggle('tucked', !!dir);
  const tab = chart.querySelector('.chart-tab'); if (tab) tab.tabIndex = dir ? 0 : -1;
  if (!dir) drawChartStatic();
  dirty = true;
}
// Horizontal swipe on an element: follows the finger, then either commits (fling or past 30% of the width) or springs back.
function hSwipe(el, opt){
  let s = null;
  const reset = ()=>{ el.classList.remove('swiping'); el.style.transform = ''; el.style.opacity = ''; };
  el.addEventListener('pointerdown', e=>{
    if (e.button > 0 || (opt.ignore && e.target.closest(opt.ignore)) || (opt.when && !opt.when())) return;
    s = {id:e.pointerId, x:e.clientX, y:e.clientY, on:false, dx:0, v:0, lt:performance.now(), lx:e.clientX};
  });
  el.addEventListener('pointermove', e=>{
    if (!s || e.pointerId !== s.id) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (!s.on){
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)){ s = null; return; }
      s.on = true; try { el.setPointerCapture(e.pointerId); } catch(err){} el.classList.add('swiping');
    }
    const t = performance.now(); if (t > s.lt){ s.v = (e.clientX - s.lx)/(t - s.lt); s.lt = t; s.lx = e.clientX; }
    s.dx = dx;
    el.style.transform = `translateX(${dx.toFixed(1)}px)`;
    el.style.opacity = (1 - Math.min(0.5, Math.abs(dx)/(el.offsetWidth*1.6))).toFixed(3);
    e.preventDefault();
  });
  const end = e=>{
    if (!s || e.pointerId !== s.id) return;
    const st = s; s = null; if (!st.on) return;
    const w = el.offsetWidth, fling = Math.abs(st.v) > 0.45 && Math.sign(st.v) === Math.sign(st.dx);
    if (e.type !== 'pointercancel' && (Math.abs(st.dx) > w*0.3 || fling)) opt.commit(Math.sign(st.dx), reset);
    else reset();
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  // a swipe should not also count as a click on whatever was under the finger
  el.addEventListener('click', e=>{ if (el.classList.contains('swiping')) e.stopPropagation(); }, true);
}
hSwipe(chart, {ignore:'button,select,input,a', when:()=>!chartTucked, commit:(dir, reset)=>{ reset(); chartTuck(dir); }});
hSwipe(fcard, {ignore:'button,select,input,a', commit:(dir, reset)=>{
  fcard.classList.remove('swiping'); fcard.style.transform = `translateX(${dir*(fcard.offsetWidth + 40)}px)`; fcard.style.opacity = '0';
  setTimeout(()=>{ fcard.hidden = true; reset(); }, 220);
}});

// Brain states sheet (phones): drag its header down to close it
(function(){
  const head = panel.querySelector('.p-head'); if (!head) return;
  const grab = document.createElement('div'); grab.className = 'p-grab'; grab.setAttribute('aria-hidden', 'true'); panel.prepend(grab);
  let s = null;
  const start = e=>{ if (innerWidth > 820 || !S.panel || e.button > 0 || e.target.closest('button')) return;
    s = {id:e.pointerId, y:e.clientY, dy:0, v:0, lt:performance.now(), ly:e.clientY, on:false}; };
  const move = e=>{ if (!s || e.pointerId !== s.id) return;
    const dy = e.clientY - s.y;
    if (!s.on){ if (Math.abs(dy) < 6) return; s.on = true; try { e.currentTarget.setPointerCapture(e.pointerId); } catch(err){} panel.classList.add('swiping'); }
    const t = performance.now(); if (t > s.lt){ s.v = (e.clientY - s.ly)/(t - s.lt); s.lt = t; s.ly = e.clientY; }
    s.dy = Math.max(0, dy); panel.style.transform = `translateY(${s.dy.toFixed(1)}px)`; e.preventDefault(); };
  const end = e=>{ if (!s || e.pointerId !== s.id) return; const st = s; s = null; if (!st.on) return;
    panel.classList.remove('swiping'); panel.style.transform = '';
    if (e.type !== 'pointercancel' && (st.dy > panel.offsetHeight*0.22 || st.v > 0.5)) openPanel(false); };
  [head, grab].forEach(el=>{ el.addEventListener('pointerdown', start); el.addEventListener('pointermove', move); el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); });
})();

// Two fingers on the scan view resize the slide (and the scan inside it) around the pinch
(function(){
  const pts = new Map(); let pinch = null;
  const skip = t => panel.contains(t) || fcard.contains(t) || chart.contains(t) || $('#labPanel').contains(t) || !!t.closest('.hud-top,.hud-bottom');
  const begin = ()=>{ const [a, b] = [...pts.values()], sr = stageEl.getBoundingClientRect(), g = S.glass;
    const mx = (a.x + b.x)/2 - sr.left, my = (a.y + b.y)/2 - sr.top;
    pinch = {d:Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)), size:g.size, fx:(mx - g.x)/g.size, fy:(my - g.y)/g.size};
    drag = null; canvas.classList.remove('dragging'); glassEl.classList.remove('dragging'); glassEl.classList.add('pinching'); hideTip(); };
  stageEl.addEventListener('pointerdown', e=>{
    if (e.pointerType !== 'touch' || skip(e.target) || VIEW !== 'scans') return;
    pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if (pts.size === 2){ begin(); e.stopPropagation(); }
    else if (pts.size > 2) e.stopPropagation();
  }, true);
  stageEl.addEventListener('pointermove', e=>{
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if (!pinch || pts.size < 2) return;
    e.stopPropagation();
    const [a, b] = [...pts.values()], sr = stageEl.getBoundingClientRect(), g = S.glass;
    const mx = (a.x + b.x)/2 - sr.left, my = (a.y + b.y)/2 - sr.top;
    g.size = Math.round(pinch.size*Math.hypot(a.x - b.x, a.y - b.y)/pinch.d);
    clampGlass(); g.x = Math.round(mx - pinch.fx*g.size); g.y = Math.round(my - pinch.fy*g.size);
    clampGlass(); layoutGlass(); dirty = true; updateAnnotations();
  }, true);
  const up = e=>{ if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId);
    if (pinch){ e.stopPropagation(); if (pts.size < 2){ pinch = null; drag = null; glassEl.classList.remove('pinching'); } } };
  stageEl.addEventListener('pointerup', up, true); stageEl.addEventListener('pointercancel', up, true);
})();

// keep the signal panel sized to the screen when the phone rotates
{ let rz = 0; window.addEventListener('resize', ()=>{ clearTimeout(rz); rz = setTimeout(()=>{ if (!chart.hidden && ready) setupChart(); }, 150); }); }

route((location.hash.slice(1)) || 'top');
if (location.hostname === 'localhost') window.__NL = {S, findAt:(cx, cy)=>findingAt(slicePoint(cx, cy), cx, cy), sp:(cx, cy)=>slicePoint(cx, cy), dims:()=>[stageW, stageH, viewShift, S.slice, S.plane, S.state, S.sub, S.q, qPlane('axial'), !!tween, TAN, DIST], viewEncode};

/* =====================================================================
   Sound, off by default. One toggle in the nav. Everything is
   synthesised with Web Audio (no files):
   · MRI   — gradient-coil knocks, repeating once per TR
   · Doppler — the audible Doppler shift itself: filtered noise whose
               pitch follows blood velocity (what a TCD operator hears)
   · PET   — a click for each detected coincidence
   ===================================================================== */
const SND = {on:false, ctx:null, master:null, raf:0, nextKnock:0, mode:'', dop:null};
if (location.hostname === 'localhost') window.__SND = SND;

function sndInit(){
  if (SND.ctx) return SND.ctx;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  const c = SND.ctx = new AC();
  SND.master = c.createGain(); SND.master.gain.value = 0.0001; SND.master.connect(c.destination);
  // two seconds of white noise, shared by every voice
  const b = c.createBuffer(1, c.sampleRate*2, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1;
  SND.noise = b;
  return c;
}
function sndSet(on){
  SND.on = on;
  const btn = $('#sndBtn'); if (btn){ btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.querySelector('span').textContent = on ? 'Sonido activado' : 'Sonido'; }
  if (on){ const c = sndInit(); if (!c){ SND.on = false; return; } c.resume && c.resume(); SND.master.gain.setTargetAtTime(0.9, c.currentTime, 0.05); if (!SND.raf) SND.raf = requestAnimationFrame(sndFrame); }
  else if (SND.ctx){ SND.master.gain.setTargetAtTime(0.0001, SND.ctx.currentTime, 0.04); sndDoppler(0, 0); }
}

/* ---- voices ---- */
function sndKnock(at, strength){
  const c = SND.ctx, src = c.createBufferSource(); src.buffer = SND.noise; src.playbackRate.value = 0.8 + Math.random()*0.1;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 620 + Math.random()*60; bp.Q.value = 5;
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.9*strength, at + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.07);
  // the coil rings: a damped tone under the noise
  const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = 1180; const og = c.createGain();
  og.gain.setValueAtTime(0.0001, at); og.gain.exponentialRampToValueAtTime(0.35*strength, at + 0.002); og.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  src.connect(bp).connect(g).connect(SND.master); o.connect(og).connect(SND.master);
  src.start(at, Math.random()*1.5, 0.09); o.start(at); o.stop(at + 0.06);
}
function sndClick(strength = 1){
  if (!SND.on || !SND.ctx) return;
  const c = SND.ctx, at = c.currentTime + 0.005, src = c.createBufferSource(); src.buffer = SND.noise;
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2400;
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.5*strength, at + 0.001); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.012);
  src.connect(hp).connect(g).connect(SND.master); src.start(at, Math.random()*1.9, 0.02);
}
// continuous Doppler voice: v in cm/s along the beam; Δf = 2·f0·v/c with f0 = 2 MHz
function sndDoppler(v, level){
  const c = SND.ctx; if (!c) return;
  if (!SND.dop && level > 0){
    const src = c.createBufferSource(); src.buffer = SND.noise; src.loop = true;
    const b1 = c.createBiquadFilter(); b1.type = 'bandpass'; b1.Q.value = 2.2;
    const b2 = c.createBiquadFilter(); b2.type = 'bandpass'; b2.Q.value = 1.1;
    const g = c.createGain(); g.gain.value = 0.0001;
    src.connect(b1).connect(b2).connect(g).connect(SND.master); src.start();
    SND.dop = {src, b1, b2, g};
  }
  if (!SND.dop) return;
  const f = Math.max(80, 2*2e6*Math.abs(v)/100/1540), now = c.currentTime;
  SND.dop.b1.frequency.setTargetAtTime(f, now, 0.012); SND.dop.b2.frequency.setTargetAtTime(f*0.8, now, 0.012);
  SND.dop.g.gain.setTargetAtTime(level > 0 ? Math.max(0.0001, level*Math.min(1, Math.abs(v)/40)*1.6) : 0.0001, now, 0.02);
  if (level <= 0 && SND.dop.idle == null) SND.dop.idle = now;
  if (level > 0) SND.dop.idle = null;
  if (SND.dop.idle != null && now - SND.dop.idle > 0.5){ try { SND.dop.src.stop(); } catch(e){} SND.dop = null; }
}

/* ---- what is on screen decides what you hear ---- */
function sndFrame(){
  SND.raf = 0; if (!SND.on || !SND.ctx) return;
  SND.raf = requestAnimationFrame(sndFrame);
  const c = SND.ctx, now = c.currentTime;
  let knock = 0, tr = 0.6, dop = 0, vel = 0;
  if (VIEW === 'learn' && SC.id === 'mri'){
    const R = typeof IMM !== 'undefined' ? IMM.r : null;
    if (R && IMM.visible){ const p = R.p; knock = p < 0.55 ? 0 : p < 0.66 ? (p - 0.55)/0.11*0.35 : p < 0.75 ? 0.35 : 1; tr = p > 0.85 ? 0.09 : 0.5; }   // EPI-like rattle once gradients drive the slice
    else if (SC.i >= 3){ const cur = SC.env.cur || {}; knock = 0.8; tr = Math.max(0.1, (cur.tr || 600)/1000); }
  }
  // the walkthroughs: EPI rattle while fMRI scans, the Doppler voice once the probe finds the artery
  { const Rw = typeof IMM !== 'undefined' ? IMM.r : null;
    if (VIEW === 'learn' && Rw && IMM.visible && SC.id === 'fmri' && Rw.p > 0.4 && Rw.p < 0.99){ knock = Rw.p > 0.85 ? 0.6 : 0.3; tr = 0.08; }
    if (VIEW === 'learn' && Rw && IMM.visible && SC.id === 'us' && Rw.p > 0.67){ vel = tcdVel('normal', performance.now()/1000); dop = 1; } }
  if (VIEW === 'learn' && SC.id === 'us' && SC.i === 3){ const th = ((SC.env.cur || {}).theta ?? 54)*Math.PI/180; vel = tcdVel('normal', performance.now()/1000)*Math.cos(th); dop = 1; }
  if (VIEW === 'scans' && typeof activeSub === 'function' && activeSub().code === 51){ vel = tcdVel(activeState().tcd || 'normal', simT); dop = 1; }
  if (knock > 0){
    if (SND.nextKnock < now) SND.nextKnock = now + 0.05;
    while (SND.nextKnock < now + 0.12){ const at = SND.nextKnock, n = tr < 0.2 ? 1 : 3; for (let k = 0; k < n; k++) sndKnock(at + k*0.028, knock*(k ? 0.75 : 1)); SND.nextKnock += tr; }
  }
  sndDoppler(vel, dop);
}

function sndWire(){
  const tabs = $('#tabs'); if (!tabs || $('#sndBtn')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'snd'; b.id = 'sndBtn'; b.setAttribute('aria-pressed', 'false');
  b.title = 'Sonidos del escáner: golpeteo de la RM, Doppler y clics del detector de PET';
  b.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-3.5v11L6 12H3z" fill="currentColor"/><path class="w1" d="M13 7.5a3.5 3.5 0 0 1 0 5" /><path class="w2" d="M15.2 5.2a6.6 6.6 0 0 1 0 9.6" /></svg><span>Sonido</span>';
  tabs.after(b);
  b.addEventListener('click', ()=>sndSet(!SND.on));
}
sndWire();



/* ---------------- progress (per viewer, best effort) ---------------- */

/* ---------------- nav tab ---------------- */
(function(){ const lab = tabsEl.querySelector('.tab.lab'); const b = document.createElement('button'); b.type = 'button'; b.className = 'tab prac'; b.dataset.go = 'practice'; b.textContent = 'Práctica'; tabsEl.insertBefore(b, lab); })();

/* ---------------- routing hook (called from story.js applyRoute) ---------------- */
function practiceRoute(token){
  const [base, qs] = token.split('/');
  if (S.caseMode && base !== 'case-' + S.caseMode.c.id) caseExit();
  if (base === 'practice'){ showPractice(); return true; }
  const m = base.match(/^(case|path)-(\w+)$/);
  if (m && m[1] === 'path'){ const P = (typeof PATHWAYS === 'undefined' ? [] : PATHWAYS).find(p=>p.id === m[2]); if (P){ showPathway(P); return true; } }
  if (m && m[1] === 'case'){ const c = CASES.find(x=>String(x.id) === m[2]); if (c){ pendingCase = c; pendingSub = c.sub; showViewer(c.mod); return true; } }
  if (qs){ const [id, mode] = base.split('-'); if (ORDER.includes(id) && (mode === 'scans' || mode === 'open')){ pendingView = viewDecode(qs); pendingSub = pendingView.s || null; showViewer(id); return true; } }
  return false;
}
// called at the end of enterViewer (story.js)
function practiceEnterViewer(){
  if (pendingCase){ const c = pendingCase; pendingCase = null; caseEnter(c); }
  else if (pendingView){ const v = pendingView; pendingView = null; viewApply(v); }
}

/* ---------------- shareable view links ---------------- */
const r3 = v => Math.round(v*1000)/1000;
function viewEncode(){
  const sub = activeSub(), p = new URLSearchParams();
  p.set('s', S.sub); p.set('st', S.state); p.set('pl', S.plane); p.set('sl', S.slice.toFixed(1));
  if (S.plane === 'free') p.set('q', S.q.map(r3).join(','));
  p.set('g', [S.glass.x/stageW, S.glass.y/stageH, S.glass.size/Math.min(stageW, stageH)].map(r3).join(','));
  if (S.compare && !sub.surface){ p.set('c', S.sub2); p.set('sp', r3(S.split)); }
  if (!S.findings) p.set('f', '0'); if (S.labels) p.set('lb', '1');
  return `${S.mod}-scans/${p.toString()}`;
}
function viewDecode(qs){ const p = new URLSearchParams(qs), o = {}; for (const [k, v] of p) o[k] = v; return o; }
function viewApply(v){
  const sub = subById(v.s);
  if (sub){ if (v.st && sub.states.includes(v.st)) S.state = v.st; selectSub(sub.mod, sub.id); if (v.st && sub.states.includes(v.st)) setState(v.st); }
  const pl = v.pl || standardPlane();
  S.plane = pl;
  if (v.q){ const q = v.q.split(',').map(Number); if (q.length === 4 && q.every(isFinite)) S.q = q4.norm(q); }
  else if (pl !== 'free') S.q = qPlane(pl);
  S.slice = v.sl != null && isFinite(+v.sl) ? +v.sl : sliceFor(pl);
  tween = null; sliceIn.value = S.slice; syncPlaneButtons();
  if (v.g){ const g = v.g.split(',').map(Number); if (g.length === 3 && g.every(isFinite)){ const m = Math.min(stageW, stageH); S.glass.size = g[2]*m; S.glass.x = g[0]*stageW; S.glass.y = g[1]*stageH; S.glass.placed = true; } }
  S.compare = !!v.c; if (v.c && subById(v.c)){ S.sub2 = v.c; S.split = +v.sp || 0.5; }
  $('#cmpBtn').setAttribute('aria-pressed', S.compare); buildCmpSelect();
  S.findings = v.f !== '0'; $('#findBtn').setAttribute('aria-pressed', S.findings);
  S.labels = v.lb === '1'; $('#labelBtn').setAttribute('aria-pressed', S.labels);
  clampGlass(); layoutGlass(); syncHud(); dirty = true;
}
function shareLink(token){
  // inside a host frame (e.g. a published preview) the address bar belongs to the host, so the link uses this page's own address
  return location.href.split('#')[0] + '#' + token;
}
(function(){
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'shareBtn'; b.title = 'Copiar un enlace a esta vista exacta';
  b.innerHTML = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" style="vertical-align:-2px;margin-right:5px"><path d="M6.5 9.5l3-3M7 4.5l1.2-1.2a2.6 2.6 0 0 1 3.7 3.7L10.7 8.2M9 11.5l-1.2 1.2a2.6 2.6 0 0 1-3.7-3.7L5.3 7.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>Compartir vista';
  $('#statesBtn').before(b);
  const pop = document.createElement('div'); pop.className = 'sharepop'; pop.hidden = true;
  pop.innerHTML = `<b>Enlace a esta vista exacta</b><span>Exploración, estado cerebral, plano, corte, ángulo y posición del corte.</span><div class="sp-row"><input type="text" readonly aria-label="Enlace a esta vista"><button type="button" class="btn primary">Copiar</button></div><i class="sp-ok" hidden>Copiado</i>`;
  $('#stage').appendChild(pop);
  const inp = pop.querySelector('input'), ok = pop.querySelector('.sp-ok');
  b.addEventListener('click', e=>{
    e.stopPropagation();
    if (!pop.hidden){ pop.hidden = true; return; }
    const url = shareLink(viewEncode()); inp.value = url; pop.hidden = false; ok.hidden = true; inp.focus(); inp.select();
    try { history.replaceState(null, '', '#' + viewEncode()); skipHash = null; curToken = viewEncode(); } catch(err){}
  });
  pop.querySelector('button').addEventListener('click', ()=>{
    const done = () => { ok.hidden = false; };
    inp.select();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(inp.value).then(done, ()=>{ try { document.execCommand('copy'); done(); } catch(e){} });
    else { try { document.execCommand('copy'); done(); } catch(e){} }
  });
  document.addEventListener('pointerdown', e=>{ if (!pop.hidden && !pop.contains(e.target) && e.target !== b && !b.contains(e.target)) pop.hidden = true; });
})();

/* ---------------- practice index page ---------------- */

})();
