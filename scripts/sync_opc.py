#!/usr/bin/env python3
"""Import the OPC allocation lecture and make a portable local-presenter bundle.

Run `make all` in the OPC repository first, then pass that repository as the
positional argument. Only selected teaching sources and outputs are published;
the inherited PowerPoints, assessments, student records and Git data are omitted.
"""
import argparse
import html as html_lib
import json
from pathlib import Path
import re
import shutil
import subprocess
import zipfile

SITE = Path(__file__).resolve().parents[1]
DESTINATION = SITE / "assets/courses/opc/2026-2027"
DECKS = ("01-allocation",)
TERMINAL = re.compile(
    r'<div class="terminal-example" data-example="([a-z0-9-]+)" data-file="([a-z0-9/.-]+)">(.*?)</div>', re.DOTALL
)
EXAMPLE_TITLES = {
    "01-malloc": "100 integers",
    "03-leak": "Pointer assignment and strings",
    "04-array": "Array elements and addresses",
    "05-string": "A string and its terminator",
    "06-matrix-flat": "Matrix in one block",
    "07-matrix-rows": "Matrix with a fixed row-pointer table",
    "08-matrix-dynamic": "Matrix with an allocated row-pointer table",
    "09-struct-padding": "Structure padding",
    "10-nested-struct": "Nested structures",
    "14-memory-layout": "Static and automatic storage",
    "19-types": "Enumerations and structure members",
}
DOWNLOAD_CSS = """.reveal .terminal-example a { color: #00502e; text-decoration: underline; }
.reveal .terminal-example a:focus-visible { outline: 3px solid #003b80; outline-offset: 3px; }
"""
BUNDLE_MAKEFILE = """PYTHON ?= python3
.PHONY: help serve present slides pdf figures
help:
	@echo 'make serve | present | slides | pdf | figures'
serve:
	$(PYTHON) scripts/present.py
present: slides serve
slides:
	quarto render cours --to revealjs
pdf:
	quarto render cours --to beamer
figures:
	$(PYTHON) scripts/diagrams.py
"""
BUNDLE_README = """# OPC · C programming

Louis Ledoux · ISTIC, University of Rennes · 2026–2027

English adaptation of A. Kritikakou's OPC teaching material. Allocation and
user-defined types follow CM/CM-all-2025.pptx, slides 281–312.
Original PowerPoints are not included in this bundle.
See cours/SOURCE-MAP.md for coverage and cours/assets/ATTRIBUTIONS.md for credits.
Original authorship is retained; this bundle does not grant a new blanket licence.

## Present and run C

Open cours/_output/01-allocation.html in Firefox. No server is needed.
Install GCC, Make and Valgrind on Linux or WSL, then run:

```sh
cd demos/00-allocation
vim main.c
make run
vim checkpoints/03-missing-free.c
make run STEP=03-missing-free       # Enter 100
make valgrind STEP=03-missing-free  # Observe the leak; add free after printf
```

Each slide shows its source file and command. Run the command inside that
example's folder. See demos/00-allocation/README.md for the saved versions,
and docs/allocation-runbook.md for the 90-minute sequence and repairs.

## Rebuild or print

Rendered slides and PDFs are included. To rebuild, install Quarto and run
make slides. PDF rendering (make pdf) also requires LuaLaTeX, Beamer and the
DejaVu fonts. To change diagrams, edit cours/figures and run make figures
(Python 3, LuaLaTeX, TikZ and Poppler required).

PDFs have one slide per page. Select four pages per sheet when printing.
"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="OPC repository containing cours/_output")
    source = parser.parse_args().source.resolve()
    output = source / "cours/_output"
    rendered = [output / "assets"]
    for deck in DECKS:
        rendered.extend(output / name for name in (f"{deck}.html", f"{deck}.pdf", f"{deck}_files"))
    for path in rendered:
        if not path.exists():
            parser.error(f"Missing {path}; render both formats with make all first.")

    # Use Git's teaching-file inventory, never a recursive copy of the course root.
    tracked = subprocess.check_output(
        ["git", "-C", str(source), "ls-files", "-z", "cours", "demos", "scripts/live-c-editor"],
        text=True,
    ).split("\0")
    sources = [Path(name) for name in tracked if name and not name.startswith(("cours/notebooks/", "cours/examples/"))
               and name not in {"cours/PLAN.md", "cours/.gitignore", "demos/README.md"}
               and (not name.endswith(".qmd") or Path(name).stem in DECKS)]
    sources += [Path("scripts") / name for name in ("present.py", "c_runner.py", "valgrind.sh", "diagrams.py")]
    sources.append(Path("docs/allocation-runbook.md"))
    for path in sources:
        if not (source / path).is_file():
            parser.error(f"Missing source file: {path}")

    # Validate the known export shape before changing the website assets.
    static_html = {}
    examples = set()
    diagrams = set()
    for deck in DECKS:
        html = (output / f"{deck}.html").read_text()
        diagrams.update(re.findall(r'assets/diagrams/([a-z0-9-]+)\.svg', html))
        cues = list(TERMINAL.finditer(html))
        if not cues or "RevealLiveC," in html:
            parser.error(f"Unrecognized terminal-demo markup in {deck}; update this exporter.")
        for match in cues:
            name, file = match[1], match[2]
            example_dir = (source / "demos" / name).resolve()
            source_file = (example_dir / file).resolve()
            if not source_file.is_relative_to(example_dir) or not source_file.is_file():
                parser.error(f"Missing or invalid example: {name}/{file}")
            examples.add(name)
        qmd = (source / "cours" / f"{deck}.qmd").read_text()
        examples.update(re.findall(r'demos/([a-z0-9-]+)/', qmd))
        # Make the existing path a download link without adding another slide row.
        html = TERMINAL.sub(
            lambda match: match[0].replace(
                f'<code>demos/{match[1]}/{match[2]}</code>',
                f'<a href="examples/{match[1]}/{match[2]}" download><code>demos/{match[1]}/{match[2]}</code></a>'
            ), html,
        )
        html = html.replace("</head>", '<link rel="stylesheet" href="downloads.css">\n</head>')
        static_html[deck] = html

    # This version directory is entirely generated; remove stale lecture assets.
    if DESTINATION.exists():
        shutil.rmtree(DESTINATION)
    DESTINATION.mkdir(parents=True)
    for path in rendered:
        target = DESTINATION / path.name
        if path.is_dir():
            if target.exists():
                shutil.rmtree(target)
            shutil.copytree(path, target)
        else:
            shutil.copy2(path, target)
    for file in (DESTINATION / "assets/diagrams").iterdir():
        if file.stem not in diagrams:
            file.unlink()
    for deck, html in static_html.items():
        (DESTINATION / f"{deck}.html").write_text(html)
        shutil.rmtree(DESTINATION / f"{deck}_files/libs/revealjs/plugin/reveal-live-c", ignore_errors=True)
    (DESTINATION / "downloads.css").write_text(DOWNLOAD_CSS)
    for name in sorted(examples):
        target = DESTINATION / "examples" / name
        target.mkdir(parents=True, exist_ok=True)
        for file in (source / "demos" / name).rglob("*.c"):
            copy = target / file.relative_to(source / "demos" / name)
            copy.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(file, copy)

    page = ['---', 'layout: page', 'title: OPC · C examples', 'permalink: /courses/opc/examples/',
            'description: Source files for the dynamic memory lecture.', 'nav: false', '---', '',
            "[Course and download]({{ '/courses/opc/' | relative_url }})", '',
            'Start with `demos/00-allocation/main.c`. The saved steps below develop the same program.', '',
            '## Allocation and memory errors', '']
    def show_code(name, step, label, file, opened=False):
        text = (source / 'demos' / name / file).read_text()
        text = re.sub(r'^[ \t]*// slide:[^\n]*\n', '', text, flags=re.MULTILINE)
        page.extend([f'<details id="{name}-{step}" markdown="1"' + (' open>' if opened else '>'),
                     f'<summary>{html_lib.escape(label)}</summary>', '',
                     '`demos/' + name + '/' + file + '`', '',
                     "[Download C]({{ '/assets/courses/opc/2026-2027/examples/" + name + '/' + file + "' | relative_url }})", '',
                     '```c', text.rstrip(), '```', '', '</details>', ''])
    stages = json.loads((source / 'demos/00-allocation/steps.json').read_text())
    for index, stage in enumerate(stages):
        show_code('00-allocation', stage['id'], stage['label'], stage['file'], opened=index == 0)
    page.extend(['## Other examples', ''])
    for name in sorted(examples - {'00-allocation'}):
        show_code(name, 'main', EXAMPLE_TITLES.get(name, name), 'main.c')
    (SITE / '_pages/opc-examples.md').write_text('\n'.join(page))

    with zipfile.ZipFile(DESTINATION / "opc-course.zip", "w", zipfile.ZIP_DEFLATED) as archive:
        for relative in sorted(sources):
            name = relative.as_posix()
            if relative.parts[0] == "demos" and len(relative.parts) > 2 and relative.parts[1] not in examples:
                continue
            if name.startswith(("cours/figures/", "cours/assets/diagrams/")) and relative.stem not in diagrams | {"style"}:
                continue
            if name == "cours/_quarto.yml":
                config = (source / relative).read_text()
                config = re.sub(r'^    - ([^\n]+)\.qmd\n',
                                lambda match: match[0] if match[1] in DECKS else "", config, flags=re.MULTILINE)
                archive.writestr("opc-course/" + name, config)
            elif name == "cours/SOURCE-MAP.md":
                coverage = (source / relative).read_text().split("## Linked lists: unchanged previous migration")[0]
                archive.writestr("opc-course/" + name, coverage.rstrip() + "\n")
            else:
                archive.write(source / relative, "opc-course/" + name)
        for path in rendered:
            files = sorted(path.rglob("*")) if path.is_dir() else [path]
            for file in files:
                if file.is_file():
                    if file.parent.name == "diagrams" and file.stem not in diagrams:
                        continue
                    archive.write(file, "opc-course/" + file.relative_to(source).as_posix())
        archive.writestr("opc-course/Makefile", BUNDLE_MAKEFILE)
        archive.writestr("opc-course/README.md", BUNDLE_README)
    print(f"Imported {len(DECKS)} decks, PDFs, {len(examples)} example downloads and opc-course.zip into {DESTINATION}")


if __name__ == "__main__":
    main()
