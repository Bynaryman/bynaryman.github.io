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
  const colors = layers.map(({ spans, positions }) => {
    const bytes = new Uint8Array(positions.length);
    let start = 0;
    for (let i = 0; i < spans.length; i += 3) {
      const end = spans[i] * 3;
      const id = spans[i + (mode === "logic" ? 2 : 1)];
      if (!palette.has(id)) {
        const name = cells[spans[i + 1]];
        const entry = mode === "logic" ? logic[id] : { label: name, color: name === selected ? "#89939a" : branchColor(name) };
        const linear = new Color(entry.color).toArray().map((v) => Math.round(255 * v));
        palette.set(id, { ...entry, linear });
      }
      const [r, g, b] = palette.get(id).linear;
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
