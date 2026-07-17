"use client";

import { useEffect, useState } from "react";
import { BedDouble, CalendarClock } from "lucide-react";
import { PortalHeader } from "@/src/features/shell/components/PortalHeader";
import { useMyHospital } from "@/src/features/shell/useMyHospital";
import { EmptyState, Loading } from "@/src/features/shell/components/Page";
import { createClient } from "@/src/features/auth/utils/supabase/client";
import { cn } from "@/src/lib/utils";

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

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DoctorDashboard() {
  const hospital = useMyHospital();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [linked, setLinked] = useState<boolean | null>(null);
  const [patients, setPatients] = useState<PatientAssignment[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Resolved by the account this record belongs to, not by name matching.
      const { data: doctor } = await supabase
        .from("doctors")
        .select("id")
        .eq("profile_id", user.id)
        .is("deleted_at", null)
        .maybeSingle();

      setDoctorId(doctor?.id ?? null);
      setLinked(!!doctor);
      if (!doctor) setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!doctorId) return;
    (async () => {
      setLoading(true);
      const [patRes, schedRes] = await Promise.all([
        fetch(`/api/patient-doctor-assignments?doctor_id=${doctorId}`),
        fetch(`/api/doctor-schedules?doctor_id=${doctorId}`),
      ]);
      if (patRes.ok) {
        const data = await patRes.json();
        setPatients(data.filter((d: any) => d.patient_admissions?.status === "ACTIVE"));
      }
      if (schedRes.ok) setSchedules(await schedRes.json());
      setLoading(false);
    })();
  }, [doctorId]);

  return (
    <div className="min-h-screen bg-canvas">
      <PortalHeader
        role={hospital.name ? `Portal dokter · ${hospital.name}` : "Doctor portal"}
        title="My Patients & Schedule"
        subtitle="The inpatients assigned to you."
        logoUrl={hospital.logo_url}
      />

      <main className="mx-auto max-w-6xl animate-fade-up px-6 py-7">
        {linked === false && (
          <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Your account isn’t linked to a doctor record, so your patients and schedule can’t be shown.
            Ask an admin to open the Doctors page and link this account.
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <h2 className="eyebrow mb-4">My inpatients</h2>
            <div className="card overflow-hidden">
              {loading ? (
                <Loading label="Loading patients…" />
              ) : patients.length === 0 ? (
                <EmptyState
                  icon={BedDouble}
                  title="No patients yet"
                  hint="Patients your admin assigns to you will appear here."
                />
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-canvas/60">
                      <th className="eyebrow px-6 py-3 font-bold">Patient</th>
                      <th className="eyebrow px-6 py-3 font-bold">Location</th>
                      <th className="eyebrow px-6 py-3 font-bold">My role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {patients.map((p) => (
                      <tr key={p.id} className="transition-colors hover:bg-canvas/70">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-extrabold text-brand-700">
                              {(p.patient_admissions?.patients?.full_name ?? "?")
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                            <div>
                              <p className="font-bold text-ink">
                                {p.patient_admissions?.patients?.full_name}
                              </p>
                              <p className="tabular text-xs text-ink-mute">
                                MRN {p.patient_admissions?.patients?.mrn}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-ink">
                            {p.patient_admissions?.rooms?.room_number ?? "—"}
                          </p>
                          <p className="text-xs text-ink-mute">
                            {p.patient_admissions?.rooms?.ward_name ?? "—"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "chip",
                              p.role === "MAIN_DOCTOR"
                                ? "bg-brand-50 text-brand-700"
                                : "bg-violet-50 text-violet-700"
                            )}
                          >
                            {p.role === "MAIN_DOCTOR" ? "DPJP" : "Konsulen"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <aside>
            <h2 className="eyebrow mb-4">My practice schedule</h2>
            <div className="card p-5">
              {loading ? (
                <Loading label="Loading schedule…" />
              ) : schedules.length === 0 ? (
                <EmptyState icon={CalendarClock} title="No practice schedule yet" />
              ) : (
                <ul className="space-y-3">
                  {schedules.map((s) => (
                    <li
                      key={s.id}
                      className="flex gap-3.5 border-b border-line pb-3 last:border-0 last:pb-0"
                    >
                      <span className="grid h-12 w-12 shrink-0 place-content-center rounded-2xl bg-brand-50 text-center text-brand-700">
                        {s.day_of_week !== null ? (
                          <span className="text-[11px] font-extrabold">
                            {DAYS[s.day_of_week].slice(0, 3)}
                          </span>
                        ) : (
                          <>
                            <span className="tabular text-sm font-extrabold leading-none">
                              {s.specific_date?.split("-")[2]}
                            </span>
                            <span className="mt-0.5 text-[9px] font-bold uppercase leading-none">
                              {s.specific_date
                                ? new Date(s.specific_date).toLocaleString("en-US", { month: "short" })
                                : ""}
                            </span>
                          </>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="tabular text-sm font-extrabold text-ink">
                          {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                        </p>
                        <p className="truncate text-xs text-ink-soft">{s.location || "No location set"}</p>
                        {s.status !== "ACTIVE" && (
                          <span className="chip mt-1 bg-amber-50 text-amber-700">{s.status}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
