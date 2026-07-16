"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, HeartPulse, Check } from "lucide-react";
import { createStaff } from "@/src/features/auth/actions";
import { cn } from "@/src/lib/utils";

const ROLES = [
  { value: "DOCTOR", label: "Dokter", icon: Stethoscope },
  { value: "NURSE", label: "Perawat", icon: HeartPulse },
] as const;

export function CreateStaffForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"DOCTOR" | "NURSE">("DOCTOR");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!fullName || !email || !password) {
      setError("Nama, email, dan kata sandi wajib diisi.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      setLoading(false);
      return;
    }

    const result = await createStaff({ fullName, email, password, role });
    if (!result.success) {
      setError(result.error ?? "Terjadi kesalahan.");
    } else {
      setSuccess(true);
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("DOCTOR");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <span className="label">Peran</span>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              aria-pressed={role === r.value}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition duration-200 active:scale-[0.98]",
                role === r.value
                  ? "border-brand-500 bg-brand-500 text-white shadow-sm shadow-brand-500/25"
                  : "border-line bg-white text-ink-soft hover:border-brand-200 hover:bg-brand-50"
              )}
            >
              <r.icon className="h-4 w-4" strokeWidth={2.2} />
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="staff-name" className="label">
          Nama lengkap
        </label>
        <input
          id="staff-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={role === "DOCTOR" ? "dr. Siti Aminah" : "Ns. Rani Putri"}
          className="field"
        />
        <p className="mt-1.5 text-xs text-ink-mute">
          Gunakan nama yang sama dengan data {role === "DOCTOR" ? "dokter" : "perawat"} agar portalnya
          mengenali akun ini.
        </p>
      </div>

      <div>
        <label htmlFor="staff-email" className="label">
          Email
        </label>
        <input
          id="staff-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@rumahsakit.id"
          className="field"
        />
      </div>

      <div>
        <label htmlFor="staff-password" className="label">
          Kata sandi
        </label>
        <input
          id="staff-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 6 karakter"
          className="field"
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-700">
          <Check className="h-4 w-4" /> Akun staf berhasil dibuat.
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Membuat akun…" : "Buat akun"}
      </button>
    </form>
  );
}
