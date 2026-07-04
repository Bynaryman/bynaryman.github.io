---
layout: post
title: "ARITH 2026: CIRCT Tutorial and Mathematical Intent on Silicon"
date: 2026-07-04 00:00:00
description: "A short report from ARITH 2026, where I co-ran a CIRCT tutorial with Sam Coward and demoed Emeraude-MLIR, HAriCo, and OpenROAD."
tags: arith mlir circt openroad tutorial demo arithmetic
categories: science
---

At [ARITH 2026](https://www.arith2026.org/), I was happy to co-run the tutorial **Optimizing Datapath Circuits with MLIR and CIRCT** with [Sam Coward](https://github.com/cowardsa). The tutorial was part of the [ARITH tutorial day](https://www.arith2026.org/tutorial_day.html), on Saturday June 27, 2026, and focused on a question I care about a lot: how compiler infrastructure can make hardware design more inspectable, transformable, and testable.

The hands-on material is available here:
[cowardsa/CIRCT_TUTORIAL_2026](https://github.com/cowardsa/CIRCT_TUTORIAL_2026).
The tutorial slides are also in the repository:
[CIRCT_DEMO_2026_SLIDES.pdf](https://github.com/cowardsa/CIRCT_TUTORIAL_2026/blob/main/CIRCT_DEMO_2026_SLIDES.pdf).

<div class="row mt-4">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/arith-2026-tutorial/circt-tutorial-title.png" class="img-fluid rounded z-depth-2" zoomable=true alt="Title slide for the CIRCT Tutorial at ARITH 2026." %}
    </div>
</div>
<div class="caption text-center mt-2">
    <strong>Tutorial slide deck:</strong> a practical entry point to CIRCT as compiler infrastructure for hardware.
</div>

## The Tutorial

The ARITH tutorial page described the session as a brief overview of how compiler technologies can offer another route into EDA. In practice, that meant starting from small circuits and moving through concrete compiler operations rather than staying at the slogan level.

The material walked through:

- parsing Verilog into CIRCT IR,
- applying passes such as range narrowing and canonicalization,
- checking transformations with `circt-lec`,
- emitting Verilog with `firtool`,
- moving toward datapath synthesis and AIGER output.

I liked this format because it made CIRCT feel less like a large infrastructure project and more like something participants could actually touch. You could edit a circuit, run a pass, ask whether the result was equivalent, and see where the hardware representation changed.

## The Demo

During the ARITH demo session on Monday June 29, 2026, I also showed **Printing Mathematical Intent onto Silicon with Emeraude-MLIR, HAriCo, and OpenROAD**, listed in the [ARITH program](https://www.arith2026.org/program.html#demo-session).

The pitch was deliberately direct: I want to keep mathematical intent visible long enough that it can influence the silicon we eventually generate. The demo connected three parts of my current stack:

- **Emeraude-MLIR** to carry tensor, DSP, and arithmetic structure through progressive lowering,
- **HAriCo** to materialize arithmetic circuits in a compiler-friendly way,
- **OpenROAD** to make the result land in physical design rather than stop at abstract RTL.

<div class="row mt-4">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/arith-2026-tutorial/arith-demo-title.png" class="img-fluid rounded z-depth-2" zoomable=true alt="Title slide for Printing Mathematical Intent onto Silicon, the ARITH 2026 demo by Louis Ledoux." %}
    </div>
</div>
<div class="caption text-center mt-2">
    <strong>Demo framing:</strong> from mathematical expressions and compiler IR down to generated layouts.
</div>

One of the examples starts from Python tensor code shaped like an LLM feed-forward sublayer. Another starts from a Faust audio DSP expression. They are intentionally different front ends, but they share the same constraint: useful arithmetic structure should not disappear before the compiler has a chance to act on it.

For the visual part, I showed an OpenROAD placement animation from a generated systolic-array layout. The video is here:

<div class="row mt-4">
    <div class="col-sm mt-3 mt-md-0">
        <div style="position:relative; padding-bottom:56.25%;" class="img-fluid rounded z-depth-2">
            <iframe
                style="width:100%; height:100%; position:absolute; left:0; top:0;"
                frameborder="0"
                allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                title="ARITH Demo Systolic array 6x7 FloPoCo with modified OpenROAD"
                src="https://www.youtube.com/embed/JVrL7V2_sT0">
            </iframe>
        </div>
    </div>
</div>
<div class="caption text-center mt-2">
    <strong>Showoff video:</strong> a 6x7 FloPoCo systolic-array placement run with a modified OpenROAD visualization flow.
</div>

<div class="row mt-4">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/arith-2026-tutorial/openroad-arith-placement.png" class="img-fluid rounded z-depth-2" zoomable=true alt="OpenROAD placement frame showing a colored arithmetic layout shaped like an ARITH logo." %}
    </div>
</div>
<div class="caption text-center mt-2">
    <strong>One placement frame from the demo:</strong> physical design as both evidence and communication material.
</div>

## Why I Liked Animating This

The most useful conversations around this work usually happen when the abstraction layers are visible at the same time. A tutorial makes the compiler machinery approachable. A demo makes the physical consequences tangible. ARITH was a good place to bring those two modes together: formal enough to discuss correctness and arithmetic, but close enough to the tools that people could ask practical questions about passes, verification, and layout.

That balance is exactly where I want this line of work to keep moving.

Useful links:

- [ARITH 2026 tutorial day](https://www.arith2026.org/tutorial_day.html)
- [ARITH 2026 program and demo session](https://www.arith2026.org/program.html#demo-session)
- [CIRCT tutorial repository](https://github.com/cowardsa/CIRCT_TUTORIAL_2026)
- [Demo video](https://www.youtube.com/watch?v=JVrL7V2_sT0)
