import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";

export interface AdmissionContext {
  admissionId: string;
  hospitalId: string;
  patientId: string;
}

/**
 * Every /api/patient/* route is reachable without a login (the tablet is bound
 * to a bed, not a user — see Bagian 4 of the audit plan). This is the one place
 * that decides whether a given admission_id is a legitimate, currently-active
 * bedside session, and derives hospital_id/patient_id from it rather than
 * trusting values passed in from the client.
 */
export async function getActiveAdmissionContext(
  admissionId: string | null
): Promise<AdmissionContext | null> {
  if (!admissionId) return null;

  const { data: admission, error } = await supabaseAdmin
    .from("patient_admissions")
    .select("id, hospital_id, patient_id, status")
    .eq("id", admissionId)
    .is("deleted_at", null)
    .single();

  if (error || !admission || admission.status !== "ACTIVE") return null;

  return {
    admissionId: admission.id,
    hospitalId: admission.hospital_id,
    patientId: admission.patient_id,
  };
}

export interface BedsideSession {
  admission_id: string;
  admission_date: string;
  status: string;
  primary_diagnosis: string | null;
  day_of_stay: number;
  patient: { id: string; full_name: string; mrn: string; dob: string | null; gender: string | null } | null;
  room: { id: string; room_number: string; ward_name: string | null } | null;
  hospital: { id: string; name: string; spiritual_support_enabled: boolean } | null;
  doctors: { role: string; id: string; full_name: string; specialization: string | null }[];
}

/** Full bedside session bundle — shared by the /api/patient/session route and the /patient layout. */
export async function getBedsideSession(admissionId: string): Promise<BedsideSession | null> {
  const ctx = await getActiveAdmissionContext(admissionId);
  if (!ctx) return null;

  const { data: admission, error } = await supabaseAdmin
    .from("patient_admissions")
    .select(
      `
      id, admission_date, status, primary_diagnosis,
      patients ( id, full_name, mrn, dob, gender ),
      rooms ( id, room_number, ward_name ),
      hospitals ( id, name, spiritual_support_enabled )
    `
    )
    .eq("id", ctx.admissionId)
    .single();

  if (error || !admission) return null;

  const { data: doctorAssignments } = await supabaseAdmin
    .from("patient_doctor_assignments")
    .select("role, doctors ( id, full_name, specialization )")
    .eq("admission_id", ctx.admissionId)
    .is("deleted_at", null);

  const admissionDate = new Date(admission.admission_date);
  const dayOfStay = Math.max(
    1,
    Math.floor((Date.now() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  return {
    admission_id: admission.id,
    admission_date: admission.admission_date,
    status: admission.status,
    primary_diagnosis: admission.primary_diagnosis,
    day_of_stay: dayOfStay,
    patient: admission.patients as any,
    room: admission.rooms as any,
    hospital: admission.hospitals as any,
    doctors: (doctorAssignments || []).map((a: any) => ({
      role: a.role,
      ...a.doctors,
    })),
  };
}
