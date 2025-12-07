(function () {
  var canvas = document.getElementById("binary-bg");
  if (!canvas || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;

  var ctx = canvas.getContext("2d");
  var dpr = Math.max(1, window.devicePixelRatio || 1);
  var glyphs = ["0", "1"];
  var cellSize = 18;
  var fadeFactor = 0.94;
  var randomFlashChance = 0.003;
  var waveInterval = 4500;
  var mousePulseStrength = 1.05;
  var driftSpeed = { x: 8, y: -4 };
  var rotateMax = 0;
  var baseAlpha = 0.08;
  var swapInterval = 180;
  var colorShiftInterval = 260;
  var snapToPixel = true;
  var heightCheckInterval = 500;

  var cols = 0;
  var rows = 0;
  var cells = [];
  var lastTime = performance.now();
  var waveNext = performance.now() + waveInterval;
  var mouse = { x: 0, y: 0, dirty: false };
  var mouseTrailCount = 0;
  var mouseNextTrail = 0;
  var drift = { x: 0, y: 0 };
  var nextSwap = performance.now() + swapInterval;
  var wrapW = 0;
  var wrapH = 0;
  var nextColorShift = performance.now() + colorShiftInterval;
  var nextHeightCheck = performance.now() + heightCheckInterval;

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

  function getColors() {
    var styles = getComputedStyle(document.documentElement);
    var bg = styles.getPropertyValue("--binary-bg-color").trim() || "#000";
    var fg = styles.getPropertyValue("--binary-digit-color").trim() || "#fff";
    var accent = styles.getPropertyValue("--binary-accent-color").trim() || fg;
    var shade1 = adjustHex(fg, 0.1);
    var shade2 = adjustHex(fg, -0.06);
    var shade3 = adjustHex(fg, -0.14);
    var palette = [fg, shade1, shade2, shade3, accent];
    return { bg: bg, fg: fg, accent: accent, palette: palette };
  }

  function pickColor(palette) {
    if (!palette || !palette.length) return "#fff";
    var roll = Math.random();
    if (roll > 0.95) return palette[4] || palette[0]; // accent, rare
    return palette[Math.floor(Math.random() * Math.min(4, palette.length))];
  }

  function resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var fullH = Math.max(document.documentElement.scrollHeight, h);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(fullH * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = fullH + "px";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.scale(dpr, dpr);
    cols = Math.ceil(w / cellSize);
    rows = Math.ceil(fullH / cellSize);
    wrapW = cols * cellSize;
    wrapH = rows * cellSize;
    var colors = getColors();
    cells = new Array(cols * rows);
    for (var idx = 0; idx < cells.length; idx++) {
      var x = idx % cols;
      var y = Math.floor(idx / cols);
      cells[idx] = {
        glyph: glyphs[Math.random() > 0.5 ? 1 : 0],
        alpha: baseAlpha + Math.random() * 0.25,
        color: pickColor(colors.palette),
        cx: x * cellSize + cellSize / 2,
        cy: y * cellSize + cellSize / 2
      };
    }
  }

  function pulseAt(px, py, strength, tint) {
    var radius = cellSize * 1.6 * strength;
    var radiusSq = radius * radius;
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      var dx = Math.abs(cell.cx - px);
      var dy = Math.abs(cell.cy - py);
      if (wrapW > 0) dx = Math.min(dx, wrapW - dx);
      if (wrapH > 0) dy = Math.min(dy, wrapH - dy);
      var distSq = dx * dx + dy * dy;
      if (distSq > radiusSq) continue;
      var falloff = 1 - distSq / radiusSq;
      cell.alpha = Math.min(1, cell.alpha + falloff);
      cell.color = tint || cell.color;
    }
  }

  function step(now) {
    var colors = getColors();
    var bg = colors.bg;
    var fg = colors.fg;
    var palette = colors.palette;

    var dt = now - lastTime;
    lastTime = now;
    var viewW = canvas.width / dpr;
    var viewH = canvas.height / dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = bg || "#000";
    ctx.fillRect(0, 0, viewW, viewH);

    drift.x += (driftSpeed.x * dt) / 1000;
    drift.y += (driftSpeed.y * dt) / 1000;
    var angle = Math.sin(now * 0.00025) * rotateMax;

    ctx.save();
    ctx.translate(viewW / 2, viewH / 2);
    ctx.rotate(angle);
    ctx.translate(-viewW / 2, -viewH / 2);

    var decay = Math.pow(fadeFactor, dt / 16.67);
    var offX = ((drift.x % wrapW) + wrapW) % wrapW;
    var offY = ((drift.y % wrapH) + wrapH) % wrapH;
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      cell.alpha = Math.max(baseAlpha, cell.alpha * decay);
      if (cell.alpha < 0.02) continue;
      var px = cell.cx + offX;
      var py = cell.cy + offY;
      if (px > wrapW) px -= wrapW;
      if (py > wrapH) py -= wrapH;
      if (px < -cellSize || py < -cellSize || px > viewW + cellSize || py > viewH + cellSize) continue;
      ctx.globalAlpha = cell.alpha;
      ctx.fillStyle = cell.color || fg;
      ctx.font = (cellSize - 4) + 'px "Times New Roman", serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      var drawX = snapToPixel ? Math.round(px) + 0.5 : px;
      var drawY = snapToPixel ? Math.round(py) + 0.5 : py;
      ctx.fillText(cell.glyph, drawX, drawY);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

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

    if (now >= waveNext) {
      var pxWave = Math.random() * wrapW;
      var pyWave = Math.random() * wrapH;
      var steps = 4;
      for (var r = 0; r < steps; r++) {
        (function (radiusStep) {
          setTimeout(function () {
            pulseAt(pxWave, pyWave, 0.6 + radiusStep * 0.25, pickColor(palette));
          }, radiusStep * 36);
        })(r);
      }
      waveNext = now + waveInterval + Math.random() * 1800;
    }

    if (mouse.dirty) {
      var gridX = ((mouse.x - offX) % wrapW + wrapW) % wrapW;
      var gridY = ((mouse.y - offY) % wrapH + wrapH) % wrapH;
      pulseAt(gridX, gridY, mousePulseStrength, pickColor(palette));
      mouseTrailCount = 4;
      mouseNextTrail = now + 45;
      mouse.dirty = false;
    }

    if (mouseTrailCount > 0 && now >= mouseNextTrail) {
      var factor = 0.75 * (mouseTrailCount / 4);
      var gridX2 = ((mouse.x - offX) % wrapW + wrapW) % wrapW;
      var gridY2 = ((mouse.y - offY) % wrapH + wrapH) % wrapH;
      pulseAt(gridX2, gridY2, mousePulseStrength * factor, pickColor(palette));
      mouseTrailCount -= 1;
      mouseNextTrail = now + 45;
    }

    if (now >= nextColorShift) {
      var targetShift = cells[Math.floor(Math.random() * cells.length)];
      if (targetShift) {
        targetShift.color = pickColor(palette);
        targetShift.alpha = Math.min(0.5, targetShift.alpha + 0.1);
      }
      nextColorShift = now + colorShiftInterval + Math.random() * 200;
    }

    if (now >= nextHeightCheck) {
      var fullHCheck = Math.max(document.documentElement.scrollHeight, window.innerHeight);
      if (canvas.height / dpr !== fullHCheck) {
        resize();
      }
      nextHeightCheck = now + heightCheckInterval;
    }

    requestAnimationFrame(step);
  }

  function onMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.dirty = true;
  }

  window.addEventListener("resize", resize, false);
  window.addEventListener("mousemove", onMove, false);
  resize();
  requestAnimationFrame(step);
})();
