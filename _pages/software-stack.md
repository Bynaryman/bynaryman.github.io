---
layout: page
title: software-stack
permalink: /software-stack/
nav: false
description: Research software map from model/kernel entry to silicon evidence
---

## Compilation flow

Kernel or model → MLIR transformations → arithmetic generation → CIRCT / RTL → physical implementation → evaluation.

## Components

### Front-end and ingestion

- [MLModelMLIRGEN](/projects/mlmodelmlirgen/): exports model artifacts from PyTorch to MLIR.
- Faust and tensor kernels as entry points (DSP + AI use cases).

### Arithmetic-aware compilation

- [Emeraude-MLIR](/projects/emeraude-mlir/): custom dialects and lowering passes.
- HAriCo/FloPoCo direction for explicit arithmetic materialization.

### HDL and interop

- [VH2V](/projects/vh2v/): VHDL-to-Verilog bridge where needed for OSS flow compatibility.

### Physical implementation and campaign orchestration

- [SUF](/projects/suf/): reproducible campaign orchestration over open EDA flows.
- [OpenROAD-GPL Experiments](/projects/gpl/): placement-centric experiments and visualization.

### Layout post-processing and communication

- [gdsiistl](/projects/gdsiistl/): GDS to STL pipeline.
- [Codez](/projects/codez/): annotated code visuals for talks/posters.

## Evaluation

Generated circuits are evaluated with physical design tools to test arithmetic and compiler cost models.
