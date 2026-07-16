"use client";

import { useEffect, useState } from "react";
import { LogoutButton } from "@/src/features/auth/components/LogoutButton";
import { createClient } from "@/src/features/auth/utils/supabase/client";

interface PatientAssignment {
  id: string;
  role: string;
  patient_admissions?: {
    id: string;
    status: string;
    patients?: { full_name: string; mrn: string };
    rooms?: { room_number: string; ward_name: string };
  };
}

interface DoctorSchedule {
  id: string;
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
}

export default function DoctorDashboard() {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientAssignment[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    async function init() {
      // 1. Identify logged-in doctor
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("full_name, hospital_id").eq("id", user.id).single();
      
      if (profile) {
        // Naive match by name or fallback to first doctor
        const { data: doctors } = await supabase.from("doctors").select("id").eq("hospital_id", profile.hospital_id);
        if (doctors && doctors.length > 0) {
          const matched = doctors.find((d: any) => d.full_name === profile.full_name) || doctors[0];
          setDoctorId(matched.id);
        }
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!doctorId) return;
    
    async function loadData() {
      setLoading(true);
      try {
        const [patRes, schedRes] = await Promise.all([
          fetch(`/api/patient-doctor-assignments?doctor_id=${doctorId}`),
          fetch(`/api/doctor-schedules?doctor_id=${doctorId}`)
        ]);

        if (patRes.ok) {
            const data = await patRes.json();
            // Filter only active admissions
            setPatients(data.filter((d: any) => d.patient_admissions?.status === 'ACTIVE'));
        }
        if (schedRes.ok) setSchedules(await schedRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [doctorId]);

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <header className="flex justify-between items-center mb-8 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Doctor Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your patients, treatments, and schedules</p>
        </div>
        <LogoutButton />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: My Patients */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🛏️</span> My Admitted Patients
          </h2>
          
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Patient Info</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">My Role</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading patients...</td></tr>
                ) : patients.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No active patients assigned to you.</td></tr>
                ) : patients.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{p.patient_admissions?.patients?.full_name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">MRN: {p.patient_admissions?.patients?.mrn}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{p.patient_admissions?.rooms?.room_number}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{p.patient_admissions?.rooms?.ward_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${p.role === 'MAIN_DOCTOR' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {p.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">View Med Rec</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Schedules */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">📅</span> My Schedule
          </h2>
          
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            {loading ? (
              <div className="text-center text-gray-500 py-4">Loading schedule...</div>
            ) : schedules.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No schedules configured.</div>
            ) : (
              <div className="space-y-4">
                {schedules.map(s => (
                  <div key={s.id} className="flex gap-4 items-start pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                    <div className="flex-shrink-0 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold">
                      {s.day_of_week !== null ? (
                        <span className="text-sm">{DAYS[s.day_of_week].substring(0, 3)}</span>
                      ) : (
                        <>
                          <span className="text-xs">{s.specific_date?.split('-')[2]}</span>
                          <span className="text-[9px] uppercase">{new Date(s.specific_date!).toLocaleString('en', {month: 'short'})}</span>
                        </>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                      </div>
                      <div className="text-sm text-gray-500">{s.location || 'Unknown Location'}</div>
                      {s.status !== 'ACTIVE' && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">
                          {s.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button className="w-full mt-6 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Request Schedule Change
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
