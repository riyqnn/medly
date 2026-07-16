import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";

async function getHospitalId(req: NextRequest, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.user_metadata?.hospital_id) {
    return user.user_metadata.hospital_id;
  }
  return req.headers.get("x-hospital-id");
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updateData: any = { updated_at: new Date().toISOString() };

    // Check if moving to a new room
    if (body.room_id !== undefined) {
      updateData.room_id = body.room_id;
      
      // If setting a new room, check capacity
      if (body.room_id) {
        const { data: activeAdmissions } = await supabase
          .from("patient_admissions")
          .select("id")
          .eq("hospital_id", hospitalId)
          .eq("room_id", body.room_id)
          .eq("status", "ACTIVE")
          .neq("id", params.id); // exclude current

        const { data: roomInfo } = await supabase
          .from("rooms")
          .select("capacity")
          .eq("id", body.room_id)
          .single();

        if (roomInfo && activeAdmissions && activeAdmissions.length >= roomInfo.capacity) {
           return NextResponse.json({ error: "Target room is currently full" }, { status: 409 });
        }
      }
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "DISCHARGED" || body.status === "DECEASED" || body.status === "TRANSFERRED") {
        updateData.discharge_date = new Date().toISOString();
      }
    }

    const { data: admission, error } = await supabase
      .from("patient_admissions")
      .update(updateData)
      .eq("id", params.id)
      .eq("hospital_id", hospitalId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Example event listener: if DISCHARGED, we could cancel upcoming treatments here
    if (body.status === "DISCHARGED" || body.status === "DECEASED") {
        // Softly cancel future scheduled treatments
        await supabase
            .from("treatment_schedules")
            .update({ status: 'CANCELLED' })
            .eq("admission_id", params.id)
            .eq("status", "SCHEDULED")
            .gt("scheduled_time", new Date().toISOString());
    }

    return NextResponse.json(admission);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
