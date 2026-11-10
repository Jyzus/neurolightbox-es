/* Stream each asset once; process it in a Worker or a cooperative fallback. */
(() => {
  'use strict';
  let worker, disabled = false, sequence = 0, stopped = false;
  const pending = new Map();
  const controller = typeof AbortController === 'undefined' ? null : new AbortController();
  function close(unsupported = false){
    worker?.terminate(); worker = null;
    for (const {reject} of pending.values()) reject(Object.assign(new Error('Worker detenido.'),{unsupported}));
    pending.clear();
  }
  function getWorker(){
    if (disabled || typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return null;
    if (worker) return worker;
    try {
      worker = new Worker('js/data-worker.js');
      worker.onmessage = ({data})=>{
        const task = pending.get(data.id);
        if (!task) return;
        pending.delete(data.id);
        if (data.error) task.reject(Object.assign(new Error(data.error), {unsupported:data.unsupported}));
        else task.resolve(new Uint8Array(data.buffer));
      };
      worker.onerror = event=>{ event.preventDefault?.(); disabled = true; close(true); };
      return worker;
    } catch (error){ disabled = true; return null; }
  }
  async function decode(blob){
    const active = getWorker();
    if (active){
      try {
        return await new Promise((resolve,reject)=>{
          const id = ++sequence; pending.set(id,{resolve,reject});
          try { active.postMessage({id,blob}); }
          catch (error){ pending.delete(id); reject(Object.assign(error,{unsupported:true})); }
        });
      } catch (error){
        if (!error.unsupported) throw error;
        disabled = true; close(true);
      }
    }
    if (stopped) throw new Error('Carga cancelada.');
    return self.NLBCodec.decode(blob, {
      canvas:()=>document.createElement('canvas'),
      yieldTask:()=>{
        if (stopped) throw new Error('Carga cancelada.');
        return self.NeuroBoot.checkpoint();
      }
    });
  }
  self.NeuroData = {
    close(){ stopped = true; controller?.abort(); close(); },
    async fetchBin(url, onProgress){
      if (stopped) throw new Error('Carga cancelada.');
      const blob = await self.NeuroBoot.measure('descarga:' + url, async()=>{
        const response = await fetch(url, {signal:controller?.signal});
        if (!response.ok) throw new Error(url + ' ' + response.status);
        const reader = response.body.getReader(), chunks = [];
        let received = 0;
        try {
          for (;;){
            const {done,value} = await reader.read(); if (done) break;
            chunks.push(value); received += value.byteLength; onProgress(received);
          }
        } finally { reader.releaseLock(); }
        return new Blob(chunks);
      });
      if (stopped) throw new Error('Carga cancelada.');
      self.NeuroBoot.processing();
      return self.NeuroBoot.measure('procesamiento:' + url, ()=>decode(blob));
    }
  };
})();
