---
layout: post
title: "Eurorack Power Boards"
date: 2026-09-24
description: "Low-noise supply cards and power distribution for my modular rack."
tags: [eurorack, electronics, pcb, diy]
categories: [music, hardware]
related_posts: false
thumbnail: /assets/img/generated/boards-and-components-de78dcb342-320.webp
---

I made two kinds of boards for my Eurorack case: compact supply cards, designed with low noise in mind, and long bus boards for power distribution.

{% include figure.liquid path="assets/img/eurorack-power/boards-and-components.png" loading="eager" sizes="(min-width: 1200px) 1000px, 90vw" alt="Four white Eurorack bus PCBs on a cutting mat, with LEDs and resistors sorted for assembly." caption="Bus boards and components prepared for soldering." zoomable=true %}

## Supply cards

The supply cards use through-hole components, screw terminals, capacitors, heatsinks, and LED indicators. Connector labels remain visible on the silkscreen after assembly.

<div class="row">
  <div class="col-md-6">
    {% include figure.liquid path="assets/img/eurorack-power/supply-bare.png" sizes="(min-width: 768px) 500px, 90vw" alt="Unpopulated supply PCBs with printed component references and terminal labels." caption="Bare supply cards before assembly." zoomable=true %}
    {% include figure.liquid path="assets/img/eurorack-power/supply-front-and-back.png" sizes="(min-width: 768px) 500px, 90vw" alt="The component side of a supply PCB beside its reverse side with black fractal artwork." caption="Component placement on the front; fractal artwork on the reverse." zoomable=true %}
  </div>
  <div class="col-md-6">
    {% include figure.liquid path="assets/img/eurorack-power/supply-assembled.png" sizes="(min-width: 768px) 500px, 90vw" alt="A populated supply card held in a vice, showing screw terminals, heatsinks, capacitors, headers, and LEDs." caption="A populated supply card on the workbench." zoomable=true %}
  </div>
</div>

## Distribution buses

The long PCBs carry repeated power connectors, screw terminals, and indicator LEDs. Keeping distribution on separate boards allows the connectors to be placed along the case, close to the modules.

I also used the silkscreen for artwork: waveforms along the bus boards and fractal patterns on the supply cards.

<div class="row">
  <div class="col-md-6">
    {% include figure.liquid path="assets/img/eurorack-power/busboards-assembly.png" sizes="(min-width: 768px) 500px, 90vw" alt="Four long bus boards with LEDs and resistors fitted, beside a populated supply card." caption="Four bus boards during assembly, with a supply card behind them." zoomable=true %}
  </div>
  <div class="col-md-6">
    {% include figure.liquid path="assets/img/eurorack-power/bus-connectors-and-artwork.png" sizes="(min-width: 768px) 500px, 90vw" alt="Bus boards with shrouded power headers and screw terminals, beside a PCB with fractal silkscreen artwork." caption="Power connectors and the PCB artwork." zoomable=true %}
  </div>
</div>

This build is part of [Binary Instruments]({{ '/projects/binary-instruments/' | relative_url }}), my Eurorack hardware work. Related designs are collected in the [Binary Instruments repository](https://github.com/Bynaryman/binary_instruments).
