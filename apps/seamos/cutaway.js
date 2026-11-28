// SKY130 process-stack diagram, heights in µm (metal bottoms and thicknesses).
// https://skywater-pdk.readthedocs.io/en/main/rules/assumptions.html#process-stack-diagram
const metals = [
  [0.9361, 0.1],
  [1.3761, 0.36],
  [2.0061, 0.36],
  [2.7861, 0.845],
  [4.0211, 0.845],
  [5.3711, 1.26],
];
const wiring = new Map();
for (const [i, [base, thickness]] of metals.entries()) {
  wiring.set(67 + i + "/20", [base, thickness]);
  if (i + 1 < metals.length) wiring.set(67 + i + "/44", [base + thickness, metals[i + 1][0] - base - thickness]);
}
export const defaultCut = { enabled: false, axis: "y", position: 50, oxide: true, trueScale: false };
export const silicaIOR = 1.46;
export function hasWiring(layers) {
  return layers.some((l) => wiring.has(l.key));
}
export function wireStack(layers, scale = 0.48) {
  let height = 0;
  for (const l of layers) {
    const wire = wiring.get(l.key);
    l.thickness = wire ? wire[1] * scale : 0;
    l.y = wire ? (0.1 + wire[0] - metals[0][0]) * scale : 0;
    height = Math.max(height, l.y + l.thickness);
  }
  return height;
}
export function cutVolume(cut, footprint, layers, margin = 0.04) {
  if (!cut.enabled) return null;
  const axis = cut.axis === "x" ? 0 : 2;
  const half = footprint[axis === 0 ? 0 : 1] / 2;
  const cutAt = half * (cut.position / 50 - 1);
  const active = layers.filter((l) => l.visible && l.thickness > 0);
  const lo = [-footprint[0] / 2, active.length ? Math.min(...active.map((l) => l.y)) - margin * 0.625 : 0, -footprint[1] / 2];
  const hi = [footprint[0] / 2, active.length ? Math.max(...active.map((l) => l.y + l.thickness)) + margin : 0, footprint[1] / 2];
  hi[axis] = cutAt;
  return { axis, cutAt, lo, hi, empty: cut.position === 0, oxide: cut.oxide && active.length > 0 && cut.position > 0 };
}
// Trace a single homogeneous dielectric by its outer boundary. Distances are
// in world-ray units, including when a reflected ray starts inside the block.
export function boxHit(origin, dir, lo, hi, epsilon) {
  let near = -Infinity,
    far = Infinity,
    nearAxis,
    farAxis,
    nearSign,
    farSign;
  for (const [i, k] of ["x", "y", "z"].entries()) {
    const o = origin[k],
      d = dir[k];
    if (Math.abs(d) < 1e-15) {
      if (o < lo[i] || o > hi[i]) return null;
      continue;
    }
    const a = (lo[i] - o) / d,
      b = (hi[i] - o) / d;
    if (Math.min(a, b) > near) {
      near = Math.min(a, b);
      nearAxis = k;
      nearSign = -Math.sign(d);
    }
    if (Math.max(a, b) < far) {
      far = Math.max(a, b);
      farAxis = k;
      farSign = Math.sign(d);
    }
  }
  if (far < near || far <= epsilon) return null;
  return near > epsilon ? { distance: near, axis: nearAxis, sign: nearSign } : { distance: far, axis: farAxis, sign: farSign };
}
