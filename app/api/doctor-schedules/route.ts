import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";

async function getHospitalId(req: NextRequest, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.hospital_id ?? req.headers.get("x-hospital-id");
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const doctorId = searchParams.get("doctor_id");

  let query = supabase
    .from("doctor_schedules")
    .select(`
      *,
      doctors ( full_name, specialization )
    `)
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("day_of_week", { ascending: true })
    .order("specific_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (doctorId) {
    query = query.eq("doctor_id", doctorId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Either day_of_week (0-6) OR specific_date is required
    if (body.day_of_week === undefined && !body.specific_date) {
        return NextResponse.json({ error: "Must provide either day_of_week or specific_date" }, { status: 422 });
    }

    const { data, error } = await supabase.from("doctor_schedules").insert({
      hospital_id: hospitalId,
      doctor_id: body.doctor_id,
      day_of_week: body.day_of_week ?? null,
      specific_date: body.specific_date || null,
      start_time: body.start_time,
      end_time: body.end_time,
      location: body.location || null,
      status: body.status || "ACTIVE",
      created_by: user?.id,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) { 
    return NextResponse.json({ error: e.message }, { status: 400 }); 
  }
}
