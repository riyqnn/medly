"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, BedDouble, Wrench } from "lucide-react";
import { PageShell, PageHeader, EmptyState, Loading } from "@/src/features/shell/components/Page";
import { Modal, FormError } from "@/src/features/shell/components/Modal";
import { cn } from "@/src/lib/utils";

interface Occupant {
  admission_id: string;
  patient_id: string;
  full_name: string;
}
interface Room {
  id: string;
  room_number: string;
  ward_name: string | null;
  capacity: number;
  status: string;
  /** Joined by the API, so occupancy can't drift out of sync with the list. */
  occupants: Occupant[];
}

const STATUSES: Record<string, { label: string; chip: string }> = {
  AVAILABLE: { label: "Available", chip: "bg-brand-50 text-brand-700" },
  FULL: { label: "Full", chip: "bg-amber-50 text-amber-700" },
  MAINTENANCE: { label: "Maintenance", chip: "bg-canvas text-ink-mute" },
};

const EMPTY = { room_number: "", ward_name: "", capacity: 1, status: "AVAILABLE" };

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Room | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/rooms");
    if (r.ok) setRooms(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY);
    setError("");
    setShowModal(true);
  }

  function openEdit(r: Room) {
    setEditTarget(r);
    setForm({
      room_number: r.room_number,
      ward_name: r.ward_name ?? "",
      capacity: r.capacity,
      status: r.status,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = editTarget
      ? await fetch(`/api/rooms/${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      : await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
    setBusy(false);
    if (!res.ok) return setError((await res.json()).error ?? "Couldn't save");
    setShowModal(false);
    load();
  }

  async function handleDelete(r: Room) {
    if (!confirm(`Delete room ${r.room_number}?`)) return;
    const res = await fetch(`/api/rooms/${r.id}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error);
    load();
  }

  const totalBeds = rooms.reduce((n, r) => n + (r.capacity ?? 1), 0);
  const occupied = rooms.reduce((n, r) => n + r.occupants.length, 0);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Care"
        title="Rooms"
        description={
          loading
            ? "Loading…"
            : `${rooms.length} rooms · ${occupied} of ${totalBeds} beds occupied`
        }
        action={
          <button onClick={openAdd} className="btn-primary">
            <Plus className="h-4 w-4" /> Add room
          </button>
        }
      />

      {loading ? (
        <div className="card">
          <Loading />
        </div>
      ) : rooms.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BedDouble}
            title="No rooms yet"
            hint="Add a room first so patients can be admitted and their tablet can open."
            action={
              <button onClick={openAdd} className="btn-primary">
                <Plus className="h-4 w-4" /> Add room
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((r, i) => {
            const people = r.occupants;
            const free = Math.max(0, (r.capacity ?? 1) - people.length);
            const st = STATUSES[r.status] ?? STATUSES.AVAILABLE;
            return (
              <article
                key={r.id}
                style={{ animationDelay: `${i * 40}ms` }}
                className={cn(
                  "group card animate-fade-up p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift",
                  r.status === "MAINTENANCE" && "opacity-70"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-ink">{r.room_number}</h2>
                    <p className="text-xs text-ink-soft">{r.ward_name || "No ward"}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => openEdit(r)}
                      title="Edit"
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-mute transition hover:bg-canvas hover:text-ink"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      title="Delete"
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-mute transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Beds as dots: occupancy readable without counting words. */}
                <div className="mt-4 flex items-center gap-1.5">
                  {Array.from({ length: r.capacity ?? 1 }).map((_, b) => (
                    <span
                      key={b}
                      title={b < people.length ? "Occupied" : "Empty"}
                      className={cn(
                        "h-2.5 flex-1 rounded-full",
                        r.status === "MAINTENANCE"
                          ? "bg-line"
                          : b < people.length
                            ? "bg-brand-500"
                            : "bg-brand-100"
                      )}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[11px] font-bold text-ink-mute">
                  {r.status === "MAINTENANCE"
                    ? "Under maintenance"
                    : `${people.length}/${r.capacity ?? 1} terisi${free ? ` · ${free} kosong` : ""}`}
                </p>

                {people.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-line pt-3">
                    {people.map((o) => (
                      <li key={o.admission_id}>
                        <Link
                          href={`/dashboard/hospital/patients/${o.patient_id}`}
                          className="truncate text-xs font-bold text-ink transition hover:text-brand-600"
                        >
                          {o.full_name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4">
                  <span className={cn("chip", st.chip)}>
                    {r.status === "MAINTENANCE" && <Wrench className="h-3 w-3" />}
                    {st.label}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? `Edit room ${editTarget.room_number}` : "Add room"}
      >
        <FormError>{error}</FormError>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Room number</label>
              <input
                required
                value={form.room_number}
                onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                className="field"
                placeholder="VIP-204"
              />
            </div>
            <div>
              <label className="label">Ward</label>
              <input
                value={form.ward_name}
                onChange={(e) => setForm({ ...form, ward_name: e.target.value })}
                className="field"
                placeholder="Melati"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Capacity (beds)</label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                className="field"
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="field"
              >
                {Object.entries(STATUSES).map(([key, s]) => (
                  <option key={key} value={key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? "Menyimpan…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
