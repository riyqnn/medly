"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Video, File, Image as ImageIcon, X } from "lucide-react";

interface Content {
  id: string;
  title: string;
  content_type: string;
  media_url: string | null;
  body_text: string | null;
  education_categories?: { name: string } | null;
}

const TYPE_ICONS: Record<string, any> = {
  ARTICLE: FileText,
  VIDEO: Video,
  PDF: File,
  INFOGRAPHIC: ImageIcon,
};

export default function EducationPage() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Content | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  useEffect(() => {
    fetch(`/api/patient/education?admission_id=${admissionId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setContents)
      .finally(() => setLoading(false));
  }, [admissionId]);

  const categories = ["ALL", ...Array.from(new Set(contents.map((c) => c.education_categories?.name).filter(Boolean)))] as string[];
  const filtered = categoryFilter === "ALL" ? contents : contents.filter((c) => c.education_categories?.name === categoryFilter);

  if (loading) return <div className="text-gray-500">Memuat...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Edukasi Kesehatan</h2>

        {categories.length > 1 && (
          <div className="flex gap-2 mb-5 flex-wrap">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  categoryFilter === c ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {c === "ALL" ? "Semua" : c}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada konten edukasi.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((c) => {
              const Icon = TYPE_ICONS[c.content_type] || FileText;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="flex items-start gap-3 text-left border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                >
                  <Icon className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{c.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.content_type} {c.education_categories?.name ? `— ${c.education_categories.name}` : ""}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selected.title}</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {selected.content_type === "VIDEO" && selected.media_url && (
              <video controls className="w-full rounded-lg mb-4" src={selected.media_url} />
            )}
            {selected.content_type === "INFOGRAPHIC" && selected.media_url && (
              <img src={selected.media_url} alt={selected.title} className="w-full rounded-lg mb-4" />
            )}
            {selected.content_type === "PDF" && selected.media_url && (
              <a href={selected.media_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                Buka dokumen PDF →
              </a>
            )}
            {selected.body_text && <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selected.body_text}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
