(function () {
  var canvas = document.getElementById("binary-bg");
  if (!canvas || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;

  var ctx = canvas.getContext("2d");
  var dpr = Math.max(1, window.devicePixelRatio || 1);
  var baseDpr = dpr;

  var glyphs = ["0", "1"];
  var cellSize = 18;
  var fadeFactor = 0.95;
  var baseAlpha = 0.05;
  var randomFlashChance = 0.0012;
  var snapToPixel = true;

  var mouseRadiusBase = 190;
  var mouseAlphaBoost = 0.18;
  var mouseAccentThreshold = 0.72;
  var radiusScale = 1;
  var modeStrength = 1;
  var mouseIdleMs = 260;

  var rainMinSpeed = 16;
  var rainMaxSpeed = 44;
  var magneticPull = 820;
  var magneticSwirl = 560;
  var magneticReturn = 4.2;
  var velocityDamping = 4.4;
  var swayStrength = 1.8;

  var warpPush = 1.5;

  var modes = [
    { id: "rain", label: "Magnetic Rain" },
    { id: "warp", label: "Warp Field" }
  ];
  var modeIndex = 0;

  var cols = 0;
  var rows = 0;
  var gridSize = cellSize;
  var viewW = 0;
  var viewH = 0;
  var cells = [];
  var lastTime = performance.now();
  var mouse = { x: 0, y: 0, tx: 0, ty: 0, active: false, intensity: 0, lastMove: performance.now() };
  var hud = null;
  var hudTimeoutId = 0;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function hexToRgb(hex) {
    var clean = hex.replace("#", "");
    if (clean.length === 3) {
      clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    if (clean.length !== 6) return null;
    var num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function clampChannel(v) {
    return Math.max(0, Math.min(255, Math.round(v)));
  }

  function adjustHex(hex, factor) {
    var rgb = hexToRgb(hex);
    if (!rgb) return hex;
    var r = clampChannel(rgb.r + 255 * factor);
    var g = clampChannel(rgb.g + 255 * factor);
    var b = clampChannel(rgb.b + 255 * factor);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function getNumberVar(styles, name, fallback) {
    var raw = styles.getPropertyValue(name);
    if (!raw) return fallback;
    var num = parseFloat(raw);
    return Number.isFinite(num) ? num : fallback;
  }

  function isBinaryTheme() {
    var variant = document.documentElement.getAttribute("data-theme-variant");
    return variant !== "modus";
  }

  function getColors() {
    var styles = getComputedStyle(document.documentElement);
    var bg = styles.getPropertyValue("--binary-bg-color").trim() || "#000";
    var fg = styles.getPropertyValue("--binary-digit-color").trim() || "#fff";
    var accent = styles.getPropertyValue("--binary-accent-color").trim() || fg;
    var alphaBase = getNumberVar(styles, "--binary-alpha-base", baseAlpha);
    var alphaRange = getNumberVar(styles, "--binary-alpha-range", 0.3);
    var alphaBoost = getNumberVar(styles, "--binary-alpha-boost", 0.2);
    var alphaBoostChance = getNumberVar(styles, "--binary-alpha-boost-chance", 0.12);
    var shade1 = adjustHex(fg, 0.12);
    var shade2 = adjustHex(fg, -0.2);
    var shade3 = adjustHex(fg, -0.38);
    return {
      bg: bg,
      fg: fg,
      accent: accent,
      palette: [fg, shade1, shade2, shade3, accent],
      alphaBase: alphaBase,
      alphaRange: alphaRange,
      alphaBoost: alphaBoost,
      alphaBoostChance: alphaBoostChance
    };
  }

  function pickColor(palette) {
    if (!palette || !palette.length) return "#fff";
    var roll = Math.random();
    if (roll > 0.95) return palette[4] || palette[0];
    return palette[Math.floor(Math.random() * Math.min(4, palette.length))];
  }

  function ensureHud() {
    if (hud) return;
    hud = document.createElement("div");
    hud.setAttribute("aria-hidden", "true");
    hud.style.position = "fixed";
    hud.style.right = "16px";
    hud.style.bottom = "16px";
    hud.style.padding = "6px 10px";
    hud.style.background = "rgba(0,0,0,0.55)";
    hud.style.border = "1px solid rgba(255,255,255,0.28)";
    hud.style.borderRadius = "4px";
    hud.style.color = "#fff";
    hud.style.fontFamily = '"VT323", "Press Start 2P", "Courier New", monospace';
    hud.style.fontSize = "14px";
    hud.style.letterSpacing = "0.04em";
    hud.style.zIndex = "40";
    hud.style.pointerEvents = "none";
    hud.style.opacity = "0";
    hud.style.transition = "opacity 160ms ease";
    document.body.appendChild(hud);
  }

  function showHud(note) {
    ensureHud();
    var mode = modes[modeIndex];
    var text = mode.label + " | power " + modeStrength.toFixed(2) + " | radius " + radiusScale.toFixed(2);
    if (note) text += " | " + note;
    hud.textContent = text;
    hud.style.opacity = "1";
    if (hudTimeoutId) window.clearTimeout(hudTimeoutId);
    hudTimeoutId = window.setTimeout(function () {
      if (hud) hud.style.opacity = "0";
    }, 1300);
  }

  function resetModeState() {
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      cell.vx = 0;
      cell.vy = 0;
      cell.fvx = 0;
      cell.fvy = 0;
      cell.x = cell.anchorX + (Math.random() - 0.5) * gridSize * 0.28;
      cell.y = Math.random() * (viewH + gridSize * 4) - gridSize * 2;
      cell.fx = cell.anchorX;
      cell.fy = cell.anchorY;
    }
  }

  function resize() {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    if (!baseDpr) baseDpr = dpr;

    var rect = canvas.getBoundingClientRect();
    viewW = rect.width || Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0);
    viewH = rect.height || Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);

    var zoomFactor = dpr / baseDpr;
    gridSize = cellSize / Math.max(1, zoomFactor);
    canvas.width = Math.round(viewW * dpr);
    canvas.height = Math.round(viewH * dpr);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.scale(dpr, dpr);

    cols = Math.ceil(viewW / gridSize) + 2;
    rows = Math.ceil(viewH / gridSize) + 2;
    var colors = getColors();
    var total = cols * rows;
    cells = new Array(total);

    for (var idx = 0; idx < total; idx++) {
      var col = idx % cols;
      var row = Math.floor(idx / cols);
      var anchorX = (col - 1) * gridSize + gridSize * 0.5 + (Math.random() - 0.5) * gridSize * 0.3;
      var anchorY = (row - 1) * gridSize + gridSize * 0.5 + (Math.random() - 0.5) * gridSize * 0.3;
      var alpha = colors.alphaBase + Math.random() * colors.alphaRange;
      if (Math.random() < colors.alphaBoostChance) {
        alpha = Math.min(1, alpha + colors.alphaBoost);
      }

      cells[idx] = {
        glyph: glyphs[Math.random() > 0.5 ? 1 : 0],
        alpha: alpha,
        color: pickColor(colors.palette),
        anchorX: anchorX,
        anchorY: anchorY,
        x: anchorX + (Math.random() - 0.5) * gridSize * 0.28,
        y: Math.random() * (viewH + gridSize * 4) - gridSize * 2,
        vx: 0,
        vy: 0,
        speed: rainMinSpeed + Math.random() * (rainMaxSpeed - rainMinSpeed),
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.04 + Math.random() * 0.06,
        spin: Math.random() > 0.5 ? 1 : -1
      };
    }

    mouse.active = false;
  }

  function updateMouse(dt, now) {
    if (mouse.active && now - mouse.lastMove > mouseIdleMs) {
      mouse.active = false;
    }

    var targetIntensity = mouse.active ? 1 : 0;
    var fade = Math.min(1, dt / 180);
    mouse.intensity += (targetIntensity - mouse.intensity) * fade;

    if (mouse.intensity <= 0.0001) return;
    var easing = Math.min(1, dt / 120) * (0.45 + 0.55 * mouse.intensity);
    mouse.x += (mouse.tx - mouse.x) * easing;
    mouse.y += (mouse.ty - mouse.y) * easing;
  }

  function step(now) {
    if (!isBinaryTheme()) {
      if (canvas.style.visibility !== "hidden") canvas.style.visibility = "hidden";
      if (hud) hud.style.opacity = "0";
      lastTime = now;
      requestAnimationFrame(step);
      return;
    }
    if (canvas.style.visibility === "hidden") canvas.style.visibility = "";

    var rect = canvas.getBoundingClientRect();
    var expectedW = rect.width || Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0);
    var expectedH = rect.height || Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
    if (Math.abs(expectedW - canvas.width / dpr) > 1 || Math.abs(expectedH - canvas.height / dpr) > 1) resize();

    var colors = getColors();
    var mode = modes[modeIndex];

    var dt = now - lastTime;
    if (!Number.isFinite(dt) || dt < 0) dt = 16.67;
    dt = Math.min(dt, 64);
    var dtSec = dt / 1000;
    lastTime = now;
    updateMouse(dt, now);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = colors.bg || "#000";
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.font = (gridSize - 4) + 'px "Times New Roman", serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    var alphaBase = colors.alphaBase;
    var decay = Math.pow(fadeFactor, dt / 16.67);
    var zoomFactor = dpr / baseDpr;
    var effectiveRadius = (mouseRadiusBase * radiusScale) / Math.max(1, zoomFactor);
    var radiusSq = effectiveRadius * effectiveRadius;
    var damping = Math.exp(-velocityDamping * dtSec);

    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      cell.alpha = Math.max(alphaBase, cell.alpha * decay);
      var influence = 0;
      var drawX = cell.anchorX;
      var drawY = cell.anchorY;

      if (mode.id === "rain") {
        var px = cell.x;
        var py = cell.y;
        if (mouse.intensity > 0.01) {
          var mdx = mouse.x - px;
          var mdy = mouse.y - py;
          var mdSq = mdx * mdx + mdy * mdy;
          if (mdSq < radiusSq) {
            var md = Math.sqrt(mdSq) || 0.001;
            var falloff = (1 - md / effectiveRadius) * mouse.intensity;
            influence = falloff * falloff;
            var nx = mdx / md;
            var ny = mdy / md;
            var pull = magneticPull * modeStrength * influence * dtSec;
            var swirl = magneticSwirl * modeStrength * influence * cell.spin * dtSec;
            cell.vx += nx * pull - ny * swirl;
            cell.vy += ny * pull + nx * swirl;
            cell.alpha = Math.min(1, cell.alpha + influence * mouseAlphaBoost);
          }
        }

        cell.vx += (cell.anchorX - cell.x) * magneticReturn * dtSec;
        cell.vx *= damping;
        cell.vy *= damping;
        cell.x += cell.vx * dtSec;
        cell.y += (cell.speed * (0.7 + 0.65 * modeStrength) + cell.vy) * dtSec;

        if (cell.x < -gridSize * 2) cell.x = viewW + gridSize;
        if (cell.x > viewW + gridSize * 2) cell.x = -gridSize;
        if (cell.y > viewH + gridSize * 2) {
          cell.y = -gridSize * (1 + Math.random() * 2);
          cell.x = cell.anchorX + (Math.random() - 0.5) * gridSize * 0.45;
          cell.vx *= 0.3;
          cell.vy *= 0.3;
          if (Math.random() < 0.35) {
            cell.glyph = glyphs[Math.random() > 0.5 ? 1 : 0];
          }
        }

        drawX = cell.x + swayStrength * Math.sin(now * 0.0015 + cell.phase);
        drawY = cell.y;
      } else {
        drawX = cell.anchorX + 0.85 * Math.sin(now * 0.001 + cell.phase);
        drawY = cell.anchorY + 0.85 * Math.cos(now * 0.001 + cell.phase);
        if (mouse.intensity > 0.01) {
          var wdx = drawX - mouse.x;
          var wdy = drawY - mouse.y;
          var wdSq = wdx * wdx + wdy * wdy;
          if (wdSq < radiusSq * 3.2) {
            var wd = Math.sqrt(wdSq) || 0.001;
            var wfalloff = (1 - Math.min(1, wd / (effectiveRadius * 1.8))) * mouse.intensity;
            influence = wfalloff * wfalloff;
            var warp = gridSize * warpPush * modeStrength * influence;
            drawX += (wdx / wd) * warp - (wdy / wd) * warp * 0.18 * cell.spin;
            drawY += (wdy / wd) * warp + (wdx / wd) * warp * 0.12 * cell.spin;
            cell.alpha = Math.min(1, cell.alpha + influence * mouseAlphaBoost * 0.75);
          }
        }
      }

      if (drawX < -gridSize || drawY < -gridSize || drawX > viewW + gridSize || drawY > viewH + gridSize) continue;

      var wobble = cell.twinkle * Math.sin(now * 0.0012 + cell.phase);
      var alpha = Math.max(alphaBase, Math.min(1, cell.alpha + wobble + influence * 0.12));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = influence > mouseAccentThreshold ? colors.accent : cell.color || colors.fg;

      var pxOut = snapToPixel ? Math.round(drawX) + 0.5 : drawX;
      var pyOut = snapToPixel ? Math.round(drawY) + 0.5 : drawY;
      if (influence > 0.58 && Math.random() < influence * modeStrength * (dt / 16.67) * 0.06) {
        cell.glyph = cell.glyph === "0" ? "1" : "0";
      }
      ctx.fillText(cell.glyph, pxOut, pyOut);
    }

    ctx.globalAlpha = 1;

    if (Math.random() < randomFlashChance) {
      var target = cells[Math.floor(Math.random() * cells.length)];
      if (target) {
        target.alpha = Math.max(target.alpha, 0.5);
        target.color = pickColor(colors.palette);
      }
    }

    requestAnimationFrame(step);
  }

  function onMove(e) {
    mouse.tx = e.clientX;
    mouse.ty = e.clientY;
    mouse.lastMove = performance.now();
    if (!mouse.active) {
      mouse.x = mouse.tx;
      mouse.y = mouse.ty;
    }
    mouse.active = true;
  }

  function onMouseDown(e) {
    if (e.button === 0) {
      mouse.active = false;
    }
  }

  function onLeave() {
    mouse.active = false;
  }

  function deactivateMouse() {
    mouse.active = false;
    mouse.lastMove = 0;
  }

  function onContextMenu(e) {
    if (!isBinaryTheme()) return;
    if (e.shiftKey) return;
    var target = e.target;
    if (target && (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
    e.preventDefault();
    modeIndex = (modeIndex + 1) % modes.length;
    resetModeState();
    showHud("mode");
  }

  function onWheel(e) {
    if (!isBinaryTheme()) return;
    var dir = e.deltaY < 0 ? 1 : -1;
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      radiusScale = clamp(radiusScale + dir * 0.08, 0.5, 2.6);
      showHud("radius");
    } else {
      modeStrength = clamp(modeStrength + dir * 0.07, 0.35, 2.6);
      showHud("power");
    }
  }

  window.addEventListener("resize", resize, false);
  window.addEventListener("orientationchange", resize, false);
  window.addEventListener("mousemove", onMove, false);
  window.addEventListener("mousedown", onMouseDown, false);
  window.addEventListener("mouseleave", onLeave, false);
  window.addEventListener("blur", deactivateMouse, false);
  window.addEventListener("pagehide", deactivateMouse, false);
  document.addEventListener(
    "visibilitychange",
    function () {
      if (document.hidden) deactivateMouse();
    },
    false
  );
  window.addEventListener("contextmenu", onContextMenu, false);
  window.addEventListener("wheel", onWheel, { passive: true });

  var themeObserver = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var attr = mutations[i].attributeName;
      if (attr === "data-theme" || attr === "data-theme-setting" || attr === "data-theme-variant") {
        mouse.active = false;
        resize();
        lastTime = performance.now();
        showHud();
        break;
      }
    }
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "data-theme-setting", "data-theme-variant"]
  });

  resize();
  var initialRect = canvas.getBoundingClientRect();
  var lastSizeW = initialRect.width || window.innerWidth;
  var lastSizeH = initialRect.height || window.innerHeight;
  var lastDpr = dpr;
  function monitorResize() {
    var rect = canvas.getBoundingClientRect();
    var w = rect.width || window.innerWidth;
    var h = rect.height || window.innerHeight;
    var currentDpr = Math.max(1, window.devicePixelRatio || 1);
    if (w !== lastSizeW || h !== lastSizeH || currentDpr !== lastDpr) {
      lastSizeW = w;
      lastSizeH = h;
      lastDpr = currentDpr;
      resize();
    }
    requestAnimationFrame(monitorResize);
  }

  showHud("ready");
  requestAnimationFrame(monitorResize);
  requestAnimationFrame(step);
})();
