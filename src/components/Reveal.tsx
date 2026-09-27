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
    return () => observer.disconnect();
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
