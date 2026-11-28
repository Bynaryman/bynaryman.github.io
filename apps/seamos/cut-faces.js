// A vertical cut through an extruded mask gives alternating filled intervals.
// Work only on intersected placements and keep each cut face's original color owner.
const footprints = new WeakMap();
function footprint(part) {
  let cached = footprints.get(part);
  if (cached) return cached;
  const p = part.positions,
    rings = [];
  let x0 = Infinity,
    x1 = -Infinity,
    z0 = Infinity,
    z1 = -Infinity,
    start = 0;
  for (let j = 0; j < part.spans.length; j += 3) {
    const end = part.spans[j];
    let n = 0;
    while (start + n < end && p[(start + n) * 3 + 1] === 0) n++;
    let left = Infinity,
      right = -Infinity,
      back = Infinity,
      front = -Infinity;
    for (let i = start; i < start + n; i++) {
      left = Math.min(left, p[3 * i]);
      right = Math.max(right, p[3 * i]);
      back = Math.min(back, p[3 * i + 2]);
      front = Math.max(front, p[3 * i + 2]);
    }
    rings.push({ start, n, levels: (end - start) / n, left, right, back, front });
    x0 = Math.min(x0, left);
    x1 = Math.max(x1, right);
    z0 = Math.min(z0, back);
    z1 = Math.max(z1, front);
    start = end;
  }
  cached = { rings, left: x0, right: x1, back: z0, front: z1 };
  footprints.set(part, cached);
  return cached;
}
// The GDS via masks use rectangular plugs. Find the closest actual placement
// in the layout so the slice goes through its center, even below the slider step.
export function nearestVia(layer, target) {
  let best = Infinity,
    center = null;
  for (const part of layer.parts ?? [layer]) {
    const { rings } = footprint(part),
      tr = part.placements ?? [1, 0, 0, 1, 0, 0];
    for (let i = 0; i < tr.length; i += 8)
      for (const r of rings) {
        const px = (r.left + r.right) / 2,
          pz = (r.back + r.front) / 2;
        const x = tr[i] * px + tr[i + 2] * pz + tr[i + 4],
          z = tr[i + 1] * px + tr[i + 3] * pz + tr[i + 5];
        const distance = (x - target.x) ** 2 + (z - target.z) ** 2;
        if (distance < best) {
          best = distance;
          center = {
            x,
            z,
            width: Math.max(
              Math.abs(tr[i]) * (r.right - r.left) + Math.abs(tr[i + 2]) * (r.front - r.back),
              Math.abs(tr[i + 1]) * (r.right - r.left) + Math.abs(tr[i + 3]) * (r.front - r.back)
            ),
          };
        }
      }
  }
  return center;
}
function crosses(box, a, b, d) {
  return (
    Math.min(a * box.left, a * box.right) + Math.min(b * box.back, b * box.front) <= d &&
    Math.max(a * box.left, a * box.right) + Math.max(b * box.back, b * box.front) > d
  );
}
export function cutFaces(layer, section, colors) {
  const positions = [],
    tints = [],
    axis = section.axis,
    plane = section.cutAt;
  for (const [partIndex, part] of (layer.parts || [layer]).entries()) {
    const f = footprint(part),
      p = part.positions;
    const placements = part.placements || [1, 0, 0, 1, 0, 0];
    for (let j = 0; j < placements.length; j += 8) {
      const a = placements[j],
        b = placements[j + 1],
        c = placements[j + 2],
        d = placements[j + 3],
        x = placements[j + 4],
        z = placements[j + 5];
      const nx = axis === 0 ? a : b,
        nz = axis === 0 ? c : d,
        offset = plane - (axis === 0 ? x : z);
      if (!crosses(f, nx, nz, offset)) continue;
      for (const ring of f.rings) {
        if (!crosses(ring, nx, nz, offset)) continue;
        const { start, n, levels } = ring;
        const bytes = part.placements ? colors?.[partIndex] : colors;
        const ci = part.placements ? (j / 8) * 3 : start * 3;
        function vertex(u, h) {
          if (axis === 0) positions.push(plane, h, u);
          else positions.push(u, h, plane);
          if (bytes) tints.push(bytes[ci], bytes[ci + 1], bytes[ci + 2]);
        }
        function intervals(level, t) {
          const cuts = [];
          function point(k) {
            const i = (start + level * n + k) * 3;
            const px = p[i] + t * (p[i + 3 * n] - p[i]),
              pz = p[i + 2] + t * (p[i + 3 * n + 2] - p[i + 2]);
            return [nx * px + nz * pz - offset, axis === 0 ? b * px + d * pz + z : a * px + c * pz + x];
          }
          let prev = point(n - 1);
          for (let k = 0; k < n; k++) {
            const next = point(k);
            if (prev[0] > 0 !== next[0] > 0) cuts.push(prev[1] + ((next[1] - prev[1]) * prev[0]) / (prev[0] - next[0]));
            prev = next;
          }
          return cuts.sort((a, b) => a - b);
        }
        for (let level = 0; level < levels - 1; level++) {
          const h0 = p[(start + level * n) * 3 + 1],
            h1 = p[(start + (level + 1) * n) * 3 + 1];
          const steps = [0, 1];
          // A beveled top can taper to zero before reaching the top face.
          if (level > 0)
            for (let k = 0; k < n; k++) {
              const i = (start + level * n + k) * 3;
              const low = nx * p[i] + nz * p[i + 2] - offset,
                high = nx * p[i + n * 3] + nz * p[i + n * 3 + 2] - offset;
              const t = low / (low - high);
              if (t > 0 && t < 1) steps.push(t);
            }
          steps.sort((a, b) => a - b);
          for (let s = 1; s < steps.length; s++) {
            const low = steps[s - 1],
              high = steps[s];
            if (high === low) continue;
            const u = intervals(level, low + (high - low) * 1e-8),
              v = intervals(level, high - (high - low) * 1e-8);
            const bottom = h0 + (h1 - h0) * low,
              top = h0 + (h1 - h0) * high;
            for (let k = 0; k + 1 < Math.min(u.length, v.length); k += 2) {
              vertex(u[k], bottom);
              vertex(u[k + 1], bottom);
              vertex(v[k + 1], top);
              vertex(u[k], bottom);
              vertex(v[k + 1], top);
              vertex(v[k], top);
            }
          }
        }
      }
    }
  }
  return { positions: new Float32Array(positions), colors: new Uint8Array(tints) };
}
