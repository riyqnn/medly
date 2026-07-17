"use client";

import { useEffect, useState } from "react";
import { Plus, HeartPulse } from "lucide-react";
import { PageShell, PageHeader, EmptyState, Loading } from "@/src/features/shell/components/Page";
import { Modal, FormError } from "@/src/features/shell/components/Modal";
import { createStaff } from "@/src/features/auth/actions";

interface NurseProfile {
  id: string;
  full_name: string;
  created_at: string;
}

const EMPTY_FORM = { full_name: "", email: "", password: "" };

export default function NursesPage() {
  const [nurses, setNurses] = useState<NurseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNurses();
  }, []);

  async function fetchNurses() {
    setLoading(true);
    // Since we don't have a dedicated API endpoint just for nurses,
    // we can fetch profiles directly if there is an API, or we can make one.
    // Wait, let's create a quick API endpoint for this or just use server actions.
    const res = await fetch("/api/nurses");
    if (res.ok) {
      setNurses(await res.json());
    }
    setLoading(false);
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    
    try {
      const result = await createStaff({
        fullName: form.full_name,
        email: form.email,
        password: form.password,
        role: "NURSE",
      });
      
      if (!result.success) {
        setError(result.error ?? "Gagal menambahkan perawat");
      } else {
        setShowModal(false);
        fetchNurses();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Perawatan"
        title="Perawat"
        description={loading ? "Memuat…" : `${nurses.length} perawat terdaftar`}
        action={
          <button onClick={openAdd} className="btn-primary">
            <Plus className="h-4 w-4" /> Tambah perawat
          </button>
        }
      />

      {loading ? (
        <div className="card">
          <Loading />
        </div>
      ) : nurses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={HeartPulse}
            title="Belum ada perawat"
            hint="Tambahkan akun perawat agar mereka bisa login dan merespons permintaan pasien."
            action={
              <button onClick={openAdd} className="btn-primary">
                <Plus className="h-4 w-4" /> Tambah perawat
              </button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/60">
                <th className="eyebrow px-6 py-3 font-bold">Nama Lengkap</th>
                <th className="eyebrow px-6 py-3 font-bold">Terdaftar pada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {nurses.map((n) => (
                <tr key={n.id} className="transition-colors hover:bg-canvas/70">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-50 text-[11px] font-extrabold text-sky-700">
                        {n.full_name.replace(/^Ns\.?\s*/i, "").slice(0, 2).toUpperCase()}
                      </span>
                      <span className="font-bold text-ink">{n.full_name}</span>
                    </div>
                  </td>
                  <td className="tabular px-6 py-4 text-ink-soft">
                    {new Date(n.created_at).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Tambah perawat"
      >
        <FormError>{error}</FormError>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nama lengkap</label>
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="field"
              placeholder="Ns. Rani Putri"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-line pt-4">
            <div>
              <label className="label">Email Akun</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field"
                placeholder="perawat@medly.id"
              />
            </div>
            <div>
              <label className="label">Kata Sandi</label>
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="field"
                placeholder="Minimal 6 karakter"
                minLength={6}
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
