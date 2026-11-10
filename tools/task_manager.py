#!/usr/bin/env python3
"""
Task Manager for neurolightbox-es.
Orchestrates the extraction of translatable strings into atomic JSON tasks,
manages pending/done queues, applies translations with safe patching,
and verifies structural and runtime integrity with verify.py.
"""

import os
import sys
import json
import subprocess
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
DATA = os.path.join(SITE, 'data')
TASKS_PENDING = os.path.join(ROOT, 'tasks', 'pending')
TASKS_DONE = os.path.join(ROOT, 'tasks', 'done')

GLOSSARY = {
    "MRI": "RM (Resonancia magnética)",
    "CT": "TC (Tomografía computarizada)",
    "PET": "PET (Tomografía por emisión de positrones)",
    "SPECT": "SPECT (Tomografía por emisión de fotón único)",
    "fMRI": "RMf (Resonancia magnética funcional)",
    "EEG": "EEG (Electroencefalografía)",
    "MEG": "MEG (Magnetoencefalografía)",
    "ultrasound": "ecografía / ultrasonido",
    "angiography": "angiografía",
    "DSA": "ASD (Angiografía por sustracción digital)",
    "T1-weighted": "ponderada en T1",
    "T2-weighted": "ponderada en T2",
    "FLAIR": "FLAIR",
    "diffusion-weighted": "ponderada en difusión (DWI)",
    "ADC": "ADC (coeficiente de difusión aparente)",
    "BOLD": "BOLD (dependiente del nivel de oxigenación sanguínea)",
    "ischaemic stroke": "ictus isquémico / infarto cerebral isquémico",
    "haemorrhage": "hemorragia",
    "subarachnoid haemorrhage": "hemorragia subaracnoidea",
    "multiple sclerosis": "esclerosis múltiple",
    "plaque": "placa (desmielinizante)",
    "glioblastoma": "glioblastoma",
    "brainstem": "tronco del encéfalo",
    "basal ganglia": "ganglios basales",
    "frontal lobe": "lóbulo frontal",
    "temporal lobe": "lóbulo temporal",
    "parietal lobe": "lóbulo parietal",
    "occipital lobe": "lóbulo occipital",
    "insula": "ínsula",
    "thalamus": "tálamo",
    "cerebellum": "cerebelo",
    "Neuro Lightbox": "Neuro Lightbox"
}

RULES = [
    "Traducir SOLO los valores de texto al español, con un tono formal, médico, riguroso y pedagógico.",
    "NO traducir identificadores, claves de objetos, ids de modalidad, nombres de archivo ni tags de código.",
    "Conservar siglas técnicas e imagenológicas intactas (MRI, CT, PET, SPECT, fMRI, EEG, MEG, T1, T2, FLAIR, DWI, ADC, BOLD, 3T, TR, TE, TI).",
    "Conservar unidades de medida, cifras numéricas y marcadores de evidencia exactamente en su formato original.",
    "El nombre de la marca 'Neuro Lightbox' no se traduce.",
    "Devolver EXCLUSIVAMENTE el objeto JSON con las mismas claves y los valores traducidos al español."
]

def ensure_dirs():
    os.makedirs(TASKS_PENDING, exist_ok=True)
    os.makedirs(TASKS_DONE, exist_ok=True)

def extract_all():
    """Extracts all translatable text from site/data/*.js and site/index.html into atomic task batches."""
    ensure_dirs()
    print("=== EXTRACTING TRANSLATION TASKS ===")

    # 1. MODS
    extract_mods()
    # 2. METHODS
    extract_methods()
    # 3. CASES (Part 1 and 2)
    extract_cases()
    # 4. STATES
    extract_states()
    # 5. FINDINGS
    extract_findings()
    # 6. ANATOMY
    extract_anatomy()
    # 7. UI SHELL
    extract_ui_shell()

    print("\nAll tasks generated in tasks/pending/.")

def extract_mods():
    script = """
    const fs = require('fs');
    const window = {};
    eval(fs.readFileSync('site/data/mods.js', 'utf8'));
    const items = {};
    window.MODS.forEach((m) => {
      items[m.id + '.name'] = m.name;
      items[m.id + '.how'] = m.how;
      (m.subs || []).forEach(s => {
        items[m.id + '.subs.' + s.id + '.name'] = s.name;
        if (s.desc) items[m.id + '.subs.' + s.id + '.desc'] = s.desc;
      });
    });
    console.log(JSON.stringify(items));
    """
    res = subprocess.run(['node', '-e', script], capture_output=True, text=True, cwd=ROOT)
    if res.returncode != 0: raise RuntimeError(res.stderr)
    items = json.loads(res.stdout)
    task = {
        "task_id": "task_01_mods",
        "target": "site/data/mods.js",
        "description": "Modalidades de neuroimagen (MRI, CT, PET, SPECT, etc.), resúmenes técnicos y submodos",
        "rules": RULES,
        "glossary": GLOSSARY,
        "items": items
    }
    with open(os.path.join(TASKS_PENDING, "task_01_mods.json"), "w", encoding="utf-8") as f:
        json.dump(task, f, indent=2, ensure_ascii=False)
    print(f" -> Generated task_01_mods.json ({len(items)} strings)")

def extract_methods():
    script = """
    const fs = require('fs');
    const window = {};
    eval(fs.readFileSync('site/data/methods.js', 'utf8'));
    const items = {};
    for (const [k, v] of Object.entries(window.METHOD_CARD)) {
      if (v.ds) items[k + '.ds'] = v.ds;
      if (v.kind) items[k + '.kind'] = v.kind;
      if (v.time) items[k + '.time'] = v.time;
    }
    console.log(JSON.stringify(items));
    """
    res = subprocess.run(['node', '-e', script], capture_output=True, text=True, cwd=ROOT)
    if res.returncode != 0: raise RuntimeError(res.stderr)
    items = json.loads(res.stdout)
    task = {
        "task_id": "task_02_methods",
        "target": "site/data/methods.js",
        "description": "Tarjetas pedagógicas y de física de los métodos de escaneo",
        "rules": RULES,
        "glossary": GLOSSARY,
        "items": items
    }
    with open(os.path.join(TASKS_PENDING, "task_02_methods.json"), "w", encoding="utf-8") as f:
        json.dump(task, f, indent=2, ensure_ascii=False)
    print(f" -> Generated task_02_methods.json ({len(items)} strings)")

def extract_cases():
    script = """
    const fs = require('fs');
    const window = {};
    eval(fs.readFileSync('site/data/cases.js', 'utf8'));
    const part1 = {}, part2 = {};
    window.CASES.forEach((c, idx) => {
      const target = idx < 7 ? part1 : part2;
      const prefix = 'case_' + c.id;
      if (c.hx) target[prefix + '.hx'] = c.hx;
      if (c.report) target[prefix + '.report'] = c.report;
      if (c.teach) target[prefix + '.teach'] = c.teach;
      if (Array.isArray(c.dx)) {
        c.dx.forEach((choice, cidx) => {
          target[prefix + '.dx.' + cidx] = choice;
        });
      }
    });
    console.log(JSON.stringify({ part1, part2 }));
    """
    res = subprocess.run(['node', '-e', script], capture_output=True, text=True, cwd=ROOT)
    if res.returncode != 0: raise RuntimeError(res.stderr)
    data = json.loads(res.stdout)
    task1 = {
        "task_id": "task_03_cases_part1",
        "target": "site/data/cases.js",
        "description": "Casos clínicos de lectura de escáneres (Casos 1 al 7)",
        "rules": RULES,
        "glossary": GLOSSARY,
        "items": data['part1']
    }
    task2 = {
        "task_id": "task_04_cases_part2",
        "target": "site/data/cases.js",
        "description": "Casos clínicos de lectura de escáneres (Casos 8 al 15)",
        "rules": RULES,
        "glossary": GLOSSARY,
        "items": data['part2']
    }
    with open(os.path.join(TASKS_PENDING, "task_03_cases_part1.json"), "w", encoding="utf-8") as f:
        json.dump(task1, f, indent=2, ensure_ascii=False)
    with open(os.path.join(TASKS_PENDING, "task_04_cases_part2.json"), "w", encoding="utf-8") as f:
        json.dump(task2, f, indent=2, ensure_ascii=False)
    print(f" -> Generated task_03_cases_part1.json ({len(data['part1'])} strings)")
    print(f" -> Generated task_04_cases_part2.json ({len(data['part2'])} strings)")

def extract_states():
    script = """
    const fs = require('fs');
    const window = {};
    eval(fs.readFileSync('site/data/findings.js', 'utf8'));
    const items = {};
    for (const [k, v] of Object.entries(window.STATES || {})) {
      if (typeof v.name === 'string') items['states.' + k + '.name'] = v.name;
      if (typeof v.desc === 'string') items['states.' + k + '.desc'] = v.desc;
    }
    console.log(JSON.stringify(items));
    """
    res = subprocess.run(['node', '-e', script], capture_output=True, text=True, cwd=ROOT)
    if res.returncode != 0: raise RuntimeError(res.stderr)
    items = json.loads(res.stdout)
    task = {
        "task_id": "task_05_states",
        "target": "site/data/findings.js",
        "description": "Estados neurológicos y patológicos (46 patologías: ictus, esclerosis múltiple, etc.)",
        "rules": RULES,
        "glossary": GLOSSARY,
        "items": items
    }
    with open(os.path.join(TASKS_PENDING, "task_05_states.json"), "w", encoding="utf-8") as f:
        json.dump(task, f, indent=2, ensure_ascii=False)
    print(f" -> Generated task_05_states.json ({len(items)} strings)")

def extract_findings():
    script = """
    const fs = require('fs');
    const window = {};
    eval(fs.readFileSync('site/data/findings.js', 'utf8'));
    const items = {};
    for (const [k, v] of Object.entries(window.FINDINGS || {})) {
      if (v.title) items['findings.' + k + '.title'] = v.title;
      if (v.what) items['findings.' + k + '.what'] = v.what;
      if (v.why) items['findings.' + k + '.why'] = v.why;
      if (v.look) items['findings.' + k + '.look'] = v.look;
    }
    console.log(JSON.stringify(items));
    """
    res = subprocess.run(['node', '-e', script], capture_output=True, text=True, cwd=ROOT)
    if res.returncode != 0: raise RuntimeError(res.stderr)
    items = json.loads(res.stdout)
    task = {
        "task_id": "task_06_findings",
        "target": "site/data/findings.js",
        "description": "Hallazgos y signos radiológicos de neuroimagen (infartos, sangrado, placas)",
        "rules": RULES,
        "glossary": GLOSSARY,
        "items": items
    }
    with open(os.path.join(TASKS_PENDING, "task_06_findings.json"), "w", encoding="utf-8") as f:
        json.dump(task, f, indent=2, ensure_ascii=False)
    print(f" -> Generated task_06_findings.json ({len(items)} strings)")

def extract_anatomy():
    script = """
    const fs = require('fs');
    const window = {};
    eval(fs.readFileSync('site/data/anatomy.js', 'utf8'));
    const items = {};
    for (const [k, v] of Object.entries(window.REGION_INFO || {})) {
      if (v.fn) items['region.' + k + '.fn'] = v.fn;
      if (v.clin) items['region.' + k + '.clin'] = v.clin;
    }
    (window.GROUP_ORDER || []).forEach((g, idx) => {
      items['group.' + idx] = g;
    });
    for (const [k, v] of Object.entries(window.PART_LABEL || {})) {
      items['part.' + k] = v;
    }
    console.log(JSON.stringify(items));
    """
    res = subprocess.run(['node', '-e', script], capture_output=True, text=True, cwd=ROOT)
    if res.returncode != 0: raise RuntimeError(res.stderr)
    items = json.loads(res.stdout)
    task = {
        "task_id": "task_07_anatomy",
        "target": "site/data/anatomy.js",
        "description": "Anatomía cerebral funcional, lóbulos y somatotopía",
        "rules": RULES,
        "glossary": GLOSSARY,
        "items": items
    }
    with open(os.path.join(TASKS_PENDING, "task_07_anatomy.json"), "w", encoding="utf-8") as f:
        json.dump(task, f, indent=2, ensure_ascii=False)
    print(f" -> Generated task_07_anatomy.json ({len(items)} strings)")

def extract_ui_shell():
    # Key translatable strings in index.html
    items = {
        "ui.header.practice": "Practice",
        "ui.header.sound": "Sound",
        "ui.hero.title": "Neuro Lightbox",
        "ui.hero.subtitle": "Brain imaging you can explore in 3D: walk through the scanner, read real scans, and stimulate the cortex.",
        "ui.hero.explore_btn": "Explore the brain",
        "ui.hero.read_scans": "Read scans",
        "ui.nav.methods": "Imaging methods",
        "ui.share.title": "Link to this exact view",
        "ui.share.desc": "Scan, brain state, plane, slice, angle and slide position.",
        "ui.share.copy": "Copy",
        "ui.share.copied": "Copied",
        "ui.loading.brain": "Loading the reference brain",
        "ui.loading.sub": "Compatibility preview · three orthogonal T1 slices"
    }
    task = {
        "task_id": "task_08_ui_shell",
        "target": "site/index.html",
        "description": "Textos de la interfaz de usuario, navegación y modal de enlace",
        "rules": RULES,
        "glossary": GLOSSARY,
        "items": items
    }
    with open(os.path.join(TASKS_PENDING, "task_08_ui_shell.json"), "w", encoding="utf-8") as f:
        json.dump(task, f, indent=2, ensure_ascii=False)
    print(f" -> Generated task_08_ui_shell.json ({len(items)} strings)")

def apply_task(task_path):
    """Applies translated items back into target file and immediately runs verify.py."""
    if not os.path.exists(task_path):
        print(f"Error: Task file not found: {task_path}")
        sys.exit(1)

    with open(task_path, 'r', encoding='utf-8') as f:
        task = json.load(f)

    task_id = task.get('task_id', os.path.basename(task_path))
    target_rel = task['target']
    target_file = os.path.join(ROOT, target_rel)
    items = task['items']

    print(f"=== APPLYING TRANSLATION: {task_id} ===")
    print(f"Target file: {target_rel} ({len(items)} items)")

    # Execute safe patcher depending on target
    if target_rel.endswith('.js'):
        patcher = """
        const fs = require('fs');
        const file = process.argv[1];
        const items = JSON.parse(process.argv[2]);
        let code = fs.readFileSync(file, 'utf8');

        // Evaluate in sandbox
        const window = {};
        global.window = window;
        global.document = { querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {} };
        eval(code);

        // Apply deep updates
        for (const [path, val] of Object.entries(items)) {
          const parts = path.split('.');
          let curr = window;
          if (parts[0] === 'case') {
            // cases array
            const cid = parseInt(parts[0].replace('case_', ''));
            const c = (window.CASES || []).find(x => x.id === cid);
            if (c) {
              if (parts[1] === 'dx') c.dx[parseInt(parts[2])] = val;
              else c[parts[1]] = val;
            }
            continue;
          }
          if (window.MODS && window.MODS.some(m => m.id === parts[0])) {
            const m = window.MODS.find(x => x.id === parts[0]);
            if (parts[1] === 'name') m.name = val;
            else if (parts[1] === 'how') m.how = val;
            else if (parts[1] === 'subs') {
              const s = m.subs.find(x => x.id === parts[2]);
              if (s) {
                if (parts[3] === 'name') s.name = val;
                else if (parts[3] === 'desc') s.desc = val;
              }
            }
            continue;
          }
          // Generic object traversal
          for (let i = 0; i < parts.length - 1; i++) {
            if (curr[parts[i]] !== undefined) curr = curr[parts[i]];
            else break;
          }
          const last = parts[parts.length - 1];
          if (curr && curr[last] !== undefined) {
            curr[last] = val;
          }
        }

        // Reserialize target object cleanly
        // Depending on file:
        if (file.includes('mods.js')) {
          fs.writeFileSync(file, 'const MODS = window.MODS = ' + JSON.stringify(window.MODS, null, 2) + ';\n', 'utf8');
        } else if (file.includes('methods.js')) {
          fs.writeFileSync(file, 'const METHOD_CARD = window.METHOD_CARD = ' + JSON.stringify(window.METHOD_CARD, null, 2) + ';\n', 'utf8');
        } else if (file.includes('cases.js')) {
          fs.writeFileSync(file, 'const CASES = window.CASES = ' + JSON.stringify(window.CASES, null, 2) + ';\n', 'utf8');
        } else if (file.includes('findings.js')) {
          const out = 'const VESSELS = window.VESSELS = ' + JSON.stringify(window.VESSELS, null, 2) + ';\n\n' +
                      'const PLAQUES = window.PLAQUES = ' + JSON.stringify(window.PLAQUES, null, 2) + ';\n\n' +
                      'const STATES = window.STATES = ' + JSON.stringify(window.STATES, null, 2) + ';\n\n' +
                      'const FINDINGS = window.FINDINGS = ' + JSON.stringify(window.FINDINGS, null, 2) + ';\n\n' +
                      'const MRS = window.MRS = ' + JSON.stringify(window.MRS, null, 2) + ';\n\n' +
                      'const MRS_LABELS = window.MRS_LABELS = ' + JSON.stringify(window.MRS_LABELS, null, 2) + ';\n\n' +
                      'const TCD = window.TCD = ' + JSON.stringify(window.TCD, null, 2) + ';\n';
          fs.writeFileSync(file, out, 'utf8');
        } else if (file.includes('anatomy.js')) {
          const out = 'const REGION_INFO = window.REGION_INFO = ' + JSON.stringify(window.REGION_INFO, null, 2) + ';\n\n' +
                      'const GROUP_COLORS = window.GROUP_COLORS = ' + JSON.stringify(window.GROUP_COLORS, null, 2) + ';\n\n' +
                      'const GROUP_ORDER = window.GROUP_ORDER = ' + JSON.stringify(window.GROUP_ORDER, null, 2) + ';\n\n' +
                      'const SOMATO = window.SOMATO = ' + JSON.stringify(window.SOMATO, null, 2) + ';\n\n' +
                      'const PART_LABEL = window.PART_LABEL = ' + JSON.stringify(window.PART_LABEL, null, 2) + ';\n\n' +
                      'window.stimEffect = ' + window.stimEffect.toString() + ';\n\n' +
                      'window.cap = ' + window.cap.toString() + ';\n';
          fs.writeFileSync(file, out, 'utf8');
        }
        console.log('Successfully patched ' + file);
        """
        res = subprocess.run(['node', '-e', patcher, target_file, json.dumps(items)], capture_output=True, text=True, cwd=ROOT)
        if res.returncode != 0:
            print("Patching failed:", res.stderr)
            sys.exit(1)
        print(res.stdout.strip())
    elif target_rel.endswith('.html'):
        with open(target_file, 'r', encoding='utf-8') as fp:
            html = fp.read()
        for k, val in items.items():
            if k == "ui.hero.subtitle":
                html = re.sub(r'Brain imaging you can explore in 3D: walk through the scanner, read real scans, and stimulate the cortex\.', val, html)
            elif k == "ui.hero.explore_btn":
                html = re.sub(r'>Explore the brain<', f'>{val}<', html)
            elif k == "ui.hero.read_scans":
                html = re.sub(r'>Read scans<', f'>{val}<', html)
            elif k == "ui.share.title":
                html = re.sub(r'Link to this exact view', val, html)
            elif k == "ui.share.desc":
                html = re.sub(r'Scan, brain state, plane, slice, angle and slide position\.', val, html)
            elif k == "ui.share.copy":
                html = re.sub(r'>Copy<', f'>{val}<', html)
            elif k == "ui.share.copied":
                html = re.sub(r'>Copied<', f'>{val}<', html)
        with open(target_file, 'w', encoding='utf-8') as fp:
            fp.write(html)
        print(f"Successfully patched {target_file}")

    # Immediately execute verification suite
    print("\nRunning verify.py to validate changes...")
    verify_res = subprocess.run(['python3', 'tools/verify.py'], cwd=ROOT)
    if verify_res.returncode != 0:
        print("\n[ERROR] Verification suite failed after applying task. Rollback recommended.")
        sys.exit(1)
    
    # Move task to done
    done_dest = os.path.join(TASKS_DONE, os.path.basename(task_path))
    if os.path.abspath(task_path) != os.path.abspath(done_dest):
        with open(done_dest, 'w', encoding='utf-8') as fp:
            json.dump(task, fp, indent=2, ensure_ascii=False)
        if os.path.exists(task_path) and task_path.startswith(TASKS_PENDING):
            os.remove(task_path)
    print(f"\n[SUCCESS] Task {task_id} verified and moved to tasks/done/.")

def show_status():
    """Prints translation queue status and language word count."""
    ensure_dirs()
    pending = os.listdir(TASKS_PENDING) if os.path.exists(TASKS_PENDING) else []
    done = os.listdir(TASKS_DONE) if os.path.exists(TASKS_DONE) else []

    print("=== TRANSLATION PIPELINE STATUS ===")
    print(f"Pending tasks: {len(pending)}")
    for p in sorted(pending):
        print(f"  [PENDING] {p}")
    print(f"Completed tasks: {len(done)}")
    for d in sorted(done):
        print(f"  [DONE]    {d}")

    # Check words
    def check_file(p):
        with open(p, 'r', encoding='utf-8', errors='ignore') as f: txt = f.read()
        en = len(re.findall(r'\b(the|and|of|in|for|with|between|from|treatment|symptoms|imaging|scanner|cortex|brain)\b', txt, re.I))
        es = len(re.findall(r'\b(el|la|los|las|de|en|por|con|entre|desde|tratamiento|síntomas|resonancia|escáner|corteza|cerebro)\b', txt, re.I))
        return en, es

    print("\n=== DATA FILES LANGUAGE RATIO ===")
    for f in ['mods.js', 'methods.js', 'cases.js', 'findings.js', 'anatomy.js', 'lab.js']:
        p = os.path.join(DATA, f)
        if os.path.exists(p):
            en, es = check_file(p)
            print(f"{f:15} EN keywords: {en:4} | ES keywords: {es:4}")

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 tools/task_manager.py extract")
        print("  python3 tools/task_manager.py apply tasks/pending/task_XX.json")
        print("  python3 tools/task_manager.py status")
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == 'extract':
        extract_all()
    elif cmd == 'apply':
        if len(sys.argv) < 3:
            print("Usage: python3 tools/task_manager.py apply <path_to_task.json>")
            sys.exit(1)
        apply_task(sys.argv[2])
    elif cmd == 'status':
        show_status()
    else:
        print(f"Unknown command: {cmd}")

if __name__ == '__main__':
    main()
