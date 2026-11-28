import { readLayout } from "./parser.js";
import { ShapeUtils, Vector2 } from "./lib/graphics.js";

// X/Y in the layout become X/-Z in the viewport. Keep footprint coordinates
// in double precision until they have been centered, including offset reticles.
function bounds(layers) {
  let left = Infinity,
    right = -Infinity,
    bottom = Infinity,
    top = -Infinity;
  for (const layer of layers) {
    for (const ring of layer.polygons) {
      for (let k = 0; k < ring.length; k += 2) {
        left = Math.min(left, ring[k]);
        right = Math.max(right, ring[k]);
        bottom = Math.min(bottom, ring[k + 1]);
        top = Math.max(top, ring[k + 1]);
      }
    }
  }
  return { left, right, bottom, top };
}
function meshLayout(layout, frame) {
  const { left, right, bottom, top } = frame ?? bounds(layout.layers);
  const width = right - left,
    height = top - bottom;
  if ((!Number.isFinite(width + height) || Math.max(width, height) <= 0) && !frame) throw new Error("This cell contains no drawable polygons.");
  const scale = frame?.scale ?? 10 / Math.max(width, height);
  const cx = left + width / 2,
    cy = bottom + height / 2;
  // A small top-edge chamfer catches studio light on rectangular mask features.
  // Keep very large layouts on the lower-memory, sharp-edge mesh path.
  const useBevel = !frame && layout.layers.reduce((n, layer) => n + layer.polygons.length, 0) <= 18000;
  const layers = layout.layers
    .sort((a, b) => a.layer - b.layer || a.datatype - b.datatype)
    .map((layer) => {
      const vertexCount = layer.polygons.reduce((total, p) => total + p.length / 2, 0);
      const bevelCapacity = useBevel ? layer.polygons.reduce((n, p) => n + (p.length === 8 ? 4 : 0), 0) : 0;
      const positions = new Float32Array(vertexCount * 6 + bevelCapacity * 3);
      const indices = new Uint32Array(vertexCount * 12 + bevelCapacity * 6);
      // One span per polygon. All its extruded vertices share the same owners.
      const spans = new Uint32Array(layer.polygons.length * 3);
      let v = 0,
        t = 0,
        count = 0;
      for (const [polygon, ring] of layer.polygons.entries()) {
        const points = [];
        for (let i = 0; i < ring.length; i += 2) {
          const point = new Vector2((ring[i] - cx) * scale, (ring[i + 1] - cy) * scale);
          if (!point.equals(points.at(-1) ?? { x: NaN, y: NaN })) points.push(point);
        }
        if (points.length > 1 && points[0].equals(points.at(-1))) points.pop();
        if (points.length < 3) continue;
        if (ShapeUtils.isClockWise(points)) points.reverse();
        const faces = ShapeUtils.triangulateShape(points, []);
        if (!faces.length) continue;
        const n = points.length,
          start = v;
        const bevel =
          useBevel &&
          ring.length === 8 &&
          n === 4 &&
          points.every((p, i) => {
            const q = points[(i + 1) % 4];
            return Math.abs(p.x - q.x) < 1e-10 || Math.abs(p.y - q.y) < 1e-10;
          });
        const levels = bevel ? [0, 0.72, 1] : [0, 1];
        const middle = bevel ? points.reduce((mid, p) => mid.add(p), new Vector2()).multiplyScalar(0.25) : null;
        const inset = bevel ? Math.min(0.023, ...points.map((p, i) => p.distanceTo(points[(i + 1) % 4]) * 0.13)) : 0;
        for (const level of levels) {
          for (const p of points) {
            const bevelTop = bevel && level === 1;
            positions[3 * v] = p.x + (bevelTop ? Math.sign(middle.x - p.x) * inset : 0);
            positions[3 * v + 1] = level;
            positions[3 * v + 2] = -(p.y + (bevelTop ? Math.sign(middle.y - p.y) * inset : 0));
            v++;
          }
        }
        const topStart = start + n * (levels.length - 1);
        for (const [a, b, c] of faces) {
          indices.set([start + c, start + b, start + a, topStart + a, topStart + b, topStart + c], t);
          t += 6;
        }
        for (let strip = 0; strip < levels.length - 1; strip++) {
          for (let k = 0; k < n; k++) {
            const a = start + strip * n + k,
              b = start + strip * n + ((k + 1) % n);
            indices.set([a, b, b + n, a, b + n, a + n], t);
            t += 6;
          }
        }
        spans.set([v, layer.branches[polygon], layer.logic[polygon]], count * 3);
        count++;
      }
      return {
        layer: layer.layer,
        datatype: layer.datatype,
        count,
        spans: spans.subarray(0, count * 3),
        positions: positions.subarray(0, v * 3),
        indices: indices.subarray(0, t),
      };
    })
    .filter((layer) => layer.count);
  if (!layers.length && !frame) throw new Error("This cell contains no drawable polygons.");
  return { name: layout.name, cells: layout.cells, roots: layout.roots, cellNames: layout.cellNames, width, height, layers };
}
// Mesh each cell definition once in its own coordinate system. Each placement
// stores a footprint transform followed by its branch and functional class.
function meshShared(layout) {
  let left = Infinity,
    right = -Infinity,
    bottom = Infinity,
    top = -Infinity;
  const templates = layout.templates.filter((t) => t.layers.length);
  for (const t of templates) {
    t.box = bounds(t.layers);
    const { left: x0, right: x1, bottom: y0, top: y1 } = t.box;
    const rotatedBounds = new Map();
    for (let i = 0; i < t.placements.length; i += 8) {
      const [a, b, c, d, x, y] = t.placements.subarray(i, i + 6);
      const eps = 1e-12 * Math.max(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d));
      if (Math.abs(a) > eps && Math.abs(c) > eps) {
        // For non-Manhattan references, the rotated bounding box can overstate
        // the actual footprint. Reuse exact extrema for matching orientations.
        const key = [a, b, c, d].join(",");
        if (!rotatedBounds.has(key)) {
          let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
          for (const layer of t.layers)
            for (const ring of layer.polygons) {
              for (let k = 0; k < ring.length; k += 2) {
                const px = a * ring[k] + c * ring[k + 1],
                  py = b * ring[k] + d * ring[k + 1];
                minX = Math.min(minX, px);
                maxX = Math.max(maxX, px);
                minY = Math.min(minY, py);
                maxY = Math.max(maxY, py);
              }
            }
          rotatedBounds.set(key, [minX, maxX, minY, maxY]);
        }
        const [minX, maxX, minY, maxY] = rotatedBounds.get(key);
        left = Math.min(left, x + minX);
        right = Math.max(right, x + maxX);
        bottom = Math.min(bottom, y + minY);
        top = Math.max(top, y + maxY);
        continue;
      }
      left = Math.min(left, x + Math.min(a * x0, a * x1) + Math.min(c * y0, c * y1));
      right = Math.max(right, x + Math.max(a * x0, a * x1) + Math.max(c * y0, c * y1));
      bottom = Math.min(bottom, y + Math.min(b * x0, b * x1) + Math.min(d * y0, d * y1));
      top = Math.max(top, y + Math.max(b * x0, b * x1) + Math.max(d * y0, d * y1));
    }
  }
  const width = right - left,
    height = top - bottom,
    scale = 10 / Math.max(width, height);
  if (!Number.isFinite(scale) || scale <= 0) throw new Error("This cell contains no drawable polygons.");
  const layers = new Map();
  for (const t of templates) {
    const regular = [],
      mirrored = [];
    const cx = (t.box.left + t.box.right) / 2,
      cy = (t.box.bottom + t.box.top) / 2;
    for (let i = 0; i < t.placements.length; i += 8) {
      const [a, b, c, d, x, y, branch, logic] = t.placements.subarray(i, i + 8);
      const flip = a * d - b * c < 0,
        sign = flip ? -1 : 1;
      (flip ? mirrored : regular).push(
        a * sign,
        -b * sign,
        -c,
        d,
        (a * cx + c * cy + x - (left + width / 2)) * scale,
        -(b * cx + d * cy + y - (bottom + height / 2)) * scale,
        branch,
        logic
      );
    }
    const groups = [new Float32Array(regular), new Float32Array(mirrored)];
    for (const source of meshLayout(t, { ...t.box, scale }).layers) {
      // Put upper faces first so a distant preview can skip subpixel walls.
      // Both ranges are retained for close views and all ray intersections.
      const sorted = new Uint32Array(source.indices.length);
      let surfaceCount = 0,
        back = sorted.length;
      for (let i = 0; i < source.indices.length; i += 3) {
        const a = source.indices[i],
          b = source.indices[i + 1],
          c = source.indices[i + 2];
        const surface = [a, b, c].every((v) => source.positions[3 * v + 1] === 1);
        const offset = surface ? surfaceCount : (back -= 3);
        sorted.set([a, b, c], offset);
        if (surface) surfaceCount += 3;
      }
      source.indices = sorted;
      const key = source.layer + "/" + source.datatype;
      if (!layers.has(key)) layers.set(key, { layer: source.layer, datatype: source.datatype, count: 0, parts: [] });
      const layer = layers.get(key);
      for (const [flip, placements] of groups.entries()) {
        if (!placements.length) continue;
        let { positions, indices } = source;
        if (flip) {
          positions = positions.slice();
          indices = indices.slice();
          for (let i = 0; i < positions.length; i += 3) positions[i] *= -1;
          for (let i = 0; i < indices.length; i += 3) [indices[i], indices[i + 1]] = [indices[i + 1], indices[i]];
        }
        layer.parts.push({ positions, indices, placements, spans: source.spans, surfaceCount });
        layer.count += (source.count * placements.length) / 8;
      }
    }
  }
  if (!layers.size) throw new Error("This cell contains no drawable polygons.");
  return {
    name: layout.name,
    cells: layout.cells,
    roots: layout.roots,
    cellNames: layout.cellNames,
    width,
    height,
    layers: [...layers.values()].sort((a, b) => a.layer - b.layer || a.datatype - b.datatype),
  };
}
self.onmessage = async ({ data }) => {
  try {
    const layout = await readLayout(data.buffer, data.cell, (cells, roots) => {
      postMessage({ type: "catalog", cells, roots });
    });
    const mesh = layout.templates ? meshShared(layout) : meshLayout(layout);
    mesh.format = new Uint8Array(data.buffer)[0] === 37 ? "OASIS" : "GDSII";
    const buffers = new Set();
    for (const layer of mesh.layers) {
      for (const part of layer.parts ?? [layer]) {
        for (const array of [part.positions, part.indices, part.spans, part.placements]) if (array) buffers.add(array.buffer);
      }
    }
    postMessage(mesh, [...buffers]);
  } catch (error) {
    postMessage({ error: error.message || "The layout could not be read." });
  }
};
