/* PNG readback, RGB extraction and gzip run outside the UI thread. */
'use strict';
importScripts('data-codec.js');
self.onmessage = async({data:{id, blob}})=>{
  try {
    if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined'){
      throw Object.assign(new Error('Procesamiento de imágenes en Worker no disponible.'), {unsupported:true});
    }
    const bytes = await self.NLBCodec.decode(blob, {canvas:(w,h)=>new OffscreenCanvas(w,h)});
    self.postMessage({id, buffer:bytes.buffer}, [bytes.buffer]);
  } catch (error){
    self.postMessage({id, error:error.message, unsupported:!!error.unsupported});
  }
};
