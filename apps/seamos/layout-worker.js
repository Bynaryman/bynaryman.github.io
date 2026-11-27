import { readLayout } from "./parser.js";
import { ShapeUtils, Vector2 } from "./lib/graphics.js";

// X/Y in the layout become X/-Z in the viewport. Keep footprint coordinates
// in double precision until they have been centered, including offset reticles.
function meshLayout(layout) {
  let left = Infinity,
    right = -Infinity,
    bottom = Infinity,
    top = -Infinity;
  for (const layer of layout.layers) {
    for (const ring of layer.polygons) {
      for (let k = 0; k < ring.length; k += 2) {
        left = Math.min(left, ring[k]);
        right = Math.max(right, ring[k]);
        bottom = Math.min(bottom, ring[k + 1]);
        top = Math.max(top, ring[k + 1]);
      }
    }
  }
  const width = right - left,
    height = top - bottom;
  if (!Number.isFinite(width + height) || Math.max(width, height) <= 0) throw new Error("This cell contains no drawable polygons.");
  const scale = 10 / Math.max(width, height);
  const cx = left + width / 2,
    cy = bottom + height / 2;
  // A small top-edge chamfer catches studio light on rectangular mask features.
  // Keep very large layouts on the lower-memory, sharp-edge mesh path.
  const useBevel = layout.layers.reduce((n, layer) => n + layer.polygons.length, 0) <= 18000;
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
  if (!layers.length) throw new Error("This cell contains no drawable polygons.");
  return { name: layout.name, cells: layout.cells, roots: layout.roots, cellNames: layout.cellNames, width, height, layers };
}
self.onmessage = async ({ data }) => {
  try {
    const mesh = meshLayout(
      await readLayout(data.buffer, data.cell, (cells, roots) => {
        postMessage({ type: "catalog", cells, roots });
      })
    );
    mesh.format = new Uint8Array(data.buffer)[0] === 37 ? "OASIS" : "GDSII";
    postMessage(
      mesh,
      mesh.layers.flatMap((layer) => [layer.positions.buffer, layer.indices.buffer, layer.spans.buffer])
    );
  } catch (error) {
    postMessage({ error: error.message || "The layout could not be read." });
  }
};
