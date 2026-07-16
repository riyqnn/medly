"use client";

import { useEffect, useState } from "react";
import { PlusIcon, X } from "lucide-react";

interface Doctor {
  id: string;
  employee_code: string;
  full_name: string;
  specialization: string | null;
  str_number: string | null;
  sip_number: string | null;
}

const EMPTY_FORM = { employee_code: "", full_name: "", specialization: "", str_number: "", sip_number: "" };

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Doctor | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchDoctors(); }, []);

  async function fetchDoctors() {
    setLoading(true);
    const res = await fetch("/api/doctors");
    if (res.ok) setDoctors(await res.json());
    setLoading(false);
  }

  function openAdd() { setEditTarget(null); setForm(EMPTY_FORM); setError(""); setShowModal(true); }
  function openEdit(d: Doctor) {
    setEditTarget(d);
    setForm({ employee_code: d.employee_code, full_name: d.full_name, specialization: d.specialization || "", str_number: d.str_number || "", sip_number: d.sip_number || "" });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = editTarget
        ? await fetch(`/api/doctors/${editTarget.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        : await fetch("/api/doctors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setShowModal(false);
      fetchDoctors();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this doctor?")) return;
    await fetch(`/api/doctors/${id}`, { method: "DELETE" });
    fetchDoctors();
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Doctor Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage hospital doctors and specializations</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <PlusIcon className="w-5 h-5" /> Add Doctor
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Full Name</th>
              <th className="px-6 py-4">Specialization</th>
              <th className="px-6 py-4">STR / SIP</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center">Loading...</td></tr>
            ) : doctors.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No doctors registered yet</td></tr>
            ) : doctors.map((d) => (
              <tr key={d.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 font-mono font-medium text-gray-900 dark:text-white">{d.employee_code}</td>
                <td className="px-6 py-4 font-medium">{d.full_name}</td>
                <td className="px-6 py-4">{d.specialization || "-"}</td>
                <td className="px-6 py-4 text-xs">{d.str_number || "-"} / {d.sip_number || "-"}</td>
                <td className="px-6 py-4 text-right flex gap-3 justify-end">
                  <button onClick={() => openEdit(d)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editTarget ? "Edit Doctor" : "Add Doctor"}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-3 rounded-lg">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Employee Code *</label>
                  <input required value={form.employee_code} onChange={e => setForm({...form, employee_code: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" placeholder="DR-001" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Full Name *</label>
                  <input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" placeholder="dr. John Doe, Sp.A" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Specialization</label>
                <input value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" placeholder="Cardiology, General, etc." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">STR Number</label>
                  <input value={form.str_number} onChange={e => setForm({...form, str_number: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">SIP Number</label>
                  <input value={form.sip_number} onChange={e => setForm({...form, sip_number: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-2 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save Doctor"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
