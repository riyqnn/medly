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
import { BedsideHeader, BedsideCard, BedsideEmpty, BedsideLoading } from "../PatientPage";
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

  useEffect(() => {
    fetch(`/api/patient/entertainment?admission_id=${admissionId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setContents)
      .finally(() => setLoading(false));
  }, [admissionId]);

  if (loading) return <BedsideLoading />;

  const present = Object.keys(ENTERTAINMENT_CATEGORIES).filter((k) =>
    contents.some((c) => c.category === k)
  );
  const shown = filter === "ALL" ? contents : contents.filter((c) => c.category === filter);

  return (
    <div className="space-y-4">
      <BedsideHeader title="Hiburan" description="Teman mengisi waktu selama masa perawatan." />

      {present.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["ALL", ...present].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-bold transition duration-200",
                filter === c
                  ? "border-brand-500 bg-brand-500 text-white shadow-sm shadow-brand-500/25"
                  : "border-line bg-white text-ink-soft hover:border-brand-200 hover:bg-brand-50"
              )}
            >
              {c === "ALL" ? "Semua" : ENTERTAINMENT_CATEGORIES[c].label}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <BedsideCard>
          <BedsideEmpty>Belum ada konten hiburan.</BedsideEmpty>
        </BedsideCard>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {shown.map((c, i) => {
            const Icon = ICONS[c.category] ?? Film;
            return (
              <a
                key={c.id}
                href={c.media_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{ animationDelay: `${i * 40}ms` }}
                className="group card flex animate-fade-up flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
              >
                <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-brand-50">
                  {c.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.thumbnail_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <Icon className="h-9 w-9 text-brand-300" strokeWidth={1.5} />
                  )}
                  {/* Play affordance only appears on intent. */}
                  <span className="absolute inset-0 grid place-items-center bg-ink/0 opacity-0 transition-all duration-200 group-hover:bg-ink/20 group-hover:opacity-100">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-white/95 text-brand-600 shadow-lift">
                      <Play className="ml-0.5 h-4 w-4 fill-current" />
                    </span>
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-[11px] font-bold text-ink-mute">
                    {ENTERTAINMENT_CATEGORIES[c.category]?.label ?? c.category}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-extrabold leading-snug text-ink">{c.title}</p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
