import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";

async function getHospitalId(req: NextRequest, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.hospital_id ?? req.headers.get("x-hospital-id");
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.recovery_progress_id || !body.title) {
      return NextResponse.json({ error: "Missing recovery_progress_id or title" }, { status: 422 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("recovery_checklist_items")
      .insert({
        hospital_id: hospitalId,
        recovery_progress_id: body.recovery_progress_id,
        title: body.title,
        target_date: body.target_date || null,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
