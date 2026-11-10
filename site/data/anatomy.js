// Etiquetas de presentación. Las claves conservan los nombres originales del atlas.
const REGION_NAMES_ES = {
  "Amygdala": "Amígdala",
  "Angular Gyrus": "Giro angular",
  "Brainstem": "Tronco del encéfalo",
  "Caudate": "Núcleo caudado",
  "Central Opercular Cortex": "Corteza opercular central",
  "Cerebellar hemisphere": "Hemisferio cerebeloso",
  "Cingulate Gyrus anterior division": "Porción anterior del giro del cíngulo",
  "Cingulate Gyrus posterior division": "Porción posterior del giro del cíngulo",
  "Cuneal Cortex": "Corteza del cúneo",
  "Fourth ventricle": "Cuarto ventrículo",
  "Frontal Medial Cortex": "Corteza frontal medial",
  "Frontal Operculum Cortex": "Corteza del opérculo frontal",
  "Frontal Orbital Cortex": "Corteza orbitofrontal",
  "Frontal Pole": "Polo frontal",
  "Globus pallidus": "Globo pálido",
  "Heschl's Gyrus (includes H1 and H2)": "Giros temporales transversos de Heschl (H1 y H2)",
  "Hippocampus": "Hipocampo",
  "Inferior Frontal Gyrus pars opercularis": "Porción opercular del giro frontal inferior",
  "Inferior Frontal Gyrus pars triangularis": "Porción triangular del giro frontal inferior",
  "Inferior Temporal Gyrus anterior division": "Porción anterior del giro temporal inferior",
  "Inferior Temporal Gyrus posterior division": "Porción posterior del giro temporal inferior",
  "Inferior Temporal Gyrus temporoocipital part": "Porción temporooccipital del giro temporal inferior",
  "Insular Cortex": "Corteza insular",
  "Intracalcarine Cortex": "Corteza intracalcarina",
  "Lateral Occipital Cortex inferior division": "Porción inferior de la corteza occipital lateral",
  "Lateral Occipital Cortex superior division": "Porción superior de la corteza occipital lateral",
  "Lateral ventricle": "Ventrículo lateral",
  "Lingual Gyrus": "Giro lingual",
  "Middle Frontal Gyrus": "Giro frontal medio",
  "Middle Temporal Gyrus anterior division": "Porción anterior del giro temporal medio",
  "Middle Temporal Gyrus posterior division": "Porción posterior del giro temporal medio",
  "Middle Temporal Gyrus temporoocipital part": "Porción temporooccipital del giro temporal medio",
  "Nucleus accumbens": "Núcleo accumbens",
  "Occipital Fusiform Gyrus": "Giro fusiforme occipital",
  "Occipital Pole": "Polo occipital",
  "Paracingulate Gyrus": "Giro paracingulado",
  "Parahippocampal Gyrus anterior division": "Porción anterior del giro parahipocampal",
  "Parahippocampal Gyrus posterior division": "Porción posterior del giro parahipocampal",
  "Parietal Operculum Cortex": "Corteza del opérculo parietal",
  "Planum Polare": "Plano polar",
  "Planum Temporale": "Plano temporal",
  "Postcentral Gyrus": "Giro poscentral",
  "Precentral Gyrus": "Giro precentral",
  "Precuneus": "Precúneo",
  "Putamen": "Putamen",
  "Subcallosal Cortex": "Corteza subcallosa",
  "Superior Frontal Gyrus": "Giro frontal superior",
  "Superior Parietal Lobule": "Lobulillo parietal superior",
  "Superior Temporal Gyrus anterior division": "Porción anterior del giro temporal superior",
  "Superior Temporal Gyrus posterior division": "Porción posterior del giro temporal superior",
  "Supplementary Motor Area (juxtapositional lobule)": "Área motora suplementaria (lobulillo yuxtaposicional)",
  "Supracalcarine Cortex": "Corteza supracalcarina",
  "Supramarginal Gyrus anterior division": "Porción anterior del giro supramarginal",
  "Supramarginal Gyrus posterior division": "Porción posterior del giro supramarginal",
  "Temporal Fusiform Cortex anterior division": "Porción anterior de la corteza fusiforme temporal",
  "Temporal Fusiform Cortex posterior division": "Porción posterior de la corteza fusiforme temporal",
  "Temporal Occipital Fusiform Cortex": "Corteza fusiforme temporooccipital",
  "Temporal Pole": "Polo temporal",
  "Thalamus": "Tálamo",
  "Third ventricle": "Tercer ventrículo",
  "Vermis": "Vermis cerebeloso"
};

window.regionNameEs = name => Object.hasOwn(REGION_NAMES_ES, name) ? REGION_NAMES_ES[name] : name;

const REGION_INFO = window.REGION_INFO = {
  "Frontal Pole": {
    "fn": "Planificación de muchos pasos por anticipado, ponderación de alternativas y mantenimiento de metas a largo plazo.",
    "clin": "La lesión embota la planificación y la iniciativa, con escaso déficit evidente en la exploración rutinaria.",
    "supply": "ACA"
  },
  "Insular Cortex": {
    "fn": "Interocepción: percibir el propio latido cardíaco, la respiración, el hambre, el dolor, el gusto y la emoción.",
    "clin": "Los infartos pueden provocar alteraciones del gusto, cambios autonómicos y pérdida del deseo compulsivo (craving).",
    "supply": "MCA (M2 insular branches)"
  },
  "Superior Frontal Gyrus": {
    "fn": "Autoconciencia, memoria de trabajo y, en su porción posterior, el área motora suplementaria.",
    "clin": "La lesión medial reduce la iniciativa motora y verbal espontánea (abulia).",
    "supply": "ACA"
  },
  "Middle Frontal Gyrus": {
    "fn": "Memoria de trabajo y atención; su porción posterior alberga el campo ocular frontal, que orienta la mirada.",
    "clin": "Las lesiones agudas desvían los ojos hacia el lado lesionado.",
    "supply": "MCA (superior division)"
  },
  "Inferior Frontal Gyrus pars triangularis": {
    "fn": "Parte del área de Broca (BA45): selección de las palabras y del significado en el habla.",
    "clin": "La lesión del hemisferio izquierdo produce afasia no fluente (de Broca).",
    "supply": "MCA (superior division)"
  },
  "Inferior Frontal Gyrus pars opercularis": {
    "fn": "Parte del área de Broca (BA44): planificación de la secuencia de movimientos del habla.",
    "clin": "Lesión izquierda: habla entrecortada y con esfuerzo, con comprensión preservada.",
    "supply": "MCA (superior division)"
  },
  "Subcallosal Cortex": {
    "fn": "Regulación del estado de ánimo; área 25 situada bajo el cuerpo calloso.",
    "clin": "Diana de estimulación cerebral profunda en la depresión resistente al tratamiento.",
    "supply": "ACA"
  },
  "Temporal Pole": {
    "fn": "Vinculación de rostros, nombres y recuerdos emocionales (núcleo semántico).",
    "clin": "Atrofia en la demencia semántica: las palabras pierden su significado.",
    "supply": "MCA (anterior temporal branch)"
  },
  "Superior Temporal Gyrus anterior division": {
    "fn": "Corteza de asociación auditiva para los sonidos y el habla.",
    "clin": "La lesión dificulta el reconocimiento de sonidos complejos.",
    "supply": "MCA (inferior division)"
  },
  "Superior Temporal Gyrus posterior division": {
    "fn": "Área de Wernicke en el hemisferio izquierdo: comprensión del lenguaje hablado.",
    "clin": "La lesión izquierda produce un habla fluente pero sin sentido, con comprensión deficiente.",
    "supply": "MCA (inferior division)"
  },
  "Middle Temporal Gyrus anterior division": {
    "fn": "Significado de las palabras y memoria semántica.",
    "clin": "Dificultades de denominación y de comprensión.",
    "supply": "MCA"
  },
  "Middle Temporal Gyrus posterior division": {
    "fn": "Vinculación de las palabras con su significado; próxima al área MT para el movimiento.",
    "clin": "Dificultades para evocar palabras.",
    "supply": "MCA"
  },
  "Middle Temporal Gyrus temporooccipital part": {
    "fn": "Área visual del movimiento MT/V5.",
    "clin": "La lesión bilateral causa acinetopsia (percibir el movimiento como imágenes fijas).",
    "supply": "MCA / PCA"
  },
  "Inferior Temporal Gyrus anterior division": {
    "fn": "Reconocimiento de objetos y memoria visual.",
    "clin": "Agnosia visual.",
    "supply": "MCA / PCA"
  },
  "Inferior Temporal Gyrus posterior division": {
    "fn": "Reconocimiento de objetos y formas (vía ventral del «qué»).",
    "clin": "Agnosia visual.",
    "supply": "PCA"
  },
  "Inferior Temporal Gyrus temporooccipital part": {
    "fn": "Reconocimiento visual de alto nivel de los objetos.",
    "clin": "Agnosia de objetos.",
    "supply": "PCA"
  },
  "Postcentral Gyrus": {
    "fn": "Corteza somatosensorial primaria (S1): tacto, dolor, temperatura y posición articular, representados en un homúnculo.",
    "clin": "Pérdida contralateral de la sensibilidad fina y del sentido de la posición.",
    "supply": "MCA (face, arm) / ACA (leg)"
  },
  "Superior Parietal Lobule": {
    "fn": "Mapa corporal en el espacio; guía el alcance y la coordinación ojo-mano.",
    "clin": "Ataxia óptica: errores al dirigir la mano hacia los objetos.",
    "supply": "MCA / ACA"
  },
  "Supramarginal Gyrus anterior division": {
    "fn": "Integración del tacto y de la posición corporal; memoria de trabajo fonológica en el hemisferio izquierdo.",
    "clin": "Afasia de conducción (repetición deficiente) en el hemisferio izquierdo.",
    "supply": "MCA"
  },
  "Supramarginal Gyrus posterior division": {
    "fn": "Lenguaje y uso de herramientas (praxia).",
    "clin": "Apraxia ideomotora.",
    "supply": "MCA"
  },
  "Angular Gyrus": {
    "fn": "Lectura, escritura, aritmética y sentido numérico en el hemisferio izquierdo; autolocalización corporal en el derecho.",
    "clin": "Síndrome de Gerstmann (hemisferio izquierdo): agrafia, acalculia, agnosia digital y confusión derecha-izquierda.",
    "supply": "MCA (angular branch)"
  },
  "Lateral Occipital Cortex superior division": {
    "fn": "Asociación visual: disposición espacial y movimiento.",
    "clin": "Desorientación visoespacial.",
    "supply": "PCA / MCA"
  },
  "Lateral Occipital Cortex inferior division": {
    "fn": "Reconocimiento de la forma de los objetos (complejo occipital lateral).",
    "clin": "Agnosia de objetos.",
    "supply": "PCA"
  },
  "Intracalcarine Cortex": {
    "fn": "Corteza visual primaria (V1) en el interior del surco calcarino.",
    "clin": "Hemianopsia homónima contralateral, a menudo con respeto macular.",
    "supply": "PCA (calcarine artery)"
  },
  "Frontal Medial Cortex": {
    "fn": "Valoración de las opciones y pensamiento autorreferencial; nodo de la red neuronal por defecto.",
    "clin": "Apatía y juicio deficiente.",
    "supply": "ACA"
  },
  "Supplementary Motor Area (juxtapositional lobule)": {
    "fn": "Planificación e inicio de secuencias motoras, en ambos lados.",
    "clin": "Mutismo transitorio y negligencia de las extremidades contralaterales tras la resección.",
    "supply": "ACA"
  },
  "Paracingulate Gyrus": {
    "fn": "Monitorización de la realidad y detección de conflictos.",
    "clin": "Muy variable entre personas; efectos sutiles.",
    "supply": "ACA"
  },
  "Cingulate Gyrus anterior division": {
    "fn": "Detección de errores, motivación y componente afectivo del dolor.",
    "clin": "Mutismo acinético con lesión bilateral.",
    "supply": "ACA (pericallosal)"
  },
  "Cingulate Gyrus posterior division": {
    "fn": "Nodo de la red neuronal por defecto: recuperación de la memoria y autorreflexión.",
    "clin": "De las primeras áreas afectadas en la enfermedad de Alzheimer.",
    "supply": "ACA / PCA"
  },
  "Precuneus": {
    "fn": "Imágenes mentales, memoria episódica y autoconciencia.",
    "clin": "Hipometabolismo precoz en la enfermedad de Alzheimer y en los trastornos de la conciencia.",
    "supply": "ACA / PCA"
  },
  "Cuneal Cortex": {
    "fn": "Corteza visual por encima del surco calcarino: campo visual inferior.",
    "clin": "Cuadrantanopsia inferior contralateral.",
    "supply": "PCA"
  },
  "Frontal Orbital Cortex": {
    "fn": "Recompensa, conducta social y toma de decisiones.",
    "clin": "Desinhibición e impulsividad (Phineas Gage).",
    "supply": "ACA / MCA"
  },
  "Parahippocampal Gyrus anterior division": {
    "fn": "Corteza entorrinal: puerta de entrada al hipocampo.",
    "clin": "Primera área afectada por los ovillos neurofibrilares en la enfermedad de Alzheimer.",
    "supply": "PCA"
  },
  "Parahippocampal Gyrus posterior division": {
    "fn": "Reconocimiento de lugares y escenas.",
    "clin": "Desorientación topográfica.",
    "supply": "PCA"
  },
  "Lingual Gyrus": {
    "fn": "Corteza visual por debajo del surco calcarino: campo visual superior y color.",
    "clin": "Cuadrantanopsia superior contralateral; acromatopsia.",
    "supply": "PCA"
  },
  "Temporal Fusiform Cortex anterior division": {
    "fn": "Conocimiento semántico y de los objetos.",
    "clin": "Déficits semánticos.",
    "supply": "PCA"
  },
  "Temporal Fusiform Cortex posterior division": {
    "fn": "Área fusiforme de los rostros (especialmente en el hemisferio derecho).",
    "clin": "Prosopagnosia: incapacidad para reconocer rostros.",
    "supply": "PCA"
  },
  "Temporal Occipital Fusiform Cortex": {
    "fn": "Rostros (hemisferio derecho) y área visual de la forma de las palabras (hemisferio izquierdo).",
    "clin": "Alexia pura en el hemisferio izquierdo; prosopagnosia en el derecho.",
    "supply": "PCA"
  },
  "Occipital Fusiform Gyrus": {
    "fn": "Color y procesamiento temprano de los objetos.",
    "clin": "Acromatopsia.",
    "supply": "PCA"
  },
  "Frontal Operculum Cortex": {
    "fn": "Control motor del habla y gusto.",
    "clin": "Alteraciones de la producción del habla en el hemisferio izquierdo.",
    "supply": "MCA"
  },
  "Central Opercular Cortex": {
    "fn": "Áreas sensoriomotoras de la cara, la lengua y la garganta; deglución.",
    "clin": "Lesión bilateral: síndrome de Foix-Chavany-Marie (imposibilidad de mover la cara de forma voluntaria).",
    "supply": "MCA"
  },
  "Parietal Operculum Cortex": {
    "fn": "Corteza somatosensorial secundaria (S2): tacto procedente de ambos lados del cuerpo y dolor.",
    "clin": "Alteración de la percepción del dolor.",
    "supply": "MCA"
  },
  "Planum Polare": {
    "fn": "Corteza de asociación auditiva para la melodía y el tono.",
    "clin": "Amusia.",
    "supply": "MCA"
  },
  "Heschl's Gyrus (includes H1 and H2)": {
    "fn": "Corteza auditiva primaria (A1), organizada según la frecuencia del sonido.",
    "clin": "La lesión unilateral es sutil; la bilateral causa sordera cortical.",
    "supply": "MCA"
  },
  "Planum Temporale": {
    "fn": "Mayor en el hemisferio izquierdo; procesa los sonidos del habla y la audición espacial.",
    "clin": "Parte de la región de Wernicke.",
    "supply": "MCA"
  },
  "Supracalcarine Cortex": {
    "fn": "Corteza visual situada justo por encima del surco calcarino.",
    "clin": "Defectos del campo visual inferior.",
    "supply": "PCA"
  },
  "Occipital Pole": {
    "fn": "Visión central (macular); la mayor extensión de V1 por grado de campo visual.",
    "clin": "Escotoma central.",
    "supply": "PCA / MCA watershed"
  },
  "Lateral ventricle": {
    "fn": "Cavidad rellena de LCR; el plexo coroideo que contiene produce unos 500 mL de LCR al día.",
    "clin": "Se dilata en la hidrocefalia o en la atrofia.",
    "supply": "Choroidal arteries"
  },
  "Thalamus": {
    "fn": "Relevo y puerta de entrada de casi toda la información sensitiva hacia la corteza, además de vigilancia y atención.",
    "clin": "Pérdida sensitiva contralateral; síndrome doloroso talámico (Dejerine-Roussy).",
    "supply": "PCA perforators"
  },
  "Caudate": {
    "fn": "Aprendizaje, hábitos y acción dirigida a metas (ganglios basales).",
    "clin": "Se atrofia precozmente en la enfermedad de Huntington.",
    "supply": "MCA lenticulostriates, ACA (Heubner)"
  },
  "Putamen": {
    "fn": "Aprendizaje motor y selección del movimiento (ganglios basales).",
    "clin": "Localización más frecuente de la hemorragia hipertensiva.",
    "supply": "MCA lenticulostriates"
  },
  "Globus pallidus": {
    "fn": "Principal salida de los ganglios basales; rico en hierro.",
    "clin": "El GPi es diana de estimulación cerebral profunda en la distonía y en la enfermedad de Parkinson.",
    "supply": "Anterior choroidal artery"
  },
  "Hippocampus": {
    "fn": "Formación de nuevos recuerdos a largo plazo y cartografía del espacio.",
    "clin": "La pérdida bilateral causa amnesia anterógrada densa (paciente H.M.).",
    "supply": "PCA, anterior choroidal"
  },
  "Amygdala": {
    "fn": "Detección de amenazas y marcación emocional de los recuerdos.",
    "clin": "La lesión bilateral elimina el miedo (enfermedad de Urbach-Wiethe).",
    "supply": "Anterior choroidal artery"
  },
  "Nucleus accumbens": {
    "fn": "Recompensa, motivación y adicción.",
    "clin": "Diana de estimulación cerebral profunda estudiada en la depresión y en la adicción.",
    "supply": "ACA / MCA perforators"
  },
  "Brainstem": {
    "fn": "Respiración, frecuencia cardíaca, conciencia (formación reticular), nervios craneales y todas las vías largas.",
    "clin": "Las lesiones pequeñas producen signos cruzados: parálisis de un nervio craneal en un lado y debilidad en el lado opuesto.",
    "supply": "Vertebrobasilar system"
  },
  "Cerebellar hemisphere": {
    "fn": "Coordinación y cronometría del movimiento de las extremidades, en el mismo lado del cuerpo.",
    "clin": "Ataxia ipsilateral, temblor intencional y disdiadococinesia.",
    "supply": "SCA, AICA, PICA"
  },
  "Vermis": {
    "fn": "Equilibrio, postura y movimientos oculares.",
    "clin": "Ataxia de tronco: marcha inestable de base amplia (alcohol).",
    "supply": "SCA, PICA"
  },
  "Third ventricle": {
    "fn": "Cavidad de LCR en la línea media, entre los dos tálamos.",
    "clin": "Los quistes coloideos en esta localización pueden bloquear bruscamente el flujo de LCR.",
    "supply": "—"
  },
  "Fourth ventricle": {
    "fn": "Cavidad de LCR entre el tronco del encéfalo y el cerebelo, que drena al espacio subaracnoideo.",
    "clin": "Los tumores de la fosa posterior pueden obstruirla.",
    "supply": "—"
  }
};

const GROUP_COLORS = window.GROUP_COLORS = {
  "Frontal lobe": [
    0.88,
    0.48,
    0.37
  ],
  "Parietal lobe": [
    0.87,
    0.72,
    0.37
  ],
  "Temporal lobe": [
    0.55,
    0.72,
    0.42
  ],
  "Occipital lobe": [
    0.42,
    0.64,
    0.86
  ],
  "Limbic lobe": [
    0.75,
    0.52,
    0.79
  ],
  "Insula & operculum": [
    0.31,
    0.7,
    0.66
  ],
  "Deep grey matter": [
    0.85,
    0.79,
    0.64
  ],
  "Ventricles": [
    0.4,
    0.78,
    0.88
  ],
  "Cerebellum": [
    0.84,
    0.48,
    0.62
  ],
  "Brainstem": [
    0.6,
    0.65,
    0.72
  ]
};

const GROUP_ORDER = window.GROUP_ORDER = [
  "Frontal lobe",
  "Parietal lobe",
  "Temporal lobe",
  "Occipital lobe",
  "Limbic lobe",
  "Insula & operculum",
  "Deep grey matter",
  "Ventricles",
  "Cerebellum",
  "Brainstem"
];

const SOMATO = window.SOMATO = [
  [
    "toes",
    6,
    -25,
    72
  ],
  [
    "foot",
    9,
    -26,
    72
  ],
  [
    "leg",
    14,
    -24,
    74
  ],
  [
    "hip",
    20,
    -22,
    72
  ],
  [
    "trunk",
    24,
    -21,
    70
  ],
  [
    "shoulder",
    29,
    -20,
    67
  ],
  [
    "arm",
    33,
    -20,
    63
  ],
  [
    "hand",
    37,
    -20,
    58
  ],
  [
    "fingers",
    40,
    -18,
    53
  ],
  [
    "thumb",
    45,
    -14,
    47
  ],
  [
    "neck",
    49,
    -11,
    42
  ],
  [
    "face",
    53,
    -8,
    34
  ],
  [
    "lips",
    57,
    -6,
    26
  ],
  [
    "tongue",
    59,
    -4,
    18
  ],
  [
    "throat",
    61,
    -2,
    10
  ]
];

const PART_LABEL = window.PART_LABEL = {
  "toes": "dedos de los pies",
  "foot": "pie",
  "leg": "pierna",
  "hip": "cadera",
  "trunk": "tronco",
  "shoulder": "hombro",
  "arm": "brazo",
  "hand": "mano",
  "fingers": "dedos",
  "thumb": "pulgar",
  "neck": "cuello",
  "face": "cara",
  "lips": "labios",
  "tongue": "lengua",
  "throat": "garganta"
};

window.stimEffect = function stimEffect(region, p){
  // region: {name, hemi, group}; p: MNI point. Returns {kind, part, side, title, text, ref}
  const side = region.hemi === 'L' ? 'right' : region.hemi === 'R' ? 'left' : 'both';
  const nm = region.name;
  const ART = {'toes':'los dedos de los pies','foot':'el pie','leg':'la pierna','hip':'la cadera','trunk':'el tronco','shoulder':'el hombro','arm':'el brazo','hand':'la mano','fingers':'los dedos','thumb':'el pulgar','neck':'el cuello','face':'la cara','lips':'los labios','tongue':'la lengua','throat':'la garganta'};
  const art = part => ART[part] || PART_LABEL[part] || part;
  const deArt = part => { const a = art(part); return a.startsWith('el ') ? 'del ' + a.slice(3) : 'de ' + a; };
  const lado = side === 'right' ? 'derecho' : side === 'left' ? 'izquierdo' : 'bilateral';
  const hacia = side === 'right' ? 'la derecha' : side === 'left' ? 'la izquierda' : 'ambos lados';
  const enLado = side === 'both' ? 'de ambos lados' : 'del lado ' + lado;
  const nearestPart = (dy) => { let best = null, bd = 1e9; for (const s of SOMATO){ const d = Math.hypot(Math.abs(p[0]) - s[1], p[1] - (s[2] + dy), p[2] - s[3]); if (d < bd){ bd = d; best = s[0]; } } return best; };
  const isL = region.hemi === 'L';
  if (nm === 'Precentral Gyrus'){ const part = nearestPart(0); return {kind:'move', part, side, title:(part === 'tongue' || part === 'face' || part === 'throat') ? `Contracción ${deArt(part)} en el lado ${lado}` : `Contracción ${deArt(part)} ${enLado}`, text:`Corteza motora primaria. La estimulación de este punto del homúnculo motor provoca la contracción ${deArt(part)} ${enLado}; el mapa corporal va desde los dedos de los pies en la línea media hasta la cara y la lengua junto a la cisura de Silvio.`}; }
  if (nm === 'Postcentral Gyrus'){ const part = nearestPart(-9); return {kind:'feel', part, side, title:`Hormigueo ${deArt(part)} ${enLado}`, text:`Corteza somatosensorial primaria. Los pacientes refieren hormigueo, adormecimiento o sensación de movimiento en ${art(part)} ${enLado}, y rara vez dolor.`}; }
  if (nm.startsWith('Supplementary Motor')) return {kind:'move', part:'posture', side:'both', title:'Se elevan ambos brazos y la cabeza gira', text:'Área motora suplementaria. La estimulación produce posturas complejas —el brazo opuesto elevado, la cabeza y los ojos girados (postura «de esgrima»)— o un impulso de moverse y, a veces, detención del habla.'};
  if (nm === 'Middle Frontal Gyrus' && p[1] < 8) return {kind:'eyes', part:'eyes', side, title:`Los ojos giran hacia ${hacia}`, text:'Campo ocular frontal. La estimulación desvía los ojos (y a menudo la cabeza) hacia el lado contralateral.'};
  if (nm.startsWith('Inferior Frontal Gyrus') && isL) return {kind:'speech', part:'mouth', side:'both', title:'Detención del habla', text:'Área de Broca en el hemisferio dominante. El paciente que cuenta en voz alta se detiene de forma brusca, aunque puede seguir moviendo la boca; así cartografían los cirujanos el lenguaje antes de la resección.'};
  if ((nm === 'Superior Temporal Gyrus posterior division' || nm === 'Supramarginal Gyrus anterior division' || nm === 'Supramarginal Gyrus posterior division' || nm === 'Planum Temporale') && isL) return {kind:'speech', part:'mouth', side:'both', title:'Falla la comprensión y la denominación', text:'Área del lenguaje posterior (región de Wernicke). La estimulación hace que el paciente denomine mal los objetos o emita palabras erróneas (parafasias), aunque siga hablando con fluidez.'};
  if (nm.startsWith("Heschl") || nm === 'Planum Polare' || (nm === 'Planum Temporale')) return {kind:'hear', part:'ears', side, title:'Un zumbido o un pitido', text:'Corteza auditiva. Los pacientes oyen sonidos simples —zumbidos, pitidos, un murmullo— que suelen percibir en el oído contralateral.'};
  if (['Intracalcarine Cortex','Supracalcarine Cortex','Cuneal Cortex','Occipital Pole','Lingual Gyrus','Lateral Occipital Cortex superior division','Lateral Occipital Cortex inferior division','Occipital Fusiform Gyrus'].includes(nm)){
    const upper = (nm === 'Lingual Gyrus' || nm === 'Occipital Fusiform Gyrus' || nm.includes('inferior') || (nm === 'Intracalcarine Cortex' && p[2] < 2));
    const central = nm === 'Occipital Pole';
    const campoLado = side === 'both' ? 'de ambos lados' : lado;
    return {kind:'see', part:'eyes', side, field:{side, upper, central}, title:`Destellos de luz en el campo visual ${campoLado}`, text:`Corteza visual. La estimulación produce fosfenos —puntos o destellos de luz— en ${central ? 'el centro del' : (upper ? 'la mitad superior del' : 'la mitad inferior del')} campo visual ${campoLado}, contralateral al lado estimulado${upper ? ' (la corteza situada por debajo de la cisura calcarina representa el campo superior)' : ''}.`};
  }
  if ((nm === 'Temporal Fusiform Cortex posterior division' || nm === 'Temporal Occipital Fusiform Cortex') && !isL) return {kind:'see', part:'face', side:'both', field:{side:'both', face:true}, title:'Las caras se ven distorsionadas', text:'Área fusiforme de las caras. La estimulación hace que una cara situada frente al paciente parezca deformarse o fundirse, mientras los demás objetos se ven normales (Parvizi et al., 2012).'};
  if (nm === 'Insular Cortex') return {kind:'gut', part:'trunk', side:'both', title:'Una oleada de náusea o un sabor extraño', text:'Ínsula. La estimulación evoca sensaciones viscerales: una sensación ascendente en el estómago, náuseas, un sabor desagradable, calor u opresión en la garganta.'};
  if (nm === 'Central Opercular Cortex' || nm === 'Frontal Operculum Cortex') return {kind:'move', part:'tongue', side, title:'Movimientos de lengua y garganta, salivación', text:'Corteza opercular. La estimulación produce deglución, lamido o masticación, salivación u hormigueo en la lengua.'};
  if (nm === 'Parietal Operculum Cortex') return {kind:'feel', part:'trunk', side:'both', title:'Hormigueo bilateral', text:'Corteza somatosensorial secundaria (S2). Las sensaciones pueden percibirse en ambos lados del cuerpo, a veces con carácter doloroso o térmico.'};
  if (nm === 'Angular Gyrus' && !isL) return {kind:'self', part:'body', side:'both', title:'Una experiencia extracorporal', text:'Circunvolución angular derecha / unión temporoparietal. En una paciente descrita, la estimulación le hizo sentir que flotaba cerca del techo y se veía desde arriba (Blanke et al., 2002).'};
  if (nm === 'Angular Gyrus') return {kind:'speech', part:'mouth', side:'both', title:'Errores de lectura y denominación', text:'Circunvolución angular izquierda. La estimulación altera la lectura, la escritura y el cálculo.'};
  if (['Temporal Pole','Superior Temporal Gyrus anterior division','Middle Temporal Gyrus anterior division','Middle Temporal Gyrus posterior division','Inferior Temporal Gyrus anterior division','Superior Temporal Gyrus posterior division'].includes(nm)) return {kind:'memory', part:'head', side:'both', title:'Un recuerdo vívido o déjà vu', text:'Corteza temporal lateral. Algunos pacientes de Penfield revivían escenas —música, una voz, un lugar conocido— o sentían un déjà vu intenso.'};
  if (nm.startsWith('Parahippocampal') || nm === 'Hippocampus') return {kind:'memory', part:'head', side:'both', title:'Déjà vu, estado de ensueño', text:'Lóbulo temporal mesial. La estimulación produce déjà vu, estados de ensueño o reviviscencia de recuerdos, muy parecido al aura de la epilepsia temporal.'};
  if (nm === 'Amygdala') return {kind:'emotion', part:'face', side:'both', title:'Miedo súbito y sensación epigástrica ascendente', text:'Amígdala. La estimulación puede desencadenar miedo, ansiedad y una sensación ascendente en el epigastrio, a veces con expresión de temor.'};
  if (nm.startsWith('Cingulate Gyrus anterior')) return {kind:'emotion', part:'body', side:'both', title:'Un impulso de seguir adelante', text:'Cíngulo anterior. Los pacientes describen un impulso o una determinación para superar una dificultad, con aumento de la frecuencia cardíaca (Parvizi et al., 2013).'};
  if (nm === 'Subcallosal Cortex') return {kind:'emotion', part:'face', side:'both', title:'El ánimo se eleva', text:'Cíngulo subgenual (área 25). La estimulación cerebral profunda crónica en esta diana se ha ensayado en la depresión resistente al tratamiento.'};
  if (nm === 'Thalamus') return {kind:'feel', part:'hand', side, title:`Hormigueo en el hemicuerpo ${side === 'both' ? 'de ambos lados' : lado}`, text:'Tálamo (núcleos de relevo sensitivo). La estimulación causa hormigueo en el lado contralateral. El núcleo ventral intermedio es la diana de estimulación cerebral profunda para el temblor esencial.'};
  if (nm === 'Globus pallidus' || nm === 'Putamen' || nm === 'Caudate') return {kind:'quiet', part:'hand', side, title:'El temblor y la rigidez disminuyen', text:'Ganglios basales. La estimulación de estos circuitos no produce ninguna sensación, pero la estimulación crónica del globo pálido interno (o del núcleo subtalámico vecino) alivia el temblor parkinsoniano, la rigidez y las discinesias.'};
  if (nm === 'Nucleus accumbens') return {kind:'emotion', part:'face', side:'both', title:'Una sonrisa espontánea', text:'Núcleo accumbens. La estimulación puede producir placer o una sonrisa; se ha estudiado como diana de estimulación cerebral profunda en la depresión y la adicción.'};
  if (region.group === 'Cerebellum') return {kind:'quiet', part:'none', side:'both', title:'Sin respuesta consciente', text:'Cerebelo. La estimulación eléctrica no produce ninguna sensación ni movimiento que el paciente perciba: su función es coordinar el movimiento, no iniciarlo.'};
  if (nm === 'Brainstem') return {kind:'quiet', part:'none', side:'both', title:'No se estimula', text:'Tronco del encéfalo. Nunca se estimula en la cartografía con el paciente despierto: controla la respiración, la frecuencia cardíaca y la conciencia.'};
  if (region.group === 'Ventricles') return {kind:'quiet', part:'none', side:'both', title:'Espacio de LCR: nada que estimular', text:'Es líquido, no neuronas.'};
  return {kind:'quiet', part:'none', side:'both', title:'Sin respuesta evidente', text:`${nm}. Gran parte de la corteza prefrontal y de asociación es «silenciosa» a la estimulación: no ocurre nada visible, aunque una exploración cuidadosa puede revelar efectos sutiles sobre la atención, el ánimo o la toma de decisiones.`};
};

window.cap = function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); };
