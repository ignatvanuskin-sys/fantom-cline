import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Quests from "@/components/Quests";
import HowItWorks from "@/components/HowItWorks";
import Reviews from "@/components/Reviews";
import Booking from "@/components/Booking";
import Contacts from "@/components/Contacts";
import Footer from "@/components/Footer";
import StickyCTA from "@/components/StickyCTA";

/**
 * Одностраничник с якорными секциями — оптимально для конверсии:
 * посетитель видит комнаты и записывается, не покидая страницу.
 */
export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Quests />
        <HowItWorks />
        <Reviews />
        <Booking />
        <Contacts />
      </main>
      <Footer />
      <StickyCTA />
    </>
  );
}
