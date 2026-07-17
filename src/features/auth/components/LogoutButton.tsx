"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/src/features/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-red-50 hover:text-red-600"
      >
        <LogOut
          className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-0.5"
          strokeWidth={2.1}
        />
        Sign out
      </button>
    </form>
  );
}
