import { silicaIOR } from "./cutaway.js";
import { coated, metalSurface, defaultFinish } from "./surface-effects.js";
import { Color } from "./lib/intersections.js";
import { atlas, packTrees, packColors } from "./gpu-geometry.js";
import { waterLevel } from "./bryce.js";
import { webglAdapter } from "./webgl-adapter.js";

const vertexShader = `#version 300 es
void main() {
  vec2 xy=vec2((gl_VertexID<<1)&2,gl_VertexID&2);
  gl_Position=vec4(xy*2.0-1.0,0,1);
}`;
const sleep = () => new Promise((resolve) => setTimeout(resolve, 0));
const samplers = ["nodes", "primitives", "vertices", "instances", "tints", "materials", "panorama", "previous"];

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

export class GpuTracer {
  static async create(trees) {
    if (typeof OffscreenCanvas === "undefined") throw new Error("WebGL2 workers unavailable");
    const gl = new OffscreenCanvas(1, 1).getContext("webgl2", { alpha: false, antialias: false, depth: false, powerPreference: "high-performance" });
    if (!gl) throw new Error("WebGL2 unavailable");
    try {
      const adapter = webglAdapter(gl);
      if (adapter.software) throw new Error("software graphics adapter · " + adapter.name);
      if (!gl.getExtension("EXT_color_buffer_float")) throw new Error("floating-point render targets unavailable");
      const response = await fetch(new URL("./raytrace.frag", import.meta.url));
      if (!response.ok) throw new Error("ray shader unavailable");
      return new GpuTracer(gl, trees, await response.text(), adapter.name);
    } catch (error) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      throw error;
    }
  }
  constructor(gl, trees, source, adapterName) {
    this.gl = gl;
    this.adapterName = adapterName;
    this.limit = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.program = gl.createProgram();
    const shaders = [compile(gl, gl.VERTEX_SHADER, vertexShader), compile(gl, gl.FRAGMENT_SHADER, source)];
    for (const shader of shaders) gl.attachShader(this.program, shader);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.program));
    for (const shader of shaders) gl.deleteShader(shader);
    gl.useProgram(this.program);
    this.uniform = {};
    for (const name of [
      "camera",
      "resolution",
      "pixelOrigin",
      "stackRange",
      "cutAxis",
      "oxide",
      "ultra",
      "oxideLo",
      "oxideHi",
      "oxideIOR",
      "filmFace",
      "filmRim",
      "tanFov",
      "aspect",
      "waterHeight",
      "layerCount",
      "sampleNumber",
      "useTints",
      "ocean",
      "grid",
      "sun",
      "sunlight",
      "waterColor",
      "bands[0]",
    ])
      this.uniform[name] = gl.getUniformLocation(this.program, name);
    this.textures = {};
    for (const [i, name] of samplers.entries()) {
      gl.uniform1i(gl.getUniformLocation(this.program, name), i);
      if (name !== "previous") this.textures[name] = gl.createTexture();
    }
    const packed = packTrees(trees, this.limit);
    for (const name of ["nodes", "primitives", "vertices", "instances"]) this.upload(name, packed[name]);
    this.colorInfo = { tint: packed.tint, colorRanges: packed.colorRanges };
    this.layerInfo = packed.layers;
    this.materials = atlas(3 * trees.length, this.limit);
    this.upload("tints", { width: 1, height: 1, data: new Uint8Array(4) });
    this.upload("panorama", { width: 1, height: 1, data: new Uint8Array(4) }, true);
    this.framebuffer = gl.createFramebuffer();
    this.targets = [gl.createTexture(), gl.createTexture()];
    gl.disable(gl.DITHER);
    gl.enable(gl.SCISSOR_TEST);
    this.check();
  }
  check() {
    if (this.gl.isContextLost() || this.gl.getError() !== this.gl.NO_ERROR) throw new Error("GPU resources unavailable");
  }
  bind(name, texture = this.textures[name]) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + samplers.indexOf(name));
    gl.bindTexture(gl.TEXTURE_2D, texture);
  }
  upload(name, { width, height, data }, sky = false) {
    const gl = this.gl;
    this.bind(name);
    const bytes = data instanceof Uint8Array || data instanceof Uint8ClampedArray;
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      sky ? gl.SRGB8_ALPHA8 : bytes ? gl.RGBA8 : gl.RGBA32F,
      width,
      height,
      0,
      gl.RGBA,
      bytes ? gl.UNSIGNED_BYTE : gl.FLOAT,
      data
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, sky ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, sky ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, sky ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  configure(scene, colors, sky) {
    const gl = this.gl,
      u = this.uniform;
    for (const [i, layer] of scene.layers.entries()) {
      const { root, shared } = this.layerInfo[i],
        s = layer.style;
      this.materials.data.set(
        [
          layer.y,
          layer.visible ? layer.thickness : 0,
          root,
          Number(shared),
          ...new Color(s.color).toArray(),
          s.type === "glass" ? 2 : 0,
          s.roughness,
          metalSurface(s.type) ? s.metalness : 0,
          s.ior,
          Number(coated(s.type, scene.finish?.allMetals)),
        ],
        12 * i
      );
    }
    this.upload("materials", this.materials);
    if (colors !== this.lastColors && colors.length) {
      packColors(this.colorInfo, colors);
      this.upload("tints", this.colorInfo.tint);
    }
    this.lastColors = colors;
    if (scene.ocean && sky !== this.lastSky) {
      this.upload("panorama", { ...sky, data: sky.pixels }, true);
      this.lastSky = sky;
    }
    this.tile = scene.tile;
    const section = scene.section;
    gl.uniform1i(u.cutAxis, section?.axis ?? -1);
    gl.uniform1i(u.ultra, Number(scene.samples >= 256));
    gl.uniform1i(u.oxide, Number(!!section?.oxide));
    gl.uniform3fv(u.oxideLo, section?.lo ?? [0, 0, 0]);
    gl.uniform3fv(u.oxideHi, section?.hi ?? [0, 0, 0]);
    gl.uniform1f(u.oxideIOR, silicaIOR);
    gl.uniform2fv(u.stackRange, scene.range || [0, 1]);
    gl.uniform3fv(u.filmFace, new Color(scene.finish?.face || defaultFinish.face).toArray());
    gl.uniform3fv(u.filmRim, new Color(scene.finish?.rim || defaultFinish.rim).toArray());
    gl.uniformMatrix4fv(u.camera, false, scene.matrix);
    gl.uniform1f(u.tanFov, Math.tan((scene.fov * Math.PI) / 360));
    gl.uniform1f(u.aspect, scene.aspect);
    gl.uniform1f(u.waterHeight, waterLevel);
    gl.uniform1i(u.layerCount, scene.layers.length);
    gl.uniform1i(u.grid, Number(scene.grid));
    gl.uniform1i(u.ocean, Number(scene.ocean));
    gl.uniform1i(u.useTints, Number(!!colors.length));
    gl.uniform3fv(u.sun, scene.ocean ? scene.sunDirection : [-0.45, 0.83, 0.34]);
    gl.uniform3fv(u.sunlight, new Color(scene.sunlight).toArray());
    if (scene.ocean) {
      gl.uniform3fv(u.waterColor, scene.water.color);
      gl.uniform4fv(
        u["bands[0]"],
        scene.water.bands.flatMap((b) => [b.x, b.z, b.amplitude, b.phase])
      );
    }
    this.check();
  }
  resize(width, height) {
    if (this.width === width && this.height === height) return;
    const gl = this.gl;
    this.width = width;
    this.height = height;
    for (const tex of this.targets) {
      this.bind("previous", tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }
    this.readback = new Float32Array(4 * width * height);
    gl.viewport(0, 0, width, height);
  }
  async pass(width, height, sample, active, readFrame = true) {
    const gl = this.gl;
    this.resize(width, height);
    gl.uniform2f(this.uniform.resolution, this.tile?.fullWidth ?? width, this.tile?.fullHeight ?? height);
    gl.uniform2f(this.uniform.pixelOrigin, this.tile?.x ?? 0, this.tile?.y ?? 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.targets[sample % 2], 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("GPU frame allocation failed");
    this.bind("previous", this.targets[1 - (sample % 2)]);
    gl.uniform1i(this.uniform.sampleNumber, sample);
    // Bound each submission and observe camera changes between batches.
    const rows = Math.max(1, Math.floor(16384 / width));
    for (let y = 0; y < height; y += rows) {
      gl.scissor(0, y, width, Math.min(rows, height - y));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!fence) throw new Error("GPU synchronization failed");
      gl.flush();
      try {
        let status;
        do {
          await sleep();
          if (!active()) return null;
          status = gl.clientWaitSync(fence, 0, 0);
          if (status === gl.WAIT_FAILED || gl.isContextLost()) throw new Error("GPU context lost");
        } while (status === gl.TIMEOUT_EXPIRED);
      } finally {
        gl.deleteSync(fence);
      }
    }
    if (!readFrame) return null;
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, this.readback);
    this.check();
    const linear = new Float32Array(3 * width * height);
    const heights = new Uint8Array(width * height);
    for (let j = 0, i = 0; i < linear.length; i += 3, j += 4) {
      heights[j / 4] = this.readback[j + 3];
      linear[i] = this.readback[j];
      linear[i + 1] = this.readback[j + 1];
      linear[i + 2] = this.readback[j + 2];
    }
    return { linear, heights };
  }
  dispose() {
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
