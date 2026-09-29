import Image from "next/image";
import { BUSINESS } from "@/data/quests";
import { INSTAGRAM_AVATAR, INSTAGRAM_POSTS } from "@/data/media";
import Reveal from "./Reveal";

/**
 * Публикации @fantom_uka_ — реальные подписи автора, ничего не переписано.
 *
 * Показываем не все 12 обложек: часть публикаций — это скриншот интерфейса
 * бронирования, заставка «мы находимся» или кадр с наложением «CAMERA 01».
 * Как обложка карточки они читаются плохо (см. public/media/classification.json),
 * поэтому оставлены только кадры зала и актёров.
 */

const ORDER = [
  "instagram/ig-03.jpg", // актёр-«монахиня» в синем свете
  "instagram/ig-01.jpg", // фрагмент росписи с демоном
  "instagram/ig-09.jpg", // лицо актёра в синем свете
  "instagram/ig-12.jpg", // роспись в тёмно-красном свете
  "instagram/ig-04.jpg", // костюмы актёров
  "instagram/ig-08.jpg", // красная дверь и силуэт в проёме
  "instagram/ig-10.jpg", // неоновая надпись FANTOM
];

const POSTS = ORDER.map((file) =>
  INSTAGRAM_POSTS.find((p) => p.src.endsWith(file)),
).filter((p): p is (typeof INSTAGRAM_POSTS)[number] => Boolean(p));

export default function InstagramStrip() {
  return (
    <section
      id="instagram"
      aria-labelledby="instagram-title"
      className="relative overflow-hidden py-20 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <Reveal className="mb-10 flex flex-col items-center text-center sm:mb-14">
          <Image
            src={INSTAGRAM_AVATAR}
            alt="Логотип Quest House FANTOM"
            width={56}
            height={56}
            className="mb-4 h-14 w-14 rounded-full border border-iron"
          />
          <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-blood-300">
            Их словами
          </p>
          <h2
            id="instagram-title"
            className="font-display text-4xl text-ash-text sm:text-5xl"
          >
            Что пишут в Instagram
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-dim-text sm:text-base">
            Живые публикации {BUSINESS.instagram} — подписи оставлены как есть,
            без редактуры.
          </p>
        </Reveal>

        {/* Mobile: свайп-лента. Desktop: сетка. */}
        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {POSTS.map((post, i) => (
            <Reveal
              key={post.src}
              delay={Math.min(i, 6) * 70}
              className="w-[74vw] shrink-0 snap-center sm:w-auto"
            >
              <figure className="flex h-full flex-col border border-iron bg-smoke">
                <span className="relative block aspect-[4/5] w-full overflow-hidden">
                  <Image
                    src={post.src}
                    alt={post.alt}
                    fill
                    loading={i < 3 ? "eager" : "lazy"}
                    sizes="(max-width: 640px) 74vw, (max-width: 1024px) 31vw, 23vw"
                    className="object-cover"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-void/85 via-transparent to-transparent"
                  />
                </span>

                <blockquote className="flex-1 p-4 text-sm leading-relaxed text-ash-text/80">
                  {post.caption}
                </blockquote>

                <figcaption className="border-t border-iron px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-faint-text">
                  {BUSINESS.instagram}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <p className="mt-2 text-center text-[11px] uppercase tracking-[0.25em] text-faint-text sm:hidden">
          ← листайте →
        </p>

        <div className="mt-8 text-center">
          <a
            href={BUSINESS.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target inline-flex items-center justify-center border border-iron px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-dim-text transition-colors hover:border-blood-700 hover:text-ash-text"
          >
            Все публикации в Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
