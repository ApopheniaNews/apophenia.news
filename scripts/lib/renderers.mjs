import { SITE_URL, TURNSTILE_SITE_KEY } from "./constants.mjs";
import { footer, merch, nav, shellHead, siteHead } from "./templates.mjs";
import { escapeHtml, escapeXml, fmtDate, renderAuthorInline, toISO, toISODate } from "./utils.mjs";

// Structured data (JSON-LD) so Google reads the headline, image, dates and authors directly instead of guessing
const absUrl = (u = "") => (/^https?:\/\//.test(u) ? u : `${SITE_URL}/${u.replace(/^\/+/, "")}`);
const publisher = { "@type": "Organization", name: "apophenia.news", url: `${SITE_URL}/`, logo: `${SITE_URL}/favicon.svg` };

// Linked names in the byline (people with an author page) become Person authors. Unlinked co-authors are AI models,
// which schema.org has no type for, so they stay in the visible byline only.
const authorsLd = (author = "") => {
  const people = [...String(author).matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map(([, name, href]) => ({ "@type": "Person", name: name.trim(), url: absUrl(href.trim()) }));
  return people.length ? people : [publisher];
};

// Published is the frontmatter date. Modified is the article folder's last commit (see generate-pages.mjs), never
// earlier than published.
const articleDates = (a) => {
  const published = toISO(a.date);
  return { published, modified: a.modified > published ? a.modified : published };
};

const articleLd = (a, { published, modified }) => ({
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  headline: a.title,
  description: a.description,
  image: [absUrl(a.header_image)],
  datePublished: published,
  dateModified: modified,
  author: authorsLd(a.author),
  publisher,
  mainEntityOfPage: `${SITE_URL}/${a.slug}/`
});

const homeLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", name: "apophenia.news", url: `${SITE_URL}/` },
    { ...publisher, sameAs: ["https://youtube.com/@ApopheniaLoop"] }
  ]
};

export const renderHome = (articles) => `
${shellHead({
  title: "apophenia.news — The news outlet for pattern seekers",
  desc: "Signals, anomalies, civilization trajectories, and deep pattern analysis.",
  image: "https://free.direct-img.link/celestial+map?i=1",
  url: `${SITE_URL}/`,
  type: "website",
  jsonLd: homeLd
})}
${nav}
<main class="shell py-10">
  <section class="card p-6 sm:p-10 bg-linear-to-b from-white to-indigo-50/50">
    <p class="tag mb-3"><i data-lucide="sparkles" class="h-3.5 w-3.5"></i>Pattern Intelligence Journalism</p>
    <h1 class="font-hero text-4xl sm:text-5xl font-bold leading-tight sm:leading-none">The news outlet for pattern seekers</h1>
    <p class="mt-4 text-zinc-700 max-w-2xl">High-agency analysis at the intersection of AGI, consciousness, geopolitics, and first-contact logic.</p>
  </section>

  <section class="mt-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold">Latest Articles</h2>
      <span class="text-sm text-zinc-500">${articles.length} published</span>
    </div>

    <div class="grid md:grid-cols-2 gap-5">
      ${articles
        .map(
          (a) => `
      <article class="card overflow-hidden hover:-translate-y-0.5 transition">
        <img src="${a.header_image}" alt="${escapeHtml(a.title)}" class="h-48 w-full object-cover" />
        <div class="p-5">
          <p class="text-xs uppercase tracking-wide text-zinc-500">${fmtDate(a.date)}</p>
          <h3 class="mt-2 text-2xl font-semibold leading-tight">
            <a href="/${a.slug}/">${escapeHtml(a.title)}</a>
          </h3>
          <p class="mt-2 text-zinc-700">${escapeHtml(a.description || "")}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            ${(a.tags || []).slice(0, 4).map((t) => `<span class="tag">#${escapeHtml(t)}</span>`).join("")}
          </div>
          <a href="/${a.slug}/" class="inline-flex items-center gap-1 mt-5 text-sm font-medium">
            Read article <i data-lucide="arrow-right" class="h-4 w-4"></i>
          </a>
        </div>
      </article>`
        )
        .join("")}
    </div>
  </section>

  ${merch}
</main>
${footer}
`;

// The small buttons above an article's title: Listen, its speed, and Copy article
const toolBtn = "inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm font-medium text-zinc-800 shadow-xs transition hover:bg-zinc-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-400 sm:px-3";

// Visit count, shown once an article passes 50: c's script (see siteHead) appends the number and unhides this
const views = `<span data-c="50" hidden class="whitespace-nowrap"> • <i data-lucide="eye" class="inline-block h-3.5 w-3.5 align-[-0.2em]"></i> <span class="sr-only">Views: </span></span>`;

export const renderArticle = (article, dates = articleDates(article)) => `
${shellHead({
  title: `${article.title} — apophenia.news`,
  desc: article.description,
  image: absUrl(article.header_image),
  url: `${SITE_URL}/${article.slug}/`,
  type: "article",
  ...dates,
  jsonLd: articleLd(article, dates)
})}
${nav}
<main class="shell py-10">
  <article class="card overflow-hidden">
    <img src="${article.header_image}" alt="${escapeHtml(article.title)}" class="h-64 w-full object-cover" />
    <div class="p-6 sm:p-10">
      <div class="flex items-center justify-between gap-4">
        <p class="text-xs uppercase tracking-wide text-zinc-500">${fmtDate(article.date)} • ${renderAuthorInline(article.author)}${views}</p>
        <div class="flex shrink-0 items-center gap-2">
          <button type="button" data-listen-rate hidden aria-label="Reading speed" class="${toolBtn} tabular-nums">1×</button>
          <button type="button" data-listen hidden aria-label="Listen" class="${toolBtn}">
            <i data-lucide="headphones" data-when="idle" class="h-4 w-4"></i><i data-lucide="pause" data-when="playing" hidden class="h-4 w-4"></i><i data-lucide="play" data-when="paused" hidden class="h-4 w-4"></i><span data-listen-label class="hidden sm:inline">Listen</span>
          </button>
          <button type="button" data-copy-article aria-label="Copy article" class="${toolBtn}">
            <i data-lucide="copy" class="h-4 w-4"></i><span aria-live="polite" class="hidden sm:inline">Copy article</span>
          </button>
        </div>
      </div>
      <h1 data-listen-title class="font-title mt-2 text-4xl sm:text-5xl font-bold leading-tight sm:leading-none">${escapeHtml(article.title)}</h1>
      <p class="mt-4 text-zinc-700 max-w-3xl">${escapeHtml(article.description || "")}</p>
      <div class="mt-5 flex flex-wrap gap-2">
        ${(article.tags || []).map((t) => `<span class="tag">#${escapeHtml(t)}</span>`).join("")}
      </div>
      <hr class="my-8 border-zinc-200" />
      <div class="article-prose">${article.html}</div>
    </div>
    <script id="article-markdown" type="application/json">${JSON.stringify(article.markdown).replace(/</g, "\\u003c")}</script>
  </article>

  ${merch}

  <div class="mt-8">
    <a href="/" class="inline-flex items-center gap-2 text-sm">
      <i data-lucide="arrow-left" class="h-4 w-4"></i> Back to Home
    </a>
  </div>
</main>
${footer}
`;

// Served by Cloudflare Pages with a 404 status for any path that doesn't exist (instead of falling back to the homepage)
export const renderNotFound = () => `
${shellHead({
  title: "Page not found — apophenia.news",
  desc: "This page doesn't exist.",
  type: "website",
  noindex: true
})}
${nav}
<main class="shell py-10">
  <section class="card p-6 sm:p-10 text-center bg-linear-to-b from-white to-indigo-50/50">
    <img src="https://vibegif.direct-img.link/detective/clue.webp" alt="Detective searching for clues with a magnifying glass" width="256" height="256" class="mx-auto h-48 w-48" />
    <p class="tag mt-6 mb-3"><i data-lucide="search" class="h-3.5 w-3.5"></i>404</p>
    <h1 class="text-4xl sm:text-5xl font-bold leading-tight sm:leading-none">No pattern here</h1>
    <p class="mt-4 text-zinc-700 max-w-xl mx-auto">This page doesn't exist or has moved. Even pattern seekers hit a dead end sometimes.</p>
    <a href="/" class="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700">
      <i data-lucide="arrow-left" class="h-4 w-4"></i> Back to Home
    </a>
  </section>
</main>
${footer}
`;

export const renderNewsletterPage = (issues = []) => `
${shellHead({
  title: "Newsletter — apophenia.news",
  desc: "Subscribe to the apophenia.news newsletter. We won't spam you with everything — only the good stuff.",
  image: "https://free.direct-img.link/radio+telescope?i=1",
  url: `${SITE_URL}/newsletter/`,
  type: "website"
})}
${nav}
<main class="shell py-10">
  <article class="card p-6 sm:p-10 bg-linear-to-b from-white to-indigo-50/50">
    <p class="tag mb-3"><i data-lucide="mail" class="h-3.5 w-3.5"></i>Newsletter</p>
    <h1 class="text-4xl sm:text-5xl font-bold leading-tight sm:leading-none">Get the signal, skip the noise</h1>
    <p class="mt-4 text-zinc-700 max-w-2xl">
      The sharpest pattern analysis, delivered straight to your inbox. <strong>We won't spam you with everything — only the good stuff.</strong> No filler, no daily blasts, just the pieces worth your attention.
    </p>

    <form
      class="mt-8 max-w-xl"
      x-data="{
        email: '',
        loading: false,
        ok: false,
        error: '',
        async submit() {
          this.error = '';
          this.ok = false;
          this.loading = true;
          const token = () => this.$el.querySelector('[name=cf-turnstile-response]')?.value;
          for (let i = 0; i < 50 && !token(); i++) await new Promise((r) => setTimeout(r, 100));
          try {
            const res = await fetch('https://newsletter.planetrenox.com/api/sub', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pool: 'apophenia', email: this.email, token: token() || '' })
            });
            const data = await res.json();
            if (res.ok && data.ok) {
              this.ok = true;
              this.email = '';
            } else {
              this.error = data.error === 'invalid email' ? 'That email doesn\\'t look right.'
                : data.error === 'captcha failed' ? 'Couldn\\'t verify you\\'re human. Please try again.'
                : 'Something went wrong. Please try again.';
            }
          } catch (e) {
            this.error = 'Network error. Please try again.';
          }
          window.turnstile?.reset();
          this.loading = false;
        }
      }"
      @submit.prevent="submit"
    >
      <div class="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          x-model="email"
          :disabled="loading"
          class="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
          aria-label="Email address"
        />
        <button
          type="submit"
          :disabled="loading"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          <span x-show="!loading">Subscribe</span>
          <span x-show="loading" x-cloak>Subscribing…</span>
          <i data-lucide="arrow-right" class="h-4 w-4"></i>
        </button>
      </div>
      <div class="cf-turnstile mt-3" data-sitekey="${TURNSTILE_SITE_KEY}" data-appearance="interaction-only" data-size="flexible"></div>

      <p x-show="ok" x-cloak class="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
        <i data-lucide="circle-check" class="h-4 w-4"></i>
        You're in. Welcome to the pattern.
      </p>
      <p x-show="error" x-cloak class="mt-4 inline-flex items-center gap-2 text-sm font-medium text-rose-700">
        <i data-lucide="circle-alert" class="h-4 w-4"></i>
        <span x-text="error"></span>
      </p>

      <p class="mt-4 text-xs text-zinc-500"><a href="/newsletter/unsubscribe" class="underline">Unsubscribe</a> anytime. We never share your email. <a href="/privacy/" class="underline">Privacy</a></p>
    </form>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  </article>

  <section class="mt-10 card p-6 sm:p-8">
    <p class="tag mb-3"><i data-lucide="history" class="h-3.5 w-3.5"></i>History</p>
    <h2 class="text-2xl sm:text-3xl font-bold leading-tight sm:leading-9">Past issues</h2>
    ${
      issues.length
        ? `<ol class="mt-4 divide-y divide-zinc-200">
      ${issues
        .map(
          (i) => `<li class="flex items-baseline justify-between gap-4 py-3">
        <a href="/newsletter/${i.dir}/" class="font-medium">${i.title}</a>
        <time datetime="${i.date}" class="shrink-0 text-xs uppercase tracking-wide text-zinc-500">${fmtDate(i.date)}</time>
      </li>`
        )
        .join("\n      ")}
    </ol>`
        : `<p class="mt-3 text-zinc-700">No issues yet.</p>`
    }
  </section>

  ${merch}

  <div class="mt-8">
    <a href="/" class="inline-flex items-center gap-2 text-sm">
      <i data-lucide="arrow-left" class="h-4 w-4"></i> Back to Home
    </a>
  </div>
</main>
${footer}
`;

// The web version of a newsletter issue: the email as sent, minus its <!--email-->...<!--/email--> parts and
// {{{MERGE}}} fields. Links drop ?utm_source=newsletter so archive readers aren't counted as email clicks.
export const renderIssue = ({ dir, html }) =>
  html
    .replace(/<!--email-->[\s\S]*?<!--\/email-->/g, "")
    .replace(/\{\{\{\w+\}\}\}/g, "")
    .replace(/\?utm_source=newsletter(?=")/g, "")
    .replace("</head>", `  <link rel="canonical" href="${SITE_URL}/newsletter/${dir}/" />\n  ${siteHead}\n</head>`);

export const renderUnsubscribePage = () => `
${shellHead({
  title: "Unsubscribe — apophenia.news",
  desc: "Unsubscribe from the apophenia.news newsletter.",
  url: `${SITE_URL}/newsletter/unsubscribe`
})}
${nav}
<main class="shell py-10">
  <section class="card max-w-md mx-auto p-6 sm:p-8" x-data="{
    email: '', done: '', auto: false, loading: false, ok: false, error: '',
    init() {
      // ?email=a+b@x.com -> URLSearchParams turns '+' into ' ', and emails never contain spaces
      const e = new URLSearchParams(location.search).get('email')?.trim().replace(/ /g, '+');
      if (e) (this.email = e, this.auto = true, this.submit());
    },
    async submit() {
      if (this.loading) return;
      this.loading = true;
      this.ok = false;
      this.error = '';
      try {
        const res = await fetch('https://newsletter.planetrenox.com/api/unsub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pool: 'apophenia', email: this.email.trim() })
        });
        const data = await res.json();
        if (res.ok &amp;&amp; data.ok) {
          this.done = data.email;
          this.ok = true;
          this.email = '';
          history.replaceState(null, '', location.pathname);
        } else {
          this.error = data.error === 'invalid email' ? 'Please enter a valid email address.' : 'Something went wrong. Please try again.';
        }
      } catch {
        this.error = 'Could not connect. Please try again.';
      } finally {
        this.loading = false;
        this.auto = false;
      }
    }
  }">
    <div x-show="ok" x-cloak role="status" class="text-center py-2">
      <svg class="unsub-check mx-auto h-32 w-32" viewBox="0 0 120 120" aria-hidden="true">
        <circle class="uc-wave" cx="60" cy="60" r="44"/>
        <g class="uc-burst">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="60" y1="9" x2="60" y2="2" transform="rotate(${a} 60 60)"/>`).join("")}</g>
        <circle class="uc-disc" cx="60" cy="60" r="44"/>
        <circle class="uc-ring" cx="60" cy="60" r="44" pathLength="1"/>
        <path class="uc-tick" d="M39 61.5l14 14 28-29" pathLength="1"/>
      </svg>
      <h1 class="uc-text mt-5 text-3xl font-bold">You're unsubscribed</h1>
      <p class="uc-text mt-3 text-zinc-600"><b class="text-zinc-900 break-all" x-text="done"></b> won't receive Apophenia emails anymore.</p>
      <a href="/newsletter/" class="uc-text mt-6 inline-block text-sm">Changed your mind? Resubscribe</a>
    </div>

    <div x-show="auto &amp;&amp; !ok" x-cloak class="py-10 text-center text-zinc-600">
      <span class="mx-auto mb-4 block h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-500"></span>
      Unsubscribing <b class="text-zinc-900 break-all" x-text="email"></b>…
    </div>

    <div x-show="!ok &amp;&amp; !auto">
      <h1 class="text-3xl font-bold">Unsubscribe</h1>
      <p class="mt-3 text-zinc-600">Enter your email to stop receiving our newsletter.</p>
      <form class="mt-6" novalidate @submit.prevent="submit">
        <label for="unsubscribe-email" class="block text-sm font-medium">Email address</label>
        <input id="unsubscribe-email" name="email" type="email" autocomplete="email" required x-model="email" :disabled="loading"
          placeholder="you@example.com" class="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-400" />
        <button type="submit" :disabled="loading"
          class="mt-3 w-full rounded-xl bg-accent px-4 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          x-text="loading ? 'Unsubscribing…' : 'Unsubscribe'">Unsubscribe</button>
        <p x-show="error" x-cloak role="alert" x-text="error" class="mt-4 text-sm text-rose-700"></p>
      </form>
      <a href="/newsletter/" class="mt-6 inline-block text-sm">Back to newsletter</a>
    </div>
  </section>
</main>
${footer}
`;

export const renderWritePage = () => `
${shellHead({
  title: "Become a writer for apophenia.news",
  desc: "Pitch your pattern analysis. Email your story as a Markdown file for review and publication.",
  image: "https://free.direct-img.link/typewriter?i=2",
  url: `${SITE_URL}/write/`,
  type: "website"
})}
${nav}
<main class="shell py-10">
  <article class="card p-6 sm:p-10">
    <p class="tag mb-3"><i data-lucide="pen-line" class="h-3.5 w-3.5"></i>Contributor Program</p>
    <h1 class="text-4xl sm:text-5xl font-bold leading-tight sm:leading-none">Become a writer for apophenia.news</h1>
    <p class="mt-4 text-zinc-700 max-w-3xl">
      Have a strong story, analysis, or investigation? Send it to us.
    </p>

    <div class="article-prose mt-8">
      <h2>How to submit</h2>
      <ul>
        <li>Write your article in a <strong>.md (Markdown)</strong> file.</li>
        <li>Email it to <a href="mailto:planetrenox@protonmail.com">planetrenox@protonmail.com</a>.</li>
        <li>If approved, your story will be published on apophenia.news.</li>
        <li>Your byline can use your real name or an alias.</li>
      </ul>

      <h2>Frontmatter template (optional)</h2>
      <pre><code>---
title: "Your headline"
slug: your-slug
date: 2026-03-01
author: Your Name or Alias
description: "1-2 sentence summary"
header_image: https://free.direct-img.link/your+image+query
tags:
  - your-tag
  - another-tag
---</code></pre>
    </div>
  </article>
</main>
${footer}
`;

// What the site records about readers. Keep it true: it describes GoatCounter and c (siteHead), Cloudflare's hosting and
// Web Analytics, the newsletter backend (newsletter.planetrenox.com) and what read-aloud.js saves in the browser
export const renderPrivacyPage = () => `
${shellHead({
  title: "Privacy — apophenia.news",
  desc: "What apophenia.news records when you read it, why, and for how long.",
  image: "https://free.direct-img.link/padlock?i=3",
  url: `${SITE_URL}/privacy/`,
  type: "website"
})}
${nav}
<main class="shell py-10">
  <article class="card p-6 sm:p-10">
    <p class="tag mb-3"><i data-lucide="shield" class="h-3.5 w-3.5"></i>Privacy</p>
    <h1 class="text-4xl sm:text-5xl font-bold leading-tight sm:leading-none">Privacy</h1>
    <p class="mt-4 text-zinc-700 max-w-3xl">What apophenia.news records when you read it, why, and for how long.</p>

    <div class="article-prose mt-8">
      <h2>The short version</h2>
      <ul>
        <li>No ads and no cookies. Nothing is sold, or handed to anyone outside the services named on this page.</li>
        <li>We count visits and keep a log of them, IP addresses included, for 90 days.</li>
        <li>If you subscribe to the newsletter we keep your email address until you ask us to delete it.</li>
      </ul>

      <h2>When you read a page</h2>
      <p>We count visits to know how many people read each article and to keep bots out of the numbers. A visit records the page, the page you came from, the time, your IP address, and what your browser says about itself: its name and version, your system, language, time zone, screen size and whether it is a touch screen.</p>
      <p>Two counters see a visit:</p>
      <ul>
        <li><strong>GoatCounter</strong>, a privacy-focused counting service. It uses your IP address to tell visits apart and to work out your country, and does not store it. See <a href="https://www.goatcounter.com/help/privacy" target="_blank" rel="noopener">GoatCounter's privacy policy</a>.</li>
        <li><strong>c</strong>, a small counter we run on our own server at c.apophenia.news. It keeps a log of visits with everything listed above for 90 days, then deletes it. If your browser blocks GoatCounter, c passes your visit on to GoatCounter, IP address included, so that it is still counted. An ad blocker therefore does not stop the count. The button below does.</li>
      </ul>
      <p>The site is hosted by Cloudflare, which handles every request and so sees your IP address, as any host does. Cloudflare also shows us visit totals through Cloudflare Web Analytics, which uses no cookies. See <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener">Cloudflare's privacy policy</a>.</p>

      <h2>Stop counting my visits</h2>
      <p>This turns off GoatCounter and c in this browser. The choice is saved in the browser itself, so it has to be made again on another device, or after clearing this site's data.</p>
      <div class="not-prose" x-data="{ off: (() => { try { return localStorage.getItem('skipgc') == 't' } catch { return false } })() }">
        <button type="button" class="${toolBtn}" @click="off = !off; off ? localStorage.setItem('skipgc', 't') : localStorage.removeItem('skipgc')">
          <i data-lucide="eye-off" class="h-4 w-4"></i><span aria-live="polite" x-text="off ? 'Count my visits again' : 'Don’t count my visits'">Don’t count my visits</span>
        </button>
        <p x-show="off" x-cloak class="mt-3 text-sm font-medium text-emerald-700">Visits from this browser are not counted.</p>
      </div>

      <h2>What stays in your browser</h2>
      <p>No cookies. Two settings are saved in your browser and never sent to us: your listening speed for the Listen button, and the choice above if you make it.</p>

      <h2>Newsletter</h2>
      <p>If you subscribe we store your email address, the date, and the IP address you subscribed from, in a database at Cloudflare. A Cloudflare check called Turnstile runs on the newsletter page to make sure a person is signing up. Issues are sent through Resend, which receives your email address in order to deliver them.</p>
      <p>Every issue has an unsubscribe link, and you can also <a href="/newsletter/unsubscribe">unsubscribe here</a>. After that we send you nothing, but your address stays on file marked as unsubscribed, with the date and the IP address used, until you ask us to delete it.</p>

      <h2>Elsewhere</h2>
      <p>The <a href="https://store.apophenia.news" target="_blank" rel="noopener">merch store</a> runs on a separate shop platform and our videos are on YouTube. Each has its own privacy policy, and what you do there is not covered here. If you email us, for example to send in an article, we keep your message.</p>

      <h2>Your data</h2>
      <p>Write to <a href="mailto:apophenia@planetrenox.com">apophenia@planetrenox.com</a> to ask what we hold about you, or to have it deleted. For the visit log, tell us your IP address and roughly when you visited: that is all we can look an entry up by.</p>
      <p>For the visit count and log we rely on our legitimate interest in knowing how the site is read and keeping it free of abuse, and for the newsletter on your consent. If you are in the EU or the UK you can also complain to your data protection authority.</p>
      <p class="text-sm text-zinc-500">Last updated November 14, 2026.</p>
    </div>
  </article>
</main>
${footer}
`;

export const renderAuthorPage = (author) => `
${shellHead({
  title: `${author.name} — apophenia.news`,
  desc: author.bio,
  image: author.image || "https://free.direct-img.link/fountain+pen?i=7",
  url: `${SITE_URL}/author/${author.slug}/`,
  type: "profile"
})}
${nav}
<main class="shell py-10">
  <article class="card p-6 sm:p-10">
    <p class="tag mb-3"><i data-lucide="user-round" class="h-3.5 w-3.5"></i>Author</p>
    <h1 class="text-4xl sm:text-5xl font-bold leading-tight sm:leading-none">${escapeHtml(author.name)}</h1>

    <div class="mt-8 grid md:grid-cols-[240px_1fr] gap-8 items-start">
      <div class="h-64 w-full rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 flex items-center justify-center text-sm text-zinc-500">
        Photo coming soon
      </div>

      <div class="article-prose max-w-none min-w-0" x-data="{ copied: false }">
        <p>${escapeHtml(author.bio)}</p>
        <p><strong>Contact:</strong> <a href="mailto:${escapeHtml(author.contact)}">${escapeHtml(author.contact)}</a></p>
        ${author.pgp ? `<h2>PGP public key</h2>
        <p class="text-sm text-zinc-500">Fingerprint: ${escapeHtml(author.pgp.fingerprint)}</p>
        <pre><code x-ref="key">${escapeHtml(author.pgp.key)}</code></pre>
        <p class="not-prose flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <button type="button" class="${toolBtn}" @click="navigator.clipboard.writeText($refs.key.textContent + '\\n').then(() => { copied = true; setTimeout(() => copied = false, 2500) })">
            <i data-lucide="copy" class="h-4 w-4"></i><span aria-live="polite" x-text="copied ? 'Copied!' : 'Copy key'">Copy key</span>
          </button>
          <a href="${author.pgp.url}" class="underline">Download publickey.asc</a>
        </p>` : ""}
      </div>
    </div>
  </article>
</main>
${footer}
`;

const IMG_TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", avif: "image/avif" };

// Readers show <dc:creator> as the byline, the header image as the thumbnail, and tags as <category>
export const renderRss = (articles) => {
  const items = articles
    .map((a) => {
      const link = `${SITE_URL}/${a.slug}/`;
      const img = a.header_image && (/^https?:/.test(a.header_image) ? a.header_image : SITE_URL + a.header_image);
      const type = img && IMG_TYPES[img.split(".").pop().toLowerCase()];
      const byline = String(a.author || "Apophenia").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
      return [
        `<item>`,
        `  <title>${escapeXml(a.title || "")}</title>`,
        `  <link>${escapeXml(link)}</link>`,
        `  <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `  <pubDate>${new Date(a.date).toUTCString()}</pubDate>`,
        `  <dc:creator>${escapeXml(byline)}</dc:creator>`,
        ...(a.tags || []).map((t) => `  <category>${escapeXml(t)}</category>`),
        `  <description>${escapeXml(a.description || "")}</description>`,
        ...(img ? [`  <media:content url="${escapeXml(img)}" medium="image"${type ? ` type="${type}"` : ""} />`] : []),
        `</item>`
      ].join("\n  ");
    })
    .join("\n  ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>apophenia.news</title>
  <link>${SITE_URL}/</link>
  <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
  <description>Signals, anomalies, civilization trajectories, and deep pattern analysis.</description>
  <language>en-us</language>
  <image>
    <url>${SITE_URL}/logo.png</url>
    <title>apophenia.news</title>
    <link>${SITE_URL}/</link>
    <width>120</width>
    <height>120</height>
  </image>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${items}
</channel>
</rss>
`;
};

export const renderSitemap = (articles, authors = [], issues = []) => {
  const now = toISODate(new Date());
  const urls = [
    { loc: `${SITE_URL}/`, lastmod: now },
    { loc: `${SITE_URL}/newsletter/`, lastmod: now },
    { loc: `${SITE_URL}/write/`, lastmod: now },
    { loc: `${SITE_URL}/privacy/`, lastmod: now },
    ...authors.map((a) => ({ loc: `${SITE_URL}/author/${a.slug}/`, lastmod: now })),
    ...issues.map((i) => ({ loc: `${SITE_URL}/newsletter/${i.dir}/`, lastmod: i.date })),
    ...articles.map((a) => ({ loc: `${SITE_URL}/${a.slug}/`, lastmod: toISODate(articleDates(a).modified) }))
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>
`;
};

export const renderRobots = () => `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
