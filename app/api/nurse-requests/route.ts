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
  const nurseId = searchParams.get("nurse_id"); // Untuk filter riwayat per perawat

  let query = supabase
    .from("nurse_requests")
    .select(`
      *,
      patient_admissions ( 
        id, 
        patients ( full_name, mrn ),
        rooms ( room_number, ward_name )
      ),
      nurses ( full_name )
    `)
    .eq("hospital_id", hospitalId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  } else if (!nurseId) {
    // Default: tampilkan yang belum selesai (jika tidak sedang melihat history nurse tertentu)
    query = query.in("status", ["PENDING", "IN_PROGRESS"]);
  }

  if (nurseId) {
    query = query.eq("handled_by_nurse_id", nurseId);
  }

  const { data: requests, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(requests);
}

export async function PATCH(req: NextRequest) {
  // Update status (e.g., IN_PROGRESS, RESOLVED)
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, handled_by_nurse_id } = body;

    if (!id || !status) {
       return NextResponse.json({ error: "Missing request id or status" }, { status: 422 });
    }

    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (handled_by_nurse_id) updateData.handled_by_nurse_id = handled_by_nurse_id;
    if (status === "RESOLVED") updateData.resolved_at = new Date().toISOString();

    const { data: request, error } = await supabase
      .from("nurse_requests")
      .update(updateData)
      .eq("id", id)
      .eq("hospital_id", hospitalId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
