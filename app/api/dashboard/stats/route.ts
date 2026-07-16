import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/features/auth/utils/supabase/server";

async function getHospitalId(req: NextRequest, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.user_metadata?.hospital_id) {
    return user.user_metadata.hospital_id;
  }
  return req.headers.get("x-hospital-id");
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const hospitalId = await getHospitalId(req, supabase);

  if (!hospitalId) {
    return NextResponse.json({ error: "Unauthorized: Missing hospital_id" }, { status: 401 });
  }

  try {
    // 1. Jumlah pasien aktif
    const { count: activePatientsCount, error: err1 } = await supabase
      .from("patient_admissions")
      .select("*", { count: 'exact', head: true })
      .eq("hospital_id", hospitalId)
      .eq("status", "ACTIVE");

    // 2. Jumlah request perawat aktif (PENDING / IN_PROGRESS)
    const { count: activeNurseRequestsCount, error: err2 } = await supabase
      .from("nurse_requests")
      .select("*", { count: 'exact', head: true })
      .eq("hospital_id", hospitalId)
      .in("status", ["PENDING", "IN_PROGRESS"]);

    // 3. Jadwal hari ini (Treatment Schedules yang belum selesai hari ini)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { count: todaySchedulesCount, error: err3 } = await supabase
      .from("treatment_schedules")
      .select("*", { count: 'exact', head: true })
      .eq("hospital_id", hospitalId)
      .in("status", ["SCHEDULED", "RESCHEDULED"])
      .gte("scheduled_time", todayStart.toISOString())
      .lte("scheduled_time", todayEnd.toISOString());

    // 4. Rekap pesanan makanan hari ini
    const { count: todayMealOrdersCount, error: err4 } = await supabase
      .from("meal_orders")
      .select("*", { count: 'exact', head: true })
      .eq("hospital_id", hospitalId)
      .eq("order_date", todayStart.toISOString().split("T")[0]); // YYYY-MM-DD

    if (err1 || err2 || err3 || err4) {
      return NextResponse.json({ error: "Error fetching dashboard stats" }, { status: 500 });
    }

    return NextResponse.json({
      active_patients: activePatientsCount || 0,
      active_nurse_requests: activeNurseRequestsCount || 0,
      today_schedules: todaySchedulesCount || 0,
      today_meal_orders: todayMealOrdersCount || 0
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
