import { REVIEWS } from "@/data/quests";
import Reveal from "./Reveal";

/** TODO: заменить плейсхолдеры на реальные отзывы из 2GIS / Instagram. */
export default function Reviews() {
  return (
    <section
      id="reviews"
      aria-labelledby="reviews-title"
      className="py-20 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <Reveal className="mb-10 text-center sm:mb-14">
          <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-blood-300">
            Говорили, выходя из комнаты
          </p>
          <h2
            id="reviews-title"
            className="font-display text-4xl text-ash-text sm:text-5xl"
          >
            Их уже выпустили
          </h2>
        </Reveal>

        {/* Mobile: свайп-карусель. Desktop: сетка 2×2. */}
        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0">
          {REVIEWS.map((r, i) => (
            <Reveal
              key={r.id}
              delay={i * 70}
              className="w-[82vw] shrink-0 snap-center sm:w-auto"
            >
              <figure className="flex h-full flex-col border border-iron bg-smoke p-5 sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex gap-0.5" aria-label={`Оценка ${r.rating} из 5`}>
                    {Array.from({ length: 5 }).map((_, s) => (
                      <span
                        key={s}
                        aria-hidden="true"
                        className={`text-xs ${
                          s < r.rating ? "text-blood-500" : "text-iron"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-faint-text">
                    {r.source}
                  </span>
                </div>

                <blockquote className="flex-1 text-sm leading-relaxed text-ash-text/85">
                  «{r.text}»
                </blockquote>

                <figcaption className="mt-4 flex items-center gap-2.5 border-t border-iron pt-4">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-blood-900 font-display text-sm text-blood-300"
                  >
                    {r.name.charAt(0)}
                  </span>
                  <span className="text-sm text-dim-text">{r.name}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <p className="mt-4 text-center text-[11px] uppercase tracking-[0.25em] text-faint-text sm:hidden">
          ← листайте →
        </p>
      </div>
    </section>
  );
}
