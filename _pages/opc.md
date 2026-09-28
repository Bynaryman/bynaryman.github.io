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

Requires Python 3, GCC, Make and Valgrind on Linux or WSL.

Start with `demos/00-allocation/main.c`. Its saved steps build the same program from a fixed array to `malloc` and `free`.

```sh
unzip opc-course.zip
cd opc-course
make serve
```

Open [the local slides](http://127.0.0.1:8877/01-allocation.html) and click **Run live C**. Choose a saved version in the **Step** menu, or edit the code directly. Keep the terminal open; **Ctrl+C** stops the server.
