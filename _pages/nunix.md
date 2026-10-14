---
layout: page
title: NUnix · Unix and Bash
permalink: /courses/nunix/
description: Unix commands, files, permissions, processes, pipes and Bash scripting.
nav: false
---

L3 MIAGE · ISTIC · University of Rennes · 2026–2027

- **Lectures (CM):** Louis Ledoux
- **Tutorials and practical sessions (TD/TP):** Elisabeth Bouriah and Louis Ledoux

Three lectures of 90 minutes in English. TD and TP worksheets are available
in French and English.

{% include nunix_lectures.liquid %}

[Download course]({{ '/assets/courses/nunix/2026-2027/nunix-course.zip' | relative_url }}) · [Source repository](https://gitlab.inria.fr/lledoux/cours-nunix-l3-miage)

Print layouts use **columns × rows on A4 landscape paper**. Print one PDF page per sheet.

The ZIP includes slides, TD/TP worksheets, practical files and editable Quarto sources. Extract it and open
`nunix-course/cours/_output/01-unix-shell.html` in a browser.

The examples use Bash and standard GNU tools, available on the university's Linux machines.

## TD and TP

The TD takes place after the three lectures. The TP covers two sessions:
commands, redirections, scripts, system information and text replacement.

| Worksheet | English | Français |
|---|---|---|
| TD1 · Shell commands | [PDF]({{ '/assets/courses/nunix/2026-2027/TD/td1.pdf' | relative_url }}) · [HTML]({{ '/assets/courses/nunix/2026-2027/TD/td1.html' | relative_url }}) | [PDF]({{ '/assets/courses/nunix/2026-2027/TD/td1-fr.pdf' | relative_url }}) · [HTML]({{ '/assets/courses/nunix/2026-2027/TD/td1-fr.html' | relative_url }}) |
| TP1–2 · Commands and shell scripting | [PDF]({{ '/assets/courses/nunix/2026-2027/TP/TP1-2-Unix/tp1-2.pdf' | relative_url }}) · [HTML]({{ '/assets/courses/nunix/2026-2027/TP/TP1-2-Unix/tp1-2.html' | relative_url }}) | [PDF]({{ '/assets/courses/nunix/2026-2027/TP/TP1-2-Unix/tp1-2-fr.pdf' | relative_url }}) · [HTML]({{ '/assets/courses/nunix/2026-2027/TP/TP1-2-Unix/tp1-2-fr.html' | relative_url }}) |

[Download TP files]({{ '/assets/courses/nunix/2026-2027/TP/TP1-2-Unix/tp-files.zip' | relative_url }}).
Extract the ZIP and run `make` in its `files` directory to build the two supplied
programs. This requires `make` and a C compiler.
