"use client";

import { useEffect, useRef, useState } from "react";

/**
 * «Раскрытие из темноты» — секции появляются не fade-in'ом,
 * а выезжают из-под тени, как будто выходят на свет фонарика.
 *
 * Motion (framer-motion) подключается динамически и не на мобильных:
 * тяжёлые эффекты упрощаются до лёгких transform/opacity.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Страховка №1: без IntersectionObserver элемент ждал бы вечно.
    // Раньше это означало чёрный экран, теперь — обычный видимый контент.
    // Показываем через таймаут, а не синхронно: setState прямо в теле эффекта
    // запускает каскадный рендер, которого здесь не требуется.
    if (typeof IntersectionObserver === "undefined") {
      const fallback = window.setTimeout(() => setVisible(true), 0);
      return () => window.clearTimeout(fallback);
    }

    // IntersectionObserver дешевле и стабильнее, чем scroll-листенеры
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);

    // Страховка №2: даже если наблюдатель «залип» (бывает на старых
    // мобильных Safari), показываем элемент по таймауту. Пользователь не
    // должен упираться в пустоту ни при каких обстоятельствах.
    const failsafe = window.setTimeout(() => {
      setVisible(true);
      observer.disconnect();
    }, 3000);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  const Tag = as;

  return (
    <Tag
      ref={ref as never}
      className={`reveal-dark ${visible ? "reveal-dark-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
