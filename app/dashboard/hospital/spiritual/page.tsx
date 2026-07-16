"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Clock,
  Music2,
  BookOpenText,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { PageShell, PageHeader, EmptyState, Loading } from "@/src/features/shell/components/Page";
import { Modal, FormError } from "@/src/features/shell/components/Modal";
import { SPIRITUAL_CATEGORIES } from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface Content {
  id: string;
  title: string;
  category: string;
  is_published: boolean;
  hospital_id: string | null;
  media_url: string | null;
  body_text: string | null;
  display_order: number;
}

const ICONS: Record<string, LucideIcon> = {
  PRAYER_TIME: Clock,
  MUROTTAL: Music2,
  DAILY_PRAYER: BookOpenText,
  REFLECTION: Sparkles,
  OTHER: HelpCircle,
};

const EMPTY_FORM = {
  title: "",
  category: "PRAYER_TIME",
  media_url: "",
  body_text: "",
  display_order: 0,
  is_published: true,
};

export default function SpiritualPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [togglingEnabled, setTogglingEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Content | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [cRes, sRes] = await Promise.all([fetch("/api/spiritual"), fetch("/api/hospital-settings")]);
    if (cRes.ok) setContents(await cRes.json());
    if (sRes.ok) setEnabled((await sRes.json()).spiritual_support_enabled);
    setLoading(false);
  }

  async function toggleEnabled() {
    setTogglingEnabled(true);
    const res = await fetch("/api/hospital-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spiritual_support_enabled: !enabled }),
    });
    if (res.ok) setEnabled(!enabled);
    setTogglingEnabled(false);
  }

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function openEdit(c: Content) {
    setEditTarget(c);
    setForm({
      title: c.title,
      category: c.category,
      media_url: c.media_url ?? "",
      body_text: c.body_text ?? "",
      display_order: c.display_order,
      is_published: c.is_published,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = editTarget
      ? await fetch(`/api/spiritual/${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      : await fetch("/api/spiritual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error ?? "Gagal menyimpan");
    setShowModal(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus konten ini?")) return;
    await fetch(`/api/spiritual/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePublish(c: Content) {
    if (!c.hospital_id) return;
    await fetch(`/api/spiritual/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !c.is_published }),
    });
    load();
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Layanan pasien · opsional"
        title="Kerohanian"
        description="Jadwal sholat, murottal, doa harian, dan renungan."
        action={
          <button onClick={openAdd} className="btn-primary">
            <Plus className="h-4 w-4" /> Tambah konten
          </button>
        }
      />

      {/* The feature is opt-in per hospital, so the switch leads the page. */}
      <div className="card mb-5 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-extrabold text-ink">Tampilkan di tablet pasien</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {enabled
              ? "Tab Kerohanian terlihat oleh semua pasien rumah sakit ini."
              : "Tab Kerohanian disembunyikan dari tablet pasien."}
          </p>
        </div>
        <button
          onClick={toggleEnabled}
          disabled={togglingEnabled || loading}
          role="switch"
          aria-checked={enabled}
          aria-label="Tampilkan kerohanian di tablet pasien"
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50",
            enabled ? "bg-brand-500" : "bg-line"
          )}
        >
          <span
            className={cn(
              "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
              enabled ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      {loading ? (
        <div className="card">
          <Loading />
        </div>
      ) : contents.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Sparkles}
            title="Belum ada konten kerohanian"
            hint="Tambahkan doa, murottal, atau renungan untuk mendampingi pasien."
            action={
              <button onClick={openAdd} className="btn-primary">
                <Plus className="h-4 w-4" /> Tambah konten
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contents.map((c, i) => {
            const Icon = ICONS[c.category] ?? HelpCircle;
            return (
              <article
                key={c.id}
                style={{ animationDelay: `${i * 40}ms` }}
                className="group card animate-fade-up p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <Icon className="h-4.5 w-4.5" strokeWidth={2.1} />
                  </span>
                  <button
                    onClick={() => togglePublish(c)}
                    disabled={!c.hospital_id}
                    className={cn(
                      "chip transition disabled:cursor-not-allowed disabled:opacity-60",
                      c.is_published ? "bg-brand-50 text-brand-700" : "bg-canvas text-ink-mute"
                    )}
                  >
                    {c.is_published ? "Tayang" : "Draf"}
                  </button>
                </div>

                <p className="mt-4 text-[11px] font-bold text-ink-mute">
                  {SPIRITUAL_CATEGORIES[c.category]?.label ?? c.category}
                </p>
                <h2 className="text-sm font-extrabold leading-snug text-ink">{c.title}</h2>
                {c.body_text && <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{c.body_text}</p>}

                {c.hospital_id && (
                  <div className="mt-4 flex gap-2 border-t border-line pt-3">
                    <button onClick={() => openEdit(c)} className="btn-ghost flex-1 px-3 py-2 text-xs">
                      <Pencil className="h-3.5 w-3.5" /> Ubah
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      title="Hapus"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line text-ink-mute transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? "Ubah konten" : "Tambah konten"}
      >
        <FormError>{error}</FormError>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Judul</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="field"
              placeholder="Doa kesembuhan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="field"
              >
                {Object.entries(SPIRITUAL_CATEGORIES).map(([key, c]) => (
                  <option key={key} value={key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Urutan tampil</label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="label">Isi</label>
            <textarea
              rows={4}
              value={form.body_text}
              onChange={(e) => setForm({ ...form, body_text: e.target.value })}
              className="field resize-none"
            />
          </div>

          <div>
            <label className="label">URL media</label>
            <input
              value={form.media_url}
              onChange={(e) => setForm({ ...form, media_url: e.target.value })}
              className="field"
              placeholder="https://…"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              className="h-4 w-4 accent-brand-500"
            />
            <span className="text-sm font-semibold text-ink">Tayangkan di tablet pasien</span>
          </label>

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
