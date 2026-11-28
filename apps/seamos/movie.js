import { Vector3 } from "./lib/graphics.js";
import { scanPhase } from "./surface-effects.js";

const turn = 2 * Math.PI;
const up = new Vector3(0, 1, 0);
const ids = ["orbit", "sun", "sea", "slice", "keys"];
const keyNames = ["start", "end"];
const $ = (id) => document.getElementById(id);

function cameraKey(vp) {
  return { position: vp.camera.position.toArray(), target: vp.controls.target.toArray(), fov: vp.camera.fov };
}
function validKey(key) {
  return (
    key &&
    [key.position, key.target].every((v) => Array.isArray(v) && v.length === 3 && v.every((n) => Number.isFinite(n) && Math.abs(n) < 100000)) &&
    Number.isFinite(key.fov) &&
    key.fov >= 1 &&
    key.fov <= 120 &&
    key.position.some((n, i) => Math.abs(n - key.target[i]) > 1e-8)
  );
}
function orbitOf(key) {
  const offset = new Vector3(...key.position).sub(new Vector3(...key.target)),
    radius = offset.length();
  return { radius, yaw: Math.atan2(offset.x, offset.z), polar: Math.acos(Math.max(-1, Math.min(1, offset.y / radius))) };
}
export function cameraBetween(start, end, t) {
  const a = orbitOf(start),
    b = orbitOf(end),
    f = t * t * (3 - 2 * t);
  const target = new Vector3(...start.target).lerp(new Vector3(...end.target), f);
  const shortest = Math.atan2(Math.sin(b.yaw - a.yaw), Math.cos(b.yaw - a.yaw));
  const radius = a.radius * (b.radius / a.radius) ** f,
    polar = a.polar + (b.polar - a.polar) * f,
    yaw = a.yaw + shortest * f;
  const position = new Vector3().setFromSphericalCoords(radius, polar, yaw).add(target);
  return { position: position.toArray(), target: target.toArray(), fov: start.fov + (end.fov - start.fov) * f };
}
function setCamera(vp, key) {
  vp.controls.target.fromArray(key.target);
  vp.camera.position.fromArray(key.position);
  vp.camera.fov = key.fov;
  vp.camera.updateProjectionMatrix();
  vp.camera.lookAt(vp.controls.target);
}
function movieType() {
  if (!globalThis.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return "";
  return ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"].find((t) => MediaRecorder.isTypeSupported(t)) || "";
}
function recordCanvas(canvas, type) {
  const stream = canvas.captureStream(24);
  let recorder;
  try {
    recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: canvas.height >= 1080 ? 12000000 : 6500000 });
  } catch (e) {
    stream.getTracks().forEach((t) => t.stop());
    throw e;
  }
  const chunks = [];
  const result = new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onerror = (e) => reject(e.error || new Error("Movie encoding failed."));
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
  });
  result.catch(() => {});
  return {
    recorder,
    result,
    release() {
      if (recorder.state !== "inactive") recorder.stop();
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}
function animate(duration, draw, signal) {
  return new Promise((resolve, reject) => {
    let frame,
      first,
      last = -Infinity;
    const cancel = () => {
      cancelAnimationFrame(frame);
      reject(signal.reason);
    };
    signal.addEventListener("abort", cancel, { once: true });
    function tick(now) {
      try {
        first ??= now;
        const elapsed = Math.min(duration, (now - first) / 1000);
        if (now - last >= 1000 / 24 - 1 || elapsed === duration) {
          draw(elapsed);
          last = now;
        }
        if (elapsed < duration) {
          frame = requestAnimationFrame(tick);
          return;
        }
        signal.removeEventListener("abort", cancel);
        resolve();
      } catch (error) {
        signal.removeEventListener("abort", cancel);
        reject(error);
      }
    }
    frame = requestAnimationFrame(tick);
  });
}

export function moviePanel(vp, filename, notice) {
  const keys = {},
    dialog = $("movie-dialog"),
    canvas = $("movie-frame"),
    codec = movieType();
  let job;
  function sync() {
    $("sea-shot").disabled = vp.environment !== "ocean";
    if ($("sea-shot").disabled && $("shot").value === "sea") $("shot").value = "orbit";
    const custom = $("shot").value === "keys";
    $("key-controls").hidden = !custom;
    $("keys-status").textContent = keyNames.map((k) => k + ": " + (keys[k] ? "saved" : "empty")).join(" · ");
    const usable = !!vp.renderer && !!vp.layers.length && (!custom || keyNames.every((k) => keys[k]));
    $("play-shot").disabled = !usable;
    $("record-shot").disabled = !usable || !codec;
    $("movie-hint").textContent = !vp.renderer
      ? "Movie playback requires the WebGL preview."
      : !codec
        ? "Movie recording is unavailable in this browser."
        : "Records the WebGL preview at up to 24 fps.";
  }
  function state() {
    return { preset: $("shot").value, duration: Number($("shot-duration").value), size: Number($("shot-size").value), ...keys };
  }
  function restore(value = {}) {
    for (const k of keyNames) {
      if (validKey(value?.[k])) keys[k] = value[k];
      else delete keys[k];
    }
    $("shot").value = ids.includes(value?.preset) ? value.preset : "orbit";
    $("shot-duration").value = [3, 6, 12].includes(value?.duration) ? value.duration : 6;
    $("shot-size").value = value?.size === 1080 ? 1080 : 720;
    sync();
  }
  function stop() {
    job?.abort();
  }
  async function play(record) {
    if (job || !vp.renderer || !vp.layers.length) return;
    const control = new AbortController();
    job = control;
    const shot = state(),
      initial = cameraKey(vp),
      cut = { ...vp.cut },
      phase = vp.scanPosition();
    const r = vp.renderer,
      ratio = r.getPixelRatio(),
      aspect = vp.camera.aspect,
      light = vp.keyLight.position.clone();
    const skyAngle = vp.world.environmentRotation.y;
    let capture, blob;
    try {
      vp.movieActive = true;
      cancelAnimationFrame(vp.frame);
      vp.frame = 0;
      clearTimeout(vp.traceTimer);
      dialog.showModal();
      $("movie-title").textContent = $("shot").selectedOptions[0].textContent;
      const h = record ? shot.size : Math.min(shot.size, 450),
        w = Math.round((h * 16) / 9);
      canvas.width = w;
      canvas.height = h;
      r.setDrawingBufferSize(w, h, 1);
      vp.camera.aspect = w / h;
      vp.camera.updateProjectionMatrix();
      if (shot.preset === "slice" && !cut.enabled) {
        vp.setCut({ ...cut, enabled: true, position: 20 });
        vp.setView("cut");
      }
      const sliceStart = vp.cut.position,
        sliceEnd = sliceStart > 75 ? 20 : 80;
      const ctx = canvas.getContext("2d", { alpha: false });
      function draw(seconds) {
        const t = seconds / shot.duration;
        if (shot.preset === "orbit") {
          vp.camera.position
            .fromArray(initial.position)
            .sub(vp.controls.target)
            .applyAxisAngle(up, turn * t)
            .add(vp.controls.target);
          vp.camera.lookAt(vp.controls.target);
        } else if (shot.preset === "keys") setCamera(vp, cameraBetween(shot.start, shot.end, t));
        else if (shot.preset === "slice") vp.setCut({ ...vp.cut, position: sliceStart + (sliceEnd - sliceStart) * t * t * (3 - 2 * t) }, true);
        else if (shot.preset === "sun") {
          const angle = t * turn;
          vp.keyLight.position.copy(light).applyAxisAngle(up, angle);
          vp.world.environmentRotation.y = skyAngle + angle;
          if (vp.ocean) vp.ocean.uniforms.skyTurn.value = angle / turn;
        } else if (shot.preset === "sea") vp.ocean.uniforms.waveTime.value = turn * t;
        vp.camera.updateMatrixWorld();
        vp.drawPreview(scanPhase(phase, vp.scan.enabled ? vp.scan.speed : 0, seconds * 1000));
        ctx.drawImage(vp.canvas, 0, 0, w, h);
        $("movie-status").textContent = (record ? "Recording" : "Playing") + " · " + seconds.toFixed(1) + " / " + shot.duration + " s";
      }
      draw(0);
      if (record) {
        capture = recordCanvas(canvas, codec);
        capture.recorder.start();
      }
      const animation = animate(shot.duration, draw, control.signal);
      if (capture) {
        await Promise.race([
          animation,
          capture.result.then(() => {
            throw Error("The movie recorder stopped early.");
          }),
        ]);
        capture.recorder.stop();
        blob = await capture.result;
        if (!blob.size) throw Error("The browser produced an empty movie.");
      } else await animation;
      control.signal.throwIfAborted();
    } catch (error) {
      if (!control.signal.aborted) notice(error.message || "Could not render movie.");
      blob = null;
    } finally {
      control.abort();
      capture?.release();
      if (shot.preset === "slice") vp.setCut(cut);
      vp.keyLight.position.copy(light);
      vp.world.environmentRotation.y = skyAngle;
      if (vp.ocean) {
        vp.ocean.uniforms.skyTurn.value = 0;
        vp.ocean.uniforms.waveTime.value = 0;
      }
      vp.camera.aspect = aspect;
      setCamera(vp, initial);
      vp.controls.update();
      r.setDrawingBufferSize(vp.viewportWidth, vp.viewportHeight, ratio);
      vp.movieActive = false;
      vp.resize();
      vp.camera.updateMatrixWorld();
      vp.drawPreview();
      vp.drawAxes();
      if (vp.trace && vp.traced.hidden) vp.update();
      dialog.close();
      job = null;
    }
    if (blob) {
      const a = document.createElement("a"),
        url = URL.createObjectURL(blob);
      a.href = url;
      a.download = filename() + "-" + shot.preset + (blob.type.includes("mp4") ? ".mp4" : ".webm");
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
  }
  for (const k of keyNames)
    $("key-" + k).onclick = () => {
      keys[k] = cameraKey(vp);
      sync();
    };
  $("shot").onchange = sync;
  $("play-shot").onclick = () => play(false);
  $("record-shot").onclick = () => play(true);
  $("stop-movie").onclick = stop;
  dialog.oncancel = (e) => {
    e.preventDefault();
    stop();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  sync();
  return { sync, state, restore, stop };
}
