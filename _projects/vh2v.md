---
layout: page
title: VH2V
description: Convert VHDL entities into Verilog modules with GHDL and Yosys.
img: assets/img/projects/ghdl.png
img_alt: GHDL logo, the VHDL frontend used by VH2V.
importance: 6
category: work
github: https://github.com/Bynaryman/vh2v
github_stars: Bynaryman/vh2v
img_style: tool-logo
---

VH2V converts a VHDL file containing multiple entities into separate Verilog module files. A single Python script coordinates GHDL, Yosys, and the ghdl-yosys plugin.

## Usage

```sh
python3 vh2v.py --input_file SystolicArray.vhdl --output_dir /tmp
```

The Python wrapper has no third-party Python dependencies. GHDL, Yosys, and the plugin must be installed separately; the README describes that toolchain.

I used this conversion path for the [wrapped_teras design](https://github.com/Bynaryman/wrapped_teras) in the MPW5 open ASIC flow. It allows VHDL-generated arithmetic to enter a flow that expects Verilog.

Conversion is limited by GHDL's synthesis support. Unsupported VHDL constructs require changes to the input design or toolchain; the wrapper is not a complete VHDL-to-Verilog language translator.
