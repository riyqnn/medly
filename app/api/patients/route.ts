import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";
import { readPage, paged } from "@/src/features/shell/pagination";

// Middleware helper - get hospital_id securely from session or headers
async function getHospitalId(req: NextRequest, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.user_metadata?.hospital_id) {
    return user.user_metadata.hospital_id;
  }
  // Fallback for development/testing
  return req.headers.get("x-hospital-id");
}

// GET: List pasien (paginated)
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  const keyword = req.nextUrl.searchParams.get("q") || "";
  const p = readPage(req);

  // The active admission is joined here rather than having the client pull the
  // whole admissions table and match ids in the browser — that pattern quietly
  // produced wrong badges as soon as either list was truncated.
  let query = supabase
    .from("patients")
    .select(
      `id, mrn, full_name, dob, gender, blood_type, allergies,
       patient_admissions ( id, status, rooms ( room_number ) )`,
      { count: "exact" }
    )
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .is("patient_admissions.deleted_at", null)
    .eq("patient_admissions.status", "ACTIVE")
    .order("created_at", { ascending: false })
    .range(p.from, p.to);

  if (keyword) {
    query = query.ilike("full_name", `%${keyword}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten the embedded array into the one admission that matters.
  const rows = (data ?? []).map(({ patient_admissions, ...patient }: any) => ({
    ...patient,
    active_admission: patient_admissions?.[0] ?? null,
  }));

  return NextResponse.json(paged(rows, count, p));
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
        address: body.address || null,
        blood_type: body.blood_type || null,
        allergies: body.allergies || null,
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
