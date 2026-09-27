import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Приём заявки с сайта → мгновенное уведомление владельцу в Telegram.
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
};

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { questName, date, time, players, name, phone } = body;

  // Серверная валидация — клиентскую нельзя считать достаточной
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Укажите имя" }, { status: 400 });
  }
  if (!phone || phone.replace(/\D/g, "").length !== 11) {
    return NextResponse.json({ error: "Укажите телефон" }, { status: 400 });
  }
  if (!date || !time) {
    return NextResponse.json({ error: "Выберите дату и время" }, { status: 400 });
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
    return NextResponse.json({ ok: true, delivered: false });
  }

  const text = [
    "🔴 Новая заявка — Fantom",
    "",
    `Квест: ${questName ?? body.questId ?? "—"}`,
    `Дата: ${date} в ${time}`,
    `Игроков: ${players ?? "—"}`,
    "",
    `Имя: ${name.trim()}`,
    `Телефон: ${phone.trim()}`,
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
      return NextResponse.json(
        { error: "Не удалось отправить уведомление" },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("[booking] Telegram request failed:", err);
    return NextResponse.json(
      { error: "Не удалось отправить уведомление" },
      { status: 502 },
    );
  }
}
