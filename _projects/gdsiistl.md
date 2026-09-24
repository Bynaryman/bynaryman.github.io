---
layout: page
title: gdsiistl
description: Convert GDS layouts into layered STL meshes for 3D visualization and mediation
img: assets/img/sky130hd-retro-raytrace-1.png
img_alt: Artistic render of SKY130 full-adder layers extracted with gdsiistl.
importance: 7
category: work
github: https://github.com/Bynaryman/gdsiistl
github_stars: Bynaryman/gdsiistl
---

`gdsiistl` converts GDSII layouts into STL meshes by extruding selected process layers.

## Practical Use

I adapted it for SKY130-centric workflows and external PDK mappings so generated layouts can be turned into 3D visuals for analysis and outreach.

That made it useful both for:

- inspecting geometric outcomes of open tapeouts,
- and producing communication assets that keep chip geometry grounded in real layout data.

## Links

- Repository: <https://github.com/Bynaryman/gdsiistl>
- SKY130 layer reference: <https://skywater-pdk.readthedocs.io/en/main/rules/layers.html#gds-layers-information>
