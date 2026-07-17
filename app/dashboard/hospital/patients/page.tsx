"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, MonitorPlay, Pencil, Trash2, Users } from "lucide-react";
import { PageShell, PageHeader, EmptyState, Loading } from "@/src/features/shell/components/Page";
import { Pagination } from "@/src/features/shell/components/Pagination";
import type { Paged } from "@/src/features/shell/pagination";

interface Patient {
  id: string;
  mrn: string;
  full_name: string;
  dob: string | null;
  gender: string | null;
  /** Joined server-side, so it stays correct on every page. */
  active_admission: { id: string; rooms?: { room_number: string } | null } | null;
}

const age = (dob: string | null) => {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
};

export default function PatientsPage() {
  const [res, setRes] = useState<Paged<Patient> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page) });
    if (search) qs.set("q", search);
    const r = await fetch(`/api/patients?${qs}`);
    if (r.ok) setRes(await r.json());
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  // A new search starts over; otherwise page 3 of an empty result is a dead end.
  useEffect(() => {
    setPage(1);
  }, [search]);

  async function handleDelete(id: string) {
    if (!confirm("Hapus data pasien ini?")) return;
    setDeleting(id);
    await fetch(`/api/patients/${id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  }

  const patients = res?.data ?? [];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Perawatan"
        title="Pasien"
        description={loading && !res ? "Memuat data pasien…" : `${res?.total ?? 0} pasien terdaftar`}
        action={
          <Link href="/dashboard/hospital/patients/create" className="btn-primary">
            <Plus className="h-4 w-4" /> Daftarkan pasien
          </Link>
        }
      />

      <div className="card overflow-hidden">
        <div className="border-b border-line p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
            <input
              type="search"
              placeholder="Cari nama pasien…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field pl-10"
            />
          </div>
        </div>

        {loading && !res ? (
          <Loading label="Memuat pasien…" />
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? "Pasien tidak ditemukan" : "Belum ada pasien"}
            hint={
              search
                ? "Coba kata kunci lain."
                : "Daftarkan pasien pertama Anda untuk mulai menggunakan Medly."
            }
            action={
              !search && (
                <Link href="/dashboard/hospital/patients/create" className="btn-primary">
                  <Plus className="h-4 w-4" /> Daftarkan pasien
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas/60">
                    <th className="eyebrow px-6 py-3 font-bold">Pasien</th>
                    <th className="eyebrow px-6 py-3 font-bold">MRN</th>
                    <th className="eyebrow px-6 py-3 font-bold">Usia / Gender</th>
                    <th className="eyebrow px-6 py-3 font-bold">Status</th>
                    <th className="eyebrow px-6 py-3 text-right font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {patients.map((p) => {
                    const adm = p.active_admission;
                    const a = age(p.dob);
                    return (
                      <tr key={p.id} className="group transition-colors hover:bg-canvas/70">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-extrabold text-brand-700">
                              {p.full_name.slice(0, 2).toUpperCase()}
                            </span>
                            <Link
                              href={`/dashboard/hospital/patients/${p.id}`}
                              className="font-bold text-ink transition hover:text-brand-600"
                            >
                              {p.full_name}
                            </Link>
                          </div>
                        </td>
                        <td className="tabular px-6 py-4 font-semibold text-ink-soft">{p.mrn}</td>
                        <td className="px-6 py-4 text-ink-soft">
                          {a !== null ? `${a} th` : "—"}
                          {p.gender ? ` · ${p.gender === "male" ? "L" : "P"}` : ""}
                        </td>
                        <td className="px-6 py-4">
                          {adm ? (
                            <span className="chip bg-brand-50 text-brand-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                              Dirawat{adm.rooms?.room_number ? ` · ${adm.rooms.room_number}` : ""}
                            </span>
                          ) : (
                            <span className="chip bg-canvas text-ink-mute">Tidak dirawat</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {adm && (
                              <a
                                href={`/patient/${adm.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Buka layar tablet pasien ini"
                                className="mr-1 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-bold text-brand-700 transition hover:bg-brand-500 hover:text-white"
                              >
                                <MonitorPlay className="h-3.5 w-3.5" /> Tampilkan
                              </a>
                            )}
                            <Link
                              href={`/dashboard/hospital/patients/${p.id}`}
                              title="Buka rekam pasien"
                              className="grid h-8 w-8 place-items-center rounded-lg text-ink-mute transition hover:bg-canvas hover:text-ink"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={deleting === p.id}
                              title="Hapus"
                              className="grid h-8 w-8 place-items-center rounded-lg text-ink-mute transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {res && (
              <Pagination
                page={res.page}
                pages={res.pages}
                total={res.total}
                limit={res.limit}
                onPage={setPage}
                noun="pasien"
              />
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
