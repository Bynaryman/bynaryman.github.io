---
layout: post
title: "Building an Acacia Eurorack Case"
date: 2021-05-07
description: "An acacia case, two Mean Well supplies, and a bus-voltage mistake I found a year later."
tags: [eurorack, electronics, diy, woodworking]
categories: [music, hardware]
related_posts: false
thumbnail: assets/img/eurorack-case/acacia-case-workshop.png
---

I built a two-row Eurorack case from acacia, with aluminium rails and my own power-distribution boards.

<div class="row">
  <div class="col-md-6">
    {% include figure.liquid path="assets/img/eurorack-case/acacia-case-workshop.png" loading="eager" sizes="(min-width: 768px) 500px, 90vw" alt="The empty acacia enclosure standing on a workshop bench, with screw joints and a cut-out for the power inlet." caption="The acacia enclosure before fitting the hardware." zoomable=true %}
  </div>
  <div class="col-md-6">
    {% include figure.liquid path="assets/img/eurorack-case/fitting-rails.png" sizes="(min-width: 768px) 500px, 90vw" alt="Aluminium Eurorack rails fitted to black side brackets inside the acacia case on an outdoor workbench." caption="Fitting the rails for two rows of modules." zoomable=true %}
  </div>
</div>

## Power and layout

I chose two matching [Mean Well LRS-35-12 supplies](https://www.meanwell.com/Upload/PDF/LRS-35/LRS-35-SPEC.PDF), each rated at 12 V and 3 A. The aim was a more symmetric supply for the positive and negative rails.

The supplies, a separate supply card, and four bus boards fit behind the module rails. I laid out the boards before completing their assembly and wiring.

<div class="row">
  <div class="col-md-6">
    {% include figure.liquid path="assets/img/eurorack-case/mean-well-supplies.png" sizes="(min-width: 768px) 500px, 90vw" alt="Two Mean Well LRS-35-12 power supplies mounted side by side behind the aluminium rails." caption="The two matching Mean Well supplies." zoomable=true %}
  </div>
  <div class="col-md-6">
    {% include figure.liquid path="assets/img/eurorack-case/bus-board-placement.png" sizes="(min-width: 768px) 500px, 90vw" alt="Four mostly unpopulated bus PCBs positioned inside the case, alongside the supplies, a populated supply card, and a few front panels." caption="Checking the board positions before assembly." zoomable=true %}
  </div>
</div>

{% include figure.liquid path="assets/img/eurorack-case/component-layout.png" sizes="(min-width: 1200px) 1000px, 90vw" alt="The acacia case with rails installed, populated bus boards, two power supplies, and coils of coloured wire laid out inside." caption="Boards and wiring materials laid out inside the case." zoomable=true %}

## Wiring the buses

The four bus boards are arranged in two pairs. The wiring runs along the edge of the case and between adjacent boards, leaving the connectors accessible behind the modules.

<div class="row">
  <div class="col-md-6">
    {% include figure.liquid path="assets/img/eurorack-case/wired-case.png" sizes="(min-width: 768px) 500px, 90vw" alt="An overhead view into the acacia case showing the two supplies, supply card, four bus boards, and coloured wiring." caption="The distribution wiring in place." zoomable=true %}
  </div>
  <div class="col-md-6">
    {% include figure.liquid path="assets/img/eurorack-case/supply-card-wiring.png" sizes="(min-width: 768px) 500px, 90vw" alt="The two Mean Well supplies wired to the supply card, with the four bus boards below awaiting their connections." caption="Connecting the supplies to the supply card." zoomable=true %}
    {% include figure.liquid path="assets/img/eurorack-case/bus-wiring-detail.png" sizes="(min-width: 768px) 500px, 90vw" alt="Close-up of coloured wires connecting the supply card and adjacent bus boards through screw terminals." caption="Wiring between the supply card and bus boards." zoomable=true %}
  </div>
</div>

## Bright LEDs, and a later finding

The indicator LEDs were much too bright when I powered the case.

{% include figure.liquid path="assets/img/eurorack-case/bright-indicator-leds.png" class="d-block mx-auto" sizes="(min-width: 768px) 698px, 90vw" alt="The powered case with unusually bright white indicator LEDs on the bus boards and coloured LEDs on the supply card." caption="The powered bus boards: the LEDs were far too bright." zoomable=true %}

Retrospective note: about a year later, I found an error in the bus voltages. That was probably the cause of the excessive LED brightness.

This case is part of [Binary Instruments]({{ '/projects/binary-instruments/' | relative_url }}). The [power-board post]({% post_url 2026-09-24-eurorack-power-boards %}) shows the supply cards and bus boards in more detail.
