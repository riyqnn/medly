"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

/** Page numbers to show, collapsing long runs with an ellipsis. */
function windowed(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "…", pages];
  if (page >= pages - 3) return [1, "…", pages - 4, pages - 3, pages - 2, pages - 1, pages];
  return [1, "…", page - 1, page, page + 1, "…", pages];
}

export function Pagination({
  page,
  pages,
  total,
  limit,
  onPage,
  noun = "data",
  className,
}: {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
  noun?: string;
  /** Tables sit inside a card and want the top rule; grids stand alone and don't. */
  className?: string;
}) {
  if (total === 0) return null;

  const first = (page - 1) * limit + 1;
  const last = Math.min(total, page * limit);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-3.5",
        className
      )}
    >
      <p className="tabular text-xs font-semibold text-ink-mute">
        {first}–{last} of {total} {noun}
      </p>

      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-soft transition hover:bg-brand-50 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {windowed(page, pages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1.5 text-xs font-bold text-ink-mute">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "tabular h-8 min-w-8 rounded-lg px-2 text-xs font-extrabold transition",
                  p === page
                    ? "bg-brand-500 text-white shadow-sm shadow-brand-500/25"
                    : "text-ink-soft hover:bg-brand-50 hover:text-brand-700"
                )}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPage(page + 1)}
            disabled={page >= pages}
            aria-label="Next page"
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-soft transition hover:bg-brand-50 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
