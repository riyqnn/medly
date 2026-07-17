/**
 * Domain vocabulary in one place: the database speaks SCREAMING_SNAKE, every
 * screen speaks Indonesian, and the schedule grid needs a stable hue per
 * category. Keeping all three together stops the labels drifting apart
 * between the hospital dashboard and the patient's tablet.
 *
 * Green stays reserved for the brand and for "this went well" states; the
 * other hues exist only to tell schedule blocks apart at a glance.
 */

export type Tone = {
  /** Filled block: soft background + readable text. */
  soft: string;
  /** The saturated edge/dot that identifies the category. */
  strong: string;
};

export const TREATMENT_CATEGORIES: Record<string, { label: string; tone: Tone }> = {
  DOCTOR_VISIT: {
    label: "Visit Dokter",
    tone: { soft: "bg-brand-50 text-brand-800", strong: "bg-brand-500" },
  },
  MEDICATION: {
    label: "Pemberian Obat",
    tone: { soft: "bg-amber-50 text-amber-800", strong: "bg-amber-500" },
  },
  LAB: {
    label: "Laboratorium",
    tone: { soft: "bg-violet-50 text-violet-800", strong: "bg-violet-500" },
  },
  RADIOLOGY: {
    label: "Radiologi",
    tone: { soft: "bg-sky-50 text-sky-800", strong: "bg-sky-500" },
  },
  PHYSIO: {
    label: "Fisioterapi",
    tone: { soft: "bg-rose-50 text-rose-800", strong: "bg-rose-500" },
  },
  PROCEDURE: {
    label: "Tindakan",
    tone: { soft: "bg-indigo-50 text-indigo-800", strong: "bg-indigo-500" },
  },
  CONTROL: {
    label: "Kontrol",
    tone: { soft: "bg-teal-50 text-teal-800", strong: "bg-teal-500" },
  },
};

export const TREATMENT_STATUS: Record<string, { label: string; chip: string }> = {
  SCHEDULED: { label: "Terjadwal", chip: "bg-brand-50 text-brand-700" },
  DONE: { label: "Selesai", chip: "bg-brand-500 text-white" },
  CANCELLED: { label: "Dibatalkan", chip: "bg-canvas text-ink-mute" },
  RESCHEDULED: { label: "Dijadwal ulang", chip: "bg-amber-50 text-amber-700" },
};

export const NURSE_REQUEST_CATEGORIES: Record<string, { label: string }> = {
  CALL_NURSE: { label: "Panggil Perawat" },
  PAIN: { label: "Nyeri" },
  IV_DRIP: { label: "Infus Habis" },
  BATHROOM: { label: "Bantuan ke Kamar Mandi" },
  DRINKING_WATER: { label: "Air Minum" },
  EXTRA_BLANKET: { label: "Selimut Tambahan" },
  OTHER: { label: "Bantuan Lainnya" },
};

export const NURSE_REQUEST_STATUS: Record<string, { label: string; chip: string }> = {
  PENDING: { label: "Menunggu", chip: "bg-amber-50 text-amber-700" },
  IN_PROGRESS: { label: "Ditangani", chip: "bg-sky-50 text-sky-700" },
  RESOLVED: { label: "Selesai", chip: "bg-brand-50 text-brand-700" },
};

export const PRIORITY: Record<string, { label: string; chip: string; dot: string }> = {
  HIGH: { label: "Prioritas tinggi", chip: "bg-red-50 text-red-700", dot: "bg-red-500" },
  MEDIUM: { label: "Prioritas sedang", chip: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  LOW: { label: "Prioritas rendah", chip: "bg-canvas text-ink-soft", dot: "bg-ink-mute" },
};

export const MEAL_SCHEDULES: { value: string; label: string }[] = [
  { value: "BREAKFAST", label: "Sarapan" },
  { value: "LUNCH", label: "Makan Siang" },
  { value: "DINNER", label: "Makan Malam" },
];

export const MEAL_ORDER_STATUS: Record<string, { label: string; chip: string }> = {
  PENDING: { label: "Menunggu", chip: "bg-amber-50 text-amber-700" },
  PREPARING: { label: "Disiapkan", chip: "bg-sky-50 text-sky-700" },
  DELIVERED: { label: "Terkirim", chip: "bg-brand-50 text-brand-700" },
  REJECTED: { label: "Ditolak", chip: "bg-red-50 text-red-700" },
};

export const ADMISSION_STATUS: Record<string, { label: string; chip: string }> = {
  ACTIVE: { label: "Dirawat", chip: "bg-brand-50 text-brand-700" },
  DISCHARGED: { label: "Pulang", chip: "bg-canvas text-ink-soft" },
  TRANSFERRED: { label: "Dipindahkan", chip: "bg-amber-50 text-amber-700" },
  DECEASED: { label: "Meninggal", chip: "bg-canvas text-ink-mute" },
};

export const MEDICAL_RECORD_TYPES: Record<string, { label: string; tone: Tone }> = {
  ANAMNESIS: { label: "Anamnesis", tone: { soft: "bg-sky-50 text-sky-800", strong: "bg-sky-500" } },
  EXAMINATION: { label: "Pemeriksaan", tone: { soft: "bg-violet-50 text-violet-800", strong: "bg-violet-500" } },
  DIAGNOSIS: { label: "Diagnosa", tone: { soft: "bg-brand-50 text-brand-800", strong: "bg-brand-500" } },
  PROGRESS: { label: "Perkembangan", tone: { soft: "bg-teal-50 text-teal-800", strong: "bg-teal-500" } },
  ACTION: { label: "Tindakan", tone: { soft: "bg-amber-50 text-amber-800", strong: "bg-amber-500" } },
  OTHER: { label: "Lainnya", tone: { soft: "bg-canvas text-ink-soft", strong: "bg-ink-mute" } },
};

export const NURSE_ASSIGNMENT_ROLES: Record<string, { label: string }> = {
  PRIMARY_NURSE: { label: "Perawat penanggung jawab" },
  ASSOCIATE_NURSE: { label: "Perawat pendamping" },
};

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const EDUCATION_TYPES: Record<string, { label: string }> = {
  ARTICLE: { label: "Artikel" },
  VIDEO: { label: "Video" },
  PDF: { label: "PDF" },
  INFOGRAPHIC: { label: "Infografik" },
};

export const ENTERTAINMENT_CATEGORIES: Record<string, { label: string }> = {
  MOVIE: { label: "Film" },
  TV: { label: "TV" },
  MUSIC: { label: "Musik" },
  PODCAST: { label: "Podcast" },
  EBOOK: { label: "Buku Digital" },
  MAGAZINE: { label: "Majalah" },
  GAME_LINK: { label: "Game" },
  RELAXATION_VIDEO: { label: "Video Relaksasi" },
  BANNER: { label: "Banner" },
};

export const SPIRITUAL_CATEGORIES: Record<string, { label: string }> = {
  PRAYER_TIME: { label: "Jadwal Sholat" },
  MUROTTAL: { label: "Murottal" },
  DAILY_PRAYER: { label: "Doa Harian" },
  REFLECTION: { label: "Renungan" },
  OTHER: { label: "Lainnya" },
};

export const formatRupiah = (value: number | string | null | undefined) =>
  `Rp ${Number(value ?? 0).toLocaleString("id-ID")}`;

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
