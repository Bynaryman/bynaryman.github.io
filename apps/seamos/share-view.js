// Geometry is either fetched from its original URL or carried in the fragment.
export const layoutByteLimit = 64 * 1024 * 1024;
const linkLimit = 1900000;
const longLink = "This layout is too large to put in a link. Enter a hosted GDS or OASIS URL.";
const invalid = "This SeaMOS view link is invalid or incomplete.";

export function modelURL(value) {
  const u = new URL(value);
  if (!(u.protocol === "https:" || (u.protocol === "http:" && u.origin === location.origin)) || u.username || u.password)
    throw new Error("Enter a direct HTTPS URL for the layout.");
  return u.href;
}
async function boundedBlob(stream, limit, error) {
  const reader = stream.getReader(),
    chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error(error);
      }
      chunks.push(value);
    }
    return new Blob(chunks);
  } finally {
    reader.releaseLock();
  }
}
export async function remoteFile(source) {
  const url = modelURL(source);
  const r = await fetch(url, { credentials: "omit", referrerPolicy: "no-referrer" });
  if (!r.ok) throw new Error("Could not open the layout URL (HTTP " + r.status + ").");
  const error = "Choose a layout file of 64 MiB or less.";
  if (+r.headers.get("Content-Length") > layoutByteLimit) {
    await r.body.cancel();
    throw new Error(error);
  }
  const blob = await boundedBlob(r.body, layoutByteLimit, error);
  const file = new File([blob], new URL(url).pathname.split("/").pop() || "layout");
  file.modelURL = url;
  return file;
}
async function encode(blob, limit, error) {
  const gzip = typeof CompressionStream !== "undefined";
  if (gzip) blob = await boundedBlob(blob.stream().pipeThrough(new CompressionStream("gzip")), limit, error);
  if (blob.size > limit) throw new Error(error);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let str = "";
  for (let i = 0; i < bytes.length; i += 8192) str += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return (gzip ? "g" : "r") + btoa(str).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
async function decode(text, limit) {
  if (!text || text.length > linkLimit || !/^[gr][A-Za-z0-9_-]+$/.test(text)) throw new Error(invalid);
  const bin = atob(text.slice(1).replaceAll("-", "+").replaceAll("_", "/"));
  const blob = new Blob([Uint8Array.from(bin, (c) => c.charCodeAt(0))]);
  if (text[0] === "g") return boundedBlob(blob.stream().pipeThrough(new DecompressionStream("gzip")), limit, invalid);
  if (blob.size > limit) throw new Error(invalid);
  return blob;
}
export async function viewLink(base, state, file, source) {
  const url = new URL(base);
  url.search = "";
  url.hash = "";
  if (source) url.searchParams.set("model", modelURL(source));
  const params = new URLSearchParams();
  params.set("view", await encode(new Blob([JSON.stringify(state)]), 1024 * 1024, "View settings are too large to share."));
  if (!file.sample && !source) {
    params.set("file", await encode(file, Math.floor((linkLimit - params.toString().length - url.href.length - 128) * 0.75), longLink));
  }
  url.hash = params.toString();
  if (url.href.length > linkLimit) throw new Error(longLink);
  return url.href;
}
export async function readView(url) {
  if (url.hash.length > linkLimit) throw new Error(invalid);
  const params = new URLSearchParams(url.hash.slice(1));
  let state = null;
  if (params.has("view")) {
    state = JSON.parse(await (await decode(params.get("view"), 1024 * 1024)).text());
    if (state?.version !== 1 || !Array.isArray(state.layers) || typeof state.cell !== "string") throw new Error(invalid);
  }
  let file;
  if (params.has("file")) {
    if (!state || url.searchParams.has("model")) throw new Error(invalid);
    file = new File([await decode(params.get("file"), layoutByteLimit)], typeof state.filename === "string" ? state.filename : "layout");
  } else if (url.searchParams.has("model")) file = await remoteFile(url.searchParams.get("model"));
  return { state, file };
}
