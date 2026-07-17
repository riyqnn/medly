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
