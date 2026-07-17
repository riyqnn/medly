"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Video, File, Image as ImageIcon, ExternalLink, type LucideIcon } from "lucide-react";
import { BedsideTitle, Pager, BedsideReader } from "../PatientShell";
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
  const [open, setOpen] = useState<Content | null>(null);

  useEffect(() => {
    fetch(`/api/patient/education?admission_id=${admissionId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setContents)
      .finally(() => setLoading(false));
  }, [admissionId]);

  if (loading) return <div className="grid flex-1 place-items-center text-xl font-bold text-ink-mute">Memuat…</div>;

  return (
    <>
      <BedsideTitle>Edukasi Kesehatan</BedsideTitle>

      <Pager
        items={contents}
        perPage={6}
        className="grid-cols-2 grid-rows-3 sm:grid-cols-3 sm:grid-rows-2"
        empty="Belum ada materi edukasi"
        render={(c) => {
          const Icon = ICONS[c.content_type] ?? FileText;
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
                  {EDUCATION_TYPES[c.content_type]?.label ?? c.content_type}
                  {c.education_categories?.name ? ` · ${c.education_categories.name}` : ""}
                </span>
              </span>
            </button>
          );
        }}
      />

      {open && (
        <BedsideReader title={open.title} onClose={() => setOpen(null)}>
          {open.content_type === "VIDEO" && open.media_url && (
            <video controls autoPlay className="w-full rounded-3xl bg-ink" src={open.media_url} />
          )}
          {open.content_type === "INFOGRAPHIC" && open.media_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={open.media_url} alt="" className="w-full rounded-3xl" />
          )}
          {open.content_type === "PDF" && open.media_url && (
            <a
              href={open.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-white px-6 py-4 text-lg font-extrabold text-ink shadow-card"
            >
              Buka dokumen <ExternalLink className="h-5 w-5" />
            </a>
          )}
          {open.body_text && (
            <p className="whitespace-pre-wrap text-xl leading-relaxed text-ink-soft">{open.body_text}</p>
          )}
        </BedsideReader>
      )}
    </>
  );
}
