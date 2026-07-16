import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";
import { getActiveAdmissionContext } from "@/src/features/patient/utils/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await req.json();
    const ctx = await getActiveAdmissionContext(body.admission_id);
    if (!ctx) {
      return NextResponse.json({ error: "Admission not found or not active" }, { status: 404 });
    }

    // Verify the checklist item actually belongs to this admission's recovery progress
    const { data: item } = await supabaseAdmin
      .from("recovery_checklist_items")
      .select("id, recovery_progress_id, recovery_progress:recovery_progress_id ( admission_id )")
      .eq("id", itemId)
      .single();

    const belongsToAdmission = (item as any)?.recovery_progress?.admission_id === ctx.admissionId;
    if (!item || !belongsToAdmission) {
      return NextResponse.json({ error: "Checklist item not found" }, { status: 404 });
    }

    const isDone = !!body.is_done;
    const { data, error } = await supabaseAdmin
      .from("recovery_checklist_items")
      .update({ is_done: isDone, done_at: isDone ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
      .eq("id", itemId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
