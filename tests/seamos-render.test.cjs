const { test } = require("node:test");
const assert = require("node:assert/strict");

test("scan follows visible stack height and leaves the sky and the original trace untouched", async () => {
  const { stackRange, heightByte, paintScan, scanPhase, coated } = await import("../apps/seamos/surface-effects.js");
  const range = stackRange([
    { y: 0, thickness: 1, visible: false },
    { y: 2, thickness: 1, visible: true },
    { y: 3, thickness: 1, visible: true },
  ]);
  const mask = new Uint8Array([0, heightByte(2, range), heightByte(3, range), heightByte(4, range)]);
  assert.deepEqual([...mask], [0, 1, 128, 255]);
  const source = new Uint8ClampedArray(16).fill(32),
    scan = { enabled: true, band: "#ffffff", trail: "#ff0088" };
  const frame = paintScan(source, mask, scan, (0.5 + 0.09) / 1.32);
  assert.deepEqual([...frame.slice(0, 8)], [...source.slice(0, 8)]);
  assert.ok(frame[8] > 210);
  assert.equal(frame[12], 32);
  assert.equal(source[8], 32);
  assert.equal(scanPhase(0.25, 0, 6000), 0.25);
  assert.equal(scanPhase(0.25, 2, 1500), 0.75);
  assert.equal(coated("iridescent", false), true);
  assert.equal(coated("metal", true), true);
  assert.equal(coated("glass", true), false);
});

test("export tiles cover every output pixel once and include neighboring pixels for both image filters", async () => {
  const { imageTiles } = await import("../apps/seamos/image-export.js");
  const w = 19,
    h = 17,
    pad = 2,
    covered = new Uint8Array(w * h);
  for (const t of imageTiles(w, h, pad, 8)) {
    assert.equal(t.x, Math.max(0, t.left - pad));
    assert.equal(t.y, Math.max(0, t.top - pad));
    assert.equal(t.x + t.width, Math.min(w, t.left + t.w + pad));
    assert.equal(t.y + t.height, Math.min(h, t.top + t.h + pad));
    for (let y = t.top; y < t.top + t.h; y++) for (let x = t.left; x < t.left + t.w; x++) covered[y * w + x]++;
  }
  assert.ok(covered.every((n) => n === 1));
});

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

test("shared views round-trip local file bytes and reference hosted layouts without embedding them", async () => {
  const { viewLink, readView, modelURL } = await import("../apps/seamos/share-view.js");
  const bytes = Uint8Array.from([0, 1, 128, 254, 255]);
  const file = new File([bytes], "μchip.oas");
  const state = { version: 1, cell: "CHIP", filename: file.name, layers: [], effect: "ink", peeled: ["2/1"] };
  const base = "https://example.org/apps/seamos/?preset=bryce#old";
  const url = new URL(await viewLink(base, state, file));
  assert.equal(url.search, "");
  const restored = await readView(url);
  assert.equal(restored.file.name, file.name);
  assert.deepEqual(new Uint8Array(await restored.file.arrayBuffer()), bytes);
  assert.deepEqual(restored.state, state);
  const source = "https://example.org/layouts/chip.oas";
  const hosted = new URL(await viewLink(base, state, file, source));
  assert.equal(hosted.searchParams.get("model"), source);
  assert.equal(new URLSearchParams(hosted.hash.slice(1)).has("file"), false);
  assert.throws(() => modelURL("file:///tmp/chip.oas"));
  await assert.rejects(readView(new URL(base + "&view=oops")));
});

test("ink and blueprint highlight a color boundary without changing the source frame", async () => {
  const { styleFrame } = await import("../apps/seamos/postprocess.js");
  const raw = Uint8ClampedArray.from([80, 80, 80, 230, 230].flatMap((v) => [v, v, v, 255]));
  const ink = styleFrame(raw, 5, 1, "ink"),
    blue = styleFrame(raw, 5, 1, "blueprint");
  assert.equal(ink[0], 80);
  assert.ok(ink[8] < 80);
  assert.ok(blue[10] > blue[2]);
  assert.equal(raw[8], 80);
  assert.equal(styleFrame(raw, 5, 1, "off"), raw);
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
