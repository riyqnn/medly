import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";

async function getHospitalId(req: NextRequest, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.hospital_id ?? req.headers.get("x-hospital-id");
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const allowed = ["room_number", "ward_name", "capacity", "status"];
    const updates: any = { updated_at: new Date().toISOString() };
    allowed.forEach((k) => { if (body[k] !== undefined) updates[k] = body[k]; });

    // Capacity can't drop below the people already in the room.
    if (updates.capacity !== undefined) {
      const { count } = await supabase
        .from("patient_admissions")
        .select("id", { count: "exact", head: true })
        .eq("hospital_id", hospitalId)
        .eq("room_id", id)
        .eq("status", "ACTIVE");
      if ((count ?? 0) > Number(updates.capacity)) {
        return NextResponse.json(
          { error: `Kamar sedang diisi ${count} pasien. Kapasitas tidak bisa kurang dari itu.` },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from("rooms")
      .update(updates)
      .eq("id", id)
      .eq("hospital_id", hospitalId)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Nomor kamar sudah dipakai" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);
  if (!hospitalId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Deleting an occupied room would strand its patients' room reference.
  const { count } = await supabase
    .from("patient_admissions")
    .select("id", { count: "exact", head: true })
    .eq("hospital_id", hospitalId)
    .eq("room_id", id)
    .eq("status", "ACTIVE");

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Kamar masih ditempati pasien. Pindahkan pasiennya lebih dulu." },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("rooms")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("hospital_id", hospitalId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
