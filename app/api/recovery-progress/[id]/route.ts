import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";

async function getHospitalId(req: NextRequest, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.hospital_id ?? req.headers.get("x-hospital-id");
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const allowed = ["estimated_total_days", "current_day", "notes"];
    const updates: any = { updated_at: new Date().toISOString() };
    allowed.forEach((k) => { if (body[k] !== undefined) updates[k] = body[k]; });

    const { data, error } = await supabase
      .from("recovery_progress")
      .update(updates)
      .eq("id", id)
      .eq("hospital_id", hospitalId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
