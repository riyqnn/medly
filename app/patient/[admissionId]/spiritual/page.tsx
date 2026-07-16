"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Clock, Music2, BookOpenText, Sparkles as SparklesIcon, HelpCircle } from "lucide-react";

interface Content {
  id: string;
  category: string;
  title: string;
  media_url: string | null;
  body_text: string | null;
}

const CATEGORY_META: Record<string, { label: string; icon: any }> = {
  PRAYER_TIME: { label: "Jadwal Sholat", icon: Clock },
  MUROTTAL: { label: "Murottal", icon: Music2 },
  DAILY_PRAYER: { label: "Doa Harian", icon: BookOpenText },
  REFLECTION: { label: "Renungan", icon: SparklesIcon },
  OTHER: { label: "Lainnya", icon: HelpCircle },
};

export default function SpiritualPage() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/patient/spiritual?admission_id=${admissionId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setContents)
      .finally(() => setLoading(false));
  }, [admissionId]);

  if (loading) return <div className="text-gray-500">Memuat...</div>;

  const grouped = contents.reduce<Record<string, Content[]>>((acc, c) => {
    (acc[c.category] ||= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Kerohanian</h2>
        <p className="text-sm text-gray-500 mb-4">Pendampingan spiritual selama masa perawatan.</p>

        {contents.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada konten kerohanian.</p>
        ) : (
          Object.entries(grouped).map(([cat, items]) => {
            const meta = CATEGORY_META[cat] || CATEGORY_META.OTHER;
            const Icon = meta.icon;
            return (
              <div key={cat} className="mb-5 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{meta.label}</h3>
                </div>
                <div className="space-y-2">
                  {items.map((c) => (
                    <div key={c.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{c.title}</p>
                      {c.body_text && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">{c.body_text}</p>}
                      {c.media_url && (
                        <a href={c.media_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                          Buka →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
