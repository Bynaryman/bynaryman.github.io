const { test } = require("node:test");
const assert = require("node:assert/strict");

test("renderer diagnostics identify the active adapter and respect masked hardware names", async () => {
  const { webglAdapter } = await import("../apps/seamos/webgl-adapter.js");
  const read = (model, standard = "WebKit WebGL") =>
    webglAdapter({
      RENDERER: 1,
      getExtension: () => (model ? { UNMASKED_RENDERER_WEBGL: 2 } : null),
      getParameter: (id) => (id === 2 ? model : standard),
    });
  const rtx = "ANGLE (NVIDIA Corporation, NVIDIA RTX 2000 Ada Generation Laptop GPU/PCIe/SSE2, OpenGL 4.5.0)";
  assert.deepEqual(read(rtx), { name: rtx, software: false });
  assert.equal(read("NVIDIA GeForce 8800 GTX, or similar").name, "NVIDIA (exact model hidden by browser)");
  assert.equal(read(null).name, "Adapter model hidden by browser");
  assert.equal(read(null, "llvmpipe (LLVM 19.1.0)").software, true);
});

test("denoising smooths small variations and preserves a contrasting single-pixel trace", async () => {
  const { denoiseFrame } = await import("../apps/seamos/postprocess.js");
  const raw = Uint8ClampedArray.from([70, 90, 74, 237, 75, 91, 71].flatMap((v) => [v, v, v, 255]));
  const filtered = denoiseFrame(raw, 7, 1);
  assert.ok(filtered[4] < raw[4] && filtered[4] > raw[0]);
  assert.equal(filtered[12], raw[12]);
  assert.equal(raw[4], 90);
  assert.equal(filtered[3], 255);
});

test("exposure and denoising redisplay the completed samples and can restore the exact raw frame", async (t) => {
  let latest;
  let receive;
  globalThis.self = {};
  globalThis.postMessage = (message) => {
    latest = message;
    receive?.(message);
  };
  t.after(() => {
    delete globalThis.self;
    delete globalThis.postMessage;
  });
  await import("../apps/seamos/trace-worker.js");
  const render = {
    type: "render",
    revision: 8,
    displayRevision: 0,
    exposure: 1,
    denoise: false,
    samples: 2,
    width: 24,
    height: 16,
    layers: [],
    matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 2, 0, 1],
    aspect: 1.5,
    fov: 65,
    grid: true,
    sunlight: "#fff",
  };
  await self.onmessage({ data: render });
  const raw = latest.pixels;
  async function display(displayRevision, exposure, denoise) {
    const next = new Promise((resolve) => {
      receive = resolve;
    });
    await self.onmessage({ data: { type: "display", revision: 8, displayRevision, exposure, denoise } });
    const frame = await next;
    assert.equal(frame.sample, 2);
    assert.equal(frame.revision, 8);
    assert.equal(frame.displayRevision, displayRevision);
    return frame.pixels;
  }
  assert.notDeepEqual(await display(1, 0.55, false), raw);
  assert.notDeepEqual(await display(2, 1, true), raw);
  assert.deepEqual(await display(3, 1, false), raw);
});

test("ray intersections use a shared cell at its transformed placement", async () => {
  const { layerTree } = await import("../apps/seamos/placement-tree.js");
  const { Ray, Vector3, DoubleSide } = await import("../apps/seamos/lib/intersections.js");
  const positions = new Float32Array([0, 1, 0, 1, 1, 0, 0, 1, 1]);
  const indices = new Uint32Array([0, 2, 1]);
  // 90-degree rotation and 2x magnification, followed by translation.
  const placements = new Float32Array([1, 0, 0, 1, 0, 0, 0, 0, 0, 2, -2, 0, 8, 10, 0, 1]);
  const tree = layerTree({ parts: [{ positions, indices, placements }] });
  const down = (x, z) => new Ray(new Vector3(x, 4, z), new Vector3(0, -1, 0));
  const hit = tree.raycastFirst(down(7.6, 10.4), DoubleSide, 0, 10);
  assert.equal(hit.instance, 1);
  assert.equal(hit.distance, 3);
  assert.equal(hit.face.normal.y, 1);
  assert.equal(tree.raycastFirst(down(5, 5), DoubleSide, 0, 10), null);
});

test("GPU tables retain cell mesh reuse and the color of each placement", async () => {
  const { layerTree } = await import("../apps/seamos/placement-tree.js");
  const { packTrees, packColors } = await import("../apps/seamos/gpu-geometry.js");
  const positions = new Float32Array([0, 1, 0, 1, 1, 0, 0, 1, 1]);
  const indices = new Uint32Array([0, 2, 1]);
  const placements = new Float32Array(24 * 8);
  for (let i = 0; i < 24; i++) placements.set([1, 0, 0, 1, 23 - i, 0, i, 0], i * 8);
  const packed = packTrees([layerTree({ parts: [{ positions, indices, placements }] })], 4096);
  const root = packed.layers[0].root;
  assert.ok(packed.layers[0].shared);
  assert.equal(root, 1);
  const nodes = packed.nodes.data,
    end = nodes[8 * root + 3];
  assert.ok(end > root + 2);
  const seen = [];
  for (let n = root; n < end; n++) {
    const count = nodes[n * 8 + 7],
      first = nodes[n * 8 + 3];
    if (!count) {
      assert.ok(first > n + 1 && first <= end);
      continue;
    }
    for (let j = 0; j < count; j++) seen.push(packed.primitives.data[(first + j) * 4]);
  }
  assert.deepEqual(
    seen.sort((a, b) => a - b),
    Array.from({ length: 24 }, (_, i) => i)
  );
  const rgb = new Uint8Array(24 * 3);
  for (let i = 0; i < 24; i++) rgb.set([i, 30, 90], i * 3);
  packColors(packed, [[rgb]]);
  for (const i of seen) {
    const offset = i * 8;
    assert.equal(packed.instances.data[offset + 4], 23 - i);
    assert.equal(packed.instances.data[offset + 6], 0);
    const color = packed.instances.data[offset + 7];
    assert.deepEqual([...packed.tint.data.subarray(4 * color, 4 * color + 3)], [i, 30, 90]);
  }
});

test("shuffled category colors agree for instanced and flattened layouts", async () => {
  const { colorLayout, shuffleColorOffset } = await import("../apps/seamos/cell-colors.js");
  const cells = ["TOP", "ALU"],
    flat = [{ spans: [3, 0, 0, 6, 1, 1], positions: new Float32Array(18) }];
  const shared = [{ parts: [{ placements: [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 2, 0, 1, 1] }] }];
  const shift = shuffleColorOffset();
  for (const mode of ["hierarchy", "logic"]) {
    const base = colorLayout(flat, mode, cells, "TOP");
    const shuffled = colorLayout(flat, mode, cells, "TOP", shift);
    const instanced = colorLayout(shared, mode, cells, "TOP", shift);
    assert.deepEqual(shuffled.legend, instanced.legend);
    assert.deepEqual([...instanced.colors[0][0]], [...shuffled.colors[0].slice(0, 3), ...shuffled.colors[0].slice(9, 12)]);
    assert.notDeepEqual(base.colors, shuffled.colors);
    assert.deepEqual(
      base.legend.map((x) => x.label),
      shuffled.legend.map((x) => x.label)
    );
  }
});
