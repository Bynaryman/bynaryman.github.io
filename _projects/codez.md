---
layout: page
title: Codez
description: Annotated code figures in Typst and CeTZ, with line, region, and character anchors.
img: assets/img/projects/codez.png
img_alt: An annotated MLIR code excerpt rendered with Codez.
importance: 9
category: work
github: https://github.com/Bynaryman/codez
github_stars: Bynaryman/codez
---

Codez is a Typst package for placing annotated code inside CeTZ figures. Code remains addressable by line, marked region, and character, so arrows and labels can follow the code's geometry.

{% include figure.liquid path="assets/img/projects/codez.png" alt="An MLIR excerpt with annotations positioned using Codez." %}

## Use in Typst

```typst
#import "@preview/codez:0.1.0": *
#show: init.with()
```

The API includes `parse` for the source, `mark` and `mark-char` for selections, `bbox-mark` for their bounds, and `cetz-block` for rendering. Named anchors let the surrounding diagram refer to those regions without manually estimating coordinates.

I use it for research figures, slides, and posters that combine code with structural annotations. The README contains complete CeTZ examples, including annotations of the linear projections and SwiGLU operation in a Llama implementation.
