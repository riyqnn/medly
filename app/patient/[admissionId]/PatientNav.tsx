"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Home, Stethoscope, UtensilsCrossed, Clapperboard, GraduationCap, BellRing, type LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean };

/**
 * The bar carries the five places a patient returns to. Everything else
 * (pemulihan, kerohanian) is reachable from the home tiles — a bedside bar
 * with eight targets is a menu, not a shortcut.
 */
export default function PatientNav({ admissionId }: { admissionId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [calling, setCalling] = useState(false);
  const [called, setCalled] = useState(false);
  const base = `/patient/${admissionId}`;

  const items: Item[] = [
    { href: base, label: "Beranda", icon: Home, exact: true },
    { href: `${base}/medical-info`, label: "Info Medis", icon: Stethoscope },
    { href: `${base}/meals`, label: "Makanan", icon: UtensilsCrossed },
    { href: `${base}/entertainment`, label: "Hiburan", icon: Clapperboard },
    { href: `${base}/education`, label: "Edukasi", icon: GraduationCap },
  ];

  /* The one action that must work from any screen without navigating first. */
  async function callNurse() {
    setCalling(true);
    const res = await fetch("/api/patient/nurse-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admission_id: admissionId, request_category: "CALL_NURSE" }),
    });
    setCalling(false);
    if (res.ok) {
      setCalled(true);
      setTimeout(() => setCalled(false), 2600);
      router.refresh();
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-4">
      <nav className="pointer-events-auto flex items-center gap-1 rounded-full border border-line bg-white/90 p-1.5 shadow-float backdrop-blur-xl">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-200",
                active
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                  : "text-ink-soft hover:bg-brand-50 hover:text-brand-700"
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
              <span className={cn("hidden sm:inline", active && "sm:inline")}>{item.label}</span>
            </Link>
          );
        })}

        <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />

        <button
          onClick={callNurse}
          disabled={calling || called}
          className={cn(
            "relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-200 active:scale-[0.97]",
            called
              ? "bg-brand-50 text-brand-700"
              : "bg-ink text-white hover:bg-brand-600 disabled:opacity-70"
          )}
        >
          <BellRing
            className={cn("h-[18px] w-[18px] transition-transform", calling && "animate-pulse")}
            strokeWidth={2.2}
          />
          <span>{called ? "Perawat dipanggil" : calling ? "Mengirim…" : "Panggil Perawat"}</span>
        </button>
      </nav>
    </div>
  );
}
