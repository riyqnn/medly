import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";

async function getHospitalId(req: NextRequest, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.hospital_id ?? req.headers.get("x-hospital-id");
}

// GET all rooms
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("rooms")
    .select("*").eq("hospital_id", hospitalId).is("deleted_at", null).order("room_number");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST create room
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.room_number) return NextResponse.json({ error: "room_number required" }, { status: 422 });
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("rooms").insert({
      hospital_id: hospitalId,
      room_number: body.room_number,
      ward_name: body.ward_name || null,
      capacity: body.capacity || 1,
      status: body.status || "AVAILABLE",
      created_by: user?.id,
    }).select().single();
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Room number already exists" }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
