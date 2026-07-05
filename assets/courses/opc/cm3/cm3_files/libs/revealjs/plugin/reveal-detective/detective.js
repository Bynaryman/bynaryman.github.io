window.RevealDetective = function () {
  return {
    id: "RevealDetective",
    init: function (deck) {
      const runDetective = function () {
        const dectectiveBlocks = document.querySelectorAll(".detective");

        const escapeRegExp = (text) =>
          text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const highlightTextNode = (node, regex, bgColor, codeColor) => {
          const text = node.nodeValue;
          const matches = [...text.matchAll(regex)];
          if (matches.length === 0) return;

          const fragment = document.createDocumentFragment();
          let cursor = 0;

          matches.forEach((match) => {
            const start = match.index;
            const value = match[0];

            if (start > cursor) {
              fragment.appendChild(document.createTextNode(text.slice(cursor, start)));
            }

            const marker = document.createElement("span");
            marker.style.backgroundColor = bgColor;
            marker.style.color = codeColor;
            marker.textContent = value;
            fragment.appendChild(marker);

            cursor = start + value.length;
          });

          if (cursor < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(cursor)));
          }

          node.parentNode.replaceChild(fragment, node);
        };

        dectectiveBlocks.forEach((block) => {
          const detectedWords = block.getAttribute("data-detective-search");
          const detectedColor =
            block.getAttribute("data-detective-bg-color") || "yellow";
          const detectedCodeColor =
            block.getAttribute("data-detective-code-color") || "black";

          if (!detectedWords) return;
          const wordsArray = detectedWords
            .split(",")
            .map((word) => word.trim())
            .filter(Boolean)
            .sort((a, b) => b.length - a.length)
            .map(escapeRegExp);

          const pre =
            block.querySelector("pre.sourceCode") ||
            block.querySelector("pre code")?.closest("pre") ||
            block.querySelector("pre");
          if (!pre || wordsArray.length === 0) return;

          const regex = new RegExp(wordsArray.join("|"), "g");
          const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
          const textNodes = [];

          while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
          }

          textNodes.forEach((node) =>
            highlightTextNode(node, regex, detectedColor, detectedCodeColor)
          );
        });
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", runDetective);
      } else {
        runDetective();
      }
    },
  };
};
