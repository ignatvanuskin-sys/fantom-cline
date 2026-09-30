"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ShaderBackground } from "@/components/ui/gem-smoke-diamond";
import ClickSpark from "@/components/reactbits/ClickSpark";
import DecryptedText from "@/components/reactbits/DecryptedText";
import GlitchText from "@/components/reactbits/GlitchText";
import GradualBlur from "@/components/reactbits/GradualBlur";
import DotMatrix from "@/components/horror/DotMatrix";
import { BatGlyph, GothicDivider } from "@/components/horror/Gothic";
import { sfx } from "@/components/horror/SoundToggle";
import { HERO_SCENE } from "@/data/scenes";
import { BUSINESS } from "@/data/quests";

/**
 * Первый экран. Ключевые механики:
 *  — фон проявляется через flicker (2–3 резких затемнения при загрузке)
 *  — заголовок появляется буквами с эффектом дрожания
 *  — desktop-only: за курсором тянется лёгкий кровавый след
 */
export default function Hero() {
  const [flickerOn, setFlickerOn] = useState(false);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // 2–3 резких затемнения перед стабилизацией
    const a = setTimeout(() => setFlickerOn(true), 120);
    const b = setTimeout(() => setFlickerOn(false), 320);
    const c = setTimeout(() => setFlickerOn(true), 460);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
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

      {/* Фон — реальный кадр из зала (2ГИС, роспись «Теория зла»).
          Это не декорация: первое, что видит гость, — настоящая комната,
          в которую он собирается войти. Поверх неё лежат слои, которые
          гасят свет и добавляют глубину: одна фотография без обработки
          на тёмной странице смотрелась бы как чужеродное светлое пятно. */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 -z-10 overflow-hidden transition-opacity duration-100 ${
          flickerOn ? "opacity-30" : "opacity-100"
        }`}
      >
        <div className="absolute -inset-[6%] animate-drift">
          <Image
            src={HERO_SCENE.src}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        {/* Гасим кадр ровно настолько, чтобы коридор читался, но заголовок
            не тонул в нём: при 72% сцена превращалась в чёрный прямоугольник,
            и фон работал впустую. */}
        <div className="absolute inset-0 bg-void/62" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(26,18,16,0.35)_0%,#0d0d0d_55%,#0a0a0a_100%)]" />
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
      {/* Табло наблюдения: подпись, будто камера в подвале ведёт запись.
          Декоративно и только на широких экранах — на телефоне съедало
          бы место и отвлекало от кнопок. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[13%] hidden -translate-x-1/2 opacity-60 lg:block"
      >
        <DotMatrix
          text="ОБЪЕКТ В СЕТИ"
          className="h-4 w-auto"
          color="#8a0303"
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-5 text-center sm:px-6">
        <p
          // font-glitch — единственное место, где уместна «сбойная»
          // гарнитура: строка короткая, и она и так дрожит по CSS.
          // Трекинг снижен с 0.35em: у этой гарнитуры свои широкие пробелы.
          className="hero-in mb-5 font-glitch text-[11px] uppercase tracking-[0.28em] text-dim-text sm:text-xs"
        >
          {/* React Bits: GlitchText — подпись «сбоит», как плохой сигнал */}
          <GlitchText
            text={`Хоррор-квест · ${BUSINESS.city}`}
            speed={0.14}
            className="text-dim-text"
          >
            Хоррор-квест · {BUSINESS.city}
          </GlitchText>
        </p>

        {/* Заголовок — по буквам, с дрожанием.
            clamp вместо vw: на 320px «FANTOM» рисковал выйти за край,
            на 430+ был мелковат. */}
        <h1
          // blood-300, а не blood-500: главный заголовок лежит на затемнённом
          // фото, и тёмно-красный не дотягивал до 3:1 для крупного текста.
          // Размер подобран под Rubik Wet Paint: он заметно шире прежнего
          // Creepster, и при 21vw слово «FANTOM» ломалось на две строки.
          // 6 знаков при 15.5vw занимают ~90% ширины экрана на 320–414px.
          className="font-display text-[clamp(2.2rem,15.5vw,8rem)] leading-[0.9] text-blood-300 sm:text-[13vw] md:text-[8rem]"
          aria-label={BUSINESS.name}
        >
          {letters.map((letter, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="inline-block"
              // Анимация задана CSS-кадрами, а не переходом от состояния
              // React: заголовок — самый крупный элемент первого экрана,
              // и удерживать его невидимым до гидратации означает отдать
              // LCP в чужие руки. fill-mode both держит начальный кадр
              // до старта задержки.
              style={{
                animation: `letter-in 500ms cubic-bezier(0.16,1,0.3,1) ${i * 70}ms both`,
                textShadow: "0 0 40px rgba(184,18,26,0.5)",
              }}
            >
              {letter}
            </span>
          ))}
        </h1>

        {/* Готический орнамент под логотипом: летучая мышь + розетка */}
        <div
          className="hero-in mt-4 flex flex-col items-center gap-2 sm:mt-5"
          style={{ animationDelay: "400ms" }}
          aria-hidden="true"
        >
          <GothicDivider className="py-0" />
          <BatGlyph className="h-3 w-6 text-blood-700/60" />
        </div>

        {/* min-h резервирует место под самую длинную фазу «расшифровки»:
            пока DecryptedText подменяет буквы, ширина строк меняется и текст
            на секунду занимает на строку больше. Без резерва этот лишний
            перенос толкал вниз кнопки — это и давало CLS 0.13–0.18 на телефоне.
            Значения подобраны по замеру: 4 строки на мобильном, 3 на sm+.
            Компенсируем отступом кнопок ниже (mt-3 вместо mt-7 на мобильном). */}
        <p
          className="hero-in mt-5 min-h-[7rem] max-w-md text-balance text-base leading-relaxed text-ash-text/85 sm:mt-6 sm:min-h-[5.75rem] sm:text-lg"
          style={{ animationDelay: "700ms" }}
        >
          {/* React Bits: DecryptedText — текст «декодируется» из шума,
              будто вскрывают повреждённый файл изнутри квеста */}
          <DecryptedText
            text="Дверь закроется. Свет погаснет. Обратного пути не будет — 60 минут, чтобы выбраться."
            startDelay={1100}
            revealDuration={900}
            speed={26}
          />
        </p>

        <div
          className="hero-in mt-3 flex w-full flex-col items-stretch gap-3 sm:mt-9 sm:w-auto sm:flex-row"
          style={{ animationDelay: "900ms" }}
        >
          {/* React Bits: ClickSpark — из точки клика разлетаются искры,
              как от удара в запертую дверь */}
          <ClickSpark
            sparkColor="#d33a3f"
            sparkRadius={18}
            sparkCount={9}
          >
            <a
              href="#quests"
              onClick={() => sfx("door")}
              className="group tap-target relative flex items-center justify-center overflow-hidden bg-blood-700 px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.15em] text-ash-text transition-[background-color,transform] duration-200 hover:bg-blood-500 active:scale-[0.97]"
            >
              <span className="relative z-10">Войти, если осмелишься</span>
              {/* «проявление из тумана» при hover */}
              <span className="absolute inset-0 origin-bottom scale-y-0 bg-blood-900 transition-transform duration-500 ease-out group-hover:scale-y-100" />
            </a>
          </ClickSpark>

          <ClickSpark sparkColor="#6b4a24" sparkRadius={12} sparkCount={6}>
            <a
              href="#booking"
              className="tap-target flex items-center justify-center border border-iron px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.15em] text-dim-text transition-colors duration-300 hover:border-blood-700 hover:text-ash-text"
            >
              Выбрать время
            </a>
          </ClickSpark>
        </div>

        {/* Подсказка прокрутки: на невысоких телефонах отступ 16rem
            съедал экран, поэтому на мобильных он заметно меньше. */}
        <div
          aria-hidden="true"
          className="hero-in mt-9 flex flex-col items-center gap-2 sm:mt-16"
          style={{ animationDelay: "1200ms" }}
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-faint-text">
            Листайте вниз
          </span>
          <span className="h-10 w-px bg-gradient-to-b from-blood-700 to-transparent" />
        </div>
      </div>

      {/* React Bits: GradualBlur — низ экрана уходит в темноту,
          переход к следующей секции без жёсткой линии */}
      <GradualBlur position="bottom" height="10rem" divCount={9} />
    </section>
  );
}
