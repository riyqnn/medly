"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  BellRing,
  Frown,
  Droplets,
  ShowerHead,
  GlassWater,
  Blinds,
  HelpCircle,
  Check,
  type LucideIcon,
} from "lucide-react";
import { BedsideHeader, BedsideCard, BedsideEmpty } from "../PatientPage";
import { NURSE_REQUEST_CATEGORIES, NURSE_REQUEST_STATUS, formatTime } from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface NurseRequest {
  id: string;
  request_category: string;
  priority: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

const ICONS: Record<string, LucideIcon> = {
  CALL_NURSE: BellRing,
  PAIN: Frown,
  IV_DRIP: Droplets,
  BATHROOM: ShowerHead,
  DRINKING_WATER: GlassWater,
  EXTRA_BLANKET: Blinds,
  OTHER: HelpCircle,
};

export default function NurseCallPage() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const [requests, setRequests] = useState<NurseRequest[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/patient/nurse-requests?admission_id=${admissionId}`);
    if (res.ok) setRequests(await res.json());
  }, [admissionId]);

  useEffect(() => {
    load();
    // Status moves on the nurse's side, so the patient's view polls for it.
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [load]);

  async function send(category: string) {
    setPending(category);
    setError("");
    const res = await fetch("/api/patient/nurse-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admission_id: admissionId, request_category: category }),
    });
    setPending(null);
    if (!res.ok) {
      setError("Permintaan gagal terkirim. Silakan coba lagi.");
      return;
    }
    setSent(category);
    setTimeout(() => setSent(null), 2600);
    load();
  }

  const active = requests.filter((r) => r.status !== "RESOLVED");
  const history = requests.filter((r) => r.status === "RESOLVED");

  return (
    <div className="space-y-4">
      <BedsideHeader
        title="Panggil Perawat"
        description="Pilih kebutuhan Anda — perawat langsung menerima permintaannya."
      />

      {error && (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Object.entries(NURSE_REQUEST_CATEGORIES).map(([key, cat], i) => {
          const isSent = sent === key;
          const isPending = pending === key;
          const Icon = isSent ? Check : ICONS[key];
          const urgent = key === "PAIN";
          return (
            <button
              key={key}
              onClick={() => send(key)}
              disabled={isPending || isSent}
              style={{ animationDelay: `${i * 40}ms` }}
              className={cn(
                "group card flex animate-fade-up flex-col items-center justify-center gap-3 px-3 py-7 transition duration-200",
                "hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift active:scale-[0.98]",
                isSent && "border-brand-300 bg-brand-50"
              )}
            >
              <span
                className={cn(
                  "grid h-14 w-14 place-items-center rounded-2xl transition-transform duration-200 group-hover:scale-105",
                  isSent
                    ? "bg-brand-500 text-white"
                    : urgent
                      ? "bg-red-50 text-red-500"
                      : "bg-brand-50 text-brand-600"
                )}
              >
                <Icon className={cn("h-7 w-7", isPending && "animate-pulse")} strokeWidth={1.9} />
              </span>
              <span className="text-center text-sm font-extrabold leading-tight text-ink">
                {isSent ? "Terkirim" : cat.label}
              </span>
            </button>
          );
        })}
      </div>

      <BedsideCard title="Permintaan aktif">
        {active.length === 0 ? (
          <BedsideEmpty>Tidak ada permintaan yang sedang berjalan.</BedsideEmpty>
        ) : (
          <ul className="space-y-2.5">
            {active.map((r) => {
              const st = NURSE_REQUEST_STATUS[r.status];
              const Icon = ICONS[r.request_category] ?? HelpCircle;
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-ink">
                      {NURSE_REQUEST_CATEGORIES[r.request_category]?.label ?? r.request_category}
                    </p>
                    <p className="tabular text-xs text-ink-mute">dikirim {formatTime(r.created_at)}</p>
                  </div>
                  <span className={cn("chip", st?.chip)}>
                    {r.status === "PENDING" && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-halo rounded-full bg-amber-500" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                      </span>
                    )}
                    {st?.label ?? r.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </BedsideCard>

      {history.length > 0 && (
        <BedsideCard title="Riwayat">
          <ul className="divide-y divide-line">
            {history.slice(0, 6).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="font-semibold text-ink-soft">
                  {NURSE_REQUEST_CATEGORIES[r.request_category]?.label ?? r.request_category}
                </span>
                <span className="tabular text-xs text-ink-mute">
                  selesai {r.resolved_at ? formatTime(r.resolved_at) : "—"}
                </span>
              </li>
            ))}
          </ul>
        </BedsideCard>
      )}
    </div>
  );
}
