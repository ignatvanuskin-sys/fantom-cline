"use client";

import { useEffect, useRef } from "react";

/**
 * Волосяная полоса прогресса чтения по нижней кромке шапки.
 *
 * Страница длинная — около пятнадцати тысяч пикселей на телефоне, и без
 * такой полосы непонятно, сколько ещё до формы записи.
 *
 * Полоса позиционируется внутри <header>, а не как fixed-элемент:
 * так она наследует его слой наложения и не спорит ни с липкой шапкой,
 * ни с полноэкранным меню.
 *
 * Прогресс пишется через transform: scaleX, а не width: масштабирование
 * считает композитор и не вызывает пересчёт вёрстки на каждый кадр.
 */
export default function ScrollProgress() {
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const bar = barRef.current;
      if (!bar) return;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const ratio =
        scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      bar.style.transform = `scaleX(${ratio})`;
    };

    // Один requestAnimationFrame на событие: без него scroll стреляет
    // десятки раз в секунду и каждый раз трогает стиль.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-px overflow-hidden"
    >
      <span
        ref={barRef}
        className="block h-full origin-left bg-blood-500"
        style={{ transform: "scaleX(0)" }}
      />
    </span>
  );
}
