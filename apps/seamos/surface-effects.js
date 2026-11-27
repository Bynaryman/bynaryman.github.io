// The scan uses a byte of world-space height per pixel. Zero is background.
export const defaultFinish = { allMetals: false, face: "#f29956", rim: "#9756ff" };
export const defaultScan = { enabled: false, speed: 1, band: "#72faff", trail: "#9773ff" };
export function metalSurface(type) {
  return type === "metal" || type === "iridescent";
}
export function coated(type, allMetals) {
  return type === "iridescent" || (allMetals && type === "metal");
}
export function stackRange(layers) {
  let bottom = Infinity,
    top = -Infinity;
  for (const l of layers)
    if (l.visible) {
      bottom = Math.min(bottom, l.y);
      top = Math.max(top, l.y + l.thickness);
    }
  return top > bottom ? [bottom, 1 / (top - bottom)] : [0, 1];
}
export function heightByte(y, range) {
  return 1 + Math.round(254 * Math.max(0, Math.min(1, (y - range[0]) * range[1])));
}
export function scanPhase(phase, speed, elapsedMs) {
  return (phase + (speed * elapsedMs) / 6000) % 1;
}
export function rgbBytes(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}
export function paintScan(pixels, heights, scan, phase, out) {
  if (!scan.enabled || !heights) return pixels;
  const band = rgbBytes(scan.band),
    trail = rgbBytes(scan.trail);
  const table = new Float32Array(256 * 4);
  const center = phase * 1.32 - 0.09;
  for (let i = 1; i < 256; i++) {
    const distance = center - (i - 1) / 254;
    const core = Math.max(0, 1 - Math.abs(distance) / 0.09);
    const tail = Math.max(0, 1 - Math.abs(distance - 0.08) / 0.15) * (1 - core);
    const a = core * 0.84,
      b = tail * 0.46;
    for (let k = 0; k < 3; k++) table[i * 4 + k] = a * band[k] + b * trail[k];
    table[i * 4 + 3] = a + b;
  }
  out ??= new Uint8ClampedArray(pixels.length);
  out.set(pixels);
  for (let i = 0; i < heights.length; i++) {
    const j = 4 * heights[i],
      keep = 1 - table[j + 3];
    if (keep === 1) continue;
    const p = i * 4;
    for (let k = 0; k < 3; k++) out[p + k] = keep * pixels[p + k] + table[j + k];
  }
  return out;
}
