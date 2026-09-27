"use client";

import { useEffect, useState } from "react";
import SoundToggle from "@/components/horror/SoundToggle";
import { BUSINESS } from "@/data/quests";

// Инлайновые иконки вместо lucide-react: в проекте нет внешних иконок,
// а набор тут всего два значка — бургер и крест.
function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

const NAV = [
  { href: "#quests", label: "Квесты" },
  { href: "#how", label: "Как проходит" },
  { href: "#reviews", label: "Отзывы" },
  { href: "#contacts", label: "Контакты" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Закрываем меню по Escape и при возврате на десктоп. Клик-вне больше не
  // нужен: панель занимает весь экран, и тапать мимо неё некуда.
  // Пока меню открыто, скролл страницы заблокирован — иначе под панелью
  // прокручивался бы контент, и меню выглядело бы «приклеенным» к нему.
  useEffect(() => {
    if (!menuOpen) {
      document.documentElement.style.overflow = "";
      return;
    }

    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setMenuOpen(false);
    };

    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onChange);
    return () => {
      document.documentElement.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onChange);
    };
  }, [menuOpen]);

  return (
    <>
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

        {/* Навигация только на десктопе — на телефоне её открывает бургер */}
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

          {/* Бургер в квадратной рамке 44×44 — та же метка, что на quest-new-five.
              Звук из шапки убран: на телефоне он переехал внутрь меню,
              иначе рядом с логотипом, «Запись» и бургером не оставалось места. */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            className="tap-target flex h-11 w-11 shrink-0 items-center justify-center border border-ash-text/20 text-ash-text transition-colors hover:border-ash-text/40 md:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </div>
    </header>

    {/* Полноэкранная панель. Вынесена из <header> намеренно: у шапки
        есть backdrop-blur, а он создаёт containing block — оставься
        внутри, fixed-панель растянулась бы по высоте шапки, а не экрана. */}
    {menuOpen && (
      <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
          className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-void/98 backdrop-blur-xl md:hidden"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-iron px-5 py-3">
            <span className="text-xs uppercase tracking-[0.24em] text-dim-text">
              Меню
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Закрыть меню"
              className="tap-target flex h-11 w-11 items-center justify-center border border-ash-text/20 text-ash-text"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Весь блок скроллится целиком. Без общего скролла на коротком
              экране (iPhone SE 320×568) нижние элементы не помещались. */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            <nav aria-label="Мобильная навигация" className="px-5 py-4">
              <ul>
                {NAV.map((n) => (
                  <li key={n.href} className="border-b border-iron/60 last:border-b-0">
                    <a
                      href={n.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-[52px] items-center font-display text-[clamp(1.45rem,7.6vw,2.2rem)] uppercase leading-tight text-ash-text transition-colors active:text-blood-300"
                    >
                      {n.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-auto space-y-3 border-t border-iron px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-5">
              {/* На телефоне звук всегда под рукой в меню, а не в шапке */}
              <SoundToggle />
              <a
                href="#booking"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[56px] items-center justify-center bg-blood-700 px-6 text-sm font-semibold uppercase tracking-[0.16em] text-ash-text transition-colors active:bg-blood-500"
              >
                Забронировать место
              </a>

              {/* Телефон у клиента пока не подтверждён (BUSINESS.phone — пустая
                  строка, поэтому проверяем на "" а не на null), ведём на запись. */}
              <a
                href={BUSINESS.phone ? `tel:${BUSINESS.phone.replace(/[^\d+]/g, "")}` : "#booking"}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center justify-center gap-2 border border-ash-text/20 px-6 text-xs uppercase tracking-[0.16em] text-dim-text"
              >
                <span className="text-blood-300" aria-hidden="true">
                  {BUSINESS.phone ? "✆" : "→"}
                </span>
                {BUSINESS.phone || "Записаться онлайн"}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
