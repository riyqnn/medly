"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Admission {
  id: string;
  status: string;
  admission_date: string;
  discharge_date: string | null;
  room_id: string | null;
  rooms?: { room_number: string; ward_name: string };
}

interface Doctor {
  id: string;
  full_name: string;
  specialization: string | null;
}

interface Room { id: string; room_number: string; ward_name: string; status: string; }

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (id) loadAll();
  }, [id]);

  async function loadAll() {
    setLoading(true);
    const [pRes, aRes, dRes, rRes] = await Promise.all([
      fetch(`/api/patients/${id}`),
      fetch(`/api/patient-admissions?patient_id=${id}`),
      fetch(`/api/doctors`),
      fetch(`/api/rooms`),
    ]);
    if (pRes.ok) setPatient(await pRes.json());
    if (aRes.ok) setAdmissions(await aRes.json());
    if (dRes.ok) setDoctors(await dRes.json());
    if (rRes.ok) setRooms(await rRes.json());
    setLoading(false);
  }

  const activeAdmission = admissions.find(a => a.status === "ACTIVE");

  async function handleAdmit() {
    setAssigning(true);
    const res = await fetch("/api/patient-admissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: id, room_id: selectedRoom || null }),
    });
    if (res.ok) loadAll();
    else { const d = await res.json(); alert(d.error); }
    setAssigning(false);
  }

  async function handleStatusChange(admissionId: string, status: string) {
    setStatusUpdating(true);
    await fetch(`/api/patient-admissions/${admissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setStatusUpdating(false);
    loadAll();
  }

  async function handleAssignDoctor() {
    if (!activeAdmission || !selectedDoctor) return;
    const res = await fetch("/api/patient-doctor-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admission_id: activeAdmission.id, doctor_id: selectedDoctor }),
    });
    const d = await res.json();
    if (!res.ok) alert(d.error);
    setSelectedDoctor("");
  }

  if (loading) return <div className="p-8 text-gray-500">Loading patient...</div>;
  if (!patient) return <div className="p-8 text-red-500">Patient not found.</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/hospital/patients" className="text-sm text-gray-500 hover:underline">← Patients</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900 dark:text-white">{patient.full_name}</span>
      </div>

      {/* Patient Info */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{patient.full_name}</h1>
            <p className="text-sm text-gray-500 mt-1">MRN: <span className="font-mono">{patient.mrn}</span></p>
          </div>
          <Link href={`/dashboard/hospital/patients/${id}/edit`} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            Edit Patient
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div><p className="text-xs text-gray-500">Date of Birth</p><p className="font-medium text-sm">{patient.dob || "-"}</p></div>
          <div><p className="text-xs text-gray-500">Gender</p><p className="font-medium text-sm capitalize">{patient.gender || "-"}</p></div>
          <div><p className="text-xs text-gray-500">Contact</p><p className="font-medium text-sm">{patient.contact_number || "-"}</p></div>
          <div><p className="text-xs text-gray-500">Emergency Contact</p><p className="font-medium text-sm">{patient.emergency_contact || "-"}</p></div>
        </div>
      </div>

      {/* Admission Status */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Admission Status</h2>
        {activeAdmission ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">ACTIVE</span>
              <span className="text-sm text-gray-500">Room: <strong>{activeAdmission.rooms?.room_number || "Unassigned"}</strong></span>
              <span className="text-sm text-gray-500">Ward: <strong>{activeAdmission.rooms?.ward_name || "-"}</strong></span>
            </div>
            <div className="flex gap-3 flex-wrap">
              {["DISCHARGED", "TRANSFERRED", "DECEASED"].map(s => (
                <button key={s} onClick={() => handleStatusChange(activeAdmission.id, s)} disabled={statusUpdating}
                  className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
                  Mark as {s}
                </button>
              ))}
            </div>
            {/* Move Room */}
            <div className="mt-4 flex gap-3 items-center">
              <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                <option value="">Move to different room...</option>
                {rooms.filter(r => r.status !== "MAINTENANCE").map(r => (
                  <option key={r.id} value={r.id}>Room {r.room_number} — {r.ward_name}</option>
                ))}
              </select>
              <button onClick={() => handleStatusChange(activeAdmission.id, "ACTIVE")} disabled={!selectedRoom || assigning}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                Move Room
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-4">This patient has no active admission.</p>
            <div className="flex gap-3 items-center">
              <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                <option value="">Select room (optional)...</option>
                {rooms.filter(r => r.status !== "MAINTENANCE").map(r => (
                  <option key={r.id} value={r.id}>Room {r.room_number} — {r.ward_name}</option>
                ))}
              </select>
              <button onClick={handleAdmit} disabled={assigning}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50">
                {assigning ? "Admitting..." : "Admit Patient"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Assign Doctor */}
      {activeAdmission && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Assign Doctor</h2>
          <div className="flex gap-3 items-center">
            <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm flex-1">
              <option value="">Select a doctor...</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} {d.specialization ? `— ${d.specialization}` : ""}</option>)}
            </select>
            <button onClick={handleAssignDoctor} disabled={!selectedDoctor}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              Assign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
