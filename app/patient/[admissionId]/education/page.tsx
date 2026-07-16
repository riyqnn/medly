"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Video, File, Image as ImageIcon, ExternalLink, type LucideIcon } from "lucide-react";
import { BedsideHeader, BedsideCard, BedsideEmpty, BedsideLoading } from "../PatientPage";
import { Modal } from "@/src/features/shell/components/Modal";
import { EDUCATION_TYPES } from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface Content {
  id: string;
  title: string;
  content_type: string;
  media_url: string | null;
  body_text: string | null;
  education_categories?: { name: string } | null;
}

const ICONS: Record<string, LucideIcon> = {
  ARTICLE: FileText,
  VIDEO: Video,
  PDF: File,
  INFOGRAPHIC: ImageIcon,
};

export default function EducationPage() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [open, setOpen] = useState<Content | null>(null);

  useEffect(() => {
    fetch(`/api/patient/education?admission_id=${admissionId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setContents)
      .finally(() => setLoading(false));
  }, [admissionId]);

  if (loading) return <BedsideLoading />;

  const categories = Array.from(
    new Set(contents.map((c) => c.education_categories?.name).filter(Boolean))
  ) as string[];
  const shown = filter === "ALL" ? contents : contents.filter((c) => c.education_categories?.name === filter);

  return (
    <div className="space-y-4">
      <BedsideHeader
        title="Edukasi Kesehatan"
        description="Materi dari tim medis untuk membantu pemulihan Anda."
      />

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["ALL", ...categories].map((c) => (
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
              {c === "ALL" ? "Semua" : c}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <BedsideCard>
          <BedsideEmpty>Belum ada konten edukasi.</BedsideEmpty>
        </BedsideCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((c, i) => {
            const Icon = ICONS[c.content_type] ?? FileText;
            return (
              <button
                key={c.id}
                onClick={() => setOpen(c)}
                style={{ animationDelay: `${i * 45}ms` }}
                className="group card flex animate-fade-up items-start gap-4 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition-transform duration-200 group-hover:scale-105">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold leading-snug text-ink">{c.title}</span>
                  <span className="mt-1 block text-xs text-ink-mute">
                    {EDUCATION_TYPES[c.content_type]?.label ?? c.content_type}
                    {c.education_categories?.name ? ` · ${c.education_categories.name}` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.title ?? ""}
        description={open ? EDUCATION_TYPES[open.content_type]?.label : undefined}
        width="max-w-2xl"
      >
        {open && (
          <div className="space-y-4">
            {open.content_type === "VIDEO" && open.media_url && (
              <video controls className="w-full rounded-2xl bg-ink" src={open.media_url} />
            )}
            {open.content_type === "INFOGRAPHIC" && open.media_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={open.media_url} alt={open.title} className="w-full rounded-2xl" />
            )}
            {open.content_type === "PDF" && open.media_url && (
              <a href={open.media_url} target="_blank" rel="noopener noreferrer" className="btn-ghost w-full">
                Buka dokumen <ExternalLink className="h-4 w-4" />
              </a>
            )}
            {open.body_text && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{open.body_text}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
