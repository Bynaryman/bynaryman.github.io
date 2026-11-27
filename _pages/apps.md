---
layout: page
title: apps
permalink: /apps/
description: Instruments and creative tools by Binaryman / Louis Ledoux.
nav: true
nav_order: 3.5
---

<link rel="stylesheet" href="{{ '/assets/css/apps.css' | relative_url | bust_file_cache }}">

<section class="app-feature" aria-labelledby="strata-title">
  <div class="app-feature-copy">
    <p class="app-category">GDSII / OASIS</p>
    <h2 id="strata-title">Strata Studio</h2>
    <p class="app-lead"><mark>Render a chip layout in glass, copper or chrome.</mark></p>
    <p>Orbit the layer stack, tune individual materials and ray trace a still. Open a local layout or explore the bundled Prism core demo.</p>
    <div class="app-links">
      <a class="app-launch" href="{{ '/apps/strata/' | relative_url }}">Open Strata Studio ↗</a>
      <a href="{{ '/apps/strata/' | relative_url }}?preset=bryce">Open Bryce preset</a>
    </div>
  </div>
  <a class="app-preview" href="{{ '/apps/strata/' | relative_url }}" aria-label="Open Strata Studio">
    <img src="{{ '/assets/img/apps/strata.webp' | relative_url }}" alt="Strata Studio showing the Prism core layer stack reflected in rippled water beneath the Bryce sunset sky." width="1320" height="820" loading="lazy">
  </a>
</section>

<section class="app-feature" aria-labelledby="tr-rack-title">
  <div class="app-feature-copy">
    <p class="app-category">KORG TRINITY / TR-RACK</p>
    <h2 id="tr-rack-title">Trinity Studio</h2>
    <p class="app-lead"><mark>Free editing for the rack you already own.</mark></p>
    <p>Shape <strong>oscillators, envelopes and effects</strong>. Play chords from your keyboard. Keep your sounds.</p>
    <p class="app-byline">Made by <a href="{{ '/' | relative_url }}"><strong>Binaryman · Louis Ledoux</strong></a></p>
    <div class="app-tags"><span>FREE</span><span>NO ACCOUNT</span><span>PUBLIC BETA</span></div>
    <div class="app-links">
      <a class="app-launch" href="{{ '/apps/tr-rack/' | relative_url }}">Open Trinity Studio ↗</a>
      <a href="#getting-started" onclick="document.getElementById('getting-started').open = true">Quick start</a>
    </div>
    <p class="app-requirements"><strong>TR-Rack PCM programs.</strong> Bring your rack and MIDI interface. Sound comes from your hardware.</p>
  </div>
  <a class="app-preview" href="{{ '/apps/tr-rack/' | relative_url }}" aria-label="Open Trinity Studio">
    <img src="{{ '/assets/img/apps/tr-rack.png' | relative_url }}" alt="Trinity Studio: blue envelope displays, resizable sound panels and a polyphonic keyboard." width="1440" height="1050" loading="lazy">
  </a>
</section>

<div class="app-capabilities">
  <section><h3>01 / Edit</h3><p><strong>Live controls.</strong> Draggable envelopes. Resizable panels.</p></section>
  <section><h3>02 / Play</h3><p><strong>Polyphonic keys.</strong> Real note releases. <kbd>Space</kbd> for sustain.</p></section>
  <section><h3>03 / Keep</h3><p><strong>Your local library.</strong> Bank transfers. SysEx import / export.</p></section>
</div>

<aside class="app-manifesto" aria-labelledby="why-title">
  <p class="app-category">WHY I MADE IT</p>
  <h2 id="why-title">An editor should be within reach.</h2>
  <p>I find it <strong>unacceptable to pay $119 just to edit a synth I already own</strong> — the listed price of <a href="https://squest.com/Products/MidiQuest13/Instruments/KorgTrinityRack/index.html">MIDI Quest’s TR-Rack module</a>. Korg’s <a href="https://www.korg.com/us/support/download/manual/1/213/2730/">MIDI documentation is publicly available</a>. So I built <mark>a free alternative</mark>.</p>
  <p class="app-signature">— Binaryman / Louis Ledoux <span>· price checked November 2026</span></p>
</aside>

<details class="app-guide" id="getting-started" markdown="1">
<summary>Connect, play &amp; save <span>Quick start + compatibility</span></summary>

### Connect

1. Wire **interface OUT → rack IN**, and **rack OUT → interface IN**. Enable SysEx on the rack and match its Global MIDI channel.
2. Click **Connect TR-Rack**, allow MIDI/SysEx access and select both ports. **Receive** a program, then enable **Live edit**. Use **Send to buffer** for effects and name changes.
3. Listen through your interface, or connect the rack’s stereo outputs to line inputs and choose **Enable audio** in the app.

### Play & resize

- **QWERTY / AZERTY:** play the keys printed on the piano; hold several for chords.
- **Space:** sustain. **Z/X** (AZERTY **W/X**): octave. **Esc:** panic.
- Choose **Polyphonic** and disable program **Hold** for normal release tails; apply the change to your rack.
- Drag the **sidebar edge**, **piano’s top edge**, or a **panel’s bottom-right grip**. Double-click a grip to reset it; the top-bar reset button restores the whole layout.

### Know the scope

**Public beta for TR-Rack PCM programs.** Combinations, Multi setups, drum-kit editing and PCG files are not included yet. This is a focused editor, not full MIDI Quest feature parity. The optional test tone only checks keyboard input.

Requires a browser with **Web MIDI + SysEx**. The app reports missing support. MIDI and audio require browser permission.

**Your programs stay local.** No account, preset uploads or audio recording. Save/export your work; back up before permanent rack writes. Export/import your library to move between localhost, this website, or another browser.

</details>

<div class="app-more">
  <span class="app-category">ALSO BY BINARYMAN</span>
  <a href="{{ '/projects/bitmosh/' | relative_url }}"><strong>Bitmosh ↗</strong></a>
  <span>Android video datamoshing. Break frames, bend motion.</span>
</div>
