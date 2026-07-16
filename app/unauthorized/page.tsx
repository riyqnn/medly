import Link from "next/link";
import { LogIn } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-6">
      <div className="card w-full max-w-md animate-fade-up p-8 text-center">
        <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <LogIn className="h-5 w-5" strokeWidth={2.1} />
        </span>
        <p className="eyebrow">Error 401</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">Sesi Anda sudah berakhir</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Masuk kembali untuk melanjutkan ke dashboard Medly.
        </p>
        <Link href="/login" className="btn-primary mt-6 w-full">
          Masuk
        </Link>
      </div>
    </div>
  );
}
