import Link from "next/link";
import { IdCard, Stethoscope, HeartPulse, AlertTriangle } from "lucide-react";
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

  const hospitalId = adminProfile?.hospital_id;

  const [{ data: staff }, { data: doctors }, { data: nurses }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, role, created_at")
      .eq("hospital_id", hospitalId)
      .in("role", ["DOCTOR", "NURSE"])
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("doctors").select("profile_id").eq("hospital_id", hospitalId).is("deleted_at", null),
    supabaseAdmin.from("nurses").select("profile_id").eq("hospital_id", hospitalId).is("deleted_at", null),
  ]);

  // An account with no staff record behind it can sign in but sees nothing,
  // so it's worth surfacing rather than leaving it to be discovered in a demo.
  const linkedIds = new Set(
    [...(doctors ?? []), ...(nurses ?? [])].map((r) => r.profile_id).filter(Boolean)
  );
  const unlinked = (staff ?? []).filter((s) => !linkedIds.has(s.id));

  return (
    <PageShell>
      <PageHeader
        eyebrow="System"
        title="Staff Accounts"
        description="Every doctor and nurse account in your hospital."
      />

      {unlinked.length > 0 && (
        <div className="card mb-5 border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-extrabold text-amber-900">
                {unlinked.length} akun belum terhubung ke data staf
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-800">
                {unlinked.map((s) => s.full_name).join(", ")} bisa masuk, tetapi portalnya kosong —
                permintaan pasien tidak akan tercatat atas nama mereka. Buka{" "}
                <Link href="/dashboard/hospital/doctors" className="font-bold underline">
                  Doctors
                </Link>{" "}
                atau{" "}
                <Link href="/dashboard/hospital/nurses" className="font-bold underline">
                  Nurses
                </Link>{" "}
                then use “Create login” on the matching record.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {!staff || staff.length === 0 ? (
          <EmptyState
            icon={IdCard}
            title="No staff accounts yet"
            hint="Accounts are created at the same time you add a doctor or nurse."
            action={
              <div className="flex gap-2">
                <Link href="/dashboard/hospital/doctors" className="btn-primary">
                  <Stethoscope className="h-4 w-4" /> Add doctor
                </Link>
                <Link href="/dashboard/hospital/nurses" className="btn-ghost">
                  <HeartPulse className="h-4 w-4" /> Add nurse
                </Link>
              </div>
            }
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/60">
                <th className="eyebrow px-6 py-3 font-bold">Name</th>
                <th className="eyebrow px-6 py-3 font-bold">Role</th>
                <th className="eyebrow px-6 py-3 font-bold">Staff member</th>
                <th className="eyebrow px-6 py-3 font-bold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {staff.map((member) => {
                const isLinked = linkedIds.has(member.id);
                return (
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
                        {member.role === "DOCTOR" ? "Doctors" : "Nurses"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("chip", isLinked ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700")}>
                        {isLinked ? "Linked" : "Not linked"}
                      </span>
                    </td>
                    <td className="tabular px-6 py-4 text-ink-soft">
                      {new Date(member.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
