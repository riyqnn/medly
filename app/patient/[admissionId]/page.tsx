import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Stethoscope,
  UtensilsCrossed,
  GraduationCap,
  Clapperboard,
  HeartPulse,
  Sparkles,
  BellRing,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";
import { getBedsideSession } from "@/src/features/patient/utils/session";
import { TREATMENT_CATEGORIES } from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";
import QuickActions from "./QuickActions";

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

/** First name only — the bedside should feel like it knows the person. */
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

  const [{ data: schedules }, { data: recovery }] = await Promise.all([
    supabaseAdmin
      .from("treatment_schedules")
      .select("id, title, category, scheduled_time, status")
      .eq("admission_id", session.admission_id)
      .gte("scheduled_time", dayStart.toISOString())
      .lt("scheduled_time", dayEnd.toISOString())
      .is("deleted_at", null)
      .neq("status", "CANCELLED")
      .order("scheduled_time", { ascending: true }),
    supabaseAdmin
      .from("recovery_progress")
      .select("estimated_total_days, current_day")
      .eq("admission_id", session.admission_id)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  const base = `/patient/${session.admission_id}`;
  const mainDoctor = session.doctors.find((d) => d.role === "MAIN_DOCTOR") ?? session.doctors[0];

  const currentDay = recovery?.current_day ?? session.day_of_stay;
  const totalDays = recovery?.estimated_total_days ?? null;
  const pct = totalDays ? Math.min(100, Math.round((currentDay / totalDays) * 100)) : null;

  const tiles: { href: string; label: string; hint: string; icon: LucideIcon }[] = [
    { href: `${base}/medical-info`, label: "Info Medis & Jadwal", hint: "Dokter, diagnosa, vital sign", icon: Stethoscope },
    { href: `${base}/nurse-call`, label: "Panggil Perawat", hint: "Semua jenis bantuan", icon: BellRing },
    { href: `${base}/meals`, label: "Pesan Makanan", hint: "Menu hari ini & status", icon: UtensilsCrossed },
    { href: `${base}/education`, label: "Edukasi Kesehatan", hint: "Artikel, video, infografik", icon: GraduationCap },
    { href: `${base}/entertainment`, label: "Hiburan", hint: "Film, musik, buku, game", icon: Clapperboard },
    { href: `${base}/recovery`, label: "Progres Pemulihan", hint: "Target & checklist harian", icon: HeartPulse },
    ...(session.hospital?.spiritual_support_enabled
      ? [{ href: `${base}/spiritual`, label: "Kerohanian", hint: "Doa, murottal, renungan", icon: Sparkles }]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
        {/* ── Greeting + today's schedule ── */}
        <section className="card flex flex-col p-7">
          <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-ink">
            {greeting()},
            <br />
            {firstName(session.patient?.full_name)}
          </h1>
          <p className="mt-2 text-sm font-bold text-brand-600">Ini jadwal Anda hari ini</p>

          <div className="mt-5 flex-1 space-y-2.5">
            {!schedules || schedules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center">
                <p className="text-sm font-semibold text-ink-soft">Tidak ada jadwal hari ini</p>
                <p className="mt-1 text-xs text-ink-mute">Istirahat yang cukup, ya.</p>
              </div>
            ) : (
              schedules.map((s) => {
                const cat = TREATMENT_CATEGORIES[s.category];
                const done = s.status === "DONE";
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "relative overflow-hidden rounded-2xl border border-line px-4 py-3 transition",
                      done && "opacity-60"
                    )}
                  >
                    <span className={cn("absolute inset-y-0 left-0 w-1", cat?.tone.strong)} aria-hidden="true" />
                    <p className="tabular text-xs font-bold text-ink-mute">
                      {new Date(s.scheduled_time).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {done && " · selesai"}
                    </p>
                    <p className={cn("text-[15px] font-extrabold text-ink", done && "line-through")}>{s.title}</p>
                  </div>
                );
              })
            )}
          </div>

          <Link
            href={`${base}/medical-info`}
            className="group mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 transition hover:text-brand-700"
          >
            Lihat semua jadwal
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </section>

        {/* ── Quick requests ── */}
        <section>
          <QuickActions admissionId={session.admission_id} />
        </section>

        {/* ── Status rail ── */}
        <aside className="card flex flex-col p-6">
          <p className="eyebrow">Perawatan Anda</p>

          <div className="mt-4">
            <p className="tabular text-4xl font-extrabold tracking-tight text-ink">
              Hari {currentDay}
            </p>
            <p className="mt-1 text-xs font-semibold text-ink-mute">
              {totalDays ? `dari estimasi ${totalDays} hari` : "masa rawat berjalan"}
            </p>
            {pct !== null && (
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-canvas">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-[width] duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] font-bold text-brand-600">{pct}% menuju target</p>
              </div>
            )}
          </div>

          <dl className="mt-6 space-y-4 border-t border-line pt-5">
            <div>
              <dt className="eyebrow">Dokter</dt>
              <dd className="mt-1 text-sm font-bold text-ink">{mainDoctor?.full_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="eyebrow">Diagnosa</dt>
              <dd className="mt-1 text-sm font-bold text-ink">{session.primary_diagnosis ?? "—"}</dd>
            </div>
          </dl>

          <Link href={`${base}/recovery`} className="btn-ghost mt-auto w-full !justify-center pt-2.5">
            Lihat progres
          </Link>
        </aside>
      </div>

      {/* ── Everything else ── */}
      <section>
        <p className="eyebrow mb-3 px-1">Semua layanan</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {tiles.map((tile, i) => (
            <Link
              key={tile.href}
              href={tile.href}
              style={{ animationDelay: `${i * 45}ms` }}
              className="group card flex animate-fade-up items-center gap-4 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition-transform duration-200 group-hover:scale-105">
                <tile.icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold text-ink">{tile.label}</span>
                <span className="block truncate text-xs text-ink-mute">{tile.hint}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
