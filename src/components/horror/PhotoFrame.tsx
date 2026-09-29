import Image from "next/image";
import type { Photo } from "@/data/media";

/**
 * Кадр из 2ГИС / Instagram в оформлении сайта.
 *
 * Реальные фотографии зала — светлые, с тёплым бытовым светом и вывесками.
 * Без обработки они выглядят как чужие вставки на тёмной странице. Поэтому
 * каждый кадр получает:
 *  — затемняющий градиент снизу (под ним читается подпись),
 *  — лёгкое «утопление в кровь» через multiply,
 *  — зерно, как у остального сайта.
 *
 * Размеры не передаём: контейнер задаёт пропорцию, Image работает через fill —
 * значит, не бывает прыжка вёрстки до загрузки картинки.
 */
export default function PhotoFrame({
  photo,
  sizes,
  priority = false,
  className = "",
  tone = "dark",
  grade = true,
}: {
  photo: Photo;
  /** Подсказка браузеру для srcset — экономит мобильный трафик. */
  sizes: string;
  priority?: boolean;
  className?: string;
  tone?: "dark" | "plain";
  /** Снимаем цветокоррекцию — нужно для миниатюр и «честных» превью. */
  grade?: boolean;
}) {
  return (
    <span className={`relative block overflow-hidden bg-smoke ${className}`}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />

      {grade && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-blood-900/25 mix-blend-color"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-void/25"
          />
        </>
      )}

      {tone === "dark" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/90 via-void/20 to-transparent"
        />
      )}
    </span>
  );
}
