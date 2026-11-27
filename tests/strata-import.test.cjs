const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

test("GDSII and compressed OASIS preserve layer tags, paths and transformed arrays", async (t) => {
  const { readLayout } = await import("../apps/strata/parser.js");
  t.mock.method(globalThis, "fetch", async (url) => new Response(await readFile(url)));

  for (const extension of ["gds", "oas"]) {
    const file = await readFile(path.join(__dirname, "fixtures", "strata", "hierarchy." + extension));
    const { cells, layers } = await readLayout(file, "ROOT");
    assert.deepEqual(cells.sort(), ["OTHER", "ROOT"]);
    const boxes = layers.find((layer) => layer.layer === 113 && layer.datatype === 9);
    const paths = layers.find((layer) => layer.layer === 276 && layer.datatype === 43);
    assert.equal(boxes.polygons.length, 6);
    assert.equal(paths.polygons.length, 6);

    // The fixture mirrors, rotates and magnifies its child in a 3 by 2 array.
    // Bounds in micrometres check the transform and 5 nm database unit together.
    const x = [],
      y = [];
    for (const polygon of boxes.polygons) {
      for (let i = 0; i < polygon.length; i += 2) {
        x.push(polygon[i]);
        y.push(polygon[i + 1]);
      }
    }
    const bounds = [Math.min(...x), Math.min(...y), Math.max(...x), Math.max(...y)];
    assert.deepEqual(
      bounds.map((value) => Math.round(value * 1000) / 1000),
      [10, 8, 28, 22]
    );
    const other = await readLayout(file, "OTHER");
    assert.equal(other.layers[0].polygons.length, 1);
  }
});
