"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Film, Tv, Music, Mic, BookOpen, Newspaper, Gamepad2, Wind } from "lucide-react";

interface Content {
  id: string;
  category: string;
  title: string;
  thumbnail_url: string | null;
  media_url: string | null;
}

const CATEGORY_META: Record<string, { label: string; icon: any }> = {
  MOVIE: { label: "Film", icon: Film },
  TV: { label: "TV Streaming", icon: Tv },
  MUSIC: { label: "Musik", icon: Music },
  PODCAST: { label: "Podcast", icon: Mic },
  EBOOK: { label: "Buku Digital", icon: BookOpen },
  MAGAZINE: { label: "Majalah Digital", icon: Newspaper },
  GAME_LINK: { label: "Game", icon: Gamepad2 },
  RELAXATION_VIDEO: { label: "Video Relaksasi", icon: Wind },
};

export default function EntertainmentPage() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("ALL");

  useEffect(() => {
    fetch(`/api/patient/entertainment?admission_id=${admissionId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setContents)
      .finally(() => setLoading(false));
  }, [admissionId]);

  const availableTabs = ["ALL", ...Object.keys(CATEGORY_META).filter((cat) => contents.some((c) => c.category === cat))];
  const filtered = tab === "ALL" ? contents : contents.filter((c) => c.category === tab);

  if (loading) return <div className="text-gray-500">Memuat...</div>;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Hiburan</h2>

      <div className="flex gap-2 mb-5 flex-wrap">
        {availableTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              tab === t ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {t === "ALL" ? "Semua" : CATEGORY_META[t]?.label || t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400">Belum ada konten hiburan.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((c) => {
            const meta = CATEGORY_META[c.category];
            const Icon = meta?.icon || Film;
            return (
              <a
                key={c.id}
                href={c.media_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-blue-400 transition-colors"
              >
                <div className="h-24 bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  {c.thumbnail_url ? (
                    <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-8 h-8 text-indigo-500" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-500">{meta?.label || c.category}</p>
                  <p className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">{c.title}</p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
