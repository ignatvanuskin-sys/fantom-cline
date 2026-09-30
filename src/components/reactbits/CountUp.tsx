"use client";

/**
 * CountUp — React Bits (https://reactbits.dev, Apache-2.0).
 * Оригинал: src/content/TextAnimations/CountUp.jsx
 *
 * Число плавно «накручивается», когда элемент попадает в экран.
 * Используется для реальной статистики из 2ГИС.
 *
 * Адаптация:
 *  — импорт переведён с motion/react на framer-motion (в проекте стоит он)
 *  — добавлено разделение разрядов неразрывным пробелом (ru-KZ)
 *  — при prefers-reduced-motion число выводится сразу
 */

import {
  useInView,
  useMotionValue,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type Props = {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  /** Разделитель разрядов. По умолчанию — неразрывный пробел. */
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
};

export default function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = " ",
  onStart,
  onEnd,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const motionValue = useMotionValue(direction === "down" ? to : from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);

  const springValue: MotionValue<number> = useSpring(motionValue, {
    damping,
    stiffness,
  });

  const isInView = useInView(ref, { once: true, margin: "0px" });

  // Количество знаков после запятой — чтобы «60,0» не превратилось в «60»
  const getDecimalPlaces = (num: number) => {
    const str = num.toString();
    if (str.includes(".")) {
      const decimals = str.split(".")[1];
      if (parseInt(decimals) !== 0) return decimals.length;
    }
    return 0;
  };
  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

  const formatValue = (latest: number) => {
    const hasDecimals = maxDecimals > 0;
    const formatted = new Intl.NumberFormat("ru-RU", {
      useGrouping: !!separator,
      minimumFractionDigits: hasDecimals ? maxDecimals : 0,
      maximumFractionDigits: hasDecimals ? maxDecimals : 0,
    }).format(latest);
    return separator ? formatted.replace(/[  ]/g, separator) : formatted;
  };

  /*
    Значение, которое попадает в серверную разметку.
    Раньше <span> рендерился пустым, и число существовало только в JS: без
    гидратации (и до срабатывания IntersectionObserver) в блоке статистики
    стояли нули — при том что настоящие 394 оценки и 343 отзыва видны ниже на
    той же странице. Теперь конечное значение есть в HTML сразу, а анимация
    «накручивает» его до него же.
  */
  const startValue = direction === "down" ? to : from;
  const endValue = direction === "down" ? from : to;
  const staticText = formatValue(endValue);

  useEffect(() => {
    // При reduced-motion анимации нет — число сразу конечное.
    if (reduceMotion || !ref.current) return;
    ref.current.textContent = formatValue(startValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, startValue, from, to, direction]);

  useEffect(() => {
    if (isInView && startWhen && !reduceMotion) {
      if (typeof onStart === "function") onStart();

      const timeoutId = setTimeout(
        () => motionValue.set(direction === "down" ? from : to),
        delay * 1000,
      );
      const durationTimeoutId = setTimeout(
        () => {
          if (typeof onEnd === "function") onEnd();
        },
        delay * 1000 + duration * 1000,
      );

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(durationTimeoutId);
      };
    }
  }, [
    isInView,
    startWhen,
    reduceMotion,
    motionValue,
    direction,
    from,
    to,
    delay,
    onStart,
    onEnd,
    duration,
  ]);

  useEffect(() => {
    if (reduceMotion) return;
    const unsubscribe = springValue.on("change", (latest: number) => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [springValue, reduceMotion]);

  // Конечное значение отдаём как содержимое: между рендерами строка не
  // меняется, поэтому React её не трогает, а textContent обновляет анимация.
  return (
    <span className={className} ref={ref}>
      {staticText}
    </span>
  );
}
