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
  const specialization = searchParams.get("specialization");

  let query = supabase
    .from("doctors")
    .select("*")
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (specialization) {
    query = query.eq("specialization", specialization);
  }

  const { data: doctors, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(doctors);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    if (!body.full_name || !body.employee_code) {
      return NextResponse.json({ error: "Missing full_name or employee_code" }, { status: 422 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data: doctor, error } = await supabase
      .from("doctors")
      .insert({
        hospital_id: hospitalId,
        employee_code: body.employee_code,
        full_name: body.full_name,
        specialization: body.specialization || null,
        str_number: body.str_number || null,
        sip_number: body.sip_number || null,
        created_by: user?.id || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { 
        return NextResponse.json({ error: "Duplicate Employee Code for this hospital" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(doctor, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
