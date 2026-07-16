"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageShell } from "@/src/features/shell/components/Page";
import { FormError } from "@/src/features/shell/components/Modal";

export default function RegisterPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const body = {
      mrn: formData.get("mrn"),
      full_name: formData.get("full_name"),
      dob: formData.get("dob") || null,
      gender: formData.get("gender") || null,
      contact_number: formData.get("contact_number") || null,
      emergency_contact: formData.get("emergency_contact") || null,
    };

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const patient = await res.json();
        // Straight to the record — the next step is almost always admitting them.
        router.push(`/dashboard/hospital/patients/${patient.id}`);
        router.refresh();
      } else {
        setError((await res.json()).error ?? "Gagal mendaftarkan pasien");
      }
    } catch (err: any) {
      setError(err.message ?? "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell className="max-w-2xl">
      <Link
        href="/dashboard/hospital/patients"
        className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-ink-soft transition hover:text-brand-600"
      >
        <ChevronLeft className="h-4 w-4" /> Semua pasien
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Daftarkan pasien</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Setelah terdaftar, rawat inapkan pasien untuk membuka layar Medly di kamarnya.
      </p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-5 p-6">
        <FormError>{error}</FormError>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label htmlFor="mrn" className="label">
              Nomor rekam medis
            </label>
            <input id="mrn" required name="mrn" type="text" className="field" placeholder="MRN-12345" />
          </div>
          <div>
            <label htmlFor="full_name" className="label">
              Nama lengkap
            </label>
            <input
              id="full_name"
              required
              name="full_name"
              type="text"
              className="field"
              placeholder="Budi Santoso"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label htmlFor="dob" className="label">
              Tanggal lahir
            </label>
            <input id="dob" name="dob" type="date" className="field" />
          </div>
          <div>
            <label htmlFor="gender" className="label">
              Jenis kelamin
            </label>
            <select id="gender" name="gender" className="field">
              <option value="">Pilih…</option>
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label htmlFor="contact_number" className="label">
              Nomor kontak
            </label>
            <input id="contact_number" name="contact_number" type="tel" className="field" placeholder="+62…" />
          </div>
          <div>
            <label htmlFor="emergency_contact" className="label">
              Kontak darurat
            </label>
            <input
              id="emergency_contact"
              name="emergency_contact"
              type="tel"
              className="field"
              placeholder="+62… (keluarga)"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-line pt-5">
          <Link href="/dashboard/hospital/patients" className="btn-ghost">
            Batal
          </Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Menyimpan…" : "Daftarkan pasien"}
          </button>
        </div>
      </form>
    </PageShell>
  );
}
