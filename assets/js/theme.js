// Has to be in the head tag, otherwise a flicker effect will occur.

const DEFAULT_THEME_SETTING = "light";
const DEFAULT_THEME_VARIANT = "binary";
const THEME_DEFAULTS_VERSION = "2026-02-light-binary-default";
const THEME_DEFAULTS_VERSION_KEY = "theme-defaults-version";
const THEME_USER_OVERRIDE_KEY = "theme-user-override";

// One-time migration so first visit after deployment starts on light + binary.
let ensureInitialThemeDefaults = () => {
  let appliedVersion = localStorage.getItem(THEME_DEFAULTS_VERSION_KEY);
  if (appliedVersion === THEME_DEFAULTS_VERSION) return;

  localStorage.setItem("theme", DEFAULT_THEME_SETTING);
  localStorage.setItem("theme-variant", DEFAULT_THEME_VARIANT);
  localStorage.setItem(THEME_USER_OVERRIDE_KEY, "false");
  localStorage.setItem(THEME_DEFAULTS_VERSION_KEY, THEME_DEFAULTS_VERSION);
};

// Toggle between light and dark theme settings.
let toggleThemeSetting = () => {
  let themeSetting = determineThemeSetting();
  if (themeSetting == "dark") {
    setThemeSetting("light");
  } else {
    setThemeSetting("dark");
  }
};

// Change the theme setting and apply the theme.
let setThemeSetting = (themeSetting, userInitiated = true) => {
  localStorage.setItem("theme", themeSetting);
  localStorage.setItem(THEME_USER_OVERRIDE_KEY, userInitiated ? "true" : "false");

  document.documentElement.setAttribute("data-theme-setting", themeSetting);

  applyTheme();
};

let setThemeVariant = (themeVariant) => {
  localStorage.setItem("theme-variant", themeVariant);

  document.documentElement.setAttribute("data-theme-variant", themeVariant);

  applyTheme();
};

// Apply the computed dark or light theme to the website.
let applyTheme = () => {
  let theme = determineComputedTheme();
  let themeVariant = determineThemeVariant();

  document.documentElement.setAttribute("data-theme-variant", themeVariant);

  transTheme();
  setHighlight(theme);
  setGiscusTheme(theme);
  setSearchTheme(theme);

  // if mermaid is not defined, do nothing
  if (typeof mermaid !== "undefined") {
    setMermaidTheme(theme);
  }

  // if diff2html is not defined, do nothing
  if (typeof Diff2HtmlUI !== "undefined") {
    setDiff2htmlTheme(theme);
  }

  // if echarts is not defined, do nothing
  if (typeof echarts !== "undefined") {
    setEchartsTheme(theme);
  }

  // if vegaEmbed is not defined, do nothing
  if (typeof vegaEmbed !== "undefined") {
    setVegaLiteTheme(theme);
  }

  document.documentElement.setAttribute("data-theme", theme);

  // Add class to tables.
  let tables = document.getElementsByTagName("table");
  for (let i = 0; i < tables.length; i++) {
    if (theme == "dark") {
      tables[i].classList.add("table-dark");
    } else {
      tables[i].classList.remove("table-dark");
    }
  }

  // Set jupyter notebooks themes.
  let jupyterNotebooks = document.getElementsByClassName("jupyter-notebook-iframe-container");
  for (let i = 0; i < jupyterNotebooks.length; i++) {
    let bodyElement = jupyterNotebooks[i].getElementsByTagName("iframe")[0].contentWindow.document.body;
    if (theme == "dark") {
      bodyElement.setAttribute("data-jp-theme-light", "false");
      bodyElement.setAttribute("data-jp-theme-name", "JupyterLab Dark");
    } else {
      bodyElement.setAttribute("data-jp-theme-light", "true");
      bodyElement.setAttribute("data-jp-theme-name", "JupyterLab Light");
    }
  }

  // Updates the background of medium-zoom overlay.
  if (typeof medium_zoom !== "undefined") {
    medium_zoom.update({
      background: getComputedStyle(document.documentElement).getPropertyValue("--global-bg-color") + "ee", // + 'ee' for trasparency.
    });
  }

  updateThemeMenuState();
};

let setHighlight = (theme) => {
  if (theme == "dark") {
    document.getElementById("highlight_theme_light").media = "none";
    document.getElementById("highlight_theme_dark").media = "";
  } else {
    document.getElementById("highlight_theme_dark").media = "none";
    document.getElementById("highlight_theme_light").media = "";
  }
};

let setGiscusTheme = (theme) => {
  function sendMessage(message) {
    const iframe = document.querySelector("iframe.giscus-frame");
    if (!iframe) return;
    iframe.contentWindow.postMessage({ giscus: message }, "https://giscus.app");
  }

  sendMessage({
    setConfig: {
      theme: theme,
    },
  });
};

let addMermaidZoom = (records, observer) => {
  var svgs = d3.selectAll(".mermaid svg");
  svgs.each(function () {
    var svg = d3.select(this);
    svg.html("<g>" + svg.html() + "</g>");
    var inner = svg.select("g");
    var zoom = d3.zoom().on("zoom", function (event) {
      inner.attr("transform", event.transform);
    });
    svg.call(zoom);
  });
  observer.disconnect();
};

let setMermaidTheme = (theme) => {
  if (theme == "light") {
    // light theme name in mermaid is 'default'
    // https://mermaid.js.org/config/theming.html#available-themes
    theme = "default";
  }

  /* Re-render the SVG, based on https://github.com/cotes2020/jekyll-theme-chirpy/blob/master/_includes/mermaid.html */
  document.querySelectorAll(".mermaid").forEach((elem) => {
    // Get the code block content from previous element, since it is the mermaid code itself as defined in Markdown, but it is hidden
    let svgCode = elem.previousSibling.childNodes[0].innerHTML;
    elem.removeAttribute("data-processed");
    elem.innerHTML = svgCode;
  });

  mermaid.initialize({ theme: theme });
  window.mermaid.init(undefined, document.querySelectorAll(".mermaid"));

  const observable = document.querySelector(".mermaid svg");
  if (observable !== null) {
    var observer = new MutationObserver(addMermaidZoom);
    const observerOptions = { childList: true };
    observer.observe(observable, observerOptions);
  }
};

let setDiff2htmlTheme = (theme) => {
  document.querySelectorAll(".diff2html").forEach((elem) => {
    // Get the code block content from previous element, since it is the diff code itself as defined in Markdown, but it is hidden
    let textData = elem.previousSibling.childNodes[0].innerHTML;
    elem.innerHTML = "";
    const configuration = { colorScheme: theme, drawFileList: true, highlight: true, matching: "lines" };
    const diff2htmlUi = new Diff2HtmlUI(elem, textData, configuration);
    diff2htmlUi.draw();
  });
};

let setEchartsTheme = (theme) => {
  document.querySelectorAll(".echarts").forEach((elem) => {
    // Get the code block content from previous element, since it is the echarts code itself as defined in Markdown, but it is hidden
    let jsonData = elem.previousSibling.childNodes[0].innerHTML;
    echarts.dispose(elem);

    if (theme === "dark") {
      var chart = echarts.init(elem, "dark-fresh-cut");
    } else {
      var chart = echarts.init(elem);
    }

    chart.setOption(JSON.parse(jsonData));
  });
};

let setVegaLiteTheme = (theme) => {
  document.querySelectorAll(".vega-lite").forEach((elem) => {
    // Get the code block content from previous element, since it is the vega lite code itself as defined in Markdown, but it is hidden
    let jsonData = elem.previousSibling.childNodes[0].innerHTML;
    elem.innerHTML = "";
    if (theme === "dark") {
      vegaEmbed(elem, JSON.parse(jsonData), { theme: "dark" });
    } else {
      vegaEmbed(elem, JSON.parse(jsonData));
    }
  });
};

let setSearchTheme = (theme) => {
  const ninjaKeys = document.querySelector("ninja-keys");
  if (!ninjaKeys) return;

  if (theme === "dark") {
    ninjaKeys.classList.add("dark");
  } else {
    ninjaKeys.classList.remove("dark");
  }
};

let transTheme = () => {
  document.documentElement.classList.add("transition");
  window.setTimeout(() => {
    document.documentElement.classList.remove("transition");
  }, 500);
};

// Determine the expected state of the theme toggle, which can be "dark" or "light".
// Default is "light".
let determineThemeSetting = () => {
  let userOverride = localStorage.getItem(THEME_USER_OVERRIDE_KEY) === "true";
  if (!userOverride) {
    localStorage.setItem("theme", DEFAULT_THEME_SETTING);
    return DEFAULT_THEME_SETTING;
  }

  let themeSetting = localStorage.getItem("theme");
  if (themeSetting != "dark" && themeSetting != "light") {
    themeSetting = DEFAULT_THEME_SETTING;
    localStorage.setItem("theme", themeSetting);
  }
  return themeSetting;
};

let determineThemeVariant = () => {
  let themeVariant = localStorage.getItem("theme-variant");
  if (themeVariant != "binary" && themeVariant != "modus") {
    themeVariant = DEFAULT_THEME_VARIANT;
  }
  return themeVariant;
};

let updateThemeMenuState = () => {
  const themeSetting = determineThemeSetting();
  const themeVariant = determineThemeVariant();

  document.querySelectorAll("[data-theme-mode]").forEach((item) => {
    item.classList.toggle("active", item.dataset.themeMode === themeSetting);
    item.setAttribute("aria-checked", item.dataset.themeMode === themeSetting ? "true" : "false");
  });

  document.querySelectorAll("[data-theme-variant]").forEach((item) => {
    item.classList.toggle("active", item.dataset.themeVariant === themeVariant);
    item.setAttribute("aria-checked", item.dataset.themeVariant === themeVariant ? "true" : "false");
  });
};

// Determine the computed theme, which can be "dark" or "light".
let determineComputedTheme = () => {
  return determineThemeSetting();
};

let initTheme = () => {
  ensureInitialThemeDefaults();

  let themeSetting = determineThemeSetting();
  let themeVariant = determineThemeVariant();

  setThemeSetting(themeSetting, false);
  setThemeVariant(themeVariant);

  // Add event listener to the theme toggle button.
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-theme-mode]").forEach((item) => {
      item.addEventListener("click", function () {
        setThemeSetting(item.dataset.themeMode);
      });
    });

    document.querySelectorAll("[data-theme-variant]").forEach((item) => {
      item.addEventListener("click", function () {
        setThemeVariant(item.dataset.themeVariant);
      });
    });

    updateThemeMenuState();
  });

};
