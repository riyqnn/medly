import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";
import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";

const TYPES = ["ANAMNESIS", "EXAMINATION", "DIAGNOSIS", "PROGRESS", "ACTION", "OTHER"];

async function getHospitalId(req: NextRequest, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.hospital_id ?? req.headers.get("x-hospital-id");
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admissionId = req.nextUrl.searchParams.get("admission_id");
  if (!admissionId) return NextResponse.json({ error: "Missing admission_id" }, { status: 422 });

  const { data, error } = await supabase
    .from("medical_records")
    .select("*")
    .eq("hospital_id", hospitalId)
    .eq("admission_id", admissionId)
    .is("deleted_at", null)
    .order("recorded_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.admission_id || !body.title?.trim()) {
      return NextResponse.json({ error: "Judul catatan wajib diisi" }, { status: 422 });
    }
    if (!TYPES.includes(body.record_type)) {
      return NextResponse.json({ error: "Jenis catatan tidak valid" }, { status: 422 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Stamp the author's name onto the note so the record still reads correctly
    // if that account is later removed.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", user?.id ?? "")
      .maybeSingle();

    const { data, error } = await supabase
      .from("medical_records")
      .insert({
        hospital_id: hospitalId,
        admission_id: body.admission_id,
        record_type: body.record_type,
        title: body.title.trim(),
        content: body.content?.trim() || null,
        recorded_at: body.recorded_at ? new Date(body.recorded_at).toISOString() : new Date().toISOString(),
        author_profile_id: user?.id ?? null,
        author_name: profile?.full_name ?? null,
        created_by: user?.id ?? null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
