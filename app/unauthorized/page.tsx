import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-yellow-200 dark:border-yellow-900 max-w-md">
        <h1 className="text-4xl font-bold text-yellow-600 dark:text-yellow-500 mb-4">401</h1>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Unauthorized</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Please log in to access this page. You must have an active session.
        </p>
        <Link href="/login" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Go to Login
        </Link>
      </div>
    </div>
  );
}
