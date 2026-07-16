"use client";

import { useEffect, useState } from "react";
import { PlusIcon, X } from "lucide-react";

interface Schedule {
  id: string;
  category: string;
  title: string;
  description: string | null;
  scheduled_time: string;
  status: string;
  doctors?: { full_name: string; specialization: string | null };
  patient_admissions?: { patient_id: string };
}

interface Patient { id: string; full_name: string; mrn: string; }
interface Admission { id: string; patient_id: string; status: string; patients?: Patient; }
interface Doctor { id: string; full_name: string; }

const CATEGORIES = ["DOCTOR_VISIT", "MEDICATION", "LAB", "RADIOLOGY", "PHYSIO", "CONTROL"];
const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  RESCHEDULED: "bg-yellow-100 text-yellow-700",
};
const EMPTY_FORM = { admission_id: "", category: "DOCTOR_VISIT", title: "", description: "", scheduled_time: "", related_doctor_id: "" };

export default function TreatmentsPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => { loadAll(); }, [filterDate]);

  async function loadAll() {
    setLoading(true);
    const [sRes, aRes, dRes] = await Promise.all([
      fetch(`/api/treatment-schedules?date=${filterDate}`),
      fetch(`/api/patient-admissions?status=ACTIVE`),
      fetch(`/api/doctors`),
    ]);
    if (sRes.ok) setSchedules(await sRes.json());
    if (aRes.ok) setAdmissions(await aRes.json());
    if (dRes.ok) setDoctors(await dRes.json());
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch("/api/treatment-schedules", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, related_doctor_id: form.related_doctor_id || null }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); setSaving(false); return; }
    setShowModal(false); setForm(EMPTY_FORM); loadAll();
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/treatment-schedules/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    loadAll();
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Treatment Schedules</h1>
          <p className="text-sm text-gray-500 mt-1">Manage patient medical schedules and visitations</p>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setError(""); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <PlusIcon className="w-5 h-5" /> Create Schedule
        </button>
      </div>

      <div className="flex gap-4 items-center mb-4">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Filter by date:</label>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Doctor</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center">Loading...</td></tr>
            ) : schedules.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No schedules for this date</td></tr>
            ) : schedules.map(s => (
              <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium">{new Date(s.scheduled_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                <td className="px-6 py-4">{s.category.replace(/_/g, " ")}</td>
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{s.title}</td>
                <td className="px-6 py-4">{s.doctors?.full_name || "-"}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-md ${STATUS_COLORS[s.status] || ""}`}>{s.status}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <select value={s.status} onChange={e => updateStatus(s.id, e.target.value)}
                    className="text-xs px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="DONE">DONE</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="RESCHEDULED">RESCHEDULED</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Treatment Schedule</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-3 rounded-lg">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Patient (Active Admission) *</label>
                <select required value={form.admission_id} onChange={e => setForm({...form, admission_id: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                  <option value="">Select patient...</option>
                  {admissions.map(a => <option key={a.id} value={a.id}>{a.patients?.full_name} ({a.patients?.mrn})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Scheduled Time *</label>
                  <input required type="datetime-local" value={form.scheduled_time} onChange={e => setForm({...form, scheduled_time: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Title *</label>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" placeholder="e.g. Dr. Siti Morning Visit" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Related Doctor</label>
                <select value={form.related_doctor_id} onChange={e => setForm({...form, related_doctor_id: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                  <option value="">None</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Create Schedule"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
