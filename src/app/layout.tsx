import type { Metadata, Viewport } from "next";
import {
  Inter,
  Rubik_Glitch,
  Rubik_Wet_Paint,
  Ruslan_Display,
} from "next/font/google";
import "./globals.css";
import { BUSINESS } from "@/data/quests";

/**
 * Шрифтовая система: три гарнитуры плюс основной текст.
 *
 * Все три декоративные гарнитуры взяты с подмножеством `cyrillic`.
 * Это не мелочь: прежний Creepster кириллицу не содержит, поэтому все
 * русские заголовки (а их два десятка) молча падали в системный запасной
 * шрифт — «хоррор» оставался только на латинском логотипе.
 *
 * — Rubik Wet Paint: заголовки. Стекающие капли, жирный штрих,
 *   читается даже мелко.
 * — Ruslan Display: акцент. Старославянская вязь, «оккультный» характер
 *   для названий комнат и логотипа.
 * — Rubik Glitch: подписи в «повреждённых» местах — там, где и так
 *   работает CSS-глитч. Только короткие строки.
 */
const displayFace = Rubik_Wet_Paint({
  variable: "--font-display-face",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: "400",
});

const accentFace = Ruslan_Display({
  variable: "--font-accent-face",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: "400",
});

const glitchFace = Rubik_Glitch({
  variable: "--font-glitch-face",
  subsets: ["latin", "cyrillic"],
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
      className={`${displayFace.variable} ${accentFace.variable} ${glitchFace.variable} ${body.variable} h-full antialiased`}
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

