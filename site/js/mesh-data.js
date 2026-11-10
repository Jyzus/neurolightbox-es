/* Assemble the original mesh without one long main-thread loop. */
(() => {
  'use strict';
  self.NeuroMesh = {
    async assemble(buf, pieces, yieldTask){
      let nv = 0, nf = 0;
      for (const p of pieces){ nv += p.nv; nf += p.nf; }
      const pos = new Int16Array(nv*3), nrm = new Int8Array(nv*4);
      const reg = new Uint8Array(nv), idx = new Uint32Array(nf*3);
      let vo = 0, fo = 0, scalpStart = 0, scalpCount = 0, brainCount = 0;
      for (const p of pieces){
        const pp = new Int16Array(buf.buffer, buf.byteOffset + p.pos, p.nv*3);
        const nn = new Int8Array(buf.buffer, buf.byteOffset + p.nrm, p.nv*4);
        for (let start = 0; start < p.nv; start += 8192){
          const end = Math.min(p.nv, start + 8192);
          pos.set(pp.subarray(start*3,end*3),(vo + start)*3);
          nrm.set(nn.subarray(start*4,end*4),(vo + start)*4);
          reg.fill(p.id, vo + start, vo + end);
          await yieldTask();
        }
        // DataView supports the unaligned index offsets in the packed format.
        const source = new DataView(buf.buffer, buf.byteOffset + p.idx, p.nf*12);
        for (let start = 0; start < p.nf*3; start += 32768){
          const end = Math.min(p.nf*3,start + 32768);
          for (let i = start; i < end; i++) idx[fo*3 + i] = source.getUint32(i*4,true) + vo;
          await yieldTask();
        }
        if (p.id === 0){ scalpStart = fo*3; scalpCount = p.nf*3; }
        else brainCount = (fo + p.nf)*3;
        vo += p.nv; fo += p.nf;
      }
      return {pos,nrm,reg,idx,nv,brainCount,scalpStart,scalpCount};
    }
  };
})();
