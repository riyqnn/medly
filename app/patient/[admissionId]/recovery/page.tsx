"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";

interface ChecklistItem {
  id: string;
  title: string;
  target_date: string | null;
  is_done: boolean;
}

interface Progress {
  id: string;
  estimated_total_days: number | null;
  current_day: number;
  notes: string | null;
  recovery_checklist_items: ChecklistItem[];
}

export default function RecoveryPage() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => { load(); }, [admissionId]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/patient/recovery-progress?admission_id=${admissionId}`);
    if (res.ok) setProgress(await res.json());
    setLoading(false);
  }

  async function toggleItem(item: ChecklistItem) {
    setToggling(item.id);
    await fetch(`/api/patient/recovery-progress/checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admission_id: admissionId, is_done: !item.is_done }),
    });
    setToggling(null);
    load();
  }

  if (loading) return <div className="text-gray-500">Memuat...</div>;

  if (!progress) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Progres Pemulihan</h2>
        <p className="text-sm text-gray-400">Belum ada data progres pemulihan dari tim medis.</p>
      </div>
    );
  }

  const pct = progress.estimated_total_days
    ? Math.min(100, Math.round((progress.current_day / progress.estimated_total_days) * 100))
    : 0;
  const items = progress.recovery_checklist_items || [];
  const doneCount = items.filter((i) => i.is_done).length;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Progres Pemulihan</h2>
        <p className="text-sm text-gray-500 mb-4">
          Hari ke-{progress.current_day}{progress.estimated_total_days ? ` dari estimasi ${progress.estimated_total_days} hari` : ""}
        </p>
        {progress.estimated_total_days && (
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 mb-2">
            <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
        {progress.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">{progress.notes}</p>}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Checklist Aktivitas</h2>
          <span className="text-xs text-gray-500">{doneCount}/{items.length} selesai</span>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada target aktivitas dari tenaga kesehatan.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem(item)}
                disabled={toggling === item.id}
                className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                {item.is_done ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                )}
                <span className={`text-sm ${item.is_done ? "line-through text-gray-400" : "text-gray-900 dark:text-white"}`}>
                  {item.title}
                </span>
                {item.target_date && <span className="ml-auto text-xs text-gray-400">{item.target_date}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
