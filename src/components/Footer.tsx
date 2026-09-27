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
    <footer className="border-t border-iron bg-void pb-24 pt-14 sm:pb-14 sm:pt-16">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-3xl text-blood-500">
              {BUSINESS.name}
            </p>
            <p className="mt-2 text-sm text-dim-text">
              Хоррор-квест в {BUSINESS.city}
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
                    className="text-sm text-dim-text transition-colors hover:text-blood-300"
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
                    className="transition-colors hover:text-blood-300"
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
              href={BUSINESS.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-dim-text transition-colors hover:text-blood-300"
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
