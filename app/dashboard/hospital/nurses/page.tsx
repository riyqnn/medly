"use client";

import { useEffect, useState } from "react";

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

export default function NurseRequestsPage() {
  const [requests, setRequests] = useState<NurseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch("/api/nurse-requests");
        if (res.ok) {
          const data = await res.json();
          setRequests(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const res = await fetch("/api/nurse-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nurse Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Active calls and requests from patient rooms</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="text-gray-500 col-span-full">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-gray-500 col-span-full">No active nurse requests at the moment.</div>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                    r.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    r.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {r.priority}
                  </span>
                  <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleTimeString()}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2">{r.request_category.replace('_', ' ')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Room: {r.patient_admissions?.rooms?.room_number || 'Unknown'} <br />
                  Patient: {r.patient_admissions?.patients?.full_name || 'Unknown'}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <select 
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
