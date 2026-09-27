/**
 * Проверка пошагового мастера записи на телефоне.
 *
 * Цель: убедиться, что на узких экранах форма показывается по шагам,
 * переходы работают, а на десктопе мастер не появляется.
 *
 * Запуск: node scripts/audit-wizard.mjs [url]
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

// 127.0.0.1, а не localhost: в этом окружении next start слушает на IPv6,
// а имя localhost в headless Chrome уходит на ::1 и соединение не проходит.
// Страховка в loadAt: если страница не открылась, аудит падает с ошибкой,
// а не молча «проверяет» chrome-error:// и рапортует о выдуманных полях.
// Сервер для проверок поднимайте так: npm run start -- -p 3100 -H 0.0.0.0
const URL_TO_CHECK = process.argv[2] ?? "http://127.0.0.1:3000";
const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
// Порт CDP выбираем случайно: если предыдущий прогон не успел завершиться,
// его Chrome ещё держит 9222–9223, и новый процесс молча подключается к
// мёртвой цели — скрипт зависает без единого сообщения.
const PORT = Number(process.env.CDP_PORT ?? 9300 + Math.floor(Math.random() * 400));
const HEIGHT = 800;

// Свой профиль на каждый прогон: без этого переиспользуется уже запущенный
// Chrome (с его старым состоянием и занятым портом) — и скрипт зависает,
// молча подключившись к мёртвой цели вместо своей.
const userDataDir = path.join(os.tmpdir(), `fantom-audit-${process.pid}-${PORT}`);

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
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
console.error("CDP поднят");
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
  if (r.result?.exceptionDetails) {
    const d = r.result.exceptionDetails;
    throw new Error(`${d.text} :: ${d.exception?.description ?? ""}`);
  }
  return r.result?.result?.value;
}

await send("Page.enable");
await send("Runtime.enable");

async function loadAt(width) {
  console.error(`  загрузка @${width}px ...`);
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: HEIGHT,
    deviceScaleFactor: 2,
    mobile: width < 768,
  });
  await send("Page.navigate", { url: URL_TO_CHECK });
  for (let i = 0; i < 60; i++) {
    const ready = await evaluate("document.readyState");
    const hasForm = await evaluate("!!document.querySelector('form')");
    if (ready === "complete" && hasForm) break;
    await sleep(250);
  }
  // Без этой проверки аудит молча «проходит» по странице ошибок Chrome:
  // все поля не найдены, но шаги кликабельны, и вывод выглядит правдоподобно.
  const sanity = await evaluate(
    "({ href: location.href, forms: document.querySelectorAll('form').length, nodes: document.querySelectorAll('body *').length })",
  );
  if (sanity.href.startsWith("chrome-error") || sanity.forms === 0 || sanity.nodes < 100) {
    throw new Error(
      `Страница не загрузилась @${width}px: ${JSON.stringify(sanity)}. Аудит недействителен.`,
    );
  }
  await sleep(700);
}

/** Снимок состояния мастера: какой шаг виден и что на экране. */
const SNAPSHOT = `(() => {
  const form = document.querySelector('form');
  if (!form) return { error: 'форма не найдена' };
  const stepText = [...form.querySelectorAll('p')]
    .map(p => p.textContent.trim())
    .find(t => /^Шаг \\d+ из /.test(t)) ?? null;
  const legend = (re) => {
    const l = [...form.querySelectorAll('legend')].find(x => re.test(x.textContent.trim()));
    return l ? l.textContent.trim() : null;
  };
  const has = (t) => [...form.querySelectorAll('button')].some(b => b.textContent.trim() === t);
  return {
    step: stepText,
    questPicker: !!form.querySelector('input[name="quest"]'),
    dateFieldset: !!legend(/^Дата$/),
    timeFieldset: !!legend(/^Время$/),
    nameField: !!form.querySelector('#name'),
    phoneField: !!form.querySelector('#phone'),
    playersField: !!form.querySelector('#players'),
    nextBtn: has('Далее'),
    backBtn: has('Назад'),
    submitBtn: has('Отправляем…') || has('Забронировать место'),
    formHeight: form.getBoundingClientRect().height,
    docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
})()`;

const clickText = (text) => `(() => {
  const form = document.querySelector('form');
  if (!form) return 'no form: ' + location.href + ' len=' + document.body.innerHTML.length;
  const b = [...form.querySelectorAll('button')].find(x => x.textContent.trim() === ${JSON.stringify(text)});
  if (!b) return 'not found: ' + [...form.querySelectorAll('button')].map(x => x.textContent.trim()).join('|');
  b.click();
  return 'ok';
})()`;

const results = [];
let failures = 0;
function check(width, label, ok, detail) {
  results.push({ width, label, ok, detail });
  if (!ok) failures++;
}

// ---------- Телефоны: мастер ----------
for (const width of [320, 375, 414]) {
  await loadAt(width);

  const s1 = await evaluate(SNAPSHOT);
  check(width, "шапка мастера видна", !!s1.step, JSON.stringify(s1.step));
  check(width, "шаг 1: только выбор квеста",
    s1.questPicker && !s1.dateFieldset && !s1.nameField,
    `quest=${s1.questPicker} date=${s1.dateFieldset} name=${s1.nameField}`);
  check(width, "кнопка «Далее» вместо отправки", s1.nextBtn && !s1.submitBtn,
    `next=${s1.nextBtn} submit=${s1.submitBtn}`);
  check(width, "нет горизонтального переполнения", s1.docOverflow <= 0,
    `overflow=${s1.docOverflow}px`);

  // Форма не должна быть выше ~2.5 экранов — ради этого мастер и делался
  const vh = await evaluate("window.innerHeight");
  check(width, "высота формы ≤ 2.5 экранов", s1.formHeight <= vh * 2.5,
    `form=${Math.round(s1.formHeight)}px, 2.5 экрана=${Math.round(vh * 2.5)}px`);

  await evaluate(clickText("Далее"));
  await sleep(350);
  const s2 = await evaluate(SNAPSHOT);
  check(width, "шаг 2: дата и время, квеста нет",
    !s2.questPicker && s2.dateFieldset && s2.timeFieldset,
    `quest=${s2.questPicker} date=${s2.dateFieldset} time=${s2.timeFieldset}`);
  check(width, "появилась кнопка «Назад»", s2.backBtn, `back=${s2.backBtn}`);
  check(width, "нет переполнения на шаге 2", s2.docOverflow <= 0, `overflow=${s2.docOverflow}px`);

  await evaluate(clickText("Далее"));
  await sleep(350);
  const s3 = await evaluate(SNAPSHOT);
  check(width, "шаг 3: контакты, кнопка отправки",
    s3.nameField && s3.phoneField && s3.playersField && s3.submitBtn,
    `name=${s3.nameField} phone=${s3.phoneField} players=${s3.playersField} submit=${s3.submitBtn}`);
  check(width, "нет переполнения на шаге 3", s3.docOverflow <= 0, `overflow=${s3.docOverflow}px`);

  await evaluate(clickText("Назад"));
  await sleep(350);
  const s4 = await evaluate(SNAPSHOT);
  check(width, "«Назад» возвращает на шаг 2", s4.dateFieldset && !s4.nameField,
    `date=${s4.dateFieldset} name=${s4.nameField}`);

  const jumped = await evaluate(`(() => {
    const form = document.querySelector('form');
    if (!form) return { err: 'no form' };
    // Именно button[aria-label^="Шаг "]: у контейнера прогресс-бара тоже
    // есть aria-label="Шаг записи", и он идёт первым по DOM
    const dots = [...form.querySelectorAll('button[aria-label^="Шаг "]')];
    const labels = dots.map(d => d.getAttribute('aria-label'));
    if (!dots.length) return { err: 'no dots' };
    dots[0].click();
    return { err: null, labels };
  })()`);
  await sleep(400);
  const s5 = await evaluate(SNAPSHOT);
  check(width, "переход по прогресс-бару",
    jumped.err === null && s5.questPicker && s5.step?.includes("1 из"),
    `dots=${JSON.stringify(jumped)} step=${JSON.stringify(s5.step)} quest=${s5.questPicker}`);
}

// ---------- Планшет и десктоп: полная форма ----------
for (const width of [768, 1440]) {
  await loadAt(width);
  const s = await evaluate(SNAPSHOT);
  check(width, "мастер скрыт на десктопе", s.step === null, `step=${JSON.stringify(s.step)}`);
  check(width, "видны все поля сразу",
    s.questPicker && s.dateFieldset && s.timeFieldset && s.nameField && s.phoneField && s.playersField,
    JSON.stringify(s));
  check(width, "нет кнопки «Далее»", !s.nextBtn, `next=${s.nextBtn}`);
  check(width, "нет горизонтального переполнения", s.docOverflow <= 0, `overflow=${s.docOverflow}px`);
}

function cleanup() {
  try {
    chrome.kill();
  } catch {
    /* уже мёртв */
  }
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {
    /* временный файл — не страшно */
  }
}

console.log("\n=== Мастер записи ===\n");
for (const r of results) {
  console.log(`${r.ok ? "OK  " : "FAIL"} ${String(r.width).padStart(4)}px  ${r.label}${r.ok ? "" : "  → " + r.detail}`);
}
console.log(`\nПроверок: ${results.length}, провалено: ${failures}`);

// Диагностика кнопок зума Leaflet: размер считаем не по атрибуту,
// а через getBoundingClientRect после применённых стилей
await loadAt(375);
const zoom = await evaluate(`(() => {
  const own = [...document.querySelectorAll('button[aria-label*="арту"]')];
  return {
    own: own.map(b => {
      const r = b.getBoundingClientRect();
      return { label: b.getAttribute('aria-label'), w: Math.round(r.width), h: Math.round(r.height) };
    }),
    leftoverLeafletZoom: document.querySelectorAll('.leaflet-control-zoom a').length,
  };
})()`);
console.log("\n=== Кнопки зума карты @375px ===");
console.log(JSON.stringify(zoom, null, 2));

chrome.kill();
cleanup();
process.exit(failures > 0 ? 1 : 0);
