"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";
import { BedsideHeader, BedsideCard, BedsideEmpty, BedsideLoading } from "../PatientPage";
import { cn } from "@/src/lib/utils";

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
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/patient/recovery-progress?admission_id=${admissionId}`);
    if (res.ok) setProgress(await res.json());
    setLoading(false);
  }, [admissionId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(item: ChecklistItem) {
    setBusy(item.id);
    // Optimistic: ticking a box should feel instant at the bedside.
    setProgress((p) =>
      p
        ? {
            ...p,
            recovery_checklist_items: p.recovery_checklist_items.map((i) =>
              i.id === item.id ? { ...i, is_done: !i.is_done } : i
            ),
          }
        : p
    );
    await fetch(`/api/patient/recovery-progress/checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admission_id: admissionId, is_done: !item.is_done }),
    });
    setBusy(null);
    load();
  }

  if (loading) return <BedsideLoading />;

  if (!progress) {
    return (
      <div className="space-y-4">
        <BedsideHeader title="Progres Pemulihan" />
        <BedsideCard>
          <BedsideEmpty>
            Tim medis belum menetapkan target pemulihan untuk Anda.
          </BedsideEmpty>
        </BedsideCard>
      </div>
    );
  }

  const items = progress.recovery_checklist_items ?? [];
  const done = items.filter((i) => i.is_done).length;
  const dayPct = progress.estimated_total_days
    ? Math.min(100, Math.round((progress.current_day / progress.estimated_total_days) * 100))
    : null;
  const taskPct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <BedsideHeader title="Progres Pemulihan" description="Setiap langkah kecil membawa Anda lebih dekat pulang." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        {/* The ring is the one flourish on this screen — it's the number the
            patient actually came here to see. */}
        <BedsideCard className="flex flex-col items-center justify-center py-8">
          <div className="relative grid h-44 w-44 place-items-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              <circle cx="50" cy="50" r="43" fill="none" stroke="var(--color-canvas)" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="43"
                fill="none"
                stroke="var(--color-brand-500)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 43}
                strokeDashoffset={2 * Math.PI * 43 * (1 - (dayPct ?? 0) / 100)}
                className="transition-[stroke-dashoffset] duration-1000 ease-out"
              />
            </svg>
            <div className="text-center">
              <p className="tabular text-4xl font-extrabold tracking-tight text-ink">
                Hari {progress.current_day}
              </p>
              <p className="mt-0.5 text-xs font-bold text-ink-mute">
                {progress.estimated_total_days ? `dari ${progress.estimated_total_days} hari` : "masa rawat"}
              </p>
            </div>
          </div>
          {progress.notes && (
            <p className="mt-6 max-w-xs text-center text-sm leading-relaxed text-ink-soft">
              “{progress.notes}”
            </p>
          )}
        </BedsideCard>

        <BedsideCard
          title="Checklist aktivitas"
          action={
            <span className="tabular text-[11px] font-bold text-brand-600">
              {done}/{items.length} selesai
            </span>
          }
        >
          {items.length === 0 ? (
            <BedsideEmpty>Belum ada target aktivitas dari tenaga kesehatan.</BedsideEmpty>
          ) : (
            <>
              <div className="mb-5 h-2 overflow-hidden rounded-full bg-canvas">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-[width] duration-700 ease-out"
                  style={{ width: `${taskPct}%` }}
                />
              </div>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => toggle(item)}
                      disabled={busy === item.id}
                      className="group flex w-full items-center gap-3.5 rounded-2xl border border-line p-3.5 text-left transition duration-200 hover:border-brand-200 hover:bg-brand-50/50 active:scale-[0.99]"
                    >
                      <span
                        className={cn(
                          "grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition-all duration-200",
                          item.is_done
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-line bg-white group-hover:border-brand-300"
                        )}
                      >
                        <Check
                          className={cn(
                            "h-3.5 w-3.5 transition-transform duration-200",
                            item.is_done ? "scale-100" : "scale-0"
                          )}
                          strokeWidth={3.5}
                        />
                      </span>
                      <span
                        className={cn(
                          "flex-1 text-sm font-bold transition",
                          item.is_done ? "text-ink-mute line-through" : "text-ink"
                        )}
                      >
                        {item.title}
                      </span>
                      {item.target_date && (
                        <span className="tabular text-[11px] font-semibold text-ink-mute">
                          {new Date(item.target_date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </BedsideCard>
      </div>
    </div>
  );
}
