import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";
import { getActiveAdmissionContext } from "@/src/features/patient/utils/session";

export async function GET(req: NextRequest) {
  const admissionId = req.nextUrl.searchParams.get("admission_id");
  const ctx = await getActiveAdmissionContext(admissionId);
  if (!ctx) {
    return NextResponse.json({ error: "Admission not found or not active" }, { status: 404 });
  }

  const { data: schedules, error } = await supabaseAdmin
    .from("treatment_schedules")
    .select(`*, doctors ( id, full_name, specialization )`)
    .eq("admission_id", ctx.admissionId)
    .is("deleted_at", null)
    .order("scheduled_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(schedules);
}
