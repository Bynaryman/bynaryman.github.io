---
layout: page
title: gdsiistl
description: Extrude GDSII process layers into STL meshes for 3D rendering.
img: assets/img/sky130hd-retro-raytrace-1.png
img_alt: Artistic render of SKY130 full-adder layers extracted with gdsiistl.
importance: 7
category: work
github: https://github.com/Bynaryman/gdsiistl
github_stars: Bynaryman/gdsiistl
---

gdsiistl extrudes selected GDSII layers into separate STL meshes. I adapted the conversion for SKY130 and added external process-layer mappings, including an IHP SG13G2 example.

{% include figure.liquid path="assets/img/sky130hd-retro-raytrace-1.png" alt="Ray-traced SKY130 full-adder geometry extracted from GDSII." caption="A rendered full-adder layout. The geometry comes from the chip layout; materials and lighting are presentation choices." %}

## Convert a layout

```sh
python gdsiistl.py example/example.gds
python gdsiistl.py --pdk-script example/ihp_bicmos_sg13g2.py inputs/tt_um_lledoux_s3fdp_seqcomb.gds
```

The converter uses NumPy, gdspy, numpy-stl, and Triangle. A process mapping defines which layers to extrude and their vertical positions. The resulting meshes can be imported into a 3D renderer.

The output is intended for visualisation. The README records triangulation offsets and extra triangles around polygon holes; meshes are not guaranteed to be watertight or geometrically exact manufacturing models.
