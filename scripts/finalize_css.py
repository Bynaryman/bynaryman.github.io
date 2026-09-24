#!/usr/bin/env python3
"""Version stylesheet links from the CSS bytes that will actually be deployed."""
import hashlib
from pathlib import Path
import re
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else '_site')
versions = {
    '/assets/css/' + path.name: hashlib.sha256(path.read_bytes()).hexdigest()[:16]
    for path in (root / 'assets/css').glob('*.css')
}
links = re.compile(r'''(?P<attr>\bhref=["'])(?P<path>/[^"'?#]*\.css)(?:\?[^"'#]*)?(?P<end>["'])''')


def version_link(match):
    path = match['path']
    # Preserve a GitHub Pages project-site base URL, if present.
    marker = path.find('/assets/css/')
    digest = versions.get(path[marker:]) if marker >= 0 else None
    if digest is None:
        return match[0]
    return f"{match['attr']}{path}?{digest}{match['end']}"


count = 0
for page in root.rglob('*.html'):
    before = page.read_text()
    after = links.sub(version_link, before)
    if after != before:
        page.write_text(after)
        count += 1
print(f'Updated stylesheet versions in {count} HTML files after CSS pruning.')
