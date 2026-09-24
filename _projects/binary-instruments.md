---
layout: page
title: Binary Instruments
description: An acacia Eurorack case, power boards, front panels, and a dual pitch quantizer with digital calibration.
img: assets/img/projects/quantizer-rev-a.png
img_alt: KiCad 3D render of the quantizer PCB with its display, encoder, and jack sockets.
importance: 4
category: fun
github: https://github.com/Bynaryman/binary_instruments
---

Binary Instruments collects my Eurorack hardware work: an acacia case, power supply and distribution boards, front panels, and a dual 1 V/oct pitch quantizer.

## Acacia case

I built a two-row case from acacia, with aluminium rails, two Mean Well supplies, and four distribution boards. The [May 2021 build post]({% post_url 2021-05-07-acacia-eurorack-case %}) follows the enclosure, rail installation, and wiring. It also records the bus-voltage error I found about a year later.

## Power supply and bus boards

Compact supply cards and long distribution boards provide power connections throughout the modular case. Low noise is the supply design goal. The boards use through-hole components and include waveform and fractal silkscreen artwork.

{% include figure.liquid path="assets/img/eurorack-power/boards-and-components.png" alt="Eurorack bus boards and components laid out before soldering." caption="Power distribution boards during assembly." %}

[Read the build post]({% post_url 2026-09-24-eurorack-power-boards %}) for photographs of the supply cards, bus boards, and assembly. The repository contains related Eurorack designs; it does not currently include these power boards.

## Dual pitch quantizer

{% include figure.liquid path="assets/img/projects/quantizer-rev-a.png" alt="KiCad 3D render of the Binary Instruments quantizer Rev A PCB." caption="Quantizer Rev A board render. This is a design preview, not a photograph of assembled hardware." %}

Rev A uses an RP2040, an ADS1115 ADC, a dual 16-bit DAC80502, and protected, buffered inputs and outputs. Two-point digital calibration replaces analogue gain trimmers.

The work includes the KiCad schematic and PCB, a 6 HP panel template, Pico SDK firmware, and calibration tools. It builds on the HAGIWO/Testbild-synth quantizer reference, with upstream attribution retained.

The new revision is a prototype. Design checks and firmware builds pass; pitch accuracy, noise, drift, protection, and mechanical fit still require measurements on assembled hardware.
