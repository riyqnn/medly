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

  const status = req.nextUrl.searchParams.get("status");

  let query = supabase
    .from("meal_orders")
    .select(`
      *,
      meal_menus ( name, price ),
      patient_admissions ( patients ( full_name, mrn ), rooms ( room_number, ward_name ) )
    `)
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  } else {
    query = query.in("status", ["PENDING", "PREPARING"]);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.id || !body.status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 422 });
    }

    const { data, error } = await supabase
      .from("meal_orders")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .eq("hospital_id", hospitalId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
