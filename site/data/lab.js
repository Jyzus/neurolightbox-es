const LAB = window.LAB = {
  tool:'stim', colorBy:'lobe', explode:0, cut:{on:false, axis:'axial', pos:20, flip:false},
  hoverR:-1, selR:-1, stim:null, scan:'none', log:[], hemi:{L:true, R:true}, groups:{},
  stateKey(){ return 'lab'; },
  state(){
    const s = this.stim; const base = {name:'Laboratorio Cerebral', tag:'estimulación', lesions:[], text:{_:''}};
    if (!s) return base;
    const p = s.p, sx = Math.sign(p[0]) || 1, act = [{c:p, s:7, a:1.25}];
    const k = s.effect.kind;
    if (k === 'move'){ act.push({c:[4*sx,-6,60], s:7, a:0.7}, {c:[-22*sx,-54,-24], s:7, a:0.75}); }
    if (k === 'feel'){ act.push({c:[50*sx,-25,18], s:7, a:0.6}, {c:[12*sx,-18,6], s:5, a:0.5}); }
    if (k === 'see'){ act.push({c:[22*sx,-26,-4], s:4, a:0.5}); }
    if (k === 'hear'){ act.push({c:[-p[0],p[1],p[2]], s:7, a:0.45}); }
    if (k === 'speech'){ act.push({c:[-48,22,12], s:8, a:0.6}, {c:[-55,-45,8], s:8, a:0.6}); }
    return {...base, name:'Región estimulada: ' + window.regionNameEs(s.region.name), act, met:{fdg:[{c:p, s:9, g:0.7}]}};
  },
  actOnSurface(){ return this.scan === 'fmri' && !!this.stim; },
  animating(){ return !!this.stim && performance.now() - this.stim.t0 < 6000 || this.selR > 0 || this.scan === 'fmri'; },
  stimUniform(){ if (!this.stim) return [0,0,0,0]; const age = (performance.now() - this.stim.t0)/1000; return [...this.stim.p, Math.max(0.25, 1 - age/6)]; },
  subtitle(){ return this.tool === 'stim' ? 'Estimular la corteza' : 'Diseccionar el encéfalo'; },
};

/* ---------- regions: visibility + explode ---------- */
