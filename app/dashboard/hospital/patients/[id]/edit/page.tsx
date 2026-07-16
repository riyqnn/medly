"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditPatientPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [form, setForm] = useState({ full_name: "", dob: "", gender: "", contact_number: "", emergency_contact: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/patients/${id}`).then(r => r.json()).then(d => {
      setForm({ full_name: d.full_name || "", dob: d.dob || "", gender: d.gender || "", contact_number: d.contact_number || "", emergency_contact: d.emergency_contact || "" });
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch(`/api/patients/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      router.push(`/dashboard/hospital/patients/${id}`);
    } else {
      const d = await res.json();
      setError(d.error || "Failed to save");
    }
    setSaving(false);
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/hospital/patients/${id}`} className="text-sm text-gray-500 hover:underline">← Back to Patient</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Patient</h1>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
            <input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
              <input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
              <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Number</label>
              <input value={form.contact_number} onChange={e => setForm({...form, contact_number: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emergency Contact</label>
              <input value={form.emergency_contact} onChange={e => setForm({...form, emergency_contact: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link href={`/dashboard/hospital/patients/${id}`} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</Link>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
