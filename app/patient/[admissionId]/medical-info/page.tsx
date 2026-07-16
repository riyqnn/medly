"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Activity, HeartPulse, Thermometer, Wind } from "lucide-react";
import { BedsideHeader, BedsideCard, BedsideEmpty, BedsideLoading } from "../PatientPage";
import { TREATMENT_CATEGORIES, TREATMENT_STATUS } from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface Session {
  patient: { full_name: string } | null;
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

  if (loading) return <BedsideLoading />;

  const latest = vitals[0];
  const doctor = session?.doctors.find((d) => d.role === "MAIN_DOCTOR") ?? session?.doctors[0];

  const facts = [
    { label: "Dokter", value: doctor?.full_name ?? "—", sub: doctor?.specialization ?? undefined },
    { label: "Diagnosa utama", value: session?.primary_diagnosis ?? "—" },
    {
      label: "Kamar",
      value: session?.room?.room_number ?? "—",
      sub: session?.room?.ward_name ?? undefined,
    },
    { label: "Hari rawat", value: `Hari ke-${session?.day_of_stay ?? 1}` },
  ];

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
        {
          icon: Thermometer,
          label: "Suhu",
          value: latest.temperature_celsius ?? "—",
          unit: "°C",
        },
        { icon: Wind, label: "Saturasi oksigen", value: latest.oxygen_saturation ?? "—", unit: "%" },
      ]
    : [];

  /* Group the timeline by day so a long stay stays readable. */
  const grouped = schedules.reduce<Record<string, Schedule[]>>((acc, s) => {
    const key = new Date(s.scheduled_time).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    (acc[key] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <BedsideHeader title="Info Medis & Jadwal" description="Ringkasan kondisi dan rencana perawatan Anda." />

      <BedsideCard title="Informasi medis">
        <dl className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-xs font-semibold text-ink-mute">{f.label}</dt>
              <dd className="mt-1 text-[15px] font-extrabold leading-snug text-ink">{f.value}</dd>
              {f.sub && <p className="text-xs text-ink-mute">{f.sub}</p>}
            </div>
          ))}
        </dl>
      </BedsideCard>

      <BedsideCard
        title="Vital sign terakhir"
        action={
          latest ? (
            <span className="tabular text-[11px] font-semibold text-ink-mute">
              diukur{" "}
              {new Date(latest.measured_at).toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : null
        }
      >
        {!latest ? (
          <BedsideEmpty>Belum ada pengukuran vital sign.</BedsideEmpty>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {readings.map((r) => (
              <div key={r.label} className="rounded-2xl bg-canvas p-4">
                <span className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-white text-brand-600 shadow-card">
                  <r.icon className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <p className="tabular text-2xl font-extrabold tracking-tight text-ink">
                  {r.value}
                  <span className="ml-1 text-xs font-bold text-ink-mute">{r.unit}</span>
                </p>
                <p className="mt-0.5 text-xs font-semibold text-ink-soft">{r.label}</p>
              </div>
            ))}
          </div>
        )}
      </BedsideCard>

      <BedsideCard title="Jadwal perawatan">
        {schedules.length === 0 ? (
          <BedsideEmpty>Belum ada jadwal perawatan.</BedsideEmpty>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([day, items]) => (
              <div key={day}>
                <p className="mb-3 text-xs font-extrabold capitalize text-ink-soft">{day}</p>
                {/* Timeline: the rail is the day, each node is a treatment on it. */}
                <ol className="relative space-y-3 border-l border-line pl-5">
                  {items.map((s) => {
                    const cat = TREATMENT_CATEGORIES[s.category];
                    const st = TREATMENT_STATUS[s.status];
                    return (
                      <li key={s.id} className="relative">
                        <span
                          className={cn(
                            "absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white",
                            cat?.tone.strong
                          )}
                          aria-hidden="true"
                        />
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="tabular text-xs font-bold text-ink-mute">
                              {new Date(s.scheduled_time).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {" · "}
                              {cat?.label ?? s.category}
                            </p>
                            <p
                              className={cn(
                                "text-[15px] font-extrabold text-ink",
                                s.status === "CANCELLED" && "text-ink-mute line-through"
                              )}
                            >
                              {s.title}
                            </p>
                            {s.description && <p className="mt-0.5 text-sm text-ink-soft">{s.description}</p>}
                            {s.doctors?.full_name && (
                              <p className="mt-0.5 text-xs text-ink-mute">{s.doctors.full_name}</p>
                            )}
                          </div>
                          <span className={cn("chip", st?.chip)}>{st?.label ?? s.status}</span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        )}
      </BedsideCard>
    </div>
  );
}
