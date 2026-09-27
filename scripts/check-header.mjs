// Проверка шапки на мобильном: заметность кнопки «Запись», меню с тремя
// точками и отсутствие липкой кнопки снизу. Запуск: node scripts/check-header.mjs
const PORT = 9223;
const URL_TO_CHECK = "http://127.0.0.1:3100";

const { spawn } = await import("node:child_process");
const { writeFileSync } = await import("node:fs");

const chrome = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--disable-gpu",
    "--no-sandbox",
    "about:blank",
  ],
  { stdio: "ignore", detached: true },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWs() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* ещё не поднялся */
    }
    await sleep(300);
  }
  throw new Error("Chrome DevTools не поднялся");
}

const ws = new WebSocket(await getWs());
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
};

function send(method, params = {}) {
  const myId = ++id;
  ws.send(JSON.stringify({ id: myId, method, params }));
  return new Promise((r) => pending.set(myId, r));
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
await send("Emulation.setDeviceMetricsOverride", {
  width: 375,
  height: 812,
  deviceScaleFactor: 2,
  mobile: true,
});
await send("Page.navigate", { url: URL_TO_CHECK });
await sleep(5000);

const header = await evaluate(`(() => {
  const link = [...document.querySelectorAll('header a')]
    .find(a => /запис/i.test(a.textContent || '') && a.offsetParent !== null);
  if (!link) return { found: false };
  const cs = getComputedStyle(link);
  const r = link.getBoundingClientRect();
  return {
    found: true,
    text: link.textContent.trim(),
    // Залитая кнопка читается на тёмном фоне; контурная раньше терялась
    background: cs.backgroundColor,
    border: cs.borderTopWidth + ' ' + cs.borderTopStyle,
    color: cs.color,
    size: Math.round(r.width) + 'x' + Math.round(r.height),
  };
})()`);
console.log("Кнопка «Запись» в шапке:", JSON.stringify(header, null, 2));

// Липкая кнопка снизу: фиксированный блок во всю ширину у нижнего края
const sticky = await evaluate(`(() => {
  const found = [...document.querySelectorAll('a, div')].filter(el => {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' || cs.display === 'none') return false;
    const r = el.getBoundingClientRect();
    return r.height > 30 && r.width > window.innerWidth * 0.85
      && r.bottom >= window.innerHeight - 4 && r.top > window.innerHeight * 0.6;
  });
  return { count: found.length, texts: found.map(e => (e.textContent || '').trim().slice(0, 40)) };
})()`);
console.log("Липких элементов снизу:", JSON.stringify(sticky));

const closedShot = await send("Page.captureScreenshot", { format: "png" });
writeFileSync(".build/menu-closed.png", Buffer.from(closedShot.result.data, "base64"));
console.log("меню закрыто: .build/menu-closed.png");

const tapped = await evaluate(`(() => {
  const btn = document.querySelector('button[aria-controls="mobile-menu"]');
  if (!btn) return { found: false };
  const cs = getComputedStyle(btn);
  const r = btn.getBoundingClientRect();
  // Эталон quest-new-five: квадрат 44x44 с рамкой, внутри три линии (svg)
  const lines = btn.querySelectorAll('svg line').length;
  btn.click();
  return {
    found: true,
    label: btn.getAttribute('aria-label'),
    size: Math.round(r.width) + 'x' + Math.round(r.height),
    border: cs.borderTopWidth + ' ' + cs.borderTopStyle,
    lines,
  };
})()`);
await sleep(700);

const panel = await evaluate(`(() => {
  const el = document.getElementById('mobile-menu');
  if (!el) return { opened: false };
  const btn = document.querySelector('button[aria-controls="mobile-menu"]');
  const r = el.getBoundingClientRect();
  const links = [...el.querySelectorAll('a')];
  return {
    opened: true,
    expanded: btn.getAttribute('aria-expanded'),
    role: el.getAttribute('role'),
    modal: el.getAttribute('aria-modal'),
    // Панель должна перекрывать весь экран, а не висеть под шапкой
    coversViewport: Math.abs(r.height - window.innerHeight) < 2,
    // Пока меню открыто, фон страницы не должен прокручиваться
    bodyLocked: getComputedStyle(document.documentElement).overflow === 'hidden',
    links: links.map(a => a.textContent.trim()),
    // Каждый пункт должен быть достаточно крупным для пальца
    minLinkH: Math.min(...links.map(a => Math.round(a.getBoundingClientRect().height))),
    visibleH: Math.round(r.height),
    withinViewport: r.bottom <= window.innerHeight + 1,
  };
})()`);
console.log("Кнопка меню:", JSON.stringify(tapped));
console.log("Панель после тапа:", JSON.stringify(panel, null, 2));

const shot = await send("Page.captureScreenshot", { format: "png" });
writeFileSync(".build/menu-open.png", Buffer.from(shot.result.data, "base64"));
console.log("скриншот: .build/menu-open.png");

// Закрытие по Escape
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await sleep(500);
console.log("Закрылось по Escape:", await evaluate(`!document.getElementById('mobile-menu')`));

// Навигация должна оставаться доступной без JS — в футере ссылки статичны
console.log(
  "Ссылки в футере:",
  await evaluate(`[...document.querySelectorAll('footer a')].map(a => a.getAttribute('href')).join(', ')`),
);

ws.close();
try {
  process.kill(-chrome.pid);
} catch {
  /* уже завершён */
}
process.exit(0);
