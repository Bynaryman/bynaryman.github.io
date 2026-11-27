// A small bilateral filter in display space. Color distance suppresses mixing
// across mask edges. Spatial weights [1, 2, 1] favor the center of each pixel.
const rangeWeight = Float32Array.from({ length: 3 * 255 ** 2 + 1 }, (_, squared) => Math.exp(-squared / (2 * 32 ** 2)));

export function denoiseFrame(raw, width, height) {
  const out = new Uint8ClampedArray(raw.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = 4 * (y * width + x);
      let red = 0,
        green = 0,
        blue = 0,
        total = 0;
      for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1); yy++) {
        for (let xx = Math.max(0, x - 1); xx <= Math.min(width - 1, x + 1); xx++) {
          const j = 4 * (yy * width + xx);
          const delta = (raw[j] - raw[i]) ** 2 + (raw[j + 1] - raw[i + 1]) ** 2 + (raw[j + 2] - raw[i + 2]) ** 2;
          const weight = rangeWeight[delta] * (xx === x ? 2 : 1) * (yy === y ? 2 : 1);
          total += weight;
          red += weight * raw[j];
          green += weight * raw[j + 1];
          blue += weight * raw[j + 2];
        }
      }
      out[i] = red / total;
      out[i + 1] = green / total;
      out[i + 2] = blue / total;
      out[i + 3] = raw[i + 3];
    }
  }
  return out;
}
