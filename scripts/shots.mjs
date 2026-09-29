/**
 * Полноэкранные снимки страницы в headless Chrome — по одной картинке
 * на каждую ширину. Нужны, чтобы проверять вёрстку глазами, а не по коду:
 * шрифты, переносы и порядок секций на 375px и на 1440px выглядят
 * совершенно по-разному.
 *
 * Запуск: node scripts/shots.mjs [url] [--out .build/shots] [--width 375,1440]
 *         [--selector "#hero"] (снять только один блок)
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const URL_TO_SHOT = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const OUT_DIR = flag("--out", path.join(".build", "shots"));
const WIDTHS = flag("--width", "375,768,1440").split(",").map(Number);
const SELECTOR = flag("--selector", null);
const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9227;

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

await send("Page.enable");
await send("Runtime.enable");
mkdirSync(OUT_DIR, { recursive: true });

for (const width of WIDTHS) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
  await send("Page.navigate", { url: URL_TO_SHOT });
  for (let i = 0; i < 80; i++) {
    const ready = await evaluate("document.readyState");
    const hero = await evaluate("!!document.getElementById('hero')");
    if (ready === "complete" && hero) break;
    await sleep(250);
  }
  await evaluate("document.fonts.ready");
  await sleep(1500);

  // Прокрутка до конца: срабатывают все reveal-анимации, и снимок
  // не показывает полупрозрачные блоки.
  await evaluate(
    `(async () => { for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.8) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0,0); })()`,
  );
  await sleep(1200);

  let clip = null;
  if (SELECTOR) {
    clip = await evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(SELECTOR)});
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.max(0, r.left), y: Math.max(0, r.top + window.scrollY), width: r.width, height: r.height, scale: 1 };
    })()`);
  }

  // captureBeyondViewport всегда true: иначе clip за пределами текущего
  // вьюпорта даёт полностью чёрный кадр — браузер не отрисовывает то,
  // что не попало в экран.
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    ...(clip ? { clip } : {}),
  });
  const file = path.join(OUT_DIR, `w${width}.png`);
  writeFileSync(file, Buffer.from(shot.result.data, "base64"));
  const size = await evaluate("document.body.scrollHeight");
  console.log(`${file}  pageHeight=${size}px`);
}

ws.close();
chrome.kill();
process.exit(0);
