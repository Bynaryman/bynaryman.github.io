# Project curation, 24 September 2026

## Added to Fun

- **Bitmosh**: native Android datamoshing, currently in closed testing. Use the existing owner-approved feature graphic and actual emulator screenshots of the bundled Signal garden footage. Sources: `binaryman-apps/apps/arts/bitmosh/AGENTS.md`, `README.md`, and `store/graphics/README.md`. No production-download claim or private source link.
- **BinaryTracker**: the current Rust/Ratatui/modalkit frontend in `rtrack/binarytracker`, not the older Schism-based project in the sibling `binarytracker` directory. The image is an SVG rendering of a real 84 × 26 terminal capture of the arpeggio demo; no invented controls or pattern data. Source: its README and the recent “Refactor rtrack keybindings” task. Attribute the rtrack audio engine explicitly.
- **Binary Instruments**: the quantizer Rev A, using its existing KiCad perspective render. Source: `binary_instruments/quantizer/improved/README.md`. This revision is an unverified hardware prototype; the upstream reference's working-hardware statement does not apply to it.
- **Silicon Landscapes**: the existing full-adder Bryce image series. Reuse the site's original images and link the existing article without changing its wording. Explain that layer displacement, materials, and deformation are artistic choices.

## Images for existing cards

| Project | Image | Origin |
| --- | --- | --- |
| Emeraude-MLIR | Generated combinational circuit | Existing TinyTapeout image in this site |
| MLModelMLIRGEN | PyTorch → torch-mlir → MLIR | New explanatory SVG, not a screenshot |
| VH2V | VHDL → GHDL + Yosys → Verilog | New explanatory SVG, not a screenshot |
| gdsiistl | Full-adder layer render | Existing Bryce image in this site |
| OpenROAD-GPL | Placement view | Existing arithmetic tutorial image |
| Codez | Annotated MLIR excerpt | `codez/docs/previews/feature-mlir-matmul-lowering.png` |

Raster images retain originals and use the site's responsive WebP variants. SVGs remain small, editable vector assets.

## Further candidates

These are suggestions, not additional published pages:

1. **TinyTapeout cellular automata**. [Repository](https://github.com/Bynaryman/ttsky26a-lledoux-democene). The README describes a 40 × 30 Conway grid with VGA output and a Verilator/SDL viewer. Best image: capture a real simulation or the hardware output, with the source identified. Keep simulation, submission, and measured silicon distinct.
2. **MLIR/CIRCT teaching lab**. [Repository](https://github.com/Bynaryman/MLIR_ACM_Summer_School_2026_CIRCT). A project page could connect the compiler exercises to circuit diagrams and chip layouts already shown in the course. Best image: a concise sequence from one actual exercise. Avoid duplicating the courses index.
3. **ASIC watch**. [Repository](https://github.com/Bynaryman/wrapped_asic_watch). The public description identifies a seven-segment watch targeting SKY130. Best image: paired RTL simulation and layout, after checking its current implementation and fabrication status.

Public repository names and descriptions were checked using GitHub's user-repository API. Local project READMEs and the two relevant Codex tasks supplied current details; unrelated tasks were not used as publication material.

## Verification

- Production build completed in 23.8 seconds; all three theme tests passed.
- Local link, asset, anchor, duplicate-ID, stylesheet-version, and draft-exclusion checks pass across 82 HTML files.
- All 14 project cards have images. Binary body text measures 22 px at 390 px, 24 px at 820 px, and 26 px at 1280 px viewport widths; the card grid has one, two, and three columns respectively, without horizontal overflow.
- Browser checks covered Binary light/dark, Modus dark, the phone homepage, and the new Bitmosh/BinaryTracker detail pages. Bitmosh's screenshot columns stack on phones.
- Found and fixed a pre-existing cache bug exposed by the new grid classes: CSS was versioned before pruning. Final stylesheet hashes now follow pruning, and validation rejects stale hashes. Verified base-URL preservation, external links, idempotence, and invalidation after CSS changes.
- Existing blog articles and all six deferred drafts remain unchanged.
