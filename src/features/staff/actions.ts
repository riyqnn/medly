"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/features/auth/utils/supabase/server";
import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";

export type StaffRole = "DOCTOR" | "NURSE";

const TABLE: Record<StaffRole, "doctors" | "nurses"> = {
  DOCTOR: "doctors",
  NURSE: "nurses",
};

type Ctx = { hospitalId: string; userId: string };

async function requireHospitalAdmin(): Promise<Ctx | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi Anda sudah berakhir. Silakan masuk lagi." };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("hospital_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "HOSPITAL" || !profile.hospital_id) {
    return { error: "Hanya admin rumah sakit yang dapat mengelola staf." };
  }
  return { hospitalId: profile.hospital_id, userId: user.id };
}

/**
 * Create the login for a staff member and link it to their operational record.
 *
 * The account and the profile row must both exist or neither should: an auth
 * user without a profile can sign in but is force-signed-out by the middleware,
 * which is exactly how this database ended up with unusable accounts.
 */
async function createLinkedAccount(
  hospitalId: string,
  role: StaffRole,
  fullName: string,
  email: string,
  password: string
): Promise<{ profileId: string } | { error: string }> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { hospital_id: hospitalId, role },
  });

  if (error || !data.user) {
    const msg = error?.message ?? "";
    if (/already been registered|already exists/i.test(msg)) {
      return { error: "Email ini sudah dipakai akun lain." };
    }
    return { error: msg || "Gagal membuat akun." };
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: data.user.id,
    hospital_id: hospitalId,
    role,
    full_name: fullName,
  });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    return { error: "Gagal menyiapkan profil akun. Tidak ada akun yang dibuat." };
  }

  return { profileId: data.user.id };
}

async function destroyAccount(profileId: string) {
  await supabaseAdmin.from("profiles").delete().eq("id", profileId);
  await supabaseAdmin.auth.admin.deleteUser(profileId);
}

export async function createStaffMember(input: {
  role: StaffRole;
  fullName: string;
  employeeCode: string;
  specialization?: string;
  strNumber?: string;
  sipNumber?: string;
  withAccount: boolean;
  email?: string;
  password?: string;
}) {
  const ctx = await requireHospitalAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };

  if (!input.fullName.trim() || !input.employeeCode.trim()) {
    return { success: false, error: "Nama dan kode pegawai wajib diisi." };
  }
  if (input.withAccount) {
    if (!input.email?.trim() || !input.password) {
      return { success: false, error: "Email dan kata sandi wajib diisi untuk membuat akun." };
    }
    if (input.password.length < 6) {
      return { success: false, error: "Kata sandi minimal 6 karakter." };
    }
  }

  let profileId: string | null = null;
  if (input.withAccount) {
    const account = await createLinkedAccount(
      ctx.hospitalId,
      input.role,
      input.fullName.trim(),
      input.email!.trim(),
      input.password!
    );
    if ("error" in account) return { success: false, error: account.error };
    profileId = account.profileId;
  }

  const row: Record<string, unknown> = {
    hospital_id: ctx.hospitalId,
    profile_id: profileId,
    employee_code: input.employeeCode.trim(),
    full_name: input.fullName.trim(),
    created_by: ctx.userId,
  };
  if (input.role === "DOCTOR") {
    row.specialization = input.specialization?.trim() || null;
    row.str_number = input.strNumber?.trim() || null;
    row.sip_number = input.sipNumber?.trim() || null;
  }

  const { error } = await supabaseAdmin.from(TABLE[input.role]).insert(row);

  if (error) {
    // Don't strand a login whose staff record failed to save.
    if (profileId) await destroyAccount(profileId);
    if (error.code === "23505") {
      return { success: false, error: "Kode pegawai ini sudah dipakai di rumah sakit Anda." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/hospital/doctors");
  revalidatePath("/dashboard/hospital/nurses");
  revalidatePath("/dashboard/hospital/staff");
  return { success: true };
}

/** Give an existing staff record a login it didn't have. */
export async function addAccountToStaff(input: {
  role: StaffRole;
  staffId: string;
  email: string;
  password: string;
}) {
  const ctx = await requireHospitalAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };

  if (!input.email.trim() || input.password.length < 6) {
    return { success: false, error: "Email wajib diisi dan kata sandi minimal 6 karakter." };
  }

  const { data: staff } = await supabaseAdmin
    .from(TABLE[input.role])
    .select("id, full_name, profile_id")
    .eq("id", input.staffId)
    .eq("hospital_id", ctx.hospitalId)
    .is("deleted_at", null)
    .single();

  if (!staff) return { success: false, error: "Data staf tidak ditemukan." };
  if (staff.profile_id) return { success: false, error: "Staf ini sudah punya akun." };

  const account = await createLinkedAccount(
    ctx.hospitalId,
    input.role,
    staff.full_name,
    input.email.trim(),
    input.password
  );
  if ("error" in account) return { success: false, error: account.error };

  const { error } = await supabaseAdmin
    .from(TABLE[input.role])
    .update({ profile_id: account.profileId, updated_at: new Date().toISOString() })
    .eq("id", input.staffId);

  if (error) {
    await destroyAccount(account.profileId);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/hospital/doctors");
  revalidatePath("/dashboard/hospital/nurses");
  revalidatePath("/dashboard/hospital/staff");
  return { success: true };
}

/** Remove the login but keep the staff record — used when someone leaves. */
export async function revokeStaffAccount(input: { role: StaffRole; staffId: string }) {
  const ctx = await requireHospitalAdmin();
  if ("error" in ctx) return { success: false, error: ctx.error };

  const { data: staff } = await supabaseAdmin
    .from(TABLE[input.role])
    .select("id, profile_id")
    .eq("id", input.staffId)
    .eq("hospital_id", ctx.hospitalId)
    .single();

  if (!staff?.profile_id) return { success: false, error: "Staf ini tidak punya akun." };

  // doctors.profile_id / nurses.profile_id are ON DELETE SET NULL, so removing
  // the profile detaches the record without touching the staff data.
  await destroyAccount(staff.profile_id);

  revalidatePath("/dashboard/hospital/doctors");
  revalidatePath("/dashboard/hospital/nurses");
  revalidatePath("/dashboard/hospital/staff");
  return { success: true };
}
