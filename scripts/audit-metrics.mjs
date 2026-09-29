/**
 * Замер Core Web Vitals (CLS/LCP) в headless Chrome на мобильных ширинах,
 * плюс снимок шапки в закрытом и открытом состоянии меню.
 *
 * Запуск: node scripts/audit-metrics.mjs [url] [--shots]
 *
 * CLS считается через PerformanceObserver с buffered:true и учётом
 * hadRecentInput — как это делает Lighthouse, но без его ограничений
 * на длину сессии. Отдельно печатаются крупнейшие сдвиги с их источниками:
 * по ним видно, какой именно элемент прыгнул.
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const URL_TO_CHECK = process.argv[2] ?? "http://localhost:3000";
const WANT_SHOTS = process.argv.includes("--shots");
const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9225;
const SHOT_DIR = path.join(".build", "shots");

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
      /* поднимается */
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
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
const send = (method, params = {}) =>
  new Promise((res) => {
    const msgId = ++id;
    pending.set(msgId, res);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return r.result?.result?.value;
};

const PROBE = `
  window.__cls = 0;
  window.__lcp = 0;
  window.__shifts = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__cls += e.value;
      window.__shifts.push({
        v: Math.round(e.value * 10000) / 10000,
        t: Math.round(e.startTime),
        s: (e.sources || []).slice(0, 2).map((s) => ({
          tag: s.node ? s.node.tagName.toLowerCase() : "?",
          cls: s.node && s.node.className ? String(s.node.className).slice(0, 55) : "",
        })),
      });
    }
  }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((l) => {
    const es = l.getEntries();
    const e = es[es.length - 1];
    window.__lcp = e.startTime;
    // Копим ВСЕ кандидаты: по последовательности видно, кто «перебил» кого
    // и на какой секунде — иначе непонятно, что именно тормозит отрисовку.
    window.__lcpAll = (window.__lcpAll || []).concat(
      es.map((x) => ({
        t: Math.round(x.startTime),
        size: x.size || 0,
        tag: x.element ? x.element.tagName.toLowerCase() : "?",
        cls: x.element && x.element.className ? String(x.element.className).slice(0, 40) : "",
      })),
    );
    // Кто именно оказался самым крупным элементом: без этого видно
    // только время и непонятно, что ускорять.
    window.__lcpInfo = {
      url: e.url || "",
      tag: e.element ? e.element.tagName.toLowerCase() : "?",
      cls: e.element && e.element.className ? String(e.element.className).slice(0, 70) : "",
      size: e.size || 0,
      renderTime: Math.round(e.renderTime || 0),
      loadTime: Math.round(e.loadTime || 0),
      box: e.element
        ? (() => {
            const r = e.element.getBoundingClientRect();
            return Math.round(r.width) + "x" + Math.round(r.height);
          })()
        : "",
      html: e.element ? String(e.element.outerHTML).slice(0, 110) : "",
    };
  }).observe({ type: "largest-contentful-paint", buffered: true });
`;

await send("Page.enable");
await send("Runtime.enable");

// Регистрируем пробник РОВНО ОДИН РАЗ. Если делать это внутри цикла по
// ширинам, на второй итерации отработают уже два наблюдателя и будут
// писать в один и тот же счётчик — CLS выйдет завышенным вдвое.
await send("Page.addScriptToEvaluateOnNewDocument", { source: PROBE });

for (const width of [375, 414]) {
  await send("Emulation.setDeviceMetricsOverride", {
    width, height: 812, deviceScaleFactor: 2, mobile: true,
  });
  await send("Page.navigate", { url: URL_TO_CHECK });

  for (let i = 0; i < 80; i++) {
    const ready = await evaluate("document.readyState");
    const hero = await evaluate("!!document.getElementById('hero')");
    if (ready === "complete" && hero) break;
    await sleep(250);
  }
  // LCP читаем ДО прокрутки. Элементы, въехавшие в кадр при скролле,
  // тоже становятся кандидатами — если мерить после прокрутки, к времени
  // добавляются секунды, которых у реального посетителя первого экрана нет.
  await sleep(3000);
  const lcp = await evaluate(
    "({ t: Math.round(window.__lcp || 0), info: window.__lcpInfo || null, all: (window.__lcpAll || []).slice(-8) })",
  );

  // А это уже нужно CLS: сдвиги бывают и в нижних секциях, которые
  // без прокрутки просто не отрисовываются.
  await evaluate(
    `(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); } window.scrollTo(0,0); })()`,
  );
  await sleep(1200);

  const out = await evaluate(
    `({ cls: Math.round((window.__cls || 0) * 10000) / 10000,
        lcp: Math.round(window.__lcp || 0),
        lcpInfo: window.__lcpInfo || null,
        height: document.body.scrollHeight,
        shifts: (window.__shifts || []).slice().sort((a, b) => b.v - a.v).slice(0, 4) })`,
  );
  console.log(
    `w=${width}  CLS=${out.cls}  LCP=${lcp.t}ms  pageHeight=${out.height}px`,
  );
  if (lcp.info) {
    console.log(
      `   LCP-элемент: <${lcp.info.tag}> ${lcp.info.cls} ` +
        `box=${lcp.info.box} size=${lcp.info.size} render=${lcp.info.renderTime}ms ${lcp.info.url}`,
    );
  }
  if (lcp.all && lcp.all.length) {
    console.log(
      "   кандидаты LCP: " +
        lcp.all.map((c) => `${c.t}ms/${c.size}/<${c.tag}>`).join(", "),
    );
  }
  for (const s of out.shifts) {
    const who = s.s.map((x) => `<${x.tag}> ${x.cls}`).join(" | ");
    console.log(`   SHIFT ${s.v} @${s.t}ms  ${who}`);
  }
}

if (WANT_SHOTS) {
  mkdirSync(SHOT_DIR, { recursive: true });
  await send("Emulation.setDeviceMetricsOverride", {
    width: 375, height: 812, deviceScaleFactor: 2, mobile: true,
  });
  await send("Page.navigate", { url: URL_TO_CHECK });
  await sleep(3500);

  const clip = { x: 0, y: 0, width: 375, height: 278, scale: 1 };
  const closed = await send("Page.captureScreenshot", { format: "png", clip });
  writeFileSync(path.join(SHOT_DIR, "menu-closed.png"), Buffer.from(closed.result.data, "base64"));

  await evaluate(`document.querySelector('button[aria-controls="mobile-menu"]')?.click()`);
  await sleep(1200);
  const open = await send("Page.captureScreenshot", { format: "png", clip });
  writeFileSync(path.join(SHOT_DIR, "menu-open.png"), Buffer.from(open.result.data, "base64"));

  // Отдельно — состояние «креста» в шапке поверх открытого меню
  const topStrip = { x: 250, y: 0, width: 125, height: 64, scale: 3 };
  const icon = await send("Page.captureScreenshot", { format: "png", clip: topStrip });
  writeFileSync(path.join(SHOT_DIR, "menu-icon-open.png"), Buffer.from(icon.result.data, "base64"));

  console.log("shots written to " + SHOT_DIR);
}

ws.close();
chrome.kill();
process.exit(0);
