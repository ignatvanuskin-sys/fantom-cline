"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Quest } from "@/data/quests";
import { QUESTS } from "@/data/quests";
import QuestCard from "./QuestCard";
import QuestModal from "./QuestModal";
import Reveal from "./Reveal";

export default function Quests() {
  const [active, setActive] = useState<Quest | null>(null);
  const [shock, setShock] = useState(false);
  const shocked = useRef(false);

  /**
   * Дозированный скример: один короткий «толчок» при первом появлении
   * секции. Полностью отключается при prefers-reduced-motion.
   */
  useEffect(() => {
    if (shocked.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = document.getElementById("quests");
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        shocked.current = true;
        setShock(true);
        setTimeout(() => setShock(false), 200);
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const open = useCallback((q: Quest) => setActive(q), []);

  return (
    <section
      id="quests"
      aria-labelledby="quests-title"
      className={`relative py-20 sm:py-28 ${
        shock ? "animate-[flicker_0.2s_steps(2,end)]" : ""
      }`}
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <Reveal className="mb-10 text-center sm:mb-14">
          <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-blood-300">
            Шесть дверей
          </p>
          <h2
            id="quests-title"
            className="font-display text-4xl text-ash-text sm:text-5xl md:text-6xl"
          >
            Выбери, куда войдёшь
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-dim-text sm:text-base">
            У каждой комнаты свой уровень страха и свои правила. Начни с
            безопасной — закончи с той, из которой не все выходят с улыбкой.
          </p>
        </Reveal>

        {/* Mobile: горизонтальный свайп-карусель.
            Desktop: сетка. Свайп на телефоне ощущается нативнее, чем сетка 2×2. */}
        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
          {QUESTS.map((quest, i) => (
            <Reveal
              key={quest.id}
              delay={i * 70}
              className="w-[78vw] shrink-0 snap-center sm:w-auto"
            >
              <QuestCard quest={quest} index={i} onOpen={open} />
            </Reveal>
          ))}
        </div>

        {/* Подсказка про свайп — только мобильные */}
        <p className="mt-2 text-center text-[11px] uppercase tracking-[0.25em] text-faint-text sm:hidden">
          ← листайте в сторону →
        </p>
      </div>

      <QuestModal quest={active} onClose={() => setActive(null)} />
    </section>
  );
}
