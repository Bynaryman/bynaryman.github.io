#!/usr/bin/env python3
"""Generate committed responsive assets. Requires Pillow 12.3.0 and ffmpeg."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/img/generated'
OUT.mkdir(exist_ok=True)
sources = {ROOT / 'assets/img/prof_pic.jpg'}
for folder in ['_pages', '_posts', '_projects']:
    for path in (ROOT / folder).glob('*.md'):
        for name in re.findall(r'assets/img/[^\s"\'<>%)]+\.(?:png|jpg|jpeg|gif)', path.read_text()):
            sources.add(ROOT / name)
sources.update((ROOT / 'assets/img/publication_preview').glob('*.png'))
manifest = {}
for path in sorted(sources):
    if not path.is_file():
        raise FileNotFoundError(path)
    image = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    width, height = image.size
    name = path.stem + '-' + hashlib.sha256(path.read_bytes()).hexdigest()[:10]
    variants = []
    for size in sorted({min(width, n) for n in [320, 640, 960, 1440]}):
        target = OUT / f'{name}-{size}.webp'
        if not target.exists():
            image.resize((size, round(size * height / width)), Image.Resampling.LANCZOS).save(target, quality=84, method=6)
        variants.append({'path': '/' + str(target.relative_to(ROOT)), 'width': size})
    manifest[str(path.relative_to(ROOT))] = {'width': width, 'height': height, 'variants': variants, 'src': variants[-1]['path']}

icon = ImageOps.fit(Image.open(ROOT / 'assets/img/8087_art.jpg'), (64, 64), Image.Resampling.LANCZOS)
icon.save(ROOT / 'assets/img/favicon.png', optimize=True)
videos = {}
for path in sorted((ROOT / 'assets/video').glob('*.mp4')):
    poster = OUT / (path.stem + '-poster.jpg')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', '1', '-i', str(path), '-frames:v', '1', '-vf', 'scale=960:-2', str(poster)], check=True)
    videos[str(path.relative_to(ROOT))] = '/' + str(poster.relative_to(ROOT))
(ROOT / '_data/responsive_images.json').write_text(json.dumps(manifest, indent=2) + '\n')
(ROOT / '_data/video_posters.json').write_text(json.dumps(videos, indent=2) + '\n')
print(f'Generated responsive variants for {len(manifest)} images and {len(videos)} video posters.')
