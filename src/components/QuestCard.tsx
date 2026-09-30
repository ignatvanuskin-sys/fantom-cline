"use client";

import Image from "next/image";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import { ROOM_SCENES } from "@/data/scenes";
import type { Quest } from "@/data/quests";

// Комнаты без обложки не бывает: подборка собрана для всех шести.
// Если ключ потеряется, лучше упасть на сборке, чем показать пустой прямоугольник.
const FALLBACK = ROOM_SCENES["sanatorium"];

/**
 * Карточка квеста.
 * Mobile: свайп-карусель (родитель задаёт scroll-snap).
 * Desktop: hover «оживляет» карточку — обложка темнеет/дрожит,
 * появляется CTA «Забронировать» из тумана.
 * Сложность визуализирована «шкалой пульса», а не звёздами.
 */
export default function QuestCard({
  quest,
  index,
  onOpen,
}: {
  quest: Quest;
  index: number;
  onOpen: (quest: Quest) => void;
}) {
  const cover = ROOM_SCENES[quest.id] ?? FALLBACK;

  return (
    // id нужен, чтобы ссылка «Подробнее» вела на реальный якорь: без него
    // href="#quest-…" был ссылкой в никуда (и ломался без JS).
    // scroll-mt компенсирует липкую шапку при переходе по якорю.
    <article id={`quest-${quest.id}`} className="group relative h-full scroll-mt-24">
      {/* React Bits: SpotlightCard — за курсором идёт кровавое пятно,
          будто карточку подсвечивают фонариком в тёмном коридоре */}
      <SpotlightCard
        className="h-full"
        spotlightColor="rgba(184, 18, 26, 0.14)"
        spotlightSize={420}
      >
      <div
        className="relative flex h-full flex-col overflow-hidden border border-iron bg-smoke transition-all duration-500 hover:border-blood-700/60 hover:shadow-[0_0_50px_-12px_rgba(138,3,3,0.55)]"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {/* Подсветка по контуру у «хита»: карточка дышит, а не просто
            помечена плашкой. Рамка лежит внутри карточки и не влияет
            на раскладку — её не видно при prefers-reduced-motion
            (глобальное правило гасит длительность анимаций). */}
        {quest.featured && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 animate-glow border border-blood-500"
          />
        )}

        {/* Обложка — реальный кадр комнаты из 2ГИС. */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-ash">
          {/* Блик под ещё не загруженным кадром */}
          <span aria-hidden="true" className="shimmer-layer" />
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            loading={index < 3 ? "eager" : "lazy"}
            sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 31vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
          {/* duotone: кадр уходит в кровь, как и остальной сайт */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-blood-900/30 mix-blend-color"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-void/25" />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-smoke via-transparent to-void/40"
          />
          {/* Доминантная метка */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5 bg-void/85 px-2.5 py-1 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-blood-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-ash-text/90">
              {quest.horrorLevel}/5 страха
            </span>
          </div>
          {quest.featured && (
            <div className="absolute right-3 top-3 bg-blood-700 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]">
              Хит
            </div>
          )}
        </div>

        {/* Контент */}
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          {/* break-words + hyphens: названия бывают длиннее одной строки
              (и пока это плейсхолдер «[Название квеста]») — без этого
              слово вылезает за карточку на узких телефонах. */}
          {/* Название комнаты — вязь (Ruslan Display), а не «капли»:
              так у заголовка секции и названия комнаты разные голоса,
              и гость различает уровни, не читая. */}
          <h3 className="hyphens-auto break-words font-accent text-2xl leading-tight text-ash-text transition-colors duration-300 group-hover:text-blood-300 sm:break-normal sm:text-[1.7rem]">
            <span className="sr-only">{quest.name}</span>
            <span aria-hidden="true">{quest.name}</span>
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-dim-text">
            {quest.tagline}
          </p>

          {/* Шкала пульса сложности */}
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-faint-text">
              <span>Сложность</span>
              <span className="text-blood-300">{quest.difficulty}/5</span>
            </div>
            <div className="h-1 w-full overflow-hidden bg-iron">
              <div
                className="h-full origin-left bg-gradient-to-r from-blood-900 to-blood-500 animate-pulse-bar"
                style={{ width: `${(quest.difficulty / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Технические детали */}
          <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-iron pt-4 text-center">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.15em] text-faint-text">
                Время
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ash-text">
                {quest.duration} мин
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.15em] text-faint-text">
                Игроки
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ash-text">
                {quest.minPlayers}–{quest.maxPlayers}
              </dd>
            </div>
            {/* Возраст — один, из данных комнаты. Раньше в подписи стоял
                общий бейдж «16+», а рядом фактический допуск: на «Чердаке»
                это читалось как «16+ и 12+ одновременно». */}
            <div>
              <dt className="text-[10px] uppercase tracking-[0.15em] text-faint-text">
                Возраст
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ash-text">
                {quest.ageMin}+
              </dd>
            </div>
          </dl>

          {/* CTA проявляется из тумана */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-ash-text">
              {quest.price.toLocaleString("ru-RU")}{" "}
              <span className="text-xs font-normal text-faint-text">₸ / чел.</span>
            </span>
            <a
              href={`#quest-${quest.id}`}
              onClick={(e) => {
                e.preventDefault();
                onOpen(quest);
              }}
              className="tap-target relative inline-flex items-center justify-center gap-1.5 overflow-hidden border border-blood-700/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-ash-text transition-[background-color,border-color,transform] duration-200 hover:bg-blood-700 active:scale-[0.97]"
            >
              Подробнее
              {/* Стрелка «уезжает» при наведении на карточку — движение
                  показывает, куда ведёт нажатие, а не просто украшает */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path
                  d="M2 6h8M6.5 2.5 10 6l-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
      </SpotlightCard>
    </article>
  );
}
