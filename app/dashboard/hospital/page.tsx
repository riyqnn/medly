"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, BellRing, CalendarDays, UtensilsCrossed, ArrowRight, type LucideIcon } from "lucide-react";
import { PageShell, PageHeader } from "@/src/features/shell/components/Page";
import { cn } from "@/src/lib/utils";

interface DashboardStats {
  active_patients: number;
  active_nurse_requests: number;
  today_schedules: number;
  today_meal_orders: number;
}

const TILES: {
  key: keyof DashboardStats;
  label: string;
  hint: string;
  icon: LucideIcon;
  href: string;
}[] = [
  {
    key: "active_patients",
    label: "Pasien dirawat",
    hint: "Admisi aktif saat ini",
    icon: Users,
    href: "/dashboard/hospital/patients",
  },
  {
    key: "active_nurse_requests",
    label: "Permintaan terbuka",
    hint: "Belum selesai ditangani",
    icon: BellRing,
    href: "/dashboard/hospital/nurses",
  },
  {
    key: "today_schedules",
    label: "Jadwal hari ini",
    hint: "Visit, obat, lab, tindakan",
    icon: CalendarDays,
    href: "/dashboard/hospital/treatments",
  },
  {
    key: "today_meal_orders",
    label: "Pesanan makanan",
    hint: "Dipesan dari sisi tempat tidur",
    icon: UtensilsCrossed,
    href: "/dashboard/hospital/meal-orders",
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

export default function HospitalDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok && alive) setStats(await res.json());
      if (alive) setLoading(false);
    };
    load();
    const timer = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <PageShell>
      <PageHeader eyebrow={today} title={`${greeting()}.`} description="Ringkasan aktivitas rumah sakit Anda hari ini." />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {TILES.map((tile, i) => {
          const value = stats?.[tile.key] ?? 0;
          const isAlert = tile.key === "active_nurse_requests" && value > 0;
          return (
            <Link
              key={tile.key}
              href={tile.href}
              style={{ animationDelay: `${i * 60}ms` }}
              className="group card animate-fade-up p-6 transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
            >
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-2xl transition-colors",
                    isAlert ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-600"
                  )}
                >
                  <tile.icon className="h-5 w-5" strokeWidth={2.1} />
                </span>
                <ArrowRight className="h-4 w-4 -translate-x-1 text-ink-mute opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
              </div>

              <p className="tabular mt-5 text-4xl font-extrabold tracking-tight text-ink">
                {loading ? <span className="inline-block h-9 w-12 animate-sheen rounded-lg bg-canvas" /> : value}
              </p>
              <p className="mt-1 text-sm font-bold text-ink">{tile.label}</p>
              <p className="mt-0.5 text-xs text-ink-mute">{tile.hint}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="card animate-fade-up p-6 lg:col-span-2" style={{ animationDelay: "240ms" }}>
          <p className="eyebrow mb-3">Alur Medly</p>
          <h2 className="text-lg font-extrabold tracking-tight text-ink">
            Semua yang Anda kelola di sini muncul di tablet pasien.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
            Jadwal, menu, konten edukasi, dan hiburan yang dipublikasikan langsung tampil di layar
            sisi tempat tidur. Sebaliknya, permintaan perawat dan pesanan makanan dari pasien masuk
            ke dashboard ini.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link href="/dashboard/hospital/patients" className="btn-primary">
              Buka daftar pasien
            </Link>
            <Link href="/dashboard/hospital/treatments" className="btn-ghost">
              Atur jadwal perawatan
            </Link>
          </div>
        </div>

        <div className="card animate-fade-up p-6" style={{ animationDelay: "300ms" }}>
          <p className="eyebrow mb-4">Butuh perhatian</p>
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 w-3/4 animate-sheen rounded bg-canvas" />
              <div className="h-4 w-1/2 animate-sheen rounded bg-canvas" />
            </div>
          ) : stats && stats.active_nurse_requests > 0 ? (
            <div>
              <p className="text-sm leading-relaxed text-ink-soft">
                <span className="font-extrabold text-ink">{stats.active_nurse_requests} permintaan</span>{" "}
                dari pasien belum diselesaikan.
              </p>
              <Link href="/dashboard/hospital/nurses" className="btn-primary mt-4 w-full">
                Tangani sekarang
              </Link>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
              </span>
              <p className="text-sm leading-relaxed text-ink-soft">
                Tidak ada permintaan perawat yang tertunda. Semua sudah tertangani.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
