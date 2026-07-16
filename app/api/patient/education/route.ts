import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";
import { getActiveAdmissionContext } from "@/src/features/patient/utils/session";

export async function GET(req: NextRequest) {
  const admissionId = req.nextUrl.searchParams.get("admission_id");
  const ctx = await getActiveAdmissionContext(admissionId);
  if (!ctx) {
    return NextResponse.json({ error: "Admission not found or not active" }, { status: 404 });
  }

  const { data: contents, error } = await supabaseAdmin
    .from("education_contents")
    .select("*, education_categories ( name )")
    .or(`hospital_id.eq.${ctx.hospitalId},hospital_id.is.null`)
    .eq("is_published", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(contents);
}
