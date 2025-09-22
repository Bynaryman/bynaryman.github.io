---
layout: page
title: Le RetrOrchestre
description: "Turning retro computer hardware into a USB-MIDI orchestra that mixes engineering with playful spectacle."
img: assets/img/retrorchestre.gif
importance: 1
category: fun
---

## Overview
Le RetrOrchestre is a mechatronic orchestra that transforms retro computer hardware into MIDI-driven instruments. Inspired by installations like the Floppotron, the project expands the sonic palette with floppy drives, flatbed scanners, and forthcoming hard-disk modules. A Teensy-based firmware enumerates as a class-compliant USB MIDI device so the entire ensemble plugs straight into a Digital Audio Workstation (DAW) for sequencing.

## Highlights
- Repurposes vintage floppy drives, scanners, and future HDD units as expressive MIDI-controlled instruments.
- Teensy control firmware exposes a USB MIDI interface for plug-and-play DAW integration.
- Central `src/config.h` keeps the hardware inventory, travel limits, and timing knobs in one place.
- Precomputed half-period lookup tables ensure the scheduler stays lightweight while keeping notes in tune.
- Reference MIDI arrangements in the `live/` directory make it easy to audition the rig while prototyping.

## Repository Layout
```text
Le-RetrOrchestre/
├── retrorchestre.ino         # Main firmware that conducts the full orchestra
├── src/
│   ├── config.h              # Hardware counts, travel limits, and timing parameters
│   └── lut.h                 # Half-period lookup tables in microseconds and timer ticks
├── scripts/
│   └── compute_LUTs.py       # Helper script to regenerate lookup tables when timings change
├── midi_floppy.ino           # Early floppy-only prototype kept for reference
├── place_scanners.ino/       # Legacy helper to position scanners until the control panel is finalised
├── live/                     # Reaper sessions and MIDI sets for testing arrangements
└── README.md
```

## Getting Started
### Hardware
- Teensy 3.x/4.x board (tested with 32-bit ARM models that provide `usbMIDI` and `IntervalTimer`).
- Up to `NUMBER_FDDS` floppy drives wired with step and direction signals (each draw roughly 500 mW).
- Optional flatbed scanners controlled through stepper drivers—optocouplers are recommended.
- Stable 5 V rails sourced from an ATX power supply with the PS_ON pin tied to ground so it stays awake.
- CNC Shield V3 with A4988 drivers to host scanner steppers; confirm coil pairs before plugging headers.
- MIDI host (computer or sequencer) capable of sending USB MIDI.

### Firmware Installation
1. Clone or download the repository.
2. Open `retrorchestre.ino` in the Arduino IDE or PlatformIO configured for your Teensy board.
3. Keep the `src/` folder alongside the sketch so `config.h` and `lut.h` are found.
4. Select the Teensy target, enable `USB Type: MIDI`, and upload the sketch.
5. Let the setup routine home the mechanics, then confirm the Teensy enumerates as a MIDI device.

### Hooking Up to a DAW
- **Teensy native USB** – The board appears as a class-compliant MIDI device. Enable it in your DAW (e.g., Reaper) and route the track output to “Teensy MIDI.”
- **Legacy serial boards** – Bridge the serial port to MIDI with `ttymidi`:
  1. Identify the serial device via `dmesg` (for example `/dev/ttyUSB0`).
  2. Start the bridge: `ttymidi -s /dev/ttyUSB0 -b 115200 -v`.
  3. List MIDI ports with `aconnect -l` and patch the DAW output, e.g., `aconnect 129:0 128:1`.

## Configuring the Orchestra
The heart of the configuration lives in `src/config.h`:
- `NUMBER_FDDS`, `NUMBER_SCANNERS`, `NUMBER_HDDS` declare how many of each instrument are wired.
- `FDD_LIMIT` and `SCANNER_LIMIT` protect mechanics by capping travel distance before the firmware auto-reverses.
- `MINIMUM_*_NOTE` and `MAXIMUM_*_NOTE` clamp playable MIDI ranges per instrument family.
- `TIMER_RESOLUTION` sets scheduler granularity, balancing precision against CPU load.
- `DEBUG` toggles verbose serial output for the first instrument of each family.

Future HDD modules will plug into the same structure—set `NUMBER_HDDS` ahead of time to reserve channels and wiring.

## Wiring Notes (Work in Progress)
- **Power** – Budget roughly 500 mW per floppy drive and feed them from a dedicated 5 V rail. Bridge ATX PS_ON to ground, share grounds between logic and drivers, and add fuses when possible.
- **Scanners & CNC Shield** – Map each stepper to an A4988 slot, match coil pairs with a multimeter, and decide whether the driver logic voltage comes from the Teensy or the shield. Microstep jumpers (MS1–3) let you trade speed for smoother motion.
- **Control panel** – Homing buttons and kill switches will eventually live on a front panel. Until then, `place_scanners.ino` helps position scanners manually.
- **Grounding** – Join grounds between the Teensy, drivers, and power supply, and tie shield drain wires where needed to tame noise.

Expect schematics, harness photos, and a full BOM as the hardware matures.

## MIDI Channel Mapping
MIDI channels act as instrument selectors:
- Channels `1…NUMBER_FDDS` drive the floppy motors.
- Channels `NUMBER_FDDS+1…NUMBER_FDDS+NUMBER_SCANNERS` run the scanners.
- Remaining channels are reserved for HDDs once implemented.

Send standard `NOTE_ON`/`NOTE_OFF` messages with velocity; the firmware converts pitch to speed and direction using the lookup tables.

## Timing Internals & Half-Period LUT
Accurate pitch relies on translating MIDI notes into step timings. For MIDI note `n`:
- Frequency `f = 440 × 2^((n − 69) / 12)` Hz.
- Full period in microseconds `T = 1,000,000 / f`.
- Half-period `T/2 = 500,000 / f`, because each step toggles the direction pin twice per cycle.
- Scheduler ticks `tick = (T/2) / TIMER_RESOLUTION`.

`src/lut.h` stores two 128-entry tables with these values precomputed for every note. Whenever you adjust `TIMER_RESOLUTION` or extend the range, regenerate the tables with `python3 scripts/compute_LUTs.py` and paste the results back into the header so the interrupt service routine stays lean.

## Live Sets & Inspiration
The `live/` folder contains MIDI sketches and Reaper projects captured during prototyping. They stress-test the firmware with different rhythms and layer combinations until a full stage-ready set is recorded.

## HDD Sound Experiments on the Horizon
Two approaches are under evaluation:
1. **Voice-coil actuation** – Drive actuator coils with audio signals so the slider behaves like a mini speaker.
2. **Impulse percussion** – Deliver sharp pulses so the arm strikes the platter hub; 3.5-inch and 5.25-inch drives yield distinct tones.

Once the firmware pathways and safety interlocks land, HDD counts will be exposed alongside FDDs and scanners in `config.h`.

## Roadmap
- Finalise HDD support with dedicated timers and soft-landing routines.
- Parameterise scanner homing sequences and expose jog buttons on the control panel.
- Add pitch-bend and control-change handling for expressive play.
- Document power distribution best practices, shielding tips, and fuse sizing.
- Capture performance photos and recordings to share the orchestra in action.

Contributions, live-set ideas, or photos of your build are all welcome—may your drives stay in tune and your beats land on time!
