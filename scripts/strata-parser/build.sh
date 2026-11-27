#!/usr/bin/env bash
set -euo pipefail

# Requires Git and Zig 0.15.2. All dependencies and build products live in a temporary checkout.
here=$(cd "$(dirname "$0")" && pwd)
output="$here/../../apps/seamos/lib"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
git -C "$work" init -q
git -C "$work" fetch -q --depth 1 https://github.com/TinyTapeout/tiny-explorer.git 11154395b790e4d0aacf3d8f402fc02525047712
git -C "$work" checkout -q FETCH_HEAD
git -C "$work" submodule update --quiet --init --depth 1 vendor/gdstk
cp "$here/build.zig" "$here/reader.cpp" "$work/"
(cd "$work" && zig build -Dtarget=wasm32-wasi --release=small)
mkdir -p "$output"
cp "$work/zig-out/bin/layout-reader.wasm" "$output/"
cp "$work/vendor/browser_wasi_shim.js" "$output/wasi.js"
