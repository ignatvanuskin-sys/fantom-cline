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
      className="relative py-20 sm:py-28"
    >
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-6">
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
            Заполни форму — администратор получит заявку и перезвонит для
            подтверждения. Без звонков и переписок в мессенджерах.
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
            className="text-blood-300 underline-offset-4 hover:underline"
          >
            Напишите нам в Instagram
          </a>
        </p>
      </div>

      <CrackDivider flip />
    </section>
  );
}
