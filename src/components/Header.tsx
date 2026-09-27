"use client";

import { useEffect, useState } from "react";
import SoundToggle from "@/components/horror/SoundToggle";
import { BUSINESS } from "@/data/quests";

const NAV = [
  { href: "#quests", label: "Квесты" },
  { href: "#how", label: "Как проходит" },
  { href: "#reviews", label: "Отзывы" },
  { href: "#contacts", label: "Контакты" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-iron bg-void/92 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6">
        <a
          href="#hero"
          className="font-display text-2xl leading-none text-blood-500 transition-colors hover:text-blood-300"
        >
          {BUSINESS.name}
        </a>

        {/* Навигация только на десктопе — на телефоне экономим место под sticky CTA */}
        <nav aria-label="Основная навигация" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  className="text-xs uppercase tracking-[0.18em] text-dim-text transition-colors hover:text-blood-300"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Тумблер страшного звука + запись.
            На мобильном экран тесный, поэтому у «Записи» скрываем текст. */}
        <div className="flex items-center gap-2">
          <SoundToggle />
          <a
            href="#booking"
            aria-label="Записаться на квест"
            className="tap-target hidden items-center border border-blood-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-ash-text transition-colors hover:bg-blood-700 md:inline-flex"
          >
            Записаться
          </a>

          {/* На мобильном — компактная кнопка вместо навигации */}
          <a
            href="#booking"
            aria-label="Записаться на квест"
            className="tap-target flex items-center border border-blood-700 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ash-text transition-colors hover:bg-blood-700 md:hidden"
          >
            Запись
          </a>
        </div>
      </div>
    </header>
  );
}
