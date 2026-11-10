// SPEC-001 — Precarga inicial (pack bdc6b995)
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const site = path.join(__dirname, '../site');
function fixture(){
  const frames = [], elements = new Map(), classes = new Set(['booting']);
  const element = id => {
    if (!elements.has(id)) elements.set(id, {hidden:id === 'loadRetry', textContent:'', style:{}, attrs:{},
      setAttribute(k,v){this.attrs[k]=String(v);}, focus(){this.focused=true;}});
    return elements.get(id);
  };
  let reloads = 0;
  const context = {window:{}, document:{getElementById:element, body:{classList:{remove:c=>classes.delete(c)}}, querySelectorAll:()=>[element('home'),element('viewer')]},
    requestAnimationFrame:fn=>frames.push(fn), location:{reload:()=>reloads++}, console:{error(){}},
    fetch:async()=>({ok:true,json:async()=>({bytes:{vol:6,mesh:3,jue:1}})})};
  const file = path.join(site,'js/boot-loading.js');
  vm.runInNewContext(fs.existsSync(file) ? fs.readFileSync(file,'utf8') : '',context);
  return {boot:context.window.NeuroBoot,frames,element,classes,reloads:()=>reloads};
}
const flush = async()=>{for(let i=0;i<12;i++) await Promise.resolve();};
test('SPEC-001 Visita sin caché: pinta antes de descargar todo y espera la preparación', async()=>{
  const html = fs.readFileSync(path.join(site,'index.html'),'utf8');
  assert.ok(html.indexOf('id="loading"') < html.indexOf('id="home"'), 'El loader inicial debe existir antes de las vistas ocultables');
  const app = fs.readFileSync(path.join(site,'js/app.js'),'utf8');
  assert.match(html, /src="js\/boot-loading.js"/, 'El controlador debe estar integrado en el HTML');
  assert.ok(html.indexOf('src="js/boot-loading.js"') < html.indexOf('src="js/app.js"'), 'El controlador debe cargarse antes del motor');
  assert.match(app, /NeuroBoot\.run\(load\)/, 'El arranque real debe usar la pantalla inicial');
  assert.equal(app.includes('triggerLoad'), false, 'No debe quedar un disparador diferido por interacción');
  assert.match(app, /bins:\[packed\]/, 'La compatibilidad debe compartir la descarga completa');
  const f = fixture();
  assert.ok(f.boot, 'Debe existir controlador de precarga inicial');
  const requested = [], pending = [];
  let finish;
  const prepared = new Promise(resolve=>finish=resolve);
  const running = f.boot.run(async()=>{
    const download = f.boot.download((url,progress)=>{
      requested.push(url);
      return new Promise(resolve=>pending.push(()=>{progress(url.includes('vol')?6:url.includes('mesh')?3:1);resolve(new Uint8Array(1));}));
    });
    assert.equal(f.boot.download(()=>assert.fail('El fallback no debe volver a descargar')), download);
    await download;
    f.boot.preparing();
    await prepared;
  });
  assert.deepEqual(requested,[]);
  f.frames.shift()(); await flush();
  assert.deepEqual(requested,[], 'El primer frame debe permitir pintar sin iniciar la red');
  f.frames.shift()(); await flush();
  assert.deepEqual(requested,['data/vol.png','data/mesh.png','data/jue.png']);
  pending[0](); await flush();
  assert.equal(f.element('loadPct').textContent,'60%');
  assert.ok(f.classes.has('booting'));
  pending[1]();pending[2]();await flush();
  assert.equal(f.element('loadMsg').textContent,'Preparando el encéfalo');
  assert.ok(f.classes.has('booting'), 'Descargar no equivale a terminar la preparación');
  finish();await running;
  assert.equal(f.element('loading').hidden,true);
  assert.equal(f.classes.has('booting'),false);
});
test('SPEC-001 Error: recurso requerido falla y permite reintento sin anunciar listo', async()=>{
  const f = fixture();
  assert.ok(f.boot, 'Debe existir controlador de precarga inicial');
  const running = f.boot.run(()=>f.boot.download(async()=>{throw Error('sin conexión');}));
  f.frames.shift()();f.frames.shift()();await running;
  assert.equal(f.element('loading').hidden,false);
  assert.equal(f.element('loadRetry').hidden,false);
  assert.match(f.element('loadMsg').textContent,/No se pudieron cargar/);
  assert.equal(f.element('loadPct').textContent,'');
  assert.ok(f.classes.has('booting'));
  f.element('loadRetry').onclick();
  assert.equal(f.reloads(),1);
});
