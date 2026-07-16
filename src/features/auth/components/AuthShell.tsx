import Link from "next/link";
import { BrandMark } from "@/src/features/shell/components/Brand";

/**
 * Two panels: the form on white, and a green field that says what the product
 * is. The field is the only branded surface in the auth flow, so it carries
 * the whole story rather than sprinkling it across both sides.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  pitch,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  pitch: { heading: string; body: string; points: string[] };
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          <Link href="/" className="mb-9 inline-flex items-center gap-2.5">
            <BrandMark className="h-9 w-9" />
            <span className="text-lg font-extrabold tracking-tight text-ink">Medly</span>
          </Link>

          <h1 className="text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-7 text-sm text-ink-soft">{footer}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 lg:block">
        {/* Soft light behind the copy, not a texture for its own sake. */}
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-brand-300/20 blur-3xl" />

        <div className="relative flex h-full flex-col justify-center px-14 py-16 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-100">
            Digital bedside companion
          </p>
          <h2 className="mt-4 max-w-md text-4xl font-extrabold leading-[1.15] tracking-tight">
            {pitch.heading}
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-brand-50/90">{pitch.body}</p>

          <ul className="mt-9 space-y-3.5">
            {pitch.points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm font-semibold text-brand-50">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                    <path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
