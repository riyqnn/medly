"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * The bedside frame. It never scrolls: the viewport is the screen, and every
 * screen sizes itself to what's left after this bar. The back button lives in
 * exactly one place at all times so it can be hit without looking for it.
 */
export function BedsideTopBar({
  admissionId,
  room,
  ward,
  hospital,
  hospitalLogo,
  careTeam,
}: {
  admissionId: string;
  room: string | null;
  ward: string | null;
  hospital: string | null;
  /** The hospital's own logo; falls back to the Medly mark when unset. */
  hospitalLogo: string | null;
  careTeam: { id: string; full_name: string; specialization: string | null }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const home = `/patient/${admissionId}`;
  const isHome = pathname === home;

  const [clock, setClock] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 px-5 py-3 sm:px-7 sm:py-4">
      {isHome ? (
        /* The patient is in a hospital bed, not in a software product — the
           bed's own hospital is what belongs at the top of the screen. */
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src={hospitalLogo || "/logo.png"}
            alt=""
            width={96}
            height={96}
            priority
            unoptimized={!!hospitalLogo}
            className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
          />
          <span className="truncate text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            {hospital ?? "MEDLY"}
          </span>
        </div>
      ) : (
        <button
          onClick={() => router.push(home)}
          className="flex h-14 items-center gap-3 rounded-2xl border border-line bg-white pl-4 pr-6 text-lg font-extrabold text-ink shadow-card transition active:scale-[0.97] hover:border-brand-300 hover:bg-brand-50"
        >
          <ArrowLeft className="h-6 w-6 text-brand-600" strokeWidth={2.6} />
          Kembali
        </button>
      )}

      <div className="flex items-center gap-4 sm:gap-5">
        <div className="text-right leading-tight">
          <p className="text-base font-extrabold text-ink sm:text-lg">
            Kamar {room ?? "—"}
            {clock && <span className="tabular ml-2 font-bold text-brand-600">{clock}</span>}
          </p>
          <p className="text-xs font-medium text-ink-mute sm:text-sm">
            {/* On the home screen the hospital name is already the headline. */}
            {[ward, isHome ? null : hospital].filter(Boolean).join(" · ")}
          </p>
        </div>
        {careTeam.length > 0 && (
          <div className="flex -space-x-2">
            {careTeam.slice(0, 3).map((d) => (
              <span
                key={d.id}
                title={d.full_name}
                className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-brand-100 text-xs font-extrabold text-brand-700 shadow-sm"
              >
                {d.full_name.replace(/^dr\.?\s*/i, "").slice(0, 2).toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

/**
 * Full-screen reader for an article, prayer or video. Portalled to <body> for
 * the same reason the dashboard dialogs are: a transformed ancestor would
 * otherwise anchor this to the page box instead of the screen.
 *
 * This is the one place a patient may scroll — long prose has no other shape.
 */
export function BedsideReader({
  title,
  onClose,
  variant = "prose",
  children,
}: {
  title: string;
  onClose: () => void;
  /**
   * "prose" is a centred, scrollable text column. "stage" hands the whole area
   * to the child and never scrolls — what a video player or a paged book
   * needs, since both size themselves to the screen.
   */
  variant?: "prose" | "stage";
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <div className="flex shrink-0 items-center justify-between gap-4 px-5 py-4 sm:px-7">
        <h2 className="min-w-0 flex-1 truncate text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {title}
        </h2>
        <button
          onClick={onClose}
          className="flex h-14 shrink-0 items-center gap-2 rounded-2xl border border-line bg-white pl-4 pr-5 text-lg font-extrabold text-ink shadow-card transition hover:border-brand-300 hover:bg-brand-50 active:scale-[0.97]"
        >
          <X className="h-6 w-6 text-brand-600" strokeWidth={2.6} /> Tutup
        </button>
      </div>
      {variant === "stage" ? (
        <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 sm:px-7 sm:pb-7">{children}</div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-7 sm:px-7">
          <div className="mx-auto max-w-3xl space-y-4">{children}</div>
        </div>
      )}
    </div>,
    document.body
  );
}

/** Page title row for sub-screens. Big, short, no explanation paragraph. */
export function BedsideTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{children}</h1>
      {aside}
    </div>
  );
}

/**
 * Pages the grid instead of scrolling it. Arrows are full-height targets so
 * they can be hit with a thumb without aiming.
 */
export function Pager<T>({
  items,
  perPage,
  className,
  render,
  empty,
}: {
  items: T[];
  perPage: number;
  className?: string;
  render: (item: T, i: number) => React.ReactNode;
  empty: React.ReactNode;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, pages - 1);
  const slice = items.slice(safePage * perPage, safePage * perPage + perPage);

  useEffect(() => {
    setPage(0);
  }, [items.length]);

  if (items.length === 0)
    return (
      <div className="grid min-h-0 flex-1 place-items-center rounded-3xl border-2 border-dashed border-line">
        <p className="px-6 text-center text-xl font-bold text-ink-mute">{empty}</p>
      </div>
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex min-h-0 flex-1 items-stretch gap-3">
        {pages > 1 && (
          <PagerArrow dir="prev" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} />
        )}
        <div className={cn("grid min-h-0 flex-1 gap-3 sm:gap-4", className)}>
          {slice.map((item, i) => render(item, i))}
        </div>
        {pages > 1 && (
          <PagerArrow dir="next" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)} />
        )}
      </div>

      {pages > 1 && (
        <div className="flex shrink-0 items-center justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              aria-label={`Halaman ${i + 1}`}
              className={cn(
                "h-2.5 rounded-full transition-all",
                i === safePage ? "w-8 bg-brand-500" : "w-2.5 bg-brand-200 hover:bg-brand-300"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PagerArrow({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Sebelumnya" : "Berikutnya"}
      className={cn(
        "grid w-14 shrink-0 place-items-center rounded-2xl border border-line bg-white shadow-card transition active:scale-95 sm:w-16",
        disabled ? "opacity-30" : "hover:border-brand-300 hover:bg-brand-50"
      )}
    >
      <ArrowLeft
        className={cn("h-7 w-7 text-brand-600", dir === "next" && "rotate-180")}
        strokeWidth={2.6}
      />
    </button>
  );
}
