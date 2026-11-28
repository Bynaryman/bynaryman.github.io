import { Color, SRGBColorSpace } from "./lib/graphics.js";

const logic = [
  { label: "Unclassified", color: "#89939a" },
  { label: "Sequential", color: "#df7051" },
  { label: "Combinational", color: "#499fd2" },
];

const elements = [
  { label: "Shared, routing & other", color: "#667078" },
  { label: "PE (1,1) · C11", color: "#57aeff" },
  { label: "PE (1,2) · C21", color: "#33c99a" },
  { label: "PE (2,1) · C12", color: "#ffb74a" },
  { label: "PE (2,2) · C22", color: "#cc86ed" },
];
export function shuffleColorOffset(previous = 0) {
  return (previous + 0.23 + Math.random() * 0.54) % 1;
}
function hueColor(hue, saturation, lightness) {
  return "#" + new Color().setHSL(hue % 1, saturation, lightness, SRGBColorSpace).getHexString();
}
function branchColor(name, shift) {
  // Stable across imports and when opening the same block in isolation.
  let hash = 2166136261;
  for (let i = 0; i < name.length; ++i) hash = Math.imul(hash ^ name.charCodeAt(i), 16777619);
  const hue = ((hash >>> 0) * 0.61803398875) % 1;
  return hueColor(hue + shift, 0.64, 0.58);
}

export function colorLayout(layers, mode, cells, selected, shift = null) {
  if (mode === "layer") return { colors: [], legend: [] };
  const palette = new Map();
  function tint(branch, type, pe = 0) {
    const id = mode === "pe" ? pe : mode === "logic" ? type : branch;
    if (!palette.has(id)) {
      const name = cells[branch];
      let entry;
      if (mode === "pe")
        entry = shift === null || !id ? elements[id] : { label: elements[id].label, color: hueColor(shift + (id - 1) / 4, 0.72, 0.6) };
      else if (mode === "logic") {
        entry = shift === null ? logic[id] : { label: logic[id].label, color: hueColor(shift + id / 3, id ? 0.72 : 0.32, id === 2 ? 0.62 : 0.51) };
      } else {
        entry = { label: name, color: name === selected && shift === null ? "#89939a" : branchColor(name, shift ?? 0) };
      }
      palette.set(id, { ...entry, linear: new Color(entry.color).toArray().map((v) => Math.round(255 * v)) });
    }
    return palette.get(id).linear;
  }
  const colors = layers.map(({ spans, positions, parts }) => {
    if (parts)
      return parts.map(({ placements, pe }) => {
        const bytes = new Uint8Array((placements.length / 8) * 3);
        for (let i = 0; i < placements.length; i += 8) bytes.set(tint(placements[i + 6], placements[i + 7], pe?.[i / 8]), (i / 8) * 3);
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
