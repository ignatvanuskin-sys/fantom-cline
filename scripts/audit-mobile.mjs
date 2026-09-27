/**
 * Проверка мобильной вёрстки в headless Chrome.
 *
 * Ищем элементы, которые шире экрана (горизонтальное переполнение),
 * и мелкие тач-таргеты (< 44px по спецификации WCAG/Apple).
 *
 * Запуск: node scripts/audit-mobile.mjs [url]
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const URL_TO_CHECK = process.argv[2] ?? "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;

/** Ширины: 320 (iPhone SE 1-го gen), 375 (SE2/13 mini), 414 (11), 768, 1440 */
const WIDTHS = [320, 375, 414, 768, 1440];
const HEIGHT = 800;

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

async function cdpTargets() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* ещё не поднялся */
    }
    await sleep(250);
  }
  throw new Error("CDP не поднялся");
}

const wsUrl = await cdpTargets();
const ws = new WebSocket(wsUrl);
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

function send(method, params = {}) {
  const msgId = ++id;
  return new Promise((res) => {
    pending.set(msgId, res);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

async function evaluate(expression) {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return r.result?.result?.value;
}

await send("Page.enable");
await send("Runtime.enable");

// Без перехода на URL аудит выполнялся бы на about:blank и «нашёл» бы
// ноль элементов — то есть пустой, но зелёный результат.
console.error("navigating to", URL_TO_CHECK);
await send("Page.navigate", { url: URL_TO_CHECK });
for (let i = 0; i < 60; i++) {
  const ready = await evaluate("document.readyState");
  const hasHero = await evaluate("!!document.getElementById('hero')");
  if (ready === "complete" && hasHero) break;
  await sleep(250);
}
const sanity = await evaluate("document.querySelectorAll('body *').length");
if (!sanity || sanity < 50) {
  throw new Error(
    `Страница не отрендерилась: элементов в body = ${sanity}. Аудит недействителен.`,
  );
}
console.error("elements in body:", sanity);
await sleep(500);

// Собираем метрики один раз; ширину вьюпорта задаём через
// Emulation.setDeviceMetricsOverride — подмена ширины через CSS неэквивалентна
// реальному устройству (не срабатывают медиазапросы и vw-единицы).
const collect = `(async () => {
  await new Promise(r => requestAnimationFrame(r));
  for (let y = 0; y < document.body.scrollHeight; y += 600) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 60));
  }
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 250));

  const vw = document.documentElement.clientWidth;
  const overflow = [];
  const smallTargets = [];
  const widest = [];
  const all = document.querySelectorAll('body *');
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    widest.push({ w: Math.round(r.width), tag: el.tagName.toLowerCase(),
                  cls: (el.className||'').toString().slice(0,50), pos: cs.position });
    if (r.right > vw + 1.5) {
      if (!el.closest('.overflow-x-auto, .snap-x, [data-scroller]')) {
        overflow.push({ tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 70),
          right: Math.round(r.right), width: Math.round(r.width), pos: cs.position });
      }
    }
    const interactive = el.matches('a, button, input, select, [role=button], label');
    if (interactive && cs.pointerEvents !== 'none' && (r.height < 40 || r.width < 40)) {
      const type = el.getAttribute('type') || '';
      if (type !== 'radio' && type !== 'checkbox' && !el.className.toString().includes('sr-only')) {
        smallTargets.push({ tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 60),
          w: Math.round(r.width), h: Math.round(r.height) });
      }
    }
  }
  widest.sort((a,b) => b.w - a.w);
  return {
    vw,
    docScrollW: document.documentElement.scrollWidth,
    bodyScrollW: document.body.scrollWidth,
    elementCount: all.length,
    overflow: overflow.slice(0, 12), overflowCount: overflow.length,
    smallTargets: smallTargets.slice(0, 12), smallCount: smallTargets.length,
    widest: widest.slice(0, 6),
    widestNonFixed: widest.filter(x => x.pos !== 'fixed').slice(0, 6),
  };
})()`;

const results = [];
for (const w of WIDTHS) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: w,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: w < 768,
  });
  await sleep(800);
  results.push(await evaluate(collect));
}
console.log(JSON.stringify(results, null, 2));

ws.close();
chrome.kill();
process.exit(0);
