"use client";

import { useEffect, useState } from "react";

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

const STATUS_FLOW: Record<string, string> = {
  PENDING: "PREPARING",
  PREPARING: "DELIVERED",
};

export default function MealOrdersPage() {
  const [orders, setOrders] = useState<MealOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    const res = await fetch("/api/meal-orders");
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/meal-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchOrders();
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meal Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Active food orders placed from patient bedside screens</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center text-gray-400 py-12">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">No active orders.</div>
        ) : orders.map((o) => (
          <div key={o.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="px-2 py-1 text-xs font-semibold rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {o.status}
              </span>
              <span className="text-xs text-gray-500">{new Date(o.created_at).toLocaleTimeString()}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2">{o.meal_menus?.name || "-"}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Room: {o.patient_admissions?.rooms?.room_number || "-"} <br />
              Patient: {o.patient_admissions?.patients?.full_name || "-"} <br />
              {o.order_date} — {o.meal_schedule}
            </p>
            {o.patient_notes && <p className="text-xs text-gray-500 mt-2 italic">"{o.patient_notes}"</p>}
            {STATUS_FLOW[o.status] && (
              <button
                onClick={() => updateStatus(o.id, STATUS_FLOW[o.status])}
                className="mt-4 w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Mark as {STATUS_FLOW[o.status]}
              </button>
            )}
            {o.status === "PENDING" && (
              <button
                onClick={() => updateStatus(o.id, "REJECTED")}
                className="mt-2 w-full px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Reject
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
