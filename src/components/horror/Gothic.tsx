/**
 * Готические элементы декора: стрельчатая арка, нервюра,
 * клиновидный орнамент и буквица-капля.
 *
 * Всё рисуется inline-SVG: ни одного растрового файла, цвета
 * наследуются через currentColor, размер — через пропсы.
 */

/** Стрельчатая арка — обрамление для заголовков/разделов. */
export function GothicArch({
  className = "",
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={`relative flex justify-center ${className}`}>
      <svg
        viewBox="0 0 160 120"
        className="h-14 w-28 text-blood-700/45"
        fill="none"
        aria-hidden="true"
      >
        {/* стрельчатый свод: две дуги, сходящиеся в остриё */}
        <path
          d="M8 118V52C8 28 40 6 80 2c40 4 72 26 72 50v66"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        {/* внутренняя нервюра */}
        <path
          d="M24 118V54c0-17 24-34 56-39 32 5 56 22 56 39v64"
          stroke="currentColor"
          strokeWidth="0.9"
          opacity="0.65"
        />
        {/* стрела вверху */}
        <path d="M80 2v14M74 9l6-7 6 7" stroke="currentColor" strokeWidth="1.1" />
        {/* стрельчатое окно внутри */}
        <path
          d="M60 118V76c0-10 9-20 20-24 11 4 20 14 20 24v42"
          stroke="currentColor"
          strokeWidth="0.8"
          opacity="0.5"
        />
        {/* розетка в остриё */}
        <circle cx="80" cy="10" r="2.4" stroke="currentColor" strokeWidth="0.8" />
      </svg>
      {label && (
        <span className="absolute inset-x-0 bottom-0 text-center text-[10px] uppercase tracking-[0.3em] text-blood-300/70">
          {label}
        </span>
      )}
    </div>
  );
}

/** Клиновидный орнамент — готический разделитель (розетка + листья). */
export function GothicDivider({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center gap-3 py-6 ${className}`}
    >
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-rust-700 sm:w-28" />
      <svg viewBox="0 0 48 48" className="h-7 w-7 text-blood-700" fill="none">
        {/* центральная розетка — готический нервюрный мотив */}
        <circle cx="24" cy="24" r="7" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="24" cy="24" r="2.4" fill="currentColor" />
        {/* четыре лепестка-«клевера» */}
        <path
          d="M24 17c0-5 3-8 3-8s3 3 3 8c0 3-3 5-3 5s-3-2-3-5Z"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M31 24c5 0 8 3 8 3s-3 3-8 3c-3 0-5-3-5-3s2-3 5-3Z"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M24 31c0 5-3 8-3 8s-3-3-3-8c0-3 3-5 3-5s3 2 3 5Z"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M17 24c-5 0-8-3-8-3s3-3 8-3c3 0 5 3 5 3s-2 3-5 3Z"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-rust-700 sm:w-28" />
    </div>
  );
}

/**
 * Готическая буквица — «капля» (drop cap).
 * Первая буква выносится в отдельный блок с орнаментом.
 */
export function DropCap({ letter, className = "" }: { letter: string; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="font-display text-[3.4em] leading-[0.72] text-blood-500 drop-shadow-[0_0_18px_rgba(184,18,26,0.45)]">
        {letter}
      </span>
    </span>
  );
}

/** Летящая летучая мышь — готический кант-символ. */
export function BatGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 32"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M32 14c-2 0-3.6.8-4.8 2C25 13 20 9 12 8c3 2 4 4 4.4 6C13 15 9 16 4 16c3 1.6 5 3.4 5 5.6 2-1 3.4-1.6 4.6-1.8 0 2-1 3.4-2.6 4.2 2.6-.4 5-1.8 6.6-3.6L20 30c3.4-2.6 7.4-4 12-4s8.6 1.4 12 4l2.4-10.4c1.6 1.8 4 3.2 6.6 3.6C51.4 23 50.4 21.6 50.4 20c1.2.2 2.6.8 4.6 1.8 0-2.2 2-4 5-5.6-5 0-9-1-12.4-2 0.4-2 1.4-4 4.4-6-8 1-13 5-15.2 8-1.2-1.2-2.8-2-4.8-2Z" />
    </svg>
  );
}
