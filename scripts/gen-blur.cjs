/**
 * Генератор размытых превью для next/image.
 *
 * Запуск: node scripts/gen-blur.cjs
 * Читает public/media/*.jpg и перезаписывает src/data/blur.ts —
 * карты «путь кадра → data URL 24px JPEG».
 *
 * Нужно запускать после замены фотографий в public/media: без свежего превью
 * карточка квеста покажет размытие старого кадра, пока грузится новый.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const mediaDir = path.join(root, "public", "media");
const outFile = path.join(root, "src", "data", "blur.ts");

const files = fs
  .readdirSync(mediaDir)
  .filter((f) => f.endsWith(".jpg"))
  .sort();

(async () => {
  const entries = [];
  for (const f of files) {
    const buf = await sharp(path.join(mediaDir, f))
      .resize(24)
      .jpeg({ quality: 32, progressive: false })
      .toBuffer();
    entries.push([
      `/media/${f}`,
      `data:image/jpeg;base64,${buf.toString("base64")}`,
    ]);
  }

  const body = `/**
 * Размытые превью кадров — 24px по ширине, около половины килобайта каждое.
 *
 * Зачем: next/image не готовит blur автоматически, если src — строка, а не
 * импорт модуля. Без превью карточка квеста в мобильной карусели показывала
 * пустое тёмное место, пока грузился кадр, — на свайпе это читалось как
 * «картинки нет». Теперь на её месте сразу проявляется сам кадр, размытый.
 *
 * Файл сгенерирован: node scripts/gen-blur.cjs
 * Перегенерировать после замены фотографий в public/media.
 */
export const BLUR: Record<string, string> = {
${entries.map(([k, v]) => `  "${k}":\n    "${v}",`).join("\n")}
};
`;

  fs.writeFileSync(outFile, body, "utf8");
  console.log(`blur.ts: ${entries.length} записей из ${mediaDir}`);
})();
