"use client";

import SpotlightCard from "@/components/reactbits/SpotlightCard";
import type { Quest } from "@/data/quests";

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
  return (
    <article className="group relative h-full">
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
        {/* Обложка. TODO: заменить на реальное фото комнаты. */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-ash">
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,#201512_0%,#0f0d0c_60%,#0a0a0a_100%)]"
            aria-hidden="true"
          />
          {/* duotone-эффект на превью */}
          <div
            className="absolute inset-0 bg-blood-700/10 mix-blend-color"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 opacity-30 transition-transform duration-700 group-hover:scale-105"
            style={{
              backgroundImage:
                "repeating-linear-gradient(115deg, transparent 0 6px, rgba(0,0,0,0.35) 6px 7px)",
            }}
            aria-hidden="true"
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
          <h3 className="font-display text-2xl leading-tight text-ash-text transition-colors duration-300 group-hover:text-blood-300 sm:text-[1.7rem]">
            {/* На мобильном крупный акцентный шрифт мелким размером плохо читается,
                поэтому название всегда дублируется читаемым текстом ниже. */}
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
            <div>
              <dt className="text-[10px] uppercase tracking-[0.15em] text-faint-text">
                16+
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
              className="tap-target relative inline-flex items-center justify-center overflow-hidden border border-blood-700/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-ash-text transition-colors hover:bg-blood-700"
            >
              Подробнее
            </a>
          </div>
        </div>
      </div>
      </SpotlightCard>
    </article>
  );
}
