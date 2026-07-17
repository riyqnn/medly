"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
import { Pagination } from "@/src/features/shell/components/Pagination";
import type { Paged } from "@/src/features/shell/pagination";
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
  const [meta, setMeta] = useState<Paged<Content> | null>(null);
  const [page, setPage] = useState(1);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Content | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [cRes, sRes] = await Promise.all([
      fetch(`/api/spiritual?page=${page}`),
      fetch("/api/hospital-settings"),
    ]);
    if (cRes.ok) {
      const j: Paged<Content> = await cRes.json();
      setContents(j.data);
      setMeta(j);
    }
    if (sRes.ok) setEnabled((await sRes.json()).spiritual_support_enabled);
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
    if (!res.ok) return setError((await res.json()).error ?? "Couldn't save");
    setShowModal(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this content?")) return;
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
        eyebrow="Patient services · optional"
        title="Spiritual"
        description="Prayer times, murottal, daily prayers and reflections."
        action={
          <button onClick={openAdd} className="btn-primary">
            <Plus className="h-4 w-4" /> Add content
          </button>
        }
      />

      {/* The feature is opt-in per hospital. The switch itself lives in
          Pengaturan so there is only one of it; this states where the content
          currently stands. */}
      {!loading && (
        <div className="card mb-5 flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-extrabold text-ink">
              {enabled ? "Live on patient tablets" : "Hidden from patient tablets"}
            </p>
            <p className="mt-0.5 text-xs text-ink-soft">
              {enabled
                ? "Every patient in this hospital can see the Spiritual tab."
                : "The content below is saved, but patients can't see it yet."}
            </p>
          </div>
          <Link href="/dashboard/hospital/settings" className="btn-ghost shrink-0">
            Change in Settings
          </Link>
        </div>
      )}

      {loading ? (
        <div className="card">
          <Loading />
        </div>
      ) : contents.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Sparkles}
            title="No spiritual content yet"
            hint="Add prayers, murottal or reflections to accompany patients."
            action={
              <button onClick={openAdd} className="btn-primary">
                <Plus className="h-4 w-4" /> Add content
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
                    {c.is_published ? "Live" : "Draft"}
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
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      title="Delete"
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

      {meta && !loading && contents.length > 0 && (
        <div className="card mt-4">
          <Pagination
            page={meta.page}
            pages={meta.pages}
            total={meta.total}
            limit={meta.limit}
            onPage={setPage}
            noun="items"
            className="border-t-0"
          />
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? "Edit content" : "Add content"}
      >
        <FormError>{error}</FormError>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="field"
              placeholder="Prayer for healing"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
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
              <label className="label">Display order</label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="label">Body</label>
            <textarea
              rows={4}
              value={form.body_text}
              onChange={(e) => setForm({ ...form, body_text: e.target.value })}
              className="field resize-none"
            />
          </div>

          <div>
            <label className="label">Media URL</label>
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
            <span className="text-sm font-semibold text-ink">Publish to patient tablets</span>
          </label>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Menyimpan…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
