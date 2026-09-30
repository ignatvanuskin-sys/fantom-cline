import DotMatrix from "@/components/horror/DotMatrix";
import { BatGlyph } from "@/components/horror/Gothic";
import SoundToggle from "@/components/horror/SoundToggle";
import { BUSINESS } from "@/data/quests";

const NAV = [
  { href: "#quests", label: "Квесты" },
  { href: "#how", label: "Как проходит" },
  { href: "#reviews", label: "Отзывы" },
  { href: "#booking", label: "Запись" },
  { href: "#contacts", label: "Контакты" },
];

export default function Footer() {
  return (
    <footer className="border-t border-iron bg-void pb-14 pt-14 sm:pb-14 sm:pt-16">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            {/* translate="no": авто-перевод не должен трогать название бренда */}
            <p className="font-display text-3xl text-blood-300" translate="no">
              {BUSINESS.name}
            </p>
            <p className="mt-2 text-sm text-dim-text">
              Хоррор-квест в {BUSINESS.cityIn}
            </p>
          </div>

          <nav aria-label="Навигация в подвале">
            <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-faint-text">
              Разделы
            </p>
            <ul className="space-y-2">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a
                    href={n.href}
                    className="-my-1 inline-flex min-h-11 items-center py-1 text-sm text-dim-text transition-colors hover:text-blood-300"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-faint-text">
              Контакты
            </p>
            <ul className="space-y-2 text-sm text-dim-text">
              <li>{BUSINESS.address}</li>
              {BUSINESS.phone && (
                <li>
                  <a
                    href={`tel:${BUSINESS.phone.replace(/[^\d+]/g, "")}`}
                    // py-1 + min-h-11 = тач-таргет ~44px: номер в подвале
                    // раньше был ссылкой высотой 17px и не попадал под палец
                    className="-my-1 inline-flex min-h-11 items-center py-1 transition-colors hover:text-blood-300"
                  >
                    {BUSINESS.phone}
                  </a>
                </li>
              )}
              <li>{BUSINESS.hours}</li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-faint-text">
              Мы здесь
            </p>
            <a
              href={BUSINESS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target mb-3 inline-flex items-center gap-2 text-sm text-dim-text transition-colors hover:text-blood-300"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M8.8 9.2c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.3 0 .5-.1.7l-.5.6c-.1.2-.2.3 0 .6.3.5.9 1.3 1.7 1.8.8.5 1 .5 1.2.4l.6-.6c.2-.2.4-.2.6-.1l1.6.8c.3.2.4.3.4.5 0 .6-.3 1.3-1.3 1.4-1.1.1-2.7-.5-4.3-2-1.6-1.5-2.2-3-2.1-4 0-.6.4-1.2.7-1.7Z"
                  fill="currentColor"
                />
              </svg>
              WhatsApp
            </a>
            <a
              href={BUSINESS.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target inline-flex items-center gap-2 text-sm text-dim-text transition-colors hover:text-blood-300"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect
                  x="2.5"
                  y="2.5"
                  width="19"
                  height="19"
                  rx="5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" />
              </svg>
              {BUSINESS.instagram}
            </a>
          </div>
        </div>

        {/* Табло наблюдения + готический символ в подвале:
            последнее, что гость видит перед уходом. */}
        <div
          className="mt-10 flex flex-col items-center gap-3 border-t border-iron pt-8"
          aria-hidden="true"
        >
          <DotMatrix text="СИГНАЛ: 06:00" className="h-3.5 w-auto" color="#6b4a24" />
          <BatGlyph className="h-2.5 w-5 text-blood-900" />
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <SoundToggle />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-iron pt-6 text-xs text-faint-text sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BUSINESS.name}. Все права защищены.
          </p>
          <p>Пути назад нет. Берегите себя.</p>
        </div>
      </div>
    </footer>
  );
}
