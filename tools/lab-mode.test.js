// SPEC-004: modo ligero del Laboratorio cerebral (pack 94a7d282).
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const js = path.join(__dirname, '../site/js');
const app = fs.readFileSync(path.join(js, 'app.js'), 'utf8');
const preferences = path.join(js, 'lab-mode.js');

function mode(window = {}){
  if (fs.existsSync(preferences)) vm.runInNewContext(fs.readFileSync(preferences, 'utf8'), {window});
  return window.NeuroLabMode;
}

test('SPEC-004 conserva elección y limita solo la resolución del Laboratorio ligero', () => {
  const values = new Map();
  const window = {localStorage:{getItem:key=>values.get(key), setItem:(key,value)=>values.set(key,value)}};
  const labMode = mode(window);
  assert.ok(labMode, 'El Laboratorio debe tener preferencia de modo persistente');
  assert.equal(labMode.light, true);
  assert.ok(labMode.scale(1, true) < 1, 'También debe limitar el reposo sin pantalla Retina');
  assert.equal(labMode.scale(2, false), 2);
  labMode.set('full');
  assert.equal(mode(window).light, false);
  assert.equal(mode(window).scale(2, true), 2);
  labMode.set('light');
  assert.equal(mode(window).light, true);
  assert.equal(mode({get localStorage(){throw Error('bloqueado');}}).light, true);
});

test('SPEC-004 en ligero omite el pick al pasar y mantiene el pick al activar', () => {
  const LAB = {hoverR:3, tool:'dissect'};
  const labMode = {light:true};
  const tip = {hidden:false, style:{}};
  let picks = 0, renders = 0;
  const start = app.indexOf('LAB.hover = function');
  const end = app.indexOf('LAB.scanSub = function', start);
  vm.runInNewContext(app.slice(start, end), {
    LAB, labMode, tip, dirty:false, labHoverT:0, performance:{now:()=>100},
    pickAt(){picks++;return {id:3,p:[0,0,0]};}, REG:{3:{name:'Corteza',hemi:'M',group:'Frontal'}},
    renderLabPanel(){renders++;}, regionNameEs:name=>name, groupEs:name=>name, stageW:800, stageH:600
  });
  LAB.hover(120, 100);
  assert.equal(picks, 0, 'Hover ligero no debe consultar la GPU');
  assert.equal(tip.hidden, true);
  LAB.click(120, 100);
  assert.equal(picks, 1);
  assert.equal(LAB.selR, 3);
  assert.equal(renders, 1);
  labMode.light = false;
  LAB.hover(120, 100);
  assert.equal(picks, 2, 'Completo restaura el hover');
  assert.equal(tip.hidden, false);
});

test('SPEC-004 el panel ligero anima el SVG sin inicializar la escena corporal 3D', () => {
  const LAB = {tool:'stim',stim:{p:[1,2,3],region:{name:'Corteza',hemi:'M'},effect:{title:'Respuesta',text:'',kind:'move'}},scan:'none',log:[]};
  const labMode = {light:true};
  const panel = {innerHTML:'',hidden:false};
  const frames = [];
  let builds = 0, mounted = 0, animated = 0, pauses = 0;
  const svg = {};
  const start = app.indexOf('function renderLabPanel()');
  const end = app.indexOf("$('#labRail').addEventListener", start);
  const context = vm.createContext({});
  // Invoke the actual UI renderer in its fixture realm.
  const fixture = {LAB, LB:{r:null}, labMode, VIEW:'lab', labBodyAnimation:0,
    $:selector=>selector === '#labPanel' ? panel : selector === '#bodySvg' ? svg : {},
    lbBuild(){builds++;return true;}, lbMount(){mounted++;}, pauseLabBody(){pauses++;},
    bodySVG:()=>'<svg id="bodySvg"></svg>', animateBody(){animated++;},
    requestAnimationFrame:fn=>frames.push(fn), regionNameEs:name=>name};
  Object.assign(context,fixture);
  vm.runInContext(app.slice(start,end) + '\nrenderLabPanel()', context);
  assert.match(panel.innerHTML, /id="bodySvg"/);
  assert.equal(builds, 0);
  frames.shift()();
  assert.equal(animated, 1);
  labMode.light = false;
  vm.runInContext('renderLabPanel()',context);
  assert.match(panel.innerHTML, /id="labBody"/);
  assert.equal(builds, 1);
  assert.equal(mounted, 1);
  assert.equal(pauses, 2, 'Debe detener la animación previa antes de reemplazar el panel');
});
