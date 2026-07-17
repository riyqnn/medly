import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BellRing,
  Stethoscope,
  UtensilsCrossed,
  GraduationCap,
  Clapperboard,
  HeartPulse,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";
import { getBedsideSession } from "@/src/features/patient/utils/session";
import { cn } from "@/src/lib/utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

const firstName = (name?: string | null) => (name ?? "").split(/\s+/)[0] || "Bapak/Ibu";

export default async function PatientHomePage({
  params,
}: {
  params: Promise<{ admissionId: string }>;
}) {
  const { admissionId } = await params;
  const session = await getBedsideSession(admissionId);
  if (!session) notFound();

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [{ data: next }, { data: recovery }] = await Promise.all([
    supabaseAdmin
      .from("treatment_schedules")
      .select("title, scheduled_time")
      .eq("admission_id", session.admission_id)
      .gte("scheduled_time", new Date().toISOString())
      .lt("scheduled_time", dayEnd.toISOString())
      .is("deleted_at", null)
      .neq("status", "CANCELLED")
      .order("scheduled_time", { ascending: true })
      .limit(1),
    supabaseAdmin
      .from("recovery_progress")
      .select("estimated_total_days, current_day")
      .eq("admission_id", session.admission_id)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  const base = `/patient/${session.admission_id}`;
  const doctor = session.doctors.find((d) => d.role === "MAIN_DOCTOR") ?? session.doctors[0];
  const currentDay = recovery?.current_day ?? session.day_of_stay;
  const upcoming = next?.[0];

  const tiles: { href: string; label: string; icon: LucideIcon; primary?: boolean }[] = [
    { href: `${base}/nurse-call`, label: "Panggil Perawat", icon: BellRing, primary: true },
    { href: `${base}/medical-info`, label: "Info Medis", icon: Stethoscope },
    { href: `${base}/meals`, label: "Makanan", icon: UtensilsCrossed },
    { href: `${base}/entertainment`, label: "Hiburan", icon: Clapperboard },
    { href: `${base}/education`, label: "Edukasi", icon: GraduationCap },
    { href: `${base}/recovery`, label: "Pemulihan", icon: HeartPulse },
    ...(session.hospital?.spiritual_support_enabled
      ? [{ href: `${base}/spiritual`, label: "Kerohanian", icon: Sparkles }]
      : []),
  ];

  return (
    <>
      {/* General info, kept to one glanceable line per fact. */}
      <div className="mb-4 flex shrink-0 flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {greeting()}, {firstName(session.patient?.full_name)}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Fact label="Hari rawat" value={`Hari ke-${currentDay}`} />
          {doctor && <Fact label="Dokter" value={doctor.full_name} />}
          {session.primary_diagnosis && <Fact label="Diagnosa" value={session.primary_diagnosis} />}
          {upcoming && (
            <Fact
              label="Berikutnya"
              value={`${new Date(upcoming.scheduled_time).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })} · ${upcoming.title}`}
              accent
            />
          )}
        </div>
      </div>

      {/* Rows share whatever height is left, so the grid always fits. Columns
          follow the tile count so the last row is never half empty. */}
      <div
        className={cn(
          "grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-3 sm:gap-4",
          tiles.length > 6 ? "sm:grid-cols-3 xl:grid-cols-4" : "sm:grid-cols-3"
        )}
      >
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className={cn(
              "group flex min-h-0 flex-col items-center justify-center gap-3 rounded-3xl border p-3 text-center transition duration-200 active:scale-[0.98]",
              tile.primary
                ? "border-brand-500 bg-brand-500 text-white shadow-lift hover:bg-brand-600"
                : "border-line bg-white text-ink shadow-card hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
            )}
          >
            <span
              className={cn(
                "grid h-16 w-16 shrink-0 place-items-center rounded-2xl transition-transform duration-200 group-hover:scale-105 sm:h-20 sm:w-20",
                tile.primary ? "bg-white/20 text-white" : "bg-brand-50 text-brand-600"
              )}
            >
              <tile.icon className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={2} />
            </span>
            <span className="text-lg font-extrabold leading-tight sm:text-xl">{tile.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}

function Fact({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-2",
        accent ? "border-brand-200 bg-brand-50" : "border-line bg-white"
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">{label}</p>
      <p className={cn("max-w-[16rem] truncate text-sm font-extrabold", accent ? "text-brand-700" : "text-ink")}>
        {value}
      </p>
    </div>
  );
}
