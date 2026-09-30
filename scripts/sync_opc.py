#!/usr/bin/env python3
"""Import the OPC lectures and make a portable local-presenter bundle.

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
DECKS = ("01-allocation", "02-linked-lists")
PRINT_LAYOUTS = ("2x1", "2x2", "3x2")
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
.PHONY: help serve present slides pdf handouts figures
help:
	@echo 'make serve | present | slides | pdf | handouts | figures'
serve:
	$(PYTHON) scripts/present.py
present: slides serve
slides:
	$(PYTHON) scripts/teacher_cues.py
	$(PYTHON) scripts/linked_list_guide.py --notes-only
	quarto render cours --to revealjs
pdf:
	$(PYTHON) scripts/teacher_cues.py
	$(PYTHON) scripts/linked_list_guide.py --notes-only
	quarto render cours --to beamer
handouts:
	$(PYTHON) scripts/print_handouts.py
figures:
	$(PYTHON) scripts/diagrams.py
"""
BUNDLE_README = """# OPC · C programming

Louis Ledoux · ISTIC, University of Rennes · 2026–2027

## Slides and C examples

Open cours/_output/01-allocation.html in Firefox. No server is needed.
The continuation is cours/_output/02-linked-lists.html.
Follow docs/allocation-runbook.md for the teaching sequence.
Files 01 through 18 are numbered references, not a command to run on every slide.
Install GCC, Make and Valgrind on Linux or WSL, then run:

```sh
cd demos/allocation
vim 01-copy-alias.c
make run FILE=01-copy-alias.c
```

For live edits use working copies as described in the runbook.
Ask for predictions before each run; reveal explanations afterward.
Open a numbered reference only for a prepared comparison or recovery.
For example: make valgrind FILE=08-dangling.c (enter 4).
Files 01–04 develop a string copy, fixing its size and then its leak.
Files 11 and 12 are optional references, outside the slide sequence.
File 05 introduces integers; 06–09 each introduce one fault into 05-integers.c.
Repair and rerun each before continuing. See docs/allocation-runbook.md.

For linked lists, follow docs/linked-lists-runbook.md. Work in demos/linked-lists,
copy 00-empty.c to live-list.c, then use make run or make valgrind.
The runbook names the checkpoints to copy for each operation.

## Rebuild or print

Rendered HTML and PDF are included. Rebuild with Quarto: make slides.
PDF rendering also needs LuaLaTeX, Beamer and DejaVu fonts: make pdf.
Edit TikZ diagrams in cours/figures and run make figures (Poppler required).
The regular PDF has one slide per page. Files ending in -2x1.pdf, -2x2.pdf and
-3x2.pdf arrange slides in columns x rows on A4 landscape sheets. Print these
with one PDF page per sheet. Rebuild them with make handouts after make pdf;
install pypdf and reportlab in your Python environment first.

## Sources

Required content: A. Kritikakou's CM/CM-all-2025.pptx, slides 281–355.
See cours/SOURCE-MAP.md and cours/assets/ATTRIBUTIONS.md. Original authorship
is retained; this bundle does not grant a new blanket licence.
Original PowerPoints are not included.
"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="OPC repository containing cours/_output")
    source = parser.parse_args().source.resolve()
    output = source / "cours/_output"
    rendered = [output / "assets"]
    for deck in DECKS:
        rendered.extend(output / name for name in (f"{deck}.html", f"{deck}.pdf", f"{deck}_files"))
        rendered.extend(output / f"{deck}-{layout}.pdf" for layout in PRINT_LAYOUTS)
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
    sources += [Path("scripts") / name for name in ("present.py", "c_runner.py", "valgrind.sh", "diagrams.py", "teacher_cues.py", "linked_list_guide.py", "print_handouts.py")]
    sources.extend([Path("docs/allocation-runbook.md"), Path("docs/allocation-teacher-cues.json")])
    sources.extend([Path("docs/linked-lists-runbook.md"), Path("docs/linked-lists-teacher-cues.json")])
    for path in sources:
        if not (source / path).is_file():
            parser.error(f"Missing source file: {path}")

    # Validate the known export shape before changing the website assets.
    static_html = {}
    examples = set()
    diagrams = set()
    for deck in DECKS:
        html = (output / f"{deck}.html").read_text()
        themes = re.findall(r'href="([^"?]*dist/theme/[^"?]+\.css)"', html)
        if not themes or not any("--cast-shadow" in (output / theme).read_text() for theme in themes):
            parser.error(f"Stale HTML theme in {deck}; run make slides before exporting.")
        diagrams.update(re.findall(r'assets/diagrams/([a-z0-9-]+)\.svg', html))
        cues = list(TERMINAL.finditer(html))
        required_id = "start-code" if deck == "01-allocation" else "section-build"
        if "RevealLiveC," in html or f'id="{required_id}"' not in html:
            parser.error(f"Unrecognized deck in {deck}; update this exporter.")
        examples.add("allocation" if deck == "01-allocation" else "linked-lists")
        for match in cues:
            name, file = match[1], match[2]
            example_dir = (source / "demos" / name).resolve()
            source_file = (example_dir / file).resolve()
            if not source_file.is_relative_to(example_dir) or not source_file.is_file():
                parser.error(f"Missing or invalid example: {name}/{file}")
            examples.add(name)
        qmd = (source / "cours" / f"{deck}.qmd").read_text()
        examples.update(re.findall(r'demos/([a-z0-9-]+)/', qmd))
        examples.discard("reference")
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
        for relative in sources:
            if relative.parts[:2] != ("demos", name) or not (
                relative.suffix in {".c", ".h", ".json", ".md"} or relative.name == "Makefile"
            ):
                continue
            file = source / relative
            copy = target / file.relative_to(source / "demos" / name)
            copy.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(file, copy)

    page = ['---', 'layout: page', 'title: OPC · C examples', 'permalink: /courses/opc/examples/',
            'description: C files in lecture order.', 'nav: false', '---', '',
            "[Course and download]({{ '/courses/opc/' | relative_url }})", '',
            'References **01 → 18**, all in `demos/allocation/`. Follow the lecture runbook for when to run.', '',
            '```sh', 'cd demos/allocation', 'vim 01-copy-alias.c',
            'make run FILE=01-copy-alias.c', '```', '',
            'Files 01–04 develop a string copy: shared storage, a missing byte, a leak, then the repair. '
            'Files 11 and 12 are optional references, outside the slide sequence. '
            'File 05 introduces integers; each of 06–09 introduces one fault into 05-integers.c. Repair and rerun each.', '']
    stages = json.loads((source / 'demos/allocation/steps.json').read_text())
    page.extend(["[Structure starter]({{ '/assets/courses/opc/2026-2027/examples/allocation/types-start.c' | relative_url }}) · copy to `live-types.c` for incremental coding.", ''])
    section = None
    for index, stage in enumerate(stages):
        if stage['section'] != section:
            section = stage['section']
            page.extend(['## ' + section, ''])
        file = stage['file']
        text = (source / 'demos/allocation' / file).read_text()
        text = re.sub(r'^[ \t]*// slide:[^\n]*\n', '', text, flags=re.MULTILINE)
        mode = 'valgrind' if stage['mode'] == 'valgrind' else 'run'
        page.extend([f'<details id="{stage["id"]}" markdown="1"' + (' open>' if index == 0 else '>'),
                     f'<summary>{file} · {html_lib.escape(stage["label"])}</summary>', '',
                     '```sh', f'vim {file}', f'make {mode} FILE={file}', '```', ''])
        if stage['stdin']:
            page.extend(['Enter **' + stage['stdin'].strip() + '**.', ''])
        page.extend(["[Download C]({{ '/assets/courses/opc/2026-2027/examples/allocation/" + file + "' | relative_url }})", '',
                     '```c', text.rstrip(), '```', '', '</details>', ''])
    page.extend(['## Linked lists {#linked-lists}', '',
                 'Use the checkpoints named in the lecture. Work in `demos/linked-lists/`:', '',
                 '```sh', 'cp -n 00-empty.c live-list.c', 'vim live-list.c',
                 'make run', 'make valgrind', '```', '',
                 'Files 03, 06 and 09 deliberately leak; compare them with the following repair.', '',
                 "[Shared helper]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/list-support.h' | relative_url }}) · "
                 "[Makefile]({{ '/assets/courses/opc/2026-2027/examples/linked-lists/Makefile' | relative_url }})", '',
                 '<!-- prettier-ignore -->', '| Checkpoint | Expected output |', '|---|---|'])
    for stage in json.loads((source / 'demos/linked-lists/steps.json').read_text()):
        file = stage['file']
        result = stage['stdout'].strip().replace('\n', ' / ')
        link = "{{ '/assets/courses/opc/2026-2027/examples/linked-lists/" + file + "' | relative_url }}"
        page.append(f'| [{file}]({link}) | `{result}` |')
    (SITE / '_pages/opc-examples.md').write_text('\n'.join(page).rstrip() + '\n')

    with zipfile.ZipFile(DESTINATION / "opc-course.zip", "w", zipfile.ZIP_DEFLATED) as archive:
        for relative in sorted(sources):
            name = relative.as_posix()
            if relative.parts[0] == "demos" and len(relative.parts) > 2 and relative.parts[1] not in examples | {"reference"}:
                continue
            if name.startswith(("cours/figures/", "cours/assets/diagrams/")) and relative.stem not in diagrams | {"style"} and not relative.stem.startswith("_"):
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
