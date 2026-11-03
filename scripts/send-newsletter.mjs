// Sends newsletter/<ISSUE>/index.html to every active subscriber of POOL via Resend batch API.
// Subject = the HTML <title>. {{{EMAIL}}} in the HTML becomes the recipient's (URL-encoded) address.
// Logs never contain subscriber emails: this repo (and its Actions logs) is public.
import fs from "node:fs/promises";
import path from "node:path";

const { ISSUE = "", POOL, RESEND_API_KEY, NEWSLETTER_SEND_KEY, NEWSLETTER_FROM, SUBJECT_PREFIX = "", DRY_RUN } = process.env;
const RUN_ID = process.env.GITHUB_RUN_ID || Date.now();
const LIST_URL = "https://newsletter.planetrenox.com/api/list";
const UNSUB_URL = "https://newsletter.planetrenox.com/api/unsub";
const BATCH_SIZE = 100; // Resend max emails per batch request
const GAP_MS = 200; // 5 req/s, half of Resend's 10 req/s team limit (shared by all keys)
const MAX_TRIES = 5;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const scrub = (s) => String(s).replace(/[^\s@<>"']+@[^\s@<>"']+/g, "<email>");
const die = (msg) => {
  console.error(`✖ ${scrub(msg)}`);
  process.exit(1);
};

if (!/^\w[\w.-]*$/.test(ISSUE)) die(`Invalid issue dir "${ISSUE}"`);
for (const [k, v] of Object.entries({ POOL, RESEND_API_KEY, NEWSLETTER_SEND_KEY, NEWSLETTER_FROM })) if (!v) die(`${k} is not set`);

const file = path.join("newsletter", ISSUE, "index.html");
const html = await fs.readFile(file, "utf8").catch(() => die(`${file} not found`));
// The <title> is HTML but the subject is plain text: decode entities so "&amp;" doesn't show up literally
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" };
const decode = (s) =>
  s.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (m, c) =>
    c[0] === "#" ? String.fromCodePoint(/^#x/i.test(c) ? parseInt(c.slice(2), 16) : +c.slice(1)) : ENTITIES[c.toLowerCase()] ?? m
  );
const title = decode(html.match(/<title>([^<]+)<\/title>/i)?.[1].trim() || die(`${file} has no <title> (used as subject)`));
const subject = SUBJECT_PREFIX + title;
const from = `Apophenia News <${NEWSLETTER_FROM}>`;

const res = await fetch(`${LIST_URL}?pool=${encodeURIComponent(POOL)}`, { headers: { "X-Send-Key": NEWSLETTER_SEND_KEY } });
const { emails = [], error } = await res.json().catch(() => ({}));
if (!res.ok) die(`List fetch failed (${res.status}): ${error || "bad response"}`);
if (!emails.length) die(`Pool "${POOL}" has no active subscribers`);

const toMail = (to) => {
  const e = encodeURIComponent(to);
  return {
    from,
    to,
    subject,
    html: html.replaceAll("{{{EMAIL}}}", e),
    // One-click unsubscribe (RFC 8058): mail clients POST here, GET shows a confirmation page
    headers: {
      "List-Unsubscribe": `<${UNSUB_URL}?pool=${encodeURIComponent(POOL)}&email=${e}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
    }
  };
};

const batches = [];
for (let i = 0; i < emails.length; i += BATCH_SIZE) batches.push(emails.slice(i, i + BATCH_SIZE).map(toMail));
console.log(`Issue ${ISSUE} | "${subject}" | from ${from} | pool "${POOL}": ${emails.length} recipients in ${batches.length} batch(es)`);
if (DRY_RUN) {
  console.log("DRY_RUN set, nothing sent.");
  process.exit(0);
}

// Idempotency key is stable across "Re-run failed jobs" (same run id), so a re-run
// skips batches Resend already accepted (within 24h) and resumes where it failed.
const sendBatch = async (batch, i) => {
  for (let attempt = 1; ; attempt++) {
    const r = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `newsletter/${ISSUE}/${POOL}/${RUN_ID}/${i}`
      },
      body: JSON.stringify(batch)
    });
    const body = await r.json().catch(() => ({}));
    if (r.ok) {
      // Out of requests in this window: wait for the reset before the next batch
      if (r.headers.get("ratelimit-remaining") === "0") await sleep((+r.headers.get("ratelimit-reset") || 1) * 1000);
      return body.data || [];
    }
    // Only per-second rate limits and server errors are worth retrying; quota 429s are not
    const retryable = (r.status === 429 && body.name === "rate_limit_exceeded") || r.status >= 500 || body.name === "concurrent_idempotent_requests";
    if (!retryable || attempt >= MAX_TRIES)
      die(`Batch ${i + 1}/${batches.length} failed (${r.status} ${body.name || ""}): ${body.message || "no message"}. ${i * BATCH_SIZE} of ${emails.length} sent before this; "Re-run failed jobs" resumes without duplicates.`);
    const wait = (+r.headers.get("retry-after") || 2 ** attempt) * 1000;
    console.warn(`… batch ${i + 1} got ${r.status} ${body.name || ""}, retrying in ${wait / 1000}s`);
    await sleep(wait);
  }
};

let sent = 0;
for (const [i, batch] of batches.entries()) {
  if (i) await sleep(GAP_MS);
  const ids = await sendBatch(batch, i);
  sent += batch.length;
  console.log(`✔ Batch ${i + 1}/${batches.length}: ${batch.length} emails accepted (${ids.length} ids)`);
}

const summary = `Sent **${subject}** (\`${ISSUE}\`) to **${sent}** subscribers of pool \`${POOL}\` in ${batches.length} batch(es).`;
console.log(summary.replace(/[*`]/g, ""));
if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
