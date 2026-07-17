"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { PageShell, PageHeader, Loading } from "@/src/features/shell/components/Page";
import { FormError } from "@/src/features/shell/components/Modal";
import { ImageUpload } from "@/src/features/shell/components/ImageUpload";
import { BrandMark } from "@/src/features/shell/components/Brand";
import { cn } from "@/src/lib/utils";

interface Hospital {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  logo_url: string | null;
  spiritual_support_enabled: boolean;
}

export default function HospitalSettingsPage() {
  const [form, setForm] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/hospital-settings");
      if (res.ok) setForm(await res.json());
      setLoading(false);
    })();
  }, []);

  function set<K extends keyof Hospital>(key: K, value: Hospital[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/hospital-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        code: form.code,
        address: form.address,
        logo_url: form.logo_url,
        spiritual_support_enabled: form.spiritual_support_enabled,
      }),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error ?? "Couldn't save");
    setSaved(true);
    // The sidebar reads the name and logo on the server, so a refresh is what
    // makes the new identity actually appear.
    setTimeout(() => window.location.reload(), 600);
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Hospital"
        title="Settings"
        description="The hospital identity shown on the dashboard, the staff portals and patient tablets."
      />

      {loading || !form ? (
        <div className="card">
          <Loading label="Loading settings…" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          <div className="card space-y-4 p-6">
            <FormError>{error}</FormError>

            <div>
              <label className="label">Hospital name</label>
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="field"
                placeholder="RS Mayapada"
              />
            </div>

            <div>
              <label className="label">Hospital code</label>
              <input
                value={form.code ?? ""}
                onChange={(e) => set("code", e.target.value)}
                className="field"
                placeholder="MYP"
              />
              <p className="mt-1.5 text-xs text-ink-mute">
                A short internal code, unique across hospitals.
              </p>
            </div>

            <div>
              <label className="label">Address</label>
              <textarea
                value={form.address ?? ""}
                onChange={(e) => set("address", e.target.value)}
                rows={3}
                className="field resize-none"
                placeholder="Jl. Lebak Bulus I Kav. 29, Jakarta Selatan"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 transition hover:border-brand-200 hover:bg-brand-50/40">
              <input
                type="checkbox"
                checked={form.spiritual_support_enabled}
                onChange={(e) => set("spiritual_support_enabled", e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-500"
              />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                  <Sparkles className="h-3.5 w-3.5 text-brand-500" /> Spiritual support
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                  Shows the spiritual menu on patient tablets. Turn it off if your hospital doesn’t offer this service.
                </span>
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
              {saved && (
                <span className="chip bg-brand-50 text-brand-700">
                  <Check className="h-3 w-3" /> Tersimpan
                </span>
              )}
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Menyimpan…" : "Save changes"}
              </button>
            </div>
          </div>

          <div className="card h-fit space-y-4 p-6">
            <ImageUpload
              value={form.logo_url ?? ""}
              onChange={(url) => set("logo_url", url || null)}
              label="Hospital logo"
              hint="Transparent PNG, 2 MB max. Leave empty to use the Medly mark."
              preview="square"
            />

            {/* Shows the logo at the size it will actually be used, so a wordmark
                that turns to mush at 40px is caught before saving. */}
            <div>
              <span className="label">Pratinjau sidebar</span>
              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-white p-3">
                <BrandMark src={form.logo_url} className="h-10 w-10 shrink-0" />
                <div className="min-w-0 leading-none">
                  <p className="truncate text-[15px] font-extrabold tracking-tight text-ink">
                    {form.name || "Hospital name"}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-ink-mute">Hospital dashboard</p>
                </div>
              </div>
            </div>

            <p className={cn("text-xs leading-relaxed text-ink-mute")}>
              This logo is also used in the doctor portal, the nurse portal and patient tablets.
            </p>
          </div>
        </form>
      )}
    </PageShell>
  );
}
