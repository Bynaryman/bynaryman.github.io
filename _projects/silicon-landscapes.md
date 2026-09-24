---
layout: page
title: Silicon Landscapes
description: Bryce renders made from the physical layers of a SKY130 full adder.
img: assets/img/sky130hd-retro-raytrace-2.png
img_alt: Reflective three-dimensional silicon geometry rendered against a Bryce landscape.
importance: 5
category: fun
---

Silicon Landscapes uses the geometry of a SKY130HD full adder as material for 3D images.

{% include figure.liquid path="assets/img/sky130hd-retro-raytrace-2.png" alt="An artistic Bryce render of geometry derived from a SKY130HD full adder." %}

I extract the process layers from GDSII with [gdsiistl](/projects/gdsiistl/), arrange them in Blender, and render them in Bryce. Layer offsets, materials, lighting, and deformation are artistic choices; these images are not physical cross-sections.

{% include figure.liquid path="assets/img/sky130hd-retro-raytrace-3.png" alt="A second Bryce composition using the extracted full-adder layers." %}

[Original image series](/blog/2024/bryce-sky130hd-retro-raytracing/)
