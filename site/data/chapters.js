const CHAPTERS = window.CHAPTERS = {
  "mri": {
    "full": "Resonancia magnética",
    "title": "MRI",
    "lede": "Un escáner de RM nunca utiliza rayos X. Emplea un campo magnético potente y ondas de radiofrecuencia para inducir a los núcleos de hidrógeno a emitir señales, localizando con precisión el origen de cada emisión.",
    "meta": [
      [
        "Mide",
        "Hidrógeno en agua y grasa"
      ],
      [
        "Resolución",
        "≈1 mm"
      ],
      [
        "Tiempo",
        "2–6 min por secuencia"
      ],
      [
        "Radiación",
        "Ninguna"
      ]
    ],
    "steps": [
      {
        "tag": "Magnet",
        "h": "Un electroimán más potente que una grúa industrial",
        "p": "Bobinas de hilo superconductor de niobio-titanio, refrigeradas por helio líquido a −269 °C (4 K), conducen una corriente eléctrica permanente sin resistencia. El campo magnético resultante alinea una fracción de los protones del organismo.",
        "facts": [
          [
            "B₀",
            "1.5 o 3 T"
          ],
          [
            "Campo terrestre",
            "≈ 50 µT (un 3 T es 60.000×)"
          ],
          [
            "Temperatura bobina",
            "4 K (−269 °C)"
          ],
          [
            "Peso del imán",
            "≈ 4 a 7 toneladas"
          ]
        ]
      },
      {
        "tag": "Protons",
        "h": "Los protones se alinean y precesan",
        "p": "Cada núcleo de hidrógeno actúa como un diminuto imán giroscópico. En presencia de B₀, precesan (oscilan) a la frecuencia de Larmor, proporcional a la fuerza del campo.",
        "facts": [
          [
            "Frecuencia Larmor",
            "f = γB₀"
          ],
          [
            "γ para ¹H",
            "42.58 MHz por tesla"
          ],
          [
            "A 3 T",
            "≈ 128 MHz (banda de radio FM)"
          ]
        ]
      },
      {
        "tag": "RF pulse",
        "h": "Un pulso de radiofrecuencia inclina su magnetización",
        "p": "La bobina corporal emite un pulso de radio sintonizado exactamente a la frecuencia de Larmor. Esto inclina el vector de magnetización neta hacia el plano transversal. Al cesar el pulso, los protones inducen un voltaje medible en las antenas receptoras.",
        "facts": [
          [
            "Duración de pulso",
            "≈ 1–3 ms"
          ],
          [
            "Ángulo de inclinación",
            "Hasta 90° (o 180° para refocalizar)"
          ],
          [
            "Señal",
            "Microvoltios en la antena"
          ]
        ]
      },
      {
        "tag": "Contrast",
        "h": "La relajación tisular genera el contraste",
        "p": "Tras el pulso, la magnetización longitudinal se recupera (T1) mientras la magnetización transversal decae (T2). Como el agua libre, el tejido glial y la mielina tienen microambientes distintos, sus velocidades de relajación varían sustancialmente.",
        "facts": [
          [
            "T1 a 3 T",
            "SB 840 · SG 1350 · LCR 4200 ms"
          ],
          [
            "T2 a 3 T",
            "SB 75 · SG 95 · LCR 2000 ms"
          ],
          [
            "Contraste",
            "Parámetros TR y TE del operador"
          ]
        ]
      },
      {
        "tag": "k-space",
        "h": "Los gradientes codifican la posición espacial",
        "p": "Tres juegos de bobinas de gradiente superponen pequeñas pendientes magnéticas lineales en los ejes x, y, z. Esto hace que cada vóxel del encéfalo resuene a una frecuencia ligeramente diferente, permitiendo reconstruir la imagen mediante la transformada de Fourier.",
        "facts": [
          [
            "Gradientes",
            "Bobinas ortogonales x, y, z"
          ],
          [
            "Matriz por corte",
            "Típicamente 256×256"
          ],
          [
            "Ruido acústico",
            "Hasta ≈ 110 dB al conmutar"
          ]
        ]
      }
    ],
    "ctaTitle": "Interpretar secuencias de RM",
    "ctaText": "Diez secuencias del mismo encéfalo: T1, T1 con gadolinio, T2, FLAIR, difusión (DWI, mapa ADC), tensor de difusión (FA) y angiografía por tiempo de vuelo."
  },
  "ct": {
    "full": "Tomografía computarizada",
    "title": "CT",
    "lede": "La TC mide el grado de atenuación de rayos X en cada vóxel de tejido. Registra múltiples proyecciones angulares y reconstruye matemáticamente cortes anatómicos axiales transversales.",
    "meta": [
      [
        "Mide",
        "Atenuación de rayos X (unidades Hounsfield)"
      ],
      [
        "Resolución",
        "0.5 mm"
      ],
      [
        "Tiempo",
        "< 10 s para cráneo"
      ],
      [
        "Dosis típica",
        "≈ 1.5–2 mSv"
      ]
    ],
    "steps": [
      {
        "tag": "Gantry",
        "h": "Tubo y detectores giran a gran velocidad",
        "p": "Dentro del gantry, un tubo de rayos X y una corona de detectores cerámicos rotan continuamente a varias revoluciones por segundo, emitiendo un haz en abanico mientras la camilla avanza.",
        "facts": [
          [
            "Voltaje de tubo",
            "100–140 kV"
          ],
          [
            "Una rotación",
            "≈ 0.3 s"
          ],
          [
            "Filas de detectores",
            "64–320 canales"
          ]
        ]
      },
      {
        "tag": "Attenuation",
        "h": "El tejido atenúa el haz de fotones",
        "p": "Las estructuras densas absorben más fotones según la ley de Beer-Lambert. Los fotones supervivientes excitan los detectores de centelleo, que convierten la radiación en fotocorrientes eléctricas.",
        "facts": [
          [
            "Mecanismo",
            "Efecto fotoeléctrico y dispersión Compton"
          ],
          [
            "Hueso cortical",
            "Atenuación muy elevada"
          ],
          [
            "LCR y agua",
            "Baja atenuación"
          ]
        ]
      },
      {
        "tag": "Sinogram",
        "h": "La retroproyección reconstruye el mapa",
        "p": "Cientos de miles de proyecciones angulares se combinan mediante retroproyección filtrada o reconstrucción iterativa para resolver el coeficiente de atenuación lineal µ de cada vóxel en una matriz matricial.",
        "facts": [
          [
            "Algoritmo clásico",
            "Retroproyección filtrada"
          ],
          [
            "Moderno",
            "Reconstrucción iterativa con IA"
          ],
          [
            "Matriz",
            "512×512 píxeles"
          ]
        ]
      },
      {
        "tag": "Back-projection",
        "h": "La escala Hounsfield calibra la imagen",
        "p": "Los valores de atenuación se escalan en unidades Hounsfield (HU), donde el agua es 0 HU y el aire −1000 HU. El hueso cortical alcanza +1000 a +3000 HU, mientras que la hemorragia aguda mide entre +50 y +80 HU.",
        "facts": [
          [
            "Aire",
            "−1000 HU"
          ],
          [
            "LCR / Agua",
            "0 HU"
          ],
          [
            "Sustancia blanca",
            "≈ 30 HU"
          ],
          [
            "Sustancia gris",
            "≈ 40 HU"
          ],
          [
            "Sangre fresca",
            "+50 a +80 HU"
          ],
          [
            "Hueso",
            "> +1000 HU"
          ]
        ]
      },
      {
        "tag": "Windows",
        "h": "El ventaneo resalta la patología",
        "p": "Dado que el ojo humano solo distingue unos 30 tonos de gris simultáneos, el operador ajusta el nivel (centro) y el ancho de ventana. La ventana de parénquima cerebral separa la sustancia gris y blanca, mientras que la ventana de fosa posterior y de hueso detectan fracturas y hematomas subdurales.",
        "facts": [
          [
            "Ventana encéfalo",
            "W:80 L:40"
          ],
          [
            "Ventana ictus",
            "W:40 L:35"
          ],
          [
            "Ventana ósea",
            "W:2000 L:500"
          ],
          [
            "Ventana subdural",
            "W:200 L:75"
          ]
        ]
      }
    ],
    "ctaTitle": "Interpretar tomografías computarizadas",
    "ctaText": "Revise cortes axiales de TC sin contraste, angio-TC (CTA) con contraste arterial y perfusión en infartos agudos, hematomas epidurales, fracturas craneales y hemorragia subaracnoidea."
  },
  "pet": {
    "full": "Tomografía por emisión de positrones",
    "title": "PET",
    "lede": "La PET utiliza radiotrazadores biológicos análogos que emiten positrones para cartografiar el metabolismo glucídico, la densidad de receptores neuronales y los agregados proteicos anómalos.",
    "meta": [
      [
        "Mide",
        "Metabolismo regional de glucosa (¹⁸F-FDG)"
      ],
      [
        "Resolución",
        "4–5 mm"
      ],
      [
        "Tiempo",
        "30–60 min tras inyección"
      ],
      [
        "Vida media ¹⁸F",
        "109.8 min"
      ]
    ],
    "steps": [
      {
        "tag": "Tracer",
        "h": "Inyección del radiotrazador metabólico",
        "p": "Se inyecta por vía endovenosa ¹⁸F-fluorodesoxiglucosa (FDG). Las neuronas activas la captan mediante transportadores GLUT. Una vez fosforilada por la hexocinasa, queda atrapada intracelularmente sin poder seguir la glucólisis.",
        "facts": [
          [
            "Trazador",
            "¹⁸F-FDG (análogo de glucosa)"
          ],
          [
            "Atrapamiento",
            "Fosforilación sin isomerización"
          ],
          [
            "Dosis típica",
            "≈ 185–370 MBq"
          ]
        ]
      },
      {
        "tag": "Annihilation",
        "h": "Desintegración radiactiva y emisión del positrón",
        "p": "El núcleo inestable de ¹⁸F transmuta un protón en neutrón emitiendo un positrón (β⁺) y un neutrino. El positrón viaja una fracción de milímetro en el tejido antes de encontrarse con un electrón.",
        "facts": [
          [
            "Desintegración",
            "p → n + β⁺ + ν"
          ],
          [
            "Rango del positrón",
            "≈ 0.6 mm en tejido blando"
          ],
          [
            "Efecto en resolución",
            "Límite físico intrínseco"
          ]
        ]
      },
      {
        "tag": "Coincidence",
        "h": "Aniquilación y fotones en coincidencia",
        "p": "Al colisionar el positrón con un electrón, sus masas se aniquilan mutuamente según E = mc², produciendo dos fotones gamma de 511 keV que viajan en direcciones casi exactamente opuestas (180°).",
        "facts": [
          [
            "Energía fotones",
            "511 keV cada uno"
          ],
          [
            "Ángulo relativo",
            "180° ± 0.25°"
          ],
          [
            "Línea de respuesta",
            "LOR entre dos cristales"
          ]
        ]
      },
      {
        "tag": "Image",
        "h": "Detección temporal en anillo y reconstrucción",
        "p": "Una corona circular de detectores BGO o LSO identifica impactos simultáneos en nanosegundos (detección por coincidencia). La tomografía calcula de qué punto de cada línea provino la emisión, revelando zonas hipometabólicas en demencias y epilepsia.",
        "facts": [
          [
            "Ventana coincidencia",
            "≈ 3 a 5 ns"
          ],
          [
            "Tiempo de vuelo (TOF)",
            "Precisión centimétrica previa"
          ],
          [
            "Hipometabolismo",
            "Foco epileptógeno / Alzheimer"
          ]
        ]
      }
    ],
    "ctaTitle": "Interpretar estudios PET",
    "ctaText": "Explore mapas metabólicos con ¹⁸F-FDG en epilepsia del lóbulo temporal, demencia tipo Alzheimer, degeneración frontotemporal y su fusión con resonancia magnética."
  },
  "spect": {
    "full": "Tomografía computarizada por emisión de fotón único",
    "title": "SPECT",
    "lede": "La SPECT utiliza radiotrazadores gamma convencionales y colimadores mecánicos de plomo para evaluar la perfusión cerebral y la integridad de las terminales dopaminérgicas estriatales.",
    "meta": [
      [
        "Mide",
        "Perfusión (HMPAO) y transportadores DaT (Ioflupano)"
      ],
      [
        "Resolución",
        "8–10 mm"
      ],
      [
        "Tiempo",
        "20–30 min"
      ],
      [
        "Isótopo",
        "⁹⁹ᵐTc (6 h) / ¹²³I (13 h)"
      ]
    ],
    "steps": [
      {
        "tag": "Tracer",
        "h": "Fármacos emisores de fotón único",
        "p": "A diferencia de la PET, el radioisótopo (como el tecnecio-99m o el yodo-123) emite directamente un único fotón gamma por cada desintegración nuclear, sin proceso de aniquilación de pares.",
        "facts": [
          [
            "Isótopo principal",
            "⁹⁹ᵐTc (140 keV)"
          ],
          [
            "Vida media",
            "6.0 horas"
          ],
          [
            "Trazador DaT",
            "¹²³I-ioflupano (DaTscan)"
          ]
        ]
      },
      {
        "tag": "Collimator",
        "h": "Los colimadores de plomo filtran la dirección",
        "p": "Como no hay fotones opuestos en coincidencia, se interpone una placa de plomo con miles de orificios paralelos (colimador). Solo los fotones que inciden perpendicularmente alcanzan el cristal de yoduro de sodio, descartando la radiación oblicua.",
        "facts": [
          [
            "Material",
            "Plomo o wolframio"
          ],
          [
            "Eficiencia geométrica",
            "Solo ≈ 0.01% de fotones ingresa"
          ],
          [
            "Impacto",
            "Menor resolución espacial que PET"
          ]
        ]
      },
      {
        "tag": "Rotation",
        "h": "Cámaras gamma en rotación orbital",
        "p": "Uno o dos cabezales detectores rotan en torno al cráneo del paciente recopilando proyecciones planares angulares cada 3 o 6 grados.",
        "facts": [
          [
            "Cabezales",
            "Normalmente 2 detectores a 90° o 180°"
          ],
          [
            "Arco angular",
            "360° completos"
          ]
        ]
      },
      {
        "tag": "Image",
        "h": "Evaluación de DaTscan y perfusión ictal",
        "p": "En la enfermedad de Parkinson y demencia por cuerpos de Lewy, el DaTscan revela una pérdida asimétrica de transportadores de dopamina en el putamen. En epilepsia, la inyección durante una crisis fija el flujo en el foco epileptógeno.",
        "facts": [
          [
            "DaTscan normal",
            "Forma de coma simétrica"
          ],
          [
            "Parkinsonismo",
            "Forma de punto por pérdida de putamen"
          ],
          [
            "SPECT ictal",
            "Hiperperfusión focal"
          ]
        ]
      }
    ],
    "ctaTitle": "Interpretar estudios SPECT",
    "ctaText": "Visualice exploraciones DaTscan normales frente a pérdida dopaminérgica en parkinsonismo y estudios de perfusión cerebral con ⁹⁹ᵐTc-HMPAO."
  },
  "fmri": {
    "full": "Resonancia magnética funcional",
    "title": "fMRI",
    "lede": "La RMf detecta variaciones locales en la oxigenación sanguínea capilar secundarias a la actividad neuronal mediante el efecto hemodinámico dependiente del nivel de oxígeno en sangre (BOLD).",
    "meta": [
      [
        "Mide",
        "Contraste hemodinámico BOLD"
      ],
      [
        "Resolución",
        "2–3 mm"
      ],
      [
        "Frecuencia temporal",
        "1 corte cerebral cada 1–2 s"
      ],
      [
        "Seguridad",
        "No invasiva, sin radiación"
      ]
    ],
    "steps": [
      {
        "tag": "Coupling",
        "h": "Acoplamiento neurovascular",
        "p": "Cuando un grupo neuronal dispara potenciales de acción, consume glucosa y oxígeno. En respuesta, los astrocitos y el endotelio dilatan las arteriolas locales, provocando un aumento masivo del flujo sanguíneo que sobrepasa el consumo de O₂.",
        "facts": [
          [
            "Latencia",
            "Comienza a 1–2 s, pico a 4–6 s"
          ],
          [
            "Desfase",
            "Respuesta hemodinámica retardada"
          ],
          [
            "Mediadores",
            "Óxido nítrico, prostanoides"
          ]
        ]
      },
      {
        "tag": "BOLD",
        "h": "La hemoglobina como agente de contraste endógeno",
        "p": "La desoxihemoglobina es paramagnética y distorsiona el campo magnético local (T2* corto), amortiguando la señal de RM. La oxihemoglobina es diamagnética y neutra. El influjo de sangre arterial oxigenada barre la desoxihemoglobina, aumentando la señal de RM.",
        "facts": [
          [
            "Desoxi-Hb",
            "Paramagnética (degrada señal)"
          ],
          [
            "Oxi-Hb",
            "Diamagnética (preserva señal)"
          ],
          [
            "Cambio neto",
            "Incremento de 1 a 3% en señal T2*"
          ]
        ]
      },
      {
        "tag": "HRF",
        "h": "Imágenes ecoplanares ultra-rápidas",
        "p": "Para capturar la dinámica cerebral en tiempo real, se utilizan secuencias ecoplanares (EPI) que completan la lectura del espacio k de un corte entero con una sola excitación de radiofrecuencia en apenas 40 ms.",
        "facts": [
          [
            "Tiempo de repetición (TR)",
            "1 a 2 segundos por volumen"
          ],
          [
            "Artefactos",
            "Sensible a susceptibilidad en base de cráneo"
          ]
        ]
      },
      {
        "tag": "Statistics",
        "h": "Análisis estadístico y mapas funcionales",
        "p": "Se correlaciona la serie temporal de cada vóxel con el paradigma de estímulo mediante el Modelo Lineal General (GLM), superponiendo los vóxeles estadísticamente significativos (mapas T o Z) sobre la anatomía T1 del paciente.",
        "facts": [
          [
            "Modelo estadístico",
            "GLM con función hemodinámica (HRF)"
          ],
          [
            "Aplicación clínica",
            "Mapeo pres quirúrgico de lenguaje y corteza motora"
          ]
        ]
      }
    ],
    "ctaTitle": "Interpretar mapas de RMf",
    "ctaText": "Explore la activación de la corteza motora durante el movimiento de los dedos, áreas del lenguaje en Broca/Wernicke y mapas de la red por defecto (DMN)."
  },
  "eeg": {
    "full": "Electroencefalografía",
    "title": "EEG",
    "lede": "El EEG registra las fluctuaciones de potencial eléctrico generadas por la actividad sináptica sincrónica de millones de neuronas piramidales corticales mediante electrodos colocados en el cuero cabelludo.",
    "meta": [
      [
        "Mide",
        "Potenciales postsinápticos corticales"
      ],
      [
        "Resolución temporal",
        "< 1 milisegundo"
      ],
      [
        "Resolución espacial",
        "Baja (orden de centímetros)"
      ],
      [
        "Electrodos",
        "Sistema 10–20 (19–64 canales)"
      ]
    ],
    "steps": [
      {
        "tag": "Source",
        "h": "Dipolos de corriente en neuronas piramidales",
        "p": "Las corrientes postsinápticas excitatorias en las dendritas apicales de las células piramidales, orientadas perpendicularmente a la superficie de la corteza, crean pequeños dipolos de corriente intracelulares y extracelulares.",
        "facts": [
          [
            "Origen",
            "Potenciales postsinápticos (no potenciales de acción)"
          ],
          [
            "Orientación",
            "Columnas corticales perpendiculares"
          ],
          [
            "Amplitud en cuero cabelludo",
            "10 a 100 microvoltios (µV)"
          ]
        ]
      },
      {
        "tag": "10–20",
        "h": "Sincronía poblacional y conducción de volumen",
        "p": "Un electrodo de superficie no puede registrar una sola neurona. Se requiere la activación simultánea de decenas de miles de neuronas en un área de al menos 6 cm² para que el campo eléctrico atraviese el líquido cefalorraquídeo, el cráneo y el cuero cabelludo.",
        "facts": [
          [
            "Atenuación ósea",
            "El cráneo reduce la señal y dispersa el campo"
          ],
          [
            "Efecto",
            "Pérdida severa de resolución espacial"
          ]
        ]
      },
      {
        "tag": "Amplifier",
        "h": "El sistema internacional 10–20",
        "p": "Los electrodos se disponen a intervalos proporcionales del 10% y 20% respecto a puntos anatómicos de referencia (nasión, inión y puntos preauriculares), identificados con letras según el lóbulo (F, C, T, P, O) y números pares a la derecha e impares a la izquierda.",
        "facts": [
          [
            "Nasión / Inión",
            "Puntos craneales de referencia anterior/posterior"
          ],
          [
            "Impedancia",
            "Debe mantenerse < 5 kΩ"
          ]
        ]
      },
      {
        "tag": "Rhythms",
        "h": "Ritmos oscilatorios y grafoelementos",
        "p": "La actividad cerebral oscila en bandas de frecuencia características: delta (< 4 Hz), theta (4–8 Hz), alfa (8–12 Hz, dominante en reposo occipital con ojos cerrados), beta (13–30 Hz) y gamma (> 30 Hz). En epilepsia se identifican espigas y ondas agudas paroxísticas.",
        "facts": [
          [
            "Ritmo alfa",
            "8–12 Hz occipital, reactivo al abrir los ojos"
          ],
          [
            "Ritmo delta",
            "Sueño profundo o lesión focal subcortical"
          ],
          [
            "Espiga-onda 3 Hz",
            "Patognomónico de crisis de ausencia"
          ]
        ]
      }
    ],
    "ctaTitle": "Interpretar trazados de EEG",
    "ctaText": "An 18-channel bipolar montage with a live scalp map: wakefulness, sleep stages, anaesthesia, seizures and brain death."
  },
  "meg": {
    "full": "Magnetoencefalografía",
    "title": "MEG",
    "lede": "La MEG detecta los diminutos campos magnéticos producidos por las corrientes eléctricas neuronales utilizando sensores superconductores de interferencia cuántica (SQUID) a temperaturas criogénicas.",
    "meta": [
      [
        "Mide",
        "Campos magnéticos neuronales intracelulares"
      ],
      [
        "Resolución temporal",
        "< 1 milisegundo"
      ],
      [
        "Resolución espacial",
        "2–5 mm"
      ],
      [
        "Sensores",
        "Hasta 306 SQUIDs en casco criogénico"
      ]
    ],
    "steps": [
      {
        "tag": "Fields",
        "h": "Campos magnéticos según la ley de Biot-Savart",
        "p": "Toda corriente eléctrica engendra un campo magnético perpendicular. Las corrientes intracelulares longitudinales en las neuronas piramidales de los surcos corticales generan campos magnéticos externos del orden de los femtoteslas (10⁻¹⁵ T).",
        "facts": [
          [
            "Intensidad",
            "10 a 500 fT (10⁻¹⁵ T)"
          ],
          [
            "Comparación",
            "El campo magnético terrestre es 1.000.000.000× más intenso"
          ],
          [
            "Sensibilidad",
            "Especialmente sensible a neuronas en surcos"
          ]
        ]
      },
      {
        "tag": "Helmet",
        "h": "Sala blindada magnéticamente",
        "p": "Para aislar los femtoteslas cerebrales del ruido ambiente (líneas eléctricas, tráfico, ascensores), el sistema se aloja dentro de una cámara aislada con múltiples capas de mu-metal (aleación de níquel-hierro de alta permeabilidad) y aluminio.",
        "facts": [
          [
            "Mu-metal",
            "Atenúa campos estáticos y de baja frecuencia"
          ],
          [
            "Aluminio",
            "Atenúa campos de alta frecuencia por corrientes de Foucault"
          ]
        ]
      },
      {
        "tag": "Field map",
        "h": "Sensores SQUID y gradiómetros superconductores",
        "p": "Los sensores cuánticos SQUID operan sumergidos en helio líquido a −269 °C. Convierten la variación de flujo magnético en un voltaje mediante el efecto Josephson, combinando magnetómetros y pares de gradiómetros para cancelar el ruido lejano.",
        "facts": [
          [
            "Unión Josephson",
            "Efecto túnel cuántico en superconductores"
          ],
          [
            "Gradiómetro",
            "Mide la diferencia de campo espacial descartando ruido común"
          ]
        ]
      },
      {
        "tag": "Timing",
        "h": "Localización de fuentes y fusión con RM",
        "p": "A diferencia del campo eléctrico del EEG, los campos magnéticos no sufren distorsión ni resistencia al cruzar el cráneo o el cuero cabelludo. Esto permite calcular la localización del dipolo equivalente con precisión milimétrica (campo magnético de fuente o MSI) antes de una resección quirúrgica.",
        "facts": [
          [
            "Ventaja",
            "Permeabilidad magnética de hueso y tejidos es idéntica al vacío (µ ≈ µ₀)"
          ],
          [
            "Aplicación",
            "Mapeo prequirúrgico de focos de displasia cortical y epilepsia refractaria"
          ]
        ]
      }
    ],
    "ctaTitle": "Interpretar mapas de MEG",
    "ctaText": "Examine mapas de isocampo magnético, localización de dipolos de espigas epileptógenas y su corregistro milimétrico con resonancia magnética volumétrica."
  },
  "us": {
    "full": "Ecografía y Doppler transcraneal",
    "title": "Ultrasound",
    "long": true,
    "lede": "La ecografía utiliza ondas acústicas mecánicas de alta frecuencia para producir imágenes de ecogenicidad en tiempo real y cuantificar la velocidad del flujo sanguíneo cerebral mediante el efecto Doppler.",
    "meta": [
      [
        "Mide",
        "Impedancia acústica tisular y velocidad de flujo arterial"
      ],
      [
        "Resolución",
        "Submilimétrica en neonatos / Doppler espectral"
      ],
      [
        "Tiempo",
        "Tiempo real continuo (ms)"
      ],
      [
        "Seguridad",
        "Ondas mecánicas, sin radiación ionizante"
      ]
    ],
    "steps": [
      {
        "tag": "Probe",
        "h": "Transductores y efecto piezoeléctrico",
        "p": "Cristales piezoeléctricos de titanato zirconato de plomo (PZT) vibran al recibir pulsos eléctricos, emitiendo ráfagas de ultrasonido de 1 a 10 MHz. Al recibir los ecos reflejados, generan señales eléctricas análogas.",
        "facts": [
          [
            "Frecuencia transcraneal",
            "1.5 a 2.5 MHz (mayor penetración)"
          ],
          [
            "Frecuencia transfontanelar",
            "5 a 8 MHz (alta resolución en recién nacidos)"
          ]
        ]
      },
      {
        "tag": "Echoes",
        "h": "Reflexión en interfases de impedancia acústica",
        "p": "Cuando el haz acústico viaja entre dos tejidos con diferente impedancia (Z = densidad × velocidad del sonido), una fracción de la onda se refleja como eco y otra se transmite. Los límites de gran diferencia (como tejido y hueso) generan reflexiones hiperecogénicas intensas.",
        "facts": [
          [
            "Líquido / Quiste",
            "Anecoico (negro, sin ecos)"
          ],
          [
            "Parénquima",
            "Isoecoico"
          ],
          [
            "Hemorragia reciente / Hueso",
            "Hiperecogénico (blanco brillante)"
          ]
        ]
      },
      {
        "tag": "Windows",
        "h": "Ventanas acústicas transcraneales",
        "p": "Dado que el cráneo adulto absorbe y dispersa fuertemente el ultrasonido, se insona a través de ventanas óseas naturales de menor espesor: ventana transtemporal (para polígono de Willis), transorbitaria (para arteria oftálmica y carótida interna) y suboccipital (para arterias vertebrales y basilar).",
        "facts": [
          [
            "Ventana temporal",
            "Encima del arco cigomático anterior a la oreja"
          ],
          [
            "Ventana transfontanelar",
            "Fontanela anterior en lactantes antes del cierre óseo"
          ]
        ]
      },
      {
        "tag": "Doppler",
        "h": "Efecto Doppler y espectro de velocidad arterial",
        "p": "Los eritrocitos en movimiento reflejan el ultrasonido con un desplazamiento de frecuencia proporcional a su velocidad (Δf = 2·f₀·v·cosθ / c). El Doppler espectral calcula la velocidad sistólica máxima, diastólica final y el índice de pulsatilidad para diagnosticar vasoespasmo o hipertensión intracraneal.",
        "facts": [
          [
            "Índice de Gosling",
            "IP = (Vpico − Vfinal) / Vmedia (normal 0.6–1.1)"
          ],
          [
            "Vasoespasmo",
            "Velocidad en ACM > 120–200 cm/s tras hemorragia subaracnoidea"
          ],
          [
            "Paro circulatorio",
            "Espiga sistólica aislada y flujo reverberante diastólico invertido"
          ]
        ]
      }
    ],
    "ctaTitle": "Interpretar ecografías y Doppler cerebral",
    "ctaText": "Analice el espectro de flujo de la arteria cerebral media en Doppler transcraneal, curvas de vasoespasmo y ecografías neonatales transfontanelares."
  },
  "dsa": {
    "full": "Angiografía por sustracción digital",
    "title": "DSA",
    "lede": "La ASD es el patrón oro vascular. Inyecta medio de contraste yodado directamente en los vasos cerebrales mediante cateterismo selectivo, sustrayendo computacionalmente las densidades óseas estáticas.",
    "meta": [
      [
        "Mide",
        "Lumen endovascular cerebral dinámico en tiempo real"
      ],
      [
        "Resolución",
        "0.15 a 0.25 mm"
      ],
      [
        "Técnica",
        "Acceso transfemoral o transradial"
      ],
      [
        "Capacidad",
        "Diagnóstica y terapéutica intervencionista"
      ]
    ],
    "steps": [
      {
        "tag": "Catheter",
        "h": "Cateterismo intraarterial supraselectivo",
        "p": "Bajo guía fluoroscópica continua, se avanza un microcatéter por vía femoral o radial hasta la arteria carótida interna, carótida común o vertebral que irriga el territorio de interés.",
        "facts": [
          [
            "Vía de acceso",
            "Arteria radial derecha o femoral común"
          ],
          [
            "Microcatéter",
            "Orientación coaxial con microguía orientable"
          ]
        ]
      },
      {
        "tag": "Run",
        "h": "Sustracción fotograma a fotograma",
        "p": "Se adquiere una radiografía inicial sin contraste (imagen máscara). Se inyecta un bolo de contraste yodado a través del catéter y se toman radiografías seriadas continuas. La computadora resta la máscara a cada fotograma: los huesos y tejidos fijos se anulan matemáticamente, dejando visible únicamente el mapa vascular teñido de negro.",
        "facts": [
          [
            "Principio",
            "Fotograma con contraste − Fotograma máscara = Solo vasos"
          ],
          [
            "Yodo",
            "Elevado número atómico (Z = 53), gran atenuación fotónica"
          ]
        ]
      },
      {
        "tag": "Subtraction",
        "h": "Fases circulatorias: arterial, capilar y venosa",
        "p": "El registro a 3 a 6 fotogramas por segundo captura la dinámica completa del tránsito sanguíneo cerebral: la fase arterial temprana (0 a 2.5 s), la fase capilar o tinción parenquimatosa (3 a 5 s) y el retorno venoso a través de los senos durales (6 a 10 s).",
        "facts": [
          [
            "Tiempo circulatorio",
            "Normal 3 a 4 segundos de arteria a seno venoso"
          ],
          [
            "Enlentecimiento",
            "Signo indirecto de hipertensión intracraneal o trombosis"
          ]
        ]
      },
      {
        "tag": "Treat",
        "h": "Intervencionismo endovascular terapéutico",
        "p": "Permite no solo el diagnóstico definitivo de aneurismas, malformaciones arteriovenosas y fístulas durales, sino su tratamiento inmediato mediante microcoils de platino desmontables, stents diversores de flujo o trombectomía mecánica con stent-retriever en ictus agudo.",
        "facts": [
          [
            "Coiling",
            "Relleno de saco aneurismático con microespiras para trombosarlo"
          ],
          [
            "Trombectomía",
            "Aspiración y extracción física de trombo en oclusión de gran vaso"
          ]
        ]
      }
    ],
    "ctaTitle": "Interpretar angiografías cerebrales",
    "ctaText": "Explore series dinámicas de angiografía por sustracción digital, visualización de cuello y saco aneurismático en arteria comunicante anterior y series pos-embolización con coils."
  },
  "lab": {
    "full": "Laboratorio Cerebral",
    "title": "Brain Lab",
    "long": true,
    "lede": "Mucho de lo que conocemos sobre los mapas cerebrales proviene de neurocirujanos que estimularon la corteza en pacientes despiertos. En el Laboratorio Cerebral puede replicar estos experimentos y diseccionar las estructuras profundas.",
    "meta": [
      [
        "Atlas",
        "118 regiones anatómicas"
      ],
      [
        "Herramientas",
        "Estimular · Diseccionar"
      ],
      [
        "Capas",
        "RMf, FDG-PET, T1, DTI"
      ]
    ],
    "steps": [
      {
        "tag": "Homunculus",
        "h": "Mapeo cortical y homúnculo de Penfield",
        "p": "Haga clic sobre cualquier región de la circunvolución precentral (área motora primaria) o poscentral (área somatosensitiva) para observar cómo el homúnculo corporal responde con movimientos o sensaciones somatotópicas precisas.",
        "facts": [
          [
            "Homúnculo",
            "Representación desproporcionada (manos y cara muy representadas)"
          ],
          [
            "Mapeo intraoperatorio",
            "Técnica estándar para preservar áreas elocuentes en resección tumoral"
          ]
        ]
      },
      {
        "tag": "Dissection",
        "h": "Disección lobar y planos anatómicos profundos",
        "p": "Oculte lóbulos específicos para estudiar el tálamo, los ganglios basales y el hipocampo. Realice cortes transversales, coronales y sagitales sobre la malla tridimensional continua.",
        "facts": [
          [
            "Regiones de corteza",
            "Atlas Harvard–Oxford (96 áreas)"
          ],
          [
            "Estructuras profundas",
            "Tálamo, estriado, amígdala, hipocampo"
          ],
          [
            "Líquido y tronco",
            "Ventrículos, mesencéfalo, puente, bulbo y cerebelo"
          ]
        ]
      }
    ],
    "ctaTitle": "Abrir Laboratorio Cerebral",
    "ctaText": "Interactúe con la corteza mediante estímulos eléctricos simulados, observe la respuesta periférica motora y sensitiva o separe los hemisferios para explorar la anatomía límbica."
  }
};
