/* Initial loading screen: paint first, download once, unlock only after preparation. */
(() => {
  'use strict';
  const el = id => document.getElementById(id);
  let downloadPromise, networkFraction = 0, lastYield = 0;
  const clock = ()=>typeof performance === 'undefined' ? Date.now() : performance.now();
  const boot = window.NeuroBoot = {
    timings: [],
    async measure(stage, task){
      const start = clock();
      try { return await task(); }
      finally {
        const duration = clock() - start;
        boot.timings.push({stage, milliseconds:Math.round(duration * 10) / 10});
        if (typeof performance !== 'undefined' && performance.measure){
          try { performance.measure('neuro:' + stage, {start, duration}); } catch (error) { /* Diagnostics must not interrupt loading. */ }
        }
      }
    },
    yieldFrame(){
      return new Promise(resolve=>requestAnimationFrame(()=>{ lastYield = clock(); resolve(); }));
    },
    async checkpoint(){
      if (clock() - lastYield >= 8) await boot.yieldFrame();
    },
    processing(){
      if (networkFraction === 1){
        el('loadProgress').setAttribute('data-phase', 'processing');
        el('loadProgress').setAttribute('aria-valuetext', 'Descarga completa. Procesando los datos cerebrales.');
        el('loadProgress').removeAttribute?.('aria-valuenow');
      }
      el('loadMsg').textContent = networkFraction < 1 ? 'Descargando y procesando el encéfalo' : 'Procesando los datos cerebrales';
      el('loadSub').textContent = 'Extrayendo y descomprimiendo las imágenes del recorrido.';
    },
    async stage(label){
      boot.preparing(label);
      await boot.yieldFrame();
      await boot.yieldFrame();
    },
    download(fetchBin){
      if (downloadPromise) return downloadPromise;
      downloadPromise = (async()=>{
        const response = await fetch('data/meta.json');
        if (!response.ok) throw new Error('No se pudieron obtener los metadatos (' + response.status + ').');
        const meta = await response.json();
        const names = ['vol', 'mesh', 'jue'], received = {vol:0, mesh:0, jue:0};
        const total = names.reduce((sum, name)=>sum + meta.bytes[name], 0);
        const bins = await Promise.all(names.map(name=>fetchBin('data/' + name + '.png', bytes=>{
          received[name] = Math.min(meta.bytes[name], bytes);
          const fraction = Math.min(1, names.reduce((sum, key)=>sum + received[key], 0) / total);
          networkFraction = fraction;
          const percent = Math.round(fraction * 100);
          el('loadBar').style.width = (fraction * 100).toFixed(1) + '%';
          el('loadPct').textContent = percent + '%';
          el('loadProgress').setAttribute('aria-valuenow', percent);
          el('heroLoadBar').style.width = (fraction * 100).toFixed(1) + '%';
          el('loadProgress').setAttribute('data-phase', fraction === 1 ? 'processing' : 'download');
          if (fraction === 1) boot.processing();
        })));
        return {meta, bins};
      })();
      return downloadPromise;
    },
    preparing(label = 'Preparando el encéfalo'){
      el('loadMsg').textContent = label;
      el('loadProgress').setAttribute('data-phase', 'preparing');
      el('loadProgress').removeAttribute?.('aria-valuenow');
      el('loadSub').textContent = 'Preparando las imágenes y el recorrido interactivo.';
      el('loadProgress').setAttribute('aria-valuetext', label);
    },
    async run(prepare){
      // The first frame renders the HTML screen; the second begins the heavy work.
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      try {
        el('loadMsg').textContent = 'Descargando el encéfalo';
        await boot.measure('carga-total', prepare);
        el('loadMsg').textContent = 'Recorrido listo';
        el('loading').hidden = true;
        document.body.classList.remove('booting');
        document.querySelectorAll('.view, .nav').forEach(view=>{ view.inert = false; });
      } catch (error){
        console.error(error);
        el('loadMsg').textContent = 'No se pudieron cargar los datos cerebrales';
        el('loadSub').textContent = 'Compruebe su conexión e inténtelo de nuevo.';
        el('loadPct').textContent = '';
        el('loadProgress').hidden = true;
        el('loadRetry').hidden = false;
        el('loadRetry').onclick = ()=>location.reload();
        el('loadRetry').focus();
      } finally {
        window.NeuroData?.close();
      }
    }
  };
})();
