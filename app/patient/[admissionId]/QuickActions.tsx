"use client";

import { useState } from "react";
import { BellRing, Frown, GlassWater, Blinds, Check, type LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";

/* The four things patients reach for most. "Nyeri" is the only tile that
   isn't brand-green: it posts as HIGH priority, so the colour is carrying
   that meaning rather than decorating the grid. */
const TILES: { category: string; label: string; icon: LucideIcon; urgent?: boolean }[] = [
  { category: "CALL_NURSE", label: "Panggil Perawat", icon: BellRing },
  { category: "PAIN", label: "Nyeri", icon: Frown, urgent: true },
  { category: "DRINKING_WATER", label: "Air Minum", icon: GlassWater },
  { category: "EXTRA_BLANKET", label: "Selimut", icon: Blinds },
];

export default function QuickActions({ admissionId }: { admissionId: string }) {
  const [pending, setPending] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  async function send(category: string) {
    setPending(category);
    const res = await fetch("/api/patient/nurse-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admission_id: admissionId, request_category: category }),
    });
    setPending(null);
    if (res.ok) {
      setSent(category);
      setTimeout(() => setSent(null), 2600);
    } else {
      alert("Permintaan gagal terkirim. Coba lagi atau tekan tombol panggil perawat.");
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {TILES.map((tile) => {
        const isSent = sent === tile.category;
        const isPending = pending === tile.category;
        const Icon = isSent ? Check : tile.icon;
        return (
          <button
            key={tile.category}
            onClick={() => send(tile.category)}
            disabled={isPending || isSent}
            className={cn(
              "group card flex flex-col items-center justify-center gap-3 px-3 py-7 transition duration-200",
              "hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift active:scale-[0.98]",
              isSent && "border-brand-300 bg-brand-50"
            )}
          >
            <span
              className={cn(
                "grid h-14 w-14 place-items-center rounded-2xl transition-transform duration-200 group-hover:scale-105",
                isSent
                  ? "bg-brand-500 text-white"
                  : tile.urgent
                    ? "bg-red-50 text-red-500"
                    : "bg-brand-50 text-brand-600"
              )}
            >
              <Icon className={cn("h-7 w-7", isPending && "animate-pulse")} strokeWidth={1.9} />
            </span>
            <span className="text-center text-sm font-extrabold leading-tight text-ink">
              {isSent ? "Terkirim" : tile.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
