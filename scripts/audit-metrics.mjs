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
    window.__lcp = es[es.length - 1].startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
`;

await send("Page.enable");
await send("Runtime.enable");

for (const width of [375, 414]) {
  await send("Emulation.setDeviceMetricsOverride", {
    width, height: 812, deviceScaleFactor: 2, mobile: true,
  });
  await send("Page.navigate", { url: "about:blank" });
  await sleep(200);
  await send("Page.addScriptToEvaluateOnNewDocument", { source: PROBE });
  await send("Page.navigate", { url: URL_TO_CHECK });

  for (let i = 0; i < 80; i++) {
    const ready = await evaluate("document.readyState");
    const hero = await evaluate("!!document.getElementById('hero')");
    if (ready === "complete" && hero) break;
    await sleep(250);
  }
  await sleep(2500);
  await evaluate(
    `(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); } window.scrollTo(0,0); })()`,
  );
  await sleep(1200);

  const out = await evaluate(
    `({ cls: Math.round((window.__cls || 0) * 10000) / 10000,
        lcp: Math.round(window.__lcp || 0),
        height: document.body.scrollHeight,
        shifts: (window.__shifts || []).slice().sort((a, b) => b.v - a.v).slice(0, 4) })`,
  );
  console.log(
    `w=${width}  CLS=${out.cls}  LCP=${out.lcp}ms  pageHeight=${out.height}px`,
  );
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
