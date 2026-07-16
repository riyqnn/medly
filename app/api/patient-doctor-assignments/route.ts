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
  const doctorId = searchParams.get("doctor_id");

  let query = supabase
    .from("patient_doctor_assignments")
    .select(`
      *,
      doctors ( full_name, specialization ),
      patient_admissions ( 
        id, 
        patients ( full_name, mrn ),
        rooms ( room_number, ward_name )
      )
    `)
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (admissionId) {
    query = query.eq("admission_id", admissionId);
  }
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
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    if (!body.admission_id || !body.doctor_id) {
      return NextResponse.json({ error: "Missing admission_id or doctor_id" }, { status: 422 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data: assignment, error } = await supabase
      .from("patient_doctor_assignments")
      .insert({
        hospital_id: hospitalId,
        admission_id: body.admission_id,
        doctor_id: body.doctor_id,
        role: body.role || "MAIN_DOCTOR",
        created_by: user?.id || null
      })
      .select(`
        *,
        doctors ( id, full_name, specialization )
      `)
      .single();

    if (error) {
      if (error.code === '23505') { 
        return NextResponse.json({ error: "Doctor is already assigned to this admission" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(assignment, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
