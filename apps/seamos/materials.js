import { metalSurface } from "./surface-effects.js";
import { Color, SRGBColorSpace } from "./lib/graphics.js";

const sampleNames = ["Substrate", "Active silicon", "Interconnect", "Metal 1", "Vias", "Metal 2", "Passivation", "Bond pads"];
export const presets = [
  { id: "foundry", name: "Copper Foundry", colors: ["#273532", "#356458", "#497c70", "#ac673e", "#ccb082", "#dd9364", "#4d887c", "#e4b77b"] },
  { id: "glacier", name: "Glacier Glass", colors: ["#1e494a", "#63c3bc", "#419893", "#8ddacf", "#addbd6", "#8ad9dc", "#73d4c3", "#d5f2f0"] },
  { id: "chrome", name: "Liquid Chrome", colors: ["#34393e", "#53646d", "#76818c", "#aeb5be", "#d8e1eb", "#d5d8de", "#7d90a0", "#e4dfd8"] },
  { id: "ultraviolet", name: "Ultraviolet", colors: ["#332740", "#624d83", "#8166a7", "#af80bd", "#dbb7c9", "#b586da", "#71529c", "#e2b6db"] },
  {
    id: "bryce",
    name: "Bryce",
    environment: "ocean",
    colors: ["#264855", "#3c8588", "#658897", "#70acac", "#c9bbc8", "#aab5c9", "#a1dfeb", "#f1cba2"],
  },
];
// SKY130 mask names and purposes used by the Tiny Tapeout standard-cell flow.
const skyMasks = new Map([
  ["64/20", "N-well"],
  ["94/20", "P+ implant"],
  ["93/44", "N+ implant"],
  ["78/44", "High-Vt implant"],
  ["65/20", "Diffusion"],
  ["65/44", "Tap"],
  ["66/20", "Poly"],
  ["95/20", "Nitride cut"],
  ["66/44", "Local contact"],
  ["67/20", "Local interconnect"],
  ["67/44", "Metal contact"],
  ["68/20", "Metal 1"],
  ["68/44", "Via 1"],
  ["69/20", "Metal 2"],
  ["69/44", "Via 2"],
  ["70/20", "Metal 3"],
  ["70/44", "Via 3"],
  ["71/20", "Metal 4"],
  ["71/44", "Via 4"],
  ["72/20", "Metal 5"],
]);
const skyAnnotations = new Map([
  ["235/4", "Placement boundary"],
  ["236/0", "Boundary"],
  ["81/4", "Standard-cell area"],
  ["81/23", "Diode area"],
  ["83/44", "Text"],
]);
export function makeLayers(layout, sample) {
  const sky = layout.cellNames.some((n) => n.startsWith("sky130_fd_sc_"));
  const keyOf = (l) => l.layer + "/" + l.datatype;
  const order = new Map([...skyMasks.keys()].map((key, i) => [key, i]));
  const sorted = sky ? [...layout.layers].sort((a, b) => (order.get(keyOf(a)) ?? 1000) - (order.get(keyOf(b)) ?? 1000)) : layout.layers;
  return sorted.map((data, i) => {
    const slot = sample ? data.layer - 1 : layout.layers.length === 1 ? 5 : Math.round((i * 7) / (layout.layers.length - 1));
    const key = keyOf(data);
    const annotation = sky && (skyAnnotations.has(key) || data.datatype === 5 || data.datatype === 16);
    const label = sky && (skyMasks.get(key) ?? skyAnnotations.get(key));
    return {
      ...data,
      key: data.layer + "/" + data.datatype,
      slot,
      visible: !annotation,
      name: sample ? sampleNames[slot] : label ? label + " · " + key : "Layer " + data.layer + " / " + data.datatype,
    };
  });
}
export function applyPreset(layers, preset) {
  for (const layer of layers) {
    const base = layer.slot === 0,
      glass = layer.slot === 6 || (preset.id === "glacier" && [0, 1, 3, 5].includes(layer.slot));
    layer.style = {
      type: glass ? "glass" : base ? "matte" : "metal",
      color: preset.colors[layer.slot],
      roughness: glass ? 0.12 : base ? 0.39 : ["chrome", "bryce"].includes(preset.id) ? 0.14 : 0.25,
      metalness: base ? 0.2 : 0.85,
      ior: 1.48,
    };
  }
}
function shade(hue, saturation, lightness) {
  return "#" + new Color().setHSL(hue, saturation, lightness, SRGBColorSpace).getHexString();
}
function between(min, max) {
  return Math.round((min + (max - min) * Math.random()) * 100) / 100;
}

export function randomBaseColor(style) {
  const { h } = new Color(style.color).getHSL({}, SRGBColorSpace);
  return shade(h + between(0.2, 0.8), between(0.35, 0.75), style.type === "glass" ? between(0.62, 0.8) : between(0.38, 0.65));
}

export function randomEffectColors(previous) {
  const { h } = new Color(previous).getHSL({}, SRGBColorSpace);
  const hue = h + between(0.18, 0.8);
  return [shade(hue, between(0.65, 0.92), between(0.58, 0.74)), shade(hue + between(0.23, 0.55), between(0.65, 0.92), between(0.51, 0.68))];
}
export function randomMaterial() {
  const types = ["metal", "glass", "matte", "iridescent"];
  const type = types[Math.floor(Math.random() * types.length)];
  const glass = type === "glass";
  return {
    type,
    color: shade(Math.random(), between(0.22, 0.72), glass ? between(0.62, 0.83) : between(0.32, 0.68)),
    roughness: glass ? between(0.04, 0.27) : metalSurface(type) ? between(0.09, 0.45) : between(0.45, 0.91),
    metalness: metalSurface(type) ? between(0.68, 1) : 0,
    ior: between(1.32, 1.84),
  };
}

// Give related layers a common hue, with a second hue on contacts and pads.
export function randomPalette(layers) {
  const hue = Math.random(),
    spread = between(0.07, 0.2),
    accent = between(0.3, 0.55);
  for (const layer of layers) {
    const t = layer.slot / 7,
      highlight = layer.slot === 4 || layer.slot === 7;
    const h = hue + (highlight ? accent : t * spread) + between(-0.025, 0.025);
    const light = layer.style.type === "glass" ? between(0.63, 0.8) : 0.2 + 0.4 * t + between(0, 0.12);
    layer.style.color = shade(h, between(0.26, 0.64), light);
  }
}

export function stackLayers(layers, spacing) {
  const compress = Math.min(1, 12 / layers.length);
  let y = 0;
  for (const [i, layer] of layers.entries()) {
    layer.y = y;
    layer.thickness = (layer.slot === 0 && i === 0 ? 0.42 : layer.slot === 1 ? 0.15 : 0.075) * compress;
    y += layer.thickness + (spacing / 100) * 0.54 * compress;
  }
  return y;
}
