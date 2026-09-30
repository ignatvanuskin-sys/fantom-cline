"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  HorrorAudioEngine,
  type SoundName,
} from "@/lib/horrorAudio";

/**
 * Тумблер страшного звука.
 *
 * Звук выключен по умолчанию и включается только явным кликом —
 * этого требует политика автовоспроизведения браузеров. Громкость низкая
 * (0.18), есть горячая клавиша M и мгновенное глушение на скрытой вкладке.
 *
 * Компонент ещё и «диспетчер»: он слушает кастомные события
 * `fantom:sound` со страницы, чтобы другие части сайта могли играть
 * звуки (хлопок двери, скример) без знания о Web Audio.
 */
export default function SoundToggle() {
  const engineRef = useRef<HorrorAudioEngine | null>(null);
  const [enabled, setEnabled] = useState(false);

  if (typeof window !== "undefined" && !engineRef.current) {
    engineRef.current = new HorrorAudioEngine();
  }

  // Звуки по требованию страницы: window.dispatchEvent(
  //   new CustomEvent("fantom:sound", { detail: "door" }))
  useEffect(() => {
    const onSound = (e: Event) => {
      const name = (e as CustomEvent<SoundName>).detail;
      if (!name) return;
      const engine = engineRef.current;
      if (!engine) return;
      // Одиночные звуки играют даже при выключенном фоне:
      // это «акцент», а не постоянный гул.
      void engine.enable().then(() => engine.play(name));
      if (engine.isEnabled() === false) engine.play(name);
    };
    window.addEventListener("fantom:sound", onSound);
    return () => window.removeEventListener("fantom:sound", onSound);
  }, []);

  // Проверка поддержки Web Audio — внешнее «состояние», поэтому через
  // useSyncExternalStore, а не useState+useEffect (иначе каскадный рендер).
  // Снапшот не меняется за жизнь страницы, так что подписка — noop.
  const supported = useSyncExternalStore(
    () => () => {},
    () => HorrorAudioEngine.supported(),
    // На сервере считаем, что поддержка есть: иначе кнопка не отрендерится
    // и при гидрации появится скачок вёрстки
    () => true,
  );

  // toggle объявлен ниже, поэтому горячую клавишу вешаем через ref
  const toggleRef = useRef<() => void>(() => {});
  useEffect(() => {
    toggleRef.current = () => void toggle();
  });

  useEffect(() => {
    return () => engineRef.current?.destroy();
  }, []);

  // Горячая клавиша M + разблокировка контекста первым жестом
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "m") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      toggleRef.current();
    };
    const onVis = () => engineRef.current?.handleVisibility();
    const unlock = () => {
      const engine = engineRef.current;
      if (engine?.isEnabled()) void engine.enable();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", unlock);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", unlock);
    };
  }, []);

  async function toggle() {
    const engine = engineRef.current;
    if (!engine) return;
    const on = await engine.toggle();
    setEnabled(on);
    if (on) engine.play("door");
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      aria-pressed={enabled}
      aria-label={enabled ? "Выключить страшные звуки" : "Включить страшные звуки"}
      title={enabled ? "Звук включён · клавиша M" : "Звук выключен · клавиша M"}
      // min-w-11: на телефоне подпись скрыта, оставался значок 41px по
      // ширине — меньше минимальной тач-цели 44px
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 border border-iron px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-dim-text transition-colors hover:border-blood-700 hover:text-ash-text sm:justify-start"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M4 9.5h3l4.5-3.7v12.4L7 14.5H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {enabled ? (
          <>
            <path
              d="M15 9.2a4 4 0 0 1 0 5.6"
              stroke="#b8121a"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M17.8 6.6a7.6 7.6 0 0 1 0 10.8"
              stroke="#b8121a"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </>
        ) : (
          <path
            d="M15.5 9.5l5 5m0-5l-5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )}
      </svg>
      <span className="hidden sm:inline">{enabled ? "Звук вкл" : "Звук"}</span>
    </button>
  );
}

/** Короткий помощник: сыграть звук из любого места на странице. */
export function sfx(name: SoundName) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("fantom:sound", { detail: name }));
}
