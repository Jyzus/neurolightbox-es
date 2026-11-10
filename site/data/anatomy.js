const REGION_INFO = window.REGION_INFO = {
  'Frontal Pole':{fn:'Planning many steps ahead, weighing alternatives, and holding long-term goals.', clin:'Damage blunts planning and initiative with little obvious deficit on routine exam.', supply:'ACA'},
  'Insular Cortex':{fn:'Interoception: feeling your own heartbeat, breathing, hunger, pain, taste and emotion.', clin:'Infarcts can cause disordered taste, autonomic changes and loss of craving.', supply:'MCA (M2 insular branches)'},
  'Superior Frontal Gyrus':{fn:'Self-awareness, working memory and, at its back end, the supplementary motor area.', clin:'Medial damage causes reduced spontaneous movement and speech (abulia).', supply:'ACA'},
  'Middle Frontal Gyrus':{fn:'Working memory and attention; its posterior part holds the frontal eye field that turns gaze.', clin:'Acute lesions make the eyes deviate toward the damaged side.', supply:'MCA (superior division)'},
  'Inferior Frontal Gyrus pars triangularis':{fn:'Part of Broca’s area (BA45): selecting words and meaning in speech.', clin:'Left-sided damage gives non-fluent (Broca’s) aphasia.', supply:'MCA (superior division)'},
  'Inferior Frontal Gyrus pars opercularis':{fn:'Part of Broca’s area (BA44): planning the sequence of speech movements.', clin:'Left-sided damage: halting, effortful speech with preserved comprehension.', supply:'MCA (superior division)'},
  'Subcallosal Cortex':{fn:'Mood regulation; area 25 under the corpus callosum.', clin:'A deep brain stimulation target for treatment-resistant depression.', supply:'ACA'},
  'Temporal Pole':{fn:'Linking faces, names and emotional memories (semantic hub).', clin:'Atrophy in semantic dementia: words lose their meaning.', supply:'MCA (anterior temporal branch)'},
  'Superior Temporal Gyrus anterior division':{fn:'Auditory association cortex for sounds and speech.', clin:'Damage impairs recognising complex sounds.', supply:'MCA (inferior division)'},
  'Superior Temporal Gyrus posterior division':{fn:'Wernicke’s area on the left: understanding spoken language.', clin:'Left damage gives fluent but meaningless speech with poor comprehension.', supply:'MCA (inferior division)'},
  'Middle Temporal Gyrus anterior division':{fn:'Word meaning and semantic memory.', clin:'Naming and comprehension problems.', supply:'MCA'},
  'Middle Temporal Gyrus posterior division':{fn:'Linking words to meaning; near area MT for motion.', clin:'Word-finding problems.', supply:'MCA'},
  'Middle Temporal Gyrus temporooccipital part':{fn:'Visual motion area MT/V5.', clin:'Bilateral damage causes akinetopsia (seeing motion as still frames).', supply:'MCA / PCA'},
  'Inferior Temporal Gyrus anterior division':{fn:'Object recognition and visual memory.', clin:'Visual agnosia.', supply:'MCA / PCA'},
  'Inferior Temporal Gyrus posterior division':{fn:'Recognising objects and forms (ventral “what” stream).', clin:'Visual agnosia.', supply:'PCA'},
  'Inferior Temporal Gyrus temporooccipital part':{fn:'High-level visual object recognition.', clin:'Object agnosia.', supply:'PCA'},
  'Postcentral Gyrus':{fn:'Primary somatosensory cortex (S1): touch, pain, temperature and joint position, mapped as a homunculus.', clin:'Contralateral loss of fine sensation and position sense.', supply:'MCA (face, arm) / ACA (leg)'},
  'Superior Parietal Lobule':{fn:'Body map in space; guides reaching and eye–hand coordination.', clin:'Optic ataxia: misreaching for objects.', supply:'MCA / ACA'},
  'Supramarginal Gyrus anterior division':{fn:'Integrating touch and body position; phonological working memory on the left.', clin:'Conduction aphasia (poor repetition) on the left.', supply:'MCA'},
  'Supramarginal Gyrus posterior division':{fn:'Language and tool use (praxis).', clin:'Ideomotor apraxia.', supply:'MCA'},
  'Angular Gyrus':{fn:'Reading, writing, arithmetic and number sense on the left; bodily self-location on the right.', clin:'Gerstmann syndrome (left): agraphia, acalculia, finger agnosia, left–right confusion.', supply:'MCA (angular branch)'},
  'Lateral Occipital Cortex superior division':{fn:'Visual association: spatial layout and motion.', clin:'Visual spatial disorientation.', supply:'PCA / MCA'},
  'Lateral Occipital Cortex inferior division':{fn:'Object shape recognition (lateral occipital complex).', clin:'Object agnosia.', supply:'PCA'},
  'Intracalcarine Cortex':{fn:'Primary visual cortex (V1) inside the calcarine sulcus.', clin:'Contralateral homonymous hemianopia, often with macular sparing.', supply:'PCA (calcarine artery)'},
  'Frontal Medial Cortex':{fn:'Valuing choices, self-referential thought; a default-mode hub.', clin:'Apathy and poor judgement.', supply:'ACA'},
  'Supplementary Motor Area (juxtapositional lobule)':{fn:'Planning and initiating movement sequences, both sides.', clin:'Transient mutism and neglect of the opposite limbs after resection.', supply:'ACA'},
  'Paracingulate Gyrus':{fn:'Reality monitoring and conflict detection.', clin:'Varies widely between people; subtle effects.', supply:'ACA'},
  'Cingulate Gyrus anterior division':{fn:'Error detection, motivation, pain affect.', clin:'Akinetic mutism with bilateral damage.', supply:'ACA (pericallosal)'},
  'Cingulate Gyrus posterior division':{fn:'Default-mode hub: memory retrieval and self-reflection.', clin:'Among the earliest areas affected in Alzheimer’s disease.', supply:'ACA / PCA'},
  'Precuneus':{fn:'Mental imagery, episodic memory and self-consciousness.', clin:'Hypometabolic early in Alzheimer’s and in disorders of consciousness.', supply:'ACA / PCA'},
  'Cuneal Cortex':{fn:'Visual cortex above the calcarine sulcus: the lower visual field.', clin:'Contralateral lower quadrantanopia.', supply:'PCA'},
  'Frontal Orbital Cortex':{fn:'Reward, social behaviour and decision-making.', clin:'Disinhibition and impulsivity (Phineas Gage).', supply:'ACA / MCA'},
  'Parahippocampal Gyrus anterior division':{fn:'Entorhinal cortex: the gateway into the hippocampus.', clin:'First area affected by tangles in Alzheimer’s disease.', supply:'PCA'},
  'Parahippocampal Gyrus posterior division':{fn:'Recognising places and scenes.', clin:'Topographic disorientation.', supply:'PCA'},
  'Lingual Gyrus':{fn:'Visual cortex below the calcarine sulcus: the upper visual field and colour.', clin:'Contralateral upper quadrantanopia; achromatopsia.', supply:'PCA'},
  'Temporal Fusiform Cortex anterior division':{fn:'Semantic and object knowledge.', clin:'Semantic deficits.', supply:'PCA'},
  'Temporal Fusiform Cortex posterior division':{fn:'Fusiform face area (especially on the right).', clin:'Prosopagnosia: cannot recognise faces.', supply:'PCA'},
  'Temporal Occipital Fusiform Cortex':{fn:'Faces (right) and the visual word form area (left).', clin:'Pure alexia on the left; prosopagnosia on the right.', supply:'PCA'},
  'Occipital Fusiform Gyrus':{fn:'Colour and early object processing.', clin:'Achromatopsia.', supply:'PCA'},
  'Frontal Operculum Cortex':{fn:'Speech motor control and taste.', clin:'Speech output problems on the left.', supply:'MCA'},
  'Central Opercular Cortex':{fn:'Face, tongue and throat sensorimotor areas; swallowing.', clin:'Bilateral damage: Foix–Chavany–Marie syndrome (cannot move face voluntarily).', supply:'MCA'},
  'Parietal Operculum Cortex':{fn:'Secondary somatosensory cortex (S2): touch from both sides of the body, pain.', clin:'Altered pain perception.', supply:'MCA'},
  'Planum Polare':{fn:'Auditory association cortex for melody and pitch.', clin:'Amusia.', supply:'MCA'},
  "Heschl's Gyrus (includes H1 and H2)":{fn:'Primary auditory cortex (A1), arranged by sound frequency.', clin:'Unilateral damage is subtle; bilateral causes cortical deafness.', supply:'MCA'},
  'Planum Temporale':{fn:'Larger on the left; processes speech sounds and spatial hearing.', clin:'Part of Wernicke’s region.', supply:'MCA'},
  'Supracalcarine Cortex':{fn:'Visual cortex just above the calcarine sulcus.', clin:'Lower visual field defects.', supply:'PCA'},
  'Occipital Pole':{fn:'Central (macular) vision; the largest piece of V1 per degree of visual field.', clin:'Central scotoma.', supply:'PCA / MCA watershed'},
  'Lateral ventricle':{fn:'CSF-filled cavity; the choroid plexus inside produces about 500 mL of CSF a day.', clin:'Enlarges with hydrocephalus or atrophy.', supply:'Choroidal arteries'},
  'Thalamus':{fn:'Relay and gate for almost all sensory input to the cortex, plus arousal and attention.', clin:'Contralateral sensory loss; thalamic pain syndrome (Dejerine–Roussy).', supply:'PCA perforators'},
  'Caudate':{fn:'Learning, habits and goal-directed action (basal ganglia).', clin:'Atrophies early in Huntington’s disease.', supply:'MCA lenticulostriates, ACA (Heubner)'},
  'Putamen':{fn:'Motor learning and movement selection (basal ganglia).', clin:'Commonest site of hypertensive haemorrhage.', supply:'MCA lenticulostriates'},
  'Globus pallidus':{fn:'Main output of the basal ganglia; iron-rich.', clin:'GPi is a DBS target for dystonia and Parkinson’s disease.', supply:'Anterior choroidal artery'},
  'Hippocampus':{fn:'Forming new long-term memories and mapping space.', clin:'Bilateral loss causes dense anterograde amnesia (patient H.M.).', supply:'PCA, anterior choroidal'},
  'Amygdala':{fn:'Detecting threat and tagging memories with emotion.', clin:'Bilateral damage removes fear (Urbach–Wiethe disease).', supply:'Anterior choroidal artery'},
  'Nucleus accumbens':{fn:'Reward, motivation and addiction.', clin:'DBS target studied for depression and addiction.', supply:'ACA / MCA perforators'},
  'Brainstem':{fn:'Breathing, heart rate, consciousness (reticular formation), cranial nerves and every long tract.', clin:'Small lesions cause crossed signs: cranial nerve palsy on one side, weakness on the other.', supply:'Vertebrobasilar system'},
  'Cerebellar hemisphere':{fn:'Coordinating limb movement and timing, on the same side of the body.', clin:'Ipsilateral ataxia, intention tremor, dysdiadochokinesia.', supply:'SCA, AICA, PICA'},
  'Vermis':{fn:'Balance, posture and eye movements.', clin:'Truncal ataxia: broad-based, unsteady gait (alcohol).', supply:'SCA, PICA'},
  'Third ventricle':{fn:'Midline CSF cavity between the two thalami.', clin:'Colloid cysts here can block CSF flow suddenly.', supply:'—'},
  'Fourth ventricle':{fn:'CSF cavity between brainstem and cerebellum, draining to the subarachnoid space.', clin:'Posterior fossa tumours can obstruct it.', supply:'—'},
};
const GROUP_COLORS = window.GROUP_COLORS = {
  'Frontal lobe':[0.88,0.48,0.37], 'Parietal lobe':[0.87,0.72,0.37], 'Temporal lobe':[0.55,0.72,0.42], 'Occipital lobe':[0.42,0.64,0.86],
  'Limbic lobe':[0.75,0.52,0.79], 'Insula & operculum':[0.31,0.7,0.66], 'Deep grey matter':[0.85,0.79,0.64], 'Ventricles':[0.4,0.78,0.88],
  'Cerebellum':[0.84,0.48,0.62], 'Brainstem':[0.6,0.65,0.72],
};
const GROUP_ORDER = window.GROUP_ORDER = ['Frontal lobe','Parietal lobe','Temporal lobe','Occipital lobe','Limbic lobe','Insula & operculum','Deep grey matter','Ventricles','Cerebellum','Brainstem'];

/* ---------- stimulation (Penfield and modern cortical stimulation mapping) ---------- */
const SOMATO = window.SOMATO = [ // |x|, y, z on precentral gyrus -> body part
  ['toes',6,-25,72],['foot',9,-26,72],['leg',14,-24,74],['hip',20,-22,72],['trunk',24,-21,70],['shoulder',29,-20,67],['arm',33,-20,63],
  ['hand',37,-20,58],['fingers',40,-18,53],['thumb',45,-14,47],['neck',49,-11,42],['face',53,-8,34],['lips',57,-6,26],['tongue',59,-4,18],['throat',61,-2,10],
];
const PART_LABEL = window.PART_LABEL = {toes:'toes',foot:'foot',leg:'leg',hip:'hip',trunk:'trunk',shoulder:'shoulder',arm:'arm',hand:'hand',fingers:'fingers',thumb:'thumb',neck:'neck',face:'face',lips:'lips',tongue:'tongue',throat:'throat'};
window.stimEffect = function stimEffect(region, p){
  // region: {name, hemi, group}; p: MNI point. Returns {kind, part, side, title, text, ref}
  const side = region.hemi === 'L' ? 'right' : region.hemi === 'R' ? 'left' : 'both';
  const nm = region.name;
  const nearestPart = (dy) => { let best = null, bd = 1e9; for (const s of SOMATO){ const d = Math.hypot(Math.abs(p[0]) - s[1], p[1] - (s[2] + dy), p[2] - s[3]); if (d < bd){ bd = d; best = s[0]; } } return best; };
  const isL = region.hemi === 'L';
  if (nm === 'Precentral Gyrus'){ const part = nearestPart(0); return {kind:'move', part, side, title:(part === 'tongue' || part === 'face' || part === 'throat') ? `${cap(side)} side of the ${PART_LABEL[part]} twitches` : `${cap(side)} ${PART_LABEL[part]} ${/s$/.test(PART_LABEL[part]) ? 'twitch' : 'twitches'}`, text:`Primary motor cortex. Stimulating this spot of the motor homunculus makes the ${side} ${PART_LABEL[part]} contract; the body map runs from toes on the midline down to face and tongue near the sylvian fissure.`}; }
  if (nm === 'Postcentral Gyrus'){ const part = nearestPart(-9); return {kind:'feel', part, side, title:`Tingling in the ${side} ${PART_LABEL[part]}`, text:`Primary somatosensory cortex. Patients report tingling, numbness or a feeling of movement in the ${side} ${PART_LABEL[part]} — rarely pain.`}; }
  if (nm.startsWith('Supplementary Motor')) return {kind:'move', part:'posture', side:'both', title:'Both arms rise, head turns', text:'Supplementary motor area. Stimulation produces complex postures — the opposite arm raised, head and eyes turned (a “fencing” posture) — or an urge to move, sometimes speech arrest.'};
  if (nm === 'Middle Frontal Gyrus' && p[1] < 8) return {kind:'eyes', part:'eyes', side, title:`Eyes turn to the ${side}`, text:'Frontal eye field. Stimulation drives the eyes (and often the head) toward the opposite side.'};
  if (nm.startsWith('Inferior Frontal Gyrus') && isL) return {kind:'speech', part:'mouth', side:'both', title:'Speech arrest', text:'Broca’s area in the dominant hemisphere. The patient counting aloud suddenly stops, although they can still move their mouth; this is how surgeons map language before resection.'};
  if ((nm === 'Superior Temporal Gyrus posterior division' || nm === 'Supramarginal Gyrus anterior division' || nm === 'Supramarginal Gyrus posterior division' || nm === 'Planum Temporale') && isL) return {kind:'speech', part:'mouth', side:'both', title:'Comprehension and naming fail', text:'Posterior language area (Wernicke’s region). Stimulation makes the patient misname objects or produce wrong words (paraphasias) while still speaking fluently.'};
  if (nm.startsWith("Heschl") || nm === 'Planum Polare' || (nm === 'Planum Temporale')) return {kind:'hear', part:'ears', side, title:'A buzzing or ringing sound', text:'Auditory cortex. Patients hear simple sounds — buzzing, ringing, a hum — usually felt in the opposite ear.'};
  if (['Intracalcarine Cortex','Supracalcarine Cortex','Cuneal Cortex','Occipital Pole','Lingual Gyrus','Lateral Occipital Cortex superior division','Lateral Occipital Cortex inferior division','Occipital Fusiform Gyrus'].includes(nm)){
    const upper = (nm === 'Lingual Gyrus' || nm === 'Occipital Fusiform Gyrus' || nm.includes('inferior') || (nm === 'Intracalcarine Cortex' && p[2] < 2));
    const central = nm === 'Occipital Pole';
    return {kind:'see', part:'eyes', side, field:{side, upper, central}, title:`Flashes of light in the ${side} visual field`, text:`Visual cortex. Stimulation produces phosphenes — spots or flashes of light — in the ${central ? 'centre of the' : (upper ? 'upper ' : 'lower ') + side} visual field, opposite the stimulated side${upper ? ' (below the calcarine sulcus maps the upper field)' : ''}.`};
  }
  if ((nm === 'Temporal Fusiform Cortex posterior division' || nm === 'Temporal Occipital Fusiform Cortex') && !isL) return {kind:'see', part:'face', side:'both', field:{side:'both', face:true}, title:'Faces look distorted', text:'Fusiform face area. Stimulation makes a face in front of the patient seem to morph or melt while other objects look normal (Parvizi et al., 2012).'};
  if (nm === 'Insular Cortex') return {kind:'gut', part:'trunk', side:'both', title:'A wave of nausea or an odd taste', text:'Insula. Stimulation evokes visceral sensations: a rising feeling in the stomach, nausea, an unpleasant taste, warmth or tightness in the throat.'};
  if (nm === 'Central Opercular Cortex' || nm === 'Frontal Operculum Cortex') return {kind:'move', part:'tongue', side, title:'Tongue and throat movements, salivation', text:'Opercular cortex. Stimulation produces swallowing, licking or chewing movements, salivation or tingling of the tongue.'};
  if (nm === 'Parietal Operculum Cortex') return {kind:'feel', part:'trunk', side:'both', title:'Tingling on both sides', text:'Secondary somatosensory cortex (S2). Sensations can be felt on both sides of the body, sometimes with a painful or thermal quality.'};
  if (nm === 'Angular Gyrus' && !isL) return {kind:'self', part:'body', side:'both', title:'An out-of-body experience', text:'Right angular gyrus / temporoparietal junction. In one famous patient, stimulation made her feel she was floating near the ceiling looking down at her body (Blanke et al., 2002).'};
  if (nm === 'Angular Gyrus') return {kind:'speech', part:'mouth', side:'both', title:'Reading and naming errors', text:'Left angular gyrus. Stimulation disrupts reading, writing and calculation.'};
  if (['Temporal Pole','Superior Temporal Gyrus anterior division','Middle Temporal Gyrus anterior division','Middle Temporal Gyrus posterior division','Inferior Temporal Gyrus anterior division','Superior Temporal Gyrus posterior division'].includes(nm)) return {kind:'memory', part:'head', side:'both', title:'A vivid memory or déjà vu', text:'Lateral temporal cortex. Penfield’s patients sometimes relived scenes — hearing music, a voice, a familiar place — or felt intense déjà vu.'};
  if (nm.startsWith('Parahippocampal') || nm === 'Hippocampus') return {kind:'memory', part:'head', side:'both', title:'Déjà vu, a dreamy state', text:'Mesial temporal lobe. Stimulation produces déjà vu, dreamy states or recollection of memories, much like the aura of temporal lobe epilepsy.'};
  if (nm === 'Amygdala') return {kind:'emotion', part:'face', side:'both', title:'Sudden fear and a rising stomach', text:'Amygdala. Stimulation can trigger fear, anxiety and an epigastric rising sensation, sometimes with a fearful expression.'};
  if (nm.startsWith('Cingulate Gyrus anterior')) return {kind:'emotion', part:'body', side:'both', title:'An urge to keep going', text:'Anterior cingulate. Patients describe an urge or determination to push through a challenge, with increased heart rate (Parvizi et al., 2013).'};
  if (nm === 'Subcallosal Cortex') return {kind:'emotion', part:'face', side:'both', title:'Mood lifts', text:'Subgenual cingulate (area 25). Chronic deep brain stimulation here has been trialled for treatment-resistant depression.'};
  if (nm === 'Thalamus') return {kind:'feel', part:'hand', side, title:`Tingling across the ${side} body`, text:'Thalamus (sensory relay nuclei). Stimulation causes tingling on the opposite side. The ventral intermediate nucleus is the DBS target for essential tremor.'};
  if (nm === 'Globus pallidus' || nm === 'Putamen' || nm === 'Caudate') return {kind:'quiet', part:'hand', side, title:'Tremor and stiffness ease', text:'Basal ganglia. Stimulating these circuits produces no felt sensation, but chronic stimulation of the internal pallidum (or nearby subthalamic nucleus) relieves Parkinsonian tremor, rigidity and dyskinesia.'};
  if (nm === 'Nucleus accumbens') return {kind:'emotion', part:'face', side:'both', title:'A spontaneous smile', text:'Nucleus accumbens. Stimulation can produce pleasure or a smile; it has been studied as a DBS target in depression and addiction.'};
  if (region.group === 'Cerebellum') return {kind:'quiet', part:'none', side:'both', title:'No conscious response', text:'Cerebellum. Electrical stimulation produces no sensation or movement the patient notices — its work is coordinating movement, not starting it.'};
  if (nm === 'Brainstem') return {kind:'quiet', part:'none', side:'both', title:'Not stimulated', text:'Brainstem. Never stimulated in awake mapping: it controls breathing, heart rate and consciousness.'};
  if (region.group === 'Ventricles') return {kind:'quiet', part:'none', side:'both', title:'CSF space — nothing to stimulate', text:'This is fluid, not neurons.'};
  return {kind:'quiet', part:'none', side:'both', title:'No obvious response', text:`${nm}. Much of the prefrontal and association cortex is “silent” to stimulation: nothing visible happens, although careful testing can reveal subtle effects on attention, mood or decision-making.`};
}
window.cap = function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

/* =====================================================================
   GLSL. World space = MNI152 millimetres (+x right, +y anterior, +z superior).
   ===================================================================== */
