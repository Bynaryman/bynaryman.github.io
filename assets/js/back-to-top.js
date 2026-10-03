(() => {
  const button = document.getElementById("back-to-top");
  if (!button) return;

  const footer = document.querySelector("footer");
  let scheduled = false;

  function update() {
    // Keep the control above the footer, including when its contents wrap.
    const overlap = footer ? Math.max(0, window.innerHeight - footer.getBoundingClientRect().top) : 0;
    button.style.setProperty("--back-to-top-offset", `${overlap + 20}px`);
    button.hidden = window.scrollY < 300;
    scheduled = false;
  }

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  }

  button.addEventListener("click", () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" });
    document.getElementById("main-content")?.focus({ preventScroll: true });
  });
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("pageshow", scheduleUpdate);
  update();
})();
