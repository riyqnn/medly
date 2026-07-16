"use client";

import { useEffect, useState } from "react";
import { LogoutButton } from "@/src/features/auth/components/LogoutButton";
import { createClient } from "@/src/features/auth/utils/supabase/client";

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

export default function NurseDashboard() {
  const [requests, setRequests] = useState<NurseRequest[]>([]);
  const [history, setHistory] = useState<NurseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [nurseId, setNurseId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      // Find the nurse profile based on the logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("full_name, hospital_id").eq("id", user.id).single();
      
      if (profile) {
        // Try to match nurse by name, or just get the first one for this hospital
        const { data: nurses } = await supabase.from("nurses").select("id").eq("hospital_id", profile.hospital_id);
        if (nurses && nurses.length > 0) {
          // Naive match by name, fallback to first nurse
          const matched = nurses.find((n: any) => n.full_name === profile.full_name) || nurses[0];
          setNurseId(matched.id);
        }
      }
      
      fetchRequests();
    }
    init();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    try {
      const res = await fetch("/api/nurse-requests");
      if (res.ok) setRequests(await res.json());

      // If we know the nurse ID, fetch their history
      if (nurseId) {
        const histRes = await fetch(`/api/nurse-requests?nurse_id=${nurseId}&status=RESOLVED`);
        if (histRes.ok) setHistory(await histRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Re-fetch history if nurseId becomes available after initial load
  useEffect(() => {
    if (nurseId) fetchRequests();
  }, [nurseId]);

  async function handleAction(id: string, newStatus: string) {
    try {
      const payload: any = { id, status: newStatus };
      if (newStatus === "IN_PROGRESS" && nurseId) {
        payload.handled_by_nurse_id = nurseId;
      }

      const res = await fetch("/api/nurse-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchRequests(); // Refresh lists
      }
    } catch (err) {
      console.error(err);
    }
  }

  const PRIORITY_COLORS: Record<string, string> = {
    HIGH: "bg-red-100 text-red-700 border-red-200",
    MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
    LOW: "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <header className="flex justify-between items-center mb-8 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-600">Nurse Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">Live patient requests and bedside assistance</p>
        </div>
        <LogoutButton />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Requests Column */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
            Active Bedside Requests
          </h2>
          
          {loading ? (
            <div className="text-gray-500 text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="text-gray-500 text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">No active patient requests. All clear! 🎉</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((r) => (
                <div key={r.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${PRIORITY_COLORS[r.priority] || PRIORITY_COLORS.LOW}`}>
                        {r.priority} PRIORITY
                      </span>
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                        {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-black text-gray-900 dark:text-white capitalize mb-1">
                      {r.request_category.replace('_', ' ').toLowerCase()}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <span className="font-semibold text-gray-900 dark:text-gray-200">{r.patient_admissions?.rooms?.room_number || 'Unknown Room'}</span> • {r.patient_admissions?.patients?.full_name || 'Unknown Patient'}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-800/50">
                    {r.status === "PENDING" ? (
                      <button 
                        onClick={() => handleAction(r.id, "IN_PROGRESS")}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors"
                      >
                        Accept & Respond
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAction(r.id, "RESOLVED")}
                          className="flex-1 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-xl transition-colors"
                        >
                          Mark Resolved
                        </button>
                        <button 
                          disabled
                          className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-400 font-bold rounded-xl cursor-not-allowed text-sm"
                        >
                          In Progress
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History Column */}
        <div>
          <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-200">My Shift History</h2>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            {history.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No resolved requests yet.</div>
            ) : (
              <ul className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {history.map(h => (
                  <li key={h.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-sm capitalize">{h.request_category.replace('_', ' ').toLowerCase()}</span>
                      <span className="text-xs text-gray-400">{new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-gray-500">Room {h.patient_admissions?.rooms?.room_number} • {h.patient_admissions?.patients?.full_name}</p>
                    <div className="mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 w-max px-2 py-0.5 rounded uppercase">Resolved</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
