"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Eye } from "lucide-react";
import { PageShell, PageHeader, EmptyState, Loading } from "@/src/features/shell/components/Page";
import { Pagination } from "@/src/features/shell/components/Pagination";
import type { Paged } from "@/src/features/shell/pagination";
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
  nurses?: { full_name: string } | null;
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

/**
 * The hospital's view of the ward queue is for supervision only — response
 * times, who is waiting, what is still open. Handling belongs to the nurses,
 * and the API enforces that: a PATCH from this role comes back 403.
 */
export default function NurseRequestsMonitorPage() {
  const [list, setList] = useState<Paged<NurseRequest> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    const res = await fetch(`/api/nurse-requests?page=${page}`);
    if (res.ok) setList(await res.json());
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchRequests();
    const t = setInterval(fetchRequests, 15_000);
    return () => clearInterval(t);
  }, [fetchRequests]);

  const requests = list?.data ?? [];
  const waiting = requests.filter((r) => r.status === "PENDING").length;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Perawatan"
        title="Permintaan Perawat"
        description="Pantau antrean dan waktu tunggu. Penanganan dilakukan perawat dari portalnya."
        action={
          list && list.total > 0 ? (
            <span className="chip bg-brand-50 text-brand-700">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-halo rounded-full bg-brand-500" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
              </span>
              {list.total} terbuka · {waiting} belum diambil
            </span>
          ) : null
        }
      />

      {/* Says plainly why there are no buttons, rather than leaving the reader
          to wonder whether something is broken. */}
      <div className="card mb-5 flex items-start gap-3 p-4">
        <Eye className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" />
        <p className="text-sm leading-relaxed text-ink-soft">
          Tampilan ini hanya untuk memantau. Yang menerima dan menyelesaikan permintaan adalah
          perawat yang bertugas — status di bawah ikut berubah begitu mereka menanganinya.
        </p>
      </div>

      {loading && !list ? (
        <div className="card">
          <Loading label="Memuat permintaan…" />
        </div>
      ) : requests.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Check}
            title="Semua permintaan tertangani"
            hint="Permintaan baru dari pasien akan muncul di sini secara otomatis."
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {requests.map((r, i) => {
              const pr = PRIORITY[r.priority] ?? PRIORITY.LOW;
              const st = NURSE_REQUEST_STATUS[r.status];
              return (
                <article
                  key={r.id}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={cn(
                    "card animate-fade-up flex flex-col p-5",
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

                  <p className="mt-4 border-t border-line pt-3 text-xs font-semibold text-ink-mute">
                    {r.nurses?.full_name
                      ? `Ditangani ${r.nurses.full_name}`
                      : "Menunggu diambil perawat"}
                  </p>
                </article>
              );
            })}
          </div>

          {list && (
            <div className="card mt-4">
              <Pagination
                page={list.page}
                pages={list.pages}
                total={list.total}
                limit={list.limit}
                onPage={setPage}
                noun="permintaan"
                className="border-t-0"
              />
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
