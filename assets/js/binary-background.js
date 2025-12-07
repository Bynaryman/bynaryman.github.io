(function () {
  const canvas = document.getElementById("binary-bg");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const glyphs = ["0", "1"];
  const cellSize = 18;
  const fadeFactor = 0.94; // slower fade for visible trails
  const randomFlashChance = 0.003;
  const waveInterval = 4500;
  const mousePulseStrength = 1.05; // tighter circle
  const driftSpeed = { x: 8, y: -4 }; // px per second
  const rotateMax = 0; // rotation disabled
  const baseAlpha = 0.1;
  const swapInterval = 180; // ms between neighbor swaps

  let cols = 0;
  let rows = 0;
  let cells = [];
  let lastTime = performance.now();
  let waveNext = performance.now() + waveInterval;
  let mouse = { x: 0, y: 0, dirty: false };
  let mouseTrailCount = 0;
  let mouseNextTrail = 0;
  let drift = { x: 0, y: 0 };
  let nextSwap = performance.now() + swapInterval;
  let wrapW = 0;
  let wrapH = 0;

  const getColors = () => {
    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue("--binary-bg-color").trim() || "#000";
    const fg = styles.getPropertyValue("--binary-digit-color").trim() || "#fff";
    const accent = styles.getPropertyValue("--binary-accent-color").trim() || fg;
    return { bg, fg, accent };
  };

  const resize = () => {
    const { innerWidth: w, innerHeight: h } = window;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    cols = Math.ceil(w / cellSize);
    rows = Math.ceil(h / cellSize);
    wrapW = cols * cellSize;
    wrapH = rows * cellSize;
    cells = new Array(cols * rows).fill(null).map((_, idx) => {
      const x = idx % cols;
      const y = Math.floor(idx / cols);
      return {
        glyph: glyphs[Math.random() > 0.5 ? 1 : 0],
        alpha: baseAlpha + Math.random() * 0.25,
        color: "fg",
        cx: x * cellSize + cellSize / 2,
        cy: y * cellSize + cellSize / 2,
      };
    });
  };

  const pulseAt = (px, py, strength, tint) => {
    const radius = cellSize * 1.6 * strength;
    const radiusSq = radius * radius;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      let dx = Math.abs(cell.cx - px);
      let dy = Math.abs(cell.cy - py);
      if (wrapW > 0) dx = Math.min(dx, wrapW - dx);
      if (wrapH > 0) dy = Math.min(dy, wrapH - dy);
      const distSq = dx * dx + dy * dy;
      if (distSq > radiusSq) continue;
      const falloff = 1 - distSq / radiusSq;
      cell.alpha = Math.min(1, cell.alpha + falloff);
      cell.color = tint || "accent";
    }
  };

  const step = (now) => {
    const { bg, fg, accent } = getColors();
    const dt = now - lastTime;
    lastTime = now;
    const viewW = canvas.width / dpr;
    const viewH = canvas.height / dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = bg || "#000";
    ctx.fillRect(0, 0, viewW, viewH);

    drift.x += (driftSpeed.x * dt) / 1000;
    drift.y += (driftSpeed.y * dt) / 1000;
    const angle = Math.sin(now * 0.00025) * rotateMax;

    ctx.save();
    ctx.translate(viewW / 2, viewH / 2);
    ctx.rotate(angle);
    ctx.translate(-viewW / 2, -viewH / 2);

    const decay = Math.pow(fadeFactor, dt / 16.67);
    const offX = ((drift.x % wrapW) + wrapW) % wrapW;
    const offY = ((drift.y % wrapH) + wrapH) % wrapH;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      cell.alpha = Math.max(baseAlpha, cell.alpha * decay);
      if (cell.alpha < 0.02) continue;
      let px = cell.cx + offX;
      let py = cell.cy + offY;
      if (px > wrapW) px -= wrapW;
      if (py > wrapH) py -= wrapH;
      if (px < -cellSize || py < -cellSize || px > viewW + cellSize || py > viewH + cellSize) continue;
      ctx.globalAlpha = cell.alpha;
      ctx.fillStyle = cell.color === "accent" ? accent : fg;
      ctx.font = `${cellSize - 4}px "Times New Roman", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cell.glyph, px, py);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (Math.random() < randomFlashChance) {
      const target = cells[Math.floor(Math.random() * cells.length)];
      if (target) {
        target.alpha = Math.max(target.alpha, 0.5);
        target.color = "fg";
      }
    }

    if (now >= nextSwap) {
      const idx = Math.floor(Math.random() * cells.length);
      const cell = cells[idx];
      const dir = Math.random() > 0.5 ? 1 : -1;
      const neighborIdx = idx + dir * (Math.random() > 0.5 ? 1 : cols);
      if (neighborIdx >= 0 && neighborIdx < cells.length) {
        const n = cells[neighborIdx];
        const tmp = cell.glyph;
        cell.glyph = n.glyph;
        n.glyph = tmp;
        cell.alpha = Math.min(0.4, cell.alpha + 0.08);
        n.alpha = Math.min(0.4, n.alpha + 0.08);
      }
      nextSwap = now + swapInterval + Math.random() * 120;
    }

    if (now >= waveNext) {
      const px = Math.random() * wrapW;
      const py = Math.random() * wrapH;
      const steps = 4;
      for (let r = 0; r < steps; r++) {
        setTimeout(() => pulseAt(px, py, 0.6 + (r * 0.25), "accent"), r * 36);
      }
      waveNext = now + waveInterval + Math.random() * 1800;
    }

    if (mouse.dirty) {
      const gridX = ((mouse.x - offX) % wrapW + wrapW) % wrapW;
      const gridY = ((mouse.y - offY) % wrapH + wrapH) % wrapH;
      pulseAt(gridX, gridY, mousePulseStrength, "fg");
      mouseTrailCount = 4;
      mouseNextTrail = now + 45;
      mouse.dirty = false;
    }

    if (mouseTrailCount > 0 && now >= mouseNextTrail) {
      const factor = 0.75 * (mouseTrailCount / 4);
      const gridX = ((mouse.x - offX) % wrapW + wrapW) % wrapW;
      const gridY = ((mouse.y - offY) % wrapH + wrapH) % wrapH;
      pulseAt(gridX, gridY, mousePulseStrength * factor, "fg");
      mouseTrailCount -= 1;
      mouseNextTrail = now + 45;
    }

    requestAnimationFrame(step);
  };

  const onMove = (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.dirty = true;
  };

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("mousemove", onMove, { passive: true });
  resize();
  requestAnimationFrame(step);
})();
