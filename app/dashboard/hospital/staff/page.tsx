import { createClient } from "@/src/features/auth/utils/supabase/server";
import { supabaseAdmin } from "@/src/features/auth/utils/supabase/admin";
import Link from "next/link";

export default async function StaffListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get hospital_id from current admin
  const { data: adminProfile } = await supabaseAdmin
    .from("profiles")
    .select("hospital_id")
    .eq("id", user!.id)
    .single();

  // Get all staff in this hospital (excluding the hospital admin)
  const { data: staff } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("hospital_id", adminProfile?.hospital_id)
    .in("role", ["DOCTOR", "NURSE"])
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 text-gray-900 dark:text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All doctors and nurses in your hospital.</p>
        </div>
        <Link
          href="/dashboard/hospital/staff/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Add Staff
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {!staff || staff.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg font-medium">No staff yet</p>
            <p className="text-sm mt-1">Add your first doctor or nurse using the button above.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{member.full_name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.role === "DOCTOR"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    }`}>
                      {member.role === "DOCTOR" ? "🩺 Doctor" : "🏥 Nurse"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(member.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
