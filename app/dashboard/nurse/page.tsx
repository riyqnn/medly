"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, BellRing } from "lucide-react";
import { PortalHeader } from "@/src/features/shell/components/PortalHeader";
import { useMyHospital } from "@/src/features/shell/useMyHospital";
import { EmptyState, Loading } from "@/src/features/shell/components/Page";
import { createClient } from "@/src/features/auth/utils/supabase/client";
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
  resolved_at: string | null;
  patient_admissions?: {
    patients?: { full_name: string; mrn: string };
    rooms?: { room_number: string; ward_name: string };
  };
}

function waitedFor(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit`;
  return `${Math.floor(mins / 60)} jam ${mins % 60} menit`;
}

export default function NurseDashboard() {
  const hospital = useMyHospital();
  const [requests, setRequests] = useState<NurseRequest[]>([]);
  const [history, setHistory] = useState<NurseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [nurseId, setNurseId] = useState<string | null>(null);
  const [linked, setLinked] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // The nurse record is found by the account it belongs to. This used to
      // guess by matching full_name and silently fell back to whichever nurse
      // happened to be first in the hospital.
      const { data: nurse } = await supabase
        .from("nurses")
        .select("id")
        .eq("profile_id", user.id)
        .is("deleted_at", null)
        .maybeSingle();

      setNurseId(nurse?.id ?? null);
      setLinked(!!nurse);
    })();
  }, []);

  const fetchRequests = useCallback(async () => {
    const res = await fetch("/api/nurse-requests");
    if (res.ok) setRequests((await res.json()).data);
    if (nurseId) {
      const h = await fetch(`/api/nurse-requests?nurse_id=${nurseId}&status=RESOLVED`);
      if (h.ok) setHistory((await h.json()).data);
    }
    setLoading(false);
  }, [nurseId]);

  useEffect(() => {
    fetchRequests();
    const t = setInterval(fetchRequests, 15_000);
    return () => clearInterval(t);
  }, [fetchRequests]);

  async function handleAction(id: string, status: string) {
    setBusy(id);
    const payload: Record<string, unknown> = { id, status };
    if (status === "IN_PROGRESS" && nurseId) payload.handled_by_nurse_id = nurseId;
    const res = await fetch("/api/nurse-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(null);
    if (res.ok) fetchRequests();
  }

  // Ordered by the API (priority first, then longest waiting). Re-sorting here
  // would only reorder the current page and quietly bury a HIGH call sitting on
  // the next one.
  const ordered = requests;

  return (
    <div className="min-h-screen bg-canvas">
      <PortalHeader
        role={hospital.name ? `Portal perawat · ${hospital.name}` : "Portal perawat"}
        title="Permintaan Pasien"
        subtitle="Diurutkan dari prioritas tertinggi dan yang paling lama menunggu."
        logoUrl={hospital.logo_url}
      />

      <main className="mx-auto max-w-6xl animate-fade-up px-6 py-7">
        {linked === false && (
          <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Akun Anda belum terhubung ke data perawat mana pun, jadi permintaan yang Anda tangani
            tidak tercatat atas nama Anda. Minta admin membuka menu Perawat lalu menautkan akun ini.
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section>
            <div className="mb-4 flex items-center gap-2.5">
              <h2 className="eyebrow">Permintaan aktif</h2>
              {ordered.length > 0 && (
                <span className="chip bg-brand-50 text-brand-700">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-halo rounded-full bg-brand-500" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
                  </span>
                  {ordered.length}
                </span>
              )}
            </div>

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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                      <h3 className="mt-4 text-lg font-extrabold tracking-tight text-ink">
                        {NURSE_REQUEST_CATEGORIES[r.request_category]?.label ?? r.request_category}
                      </h3>

                      <p className="mt-1.5 text-sm font-bold text-ink">
                        Kamar {r.patient_admissions?.rooms?.room_number ?? "—"}
                      </p>
                      <p className="text-sm text-ink-soft">
                        {r.patient_admissions?.patients?.full_name ?? "—"}
                      </p>
                      <p className="tabular mt-0.5 text-xs text-ink-mute">
                        {formatTime(r.created_at)} · menunggu {waitedFor(r.created_at)}
                      </p>

                      <div className="mt-5 border-t border-line pt-4">
                        {r.status === "PENDING" ? (
                          <button
                            onClick={() => handleAction(r.id, "IN_PROGRESS")}
                            disabled={busy === r.id}
                            className="btn-primary w-full"
                          >
                            Ambil permintaan
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(r.id, "RESOLVED")}
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
          </section>

          <aside>
            <h2 className="eyebrow mb-4">Riwayat shift saya</h2>
            <div className="card overflow-hidden">
              {history.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-ink-mute">
                  Belum ada permintaan yang Anda selesaikan.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {history.slice(0, 10).map((h) => (
                    <li key={h.id} className="p-4 transition-colors hover:bg-canvas/70">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-extrabold text-ink">
                          {NURSE_REQUEST_CATEGORIES[h.request_category]?.label ?? h.request_category}
                        </p>
                        <span className="tabular shrink-0 text-[11px] font-semibold text-ink-mute">
                          {h.resolved_at ? formatTime(h.resolved_at) : formatTime(h.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        Kamar {h.patient_admissions?.rooms?.room_number ?? "—"} ·{" "}
                        {h.patient_admissions?.patients?.full_name ?? "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
