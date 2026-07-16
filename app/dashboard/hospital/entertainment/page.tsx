"use client";

import { useEffect, useState } from "react";
import { PlusIcon, X } from "lucide-react";

interface Content {
  id: string;
  title: string;
  category: string;
  is_published: boolean;
  hospital_id: string | null;
  media_url: string | null;
  display_order: number;
}

const CATEGORIES = ["MOVIE", "TV", "MUSIC", "PODCAST", "EBOOK", "MAGAZINE", "GAME_LINK", "RELAXATION_VIDEO", "BANNER"];
const CAT_ICON: Record<string, string> = { MOVIE: "🎬", TV: "📺", MUSIC: "🎵", PODCAST: "🎙️", EBOOK: "📖", MAGAZINE: "📰", GAME_LINK: "🎮", RELAXATION_VIDEO: "🌿", BANNER: "📢" };
const EMPTY_FORM = { title: "", category: "MOVIE", media_url: "", display_order: 0, is_published: true };

export default function EntertainmentPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Content | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterCat, setFilterCat] = useState("");

  useEffect(() => { load(); }, [filterCat]);

  async function load() {
    setLoading(true);
    const url = filterCat ? `/api/entertainment?category=${filterCat}` : "/api/entertainment";
    const res = await fetch(url);
    if (res.ok) setContents(await res.json());
    setLoading(false);
  }

  function openAdd() { setEditTarget(null); setForm(EMPTY_FORM); setError(""); setShowModal(true); }
  function openEdit(c: Content) {
    setEditTarget(c);
    setForm({ title: c.title, category: c.category, media_url: c.media_url || "", display_order: c.display_order, is_published: c.is_published });
    setError(""); setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = editTarget
      ? await fetch(`/api/entertainment/${editTarget.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/entertainment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); setSaving(false); return; }
    setShowModal(false); load();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this content?")) return;
    await fetch(`/api/entertainment/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePublish(c: Content) {
    if (!c.hospital_id) return;
    await fetch(`/api/entertainment/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_published: !c.is_published }) });
    load();
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entertainment Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage movies, music, banners and more</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <PlusIcon className="w-5 h-5" /> Add Media
        </button>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setFilterCat("")} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${!filterCat ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 dark:border-gray-600"}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${filterCat === c ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
            {CAT_ICON[c]} {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {loading ? (
          <div className="col-span-full text-center text-gray-400 py-12">Loading...</div>
        ) : contents.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">No content yet. Add some!</div>
        ) : contents.map(c => (
          <div key={c.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded-md font-medium">{CAT_ICON[c.category]} {c.category}</span>
                {!c.hospital_id && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">GLOBAL</span>}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{c.title}</h3>
              {c.media_url && <a href={c.media_url} target="_blank" className="text-xs text-blue-500 hover:underline mt-1 block truncate">{c.media_url}</a>}
              <p className="text-xs text-gray-400 mt-1">Order: {c.display_order}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center gap-2">
              <button onClick={() => togglePublish(c)} disabled={!c.hospital_id}
                className={`text-xs font-semibold px-2 py-1 rounded ${c.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"} disabled:cursor-not-allowed`}>
                {c.is_published ? "Published" : "Hidden"}
              </button>
              {c.hospital_id && (
                <div className="flex gap-2">
                  <button onClick={() => openEdit(c)} className="text-sm text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-sm text-red-500 hover:underline">Del</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editTarget ? "Edit Media" : "Add Media"}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-3 rounded-lg">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Title *</label>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Display Order</label>
                  <input type="number" value={form.display_order} onChange={e => setForm({...form, display_order: Number(e.target.value)})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Media URL</label>
                <input value={form.media_url} onChange={e => setForm({...form, media_url: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" placeholder="https://..." />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="epub" checked={form.is_published} onChange={e => setForm({...form, is_published: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="epub" className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</label>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
