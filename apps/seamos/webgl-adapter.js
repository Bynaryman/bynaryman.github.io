// Read the context doing the work. Preview and tracing use separate contexts.
export function webglAdapter(gl) {
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = (info && gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || "";
  const software = /swiftshader|llvmpipe|softpipe|lavapipe|software (rasterizer|renderer|adapter)|microsoft basic render driver/i.test(renderer);
  // Firefox can report a representative device followed by “or similar”.
  if (/\bor similar\b/i.test(renderer)) {
    const vendor = renderer.match(/\b(NVIDIA|Intel|AMD|ATI|Apple|Qualcomm|ARM)\b/i)?.[0];
    return { name: vendor ? vendor + " (exact model hidden by browser)" : "Adapter model hidden by browser", software };
  }
  const generic = /^(?:WebKit(?: WebGL)?|WebGL(?: 2\.0)?|Mozilla|ANGLE)$/i.test(renderer);
  return { name: renderer && !generic ? renderer : "Adapter model hidden by browser", software };
}
