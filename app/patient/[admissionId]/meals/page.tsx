"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Menu {
  id: string;
  name: string;
  description: string | null;
  price: number;
  meal_type_tags: string[];
  meal_categories?: { name: string } | null;
}

interface Order {
  id: string;
  meal_schedule: string;
  order_date: string;
  status: string;
  patient_notes: string | null;
  created_at: string;
  meal_menus: { name: string; price: number } | null;
}

const SCHEDULES = [
  { value: "BREAKFAST", label: "Sarapan" },
  { value: "LUNCH", label: "Makan Siang" },
  { value: "DINNER", label: "Makan Malam" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700" },
  PREPARING: { label: "Disiapkan", color: "bg-blue-100 text-blue-700" },
  DELIVERED: { label: "Terkirim", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Ditolak", color: "bg-red-100 text-red-700" },
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function MealsPage() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [schedule, setSchedule] = useState("BREAKFAST");
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState<string | null>(null);

  useEffect(() => { load(); }, [admissionId]);

  async function load() {
    setLoading(true);
    const [mRes, oRes] = await Promise.all([
      fetch(`/api/patient/meal-menus?admission_id=${admissionId}`),
      fetch(`/api/patient/meal-orders?admission_id=${admissionId}`),
    ]);
    if (mRes.ok) setMenus(await mRes.json());
    if (oRes.ok) setOrders(await oRes.json());
    setLoading(false);
  }

  async function placeOrder(menuId: string) {
    setOrdering(menuId);
    const res = await fetch("/api/patient/meal-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admission_id: admissionId,
        menu_id: menuId,
        meal_schedule: schedule,
        order_date: todayStr(),
      }),
    });
    setOrdering(null);
    if (res.ok) {
      load();
    } else {
      const d = await res.json();
      alert(d.error || "Gagal memesan");
    }
  }

  const filteredMenus = menus.filter((m) => !m.meal_type_tags?.length || m.meal_type_tags.includes(schedule));

  if (loading) return <div className="text-gray-500">Memuat...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Menu Hari Ini</h2>
        <div className="flex gap-2 mb-5">
          {SCHEDULES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSchedule(s.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                schedule === s.value ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {filteredMenus.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada menu untuk sesi ini.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMenus.map((m) => (
              <div key={m.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{m.name}</h3>
                  {m.meal_categories?.name && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                      {m.meal_categories.name}
                    </span>
                  )}
                </div>
                {m.description && <p className="text-xs text-gray-500 mt-1">{m.description}</p>}
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <span className="font-semibold text-blue-600">Rp {Number(m.price ?? 0).toLocaleString("id-ID")}</span>
                  <button
                    onClick={() => placeOrder(m.id)}
                    disabled={ordering === m.id}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {ordering === m.id ? "Memesan..." : "Pesan"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Status Pesanan</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada pesanan.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => {
              const st = STATUS_LABELS[o.status] || { label: o.status, color: "bg-gray-100 text-gray-600" };
              const scheduleLabel = SCHEDULES.find((s) => s.value === o.meal_schedule)?.label || o.meal_schedule;
              return (
                <div key={o.id} className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{o.meal_menus?.name || "-"}</p>
                    <p className="text-xs text-gray-500">{o.order_date} — {scheduleLabel}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${st.color}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
