"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ClipboardList, X } from "lucide-react";
import { PageShell, PageHeader, EmptyState, Loading } from "@/src/features/shell/components/Page";
import { Pagination } from "@/src/features/shell/components/Pagination";
import type { Paged } from "@/src/features/shell/pagination";
import {
  MEAL_SCHEDULES,
  MEAL_ORDER_STATUS,
  formatRupiah,
  formatTime,
} from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface MealOrder {
  id: string;
  meal_schedule: string;
  order_date: string;
  status: string;
  patient_notes: string | null;
  created_at: string;
  meal_menus?: { name: string; price: number };
  patient_admissions?: {
    patients?: { full_name: string; mrn: string };
    rooms?: { room_number: string; ward_name: string };
  };
}

/** Kitchen flow: a pending order gets prepared, a prepared order gets delivered. */
const NEXT: Record<string, { status: string; label: string }> = {
  PENDING: { status: "PREPARING", label: "Mulai siapkan" },
  PREPARING: { status: "DELIVERED", label: "Mark delivered" },
};

export default function MealOrdersPage() {
  const [orders, setOrders] = useState<MealOrder[]>([]);
  const [meta, setMeta] = useState<Paged<MealOrder> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const res = await fetch(`/api/meal-orders?page=${page}`);
    if (res.ok) {
      const j: Paged<MealOrder> = await res.json();
      setOrders(j.data);
      setMeta(j);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchOrders();
    const t = setInterval(fetchOrders, 20_000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  async function updateStatus(id: string, status: string) {
    setBusy(id);
    await fetch("/api/meal-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setBusy(null);
    fetchOrders();
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Patient services"
        title="Meal Orders"
        description="Orders coming in from patient tablets, longest waiting first."
        action={
          orders.length > 0 && (
            <span className="chip bg-brand-50 text-brand-700">{orders.length} pesanan aktif</span>
          )
        }
      />

      {loading ? (
        <div className="card">
          <Loading label="Loading orders…" />
        </div>
      ) : orders.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="No active orders"
            hint="New patient orders appear here automatically."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...orders]
            .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
            .map((o, i) => {
              const st = MEAL_ORDER_STATUS[o.status];
              const next = NEXT[o.status];
              return (
                <article
                  key={o.id}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="card animate-fade-up flex flex-col p-5 transition duration-200 hover:shadow-lift"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={cn("chip", st?.chip)}>{st?.label ?? o.status}</span>
                    <span className="tabular text-xs font-semibold text-ink-mute">
                      {formatTime(o.created_at)}
                    </span>
                  </div>

                  <h2 className="mt-4 text-lg font-extrabold tracking-tight text-ink">
                    {o.meal_menus?.name ?? "—"}
                  </h2>
                  <p className="tabular text-sm font-bold text-brand-600">
                    {formatRupiah(o.meal_menus?.price)}
                  </p>

                  <div className="mt-3 space-y-0.5 text-sm">
                    <p className="font-bold text-ink">
                      Room {o.patient_admissions?.rooms?.room_number ?? "—"}
                    </p>
                    <p className="text-ink-soft">{o.patient_admissions?.patients?.full_name ?? "—"}</p>
                    <p className="tabular text-xs text-ink-mute">
                      {new Date(o.order_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })} ·{" "}
                      {MEAL_SCHEDULES.find((s) => s.value === o.meal_schedule)?.label ?? o.meal_schedule}
                    </p>
                  </div>

                  {o.patient_notes && (
                    <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-xs italic text-ink-soft">
                      “{o.patient_notes}”
                    </p>
                  )}

                  <div className="mt-5 flex gap-2 border-t border-line pt-4">
                    {next && (
                      <button
                        onClick={() => updateStatus(o.id, next.status)}
                        disabled={busy === o.id}
                        className="btn-primary flex-1"
                      >
                        <Check className="h-4 w-4" /> {next.label}
                      </button>
                    )}
                    {o.status === "PENDING" && (
                      <button
                        onClick={() => confirm("Reject this order?") && updateStatus(o.id, "REJECTED")}
                        disabled={busy === o.id}
                        className="btn-danger shrink-0 px-3"
                        title="Reject order"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
        </div>
      )}

      {meta && !loading && orders.length > 0 && (
        <div className="card mt-4">
          <Pagination
            page={meta.page}
            pages={meta.pages}
            total={meta.total}
            limit={meta.limit}
            onPage={setPage}
            noun="orders"
            className="border-t-0"
          />
        </div>
      )}
    </PageShell>
  );
}
