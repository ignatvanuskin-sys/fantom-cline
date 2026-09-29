"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CountUp from "@/components/reactbits/CountUp";
import type { Quest } from "@/data/quests";
import { BUSINESS, QUESTS } from "@/data/quests";
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
            безопасной — закончи с той, из которой выносят на бодрящих
            ногах.
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

        {/* Статистика. React Bits: CountUp — числа «накручиваются», когда
            блок попадает в экран. Данные реальные (2ГИС), см. README. */}
        <Reveal delay={120} className="mt-14 sm:mt-16">
          <dl className="grid grid-cols-2 gap-px border border-iron bg-iron sm:grid-cols-4">
            {[
              { label: "Квест-комнат", value: QUESTS.length },
              { label: "Минут на игру", value: 60 },
              { label: "Оценок", value: BUSINESS.ratingCount },
              { label: "Отзывов", value: BUSINESS.reviewCount },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden bg-ash px-4 py-6 text-center transition-colors duration-500 hover:bg-smoke"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(184,18,26,0.10)_0%,transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
                <dd className="relative font-display text-3xl text-blood-300 sm:text-4xl">
                  <CountUp to={stat.value} duration={1.6} separator=" " />
                </dd>
                <dt className="relative mt-1 text-[10px] uppercase tracking-[0.2em] text-faint-text sm:text-[11px]">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      <QuestModal quest={active} onClose={() => setActive(null)} />
    </section>
  );
}
