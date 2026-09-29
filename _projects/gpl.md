---
layout: page
title: OpenROAD placement experiments
description: Placement visualisation and image-derived blockage experiments in OpenROAD.
img: assets/img/arith-2026-tutorial/openroad-arith-placement.png
img_alt: OpenROAD placement visualization from the arithmetic tutorial.
importance: 8
category: work
github: https://github.com/Bynaryman/gpl
github_stars: Bynaryman/gpl
---

This repository contains my modifications to OpenROAD's global placer for recording placement evolution and experimenting with image-derived blockages. It extends the OpenROAD/RePlAce implementation.

{% include figure.liquid path="assets/img/arith-2026-tutorial/openroad-arith-placement.png" alt="OpenROAD displaying an arithmetic circuit placement." %}

## Watch placement evolve

With the modified build and OpenROAD-flow-scripts, a placement run can open the GUI:

```sh
make DESIGN_CONFIG=./designs/asap7/aes/config.mk OR_ARGS=-gui place
```

The README enables placement visualisation with this Tcl command before global placement:

```tcl
global_placement_debug -pause 1 -update 1 -initial -draw_bins
```

## Image-derived blockages

The image conversion script treats black pixels as blocked regions and white pixels as available placement area. It produces Tcl constraints scaled and centred on the core.

The script's image and geometry settings currently need editing in the source; they are not implemented as command-line options. These experiments support placement visualisation and shaped-layout studies, rather than defining a separately validated placement algorithm.
