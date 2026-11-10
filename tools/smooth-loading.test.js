// SPEC-002 — Preparación fluida (pack 4774f0c4)
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {gzipSync} = require('node:zlib');
const site = path.join(__dirname, '../site/js');
function execute(file, extra = {}){
  const root = {Blob, Response, DecompressionStream, Uint8Array, Int16Array, Int8Array, Uint32Array, ArrayBuffer, Error, ...extra};
  root.self = root; root.window = root;
  const context = vm.createContext(root);
  const filename = path.join(site,file);
  vm.runInContext(fs.existsSync(filename) ? fs.readFileSync(filename,'utf8') : '', context);
  return context;
}
function imageFixture(payload){
  const w = 32, h = Math.ceil((payload.length + 8) / (w * 3)) + 80;
  const rgb = new Uint8Array(w*h*3);
  new DataView(rgb.buffer).setUint32(0,payload.length,true);
  rgb.set([78,76,66,49],4); rgb.set(payload,8);
  const rgba = new Uint8ClampedArray(w*h*4);
  for(let i=0;i<w*h;i++) rgba.set([...rgb.subarray(i*3,i*3+3),255],i*4);
  let closed = false;
  const reads = [];
  return {w,h,reads,closed:()=>closed, bitmap:async()=>({width:w,height:h,close(){closed=true;}}),
    canvas:()=>({getContext:()=>({drawImage(){},getImageData(x,y,width,height){reads.push(height);return {data:rgba.subarray(y*w*4,(y+height)*w*4)};}})})};
}
test('SPEC-002 PNG/gzip: extrae bytes idénticos por bloques y libera el bitmap',async()=>{
  const source = Uint8Array.from({length:2000},(_,i)=>i%251);
  const image = imageFixture(gzipSync(source));
  let yields = 0;
  const c = execute('data-codec.js');
  assert.ok(c.NLBCodec, 'Debe existir decodificador compartido cooperativo');
  const result = await c.NLBCodec.decode(new Blob(['png fixture']), {bitmap:image.bitmap,canvas:image.canvas,yieldTask:async()=>{yields++;}});
  assert.deepEqual(result,source);
  assert.ok(yields > 1,'Debe ceder entre lecturas de imagen');
  assert.ok(image.reads.every(height=>height<=32),'No leer la imagen completa de forma síncrona');
  assert.equal(image.closed(),true);
  await assert.rejects(c.NLBCodec.decode(new Blob(['bad']),{bitmap:async()=>{throw Error('PNG corrupto');},canvas:image.canvas,yieldTask:async()=>{}}),/PNG corrupto/);
});
test('SPEC-002 Worker: decodifica fuera del hilo principal y transfiere el resultado',async()=>{
  const source = Uint8Array.from([11,22,33,44]);
  const image = imageFixture(source);
  const messages=[];
  const c=execute('data-worker.js',{OffscreenCanvas:class {constructor(){return image.canvas();}},createImageBitmap:image.bitmap,
    importScripts(){},postMessage(message,transfer){messages.push({message,transfer});}});
  const codec=execute('data-codec.js',{createImageBitmap:image.bitmap});c.NLBCodec=codec.NLBCodec;
  assert.equal(typeof c.onmessage,'function','Debe existir Worker de procesamiento');
  await c.onmessage({data:{id:7,blob:new Blob(['image'])}});
  assert.deepEqual(new Uint8Array(messages[0].message.buffer),source);
  assert.equal(messages[0].transfer[0],messages[0].message.buffer,'El buffer debe transferirse, sin duplicación');
  await c.onmessage({data:{id:8,blob:null}});
  assert.equal(messages[1].message.id,8);
  assert.ok(messages[1].message.error,'Los fallos de datos se comunican al cargador');
});
test('SPEC-002 Procesamiento: usa Worker y fallback cooperativo si no está disponible',async()=>{
  let terminated=0, fallback=0;
  class Worker {
    postMessage({id}){queueMicrotask(()=>this.onmessage({data:{id,buffer:Uint8Array.from([9,8]).buffer}}));}
    terminate(){terminated++;}
  }
  const c=execute('data-loader.js',{Worker,OffscreenCanvas:function(){},NLBCodec:{decode:async()=>{fallback++;return Uint8Array.from([9,8]);}},
    NeuroBoot:{measure:async(label,fn)=>fn(),yieldFrame:async()=>{},checkpoint:async()=>{},processing(){}},fetch:async()=>new Response('packed')});
  assert.ok(c.NeuroData,'Debe existir el cargador Worker con fallback');
  assert.deepEqual(await c.NeuroData.fetchBin('data/vol.png',()=>{}),Uint8Array.from([9,8]));
  assert.equal(fallback,0);
  c.NeuroData.close(); assert.equal(terminated,1);
  const f=execute('data-loader.js',{NLBCodec:{decode:async(blob,options)=>{fallback++;assert.equal(typeof options.yieldTask,'function');await options.yieldTask();return Uint8Array.from([9,8]);}},
    NeuroBoot:{measure:async(label,fn)=>fn(),yieldFrame:async()=>{},checkpoint:async()=>{},processing(){}},fetch:async()=>new Response('packed')});
  assert.deepEqual(await f.NeuroData.fetchBin('data/vol.png',()=>{}),Uint8Array.from([9,8]));
  assert.equal(fallback,1);
  const bad=execute('data-loader.js',{NLBCodec:{decode:async()=>{throw Error('datos inválidos');}},NeuroBoot:{measure:async(label,fn)=>fn(),yieldFrame:async()=>{},checkpoint:async()=>{},processing(){}},fetch:async()=>new Response('packed')});
  await assert.rejects(bad.NeuroData.fetchBin('data/vol.png',()=>{}),/datos inválidos/);
});
test('SPEC-002 Geometría: reconstruye índices y atributos cediendo entre bloques',async()=>{
  const c=execute('mesh-data.js');
  assert.ok(c.NeuroMesh,'Debe existir ensamblador cooperativo');
  const nv=40000, bytes=nv*6+nv*4+24, buffer=new ArrayBuffer(bytes);
  const positions=new Int16Array(buffer,0,nv*3);positions[0]=123;positions[positions.length-1]=-45;
  const indices=new Uint32Array(buffer,nv*10,6);indices.set([0,1,2,5,6,7]);
  let yields=0;
  const pieces=[{id:1,nv,nf:2,pos:0,nrm:nv*6,idx:nv*10}];
  const result=await c.NeuroMesh.assemble(new Uint8Array(buffer),pieces,async()=>{yields++;});
  assert.equal(result.pos[0],123);assert.equal(result.pos[result.pos.length-1],-45);
  assert.deepEqual([...result.idx],[0,1,2,5,6,7]);
  assert.equal(result.reg[nv-1],1);assert.equal(result.brainCount,6);
  assert.ok(yields>=4,'Debe ceder incluso con una pieza grande');
});
test('SPEC-002 GPU: sube texturas en bloques con frames intermedios',async()=>{
  const c=execute('gpu-loading.js');
  assert.ok(c.NeuroGPU,'Debe existir preparador GPU por etapas');
  const calls=[];let yields=0;
  const gl=new Proxy({createTexture:()=>({}),texSubImage3D(...args){calls.push(args);}}, {get(target,key){return key in target?target[key]:(()=>{});}});
  await c.NeuroGPU.texture3D(gl,new Uint8Array(2*3*25*4),[2,3,25],0,false,async()=>{yields++;});
  assert.ok(calls.length>=4);assert.ok(yields>=calls.length);
  assert.equal(calls.reduce((sum,args)=>sum+args[7],0),25,'Debe transferir toda la profundidad');
});
test('SPEC-002 Cierre: aborta recursos pendientes e impide recrear el Worker',async()=>{
  let response, workers=0, aborted=false;
  class Worker {constructor(){workers++;} terminate(){}}
  const c=execute('data-loader.js',{Worker,OffscreenCanvas:function(){},AbortController,
    NeuroBoot:{measure:async(label,fn)=>fn(),processing(){}},
    fetch:async(url,{signal})=>{signal.addEventListener('abort',()=>{aborted=true;});return new Promise(resolve=>response=resolve);}});
  const downloading=c.NeuroData.fetchBin('data/vol.png',()=>{});
  c.NeuroData.close();response(new Response('packed'));
  await assert.rejects(downloading,/Carga cancelada/);
  assert.equal(aborted,true);assert.equal(workers,0,'El cierre no debe permitir reiniciar procesamiento');
});
test('SPEC-002 Worker no disponible: recupera el blob sin repetir la descarga',async()=>{
  let requests=0, fallback=0, terminated=0;
  class Worker {
    postMessage({id}){queueMicrotask(()=>this.onmessage({data:{id,error:'Sin canvas',unsupported:true}}));}
    terminate(){terminated++;}
  }
  const c=execute('data-loader.js',{Worker,OffscreenCanvas:function(){},
    NLBCodec:{decode:async()=>{fallback++;return Uint8Array.from([1,2]);}},
    NeuroBoot:{measure:async(label,fn)=>fn(),checkpoint:async()=>{},processing(){}},fetch:async()=>{requests++;return new Response('packed');}});
  assert.deepEqual(await c.NeuroData.fetchBin('data/vol.png',()=>{}),Uint8Array.from([1,2]));
  assert.equal(requests,1);assert.equal(fallback,1);assert.equal(terminated,1);
});
