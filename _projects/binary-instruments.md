---
layout: page
title: Binary Instruments
description: Eurorack panels and a dual pitch quantizer with digital calibration.
img: assets/img/projects/quantizer-rev-a.png
img_alt: KiCad 3D render of the quantizer PCB with its display, encoder, and jack sockets.
importance: 4
category: fun
github: https://github.com/Bynaryman/binary_instruments
---

Binary Instruments collects my Eurorack hardware work, including front panels and a dual 1 V/oct pitch quantizer.

{% include figure.liquid path="assets/img/projects/quantizer-rev-a.png" alt="KiCad 3D render of the Binary Instruments quantizer Rev A PCB." caption="Quantizer Rev A board render. This is a design preview, not a photograph of assembled hardware." %}

Rev A uses an RP2040, an ADS1115 ADC, a dual 16-bit DAC80502, and protected, buffered inputs and outputs. Two-point digital calibration replaces analogue gain trimmers.

The work includes the KiCad schematic and PCB, a 6 HP panel template, Pico SDK firmware, and calibration tools. It builds on the HAGIWO/Testbild-synth quantizer reference, with upstream attribution retained.

The new revision is a prototype. Design checks and firmware builds pass; pitch accuracy, noise, drift, protection, and mechanical fit still require measurements on assembled hardware.
