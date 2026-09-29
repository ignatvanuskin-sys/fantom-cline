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
  // Текущий адрес сборки на Vercel. TODO: заменить на домен клиента,
  // когда он появится — metadataBase влияет на все абсолютные ссылки в OG.
  metadataBase: new URL("https://fantom-cline.vercel.app"),
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
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Роспись «Теория зла» в зале квест-рума Fantom",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.jpg"],
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
        {/*
          Ставим `js-ready` синхронно, до первой отрисовки. Пока этого класса
          нет, CSS не прячет контент (см. .reveal-dark в globals.css) — то есть
          при любом сбое JS страница остаётся читаемой, а не чёрной.
          dangerouslySetInnerHTML здесь уместен: это статичный литерал,
          внешние данные не подставляются.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js-ready')",
          }}
        />
        {children}
      </body>
    </html>
  );
}

