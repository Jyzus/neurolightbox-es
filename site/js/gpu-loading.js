/* Yield between bounded GPU submissions; driver-internal stalls are unavoidable. */
(() => {
  'use strict';
  self.NeuroGPU = {
    async texture3D(gl, data, [w,h,d], unit, linear, yieldTask){
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_3D,texture);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
      const levels = linear ? Math.floor(Math.log2(Math.max(w,h,d))) + 1 : 1;
      gl.texStorage3D(gl.TEXTURE_3D,levels,gl.RGBA8,w,h,d);
      await yieldTask();
      for (let z = 0; z < d; z += 8){
        const depth = Math.min(8,d-z);
        gl.texSubImage3D(gl.TEXTURE_3D,0,0,0,z,w,h,depth,gl.RGBA,gl.UNSIGNED_BYTE,data.subarray(z*w*h*4,(z+depth)*w*h*4));
        await yieldTask();
      }
      if (linear){ gl.generateMipmap(gl.TEXTURE_3D); await yieldTask(); }
      gl.texParameteri(gl.TEXTURE_3D,gl.TEXTURE_MIN_FILTER,linear ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_3D,gl.TEXTURE_MAG_FILTER,linear ? gl.LINEAR : gl.NEAREST);
      for (const p of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T,gl.TEXTURE_WRAP_R]) gl.texParameteri(gl.TEXTURE_3D,p,gl.CLAMP_TO_EDGE);
      return texture;
    },
    async buffer(gl, target, data, yieldTask){
      const buffer = gl.createBuffer(); gl.bindBuffer(target,buffer);
      gl.bufferData(target,data.byteLength,gl.STATIC_DRAW);
      await yieldTask();
      const bytes = new Uint8Array(data.buffer,data.byteOffset,data.byteLength);
      for (let offset = 0; offset < bytes.length; offset += 1048576){
        gl.bufferSubData(target,offset,bytes.subarray(offset,offset+1048576));
        await yieldTask();
      }
      return buffer;
    }
  };
})();
