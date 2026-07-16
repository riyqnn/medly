import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";

// Middleware helper - get hospital_id securely from session or headers
async function getHospitalId(req: NextRequest, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.user_metadata?.hospital_id) {
    return user.user_metadata.hospital_id;
  }
  return req.headers.get("x-hospital-id");
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", params.id)
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .single();

  if (error || !patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json(patient);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // Only allow updating certain fields
    const allowedUpdates = {
      full_name: body.full_name,
      dob: body.dob,
      gender: body.gender,
      contact_number: body.contact_number,
      emergency_contact: body.emergency_contact,
      updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(allowedUpdates).forEach(key => 
      (allowedUpdates as any)[key] === undefined && delete (allowedUpdates as any)[key]
    );

    const { data: patient, error } = await supabase
      .from("patients")
      .update(allowedUpdates)
      .eq("id", params.id)
      .eq("hospital_id", hospitalId)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(patient);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  // Soft delete
  const { error } = await supabase
    .from("patients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Patient deleted successfully" });
}
