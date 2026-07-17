"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Film,
  Tv,
  Music,
  Mic,
  BookOpen,
  Newspaper,
  Gamepad2,
  Wind,
  Play,
  type LucideIcon,
} from "lucide-react";
import { BedsideTitle, Pager, BedsideReader } from "../PatientShell";
import { MediaViewer, needsStage } from "@/src/features/patient/media/MediaViewer";
import { ENTERTAINMENT_CATEGORIES } from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface Content {
  id: string;
  category: string;
  title: string;
  thumbnail_url: string | null;
  media_url: string | null;
}

const ICONS: Record<string, LucideIcon> = {
  MOVIE: Film,
  TV: Tv,
  MUSIC: Music,
  PODCAST: Mic,
  EBOOK: BookOpen,
  MAGAZINE: Newspaper,
  GAME_LINK: Gamepad2,
  RELAXATION_VIDEO: Wind,
};

export default function EntertainmentPage() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [open, setOpen] = useState<Content | null>(null);

  useEffect(() => {
    fetch(`/api/patient/entertainment?admission_id=${admissionId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setContents)
      .finally(() => setLoading(false));
  }, [admissionId]);

  if (loading) return <div className="grid flex-1 place-items-center text-xl font-bold text-ink-mute">Loading…</div>;

  const present = Object.keys(ENTERTAINMENT_CATEGORIES).filter((k) => contents.some((c) => c.category === k));
  const shown = filter === "ALL" ? contents : contents.filter((c) => c.category === filter);

  return (
    <>
      <BedsideTitle>Entertainment</BedsideTitle>

      {present.length > 1 && (
        <div className="mb-4 flex shrink-0 flex-wrap gap-2">
          {["ALL", ...present].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn(
                "rounded-2xl border px-5 py-2.5 text-base font-extrabold transition active:scale-[0.97]",
                filter === c
                  ? "border-brand-500 bg-brand-500 text-white shadow-lift"
                  : "border-line bg-white text-ink-soft shadow-card hover:border-brand-300 hover:bg-brand-50"
              )}
            >
              {c === "ALL" ? "All" : ENTERTAINMENT_CATEGORIES[c].label}
            </button>
          ))}
        </div>
      )}

      <Pager
        items={shown}
        perPage={8}
        className="grid-cols-2 grid-rows-4 sm:grid-cols-3 sm:grid-rows-3 xl:grid-cols-4 xl:grid-rows-2"
        empty="No entertainment content yet"
        render={(c) => {
          const Icon = ICONS[c.category] ?? Film;
          return (
            <button
              key={c.id}
              onClick={() => setOpen(c)}
              className="group flex min-h-0 flex-col overflow-hidden rounded-3xl border border-line bg-white text-left shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift active:scale-[0.98]"
            >
              <div className="relative grid min-h-0 flex-1 place-items-center overflow-hidden bg-brand-50">
                {c.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Icon className="h-10 w-10 text-brand-300" strokeWidth={1.5} />
                )}
                <span className="absolute inset-0 grid place-items-center bg-ink/0 opacity-0 transition-all duration-200 group-hover:bg-ink/25 group-hover:opacity-100">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-brand-600 shadow-float">
                    <Play className="ml-0.5 h-6 w-6 fill-current" />
                  </span>
                </span>
              </div>
              <div className="shrink-0 px-4 py-3">
                <p className="truncate text-base font-extrabold leading-tight text-ink">{c.title}</p>
                <p className="truncate text-xs font-bold text-ink-mute">
                  {ENTERTAINMENT_CATEGORIES[c.category]?.label ?? c.category}
                </p>
              </div>
            </button>
          );
        }}
      />

      {open && (
        <BedsideReader
          title={open.title}
          onClose={() => setOpen(null)}
          variant={needsStage(open.category, open.media_url) ? "stage" : "prose"}
        >
          <MediaViewer
            kind="entertainment"
            admissionId={admissionId}
            item={{
              id: open.id,
              title: open.title,
              type: open.category,
              media_url: open.media_url,
              thumbnail_url: open.thumbnail_url,
              subtitle: ENTERTAINMENT_CATEGORIES[open.category]?.label ?? open.category,
            }}
          />
        </BedsideReader>
      )}
    </>
  );
}
