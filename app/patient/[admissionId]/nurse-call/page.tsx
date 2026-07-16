"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Bell, Frown, Droplets, ShowerHead, GlassWater, Blinds, HelpCircle } from "lucide-react";

interface NurseRequest {
  id: string;
  request_category: string;
  priority: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

const CATEGORIES = [
  { value: "CALL_NURSE", label: "Panggil Perawat", icon: Bell },
  { value: "PAIN", label: "Nyeri", icon: Frown },
  { value: "IV_DRIP", label: "Infus Habis", icon: Droplets },
  { value: "BATHROOM", label: "Bantuan ke Kamar Mandi", icon: ShowerHead },
  { value: "DRINKING_WATER", label: "Air Minum", icon: GlassWater },
  { value: "EXTRA_BLANKET", label: "Selimut Tambahan", icon: Blinds },
  { value: "OTHER", label: "Bantuan Lainnya", icon: HelpCircle },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700" },
  IN_PROGRESS: { label: "Sedang Ditangani", color: "bg-blue-100 text-blue-700" },
  RESOLVED: { label: "Selesai", color: "bg-green-100 text-green-700" },
};

export default function NurseCallPage() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const [requests, setRequests] = useState<NurseRequest[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [justSent, setJustSent] = useState<string | null>(null);

  useEffect(() => { loadRequests(); }, [admissionId]);

  async function loadRequests() {
    const res = await fetch(`/api/patient/nurse-requests?admission_id=${admissionId}`);
    if (res.ok) setRequests(await res.json());
  }

  async function sendRequest(category: string) {
    setSending(category);
    const res = await fetch("/api/patient/nurse-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admission_id: admissionId, request_category: category }),
    });
    setSending(null);
    if (res.ok) {
      setJustSent(category);
      setTimeout(() => setJustSent(null), 3000);
      loadRequests();
    } else {
      const d = await res.json();
      alert(d.error || "Gagal mengirim permintaan");
    }
  }

  const activeRequests = requests.filter((r) => r.status !== "RESOLVED");
  const history = requests.filter((r) => r.status === "RESOLVED");

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Panggil Perawat</h2>
        <p className="text-sm text-gray-500 mb-4">Pilih kebutuhan Anda, perawat akan segera menerima notifikasi.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => sendRequest(c.value)}
              disabled={sending === c.value}
              className="flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors disabled:opacity-50"
            >
              <c.icon className="w-7 h-7 text-blue-600" />
              <span className="text-xs font-medium text-center">{c.label}</span>
              {justSent === c.value && <span className="text-[10px] text-green-600 font-semibold">Terkirim!</span>}
            </button>
          ))}
        </div>
      </div>

      {activeRequests.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Permintaan Aktif</h2>
          <div className="space-y-2">
            {activeRequests.map((r) => {
              const cat = CATEGORIES.find((c) => c.value === r.request_category);
              const st = STATUS_LABELS[r.status] || { label: r.status, color: "bg-gray-100 text-gray-600" };
              return (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span>{cat?.label || r.request_category}</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${st.color}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Riwayat</h2>
          <div className="space-y-2">
            {history.slice(0, 5).map((r) => {
              const cat = CATEGORIES.find((c) => c.value === r.request_category);
              return (
                <div key={r.id} className="flex items-center justify-between text-sm text-gray-500">
                  <span>{cat?.label || r.request_category}</span>
                  <span>{r.resolved_at ? new Date(r.resolved_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "-"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
