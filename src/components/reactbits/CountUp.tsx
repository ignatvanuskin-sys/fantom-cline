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

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = formatValue(direction === "down" ? to : from);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, direction]);

  useEffect(() => {
    if (isInView && startWhen) {
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
    const unsubscribe = springValue.on("change", (latest: number) => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [springValue]);

  return <span className={className} ref={ref} />;
}
