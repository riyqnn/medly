import Image from "next/image";
import { cn } from "@/src/lib/utils";

/**
 * The Medly mark — an M cradling a heart, with the clinical plus. The asset is
 * already green and transparent, so it sits directly on any surface here
 * rather than being boxed into a tile.
 *
 * Pass `src` to show a hospital's own logo instead. Uploaded logos are
 * arbitrary images on a remote gateway, so they get `unoptimized` and are
 * contained rather than cropped — a wordmark must not lose its edges.
 */
export function BrandMark({ src, alt = "", className }: { src?: string | null; alt?: string; className?: string }) {
  return (
    <Image
      src={src || "/logo.png"}
      alt={alt}
      width={96}
      height={96}
      priority
      unoptimized={!!src}
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

/**
 * Once someone is logged in they're inside their own hospital, not inside
 * Medly — so every signed-in surface leads with the hospital's name and logo.
 * A hospital that hasn't uploaded one falls back to the Medly mark.
 */
export function HospitalLockup({
  name,
  logoUrl,
  subtitle,
}: {
  name: string;
  logoUrl?: string | null;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark src={logoUrl} className="h-10 w-10 shrink-0" />
      <div className="min-w-0 leading-none">
        <p className="truncate text-[15px] font-extrabold tracking-tight text-ink">{name}</p>
        {subtitle && <p className="mt-1 truncate text-[11px] font-medium text-ink-mute">{subtitle}</p>}
      </div>
    </div>
  );
}
