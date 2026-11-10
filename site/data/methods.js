const METHOD_CARD = window.METHOD_CARD = {
  mri:{ds:'Soft-tissue anatomy from the hydrogen in water and fat.', kind:'Structure', res:'≈1 mm', time:'minutes', thumb:['t1','normal']},
  ct:{ds:'X-ray slices. Bone and fresh blood show within seconds.', kind:'Structure', res:'0.5 mm', time:'seconds', thumb:['ctb','ich']},
  pet:{ds:'A radioactive tracer maps glucose use or amyloid.', kind:'Function', res:'4–5 mm', time:'30–60 min', thumb:['fdg','normal']},
  spect:{ds:'Gamma rays map blood flow or dopamine transporters.', kind:'Function', res:'8–10 mm', time:'minutes', thumb:['dat','normal']},
  fmri:{ds:'Oxygen-rich blood shows where the cortex is working.', kind:'Function', res:'2–3 mm', time:'1–2 s', thumb:['bold','motor']},
  eeg:{ds:'Scalp electrodes record the brain’s electrical rhythms.', kind:'Function', res:'cm', time:'1 ms', thumb:['eeg','eyes_closed']},
  meg:{ds:'Sensors in a helmet record the brain’s magnetic fields.', kind:'Function', res:'3–5 mm', time:'1 ms', thumb:['meg','sep']},
  us:{ds:'Echoes through a baby’s fontanelle; Doppler flow in adults.', kind:'Structure', res:'≈1 mm', time:'real time', thumb:['cus','normal']},
  dsa:{ds:'Contrast through a catheter shows every artery and vein.', kind:'Structure', res:'0.2 mm', time:'3 frames/s', thumb:['dsa','normal']},
};

const CHAPTERS = {
mri:{ full:'Magnetic resonance imaging', title:'MRI',
  lede:'An MRI scanner never uses X-rays. It uses a strong magnet and radio waves to make hydrogen nuclei give off a signal, then works out where each signal came from.',
  meta:[['Measures','Hydrogen in water and fat'],['Resolution','≈1 mm'],['Time','2–6 min per sequence'],['Radiation','None']],
  steps:[
    {tag:'Magnet', h:'A magnet stronger than a scrapyard crane', p:'Coils of niobium–titanium wire, cooled in liquid helium, carry current with no resistance. They make a steady field, B₀, along the bore. Clinical scanners run at 1.5 or 3 tesla.',
      facts:[['B₀','1.5 or 3 T'],['Earth’s field','≈ 50 µT, so 3 T is 60,000×'],['Coil temperature','4 K (−269 °C)'],['Bore','60–70 cm wide']]},
    {tag:'Protons', h:'Protons line up and wobble', p:'Each hydrogen nucleus is a tiny magnet. In B₀ a few more point with the field than against it, and each one precesses around the field like a tilted spinning top. Together they add up to a small net magnetisation, M.',
      facts:[['Larmor frequency','f = γB₀'],['γ for ¹H','42.58 MHz per tesla'],['At 3 T','≈ 128 MHz'],['Excess aligned','≈ 10 per million']]},
    {tag:'RF pulse', h:'A radio pulse tips them over', p:'The body coil sends a short radio pulse at exactly the Larmor frequency. It tips M away from B₀, here by 90°, so it spins in the flat transverse plane. A spinning magnet induces a current in the receiver coil. That current is the MR signal.',
      facts:[['Pulse length','≈ 1–3 ms'],['Flip angle','up to 90° (or 180° to refocus)'],['Signal','free induction decay']]},
    {tag:'Contrast', h:'Relaxation makes the contrast', p:'After the pulse, M grows back along B₀ with time constant T1 and loses its transverse signal with T2. Each tissue has its own T1 and T2. The operator picks the repetition time (TR) and echo time (TE). Short TR and TE give T1 weighting. Long TR and TE give T2 weighting.',
      facts:[['T1 at 3 T','WM 840 · GM 1350 · CSF 4200 ms'],['T2 at 3 T','WM 75 · GM 95 · CSF 2000 ms'],['T1-weighted','CSF dark, white matter bright'],['T2-weighted','CSF bright, white matter dark']]},
    {tag:'k-space', h:'Gradients encode position', p:'Three gradient coils add a small sloping field, so the frequency and phase of the signal depend on position. Each echo fills one line of k-space. An inverse Fourier transform turns k-space into the image. The centre of k-space holds the contrast and the edges hold the fine detail. The loud knocking is the gradients switching.',
      facts:[['Gradients','x, y and z coils'],['Lines per image','typically 256'],['Noise','up to ≈ 110 dB'],['Reconstruction','inverse 2D FFT']]},
  ],
  ctaTitle:'Read MRI scans', ctaText:'Ten sequences on the same brain: T1, T1 with gadolinium, T2, FLAIR, diffusion, SWI, DTI, angiography, perfusion and spectroscopy. Each one has disease and physiological states to compare.'},

ct:{ full:'Computed tomography', title:'CT',
  lede:'CT measures how strongly each small block of tissue absorbs X-rays. It takes projections from every angle around the head and computes a cross-section from them.',
  meta:[['Measures','X-ray attenuation'],['Resolution','0.5 mm'],['Time','< 10 s for a head'],['Dose','≈ 2 mSv, about 8 months of background']],
  steps:[
    {tag:'Gantry', h:'A tube and detectors spin around you', p:'An X-ray tube and a curved detector array face each other across the gantry. They spin together several times a second as the table moves through.',
      facts:[['Tube voltage','100–140 kV'],['One rotation','≈ 0.3 s'],['Detector rows','64–320']]},
    {tag:'Attenuation', h:'Tissue blocks part of the beam', p:'Dense tissue absorbs more X-rays, following I = I₀·e^(−μx). CT reports attenuation in Hounsfield units, where water is 0 and air is −1000. Clotted blood is denser than brain, so it shows as bright on the scan.',
      facts:[['Air','−1000 HU'],['Water','0 HU'],['Grey matter','≈ +35 HU'],['Fresh blood','+60 to +80 HU'],['Bone','+700 to +2000 HU']]},
    {tag:'Sinogram', h:'Every angle gives a projection', p:'At each angle the detectors record a profile of how much the beam was weakened. Stacking the profiles from 0° to 180° gives a sinogram. Each point in the head traces out a sine wave.',
      facts:[['Projections','≈ 1000 per rotation'],['Shown here','180 angles, 1° apart']]},
    {tag:'Back-projection', h:'Filtered back-projection rebuilds the slice', p:'Each profile is smeared back across the image along the direction it was measured. On its own that gives a blur. A ramp filter applied first sharpens the edges so the true slice appears. Modern scanners refine this with iterative reconstruction.',
      facts:[['Without the filter','a 1/r blur'],['With the ramp filter','sharp edges'],['Modern','iterative reconstruction, lower dose']]},
    {tag:'Windows', h:'Windows choose what you see', p:'The eye can tell apart only a few dozen shades of grey. So the viewer maps a narrow band of HU onto the grey scale. A brain window shows grey and white matter and fresh blood. A bone window shows fractures.',
      facts:[['Brain window','W 80, L 40'],['Bone window','W 2000, L 500'],['First scan for','stroke, trauma, haemorrhage']]},
  ],
  ctaTitle:'Read CT scans', ctaText:'Brain and bone windows and CT angiography: haemorrhage, stroke, fracture, hydrocephalus and more.'},

pet:{ full:'Positron emission tomography', title:'PET',
  lede:'PET maps where a radioactive tracer collects. With FDG, a glucose look-alike, it shows which parts of the brain use the most energy.',
  meta:[['Measures','Tracer concentration'],['Resolution','4–5 mm'],['Time','30–60 min uptake, 10–20 min scan'],['Dose','≈ 5 mSv (FDG)']],
  steps:[
    {tag:'Tracer', h:'A sugar with a radioactive tag', p:'FDG is glucose with one –OH group swapped for fluorine-18. Cells take it up like glucose and phosphorylate it, but cannot break it down further, so it stays trapped. The brain uses about a fifth of the body’s glucose.',
      facts:[['¹⁸F half-life','110 minutes'],['Made in','a cyclotron'],['Other tracers','amyloid, tau, dopamine']]},
    {tag:'Annihilation', h:'Positron meets electron', p:'Fluorine-18 decays by emitting a positron. Within about half a millimetre it meets an electron and both are annihilated. Their mass becomes two gamma photons, each 511 keV, flying apart in opposite directions.',
      facts:[['Photon energy','511 keV each'],['Angle','≈ 180°'],['Positron range','≈ 0.6 mm (¹⁸F)']]},
    {tag:'Coincidence', h:'A ring catches both photons', p:'A ring of scintillator crystals surrounds the head. When two crystals flash within a few nanoseconds of each other, the decay happened somewhere on the line between them. This is called a line of response.',
      facts:[['Crystals','LSO or LYSO'],['Coincidence window','≈ 4–6 ns'],['Time of flight','narrows the event to a few cm along the line']]},
    {tag:'Image', h:'Millions of lines become an image', p:'Back-projecting every line of response gives a blurred picture of the tracer. Iterative reconstruction (OSEM) with attenuation correction gives the final image. Uptake is often scaled to the injected dose and body weight as a standardised uptake value (SUV).',
      facts:[['Counts per scan','tens of millions'],['Reconstruction','OSEM'],['Units','SUV or ratio to a reference region']]},
  ],
  ctaTitle:'Read PET scans', ctaText:'FDG metabolism and amyloid imaging: Alzheimer’s disease, epilepsy, tumours, sleep, anaesthesia and disorders of consciousness.'},

spect:{ full:'Single-photon emission computed tomography', title:'SPECT',
  lede:'SPECT is the cheaper, older relative of PET. Its tracers give off single gamma photons. A lead collimator tells the camera which direction each photon came from.',
  meta:[['Measures','Tracer concentration'],['Resolution','8–10 mm'],['Time','20–30 min'],['Dose','≈ 5–7 mSv']],
  steps:[
    {tag:'Tracer', h:'A snapshot of blood flow', p:'⁹⁹ᵐTc-HMPAO crosses into the brain and is trapped within a minute or two, in proportion to blood flow at that moment. It then stays put. So you can inject during a seizure and scan an hour later, and the image still shows the seizure.',
      facts:[['⁹⁹ᵐTc','140 keV gamma, half-life 6 h'],['HMPAO / ECD','cerebral perfusion'],['¹²³I-ioflupane','dopamine transporters (DaTscan)']]},
    {tag:'Collimator', h:'Lead decides the direction', p:'A gamma photon carries no partner, so its direction must be forced. A lead honeycomb in front of the crystal lets through only photons travelling straight in. Most photons are absorbed by the lead.',
      facts:[['Gets through','≈ 1 in 10,000'],['Crystal','sodium iodide (NaI)'],['Behind it','photomultiplier tubes']]},
    {tag:'Rotation', h:'The heads turn around the head', p:'Two or three camera heads rotate around the patient and take a projection every few degrees.',
      facts:[['Views','≈ 120, 3° apart'],['Heads','2–3'],['Scan time','20–30 min']]},
    {tag:'Image', h:'Reconstruct, then read the pattern', p:'The projections are reconstructed into slices in the same way as CT. Readers look for patterns rather than sharp edges. Examples are reduced flow in both parietal lobes in Alzheimer’s disease, and the loss of the comma-shaped striatum on DaTscan in Parkinson’s disease.',
      facts:[['Reconstruction','filtered back-projection or OSEM'],['Ictal SPECT','inject within seconds of seizure onset']]},
  ],
  ctaTitle:'Read SPECT scans', ctaText:'HMPAO perfusion and DaTscan: dementia, ictal epilepsy, brain death and Parkinson’s disease.'},

fmri:{ full:'Functional magnetic resonance imaging', title:'fMRI',
  lede:'fMRI does not record neurons directly. It uses the oxygen level in the blood that reaches active brain tissue a few seconds after the neurons fire.',
  meta:[['Measures','Blood oxygenation (BOLD)'],['Resolution','2–3 mm'],['Time','one volume every 0.7–2 s'],['Radiation','None']],
  steps:[
    {tag:'Coupling', h:'Firing neurons call for blood', p:'When a patch of cortex becomes active, local arterioles widen within a second or two. Blood flow rises far more than oxygen use, so the active region ends up with more oxygen-rich blood than it needs.',
      facts:[['Blood flow','+30–50 %'],['Oxygen use','+5–20 %'],['Result','less deoxyhaemoglobin']]},
    {tag:'BOLD', h:'Deoxyhaemoglobin spoils the signal', p:'Deoxyhaemoglobin is paramagnetic. It distorts the magnetic field around vessels, so the MR signal fades faster (shorter T2*). When fresh oxygenated blood washes it out, the signal rises a little. This is the blood-oxygen-level-dependent (BOLD) signal.',
      facts:[['Signal change','≈ 1–3 % at 3 T'],['Sequence','gradient-echo EPI'],['Echo time','≈ 30 ms at 3 T']]},
    {tag:'HRF', h:'The response is slow', p:'After a brief burst of activity the BOLD signal takes 5–6 seconds to peak. It then falls back with a dip below baseline. This haemodynamic response blurs fMRI timing to seconds, even though neurons work in milliseconds.',
      facts:[['Peak','5–6 s'],['Undershoot','≈ 10–20 s'],['Volume time (TR)','0.7–2 s']]},
    {tag:'Statistics', h:'Statistics draw the map', p:'The subject alternates task and rest. For every voxel, a general linear model tests how well its signal follows the expected response. Voxels above a threshold are coloured and laid over an anatomical scan.',
      facts:[['Design','blocks or single events'],['Output','t or z statistic per voxel'],['Threshold','corrected for multiple comparisons']]},
  ],
  ctaTitle:'Read fMRI maps', ctaText:'Task activation for movement, vision and language, plus seven resting-state networks. Watch the BOLD signal follow the task in real time.'},

eeg:{ full:'Electroencephalography', title:'EEG',
  lede:'EEG measures voltage on the scalp. The voltage comes from many thousands of cortical neurons firing in step. It has millisecond timing and needs no scanner, just electrodes and an amplifier.',
  meta:[['Measures','Scalp voltage'],['Resolution','centimetres'],['Time','≈ 1 ms'],['Radiation','None']],
  steps:[
    {tag:'Source', h:'Pyramidal cells in step', p:'Pyramidal neurons stand in parallel, with their apical dendrites pointing to the surface. When synaptic currents flow along thousands of them at once, their small fields add up to a dipole that reaches the scalp. Skull and scalp smear it on the way out.',
      facts:[['Source','postsynaptic currents, not spikes'],['Needed','≈ 6–10 cm² of cortex in sync'],['Blind to','deep and radial-cancelled sources']]},
    {tag:'10–20', h:'Electrodes by the 10–20 system', p:'Electrodes go at 10 % and 20 % steps of the distance from nasion to inion and from ear to ear. Each name gives the lobe and the side: odd numbers on the left, even on the right, z on the midline.',
      facts:[['Standard set','21 electrodes'],['High-density','64–256'],['Impedance','under 5–10 kΩ']]},
    {tag:'Amplifier', h:'Amplify the difference', p:'Each channel records the difference between two electrodes. Interference that reaches both equally, such as mains hum, cancels out. Brain signals are only tens of microvolts.',
      facts:[['Amplitude','10–100 µV'],['Filters','0.5–70 Hz, notch 50/60 Hz'],['Montage','bipolar or referential']]},
    {tag:'Rhythms', h:'The rhythm reveals the state', p:'The dominant frequency follows the level of arousal. Alpha dominates the back of the head when the eyes are closed. Delta waves dominate deep sleep. Spikes and rhythmic discharges mark epilepsy.',
      facts:[['Delta','< 4 Hz · deep sleep'],['Theta','4–8 Hz · drowsy'],['Alpha','8–13 Hz · relaxed'],['Beta','13–30 Hz · alert'],['Gamma','> 30 Hz']]},
  ],
  ctaTitle:'Read EEG', ctaText:'An 18-channel bipolar montage with a live scalp map: wakefulness, sleep stages, anaesthesia, seizures and brain death.'},

meg:{ full:'Magnetoencephalography', title:'MEG',
  lede:'MEG measures the magnetic fields made by the same currents that EEG records. Unlike electrical potentials, magnetic fields pass through the skull without being smeared.',
  meta:[['Measures','Magnetic field'],['Resolution','3–5 mm (cortex)'],['Time','≈ 1 ms'],['Radiation','None']],
  steps:[
    {tag:'Fields', h:'Currents make tiny magnetic fields', p:'Current flowing along dendrites makes a magnetic field that circles around it. At the scalp the field is about a billionth of the Earth’s field.',
      facts:[['Brain','10–1000 fT'],['Heart','≈ 50 pT'],['Earth','≈ 50 µT']]},
    {tag:'Helmet', h:'Superconducting sensors in a helmet', p:'SQUID sensors sit in a helmet-shaped tank of liquid helium. The whole system sits in a magnetically shielded room. Newer optically pumped magnetometers (OPMs) work at room temperature and can be worn on the head.',
      facts:[['Typical system','306 channels'],['Sensors','102 magnetometers, 204 gradiometers'],['Shielding','mu-metal and aluminium room']]},
    {tag:'Field map', h:'The field map points to the source', p:'A current along the cortex gives a field that leaves the head on one side and re-enters on the other. The source lies midway between the two poles, at right angles to the line joining them. MEG sees currents parallel to the scalp best, which means sources in the walls of sulci.',
      facts:[['Pattern','dipolar: one pole out, one pole in'],['Best for','sulcal (tangential) sources'],['Analysis','dipole fit or beamformer']]},
    {tag:'Timing', h:'Millisecond timing', p:'Averaging many repeats of a stimulus gives an evoked field. A pulse at the wrist gives a response in the opposite somatosensory cortex at 20 ms. A tone gives a response in auditory cortex at about 100 ms.',
      facts:[['Wrist (N20m)','20 ms, contralateral S1'],['Tone (M100)','≈ 100 ms, Heschl’s gyrus'],['Clinical use','epilepsy surgery planning']]},
  ],
  ctaTitle:'Read MEG', ctaText:'Field maps with fitted dipoles and the sensor butterfly plot: evoked responses, interictal spikes and resting rhythms.'},

us:{ full:'Ultrasound', title:'Ultrasound', long:true,
  lede:'Ultrasound sends pulses of high-frequency sound into tissue and listens for the echoes. The adult skull blocks most of the sound. So brain ultrasound is used in newborns, through the soft spot, and in adults through a thin window in the temple.',
  meta:[['Measures','Echoes and Doppler shift'],['Resolution','≈ 1 mm'],['Time','real time, at the bedside'],['Radiation','None']],
  steps:[
    {tag:'Probe', h:'A crystal that sings and listens', p:'Piezoelectric crystals in the probe vibrate when a voltage is applied, sending out a short pulse. When an echo comes back, the crystals turn it into a voltage. The probe spends about 99 % of its time listening.',
      facts:[['Frequency','2–15 MHz'],['Speed in tissue','≈ 1540 m/s'],['Higher frequency','finer detail, less depth']]},
    {tag:'Echoes', h:'Echo time becomes depth', p:'The machine times each echo. Depth equals speed × time ÷ 2. The strength of the echo sets the brightness of a dot on that line. Firing many lines across a fan builds the B-mode image.',
      facts:[['Round trip','13 µs per cm of depth'],['Bright','strong reflectors such as bone or blood clot'],['Dark','fluid, such as CSF']]},
    {tag:'Windows', h:'Find a window through the skull', p:'A newborn’s anterior fontanelle is open, so the whole brain can be seen through it. That makes cranial ultrasound the first scan for bleeding in premature babies. In adults, thin bone over the temple lets a low-frequency beam reach the arteries at the base of the brain.',
      facts:[['Cranial US','5–8 MHz, through the fontanelle'],['Fontanelle closes','12–18 months'],['TCD','2 MHz, temporal window']]},
    {tag:'Doppler', h:'Moving blood shifts the pitch', p:'Echoes from blood moving toward the probe come back at a higher frequency, and from blood moving away at a lower one. The shift gives the velocity of the blood. Transcranial Doppler tracks this in the middle cerebral artery, beat by beat.',
      facts:[['Shift','Δf = 2·f₀·v·cosθ / c'],['Normal MCA mean','≈ 50–80 cm/s'],['Vasospasm','> 120 cm/s']]},
  ],
  ctaTitle:'Read ultrasound', ctaText:'Coronal cranial ultrasound through the fontanelle and transcranial Doppler traces: intraventricular haemorrhage, white-matter injury, vasospasm and raised pressure.'},

dsa:{ full:'Digital subtraction angiography', title:'DSA',
  lede:'Catheter angiography is the reference standard for imaging blood vessels. Contrast is injected straight into an artery and filmed as it flows through the brain. A computer then removes everything except the vessels.',
  meta:[['Measures','Contrast in vessels'],['Resolution','0.2 mm'],['Time','3–6 frames per second'],['Invasive','Arterial catheter']],
  steps:[
    {tag:'Catheter', h:'Up the arteries to the neck', p:'A thin catheter goes into the femoral artery at the groin or the radial artery at the wrist. Under X-ray guidance it is steered through the aorta into a carotid or vertebral artery.',
      facts:[['Access','femoral or radial artery'],['Catheter','4–5 French (1.3–1.7 mm)'],['Stroke risk','< 0.5 %']]},
    {tag:'Run', h:'Inject and film the run', p:'A few millilitres of iodine contrast are injected while the X-ray system films several frames a second. Contrast fills the arteries first, then the capillaries, then the veins, all within about eight seconds.',
      facts:[['Frames','2–6 per second'],['Arterial phase','0–3 s'],['Venous phase','5–8 s']]},
    {tag:'Subtraction', h:'Subtract everything that did not change', p:'A mask frame is taken before contrast arrives. The computer subtracts it from every later frame. The skull disappears and only the contrast-filled vessels remain.',
      facts:[['Mask','pre-contrast frame'],['Pitfall','patient movement leaves edges'],['3D','rotational angiography']]},
    {tag:'Treat', h:'Treat through the same catheter', p:'The catheter that makes the pictures can also deliver treatment. Platinum coils can fill an aneurysm, a stent retriever can pull out a stroke clot, and glue can block an AVM.',
      facts:[['Aneurysm','coiling or flow diverter'],['Stroke','mechanical thrombectomy'],['AVM','embolisation']]},
  ],
  ctaTitle:'Read angiograms', ctaText:'Choose the artery to inject and watch the arterial, capillary and venous phases. Includes an aneurysm, an AVM, vasospasm, stroke and brain death.'},

lab:{ full:'Brain Lab', title:'Brain Lab', long:true,
  lede:'Much of what we know about brain maps comes from surgeons who stimulated the cortex of awake patients. In Brain Lab you can do the same, and then take the brain apart.',
  meta:[['Atlas','118 regions'],['Tools','Stimulate · Dissect'],['Overlays','fMRI, FDG, T1, DTI']],
  steps:[
    {tag:'Homunculus', h:'Penfield’s map of the body', p:'In the 1930s–50s Wilder Penfield stimulated the cortex of awake patients before epilepsy surgery. Stimulating the precentral gyrus moved parts of the opposite side of the body, in an orderly strip from toes to tongue. The hands and face take up far more cortex than the trunk.',
      facts:[['Pulse train','50–60 Hz, 1–10 mA'],['Motor strip','precentral gyrus'],['Sensory strip','postcentral gyrus']]},
    {tag:'Dissection', h:'Take the brain apart', p:'The brain here is split into 118 atlas regions in nine groups. Hide the lobes to reveal the thalamus and basal ganglia, pull everything apart, or cut through it in any plane.',
      facts:[['Cortex','Harvard–Oxford, 96 regions'],['Deep','thalamus, basal ganglia, hippocampus'],['Also','cerebellum, brainstem, ventricles']]},
  ],
  ctaTitle:'Open Brain Lab', ctaText:'Click the cortex to stimulate it and watch the body respond, or switch to dissection to explore deep structures.'},
};

/* =====================================================================
   Scenes: one drawing per chapter step, in a 1000 × 1000 unit box.
   G.u = canvas units per CSS pixel (for line widths and text).
   ===================================================================== */
const G = {u:1, ctx:null, t:0, env:null};
const KC = {ink:'#0c161b', ink2:'#3d4c53', muted:'#7d8b91', line:'#cdd5d9', soft:'#eef2f4', soft2:'#dfe6e9', sig:'#0050ff', sigSoft:'rgba(0,80,255,.12)',
  red:'#d9412b', redSoft:'rgba(217,65,43,.18)', amber:'#e8962a', teal:'#00a389', paper:'#ffffff', film:'#04070a', skin:'#f2e2d9', deoxy:'#6b2a4f'};
const TAU = Math.PI*2;
const narrowScene = () => innerWidth <= 820;

/* ---------- drawing kit ---------- */
function _st(c, w, dash){ const x = G.ctx; x.strokeStyle = c; x.lineWidth = w*G.u; x.setLineDash(dash ? dash.map(d=>d*G.u) : []); }
function ln(x1, y1, x2, y2, c = KC.ink2, w = 1.2, dash){ const x = G.ctx; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); _st(c, w, dash); x.stroke(); x.setLineDash([]); }
function circ(cx, cy, r, fill, stroke, w = 1.2, dash){ const x = G.ctx; x.beginPath(); x.arc(cx, cy, Math.max(0.01, r), 0, TAU); if (fill){ x.fillStyle = fill; x.fill(); } if (stroke){ _st(stroke, w, dash); x.stroke(); x.setLineDash([]); } }
function ell(cx, cy, rx, ry, fill, stroke, w = 1.2, dash, rot = 0){ const x = G.ctx; x.beginPath(); x.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); if (fill){ x.fillStyle = fill; x.fill(); } if (stroke){ _st(stroke, w, dash); x.stroke(); x.setLineDash([]); } }
function rr(x0, y0, w, h, r, fill, stroke, lw = 1.2, dash){ const x = G.ctx; x.beginPath(); x.roundRect ? x.roundRect(x0, y0, w, h, r) : x.rect(x0, y0, w, h); if (fill){ x.fillStyle = fill; x.fill(); } if (stroke){ _st(stroke, lw, dash); x.stroke(); x.setLineDash([]); } }
function poly(pts, fill, stroke, lw = 1.2, close = true, dash){ const x = G.ctx; x.beginPath(); pts.forEach((p, i)=> i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); if (close) x.closePath(); if (fill){ x.fillStyle = fill; x.fill(); } if (stroke){ _st(stroke, lw, dash); x.stroke(); x.setLineDash([]); } }
function curve(fn, x0, x1, n, stroke, lw = 1.6, dash){ const x = G.ctx; x.beginPath(); for (let i = 0; i <= n; i++){ const u = x0 + (x1 - x0)*i/n, [px, py] = fn(u); i ? x.lineTo(px, py) : x.moveTo(px, py); } _st(stroke, lw, dash); x.stroke(); x.setLineDash([]); }
function arrow(x1, y1, x2, y2, c = KC.ink, w = 1.6, hs = 9){
  ln(x1, y1, x2, y2, c, w); const a = Math.atan2(y2 - y1, x2 - x1), h = hs*G.u;
  poly([[x2, y2], [x2 - h*Math.cos(a - 0.42), y2 - h*Math.sin(a - 0.42)], [x2 - h*Math.cos(a + 0.42), y2 - h*Math.sin(a + 0.42)]], c);
}
function fontOf(kind, size, weight){ const px = size*(narrowScene() ? 0.9 : 1)*G.u; return kind === 'body' ? `${weight || 500} ${px}px "Instrument Sans", system-ui, sans-serif` : kind === 'disp' ? `${weight || 600} ${px}px Archivo, Arial, sans-serif` : `${weight || 400} ${px}px "Azeret Mono", ui-monospace, monospace`; }
function txt(s, x, y, o = {}){
  const c = G.ctx; c.font = fontOf(o.font || 'mono', o.size || 11, o.weight); c.fillStyle = o.color || KC.ink2; c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic';
  if (!o.maxW){ c.fillText(s, x, y); return 1; }
  const words = String(s).split(' '), lh = (o.size || 11)*1.35*G.u*(narrowScene() ? 0.9 : 1); let line = '', n = 0;
  for (const w of words){ const tt = line ? line + ' ' + w : w; if (c.measureText(tt).width > o.maxW && line){ c.fillText(line, x, y + n*lh); n++; line = w; } else line = tt; }
  c.fillText(line, x, y + n*lh); return n + 1;
}
function label(s, x, y, o = {}){ return txt(s, x, y, {size:11, color:KC.ink2, ...o}); }
function head(s, x, y, o = {}){ return txt(s.toUpperCase(), x, y, {size:10.5, color:KC.muted, ...o}); }
function callout(x, y, tx, ty, s, o = {}){
  circ(x, y, 3.2*G.u, o.color || KC.ink); ln(x, y, tx, ty, o.color || KC.ink2, 0.9);
  const right = tx >= x; ln(tx, ty, tx + (right ? 14 : -14)*G.u, ty, o.color || KC.ink2, 0.9);
  txt(s, tx + (right ? 20 : -20)*G.u, ty + 4*G.u, {size:11, color:o.color || KC.ink, align:right ? 'left' : 'right', maxW:o.maxW, font:o.font, weight:o.weight});
}
function fade(a, fn){ if (a <= 0.002) return; const c = G.ctx; c.save(); c.globalAlpha *= Math.min(1, a); fn(); c.restore(); }
function clip(fn, draw){ const c = G.ctx; c.save(); c.beginPath(); fn(c); c.clip(); draw(); c.restore(); }
function box(x, y, w, h, title, o = {}){ rr(x, y, w, h, 3, o.fill || null, o.stroke || KC.line, 1); if (title) head(title, x, y - 10*G.u); }
function img(cv, x, y, w, h, a = 1){ if (!cv) { rr(x, y, w, h, 3, KC.film); return; } fade(a, ()=>{ const c = G.ctx; c.imageSmoothingEnabled = true; c.drawImage(cv, x, y, w, h); }); }
function placeholder(x, y, w, h, s = 'Loading the brain…'){ rr(x, y, w, h, 3, KC.soft, KC.line, 1); txt(s, x + w/2, y + h/2, {align:'center', color:KC.muted, size:10.5}); }
const rnd = seed => () => { seed = (seed*16807) % 2147483647; return (seed - 1)/2147483646; };
const hashf = i => { const s = Math.sin(i*127.1 + 311.7)*43758.5453; return s - Math.floor(s); };

/* ---------- images from the real volume ---------- */
