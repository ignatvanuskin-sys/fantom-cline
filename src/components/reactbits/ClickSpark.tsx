"use client";

/**
 * ClickSpark — React Bits (https://reactbits.dev, Apache-2.0).
 * Оригинал: src/content/Animations/ClickSpark.jsx
 *
 * Из точки клика разлетаются искры. Подключаем к кнопке записи —
 * даёт тактильный отклик «вы тронули дверь».
 *
 * Адаптация:
 *  — TypeScript
 *  — цвет по умолчанию кровавый
 *  — rAF-цикл останавливается, когда искр нет (в оригинале он крутится
 *    бесконечно впустую и ест батарею)
 *  — при prefers-reduced-motion канвас не рисует вовсе
 */

import { useCallback, useEffect, useRef, type ReactNode } from "react";

type Props = {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  extraScale?: number;
  children: ReactNode;
  className?: string;
};

type Spark = { x: number; y: number; angle: number; startTime: number };

export default function ClickSpark({
  sparkColor = "#b8121a",
  sparkSize = 10,
  sparkRadius = 16,
  sparkCount = 8,
  duration = 420,
  easing = "ease-out",
  extraScale = 1.0,
  children,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  // Последняя отрисовка нужна, чтобы цикл понимал, когда пора остановиться
  const lastFrameRef = useRef<number | null>(null);
  // Обработчик клика держим в ref: JSX не должен пересоздаваться на каждый
  // рендер, а объявить его надо ДО эффекта, который его заполняет
  const handleClickRef = useRef<((e: React.MouseEvent) => void) | null>(null);

  // --- Подгонка размера канваса под родителя ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 100);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(parent);
    resizeCanvas();

    return () => {
      ro.disconnect();
      clearTimeout(resizeTimeout);
    };
  }, []);

  const easeFunc = useCallback(
    (t: number) => {
      switch (easing) {
        case "linear":
          return t;
        case "ease-in":
          return t * t;
        case "ease-in-out":
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default:
          return t * (2 - t);
      }
    },
    [easing],
  );

  // --- Цикл отрисовки (стартует при клике и гаснет, когда искр не осталось) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let animationId: number | undefined;

    const draw = (timestamp: number) => {
      lastFrameRef.current = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) return false;

        const progress = elapsed / duration;
        const eased = easeFunc(progress);
        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        return true;
      });

      // Искры кончились — останавливаем rAF, не крутим цикл впустую
      if (sparksRef.current.length === 0) {
        animationId = undefined;
        lastFrameRef.current = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      animationId = requestAnimationFrame(draw);
    };

    const ensureRunning = (now: number) => {
      if (animationId === undefined) {
        lastFrameRef.current = now;
        animationId = requestAnimationFrame(draw);
      }
    };

    handleClickRef.current = (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = performance.now();

      // Если цикл уже идёт — время отсчёта берём у последнего кадра,
      // иначе искры «прыгают» на duration при быстрых повторных кликах
      const base = lastFrameRef.current ?? now;

      const newSparks: Spark[] = Array.from({ length: sparkCount }, (_, i) => ({
        x,
        y,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: base,
      }));
      sparksRef.current.push(...newSparks);
      ensureRunning(now);
    };

    return () => {
      if (animationId !== undefined) cancelAnimationFrame(animationId);
      handleClickRef.current = null;
    };
  }, [sparkColor, sparkSize, sparkRadius, sparkCount, duration, easeFunc, extraScale]);

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%" }}
      onClick={(e) => handleClickRef.current?.(e)}
      className={className}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          userSelect: "none",
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}
