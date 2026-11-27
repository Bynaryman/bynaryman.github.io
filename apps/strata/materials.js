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
export function makeLayers(layout, sample) {
  return layout.layers.map((data, i) => {
    const slot = sample ? data.layer - 1 : layout.layers.length === 1 ? 5 : Math.round((i * 7) / (layout.layers.length - 1));
    return {
      ...data,
      key: data.layer + "/" + data.datatype,
      slot,
      visible: true,
      name: sample ? sampleNames[slot] : "Layer " + data.layer + " / " + data.datatype,
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

export function randomMaterial() {
  const type = ["metal", "glass", "matte"][Math.floor(Math.random() * 3)];
  const glass = type === "glass";
  return {
    type,
    color: shade(Math.random(), between(0.22, 0.72), glass ? between(0.62, 0.83) : between(0.32, 0.68)),
    roughness: glass ? between(0.04, 0.27) : type === "metal" ? between(0.09, 0.45) : between(0.45, 0.91),
    metalness: type === "metal" ? between(0.68, 1) : 0,
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
