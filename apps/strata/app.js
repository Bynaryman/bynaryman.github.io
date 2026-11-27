import { icon } from "./icons.js";
import { presets, makeLayers, applyPreset, randomMaterial, randomPalette } from "./materials.js";
import { defaultSky, defaultWater, randomSky, randomWater } from "./bryce.js";
import { Viewport } from "./viewport.js";

const $ = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 });
let layers = [],
  selected = 0,
  preset = presets[0],
  custom = false,
  currentFile;
let request = 0,
  reader,
  cancelImport,
  noticeTimer,
  retryFile;
const vp = new Viewport($("scene"), $("traced"), (message, failed) => {
  ready(message);
  if (failed) {
    notice(message);
    showMode();
  }
});
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
  $("mode-hint").textContent = vp.trace ? "Progressive reflections, refraction and soft shadows." : "Real-time material preview.";
}
function showRange(id, text) {
  const input = $(id);
  input.style.setProperty("--fill", (100 * (Number(input.value) - Number(input.min))) / (Number(input.max) - Number(input.min)) + "%");
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
async function selectPreset(p) {
  const ticket = ++presetRequest;
  ++skyRequest;
  let panorama;
  const ocean = p.environment === "ocean";
  if (ocean) {
    try {
      panorama = await vp.prepareOcean();
    } catch {
      if (ticket === presetRequest) notice("Could not load the Bryce sky. Select Bryce to retry.");
      return;
    }
  }
  if (ticket !== presetRequest) return;
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
          switchTab(true);
        };
        const eye = document.createElement("button");
        eye.className = "layer-eye";
        eye.innerHTML = icon(layer.visible ? "eye" : "off");
        eye.setAttribute("aria-label", "Show " + layer.name);
        eye.setAttribute("aria-pressed", String(layer.visible));
        eye.title = (layer.visible ? "Hide " : "Show ") + layer.name;
        eye.onclick = () => {
          layer.visible = !layer.visible;
          vp.apply();
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
function switchTab(material) {
  for (const [name, on] of [
    ["material", material],
    ["layers", !material],
  ]) {
    $(name + "-tab").setAttribute("aria-selected", String(on));
    $(name + "-tab").tabIndex = on ? 0 : -1;
    $(name + "-panel").hidden = !on;
  }
}
function install(mesh, file, cellChange) {
  layers = makeLayers(mesh, file.sample);
  applyPreset(layers, preset);
  custom = false;
  currentFile = file;
  selected = file.sample
    ? Math.max(
        0,
        layers.findIndex((l) => l.slot === 5)
      )
    : layers.length - 1;
  $("target").replaceChildren(...layers.map((l, i) => new Option(l.name, String(i))));
  $("cell").replaceChildren(...mesh.cells.map((n) => new Option(n, n)));
  $("cell").value = mesh.name;
  $("cell-field").hidden = mesh.cells.length < 2;
  $("scene-name").textContent = file.sample ? "Prism core" : mesh.name;
  $("filename").textContent = file.name;
  $("file-type").textContent = mesh.format;
  $("layer-count").textContent = String(layers.length);
  $("stats").textContent = fmt.format(layers.length) + " layers · " + fmt.format(layers.reduce((sum, l) => sum + l.count, 0)) + " polygons";
  $("dimensions").textContent = fmt.format(mesh.width) + " × " + fmt.format(mesh.height) + " µm";
  if (!cellChange) switchTab(true);
  studioView = null;
  vp.setLayout(layers);
  $("view").value = vp.environment === "ocean" ? "horizon" : "perspective";
  $("export").disabled = false;
  $("shuffle-palette").disabled = false;
  $("shuffle-material").disabled = false;
  syncMaterial();
  renderLayers();
  renderPresets();
  ready(vp.trace ? "Preparing ray trace" : "Ready");
}
async function loadFile(file, cell) {
  const id = ++request;
  cancelImport?.();
  reader?.terminate();
  reader = null;
  ready("Opening layout");
  $("notice").hidden = true;
  let timeout;
  try {
    if (file.size > 64 * 1024 * 1024) throw new Error("Choose a layout file of 64 MiB or less.");
    const buffer = await file.arrayBuffer();
    if (id !== request) return;
    const worker = new Worker(new URL("./layout-worker.js", import.meta.url), { type: "module" });
    reader = worker;
    const result = await new Promise((resolve, reject) => {
      timeout = setTimeout(() => reject(new Error("This layout exceeded the import time limit. Try a smaller cell export.")), 90000);
      cancelImport = () => reject(new Error("Import replaced."));
      worker.onmessage = ({ data }) => (data.error ? reject(Object.assign(new Error(data.error), { cells: data.cells })) : resolve(data));
      worker.onerror = () => reject(new Error("The layout reader could not complete this file."));
      worker.postMessage({ buffer, cell }, [buffer]);
    });
    if (id === request) install(result, file, cell !== undefined);
  } catch (error) {
    if (id === request) {
      if (error.cells?.length > 1) {
        retryFile = file;
        $("choose-reason").textContent = error.message;
        $("choose-cell").replaceChildren(...error.cells.map((n) => new Option(n, n)));
        $("choose-cell").selectedIndex = Math.max(
          0,
          error.cells.findIndex((n) => n !== (cell ?? error.cells[0]))
        );
        $("cell-dialog").returnValue = "cancel";
        $("cell-dialog").showModal();
      } else notice(error.message);
      ready(layers.length ? "Ready · import failed" : "Import failed");
      if (currentFile) $("cell").value = currentFile.sample ? "PRISM_CORE" : $("scene-name").textContent;
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
async function demo() {
  const id = request;
  try {
    const response = await fetch("./assets/prism_core.gds");
    if (!response.ok) throw new Error("Could not load the demo layout.");
    const blob = await response.blob();
    if (request === id) await loadFile({ name: "prism_core.gds", size: blob.size, sample: true, arrayBuffer: () => blob.arrayBuffer() });
  } catch (error) {
    if (request === id) {
      notice(error.message);
      ready("Demo unavailable");
    }
  }
}
$("open").onclick = () => $("file").click();
$("cell-dialog").onclose = () => {
  if ($("cell-dialog").returnValue === "open" && retryFile) loadFile(retryFile, $("choose-cell").value);
  retryFile = null;
};
$("samples").onchange = () => {
  vp.samples = Number($("samples").value);
  vp.update();
};
$("file").onchange = (e) => {
  const file = e.target.files[0];
  if (file) loadFile(file);
  e.target.value = "";
};
$("demo").onclick = demo;
$("cell").onchange = () => {
  if (currentFile) loadFile(currentFile, $("cell").value);
};
$("target").onchange = () => {
  selected = Number($("target").value);
  syncMaterial();
  renderLayers();
};
for (const name of ["material", "layers"]) {
  $(name + "-tab").onclick = () => switchTab(name === "material");
  $(name + "-tab").onkeydown = (e) => {
    if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      switchTab(name === "layers");
      $(name === "layers" ? "material-tab" : "layers-tab").focus();
    }
  };
}
$("shuffle-material").onclick = () => {
  if (!layers.length) return;
  layers[selected].style = randomMaterial();
  updateMaterials();
};
$("shuffle-palette").onclick = () => {
  randomPalette(layers);
  updateMaterials();
};
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
for (const id of ["spacing", "exposure"])
  $(id).oninput = () => {
    vp[id] = Number($(id).value);
    updateSceneInputs();
    vp.apply();
  };
for (const id of ["preview-mode", "trace-mode"])
  $(id).onclick = () => {
    vp.trace = id === "trace-mode";
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
updateSceneInputs();
switchTab(true);
showMode();
renderPresets();
const initialPreset = presets.find((p) => p.id === new URLSearchParams(location.search).get("preset"));
if (initialPreset) selectPreset(initialPreset);
demo();
