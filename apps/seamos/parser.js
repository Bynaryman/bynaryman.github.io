import { assignProcessingElements } from "./processing-elements.js";
import { WASI, File, Fd, PreopenDirectory, ConsoleStdout } from "./lib/wasi.js";

import { logicType } from "./logic-types.js";

const decoder = new TextDecoder();
const binaryURL = new URL("./lib/layout-reader.wasm", import.meta.url);
const maxFileBytes = 64 * 1024 * 1024;

/** Read a selected cell into polygon rings in micrometres. Run inside a worker. */
export async function readLayout(buffer, cellName, onCells) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length > maxFileBytes) throw new Error("Choose a layout file smaller than 64 MiB.");
  const oasis = decoder.decode(bytes.subarray(0, 13)) === "%SEMI-OASIS\r\n";
  const gds = bytes[0] === 0 && bytes[1] === 6 && bytes[2] === 0 && bytes[3] === 2;
  if (!oasis && !gds) throw new Error("The file header does not identify a GDSII or OASIS layout.");

  const directory = new PreopenDirectory(".", new Map([["layout", new File(bytes, { readonly: true })]]));
  const output = new ConsoleStdout(() => {});
  const wasi = new WASI([], [], [new Fd(), output, output, directory]);
  let groups = new Map();
  const templates = new Map();
  let api, branch, type;
  const cellIds = new Map(),
    kinds = [],
    logicAtDepth = [];
  function enterCell(address, depth) {
    const id = cellIds.get(address);
    if (depth <= 1) branch = id;
    type = kinds[id] || (depth ? logicAtDepth[depth - 1] : 0);
    logicAtDepth[depth] = type;
  }
  function placeCell(address, a, b, c, d, x, y) {
    const id = cellIds.get(address);
    if (!templates.has(id)) templates.set(id, { layers: new Map(), placements: [] });
    const template = templates.get(id);
    template.placements.push(a, b, c, d, x, y, branch, type);
    groups = template.layers;
  }
  function polygon(layerID, typeID, address, count) {
    const layer = layerID >>> 0;
    const datatype = typeID >>> 0;
    const key = layer + "/" + datatype;
    if (!groups.has(key)) groups.set(key, { layer, datatype, polygons: [], branches: [], logic: [] });
    const group = groups.get(key);
    group.branches.push(branch);
    group.logic.push(type);
    group.polygons.push(new Float64Array(api.memory.buffer, address, count * 2).slice());
  }
  function stringAt(address) {
    const heap = new Uint8Array(api.memory.buffer);
    const end = heap.indexOf(0, address);
    if (end < 0) throw new Error("Invalid cell name in layout.");
    return decoder.decode(heap.subarray(address, end));
  }
  function check(address) {
    if (address) throw new Error(stringAt(address));
  }

  const response = await fetch(binaryURL);
  if (!response.ok) throw new Error("The layout reader could not be loaded.");
  const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {
    wasi_snapshot_preview1: wasi.wasiImport,
    layout: { polygon, enter_cell: enterCell, place_cell: placeCell },
  });
  api = instance.exports;
  wasi.initialize(instance);
  try {
    check(api.open_layout(Number(oasis)));
    const roots = Array.from({ length: api.root_count() }, (_, index) => stringAt(api.root_name(index))).filter((n) => n !== "$$$CONTEXT_INFO$$$");
    const all = Array.from({ length: api.cell_count() }, (_, index) => {
      const address = api.cell_name(index),
        name = stringAt(address);
      cellIds.set(address, index);
      kinds.push(logicType(name));
      return name;
    });
    // KLayout may write a bookkeeping cell alongside the actual design.
    const top = new Set(roots);
    const cells = roots.concat(all.filter((name) => !top.has(name) && name !== "$$$CONTEXT_INFO$$$").sort());
    onCells?.(cells, roots);
    const name = cellName ?? cells[0];
    if (!cells.includes(name)) throw new Error("The selected cell is unavailable.");
    const index = all.indexOf(name);
    const checkPE = name === "tt_um_mmalpha" && all.some((n) => n.startsWith("sky130_fd_sc_hd__"));
    const error = checkPE ? 0 : api.read_cell(index);
    if (checkPE || (error && /expands beyond/.test(stringAt(error)))) {
      groups.clear();
      check(api.read_shared_cell(index));
      const peMapped = checkPE && (await assignProcessingElements(templates, all).catch(() => false));
      const parts = Array.from(templates.values(), (t) => ({
        pe: t.pe,
        layers: Array.from(t.layers.values()),
        placements: new Float64Array(t.placements),
      }));
      return { cells, roots, name, cellNames: all, peMapped, templates: parts };
    }
    check(error);
    return { cells, roots, name, cellNames: all, layers: Array.from(groups.values()) };
  } catch (error) {
    if (error instanceof WebAssembly.RuntimeError || error instanceof RangeError) {
      throw new Error("The reader could not decode this layout within its memory limit.");
    }
    throw error;
  }
}
