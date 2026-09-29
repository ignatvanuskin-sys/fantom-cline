"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { GALLERY } from "@/data/media";
import { sfx } from "@/components/horror/SoundToggle";
import Reveal from "./Reveal";

/**
 * Галерея зала: реальные кадры из 2ГИС и Instagram.
 *
 * Мобильная версия — приоритет, поэтому:
 *  — сетка в две колонки на телефоне (не одна: тогда прокрутка галереи
 *    занимает четыре экрана и до записи никто не доходит);
 *  — каждый тайл сам по себе тач-таргет больше 44px, отдельной кнопки нет;
 *  — просмотрщик открывается на весь экран и листается свайпом;
 *  — первые четыре кадра грузятся сразу, остальные — лениво.
 */

const ASPECT: Record<string, string> = {
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  square: "aspect-square",
};

export default function Gallery() {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const touchX = useRef<number | null>(null);

  const close = useCallback(() => setOpen(null), []);

  const step = useCallback((delta: number) => {
    setOpen((cur) => {
      if (cur === null) return cur;
      return (cur + delta + GALLERY.length) % GALLERY.length;
    });
  }, []);

  useEffect(() => {
    if (open === null) return;

    lastFocus.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      lastFocus.current?.focus?.();
    };
  }, [open, close, step]);

  const current = open === null ? null : GALLERY[open];

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-title"
      className="relative bg-ash py-20 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <Reveal className="mb-10 text-center sm:mb-14">
          <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-blood-300">
            Изнутри
          </p>
          <h2
            id="gallery-title"
            className="font-display text-4xl text-ash-text sm:text-5xl md:text-6xl"
          >
            Так это выглядит
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-dim-text sm:text-base">
            Ни одного стокового кадра. Всё снято внутри — {GALLERY.length} кадров
            из зала, комнат и с актёрами.
          </p>
        </Reveal>

        {/* Три колонки на телефоне, а не две: 22 кадра в две колонки
            растягивали секцию почти на три экрана прокрутки. В три колонки
            это плотная «стена кадров», а тап открывает полноэкранный просмотр. */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 lg:grid-cols-4">
          {GALLERY.map((photo, i) => (
            <Reveal key={photo.src} delay={Math.min(i, 6) * 60}>
              <button
                type="button"
                onClick={() => {
                  sfx("sting");
                  setOpen(i);
                }}
                aria-label={`Открыть кадр: ${photo.alt}`}
                className={`group relative block w-full overflow-hidden border border-iron transition-colors duration-300 hover:border-blood-700/70 focus-visible:border-blood-500 ${
                  ASPECT[photo.orientation] ?? "aspect-[3/4]"
                }`}
              >
                {/* Блик под кадром: работает без JS, картинка его перекрывает */}
                <span aria-hidden="true" className="shimmer-layer" />
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  loading={i < 4 ? "eager" : "lazy"}
                  sizes="(max-width: 1024px) 31vw, 23vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-void/35 transition-opacity duration-500 group-hover:opacity-0"
                />
                {/* На телефоне тайл ~107px: подпись источника там нечитаема,
                    источник указан один раз — строкой под сеткой. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-1.5 right-1.5 hidden bg-void/80 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-faint-text sm:block"
                >
                  {photo.source}
                </span>
              </button>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.22em] text-faint-text">
          Фото: 2ГИС · Instagram @fantom_uka_
        </p>
      </div>

      {/* Полноэкранный просмотрщик */}
      {current && (
        <div
          className="fixed inset-0 z-[110] flex flex-col bg-void/97 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр кадра"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-iron px-4 py-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-dim-text">
              {(open ?? 0) + 1} / {GALLERY.length}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Закрыть просмотр"
              className="tap-target flex items-center justify-center border border-ash-text/20 px-3 text-ash-text transition-colors hover:border-blood-700"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M2 2 L14 14 M14 2 L2 14"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
            </button>
          </div>

          <div
            className="relative min-h-0 flex-1"
            onTouchStart={(e) => {
              touchX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              // Порог 50px: короткие касания не должны листать кадр.
              if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
              touchX.current = null;
            }}
          >
            <Image
              key={current.src}
              src={current.src}
              alt={current.alt}
              fill
              sizes="100vw"
              className="object-contain p-3 sm:p-6"
            />

            {/* Стрелки — только там, где есть мышь: на телефоне листают свайпом */}
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Предыдущий кадр"
              className="tap-target absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center border border-ash-text/20 bg-void/70 px-3 text-ash-text transition-colors hover:border-blood-700 sm:flex"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Следующий кадр"
              className="tap-target absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center border border-ash-text/20 bg-void/70 px-3 text-ash-text transition-colors hover:border-blood-700 sm:flex"
            >
              →
            </button>
          </div>

          <p className="shrink-0 border-t border-iron px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-xs leading-relaxed text-dim-text">
            {current.alt}
            <span className="mt-1 block text-[10px] uppercase tracking-[0.22em] text-faint-text">
              Источник: {current.source} · листайте свайпом
            </span>
          </p>
        </div>
      )}
    </section>
  );
}
