import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";
import { getActiveAdmissionContext } from "@/src/features/patient/utils/session";

export async function GET(req: NextRequest) {
  const admissionId = req.nextUrl.searchParams.get("admission_id");
  const ctx = await getActiveAdmissionContext(admissionId);
  if (!ctx) {
    return NextResponse.json({ error: "Admission not found or not active" }, { status: 404 });
  }

  const { data: menus, error } = await supabaseAdmin
    .from("meal_menus")
    .select("*, meal_categories ( name )")
    .eq("hospital_id", ctx.hospitalId)
    .eq("is_available", true)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(menus);
}
