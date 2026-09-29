import { BUSINESS } from "@/data/quests";
import DarkMap from "./DarkMap";
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
            Вы почти вышли
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
                  className="-my-1.5 mt-0.5 inline-flex min-h-11 items-center py-1.5 text-sm text-blood-300 transition-colors hover:text-blood-500"
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
                  {BUSINESS.phone ? (
                    <a
                      href={`tel:${BUSINESS.phone.replace(/[^\d+]/g, "")}`}
                      className="-my-1.5 inline-flex min-h-11 items-center py-1.5 text-lg text-ash-text transition-colors hover:text-blood-300"
                    >
                      {BUSINESS.phone}
                    </a>
                  ) : (
                    // TODO: телефон уточняется — пока ведём на запись
                    <a
                      href="#booking"
                      className="-my-1.5 inline-flex min-h-11 items-center py-1.5 text-lg text-blood-300 transition-colors hover:text-blood-500"
                    >
                      Записаться онлайн →
                    </a>
                  )}
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
                      className="-my-1.5 inline-flex min-h-11 items-center py-1.5 text-lg text-ash-text transition-colors hover:text-blood-300"
                  >
                    {BUSINESS.instagram}
                  </a>
                </dd>
              </div>

              <div className="border-t border-iron pt-6">
                <dt className="text-[11px] uppercase tracking-[0.25em] text-faint-text">
                  WhatsApp
                </dt>
                <dd className="mt-1.5">
                  {/* Тот же номер, что и в 2ГИС: WhatsApp-ссылка на карточке
                      ведёт на wa.me/77001538584 — здесь не дублируем номер
                      текстом, чтобы не расходились данные. */}
                  <a
                    href={BUSINESS.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="-my-1.5 inline-flex min-h-11 items-center py-1.5 text-lg text-ash-text transition-colors hover:text-blood-300"
                  >
                    Написать в WhatsApp
                  </a>
                </dd>
              </div>

              {/* Рейтинг 2ГИС — реальные данные, подтверждено 27.09.2026 */}
              <div className="border-t border-iron pt-6">
                <dt className="text-[11px] uppercase tracking-[0.25em] text-faint-text">
                  Рейтинг
                </dt>
                <dd className="mt-1.5 flex items-center gap-2">
                  <span aria-hidden="true" className="text-blood-500">
                    ★
                  </span>
                  <span className="text-lg text-ash-text">{BUSINESS.rating}</span>
                  <span className="text-sm text-faint-text">
                    {BUSINESS.ratingCount} оценок · {BUSINESS.reviewCount}{" "}
                    отзывов
                  </span>
                </dd>
              </div>

              <div className="border-t border-iron pt-6">
                <dt className="text-[11px] uppercase tracking-[0.25em] text-faint-text">
                  Как добраться
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-ash-text/80">
                  {BUSINESS.addressNote} · {BUSINESS.parking}
                  <span className="mt-1 block text-dim-text">
                    Оплата: {BUSINESS.payment}
                  </span>
                </dd>
              </div>
            </dl>
          </Reveal>

          {/* Карта — TODO: уточнить координаты/ссылку */}
          <Reveal
            delay={100}
            className="min-h-[280px] border border-iron sm:min-h-[380px]"
          >
            {/* Своя тёмная карта (Leaflet) + кнопка «Открыть в 2ГИС».
                2ГИС запрещает встраивание в iframe (frame-ancestors 'none'),
                поэтому карта своя, а 2ГИС — источник данных и цель перехода. */}
            <DarkMap />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
