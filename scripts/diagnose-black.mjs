/**
 * Диагностика «чёрного экрана» на телефоне.
 *
 * Аудит мастера проверяет DOM, но не отвечает на вопрос «виден ли
 * вообще контент». Здесь снимаем скриншот на мобильном вьюпорте,
 * ловим ошибки консоли и необработанные исключения, и считаем,
 * сколько в документе видимых пикселей.
 *
 * Запуск: node scripts/diagnose-black.mjs [url]
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const URL_TO_CHECK = process.argv[2] ?? "http://127.0.0.1:3100";
const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = Number(process.env.CDP_PORT ?? 9800 + Math.floor(Math.random() * 150));
const userDataDir = path.join(os.tmpdir(), `fantom-diag-${process.pid}-${PORT}`);

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    // Без этого флага headless отдаёт заглушку WebGL, и мы не проверяем
    // тот код, который реально крутится на телефоне. SwiftShader — программный
    // растеризатор: медленно, но рисует по-настоящему.
    "--use-gl=swiftshader",
    "--enable-unsafe-swiftshader",
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

const ws = new WebSocket(await cdpTargets());
await new Promise((res, rej) => {
  ws.addEventListener("open", res, { once: true });
  ws.addEventListener("error", rej, { once: true });
});

let id = 0;
const pending = new Map();
/** Ошибки и предупреждения, собранные со страницы */
const problems = [];

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === "Runtime.exceptionThrown") {
    const d = msg.params?.exceptionDetails;
    problems.push({
      kind: "exception",
      text: d?.exception?.description ?? d?.text ?? "?",
    });
  }
  if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) {
    problems.push({
      kind: msg.params.type,
      text: (msg.params.args ?? [])
        .map((a) => a.description ?? a.value ?? "")
        .join(" ")
        .slice(0, 400),
    });
  }
  if (msg.method === "Log.entryAdded" && ["error"].includes(msg.params?.entry?.level)) {
    problems.push({ kind: "log", text: msg.params.entry.text.slice(0, 400) });
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
  if (r.result?.exceptionDetails) {
    throw new Error(
      `${r.result.exceptionDetails.text} :: ${r.result.exceptionDetails.exception?.description ?? ""}`,
    );
  }
  return r.result?.result?.value;
}


/** Ключевой сценарий: JS отключён. Раньше страница превращалась
 *  в чёрный экран, потому что контент скрывался через opacity:0
 *  в серверном HTML. Теперь контент обязан быть виден всегда. */
await send("Emulation.setDeviceMetricsOverride", {
  width: 375, height: 667, deviceScaleFactor: 2, mobile: true,
});
await send("Page.navigate", { url: URL_TO_CHECK });
await sleep(3000);

const before = await evaluate(`document.documentElement.classList.contains('js-ready')`);
console.error("js-ready ДО отключения JS:", before);

// Гасим JS и перезагружаем страницу
await send("Emulation.setScriptExecutionDisabled", { value: true });
await send("Page.reload", { ignoreCache: false });
await sleep(4000);

const noJs = await evaluate(`(() => {
  const form = document.querySelector('#booking form');
  const reveals = [...document.querySelectorAll('.reveal-dark')];
  const hidden = reveals.filter(el => parseFloat(getComputedStyle(el).opacity) < 0.05);
  const r = form ? form.getBoundingClientRect() : null;
  return {
    jsReady: document.documentElement.classList.contains('js-ready'),
    totalReveals: reveals.length,
    hiddenReveals: hidden.length,
    formFound: !!form,
    formOpacity: form ? getComputedStyle(form).opacity : null,
    formWidth: r ? Math.round(r.width) : null,
    formHeight: r ? Math.round(r.height) : null,
    // Сколько текста реально видно пользователю
    visibleText: (document.body.innerText || '').trim().length,
  };
})()`);

console.error("\n=== БЕЗ JAVASCRIPT ===");
for (const [k, v] of Object.entries(noJs)) {
  console.error("  " + k + ": " + v);
}

const shotFinal = await send("Page.captureScreenshot", { format: "png" });
if (shotFinal.result?.data) {
  writeFileSync(".build/no-js.png", Buffer.from(shotFinal.result.data, "base64"));
  console.error("\n  скриншот: .build/no-js.png");
}

// Далее — проверка пути пользователя с включённым JS на том же браузере,
// поэтому здесь нужен новый запуск страницы, а не завершение процесса.

/** Повторяем реальный путь юзера: тап по «ЗАПИСЬ» в шапке. */
await send("Emulation.setDeviceMetricsOverride", {
  width: 375,
  height: 667,
  deviceScaleFactor: 2,
  mobile: true,
});
await send("Page.navigate", { url: URL_TO_CHECK });
await sleep(6000);

const tapBooking = await evaluate(`(() => {
  // Ищем ссылку/кнопку «Записаться» в шапке — как это делает палец
  const link = [...document.querySelectorAll('a[href*="booking"], header button, header a')]
    .find(a => /запис/i.test(a.textContent || ''));
  if (!link) return 'нет ссылки';
  link.scrollIntoView();
  link.click();
  return 'клик по: ' + (link.textContent || '').trim();
})()`);
console.error("тап по шапке:", tapBooking);

for (const wait of [1000, 2000, 4000]) {
  await sleep(wait);
  const st = await evaluate(`(() => {
    const sec = document.getElementById('booking');
    const r = sec ? sec.getBoundingClientRect() : null;
    // Раскрылись ли элементы ВНУТРИ секции записи
    const inside = [...document.querySelectorAll('#booking .reveal-dark')];
    const hidden = inside.filter(el => parseFloat(getComputedStyle(el).opacity) < 0.05);
    const form = document.querySelector('#booking form');
    return {
      scrollY: Math.round(scrollY),
      bookingTop: r ? Math.round(r.top) : null,
      bookingVisibleH: r ? Math.round(Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) : 0,
      bookingHeight: r ? Math.round(r.height) : 0,
      revealInSection: inside.length,
      stillHidden: hidden.length,
      // Размытие держится дольше opacity и тоже делает блок нечитаемым
      stillBlurred: inside.filter(el => {
        const f = getComputedStyle(el).filter;
        const m = /blur\\(([\\d.]+)px\\)/.exec(f);
        return m && parseFloat(m[1]) > 0.4;
      }).length,
      // Подробности по каждому reveal внутри секции: без них непонятно,
      // почему blur не уходит — гадать по одному счётчику бесполезно
      detail: inside.map(el => ({
        cls: el.className.slice(0, 60),
        op: getComputedStyle(el).opacity,
        filter: getComputedStyle(el).filter,
        tr: getComputedStyle(el).transform.slice(0, 30),
      })),
      formOpacity: form ? getComputedStyle(form).opacity : 'нет формы',
      formRect: form ? (() => { const f = form.getBoundingClientRect(); return Math.round(f.top) + '..' + Math.round(f.bottom); })() : null,
    };
  })()`);
  console.error("\nчерез " + wait + "мс:", JSON.stringify(st));

  const shot = await send("Page.captureScreenshot", { format: "png" });
  if (shot.result?.data) writeFileSync(`.build/after-tap-${wait}.png`, Buffer.from(shot.result.data, "base64"));
}

if (problems.length) {
  console.error("\nошибки:");
  for (const p of problems.slice(0, 10)) {
    console.error(`  [${p.kind}] ${p.text.split("\n")[0].slice(0, 200)}`);
  }
}

chrome.kill();
process.exit(0);


/** Считаем, что на телефоне реально ломается: гидрация, WebGL, видимость. */
await send("Emulation.setDeviceMetricsOverride", {
  width: 375,
  height: 667,
  deviceScaleFactor: 2,
  mobile: true,
});
await send("Page.navigate", { url: URL_TO_CHECK });
await sleep(7000);

const probe = await evaluate(`(() => {
  // 1. Гидрация: React должен был смонтировать обработчики
  const form = document.querySelector('form');
  const hero = document.getElementById('hero');
  // 2. Сколько секций осталось с opacity 0 — они невидимы навсегда
  const dark = [...document.querySelectorAll('.reveal-dark')];
  const stuck = dark.filter(el => {
    const s = getComputedStyle(el);
    return parseFloat(s.opacity) < 0.05 && !el.classList.contains('reveal-dark-visible');
  });
  // 3. WebGL жив ли
  const cv = document.querySelector('canvas');
  let glInfo = 'нет canvas';
  if (cv) {
    const gl = cv.getContext('webgl') || cv.getContext('experimental-webgl');
    glInfo = gl ? 'контекст есть' : 'контекст null';
    if (gl) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      glInfo += ', renderer: ' + (dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '?');
      glInfo += ', lost: ' + gl.isContextLost();
    }
  }
  return {
    formFound: !!form,
    formButtons: form ? form.querySelectorAll('button').length : 0,
    // Реакт навесил слушатель? Проверяем через наличие интерактивного счётчика
    revealTotal: dark.length,
    revealStuck: stuck.length,
    stuckSections: stuck.slice(0, 5).map(el => ({
      cls: (el.className || '').toString().slice(0, 50),
      top: Math.round(el.getBoundingClientRect().top),
    })),
    heroOpacity: hero ? getComputedStyle(hero).opacity : null,
    glInfo,
    // Главное: реальные пиксели в верхней части страницы
    bodyBg: getComputedStyle(document.body).backgroundColor,
  };
})()`);

console.error("\n=== ПРОБА ===");
for (const [k, v] of Object.entries(probe)) {
  console.error("  " + k + ": " + (typeof v === "object" ? JSON.stringify(v) : v));
}
if (problems.length) {
  console.error("\n=== ОШИБКИ СТРАНИЦЫ ===");
  for (const p of problems.slice(0, 12)) {
    console.error(`  [${p.kind}] ${p.text.split("\n").slice(0, 2).join(" | ").slice(0, 220)}`);
  }
} else {
  console.error("\n  ошибок в консоли нет");
}

const shot = await send("Page.captureScreenshot", { format: "png" });
if (shot.result?.data) {
  writeFileSync(".build/probe.png", Buffer.from(shot.result.data, "base64"));
  console.error("\n  скриншот: .build/probe.png");
}

chrome.kill();
process.exit(0);

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");


/** Прокручиваемся к секции записи и снимаем КАЖДЫЙ шаг мастера. */
const d = { width: 375, height: 667, dpr: 2, mobile: true };

await send("Emulation.setDeviceMetricsOverride", {
  width: d.width,
  height: d.height,
  deviceScaleFactor: d.dpr,
  mobile: d.mobile,
});
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Page.navigate", { url: URL_TO_CHECK });
await sleep(5000);

const clickByText = (text) => `(() => {
  const form = document.querySelector('form');
  if (!form) return 'no form';
  const b = [...form.querySelectorAll('button')].find(x => x.textContent.trim() === ${JSON.stringify(text)});
  if (!b) return 'not found';
  b.scrollIntoView({ block: 'center' });
  b.click();
  return 'ok';
})()`;

for (const step of [1, 2, 3]) {
  if (step > 1) {
    const r = await evaluate(clickByText("Далее"));
    console.error(`\n--- переход на шаг ${step}: ${r} ---`);
    await sleep(900);
  }
  // Прокрутка к самой форме
  await evaluate(`(() => {
    const f = document.querySelector('form');
    if (f) f.scrollIntoView({ block: 'start' });
  })()`);
  await sleep(1200);

  const state = await evaluate(`(() => {
    const form = document.querySelector('form');
    const r = form ? form.getBoundingClientRect() : null;
    // Что реально перекрывает форму в центре экрана
    const midY = innerHeight / 2;
    const stack = document.elementsFromPoint(innerWidth / 2, midY).slice(0, 5).map(el => ({
      tag: el.tagName,
      cls: (el.className || '').toString().slice(0, 55),
      z: getComputedStyle(el).zIndex,
      bg: getComputedStyle(el).backgroundColor,
      op: getComputedStyle(el).opacity,
    }));
    return {
      formTop: r ? Math.round(r.top) : null,
      formHeight: r ? Math.round(r.height) : null,
      formOpacity: form ? getComputedStyle(form).opacity : null,
      scrollY: Math.round(scrollY),
      stack,
    };
  })()`);

  console.error("  форма top=" + state.formTop + " h=" + state.formHeight + " opacity=" + state.formOpacity);
  console.error("  что в центре экрана (сверху вниз):");
  for (const el of state.stack) {
    console.error(`    <${el.tag}> z=${el.z} bg=${el.bg} op=${el.op} ${el.cls}`);
  }

  const shot = await send("Page.captureScreenshot", { format: "png" });
  const f = `.build/step${step}.png`;
  if (shot.result?.data) writeFileSync(f, Buffer.from(shot.result.data, "base64"));
  console.error("  скриншот:", f);
}

if (problems.length) {
  console.error("\n  ОШИБКИ:");
  for (const p of problems.slice(0, 10)) {
    console.error(`    [${p.kind}] ${p.text.split("\n")[0].slice(0, 180)}`);
  }
}

chrome.kill();
process.exit(0);


/** Реальный мобильный профиль: user agent важнее ширины. */
const DEVICES = [
  { name: "iPhoneSE", width: 375, height: 667, dpr: 2, mobile: true },
  { name: "iPhone14Pro", width: 393, height: 852, dpr: 3, mobile: true },
  { name: "Android360", width: 360, height: 800, dpr: 3, mobile: true },
];

for (const d of DEVICES) {
  console.error(`\n=== ${d.name} (${d.width}x${d.height} @${d.dpr}x) ===`);
  problems.length = 0;

  await send("Emulation.setDeviceMetricsOverride", {
    width: d.width,
    height: d.height,
    deviceScaleFactor: d.dpr,
    mobile: d.mobile,
  });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Emulation.setUserAgentOverride", {
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
      "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iPhone",
  });

  await send("Page.navigate", { url: URL_TO_CHECK });
  // Ждём и первый рендер, и гидратацию: чёрный экран часто это
  // исключение при hydrate, а не при загрузке HTML
  await sleep(6000);

  const info = await evaluate(`(() => {
    const body = document.body;
    const cs = getComputedStyle(body);
    let visibleArea = 0, visibleText = 0;
    for (const el of body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') continue;
      if (parseFloat(s.opacity) === 0) continue;
      if (r.top > window.innerHeight * 3) continue;
      visibleArea += r.width * r.height;
      if (el.children.length === 0 && (el.textContent || '').trim()) visibleText++;
    }
    return {
      href: location.href,
      bodyText: (body.innerText || '').trim().slice(0, 160),
      rootChildren: document.getElementById('__next')?.children.length ?? -1,
      visibleArea: Math.round(visibleArea),
      viewportArea: window.innerWidth * window.innerHeight,
      visibleTextNodes: visibleText,
      overlays: [...body.querySelectorAll('div,section')]
        .filter(el => {
          const s = getComputedStyle(el);
          if (s.position !== 'fixed' && s.position !== 'absolute') return false;
          if (parseFloat(s.opacity || '1') < 0.05) return false;
          const r = el.getBoundingClientRect();
          return r.width >= innerWidth * 0.95 && r.height >= innerHeight * 0.95;
        })
        .map(el => ({
          cls: (el.className || '').toString().slice(0, 70),
          bg: getComputedStyle(el).backgroundColor,
          op: getComputedStyle(el).opacity,
          z: getComputedStyle(el).zIndex,
        }))
        .slice(0, 6),
    };
  })()`);

  const shot = await send("Page.captureScreenshot", { format: "png" });
  const file = `.build/shot-${d.name}.png`;
  if (shot.result?.data) writeFileSync(file, Buffer.from(shot.result.data, "base64"));

  console.error("  текст на экране:", JSON.stringify(info.bodyText.slice(0, 110)));
  console.error("  детей в #__next:", info.rootChildren);
  console.error(
    "  видимая площадь:",
    info.visibleArea,
    "/",
    info.viewportArea,
    `(${(info.visibleArea / info.viewportArea).toFixed(0)}% вьюпорта)`,
  );
  console.error("  узлов с текстом:", info.visibleTextNodes);
  for (const o of info.overlays) {
    console.error(`  ОВЕРЛЕЙ [z=${o.z}] ${o.bg} op=${o.op}  ${o.cls}`);
  }
  for (const p of problems.slice(0, 10)) {
    console.error(`  ОШИБКА [${p.kind}] ${p.text.split("\n")[0].slice(0, 180)}`);
  }
  console.error("  скриншот:", file);
}

chrome.kill();
process.exit(0);
