import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";

async function getHospitalId(req: NextRequest, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.hospital_id ?? req.headers.get("x-hospital-id");
}

const NUMERIC = [
  "blood_pressure_systolic",
  "blood_pressure_diastolic",
  "heart_rate",
  "respiratory_rate",
  "oxygen_saturation",
  "temperature_celsius",
] as const;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admissionId = req.nextUrl.searchParams.get("admission_id");
  if (!admissionId) return NextResponse.json({ error: "Missing admission_id" }, { status: 422 });

  const { data, error } = await supabase
    .from("vital_signs")
    .select("*")
    .eq("hospital_id", hospitalId)
    .eq("admission_id", admissionId)
    .order("measured_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.admission_id) {
      return NextResponse.json({ error: "Missing admission_id" }, { status: 422 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Blank fields stay null rather than becoming 0 — an unrecorded vital is
    // not a reading of zero.
    const reading: Record<string, unknown> = {
      hospital_id: hospitalId,
      admission_id: body.admission_id,
      measured_at: body.measured_at ? new Date(body.measured_at).toISOString() : new Date().toISOString(),
      notes: body.notes || null,
      created_by: user?.id || null,
    };
    for (const key of NUMERIC) {
      const raw = body[key];
      reading[key] = raw === "" || raw === undefined || raw === null ? null : Number(raw);
    }

    const { data, error } = await supabase.from("vital_signs").insert(reading).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
