export default function HospitalDashboard() {
  return (
    <div className="p-8 text-gray-900 dark:text-white">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome to your hospital admin panel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Doctors</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">—</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Nurses</p>
          <p className="text-3xl font-bold text-green-600 mt-1">—</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Staff</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">—</p>
        </div>
      </div>
    </div>
  );
}
