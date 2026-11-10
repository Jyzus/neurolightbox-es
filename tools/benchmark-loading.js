// SPEC-002: real-asset CPU verification. Requires the already available Python/Pillow.
// Canvas/PNG readback is supplied by Pillow; this is NOT a browser/GPU benchmark.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const {gunzipSync} = require('node:zlib');
const {createHash} = require('node:crypto');
const {performance} = require('node:perf_hooks');
const {Worker} = require('node:worker_threads');
const assert = require('node:assert/strict');
const site = path.join(__dirname,'../site');
const hash = bytes=>createHash('sha256').update(bytes).digest('hex');
const source = file=>fs.readFileSync(path.join(site,'js',file),'utf8');
const codec = vm.createContext({self:{},Blob,Response,DecompressionStream,Uint8Array});
vm.runInContext(source('data-codec.js'),codec);
vm.runInContext(source('mesh-data.js'),codec);
function checkpoint(){
  let last=performance.now();
  const stats={yields:0,maxSliceMs:0};
  return {stats,async yieldTask(){
    const slice=performance.now()-last;
    if(slice>=8){
      stats.maxSliceMs=Math.max(stats.maxSliceMs,slice);stats.yields++;
      await new Promise(resolve=>setImmediate(resolve));last=performance.now();
    }
  }};
}
function workerDecode(image,width,height){
  const workerSource = `
    const {parentPort} = require('node:worker_threads');
    global.self=global;
    ${source('data-codec.js')}
    parentPort.on('message',async({buffer,width,height})=>{
      const image = new Uint8Array(buffer);
      const bytes=await NLBCodec.decode(new Blob(['PNG']),{
        bitmap:async()=>({width,height,close(){}}),
        canvas:()=>({getContext:()=>({drawImage(){},getImageData(x,y,w,h){return {data:image.subarray(y*w*4,(y+h)*w*4)};}})})
      });
      parentPort.postMessage(bytes,[bytes.buffer]);
    });`;
  return new Promise((resolve,reject)=>{
    const worker=new Worker(workerSource,{eval:true});
    worker.once('error',reject);
    worker.once('message',bytes=>{worker.terminate();resolve(bytes);});
    const buffer=image.buffer.slice(image.byteOffset,image.byteOffset+image.byteLength);
    worker.postMessage({buffer,width,height},[buffer]);
  });
}
function referenceMesh(buf,pieces){
  let nv=0,nf=0;for(const p of pieces){nv+=p.nv;nf+=p.nf;}
  const pos=new Int16Array(nv*3),nrm=new Int8Array(nv*4),reg=new Uint8Array(nv),idx=new Uint32Array(nf*3);
  let vo=0,fo=0;
  for(const p of pieces){
    pos.set(new Int16Array(buf.buffer,buf.byteOffset+p.pos,p.nv*3),vo*3);
    nrm.set(new Int8Array(buf.buffer,buf.byteOffset+p.nrm,p.nv*4),vo*4);reg.fill(p.id,vo,vo+p.nv);
    const src=new Uint32Array(buf.buffer.slice(buf.byteOffset+p.idx,buf.byteOffset+p.idx+p.nf*12));
    for(let i=0;i<src.length;i++)idx[fo*3+i]=src[i]+vo;
    vo+=p.nv;fo+=p.nf;
  }
  return {pos,nrm,reg,idx};
}
(async()=>{
  console.log('Real assets; CPU only, excluding browser image decode/readback and GPU.');
  let mesh;
  for(const name of ['vol','mesh','jue']){
    const raw=execFileSync('python3',['-c',
      'from PIL import Image; import sys,struct; i=Image.open(sys.argv[1]).convert("RGBA");sys.stdout.buffer.write(struct.pack("<II",*i.size)+i.tobytes())',
      path.join(site,'data',name+'.png')],{maxBuffer:128*1024*1024});
    const width=raw.readUInt32LE(0),height=raw.readUInt32LE(4),rgba=raw.subarray(8);
    const packed=new Uint8Array(width*height*3);
    for(let i=0,j=0;i<rgba.length;i+=4){packed[j++]=rgba[i];packed[j++]=rgba[i+1];packed[j++]=rgba[i+2];}
    const length=new DataView(packed.buffer).getUint32(0,true),payload=packed.subarray(8,8+length);
    const reference=payload[0]===31&&payload[1]===139?gunzipSync(payload):payload;
    const budget=checkpoint(),start=performance.now();
    const decoded=await codec.self.NLBCodec.decode(new Blob(['PNG']),{
      bitmap:async()=>({width,height,close(){}}),yieldTask:budget.yieldTask,
      canvas:()=>({getContext:()=>({drawImage(){},getImageData(x,y,w,h){return {data:rgba.subarray(y*w*4,(y+h)*w*4)};}})})
    });
    const cooperativeMs=performance.now()-start;
    assert.equal(hash(decoded),hash(reference));
    let heartbeats=0;const timer=setInterval(()=>heartbeats++,5),workerStart=performance.now();
    const background=await workerDecode(rgba,width,height);
    const workerMs=performance.now()-workerStart;
    clearInterval(timer);assert.equal(hash(background),hash(reference));
    console.log(JSON.stringify({asset:name,bytes:decoded.length,sha256:hash(decoded),cooperativeMs:+cooperativeMs.toFixed(1),
      yields:budget.stats.yields,maxExtractionSliceMs:+budget.stats.maxSliceMs.toFixed(1),workerMs:+workerMs.toFixed(1),mainThreadHeartbeats:heartbeats}));
    if(name==='mesh')mesh=decoded;
  }
  const meta=JSON.parse(fs.readFileSync(path.join(site,'data/meta.json')));
  const original=referenceMesh(mesh,meta.pieces),budget=checkpoint(),start=performance.now();
  const assembled=await codec.self.NeuroMesh.assemble(mesh,meta.pieces,budget.yieldTask);
  const assembledMs=performance.now()-start;
  for(const key of ['pos','nrm','reg','idx']){
    const bytes=value=>new Uint8Array(value.buffer,value.byteOffset,value.byteLength);
    assert.equal(hash(bytes(assembled[key])),hash(bytes(original[key])));
  }
  console.log(JSON.stringify({mesh:'identical positions/normals/regions/indices',vertices:assembled.nv,indices:assembled.idx.length,
    cooperativeMs:+assembledMs.toFixed(1),yields:budget.stats.yields,maxSliceMs:+budget.stats.maxSliceMs.toFixed(1)}));
})().catch(error=>{console.error(error);process.exitCode=1;});
