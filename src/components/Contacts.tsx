import { BUSINESS } from "@/data/quests";
import Reveal from "./Reveal";

/** Контакты + встроенная карта. */
export default function Contacts() {
  return (
    <section
      id="contacts"
      aria-labelledby="contacts-title"
      className="relative bg-ash py-20 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <Reveal className="mb-10 text-center sm:mb-14">
          <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-blood-300">
            Нашёл нас
          </p>
          <h2
            id="contacts-title"
            className="font-display text-4xl text-ash-text sm:text-5xl"
          >
            Где искать
          </h2>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Данные */}
          <Reveal className="border border-iron bg-smoke p-6 sm:p-8">
            <dl className="space-y-6">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.25em] text-faint-text">
                  Адрес
                </dt>
                <dd className="mt-1.5 text-lg text-ash-text">
                  {BUSINESS.address}
                  <span className="block text-sm text-dim-text">
                    {BUSINESS.city}
                  </span>
                </dd>
                <a
                  href={BUSINESS.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-blood-300 transition-colors hover:text-blood-500"
                >
                  Открыть в картах →
                </a>
              </div>

              <div className="border-t border-iron pt-6">
                <dt className="text-[11px] uppercase tracking-[0.25em] text-faint-text">
                  Режим работы
                </dt>
                <dd className="mt-1.5 text-lg text-ash-text">{BUSINESS.hours}</dd>
              </div>

              <div className="border-t border-iron pt-6">
                <dt className="text-[11px] uppercase tracking-[0.25em] text-faint-text">
                  Телефон
                </dt>
                <dd className="mt-1.5">
                  <a
                    href={`tel:${BUSINESS.phone.replace(/[^\d+]/g, "")}`}
                    className="text-lg text-ash-text transition-colors hover:text-blood-300"
                  >
                    {BUSINESS.phone}
                  </a>
                </dd>
              </div>

              <div className="border-t border-iron pt-6">
                <dt className="text-[11px] uppercase tracking-[0.25em] text-faint-text">
                  Instagram
                </dt>
                <dd className="mt-1.5">
                  <a
                    href={BUSINESS.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg text-ash-text transition-colors hover:text-blood-300"
                  >
                    {BUSINESS.instagram}
                  </a>
                </dd>
              </div>
            </dl>
          </Reveal>

          {/* Карта — TODO: уточнить координаты/ссылку */}
          <Reveal delay={100} className="min-h-[280px] border border-iron sm:min-h-[380px]">
            <iframe
              src={BUSINESS.mapEmbed}
              title={`Карта: ${BUSINESS.fullAddress}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[280px] w-full grayscale-[0.6] contrast-125 sm:min-h-[380px]"
              style={{ border: 0 }}
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
