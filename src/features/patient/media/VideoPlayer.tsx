"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/src/lib/utils";

/** mm:ss, or h:mm:ss once a video is long enough to need it. */
function clock(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Video for a patient in a bed: hands may be tired, the tablet is at arm's
 * length, and the native control bar is a row of 24px targets. So the whole
 * frame is the play/pause target, the scrubber is a thumb-sized rail, and the
 * chrome fades out of the way once playback settles.
 */
export function VideoPlayer({ src, poster }: { src: string; poster?: string | null }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [chrome, setChrome] = useState(true);
  const [full, setFull] = useState(false);
  const [failed, setFailed] = useState(false);

  const clearHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  };

  /** Show the chrome and start its countdown to fade. */
  const wake = useCallback(() => {
    setChrome(true);
    clearHide();
    hideTimer.current = setTimeout(() => setChrome(false), 2600);
  }, []);

  /** Show the chrome and leave it up — paused or mid-scrub, it must stay. */
  const hold = useCallback(() => {
    setChrome(true);
    clearHide();
  }, []);

  useEffect(() => clearHide, []);

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function toggle() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => setFailed(true));
    else v.pause();
  }

  function skip(by: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, v.currentTime + by), v.duration || 0);
    wake();
  }

  function seekFromPointer(clientX: number) {
    const rail = railRef.current;
    const v = videoRef.current;
    if (!rail || !v || !v.duration) return;
    const box = rail.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - box.left) / box.width, 0), 1);
    v.currentTime = ratio * v.duration;
    setTime(v.currentTime);
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    else await stageRef.current?.requestFullscreen().catch(() => {});
  }

  const pct = duration ? (time / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;

  if (failed) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-3xl bg-ink px-6 text-center">
        <p className="text-xl font-bold text-white/80">
          Video ini tidak dapat diputar sekarang. Coba lagi nanti atau pilih tayangan lain.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={stageRef}
      onMouseMove={wake}
      className={cn(
        "group relative w-full overflow-hidden bg-ink",
        full ? "h-screen rounded-none" : "aspect-video rounded-3xl"
      )}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        playsInline
        className="h-full w-full object-contain"
        onClick={toggle}
        onPlay={() => {
          setPlaying(true);
          wake();
        }}
        onPause={() => {
          setPlaying(false);
          hold();
        }}
        onEnded={() => {
          setPlaying(false);
          hold();
        }}
        onError={() => setFailed(true)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => !scrubbing && setTime(e.currentTarget.currentTime)}
        onProgress={(e) => {
          const b = e.currentTarget.buffered;
          if (b.length) setBuffered(b.end(b.length - 1));
        }}
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
      />

      {/* Centre control. Big while idle, out of the way once playing. */}
      <button
        onClick={toggle}
        aria-label={playing ? "Jeda" : "Putar"}
        className={cn(
          "absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-brand-600 shadow-float transition-all duration-300 active:scale-95",
          playing && !chrome && "pointer-events-none scale-75 opacity-0"
        )}
      >
        {playing ? (
          <Pause className="h-10 w-10 fill-current" />
        ) : (
          <Play className="ml-1.5 h-10 w-10 fill-current" />
        )}
      </button>

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/60 to-transparent px-5 pb-4 pt-16 transition-opacity duration-300 sm:px-7 sm:pb-6",
          chrome ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {/* Scrubber. The hit area is 40px tall even though the rail reads as
            6px, so it can be grabbed without aiming. */}
        <div
          ref={railRef}
          role="slider"
          tabIndex={0}
          aria-label="Posisi video"
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
            hold();
            seekFromPointer(e.clientX);
          }}
          onPointerMove={(e) => scrubbing && seekFromPointer(e.clientX)}
          onPointerUp={() => {
            setScrubbing(false);
            if (playing) wake();
          }}
          onPointerCancel={() => {
            setScrubbing(false);
            if (playing) wake();
          }}
          className="flex cursor-pointer touch-none items-center py-4"
        >
          <div className="relative h-1.5 w-full rounded-full bg-white/25">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/30"
              style={{ width: `${bufPct}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-brand-500"
              style={{ width: `${pct}%` }}
            />
            <span
              className={cn(
                "absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-float transition-transform",
                scrubbing ? "scale-125" : "scale-100"
              )}
              style={{ left: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <CtlButton onClick={toggle} label={playing ? "Jeda" : "Putar"}>
            {playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
          </CtlButton>
          <CtlButton onClick={() => skip(-10)} label="Mundur 10 detik">
            <RotateCcw className="h-6 w-6" strokeWidth={2.4} />
          </CtlButton>
          <CtlButton onClick={() => skip(10)} label="Maju 10 detik">
            <RotateCw className="h-6 w-6" strokeWidth={2.4} />
          </CtlButton>

          <p className="tabular ml-1 text-base font-extrabold text-white sm:text-lg">
            {clock(time)} <span className="font-bold text-white/50">/ {clock(duration)}</span>
          </p>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <CtlButton
              onClick={() => videoRef.current && (videoRef.current.muted = !videoRef.current.muted)}
              label={muted ? "Bunyikan" : "Bisukan"}
            >
              {muted ? <VolumeX className="h-6 w-6" strokeWidth={2.4} /> : <Volume2 className="h-6 w-6" strokeWidth={2.4} />}
            </CtlButton>
            <CtlButton onClick={toggleFullscreen} label={full ? "Keluar layar penuh" : "Layar penuh"}>
              {full ? <Minimize className="h-6 w-6" strokeWidth={2.4} /> : <Maximize className="h-6 w-6" strokeWidth={2.4} />}
            </CtlButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function CtlButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-12 w-12 place-items-center rounded-2xl text-white transition hover:bg-white/15 active:scale-90"
    >
      {children}
    </button>
  );
}
