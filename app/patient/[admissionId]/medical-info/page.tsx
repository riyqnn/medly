"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { HeartPulse, Thermometer, Activity, Wind } from "lucide-react";

interface Session {
  patient: { full_name: string; dob: string | null; gender: string | null } | null;
  room: { room_number: string; ward_name: string | null } | null;
  primary_diagnosis: string | null;
  day_of_stay: number;
  doctors: { role: string; full_name: string; specialization: string | null }[];
}

interface Schedule {
  id: string;
  category: string;
  title: string;
  description: string | null;
  scheduled_time: string;
  status: string;
  doctors?: { full_name: string } | null;
}

interface Vital {
  id: string;
  measured_at: string;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  temperature_celsius: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  DOCTOR_VISIT: "Visit Dokter",
  MEDICATION: "Pemberian Obat",
  LAB: "Pemeriksaan Lab",
  RADIOLOGY: "Radiologi",
  PHYSIO: "Fisioterapi",
  CONTROL: "Jadwal Kontrol",
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  RESCHEDULED: "bg-yellow-100 text-yellow-700",
};

export default function MedicalInfoPage() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [sRes, tRes, vRes] = await Promise.all([
        fetch(`/api/patient/session/${admissionId}`),
        fetch(`/api/patient/treatment-schedules?admission_id=${admissionId}`),
        fetch(`/api/patient/vitals?admission_id=${admissionId}`),
      ]);
      if (sRes.ok) setSession(await sRes.json());
      if (tRes.ok) setSchedules(await tRes.json());
      if (vRes.ok) setVitals(await vRes.json());
      setLoading(false);
    }
    load();
  }, [admissionId]);

  if (loading) return <div className="text-gray-500">Memuat...</div>;

  const latestVital = vitals[0];
  const mainDoctor = session?.doctors.find((d) => d.role === "MAIN_DOCTOR") || session?.doctors[0];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Informasi Medis</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-xs text-gray-500">Dokter</p><p className="font-medium">{mainDoctor?.full_name || "-"}</p></div>
          <div><p className="text-xs text-gray-500">Diagnosa Utama</p><p className="font-medium">{session?.primary_diagnosis || "-"}</p></div>
          <div><p className="text-xs text-gray-500">Kamar</p><p className="font-medium">{session?.room?.room_number || "-"}</p></div>
          <div><p className="text-xs text-gray-500">Hari Rawat</p><p className="font-medium">Hari ke-{session?.day_of_stay}</p></div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Vital Sign Terakhir</h2>
        {latestVital ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-xs text-gray-500">Tekanan Darah</p>
                <p className="font-medium">{latestVital.blood_pressure_systolic ?? "-"}/{latestVital.blood_pressure_diastolic ?? "-"} mmHg</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-pink-500" />
              <div>
                <p className="text-xs text-gray-500">Nadi</p>
                <p className="font-medium">{latestVital.heart_rate ?? "-"} bpm</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Suhu</p>
                <p className="font-medium">{latestVital.temperature_celsius ?? "-"} °C</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Saturasi O2</p>
                <p className="font-medium">{latestVital.oxygen_saturation ?? "-"}%</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Belum ada data vital sign.</p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Jadwal Perawatan</h2>
        {schedules.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada jadwal.</p>
        ) : (
          <div className="space-y-3">
            {schedules.map((s) => (
              <div key={s.id} className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-xs text-gray-500">
                    {new Date(s.scheduled_time).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p className="font-medium text-sm mt-0.5">
                    {CATEGORY_LABELS[s.category] || s.category} — {s.title}
                  </p>
                  {s.description && <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>}
                  {s.doctors?.full_name && <p className="text-xs text-gray-400 mt-0.5">{s.doctors.full_name}</p>}
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${STATUS_COLORS[s.status] || "bg-gray-100 text-gray-600"}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
