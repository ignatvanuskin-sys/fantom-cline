"use client";

import { useEffect, useRef, useState } from "react";
import { ShaderBackground } from "@/components/ui/gem-smoke-diamond";
import { BUSINESS } from "@/data/quests";

/**
 * Первый экран. Ключевые механики:
 *  — фон проявляется через flicker (2–3 резких затемнения при загрузке)
 *  — заголовок появляется буквами с эффектом дрожания
 *  — desktop-only: за курсором тянется лёгкий кровавый след
 */
export default function Hero() {
  const [flickerOn, setFlickerOn] = useState(false);
  const [titleIn, setTitleIn] = useState(false);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // 2–3 резких затемнения перед стабилизацией
    const a = setTimeout(() => setFlickerOn(true), 120);
    const b = setTimeout(() => setFlickerOn(false), 320);
    const c = setTimeout(() => setFlickerOn(true), 460);
    const d = setTimeout(() => setTitleIn(true), 700);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
      clearTimeout(d);
    };
  }, []);

  // Кровавый след за курсором — только desktop, только внутри hero
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const onMove = (e: MouseEvent) => {
      const hero = heroRef.current;
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const inside =
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right;
      if (!inside) {
        setTrail([]);
        return;
      }
      frame++;
      // троттлинг: не чаще раза в 2 кадра — иначе лагает
      if (frame % 2 !== 0) return;
      setTrail((t) => [...t, { x: e.clientX, y: e.clientY }].slice(-14));
    };
    const fade = setInterval(() => {
      setTrail((t) => (t.length ? t.slice(1) : t));
    }, 55);

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      clearInterval(fade);
    };
  }, []);

  const letters = "FANTOM".split("");

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden"
    >
      {/* WebGL-дым (ShaderBackground) — базовый слой темноты.
          Палитра уже перекрашена под Fantom: уголь / кровь / ржавчина.
          Сам компонент останавливает рендер вне экрана и при reduced-motion. */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 -z-20 transition-opacity duration-100 ${
          flickerOn ? "opacity-25" : "opacity-100"
        }`}
      >
        <ShaderBackground className="h-full w-full" />
      </div>

      {/* Фон. TODO: заменить на реальное фото/видео комнаты (см. README).
          Сейчас — CSS-градиент, чтобы макет был полностью рабочим. */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 -z-10 transition-opacity duration-100 ${
          flickerOn ? "opacity-30" : "opacity-100"
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,#1a1210_0%,#0d0d0d_45%,#0a0a0a_100%)]" />
        {/* Лампа в конце коридора — с эффектом агонии (мерцает, потом оживает) */}
        <div className="absolute left-1/2 top-[38%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood-900/30 blur-3xl animate-lamp" />
        {/* пыль/туман — параллакс-слой, медленнее переднего плана */}
        <div className="absolute inset-0 opacity-40 animate-drift bg-[radial-gradient(circle_at_20%_30%,rgba(140,120,110,0.10)_0%,transparent_45%),radial-gradient(circle_at_75%_65%,rgba(120,100,95,0.08)_0%,transparent_40%)]" />
        {/* перспективные линии коридора */}
        <div
          className="absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0 8%, rgba(201,201,201,0.5) 8% 8.15%)",
            maskImage: "radial-gradient(ellipse at 50% 45%, black 5%, transparent 62%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at 50% 45%, black 5%, transparent 62%)",
          }}
        />
        {/* Кровавые потёки по краям — краска стекает по стене */}
        <div className="blood-drip absolute inset-0 opacity-40" />
        {/* Глубокая тень, «съедающая» края кадра */}
        <div className="animate-darkness absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_30%,rgba(0,0,0,0.6)_100%)]" />
      </div>

      {/* Кровавый след за курсором (desktop only) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden md:block"
      >
        {trail.map((p, i) => (
          <span
            key={`${p.x}-${p.y}-${i}`}
            className="absolute h-6 w-6 rounded-full bg-blood-700/25 blur-md"
            style={{
              left: p.x,
              top: p.y,
              transform: "translate(-50%,-50%)",
              opacity: (i / trail.length) * 0.5,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-5 text-center sm:px-6">
        <p
          className={`mb-5 text-[11px] uppercase tracking-[0.35em] text-dim-text transition-opacity duration-1000 sm:text-xs ${
            titleIn ? "opacity-100" : "opacity-0"
          }`}
        >
          Хоррор-квест · {BUSINESS.city}
        </p>

        {/* Заголовок — по буквам, с дрожанием */}
        <h1
          className="font-display text-[22vw] leading-[0.85] text-blood-500 sm:text-[16vw] md:text-[9rem]"
          aria-label={BUSINESS.name}
        >
          {letters.map((letter, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="inline-block"
              style={{
                opacity: titleIn ? 1 : 0,
                transform: titleIn ? "none" : "translate3d(0,24px,0)",
                transition: `opacity 500ms ease ${i * 90}ms, transform 500ms cubic-bezier(0.16,1,0.3,1) ${i * 90}ms`,
                textShadow: "0 0 40px rgba(184,18,26,0.5)",
              }}
            >
              {letter}
            </span>
          ))}
        </h1>

        <p
          className={`mt-6 max-w-md text-balance text-base leading-relaxed text-ash-text/85 transition-opacity duration-1000 sm:text-lg ${
            titleIn ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "700ms" }}
        >
          Дверь закроется. Свет погаснет. Обратного пути не будет — 60 минут,
          чтобы выбраться.
        </p>

        <div
          className={`mt-9 flex w-full flex-col gap-3 transition-opacity duration-1000 sm:w-auto sm:flex-row ${
            titleIn ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "900ms" }}
        >
          <a
            href="#quests"
            className="group tap-target relative inline-flex items-center justify-center overflow-hidden bg-blood-700 px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.15em] text-ash-text transition-colors duration-300 hover:bg-blood-500"
          >
            <span className="relative z-10">Войти, если осмелишься</span>
            {/* «проявление из тумана» при hover */}
            <span className="absolute inset-0 origin-bottom scale-y-0 bg-blood-900 transition-transform duration-500 ease-out group-hover:scale-y-100" />
          </a>
          <a
            href="#booking"
            className="tap-target inline-flex items-center justify-center border border-iron px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.15em] text-dim-text transition-colors duration-300 hover:border-blood-700 hover:text-ash-text"
          >
            Выбрать время
          </a>
        </div>

        <div
          aria-hidden="true"
          className={`mt-16 flex flex-col items-center gap-2 transition-opacity duration-1000 ${
            titleIn ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "1200ms" }}
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-faint-text">
            Листайте вниз
          </span>
          <span className="h-10 w-px bg-gradient-to-b from-blood-700 to-transparent" />
        </div>
      </div>
    </section>
  );
}
