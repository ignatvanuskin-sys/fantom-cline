"use client";

import { useEffect, useState } from "react";
import SoundToggle from "@/components/horror/SoundToggle";
import ScrollProgress from "@/components/ScrollProgress";
import { BUSINESS } from "@/data/quests";

/**
 * Бургер, который сам складывается в крест: крайние линии сходятся
 * к центру и наклоняются на 45°, средняя гаснет.
 *
 * Движение здесь осмысленное, а не декоративное: иконка показывает,
 * что состояние переключилось, и не требует подмены картинки.
 * Наклон считается от центра каждой линии, поэтому вращение задано
 * inline-стилем — в Tailwind сочетание translate + rotate для SVG
 * зависит от того, какие свойства он сгенерирует.
 */
function MenuIcon({ open }: { open: boolean }) {
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
      {/* transform-box: view-box — иначе transform-origin считается
          от рамки линии, а у горизонтальной линии она нулевой высоты */}
      <line
        x1="4"
        y1="6"
        x2="20"
        y2="6"
        className="transition-transform duration-300 ease-out"
        style={{
          transformBox: "view-box",
          transformOrigin: "12px 6px",
          transform: open ? "translateY(6px) rotate(45deg)" : "none",
        }}
      />
      <line
        x1="4"
        y1="12"
        x2="20"
        y2="12"
        className="transition-opacity duration-200"
        style={{ opacity: open ? 0 : 1 }}
      />
      <line
        x1="4"
        y1="18"
        x2="20"
        y2="18"
        className="transition-transform duration-300 ease-out"
        style={{
          transformBox: "view-box",
          transformOrigin: "12px 18px",
          transform: open ? "translateY(-6px) rotate(-45deg)" : "none",
        }}
      />
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

// Четыре пункта вместо шести: «Галерея» и «Видео» ушли вместе с разделами,
// а короткое меню читается с одного взгляда и влезает в строку.
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
    // 1024, а не 768: с шестью пунктами навигация перестала помещаться
    // в шапку на планшете (768–1023px) — бургер там остаётся нужным.
    const mq = window.matchMedia("(min-width: 1024px)");
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
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-500 ${
          scrolled
            ? "border-b border-iron bg-void/92 backdrop-blur-md"
            : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6">
          <a
            href="#hero"
            aria-label="Fantom — на главную"
            // translate="no": авто-перевод браузера не должен трогать название
            translate="no"
            // blood-300 (#dd4448) вместо blood-500: на 24px тёмно-красный
            // давал контраст 2.96:1 при норме 3:1 для крупного текста.
            className="flex min-h-11 items-center font-display text-2xl leading-none text-blood-300 transition-colors hover:text-ash-text"
          >
            {BUSINESS.name}
          </a>

        {/* Навигация только на широких экранах: до 1024px её открывает бургер,
            иначе шесть пунктов + логотип + кнопка не влезают в строку */}
        <nav aria-label="Основная навигация" className="hidden lg:block">
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
            className="shine tap-target hidden items-center bg-blood-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-ash-text transition-[background-color,color,transform,box-shadow] duration-200 hover:bg-blood-500 active:scale-[0.97] lg:inline-flex"
          >
            Записаться
          </a>

          <a
            href="#booking"
            aria-label="Записаться на квест"
            className="shine tap-target flex items-center bg-blood-700 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ash-text transition-[background-color,color,transform,box-shadow] duration-200 hover:bg-blood-500 active:scale-[0.97] lg:hidden"
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
            data-testid="menu-toggle"
            className="tap-target flex h-11 w-11 shrink-0 items-center justify-center border border-ash-text/20 text-ash-text transition-colors hover:border-ash-text/40 lg:hidden"
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {/* Полоса прогресса чтения — по нижней кромке шапки */}
      <ScrollProgress />
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
          // menu-in: панель проявляется, а не возникает одним кадром
          className="menu-in fixed inset-0 z-[60] flex flex-col overflow-hidden bg-void/98 backdrop-blur-xl lg:hidden"
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
                {NAV.map((n, i) => (
                  <li key={n.href} className="border-b border-iron/60 last:border-b-0">
                    <a
                      href={n.href}
                      onClick={() => setMenuOpen(false)}
                      // Пункты поднимаются волной: 45ms между соседними —
                      // читается как движение, но не задерживает открытие
                      className="menu-in flex min-h-[52px] items-center font-display text-[clamp(1.45rem,7.6vw,2.2rem)] uppercase leading-tight text-ash-text transition-colors active:text-blood-300"
                      style={{ animationDelay: `${60 + i * 45}ms` }}
                    >
                      {n.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div
              className="menu-in mt-auto space-y-3 border-t border-iron px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-5"
              style={{ animationDelay: "230ms" }}
            >
              {/* На телефоне звук всегда под рукой в меню, а не в шапке */}
              <SoundToggle />
              <a
                href="#booking"
                onClick={() => setMenuOpen(false)}
                className="shine flex min-h-[56px] items-center justify-center bg-blood-700 px-6 text-sm font-semibold uppercase tracking-[0.16em] text-ash-text transition-[background-color,transform] duration-200 active:scale-[0.98] active:bg-blood-500"
              >
                Забронировать место
              </a>

              {/* Номер подтверждён по 2ГИС, но страховка на пустое значение
                  остаётся: если телефон уберут из данных, ссылка не должна
                  превратиться в tel: без номера. */}
              <a
                href={BUSINESS.phone ? `tel:${BUSINESS.phone.replace(/[^\d+]/g, "")}` : "#booking"}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center justify-center gap-2 border border-ash-text/20 px-6 text-xs uppercase tracking-[0.16em] text-dim-text"
              >
                {/* Трубка нарисована SVG, а не символом «✆»: у U+2706 плохое
                    покрытие в шрифтах, и на части систем вместо трубки
                    рисовался перечёркнутый круг — знак отсутствующего глифа. */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="shrink-0 text-blood-300"
                >
                  <path
                    d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6 6L16.5 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
                {BUSINESS.phone || "Записаться онлайн"}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
