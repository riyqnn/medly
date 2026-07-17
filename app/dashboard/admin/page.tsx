import { PageShell, PageHeader } from "@/src/features/shell/components/Page";
import Link from "next/link";
import { Building2 } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <PageShell>
      <PageHeader 
        title="Admin Dashboard" 
        description="Kelola rumah sakit di ekosistem Medly." 
      />

      <div className="mt-6">
        <div className="card p-6">
          <h2 className="text-lg font-extrabold tracking-tight text-ink">
            Manajemen Rumah Sakit
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Buat akun rumah sakit baru yang mencakup profil rumah sakit dan akun admin pertamanya.
          </p>
          <div className="mt-5">
            <Link href="/dashboard/admin/create-hospital" className="btn-primary inline-flex gap-2">
              <Building2 className="h-4 w-4" />
              Buat Rumah Sakit Baru
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
