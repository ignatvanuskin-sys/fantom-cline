"use client";

import { useEffect, useMemo, useState } from "react";
import ClickSpark from "@/components/reactbits/ClickSpark";
import GlitchText from "@/components/reactbits/GlitchText";
import { sfx } from "@/components/horror/SoundToggle";
import { QUESTS, TIME_SLOTS, type Quest } from "@/data/quests";
import { useIsMobile } from "@/hooks/useMediaQuery";

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

/* ============================================================
   Подкомпоненты шагов формы
   Вынесены отдельно, чтобы мастер на телефоне и полная форма
   на десктопе использовали одну разметку полей (иначе пришлось бы
   дублировать id и ломать <label for>).
   ============================================================ */

/** Шаг 1 — выбор квеста. На телефоне это свайп-карусель, а не стопка из 6 карточек. */
function QuestPicker({
  questId,
  onChange,
  compact,
}: {
  questId: string;
  onChange: (id: string) => void;
  /** true — горизонтальный свайп (телефон), false — сетка (десктоп). */
  compact: boolean;
}) {
  if (compact) {
    return (
      <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {QUESTS.map((q) => (
          <label
            key={q.id}
            className={`flex w-[72vw] shrink-0 snap-center cursor-pointer flex-col border p-4 transition-colors ${
              questId === q.id
                ? "border-blood-700 bg-blood-900/15"
                : "border-iron"
            }`}
          >
            <input
              type="radio"
              name="quest"
              value={q.id}
              checked={questId === q.id}
              onChange={() => onChange(q.id)}
              className="sr-only"
            />
            <span className="flex items-start justify-between gap-2">
              <span className="hyphens-auto break-words font-display text-xl leading-tight text-ash-text">
                {q.name}
              </span>
              <span
                aria-hidden="true"
                className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                  questId === q.id
                    ? "border-blood-500 bg-blood-500"
                    : "border-iron"
                }`}
              />
            </span>
            <span className="mt-2 text-[11px] leading-relaxed text-faint-text">
              {q.duration} мин · {q.minPlayers}–{q.maxPlayers} чел. · {q.difficulty}/5
            </span>
            <span className="mt-auto pt-3 text-base font-semibold text-blood-300">
              {q.price.toLocaleString("ru-RU")} ₸
            </span>
          </label>
        ))}
      </div>
    );
  }

  return (
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
            onChange={() => onChange(q.id)}
            className="sr-only"
          />
          <span
            aria-hidden="true"
            className={`h-2 w-2 shrink-0 rounded-full ${
              questId === q.id ? "bg-blood-500" : "bg-iron"
            }`}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-ash-text">{q.name}</span>
            <span className="block text-[11px] text-faint-text">
              {q.duration} мин · {q.price.toLocaleString("ru-RU")} ₸
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

/** Шаг 2 — дата (14 дней) и время. */
function WhenPicker({
  dates,
  date,
  time,
  onDate,
  onTime,
}: {
  dates: { iso: string; day: string; date: string; weekday: string }[];
  date: string;
  time: string;
  onDate: (iso: string) => void;
  onTime: (t: string) => void;
}) {
  return (
    <>
      {/* min-w-0 обязателен: у <fieldset> стоит min-inline-size: min-content,
          и ряд дат не даёт полю сжаться — форма разъезжалась до ~1095px. */}
      <fieldset className="mb-6 min-w-0">
        <legend className="mb-3 text-[11px] uppercase tracking-[0.25em] text-faint-text">
          Дата
        </legend>
        <div className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-7 sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
          {dates.map((d) => (
            <label
              key={d.iso}
              className={`relative flex min-w-[4.5rem] shrink-0 snap-center cursor-pointer flex-col items-center border py-3 transition-colors sm:min-w-0 ${
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
                onChange={() => onDate(d.iso)}
                className="sr-only"
              />
              <span className="text-[10px] uppercase tracking-[0.12em] text-faint-text">
                {d.weekday}
              </span>
              <span className="text-lg font-semibold leading-tight text-ash-text">
                {d.day}
              </span>
              <span className="text-[10px] text-faint-text">{d.date}</span>
              {date === d.iso && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-blood-500"
                />
              )}
            </label>
          ))}
        </div>
        <p className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-faint-text sm:hidden">
          ← листайте даты →
        </p>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="mb-3 text-[11px] uppercase tracking-[0.25em] text-faint-text">
          Время
        </legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {TIME_SLOTS.map((t) => (
            <label
              key={t}
              className={`tap-target flex cursor-pointer items-center justify-center border text-base transition-all duration-300 ${
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
                onChange={() => onTime(t)}
                className="sr-only"
              />
              {t}
            </label>
          ))}
        </div>
        {/* Слоты — это обычное расписание, а не онлайн-календарь со свободными
            окнами. Без этой оговорки выбор времени читается как гарантия
            свободного часа. */}
        <p className="mt-3 text-[11px] leading-relaxed text-faint-text">
          Время подтвердит администратор: слоты сверяются с расписанием вручную.
        </p>
      </fieldset>
    </>
  );
}

/** Шаг 3 — игроки и контакты. */
function WhoPicker({
  quest,
  players,
  onPlayers,
  name,
  onName,
  phone,
  onPhone,
  nameValid,
  phoneValid,
  stack,
}: {
  quest: Quest | undefined;
  players: number;
  onPlayers: (n: number) => void;
  name: string;
  onName: (s: string) => void;
  phone: string;
  onPhone: (s: string) => void;
  nameValid: boolean;
  phoneValid: boolean;
  /** true — вертикально (телефон), false — в две колонки (десктоп). */
  stack: boolean;
}) {
  const min = quest?.minPlayers ?? 2;
  // Почему ошибка написана прямо под полем, а не только в общей плашке:
  // плашка живёт внизу формы, и на телефоне человек, ошибшийся в телефоне,
  // её просто не видит. Плюс поле подсвечивается и получает описание
  // через aria-describedby — иначе screen reader не скажет, что не так.
  const nameError = name.length > 0 && !nameValid;
  const phoneError = phone.replace(/\D/g, "").length > 3 && !phoneValid;
  const max = quest?.maxPlayers ?? 8;

  return (
    // Подписи полей — тоже цели нажатия: py-2 поднимает их высоту до 33px,
    // иначе кликабельная подпись мельче минимального размера цели (WCAG 2.5.8).
    <div className={stack ? "space-y-6" : "grid gap-5 sm:grid-cols-2"}>
      <div>
        <label
          htmlFor="players"
          className="block py-2 text-[11px] uppercase tracking-[0.25em] text-faint-text"
        >
          Игроков
        </label>
        <div className="flex items-center border border-iron focus-within:border-blood-700">
          <button
            type="button"
            aria-label="Меньше игроков"
            disabled={players <= min}
            onClick={() => onPlayers(Math.max(players - 1, min))}
            className="tap-target w-14 shrink-0 text-2xl text-dim-text transition-colors active:text-blood-300 disabled:opacity-30"
          >
            −
          </button>
          <input
            id="players"
            name="players"
            type="number"
            inputMode="numeric"
            value={players}
            min={min}
            max={max}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v)) onPlayers(Math.min(Math.max(v, min), max));
            }}
            className="w-full bg-transparent py-4 text-center text-lg font-semibold text-ash-text outline-none"
          />
          <button
            type="button"
            aria-label="Больше игроков"
            disabled={players >= max}
            onClick={() => onPlayers(Math.min(players + 1, max))}
            className="tap-target w-14 shrink-0 text-2xl text-dim-text transition-colors active:text-blood-300 disabled:opacity-30"
          >
            +
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-faint-text">
          От {min} до {max} человек
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block py-2 text-[11px] uppercase tracking-[0.25em] text-faint-text"
          >
            Ваше имя
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder="Как к вам обращаться"
            autoComplete="name"
            required
            aria-invalid={nameError}
            aria-describedby={nameError ? "name-error" : undefined}
            className={`tap-target w-full border bg-ash px-4 py-4 text-base text-ash-text outline-none transition-colors placeholder:text-faint-text focus:border-blood-500 focus:shadow-[0_0_0_3px_rgba(184,18,26,0.22)] ${
              nameError ? "border-blood-500" : "border-iron"
            }`}
          />
          {nameError && (
            <p id="name-error" className="mt-1.5 text-[11px] leading-relaxed text-blood-300">
              Достаточно двух букв — как к вам обращаться.
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block py-2 text-[11px] uppercase tracking-[0.25em] text-faint-text"
          >
            Телефон
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => onPhone(formatPhone(e.target.value))}
            placeholder="+7 (___) ___-__-__"
            autoComplete="tel"
            required
            aria-invalid={phoneError}
            aria-describedby={phoneError ? "phone-error" : undefined}
            className={`tap-target w-full border bg-ash px-4 py-4 text-base text-ash-text outline-none transition-colors placeholder:text-faint-text focus:border-blood-500 focus:shadow-[0_0_0_3px_rgba(184,18,26,0.22)] ${
              phoneError ? "border-blood-500" : "border-iron"
            }`}
          />
          {phoneError && (
            <p id="phone-error" className="mt-1.5 text-[11px] leading-relaxed text-blood-300">
              Нужны 11 цифр, например +7 (700) 000-00-00.
            </p>
          )}
        </div>
      </div>
    </div>
  );
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
  // Согласие на обработку персональных данных: без него заявку не принимает
  // ни клиентская проверка, ни обработчик на сервере.
  const [consent, setConsent] = useState(false);

  // Номер шага мастера. Актуален только на телефоне: на десктопе форма
  // показывается целиком и значение игнорируется.
  const [stepIndex, setStepIndex] = useState(0);
  const isMobile = useIsMobile();

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
        // Квест уже выбран за пользователя — на телефоне сразу показываем
        // шаг «Когда», чтобы не заставлять подтверждать очевидное
        setStepIndex(1);
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
    Boolean(questId && date && time && nameValid && phoneValid && consent) &&
    status !== "sending";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!quest) return;

    /*
      Кнопка отправки всегда активна, а проверка идёт здесь.
      Отключённая кнопка — тупик: человек не понимает, чего от него
      хотят, и не может получить объяснение. Поэтому вместо `disabled`
      мы даём нажать, показываем, что не так, и переводим фокус
      в первое проблемное поле — иначе на телефоне придётся искать
      ошибку глазами по всей форме.
    */
    const problem = !nameValid
      ? "name"
      : !phoneValid
        ? "phone"
        : !time
          ? "time"
          : !consent
            ? "consent"
            : null;
    if (problem) {
      const message =
        problem === "name"
          ? "Укажите имя — администратор перезвонит и подтвердит бронь."
          : problem === "phone"
            ? "Проверьте номер: нужно 11 цифр, начиная с 7."
            : problem === "time"
              ? "Выберите время — от часа зависит, сколько мест осталось."
              : "Отметьте согласие на обработку данных — без него не сможем принять заявку.";

      const field =
        problem === "time"
          ? document.querySelector<HTMLInputElement>('input[name="time"]')
          : document.getElementById(problem);

      // На телефоне форма разбита на шаги, и поля времени в разметке может
      // не быть — тогда сообщение указывало бы на то, чего не видно.
      // Возвращаемся на нужный шаг и только потом говорим, что не так.
      if (!field && isMobile) {
        goToStep(problem === "time" ? 1 : 2);
        setError(message);
        return;
      }

      setError(message);
      field?.focus();
      return;
    }

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
          consent,
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
          className="mt-6 font-display text-lg text-blood-300"
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
  /* ---------- Форма ----------
     Десктоп: все поля на одной странице.
     Телефон: пошаговый мастер — на маленьком экране пять полей
     в столбик означали ~1400px прокрутки, почти всё уходило на
     выбор квеста из шести карточек. Мастер укладывает выбор
     в три экрана и держит «Далее» под большим пальцем. */
  const steps = [
    { key: "quest", label: "Квест" },
    { key: "when", label: "Когда" },
    { key: "who", label: "Кто" },
  ];
  const step = Math.min(Math.max(stepIndex, 0), steps.length - 1);
  const isLast = step === steps.length - 1;

  /**
   * Переход между шагами мастера на телефоне.
   *
   * Зачем проверять на входе: раньше «Далее» со шага «Когда» уводила на
   * «Кто» даже без выбранного времени — то есть записаться можно было,
   * не выбрав час. Ошибка всплывала только на последнем шаге, на поле,
   * которого перед глазами уже нет. Теперь шаг закрывается своим полем,
   * а фокус уезжает туда, где не хватает данных.
   *
   * Плюс прокрутка: после смены шага экран оставался на прежнем месте,
   * и заголовок нового шага оказывался выше видимой области.
   */
  function goToStep(next: number) {
    if (next > step) {
      // Проверяем только то, что закрывает ТЕКУЩИЙ шаг. Проверка «всего
      // сразу» блокировала бы выход с шага «Квест»: время выбирают на
      // следующем шаге, и требовать его раньше — тупик.
      const missing =
        step === 0
          ? null
          : !date
            ? {
                attr: "date",
                message: "Выберите день — свободные даты обновляются каждый день.",
              }
            : !time
              ? {
                  attr: "time",
                  message:
                    "Выберите время — от часа зависит, сколько мест осталось.",
                }
              : null;

      if (missing) {
        setError(missing.message);
        const field = document.querySelector<HTMLInputElement>(
          `input[name="${missing.attr}"]`,
        );
        field?.focus();
        field?.scrollIntoView({ block: "center" });
        return;
      }
    }

    setError("");
    setStepIndex(next);

    // Прокручиваем уже после отрисовки нового шага, иначе браузер
    // посчитает позицию по старой, более длинной раскладке.
    requestAnimationFrame(() => {
      document
        .getElementById("booking")
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  // Что уже выбрано — показываем в шапке мастера
  const chosenDate = dates.find((d) => d.iso === date);
  const summary = [
    quest?.name,
    chosenDate
      ? `${chosenDate.day} ${chosenDate.date}${time ? `, ${time}` : ""}`
      : null,
    `${players} ${players === 1 ? "игрок" : "игрока"}`,
  ].filter(Boolean);

  /*
    Итог считаем здесь, а не в шапке мастера: там строка обрезается
    через truncate, и сумма — первое, что от неё отвалится. А знать
    сумму до отправки важнее, чем видеть её в сводке.
    Цена в данных — за человека (на карточке подписано «₸ / чел.»),
    поэтому умножаем на число игроков.
  */
  const money = new Intl.NumberFormat("ru-RU");
  const perPerson = quest ? money.format(quest.price) : null;
  const total = quest ? money.format(quest.price * players) : null;

  return (
    <form
      onSubmit={submit}
      // method/action — страховка на случай, когда клиентский JS не загрузился:
      // браузер отправит те же поля обычным POST'ом (данные уйдут в теле
      // запроса, а не в адресную строку) и получит HTML-ответ.
      method="post"
      action="/api/booking"
      noValidate
      // overflow-hidden: горизонтальные ряды дат/слотов не должны
      // вылезать за рамку формы ни при какой ширине экрана
      className="overflow-hidden border border-iron bg-smoke p-5 sm:p-8"
    >
      {/* ---------- Шапка мастер: только на телефоне ---------- */}
      {isMobile && (
        <div className="mb-6">
          <div
            className="mb-4 flex items-center gap-1.5"
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-label="Шаг записи"
          >
            {steps.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => goToStep(i)}
                // tap-target: без него полоска-индикатор даёт кнопке высоту
                // 20px — по пальцу в неё не попасть
                className="tap-target flex-1 py-2"
                aria-label={`Шаг ${i + 1}: ${s.label}`}
                aria-current={i === step ? "step" : undefined}
              >
                <span
                  className={`block h-1 w-full transition-colors ${
                    i <= step ? "bg-blood-500" : "bg-iron"
                  }`}

                />
              </button>
            ))}
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="shrink-0 text-[11px] uppercase tracking-[0.25em] text-blood-300">
              Шаг {step + 1} из {steps.length} · {steps[step].label}
            </p>
            <p className="truncate text-[11px] text-faint-text">
              {summary.join(" · ")}
            </p>
          </div>
        </div>
      )}


      {/* ---------- Шаг 1: квест ---------- */}
      {(!isMobile || step === 0) && (
        <div className="mb-6 min-w-0">
          <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-faint-text">
            {isMobile ? "" : "1 · "}Какой квест
          </p>
          <QuestPicker questId={questId} onChange={changeQuest} compact={isMobile} />
        </div>
      )}

      {/* ---------- Шаг 2: дата и время ---------- */}
      {(!isMobile || step === 1) && (
        <div className={isMobile ? "" : "mb-6"}>
          <WhenPicker
            dates={dates}
            date={date}
            time={time}
            onDate={(iso) => {
              setDate(iso);
              setTime("");
            }}
            onTime={setTime}
          />
        </div>
      )}

      {/* ---------- Шаг 3: игроки и контакты ---------- */}
      {(!isMobile || step === 2) && (
        <div className={isMobile ? "" : "mb-6"}>
          <WhoPicker
            quest={quest}
            players={players}
            onPlayers={setPlayers}
            name={name}
            onName={setName}
            phone={phone}
            onPhone={setPhone}
            nameValid={nameValid}
            phoneValid={phoneValid}
            stack={isMobile}
          />
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mb-4 border border-blood-700/60 bg-blood-900/20 px-4 py-3 text-sm text-blood-300"
        >
          {error}
        </p>
      )}

      {/* На последнем шаге заранее говорим, чего не хватает: кнопка при
          этом остаётся активной, но подсказка снимает лишний тап вслепую. */}
      {isMobile && isLast && !canSubmit && (
        <p className="mb-3 text-center text-[11px] leading-relaxed text-faint-text">
          {!time
            ? "Осталось выбрать время"
            : !nameValid
              ? "Осталось указать имя"
              : !phoneValid
                ? "Осталось указать телефон"
                : !consent
                  ? "Осталось согласие на обработку данных"
                  : "Проверьте выбранные данные"}
        </p>
      )}

      {/* Согласие на обработку данных. На телефоне показывается только на
          последнем шаге: раньше спрашивать нечего. */}
      {(!isMobile || isLast) && (
        <div className="mt-6">
          <label
            htmlFor="consent"
            className="flex cursor-pointer items-start gap-3 border border-iron bg-ash px-4 py-3.5"
          >
            <input
              id="consent"
              name="consent"
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              // accent-color задан инлайном: это единственная галочка на
              // странице, ради неё не стоит заводить отдельный токен
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ accentColor: "#b8121a" }}
            />
            <span className="text-[12px] leading-relaxed text-dim-text">
              Согласен на обработку персональных данных: имя и телефон нужны
              администратору, чтобы подтвердить бронь.
            </span>
          </label>
        </div>
      )}

      {/* ---------- Итог ----------
          Появляется, как только выбрана комната: человек должен понимать,
          на какую сумму соглашается, ещё до звонка администратора. */}
      {total && (
        <div className="mt-6 flex items-baseline justify-between gap-3 border-t border-iron pt-4">
          <span className="tnum text-[11px] uppercase tracking-[0.2em] text-faint-text">
            Итого · {players} × {perPerson} ₸
          </span>
          <span className="tnum font-display text-2xl text-blood-300">
            {total}
            <span className="ml-1 text-base text-ash-text">₸</span>
          </span>
        </div>
      )}

      {/* ---------- Навигация мастером + отправка ---------- */}
      <div className="mt-7 flex gap-3">
        {isMobile && step > 0 && (
          <button
            type="button"
            onClick={() => goToStep(step - 1)}
            className="tap-target flex w-28 shrink-0 items-center justify-center border border-iron text-sm font-semibold uppercase tracking-[0.12em] text-dim-text transition-colors active:border-blood-700 active:text-ash-text"
          >
            Назад
          </button>
        )}

        {isMobile && !isLast ? (
          <button
            type="button"
            onClick={() => goToStep(step + 1)}
            className="tap-target flex flex-1 items-center justify-center bg-blood-700 px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-ash-text transition-[background-color,transform] duration-200 active:scale-[0.98] active:bg-blood-500"
          >
            Далее
          </button>
        ) : (
          /* React Bits: ClickSpark — отправка заявки «высекает искру» */
          <ClickSpark
            sparkColor="#d33a3f"
            sparkRadius={20}
            sparkCount={10}
            className="flex-1"
          >
            <button
              type="submit"
              disabled={status === "sending"}
              aria-busy={status === "sending"}
              aria-disabled={!canSubmit}
              className="tap-target relative flex w-full items-center justify-center overflow-hidden bg-blood-700 px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-ash-text transition-[background-color,transform,box-shadow] duration-200 hover:bg-blood-500 focus-visible:shadow-[0_0_0_3px_rgba(184,18,26,0.28)] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-iron disabled:text-faint-text disabled:active:scale-100"
            >
              <span className="relative z-10">
                {status === "sending" ? "Отправляем…" : "Забронировать место"}
              </span>
              {status === "sending" && (
                <span className="absolute inset-0 -translate-x-full animate-[loading_1.1s_infinite] bg-gradient-to-r from-transparent via-blood-500/40 to-transparent" />
              )}
            </button>
          </ClickSpark>
        )}
      </div>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-faint-text">
        Оплата в кассе после подтверждения администратором. Бронь держим 15 минут.
      </p>
      <style>{`
        @keyframes loading { to { transform: translateX(100%); } }
      `}</style>
    </form>
  );
}