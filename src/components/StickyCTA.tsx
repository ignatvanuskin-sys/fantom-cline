"use client";

import { useEffect, useState } from "react";

/**
 * Липкий CTA внизу экрана на мобильном — запись всегда под рукой,
 * не нужно скроллить до формы. Появляется после первого экрана,
 * чтобы не перекрывать hero.
 */
export default function StickyCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const booking = document.getElementById("booking");
      // прячем, когда сама форма уже на экране
      const past = booking
        ? booking.getBoundingClientRect().top < window.innerHeight
        : false;
      setShow(window.scrollY > window.innerHeight * 0.7 && !past);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-iron bg-void/95 backdrop-blur-md transition-transform duration-500 sm:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <a
        href="#booking"
        className="tap-target flex items-center justify-center bg-blood-700 px-5 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-ash-text active:bg-blood-500"
      >
        Забронировать место
      </a>
    </div>
  );
}
