import { CreateStaffForm } from "@/src/features/auth/components/CreateStaffForm";
import Link from "next/link";

export default function CreateStaffPage() {
  return (
    <div className="p-8 text-gray-900 dark:text-white">
      <div className="mb-8">
        <Link href="/dashboard/hospital/staff" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors">
          ← Back to Staff
        </Link>
        <h1 className="text-2xl font-bold mt-2">Add Staff</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new Doctor or Nurse account for your hospital.</p>
      </div>

      <div className="max-w-md bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <CreateStaffForm />
      </div>
    </div>
  );
}
