import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";
import { requireRole, denied } from "@/src/features/auth/utils/require";
import { readPage, paged } from "@/src/features/shell/pagination";

/**
 * GET — the ward queue. Hospital admins may watch it for supervision; nurses
 * work it. Both see the same rows.
 */
export async function GET(req: NextRequest) {
  const caller = await requireRole("HOSPITAL", "NURSE");
  if (denied(caller)) {
    return NextResponse.json({ error: caller.error }, { status: caller.status });
  }

  const supabase = await createClient();
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const nurseId = searchParams.get("nurse_id"); // riwayat per perawat
  const p = readPage(req);

  let query = supabase
    .from("nurse_requests")
    .select(
      `
      id, request_category, priority, status, created_at, resolved_at, handled_by_nurse_id,
      patient_admissions (
        id,
        patients ( full_name, mrn ),
        rooms ( room_number, ward_name )
      ),
      nurses ( full_name )
    `,
      { count: "exact" }
    )
    .eq("hospital_id", caller.hospitalId)
    .is("deleted_at", null);

  if (nurseId) {
    // A nurse's own history: most recently finished first.
    query = query.eq("handled_by_nurse_id", nurseId).order("resolved_at", { ascending: false });
  } else {
    // The live queue: highest priority first, then longest waiting. Ordered in
    // the database so it stays correct across pages.
    query = query
      .order("priority_rank", { ascending: true })
      .order("created_at", { ascending: true });
  }

  if (status) {
    query = query.eq("status", status);
  } else if (!nurseId) {
    query = query.in("status", ["PENDING", "IN_PROGRESS"]);
  }

  const { data, error, count } = await query.range(p.from, p.to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(paged(data, count, p));
}

/**
 * PATCH — only a nurse may move a request along.
 *
 * Enforced here rather than by hiding buttons: this route used to check
 * hospital_id alone, so any signed-in account of any role could resolve a call.
 */
export async function PATCH(req: NextRequest) {
  const caller = await requireRole("NURSE");
  if (denied(caller)) {
    return NextResponse.json(
      {
        error:
          caller.status === 403
            ? "Hanya perawat yang dapat mengubah status permintaan."
            : caller.error,
      },
      { status: caller.status }
    );
  }

  const supabase = await createClient();

  try {
    const body = await req.json();
    const { id, status, handled_by_nurse_id } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing request id or status" }, { status: 422 });
    }
    if (!["PENDING", "IN_PROGRESS", "RESOLVED"].includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 422 });
    }

    const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (handled_by_nurse_id) updateData.handled_by_nurse_id = handled_by_nurse_id;
    if (status === "RESOLVED") updateData.resolved_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("nurse_requests")
      .update(updateData)
      .eq("id", id)
      .eq("hospital_id", caller.hospitalId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
