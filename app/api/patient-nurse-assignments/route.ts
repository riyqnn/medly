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

  const { searchParams } = req.nextUrl;
  const admissionId = searchParams.get("admission_id");
  const nurseId = searchParams.get("nurse_id");

  let query = supabase
    .from("patient_nurse_assignments")
    .select(`
      *,
      nurses ( id, full_name, employee_code ),
      patient_admissions ( id, status, patients ( id, full_name, mrn ), rooms ( room_number, ward_name ) )
    `)
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (admissionId) query = query.eq("admission_id", admissionId);
  if (nurseId) query = query.eq("nurse_id", nurseId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.admission_id || !body.nurse_id) {
      return NextResponse.json({ error: "Missing admission_id or nurse_id" }, { status: 422 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("patient_nurse_assignments")
      .insert({
        hospital_id: hospitalId,
        admission_id: body.admission_id,
        nurse_id: body.nurse_id,
        role: body.role || "PRIMARY_NURSE",
        created_by: user?.id ?? null,
      })
      .select("*, nurses ( id, full_name, employee_code )")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "This nurse is already assigned to that patient" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
