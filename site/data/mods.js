const MODS = window.MODS = [
  {
    "id": "mri",
    "abbr": "MRI",
    "name": "Resonancia magnética (RM)",
    "how": "Un imán de 3 teslas alinea los núcleos de hidrógeno del agua y de la grasa. Los pulsos de radiofrecuencia los inclinan y el escáner registra su relajación. La sincronización de los pulsos (TR, TE, TI) determina qué tejido aparece brillante en la imagen.",
    "subs": [
      {
        "id": "t1",
        "name": "Ponderada en T1",
        "code": 0,
        "plane": "sagittal",
        "at": -1,
        "label": "MR",
        "seq": "T1 MPRAGE 3D",
        "params": "TR 2300  TE 2.98  TI 900",
        "vox": "1.0 mm iso",
        "win": "W 512 L 256",
        "note": "The anatomy sequence: white matter bright, grey matter mid-grey, CSF dark. Acquired as a 3D block and reformatted in any plane.",
        "states": [
          "normal",
          "stroke",
          "ich",
          "sdh",
          "gbm",
          "mets",
          "abscess",
          "ms",
          "ad",
          "tle",
          "hydro"
        ]
      },
      {
        "id": "t1gd",
        "name": "T1 + gadolinio",
        "code": 1,
        "plane": "axial",
        "at": 24,
        "label": "MR",
        "seq": "T1 MPRAGE +C",
        "params": "Gadobutrol 0.1 mmol/kg",
        "vox": "1.0 mm iso",
        "win": "W 512 L 256",
        "note": "Gadolinium leaks wherever the blood–brain barrier is broken, so active disease enhances. Vessels and dural sinuses enhance normally.",
        "states": [
          "normal",
          "stroke",
          "ich",
          "gbm",
          "mets",
          "abscess",
          "ms",
          "avm"
        ]
      },
      {
        "id": "t2",
        "name": "Ponderada en T2",
        "code": 2,
        "plane": "axial",
        "at": 8,
        "label": "MR",
        "seq": "T2 TSE AX",
        "params": "TR 4000  TE 90",
        "vox": "0.9 × 0.9 × 4 mm",
        "win": "W 600 L 300",
        "note": "Water-sensitive: CSF and oedema are bright. Fast-flowing arteries leave black flow voids.",
        "states": [
          "normal",
          "stroke",
          "ich",
          "sdh",
          "edh",
          "gbm",
          "mets",
          "abscess",
          "ms",
          "ad",
          "tle",
          "hydro",
          "avm"
        ]
      },
      {
        "id": "flair",
        "name": "FLAIR",
        "code": 3,
        "plane": "axial",
        "at": 26,
        "label": "MR",
        "seq": "T2 FLAIR AX",
        "params": "TR 9000  TE 81  TI 2500",
        "vox": "0.9 × 0.9 × 4 mm",
        "win": "W 600 L 300",
        "note": "T2 with the CSF signal nulled, so lesions next to ventricles and sulci stand out. The workhorse for MS and subarachnoid blood.",
        "states": [
          "normal",
          "stroke",
          "ich",
          "sah",
          "sdh",
          "gbm",
          "mets",
          "abscess",
          "ms",
          "ad",
          "tle",
          "hydro"
        ]
      },
      {
        "id": "dwi",
        "name": "Difusión (DWI)",
        "code": 4,
        "plane": "axial",
        "at": 14,
        "label": "MR",
        "seq": "DWI EPI AX",
        "params": "b = 1000 s/mm²",
        "vox": "1.8 × 1.8 × 5 mm",
        "win": "W 800 L 400",
        "note": "Measures how freely water moves. Acute infarcts, pus and very cellular tumours restrict diffusion and turn bright within minutes.",
        "states": [
          "normal",
          "stroke",
          "ich",
          "gbm",
          "abscess",
          "ms",
          "tle"
        ]
      },
      {
        "id": "swi",
        "name": "Susceptibilidad (SWI)",
        "code": 5,
        "plane": "axial",
        "at": 18,
        "label": "MR",
        "seq": "SWI mIP 8 mm",
        "params": "TR 28  TE 20  FA 15°",
        "vox": "0.7 × 0.7 × 2 mm",
        "win": "W 500 L 250",
        "note": "Sensitive to iron, blood and calcium. Veins and microbleeds go black; shown as an 8 mm minimum-intensity slab.",
        "states": [
          "normal",
          "stroke",
          "ich",
          "gbm",
          "abscess",
          "ms"
        ]
      },
      {
        "id": "dti",
        "name": "Tensor de difusión (DTI)",
        "code": 6,
        "plane": "coronal",
        "at": -18,
        "label": "MR",
        "seq": "DTI · FA colour map",
        "params": "64 directions  b 1000",
        "vox": "2.0 mm iso",
        "win": "FA 0–1",
        "note": "Real fractional anisotropy from the HCP-1065 template. Colour encodes fibre direction: red left–right, green front–back, blue up–down.",
        "states": [
          "normal",
          "stroke",
          "ich",
          "gbm",
          "ms",
          "abscess"
        ]
      },
      {
        "id": "mra",
        "name": "Angiografía por resonancia magnética (ARM)",
        "code": 7,
        "plane": "axial",
        "at": 0,
        "mip": true,
        "label": "MR",
        "seq": "TOF MRA · MIP",
        "params": "TR 22  TE 3.6  FA 18°",
        "vox": "0.5 × 0.5 × 0.8 mm",
        "win": "MIP",
        "note": "Time-of-flight: fresh inflowing blood is bright and still tissue is suppressed. A maximum-intensity projection, so turning the brain spins the vessel tree.",
        "states": [
          "normal",
          "stroke",
          "aneurysm",
          "avm",
          "sah"
        ]
      },
      {
        "id": "asl",
        "name": "Perfusión (ASL)",
        "code": 8,
        "plane": "axial",
        "at": 22,
        "label": "MR",
        "seq": "pCASL CBF",
        "params": "PLD 1800 ms  label 1800 ms",
        "vox": "2.5 mm",
        "win": "CBF 0–80",
        "note": "Arterial spin labelling magnetically tags blood in the neck and images it arriving in the brain, giving cerebral blood flow without contrast.",
        "states": [
          "normal",
          "stroke",
          "gbm",
          "ad",
          "anaes",
          "bd"
        ]
      },
      {
        "id": "mrs",
        "name": "Espectroscopia por resonancia magnética (MRS)",
        "code": 9,
        "plane": "axial",
        "at": 30,
        "label": "MR",
        "seq": "SVS PRESS",
        "params": "TE 30  TR 2000  20 mm voxel",
        "vox": "8 mL voxel",
        "win": "ppm 0.5–4.2",
        "spectrum": true,
        "note": "Instead of an image, a single voxel gives a chemical spectrum: NAA (neurons), choline (membranes), creatine (energy), myo-inositol (glia), lactate (anaerobic metabolism).",
        "states": [
          "normal",
          "gbm",
          "stroke",
          "abscess",
          "ad",
          "ms"
        ]
      }
    ]
  },
  {
    "id": "ct",
    "abbr": "CT",
    "name": "Tomografía computarizada (TC)",
    "how": "Un tubo de rayos X gira alrededor de la cabeza mientras un anillo de detectores mide cuánto se atenúa cada trayectoria. Cada vóxel se expresa en unidades Hounsfield: aire −1000, agua 0, hueso en torno a +1000. La ventana determina qué parte de ese rango se representa del negro al blanco.",
    "subs": [
      {
        "id": "ctb",
        "name": "Ventana cerebral",
        "code": 10,
        "plane": "axial",
        "at": 8,
        "label": "CT",
        "seq": "CT HEAD NON-CONTRAST",
        "params": "120 kVp  250 mAs",
        "vox": "0.5 × 0.5 × 5 mm",
        "win": "W 80 L 40",
        "note": "The fast first-line scan for trauma and stroke. Fresh blood is bright; early infarcts are subtle.",
        "states": [
          "normal",
          "stroke",
          "ich",
          "sah",
          "sdh",
          "edh",
          "gbm",
          "mets",
          "ad",
          "hydro"
        ]
      },
      {
        "id": "ctbone",
        "name": "Ventana ósea",
        "code": 11,
        "plane": "axial",
        "at": 12,
        "label": "CT",
        "seq": "CT HEAD BONE",
        "params": "120 kVp  sharp kernel",
        "vox": "0.5 × 0.5 × 1 mm",
        "win": "W 2800 L 600",
        "note": "A wide window for reading the skull: fractures, sutures, sinuses and the skull base. Brain detail disappears.",
        "states": [
          "normal",
          "edh"
        ]
      },
      {
        "id": "cta",
        "name": "Angiografía por TC (angio-TC)",
        "code": 12,
        "plane": "axial",
        "at": -12,
        "label": "CT",
        "seq": "CTA HEAD · MIP 20 mm",
        "params": "Iohexol 350  80 mL",
        "vox": "0.5 mm iso",
        "win": "W 700 L 200",
        "note": "Contrast is timed to the arterial phase. A 20 mm maximum-intensity slab shows the circle of Willis.",
        "states": [
          "normal",
          "stroke",
          "aneurysm",
          "sah",
          "ich",
          "avm",
          "bd"
        ]
      }
    ]
  },
  {
    "id": "pet",
    "abbr": "PET",
    "name": "Tomografía por emisión de positrones (PET)",
    "how": "Un radiotrazador emite positrones que se aniquilan generando pares de fotones de 511 keV que viajan en direcciones opuestas. El anillo de detectores registra estas coincidencias y cartografía dónde se acumula el trazador.",
    "subs": [
      {
        "id": "fdg",
        "name": "FDG (glucosa)",
        "code": 20,
        "plane": "axial",
        "at": 14,
        "label": "PT",
        "seq": "PET 18F-FDG",
        "params": "185 MBq  45 min uptake",
        "vox": "2.0 mm · 4 mm FWHM",
        "win": "SUV 0–12",
        "note": "Grey matter burns the most glucose. Patterns of low uptake point to dementia type, a seizure focus or dead tissue; consciousness and sleep change the whole map.",
        "states": [
          "normal",
          "eyes_open",
          "n3",
          "rem",
          "anaes",
          "uws",
          "ad",
          "tle",
          "gbm",
          "stroke"
        ]
      },
      {
        "id": "amy",
        "name": "Amiloide",
        "code": 21,
        "plane": "axial",
        "at": 22,
        "label": "PT",
        "seq": "PET 18F-FLORBETAPIR",
        "params": "370 MBq  50 min",
        "vox": "2.0 mm · 5 mm FWHM",
        "win": "SUVR 0–2.5",
        "note": "A negative scan shows tracer only in white matter. Tracer in the cortex means amyloid plaques.",
        "states": [
          "normal",
          "ad"
        ]
      }
    ]
  },
  {
    "id": "spect",
    "abbr": "SPECT",
    "name": "Tomografía computarizada por emisión de fotón único (SPECT)",
    "how": "Las cámaras gamma giran alrededor de la cabeza y registran fotones individuales procedentes del trazador. Menor resolución que la PET, pero algunos trazadores fijan una instantánea del flujo sanguíneo en el momento de la inyección.",
    "subs": [
      {
        "id": "hmpao",
        "name": "Perfusión (HMPAO)",
        "code": 22,
        "plane": "axial",
        "at": 4,
        "label": "NM",
        "seq": "SPECT 99mTc-HMPAO",
        "params": "740 MBq  LEHR",
        "vox": "3.0 mm · 8 mm FWHM",
        "win": "Max 100%",
        "note": "Trapped in proportion to blood flow at injection, so an injection during a seizure freezes the ictal pattern. Also an ancillary test for brain death.",
        "states": [
          "normal",
          "stroke",
          "tle",
          "ad",
          "bd"
        ]
      },
      {
        "id": "dat",
        "name": "DaTscan",
        "code": 23,
        "plane": "axial",
        "at": 2,
        "label": "NM",
        "seq": "SPECT 123I-IOFLUPANE",
        "params": "185 MBq  4 h uptake",
        "vox": "3.0 mm · 8 mm FWHM",
        "win": "Max 100%",
        "note": "Binds dopamine transporters in the striatum. A normal scan shows two commas; Parkinsonism wears them down to full stops.",
        "states": [
          "normal",
          "pd"
        ]
      }
    ]
  },
  {
    "id": "fmri",
    "abbr": "fMRI",
    "name": "Resonancia magnética funcional (RMf)",
    "how": "Adquisiciones eco-planares rápidas cada 2 segundos registran la señal BOLD. Las neuronas activas atraen sangre oxigenada, lo que eleva la señal de RM en torno a un 1–3% unos 5 segundos después. El análisis estadístico la convierte en un mapa de color superpuesto a una imagen anatómica.",
    "subs": [
      {
        "id": "bold",
        "name": "Activación BOLD",
        "code": 30,
        "plane": "axial",
        "at": 56,
        "label": "MR",
        "seq": "EPI BOLD · GLM",
        "params": "TR 2000  TE 30",
        "vox": "3.0 mm iso",
        "win": "z > 3.1",
        "note": "Warm colours mark voxels whose signal follows the task. Resting-state maps show networks whose slow fluctuations rise and fall together.",
        "states": [
          "motor",
          "visual",
          "language",
          "poststroke",
          "dmn",
          "salience",
          "dan",
          "smn",
          "vis",
          "fpn",
          "limbic"
        ],
        "defaultState": "motor"
      }
    ]
  },
  {
    "id": "eeg",
    "abbr": "EEG",
    "name": "Electroencefalografía (EEG)",
    "how": "Los electrodos del cuero cabelludo captan potenciales de microvoltios generados por millones de células piramidales corticales que descargan de forma sincrónica. Excelente resolución temporal (milisegundos), pero localización imprecisa, porque el cráneo difumina el campo.",
    "subs": [
      {
        "id": "eeg",
        "name": "EEG de cuero cabelludo (10–20)",
        "code": 40,
        "plane": "axial",
        "at": 0,
        "surface": true,
        "label": "EEG",
        "seq": "21-ch 10–20 · referential",
        "params": "256 Hz  0.5–70 Hz",
        "vox": "19 electrodes",
        "win": "±100 µV",
        "note": "The slide shows the scalp potential map at this instant with the 10–20 electrodes; the trace panel shows the channels over time. Sleep, anaesthesia and seizures each have a signature rhythm.",
        "states": [
          "eyes_closed",
          "eyes_open",
          "n1",
          "n2",
          "n3",
          "rem",
          "anaes",
          "burst",
          "absence",
          "focal_sz",
          "uws",
          "bd"
        ],
        "defaultState": "eyes_closed"
      }
    ]
  },
  {
    "id": "meg",
    "abbr": "MEG",
    "name": "Magnetoencefalografía (MEG)",
    "how": "Sensores superconductores dispuestos en un casco miden campos magnéticos del orden de femtoteslas procedentes de las mismas corrientes que detecta el EEG. El cráneo no difumina los campos magnéticos, por lo que las fuentes pueden localizarse con una precisión de pocos milímetros.",
    "subs": [
      {
        "id": "meg",
        "name": "Mapa de campo MEG",
        "code": 41,
        "plane": "axial",
        "at": 0,
        "surface": true,
        "label": "MEG",
        "seq": "306-ch MEG · dipole fit",
        "params": "1000 Hz  0.1–330 Hz",
        "vox": "306 sensors",
        "win": "±300 fT",
        "note": "Red is field leaving the head, blue entering. A current dipole produces one of each on either side of it; the fitted dipole sits between them.",
        "states": [
          "eyes_closed",
          "aep",
          "sep",
          "spike"
        ],
        "defaultState": "aep"
      }
    ]
  },
  {
    "id": "us",
    "abbr": "US",
    "name": "Ecografía (ultrasonido)",
    "how": "Un transductor emite pulsos de ultrasonido de 2–7 MHz y cronometra los ecos. El hueso bloquea el sonido, por lo que el cerebro se estudia a través de ventanas: la fontanela abierta en los bebés o el hueso temporal adelgazado en los adultos para el Doppler.",
    "subs": [
      {
        "id": "cus",
        "name": "Ecografía craneal",
        "code": 50,
        "plane": "coronal",
        "at": 12,
        "label": "US",
        "seq": "Cranial US · fontanelle",
        "params": "7.5 MHz  sector",
        "vox": "0.3 mm axial",
        "win": "Gain 55%",
        "note": "Neonatal scan through the anterior fontanelle. This phantom uses adult anatomy, so sizes are larger than a newborn’s, but the echo pattern is the same: fluid black, interfaces bright.",
        "states": [
          "normal",
          "ivh",
          "pvl",
          "hydro"
        ]
      },
      {
        "id": "tcd",
        "name": "Doppler transcraneal",
        "code": 51,
        "plane": "axial",
        "at": -12,
        "label": "US",
        "seq": "TCD · L temporal window",
        "params": "2 MHz  depth 55 mm",
        "vox": "sample 10 mm",
        "win": "cm/s",
        "spectrum": true,
        "note": "Colour Doppler through the temporal bone shows flow toward the probe in red, away in blue. The spectral trace measures velocity in the middle cerebral artery.",
        "states": [
          "normal",
          "vasospasm",
          "stroke",
          "icp",
          "bd"
        ]
      }
    ]
  },
  {
    "id": "dsa",
    "abbr": "DSA",
    "name": "Angiografía por cateterismo",
    "how": "Un catéter se guía desde la ingle hasta una arteria del cuello y se inyecta contraste mientras se adquieren imágenes de rayos X varias veces por segundo. Se resta una máscara previa al contraste para que solo permanezcan visibles los vasos.",
    "subs": [
      {
        "id": "dsa",
        "name": "Sustracción digital",
        "code": 60,
        "plane": "coronal",
        "at": 0,
        "mip": true,
        "label": "XA",
        "seq": "DSA · 3 fps",
        "params": "Iohexol 300  8 mL/s",
        "vox": "0.2 mm",
        "win": "Subtracted",
        "note": "Coronal gives the AP projection, sagittal the lateral. Frames run from arterial to capillary to venous phase.",
        "states": [
          "normal",
          "aneurysm",
          "avm",
          "stroke",
          "bd"
        ]
      }
    ]
  }
];
