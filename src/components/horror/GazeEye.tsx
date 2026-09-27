"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * GazeEye — глаза, которые следят за гостем.
 *
 * Один из самых сильных «дешёвых» приёмов хоррора: взгляд из темноты,
 * который не отводится. Зрачки плавно доводятся до позиции курсора,
 * веки моргают в случайные моменты, а иногда взгляд «дёргается» —
 * будто зрачки заметили движение.
 *
 * Адаптация под проект:
 *  — цвет радужки — тёмно-бордовый (кровь в темноте), а не голубой;
 *  — зрачок слегка «течёт» вбок, создавая неприятный живой эффект;
 *  — на тач-устройствах курсора нет: глаза просто смотрят в никуда и
 *    иногда моргают;
 *  — prefers-reduced-motion: зрачки стоят по центру, моргание отключено;
 *  — атрибут decorative: для читалок это просто украшение.
 */
export default function GazeEye({
  className = "",
  size = 56,
  /** Насколько зрачок уходит от центра, множитель 0..1. */
  range = 1,
}: {
  className?: string;
  size?: number;
  range?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Взгляд держим в ref, а не в state: иначе на каждый кадр mousemove
  // шёл бы ререндер дерева. В DOM пишем через CSS-переменные.
  const targetRef = useRef({ x: 0, y: 0 });
  const curRef = useRef({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;

    let raf = 0;
    let queued = false;

    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      targetRef.current = { x: dx / d, y: dy / d };

      if (queued) return;
      queued = true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        queued = false;
        // Экспоненциальное сглаживание: зрачок «догоняет» цель
        const t = targetRef.current;
        const c = curRef.current;
        c.x += (t.x - c.x) * 0.18;
        c.y += (t.y - c.y) * 0.18;
        el.style.setProperty("--eye-x", `${c.x}`);
        el.style.setProperty("--eye-y", `${c.y}`);
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  // Моргание: случайные интервалы, как у живого глаза
  useEffect(() => {
    if (reduced) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        schedule();
      }, 2600 + Math.random() * 5200);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [reduced]);

  return (
      <div
        ref={ref}
        aria-hidden="true"
        className={`relative select-none ${className}`}
        style={
          {
            width: size,
            height: size * 0.62,
            // Множитель амплитуды взгляда (зрачок не должен уезжать за веко)
            "--eye-reach": range,
          } as React.CSSProperties
        }
      >
      <svg viewBox="0 0 100 62" className="h-full w-full overflow-visible">
        <defs>
          <radialGradient id="gaze-iris" cx="50%" cy="42%">
            <stop offset="0%" stopColor="#d33a3f" />
            <stop offset="45%" stopColor="#8a0303" />
            <stop offset="100%" stopColor="#1a0505" />
          </radialGradient>
          <clipPath id="gaze-clip">
            <path d="M2 31C14 12 34 3 50 3s36 9 48 28c-12 19-32 28-48 28S14 50 2 31Z" />
          </clipPath>
        </defs>

        {/* Белок — не чисто белый, а мутный, как в темноте */}
        <path
          d="M2 31C14 12 34 3 50 3s36 9 48 28c-12 19-32 28-48 28S14 50 2 31Z"
          fill="#1b1a1c"
          stroke="#3a2a18"
          strokeWidth="1.6"
        />
        <g clipPath="url(#gaze-clip)">
          {/* склера с лёгкой «грязью» */}
          <ellipse cx="26" cy="22" rx="12" ry="7" fill="#2a262c" opacity="0.5" />
          <circle cx="50" cy="31" r="17" fill="url(#gaze-iris)" />
          {/* Зрачок смещается через CSS-переменные, которые пишет
              обработчик mousemove, — без единого ререндера React */}
          <circle
            cx="50"
            cy="31"
            r="7.4"
            fill="#080506"
            style={{
              transform: `translate(calc(var(--eye-x, 0) * 13px * var(--eye-reach, 1)), calc(var(--eye-y, 0) * 9px * var(--eye-reach, 1)))`,
            }}
          />
          {/* блик — единственное «живое» в глазу */}
          <circle
            cx="43"
            cy="24"
            r="3"
            fill="#c9c9c9"
            opacity="0.5"
            style={{
              transform: `translate(calc(var(--eye-x, 0) * 13px * var(--eye-reach, 1)), calc(var(--eye-y, 0) * 9px * var(--eye-reach, 1)))`,
            }}
          />
        </g>

        {/* Веко: при моргании «опускается» на глаз */}
        <path
          d="M2 31C14 12 34 3 50 3s36 9 48 28c-12 19-32 28-48 28S14 50 2 31Z"
          fill="#0a0a0a"
          style={{
            transform: blink ? "scaleY(1)" : "scaleY(0)",
            transformOrigin: "50% 31px",
            transition: "transform 90ms ease-in",
          }}
        />
      </svg>
    </div>
  );
}
