---
layout: post
title: ADA Wavetables
date: 2024-08-24 19:00:00
description: "Sampling my cat and performing Wavetable synthesis out of it"
tags: videos art wavetable music synthesis
categories: arte-science
---

With a final objective that diverges from this, i.e., building a mega drone out of a video, I ended up sampling my cat to play around with a Python library called [osc_gen](https://github.com/harveyormston/osc_gen), which is made to craft wavetables. After a few modifications, I took the direction of playing around with the visualization class helper they provide and added this rotating 3D wireframe.

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include video.liquid path="assets/video/rotation_movie.mp4" class="img-fluid rounded z-depth-2" controls=true autoplay=true loop=true %}
    </div>
</div>
<div class="caption text-center mt-2">
    **Spinning the wireframe made of the aggregation of the 32 waves of 128 points representing what my cat could sound like.**
</div>

Another nice objective was to be able to use the wavetable in a music production software like **Ableton**. The only thing to know was that Ableton needs 1024-point cycles. Then, split the generated wav to build the different cycles, and it can perform interpolation on top of that or keep the user table as is.

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/ableton_waveforms.jpg" class="img-fluid rounded z-depth-2" zoomable=true %}
    </div>
</div>
<div class="caption text-center mt-2">
    **Few lines of code to generate rich wavetables readable in modern DAWs such as Ableton 11.**
</div>