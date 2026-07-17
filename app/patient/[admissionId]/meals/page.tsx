"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UtensilsCrossed, Check } from "lucide-react";
import { BedsideTitle, Pager } from "../PatientShell";
import { MEAL_SCHEDULES, MEAL_ORDER_STATUS, formatRupiah } from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface Menu {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  meal_type_tags: string[] | null;
}
interface Order {
  id: string;
  meal_schedule: string;
  status: string;
  meal_menus: { name: string } | null;
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

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
  const [done, setDone] = useState<string | null>(null);

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
      setDone(menuId);
      setTimeout(() => setDone(null), 3000);
      load();
    }
  }

  if (loading || !sitting)
    return <div className="grid flex-1 place-items-center text-xl font-bold text-ink-mute">Memuat…</div>;

  const available = menus.filter((m) => !m.meal_type_tags?.length || m.meal_type_tags.includes(sitting));
  const active = orders.filter((o) => o.status !== "REJECTED").slice(0, 2);

  return (
    <>
      <BedsideTitle
        aside={
          active.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              {active.map((o) => {
                const st = MEAL_ORDER_STATUS[o.status];
                return (
                  <span key={o.id} className={cn("rounded-full px-4 py-2 text-sm font-extrabold", st?.chip)}>
                    {o.meal_menus?.name} · {st?.label}
                  </span>
                );
              })}
            </div>
          )
        }
      >
        Pesan Makanan
      </BedsideTitle>

      {/* Sitting switcher — three targets, thumb-sized. */}
      <div className="mb-4 flex shrink-0 gap-2">
        {MEAL_SCHEDULES.map((s) => (
          <button
            key={s.value}
            onClick={() => setSitting(s.value)}
            className={cn(
              "rounded-2xl border px-6 py-3 text-lg font-extrabold transition active:scale-[0.97]",
              sitting === s.value
                ? "border-brand-500 bg-brand-500 text-white shadow-lift"
                : "border-line bg-white text-ink-soft shadow-card hover:border-brand-300 hover:bg-brand-50"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Pager
        items={available}
        perPage={6}
        className="grid-cols-2 grid-rows-3 sm:grid-cols-3 sm:grid-rows-2"
        empty="Belum ada menu untuk sesi ini"
        render={(m) => {
          const isDone = done === m.id;
          return (
            <button
              key={m.id}
              onClick={() => order(m.id)}
              disabled={ordering === m.id || isDone}
              className={cn(
                "group flex min-h-0 flex-col overflow-hidden rounded-3xl border text-left transition duration-200 active:scale-[0.98]",
                isDone
                  ? "border-brand-500 bg-brand-500 shadow-lift"
                  : "border-line bg-white shadow-card hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
              )}
            >
              <div className="grid min-h-0 flex-1 place-items-center overflow-hidden bg-brand-50">
                {isDone ? (
                  <Check className="h-12 w-12 text-white" strokeWidth={2.5} />
                ) : m.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UtensilsCrossed className="h-10 w-10 text-brand-300" strokeWidth={1.6} />
                )}
              </div>
              <div className={cn("shrink-0 px-4 py-3", isDone && "text-white")}>
                <p className={cn("truncate text-lg font-extrabold leading-tight", isDone ? "text-white" : "text-ink")}>
                  {isDone ? "Pesanan terkirim" : m.name}
                </p>
                <p className={cn("tabular text-sm font-bold", isDone ? "text-white/80" : "text-brand-600")}>
                  {ordering === m.id
                    ? "Memesan…"
                    : Number(m.price) > 0
                      ? formatRupiah(m.price)
                      : "Termasuk perawatan"}
                </p>
              </div>
            </button>
          );
        }}
      />
    </>
  );
}
