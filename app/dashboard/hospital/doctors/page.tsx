"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Stethoscope } from "lucide-react";
import { PageShell, PageHeader, EmptyState, Loading } from "@/src/features/shell/components/Page";
import { Modal, FormError } from "@/src/features/shell/components/Modal";

interface Doctor {
  id: string;
  employee_code: string;
  full_name: string;
  specialization: string | null;
  str_number: string | null;
  sip_number: string | null;
}

const EMPTY_FORM = { employee_code: "", full_name: "", specialization: "", str_number: "", sip_number: "", email: "", password: "" };

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Doctor | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDoctors();
  }, []);

  async function fetchDoctors() {
    setLoading(true);
    const res = await fetch("/api/doctors");
    if (res.ok) setDoctors(await res.json());
    setLoading(false);
  }

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function openEdit(d: Doctor) {
    setEditTarget(d);
    setForm({
      employee_code: d.employee_code,
      full_name: d.full_name,
      specialization: d.specialization ?? "",
      str_number: d.str_number ?? "",
      sip_number: d.sip_number ?? "",
      email: "",
      password: "",
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = editTarget
        ? await fetch(`/api/doctors/${editTarget.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })
        : await fetch("/api/doctors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
      if (!res.ok) return setError((await res.json()).error ?? "Gagal menyimpan");
      setShowModal(false);
      fetchDoctors();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus dokter ini?")) return;
    await fetch(`/api/doctors/${id}`, { method: "DELETE" });
    fetchDoctors();
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Perawatan"
        title="Dokter"
        description={loading ? "Memuat…" : `${doctors.length} dokter terdaftar`}
        action={
          <button onClick={openAdd} className="btn-primary">
            <Plus className="h-4 w-4" /> Tambah dokter
          </button>
        }
      />

      {loading ? (
        <div className="card">
          <Loading />
        </div>
      ) : doctors.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Stethoscope}
            title="Belum ada dokter"
            hint="Tambahkan dokter agar bisa ditugaskan ke pasien dan dijadwalkan."
            action={
              <button onClick={openAdd} className="btn-primary">
                <Plus className="h-4 w-4" /> Tambah dokter
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {doctors.map((d, i) => (
            <article
              key={d.id}
              style={{ animationDelay: `${i * 40}ms` }}
              className="group card animate-fade-up p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
            >
              <div className="flex items-start gap-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-xs font-extrabold text-brand-700">
                  {d.full_name.replace(/^dr\.?\s*/i, "").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-extrabold text-ink">{d.full_name}</h2>
                  <p className="truncate text-xs text-ink-soft">{d.specialization ?? "Dokter umum"}</p>
                  <p className="tabular mt-1 text-[11px] font-semibold text-ink-mute">{d.employee_code}</p>
                </div>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(d)}
                    title="Ubah"
                    className="grid h-8 w-8 place-items-center rounded-lg text-ink-mute transition hover:bg-canvas hover:text-ink"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    title="Hapus"
                    className="grid h-8 w-8 place-items-center rounded-lg text-ink-mute transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {(d.str_number || d.sip_number) && (
                <dl className="tabular mt-4 flex gap-5 border-t border-line pt-3 text-[11px]">
                  <div>
                    <dt className="font-semibold text-ink-mute">STR</dt>
                    <dd className="font-bold text-ink-soft">{d.str_number ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink-mute">SIP</dt>
                    <dd className="font-bold text-ink-soft">{d.sip_number ?? "—"}</dd>
                  </div>
                </dl>
              )}
            </article>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? "Ubah dokter" : "Tambah dokter"}
      >
        <FormError>{error}</FormError>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Kode pegawai</label>
              <input
                required
                value={form.employee_code}
                onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                className="field"
                placeholder="DR-001"
              />
            </div>
            <div>
              <label className="label">Nama lengkap</label>
              <input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="field"
                placeholder="dr. Siti Aminah, Sp.PD"
              />
            </div>
          </div>
          <div>
            <label className="label">Spesialisasi</label>
            <input
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              className="field"
              placeholder="Penyakit Dalam"
            />
          </div>
          {!editTarget && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y border-line py-4">
              <div>
                <label className="label">Email Akun</label>
                <input
                  required={!editTarget}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="field"
                  placeholder="dokter@medly.id"
                />
              </div>
              <div>
                <label className="label">Kata Sandi</label>
                <input
                  required={!editTarget}
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="field"
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                />
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nomor STR</label>
              <input
                value={form.str_number}
                onChange={(e) => setForm({ ...form, str_number: e.target.value })}
                className="field"
              />
            </div>
            <div>
              <label className="label">Nomor SIP</label>
              <input
                value={form.sip_number}
                onChange={(e) => setForm({ ...form, sip_number: e.target.value })}
                className="field"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
