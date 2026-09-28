---
layout: page
title: OPC · C programming
permalink: /courses/opc/
description: Dynamic memory allocation and user-defined types in C.
nav: false
---

ISTIC · University of Rennes · 2026–2027 · Louis Ledoux

## Dynamic memory allocation

Stack and heap, `malloc` and `free`, arrays, strings, matrices, and structures.

[Slides]({{ '/assets/courses/opc/2026-2027/01-allocation.html' | relative_url }}) · [PDF]({{ '/assets/courses/opc/2026-2027/01-allocation.pdf' | relative_url }}) · [C examples]({{ '/courses/opc/examples/' | relative_url }}) · [Download course]({{ '/assets/courses/opc/2026-2027/opc-course.zip' | relative_url }}) · [Quiz]({{ '/assets/courses/opc/2026-2027/assets/cm7-quiz.pdf' | relative_url }})

For printing, select **four pages per sheet** in your PDF viewer.

## Run the examples {#run-examples}

Requires GCC, Make and Valgrind on Linux or WSL. Open the slides in Firefox and the C files in Vim.

```sh
unzip opc-course.zip
cd opc-course
firefox cours/_output/01-allocation.html
cd demos/00-allocation
vim main.c
make run
```

Saved versions are in `checkpoints/`. For example:

```sh
vim checkpoints/03-heap.c
make run STEP=03-heap       # Enter 100
make valgrind STEP=04-overrun  # Enter 4; find the error
```
