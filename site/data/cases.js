const CASES = window.CASES = [
  {
    "id": 1,
    "mod": "ct",
    "sub": "ctb",
    "subs": [
      "ctb",
      "cta"
    ],
    "state": "stroke",
    "find": true,
    "lvl": "Básico",
    "hx": "Mujer de 72 años. Debilidad súbita de la extremidad superior derecha y de la cara, junto con dificultad para encontrar las palabras. Última vez vista en estado normal hace 2 horas.",
    "dx": [
      "Ictus isquémico agudo en territorio de la arteria cerebral media izquierda",
      "Hemorragia intracerebral",
      "Glioma frontal izquierdo",
      "Encefalitis por virus herpes simple"
    ],
    "report": "TC sin contraste: pérdida de la diferenciación entre sustancia gris y sustancia blanca en la ínsula y el núcleo lentiforme izquierdos, con borramiento de los surcos y una arteria cerebral media izquierda hiperdensa. Sin hemorragia. Angio-TC: oclusión del segmento M1 izquierdo.",
    "teach": [
      "Los signos precoces de infarto en la TC son sutiles: pérdida de la cinta insular, núcleo lentiforme mal definido, borramiento de los surcos y una arteria hiperdensa (el coágulo).",
      "La primera función de la TC es descartar sangrado, lo que contraindica la trombólisis.",
      "La angio-TC busca una oclusión de gran vaso susceptible de extracción mediante trombectomía."
    ]
  },
  {
    "id": 2,
    "mod": "ct",
    "sub": "ctb",
    "subs": [
      "ctb",
      "cta"
    ],
    "state": "ich",
    "find": true,
    "lvl": "Básico",
    "hx": "Varón de 64 años con hipertensión arterial mal controlada. Debilidad súbita del hemicuerpo izquierdo y cefalea mientras trabajaba en el jardín; en la actualidad somnoliento.",
    "dx": [
      "Hemorragia intracerebral en el putamen derecho",
      "Ictus isquémico agudo",
      "Glioblastoma",
      "Meningioma calcificado"
    ],
    "report": "TC sin contraste: hematoma hiperdenso de 4 cm (≈ 70 HU) centrado en el putamen derecho, con una fina corona de edema y leve efecto de masa. Angio-TC: foco puntiforme de contraste en el interior del coágulo (signo del punto).",
    "teach": [
      "La sangre fresca es hiperdensa en la TC (60–80 HU) porque los hematíes empaquetados absorben los rayos X.",
      "Las hemorragias hipertensivas afectan de forma preferente al putamen, el tálamo, la protuberancia y el cerebelo.",
      "La presencia del signo del punto en la angio-TC predice el crecimiento del hematoma."
    ]
  },
  {
    "id": 3,
    "mod": "ct",
    "sub": "ctb",
    "subs": [
      "ctb",
      "cta",
      "flair"
    ],
    "state": "sah",
    "find": true,
    "lvl": "Básico",
    "hx": "Mujer de 45 años. La cefalea más intensa de su vida, máxima en menos de un minuto, mientras levantaba una caja. Vomitó; rigidez de nuca.",
    "dx": [
      "Hemorragia subaracnoidea por rotura de aneurisma",
      "Migraña",
      "Meningitis bacteriana",
      "Hematoma subdural agudo"
    ],
    "report": "TC sin contraste: sangre hiperdensa en la cisterna supraselar y en ambas cisuras silvianas; dilatación precoz de las astas temporales. Angio-TC: aneurisma de la arteria comunicante anterior.",
    "teach": [
      "La TC realizada dentro de las primeras 6 horas desde el inicio detecta casi todas las hemorragias subaracnoideas aneurismáticas; pasado ese plazo la sensibilidad disminuye y se recurre a la punción lumbar.",
      "La sangre en las cisternas basales con un patrón en estrella sugiere un aneurisma del polígono de Willis.",
      "Vigilar la hidrocefalia precoz y el vasoespasmo entre los días 4 y 14."
    ]
  },
  {
    "id": 4,
    "mod": "ct",
    "sub": "ctb",
    "subs": [
      "ctb",
      "flair"
    ],
    "state": "sdh",
    "find": true,
    "lvl": "Básico",
    "hx": "Varón de 81 años en tratamiento anticoagulante. Sufrió una caída en su domicilio hace dos días; en la actualidad presenta confusión y somnolencia crecientes.",
    "dx": [
      "Hematoma subdural agudo",
      "Hematoma extradural (epidural)",
      "Hemorragia subaracnoidea",
      "Atrofia normal relacionada con la edad"
    ],
    "report": "TC sin contraste: colección hiperdensa en forma de medialuna sobre la convexidad izquierda que cruza la sutura coronal y borra los surcos subyacentes.",
    "teach": [
      "La sangre subdural se extiende por la convexidad en forma de medialuna y cruza las suturas, pero no la hoz del cerebro.",
      "La sangre extradural tiene forma de lente y se detiene en las suturas.",
      "Con la edad el cerebro se atrofia y estira las venas puente; los anticoagulantes hacen que pequeños desgarros sangren."
    ]
  },
  {
    "id": 5,
    "mod": "ct",
    "sub": "ctb",
    "subs": [
      "ctb",
      "ctbone"
    ],
    "state": "edh",
    "find": true,
    "lvl": "Básico",
    "hx": "Varón de 19 años que recibió el impacto de una pelota de críquet en el lado izquierdo de la cabeza. Pérdida de conciencia breve y posteriormente habla con normalidad. Tres horas más tarde: cefalea intensa y vómitos.",
    "dx": [
      "Hematoma extradural con fractura del hueso temporal",
      "Hematoma subdural agudo",
      "Contusión cerebral",
      "Hemorragia subaracnoidea"
    ],
    "report": "TC sin contraste: colección hiperdensa biconvexa sobre el lóbulo temporal izquierdo, delimitada por las suturas, por debajo de una tumefacción del cuero cabelludo. Ventana ósea: fractura lineal de la escama temporal izquierda.",
    "teach": [
      "El relato clásico consiste en un intervalo lúcido seguido de un deterioro rápido.",
      "La fractura desgarra la arteria meníngea media; la presión arterial despega la duramadre del cráneo.",
      "Se trata de una urgencia neuroquirúrgica: la evacuación suele salvar la vida."
    ]
  },
  {
    "id": 6,
    "mod": "mri",
    "sub": "t1gd",
    "subs": [
      "t1gd",
      "flair",
      "dwi"
    ],
    "state": "gbm",
    "find": true,
    "lvl": "Básico",
    "hx": "Varón de 58 años. Seis semanas de cambios de personalidad y cefaleas matutinas; una crisis convulsiva generalizada.",
    "dx": [
      "Glioblastoma",
      "Absceso piógeno",
      "Metástasis única",
      "Desmielinización tumefactiva"
    ],
    "report": "RM: masa frontal derecha con realce anular grueso e irregular en torno a un centro necrótico. Señal FLAIR extensa que se disemina por la sustancia blanca. El centro necrótico no restringe la difusión.",
    "teach": [
      "El realce anular grueso y nodular con necrosis es típico del glioma de alto grado.",
      "Las células tumorales infiltran más allá del borde que realza, siguiendo los tractos de sustancia blanca.",
      "El pus restringe la difusión, pero la necrosis tumoral no: la DWI distingue el absceso del glioma."
    ]
  },
  {
    "id": 7,
    "mod": "mri",
    "sub": "dwi",
    "subs": [
      "dwi",
      "t1gd"
    ],
    "state": "abscess",
    "find": true,
    "lvl": "Básico",
    "hx": "Paciente de 34 años con una infección dental reciente. Diez días de cefalea y fiebre; en la actualidad torpeza con la mano derecha.",
    "dx": [
      "Absceso cerebral piógeno",
      "Glioblastoma",
      "Metástasis",
      "Infarto agudo"
    ],
    "report": "RM: lesión parietal izquierda con realce anular y pared fina y regular, más delgada en la vertiente ventricular. El centro restringe intensamente la difusión.",
    "teach": [
      "Un anillo fino y regular, más delgado en la vertiente que mira hacia el ventrículo, orienta hacia absceso.",
      "Centro hiperintenso en DWI = pus viscoso. Es la prueba clave frente al tumor necrótico.",
      "La espectroscopia puede mostrar aminoácidos, acetato y succinato procedentes del metabolismo bacteriano."
    ]
  },
  {
    "id": 8,
    "mod": "mri",
    "sub": "t1gd",
    "subs": [
      "t1gd",
      "flair"
    ],
    "state": "mets",
    "find": true,
    "lvl": "Básico",
    "hx": "Paciente de 61 años, fumador, con pérdida de peso y una masa pulmonar. Inestabilidad de aparición reciente y cefalea.",
    "dx": [
      "Metástasis cerebrales",
      "Esclerosis múltiple",
      "Émbolos sépticos",
      "Glioblastoma multifocal"
    ],
    "report": "RM con contraste: tres lesiones pequeñas con realce anular y nodular en la unión sustancia gris–sustancia blanca, cada una con edema desproporcionado respecto a su tamaño.",
    "teach": [
      "Las metástasis se alojan en la unión sustancia gris–sustancia blanca, donde los vasos se estrechan.",
      "La RM con contraste detecta muchas más lesiones que la TC, lo que modifica el tratamiento.",
      "Cuéntelas: un número reducido de lesiones puede tratarse con radiocirugía."
    ]
  },
  {
    "id": 9,
    "mod": "mri",
    "sub": "flair",
    "subs": [
      "flair",
      "t2",
      "t1gd"
    ],
    "state": "ms",
    "find": true,
    "lvl": "Básico",
    "hx": "Mujer de 27 años. El año pasado presentó visión borrosa dolorosa en el ojo derecho, que se recuperó; ahora refiere parestesias en ambas piernas.",
    "dx": [
      "Esclerosis múltiple",
      "Enfermedad isquémica de pequeño vaso",
      "Lesiones de sustancia blanca asociadas a migraña",
      "Neurosarcoidosis"
    ],
    "report": "RM: múltiples lesiones ovoideas hiperintensas en FLAIR alrededor de los ventrículos laterales, orientadas perpendicularmente a ellos, junto con lesiones yuxtacorticales. Una lesión realza tras la administración de gadolinio; las demás no.",
    "teach": [
      "Son típicas las lesiones ovoideas periventriculares orientadas radialmente, alejándose de los ventrículos (dedos de Dawson).",
      "La coexistencia de lesiones con y sin realce demuestra diseminación en el tiempo en una única exploración (criterios de McDonald).",
      "La RM medular y las bandas oligoclonales en el líquido cefalorraquídeo apoyan el diagnóstico."
    ]
  },
  {
    "id": 10,
    "mod": "ct",
    "sub": "ctb",
    "subs": [
      "ctb",
      "t2",
      "flair"
    ],
    "state": "hydro",
    "find": true,
    "lvl": "Básico",
    "hx": "Paciente de 22 años con tres semanas de cefalea matutina y vómitos de intensidad creciente. Papiledema en la exploración.",
    "dx": [
      "Hidrocefalia obstructiva (estenosis del acueducto)",
      "Hidrocefalia normotensiva",
      "Atrofia cerebral",
      "Hipertensión intracraneal idiopática"
    ],
    "report": "TC: dilatación de los ventrículos laterales y del tercer ventrículo, con astas frontales redondeadas y borramiento de los surcos; el cuarto ventrículo es de tamaño normal. RM FLAIR: hiperintensidad periventricular por flujo transependimario.",
    "teach": [
      "La dilatación de los ventrículos laterales y del tercer ventrículo con un cuarto ventrículo normal orienta a un bloqueo a nivel del acueducto cerebral.",
      "En la hidrocefalia los surcos están comprimidos; en la atrofia están amplios.",
      "El flujo transependimario de líquido cefalorraquídeo indica que la presión está elevada de forma aguda."
    ]
  },
  {
    "id": 11,
    "mod": "pet",
    "sub": "fdg",
    "subs": [
      "fdg",
      "t1",
      "amy"
    ],
    "state": "ad",
    "find": true,
    "lvl": "Avanzado",
    "hx": "Profesora jubilada de 74 años. Dos años de deterioro progresivo de la memoria; ahora se desorienta al conducir a lugares conocidos.",
    "dx": [
      "Enfermedad de Alzheimer",
      "Demencia frontotemporal",
      "Demencia por cuerpos de Lewy",
      "Demencia vascular"
    ],
    "report": "FDG-PET: hipometabolismo temporoparietal bilateral y del cíngulo posterior, con preservación de la corteza sensitivomotora y visual. RM: atrofia hipocámpica bilateral. PET de amiloide: positivo.",
    "teach": [
      "Enfermedad de Alzheimer: hipometabolismo temporoparietal y del cíngulo posterior.",
      "La demencia frontotemporal afecta a los lóbulos frontal y temporal anterior; la demencia por cuerpos de Lewy añade hipometabolismo occipital con preservación del cíngulo posterior («signo de la isla»).",
      "El PET de amiloide confirma la patología, lo que resulta relevante para los tratamientos antiamiloide."
    ]
  },
  {
    "id": 12,
    "mod": "mri",
    "sub": "flair",
    "subs": [
      "flair",
      "t2",
      "fdg"
    ],
    "state": "tle",
    "find": true,
    "lvl": "Avanzado",
    "hx": "Paciente de 23 años con crisis epilépticas desde los 12 años, que comienzan con una sensación ascendente en el epigastrio y continúan con automatismos orales (chasquido de labios). Antecedente de convulsiones febriles en la primera infancia.",
    "dx": [
      "Esclerosis mesial temporal izquierda",
      "Glioma de bajo grado",
      "Encefalitis por virus del herpes simple",
      "Displasia cortical focal"
    ],
    "report": "RM: hipocampo izquierdo pequeño, con hiperintensidad en T2/FLAIR y pérdida de su arquitectura interna. FDG-PET: hipometabolismo interictal del lóbulo temporal izquierdo.",
    "teach": [
      "Esclerosis hipocámpica: pérdida de volumen, hiperintensidad en T2 y pérdida de la estructura interna, que se valora mejor en cortes coronales finos.",
      "El FDG-PET interictal muestra el foco «frío»; el SPECT ictal lo muestra «caliente».",
      "La concordancia entre RM, EEG y PET convierte a esta paciente en una buena candidata a cirugía."
    ]
  },
  {
    "id": 13,
    "mod": "spect",
    "sub": "dat",
    "subs": [
      "dat"
    ],
    "state": "pd",
    "find": true,
    "lvl": "Avanzado",
    "hx": "Paciente de 66 años con temblor de reposo en la mano derecha y lentitud de un año de evolución. ¿Enfermedad de Parkinson o temblor esencial?",
    "dx": [
      "Pérdida dopaminérgica presináptica (síndrome parkinsoniano)",
      "Temblor esencial (exploración normal)",
      "Parkinsonismo farmacológico",
      "Envejecimiento normal"
    ],
    "report": "DaTscan: captación reducida en el putamen izquierdo, más marcada en su porción posterior, lo que configura un «punto final» en lugar de una «coma». Reducción leve en el lado derecho.",
    "teach": [
      "La pérdida de captación comienza en el putamen posterior, contralateral al lado de los síntomas.",
      "La exploración es normal en el temblor esencial y en el parkinsonismo farmacológico.",
      "No permite distinguir la enfermedad de Parkinson de los síndromes parkinsonianos atípicos."
    ]
  },
  {
    "id": 14,
    "mod": "mri",
    "sub": "t2",
    "subs": [
      "t2",
      "t1gd",
      "mra"
    ],
    "state": "avm",
    "find": true,
    "lvl": "Avanzado",
    "hx": "Paciente de 29 años con una primera crisis epiléptica y cefaleas ocasionales.",
    "dx": [
      "Malformación arteriovenosa",
      "Malformación cavernosa",
      "Glioblastoma",
      "Aneurisma gigante"
    ],
    "report": "RM: conglomerado parietal derecho de vacíos de flujo serpiginosos, con vasos que realzan y una vena de drenaje dilatada. ARM: nido con arterias aferentes y drenaje venoso precoz.",
    "teach": [
      "Los vacíos de flujo se ven negros porque la sangre circula a gran velocidad y abandona el corte antes de poder ser representada.",
      "Las arterias se conectan directamente con las venas a través de un nido, sin capilares interpuestos.",
      "La angiografía por catéter (ASD, angiografía por sustracción digital) es el patrón de referencia para planificar el tratamiento."
    ]
  },
  {
    "id": 15,
    "mod": "spect",
    "sub": "hmpao",
    "subs": [
      "hmpao",
      "cta"
    ],
    "state": "bd",
    "find": false,
    "lvl": "Avanzado",
    "hx": "Paciente adulto en cuidados intensivos tras una parada cardiorrespiratoria. Las pruebas clínicas de muerte encefálica se han completado; se solicita un estudio complementario de perfusión.",
    "dx": [
      "Ausencia de perfusión cerebral, compatible con muerte encefálica",
      "Perfusión cerebral normal",
      "Perfusión difusamente disminuida por sedación",
      "Inyección fallida del trazador"
    ],
    "report": "SPECT con HMPAO: ausencia de captación del trazador en los hemisferios cerebrales, el cerebelo y el tronco del encéfalo («cráneo hueco»); se observa actividad en el cuero cabelludo, lo que confirma que la inyección fue correcta. Angio-TC: ausencia de opacificación arterial intracraneal.",
    "teach": [
      "La muerte encefálica es un diagnóstico clínico; las técnicas de imagen constituyen una prueba complementaria cuando no es posible completar la exploración.",
      "La captación en el cuero cabelludo demuestra que el trazador se administró correctamente.",
      "La sedación reduce el flujo, pero nunca lo suprime por completo."
    ]
  }
];
