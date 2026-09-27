import { RULES, STEPS } from "@/data/quests";
import Reveal from "./Reveal";
import CrackDivider from "./CrackDivider";

/**
 * «Как проходит игра» — важен для хоррор-квестов: снимает тревогу
 * перед оплатой (правила, что взять, ограничения по здоровью).
 */
export default function HowItWorks() {
  return (
    <section
      id="how"
      aria-labelledby="how-title"
      className="relative bg-ash py-20 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <Reveal className="mb-12 text-center sm:mb-16">
          <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-blood-300">
            Правила выживания
          </p>
          <h2
            id="how-title"
            className="font-display text-4xl text-ash-text sm:text-5xl"
          >
            Что будет с тобой
          </h2>
        </Reveal>

        {/* Шаги — на мобильном вертикальный стек, на десктопе 4 колонки */}
        <ol className="mb-16 grid gap-px border border-iron bg-iron sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal
              key={s.step}
              as="li"
              delay={i * 80}
              className="group relative bg-ash p-6 transition-colors duration-500 hover:bg-smoke"
            >
              <span className="font-display text-4xl text-blood-900 transition-colors duration-500 group-hover:text-blood-700">
                {s.step}
              </span>
              <h3 className="mt-3 text-base font-semibold text-ash-text">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-dim-text">
                {s.text}
              </p>
            </Reveal>
          ))}
        </ol>

        {/* Правила и ограничения */}
        <Reveal className="mx-auto max-w-2xl">
          <h3 className="mb-5 text-center text-sm uppercase tracking-[0.25em] text-faint-text">
            Что взять и чего нельзя
          </h3>
          <ul className="border border-iron bg-smoke">
            {RULES.map((r) => (
              <li
                key={r.text}
                className="flex items-start gap-3 border-b border-iron px-4 py-3.5 text-sm last:border-b-0 sm:px-5"
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 shrink-0 ${
                    r.ok ? "text-[#7fa06a]" : "text-blood-500"
                  }`}
                >
                  {r.ok ? (
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8.5 L6.5 12 L13 4.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M4 4 L12 12 M12 4 L4 12"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  )}
                </span>
                <span className={r.ok ? "text-ash-text/80" : "text-ash-text/70"}>
                  {r.text}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <CrackDivider />
    </section>
  );
}
