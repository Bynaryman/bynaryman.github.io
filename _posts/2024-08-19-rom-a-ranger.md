---
layout: post
title: ROM à ranger
date: 2024-08-19 19:00:00
description: "I have been experimenting with unveiling and sorting frame pixels to showcase the Teras design."
tags: videos art tapeout raytracing sorting
categories: arte-science
---

Exploring the 2D projection of a ray-traced render of one of my taped-out chips, I implemented an algorithm that partially sorts pixels by color within each column. Each frame in the sequence is progressively sorted to varying degrees, culminating in a video that transitions smoothly from a disordered to an ordered state. The final video is then reversed, creating a seamless infinite loop.

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include video.liquid path="assets/video/merged_output_video.mp4" class="img-fluid rounded z-depth-2" controls=true autoplay=true loop=true%}
    </div>
</div>
<div class="caption">
	Consistently arranging, re-arranging, de-arranging pixels or standard cells.
</div>
