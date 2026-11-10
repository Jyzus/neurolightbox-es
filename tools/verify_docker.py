#!/usr/bin/env python3
"""SPEC-003 (pack 71316c2a): build and verify the real Docker image over HTTP."""
import hashlib
import json
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'


def docker(*arguments):
    return subprocess.check_output(['docker', *arguments], cwd=ROOT, text=True).strip()


def fetch(base, path, headers=None):
    request = urllib.request.Request(base + path, headers=headers or {})
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status, response.headers, response.read()
    except urllib.error.HTTPError as response:
        return response.code, response.headers, response.read()


def verify():
    assert (ROOT / 'Dockerfile').is_file(), 'SPEC-003: debe existir Dockerfile raíz'
    assert (ROOT / '.dockerignore').is_file(), 'SPEC-003: excluir fuentes ajenas al sitio'
    name = 'neurolightbox-qa-' + uuid.uuid4().hex[:12]
    image = 'neurolightbox-es:verify'
    subprocess.run(['docker', 'build', '-t', image, '.'], cwd=ROOT, check=True)
    try:
        docker('run', '--detach', '--name', name, '--health-interval=1s',
               '--health-start-period=0s', '-p', '127.0.0.1::80', image)
        port = docker('port', name, '80/tcp').rsplit(':', 1)[1]
        base = 'http://127.0.0.1:' + port
        deadline = time.monotonic() + 20
        while True:
            info = json.loads(docker('inspect', name))[0]
            if info.get('State', {}).get('Health', {}).get('Status') == 'healthy':
                break
            assert info['State']['Running'], 'El proceso principal debe permanecer ejecutándose'
            assert time.monotonic() < deadline, 'SPEC-003: healthcheck no alcanzó healthy'
            time.sleep(0.25)
        assert info['Config']['Healthcheck']['Test'], 'La imagen debe incluir healthcheck'
        assert '80/tcp' in info['Config']['ExposedPorts']
        types = {'.html': 'text/html', '.js': 'application/javascript',
                 '.css': 'text/css', '.json': 'application/json',
                 '.png': 'image/png', '.svg': 'image/svg+xml'}
        count = 0
        for asset in sorted(SITE.rglob('*')):
            if not asset.is_file():
                continue
            relative = asset.relative_to(SITE).as_posix()
            status, headers, content = fetch(base, '/' + relative, {'Accept-Encoding': 'gzip'})
            assert status == 200, (relative, status)
            # Explicitly request identity for byte comparisons of text assets.
            status, headers, content = fetch(base, '/' + relative)
            expected_type = types[asset.suffix]
            assert headers.get_content_type() == expected_type, (relative, headers.get('Content-Type'))
            assert hashlib.sha256(content).digest() == hashlib.sha256(asset.read_bytes()).digest(), relative
            assert headers.get('Cache-Control') == 'no-cache', (relative, headers.get('Cache-Control'))
            assert headers.get('X-Content-Type-Options') == 'nosniff'
            if asset.suffix == '.png':
                _, compressed_headers, _ = fetch(base, '/' + relative, {'Accept-Encoding': 'gzip'})
                assert compressed_headers.get('Content-Encoding') is None, 'No recomprimir PNG'
            count += 1
        status, headers, root = fetch(base, '/')
        assert status == 200 and root == (SITE / 'index.html').read_bytes()
        status, headers, body = fetch(base, '/healthz')
        assert status == 200 and body == b'ok\n' and headers.get_content_type() == 'text/plain'
        for missing in ['/js/missing-worker.js', '/data/missing.png', '/no-such-route', '/orig/', '/tools/']:
            assert fetch(base, missing)[0] == 404, missing
        actual = set(docker('exec', name, 'find', '/usr/share/nginx/html', '-type', 'f').splitlines())
        expected = {'/usr/share/nginx/html/' + file.relative_to(SITE).as_posix()
                    for file in SITE.rglob('*') if file.is_file()}
        assert actual == expected, 'El document root debe contener exclusivamente site'
        print(f'PASS SPEC-003: {count} assets exactos y MIME correctos; raíz, 404, healthy y PNG sin gzip.')
        print('PASS SPEC-003: imagen contiene únicamente site en el document root; QA usa puerto local aleatorio.')
    finally:
        subprocess.run(['docker', 'rm', '--force', name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


if __name__ == '__main__':
    verify()
