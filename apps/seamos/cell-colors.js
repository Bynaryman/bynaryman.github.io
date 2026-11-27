import { Color, SRGBColorSpace } from "./lib/graphics.js";

const logic = [
  { label: "Unclassified", color: "#89939a" },
  { label: "Sequential", color: "#df7051" },
  { label: "Combinational", color: "#499fd2" },
];

function branchColor(name) {
  // Stable across imports and when opening the same block in isolation.
  let hash = 2166136261;
  for (let i = 0; i < name.length; ++i) hash = Math.imul(hash ^ name.charCodeAt(i), 16777619);
  const hue = ((hash >>> 0) * 0.61803398875) % 1;
  return "#" + new Color().setHSL(hue, 0.64, 0.58, SRGBColorSpace).getHexString();
}

export function colorLayout(layers, mode, cells, selected) {
  if (mode === "layer") return { colors: [], legend: [] };
  const palette = new Map();
  function tint(branch, type) {
    const id = mode === "logic" ? type : branch;
    if (!palette.has(id)) {
      const name = cells[branch];
      const entry = mode === "logic" ? logic[id] : { label: name, color: name === selected ? "#89939a" : branchColor(name) };
      palette.set(id, { ...entry, linear: new Color(entry.color).toArray().map((v) => Math.round(255 * v)) });
    }
    return palette.get(id).linear;
  }
  const colors = layers.map(({ spans, positions, parts }) => {
    if (parts)
      return parts.map(({ placements }) => {
        const bytes = new Uint8Array((placements.length / 8) * 3);
        for (let i = 0; i < placements.length; i += 8) bytes.set(tint(placements[i + 6], placements[i + 7]), (i / 8) * 3);
        return bytes;
      });
    const bytes = new Uint8Array(positions.length);
    let start = 0;
    for (let i = 0; i < spans.length; i += 3) {
      const end = spans[i] * 3;
      const [r, g, b] = tint(spans[i + 1], spans[i + 2]);
      while (start < end) {
        bytes[start++] = r;
        bytes[start++] = g;
        bytes[start++] = b;
      }
    }
    return bytes;
  });
  return { colors, legend: [...palette.values()].sort((a, b) => a.label.localeCompare(b.label)) };
}
