"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  MonitorPlay,
  Plus,
  Check,
  Activity,
  UserPlus,
  Trash2,
  TriangleAlert,
  FileText,
  Pencil,
} from "lucide-react";
import { PageShell, Loading } from "@/src/features/shell/components/Page";
import { Modal, FormError } from "@/src/features/shell/components/Modal";
import {
  ADMISSION_STATUS,
  MEDICAL_RECORD_TYPES,
  NURSE_ASSIGNMENT_ROLES,
  BLOOD_TYPES,
} from "@/src/features/shell/constants";
import { cn } from "@/src/lib/utils";

interface Patient {
  id: string;
  mrn: string;
  full_name: string;
  dob: string | null;
  gender: string | null;
  contact_number: string | null;
  emergency_contact: string | null;
  address: string | null;
  blood_type: string | null;
  allergies: string | null;
}
interface Admission {
  id: string;
  status: string;
  admission_date: string;
  room_id: string | null;
  primary_diagnosis: string | null;
  secondary_diagnosis: string | null;
  chief_complaint: string | null;
  care_plan: string | null;
  rooms?: { room_number: string; ward_name: string } | null;
}
interface Staff {
  id: string;
  full_name: string;
  specialization?: string | null;
  employee_code?: string;
}
interface Assignment {
  id: string;
  role: string;
  doctors?: Staff | null;
  nurses?: Staff | null;
}
interface Room {
  id: string;
  room_number: string;
  ward_name: string;
  capacity: number;
  status: string;
}
interface ChecklistItem { id: string; title: string; is_done: boolean }
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
interface Record_ {
  id: string;
  record_type: string;
  title: string;
  content: string | null;
  recorded_at: string;
  author_name: string | null;
}

const EMPTY_VITALS = {
  blood_pressure_systolic: "",
  blood_pressure_diastolic: "",
  heart_rate: "",
  temperature_celsius: "",
  respiratory_rate: "",
  oxygen_saturation: "",
};
const EMPTY_RECORD = { record_type: "PROGRESS", title: "", content: "" };

function Panel({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card p-6", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="eyebrow">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Save button that confirms in place instead of throwing a dialog. */
function SaveBar({
  dirty,
  saving,
  saved,
  onSave,
  onReset,
}: {
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  if (!dirty && !saved) return null;
  return (
    <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-4">
      {saved && !dirty ? (
        <span className="flex items-center gap-1.5 text-xs font-bold text-brand-600">
          <Check className="h-3.5 w-3.5" /> Tersimpan
        </span>
      ) : (
        <>
          <button onClick={onReset} className="btn-ghost px-3 py-2 text-xs">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} className="btn-primary px-4 py-2 text-xs">
            {saving ? "Menyimpan…" : "Save changes"}
          </button>
        </>
      )}
    </div>
  );
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [nurses, setNurses] = useState<Staff[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [doctorAssign, setDoctorAssign] = useState<Assignment[]>([]);
  const [nurseAssign, setNurseAssign] = useState<Assignment[]>([]);
  const [recovery, setRecovery] = useState<RecoveryProgress | null>(null);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [records, setRecords] = useState<Record_[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [flag, setFlag] = useState<string | null>(null);

  // Editable forms, seeded from the loaded record.
  const [idForm, setIdForm] = useState<Partial<Patient>>({});
  const [idBase, setIdBase] = useState<Partial<Patient>>({});
  const [clinForm, setClinForm] = useState<Partial<Admission>>({});
  const [clinBase, setClinBase] = useState<Partial<Admission>>({});

  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedNurse, setSelectedNurse] = useState("");
  const [nurseRole, setNurseRole] = useState("PRIMARY_NURSE");

  const [estimatedDays, setEstimatedDays] = useState("");
  const [currentDay, setCurrentDay] = useState("");
  const [recoveryNotes, setRecoveryNotes] = useState("");
  const [newTask, setNewTask] = useState("");

  const [showVitals, setShowVitals] = useState(false);
  const [vitalsForm, setVitalsForm] = useState(EMPTY_VITALS);
  const [showRecord, setShowRecord] = useState(false);
  const [recordForm, setRecordForm] = useState(EMPTY_RECORD);
  const [recordTarget, setRecordTarget] = useState<Record_ | null>(null);
  const [modalError, setModalError] = useState("");

  const activeAdmission = admissions.find((a) => a.status === "ACTIVE");

  const flash = (k: string) => {
    setFlag(k);
    setTimeout(() => setFlag((f) => (f === k ? null : f)), 2200);
  };

  const loadExtras = useCallback(async (admissionId: string) => {
    const [r, d, n, v, m] = await Promise.all([
      fetch(`/api/recovery-progress?admission_id=${admissionId}`),
      fetch(`/api/patient-doctor-assignments?admission_id=${admissionId}`),
      fetch(`/api/patient-nurse-assignments?admission_id=${admissionId}`),
      fetch(`/api/vitals?admission_id=${admissionId}`),
      fetch(`/api/medical-records?admission_id=${admissionId}`),
    ]);
    if (r.ok) {
      const data = await r.json();
      setRecovery(data);
      if (data) {
        setEstimatedDays(String(data.estimated_total_days ?? ""));
        setCurrentDay(String(data.current_day ?? 1));
        setRecoveryNotes(data.notes ?? "");
      }
    }
    if (d.ok) setDoctorAssign(await d.json());
    if (n.ok) setNurseAssign(await n.json());
    if (v.ok) setVitals(await v.json());
    if (m.ok) setRecords((await m.json()).data);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [p, a, d, n, r] = await Promise.all([
      fetch(`/api/patients/${id}`),
      fetch(`/api/patient-admissions?patient_id=${id}`),
      fetch("/api/doctors"),
      fetch("/api/nurses"),
      fetch("/api/rooms"),
    ]);
    if (p.ok) {
      const data = await p.json();
      setPatient(data);
      const seed = {
        full_name: data.full_name ?? "",
        dob: data.dob ?? "",
        gender: data.gender ?? "",
        contact_number: data.contact_number ?? "",
        emergency_contact: data.emergency_contact ?? "",
        address: data.address ?? "",
        blood_type: data.blood_type ?? "",
        allergies: data.allergies ?? "",
      };
      setIdForm(seed);
      setIdBase(seed);
    }
    let list: Admission[] = [];
    if (a.ok) { list = await a.json(); setAdmissions(list); }
    if (d.ok) setDoctors(await d.json());
    if (n.ok) setNurses(await n.json());
    if (r.ok) setRooms(await r.json());
    setLoading(false);

    const active = list.find((x) => x.status === "ACTIVE");
    if (active) {
      const seed = {
        primary_diagnosis: active.primary_diagnosis ?? "",
        secondary_diagnosis: active.secondary_diagnosis ?? "",
        chief_complaint: active.chief_complaint ?? "",
        care_plan: active.care_plan ?? "",
      };
      setClinForm(seed);
      setClinBase(seed);
      loadExtras(active.id);
    } else {
      setRecovery(null);
      setDoctorAssign([]);
      setNurseAssign([]);
      setVitals([]);
      setRecords([]);
    }
  }, [id, loadExtras]);

  useEffect(() => { if (id) loadAll(); }, [id, loadAll]);

  const idDirty = JSON.stringify(idForm) !== JSON.stringify(idBase);
  const clinDirty = JSON.stringify(clinForm) !== JSON.stringify(clinBase);

  async function saveIdentity() {
    setBusy("identity");
    const res = await fetch(`/api/patients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(idForm),
    });
    setBusy(null);
    if (!res.ok) return alert((await res.json()).error);
    setIdBase(idForm);
    flash("identity");
    router.refresh();
  }

  async function saveClinical() {
    if (!activeAdmission) return;
    setBusy("clinical");
    const res = await fetch(`/api/patient-admissions/${activeAdmission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clinForm),
    });
    setBusy(null);
    if (!res.ok) return alert((await res.json()).error);
    setClinBase(clinForm);
    flash("clinical");
  }

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
    loadAll();
  }

  async function assign(kind: "doctor" | "nurse") {
    if (!activeAdmission) return;
    const url = kind === "doctor" ? "/api/patient-doctor-assignments" : "/api/patient-nurse-assignments";
    const body =
      kind === "doctor"
        ? { admission_id: activeAdmission.id, doctor_id: selectedDoctor }
        : { admission_id: activeAdmission.id, nurse_id: selectedNurse, role: nurseRole };
    setBusy(kind);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    if (!res.ok) return alert((await res.json()).error);
    kind === "doctor" ? setSelectedDoctor("") : setSelectedNurse("");
    loadExtras(activeAdmission.id);
  }

  async function unassign(kind: "doctor" | "nurse", assignmentId: string) {
    if (!activeAdmission) return;
    const url = kind === "doctor" ? "/api/patient-doctor-assignments" : "/api/patient-nurse-assignments";
    await fetch(`${url}/${assignmentId}`, { method: "DELETE" });
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
    setModalError("");
    const res = await fetch("/api/vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admission_id: activeAdmission.id, ...vitalsForm }),
    });
    setBusy(null);
    if (!res.ok) return setModalError((await res.json()).error ?? "Couldn't save");
    setShowVitals(false);
    setVitalsForm(EMPTY_VITALS);
    loadExtras(activeAdmission.id);
  }

  async function saveRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!activeAdmission) return;
    setBusy("record");
    setModalError("");
    const res = recordTarget
      ? await fetch(`/api/medical-records/${recordTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recordForm),
        })
      : await fetch("/api/medical-records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admission_id: activeAdmission.id, ...recordForm }),
        });
    setBusy(null);
    if (!res.ok) return setModalError((await res.json()).error ?? "Couldn't save");
    setShowRecord(false);
    setRecordTarget(null);
    setRecordForm(EMPTY_RECORD);
    loadExtras(activeAdmission.id);
  }

  async function deleteRecord(recordId: string) {
    if (!confirm("Delete this note?") || !activeAdmission) return;
    await fetch(`/api/medical-records/${recordId}`, { method: "DELETE" });
    loadExtras(activeAdmission.id);
  }

  if (loading) return <PageShell><Loading label="Loading records…" /></PageShell>;
  if (!patient)
    return (
      <PageShell>
        <p className="text-sm font-semibold text-red-600">Patient not found.</p>
      </PageShell>
    );

  const latest = vitals[0];
  const st = activeAdmission ? ADMISSION_STATUS[activeAdmission.status] : null;
  const assignedNurseIds = new Set(nurseAssign.map((a) => a.nurses?.id));
  const assignedDoctorIds = new Set(doctorAssign.map((a) => a.doctors?.id));

  return (
    <PageShell>
      <Link
        href="/dashboard/hospital/patients"
        className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-ink-soft transition hover:text-brand-600"
      >
        <ChevronLeft className="h-4 w-4" /> All patients
      </Link>

      {/* Identity header */}
      <div className="card mb-4 flex flex-wrap items-start justify-between gap-5 p-6">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-sm font-extrabold text-brand-700">
            {patient.full_name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">{patient.full_name}</h1>
            <p className="tabular mt-0.5 text-sm text-ink-soft">
              MRN {patient.mrn}
              {patient.blood_type ? ` · Gol. darah ${patient.blood_type}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {st && <span className={cn("chip", st.chip)}>{st.label}</span>}
              {activeAdmission?.rooms?.room_number && (
                <span className="chip bg-canvas text-ink-soft">Room {activeAdmission.rooms.room_number}</span>
              )}
            </div>
          </div>
        </div>

        {activeAdmission && (
          <a href={`/patient/${activeAdmission.id}`} target="_blank" rel="noopener noreferrer" className="btn-primary">
            <MonitorPlay className="h-4 w-4" /> Show patient screen
          </a>
        )}
      </div>

      {/* Allergies are the one thing that must never be buried in a form. */}
      {patient.allergies && (
        <div className="card mb-4 flex items-start gap-3 border-red-200 bg-red-50 p-4">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-extrabold text-red-900">Allergies</p>
            <p className="text-sm text-red-800">{patient.allergies}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* ── Identity, editable in place ── */}
        <Panel title="Patient details">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full name</label>
                <input
                  value={idForm.full_name ?? ""}
                  onChange={(e) => setIdForm({ ...idForm, full_name: e.target.value })}
                  className="field"
                />
              </div>
              <div>
                <label className="label">Date of birth</label>
                <input
                  type="date"
                  value={idForm.dob ?? ""}
                  onChange={(e) => setIdForm({ ...idForm, dob: e.target.value })}
                  className="field"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Gender</label>
                <select
                  value={idForm.gender ?? ""}
                  onChange={(e) => setIdForm({ ...idForm, gender: e.target.value })}
                  className="field"
                >
                  <option value="">Choose…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="label">Blood type</label>
                <select
                  value={idForm.blood_type ?? ""}
                  onChange={(e) => setIdForm({ ...idForm, blood_type: e.target.value })}
                  className="field"
                >
                  <option value="">Unknown</option>
                  {BLOOD_TYPES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Contact number</label>
                <input
                  value={idForm.contact_number ?? ""}
                  onChange={(e) => setIdForm({ ...idForm, contact_number: e.target.value })}
                  className="field"
                />
              </div>
              <div>
                <label className="label">Emergency contact</label>
                <input
                  value={idForm.emergency_contact ?? ""}
                  onChange={(e) => setIdForm({ ...idForm, emergency_contact: e.target.value })}
                  className="field"
                />
              </div>
            </div>

            <div>
              <label className="label">Address</label>
              <input
                value={idForm.address ?? ""}
                onChange={(e) => setIdForm({ ...idForm, address: e.target.value })}
                className="field"
              />
            </div>

            <div>
              <label className="label">Allergies</label>
              <textarea
                rows={2}
                value={idForm.allergies ?? ""}
                onChange={(e) => setIdForm({ ...idForm, allergies: e.target.value })}
                className="field resize-none"
                placeholder="e.g. penicillin, seafood — leave empty if none"
              />
            </div>
          </div>

          <SaveBar
            dirty={idDirty}
            saving={busy === "identity"}
            saved={flag === "identity"}
            onSave={saveIdentity}
            onReset={() => setIdForm(idBase)}
          />
        </Panel>

        {/* ── Admission + room ── */}
        <Panel title="Admissions and rooms">
          {activeAdmission ? (
            <div className="space-y-4">
              <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-canvas p-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-ink-mute">Rooms</dt>
                  <dd className="mt-0.5 font-extrabold text-ink">
                    {activeAdmission.rooms?.room_number ?? "Not set"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-ink-mute">Ward</dt>
                  <dd className="mt-0.5 font-extrabold text-ink">{activeAdmission.rooms?.ward_name ?? "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs font-semibold text-ink-mute">Admitted since</dt>
                  <dd className="tabular mt-0.5 font-extrabold text-ink">
                    {new Date(activeAdmission.admission_date).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </dd>
                </div>
              </dl>

              <div>
                <label className="label">Move room</label>
                <div className="flex gap-2">
                  <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="field">
                    <option value="">Choose destination room…</option>
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
                {rooms.length === 0 && (
                  <p className="mt-1.5 text-xs text-ink-mute">
                    Belum ada kamar.{" "}
                    <Link href="/dashboard/hospital/rooms" className="row-link">
                      Add a room first
                    </Link>
                    .
                  </p>
                )}
              </div>

              <div className="border-t border-line pt-4">
                <p className="label">End admission</p>
                <div className="flex flex-wrap gap-2">
                  {(["DISCHARGED", "TRANSFERRED", "DECEASED"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        confirm(`Mark this patient as ${ADMISSION_STATUS[s].label}?`) &&
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
                This patient isn’t admitted yet. The Medly screen opens once they have an active admission.
              </p>
              <div className="flex gap-2">
                <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="field">
                  <option value="">Choose a room (optional)…</option>
                  {rooms
                    .filter((r) => r.status !== "MAINTENANCE")
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.room_number} — {r.ward_name}
                      </option>
                    ))}
                </select>
                <button onClick={admit} disabled={busy === "admit"} className="btn-primary shrink-0">
                  {busy === "admit" ? "Working…" : "Admit"}
                </button>
              </div>
            </div>
          )}
        </Panel>

        {/* ── Clinical record of this stay ── */}
        <Panel title="Medical records — this stay">
          {!activeAdmission ? (
            <p className="text-sm text-ink-mute">Available once the patient is admitted.</p>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="label">Chief complaint</label>
                  <textarea
                    rows={2}
                    value={clinForm.chief_complaint ?? ""}
                    onChange={(e) => setClinForm({ ...clinForm, chief_complaint: e.target.value })}
                    className="field resize-none"
                    placeholder="What the patient reported on admission"
                  />
                </div>
                <div>
                  <label className="label">Primary diagnosis</label>
                  <input
                    value={clinForm.primary_diagnosis ?? ""}
                    onChange={(e) => setClinForm({ ...clinForm, primary_diagnosis: e.target.value })}
                    className="field"
                    placeholder="mis. Demam Berdarah Dengue"
                  />
                  <p className="mt-1.5 text-xs text-ink-mute">Shown on patient tablets.</p>
                </div>
                <div>
                  <label className="label">Secondary diagnosis</label>
                  <textarea
                    rows={2}
                    value={clinForm.secondary_diagnosis ?? ""}
                    onChange={(e) => setClinForm({ ...clinForm, secondary_diagnosis: e.target.value })}
                    className="field resize-none"
                    placeholder="Comorbidity or secondary diagnosis"
                  />
                </div>
                <div>
                  <label className="label">Care plan</label>
                  <textarea
                    rows={2}
                    value={clinForm.care_plan ?? ""}
                    onChange={(e) => setClinForm({ ...clinForm, care_plan: e.target.value })}
                    className="field resize-none"
                  />
                </div>
              </div>
              <SaveBar
                dirty={clinDirty}
                saving={busy === "clinical"}
                saved={flag === "clinical"}
                onSave={saveClinical}
                onReset={() => setClinForm(clinBase)}
              />
            </>
          )}
        </Panel>

        {/* ── Care team ── */}
        <Panel title="Care team">
          {!activeAdmission ? (
            <p className="text-sm text-ink-mute">Available once the patient is admitted.</p>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="label">Doctors</p>
                {doctorAssign.length === 0 ? (
                  <p className="mb-2 rounded-xl border border-dashed border-line px-3 py-4 text-center text-xs text-ink-mute">
                    No doctor assigned yet.
                  </p>
                ) : (
                  <ul className="mb-2 space-y-1.5">
                    {doctorAssign.map((a) => (
                      <li key={a.id} className="group flex items-center gap-3 rounded-xl border border-line px-3 py-2">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-[10px] font-extrabold text-brand-700">
                          {(a.doctors?.full_name ?? "?").replace(/^dr\.?\s*/i, "").slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-ink">{a.doctors?.full_name}</span>
                          <span className="block truncate text-xs text-ink-mute">
                            {a.doctors?.specialization ?? "Umum"} · {a.role === "MAIN_DOCTOR" ? "DPJP" : "Konsulen"}
                          </span>
                        </span>
                        <button
                          onClick={() => unassign("doctor", a.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-ink-mute opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} className="field">
                    <option value="">Assign a doctor…</option>
                    {doctors.filter((d) => !assignedDoctorIds.has(d.id)).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name}{d.specialization ? ` — ${d.specialization}` : ""}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => assign("doctor")} disabled={!selectedDoctor || busy === "doctor"} className="btn-ghost shrink-0">
                    <UserPlus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="border-t border-line pt-4">
                <p className="label">Nurses</p>
                {nurseAssign.length === 0 ? (
                  <p className="mb-2 rounded-xl border border-dashed border-line px-3 py-4 text-center text-xs text-ink-mute">
                    No primary nurse assigned yet.
                  </p>
                ) : (
                  <ul className="mb-2 space-y-1.5">
                    {nurseAssign.map((a) => (
                      <li key={a.id} className="group flex items-center gap-3 rounded-xl border border-line px-3 py-2">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-50 text-[10px] font-extrabold text-sky-700">
                          {(a.nurses?.full_name ?? "?").replace(/^ns\.?\s*/i, "").slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-ink">{a.nurses?.full_name}</span>
                          <span className="block truncate text-xs text-ink-mute">
                            {NURSE_ASSIGNMENT_ROLES[a.role]?.label ?? a.role}
                          </span>
                        </span>
                        <button
                          onClick={() => unassign("nurse", a.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-ink-mute opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <select value={selectedNurse} onChange={(e) => setSelectedNurse(e.target.value)} className="field">
                    <option value="">Assign a nurse…</option>
                    {nurses.filter((n) => !assignedNurseIds.has(n.id)).map((n) => (
                      <option key={n.id} value={n.id}>{n.full_name}</option>
                    ))}
                  </select>
                  <select value={nurseRole} onChange={(e) => setNurseRole(e.target.value)} className="field w-40 shrink-0">
                    {Object.entries(NURSE_ASSIGNMENT_ROLES).map(([k, r]) => (
                      <option key={k} value={k}>{r.label}</option>
                    ))}
                  </select>
                  <button onClick={() => assign("nurse")} disabled={!selectedNurse || busy === "nurse"} className="btn-ghost shrink-0">
                    <UserPlus className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-mute">
                  This assignment records accountability. Patient calls still go to the whole ward queue, so nothing is stuck behind one nurse’s shift.
                </p>
                {nurses.length === 0 && (
                  <p className="mt-1.5 text-xs text-ink-mute">
                    Belum ada perawat.{" "}
                    <Link href="/dashboard/hospital/nurses" className="row-link">Add nurse</Link>.
                  </p>
                )}
              </div>
            </div>
          )}
        </Panel>

        {/* ── Vitals ── */}
        <Panel
          title="Vital sign"
          action={
            activeAdmission && (
              <button onClick={() => { setModalError(""); setShowVitals(true); }} className="btn-ghost px-3 py-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Catat
              </button>
            )
          }
        >
          {!activeAdmission ? (
            <p className="text-sm text-ink-mute">Available once the patient is admitted.</p>
          ) : !latest ? (
            <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-mute">
              No measurements yet. Whatever you record here appears on the patient’s tablet.
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
                Terakhir {new Date(latest.measured_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                {vitals.length > 1 ? ` · ${vitals.length} catatan` : ""}
              </p>
            </div>
          )}
        </Panel>

        {/* ── Recovery ── */}
        <Panel title="Recovery progress">
          {!activeAdmission ? (
            <p className="text-sm text-ink-mute">Available once the patient is admitted.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-[80px_110px_1fr] gap-3">
                <div>
                  <label className="label">Day </label>
                  <input type="number" min={1} value={currentDay} onChange={(e) => setCurrentDay(e.target.value)} className="field" />
                </div>
                <div>
                  <label className="label">Estimate</label>
                  <input type="number" min={1} value={estimatedDays} onChange={(e) => setEstimatedDays(e.target.value)} className="field" placeholder="days" />
                </div>
                <div>
                  <label className="label">Note for the patient</label>
                  <input value={recoveryNotes} onChange={(e) => setRecoveryNotes(e.target.value)} className="field" placeholder="mis. Kondisi membaik" />
                </div>
              </div>

              <button onClick={saveRecovery} disabled={busy === "recovery"} className="btn-primary w-full">
                {flag === "recovery" ? (<><Check className="h-4 w-4" /> Tersimpan</>) : recovery ? "Perbarui progres" : "Start recovery tracking"}
              </button>

              {recovery && (
                <div className="border-t border-line pt-4">
                  <p className="label">Activity goals</p>
                  <ul className="mb-3 space-y-1.5">
                    {(recovery.recovery_checklist_items ?? []).map((item) => (
                      <li key={item.id}>
                        <button onClick={() => toggleTask(item)} className="group flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-canvas">
                          <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition", item.is_done ? "border-brand-500 bg-brand-500 text-white" : "border-line group-hover:border-brand-300")}>
                            <Check className={cn("h-3 w-3 transition-transform", item.is_done ? "scale-100" : "scale-0")} strokeWidth={3.5} />
                          </span>
                          <span className={cn("text-sm font-semibold", item.is_done ? "text-ink-mute line-through" : "text-ink")}>{item.title}</span>
                        </button>
                      </li>
                    ))}
                    {(recovery.recovery_checklist_items ?? []).length === 0 && (
                      <li className="px-2 text-sm text-ink-mute">No goals yet.</li>
                    )}
                  </ul>
                  <div className="flex gap-2">
                    <input
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTask())}
                      className="field"
                      placeholder="Add an activity goal…"
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

      {/* ── Clinical notes timeline ── */}
      <Panel
        title="Clinical notes"
        className="mt-4"
        action={
          activeAdmission && (
            <button
              onClick={() => { setRecordTarget(null); setRecordForm(EMPTY_RECORD); setModalError(""); setShowRecord(true); }}
              className="btn-ghost px-3 py-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add note
            </button>
          )
        }
      >
        {!activeAdmission ? (
          <p className="text-sm text-ink-mute">Available once the patient is admitted.</p>
        ) : records.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-mute">
            No clinical notes for this stay yet.
          </p>
        ) : (
          <ol className="relative space-y-4 border-l border-line pl-5">
            {records.map((r) => {
              const t = MEDICAL_RECORD_TYPES[r.record_type] ?? MEDICAL_RECORD_TYPES.OTHER;
              return (
                <li key={r.id} className="group relative">
                  <span className={cn("absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white", t.tone.strong)} />
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("chip", t.tone.soft)}>{t.label}</span>
                        <span className="tabular text-xs font-semibold text-ink-mute">
                          {new Date(r.recorded_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                        {r.author_name && <span className="text-xs text-ink-mute">· {r.author_name}</span>}
                      </div>
                      <p className="mt-1 text-[15px] font-extrabold text-ink">{r.title}</p>
                      {r.content && <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{r.content}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setRecordTarget(r);
                          setRecordForm({ record_type: r.record_type, title: r.title, content: r.content ?? "" });
                          setModalError("");
                          setShowRecord(true);
                        }}
                        className="grid h-7 w-7 place-items-center rounded-lg text-ink-mute transition hover:bg-canvas hover:text-ink"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteRecord(r.id)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-ink-mute transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>

      {/* ── Modals ── */}
      <Modal open={showVitals} onClose={() => setShowVitals(false)} title="Record vitals" description="Leave blank anything you didn't measure.">
        <FormError>{modalError}</FormError>
        <form onSubmit={saveVitals} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { k: "blood_pressure_systolic", l: "Sistolik (mmHg)", p: "120" },
              { k: "blood_pressure_diastolic", l: "Diastolik (mmHg)", p: "80" },
              { k: "heart_rate", l: "Nadi (bpm)", p: "80" },
              { k: "temperature_celsius", l: "Suhu (°C)", p: "36.8", step: "0.1" },
              { k: "respiratory_rate", l: "Resp. rate (/min)", p: "18" },
              { k: "oxygen_saturation", l: "SpO₂ (%)", p: "98" },
            ].map((f) => (
              <div key={f.k}>
                <label className="label">{f.l}</label>
                <input
                  type="number"
                  step={f.step}
                  value={(vitalsForm as any)[f.k]}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, [f.k]: e.target.value })}
                  className="field"
                  placeholder={f.p}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowVitals(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={busy === "vitals"} className="btn-primary">
              <Activity className="h-4 w-4" /> {busy === "vitals" ? "Menyimpan…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showRecord}
        onClose={() => setShowRecord(false)}
        title={recordTarget ? "Edit clinical note" : "Add clinical note"}
        width="max-w-lg"
      >
        <FormError>{modalError}</FormError>
        <form onSubmit={saveRecord} className="space-y-4">
          <div>
            <span className="label">Note type</span>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(MEDICAL_RECORD_TYPES).map(([k, t]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setRecordForm({ ...recordForm, record_type: k })}
                  aria-pressed={recordForm.record_type === k}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-[11px] font-bold transition active:scale-[0.97]",
                    recordForm.record_type === k
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-line bg-white text-ink-soft hover:border-brand-200 hover:bg-brand-50"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Title</label>
            <input
              required
              value={recordForm.title}
              onChange={(e) => setRecordForm({ ...recordForm, title: e.target.value })}
              className="field"
              placeholder="e.g. Morning round — condition improving"
            />
          </div>
          <div>
            <label className="label">Note body</label>
            <textarea
              rows={6}
              value={recordForm.content}
              onChange={(e) => setRecordForm({ ...recordForm, content: e.target.value })}
              className="field resize-none"
              placeholder="Findings, actions and what comes next…"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2.5">
            <FileText className="h-4 w-4 shrink-0 text-ink-mute" />
            <p className="text-xs text-ink-mute">
              These notes are internal — they never appear on the patient’s tablet.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowRecord(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={busy === "record"} className="btn-primary">
              {busy === "record" ? "Menyimpan…" : "Save note"}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
