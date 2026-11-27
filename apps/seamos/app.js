import { icon } from "./icons.js";
import { presets, makeLayers, applyPreset, randomMaterial, randomPalette, randomBaseColor } from "./materials.js";
import { defaultSky, defaultWater, randomSky, randomWater, sharedSky, sharedWater } from "./bryce.js";
import { layoutByteLimit, readView, remoteFile, viewLink } from "./share-view.js";
import { logicType } from "./logic-types.js";
import { colorLayout, shuffleColorOffset } from "./cell-colors.js";
import { Viewport } from "./viewport.js";

const $ = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 });
let layers = [],
  selected = 0,
  preset = presets[0],
  custom = false,
  currentFile,
  currentCell,
  cellNames = [];
let request = 0,
  reader,
  cancelImport,
  noticeTimer,
  catalogFile,
  catalog;
let peeled = [];
const vp = new Viewport($("scene"), $("traced"), (message, failed) => {
  ready(message);
  if (failed) {
    notice(message);
    showMode();
  }
});
let lastReportedBackend;
vp.onBackend = showBackend;
function showBackend() {
  const backend = vp.trace ? vp.traceBackend : vp.previewBackend;
  $("mode-hint").textContent = backend || "Choosing ray-tracing device…";
  if (backend && backend !== lastReportedBackend) {
    console.info("[SeaMOS] " + backend);
    lastReportedBackend = backend;
  }
}
function notice(message) {
  clearTimeout(noticeTimer);
  $("notice").textContent = message;
  $("notice").hidden = false;
  noticeTimer = setTimeout(() => {
    $("notice").hidden = true;
  }, 6500);
}
function ready(message) {
  $("ready").replaceChildren(document.createElement("b"), document.createTextNode(message));
}
function showMode() {
  for (const [id, on] of [
    ["preview-mode", !vp.trace],
    ["trace-mode", !!vp.trace],
  ]) {
    $(id).classList.toggle("selected", on);
    $(id).setAttribute("aria-pressed", String(on));
  }
  $("preview-mode").disabled = !vp.renderer;
  $("samples-field").hidden = !vp.trace;
  showBackend();
}
function showRange(id, text) {
  const input = $(id);
  input.style.setProperty("--fill", (100 * (Number(input.value) - Number(input.min))) / (Number(input.max) - Number(input.min) || 1) + "%");
  $(id + "-value").textContent = text;
}
function updateSceneInputs() {
  showRange("spacing", $("spacing").value + "%");
  showRange("exposure", Number($("exposure").value).toFixed(2) + "×");
}
function updateMaterials() {
  custom = true;
  vp.apply();
  syncMaterial();
  renderLayers();
  renderPresets();
}
function variedBryce() {
  return vp.environment === "ocean" && (vp.sky !== defaultSky || vp.water !== defaultWater);
}
function showEnvironment() {
  $("bryce-variations").hidden = vp.environment !== "ocean";
  $("sky-name").value = vp.sky.name;
  $("water-name").value = vp.water.name;
}
let presetRequest = 0,
  skyRequest = 0;
let studioView, studioSpacing;
async function selectPreset(p, active = () => true) {
  const ticket = ++presetRequest;
  ++skyRequest;
  let panorama;
  const ocean = p.environment === "ocean";
  if (ocean) {
    try {
      panorama = await vp.prepareOcean();
    } catch {
      if (ticket === presetRequest && active()) notice("Could not load the Bryce sky. Select Bryce to retry.");
      return;
    }
  }
  if (ticket !== presetRequest || !active()) return;
  const wasOcean = vp.environment === "ocean";
  if (ocean && !wasOcean) {
    studioSpacing = vp.spacing;
    vp.spacing = 42;
  } else if (!ocean && wasOcean) vp.spacing = studioSpacing ?? 8;
  $("spacing").value = vp.spacing;
  updateSceneInputs();
  preset = p;
  custom = false;
  applyPreset(layers, p);
  if (ocean) {
    vp.setSky(defaultSky, panorama);
    vp.setWater(defaultWater);
  }
  vp.setEnvironment(ocean ? "ocean" : "studio");
  showEnvironment();
  vp.apply();
  if (ocean && !wasOcean) {
    studioView = { name: $("view").value, fov: vp.camera.fov, position: vp.camera.position.clone(), target: vp.controls.target.clone() };
    $("view").value = "horizon";
    vp.setView("horizon");
  } else if (!ocean && wasOcean) {
    $("view").value = studioView?.name || "perspective";
    if (studioView) {
      vp.camera.fov = studioView.fov;
      vp.camera.updateProjectionMatrix();
      vp.camera.position.copy(studioView.position);
      vp.controls.target.copy(studioView.target);
      vp.controls.update();
    } else vp.setView($("view").value);
    studioView = null;
  }
  $("grid").disabled = ocean;
  $("grid").title = ocean ? "Grid is available on the studio floor" : "Toggle grid";
  $("grid").setAttribute("aria-pressed", String(!ocean && vp.grid.visible));
  syncMaterial();
  renderLayers();
  renderPresets();
}
function renderPresets() {
  $("presets").replaceChildren(
    ...presets.map((p) => {
      const btn = document.createElement("button");
      btn.className = "preset";
      btn.setAttribute("aria-pressed", String(p === preset && !custom && !variedBryce()));
      const image = document.createElement("img");
      image.src = "./assets/" + p.id + ".webp";
      image.alt = "";
      const caption = document.createElement("span");
      caption.className = "caption";
      caption.textContent = p.name;
      const mark = document.createElement("span");
      mark.className = "tick";
      mark.innerHTML = icon("check");
      caption.append(mark);
      btn.append(image, caption);
      btn.onclick = () => selectPreset(p);
      return btn;
    })
  );
}
function renderLayers() {
  const visible = layers.filter((layer) => layer.visible).length;
  const available = visible + peeled.length;
  $("layer-depth").max = available;
  $("layer-depth").value = visible;
  $("layer-depth").disabled = !available;
  showRange("layer-depth", visible + " / " + available);
  $("layer-list").replaceChildren(
    ...layers
      .map((layer, i) => {
        const row = document.createElement("div");
        row.className = "layer-line" + (layer.visible ? "" : " is-hidden") + (i === selected ? " chosen" : "");
        const btn = document.createElement("button");
        btn.className = "layer-edit";
        const swatch = document.createElement("span");
        swatch.className = "layer-dot";
        swatch.style.background = layer.style.color;
        btn.append(swatch, document.createTextNode(layer.name));
        if (currentFile?.sample) {
          const tag = document.createElement("small");
          tag.textContent = layer.key;
          btn.append(tag);
        }
        btn.title = "Edit " + layer.name;
        btn.onclick = () => {
          selected = i;
          syncMaterial();
          renderLayers();
          switchTab("material");
        };
        const eye = document.createElement("button");
        eye.className = "layer-eye";
        eye.innerHTML = icon(layer.visible ? "eye" : "off");
        eye.setAttribute("aria-label", "Show " + layer.name);
        eye.setAttribute("aria-pressed", String(layer.visible));
        eye.title = (layer.visible ? "Hide " : "Show ") + layer.name;
        eye.onclick = () => {
          peeled = peeled.filter((key) => key !== layer.key);
          layer.visible = !layer.visible;
          vp.applyVisibility();
          renderLayers();
        };
        row.append(btn, eye);
        return row;
      })
      .reverse()
  );
}
function syncMaterial() {
  if (!layers.length) return;
  const layer = layers[selected],
    s = layer.style;
  $("target").value = String(selected);
  $("target-swatch").style.background = s.color;
  $("surface").value = s.type;
  $("color").value = s.color;
  $("hex").textContent = s.color.toUpperCase();
  $("rough").value = s.roughness;
  showRange("rough", s.roughness.toFixed(2));
  const glass = s.type === "glass";
  $("property").parentElement.hidden = s.type === "matte";
  $("property-label").textContent = glass ? "Index of refraction" : "Metalness";
  $("property").min = glass ? "1" : "0";
  $("property").max = glass ? "2.5" : "1";
  $("property").value = glass ? s.ior : s.metalness;
  showRange("property", Number($("property").value).toFixed(2));
}
const tabs = ["material", "cells", "layers"];
function switchTab(active) {
  for (const name of tabs) {
    const on = name === active;
    $(name + "-tab").setAttribute("aria-selected", String(on));
    $(name + "-tab").tabIndex = on ? 0 : -1;
    $(name + "-panel").hidden = !on;
  }
}
const paletteOffsets = { hierarchy: null, logic: null };
function updateColorMode() {
  const mode = $("color-mode").value;
  const { colors, legend } = colorLayout(layers, mode, cellNames, currentCell, paletteOffsets[mode]);
  $("shuffle-cell-colors").disabled = !layers.length;
  vp.setColors(colors);
  const hint = $("color-hint");
  hint.hidden = mode === "layer";
  hint.textContent =
    mode === "logic"
      ? "Matches SKY130 HD and IHP SG13G2 standard cells. Other geometry is unclassified."
      : "Each direct child cell has a color shared by its descendants. Open a child to see the next level.";
  $("cell-legend").hidden = !legend.length;
  $("cell-legend").replaceChildren(
    ...legend.map(({ label, color }) => {
      const li = document.createElement("li"),
        swatch = document.createElement("span");
      swatch.className = "layer-dot";
      swatch.style.background = color;
      li.append(swatch, document.createTextNode(label));
      return li;
    })
  );
}
function showCells() {
  if (!catalog) return;
  const text = $("cell-search").value.trim().toLowerCase(),
    category = $("cell-category").value;
  const top = new Set(catalog.roots);
  const matches = catalog.cells.filter(
    (name) => name.toLowerCase().includes(text) && (category === "all" || (category === "top" ? top.has(name) : String(logicType(name)) === category))
  );
  const previous = $("cell").value;
  const list = document.createDocumentFragment();
  for (const name of matches) list.append(new Option(name, name));
  $("cell").replaceChildren(list);
  $("cell").value = matches.includes(previous) ? previous : matches.includes(currentCell) ? currentCell : matches[0] ?? "";
  $("cell-label").textContent = fmt.format(matches.length) + " matching " + (matches.length === 1 ? "cell" : "cells");
  $("inspect-cell").disabled = !matches.length;
  $("whole-chip").disabled = !catalog.roots.length;
}
function setCatalog(file, data) {
  if (catalogFile !== file) {
    $("cell-search").value = "";
    $("cell-category").value = "all";
  }
  catalogFile = file;
  catalog = data;
  showCells();
}
function install(mesh, file, cellChange) {
  layers = makeLayers(mesh, file.sample);
  peeled = [];
  applyPreset(layers, preset);
  custom = false;
  currentFile = file;
  currentCell = mesh.name;
  cellNames = mesh.cellNames;
  selected = file.sample
    ? Math.max(
        0,
        layers.findIndex((l) => l.slot === 5)
      )
    : Math.max(
        0,
        layers.findLastIndex((l) => l.visible)
      );
  $("target").replaceChildren(...layers.map((l, i) => new Option(l.name, String(i))));
  setCatalog(file, { cells: mesh.cells, roots: mesh.roots });
  if ([...$("cell").options].some((o) => o.value === currentCell)) $("cell").value = currentCell;
  $("scene-name").textContent = file.sample && mesh.name === "PRISM_CORE" ? "Prism core" : mesh.name;
  $("filename").textContent = file.name;
  $("file-type").textContent = mesh.format;
  $("layer-count").textContent = String(layers.length);
  $("stats").textContent = fmt.format(layers.length) + " layers · " + fmt.format(layers.reduce((sum, l) => sum + l.count, 0)) + " polygons";
  $("dimensions").textContent = fmt.format(mesh.width) + " × " + fmt.format(mesh.height) + " µm";
  if (!cellChange) switchTab("material");
  studioView = null;
  vp.setLayout(layers);
  showMode();
  updateColorMode();
  $("view").value = vp.environment === "ocean" ? "horizon" : "perspective";
  $("export").disabled = false;
  $("shuffle-palette").disabled = false;
  $("shuffle-finishes").disabled = false;
  $("stack-materials").disabled = false;
  $("share").disabled = false;
  $("shuffle-material").disabled = false;
  $("shuffle-base-color").disabled = false;
  syncMaterial();
  renderLayers();
  renderPresets();
  ready(vp.trace ? "Preparing ray trace" : "Ready");
}
function beginImport() {
  const id = ++request;
  cancelImport?.();
  reader?.terminate();
  reader = null;
  cancelImport = null;
  return id;
}
async function loadFile(file, cell, state) {
  const id = beginImport();
  ready("Opening layout");
  $("notice").hidden = true;
  let timeout;
  try {
    if (file.size > layoutByteLimit) throw new Error("Choose a layout file of 64 MiB or less.");
    const buffer = await file.arrayBuffer();
    if (id !== request) return;
    const worker = new Worker(new URL("./layout-worker.js", import.meta.url), { type: "module" });
    reader = worker;
    const result = await new Promise((resolve, reject) => {
      timeout = setTimeout(() => reject(new Error("This layout exceeded the import time limit. Try a smaller cell.")), 90000);
      cancelImport = () => reject(new Error("Import replaced."));
      worker.onmessage = ({ data }) => {
        if (data.type === "catalog") {
          if (id === request) setCatalog(file, data);
        } else if (data.error) reject(new Error(data.error));
        else resolve(data);
      };
      worker.onerror = () => reject(new Error("The layout reader could not complete this file."));
      worker.postMessage({ buffer, cell }, [buffer]);
    });
    if (id === request) {
      install(result, file, cell !== undefined);
      if (state) restoreScene(state);
    }
  } catch (error) {
    if (id === request) {
      notice(error.message);
      ready(layers.length ? "Ready · import failed" : "Import failed");
    }
  } finally {
    clearTimeout(timeout);
    if (id === request) {
      reader?.terminate();
      reader = null;
      cancelImport = null;
    }
  }
}
async function demo(cell, state) {
  const id = beginImport();
  try {
    const response = await fetch("./assets/prism_core.gds");
    if (!response.ok) throw new Error("Could not load the demo layout.");
    const blob = await response.blob();
    if (request === id) await loadFile({ name: "prism_core.gds", size: blob.size, sample: true, arrayBuffer: () => blob.arrayBuffer() }, cell, state);
  } catch (error) {
    if (request === id) {
      notice(error.message);
      ready("Demo unavailable");
    }
  }
}
$("open").onclick = () => $("file").click();
$("samples").onchange = () => {
  vp.samples = Number($("samples").value);
  vp.update();
};
$("file").onchange = (e) => {
  const file = e.target.files[0];
  if (file) loadFile(file);
  e.target.value = "";
};
$("demo").onclick = () => demo();
$("cell-search").oninput = showCells;
$("cell-category").onchange = showCells;
$("inspect-cell").onclick = () => {
  if (catalogFile && $("cell").value && (currentFile !== catalogFile || currentCell !== $("cell").value)) loadFile(catalogFile, $("cell").value);
};
$("cell").ondblclick = () => $("inspect-cell").click();
$("whole-chip").onclick = () => {
  if (!catalogFile) return;
  $("cell-search").value = "";
  $("cell-category").value = "all";
  showCells();
  $("cell").value = catalog.roots[0];
  $("inspect-cell").click();
};
$("color-mode").onchange = updateColorMode;
$("shuffle-cell-colors").onclick = () => {
  const mode = $("color-mode").value;
  if (mode === "layer") return $("shuffle-palette").click();
  paletteOffsets[mode] = shuffleColorOffset(paletteOffsets[mode] ?? 0);
  updateColorMode();
};
$("trace-device").onchange = () => {
  vp.traceDevice = $("trace-device").value;
  vp.traceBackend = null;
  showMode();
  vp.update();
};
$("target").onchange = () => {
  selected = Number($("target").value);
  syncMaterial();
  renderLayers();
};
for (const [i, name] of tabs.entries()) {
  $(name + "-tab").onclick = () => switchTab(name);
  $(name + "-tab").onkeydown = (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const next =
      e.key === "Home" ? tabs[0] : e.key === "End" ? tabs.at(-1) : tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    switchTab(next);
    $(next + "-tab").focus();
  };
}
$("shuffle-base-color").onclick = () => {
  const style = layers[selected].style;
  style.color = randomBaseColor(style);
  updateMaterials();
};
$("shuffle-material").onclick = () => {
  if (!layers.length) return;
  layers[selected].style = randomMaterial();
  updateMaterials();
};
$("shuffle-palette").onclick = () => {
  randomPalette(layers);
  updateMaterials();
};
$("stack-materials").onclick = $("shuffle-finishes").onclick = () => {
  for (const layer of layers) layer.style = randomMaterial();
  updateMaterials();
};
function setLayerDepth(depth) {
  const visible = layers.filter((layer) => layer.visible);
  depth = Math.max(0, Math.min(visible.length + peeled.length, depth));
  if (depth === visible.length) return;
  if (depth < visible.length) {
    for (const layer of visible.slice(depth).reverse()) {
      layer.visible = false;
      peeled.push(layer.key);
    }
  } else {
    const restore = new Set(peeled.splice(peeled.length - (depth - visible.length)));
    for (const layer of layers) if (restore.has(layer.key)) layer.visible = true;
  }
  vp.applyVisibility();
  renderLayers();
}
$("layer-depth").oninput = () => setLayerDepth(Number($("layer-depth").value));
let wheelDelta = 0,
  lastWheel = 0;
function peelWheel(e) {
  if ((!e.ctrlKey && !e.currentTarget.contains($("layer-depth"))) || !layers.length || !e.deltaY) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.timeStamp - lastWheel > 200 || Math.sign(wheelDelta) !== Math.sign(e.deltaY)) wheelDelta = 0;
  lastWheel = e.timeStamp;
  wheelDelta += e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
  if (Math.abs(wheelDelta) < 12) return;
  setLayerDepth(Number($("layer-depth").value) - Math.sign(wheelDelta));
  wheelDelta = 0;
}
for (const id of ["layer-wheel", "viewport"]) $(id).addEventListener("wheel", peelWheel, { passive: false, capture: true });
$("shuffle-sky").onclick = async () => {
  const ticket = ++skyRequest,
    next = randomSky(vp.sky);
  try {
    const panorama = await vp.prepareOcean(next);
    if (ticket !== skyRequest || vp.environment !== "ocean") return;
    vp.setSky(next, panorama);
    showEnvironment();
    renderPresets();
  } catch {
    if (ticket === skyRequest) notice("Could not load this sky. Shuffle again to retry.");
  }
};
$("shuffle-water").onclick = () => {
  vp.setWater(randomWater(vp.water));
  showEnvironment();
  renderPresets();
};
for (const id of ["surface", "color", "rough", "property"])
  $(id).oninput = () => {
    if (!layers.length) return;
    const s = layers[selected].style;
    if (id === "surface") s.type = $(id).value;
    if (id === "color") s.color = $(id).value;
    if (id === "rough") s.roughness = Number($(id).value);
    if (id === "property") s[s.type === "glass" ? "ior" : "metalness"] = Number($(id).value);
    updateMaterials();
  };
$("spacing").oninput = () => {
  vp.spacing = Number($("spacing").value);
  updateSceneInputs();
  vp.apply();
};
function updateDisplay() {
  vp.setDisplay(Number($("exposure").value), $("denoise").value === "bilateral", $("effect").value);
  updateSceneInputs();
}
$("exposure").oninput = updateDisplay;
$("denoise").onchange = updateDisplay;
$("effect").onchange = updateDisplay;
for (const id of ["preview-mode", "trace-mode"])
  $(id).onclick = () => {
    if (vp.trace === (id === "trace-mode")) return;
    vp.trace = id === "trace-mode";
    vp.traceBackend = null;
    showMode();
    vp.update();
    ready(vp.trace ? "Preparing ray trace" : "Ready");
  };
function tool(pan) {
  vp.setTool(pan);
  for (const [id, on] of [
    ["pan", pan],
    ["orbit", !pan],
  ]) {
    $(id).setAttribute("aria-pressed", String(on));
    $(id).classList.toggle("active", on);
  }
  document.querySelector(".view-hint").textContent = "Drag to " + (pan ? "pan" : "orbit") + " · Scroll to zoom";
}
$("orbit").onclick = () => tool(false);
$("pan").onclick = () => tool(true);
$("fit").onclick = () => vp.setView($("view").value);
$("view").onchange = () => vp.setView($("view").value);
$("minus").onclick = () => vp.zoom(1.2);
$("plus").onclick = () => vp.zoom(1 / 1.2);
$("grid").onclick = () => {
  vp.grid.visible = !vp.grid.visible;
  $("grid").setAttribute("aria-pressed", String(vp.grid.visible));
  vp.update();
};
$("scene").onkeydown = (e) => {
  const actions = {
    f: () => $("fit").click(),
    "+": () => $("plus").click(),
    "=": () => $("plus").click(),
    "-": () => $("minus").click(),
    ArrowLeft: () => vp.nudge(-1, 0),
    ArrowRight: () => vp.nudge(1, 0),
    ArrowUp: () => vp.nudge(0, -1),
    ArrowDown: () => vp.nudge(0, 1),
  };
  if (actions[e.key]) {
    e.preventDefault();
    actions[e.key]();
  }
};
$("export").onclick = () => {
  try {
    const canvas = vp.exportCanvas();
    canvas.toBlob((blob) => {
      if (!blob) return notice("Could not export this frame.");
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download =
        (currentFile?.name.replace(/\.[^.]+$/, "") || "layout") + "-" + (custom ? "custom" : variedBryce() ? "bryce-variant" : preset.id) + ".png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    }, "image/png");
  } catch (error) {
    notice(error.message);
  }
};
let dragDepth = 0;
window.addEventListener("dragenter", (e) => {
  if (e.dataTransfer.types.includes("Files")) {
    e.preventDefault();
    dragDepth++;
    $("drop-overlay").hidden = false;
  }
});
window.addEventListener("dragover", (e) => {
  if (e.dataTransfer.types.includes("Files")) e.preventDefault();
});
window.addEventListener("dragleave", () => {
  if (--dragDepth <= 0) {
    dragDepth = 0;
    $("drop-overlay").hidden = true;
  }
});
window.addEventListener("drop", (e) => {
  e.preventDefault();
  dragDepth = 0;
  $("drop-overlay").hidden = true;
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});
function sceneState() {
  return {
    version: 1,
    filename: currentFile.name,
    cell: currentCell,
    preset: preset.id,
    custom,
    layers: layers.map((l) => [l.key, l.visible, l.style.type, l.style.color, l.style.roughness, l.style.metalness, l.style.ior]),
    peeled: [...peeled],
    selected: layers[selected]?.key,
    colorMode: $("color-mode").value,
    palette: { ...paletteOffsets },
    spacing: vp.spacing,
    exposure: vp.exposure,
    effect: vp.effect,
    grid: vp.grid.visible,
    trace: !!vp.trace,
    samples: vp.samples,
    denoise: vp.denoise,
    view: $("view").value,
    fov: vp.camera.fov,
    position: vp.camera.position.toArray(),
    target: vp.controls.target.toArray(),
    aspect: vp.camera.aspect,
    sky: vp.environment === "ocean" ? [vp.sky.name, vp.sky.turn] : undefined,
    water: vp.environment === "ocean" && vp.water !== defaultWater ? vp.water : undefined,
  };
}
const inRange = (v, min, max) => Number.isFinite(v) && v >= min && v <= max;
function restoreScene(s) {
  const saved = new Map(s.layers.filter((row) => Array.isArray(row) && row.length === 7).map((row) => [row[0], row]));
  for (const l of layers) {
    const row = saved.get(l.key);
    if (!row) continue;
    const [, visible, type, color, roughness, metalness, ior] = row;
    if (typeof visible === "boolean") l.visible = visible;
    if (
      ["glass", "metal", "matte"].includes(type) &&
      typeof color === "string" &&
      /^#[0-9a-f]{6}$/i.test(color) &&
      inRange(roughness, 0, 1) &&
      inRange(metalness, 0, 1) &&
      inRange(ior, 1, 2.5)
    )
      l.style = { type, color, roughness, metalness, ior };
  }
  const hidden = new Set(layers.filter((l) => !l.visible).map((l) => l.key));
  peeled = Array.isArray(s.peeled) ? [...new Set(s.peeled.filter((k) => hidden.has(k)))] : [];
  const index = layers.findIndex((l) => l.key === s.selected);
  if (index >= 0) selected = index;
  custom = s.custom === true;
  if (inRange(s.spacing, 0, 100)) $("spacing").value = vp.spacing = s.spacing;
  if (inRange(s.exposure, 0.35, 2)) $("exposure").value = s.exposure;
  if (["ink", "blueprint", "off"].includes(s.effect)) $("effect").value = s.effect;
  $("denoise").value = s.denoise === true ? "bilateral" : "off";
  if ([4, 16, 64].includes(s.samples)) $("samples").value = vp.samples = s.samples;
  if (typeof s.grid === "boolean") vp.grid.visible = s.grid;
  $("grid").setAttribute("aria-pressed", String(vp.environment !== "ocean" && vp.grid.visible));
  for (const key of Object.keys(paletteOffsets)) paletteOffsets[key] = inRange(s.palette?.[key], 0, 1) ? s.palette[key] : null;
  if (["layer", "logic", "hierarchy"].includes(s.colorMode)) $("color-mode").value = s.colorMode;
  updateColorMode();
  if (["perspective", "horizon", "top", "front"].includes(s.view)) $("view").value = s.view;
  vp.setView($("view").value);
  if (inRange(s.fov, 1, 120)) {
    vp.camera.fov = s.fov;
    vp.camera.updateProjectionMatrix();
  }
  if ([s.position, s.target].every((v) => Array.isArray(v) && v.length === 3 && v.every((n) => inRange(n, -1e5, 1e5)))) {
    vp.controls.target.fromArray(s.target);
    vp.camera.position.fromArray(s.position);
    if (inRange(s.aspect, 0.01, 100) && s.aspect !== vp.camera.aspect) {
      vp.camera.position
        .sub(vp.controls.target)
        .multiplyScalar(vp.fitDistance(vp.camera.aspect) / vp.fitDistance(s.aspect))
        .add(vp.controls.target);
    }
    vp.controls.update();
  }
  vp.trace = s.trace === true || !vp.renderer;
  vp.traceBackend = null;
  updateDisplay();
  vp.update();
  showMode();
  syncMaterial();
  renderLayers();
  renderPresets();
  ready(vp.trace ? "Preparing ray trace" : "Ready");
}

let shareRequest = 0;
async function prepareShare() {
  const ticket = ++shareRequest,
    file = currentFile,
    state = sceneState();
  const address = $("hosted-url").value.trim();
  $("copy-view").disabled = true;
  $("view-url").value = "";
  $("share-status").textContent = "Preparing link…";
  try {
    if (address && address !== file.modelURL && address !== file.hostedCopy) {
      const remote = await remoteFile(address);
      if (remote.size !== file.size) throw new Error("The hosted file differs from the open layout.");
      const a = new Uint8Array(await remote.arrayBuffer()),
        b = new Uint8Array(await file.arrayBuffer());
      if (!a.every((v, i) => v === b[i])) throw new Error("The hosted file differs from the open layout.");
    }
    const url = await viewLink(location.href, state, file, address);
    if (ticket !== shareRequest) return;
    if (!file.sample && !file.modelURL) file.hostedCopy = address;
    $("view-url").value = url;
    $("copy-view").disabled = false;
    $("share-status").textContent =
      !file.sample && !address
        ? "Includes the layout bytes. Anyone with this link can open the chip." + (url.length > 8000 ? " A hosted URL makes a shorter link." : "")
        : "Includes the camera, materials, visibility and scene settings.";
  } catch (error) {
    if (ticket === shareRequest)
      $("share-status").textContent =
        error instanceof TypeError ? "Could not read that URL. Use a direct layout URL that allows browser access." : error.message;
  }
}
$("share").onclick = () => {
  const local = !currentFile.sample && !currentFile.modelURL;
  $("hosted-source").hidden = !local;
  $("hosted-url").value = currentFile.modelURL || currentFile.hostedCopy || "";
  $("share-source").textContent = local
    ? "Share a copy of " + currentFile.name + " in the link, or use a hosted copy of the same file."
    : currentFile.name;
  $("share-dialog").showModal();
  prepareShare();
};
$("use-url").onclick = prepareShare;
$("hosted-url").onkeydown = (e) => {
  if (e.key === "Enter") prepareShare();
};
$("hosted-url").oninput = () => {
  shareRequest++;
  $("view-url").value = "";
  $("copy-view").disabled = true;
  $("share-status").textContent = "Choose Use URL to update the link.";
};
$("share-dialog").onclose = () => {
  shareRequest++;
};
$("copy-view").onclick = async () => {
  const input = $("view-url");
  try {
    await navigator.clipboard.writeText(input.value);
    $("share-status").textContent = "Link copied.";
  } catch {
    input.focus();
    input.select();
    $("share-status").textContent = "Link selected. Use your browser’s Copy command.";
  }
};
async function openInitial() {
  const id = beginImport(),
    url = new URL(location.href);
  try {
    const { state, file } = await readView(url);
    if (request !== id) return;
    const p = presets.find((p) => p.id === (state?.preset || url.searchParams.get("preset")));
    if (p) await selectPreset(p, () => request === id);
    if (request !== id) return;
    const effect = url.searchParams.get("effect");
    if (!state && ["ink", "blueprint", "off"].includes(effect)) {
      $("effect").value = effect;
      updateDisplay();
    }
    if (p?.environment === "ocean" && state) {
      const sky = sharedSky(...(Array.isArray(state.sky) ? state.sky.slice(0, 2) : []));
      if (sky.name !== defaultSky.name || sky.turn !== 0) {
        const panorama = await vp.prepareOcean(sky);
        if (request !== id) return;
        vp.setSky(sky, panorama);
      }
      vp.setWater(sharedWater(state.water));
      showEnvironment();
      renderPresets();
    }
    if (file) await loadFile(file, state?.cell, state);
    else await demo(state?.cell, state);
  } catch (error) {
    if (id === request) {
      notice("Could not open shared view. " + (error instanceof TypeError ? "Check that the layout URL allows browser access." : error.message));
      ready("Shared view unavailable");
    }
  }
}
updateSceneInputs();
switchTab("material");
showMode();
renderPresets();
window.addEventListener("hashchange", openInitial);
openInitial();
