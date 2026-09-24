---
layout: page
title: BinaryTracker
description: A terminal music tracker with Vim motions, operators, and musical text objects.
img: assets/img/projects/binarytracker.svg
img_alt: BinaryTracker terminal showing an arpeggio pattern and its modal editing status line.
importance: 2
category: fun
---

BinaryTracker is my terminal music tracker built around Vim grammar. Motions select musical regions; operators edit, transpose, or interpolate them.

{% include figure.liquid path="assets/img/projects/binarytracker.svg" alt="BinaryTracker running the arpeggio example, with four channels and a Normal-mode status line." %}

For example, `>ip` raises a phrase by one octave, `=ip` interpolates values, and `<C-v>5j3l y4p` copies a block four times. Registers, marks, macros, undo, and dot-repeat also work.

The Rust interface uses Ratatui and modalkit over [rtrack](https://github.com/shakfu/rtrack)'s audio engine. It supports synthesis, samples, MIDI, and classic tracker-module import. Format conversion has limits; the editor reports unsupported data.

The current implementation is under development. The image shows the running terminal interface, captured with the arpeggio demo.
