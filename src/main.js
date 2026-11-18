import Alpine from "alpinejs";
import { createIcons, icons } from "lucide";
import "./styles.css";
import "./read-aloud.js";

window.Alpine = Alpine;
Alpine.start();

const bootIcons = () => createIcons({ icons });

const copyArticleButton = document.querySelector("[data-copy-article]");
if (copyArticleButton) {
  let resetTimer;
  copyArticleButton.addEventListener("click", async () => {
    const label = copyArticleButton.querySelector("span");
    clearTimeout(resetTimer);
    try {
      await navigator.clipboard.writeText(JSON.parse(document.querySelector("#article-markdown").textContent));
      label.textContent = "Copied!";
    } catch {
      label.textContent = "Copy failed";
    }
    resetTimer = setTimeout(() => (label.textContent = "Copy article"), 2500);
  });
}

// Figures in an article (tikz, mermaid, dot...) arrive as their source and are drawn here, in the browser
if (document.querySelector(".mlp-pending")) import("markdown-it-latex-plus").then((m) => m.hydrate());

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootIcons);
} else {
  bootIcons();
}
