#!/usr/bin/env python3
"""Check local links/assets in generated HTML, including standalone courses."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else '_site').resolve()
origin = 'https://bynaryman.github.io'
errors = []
class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = set()
    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if attrs.get('id'):
            if attrs['id'] in self.ids:
                errors.append(f'{current}: duplicate id {attrs["id"]}')
            self.ids.add(attrs['id'])
        for attr in ['href', 'src', 'poster']:
            if attrs.get(attr): self.links.append(attrs[attr])
        if attrs.get('srcset'):
            self.links.extend(item.strip().split()[0] for item in attrs['srcset'].split(',') if item.strip())

pages = {}
for path in root.rglob('*.html'):
    current = path.relative_to(root).as_posix()
    page = Page()
    page.feed(path.read_text())
    pages[current] = page
for current, page in pages.items():
    for href in page.links:
        url = urlsplit(urljoin(origin + '/' + current, href))
        if url.scheme not in ['http', 'https'] or url.netloc != 'bynaryman.github.io': continue
        target = root / unquote(url.path).lstrip('/')
        if target.is_dir(): target /= 'index.html'
        if not target.is_file():
            errors.append(f'{current}: missing {href}')
        elif url.fragment and target.suffix == '.html':
            key = target.relative_to(root).as_posix()
            # Slide routers and PDF-style page fragments are handled by JavaScript.
            if not key.startswith('assets/') and not url.fragment.startswith(('/', ':~:')) and unquote(url.fragment) not in pages[key].ids:
                errors.append(f'{current}: missing anchor {href}')

home = (root / 'index.html').read_text()
for unwanted in ['googletagmanager.com', 'badge.dimensions.ai', 'MathJax-script', 'd41d8cd98f00b204e9800998ecf8427e']:
    if unwanted in home: errors.append(f'Homepage unexpectedly contains {unwanted}')
draft_slugs = ['codez-for-annotated-research-figures', 'layout-feedback-that-changed-the-optimizer', 'mlir-loop-to-silicon-with-visible-arithmetic', 'ttihp-accumulator-variants', 'openroad-placement-as-a-visual-medium', 'suf-as-a-reproducible-software-to-silicon-instrument']
for slug in draft_slugs:
    if any(slug in name for name in pages): errors.append(f'Deferred blog draft was published: {slug}')
if errors:
    print('\n'.join(sorted(set(errors))))
    sys.exit(1)
print(f'Checked {len(pages)} HTML files: local links, assets, anchors, IDs, homepage scripts, and draft exclusions pass.')
