import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CreateStaffForm } from "@/src/features/auth/components/CreateStaffForm";
import { PageShell } from "@/src/features/shell/components/Page";

export default function CreateStaffPage() {
  return (
    <PageShell className="max-w-lg">
      <Link
        href="/dashboard/hospital/staff"
        className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-ink-soft transition hover:text-brand-600"
      >
        <ChevronLeft className="h-4 w-4" /> Semua staf
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Tambah staf</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Akun langsung aktif — bagikan email dan kata sandinya ke staf yang bersangkutan.
      </p>

      <div className="card mt-6 p-6">
        <CreateStaffForm />
      </div>
    </PageShell>
  );
}
