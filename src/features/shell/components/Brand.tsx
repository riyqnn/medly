import Image from "next/image";
import { cn } from "@/src/lib/utils";

/**
 * The Medly mark — an M cradling a heart, with the clinical plus. The asset is
 * already green and transparent, so it sits directly on any surface here
 * rather than being boxed into a tile.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={96}
      height={96}
      priority
      className={cn("object-contain", className)}
    />
  );
}

export function BrandLockup({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2">
      <BrandMark className="h-10 w-10" />
      <div className="min-w-0 leading-none">
        <p className="text-[17px] font-extrabold tracking-tight text-ink">Medly</p>
        {subtitle && <p className="mt-1 truncate text-[11px] font-medium text-ink-mute">{subtitle}</p>}
      </div>
    </div>
  );
}
