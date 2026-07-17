"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Clapperboard,
  Film,
  Tv,
  Music,
  Mic,
  BookOpen,
  Newspaper,
  Gamepad2,
  Wind,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { PageShell, PageHeader, EmptyState, Loading } from "@/src/features/shell/components/Page";
import { Pagination } from "@/src/features/shell/components/Pagination";
import type { Paged } from "@/src/features/shell/pagination";
import { Modal, FormError } from "@/src/features/shell/components/Modal";
import { ENTERTAINMENT_CATEGORIES } from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface Content {
  id: string;
  title: string;
  category: string;
  is_published: boolean;
  hospital_id: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  display_order: number;
}

const ICONS: Record<string, LucideIcon> = {
  MOVIE: Film,
  TV: Tv,
  MUSIC: Music,
  PODCAST: Mic,
  EBOOK: BookOpen,
  MAGAZINE: Newspaper,
  GAME_LINK: Gamepad2,
  RELAXATION_VIDEO: Wind,
  BANNER: Megaphone,
};

const EMPTY_FORM = {
  title: "",
  category: "MOVIE",
  media_url: "",
  thumbnail_url: "",
  display_order: 0,
  is_published: true,
};

export default function EntertainmentPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [meta, setMeta] = useState<Paged<Content> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Content | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page) });
    if (filter) qs.set("category", filter);
    const res = await fetch(`/api/entertainment?${qs}`);
    if (res.ok) {
      const j: Paged<Content> = await res.json();
      setContents(j.data);
      setMeta(j);
    }
    setLoading(false);
  }, [page, filter]);

  useEffect(() => {
    load();
  }, [load]);

  // Switching category starts over; page 3 of a smaller filter is a dead end.
  useEffect(() => {
    setPage(1);
  }, [filter]);

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
      thumbnail_url: c.thumbnail_url ?? "",
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
      ? await fetch(`/api/entertainment/${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      : await fetch("/api/entertainment", {
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
    await fetch(`/api/entertainment/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePublish(c: Content) {
    if (!c.hospital_id) return;
    await fetch(`/api/entertainment/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !c.is_published }),
    });
    load();
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Patient services"
        title="Entertainment"
        description="Films, music, books and more to fill the hours."
        action={
          <button onClick={openAdd} className="btn-primary">
            <Plus className="h-4 w-4" /> Add content
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("")}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
            !filter
              ? "border-brand-500 bg-brand-500 text-white"
              : "border-line bg-white text-ink-soft hover:border-brand-200 hover:bg-brand-50"
          )}
        >
          All
        </button>
        {Object.entries(ENTERTAINMENT_CATEGORIES).map(([key, c]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
              filter === key
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-line bg-white text-ink-soft hover:border-brand-200 hover:bg-brand-50"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card">
          <Loading />
        </div>
      ) : contents.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Clapperboard}
            title="No content yet"
            hint="Add films, music, books or games for patients."
            action={
              <button onClick={openAdd} className="btn-primary">
                <Plus className="h-4 w-4" /> Add content
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {contents.map((c, i) => {
            const Icon = ICONS[c.category] ?? Film;
            return (
              <article
                key={c.id}
                style={{ animationDelay: `${i * 40}ms` }}
                className="group card flex animate-fade-up flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="relative grid aspect-[16/10] place-items-center overflow-hidden bg-brand-50">
                  {c.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon className="h-8 w-8 text-brand-300" strokeWidth={1.5} />
                  )}
                  {!c.hospital_id && (
                    <span className="absolute left-3 top-3 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-extrabold text-violet-700">
                      Global
                    </span>
                  )}
                  <button
                    onClick={() => togglePublish(c)}
                    disabled={!c.hospital_id}
                    className={cn(
                      "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-sm transition disabled:cursor-not-allowed",
                      c.is_published ? "bg-brand-500 text-white" : "bg-white text-ink-mute"
                    )}
                  >
                    {c.is_published ? "Live" : "Draft"}
                  </button>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p className="text-[11px] font-bold text-ink-mute">
                    {ENTERTAINMENT_CATEGORIES[c.category]?.label ?? c.category} · urutan {c.display_order}
                  </p>
                  <h2 className="mt-0.5 line-clamp-2 text-sm font-extrabold leading-snug text-ink">{c.title}</h2>

                  {c.hospital_id && (
                    <div className="mt-auto flex gap-2 pt-4">
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
                </div>
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
              placeholder="Playlist relaksasi"
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
                {Object.entries(ENTERTAINMENT_CATEGORIES).map(([key, c]) => (
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
            <label className="label">Media URL</label>
            <input
              value={form.media_url}
              onChange={(e) => setForm({ ...form, media_url: e.target.value })}
              className="field"
              placeholder="https://…"
            />
          </div>

          <div>
            <label className="label">Thumbnail URL</label>
            <input
              value={form.thumbnail_url}
              onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
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
