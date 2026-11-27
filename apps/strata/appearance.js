// Match the main site's stored appearance when both apps share an origin.
(() => {
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  let choice = read("theme") || read("trinity-appearance") || "light";
  function apply() {
    const dark = choice === "dark" || (choice === "system" && media.matches);
    root.dataset.theme = dark ? "dark" : "light";
    root.dataset.variant = read("theme-variant") === "binary" ? "binary" : "modus";
    document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue("--paper").trim();
    const button = document.getElementById("appearance");
    if (button) {
      button.setAttribute("aria-pressed", String(dark));
      button.title = dark ? "Use light appearance" : "Use dark appearance";
    }
  }
  apply();
  document.addEventListener("DOMContentLoaded", () => {
    apply();
    document.getElementById("appearance").onclick = () => {
      choice = root.dataset.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", choice);
        localStorage.setItem("theme-user-override", "true");
      } catch {}
      apply();
    };
  });
  media.addEventListener("change", apply);
  window.addEventListener("storage", (e) => {
    if (e.key === "theme" || e.key === "theme-variant" || e.key === null) {
      choice = read("theme") || "light";
      apply();
    }
  });
})();
