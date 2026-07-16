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
  const status = searchParams.get("status");
  const patientId = searchParams.get("patient_id");

  let query = supabase
    .from("patient_admissions")
    .select(`
      *,
      patients!inner ( id, full_name, mrn ),
      rooms ( id, room_number, ward_name )
    `)
    .eq("hospital_id", hospitalId)
    .order("admission_date", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }
  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  const { data: admissions, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(admissions);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    if (!body.patient_id) {
      return NextResponse.json({ error: "Missing patient_id" }, { status: 422 });
    }

    // Optional: check if room is full before assignment
    if (body.room_id) {
      const { data: activeAdmissions, error: countError } = await supabase
        .from("patient_admissions")
        .select("id")
        .eq("hospital_id", hospitalId)
        .eq("room_id", body.room_id)
        .eq("status", "ACTIVE");
        
      if (countError) {
        return NextResponse.json({ error: countError.message }, { status: 500 });
      }

      const { data: roomInfo } = await supabase
        .from("rooms")
        .select("capacity")
        .eq("id", body.room_id)
        .single();
        
      if (roomInfo && activeAdmissions && activeAdmissions.length >= roomInfo.capacity) {
         return NextResponse.json({ error: "Room is currently full" }, { status: 409 });
      }
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data: admission, error } = await supabase
      .from("patient_admissions")
      .insert({
        hospital_id: hospitalId,
        patient_id: body.patient_id,
        room_id: body.room_id || null,
        status: body.status || "ACTIVE",
        created_by: user?.id || null
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(admission, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
