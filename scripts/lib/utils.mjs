export const fmtDate = (date) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export const toISODate = (d) => new Date(d).toISOString().split("T")[0];

export const toISO = (d) => new Date(d).toISOString();

export const escapeHtml = (s = "") =>
  String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

export const escapeXml = (s = "") =>
  String(s ?? "").replace(/[<>&'"]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[ch]));

export const fixInternalLinks = (html) =>
  html
    .replace(/href="\.\//g, 'href="/')
    .replace(/href="([^"]+)"(?=[^>]*>)/g, (_, href) =>
      href.startsWith("http") || href.startsWith("#") || href.endsWith("/") || href.endsWith(".md")
        ? `href="${href}"`
        : `href="${href}/"`
    );

export const renderAuthorInline = (author = "Apophenia") => {
  const src = String(author || "Apophenia");
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let out = "";
  let last = 0;
  let match;

  while ((match = re.exec(src))) {
    out += escapeHtml(src.slice(last, match.index));
    const text = escapeHtml(match[1].trim());
    const href = match[2].trim();
    const safeHref = /^(https?:\/\/|\/)/.test(href) ? href : "#";
    const normalized = safeHref === "#" || safeHref.endsWith("/") || safeHref.startsWith("http") ? safeHref : `${safeHref}/`;
    out += `<a href="${escapeHtml(normalized)}">${text}</a>`;
    last = re.lastIndex;
  }

  out += escapeHtml(src.slice(last));
  return out;
};
