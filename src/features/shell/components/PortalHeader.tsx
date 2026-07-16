import { BrandMark } from "@/src/features/shell/components/Brand";
import { LogoutButton } from "@/src/features/auth/components/LogoutButton";

/** Header for the doctor and nurse portals, which have no sidebar. */
export function PortalHeader({ role, title, subtitle }: { role: string; title: string; subtitle: string }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3.5">
          <BrandMark className="h-10 w-10" />
          <div>
            <p className="eyebrow">{role}</p>
            <h1 className="text-xl font-extrabold tracking-tight text-ink">{title}</h1>
            <p className="text-xs text-ink-soft">{subtitle}</p>
          </div>
        </div>
        <div className="w-28">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
