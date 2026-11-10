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
    "lvl": "Core",
    "hx": "72-year-old woman. Sudden weakness of the right arm and face and difficulty finding words. Last seen well 2 hours ago.",
    "dx": [
      "Acute ischaemic stroke, left MCA territory",
      "Intracerebral haemorrhage",
      "Left frontal glioma",
      "Herpes simplex encephalitis"
    ],
    "report": "Non-contrast CT: loss of grey–white differentiation in the left insula and lentiform nucleus with sulcal effacement, and a hyperdense left MCA. No haemorrhage. CTA: occlusion of the left M1 segment.",
    "teach": [
      "Early CT signs of infarction are subtle: insular ribbon loss, a blurred lentiform nucleus, sulcal effacement and a hyperdense artery (the clot).",
      "CT’s first job is to exclude blood, which rules out thrombolysis.",
      "CT angiography looks for a large-vessel occlusion that can be removed by thrombectomy."
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
    "lvl": "Core",
    "hx": "64-year-old man with poorly controlled hypertension. Sudden left-sided weakness and headache while gardening; now drowsy.",
    "dx": [
      "Intracerebral haemorrhage, right putamen",
      "Acute ischaemic stroke",
      "Glioblastoma",
      "Calcified meningioma"
    ],
    "report": "Non-contrast CT: 4 cm hyperdense (≈ 70 HU) haematoma centred on the right putamen with a thin rim of oedema and mild mass effect. CTA: punctate contrast inside the clot (spot sign).",
    "teach": [
      "Fresh blood is bright on CT (60–80 HU) because packed red cells absorb X-rays.",
      "Hypertensive bleeds favour the putamen, thalamus, pons and cerebellum.",
      "A spot sign on CTA predicts that the haematoma will grow."
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
    "lvl": "Core",
    "hx": "45-year-old woman. The worst headache of her life, maximal within a minute, while lifting a box. Vomited; neck stiff.",
    "dx": [
      "Subarachnoid haemorrhage from a ruptured aneurysm",
      "Migraine",
      "Bacterial meningitis",
      "Acute subdural haematoma"
    ],
    "report": "Non-contrast CT: hyperdense blood in the suprasellar cistern and both sylvian fissures; early dilatation of the temporal horns. CTA: anterior communicating artery aneurysm.",
    "teach": [
      "CT within 6 hours of onset detects nearly all aneurysmal SAH; after that, sensitivity falls and lumbar puncture is used.",
      "Blood in the basal cisterns in a star pattern suggests an aneurysm at the circle of Willis.",
      "Watch for hydrocephalus early and vasospasm between days 4 and 14."
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
    "lvl": "Core",
    "hx": "81-year-old man on an anticoagulant. Fell at home two days ago; now increasingly confused and drowsy.",
    "dx": [
      "Acute subdural haematoma",
      "Extradural (epidural) haematoma",
      "Subarachnoid haemorrhage",
      "Normal age-related atrophy"
    ],
    "report": "Non-contrast CT: crescent-shaped hyperdense collection over the left convexity that crosses the coronal suture, effacing the sulci beneath it.",
    "teach": [
      "Subdural blood spreads along the convexity as a crescent and crosses sutures, but not the midline falx.",
      "Extradural blood is lens-shaped and stops at sutures.",
      "Older brains shrink, stretching the bridging veins; anticoagulants make small tears bleed."
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
    "lvl": "Core",
    "hx": "19-year-old struck on the left side of the head by a cricket ball. Brief loss of consciousness, then talking normally. Three hours later: severe headache and vomiting.",
    "dx": [
      "Extradural haematoma with a temporal bone fracture",
      "Acute subdural haematoma",
      "Cerebral contusion",
      "Subarachnoid haemorrhage"
    ],
    "report": "Non-contrast CT: biconvex hyperdense collection over the left temporal lobe, limited by the sutures, under scalp swelling. Bone window: linear fracture of the left temporal squama.",
    "teach": [
      "The classic story is a lucid interval followed by rapid deterioration.",
      "The fracture tears the middle meningeal artery; arterial pressure strips the dura off the skull.",
      "A neurosurgical emergency: evacuation is often lifesaving."
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
    "lvl": "Core",
    "hx": "58-year-old man. Six weeks of personality change and morning headaches; one generalised seizure.",
    "dx": [
      "Glioblastoma",
      "Pyogenic abscess",
      "Solitary metastasis",
      "Tumefactive demyelination"
    ],
    "report": "MRI: right frontal mass with thick, irregular ring enhancement around a necrotic centre. Extensive FLAIR signal spreading through the white matter. The necrotic centre does not restrict diffusion.",
    "teach": [
      "Thick, nodular ring enhancement with necrosis is typical of high-grade glioma.",
      "Tumour cells infiltrate beyond the enhancing edge along white-matter tracts.",
      "Pus restricts diffusion, but tumour necrosis does not: DWI separates abscess from glioma."
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
    "lvl": "Core",
    "hx": "34-year-old with a recent dental infection. Ten days of headache and fever; now clumsy with the right hand.",
    "dx": [
      "Pyogenic brain abscess",
      "Glioblastoma",
      "Metastasis",
      "Acute infarct"
    ],
    "report": "MRI: left parietal ring-enhancing lesion with a thin, smooth wall that is thinnest on the ventricular side. The centre restricts diffusion strongly.",
    "teach": [
      "A thin, smooth ring, thinner on the side facing the ventricle, favours abscess.",
      "Bright DWI centre = viscous pus. This is the key test against necrotic tumour.",
      "Spectroscopy can show amino acids, acetate and succinate from bacterial metabolism."
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
    "lvl": "Core",
    "hx": "61-year-old smoker with weight loss and a lung mass. New unsteadiness and headache.",
    "dx": [
      "Brain metastases",
      "Multiple sclerosis",
      "Septic emboli",
      "Multifocal glioblastoma"
    ],
    "report": "MRI with contrast: three small ring- and nodular-enhancing lesions at the grey–white junction, each with oedema out of proportion to its size.",
    "teach": [
      "Metastases lodge at the grey–white junction, where vessels narrow.",
      "Contrast MRI finds far more lesions than CT, which changes treatment.",
      "Count them: a few lesions may be treated with radiosurgery."
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
    "lvl": "Core",
    "hx": "27-year-old woman. Painful blurred vision in the right eye last year that recovered; now tingling in both legs.",
    "dx": [
      "Multiple sclerosis",
      "Small-vessel ischaemic disease",
      "Migraine-related white-matter spots",
      "Neurosarcoidosis"
    ],
    "report": "MRI: multiple ovoid FLAIR-bright lesions around the lateral ventricles, oriented perpendicular to them, with juxtacortical lesions. One lesion enhances after gadolinium; the others do not.",
    "teach": [
      "Ovoid periventricular lesions pointing away from the ventricles (Dawson’s fingers) are typical.",
      "Enhancing and non-enhancing lesions together show dissemination in time on a single scan (McDonald criteria).",
      "Spinal MRI and CSF oligoclonal bands support the diagnosis."
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
    "lvl": "Core",
    "hx": "22-year-old with three weeks of worsening morning headaches and vomiting. Papilloedema on examination.",
    "dx": [
      "Obstructive hydrocephalus (aqueduct stenosis)",
      "Normal pressure hydrocephalus",
      "Cerebral atrophy",
      "Idiopathic intracranial hypertension"
    ],
    "report": "CT: dilated lateral and third ventricles with rounded frontal horns and effaced sulci; the fourth ventricle is normal in size. MRI FLAIR: periventricular high signal from transependymal flow.",
    "teach": [
      "Big lateral and third ventricles with a normal fourth point to a block at the cerebral aqueduct.",
      "In hydrocephalus the sulci are squeezed; in atrophy they are wide.",
      "Transependymal CSF flow means the pressure is acutely raised."
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
    "lvl": "Advanced",
    "hx": "74-year-old retired teacher. Two years of gradually worsening memory; now gets lost driving to familiar places.",
    "dx": [
      "Alzheimer’s disease",
      "Frontotemporal dementia",
      "Dementia with Lewy bodies",
      "Vascular dementia"
    ],
    "report": "FDG-PET: bilateral temporoparietal and posterior cingulate hypometabolism with sparing of the sensorimotor and visual cortex. MRI: bilateral hippocampal atrophy. Amyloid PET: positive.",
    "teach": [
      "Alzheimer’s: temporoparietal and posterior cingulate hypometabolism.",
      "Frontotemporal dementia hits frontal and anterior temporal lobes; Lewy body dementia adds occipital loss with a spared posterior cingulate (“island sign”).",
      "Amyloid PET confirms pathology, which matters for anti-amyloid treatments."
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
    "lvl": "Advanced",
    "hx": "23-year-old with seizures since age 12 that start with a rising feeling in the stomach, then lip-smacking. Febrile seizures as a toddler.",
    "dx": [
      "Left mesial temporal sclerosis",
      "Low-grade glioma",
      "Herpes simplex encephalitis",
      "Focal cortical dysplasia"
    ],
    "report": "MRI: small left hippocampus with high T2/FLAIR signal and loss of internal architecture. FDG-PET: interictal hypometabolism of the left temporal lobe.",
    "teach": [
      "Hippocampal sclerosis: volume loss, high T2 signal and lost internal structure, best seen on thin coronal slices.",
      "Interictal FDG-PET shows the focus as cold; ictal SPECT shows it as hot.",
      "Concordant MRI, EEG and PET make this patient a strong surgical candidate."
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
    "lvl": "Advanced",
    "hx": "66-year-old with a resting tremor of the right hand and slowness for a year. Parkinson’s disease or essential tremor?",
    "dx": [
      "Presynaptic dopaminergic loss (parkinsonian syndrome)",
      "Essential tremor (normal scan)",
      "Drug-induced parkinsonism",
      "Normal ageing"
    ],
    "report": "DaTscan: reduced uptake in the left putamen, worst posteriorly, giving a “full stop” instead of a “comma”. Mildly reduced on the right.",
    "teach": [
      "Loss starts in the posterior putamen, opposite the side of the symptoms.",
      "The scan is normal in essential tremor and in drug-induced parkinsonism.",
      "It cannot separate Parkinson’s disease from the atypical parkinsonian syndromes."
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
    "lvl": "Advanced",
    "hx": "29-year-old with a first seizure and occasional headaches.",
    "dx": [
      "Arteriovenous malformation",
      "Cavernous malformation",
      "Glioblastoma",
      "Giant aneurysm"
    ],
    "report": "MRI: right parietal cluster of serpiginous flow voids with enhancing vessels and an enlarged draining vein. MRA: nidus with feeding arteries and early venous drainage.",
    "teach": [
      "Flow voids are black because fast blood leaves the slice before it can be imaged.",
      "Arteries connect straight to veins through a nidus, with no capillaries between.",
      "Catheter angiography (DSA) is the gold standard for planning treatment."
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
    "lvl": "Advanced",
    "hx": "Adult on intensive care after cardiac arrest. The clinical tests for brain death are complete; an ancillary perfusion study is requested.",
    "dx": [
      "Absent cerebral perfusion, consistent with brain death",
      "Normal brain perfusion",
      "Diffuse low perfusion from sedation",
      "Failed tracer injection"
    ],
    "report": "HMPAO SPECT: no tracer uptake in the cerebral hemispheres, cerebellum or brainstem (“hollow skull”); scalp activity present, so the injection worked. CTA: no intracranial arterial opacification.",
    "teach": [
      "Brain death is a clinical diagnosis; imaging is an ancillary test where the examination cannot be completed.",
      "Scalp uptake proves the tracer was delivered.",
      "Sedation lowers flow but never abolishes it."
    ]
  }
];
