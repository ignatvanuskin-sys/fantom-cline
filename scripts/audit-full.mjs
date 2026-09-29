/**
 * Полный аудит страницы в headless Chrome.
 *
 * Проверяет то, что не видно глазами и не ловит сборка:
 *  — ошибки в консоли и упавшие запросы (битые картинки, 404 на чанки);
 *  — структуру заголовков и наличие h1;
 *  — доступность: alt, имена кнопок и ссылок, подписи у полей,
 *    дубли id, «висячие» aria-labelledby / aria-controls / for;
 *  — ссылки-заглушки (# без цели) и пустые href;
 *  — контраст текста (приблизительно: по ближайшему непрозрачному фону);
 *  — переполнение по горизонтали и мелкие тач-таргеты по ширинам;
 *  — уважение prefers-reduced-motion.
 *
 * Запуск: node scripts/audit-full.mjs [url]
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const URL_TO_CHECK = process.argv[2] ?? "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9224;
const WIDTHS = [320, 375, 414, 768, 1440];

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ],
  { stdio: "ignore" },
);

async function target() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* ещё поднимается */
    }
    await sleep(250);
  }
  throw new Error("CDP не поднялся");
}

const ws = new WebSocket(await target());
await new Promise((res, rej) => {
  ws.addEventListener("open", res, { once: true });
  ws.addEventListener("error", rej, { once: true });
});

let id = 0;
const pending = new Map();
const consoleErrors = [];
const failedRequests = [];
const pageErrors = [];

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
    consoleErrors.push(
      (msg.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(" ").slice(0, 200),
    );
  }
  if (msg.method === "Runtime.exceptionThrown") {
    pageErrors.push(String(msg.params.exceptionDetails?.exception?.description ?? "").slice(0, 200));
  }
  if (msg.method === "Network.loadingFailed") {
    failedRequests.push(msg.params.errorText + " (blocked=" + msg.params.blockedReason + ")");
  }
  if (msg.method === "Network.responseReceived") {
    const s = msg.params.response.status;
    if (s >= 400) failedRequests.push(s + " " + msg.params.response.url.slice(0, 120));
  }
});

function send(method, params = {}) {
  const msgId = ++id;
  return new Promise((res) => {
    pending.set(msgId, res);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) return { __error: r.result.exceptionDetails.text };
  return r.result?.result?.value;
}

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
await send("Page.navigate", { url: URL_TO_CHECK });
for (let i = 0; i < 80; i++) {
  const ready = await evaluate("document.readyState");
  const hero = await evaluate("!!document.getElementById('hero')");
  if (ready === "complete" && hero) break;
  await sleep(250);
}
await sleep(2500);
await evaluate(
  `(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0,0); await new Promise(r => setTimeout(r, 400)); })()`,
);

const STATIC_CHECKS = `(() => {
  const out = {};
  const txt = (el) => (el.textContent || "").trim().slice(0, 50);
  const vis = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  out.lang = document.documentElement.lang;
  out.title = document.title;

  // --- заголовки ---
  const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(vis);
  out.h1Count = hs.filter(h => h.tagName === "H1").length;
  out.headingJumps = [];
  let prev = 0;
  for (const h of hs) {
    const lvl = +h.tagName[1];
    if (prev && lvl > prev + 1) out.headingJumps.push("h" + prev + " -> h" + lvl + " «" + txt(h) + "»");
    prev = lvl;
  }

  // --- изображения ---
  out.imagesTotal = document.images.length;
  out.imagesNoAlt = [...document.images].filter(i => !i.hasAttribute("alt")).length;
  out.imagesEmptyAlt = [...document.images].filter(i => i.getAttribute("alt") === "").length;
  out.imagesBroken = [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.currentSrc.slice(0, 80));

  // --- доступные имена интерактивных элементов ---
  const nameOf = (el) =>
    (el.getAttribute("aria-label") || "").trim() ||
    (el.getAttribute("title") || "").trim() ||
    (el.getAttribute("alt") || "").trim() ||
    (el.textContent || "").trim() ||
    (el.querySelector("img[alt]") ? el.querySelector("img[alt]").getAttribute("alt") : "");
  out.unnamedButtons = [...document.querySelectorAll("button,[role=button]")].filter(vis).filter(b => !nameOf(b)).map(b => b.className.toString().slice(0, 60));
  out.unnamedLinks = [...document.querySelectorAll("a")].filter(vis).filter(a => !nameOf(a)).map(a => a.className.toString().slice(0, 60));

  // --- ссылки ---
  const anchors = [...document.querySelectorAll("a")].filter(vis);
  out.linksNoHref = anchors.filter(a => !a.getAttribute("href")).length;
  out.hashLinksDead = anchors
    .filter(a => { const h = a.getAttribute("href") || ""; return h.startsWith("#") && h.length > 1 && !document.getElementById(h.slice(1)); })
    .map(a => a.getAttribute("href"));
  out.externalNoRel = anchors
    .filter(a => { const h = a.getAttribute("href") || ""; return /^https?:/i.test(h) && a.target === "_blank" && !(a.rel || "").includes("noopener"); })
    .map(a => a.getAttribute("href").slice(0, 60));

  // --- поля формы ---
  const fields = [...document.querySelectorAll("input,select,textarea")].filter(i => i.type !== "hidden" && vis(i));
  out.fieldsTotal = fields.length;
  out.fieldsNoLabel = fields.filter(i => {
    if (i.getAttribute("aria-label") || i.getAttribute("aria-labelledby")) return false;
    if (i.id && document.querySelector('label[for="' + CSS.escape(i.id) + '"]')) return false;
    return !i.closest("label");
  }).map(i => (i.id || i.name || i.type) + " | " + i.className.toString().slice(0, 45));

  // --- дубли id и висячие ссылки ARIA ---
  const ids = {};
  for (const el of document.querySelectorAll("[id]")) ids[el.id] = (ids[el.id] || 0) + 1;
  out.duplicateIds = Object.entries(ids).filter(([, n]) => n > 1).map(([k, n]) => k + " x" + n);

  out.danglingAria = [];
  for (const attr of ["aria-labelledby", "aria-controls", "aria-describedby"]) {
    for (const el of document.querySelectorAll("[" + attr + "]")) {
      for (const ref of el.getAttribute(attr).split(/\\s+/).filter(Boolean)) {
        if (!document.getElementById(ref)) out.danglingAria.push(attr + "=" + ref);
      }
    }
  }
  out.danglingLabelFor = [...document.querySelectorAll("label[for]")].filter(l => !document.getElementById(l.getAttribute("for"))).map(l => l.getAttribute("for"));

  // --- контраст (приблизительно) ---
  const lum = (rgb) => {
    const [r, g, b] = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const parse = (s) => { const m = s.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(",").map(Number); return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
  const bgOf = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0.85) return c.rgb;
      // фон-картинка/градиент — считать нельзя, выходим
      const bi = getComputedStyle(node).backgroundImage;
      if (bi && bi !== "none") return null;
      node = node.parentElement;
    }
    return [10, 10, 10];
  };
  out.lowContrast = [];
  for (const el of document.querySelectorAll("p,span,li,a,dt,dd,h1,h2,h3,h4,label,button")) {
    if (!vis(el)) continue;
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 2);
    if (!own) continue;
    const cs = getComputedStyle(el);
    const fg = parse(cs.color);
    if (!fg) continue;
    const bg = bgOf(el);
    if (!bg) continue;
    const l1 = lum(fg.rgb), l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    if (ratio < need) {
      out.lowContrast.push(Math.round(ratio * 100) / 100 + " (нужно " + need + ") " + size + "px «" + txt(el) + "»");
    }
  }
  out.lowContrast = out.lowContrast.slice(0, 12);

  // --- прочее ---
  out.viewportMeta = !!document.querySelector('meta[name="viewport"]');
  // У next/image с fill нет атрибутов width/height, но вёрстка не прыгает,
  // если у контейнера задана пропорция (aspect-ratio). Такие кадры — норма.
  out.imagesWithoutDimensions = [...document.images].filter((i) => {
    if (i.getAttribute("width") && i.getAttribute("height")) return false;
    const p = i.parentElement;
    const ar = p ? getComputedStyle(p).aspectRatio : "auto";
    return !ar || ar === "auto";
  }).length;
  out.hasSkipLink = !!document.querySelector('a[href^="#"][class*=sr-only], a[href="#main"]');
  return out;
})()`;

const report = { url: URL_TO_CHECK };
report.static = await evaluate(STATIC_CHECKS);

// --- переполнение и тач-таргеты по ширинам ---
report.widths = [];
for (const w of WIDTHS) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: 812, deviceScaleFactor: 1, mobile: w < 768 });
  await sleep(700);
  const r = await evaluate(`(() => {
    const vw = document.documentElement.clientWidth;
    const vpw = window.innerWidth;
    let small = 0;
    const samples = [];
    for (const el of document.querySelectorAll("a,button,input,select,[role=button],label")) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.pointerEvents === "none") continue;
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      const t = el.getAttribute("type") || "";
      if (t === "radio" || t === "checkbox" || el.className.toString().includes("sr-only")) continue;
      if (b.height < 40 || b.width < 40) { small++; if (samples.length < 3) samples.push(el.tagName.toLowerCase() + " " + Math.round(b.width) + "x" + Math.round(b.height) + " | " + el.className.toString().slice(0, 40)); }
    }
    return { vw, vpw, scrollW: document.documentElement.scrollWidth, small, samples };
  })()`);
  report.widths.push({ width: w, ...r });
}

// --- prefers-reduced-motion ---
await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await sleep(900);
report.reducedMotion = await evaluate(`(() => {
  const out = { longAnimations: [], hiddenContent: 0 };
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.animationName !== "none") {
      const d = parseFloat(cs.animationDuration) || 0;
      // Глобальное правило проекта — 0.01ms; всё, что длиннее 50мс, не отключено.
      if (d > 0.05) out.longAnimations.push(cs.animationName + " " + cs.animationDuration + " on ." + (el.className.toString().split(" ")[0] || el.tagName.toLowerCase()));
    }
    if (el.classList.contains("reveal-dark") && parseFloat(cs.opacity) < 0.5) out.hiddenContent++;
  }
  out.longAnimations = [...new Set(out.longAnimations)].slice(0, 8);
  return out;
})()`);

report.consoleErrors = [...new Set(consoleErrors)].slice(0, 10);
report.pageErrors = [...new Set(pageErrors)].slice(0, 10);
report.failedRequests = [...new Set(failedRequests)].slice(0, 10);

console.log(JSON.stringify(report, null, 2));
ws.close();
chrome.kill();
process.exit(0);
