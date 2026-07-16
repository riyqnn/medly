"use client";

import { useEffect, useState } from "react";
import { PlusIcon, X } from "lucide-react";

interface Meal {
  id: string;
  name: string;
  description: string | null;
  price: number;
  meal_type_tags: string[];
  is_available: boolean;
  meal_categories?: { name: string };
}
interface Category { id: string; name: string; }

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER"];
const EMPTY_FORM = { name: "", description: "", price: 0, category_id: "", meal_type_tags: [] as string[], is_available: true };

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Meal | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [mRes, cRes] = await Promise.all([fetch("/api/meals"), fetch("/api/meal-categories")]);
    if (mRes.ok) setMeals(await mRes.json());
    if (cRes.ok) setCategories(await cRes.json());
    setLoading(false);
  }

  function openAdd() { setEditTarget(null); setForm(EMPTY_FORM); setError(""); setShowModal(true); }
  function openEdit(m: Meal) {
    setEditTarget(m);
    setForm({ name: m.name, description: m.description || "", price: m.price ?? 0, category_id: "", meal_type_tags: m.meal_type_tags || [], is_available: m.is_available });
    setError(""); setShowModal(true);
  }

  function toggleTag(tag: string) {
    setForm(f => ({ ...f, meal_type_tags: f.meal_type_tags.includes(tag) ? f.meal_type_tags.filter(t => t !== tag) : [...f.meal_type_tags, tag] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = editTarget
      ? await fetch(`/api/meals/${editTarget.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/meals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); setSaving(false); return; }
    setShowModal(false); loadAll();
    setSaving(false);
  }

  async function toggleAvailability(m: Meal) {
    await fetch(`/api/meals/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_available: !m.is_available }) });
    loadAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this menu item?")) return;
    await fetch(`/api/meals/${id}`, { method: "DELETE" });
    loadAll();
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meal Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage food menus and availability</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <PlusIcon className="w-5 h-5" /> Add Menu Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {loading ? (
          <div className="col-span-full text-center text-gray-400 py-12">Loading menus...</div>
        ) : meals.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">No menu items yet. Add one!</div>
        ) : meals.map(m => (
          <div key={m.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col">
            <div className="h-36 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
              <span className="text-4xl">🍽️</span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">{m.meal_categories?.name || "General"}</span>
                <button onClick={() => toggleAvailability(m)} className={`w-3 h-3 rounded-full mt-1 ${m.is_available ? "bg-green-500" : "bg-red-400"}`} title={m.is_available ? "Available (click to disable)" : "Unavailable (click to enable)"} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">{m.name}</h3>
              <p className="text-sm font-semibold text-blue-600 mt-0.5">Rp {Number(m.price ?? 0).toLocaleString("id-ID")}</p>
              {m.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{m.description}</p>}
              <div className="mt-2 flex gap-1 flex-wrap">
                {m.meal_type_tags?.map(t => <span key={t} className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-1.5 py-0.5 rounded">{t}</span>)}
              </div>
              <div className="mt-auto pt-3 flex gap-2">
                <button onClick={() => openEdit(m)} className="flex-1 text-sm py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Edit</button>
                <button onClick={() => handleDelete(m.id)} className="px-3 py-1.5 text-sm text-red-500 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editTarget ? "Edit Menu Item" : "Add Menu Item"}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-3 rounded-lg">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Menu Name *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Harga (Rp)</label>
                <input type="number" min={0} step={500} value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Meal Type Tags</label>
                <div className="flex gap-2">
                  {MEAL_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => toggleTag(t)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${form.meal_type_tags.includes(t) ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="avail" checked={form.is_available} onChange={e => setForm({...form, is_available: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="avail" className="text-sm text-gray-700 dark:text-gray-300">Available for ordering</label>
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
