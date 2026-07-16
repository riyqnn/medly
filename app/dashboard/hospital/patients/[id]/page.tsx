"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  MonitorPlay,
  Pencil,
  Plus,
  Check,
  Activity,
  UserPlus,
  Trash2,
} from "lucide-react";
import { PageShell, Loading } from "@/src/features/shell/components/Page";
import { Modal, FormError } from "@/src/features/shell/components/Modal";
import { ADMISSION_STATUS } from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface Admission {
  id: string;
  status: string;
  admission_date: string;
  discharge_date: string | null;
  room_id: string | null;
  primary_diagnosis?: string | null;
  rooms?: { room_number: string; ward_name: string } | null;
}
interface Doctor {
  id: string;
  full_name: string;
  specialization: string | null;
}
interface Assignment {
  id: string;
  role: string;
  doctors?: Doctor | null;
}
interface Room {
  id: string;
  room_number: string;
  ward_name: string;
  status: string;
}
interface ChecklistItem {
  id: string;
  title: string;
  target_date: string | null;
  is_done: boolean;
}
interface RecoveryProgress {
  id: string;
  estimated_total_days: number | null;
  current_day: number;
  notes: string | null;
  recovery_checklist_items: ChecklistItem[];
}
interface Vital {
  id: string;
  measured_at: string;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  temperature_celsius: number | null;
  oxygen_saturation: number | null;
}

const EMPTY_VITALS = {
  blood_pressure_systolic: "",
  blood_pressure_diastolic: "",
  heart_rate: "",
  temperature_celsius: "",
  respiratory_rate: "",
  oxygen_saturation: "",
};

function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="eyebrow">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [patient, setPatient] = useState<any>(null);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [recovery, setRecovery] = useState<RecoveryProgress | null>(null);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [savedFlag, setSavedFlag] = useState<string | null>(null);

  const [estimatedDays, setEstimatedDays] = useState("");
  const [currentDay, setCurrentDay] = useState("");
  const [recoveryNotes, setRecoveryNotes] = useState("");
  const [newTask, setNewTask] = useState("");

  const [showVitals, setShowVitals] = useState(false);
  const [vitalsForm, setVitalsForm] = useState(EMPTY_VITALS);
  const [vitalsError, setVitalsError] = useState("");

  const activeAdmission = admissions.find((a) => a.status === "ACTIVE");

  const flash = (key: string) => {
    setSavedFlag(key);
    setTimeout(() => setSavedFlag(null), 2000);
  };

  const loadExtras = useCallback(async (admissionId: string) => {
    const [rRes, aRes, vRes] = await Promise.all([
      fetch(`/api/recovery-progress?admission_id=${admissionId}`),
      fetch(`/api/patient-doctor-assignments?admission_id=${admissionId}`),
      fetch(`/api/vitals?admission_id=${admissionId}`),
    ]);
    if (rRes.ok) {
      const data = await rRes.json();
      setRecovery(data);
      if (data) {
        setEstimatedDays(String(data.estimated_total_days ?? ""));
        setCurrentDay(String(data.current_day ?? 1));
        setRecoveryNotes(data.notes ?? "");
      }
    }
    if (aRes.ok) setAssignments(await aRes.json());
    if (vRes.ok) setVitals(await vRes.json());
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [pRes, aRes, dRes, rRes] = await Promise.all([
      fetch(`/api/patients/${id}`),
      fetch(`/api/patient-admissions?patient_id=${id}`),
      fetch("/api/doctors"),
      fetch("/api/rooms"),
    ]);
    if (pRes.ok) setPatient(await pRes.json());
    let list: Admission[] = [];
    if (aRes.ok) {
      list = await aRes.json();
      setAdmissions(list);
    }
    if (dRes.ok) setDoctors(await dRes.json());
    if (rRes.ok) setRooms(await rRes.json());
    setLoading(false);

    const active = list.find((a) => a.status === "ACTIVE");
    if (active) {
      setDiagnosis(active.primary_diagnosis ?? "");
      loadExtras(active.id);
    } else {
      setRecovery(null);
      setAssignments([]);
      setVitals([]);
    }
  }, [id, loadExtras]);

  useEffect(() => {
    if (id) loadAll();
  }, [id, loadAll]);

  async function admit() {
    setBusy("admit");
    const res = await fetch("/api/patient-admissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: id, room_id: selectedRoom || null }),
    });
    setBusy(null);
    if (!res.ok) return alert((await res.json()).error);
    setSelectedRoom("");
    loadAll();
  }

  async function patchAdmission(payload: Record<string, unknown>, key: string) {
    if (!activeAdmission) return;
    setBusy(key);
    const res = await fetch(`/api/patient-admissions/${activeAdmission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(null);
    if (!res.ok) return alert((await res.json()).error);
    flash(key);
    loadAll();
  }

  async function assignDoctor() {
    if (!activeAdmission || !selectedDoctor) return;
    setBusy("doctor");
    const res = await fetch("/api/patient-doctor-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admission_id: activeAdmission.id, doctor_id: selectedDoctor }),
    });
    setBusy(null);
    if (!res.ok) return alert((await res.json()).error);
    setSelectedDoctor("");
    loadExtras(activeAdmission.id);
  }

  async function unassignDoctor(assignmentId: string) {
    if (!activeAdmission) return;
    await fetch(`/api/patient-doctor-assignments/${assignmentId}`, { method: "DELETE" });
    loadExtras(activeAdmission.id);
  }

  async function saveRecovery() {
    if (!activeAdmission) return;
    setBusy("recovery");
    const payload = {
      estimated_total_days: estimatedDays ? Number(estimatedDays) : null,
      current_day: currentDay ? Number(currentDay) : 1,
      notes: recoveryNotes || null,
    };
    const res = recovery
      ? await fetch(`/api/recovery-progress/${recovery.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/recovery-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admission_id: activeAdmission.id, ...payload }),
        });
    setBusy(null);
    if (!res.ok) return alert((await res.json()).error);
    flash("recovery");
    loadExtras(activeAdmission.id);
  }

  async function addTask() {
    if (!recovery || !newTask.trim() || !activeAdmission) return;
    await fetch("/api/recovery-checklist-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recovery_progress_id: recovery.id, title: newTask.trim() }),
    });
    setNewTask("");
    loadExtras(activeAdmission.id);
  }

  async function toggleTask(item: ChecklistItem) {
    if (!activeAdmission) return;
    await fetch(`/api/recovery-checklist-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_done: !item.is_done }),
    });
    loadExtras(activeAdmission.id);
  }

  async function saveVitals(e: React.FormEvent) {
    e.preventDefault();
    if (!activeAdmission) return;
    setBusy("vitals");
    setVitalsError("");
    const res = await fetch("/api/vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admission_id: activeAdmission.id, ...vitalsForm }),
    });
    setBusy(null);
    if (!res.ok) return setVitalsError((await res.json()).error ?? "Gagal menyimpan");
    setShowVitals(false);
    setVitalsForm(EMPTY_VITALS);
    loadExtras(activeAdmission.id);
  }

  if (loading) return <PageShell><Loading label="Memuat pasien…" /></PageShell>;
  if (!patient)
    return (
      <PageShell>
        <p className="text-sm font-semibold text-red-600">Pasien tidak ditemukan.</p>
      </PageShell>
    );

  const latest = vitals[0];
  const st = activeAdmission ? ADMISSION_STATUS[activeAdmission.status] : null;

  return (
    <PageShell>
      <Link
        href="/dashboard/hospital/patients"
        className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-ink-soft transition hover:text-brand-600"
      >
        <ChevronLeft className="h-4 w-4" /> Semua pasien
      </Link>

      {/* Identity */}
      <div className="card mb-4 flex flex-wrap items-start justify-between gap-5 p-6">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-sm font-extrabold text-brand-700">
            {patient.full_name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">{patient.full_name}</h1>
            <p className="tabular mt-0.5 text-sm text-ink-soft">
              MRN {patient.mrn}
              {patient.dob ? ` · ${new Date(patient.dob).toLocaleDateString("id-ID")}` : ""}
              {patient.gender ? ` · ${patient.gender === "male" ? "Laki-laki" : "Perempuan"}` : ""}
            </p>
            {st && <span className={cn("chip mt-2", st.chip)}>{st.label}</span>}
          </div>
        </div>

        <div className="flex gap-2">
          {activeAdmission && (
            <a href={`/patient/${activeAdmission.id}`} target="_blank" rel="noopener noreferrer" className="btn-primary">
              <MonitorPlay className="h-4 w-4" /> Tampilkan layar pasien
            </a>
          )}
          <Link href={`/dashboard/hospital/patients/${id}/edit`} className="btn-ghost">
            <Pencil className="h-4 w-4" /> Ubah
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Admission */}
        <Panel title="Status rawat inap">
          {activeAdmission ? (
            <div className="space-y-4">
              <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-canvas p-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-ink-mute">Kamar</dt>
                  <dd className="mt-0.5 font-extrabold text-ink">
                    {activeAdmission.rooms?.room_number ?? "Belum ditentukan"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-ink-mute">Bangsal</dt>
                  <dd className="mt-0.5 font-extrabold text-ink">{activeAdmission.rooms?.ward_name ?? "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs font-semibold text-ink-mute">Masuk sejak</dt>
                  <dd className="tabular mt-0.5 font-extrabold text-ink">
                    {new Date(activeAdmission.admission_date).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </dd>
                </div>
              </dl>

              <div>
                <label className="label">Diagnosa utama</label>
                <div className="flex gap-2">
                  <input
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="field"
                    placeholder="mis. Demam Berdarah Dengue"
                  />
                  <button
                    onClick={() => patchAdmission({ primary_diagnosis: diagnosis }, "diagnosis")}
                    disabled={busy === "diagnosis"}
                    className="btn-ghost shrink-0"
                  >
                    {savedFlag === "diagnosis" ? <Check className="h-4 w-4 text-brand-600" /> : "Simpan"}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-ink-mute">Tampil di layar pasien.</p>
              </div>

              <div>
                <label className="label">Pindah kamar</label>
                <div className="flex gap-2">
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="field"
                  >
                    <option value="">Pilih kamar tujuan…</option>
                    {rooms
                      .filter((r) => r.status !== "MAINTENANCE" && r.id !== activeAdmission.room_id)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.room_number} — {r.ward_name}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => patchAdmission({ room_id: selectedRoom }, "room")}
                    disabled={!selectedRoom || busy === "room"}
                    className="btn-ghost shrink-0"
                  >
                    Pindahkan
                  </button>
                </div>
              </div>

              <div className="border-t border-line pt-4">
                <p className="label">Akhiri perawatan</p>
                <div className="flex flex-wrap gap-2">
                  {(["DISCHARGED", "TRANSFERRED", "DECEASED"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        confirm(`Tandai pasien sebagai ${ADMISSION_STATUS[s].label}?`) &&
                        patchAdmission({ status: s }, s)
                      }
                      disabled={busy === s}
                      className="rounded-xl border border-line px-3 py-2 text-xs font-bold text-ink-soft transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {ADMISSION_STATUS[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-4 text-sm text-ink-soft">
                Pasien ini belum punya admisi aktif. Layar Medly baru bisa dibuka setelah pasien dirawat.
              </p>
              <div className="flex gap-2">
                <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="field">
                  <option value="">Pilih kamar (opsional)…</option>
                  {rooms
                    .filter((r) => r.status !== "MAINTENANCE")
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.room_number} — {r.ward_name}
                      </option>
                    ))}
                </select>
                <button onClick={admit} disabled={busy === "admit"} className="btn-primary shrink-0">
                  {busy === "admit" ? "Memproses…" : "Rawat inap"}
                </button>
              </div>
            </div>
          )}
        </Panel>

        {/* Care team */}
        <Panel title="Tim dokter">
          {!activeAdmission ? (
            <p className="text-sm text-ink-mute">Tersedia setelah pasien dirawat.</p>
          ) : (
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-mute">
                  Belum ada dokter yang ditugaskan.
                </p>
              ) : (
                <ul className="space-y-2">
                  {assignments.map((a) => (
                    <li
                      key={a.id}
                      className="group flex items-center gap-3 rounded-2xl border border-line px-4 py-3"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-extrabold text-brand-700">
                        {(a.doctors?.full_name ?? "?").replace(/^dr\.?\s*/i, "").slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-ink">{a.doctors?.full_name}</p>
                        <p className="truncate text-xs text-ink-mute">
                          {a.doctors?.specialization ?? "Umum"} ·{" "}
                          {a.role === "MAIN_DOCTOR" ? "DPJP" : "Konsulen"}
                        </p>
                      </div>
                      <button
                        onClick={() => unassignDoctor(a.id)}
                        title="Lepas penugasan"
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-mute opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2">
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="field"
                >
                  <option value="">Tugaskan dokter…</option>
                  {doctors
                    .filter((d) => !assignments.some((a) => a.doctors?.id === d.id))
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name}
                        {d.specialization ? ` — ${d.specialization}` : ""}
                      </option>
                    ))}
                </select>
                <button
                  onClick={assignDoctor}
                  disabled={!selectedDoctor || busy === "doctor"}
                  className="btn-ghost shrink-0"
                >
                  <UserPlus className="h-4 w-4" /> Tugaskan
                </button>
              </div>
            </div>
          )}
        </Panel>

        {/* Vitals */}
        <Panel
          title="Vital sign"
          action={
            activeAdmission && (
              <button onClick={() => setShowVitals(true)} className="btn-ghost px-3 py-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Catat
              </button>
            )
          }
        >
          {!activeAdmission ? (
            <p className="text-sm text-ink-mute">Tersedia setelah pasien dirawat.</p>
          ) : !latest ? (
            <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-mute">
              Belum ada pengukuran. Yang dicatat di sini tampil di layar pasien.
            </p>
          ) : (
            <div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  {
                    label: "TD",
                    value:
                      latest.blood_pressure_systolic && latest.blood_pressure_diastolic
                        ? `${latest.blood_pressure_systolic}/${latest.blood_pressure_diastolic}`
                        : "—",
                  },
                  { label: "Nadi", value: latest.heart_rate ?? "—" },
                  { label: "Suhu", value: latest.temperature_celsius ?? "—" },
                  { label: "SpO₂", value: latest.oxygen_saturation ?? "—" },
                ].map((v) => (
                  <div key={v.label} className="rounded-2xl bg-canvas p-3 text-center">
                    <p className="tabular text-lg font-extrabold text-ink">{v.value}</p>
                    <p className="text-[10px] font-bold text-ink-mute">{v.label}</p>
                  </div>
                ))}
              </div>
              <p className="tabular mt-3 text-xs text-ink-mute">
                Terakhir diukur{" "}
                {new Date(latest.measured_at).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {vitals.length > 1 ? ` · ${vitals.length} catatan` : ""}
              </p>
            </div>
          )}
        </Panel>

        {/* Recovery */}
        <Panel title="Progres pemulihan">
          {!activeAdmission ? (
            <p className="text-sm text-ink-mute">Tersedia setelah pasien dirawat.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-[80px_110px_1fr] gap-3">
                <div>
                  <label className="label">Hari ke-</label>
                  <input
                    type="number"
                    min={1}
                    value={currentDay}
                    onChange={(e) => setCurrentDay(e.target.value)}
                    className="field"
                  />
                </div>
                <div>
                  <label className="label">Estimasi</label>
                  <input
                    type="number"
                    min={1}
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(e.target.value)}
                    className="field"
                    placeholder="hari"
                  />
                </div>
                <div>
                  <label className="label">Catatan untuk pasien</label>
                  <input
                    value={recoveryNotes}
                    onChange={(e) => setRecoveryNotes(e.target.value)}
                    className="field"
                    placeholder="mis. Kondisi membaik"
                  />
                </div>
              </div>

              <button onClick={saveRecovery} disabled={busy === "recovery"} className="btn-primary w-full">
                {savedFlag === "recovery" ? (
                  <>
                    <Check className="h-4 w-4" /> Tersimpan
                  </>
                ) : recovery ? (
                  "Perbarui progres"
                ) : (
                  "Mulai tracking pemulihan"
                )}
              </button>

              {recovery && (
                <div className="border-t border-line pt-4">
                  <p className="label">Target aktivitas</p>
                  <ul className="mb-3 space-y-1.5">
                    {(recovery.recovery_checklist_items ?? []).map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => toggleTask(item)}
                          className="group flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-canvas"
                        >
                          <span
                            className={cn(
                              "grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition",
                              item.is_done
                                ? "border-brand-500 bg-brand-500 text-white"
                                : "border-line group-hover:border-brand-300"
                            )}
                          >
                            <Check
                              className={cn("h-3 w-3 transition-transform", item.is_done ? "scale-100" : "scale-0")}
                              strokeWidth={3.5}
                            />
                          </span>
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              item.is_done ? "text-ink-mute line-through" : "text-ink"
                            )}
                          >
                            {item.title}
                          </span>
                        </button>
                      </li>
                    ))}
                    {(recovery.recovery_checklist_items ?? []).length === 0 && (
                      <li className="px-2 text-sm text-ink-mute">Belum ada target.</li>
                    )}
                  </ul>
                  <div className="flex gap-2">
                    <input
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTask()}
                      className="field"
                      placeholder="Tambah target aktivitas…"
                    />
                    <button onClick={addTask} disabled={!newTask.trim()} className="btn-ghost shrink-0">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>

      {/* Record vitals */}
      <Modal open={showVitals} onClose={() => setShowVitals(false)} title="Catat vital sign" description="Kosongkan kolom yang tidak diukur.">
        <FormError>{vitalsError}</FormError>
        <form onSubmit={saveVitals} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Sistolik (mmHg)</label>
              <input
                type="number"
                value={vitalsForm.blood_pressure_systolic}
                onChange={(e) => setVitalsForm({ ...vitalsForm, blood_pressure_systolic: e.target.value })}
                className="field"
                placeholder="120"
              />
            </div>
            <div>
              <label className="label">Diastolik (mmHg)</label>
              <input
                type="number"
                value={vitalsForm.blood_pressure_diastolic}
                onChange={(e) => setVitalsForm({ ...vitalsForm, blood_pressure_diastolic: e.target.value })}
                className="field"
                placeholder="80"
              />
            </div>
            <div>
              <label className="label">Nadi (bpm)</label>
              <input
                type="number"
                value={vitalsForm.heart_rate}
                onChange={(e) => setVitalsForm({ ...vitalsForm, heart_rate: e.target.value })}
                className="field"
                placeholder="80"
              />
            </div>
            <div>
              <label className="label">Suhu (°C)</label>
              <input
                type="number"
                step="0.1"
                value={vitalsForm.temperature_celsius}
                onChange={(e) => setVitalsForm({ ...vitalsForm, temperature_celsius: e.target.value })}
                className="field"
                placeholder="36.8"
              />
            </div>
            <div>
              <label className="label">Napas (/menit)</label>
              <input
                type="number"
                value={vitalsForm.respiratory_rate}
                onChange={(e) => setVitalsForm({ ...vitalsForm, respiratory_rate: e.target.value })}
                className="field"
                placeholder="18"
              />
            </div>
            <div>
              <label className="label">SpO₂ (%)</label>
              <input
                type="number"
                value={vitalsForm.oxygen_saturation}
                onChange={(e) => setVitalsForm({ ...vitalsForm, oxygen_saturation: e.target.value })}
                className="field"
                placeholder="98"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowVitals(false)} className="btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={busy === "vitals"} className="btn-primary">
              <Activity className="h-4 w-4" /> {busy === "vitals" ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
