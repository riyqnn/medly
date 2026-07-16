import Link from "next/link";
import { UserPlus, IdCard } from "lucide-react";
import { createClient } from "@/src/features/auth/utils/supabase/server";
import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";
import { PageShell, PageHeader, EmptyState } from "@/src/features/shell/components/Page";
import { cn } from "@/src/lib/utils";

export default async function StaffListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: adminProfile } = await supabaseAdmin
    .from("profiles")
    .select("hospital_id")
    .eq("id", user!.id)
    .single();

  const { data: staff } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("hospital_id", adminProfile?.hospital_id)
    .in("role", ["DOCTOR", "NURSE"])
    .order("created_at", { ascending: false });

  return (
    <PageShell>
      <PageHeader
        eyebrow="Sistem"
        title="Staf"
        description="Akun dokter dan perawat yang bisa masuk ke Medly."
        action={
          <Link href="/dashboard/hospital/staff/create" className="btn-primary">
            <UserPlus className="h-4 w-4" /> Tambah staf
          </Link>
        }
      />

      <div className="card overflow-hidden">
        {!staff || staff.length === 0 ? (
          <EmptyState
            icon={IdCard}
            title="Belum ada akun staf"
            hint="Buat akun untuk dokter dan perawat agar mereka bisa masuk ke portal masing-masing."
            action={
              <Link href="/dashboard/hospital/staff/create" className="btn-primary">
                <UserPlus className="h-4 w-4" /> Tambah staf
              </Link>
            }
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/60">
                <th className="eyebrow px-6 py-3 font-bold">Nama</th>
                <th className="eyebrow px-6 py-3 font-bold">Peran</th>
                <th className="eyebrow px-6 py-3 font-bold">Bergabung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {staff.map((member) => (
                <tr key={member.id} className="transition-colors hover:bg-canvas/70">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-extrabold text-brand-700">
                        {member.full_name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="font-bold text-ink">{member.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "chip",
                        member.role === "DOCTOR" ? "bg-brand-50 text-brand-700" : "bg-sky-50 text-sky-700"
                      )}
                    >
                      {member.role === "DOCTOR" ? "Dokter" : "Perawat"}
                    </span>
                  </td>
                  <td className="tabular px-6 py-4 text-ink-soft">
                    {new Date(member.created_at).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
