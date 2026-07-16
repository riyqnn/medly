"use client";

import { useEffect, useState } from "react";
import { PlusIcon, X } from "lucide-react";

interface Content {
  id: string;
  title: string;
  content_type: string;
  is_published: boolean;
  hospital_id: string | null;
  media_url: string | null;
  education_categories?: { name: string };
}

const TYPES = ["ARTICLE", "VIDEO", "PDF"];
const EMPTY_FORM = { title: "", content_type: "ARTICLE", body_text: "", media_url: "", category_id: "", is_published: true };

export default function EducationPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Content | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/education");
    if (res.ok) setContents(await res.json());
    setLoading(false);
  }

  function openAdd() { setEditTarget(null); setForm(EMPTY_FORM); setError(""); setShowModal(true); }
  function openEdit(c: Content) {
    setEditTarget(c);
    setForm({ title: c.title, content_type: c.content_type, body_text: "", media_url: c.media_url || "", category_id: "", is_published: c.is_published });
    setError(""); setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = editTarget
      ? await fetch(`/api/education/${editTarget.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/education", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); setSaving(false); return; }
    setShowModal(false); load();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this content?")) return;
    await fetch(`/api/education/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePublish(c: Content) {
    if (!c.hospital_id) return; // Can't edit global
    await fetch(`/api/education/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_published: !c.is_published }) });
    load();
  }

  const TYPE_ICON: Record<string, string> = { ARTICLE: "📄", VIDEO: "🎬", PDF: "📋" };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Education Management</h1>
          <p className="text-sm text-gray-500 mt-1">Health articles and videos for Medly tablets</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <PlusIcon className="w-5 h-5" /> Upload Content
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Scope</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center">Loading...</td></tr>
            ) : contents.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No content yet</td></tr>
            ) : contents.map(c => (
              <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{TYPE_ICON[c.content_type]} {c.title}</td>
                <td className="px-6 py-4">{c.content_type}</td>
                <td className="px-6 py-4">
                  {c.hospital_id ? <span className="text-blue-600 text-xs font-bold">LOCAL</span> : <span className="text-purple-600 text-xs font-bold">GLOBAL</span>}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => togglePublish(c)} disabled={!c.hospital_id}
                    className={`px-2 py-1 text-xs font-semibold rounded-md ${c.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"} disabled:cursor-not-allowed`}>
                    {c.is_published ? "Published" : "Draft"}
                  </button>
                </td>
                <td className="px-6 py-4 text-right flex gap-3 justify-end">
                  {c.hospital_id && <>
                    <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:underline">Delete</button>
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editTarget ? "Edit Content" : "Upload Content"}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-3 rounded-lg">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Title *</label>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Content Type *</label>
                <select value={form.content_type} onChange={e => setForm({...form, content_type: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Media URL {form.content_type !== "ARTICLE" ? "*" : "(optional)"}</label>
                <input value={form.media_url} onChange={e => setForm({...form, media_url: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" placeholder="https://..." />
              </div>
              {form.content_type === "ARTICLE" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Article Body</label>
                  <textarea value={form.body_text} onChange={e => setForm({...form, body_text: e.target.value})} rows={4} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="pub" checked={form.is_published} onChange={e => setForm({...form, is_published: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="pub" className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</label>
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
