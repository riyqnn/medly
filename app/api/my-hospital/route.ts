import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";
import { getCaller, denied } from "@/src/features/auth/utils/require";

/**
 * The hospital identity of whoever is logged in — name and logo, nothing more.
 * The doctor and nurse portals are client components and need this to brand
 * their header; they must not go through `/api/hospital-settings`, which is
 * admin-only and returns editable fields.
 */
export async function GET() {
  const caller = await getCaller();
  if (denied(caller)) return NextResponse.json({ error: caller.error }, { status: caller.status });
  if (!caller.hospitalId) return NextResponse.json({ name: null, logo_url: null });

  const { data, error } = await supabaseAdmin
    .from("hospitals")
    .select("name, logo_url")
    .eq("id", caller.hospitalId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
