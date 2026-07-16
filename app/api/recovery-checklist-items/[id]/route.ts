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
    const updates: any = { updated_at: new Date().toISOString() };
    if (body.is_done !== undefined) {
      updates.is_done = body.is_done;
      updates.done_at = body.is_done ? new Date().toISOString() : null;
    }
    if (body.title !== undefined) updates.title = body.title;
    if (body.target_date !== undefined) updates.target_date = body.target_date;

    const { data, error } = await supabase
      .from("recovery_checklist_items")
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("recovery_checklist_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("hospital_id", hospitalId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
