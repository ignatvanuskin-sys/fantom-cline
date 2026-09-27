"use client";

import { useSyncExternalStore } from "react";

/**
 * Подписка на prefers-reduced-motion.
 *
 * Реализовано через useSyncExternalStore, а не useState + useEffect:
 * matchMedia — это внешний источник, а setState внутри эффекта вызывает
 * каскадный ререндер (на это ругается правило
 * react-hooks/set-state-in-effect). Хук же даёт правильный SSR-safe
 * результат: на сервере отдаёт false, на клиенте — актуальное значение.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return typeof window !== "undefined"
    ? window.matchMedia(QUERY).matches
    : false;
}

// На сервере значение всегда false — чтобы разметка была детерминированной
function getServerSnapshot() {
  return false;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Вариант без SSR-гидратации — для canvas/WebGL, где значение нужно сразу. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia(QUERY).matches
  );
}

export default usePrefersReducedMotion;
