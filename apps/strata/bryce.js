// World-space units and directions shared by the raster and CPU renderers.
export const waterLevel = -0.045;
const skies = [
  { name: "Sunset", file: "bryce-sky", elevation: 6, light: 0xffdcc5 },
  { name: "Daybreak", file: "bryce-daybreak", elevation: 9, light: 0xffbc91 },
  { name: "Trade winds", file: "bryce-trade-winds", elevation: 28, light: 0xfff5e7 },
  { name: "Squall", file: "bryce-squall", elevation: 14, light: 0xd7deeb },
];
export const defaultSky = { ...skies[0], turn: 0 };
function pickDifferent(choices, name) {
  const available = choices.filter((choice) => choice.name !== name);
  return available[Math.floor(Math.random() * available.length)];
}
export function randomSky(previous) {
  return { ...pickDifferent(skies, previous.name), turn: Math.random() };
}
export function sunDirection(sky) {
  const yaw = (0.179 - 0.5 + sky.turn) * 2 * Math.PI,
    elevation = (sky.elevation * Math.PI) / 180;
  return [Math.cos(yaw) * Math.cos(elevation), Math.sin(elevation), Math.sin(yaw) * Math.cos(elevation)];
}

// Each band describes two crossed swells. Distant ripples fade into the horizon.
const swellBands = [
  { x: 0.67, z: 1.34, amplitude: 0.036, phase: 1.6 },
  { x: -2.4, z: 3.82, amplitude: 0.032, phase: 0.7 },
  { x: 4.78, z: 8.95, amplitude: 0.029, phase: 2.4 },
  { x: -8.25, z: 17.82, amplitude: 0.017, phase: 4.9 },
];
export const defaultWater = { name: "Sunset ripples", color: [0.045, 0.15, 0.21], bands: swellBands };
const seas = [
  { name: "Glass lagoon", color: [0.028, 0.23, 0.2], amplitude: 0.35, frequency: 0.77 },
  { name: "Open swell", color: [0.014, 0.075, 0.18], amplitude: 1.45, frequency: 0.58 },
  { name: "Wind chop", color: [0.024, 0.14, 0.17], amplitude: 1.7, frequency: 1.58 },
  { name: "Silver tide", color: [0.16, 0.21, 0.26], amplitude: 0.72, frequency: 0.95 },
];
export function randomWater(previous) {
  const sea = pickDifferent(seas, previous.name);
  const angle = Math.random() * Math.PI * 2,
    cos = Math.cos(angle),
    sin = Math.sin(angle);
  const bands = swellBands.map((b) => {
    const scale = sea.frequency * (0.75 + Math.random() * 0.5);
    return {
      x: (b.x * cos - b.z * sin) * scale,
      z: (b.x * sin + b.z * cos) * scale,
      amplitude: b.amplitude * sea.amplitude * (0.75 + Math.random() * 0.5),
      phase: b.phase * (0.7 + Math.random() * 0.6),
    };
  });
  return { name: sea.name, color: sea.color, bands };
}
export function waterNormal(x, z, distance, normal, bands) {
  const warp = 1.8 * Math.sin(0.42 * x + 0.19 * z) + 0.65 * Math.sin(0.73 * z - 0.17 * x);
  let dx = 0,
    dz = 0;
  for (const band of bands) {
    const wave = (band.amplitude * Math.cos(band.x * x + band.z * z + band.phase * warp)) / (1 + distance * Math.hypot(band.x, band.z) * 0.0008);
    const k = Math.hypot(band.x, band.z);
    dx += (wave * band.x) / k;
    dz += (wave * band.z) / k;
  }
  return normal.set(-dx, 1, -dz).normalize();
}
const linear = Float32Array.from({ length: 256 }, (_, i) => {
  const v = i / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
});
// Equirectangular, bilinear sky sampling, with a wrapped longitude and clamped poles.
export function sampleSky({ width, height, pixels }, d) {
  const x = (Math.atan2(d.z, d.x) / (2 * Math.PI) + 0.5) * width - 0.5;
  const y = Math.max(0, Math.min(height - 1, (0.5 - Math.asin(Math.min(1, Math.max(-1, d.y))) / Math.PI) * height - 0.5));
  const ix = Math.floor(x),
    iy = Math.floor(y),
    fx = x - ix,
    fy = y - iy;
  const x0 = (ix + width) % width,
    x1 = (x0 + 1) % width,
    y1 = Math.min(iy + 1, height - 1);
  const a = (iy * width + x0) * 4,
    b = (iy * width + x1) * 4,
    c = (y1 * width + x0) * 4,
    e = (y1 * width + x1) * 4;
  return [0, 1, 2].map(
    (k) =>
      (1 - fy) * ((1 - fx) * linear[pixels[a + k]] + fx * linear[pixels[b + k]]) +
      fy * ((1 - fx) * linear[pixels[c + k]] + fx * linear[pixels[e + k]])
  );
}
