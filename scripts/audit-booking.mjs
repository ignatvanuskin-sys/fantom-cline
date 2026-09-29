/**
 * Регрессионный тест: проходит запись на телефоне как живой человек.
 *
 * Проверяет то, чего не видит обычный аудит — поведение по шагам:
 *  1) одиночное касание бургера открывает меню;
 *  2) пункт меню «Забронировать место» закрывает меню и доводит до формы;
 *  3) липкая панель записи видна и ПОСЛЕ формы, а не только до неё;
 *  4) нажатая дата отмечается именно та, по которой попали пальцем;
 *  5) «Далее» без выбранного времени не пускает дальше и ставит фокус в часы;
 *  6) пустая отправка называет поле и переводит в него фокус.
 *
 * Две тонкости, без которых тест врёт:
 *  — нажатия отправляются ТОЛЬКО как касания (Input.dispatchTouchEvent).
 *    Если добавить mousePressed/mouseReleased, Chrome сгенерирует второй
 *    click, обработчик переключит состояние дважды, и меню, открывшись,
 *    сразу закроется — это баг теста, а не сайта;
 *  — плавная прокрутка выключается. С глобальным `scroll-behavior: smooth`
 *    страница продолжает ехать в момент касания, кнопка уезжает из-под
 *    пальца, и тап достаётся соседу.
 *
 * Запуск: node scripts/audit-booking.mjs [url]
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const URL_TO_CHECK = process.argv[2] ?? "http://localhost:3100";
const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9228;
const OUT = path.join(".build", "repro");

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
const logs = [];
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type !== "log") {
    logs.push("console." + msg.params.type + ": " +
      (msg.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(" ").slice(0, 200));
  }
  if (msg.method === "Runtime.exceptionThrown") {
    logs.push("EXCEPTION: " + String(msg.params.exceptionDetails?.exception?.description ?? "").slice(0, 200));
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
  if (r.result?.exceptionDetails) return { __err: r.result.exceptionDetails.text };
  return r.result?.result?.value;
};
const shot = async (name) => {
  mkdirSync(OUT, { recursive: true });
  const s = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(path.join(OUT, name + ".png"), Buffer.from(s.result.data, "base64"));
};

/**
 * Тап по элементу, найденному по селектору или по тексту.
 * Перед касанием печатаем, что реально лежит в точке: если цель
 * перекрыта другим слоем, это видно сразу.
 */
async function tap({ sel, text, scope, label }) {
  const found = await evaluate(`(() => {
    const scope = ${scope ? `document.querySelector(${JSON.stringify(scope)})` : "document"};
    if (!scope) return null;
    let el = null;
    if (${JSON.stringify(sel ?? null)}) el = scope.querySelector(${JSON.stringify(sel ?? "")});
    else {
      const t = ${JSON.stringify(text ?? "")};
      el = [...scope.querySelectorAll("a, button, label, input, [role=button]")]
        .find((e) => (e.textContent || "").trim().includes(t));
    }
    if (!el) return null;
    // behavior: instant — иначе на сайте с глобальным scroll-behavior:smooth
    // прокрутка продолжается в момент касания, элемент уезжает из-под
    // пальца, и тап достаётся соседу.
    el.scrollIntoView({ block: "center", behavior: "instant" });
    return true;
  })()`);
  if (!found) return console.log(`   ✗ ${label}: не найден`);

  await sleep(500);
  const box = await evaluate(`(() => {
    const scope = ${scope ? `document.querySelector(${JSON.stringify(scope)})` : "document"};
    let el = null;
    if (${JSON.stringify(sel ?? null)}) el = scope.querySelector(${JSON.stringify(sel ?? "")});
    else {
      const t = ${JSON.stringify(text ?? "")};
      el = [...scope.querySelectorAll("a, button, label, input, [role=button]")]
        .find((e) => (e.textContent || "").trim().includes(t));
    }
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return { zero: true };
    const at = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
    return {
      x: Math.round(r.left + r.width / 2),
      y: Math.round(r.top + r.height / 2),
      w: Math.round(r.width), h: Math.round(r.height),
      at: at ? at.tagName.toLowerCase() + (at.className ? "." + at.className.toString().split(" ")[0] : "") : "пусто",
      mine: !!at && (at === el || el.contains(at) || at.contains(el)),
    };
  })()`);

  if (!box || box.zero) return console.log(`   ✗ ${label}: нулевой размер`);
  if (box.y < 4 || box.y > 808) return console.log(`   ✗ ${label}: центр вне экрана y=${box.y}`);

  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x, y: box.y }] });
  await sleep(60);
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

  console.log(
    `   ${box.mine ? "✓" : "⚠"} ${label}  (${box.x},${box.y}) ${box.w}×${box.h}  под пальцем: ${box.at}`,
  );
}

const STATE = `(() => {
  const menu = document.getElementById("mobile-menu");
  const bar = document.querySelector('[data-testid="sticky-booking"]');
  const booking = document.getElementById("booking");
  const step = [...document.querySelectorAll("#booking p, #booking span")]
    .map((e) => e.textContent.trim()).find((t) => /^Шаг \\d/.test(t));
  return {
    меню: menu ? "открыто" : "закрыто",
    липкаяПанель: bar ? (bar.hasAttribute("inert") ? "спрятана" : "видна") : "нет",
    шаг: step || null,
    scrollY: Math.round(window.scrollY),
    bookingTop: booking ? Math.round(booking.getBoundingClientRect().top) : null,
    ошибки: [...document.querySelectorAll('[role="alert"], [id$="-error"]')]
      .filter((e) => e.textContent.trim())
      .map((e) => e.textContent.trim().slice(0, 60)),
  };
})()`;

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 375, height: 812, deviceScaleFactor: 2, mobile: true,
});
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Page.navigate", { url: URL_TO_CHECK });
for (let i = 0; i < 60; i++) {
  const ready = await evaluate("document.readyState");
  const hero = await evaluate("!!document.getElementById('hero')");
  if (ready === "complete" && hero) break;
  await sleep(250);
}
await sleep(2200);

// Отключаем плавную прокрутку на время теста: она делает касания
// невоспроизводимыми (см. комментарий в tap()).
await evaluate("document.documentElement.style.scrollBehavior = 'auto'");

console.log("ШАГ 0\n   " + JSON.stringify(await evaluate(STATE)));
await shot("0-start");

console.log("\nШАГ 1 — одиночное касание бургера");
await tap({ sel: '[data-testid="menu-toggle"]', label: "бургер" });
await sleep(800);
console.log("   " + JSON.stringify(await evaluate(STATE)));
await shot("1-menu-open");

console.log("\nШАГ 2 — в меню «Забронировать место»");
await tap({ text: "Забронировать место", scope: "#mobile-menu", label: "CTA в меню" });
await sleep(1800);
console.log("   " + JSON.stringify(await evaluate(STATE)));
await shot("2-after-menu-cta");

console.log("\nШАГ 3 — проверяем состояние липкой панели по всей странице");
for (const y of [0, 900, 3000, 4400, 7000, 99999]) {
  await evaluate(`window.scrollTo(0, ${y})`);
  await sleep(700);
  const s = await evaluate(`(() => {
    const bar = document.querySelector('[data-testid="sticky-booking"]');
    const b = document.getElementById("booking");
    const r = b ? b.getBoundingClientRect() : null;
    return {
      y: Math.round(window.scrollY),
      панель: bar ? (bar.hasAttribute("inert") ? "спрятана" : "видна") : "нет",
      формаВКадре: r ? (r.top < window.innerHeight && r.bottom > 0) : null,
      formTop: r ? Math.round(r.top) : null,
      formBottom: r ? Math.round(r.bottom) : null,
    };
  })()`);
  console.log("   " + JSON.stringify(s));
}
await shot("3-sticky-scan");

console.log("\nШАГ 4 — форма: комната → дата → время → контакты");
await evaluate("document.getElementById('booking')?.scrollIntoView()");
await sleep(900);
await tap({ text: "Далее", scope: "#booking", label: "Далее (1→2)" });
await sleep(900);
console.log("   " + JSON.stringify(await evaluate(STATE)));
await shot("4-step2");

console.log("\n   --- выбор даты: сверяем, что отмечен именно нажатый день ---");
const dates = await evaluate(`(() => {
  return [...document.querySelectorAll('#booking input[name="date"]')].map((r, i) => {
    const lab = r.closest("label");
    return { i, value: r.value, text: lab ? lab.textContent.replace(/\\s+/g, " ").trim() : "" };
  });
})()`);
console.log("   всего дат: " + dates.length);
console.log("   первые три: " + JSON.stringify(dates.slice(0, 3)));
if (dates[1]) {
  // Жмём ВТОРУЮ дату и смотрим, какое значение отмечено.
  await evaluate(`(() => {
    document.querySelectorAll('#booking input[name="date"]')[1].closest("label")
      .setAttribute("data-probe", "date-2");
  })()`);
  await tap({ sel: '[data-probe="date-2"]', label: "вторая дата" });
  await sleep(500);
  const checked = await evaluate(`(() => {
    const r = document.querySelector('#booking input[name="date"]:checked');
    return r ? r.value : "ничего не отмечено";
  })()`);
  console.log(`   нажали «${dates[1].text}» → отмечено: ${checked} ${checked === dates[1].value ? "✅ совпадает" : "❌ НЕ СОВПАДАЕТ"}`);
}

console.log("\n   --- «Далее» без времени: должно объяснить и перевести фокус ---");
const beforeStep = await evaluate(`(() => {
  const t = [...document.querySelectorAll("#booking p, #booking span")].map((e) => e.textContent.trim()).find((x) => /^Шаг \\d/.test(x));
  return t || null;
})()`);
await tap({ text: "Далее", scope: "#booking", label: "Далее без выбранного времени" });
await sleep(800);
const after = await evaluate(STATE);
console.log("   шаг до: " + beforeStep);
console.log("   " + JSON.stringify(after));
console.log("   фокус: " + (await evaluate("document.activeElement ? (document.activeElement.name || document.activeElement.id || document.activeElement.tagName) : null")));
await shot("5-next-without-time");

console.log("\n   --- выбираем время и идём дальше ---");
const firstTime = await evaluate(`(() => {
  const l = document.querySelector('#booking input[name="time"]');
  if (!l) return null;
  const lab = l.closest("label");
  lab.setAttribute("data-probe", "time-1");
  return lab.textContent.replace(/\\s+/g, " ").trim().slice(0, 10);
})()`);
console.log("   первое время: " + firstTime);
if (firstTime) {
  await tap({ sel: '[data-probe="time-1"]', label: "время " + firstTime });
  await sleep(400);
}
console.log("   " + JSON.stringify(await evaluate(STATE)));
await shot("6-time-picked");
await tap({ text: "Далее", scope: "#booking", label: "Далее (2→3)" });
await sleep(900);
console.log("   " + JSON.stringify(await evaluate(STATE)));
await shot("7-step3");

console.log("\nШАГ 5 — пустая отправка: должна назвать первое поле и перевести фокус");
await tap({ text: "Забронировать место", scope: "#booking", label: "отправить пустую форму" });
await sleep(900);
console.log("   " + JSON.stringify(await evaluate(STATE)));
console.log("   фокус: " + (await evaluate("document.activeElement ? (document.activeElement.id || document.activeElement.name || document.activeElement.tagName) : null")));
await shot("8-empty-submit");

console.log("\n=== КОНСОЛЬ ===");
console.log(logs.length ? [...new Set(logs)].join("\n") : "(пусто)");

ws.close();
chrome.kill();
process.exit(0);
