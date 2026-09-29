---
layout: page
title: BinaryTracker
description: A Schism Tracker editor with Vim-style pattern editing and semantic MIDI conversion.
img: assets/img/projects/binarytracker.png
img_alt: The current Schism-based BinaryTracker pattern editor in BT NORMAL mode.
importance: 2
category: fun
---

BinaryTracker combines a modified Schism Tracker interface with a MIDI-to-tracker converter. The pattern editor adds Vim-style Normal, Insert, and Visual modes. Schism's sample and instrument editors remain available on F3 and F4.

{% include figure.liquid path="assets/img/projects/binarytracker.png" alt="The current BinaryTracker pattern editor showing five channels and BT NORMAL mode." caption="The running Schism-based editor with a generated demonstration pattern. This is the current interface; the earlier terminal editor is no longer the default." %}

## Modal editing

On the F2 pattern page, `h j k l` move between rows and channels, `i` enters Insert mode, and `Esc` returns to Normal mode. `v` selects a block; `V` selects whole rows. Operators accept counts: `16yy` copies sixteen cells in the current channel, `8dd` clears eight, and `2>` transposes by two octaves.

Native tracker note entry is active in Insert mode. Samples, instrument envelopes, playback, and file handling use Schism's existing controls.

## MIDI conversion

The converter assigns musical roles to stable channels, divides a song into fixed 16-, 32-, or 64-row blocks, and reuses identical patterns. It writes an editable Impulse Tracker module (`.it`) and a companion `.bt` file containing mapping metadata.

```sh
make build-gui
./bin/binarytracker song.mid --rows 32
```

MIDI contains no sample audio. To play the converted notes with embedded sounds, load samples on F3 and map them to instruments on F4. The launcher preserves existing `.it` files rather than overwriting added samples.

The project is under development. Its converter and launcher use the MIT licence; the modified Schism Tracker remains GPL-licensed.
