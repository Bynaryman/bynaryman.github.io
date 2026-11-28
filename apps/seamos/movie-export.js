// Some browsers can encode WebP even when their video encoder is unavailable.
// An opaque lossy WebP contains a VP8 keyframe which can go directly into WebM.
async function webpPacket(canvas, quality) {
  const image = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (image?.type === "image/webp") {
    const bytes = new Uint8Array(await image.arrayBuffer());
    const view = new DataView(bytes.buffer);
    for (let i = 12; i + 8 <= bytes.length; ) {
      const size = view.getUint32(i + 4, true),
        end = i + 8 + size;
      if (end > bytes.length) break;
      if (view.getUint32(i) === 0x56503820) return bytes.subarray(i + 8, end);
      i = end + (size % 2);
    }
  }
  throw new Error("This browser could not encode video. Try Firefox or Chromium.");
}

export async function movieEncoder(canvas, fps, quality) {
  const { BufferTarget, CanvasSource, EncodedPacket, EncodedVideoPacketSource, Mp4OutputFormat, Output, WebMOutputFormat, canEncodeVideo } =
    await import("./lib/video.js");
  const { width, height } = canvas;
  const density = { compact: 0.12, balanced: 0.26, high: 0.5 }[quality];
  const bitrate = Math.round(width * height * fps * density);
  let codec;
  for (const candidate of ["vp9", "vp8", "avc"]) {
    if (await canEncodeVideo(candidate, { width, height, bitrate, frameRate: fps })) {
      codec = candidate;
      break;
    }
  }
  const mp4 = codec === "avc",
    target = new BufferTarget();
  const output = new Output({ target, format: mp4 ? new Mp4OutputFormat() : new WebMOutputFormat() });
  const source = codec ? new CanvasSource(canvas, { codec, bitrate, keyFrameInterval: 2 }) : new EncodedVideoPacketSource("vp8");
  output.addVideoTrack(source, { frameRate: fps });
  await output.start();
  return {
    async add(i) {
      if (codec) await source.add(i / fps, 1 / fps);
      else {
        const bytes = await webpPacket(canvas, { compact: 0.65, balanced: 0.84, high: 0.96 }[quality]);
        const meta = i === 0 ? { decoderConfig: { codec: "vp8", codedWidth: width, codedHeight: height } } : undefined;
        await source.add(new EncodedPacket(bytes, "key", i / fps, 1 / fps), meta);
      }
    },
    async finish() {
      await output.finalize();
      return new Blob([target.buffer], { type: mp4 ? "video/mp4" : "video/webm" });
    },
    async close() {
      if (output.state === "started") await output.cancel();
    },
  };
}
