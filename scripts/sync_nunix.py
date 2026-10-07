#!/usr/bin/env python3
"""Copy NUnix exports and package the course. Run make all in NUnix first."""
import argparse
from pathlib import Path
import shutil
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("source", type=Path, help="NUnix repository")
source = parser.parse_args().source.resolve()
output = source / "cours/_output"
destination = Path(__file__).resolve().parents[1] / "assets/courses/nunix/2026-2027"
decks = ("01-unix-shell", "02-investigation", "03-bash-scripting", "04-exercises")
layouts = ("2x1", "2x2", "3x2", "2x3")
exports = [output / "assets"]
for deck in decks:
    exports.extend(output / name for name in (f"{deck}.html", f"{deck}.pdf", f"{deck}_files"))
    exports.extend(output / f"{deck}-{layout}.pdf" for layout in layouts)
sources = [source / name for name in ("README.md", "Makefile", "cours/_quarto.yml",
                                     "docs/anecdotes.md", "scripts/print_handouts.py")]
sources.extend(source / "cours" / f"{deck}.qmd" for deck in decks)
for name in ("assets", "styles", "filters"):
    sources.extend(p for p in (source / "cours" / name).rglob("*") if p.is_file())
for path in exports + sources:
    if not path.exists():
        parser.error(f"Missing {path}; run make all in the course repository.")

destination.mkdir(parents=True, exist_ok=True)
for path in exports:
    target = destination / path.name
    if path.is_dir():
        if target.exists():
            shutil.rmtree(target)
        shutil.copytree(path, target)
    else:
        shutil.copy2(path, target)

with zipfile.ZipFile(destination / "nunix-course.zip", "w", zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(sources):
        archive.write(path, "nunix-course/" + path.relative_to(source).as_posix())
    for path in sorted(destination.rglob("*")):
        if path.is_file() and path.suffix != ".zip":
            archive.write(path, "nunix-course/cours/_output/" + path.relative_to(destination).as_posix())
print(f"Published course files to {destination}")
