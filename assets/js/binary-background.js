(function () {
  var canvas = document.getElementById("binary-bg");
  if (!canvas || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;

  var ctx = canvas.getContext("2d");
  var dpr = Math.max(1, window.devicePixelRatio || 1);
  var baseDpr = dpr;
  var glyphs = ["0", "1"];
  var cellSize = 18;
  var fadeFactor = 0.96;
  var randomFlashChance = 0.001;
  var baseAlpha = 0.05;
  var swapInterval = 260;
  var colorShiftInterval = 420;
  var mouseRadius = 70;
  var mouseAlphaBoost = 0.1;
  var mouseAccentThreshold = 0.85;
  var mouseFlipSpeed = 0.004;
  var snapToPixel = true;
  var parallaxFactor = 0.18;

  var cols = 0;
  var rows = 0;
  var gridSize = cellSize;
  var cells = [];
  var lastTime = performance.now();
  var mouse = { x: 0, y: 0, tx: 0, ty: 0, active: false };
  var nextSwap = performance.now() + swapInterval;
  var nextColorShift = performance.now() + colorShiftInterval;

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
    var out = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    return out;
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
    var palette = [fg, shade1, shade2, shade3, accent];
    return {
      bg: bg,
      fg: fg,
      accent: accent,
      palette: palette,
      alphaBase: alphaBase,
      alphaRange: alphaRange,
      alphaBoost: alphaBoost,
      alphaBoostChance: alphaBoostChance
    };
  }

  function pickColor(palette) {
    if (!palette || !palette.length) return "#fff";
    var roll = Math.random();
    if (roll > 0.95) return palette[4] || palette[0]; // accent, rare
    return palette[Math.floor(Math.random() * Math.min(4, palette.length))];
  }

  function resize() {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    if (!baseDpr) {
      baseDpr = dpr;
    }
    var rect = canvas.getBoundingClientRect();
    var w = rect.width || Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0);
    var fullH = rect.height || Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
    var zoomFactor = dpr / baseDpr;
    gridSize = cellSize / Math.max(1, zoomFactor);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(fullH * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.scale(dpr, dpr);
    cols = Math.ceil(w / gridSize) + 2;
    rows = Math.ceil(fullH / gridSize) + 2;
    var colors = getColors();
    cells = new Array(cols * rows);
    for (var idx = 0; idx < cells.length; idx++) {
      var x = idx % cols;
      var y = Math.floor(idx / cols);
      var alpha = colors.alphaBase + Math.random() * colors.alphaRange;
      if (Math.random() < colors.alphaBoostChance) {
        alpha = Math.min(1, alpha + colors.alphaBoost);
      }
      cells[idx] = {
        glyph: glyphs[Math.random() > 0.5 ? 1 : 0],
        alpha: alpha,
        color: pickColor(colors.palette),
        cx: x * gridSize + gridSize / 2,
        cy: y * gridSize + gridSize / 2,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.04 + Math.random() * 0.06
      };
    }
  }

  function updateMouse(dt) {
    if (!mouse.active) return;
    var easing = Math.min(1, dt / 120);
    mouse.x += (mouse.tx - mouse.x) * easing;
    mouse.y += (mouse.ty - mouse.y) * easing;
  }

  function step(now) {
    if (!isBinaryTheme()) {
      if (canvas.style.visibility !== "hidden") {
        canvas.style.visibility = "hidden";
      }
      lastTime = now;
      requestAnimationFrame(step);
      return;
    }
    if (canvas.style.visibility === "hidden") {
      canvas.style.visibility = "";
    }

    var rect = canvas.getBoundingClientRect();
    var expectedW = rect.width || Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0);
    var expectedH = rect.height || Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
    if (Math.abs(expectedW - canvas.width / dpr) > 1 || Math.abs(expectedH - canvas.height / dpr) > 1) {
      resize();
    }
    var colors = getColors();
    var bg = colors.bg;
    var fg = colors.fg;
    var palette = colors.palette;

    var dt = now - lastTime;
    lastTime = now;
    updateMouse(dt);
    var viewW = canvas.width / dpr;
    var viewH = canvas.height / dpr;
    var scrollY = window.scrollY || window.pageYOffset || 0;
    var parallaxOffset = -scrollY * parallaxFactor;
    var wrapH = rows * gridSize;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = bg || "#000";
    ctx.fillRect(0, 0, viewW, viewH);

    var alphaBase = colors.alphaBase;
    var decay = Math.pow(fadeFactor, dt / 16.67);
    var zoomFactor = dpr / baseDpr;
    var effectiveRadius = mouseRadius / Math.max(1, zoomFactor);
    var radiusSq = effectiveRadius * effectiveRadius;
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      cell.alpha = Math.max(alphaBase, cell.alpha * decay);
      var wobble = cell.twinkle * Math.sin(now * 0.0012 + cell.phase);
      var alpha = Math.max(alphaBase, Math.min(1, cell.alpha + wobble));

      var px = cell.cx;
      var py = cell.cy + parallaxOffset;
      if (wrapH > 0) {
        py = ((py % wrapH) + wrapH) % wrapH;
      }
      var influence = 0;
      if (mouse.active) {
        var dx = px - mouse.x;
        var dy = Math.abs(py - mouse.y);
        if (wrapH > 0) {
          dy = Math.min(dy, wrapH - dy);
        }
        var distSq = dx * dx + dy * dy;
        if (distSq < radiusSq) {
          var falloff = 1 - distSq / radiusSq;
          influence = falloff * falloff;
          alpha = Math.min(1, alpha + influence * mouseAlphaBoost);
        }
      }

      if (px < -gridSize || py < -gridSize || px > viewW + gridSize || py > viewH + gridSize) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = influence > mouseAccentThreshold ? colors.accent : cell.color || fg;
      ctx.font = (gridSize - 4) + 'px "Times New Roman", serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      var drawX = snapToPixel ? Math.round(px) + 0.5 : px;
      var drawY = snapToPixel ? Math.round(py) + 0.5 : py;
      var glyph = cell.glyph;
      if (influence > 0.6 && Math.sin(now * mouseFlipSpeed + cell.phase) > 0.6) {
        glyph = glyph === "0" ? "1" : "0";
      }
      ctx.fillText(glyph, drawX, drawY);
    }
    ctx.globalAlpha = 1;

    if (Math.random() < randomFlashChance) {
      var target = cells[Math.floor(Math.random() * cells.length)];
      if (target) {
        target.alpha = Math.max(target.alpha, 0.5);
        target.color = pickColor(palette);
      }
    }

    if (now >= nextSwap) {
      var idx = Math.floor(Math.random() * cells.length);
      var cell = cells[idx];
      var dir = Math.random() > 0.5 ? 1 : -1;
      var neighborIdx = idx + dir * (Math.random() > 0.5 ? 1 : cols);
      if (neighborIdx >= 0 && neighborIdx < cells.length) {
        var n = cells[neighborIdx];
        var tmp = cell.glyph;
        cell.glyph = n.glyph;
        n.glyph = tmp;
        cell.alpha = Math.min(0.4, cell.alpha + 0.08);
        n.alpha = Math.min(0.4, n.alpha + 0.08);
      }
      nextSwap = now + swapInterval + Math.random() * 120;
    }

    if (now >= nextColorShift) {
      var targetShift = cells[Math.floor(Math.random() * cells.length)];
      if (targetShift) {
        targetShift.color = pickColor(palette);
        targetShift.alpha = Math.min(0.5, targetShift.alpha + 0.1);
      }
      nextColorShift = now + colorShiftInterval + Math.random() * 200;
    }

    requestAnimationFrame(step);
  }

  function onMove(e) {
    mouse.tx = e.clientX;
    mouse.ty = e.clientY;
    if (!mouse.active) {
      mouse.x = mouse.tx;
      mouse.y = mouse.ty;
    }
    mouse.active = true;
  }

  function onLeave() {
    mouse.active = false;
  }

  window.addEventListener("resize", resize, false);
  window.addEventListener("orientationchange", resize, false);
  window.addEventListener("mousemove", onMove, false);
  window.addEventListener("mouseleave", onLeave, false);
  var themeObserver = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var attr = mutations[i].attributeName;
      if (attr === "data-theme" || attr === "data-theme-setting" || attr === "data-theme-variant") {
        resize();
        lastTime = performance.now();
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
  requestAnimationFrame(monitorResize);
  requestAnimationFrame(step);
})();
