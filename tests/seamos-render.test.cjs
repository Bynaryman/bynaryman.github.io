const { test } = require("node:test");
const assert = require("node:assert/strict");

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
