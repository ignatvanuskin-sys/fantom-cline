import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Приём заявки с сайта → мгновенное уведомление владельцу в Telegram.
 *
 * У обработчика два входа:
 *   1. JSON из формы на сайте (fetch) — основной путь;
 *   2. обычная отправка формы (application/x-www-form-urlencoded), если JS
 *      не загрузился или выключен. Введённые данные и в этом случае уходят
 *      телом POST-запроса, а не в адресную строку, и клиент получает простую
 *      HTML-страницу с подтверждением вместо JSON.
 *
 * Настройка (см. README):
 *   TELEGRAM_BOT_TOKEN — токен бота от @BotFather
 *   TELEGRAM_CHAT_ID   — id чата/группы, куда слать заявки
 */
type Payload = {
  questId?: string;
  questName?: string;
  date?: string;
  time?: string;
  players?: number;
  name?: string;
  phone?: string;
  consent?: boolean;
};

/** Экранирование того, что попадает в HTML-ответ без-JS клиенту. */
function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Простая страница для случая «форма отправлена без JS». */
function htmlPage(status: number, title: string, body: string) {
  return new NextResponse(
    `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(
      title,
    )}</title><style>body{margin:0;background:#0a0a0a;color:#c9c9c9;font:16px/1.6 system-ui,sans-serif}main{max-width:34rem;margin:0 auto;padding:48px 20px}h1{color:#e04a4e;font-size:22px;margin:0 0 12px}a{color:#e04a4e}</style></head><body><main><h1>${esc(
      title,
    )}</h1>${body}</main></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

/** Поля обычной формы приходят строками — приводим их к виду JSON-запроса. */
function fromForm(form: FormData): Payload {
  const str = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value : undefined;
  };
  const players = str("players");
  return {
    // В разметке имя радиокнопки — quest, в JSON-ветке — questId
    questId: str("questId") ?? str("quest"),
    questName: str("questName"),
    date: str("date"),
    time: str("time"),
    players: players ? Number(players) : undefined,
    name: str("name"),
    phone: str("phone"),
    // Чекбокс согласия браузер отправляет только когда галочка стоит
    consent: form.get("consent") !== null,
  };
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isFormPost =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");

  let body: Payload;
  try {
    body = isFormPost
      ? fromForm(await request.formData())
      : await request.json();
  } catch {
    return isFormPost
      ? htmlPage(
          400,
          "Заявку не приняли",
          '<p>Не удалось прочитать форму.</p><p><a href="/#booking">Вернуться к записи</a></p>',
        )
      : NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { questName, date, time, players, name, phone } = body;

  // Серверная валидация — клиентскую нельзя считать достаточной
  const problem =
    !name || name.trim().length < 2
      ? "Укажите имя"
      : !phone || phone.replace(/\D/g, "").length !== 11
        ? "Укажите телефон"
        : !date || !time
          ? "Выберите дату и время"
          : !body.consent
            ? "Нужно согласие на обработку персональных данных"
            : null;

  if (problem) {
    return isFormPost
      ? htmlPage(
          400,
          "Заявку не приняли",
          `<p>${esc(problem)}.</p><p><a href="/#booking">Вернуться к записи</a></p>`,
        )
      : NextResponse.json({ error: problem }, { status: 400 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Без настроенного бота заявка всё равно принимаем (200),
  // чтобы форму можно было демонстрировать клиенту до подключения.
  if (!token || !chatId) {
    console.warn("[booking] TELEGRAM_BOT_TOKEN/CHAT_ID не заданы — заявка:", {
      questName,
      date,
      time,
      players,
      name,
      phone,
    });
    return isFormPost
      ? htmlPage(
          200,
          "Заявка принята",
          '<p>Администратор перезвонит, чтобы подтвердить время.</p><p><a href="/">Вернуться на сайт</a></p>',
        )
      : NextResponse.json({ ok: true, delivered: false });
  }

  const text = [
    "🔴 Новая заявка — Fantom",
    "",
    `Квест: ${questName ?? body.questId ?? "—"}`,
    `Дата: ${date} в ${time}`,
    `Игроков: ${players ?? "—"}`,
    "",
    `Имя: ${name!.trim()}`,
    `Телефон: ${phone!.trim()}`,
  ].join("\n");

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          // отключаем разметку, чтобы имена с подчёркиваниями не ломали текст
          parse_mode: undefined,
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[booking] Telegram error:", res.status, err);
      return isFormPost
        ? htmlPage(
            502,
            "Заявку не приняли",
            '<p>Не удалось отправить уведомление.</p><p>Позвоните нам, и мы всё оформим. <a href="/#booking">Вернуться к записи</a></p>',
          )
        : NextResponse.json(
            { error: "Не удалось отправить уведомление" },
            { status: 502 },
          );
    }

    return isFormPost
      ? htmlPage(
          200,
          "Заявка принята",
          `<p>${esc(questName ?? "Квест")} · ${esc(date ?? "")} в ${esc(
            time ?? "",
          )} · ${esc(String(players ?? "—"))} чел.</p><p>Администратор перезвонит для подтверждения.</p><p><a href="/">Вернуться на сайт</a></p>`,
        )
      : NextResponse.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("[booking] Telegram request failed:", err);
    return isFormPost
      ? htmlPage(
          502,
          "Заявку не приняли",
          '<p>Не удалось отправить уведомление.</p><p>Позвоните нам, и мы всё оформим. <a href="/#booking">Вернуться к записи</a></p>',
        )
      : NextResponse.json(
          { error: "Не удалось отправить уведомление" },
          { status: 502 },
        );
  }
}
