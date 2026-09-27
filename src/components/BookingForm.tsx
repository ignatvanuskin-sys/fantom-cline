"use client";

import { useEffect, useMemo, useState } from "react";
import ClickSpark from "@/components/reactbits/ClickSpark";
import GlitchText from "@/components/reactbits/GlitchText";
import { sfx } from "@/components/horror/SoundToggle";
import { QUESTS, TIME_SLOTS, type Quest } from "@/data/quests";

/** Ближайшие 14 дней, начиная с завтра (сегодняшний день клиенты не выбирают). */
function buildDates() {
  const out: { iso: string; day: string; date: string; weekday: string }[] = [];
  const now = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    out.push({
      iso: d.toISOString().slice(0, 10),
      day: String(d.getDate()).padStart(2, "0"),
      date: d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
      weekday: d.toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", ""),
    });
  }
  return out;
}

/** Маска ввода казахстанского номера: +7 (777) 123-45-67 */
function formatPhone(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8")) digits = "7" + digits.slice(1);
  if (!digits.startsWith("7")) digits = "7" + digits;
  digits = digits.slice(0, 11);

  const p = digits.slice(1);
  let out = "+7";
  if (p.length) out += ` (${p.slice(0, 3)}`;
  if (p.length >= 3) out += ") ";
  if (p.length > 3) out += p.slice(3, 6);
  if (p.length > 6) out += `-${p.slice(6, 8)}`;
  if (p.length > 8) out += `-${p.slice(8, 10)}`;
  return out;
}

export type BookingFormProps = {
  /** Предзаполненный квест (из карточки/модалки) */
  initialQuestId?: string;
};

export default function BookingForm({ initialQuestId }: BookingFormProps) {
  // useMemo инлайновый — buildDates создаёт новый массив дат
  const dates = useMemo(() => buildDates(), []);

  const [questId, setQuestId] = useState<string>(
    initialQuestId ?? QUESTS[0]?.id ?? "",
  );
  const [date, setDate] = useState<string>(dates[0]?.iso ?? "");
  const [time, setTime] = useState<string>("");
  const [players, setPlayers] = useState<number>(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7 ");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string>("");

  const quest: Quest | undefined = QUESTS.find((q) => q.id === questId);

  // Предзаполнение из модалки квеста
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ questId: string }>).detail?.questId;
      if (id && QUESTS.some((q) => q.id === id)) {
        setQuestId(id);
        setPlayers((p) => {
          const q = QUESTS.find((x) => x.id === id);
          if (!q) return p;
          return Math.min(Math.max(p, q.minPlayers), q.maxPlayers);
        });
        setTime("");
        setStatus("idle");
      }
    };
    window.addEventListener("fantom:book", handler);
    return () => window.removeEventListener("fantom:book", handler);
  }, []);

  // Смена квеста сбрасывает время и подгоняет число игроков
  const changeQuest = (id: string) => {
    setQuestId(id);
    setTime("");
    setStatus("idle");
    const q = QUESTS.find((x) => x.id === id);
    if (q) setPlayers((p) => Math.min(Math.max(p, q.minPlayers), q.maxPlayers));
  };

  const digits = phone.replace(/\D/g, "");
  const phoneValid = digits.length === 11 && digits.startsWith("7");
  const nameValid = name.trim().length >= 2;
  const canSubmit =
    questId && date && time && nameValid && phoneValid && status !== "sending";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!quest) return;
    if (!nameValid) return setError("Введите имя");
    if (!phoneValid) return setError("Введите корректный номер телефона");
    if (!time) return setError("Выберите время");

    setError("");
    setStatus("sending");

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questId: quest.id,
          questName: quest.name,
          date,
          time,
          players,
          name: name.trim(),
          phone,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("done");
      // Замок щёлкает — заявка принята, дверь закрыта
      sfx("door");
    } catch {
      setStatus("error");
      setError("Не удалось отправить заявку. Позвоните нам — мы всё примем.");
    }
  }

  /* ---------- Экран подтверждения: «дверь заперлась» ---------- */
  if (status === "done") {
    return (
      <div className="relative border border-blood-700/50 bg-smoke p-7 text-center sm:p-12">
        <style>{`
          @keyframes lock-shake {
            0%,100% { transform: translateX(0); }
            20% { transform: translateX(-5px); }
            40% { transform: translateX(4px); }
            60% { transform: translateX(-2px); }
            80% { transform: translateX(1px); }
          }
          @keyframes fade-up {
            from { opacity: 0; transform: translate3d(0,16px,0); }
            to   { opacity: 1; transform: none; }
          }
        `}</style>

        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-blood-700"
          style={{ animation: "lock-shake 0.45s ease-out" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="4" y="10" width="16" height="11" stroke="#b8121a" strokeWidth="1.5" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#b8121a" strokeWidth="1.5" />
            <circle cx="12" cy="15" r="1.4" fill="#b8121a" />
          </svg>
        </div>

        <h3
          className="font-display text-3xl text-ash-text sm:text-4xl"
          style={{ animation: "fade-up 0.5s 0.1s both" }}
        >
          Место закомпостировано
        </h3>
        <p
          className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ash-text/85"
          style={{ animation: "fade-up 0.5s 0.25s both" }}
        >
          {quest?.name} · {date} в {time} · {players}{" "}
          {players === 1 ? "игрок" : "игрока(ов)"}
        </p>
        <p
          className="mt-6 font-display text-lg text-blood-500"
          style={{ animation: "fade-up 0.5s 0.4s both" }}
        >
          {/* React Bits: GlitchText — предупреждение сбоит, потом стабилизируется */}
          <GlitchText text="Пути назад нет" speed={0.5}>
            Пути назад нет
          </GlitchText>
        </p>
        <p
          className="mt-2 text-xs text-faint-text"
          style={{ animation: "fade-up 0.5s 0.5s both" }}
        >
          Администратор перезвонит для подтверждения. Приходите за 10 минут до
          начала.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setTime("");
          }}
          className="tap-target mt-7 border border-iron px-6 py-3 text-xs uppercase tracking-[0.15em] text-dim-text transition-colors hover:border-blood-700 hover:text-ash-text"
        >
          Записать ещё
        </button>
      </div>
    );
  }

  /* ---------- Форма ---------- */
  return (
    <form
      onSubmit={submit}
      noValidate
      // overflow-hidden: горизонтальные ряды дат/слотов не должны
      // вылезать за рамку формы ни при какой ширине экрана
      className="overflow-hidden border border-iron bg-smoke p-5 sm:p-8"
    >
      {/* 1. Квест */}
      <fieldset className="mb-7">
        <legend className="mb-3 text-[11px] uppercase tracking-[0.25em] text-faint-text">
          1 · Какой квест
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {QUESTS.map((q) => (
            <label
              key={q.id}
              className={`flex cursor-pointer items-center gap-3 border px-3.5 py-3 transition-colors ${
                questId === q.id
                  ? "border-blood-700 bg-blood-900/15"
                  : "border-iron hover:border-blood-700/50"
              }`}
            >
              <input
                type="radio"
                name="quest"
                value={q.id}
                checked={questId === q.id}
                onChange={() => changeQuest(q.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${
                  questId === q.id ? "bg-blood-500" : "bg-iron"
                }`}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ash-text">
                  {q.name}
                </span>
                <span className="block text-[11px] text-faint-text">
                  {q.duration} мин · {q.price.toLocaleString("ru-RU")} ₸
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 2. Дата — горизонтальный скролл, крупные тач-таргеты */}
      <fieldset className="mb-7">
        <legend className="mb-3 text-[11px] uppercase tracking-[0.25em] text-faint-text">
          2 · Дата
        </legend>
        {/*
          Мобильные: свайп-строка с плавным затуханием по краям.
          Десктоп: сетка 7×2 — 14 дней помещаются целиком и ничего
          не выходит за границы формы (раньше ряд уезжал вбок из-за
          отрицательного отступа и не помещался по ширине).
        */}
        <div className="relative">
          <div className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-7 sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
            {dates.map((d) => (
              <label
                key={d.iso}
                className={`relative flex min-w-[4.5rem] shrink-0 snap-center cursor-pointer flex-col items-center border py-2.5 transition-colors sm:min-w-0 ${
                  date === d.iso
                    ? "border-blood-700 bg-blood-900/20"
                    : "border-iron hover:border-blood-700/50"
                }`}
              >
                <input
                  type="radio"
                  name="date"
                  value={d.iso}
                  checked={date === d.iso}
                  onChange={() => {
                    setDate(d.iso);
                    setTime("");
                  }}
                  className="sr-only"
                />
                <span className="text-[10px] uppercase tracking-[0.12em] text-faint-text">
                  {d.weekday}
                </span>
                <span className="text-lg font-semibold leading-tight text-ash-text">
                  {d.day}
                </span>
                <span className="text-[10px] text-faint-text">{d.date}</span>

                {/* Отметка выбранного дня — «запертая дверь» */}
                {date === d.iso && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-blood-500"
                  />
                )}
              </label>
            ))}
          </div>

          {/* Подсказка про свайп — только мобильные */}
          <p className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-faint-text sm:hidden">
            ← листайте даты →
          </p>
        </div>
      </fieldset>

      {/* 3. Время — «подсветка доступных слотов фонариком» */}
      <fieldset className="mb-7">
        <legend className="mb-3 text-[11px] uppercase tracking-[0.25em] text-faint-text">
          3 · Время
        </legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {TIME_SLOTS.map((t) => (
            <label
              key={t}
              className={`tap-target flex cursor-pointer items-center justify-center border text-sm transition-all duration-300 ${
                time === t
                  ? "border-blood-700 bg-blood-700 text-ash-text shadow-[0_0_24px_-6px_rgba(184,18,26,0.9)]"
                  : "border-iron text-dim-text hover:border-blood-500 hover:bg-blood-900/10 hover:text-ash-text"
              }`}
            >
              <input
                type="radio"
                name="time"
                value={t}
                checked={time === t}
                onChange={() => setTime(t)}
                className="sr-only"
              />
              {t}
            </label>
          ))}
        </div>
      </fieldset>

      {/* 4. Игроки + 5. Контакты */}
      <div className="mb-7 grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="players"
            className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-faint-text"
          >
            4 · Игроков
          </label>
          <div className="flex items-center border border-iron focus-within:border-blood-700">
            <button
              type="button"
              aria-label="Меньше игроков"
              disabled={players <= (quest?.minPlayers ?? 2)}
              onClick={() => setPlayers((p) => Math.max(p - 1, quest?.minPlayers ?? 2))}
              className="tap-target w-12 shrink-0 text-lg text-dim-text transition-colors hover:text-blood-300 disabled:opacity-30"
            >
              −
            </button>
            <input
              id="players"
              type="number"
              inputMode="numeric"
              value={players}
              min={quest?.minPlayers ?? 2}
              max={quest?.maxPlayers ?? 8}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isNaN(v))
                  setPlayers(
                    Math.min(
                      Math.max(v, quest?.minPlayers ?? 2),
                      quest?.maxPlayers ?? 8,
                    ),
                  );
              }}
              className="w-full bg-transparent py-3 text-center text-base font-semibold text-ash-text outline-none"
            />
            <button
              type="button"
              aria-label="Больше игроков"
              disabled={players >= (quest?.maxPlayers ?? 8)}
              onClick={() => setPlayers((p) => Math.min(p + 1, quest?.maxPlayers ?? 8))}
              className="tap-target w-12 shrink-0 text-lg text-dim-text transition-colors hover:text-blood-300 disabled:opacity-30"
            >
              +
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-faint-text">
            От {quest?.minPlayers} до {quest?.maxPlayers} человек
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-faint-text"
            >
              5 · Ваше имя
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как к вам обращаться"
              autoComplete="name"
              required
              aria-invalid={name.length > 0 && !nameValid}
              className="tap-target w-full border border-iron bg-ash px-4 py-3 text-base text-ash-text outline-none transition-colors placeholder:text-faint-text focus:border-blood-700"
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-faint-text"
            >
              Телефон
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="+7 (___) ___-__-__"
              autoComplete="tel"
              required
              aria-invalid={phone.length > 3 && !phoneValid}
              className="tap-target w-full border border-iron bg-ash px-4 py-3 text-base text-ash-text outline-none transition-colors placeholder:text-faint-text focus:border-blood-700"
            />
          </div>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 border border-blood-700/60 bg-blood-900/20 px-4 py-3 text-sm text-blood-300"
        >
          {error}
        </p>
      )}

      {/* React Bits: ClickSpark — отправка заявки «высекает искру» */}
      <ClickSpark sparkColor="#d33a3f" sparkRadius={20} sparkCount={10}>
        <button
          type="submit"
          disabled={!canSubmit}
          className="tap-target relative flex w-full items-center justify-center overflow-hidden bg-blood-700 px-6 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-ash-text transition-colors duration-300 hover:bg-blood-500 disabled:cursor-not-allowed disabled:bg-iron disabled:text-faint-text"
        >
          <span className="relative z-10">
            {status === "sending" ? "Отправляем…" : "Забронировать место"}
          </span>
          {status === "sending" && (
            <span className="absolute inset-0 -translate-x-full animate-[loading_1.1s_infinite] bg-gradient-to-r from-transparent via-blood-500/40 to-transparent" />
          )}
        </button>
      </ClickSpark>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-faint-text">
        Оплата в кассе после подтверждения администратором. Бронь держим 15 минут.
      </p>
      <style>{`
        @keyframes loading { to { transform: translateX(100%); } }
      `}</style>
    </form>
  );
}
