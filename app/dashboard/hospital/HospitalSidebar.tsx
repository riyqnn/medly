"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  BedDouble,
  Stethoscope,
  HeartPulse,
  BellRing,
  CalendarDays,
  UtensilsCrossed,
  ClipboardList,
  GraduationCap,
  Clapperboard,
  Sparkles,
  IdCard,
  type LucideIcon,
} from "lucide-react";
import { BrandLockup } from "@/src/features/shell/components/Brand";
import { LogoutButton } from "@/src/features/auth/components/LogoutButton";
import { cn } from "@/src/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const CARE: Item[] = [
  { href: "/dashboard/hospital", label: "Ringkasan", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/hospital/patients", label: "Pasien", icon: Users },
  { href: "/dashboard/hospital/rooms", label: "Kamar", icon: BedDouble },
  { href: "/dashboard/hospital/treatments", label: "Jadwal Perawatan", icon: CalendarDays },
  { href: "/dashboard/hospital/requests", label: "Permintaan Perawat", icon: BellRing },
];

const TEAM: Item[] = [
  { href: "/dashboard/hospital/doctors", label: "Dokter", icon: Stethoscope },
  { href: "/dashboard/hospital/nurses", label: "Perawat", icon: HeartPulse },
  { href: "/dashboard/hospital/staff", label: "Akun Staf", icon: IdCard },
];

const SERVICES: Item[] = [
  { href: "/dashboard/hospital/meals", label: "Menu Makanan", icon: UtensilsCrossed },
  { href: "/dashboard/hospital/meal-orders", label: "Pesanan Makanan", icon: ClipboardList },
  { href: "/dashboard/hospital/education", label: "Edukasi", icon: GraduationCap },
  { href: "/dashboard/hospital/entertainment", label: "Hiburan", icon: Clapperboard },
  { href: "/dashboard/hospital/spiritual", label: "Kerohanian", icon: Sparkles },
];

function NavLink({ item, badge }: { item: Item; badge?: number }) {
  const pathname = usePathname();
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl py-2.5 pl-4 pr-3 text-sm font-semibold transition-all duration-200",
        active
          ? "bg-brand-50 text-brand-700"
          : "text-ink-soft hover:translate-x-0.5 hover:bg-brand-50/60 hover:text-ink"
      )}
    >
      {/* Active rail — grows out of the edge rather than blinking on. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-500 transition-transform duration-200 ease-out",
          active ? "scale-y-100" : "scale-y-0"
        )}
      />
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
          active ? "scale-110 text-brand-600" : "text-ink-mute group-hover:text-brand-600"
        )}
        strokeWidth={2.1}
      />
      <span className="truncate">{item.label}</span>
      {badge ? (
        <span className="relative ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-extrabold text-white">
          <span className="absolute inset-0 animate-halo rounded-full bg-brand-500/60" />
          <span className="relative">{badge}</span>
        </span>
      ) : null}
    </Link>
  );
}

function Group({ title, items, badges }: { title: string; items: Item[]; badges?: Record<string, number> }) {
  return (
    <div>
      <p className="eyebrow px-4 pb-2">{title}</p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink key={item.href} item={item} badge={badges?.[item.href]} />
        ))}
      </div>
    </div>
  );
}

export function HospitalSidebar({
  hospitalName,
  userName,
}: {
  hospitalName: string;
  userName: string;
}) {
  const [openRequests, setOpenRequests] = useState(0);

  // The nurse-request queue is the one thing in this dashboard that changes
  // without the admin doing anything, so it's the only badge in the nav.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok || !alive) return;
      const data = await res.json();
      setOpenRequests(data.active_nurse_requests ?? 0);
    };
    load();
    const timer = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <aside className="sticky top-0 flex h-screen w-[264px] shrink-0 flex-col border-r border-line bg-white">
      <div className="px-5 py-6">
        <BrandLockup subtitle={hospitalName} />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        <Group
          title="Perawatan"
          items={CARE}
          badges={{ "/dashboard/hospital/requests": openRequests }}
        />
        <Group title="Tim" items={TEAM} />
        <Group title="Layanan Pasien" items={SERVICES} />
      </nav>

      <div className="border-t border-line p-3">
        <div className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-extrabold text-brand-700">
            {userName.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{userName}</p>
            <p className="text-[11px] font-medium text-ink-mute">Admin rumah sakit</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
