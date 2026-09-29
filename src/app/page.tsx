import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Quests from "@/components/Quests";
import HowItWorks from "@/components/HowItWorks";
import Reviews from "@/components/Reviews";
import Booking from "@/components/Booking";
import Contacts from "@/components/Contacts";
import Footer from "@/components/Footer";
import StickyBookingBar from "@/components/StickyBookingBar";

/**
 * Одностраничник с якорными секциями — оптимально для конверсии:
 * посетитель видит комнаты и записывается, не покидая страницу.
 *
 * Липкого CTA снизу больше нет: на телефоне он перекрывал нижний
 * край экрана, конкурировал с «Записью» в шапке и закрывал контент
 * в момент чтения. Запись остаётся в шапке и в меню с тремя точками.
 */
export default function Home() {
  return (
    <>
      {/*
        Ссылка «к содержимому»: страница длинная, а навигация в шапке
        состоит из шести пунктов. Без пропуска человек с клавиатуры
        проходит их заново на каждом переходе. Видна только при фокусе.
      */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:border focus:border-blood-500 focus:bg-void focus:px-4 focus:py-3 focus:text-sm focus:text-ash-text"
      >
        Перейти к содержимому
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Hero />
        <Quests />
        {/*
          Порядок секций — это путь гостя: сначала «какие есть комнаты»,
          затем «как это устроено» и «что говорят другие» — то есть снятие
          возражений, и только после него форма записи. Раньше между
          комнатами и формой стояли галерея, видеостена и лента Instagram:
          три экрана с прокруткой без нового смысла, из-за которых до формы
          на телефоне было около тринадцати тысяч пикселей пути.
        */}
        <HowItWorks />
        <Reviews />
        <Booking />
        <Contacts />
      </main>
      {/* Липкая кнопка записи: только мобильные, живёт вне <main>,
          потому что это не часть потока содержимого */}
      <StickyBookingBar />
      <Footer />
    </>
  );
}
