"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, KeyRound, ShieldCheck, ShieldOff, Stethoscope, HeartPulse } from "lucide-react";
import { PageShell, PageHeader, EmptyState, Loading } from "@/src/features/shell/components/Page";
import { Modal, FormError } from "@/src/features/shell/components/Modal";
import {
  createStaffMember,
  addAccountToStaff,
  revokeStaffAccount,
  type StaffRole,
} from "@/src/features/staff/actions";
import { cn } from "@/src/lib/utils";

interface Staff {
  id: string;
  employee_code: string;
  full_name: string;
  profile_id: string | null;
  specialization?: string | null;
  str_number?: string | null;
  sip_number?: string | null;
}

const EMPTY = {
  full_name: "",
  employee_code: "",
  specialization: "",
  str_number: "",
  sip_number: "",
  withAccount: true,
  email: "",
  password: "",
};

export function StaffManager({
  role,
  endpoint,
  title,
  description,
  addLabel,
}: {
  role: StaffRole;
  endpoint: string;
  title: string;
  description: string;
  addLabel: string;
}) {
  const isDoctor = role === "DOCTOR";
  // Resolved here rather than passed in: a server page cannot hand a component
  // function across to a client component.
  const Icon = isDoctor ? Stethoscope : HeartPulse;
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const [editTarget, setEditTarget] = useState<Staff | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", employee_code: "", specialization: "", str_number: "", sip_number: "" });

  const [accountTarget, setAccountTarget] = useState<Staff | null>(null);
  const [accountForm, setAccountForm] = useState({ email: "", password: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(endpoint);
    if (res.ok) setStaff(await res.json());
    setLoading(false);
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await createStaffMember({
      role,
      fullName: form.full_name,
      employeeCode: form.employee_code,
      specialization: form.specialization,
      strNumber: form.str_number,
      sipNumber: form.sip_number,
      withAccount: form.withAccount,
      email: form.email,
      password: form.password,
    });
    setBusy(false);
    if (!res.success) return setError(res.error!);
    setShowCreate(false);
    setForm(EMPTY);
    load();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setBusy(true);
    setError("");
    const payload: Record<string, unknown> = {
      full_name: editForm.full_name,
      employee_code: editForm.employee_code,
    };
    if (isDoctor) {
      payload.specialization = editForm.specialization || null;
      payload.str_number = editForm.str_number || null;
      payload.sip_number = editForm.sip_number || null;
    }
    const res = await fetch(`${endpoint}/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) return setError((await res.json()).error ?? "Gagal menyimpan");
    setEditTarget(null);
    load();
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!accountTarget) return;
    setBusy(true);
    setError("");
    const res = await addAccountToStaff({
      role,
      staffId: accountTarget.id,
      email: accountForm.email,
      password: accountForm.password,
    });
    setBusy(false);
    if (!res.success) return setError(res.error!);
    setAccountTarget(null);
    setAccountForm({ email: "", password: "" });
    load();
  }

  async function handleRevoke(member: Staff) {
    if (!confirm(`Cabut akses login ${member.full_name}? Data stafnya tetap tersimpan.`)) return;
    const res = await revokeStaffAccount({ role, staffId: member.id });
    if (!res.success) return alert(res.error);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus data staf ini?")) return;
    await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    load();
  }

  const withAccounts = staff.filter((s) => s.profile_id).length;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Tim"
        title={title}
        description={
          loading ? "Memuat…" : `${staff.length} terdaftar · ${withAccounts} punya akses login`
        }
        action={
          <button
            onClick={() => {
              setForm(EMPTY);
              setError("");
              setShowCreate(true);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> {addLabel}
          </button>
        }
      />

      {loading ? (
        <div className="card">
          <Loading />
        </div>
      ) : staff.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Icon}
            title={`Belum ada ${isDoctor ? "dokter" : "perawat"}`}
            hint={description}
            action={
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus className="h-4 w-4" /> {addLabel}
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((m, i) => (
            <article
              key={m.id}
              style={{ animationDelay: `${i * 40}ms` }}
              className="group card animate-fade-up p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
            >
              <div className="flex items-start gap-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-xs font-extrabold text-brand-700">
                  {m.full_name.replace(/^(dr\.?|ns\.?)\s*/i, "").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-extrabold text-ink">{m.full_name}</h2>
                  {isDoctor && (
                    <p className="truncate text-xs text-ink-soft">{m.specialization ?? "Dokter umum"}</p>
                  )}
                  <p className="tabular mt-1 text-[11px] font-semibold text-ink-mute">{m.employee_code}</p>
                </div>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => {
                      setEditTarget(m);
                      setEditForm({
                        full_name: m.full_name,
                        employee_code: m.employee_code,
                        specialization: m.specialization ?? "",
                        str_number: m.str_number ?? "",
                        sip_number: m.sip_number ?? "",
                      });
                      setError("");
                    }}
                    title="Ubah"
                    className="grid h-8 w-8 place-items-center rounded-lg text-ink-mute transition hover:bg-canvas hover:text-ink"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    title="Hapus"
                    className="grid h-8 w-8 place-items-center rounded-lg text-ink-mute transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Whether this person can actually sign in is the thing that used
                  to be invisible — and the reason requests went unanswered. */}
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
                {m.profile_id ? (
                  <>
                    <span className="chip bg-brand-50 text-brand-700">
                      <ShieldCheck className="h-3 w-3" /> Bisa login
                    </span>
                    <button
                      onClick={() => handleRevoke(m)}
                      className="text-[11px] font-bold text-ink-mute transition hover:text-red-600"
                    >
                      Cabut akses
                    </button>
                  </>
                ) : (
                  <>
                    <span className="chip bg-canvas text-ink-mute">
                      <ShieldOff className="h-3 w-3" /> Tanpa akun
                    </span>
                    <button
                      onClick={() => {
                        setAccountTarget(m);
                        setAccountForm({ email: "", password: "" });
                        setError("");
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 transition hover:text-brand-700"
                    >
                      <KeyRound className="h-3 w-3" /> Buatkan akun
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ── Create ── */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={addLabel}
        description="Data staf dan akun loginnya dibuat sekaligus dan saling terhubung."
      >
        <FormError>{error}</FormError>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nama lengkap</label>
              <input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="field"
                placeholder={isDoctor ? "dr. Siti Aminah, Sp.PD" : "Ns. Rani Putri"}
              />
            </div>
            <div>
              <label className="label">Kode pegawai</label>
              <input
                required
                value={form.employee_code}
                onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                className="field"
                placeholder={isDoctor ? "DR-001" : "NS-001"}
              />
            </div>
          </div>

          {isDoctor && (
            <>
              <div>
                <label className="label">Spesialisasi</label>
                <input
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  className="field"
                  placeholder="Penyakit Dalam"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
            </>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3">
            <input
              type="checkbox"
              checked={form.withAccount}
              onChange={(e) => setForm({ ...form, withAccount: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-brand-500"
            />
            <span>
              <span className="block text-sm font-semibold text-ink">Buatkan akun login</span>
              <span className="block text-xs text-ink-mute">
                {isDoctor
                  ? "Diperlukan agar dokter bisa membuka portalnya."
                  : "Diperlukan agar perawat bisa menerima permintaan pasien."}
              </span>
            </span>
          </label>

          {form.withAccount && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="field"
                  placeholder="nama@rumahsakit.id"
                />
              </div>
              <div>
                <label className="label">Kata sandi</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="field"
                  placeholder="Min. 6 karakter"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit ── */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Ubah data staf">
        <FormError>{error}</FormError>
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nama lengkap</label>
              <input
                required
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="field"
              />
            </div>
            <div>
              <label className="label">Kode pegawai</label>
              <input
                required
                value={editForm.employee_code}
                onChange={(e) => setEditForm({ ...editForm, employee_code: e.target.value })}
                className="field"
              />
            </div>
          </div>
          {isDoctor && (
            <>
              <div>
                <label className="label">Spesialisasi</label>
                <input
                  value={editForm.specialization}
                  onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                  className="field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nomor STR</label>
                  <input
                    value={editForm.str_number}
                    onChange={(e) => setEditForm({ ...editForm, str_number: e.target.value })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="label">Nomor SIP</label>
                  <input
                    value={editForm.sip_number}
                    onChange={(e) => setEditForm({ ...editForm, sip_number: e.target.value })}
                    className="field"
                  />
                </div>
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setEditTarget(null)} className="btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Add account to existing record ── */}
      <Modal
        open={!!accountTarget}
        onClose={() => setAccountTarget(null)}
        title="Buatkan akun login"
        description={accountTarget?.full_name}
      >
        <FormError>{error}</FormError>
        <form onSubmit={handleAddAccount} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              value={accountForm.email}
              onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
              className="field"
              placeholder="nama@rumahsakit.id"
            />
          </div>
          <div>
            <label className="label">Kata sandi</label>
            <input
              type="password"
              required
              value={accountForm.password}
              onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
              className="field"
              placeholder="Min. 6 karakter"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setAccountTarget(null)} className="btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? "Membuat…" : "Buat akun"}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
