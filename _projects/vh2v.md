---
layout: page
title: VH2V
description: VHDL-to-Verilog bridge utility for open hardware and tapeout integration flows
importance: 6
category: work
github: https://github.com/Bynaryman/vh2v
github_stars: Bynaryman/vh2v
---

`vh2v` is a practical bridge utility: given a VHDL design with multiple entities, it emits Verilog modules that can be consumed by Verilog-centric open ASIC flows.

## Why It Exists

Open silicon pipelines are still uneven across HDLs. `vh2v` smooths interoperability by combining:

- `GHDL`
- `Yosys`
- `ghdl-yosys-plugin`

with a Python wrapper that automates per-entity export.

## Where It Was Used

This bridge was used in the MPW5 posit/quire systolic-array flow and in subsequent reproducible software-to-silicon campaigns.

## Links

- Repository: <https://github.com/Bynaryman/vh2v>
- MPW5 context: <https://www.zerotoasiccourse.com/post/mpw5_submitted/>
