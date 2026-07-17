import { createClient } from "@/src/features/auth/utils/supabase/server";
import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";
import { HospitalSidebar } from "./HospitalSidebar";

export default async function HospitalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, hospitals ( name, logo_url )")
    .eq("id", user?.id ?? "")
    .single();

  const hospitalName = (profile?.hospitals as any)?.name ?? "Rumah Sakit";
  const logoUrl = (profile?.hospitals as any)?.logo_url ?? null;
  const userName = profile?.full_name ?? "Admin";

  return (
    <div className="flex min-h-screen bg-canvas">
      <HospitalSidebar hospitalName={hospitalName} logoUrl={logoUrl} userName={userName} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
