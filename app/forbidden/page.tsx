import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-red-200 dark:border-red-900 max-w-md">
        <h1 className="text-4xl font-bold text-red-600 dark:text-red-500 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Forbidden Access</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You do not have the required permissions to view this dashboard. Your role restricts access to this resource.
        </p>
        <Link href="/dashboard" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
