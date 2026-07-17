import Link from "next/link";
import { ShieldOff } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-6">
      <div className="card w-full max-w-md animate-fade-up p-8 text-center">
        <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <ShieldOff className="h-5 w-5" strokeWidth={2.1} />
        </span>
        <p className="eyebrow">Error 403</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
          This page isn’t for your role
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Your account can’t open that dashboard. Head back to the one for your role to continue.
        </p>
        <Link href="/dashboard" className="btn-primary mt-6 w-full">
          Back to my dashboard
        </Link>
      </div>
    </div>
  );
}
