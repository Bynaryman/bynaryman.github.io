---
layout: post
title: "Replacing the Thermistor in My x0x"
date: 2023-10-05
description: "A thermistor change, guided by Open Music Labs' analysis of temperature compensation in exponential converters."
tags: [x0x, electronics, analog, diy]
categories: [music, hardware]
related_posts: false
thumbnail: assets/img/x0x-thermistor/workbench.png
---

I replaced the thermistor in my x0x, following Open Music Labs' [Thermal Compensation of Analog Exponential Converters](http://www.openmusiclabs.com/files/expotemp.pdf). The aim was to reduce the oscillator's sensitivity to temperature.

{% include figure.liquid path="assets/img/x0x-thermistor/workbench.png" class="d-block mx-auto" loading="eager" sizes="(min-width: 768px) 698px, 90vw" alt="The x0x board on a blue soldering mat, beside tweezers, solder, a syringe, and other tools on the workbench." caption="The x0x board on the workbench for the thermistor change." zoomable=true %}

## Why the thermistor matters

An analogue oscillator's exponential converter turns pitch control voltage into an exponential current. Its behaviour depends on transistor thermal voltage, <i>V</i><sub>t</sub> = <i>kT</i>/<i>q</i>, where <i>T</i> is absolute temperature, <i>k</i> is Boltzmann's constant, and <i>q</i> is the elementary charge. A thermistor adjusts the control-voltage scaling to compensate for that dependence. See [Section II, pages 1–2](http://www.openmusiclabs.com/files/expotemp.pdf#page=2).

> we need a resistance that also varies linearly with absolute temperature.

— Open Music Labs (2015), [Section IV, page 5](http://www.openmusiclabs.com/files/expotemp.pdf#page=5).

For the simple op-amp scaling circuit discussed there, the target temperature coefficient near 25 °C is about +3350 ppm/°C. A resistive divider changes the effective coefficient, so the required component depends on the circuit. Thermal contact with the transistor pair also matters: the compensating resistor needs to follow its temperature.

{% include figure.liquid path="assets/img/x0x-thermistor/board-detail.png" class="d-block mx-auto" sizes="(min-width: 768px) 698px, 90vw" alt="Close-up of the green Binaryman x0x board on a notebook, with a small component area circled in yellow near the lower left." caption="Board detail, with the component area marked in the photograph." zoomable=true %}
