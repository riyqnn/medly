"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, Check } from "lucide-react";
import { PageShell, PageHeader, EmptyState, Loading } from "@/src/features/shell/components/Page";
import {
  NURSE_REQUEST_CATEGORIES,
  NURSE_REQUEST_STATUS,
  PRIORITY,
  formatTime,
} from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface NurseRequest {
  id: string;
  request_category: string;
  priority: string;
  status: string;
  created_at: string;
  patient_admissions?: {
    patients?: { full_name: string; mrn: string };
    rooms?: { room_number: string; ward_name: string };
  };
}

/** How long a request has been waiting, in plain words. */
function waitedFor(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit`;
  const h = Math.floor(mins / 60);
  return `${h} jam ${mins % 60} menit`;
}

export default function NurseRequestsPage() {
  const [requests, setRequests] = useState<NurseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    const res = await fetch("/api/nurse-requests");
    if (res.ok) setRequests(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
    const t = setInterval(fetchRequests, 15_000);
    return () => clearInterval(t);
  }, [fetchRequests]);

  async function handleStatusChange(id: string, status: string) {
    setBusy(id);
    const res = await fetch("/api/nurse-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setBusy(null);
    if (res.ok) fetchRequests();
  }

  // Highest priority first, then longest waiting — the order a ward works in.
  const ordered = [...requests].sort((a, b) => {
    const rank: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    const p = (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3);
    return p !== 0 ? p : +new Date(a.created_at) - +new Date(b.created_at);
  });

  return (
    <PageShell>
      <PageHeader
        eyebrow="Perawatan"
        title="Permintaan Perawat"
        description="Permintaan yang dikirim pasien dari tablet di sisi tempat tidur."
        action={
          requests.length > 0 && (
            <span className="chip bg-brand-50 text-brand-700">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-halo rounded-full bg-brand-500" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
              </span>
              {requests.length} terbuka · diperbarui otomatis
            </span>
          )
        }
      />

      {loading ? (
        <div className="card">
          <Loading label="Memuat permintaan…" />
        </div>
      ) : ordered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Check}
            title="Semua permintaan tertangani"
            hint="Permintaan baru dari pasien akan muncul di sini secara otomatis."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ordered.map((r, i) => {
            const pr = PRIORITY[r.priority] ?? PRIORITY.LOW;
            const st = NURSE_REQUEST_STATUS[r.status];
            return (
              <article
                key={r.id}
                style={{ animationDelay: `${i * 40}ms` }}
                className={cn(
                  "card animate-fade-up flex flex-col p-5 transition duration-200 hover:shadow-lift",
                  r.priority === "HIGH" && "border-red-200"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={cn("chip", pr.chip)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", pr.dot)} />
                    {pr.label}
                  </span>
                  <span className={cn("chip", st?.chip)}>{st?.label ?? r.status}</span>
                </div>

                <h2 className="mt-4 text-lg font-extrabold tracking-tight text-ink">
                  {NURSE_REQUEST_CATEGORIES[r.request_category]?.label ?? r.request_category}
                </h2>

                <div className="mt-2 space-y-0.5 text-sm">
                  <p className="font-bold text-ink">
                    Kamar {r.patient_admissions?.rooms?.room_number ?? "—"}
                  </p>
                  <p className="text-ink-soft">{r.patient_admissions?.patients?.full_name ?? "—"}</p>
                  <p className="tabular text-xs text-ink-mute">
                    {formatTime(r.created_at)} · menunggu {waitedFor(r.created_at)}
                  </p>
                </div>

                <div className="mt-5 flex gap-2 border-t border-line pt-4">
                  {r.status === "PENDING" ? (
                    <button
                      onClick={() => handleStatusChange(r.id, "IN_PROGRESS")}
                      disabled={busy === r.id}
                      className="btn-primary w-full"
                    >
                      Tangani permintaan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(r.id, "RESOLVED")}
                      disabled={busy === r.id}
                      className="btn-primary w-full"
                    >
                      <Check className="h-4 w-4" /> Tandai selesai
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
