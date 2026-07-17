"use client";

import { useCallback, useRef, useState } from "react";
import { Music2, Pause, Play, RotateCcw, RotateCw, type LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";

function clock(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Music, murottal and podcasts. There is nothing to look at, so the artwork
 * carries the screen and the transport is sized to be used without looking.
 */
export function AudioPlayer({
  src,
  title,
  subtitle,
  artwork,
  icon: Icon = Music2,
}: {
  src: string;
  title: string;
  subtitle?: string | null;
  artwork?: string | null;
  icon?: LucideIcon;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [failed, setFailed] = useState(false);

  const seekFromPointer = useCallback((clientX: number) => {
    const rail = railRef.current;
    const a = audioRef.current;
    if (!rail || !a || !a.duration) return;
    const box = rail.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - box.left) / box.width, 0), 1);
    a.currentTime = ratio * a.duration;
    setTime(a.currentTime);
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => setFailed(true));
    else a.pause();
  }

  function skip(by: number) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.min(Math.max(0, a.currentTime + by), a.duration || 0);
  }

  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center">
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => !scrubbing && setTime(e.currentTarget.currentTime)}
      />

      <div
        className={cn(
          "grid aspect-square w-full max-w-[280px] place-items-center overflow-hidden rounded-[2rem] bg-brand-50 shadow-card transition-transform duration-500",
          playing && "scale-105"
        )}
      >
        {artwork ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artwork} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon className={cn("h-20 w-20 text-brand-300", playing && "animate-pulse")} strokeWidth={1.5} />
        )}
      </div>

      <h3 className="mt-6 text-center text-2xl font-extrabold tracking-tight text-ink">{title}</h3>
      {subtitle && <p className="mt-1 text-center text-base font-bold text-ink-mute">{subtitle}</p>}

      {failed ? (
        <p className="mt-6 text-center text-lg font-bold text-ink-mute">
          Audio ini tidak dapat diputar sekarang.
        </p>
      ) : (
        <>
          <div
            ref={railRef}
            role="slider"
            tabIndex={0}
            aria-label="Posisi audio"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(time)}
            aria-valuetext={`${clock(time)} dari ${clock(duration)}`}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") skip(10);
              if (e.key === "ArrowLeft") skip(-10);
            }}
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture?.(e.pointerId);
              setScrubbing(true);
              seekFromPointer(e.clientX);
            }}
            onPointerMove={(e) => scrubbing && seekFromPointer(e.clientX)}
            onPointerUp={() => setScrubbing(false)}
            onPointerCancel={() => setScrubbing(false)}
            className="mt-7 flex w-full cursor-pointer touch-none items-center py-4"
          >
            <div className="relative h-1.5 w-full rounded-full bg-brand-100">
              <div className="absolute inset-y-0 left-0 rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
              <span
                className={cn(
                  "absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500 shadow-float transition-transform",
                  scrubbing ? "scale-125" : "scale-100"
                )}
                style={{ left: `${pct}%` }}
              />
            </div>
          </div>

          <div className="tabular flex w-full justify-between text-sm font-extrabold text-ink-mute">
            <span>{clock(time)}</span>
            <span>{clock(duration)}</span>
          </div>

          <div className="mt-5 flex items-center gap-5">
            <button
              onClick={() => skip(-10)}
              aria-label="Mundur 10 detik"
              className="grid h-16 w-16 place-items-center rounded-full border border-line bg-white text-ink-soft shadow-card transition active:scale-90 hover:border-brand-300 hover:text-brand-700"
            >
              <RotateCcw className="h-7 w-7" strokeWidth={2.4} />
            </button>
            <button
              onClick={toggle}
              aria-label={playing ? "Jeda" : "Putar"}
              className="grid h-24 w-24 place-items-center rounded-full bg-brand-500 text-white shadow-float transition active:scale-95 hover:bg-brand-600"
            >
              {playing ? <Pause className="h-10 w-10 fill-current" /> : <Play className="ml-1.5 h-10 w-10 fill-current" />}
            </button>
            <button
              onClick={() => skip(10)}
              aria-label="Maju 10 detik"
              className="grid h-16 w-16 place-items-center rounded-full border border-line bg-white text-ink-soft shadow-card transition active:scale-90 hover:border-brand-300 hover:text-brand-700"
            >
              <RotateCw className="h-7 w-7" strokeWidth={2.4} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
