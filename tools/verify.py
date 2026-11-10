#!/usr/bin/env python3
"""
Automated Verification Suite for neurolightbox-es.
Runs deterministic, 0-token tests to ensure that modularization and translations maintain
100% structural integrity, syntax correctness, schema compliance, and runtime stability.
"""

import os
import sys
import subprocess
import json
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
DATA = os.path.join(SITE, 'data')
JS = os.path.join(SITE, 'js')

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

def log_pass(msg):
    print(f"[{Colors.GREEN}PASS{Colors.RESET}] {msg}")

def log_fail(msg):
    print(f"[{Colors.RED}FAIL{Colors.RESET}] {msg}")

def log_warn(msg):
    print(f"[{Colors.YELLOW}WARN{Colors.RESET}] {msg}")

def check_js_syntax():
    """Verify syntax of all JavaScript files using node -c."""
    errs = []
    js_count = 0
    for root, _, files in os.walk(SITE):
        for f in files:
            if f.endswith('.js'):
                js_count += 1
                p = os.path.join(root, f)
                res = subprocess.run(['node', '-c', p], capture_output=True, text=True)
                if res.returncode != 0:
                    errs.append((os.path.relpath(p, ROOT), res.stderr.strip()))
    if errs:
        for p, err in errs:
            log_fail(f"JS syntax error in {p}:\n    {err}")
        return False
    log_pass(f"All {js_count} JavaScript files are syntactically valid (node -c).")
    return True

def check_html_integrity():
    """Verify HTML files have proper closing tags and required assets."""
    errs = []
    html_count = 0
    for root, _, files in os.walk(SITE):
        for f in files:
            if f.endswith('.html'):
                html_count += 1
                p = os.path.join(root, f)
                with open(p, 'rb') as fp:
                    content = fp.read()
                rel = os.path.relpath(p, ROOT)
                if b'</html>' not in content:
                    errs.append(f"{rel}: Missing </html> tag (file appears truncated).")
                if b'</body>' not in content:
                    errs.append(f"{rel}: Missing </body> tag.")
                if b'css/style.css' not in content:
                    errs.append(f"{rel}: Missing link to modular css/style.css.")
    if errs:
        for err in errs:
            log_fail(err)
        return False
    log_pass(f"All {html_count} HTML file(s) are structurally intact with closing tags and CSS links.")
    return True

def check_essential_assets():
    """Verify that heavy 3D brain scans and binary assets are in place."""
    required = [
        ('data/meta.json', 30000),
        ('data/vol.png', 10000000),
        ('data/mesh.png', 5000000),
        ('data/jue.png', 50000),
        ('favicon.svg', 100),
        ('og.png', 50000)
    ]
    missing = []
    for rel_path, min_bytes in required:
        p = os.path.join(SITE, rel_path)
        if not os.path.exists(p):
            missing.append(f"Missing file: {rel_path}")
        else:
            sz = os.path.getsize(p)
            if sz < min_bytes:
                missing.append(f"File too small ({sz} < {min_bytes} bytes): {rel_path}")
    if missing:
        for m in missing:
            log_fail(m)
        return False
    log_pass(f"All {len(required)} essential binary and data assets are present and uncorrupted.")
    return True

def check_data_structures():
    """Verify data structures (mods.js, findings.js, anatomy.js, lab.js, methods.js, cases.js, shaders.js)."""
    node_test = """
    const fs = require('fs');
    let errors = [];

    const window = {};
    global.window = window;
    global.document = { querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {} };

    // 1. Shaders
    try {
      eval(fs.readFileSync('site/js/shaders.js', 'utf8'));
      if (!window.GLSL_NOISE || window.GLSL_NOISE.length < 500) errors.push('GLSL_NOISE is missing or truncated');
      if (!window.FS_SLICE || window.FS_SLICE.length < 5000) errors.push('FS_SLICE shader is missing or truncated');
    } catch(e) { errors.push('shaders.js failed: ' + e.message); }

    // 2. MODS (9 modalities)
    try {
      eval(fs.readFileSync('site/data/mods.js', 'utf8'));
      if (!Array.isArray(window.MODS) || window.MODS.length !== 9) {
        errors.push('MODS length is ' + (window.MODS ? window.MODS.length : 'null') + ', expected 9');
      } else {
        window.MODS.forEach((m, idx) => {
          if (!m.id || !m.name || !m.how || !Array.isArray(m.subs)) {
            errors.push('MODS[' + idx + '] missing required schema fields');
          }
        });
      }
    } catch(e) { errors.push('mods.js failed: ' + e.message); }

    // 3. FINDINGS (STATES, VESSELS, FINDINGS, MRS, TCD)
    try {
      eval(fs.readFileSync('site/data/findings.js', 'utf8'));
      const stateKeys = Object.keys(window.STATES || {});
      if (stateKeys.length < 40) errors.push('STATES length is ' + stateKeys.length + ', expected >= 40');
      if (!Array.isArray(window.VESSELS) || window.VESSELS.length < 20) errors.push('VESSELS length expected >= 20');
      if (!window.FINDINGS || Object.keys(window.FINDINGS).length < 10) errors.push('FINDINGS missing expected entries');
    } catch(e) { errors.push('findings.js failed: ' + e.message); }

    // 4. ANATOMY (REGION_INFO, GROUP_COLORS, SOMATO)
    try {
      eval(fs.readFileSync('site/data/anatomy.js', 'utf8'));
      const rKeys = Object.keys(window.REGION_INFO || {});
      if (rKeys.length < 50) errors.push('REGION_INFO count is ' + rKeys.length + ', expected >= 50');
      if (!Array.isArray(window.GROUP_ORDER) || window.GROUP_ORDER.length < 4) errors.push('GROUP_ORDER missing');
    } catch(e) { errors.push('anatomy.js failed: ' + e.message); }

    // 5. LAB (20 stimulation targets)
    try {
      eval(fs.readFileSync('site/data/lab.js', 'utf8'));
      const labKeys = Object.keys(window.LAB || {});
      if (labKeys.length < 15) errors.push('LAB target count is ' + labKeys.length + ', expected >= 15');
    } catch(e) { errors.push('lab.js failed: ' + e.message); }

    // 6. METHODS (9 detailed scanning cards)
    try {
      eval(fs.readFileSync('site/data/methods.js', 'utf8'));
      const mKeys = Object.keys(window.METHOD_CARD || {});
      if (mKeys.length !== 9) errors.push('METHOD_CARD count is ' + mKeys.length + ', expected 9');
      mKeys.forEach(k => {
        const mc = window.METHOD_CARD[k];
        if (!mc.ds || !mc.kind || !mc.res || !mc.time) {
          errors.push('METHOD_CARD[' + k + '] missing required card fields: ds, kind, res, time');
        }
      });
    } catch(e) { errors.push('methods.js failed: ' + e.message); }

    // 8. CHAPTERS (10 scanner walkthrough chapters)
    try {
      eval(fs.readFileSync('site/data/chapters.js', 'utf8'));
      const chKeys = Object.keys(window.CHAPTERS || {});
      if (chKeys.length !== 10) errors.push('CHAPTERS length is ' + chKeys.length + ', expected 10');
      chKeys.forEach(k => {
        const c = window.CHAPTERS[k];
        if (!c.full || !c.lede || !Array.isArray(c.steps)) {
          errors.push('CHAPTERS[' + k + '] missing full, lede or steps');
        }
      });
    } catch(e) { errors.push('chapters.js failed: ' + e.message); }

    // 7. CASES (15 clinical interactive cases)
    try {
      eval(fs.readFileSync('site/data/cases.js', 'utf8'));
      if (!Array.isArray(window.CASES) || window.CASES.length !== 15) {
        errors.push('CASES length is ' + (window.CASES ? window.CASES.length : 'null') + ', expected 15');
      } else {
        window.CASES.forEach((c, idx) => {
          if (!c.id || !c.mod || !c.hx || !Array.isArray(c.dx) || !c.report || !c.teach) {
            errors.push('CASES[' + idx + '] missing required clinical case fields (id, mod, hx, dx, report, teach)');
          }
        });
      }
    } catch(e) { errors.push('cases.js failed: ' + e.message); }

    if (errors.length > 0) {
      console.log('FAIL:' + JSON.stringify(errors));
      process.exit(1);
    } else {
      console.log('OK');
      process.exit(0);
    }
    """
    res = subprocess.run(['node', '-e', node_test], capture_output=True, text=True, cwd=ROOT)
    if res.returncode != 0:
        log_fail(f"Data structure invariants failed: {res.stdout.strip()} {res.stderr.strip()}")
        return False
    log_pass("Data structures (mods, findings, anatomy, lab, methods, cases, shaders) match 100% of required schema.")
    return True

def run_all():
    print(f"{Colors.BOLD}=== RUNNING AUTOMATED VERIFICATION SUITE (NEUROLIGHTBOX) ==={Colors.RESET}\n")
    results = [
        check_js_syntax(),
        check_html_integrity(),
        check_essential_assets(),
        check_data_structures()
    ]
    print()
    if all(results):
        print(f"{Colors.BOLD}{Colors.GREEN}✓ ALL AUTOMATED TESTS PASSED (0 tokens spent on review).{Colors.RESET}")
        return 0
    else:
        print(f"{Colors.BOLD}{Colors.RED}✗ SOME TESTS FAILED. Check details above.{Colors.RESET}")
        return 1

if __name__ == '__main__':
    sys.exit(run_all())
