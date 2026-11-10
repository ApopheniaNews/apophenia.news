import fs from "node:fs/promises";
import path from "node:path";
import { PUBLIC, SRC } from "./constants.mjs";
import { renderRobots, renderRss, renderSitemap } from "./renderers.mjs";

export const ensureCleanGenerated = async () => {
  await fs.mkdir(SRC, { recursive: true });
  const children = await fs.readdir(SRC, { withFileTypes: true });
  const keep = new Set(["assets"]);
  await Promise.all(
    children
      .filter((d) => d.isDirectory() && !keep.has(d.name))
      .map((d) => fs.rm(path.join(SRC, d.name), { recursive: true, force: true }))
  );
};

export const writePage = async (parts, html) => {
  const filePath = path.join(...parts);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, html, "utf8");
};

export const writeDiscoveryFiles = async (articles, authors, issues) => {
  await fs.mkdir(PUBLIC, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(PUBLIC, "rss.xml"), renderRss(articles), "utf8"),
    fs.writeFile(path.join(PUBLIC, "sitemap.xml"), renderSitemap(articles, authors, issues), "utf8"),
    fs.writeFile(path.join(PUBLIC, "robots.txt"), renderRobots(), "utf8")
  ]);
};
