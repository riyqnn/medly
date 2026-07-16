import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";
import { getActiveAdmissionContext } from "@/src/features/patient/utils/session";

const VALID_CATEGORIES = ["CALL_NURSE", "PAIN", "IV_DRIP", "BATHROOM", "DRINKING_WATER", "EXTRA_BLANKET", "OTHER"];

// GET: patient checks the status of their own recent requests
export async function GET(req: NextRequest) {
  const admissionId = req.nextUrl.searchParams.get("admission_id");
  const ctx = await getActiveAdmissionContext(admissionId);
  if (!ctx) {
    return NextResponse.json({ error: "Admission not found or not active" }, { status: 404 });
  }

  const { data: requests, error } = await supabaseAdmin
    .from("nurse_requests")
    .select("id, request_category, priority, status, created_at, resolved_at")
    .eq("admission_id", ctx.admissionId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(requests);
}

// POST: patient presses "call nurse" for a category — this is the entry point
// that was entirely missing before (the staff /api/nurse-requests route only
// ever supported GET/PATCH for the nurse dashboard side).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ctx = await getActiveAdmissionContext(body.admission_id);
    if (!ctx) {
      return NextResponse.json({ error: "Admission not found or not active" }, { status: 404 });
    }

    if (!VALID_CATEGORIES.includes(body.request_category)) {
      return NextResponse.json({ error: "Invalid request_category" }, { status: 422 });
    }

    const priority = body.request_category === "PAIN" ? "HIGH" : (body.priority || "MEDIUM");

    const { data: request, error } = await supabaseAdmin
      .from("nurse_requests")
      .insert({
        hospital_id: ctx.hospitalId,
        admission_id: ctx.admissionId,
        request_category: body.request_category,
        priority,
        status: "PENDING",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(request, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
