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
    const allowed = ["title", "content_type", "body_text", "media_url", "is_published", "category_id"];
    const updates: any = { updated_at: new Date().toISOString() };
    allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });
    // An empty select is "no category", not an empty UUID.
    if (updates.category_id === "") updates.category_id = null;
    const { data, error } = await supabase.from("education_contents").update(updates)
      .eq("id", id).eq("hospital_id", hospitalId).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await supabase.from("education_contents").update({ deleted_at: new Date().toISOString() })
    .eq("id", id).eq("hospital_id", hospitalId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
