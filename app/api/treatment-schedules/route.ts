import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";

async function getHospitalId(req: NextRequest, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.user_metadata?.hospital_id) {
    return user.user_metadata.hospital_id;
  }
  return req.headers.get("x-hospital-id");
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const admissionId = searchParams.get("admission_id");
  const date = searchParams.get("date"); // YYYY-MM-DD
  // Absolute ISO instants. Callers rendering a calendar send these instead of
  // `date`, because a day boundary only means something in the viewer's
  // timezone — deriving it from a bare date here would silently use UTC.
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("treatment_schedules")
    .select(`
      *,
      doctors ( id, full_name, specialization ),
      patient_admissions!inner ( id, patient_id, patients ( full_name, mrn ), rooms ( room_number ) )
    `)
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("scheduled_time", { ascending: true });

  if (admissionId) {
    query = query.eq("admission_id", admissionId);
  }
  if (from && to) {
    query = query.gte("scheduled_time", from).lte("scheduled_time", to);
  } else if (date) {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    query = query.gte("scheduled_time", startOfDay.toISOString())
                 .lte("scheduled_time", endOfDay.toISOString());
  }

  const { data: schedules, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    if (!body.admission_id || !body.category || !body.title || !body.scheduled_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 422 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data: schedule, error } = await supabase
      .from("treatment_schedules")
      .insert({
        hospital_id: hospitalId,
        admission_id: body.admission_id,
        category: body.category,
        title: body.title,
        description: body.description || null,
        scheduled_time: body.scheduled_time,
        status: body.status || "SCHEDULED",
        related_doctor_id: body.related_doctor_id || null,
        created_by: user?.id || null
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Example: If integrated with Medly Client, send a WebSocket push notification here

    return NextResponse.json(schedule, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
