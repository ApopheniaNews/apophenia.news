import path from "node:path";

export const ROOT = process.cwd();
export const SRC = path.join(ROOT, "src");
export const PUBLIC = path.join(ROOT, "public");
export const UNLISTED_PATH = path.join(ROOT, "unlisted.txt");
export const ARTICLES_GLOB = "articles/**/index.md";
export const ISSUES_GLOB = "newsletter/issue-*/index.html";
export const SITE_URL = (process.env.SITE_URL || "https://apophenia.news").replace(/\/+$/, "");
// Public site key of the "newsletter" Turnstile widget (secret lives on newsletter.planetrenox.com)
export const TURNSTILE_SITE_KEY = "0x4AAAAAAFG4HWETOcDDQ5vg";

export const AUTHOR_PAGES = [
  {
    slug: "renox",
    name: "Renox",
    bio: "Renox is the founder of apophenia.news.",
    contact: "planetrenox@pm.me",
    image: ""
  }
];
