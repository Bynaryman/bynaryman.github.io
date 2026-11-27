const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

test("GDSII and compressed OASIS preserve layer tags, paths and transformed arrays", async (t) => {
  const { readLayout } = await import("../apps/seamos/parser.js");
  t.mock.method(globalThis, "fetch", async (url) => new Response(await readFile(url)));

  for (const extension of ["gds", "oas"]) {
    const file = await readFile(path.join(__dirname, "fixtures", "strata", "hierarchy." + extension));
    const { cells, roots, layers } = await readLayout(file, "ROOT");
    assert.deepEqual(roots.sort(), ["OTHER", "ROOT"]);
    assert.deepEqual(cells.sort(), ["CHILD", "OTHER", "ROOT"]);
    const child = await readLayout(file, "CHILD");
    assert.deepEqual(
      child.layers.map((layer) => layer.polygons.length),
      [1, 1]
    );
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

test("nested polygons retain the owning branch and the nearest recognized logic type", async (t) => {
  const { readLayout } = await import("../apps/seamos/parser.js");
  t.mock.method(globalThis, "fetch", async (url) => new Response(await readFile(url)));
  const bytes = await readFile(path.join(__dirname, "fixtures/strata/logic.oas"));
  const { cellNames, layers } = await readLayout(bytes, "TOP");
  const layer = layers[0];
  const roles = Object.fromEntries(layer.branches.map((id, i) => [cellNames[id], layer.logic[i]]));
  assert.deepEqual(roles, { CORE: 1, ALU: 2, CUSTOM: 0 });
  const alu = await readLayout(bytes, "ALU");
  assert.deepEqual(
    alu.layers[0].branches.map((id) => alu.cellNames[id]),
    ["sg13g2_nand2_1"]
  );
});

test("a 450-by-450 array opens as a whole chip with one shared polygon definition", async (t) => {
  const { readLayout } = await import("../apps/seamos/parser.js");
  t.mock.method(globalThis, "fetch", async (url) => new Response(await readFile(url)));
  const bytes = await readFile(path.join(__dirname, "fixtures/strata/oversized.gds"));
  const { name, cells, templates } = await readLayout(bytes);
  assert.equal(name, "BIG");
  assert.deepEqual(cells, ["BIG", "UNIT"]);
  assert.equal(templates.length, 1);
  assert.equal(templates[0].placements.length / 8, 202500);
  assert.equal(templates[0].layers[0].polygons.length, 1);
  const { layers } = await readLayout(bytes, "UNIT");
  assert.equal(layers[0].polygons.length, 1);
});
