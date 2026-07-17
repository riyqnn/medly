import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's hospital_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("hospital_id")
    .eq("id", user.id)
    .single();

  if (!profile?.hospital_id) {
    return NextResponse.json({ error: "No hospital associated with this account" }, { status: 400 });
  }

  // Fetch all nurses for this hospital
  const { data: nurses, error } = await supabase
    .from("profiles")
    .select("id, full_name, created_at")
    .eq("hospital_id", profile.hospital_id)
    .eq("role", "NURSE")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(nurses);
}
