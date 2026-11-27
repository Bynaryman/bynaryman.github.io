// WebGL2 stores each acceleration structure in a random-access RGBA texture.
// Float indices are exact up to 2^24. Larger scenes use the CPU backend.
export function atlas(texels, limit, ArrayType = Float32Array) {
  if (texels > Math.min(2 ** 24, limit * limit)) throw new RangeError("Scene exceeds GPU texture capacity.");
  const width = Math.min(Math.max(1, texels), Math.max(Math.min(2048, limit), Math.ceil(texels / limit)));
  const height = Math.max(1, Math.ceil(texels / width));
  return { width, height, data: new ArrayType(width * height * 4) };
}

export function packTrees(trees, limit) {
  let nodeCount = 0,
    triangleCount = 0,
    vertexCount = 0,
    instanceCount = 0,
    colorCount = 0;
  function count(bvh, proxy) {
    bvh.traverse(() => {
      nodeCount++;
    });
    triangleCount += bvh.geometry.index.count / 3;
    if (!proxy) vertexCount += bvh.geometry.attributes.position.count;
  }
  for (const tree of trees) {
    if (tree.placementsTree) {
      count(tree.placementsTree, true);
      for (const part of tree.trees) count(part, false);
      instanceCount += tree.partIds.length;
      colorCount += tree.partIds.length;
    } else {
      count(tree, false);
      colorCount += tree.geometry.attributes.position.count;
    }
  }
  const nodes = atlas(2 * nodeCount, limit),
    primitives = atlas(triangleCount, limit),
    vertices = atlas(vertexCount, limit);
  const instances = atlas(2 * instanceCount, limit),
    tint = atlas(colorCount, limit, Uint8Array);
  let node = 0,
    primitive = 0,
    vertex = 0,
    placement = 0,
    color = 0;
  const colorRanges = [],
    layers = [];

  // Internal nodes point past their entire subtree. The shader can skip it on a
  // miss, descend on a hit, and reach each sibling without a fixed-depth stack.
  function writeTree(bvh) {
    const root = node,
      parents = [];
    bvh.traverse((depth, leaf, box, first, size) => {
      while (parents.length > depth) nodes.data[parents.pop() * 8 + 3] = node;
      const at = node++ * 8;
      nodes.data.set(box.subarray(0, 3), at);
      nodes.data.set(box.subarray(3, 6), at + 4);
      if (leaf) {
        nodes.data[at + 3] = primitive + first;
        nodes.data[at + 7] = size;
      } else parents.push(at / 8);
    });
    while (parents.length) nodes.data[parents.pop() * 8 + 3] = node;
    return root;
  }
  function writeMesh(bvh, perVertex) {
    const root = writeTree(bvh),
      geometry = bvh.geometry;
    const coords = geometry.attributes.position.array,
      order = geometry.index.array;
    for (let i = 0; i < order.length; i += 3) {
      const at = 4 * primitive++;
      primitives.data[at] = vertex + order[i];
      primitives.data[at + 1] = vertex + order[i + 1];
      primitives.data[at + 2] = vertex + order[i + 2];
    }
    for (let i = 0; i < coords.length; i += 3) {
      const at = vertex++ * 4;
      vertices.data[at] = coords[i];
      vertices.data[at + 1] = coords[i + 1];
      vertices.data[at + 2] = coords[i + 2];
      vertices.data[at + 3] = perVertex ? color++ : 0;
    }
    return root;
  }
  for (const [layer, tree] of trees.entries()) {
    if (!tree.placementsTree) {
      colorRanges.push({ layer, offset: color, part: null });
      layers.push({ root: writeMesh(tree, true), shared: false });
      continue;
    }
    const base = placement,
      starts = [];
    for (const [part, bvh] of tree.trees.entries()) {
      const root = writeMesh(bvh, false),
        transforms = tree.parts[part].placements;
      starts.push(placement);
      colorRanges.push({ layer, offset: color, part });
      for (let i = 0; i < transforms.length; i += 8) {
        const at = 8 * placement++;
        instances.data.set(transforms.subarray(i, i + 6), at);
        instances.data[at + 6] = root;
        instances.data[at + 7] = color++;
      }
    }
    layers.push({ root: writeTree(tree.placementsTree), shared: true });
    const order = tree.placementsTree.geometry.index.array;
    for (let i = 0; i < order.length; i += 3) {
      const id = order[i] / 3;
      primitives.data[4 * primitive++] = starts[tree.partIds[id]] + tree.offsets[id] / 8;
    }
    if (placement - base !== tree.partIds.length) throw new Error("Invalid placement index.");
  }
  return { nodes, primitives, vertices, instances, tint, colorRanges, layers };
}

export function packColors(packed, colors) {
  for (const { layer, part, offset } of packed.colorRanges) {
    const src = part === null ? colors[layer] : colors[layer][part];
    let dst = offset * 4;
    for (let i = 0; i < src.length; i += 3) {
      packed.tint.data[dst++] = src[i];
      packed.tint.data[dst++] = src[i + 1];
      packed.tint.data[dst++] = src[i + 2];
      dst++;
    }
  }
}
