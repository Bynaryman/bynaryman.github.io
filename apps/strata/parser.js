import { WASI, File, Fd, PreopenDirectory, ConsoleStdout } from "./lib/wasi.js";

const decoder = new TextDecoder();
const binaryURL = new URL("./lib/layout-reader.wasm", import.meta.url);
const maxFileBytes = 64 * 1024 * 1024;

/** Read one top-level cell into polygon rings in micrometres. Run inside a worker. */
export async function readLayout(buffer, cellName, onCells) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length > maxFileBytes) throw new Error("Choose a layout file smaller than 64 MiB.");
  const oasis = decoder.decode(bytes.subarray(0, 13)) === "%SEMI-OASIS\r\n";
  const gds = bytes[0] === 0 && bytes[1] === 6 && bytes[2] === 0 && bytes[3] === 2;
  if (!oasis && !gds) throw new Error("The file header does not identify a GDSII or OASIS layout.");

  const directory = new PreopenDirectory(".", new Map([["layout", new File(bytes, { readonly: true })]]));
  const output = new ConsoleStdout(() => {});
  const wasi = new WASI([], [], [new Fd(), output, output, directory]);
  const groups = new Map();
  let api;
  function polygon(layerID, typeID, address, count) {
    const layer = layerID >>> 0;
    const datatype = typeID >>> 0;
    const key = layer + "/" + datatype;
    if (!groups.has(key)) groups.set(key, { layer, datatype, polygons: [] });
    groups.get(key).polygons.push(new Float64Array(api.memory.buffer, address, count * 2).slice());
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
    layout: { polygon },
  });
  api = instance.exports;
  wasi.initialize(instance);
  try {
    check(api.open_layout(Number(oasis)));
    const all = Array.from({ length: api.root_count() }, (_, index) => stringAt(api.root_name(index)));
    // KLayout may write a bookkeeping cell alongside the actual design.
    const cells = all.filter((name) => name !== "$$$CONTEXT_INFO$$$");
    onCells?.(cells);
    const name = cellName ?? cells[0];
    if (!cells.includes(name)) throw new Error("The selected top-level cell is unavailable.");
    check(api.read_cell(all.indexOf(name)));
    return { cells, name, layers: Array.from(groups.values()) };
  } catch (error) {
    if (error instanceof WebAssembly.RuntimeError || error instanceof RangeError) {
      throw new Error("The reader could not decode this layout within its memory limit.");
    }
    throw error;
  }
}
