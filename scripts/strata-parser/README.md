# Strata layout reader

Run `./scripts/strata-parser/build.sh` with Git and Zig 0.15.2 on the path to rebuild the static browser reader. It fetches pinned revisions of Tiny Tapeout Explorer (miniz, qhull declaration stub and WASI shim) and its gdstk submodule. The app serves the checked-in WebAssembly and JavaScript locally.

The worker-side `readLayout(buffer, cellName)` creates a fresh WASI instance with the input in memory. gdstk reads GDSII and OASIS, including compressed OASIS blocks, and converts paths to outlines. The wrapper walks the selected top-level cell, applies affine placements and array offsets, and emits polygon rings grouped by numeric layer and datatype. Coordinates and curve tolerance (0.001 µm) are in micrometres. Text and layout properties are outside the polygon model.

The parser accepts files up to 64 MiB, caps WASM at 256 MiB, and allows 150,000 polygons, one million vertices, 200,000 cell instances and 128 hierarchy levels per selection. The view's mesh builder may impose a smaller rendering budget.
