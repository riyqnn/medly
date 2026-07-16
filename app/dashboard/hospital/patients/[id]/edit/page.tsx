"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageShell, Loading } from "@/src/features/shell/components/Page";
import { FormError } from "@/src/features/shell/components/Modal";

export default function EditPatientPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [form, setForm] = useState({
    full_name: "",
    dob: "",
    gender: "",
    contact_number: "",
    emergency_contact: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/patients/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setForm({
          full_name: d.full_name ?? "",
          dob: d.dob ?? "",
          gender: d.gender ?? "",
          contact_number: d.contact_number ?? "",
          emergency_contact: d.emergency_contact ?? "",
        });
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/patients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) router.push(`/dashboard/hospital/patients/${id}`);
    else setError((await res.json()).error ?? "Gagal menyimpan");
  }

  if (loading)
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );

  return (
    <PageShell className="max-w-2xl">
      <Link
        href={`/dashboard/hospital/patients/${id}`}
        className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-ink-soft transition hover:text-brand-600"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke pasien
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Ubah data pasien</h1>
      <p className="mt-1 text-sm text-ink-soft">Nomor rekam medis tidak dapat diubah.</p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-5 p-6">
        <FormError>{error}</FormError>

        <div>
          <label htmlFor="full_name" className="label">
            Nama lengkap
          </label>
          <input
            id="full_name"
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="field"
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label htmlFor="dob" className="label">
              Tanggal lahir
            </label>
            <input
              id="dob"
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="gender" className="label">
              Jenis kelamin
            </label>
            <select
              id="gender"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="field"
            >
              <option value="">Pilih…</option>
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label htmlFor="contact" className="label">
              Nomor kontak
            </label>
            <input
              id="contact"
              value={form.contact_number}
              onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="emergency" className="label">
              Kontak darurat
            </label>
            <input
              id="emergency"
              value={form.emergency_contact}
              onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
              className="field"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-line pt-5">
          <Link href={`/dashboard/hospital/patients/${id}`} className="btn-ghost">
            Batal
          </Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Menyimpan…" : "Simpan perubahan"}
          </button>
        </div>
      </form>
    </PageShell>
  );
}
