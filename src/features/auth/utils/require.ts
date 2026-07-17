import { createClient } from "@/src/features/auth/utils/supabase/server";
import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";

export type Role = "ADMIN" | "HOSPITAL" | "DOCTOR" | "NURSE";

export type Caller = { userId: string; role: Role; hospitalId: string | null };
export type Denied = { error: string; status: 401 | 403 };

export const denied = (v: Caller | Denied): v is Denied => "error" in v;

/**
 * Resolve who is calling, from the `profiles` table.
 *
 * Two deliberate differences from the ad-hoc `getHospitalId()` copied across the
 * route handlers:
 *  - the role and hospital come from the database, not from JWT `user_metadata`,
 *    so they can't be stale after a role change;
 *  - there is no `x-hospital-id` header fallback. That fallback is client
 *    controlled, so any header could name any hospital.
 */
export async function getCaller(): Promise<Caller | Denied> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has ended. Please sign in again.", status: 401 };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, hospital_id")
    .eq("id", user.id)
    .single();

  if (!profile?.role) {
    return { error: "Your account has no role yet. Contact your hospital admin.", status: 401 };
  }

  return {
    userId: user.id,
    role: String(profile.role).toUpperCase() as Role,
    hospitalId: profile.hospital_id ?? null,
  };
}

/** Caller must hold one of `roles` and belong to a hospital. */
export async function requireRole(...roles: Role[]): Promise<Caller | Denied> {
  const caller = await getCaller();
  if (denied(caller)) return caller;

  if (!roles.includes(caller.role)) {
    return { error: "You don't have access to do that.", status: 403 };
  }
  if (!caller.hospitalId) {
    return { error: "Your account isn't linked to any hospital.", status: 403 };
  }
  return caller;
}
