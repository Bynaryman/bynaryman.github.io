---
layout: post
title: I Won the TinyTapeout Sticker Competition!
date: 2025-12-07 10:00:00
description: "The sticker set built from my GDS-to-raytrace pipeline took first place and earned a free tapeout on the next TinyTapeout shuttle."
tags: tinytapeout stickers gds blender raytracing touchdesigner
categories: arte-science
---

I am happy to share that my sticker set just won the [TinyTapeout sticker design competition](https://tinytapeout.com/competitions/sticker-design-competition/) — and with it, a **free tapeout on a next shuttle**. Huge thanks to everyone who cheered for mixing silicon and art.
(I hope to see these stickers soon in upcoming conferences)

### The Winning Frame (Entry #3)

<div class="row mt-4">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/tinytapeout-stickers/whatisend-3.png" class="img-fluid rounded z-depth-2" zoomable=true alt="Winning TinyTapeout sticker with layered GDS geometry, Japanese-inspired palette, and raytraced highlights." %}
    </div>
</div>
<div class="caption text-center mt-2">
    **Entry #3 — the winner.** GDS geometry turned into a layered logo, 8k raytrace, and a light 2D pass for the printed texture.
</div>

### How It Was Made

- **GDS to solids:** Built with my forked [`gdsiistl`](https://github.com/Bynaryman/gdsiistl) (adapted from Massimo Ballestrini). It auto-scales for SKY130 and other PDKs, splits layers cleanly, and keeps the real routing so the silhouette still belongs to the chip.  
- **Blender raytracing:** The STL stack lives in a Blender scene with a Japanese-inspired palette. Final renders are **8k**, about **3 hours** each, to keep metallic gradients crisp for print.  
- **TouchDesigner pass:** A light 2D treatment adds edge emphasis and procedural noise so the sticker holds contrast at laptop scale.  
- **Payoff:** The set won, unlocking a **free TinyTapeout tapeout** on the next shuttle.

### Other Submissions

<div class="row mt-4">
    <div class="col-md-6 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/tinytapeout-stickers/whatisend-1.png" class="img-fluid rounded z-depth-2" zoomable=true alt="Sticker concept exploring a softer metallic gradient and circuit skyline silhouette." %}
    </div>
    <div class="col-md-6 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/tinytapeout-stickers/whatisend-2.png" class="img-fluid rounded z-depth-2" zoomable=true alt="Sticker concept with brighter ribbon highlights and tighter inner routing lines." %}
    </div>
</div>
<div class="row mt-4">
    <div class="col-12 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/tinytapeout-stickers/whatisend-5.png" class="img-fluid rounded z-depth-2" zoomable=true alt="Sticker concept with bold magenta-to-cyan gradient and clean outlines." %}
    </div>
</div>
<div class="caption text-center mt-2">
    **Alternates:** The full set submitted to TinyTapeout — same GDS base, varied palettes, perspectives, and 2D treatments.
</div>

### What Comes Next

- Package the Blender scene plus gdsiistl settings so others can remix with their own layouts.  
