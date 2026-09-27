"use client";

import { useEffect, useRef, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Закрываем меню по Escape, клику вне и при возврате на десктоп —
  // иначе на телефоне оно осталось бы висеть поверх страницы.
  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setMenuOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    mq.addEventListener("change", onChange);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      mq.removeEventListener("change", onChange);
    };
  }, [menuOpen]);

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
          aria-label="Fantom — на главную"
          className="flex min-h-11 items-center font-display text-2xl leading-none text-blood-500 transition-colors hover:text-blood-300"
        >
          {BUSINESS.name}
        </a>

        {/* Навигация только на десктопе — на телефоне её открывают три точки */}
        <nav aria-label="Основная навигация" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  className="flex min-h-11 items-center text-xs uppercase tracking-[0.18em] text-dim-text transition-colors hover:text-blood-300"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Запись — главное действие на странице, поэтому залита кровью.
            Раньше это был тонкий контур на прозрачном фоне, и рядом
            с логотипом на телефоне кнопка почти не читалась. */}
        <div className="flex items-center gap-2">
          <SoundToggle />
          <a
            href="#booking"
            aria-label="Записаться на квест"
            className="tap-target hidden items-center bg-blood-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-ash-text transition-colors hover:bg-blood-500 md:inline-flex"
          >
            Записаться
          </a>

          <a
            href="#booking"
            aria-label="Записаться на квест"
            className="tap-target flex items-center bg-blood-700 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ash-text transition-colors hover:bg-blood-500 md:hidden"
          >
            Запись
          </a>

          {/* Три точки — единственный способ попасть в меню на телефоне.
              Точки складываются в крест при открытии. */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            className="tap-target flex items-center gap-[3px] px-1.5 md:hidden"
          >
            <span className="sr-only">Меню</span>
            <span
              aria-hidden="true"
              className={`h-1 w-1 rounded-full bg-ash-text transition-transform duration-300 ${
                menuOpen ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <span
              aria-hidden="true"
              className={`h-1 w-1 rounded-full bg-ash-text transition-all duration-300 ${
                menuOpen ? "scale-0 opacity-0" : ""
              }`}
            />
            <span
              aria-hidden="true"
              className={`h-1 w-1 rounded-full bg-ash-text transition-transform duration-300 ${
                menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Панель появляется только после тапа, поэтому навигация
          не прячется от пользователя с отключённым JS — в футере
          те же ссылки продублированы статично. */}
      {menuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          className="border-t border-iron bg-void/98 backdrop-blur-md md:hidden"
        >
          <nav aria-label="Мобильная навигация" className="px-5">
            <ul>
              {NAV.map((n) => (
                <li key={n.href} className="border-b border-iron/60 last:border-b-0">
                  <a
                    href={n.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-12 items-center text-sm uppercase tracking-[0.16em] text-ash-text/85 transition-colors active:text-blood-300"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <a
            href="#booking"
            onClick={() => setMenuOpen(false)}
            className="flex min-h-12 items-center justify-center bg-blood-700 px-5 text-sm font-semibold uppercase tracking-[0.15em] text-ash-text"
          >
            Забронировать место
          </a>

          {/* Телефон у клиента пока не подтверждён (BUSINESS.phone — пустая
              строка, поэтому проверяем на "" а не на null), ведём на запись. */}
          <a
            href={BUSINESS.phone ? `tel:${BUSINESS.phone.replace(/[^\d+]/g, "")}` : "#booking"}
            onClick={() => setMenuOpen(false)}
            className="flex min-h-12 items-center justify-center gap-2 border-t border-iron px-5 text-sm text-dim-text"
          >
            <span className="text-blood-300" aria-hidden="true">
              {BUSINESS.phone ? "✆" : "→"}
            </span>
            {BUSINESS.phone || "Записаться онлайн"}
          </a>
        </div>
      )}
    </header>
  );
}
