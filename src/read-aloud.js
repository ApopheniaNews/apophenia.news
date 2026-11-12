// "Listen" on article pages: reads the title and article aloud with the device's own voices (Web Speech API), one
// sentence at a time (Chrome cuts off long utterances), and highlights the block being read. US English whenever the
// device has it. Free, nothing to host, but the voice itself is whatever the reader's phone or browser offers.
const ss = window.speechSynthesis;
const btn = document.querySelector("[data-listen]");
const rateBtn = document.querySelector("[data-listen-rate]");

if (ss && btn) {
  const RATES = [1, 1.25, 1.5, 0.75];
  const LABELS = { idle: "Listen", playing: "Pause", paused: "Resume" };
  let rate = +localStorage.getItem("listen-rate") || 1;
  let blocks, voice, lit, cur;
  let at = 0, sent = 0, run = 0;

  // Display math is read from its TeX source, so \frac{a}{b} comes out as "a divided by b"
  const tex = (t) =>
    t.replace(/\\text\{([^}]*)\}/g, "$1").replace(/_\{([^}]*)\}/g, " $1")
      .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1 divided by $2")
      .replace(/\\approx/g, " is about ").replace(/\\times/g, " times ").replace(/=/g, " equals ").replace(/\//g, " divided by ")
      .replace(/\\[a-z]+|[{}]/gi, " ");

  const text = (el) => {
    const c = el.cloneNode(true);
    c.querySelectorAll(".katex").forEach((k) => k.replaceWith(` ${tex(k.querySelector("annotation")?.textContent || "")} `));
    return (c.tagName == "TR" ? [...c.children].map((td) => td.textContent).join(", ") : c.textContent)
      .replace(/→/g, ", ").replace(/~(?=\d)/g, "about ").replace(/(\d)–(\d)/g, "$1 to $2")
      .replace(/\s+/g, " ").replace(/ ([,.])/g, "$1").trim();
  };

  // Split on . ! ? followed by a space, so "0.05 mm" stays whole. Headings have no full stop, hence the |$
  const split = (t) => t.match(/.+?(?:[.!?…]+["'”’)\]]*(?=\s|$)|$)/g)?.map((s) => s.trim()).filter(Boolean) || [];

  // Innermost blocks only, so a list item holding a paragraph isn't read twice. Image-only paragraphs drop out empty.
  const pick = () => {
    const all = [...document.querySelectorAll("[data-listen-title], .article-prose :is(h2,h3,h4,p,li,tr,.katex-display)")];
    return all.filter((el) => !all.some((o) => o != el && el.contains(o))).map((el) => ({ el, parts: split(text(el)) })).filter((b) => b.parts.length);
  };

  // Best US voice (Edge "Natural", Apple "Premium", Google...), else the best English one, else the browser default
  const pickVoice = () => {
    const score = (v) => /^en[-_]us$/i.test(v.lang) * 10 + (/natural|premium|enhanced|neural/i.test(v.name) ? 3 : /google|samantha|siri/i.test(v.name) ? 2 : 0);
    return ss.getVoices().filter((v) => /^en/i.test(v.lang)).sort((a, b) => score(b) - score(a))[0];
  };

  // Chrome loads its voices in the background and answers the first getVoices() with an empty list, so ask as soon as
  // the page opens and pick again whenever the list fills in. Asking only on the first tap meant no voice at all.
  const loadVoice = () => (voice = pickVoice() || voice);
  loadVoice();
  ss.onvoiceschanged = loadVoice;

  const inView = (el, whole) => {
    const r = el.getBoundingClientRect();
    return whole ? r.top >= 0 && r.bottom <= innerHeight : r.bottom > 0 && r.top < innerHeight;
  };

  // Follows along only if the reader was already looking at the last block, so it never yanks them back mid-scroll
  const mark = (el) => {
    if (el == lit) return;
    const follow = lit && inView(lit);
    lit?.classList.remove("reading");
    (lit = el)?.classList.add("reading");
    if (el && follow && !inView(el, true)) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const setState = (s) => {
    btn.dataset.state = s;
    btn.setAttribute("aria-label", (btn.querySelector("[data-listen-label]").textContent = LABELS[s]));
    btn.querySelectorAll("[data-when]").forEach((i) => i.toggleAttribute("hidden", i.dataset.when != s));
    if (rateBtn) rateBtn.hidden = s == "idle";
  };

  const next = (tok) => {
    if (tok != run) return;
    const b = blocks[at];
    if (!b) return stop();
    mark(b.el);
    // Kept in cur: Chrome garbage-collects an unreferenced utterance and its onend never fires
    const u = (cur = new SpeechSynthesisUtterance(b.parts[sent]));
    // Android Chrome ignores .voice and only hands .lang to the phone's speech engine, so set both
    u.voice = voice || null;
    u.lang = voice ? voice.lang.replace("_", "-") : "en-US";
    u.rate = rate;
    u.onend = () => {
      if (tok != run) return;
      if (++sent >= b.parts.length) {
        at++;
        sent = 0;
      }
      next(tok);
    };
    u.onerror = (e) => tok == run && !/interrupted|canceled/.test(e.error) && stop();
    ss.speak(u);
  };

  // Every cancel bumps run, so a late onend from the cancelled sentence (Safari fires one) can't carry on reading
  const play = () => {
    blocks ||= pick();
    loadVoice();
    run++;
    if (ss.speaking || ss.pending) ss.cancel();
    setState("playing");
    next(run);
  };
  const pause = () => (run++, ss.cancel(), setState("paused"));
  const stop = () => (run++, ss.cancel(), (at = sent = 0), mark(null), setState("idle"));

  btn.addEventListener("click", () => (btn.dataset.state == "playing" ? pause() : play()));

  // A new speed applies right away by restarting the current sentence
  const showRate = () => rateBtn && (rateBtn.textContent = `${rate}×`);
  rateBtn?.addEventListener("click", () => {
    rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    localStorage.setItem("listen-rate", rate);
    showRate();
    if (btn.dataset.state == "playing") {
      const tok = ++run;
      ss.cancel();
      setTimeout(() => next(tok), 100);
    }
  });

  showRate();
  setState("idle");
  btn.hidden = false;
  addEventListener("pagehide", stop);
}
