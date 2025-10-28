---
layout: post
title: 90s Retro Raytracing of SKY130HD Cells with Bryce
date: 2024-10-28 19:00:00
description: "Extracting SKY130HD full adder geometry from GDS to Bryce for a 90s retro render pass."
tags: silicon art raytracing retro bryce
categories: arte-science
---

{: .lead }
One slice of **SKY130HD** silicon, a detour through Blender, and a **Bryce 7.1** sky generator later, and the full adder starts looking like a vaporwave artefact.

> #### Pipeline Highlights
> - GDS export via [`gdsiistl`](https://github.com/Bynaryman/gdsiistl) for automated layer-to-STL conversion  
> - Layer-by-layer offsets in **Blender** to fake an exploded stack  
> - 4:5 **Bryce** renders with randomized skies and minimal 90s landscapes
{: .block-tip }

### From GDS to STL

I started with the final **SKY130HD full adder** GDS and pushed it through [`gdsiistl`](https://github.com/Bynaryman/gdsiistl).  
The converter splits the layout per layer and hands me neat STL slices that preserve the actual routing without any manual remodeling.

### Blender Exploded Slice

Those STLs went straight into **Blender**.  
Each layer stayed on its own object, which let me randomize the Z offsets and build a gentle exploded stack of the cell.  
A few hand-tuned vertex edits kept it from looking too uniform, and per-layer materials lined up the palette before export.

### Bryce Render Deck

Blender exported the assembly as OBJ and **Bryce 7.1** took over.  
I rendered everything in a **4:5 aspect ratio**, cycling between chrome, glass, and matte materials while occasionally deforming the mesh to grab different silhouettes of the adder.  
Bryce's **random sky generator** -- with the default preset sprinkled in for contrast -- handled the lighting.  
A minimal 90s water-and-sky plane landscape reflects straight into the silicon, which is exactly the nostalgia hit I was aiming for.  
Letting the Bryce sky engine do the "magic" felt right; the ASIC software already had its turn.

<div class="row mt-4">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/sky130hd-retro-raytrace-1.png" class="img-fluid rounded z-depth-2" zoomable=true alt="Primary 4:5 Bryce render of the exploded SKY130HD full adder stack catching the water reflections." %}
    </div>
</div>
<div class="caption text-center mt-2">
    **Hero frame: random sky generator on, minimal landscape, silicon layers lifted just enough to show daylight between them.**
</div>

<div class="row mt-4">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/sky130hd-retro-raytrace-2.png" class="img-fluid rounded z-depth-2" zoomable=true alt="Alternate 4:5 Bryce render with colder material palette on the SKY130HD layers." %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/sky130hd-retro-raytrace-3.png" class="img-fluid rounded z-depth-2" zoomable=true alt="Wide 4:5 Bryce render with slight mesh warp for a different highlight sweep." %}
    </div>
</div>
<div class="caption text-center mt-2">
    **Alternates: same OBJ, different skies and deformations, letting Bryce decide how the reflections flow across the cell.**
</div>

### What Is Next

Next up is animating the sky so the reflections slide over the lifted layers -- simple camera lock, Bryce sky drifting, and a short loop back into Blender for grading.  
Once that is in place I will share the video and bundle the OBJ for anyone who wants to remix the cell further.
