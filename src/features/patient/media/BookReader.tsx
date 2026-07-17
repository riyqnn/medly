"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { cn } from "@/src/lib/utils";

const SIZES = [20, 23, 26, 30, 34];
const DEFAULT_SIZE = 1;

/**
 * Project Gutenberg wraps its plain text at ~70 columns and fences the actual
 * book between *** START/END *** markers. Reflowing means undoing the hard
 * wrap: a single newline inside a paragraph is layout, a blank line is a real
 * break.
 */
function parseBook(raw: string): string[] {
  let text = raw.replace(/\r\n/g, "\n");

  const start = text.match(/\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG[^*]*\*\*\*/i);
  if (start?.index !== undefined) text = text.slice(start.index + start[0].length);
  const end = text.match(/\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG[^*]*\*\*\*/i);
  if (end?.index !== undefined) text = text.slice(0, end.index);

  // Plate captions for illustrations the plain-text edition doesn't carry.
  text = text.replace(/\[Illustration:?[^\]]*\]/g, "");

  return text
    .split(/\n{2,}/)
    .map((p) =>
      p
        .replace(/\n[ \t]*/g, " ")
        // Gutenberg marks italics with _underscores_; there is no italic here,
        // so the marks are just noise on the page.
        .replace(/_([^_]+)_/g, "$1")
        .trim()
    )
    .filter(Boolean);
}

/** A heading is short, has no sentence-ending punctuation, and often shouts. */
function isHeading(p: string) {
  if (p.length > 70) return false;
  if (/[.?!,;:]$/.test(p)) return false;
  return /^(chapter|bab|part|bagian|book|[IVXLC]+\.?$)/i.test(p) || p === p.toUpperCase();
}

/**
 * A real book, not a scrolling wall. Text is measured against the actual
 * column height and cut into pages, so "hal. 12 dari 340" means something and
 * a patient can put the tablet down and come back to the same page.
 */
export function BookReader({ src, title }: { src: string; title: string }) {
  const [paras, setParas] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [sizeIdx, setSizeIdx] = useState(DEFAULT_SIZE);
  const [pages, setPages] = useState<number[][]>([]);
  const [page, setPage] = useState(0);

  const columnRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error();
        const raw = await res.text();
        if (alive) setParas(parseBook(raw));
      } catch {
        if (alive) setError("Buku ini tidak dapat dimuat sekarang.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [src]);

  /**
   * Paginate by measuring: render every paragraph off-screen at the current
   * type size, then fill pages up to the column height. Cheaper and far more
   * accurate than guessing characters-per-page, and it re-runs whenever the
   * patient changes the type size or rotates the tablet.
   */
  const paginate = useCallback(() => {
    const column = columnRef.current;
    const measure = measureRef.current;
    if (!column || !measure || !paras) return;

    const limit = column.clientHeight;
    if (limit <= 0) return;

    // The twin must be exactly as wide as the real column or every height is
    // wrong. Setting it here (rather than in CSS) forces a synchronous layout,
    // so the heights read on the next line are already correct.
    measure.style.width = `${column.clientWidth}px`;
    const heights = Array.from(measure.children).map((el) => (el as HTMLElement).offsetHeight);
    const out: number[][] = [];
    let current: number[] = [];
    let used = 0;

    heights.forEach((h, i) => {
      // A paragraph taller than the page can't be split, so it gets its own.
      if (current.length && used + h > limit) {
        out.push(current);
        current = [];
        used = 0;
      }
      current.push(i);
      used += h;
    });
    if (current.length) out.push(current);

    setPages(out);
    setPage((p) => Math.min(p, Math.max(0, out.length - 1)));
  }, [paras]);

  useLayoutEffect(() => {
    paginate();
  }, [paginate, sizeIdx]);

  useEffect(() => {
    const onResize = () => paginate();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [paginate]);

  const total = pages.length;
  const turn = useCallback(
    (by: number) => setPage((p) => Math.min(Math.max(0, p + by), Math.max(0, total - 1))),
    [total]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") turn(1);
      if (e.key === "ArrowLeft") turn(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [turn]);

  const size = SIZES[sizeIdx];

  if (error) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <p className="text-xl font-bold text-ink-mute">{error}</p>
      </div>
    );
  }

  if (!paras) {
    return (
      <div className="grid h-full place-items-center">
        <p className="text-xl font-bold text-ink-mute">Membuka buku…</p>
      </div>
    );
  }

  const body = (i: number) => {
    const p = paras[i];
    return isHeading(p) ? (
      <h3
        key={i}
        className="mb-5 mt-1 text-center font-extrabold tracking-tight text-ink"
        style={{ fontSize: size * 1.15 }}
      >
        {p}
      </h3>
    ) : (
      <p
        key={i}
        className="mb-5 text-ink"
        style={{ fontSize: size, lineHeight: 1.75, textIndent: "1.5em" }}
      >
        {p}
      </p>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Off-screen twin at the real column width — the measuring stick. */}
      <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden="true">
        <div ref={measureRef} className="font-serif">
          {paras.map((_, i) => body(i))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-stretch gap-3">
        <TurnButton dir="prev" disabled={page === 0} onClick={() => turn(-1)} />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-line bg-[#FDFCF9] px-6 py-6 shadow-card sm:px-10 sm:py-8">
          <div ref={columnRef} className="mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-hidden font-serif">
            {pages[page]?.map((i) => body(i))}
          </div>
        </div>

        <TurnButton dir="next" disabled={page >= total - 1} onClick={() => turn(1)} />
      </div>

      <div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <SizeButton
            label="Perkecil huruf"
            disabled={sizeIdx === 0}
            onClick={() => setSizeIdx((i) => Math.max(0, i - 1))}
          >
            <Minus className="h-5 w-5" strokeWidth={3} />
          </SizeButton>
          <span className="w-10 text-center text-sm font-extrabold text-ink-mute">Aa</span>
          <SizeButton
            label="Perbesar huruf"
            disabled={sizeIdx === SIZES.length - 1}
            onClick={() => setSizeIdx((i) => Math.min(SIZES.length - 1, i + 1))}
          >
            <Plus className="h-5 w-5" strokeWidth={3} />
          </SizeButton>
        </div>

        <div className="min-w-0 flex-1 px-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-300"
              style={{ width: `${total ? ((page + 1) / total) * 100 : 0}%` }}
            />
          </div>
        </div>

        <p className="tabular shrink-0 text-base font-extrabold text-ink-soft">
          {total ? `Hal. ${page + 1} dari ${total}` : "Menyiapkan halaman…"}
        </p>
      </div>

      <span className="sr-only">{title}</span>
    </div>
  );
}

function TurnButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Halaman sebelumnya" : "Halaman berikutnya"}
      className={cn(
        "grid w-16 shrink-0 place-items-center rounded-3xl border border-line bg-white text-brand-600 shadow-card transition active:scale-[0.97] hover:border-brand-300 hover:bg-brand-50 sm:w-20",
        disabled && "pointer-events-none opacity-30"
      )}
    >
      <Icon className="h-9 w-9" strokeWidth={2.6} />
    </button>
  );
}

function SizeButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-white text-ink-soft shadow-card transition active:scale-90 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}
