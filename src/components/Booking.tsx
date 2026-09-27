import { BUSINESS } from "@/data/quests";
import BookingForm from "./BookingForm";
import CrackDivider from "./CrackDivider";
import Reveal from "./Reveal";

/** Секция онлайн-записи — центральный функциональный блок. */
export default function Booking() {
  return (
    <section
      id="booking"
      aria-labelledby="booking-title"
      className="relative overflow-hidden py-20 sm:py-28"
    >
      {/* Фоновые слои: тёмный дым + лампа + потёки. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="animate-lamp absolute left-1/2 top-8 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood-900/20 blur-3xl" />
        <div className="blood-drip absolute inset-0 opacity-25" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(184,18,26,0.06)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl px-5 sm:px-6">
        <Reveal className="mb-10 text-center sm:mb-12">
          <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-blood-300">
            Онлайн-запись
          </p>
          <h2
            id="booking-title"
            className="font-display text-4xl text-ash-text sm:text-5xl"
          >
            Забронируй место
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-dim-text sm:text-base">
            Заполни форму — администратор получит заявку и перезвонит, чтобы
            подтвердить время. Никаких переписок в мессенджерах.
          </p>
        </Reveal>

        <Reveal>
          <BookingForm />
        </Reveal>

        <p className="mt-6 text-center text-xs text-faint-text">
          Не нашли подходящее время?{" "}
          <a
            href={BUSINESS.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            // py-1 + текст даёт тач-таргет ~44px: на телефоне мелкая
            // ссылка не попадает под палец
            className="-my-1 inline-flex min-h-11 items-center py-1 text-blood-300 underline-offset-4 hover:underline"
          >
            Напишите нам в Instagram
          </a>
        </p>
      </div>

      <CrackDivider flip />
    </section>
  );
}
