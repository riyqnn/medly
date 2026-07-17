"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, type LucideIcon } from "lucide-react";
import { BrandLockup } from "@/src/features/shell/components/Brand";
import { LogoutButton } from "@/src/features/auth/components/LogoutButton";
import { cn } from "@/src/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const SYSTEM: Item[] = [
  { href: "/dashboard/admin", label: "Ringkasan", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/admin/create-hospital", label: "Buat Rumah Sakit", icon: Building2 },
];

function NavLink({ item }: { item: Item }) {
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
    </Link>
  );
}

export function AdminSidebar({ userName }: { userName: string }) {
  return (
    <aside className="sticky top-0 flex h-screen w-[264px] shrink-0 flex-col border-r border-line bg-white">
      <div className="px-5 py-6">
        <BrandLockup subtitle="Super Admin" />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        <div>
          <p className="eyebrow px-4 pb-2">Sistem</p>
          <div className="space-y-0.5">
            {SYSTEM.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-line p-3">
        <div className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-extrabold text-brand-700">
            {userName.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{userName}</p>
            <p className="text-[11px] font-medium text-ink-mute">Super Admin</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
