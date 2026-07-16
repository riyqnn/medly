"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusIcon, MonitorPlay } from "lucide-react";

interface Patient {
  id: string;
  mrn: string;
  full_name: string;
  dob: string | null;
  gender: string | null;
}

interface ActiveAdmission {
  id: string;
  patient_id: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  DISCHARGED: "bg-gray-100 text-gray-600",
  TRANSFERRED: "bg-yellow-100 text-yellow-700",
  DECEASED: "bg-red-100 text-red-700",
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeAdmissionByPatient, setActiveAdmissionByPatient] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchPatients(); }, [search]);

  async function fetchPatients() {
    setLoading(true);
    const url = search ? `/api/patients?q=${encodeURIComponent(search)}` : "/api/patients";
    const [pRes, aRes] = await Promise.all([
      fetch(url),
      fetch("/api/patient-admissions?status=ACTIVE"),
    ]);
    if (pRes.ok) setPatients(await pRes.json());
    if (aRes.ok) {
      const admissions: ActiveAdmission[] = await aRes.json();
      const map: Record<string, string> = {};
      admissions.forEach((a) => { map[a.patient_id] = a.id; });
      setActiveAdmissionByPatient(map);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Soft-delete this patient record?")) return;
    setDeleting(id);
    await fetch(`/api/patients/${id}`, { method: "DELETE" });
    setDeleting(null);
    fetchPatients();
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage active patient admissions and registrations</p>
        </div>
        <Link href="/dashboard/hospital/patients/create" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <PlusIcon className="w-5 h-5" /> Register Patient
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <input
            type="text" placeholder="Search by name..."
            className="w-full max-w-sm px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4">MRN</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">DOB</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center">Loading...</td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No patients found</td></tr>
              ) : patients.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-mono font-medium text-gray-900 dark:text-white">{p.mrn}</td>
                  <td className="px-6 py-4 font-medium">{p.full_name}</td>
                  <td className="px-6 py-4">{p.dob || "-"}</td>
                  <td className="px-6 py-4 capitalize">{p.gender || "-"}</td>
                  <td className="px-6 py-4 text-right flex gap-3 justify-end items-center">
                    {activeAdmissionByPatient[p.id] && (
                      <a
                        href={`/patient/${activeAdmissionByPatient[p.id]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-green-600 hover:underline"
                        title="Buka screen tablet Careo untuk pasien ini"
                      >
                        <MonitorPlay className="w-4 h-4" /> Tampilkan
                      </a>
                    )}
                    <Link href={`/dashboard/hospital/patients/${p.id}`} className="text-blue-600 hover:underline">View</Link>
                    <Link href={`/dashboard/hospital/patients/${p.id}/edit`} className="text-indigo-600 hover:underline">Edit</Link>
                    <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} className="text-red-500 hover:underline disabled:opacity-50">
                      {deleting === p.id ? "..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
