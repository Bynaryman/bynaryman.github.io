import { BufferAttribute, BufferGeometry, DoubleSide, MeshBVH, Ray } from "./lib/intersections.js";

function tree(positions, indices) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  if (indices) geometry.setIndex(new BufferAttribute(indices, 1));
  return new MeshBVH(geometry, { maxLeafTris: 10 });
}

// A top-level BVH indexes placement bounds. Leaves reuse the exact triangle
// BVH for their cell instead of storing another copy at each location.
export function layerTree(layer) {
  if (!layer.parts) return tree(layer.positions, layer.indices);
  const parts = layer.parts;
  const total = parts.reduce((n, p) => n + p.placements.length / 8, 0);
  const bounds = new Float32Array(total * 9),
    partIds = new Uint32Array(total),
    offsets = new Uint32Array(total);
  let id = 0;
  const trees = parts.map(({ positions, indices, placements }, part) => {
    const bvh = tree(positions, indices);
    const box = bvh.geometry.boundingBox;
    for (let i = 0; i < placements.length; i += 8) {
      const [a, b, c, d, x, z] = placements.subarray(i, i + 6);
      const left = x + Math.min(a * box.min.x, a * box.max.x) + Math.min(c * box.min.z, c * box.max.z);
      const right = x + Math.max(a * box.min.x, a * box.max.x) + Math.max(c * box.min.z, c * box.max.z);
      const back = z + Math.min(b * box.min.x, b * box.max.x) + Math.min(d * box.min.z, d * box.max.z);
      const front = z + Math.max(b * box.min.x, b * box.max.x) + Math.max(d * box.min.z, d * box.max.z);
      // Only the bounding boxes of these proxy triangles are traversed.
      bounds.set([left, 0, back, right, 1, front, left, 1, front], id * 9);
      partIds[id] = part;
      offsets[id++] = i;
    }
    return bvh;
  });
  const placementsTree = tree(bounds),
    order = placementsTree.geometry.index.array;
  const local = new Ray();
  return {
    raycastFirst(ray, side, near, far) {
      let result = null;
      placementsTree.shapecast({
        intersectsBounds: (box) => ray.intersectsBox(box),
        intersectsRange(first, count) {
          for (let tri = first; tri < first + count; tri++) {
            const id = order[3 * tri] / 3,
              part = partIds[id],
              offset = offsets[id],
              tr = parts[part].placements;
            const a = tr[offset],
              b = tr[offset + 1],
              c = tr[offset + 2],
              d = tr[offset + 3],
              det = a * d - b * c;
            if (!det) continue;
            const x = ray.origin.x - tr[offset + 4],
              z = ray.origin.z - tr[offset + 5];
            local.origin.set((d * x - c * z) / det, ray.origin.y, (a * z - b * x) / det);
            local.direction.set(
              (d * ray.direction.x - c * ray.direction.z) / det,
              ray.direction.y,
              (a * ray.direction.z - b * ray.direction.x) / det
            );
            const scale = local.direction.length();
            local.direction.multiplyScalar(1 / scale);
            const hit = trees[part].raycastFirst(local, DoubleSide, near * scale, far * scale);
            if (!hit) continue;
            hit.distance /= scale;
            far = hit.distance;
            const n = hit.face.normal;
            n.set((d * n.x - b * n.z) / det, n.y, (a * n.z - c * n.x) / det).normalize();
            hit.part = part;
            hit.instance = offset / 8;
            result = hit;
          }
          return false;
        },
      });
      return result;
    },
  };
}
