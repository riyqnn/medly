"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, CalendarDays, Trash2 } from "lucide-react";
import { PageShell, PageHeader, EmptyState } from "@/src/features/shell/components/Page";
import { Modal, FormError } from "@/src/features/shell/components/Modal";
import { TREATMENT_CATEGORIES, TREATMENT_STATUS } from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface Schedule {
  id: string;
  category: string;
  title: string;
  description: string | null;
  scheduled_time: string;
  status: string;
  doctors?: { full_name: string } | null;
  patient_admissions?: {
    patients?: { full_name: string; mrn: string };
    rooms?: { room_number: string };
  };
}
interface Admission {
  id: string;
  patients?: { full_name: string; mrn: string };
  rooms?: { room_number: string };
}
interface Doctor {
  id: string;
  full_name: string;
}

/* Row height for one hour of the grid. Everything below positions against it. */
const HOUR_H = 68;
/* A treatment is a point in time, not a range — this is the slot we draw for
   it, and the window we use to decide that two treatments collide. */
const SLOT_MIN = 45;

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
/* Two letters, because single initials collide three ways in Indonesian
   (Senin / Selasa / Sabtu all start with S). */
const DAY_INITIALS = ["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"];
const EMPTY_FORM = {
  admission_id: "",
  category: "DOCTOR_VISIT",
  title: "",
  description: "",
  scheduled_time: "",
  related_doctor_id: "",
};

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const startOfWeek = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // week starts Monday
  return x;
};
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** Split a day's treatments into clusters that overlap, then lane them side by side. */
function layoutDay(items: Schedule[]) {
  const sorted = [...items].sort(
    (a, b) => +new Date(a.scheduled_time) - +new Date(b.scheduled_time)
  );
  const out: { item: Schedule; lane: number; lanes: number }[] = [];
  let cluster: Schedule[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (!cluster.length) return;
    const laneEnds: number[] = [];
    const placed = cluster.map((item) => {
      const start = minutesOf(new Date(item.scheduled_time));
      let lane = laneEnds.findIndex((end) => end <= start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(0);
      }
      laneEnds[lane] = start + SLOT_MIN;
      return { item, lane };
    });
    placed.forEach((p) => out.push({ ...p, lanes: laneEnds.length }));
    cluster = [];
    clusterEnd = -Infinity;
  };

  for (const item of sorted) {
    const start = minutesOf(new Date(item.scheduled_time));
    if (cluster.length && start >= clusterEnd) flush();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, start + SLOT_MIN);
  }
  flush();
  return out;
}

/** Six Monday-first weeks covering the month `d` sits in. */
function monthMatrix(d: Date) {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export default function TreatmentsPage() {
  // Rendered from the clock, so it starts empty and is filled after mount to
  // keep the server and client markup identical.
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<Schedule | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const today = new Date();
    setAnchor(today);
    setSelectedDay(today);
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const weekStart = useMemo(() => (anchor ? startOfWeek(anchor) : null), [anchor]);
  const days = useMemo(
    () => (weekStart ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)) : []),
    [weekStart]
  );

  const load = useCallback(async () => {
    if (!weekStart) return;
    setLoading(true);
    const from = new Date(weekStart);
    const to = addDays(weekStart, 7);
    const [sRes, aRes, dRes] = await Promise.all([
      fetch(`/api/treatment-schedules?from=${from.toISOString()}&to=${to.toISOString()}`),
      fetch("/api/patient-admissions?status=ACTIVE"),
      fetch("/api/doctors"),
    ]);
    if (sRes.ok) setSchedules(await sRes.json());
    if (aRes.ok) setAdmissions(await aRes.json());
    if (dRes.ok) setDoctors(await dRes.json());
    setLoading(false);
  }, [weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  /* Grid spans office hours, widened whenever a treatment falls outside them
     so nothing is ever hidden above or below the fold. */
  const [startHour, endHour] = useMemo(() => {
    let lo = 7;
    let hi = 19;
    for (const s of schedules) {
      const h = new Date(s.scheduled_time).getHours();
      lo = Math.min(lo, h);
      hi = Math.max(hi, h + 1);
    }
    return [lo, Math.max(hi, lo + 4)];
  }, [schedules]);
  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour]
  );
  const gridHeight = hours.length * HOUR_H;

  /* Treatments happen around the clock, so the grid keeps the full day and
     scrolls inside a fixed viewport. It opens on the current hour for this
     week, or on the first treatment for any other week — once per week, so it
     never yanks the view back while someone is scrolling. */
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrolledFor = useRef<string>("");
  useEffect(() => {
    if (loading || !scrollRef.current || !weekStart) return;
    const key = weekStart.toISOString();
    if (scrolledFor.current === key) return;

    const showsToday = now && days.some((d) => sameDay(d, now));
    const focusHour = showsToday
      ? now!.getHours()
      : schedules.length
        ? Math.min(...schedules.map((s) => new Date(s.scheduled_time).getHours()))
        : 8;

    scrolledFor.current = key;
    scrollRef.current.scrollTop = Math.max(0, (focusHour - startHour) * HOUR_H - 24);
  }, [loading, weekStart, startHour, schedules, days, now]);

  const byDay = useCallback(
    (day: Date) => schedules.filter((s) => sameDay(new Date(s.scheduled_time), day)),
    [schedules]
  );

  const openCreate = (prefill?: Date) => {
    setForm({ ...EMPTY_FORM, scheduled_time: prefill ? toLocalInput(prefill) : "" });
    setError("");
    setShowCreate(true);
  };

  /* Clicking empty space in a column proposes that time, rounded to :00/:15/:30/:45. */
  const handleColumnClick = (day: Date, e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mins = ((e.clientY - rect.top) / HOUR_H) * 60 + startHour * 60;
    const rounded = Math.round(mins / 15) * 15;
    const at = new Date(day);
    at.setHours(Math.floor(rounded / 60), rounded % 60, 0, 0);
    openCreate(at);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/treatment-schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        // Send an absolute instant; the raw datetime-local string has no zone.
        scheduled_time: new Date(form.scheduled_time).toISOString(),
        related_doctor_id: form.related_doctor_id || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error || "Gagal menyimpan jadwal");
    setShowCreate(false);
    load();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/treatment-schedules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setDetail(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Hapus jadwal ini?")) return;
    await fetch(`/api/treatment-schedules/${id}`, { method: "DELETE" });
    setDetail(null);
    load();
  }

  if (!anchor || !weekStart || !selectedDay) {
    return (
      <PageShell>
        <div className="h-64 animate-sheen rounded-2xl bg-white" />
      </PageShell>
    );
  }

  const monthLabel = weekStart.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const todayInWeek = now && days.some((d) => sameDay(d, now));
  const nowTop = now ? ((minutesOf(now) - startHour * 60) / 60) * HOUR_H : 0;
  const nowVisible = todayInWeek && nowTop >= 0 && nowTop <= gridHeight;
  const agenda = byDay(selectedDay).sort(
    (a, b) => +new Date(a.scheduled_time) - +new Date(b.scheduled_time)
  );

  return (
    <PageShell>
      <PageHeader
        eyebrow="Perawatan"
        title="Jadwal Perawatan"
        description="Semua jadwal di sini langsung tampil di tablet pasien terkait."
        action={
          <button onClick={() => openCreate()} className="btn-primary">
            <Plus className="h-4 w-4" /> Buat jadwal
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[264px_minmax(0,1fr)]">
        {/* ── Left rail: month picker + the selected day's agenda ── */}
        <div className="space-y-5">
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-extrabold tracking-tight text-ink">
                {anchor.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
              </p>
              <div className="flex gap-1">
                <button
                  aria-label="Bulan sebelumnya"
                  onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))}
                  className="grid h-7 w-7 place-items-center rounded-lg text-ink-soft transition hover:bg-brand-50 hover:text-brand-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  aria-label="Bulan berikutnya"
                  onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))}
                  className="grid h-7 w-7 place-items-center rounded-lg text-ink-soft transition hover:bg-brand-50 hover:text-brand-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-0.5">
              {DAY_INITIALS.map((d) => (
                <span key={d} className="py-1 text-center text-[10px] font-bold text-ink-mute">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {monthMatrix(anchor).map((d, i) => {
                const inMonth = d.getMonth() === anchor.getMonth();
                const isSelected = sameDay(d, selectedDay);
                const isToday = now && sameDay(d, now);
                const inWeek = days.some((wd) => sameDay(wd, d));
                const has = schedules.some((s) => sameDay(new Date(s.scheduled_time), d));
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedDay(d);
                      setAnchor(d);
                    }}
                    className={cn(
                      "tabular relative grid h-8 place-items-center rounded-lg text-xs font-semibold transition",
                      !inMonth && "text-ink-mute/50",
                      inMonth && !isSelected && "text-ink hover:bg-brand-50",
                      inWeek && !isSelected && "bg-brand-50/60",
                      isSelected && "bg-brand-500 text-white shadow-sm shadow-brand-500/30",
                      isToday && !isSelected && "text-brand-600"
                    )}
                  >
                    {d.getDate()}
                    {has && (
                      <span
                        className={cn(
                          "absolute bottom-1 h-1 w-1 rounded-full",
                          isSelected ? "bg-white" : "bg-brand-500"
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card p-4">
            <p className="eyebrow mb-3">
              Agenda {selectedDay.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
            </p>
            {agenda.length === 0 ? (
              <p className="py-4 text-center text-xs text-ink-mute">Tidak ada jadwal.</p>
            ) : (
              <ul className="space-y-1">
                {agenda.map((s) => {
                  const cat = TREATMENT_CATEGORIES[s.category];
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => setDetail(s)}
                        className="flex w-full items-start gap-2.5 rounded-xl p-2 text-left transition hover:bg-canvas"
                      >
                        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", cat?.tone.strong)} />
                        <span className="min-w-0 flex-1">
                          <span className="tabular block text-xs font-bold text-ink">
                            {new Date(s.scheduled_time).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="block truncate text-xs text-ink-soft">{s.title}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Week grid ── */}
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
            <div className="flex items-center gap-2">
              <button
                aria-label="Minggu sebelumnya"
                onClick={() => setAnchor(addDays(weekStart, -7))}
                className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-soft transition hover:bg-brand-50 hover:text-brand-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                aria-label="Minggu berikutnya"
                onClick={() => setAnchor(addDays(weekStart, 7))}
                className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-soft transition hover:bg-brand-50 hover:text-brand-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  const t = new Date();
                  setAnchor(t);
                  setSelectedDay(t);
                }}
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-brand-50"
              >
                Hari ini
              </button>
              <p className="ml-1 text-sm font-extrabold capitalize tracking-tight text-ink">{monthLabel}</p>
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {Object.entries(TREATMENT_CATEGORIES).map(([key, c]) => (
                <span key={key} className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-soft">
                  <span className={cn("h-2 w-2 rounded-full", c.tone.strong)} />
                  {c.label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            {loading && (
              <div className="absolute inset-0 z-30 grid place-items-center bg-white/60 backdrop-blur-[1px]">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand-500" />
              </div>
            )}

            {/* Headers live inside the scroller so a scrollbar can never knock
                them out of line with the columns underneath. */}
            <div ref={scrollRef} className="max-h-[560px] overflow-auto">
              <div className="sticky top-0 z-20 grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-line bg-white/95 backdrop-blur">
                <span />
                {days.map((d, i) => {
                  const isToday = now && sameDay(d, now);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDay(d)}
                      className="border-l border-line py-2.5 text-center transition hover:bg-brand-50/60"
                    >
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-mute">
                        {DAY_LABELS[i]}
                      </span>
                      <span
                        className={cn(
                          "tabular mx-auto mt-1 grid h-7 w-7 place-items-center rounded-full text-sm font-extrabold transition",
                          isToday ? "bg-brand-500 text-white" : "text-ink",
                          !isToday && sameDay(d, selectedDay) && "bg-brand-50 text-brand-700"
                        )}
                      >
                        {d.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                className="relative grid grid-cols-[56px_repeat(7,minmax(0,1fr))]"
                style={{ height: gridHeight }}
              >
                {/* Hour gutter */}
                <div className="relative">
                  {hours.map((h, i) => (
                    <span
                      key={h}
                      className="tabular absolute right-2 -translate-y-1/2 text-[10px] font-bold text-ink-mute"
                      style={{ top: i * HOUR_H }}
                    >
                      {i === 0 ? "" : `${pad(h)}:00`}
                    </span>
                  ))}
                </div>

                {days.map((day, di) => {
                  const laid = layoutDay(byDay(day));
                  return (
                    <div
                      key={di}
                      onClick={(e) => handleColumnClick(day, e)}
                      className="relative cursor-copy border-l border-line"
                    >
                      {hours.map((_, i) => (
                        <span
                          key={i}
                          className="pointer-events-none absolute inset-x-0 border-t border-line/70"
                          style={{ top: i * HOUR_H }}
                        />
                      ))}

                      {laid.map(({ item, lane, lanes }) => {
                        const at = new Date(item.scheduled_time);
                        const top = ((minutesOf(at) - startHour * 60) / 60) * HOUR_H;
                        const cat = TREATMENT_CATEGORIES[item.category];
                        const cancelled = item.status === "CANCELLED";
                        return (
                          <button
                            key={item.id}
                            onClick={() => setDetail(item)}
                            style={{
                              top,
                              height: (SLOT_MIN / 60) * HOUR_H - 4,
                              left: `calc(${(lane * 100) / lanes}% + 3px)`,
                              width: `calc(${100 / lanes}% - 6px)`,
                            }}
                            className={cn(
                              "absolute overflow-hidden rounded-lg py-1 pl-2.5 pr-1.5 text-left transition duration-150",
                              "hover:-translate-y-px hover:shadow-lift focus-visible:z-10",
                              cat?.tone.soft,
                              cancelled && "opacity-50 saturate-0"
                            )}
                          >
                            <span
                              className={cn("absolute inset-y-0 left-0 w-[3px]", cat?.tone.strong)}
                              aria-hidden="true"
                            />
                            <span
                              className={cn(
                                "block truncate text-[11px] font-extrabold leading-tight",
                                cancelled && "line-through"
                              )}
                            >
                              {item.title}
                            </span>
                            <span className="tabular block truncate text-[10px] font-semibold opacity-75">
                              {at.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                              {item.patient_admissions?.rooms?.room_number
                                ? ` · ${item.patient_admissions.rooms.room_number}`
                                : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Live position of "now", drawn across the whole week */}
                {nowVisible && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                    style={{ top: nowTop }}
                  >
                    <span className="tabular w-[56px] pr-2 text-right text-[10px] font-extrabold text-brand-600">
                      {now!.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="relative h-px flex-1 bg-brand-500">
                      <span className="absolute -left-0.5 -top-[3px] h-[7px] w-[7px] rounded-full bg-brand-500" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!loading && schedules.length === 0 && (
            <div className="border-t border-line">
              <EmptyState
                icon={CalendarDays}
                title="Belum ada jadwal minggu ini"
                hint="Klik petak jam mana pun di atas untuk membuat jadwal pada waktu tersebut."
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Create ── */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Buat jadwal perawatan"
        description="Jadwal akan langsung muncul di tablet pasien."
        width="max-w-lg"
      >
        <FormError>{error}</FormError>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Pasien (admisi aktif)</label>
            <select
              required
              value={form.admission_id}
              onChange={(e) => setForm({ ...form, admission_id: e.target.value })}
              className="field"
            >
              <option value="">Pilih pasien…</option>
              {admissions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.patients?.full_name} — {a.rooms?.room_number ?? "tanpa kamar"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="field"
              >
                {Object.entries(TREATMENT_CATEGORIES).map(([key, c]) => (
                  <option key={key} value={key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Waktu</label>
              <input
                required
                type="datetime-local"
                value={form.scheduled_time}
                onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="label">Judul</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="field"
              placeholder="mis. Visit pagi dr. Siti"
            />
          </div>

          <div>
            <label className="label">Dokter terkait</label>
            <select
              value={form.related_doctor_id}
              onChange={(e) => setForm({ ...form, related_doctor_id: e.target.value })}
              className="field"
            >
              <option value="">Tidak ada</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Catatan untuk pasien</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="field resize-none"
              placeholder="Opsional — tampil di tablet pasien"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Menyimpan…" : "Buat jadwal"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Detail ── */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title ?? ""}
        description={detail ? TREATMENT_CATEGORIES[detail.category]?.label : undefined}
      >
        {detail && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-canvas p-4">
              <div>
                <dt className="eyebrow">Waktu</dt>
                <dd className="tabular mt-1 text-sm font-bold text-ink">
                  {new Date(detail.scheduled_time).toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Pasien</dt>
                <dd className="mt-1 text-sm font-bold text-ink">
                  {detail.patient_admissions?.patients?.full_name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Kamar</dt>
                <dd className="mt-1 text-sm font-bold text-ink">
                  {detail.patient_admissions?.rooms?.room_number ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Dokter</dt>
                <dd className="mt-1 text-sm font-bold text-ink">{detail.doctors?.full_name ?? "—"}</dd>
              </div>
            </dl>

            {detail.description && <p className="text-sm leading-relaxed text-ink-soft">{detail.description}</p>}

            <div>
              <p className="label">Status</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TREATMENT_STATUS).map(([key, s]) => (
                  <button
                    key={key}
                    onClick={() => updateStatus(detail.id, key)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-[0.97]",
                      detail.status === key
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-line bg-white text-ink-soft hover:border-brand-200 hover:bg-brand-50"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between border-t border-line pt-4">
              <button onClick={() => remove(detail.id)} className="btn-danger">
                <Trash2 className="h-4 w-4" /> Hapus
              </button>
              <button onClick={() => setDetail(null)} className="btn-ghost">
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageShell>
  );
}
