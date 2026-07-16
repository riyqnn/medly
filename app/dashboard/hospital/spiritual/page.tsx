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
  body_text: string | null;
  display_order: number;
}

const CATEGORIES = ["PRAYER_TIME", "MUROTTAL", "DAILY_PRAYER", "REFLECTION", "OTHER"];
const CAT_ICON: Record<string, string> = { PRAYER_TIME: "🕌", MUROTTAL: "🎧", DAILY_PRAYER: "🤲", REFLECTION: "✨", OTHER: "📿" };
const EMPTY_FORM = { title: "", category: "PRAYER_TIME", media_url: "", body_text: "", display_order: 0, is_published: true };

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

  useEffect(() => { load(); }, []);

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

  function openAdd() { setEditTarget(null); setForm(EMPTY_FORM); setError(""); setShowModal(true); }
  function openEdit(c: Content) {
    setEditTarget(c);
    setForm({ title: c.title, category: c.category, media_url: c.media_url || "", body_text: c.body_text || "", display_order: c.display_order, is_published: c.is_published });
    setError(""); setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = editTarget
      ? await fetch(`/api/spiritual/${editTarget.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/spiritual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); setSaving(false); return; }
    setShowModal(false); load();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this content?")) return;
    await fetch(`/api/spiritual/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePublish(c: Content) {
    if (!c.hospital_id) return;
    await fetch(`/api/spiritual/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_published: !c.is_published }) });
    load();
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Spiritual Support</h1>
          <p className="text-sm text-gray-500 mt-1">Optional feature — jadwal sholat, murottal, doa, renungan</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <PlusIcon className="w-5 h-5" /> Add Content
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Tampilkan di aplikasi pasien</p>
          <p className="text-xs text-gray-500 mt-0.5">Jika nonaktif, tab "Kerohanian" tidak akan muncul di screen tablet pasien.</p>
        </div>
        <button
          onClick={toggleEnabled}
          disabled={togglingEnabled || loading}
          className={`relative w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${enabled ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"}`}
        >
          <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
        </button>
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
              {c.body_text && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.body_text}</p>}
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
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editTarget ? "Edit Content" : "Add Content"}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-3 rounded-lg">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Title *</label>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category *</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Text / Isi</label>
                <textarea value={form.body_text} onChange={e => setForm({...form, body_text: e.target.value})} rows={3} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Media URL</label>
                <input value={form.media_url} onChange={e => setForm({...form, media_url: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" placeholder="https://..." />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="spub" checked={form.is_published} onChange={e => setForm({...form, is_published: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="spub" className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</label>
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
