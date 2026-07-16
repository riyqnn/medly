"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UtensilsCrossed, Check } from "lucide-react";
import { BedsideHeader, BedsideCard, BedsideEmpty, BedsideLoading } from "../PatientPage";
import { MEAL_SCHEDULES, MEAL_ORDER_STATUS, formatRupiah } from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface Menu {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  meal_type_tags: string[] | null;
  meal_categories?: { name: string } | null;
}
interface Order {
  id: string;
  meal_schedule: string;
  order_date: string;
  status: string;
  meal_menus: { name: string; price: number } | null;
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Default to the sitting the patient is most likely ordering for right now. */
function currentSitting() {
  const h = new Date().getHours();
  if (h < 10) return "BREAKFAST";
  if (h < 15) return "LUNCH";
  return "DINNER";
}

export default function MealsPage() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sitting, setSitting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState<string | null>(null);
  const [justOrdered, setJustOrdered] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [m, o] = await Promise.all([
      fetch(`/api/patient/meal-menus?admission_id=${admissionId}`),
      fetch(`/api/patient/meal-orders?admission_id=${admissionId}`),
    ]);
    if (m.ok) setMenus(await m.json());
    if (o.ok) setOrders(await o.json());
    setLoading(false);
  }, [admissionId]);

  useEffect(() => {
    setSitting(currentSitting());
    load();
  }, [load]);

  async function order(menuId: string) {
    setOrdering(menuId);
    const res = await fetch("/api/patient/meal-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admission_id: admissionId,
        menu_id: menuId,
        meal_schedule: sitting,
        order_date: todayStr(),
      }),
    });
    setOrdering(null);
    if (res.ok) {
      setJustOrdered(menuId);
      setTimeout(() => setJustOrdered(null), 2600);
      load();
    } else {
      const d = await res.json();
      alert(d.error ?? "Gagal memesan");
    }
  }

  if (loading || !sitting) return <BedsideLoading />;

  const available = menus.filter(
    (m) => !m.meal_type_tags?.length || m.meal_type_tags.includes(sitting)
  );

  return (
    <div className="space-y-4">
      <BedsideHeader title="Pesan Makanan" description="Menu yang tersedia untuk Anda hari ini." />

      {/* Sitting switcher */}
      <div className="inline-flex rounded-full border border-line bg-white p-1 shadow-card">
        {MEAL_SCHEDULES.map((s) => (
          <button
            key={s.value}
            onClick={() => setSitting(s.value)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-bold transition-all duration-200",
              sitting === s.value
                ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                : "text-ink-soft hover:text-brand-700"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {available.length === 0 ? (
        <BedsideCard>
          <BedsideEmpty>Belum ada menu untuk sesi ini.</BedsideEmpty>
        </BedsideCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {available.map((m, i) => {
            const done = justOrdered === m.id;
            return (
              <article
                key={m.id}
                style={{ animationDelay: `${i * 45}ms` }}
                className="card flex animate-fade-up flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="relative grid h-32 place-items-center overflow-hidden bg-brand-50">
                  {m.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UtensilsCrossed className="h-8 w-8 text-brand-300" strokeWidth={1.6} />
                  )}
                  {m.meal_categories?.name && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold text-ink backdrop-blur">
                      {m.meal_categories.name}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-[15px] font-extrabold leading-snug text-ink">{m.name}</h2>
                  {m.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">{m.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between gap-3 pt-1">
                    <span className="tabular text-sm font-extrabold text-ink">
                      {Number(m.price) > 0 ? formatRupiah(m.price) : "Termasuk perawatan"}
                    </span>
                    <button
                      onClick={() => order(m.id)}
                      disabled={ordering === m.id || done}
                      className={cn("btn-primary px-4 py-2 text-xs", done && "bg-brand-600")}
                    >
                      {done ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Dipesan
                        </>
                      ) : ordering === m.id ? (
                        "Memesan…"
                      ) : (
                        "Pesan"
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <BedsideCard title="Status pesanan">
        {orders.length === 0 ? (
          <BedsideEmpty>Anda belum memesan makanan.</BedsideEmpty>
        ) : (
          <ul className="divide-y divide-line">
            {orders.slice(0, 8).map((o) => {
              const st = MEAL_ORDER_STATUS[o.status];
              const sittingLabel =
                MEAL_SCHEDULES.find((s) => s.value === o.meal_schedule)?.label ?? o.meal_schedule;
              return (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-ink">{o.meal_menus?.name ?? "—"}</p>
                    <p className="tabular text-xs text-ink-mute">
                      {new Date(o.order_date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {sittingLabel}
                    </p>
                  </div>
                  <span className={cn("chip", st?.chip)}>{st?.label ?? o.status}</span>
                </li>
              );
            })}
          </ul>
        )}
      </BedsideCard>
    </div>
  );
}
