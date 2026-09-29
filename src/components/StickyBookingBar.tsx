"use client";

import { useEffect, useState } from "react";
import { QUESTS } from "@/data/quests";

/**
 * Липкая панель записи внизу экрана — только на телефоне.
 *
 * Зачем: страница длинная, а цель у неё одна. Пока гость читает про
 * комнаты и правила, кнопка записи должна быть в зоне большого пальца,
 * а не в шапке, до которой надо дотянуться.
 *
 * Поведение намеренно не «всегда видна»:
 *  — появляется, только когда первый экран пройден (в самом начале
 *    кнопка дублирует ту, что уже есть в герое);
 *  — прячется, когда форма записи попадает в кадр — иначе она закрывает
 *    собой нижнюю часть формы, ради которой и существует.
 *
 * Прячется через translate, а не через display: сдвиг считает композитор.
 * Пока панель за экраном, она помечена `inert` — иначе ссылка внутри
 * оставалась бы в порядке обхода табом, будучи невидимой.
 */
export default function StickyBookingBar() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;

      // Пока открыто полноэкранное меню, панель не показываем: она всё
      // равно перекрыта оверлеем, но оставалась бы в порядке обхода табом.
      const menuOpen = Boolean(document.getElementById("mobile-menu"));

      const booking = document.getElementById("booking");
      let formInView = false;
      if (booking) {
        const r = booking.getBoundingClientRect();
        // Форма считается «в кадре», только если она реально пересекает
        // экран. Раньше проверялся один верх: уйдя ниже формы — к контактам
        // и подвалу — гость терял кнопку записи до самого конца страницы и
        // не мог вернуться к записи одним нажатием.
        formInView = r.top < window.innerHeight * 0.9 && r.bottom > 0;
      }

      const pastHero = window.scrollY > window.innerHeight * 0.7;
      setShown(pastHero && !formInView && !menuOpen);
    };

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

  // «от 4 500 ₸» — минимальная цена среди комнат. Формат числа через
  // Intl, а не toLocaleString с ручной подстановкой разделителей.
  const from = Math.min(...QUESTS.map((q) => q.price));
  const fromLabel = new Intl.NumberFormat("ru-RU").format(from);

  return (
    <div
      data-testid="sticky-booking"
      inert={!shown}
      className={`fixed inset-x-0 bottom-0 z-[55] border-t border-iron bg-void/95 backdrop-blur-md transition-transform duration-300 ease-out lg:hidden ${
        shown ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <p className="min-w-0 flex-1 leading-tight">
          <span className="block text-[10px] uppercase tracking-[0.2em] text-faint-text">
            Стоимость
          </span>
          <span className="tnum block truncate font-display text-xl text-ash-text">
            от {fromLabel} <span className="text-blood-300">₸</span>
          </span>
        </p>
        <a
          href="#booking"
          data-testid="sticky-booking-cta"
          className="tap-target flex shrink-0 items-center justify-center bg-blood-700 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ash-text transition-[background-color,transform] duration-200 hover:bg-blood-500 active:scale-[0.97]"
        >
          Забронировать
        </a>
      </div>
    </div>
  );
}
