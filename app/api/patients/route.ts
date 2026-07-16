import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";

// Middleware helper - get hospital_id securely from session or headers
async function getHospitalId(req: NextRequest, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.user_metadata?.hospital_id) {
    return user.user_metadata.hospital_id;
  }
  // Fallback for development/testing
  return req.headers.get("x-hospital-id");
}

// GET: List pasien
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  const keyword = req.nextUrl.searchParams.get("q") || "";

  let query = supabase
    .from("patients")
    .select("*")
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (keyword) {
    query = query.ilike("full_name", `%${keyword}%`);
  }

  const { data: patients, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(patients);
}

// POST: Registrasi pasien baru
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // Validasi input
    if (!body.full_name || !body.mrn) {
      return NextResponse.json({ error: "Missing full_name or mrn" }, { status: 422 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Insert to database
    const { data: patient, error } = await supabase
      .from("patients")
      .insert({
        hospital_id: hospitalId,
        mrn: body.mrn,
        full_name: body.full_name,
        dob: body.dob || null,
        gender: body.gender || null,
        contact_number: body.contact_number || null,
        emergency_contact: body.emergency_contact || null,
        created_by: user?.id || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: "Duplicate MRN for this hospital" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(patient, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

