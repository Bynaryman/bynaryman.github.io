import * as T from "./lib/graphics.js";
import { stackLayers } from "./materials.js";

import { loadPanorama, OceanPreview } from "./ocean-preview.js";
import { defaultSky, defaultWater, sunDirection, waterLevel } from "./bryce.js";

export class Viewport {
  constructor(canvas, traced, onRenderState) {
    this.canvas = canvas;
    this.traced = traced;
    this.onRenderState = onRenderState;
    this.world = new T.Scene();
    this.studioBackground = new T.Color("#c6d5e4");
    this.world.background = this.studioBackground;
    this.environment = "studio";
    this.sky = defaultSky;
    this.water = defaultWater;
    this.camera = new T.PerspectiveCamera(29, 1, 0.06, 500);
    this.controls = new T.OrbitControls(this.camera, canvas);
    this.controls.maxPolarAngle = Math.PI * 0.485;
    this.controls.minDistance = 0.4;
    this.controls.maxDistance = 110;
    this.controls.zoomSpeed = 1.15;
    this.controls.addEventListener("change", () => this.update());
    this.spacing = 8;
    this.exposure = 1.05;
    this.samples = 4;
    this.traceDevice = "auto";
    this.denoise = false;
    this.displayRevision = 0;
    this.layers = [];
    this.meshes = [];
    this.group = new T.Group();
    this.world.add(this.group);
    try {
      this.renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      this.renderer.toneMapping = T.ACESFilmicToneMapping;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = T.PCFSoftShadowMap;
      const env = new T.RoomEnvironment();
      const pmrem = new T.PMREMGenerator(this.renderer);
      this.studioEnvironment = pmrem.fromScene(env, 0.03).texture;
      this.world.environment = this.studioEnvironment;
      this.world.environmentIntensity = 0.78;
      env.dispose();
      pmrem.dispose();
    } catch {
      this.renderer = null;
      this.trace = true;
    }
    this.world.add(new T.HemisphereLight(0xdceaf1, 0x3a403f, 0.75));
    const key = new T.DirectionalLight(0xffe0c0, 2.15);
    this.keyLight = key;
    key.position.set(-5, 9, -4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 0.1, far: 40 });
    key.shadow.normalBias = 0.012;
    key.shadow.bias = -0.0002;
    this.world.add(key);
    const fill = new T.DirectionalLight(0x9cc4dd, 1);
    fill.position.set(8, 5, -6);
    this.world.add(fill);
    this.grid = { visible: true };
    this.gridUniform = { value: 1 };
    const floorMaterial = new T.MeshStandardMaterial({ color: "#75869b", roughness: 1, metalness: 0, envMapIntensity: 0.025 });
    floorMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.showGrid = this.gridUniform;
      shader.vertexShader =
        "varying vec2 floorCoord;\n" + shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n floorCoord = position.xy;");
      shader.fragmentShader =
        "varying vec2 floorCoord; uniform float showGrid;\n" +
        shader.fragmentShader.replace(
          "#include <color_fragment>",
          `
        #include <color_fragment>
        vec2 pixel = max(fwidth(floorCoord), vec2(0.0001));
        vec2 edge = abs(fract(floorCoord + 0.5) - 0.5) / pixel;
        float line = 1.0 - smoothstep(0.08, 0.95, min(edge.x,edge.y));
        float fade = 1.0 - smoothstep(6.0,27.0,length(floorCoord));
        diffuseColor.rgb *= 0.5 + 0.5*fade;
        diffuseColor.rgb += vec3(0.007,0.009,0.011)*line*fade*showGrid;
      `
        );
    };
    this.floor = new T.Mesh(new T.PlaneGeometry(260, 260), floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = waterLevel;
    this.floor.receiveShadow = true;
    this.world.add(this.floor);
    this.applyAppearance();
    new MutationObserver(() => this.applyAppearance()).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-variant"],
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas.parentElement);
    this.resize();
    this.setView("perspective");
  }
  applyAppearance() {
    this.lightUI = document.documentElement.dataset.theme !== "dark";
    this.drawAxes();
  }
  prepareOcean(sky = defaultSky) {
    if (sky !== defaultSky) return loadPanorama(sky);
    if (!this.panoramaPromise)
      this.panoramaPromise = loadPanorama(sky).catch((error) => {
        this.panoramaPromise = null;
        throw error;
      });
    return this.panoramaPromise;
  }
  setSky(sky, panorama) {
    if (this.sky === sky && this.skyPixels) return;
    this.sky = sky;
    this.skyPixels = panorama.pixels;
    this.workerHasSky = false;
    if (this.renderer) {
      if (this.ocean) this.ocean.setPanorama(panorama.image);
      else {
        this.ocean = new OceanPreview(panorama.image);
        this.ocean.backdrop.visible = this.environment === "ocean";
        this.world.add(this.ocean.backdrop);
      }
    }
    if (this.environment === "ocean") this.lightOcean();
    this.update();
  }
  lightOcean() {
    if (this.ocean) this.world.environment = this.ocean.sky;
    this.keyLight.position.fromArray(sunDirection(this.sky)).multiplyScalar(18);
    this.keyLight.color.set(this.sky.light);
  }
  setWater(water) {
    this.water = water;
    this.ocean?.setWater(water);
    this.update();
  }
  setEnvironment(name) {
    if (this.environment === name) return;
    this.environment = name;
    const ocean = name === "ocean";
    this.floor.visible = !ocean;
    this.world.background = ocean ? null : this.studioBackground;
    if (this.ocean) {
      this.ocean.backdrop.visible = ocean;
      this.world.environment = ocean ? this.ocean.sky : this.studioEnvironment;
    }
    this.world.environmentIntensity = ocean ? 1.2 : 0.78;
    if (ocean) this.lightOcean();
    else {
      this.keyLight.position.set(-5, 9, -4);
      this.keyLight.color.set(0xffe0c0);
    }
    this.update();
  }
  resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas.parentElement;
    if (this.viewportWidth === w && this.viewportHeight === h) return;
    this.viewportWidth = w;
    this.viewportHeight = h;
    const aspect = w / Math.max(1, h);
    if (this.lastAspect && aspect !== this.lastAspect) {
      const scale = this.fitDistance(aspect) / this.fitDistance(this.lastAspect);
      const offset = this.camera.position.clone().sub(this.controls.target).multiplyScalar(scale);
      this.camera.position.copy(this.controls.target).add(offset);
      this.controls.update();
    }
    this.lastAspect = aspect;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer?.setSize(w, h, false);
    this.update();
  }
  setLayout(layers) {
    this.stopTrace(true);
    this.traceBackend = null;
    for (const mesh of this.meshes) {
      this.group.remove(mesh);
      mesh.traverse((part) => {
        part.geometry?.dispose();
        if (part.isInstancedMesh) part.dispose();
      });
      mesh.material.dispose();
    }
    this.layers = layers;
    this.sharedLayout = layers.some((l) => l.parts);
    this.vertexColors = [];
    this.meshes = layers.map((layer) => {
      const material = new T.MeshPhysicalMaterial({ flatShading: true, side: T.DoubleSide });
      const makeGeometry = ({ positions, indices }) => {
        const geometry = new T.BufferGeometry();
        geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
        geometry.setIndex(new T.BufferAttribute(indices, 1));
        geometry.computeVertexNormals();
        return geometry;
      };
      let mesh;
      if (layer.parts) {
        mesh = new T.Group();
        mesh.material = material;
        for (const part of layer.parts) {
          const transforms = part.placements;
          const child = new T.InstancedMesh(makeGeometry(part), material, transforms.length / 8);
          const matrix = new T.Matrix4();
          for (let i = 0; i < transforms.length; i += 8) {
            matrix.set(
              transforms[i],
              0,
              transforms[i + 2],
              transforms[i + 4],
              0,
              1,
              0,
              0,
              transforms[i + 1],
              0,
              transforms[i + 3],
              transforms[i + 5],
              0,
              0,
              0,
              1
            );
            child.setMatrixAt(i / 8, matrix);
          }
          child.userData.surfaceCount = part.surfaceCount;
          child.receiveShadow = true;
          mesh.add(child);
        }
      } else mesh = new T.Mesh(makeGeometry(layer), material);
      mesh.castShadow = mesh.receiveShadow = true;
      this.group.add(mesh);
      return mesh;
    });
    this.apply();
    this.setView(this.environment === "ocean" ? "horizon" : "perspective");
  }
  setColors(colors) {
    this.vertexColors = colors;
    for (const [i, mesh] of this.meshes.entries()) {
      if (this.layers[i].parts) {
        const color = new T.Color();
        for (const [j, part] of mesh.children.entries()) {
          if (colors.length) {
            const bytes = colors[i][j];
            for (let k = 0; k < bytes.length; k += 3) part.setColorAt(k / 3, color.setRGB(bytes[k] / 255, bytes[k + 1] / 255, bytes[k + 2] / 255));
            part.instanceColor.needsUpdate = true;
          } else if (part.instanceColor) {
            // Keep the GPU color buffer for reuse across inspections.
            part.instanceColor.array.fill(1);
            part.instanceColor.needsUpdate = true;
          }
        }
        continue;
      }
      if (colors.length) mesh.geometry.setAttribute("color", new T.BufferAttribute(colors[i], 3, true));
      else mesh.geometry.deleteAttribute("color");
      mesh.material.vertexColors = !!colors.length;
    }
    this.worker?.postMessage({ type: "colors", colors });
    this.apply();
  }
  apply() {
    this.height = stackLayers(this.layers, this.spacing);
    for (const [i, layer] of this.layers.entries()) {
      const mesh = this.meshes[i],
        m = mesh.material,
        s = layer.style;
      mesh.visible = layer.visible;
      mesh.position.y = layer.y;
      mesh.scale.y = layer.thickness;
      const glass = s.type === "glass";
      m.color.set(this.vertexColors.length ? "#ffffff" : s.color);
      m.roughness = Math.max(0.025, s.roughness);
      m.metalness = s.type === "metal" ? s.metalness : 0;
      m.transmission = glass ? 0.9 : 0;
      m.ior = s.ior;
      m.thickness = layer.thickness * 1.2;
      m.clearcoat = glass ? 1 : s.type === "metal" ? 0.28 : 0;
      m.clearcoatRoughness = m.roughness;
      m.envMapIntensity = glass ? 1.15 : 1;
      mesh.castShadow = !glass;
      for (const child of mesh.children) child.castShadow = !glass;
      m.needsUpdate = true;
    }
    if (this.renderer) this.renderer.toneMappingExposure = this.exposure;
    this.update();
  }
  fitDistance(aspect) {
    return Math.max(22.8, 29 / aspect);
  }
  setView(view) {
    this.camera.fov = view === "horizon" ? 38 : 29;
    this.camera.updateProjectionMatrix();
    const targetY = view === "horizon" ? (this.height || 1) * 0.48 + 0.55 : (this.height || 1) * 0.04;
    const target = new T.Vector3(0, targetY, 0);
    const dir =
      view === "top"
        ? new T.Vector3(0, 1, 0.0001)
        : view === "front"
          ? new T.Vector3(0, 0.12, 1)
          : new T.Vector3(1, view === "horizon" ? 0.225 : 0.98, 1.28);
    const distance = this.fitDistance(this.camera.aspect) * (view === "horizon" ? 0.73 : 1);
    this.camera.position.copy(target).addScaledVector(dir.normalize(), distance);
    this.controls.target.copy(target);
    this.controls.update();
    this.update();
  }
  zoom(factor) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.setLength(Math.max(this.controls.minDistance, Math.min(this.controls.maxDistance, offset.length() * factor)));
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }
  nudge(x, y) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    if (this.controls.mouseButtons.LEFT === T.MOUSE.PAN) {
      const step = new T.Vector3(x, y, 0).applyQuaternion(this.camera.quaternion).multiplyScalar(offset.length() * 0.045);
      this.controls.target.add(step);
      this.camera.position.add(step);
    } else {
      const radius = offset.length(),
        angle = Math.atan2(offset.x, offset.z) + x * 0.12;
      const polar = Math.max(0.012, Math.min(this.controls.maxPolarAngle, Math.acos(offset.y / radius) + y * 0.1));
      offset.set(radius * Math.sin(polar) * Math.sin(angle), radius * Math.cos(polar), radius * Math.sin(polar) * Math.cos(angle));
      this.camera.position.copy(this.controls.target).add(offset);
    }
    this.controls.update();
  }
  setTool(pan) {
    this.controls.mouseButtons.LEFT = pan ? T.MOUSE.PAN : T.MOUSE.ROTATE;
    this.canvas.style.cursor = pan ? "grab" : "default";
  }
  update() {
    this.stopTrace(false);
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.camera.updateMatrixWorld();
      this.gridUniform.value = this.grid.visible ? 1 : 0;
      this.drawPreview();
      this.drawAxes();
      if (this.trace && this.layers.length) {
        this.traceTimer = setTimeout(() => this.startTrace(), 200);
      }
    });
  }
  drawPreview() {
    if (!this.renderer) return;
    if (this.sharedLayout) {
      const overview = this.camera.position.distanceTo(this.controls.target) > 5;
      for (const [i, layer] of this.layers.entries()) {
        const mesh = this.meshes[i],
          glass = layer.style.type === "glass";
        if (!layer.parts) continue;
        mesh.material.transmission = glass && !overview ? 0.9 : 0;
        mesh.material.transparent = glass && overview;
        mesh.material.opacity = glass && overview ? 0.45 : 1;
        for (const child of mesh.children) {
          child.castShadow = !overview && !glass;
          child.geometry.setDrawRange(0, overview ? child.userData.surfaceCount : Infinity);
        }
      }
    }
    if (this.environment === "ocean") this.ocean.renderReflection(this.renderer, this.world, this.camera);
    this.renderer.render(this.world, this.camera);
  }
  setDisplay(exposure, denoise) {
    if (this.exposure === exposure && this.denoise === denoise) return;
    if (this.exposure !== exposure && this.renderer) {
      this.renderer.toneMappingExposure = exposure;
      if (!this.trace || this.traced.hidden) this.drawPreview();
    }
    this.exposure = exposure;
    this.denoise = denoise;
    this.displayRevision++;
    if (this.trace) this.worker?.postMessage({ type: "display", revision: this.revision, displayRevision: this.displayRevision, exposure, denoise });
  }
  drawAxes() {
    const axis = document.getElementById("axes"),
      ctx = axis.getContext("2d");
    ctx.clearRect(0, 0, 110, 100);
    const q = this.camera.quaternion.clone().invert();
    const axes = [
      [1, 0, 0, "X", this.lightUI ? "#974a32" : "#d99579"],
      [0, 0, -1, "Y", this.lightUI ? "#346148" : "#91b59c"],
      [0, 1, 0, "Z", this.lightUI ? "#315c91" : "#92adc6"],
    ];
    const lines = axes.map(([x, y, z, name, color]) => ({ v: new T.Vector3(x, y, z).applyQuaternion(q), name, color })).sort((a, b) => a.v.z - b.v.z);
    ctx.lineWidth = 3;
    for (const { v, name, color } of lines) {
      ctx.strokeStyle = ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(48, 55);
      ctx.lineTo(48 + v.x * 29, 55 - v.y * 29);
      ctx.stroke();
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(name, 48 + v.x * 41, 55 - v.y * 41);
    }
  }
  stopTrace(release) {
    clearTimeout(this.traceTimer);
    this.revision = (this.revision || 0) + 1;
    this.traced.hidden = true;
    if (this.worker) {
      if (release) {
        this.worker.terminate();
        this.worker = null;
        this.workerHasSky = false;
      } else this.worker.postMessage({ type: "cancel", revision: this.revision });
    }
  }
  startTrace() {
    if (!this.worker) {
      this.worker = new Worker(new URL("./trace-worker.js", import.meta.url), { type: "module" });
      this.worker.onmessage = ({ data }) => {
        if (data.revision !== this.revision || !this.trace) return;
        if (data.backend) {
          this.traceBackend = data.backend;
          this.onBackend?.(data.backend, data.reason);
          return;
        }
        if (data.error) {
          this.traceFailure(data.error);
          return;
        }
        if (data.displayRevision !== this.displayRevision) return;
        this.shownDisplayRevision = data.displayRevision;
        const { width, height, pixels, sample, samples } = data;
        if (this.traced.width !== width || this.traced.height !== height) {
          this.traced.width = width;
          this.traced.height = height;
        }
        this.traced.getContext("2d").putImageData(new ImageData(pixels, width, height), 0, 0);
        this.traced.hidden = false;
        this.traceSamples = sample;
        this.onRenderState(
          sample === samples ? "Ray trace complete" : sample === 0 ? "Refining ray trace…" : "Tracing · " + sample + " / " + samples + " samples"
        );
      };
      this.worker.onerror = () => this.traceFailure("Ray tracing could not finish this layout.");
      this.worker.postMessage({ type: "geometry", layers: this.layers.map((l) => ({ positions: l.positions, indices: l.indices, parts: l.parts })) });
      if (this.vertexColors.length) this.worker.postMessage({ type: "colors", colors: this.vertexColors });
    }
    if (this.environment === "ocean" && !this.workerHasSky) {
      const { data: pixels, width, height } = this.skyPixels;
      this.worker.postMessage({ type: "panorama", sky: { pixels, width, height } });
      this.workerHasSky = true;
    }
    const w = this.canvas.clientWidth,
      h = this.canvas.clientHeight;
    const scale = Math.min(1, Math.sqrt(420000 / (w * h)));
    this.onRenderState("Tracing reflections…");
    this.worker.postMessage({
      type: "render",
      revision: this.revision,
      samples: this.samples,
      device: this.traceDevice,
      width: Math.max(1, Math.round(w * scale)),
      height: Math.max(1, Math.round(h * scale)),
      matrix: this.camera.matrixWorld.elements,
      fov: this.camera.fov,
      aspect: this.camera.aspect,
      exposure: this.exposure,
      grid: this.grid.visible,
      ocean: this.environment === "ocean",
      water: this.water,
      sunDirection: sunDirection(this.sky),
      sunlight: this.sky.light,
      denoise: this.denoise,
      displayRevision: this.displayRevision,
      layers: this.layers.map(({ y, thickness, visible, style }) => ({ y, thickness, visible, style })),
    });
  }
  traceFailure(message) {
    this.stopTrace(true);
    this.trace = !this.renderer;
    this.onRenderState(message, true);
  }
  exportCanvas() {
    if (this.trace && (this.traced.hidden || !this.traceSamples)) throw new Error("Wait for the first full-size ray-traced sample, then export.");
    if (this.trace && this.shownDisplayRevision !== this.displayRevision) throw new Error("Updating the displayed image. Export when it is ready.");
    return this.trace ? this.traced : this.canvas;
  }
}
