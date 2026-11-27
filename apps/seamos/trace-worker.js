import { coated, metalSurface, heightByte, defaultFinish } from "./surface-effects.js";
// Whitted-style rays with jittered camera / area light samples. Layer transforms
// live outside each BVH so material, visibility and spacing edits reuse the trees.
import { Color, DoubleSide, Ray, Vector3 } from "./lib/intersections.js";
import { GpuTracer } from "./gpu-tracer.js";
import { layerTree } from "./placement-tree.js";
import { denoiseFrame, styleFrame } from "./postprocess.js";
import { sampleSky, waterLevel, waterNormal } from "./bryce.js";
let panorama,
  colors = [];
let frame, display, displayTimer;
let gpu,
  gpuFailure,
  renderQueue = Promise.resolve();
let trees = [],
  current = 0;
const pause = () => new Promise((resolve) => setTimeout(resolve, 0));
const testRay = new Ray(),
  sun = new Vector3(-0.45, 0.83, 0.34).normalize();
const epsilon = 0.000015;
const maxBounces = 4;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

function nearest(origin, dir, layers, maximum = Infinity, shadow = false) {
  let best = maximum,
    result = null;
  for (let i = 0; i < trees.length; i++) {
    const layer = layers[i];
    if (!layer.visible || (shadow && layer.style.type === "glass")) continue;
    const t0 = (layer.y - origin.y) / dir.y,
      t1 = (layer.y + layer.thickness - origin.y) / dir.y;
    if (Math.max(t0, t1) < epsilon || Math.min(t0, t1) > best) continue;
    testRay.origin.set(origin.x, (origin.y - layer.y) / layer.thickness, origin.z);
    testRay.direction.set(dir.x, dir.y / layer.thickness, dir.z);
    const scale = testRay.direction.length();
    testRay.direction.multiplyScalar(1 / scale);
    const hit = trees[i].raycastFirst(testRay, DoubleSide, epsilon * scale, best * scale);
    if (hit) {
      if (shadow) return true;
      best = hit.distance / scale;
      const normal = hit.face.normal.clone();
      normal.y /= layer.thickness;
      result = { layer, part: hit.part, vertex: hit.instance ?? hit.face.a, normal: normal.normalize(), distance: best };
    }
  }
  if (!shadow && dir.y < 0) {
    const distance = (waterLevel - origin.y) / dir.y;
    if (distance > epsilon && distance < best) return { normal: new Vector3(0, 1, 0), distance };
  }
  return result;
}
function studio(d) {
  const upper = 0.16 + 0.3 * Math.max(d.y, 0);
  const a = d.x / Math.max(0.01, d.y),
    b = d.z / Math.max(0.01, d.y);
  const panel = (x, z, w, h) => Math.max(0, 1 - Math.max(Math.abs(a - x) / w, Math.abs(b - z) / h));
  const warm = d.y > 0 ? 4.8 * Math.min(1, 5 * panel(-1.0, 0.85, 0.72, 1.0)) : 0;
  const cool = d.y > 0 ? 3.4 * Math.min(1, 6 * panel(1.4, -0.4, 0.28, 1.1)) : 0;
  return [upper + warm + 0.78 * cool, upper * 1.05 + 0.92 * warm + 0.9 * cool, upper * 1.13 + 0.82 * warm + cool];
}
function trace(origin, dir, scene, depth, heights, pixel) {
  const hit = nearest(origin, dir, scene.layers);
  if (!hit) return scene.ocean ? sampleSky(panorama, dir) : studio(dir);
  const point = origin.clone().addScaledVector(dir, hit.distance);
  if (heights && hit.layer) heights[pixel] = heightByte(point.y, scene.range || [0, 1]);
  if (scene.ocean && !hit.layer) {
    const normal = waterNormal(point.x, point.z, hit.distance, new Vector3(), scene.water.bands);
    const reflected = dir.clone().reflect(normal);
    reflected.y = Math.max(0.0001, reflected.y);
    reflected.normalize();
    const reflection =
      depth < maxBounces
        ? trace(point.clone().addScaledVector(hit.normal, epsilon * 4), reflected, scene, depth + 1)
        : sampleSky(panorama, reflected);
    const fresnel = 0.17 + 0.83 * (1 - clamp(-dir.dot(normal), 0, 1)) ** 5;
    const haze = 1 - Math.exp(-hit.distance * 0.00085);
    const horizon = sampleSky(panorama, new Vector3(dir.x, 0.0001, dir.z).normalize());
    return scene.water.color.map((base, i) => (base * (1 - fresnel) + reflection[i] * fresnel) * (1 - haze) + horizon[i] * haze);
  }
  const n = hit.normal.clone();
  const entering = n.dot(dir) < 0;
  if (!entering) n.negate();
  const start = point.clone().addScaledVector(n, epsilon * 3);
  const light = scene.light.clone();
  const spread = scene.ocean ? 0.035 : 0.34;
  light.x += (Math.random() - 0.5) * spread;
  light.z += (Math.random() - 0.5) * spread;
  light.normalize();
  const visibility = nearest(start, light, scene.layers, Infinity, true) ? 0.09 : 1;
  if (!hit.layer) {
    const gridLine = Math.min(Math.abs(point.x - Math.round(point.x)), Math.abs(point.z - Math.round(point.z))) < 0.012;
    const light = (scene.grid && gridLine ? 0.38 : 0.32) * (0.6 + 0.4 * visibility);
    return [light * 0.76, light * 0.91, light * 1.12];
  }
  const { style: s } = hit.layer,
    bytes = hit.part === undefined ? hit.layer.colors : hit.layer.colors?.[hit.part],
    offset = hit.vertex * 3,
    base = bytes ? new Color(bytes[offset] / 255, bytes[offset + 1] / 255, bytes[offset + 2] / 255) : hit.layer.tint,
    metal = metalSurface(s.type) ? s.metalness : 0;
  const cos = clamp(-dir.dot(n), 0, 1);
  let c = base;
  if (coated(s.type, scene.finish?.allMetals)) {
    const a = 1 - cos;
    const tint = scene.filmFace.clone().lerp(scene.filmRim, a * a * (3 - 2 * a));
    c = base.clone().lerp(tint, 0.82);
  }
  const glass = s.type === "glass";
  const direct = Math.max(0, n.dot(light)) * visibility * 1.1;
  const diffuse = 0.26 + direct;
  const local = scene.ocean
    ? [c.r * (0.26 + direct * scene.tint.r), c.g * (0.26 + direct * scene.tint.g), c.b * (0.26 + direct * scene.tint.b)]
    : [c.r * diffuse, c.g * diffuse * 0.96, c.b * diffuse * 0.89];
  if (!glass && metal < 0.005) return local;
  const f0 = ((1 - s.ior) / (1 + s.ior)) ** 2;
  const fresnel = f0 + (1 - f0) * (1 - cos) ** 5;
  const next = dir.clone();
  let transmit = false;
  if (glass) {
    const eta = entering ? 1 / s.ior : s.ior;
    const k = 1 - eta * eta * (1 - cos * cos);
    transmit = k >= 0 && Math.random() > fresnel;
    if (transmit) next.multiplyScalar(eta).addScaledVector(n, eta * cos - Math.sqrt(k));
  }
  if (!transmit) next.reflect(n);
  const jitter = Math.max(0.001, s.roughness * s.roughness) * 0.56;
  next.x += (Math.random() - 0.5) * jitter;
  next.y += (Math.random() - 0.5) * jitter;
  next.z += (Math.random() - 0.5) * jitter;
  next.normalize();
  const secondary =
    depth < maxBounces
      ? trace(point.clone().addScaledVector(n, (transmit ? -1 : 1) * epsilon * 4), next, scene, depth + 1)
      : scene.ocean
        ? sampleSky(panorama, next)
        : studio(next);
  const color = [c.r, c.g, c.b];
  if (glass) return secondary.map((x, i) => x * (transmit ? 0.68 + 0.32 * color[i] : 1));
  return secondary.map((x, i) => local[i] * (1 - metal * 0.85) + x * (metal * (0.12 + 0.88 * color[i]) + fresnel * (1 - metal)));
}
function channel(value) {
  const v = Math.max(0, value),
    linear = clamp((v * (2.51 * v + 0.03)) / (v * (2.43 * v + 0.59) + 0.14), 0, 1);
  return 255 * (linear <= 0.0031308 ? 12.92 * linear : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055);
}
function present() {
  clearTimeout(displayTimer);
  if (!frame) return;
  const { revision, width, height, linear, sample, samples } = frame;
  const gain = display.exposure / Math.max(1, sample);
  let pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, j = 0; i < linear.length; i += 3, j += 4) {
    pixels[j] = channel(linear[i] * gain);
    pixels[j + 1] = channel(linear[i + 1] * gain);
    pixels[j + 2] = channel(linear[i + 2] * gain);
    pixels[j + 3] = 255;
  }
  if (display.denoise && sample === samples) pixels = denoiseFrame(pixels, width, height);
  pixels = styleFrame(pixels, width, height, display.effect);
  postMessage({ revision, width, height, pixels, heights: frame.heights, sample, samples, displayRevision: display.displayRevision }, [
    pixels.buffer,
  ]);
}
async function render(scene) {
  const revision = scene.revision,
    m = scene.matrix;
  scene.light = scene.ocean ? new Vector3(...scene.sunDirection).normalize() : sun;
  scene.tint = new Color(scene.sunlight);
  scene.filmFace = new Color(scene.finish?.face || defaultFinish.face);
  scene.filmRim = new Color(scene.finish?.rim || defaultFinish.rim);
  for (const [i, layer] of scene.layers.entries()) {
    layer.tint = new Color(layer.style.color);
    layer.colors = colors[i];
  }
  const origin = new Vector3(m[12], m[13], m[14]),
    direction = new Vector3();
  const tan = Math.tan((scene.fov * Math.PI) / 360),
    samples = scene.samples;
  let accum, heights;
  for (let sample = scene.tile ? 1 : 0; sample <= samples; sample++) {
    const scale = sample === 0 ? Math.min(1, 240 / scene.width) : 1;
    const width = Math.max(1, Math.round(scene.width * scale)),
      height = Math.max(1, Math.round(scene.height * scale));
    if (sample <= 1) {
      accum = new Float32Array(width * height * 3);
      heights = new Uint8Array(width * height);
    }
    for (let y = 0; y < height; y++) {
      if (y % 6 === 0) {
        await pause();
        if (current !== revision) return;
      }
      for (let x = 0; x < width; x++) {
        const u = (((x + (scene.tile?.x ?? 0) + Math.random()) / (scene.tile?.fullWidth ?? width)) * 2 - 1) * scene.aspect * tan;
        const v = (1 - ((y + (scene.tile?.y ?? 0) + Math.random()) / (scene.tile?.fullHeight ?? height)) * 2) * tan;
        direction.set(m[0] * u + m[4] * v - m[8], m[1] * u + m[5] * v - m[9], m[2] * u + m[6] * v - m[10]).normalize();
        const pixel = y * width + x;
        const rgb = trace(origin, direction, scene, 0, sample <= 1 ? heights : null, pixel);
        for (let k = 0; k < 3; k++) accum[3 * pixel + k] += rgb[k];
      }
    }
    // Keep the last complete pass available while the next pass is accumulating.
    if (scene.tile && sample !== samples) continue;
    frame = { revision, width, height, heights, linear: sample === samples ? accum : accum.slice(), sample, samples };
    present();
  }
}
async function traceScene(scene) {
  const active = () => current === scene.revision;
  if (!active()) return;
  if (scene.device !== "cpu" && !gpuFailure) {
    try {
      gpu ??= await GpuTracer.create(trees);
      if (!active()) return;
      gpu.configure(scene, colors, panorama);
      postMessage({ revision: scene.revision, backend: "GPU · WebGL2 ray tracing", adapter: gpu.adapterName });
      for (let sample = scene.tile ? 1 : 0; sample <= scene.samples; sample++) {
        const scale = sample === 0 ? Math.min(1, 240 / scene.width) : 1;
        const width = Math.max(1, Math.round(scene.width * scale)),
          height = Math.max(1, Math.round(scene.height * scale));
        const result = await gpu.pass(width, height, sample, active, !scene.tile || sample === scene.samples);
        if (!active()) return;
        if (!result) continue;
        frame = { revision: scene.revision, width, height, ...result, sample, samples: scene.samples };
        present();
      }
      return;
    } catch (error) {
      gpu?.dispose();
      gpu = null;
      gpuFailure = error.message || "GPU initialization failed";
      if (!active()) return;
    }
  }
  postMessage({
    revision: scene.revision,
    backend: scene.device === "cpu" ? "CPU ray tracing" : "CPU ray tracing · GPU fallback",
    reason: scene.device === "cpu" ? null : gpuFailure,
  });
  await render(scene);
}
self.onmessage = async ({ data }) => {
  try {
    if (data.type === "panorama") {
      panorama = data.sky;
      return;
    }
    if (data.type === "colors") {
      colors = data.colors;
      return;
    }
    if (data.type === "geometry") {
      gpu?.dispose();
      gpu = null;
      gpuFailure = null;
      trees = data.layers.map(layerTree);
      return;
    }
    if (data.type === "display") {
      if (current === data.revision) {
        display = data;
        clearTimeout(displayTimer);
        displayTimer = setTimeout(present, 0);
      }
      return;
    }
    current = data.revision;
    clearTimeout(displayTimer);
    frame = null;
    if (data.type === "render") {
      display = data;
      renderQueue = renderQueue.catch(() => {}).then(() => traceScene(data));
      await renderQueue;
    }
  } catch (error) {
    postMessage({ revision: current, error: error.message || "The ray tracer ran out of resources." });
  }
};
