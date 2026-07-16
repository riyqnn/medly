import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";

async function getHospitalId(req: NextRequest, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.hospital_id ?? req.headers.get("x-hospital-id");
}

// GET ?admission_id= -> progress row + checklist items
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admissionId = req.nextUrl.searchParams.get("admission_id");
  if (!admissionId) return NextResponse.json({ error: "Missing admission_id" }, { status: 422 });

  const { data: progress, error } = await supabase
    .from("recovery_progress")
    .select("*, recovery_checklist_items ( * )")
    .eq("hospital_id", hospitalId)
    .eq("admission_id", admissionId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(progress);
}

// POST: create the progress row for an admission (one per admission)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.admission_id) return NextResponse.json({ error: "Missing admission_id" }, { status: 422 });

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("recovery_progress")
      .insert({
        hospital_id: hospitalId,
        admission_id: body.admission_id,
        estimated_total_days: body.estimated_total_days || null,
        current_day: body.current_day || 1,
        notes: body.notes || null,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Recovery progress already exists for this admission" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
