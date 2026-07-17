import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";
import { requireRole, denied } from "@/src/features/auth/utils/require";

export async function GET() {
  const caller = await requireRole("HOSPITAL");
  if (denied(caller)) return NextResponse.json({ error: caller.error }, { status: caller.status });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hospitals")
    .select("id, name, code, address, logo_url, spiritual_support_enabled")
    .eq("id", caller.hospitalId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const caller = await requireRole("HOSPITAL");
  if (denied(caller)) return NextResponse.json({ error: caller.error }, { status: caller.status });

  try {
    const body = await req.json();
    const updates: any = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "Nama rumah sakit wajib diisi." }, { status: 400 });
      updates.name = name;
    }
    // Blank strings mean "cleared", not "unchanged" — code and address are
    // optional, and logo_url falls back to the Medly mark when null.
    if (body.code !== undefined) updates.code = String(body.code).trim() || null;
    if (body.address !== undefined) updates.address = String(body.address).trim() || null;
    if (body.logo_url !== undefined) updates.logo_url = String(body.logo_url).trim() || null;
    if (body.spiritual_support_enabled !== undefined) {
      updates.spiritual_support_enabled = !!body.spiritual_support_enabled;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("hospitals")
      .update(updates)
      .eq("id", caller.hospitalId)
      .select("id, name, code, address, logo_url, spiritual_support_enabled")
      .single();

    if (error) {
      // `code` is UNIQUE across hospitals; say so instead of leaking the
      // Postgres constraint name.
      if (error.code === "23505") {
        return NextResponse.json({ error: "Kode rumah sakit ini sudah dipakai." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
