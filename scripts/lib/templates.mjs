import { SITE_URL } from "./constants.mjs";
import { escapeHtml } from "./utils.mjs";

const STORE_URL = "https://store.apophenia.news";
const PRODUCT_URL = `${STORE_URL}/products/pattern-seeker`;

const logo = `
<svg class="h-10 w-10 brand-glow" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Apophenia News logo">
  <defs>
    <linearGradient id="ap-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#0ea5e9"/>
    </linearGradient>
  </defs>
  <rect x="6" y="6" width="108" height="108" rx="28" fill="#ffffff" stroke="url(#ap-grad)" stroke-width="8"/>
  <circle cx="36" cy="36" r="8" fill="#4f46e5"/>
  <circle cx="84" cy="36" r="8" fill="#0ea5e9"/>
  <circle cx="36" cy="84" r="8" fill="#0ea5e9"/>
  <circle cx="84" cy="84" r="8" fill="#4f46e5"/>
  <path d="M36 36L84 84M84 36L36 84M36 36H84M36 84H84" stroke="#111827" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>
  <circle cx="60" cy="60" r="10" fill="#111827"/>
</svg>`;

const links = [
  { href: "/", label: "Home" },
  { href: "/newsletter/", label: "Newsletter" },
  { href: STORE_URL, label: "Store", external: true },
  { href: "/write/", label: "Become a writer" },
  { href: "/rss.xml", label: "RSS" }
];

const navLinks = (cls = "") =>
  links
    .map(
      (l) =>
        `<a ${cls ? `class="${cls}" ` : ""}href="${l.href}"${l.external ? ` target="_blank" rel="noopener"` : ""}>${l.label}</a>`
    )
    .join("\n      ");

const merchShots = [
  { src: "/merch/apophenia_hoodie_front.avif", alt: "Pattern Seeker zip hoodie — chest mark", origin: "61%_29%", zoom: "2.4" },
  { src: "/merch/apophenia_hoodie_back.webp", alt: "Pattern Seeker zip hoodie — constellation back print", origin: "50%_38%", zoom: "2.1" }
];

export const merch = `
<section class="mt-10 card overflow-hidden bg-gradient-to-b from-white to-indigo-50/60">
  <div class="p-6 sm:p-8 grid sm:grid-cols-[1fr,340px] gap-8 items-center">
    <div>
      <p class="tag mb-3"><i data-lucide="shopping-bag" class="h-3.5 w-3.5"></i>Merch</p>
      <h2 class="text-2xl sm:text-3xl font-bold leading-tight">Wear the pattern</h2>
      <p class="mt-3 text-zinc-700 max-w-md">
        The <strong>Pattern Seeker</strong> heavy-blend zip hoodie — constellation print across the back, quiet mark on the chest.
      </p>
      <a href="${PRODUCT_URL}" target="_blank" rel="noopener"
         class="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700">
        Shop the hoodie <i data-lucide="arrow-up-right" class="h-4 w-4"></i>
      </a>
      <p class="mt-3 text-xs text-zinc-500 hidden sm:block">Hover a shot to zoom the print.</p>
    </div>
    <div class="grid grid-cols-2 gap-3">
      ${merchShots
        .map(
          (m) => `<a href="${PRODUCT_URL}" target="_blank" rel="noopener" aria-label="${escapeHtml(m.alt)}"
        class="block overflow-hidden rounded-xl bg-white/40">
        <img src="${m.src}" alt="${escapeHtml(m.alt)}" loading="lazy" decoding="async"
             class="w-full origin-[${m.origin}] transition-transform duration-500 ease-out hover:scale-[${m.zoom}]" />
      </a>`
        )
        .join("\n      ")}
    </div>
  </div>
</section>
`;

// Favicon and analytics: every page gets these, including the web versions of newsletter issues
export const siteHead = `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <script data-goatcounter="https://apophenia.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>`;

export const shellHead = ({ title, desc, image, url, type = "website", noindex = false, published, modified, jsonLd }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${escapeHtml(desc || "")}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc || "")}" />
  <meta property="og:type" content="${type}" />
  ${url ? `<meta property="og:url" content="${url}" />` : ""}
  ${image ? `<meta property="og:image" content="${image}" />` : ""}
  <meta name="theme-color" content="#fcfcfa" />
  <meta name="robots" content="${noindex ? "noindex" : "max-image-preview:large"}" />
  ${published ? `<meta property="article:published_time" content="${published}" />` : ""}
  ${modified ? `<meta property="article:modified_time" content="${modified}" />` : ""}
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : ""}
  ${url ? `<link rel="canonical" href="${url}" />` : ""}
  ${siteHead}
  <link rel="alternate" type="application/rss+xml" title="apophenia.news RSS" href="${SITE_URL}/rss.xml" />
  <script type="module" src="/main.js"></script>
</head>
<body>
`;

export const nav = `
<header class="sticky top-0 z-40 border-b border-zinc-200/80 bg-paper/95 backdrop-blur">
  <div class="shell py-3 flex items-center justify-between gap-4" x-data="{open:false}">
    <a href="/" class="inline-flex items-center gap-3">
      ${logo}
      <div>
        <p class="text-lg leading-none font-bold">apophenia.news</p>
        <p class="text-xs text-zinc-500">for pattern seekers</p>
      </div>
    </a>
    <button class="sm:hidden p-2 rounded-lg border border-zinc-200 bg-white" @click="open=!open" aria-label="Toggle menu">
      <i data-lucide="menu" class="h-4 w-4"></i>
    </button>
    <nav class="hidden sm:flex items-center gap-6 text-sm">
      ${navLinks()}
    </nav>
    <nav class="sm:hidden absolute left-4 right-4 top-[70px] card p-3" x-show="open" x-transition>
      ${navLinks("block py-1.5")}
    </nav>
  </div>
</header>
`;

export const footer = `
<footer class="mt-16 border-t border-zinc-200 bg-white/70">
  <div class="shell py-8 text-sm text-zinc-600 flex flex-col sm:flex-row justify-between gap-2">
    <p>Apophenia News — finding patterns in the noise since 2026</p>
    <p><a href="https://youtube.com/@ApopheniaLoop" target="_blank" rel="noopener" class="hover:text-zinc-900 hover:underline">YouTube</a> · © ${new Date().getFullYear()} apophenia.news</p>
  </div>
</footer>
</body>
</html>`;
