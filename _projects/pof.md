---
layout: page
title: POF
description: Posit arithmetic operators and FPGA multilayer-perceptron experiments.
img: assets/img/POF.png
importance: 3
category: work
github: https://github.com/Bynaryman/POF
---

POF, the Posit Operators Framework, collects hardware operators and multilayer-perceptron experiments using the posit number format on FPGAs. I developed it with Marc Casas.

{% include figure.liquid path="assets/img/POF.png" alt="Overview of the Posit Operators Framework." %}

## Hardware and evaluation

The repository contains SystemVerilog, Verilog, and VHDL sources, testbenches, weight files, and Python utilities. The `src/` and `tb/` directories hold the hardware and its simulation tests; `python_tb/adder_vector_generator.py` generates arithmetic test vectors.

The PYNQ workflow connects a synthesised design to Python. `pynq_soft/MNIST_posit.py` runs the MNIST experiment with the corresponding weights and FPGA bitstream.

The README documents the build and board setup. Accuracy and resource use depend on the chosen posit configuration, network, and target device; the repository provides experiments for studying those choices.
