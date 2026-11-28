import { paintScan } from "./surface-effects.js";

export function* imageTiles(width, height, padding, size = 512) {
  for (let top = 0; top < height; top += size)
    for (let left = 0; left < width; left += size) {
      const w = Math.min(size, width - left),
        h = Math.min(size, height - top);
      const x = Math.max(0, left - padding),
        y = Math.max(0, top - padding);
      yield {
        x,
        y,
        width: Math.min(width, left + w + padding) - x,
        height: Math.min(height, top + h + padding) - y,
        left,
        top,
        w,
        h,
        fullWidth: width,
        fullHeight: height,
      };
    }
}
export function currentSize(vp, trace) {
  if (!trace) return [vp.canvas.width, vp.canvas.height];
  const w = vp.canvas.clientWidth,
    h = vp.canvas.clientHeight;
  const scale = Math.min(1, Math.sqrt(420000 / (w * h)));
  return [Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale))];
}
function preview(vp, ctx, width, height, phase) {
  const r = vp.renderer,
    gl = r?.getContext();
  if (!gl || gl.isContextLost()) throw new Error("The preview renderer is unavailable.");
  const limit = Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), r.capabilities.maxTextureSize);
  if (Math.max(width, height) > limit) throw new Error("Preview resolution on this adapter is limited to " + limit + " pixels per side.");
  const widthBefore = vp.viewportWidth,
    heightBefore = vp.viewportHeight,
    ratio = r.getPixelRatio(),
    aspect = vp.camera.aspect;
  try {
    r.setDrawingBufferSize(width, height, 1);
    if (gl.drawingBufferWidth !== width || gl.drawingBufferHeight !== height) throw new Error("The GPU could not allocate this image size.");
    vp.camera.aspect = width / height;
    vp.camera.updateProjectionMatrix();
    vp.camera.updateMatrixWorld();
    vp.drawPreview(phase);
    ctx.drawImage(vp.canvas, 0, 0);
  } finally {
    r.setDrawingBufferSize(widthBefore, heightBefore, ratio);
    vp.camera.aspect = aspect;
    vp.camera.updateProjectionMatrix();
    vp.drawPreview();
  }
}
async function traceTiles(vp, ctx, width, height, samples, phase, signal, progress) {
  const f = vp.traceFrame,
    scan = { ...vp.scan };
  if (
    vp.trace &&
    !vp.traced.hidden &&
    f?.width === width &&
    f.height === height &&
    samples === vp.traceSamples &&
    samples === vp.samples &&
    vp.displayRevision === vp.shownDisplayRevision
  ) {
    ctx.putImageData(new ImageData(paintScan(f.pixels, f.heights, scan, phase), width, height), 0, 0);
    return;
  }
  const worker = vp.geometryWorker();
  try {
    if (vp.environment === "ocean") vp.sendSky(worker);
    await traceMovieFrame(vp, worker, ctx, samples, phase, signal, progress);
  } finally {
    worker.terminate();
  }
}

// Use the same tiled renderer for stills and every frame of a movie. A movie
// keeps its worker (and the chip's acceleration structures) for the whole shot.
export async function traceMovieFrame(vp, worker, ctx, samples, phase, signal, progress, motion = {}) {
  signal.throwIfAborted();
  const { width, height } = ctx.canvas,
    scan = { ...vp.scan };
  const scene = { ...vp.traceSettings(width, height), ...motion, samples, aspect: width / height };
  const padding = Number(scene.denoise) + Number(scene.effect !== "off");
  const tiles = imageTiles(width, height, padding);
  let abort;
  try {
    await new Promise((resolve, reject) => {
      abort = () => reject(signal.reason);
      signal.addEventListener("abort", abort, { once: true });
      let tile,
        done = 0;
      function next() {
        tile = tiles.next().value;
        if (!tile) return resolve();
        worker.postMessage({ ...scene, tile, width: tile.width, height: tile.height, revision: ++scene.revision });
      }
      worker.onerror = () => reject(new Error("The ray tracer stopped. Try a smaller size or fewer samples."));
      worker.onmessage = ({ data }) => {
        try {
          if (data.error) throw new Error(data.error);
          if (!data.pixels) return;
          const pixels = paintScan(data.pixels, data.heights, scan, phase);
          ctx.putImageData(new ImageData(pixels, tile.width, tile.height), tile.x, tile.y, tile.left - tile.x, tile.top - tile.y, tile.w, tile.h);
          done += tile.w * tile.h;
          progress(Math.round((100 * done) / (width * height)));
          next();
        } catch (error) {
          reject(error);
        }
      };
      next();
    });
  } finally {
    signal.removeEventListener("abort", abort);
    worker.onerror = worker.onmessage = null;
  }
}
export async function renderImage(vp, { width, height, trace, samples, format, quality }, signal, progress) {
  if (![width, height].every((n) => Number.isSafeInteger(n) && n >= 1) || !Number.isSafeInteger(width * height * 4))
    throw new Error("Enter positive whole-pixel dimensions.");
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx || canvas.width !== width || canvas.height !== height) throw new Error("The browser could not allocate this image size.");
  const phase = vp.scanPosition();
  try {
    if (trace) await traceTiles(vp, ctx, width, height, samples, phase, signal, progress);
    else preview(vp, ctx, width, height, phase);
    signal.throwIfAborted();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, format, quality));
    signal.throwIfAborted();
    if (!blob || !blob.size) throw new Error("Image encoding failed. Try a smaller image.");
    if (blob.type !== format) throw new Error("This browser cannot encode the selected format. Choose PNG.");
    return blob;
  } finally {
    canvas.width = canvas.height = 1;
  }
}
