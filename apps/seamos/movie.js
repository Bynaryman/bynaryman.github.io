import { traceMovieFrame } from "./image-export.js";
import { movieEncoder } from "./movie-export.js";
import { Vector3 } from "./lib/graphics.js";
import { scanPhase } from "./surface-effects.js";

const turn = 2 * Math.PI;
const up = new Vector3(0, 1, 0);
const ids = ["orbit", "sun", "sea", "slice", "keys"];
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
export function cameraAt(keys, t) {
  const at = Math.max(0, Math.min(1, t)) * (keys.length - 1);
  const i = Math.min(Math.floor(at), keys.length - 2);
  return cameraBetween(keys[i], keys[i + 1], at - i);
}
export function readShot(value = {}) {
  const effects = Array.isArray(value?.effects)
    ? ids.filter((id) => value.effects.includes(id))
    : [ids.includes(value?.preset) ? value.preset : "orbit"];
  const keys = (Array.isArray(value?.keys) ? value.keys : [value?.start, value?.end]).filter(validKey);
  return {
    effects,
    keys,
    duration: [1, 3, 6, 12].includes(value?.duration) ? value.duration : 6,
    size: [360, 720, 1080].includes(value?.size) ? value.size : 720,
    fps: [12, 24, 30].includes(value?.fps) ? value.fps : 24,
    quality: ["compact", "balanced", "high"].includes(value?.quality) ? value.quality : "balanced",
    renderer: ["preview", "trace"].includes(value?.renderer) ? value.renderer : null,
    samples: [1, 4, 16, 64, 256].includes(value?.samples) ? value.samples : 4,
    denoise: value?.denoise !== false,
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
  const dialog = $("movie-dialog"),
    options = $("movie-options"),
    canvas = $("movie-frame"),
    list = $("key-list");
  let keys = [],
    job,
    exporting = false,
    rendererChoice = null;

  function state() {
    return {
      effects: ids.filter((id) => $("shot-" + id).checked),
      keys: [...keys],
      duration: Number($("shot-duration").value),
      size: Number($("shot-size").value),
      fps: Number($("movie-fps").value),
      quality: $("movie-quality").value,
      renderer: rendererChoice,
      samples: Number($("movie-samples").value),
      denoise: $("movie-denoise").checked,
    };
  }
  function sync() {
    $("shot-sea").disabled = vp.environment !== "ocean";
    const useKeys = $("shot-keys").checked,
      selected = list.selectedIndex;
    $("key-controls").hidden = !useKeys;
    $("key-add").disabled = !vp.layers.length;
    $("key-earlier").disabled = selected < 1;
    $("key-later").disabled = selected < 0 || selected === keys.length - 1;
    $("key-update").disabled = $("key-remove").disabled = selected < 0;
    const usable = !!vp.layers.length && (!useKeys || keys.length >= 2);
    $("play-shot").disabled = !usable || !vp.renderer;
    $("record-shot").disabled = !usable;
    const hint = $("movie-hint");
    hint.textContent =
      useKeys && keys.length < 2
        ? "Add at least two camera views to play this path."
        : !vp.renderer
          ? "Use ray tracing to export on this device."
          : "";
    hint.hidden = !hint.textContent;
  }
  function showKeys(selected) {
    const duration = Number($("shot-duration").value);
    list.replaceChildren(
      ...keys.map((_, i) => new Option("View " + (i + 1) + " · " + ((i * duration) / Math.max(1, keys.length - 1)).toFixed(1) + " s", i))
    );
    list.selectedIndex = selected;
    sync();
  }
  function restore(value) {
    const s = readShot(value);
    for (const id of ids) $("shot-" + id).checked = s.effects.includes(id);
    keys = s.keys;
    $("shot-duration").value = s.duration;
    $("shot-size").value = s.size;
    $("movie-fps").value = s.fps;
    $("movie-quality").value = s.quality;
    rendererChoice = s.renderer;
    $("movie-samples").value = s.samples;
    $("movie-denoise").checked = s.denoise;
    showKeys(keys.length ? 0 : -1);
  }
  function exportFields() {
    const trace = $("movie-renderer").value === "trace";
    $("movie-trace-options").hidden = !trace;
    const frames = Number($("shot-duration").value) * Number($("movie-fps").value);
    $("movie-estimate").textContent = frames + " frames" + (trace ? " · " + $("movie-samples").value + " samples/pixel" : "");
  }
  function stop() {
    job?.abort();
  }
  async function play(record) {
    if (job || !vp.layers.length) return;
    const shot = state(),
      trace = record && $("movie-renderer").value === "trace";
    if (!trace && !vp.renderer) return;
    const effects = new Set(shot.effects);
    if (vp.environment !== "ocean") effects.delete("sea");
    if (effects.has("keys") && keys.length < 2) return;
    const control = new AbortController(),
      signal = control.signal;
    job = control;
    exporting = record;
    const initial = cameraKey(vp),
      cut = { ...vp.cut },
      light = vp.keyLight.position.clone(),
      skyAngle = vp.world.environmentRotation.y;
    const phase = vp.scanPosition(),
      r = vp.renderer,
      ratio = r?.getPixelRatio(),
      aspect = vp.camera.aspect;
    let worker, encoder, blob;
    try {
      vp.movieActive = true;
      cancelAnimationFrame(vp.frame);
      vp.frame = 0;
      clearTimeout(vp.traceTimer);
      $("movie-title").textContent = record ? "Rendering movie" : "Movie preview";
      $("movie-status").textContent = record ? "Preparing export…" : "Playing…";
      dialog.showModal();
      const h = record ? shot.size : Math.min(shot.size, 450),
        w = Math.round((h * 16) / 9);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!trace) r.setDrawingBufferSize(w, h, 1);
      vp.camera.aspect = w / h;
      vp.camera.updateProjectionMatrix();
      if (effects.has("slice") && !cut.enabled) {
        vp.setCut({ ...cut, enabled: true, position: 20 });
        if (!effects.has("keys")) vp.setView("cut");
      }
      const base = cameraKey(vp),
        sliceStart = vp.cut.position,
        sliceEnd = sliceStart > 75 ? 20 : 80,
        origin = vp.section?.cutAt;
      const traceLight = vp.environment === "ocean" ? light.clone().normalize() : new Vector3(-0.45, 0.83, 0.34);
      // Absolute poses allow orbit, camera keys and slice tracking to compose
      // without camera drift when the preview skips an animation frame.
      function pose(t, loop = t) {
        setCamera(vp, effects.has("keys") ? cameraAt(shot.keys, t) : base);
        if (effects.has("slice")) {
          vp.setCut({ ...vp.cut, position: sliceStart + (sliceEnd - sliceStart) * t * t * (3 - 2 * t) });
          const axis = vp.section.axis,
            delta = vp.section.cutAt - origin;
          vp.controls.target.setComponent(axis, vp.controls.target.getComponent(axis) + delta);
          vp.camera.position.setComponent(axis, vp.camera.position.getComponent(axis) + delta);
        }
        if (effects.has("orbit"))
          vp.camera.position
            .sub(vp.controls.target)
            .applyAxisAngle(up, turn * loop)
            .add(vp.controls.target);
        vp.camera.lookAt(vp.controls.target);
        vp.camera.updateMatrixWorld();
        const skyTurn = effects.has("sun") ? loop : 0,
          waveTime = effects.has("sea") ? turn * loop : 0;
        if (effects.has("sun")) {
          vp.keyLight.position.copy(light).applyAxisAngle(up, turn * loop);
          vp.world.environmentRotation.y = skyAngle + turn * loop;
        }
        if (vp.ocean) {
          vp.ocean.uniforms.skyTurn.value = skyTurn;
          vp.ocean.uniforms.waveTime.value = waveTime;
        }
        return {
          skyTurn,
          waveTime,
          motionSunDirection: traceLight
            .clone()
            .applyAxisAngle(up, turn * skyTurn)
            .toArray(),
          denoise: shot.denoise,
        };
      }
      const framePhase = (seconds) => scanPhase(phase, vp.scan.enabled ? vp.scan.speed : 0, seconds * 1000);
      function preview(seconds) {
        vp.drawPreview(framePhase(seconds));
        ctx.drawImage(vp.canvas, 0, 0, w, h);
      }
      if (record) {
        encoder = await movieEncoder(canvas, shot.fps, shot.quality);
        signal.throwIfAborted();
        if (trace) {
          worker = vp.geometryWorker();
          if (vp.environment === "ocean") vp.sendSky(worker);
        }
        const count = shot.duration * shot.fps;
        for (let i = 0; i < count; i++) {
          signal.throwIfAborted();
          const motion = pose(i / (count - 1), i / count);
          const label = (trace ? "Ray tracing" : "Rendering") + " frame " + (i + 1) + " / " + count;
          $("movie-status").textContent = label;
          if (trace)
            await traceMovieFrame(
              vp,
              worker,
              ctx,
              shot.samples,
              framePhase(i / shot.fps),
              signal,
              (pct) => {
                $("movie-status").textContent = label + " · " + pct + "%";
              },
              motion
            );
          else preview(i / shot.fps);
          signal.throwIfAborted();
          await encoder.add(i);
          // Yield to input and show progress even with a synchronous encoder.
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
        signal.throwIfAborted();
        $("movie-status").textContent = "Finishing movie…";
        blob = await encoder.finish();
        signal.throwIfAborted();
      } else {
        await animate(
          shot.duration,
          (seconds) => {
            pose(seconds / shot.duration);
            preview(seconds);
            $("movie-status").textContent = "Playing · " + seconds.toFixed(1) + " / " + shot.duration + " s";
          },
          signal
        );
      }
    } catch (error) {
      blob = null;
      if (!signal.aborted) notice(error.message || "Could not render movie.");
    } finally {
      worker?.terminate();
      try {
        await encoder?.close();
      } finally {
        if (effects.has("slice")) vp.setCut(cut);
        vp.keyLight.position.copy(light);
        vp.world.environmentRotation.y = skyAngle;
        if (vp.ocean) {
          vp.ocean.uniforms.skyTurn.value = 0;
          vp.ocean.uniforms.waveTime.value = 0;
        }
        vp.camera.aspect = aspect;
        setCamera(vp, initial);
        vp.controls.update();
        if (!trace) r.setDrawingBufferSize(vp.viewportWidth, vp.viewportHeight, ratio);
        vp.movieActive = false;
        vp.resize();
        vp.camera.updateMatrixWorld();
        vp.drawPreview();
        vp.drawAxes();
        if (vp.trace && vp.traced.hidden) vp.update();
        dialog.close();
        job = null;
        exporting = false;
      }
    }
    if (blob && !signal.aborted) {
      const a = document.createElement("a"),
        url = URL.createObjectURL(blob);
      a.href = url;
      a.download = filename() + "-" + ([...effects].join("-") || "movie") + (blob.type === "video/mp4" ? ".mp4" : ".webm");
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
  }
  for (const id of ids) $("shot-" + id).onchange = sync;
  $("shot-duration").onchange = () => showKeys(list.selectedIndex);
  list.onchange = () => {
    const key = keys[list.selectedIndex];
    if (key) {
      setCamera(vp, key);
      vp.controls.update();
      vp.update();
    }
    sync();
  };
  $("key-add").onclick = () => {
    keys.push(cameraKey(vp));
    showKeys(keys.length - 1);
  };
  $("key-update").onclick = () => {
    if (list.selectedIndex >= 0) keys[list.selectedIndex] = cameraKey(vp);
  };
  $("key-remove").onclick = () => {
    const i = list.selectedIndex;
    keys.splice(i, 1);
    showKeys(Math.min(i, keys.length - 1));
  };
  function move(delta) {
    const i = list.selectedIndex,
      j = i + delta;
    if (i < 0 || j < 0 || j >= keys.length) return;
    [keys[i], keys[j]] = [keys[j], keys[i]];
    showKeys(j);
  }
  $("key-earlier").onclick = () => move(-1);
  $("key-later").onclick = () => move(1);
  $("play-shot").onclick = () => play(false);
  $("record-shot").onclick = () => {
    $("movie-renderer").options[0].disabled = !vp.renderer;
    $("movie-renderer").value = !vp.renderer ? "trace" : rendererChoice ?? (vp.trace ? "trace" : "preview");
    exportFields();
    options.showModal();
  };
  $("movie-renderer").onchange = () => {
    rendererChoice = $("movie-renderer").value;
    exportFields();
  };
  $("movie-fps").onchange = $("movie-samples").onchange = exportFields;
  $("movie-options-close").onclick = () => options.close();
  $("movie-export-form").onsubmit = (e) => {
    e.preventDefault();
    options.close();
    play(true);
  };
  $("stop-movie").onclick = stop;
  dialog.oncancel = (e) => {
    e.preventDefault();
    stop();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !exporting) stop();
  });
  sync();
  return { sync, state, restore, stop };
}
