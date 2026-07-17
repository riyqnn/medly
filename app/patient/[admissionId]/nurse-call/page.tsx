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
import { BedsideTitle } from "../PatientShell";
import { NURSE_REQUEST_CATEGORIES, NURSE_REQUEST_STATUS } from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface NurseRequest {
  id: string;
  request_category: string;
  status: string;
  created_at: string;
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
      setError("The request didn't go through. Press once more.");
      return;
    }
    setSent(category);
    setTimeout(() => setSent(null), 3000);
    load();
  }

  const active = requests.filter((r) => r.status !== "RESOLVED");

  return (
    <>
      <BedsideTitle
        aside={
          active.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              {active.slice(0, 3).map((r) => {
                const st = NURSE_REQUEST_STATUS[r.status];
                return (
                  <span
                    key={r.id}
                    className={cn("rounded-full px-4 py-2 text-sm font-extrabold", st?.chip)}
                  >
                    {NURSE_REQUEST_CATEGORIES[r.request_category]?.label} · {st?.label}
                  </span>
                );
              })}
            </div>
          )
        }
      >
        What do you need?
      </BedsideTitle>

      {error && (
        <p className="mb-3 shrink-0 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-lg font-bold text-red-700">
          {error}
        </p>
      )}

      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
        {Object.entries(NURSE_REQUEST_CATEGORIES).map(([key, cat]) => {
          const isSent = sent === key;
          const isPending = pending === key;
          const Icon = isSent ? Check : ICONS[key];
          const urgent = key === "PAIN";
          return (
            <button
              key={key}
              onClick={() => send(key)}
              disabled={isPending || isSent}
              className={cn(
                "group flex min-h-0 flex-col items-center justify-center gap-3 rounded-3xl border p-3 text-center transition duration-200 active:scale-[0.98]",
                isSent
                  ? "border-brand-500 bg-brand-500 text-white shadow-lift"
                  : "border-line bg-white text-ink shadow-card hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
              )}
            >
              <span
                className={cn(
                  "grid h-16 w-16 shrink-0 place-items-center rounded-2xl transition-transform duration-200 group-hover:scale-105 sm:h-20 sm:w-20",
                  isSent
                    ? "bg-white/20 text-white"
                    : urgent
                      ? "bg-red-50 text-red-500"
                      : "bg-brand-50 text-brand-600"
                )}
              >
                <Icon
                  className={cn("h-8 w-8 sm:h-10 sm:w-10", isPending && "animate-pulse")}
                  strokeWidth={2}
                />
              </span>
              <span className="text-base font-extrabold leading-tight sm:text-lg">
                {isSent ? "The nurses have been notified" : cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
