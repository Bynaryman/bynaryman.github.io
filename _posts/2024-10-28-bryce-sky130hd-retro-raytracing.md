---
layout: post
title: 90s Retro Raytracing of SKY130HD Cells with Bryce
date: 2024-10-28 19:00:00
description: "Revisiting Bryce to raytrace SKY130HD standard cells with a retro twist."
tags: silicon art raytracing retro bryce
categories: arte-science
---

% ### Why Bryce Still Matters
% 
% I have been staring at the SKY130HD full adder slice for a while, looking for a way to give it the VHS sci-fi treatment it deserves.  
% Digging out **Bryce** felt like the right tool: its 90s renderer still has this hyper saturated global illumination that makes silicon gradients look like liquid chrome.  
% After exporting the cell geometry and tweaking the camera to exaggerate perspective, I could finally lean into that nostalgic plastic vibe.
% 
% ### Brushing the Cell Array
% 
% The goal was not to stay faithful to the cleanroom view. I skewed the tessellation, pushed the emissive maps, and layered volumetric fog so the routing looks like a skyline at dusk.  
% Because Bryce thrives on boolean primitives, the full adder layout was replicated as modular blocks, each slightly offset with random seed lights to avoid a sterile repetition.  
% The finishing touch was adding a slow orbiting key light to fake the kind of highlight sweep you would see in a VHS promo reel.
% 
% ### Render Deck
% 
% The trio below shows the main hero frame and two alternates I kept from the pathtracer queue. They all lean on the same material stack but with different fog lengths and color grading to explore how the diffusion plays out around the metal layers.

<div class="row mt-4">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/sky130hd-retro-raytrace-1.png" class="img-fluid rounded z-depth-2" zoomable=true alt="Primary neon render of the SKY130HD full adder slice in Bryce." %}
    </div>
</div>
<div class="caption text-center mt-2">
    **Main hero frame with the magenta skylight cutting through the metal stack.**
</div>

<div class="row mt-4">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/sky130hd-retro-raytrace-2.png" class="img-fluid rounded z-depth-2" zoomable=true alt="Alternate Bryce render with teal fog enveloping the SKY130HD cells." %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/sky130hd-retro-raytrace-3.png" class="img-fluid rounded z-depth-2" zoomable=true alt="Wide angle Bryce render highlighting the repeated SKY130HD full adder slices." %}
    </div>
</div>
<div class="caption text-center mt-2">
    **Alternates with colder diffusion and a wide angle crop to show the staggered replication.**
</div>

### What Is Next

I still want to merge this treatment back into an animation pass, probably reusing the rhythm from the cell placement animations I am working on.  
%For now the stills scratch the itch: Bryce plus a slice of SKY130HD silicon feels like the right mix of nostalgia and tapeout celebration.