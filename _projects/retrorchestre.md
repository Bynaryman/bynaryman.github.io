---
layout: page
title: Le RetrOrchestre
description: "MIDI-controlled instruments built from floppy drives and scanners."
img: assets/img/retrorchestre.gif
importance: 3
category: fun
github: https://github.com/Bynaryman/Le-RetrOrchestre
---

Le RetrOrchestre turns floppy drives and flatbed scanners into MIDI-controlled instruments. A Teensy receives USB MIDI notes and drives the motors at the corresponding step rates.

{% include video.liquid path="assets/video/retrorchestre.mp4" title="Le RetrOrchestre playing MIDI-controlled computer hardware" %}

## Firmware

`retrorchestre.ino` is the main sketch. `src/config.h` defines the instrument counts, travel limits, note ranges, and scheduler timing. Precomputed half-period tables in `src/lut.h` map MIDI notes to motor timings; `scripts/compute_LUTs.py` regenerates them.

The Teensy appears as a USB MIDI device, so a DAW can send notes directly. Channels select the floppy drives first, then the scanner motors. The `live/` directory contains MIDI arrangements and Reaper sessions used during development.

The README covers the hardware, firmware installation, and channel mapping. The live rig is still evolving; hard-disk instruments remain planned work.
