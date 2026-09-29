"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type HlsJs from "hls.js";
import { BUSINESS } from "@/data/quests";
import { VIDEOS } from "@/data/media";
import Reveal from "./Reveal";

/**
 * Видео от владельца — 17 роликов с карточки 2ГИС.
 *
 * Как это работает и почему именно так:
 *  — 2ГИС отдаёт видео только как HLS-поток (.m3u8), прямых .mp4 нет;
 *  — Safari играет HLS сам, Chrome/Firefox — нет, им нужен hls.js;
 *  — библиотеку тянем динамическим импортом ТОЛЬКО в момент нажатия «play»,
 *    поэтому на первый экран и на мобильный трафик она не влияет;
 *  — обложки скачаны локально: до нажатия из сети не летит ни один байт видео.
 *
 * Одновременно играет ровно один ролик: активация нового размонтирует
 * предыдущий элемент <video>, а вместе с ним уничтожается и HLS-инстанс.
 */
export default function VideoWall() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section
      id="video"
      aria-labelledby="video-title"
      className="relative py-20 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <Reveal className="mb-10 text-center sm:mb-14">
          <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-blood-300">
            Свет включён
          </p>
          <h2
            id="video-title"
            className="font-display text-4xl text-ash-text sm:text-5xl md:text-6xl"
          >
            Камеры писали
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-dim-text sm:text-base">
            {VIDEOS.length} видео, снятых внутри зала. Нажмите на кадр — начнётся
            воспроизведение. Звук включается только по вашему решению.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {VIDEOS.map((clip, i) => (
            <Reveal key={clip.poster} delay={Math.min(i, 6) * 50}>
              <VideoTile
                clip={clip}
                index={i}
                active={active === i}
                onActivate={() => setActive(i)}
              />
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.22em] text-faint-text">
          Видео: 2ГИС, карточка «{BUSINESS.legalName}»
        </p>
      </div>
    </section>
  );
}

function VideoTile({
  clip,
  index,
  active,
  onActivate,
}: {
  clip: (typeof VIDEOS)[number];
  index: number;
  active: boolean;
  onActivate: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    if (!video) return;

    let hls: HlsJs | null = null;
    let cancelled = false;

    (async () => {
      try {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari / iOS умеют HLS нативно — лишний бандл не нужен.
          video.src = clip.hls;
        } else {
          const { default: Hls } = await import("hls.js");
          if (cancelled) return;
          if (!Hls.isSupported()) {
            setFailed(true);
            return;
          }
          hls = new Hls({ maxBufferLength: 15, enableWorker: true });
          hls.loadSource(clip.hls);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, (_event: unknown, data: { fatal?: boolean }) => {
            if (data?.fatal) setFailed(true);
          });
        }
        await video.play().catch(() => {
          /* Автоплей может быть запрещён — пользователь нажмёт play сам. */
        });
      } catch {
        setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [active, clip.hls]);

  const aspect = clip.orientation === "landscape" ? "aspect-video" : "aspect-[9/16]";

  return (
    <div className={`relative w-full overflow-hidden border border-iron bg-smoke ${aspect}`}>
      {active && !failed ? (
        <video
          ref={videoRef}
          controls
          playsInline
          preload="none"
          poster={clip.poster}
          aria-label={clip.title}
          className="absolute inset-0 h-full w-full bg-void object-cover"
        />
      ) : (
        <button
          type="button"
          onClick={onActivate}
          aria-label={`Воспроизвести видео: ${clip.title}`}
          className="group absolute inset-0 block h-full w-full"
        >
          <span aria-hidden="true" className="shimmer-layer" />
          <Image
            src={clip.poster}
            alt={`Кадр из видео «${clip.title}»`}
            fill
            loading={index < 4 ? "eager" : "lazy"}
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 23vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-void/40 transition-colors duration-500 group-hover:bg-void/20"
          />

          {failed ? (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center">
              <span className="text-[11px] uppercase tracking-[0.2em] text-blood-300">
                Не удалось загрузить
              </span>
              <span className="text-[10px] leading-relaxed text-dim-text">
                Поток 2ГИС недоступен
              </span>
            </span>
          ) : (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-blood-500/70 bg-void/70 text-blood-300 backdrop-blur-sm transition-colors duration-300 group-hover:bg-blood-700 group-hover:text-ash-text">
                <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true">
                  <path d="M1 1 L15 9 L1 17 Z" fill="currentColor" />
                </svg>
              </span>
            </span>
          )}

          <span
            aria-hidden="true"
            className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-void/80 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-dim-text"
          >
            <span className="h-1 w-1 rounded-full bg-blood-500" />
            {Math.floor(clip.duration / 60)}:
            {String(clip.duration % 60).padStart(2, "0")}
          </span>
        </button>
      )}
    </div>
  );
}
