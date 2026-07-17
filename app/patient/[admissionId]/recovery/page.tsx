"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";
import { BedsideTitle, Pager } from "../PatientShell";
import { cn } from "@/src/lib/utils";

interface ChecklistItem {
  id: string;
  title: string;
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

  const load = useCallback(async () => {
    const res = await fetch(`/api/patient/recovery-progress?admission_id=${admissionId}`);
    if (res.ok) setProgress(await res.json());
    setLoading(false);
  }, [admissionId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(item: ChecklistItem) {
    // Optimistic: a tick at the bedside must feel instant.
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
    load();
  }

  if (loading) return <div className="grid flex-1 place-items-center text-xl font-bold text-ink-mute">Loading…</div>;

  if (!progress)
    return (
      <>
        <BedsideTitle>Recovery Progress</BedsideTitle>
        <div className="grid min-h-0 flex-1 place-items-center rounded-3xl border-2 border-dashed border-line">
          <p className="px-6 text-center text-xl font-bold text-ink-mute">
            Your care team hasn’t set recovery goals yet
          </p>
        </div>
      </>
    );

  const items = progress.recovery_checklist_items ?? [];
  const done = items.filter((i) => i.is_done).length;
  const dayPct = progress.estimated_total_days
    ? Math.min(100, Math.round((progress.current_day / progress.estimated_total_days) * 100))
    : 0;

  return (
    <>
      <BedsideTitle>Recovery Progress</BedsideTitle>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="flex min-h-0 flex-col items-center justify-center gap-5 rounded-3xl border border-line bg-white p-6 shadow-card">
          <div className="relative grid aspect-square w-full max-w-[15rem] flex-1 place-items-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
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
                strokeDashoffset={2 * Math.PI * 43 * (1 - dayPct / 100)}
                className="transition-[stroke-dashoffset] duration-1000 ease-out"
              />
            </svg>
            <div className="text-center">
              <p className="tabular text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                Day {progress.current_day}
              </p>
              <p className="mt-1 text-sm font-bold text-ink-mute">
                {progress.estimated_total_days ? `of ${progress.estimated_total_days} days` : "of stay"}
              </p>
            </div>
          </div>
          {progress.notes && (
            <p className="shrink-0 text-center text-lg font-semibold leading-snug text-ink-soft">
              “{progress.notes}”
            </p>
          )}
        </div>

        <div className="flex min-h-0 flex-col rounded-3xl border border-line bg-white p-5 shadow-card">
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-mute">Today’s goals</p>
            <p className="tabular text-base font-extrabold text-brand-600">
              {done}/{items.length} done
            </p>
          </div>
          <Pager
            items={items}
            perPage={5}
            className="grid-cols-1 grid-rows-5"
            empty="No activity goals yet"
            render={(item) => (
              <button
                key={item.id}
                onClick={() => toggle(item)}
                className={cn(
                  "group flex min-h-0 items-center gap-4 rounded-2xl border px-5 text-left transition duration-200 active:scale-[0.99]",
                  item.is_done ? "border-brand-200 bg-brand-50" : "border-line hover:border-brand-300 hover:bg-brand-50/40"
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 transition-all duration-200",
                    item.is_done
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-line bg-white group-hover:border-brand-300"
                  )}
                >
                  <Check
                    className={cn("h-5 w-5 transition-transform duration-200", item.is_done ? "scale-100" : "scale-0")}
                    strokeWidth={3.5}
                  />
                </span>
                <span
                  className={cn(
                    "flex-1 truncate text-lg font-extrabold",
                    item.is_done ? "text-ink-mute line-through" : "text-ink"
                  )}
                >
                  {item.title}
                </span>
              </button>
            )}
          />
        </div>
      </div>
    </>
  );
}
