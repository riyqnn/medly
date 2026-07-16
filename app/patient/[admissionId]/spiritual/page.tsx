"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Clock, Music2, BookOpenText, Sparkles, HelpCircle, ExternalLink, type LucideIcon } from "lucide-react";
import { BedsideHeader, BedsideCard, BedsideEmpty, BedsideLoading } from "../PatientPage";
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

  useEffect(() => {
    fetch(`/api/patient/spiritual?admission_id=${admissionId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setContents)
      .finally(() => setLoading(false));
  }, [admissionId]);

  if (loading) return <BedsideLoading />;

  const grouped = contents.reduce<Record<string, Content[]>>((acc, c) => {
    (acc[c.category] ||= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <BedsideHeader title="Kerohanian" description="Pendampingan spiritual selama masa perawatan." />

      {contents.length === 0 ? (
        <BedsideCard>
          <BedsideEmpty>Belum ada konten kerohanian.</BedsideEmpty>
        </BedsideCard>
      ) : (
        Object.entries(grouped).map(([category, items]) => {
          const Icon = ICONS[category] ?? HelpCircle;
          return (
            <BedsideCard key={category}>
              <div className="mb-4 flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <h2 className="text-sm font-extrabold text-ink">
                  {SPIRITUAL_CATEGORIES[category]?.label ?? category}
                </h2>
              </div>
              <div className="space-y-3">
                {items.map((c) => (
                  <article key={c.id} className="rounded-2xl border border-line p-4">
                    <h3 className="text-sm font-extrabold text-ink">{c.title}</h3>
                    {c.body_text && (
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                        {c.body_text}
                      </p>
                    )}
                    {c.media_url && (
                      <a
                        href={c.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="row-link mt-2 inline-flex items-center gap-1.5 text-xs"
                      >
                        Buka <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </BedsideCard>
          );
        })
      )}
    </div>
  );
}
