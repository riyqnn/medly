import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";
import { getActiveAdmissionContext } from "@/src/features/patient/utils/session";

const VALID_SCHEDULES = ["BREAKFAST", "LUNCH", "DINNER"];

export async function GET(req: NextRequest) {
  const admissionId = req.nextUrl.searchParams.get("admission_id");
  const ctx = await getActiveAdmissionContext(admissionId);
  if (!ctx) {
    return NextResponse.json({ error: "Admission not found or not active" }, { status: 404 });
  }

  const { data: orders, error } = await supabaseAdmin
    .from("meal_orders")
    .select("*, meal_menus ( name, price, image_url )")
    .eq("admission_id", ctx.admissionId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ctx = await getActiveAdmissionContext(body.admission_id);
    if (!ctx) {
      return NextResponse.json({ error: "Admission not found or not active" }, { status: 404 });
    }

    if (!body.menu_id || !VALID_SCHEDULES.includes(body.meal_schedule) || !body.order_date) {
      return NextResponse.json({ error: "Missing menu_id, meal_schedule, or order_date" }, { status: 422 });
    }

    const { data: menu } = await supabaseAdmin
      .from("meal_menus")
      .select("id")
      .eq("id", body.menu_id)
      .eq("hospital_id", ctx.hospitalId)
      .eq("is_available", true)
      .is("deleted_at", null)
      .single();

    if (!menu) {
      return NextResponse.json({ error: "Menu item not available" }, { status: 404 });
    }

    const { data: order, error } = await supabaseAdmin
      .from("meal_orders")
      .insert({
        hospital_id: ctx.hospitalId,
        admission_id: ctx.admissionId,
        menu_id: body.menu_id,
        meal_schedule: body.meal_schedule,
        order_date: body.order_date,
        patient_notes: body.patient_notes || null,
        status: "PENDING",
      })
      .select("*, meal_menus ( name, price, image_url )")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
