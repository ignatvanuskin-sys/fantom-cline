"use client";

/**
 * GlitchText — React Bits (https://reactbits.dev, Apache-2.0).
 * Оригинал: src/content/TextAnimations/GlitchText.jsx + .css
 *
 * Текст «сбоит»: появляются красный и бирюзовый призраки со смещением.
 * В оригинале тени — красный/циан; здесь они подогнаны под палитру
 * Fantom (кровь / холодный ржавый отсвет), иначе эффект выглядел бы
 * неоново и выбивался бы из хоррор-темы.
 *
 * Стили вшиты в компонент (в оригинале — отдельный CSS-файл),
 * чтобы не тащить глобальные классы .glitch в проект.
 */

import { type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type Props = {
  children: ReactNode;
  /**
   * Текст для CSS-псевдоэлементов ::before/::after (подставляется
   * в content: attr(data-text)). Нужен, когда children — не строка
   * (например, содержит вложенный элемент с переменной).
   */
  text?: string;
  className?: string;
  /** Скорость сбоя. Ниже — агрессивнее. */
  speed?: number;
  enableShadows?: boolean;
  enableOnHover?: boolean;
};

export default function GlitchText({
  children,
  text,
  className = "",
  speed = 0.5,
  enableShadows = true,
  enableOnHover = false,
}: Props) {
  // reduced-motion: глитч-анимацию не запускаем вовсе
  const reduced = usePrefersReducedMotion();
  const mounted = !reduced;

  // Если children — строка, берём её; иначе требуем явный text
  const plain =
    text ?? (typeof children === "string" ? children : undefined);

  const style = {
    "--after-duration": `${speed * 3}s`,
    "--before-duration": `${speed * 2}s`,
    // Цвета призраков. В оригинале — красный и циан; здесь кровь
    // и холодный ржавый отсвет, иначе неон выбивается из хоррор-темы.
    "--glitch-after": enableShadows ? "#b8121a" : "transparent",
    "--glitch-before": enableShadows ? "#6b4a24" : "transparent",
  } as React.CSSProperties;

  return (
    <span
      className={`rb-glitch ${enableOnHover ? "rb-glitch--hover" : ""} ${
        mounted ? "rb-glitch--on" : ""
      } ${className}`}
      style={style}
      data-text={plain}
    >
      {children}
    </span>
  );
}
