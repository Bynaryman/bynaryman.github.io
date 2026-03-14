---
layout: post
title: My Latest TinyTapeout makes MLIR Arithmetic Silicon-Visible
date: 2026-03-14 00:00:00
description: "A 2x2 TinyTapeout design built from an MLIR loop, carrying a generated floating-point accumulation core down to open silicon."
tags: tinytapeout mlir circt flopoco floating-point silicon
categories: science
---

My latest TinyTapeout project is [`ttsky26a`](https://github.com/Bynaryman/ttsky26a), a compact open-silicon artifact for a compiler question I keep coming back to: how far can I keep arithmetic decisions visible before they collapse into opaque RTL? It also fits directly into the thread running across my [publications](/publications/), my [projects](/projects/), and my broader work on arithmetic-aware compilation.

The chip is called `tt_um_lledoux_s3fdp_seqcomb`. It wraps a generated floating-point accumulation core in a simple byte-stream interface, but the interesting part is the path that produces it: an [MLIR](https://mlir.llvm.org/) loop is specialized, lowered through my arithmetic-oriented flow, passed through [CIRCT](https://github.com/llvm/circt), and exported as SystemVerilog for [TinyTapeout](https://tinytapeout.com/) on [SKY130](https://skywater-pdk.readthedocs.io/en/main/).

<div class="row mt-4">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/tinytapeout-ttsky26a/ttsky26a-art.jpg" class="img-fluid rounded z-depth-2" zoomable=true alt="Artwork generated for the ttsky26a TinyTapeout project, showing a dense silicon-like texture in pale green and black." %}
    </div>
</div>
<div class="caption text-center mt-2">
    **`ttsky26a` as image and artifact:** a tiny chip, but one carrying a full compiler-to-hardware story.
</div>

### Why This One Matters

For integer-heavy hardware flows, the path from high-level IR to explicit structure is already reasonably well served. Floating-point is where things still tend to disappear behind generators or black-box boundaries, exactly when the useful tradeoffs become concrete: area, latency, rounding points, specialization, and structure that could still be optimized.

This TinyTapeout project is a small answer to that gap. Instead of treating the arithmetic block as something external that only appears at the very end, I wanted the generated datapath to remain compiler-visible through the lowering stages. It is closely aligned with my paper [Towards Optimized Arithmetic Circuits with MLIR](https://hal.science/hal-05385229), the EuroLLVM poster [Towards Multi-Level Arithmetic Optimizations](https://hal.science/hal-05063466), the more recent presentation [Arithmetic Lowering with Emeraude-MLIR: Bridging Tensor and DSP Kernels to Silicon Datapaths](https://hal.science/hal-05489427), and the broader background collected in my PhD thesis [Floating-Point Arithmetic Paradigms for High-Performance Computing: Software Algorithms and Hardware Designs](https://hal.science/tel-04754167).

### From MLIR Loop to Chip

The source kernel is intentionally small enough to fit TinyTapeout, but still representative of the kind of multiply-add patterns I care about:

```mlir
scf.for %k = %c0 to %c2 step %c1 {
  %x = memref.load %a[%k] : memref<2xf32>
  %y = memref.load %b[%k] : memref<2xf32>
  %acc = memref.load %c[%c0] : memref<2xf32>
  %m = arith.mulf %x, %y : f32
  %s = arith.addf %acc, %m : f32
  memref.store %s, %c[%c0] : memref<2xf32>
}
```

In the flow used here, that pattern is recognized and lowered toward a specialized S3FDP accumulation core instead of dissolving into generic floating-point logic. The repository keeps multiple IR snapshots, so the structural transition stays inspectable rather than hidden. The exact input kernel lives in [`flow/mlir/s3fdp_loop_accum.mlir`](https://github.com/Bynaryman/ttsky26a/blob/main/flow/mlir/s3fdp_loop_accum.mlir), and the generated stages can be inspected directly in [`generated/ir-stages`](https://github.com/Bynaryman/ttsky26a/tree/main/generated/ir-stages).

<div class="row mt-4">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/tinytapeout-ttsky26a/ttsky26a-comb.png" class="img-fluid rounded z-depth-2" zoomable=true alt="Compiler-generated MLIR to comb-level view highlighting explicit arithmetic structure before SystemVerilog export." %}
    </div>
</div>
<div class="caption text-center mt-2">
    **A comb-stage view from the flow:** explicit arithmetic structure is still visible before final RTL export.
</div>

The stack behind this artifact is roughly:

- [`MLIR`](https://mlir.llvm.org/) for the source representation and pattern capture
- `emeraude-mlir` for arithmetic-aware lowering and specialization
- my [`FloPoCo2` development branch](https://gitlab.com/flopoco/flopoco/-/tree/dev/lledoux) for compiler-visible arithmetic generation
- [`CIRCT`](https://github.com/llvm/circt) for hardware lowering and SystemVerilog export
- a [TinyTapeout wrapper](https://github.com/Bynaryman/ttsky26a/blob/main/src/project.v) plus [cocotb testbench](https://github.com/Bynaryman/ttsky26a/blob/main/test/test.py) to make the result testable and tapeout-ready

### TinyTapeout Interface

The wrapper keeps things simple. The design consumes a 20-byte input frame, runs the accumulation core, then streams the 32-bit result back out over four bytes. The implementation is visible in [`src/project.v`](https://github.com/Bynaryman/ttsky26a/blob/main/src/project.v) and the generated arithmetic core in [`src/generated/s3fdp_core.sv`](https://github.com/Bynaryman/ttsky26a/blob/main/src/generated/s3fdp_core.sv):

- `a[2]` as two `f32` values
- `b[2]` as two `f32` values
- `c0` as the initial `f32` seed
- `3` execution cycles
- `4` output bytes

That gives a full slot cadence of `27` cycles per transaction.

<div class="row mt-4">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/tinytapeout-ttsky26a/ttsky26a-waves.png" class="img-fluid rounded z-depth-2" zoomable=true alt="Simulation waveform showing byte-fed input loading, execution delay, and streamed result output for the TinyTapeout wrapper." %}
    </div>
</div>
<div class="caption text-center mt-2">
    **Waveform snapshot:** 20 bytes in, 3 cycles of run time, then 4 bytes out.
</div>

This is also why I like TinyTapeout as a medium. The area is small and the protocol is constrained, but that pressure is useful: if a compiler idea still survives in that format, it usually means the path is honest. In that sense this project also extends some earlier open-silicon directions in my work, including [LLMMMM: Large Language Models Matrix-Matrix Multiplications Characterization on Open Silicon](https://hal.science/hal-04592229) and [The Grafted Superset Approach: Bridging Python to Silicon with Asynchronous Compilation and Beyond](https://hal.science/hal-04587458).

### Reproducible On Purpose

The repository includes the generated SystemVerilog, the intermediate IR stages, the wrapper, and the cocotb-based testbench. That was important to me. The value of this tapeout is not only the final silicon, but the fact that the lowering path remains visible and reproducible all the way through the artifact.

If you want to inspect it directly, the repo is here: [`Bynaryman/ttsky26a`](https://github.com/Bynaryman/ttsky26a). For the surrounding context, you can also browse my [HAL profile](https://cv.hal.science/louis-ledoux), my [publications page](/publications/), and related project pages such as [OSFNTC](/projects/osfntc/) and [SUF](/projects/suf/).

### Related Reading

- [Towards Optimized Arithmetic Circuits with MLIR](https://hal.science/hal-05385229) explains the arithmetic-compiler direction this tapeout is pushing toward silicon.
- [Towards Multi-Level Arithmetic Optimizations](https://hal.science/hal-05063466) gives the EuroLLVM view of the same multi-level optimization thread.
- [Arithmetic Lowering with Emeraude-MLIR: Bridging Tensor and DSP Kernels to Silicon Datapaths](https://hal.science/hal-05489427) connects the MLIR lowering story to tensor and DSP kernels.
- [Floating-Point Arithmetic Paradigms for High-Performance Computing: Software Algorithms and Hardware Designs](https://hal.science/tel-04754167) is the thesis-level background behind many of these arithmetic choices.
- [An Open-Source Framework for Efficient Numerically-Tailored Computations](https://doi.org/10.1109/FPL60245.2023.00011) and the related [OSFNTC project page](/projects/osfntc/) cover the earlier numerically-tailored hardware generation line.
- [LLMMMM: Large Language Models Matrix-Matrix Multiplications Characterization on Open Silicon](https://hal.science/hal-04592229) gives the broader LLM-to-open-silicon context behind some of the workload motivation.
- [FloPoCo and MLIR: a Multi-Level Compilation Framework for Many Intents](https://www.sorbonne-universite.fr/) reflects the same compiler-generator interface from the seminar side.
- Upstream compiler pieces touched by this work include CIRCT's [convert-index-to-uint](https://github.com/llvm/circt/pull/9263) and [multi-result `scf.index_switch` support](https://github.com/llvm/circt/pull/9245).
