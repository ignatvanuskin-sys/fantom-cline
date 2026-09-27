/**
 * Подписка на CSS-медиазапрос.
 *
 * Нужна там, где различается не только стиль, но и СОСТАВ разметки
 * (например, форма записи: на телефоне пошаговый мастер, на десктопе —
 * всё на одной странице). Дублировать разметку и прятать через
 * `hidden md:block` нельзя: получим дубли id у полей и поломанные label.
 *
 * Реализовано на useSyncExternalStore, а не useState + useEffect —
 * так нет каскадного рендера и корректна гидрация (на сервере отдаём false).
 */
import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () =>
      typeof window !== "undefined" ? window.matchMedia(query).matches : false,
    // На сервере считаем «десктоп»: разметка десктопной версии полная,
    // мобильная появляется после гидрации
    () => false,
  );
}

/** Телефон: до 768px включительно. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

export default useMediaQuery;
