"use client";

/**
 * DecryptedText — React Bits (https://reactbits.dev, Apache-2.0).
 * Оригинал: src/content/TextAnimations/DecryptedText.jsx
 *
 * Текст «проявляется из каши символов», как будто декодируется
 * из повреждённого файла. Для хоррор-темы подходит идеально:
 * сообщение выглядит так, будто его нельзя прочитать.
 *
 * Адаптация под проект:
 *  — TypeScript вместо JavaScript
 *  — по умолчанию русский алфавит, а не латиница
 *  — уважает prefers-reduced-motion (сразу показывает готовый текст)
 *  — заменён только на буквы/пробел, чтобы не ломать вёрстку
 */

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type Props = {
  text: string;
  className?: string;
  /** Символы в секунду. Ниже — быстрее/злее. */
  speed?: number;
  /** Максимум одновременно «зашифрованных» символов. */
  maxChars?: number;
  /** Задержка перед стартом, мс. */
  startDelay?: number;
  /** Длительность свечения в конце, мс. */
  revealDuration?: number;
  /** Алфавит для «шума». По умолчанию — русский + латиница + цифры. */
  characters?: string;
  /** Повторять ли цикл. */
  loop?: boolean;
  onComplete?: () => void;
};

const DEFAULT_ALPHABET =
  "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюяABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{};:,.<>/?";

export default function DecryptedText({
  text,
  className = "",
  speed = 32,
  maxChars = 8,
  startDelay = 300,
  revealDuration = 620,
  characters = DEFAULT_ALPHABET,
  loop = false,
  onComplete,
}: Props) {
  // Начальное значение — готовый текст. Пустая строка означала, что в серверной
  // разметке описания нет вовсе: без JS (и до гидратации) первый экран
  // оставался без текста, а поисковик не видел ни строчки. «Расшифровка»
  // стартует позже и лишь временно подменяет символы.
  const [output, setOutput] = useState(text);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  // Таймеры рестарта (для loop) — в ref, иначе переменная используется
  // до объявления (temporal dead zone)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    // При reduced-motion эффект не запускаем вовсе: готовый текст
    // отдаётся прямо во время рендера (см. display ниже). Иначе пришлось бы
    // вызывать setState в эффекте — это даёт каскадный ререндер.
    if (reduced) return;

    const timeout = setTimeout(() => setStarted(true), startDelay);
    timersRef.current.push(timeout);

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, [text, startDelay, reduced]);

  useEffect(() => {
    if (!started) return;

    const chars = Array.from(text);
    const queue = chars.map((ch, i) => ({
      from: ch,
      start: Math.floor((i / chars.length) * revealDuration),
      end: revealDuration + Math.floor(Math.random() * 200),
      random: 0,
    }));
    const startTime = performance.now();

    const interval = setInterval(() => {
      const now = performance.now() - startTime;
      let out = "";

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        if (now >= item.end) {
          out += item.from;
        } else if (now >= item.start) {
          if (!item.from || item.from === " ") {
            out += item.from;
          } else {
            // живой символ подменяется, пока не «встал на место»
            if (!item.random || now > item.start + 32) {
              item.random = Math.random() * (maxChars + 1);
            }
            out += characters[Math.floor(item.random)];
          }
        } else {
          out += characters[Math.floor(Math.random() * characters.length)];
        }
      }

      setOutput(out);

      if (now >= revealDuration + 200) {
        clearInterval(interval);
        setOutput(text);
        setDone(true);
        onComplete?.();
        if (loop) {
          const restart = setTimeout(() => {
            setOutput("");
            setDone(false);
            setStarted(false);
            const again = setTimeout(() => setStarted(true), startDelay);
            timersRef.current.push(again);
          }, 3000);
          timersRef.current.push(restart);
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [started, text, speed, maxChars, revealDuration, characters, loop, startDelay, onComplete]);

  // При reduced-motion показываем готовый текст сразу, без анимации
  const display = reduced || done ? text : output;

  return (
    <span className={className} aria-label={text}>
      {/* экранным читалкам отдаём готовый текст, а не «кашу» */}
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
