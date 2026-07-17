"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  FileText,
  Video,
  File,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";
import { PageShell, PageHeader, EmptyState, Loading } from "@/src/features/shell/components/Page";
import { Modal, FormError } from "@/src/features/shell/components/Modal";
import { Pagination } from "@/src/features/shell/components/Pagination";
import type { Paged } from "@/src/features/shell/pagination";
import { EDUCATION_TYPES } from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface Content {
  id: string;
  title: string;
  content_type: string;
  is_published: boolean;
  hospital_id: string | null;
  media_url: string | null;
  body_text: string | null;
  education_categories?: { name: string };
}

const ICONS: Record<string, LucideIcon> = {
  ARTICLE: FileText,
  VIDEO: Video,
  PDF: File,
  INFOGRAPHIC: ImageIcon,
};

const EMPTY_FORM = {
  title: "",
  content_type: "ARTICLE",
  body_text: "",
  media_url: "",
  category_id: "",
  is_published: true,
};

export default function EducationPage() {
  const [list, setList] = useState<Paged<Content> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Content | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const contents = list?.data ?? [];

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/education?page=${page}`);
    if (r.ok) setList(await r.json());
    setLoading(false);
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

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
      content_type: c.content_type,
      // Carry the existing article body into the form — saving without it
      // would blank the text that patients read.
      body_text: c.body_text ?? "",
      media_url: c.media_url ?? "",
      category_id: "",
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
      ? await fetch(`/api/education/${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      : await fetch("/api/education", {
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
    await fetch(`/api/education/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePublish(c: Content) {
    if (!c.hospital_id) return;
    await fetch(`/api/education/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !c.is_published }),
    });
    load();
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Layanan pasien"
        title="Edukasi"
        description="Konten yang dipublikasikan tampil di tablet pasien."
        action={
          <button onClick={openAdd} className="btn-primary">
            <Plus className="h-4 w-4" /> Tambah konten
          </button>
        }
      />

      <div className="card overflow-hidden">
        {loading ? (
          <Loading />
        ) : contents.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Belum ada konten edukasi"
            hint="Tambahkan artikel, video, atau infografik yang relevan dengan pasien Anda."
            action={
              <button onClick={openAdd} className="btn-primary">
                <Plus className="h-4 w-4" /> Tambah konten
              </button>
            }
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/60">
                <th className="eyebrow px-6 py-3 font-bold">Judul</th>
                <th className="eyebrow px-6 py-3 font-bold">Jenis</th>
                <th className="eyebrow px-6 py-3 font-bold">Sumber</th>
                <th className="eyebrow px-6 py-3 font-bold">Status</th>
                <th className="eyebrow px-6 py-3 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {contents.map((c) => {
                const Icon = ICONS[c.content_type] ?? FileText;
                return (
                  <tr key={c.id} className="group transition-colors hover:bg-canvas/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                          <Icon className="h-4 w-4" strokeWidth={2.1} />
                        </span>
                        <span className="font-bold text-ink">{c.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-ink-soft">
                      {EDUCATION_TYPES[c.content_type]?.label ?? c.content_type}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "chip",
                          c.hospital_id ? "bg-canvas text-ink-soft" : "bg-violet-50 text-violet-700"
                        )}
                      >
                        {c.hospital_id ? "Rumah sakit" : "Global"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePublish(c)}
                        disabled={!c.hospital_id}
                        title={c.hospital_id ? "Klik untuk mengubah" : "Konten global tidak dapat diubah"}
                        className={cn(
                          "chip transition disabled:cursor-not-allowed disabled:opacity-60",
                          c.is_published ? "bg-brand-50 text-brand-700" : "bg-canvas text-ink-mute"
                        )}
                      >
                        {c.is_published ? "Tayang" : "Draf"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {c.hospital_id && (
                        <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={() => openEdit(c)}
                            title="Ubah"
                            className="grid h-8 w-8 place-items-center rounded-lg text-ink-mute transition hover:bg-white hover:text-ink"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            title="Hapus"
                            className="grid h-8 w-8 place-items-center rounded-lg text-ink-mute transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {list && !loading && contents.length > 0 && (
          <Pagination
            page={list.page}
            pages={list.pages}
            total={list.total}
            limit={list.limit}
            onPage={setPage}
            noun="konten"
          />
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? "Ubah konten" : "Tambah konten"}
        width="max-w-lg"
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
              placeholder="Tips pemulihan pasca operasi"
            />
          </div>

          <div>
            <span className="label">Jenis konten</span>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(EDUCATION_TYPES).map(([key, t]) => {
                const Icon = ICONS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, content_type: key })}
                    aria-pressed={form.content_type === key}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-[11px] font-bold transition active:scale-[0.97]",
                      form.content_type === key
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-line bg-white text-ink-soft hover:border-brand-200 hover:bg-brand-50"
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.1} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">
              URL media {form.content_type === "ARTICLE" ? "(opsional)" : ""}
            </label>
            <input
              value={form.media_url}
              onChange={(e) => setForm({ ...form, media_url: e.target.value })}
              className="field"
              placeholder="https://…"
            />
          </div>

          <div>
            <label className="label">
              Isi {form.content_type === "ARTICLE" ? "artikel" : "keterangan"}
            </label>
            <textarea
              value={form.body_text}
              onChange={(e) => setForm({ ...form, body_text: e.target.value })}
              rows={form.content_type === "ARTICLE" ? 5 : 3}
              className="field resize-none"
              placeholder="Tulis dengan bahasa yang mudah dipahami pasien…"
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
