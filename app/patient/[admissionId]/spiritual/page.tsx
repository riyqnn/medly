"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Clock, Music2, BookOpenText, Sparkles, HelpCircle, ExternalLink, type LucideIcon } from "lucide-react";
import { BedsideTitle, Pager, BedsideReader } from "../PatientShell";
import { SPIRITUAL_CATEGORIES } from "@/src/features/shell/constants";

interface Content {
  id: string;
  category: string;
  title: string;
  media_url: string | null;
  body_text: string | null;
}

const ICONS: Record<string, LucideIcon> = {
  PRAYER_TIME: Clock,
  MUROTTAL: Music2,
  DAILY_PRAYER: BookOpenText,
  REFLECTION: Sparkles,
  OTHER: HelpCircle,
};

export default function SpiritualPage() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Content | null>(null);

  useEffect(() => {
    fetch(`/api/patient/spiritual?admission_id=${admissionId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setContents)
      .finally(() => setLoading(false));
  }, [admissionId]);

  if (loading) return <div className="grid flex-1 place-items-center text-xl font-bold text-ink-mute">Memuat…</div>;

  return (
    <>
      <BedsideTitle>Kerohanian</BedsideTitle>

      <Pager
        items={contents}
        perPage={6}
        className="grid-cols-2 grid-rows-3 sm:grid-cols-3 sm:grid-rows-2"
        empty="Belum ada konten kerohanian"
        render={(c) => {
          const Icon = ICONS[c.category] ?? HelpCircle;
          return (
            <button
              key={c.id}
              onClick={() => setOpen(c)}
              className="group flex min-h-0 flex-col justify-center gap-3 rounded-3xl border border-line bg-white p-5 text-left shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift active:scale-[0.98]"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition-transform group-hover:scale-105">
                <Icon className="h-7 w-7" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="line-clamp-2 text-lg font-extrabold leading-tight text-ink">{c.title}</span>
                <span className="mt-1 block truncate text-sm font-bold text-ink-mute">
                  {SPIRITUAL_CATEGORIES[c.category]?.label ?? c.category}
                </span>
              </span>
            </button>
          );
        }}
      />

      {open && (
        <BedsideReader title={open.title} onClose={() => setOpen(null)}>
          {open.body_text && (
            <p className="whitespace-pre-wrap text-xl leading-relaxed text-ink-soft">{open.body_text}</p>
          )}
          {open.media_url && (
            <a
              href={open.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-white px-6 py-4 text-lg font-extrabold text-ink shadow-card"
            >
              Buka <ExternalLink className="h-5 w-5" />
            </a>
          )}
        </BedsideReader>
      )}
    </>
  );
}
