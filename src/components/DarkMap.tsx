"use client";

import { useEffect, useRef } from "react";
import { BUSINESS } from "@/data/quests";

/**
 * Тёмная карта с адресом квест-рума.
 *
 * Почему Leaflet, а не iframe 2ГИС/Яндекса:
 *  2ГИС отдаёт заголовок `Content-Security-Policy: frame-ancestors 'none'`,
 *  поэтому их карту запрещено встраивать в iframe — вместо неё браузер
 *  покажет пустоту. Официальный виджет требует ключ API.
 *  Поэтому карта своя (Leaflet + тайлы OpenStreetMap), а 2ГИС остаётся
 *  источником данных и целью для кнопки «Открыть в 2ГИС».
 *
 * Таблички OSM приглушены фильтрами, чтобы вписаться в тёмную тему.
 */
export default function DarkMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;
    // Отменяем загрузку leaflet, если компонент размонтирован раньше
    let cancelled = false;

    // Leaflet обращается к window уже на этапе импорта модуля, поэтому его
    // нельзя тянуть статически: сборка пререндерит страницу на сервере и
    // упадёт с «window is not defined». Грузим только в браузере.
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      const { lat, lon } = BUSINESS.geo;

      const map = L.map(el, {
        center: [lat, lon],
        // 17 — приближение из ссылки 2ГИС, показывает вход в цоколь
        zoom: BUSINESS.geoZoom ?? 17,
        scrollWheelZoom: false, // не перехватываем прокрутку страницы
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Метка входа. Стандартный icon-ассет не нужен — рисуем круг в CSS,
      // так не тащим с собой файлы-картинки. Размер 44px — чтобы попасть
      // под палец на телефоне.
      const marker = L.marker([lat, lon], {
        icon: L.divIcon({
          className: "",
          html: `<span class="fantom-pin"></span>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        }),
        title: BUSINESS.fullAddress,
        alt: `Вход: ${BUSINESS.fullAddress}`,
      }).addTo(map);

      // Подсказка с адресом
      marker.bindTooltip(BUSINESS.address, {
        direction: "top",
        offset: [0, -14],
        className: "fantom-tooltip",
      });

      // Клик по карте открывает адрес в 2ГИС
      map.on("click", () => {
        window.open(BUSINESS.mapUrl, "_blank", "noopener,noreferrer");
      });

      // Leaflet требует invalidateSize, когда контейнер становится видимым
      // (ленивая загрузка секции, смена брейкпоинта)
      const observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(el);
      mapRef.current = map;

      return () => {
        observer.disconnect();
        map.remove();
      };
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full min-h-[280px] w-full sm:min-h-[380px]">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Затемняющая вуаль поверх тайлов — вписывает карту в тему.
          pointer-events-none, чтобы не мешать скроллу и зуму. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[400] bg-void/35"
      />

      {/* Кнопка-ссылка на 2ГИС — основной сценарий для точного маршрута */}
      <a
        href={BUSINESS.mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute left-4 top-4 z-[500] inline-flex min-h-11 items-center gap-2 border border-blood-700/60 bg-void/85 px-3.5 py-2.5 text-[11px] uppercase tracking-[0.15em] text-ash-text backdrop-blur-sm transition-colors hover:border-blood-500 hover:bg-blood-900/70"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"
            stroke="#b8121a"
            strokeWidth="1.7"
          />
          <circle cx="12" cy="10" r="2.4" stroke="#b8121a" strokeWidth="1.7" />
        </svg>
        Открыть в 2ГИС
      </a>

      <style>{`
        /* Метка: пульсирующее кровавое кольцо */
        .fantom-pin {
          display: block;
          width: 30px;
          height: 30px;
          border-radius: 999px;
          background: radial-gradient(circle, #b8121a 0%, #8a0303 45%, transparent 72%);
          box-shadow: 0 0 22px 4px rgba(184, 18, 26, 0.55);
          animation: fantom-ping 2.4s ease-out infinite;
        }
        @keyframes fantom-ping {
          0%   { transform: scale(0.72); opacity: 0.95; }
          70%  { transform: scale(1.25); opacity: 0.25; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        /* Темная подсказка */
        .fantom-tooltip {
          background: #0a0a0a;
          border: 1px solid #8a0303;
          color: #c9c9c9;
          font-size: 12px;
          letter-spacing: 0.02em;
          box-shadow: 0 0 24px -6px rgba(184,18,26,0.7);
        }
        .fantom-tooltip::before { border-top-color: #8a0303; }
        /* Приглушаем тайлы под тёмную тему */
        .leaflet-tile-pane {
          filter: grayscale(0.75) invert(0.92) brightness(0.82) contrast(1.12);
        }
        /* Кнопки зума Leaflet: стандартные 30×30 маловаты для пальца.
           Увеличиваем до 44×44, не ломая раскладку панели. */
        .leaflet-control-zoom a {
          background: #0a0a0a;
          color: #c9c9c9;
          border: 1px solid #1c1a19;
          width: 44px;
          height: 44px;
          line-height: 44px;
          font-size: 18px;
        }
        .leaflet-control-zoom a:hover {
          background: #8a0303;
          color: #e8e8e8;
        }
        .leaflet-control-attribution {
          background: rgba(10, 10, 10, 0.82) !important;
          color: #5e5e5e !important;
          font-size: 10px;
        }
        .leaflet-control-attribution a { color: #8a8a8a !important; }
      `}</style>
    </div>
  );
}
