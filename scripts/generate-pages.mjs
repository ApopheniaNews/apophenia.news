import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import { marked } from "marked";
import markedKatex from "marked-katex-extension";
import { ARTICLES_GLOB, AUTHOR_PAGES, ISSUES_GLOB, ROOT, SRC, UNLISTED_PATH } from "./lib/constants.mjs";
import { fixInternalLinks } from "./lib/utils.mjs";
import { renderArticle, renderHome, renderWritePage, renderNewsletterPage, renderIssue, renderUnsubscribePage, renderAuthorPage, renderNotFound } from "./lib/renderers.mjs";
import { ensureCleanGenerated, writeDiscoveryFiles, writePage } from "./lib/io.mjs";

marked.use(markedKatex({ throwOnError: false, nonStandard: true }));
marked.setOptions({ breaks: true, gfm: true });

const getUnlistedSlugs = async () => {
  try {
    const raw = await fs.readFile(UNLISTED_PATH, "utf8");
    return new Set(raw.split("\n").map((s) => s.trim()).filter((s) => s && !s.startsWith("#")));
  } catch {
    return new Set();
  }
};

const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

// Cloudflare's build clones only the latest commit, which would date every article to the last push. So fetch the
// rest of the history first: commits and trees only, no file contents, which keeps it fast.
try {
  if (git("rev-parse", "--is-shallow-repository") === "true") git("fetch", "--unshallow", "--filter=blob:none", "--quiet");
} catch {
  console.warn("Could not fetch the git history: article modified dates will all be the latest commit.");
}

// When the article's folder was last committed, so editing an article (text or images) updates its modified date on
// its own. "" for an uncommitted article, which then counts as unmodified.
const lastCommit = (dir) => {
  try {
    const d = git("log", "-1", "--format=%aI", "--", dir);
    return d && new Date(d).toISOString();
  } catch {
    return "";
  }
};

// Each newsletter/issue-*/index.html is the email scripts/send-newsletter.mjs sends. It is also served as a web page
// at /newsletter/<dir>/ (see renderIssue) and listed on /newsletter/ newest first: title from its <title>, date from
// its folder name.
const getIssues = async () =>
  Promise.all(
    (await fg(ISSUES_GLOB, { cwd: ROOT })).sort().reverse().map(async (file) => {
      const html = await fs.readFile(path.join(ROOT, file), "utf8");
      const dir = file.split("/")[1];
      return { dir, html, title: html.match(/<title>([^<]*)<\/title>/i)?.[1].trim() || dir, date: dir.slice(6).replaceAll(".", "-") };
    })
  );

const copyArticleAssets = async (file, slug) => {
  const dir = path.dirname(file);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.name !== "index.md")
      .map((entry) =>
        fs.cp(path.join(dir, entry.name), path.join(SRC, slug, entry.name), {
          recursive: true,
          force: true
        })
      )
  );
};

const run = async () => {
  const [files, unlisted, issues] = await Promise.all([
    fg(ARTICLES_GLOB, { cwd: ROOT, absolute: true }),
    getUnlistedSlugs(),
    getIssues()
  ]);

  const articles = [];

  for (const file of files) {
    const md = await fs.readFile(file, "utf8");
    const { data, content } = matter(md);
    if (!data.slug) continue;

    articles.push({
      ...data,
      // "./img.webp" points at a file next to index.md, which gets copied to /<slug>/
      header_image: data.header_image?.replace(/^\.\//, `/${data.slug}/`),
      sourceFile: file,
      markdown: md,
      isUnlisted: unlisted.has(data.slug),
      modified: lastCommit(path.dirname(file)),
      html: fixInternalLinks(marked.parse(content))
    });
  }

  articles.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const listedArticles = articles.filter((a) => !a.isUnlisted);

  await ensureCleanGenerated();

  await writePage([SRC, "index.html"], renderHome(listedArticles));
  await writePage([SRC, "write", "index.html"], renderWritePage());
  await writePage([SRC, "newsletter", "index.html"], renderNewsletterPage(issues));
  for (const issue of issues) await writePage([SRC, "newsletter", issue.dir, "index.html"], renderIssue(issue));
  await writePage([SRC, "newsletter", "unsubscribe.html"], renderUnsubscribePage());
  await writePage([SRC, "404.html"], renderNotFound());

  for (const author of AUTHOR_PAGES) {
    await writePage([SRC, "author", author.slug, "index.html"], renderAuthorPage(author));
  }

  for (const article of articles) {
    await writePage([SRC, article.slug, "index.html"], renderArticle(article));
    await copyArticleAssets(article.sourceFile, article.slug);
  }

  await writeDiscoveryFiles(listedArticles, AUTHOR_PAGES, issues);

  console.log(`Generated ${articles.length} article pages (${listedArticles.length} listed) + home + write + newsletter (${issues.length} issues) + unsubscribe + author pages + 404 + rss/sitemap/robots.`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
