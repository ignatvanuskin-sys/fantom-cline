"use client";

/**
 * SpotlightCard — React Bits (https://reactbits.dev, Apache-2.0).
 * Оригинал: src/content/Components/SpotlightCard.jsx + .css
 *
 * За курсором по карточке идёт мягкое световое пятно. Идеально ложится
 * на метафору проекта: карточка «освещается фонариком из темноты».
 *
 * Адаптация:
 *  — TypeScript
 *  — пятно по умолчанию кровавое (rgba(184,18,26,…)), а не белое
 *  — радиус пятна и «затухание» вынесены в CSS-переменные
 *  — работает только там, где есть настоящий указатель: на тач-устройствах
 *    событие mousemove всё равно не приходит, но лишние стили не рисуем
 */

import { useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Цвет пятна. */
  spotlightColor?: string;
  /** Диаметр светового пятна, px. */
  spotlightSize?: number;
};

export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(184, 18, 26, 0.16)",
  spotlightSize = 340,
}: Props) {
  const divRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = divRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={`rb-spotlight ${className}`}
      style={
        {
          "--spotlight-color": spotlightColor,
          "--spotlight-size": `${spotlightSize}px`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
