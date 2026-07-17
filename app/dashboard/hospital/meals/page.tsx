"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, UtensilsCrossed } from "lucide-react";
import { PageShell, PageHeader, EmptyState, Loading } from "@/src/features/shell/components/Page";
import { Pagination } from "@/src/features/shell/components/Pagination";
import type { Paged } from "@/src/features/shell/pagination";
import { Modal, FormError } from "@/src/features/shell/components/Modal";
import { MEAL_SCHEDULES, formatRupiah } from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface Meal {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  meal_type_tags: string[];
  is_available: boolean;
  meal_categories?: { name: string };
}
interface Category {
  id: string;
  name: string;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  price: 0,
  category_id: "",
  image_url: "",
  meal_type_tags: [] as string[],
  is_available: true,
};

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [meta, setMeta] = useState<Paged<Meal> | null>(null);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Meal | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    // Categories stay unpaginated — they fill the form's select, so a partial
    // page would quietly hide options.
    const [mRes, cRes] = await Promise.all([
      fetch(`/api/meals?page=${page}`),
      fetch("/api/meal-categories"),
    ]);
    if (mRes.ok) {
      const j: Paged<Meal> = await mRes.json();
      setMeals(j.data);
      setMeta(j);
    }
    if (cRes.ok) setCategories(await cRes.json());
    setLoading(false);
  }, [page]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function openEdit(m: Meal) {
    setEditTarget(m);
    setForm({
      name: m.name,
      description: m.description ?? "",
      price: m.price ?? 0,
      category_id: "",
      image_url: m.image_url ?? "",
      meal_type_tags: m.meal_type_tags ?? [],
      is_available: m.is_available,
    });
    setError("");
    setShowModal(true);
  }

  function toggleTag(tag: string) {
    setForm((f) => ({
      ...f,
      meal_type_tags: f.meal_type_tags.includes(tag)
        ? f.meal_type_tags.filter((t) => t !== tag)
        : [...f.meal_type_tags, tag],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = editTarget
      ? await fetch(`/api/meals/${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      : await fetch("/api/meals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error ?? "Gagal menyimpan");
    setShowModal(false);
    loadAll();
  }

  async function toggleAvailability(m: Meal) {
    await fetch(`/api/meals/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_available: !m.is_available }),
    });
    loadAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus menu ini?")) return;
    await fetch(`/api/meals/${id}`, { method: "DELETE" });
    loadAll();
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Layanan pasien"
        title="Menu Makanan"
        description="Menu yang tersedia muncul di tablet pasien sesuai sesi makannya."
        action={
          <button onClick={openAdd} className="btn-primary">
            <Plus className="h-4 w-4" /> Tambah menu
          </button>
        }
      />

      {loading ? (
        <div className="card">
          <Loading />
        </div>
      ) : meals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={UtensilsCrossed}
            title="Belum ada menu"
            hint="Tambahkan menu agar pasien bisa memesan makanan dari tabletnya."
            action={
              <button onClick={openAdd} className="btn-primary">
                <Plus className="h-4 w-4" /> Tambah menu
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {meals.map((m, i) => (
            <article
              key={m.id}
              style={{ animationDelay: `${i * 40}ms` }}
              className="group card flex animate-fade-up flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-50">
                {m.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.image_url} alt={m.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <UtensilsCrossed className="h-10 w-10 text-brand-300" strokeWidth={1.4} />
                  </div>
                )}
                <button
                  onClick={() => toggleAvailability(m)}
                  title={m.is_available ? "Tersedia — klik untuk sembunyikan" : "Disembunyikan — klik untuk tampilkan"}
                  className={cn(
                    "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-sm transition",
                    m.is_available ? "bg-brand-500 text-white" : "bg-white text-ink-mute"
                  )}
                >
                  {m.is_available ? "Tersedia" : "Disembunyikan"}
                </button>
              </div>

              <div className="flex flex-1 flex-col p-4">
                {m.meal_categories?.name && (
                  <p className="text-[11px] font-bold text-ink-mute">{m.meal_categories.name}</p>
                )}
                <h2 className="text-sm font-extrabold leading-snug text-ink">{m.name}</h2>
                {m.description && <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{m.description}</p>}

                <p className="tabular mt-2 text-sm font-extrabold text-brand-600">{formatRupiah(m.price)}</p>

                {m.meal_type_tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.meal_type_tags.map((t) => (
                      <span key={t} className="rounded-md bg-canvas px-1.5 py-0.5 text-[10px] font-bold text-ink-soft">
                        {MEAL_SCHEDULES.find((s) => s.value === t)?.label ?? t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex gap-2 pt-4">
                  <button onClick={() => openEdit(m)} className="btn-ghost flex-1 px-3 py-2 text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Ubah
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    title="Hapus"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line text-ink-mute transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {meta && !loading && meals.length > 0 && (
        <div className="card mt-4">
          <Pagination
            page={meta.page}
            pages={meta.pages}
            total={meta.total}
            limit={meta.limit}
            onPage={setPage}
            noun="menu"
            className="border-t-0"
          />
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editTarget ? "Ubah menu" : "Tambah menu"}>
        <FormError>{error}</FormError>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nama menu</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="field"
              placeholder="Bubur ayam"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Harga (Rp)</label>
              <input
                type="number"
                min={0}
                step={500}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="field"
              />
              <p className="mt-1.5 text-xs text-ink-mute">Isi 0 jika termasuk paket perawatan.</p>
            </div>
            <div>
              <label className="label">Kategori</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="field"
              >
                <option value="">Tanpa kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Deskripsi</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="field resize-none"
            />
          </div>

          <div>
            <label className="label">Gambar Makanan</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                setError("");
                try {
                  const fd = new FormData();
                  fd.append("file", file);
                  const res = await fetch("/api/upload", { method: "POST", body: fd });
                  if (res.ok) {
                    const data = await res.json();
                    setForm({ ...form, image_url: data.url });
                  } else {
                    const err = await res.json();
                    setError(err.error || "Gagal mengunggah gambar");
                  }
                } catch (err: any) {
                  setError(err.message || "Gagal mengunggah gambar");
                } finally {
                  setUploading(false);
                }
              }}
              className="block w-full text-sm text-ink-soft file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2.5 file:text-sm file:font-extrabold file:text-brand-700 hover:file:bg-brand-100"
            />
            {uploading && <p className="mt-2 text-xs font-semibold text-brand-600 animate-pulse">Mengunggah ke Pinata (IPFS)...</p>}
            {form.image_url && (
              <div className="mt-3 overflow-hidden rounded-xl border border-line bg-canvas">
                <img
                  src={form.image_url}
                  alt="Preview"
                  className="aspect-video w-full object-contain"
                />
              </div>
            )}
          </div>

          <div>
            <span className="label">Tersedia pada sesi</span>
            <div className="flex gap-2">
              {MEAL_SCHEDULES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleTag(s.value)}
                  aria-pressed={form.meal_type_tags.includes(s.value)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-[0.97]",
                    form.meal_type_tags.includes(s.value)
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-line bg-white text-ink-soft hover:border-brand-200 hover:bg-brand-50"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-mute">Kosongkan agar tampil di semua sesi.</p>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
              className="h-4 w-4 accent-brand-500"
            />
            <span className="text-sm font-semibold text-ink">Tampilkan di tablet pasien</span>
          </label>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={saving || uploading} className="btn-primary">
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
