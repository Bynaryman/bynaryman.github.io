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
BUTTON = re.compile(
    r'<button type="button" class="live-c-button" data-live-example="([a-z0-9-]+)"(?: data-live-stage="([a-z0-9-]+)")?>Run live C ↗</button>'
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
DOWNLOAD_CSS = """.reveal a.c-example-download {
  display: inline-block; font-size: 36px; font-weight: 650;
  color: #006644; background: #fff; border: 2px solid #006644;
  padding: .35em .65em; border-radius: 4px; text-decoration: none;
}
.reveal a.c-example-download:hover { color: #00502e; border-color: #00502e; }
.reveal a.c-example-download:focus-visible { outline: 3px solid #003b80; outline-offset: 3px; }
@media print { .c-example-download { display: none !important; } }
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

## Start the slides and live C

On Linux or WSL, install Python 3, GCC, Make and Valgrind using your system's
package manager. From this extracted opc-course directory, run:

```sh
make serve
```

Open http://127.0.0.1:8877/01-allocation.html. Keep the terminal running; Ctrl+C stops
it. Choose Run live C, edit the highlighted C source, and Compile & run (Ctrl+Enter).
Select Valgrind for memory diagnostics. Each run compiles a fresh native program.
The local presenter executes trusted code as your user; it is not a sandbox.
Save permanent edits in demos/<example>/main.c; browser edits are temporary.

You can also run examples in a terminal, from this course directory:

```sh
cd demos/00-allocation
vim main.c
make run
make valgrind
```

Start with the four-element array in main.c. The Step menu and
demos/00-allocation/README.md give seven saved versions of the same program.
To run a checkpoint in the terminal, use make run STEP=03-heap and enter 100.

Some examples deliberately contain errors. See their README files and
docs/allocation-runbook.md for the intended investigation and repair sequence.

## View or rebuild

For static viewing, open the HTML or PDFs in cours/_output. PDFs contain one slide
per page; your PDF viewer can print four pages per sheet. Static HTML opened as
a file displays the slides, but live C requires the presenter above.

Rendered slides are included: Quarto is not required for make serve.
To rebuild, install Quarto and run make slides, or make present to rebuild and
start the presenter. PDF rendering (make pdf) additionally requires LuaLaTeX,
Beamer, DejaVu Sans and DejaVu Sans Mono. To change a diagram, edit its TikZ source
under cours/figures and run make figures (LuaLaTeX, TikZ and Poppler required).
The C editor is already bundled; rebuilding it is documented in
cours/_extensions/live-c/README.md.
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
    source_files = {}
    diagrams = set()
    for deck in DECKS:
        html = (output / f"{deck}.html").read_text()
        diagrams.update(re.findall(r'assets/diagrams/([a-z0-9-]+)\.svg', html))
        buttons = list(BUTTON.finditer(html))
        names = [match[1] for match in buttons]
        if not names or "RevealLiveC," not in html:
            parser.error(f"Unrecognized live-C markup in {deck}; update this exporter.")
        for name in names:
            if not (source / "demos" / name / "main.c").is_file():
                parser.error(f"Missing example: {name}")
        examples.update(names)
        # Included code regions also need their sources, even without a button.
        qmd = (source / "cours" / f"{deck}.qmd").read_text()
        examples.update(re.findall(r'file="\.\./demos/([a-z0-9-]+)/', qmd))
        for match in buttons:
            name, step = match[1], match[2]
            file = "main.c"
            if step:
                stages = json.loads((source / "demos" / name / "steps.json").read_text())
                selected = next(item for item in stages if item["id"] == step)
                file = selected["file"]
            source_files[(name, step)] = file
        html = BUTTON.sub(
            lambda match: f'<a class="c-example-download" href="examples/{match[1]}/{source_files[(match[1], match[2])]}" '
                          f'download="{match[1]}-{match[2] or "main"}.c" aria-label="Download C example: {match[1]}">Download C example ↓</a>',
            html,
        )
        # Public slides offer downloads. Keep the original live plugin in the ZIP.
        html = re.sub(r'^.*<(?:script|link)\b[^\n]*reveal-live-c/[^\n]*\n', "", html, flags=re.MULTILINE)
        html = html.replace("RevealLiveC,", "")
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
        shutil.rmtree(DESTINATION / f"{deck}_files/libs/revealjs/plugin/reveal-live-c")
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
