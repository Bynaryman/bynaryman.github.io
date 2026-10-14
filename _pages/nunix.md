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

Three lectures of 90 minutes, with slides and exercises in English.

{% include nunix_lectures.liquid %}

[Download course]({{ '/assets/courses/nunix/2026-2027/nunix-course.zip' | relative_url }}) · [Source repository](https://gitlab.inria.fr/lledoux/cours-nunix-l3-miage)

Print layouts use **columns × rows on A4 landscape paper**. Print one PDF page per sheet.

The ZIP includes slides, TD/TP worksheets, practical files and editable Quarto sources. Extract it and open
`nunix-course/cours/_output/01-unix-shell.html` in a browser.

The examples use Bash and standard GNU tools, available on the university's Linux machines.

## TD and TP

The worksheets use the Unix exercises from OPC, in English.

| Session | Topics | Worksheet |
|---|---|---|
| TD1 | Patterns, redirections, script arguments and searches | [PDF]({{ '/assets/courses/nunix/2026-2027/TD/td1.pdf' | relative_url }}) · [HTML]({{ '/assets/courses/nunix/2026-2027/TD/td1.html' | relative_url }}) |
| TP1–2 | Terminal commands, environment variables, redirections, scripts and processes | [PDF]({{ '/assets/courses/nunix/2026-2027/TP/TP1-2-Unix/tp1-2.pdf' | relative_url }}) · [HTML]({{ '/assets/courses/nunix/2026-2027/TP/TP1-2-Unix/tp1-2.html' | relative_url }}) |

[Download TP files]({{ '/assets/courses/nunix/2026-2027/TP/TP1-2-Unix/tp-files.zip' | relative_url }}).
Extract the ZIP and run `make` in its `files` directory to build the two supplied
programs. This requires `make` and a C compiler.
