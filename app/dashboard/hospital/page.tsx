"use client";

import { useEffect, useState } from "react";

interface DashboardStats {
  active_patients: number;
  active_nurse_requests: number;
  today_schedules: number;
  today_meal_orders: number;
}

export default function HospitalDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="p-8 text-gray-900 dark:text-white">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome to your hospital admin panel.</p>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Patients</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats?.active_patients || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nurse Requests</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{stats?.active_nurse_requests || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Schedules</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">{stats?.today_schedules || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Meal Orders</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{stats?.today_meal_orders || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
}
