(function () {
  const canvas = document.getElementById("binary-bg");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const glyphs = ["0", "1"];
  const cellSize = 18;
  const fadeFactor = 0.9;
  const randomFlashChance = 0.003;
  const waveInterval = 4500;
  const waveGrowth = 260;
  const mousePulseStrength = 1.6;

  let cols = 0;
  let rows = 0;
  let cells = [];
  let lastTime = performance.now();
  let waveNext = performance.now() + waveInterval;
  let mouse = { x: 0, y: 0, dirty: false };

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
    cells = new Array(cols * rows).fill(null).map((_, idx) => {
      const x = idx % cols;
      const y = Math.floor(idx / cols);
      return {
        glyph: glyphs[Math.random() > 0.5 ? 1 : 0],
        alpha: Math.random() * 0.4,
        color: "fg",
        cx: x * cellSize + cellSize / 2,
        cy: y * cellSize + cellSize / 2,
      };
    });
  };

  const pulseAt = (px, py, strength, tint) => {
    const radius = cellSize * 2.4 * strength;
    const radiusSq = radius * radius;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const dx = cell.cx - px;
      const dy = cell.cy - py;
      const distSq = dx * dx + dy * dy;
      if (distSq > radiusSq) continue;
      const falloff = 1 - distSq / radiusSq;
      cell.alpha = Math.min(1, cell.alpha + falloff);
      cell.color = tint || "accent";
      cell.glyph = glyphs[Math.random() > 0.5 ? 1 : 0];
    }
  };

  const step = (now) => {
    const { bg, fg, accent } = getColors();
    const dt = now - lastTime;
    lastTime = now;
    ctx.fillStyle = bg || "#000";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    const decay = Math.pow(fadeFactor, dt / 16.67);
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      cell.alpha *= decay;
      if (cell.alpha < 0.02) continue;
      ctx.globalAlpha = cell.alpha;
      ctx.fillStyle = cell.color === "accent" ? accent : fg;
      ctx.font = `${cellSize - 4}px "Times New Roman", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cell.glyph, cell.cx, cell.cy);
    }
    ctx.globalAlpha = 1;

    if (Math.random() < randomFlashChance) {
      const target = cells[Math.floor(Math.random() * cells.length)];
      if (target) {
        target.alpha = 1;
        target.color = "accent";
      }
    }

    if (now >= waveNext) {
      const px = Math.random() * canvas.width / dpr;
      const py = Math.random() * canvas.height / dpr;
      const steps = Math.max(6, Math.min(cols, rows));
      for (let r = 0; r < steps; r++) {
        setTimeout(() => pulseAt(px, py, (r + 1) / steps, "accent"), r * 28);
      }
      waveNext = now + waveInterval + Math.random() * 1800;
    }

    if (mouse.dirty) {
      pulseAt(mouse.x, mouse.y, mousePulseStrength, "accent");
      mouse.dirty = false;
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
