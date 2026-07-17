"use server";

import { createClient } from "../utils/supabase/server";
import { supabaseAdmin } from "../utils/supabase/admin";
import { loginSchema, registerHospitalSchema, LoginInput, RegisterHospitalInput } from "../schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(data: LoginInput) {
  // Validate input
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid form data" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: "Invalid email or password" };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function createHospitalByAdmin(data: RegisterHospitalInput) {
  // Validate input
  const parsed = registerHospitalSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid form data" };
  }

  const supabase = await createClient();

  // 1. First, create Hospital record using admin client
  const { data: hospitalData, error: hospitalError } = await supabaseAdmin
    .from("hospitals")
    .insert([{ name: parsed.data.hospitalName }])
    .select()
    .single();

  if (hospitalError || !hospitalData) {
    return { success: false, error: "Failed to create hospital profile" };
  }

  // 2. Create user via Admin API with hospital_id in metadata
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { hospital_id: hospitalData.id, role: "HOSPITAL" }
  });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || "Failed to create account" };
  }

  // No auto sign-in since this is done by superadmin


  // 3. Create Profile record linking user and hospital
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert([
      {
        id: authData.user.id,
        hospital_id: hospitalData.id,
        role: "HOSPITAL",
        full_name: parsed.data.hospitalName,
      },
    ]);

  if (profileError) {
    return { success: false, error: "Failed to assign role to profile" };
  }

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function createStaff(data: {
  fullName: string;
  email: string;
  password: string;
  role: "DOCTOR" | "NURSE";
}) {
  const supabase = await createClient();

  // Get current logged-in user (hospital admin)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "Unauthorized. Please login again." };
  }

  // Get hospital_id from the hospital admin's profile
  const { data: adminProfile, error: profileFetchError } = await supabaseAdmin
    .from("profiles")
    .select("hospital_id, role")
    .eq("id", user.id)
    .single();

  if (profileFetchError || !adminProfile) {
    return { success: false, error: "Failed to fetch your hospital profile." };
  }

  if (adminProfile.role !== "HOSPITAL") {
    return { success: false, error: "Only hospital admins can create staff." };
  }

  // Create the staff user via Admin API (no email sent)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { hospital_id: adminProfile.hospital_id, role: data.role }
  });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || "Failed to create user account." };
  }

  // Create profile for the new staff member
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert([{
      id: authData.user.id,
      hospital_id: adminProfile.hospital_id,
      full_name: data.fullName,
      role: data.role,
    }]);

  if (profileError) {
    return { success: false, error: "Failed to assign role to new staff." };
  }

  revalidatePath("/dashboard/hospital/staff");
  return { success: true };
}
