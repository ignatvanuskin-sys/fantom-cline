import StarIcon from "@/components/horror/StarIcon";
import { BUSINESS, REVIEWS } from "@/data/quests";
import Reveal from "./Reveal";

/**
 * Отзывы с карточки 2ГИС (343 отзыва, рейтинг 5) — см. src/data/quests.ts.
 * Перед публикацией сверить с клиентом: часть отзывов относится к кинотеатру
 * KinoLand, а не к квесту, и вопрос о публикации текстов решает владелец.
 */
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
                        className={`inline-flex ${
                          s < r.rating ? "text-blood-300" : "text-iron"
                        }`}
                      >
                        <StarIcon className="h-3.5 w-3.5" />
                      </span>
                    ))}
                  </div>
                  {/* Источник — ссылкой, а не просто подписью: цитату, которую
                      нельзя проверить, читают как выдуманную. */}
                  <a
                    href={BUSINESS.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="-my-1 inline-flex min-h-11 items-center py-1 text-[10px] uppercase tracking-[0.18em] text-faint-text underline decoration-iron underline-offset-4 transition-colors hover:text-blood-300"
                  >
                    {r.source}
                  </a>
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

        <p className="mt-6 text-center">
          <a
            href={BUSINESS.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center py-1 text-sm text-blood-300 underline-offset-4 hover:underline"
          >
            Все {BUSINESS.reviewCount} отзывов — в карточке 2ГИС
          </a>
        </p>
      </div>
    </section>
  );
}
