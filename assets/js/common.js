$(document).ready(function () {
  document.querySelectorAll(".publications button[aria-controls]").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = button.closest(".links").parentElement;
      const expanded = button.getAttribute("aria-expanded") !== "true";
      entry.querySelectorAll("button[aria-controls]").forEach((other) => {
        const panel = document.getElementById(other.getAttribute("aria-controls"));
        const open = other === button && expanded;
        other.setAttribute("aria-expanded", String(open));
        if (panel) {
          panel.classList.toggle("open", open);
          panel.hidden = !open;
        }
      });
    });
  });
  document.querySelectorAll("button.more-authors").forEach((button) => {
    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(expanded));
      button.textContent = expanded ? button.dataset.full : button.dataset.short;
    });
  });

  // bootstrap-toc
  if ($("#toc-sidebar").length) {
    // remove related publications years from the TOC
    $(".publications h2").each(function () {
      $(this).attr("data-toc-skip", "");
    });
    var navSelector = "#toc-sidebar";
    var $myNav = $(navSelector);
    Toc.init($myNav);
    $("body").scrollspy({
      target: navSelector,
    });
  }

  // add css to jupyter notebooks
  const cssLink = document.createElement("link");
  cssLink.href = "../css/jupyter.css";
  cssLink.rel = "stylesheet";
  cssLink.type = "text/css";

  let theme = determineComputedTheme();

  $(".jupyter-notebook-iframe-container iframe").each(function () {
    $(this).contents().find("head").append(cssLink);

    if (theme == "dark") {
      $(this).bind("load", function () {
        $(this).contents().find("body").attr({
          "data-jp-theme-light": "false",
          "data-jp-theme-name": "JupyterLab Dark",
        });
      });
    }
  });
});
