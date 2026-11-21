#!/usr/bin/env python3
"""Import only the public TR-Rack build; never copy a local hardware build."""
from pathlib import Path
import hashlib
import json
import shutil
import sys

source = Path(sys.argv[1]).resolve()
site = Path(__file__).resolve().parents[1]
target = (site / 'apps/tr-rack').resolve()
if source.name != 'dist-public' or target.parent != site / 'apps':
    raise SystemExit('Use the editor dist-public build and the website apps/tr-rack directory.')
files = [p for p in source.rglob('*') if p.is_file()]
allowed_fonts = {'Sora-Regular.ttf', 'Sora-Semibold.ttf', 'Sora-OFL.txt', 'VT323-Regular.woff2', 'VT323-OFL.txt'}
def allowed(path):
    rel = path.relative_to(source)
    return rel.as_posix() in {'index.html', 'favicon.svg'} or (len(rel.parts) == 2 and ((rel.parts[0] == 'assets' and rel.suffix in {'.js', '.css'}) or (rel.parts[0] == 'fonts' and rel.name in allowed_fonts)))
if not files or any(not allowed(p) for p in files):
    raise SystemExit('Unexpected files in public build. Refusing to publish private data.')
html = (source / 'index.html').read_text(encoding='utf-8')
if '/apps/tr-rack/assets/' not in html:
    raise SystemExit('Build must target /apps/tr-rack/.')
expected = {p.relative_to(source) for p in files} | {Path('release.json')}
if target.exists():
    for stale in target.rglob('*'):
        if stale.is_file() and stale.relative_to(target) not in expected:
            if not stale.resolve().is_relative_to(target):
                raise SystemExit('Unexpected path outside public app directory.')
            stale.unlink()
for path in files:
    dest = target / path.relative_to(source)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, dest)
manifest = {'version': '0.2.0', 'files': {p.relative_to(source).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
(target / 'release.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(f'Imported {len(files)} public files to {target}; no SysEx captures.')
