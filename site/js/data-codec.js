/* Shared by the data Worker and the cooperative compatibility path. */
(() => {
  'use strict';
  self.NLBCodec = {
    async decode(blob, {bitmap = createImageBitmap, canvas, yieldTask = async()=>{}} = {}){
      if (!(blob instanceof Blob)) throw new Error('No se recibió una imagen de datos válida.');
      const image = await bitmap(blob, {colorSpaceConversion:'none', premultiplyAlpha:'none'});
      let surface;
      try {
        surface = canvas(image.width, image.height);
        surface.width = image.width; surface.height = image.height;
        const ctx = surface.getContext('2d', {willReadFrequently:true});
        if (!ctx) throw Object.assign(new Error('Canvas 2D no disponible.'), {unsupported:true});
        const bytes = new Uint8Array(image.width * image.height * 3);
        // Small readbacks also keep the main-thread fallback responsive.
        for (let y = 0; y < image.height; y += 32){
          const height = Math.min(32, image.height - y);
          ctx.drawImage(image, 0, y, image.width, height, 0, y, image.width, height);
          const pixels = ctx.getImageData(0, y, image.width, height).data;
          for (let i = 0, dst = y * image.width * 3; i < pixels.length; i += 4){
            bytes[dst++] = pixels[i]; bytes[dst++] = pixels[i+1]; bytes[dst++] = pixels[i+2];
          }
          await yieldTask();
        }
        const length = (bytes[0] | bytes[1]<<8 | bytes[2]<<16 | bytes[3]<<24) >>> 0;
        if (String.fromCharCode(...bytes.subarray(4,8)) !== 'NLB1' || length > bytes.length - 8){
          throw new Error('La cabecera o longitud de la imagen de datos no es válida.');
        }
        const packed = new Blob([bytes.subarray(8,8 + length)]);
        if (bytes[8] === 0x1f && bytes[9] === 0x8b){
          if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador no permite descomprimir los datos.');
          return new Uint8Array(await new Response(packed.stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
        }
        return new Uint8Array(await packed.arrayBuffer());
      } finally {
        image.close?.();
        if (surface){ surface.width = 0; surface.height = 0; }
      }
    }
  };
})();
