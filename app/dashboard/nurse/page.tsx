import { logout } from "@/src/features/auth/actions";

export default function NurseDashboard() {
  return (
    <div className="min-h-screen p-8 bg-green-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Nurse Dashboard</h1>
        <form action={logout}>
          <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Logout</button>
        </form>
      </header>
      <main>
        <p className="text-lg">Welcome, Nurse. Patient care plans and immediate tasks will appear here.</p>
      </main>
    </div>
  );
}
