/**
 * Декоративные «царапины / трещины» — заменяют ровные прямые разделители
 * между секциями. Чистый SVG, не влияет на производительность.
 */
export default function CrackDivider({
  flip = false,
  className = "",
}: {
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex w-full items-center justify-center py-10 sm:py-14 ${className}`}
    >
      <svg
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
        className={`h-10 w-full max-w-3xl ${flip ? "rotate-180" : ""}`}
        fill="none"
      >
        <defs>
          <linearGradient id="crack-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8a0303" stopOpacity="0" />
            <stop offset="50%" stopColor="#8a0303" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#8a0303" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* основная трещина — ломаная линия, а не прямая */}
        <path
          d="M0 34 L38 32 L64 36 L96 26 L118 30 L146 22 L164 28 L196 18 L214 26 L248 24 L268 32 L302 27 L330 33 L362 29 L400 32"
          stroke="url(#crack-fade)"
          strokeWidth="1.2"
        />
        {/* ответвления */}
        <path
          d="M118 30 L112 46 M196 18 L202 40 M268 32 L274 46 M330 33 L336 44"
          stroke="url(#crack-fade)"
          strokeWidth="0.7"
          opacity="0.6"
        />
        {/* потёки/пятна ржавчины */}
        <circle cx="146" cy="22" r="1.6" fill="#8a0303" opacity="0.5" />
        <circle cx="302" cy="27" r="1.1" fill="#6b4a24" opacity="0.6" />
        <circle cx="64" cy="36" r="0.9" fill="#8a0303" opacity="0.35" />
      </svg>
    </div>
  );
}
