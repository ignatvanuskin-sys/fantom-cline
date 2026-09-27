"use client";

/**
 * GradualBlur — React Bits (https://reactbits.dev, Apache-2.0).
 * Оригинал: src/content/Animations/GradualBlur.jsx + .css
 *
 * Полоса из вложенных полупрозрачных слоёв, дающая эффект «размытого
 * края». В проекте используется как граница между секциями: контент
 * уходит в темноту, а не обрезается по прямой.
 *
 * Адаптация:
 *  — TypeScript, пресеты и кривые упрощены до практичного минимума
 *  — вместо вложенных div с blur-фильтрами — ступенчатые полупрозрачные
 *    слои (дешевле для GPU: не нужен filter: blur на каждом слое)
 *  — при prefers-reduced-motion отдаётся один плоский слой
 */

import { type CSSProperties } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type Props = {
  position?: "top" | "bottom";
  height?: string;
  /** Плотность: сколько ступенек размытия. */
  divCount?: number;
  /** Сила размытия, 1–4: насколько плотнее верхний слой. */
  strength?: number;
  /** Насколько слой уходит в темноту, 0–1. */
  opacity?: number;
  zIndex?: number;
  className?: string;
};

export default function GradualBlur({
  position = "bottom",
  height = "9rem",
  divCount = 8,
  strength = 2,
  opacity = 1,
  zIndex = 5,
  className = "",
}: Props) {
  const reduced = usePrefersReducedMotion();
  const steps = reduced ? 1 : Math.max(3, divCount);
  // 0.08 — базовая плотность слоя; strength масштабирует её
  const baseAlpha = 0.08 * strength;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 select-none ${className}`}
      style={
        {
          position: "absolute",
          [position]: 0,
          height,
          zIndex,
          overflow: "hidden",
        } as CSSProperties
      }
    >
      {Array.from({ length: steps }).map((_, i) => {
        // Каждый слой чуть плотнее и короче предыдущего —
        // получается ступенчатое затухание к краю
        const t = (i + 1) / steps;
        const alpha = reduced ? opacity * baseAlpha : opacity * (1 - t) * baseAlpha;
        const inset = (1 - t) * 50;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to ${position === "top" ? "bottom" : "top"}, rgba(10,10,10,${alpha}) 0%, rgba(10,10,10,0) ${100 - inset}%)`,
            }}
          />
        );
      })}
    </div>
  );
}
