import type { Metadata, Viewport } from "next";
import { Creepster, Inter } from "next/font/google";
import "./globals.css";
import { BUSINESS } from "@/data/quests";

/**
 * Акцентный display-шрифт — готический/тревожный.
 * subset: latin (кириллицы в Creepster нет), display:swap для быстрой отрисовки.
 */
const horror = Creepster({
  variable: "--font-horror",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const TITLE = `Квест-рум «${BUSINESS.name}» — ${BUSINESS.city}`;
const DESCRIPTION =
  "Хоррор-квест в Усть-Каменогорске. Дверь закроется, свет погаснет — 60 минут, чтобы выбраться. Онлайн-запись за минуту.";

export const metadata: Metadata = {
  metadataBase: new URL("https://fantom-uka.vercel.app"), // TODO: заменить на домен клиента
  title: {
    default: TITLE,
    template: `%s — ${BUSINESS.name}`,
  },
  description: DESCRIPTION,
  keywords: [
    "квест комната",
    "квест-рум Усть-Каменогорск",
    "хоррор квест",
    "Fantom",
    "квест Назарбаева 50",
    "забронировать квест",
  ],
  openGraph: {
    type: "website",
    locale: "ru_KZ",
    siteName: BUSINESS.name,
    title: TITLE,
    description: DESCRIPTION,
    // TODO: заменить на реальное OG-изображение 1200×630
    images: ["/og.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${horror.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-void text-ash-text">
        {children}
      </body>
    </html>
  );
}

