---
layout: page
title: OSFNTC
description: Numerically tailored matrix-multiplication accelerators with OpenBLAS and OpenCAPI integration.
img: assets/img/runtime.jpg
importance: 1
category: work
related_publications: true
github: https://github.com/Bynaryman/OSFNTC
---

OSFNTC is the Open-Source Framework for Numerically-Tailored Computations. It connects custom arithmetic accelerators to application software through an OpenBLAS integration.

The framework generates systolic matrix-multiplication hardware with configurable arithmetic. Its experimental platform combines an IBM POWER9 host, OpenCAPI, and a Xilinx Virtex UltraScale+ FPGA. The research evaluates the resulting designs on AI inference and sea-surface-height computations.

{% include figure.liquid path="assets/img/runtime.jpg" alt="Runtime results from the OSFNTC evaluation." %}

## Repository contents

- `flopoco/`: arithmetic and accelerator generation.
- `oc-accel/`: host–FPGA integration through OpenCAPI.
- `OpenBLAS/`: software integration for application-level experiments.
- `SoftPosit/` and `eval/`: numerical support and evaluation artifacts.

Reproducing the complete flow requires the platform-specific hardware and software described in the README. The operator generators and evaluation artifacts can also be studied independently.

## Research

The accelerator generator is described in the FCCM 2022 paper {% cite ledoux_generator_2022 %}; the integrated framework is described in the FPL 2023 paper {% cite ledoux_framework_2023 %}.

Related arithmetic hardware was also used in the [Teras MPW5 design](https://github.com/Bynaryman/wrapped_teras).
