import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";

async function getHospitalId(req: NextRequest, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.hospital_id ?? req.headers.get("x-hospital-id");
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("hospitals")
    .select("id, name, spiritual_support_enabled")
    .eq("id", hospitalId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const updates: any = { updated_at: new Date().toISOString() };
    if (body.spiritual_support_enabled !== undefined) {
      updates.spiritual_support_enabled = !!body.spiritual_support_enabled;
    }

    const { data, error } = await supabase
      .from("hospitals")
      .update(updates)
      .eq("id", hospitalId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
