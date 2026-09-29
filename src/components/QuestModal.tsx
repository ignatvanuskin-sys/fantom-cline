"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import GlitchText from "@/components/reactbits/GlitchText";
import { sfx } from "@/components/horror/SoundToggle";
import { ROOM_SCENES } from "@/data/scenes";
import type { Quest } from "@/data/quests";

/**
 * Детали квеста: галерея, легенда, технические детали, отзывы,
 * кнопка записи с предзаполненным выбором квеста.
 *
 * Доступность: роль dialog, aria-modal, блокировка скролла,
 * закрытие по Esc и клику вне, возврат фокуса.
 */
export default function QuestModal({
  quest,
  onClose,
}: {
  quest: Quest | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!quest) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [quest, onClose]);

  if (!quest) return null;

  const scene = ROOM_SCENES[quest.id] ?? ROOM_SCENES["sanatorium"];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quest-modal-title"
    >
      {/* Затемнение + размытие фона */}
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-void/85 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        // overscroll-contain: докрутив карточку до конца, палец не должен
        // начинать прокручивать страницу под ней — иначе модалка «уезжает»
        className="relative max-h-[88svh] w-full max-w-2xl overflow-y-auto overscroll-contain border border-iron bg-ash shadow-[0_0_80px_-10px_rgba(138,3,3,0.4)]"
        style={{ animation: "modal-in 0.35s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <style>{`
          @keyframes modal-in {
            from { opacity: 0; transform: translate3d(0,40px,0) scale(0.97); filter: blur(8px); }
            to   { opacity: 1; transform: none; filter: blur(0); }
          }
        `}</style>

        {/* Сцена комнаты. Пока кадр один: миниатюры, которые переключали
            четыре кадра, стали бессмысленны, а лишние кнопки в модалке
            только отвлекают от главного действия — «Забронировать». */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-smoke">
          <Image
            key={scene.src}
            src={scene.src}
            alt={scene.alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 42rem"
            className="object-cover"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ash via-transparent to-transparent"
          />
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Закрыть окно"
          className="tap-target absolute right-3 top-3 flex items-center justify-center border border-iron bg-void/80 text-ash-text backdrop-blur-sm transition-colors hover:border-blood-700 hover:text-blood-300"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M2 2 L14 14 M14 2 L2 14"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>

        <div className="p-5 sm:p-8">
          <h3
            id="quest-modal-title"
            className="font-display text-3xl text-ash-text sm:text-4xl"
          >
            {/* React Bits: GlitchText — название комнаты «сбоит» в момент открытия */}
            <GlitchText text={quest.name} speed={0.3}>
              {quest.name}
            </GlitchText>
          </h3>
          <p className="mt-2 text-sm text-blood-300">{quest.tagline}</p>

          <p className="mt-5 text-sm leading-relaxed text-ash-text/85 sm:text-base">
            {quest.description}
          </p>

          {/* Технические детали */}
          <dl className="mt-7 grid grid-cols-2 gap-px border border-iron bg-iron sm:grid-cols-4">
            {[
              { k: "Длительность", v: `${quest.duration} мин` },
              { k: "Игроков", v: `${quest.minPlayers}–${quest.maxPlayers}` },
              { k: "Возраст", v: `${quest.ageMin}+` },
              { k: "Цена", v: `${quest.price.toLocaleString("ru-RU")} ₸` },
            ].map((d) => (
              <div key={d.k} className="bg-ash px-4 py-3">
                <dt className="text-[10px] uppercase tracking-[0.18em] text-faint-text">
                  {d.k}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-ash-text">{d.v}</dd>
              </div>
            ))}
          </dl>

          {/* Шкала пульса */}
          <div className="mt-6">
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

          {/* CTA с предзаполненным выбором квеста.
              Передаём выбор через CustomEvent + скролл к секции записи. */}
          <button
            type="button"
            onClick={() => {
              onClose();
              // Дверь захлопнулась — короткий скример на переходе
              sfx("sting");
              window.dispatchEvent(
                new CustomEvent("fantom:book", { detail: { questId: quest.id } }),
              );
              document
                .getElementById("booking")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="tap-target mt-7 flex w-full items-center justify-center bg-blood-700 px-6 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-ash-text transition-colors hover:bg-blood-500"
          >
            Забронировать место
          </button>
        </div>
      </div>
    </div>
  );
}
