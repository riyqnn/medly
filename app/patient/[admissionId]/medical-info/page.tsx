"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Activity, HeartPulse, Thermometer, Wind } from "lucide-react";
import { BedsideTitle, Pager } from "../PatientShell";
import { TREATMENT_CATEGORIES, TREATMENT_STATUS } from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface Session {
  primary_diagnosis: string | null;
  day_of_stay: number;
  room: { room_number: string } | null;
  doctors: { role: string; full_name: string; specialization: string | null }[];
}
interface Schedule {
  id: string;
  category: string;
  title: string;
  scheduled_time: string;
  status: string;
}
interface Vital {
  measured_at: string;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  temperature_celsius: number | null;
  oxygen_saturation: number | null;
}

export default function MedicalInfoPage() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, t, v] = await Promise.all([
        fetch(`/api/patient/session/${admissionId}`),
        fetch(`/api/patient/treatment-schedules?admission_id=${admissionId}`),
        fetch(`/api/patient/vitals?admission_id=${admissionId}`),
      ]);
      if (s.ok) setSession(await s.json());
      if (t.ok) setSchedules(await t.json());
      if (v.ok) setVitals(await v.json());
      setLoading(false);
    })();
  }, [admissionId]);

  if (loading) return <div className="grid flex-1 place-items-center text-xl font-bold text-ink-mute">Loading…</div>;

  const latest = vitals[0];
  const doctor = session?.doctors.find((d) => d.role === "MAIN_DOCTOR") ?? session?.doctors[0];

  // Upcoming first: what's already done is not what the patient is waiting for.
  const now = Date.now();
  const upcoming = schedules
    .filter((s) => s.status !== "CANCELLED" && +new Date(s.scheduled_time) >= now - 3600_000)
    .sort((a, b) => +new Date(a.scheduled_time) - +new Date(b.scheduled_time));

  const readings = latest
    ? [
        {
          icon: Activity,
          label: "Tekanan darah",
          value:
            latest.blood_pressure_systolic && latest.blood_pressure_diastolic
              ? `${latest.blood_pressure_systolic}/${latest.blood_pressure_diastolic}`
              : "—",
          unit: "mmHg",
        },
        { icon: HeartPulse, label: "Nadi", value: latest.heart_rate ?? "—", unit: "bpm" },
        { icon: Thermometer, label: "Suhu", value: latest.temperature_celsius ?? "—", unit: "°C" },
        { icon: Wind, label: "Oksigen", value: latest.oxygen_saturation ?? "—", unit: "%" },
      ]
    : [];

  return (
    <>
      <BedsideTitle>Medical Info</BedsideTitle>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* Left: the facts */}
        <div className="flex min-h-0 flex-col gap-4">
          <div className="grid shrink-0 grid-cols-2 gap-3">
            <Fact label="Doctors" value={doctor?.full_name ?? "—"} sub={doctor?.specialization ?? undefined} />
            <Fact label="Diagnosis" value={session?.primary_diagnosis ?? "—"} />
            <Fact label="Rooms" value={session?.room?.room_number ?? "—"} />
            <Fact label="Day of stay" value={`Day ${session?.day_of_stay ?? 1}`} />
          </div>

          <div className="flex min-h-0 flex-1 flex-col rounded-3xl border border-line bg-white p-5 shadow-card">
            <p className="mb-3 shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-ink-mute">
              Vital sign terakhir
            </p>
            {!latest ? (
              <div className="grid flex-1 place-items-center">
                <p className="text-lg font-bold text-ink-mute">No measurements yet</p>
              </div>
            ) : (
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
                {readings.map((r) => (
                  <div key={r.label} className="flex min-h-0 flex-col justify-center rounded-2xl bg-canvas p-3">
                    <r.icon className="mb-1 h-5 w-5 shrink-0 text-brand-600" strokeWidth={2.2} />
                    <p className="tabular truncate text-2xl font-extrabold tracking-tight text-ink">
                      {r.value}
                      <span className="ml-1 text-xs font-bold text-ink-mute">{r.unit}</span>
                    </p>
                    <p className="truncate text-xs font-bold text-ink-soft">{r.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: what happens next */}
        <div className="flex min-h-0 flex-col rounded-3xl border border-line bg-white p-5 shadow-card">
          <p className="mb-3 shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-ink-mute">
            Treatment schedule
          </p>
          <Pager
            items={upcoming}
            perPage={4}
            className="grid-cols-1 grid-rows-4"
            empty="Nothing coming up"
            render={(s) => {
              const cat = TREATMENT_CATEGORIES[s.category];
              const st = TREATMENT_STATUS[s.status];
              return (
                <div
                  key={s.id}
                  className="relative flex min-h-0 items-center gap-4 overflow-hidden rounded-2xl border border-line px-4"
                >
                  <span className={cn("absolute inset-y-0 left-0 w-1.5", cat?.tone.strong)} />
                  <div className="tabular w-16 shrink-0 pl-2 text-xl font-extrabold text-ink">
                    {new Date(s.scheduled_time).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-extrabold leading-tight text-ink">{s.title}</p>
                    <p className="truncate text-sm font-semibold text-ink-mute">
                      {new Date(s.scheduled_time).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short" })}
                      {" · "}
                      {cat?.label}
                    </p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold", st?.chip)}>
                    {st?.label}
                  </span>
                </div>
              );
            }}
          />
        </div>
      </div>
    </>
  );
}

function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">{label}</p>
      <p className="mt-0.5 truncate text-lg font-extrabold leading-tight text-ink">{value}</p>
      {sub && <p className="truncate text-xs text-ink-mute">{sub}</p>}
    </div>
  );
}
